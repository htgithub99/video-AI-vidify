import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import _ from "lodash";
import { API_ROUTES } from "../../../constants/apiRoutes.js";
import { MOTION_VOICE_LIBRARY } from "../../../constants/motionVoice.js";
import { jsonUtils } from "../../../lib/json.js";
import type { Lang } from "../../../lib/lang.js";
import type { MotionVoiceChannels } from "../../../types/motionVideo.js";
import { motionRequest } from "../../motion/components/motionApi.js";
import { REUP_LIMITS, REUP_STORAGE, REUP_URL } from "../constants/reupConfig.js";
import { REUP_DEFAULT_PRESET, reupPreset, reupPresetDefaults } from "../constants/reupPresets.js";
import { reupTexts } from "../constants/reupTexts.js";
import { cleanReupSettings } from "../lib/reupSettings.js";
import type { ReupJob, ReupPresetId, ReupScript, ReupSettings, ReupSource, ReupStepId } from "../types/reup.js";
interface Stored {
  preset?: ReupPresetId;
  presetSettings?: Partial<Record<ReupPresetId, ReupSettings>>;
  jobId?: string;
  sourcePath?: string;
}
export interface ReupJobSummary {
  id: string;
  name: string;
  preset: ReupPresetId;
  status: ReupJob["status"];
  updatedAt: number;
  outputs: Pick<ReupJob["outputs"][number], "id" | "url" | "duration" | "width" | "height">[];
  packageDir?: string;
}
const errorText = (error: unknown): string => String((error as Error)?.message || error);
/** State of the Reup screen: choices saved per video type, the current run (polled while it works), voice channels and past runs. */
export const useReupStudio = (lang: Lang) => {
  const text = reupTexts(lang);
  const [loaded, setLoaded] = useState(false);
  const [preset, setPreset] = useState<ReupPresetId>(REUP_DEFAULT_PRESET);
  const [presetSettings, setPresetSettings] = useState<Partial<Record<ReupPresetId, ReupSettings>>>({});
  const [sourcePath, setSourcePath] = useState("");
  const [source, setSource] = useState<ReupSource | null>(null);
  const [licensed, setLicensed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [job, setJob] = useState<ReupJob | null>(null);
  const [results, setResults] = useState<ReupJobSummary[]>([]);
  const [voiceChannels, setVoiceChannels] = useState<MotionVoiceChannels>({ channels: [] });
  const channelsRef = useRef<MotionVoiceChannels>({ channels: [] });
  const settings = useMemo(() => presetSettings[preset] || reupPresetDefaults(preset), [presetSettings, preset]);
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
    const res = await motionRequest<{ jobs: ReupJobSummary[] }>(REUP_URL.JOBS).catch(() => null);
    if (res) setResults(res.jobs || []);
  }, []);
  const loadSource = useCallback(async (file: string) => {
    const path = file.trim();
    if (!path) return;
    setSourcePath(path);
    setBusy(true);
    try {
      setSource((await motionRequest<{ source: ReupSource }>(REUP_URL.SOURCE, { path })).source);
    } catch (error) {
      setSource(null);
      toast.error(errorText(error));
    } finally {
      setBusy(false);
    }
  }, []);
  const openJob = useCallback(async (id: string) => {
    const res = await motionRequest<{ job: ReupJob }>(REUP_URL.STATUS(id)).catch(() => null);
    if (!res?.job) return;
    setJob(res.job);
    setSource(res.job.source);
    setSourcePath(res.job.source.path);
    setPreset(res.job.preset);
  }, []);
  useEffect(() => {
    void (async () => {
      const saved = await jsonUtils.getAsyncItem<Stored>(REUP_STORAGE.STATE, {});
      setPreset(reupPreset(saved.preset).id);
      setPresetSettings(_.mapValues(saved.presetSettings || {}, (value, key) => cleanReupSettings(value, key as ReupPresetId)));
      if (saved.sourcePath) setSourcePath(saved.sourcePath);
      if (saved.jobId) await openJob(saved.jobId);
      else if (saved.sourcePath) await motionRequest<{ source: ReupSource }>(REUP_URL.SOURCE, { path: saved.sourcePath }).then((r) => setSource(r.source), _.noop);
      setLoaded(true);
    })();
    void reloadVoiceChannels();
    void reloadResults();
  }, [openJob, reloadResults, reloadVoiceChannels]);
  useEffect(() => {
    if (!loaded) return;
    void jsonUtils.setAsyncItem<Stored>(REUP_STORAGE.STATE, { preset, presetSettings, jobId: job?.id, sourcePath });
  }, [loaded, preset, presetSettings, job?.id, sourcePath]);
  useEffect(() => {
    if (!job || job.status !== "running") return;
    const timer = setInterval(() => {
      motionRequest<{ job: ReupJob }>(REUP_URL.STATUS(job.id))
        .then((r) => {
          setJob(r.job);
          if (r.job.status !== "running") void reloadResults();
        })
        .catch(_.noop);
    }, REUP_LIMITS.POLL_MS);
    return () => clearInterval(timer);
  }, [job?.id, job?.status, reloadResults]);
  const patch = useCallback((value: Partial<ReupSettings>) => setPresetSettings((all) => ({ ...all, [preset]: cleanReupSettings({ ...(all[preset] || reupPresetDefaults(preset)), ...value }, preset) })), [preset]);
  const pick = useCallback(
    async (url: string, key: "filePath" | "folderPath") => {
      const res = await motionRequest<Record<string, string>>(url, {}).catch(() => null);
      if (res?.[key]) await loadSource(res[key]);
    },
    [loadSource],
  );
  const pickSource = useCallback(() => (reupPreset(preset).source === "folder" ? pick(REUP_URL.PICK_FOLDER, "folderPath") : pick(API_ROUTES.PIPELINE_SELECT_FILE, "filePath")), [pick, preset]);
  const act = useCallback(async (url: string, body: unknown) => {
    setBusy(true);
    try {
      const res = await motionRequest<{ job: ReupJob | null }>(url, body);
      if (res.job) setJob(res.job);
    } catch (error) {
      toast.error(errorText(error));
    } finally {
      setBusy(false);
    }
  }, []);
  const start = useCallback(() => {
    const def = reupPreset(preset);
    if (!source) return toast.error(text.NEED_SOURCE);
    if (!licensed) return toast.error(text.NEED_LICENSE);
    if (!def.speech && !settings.voiceChannel) return toast.error(text.NEED_VOICE);
    if (def.bilingual && !settings.voiceChannelAlt) return toast.error(text.NEED_VOICE_ALT);
    void act(REUP_URL.START, { path: source.path, preset, settings, licensed });
  }, [act, licensed, preset, settings, source, text]);
  const cancel = useCallback(() => job && act(REUP_URL.CANCEL, { jobId: job.id }), [act, job]);
  /** Re-run a step with the current choices for the run's video type (e.g. another voice channel). */
  const rerun = useCallback((step: ReupStepId) => job && act(REUP_URL.RERUN, { jobId: job.id, step, settings: presetSettings[job.preset] || reupPresetDefaults(job.preset) }), [act, job, presetSettings]);
  const approveScript = useCallback((script: ReupScript) => job && act(REUP_URL.APPROVE_SCRIPT, { jobId: job.id, script }), [act, job]);
  /** Save an edited video through the "Save as" dialog, like Video Motion's download button. */
  const saveVideo = useCallback(async (jobId: string, outputId: string) => {
    try {
      const res = await motionRequest<{ cancelled?: boolean; savedPath?: string }>(REUP_URL.SAVE_VIDEO, { jobId, outputId });
      if (res.savedPath) toast.success(res.savedPath);
    } catch (error) {
      toast.error(errorText(error));
    }
  }, []);
  const newJob = useCallback(() => {
    setJob(null);
    setLicensed(false);
  }, []);
  const selectPreset = useCallback((id: ReupPresetId) => setPreset(reupPreset(id).id), []);
  return { text, loaded, preset, selectPreset, settings, patch, sourcePath, setSourcePath, source, loadSource, pickSource, licensed, setLicensed, busy, running, job, openJob, results, voiceChannels, reloadVoiceChannels, start, cancel, rerun, approveScript, saveVideo, newJob };
};
export type ReupStudio = ReturnType<typeof useReupStudio>;
