import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import _ from "lodash";
import { API_ROUTES } from "../../../constants/apiRoutes.js";
import { jsonUtils } from "../../../lib/json.js";
import { VIDEO_EXPORT_AI_CLIP_CONSTANTS, VIDEO_EXPORT_AI_CLIP_REGEX } from "../constants/videoExportAiClip.js";
import { requestJson, VideoExportTexts } from "../components/videoExportUtils.js";
import { VideoExportAiClip, VideoExportAiClipJobState, VideoExportAiClipJobStatus, VideoExportAspectRatio } from "../types/videoExport.js";
type AiClipImage = { id: string; name: string; dataUrl: string };
type StoredAiClipSettings = { enabled?: boolean; note?: string; clips?: VideoExportAiClip[]; jobId?: string };
const readStoredAiClipSettings = (): StoredAiClipSettings => jsonUtils.getItem<StoredAiClipSettings>(VIDEO_EXPORT_AI_CLIP_CONSTANTS.STORAGE_KEY, {}) ?? {};
const readFileAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(_.toString(reader.result));
    reader.onerror = () => resolve("");
    reader.readAsDataURL(file);
  });
export function useVideoExportAiClips(text: VideoExportTexts, aspectRatio: VideoExportAspectRatio, chromeHeadless: boolean) {
  const initial = useMemo(readStoredAiClipSettings, []);
  const [enabled, setEnabled] = useState<boolean>(initial.enabled === true);
  const [note, setNote] = useState<string>(_.toString(initial.note));
  const [images, setImages] = useState<AiClipImage[]>([]);
  const [clips, setClips] = useState<VideoExportAiClip[]>(_.isArray(initial.clips) ? initial.clips : []);
  const [job, setJob] = useState<VideoExportAiClipJobState | null>(null);
  const [jobId, setJobId] = useState<string>(_.toString(initial.jobId));
  const isMountedRef = useRef<boolean>(true);
  const seenClipIdsRef = useRef<Set<string>>(new Set(_.map(initial.clips, (clip) => clip.id)));
  const isGenerating = job?.status === VideoExportAiClipJobStatus.RUNNING;
  const activeClipIds = useMemo(() => (enabled ? _.map(clips, (clip) => clip.id) : []), [enabled, clips]);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  useEffect(() => {
    jsonUtils.setItem<StoredAiClipSettings>(VIDEO_EXPORT_AI_CLIP_CONSTANTS.STORAGE_KEY, { enabled, note, clips, jobId });
  }, [enabled, note, clips, jobId]);
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
        if (!_.isEmpty(freshClips)) setClips((previous) => [...previous, ...freshClips]);
        if (nextJob.status === VideoExportAiClipJobStatus.RUNNING) return;
        setJobId("");
        if (nextJob.status === VideoExportAiClipJobStatus.COMPLETED) {
          toast.success(nextJob.message);
          setImages([]);
        } else if (nextJob.status === VideoExportAiClipJobStatus.ERROR) toast.error(_.head(nextJob.errors) || nextJob.message || text.AI_CLIP_ERR_FAILED);
        else toast.info(nextJob.message);
      } catch {
        if (!isMountedRef.current) return;
        setJobId("");
        setJob(null);
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
      const loaded = await Promise.all(_.map(accepted, async (file) => ({ id: _.uniqueId(VIDEO_EXPORT_AI_CLIP_CONSTANTS.INPUT_ID_PREFIX), name: file.name, dataUrl: await readFileAsDataUrl(file) })));
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
  const removeImage = useCallback((imageId: string) => setImages((previous) => _.reject(previous, { id: imageId })), []);
  const removeClip = useCallback((clipId: string) => setClips((previous) => _.reject(previous, { id: clipId })), []);
  const clearClips = useCallback(() => setClips([]), []);
  const generate = useCallback(async () => {
    if (isGenerating) return;
    if (_.isEmpty(images)) {
      toast.error(text.AI_CLIP_ERR_NO_IMAGES);
      return;
    }
    try {
      const data = await requestJson<{ jobId?: string }>(API_ROUTES.VIDEO_EXPORT_AI_CLIPS_START, { images: _.map(images, (image) => ({ name: image.name, dataUrl: image.dataUrl })), note, aspectRatio, chromeHeadless });
      if (!data.jobId) return;
      setEnabled(true);
      setJob({ jobId: data.jobId, status: VideoExportAiClipJobStatus.RUNNING, done: 0, total: images.length, message: text.AI_CLIP_GENERATING, clips: [], errors: [] });
      setJobId(data.jobId);
    } catch (error) {
      toast.error(_.toString(_.get(error, VIDEO_EXPORT_AI_CLIP_CONSTANTS.FIELD_MESSAGE)) || text.AI_CLIP_ERR_FAILED);
    }
  }, [isGenerating, images, note, aspectRatio, chromeHeadless, text]);
  const stop = useCallback(async () => {
    if (!jobId) return;
    const data = await requestJson<{ job?: VideoExportAiClipJobState }>(API_ROUTES.VIDEO_EXPORT_AI_CLIPS_CANCEL, { jobId }).catch(() => null);
    if (data?.job && isMountedRef.current) setJob(data.job);
  }, [jobId]);
  return { enabled, setEnabled, note, setNote, images, addFiles, removeImage, clips, removeClip, clearClips, job, isGenerating, generate, stop, activeClipIds };
}
export type VideoExportAiClipsState = ReturnType<typeof useVideoExportAiClips>;
