import { RUNTIME_TEXT as RT_SHARED } from "../constants/runtime/shared.js";
import { MOTION_PRODUCTION as P } from "../constants/motionProduction.js";
export interface MotionFieldIssue {
  path: string;
  reason: string;
}
export const mergeMotionRepair = <T>(draft: T, patch: unknown, paths: string[]): T => {
  const result = structuredClone(draft) as any;
  for (const path of paths) {
    if (!path || P.DNA_UNSAFE_PATH.test(path)) continue;
    const keys = path.split(RT_SHARED.SYMBOL_CDB4EE);
    let value: any = patch;
    let present = true;
    for (const key of keys) {
      if (value == null || !Object.prototype.hasOwnProperty.call(value, key)) {
        present = false;
        break;
      }
      value = value[key];
    }
    if (!present) continue;
    let target: any = result;
    for (const key of keys.slice(0, -1)) {
      if (target[key] == null || typeof target[key] !== "object") target[key] = {};
      target = target[key];
    }
    target[keys[keys.length - 1]] = structuredClone(value);
  }
  return result;
};
export class MotionRepairLedger<T extends object> {
  private readonly drafts = new Map<string, T>();
  private readonly errors = new Map<string, MotionFieldIssue[]>();
  constructor(
    readonly ids: string[],
    private readonly check: (item: T, id: string) => MotionFieldIssue[],
  ) {}
  submit(rows: { id: string; value: T }[]): void {
    const counts = new Map<string, number>();
    for (const row of rows) counts.set(row.id, (counts.get(row.id) || 0) + 1);
    for (const row of rows) {
      if (!this.ids.includes(row.id) || counts.get(row.id) !== 1 || (this.drafts.has(row.id) && !this.errors.get(row.id)?.length)) continue;
      const before = this.drafts.get(row.id);
      const value = before
        ? mergeMotionRepair(
            before,
            row.value,
            (this.errors.get(row.id) || []).map((error) => error.path),
          )
        : structuredClone(row.value);
      this.drafts.set(row.id, value);
      this.errors.set(row.id, this.check(value, row.id));
    }
  }
  accepted(): { id: string; value: T }[] {
    return this.ids.flatMap((id) => (this.drafts.has(id) && !this.errors.get(id)?.length ? [{ id, value: structuredClone(this.drafts.get(id)!) }] : []));
  }
  pending(): { id: string; draft?: T; errors: MotionFieldIssue[] }[] {
    return this.ids.filter((id) => !this.drafts.has(id) || this.errors.get(id)?.length).map((id) => ({ id, draft: this.drafts.has(id) ? structuredClone(this.drafts.get(id)!) : undefined, errors: this.errors.get(id) || [] }));
  }
  snapshot(): { id: string; value: T }[] {
    return this.ids.flatMap((id) => (this.drafts.has(id) ? [{ id, value: structuredClone(this.drafts.get(id)!) }] : []));
  }
}
