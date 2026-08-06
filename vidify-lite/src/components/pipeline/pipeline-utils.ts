import { Dispatch, SetStateAction } from "react";
export { formatCleanTime, formatAudioTime, formatCleanDuration } from "../../lib/timeUtils.js";

export const setTemporaryState = <T>(
  setter: Dispatch<SetStateAction<T>>,
  value: T,
  resetValue: T,
  durationMs: number,
): void => {
  setter(value);
  window.setTimeout(() => setter(resetValue), durationMs);
};
