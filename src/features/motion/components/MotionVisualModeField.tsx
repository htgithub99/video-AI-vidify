import { RUNTIME_TEXT as RT_SHARED } from "../../../constants/runtime/shared.js";
import { RUNTIME_TEXT as RT_MOTION } from "../constants/runtimeText.js";
import type { FC } from "react";
import { MOTION_VISUAL as V } from "../../../constants/motionVisual.js";
import { MOTION_STYLES as S } from "../constants/motionStyles.js";
import type { MotionRemotionProfile, MotionVisualSettings } from "../../../types/motionVisual.js";
import { MotionVisualPicker } from "./MotionVisualPicker.js";
import { MOTION_LAYOUTS as L, MOTION_LAYOUT_DEFAULT, MOTION_LAYOUT_TEXT } from "../../../constants/motionLayouts/index.js";
import { motionIsLayout } from "../../../lib/motionLayout.js";
import { MOTION_MOVEMENT_OPTIONS, MOTION_MOVEMENT_TEXT } from "../../../constants/motionMovements.js";
import { motionDrawStyle, motionIsMovement, motionMovementOf } from "../../../lib/motionDrawStyle.js";
export const MotionVisualModeField: FC<{ value: MotionVisualSettings; language: string; disabled?: boolean; onChange: (value: MotionVisualSettings) => void }> = ({ value, language, disabled, onChange }) => {
  const lang = language === RT_SHARED.EN ? RT_SHARED.EN : RT_SHARED.VI;
  const text = V.TEXT[lang];
  const layoutTitle = MOTION_LAYOUT_TEXT[lang].title;
  const styles = Object.entries(V.PROFILES).map(([id, p]) => ({ id, name: p[lang], hint: p.hint[lang], preview: p.preview }));
  const movementTitle = MOTION_MOVEMENT_TEXT[lang].title;
  const movements = Object.entries(MOTION_MOVEMENT_OPTIONS).map(([id, m]) => ({ id, name: m.label[lang], hint: m.hint[lang], preview: m.preview }));
  const ownMovement = motionDrawStyle(value.profileId).movement || "smooth";
  const layouts = Object.entries(L).map(([id, l]) => ({ id, name: l.label[lang], hint: l.hint[lang], preview: l.preview }));
  return (
    <fieldset disabled={disabled} aria-label={text.title} className={RT_MOTION.GRID_VISUAL_ROW}>
      <div className={S.STEP1_TOGGLE_WRAPPER}>
        <span className={S.TEXT_10PX_FONT_MONO_FONT_BOLD_TEXT_SLATE_400_UPPERCASE}>{text.profile}</span>
        <MotionVisualPicker label={text.profile} value={value.profileId} options={styles} disabled={disabled} onChange={(id) => onChange({ ...value, profileId: id as MotionRemotionProfile, proportion: undefined })} />
      </div>
      <div className={S.STEP1_TOGGLE_WRAPPER}>
        <span className={S.TEXT_10PX_FONT_MONO_FONT_BOLD_TEXT_SLATE_400_UPPERCASE}>{layoutTitle}</span>
        <MotionVisualPicker label={layoutTitle} value={value.layout || MOTION_LAYOUT_DEFAULT} options={layouts} disabled={disabled} onChange={(id) => onChange({ ...value, layout: motionIsLayout(id) && id !== MOTION_LAYOUT_DEFAULT ? id : undefined })} />
      </div>
      <div className={S.STEP1_TOGGLE_WRAPPER}>
        <span className={S.TEXT_10PX_FONT_MONO_FONT_BOLD_TEXT_SLATE_400_UPPERCASE}>{movementTitle}</span>
        <MotionVisualPicker label={movementTitle} value={motionMovementOf(value)} options={movements} disabled={disabled} onChange={(id) => onChange({ ...value, movement: motionIsMovement(id) && id !== ownMovement ? id : undefined })} />
      </div>
    </fieldset>
  );
};
