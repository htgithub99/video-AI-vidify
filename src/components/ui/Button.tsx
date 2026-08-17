import { cn } from "../../lib/utils";
import React from "react";
import { IBaseButtonProps } from "../../types";
import { BUTTON_TOOLTIP_PREFIX, DETECTOR_VIETNAMESE_REGEX } from "../../constants";
import _ from "lodash";

const getChildrenText = (node: React.ReactNode): string => {
  if (_.isNil(node)) return "";
  if (typeof node === "string" || typeof node === "number") return _.toString(node);
  if (_.isArray(node)) return _.trim(_.join(_.map(node, getChildrenText), " "));
  if (React.isValidElement(node)) {
    return getChildrenText(node.props.children);
  }
  return "";
};

export const Button: React.FC<IBaseButtonProps> = ({ 
  children, 
  variant = "primary", 
  size = "md", 
  isLoading, 
  className = "", 
  disabled, 
  ...props 
}) => {
  const baseStyles = "inline-flex items-center gap-2 justify-center font-semibold transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-rose-500/40 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 disabled:hover:scale-100 cursor-pointer shadow-sm relative overflow-hidden";

  const sizes = {
    xs: "px-2.5 py-1 text-[10px] rounded-lg",
    sm: "px-3 py-1.5 text-[11px] rounded-lg",
    md: "px-4 py-2 text-xs rounded-xl",
    lg: "px-5 py-3 text-xs rounded-xl",
  };

  const variants = {
    primary: "bg-gradient-to-b from-rose-500 to-rose-600 hover:from-rose-450 hover:to-rose-550 active:from-rose-600 active:to-rose-700 text-white border border-rose-400/20 shadow-md shadow-rose-500/10 hover:shadow-rose-500/25",
    secondary: "bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-100 border border-slate-700/60 hover:border-slate-600 shadow-sm",
    danger: "bg-red-500/10 hover:bg-red-500/20 active:bg-red-500/30 text-red-500 hover:text-red-400 border border-red-500/20 hover:border-red-500/30",
    ghost: "bg-slate-900 hover:bg-slate-800/80 text-slate-400 hover:text-slate-100 border border-transparent active:bg-slate-800 shadow-none",
    outline: "bg-slate-900 border border-slate-700 hover:border-slate-600 hover:bg-slate-850 hover:text-slate-100 text-slate-300 active:bg-slate-800/80 shadow-none",
    unstyled: "",
  };

  const sizeStyles = variant === "unstyled" ? "" : (sizes[size] || sizes.md);
  const variantStyles = _.defaultTo(variants[variant], variants.primary);
  const finalBaseStyles = variant === "unstyled" ? "" : baseStyles;

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
      className={cn(finalBaseStyles, sizeStyles, variantStyles, className)} 
      disabled={disabled || isLoading} 
      title={computedTitle}
      {...props}
    >
      {isLoading ? (
        <span className="inline-flex items-center gap-2 justify-center w-full [&_svg:not(.app-loading-spinner)]:hidden [&_img]:hidden">
          <span className="w-4 h-4 rounded-full border-2 border-current/30 border-t-current animate-spin shrink-0 app-loading-spinner inline-block" />
          <span className="truncate">{children}</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
};
