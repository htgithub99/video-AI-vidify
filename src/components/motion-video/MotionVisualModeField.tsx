import type { FC, ReactNode } from "react";
import { Clapperboard, Library } from "lucide-react";
import { MOTION_VISUAL as V } from "../../constants/motionVisual.js";
import { MOTION_STYLES as S } from "../../constants/motionStyles.js";
import { PUPPET_STYLE_DEFAULT } from "../../constants/motionPuppet.js";
import type { MotionRemotionProfile, MotionVisualSettings } from "../../types/motionVisual.js";
import { MotionToggle } from "./MotionToggle.js";
export const MotionVisualModeField: FC<{ value: MotionVisualSettings; packId?: string; profileId?: MotionRemotionProfile; language: string; disabled?: boolean; libraryField?: ReactNode; onChange: (value: MotionVisualSettings) => void }> = ({ value, packId, profileId, language, disabled, libraryField, onChange }) => {
  const lang = language === "en" ? "en" : "vi";
  const text = V.TEXT[lang];
  return (
    <fieldset disabled={disabled} aria-label={text.title} className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 items-end col-span-full min-w-0">
      <div className={S.STEP1_TOGGLE_WRAPPER}>
        <span className={S.TEXT_10PX_FONT_MONO_FONT_BOLD_TEXT_SLATE_400_UPPERCASE}>{text.title}</span>
        <MotionToggle
          checked={value.mode === "remotion"}
          label={text.title}
          text={text[value.mode]}
          title={value.mode === "library" ? text.libraryHint : text.remotionHint}
          icon={value.mode === "library" ? Library : Clapperboard}
          disabled={disabled}
          onClick={() => onChange(value.mode === "remotion" ? { version: 1, mode: "library", engine: "canvas", packId: packId || PUPPET_STYLE_DEFAULT, pacing: value.pacing } : { version: 1, mode: "remotion", engine: "remotion", profileId: profileId || "history", componentRevision: V.COMPONENT_REVISION, pacing: value.pacing })}
        />
      </div>
      {value.mode === "library" ? (
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
