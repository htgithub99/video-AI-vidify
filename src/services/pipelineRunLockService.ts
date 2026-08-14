import _ from "lodash";
import { REFACTOR_CONSTANTS } from "../constants";
import { jsonUtils } from "../lib/json";

interface PipelineRunLock {
  runId: string;
  targetKey: string;
  ownerId: string;
  expiresAt: number;
}

export interface PipelineRunLease {
  acquired: boolean;
  runId: string;
  targetKey: string;
}

const createRunId = (): string => crypto.randomUUID();
const activeLeaseRunIds = new Set<string>();
const getStorageKey = (targetKey: string): string => `${REFACTOR_CONSTANTS.PIPELINE_RUN_LOCK_PREFIX}${targetKey}`;

const readLock = (targetKey: string): PipelineRunLock | null =>
  jsonUtils.getItem<PipelineRunLock | null>(getStorageKey(targetKey), null);

const isActiveLock = (lock: PipelineRunLock | null): lock is PipelineRunLock =>
  Boolean(lock && _.gt(lock.expiresAt, Date.now()));

const getOwnerId = (): string => {
  const existingOwnerId = sessionStorage.getItem(REFACTOR_CONSTANTS.PIPELINE_RUN_OWNER_KEY);
  if (!_.isEmpty(existingOwnerId)) return existingOwnerId!;
  const ownerId = createRunId();
  sessionStorage.setItem(REFACTOR_CONSTANTS.PIPELINE_RUN_OWNER_KEY, ownerId);
  return ownerId;
};

export const acquirePipelineRunLease = (targetKey: string): PipelineRunLease => {
  const normalizedTargetKey = _.trim(targetKey);
  const existingLock = readLock(normalizedTargetKey);
  const ownerId = getOwnerId();
  if (isActiveLock(existingLock) && !_.isEmpty(existingLock.ownerId)) {
    const ownedActiveLease = _.isEqual(existingLock.ownerId, ownerId)
      && activeLeaseRunIds.has(existingLock.runId);
    if (ownedActiveLease || !_.isEqual(existingLock.ownerId, ownerId)) {
      return { acquired: false, runId: existingLock.runId, targetKey: normalizedTargetKey };
    }
  }
  const runId = createRunId();
  const lock: PipelineRunLock = {
    runId,
    targetKey: normalizedTargetKey,
    ownerId,
    expiresAt: _.add(Date.now(), REFACTOR_CONSTANTS.PIPELINE_RUN_LOCK_TTL_MS),
  };
  jsonUtils.setItem(getStorageKey(normalizedTargetKey), lock);
  const acquired = _.isEqual(readLock(normalizedTargetKey)?.runId, runId);
  if (acquired) activeLeaseRunIds.add(runId);
  return { acquired, runId, targetKey: normalizedTargetKey };
};

export const refreshPipelineRunLease = (lease: PipelineRunLease): boolean => {
  const currentLock = readLock(lease.targetKey);
  if (!_.isEqual(currentLock?.runId, lease.runId)) return false;
  jsonUtils.setItem(
    getStorageKey(lease.targetKey),
    { ...currentLock, expiresAt: _.add(Date.now(), REFACTOR_CONSTANTS.PIPELINE_RUN_LOCK_TTL_MS) },
  );
  return true;
};

export const releasePipelineRunLease = (lease: PipelineRunLease): void => {
  if (_.isEqual(readLock(lease.targetKey)?.runId, lease.runId)) {
    jsonUtils.removeItem(getStorageKey(lease.targetKey));
  }
  activeLeaseRunIds.delete(lease.runId);
};
