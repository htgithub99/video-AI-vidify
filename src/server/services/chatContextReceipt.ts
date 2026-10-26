import { CINEMATIC_CHAT_PLANNING_CONFIG as C } from "../../constants/cinematicConstants.js";
import { MOTION_AI_RECOVERY as R } from "../../constants/motionAiRecovery.js";
import type { Page } from "playwright";
export class ChatContextReceipts {
  private key?: string;
  private accepted = new Set<number>();
  select(key: string): void {
    if (this.key === key) return;
    this.key = key;
    this.accepted.clear();
  }
  has(part: number): boolean {
    return this.accepted.has(part);
  }
  matches(key: string): boolean {
    return this.key === key;
  }
  accept(part: number): void {
    this.accepted.add(part);
  }
  invalidate(): void {
    this.key = undefined;
    this.accepted.clear();
  }
}
export const observeChatContextReceipts = (page: Page): ChatContextReceipts => {
  const receipts = new ChatContextReceipts();
  const conversation = (url: string): string | undefined => {
    try {
      const parsed = new URL(url);
      const room = parsed.pathname.match(R.CONVERSATION_PATH)?.[0];
      return room ? parsed.origin + room : undefined;
    } catch {
      return undefined;
    }
  };
  let room = conversation(page.url());
  page.on("request", (request) => {
    if (request.isNavigationRequest() && request.frame() === page.mainFrame()) receipts.invalidate();
  });
  page.on("framenavigated", (frame) => {
    if (frame !== page.mainFrame()) return;
    const next = conversation(frame.url());
    if (room && room !== next) receipts.invalidate();
    room = next;
  });
  page.on("close", () => receipts.invalidate());
  return receipts;
};
export const confirmChatContextPart = async (prompt: string, id: string, part: number, send: (prompt: string) => Promise<unknown>, signal?: AbortSignal): Promise<void> => {
  for (let attempt = 0; attempt <= C.CONTEXT_ACK_REPAIRS; attempt++) {
    signal?.throwIfAborted();
    const response = (await send(attempt ? C.CONTEXT_ACK_REPAIR(id, part) : prompt)) as { artifactType?: unknown; requestId?: unknown; receivedPart?: unknown } | null;
    signal?.throwIfAborted();
    if (response?.artifactType === C.CONTEXT_ARTIFACT && response.requestId === id && response.receivedPart === part) return;
  }
  throw new Error(C.CONTEXT_ACK_ERROR);
};
