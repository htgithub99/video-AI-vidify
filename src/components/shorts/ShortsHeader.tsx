import { StudioHeader, StudioDisclosureButton } from "../ui/Studio.js";
import { SOURCE_TEXT_BUTTON, SOURCE_TEXT_END } from "../../constants/sourceText";
import React from "react";
import { Scissors } from "lucide-react";
import { SHORTS_TEXTS } from "../../constants/shorts.js";
import { Tooltip } from "../ui/Tooltip.js";
import { cn } from "../../lib/utils.js";
type ShortsHeaderProps = {
  isAiConfigOpen?: boolean;
  onToggleAiConfig?: () => void;
  isLoading?: boolean;
};
export const ShortsHeader: React.FC<ShortsHeaderProps> = ({ isAiConfigOpen = false, onToggleAiConfig, isLoading }) => {
  return (
    <StudioHeader
      icon={Scissors}
      title={<>{SHORTS_TEXTS.TITLE}</>}
      description={<>{SHORTS_TEXTS.SUBTITLE}</>}
      badge={<>{SHORTS_TEXTS.AI_AUTO_CUT_BADGE}</>}
      actions={
        <>
          {onToggleAiConfig && (
            <div className={cn("flex items-center gap-2 self-start sm:self-auto")}>
              <Tooltip content={SHORTS_TEXTS.SETTINGS_AI} align={SOURCE_TEXT_END}>
                <StudioDisclosureButton type={SOURCE_TEXT_BUTTON} onClick={onToggleAiConfig} disabled={isLoading} expanded={isAiConfigOpen} label={<>{SHORTS_TEXTS.SETTINGS_AI}</>} />
              </Tooltip>
            </div>
          )}
        </>
      }></StudioHeader>
  );
};
