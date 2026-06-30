import {
  LogLang,
  getFriendlyActionName,
  LOG_DICTIONARY,
  LogKey
} from '../constants/messages.js';

let currentLang: LogLang = 'vi'; // Default to Vietnamese

export const setLogLanguage = (lang: LogLang) => {
  currentLang = lang;
};

export const getLogLanguage = (): LogLang => {
  return currentLang;
};

/**
 * Formats a message template by replacing placeholders like {0}, {1} with provided arguments.
 */
export const formatLogMessage = (template: string, ...args: any[]): string => {
  let result = template;
  args.forEach((arg, index) => {
    const val = arg !== undefined && arg !== null ? String(arg) : "";
    result = result.replace(new RegExp(`\\{${index}\\}`, 'g'), val);
  });
  return result;
};

/**
 * Retrieves the message for a given key, matching the specified or current language.
 * Falls back to English, then the key itself if not found.
 */
export const getMessage = (key: LogKey | string, lang?: LogLang, ...args: any[]): string => {
  const dictionaryKey = key as LogKey;
  if (LOG_DICTIONARY[dictionaryKey]) {
    const activeLang = lang || currentLang;
    const template = LOG_DICTIONARY[dictionaryKey][activeLang] || LOG_DICTIONARY[dictionaryKey]['en'];
    
    if (dictionaryKey === 'SYSTEM_ACTION_START' && args.length > 0) {
      const friendlyAction = getFriendlyActionName(args[0], activeLang);
      return formatLogMessage(template, friendlyAction);
    }
    
    return formatLogMessage(template, ...args);
  }
  return formatLogMessage(String(key), ...args);
};

/**
 * Gets a bilingual message displaying both English and Vietnamese representation.
 * Useful for terminal/server outputs.
 */
export const getBilingualMessage = (key: LogKey | string, ...args: any[]): string => {
  const dictionaryKey = key as LogKey;
  if (LOG_DICTIONARY[dictionaryKey]) {
    if (dictionaryKey === 'SYSTEM_ACTION_START' && args.length > 0) {
      const viMsg = formatLogMessage(LOG_DICTIONARY[dictionaryKey]['vi'], getFriendlyActionName(args[0], 'vi'));
      const enMsg = formatLogMessage(LOG_DICTIONARY[dictionaryKey]['en'], getFriendlyActionName(args[0], 'en'));
      if (viMsg === enMsg) return viMsg;
      return `${viMsg} | ${enMsg}`;
    }
    
    const viMsg = formatLogMessage(LOG_DICTIONARY[dictionaryKey]['vi'], ...args);
    const enMsg = formatLogMessage(LOG_DICTIONARY[dictionaryKey]['en'], ...args);
    if (viMsg === enMsg) return viMsg;
    return `${viMsg} | ${enMsg}`;
  }
  return formatLogMessage(String(key), ...args);
};


/**
 * Advanced unified logging utility supporting translation dictionary
 */
export const logger = {
  log: (key: LogKey | string, ...args: any[]) => {
    // If the key is in our dictionary and we are server-side or requested, log bilingual
    if (typeof window === 'undefined') {
      console.log(getBilingualMessage(key, ...args));
    } else {
      console.log(getMessage(key, undefined, ...args));
    }
  },
  info: (key: LogKey | string, ...args: any[]) => {
    if (typeof window === 'undefined') {
      console.info(getBilingualMessage(key, ...args));
    } else {
      console.info(getMessage(key, undefined, ...args));
    }
  },
  warn: (key: LogKey | string, ...args: any[]) => {
    if (typeof window === 'undefined') {
      console.warn(getBilingualMessage(key, ...args));
    } else {
      console.warn(getMessage(key, undefined, ...args));
    }
  },
  error: (key: LogKey | string, ...args: any[]) => {
    if (typeof window === 'undefined') {
      console.error(getBilingualMessage(key, ...args));
    } else {
      console.error(getMessage(key, undefined, ...args));
    }
  },
  // Explicitly logging standard language (Vietnamese)
  logVi: (key: LogKey | string, ...args: any[]) => {
    console.log(getMessage(key, 'vi', ...args));
  },
  // Explicitly logging standard language (English)
  logEn: (key: LogKey | string, ...args: any[]) => {
    console.log(getMessage(key, 'en', ...args));
  }
};

/**
 * Common logging function wrapping console.log / logger.log
 */
export const appLog = (keyOrMessage: LogKey | string, ...args: any[]): void => {
  logger.log(keyOrMessage, ...args);
};

/**
 * Common logging function wrapping console.error / logger.error
 */
export const appError = (keyOrMessage: LogKey | string, ...args: any[]): void => {
  logger.error(keyOrMessage, ...args);
};

/**
 * Common logging function wrapping logger.warn
 */
export const appWarn = (keyOrMessage: LogKey | string, ...args: any[]): void => {
  logger.warn(keyOrMessage, ...args);
};

/**
 * Common step logger function that logs the message and optionally collects it into a given logs array.
 */
export const appLogStep = (message: string, logsArray?: string[]): void => {
  appLog(message);
  if (logsArray && Array.isArray(logsArray)) {
    logsArray.push(message);
  }
};

/**
 * Common error factory that logs an error via appError and returns a new Error instance.
 * Usage: throw createAppError('ERROR_KEY', arg1, arg2);
 */
export const createAppError = (keyOrMessage: LogKey | string, ...args: any[]): Error => {
  const errMsg = typeof keyOrMessage === 'string' && LOG_DICTIONARY[keyOrMessage as LogKey]
    ? getMessage(keyOrMessage, undefined, ...args)
    : formatLogMessage(String(keyOrMessage), ...args);
  
  appError(errMsg);
  return new Error(errMsg);
};

