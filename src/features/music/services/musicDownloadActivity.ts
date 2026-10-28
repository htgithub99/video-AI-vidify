import { RUNTIME_TEXT as RT_SHARED } from "../../../constants/runtime/shared.js";
import { WORKFLOW_ACTIVITY_CONFIG, WORKFLOW_ACTIVITY_EVENT as E } from "../../../constants/workflowActivity.js";
import { recordWorkflowActivity } from "../../../services/workflowActivity.js";
import { formatMusicDownloadProgress } from "../lib/musicDownloadProgress.js";
import type { MusicDownloadProgress } from "../../../types/musicDownloadProgress.js";
export const recordMusicDownloadProgressActivity = (progress: MusicDownloadProgress, language: string) => {
  const event =
    progress.phase === RT_SHARED.READY
      ? E.musicUploadDone
      : progress.phase === RT_SHARED.VERIFICATION_WAITING
        ? E.musicVerificationStart
        : progress.phase === RT_SHARED.VERIFICATION_RESUMED
          ? E.musicVerificationResume
          : progress.phase === RT_SHARED.EVALUATION_FAILED
            ? E.musicEvaluationFail
            : progress.phase === RT_SHARED.FAILED
              ? E.musicUploadFail
              : progress.phase === RT_SHARED.SUBMITTED
                ? E.musicEvaluationStart
                : progress.phase === RT_SHARED.EVALUATED
                  ? E.musicEvaluationDone
                  : ([RT_SHARED.SELECTING, RT_SHARED.SELECTED, RT_SHARED.UPLOADING] as string[]).includes(progress.phase)
                    ? E.musicUploadStart
                    : E.musicDownloadProgress;
  recordWorkflowActivity(WORKFLOW_ACTIVITY_CONFIG.AREAS.music, event, undefined, formatMusicDownloadProgress(progress, language));
};
