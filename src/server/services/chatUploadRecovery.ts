import { setTimeout as pause } from "node:timers/promises";

export class ChatUploadError extends Error {
  constructor(message: string, readonly retryable: boolean, readonly uploadStatus?: number, readonly uploadMessage?: string) {
    super(message);
    this.name = "ChatUploadError";
  }
}

export const isTerminalUploadMessage = (message: string): boolean =>
  /(?:storage|quota|limit|too (?:many|large)|unsupported|not supported|not allowed|permission|sign in|log in|giới hạn|dung lượng|không hỗ trợ|không được hỗ trợ|đăng nhập)/i.test(message);

export const uploadFailure = (message: string, network?: { lastFailure?: { status?: number; errorText?: string } }, providerMessage?: string): ChatUploadError => {
  const status = network?.lastFailure?.status;
  const retryable = !isTerminalUploadMessage(`${message} ${providerMessage || ""}`) && (status === undefined || status >= 500 || status === 408);
  return new ChatUploadError(message, retryable, status, providerMessage);
};

export const canRetryMusicEvaluation = (error: unknown, signal?: AbortSignal): boolean => {
  if (signal?.aborted) return false;
  if (error instanceof ChatUploadError) return error.retryable;
  const message = error instanceof Error ? error.message : String(error);
  return !/(?:chat_planning_cancelled|AbortError|gemini_thinking_unavailable|gemini_base_model_unavailable)/i.test(message) && !isTerminalUploadMessage(message);
};

export const waitForMusicEvaluationRetry = async (attempt: number, signal?: AbortSignal): Promise<void> => {
  signal?.throwIfAborted();
  await pause(Math.min(15000, 2000 * 2 ** attempt), undefined, { signal });
};
