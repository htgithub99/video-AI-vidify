import { LOW_SPEC_CLIENT as L } from "../constants/lowSpecClient.js";
import { storageUtils } from "./storage.js";
let enabled = storageUtils.get(L.STORAGE_KEY) === L.ON;
const apply = (): void => {
  if (typeof document !== "undefined") document.documentElement.classList.toggle(L.CLASS, enabled);
};
apply();
export const lowSpecEnabled = (): boolean => enabled;
export const setLowSpecEnabled = (value: boolean): void => {
  if (value !== enabled) {
    enabled = value;
    storageUtils.set(L.STORAGE_KEY, value ? L.ON : L.OFF);
  }
  apply();
};
export const loadLowSpec = async (): Promise<void> => {
  try {
    const response = await fetch(L.API);
    if (response.ok) setLowSpecEnabled((await response.json())?.lowSpec === true);
  } catch {}
};
export const lowSpecPollMs = (ms: number): number => (enabled ? Math.round(ms * L.POLL_FACTOR * (typeof document !== "undefined" && document.hidden ? L.HIDDEN_FACTOR : 1)) : ms);
