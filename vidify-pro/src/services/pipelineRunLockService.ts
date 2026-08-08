import _ from "lodash";
import { REFACTOR_CONSTANTS } from "../constants";
import { jsonUtils } from "../lib/json";

interface PipelineRunLock { runId: string; targetKey: string; expiresAt: number; }
export interface PipelineRunLease { acquired: boolean; runId: string; targetKey: string; }

const createRunId = (): string => crypto.randomUUID();
const getStorageKey = (targetKey: string): string => `${REFACTOR_CONSTANTS.PIPELINE_RUN_LOCK_PREFIX}${targetKey}`;
const readLock = (targetKey: string): PipelineRunLock | null => jsonUtils.safeParse<PipelineRunLock | null>(localStorage.getItem(getStorageKey(targetKey)), null);
const isActiveLock = (lock: PipelineRunLock | null): lock is PipelineRunLock => Boolean(lock && _.gt(lock.expiresAt, Date.now()));
export const acquirePipelineRunLease = (targetKey: string): PipelineRunLease => { const normalizedTargetKey = _.trim(targetKey); const existingLock = readLock(normalizedTargetKey); if (isActiveLock(existingLock)) return { acquired: false, runId: existingLock.runId, targetKey: normalizedTargetKey }; const runId = createRunId(); const lock: PipelineRunLock = { runId, targetKey: normalizedTargetKey, expiresAt: _.add(Date.now(), REFACTOR_CONSTANTS.PIPELINE_RUN_LOCK_TTL_MS) }; localStorage.setItem(getStorageKey(normalizedTargetKey), jsonUtils.safeStringify(lock)); return { acquired: _.isEqual(readLock(normalizedTargetKey)?.runId, runId), runId, targetKey: normalizedTargetKey }; };
export const refreshPipelineRunLease = (lease: PipelineRunLease): boolean => { const currentLock = readLock(lease.targetKey); if (!_.isEqual(currentLock?.runId, lease.runId)) return false; localStorage.setItem(getStorageKey(lease.targetKey), jsonUtils.safeStringify({ ...currentLock, expiresAt: _.add(Date.now(), REFACTOR_CONSTANTS.PIPELINE_RUN_LOCK_TTL_MS) })); return true; };
export const releasePipelineRunLease = (lease: PipelineRunLease): void => { if (_.isEqual(readLock(lease.targetKey)?.runId, lease.runId)) localStorage.removeItem(getStorageKey(lease.targetKey)); };
