import { appLog } from "../../lib/logger.js";
import _ from "lodash";
import { BACKEND_MESSAGES } from "../../constants/messages.js";

const parseJSON = (text: string, logFailure: boolean): unknown => {
  if (_.isEmpty(text)) return undefined;
  const trimmed = _.trim(text);
  if (_.includes(["", "undefined", "null"], trimmed)) {
    return undefined;
  }
  const fencedCandidates = Array.from(trimmed.matchAll(/```(?:json)?\s*([\s\S]*?)```/gi), (match) => _.trim(match[1]));
  const objectStart = trimmed.indexOf("{");
  const objectEnd = trimmed.lastIndexOf("}");
  const arrayStart = trimmed.indexOf("[");
  const arrayEnd = trimmed.lastIndexOf("]");
  const candidates = _.uniq(_.compact([
    trimmed,
    ...fencedCandidates,
    objectStart >= 0 && objectEnd > objectStart ? trimmed.slice(objectStart, objectEnd + 1) : "",
    arrayStart >= 0 && arrayEnd > arrayStart ? trimmed.slice(arrayStart, arrayEnd + 1) : "",
  ]));
  for (const candidate of candidates) {
    const parsed = _.attempt(JSON.parse, candidate);
    if (!_.isError(parsed)) return parsed;
  }

  if (logFailure) appLog("JSON_PARSE_WARNING", text.substring(0, 150) + "...");
  return undefined;
};

export const safeParseJSON = (text: string, _defaultVal: any): any => {
  const parsed = parseJSON(text, true);
  if (_.isUndefined(parsed)) throw new Error(BACKEND_MESSAGES.INVALID_AI_JSON_RESPONSE);
  return parsed;
};

export const tryParseJSON = (text: string): unknown => parseJSON(text, false);

export const formatTime = (secs: number): string => {
  const totalSecs = _.round(secs);
  const minutes = _.floor(totalSecs / 60);
  const remainingSecs = totalSecs % 60;
  return `${_.padStart(_.toString(minutes), 2, "0")}:${_.padStart(_.toString(remainingSecs), 2, "0")}`;
};
