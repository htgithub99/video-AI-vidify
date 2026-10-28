import { parseJson } from "../lib/jsonStringify.js";
import { stringifyJson } from "../lib/jsonStringify.js";
import _ from "lodash";
import { WORKFLOW_ACTIVITY_CONFIG, WORKFLOW_ACTIVITY_EVENT, WORKFLOW_AREAS } from "../constants/workflowActivity";
export type WorkflowArea = (typeof WORKFLOW_AREAS)[number];
export type WorkflowEvent = (typeof WORKFLOW_ACTIVITY_EVENT)[keyof typeof WORKFLOW_ACTIVITY_EVENT];
export interface WorkflowActivity {
  id: number;
  at: number;
  area: WorkflowArea;
  event: WorkflowEvent;
  count?: number;
  detail?: string;
}
const readActivities = (): WorkflowActivity[] => {
  try {
    const value: unknown = parseJson(localStorage.getItem(WORKFLOW_ACTIVITY_CONFIG.STORAGE_KEY) || WORKFLOW_ACTIVITY_CONFIG.EMPTY_STORAGE);
    if (!Array.isArray(value)) return [];
    return _.map(
      _.slice(
        _.filter(
          value,
          (item): item is WorkflowActivity => item !== null && typeof item === "object" && Number.isSafeInteger(item.id) && item.id > 0 && Number.isSafeInteger(item.at) && item.at > 0 && WORKFLOW_AREAS.includes(item.area) && Object.prototype.hasOwnProperty.call(WORKFLOW_ACTIVITY_EVENT, item.event) && (item.count === undefined || (Number.isSafeInteger(item.count) && item.count >= 0)),
        ),
        0,
        WORKFLOW_ACTIVITY_CONFIG.MAX_ENTRIES,
      ),
      ({ id, at, area, event, count, detail }) => {
        let resolvedArea = area;
        if (_.includes([WORKFLOW_ACTIVITY_EVENT.musicMixerStart, WORKFLOW_ACTIVITY_EVENT.musicMixerDone, WORKFLOW_ACTIVITY_EVENT.musicMixerFail, WORKFLOW_ACTIVITY_EVENT.musicMixerStop] as WorkflowEvent[], event)) {
          resolvedArea = WORKFLOW_ACTIVITY_CONFIG.AREAS.mixer;
        }
        return { id, at, area: resolvedArea, event, count, detail: typeof detail === "string" ? detail.slice(0, 240) : undefined };
      },
    );
  } catch {
    return [];
  }
};
let activities: WorkflowActivity[] = readActivities();
let nextId = _.reduce(activities, (largest, item) => Math.max(largest, item.id), 0) + 1;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());
const persist = () => {
  try {
    localStorage.setItem(WORKFLOW_ACTIVITY_CONFIG.STORAGE_KEY, stringifyJson(activities));
  } catch {
    return;
  }
};
export const subscribeWorkflowActivity = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
export const getWorkflowActivities = () => activities;
export const clearWorkflowActivities = () => {
  activities = [];
  persist();
  emit();
};
export const recordWorkflowActivity = (area: WorkflowArea, event: WorkflowEvent, count?: number, detail?: string) => {
  activities = _.slice([{ id: nextId++, at: Date.now(), area, event, count: Number.isSafeInteger(count) && count! >= 0 ? count : undefined, detail: detail?.slice(0, 240) }, ...activities], 0, WORKFLOW_ACTIVITY_CONFIG.MAX_ENTRIES);
  persist();
  emit();
};
export const getEventStatusType = (event: WorkflowEvent): (typeof WORKFLOW_ACTIVITY_CONFIG.STATUS_TYPE_KEYS)[keyof typeof WORKFLOW_ACTIVITY_CONFIG.STATUS_TYPE_KEYS] => {
  if (event.endsWith(WORKFLOW_ACTIVITY_CONFIG.EVENT_SUFFIX.done) || event === WORKFLOW_ACTIVITY_EVENT.musicSave || event === WORKFLOW_ACTIVITY_EVENT.flowFolder || event === WORKFLOW_ACTIVITY_EVENT.flowReference) {
    return WORKFLOW_ACTIVITY_CONFIG.STATUS_TYPE_KEYS.success;
  }
  if (event.endsWith(WORKFLOW_ACTIVITY_CONFIG.EVENT_SUFFIX.fail)) {
    return WORKFLOW_ACTIVITY_CONFIG.STATUS_TYPE_KEYS.fail;
  }
  if (event.endsWith(WORKFLOW_ACTIVITY_CONFIG.EVENT_SUFFIX.stop)) {
    return WORKFLOW_ACTIVITY_CONFIG.STATUS_TYPE_KEYS.stop;
  }
  if (event.endsWith(WORKFLOW_ACTIVITY_CONFIG.EVENT_SUFFIX.start)) {
    return WORKFLOW_ACTIVITY_CONFIG.STATUS_TYPE_KEYS.running;
  }
  return WORKFLOW_ACTIVITY_CONFIG.STATUS_TYPE_KEYS.info;
};
export const summarizeWorkflowActivities = (entries: readonly WorkflowActivity[]) => {
  const areas = Object.fromEntries(WORKFLOW_AREAS.map((area) => [area, 0])) as Record<WorkflowArea, number>;
  let success = 0,
    fail = 0;
  for (const entry of entries) {
    areas[entry.area]++;
    const status = getEventStatusType(entry.event);
    if (status === WORKFLOW_ACTIVITY_CONFIG.STATUS_TYPE_KEYS.success) success++;
    else if (status === WORKFLOW_ACTIVITY_CONFIG.STATUS_TYPE_KEYS.fail) fail++;
  }
  return { areas, success, fail };
};
