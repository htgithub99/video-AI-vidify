import fs from "node:fs";
import path from "node:path";
import { MOTION_PRODUCTION as P } from "../../constants/motionProduction.js";
import { getMotionRootDirectory } from "./motionLibraryService.js";
export class MotionLogStore {
  private counts = new Map<string, number>();
  constructor(private directory: string) {}
  private file(id: string): string {
    if (!P.ID_RE.test(id)) throw new Error(P.INVALID_RUN);
    return path.join(this.directory, id + P.LOG_EXT);
  }
  read(id: string, after = 0, limit: number = P.LOG_PAGE_SIZE): { lines: string[]; next: number; total: number } {
    const file = this.file(id);
    const rows = fs.existsSync(file)
      ? fs
          .readFileSync(file, P.ENCODING)
          .split(/\r?\n/u)
          .filter(Boolean)
          .map((row) => JSON.parse(row) as { sequence: number; line: string })
      : [];
    if (rows.some((row, index) => row.sequence !== index + 1 || typeof row.line !== "string")) throw new Error(P.LOG_INVALID);
    const start = Math.max(0, Math.min(rows.length, Math.floor(Number(after) || 0)));
    const page = rows.slice(start, start + Math.max(1, Math.min(P.LOG_PAGE_SIZE, Math.floor(Number(limit) || P.LOG_PAGE_SIZE))));
    return { lines: page.map((row) => row.line), next: start + page.length, total: rows.length };
  }
  append(id: string, line: string): void {
    const sequence = (this.counts.get(id) ?? this.read(id).total) + 1;
    fs.mkdirSync(this.directory, { recursive: true });
    fs.appendFileSync(this.file(id), JSON.stringify({ sequence, line }) + "\n", { encoding: P.ENCODING, flush: true });
    this.counts.set(id, sequence);
  }
  seed(id: string, lines: string[]): void {
    if (fs.existsSync(this.file(id))) return;
    for (const line of lines) this.append(id, line);
  }
}
const stores = new Map<string, MotionLogStore>();
export const motionStoryLogs = () => {
  const directory = path.join(getMotionRootDirectory(), P.SNAPSHOT_FOLDER, P.LOG_FOLDER);
  if (!stores.has(directory)) stores.set(directory, new MotionLogStore(directory));
  return stores.get(directory)!;
};
