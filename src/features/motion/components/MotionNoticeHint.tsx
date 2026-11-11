import type { FC } from "react";
import { AlertTriangle, Info } from "lucide-react";
import { cn } from "../../../lib/utils.js";
import { MOTION_STYLES as S } from "../constants/motionStyles.js";
import { MOTION_NOTICE_IDS } from "../constants/motionNotices.js";
export interface MotionNotice {
  id: string;
  tone: "warn" | "info";
  text: string;
  show: boolean;
}
export const MotionNoticeHint: FC<{ notices: MotionNotice[] }> = ({ notices }) => {
  const shown = notices.filter((notice) => notice.show);
  const warn = shown.some((notice) => notice.tone === MOTION_NOTICE_IDS.WARN);
  const Icon = warn ? AlertTriangle : Info;
  return (
    <span className={cn(S.HINT_WRAP, shown.length ? S.HINT_ON : S.HINT_OFF)} aria-hidden={!shown.length}>
      <button type="button" tabIndex={shown.length ? 0 : -1} aria-label={shown.map((notice) => notice.text).join(S.HINT_JOIN)} className={cn(S.HINT_BUTTON, warn ? S.HINT_BUTTON_WARN : S.HINT_BUTTON_INFO)}>
        <Icon className={S.HINT_ICON} />
      </button>
      <span role="tooltip" className={S.HINT_PANEL}>
        {shown.map((notice) => {
          const ItemIcon = notice.tone === MOTION_NOTICE_IDS.WARN ? AlertTriangle : Info;
          return (
            <span key={notice.id} className={S.HINT_ROW}>
              <ItemIcon className={cn(S.HINT_ROW_ICON, notice.tone === MOTION_NOTICE_IDS.WARN ? S.HINT_ROW_WARN : S.HINT_ROW_INFO)} />
              <span>{notice.text}</span>
            </span>
          );
        })}
      </span>
    </span>
  );
};
