import fs from "node:fs";
import path from "node:path";
import { CHAT_BRIDGE as B } from "../../constants/chatBridge.js";
import { stringifyJson } from "../../lib/jsonStringify.js";
import { getDataDirectory } from "../utils/paths.js";
import type { AiPlanningFallbackProvider } from "../../types.js";
interface BridgeRequest {
  provider: AiPlanningFallbackProvider;
  prompt: string;
  artifactType?: string;
  requestId?: string;
  workerId?: string;
  signal?: AbortSignal;
  submission?: { attempted: boolean; completed: boolean; onAttempt?: () => void; onContextProgress?: () => void };
}
const root = (): string => path.join(getDataDirectory(), B.DIR);
const folder = (name: string): string => {
  const dir = path.join(root(), name);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
};
let sequence = 0;
const names = new Map<string, string>();
export const isChatBridgeEnabled = (): boolean => fs.existsSync(path.join(root(), B.FLAG));
const fileName = (request: BridgeRequest): string => {
  const key = [request.artifactType, request.requestId, request.workerId].join(B.DASH);
  const known = names.get(key);
  if (known) return known;
  const name = [String(Date.now()), String(++sequence).padStart(4, "0"), request.artifactType || "", request.requestId || "", request.workerId || ""].filter(Boolean).join(B.DASH).replace(B.SAFE_NAME, B.DASH);
  names.set(key, name);
  return name;
};
export const askChatBridge = async (request: BridgeRequest): Promise<{ text: string; provider: AiPlanningFallbackProvider }> => {
  const name = fileName(request);
  const promptFile = path.join(folder(B.INBOX), name + B.PROMPT_EXT);
  const replyFile = path.join(folder(B.OUTBOX), name + B.REPLY_EXT);
  if (!fs.existsSync(promptFile) && !fs.existsSync(path.join(folder(B.DONE), name + B.PROMPT_EXT))) fs.writeFileSync(promptFile, B.HEADER(stringifyJson({ artifactType: request.artifactType, requestId: request.requestId, workerId: request.workerId })) + request.prompt, B.ENCODING);
  if (request.submission) {
    request.submission.attempted = true;
    request.submission.onAttempt?.();
    request.submission.onContextProgress?.();
  }
  for (;;) {
    if (request.signal?.aborted) throw new Error(B.ABORTED);
    if (fs.existsSync(replyFile)) {
      const text = fs.readFileSync(replyFile, B.ENCODING);
      if (text.trim()) {
        if (fs.existsSync(promptFile)) fs.renameSync(promptFile, path.join(folder(B.DONE), name + B.PROMPT_EXT));
        fs.renameSync(replyFile, path.join(folder(B.DONE), name + B.REPLY_EXT));
        names.forEach((value, key) => value === name && names.delete(key));
        if (request.submission) request.submission.completed = true;
        return { text, provider: request.provider };
      }
    }
    await new Promise((resolve) => setTimeout(resolve, B.POLL_MS));
  }
};
