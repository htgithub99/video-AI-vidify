import _ from "lodash";
import { ConsoleLogType, REFACTOR_CONSTANTS } from "../constants";

type LogListener = (type: ConsoleLogType, args: unknown[]) => void;

const listeners = new Set<LogListener>();
const nativeConsole = {
  log: console.log.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console),
  debug: console.debug.bind(console),
};
let isIntercepting = false;

const notifyListeners = (type: ConsoleLogType, args: unknown[]): void => {
  _.forEach(Array.from(listeners), (listener) => listener(type, args));
};

const installInterceptor = (): void => {
  if (isIntercepting) return;
  isIntercepting = true;
  console.log = (...args) => {
    notifyListeners(ConsoleLogType.LOG, args);
    nativeConsole.log(...args);
  };
  console.warn = (...args) => {
    notifyListeners(ConsoleLogType.WARN, args);
    nativeConsole.warn(...args);
  };
  console.error = (...args) => {
    notifyListeners(ConsoleLogType.ERROR, args);
    nativeConsole.error(...args);
  };
};

const removeInterceptor = (): void => {
  if (!isIntercepting || !_.isEmpty(listeners)) return;
  console.log = nativeConsole.log;
  console.warn = nativeConsole.warn;
  console.error = nativeConsole.error;
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
    console.log(...args);
  },
  info: (...args: unknown[]) => {
    console.log(REFACTOR_CONSTANTS.LOGGER_INFO_PREFIX, ...args);
  },
  warn: (...args: unknown[]) => {
    console.warn(REFACTOR_CONSTANTS.LOGGER_WARN_PREFIX, ...args);
  },
  error: (...args: unknown[]) => {
    console.error(REFACTOR_CONSTANTS.LOGGER_ERROR_PREFIX, ...args);
  },
  debug: (...args: unknown[]) => {
    console.debug(REFACTOR_CONSTANTS.LOGGER_DEBUG_PREFIX, ...args);
  },
};
