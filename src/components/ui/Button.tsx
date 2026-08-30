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
  const baseStyles =
    "inline-flex items-center gap-2 justify-center font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500/40 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm relative overflow-hidden select-none";

  const sizes = {
    xs: "px-3 h-10 min-h-[40px] max-h-[40px] text-xs rounded-xl tracking-wide",
    sm: "px-3.5 h-10 min-h-[40px] max-h-[40px] text-xs rounded-xl tracking-wide",
    md: "px-4 h-10 min-h-[40px] max-h-[40px] text-xs rounded-xl tracking-wide",
    lg: "px-5 h-12 min-h-[48px] max-h-[48px] text-sm rounded-xl font-bold",
  };

  const variants = {
    primary:
      "bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500 hover:from-rose-500 hover:to-amber-400 active:from-rose-700 active:to-amber-600 text-white border border-rose-450/40 shadow-md shadow-rose-600/20",
    secondary: "bg-slate-800 hover:bg-slate-750 active:bg-slate-850 text-slate-100 border border-slate-700 hover:border-slate-600 shadow-sm backdrop-blur-sm",
    success:
      "bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 active:from-emerald-700 active:to-teal-600 text-white border border-emerald-400/40 shadow-md shadow-emerald-600/20",
    info: "bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 active:from-blue-700 active:to-cyan-600 text-white border border-blue-400/40 shadow-md shadow-blue-600/20",
    purple:
      "bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 active:from-purple-700 active:to-pink-600 text-white border border-purple-400/40 shadow-md shadow-purple-600/20",
    amber:
      "bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-400 active:from-amber-700 active:to-orange-600 text-white border border-amber-400/40 shadow-md shadow-amber-600/20",
    danger: "bg-red-500/15 hover:bg-red-500/25 active:bg-red-500/35 text-red-400 hover:text-red-300 border border-red-500/30 hover:border-red-500/50 shadow-sm",
    ghost: "bg-transparent hover:bg-slate-800/60 active:bg-slate-800 text-slate-400 hover:text-slate-100 border border-transparent shadow-none",
    outline: "bg-slate-900/60 hover:bg-slate-850 active:bg-slate-900 border border-slate-750 hover:border-slate-650 text-slate-200 hover:text-white backdrop-blur-sm",
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
