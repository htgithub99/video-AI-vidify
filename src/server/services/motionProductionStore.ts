import { parseJson, stringifyJson } from "../../lib/jsonStringify.js";
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { MOTION_PRODUCTION as P } from "../../constants/motionProduction.js";
import { writeMotionJsonAtomic } from "./motionFileUtils.js";
export interface MotionProductionOwner {
  pid: number;
  token: string;
  updated: number;
}
export const motionProcessAlive = (pid: number): boolean => {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
};
export class MotionProductionStore<T extends { owner?: MotionProductionOwner }> {
  constructor(private readonly directory: string) {}
  private file(id: string, extension: string = P.EXT): string {
    if (!P.ID_RE.test(id)) throw new Error(P.INVALID_RUN);
    return path.join(this.directory, id + extension);
  }
  read(id: string): T | undefined {
    try {
      return parseJson(fs.readFileSync(this.file(id), P.ENCODING)) as T;
    } catch {
      return undefined;
    }
  }
  exists(id: string): boolean {
    return fs.existsSync(this.file(id));
  }
  private lock(id: string): MotionProductionOwner | undefined {
    try {
      return parseJson(fs.readFileSync(this.file(id, P.LOCK_EXT), P.ENCODING));
    } catch {
      return undefined;
    }
  }
  private claim(lockFile: string): MotionProductionOwner {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const descriptor = fs.openSync(lockFile, P.LOCK_MODE);
        const owner = { pid: process.pid, token: randomUUID(), updated: Date.now() };
        try {
          fs.writeFileSync(descriptor, stringifyJson(owner), P.ENCODING);
        } finally {
          fs.closeSync(descriptor);
        }
        return owner;
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== P.LOCK_EXISTS) throw error;
        const snapshot = () => {
          try {
            return fs.readFileSync(lockFile, P.ENCODING);
          } catch (failure) {
            if ((failure as NodeJS.ErrnoException).code === P.LOCK_MISSING) return undefined;
            throw failure;
          }
        };
        const content = snapshot();
        if (content === undefined) continue;
        let previous: MotionProductionOwner | undefined;
        try {
          const value = parseJson(content);
          if (Number.isInteger(value.pid) && value.pid > 0 && typeof value.token === "string" && P.ID_RE.test(value.token)) previous = value;
        } catch {}
        if (previous ? motionProcessAlive(previous.pid) : Date.now() - fs.statSync(lockFile).mtimeMs < P.LOCK_MS) throw new Error(P.BUSY_RUN);
        const guardFile = path.join(this.directory, P.RECLAIM_EXT + (previous?.token || path.basename(lockFile)));
        const guard = this.claim(guardFile);
        try {
          if (snapshot() === content) fs.unlinkSync(lockFile);
        } finally {
          this.releaseFile(guardFile, guard);
        }
      }
    }
    throw new Error(P.BUSY_RUN);
  }
  acquire(id: string): MotionProductionOwner {
    fs.mkdirSync(this.directory, { recursive: true });
    return this.claim(this.file(id, P.LOCK_EXT));
  }
  private releaseFile(file: string, owner: MotionProductionOwner): void {
    let current: MotionProductionOwner | undefined;
    try {
      current = parseJson(fs.readFileSync(file, P.ENCODING));
    } catch {}
    if (current?.token === owner.token) fs.unlinkSync(file);
  }
  owns(id: string, owner: MotionProductionOwner): boolean {
    return this.lock(id)?.token === owner.token;
  }
  save(id: string, value: T, owner: MotionProductionOwner): void {
    if (!this.owns(id, owner)) throw new Error(P.LOCK_LOST);
    owner.updated = Date.now();
    writeMotionJsonAtomic(this.file(id), value);
    writeMotionJsonAtomic(this.file(id, P.LOCK_EXT), owner);
  }
  release(id: string, owner: MotionProductionOwner): void {
    this.releaseFile(this.file(id, P.LOCK_EXT), owner);
  }
  ids(): string[] {
    return fs.existsSync(this.directory)
      ? fs
          .readdirSync(this.directory)
          .filter((file) => file.endsWith(P.EXT))
          .map((file) => file.slice(0, -P.EXT.length))
      : [];
  }
}
