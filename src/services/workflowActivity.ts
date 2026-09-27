import { WORKFLOW_ACTIVITY_CONFIG, WORKFLOW_ACTIVITY_EVENT } from "../constants/workflowActivity";

export type WorkflowArea = typeof WORKFLOW_ACTIVITY_CONFIG.AREAS.music | typeof WORKFLOW_ACTIVITY_CONFIG.AREAS.flow;
export type WorkflowEvent = typeof WORKFLOW_ACTIVITY_EVENT[keyof typeof WORKFLOW_ACTIVITY_EVENT];
export interface WorkflowActivity { id: number; at: number; area: WorkflowArea; event: WorkflowEvent; count?: number; }

const readActivities = (): WorkflowActivity[] => {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(WORKFLOW_ACTIVITY_CONFIG.STORAGE_KEY) || WORKFLOW_ACTIVITY_CONFIG.EMPTY_STORAGE);
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is WorkflowActivity =>
      item !== null && typeof item === "object"
      && Number.isSafeInteger(item.id) && item.id > 0
      && Number.isSafeInteger(item.at) && item.at > 0
      && (item.area === WORKFLOW_ACTIVITY_CONFIG.AREAS.music || item.area === WORKFLOW_ACTIVITY_CONFIG.AREAS.flow)
      && Object.prototype.hasOwnProperty.call(WORKFLOW_ACTIVITY_EVENT, item.event)
      && (item.count === undefined || (Number.isSafeInteger(item.count) && item.count >= 0)),
    ).slice(0, WORKFLOW_ACTIVITY_CONFIG.MAX_ENTRIES).map(({ id, at, area, event, count }) => ({ id, at, area, event, count }));
  } catch {
    return [];
  }
};
let activities: WorkflowActivity[] = readActivities();
let nextId = activities.reduce((largest, item) => Math.max(largest, item.id), 0) + 1;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());
const persist = () => {
  try { localStorage.setItem(WORKFLOW_ACTIVITY_CONFIG.STORAGE_KEY, JSON.stringify(activities)); } catch { return; }
};

export const subscribeWorkflowActivity = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
export const getWorkflowActivities = () => activities;
export const clearWorkflowActivities = () => { activities = []; persist(); emit(); };
export const recordWorkflowActivity = (area: WorkflowArea, event: WorkflowEvent, count?: number) => {
  activities = [{ id: nextId++, at: Date.now(), area, event, count: Number.isSafeInteger(count) && count! >= 0 ? count : undefined }, ...activities].slice(0, WORKFLOW_ACTIVITY_CONFIG.MAX_ENTRIES);
  persist();
  emit();
};
