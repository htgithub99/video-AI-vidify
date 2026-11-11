import { CHAT_EXECUTION_POLICY as P } from "../constants/chatExecutionPolicy.js";
export interface ChatExecutionPolicy {
  multiRoom?: boolean;
  allowFallback?: boolean;
}
export const chatRoomLanes = (policy?: ChatExecutionPolicy | null): number => (policy?.multiRoom === true ? P.MULTI_ROOMS : P.SINGLE_ROOMS);
export const chatRoomWorkerIds = (base: string, policy?: ChatExecutionPolicy | null): string[] => Array.from({ length: chatRoomLanes(policy) }, (_value, index) => P.WORKER_ID(base, index));
export const runInChatRoomLanes = async <T, R>(items: T[], policy: ChatExecutionPolicy | null | undefined, worker: (item: T, index: number, lane: number) => Promise<R>): Promise<R[]> => {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  const lanes = Math.max(1, Math.min(chatRoomLanes(policy), items.length));
  await Promise.all(
    Array.from({ length: lanes }, async (_value, lane) => {
      while (cursor < items.length) {
        const index = cursor;
        cursor += 1;
        results[index] = await worker(items[index], index, lane);
      }
    }),
  );
  return results;
};
