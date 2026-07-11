import { cn } from "../../lib/utils";
import React from "react";
import { IBaseButtonProps } from "../../types";

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
  const variantStyles = variants[variant] ?? variants.primary;
  const finalBaseStyles = variant === "unstyled" ? "" : baseStyles;

  return (
    <button 
      className={cn(finalBaseStyles, sizeStyles, variantStyles, className)} 
      disabled={disabled || isLoading} 
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-1.5 justify-center">
          <svg className="animate-spin h-3.5 w-3.5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {children}
        </span>
      ) : (
        children
      )}
    </button>
  );
};
