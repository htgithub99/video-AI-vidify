import { cn } from "../../lib/utils";
import React, { useState } from "react";
import { ITooltipProps } from "../../types";

export const Tooltip: React.FC<ITooltipProps & { align?: 'start' | 'center' | 'end' }> = ({ content, children, position = "top", align = "center" }) => {
  const [isVisible, setIsVisible] = useState(false);

  const getPositionClass = () => {
    if (position === "top") {
      if (align === "start") return "bottom-full left-0 mb-2";
      if (align === "end") return "bottom-full right-0 mb-2";
      return "bottom-full left-1/2 -translate-x-1/2 mb-2";
    }
    if (position === "bottom") {
      if (align === "start") return "top-full left-0 mt-2";
      if (align === "end") return "top-full right-0 mt-2";
      return "top-full left-1/2 -translate-x-1/2 mt-2";
    }
    if (position === "left") return "right-full top-1/2 -translate-y-1/2 mr-2";
    if (position === "right") return "left-full top-1/2 -translate-y-1/2 ml-2";
    return "";
  };

  return (
    <div className={cn("relative flex items-center justify-center group", isVisible ? "z-[100000]" : "")} onMouseEnter={() => setIsVisible(true)} onMouseLeave={() => setIsVisible(false)}>
      {children}
      {isVisible && (
        <div className={cn("absolute z-[100000] px-3 py-2 text-xs font-medium text-slate-100 bg-slate-800 rounded-xl shadow-lg pointer-events-none animate-in fade-in zoom-in duration-200 w-max max-w-xs text-center leading-relaxed", getPositionClass())}>
          {content}
          <div
            className={cn("absolute w-2.5 h-2.5 bg-slate-800 rotate-45 transform top-[calc(100%-4px)]", 
              position === "top" || position === "bottom" 
                ? (align === 'start' ? 'left-4' : align === 'end' ? 'right-4' : 'left-1/2 -translate-x-1/2') 
                : ""
            )}
            style={
              position === "top"
                ? { bottom: "-4px", top: "auto" }
                : position === "bottom"
                  ? { top: "-4px" }
                  : position === "left"
                    ? {
                        right: "-4px",
                        left: "auto",
                        top: "50%",
                        transform: "translateY(-50%) rotate(45deg)",
                      }
                    : {
                        left: "-4px",
                        top: "50%",
                        transform: "translateY(-50%) rotate(45deg)",
                      }
            }
          />
        </div>
      )}
    </div>
  );
};
