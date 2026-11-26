import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import _ from "lodash";
import { API_ROUTES } from "../../../constants/apiRoutes.js";
import { MOTION_VOICE_LIBRARY } from "../../../constants/motionVoice.js";
import { jsonUtils } from "../../../lib/json.js";
import type { Lang } from "../../../lib/lang.js";
import type { MotionVoiceChannels } from "../../../types/motionVideo.js";
import { motionRequest } from "../../motion/components/motionApi.js";
import { BORNAS_AI_DEFAULT, BORNAS_LIMITS, bornasAiSettings, BORNAS_STEPS, BORNAS_STORAGE, BORNAS_URL, bornasGenre, bornasNewChannel } from "../constants/bornasConfig.js";
import { bornasTexts } from "../constants/bornasTexts.js";
import type { BornasAiSettings, BornasChannel, BornasJob, BornasJobSummary, BornasSample, BornasScript, BornasStepId } from "../types/bornas.js";
interface Stored {
  channels?: BornasChannel[];
  channelId?: string;
  ai?: BornasAiSettings;
  jobId?: string;
  sourcePath?: string;
}
const errorText = (error: unknown): string => String((error as Error)?.message || error);
const newId = (): string => `ch_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
export const useBornasStudio = (lang: Lang) => {
  const text = bornasTexts(lang);
  const [loaded, setLoaded] = useState(false);
  const [channels, setChannels] = useState<BornasChannel[]>([]);
  const [channelId, setChannelId] = useState("");
  const [ai, setAi] = useState<BornasAiSettings>(BORNAS_AI_DEFAULT);
  const [sample, setSample] = useState<BornasSample | null>(null);
  const [busy, setBusy] = useState(false);
  const [job, setJob] = useState<BornasJob | null>(null);
  const [results, setResults] = useState<BornasJobSummary[]>([]);
  const [voiceChannels, setVoiceChannels] = useState<MotionVoiceChannels>({ channels: [] });
  const channelsRef = useRef<MotionVoiceChannels>({ channels: [] });
  const channelIdRef = useRef("");
  const channel = useMemo(() => channels.find((c) => c.id === channelId) || channels[0], [channels, channelId]);
  const sourcePath = channel?.sample || "";
  const running = job?.status === "running";
  const reloadVoiceChannels = useCallback(async (): Promise<MotionVoiceChannels> => {
    try {
      const data = await motionRequest<MotionVoiceChannels>(MOTION_VOICE_LIBRARY.CHANNELS_URL);
      channelsRef.current = { channels: data.channels || [], ...(data.defaultId ? { defaultId: data.defaultId } : {}) };
      setVoiceChannels(channelsRef.current);
    } catch {}
    return channelsRef.current;
  }, []);
  const reloadResults = useCallback(async () => {
    const res = await motionRequest<{ jobs: BornasJobSummary[] }>(BORNAS_URL.JOBS).catch(() => null);
    if (res) setResults(res.jobs || []);
  }, []);
  const setSourcePath = useCallback((path: string) => setChannels((all) => all.map((c) => (c.id === channelIdRef.current ? { ...c, sample: path } : c))), []);
  const loadSource = useCallback(async (file: string) => {
    const path = file.trim();
    if (!path) return;
    setSourcePath(path);
    setBusy(true);
    try {
      setSample((await motionRequest<{ sample: BornasSample }>(BORNAS_URL.SOURCE, { path })).sample);
    } catch (error) {
      setSample(null);
      toast.error(errorText(error));
    } finally {
      setBusy(false);
    }
  }, []);
  const openJob = useCallback(async (id: string) => {
    const res = await motionRequest<{ job: BornasJob }>(BORNAS_URL.STATUS(id)).catch(() => null);
    if (!res?.job) return;
    setJob(res.job);
    setSample(res.job.sample);
    channelIdRef.current = res.job.channel.id;
    setChannelId(res.job.channel.id);
  }, []);
  useEffect(() => {
    void (async () => {
      const saved = await jsonUtils.getAsyncItem<Stored>(BORNAS_STORAGE.STATE, {});
      const base = saved.channels?.length ? saved.channels : [bornasNewChannel(newId(), text.CHANNEL_NEW)];
      const list = base.map((c) => ({ ...c, genre: bornasGenre(c.genre), ...(c.sample || !saved.sourcePath ? {} : { sample: saved.sourcePath }) }));
      const first = saved.channelId && list.some((c) => c.id === saved.channelId) ? saved.channelId : list[0].id;
      setChannels(list);
      channelIdRef.current = first;
      setChannelId(first);
      if (saved.ai) setAi(bornasAiSettings(saved.ai));
      if (saved.jobId) await openJob(saved.jobId);
      setLoaded(true);
    })();
    void reloadVoiceChannels();
    void reloadResults();
  }, [openJob, reloadResults, reloadVoiceChannels, text.CHANNEL_NEW]);
  useEffect(() => {
    if (!loaded) return;
    void jsonUtils.setAsyncItem<Stored>(BORNAS_STORAGE.STATE, { channels, channelId, ai, jobId: job?.id });
  }, [loaded, channels, channelId, ai, job?.id]);
  useEffect(() => {
    if (!loaded || !sourcePath || sample?.path === sourcePath) return;
    void motionRequest<{ sample: BornasSample }>(BORNAS_URL.SOURCE, { path: sourcePath }).then(
      (r) => setSample(r.sample),
      () => setSample(null),
    );
  }, [loaded, sourcePath, sample?.path]);
  useEffect(() => {
    if (!job || job.status !== "running") return;
    const timer = setInterval(() => {
      motionRequest<{ job: BornasJob }>(BORNAS_URL.STATUS(job.id))
        .then((r) => {
          setJob(r.job);
          if (r.job.status !== "running") void reloadResults();
        })
        .catch(_.noop);
    }, BORNAS_LIMITS.POLL_MS);
    return () => clearInterval(timer);
  }, [job?.id, job?.status, reloadResults]);
  const selectChannel = useCallback((id: string) => {
    channelIdRef.current = id;
    setChannelId(id);
    setSample(null);
  }, []);
  const patchChannel = useCallback((value: Partial<BornasChannel>) => setChannels((all) => all.map((c) => (c.id === channel?.id ? { ...c, ...value } : c))), [channel?.id]);
  const addChannel = useCallback(() => {
    const created = bornasNewChannel(newId(), `${text.CHANNEL_NEW} ${channels.length + 1}`);
    setChannels((all) => [...all, created]);
    channelIdRef.current = created.id;
    setChannelId(created.id);
    setSample(null);
  }, [channels.length, text.CHANNEL_NEW]);
  const removeChannel = useCallback(
    (id: string) => {
      const next = channels.filter((c) => c.id !== id);
      const list = next.length ? next : [bornasNewChannel(newId(), text.CHANNEL_NEW)];
      channelIdRef.current = list[0].id;
      setChannels(list);
      setChannelId(list[0].id);
      setSample(null);
    },
    [channels, text.CHANNEL_NEW],
  );
  const pickSource = useCallback(async () => {
    const res = await motionRequest<{ filePath?: string }>(API_ROUTES.PIPELINE_SELECT_FILE, {}).catch(() => null);
    if (res?.filePath) await loadSource(res.filePath);
  }, [loadSource]);
  const act = useCallback(async (url: string, body: unknown) => {
    setBusy(true);
    try {
      const res = await motionRequest<{ job: BornasJob | null }>(url, body);
      if (res.job) setJob(res.job);
    } catch (error) {
      toast.error(errorText(error));
    } finally {
      setBusy(false);
    }
  }, []);
  const start = useCallback(() => {
    if (!channel) return toast.error(text.NEED_CHANNEL);
    if (!sample) return toast.error(text.NEED_SOURCE);
    if (!channel.voiceChannel) return toast.error(text.NEED_VOICE);
    void act(BORNAS_URL.START, { path: sample.path, channel, ai });
  }, [act, ai, channel, sample, text]);
  const cancel = useCallback(() => job && act(BORNAS_URL.CANCEL, { jobId: job.id }), [act, job]);
  const approve = useCallback((scripts: BornasScript[]) => job && act(BORNAS_URL.APPROVE, { jobId: job.id, scripts }), [act, job]);
  const rerun = useCallback((step: BornasStepId, video?: number) => job && act(BORNAS_URL.RERUN, { jobId: job.id, step, video, ai }), [act, ai, job]);
  const resumeStep = job && (["cancelled", "error"].includes(job.status) || (job.status === "waiting" && job.videos.some((v) => v.status === "waiting"))) ? BORNAS_STEPS.find((step) => job.steps[step]?.status !== "done") : undefined;
  const resume = useCallback(() => {
    if (!job || !resumeStep) return;
    if (job.status === "waiting") return approve([]);
    return rerun(resumeStep);
  }, [approve, job, resumeStep, rerun]);
  const saveVideo = useCallback(async (jobId: string, video: number) => {
    try {
      const res = await motionRequest<{ savedPath?: string }>(BORNAS_URL.SAVE_VIDEO, { jobId, video });
      if (res.savedPath) toast.success(res.savedPath);
    } catch (error) {
      toast.error(errorText(error));
    }
  }, []);
  const deleteResults = useCallback(async (ids: string[]) => {
    const res = await motionRequest<{ failed?: string[] }>(BORNAS_URL.DELETE, { ids });
    const failed = new Set(res.failed || []);
    setResults((list) => list.filter((r) => failed.has(r.id) || !ids.includes(r.id)));
    setJob((current) => (current && ids.includes(current.id) && !failed.has(current.id) ? null : current));
  }, []);
  const deleteVideos = useCallback(
    async (items: { jobId: string; video: number }[]) => {
      const res = await motionRequest<{ failed?: string[]; freedBytes?: number }>(BORNAS_URL.DELETE_VIDEOS, { items });
      await reloadResults();
      if (job && items.some((it) => it.jobId === job.id)) await openJob(job.id);
      return res;
    },
    [job, openJob, reloadResults],
  );
  const newJob = useCallback(() => setJob(null), []);
  return { lang, text, loaded, channels, channel, selectChannel, patchChannel, addChannel, removeChannel, ai, setAi, sourcePath, setSourcePath, sample, loadSource, pickSource, busy, running, job, openJob, results, reloadResults, deleteResults, voiceChannels, reloadVoiceChannels, start, cancel, approve, rerun, resume, resumeStep, saveVideo, deleteVideos, newJob };
};
export type BornasStudio = ReturnType<typeof useBornasStudio>;
