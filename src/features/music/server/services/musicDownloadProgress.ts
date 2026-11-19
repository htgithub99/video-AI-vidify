import type { Response } from "express";
import { RUNTIME_TEXT as RT_SHARED } from "../../../../constants/runtime/shared.js";
import type { MusicDownloadProgress } from "../../../../types/musicDownloadProgress.js";
import { musicErrorDetails } from "../../../../server/services/musicDiagnosticService.js";
import { ndjsonReporter } from "../../../../server/utils/ndjsonReporter.js";
export const musicDownloadReporter = (res: Response, streaming: boolean) => {
  const { emit, finish } = ndjsonReporter(res, streaming);
  return { progress: (progress: MusicDownloadProgress) => emit({ type: RT_SHARED.PROGRESS, progress: { ...progress, message: progress.message ? musicErrorDetails(new Error(progress.message)).errorMessage : undefined } }), finish };
};
