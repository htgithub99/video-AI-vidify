import type { Page, Response } from "playwright";
import { CINEMATIC_CHAT_PLANNING_CONFIG as C } from "../../constants/cinematicConstants.js";
export const geminiGenerationRejection = (body: string): number[] | null => {
  const rows: unknown[][] = [];
  for (const line of body.split(C.GEMINI_STREAM_LINES)) {
    if (!line.trim().startsWith(C.GEMINI_STREAM_START)) continue;
    try {
      const parsed = JSON.parse(line);
      if (Array.isArray(parsed)) rows.push(...parsed.filter(Array.isArray));
    } catch {}
  }
  if (rows.some((row) => row[0] === C.GEMINI_STREAM_FRAME && typeof row[2] === "string" && row[2].length)) return null;
  for (const row of rows) {
    const error = row[5];
    if (row[0] !== C.GEMINI_STREAM_FRAME || row[2] != null || !Array.isArray(error) || !Number.isInteger(error[0]) || error[0] <= 0) continue;
    const details = Array.isArray(error[2]) ? error[2] : [];
    const codes = details.flatMap((detail) => (Array.isArray(detail) && detail[0] === C.GEMINI_STREAM_ERROR_TYPE && Array.isArray(detail[1]) ? detail[1].filter(Number.isInteger) : []));
    return [error[0], ...codes];
  }
  return null;
};
export const observeGeminiGeneration = (page: Page) => {
  const controller = new AbortController();
  let disposed = false;
  let reject: (error: Error) => void = () => {};
  const failure = new Promise<never>((_resolve, fail) => {
    reject = fail;
  });
  void failure.catch(() => {});
  const requests = new Set<ReturnType<Response["request"]>>();
  const request = (value: ReturnType<Response["request"]>) => {
    if (C.GEMINI_STREAM_PATH.test(new URL(value.url()).pathname)) requests.add(value);
  };
  const response = async (value: Response) => {
    if (!requests.delete(value.request())) return;
    const body = await value.text().catch(() => C.GEMINI_STREAM_EMPTY);
    if (disposed) return;
    const codes = geminiGenerationRejection(body);
    if (!codes) return;
    const error = Object.assign(new Error(C.PROVIDER_ERROR_RESPONSE_ERROR), { name: C.GEMINI_STREAM_ERROR_NAME(codes) });
    reject(error);
    controller.abort(error);
  };
  page.on(C.GEMINI_STREAM_REQUEST_EVENT, request);
  page.on(C.GEMINI_STREAM_RESPONSE_EVENT, response);
  return {
    signal: controller.signal,
    run: <T>(task: Promise<T>): Promise<T> => Promise.race([task, failure]),
    dispose: () => {
      disposed = true;
      page.off(C.GEMINI_STREAM_REQUEST_EVENT, request);
      page.off(C.GEMINI_STREAM_RESPONSE_EVENT, response);
      requests.clear();
    },
  };
};
