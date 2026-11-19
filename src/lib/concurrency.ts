import _ from "lodash";
export const runLanes = async <T>(items: T[], count: number, run: (item: T, index: number) => Promise<void>): Promise<void> => {
  let next = 0;
  let failure: unknown;
  await Promise.all(
    _.range(Math.max(1, Math.min(count, items.length))).map(async () => {
      while (next < items.length && failure === undefined) {
        const index = next++;
        try {
          await run(items[index], index);
        } catch (error) {
          failure ??= error;
        }
      }
    }),
  );
  if (failure !== undefined) throw failure;
};
export const mapLanes = async <T, R>(items: T[], count: number, run: (item: T, index: number) => Promise<R>): Promise<R[]> => {
  const out: R[] = new Array(items.length);
  await runLanes(items, count, async (item, index) => void (out[index] = await run(item, index)));
  return out;
};
export const createLimiter = (count: number) => {
  let active = 0;
  const queue: (() => void)[] = [];
  return async <T>(work: () => Promise<T>): Promise<T> => {
    if (active >= count) await new Promise<void>((resolve) => queue.push(resolve));
    active++;
    try {
      return await work();
    } finally {
      active--;
      queue.shift()?.();
    }
  };
};
