import _ from "lodash";
import { API_HEADERS, REFACTOR_CONSTANTS, STORAGE_KEYS } from "../../constants";
import { VOICE_MODIFIERS } from "../../constants/defaultConfigs";
import {
  CONTENT_TYPES,
  HTTP_HEADERS,
  HTTP_METHODS,
} from "../../constants/texts";
import { jsonUtils } from "../../lib/json";
import { getStoredApiKey } from "../../lib/shared-utils";
import { parseTimeToSeconds } from "../../lib/timeUtils.js";
import { logger } from "../../utils/logger";

interface VoiceReference {
  gender?: string;
  name?: string;
}

type RequestPayload = Record<string, unknown>;
type RequestHeaders = Record<string, string>;

const PIPELINE_CONTENT_FIELDS = [
  "name",
  "description",
  "input",
  "config",
  "hookConfig",
  "voiceConfig",
  "visualConfig",
  "storyboard",
  "thumbnails",
  "chapters",
  "seoConfig",
  "seo",
  "assets",
  "currentStep",
  "creditsUsed",
  "storyboardSourceMode",
];
const DEFAULT_VOICE_SPEED = 1;
const DEFAULT_VOICE_PITCH = 1;
const DEFAULT_VOICE_GENDER = "neutral";
const PREMIUM_VOICE_MARKER = "Premium";
const CHILD_VOICE_MARKER = "child";
const CHILD_VOICE_PRESET = "preset-vi-kid";
const EMPTY_TIME = "00:00";
const TIME_PADDING_LENGTH = 2;
const SECONDS_PER_MINUTE = 60;
const DEFAULT_TARGET_DURATION_SECONDS = 15;

const isEmptyProjectValue = (value: unknown): boolean =>
  _.includes([undefined, null, REFACTOR_CONSTANTS.VD_EMPTY_STRING], value) ||
  (_.isArray(value) && _.isEmpty(value)) ||
  (_.isObject(value) && _.isEmpty(value));

export const getVoiceGender = (voice: VoiceReference): any =>
  voice?.gender?.toLowerCase() || DEFAULT_VOICE_GENDER;
export const isPremiumVoice = (voice: VoiceReference | string): boolean =>
  _.includes(_.isString(voice) ? voice : voice?.name, PREMIUM_VOICE_MARKER);
export const getVoiceModifiers = (
  voiceUri: string,
  baseSpeed: number = DEFAULT_VOICE_SPEED,
  basePitch: number = DEFAULT_VOICE_PITCH,
): { finalSpeed: number; finalPitch: number } => {
  if (_.isEmpty(voiceUri))
    return { finalSpeed: baseSpeed, finalPitch: basePitch };
  const modifiers =
    VOICE_MODIFIERS[voiceUri] ||
    (_.includes(voiceUri, CHILD_VOICE_MARKER)
      ? VOICE_MODIFIERS[CHILD_VOICE_PRESET]
      : null);
  return modifiers
    ? { finalSpeed: modifiers.speed, finalPitch: modifiers.pitch }
    : { finalSpeed: baseSpeed, finalPitch: basePitch };
};
export const safeResponseJson = async (
  response: Response,
  fallback: any,
): Promise<any> => {
  try {
    return await response.json();
  } catch {
    return fallback;
  }
};
export const getTargetDurationSeconds = (): number =>
  DEFAULT_TARGET_DURATION_SECONDS;
export const fetchSystemApi = async (
  url: string,
  payload?: RequestPayload | null,
  customHeaders?: RequestHeaders,
): Promise<Response> => {
  const headers = _.assign(
    {
      [HTTP_HEADERS.CONTENT_TYPE]: CONTENT_TYPES.JSON,
      [API_HEADERS.GEMINI_API_KEY]: getStoredApiKey(
        STORAGE_KEYS.GEMINI_API_KEY,
      ),
      [API_HEADERS.CEREBRAS_API_KEY]: getStoredApiKey(
        STORAGE_KEYS.CEREBRAS_API_KEY,
      ),
      [API_HEADERS.GROQ_API_KEY]: getStoredApiKey(STORAGE_KEYS.GROQ_API_KEY),
      [API_HEADERS.AI33_API_KEY]: getStoredApiKey(STORAGE_KEYS.AI33_API_KEY),
      [API_HEADERS.LICENSE_KEY]: getStoredApiKey(STORAGE_KEYS.LICENSE_KEY),
    },
    customHeaders,
  );
  const options: RequestInit = {
    method: _.isNil(payload) ? HTTP_METHODS.GET : HTTP_METHODS.POST,
    headers,
  };
  if (!_.isNil(payload)) options.body = jsonUtils.safeStringify(payload);
  return fetch(url, options);
};
export const safeFetchJsonWithAuth = async (
  url: string,
  payload?: RequestPayload | null,
  fallback: any = {},
): Promise<any> => {
  try {
    return await safeResponseJson(await fetchSystemApi(url, payload), fallback);
  } catch (error) {
    logger.error(`API Error at ${url}`, error);
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
  return `${minutes.toString().padStart(TIME_PADDING_LENGTH, "0")}:${remainingSeconds.toString().padStart(TIME_PADDING_LENGTH, "0")}`;
};
export const isProjectContentEqual = (
  firstProject: any,
  secondProject: any,
): boolean => {
  if (!firstProject || !secondProject) return firstProject === secondProject;
  return _.every(PIPELINE_CONTENT_FIELDS, (field) => {
    const firstValue = firstProject[field];
    const secondValue = secondProject[field];
    return (
      _.isEqual(firstValue, secondValue) ||
      (isEmptyProjectValue(firstValue) && isEmptyProjectValue(secondValue))
    );
  });
};
