import {
  SupastashSQLiteAdapter,
  SupastashSQLiteExecutor,
  TauriSQLiteClient,
} from "../../types/supastashConfig.types";
import { namedToPositional } from "../normalizer";

export const SQLiteAdapterTauri: SupastashSQLiteAdapter<TauriSQLiteClient> = {
  async openDatabaseAsync(name: string, sqliteClient: TauriSQLiteClient) {
    const db = await sqliteClient.load(`sqlite:${name}`);

    const normalizeParams = (params?: any[]): any[] => {
      return (params ?? []).map((v) =>
        typeof v === "boolean" ? (v ? 1 : 0) : v
      );
    };

    return {
      runAsync: async (sql, params) => {
        const normalized = normalizeParams(params);

        await db.execute(sql, normalized ?? []);
      },

      execAsync: async (statement) => {
        await db.execute(statement);
      },

      getAllAsync: async <T = any>(
        sql: string,
        params?: any[]
      ): Promise<T[]> => {
        const normalized = normalizeParams(params);
        const rows = await db.select(sql, normalized ?? []);
        return (rows as T[]) ?? [];
      },

      getFirstAsync: async <T = any>(
        sql: string,
        params?: any[]
      ): Promise<T | null> => {
        const normalized = normalizeParams(params);
        const rows = (await db.select(sql, normalized ?? [])) as T[];
        return rows?.[0] ?? null;
      },

      query: async <T = any>(
        sql: string,
        params?: Record<string, any>
      ): Promise<T[]> => {
        const { sql: q, params: p } = params
          ? namedToPositional(sql, params)
          : { sql, params: [] };
        const normalized = normalizeParams(p);
        return (await db.select(q, normalized)) as T[];
      },

      queryOne: async <T = any>(
        sql: string,
        params?: Record<string, any>
      ): Promise<T | null> => {
        const { sql: q, params: p } = params
          ? namedToPositional(sql, params)
          : { sql, params: [] };
        const normalized = normalizeParams(p);
        const rows = (await db.select(q, normalized)) as T[];
        return rows?.[0] ?? null;
      },
      execute: async <T = any>(
        sql: string,
        params?: Record<string, any>
      ): Promise<T> => {
        const { sql: q, params: p } = params
          ? namedToPositional(sql, params)
          : { sql, params: [] };
        return (await db.execute(q, p)) as T;
      },

      closeAsync: async () => {
        if (typeof db.close === "function") {
          await db.close();
        }
      },

      withTransaction: async (fn) => {
        const statements: string[] = [];

        const enqueue = (sql: string, params: any[]) => {
          statements.push(interpolate(sql, params));
        };

        const txExecutor: SupastashSQLiteExecutor = {
          runAsync: async (sql, params) => {
            enqueue(sql, params ?? []);
          },
          execAsync: async (statement) => {
            statements.push(statement);
          },
          getAllAsync: async <T = any>(
            sql: string,
            params?: any[]
          ): Promise<T[]> =>
            ((await db.select(sql, params ?? [])) as T[]) ?? [],
          getFirstAsync: async <T = any>(
            sql: string,
            params?: any[]
          ): Promise<T | null> =>
            ((await db.select(sql, params ?? [])) as T[])?.[0] ?? null,
          query: async <T = any>(
            sql: string,
            params?: Record<string, any>
          ): Promise<T[]> => {
            const { sql: q, params: p } = params
              ? namedToPositional(sql, params)
              : { sql, params: [] };
            return (await db.select(q, p)) as T[];
          },
          queryOne: async <T = any>(
            sql: string,
            params?: Record<string, any>
          ): Promise<T | null> => {
            const { sql: q, params: p } = params
              ? namedToPositional(sql, params)
              : { sql, params: [] };
            return ((await db.select(q, p)) as T[])?.[0] ?? null;
          },
          execute: async <T = any>(
            sql: string,
            params?: Record<string, any>
          ): Promise<T> => {
            const { sql: q, params: p } = params
              ? namedToPositional(sql, params)
              : { sql, params: [] };
            enqueue(q, p);
            return {} as T;
          },
        };

        await fn(txExecutor);

        if (statements.length === 0) return;

        const batch = `BEGIN; ${statements.join("; ")}; COMMIT;`;
        try {
          await db.execute(batch, []);
        } catch (err) {
          await db.execute("ROLLBACK;", []).catch(() => {});
          throw err;
        }
      },
    };
  },
};

function interpolate(sql: string, params: any[]): string {
  let i = 0;
  return sql.replace(/\?|\$\d+/g, () => {
    const val = params[i++];
    if (val === null || val === undefined) return "NULL";
    if (typeof val === "number")
      return Number.isFinite(val) ? String(val) : "NULL";
    if (typeof val === "boolean") return val ? "1" : "0";
    if (val instanceof Uint8Array || val instanceof ArrayBuffer)
      return "X'" + Buffer.from(val as ArrayBufferLike).toString("hex") + "'";
    return `'${String(val).replace(/'/g, "''")}'`;
  });
}
