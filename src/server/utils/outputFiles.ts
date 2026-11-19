import fs from "fs";
import path from "path";
import _ from "lodash";
export type OutputDeleteResult = { freedBytes: number; failed: string[] };
export const outputSize = async (target: string): Promise<number> => {
  const stat = await fs.promises.stat(target).catch(() => null);
  if (!stat) return 0;
  if (!stat.isDirectory()) return stat.size;
  const entries = await fs.promises.readdir(target, { withFileTypes: true });
  let total = 0;
  for (const entry of entries) total += await outputSize(path.join(target, entry.name));
  return total;
};
export const deleteOutputEntries = async (dir: string, names: unknown): Promise<OutputDeleteResult> => {
  const list = _.uniq(_.compact(_.castArray(names ?? []).map((name) => path.basename(_.toString(name)))));
  const result: OutputDeleteResult = { freedBytes: 0, failed: [] };
  for (const name of list) {
    const target = path.join(dir, name);
    try {
      const size = await outputSize(target);
      await fs.promises.rm(target, { recursive: true, force: true });
      result.freedBytes += size;
    } catch {
      result.failed.push(name);
    }
  }
  return result;
};
