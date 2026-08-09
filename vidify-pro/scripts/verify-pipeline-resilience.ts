import {
  createSafeFallbackHook,
  resolveUsableHooks,
} from "../src/services/hookResilienceService.ts";
import { writeVerificationLog } from "./verificationLogger.ts";
import {
  acquirePipelineRunLease,
  releasePipelineRunLease,
} from "../src/services/pipelineRunLockService.ts";
import { validateScriptRepair } from "../src/services/scriptQualityService.ts";
import { ProjectLanguage } from "../src/types.ts";
const values = new Map<string, string>();
Object.defineProperty(globalThis, "localStorage", {
  value: {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    removeItem: (key: string) => values.delete(key),
  },
});
const assert = (value: unknown, message: string): void => {
  if (!value) throw new Error(message);
};
const fallback = createSafeFallbackHook("kiểm thử", ProjectLanguage.VI, "Auto");
assert(
  fallback.selected && fallback.content.length > 0,
  "hook fallback failed",
);
assert(
  resolveUsableHooks([], "kiểm thử", ProjectLanguage.VI, "Auto", 3)[0].selected,
  "empty hooks were not recovered",
);
const first = acquirePipelineRunLease("project_1");
const duplicate = acquirePipelineRunLease("project_1");
assert(
  first.acquired && !duplicate.acquired,
  "duplicate pipeline run was accepted",
);
releasePipelineRunLease(first);
assert(
  acquirePipelineRunLease("project_1").acquired,
  "pipeline lease was not released",
);
const hook = "Câu hỏi mở đầu";
const validScript = `${hook} ${Array(148).fill("nội dung").join(" ")}`;
assert(
  !validateScriptRepair("complete corrected script", 120, hook).accepted,
  "placeholder repair was accepted",
);
assert(
  !validateScriptRepair("quá ngắn", 120, hook).accepted,
  "short repair was accepted",
);
assert(
  !validateScriptRepair(Array(150).fill("nội dung").join(" "), 120, hook)
    .accepted,
  "repair without hook was accepted",
);
assert(
  validateScriptRepair(validScript, 120, hook).accepted,
  "valid repair was rejected",
);
writeVerificationLog("Pipeline resilience assertions passed");
