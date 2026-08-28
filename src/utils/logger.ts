import _ from "lodash";
import { ConsoleLogType, REFACTOR_CONSTANTS } from "../constants";

type LogListener = (type: ConsoleLogType, args: unknown[]) => void;

const listeners = new Set<LogListener>();
const systemConsole = globalThis.console;
const nativeConsole = {
  log: systemConsole.log.bind(systemConsole),
  warn: systemConsole.warn.bind(systemConsole),
  error: systemConsole.error.bind(systemConsole),
  debug: systemConsole.debug.bind(systemConsole),
};
let isIntercepting = false;

const notifyListeners = (type: ConsoleLogType, args: unknown[]): void => {
  _.forEach(Array.from(listeners), (listener) => listener(type, args));
};

const installInterceptor = (): void => {
  if (isIntercepting) return;
  isIntercepting = true;
  systemConsole.log = (...args) => {
    notifyListeners(ConsoleLogType.LOG, args);
    nativeConsole.log(...args);
  };
  systemConsole.warn = (...args) => {
    notifyListeners(ConsoleLogType.WARN, args);
    nativeConsole.warn(...args);
  };
  systemConsole.error = (...args) => {
    notifyListeners(ConsoleLogType.ERROR, args);
    nativeConsole.error(...args);
  };
};

const removeInterceptor = (): void => {
  if (!isIntercepting || !_.isEmpty(listeners)) return;
  systemConsole.log = nativeConsole.log;
  systemConsole.warn = nativeConsole.warn;
  systemConsole.error = nativeConsole.error;
  isIntercepting = false;
};

export const subscribeToLogs = (listener: LogListener): (() => void) => {
  listeners.add(listener);
  installInterceptor();
  return () => {
    listeners.delete(listener);
    removeInterceptor();
  };
};

export const logger = {
  log: (...args: unknown[]) => {
    systemConsole.log(...args);
  },
  info: (...args: unknown[]) => {
    systemConsole.log(REFACTOR_CONSTANTS.LOGGER_INFO_PREFIX, ...args);
  },
  warn: (...args: unknown[]) => {
    systemConsole.warn(REFACTOR_CONSTANTS.LOGGER_WARN_PREFIX, ...args);
  },
  error: (...args: unknown[]) => {
    systemConsole.error(REFACTOR_CONSTANTS.LOGGER_ERROR_PREFIX, ...args);
  },
  debug: (...args: unknown[]) => {
    systemConsole.debug(REFACTOR_CONSTANTS.LOGGER_DEBUG_PREFIX, ...args);
  },
};
