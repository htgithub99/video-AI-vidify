import { PROVIDER_REFERENCE_UPLOAD_CONFIG } from "../../constants/config.js";

export interface FlowReferenceAttachmentState {
  count: number;
  uploadPending: boolean;
}

export const waitForFlowReferenceReadiness = async (
  expectedCount: number,
  readState: () => Promise<FlowReferenceAttachmentState>,
  wait: () => Promise<void>,
  now: () => number = Date.now,
): Promise<boolean> => {
  const startedAt = now();
  let stablePolls = 0;
  while (now() - startedAt < PROVIDER_REFERENCE_UPLOAD_CONFIG.FLOW_REFERENCE_READY_TIMEOUT_MS) {
    const state = await readState();
    stablePolls = state.count >= expectedCount && !state.uploadPending ? stablePolls + 1 : 0;
    if (stablePolls >= PROVIDER_REFERENCE_UPLOAD_CONFIG.FLOW_REFERENCE_STABLE_POLLS) return true;
    await wait();
  }
  return false;
};
