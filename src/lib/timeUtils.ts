import _ from 'lodash';


export const parseTimeToSeconds = (timeStr: string | undefined): number | null => {
  if (_.isEmpty(timeStr)) return null;

  const parts = _.split(_.trim(timeStr), ":");
  let secs = 0;
  if (_.eq(parts.length, 3)) {
    secs = parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60 + parseFloat(parts[2]);
  } else if (_.eq(parts.length, 2)) {
    secs = parseFloat(parts[0]) * 60 + parseFloat(parts[1]);
  } else if (_.eq(parts.length, 1)) {
    secs = parseFloat(parts[0]);
  }
  return _.isNaN(secs) ? null : secs;
};

export const formatCleanTime = (val: string | number | undefined): string => {
  if (_.isNil(val)) return "00:00";
  if (_.isNumber(val)) {
    const hours = _.floor(val / 3600);
    const minutes = _.floor((val % 3600) / 60);
    const seconds = _.floor(val % 60);
    if (_.gt(hours, 0)) {
      return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    }
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }
  if (_.isEmpty(val)) return "00:00";
  const secs = parseTimeToSeconds(val);
  if (_.isNull(secs)) return val;
  const minutes = _.floor(secs / 60);
  const remainingSecs = secs % 60;
  const rSecsFormatted = _.eq(remainingSecs % 1, 0) ? remainingSecs.toFixed(0).padStart(2, "0") : parseFloat(remainingSecs.toFixed(1)).toString().padStart(2, "0");

  return `${minutes.toString().padStart(2, "0")}:${rSecsFormatted}`;
};

export const formatCleanDuration = (secsRaw: any): string => {
  if (_.isNil(secsRaw)) return "00:00";
  const secs = _.isString(secsRaw) ? parseFloat(secsRaw) : secsRaw;
  if (_.isNaN(secs) || !isFinite(secs) || _.lt(secs, 0)) return "00:00";
  const m = _.floor(secs / 60);
  const s = _.floor(secs % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
};

export const formatAudioTime = (secs: number) => {
  if (_.isNaN(secs) || !isFinite(secs) || _.lt(secs, 0)) return "00:00";
  const m = _.floor(secs / 60);
  const s = _.floor(secs % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
};

export const formatTimeHelper = (secs: number): string => {
  const minutes = _.floor(secs / 60);
  const remainingSecs = secs % 60;
  const roundedSecs = _.round(remainingSecs, 3);
  const parts = _.split(_.toString(roundedSecs), ".");
  const integerPart = parts[0].padStart(2, "0");
  const decimalPart = parts[1] ? `.${parts[1]}` : "";
  return `${minutes.toString().padStart(2, "0")}:${integerPart}${decimalPart}`;
};
