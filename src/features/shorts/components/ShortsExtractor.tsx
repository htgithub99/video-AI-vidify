import { formatMediaFileSize as formatFileSize } from "../../../lib/mediaFormat.js";
import { openIndexedDatabase } from "../../../lib/indexedDatabase.js";
import { RUNTIME_TEXT as RT_SHARED } from "../../../constants/runtime/shared.js";
import { RUNTIME_TEXT as RT_SHORTS } from "../constants/runtimeText.js";
import { StudioHeader, StudioPage, StudioInput, StudioCanvas, StudioDisclosureButton, StudioFieldset, StudioCard } from "../../../components/ui/Studio.js";
import { stringifyJson } from "../../../lib/jsonStringify.js";
import {
  SOURCE_TEMPLATE_0,
  SOURCE_TEMPLATE_CLIP,
  SOURCE_TEMPLATE_PATH,
  SOURCE_TEMPLATE_SHORT,
  SOURCE_TEMPLATE_SHORTS_EXPORT,
  SOURCE_TEMPLATE_SYMBOL_24,
  SOURCE_TEMPLATE_SYMBOL_7,
  SOURCE_TEMPLATE_SYMBOL_8,
  SOURCE_TEXT_0,
  SOURCE_TEXT_15_30S,
  SOURCE_TEXT_16_9,
  SOURCE_TEXT_1_1,
  SOURCE_TEXT_30_60S,
  SOURCE_TEXT_60_90S,
  SOURCE_TEXT_9_16,
  SOURCE_TEXT_ABORTERROR,
  SOURCE_TEXT_APPLICATION_JSON,
  SOURCE_TEXT_BUTTON,
  SOURCE_TEXT_COMPLETED,
  SOURCE_TEXT_DANG_LUU,
  SOURCE_TEXT_EN,
  SOURCE_TEXT_END,
  SOURCE_TEXT_ERROR,
  SOURCE_TEXT_FILE,
  SOURCE_TEXT_FPS,
  SOURCE_TEXT_ID,
  SOURCE_TEXT_IDLE,
  SOURCE_TEXT_METADATA,
  SOURCE_TEXT_POST,
  SOURCE_TEXT_READONLY,
  SOURCE_TEXT_READWRITE,
  SOURCE_TEXT_SM,
  SOURCE_TEXT_SYMBOL_25,
  SOURCE_TEXT_SYMBOL_26,
  SOURCE_TEXT_SYMBOL_27,
  SOURCE_TEXT_SYMBOL_28,
  SOURCE_TEXT_SYMBOL_8,
  SOURCE_TEXT_SYMBOL_9,
  SOURCE_TEXT_UNSTYLED,
  SOURCE_TEXT_VI,
  SOURCE_TEXT_VIDEO,
  SOURCE_TEXT_X,
} from "../../../constants/sourceText";
import { ChangeEvent, DragEvent, FC, useEffect, useRef, useState } from "react";
import _ from "lodash";
import { Scissors, Sparkles, Download, Flame, FileVideo, Clock, Monitor, HardDrive, Upload, SlidersHorizontal, Smartphone, Tv, Square, Layers, Crop, Crosshair, Play, Pause, FolderDown, Film } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../../../components/ui/Button.js";
import { Tooltip } from "../../../components/ui/Tooltip.js";
import { Lang } from "../../../lib/lang.js";
import { cn } from "../../../lib/utils.js";
import { jsonUtils } from "../../../lib/json.js";
import ChatPlanningSettingsBlock from "../../../components/common/ChatPlanningSettingsBlock.js";
import { AiPlanningChatModel, AiPlanningExecutionMode, AiPlanningFallbackProvider } from "../../../types.js";
import { API_ROUTES } from "../../../constants/apiRoutes.js";
import { SHORTS_EXTRACTOR_TEXTS } from "../../../constants/texts.js";
import { SHORTS_CONSTANTS, SHORTS_REGEX, SHORTS_UI_CONSTANTS } from "../../../constants/shorts.js";
import { HighlightClipItem, ShortsAspectRatio, ShortsDurationOption, ShortsProgressStage, ShortsProgressState, ShortsReframeMode, ShortsSourceMetadata } from "../../../types/shorts.js";
const formatDuration = (seconds?: number): string => {
  if (!seconds || seconds <= 0) return SHORTS_UI_CONSTANTS.DEFAULT_ZERO_DURATION;
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hrs > 0) {
    return SOURCE_TEMPLATE_SYMBOL_7(`${hrs}`, `${_.padStart(_.toString(mins), 2, SOURCE_TEXT_0)}`, `${_.padStart(_.toString(secs), 2, SOURCE_TEXT_0)}`);
  }
  return SOURCE_TEMPLATE_SYMBOL_8(`${_.padStart(_.toString(mins), 2, SOURCE_TEXT_0)}`, `${_.padStart(_.toString(secs), 2, SOURCE_TEXT_0)}`);
};
const openShortsDatabase = (): Promise<IDBDatabase> =>
  openIndexedDatabase(SHORTS_CONSTANTS.DB_NAME, SHORTS_CONSTANTS.DB_VERSION, (database) => {
    if (!database.objectStoreNames.contains(SHORTS_CONSTANTS.DB_STORE_RESULTS)) database.createObjectStore(SHORTS_CONSTANTS.DB_STORE_RESULTS, { keyPath: SOURCE_TEXT_ID });
  });
