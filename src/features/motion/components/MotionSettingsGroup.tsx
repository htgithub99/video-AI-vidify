import type { ReactNode } from "react";
import { MOTION_STYLES as S } from "../constants/motionStyles.js";
export const MotionSettingsGroup = ({ title, hint, children }: { title: string; hint?: ReactNode; children: ReactNode }) => (
  <fieldset className={S.SETTINGS_GROUP}>
    <legend className={S.SETTINGS_GROUP_TITLE}>
      <span className={S.SETTINGS_GROUP_LABEL}>
        {title}
        {hint}
      </span>
    </legend>
    <div className={S.STEP1_SETTINGS_ROW}>{children}</div>
  </fieldset>
);
