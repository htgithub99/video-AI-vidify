import { RUNTIME_TEXT as RT_SHARED } from "../constants/runtime/shared.js";
import { MUSIC_PLANNING as P } from "../constants/musicPlanning.js";
import { parseJson } from "./jsonStringify.js";
export type NdjsonEvent = { type?: string; result?: unknown; [key: string]: unknown };
export const readNdjsonResponse = async <E extends NdjsonEvent>(response: Response, onProgress: (event: E) => void, interrupted: string, abortName?: string): Promise<any> => {
  if (!response.headers.get(P.STREAM_HEADER)?.includes(P.STREAM_TYPE) || !response.body) return response.json();
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let pending = "";
  let result: any;
  const consume = (line: string) => {
    if (!line.trim()) return;
    const event = parseJson(line) as E;
    if (event.type === RT_SHARED.PROGRESS) onProgress(event);
    else if (event.type === RT_SHARED.RESULT) result = event.result;
  };
  try {
    for (;;) {
      const { value, done } = await reader.read();
      pending += decoder.decode(value, { stream: !done });
      const lines = pending.split(RT_SHARED.SYMBOL_01BA47);
      pending = lines.pop() || "";
      lines.forEach(consume);
      if (done) break;
    }
    consume(pending);
  } catch (error: any) {
    if (!abortName || error?.name === abortName) throw error;
    throw new Error(interrupted, { cause: error });
  } finally {
    reader.releaseLock();
  }
  if (!result) throw new Error(interrupted);
  return result;
};
