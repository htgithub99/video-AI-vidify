import type { FC } from "react";
import { ShieldAlert, ShieldCheck, ShieldQuestion } from "lucide-react";
import { cn } from "../../../lib/utils.js";
import { REUP_STYLES as S } from "../constants/reupStyles.js";
import type { ReupTexts } from "../constants/reupTexts.js";
import type { ReupReport as Report } from "../types/reup.js";
const ICON = { ok: ShieldCheck, review: ShieldQuestion, risk: ShieldAlert } as const;
export const ReupReport: FC<{ report: Report; text: ReupTexts }> = ({ report, text }) => {
  const Icon = ICON[report.level];
  return (
    <div className={S.REPORT}>
      <div className={S.REPORT_HEAD}>
        <Icon className={cn(S.ICON_SHRINK, S.REPORT_TONE[report.level])} />
        <span className={S.REPORT_TITLE}>{text.REPORT}</span>
        <span className={cn(S.REPORT_BADGE, S.REPORT_BADGE_TONE[report.level])}>{text.REPORT_LEVEL[report.level]}</span>
      </div>
      <ul className={S.REPORT_LIST}>
        {report.notes.map((note) => (
          <li key={note.code} className={cn(S.REPORT_NOTE, S.REPORT_TONE[note.level])}>
            {text.REPORT_NOTES[note.code]?.(note.value || "")}
          </li>
        ))}
      </ul>
    </div>
  );
};
