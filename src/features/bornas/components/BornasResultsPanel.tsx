import type { FC } from "react";
import { FolderOpen, Trash2 } from "lucide-react";
import { Button } from "../../../components/ui/Button.js";
import { StudioCard } from "../../../components/ui/Studio.js";
import { cn } from "../../../lib/utils.js";
import { reupClock } from "../../reup/components/ReupControls.js";
import { REUP_STYLES as S } from "../../reup/constants/reupStyles.js";
import { BORNAS_STYLES as B } from "../constants/bornasStyles.js";
import type { BornasStudio } from "../hooks/useBornasStudio.js";
export const BornasResultsPanel: FC<{ studio: BornasStudio; onOpen: () => void }> = ({ studio, onOpen }) => {
  const { text, results } = studio;
  if (!results.length) return <p className={S.HINT}>{text.RESULTS_EMPTY}</p>;
  return (
    <div className={S.PAGE}>
      {results.map((run) => (
        <StudioCard key={run.id} className={B.RESULT}>
          <div className={B.RESULT_HEAD}>
            <span className={B.RESULT_TITLE}>
              {run.channelName} · {new Date(run.updatedAt).toLocaleString()} · {text.JOB_STATES[run.status]}
            </span>
            <div className={B.ROW_ACTIONS}>
              <Button
                variant="unstyled"
                className={S.LINK_BUTTON}
                onClick={() => {
                  void studio.openJob(run.id);
                  onOpen();
                }}
              >
                <FolderOpen className={S.ICON} />
                <span>{text.OPEN}</span>
              </Button>
              <Button variant="unstyled" className={cn(S.LINK_BUTTON)} disabled={run.status === "running"} onClick={() => window.confirm(text.RESULTS_DELETE_CONFIRM) && void studio.deleteResults([run.id])}>
                <Trash2 className={S.ICON} />
                <span>{text.RESULTS_DELETE}</span>
              </Button>
            </div>
          </div>
          <div className={B.RESULT_GRID}>
            {run.videos.map((v) => (
              <div key={v.index} className={B.RESULT_CARD}>
                {v.previewUrl ? <video className={B.PLAYER} src={v.previewUrl} controls preload="metadata" /> : v.sheetUrl ? <img className={B.SHEET_IMG} src={v.sheetUrl} alt={text.SHEET} /> : null}
                <p className={B.VIDEO_TITLE}>{v.title}</p>
                <p className={B.VIDEO_META}>
                  {text.VIDEO_STATES[v.status]}
                  {v.seconds ? ` · ${reupClock(v.seconds)}` : ""}
                </p>
                {v.outputUrl && (
                  <Button variant="unstyled" className={S.LINK_BUTTON} onClick={() => void studio.saveVideo(run.id, v.index)}>
                    {text.SAVE}
                  </Button>
                )}
              </div>
            ))}
          </div>
        </StudioCard>
      ))}
    </div>
  );
};
