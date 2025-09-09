import { getSupastashConfig } from "../../../core/config";
import { RowLike } from "../../../types/syncEngine.types";

export function enforceTimestamps(row: RowLike) {
  const { fieldEnforcement: f } = getSupastashConfig();
  if (!f) return row;

  const created = f.createdAtField ?? "created_at";
  const updated = f.updatedAtField ?? "updated_at";
  const out = { ...row };
  const defaultDate = f.autoFillDefaultISO ?? "1970-01-01T00:00:00Z";

  if (f.requireCreatedAt !== false) {
    if (!out[created]) {
      if (f.autoFillMissing !== false)
        out[created] = f.autoFillDefaultISO ?? defaultDate;
      else throw new Error(`[Supastash] Missing required ${created}`);
    }
  }

  if (f.requireUpdatedAt !== false) {
    if (!out[updated]) {
      if (f.autoFillMissing !== false)
        out[updated] = f.autoFillDefaultISO ?? defaultDate;
      else throw new Error(`[Supastash] Missing required ${updated}`);
    }
  }

  return out;
}
