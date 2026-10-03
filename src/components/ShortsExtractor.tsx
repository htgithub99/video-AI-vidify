import { ChangeEvent, DragEvent, FC, useEffect, useRef, useState } from "react";
import _ from "lodash";
import {
  Scissors,
  Sparkles,
  Download,
  Flame,
  FileVideo,
  Clock,
  Monitor,
  HardDrive,
  Upload,
  SlidersHorizontal,
  Smartphone,
  Tv,
  Square,
  Layers,
  Crop,
  Crosshair,
  Play,
  Pause,
  FolderDown,
  Film,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "./ui/Button.js";
import { Tooltip } from "./ui/Tooltip.js";
import { Lang } from "../lib/lang.js";
import { cn } from "../lib/utils.js";
import { jsonUtils } from "../lib/json.js";
import ChatPlanningSettingsBlock from "./common/ChatPlanningSettingsBlock.js";
import {
  AiPlanningChatModel,
  AiPlanningExecutionMode,
  AiPlanningFallbackProvider,
} from "../types.js";
import { API_ROUTES } from "../constants/apiRoutes.js";
import { SHORTS_EXTRACTOR_TEXTS } from "../constants/texts.js";
import {
  SHORTS_CONSTANTS,
  SHORTS_REGEX,
  SHORTS_UI_CONSTANTS,
} from "../constants/shorts.js";
import {
  HighlightClipItem,
  ShortsAspectRatio,
  ShortsDurationOption,
  ShortsProgressStage,
  ShortsProgressState,
  ShortsReframeMode,
  ShortsSourceMetadata,
} from "../types/shorts.js";

const formatDuration = (seconds?: number): string => {
  if (!seconds || seconds <= 0) return SHORTS_UI_CONSTANTS.DEFAULT_ZERO_DURATION;
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hrs > 0) {
    return `${hrs}:${_.padStart(_.toString(mins), 2, "0")}:${_.padStart(_.toString(secs), 2, "0")}`;
  }
  return `${_.padStart(_.toString(mins), 2, "0")}:${_.padStart(_.toString(secs), 2, "0")}`;
};

