import _ from "lodash";
import { ChevronDown, Save, Trash } from "lucide-react";
import { Button } from "../ui/Button";
import { REFACTOR_CONSTANTS } from "../../constants";

interface PresetSectionProps {
  presets: any[];
  selectedPresetId: string;
  handleApplyPreset: (id: string) => void;
  presetNameInputState: string;
  setPresetNameInputState: (val: string) => void;
  handleSavePreset: () => void;
  handleDeletePreset: (id: string) => void;
  T: any;
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
  return (
    <div className="flex items-center gap-1.5 lg:gap-3 bg-slate-955/50 p-1.5 rounded-xl border border-slate-800">
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-slate-400 font-mono">
          {T.presetLabel}
        </span>
        <div className="relative flex items-center bg-slate-955/80 border border-slate-800/80 rounded-lg px-2.5 py-1">
          <select
            value={selectedPresetId}
            onChange={(e) => handleApplyPreset(e.target.value)}
            className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer pr-5 appearance-none"
          >
            <option
              value={REFACTOR_CONSTANTS.VD_EMPTY_STRING}
              className="bg-slate-955 text-slate-300"
            >
              {T.presetDefaultOption}
            </option>
            {_.map(presets, (p) => (
              <option
                key={p.id}
                value={p.id}
                className="bg-slate-955 text-slate-300"
                title={p.name}
              >
                {truncateWords(p.name, 4)}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 text-slate-500 w-3.5 h-3.5" />
        </div>
      </div>

      <div className="flex items-center gap-1">
        <input
          type={REFACTOR_CONSTANTS.INPUT_TYPE_TEXT}
          placeholder={T.presetNamePlaceholder}
          value={presetNameInputState}
          onChange={(e) => setPresetNameInputState(e.target.value)}
          className="bg-slate-955 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-200 w-28 focus:outline-none focus:border-rose-500"
        />
        <Button
          variant={REFACTOR_CONSTANTS.VARIANT_SECONDARY as any}
          size={REFACTOR_CONSTANTS.SIZE_XS as any}
          onClick={handleSavePreset}
          title={T.savePresetTooltip}
        >
          <Save className="w-3.5 h-3.5 text-rose-400" /> {T.savePresetBtn}
        </Button>

        {selectedPresetId && (
          <Button
            variant={REFACTOR_CONSTANTS.VARIANT_GHOST as any}
            size={REFACTOR_CONSTANTS.SIZE_XS as any}
            onClick={() => handleDeletePreset(selectedPresetId)}
            title={T.deletePresetTooltip}
          >
            <Trash className="w-3.5 h-3.5 text-slate-500 hover:text-rose-500" />
          </Button>
        )}
      </div>
    </div>
  );
};
