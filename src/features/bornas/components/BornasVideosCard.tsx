import { useState, type FC } from "react";
import { Clapperboard, Download, RotateCcw, Trash2 } from "lucide-react";
import { StudioDeleteConfirm, useStudioDeleteConfirm } from "../../../components/common/StudioDeleteConfirm.js";
import { Button } from "../../../components/ui/Button.js";
import { StudioCard, StudioSelect } from "../../../components/ui/Studio.js";
import { cn } from "../../../lib/utils.js";
import { StepHeader } from "../../motion/components/MotionControls.js";
import { reupClock } from "../../reup/components/ReupControls.js";
import { REUP_STYLES as S } from "../../reup/constants/reupStyles.js";
import { BORNAS_STYLES as B } from "../constants/bornasStyles.js";
import type { BornasStudio } from "../hooks/useBornasStudio.js";
import type { BornasVideoStatus } from "../types/bornas.js";
const STATE: Record<BornasVideoStatus, string> = { idle: B.STATE_IDLE, running: B.STATE_RUNNING, waiting: B.STATE_RUNNING, done: B.STATE_DONE, error: B.STATE_ERROR };
export const BornasVideosCard: FC<{ studio: BornasStudio }> = ({ studio }) => {
  const { job, text } = studio;
  const [open, setOpen] = useState(0);
  const confirmDel = useStudioDeleteConfirm();
  const videos = job?.videos || [];
  const current = videos.find((v) => v.index === open) || videos[0];
  return (
    <StudioCard className={S.CARD}>
      <StepHeader
        n="04"
        icon={Clapperboard}
        title={text.VIDEOS}
        right={
          <div className={B.RUN_PICK}>
            <StudioSelect className={B.RUN_SELECT} value={job?.id || ""} disabled={studio.running} onChange={(e) => (e.target.value ? void studio.openJob(e.target.value) : studio.newJob())}>
              <option value="">{text.RUN_NONE}</option>
              {studio.results.map((r) => (
                <option key={r.id} value={r.id}>
                  {text.RUN_OPTION(r.channelName, new Date(r.updatedAt).toLocaleString(), text.JOB_STATES[r.status])}
                </option>
              ))}
            </StudioSelect>
            {job && (
              <Button variant="unstyled" title={text.RUN_DELETE} disabled={studio.running} className={B.CHANNEL_DELETE} onClick={() => confirmDel.ask({ names: [job.videos.map((v) => v.title).join(" · ") || job.channel.name], message: text.RESULTS_DELETE_CONFIRM, run: () => studio.deleteResults([job.id]) })}>
                <Trash2 className={S.ICON} />
              </Button>
            )}
          </div>
        }
      />
      <div className={S.BODY}>
        {current?.previewUrl ? <video key={current.previewUrl} className={B.PLAYER} src={current.previewUrl} controls preload="metadata" /> : current?.sheetUrl ? <img className={B.SHEET_IMG} src={current.sheetUrl} alt={text.SHEET} /> : null}
        {!videos.length && <p className={S.HINT}>{text.NO_VIDEOS}</p>}
        {videos.map((v) => (
          <div key={v.index} className={cn(B.VIDEO_ROW, v.index === current?.index ? B.VIDEO_ROW_ON : B.VIDEO_ROW_OFF)} onClick={() => setOpen(v.index)}>
            <div className={B.VIDEO_HEAD}>
              <span className={B.VIDEO_TITLE}>
                {v.index + 1}. {v.title}
              </span>
              <span className={cn(B.STATE, STATE[v.status])}>{v.status === "running" && v.stage ? text.STEPS[v.stage] : text.VIDEO_STATES[v.status]}</span>
            </div>
            <div className={B.VIDEO_META}>
              {v.seconds ? <span>{reupClock(v.seconds)}</span> : null}
              {v.shotCount ? <span>{text.SHOTS(v.shotCount)}</span> : null}
              {v.checkIssues ? <span className={S.HINT_WARN}>{text.CHECK_ISSUES(v.checkIssues)}</span> : null}
              {v.sheetUrl && (
                <a href={v.sheetUrl} target="_blank" rel="noreferrer" className={S.LINK_BUTTON} onClick={(e) => e.stopPropagation()}>
                  {text.SHEET}
                </a>
              )}
              {v.shortUrl && (
                <a href={v.shortUrl} target="_blank" rel="noreferrer" className={S.LINK_BUTTON} onClick={(e) => e.stopPropagation()}>
                  {text.SHORT}
                </a>
              )}
            </div>
            {v.error && <p className={S.HINT_ERROR}>{v.error}</p>}
            {(v.outputUrl || v.status === "error") && !studio.running && (
              <div className={B.ROW_ACTIONS}>
                {v.outputUrl && (
                  <Button variant="unstyled" className={S.LINK_BUTTON} onClick={() => job && void studio.saveVideo(job.id, v.index)}>
                    <Download className={S.ICON} />
                    <span>{text.SAVE}</span>
                  </Button>
                )}
                <Button variant="unstyled" className={S.LINK_BUTTON} onClick={() => void studio.rerun(v.status === "error" && v.stage ? v.stage : "voice", v.index)}>
                  <RotateCcw className={S.ICON} />
                  <span>{text.RETRY}</span>
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
      <StudioDeleteConfirm request={confirmDel.request} onClose={confirmDel.close} lang={studio.lang} />
    </StudioCard>
  );
};
