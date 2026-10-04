import {
  SOURCE_TEMPLATE_API_ERROR_AT,
  SOURCE_TEMPLATE_SYMBOL_8,
  SOURCE_TEXT_0,
  SOURCE_TEXT_00_00,
  SOURCE_TEXT_ASSETS,
  SOURCE_TEXT_CHAPTERS,
  SOURCE_TEXT_CHILD,
  SOURCE_TEXT_CONFIG,
  SOURCE_TEXT_CREDITSUSED,
  SOURCE_TEXT_CURRENTSTEP,
  SOURCE_TEXT_DESCRIPTION,
  SOURCE_TEXT_HOOKCONFIG,
  SOURCE_TEXT_INPUT,
  SOURCE_TEXT_NAME,
  SOURCE_TEXT_NEUTRAL,
  SOURCE_TEXT_PRESET_VI_KID,
  SOURCE_TEXT_SEO,
  SOURCE_TEXT_SEOCONFIG,
  SOURCE_TEXT_STORYBOARD,
  SOURCE_TEXT_STORYBOARDSOURCEMODE,
  SOURCE_TEXT_THUMBNAILS,
  SOURCE_TEXT_VISUALCONFIG,
  SOURCE_TEXT_VOICECONFIG,
} from "../../constants/sourceText";
import _ from "lodash";
import { REFACTOR_CONSTANTS } from "../../constants";
import { VOICE_MODIFIERS } from "../../constants/defaultConfigs";
import { CONTENT_TYPES, HTTP_HEADERS, HTTP_METHODS } from "../../constants/texts";
import { jsonUtils } from "../../lib/json";
import { createAuthenticatedHeaders } from "../../lib/shared-utils";
import { parseTimeToSeconds } from "../../lib/timeUtils.js";
import { logger } from "../../utils/logger";
interface VoiceReference {
  gender?: string;
  name?: string;
  provider?: string;
}
type RequestPayload = Record<string, unknown>;
type RequestHeaders = Record<string, string>;
const PIPELINE_CONTENT_FIELDS = [
  SOURCE_TEXT_NAME,
  SOURCE_TEXT_DESCRIPTION,
  SOURCE_TEXT_INPUT,
  SOURCE_TEXT_CONFIG,
  SOURCE_TEXT_HOOKCONFIG,
  SOURCE_TEXT_VOICECONFIG,
  SOURCE_TEXT_VISUALCONFIG,
  SOURCE_TEXT_STORYBOARD,
  SOURCE_TEXT_THUMBNAILS,
  SOURCE_TEXT_CHAPTERS,
  SOURCE_TEXT_SEOCONFIG,
  SOURCE_TEXT_SEO,
  SOURCE_TEXT_ASSETS,
  SOURCE_TEXT_CURRENTSTEP,
  SOURCE_TEXT_CREDITSUSED,
  SOURCE_TEXT_STORYBOARDSOURCEMODE,
];
const DEFAULT_VOICE_SPEED = 1;
const DEFAULT_VOICE_PITCH = 1;
const DEFAULT_VOICE_GENDER = SOURCE_TEXT_NEUTRAL;
const CHILD_VOICE_MARKER = SOURCE_TEXT_CHILD;
const CHILD_VOICE_PRESET = SOURCE_TEXT_PRESET_VI_KID;
const EMPTY_TIME = SOURCE_TEXT_00_00;
const TIME_PADDING_LENGTH = 2;
const SECONDS_PER_MINUTE = 60;
const isEmptyProjectValue = (value: unknown): boolean => _.includes([undefined, null, REFACTOR_CONSTANTS.VD_EMPTY_STRING], value) || (_.isArray(value) && _.isEmpty(value)) || (_.isObject(value) && _.isEmpty(value));
export const getVoiceGender = (voice: VoiceReference): any => voice?.gender?.toLowerCase() || DEFAULT_VOICE_GENDER;
export const isPremiumVoice = (voice: VoiceReference | string): boolean => {
  const voiceName = _.isString(voice) ? voice : voice?.name;
  return !_.isEmpty(voiceName);
};
export const getVoiceModifiers = (voiceUri: string, baseSpeed: number = DEFAULT_VOICE_SPEED, basePitch: number = DEFAULT_VOICE_PITCH): { finalSpeed: number; finalPitch: number } => {
  if (_.isEmpty(voiceUri)) return { finalSpeed: baseSpeed, finalPitch: basePitch };
  const modifiers = VOICE_MODIFIERS[voiceUri] || (_.includes(voiceUri, CHILD_VOICE_MARKER) ? VOICE_MODIFIERS[CHILD_VOICE_PRESET] : null);
  return modifiers ? { finalSpeed: modifiers.speed, finalPitch: modifiers.pitch } : { finalSpeed: baseSpeed, finalPitch: basePitch };
};
export const safeResponseJson = async (response: Response, fallback: any): Promise<any> => {
  try {
    return await response.json();
  } catch {
    return fallback;
  }
};
export const fetchSystemApi = async (url: string, payload?: RequestPayload | null, customHeaders?: RequestHeaders): Promise<Response> => {
  const headers = createAuthenticatedHeaders(
    _.assign(
      {
        [HTTP_HEADERS.CONTENT_TYPE]: CONTENT_TYPES.JSON,
      },
      customHeaders,
    ),
  );
  const options: RequestInit = {
    method: _.isNil(payload) ? HTTP_METHODS.GET : HTTP_METHODS.POST,
    headers,
  };
  if (!_.isNil(payload)) options.body = jsonUtils.safeStringify(payload);
  return fetch(url, options);
};
export const safeFetchJsonWithAuth = async (url: string, payload?: RequestPayload | null, fallback: any = {}): Promise<any> => {
  try {
    return await safeResponseJson(await fetchSystemApi(url, payload), fallback);
  } catch (error) {
    logger.error(SOURCE_TEMPLATE_API_ERROR_AT(`${url}`), error);
    return fallback;
  }
};
export const formatRoundedTime = (time: string): string => {
  if (_.isEmpty(time)) return EMPTY_TIME;
  const seconds = parseTimeToSeconds(time);
  if (_.isNil(seconds)) return time;
  const roundedSeconds = Math.round(seconds);
  const minutes = Math.floor(roundedSeconds / SECONDS_PER_MINUTE);
  const remainingSeconds = roundedSeconds % SECONDS_PER_MINUTE;
  return SOURCE_TEMPLATE_SYMBOL_8(`${minutes.toString().padStart(TIME_PADDING_LENGTH, SOURCE_TEXT_0)}`, `${remainingSeconds.toString().padStart(TIME_PADDING_LENGTH, SOURCE_TEXT_0)}`);
};
export const isProjectContentEqual = (firstProject: any, secondProject: any): boolean => {
  if (!firstProject || !secondProject) return firstProject === secondProject;
  return _.every(PIPELINE_CONTENT_FIELDS, (field) => {
    const firstValue = firstProject[field];
    const secondValue = secondProject[field];
    return _.isEqual(firstValue, secondValue) || (isEmptyProjectValue(firstValue) && isEmptyProjectValue(secondValue));
  });
};
