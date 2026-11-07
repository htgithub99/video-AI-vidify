import { REFACTOR_CONSTANTS } from "../constants";
const systemConsole = globalThis.console;
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