const formatFileSize = (bytes?: number): string => {
  if (!bytes || bytes <= 0) return SHORTS_UI_CONSTANTS.DEFAULT_ZERO_FILESIZE;
  if (bytes >= 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const openShortsDatabase = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const request = indexedDB.open(SHORTS_CONSTANTS.DB_NAME, SHORTS_CONSTANTS.DB_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(SHORTS_CONSTANTS.DB_STORE_RESULTS)) {
        request.result.createObjectStore(SHORTS_CONSTANTS.DB_STORE_RESULTS, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const ShortsExtractor: FC<{ currentLang?: Lang }> = ({ currentLang = "vi" }) => {
  const isVi = currentLang === "vi";
  const text = SHORTS_EXTRACTOR_TEXTS[isVi ? "vi" : "en"];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const [sourceVideoPath, setSourceVideoPath] = useState<string>("");
  const [sourceMetadata, setSourceMetadata] = useState<ShortsSourceMetadata | null>(null);
  const [aspectRatio, setAspectRatio] = useState<ShortsAspectRatio>(ShortsAspectRatio.VERTICAL_9_16);
  const [reframeMode, setReframeMode] = useState<ShortsReframeMode>(ShortsReframeMode.BLUR_BACKGROUND);
  const [clipCount, setClipCount] = useState<number>(SHORTS_CONSTANTS.DEFAULT_CLIP_COUNT);
  const [durationMode, setDurationMode] = useState<ShortsDurationOption>(ShortsDurationOption.AUTO);

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isExportingZip, setIsExportingZip] = useState<boolean>(false);
  const [downloadingClipId, setDownloadingClipId] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [isAiConfigOpen, setIsAiConfigOpen] = useState<boolean>(false);
  const [settingsLoaded, setSettingsLoaded] = useState<boolean>(false);
  const [activePlayingId, setActivePlayingId] = useState<string | null>(null);
  const sourceVideoRef = useRef<HTMLVideoElement | null>(null);

  const [progressState, setProgressState] = useState<ShortsProgressState>({
    stage: ShortsProgressStage.IDLE,
    percent: 0,
    message: "",
  });
  const [highlightClips, setHighlightClips] = useState<HighlightClipItem[]>([]);

  const [aiProvider, setAiProvider] = useState<AiPlanningFallbackProvider>(AiPlanningFallbackProvider.GeminiChat);
  const [aiModel, setAiModel] = useState<AiPlanningChatModel>(AiPlanningChatModel.GeminiFlash);
  const [aiExecutionMode, setAiExecutionMode] = useState<AiPlanningExecutionMode>(AiPlanningExecutionMode.ApiOnly);
  const [aiChromeHeadless, setAiChromeHeadless] = useState<boolean>(true);

  useEffect(() => {
    try {
      const saved = jsonUtils.getItem<Record<string, any>>(SHORTS_CONSTANTS.SETTINGS_STORAGE_KEY, {});
      if (saved.aspectRatio) setAspectRatio(saved.aspectRatio);
      if (saved.reframeMode) setReframeMode(saved.reframeMode);
      if (Number.isFinite(saved.clipCount) && saved.clipCount > 0) setClipCount(saved.clipCount);
      if (saved.durationMode) setDurationMode(saved.durationMode);
      if (saved.aiProvider) setAiProvider(saved.aiProvider);
      if (saved.aiModel) setAiModel(saved.aiModel);
      if (saved.aiExecutionMode) setAiExecutionMode(saved.aiExecutionMode);
      if (typeof saved.aiChromeHeadless === "boolean") setAiChromeHeadless(saved.aiChromeHeadless);
    } catch {} finally {
      setSettingsLoaded(true);
    }

    openShortsDatabase()
      .then((db) => {
        const tx = db.transaction(SHORTS_CONSTANTS.DB_STORE_RESULTS, "readonly");
        const getReq = tx.objectStore(SHORTS_CONSTANTS.DB_STORE_RESULTS).get(SHORTS_CONSTANTS.DB_KEY_RESULTS);
        getReq.onsuccess = () => {
          if (getReq.result?.clips) setHighlightClips(getReq.result.clips);
          if (getReq.result?.metadata) setSourceMetadata(getReq.result.metadata);
          if (getReq.result?.sourcePath) setSourceVideoPath(getReq.result.sourcePath);
        };
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!settingsLoaded) return;
    jsonUtils.setItem(SHORTS_CONSTANTS.SETTINGS_STORAGE_KEY, {
      aspectRatio,
      reframeMode,
      clipCount,
      durationMode,
      aiProvider,
      aiModel,
      aiExecutionMode,
      aiChromeHeadless,
    });
  }, [settingsLoaded, aspectRatio, reframeMode, clipCount, durationMode, aiProvider, aiModel, aiExecutionMode, aiChromeHeadless]);

  useEffect(() => {
    if (_.isEmpty(highlightClips)) return;
    openShortsDatabase()
      .then((db) => {
        const tx = db.transaction(SHORTS_CONSTANTS.DB_STORE_RESULTS, "readwrite");
        tx.objectStore(SHORTS_CONSTANTS.DB_STORE_RESULTS).put({
          id: SHORTS_CONSTANTS.DB_KEY_RESULTS,
          clips: highlightClips,
          metadata: sourceMetadata,
          sourcePath: sourceVideoPath,
        });
      })
      .catch(() => {});
  }, [highlightClips, sourceMetadata, sourceVideoPath]);

  useEffect(() => {
    if (activePlayingId && activePlayingId !== SHORTS_UI_CONSTANTS.SOURCE_PLAYING_ID && sourceVideoRef.current && !sourceVideoRef.current.paused) {
      sourceVideoRef.current.pause();
    }
  }, [activePlayingId]);

  const inspectVideo = async (filePath: string) => {
    if (!filePath) return;
    try {
      const response = await fetch(API_ROUTES.SHORTS_METADATA, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoPath: filePath }),
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
  };

  const handleSelectVideoFile = async () => {
    if (isProcessing) return;
    try {
      const response = await fetch(API_ROUTES.PIPELINE_SELECT_FILE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();
      if (data.success && data.filePath) {
        setSourceVideoPath(data.filePath);
        await inspectVideo(data.filePath);
      }
    } catch {
      fileInputRef.current?.click();
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const pathStr = (file as any).path || file.name;
    setSourceVideoPath(pathStr);
    inspectVideo(pathStr);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isProcessing) setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (isProcessing) return;
    const file = e.dataTransfer.files?.[0];
    if (file && SHORTS_REGEX.VIDEO_EXT.test(file.name)) {
      const pathStr = (file as any).path || file.name;
      setSourceVideoPath(pathStr);
      inspectVideo(pathStr);
    }
  };

  const handleStartGeneration = async () => {
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
  };

  const handleCancelGeneration = () => {
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
  };

  const handleDownloadSingleVideo = async (clip: HighlightClipItem) => {
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
  };

  const handleDownloadZip = async () => {
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
  };

  const hasSource = Boolean(sourceVideoPath);
  const hasClips = !_.isEmpty(highlightClips);
  const isProgressRunning = progressState.stage !== "idle" && progressState.stage !== "completed" && progressState.stage !== "error";

  return (
    <div
      aria-busy={isProcessing}
      className={cn("creation-workspace w-full h-full min-h-0 flex flex-col overflow-y-auto p-4 sm:p-6 bg-slate-955 font-sans text-slate-100 custom-scrollbar")}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        className={cn("hidden")}
        onChange={handleFileInputChange}
      />

      <div
        className={cn("bg-gradient-to-b from-slate-900/90 to-slate-950/95 rounded-xl sm:rounded-2xl p-4 sm:p-6 space-y-5 shadow-2xl relative overflow-visible w-full border border-slate-800/80")}
      >
        <div className={cn("glass-card rounded-2xl p-4 sm:p-5 shadow-lg border border-slate-800/80 bg-slate-900/60 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4")}>
          <div className={cn("flex items-center gap-3 min-w-0")}>
            <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-500 via-fuchsia-500 to-pink-600 p-0.5 shadow-md shadow-purple-500/20 shrink-0")}>
              <div className={cn("w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-purple-400")}>
                <Scissors className={cn("w-5 h-5")} />
              </div>
            </div>
            <div className={cn("min-w-0")}>
              <div className={cn("flex items-center gap-2 flex-wrap")}>
                <h1 className={cn("text-base sm:text-lg font-black text-slate-100 tracking-tight uppercase font-sans")}>
                  {text.HEADER_TITLE}
                </h1>
                <span className={cn("px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider bg-purple-500/15 border border-purple-500/30 text-purple-300 flex items-center gap-1 shadow-xs")}>
                  <Sparkles className={cn("w-2.5 h-2.5 text-purple-400")} />
                  {text.HEADER_BADGE}
                </span>
              </div>
              <p className={cn("text-[11px] text-slate-400 mt-0.5")}>{text.HEADER_DESC}</p>
            </div>
          </div>

          <div className={cn("flex items-center gap-2 self-start sm:self-auto")}>
            <Tooltip content={text.AI_CONFIG_TOOLTIP} align="end">
              <Button
                variant="unstyled"
                type="button"
                onClick={() => setIsAiConfigOpen(!isAiConfigOpen)}
                disabled={isProcessing}
                className={cn(
                  "group inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-xs leading-none select-none",
                  {
                    "bg-purple-600/15 border-purple-500/50 text-purple-700 dark:text-purple-300 shadow-purple-500/10": isAiConfigOpen,
                    "bg-white/95 hover:bg-purple-50/90 border-slate-200/90 hover:border-purple-300/80 text-slate-800 hover:text-purple-700 dark:bg-slate-900/90 dark:hover:bg-slate-850 dark:border-slate-800 dark:hover:border-purple-500/40 dark:text-slate-200 dark:hover:text-purple-300": !isAiConfigOpen,
                  }
                )}
              >
                <SlidersHorizontal className={cn("w-3.5 h-3.5 text-purple-500 dark:text-purple-400 shrink-0 group-hover:scale-105 transition-transform")} />
                <span className={cn("inline-flex items-center leading-none text-slate-800 dark:text-slate-200 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors")}>
                  {text.AI_CONFIG_TITLE}
                </span>
                {isAiConfigOpen ? (
                  <ChevronUp className={cn("w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0 transition-colors")} />
                ) : (
                  <ChevronDown className={cn("w-3.5 h-3.5 text-slate-500 dark:text-slate-400 group-hover:text-purple-600 dark:group-hover:text-purple-300 shrink-0 transition-colors")} />
                )}
              </Button>
            </Tooltip>
          </div>
        </div>

        {isAiConfigOpen && (
          <fieldset
            disabled={isProcessing}
            className={cn("glass-card rounded-2xl p-4 bg-slate-900/80 border border-slate-800/90 shadow-xl space-y-4 text-left")}
          >
            <ChatPlanningSettingsBlock
              provider={aiProvider}
              model={aiModel}
              executionMode={aiExecutionMode}
              chromeHeadless={aiChromeHeadless}
              onProviderChange={setAiProvider}
              onModelChange={setAiModel}
              onExecutionModeChange={setAiExecutionMode}
              onChromeHeadlessChange={setAiChromeHeadless}
              currentLang={currentLang}
            />
          </fieldset>
        )}

        <div className={cn("grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch")}>
          <div className={cn("lg:col-span-2 flex flex-col gap-5 min-w-0 h-full")}>
            <div className={cn("glass-card rounded-2xl sm:rounded-3xl p-5 space-y-4 shadow-xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-xl relative overflow-hidden text-left w-full h-full flex flex-col justify-start")}>
              <div className={cn("flex items-center justify-between relative z-10 flex-wrap gap-2")}>
                <div className={cn("flex items-center gap-2.5 min-w-0")}>
                  <span className={cn("w-6 h-6 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center font-mono font-black text-xs shadow-sm shadow-purple-500/20")}>
                    {text.STEP_01}
                  </span>
                  <h3 className={cn("text-xs font-bold uppercase tracking-wider text-slate-100 font-mono flex items-center gap-1.5")}>
                    <Film className={cn("w-3.5 h-3.5 text-purple-400")} />
                    <span>{text.SOURCE_TITLE}</span>
                    <span className={cn("px-1.5 py-0.2 rounded text-[9px] bg-purple-500/15 border border-purple-500/30 text-purple-300 font-mono")}>
                      {text.SOURCE_BADGE}
                    </span>
                  </h3>
                </div>

                {hasSource && (
                  <Button
                    variant="unstyled"
                    type="button"
                    onClick={handleSelectVideoFile}
                    disabled={isProcessing}
                    className={cn("px-3 py-1 rounded-xl text-xs font-medium text-purple-300 bg-purple-500/15 border border-purple-500/30 hover:bg-purple-500/25 transition-colors cursor-pointer")}
                  >
                    {text.CHANGE_FILE_BTN}
                  </Button>
                )}
              </div>

              <div className={cn("relative w-full aspect-video max-h-[340px] min-h-[220px] rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center shadow-2xl group/source")}>
                {hasSource ? (
                  <>
                    <video
                      ref={sourceVideoRef}
                      key={sourceVideoPath}
                      src={
                        sourceVideoPath.startsWith(SHORTS_UI_CONSTANTS.PROTOCOLS.BLOB) || sourceVideoPath.startsWith(SHORTS_UI_CONSTANTS.PROTOCOLS.HTTP)
                          ? sourceVideoPath
                          : `${API_ROUTES.SHORTS_STREAM_SOURCE}?path=${encodeURIComponent(sourceVideoPath)}`
                      }
                      controls
                      preload="metadata"
                      playsInline
                      onPlay={() => setActivePlayingId(SHORTS_UI_CONSTANTS.SOURCE_PLAYING_ID)}
                      onPause={() => {
                        if (activePlayingId === SHORTS_UI_CONSTANTS.SOURCE_PLAYING_ID) setActivePlayingId(null);
                      }}
                      className={cn("w-full h-full object-contain rounded-2xl bg-black")}
                    />
                    <div className={cn("absolute top-3 left-3 px-3 py-1 rounded-xl bg-slate-950/80 backdrop-blur-md border border-purple-500/30 text-slate-200 text-xs font-semibold flex items-center gap-1.5 shadow-lg max-w-[70%]")}>
                      <Film className={cn("w-3.5 h-3.5 text-purple-400 shrink-0")} />
                      <span className="truncate">{sourceMetadata?.fileName || sourceVideoPath}</span>
                    </div>
                  </>
                ) : (
                  <div
                    onClick={handleSelectVideoFile}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={cn("w-full h-full border-2 border-dashed rounded-2xl p-6 transition-all flex flex-col items-center justify-center text-center cursor-pointer group", {
                      "border-purple-500 bg-purple-500/10 scale-[1.01]": isDragOver,
                      "border-slate-700/80 bg-slate-950/40 hover:border-purple-500/60 hover:bg-purple-500/5": !isDragOver,
                      "opacity-60 cursor-not-allowed": isProcessing,
                    })}
                  >
                    <div className={cn("w-12 h-12 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform shadow-md")}>
                      <Upload className={cn("w-6 h-6 text-purple-400 group-hover:text-purple-300")} />
                    </div>
                    <div className={cn("space-y-1")}>
                      <p className={cn("text-sm font-medium text-slate-200")}>{text.SOURCE_DROP_TITLE}</p>
                      <p className={cn("text-xs text-slate-400")}>{text.SOURCE_DROP_HINT}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className={cn("min-h-[58px] w-full transition-all")}>
                {sourceMetadata ? (
                  <div className={cn("grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 animate-in fade-in duration-200")}>
                    <div className={cn("bg-slate-950/60 border border-slate-800 rounded-xl p-2.5 flex items-center gap-2")}>
                      <Clock className={cn("w-4 h-4 text-purple-400 shrink-0")} />
                      <div className={cn("min-w-0")}>
                        <div className={cn("text-[10px] text-slate-400 font-mono uppercase")}>{text.METADATA_DURATION}</div>
                        <div className={cn("text-xs font-bold text-slate-200 truncate")}>
                          {formatDuration(sourceMetadata.duration)}
                        </div>
                      </div>
                    </div>

                    <div className={cn("bg-slate-950/60 border border-slate-800 rounded-xl p-2.5 flex items-center gap-2")}>
                      <Monitor className={cn("w-4 h-4 text-blue-400 shrink-0")} />
                      <div className={cn("min-w-0")}>
                        <div className={cn("text-[10px] text-slate-400 font-mono uppercase")}>{text.METADATA_RESOLUTION}</div>
                        <div className={cn("text-xs font-bold text-slate-200 truncate")}>
                          {sourceMetadata.width}x{sourceMetadata.height}
                        </div>
                      </div>
                    </div>

                    <div className={cn("bg-slate-950/60 border border-slate-800 rounded-xl p-2.5 flex items-center gap-2")}>
                      <HardDrive className={cn("w-4 h-4 text-amber-400 shrink-0")} />
                      <div className={cn("min-w-0")}>
                        <div className={cn("text-[10px] text-slate-400 font-mono uppercase")}>{text.METADATA_FILESIZE}</div>
                        <div className={cn("text-xs font-bold text-slate-200 truncate")}>
                          {formatFileSize(sourceMetadata.fileSizeBytes)}
                        </div>
                      </div>
                    </div>

                    <div className={cn("bg-slate-950/60 border border-slate-800 rounded-xl p-2.5 flex items-center gap-2")}>
                      <FileVideo className={cn("w-4 h-4 text-pink-400 shrink-0")} />
                      <div className={cn("min-w-0")}>
                        <div className={cn("text-[10px] text-slate-400 font-mono uppercase")}>{text.METADATA_FPS}</div>
                        <div className={cn("text-xs font-bold text-slate-200 truncate")}>
                          {sourceMetadata.fps} FPS
                        </div>
                      </div>
                    </div>
                  </div>
                ) : hasSource ? (
                  <div className={cn("grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1")}>
                    {_.map(_.range(4), (idx) => (
                      <div key={idx} className={cn("bg-slate-950/40 border border-slate-800/50 rounded-xl p-2.5 flex items-center gap-2 animate-pulse h-[52px]")}>
                        <div className={cn("w-4 h-4 rounded bg-slate-800/80 shrink-0")} />
                        <div className={cn("space-y-1.5 flex-1 min-w-0")}>
                          <div className={cn("h-2 w-12 bg-slate-800/80 rounded")} />
                          <div className={cn("h-2.5 w-16 bg-slate-800/60 rounded")} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className={cn("lg:col-span-1 flex flex-col gap-5 min-w-0 h-full")}>
            <div className={cn("glass-card rounded-2xl sm:rounded-3xl p-5 space-y-4 shadow-xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-xl relative overflow-hidden text-left w-full")}>
              <div className={cn("flex items-center justify-between border-b border-slate-800/80 pb-3")}>
                <div className={cn("flex items-center gap-2.5 min-w-0")}>
                  <div className={cn("w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-500 to-pink-600 p-0.5 shadow-xs shadow-purple-500/20 shrink-0")}>
                    <div className={cn("w-full h-full bg-slate-950 rounded-[6px] flex items-center justify-center")}>
                      <SlidersHorizontal className={cn("w-4 h-4 text-purple-400")} />
                    </div>
                  </div>
                  <div>
                    <h2 className={cn("text-xs font-bold uppercase tracking-wider text-slate-100 font-mono flex items-center gap-1.5")}>
                      {text.CONFIG_TITLE}
                    </h2>
                  </div>
                </div>
                <span className={cn("px-2 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-400 text-[9px] font-black tracking-normal")}>
                  {text.CONFIG_BADGE}
                </span>
              </div>

              <div className={cn("space-y-2")}>
                <label className={cn("text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider")}>
                  {text.ASPECT_RATIO_LABEL}
                </label>
                <div className={cn("grid grid-cols-3 gap-1.5")}>
                  <Button
                    variant="unstyled"
                    type="button"
                    disabled={isProcessing}
                    onClick={() => setAspectRatio(ShortsAspectRatio.VERTICAL_9_16)}
                    className={cn("h-8 rounded-xl border font-mono font-bold text-xs flex items-center justify-center transition-all cursor-pointer shadow-xs select-none gap-1", {
                      "bg-gradient-to-r from-purple-600 to-pink-600 border-purple-400 text-white shadow-purple-600/30 shadow-md scale-[1.02]": aspectRatio === ShortsAspectRatio.VERTICAL_9_16,
                      "bg-slate-955/90 border-slate-800 text-slate-300 hover:text-white hover:border-purple-500/40 hover:bg-slate-900": aspectRatio !== ShortsAspectRatio.VERTICAL_9_16,
                    })}
                  >
                    <Smartphone className={cn("w-3.5 h-3.5 shrink-0")} />
                    <span>9:16</span>
                  </Button>

                  <Button
                    variant="unstyled"
                    type="button"
                    disabled={isProcessing}
                    onClick={() => setAspectRatio(ShortsAspectRatio.HORIZONTAL_16_9)}
                    className={cn("h-8 rounded-xl border font-mono font-bold text-xs flex items-center justify-center transition-all cursor-pointer shadow-xs select-none gap-1", {
                      "bg-gradient-to-r from-purple-600 to-pink-600 border-purple-400 text-white shadow-purple-600/30 shadow-md scale-[1.02]": aspectRatio === ShortsAspectRatio.HORIZONTAL_16_9,
                      "bg-slate-955/90 border-slate-800 text-slate-300 hover:text-white hover:border-purple-500/40 hover:bg-slate-900": aspectRatio !== ShortsAspectRatio.HORIZONTAL_16_9,
                    })}
                  >
                    <Tv className={cn("w-3.5 h-3.5 shrink-0")} />
                    <span>16:9</span>
                  </Button>

                  <Button
                    variant="unstyled"
                    type="button"
                    disabled={isProcessing}
                    onClick={() => setAspectRatio(ShortsAspectRatio.SQUARE_1_1)}
                    className={cn("h-8 rounded-xl border font-mono font-bold text-xs flex items-center justify-center transition-all cursor-pointer shadow-xs select-none gap-1", {
                      "bg-gradient-to-r from-purple-600 to-pink-600 border-purple-400 text-white shadow-purple-600/30 shadow-md scale-[1.02]": aspectRatio === ShortsAspectRatio.SQUARE_1_1,
                      "bg-slate-955/90 border-slate-800 text-slate-300 hover:text-white hover:border-purple-500/40 hover:bg-slate-900": aspectRatio !== ShortsAspectRatio.SQUARE_1_1,
                    })}
                  >
                    <Square className={cn("w-3.5 h-3.5 shrink-0")} />
                    <span>1:1</span>
                  </Button>
                </div>
              </div>

              {aspectRatio === ShortsAspectRatio.VERTICAL_9_16 && (
                <div className={cn("space-y-1.5 pt-1")}>
                  <label className={cn("text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between")}>
                    <span>{text.REFRAME_LABEL}</span>
                  </label>
                  <div className={cn("grid grid-cols-3 gap-1.5")}>
                    {[
                      { mode: ShortsReframeMode.BLUR_BACKGROUND, label: text.REFRAME_BLUR_TAG, icon: Layers },
                      { mode: ShortsReframeMode.CENTER_CROP, label: text.REFRAME_CROP_TAG, icon: Crop },
                      { mode: ShortsReframeMode.SMART_TRACKING, label: text.REFRAME_TRACKING_TAG, icon: Crosshair },
                    ].map((item) => {
                      const isSelected = reframeMode === item.mode;
                      const Icon = item.icon;
                      return (
                        <Button
                          variant="unstyled"
                          key={item.mode}
                          type="button"
                          disabled={isProcessing}
                          onClick={() => setReframeMode(item.mode)}
                          className={cn("h-8 rounded-xl border font-mono font-bold text-[11px] flex items-center justify-center transition-all cursor-pointer shadow-xs select-none gap-1 px-1", {
                            "bg-gradient-to-r from-indigo-600 to-purple-600 border-indigo-400 text-white shadow-indigo-600/30 shadow-md scale-[1.02]": isSelected,
                            "bg-slate-955/90 border-slate-800 text-slate-300 hover:text-white hover:border-indigo-500/40 hover:bg-slate-900": !isSelected,
                          })}
                        >
                          <Icon className={cn("w-3 h-3 shrink-0")} />
                          <span className="truncate">{item.label}</span>
                        </Button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className={cn("space-y-2 pt-1")}>
                <div className={cn("flex items-center justify-between")}>
                  <label className={cn("text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider")}>
                    {text.CLIP_COUNT_LABEL}
                  </label>
                  <span className={cn("text-xs font-mono font-bold text-purple-300")}>
                    {clipCount} {text.CLIP_UNIT}
                  </span>
                </div>
                <div className={cn("grid grid-cols-4 gap-1.5")}>
                  {SHORTS_CONSTANTS.PRESET_CLIP_COUNTS.map((num) => (
                    <Button
                      variant="unstyled"
                      key={num}
                      type="button"
                      disabled={isProcessing}
                      onClick={() => setClipCount(num)}
                      className={cn("h-8 rounded-xl border font-mono font-bold text-xs flex items-center justify-center transition-all cursor-pointer shadow-xs select-none", {
                        "bg-gradient-to-r from-purple-600 to-pink-600 border-purple-400 text-white shadow-purple-600/30 shadow-md scale-[1.02]": clipCount === num,
                        "bg-slate-955/90 border-slate-800 text-slate-300 hover:text-white hover:border-purple-500/40 hover:bg-slate-900": clipCount !== num,
                      })}
                    >
                      {num}
                    </Button>
                  ))}
                </div>
              </div>

              <div className={cn("space-y-2 pt-1")}>
                <div className={cn("flex items-center justify-between")}>
                  <label className={cn("text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider")}>
                    {text.DURATION_LABEL}
                  </label>
                  <span className={cn("text-xs font-mono font-bold text-amber-300")}>
                    {durationMode === ShortsDurationOption.AUTO
                      ? `${text.DURATION_AUTO_SHORT} (${text.DURATION_AUTO_BADGE})`
                      : durationMode === ShortsDurationOption.RANGE_15_30
                      ? text.DURATION_15_30
                      : durationMode === ShortsDurationOption.RANGE_30_60
                      ? text.DURATION_30_60
                      : text.DURATION_60_90}
                  </span>
                </div>
                <div className={cn("grid grid-cols-4 gap-1.5")}>
                  {[
                    { value: ShortsDurationOption.AUTO, label: text.DURATION_AUTO_SHORT },
                    { value: ShortsDurationOption.RANGE_15_30, label: "15-30s" },
                    { value: ShortsDurationOption.RANGE_30_60, label: "30-60s" },
                    { value: ShortsDurationOption.RANGE_60_90, label: "60-90s" },
                  ].map((opt) => (
                    <Button
                      variant="unstyled"
                      key={opt.value}
                      type="button"
                      disabled={isProcessing}
                      onClick={() => setDurationMode(opt.value)}
                      className={cn("h-8 rounded-xl border font-mono font-bold text-[11px] flex items-center justify-center transition-all text-center cursor-pointer shadow-xs select-none", {
                        "bg-gradient-to-r from-amber-600 to-rose-600 border-amber-400 text-white shadow-amber-600/30 shadow-md scale-[1.02]": durationMode === opt.value,
                        "bg-slate-955/90 border-slate-800 text-slate-300 hover:text-white hover:border-amber-500/40 hover:bg-slate-900": durationMode !== opt.value,
                      })}
                    >
                      {opt.label}
                    </Button>
                  ))}
                </div>
              </div>

              {progressState.stage !== ShortsProgressStage.IDLE && (
                <div className={cn("p-3 rounded-xl bg-slate-955/80 border border-slate-800/90 space-y-2 text-[11px] font-mono")}>
                  <div className={cn("flex items-center justify-between")}>
                    <span className={cn("text-slate-300 font-bold truncate max-w-[80%]")}>{progressState.message}</span>
                    <span className={cn("font-bold text-purple-300")}>{progressState.percent}%</span>
                  </div>
                  <div className={cn("w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800")}>
                    <div
                      className={cn("h-full rounded-full transition-all duration-300", {
                        "bg-rose-500": progressState.stage === ShortsProgressStage.ERROR,
                        "bg-emerald-400": progressState.stage === ShortsProgressStage.COMPLETED,
                        "bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 animate-pulse": isProgressRunning,
                      })}
                      style={{ width: `${progressState.percent}%` }}
                    />
                  </div>
                </div>
              )}

              <div className={cn("space-y-2 pt-1")}>
                <div className={cn("flex items-center gap-2")}>
                  <Button
                    variant="unstyled"
                    type="button"
                    onClick={handleStartGeneration}
                    disabled={isProcessing || !hasSource}
                    className={cn(
                      "flex-1 h-11 min-h-[44px] px-4 rounded-xl font-extrabold text-xs inline-flex items-center justify-center gap-2 transition-all shadow-lg tracking-wider uppercase font-sans border leading-none",
                      {
                        "bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 border-purple-400/50 text-white cursor-wait animate-pulse": isProcessing,
                        "bg-gradient-to-r from-rose-600 via-purple-600 to-indigo-600 hover:from-rose-500 hover:via-purple-500 hover:to-indigo-500 border-rose-400/40 shadow-rose-600/25 active:scale-[0.98] text-white cursor-pointer":
                          !isProcessing && hasSource,
                        "bg-slate-800/80 border-slate-700 text-slate-500 cursor-not-allowed shadow-none":
                          !isProcessing && !hasSource,
                      },
                    )}
                  >
                    {isProcessing ? (
                      <>
                        <Sparkles className={cn("w-4 h-4 animate-spin text-white shrink-0")} />
                        <span className={cn("truncate inline-flex items-center leading-none")}>
                          {text.GENERATING_BTN}
                        </span>
                      </>
                    ) : (
                      <>
                        <Scissors className={cn("w-4 h-4 shrink-0")} />
                        <span className={cn("inline-flex items-center leading-none")}>
                          {text.GENERATE_BTN}
                        </span>
                      </>
                    )}
                  </Button>

                  {isProcessing && (
                    <Button
                      variant="unstyled"
                      type="button"
                      onClick={handleCancelGeneration}
                      className={cn("h-11 min-h-[44px] px-4 rounded-xl border border-rose-500/40 bg-rose-500/15 hover:bg-rose-500/25 text-rose-200 text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer shrink-0")}
                    >
                      <Square className={cn("w-3.5 h-3.5 fill-rose-300/30")} />
                      <span>{text.STOP_BTN}</span>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={cn("glass-card rounded-2xl sm:rounded-3xl p-5 space-y-4 shadow-xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-xl relative overflow-hidden text-left w-full")}>
          <div className={cn("flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4")}>
            <div className={cn("flex items-center gap-2.5 min-w-0")}>
              <span className={cn("w-6 h-6 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center font-mono font-black text-xs shadow-sm shadow-purple-500/20")}>
                {text.STEP_03}
              </span>
              <div>
                <h3 className={cn("text-sm font-bold uppercase tracking-wider text-slate-100 font-mono flex items-center gap-2")}>
                  <Flame className={cn("w-4 h-4 text-amber-400", { "animate-bounce": isProcessing })} />
                  <span>{text.RESULTS_TITLE}</span>
                  <span className={cn("px-2 py-0.5 rounded-full text-[9px] bg-purple-500/15 border border-purple-500/30 text-purple-300 font-mono")}>
                    {isProcessing
                      ? `${clipCount} ${text.CLIP_UNIT}`
                      : hasClips
                      ? `${highlightClips.length} ${text.CLIP_UNIT}`
                      : `0 ${text.CLIP_UNIT}`}
                  </span>
                </h3>
              </div>
            </div>

            {!isProcessing && hasClips && (
              <Button
                variant="unstyled"
                type="button"
                onClick={handleDownloadZip}
                disabled={isExportingZip}
                className={cn(
                  "h-9 px-4 rounded-xl font-bold text-xs inline-flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md leading-none bg-gradient-to-r from-rose-600 via-purple-600 to-indigo-600 hover:from-rose-500 hover:via-purple-500 hover:to-indigo-500 border border-rose-400/40 text-white shadow-rose-600/25 active:scale-95",
                )}
              >
                {isExportingZip ? (
                  <>
                    <Sparkles className={cn("w-3.5 h-3.5 animate-spin")} />
                    <span>{text.DOWNLOADING_ZIP}</span>
                  </>
                ) : (
                  <>
                    <FolderDown className={cn("w-3.5 h-3.5")} />
                    <span>{text.DOWNLOAD_ALL_ZIP}</span>
                  </>
                )}
              </Button>
            )}
          </div>

          {isProcessing ? (
            <div className={cn("py-16 flex flex-col items-center justify-center text-center space-y-4")}>
              <div className={cn("w-14 h-14 rounded-2xl border flex items-center justify-center shadow-lg bg-purple-500/15 border-purple-500/30 shadow-purple-500/20")}>
                <Sparkles className={cn("w-7 h-7 text-purple-400 animate-spin")} />
              </div>
              <div className={cn("space-y-1")}>
                <p className={cn("text-sm font-extrabold text-slate-200")}>
                  {progressState.message || text.GENERATING_BTN}
                </p>
                <p className={cn("text-xs text-slate-400 font-mono")}>
                  {progressState.percent}% · {clipCount} {text.CLIP_UNIT}
                </p>
              </div>
            </div>
          ) : !hasClips ? (
            <div className={cn("py-14 flex flex-col items-center justify-center text-center space-y-3.5")}>
              <div className={cn("w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center text-slate-500 shadow-inner")}>
                <Scissors className={cn("w-7 h-7 text-purple-400/80")} />
              </div>
              <div className={cn("space-y-1 max-w-sm")}>
                <h3 className={cn("text-sm font-extrabold text-slate-200")}>
                  {text.RESULTS_EMPTY_TITLE}
                </h3>
                <p className={cn("text-xs text-slate-400 leading-relaxed")}>
                  {text.RESULTS_EMPTY_DESC}
                </p>
              </div>
            </div>
          ) : (
            <div className={cn("grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4")}>
              {_.map(highlightClips, (clip) => (
                <ShortsResultCardItem
                  key={clip.id}
                  clip={clip}
                  downloadText={text.DOWNLOAD_CLIP}
                  downloadingText={text.SAVING_VIDEO || "Đang lưu..."}
                  viralSuffix={text.VIRAL_SCORE_SUFFIX}
                  isPlaying={activePlayingId === clip.id}
                  isDownloading={downloadingClipId === clip.id}
                  onTogglePlay={(shouldPlay) => setActivePlayingId(shouldPlay ? clip.id : null)}
                  onDownload={handleDownloadSingleVideo}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ShortsResultCardItem: FC<{
  clip: HighlightClipItem;
  downloadText: string;
  downloadingText: string;
  viralSuffix: string;
  isPlaying: boolean;
  isDownloading: boolean;
  onTogglePlay: (shouldPlay: boolean) => void;
  onDownload: (clip: HighlightClipItem) => void;
}> = ({ clip, downloadText, downloadingText, viralSuffix, isPlaying, isDownloading, onTogglePlay, onDownload }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(clip.duration || 0);

  useEffect(() => {
    if (!videoRef.current) return;
    if (!isPlaying && !videoRef.current.paused) {
      videoRef.current.pause();
    }
  }, [isPlaying]);

  const handleTogglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      onTogglePlay(false);
    } else {
      videoRef.current.play().catch(() => {});
      onTogglePlay(true);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current && videoRef.current.duration) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const targetTime = ratio * (duration || clip.duration || 1);
    videoRef.current.currentTime = targetTime;
    setCurrentTime(targetTime);
  };

  const progressPercent = duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;

  return (
    <div className={cn("glass-card rounded-2xl p-3 sm:p-4 border border-slate-800/80 bg-slate-955/80 shadow-xl flex flex-col justify-between group hover:border-purple-500/50 hover:shadow-purple-500/10 transition-all")}>
      <div className={cn("relative rounded-xl overflow-hidden bg-slate-950 aspect-[9/16] w-full max-h-[420px] flex items-center justify-center border border-slate-800/60 shadow-inner group/video")}>
        {clip.videoUrl ? (
          <video
            ref={videoRef}
            src={clip.videoUrl}
            poster={clip.thumbnailUrl}
            preload="metadata"
            loop
            playsInline
            controls={false}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={() => {
              setCurrentTime(0);
              onTogglePlay(false);
            }}
            onPause={() => {
              if (isPlaying) onTogglePlay(false);
            }}
            onPlay={() => {
              if (!isPlaying) onTogglePlay(true);
            }}
            className={cn("w-full h-full object-cover")}
          />
        ) : (
          <div className={cn("text-slate-600 text-xs")}>{SHORTS_UI_CONSTANTS.LOADING_TEXT}</div>
        )}

        <Button
          variant="unstyled"
          type="button"
          onClick={handleTogglePlay}
          className={cn("absolute inset-0 m-auto w-12 h-12 rounded-full bg-slate-950/80 backdrop-blur-md border border-purple-500/50 text-white flex items-center justify-center transition-all shadow-xl hover:scale-110 cursor-pointer p-0", {
            "opacity-0 group-hover/video:opacity-100": isPlaying,
            "opacity-90": !isPlaying,
          })}
        >
          {isPlaying ? <Pause className={cn("w-5 h-5 text-purple-400")} /> : <Play className={cn("w-5 h-5 text-purple-400 ml-0.5")} />}
        </Button>

        <div className={cn("absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-slate-950/80 backdrop-blur-md border border-amber-500/40 text-amber-300 text-[10px] font-bold font-mono flex items-center gap-1 shadow-md")}>
          <Flame className={cn("w-3 h-3 text-amber-400 fill-amber-400 animate-pulse")} />
          <span>{clip.viralScore}{viralSuffix}</span>
        </div>

        <div className={cn("absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950/95 via-slate-950/70 to-transparent p-2.5 pt-5 flex flex-col gap-1.5 transition-opacity")}>
          <div
            onClick={handleSeek}
            className={cn("relative w-full h-2 bg-slate-700/60 hover:h-3 rounded-full cursor-pointer overflow-hidden transition-all group/track border border-white/10")}
            title={SHORTS_UI_CONSTANTS.SEEK_TOOLTIP}
          >
            <div
              className={cn("h-full bg-gradient-to-r from-purple-500 via-pink-500 to-amber-400 rounded-full transition-[width] duration-100 ease-linear shadow-xs shadow-purple-500/50")}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className={cn("flex items-center justify-between text-[10px] font-mono text-slate-300 px-0.5")}>
            <span className={cn("font-bold text-purple-300")}>{formatDuration(currentTime)}</span>
            <span className={cn("text-slate-400")}>{formatDuration(duration || clip.duration)}</span>
          </div>
        </div>
      </div>

      <div className={cn("mt-3 space-y-2 text-left flex-1 flex flex-col justify-between")}>
        <div>
          <h4 className={cn("text-xs font-bold text-slate-100 line-clamp-1 group-hover:text-purple-300 transition-colors")} title={clip.title}>
            #{clip.index}. {clip.title}
          </h4>
          <p className={cn("text-[10px] text-slate-400 line-clamp-2 mt-0.5 leading-relaxed")} title={clip.hookReason}>
            {clip.hookReason}
          </p>
        </div>

        <div className={cn("pt-2 border-t border-slate-800/60 flex items-center justify-between gap-2")}>
          <span className={cn("text-[10px] text-purple-400 font-mono font-semibold")}>
            {formatDuration(clip.startTime)} ➔ {formatDuration(clip.endTime)}
          </span>

          <Button
            size="sm"
            onClick={() => onDownload(clip)}
            disabled={isDownloading}
            className={cn(
              "bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 hover:brightness-110 text-white font-bold text-xs px-3 py-1.5 h-auto flex items-center gap-1.5 rounded-xl shadow-md cursor-pointer transition-all active:scale-95 disabled:opacity-75 disabled:cursor-wait",
            )}
          >
            {isDownloading ? (
              <>
                <Sparkles className={cn("w-3.5 h-3.5 animate-spin text-white shrink-0")} />
                <span>{downloadingText}</span>
              </>
            ) : (
              <>
                <Download className={cn("w-3.5 h-3.5 shrink-0")} />
                <span>{downloadText}</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ShortsExtractor;
