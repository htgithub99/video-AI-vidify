import { stringifyJson } from "../lib/jsonStringify.js";
import { VIDEO_EXPORT_TEXT_APPLICATION_JSON, VIDEO_EXPORT_TEXT_DESC, VIDEO_EXPORT_TEXT_OBJECT, VIDEO_EXPORT_TEXT_POST } from "../constants/videoExportText";
import { pickVideoExportEnum as pickStoredEnum, resolveVideoExportConfig } from "../lib/videoExportConfig";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import _ from "lodash";
import { API_ROUTES } from "../constants/apiRoutes.js";
import { VIDEO_EXPORT_CONSTANTS } from "../constants/videoExport.js";
import { VIDEO_EXPORT_TEXTS } from "../constants/texts.js";
import { jsonUtils } from "../lib/json.js";
import { Lang } from "../lib/lang.js";
import { computeVideoExportSlidePlan } from "../lib/videoExportPlan.js";
import { AiPlanningChatModel, AiPlanningExecutionMode, AiPlanningFallbackProvider } from "../types.js";
import { VideoExportAudioItem, VideoExportCancelTarget, VideoExportConfig, VideoExportImageItem, VideoExportJobStage, VideoExportJobState, VideoExportJobStatus, VideoExportMultiPreviews, VideoExportPreviewResult, VideoExportResultItem, VideoExportSource, VideoExportSourceTab, VideoExportTransition } from "../types/videoExport.js";
import { isAbortRequest, loadStoredResults, requestJson, saveStoredResults } from "../components/video-export/videoExportUtils.js";
import { ShortsReframeMode } from "../types/shorts.js";
type StoredSettings = Partial<VideoExportConfig> & {
  aiProvider?: AiPlanningFallbackProvider;
  aiModel?: AiPlanningChatModel;
  aiExecutionMode?: AiPlanningExecutionMode;
  aiChromeHeadless?: boolean;
  activeJobId?: string;
  sourceTab?: VideoExportSourceTab;
  savedFolderPath?: string;
  savedTitle?: string;
  savedSelectedAudioPaths?: string[];
  savedSelectedImagePaths?: string[];
  savedAudioOrder?: string[];
  savedAudioScores?: Record<string, number>;
  savedPreview?: VideoExportPreviewResult | null;
  savedPreviews?: VideoExportMultiPreviews;
  savedPreviewSignature?: string;
};
type RankScore = { index: number; score: number; durationSeconds?: number };
type MoveDirection = -1 | 1;
const TERMINAL_STATUSES = [VideoExportJobStatus.COMPLETED, VideoExportJobStatus.ERROR, VideoExportJobStatus.CANCELLED];
const readStoredSettings = (): StoredSettings => jsonUtils.getItem<StoredSettings>(VIDEO_EXPORT_CONSTANTS.SETTINGS_STORAGE_KEY, {}) ?? {};
const restoreConfig = (saved: StoredSettings): VideoExportConfig => resolveVideoExportConfig(saved, { forceEvenSlides: true });
export function useVideoExporter(lang: Lang) {
  const text = _.get(VIDEO_EXPORT_TEXTS, lang, VIDEO_EXPORT_TEXTS.vi);
  const initialSettings = useMemo(readStoredSettings, []);
  const [source, setSource] = useState<VideoExportSource | null>(null);
  const [audios, setAudios] = useState<VideoExportAudioItem[]>([]);
  const [images, setImages] = useState<VideoExportImageItem[]>([]);
  const [selectedAudioIds, setSelectedAudioIds] = useState<string[]>([]);
  const [selectedImageIds, setSelectedImageIds] = useState<string[]>([]);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [sourceLoaded, setSourceLoaded] = useState<boolean>(!initialSettings.savedFolderPath);
  const [config, setConfig] = useState<VideoExportConfig>(() => restoreConfig(initialSettings));
  const [title, setTitle] = useState<string>(() => _.toString(initialSettings.savedTitle));
  const [sourceTab, setSourceTab] = useState<VideoExportSourceTab>(() => pickStoredEnum(VideoExportSourceTab, initialSettings.sourceTab, VideoExportSourceTab.AUDIO));
  const [aiProvider, setAiProvider] = useState<AiPlanningFallbackProvider>(pickStoredEnum(AiPlanningFallbackProvider, initialSettings.aiProvider, AiPlanningFallbackProvider.GeminiChat));
  const [aiModel, setAiModel] = useState<AiPlanningChatModel>(pickStoredEnum(AiPlanningChatModel, initialSettings.aiModel, AiPlanningChatModel.GeminiFlash));
  const [aiExecutionMode, setAiExecutionMode] = useState<AiPlanningExecutionMode>(pickStoredEnum(AiPlanningExecutionMode, initialSettings.aiExecutionMode, AiPlanningExecutionMode.RoomOnly));
  const [aiChromeHeadless, setAiChromeHeadless] = useState<boolean>(initialSettings.aiChromeHeadless !== false);
  const [isRanking, setIsRanking] = useState<boolean>(false);
  const [previews, setPreviews] = useState<VideoExportMultiPreviews>(() => {
    if (initialSettings.savedPreviews && !_.isEmpty(initialSettings.savedPreviews)) {
      return initialSettings.savedPreviews;
    }
    if (initialSettings.savedPreview && initialSettings.aspectRatio) {
      return { [initialSettings.aspectRatio]: initialSettings.savedPreview };
    }
    return {};
  });
  const [previewSignature, setPreviewSignature] = useState<string>(() => _.toString(initialSettings.savedPreviewSignature));
  const [isPreviewing, setIsPreviewing] = useState<boolean>(false);
  const [job, setJob] = useState<VideoExportJobState | null>(null);
  const [activeJobId, setActiveJobId] = useState<string>(_.toString(initialSettings.activeJobId));
  const [results, setResults] = useState<VideoExportResultItem[]>([]);
  const [resultsLoaded, setResultsLoaded] = useState<boolean>(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const rankAbortRef = useRef<AbortController | null>(null);
  const rankProjectIdRef = useRef<string>("");
  const previewAbortRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef<boolean>(true);
  const selectedAudios = useMemo(() => _.filter(audios, (item) => _.includes(selectedAudioIds, item.id)), [audios, selectedAudioIds]);
  const selectedImages = useMemo(() => _.filter(images, (item) => _.includes(selectedImageIds, item.id)), [images, selectedImageIds]);
  const totalAudioSeconds = useMemo(() => _.sumBy(selectedAudios, (item) => item.durationSeconds || 0), [selectedAudios]);
  const totalAudioBytes = useMemo(() => _.sumBy(selectedAudios, (item) => item.sizeBytes || 0), [selectedAudios]);
  const slidePlan = useMemo(() => computeVideoExportSlidePlan(totalAudioSeconds, selectedImages.length, config), [totalAudioSeconds, selectedImages.length, config]);
  const isExporting = job?.status === VideoExportJobStatus.RENDERING;
  const isBusy = isScanning || isRanking || isExporting;
  const canRender = Boolean(source) && !_.isEmpty(selectedAudios) && !_.isEmpty(selectedImages);
  const preview = useMemo(() => previews[config.aspectRatio] ?? null, [previews, config.aspectRatio]);
  const renderPayload = useMemo(
    () => ({
      token: source?.token ?? "",
      audioIndexes: _.map(selectedAudios, (item) => item.index),
      imageIndexes: _.map(selectedImages, (item) => item.index),
      ...config,
    }),
    [source?.token, selectedAudios, selectedImages, config],
  );
  const currentPreviewSignature = useMemo(
    () =>
      stringifyJson({
        token: source?.token ?? "",
        audioIndexes: _.map(selectedAudios, (item) => item.index),
        imageIndexes: _.map(selectedImages, (item) => item.index),
        reframeMode: config.reframeMode ?? ShortsReframeMode.BLUR_BACKGROUND,
        effect: config.effect,
        transition: config.transition,
        transitionSeconds: config.transition === VideoExportTransition.NONE ? 0 : config.transitionSeconds,
      }),
    [source?.token, selectedAudios, selectedImages, config.reframeMode, config.effect, config.transition, config.transitionSeconds],
  );
  const isPreviewOutdated = useMemo(() => {
    if (!preview) return false;
    if (!previewSignature) return true;
    try {
      const normalize = (raw: any) => {
        if (!raw || typeof raw !== VIDEO_EXPORT_TEXT_OBJECT) return {};
        const audios = Array.isArray(raw.audioIndexes) ? raw.audioIndexes : Array.isArray(raw.audioIds) ? raw.audioIds : [];
        const imgs = Array.isArray(raw.imageIndexes) ? raw.imageIndexes : Array.isArray(raw.imageIds) ? raw.imageIds : [];
        return {
          token: _.toString(raw.token),
          audioIndexes: audios,
          imageIndexes: imgs,
          reframeMode: raw.reframeMode ?? ShortsReframeMode.BLUR_BACKGROUND,
          effect: _.toString(raw.effect),
          transition: _.toString(raw.transition),
          transitionSeconds: raw.transition === VideoExportTransition.NONE ? 0 : Number(raw.transitionSeconds ?? 1),
        };
      };
      const savedObj = normalize(JSON.parse(previewSignature));
      const currentObj = normalize(JSON.parse(currentPreviewSignature));
      return !_.isEqual(savedObj, currentObj);
    } catch {
      return previewSignature !== currentPreviewSignature;
    }
  }, [preview, previewSignature, currentPreviewSignature]);
  useEffect(() => {
    isMountedRef.current = true;
    loadStoredResults().then((items) => {
      if (!isMountedRef.current) return;
      setResults(items);
      setResultsLoaded(true);
    });
    if (initialSettings.savedFolderPath) {
      setIsScanning(true);
      requestJson<{ source?: VideoExportSource }>(API_ROUTES.VIDEO_EXPORT_SELECT_SOURCE, { folderPath: initialSettings.savedFolderPath })
        .then((data) => {
          if (!isMountedRef.current || !data.source) return;
          const nextSource = data.source;
          const nextAudiosRaw = nextSource.audios ?? [];
          const nextImagesRaw = nextSource.images ?? [];
          let nextAudios = [...nextAudiosRaw];
          if (!_.isEmpty(initialSettings.savedAudioOrder)) {
            const audioMap = new Map(_.map(nextAudiosRaw, (item) => [item.relativePath, item]));
            const ordered: VideoExportAudioItem[] = [];
            _.forEach(initialSettings.savedAudioOrder, (relPath) => {
              const item = audioMap.get(relPath);
              if (item) {
                ordered.push(item);
                audioMap.delete(relPath);
              }
            });
            nextAudios = [...ordered, ...Array.from(audioMap.values())];
          }
          if (initialSettings.savedAudioScores && !_.isEmpty(initialSettings.savedAudioScores)) {
            nextAudios = _.map(nextAudios, (item) => {
              const score = initialSettings.savedAudioScores?.[item.relativePath];
              return _.isNumber(score) ? { ...item, aiScore: score } : item;
            });
          }
          setSource(nextSource);
          setAudios(nextAudios);
          setImages(nextImagesRaw);
          if (Array.isArray(initialSettings.savedSelectedAudioPaths)) {
            const selectedPaths = new Set(initialSettings.savedSelectedAudioPaths);
            setSelectedAudioIds(
              _.map(
                _.filter(nextAudios, (item) => selectedPaths.has(item.relativePath)),
                (item) => item.id,
              ),
            );
          } else {
            setSelectedAudioIds(_.map(nextAudios, (item) => item.id));
          }
          if (Array.isArray(initialSettings.savedSelectedImagePaths)) {
            const selectedPaths = new Set(initialSettings.savedSelectedImagePaths);
            setSelectedImageIds(
              _.map(
                _.filter(nextImagesRaw, (item) => selectedPaths.has(item.relativePath)),
                (item) => item.id,
              ),
            );
          } else {
            setSelectedImageIds(_.map(nextImagesRaw, (item) => item.id));
          }
          if (!initialSettings.savedTitle) {
            setTitle(nextSource.folderName || "");
          }
        })
        .catch(() => undefined)
        .finally(() => {
          if (isMountedRef.current) {
            setIsScanning(false);
            setSourceLoaded(true);
          }
        });
    }
    return () => {
      isMountedRef.current = false;
      rankAbortRef.current?.abort();
      previewAbortRef.current?.abort();
    };
  }, [initialSettings.savedFolderPath, initialSettings.savedSelectedAudioPaths, initialSettings.savedSelectedImagePaths, initialSettings.savedAudioOrder, initialSettings.savedAudioScores, initialSettings.savedTitle]);
  const selectedAudioPaths = useMemo(() => _.map(selectedAudios, (item) => item.relativePath), [selectedAudios]);
  const selectedImagePaths = useMemo(() => _.map(selectedImages, (item) => item.relativePath), [selectedImages]);
  const savedAudioOrder = useMemo(() => _.map(audios, (item) => item.relativePath), [audios]);
  const savedAudioScores = useMemo(() => {
    const scores: Record<string, number> = {};
    _.forEach(audios, (item) => {
      if (_.isNumber(item.aiScore)) scores[item.relativePath] = item.aiScore;
    });
    return scores;
  }, [audios]);
  useEffect(() => {
    if (!sourceLoaded) return;
    jsonUtils.setItem<StoredSettings>(VIDEO_EXPORT_CONSTANTS.SETTINGS_STORAGE_KEY, {
      ...config,
      aiProvider,
      aiModel,
      aiExecutionMode,
      aiChromeHeadless,
      activeJobId: activeJobId || undefined,
      sourceTab,
      savedFolderPath: source?.folderPath,
      savedTitle: title,
      savedSelectedAudioPaths: selectedAudioPaths,
      savedSelectedImagePaths: selectedImagePaths,
      savedAudioOrder,
      savedAudioScores,
      savedPreview: preview,
      savedPreviews: previews,
      savedPreviewSignature: previewSignature,
    });
  }, [sourceLoaded, config, aiProvider, aiModel, aiExecutionMode, aiChromeHeadless, activeJobId, sourceTab, source?.folderPath, title, selectedAudioPaths, selectedImagePaths, savedAudioOrder, savedAudioScores, preview, previews, previewSignature]);
  useEffect(() => {
    if (resultsLoaded) void saveStoredResults(results);
  }, [results, resultsLoaded]);
  const updateConfig = useCallback(<K extends keyof VideoExportConfig>(key: K, value: VideoExportConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  }, []);
  const ensureRenderable = useCallback((): boolean => {
    if (!source) {
      toast.error(text.ERR_NO_SOURCE);
      return false;
    }
    if (_.isEmpty(selectedAudios)) {
      toast.error(text.ERR_NO_AUDIO);
      return false;
    }
    if (_.isEmpty(selectedImages)) {
      toast.error(text.ERR_NO_IMAGE);
      return false;
    }
    return true;
  }, [source, selectedAudios, selectedImages, text]);
  const selectFolder = useCallback(async () => {
    if (isBusy) return;
    setIsScanning(true);
    try {
      const data = await requestJson<{ cancelled?: boolean; source?: VideoExportSource }>(API_ROUTES.VIDEO_EXPORT_SELECT_SOURCE, {});
      if (data.cancelled || !data.source) return;
      const nextSource = data.source;
      setSource(nextSource);
      setAudios(nextSource.audios ?? []);
      setImages(nextSource.images ?? []);
      setSelectedAudioIds(_.map(nextSource.audios ?? [], (item) => item.id));
      setSelectedImageIds(_.map(nextSource.images ?? [], (item) => item.id));
      setTitle(nextSource.folderName || "");
      setPreviews({});
      setPreviewSignature("");
      if (_.isEmpty(nextSource.audios)) toast.warning(text.AUDIO_EMPTY);
      if (_.isEmpty(nextSource.images)) toast.warning(text.IMAGE_EMPTY);
    } catch (error: any) {
      toast.error(error?.message || text.ERR_PICK);
    } finally {
      setIsScanning(false);
    }
  }, [isBusy, text]);
  const toggleAudio = useCallback((id: string) => setSelectedAudioIds((prev) => (_.includes(prev, id) ? _.without(prev, id) : [...prev, id])), []);
  const toggleImage = useCallback((id: string) => setSelectedImageIds((prev) => (_.includes(prev, id) ? _.without(prev, id) : [...prev, id])), []);
  const setAllAudiosSelected = useCallback((selected: boolean) => setSelectedAudioIds(selected ? _.map(audios, (item) => item.id) : []), [audios]);
  const setAllImagesSelected = useCallback((selected: boolean) => setSelectedImageIds(selected ? _.map(images, (item) => item.id) : []), [images]);
  const moveAudio = useCallback((id: string, direction: MoveDirection) => {
    setAudios((prev) => {
      const fromIndex = _.findIndex(prev, (item) => item.id === id);
      const toIndex = fromIndex + direction;
      if (fromIndex < 0 || toIndex < 0 || toIndex >= prev.length) return prev;
      const next = [...prev];
      [next[fromIndex], next[toIndex]] = [next[toIndex], next[fromIndex]];
      return next;
    });
  }, []);
  const closeRankRooms = useCallback(
    (projectId: string) => {
      if (!projectId) return;
      void fetch(API_ROUTES.PIPELINE_MUSIC_MIXER_CANCEL, {
        method: VIDEO_EXPORT_TEXT_POST,
        headers: { "Content-Type": VIDEO_EXPORT_TEXT_APPLICATION_JSON },
        body: stringifyJson({ projectId, projectIds: [projectId], provider: aiProvider }),
      }).catch(() => undefined);
    },
    [aiProvider],
  );
  const rankWithAi = useCallback(async () => {
    if (isBusy || !source) return;
    if (_.isEmpty(selectedAudios)) {
      toast.error(text.ERR_NO_AUDIO);
      return;
    }
    if (selectedAudios.length > VIDEO_EXPORT_CONSTANTS.MAX_AI_TRACKS) {
      toast.error(text.AI_RANK_TOO_MANY);
      return;
    }
    const abortController = new AbortController();
    const projectId = `${VIDEO_EXPORT_CONSTANTS.AI_PROJECT_PREFIX}${Date.now()}`;
    const rankedAudios = [...selectedAudios];
    rankAbortRef.current = abortController;
    rankProjectIdRef.current = projectId;
    setIsRanking(true);
    try {
      const data = await requestJson<{ scores?: RankScore[] }>(
        API_ROUTES.PIPELINE_MUSIC_MIXER_RANK,
        {
          projectId,
          tracks: _.map(rankedAudios, (item) => ({ sourcePath: item.sourcePath, title: item.name })),
          provider: aiProvider,
          model: aiModel,
          executionMode: aiExecutionMode,
          chromeHeadless: aiChromeHeadless,
        },
        abortController.signal,
      );
      const scoreById = new Map<string, RankScore>();
      _.forEach(data.scores ?? [], (score) => {
        const item = rankedAudios[_.toInteger(score?.index) - 1];
        if (item) scoreById.set(item.id, score);
      });
      if (scoreById.size === 0) throw new Error(text.AI_RANK_ERROR);
      setAudios((prev) => {
        const scored = _.map(prev, (item) => {
          const score = scoreById.get(item.id);
          return score ? { ...item, aiScore: score.score, durationSeconds: score.durationSeconds || item.durationSeconds } : item;
        });
        const [ranked, others] = _.partition(scored, (item) => scoreById.has(item.id));
        return [..._.orderBy(ranked, [(item) => item.aiScore ?? 0], [VIDEO_EXPORT_TEXT_DESC]), ...others];
      });
      toast.success(text.AI_RANK_DONE);
    } catch (error: any) {
      if (isAbortRequest(error) || abortController.signal.aborted) return;
      toast.error(`${text.AI_RANK_ERROR} ${error?.message || ""}`.trim());
    } finally {
      closeRankRooms(projectId);
      if (rankAbortRef.current === abortController) {
        rankAbortRef.current = null;
        rankProjectIdRef.current = "";
        if (isMountedRef.current) setIsRanking(false);
      }
    }
  }, [isBusy, source, selectedAudios, aiProvider, aiModel, aiExecutionMode, aiChromeHeadless, closeRankRooms, text]);
  const cancelRanking = useCallback(() => {
    const controller = rankAbortRef.current;
    if (!controller) return;
    controller.abort();
    closeRankRooms(rankProjectIdRef.current);
    rankAbortRef.current = null;
    rankProjectIdRef.current = "";
    setIsRanking(false);
    toast.info(text.AI_RANK_CANCELLED);
  }, [closeRankRooms, text]);
  const generatePreview = useCallback(async () => {
    if (isPreviewing || !ensureRenderable()) return;
    const abortController = new AbortController();
    const signature = currentPreviewSignature;
    previewAbortRef.current = abortController;
    setIsPreviewing(true);
    try {
      const data = await requestJson<{
        preview?: VideoExportPreviewResult;
        previews?: VideoExportMultiPreviews;
      }>(API_ROUTES.VIDEO_EXPORT_PREVIEW, renderPayload, abortController.signal);
      const nextPreviews = data.previews || (data.preview ? { [config.aspectRatio]: data.preview } : {});
      if (_.isEmpty(nextPreviews)) throw new Error(text.PREVIEW_ERROR);
      setPreviews(nextPreviews);
      setPreviewSignature(signature);
    } catch (error: any) {
      if (isAbortRequest(error) || abortController.signal.aborted || error?.status === 499) return;
      toast.error(`${text.PREVIEW_ERROR} ${error?.message || ""}`.trim());
    } finally {
      if (previewAbortRef.current === abortController) {
        previewAbortRef.current = null;
        if (isMountedRef.current) setIsPreviewing(false);
      }
    }
  }, [isPreviewing, ensureRenderable, currentPreviewSignature, renderPayload, config.aspectRatio, text]);
  const cancelPreview = useCallback(() => {
    previewAbortRef.current?.abort();
    previewAbortRef.current = null;
    setIsPreviewing(false);
    void requestJson(API_ROUTES.VIDEO_EXPORT_CANCEL, { target: VideoExportCancelTarget.PREVIEW }).catch(() => undefined);
  }, []);
  const handleJobUpdate = useCallback(
    (nextJob: VideoExportJobState) => {
      setJob(nextJob);
      if (!_.includes(TERMINAL_STATUSES, nextJob.status)) return;
      setActiveJobId("");
      if (nextJob.status === VideoExportJobStatus.COMPLETED && nextJob.result) {
        const result = nextJob.result;
        setResults((prev) => [result, ..._.reject(prev, (item) => item.id === result.id)]);
        toast.success(text.EXPORT_SUCCESS);
      } else if (nextJob.status === VideoExportJobStatus.ERROR) {
        toast.error(`${text.EXPORT_ERROR} ${nextJob.error || ""}`.trim());
      }
    },
    [text],
  );
  useEffect(() => {
    if (!activeJobId) return;
    let isPolling = false;
    const poll = async () => {
      if (isPolling) return;
      isPolling = true;
      try {
        const data = await requestJson<{ job?: VideoExportJobState }>(`${API_ROUTES.VIDEO_EXPORT_STATUS}${activeJobId}`);
        if (data.job) handleJobUpdate(data.job);
      } catch (error: any) {
        if (error?.status === 404) {
          setActiveJobId("");
          setJob(null);
        }
      } finally {
        isPolling = false;
      }
    };
    void poll();
    const timer = setInterval(poll, VIDEO_EXPORT_CONSTANTS.POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [activeJobId, handleJobUpdate]);
  const startExport = useCallback(async () => {
    if (isExporting || !ensureRenderable()) return;
    try {
      const data = await requestJson<{ jobId?: string }>(API_ROUTES.VIDEO_EXPORT_RENDER, { ...renderPayload, title: _.trim(title) || source?.folderName || VIDEO_EXPORT_CONSTANTS.DEFAULT_TITLE });
      if (!data.jobId) throw new Error(text.EXPORT_ERROR);
      setJob({ jobId: data.jobId, status: VideoExportJobStatus.RENDERING, stage: VideoExportJobStage.PREPARING, percent: 0, message: "" });
      setActiveJobId(data.jobId);
    } catch (error: any) {
      toast.error(`${text.EXPORT_ERROR} ${error?.message || ""}`.trim());
    }
  }, [isExporting, ensureRenderable, renderPayload, title, source?.folderName, text]);
  const stopExport = useCallback(async () => {
    const jobId = job?.jobId || activeJobId;
    if (!jobId) return;
    setActiveJobId("");
    setJob((prev) => (prev ? { ...prev, status: VideoExportJobStatus.CANCELLED, message: text.EXPORT_CANCELLED } : prev));
    try {
      await requestJson(API_ROUTES.VIDEO_EXPORT_CANCEL, { target: VideoExportCancelTarget.RENDER, jobId });
    } catch {}
    toast.info(text.EXPORT_CANCELLED);
  }, [job?.jobId, activeJobId, text]);
  const downloadResult = useCallback(
    async (result: VideoExportResultItem) => {
      if (!result?.fileName) return;
      setDownloadingId(result.id);
      try {
        const destination = await requestJson<{ cancelled?: boolean; token?: string }>(API_ROUTES.VIDEO_EXPORT_SELECT_SAVE_DESTINATION, { suggestedName: result.fileName });
        if (destination.cancelled || !destination.token) {
          toast.info(text.SAVE_CANCELLED);
          return;
        }
        await requestJson(API_ROUTES.VIDEO_EXPORT_SAVE_VIDEO, { token: destination.token, fileName: result.fileName });
        toast.success(text.SAVE_SUCCESS);
      } catch (error: any) {
        toast.error(`${text.SAVE_ERROR} ${error?.message || ""}`.trim());
      } finally {
        if (isMountedRef.current) setDownloadingId(null);
      }
    },
    [text],
  );
  const removeResult = useCallback((id: string) => {
    setResults((prev) => _.reject(prev, (item) => item.id === id));
  }, []);
  return {
    text,
    source,
    audios,
    images,
    selectedAudioIds,
    selectedImageIds,
    selectedAudios,
    selectedImages,
    totalAudioSeconds,
    totalAudioBytes,
    slidePlan,
    isScanning,
    sourceLoaded,
    savedFolderPath: initialSettings.savedFolderPath,
    config,
    title,
    aiProvider,
    aiModel,
    aiExecutionMode,
    aiChromeHeadless,
    isRanking,
    preview,
    isPreviewing,
    isPreviewOutdated,
    job,
    isExporting,
    isBusy,
    canRender,
    results,
    downloadingId,
    sourceTab,
    setSourceTab,
    setTitle,
    setAiProvider,
    setAiModel,
    setAiExecutionMode,
    setAiChromeHeadless,
    updateConfig,
    selectFolder,
    toggleAudio,
    toggleImage,
    setAllAudiosSelected,
    setAllImagesSelected,
    moveAudio,
    rankWithAi,
    cancelRanking,
    generatePreview,
    cancelPreview,
    startExport,
    stopExport,
    downloadResult,
    removeResult,
  };
}
export type VideoExporterState = ReturnType<typeof useVideoExporter>;
