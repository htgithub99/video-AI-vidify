import _ from "lodash";
import { USER_LOG_CONFIG, USER_LOG_MESSAGES } from "../constants/userLog";

export type UserLogLanguage = keyof typeof USER_LOG_MESSAGES;

const normalizeLanguage = (language?: string): UserLogLanguage => (_.startsWith(_.toLower(language), "en") ? "en" : "vi");

const shortenMessage = (message: string): string => {
  if (message.length <= USER_LOG_CONFIG.MAX_MESSAGE_LENGTH) return message;
  const shortened = _.trim(message.slice(0, USER_LOG_CONFIG.MAX_MESSAGE_LENGTH));
  const lastSpaceIndex = shortened.lastIndexOf(" ");
  return `${lastSpaceIndex > 0 ? shortened.slice(0, lastSpaceIndex) : shortened}…`;
};

const replaceToken = (message: string, token: string, value: string): string => message.replace(token, value);

const getSceneLabel = (message: string, language: UserLogLanguage): string => {
  const messages = USER_LOG_MESSAGES[language];
  const sceneNumber = message.match(USER_LOG_CONFIG.SCENE_ID_PATTERN)?.[1];
  if (!sceneNumber) return messages.THIS_SCENE;
  return replaceToken(messages.SCENE_NUMBER, "{number}", _.toString(Number(sceneNumber)));
};

const getAttemptLabel = (message: string, language: UserLogLanguage): string => {
  const attempt = message.match(USER_LOG_CONFIG.RETRY_NUMBER_PATTERN)?.[1];
  if (!attempt) return "";
  return replaceToken(USER_LOG_MESSAGES[language].RETRY_ATTEMPT, "{number}", attempt);
};

const formatKnownPipelineLog = (rawMessage: string, language: UserLogLanguage): string | null => {
  const messages = USER_LOG_MESSAGES[language];
  const patterns = USER_LOG_CONFIG.PIPELINE_PATTERNS;

  if (patterns.FLOW_CONFIG_ERROR.test(rawMessage)) return messages.FLOW_CONFIG_ERROR;
  if (patterns.FLOW_PROMPT_ERROR.test(rawMessage)) return messages.FLOW_PROMPT_ERROR;
  if (patterns.FINAL_FAILURE.test(rawMessage)) return messages.FINAL_FAILURE;
  if (patterns.PREFLIGHT_ADVISORY.test(rawMessage)) return replaceToken(messages.REVIEW_ADVISORY, "{scene}", getSceneLabel(rawMessage, language));
  if (patterns.PREFLIGHT_PASSED.test(rawMessage)) return messages.REVIEW_PASSED;
  if (patterns.PREFLIGHT_START.test(rawMessage)) return messages.REVIEW_PROCESSING;

  if (patterns.RETRY.test(rawMessage)) {
    return replaceToken(messages.AI_COMPLETING, "{attempt}", getAttemptLabel(rawMessage, language));
  }
  if (patterns.ROOM_NOT_READY.test(rawMessage)) return messages.ROOM_NOT_READY;
  if (patterns.INCOMPLETE_AI_OUTPUT.test(rawMessage)) return messages.AI_INCOMPLETE;

  const isFailure = USER_LOG_CONFIG.INTERNAL_ERROR_PATTERN.test(rawMessage);
  if (isFailure) {
    if (patterns.CHARACTER_STAGE.test(rawMessage)) return messages.CHARACTER_FAILED;
    if (patterns.STORYBOARD_STAGE.test(rawMessage)) return messages.STORYBOARD_FAILED;
    if (patterns.PROMPT_STAGE.test(rawMessage)) return messages.PROMPT_FAILED;
    if (patterns.SCRIPT_STAGE.test(rawMessage)) return messages.SCRIPT_FAILED;
    if (patterns.SEO_STAGE.test(rawMessage)) return messages.SEO_FAILED;
    if (patterns.THUMBNAIL_STAGE.test(rawMessage)) return messages.THUMBNAIL_FAILED;
    if (patterns.VIDEO_STAGE.test(rawMessage)) return messages.VIDEO_FAILED;
  }

  const isSuccess = USER_LOG_CONFIG.SUCCESS_PATTERN.test(rawMessage);
  if (isSuccess) {
    if (patterns.CHARACTER_STAGE.test(rawMessage)) return messages.CHARACTER_READY;
    if (patterns.STORYBOARD_STAGE.test(rawMessage)) return messages.STORYBOARD_READY;
    if (patterns.PROMPT_STAGE.test(rawMessage)) return messages.PROMPT_READY;
    if (patterns.SCRIPT_STAGE.test(rawMessage)) return messages.SCRIPT_READY;
    if (patterns.SEO_STAGE.test(rawMessage)) return messages.SEO_READY;
    if (patterns.THUMBNAIL_STAGE.test(rawMessage)) return messages.THUMBNAIL_READY;
  }

  if (patterns.CHARACTER_STAGE.test(rawMessage)) return messages.CHARACTER_PROCESSING;
  if (patterns.STORYBOARD_STAGE.test(rawMessage)) return messages.STORYBOARD_PROCESSING;
  if (patterns.PROMPT_STAGE.test(rawMessage)) return messages.PROMPT_PROCESSING;
  if (patterns.SCRIPT_STAGE.test(rawMessage)) return messages.SCRIPT_PROCESSING;
  if (patterns.SEO_STAGE.test(rawMessage)) return messages.SEO_PROCESSING;
  if (patterns.THUMBNAIL_STAGE.test(rawMessage)) return messages.THUMBNAIL_PROCESSING;
  if (patterns.VIDEO_STAGE.test(rawMessage)) return messages.VIDEO_PROCESSING;
  return null;
};

