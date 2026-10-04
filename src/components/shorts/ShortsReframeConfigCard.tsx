import _ from "lodash";
import { SOURCE_TEXT_15_30S_2, SOURCE_TEXT_30_60S_2, SOURCE_TEXT_60_90S_2, SOURCE_TEXT_BUTTON, SOURCE_TEXT_TU_DONG, SOURCE_TEXT_TU_DONG_AI, SOURCE_TEXT_UNSTYLED } from "../../constants/sourceText";
import React from "react";
import { SlidersHorizontal, Smartphone, Tv, Square, Layers, Crop, Crosshair } from "lucide-react";
import { SHORTS_TEXTS } from "../../constants/shorts.js";
import { ShortsAspectRatio, ShortsDurationOption, ShortsReframeMode } from "../../types/shorts.js";
import { cn } from "../../lib/utils.js";
import { Button } from "../ui/Button.js";
type ShortsReframeConfigCardProps = {
  aspectRatio: ShortsAspectRatio;
  setAspectRatio: (ar: ShortsAspectRatio) => void;
  reframeMode: ShortsReframeMode;
  setReframeMode: (mode: ShortsReframeMode) => void;
  clipCount: number;
  setClipCount: (count: number) => void;
  durationMode: ShortsDurationOption;
  setDurationMode: (dur: ShortsDurationOption) => void;
  disabled?: boolean;
};
export const ShortsReframeConfigCard: React.FC<ShortsReframeConfigCardProps> = ({ aspectRatio, setAspectRatio, reframeMode, setReframeMode, clipCount, setClipCount, durationMode, setDurationMode, disabled }) => {
  return (
    <div className={cn("glass-card rounded-2xl sm:rounded-3xl p-5 space-y-5 shadow-xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-xl relative overflow-hidden text-left w-full")}>
      <div className={cn("flex items-center justify-between relative z-10 flex-wrap gap-2")}>
        <div className={cn("flex items-center gap-2.5 min-w-0")}>
          <span className={cn("w-6 h-6 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center font-mono font-black text-xs shadow-sm shadow-purple-500/20")}>{SHORTS_TEXTS.STEP_02}</span>
          <h3 className={cn("text-xs font-bold uppercase tracking-wider text-slate-100 font-mono flex items-center gap-1.5")}>
            <SlidersHorizontal className={cn("w-3.5 h-3.5 text-purple-400")} />
            <span>{SHORTS_TEXTS.CONFIG_LABEL}</span>
            <span className={cn("px-1.5 py-0.2 rounded text-[9px] bg-purple-500/15 border border-purple-500/30 text-purple-300 font-mono")}>{SHORTS_TEXTS.CONFIG_BADGE}</span>
          </h3>
        </div>
      </div>
      <div className={cn("space-y-2")}>
        <label className={cn("text-xs font-medium text-slate-300 flex items-center gap-1.5")}>
          <span>{SHORTS_TEXTS.ASPECT_RATIO_LABEL}</span>
        </label>
        <div className={cn("grid grid-cols-3 gap-2")}>
          <Button
            variant={SOURCE_TEXT_UNSTYLED}
            type={SOURCE_TEXT_BUTTON}
            disabled={disabled}
            onClick={() => setAspectRatio(ShortsAspectRatio.VERTICAL_9_16)}
            className={cn("flex flex-col items-center justify-center p-3 rounded-xl border transition-all text-center group cursor-pointer", {
              "bg-purple-500/20 border-purple-500/60 text-white shadow-lg shadow-purple-500/10": aspectRatio === ShortsAspectRatio.VERTICAL_9_16,
              "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200": aspectRatio !== ShortsAspectRatio.VERTICAL_9_16,
            })}>
            <Smartphone className={cn("w-5 h-5 mb-1.5 text-purple-400 group-hover:scale-110 transition-transform")} />
            <span className={cn("text-xs font-bold")}>{SHORTS_TEXTS.ASPECT_9_16_TITLE}</span>
            <span className={cn("text-[10px] text-slate-400 mt-0.5")}>{SHORTS_TEXTS.ASPECT_9_16_DESC}</span>
          </Button>
          <Button
            variant={SOURCE_TEXT_UNSTYLED}
            type={SOURCE_TEXT_BUTTON}
            disabled={disabled}
            onClick={() => setAspectRatio(ShortsAspectRatio.HORIZONTAL_16_9)}
            className={cn("flex flex-col items-center justify-center p-3 rounded-xl border transition-all text-center group cursor-pointer", {
              "bg-purple-500/20 border-purple-500/60 text-white shadow-lg shadow-purple-500/10": aspectRatio === ShortsAspectRatio.HORIZONTAL_16_9,
              "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200": aspectRatio !== ShortsAspectRatio.HORIZONTAL_16_9,
            })}>
            <Tv className={cn("w-5 h-5 mb-1.5 text-blue-400 group-hover:scale-110 transition-transform")} />
            <span className={cn("text-xs font-bold")}>{SHORTS_TEXTS.ASPECT_16_9_TITLE}</span>
            <span className={cn("text-[10px] text-slate-400 mt-0.5")}>{SHORTS_TEXTS.ASPECT_16_9_DESC}</span>
          </Button>
          <Button
            variant={SOURCE_TEXT_UNSTYLED}
            type={SOURCE_TEXT_BUTTON}
            disabled={disabled}
            onClick={() => setAspectRatio(ShortsAspectRatio.SQUARE_1_1)}
            className={cn("flex flex-col items-center justify-center p-3 rounded-xl border transition-all text-center group cursor-pointer", {
              "bg-purple-500/20 border-purple-500/60 text-white shadow-lg shadow-purple-500/10": aspectRatio === ShortsAspectRatio.SQUARE_1_1,
              "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200": aspectRatio !== ShortsAspectRatio.SQUARE_1_1,
            })}>
            <Square className={cn("w-5 h-5 mb-1.5 text-pink-400 group-hover:scale-110 transition-transform")} />
            <span className={cn("text-xs font-bold")}>{SHORTS_TEXTS.ASPECT_1_1_TITLE}</span>
            <span className={cn("text-[10px] text-slate-400 mt-0.5")}>{SHORTS_TEXTS.ASPECT_1_1_DESC}</span>
          </Button>
        </div>
      </div>
      {aspectRatio === ShortsAspectRatio.VERTICAL_9_16 && (
        <div className={cn("space-y-2.5 pt-1")}>
          <label className={cn("text-xs font-medium text-slate-300 flex items-center justify-between")}>
            <span>{SHORTS_TEXTS.REFRAME_MODE_LABEL}</span>
            <span className={cn("text-[10px] text-purple-400 font-mono font-medium")}>{SHORTS_TEXTS.REFRAME_3_METHODS}</span>
          </label>
          <div className={cn("grid grid-cols-1 sm:grid-cols-3 gap-2.5")}>
            <div
              onClick={() => !disabled && setReframeMode(ShortsReframeMode.BLUR_BACKGROUND)}
              className={cn("p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden", {
                "bg-purple-500/15 border-purple-500/60 ring-1 ring-purple-500/40": reframeMode === ShortsReframeMode.BLUR_BACKGROUND,
                "bg-slate-950/60 border-slate-800 hover:border-slate-700": reframeMode !== ShortsReframeMode.BLUR_BACKGROUND,
              })}>
              <div>
                <div className={cn("flex items-center gap-2 mb-1.5")}>
                  <Layers className={cn("w-4 h-4 text-purple-400 shrink-0")} />
                  <span className={cn("text-xs font-bold text-slate-100")}>{SHORTS_TEXTS.REFRAME_BLUR_TITLE}</span>
                </div>
                <p className={cn("text-[11px] text-slate-400 leading-relaxed")}>{SHORTS_TEXTS.REFRAME_BLUR_DESC}</p>
              </div>
              <div className={cn("mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-purple-300 font-mono")}>
                <span>{SHORTS_TEXTS.REFRAME_BLUR_TAG}</span>
                <span className={cn("w-2 h-2 rounded-full bg-purple-500 animate-pulse")} />
              </div>
            </div>
            <div
              onClick={() => !disabled && setReframeMode(ShortsReframeMode.CENTER_CROP)}
              className={cn("p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between", {
                "bg-purple-500/15 border-purple-500/60 ring-1 ring-purple-500/40": reframeMode === ShortsReframeMode.CENTER_CROP,
                "bg-slate-950/60 border-slate-800 hover:border-slate-700": reframeMode !== ShortsReframeMode.CENTER_CROP,
              })}>
              <div>
                <div className={cn("flex items-center gap-2 mb-1.5")}>
                  <Crop className={cn("w-4 h-4 text-blue-400 shrink-0")} />
                  <span className={cn("text-xs font-bold text-slate-100")}>{SHORTS_TEXTS.REFRAME_CROP_TITLE}</span>
                </div>
                <p className={cn("text-[11px] text-slate-400 leading-relaxed")}>{SHORTS_TEXTS.REFRAME_CROP_DESC}</p>
              </div>
              <div className={cn("mt-2.5 pt-2 border-t border-slate-800/60 text-[10px] text-slate-400 font-mono")}>
                <span>{SHORTS_TEXTS.REFRAME_CROP_TAG}</span>
              </div>
            </div>
            <div
              onClick={() => !disabled && setReframeMode(ShortsReframeMode.SMART_TRACKING)}
              className={cn("p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between", {
                "bg-purple-500/15 border-purple-500/60 ring-1 ring-purple-500/40": reframeMode === ShortsReframeMode.SMART_TRACKING,
                "bg-slate-950/60 border-slate-800 hover:border-slate-700": reframeMode !== ShortsReframeMode.SMART_TRACKING,
              })}>
              <div>
                <div className={cn("flex items-center gap-2 mb-1.5")}>
                  <Crosshair className={cn("w-4 h-4 text-pink-400 shrink-0")} />
                  <span className={cn("text-xs font-bold text-slate-100")}>{SHORTS_TEXTS.REFRAME_TRACKING_TITLE}</span>
                </div>
                <p className={cn("text-[11px] text-slate-400 leading-relaxed")}>{SHORTS_TEXTS.REFRAME_TRACKING_DESC}</p>
              </div>
              <div className={cn("mt-2.5 pt-2 border-t border-slate-800/60 text-[10px] text-pink-400 font-mono")}>
                <span>{SHORTS_TEXTS.REFRAME_TRACKING_TAG}</span>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className={cn("grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1")}>
        <div className={cn("space-y-2")}>
          <div className={cn("flex items-center justify-between text-xs")}>
            <span className={cn("text-slate-300 font-medium")}>{SHORTS_TEXTS.CLIP_COUNT_LABEL}</span>
            <span className={cn("text-purple-400 font-mono font-bold bg-purple-500/15 px-2 py-0.5 rounded-lg border border-purple-500/30")}>
              {clipCount} {SHORTS_TEXTS.CLIP_COUNT_SUFFIX}
            </span>
          </div>
          <div className={cn("flex items-center gap-2")}>
            {_.map([1, 3, 5, 8, 10], (num) => (
              <Button
                variant={SOURCE_TEXT_UNSTYLED}
                key={num}
                type={SOURCE_TEXT_BUTTON}
                disabled={disabled}
                onClick={() => setClipCount(num)}
                className={cn("flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer", {
                  "bg-purple-600 text-white border-purple-500 shadow-md": clipCount === num,
                  "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200": clipCount !== num,
                })}>
                {num}
              </Button>
            ))}
          </div>
        </div>
        <div className={cn("space-y-2")}>
          <div className={cn("flex items-center justify-between text-xs")}>
            <span className={cn("text-slate-300 font-medium")}>{SHORTS_TEXTS.DURATION_LABEL}</span>
            <span className={cn("text-purple-400 font-mono font-bold bg-purple-500/15 px-2 py-0.5 rounded-lg border border-purple-500/30")}>{durationMode === ShortsDurationOption.AUTO ? SOURCE_TEXT_TU_DONG_AI : durationMode === ShortsDurationOption.RANGE_15_30 ? SOURCE_TEXT_15_30S_2 : durationMode === ShortsDurationOption.RANGE_30_60 ? SOURCE_TEXT_30_60S_2 : SOURCE_TEXT_60_90S_2}</span>
          </div>
          <div className={cn("flex items-center gap-2")}>
            {_.map(
              [
                { value: ShortsDurationOption.AUTO, label: SOURCE_TEXT_TU_DONG },
                { value: ShortsDurationOption.RANGE_15_30, label: SOURCE_TEXT_15_30S_2 },
                { value: ShortsDurationOption.RANGE_30_60, label: SOURCE_TEXT_30_60S_2 },
                { value: ShortsDurationOption.RANGE_60_90, label: SOURCE_TEXT_60_90S_2 },
              ],
              (opt) => (
                <Button
                  variant={SOURCE_TEXT_UNSTYLED}
                  key={opt.value}
                  type={SOURCE_TEXT_BUTTON}
                  disabled={disabled}
                  onClick={() => setDurationMode(opt.value)}
                  className={cn("flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all text-center cursor-pointer", {
                    "bg-purple-600 text-white border-purple-500 shadow-md": durationMode === opt.value,
                    "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200": durationMode !== opt.value,
                  })}>
                  {opt.label}
                </Button>
              ),
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
