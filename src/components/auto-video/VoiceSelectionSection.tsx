import { cn } from "../../lib/utils";
import React from "react";
import _ from "lodash";
import { ChevronDown, Mic, Volume2 } from "lucide-react";
import { Button } from "../ui/Button";
import { Tooltip } from "../ui/Tooltip";
import { VoiceSelectionDialog, type Voice as CatalogVoice } from "../VoiceSelectionDialog";
import { REFACTOR_CONSTANTS } from "../../constants";
import { Lang } from "../../lib/lang";
import { PIPELINE_STEPS } from "../../constants/enums";
import { AUTO_VIDEO_UI_TEXTS } from "../../constants/texts";
import { getAutoVideoTexts } from "./autoVideoGeneratorUtils";

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
  T: ReturnType<typeof getAutoVideoTexts>;
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
  const uiTexts = _.get(AUTO_VIDEO_UI_TEXTS, currentLang, AUTO_VIDEO_UI_TEXTS.vi);
  const displayVoiceName = voiceName || voiceURI;

  return (
    <div className={cn("bg-slate-900/60 border border-slate-800/80 rounded-3xl p-5 space-y-4 shadow-xl backdrop-blur-md")}>
      <div className={cn("flex items-center justify-between")}>
        <div className={cn("flex items-center gap-2")}>
          <span
            className={cn(
              "w-6 h-6 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center font-mono font-extrabold text-xs shadow-sm shadow-amber-500/20",
            )}>
            {PIPELINE_STEPS.STEP_2}
          </span>
          <h3 className={cn("text-xs font-bold uppercase tracking-wider text-slate-100 font-mono flex items-center gap-1.5")} title={T.sec2TitleTooltip}>
            <Mic className={cn("w-3.5 h-3.5 text-amber-400")} /> {T.sec2Title}
          </h3>
        </div>

        <div className={cn("header-badge flex items-center gap-2 text-[11px] font-mono font-bold text-slate-300 bg-slate-955/80 px-3 py-1 rounded-full")}>
          <Volume2 className={cn("w-3.5 h-3.5 text-amber-400")} />
          <span className={cn("font-semibold text-slate-300")}>{voiceProvider || uiTexts.aiVoiceDefault}</span>
        </div>
      </div>

      <div>
        <Button
          type={REFACTOR_CONSTANTS.BUTTON_TYPE_BUTTON}
          variant={REFACTOR_CONSTANTS.VARIANT_UNSTYLED}
          onClick={() => setIsVoiceDialogOpen(true)}
          className={cn(
            "w-full bg-slate-955/90 border border-slate-800/90 hover:border-amber-500/60 rounded-2xl p-3 text-left flex items-center justify-between transition-all group h-auto cursor-pointer shadow-sm",
          )}
          title={T.voiceBtnTooltip}>
          <div className={cn("flex items-center gap-3")}>
            <div className={cn("p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 group-hover:scale-105 transition-transform")}>
              <Mic className={cn("w-4 h-4")} />
            </div>
            <div className={cn("flex items-center gap-2.5")}>
              <Tooltip content={displayVoiceName} position="top">
                <span className={cn("font-bold text-slate-100 text-xs group-hover:text-amber-400 transition-colors")}>{truncateWords(displayVoiceName, 5)}</span>
              </Tooltip>
              {!_.isEmpty(voiceProvider) && (
                <span className={cn("text-[9px] text-amber-400/90 font-mono font-semibold uppercase bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md")}>
                  {voiceProvider}
                </span>
              )}
            </div>
          </div>
          <ChevronDown className={cn("w-4 h-4 text-slate-500 group-hover:text-amber-400 transition-colors")} />
        </Button>
      </div>

      {isVoiceDialogOpen && (
        <VoiceSelectionDialog
          key={voiceDialogPersistenceScope}
          isOpen={isVoiceDialogOpen}
          onClose={() => setIsVoiceDialogOpen(false)}
          currentLang={_.isEqual(currentLang, "en") ? "en" : "vi"}
          selectedVoiceId={voiceURI}
          favoriteVoices={[]}
          onToggleFavoriteVoice={_.noop}
          onSelectVoice={handleVoiceSelect}
          persistenceScope={voiceDialogPersistenceScope}
        />
      )}
    </div>
  );
};
