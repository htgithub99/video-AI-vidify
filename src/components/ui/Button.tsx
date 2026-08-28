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

export const Button: React.FC<IBaseButtonProps> = ({ children, variant = "primary", size = "md", isLoading, className = "", disabled, ...props }) => {
  const baseStyles = "inline-flex items-center gap-2 justify-center font-semibold transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-rose-500/40 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 disabled:hover:scale-100 cursor-pointer shadow-sm relative overflow-hidden select-none";

  const sizes = {
    xs: "px-2.5 py-1 text-[10px] rounded-lg tracking-wide",
    sm: "px-3 py-1.5 text-[11px] rounded-xl tracking-wide",
    md: "px-4 py-2 text-xs rounded-xl tracking-wide",
    lg: "px-5 py-2.5 text-sm rounded-xl font-bold",
  };

  const variants = {
    primary: "bg-gradient-to-r from-rose-500 via-rose-600 to-rose-700 hover:from-rose-450 hover:via-rose-500 hover:to-rose-600 active:from-rose-700 active:to-rose-800 text-white border border-rose-450/30 shadow-md shadow-rose-600/20 hover:shadow-rose-600/35 hover:-translate-y-0.5",
    secondary: "bg-slate-850/90 hover:bg-slate-800 active:bg-slate-900 text-slate-100 border border-slate-750/80 hover:border-slate-650 shadow-sm backdrop-blur-sm hover:-translate-y-0.5",
    danger: "bg-red-500/15 hover:bg-red-500/25 active:bg-red-500/35 text-red-400 hover:text-red-300 border border-red-500/30 hover:border-red-500/50 shadow-sm",
    ghost: "bg-transparent hover:bg-slate-800/60 active:bg-slate-800 text-slate-400 hover:text-slate-100 border border-transparent shadow-none",
    outline: "bg-slate-900/60 hover:bg-slate-850 active:bg-slate-900 border border-slate-750 hover:border-slate-600 text-slate-200 hover:text-white backdrop-blur-sm hover:-translate-y-0.5",
    unstyled: "",
  };

  const sizeStyles = variant === "unstyled" ? "" : sizes[size] || sizes.md;
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
      className={cn(
        finalBaseStyles,
        sizeStyles,
        variantStyles,
        {
          "button-skeleton-loading opacity-90 cursor-wait active:scale-100": Boolean(isLoading),
        },
        className,
      )}
      disabled={disabled || isLoading}
      title={computedTitle}
      {...props}>
      {isLoading ? (
        <span className={cn("inline-flex items-center gap-2 justify-center w-full [&_svg:not(.app-loading-spinner)]:hidden [&_img]:hidden relative z-10")}>
          <span className={cn("w-3.5 h-3.5 rounded-full border-2 border-current/30 border-t-current animate-spin shrink-0 app-loading-spinner inline-block")} />
          <span className={cn("truncate opacity-80 animate-pulse")}>{children}</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
};
