import { SOURCE_TEXT_MD, SOURCE_TEXT_PRIMARY, SOURCE_TEXT_UNSTYLED } from "../../constants/sourceText";
import { cn } from "../../lib/utils";
import React from "react";
import { IBaseButtonProps } from "../../types";
import { BUTTON_CLASS_NAME, BUTTON_SIZE_CLASS_NAME, BUTTON_TOOLTIP_PREFIX, BUTTON_VARIANT_CLASS_NAME, DETECTOR_VIETNAMESE_REGEX } from "../../constants";
import _ from "lodash";
import { Sparkles } from "lucide-react";
const getChildrenText = (node: React.ReactNode): string => {
  if (_.isNil(node)) return "";
  if (typeof node === "string" || typeof node === "number") return _.toString(node);
  if (_.isArray(node)) return _.trim(_.join(_.map(node, getChildrenText), " "));
  if (React.isValidElement(node)) {
    return getChildrenText(node.props.children);
  }
  return "";
};
export const Button: React.FC<IBaseButtonProps> = ({ children, variant = SOURCE_TEXT_PRIMARY, size = SOURCE_TEXT_MD, isLoading, className = "", disabled, ...props }) => {
  const sizeStyles = variant === SOURCE_TEXT_UNSTYLED ? "" : BUTTON_SIZE_CLASS_NAME[size];
  const variantStyles = _.defaultTo(BUTTON_VARIANT_CLASS_NAME[variant], BUTTON_VARIANT_CLASS_NAME.primary);
  const finalBaseStyles = variant === SOURCE_TEXT_UNSTYLED ? "" : BUTTON_CLASS_NAME.BASE;
  const cleanText = getChildrenText(children).trim();
  let computedTitle = props.title;
  if (!computedTitle && cleanText) {
    if (DETECTOR_VIETNAMESE_REGEX.test(cleanText)) {
      computedTitle = `${BUTTON_TOOLTIP_PREFIX.VI}${cleanText}`;
    } else {
      computedTitle = `${BUTTON_TOOLTIP_PREFIX.EN}${cleanText}`;
    }
  }
  return (
    <button
      className={cn(finalBaseStyles, sizeStyles, variantStyles, className, {
        [BUTTON_CLASS_NAME.LOADING]: Boolean(isLoading),
      })}
      disabled={disabled || isLoading}
      title={computedTitle}
      {...props}>
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
