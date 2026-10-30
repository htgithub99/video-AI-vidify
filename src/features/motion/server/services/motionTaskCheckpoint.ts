import { parseJson } from "../../../../lib/jsonStringify.js";
import fs from "node:fs";
import path from "node:path";
import { MOTION_PRODUCTION as P } from "../../../../constants/motionProduction.js";
import { motionInputKey, writeMotionJsonAtomic } from "./motionFileUtils.js";
import { getMotionRootDirectory } from "./motionLibraryService.js";
export const motionTaskCheckpoint = <T>(scope: string | undefined, kind: string, input: unknown, directory = path.join(getMotionRootDirectory(), P.TASK_FOLDER)) => {
  const key = motionInputKey([P.TASK_VERSION, scope, kind, input]);
  const file = scope ? path.join(directory, key + P.EXT) : undefined;
  return {
    read(): T | undefined {
      if (!file || !fs.existsSync(file)) return undefined;
      try {
        const saved = parseJson(fs.readFileSync(file, P.ENCODING));
        if (saved.version !== P.TASK_VERSION || saved.key !== key || !saved.draft || typeof saved.draft !== "object") throw new Error(P.TASK_INVALID);
        return saved.draft as T;
      } catch {
        throw new Error(P.TASK_INVALID);
      }
    },
    save(draft: T): void {
      if (!file) return;
      fs.mkdirSync(directory, { recursive: true });
      writeMotionJsonAtomic(file, { version: P.TASK_VERSION, key, draft });
    },
  };
};
