import { cn } from "../../lib/utils";
import { formatCleanTime } from "../../lib/timeUtils";
import { PipelineWizardState } from "./usePipelineWizard";
import * as LucideIcons from "lucide-react";
import { Button } from "../ui/Button";
import { Tooltip } from "../ui/Tooltip";
import React, { useRef, useState, useEffect } from "react";
import { WizardStep } from "../../types";
import { EXPORT_TYPES, PLAYER_SIMULATION_CONFIG, API_ROUTES, PIPELINE_STEP4_TEXTS, REFACTOR_CONSTANTS } from "../../constants";
import { PIPELINE_STEP4_SHORT_TEXTS } from "../../constants/texts";
import { VideoQuality, ResourceSourceMode, FolderSelectionType } from "../../constants/enums";
import { logger } from "../../utils/logger";
import { safeSystemFetch } from "../../lib/shared-utils";
import _ from "lodash";

const { Eye, Download, ArrowLeft, Play, Pause, Maximize, Settings2 } = LucideIcons as any;

export default function PipelineStep4(props: PipelineWizardState) {
  const { t, setCurrentStep, isPlayingSim, simActiveScene, startPlaybackSim, stopPlaybackSim, getSceneImageUrl, handleDownloadJSONProject, loadingExportType } = props;
  const currentLang = (props as any).currentLang === "en" ? "en" : "vi";
  const shortTexts = PIPELINE_STEP4_SHORT_TEXTS[currentLang];


  const playerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [previewVideoUrl, setPreviewVideoUrl] = useState("");
  const [ffmpegQuality, setFfmpegQuality] = useState<VideoQuality>(VideoQuality.HIGH);
  const [projectName, setProjectName] = useState(props.project?.name || "");
  const [inputMode, setInputMode] = useState<ResourceSourceMode>(ResourceSourceMode.CURRENT);
  const [parentFolder, setParentFolder] = useState("");
  const [imagesDir, setImagesDir] = useState("");
  const [voicesDir, setVoicesDir] = useState("");
  const [isRenderLoading, setIsRenderLoading] = useState(false);

  const handleSelectFolder = async (type: string) => {
    try {
      const response = await safeSystemFetch(API_ROUTES.PIPELINE_SELECT_FOLDER, {});
      if (response.success && response.data?.folderPath) {
        if (type === FolderSelectionType.PARENT) {
          setParentFolder(response.data.folderPath);
        } else if (type === FolderSelectionType.IMAGES) {
          setImagesDir(response.data.folderPath);
        } else if (type === FolderSelectionType.VOICES) {
          setVoicesDir(response.data.folderPath);
        }
      }
    } catch (err: any) {
      props.setInfoMsg(PIPELINE_STEP4_TEXTS.FOLDER_SELECT_ERR + err.message);
    }
  };

  const isValidToRender = () => {
    if (_.isEmpty(props.project?.storyboard)) {
      props.setInfoMsg(PIPELINE_STEP4_TEXTS.ERR_REQUIRE_STORYBOARD);
      return false;
    }
    const missingImages = _.some(props.project.storyboard, sc => !getSceneImageUrl(sc));
    if (missingImages) {
      props.setInfoMsg(PIPELINE_STEP4_TEXTS.ERR_REQUIRE_IMAGES);
      return false;
    }
    const hasVoice = !!props.project?.voiceConfig?.audioBase64 || _.some(props.project.storyboard, sc => !!sc.audioBase64);
    if (!hasVoice) {
      props.setInfoMsg(PIPELINE_STEP4_TEXTS.ERR_REQUIRE_AUDIO);
      return false;
    }
    return true;
  };

  const handleOfflineRenderFFmpeg = async () => {
    if (!isValidToRender()) return;
    setIsRenderLoading(true);
    props.setInfoMsg(PIPELINE_STEP4_TEXTS.RENDERING_WAIT);
    try {
      const payload = {
        scenes: _.map(props.project.storyboard, sc => ({
            id: sc.id,
            duration: sc.duration,
            imageBase64: getSceneImageUrl(sc), 
            audioBase64: sc.audioBase64 
        })),
        globalAudioUrl: props.project?.voiceConfig?.audioBase64,
        quality: ffmpegQuality
      };
      
      const response = await fetch(API_ROUTES.PIPELINE_FFMPEG_RENDER, {
         method: REFACTOR_CONSTANTS.HTTP_METHOD_POST,
         headers: { [REFACTOR_CONSTANTS.HEADER_CONTENT_TYPE]: REFACTOR_CONSTANTS.MIME_JSON },
         body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (data.success && data.jobId) {
         const jobId = data.jobId;
         const checkStatus = setInterval(async () => {
           try {
             const statusRes = await fetch(`${API_ROUTES.PIPELINE_FFMPEG_RENDER}${REFACTOR_CONSTANTS.PATH_STATUS}${jobId}`);
             const statusData = await statusRes.json();
             if (statusData.success) {
               if (_.eq(statusData.status, REFACTOR_CONSTANTS.STATUS_COMPLETED)) {
                 clearInterval(checkStatus);
                 setPreviewVideoUrl(statusData.url);
                 props.setInfoMsg(PIPELINE_STEP4_TEXTS.RENDER_FFMPEG_SUCCESS);
                 setIsRenderLoading(false);
               } else if (_.eq(statusData.status, REFACTOR_CONSTANTS.STATUS_FAILED)) {
                 clearInterval(checkStatus);
                 props.setInfoMsg(PIPELINE_STEP4_TEXTS.RENDER_FFMPEG_ERR + REFACTOR_CONSTANTS.ERR_UNKNOWN);
                 setIsRenderLoading(false);
               } else {
                 props.setInfoMsg(`${REFACTOR_CONSTANTS.MSG_RENDERING_PREFIX}${statusData.progress || 0}${REFACTOR_CONSTANTS.MSG_PERCENT_SUFFIX}`);
               }
             } else {
               clearInterval(checkStatus);
               props.setInfoMsg(PIPELINE_STEP4_TEXTS.RENDER_FFMPEG_ERR + REFACTOR_CONSTANTS.ERR_STATUS_FAILED);
               setIsRenderLoading(false);
             }
           } catch (err: any) {
             clearInterval(checkStatus);
             props.setInfoMsg(PIPELINE_STEP4_TEXTS.RENDER_FFMPEG_ERR + REFACTOR_CONSTANTS.ERR_UNKNOWN);
             setIsRenderLoading(false);
           }
         }, REFACTOR_CONSTANTS.POLLING_INTERVAL_MS);
      } else {
         props.setInfoMsg(PIPELINE_STEP4_TEXTS.RENDER_FFMPEG_ERR + REFACTOR_CONSTANTS.ERR_QUEUE);
         setIsRenderLoading(false);
      }
    } catch (e: any) {
      props.setInfoMsg(PIPELINE_STEP4_TEXTS.RENDER_FFMPEG_ERR + REFACTOR_CONSTANTS.ERR_UNKNOWN);
      setIsRenderLoading(false);
    }
  };
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
        logger.error(t.fullscreenError.replace("{error}", err.message));
      });
    } else {
      document.exitFullscreen();
    }
  };
  const exportButtons: any[] = [
    {
      id: EXPORT_TYPES.ZIP,
      label: shortTexts.ZIP_BTN,
      loadingLabel: t.packagingZip,
      desc: shortTexts.ZIP_TOOLTIP,
      handler: handleDownloadJSONProject,
      icon: Download,
      isLoading: loadingExportType === EXPORT_TYPES.ZIP,
    }
  ];

  return (
    <div className="bg-gradient-to-b from-slate-900/90 to-slate-950/95 border border-slate-800/85 p-6 md:p-8 rounded-2xl shadow-2xl space-y-6 relative overflow-visible">
      <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[inherit]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/[0.03] rounded-full blur-3xl pointer-events-none" />
      </div>
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900/40 border border-slate-850 backdrop-blur-sm p-6 rounded-xl space-y-4 shadow-xl relative overflow-visible z-30">
          <h3 className="font-bold text-slate-100 text-base flex items-center gap-2 relative z-20">
            <Tooltip content={shortTexts.RENDER_TITLE_TOOLTIP} position="bottom" align="start">
              <span className="flex items-center gap-2 cursor-help"><Eye className="w-5 h-5 text-rose-500" /> {shortTexts.RENDER_TITLE}</span>
            </Tooltip>
          </h3>

          <div 
            ref={playerRef} 
            className={cn("bg-black border border-slate-800/80 relative overflow-hidden group shadow-2xl flex flex-col", isFullscreen ? "fixed inset-0 z-50 rounded-none w-screen h-screen flex items-center justify-center" : "aspect-[16/9] rounded-xl ring-1 ring-white/5")}
          >
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/80 to-transparent z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            <div className="absolute inset-0 flex items-center justify-center z-0">
              {isRenderLoading ? (
                 <div className="text-white flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-xs font-mono tracking-widest uppercase">{PIPELINE_STEP4_TEXTS.EXPORTING_FFMPEG}</span>
                 </div>
              ) : previewVideoUrl ? (
                 <video ref={videoRef} src={previewVideoUrl} controls className="w-full h-full object-cover z-20" autoPlay />
              ) : (
                 <div className="text-center p-6 text-slate-500 font-mono text-xs w-full h-full flex flex-col items-center justify-center bg-slate-950">
                    <div className="mb-4">{t.Nothing_to_simulate || PIPELINE_STEP4_TEXTS.NO_FFMPEG_VIDEO}</div>
                    <div className="text-[11px] text-slate-600">{PIPELINE_STEP4_TEXTS.USE_CREATE_BTN_HINT}</div>
                 </div>
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
          
          {previewVideoUrl && (
            <div className="flex justify-end pt-3">
              <Button 
                variant="primary" 
                size="md"
                onClick={() => {
                  const a = document.createElement("a");
                  a.style.display = "none";
                  a.href = previewVideoUrl;
                  a.download = `${projectName.replace(/\s+/g, "_") || 'project'}_HD.mp4`;
                  document.body.appendChild(a);
                  a.click();
                  setTimeout(() => {
                    document.body.removeChild(a);
                  }, 150);
                }}
                className="bg-emerald-600 hover:bg-emerald-500 border-emerald-500/50 shadow-lg text-white font-bold flex items-center gap-2"
                title={PIPELINE_STEP4_TEXTS.BTN_DOWNLOAD_HINT}
              >
                <Download className="w-4 h-4" />
                {PIPELINE_STEP4_TEXTS.BTN_DOWNLOAD}
              </Button>
            </div>
          )}
        </div>

        <div className="flex flex-col space-y-6 relative z-40">
          <div className="bg-slate-900/40 border border-slate-850 backdrop-blur-sm p-6 rounded-xl space-y-5 shadow-xl relative overflow-visible z-50">
            <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[inherit]">
              <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-2xl pointer-events-none" />
            </div>
            
            <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2 relative z-20 border-b border-slate-800/60 pb-3">
              <Tooltip content="Tuỳ chỉnh tên dự án, thư mục lưu trữ và tài nguyên âm thanh/hình ảnh để chuẩn bị cho quá trình tạo video." position="bottom" align="start">
                <span className="flex items-center gap-2 cursor-help"><Settings2 className="w-4 h-4 text-slate-400" /> Cấu Hình Đầu Ra</span>
              </Tooltip>
            </h3>
            
            <div className="space-y-4 relative z-10">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 font-mono mb-2">
                  <Tooltip content="Đặt tên cho video của bạn. Tên này sẽ được dùng làm tên thư mục và tên file video khi xuất bản." position="top">
                    <span className="flex items-center gap-1.5 cursor-help"><LucideIcons.FileText className="w-3.5 h-3.5 text-rose-500" /> Tên Video</span>
                  </Tooltip>
                </label>
                <input 
                  type="text" 
                  value={projectName} 
                  onChange={(e) => setProjectName(e.target.value)} 
                  placeholder={PIPELINE_STEP4_TEXTS.PROJECT_NAME_PLACEHOLDER} 
                  className="w-full bg-slate-950/80 border border-slate-800/80 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20 rounded-xl px-4 h-10 text-xs text-slate-200 shadow-inner transition-all outline-none" 
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 font-mono mb-2">
                  <Tooltip content="Chọn cách thức hệ thống lấy hình ảnh và âm thanh để ghép vào video." position="top">
                    <span className="flex items-center gap-1.5 cursor-help"><LucideIcons.Database className="w-3.5 h-3.5 text-rose-500" /> Nguồn Tài Nguyên</span>
                  </Tooltip>
                </label>
                <div className="grid grid-cols-3 bg-slate-950/50 p-1.5 rounded-lg border border-slate-800/80 w-full gap-1">
                  {[
                    { id: ResourceSourceMode.ZIP, label: 'File ZIP', tooltip: 'Hệ thống tự giải nén và sử dụng hình ảnh, âm thanh từ thư mục .zip hoặc thư mục dự án bạn chọn.', align: 'start' as const },
                    { id: ResourceSourceMode.SPLIT, label: 'Thư mục Riêng', tooltip: 'Trỏ đường dẫn thủ công đến 2 thư mục riêng biệt: Một chứa ảnh, một chứa âm thanh.', align: 'center' as const },
                    { id: ResourceSourceMode.CURRENT, label: 'Dự Án Hiện Tại', tooltip: 'Tự động sử dụng trực tiếp các hình ảnh và âm thanh mà bạn vừa tạo ở các bước trước.', align: 'end' as const }
                  ].map(mode => (
                    <div key={mode.id} className="flex [&>div]:w-full">
                      <Tooltip content={mode.tooltip} position="top" align={mode.align}>
                        <button 
                          onClick={() => setInputMode(mode.id)} 
                          className={cn(
                            "w-full px-3 py-1.5 text-[9px] font-bold uppercase rounded-md transition-all duration-200", 
                            inputMode === mode.id 
                              ? "bg-slate-800 text-white shadow-md ring-1 ring-white/10" 
                              : "text-slate-500 hover:text-slate-300 hover:bg-slate-900/50"
                          )}
                        >
                          {mode.label}
                        </button>
                      </Tooltip>
                    </div>
                  ))}
                </div>

                {inputMode === ResourceSourceMode.ZIP ? (
                  <div className="flex gap-2 animate-fadeIn mt-3">
                    <input type="text" value={parentFolder} onChange={(e) => setParentFolder(e.target.value)} placeholder={PIPELINE_STEP4_TEXTS.ZIP_DIR_PLACEHOLDER} className="flex-1 bg-slate-950/80 border border-slate-800/80 focus:border-rose-500/50 rounded-xl px-4 h-10 text-xs text-slate-200 shadow-inner outline-none" />
                    <Button type="button" variant="ghost" onClick={() => handleSelectFolder(FolderSelectionType.PARENT)} className="px-4 h-10 bg-slate-950/80 hover:bg-slate-900 border border-slate-800/80 rounded-xl text-slate-400 transition-colors">
                      <LucideIcons.FolderOpen className="w-4 h-4 text-rose-500" />
                    </Button>
                  </div>
                ) : inputMode === ResourceSourceMode.SPLIT ? (
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 animate-fadeIn mt-3">
                    <div className="flex gap-1.5">
                      <input type="text" value={imagesDir} onChange={(e) => setImagesDir(e.target.value)} placeholder={PIPELINE_STEP4_TEXTS.IMG_DIR_PLACEHOLDER} className="flex-1 w-0 bg-slate-950/80 border border-slate-800/80 focus:border-rose-500/50 rounded-xl px-3 h-10 text-xs text-slate-200 shadow-inner outline-none" />
                      <Button type="button" variant="ghost" onClick={() => handleSelectFolder(FolderSelectionType.IMAGES)} className="px-3 h-10 shrink-0 bg-slate-950/80 border border-slate-800/80 rounded-xl text-slate-400 hover:text-rose-400 transition-colors">
                        <LucideIcons.FolderOpen className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex gap-1.5">
                      <input type="text" value={voicesDir} onChange={(e) => setVoicesDir(e.target.value)} placeholder={PIPELINE_STEP4_TEXTS.AUDIO_DIR_PLACEHOLDER} className="flex-1 w-0 bg-slate-950/80 border border-slate-800/80 focus:border-rose-500/50 rounded-xl px-3 h-10 text-xs text-slate-200 shadow-inner outline-none" />
                      <Button type="button" variant="ghost" onClick={() => handleSelectFolder(FolderSelectionType.VOICES)} className="px-3 h-10 shrink-0 bg-slate-950/80 border border-slate-800/80 rounded-xl text-slate-400 hover:text-rose-400 transition-colors">
                        <LucideIcons.FolderOpen className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2 animate-fadeIn p-2 border border-slate-800/80 rounded-xl bg-slate-900/30 items-center justify-center h-10 mt-3">
                    <span className="text-xs text-slate-400 italic text-center px-4">{PIPELINE_STEP4_TEXTS.AUTO_GATHER_MEDIA_HINT}</span>
                  </div>
                )}
              </div>

              <div className="pt-4 mt-2 border-t border-slate-800/60 w-full space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 font-mono mb-2">
                    <Tooltip content="Độ phân giải video khi xuất bằng FFmpeg." position="top">
                      <span className="flex items-center gap-1.5 cursor-help"><LucideIcons.Monitor className="w-3.5 h-3.5 text-rose-500" /> Chất Lượng Video</span>
                    </Tooltip>
                  </label>
                  <div className="relative flex items-center bg-slate-955 border border-slate-800 rounded-xl px-3 h-10 shadow-inner">
                    <select
                      value={ffmpegQuality}
                      onChange={(e) => setFfmpegQuality(e.target.value as VideoQuality)}
                      className="flex-1 bg-transparent text-slate-200 text-xs font-semibold outline-none cursor-pointer appearance-none pr-6"
                    >
                      <option value={VideoQuality.LOW} className="bg-slate-955 text-slate-200">{PIPELINE_STEP4_TEXTS.QUALITY_480P}</option>
                      <option value={VideoQuality.HIGH} className="bg-slate-955 text-slate-200">{PIPELINE_STEP4_TEXTS.QUALITY_720P}</option>
                      <option value={VideoQuality.HIGHEST} className="bg-slate-955 text-slate-200">{PIPELINE_STEP4_TEXTS.QUALITY_1080P}</option>
                      <option value={VideoQuality.ULTRA_4K} className="bg-slate-955 text-slate-200">{PIPELINE_STEP4_TEXTS.QUALITY_4K}</option>
                    </select>
                    <LucideIcons.ChevronDown className="pointer-events-none absolute right-3 text-slate-400 w-4 h-4" />
                  </div>
                </div>
                
                <div className="w-full [&>div]:w-full">
                  <Tooltip content="Tiến hành ghép nối hình ảnh, âm thanh thành một video hoàn chỉnh với độ phân giải mong muốn sử dụng công nghệ FFmpeg." position="top">
                    <Button 
                      variant="ghost"
                      onClick={handleOfflineRenderFFmpeg}
                      disabled={isRenderLoading}
                      className="w-full group flex items-center justify-between p-3.5 rounded-xl text-left h-auto shrink-0 shadow-none flex-row gap-4 border transition-all duration-300 bg-slate-950 hover:bg-slate-850 border-slate-800/80 text-slate-300 hover:text-slate-100"
                    >
                    <div className="text-left flex-1">
                      <span className="font-bold flex items-center gap-2 text-amber-400 block whitespace-nowrap">
                        {isRenderLoading ? <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse" /> : <span className="inline-block w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />}
                        {isRenderLoading ? PIPELINE_STEP4_TEXTS.RENDERING : PIPELINE_STEP4_TEXTS.BTN_RENDER_FFMPEG}
                      </span>
                    </div>
                    {isRenderLoading ? (
                      <div className="w-5 h-5 rounded-full border-2 border-amber-500 border-t-transparent animate-spin shrink-0" />
                    ) : (
                      <LucideIcons.Video className="w-5 h-5 shrink-0 text-amber-500 transition-transform duration-300 group-hover:scale-110" />
                    )}
                  </Button>
                </Tooltip>
              </div>
            </div>

            </div>
          </div>

          <div className="bg-slate-900/40 border border-slate-850 backdrop-blur-sm p-6 rounded-xl space-y-4 shadow-xl relative overflow-visible z-40">
            <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2 relative z-10 border-b border-slate-800/60 pb-3">
              <LucideIcons.Send className="w-4 h-4 text-rose-500" />
              {t.Professional_Project_Pack}
            </h3>

            <div className="grid grid-cols-1 gap-3.5 text-xs relative z-10 mt-1">
              {_.map(exportButtons, (btn, index) => {
                const Icon = btn.icon;
                return (
                  <Button 
                    key={index}
                    variant="ghost" 
                    onClick={btn.handler} 
                    disabled={btn.isLoading} 
                    className={cn("w-full group flex items-center justify-between p-3.5 rounded-xl text-left h-auto shrink-0 shadow-none flex-row gap-4 border transition-all duration-300", 
                      btn.isPrimary 
                        ? (btn.isLoading ? "bg-slate-950 border-slate-900 text-slate-500 hover:bg-slate-950" : "bg-gradient-to-r from-rose-950/30 to-slate-950 hover:to-slate-850 hover:border-rose-800 border-rose-950/80 text-slate-200 hover:text-white shadow-[0_0_15px_rgba(225,29,72,0.05)] hover:shadow-[0_0_20px_rgba(225,29,72,0.15)]") 
                        : "bg-slate-950 hover:bg-slate-850 border-slate-800/80 text-slate-300 hover:text-slate-100")}
                    title={btn.desc}
                  >
                    <div className="text-left flex-1">
                      <span className={cn("font-bold block flex items-center gap-2", btn.isPrimary && !btn.isLoading ? "text-rose-400" : "")}>
                        {btn.isLoading ? <span className="inline-block w-2 h-2 rounded-full bg-rose-500 animate-pulse" /> : (btn.isPrimary && <span className="inline-block w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(225,29,72,0.6)]" />)}
                        {btn.isLoading ? btn.loadingLabel : btn.label}
                      </span>
                      <span className="text-[10px] text-slate-500 block mt-1 font-normal text-left leading-relaxed">{btn.desc}</span>
                    </div>
                    {btn.isLoading ? <div className="w-5 h-5 rounded-full border-2 border-rose-500 border-t-transparent animate-spin shrink-0" /> : <Icon className={cn("w-5 h-5 shrink-0 transition-transform duration-300 group-hover:scale-110", btn.isPrimary ? "text-rose-500" : "text-slate-400")} />}
                  </Button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-start mt-2 border-t border-slate-800/60 pt-4 relative z-10">
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
  );
}
