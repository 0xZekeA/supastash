import { getSupastashConfig } from "../../../../shared/core/config";
import { getSupastashDb } from "../../../../shared/db/dbInitializer";
import { rpcTableFilters } from "../../../../shared/store/rpcTableFilters";
import { tableFilters } from "../../../../shared/store/tableFilters";
import {
  RpcFilterNode,
  RpcTableFilters,
} from "../../../../shared/types/rpcFilter.types";
import log, { logError, logWarn } from "../../../../shared/utils/logs";
import { refreshScreen } from "../../../../shared/utils/refreshScreenCalls";
import { supabaseClientErr } from "../../../../shared/utils/supabaseClientErr";
import { getAllTables } from "../../../../shared/utils/sync/getAllTables";
import {
  getMaxSyncLookBack,
  logNoUpdates,
  returnMaxDate,
} from "../../../../shared/utils/sync/pullFromRemote/helpers";
import { postgrestFiltersToRpc } from "../../../../shared/utils/sync/pullFromRemote/postgrestToRpc";
import { SyncInfoUpdater } from "../../../../shared/utils/sync/queryStatus";
import { prefetchRemoteTableSchemas } from "../../../../shared/utils/sync/status/remoteSchema";
import { selectSyncStatus } from "../status/repo";
import { setSupastashSyncStatus } from "../status/services";
import { upsertChunkData } from "./updateLocalDb";

const CHUNK_SIZE = 999;

function buildCursorFilter(
  tsCol: string,
  lastSyncedAt: string,
  lastPk: string | null,
): RpcFilterNode {
  if (lastPk) {
    return {
      or: [
        { col: tsCol, op: "gt", val: lastSyncedAt },
        {
          and: [
            { col: tsCol, op: "eq", val: lastSyncedAt },
            { col: "id", op: "gt", val: lastPk },
          ],
        },
      ],
    };
  }
  return { col: tsCol, op: "gte", val: lastSyncedAt };
}

/**
 * Batch pull: fetches all tables in a single RPC call per round,
 * looping until `remaining_tables` is empty.
 *
 * Requires `useBatchPullSync: true` in config and the
 * `supastash_pull_sync` Postgres function to be deployed.
 */