const ShortsExtractor: FC<{ currentLang?: Lang }> = ({ currentLang = SOURCE_TEXT_VI }) => {
  const isVi = currentLang === SOURCE_TEXT_VI;
  const text = SHORTS_EXTRACTOR_TEXTS[isVi ? SOURCE_TEXT_VI : SOURCE_TEXT_EN];
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
  const [progressState, setProgressState] = useState<ShortsProgressState>({ stage: ShortsProgressStage.IDLE, percent: 0, message: "" });
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
    } catch {
    } finally {
      setSettingsLoaded(true);
    }
    openShortsDatabase()
      .then((db) => {
        const tx = db.transaction(SHORTS_CONSTANTS.DB_STORE_RESULTS, SOURCE_TEXT_READONLY);
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
    jsonUtils.setItem(SHORTS_CONSTANTS.SETTINGS_STORAGE_KEY, { aspectRatio, reframeMode, clipCount, durationMode, aiProvider, aiModel, aiExecutionMode, aiChromeHeadless });
  }, [settingsLoaded, aspectRatio, reframeMode, clipCount, durationMode, aiProvider, aiModel, aiExecutionMode, aiChromeHeadless]);
  useEffect(() => {
    if (_.isEmpty(highlightClips)) return;
    openShortsDatabase()
      .then((db) => {
        const tx = db.transaction(SHORTS_CONSTANTS.DB_STORE_RESULTS, SOURCE_TEXT_READWRITE);
        tx.objectStore(SHORTS_CONSTANTS.DB_STORE_RESULTS).put({ id: SHORTS_CONSTANTS.DB_KEY_RESULTS, clips: highlightClips, metadata: sourceMetadata, sourcePath: sourceVideoPath });
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
      const response = await fetch(API_ROUTES.SHORTS_METADATA, { method: SOURCE_TEXT_POST, headers: { "Content-Type": SOURCE_TEXT_APPLICATION_JSON }, body: stringifyJson({ videoPath: filePath }) });
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
      const response = await fetch(API_ROUTES.PIPELINE_SELECT_FILE, { method: SOURCE_TEXT_POST, headers: { "Content-Type": SOURCE_TEXT_APPLICATION_JSON } });
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
    setProgressState({ stage: ShortsProgressStage.EXTRACTING_AUDIO, percent: 15, message: text.PROGRESS_EXTRACTING_AUDIO });
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
        method: SOURCE_TEXT_POST,
        headers: { "Content-Type": SOURCE_TEXT_APPLICATION_JSON },
        body: stringifyJson({ sourceVideoPath, aspectRatio, reframeMode, clipCount, durationMode, aiExecution: { provider: aiProvider, model: aiModel, mode: aiExecutionMode, chromeHeadless: aiChromeHeadless, projectId: SHORTS_CONSTANTS.PROJECT_ID_PREFIX } }),
        signal: abortControllerRef.current.signal,
      });
      clearInterval(progressTimer);
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || text.ERR_PROCESS);
      }
      setHighlightClips(data.clips || []);
      setProgressState({ stage: ShortsProgressStage.COMPLETED, percent: 100, message: text.PROGRESS_COMPLETED });
      toast.success(text.PROGRESS_COMPLETED);
    } catch (err: any) {
      if (err.name !== SOURCE_TEXT_ABORTERROR) {
        setProgressState({ stage: ShortsProgressStage.ERROR, percent: 0, message: err?.message || text.ERR_PROCESS });
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
    fetch(API_ROUTES.SHORTS_CANCEL, { method: SOURCE_TEXT_POST }).catch(() => {});
    setIsProcessing(false);
    setProgressState({ stage: ShortsProgressStage.IDLE, percent: 0, message: text.PROGRESS_CANCELLED });
    toast.info(text.PROGRESS_CANCELLED);
  };
  const handleDownloadSingleVideo = async (clip: HighlightClipItem) => {
    if (!clip?.outputVideoPath) {
      toast.error(text.ERR_PROCESS);
      return;
    }
    setDownloadingClipId(clip.id);
    const cleanTitle = _.replace(clip.title || SOURCE_TEMPLATE_CLIP(`${clip.index}`), SHORTS_REGEX.CLEAN_TITLE, SOURCE_TEXT_SYMBOL_25);
    const suggestedName = SOURCE_TEMPLATE_SHORT(`${clip.index}`, `${cleanTitle}`, `${SHORTS_CONSTANTS.EXT_MP4}`);
    try {
      const destinationResponse = await fetch(API_ROUTES.SHORTS_SELECT_SAVE_DESTINATION, { method: SOURCE_TEXT_POST, headers: { "Content-Type": SOURCE_TEXT_APPLICATION_JSON }, body: stringifyJson({ suggestedName, extension: SHORTS_CONSTANTS.EXT_MP4 }) });
      const destinationData = await destinationResponse.json();
      if (!destinationResponse.ok || !destinationData.success) {
        throw new Error(destinationData.error || text.SAVE_ERROR);
      }
      if (destinationData.cancelled || !destinationData.token) {
        toast.info(text.SAVE_CANCELLED);
        return;
      }
      const saveResponse = await fetch(API_ROUTES.SHORTS_SAVE_VIDEO, { method: SOURCE_TEXT_POST, headers: { "Content-Type": SOURCE_TEXT_APPLICATION_JSON }, body: stringifyJson({ token: destinationData.token, sourceVideoPath: clip.outputVideoPath }) });
      const saveData = await saveResponse.json();
      if (!saveResponse.ok || !saveData.success) {
        throw new Error(saveData.error || text.SAVE_ERROR);
      }
      toast.success(text.SAVE_SUCCESS);
    } catch (err: any) {
      toast.error(`${text.SAVE_ERROR}${RT_SHARED.SYMBOL_36A9E7}${err?.message || ""}`.trim());
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
      const suggestedName = SOURCE_TEMPLATE_SHORTS_EXPORT(`${Date.now()}`, `${SHORTS_CONSTANTS.EXT_ZIP}`);
      const destinationResponse = await fetch(API_ROUTES.SHORTS_SELECT_SAVE_DESTINATION, { method: SOURCE_TEXT_POST, headers: { "Content-Type": SOURCE_TEXT_APPLICATION_JSON }, body: stringifyJson({ suggestedName, extension: SHORTS_CONSTANTS.EXT_ZIP }) });
      const destinationData = await destinationResponse.json();
      if (!destinationResponse.ok || !destinationData.success) {
        throw new Error(destinationData.error || text.ZIP_ERROR);
      }
      if (destinationData.cancelled || !destinationData.token) {
        toast.info(text.SAVE_CANCELLED);
        return;
      }
      const response = await fetch(API_ROUTES.SHORTS_BUILD_ZIP, { method: SOURCE_TEXT_POST, headers: { "Content-Type": SOURCE_TEXT_APPLICATION_JSON }, body: stringifyJson({ token: destinationData.token, videoPaths }) });
      const data = await response.json();
      if (response.ok && data.success) {
        toast.success(text.ZIP_SUCCESS);
      } else {
        throw new Error(data.error || text.ZIP_ERROR);
      }
    } catch (err: any) {
      toast.error(`${text.ZIP_ERROR}${RT_SHARED.SYMBOL_36A9E7}${err?.message || ""}`.trim());
    } finally {
      setIsExportingZip(false);
    }
  };
  const hasSource = Boolean(sourceVideoPath);
  const hasClips = !_.isEmpty(highlightClips);
  const isProgressRunning = progressState.stage !== SOURCE_TEXT_IDLE && progressState.stage !== SOURCE_TEXT_COMPLETED && progressState.stage !== SOURCE_TEXT_ERROR;
  return (
    <StudioPage aria-busy={isProcessing}>
      <StudioInput ref={fileInputRef} type={SOURCE_TEXT_FILE} accept={SOURCE_TEXT_VIDEO} className={cn(RT_SHARED.HIDDEN)} onChange={handleFileInputChange} />
      <StudioCanvas>
        <StudioHeader
          icon={Scissors}
          title={<>{text.HEADER_TITLE}</>}
          description={<>{text.HEADER_DESC}</>}
          badge={<>{text.HEADER_BADGE}</>}
          actions={
            <>
              <div className={cn(RT_SHARED.FLEX_ITEMS_CENTER_GAP_2_SELF_START_SM_SELF_AUTO)}>
                <Tooltip content={text.AI_CONFIG_TOOLTIP} align={SOURCE_TEXT_END}>
                  <StudioDisclosureButton type={SOURCE_TEXT_BUTTON} onClick={() => setIsAiConfigOpen(!isAiConfigOpen)} disabled={isProcessing} expanded={isAiConfigOpen} label={<>{text.AI_CONFIG_TITLE}</>} />
                </Tooltip>
              </div>
            </>
          }></StudioHeader>
        {isAiConfigOpen && (
          <StudioFieldset disabled={isProcessing} className={cn(RT_SHARED.GLASS_CARD_ROUNDED_2XL_P_4_BG_SLATE_900_80)}>
            <ChatPlanningSettingsBlock provider={aiProvider} model={aiModel} executionMode={aiExecutionMode} chromeHeadless={aiChromeHeadless} onProviderChange={setAiProvider} onModelChange={setAiModel} onExecutionModeChange={setAiExecutionMode} onChromeHeadlessChange={setAiChromeHeadless} currentLang={currentLang} />
          </StudioFieldset>
        )}
        <div className={cn(RT_SHORTS.GRID_GRID_COLS_1_LG_GRID_COLS_3_GAP_6)}>
          <div className={cn(RT_SHORTS.LG_COL_SPAN_2_FLEX_FLEX_COL_GAP_5_MIN)}>
            <StudioCard className={cn(RT_SHORTS.GLASS_CARD_ROUNDED_2XL_SM_ROUNDED_3XL_P_5_SPACE)}>
              <div className={cn(RT_SHARED.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN_RELATIVE_Z_10_FLEX_WRAP)}>
                <div className={cn(RT_SHARED.FLEX_ITEMS_CENTER_GAP_2_5_MIN_W_0)}>
                  <span className={cn(RT_SHARED.W_6_H_6_ROUNDED_XL_BG_PURPLE_500_15)}>{text.STEP_01}</span>
                  <h3 className={cn(RT_SHARED.TEXT_XS_FONT_BOLD_UPPERCASE_TRACKING_WIDER_TEXT_SLATE_100)}>
                    <Film className={cn(RT_SHARED.W_3_5_H_3_5_TEXT_PURPLE_400)} />
                    <span>{text.SOURCE_TITLE}</span>
                    <span className={cn(RT_SHARED.PX_1_5_PY_0_2_ROUNDED_TEXT_9PX_BG)}>{text.SOURCE_BADGE}</span>
                  </h3>
                </div>
                {hasSource && (
                  <Button variant={SOURCE_TEXT_UNSTYLED} type={SOURCE_TEXT_BUTTON} onClick={handleSelectVideoFile} disabled={isProcessing} className={cn(RT_SHORTS.PX_3_PY_1_ROUNDED_XL_TEXT_XS_FONT_MEDIUM)}>
                    {text.CHANGE_FILE_BTN}
                  </Button>
                )}
              </div>
              <div className={cn(RT_SHORTS.RELATIVE_W_FULL_ASPECT_VIDEO_MAX_H_340PX_MIN_H)}>
                {hasSource ? (
                  <>
                    <video
                      ref={sourceVideoRef}
                      key={sourceVideoPath}
                      src={sourceVideoPath.startsWith(SHORTS_UI_CONSTANTS.PROTOCOLS.BLOB) || sourceVideoPath.startsWith(SHORTS_UI_CONSTANTS.PROTOCOLS.HTTP) ? sourceVideoPath : SOURCE_TEMPLATE_PATH(`${API_ROUTES.SHORTS_STREAM_SOURCE}`, `${encodeURIComponent(sourceVideoPath)}`)}
                      controls
                      preload={SOURCE_TEXT_METADATA}
                      playsInline
                      onPlay={() => setActivePlayingId(SHORTS_UI_CONSTANTS.SOURCE_PLAYING_ID)}
                      onPause={() => {
                        if (activePlayingId === SHORTS_UI_CONSTANTS.SOURCE_PLAYING_ID) setActivePlayingId(null);
                      }}
                      className={cn(RT_SHORTS.W_FULL_H_FULL_OBJECT_CONTAIN_ROUNDED_2XL_BG_BLACK)}
                    />
                    <div className={cn(RT_SHORTS.ABSOLUTE_TOP_3_LEFT_3_PX_3_PY_1_ROUNDED)}>
                      <Film className={cn(RT_SHARED.W_3_5_H_3_5_TEXT_PURPLE_400_SHRINK)} />
                      <span className={RT_SHARED.TRUNCATE}>{sourceMetadata?.fileName || sourceVideoPath}</span>
                    </div>
                  </>
                ) : (
                  <div
                    onClick={handleSelectVideoFile}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={cn(RT_SHORTS.W_FULL_H_FULL_BORDER_2_BORDER_DASHED_ROUNDED_2XL, { "border-purple-500 bg-purple-500/10 scale-[1.01]": isDragOver, "border-slate-700/80 bg-slate-950/40 hover:border-purple-500/60 hover:bg-purple-500/5": !isDragOver, "opacity-60 cursor-not-allowed": isProcessing })}>
                    <div className={cn(RT_SHARED.W_12_H_12_ROUNDED_2XL_BG_SLATE_900_BORDER)}>
                      <Upload className={cn(RT_SHARED.W_6_H_6_TEXT_PURPLE_400_GROUP_HOVER_TEXT)} />
                    </div>
                    <div className={cn(RT_SHARED.SPACE_Y_1)}>
                      <p className={cn(RT_SHARED.TEXT_SM_FONT_MEDIUM_TEXT_SLATE_200)}>{text.SOURCE_DROP_TITLE}</p>
                      <p className={cn(RT_SHORTS.TEXT_XS_TEXT_SLATE_400)}>{text.SOURCE_DROP_HINT}</p>
                    </div>
                  </div>
                )}
              </div>
              <div className={cn(RT_SHORTS.MIN_H_58PX_W_FULL_TRANSITION_ALL)}>
                {sourceMetadata ? (
                  <div className={cn(RT_SHORTS.GRID_GRID_COLS_2_SM_GRID_COLS_4_GAP_2)}>
                    <div className={cn(RT_SHORTS.BG_SLATE_950_60_BORDER_BORDER_SLATE_800_ROUNDED_XL)}>
                      <Clock className={cn(RT_SHARED.W_4_H_4_TEXT_PURPLE_400_SHRINK_0)} />
                      <div className={cn(RT_SHARED.MIN_W_0)}>
                        <div className={cn(RT_SHORTS.TEXT_10PX_TEXT_SLATE_400_FONT_MONO_UPPERCASE)}>{text.METADATA_DURATION}</div>
                        <div className={cn(RT_SHARED.TEXT_XS_FONT_BOLD_TEXT_SLATE_200_TRUNCATE)}>{formatDuration(sourceMetadata.duration)}</div>
                      </div>
                    </div>
                    <div className={cn(RT_SHORTS.BG_SLATE_950_60_BORDER_BORDER_SLATE_800_ROUNDED_XL)}>
                      <Monitor className={cn(RT_SHORTS.W_4_H_4_TEXT_BLUE_400_SHRINK_0)} />
                      <div className={cn(RT_SHARED.MIN_W_0)}>
                        <div className={cn(RT_SHORTS.TEXT_10PX_TEXT_SLATE_400_FONT_MONO_UPPERCASE)}>{text.METADATA_RESOLUTION}</div>
                        <div className={cn(RT_SHARED.TEXT_XS_FONT_BOLD_TEXT_SLATE_200_TRUNCATE)}>
                          {sourceMetadata.width}
                          {SOURCE_TEXT_X}
                          {sourceMetadata.height}
                        </div>
                      </div>
                    </div>
                    <div className={cn(RT_SHORTS.BG_SLATE_950_60_BORDER_BORDER_SLATE_800_ROUNDED_XL)}>
                      <HardDrive className={cn(RT_SHARED.W_4_H_4_TEXT_AMBER_400_SHRINK_0)} />
                      <div className={cn(RT_SHARED.MIN_W_0)}>
                        <div className={cn(RT_SHORTS.TEXT_10PX_TEXT_SLATE_400_FONT_MONO_UPPERCASE)}>{text.METADATA_FILESIZE}</div>
                        <div className={cn(RT_SHARED.TEXT_XS_FONT_BOLD_TEXT_SLATE_200_TRUNCATE)}>{formatFileSize(sourceMetadata.fileSizeBytes)}</div>
                      </div>
                    </div>
                    <div className={cn(RT_SHORTS.BG_SLATE_950_60_BORDER_BORDER_SLATE_800_ROUNDED_XL)}>
                      <FileVideo className={cn(RT_SHORTS.W_4_H_4_TEXT_PINK_400_SHRINK_0)} />
                      <div className={cn(RT_SHARED.MIN_W_0)}>
                        <div className={cn(RT_SHORTS.TEXT_10PX_TEXT_SLATE_400_FONT_MONO_UPPERCASE)}>{text.METADATA_FPS}</div>
                        <div className={cn(RT_SHARED.TEXT_XS_FONT_BOLD_TEXT_SLATE_200_TRUNCATE)}>
                          {sourceMetadata.fps}
                          {SOURCE_TEXT_FPS}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : hasSource ? (
                  <div className={cn(RT_SHORTS.GRID_GRID_COLS_2_SM_GRID_COLS_4_GAP_2_91827D)}>
                    {_.map(_.range(4), (idx) => (
                      <div key={idx} className={cn(RT_SHORTS.BG_SLATE_950_40_BORDER_BORDER_SLATE_800_50_ROUNDED)}>
                        <div className={cn(RT_SHORTS.W_4_H_4_ROUNDED_BG_SLATE_800_80_SHRINK)} />
                        <div className={cn(RT_SHORTS.SPACE_Y_1_5_FLEX_1_MIN_W_0)}>
                          <div className={cn(RT_SHORTS.H_2_W_12_BG_SLATE_800_80_ROUNDED)} />
                          <div className={cn(RT_SHORTS.H_2_5_W_16_BG_SLATE_800_60_ROUNDED)} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </StudioCard>
          </div>
          <div className={cn(RT_SHORTS.LG_COL_SPAN_1_FLEX_FLEX_COL_GAP_5_MIN)}>
            <StudioCard className={cn(RT_SHARED.GLASS_CARD_ROUNDED_2XL_SM_ROUNDED_3XL_P_5_SPACE)}>
              <div className={cn(RT_SHARED.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN_BORDER_B_BORDER_SLATE_800)}>
                <div className={cn(RT_SHARED.FLEX_ITEMS_CENTER_GAP_2_5_MIN_W_0)}>
                  <div className={cn(RT_SHORTS.W_8_H_8_ROUNDED_LG_BG_GRADIENT_TO_TR)}>
                    <div className={cn(RT_SHORTS.W_FULL_H_FULL_BG_SLATE_950_ROUNDED_6PX_FLEX)}>
                      <SlidersHorizontal className={cn(RT_SHARED.W_4_H_4_TEXT_PURPLE_400)} />
                    </div>
                  </div>
                  <div>
                    <h2 className={cn(RT_SHARED.TEXT_XS_FONT_BOLD_UPPERCASE_TRACKING_WIDER_TEXT_SLATE_100)}>{text.CONFIG_TITLE}</h2>
                  </div>
                </div>
                <span className={cn(RT_SHORTS.PX_2_PY_0_5_ROUNDED_FULL_BG_PURPLE_500)}>{text.CONFIG_BADGE}</span>
              </div>
              <div className={cn(RT_SHARED.SPACE_Y_2)}>
                <label className={cn(RT_SHORTS.TEXT_10PX_FONT_MONO_FONT_BOLD_TEXT_SLATE_400_UPPERCASE)}>{text.ASPECT_RATIO_LABEL}</label>
                <div className={cn(RT_SHARED.GRID_GRID_COLS_3_GAP_1_5)}>
                  <Button
                    variant={SOURCE_TEXT_UNSTYLED}
                    type={SOURCE_TEXT_BUTTON}
                    disabled={isProcessing}
                    onClick={() => setAspectRatio(ShortsAspectRatio.VERTICAL_9_16)}
                    className={cn(RT_SHORTS.H_8_ROUNDED_XL_BORDER_FONT_MONO_FONT_BOLD_TEXT, {
                      "bg-gradient-to-r from-purple-600 to-pink-600 border-purple-400 text-white shadow-purple-600/30 shadow-md scale-[1.02]": aspectRatio === ShortsAspectRatio.VERTICAL_9_16,
                      "bg-slate-955/90 border-slate-800 text-slate-300 hover:text-white hover:border-purple-500/40 hover:bg-slate-900": aspectRatio !== ShortsAspectRatio.VERTICAL_9_16,
                    })}>
                    <Smartphone className={cn(RT_SHARED.W_3_5_H_3_5_SHRINK_0)} />
                    <span>{SOURCE_TEXT_9_16}</span>
                  </Button>
                  <Button
                    variant={SOURCE_TEXT_UNSTYLED}
                    type={SOURCE_TEXT_BUTTON}
                    disabled={isProcessing}
                    onClick={() => setAspectRatio(ShortsAspectRatio.HORIZONTAL_16_9)}
                    className={cn(RT_SHORTS.H_8_ROUNDED_XL_BORDER_FONT_MONO_FONT_BOLD_TEXT, {
                      "bg-gradient-to-r from-purple-600 to-pink-600 border-purple-400 text-white shadow-purple-600/30 shadow-md scale-[1.02]": aspectRatio === ShortsAspectRatio.HORIZONTAL_16_9,
                      "bg-slate-955/90 border-slate-800 text-slate-300 hover:text-white hover:border-purple-500/40 hover:bg-slate-900": aspectRatio !== ShortsAspectRatio.HORIZONTAL_16_9,
                    })}>
                    <Tv className={cn(RT_SHARED.W_3_5_H_3_5_SHRINK_0)} />
                    <span>{SOURCE_TEXT_16_9}</span>
                  </Button>
                  <Button
                    variant={SOURCE_TEXT_UNSTYLED}
                    type={SOURCE_TEXT_BUTTON}
                    disabled={isProcessing}
                    onClick={() => setAspectRatio(ShortsAspectRatio.SQUARE_1_1)}
                    className={cn(RT_SHORTS.H_8_ROUNDED_XL_BORDER_FONT_MONO_FONT_BOLD_TEXT, {
                      "bg-gradient-to-r from-purple-600 to-pink-600 border-purple-400 text-white shadow-purple-600/30 shadow-md scale-[1.02]": aspectRatio === ShortsAspectRatio.SQUARE_1_1,
                      "bg-slate-955/90 border-slate-800 text-slate-300 hover:text-white hover:border-purple-500/40 hover:bg-slate-900": aspectRatio !== ShortsAspectRatio.SQUARE_1_1,
                    })}>
                    <Square className={cn(RT_SHARED.W_3_5_H_3_5_SHRINK_0)} />
                    <span>{SOURCE_TEXT_1_1}</span>
                  </Button>
                </div>
              </div>
              {aspectRatio === ShortsAspectRatio.VERTICAL_9_16 && (
                <div className={cn(RT_SHORTS.SPACE_Y_1_5_PT_1)}>
                  <label className={cn(RT_SHORTS.TEXT_10PX_FONT_MONO_FONT_BOLD_TEXT_SLATE_400_UPPERCASE_265FBC)}>
                    <span>{text.REFRAME_LABEL}</span>
                  </label>
                  <div className={cn(RT_SHARED.GRID_GRID_COLS_3_GAP_1_5)}>
                    {_.map(
                      [
                        { mode: ShortsReframeMode.BLUR_BACKGROUND, label: text.REFRAME_BLUR_TAG, icon: Layers },
                        { mode: ShortsReframeMode.CENTER_CROP, label: text.REFRAME_CROP_TAG, icon: Crop },
                        { mode: ShortsReframeMode.SMART_TRACKING, label: text.REFRAME_TRACKING_TAG, icon: Crosshair },
                      ],
                      (item) => {
                        const isSelected = reframeMode === item.mode;
                        const Icon = item.icon;
                        return (
                          <Button
                            variant={SOURCE_TEXT_UNSTYLED}
                            key={item.mode}
                            type={SOURCE_TEXT_BUTTON}
                            disabled={isProcessing}
                            onClick={() => setReframeMode(item.mode)}
                            className={cn(RT_SHORTS.H_8_ROUNDED_XL_BORDER_FONT_MONO_FONT_BOLD_TEXT_C0290D, { "bg-gradient-to-r from-indigo-600 to-purple-600 border-indigo-400 text-white shadow-indigo-600/30 shadow-md scale-[1.02]": isSelected, "bg-slate-955/90 border-slate-800 text-slate-300 hover:text-white hover:border-indigo-500/40 hover:bg-slate-900": !isSelected })}>
                            <Icon className={cn(RT_SHORTS.W_3_H_3_SHRINK_0)} />
                            <span className={RT_SHARED.TRUNCATE}>{item.label}</span>
                          </Button>
                        );
                      },
                    )}
                  </div>
                </div>
              )}
              <div className={cn(RT_SHORTS.SPACE_Y_2_PT_1)}>
                <div className={cn(RT_SHARED.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN)}>
                  <label className={cn(RT_SHORTS.TEXT_10PX_FONT_MONO_FONT_BOLD_TEXT_SLATE_400_UPPERCASE)}>{text.CLIP_COUNT_LABEL}</label>
                  <span className={cn(RT_SHORTS.TEXT_XS_FONT_MONO_FONT_BOLD_TEXT_PURPLE_300)}>
                    {clipCount} {text.CLIP_UNIT}
                  </span>
                </div>
                <div className={cn(RT_SHORTS.GRID_GRID_COLS_4_GAP_1_5)}>
                  {_.map(SHORTS_CONSTANTS.PRESET_CLIP_COUNTS, (num) => (
                    <Button
                      variant={SOURCE_TEXT_UNSTYLED}
                      key={num}
                      type={SOURCE_TEXT_BUTTON}
                      disabled={isProcessing}
                      onClick={() => setClipCount(num)}
                      className={cn(RT_SHORTS.H_8_ROUNDED_XL_BORDER_FONT_MONO_FONT_BOLD_TEXT_46701E, { "bg-gradient-to-r from-purple-600 to-pink-600 border-purple-400 text-white shadow-purple-600/30 shadow-md scale-[1.02]": clipCount === num, "bg-slate-955/90 border-slate-800 text-slate-300 hover:text-white hover:border-purple-500/40 hover:bg-slate-900": clipCount !== num })}>
                      {num}
                    </Button>
                  ))}
                </div>
              </div>
              <div className={cn(RT_SHORTS.SPACE_Y_2_PT_1)}>
                <div className={cn(RT_SHARED.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN)}>
                  <label className={cn(RT_SHORTS.TEXT_10PX_FONT_MONO_FONT_BOLD_TEXT_SLATE_400_UPPERCASE)}>{text.DURATION_LABEL}</label>
                  <span className={cn(RT_SHORTS.TEXT_XS_FONT_MONO_FONT_BOLD_TEXT_AMBER_300)}>
                    {durationMode === ShortsDurationOption.AUTO ? SOURCE_TEMPLATE_SYMBOL_24(`${text.DURATION_AUTO_SHORT}`, `${text.DURATION_AUTO_BADGE}`) : durationMode === ShortsDurationOption.RANGE_15_30 ? text.DURATION_15_30 : durationMode === ShortsDurationOption.RANGE_30_60 ? text.DURATION_30_60 : text.DURATION_60_90}
                  </span>
                </div>
                <div className={cn(RT_SHORTS.GRID_GRID_COLS_4_GAP_1_5)}>
                  {_.map(
                    [
                      { value: ShortsDurationOption.AUTO, label: text.DURATION_AUTO_SHORT },
                      { value: ShortsDurationOption.RANGE_15_30, label: SOURCE_TEXT_15_30S },
                      { value: ShortsDurationOption.RANGE_30_60, label: SOURCE_TEXT_30_60S },
                      { value: ShortsDurationOption.RANGE_60_90, label: SOURCE_TEXT_60_90S },
                    ],
                    (opt) => (
                      <Button
                        variant={SOURCE_TEXT_UNSTYLED}
                        key={opt.value}
                        type={SOURCE_TEXT_BUTTON}
                        disabled={isProcessing}
                        onClick={() => setDurationMode(opt.value)}
                        className={cn(RT_SHORTS.H_8_ROUNDED_XL_BORDER_FONT_MONO_FONT_BOLD_TEXT_F550DB, { "bg-gradient-to-r from-amber-600 to-rose-600 border-amber-400 text-white shadow-amber-600/30 shadow-md scale-[1.02]": durationMode === opt.value, "bg-slate-955/90 border-slate-800 text-slate-300 hover:text-white hover:border-amber-500/40 hover:bg-slate-900": durationMode !== opt.value })}>
                        {opt.label}
                      </Button>
                    ),
                  )}
                </div>
              </div>
              {progressState.stage !== ShortsProgressStage.IDLE && (
                <div className={cn(RT_SHORTS.P_3_ROUNDED_XL_BG_SLATE_955_80_BORDER_BORDER)}>
                  <div className={cn(RT_SHARED.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN)}>
                    <span className={cn(RT_SHORTS.TEXT_SLATE_300_FONT_BOLD_TRUNCATE_MAX_W_80)}>{progressState.message}</span>
                    <span className={cn(RT_SHARED.FONT_BOLD_TEXT_PURPLE_300)}>
                      {progressState.percent}
                      {SOURCE_TEXT_SYMBOL_8}
                    </span>
                  </div>
                  <div className={cn(RT_SHORTS.W_FULL_BG_SLATE_950_ROUNDED_FULL_H_1_5)}>
                    <div
                      className={cn(RT_SHARED.H_FULL_ROUNDED_FULL_TRANSITION_ALL_DURATION_300, { "bg-rose-500": progressState.stage === ShortsProgressStage.ERROR, "bg-emerald-400": progressState.stage === ShortsProgressStage.COMPLETED, "bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 animate-pulse": isProgressRunning })}
                      style={{ width: `${progressState.percent}${RT_SHARED.SYMBOL}` }}
                    />
                  </div>
                </div>
              )}
              <div className={cn(RT_SHORTS.SPACE_Y_2_PT_1)}>
                <div className={cn(RT_SHARED.FLEX_ITEMS_CENTER_GAP_2)}>
                  <Button
                    variant={SOURCE_TEXT_UNSTYLED}
                    type={SOURCE_TEXT_BUTTON}
                    onClick={handleStartGeneration}
                    disabled={isProcessing || !hasSource}
                    className={cn(RT_SHORTS.FLEX_1_H_11_MIN_H_44PX_PX_4_ROUNDED, {
                      "bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 border-purple-400/50 text-white cursor-wait animate-pulse": isProcessing,
                      "bg-gradient-to-r from-rose-600 via-purple-600 to-indigo-600 hover:from-rose-500 hover:via-purple-500 hover:to-indigo-500 border-rose-400/40 shadow-rose-600/25 active:scale-[0.98] text-white cursor-pointer": !isProcessing && hasSource,
                      "bg-slate-800/80 border-slate-700 text-slate-500 cursor-not-allowed shadow-none": !isProcessing && !hasSource,
                    })}>
                    {isProcessing ? (
                      <>
                        <Sparkles className={cn(RT_SHORTS.W_4_H_4_ANIMATE_SPIN_TEXT_WHITE_SHRINK_0)} />
                        <span className={cn(RT_SHORTS.TRUNCATE_INLINE_FLEX_ITEMS_CENTER_LEADING_NONE)}>{text.GENERATING_BTN}</span>
                      </>
                    ) : (
                      <>
                        <Scissors className={cn(RT_SHARED.W_4_H_4_SHRINK_0)} />
                        <span className={cn(RT_SHORTS.INLINE_FLEX_ITEMS_CENTER_LEADING_NONE)}>{text.GENERATE_BTN}</span>
                      </>
                    )}
                  </Button>
                  {isProcessing && (
                    <Button variant={SOURCE_TEXT_UNSTYLED} type={SOURCE_TEXT_BUTTON} onClick={handleCancelGeneration} className={cn(RT_SHARED.H_11_MIN_H_44PX_PX_4_ROUNDED_XL_BORDER)}>
                      <Square className={cn(RT_SHARED.W_3_5_H_3_5_FILL_ROSE_300_30)} />
                      <span>{text.STOP_BTN}</span>
                    </Button>
                  )}
                </div>
              </div>
            </StudioCard>
          </div>
        </div>
        <StudioCard className={cn(RT_SHARED.GLASS_CARD_ROUNDED_2XL_SM_ROUNDED_3XL_P_5_SPACE)}>
          <div className={cn(RT_SHORTS.FLEX_FLEX_COL_SM_FLEX_ROW_SM_ITEMS_CENTER_JUSTIFY)}>
            <div className={cn(RT_SHARED.FLEX_ITEMS_CENTER_GAP_2_5_MIN_W_0)}>
              <span className={cn(RT_SHARED.W_6_H_6_ROUNDED_XL_BG_PURPLE_500_15)}>{text.STEP_03}</span>
              <div>
                <h3 className={cn(RT_SHARED.TEXT_SM_FONT_BOLD_UPPERCASE_TRACKING_WIDER_TEXT_SLATE_100)}>
                  <Flame className={cn(RT_SHARED.W_4_H_4_TEXT_AMBER_400, { "animate-bounce": isProcessing })} />
                  <span>{text.RESULTS_TITLE}</span>
                  <span className={cn(RT_SHARED.PX_2_PY_0_5_ROUNDED_FULL_TEXT_9PX_BG)}>{isProcessing ? `${clipCount}${RT_SHARED.SYMBOL_36A9E7}${text.CLIP_UNIT}` : hasClips ? `${highlightClips.length}${RT_SHARED.SYMBOL_36A9E7}${text.CLIP_UNIT}` : SOURCE_TEMPLATE_0(`${text.CLIP_UNIT}`)}</span>
                </h3>
              </div>
            </div>
            {!isProcessing && hasClips && (
              <Button variant={SOURCE_TEXT_UNSTYLED} type={SOURCE_TEXT_BUTTON} onClick={handleDownloadZip} disabled={isExportingZip} className={cn(RT_SHORTS.H_9_PX_4_ROUNDED_XL_FONT_BOLD_TEXT_XS)}>
                {isExportingZip ? (
                  <>
                    <Sparkles className={cn(RT_SHARED.W_3_5_H_3_5_ANIMATE_SPIN)} />
                    <span>{text.DOWNLOADING_ZIP}</span>
                  </>
                ) : (
                  <>
                    <FolderDown className={cn(RT_SHARED.W_3_5_H_3_5)} />
                    <span>{text.DOWNLOAD_ALL_ZIP}</span>
                  </>
                )}
              </Button>
            )}
          </div>
          {isProcessing ? (
            <div className={cn(RT_SHORTS.PY_16_FLEX_FLEX_COL_ITEMS_CENTER_JUSTIFY_CENTER_TEXT)}>
              <div className={cn(RT_SHORTS.W_14_H_14_ROUNDED_2XL_BORDER_FLEX_ITEMS_CENTER)}>
                <Sparkles className={cn(RT_SHARED.W_7_H_7_TEXT_PURPLE_400_ANIMATE_SPIN)} />
              </div>
              <div className={cn(RT_SHARED.SPACE_Y_1)}>
                <p className={cn(RT_SHARED.TEXT_SM_FONT_EXTRABOLD_TEXT_SLATE_200)}>{progressState.message || text.GENERATING_BTN}</p>
                <p className={cn(RT_SHORTS.TEXT_XS_TEXT_SLATE_400_FONT_MONO)}>
                  {progressState.percent}
                  {SOURCE_TEXT_SYMBOL_26}
                  {clipCount} {text.CLIP_UNIT}
                </p>
              </div>
            </div>
          ) : !hasClips ? (
            <div className={cn(RT_SHARED.PY_14_FLEX_FLEX_COL_ITEMS_CENTER_JUSTIFY_CENTER_TEXT)}>
              <div className={cn(RT_SHORTS.W_14_H_14_ROUNDED_2XL_BG_SLATE_800_80)}>
                <Scissors className={cn(RT_SHARED.W_7_H_7_TEXT_PURPLE_400_80)} />
              </div>
              <div className={cn(RT_SHARED.SPACE_Y_1_MAX_W_SM)}>
                <h3 className={cn(RT_SHARED.TEXT_SM_FONT_EXTRABOLD_TEXT_SLATE_200)}>{text.RESULTS_EMPTY_TITLE}</h3>
                <p className={cn(RT_SHARED.TEXT_XS_TEXT_SLATE_400_LEADING_RELAXED)}>{text.RESULTS_EMPTY_DESC}</p>
              </div>
            </div>
          ) : (
            <div className={cn(RT_SHORTS.GRID_GRID_COLS_1_SM_GRID_COLS_2_MD_GRID)}>
              {_.map(highlightClips, (clip) => (
                <ShortsResultCardItem
                  key={clip.id}
                  clip={clip}
                  downloadText={text.DOWNLOAD_CLIP}
                  downloadingText={text.SAVING_VIDEO || SOURCE_TEXT_DANG_LUU}
                  viralSuffix={text.VIRAL_SCORE_SUFFIX}
                  isPlaying={activePlayingId === clip.id}
                  isDownloading={downloadingClipId === clip.id}
                  onTogglePlay={(shouldPlay) => setActivePlayingId(shouldPlay ? clip.id : null)}
                  onDownload={handleDownloadSingleVideo}
                />
              ))}
            </div>
          )}
        </StudioCard>
      </StudioCanvas>
    </StudioPage>
  );
};
const ShortsResultCardItem: FC<{ clip: HighlightClipItem; downloadText: string; downloadingText: string; viralSuffix: string; isPlaying: boolean; isDownloading: boolean; onTogglePlay: (shouldPlay: boolean) => void; onDownload: (clip: HighlightClipItem) => void }> = ({ clip, downloadText, downloadingText, viralSuffix, isPlaying, isDownloading, onTogglePlay, onDownload }) => {
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
    <StudioCard className={cn(RT_SHORTS.GLASS_CARD_ROUNDED_2XL_P_3_SM_P_4_BORDER)}>
      <div className={cn(RT_SHORTS.RELATIVE_ROUNDED_XL_OVERFLOW_HIDDEN_BG_SLATE_950_ASPECT_9)}>
        {clip.videoUrl ? (
          <video
            ref={videoRef}
            src={clip.videoUrl}
            poster={clip.thumbnailUrl}
            preload={SOURCE_TEXT_METADATA}
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
            className={cn(RT_SHARED.W_FULL_H_FULL_OBJECT_COVER)}
          />
        ) : (
          <div className={cn(RT_SHORTS.TEXT_SLATE_600_TEXT_XS)}>{SHORTS_UI_CONSTANTS.LOADING_TEXT}</div>
        )}
        <Button variant={SOURCE_TEXT_UNSTYLED} type={SOURCE_TEXT_BUTTON} onClick={handleTogglePlay} className={cn(RT_SHORTS.ABSOLUTE_INSET_0_M_AUTO_W_12_H_12_ROUNDED, { "opacity-0 group-hover/video:opacity-100": isPlaying, "opacity-90": !isPlaying })}>
          {isPlaying ? <Pause className={cn(RT_SHARED.W_5_H_5_TEXT_PURPLE_400)} /> : <Play className={cn(RT_SHARED.W_5_H_5_TEXT_PURPLE_400_ML_0_5)} />}
        </Button>
        <div className={cn(RT_SHORTS.ABSOLUTE_TOP_2_5_LEFT_2_5_PX_2_PY)}>
          <Flame className={cn(RT_SHORTS.W_3_H_3_TEXT_AMBER_400_FILL_AMBER_400)} />
          <span>
            {clip.viralScore}
            {viralSuffix}
          </span>
        </div>
        <div className={cn(RT_SHORTS.ABSOLUTE_BOTTOM_0_INSET_X_0_BG_GRADIENT_TO_T)}>
          <div onClick={handleSeek} className={cn(RT_SHORTS.RELATIVE_W_FULL_H_2_BG_SLATE_700_60_HOVER)} title={SHORTS_UI_CONSTANTS.SEEK_TOOLTIP}>
            <div className={cn(RT_SHARED.H_FULL_BG_GRADIENT_TO_R_FROM_PURPLE_500_VIA)} style={{ width: `${progressPercent}${RT_SHARED.SYMBOL}` }} />
          </div>
          <div className={cn(RT_SHARED.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN_TEXT_10PX_FONT_MONO_TEXT)}>
            <span className={cn(RT_SHARED.FONT_BOLD_TEXT_PURPLE_300)}>{formatDuration(currentTime)}</span>
            <span className={cn(RT_SHARED.TEXT_SLATE_400)}>{formatDuration(duration || clip.duration)}</span>
          </div>
        </div>
      </div>
      <div className={cn(RT_SHARED.MT_3_SPACE_Y_2_TEXT_LEFT_FLEX_1_FLEX)}>
        <div>
          <h4 className={cn(RT_SHARED.TEXT_XS_FONT_BOLD_TEXT_SLATE_100_LINE_CLAMP_1)} title={clip.title}>
            {SOURCE_TEXT_SYMBOL_9}
            {clip.index}
            {SOURCE_TEXT_SYMBOL_27}
            {clip.title}
          </h4>
          <p className={cn(RT_SHORTS.TEXT_10PX_TEXT_SLATE_400_LINE_CLAMP_2_MT_0)} title={clip.hookReason}>
            {clip.hookReason}
          </p>
        </div>
        <div className={cn(RT_SHARED.PT_2_BORDER_T_BORDER_SLATE_800_60_FLEX_ITEMS)}>
          <span className={cn(RT_SHORTS.TEXT_10PX_TEXT_PURPLE_400_FONT_MONO_FONT_SEMIBOLD)}>
            {formatDuration(clip.startTime)}
            {SOURCE_TEXT_SYMBOL_28}
            {formatDuration(clip.endTime)}
          </span>
          <Button size={SOURCE_TEXT_SM} onClick={() => onDownload(clip)} disabled={isDownloading} className={cn(RT_SHARED.BG_GRADIENT_TO_R_FROM_AMBER_500_VIA_ROSE_500)}>
            {isDownloading ? (
              <>
                <Sparkles className={cn(RT_SHORTS.W_3_5_H_3_5_ANIMATE_SPIN_TEXT_WHITE)} />
                <span>{downloadingText}</span>
              </>
            ) : (
              <>
                <Download className={cn(RT_SHARED.W_3_5_H_3_5_SHRINK_0)} />
                <span>{downloadText}</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </StudioCard>
  );
};
export default ShortsExtractor;
