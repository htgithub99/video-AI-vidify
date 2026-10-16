import { STUDIO_BUTTON_PATTERNS as P, STUDIO_UI } from "../constants/studioTheme.js";
import type { ButtonVariant } from "../types.js";
export const studioButtonVariant = (variant: ButtonVariant, className: string): ButtonVariant | typeof STUDIO_UI.ACCENT => {
  if (variant !== STUDIO_UI.UNSTYLED) return variant;
  if (P.DANGER.test(className) || P.DANGER_GRADIENT.test(className)) return STUDIO_UI.DANGER;
  if (P.PRIMARY.test(className)) return STUDIO_UI.PRIMARY;
  if (P.ACCENT.test(className)) return STUDIO_UI.ACCENT;
  return P.SECONDARY.test(className) ? STUDIO_UI.SECONDARY : variant;
};
