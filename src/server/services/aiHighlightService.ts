import fs from "fs";
import path from "path";
import _ from "lodash";
import { generateContentWithRetry } from "./geminiService.js";
import { generatePlanningWithChatUi } from "./chatUiPlanningService.js";
import { AiTaskCapability } from "./taskRouterService.js";
import { HighlightClipItem, ShortsDurationOption, ShortsSourceMetadata } from "../../types/shorts.js";
import { AiPlanningChatModel, AiPlanningExecutionMode, AiPlanningFallbackProvider } from "../../types.js";
import { SHORTS_CONSTANTS, SHORTS_LOG_MESSAGES, SHORTS_PROMPTS, SHORTS_REGEX, SHORTS_TEXTS } from "../../constants/shorts.js";
import { logger } from "../../lib/logger.js";

export type HighlightAnalysisRequest = {
  metadata: ShortsSourceMetadata;
  clipCount: number;
  durationMode: ShortsDurationOption;
  audioSummaryText?: string;
  audioPath?: string;
  aiExecution?: {
    provider?: AiPlanningFallbackProvider;
    model?: AiPlanningChatModel;
    mode?: AiPlanningExecutionMode;
    chromeHeadless?: boolean;
    projectId?: string;
  };
  signal?: AbortSignal;
};

const resolveTargetDurationText = (mode: ShortsDurationOption): string => {
  if (mode === ShortsDurationOption.RANGE_15_30) return SHORTS_PROMPTS.DURATION_SHORT;
  if (mode === ShortsDurationOption.RANGE_30_60) return SHORTS_PROMPTS.DURATION_STANDARD;
  if (mode === ShortsDurationOption.RANGE_60_90) return SHORTS_PROMPTS.DURATION_LONG;
  return SHORTS_PROMPTS.DURATION_AUTO;
};

const buildHighlightPrompt = (
  metadata: ShortsSourceMetadata,
  durationSec: number,
  clipCount: number,
  durationMode: ShortsDurationOption,
  audioSummaryText?: string
): string =>
  _.join(
    _.compact([
      SHORTS_PROMPTS.SYSTEM_ROLE,
      SHORTS_PROMPTS.TASK_INSTRUCTION(durationSec, clipCount),
      "",
      SHORTS_PROMPTS.METADATA_HEADER,
      `- Filename: ${metadata.fileName}`,
      `- Total Duration: ${durationSec.toFixed(1)} seconds`,
      `- Resolution: ${metadata.width}x${metadata.height}`,
      `- Target Clip Length: ${resolveTargetDurationText(durationMode)}`,
      `- Required Clips Count: ${clipCount} clips`,
      audioSummaryText ? `- Audio Summary / Context: ${audioSummaryText}` : "",
      "",
      SHORTS_PROMPTS.REQUIREMENTS_HEADER,
      "",
      SHORTS_PROMPTS.JSON_FORMAT_DIRECTIVE(clipCount),
    ]),
    "\n"
  );

const createHeuristicClips = (
  durationSec: number,
  clipCount: number,
  durationMode: ShortsDurationOption
): HighlightClipItem[] => {
  const clipLen = durationMode === ShortsDurationOption.RANGE_15_30 ? 25 : durationMode === ShortsDurationOption.RANGE_60_90 ? 75 : 45;
  const interval = Math.max(clipLen + 10, Math.floor(durationSec / (clipCount + 1)));

  return _.map(_.range(clipCount), (idx) => {
    const start = Math.min(durationSec - clipLen, Math.max(10, (idx + 1) * interval));
    const end = Math.min(durationSec, start + clipLen);
    const duration = parseFloat((end - start).toFixed(2));
    const startMins = Math.floor(start / 60);
    const startSecs = _.padStart(_.toString(Math.floor(start % 60)), 2, "0");
    return {
      id: `short_clip_${Date.now()}_${idx + 1}`,
      index: idx + 1,
      startTime: parseFloat(start.toFixed(2)),
      endTime: parseFloat(end.toFixed(2)),
      duration,
      title: `${SHORTS_TEXTS.DEFAULT_CLIP_PREFIX}${idx + 1} (${startMins}:${startSecs})`,
      hookReason: SHORTS_TEXTS.DEFAULT_HEURISTIC_REASON,
      viralScore: 90 + (idx % 8),
      outputVideoPath: "",
      videoUrl: "",
    };
  });
};

