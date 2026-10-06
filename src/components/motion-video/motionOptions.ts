import _ from "lodash";
import { MOTION_TOON_OPTION_KEYS } from "../../constants/motionVideo.js";
import { MOTION_VIDEO_TEXTS, type MotionVideoTexts } from "../../constants/motionVideoTexts.js";
const mapMotionToonOptions = (options: readonly (readonly [string, keyof MotionVideoTexts])[], text: MotionVideoTexts, useFallback: boolean): [string, string][] => _.map(options, ([value, key]) => [value, (useFallback ? text[key] || MOTION_VIDEO_TEXTS.vi[key] : text[key]) as string]);
export const getMotionToonActions = (text: MotionVideoTexts, useFallback = false): [string, string][] => mapMotionToonOptions(MOTION_TOON_OPTION_KEYS.actions, text, useFallback);
export const getMotionToonTimes = (text: MotionVideoTexts, useFallback = false): [string, string][] => mapMotionToonOptions(MOTION_TOON_OPTION_KEYS.times, text, useFallback);