const sanitizeTechnicalText = (message: string): string =>
  _.trim(
    message
      .replace(USER_LOG_CONFIG.TECHNICAL_PREFIX_PATTERN, "")
      .replace(USER_LOG_CONFIG.URL_PATTERN, "")
      .replace(USER_LOG_CONFIG.API_ROUTE_PATTERN, "")
      .replace(USER_LOG_CONFIG.WINDOWS_PATH_PATTERN, "")
      .replace(USER_LOG_CONFIG.UNIX_PATH_PATTERN, "")
      .replace(USER_LOG_CONFIG.SOURCE_LOCATION_PATTERN, "")
      .replace(USER_LOG_CONFIG.STACK_TRACE_PATTERN, "")
      .replace(USER_LOG_CONFIG.HTTP_STATUS_PATTERN, "")
      .replace(USER_LOG_CONFIG.ERROR_CODE_PATTERN, "")
      .replace(USER_LOG_CONFIG.SELECTOR_PATTERN, "")
      .replace(USER_LOG_CONFIG.CODE_KEYWORD_PATTERN, "")
      .replace(USER_LOG_CONFIG.MULTIPLE_SPACES_PATTERN, " "),
  );

export const formatUserFacingLog = (value: unknown, language?: string): string => {
  const rawMessage = _.trim(_.toString(value));
  const normalizedLanguage = normalizeLanguage(language);
  const messages = USER_LOG_MESSAGES[normalizedLanguage];

  if (_.isEmpty(rawMessage)) return messages.PROCESSING;

  if (USER_LOG_CONFIG.CONNECTION_ERROR_PATTERN.test(rawMessage)) return messages.CONFIG_REQUIRED;
  if (USER_LOG_CONFIG.CAPACITY_ERROR_PATTERN.test(rawMessage)) return messages.SERVICE_BUSY;
  if (USER_LOG_CONFIG.TRANSIENT_ERROR_PATTERN.test(rawMessage)) return messages.TEMPORARY_ISSUE;
  if (USER_LOG_CONFIG.CALLING_PATTERN.test(rawMessage)) return messages.CONNECTING;

  const knownPipelineMessage = formatKnownPipelineLog(rawMessage, normalizedLanguage);
  if (knownPipelineMessage) return knownPipelineMessage;
  if (USER_LOG_CONFIG.SUCCESS_PATTERN.test(rawMessage) && USER_LOG_CONFIG.TECHNICAL_TERMS_PATTERN.test(rawMessage)) return messages.CONNECTED;
  if (USER_LOG_CONFIG.IMAGE_TOOL_PATTERN.test(rawMessage)) return messages.IMAGE_PROCESSING;
  if (USER_LOG_CONFIG.VOICE_PATTERN.test(rawMessage) && USER_LOG_CONFIG.INTERNAL_ERROR_PATTERN.test(rawMessage)) return messages.GENERAL_ERROR;
  if (USER_LOG_CONFIG.RENDER_PATTERN.test(rawMessage) && USER_LOG_CONFIG.INTERNAL_ERROR_PATTERN.test(rawMessage)) return messages.GENERAL_ERROR;
  if (USER_LOG_CONFIG.JSON_PAYLOAD_PATTERN.test(rawMessage) || USER_LOG_CONFIG.STACK_TRACE_PATTERN.test(rawMessage)) return messages.PROCESSING;

  const cleanMessage = sanitizeTechnicalText(rawMessage);
  if (_.isEmpty(cleanMessage)) return messages.PROCESSING;

  if (USER_LOG_CONFIG.TECHNICAL_TERMS_PATTERN.test(cleanMessage) || USER_LOG_CONFIG.CODE_KEYWORD_PATTERN.test(cleanMessage)) {
    if (USER_LOG_CONFIG.VOICE_PATTERN.test(cleanMessage)) return messages.VOICE_PROCESSING;
    if (USER_LOG_CONFIG.RENDER_PATTERN.test(cleanMessage)) return messages.RENDER_PROCESSING;
    if (USER_LOG_CONFIG.INTERNAL_ERROR_PATTERN.test(cleanMessage)) return messages.GENERAL_ERROR;
    return messages.PROCESSING;
  }

  return shortenMessage(cleanMessage);
};

export const getUserLogBadges = (language?: string) => USER_LOG_MESSAGES[normalizeLanguage(language)];

export const formatUserFacingLogs = (values: unknown[], language?: string): string[] =>
  _.reduce(
    values,
    (formattedLogs: string[], value) => {
      const rawLog = _.toString(value);
      const timePrefix = rawLog.match(USER_LOG_CONFIG.STORED_TIME_PATTERN)?.[1] || "";
      const rawMessage = rawLog.replace(USER_LOG_CONFIG.STORED_TIME_PATTERN, "");
      const userMessage = formatUserFacingLog(rawMessage, language);
      const previousMessage = _.toString(_.last(formattedLogs)).replace(USER_LOG_CONFIG.STORED_TIME_PATTERN, "");
      if (_.isEqual(previousMessage, userMessage)) return formattedLogs;
      return _.concat(formattedLogs, `${timePrefix}${userMessage}`);
    },
    [],
  );
