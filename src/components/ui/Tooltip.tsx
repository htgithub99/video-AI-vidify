import {
  SOURCE_TEMPLATE_PX,
  SOURCE_TEXT_BOTTOM,
  SOURCE_TEXT_CENTER,
  SOURCE_TEXT_END,
  SOURCE_TEXT_FIXED,
  SOURCE_TEXT_LEFT,
  SOURCE_TEXT_NONE,
  SOURCE_TEXT_RESIZE,
  SOURCE_TEXT_RIGHT,
  SOURCE_TEXT_SCROLL,
  SOURCE_TEXT_START,
  SOURCE_TEXT_TOP,
  SOURCE_TEXT_TRANSLATEX_100,
  SOURCE_TEXT_TRANSLATEX_50,
  SOURCE_TEXT_TRANSLATEY_100,
  SOURCE_TEXT_TRANSLATEY_50,
  SOURCE_TEXT_TRANSLATE_100_100,
  SOURCE_TEXT_TRANSLATE_100_50,
  SOURCE_TEXT_TRANSLATE_50_100,
} from "../../constants/sourceText";
import { cn } from "../../lib/utils";
import React, { useState, useRef, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import _ from "lodash";
import { ITooltipProps } from "../../types";
const TOOLTIP_CONFIG = { GAP: 10, Z_INDEX: 999999, POS_TOP: SOURCE_TEXT_TOP, POS_BOTTOM: SOURCE_TEXT_BOTTOM, POS_LEFT: SOURCE_TEXT_LEFT, POS_RIGHT: SOURCE_TEXT_RIGHT, ALIGN_START: SOURCE_TEXT_START, ALIGN_END: SOURCE_TEXT_END } as const;
export const Tooltip: React.FC<ITooltipProps & { align?: "start" | "center" | "end"; className?: string }> = ({ content, children, position = TOOLTIP_CONFIG.POS_TOP, align = SOURCE_TEXT_CENTER, className }) => {
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
      window.addEventListener(SOURCE_TEXT_SCROLL, updatePosition, true);
      window.addEventListener(SOURCE_TEXT_RESIZE, updatePosition);
      return () => {
        window.removeEventListener(SOURCE_TEXT_SCROLL, updatePosition, true);
        window.removeEventListener(SOURCE_TEXT_RESIZE, updatePosition);
      };
    }
  }, [isVisible, position, align]);
  const getTransformStyle = (): React.CSSProperties => {
    let transform = "";
    if (_.isEqual(position, TOOLTIP_CONFIG.POS_TOP)) {
      transform = _.isEqual(align, TOOLTIP_CONFIG.ALIGN_START) ? SOURCE_TEXT_TRANSLATEY_100 : _.isEqual(align, TOOLTIP_CONFIG.ALIGN_END) ? SOURCE_TEXT_TRANSLATE_100_100 : SOURCE_TEXT_TRANSLATE_50_100;
    } else if (_.isEqual(position, TOOLTIP_CONFIG.POS_BOTTOM)) {
      transform = _.isEqual(align, TOOLTIP_CONFIG.ALIGN_START) ? SOURCE_TEXT_NONE : _.isEqual(align, TOOLTIP_CONFIG.ALIGN_END) ? SOURCE_TEXT_TRANSLATEX_100 : SOURCE_TEXT_TRANSLATEX_50;
    } else if (_.isEqual(position, TOOLTIP_CONFIG.POS_LEFT)) {
      transform = SOURCE_TEXT_TRANSLATE_100_50;
    } else if (_.isEqual(position, TOOLTIP_CONFIG.POS_RIGHT)) {
      transform = SOURCE_TEXT_TRANSLATEY_50;
    }
    return {
      position: SOURCE_TEXT_FIXED,
      top: SOURCE_TEMPLATE_PX(`${coords.top}`),
      left: SOURCE_TEMPLATE_PX(`${coords.left}`),
      transform,
      zIndex: TOOLTIP_CONFIG.Z_INDEX,
    };
  };
  const isVertical = _.includes([TOOLTIP_CONFIG.POS_TOP, TOOLTIP_CONFIG.POS_BOTTOM], position);
  const isHorizontal = _.includes([TOOLTIP_CONFIG.POS_LEFT, TOOLTIP_CONFIG.POS_RIGHT], position);
  return (
    <div ref={triggerRef} className={cn("relative inline-flex items-center justify-center group", className)} onMouseEnter={() => setIsVisible(true)} onMouseLeave={() => setIsVisible(false)}>
      {children}
      {isVisible &&
        !_.isEmpty(content) &&
        createPortal(
          <div style={getTransformStyle()} className={cn("px-3 py-2 text-xs font-medium text-slate-100 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl pointer-events-none w-max max-w-xs text-center leading-relaxed")}>
            {content}
            <div
              className={cn("absolute w-2.5 h-2.5 bg-slate-900 border border-slate-700/80 rotate-45 transform", {
                "bottom-[-5px] border-t-0 border-l-0": _.isEqual(position, TOOLTIP_CONFIG.POS_TOP),
                "top-[-5px] border-b-0 border-r-0": !_.isEqual(position, TOOLTIP_CONFIG.POS_TOP) && _.isEqual(position, TOOLTIP_CONFIG.POS_BOTTOM),
                "right-[-5px] border-b-0 border-l-0": !_.isEqual(position, TOOLTIP_CONFIG.POS_TOP) && !_.isEqual(position, TOOLTIP_CONFIG.POS_BOTTOM) && _.isEqual(position, TOOLTIP_CONFIG.POS_LEFT),
                "left-[-5px] border-t-0 border-r-0": !_.isEqual(position, TOOLTIP_CONFIG.POS_TOP) && !_.isEqual(position, TOOLTIP_CONFIG.POS_BOTTOM) && !_.isEqual(position, TOOLTIP_CONFIG.POS_LEFT),
                "left-4": isVertical && _.isEqual(align, TOOLTIP_CONFIG.ALIGN_START),
                "right-4": isVertical && _.isEqual(align, TOOLTIP_CONFIG.ALIGN_END),
                "left-1/2 -translate-x-1/2": isVertical && !_.isEqual(align, TOOLTIP_CONFIG.ALIGN_START) && !_.isEqual(align, TOOLTIP_CONFIG.ALIGN_END),
                "top-1/2 -translate-y-1/2": isHorizontal,
              })}
            />
          </div>,
          document.body,
        )}
    </div>
  );
};