export async function analyzeVideoHighlights(request: HighlightAnalysisRequest): Promise<HighlightClipItem[]> {
  const { metadata, clipCount, durationMode, audioSummaryText, audioPath, aiExecution, signal } = request;
  const durationSec = metadata.duration > 0 ? metadata.duration : 1800;
  const prompt = buildHighlightPrompt(metadata, durationSec, clipCount, durationMode, audioSummaryText);

  const isRoomMode =
    aiExecution?.mode === AiPlanningExecutionMode.RoomOnly ||
    (aiExecution?.provider && aiExecution.provider !== AiPlanningFallbackProvider.Disabled && aiExecution.chromeHeadless === false);

  if (isRoomMode && aiExecution?.provider) {
    const projectId = aiExecution.projectId || `${SHORTS_CONSTANTS.PROJECT_ID_PREFIX}-${Date.now()}`;
    const requestId = `shorts-${Date.now()}`;
    try {
      const attachments = audioPath && fs.existsSync(audioPath)
        ? [{ name: `audio_${path.basename(audioPath)}`, mimeType: SHORTS_CONSTANTS.AUDIO_MIME_MPEG, path: audioPath }]
        : [];

      const result = await generatePlanningWithChatUi({
        provider: aiExecution.provider,
        model: aiExecution.model,
        prompt,
        projectId,
        chromeHeadless: aiExecution.chromeHeadless === true,
        attachments,
        artifactType: SHORTS_CONSTANTS.ARTIFACT_TYPE,
        requestId,
        signal,
        closeRoomOnComplete: false,
        allowDefaultGeminiModel: true,
      });

      const rawText = result?.text || "";
      const cleanedJson = _.trim(rawText.replace(SHORTS_REGEX.CODE_BLOCK_JSON, "").replace(SHORTS_REGEX.CODE_BLOCK, ""));
      const parsed = JSON.parse(cleanedJson);

      if (_.isArray(parsed) && !_.isEmpty(parsed)) {
        return _.map(_.take(parsed, clipCount), (item: any, idx: number): HighlightClipItem => {
          const parsedStart = Math.max(0, parseFloat(item.startTime || "0"));
          const parsedEnd = Math.min(durationSec, parseFloat(item.endTime || `${parsedStart + 45}`));
          const start = parseFloat(parsedStart.toFixed(2));
          const end = parseFloat((parsedEnd <= parsedStart || parsedEnd - parsedStart < 10 ? Math.min(durationSec, parsedStart + 45) : parsedEnd).toFixed(2));

          return {
            id: `short_clip_${Date.now()}_${idx + 1}`,
            index: idx + 1,
            startTime: start,
            endTime: end,
            duration: parseFloat((end - start).toFixed(2)),
            title: item.title || `${SHORTS_TEXTS.DEFAULT_CLIP_PREFIX}${idx + 1}`,
            hookReason: item.hookReason || SHORTS_TEXTS.DEFAULT_HOOK_REASON,
            viralScore: _.clamp(_.toNumber(item.viralScore) || 90, 70, 100),
            outputVideoPath: "",
            videoUrl: "",
          };
        });
      }
    } catch (chatError: any) {
      logger.warn(SHORTS_LOG_MESSAGES.CHAT_UI_WARN(chatError?.message || ""));
    }
  }

  try {
    const response = await generateContentWithRetry({
      contents: prompt,
      task: { capability: AiTaskCapability.ScriptWriting },
      config: { responseMimeType: "application/json" },
    });

    const rawText = _.isString(response) ? response : response?.candidates?.[0]?.content?.parts?.[0]?.text || response?.text || "";
    const cleanedJson = _.trim(rawText.replace(SHORTS_REGEX.CODE_BLOCK_JSON, "").replace(SHORTS_REGEX.CODE_BLOCK, ""));
    const parsed = JSON.parse(cleanedJson);

    if (!_.isArray(parsed) || _.isEmpty(parsed)) {
      throw new Error(SHORTS_TEXTS.ERR_NO_VALID_CLIPS_AI);
    }

    return _.map(_.take(parsed, clipCount), (item: any, idx: number): HighlightClipItem => {
      const parsedStart = Math.max(0, parseFloat(item.startTime || "0"));
      const parsedEnd = Math.min(durationSec, parseFloat(item.endTime || `${parsedStart + 45}`));
      const start = parseFloat(parsedStart.toFixed(2));
      const end = parseFloat((parsedEnd <= parsedStart || parsedEnd - parsedStart < 10 ? Math.min(durationSec, parsedStart + 45) : parsedEnd).toFixed(2));

      return {
        id: `short_clip_${Date.now()}_${idx + 1}`,
        index: idx + 1,
        startTime: start,
        endTime: end,
        duration: parseFloat((end - start).toFixed(2)),
        title: item.title || `${SHORTS_TEXTS.DEFAULT_CLIP_PREFIX}${idx + 1}`,
        hookReason: item.hookReason || SHORTS_TEXTS.DEFAULT_HOOK_REASON,
        viralScore: _.clamp(_.toNumber(item.viralScore) || 90, 70, 100),
        outputVideoPath: "",
        videoUrl: "",
      };
    });
  } catch (error: any) {
    logger.warn(SHORTS_LOG_MESSAGES.AI_FALLBACK_HEURISTIC(error?.message || ""));
    return createHeuristicClips(durationSec, clipCount, durationMode);
  }
}
