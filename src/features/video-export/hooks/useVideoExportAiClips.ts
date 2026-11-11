import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import _ from "lodash";
import { API_ROUTES } from "../../../constants/apiRoutes.js";
import { jsonUtils } from "../../../lib/json.js";
import { AiPlanningChatModel, AiPlanningExecutionMode, AiPlanningFallbackProvider } from "../../../types.js";
import { VIDEO_EXPORT_AI_CLIP_CONSTANTS, VIDEO_EXPORT_AI_CLIP_REGEX } from "../constants/videoExportAiClip.js";
import { requestJson, VideoExportTexts } from "../components/videoExportUtils.js";
import { VideoExportAiClip, VideoExportAiClipJobState, VideoExportAiClipJobStatus, VideoExportAspectRatio, VideoExportImageItem } from "../types/videoExport.js";
type AiClipImage = { id: string; name: string; dataUrl: string };
export type GenerateAiClipsOptions = { imageIds?: string[]; restart?: boolean };
export type VideoExportAiClipRuntimeSettings = {
  provider: AiPlanningFallbackProvider;
  model: AiPlanningChatModel;
  executionMode: AiPlanningExecutionMode;
  chromeHeadless: boolean;
};
type StoredAiClipSettings = { enabled?: boolean; folderPath?: string; note?: string; images?: AiClipImage[]; clips?: VideoExportAiClip[]; jobId?: string; lastJob?: VideoExportAiClipJobState | null };
const buildSourceImageId = (relativePath: string): string => `${VIDEO_EXPORT_AI_CLIP_CONSTANTS.SOURCE_ID_PREFIX}${relativePath}`;
const isSourceSyncedImageId = (id: string): boolean => _.startsWith(id, VIDEO_EXPORT_AI_CLIP_CONSTANTS.SOURCE_ID_PREFIX);
const clipMatchesImage = (clip: VideoExportAiClip, image: AiClipImage): boolean => (clip.sourceImageId ? clip.sourceImageId === image.id || clip.name === image.name : clip.name === image.name);
const normalizeStoredJob = (raw: VideoExportAiClipJobState | null | undefined, hasActiveJobId: boolean): VideoExportAiClipJobState | null => {
  if (!raw || typeof raw !== "object") return null;
  if (raw.status === VideoExportAiClipJobStatus.RUNNING && !hasActiveJobId) {
    return { ...raw, status: VideoExportAiClipJobStatus.CANCELLED, stopping: false };
  }
  return raw;
};
const mergeFreshClips = (previous: VideoExportAiClip[], fresh: VideoExportAiClip[]): VideoExportAiClip[] => {
  const next = [...previous];
  _.forEach(fresh, (clip) => {
    const existingIndex = _.findIndex(next, (item) => item.id === clip.id || (Boolean(clip.sourceImageId) && (item.sourceImageId === clip.sourceImageId || (!item.sourceImageId && item.name === clip.name))));
    if (existingIndex >= 0) {
      next[existingIndex] = { ...clip, keepAudio: next[existingIndex].keepAudio ?? clip.keepAudio };
    } else {
      next.push(clip);
    }
  });
  return next;
};
const sanitizeStoredImages = (raw: unknown): AiClipImage[] =>
  _.chain(_.isArray(raw) ? raw : [])
    .filter((item): item is AiClipImage => Boolean(item && _.isString(item.id) && _.isString(item.name) && VIDEO_EXPORT_AI_CLIP_REGEX.IMAGE_DATA_URL.test(_.toString(item.dataUrl))))
    .take(VIDEO_EXPORT_AI_CLIP_CONSTANTS.MAX_IMAGES)
    .value();
const readStoredAiClipSettings = (): StoredAiClipSettings => jsonUtils.getItem<StoredAiClipSettings>(VIDEO_EXPORT_AI_CLIP_CONSTANTS.STORAGE_KEY, {}) ?? {};
const readBlobAsDataUrl = (blob: Blob): Promise<string> =>
  new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(_.toString(reader.result));
    reader.onerror = () => resolve("");
    reader.readAsDataURL(blob);
  });
