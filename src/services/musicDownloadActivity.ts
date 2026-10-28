import { WORKFLOW_ACTIVITY_CONFIG, WORKFLOW_ACTIVITY_EVENT as E } from '../constants/workflowActivity.js';
import { recordWorkflowActivity } from './workflowActivity.js';
import { formatMusicDownloadProgress } from '../lib/musicDownloadProgress.js';
import type { MusicDownloadProgress } from '../types/musicDownloadProgress.js';

export const recordMusicDownloadProgressActivity = (progress: MusicDownloadProgress, language: string) => {
  const event = progress.phase === 'ready' ? E.musicUploadDone
    : progress.phase === 'verification-waiting' ? E.musicVerificationStart
    : progress.phase === 'verification-resumed' ? E.musicVerificationResume
    : progress.phase === 'evaluation-failed' ? E.musicEvaluationFail
    : progress.phase === 'failed' ? E.musicUploadFail
    : progress.phase === 'submitted' ? E.musicEvaluationStart
    : progress.phase === 'evaluated' ? E.musicEvaluationDone
    : ['selecting', 'selected', 'uploading'].includes(progress.phase) ? E.musicUploadStart
    : E.musicDownloadProgress;
  recordWorkflowActivity(WORKFLOW_ACTIVITY_CONFIG.AREAS.music, event, undefined, formatMusicDownloadProgress(progress, language));
};
