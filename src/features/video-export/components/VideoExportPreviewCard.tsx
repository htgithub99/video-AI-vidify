import { RUNTIME_TEXT as RT_SHARED } from "../../../constants/runtime/shared.js";
import { RUNTIME_TEXT as RT_VIDEO_EXPORT } from "../constants/runtimeText.js";
import { StudioCard } from "../../../components/ui/Studio.js";
import { VIDEO_EXPORT_TEMPLATE_SYMBOL_3, VIDEO_EXPORT_TEMPLATE_SYMBOL_4, VIDEO_EXPORT_TEXT_BUTTON, VIDEO_EXPORT_TEXT_SYMBOL_3, VIDEO_EXPORT_TEXT_UNSTYLED, VIDEO_EXPORT_TEXT_VIDEO_EXPORT_PREVIEW, VIDEO_EXPORT_TEXT_VIDEO_EXPORT_PREVIEW_CANCEL } from "../../../constants/videoExportText";
import { VIDEO_EXPORT_FRAME_CLASSNAMES } from "../constants/videoExport";
import { FC } from "react";
import { AlertTriangle, Eye, MonitorPlay, RefreshCw, Sparkles, X } from "lucide-react";
import { Button } from "../../../components/ui/Button.js";
import { cn } from "../../../lib/utils.js";
import { VideoExporterState } from "../hooks/useVideoExporter.js";
import { VideoExportPlayer } from "./VideoExportPlayer.js";
type VideoExportPreviewCardProps = { exporter: Pick<VideoExporterState, "text" | "preview" | "isPreviewing" | "isPreviewOutdated" | "canRender" | "isExporting" | "config" | "generatePreview" | "cancelPreview"> };
export const VideoExportPreviewCard: FC<VideoExportPreviewCardProps> = ({ exporter }) => {
  const { text, preview, isPreviewing, isPreviewOutdated, canRender, isExporting, config } = exporter;
  return (
    <StudioCard className={cn(RT_SHARED.GLASS_CARD_ROUNDED_2XL_SM_ROUNDED_3XL_P_5_SPACE)}>
      <div className={cn(RT_VIDEO_EXPORT.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN_FLEX_WRAP_GAP_2)}>
        <h3 className={cn(RT_SHARED.TEXT_XS_FONT_BOLD_UPPERCASE_TRACKING_WIDER_TEXT_SLATE_100)}>
          <Eye className={cn(RT_SHARED.W_3_5_H_3_5_TEXT_PURPLE_400)} />
          <span>{text.PREVIEW_TITLE}</span>
          <span className={cn(RT_VIDEO_EXPORT.PX_1_5_PY_0_5_ROUNDED_TEXT_9PX_BG)}>
            {config.aspectRatio}
            {VIDEO_EXPORT_TEXT_SYMBOL_3}
            {text.PREVIEW_BADGE}
          </span>
        </h3>
        {isPreviewing ? (
          <Button id={VIDEO_EXPORT_TEXT_VIDEO_EXPORT_PREVIEW_CANCEL} variant={VIDEO_EXPORT_TEXT_UNSTYLED} type={VIDEO_EXPORT_TEXT_BUTTON} onClick={exporter.cancelPreview} className={cn(RT_VIDEO_EXPORT.H_8_PX_3_ROUNDED_XL_BORDER_BORDER_ROSE_500)}>
            <X className={cn(RT_SHARED.W_3_5_H_3_5)} />
            <span>{text.PREVIEW_CANCEL}</span>
          </Button>
        ) : (
          <Button id={VIDEO_EXPORT_TEXT_VIDEO_EXPORT_PREVIEW} variant={VIDEO_EXPORT_TEXT_UNSTYLED} type={VIDEO_EXPORT_TEXT_BUTTON} onClick={exporter.generatePreview} disabled={!canRender || isExporting} className={cn(RT_VIDEO_EXPORT.H_8_PX_3_ROUNDED_XL_BORDER_TEXT_XS_FONT)}>
            {preview ? <RefreshCw className={cn(RT_SHARED.W_3_5_H_3_5)} /> : <MonitorPlay className={cn(RT_SHARED.W_3_5_H_3_5)} />}
            <span>{preview ? text.PREVIEW_REFRESH_BTN : text.PREVIEW_BTN}</span>
          </Button>
        )}
      </div>
      <div className={cn(RT_VIDEO_EXPORT.W_FULL_FLEX_JUSTIFY_CENTER_ITEMS_CENTER_MIN_H_280PX)}>
        {preview?.previewUrl && !isPreviewing ? (
          <VideoExportPlayer key={VIDEO_EXPORT_TEMPLATE_SYMBOL_3(`${config.aspectRatio}`, `${preview.previewUrl}`)} src={preview.previewUrl} aspectRatio={config.aspectRatio} badgeText={VIDEO_EXPORT_TEMPLATE_SYMBOL_4(`${config.aspectRatio}`, `${text.PREVIEW_BADGE}`)} badgeIcon={Eye} />
        ) : (
          <div className={cn(RT_VIDEO_EXPORT.RELATIVE_ROUNDED_2XL_OVERFLOW_HIDDEN_BG_SLATE_950_BORDER_BORDER_402787, VIDEO_EXPORT_FRAME_CLASSNAMES[config.aspectRatio])}>
            <div className={cn(RT_VIDEO_EXPORT.FLEX_FLEX_COL_ITEMS_CENTER_JUSTIFY_CENTER_TEXT_CENTER_P)}>
              <div className={cn(RT_VIDEO_EXPORT.W_12_H_12_ROUNDED_2XL_BORDER_FLEX_ITEMS_CENTER, isPreviewing ? RT_VIDEO_EXPORT.BG_PURPLE_500_15_BORDER_PURPLE_500_30_SHADOW_PURPLE : RT_VIDEO_EXPORT.BG_SLATE_800_80_BORDER_SLATE_700_80)}>
                {isPreviewing ? <Sparkles className={cn(RT_VIDEO_EXPORT.W_6_H_6_TEXT_PURPLE_400_ANIMATE_SPIN)} /> : <MonitorPlay className={cn(RT_VIDEO_EXPORT.W_6_H_6_TEXT_PURPLE_400_80)} />}
              </div>
              <div className={cn(RT_SHARED.SPACE_Y_1_MAX_W_SM)}>
                <p className={cn(RT_SHARED.TEXT_SM_FONT_EXTRABOLD_TEXT_SLATE_200)}>{isPreviewing ? text.PREVIEW_GENERATING : text.PREVIEW_EMPTY_TITLE}</p>
                {!isPreviewing && <p className={cn(RT_SHARED.TEXT_XS_TEXT_SLATE_400_LEADING_RELAXED)}>{text.PREVIEW_EMPTY_DESC}</p>}
              </div>
            </div>
          </div>
        )}
      </div>
      {isPreviewOutdated && !isPreviewing && (
        <div className={cn(RT_VIDEO_EXPORT.FLEX_ITEMS_CENTER_GAP_2_PX_3_PY_2_ROUNDED)}>
          <AlertTriangle className={cn(RT_SHARED.W_3_5_H_3_5_SHRINK_0)} />
          <span>{text.PREVIEW_OUTDATED}</span>
        </div>
      )}
    </StudioCard>
  );
};
