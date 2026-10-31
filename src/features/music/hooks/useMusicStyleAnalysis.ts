import { useEffect, useRef, useState } from "react";
import { API_ROUTES } from "../../../constants/apiRoutes.js";
import { CONTENT_TYPE_HEADER, CONTENT_TYPES, HTTP_METHODS } from "../../../constants/texts.js";
import { jsonUtils } from "../../../lib/json.js";
import type { AiPlanningChatModel, AiPlanningFallbackProvider } from "../../../types.js";
import type { SavedMusicStyle } from "../../../types/musicPlanning.js";
import { MUSIC_CREATION_OPTIONS as O } from "../constants/musicCreationOptions.js";
export const useMusicStyleAnalysis = () => {
  const [pending, setPending] = useState<SavedMusicStyle | null>(null);
  const active = useRef<AbortController | null>(null);
  useEffect(() => () => active.current?.abort(), []);
  const analyze = async (target: SavedMusicStyle, referenceSource: string, aiExecution: { provider: AiPlanningFallbackProvider; model: AiPlanningChatModel; chromeHeadless: boolean }, errorText: string): Promise<SavedMusicStyle | undefined> => {
    if (active.current) return undefined;
    const controller = new AbortController();
    active.current = controller;
    setPending(target);
    try {
      const requestId = O.STYLE_RUN_PREFIX + crypto.randomUUID();
      const response = await fetch(API_ROUTES.PIPELINE_MUSIC_STYLE_ANALYZE, { method: HTTP_METHODS.POST, headers: { [CONTENT_TYPE_HEADER]: CONTENT_TYPES.JSON }, body: jsonUtils.safeStringify({ referenceSource, aiExecution, requestId }), signal: controller.signal });
      const result = await response.json();
      controller.signal.throwIfAborted();
      if (!response.ok || !result.success || !result.style?.content) throw new Error(result.error || errorText);
      return result.style;
    } catch (error) {
      if (!controller.signal.aborted) throw error;
      return undefined;
    } finally {
      if (active.current === controller) {
        active.current = null;
        setPending(null);
      }
    }
  };
  return { pending, analyze, cancel: () => active.current?.abort() };
};
