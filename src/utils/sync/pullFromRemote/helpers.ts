import { getSupastashConfig } from "../../../core/config";
import { PayloadData } from "../../../types/query.types";
import { RealtimeFilter } from "../../../types/realtimeData.types";
import log from "../../logs";
import { supabaseClientErr } from "../../supabaseClientErr";
import isValidFilter from "./validateFilters";

const RANDOM_OLD_DATE = "2000-01-01T00:00:00Z";
const PAGE_SIZE = 1000;
const timesPulled = new Map<string, number>();
const lastPulled = new Map<string, number>();
const DEFAULT_MAX_PULL_ATTEMPTS = 150;

function applyFilters(q: any, filters: RealtimeFilter[], table: string) {
  for (const f of filters) {
    if (!isValidFilter([f])) {
      throw new Error(`Invalid syncFilter: ${JSON.stringify(f)} for ${table}`);
    }
    q = (q as any)[f.operator](f.column, f.value);
  }
  return q;
}

export async function pageThrough(base: {
  tsCol: "created_at" | "updated_at" | "deleted_at";
  since: string;
  table: string;
  select?: string;
  filters?: RealtimeFilter[];
  includeDeleted?: boolean;
}) {
  const supabase = getSupastashConfig().supabaseClient;
  if (!supabase)
    throw new Error(`No supabase client found: ${supabaseClientErr}`);

  const results: PayloadData[] = [];
  let cursorTs = base.since || RANDOM_OLD_DATE;
  let cursorId = "";
  const { table, filters = [], select = "*" } = base;

  while (true) {
    let q = supabase
      .from(table)
      .select(select)
      .order(base.tsCol, { ascending: true })
      .order("id", { ascending: true })
      .limit(PAGE_SIZE);

    if (cursorId) {
      q = q.or(
        `${base.tsCol}.gt.${cursorTs},and(${base.tsCol}.eq.${cursorTs},id.gt.${cursorId})`
      );
    } else {
      q = q.gte(base.tsCol, cursorTs);
    }
    if (!base.includeDeleted) q = (q as any).is("deleted_at", null);
    if (filters) {
      q = applyFilters(q, filters, table);
    }

    const { data, error } = await q;
    if (error) throw error;
    if (!data || data.length === 0) break;

    results.push(...data);

    if (data.length < PAGE_SIZE) break;

    const last = data[data.length - 1]! as any;
    cursorTs = last[base.tsCol];
    cursorId = last.id;
  }
  return results;
}

export function getMaxDate(
  rows: PayloadData[],
  col: "created_at" | "updated_at" | "deleted_at"
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
