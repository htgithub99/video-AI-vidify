import { useEffect, useMemo, useState } from "react";
import { jsonUtils } from "../lib/json.js";
import { CHAT_EXECUTION_POLICY as P } from "../constants/chatExecutionPolicy.js";
import type { ChatExecutionPolicy } from "../lib/chatExecutionPolicy.js";
export interface ChatExecutionPolicyProps {
  multiRoom: boolean;
  onMultiRoomChange: (multiRoom: boolean) => void;
  allowFallback: boolean;
  onAllowFallbackChange: (allowFallback: boolean) => void;
}
export const useChatExecutionPolicy = (screen: string) => {
  const key = P.STORAGE_KEY(screen);
  const [policy, setPolicy] = useState<Required<ChatExecutionPolicy>>(() => {
    const saved = jsonUtils.getItem<ChatExecutionPolicy>(key, {});
    return { multiRoom: saved?.multiRoom === true, allowFallback: saved?.allowFallback === true };
  });
  useEffect(() => jsonUtils.setItem(key, policy), [key, policy]);
  const blockProps = useMemo<ChatExecutionPolicyProps>(
    () => ({
      multiRoom: policy.multiRoom,
      onMultiRoomChange: (multiRoom: boolean) => setPolicy((current) => ({ ...current, multiRoom })),
      allowFallback: policy.allowFallback,
      onAllowFallbackChange: (allowFallback: boolean) => setPolicy((current) => ({ ...current, allowFallback })),
    }),
    [policy],
  );
  return { policy, blockProps };
};
