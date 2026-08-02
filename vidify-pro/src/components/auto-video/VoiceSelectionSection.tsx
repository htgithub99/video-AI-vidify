import _ from "lodash";
import { ChevronDown, Mic } from "lucide-react";
import { Button } from "../ui/Button";
import { Tooltip } from "../ui/Tooltip";
import { VoiceSelectionDialog, type Voice as CatalogVoice } from "../VoiceSelectionDialog";
import { REFACTOR_CONSTANTS } from "../../constants";
import { Lang } from "../../lib/lang";

interface VoiceSelectionSectionProps {
  voiceName: string;
  voiceURI: string;
  voiceProvider: string;
  isVoiceDialogOpen: boolean;
  setIsVoiceDialogOpen: (val: boolean) => void;
  voiceDialogPersistenceScope: string;
  currentLang: Lang;
  handleVoiceSelect: (v: CatalogVoice) => void;
  truncateWords: (str: string, maxWords: number) => string;
  T: any;
}

export const VoiceSelectionSection: React.FC<VoiceSelectionSectionProps> = ({
  voiceName,
  voiceURI,
  voiceProvider,
  isVoiceDialogOpen,
  setIsVoiceDialogOpen,
  voiceDialogPersistenceScope,
  currentLang,
  handleVoiceSelect,
  truncateWords,
  T,
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="w-6 h-6 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center font-mono font-bold text-xs">2</span>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono flex items-center gap-1.5" title={T.sec2TitleTooltip}>
          <Mic className="w-3.5 h-3.5 text-rose-500" /> {T.sec2Title}
        </h3>
      </div>

      <div>
        <Button
          type={REFACTOR_CONSTANTS.BUTTON_TYPE_BUTTON}
          variant={REFACTOR_CONSTANTS.VARIANT_UNSTYLED}
          onClick={() => setIsVoiceDialogOpen(true)}
          className="w-full bg-slate-955/80 border border-slate-800 hover:border-rose-500/50 rounded-xl p-3 text-left flex items-center justify-between transition-all group h-auto"
          title={T.voiceBtnTooltip}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500">
              <Mic className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-2">
              <Tooltip content={voiceName || voiceURI} position="top">
                <span className="font-bold text-slate-100 text-xs group-hover:text-rose-400 transition-colors">
                  {truncateWords(voiceName || voiceURI, 4)}
                </span>
              </Tooltip>
              <span className="text-[9px] text-slate-400 font-mono uppercase bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded">{voiceProvider}</span>
            </div>
          </div>
          <ChevronDown className="w-4 h-4 text-slate-500 group-hover:text-rose-400" />
        </Button>
      </div>

      {isVoiceDialogOpen && (
        <VoiceSelectionDialog
          key={voiceDialogPersistenceScope}
          isOpen={isVoiceDialogOpen}
          onClose={() => setIsVoiceDialogOpen(false)}
          currentLang={currentLang}
          selectedVoiceId={voiceURI}
          favoriteVoices={[]}
          onToggleFavoriteVoice={() => { }}
          persistenceScope={voiceDialogPersistenceScope}
          onSelectVoice={handleVoiceSelect}
        />
      )}
    </div>
  );
};
