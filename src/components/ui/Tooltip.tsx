import { cn } from "../../lib/utils";
import React, { useState, useRef, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import _ from "lodash";
import { ITooltipProps } from "../../types";

const TOOLTIP_CONFIG = { GAP: 10, Z_INDEX: 999999, POS_TOP: "top", POS_BOTTOM: "bottom", POS_LEFT: "left", POS_RIGHT: "right", ALIGN_START: "start", ALIGN_END: "end" } as const;

export const Tooltip: React.FC<ITooltipProps & { align?: "start" | "center" | "end"; className?: string }> = ({
  content,
  children,
  position = TOOLTIP_CONFIG.POS_TOP,
  align = "center",
  className,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);

  const updatePosition = () => {
    const triggerEl = triggerRef.current;
    if (_.isNil(triggerEl)) return;

    const rect = triggerEl.getBoundingClientRect();
    const gap = TOOLTIP_CONFIG.GAP;

    let top = 0;
    let left = 0;

    if (_.isEqual(position, TOOLTIP_CONFIG.POS_TOP)) {
      top = rect.top - gap;
      if (_.isEqual(align, TOOLTIP_CONFIG.ALIGN_START)) left = rect.left;
      else if (_.isEqual(align, TOOLTIP_CONFIG.ALIGN_END)) left = rect.right;
      else left = rect.left + rect.width / 2;
    } else if (_.isEqual(position, TOOLTIP_CONFIG.POS_BOTTOM)) {
      top = rect.bottom + gap;
      if (_.isEqual(align, TOOLTIP_CONFIG.ALIGN_START)) left = rect.left;
      else if (_.isEqual(align, TOOLTIP_CONFIG.ALIGN_END)) left = rect.right;
      else left = rect.left + rect.width / 2;
    } else if (_.isEqual(position, TOOLTIP_CONFIG.POS_LEFT)) {
      top = rect.top + rect.height / 2;
      left = rect.left - gap;
    } else if (_.isEqual(position, TOOLTIP_CONFIG.POS_RIGHT)) {
      top = rect.top + rect.height / 2;
      left = rect.right + gap;
    }

    setCoords({ top, left });
  };

  useLayoutEffect(() => {
    if (isVisible) {
      updatePosition();
      window.addEventListener("scroll", updatePosition, true);
      window.addEventListener("resize", updatePosition);
      return () => {
        window.removeEventListener("scroll", updatePosition, true);
        window.removeEventListener("resize", updatePosition);
      };
    }
  }, [isVisible, position, align]);

  const getTransformStyle = (): React.CSSProperties => {
    let transform = "";
    if (_.isEqual(position, TOOLTIP_CONFIG.POS_TOP)) {
      transform = _.isEqual(align, TOOLTIP_CONFIG.ALIGN_START)
        ? "translateY(-100%)"
        : _.isEqual(align, TOOLTIP_CONFIG.ALIGN_END)
          ? "translate(-100%, -100%)"
          : "translate(-50%, -100%)";
    } else if (_.isEqual(position, TOOLTIP_CONFIG.POS_BOTTOM)) {
      transform = _.isEqual(align, TOOLTIP_CONFIG.ALIGN_START) ? "none" : _.isEqual(align, TOOLTIP_CONFIG.ALIGN_END) ? "translateX(-100%)" : "translateX(-50%)";
    } else if (_.isEqual(position, TOOLTIP_CONFIG.POS_LEFT)) {
      transform = "translate(-100%, -50%)";
    } else if (_.isEqual(position, TOOLTIP_CONFIG.POS_RIGHT)) {
      transform = "translateY(-50%)";
    }

    return {
      position: "fixed",
      top: `${coords.top}px`,
      left: `${coords.left}px`,
      transform,
      zIndex: TOOLTIP_CONFIG.Z_INDEX,
    };
  };

  const isVertical = _.includes([TOOLTIP_CONFIG.POS_TOP, TOOLTIP_CONFIG.POS_BOTTOM], position);
  const isHorizontal = _.includes([TOOLTIP_CONFIG.POS_LEFT, TOOLTIP_CONFIG.POS_RIGHT], position);

  return (
    <div
      ref={triggerRef}
      className={cn("relative inline-flex items-center justify-center group", className)}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}>
      {children}
      {isVisible &&
        !_.isEmpty(content) &&
        createPortal(
          <div
            style={getTransformStyle()}
            className={cn(
              "px-3 py-2 text-xs font-medium text-slate-100 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl pointer-events-none w-max max-w-xs text-center leading-relaxed",
            )}>
            {content}
            <div
              className={cn(
                "absolute w-2.5 h-2.5 bg-slate-900 border border-slate-700/80 rotate-45 transform",
                _.isEqual(position, TOOLTIP_CONFIG.POS_TOP)
                  ? "bottom-[-5px] border-t-0 border-l-0"
                  : _.isEqual(position, TOOLTIP_CONFIG.POS_BOTTOM)
                    ? "top-[-5px] border-b-0 border-r-0"
                    : _.isEqual(position, TOOLTIP_CONFIG.POS_LEFT)
                      ? "right-[-5px] border-b-0 border-l-0"
                      : "left-[-5px] border-t-0 border-r-0",
                isVertical && (_.isEqual(align, TOOLTIP_CONFIG.ALIGN_START) ? "left-4" : _.isEqual(align, TOOLTIP_CONFIG.ALIGN_END) ? "right-4" : "left-1/2 -translate-x-1/2"),
                isHorizontal && "top-1/2 -translate-y-1/2",
              )}
            />
          </div>,
          document.body,
        )}
    </div>
  );
};
