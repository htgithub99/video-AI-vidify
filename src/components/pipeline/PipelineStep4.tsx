import { cn } from "../../lib/utils";
import { formatCleanTime } from "../../lib/timeUtils";
import { PipelineWizardState } from "./usePipelineWizard";
import * as LucideIcons from "lucide-react";
import { Button } from "../ui/Button";
import React, { useRef, useState, useEffect } from "react";
import { WizardStep } from "../../types";
import { EXPORT_TYPES, EXPORT_URLS, PLAYER_SIMULATION_CONFIG } from "../../constants";
import { appError } from "../../lib/logger";

const { Eye, Download, Video, ArrowLeft, Play, Pause, Maximize, Settings2 } = LucideIcons as any;

export default function PipelineStep4(props: PipelineWizardState) {
  const { t, setCurrentStep, setInfoMsg, getMotionLabel, isOfflineRendering, isPlayingSim, simActiveScene, handleOfflineRenderWebM, startPlaybackSim, stopPlaybackSim, getSceneImageUrl, handleDownloadJSONProject, handleDownloadSRT, handleDownloadCapcutLink, handleDownloadPremiereXML, loadingExportType } = props;

  const playerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fakeProgress, setFakeProgress] = useState<number>(PLAYER_SIMULATION_CONFIG.MIN_PROGRESS);

  useEffect(() => {
    let interval: any;
    if (isPlayingSim) {
      interval = setInterval(() => {
        setFakeProgress((prev) => {
          if (prev >= PLAYER_SIMULATION_CONFIG.MAX_PROGRESS_PERCENT) return PLAYER_SIMULATION_CONFIG.MIN_PROGRESS;
          return prev + PLAYER_SIMULATION_CONFIG.PROGRESS_STEP;
        });
      }, PLAYER_SIMULATION_CONFIG.PROGRESS_INTERVAL_MS);
    } else {
      setFakeProgress(PLAYER_SIMULATION_CONFIG.MIN_PROGRESS);
    }
    return () => clearInterval(interval);
  }, [isPlayingSim]);

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(
      PLAYER_SIMULATION_CONFIG.MIN_PROGRESS,
      Math.min(PLAYER_SIMULATION_CONFIG.MAX_PROGRESS_PERCENT, (x / rect.width) * PLAYER_SIMULATION_CONFIG.MAX_PROGRESS_PERCENT)
    );
    setFakeProgress(percentage);
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      playerRef.current?.requestFullscreen().catch((err) => {
        appError(t.fullscreenError.replace("{error}", err.message));
      });
    } else {
      document.exitFullscreen();
    }
  };

  const getZoomClass = (motion: string) => {
    if (!isPlayingSim) return "";
    if (PLAYER_SIMULATION_CONFIG.ZOOM_IN_MOTIONS.includes(motion)) return "scale-110";
    if (PLAYER_SIMULATION_CONFIG.ZOOM_OUT_MOTIONS.includes(motion)) return "scale-90";
    return "";
  };

  const exportButtons = [
    {
      id: EXPORT_TYPES.CAPCUT,
      label: t.exportCapcut,
      loadingLabel: t.exportingCapcut,
      desc: t.Exports_timeline_JSON_fil,
      handler: handleDownloadCapcutLink,
      icon: Download,
      isLoading: loadingExportType === EXPORT_TYPES.CAPCUT,
    },
    {
      id: EXPORT_TYPES.PREMIERE,
      label: t.exportPremiere,
      loadingLabel: t.exportingPremiere,
      desc: t.Construct_XML_track_metad,
      handler: handleDownloadPremiereXML,
      icon: Download,
      isLoading: loadingExportType === EXPORT_TYPES.PREMIERE,
    },
    {
      id: EXPORT_TYPES.PREMIERE,
      label: t.exportDavinci,
      loadingLabel: t.exportingDavinci,
      desc: t.Download_FCPXML_timing_fi,
      handler: handleDownloadPremiereXML,
      icon: Download,
      isLoading: loadingExportType === EXPORT_TYPES.PREMIERE,
    },
    {
      id: "offline_render",
      label: t.renderingWebM,
      loadingLabel: t.exportingVideo,
      desc: t.Render_and_compile_full_p,
      handler: handleOfflineRenderWebM,
      icon: Video,
      isLoading: isOfflineRendering,
      isPrimary: true,
    },
    {
      id: EXPORT_TYPES.ZIP,
      label: t.downloadZip,
      loadingLabel: t.packagingZip,
      desc: t.Download_complete_CapCut_,
      handler: handleDownloadJSONProject,
      icon: Download,
      isLoading: loadingExportType === EXPORT_TYPES.ZIP,
    },
    {
      id: EXPORT_TYPES.SRT,
      label: t.Download_SRT,
      loadingLabel: t.exportingSRT,
      desc: t.Extract_synced_subtitle_t,
      handler: handleDownloadSRT,
      icon: Download,
      isLoading: loadingExportType === EXPORT_TYPES.SRT,
    },
  ];

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-gradient-to-b from-slate-900/90 to-slate-950/95 border border-slate-800/85 p-6 rounded-xl space-y-4 shadow-2xl relative overflow-visible">
          <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/[0.03] rounded-full blur-3xl pointer-events-none" />
          <h3 className="font-bold text-slate-100 text-base flex items-center gap-2 relative z-10">
            <Eye className="w-5 h-5 text-rose-500" />
            {t.renderTitle}
          </h3>

          <div 
            ref={playerRef} 
            className={cn("bg-black border border-slate-800/80 relative overflow-hidden group shadow-2xl flex flex-col", isFullscreen ? "fixed inset-0 z-50 rounded-none w-screen h-screen flex items-center justify-center" : "aspect-[16/9] rounded-xl ring-1 ring-white/5")}
          >
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/80 to-transparent z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            <div className="absolute inset-0 flex items-center justify-center z-0">
              {simActiveScene ? (
                <>
                  {getSceneImageUrl(simActiveScene) ? (
                    <div className="w-full h-full relative bg-slate-900">
                      <img referrerPolicy="no-referrer" src={getSceneImageUrl(simActiveScene)} alt={t.rendering_visual} className={cn(`w-full h-full object-cover transition-transform duration-1000 ${getZoomClass(simActiveScene.cameraMotion)}`)} />
                      {!simActiveScene.assetUrl && <div className="absolute top-4 right-4 bg-rose-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg z-20">{t.Default_Timeline_Image}</div>}
                    </div>
                  ) : (
                    <div className="text-center p-6 text-slate-500 font-mono text-xs w-full h-full flex items-center justify-center bg-slate-950">{t.noPhotoRenderedYet?.replace("{sceneId}", simActiveScene.id)}</div>
                  )}

                  <div className="absolute bottom-16 left-4 right-4 text-center z-20 pointer-events-none">
                    <span 
                      className="bg-black/60 backdrop-blur-sm text-yellow-400 font-bold px-5 py-2 rounded-md border border-white/5 text-sm sm:text-base md:text-lg font-sans tracking-wide drop-shadow-2xl inline-block max-w-[90%] pointer-events-auto"
                      style={{ textShadow: "1px 1px 3px rgba(0,0,0,0.9)" }}
                    >
                      {simActiveScene.subtitle}
                    </span>
                  </div>

                  <div className="absolute top-4 left-4 z-20 flex flex-col pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span className="text-white font-bold text-base md:text-lg drop-shadow-md">
                      {t.Scene}: {simActiveScene.id}
                    </span>
                    <span className="text-slate-300 text-xs md:text-sm drop-shadow-md font-medium mt-1">
                      {t.Camera_VFX}: {getMotionLabel(simActiveScene.cameraMotion)}
                    </span>
                  </div>
                </>
              ) : (
                <div className="text-center text-slate-500 text-xs w-full h-full flex items-center justify-center bg-slate-950">{t.Nothing_to_simulate}</div>
              )}
            </div>

            {!isPlayingSim && simActiveScene && (
              <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/20 group-hover:bg-black/40 transition-colors pointer-events-none">
                <div className="w-16 h-16 rounded-full bg-black/60 flex items-center justify-center text-white backdrop-blur-md border border-white/10 shadow-2xl opacity-80 group-hover:opacity-100 transform scale-90 group-hover:scale-100 transition-all pointer-events-auto cursor-pointer hover:bg-rose-600 hover:border-rose-500" onClick={startPlaybackSim}>
                  <Play className="w-8 h-8 fill-current ml-1" />
                </div>
              </div>
            )}

            <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black/95 via-black/60 to-transparent z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

            <div className="absolute bottom-0 left-0 right-0 z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end px-3 pb-2 pt-6">
              
              <div 
                className="w-full h-[3px] group-hover/progress:h-[5px] bg-white/20 cursor-pointer mb-3 relative group/progress flex items-center transition-all duration-150 ease-out"
                onClick={handleSeek}
              >
                <div 
                  className="h-full bg-rose-600 relative z-10 transition-none"
                  style={{ width: `${fakeProgress}%` }}
                >
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-rose-600 rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity translate-x-1/2 shadow-[0_0_5px_rgba(225,29,72,0.8)]"></div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={isPlayingSim ? stopPlaybackSim : startPlaybackSim}
                    className="text-white hover:text-rose-500 transition-colors outline-none focus:outline-none p-1"
                    title={isPlayingSim ? t.Stop_Simulation : t.Play_Simulation}
                  >
                    {isPlayingSim ? (
                      <Pause className="w-6 h-6 fill-current" />
                    ) : (
                      <Play className="w-6 h-6 fill-current" />
                    )}
                  </button>
                  
                  <div className="text-[12px] md:text-sm font-bold font-sans text-white flex items-center gap-1.5 drop-shadow-md">
                    {simActiveScene ? (
                      <>
                        <span className="tracking-wide">{formatCleanTime(simActiveScene.startTime)}</span>
                        <span className="text-white/60 mx-0.5">/</span>
                        <span className="text-white/80 tracking-wide">{formatCleanTime(simActiveScene.endTime)}</span>
                      </>
                    ) : (
                      <span className="text-white/60">{t.PAUSED}</span>
                    )}
                    <span className={cn("ml-4 text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider shadow-sm", isPlayingSim ? "bg-rose-600 text-white" : "bg-white/20 text-white")}>
                      {isPlayingSim ? t.ACTIVE_RUNNING : t.PAUSED}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-white">
                  <button className="p-1 hover:bg-white/10 rounded-full transition-colors outline-none" title={t.Settings || "Cấu hình"}>
                    <Settings2 className="w-5 h-5 cursor-pointer" />
                  </button>
                  <button onClick={toggleFullscreen} className="p-1 hover:bg-white/10 rounded-full transition-colors outline-none" title={t.Fullscreen || "Toàn màn hình"}>
                    <Maximize className="w-5 h-5 cursor-pointer" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
 
        <div className="bg-gradient-to-b from-slate-900/90 to-slate-950/95 border border-slate-800/85 p-6 rounded-xl space-y-6 shadow-2xl relative overflow-visible">
          <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/[0.03] rounded-full blur-3xl pointer-events-none" />
          <h3 className="font-bold text-slate-100 text-base relative z-10">{t.Professional_Project_Pack}</h3>
 
          <div className="grid grid-cols-1 gap-3.5 text-xs">
            {exportButtons.map((btn, index) => {
              const Icon = btn.icon;
              return (
                <Button 
                  key={index}
                  variant="ghost" 
                  onClick={btn.handler} 
                  disabled={btn.isLoading} 
                  className={cn("w-full flex items-center justify-between p-3.5 rounded-xl text-left h-auto shrink-0 shadow-none flex-row gap-4 border", 
                    btn.isPrimary 
                      ? (btn.isLoading ? "bg-slate-950 border-slate-900 text-slate-500 hover:bg-slate-950" : "bg-gradient-to-r from-rose-950/30 to-slate-950 hover:to-slate-850 border-rose-950 text-slate-200 hover:text-slate-100") 
                      : "bg-slate-950 hover:bg-slate-850 border-slate-800 text-slate-200 hover:text-slate-100")}
                  title={btn.desc}
                >
                  <div className="text-left flex-1">
                    <span className={cn("font-bold block flex items-center gap-1.5", btn.isPrimary && !btn.isLoading ? "text-rose-400" : "")}>
                      {btn.isLoading ? <span className="inline-block w-2 h-2 rounded-full bg-rose-500 animate-pulse" /> : (btn.isPrimary && <span className="inline-block w-2 h-2 rounded-full bg-rose-500" />)}
                      {btn.isLoading ? btn.loadingLabel : btn.label}
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5 font-normal text-left">{btn.desc}</span>
                  </div>
                  {btn.isLoading ? <div className="w-5 h-5 rounded-full border-2 border-rose-500 border-t-transparent animate-spin shrink-0" /> : <Icon className={cn("w-5 h-5 shrink-0", btn.isPrimary ? "text-rose-500" : "text-slate-400")} />}
                </Button>
              )
            })}
          </div>
 
          <div className="bg-slate-900 border border-slate-850 p-4 rounded-xl space-y-2">
            <span className="text-[10px] text-slate-500 font-mono font-bold block uppercase">{t.Cloud_Exporter_Sync_Setup}</span>
            <div className="flex gap-2">
              <input type="text" placeholder={EXPORT_URLS.DEFAULT_S3_BUCKET} className="w-full bg-slate-900 text-slate-350 text-[11px] p-2 rounded focus:outline-none placeholder-slate-600 border border-slate-800" />
              <Button variant="primary" size="xs" onClick={() => setInfoMsg(t.Configured_bucket_coordin)} title={t.Save}>
                {t.Save}
              </Button>
            </div>
          </div>
 
          <div className="pt-4 border-t border-slate-800 flex items-center justify-start mt-6">
            <Button 
              variant="secondary" 
              size="md" 
              onClick={() => setCurrentStep(WizardStep.SEOBoost)} 
              className="flex items-center gap-1.5 px-5 py-3 shadow"
              title={t.Back}
            >
              <ArrowLeft className="w-4 h-4" />
              {t.Back}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
