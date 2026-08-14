import _ from "lodash";
import { AUDIO_QUALITY_CONFIG } from "../constants";
import { AudioQualityReport } from "../types";
import { evaluateAudioTiming } from "./productionQualityService";

export const createAdvisoryAudioQuality = (
  actualDurationSeconds: number,
  targetDurationSeconds: number,
): AudioQualityReport => {
  const timing = evaluateAudioTiming(actualDurationSeconds, targetDurationSeconds);
  return {
    ...timing,
    warnings: _.uniq([...timing.warnings, AUDIO_QUALITY_CONFIG.QA_UNAVAILABLE_ERROR]),
    passed: _.isEmpty(timing.blockingErrors),
  };
};