export async function pullFromRemoteBatch(
  specificTables?: string[],
): Promise<void> {
  const cfg = getSupastashConfig();
  const supabase = cfg.supabaseClient;
  if (!supabase)
    throw new Error(`No supabase client found: ${supabaseClientErr}`);
  if (cfg.supastashMode === "ghost") return;

  const tables = specificTables ?? (await getAllTables());
  if (!tables) {
    log("[Supastash] Batch pull: no tables found");
    return;
  }

  const excludeTables = cfg.excludeTables?.pull ?? [];
  const tablesToPull = tables.filter((t) => !excludeTables.includes(t));
  if (!tablesToPull.length) return;

  const tsCol =
    cfg.replicationMode === "server-side" ? "arrived_at" : "updated_at";
  const db = await getSupastashDb();
  const completedTables = new Set<string>();

  SyncInfoUpdater.setInProgress({ action: "start", type: "pull" });
  SyncInfoUpdater.setNumberOfTables({
    amount: tablesToPull.length,
    type: "pull",
  });

  // Warm schema cache for all tables in one call if enabled
  if (cfg.useBatchSchemaFetch) {
    await prefetchRemoteTableSchemas(tablesToPull);
  }

  let remainingTables = tablesToPull;

  try {
    while (remainingTables.length > 0) {
      // ── Build per-table filters: base filters + cursor ──────────────────
      const p_filters: RpcTableFilters = {};

      for (const table of remainingTables) {
        const syncStatus = await selectSyncStatus(
          db,
          table,
          tableFilters.get(table) ?? [],
        );

        // Mirror pageThrough: cap the cursor to maxSyncLookbackDays so a
        // first-time sync doesn't try to pull decades of data.
        // fullSyncTables bypass the cap (getMaxSyncLookBack returns undefined).
        const maxLookBack = getMaxSyncLookBack({ table });
        const effectiveSince =
          maxLookBack &&
          Date.parse(syncStatus.last_synced_at) < Date.parse(maxLookBack)
            ? maxLookBack
            : syncStatus.last_synced_at;

        const cursorFilter = buildCursorFilter(
          tsCol,
          effectiveSince,
          syncStatus.last_synced_at_pk,
        );
        // Merge explicit RPC filters + PostgREST filters auto-converted at query time
        const rpcBase = rpcTableFilters.get(table) ?? [];
        const converted = postgrestFiltersToRpc(tableFilters.get(table));
        const baseFilters: RpcFilterNode[] = [...rpcBase, ...converted];
        p_filters[table] = [...baseFilters, cursorFilter];
      }

      // ── Single RPC call ─────────────────────────────────────────────────
      const { data, error } = await supabase.rpc("supastash_pull_sync", {
        p_tables: remainingTables,
        p_filters,
        p_ts_col: tsCol,
      });

      if (error) throw error;

      const result = data as {
        tables: Record<string, any[]>;
        remaining_tables: string[];
      };

      const nextRemaining: string[] = result.remaining_tables ?? [];

      // ── Process each table ──────────────────────────────────────────────
      for (const [table, rows] of Object.entries(result.tables ?? {})) {
        SyncInfoUpdater.markLogStart({ type: "pull", table });

        try {
          if (!rows?.length) {
            logNoUpdates(table);
            SyncInfoUpdater.markLogSuccess({ type: "pull", table });
            continue;
          }

          const toDelete: string[] = [];
          const toUpsert: any[] = [];
          let prevMaxSyncedAt: { value: string; pk: string | null } | null =
            null;
          let prevMaxDeletedAt: { value: string; pk: string | null } | null =
            null;

          for (const row of rows) {
            if (!row?.id) {
              logWarn(
                `[Supastash] Batch: skipped row without id from "${table}"`,
              );
              continue;
            }

            prevMaxSyncedAt = returnMaxDate({
              row,
              prevMax: prevMaxSyncedAt,
              col: tsCol,
            });
            prevMaxDeletedAt = returnMaxDate({
              row,
              prevMax: prevMaxDeletedAt,
              col: "deleted_at",
            });

            if (row.deleted_at) {
              toDelete.push(row.id);
            } else {
              toUpsert.push(row);
            }
          }

          SyncInfoUpdater.setUnsyncedDataCount({
            amount: toUpsert.length,
            type: "pull",
            table,
          });
          SyncInfoUpdater.setUnsyncedDeletedCount({
            amount: toDelete.length,
            type: "pull",
            table,
          });

          // Delete soft-deleted rows
          if (toDelete.length > 0) {
            for (let i = 0; i < toDelete.length; i += CHUNK_SIZE) {
              const slice = toDelete.slice(i, i + CHUNK_SIZE);
              const placeholders = slice.map(() => "?").join(", ");
              await db.runAsync(
                `DELETE FROM ${table} WHERE id IN (${placeholders})`,
                slice,
              );
            }
          }

          // Upsert live rows
          if (toUpsert.length > 0) {
            await upsertChunkData({ table, records: toUpsert });
          }

          // Update sync cursor so the next round starts from the right place
          if (prevMaxSyncedAt || prevMaxDeletedAt) {
            await setSupastashSyncStatus(table, tableFilters.get(table) ?? [], {
              lastSyncedAt: prevMaxSyncedAt?.value ?? undefined,
              lastDeletedAt: prevMaxDeletedAt?.value ?? undefined,
              lastSyncedAtPk: prevMaxSyncedAt?.pk ?? null,
              filterNamespace: "global",
            });
          }

          if (toUpsert.length > 0 || toDelete.length > 0) {
            refreshScreen(table);
          }

          log(
            `[Supastash] Batch received ${rows.length} rows for "${table}" ` +
              `(u${toUpsert.length}/d${toDelete.length})`,
          );

          SyncInfoUpdater.markLogSuccess({ type: "pull", table });
        } catch (e: any) {
          SyncInfoUpdater.markLogError({
            type: "pull",
            table,
            lastError: e,
            errorCount: 1,
          });
          logError(`[Supastash] Batch pull failed for "${table}"`, e);
        } finally {
          // Mark table as fully completed only once it leaves remaining_tables
          if (!nextRemaining.includes(table)) {
            completedTables.add(table);
            SyncInfoUpdater.setTablesCompleted({
              amount: completedTables.size,
              type: "pull",
            });
          }
        }
      }

      remainingTables = nextRemaining;
    }
  } catch (error) {
    logError("[Supastash] Error in batch pull from remote", error);
  } finally {
    SyncInfoUpdater.reset({ type: "pull" });
  }
}
