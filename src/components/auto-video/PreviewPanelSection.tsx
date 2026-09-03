import { cn } from "../../lib/utils";
import React, { useState, useEffect, useRef } from "react";
import _ from "lodash";
import { Download, Eye, ImageIcon, Mic, RefreshCw, Sliders, Video } from "lucide-react";
import { Button } from "../ui/Button";
import { REFACTOR_CONSTANTS } from "../../constants";
import { REGENERATION_TARGET, REGENERATION_TEXTS } from "../../constants/config";
import { VideoProject } from "../../types";
import { getAutoVideoTexts } from "./autoVideoGeneratorUtils";
import { usePausedVideoPreview } from "../../hooks/usePausedVideoPreview";
import { SceneRegenerationDialog } from "./SceneRegenerationDialog";

interface PreviewPanelSectionProps {
  renderedVideoUrl: string;
  projectName: string;
  activeCreatedProject: VideoProject | null | undefined;
  isProcessing: boolean;
  regeneratingTarget?: string | null;
  onSelectProject: (id: string) => void;
  handleRegenerate: (target: string, sceneId?: string) => Promise<void>;
  T: ReturnType<typeof getAutoVideoTexts>;
  regenerationTexts: (typeof REGENERATION_TEXTS)[keyof typeof REGENERATION_TEXTS];
  showVoiceRegeneration?: boolean;
  regenerateVideoClips?: boolean;
}

