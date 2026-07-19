export const logger = {
  info: (...args: any[]) => {
    // eslint-disable-next-line no-console
    console.log('[INFO]', ...args);
  },
  warn: (...args: any[]) => {
    // eslint-disable-next-line no-console
    console.warn('[WARN]', ...args);
  },
  error: (...args: any[]) => {
    // eslint-disable-next-line no-console
    console.error('[ERROR]', ...args);
  },
  debug: (...args: any[]) => {
    // eslint-disable-next-line no-console
    console.debug('[DEBUG]', ...args);
  }
};
