export const formatCleanTime = (timeStr: string): string => {
  if (!timeStr) return "00:00";
  const parts = timeStr.split(':');
  if (parts.length === 2) return timeStr;
  return timeStr; 
};

export const formatAudioTime = (secs: number) => {
  if (isNaN(secs) || !isFinite(secs) || secs < 0) return "00:00";
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
};

export const formatCleanDuration = (secs: number): string => {
  if (isNaN(secs) || !isFinite(secs) || secs < 0) return "00:00";
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
};
