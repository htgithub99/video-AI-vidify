// Chromium can exit without replying to Browser.close. Cleanup must not hold a saved result open.
export const settleSunoBrowserClose = async (operation: () => Promise<unknown>, timeoutMs = 5000): Promise<void> => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      Promise.resolve().then(operation).catch(() => undefined),
      new Promise<void>(resolve => { timer = setTimeout(resolve, timeoutMs); }),
    ]);
  } finally { clearTimeout(timer); }
};
