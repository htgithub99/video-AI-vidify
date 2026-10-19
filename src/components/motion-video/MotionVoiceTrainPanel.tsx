import _ from "lodash";
import { AudioLines, FileAudio, GraduationCap, Info, Mic2, Square, Trash2 } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState, type FC } from "react";
import { toast } from "sonner";
import * as MR from "../../constants/motionRuntime.js";
import { API_ROUTES } from "../../constants/apiRoutes";
import { MOTION_VOICE_TRAIN as T, MOTION_VOICE_TRAIN_TEXT, MOTION_VOICE_TRAIN_UI as UI } from "../../constants/motionVoiceTrain.js";
import { VOICE_WORKSPACE_CONFIG as C, VOICE_WORKSPACE_STYLES as W, voiceWorkspaceItemLabel } from "../../constants/motionVoiceWorkspace.js";
import { isMotionJobTerminal } from "../../lib/motionJob.js";
import { MotionJobStatus, type MotionStoryJobState } from "../../types/motionVideo";
import { StudioInput, StudioSelect, StudioTextarea } from "../ui/Studio";
import { MotionVoiceAudioUpload, MotionVoiceField, MotionVoiceListItem, MotionVoiceToolCard } from "./MotionVoiceWorkspace.js";
import { mergeMotionWorkspaceFiles, motionWorkspaceFileKey, motionWorkspaceLanguage } from "../../lib/motionWorkspace.js";
import { ActionBtn } from "./MotionControls";
import { getMotionErrorMessage } from "../../lib/motionUtils.js";
import { formatBytes, motionJobStatusUrl, motionRequest, pollMotionJob, readFileBase64 } from "./motionApi";
interface TrainedVoice { id: string; name: string; gender: string; description: string; minutes: number; clips: number; createdAt: number; }
interface Props { lang: string; onTrained: () => void; }
export const MotionVoiceTrainPanel: FC<Props> = ({ lang, onTrained }) => {
  const t = MOTION_VOICE_TRAIN_TEXT[motionWorkspaceLanguage(lang)];
  const [name, setName] = useState<string>(T.EMPTY);
  const [description, setDescription] = useState<string>(T.EMPTY);
  const [gender, setGender] = useState<string>(UI.MALE);
  const [files, setFiles] = useState<File[]>([]);
  const [consent, setConsent] = useState(false);
  const [job, setJob] = useState<MotionStoryJobState | null>(null);
  const [voices, setVoices] = useState<TrainedVoice[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const id = useId();
  const abort = useRef<AbortController | null>(null);
  const running = !!job && !isMotionJobTerminal(job.status);
  const busy = running || submitting;
  const load = useCallback(() => { void motionRequest<{ voices: TrainedVoice[]; }>(T.LIST_URL) .then((d) => setVoices(d.voices || [])) .catch(_.noop); }, []);
  useEffect(() => { load(); return () => abort.current?.abort(); }, [load]);
  const start = async () => {
    if (busy || !consent || !files.length || !_.trim(name)) return;
    setSubmitting(true);
    try {
      const payload = await Promise.all(_.map(files, async (f) => ({ name: f.name, base64: await readFileBase64(f) })));
      const { job: started } = await motionRequest<{ job: MotionStoryJobState; }>(T.URL, { name, description, gender, consent, files: payload });
      setJob(started);
      const ctrl = new AbortController();
      abort.current = ctrl;
      const final = await pollMotionJob<MotionStoryJobState>(motionJobStatusUrl(API_ROUTES.MOTION_STORY_STATUS, started.id), setJob, (j) => isMotionJobTerminal(j.status), ctrl.signal, UI.POLL_MS);
      if (final.status === MotionJobStatus.COMPLETED) { setFiles([]); load(); onTrained(); } else if (final.error) toast.error(final.error);
    } catch (e) {
      toast.error(getMotionErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };
  const stop = () => void motionRequest(API_ROUTES.MOTION_STORY_CANCEL, { jobId: job?.id }).catch(_.noop);
  const remove = (voiceId: string) => void motionRequest<{ voices: TrainedVoice[]; }>(T.DELETE_URL, { id: voiceId }) .then((d) => { setVoices(d.voices || []); onTrained(); }) .catch((e) => toast.error(getMotionErrorMessage(e)));
  const size = _.sumBy(files, (f) => f.size) / UI.MB;
  const progress = Math.max(0, Math.min(UI.PERCENT, Math.round((job?.progress || 0) * UI.PERCENT)));
  return (
    <MotionVoiceToolCard icon={GraduationCap} title={t.TITLE} description={t.INTRO} badge={t.REQUIREMENT}>
      <div className={W.BODY}>
        <div className={W.FORM}>
          <div className={W.FIELDS}>
            <MotionVoiceField label={t.NAME}><StudioInput value={name} onChange={(e) => setName(e.target.value)} placeholder={t.NAME} className={W.INPUT} disabled={busy} /></MotionVoiceField>
            <MotionVoiceField label={t.GENDER}><StudioSelect value={gender} onChange={(e) => setGender(e.target.value)} className={W.INPUT} disabled={busy}><option value={UI.MALE}>{t.MALE}</option><option value={UI.FEMALE}>{t.FEMALE}</option></StudioSelect></MotionVoiceField>
          </div>
          <MotionVoiceField label={t.DESCRIPTION_LABEL}><StudioTextarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t.DESCRIPTION_HINT} rows={2} className={W.TEXTAREA} disabled={busy} /></MotionVoiceField>
          <div className={W.FORM}>
            <div className={W.ASIDE_TITLE}><span>{t.SOURCE}</span>{!!files.length && <span className={W.COUNT}>{t.FILES_PICKED(files.length, size.toFixed(1) + UI.MB_SUFFIX)}</span>}</div>
            <MotionVoiceAudioUpload title={t.FILE_ADD} hint={t.SOURCE_HINT} accept={UI.ACCEPT} multiple disabled={busy} onFiles={(chosen) => setFiles((current) => mergeMotionWorkspaceFiles(current, chosen, T.MAX_FILES))} />
            <p className={W.META}>{t.FILE_HINT}</p>
            {!!files.length && (
              <ul className={W.FILE_LIST}>
                {files.map((file, index) => ( <MotionVoiceListItem key={motionWorkspaceFileKey(file)} icon={FileAudio} title={file.name} removeLabel={voiceWorkspaceItemLabel(t.REMOVE_FILE, file.name)} disabled={busy} onRemove={() => setFiles((current) => current.filter((_, i) => i !== index))}><span className={W.META}>{formatBytes(file.size)}</span></MotionVoiceListItem> ))}
              </ul>
            )}
          </div>
          <label className={W.CONSENT}><input type={MR.MOTION_TEXT_CHECKBOX} className={W.CHECKBOX} checked={consent} disabled={busy} onChange={(e) => setConsent(e.target.checked)} /><span>{t.CONSENT}</span></label>
          <div className={W.FOOTER}>
            <p className={W.NOTE}><Info className={W.ICON_SMALL} /><span>{t.GPU_NOTE}</span></p>
            <div className={W.INLINE}>{running && ( <ActionBtn icon={Square} variant={UI.DANGER} onClick={stop}>{t.STOP}</ActionBtn> )}<ActionBtn icon={GraduationCap} className={W.ACTION} busy={busy} disabled={busy || !consent || !files.length || !_.trim(name)} onClick={() => void start()}>{running ? t.RUNNING : submitting ? t.UPLOADING : t.START}</ActionBtn></div>
          </div>
          {job && (
            <div className={W.PROGRESS}>
              <div className={W.PROGRESS_HEAD}><span>{job.stage || t.LOG}</span><span>{progress}{UI.PERCENT_SIGN}</span></div>
              <div className={UI.BAR} role={C.PROGRESS_ROLE} aria-label={t.LOG} aria-valuemin={0} aria-valuemax={UI.PERCENT} aria-valuenow={progress}><div className={UI.BAR_FILL} style={{ width: progress + UI.PERCENT_SIGN }} /></div>
              <details open={running}><summary className={W.SUMMARY}>{t.LOG}</summary><div className={UI.LOG}>{_.map(_.takeRight(job.log, UI.LOG_LINES), (line, i) => ( <div key={i}>{line}</div> ))}{job.error && <p role={C.ALERT_ROLE}>{job.error}</p>}</div></details>
            </div>
          )}
        </div>
        <aside className={W.ASIDE} aria-labelledby={id + C.TRAINED_SUFFIX}>
          <div className={W.ASIDE_TITLE}><h4 id={id + C.TRAINED_SUFFIX}>{t.TRAINED}</h4><span className={W.COUNT}>{voices.length}</span></div>
          {voices.length ? (
            <ul className={W.FILE_LIST}>
              {voices.map((voice) => ( <MotionVoiceListItem key={voice.id} icon={Mic2} title={voice.name} removeLabel={voiceWorkspaceItemLabel(t.DELETE, voice.name)} removeIcon={Trash2} disabled={busy} onRemove={() => remove(voice.id)}><p className={W.META}>{voice.description}</p><p className={W.META}>{t.MINUTES(voice.minutes, voice.clips)}</p></MotionVoiceListItem> ))}
            </ul>
          ) : (
            <div className={W.EMPTY}><AudioLines className={W.EMPTY_ICON} /><p className={W.LABEL}>{t.NONE}</p><p className={W.META}>{t.TRAINED_HINT}</p></div>
          )}
        </aside>
      </div>
    </MotionVoiceToolCard>
  );
};
