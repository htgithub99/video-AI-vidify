export const parseTimeToSeconds = (timeStr: string | undefined): number | null => {
  if (!timeStr) return null;

  const parts = timeStr.trim().split(":");
  let secs = 0;
  if (parts.length === 3) {
    secs = parseFloat(parts[0]) * 3600 + parseFloat(parts[1]) * 60 + parseFloat(parts[2]);
  } else if (parts.length === 2) {
    secs = parseFloat(parts[0]) * 60 + parseFloat(parts[1]);
  } else if (parts.length === 1) {
    secs = parseFloat(parts[0]);
  }
  return isNaN(secs) ? null : secs;
};

export const formatCleanTime = (val: string | number | undefined): string => {
  if (val === undefined || val === null) return "00:00";
  if (typeof val === "number") {
    const hours = Math.floor(val / 3600);
    const minutes = Math.floor((val % 3600) / 60);
    const seconds = Math.floor(val % 60);
    if (hours > 0) {
      return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    }
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }
  if (!val) return "00:00";
  const secs = parseTimeToSeconds(val);
  if (secs === null) return val;
  const minutes = Math.floor(secs / 60);
  const remainingSecs = secs % 60;
  const rSecsFormatted = remainingSecs % 1 === 0 ? remainingSecs.toFixed(0).padStart(2, "0") : parseFloat(remainingSecs.toFixed(1)).toString().padStart(2, "0");

  return `${minutes.toString().padStart(2, "0")}:${rSecsFormatted}`;
};

export const formatCleanDuration = (secsRaw: any): string => {
  if (secsRaw === undefined || secsRaw === null) return "00:00";
  const secs = typeof secsRaw === "string" ? parseFloat(secsRaw) : secsRaw;
  if (isNaN(secs) || !isFinite(secs) || secs < 0) return "00:00";
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
};

export const formatAudioTime = (secs: number) => {
  if (isNaN(secs) || !isFinite(secs) || secs < 0) return "00:00";
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
};

export const formatTimeHelper = (secs: number): string => {
  const minutes = Math.floor(secs / 60);
  const remainingSecs = secs % 60;
  const roundedSecs = Math.round(remainingSecs * 1000) / 1000;
  const parts = roundedSecs.toString().split(".");
  const integerPart = parts[0].padStart(2, "0");
  const decimalPart = parts[1] ? `.${parts[1]}` : "";
  return `${minutes.toString().padStart(2, "0")}:${integerPart}${decimalPart}`;
};
