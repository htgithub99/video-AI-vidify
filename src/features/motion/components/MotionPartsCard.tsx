import { FC } from "react";
import _ from "lodash";
import { Layers, SkipForward } from "lucide-react";
import { StudioCard } from "../../../components/ui/Studio.js";
import { ActionBtn, StepHeader } from "./MotionControls.js";
import { MOTION_PARTS, MOTION_PARTS_STYLES as S, MOTION_PARTS_TEXT } from "../../../constants/motionParts.js";
import { cn } from "../../../lib/utils";
import { motionPartMinutes } from "../../../lib/motionParts.js";
import type { MotionSeriesState } from "../../../types/motionVideo.js";
import type { MotionVideoTexts } from "../../../constants/motionVideoTexts.js";
export const MotionPartsCard: FC<{ series: MotionSeriesState; text: MotionVideoTexts; lang: string; busy: boolean; ready: boolean; className?: string; onContinue: () => void }> = ({ series, text, lang, busy, ready, className, onContinue }) => {
  const T = lang === MOTION_PARTS.EN ? MOTION_PARTS_TEXT.en : MOTION_PARTS_TEXT.vi;
  const count = series.parts.length;
  const next = series.index + 1;
  return (
    <StudioCard className={className}>
      <StepHeader n={T.LABEL(series.index + 1, count)} icon={Layers} title={text.PARTS_TITLE} badge={S.BADGE(series.done.length, count)} />
      <div className={S.LIST}>
        {_.map(series.parts, (part) => {
          const record = _.find(series.done, { index: part.index });
          const current = part.index === series.index;
          return (
            <div key={part.index} className={cn(S.ROW, current && S.ROW_ACTIVE)}>
              <div className={S.TEXT_BLOCK}>
                <p className={S.NAME}>{record?.title || T.LABEL(part.index + 1, count)}</p>
                <p className={S.INFO}>{T.INFO(part.chapterIds.length, motionPartMinutes(part.seconds, 1))}</p>
              </div>
              {record?.videoUrl ? (
                <a href={record.videoUrl} target={MOTION_PARTS.LINK_TARGET} rel={MOTION_PARTS.LINK_REL} className={S.LINK}>
                  {text.PART_WATCH}
                </a>
              ) : (
                <span className={cn(S.STATUS, record ? S.STATUS_DONE : current ? S.STATUS_CURRENT : S.STATUS_PENDING)}>{record ? text.PART_DONE : current ? text.PART_CURRENT : text.PART_PENDING}</span>
              )}
            </div>
          );
        })}
      </div>
      <p className={S.HINT}>{text.PARTS_HINT}</p>
      {next < count && (
        <ActionBtn icon={SkipForward} onClick={onContinue} disabled={busy || !ready}>
          {T.CONTINUE(next + 1)}
        </ActionBtn>
      )}
    </StudioCard>
  );
};
