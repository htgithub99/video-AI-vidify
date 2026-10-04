import { SOURCE_TEMPLATE_SYMBOL_36, SOURCE_TEMPLATE_SYMBOL_39, SOURCE_TEMPLATE_SYMBOL_7, SOURCE_TEMPLATE_SYMBOL_8, SOURCE_TEXT_0, SOURCE_TEXT_00_00, SOURCE_TEXT_SYMBOL_16, SOURCE_TEXT_SYMBOL_23 } from "../constants/sourceText";
import _ from "lodash";
const DEFAULT_TIME_STRING = SOURCE_TEXT_00_00;
const SECONDS_IN_HOUR = 3600;
const SECONDS_IN_MINUTE = 60;
const TIME_PAD_LENGTH = 2;
export const parseTimeToSeconds = (timeStr: string | undefined): number | null => {
  if (_.isEmpty(timeStr)) return null;
  const parts = _.split(_.trim(timeStr), SOURCE_TEXT_SYMBOL_16);
  let secs = 0;
  if (_.eq(parts.length, 3)) {
    secs = parseFloat(parts[0]) * SECONDS_IN_HOUR + parseFloat(parts[1]) * SECONDS_IN_MINUTE + parseFloat(parts[2]);
  } else if (_.eq(parts.length, 2)) {
    secs = parseFloat(parts[0]) * SECONDS_IN_MINUTE + parseFloat(parts[1]);
  } else if (_.eq(parts.length, 1)) {
    secs = parseFloat(parts[0]);
  }
  return _.isNaN(secs) ? null : secs;
};
export const formatCleanTime = (val: string | number | undefined): string => {
  if (_.isNil(val)) return DEFAULT_TIME_STRING;
  if (_.isNumber(val)) {
    const roundedVal = Math.round(val);
    const hours = _.floor(roundedVal / SECONDS_IN_HOUR);
    const minutes = _.floor((roundedVal % SECONDS_IN_HOUR) / SECONDS_IN_MINUTE);
    const seconds = _.floor(roundedVal % SECONDS_IN_MINUTE);
    if (_.gt(hours, 0)) {
      return SOURCE_TEMPLATE_SYMBOL_7(`${hours.toString().padStart(TIME_PAD_LENGTH, SOURCE_TEXT_0)}`, `${minutes.toString().padStart(TIME_PAD_LENGTH, SOURCE_TEXT_0)}`, `${seconds.toString().padStart(TIME_PAD_LENGTH, SOURCE_TEXT_0)}`);
    }
    return SOURCE_TEMPLATE_SYMBOL_8(`${minutes.toString().padStart(TIME_PAD_LENGTH, SOURCE_TEXT_0)}`, `${seconds.toString().padStart(TIME_PAD_LENGTH, SOURCE_TEXT_0)}`);
  }
  if (_.isEmpty(val)) return DEFAULT_TIME_STRING;
  const secs = parseTimeToSeconds(val);
  if (_.isNull(secs)) return val;
  const roundedSecs = Math.round(secs);
  const minutes = _.floor(roundedSecs / SECONDS_IN_MINUTE);
  const remainingSecs = roundedSecs % SECONDS_IN_MINUTE;
  const rSecsFormatted = remainingSecs.toString().padStart(TIME_PAD_LENGTH, SOURCE_TEXT_0);
  return SOURCE_TEMPLATE_SYMBOL_8(`${minutes.toString().padStart(TIME_PAD_LENGTH, SOURCE_TEXT_0)}`, `${rSecsFormatted}`);
};
export const formatCleanDuration = (secsRaw: any): string => {
  if (_.isNil(secsRaw)) return DEFAULT_TIME_STRING;
  const secs = _.isString(secsRaw) ? parseFloat(secsRaw) : secsRaw;
  if (_.isNaN(secs) || !isFinite(secs) || _.lt(secs, 0)) return DEFAULT_TIME_STRING;
  const m = _.floor(secs / SECONDS_IN_MINUTE);
  const s = _.floor(secs % SECONDS_IN_MINUTE);
  return SOURCE_TEMPLATE_SYMBOL_8(`${m.toString().padStart(TIME_PAD_LENGTH, SOURCE_TEXT_0)}`, `${s.toString().padStart(TIME_PAD_LENGTH, SOURCE_TEXT_0)}`);
};
export const formatAudioTime = (secs: number): string => {
  if (_.isNaN(secs) || !isFinite(secs) || _.lt(secs, 0)) return DEFAULT_TIME_STRING;
  const m = _.floor(secs / SECONDS_IN_MINUTE);
  const s = _.floor(secs % SECONDS_IN_MINUTE);
  return SOURCE_TEMPLATE_SYMBOL_8(`${m.toString().padStart(TIME_PAD_LENGTH, SOURCE_TEXT_0)}`, `${s.toString().padStart(TIME_PAD_LENGTH, SOURCE_TEXT_0)}`);
};
export const formatTimeHelper = (secs: number): string => {
  const minutes = _.floor(secs / SECONDS_IN_MINUTE);
  const remainingSecs = secs % SECONDS_IN_MINUTE;
  const roundedSecs = _.round(remainingSecs, 3);
  const parts = _.split(_.toString(roundedSecs), SOURCE_TEXT_SYMBOL_23);
  const integerPart = parts[0].padStart(TIME_PAD_LENGTH, SOURCE_TEXT_0);
  const decimalPart = parts[1] ? SOURCE_TEMPLATE_SYMBOL_36(`${parts[1]}`) : "";
  return SOURCE_TEMPLATE_SYMBOL_39(`${minutes.toString().padStart(TIME_PAD_LENGTH, SOURCE_TEXT_0)}`, `${integerPart}`, `${decimalPart}`);
};
