import { ScanSearch } from "lucide-react";
import { MOTION_STYLES as S } from "../constants/motionStyles.js";
import { MOTION_VIDEO_TEXTS } from "../../../constants/motionVideoTexts.js";
import type { Lang } from "../../../lib/lang.js";
import { MotionToggle } from "./MotionToggle.js";
export function MotionReviewToggle({ checked, disabled, onChange, currentLang }: { checked: boolean; disabled?: boolean; onChange: (checked: boolean) => void; currentLang: Lang }) {
  const text = MOTION_VIDEO_TEXTS[currentLang] || MOTION_VIDEO_TEXTS.vi;
  return (
    <div className={S.STEP1_TOGGLE_WRAPPER}>
      <span className={S.TEXT_10PX_FONT_MONO_FONT_BOLD_TEXT_SLATE_400_UPPERCASE}>{text.AI_REVIEW}</span>
      <MotionToggle checked={checked} label={text.AI_REVIEW} icon={ScanSearch} text={checked ? text.AI_REVIEW_ON : text.AI_REVIEW_OFF} title={text.AI_REVIEW_HINT} disabled={disabled} onClick={() => onChange(!checked)} />
    </div>
  );
}
