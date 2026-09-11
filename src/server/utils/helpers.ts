import { appLog } from "../../lib/logger.js";
import _ from "lodash";

const parseJSON = (text: string, logFailure: boolean): unknown => {
  if (_.isEmpty(text)) return undefined;
  const trimmed = _.trim(text);
  if (_.includes(["", "undefined", "null"], trimmed)) {
    return undefined;
  }
  const parsed = _.attempt(JSON.parse, trimmed);
  if (!_.isError(parsed)) return parsed;

  if (logFailure) appLog("JSON_PARSE_WARNING", text.substring(0, 150) + "...");
  return undefined;
};

export const safeParseJSON = (text: string, _defaultVal: any): any => {
  const parsed = parseJSON(text, true);
  if (_.isUndefined(parsed)) throw new Error("invalid_ai_json_response");
  return parsed;
};

export const tryParseJSON = (text: string): unknown => parseJSON(text, false);

export const formatTime = (secs: number): string => {
  const totalSecs = _.round(secs);
  const minutes = _.floor(totalSecs / 60);
  const remainingSecs = totalSecs % 60;
  return `${_.padStart(_.toString(minutes), 2, "0")}:${_.padStart(_.toString(remainingSecs), 2, "0")}`;
};
