import { StudioHeader, StudioDisclosureButton } from "../ui/Studio.js";
import { VIDEO_EXPORT_TEXT_BUTTON, VIDEO_EXPORT_TEXT_END, VIDEO_EXPORT_TEXT_VIDEO_EXPORT_AI_CONFIG_TOGGLE } from "../../constants/videoExportText";
import { FC } from "react";
import { Film } from "lucide-react";
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
  <StudioHeader
    icon={Film}
    title={<>{text.HEADER_TITLE}</>}
    description={<>{text.HEADER_DESC}</>}
    badge={<>{text.HEADER_BADGE}</>}
    actions={
      <>
        <div className={cn("flex items-center gap-2 self-start sm:self-auto")}>
          <Tooltip content={text.AI_CONFIG_TOOLTIP} align={VIDEO_EXPORT_TEXT_END}>
            <StudioDisclosureButton id={VIDEO_EXPORT_TEXT_VIDEO_EXPORT_AI_CONFIG_TOGGLE} type={VIDEO_EXPORT_TEXT_BUTTON} onClick={onToggleAiConfig} disabled={disabled} expanded={isAiConfigOpen} label={<>{text.AI_CONFIG_TITLE}</>} />
          </Tooltip>
        </div>
      </>
    }></StudioHeader>
);
