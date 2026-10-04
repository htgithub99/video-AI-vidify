import { VIDEO_EXPORT_TEXT_BUTTON, VIDEO_EXPORT_TEXT_END, VIDEO_EXPORT_TEXT_UNSTYLED, VIDEO_EXPORT_TEXT_VIDEO_EXPORT_AI_CONFIG_TOGGLE } from "../../constants/videoExportText";
import { FC } from "react";
import { ChevronDown, ChevronUp, Film, SlidersHorizontal, Sparkles } from "lucide-react";
import { Button } from "../ui/Button.js";
import { Tooltip } from "../ui/Tooltip.js";
import { cn } from "../../lib/utils.js";
import { VideoExportTexts } from "./videoExportUtils.js";
type VideoExportHeaderProps = {
  text: VideoExportTexts;
  isAiConfigOpen: boolean;
  disabled: boolean;
  onToggleAiConfig: () => void;
};
export const VideoExportHeader: FC<VideoExportHeaderProps> = ({ text, isAiConfigOpen, disabled, onToggleAiConfig }) => (
  <div className={cn("glass-card rounded-2xl p-4 sm:p-5 shadow-lg border border-slate-800/80 bg-slate-900/60 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4")}>
    <div className={cn("flex items-center gap-3 min-w-0")}>
      <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-500 via-fuchsia-500 to-pink-600 p-0.5 shadow-md shadow-purple-500/20 shrink-0")}>
        <div className={cn("w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-purple-400")}>
          <Film className={cn("w-5 h-5")} />
        </div>
      </div>
      <div className={cn("min-w-0")}>
        <div className={cn("flex items-center gap-2 flex-wrap")}>
          <h1 className={cn("text-base sm:text-lg font-black text-slate-100 tracking-tight uppercase font-sans")}>{text.HEADER_TITLE}</h1>
          <span className={cn("px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider bg-purple-500/15 border border-purple-500/30 text-purple-300 flex items-center gap-1 shadow-xs")}>
            <Sparkles className={cn("w-2.5 h-2.5 text-purple-400")} />
            {text.HEADER_BADGE}
          </span>
        </div>
        <p className={cn("text-[11px] text-slate-400 mt-0.5")}>{text.HEADER_DESC}</p>
      </div>
    </div>
    <div className={cn("flex items-center gap-2 self-start sm:self-auto")}>
      <Tooltip content={text.AI_CONFIG_TOOLTIP} align={VIDEO_EXPORT_TEXT_END}>
        <Button
          id={VIDEO_EXPORT_TEXT_VIDEO_EXPORT_AI_CONFIG_TOGGLE}
          variant={VIDEO_EXPORT_TEXT_UNSTYLED}
          type={VIDEO_EXPORT_TEXT_BUTTON}
          onClick={onToggleAiConfig}
          disabled={disabled}
          className={cn("group inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-xs leading-none select-none", {
            "bg-purple-600/15 border-purple-500/50 text-purple-700 dark:text-purple-300 shadow-purple-500/10": isAiConfigOpen,
            "bg-white/95 hover:bg-purple-50/90 border-slate-200/90 hover:border-purple-300/80 text-slate-800 hover:text-purple-700 dark:bg-slate-900/90 dark:hover:bg-slate-850 dark:border-slate-800 dark:hover:border-purple-500/40 dark:text-slate-200 dark:hover:text-purple-300": !isAiConfigOpen,
          })}>
          <SlidersHorizontal className={cn("w-3.5 h-3.5 text-purple-500 dark:text-purple-400 shrink-0 group-hover:scale-105 transition-transform")} />
          <span className={cn("inline-flex items-center leading-none text-slate-800 dark:text-slate-200 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors")}>{text.AI_CONFIG_TITLE}</span>
          {isAiConfigOpen ? <ChevronUp className={cn("w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0")} /> : <ChevronDown className={cn("w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0")} />}
        </Button>
      </Tooltip>
    </div>
  </div>
);
