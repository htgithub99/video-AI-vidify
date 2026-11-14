import { RUNTIME_TEXT as RT_SHARED } from "../../../constants/runtime/shared.js";
import { RUNTIME_TEXT as RT_MOTION } from "../constants/runtimeText.js";
import type { FC } from "react";
import { Clapperboard, PersonStanding } from "lucide-react";
import { MOTION_VISUAL as V } from "../../../constants/motionVisual.js";
import { MOTION_STYLES as S } from "../constants/motionStyles.js";
import type { MotionRemotionProfile, MotionVisualSettings } from "../../../types/motionVisual.js";
import { MotionToggle } from "./MotionToggle.js";
import { MotionVisualPicker } from "./MotionVisualPicker.js";
import { MOTION_LAYOUTS as L, MOTION_LAYOUT_DEFAULT, MOTION_LAYOUT_TEXT } from "../../../constants/motionLayouts/index.js";
import { motionIsLayout } from "../../../lib/motionLayout.js";
export const MotionVisualModeField: FC<{ value: MotionVisualSettings; language: string; disabled?: boolean; onChange: (value: MotionVisualSettings) => void }> = ({ value, language, disabled, onChange }) => {
  const lang = language === RT_SHARED.EN ? RT_SHARED.EN : RT_SHARED.VI;
  const text = V.TEXT[lang];
  const layoutTitle = MOTION_LAYOUT_TEXT[lang].title;
  const kit = value.figureKit === true;
  const styles = Object.entries(V.PROFILES).map(([id, p]) => ({ id, name: p[lang], hint: p.hint[lang], preview: p.preview }));
  const layouts = Object.entries(L).map(([id, l]) => ({ id, name: l.label[lang], hint: l.hint[lang], preview: l.preview }));
  return (
    <fieldset disabled={disabled} aria-label={text.title} className={RT_MOTION.GRID_VISUAL_ROW}>
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
      <div className={S.STEP1_TOGGLE_WRAPPER}>
        <span className={S.TEXT_10PX_FONT_MONO_FONT_BOLD_TEXT_SLATE_400_UPPERCASE}>{text.profile}</span>
        <MotionVisualPicker label={text.profile} value={value.profileId} options={styles} disabled={disabled} onChange={(id) => onChange({ ...value, profileId: id as MotionRemotionProfile, proportion: undefined })} />
      </div>
      <div className={S.STEP1_TOGGLE_WRAPPER}>
        <span className={S.TEXT_10PX_FONT_MONO_FONT_BOLD_TEXT_SLATE_400_UPPERCASE}>{layoutTitle}</span>
        <MotionVisualPicker label={layoutTitle} value={value.layout || MOTION_LAYOUT_DEFAULT} options={layouts} disabled={disabled} onChange={(id) => onChange({ ...value, layout: motionIsLayout(id) && id !== MOTION_LAYOUT_DEFAULT ? id : undefined })} />
      </div>
    </fieldset>
  );
};
