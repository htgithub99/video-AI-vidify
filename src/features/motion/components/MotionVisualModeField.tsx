import { RUNTIME_TEXT as RT_SHARED } from "../../../constants/runtime/shared.js";
import { RUNTIME_TEXT as RT_MOTION } from "../constants/runtimeText.js";
import type { FC } from "react";
import { Clapperboard, PersonStanding } from "lucide-react";
import { MOTION_VISUAL as V } from "../../../constants/motionVisual.js";
import { MOTION_STYLES as S } from "../constants/motionStyles.js";
import type { MotionRemotionProfile, MotionVisualSettings } from "../../../types/motionVisual.js";
import { MotionToggle } from "./MotionToggle.js";
export const MotionVisualModeField: FC<{ value: MotionVisualSettings; language: string; disabled?: boolean; onChange: (value: MotionVisualSettings) => void }> = ({ value, language, disabled, onChange }) => {
  const lang = language === RT_SHARED.EN ? RT_SHARED.EN : RT_SHARED.VI;
  const text = V.TEXT[lang];
  const kit = value.figureKit === true;
  return (
    <fieldset disabled={disabled} aria-label={text.title} className={RT_MOTION.GRID_GRID_COLS_1_SM_GRID_COLS_2_GAP_2}>
      <div className={S.STEP1_TOGGLE_WRAPPER}>
        <span className={S.TEXT_10PX_FONT_MONO_FONT_BOLD_TEXT_SLATE_400_UPPERCASE}>{text.title}</span>
        <MotionToggle
          checked={kit}
          label={text.title}
          text={kit ? text.kit : text.remotion}
          title={kit ? text.kitHint : text.remotionHint}
          icon={kit ? PersonStanding : Clapperboard}
          disabled={disabled}
          onClick={() => onChange({ ...value, figureKit: kit ? undefined : true })}
        />
      </div>
      <label className={S.STEP1_TOGGLE_WRAPPER}>
        <span className={S.TEXT_10PX_FONT_MONO_FONT_BOLD_TEXT_SLATE_400_UPPERCASE}>{text.profile}</span>
        <select aria-label={text.profile} value={value.profileId} onChange={(event) => onChange({ ...value, profileId: event.target.value as MotionRemotionProfile })} className={S.VISUAL_MODE_SELECT}>
          {Object.entries(V.PROFILES).map(([id, profile]) => (
            <option key={id} value={id}>
              {profile[lang]}
            </option>
          ))}
        </select>
      </label>
    </fieldset>
  );
};
