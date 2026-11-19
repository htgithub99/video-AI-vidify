import type { Response } from "express";
import { RUNTIME_TEXT as RT_SHARED } from "../../../../constants/runtime/shared.js";
import type { SunoCreationProgress } from "../../../../types/sunoCreationProgress.js";
import { ndjsonReporter } from "../../../../server/utils/ndjsonReporter.js";
export const sunoCreationReporter = (res: Response, streaming: boolean) => {
  const { emit, finish } = ndjsonReporter(res, streaming);
  return { progress: (progress: SunoCreationProgress) => emit({ type: RT_SHARED.PROGRESS, progress }), finish };
};
