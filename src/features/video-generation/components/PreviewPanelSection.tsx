import { RUNTIME_TEXT as RT_VIDEO_GENERATION } from "../constants/runtimeText.js";
import { RUNTIME_TEXT as RT_SHARED } from "../../../constants/runtime/shared.js";
import { StudioCard } from "../../../components/ui/Studio.js";
import { SOURCE_TEXT_A, SOURCE_TEXT_INFO, SOURCE_TEXT_METADATA, SOURCE_TEXT_PURPLE, SOURCE_TEXT_SUCCESS } from "../../../constants/sourceText";
import { cn } from "../../../lib/utils";
import React, { useState, useEffect, useRef } from "react";
import _ from "lodash";
import { Download, Eye, ImageIcon, Mic, RefreshCw, Video } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { REFACTOR_CONSTANTS } from "../../../constants";
import { REGENERATION_TARGET, REGENERATION_TEXTS } from "../../../constants/config";
import { VideoProject } from "../../../types";
import { getAutoVideoTexts } from "./autoVideoGeneratorUtils";
import { usePausedVideoPreview } from "../../../hooks/usePausedVideoPreview";
import { SceneRegenerationDialog } from "./SceneRegenerationDialog";
interface PreviewPanelSectionProps {
  renderedVideoUrl: string;
  projectName: string;
  activeCreatedProject: VideoProject | null | undefined;
  isProcessing: boolean;
  regeneratingTarget?: string | null;
  handleRegenerate: (target: string, sceneId?: string) => Promise<void>;
  T: ReturnType<typeof getAutoVideoTexts>;
  regenerationTexts: (typeof REGENERATION_TEXTS)[keyof typeof REGENERATION_TEXTS];
  showVoiceRegeneration?: boolean;
  regenerateVideoClips?: boolean;
  canRegenerate?: boolean;
}
export const PreviewPanelSection: React.FC<PreviewPanelSectionProps> = ({ renderedVideoUrl, projectName, activeCreatedProject, isProcessing, regeneratingTarget = null, handleRegenerate, T, regenerationTexts, showVoiceRegeneration = true, regenerateVideoClips = false, canRegenerate = true }) => {
  const [loadingTarget, setLoadingTarget] = useState<string | null>(null);
  const [isSceneDialogOpen, setIsSceneDialogOpen] = useState(false);
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  usePausedVideoPreview(previewVideoRef, renderedVideoUrl);
  const onRegenerate = async (target: string, sceneId?: string) => {
    setLoadingTarget(target);
    try {
      await handleRegenerate(target, sceneId);
    } finally {
      setLoadingTarget(null);
    }
  };
  useEffect(() => {
    if (!isProcessing) setLoadingTarget(null);
  }, [isProcessing]);
  const isVoiceActive = _.isEqual(loadingTarget, REGENERATION_TARGET.VOICE) || (isProcessing && _.isEqual(regeneratingTarget, REGENERATION_TARGET.VOICE));
  const isSceneMediaActive = _.isEqual(loadingTarget, REGENERATION_TARGET.IMAGES) || (isProcessing && _.isEqual(regeneratingTarget, REGENERATION_TARGET.IMAGES));
  const isRenderActive = _.isEqual(loadingTarget, REGENERATION_TARGET.RENDER) || (isProcessing && _.isEqual(regeneratingTarget, REGENERATION_TARGET.RENDER));
  const isAnyDisabled = isProcessing || !_.isNull(loadingTarget) || !_.isNull(regeneratingTarget);
  const sceneMediaRegenerationText = regenerateVideoClips ? regenerationTexts.clips : regenerationTexts.images;
  const handleDownload = () => {
    const a = document.createElement(SOURCE_TEXT_A);
    a.href = renderedVideoUrl;
    a.download = _.join([projectName, REFACTOR_CONSTANTS.AVG_MP4_SUFFIX], REFACTOR_CONSTANTS.VD_EMPTY_STRING);
    a.click();
  };
  return (
    <StudioCard className={cn(RT_VIDEO_GENERATION.GLASS_CARD_BG_SLATE_900_80_P_5_ROUNDED_3XL)}>
      <div className={cn(RT_VIDEO_GENERATION.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN_BORDER_B_BORDER_SLATE_800)}>
        <div className={cn(RT_SHARED.FLEX_ITEMS_CENTER_GAP_2)}>
          <span className={cn(RT_VIDEO_GENERATION.W_8_H_8_ROUNDED_XL_BG_AMBER_500_15)}>
            <Eye className={cn(RT_SHARED.W_4_H_4_TEXT_AMBER_400)} />
          </span>
          <h3 className={cn(RT_VIDEO_GENERATION.TEXT_XS_FONT_BOLD_TEXT_SLATE_100_FONT_MONO_UPPERCASE)} title={T.previewHeaderTooltip}>
            {T.previewHeaderTitle}
          </h3>
        </div>
        {!_.isEmpty(renderedVideoUrl) && <span className={cn(RT_VIDEO_GENERATION.PX_2_5_PY_1_ROUNDED_FULL_BG_EMERALD_500)}>{T.readyBadge}</span>}
      </div>
      <div className={cn(RT_VIDEO_GENERATION.W_FULL_BG_SLATE_955_ROUNDED_2XL_OVERFLOW_HIDDEN_RELATIVE)}>
        {!_.isEmpty(renderedVideoUrl) ? (
          <video ref={previewVideoRef} src={renderedVideoUrl} controls preload={SOURCE_TEXT_METADATA} className={cn(RT_VIDEO_GENERATION.W_FULL_H_FULL_OBJECT_CONTAIN_ROUNDED_2XL)} />
        ) : (
          <div className={cn(RT_VIDEO_GENERATION.TEXT_CENTER_P_6_TEXT_SLATE_400_FONT_MONO_TEXT)}>
            <div className={cn(RT_VIDEO_GENERATION.W_12_H_12_ROUNDED_2XL_BG_SLATE_900_80)}>
              <Video className={cn(RT_VIDEO_GENERATION.W_6_H_6_TEXT_SLATE_500)} />
            </div>
            <span className={cn(RT_VIDEO_GENERATION.TEXT_SLATE_400_FONT_MEDIUM_TEXT_XS_LEADING_RELAXED_MAX)}>{T.previewEmpty}</span>
          </div>
        )}
      </div>
      {!_.isEmpty(renderedVideoUrl) && (
        <div className={cn(RT_VIDEO_GENERATION.GRID_GRID_COLS_2_GAP_2_PT_1)}>
          <Button variant={SOURCE_TEXT_SUCCESS} size={REFACTOR_CONSTANTS.SIZE_MD} onClick={handleDownload} className={cn(RT_VIDEO_GENERATION.H_10_MIN_H_40PX_PX_3_FONT_BOLD_TEXT)} title={T.downloadVideoTooltip}>
            <Download className={cn(RT_SHARED.W_4_H_4)} /> {T.downloadVideoBtn}
          </Button>
        </div>
      )}
      {activeCreatedProject && canRegenerate && (
        <div className={cn(RT_VIDEO_GENERATION.GRID_GAP_2_PT_1, { "grid-cols-3": showVoiceRegeneration, "grid-cols-2": !showVoiceRegeneration })}>
          {showVoiceRegeneration && (
            <Button size={REFACTOR_CONSTANTS.SIZE_MD} variant={SOURCE_TEXT_INFO} disabled={isAnyDisabled || !canRegenerate} onClick={() => onRegenerate(REGENERATION_TARGET.VOICE)} title={regenerationTexts.voice} className={cn(RT_VIDEO_GENERATION.H_9_MIN_H_36PX_PX_2_TEXT_11PX_FONT)}>
              {isVoiceActive ? <RefreshCw className={cn(RT_SHARED.W_3_5_H_3_5_ANIMATE_SPIN)} /> : <Mic className={cn(RT_SHARED.W_3_5_H_3_5)} />}
              <span className={cn(RT_SHARED.TRUNCATE)}>{regenerationTexts.voice}</span>
            </Button>
          )}
          <Button size={REFACTOR_CONSTANTS.SIZE_MD} variant={SOURCE_TEXT_PURPLE} disabled={isAnyDisabled || !canRegenerate} onClick={() => (regenerateVideoClips ? setIsSceneDialogOpen(true) : onRegenerate(REGENERATION_TARGET.IMAGES))} title={sceneMediaRegenerationText} className={cn(RT_VIDEO_GENERATION.H_9_MIN_H_36PX_PX_2_TEXT_11PX_FONT)}>
            {isSceneMediaActive ? <RefreshCw className={cn(RT_SHARED.W_3_5_H_3_5_ANIMATE_SPIN)} /> : regenerateVideoClips ? <Video className={cn(RT_SHARED.W_3_5_H_3_5)} /> : <ImageIcon className={cn(RT_SHARED.W_3_5_H_3_5)} />}
            <span className={cn(RT_SHARED.TRUNCATE)}>{sceneMediaRegenerationText}</span>
          </Button>
          <Button size={REFACTOR_CONSTANTS.SIZE_MD} variant={SOURCE_TEXT_SUCCESS} disabled={isAnyDisabled || !canRegenerate} onClick={() => onRegenerate(REGENERATION_TARGET.RENDER)} title={regenerationTexts.render} className={cn(RT_VIDEO_GENERATION.H_9_MIN_H_36PX_PX_2_TEXT_11PX_FONT)}>
            <RefreshCw className={cn(RT_SHARED.W_3_5_H_3_5, { "animate-spin": isRenderActive })} />
            <span className={cn(RT_SHARED.TRUNCATE)}>{regenerationTexts.render}</span>
          </Button>
        </div>
      )}
      <SceneRegenerationDialog isOpen={isSceneDialogOpen} isProcessing={isSceneMediaActive} scenes={_.defaultTo(activeCreatedProject?.storyboard, [])} texts={regenerationTexts} onClose={() => setIsSceneDialogOpen(false)} onConfirm={(sceneId) => onRegenerate(REGENERATION_TARGET.IMAGES, sceneId)} />
    </StudioCard>
  );
};
