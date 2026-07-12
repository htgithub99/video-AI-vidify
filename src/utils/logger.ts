export const logger = {
  info: (...args: any[]) => {
    // eslint-disable-next-line no-console
    console.info("[INFO]", ...args);
  },
  warn: (...args: any[]) => {
    // eslint-disable-next-line no-console
    console.warn("[WARN]", ...args);
  },
  error: (...args: any[]) => {
    // eslint-disable-next-line no-console
    console.error("[ERROR]", ...args);
  },
  debug: (...args: any[]) => {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.debug("[DEBUG]", ...args);
    }
  },
};
