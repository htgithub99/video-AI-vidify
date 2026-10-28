import { RUNTIME_TEXT as RT_SHARED } from "../constants/runtime/shared.js";
import { Children, isValidElement, type ReactNode } from "react";
import { STUDIO_BUTTON_PATTERNS as P, STUDIO_CONTROL_CONTENT as C, STUDIO_UI } from "../constants/studioTheme.js";
import type { ButtonVariant } from "../types.js";
export const studioButtonVariant = (variant: ButtonVariant, className: string): ButtonVariant | typeof STUDIO_UI.ACCENT => {
  if (variant !== STUDIO_UI.UNSTYLED) return variant;
  if (P.DANGER.test(className) || P.DANGER_GRADIENT.test(className)) return STUDIO_UI.DANGER;
  if (P.PRIMARY.test(className)) return STUDIO_UI.PRIMARY;
  if (P.ACCENT.test(className)) return STUDIO_UI.ACCENT;
  return P.SECONDARY.test(className) ? STUDIO_UI.SECONDARY : variant;
};
export const studioControlClassName = (className: string): string =>
  className
    .split(/\s+/)
    .filter((token) => !C.INTERACTION_APPEARANCE.test(token))
    .join(RT_SHARED.SYMBOL_36A9E7);
export const studioIconButtonClassName = (className: string): string =>
  className
    .split(/\s+/)
    .filter((token) => !C.ICON_APPEARANCE.test(token))
    .join(RT_SHARED.SYMBOL_36A9E7);
export const isStudioControlRole = (role: string | undefined): boolean => !!role && (C.ROLES as readonly string[]).includes(role);
export const isIconOnlyButton = (children: ReactNode): boolean => {
  let hasIcon = false,
    hasMedia = false,
    hasText = false;
  const visit = (nodes: ReactNode): void =>
    Children.forEach(nodes, (node) => {
      if (typeof node === "string" || typeof node === "number") {
        if (String(node).trim()) hasText = true;
        return;
      }
      if (!isValidElement<{ children?: ReactNode; className?: string }>(node) || C.HIDDEN_LABEL.test(node.props.className || STUDIO_UI.EMPTY)) return;
      if (typeof node.type === "string") {
        if (node.type === C.ICON_TAG) hasIcon = true;
        if ((C.MEDIA_TAGS as readonly string[]).includes(node.type)) hasMedia = true;
      } else {
        const component = node.type as { displayName?: string; name?: string };
        if (component.displayName || C.ICON_NAME.test(component.name || STUDIO_UI.EMPTY)) hasIcon = true;
      }
      visit(node.props.children);
    });
  visit(children);
  return hasIcon && !hasMedia && !hasText;
};
