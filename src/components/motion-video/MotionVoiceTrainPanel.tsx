import _ from "lodash";
import { GraduationCap, Square, Trash2, Upload } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type FC } from "react";
import { toast } from "sonner";
import * as MR from "../../constants/motionRuntime.js";
import { API_ROUTES } from "../../constants/apiRoutes";
import { MOTION_VOICE_TRAIN as T, MOTION_VOICE_TRAIN_TEXT, MOTION_VOICE_TRAIN_UI as UI } from "../../constants/motionVoiceTrain.js";
import { isMotionJobTerminal } from "../../lib/motionJob.js";
import { MotionJobStatus, type MotionStoryJobState } from "../../types/motionVideo";
import { StudioInput, StudioSelect } from "../ui/Studio";
import { ActionBtn } from "./MotionControls";
import { getMotionErrorMessage } from "../../lib/motionUtils.js";
import { motionJobStatusUrl, motionRequest, pollMotionJob, readFileBase64 } from "./motionApi";

interface TrainedVoice { id: string; name: string; gender: string; description: string; minutes: number; clips: number; createdAt: number; }
interface Props { lang: string; onTrained: () => void; }

export const MotionVoiceTrainPanel: FC<Props> = ({ lang, onTrained }) => {
  const t = lang === MR.MOTION_TEXT_EN ? MOTION_VOICE_TRAIN_TEXT.en : MOTION_VOICE_TRAIN_TEXT.vi;
  const [name, setName] = useState<string>(T.EMPTY);
  const [description, setDescription] = useState<string>(T.EMPTY);
  const [gender, setGender] = useState<string>(UI.MALE);
  const [files, setFiles] = useState<File[]>([]);
  const [consent, setConsent] = useState(false);
  const [job, setJob] = useState<MotionStoryJobState | null>(null);
  const [voices, setVoices] = useState<TrainedVoice[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const abort = useRef<AbortController | null>(null);
  const running = !!job && !isMotionJobTerminal(job.status);
  const load = useCallback(() => {
    void motionRequest<{ voices: TrainedVoice[] }>(T.LIST_URL)
      .then((d) => setVoices(d.voices || []))
      .catch(_.noop);
  }, []);
  useEffect(() => {
    load();
    return () => abort.current?.abort();
  }, [load]);
  const start = async () => {
    try {
      const payload = await Promise.all(_.map(files, async (f) => ({ name: f.name, base64: await readFileBase64(f) })));
      const { job: started } = await motionRequest<{ job: MotionStoryJobState }>(T.URL, { name, description, gender, consent, files: payload });
      setJob(started);
      const ctrl = new AbortController();
      abort.current = ctrl;
      const final = await pollMotionJob<MotionStoryJobState>(motionJobStatusUrl(API_ROUTES.MOTION_STORY_STATUS, started.id), setJob, (j) => isMotionJobTerminal(j.status), ctrl.signal, UI.POLL_MS);
      if (final.status === MotionJobStatus.COMPLETED) {
        setFiles([]);
        load();
        onTrained();
      } else if (final.error) toast.error(final.error);
    } catch (e) {
      toast.error(getMotionErrorMessage(e));
    }
  };
  const stop = () => void motionRequest(API_ROUTES.MOTION_STORY_CANCEL, { jobId: job?.id }).catch(_.noop);
  const remove = (id: string) =>
    void motionRequest<{ voices: TrainedVoice[] }>(T.DELETE_URL, { id })
      .then((d) => {
        setVoices(d.voices || []);
        onTrained();
      })
      .catch((e) => toast.error(getMotionErrorMessage(e)));
  const size = _.sumBy(files, (f) => f.size) / UI.MB;
  return (
    <div className={UI.SECTION}>
      <div className={UI.TITLE}>{t.TITLE}</div>
      <p className={UI.HINT}>{t.HINT}</p>
      <div className={UI.ROW}>
        <StudioInput value={name} onChange={(e) => setName(e.target.value)} placeholder={t.NAME} className={UI.INPUT} disabled={running} />
        <StudioSelect value={gender} onChange={(e) => setGender(e.target.value)} className={UI.SELECT} disabled={running}>
          <option value={UI.MALE}>{t.MALE}</option>
          <option value={UI.FEMALE}>{t.FEMALE}</option>
        </StudioSelect>
      </div>
      <StudioInput value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t.DESCRIPTION} disabled={running} />
      <StudioInput
        type={MR.MOTION_TEXT_FILE}
        ref={inputRef}
        multiple
        accept={UI.ACCEPT}
        className={UI.HIDDEN}
        onChange={(e) => {
          setFiles(_.take(Array.from(e.target.files || []), T.MAX_FILES));
          e.target.value = T.EMPTY;
        }}
      />
      <div className={UI.ROW}>
        <ActionBtn icon={Upload} variant={UI.SECONDARY} disabled={running} onClick={() => inputRef.current?.click()}>
          {t.FILES}
        </ActionBtn>
        {!!files.length && <span className={UI.STAT}>{t.FILES_PICKED(files.length, size.toFixed(1) + UI.MB_SUFFIX)}</span>}
      </div>
      <label className={UI.CONSENT}>
        <input type={UI.CHECKBOX} className={UI.CHECK} checked={consent} disabled={running} onChange={(e) => setConsent(e.target.checked)} />
        <span>{t.CONSENT}</span>
      </label>
      <div className={UI.ROW}>
        <ActionBtn icon={GraduationCap} busy={running} disabled={running || !consent || !files.length || !_.trim(name)} onClick={() => void start()}>
          {running ? t.RUNNING : t.START}
        </ActionBtn>
        {running && (
          <ActionBtn icon={Square} variant={UI.DANGER} onClick={stop}>
            {t.STOP}
          </ActionBtn>
        )}
      </div>
      {job && (
        <>
          <div className={UI.BAR}>
            <div className={UI.BAR_FILL} style={{ width: Math.round((job.progress || 0) * UI.PERCENT) + UI.PERCENT_SIGN }} />
          </div>
          <div className={UI.LOG}>
            {_.map(_.takeRight(job.log, UI.LOG_LINES), (line, i) => (
              <div key={i}>{line}</div>
            ))}
            {job.error && <div>{job.error}</div>}
          </div>
        </>
      )}
      <div className={UI.TITLE}>{t.TRAINED}</div>
      {voices.length ? (
        _.map(voices, (v) => (
          <div key={v.id} className={UI.ITEM}>
            <div>
              <div>{v.name}</div>
              <div className={UI.ITEM_SUB}>
                {v.description} · {t.MINUTES(v.minutes, v.clips)}
              </div>
            </div>
            <button type={MR.MOTION_TEXT_BUTTON} className={UI.DELETE} title={t.DELETE} aria-label={t.DELETE} disabled={running} onClick={() => remove(v.id)}>
              <Trash2 className={UI.ICON} />
            </button>
          </div>
        ))
      ) : (
        <p className={UI.HINT}>{t.NONE}</p>
      )}
      <p className={UI.STAT}>{t.GPU_NOTE}</p>
    </div>
  );
};
