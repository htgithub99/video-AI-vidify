import { recordWorkflowActivity, type WorkflowEvent } from "./workflowActivity";
import { WORKFLOW_ACTIVITY_CONFIG, WORKFLOW_ACTIVITY_EVENT, storyActivityPrefixes } from "../constants/workflowActivity";
import { MotionStoryJobKind, MotionJobStatus, type MotionStoryJobState, type MotionStoryScript } from "../types/motionVideo";
import { getMotionErrorMessage } from "../lib/motionUtils";
export const logMotionActivity = (prefix: string, status: (typeof WORKFLOW_ACTIVITY_CONFIG.EVENT_SUFFIX)[keyof typeof WORKFLOW_ACTIVITY_CONFIG.EVENT_SUFFIX], detail?: string, count?: number) => {
  const event = (prefix + status) as WorkflowEvent;
  if (Object.prototype.hasOwnProperty.call(WORKFLOW_ACTIVITY_EVENT, event)) recordWorkflowActivity(WORKFLOW_ACTIVITY_CONFIG.AREAS.motion, event, count, detail);
};
export const logStoryTerminal = (job: MotionStoryJobState) => {
  const failedScenes = job.kind === MotionStoryJobKind.SCENES ? (job.result as MotionStoryScript | undefined)?.gen?.failed?.length || 0 : 0;
  logMotionActivity(storyActivityPrefixes[job.kind], job.status === MotionJobStatus.CANCELLED ? WORKFLOW_ACTIVITY_CONFIG.EVENT_SUFFIX.stop : job.status === MotionJobStatus.ERROR || failedScenes ? WORKFLOW_ACTIVITY_CONFIG.EVENT_SUFFIX.fail : WORKFLOW_ACTIVITY_CONFIG.EVENT_SUFFIX.done, job.error, failedScenes || undefined);
};
export const loggedMotionAction = async <T>(prefix: string, task: () => Promise<T>, detail?: string): Promise<T> => {
  logMotionActivity(prefix, WORKFLOW_ACTIVITY_CONFIG.EVENT_SUFFIX.start, detail);
  try {
    const result = await task();
    logMotionActivity(prefix, WORKFLOW_ACTIVITY_CONFIG.EVENT_SUFFIX.done, detail);
    return result;
  } catch (error) {
    logMotionActivity(prefix, WORKFLOW_ACTIVITY_CONFIG.EVENT_SUFFIX.fail, getMotionErrorMessage(error));
    throw error;
  }
};
