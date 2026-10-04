import { AsyncLocalStorage } from "async_hooks";
import type { AiPlanningChatModel, AiPlanningExecutionMode, AiPlanningFallbackProvider } from "../../types.js";
export interface RequestKeys {
  geminiKey?: string;
  cerebrasKey?: string;
  groqKey?: string;
  ai33Key?: string;
  planType?: string;
  licenseKey?: string;
  aiExecutionMode?: AiPlanningExecutionMode;
  aiRoomProvider?: AiPlanningFallbackProvider;
  aiRoomModel?: AiPlanningChatModel;
  aiRoomProjectId?: string;
  aiRoomChromeHeadless?: boolean;
}
export const requestContext = new AsyncLocalStorage<RequestKeys>();
