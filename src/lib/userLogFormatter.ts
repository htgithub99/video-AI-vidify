import _ from "lodash";
import { USER_LOG_CONFIG, USER_LOG_MESSAGES } from "../constants/userLog";

export type UserLogLanguage = keyof typeof USER_LOG_MESSAGES;

const normalizeLanguage = (language?: string): UserLogLanguage => (
  _.startsWith(_.toLower(language), "en") ? "en" : "vi"
);

const shortenMessage = (message: string): string => {
  if (message.length <= USER_LOG_CONFIG.MAX_MESSAGE_LENGTH) return message;
  const shortened = _.trim(message.slice(0, USER_LOG_CONFIG.MAX_MESSAGE_LENGTH));
  const lastSpaceIndex = shortened.lastIndexOf(" ");
  return `${lastSpaceIndex > 0 ? shortened.slice(0, lastSpaceIndex) : shortened}…`;
};

const removeTechnicalDetails = (message: string): string => _.trim(
  message
    .replace(USER_LOG_CONFIG.TECHNICAL_PREFIX_PATTERN, "")
    .replace(USER_LOG_CONFIG.URL_PATTERN, "")
    .replace(USER_LOG_CONFIG.API_ROUTE_PATTERN, "")
    .replace(USER_LOG_CONFIG.WINDOWS_PATH_PATTERN, "")
    .replace(USER_LOG_CONFIG.SOURCE_LOCATION_PATTERN, "")
    .replace(USER_LOG_CONFIG.STACK_TRACE_PATTERN, "")
    .replace(USER_LOG_CONFIG.HTTP_STATUS_PATTERN, "")
    .replace(USER_LOG_CONFIG.ERROR_CODE_PATTERN, "")
    .replace(USER_LOG_CONFIG.MULTIPLE_SPACES_PATTERN, " "),
);

export const formatUserFacingLog = (value: unknown, language?: string): string => {
  const rawMessage = _.trim(_.toString(value));
  const messages = USER_LOG_MESSAGES[normalizeLanguage(language)];
  if (_.isEmpty(rawMessage)) return messages.PROCESSING;
  if (USER_LOG_CONFIG.CONNECTION_ERROR_PATTERN.test(rawMessage)) return messages.CONFIG_REQUIRED;
  if (USER_LOG_CONFIG.CAPACITY_ERROR_PATTERN.test(rawMessage)) return messages.SERVICE_BUSY;
  if (USER_LOG_CONFIG.TRANSIENT_ERROR_PATTERN.test(rawMessage)) return messages.TEMPORARY_ISSUE;
  if (USER_LOG_CONFIG.CALLING_PATTERN.test(rawMessage)) return messages.CONNECTING;
  if (USER_LOG_CONFIG.SUCCESS_PATTERN.test(rawMessage) && USER_LOG_CONFIG.TECHNICAL_TERMS_PATTERN.test(rawMessage)) return messages.CONNECTED;
  if (USER_LOG_CONFIG.IMAGE_TOOL_PATTERN.test(rawMessage)) return messages.IMAGE_PROCESSING;
  if (USER_LOG_CONFIG.INTERNAL_ERROR_PATTERN.test(rawMessage) && USER_LOG_CONFIG.VOICE_PATTERN.test(rawMessage)) return messages.GENERAL_ERROR;
  if (USER_LOG_CONFIG.INTERNAL_ERROR_PATTERN.test(rawMessage) && USER_LOG_CONFIG.RENDER_PATTERN.test(rawMessage)) return messages.GENERAL_ERROR;
  if (USER_LOG_CONFIG.JSON_PAYLOAD_PATTERN.test(rawMessage)) return messages.PROCESSING;
  if (USER_LOG_CONFIG.STACK_TRACE_PATTERN.test(rawMessage)) return messages.GENERAL_ERROR;

  const cleanMessage = removeTechnicalDetails(rawMessage);
  if (_.isEmpty(cleanMessage)) return messages.PROCESSING;
  if (USER_LOG_CONFIG.INTERNAL_ERROR_PATTERN.test(cleanMessage) && USER_LOG_CONFIG.TECHNICAL_TERMS_PATTERN.test(rawMessage)) {
    return messages.GENERAL_ERROR;
  }
  if (USER_LOG_CONFIG.TECHNICAL_TERMS_PATTERN.test(cleanMessage)) {
    if (USER_LOG_CONFIG.VOICE_PATTERN.test(cleanMessage)) return messages.VOICE_PROCESSING;
    if (USER_LOG_CONFIG.RENDER_PATTERN.test(cleanMessage)) return messages.RENDER_PROCESSING;
    return messages.PROCESSING;
  }
  return shortenMessage(cleanMessage);
};

export const getUserLogBadges = (language?: string) => USER_LOG_MESSAGES[normalizeLanguage(language)];
