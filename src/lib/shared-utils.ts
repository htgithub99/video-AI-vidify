
import { appLog, appError, createAppError } from "./logger";
import { STORAGE_KEYS, LOG_ERROR_SYMBOLS, LOG_WARN_SYMBOLS } from '../constants';
import { BatchDelayOption } from "../types";

export const getStoredApiKey = (keyName: typeof STORAGE_KEYS.GEMINI_API_KEY | typeof STORAGE_KEYS.AI33_API_KEY): string => {
  if (typeof window !== 'undefined') {
    return window.localStorage.getItem(keyName) || '';
  }
  return '';
};

export const safeSystemFetch = async (url: string, payload: any) => {
  try {
    const geminiKey = getStoredApiKey('GEMINI_API_KEY');
    const ai33Key = getStoredApiKey('AI33_API_KEY');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-gemini-api-key': geminiKey,
        'x-ai33-api-key': ai33Key
      },
      body: JSON.stringify(payload),
    });


    const data = await response.json().catch(() => null);


    if (data && Array.isArray(data.rotationLogs)) {
      data.rotationLogs.forEach((log: string) => {
        if (LOG_ERROR_SYMBOLS.some(sym => log.includes(sym))) appError(log);
        else if (LOG_WARN_SYMBOLS.some(sym => log.includes(sym))) appLog(log);
        else appLog(log);
      });
    }

    if (!response.ok) {
      throw createAppError(data?.error || `API Error: ${response.status}`);
    }

    return { success: true, data };
  } catch (error: any) {
    appError('SYSTEM_FLOW_ERROR', url, error);
    return { success: false, error: error.message };
  }
};

export const delayAsync = (ms: number) => new Promise(res => setTimeout(res, ms));

export const randomDelay = (min: number = 1000, max: number = 2000): Promise<number> => {
  const ms = Math.floor(Math.random() * (max - min + 1) + min);
  return new Promise((resolve) => setTimeout(() => resolve(ms), ms));
};

export const logSystemAction = (actionName: string) => {
  appLog('SYSTEM_ACTION_START', actionName);
};

export const getBatchDelayMs = (option?: BatchDelayOption | string): number => {
  const opt = (option || BatchDelayOption.Default) as BatchDelayOption;
  if (opt === BatchDelayOption.OneSecond) return 1000;
  if (opt === BatchDelayOption.TwoSeconds) return 2000;
  if (opt === BatchDelayOption.ThreeSeconds) return 3000;
  if (opt === BatchDelayOption.Random123) {
    const choices = [1000, 2000, 3000];
    return choices[Math.floor(Math.random() * choices.length)];
  }
  return Math.floor(Math.random() * 1001) + 1000;
};

