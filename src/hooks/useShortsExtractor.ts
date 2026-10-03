import { useState, useRef, useCallback } from "react";
import { toast } from "sonner";
import _ from "lodash";
import { HighlightClipItem, ShortsAspectRatio, ShortsDurationOption, ShortsProgressStage, ShortsProgressState, ShortsReframeMode, ShortsSourceMetadata } from "../types/shorts.js";
import { API_ROUTES } from "../constants/apiRoutes.js";
import { SHORTS_CONSTANTS, SHORTS_REGEX } from "../constants/shorts.js";
import { SHORTS_EXTRACTOR_TEXTS } from "../constants/texts.js";
import { Lang } from "../lib/lang.js";
import { AiPlanningChatModel, AiPlanningExecutionMode, AiPlanningFallbackProvider } from "../types.js";

export function useShortsExtractor(lang: Lang = "vi") {
  const isVi = lang === "vi";
  const text = SHORTS_EXTRACTOR_TEXTS[isVi ? "vi" : "en"];

  const [sourceVideoPath, setSourceVideoPath] = useState<string>("");
  const [sourceMetadata, setSourceMetadata] = useState<ShortsSourceMetadata | null>(null);
  const [aspectRatio, setAspectRatio] = useState<ShortsAspectRatio>(SHORTS_CONSTANTS.DEFAULT_ASPECT_RATIO);
  const [reframeMode, setReframeMode] = useState<ShortsReframeMode>(SHORTS_CONSTANTS.DEFAULT_REFRAME_MODE);
  const [clipCount, setClipCount] = useState<number>(SHORTS_CONSTANTS.DEFAULT_CLIP_COUNT);
  const [durationMode, setDurationMode] = useState<ShortsDurationOption>(SHORTS_CONSTANTS.DEFAULT_DURATION_MODE);

  const [aiProvider, setAiProvider] = useState<AiPlanningFallbackProvider>(AiPlanningFallbackProvider.GeminiChat);
  const [aiModel, setAiModel] = useState<AiPlanningChatModel>(AiPlanningChatModel.GeminiFlash);
  const [aiExecutionMode, setAiExecutionMode] = useState<AiPlanningExecutionMode>(AiPlanningExecutionMode.ApiOnly);
  const [aiChromeHeadless, setAiChromeHeadless] = useState<boolean>(true);

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progressState, setProgressState] = useState<ShortsProgressState>({
    stage: ShortsProgressStage.IDLE,
    percent: 0,
    message: "",
  });
  const [highlightClips, setHighlightClips] = useState<HighlightClipItem[]>([]);
  const [isExportingZip, setIsExportingZip] = useState<boolean>(false);
  const [downloadingClipId, setDownloadingClipId] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  const inspectVideo = useCallback(
    async (videoPath: string) => {
      if (!videoPath) return;
      try {
        const response = await fetch(API_ROUTES.SHORTS_METADATA, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ videoPath }),
        });
        const data = await response.json();
        if (response.ok && data.success) {
          setSourceMetadata(data.metadata);
        } else {
          toast.error(data.error || text.ERR_PROCESS);
        }
      } catch (err: any) {
        toast.error(err?.message || text.ERR_PROCESS);
      }
    },
    [text.ERR_PROCESS],
  );

  const handleSelectVideo = useCallback(
    async (pathStr: string) => {
      setSourceVideoPath(pathStr);
      setHighlightClips([]);
      setProgressState({ stage: ShortsProgressStage.IDLE, percent: 0, message: "" });
      if (pathStr) {
        await inspectVideo(pathStr);
      }
    },
    [inspectVideo],
  );

  const startGeneration = useCallback(async () => {
    if (!sourceVideoPath) {
      toast.error(text.ERR_NO_SOURCE);
      return;
    }

    setIsProcessing(true);
    setHighlightClips([]);
    setProgressState({
      stage: ShortsProgressStage.EXTRACTING_AUDIO,
      percent: 15,
      message: text.PROGRESS_EXTRACTING_AUDIO,
    });

    abortControllerRef.current = new AbortController();

    try {
      const progressTimer = setInterval(() => {
        setProgressState((prev) => {
          if (prev.percent < 40) {
            return { ...prev, percent: prev.percent + 5, stage: ShortsProgressStage.EXTRACTING_AUDIO, message: text.PROGRESS_EXTRACTING_AUDIO };
          }
          if (prev.percent < 75) {
            return { ...prev, percent: prev.percent + 3, stage: ShortsProgressStage.AI_ANALYZING, message: text.PROGRESS_AI_ANALYZING };
          }
          if (prev.percent < 92) {
            return { ...prev, percent: prev.percent + 1, stage: ShortsProgressStage.RENDERING_CLIPS, message: text.PROGRESS_RENDERING_CLIPS };
          }
          return prev;
        });
      }, 1200);

      const response = await fetch(API_ROUTES.SHORTS_GENERATE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceVideoPath,
          aspectRatio,
          reframeMode,
          clipCount,
          durationMode,
          aiExecution: {
            provider: aiProvider,
            model: aiModel,
            mode: aiExecutionMode,
            chromeHeadless: aiChromeHeadless,
            projectId: SHORTS_CONSTANTS.PROJECT_ID_PREFIX,
          },
        }),
        signal: abortControllerRef.current.signal,
      });

      clearInterval(progressTimer);

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || text.ERR_PROCESS);
      }

      setHighlightClips(data.clips || []);
      setProgressState({
        stage: ShortsProgressStage.COMPLETED,
        percent: 100,
        message: text.PROGRESS_COMPLETED,
      });
      toast.success(text.PROGRESS_COMPLETED);
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setProgressState({
          stage: ShortsProgressStage.ERROR,
          percent: 0,
          message: err?.message || text.ERR_PROCESS,
        });
        toast.error(err?.message || text.ERR_PROCESS);
      }
    } finally {
      setIsProcessing(false);
      abortControllerRef.current = null;
    }
  }, [sourceVideoPath, aspectRatio, reframeMode, clipCount, durationMode, text]);

  const cancelGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    fetch(API_ROUTES.SHORTS_CANCEL, { method: "POST" }).catch(() => {});
    setIsProcessing(false);
    setProgressState({
      stage: ShortsProgressStage.IDLE,
      percent: 0,
      message: text.PROGRESS_CANCELLED,
    });
    toast.info(text.PROGRESS_CANCELLED);
  }, [text.PROGRESS_CANCELLED]);

  const downloadSingleClip = useCallback(
    async (clip: HighlightClipItem) => {
      if (!clip?.outputVideoPath) {
        toast.error(text.ERR_PROCESS);
        return;
      }
      setDownloadingClipId(clip.id);
      const cleanTitle = _.replace(clip.title || `clip_${clip.index}`, SHORTS_REGEX.CLEAN_TITLE, "_");
      const suggestedName = `short_${clip.index}_${cleanTitle}${SHORTS_CONSTANTS.EXT_MP4}`;

      try {
        const destinationResponse = await fetch(API_ROUTES.SHORTS_SELECT_SAVE_DESTINATION, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ suggestedName, extension: SHORTS_CONSTANTS.EXT_MP4 }),
        });
        const destinationData = await destinationResponse.json();
        if (!destinationResponse.ok || !destinationData.success) {
          throw new Error(destinationData.error || text.SAVE_ERROR);
        }
        if (destinationData.cancelled || !destinationData.token) {
          toast.info(text.SAVE_CANCELLED);
          return;
        }

        const saveResponse = await fetch(API_ROUTES.SHORTS_SAVE_VIDEO, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: destinationData.token,
            sourceVideoPath: clip.outputVideoPath,
          }),
        });
        const saveData = await saveResponse.json();
        if (!saveResponse.ok || !saveData.success) {
          throw new Error(saveData.error || text.SAVE_ERROR);
        }

        toast.success(text.SAVE_SUCCESS);
      } catch (err: any) {
        toast.error(`${text.SAVE_ERROR} ${err?.message || ""}`.trim());
      } finally {
        setDownloadingClipId(null);
      }
    },
    [text],
  );

  const exportAllZip = useCallback(async () => {
    if (_.isEmpty(highlightClips)) return;
    setIsExportingZip(true);
    try {
      const videoPaths = _.compact(_.map(highlightClips, (c) => c.outputVideoPath));
      if (_.isEmpty(videoPaths)) {
        toast.error(text.ERR_PROCESS);
        return;
      }

      const suggestedName = `shorts_export_${Date.now()}${SHORTS_CONSTANTS.EXT_ZIP}`;
      const destinationResponse = await fetch(API_ROUTES.SHORTS_SELECT_SAVE_DESTINATION, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ suggestedName, extension: SHORTS_CONSTANTS.EXT_ZIP }),
      });
      const destinationData = await destinationResponse.json();
      if (!destinationResponse.ok || !destinationData.success) {
        throw new Error(destinationData.error || text.ZIP_ERROR);
      }
      if (destinationData.cancelled || !destinationData.token) {
        toast.info(text.SAVE_CANCELLED);
        return;
      }

      const response = await fetch(API_ROUTES.SHORTS_BUILD_ZIP, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: destinationData.token,
          videoPaths,
        }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        toast.success(text.ZIP_SUCCESS);
      } else {
        throw new Error(data.error || text.ZIP_ERROR);
      }
    } catch (err: any) {
      toast.error(`${text.ZIP_ERROR} ${err?.message || ""}`.trim());
    } finally {
      setIsExportingZip(false);
    }
  }, [highlightClips, text]);

  return {
    sourceVideoPath,
    sourceMetadata,
    aspectRatio,
    reframeMode,
    clipCount,
    durationMode,
    aiProvider,
    aiModel,
    aiExecutionMode,
    aiChromeHeadless,
    isProcessing,
    progressState,
    highlightClips,
    isExportingZip,
    downloadingClipId,
    setAspectRatio,
    setReframeMode,
    setClipCount,
    setDurationMode,
    setAiProvider,
    setAiModel,
    setAiExecutionMode,
    setAiChromeHeadless,
    handleSelectVideo,
    startGeneration,
    cancelGeneration,
    downloadSingleClip,
    exportAllZip,
  };
}
