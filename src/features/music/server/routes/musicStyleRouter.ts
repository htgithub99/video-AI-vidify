import { Router } from "express";
import { randomUUID } from "node:crypto";
import { HttpStatus } from "../../../../constants/enums.js";
import * as ST from "../../../../constants/sourceText.js";
import { jsonUtils } from "../../../../lib/json.js";
import { AiPlanningFallbackProvider } from "../../../../types.js";
import { beginChatPlanningRun, closeChatBrowserIfIdle, closeChatPlanningRoom, generatePlanningWithChatUi } from "../../../../server/services/chatUiPlanningService.js";
import { MUSIC_CREATION_OPTIONS as O } from "../../constants/musicCreationOptions.js";
import { createAnalyzedMusicStyle } from "../../lib/musicStyleLibrary.js";
export const musicStyleRouter = Router();
musicStyleRouter.post(O.STYLE_ROUTE, async (req, res) => {
  const referenceSource = typeof req.body?.referenceSource === "string" ? req.body.referenceSource.trim() : O.EMPTY;
  if (!referenceSource) return res.status(HttpStatus.BAD_REQUEST).json({ success: false, error: O.TEXT.vi.sourceRequired });
  const execution = req.body?.aiExecution || {};
  const provider = execution.provider || AiPlanningFallbackProvider.GeminiChat;
  const requestId = typeof req.body?.requestId === "string" && req.body.requestId.startsWith(O.STYLE_RUN_PREFIX) ? req.body.requestId : O.STYLE_RUN_PREFIX + randomUUID();
  const run = beginChatPlanningRun(requestId, Date.now(), O.STYLE_WORKER, provider);
  req.once(ST.SOURCE_TEXT_ABORTED, run.cancel);
  res.once(ST.SOURCE_TEXT_CLOSE_2, () => {
    if (!res.writableEnded) run.cancel();
  });
  try {
    const response = await generatePlanningWithChatUi({ provider, model: execution.model, prompt: O.STYLE_PROMPT(referenceSource, requestId), projectId: requestId, workerId: O.STYLE_WORKER, chromeHeadless: execution.chromeHeadless !== false, artifactType: O.STYLE_ARTIFACT, requestId, signal: run.signal, closeRoomOnComplete: false });
    const parsed = jsonUtils.safeParse(response.text, null);
    const style = parsed?.artifactType === O.STYLE_ARTIFACT && parsed.requestId === requestId ? createAnalyzedMusicStyle(parsed) : undefined;
    if (!style) throw new Error(O.TEXT.vi.reanalyzeError);
    return res.json({ success: true, style });
  } catch (error) {
    if (!res.destroyed) return res.status(HttpStatus.BAD_REQUEST).json({ success: false, error: error instanceof Error ? error.message : O.TEXT.vi.reanalyzeError });
  } finally {
    run.complete();
    await closeChatPlanningRoom({ provider, projectId: requestId, workerId: O.STYLE_WORKER }).catch(() => undefined);
    await closeChatBrowserIfIdle();
  }
});