const fetchImageAsDataUrl = async (url: string): Promise<string> => {
  try {
    const response = await fetch(url);
    if (!response.ok) return "";
    const blob = await response.blob();
    if (!blob || blob.size === 0 || blob.size > VIDEO_EXPORT_AI_CLIP_CONSTANTS.MAX_IMAGE_BYTES) return "";
    const dataUrl = await readBlobAsDataUrl(blob);
    return VIDEO_EXPORT_AI_CLIP_REGEX.IMAGE_DATA_URL.test(dataUrl) ? dataUrl : "";
  } catch {
    return "";
  }
};
export function useVideoExportAiClips(text: VideoExportTexts, aspectRatio: VideoExportAspectRatio, aiSettings: VideoExportAiClipRuntimeSettings, sourceImages: VideoExportImageItem[] = [], folderPath?: string) {
  const { provider, model, executionMode, chromeHeadless } = aiSettings;
  const initial = useMemo(readStoredAiClipSettings, []);
  const [enabled, setEnabled] = useState<boolean>(true);
  const [note, setNote] = useState<string>(_.toString(initial.note));
  const [images, setImages] = useState<AiClipImage[]>(() => sanitizeStoredImages(initial.images));
  const [clips, setClips] = useState<VideoExportAiClip[]>(_.isArray(initial.clips) ? initial.clips : []);
  const [jobId, setJobId] = useState<string>(_.toString(initial.jobId));
  const [job, setJob] = useState<VideoExportAiClipJobState | null>(() => normalizeStoredJob(initial.lastJob, Boolean(initial.jobId)));
  const [hydrated, setHydrated] = useState<boolean>(false);
  const isMountedRef = useRef<boolean>(true);
  const seenClipIdsRef = useRef<Set<string>>(new Set(_.map(initial.clips, (clip) => clip.id)));
  const folderPathRef = useRef<string>(_.toString(initial.folderPath));
  const dismissedSourceKeysRef = useRef<Set<string>>(new Set());
  const prevSourceIdsSignatureRef = useRef<string>("");
  const isGenerating = job?.status === VideoExportAiClipJobStatus.RUNNING;
  const activeClipIds = useMemo(() => _.map(clips, (clip) => clip.id), [clips]);
  const activeClipAudioIds = useMemo(() => _.map(_.filter(clips, (clip) => Boolean(clip.keepAudio)), (clip) => clip.id), [clips]);
  const completedImageIds = useMemo(() => new Set(_.map(_.filter(images, (image) => _.some(clips, (clip) => clipMatchesImage(clip, image))), (image) => image.id)), [images, clips]);
  const missingImages = useMemo(() => _.filter(images, (image) => !completedImageIds.has(image.id)), [images, completedImageIds]);
  const failedErrorByImageId = useMemo(() => {
    const map = new Map<string, string>();
    _.forEach(job?.itemErrors ?? [], (itemError) => {
      const matched = _.find(images, (img) => (itemError.imageId ? img.id === itemError.imageId : img.name === itemError.name));
      if (matched && !completedImageIds.has(matched.id)) {
        map.set(matched.id, itemError.reason);
      }
    });
    if (map.size === 0 && job?.status === VideoExportAiClipJobStatus.ERROR) {
      const fallbackReason = _.head(job.errors) || job.message || text.AI_CLIP_ERR_FAILED;
      _.forEach(missingImages, (img) => map.set(img.id, fallbackReason));
    }
    return map;
  }, [job, images, completedImageIds, missingImages, text.AI_CLIP_ERR_FAILED]);
  const hasRecoverableError = useMemo(
    () => Boolean(job && !isGenerating && (job.status === VideoExportAiClipJobStatus.ERROR || !_.isEmpty(job.errors) || (job.status === VideoExportAiClipJobStatus.CANCELLED && !_.isEmpty(missingImages)))),
    [job, isGenerating, missingImages],
  );
  useEffect(() => {
    isMountedRef.current = true;
    void jsonUtils
      .getAsyncItem<StoredAiClipSettings>(VIDEO_EXPORT_AI_CLIP_CONSTANTS.STORAGE_KEY, {})
      .then((stored) => {
        if (!isMountedRef.current) return;
        if (stored && typeof stored === "object") {
          if (!folderPathRef.current && _.isString(stored.folderPath) && stored.folderPath) {
            folderPathRef.current = stored.folderPath;
          }
          if (!initial.note && _.isString(stored.note) && stored.note) setNote(stored.note);
          const storedImages = sanitizeStoredImages(stored.images);
          if (!_.isEmpty(storedImages)) setImages((previous) => (_.isEmpty(previous) ? storedImages : previous));
          if (_.isEmpty(initial.clips) && _.isArray(stored.clips) && !_.isEmpty(stored.clips)) {
            _.forEach(stored.clips, (clip) => seenClipIdsRef.current.add(clip.id));
            setClips(stored.clips);
          }
          const resolvedJobId = initial.jobId || (_.isString(stored.jobId) ? stored.jobId : "");
          if (!initial.jobId && resolvedJobId) setJobId(resolvedJobId);
          if (!initial.lastJob && stored.lastJob) {
            setJob((previous) => previous ?? normalizeStoredJob(stored.lastJob, Boolean(resolvedJobId)));
          }
        }
      })
      .finally(() => {
        if (isMountedRef.current) setHydrated(true);
      });
    return () => {
      isMountedRef.current = false;
    };
  }, [initial]);
  useEffect(() => {
    if (!hydrated) return;
    const activeFolderPath = folderPath || folderPathRef.current || undefined;
    jsonUtils.setItem<StoredAiClipSettings>(VIDEO_EXPORT_AI_CLIP_CONSTANTS.STORAGE_KEY, { enabled, folderPath: activeFolderPath, note, clips, jobId, lastJob: job });
    const totalImageChars = _.sumBy(images, (item) => item.dataUrl.length);
    if (!_.isEmpty(images) && totalImageChars <= VIDEO_EXPORT_AI_CLIP_CONSTANTS.MAX_LOCAL_STORAGE_CHARS) {
      jsonUtils.setItem<StoredAiClipSettings>(VIDEO_EXPORT_AI_CLIP_CONSTANTS.STORAGE_KEY, { enabled, folderPath: activeFolderPath, note, images, clips, jobId, lastJob: job });
    }
    void jsonUtils.setAsyncItem<StoredAiClipSettings>(VIDEO_EXPORT_AI_CLIP_CONSTANTS.STORAGE_KEY, { enabled, folderPath: activeFolderPath, note, images, clips, jobId, lastJob: job });
  }, [hydrated, enabled, folderPath, note, images, clips, jobId, job]);
  useEffect(() => {
    if (!hydrated) return;
    const cleanFolder = _.trim(folderPath);
    const folderChanged = Boolean(cleanFolder && folderPathRef.current && folderPathRef.current !== cleanFolder);
    if (cleanFolder) folderPathRef.current = cleanFolder;
    if (folderChanged) {
      dismissedSourceKeysRef.current.clear();
      seenClipIdsRef.current.clear();
      setClips([]);
      setJob(null);
      setImages([]);
    }
    const currentSignature = _.join(_.map(sourceImages, (item) => item.relativePath), "|");
    if (prevSourceIdsSignatureRef.current && prevSourceIdsSignatureRef.current !== currentSignature) {
      dismissedSourceKeysRef.current.clear();
    }
    prevSourceIdsSignatureRef.current = currentSignature;
    const selectedSourceIds = new Set(_.map(sourceImages, (item) => buildSourceImageId(item.relativePath)));
    setImages((previous) => {
      const filtered = _.filter(previous, (img) => !isSourceSyncedImageId(img.id) || selectedSourceIds.has(img.id));
      return filtered.length === previous.length ? previous : filtered;
    });
    if (_.isEmpty(sourceImages)) return;
    let cancelled = false;
    void (async () => {
      const candidates = _.take(sourceImages, VIDEO_EXPORT_AI_CLIP_CONSTANTS.MAX_IMAGES);
      const loadedItems: AiClipImage[] = [];
      for (const item of candidates) {
        if (cancelled) return;
        const sourceId = buildSourceImageId(item.relativePath);
        if (dismissedSourceKeysRef.current.has(sourceId) || dismissedSourceKeysRef.current.has(item.name)) continue;
        const dataUrl = await fetchImageAsDataUrl(item.url);
        if (cancelled) return;
        if (dataUrl) loadedItems.push({ id: sourceId, name: item.name, dataUrl });
      }
      if (cancelled || _.isEmpty(loadedItems)) return;
      setImages((previous) => {
        const next = [...previous];
        let changed = false;
        for (const loaded of loadedItems) {
          if (next.length >= VIDEO_EXPORT_AI_CLIP_CONSTANTS.MAX_IMAGES) break;
          if (dismissedSourceKeysRef.current.has(loaded.id) || dismissedSourceKeysRef.current.has(loaded.name)) continue;
          const exists = _.some(next, (existing) => existing.id === loaded.id || existing.name === loaded.name);
          if (!exists) {
            next.push(loaded);
            changed = true;
          }
        }
        return changed ? next : previous;
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [hydrated, folderPath, sourceImages]);
  useEffect(() => {
    if (!jobId) return;
    const poll = async () => {
      try {
        const data = await requestJson<{ job?: VideoExportAiClipJobState }>(`${API_ROUTES.VIDEO_EXPORT_AI_CLIPS_STATUS}${jobId}`);
        if (!isMountedRef.current || !data.job) return;
        const nextJob = data.job;
        setJob(nextJob);
        const freshClips = _.filter(nextJob.clips, (clip) => !seenClipIdsRef.current.has(clip.id));
        _.forEach(freshClips, (clip) => seenClipIdsRef.current.add(clip.id));
        if (!_.isEmpty(freshClips)) setClips((previous) => mergeFreshClips(previous, freshClips));
        if (nextJob.status === VideoExportAiClipJobStatus.RUNNING) return;
        setJobId("");
        if (nextJob.status === VideoExportAiClipJobStatus.COMPLETED) {
          if (!_.isEmpty(nextJob.errors)) toast.warning(nextJob.message);
          else toast.success(nextJob.message);
        } else if (nextJob.status === VideoExportAiClipJobStatus.ERROR) toast.error(_.head(nextJob.errors) || nextJob.message || text.AI_CLIP_ERR_FAILED);
        else toast.info(nextJob.message);
      } catch {
        if (!isMountedRef.current) return;
        setJobId("");
        setJob((previous) => (previous ? { ...previous, status: VideoExportAiClipJobStatus.ERROR, stopping: false, message: text.AI_CLIP_ERR_FAILED, errors: _.isEmpty(previous.errors) ? [text.AI_CLIP_ERR_FAILED] : previous.errors } : null));
      }
    };
    void poll();
    const timer = setInterval(poll, VIDEO_EXPORT_AI_CLIP_CONSTANTS.POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [jobId, text]);
  const addFiles = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files ?? []);
      event.target.value = "";
      if (_.isEmpty(files)) return;
      const accepted = _.filter(files, (file) => file.size <= VIDEO_EXPORT_AI_CLIP_CONSTANTS.MAX_IMAGE_BYTES);
      const loaded = await Promise.all(_.map(accepted, async (file) => ({ id: _.uniqueId(VIDEO_EXPORT_AI_CLIP_CONSTANTS.INPUT_ID_PREFIX), name: file.name, dataUrl: await readBlobAsDataUrl(file) })));
      const valid = _.filter(loaded, (item) => VIDEO_EXPORT_AI_CLIP_REGEX.IMAGE_DATA_URL.test(item.dataUrl));
      if (valid.length < files.length) toast.warning(text.AI_CLIP_ERR_TOO_BIG);
      setImages((previous) => {
        const merged = [...previous, ...valid];
        if (merged.length > VIDEO_EXPORT_AI_CLIP_CONSTANTS.MAX_IMAGES) toast.warning(text.AI_CLIP_ERR_MAX);
        return _.take(merged, VIDEO_EXPORT_AI_CLIP_CONSTANTS.MAX_IMAGES);
      });
    },
    [text],
  );
  const removeImage = useCallback((imageId: string) => {
    setImages((previous) => {
      const target = _.find(previous, { id: imageId });
      if (target) {
        dismissedSourceKeysRef.current.add(target.id);
        dismissedSourceKeysRef.current.add(target.name);
      }
      return _.reject(previous, { id: imageId });
    });
  }, []);
  const removeClip = useCallback((clipId: string) => setClips((previous) => _.reject(previous, { id: clipId })), []);
  const toggleClipAudio = useCallback((clipId: string) => setClips((previous) => _.map(previous, (clip) => (clip.id === clipId ? { ...clip, keepAudio: !clip.keepAudio } : clip))), []);
  const clearClips = useCallback(() => {
    seenClipIdsRef.current.clear();
    setClips([]);
    setJob(null);
  }, []);
  const generate = useCallback(
    async (options?: GenerateAiClipsOptions) => {
      if (isGenerating) return;
      if (_.isEmpty(images)) {
        toast.error(text.AI_CLIP_ERR_NO_IMAGES);
        return;
      }
      const requestedIdSet = !_.isEmpty(options?.imageIds) ? new Set(options?.imageIds) : null;
      const shouldRestart = Boolean(options?.restart) || (!requestedIdSet && _.isEmpty(missingImages) && !_.isEmpty(clips));
      const targetImages = requestedIdSet ? _.filter(images, (image) => requestedIdSet.has(image.id)) : shouldRestart ? images : !_.isEmpty(missingImages) ? missingImages : images;
      if (_.isEmpty(targetImages)) return;
      try {
        const data = await requestJson<{ jobId?: string }>(API_ROUTES.VIDEO_EXPORT_AI_CLIPS_START, {
          images: _.map(targetImages, (image) => ({ id: image.id, name: image.name, dataUrl: image.dataUrl })),
          note,
          aspectRatio,
          provider,
          model,
          executionMode,
          chromeHeadless,
        });
        if (!data.jobId) return;
        if (shouldRestart) {
          seenClipIdsRef.current.clear();
          setClips([]);
        }
        setEnabled(true);
        setJob({ jobId: data.jobId, status: VideoExportAiClipJobStatus.RUNNING, done: 0, total: targetImages.length, message: text.AI_CLIP_GENERATING, clips: [], errors: [], itemErrors: [] });
        setJobId(data.jobId);
      } catch (error) {
        const errMsg = _.toString(_.get(error, VIDEO_EXPORT_AI_CLIP_CONSTANTS.FIELD_MESSAGE)) || text.AI_CLIP_ERR_FAILED;
        setJob({
          jobId: "",
          status: VideoExportAiClipJobStatus.ERROR,
          done: 0,
          total: targetImages.length,
          message: errMsg,
          clips: [],
          errors: [errMsg],
          itemErrors: _.map(targetImages, (image) => ({ imageId: image.id, name: image.name, reason: errMsg })),
        });
        toast.error(errMsg);
      }
    },
    [isGenerating, images, missingImages, clips, note, aspectRatio, provider, model, executionMode, chromeHeadless, text],
  );
  const retryFailed = useCallback(() => {
    const targetIds = _.map(!_.isEmpty(missingImages) ? missingImages : images, (image) => image.id);
    return generate({ imageIds: targetIds });
  }, [generate, missingImages, images]);
  const retryImage = useCallback((imageId: string) => generate({ imageIds: [imageId] }), [generate]);
  const canRedoClip = useCallback((clip: VideoExportAiClip) => _.some(images, (image) => clipMatchesImage(clip, image)), [images]);
  const redoClip = useCallback(
    (clipId: string) => {
      const clip = _.find(clips, { id: clipId });
      if (!clip) return;
      const sourceImage = _.find(images, (image) => clipMatchesImage(clip, image));
      if (sourceImage) void generate({ imageIds: [sourceImage.id] });
    },
    [clips, images, generate],
  );
  const stop = useCallback(async () => {
    const currentJobId = jobId || job?.jobId || "";
    setJobId("");
    setJob((previous) => (previous ? { ...previous, status: VideoExportAiClipJobStatus.CANCELLED, stopping: false, message: text.AI_CLIP_CANCELLED } : null));
    const data = await requestJson<{ job?: VideoExportAiClipJobState }>(API_ROUTES.VIDEO_EXPORT_AI_CLIPS_CANCEL, { jobId: currentJobId }).catch(() => null);
    if (!isMountedRef.current) return;
    if (data?.job) setJob(data.job);
    toast.info(data?.job?.message || text.AI_CLIP_CANCELLED);
  }, [jobId, job?.jobId, text]);
  return {
    enabled,
    setEnabled,
    note,
    setNote,
    images,
    addFiles,
    removeImage,
    clips,
    removeClip,
    toggleClipAudio,
    clearClips,
    job,
    isGenerating,
    generate,
    retryFailed,
    retryImage,
    canRedoClip,
    redoClip,
    stop,
    activeClipIds,
    activeClipAudioIds,
    completedImageIds,
    missingImages,
    failedErrorByImageId,
    hasRecoverableError,
  };
}
export type VideoExportAiClipsState = ReturnType<typeof useVideoExportAiClips>;
