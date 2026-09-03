import { cn } from "../../lib/utils";
import React from "react";
import _ from "lodash";
import { Bookmark, ChevronDown, Save, Trash } from "lucide-react";
import { Button } from "../ui/Button";
import { REFACTOR_CONSTANTS } from "../../constants";
import { AUTO_VIDEO_UI_TEXTS } from "../../constants/texts";
import { getAutoVideoTexts } from "./autoVideoGeneratorUtils";

interface PresetItem {
  id: string;
  name: string;
  config?: Record<string, unknown>;
}

interface PresetSectionProps {
  presets: PresetItem[];
  selectedPresetId: string;
  handleApplyPreset: (id: string) => void;
  presetNameInputState: string;
  setPresetNameInputState: (val: string) => void;
  handleSavePreset: () => void;
  handleDeletePreset: (id: string) => void;
  T: ReturnType<typeof getAutoVideoTexts>;
  truncateWords: (str: string, maxWords: number) => string;
}

export const PresetSection: React.FC<PresetSectionProps> = ({
  presets,
  selectedPresetId,
  handleApplyPreset,
  presetNameInputState,
  setPresetNameInputState,
  handleSavePreset,
  handleDeletePreset,
  T,
  truncateWords,
}) => {
  const uiTexts = AUTO_VIDEO_UI_TEXTS.vi;

  return (
    <div className={cn("glass-card bg-slate-900/60 rounded-2xl px-4 py-2.5 shadow-md backdrop-blur-md w-full flex flex-wrap items-center justify-between gap-3 text-left")}>
      <div className={cn("flex items-center gap-2.5 flex-1 min-w-[280px]")}>
        <div className={cn("flex items-center gap-1.5 shrink-0")}>
          <span
            className={cn("w-6 h-6 rounded-lg bg-purple-500/15 text-purple-400 flex items-center justify-center font-mono font-extrabold text-xs shadow-sm shadow-purple-500/20")}>
            <Bookmark className={cn("w-3.5 h-3.5 text-purple-400")} />
          </span>
          <span className={cn("text-xs font-bold text-slate-200 uppercase tracking-wider font-mono hidden sm:inline")}>
            {_.trimEnd(T.presetLabel || uiTexts.presetConfigDefault, ":")}
          </span>
        </div>

        <div className={cn("relative flex-1 min-w-[140px] max-w-[240px] flex items-center bg-slate-955/90 rounded-xl px-3 h-9 shadow-inner")}>
          <select
            value={selectedPresetId}
            onChange={(e) => handleApplyPreset(e.target.value)}
            className={cn("w-full bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer pr-5 appearance-none font-medium truncate")}>
            <option value={REFACTOR_CONSTANTS.VD_EMPTY_STRING} className={cn("bg-slate-900 text-slate-300")}>
              {T.presetDefaultOption || uiTexts.defaultPreset}
            </option>
            {_.map(presets, (p) => (
              <option key={p.id} value={p.id} className={cn("bg-slate-900 text-slate-200")} title={p.name}>
                {truncateWords(p.name, 5)}
              </option>
            ))}
          </select>
          <ChevronDown className={cn("pointer-events-none absolute right-2.5 text-slate-400 w-3.5 h-3.5")} />
        </div>

        {!_.isEmpty(selectedPresetId) && (
          <Button
            type={REFACTOR_CONSTANTS.BUTTON_TYPE_BUTTON}
            variant={REFACTOR_CONSTANTS.VARIANT_GHOST}
            size={REFACTOR_CONSTANTS.SIZE_MD}
            onClick={() => handleDeletePreset(selectedPresetId)}
            title={T.deletePresetTooltip}
            className={cn(
              "bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 rounded-xl h-9 w-9 p-0 shrink-0 shadow-none cursor-pointer flex items-center justify-center min-h-[36px] max-h-[36px]",
            )}>
            <Trash className={cn("w-3.5 h-3.5")} />
          </Button>
        )}
      </div>

      <div className={cn("flex items-center gap-2 shrink-0")}>
        <input
          type={REFACTOR_CONSTANTS.INPUT_TYPE_TEXT}
          placeholder={T.presetNamePlaceholder}
          value={presetNameInputState}
          onChange={(e) => setPresetNameInputState(e.target.value)}
          className={cn("w-36 sm:w-44 h-9 bg-slate-955/90 border border-slate-800/80 rounded-xl px-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/20 shadow-inner transition-colors")}
        />
        <Button
          type={REFACTOR_CONSTANTS.BUTTON_TYPE_BUTTON}
          variant="amber"
          size={REFACTOR_CONSTANTS.SIZE_MD}
          onClick={handleSavePreset}
          title={T.savePresetTooltip}
          className={cn("h-9 min-h-[36px] max-h-[36px] px-3.5 text-xs font-bold rounded-xl flex items-center gap-1.5 shrink-0")}>
          <Save className={cn("w-3.5 h-3.5")} />
          <span className={cn("hidden sm:inline")}>{T.savePresetBtn}</span>
        </Button>
      </div>
    </div>
  );
};