export const PreviewPanelSection: React.FC<PreviewPanelSectionProps> = ({
  renderedVideoUrl,
  projectName,
  activeCreatedProject,
  isProcessing,
  regeneratingTarget = null,
  onSelectProject,
  handleRegenerate,
  T,
  regenerationTexts,
  showVoiceRegeneration = true,
  regenerateVideoClips = false,
}) => {
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
    const a = document.createElement("a");
    a.href = renderedVideoUrl;
    a.download = _.join([projectName, REFACTOR_CONSTANTS.AVG_MP4_SUFFIX], REFACTOR_CONSTANTS.VD_EMPTY_STRING);
    a.click();
  };

  return (
    <div className={cn("glass-card bg-slate-900/80 p-5 rounded-3xl space-y-4 shadow-xl flex flex-col justify-between w-full text-left")}>
      <div className={cn("flex items-center justify-between border-b border-slate-800 pb-3")}>
        <div className={cn("flex items-center gap-2")}>
          <span className={cn("w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center")}>
            <Eye className={cn("w-4 h-4 text-amber-400")} />
          </span>
          <h3 className={cn("text-xs font-bold text-slate-100 font-mono uppercase tracking-wider")} title={T.previewHeaderTooltip}>
            {T.previewHeaderTitle}
          </h3>
        </div>
        {!_.isEmpty(renderedVideoUrl) && (
          <span className={cn("px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-bold font-mono shadow-sm")}>🟢 Sẵn sàng</span>
        )}
      </div>

      <div
        className={cn(
          "w-full bg-slate-955 rounded-2xl overflow-hidden relative shadow-inner flex items-center justify-center min-h-[190px] sm:min-h-[210px] max-h-[250px] aspect-video mx-auto",
        )}>
        {!_.isEmpty(renderedVideoUrl) ? (
          <video ref={previewVideoRef} src={renderedVideoUrl} controls preload="metadata" className={cn("w-full h-full object-contain rounded-2xl")} />
        ) : (
          <div className={cn("text-center p-6 text-slate-400 font-mono text-xs flex flex-col items-center justify-center gap-2.5 select-none")}>
            <div className={cn("w-12 h-12 rounded-2xl bg-slate-900/80 flex items-center justify-center shadow-inner")}>
              <Video className={cn("w-6 h-6 text-slate-500")} />
            </div>
            <span className={cn("text-slate-400 font-medium text-xs leading-relaxed max-w-xs block")}>{T.previewEmpty}</span>
          </div>
        )}
      </div>

      {!_.isEmpty(renderedVideoUrl) && (
        <div className={cn("grid grid-cols-2 gap-2 pt-1")}>
          <Button
            variant="success"
            size={REFACTOR_CONSTANTS.SIZE_MD}
            onClick={handleDownload}
            className={cn("h-10 min-h-[40px] px-3 font-bold text-xs rounded-xl flex items-center justify-center gap-2")}
            title={T.downloadVideoTooltip}>
            <Download className={cn("w-4 h-4")} /> {T.downloadVideoBtn}
          </Button>

          {activeCreatedProject && (
            <Button
              variant="primary"
              size={REFACTOR_CONSTANTS.SIZE_MD}
              onClick={() => onSelectProject(activeCreatedProject.id)}
              className={cn("h-10 min-h-[40px] px-3 text-xs font-bold rounded-xl flex items-center justify-center gap-2")}
              title={T.openStudioTooltip}>
              <Sliders className={cn("w-4 h-4")} /> {T.openStudioBtn}
            </Button>
          )}
        </div>
      )}

      {activeCreatedProject && (
        <div className={cn("grid gap-2 pt-1", showVoiceRegeneration ? "grid-cols-3" : "grid-cols-2")}>
          {showVoiceRegeneration && (
            <Button
              size={REFACTOR_CONSTANTS.SIZE_MD}
              variant="info"
              disabled={isAnyDisabled}
              onClick={() => onRegenerate(REGENERATION_TARGET.VOICE)}
              title={regenerationTexts.voice}
              className={cn("h-9 min-h-[36px] px-2 text-[11px] font-bold rounded-xl flex items-center justify-center gap-1.5")}>
              {isVoiceActive ? <RefreshCw className={cn("w-3.5 h-3.5 animate-spin")} /> : <Mic className={cn("w-3.5 h-3.5")} />}
              <span className={cn("truncate")}>{regenerationTexts.voice}</span>
            </Button>
          )}
          <Button
            size={REFACTOR_CONSTANTS.SIZE_MD}
            variant="purple"
            disabled={isAnyDisabled}
            onClick={() => (regenerateVideoClips ? setIsSceneDialogOpen(true) : onRegenerate(REGENERATION_TARGET.IMAGES))}
            title={sceneMediaRegenerationText}
            className={cn("h-9 min-h-[36px] px-2 text-[11px] font-bold rounded-xl flex items-center justify-center gap-1.5")}>
            {isSceneMediaActive ? (
              <RefreshCw className={cn("w-3.5 h-3.5 animate-spin")} />
            ) : regenerateVideoClips ? (
              <Video className={cn("w-3.5 h-3.5")} />
            ) : (
              <ImageIcon className={cn("w-3.5 h-3.5")} />
            )}
            <span className={cn("truncate")}>{sceneMediaRegenerationText}</span>
          </Button>
          <Button
            size={REFACTOR_CONSTANTS.SIZE_MD}
            variant="success"
            disabled={isAnyDisabled}
            onClick={() => onRegenerate(REGENERATION_TARGET.RENDER)}
            title={regenerationTexts.render}
            className={cn("h-9 min-h-[36px] px-2 text-[11px] font-bold rounded-xl flex items-center justify-center gap-1.5")}>
            <RefreshCw className={cn("w-3.5 h-3.5", { "animate-spin": isRenderActive })} />
            <span className={cn("truncate")}>{regenerationTexts.render}</span>
          </Button>
        </div>
      )}

      <SceneRegenerationDialog
        isOpen={isSceneDialogOpen}
        isProcessing={isSceneMediaActive}
        scenes={_.defaultTo(activeCreatedProject?.storyboard, [])}
        texts={regenerationTexts}
        onClose={() => setIsSceneDialogOpen(false)}
        onConfirm={(sceneId) => onRegenerate(REGENERATION_TARGET.IMAGES, sceneId)}
      />
    </div>
  );
};
