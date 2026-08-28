import { cn } from "../../lib/utils";
import React, { useState, useEffect } from "react";
import _ from "lodash";
import { Download, Eye, ImageIcon, Mic, RefreshCw, Sliders, Video } from "lucide-react";
import { Button } from "../ui/Button";
import { REFACTOR_CONSTANTS } from "../../constants";
import { REGENERATION_TARGET } from "../../constants/config";
import { VideoProject } from "../../types";
import { getAutoVideoTexts } from "./autoVideoGeneratorUtils";

interface PreviewPanelSectionProps { renderedVideoUrl: string; projectName: string; activeCreatedProject: VideoProject | null | undefined; isProcessing: boolean; regeneratingTarget?: string | null; onSelectProject: (id: string) => void; handleRegenerate: (target: string) => Promise<void>; T: ReturnType<typeof getAutoVideoTexts>; regenerationTexts: Record<string, string>; }

export const PreviewPanelSection: React.FC<PreviewPanelSectionProps> = ({ renderedVideoUrl, projectName, activeCreatedProject, isProcessing, regeneratingTarget = null, onSelectProject, handleRegenerate, T, regenerationTexts }) => {
  const [loadingTarget, setLoadingTarget] = useState<string | null>(null);

  const onRegenerate = async (target: string) => {
    setLoadingTarget(target);
    try {
      await handleRegenerate(target);
    } finally {
      setLoadingTarget(null);
    }
  };

  useEffect(() => {
    if (!isProcessing) setLoadingTarget(null);
  }, [isProcessing]);

  const isVoiceActive = _.isEqual(loadingTarget, REGENERATION_TARGET.VOICE) || (isProcessing && _.isEqual(regeneratingTarget, REGENERATION_TARGET.VOICE));
  const isImagesActive = _.isEqual(loadingTarget, REGENERATION_TARGET.IMAGES) || (isProcessing && _.isEqual(regeneratingTarget, REGENERATION_TARGET.IMAGES));
  const isRenderActive = _.isEqual(loadingTarget, REGENERATION_TARGET.RENDER) || (isProcessing && _.isEqual(regeneratingTarget, REGENERATION_TARGET.RENDER));
  const isAnyDisabled = isProcessing || !_.isNull(loadingTarget) || !_.isNull(regeneratingTarget);

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = renderedVideoUrl;
    a.download = _.join([projectName, REFACTOR_CONSTANTS.AVG_MP4_SUFFIX], REFACTOR_CONSTANTS.VD_EMPTY_STRING);
    a.click();
  };

  return (
    <div className={cn("bg-slate-900/90 border border-slate-800 p-5 rounded-3xl space-y-4 shadow-xl flex-1 flex flex-col justify-between")}>
      <h3 className={cn("text-xs font-bold text-slate-100 font-mono uppercase flex items-center gap-2")} title={T.previewHeaderTooltip}>
        <Eye className={cn("w-4 h-4 text-amber-400")} /> {T.previewHeaderTitle}
      </h3>

      <div className={cn("flex-1 min-h-[260px] bg-slate-955 rounded-2xl border border-slate-800/80 overflow-hidden relative p-4 shadow-inner")}>
        {!_.isEmpty(renderedVideoUrl) ? (
          <div className={cn("absolute inset-4 flex items-center justify-center")}>
            <video src={renderedVideoUrl} controls className={cn("max-w-full max-h-full object-contain rounded-xl")} autoPlay />
          </div>
        ) : (
          <div className={cn("absolute inset-0 text-center p-6 text-slate-400 font-mono text-xs flex flex-col items-center justify-center gap-3")}>
            <Video className={cn("w-10 h-10 text-slate-600")} />
            <span className={cn("text-slate-400 leading-relaxed max-w-xs block")}>{T.previewEmpty}</span>
          </div>
        )}
      </div>

      {!_.isEmpty(renderedVideoUrl) && (
        <div className={cn("flex gap-2 pt-1")}>
          <Button variant={REFACTOR_CONSTANTS.VARIANT_PRIMARY} size={REFACTOR_CONSTANTS.SIZE_SM} onClick={handleDownload} className={cn("flex-1 bg-emerald-600 hover:bg-emerald-500 border-emerald-500/30 text-white font-bold text-xs")} title={T.downloadVideoTooltip}>
            <Download className={cn("w-4 h-4")} /> {T.downloadVideoBtn}
          </Button>

          {activeCreatedProject && (
            <Button variant={REFACTOR_CONSTANTS.VARIANT_SECONDARY} size={REFACTOR_CONSTANTS.SIZE_SM} onClick={() => onSelectProject(activeCreatedProject.id)} className={cn("flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold")} title={T.openStudioTooltip}>
              <Sliders className={cn("w-4 h-4 text-rose-400")} /> {T.openStudioBtn}
            </Button>
          )}
        </div>
      )}

      {activeCreatedProject && (
        <div className={cn("grid grid-cols-3 gap-2 pt-1")}>
          <Button
            size={REFACTOR_CONSTANTS.SIZE_SM}
            variant={REFACTOR_CONSTANTS.VARIANT_UNSTYLED}
            disabled={isAnyDisabled}
            onClick={() => onRegenerate(REGENERATION_TARGET.VOICE)}
            title={regenerationTexts.voice}
            className={cn("py-2.5 px-2 text-xs font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5 border border-blue-400/30 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white shadow-blue-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer")}>
            {isVoiceActive ? <RefreshCw className={cn("w-4 h-4 text-cyan-100 animate-spin")} /> : <Mic className={cn("w-4 h-4 text-cyan-100")} />}
            <span className={cn("truncate")}>{regenerationTexts.voice}</span>
          </Button>
          <Button
            size={REFACTOR_CONSTANTS.SIZE_SM}
            variant={REFACTOR_CONSTANTS.VARIANT_UNSTYLED}
            disabled={isAnyDisabled}
            onClick={() => onRegenerate(REGENERATION_TARGET.IMAGES)}
            title={regenerationTexts.images}
            className={cn("py-2.5 px-2 text-xs font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5 border border-purple-400/30 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 text-white shadow-purple-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer")}>
            {isImagesActive ? <RefreshCw className={cn("w-4 h-4 text-pink-100 animate-spin")} /> : <ImageIcon className={cn("w-4 h-4 text-pink-100")} />}
            <span className={cn("truncate")}>{regenerationTexts.images}</span>
          </Button>
          <Button
            size={REFACTOR_CONSTANTS.SIZE_SM}
            variant={REFACTOR_CONSTANTS.VARIANT_UNSTYLED}
            disabled={isAnyDisabled}
            onClick={() => onRegenerate(REGENERATION_TARGET.RENDER)}
            title={regenerationTexts.render}
            className={cn("py-2.5 px-2 text-xs font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5 border border-emerald-400/30 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-emerald-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer")}>
            <RefreshCw className={`w-4 h-4 text-teal-100 ${isRenderActive ? "animate-spin" : ""}`} />
            <span className={cn("truncate")}>{regenerationTexts.render}</span>
          </Button>
        </div>
      )}
    </div>
  );
};
