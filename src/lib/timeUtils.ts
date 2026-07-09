import { isEmpty, split, trim, eq, isNaN, isNil, isNumber, floor, gt, isNull, isString, lt, round, padStart, toString } from "lodash";

export const parseTimeToSeconds = (timeStr: string | undefined): number | null => {
  if (isEmpty(timeStr)) return null;

  const parts = split(trim(timeStr), ":");
  let secs = 0;
  if (eq(parts.length, 3)) {
    secs = parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60 + parseFloat(parts[2]);
  } else if (eq(parts.length, 2)) {
    secs = parseFloat(parts[0]) * 60 + parseFloat(parts[1]);
  } else if (eq(parts.length, 1)) {
    secs = parseFloat(parts[0]);
  }
  return isNaN(secs) ? null : secs;
};

export const formatCleanTime = (val: string | number | undefined): string => {
  if (isNil(val)) return "00:00";
  if (isNumber(val)) {
    const hours = floor(val / 3600);
    const minutes = floor((val % 3600) / 60);
    const seconds = floor(val % 60);
    if (gt(hours, 0)) {
      return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    }
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }
  if (isEmpty(val)) return "00:00";
  const secs = parseTimeToSeconds(val);
  if (isNull(secs)) return val;
  const minutes = floor(secs / 60);
  const remainingSecs = secs % 60;
  const rSecsFormatted = eq(remainingSecs % 1, 0) ? remainingSecs.toFixed(0).padStart(2, "0") : parseFloat(remainingSecs.toFixed(1)).toString().padStart(2, "0");

  return `${minutes.toString().padStart(2, "0")}:${rSecsFormatted}`;
};

export const formatCleanDuration = (secsRaw: any): string => {
  if (isNil(secsRaw)) return "00:00";
  const secs = isString(secsRaw) ? parseFloat(secsRaw) : secsRaw;
  if (isNaN(secs) || !isFinite(secs) || lt(secs, 0)) return "00:00";
  const m = floor(secs / 60);
  const s = floor(secs % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
};

export const formatAudioTime = (secs: number) => {
  if (isNaN(secs) || !isFinite(secs) || lt(secs, 0)) return "00:00";
  const m = floor(secs / 60);
  const s = floor(secs % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
};

export const formatTimeHelper = (secs: number): string => {
  const minutes = floor(secs / 60);
  const remainingSecs = secs % 60;
  const roundedSecs = round(remainingSecs, 3);
  const parts = split(toString(roundedSecs), ".");
  const integerPart = parts[0].padStart(2, "0");
  const decimalPart = parts[1] ? `.${parts[1]}` : "";
  return `${minutes.toString().padStart(2, "0")}:${integerPart}${decimalPart}`;
};
