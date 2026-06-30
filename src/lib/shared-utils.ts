
import { appLog, appError, createAppError } from "./logger";

export const SYSTEM_STATUS = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED'
};

export const getStoredApiKey = (keyName: 'GEMINI_API_KEY' | 'AI33_API_KEY'): string => {
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
        if (log.includes('❌') || log.includes('💀')) appError(log);
        else if (log.includes('⚠️') || log.includes('⏳')) appLog(log);
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

export const logSystemAction = (actionName: string) => {
  appLog('SYSTEM_ACTION_START', actionName);
};

