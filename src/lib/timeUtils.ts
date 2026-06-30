export const parseTimeToSeconds = (timeStr: string): number | null => {
  if (!timeStr) return null;
  
  const parts = timeStr.split(":");
  let secs = 0;
  if (parts.length === 3) {
    secs = parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseFloat(parts[2]);
  } else if (parts.length === 2) {
    secs = parseInt(parts[0]) * 60 + parseFloat(parts[1]);
  } else {
    secs = parseFloat(timeStr);
  }
  return isNaN(secs) ? null : secs;
};

export const formatCleanTime = (timeStr: string): string => {
  if (!timeStr) return "00:00";
  const secs = parseTimeToSeconds(timeStr);
  if (secs === null) return timeStr;
  const minutes = Math.floor(secs / 60);
  const remainingSecs = secs % 60;
  const rSecsFormatted =
    remainingSecs % 1 === 0
      ? remainingSecs.toFixed(0).padStart(2, "0")
      : parseFloat(remainingSecs.toFixed(1)).toString().padStart(2, "0");

  return `${minutes.toString().padStart(2, "0")}:${rSecsFormatted}`;
};

export const formatCleanDuration = (secsRaw: number | string): string => {
  let secs = typeof secsRaw === "string" ? parseFloat(secsRaw) : secsRaw;
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
