import { RUNTIME_TEXT as RT_SHARED } from "../../../constants/runtime/shared.js";
import { RUNTIME_TEXT as RT_MOTION } from "../constants/runtimeText.js";
import type { FC, ReactNode } from "react";
import { Clapperboard, Library } from "lucide-react";
import { MOTION_VISUAL as V } from "../../../constants/motionVisual.js";
import { MOTION_STYLES as S } from "../constants/motionStyles.js";
import { PUPPET_STYLE_DEFAULT } from "../../../constants/motionPuppet.js";
import type { MotionRemotionProfile, MotionVisualSettings } from "../../../types/motionVisual.js";
import { MotionToggle } from "./MotionToggle.js";
export const MotionVisualModeField: FC<{ value: MotionVisualSettings; packId?: string; profileId?: MotionRemotionProfile; language: string; disabled?: boolean; libraryField?: ReactNode; onChange: (value: MotionVisualSettings) => void }> = ({ value, packId, profileId, language, disabled, libraryField, onChange }) => {
  const lang = language === RT_SHARED.EN ? RT_SHARED.EN : RT_SHARED.VI;
  const text = V.TEXT[lang];
  return (
    <fieldset disabled={disabled} aria-label={text.title} className={RT_MOTION.GRID_GRID_COLS_1_SM_GRID_COLS_2_GAP_2}>
      <div className={S.STEP1_TOGGLE_WRAPPER}>
        <span className={S.TEXT_10PX_FONT_MONO_FONT_BOLD_TEXT_SLATE_400_UPPERCASE}>{text.title}</span>
        <MotionToggle
          checked={value.mode === RT_SHARED.REMOTION}
          label={text.title}
          text={text[value.mode]}
          title={value.mode === RT_SHARED.LIBRARY ? text.libraryHint : text.remotionHint}
          icon={value.mode === RT_SHARED.LIBRARY ? Library : Clapperboard}
          disabled={disabled}
          onClick={() => onChange(value.mode === RT_SHARED.REMOTION ? { version: 1, mode: RT_SHARED.LIBRARY, engine: RT_SHARED.CANVAS, packId: packId || PUPPET_STYLE_DEFAULT, pacing: value.pacing } : { version: 1, mode: RT_SHARED.REMOTION, engine: RT_SHARED.REMOTION, profileId: profileId || RT_SHARED.HISTORY, componentRevision: V.COMPONENT_REVISION, pacing: value.pacing })}
        />
      </div>
      {value.mode === RT_SHARED.LIBRARY ? (
        libraryField
      ) : (
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
      )}
    </fieldset>
  );
};
