import { FINAL_MULTIMODAL_QA_CONFIG } from "../constants";
import { FinalMultimodalQualityReport } from "../types";
export const createAdvisoryFinalVideoReport = (): FinalMultimodalQualityReport => ({ visualScore: 0, cropScore: 0, continuityScore: 0, pacingScore: 0, transitionVarietyScore: 0, promiseAlignmentScore: 0, audioMixScore: 0, subtitleLegibilityScore: 0, blockingErrors: [], warnings: [FINAL_MULTIMODAL_QA_CONFIG.UNAVAILABLE_WARNING], passed: true, reviewAvailable: false });
