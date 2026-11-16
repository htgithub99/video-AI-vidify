import { SOURCE_TEXT_MD, SOURCE_TEXT_PRIMARY, SOURCE_TEXT_UNSTYLED } from "../../constants/sourceText";
import { cn } from "../../lib/utils";
import { STUDIO_UI } from "../../constants/studioTheme.js";
import { isIconOnlyButton, isStudioControlRole, studioButtonVariant, studioControlClassName, studioIconButtonClassName } from "../../lib/studioTheme.js";
import React from "react";
import { IBaseButtonProps } from "../../types";
import { BUTTON_CLASS_NAME, BUTTON_SIZE_CLASS_NAME, BUTTON_VARIANT_CLASS_NAME } from "../../constants";
import _ from "lodash";
import { Sparkles } from "lucide-react";
export const Button: React.FC<IBaseButtonProps> = ({ children, variant = SOURCE_TEXT_PRIMARY, size = SOURCE_TEXT_MD, isLoading, className = "", disabled, ...props }) => {
  const isUnstyled = variant === SOURCE_TEXT_UNSTYLED;
  const sizeStyles = isUnstyled ? "" : BUTTON_SIZE_CLASS_NAME[size];
  const variantStyles = isUnstyled ? "" : _.defaultTo(BUTTON_VARIANT_CLASS_NAME[variant], BUTTON_VARIANT_CLASS_NAME.primary);
  const finalBaseStyles = isUnstyled ? "" : BUTTON_CLASS_NAME.BASE;
  const isControl = isStudioControlRole(props.role);
  const iconOnly = !isControl && isIconOnlyButton(children);
  const buttonClassName = cn(STUDIO_UI.BUTTON, finalBaseStyles, sizeStyles, variantStyles, className, { [BUTTON_CLASS_NAME.LOADING]: Boolean(isLoading) });
  return (
    <button data-variant={studioButtonVariant(variant, className)} data-icon-only={iconOnly || undefined} className={iconOnly ? studioIconButtonClassName(buttonClassName) : isControl ? studioControlClassName(buttonClassName) : buttonClassName} disabled={disabled || isLoading} {...props}>
      {isLoading ? (
        <span className={cn(BUTTON_CLASS_NAME.LOADING_CONTENT)}>
          <Sparkles className={cn(BUTTON_CLASS_NAME.LOADING_SPINNER)} />
          <span className={cn(BUTTON_CLASS_NAME.LOADING_TEXT)}>{children}</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
};
