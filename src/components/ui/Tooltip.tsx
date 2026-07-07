import React, { useState } from "react";
import { ITooltipProps } from "../../types";

export const Tooltip: React.FC<ITooltipProps> = ({ content, children, position = "top" }) => {
  const [isVisible, setIsVisible] = useState(false);

  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  return (
    <div className="relative flex items-center justify-center group" onMouseEnter={() => setIsVisible(true)} onMouseLeave={() => setIsVisible(false)}>
      {children}
      {isVisible && (
        <div className={`absolute z-[100000] px-3 py-2 text-xs font-medium text-slate-100 bg-slate-800 rounded-xl shadow-lg pointer-events-none animate-in fade-in zoom-in duration-200 w-max max-w-xs text-center leading-relaxed ${positionClasses[position]}`}>
          {content}
          <div
            className="absolute w-2.5 h-2.5 bg-slate-800 rotate-45 transform 
 top-[calc(100%-4px)] left-1/2 -translate-x-1/2"
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
