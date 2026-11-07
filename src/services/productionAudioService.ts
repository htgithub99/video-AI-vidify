import _ from "lodash";
import { PRODUCTION_AUDIO_CONFIG } from "../constants/config.js";
export const isBlockedAudioSource = (value?: string): boolean => _.includes(PRODUCTION_AUDIO_CONFIG.BLOCKED_SOURCE_VALUES, _.trim(_.toString(value)));
export const isProductionAudioSource = (value?: string): boolean => _.every([!_.isEmpty(_.trim(_.toString(value))), !isBlockedAudioSource(value)], Boolean);
export const hasProductionAudioSource = (values: Array<string | undefined>): boolean => _.some(values, isProductionAudioSource);
