import { getSupastashConfig } from "../../../core/config";
import {
  RECEIVED_DATA_COMPLETED_MAP,
  RECEIVED_DATA_THRESHOLD,
} from "../../../store/syncStatus";
import { PayloadData } from "../../../types/query.types";
import { SupastashFilter } from "../../../types/realtimeData.types";
import { ReceivedDataCompleted } from "../../../types/syncEngine.types";
import log from "../../logs";
import { ReusedHelpers } from "../../reusedHelpers";
import { supabaseClientErr } from "../../supabaseClientErr";

const RANDOM_OLD_DATE = "2000-01-01T00:00:00Z";
const PAGE_SIZE = RECEIVED_DATA_THRESHOLD;
const MAX_PAGE_SIZE = 2000;
const timesPulled = new Map<string, number>();
const lastPulled = new Map<string, number>();
const DEFAULT_MAX_PULL_ATTEMPTS = 150;
const DEFAULT_PK = "00000000-0000-0000-0000-000000000000";

export async function pageThrough(base: {
  tsCol: "arrived_at" | "updated_at";
  since: string;
  table: string;
  select?: string;
  filters?: SupastashFilter[];
  includeDeleted?: boolean;
  batchId: string;
  previousPk?: string | null;
}) {
  const supabase = getSupastashConfig().supabaseClient;
  if (!supabase)
    throw new Error(`No supabase client found: ${supabaseClientErr}`);

  const results: PayloadData[] = [];
  const lastWork = getReceivedDataCompleted({
    batchId: base.batchId,
    col: base.tsCol,
  });
  if (lastWork.completed) return results;
  let cursorTs = lastWork.lastTimestamp || base.since || RANDOM_OLD_DATE;
  let cursorId = base.previousPk ?? lastWork.lastId;

  let lastDataSize = 0;
  const { table, filters = [], select = "*" } = base;
  const maxSyncLookBack = getMaxSyncLookBack({ table });

  while (true) {
    const ts =
      maxSyncLookBack && Date.parse(cursorTs) < Date.parse(maxSyncLookBack)
        ? maxSyncLookBack
        : cursorTs;
    let q = supabase
      .from(table)
      .select(select)
      .order(base.tsCol, { ascending: true })
      .order("id", { ascending: true })
      .limit(PAGE_SIZE);

    if (cursorId) {
      q = q.or(
        `${base.tsCol}.gt.${ts},and(${base.tsCol}.eq.${ts},id.gt.${cursorId})`
      );
    } else {
      q = q.gte(base.tsCol, ts);
    }

    if (filters && filters.length > 0) {
      q = ReusedHelpers.applyFilters(q, filters, table);
    }

    const { data, error } = await q;
    if (error) throw error;
    if (!data || data.length === 0) break;

    results.push(...data);
    const last = data[data.length - 1]! as any;
    cursorTs = last[base.tsCol];
    cursorId = last.id;
    lastDataSize += data.length;

    if (data.length < PAGE_SIZE) {
      setReceivedDataCompleted({
        batchId: base.batchId,
        col: base.tsCol,
        completed: {
          completed: true,
          lastTimestamp: cursorTs,
          lastId: cursorId,
        },
      });
      break;
    }

    setReceivedDataCompleted({
      batchId: base.batchId,
      col: base.tsCol,
      completed: {
        completed: false,
        lastTimestamp: cursorTs,
        lastId: cursorId,
      },
    });
    if (lastDataSize >= MAX_PAGE_SIZE) {
      break;
    }
    await new Promise((res) => setTimeout(res, 0));
  }
  return results;
}

export function returnMaxDate({
  row,
  prevMax,
  col,
}: {
  row: PayloadData;
  prevMax: { value: string; pk: string | null } | null;
  col: "arrived_at" | "updated_at" | "deleted_at";
}): { value: string; pk: string | null } | null {
  const v = row[col];
  const pk = row.id;

  if (!pk) throw new Error("Row without id");
  if (!v) return prevMax;

  if (!prevMax) {
    return { value: v, pk };
  }

  if (v > prevMax.value) {
    return { value: v, pk };
  }

  if (v === prevMax.value && pk > (prevMax.pk ?? pk)) {
    return { value: v, pk };
  }

  return prevMax;
}

export function getMaxDate(
  rows: PayloadData[],
  col: "arrived_at" | "updated_at"
): string | null {
  if (!rows?.length) return null;
  let max = RANDOM_OLD_DATE;
  for (const r of rows) {
    const v = r[col];
    if (typeof v === "string" && !isNaN(Date.parse(v))) {
      if (Date.parse(v) > Date.parse(max)) max = new Date(v).toISOString();
    }
  }
  return max === RANDOM_OLD_DATE ? null : max;
}

export function logNoUpdates(table: string) {
  const pulled = timesPulled.get(table) || 0;
  const last = lastPulled.get(table) || 0;
  timesPulled.set(table, pulled + 1);
  if (pulled >= DEFAULT_MAX_PULL_ATTEMPTS) {
    const timeSinceLastPull = Date.now() - last;
    lastPulled.set(table, Date.now());
    log(
      `[Supastash] No updates for ${table} from ${last} (times pulled: ${pulled}) in the last ${
        timeSinceLastPull / 1000
      }s`
    );
    timesPulled.set(table, 0);
  }
}

export function getReceivedDataCompleted({
  batchId,
  col,
}: {
  batchId: string;
  col: "arrived_at" | "updated_at";
}): ReceivedDataCompleted {
  if (!batchId || !RECEIVED_DATA_COMPLETED_MAP[batchId]) {
    throw new Error(`Batch ${batchId} not found`);
  }
  const completed = RECEIVED_DATA_COMPLETED_MAP[batchId][col] || {
    completed: false,
    lastTimestamp: undefined,
    lastId: undefined,
  };
  return completed;
}

export function setReceivedDataCompleted({
  batchId,
  col,
  completed,
}: {
  batchId: string;
  col: "arrived_at" | "updated_at";
  completed: ReceivedDataCompleted;
}) {
  if (!batchId || !RECEIVED_DATA_COMPLETED_MAP[batchId]) {
    throw new Error(`Batch ${batchId} not found`);
  }
  RECEIVED_DATA_COMPLETED_MAP[batchId][col] = completed;
}

export function deleteReceivedDataCompleted(batchId: string) {
  delete RECEIVED_DATA_COMPLETED_MAP[batchId];
}

export function getMaxSyncLookBack({
  table,
}: {
  table: string;
}): string | undefined {
  const cfg = getSupastashConfig();

  if (cfg.fullSyncTables?.includes(table)) {
    return undefined;
  }

  const perTable = cfg.perTableSyncLookbackDays?.[table];

  const days = perTable !== undefined ? perTable : cfg.maxSyncLookbackDays;

  if (days === undefined) return undefined;

  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}
