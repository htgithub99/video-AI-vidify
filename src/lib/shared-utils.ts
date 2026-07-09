import { appLog, appError, createAppError } from "./logger";
import { STORAGE_KEYS, LOG_ERROR_SYMBOLS, LOG_WARN_SYMBOLS } from "../constants";
import { BatchDelayOption } from "../types";
import { eq, isNil, isArray, forEach, some, includes, subtract, add, multiply, floor, sample } from "lodash";

export const getStoredApiKey = (keyName: typeof STORAGE_KEYS.GEMINI_API_KEY | typeof STORAGE_KEYS.AI33_API_KEY): string => {
  if (!eq(typeof window, "undefined")) {
    return window.localStorage.getItem(keyName) || "";
  }
  return "";
};

export const safeSystemFetch = async (url: string, payload: any) => {
  try {
    const geminiKey = getStoredApiKey("GEMINI_API_KEY");
    const ai33Key = getStoredApiKey("AI33_API_KEY");

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-gemini-api-key": geminiKey,
        "x-ai33-api-key": ai33Key,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => null);

    if (!isNil(data) && isArray(data.rotationLogs)) {
      forEach(data.rotationLogs, (log: string) => {
        if (some(LOG_ERROR_SYMBOLS, (sym) => includes(log, sym))) appError(log);
        else if (some(LOG_WARN_SYMBOLS, (sym) => includes(log, sym))) appLog(log);
        else appLog(log);
      });
    }

    if (eq(response.ok, false)) {
      throw createAppError(data?.error || `API Error: ${response.status}`);
    }

    return { success: true, data };
  } catch (error: any) {
    appError("SYSTEM_FLOW_ERROR", url, error);
    return { success: false, error: error.message };
  }
};

export const delayAsync = (ms: number) => new Promise((res) => setTimeout(res, ms));

export const randomDelay = (min: number = 1000, max: number = 2000): Promise<number> => {
  const ms = floor(add(multiply(Math.random(), add(subtract(max, min), 1)), min));
  return new Promise((resolve) => setTimeout(() => resolve(ms), ms));
};

export const logSystemAction = (actionName: string) => {
  appLog("SYSTEM_ACTION_START", actionName);
};

export const getBatchDelayMs = (option?: BatchDelayOption | string): number => {
  const opt = (option || BatchDelayOption.Default) as BatchDelayOption;
  if (eq(opt, BatchDelayOption.OneSecond)) return 1000;
  if (eq(opt, BatchDelayOption.TwoSeconds)) return 2000;
  if (eq(opt, BatchDelayOption.ThreeSeconds)) return 3000;
  if (eq(opt, BatchDelayOption.Random123)) {
    return sample([1000, 2000, 3000]) || 1000;
  }
  return add(floor(multiply(Math.random(), 1001)), 1000);
};
