import { cn } from "../../lib/utils";
import React from "react";
import _ from "lodash";
import { Bookmark, ChevronDown, Save, Sparkles, Trash } from "lucide-react";
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

export const PresetSection: React.FC<PresetSectionProps> = ({ presets, selectedPresetId, handleApplyPreset, presetNameInputState, setPresetNameInputState, handleSavePreset, handleDeletePreset, T, truncateWords }) => {
  const uiTexts = AUTO_VIDEO_UI_TEXTS.vi;
  const selectedPreset = _.find(presets, { id: selectedPresetId });
  const activePresetLabel = selectedPreset?.name ? truncateWords(selectedPreset.name, 3) : T.presetDefaultOption || uiTexts.defaultPreset;

  return (
    <div className={cn("bg-slate-900/60 border border-slate-800/80 rounded-3xl p-5 space-y-4 shadow-xl backdrop-blur-md")}>
      <div className={cn("flex items-center justify-between gap-2")}>
        <div className={cn("flex items-center gap-2 min-w-0")}>
          <span className={cn("w-6 h-6 rounded-lg bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center font-mono font-extrabold text-xs shadow-sm shadow-purple-500/20 shrink-0")}>
            <Bookmark className={cn("w-3.5 h-3.5 text-purple-400")} />
          </span>
          <h3 className={cn("text-xs font-bold uppercase tracking-wider text-slate-100 font-mono flex items-center gap-1.5 truncate")} title={T.presetLabel}>
            <span className={cn("truncate")}>{_.trimEnd(T.presetLabel || uiTexts.presetConfigDefault, ":")}</span>
          </h3>
        </div>

        <div className={cn("flex items-center gap-2 text-[10px] font-mono text-slate-400 bg-slate-955/80 border border-slate-800/80 px-2.5 py-1 rounded-full shrink-0 max-w-[200px]")} title={selectedPreset?.name || activePresetLabel}>
          <Sparkles className={cn("w-3 h-3 text-purple-400 shrink-0")} />
          <span className={cn("font-semibold text-slate-300 truncate")}>{activePresetLabel}</span>
        </div>
      </div>

      <div className={cn("grid grid-cols-1 sm:grid-cols-12 gap-3")}>
        <div className={cn("sm:col-span-6 flex items-center gap-2")}>
          <div className={cn("relative flex-1 flex items-center bg-slate-955/90 border border-slate-800/90 hover:border-purple-500/50 focus-within:border-purple-500 rounded-2xl px-3 py-2.5 transition-all shadow-sm")}>
            <select value={selectedPresetId} onChange={(e) => handleApplyPreset(e.target.value)} className={cn("w-full bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer pr-6 appearance-none font-medium")}>
              <option value={REFACTOR_CONSTANTS.VD_EMPTY_STRING} className={cn("bg-slate-900 text-slate-300")}>
                {T.presetDefaultOption || uiTexts.defaultPreset}
              </option>
              {_.map(presets, (p) => (
                <option key={p.id} value={p.id} className={cn("bg-slate-900 text-slate-200")} title={p.name}>
                  {truncateWords(p.name, 5)}
                </option>
              ))}
            </select>
            <ChevronDown className={cn("pointer-events-none absolute right-3 text-slate-400 w-4 h-4")} />
          </div>

          {!_.isEmpty(selectedPresetId) && (
            <Button type={REFACTOR_CONSTANTS.BUTTON_TYPE_BUTTON} variant={REFACTOR_CONSTANTS.VARIANT_GHOST} size={REFACTOR_CONSTANTS.SIZE_SM} onClick={() => handleDeletePreset(selectedPresetId)} title={T.deletePresetTooltip} className={cn("bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/20 hover:border-rose-500/40 rounded-2xl p-2.5 h-auto shrink-0 shadow-none transition-all cursor-pointer")}>
              <Trash className={cn("w-4 h-4")} />
            </Button>
          )}
        </div>

        <div className={cn("sm:col-span-6 flex items-center gap-2")}>
          <input type={REFACTOR_CONSTANTS.INPUT_TYPE_TEXT} placeholder={T.presetNamePlaceholder} value={presetNameInputState} onChange={(e) => setPresetNameInputState(e.target.value)} className={cn("flex-1 bg-slate-955/90 border border-slate-800/90 hover:border-slate-700 focus:border-purple-500 rounded-2xl px-3 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none transition-all shadow-sm")} />
          <Button type={REFACTOR_CONSTANTS.BUTTON_TYPE_BUTTON} variant={REFACTOR_CONSTANTS.VARIANT_SECONDARY} size={REFACTOR_CONSTANTS.SIZE_SM} onClick={handleSavePreset} title={T.savePresetTooltip} className={cn("bg-purple-600/15 hover:bg-purple-600/25 text-purple-300 hover:text-purple-200 border border-purple-500/30 hover:border-purple-500/50 font-bold text-xs rounded-2xl px-3.5 py-2.5 h-auto shrink-0 shadow-none transition-all flex items-center gap-1.5 cursor-pointer")}>
            <Save className={cn("w-3.5 h-3.5 text-purple-400")} />
            <span>{T.savePresetBtn}</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
