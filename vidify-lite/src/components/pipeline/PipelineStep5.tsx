import { cn } from "../../lib/utils";
import _ from "lodash";
import { useState, useEffect, useRef } from "react";
import { PipelineWizardState } from "./usePipelineWizard";
import * as LucideIcons from "lucide-react";
import { GenerateType, ImageGeneratorEngine, ImageGenerationMode, AspectRatio } from "../../types";
import JSZip from "jszip";
import { API_ROUTES, PROMPT_NUMBERING_PREFIX_REGEX, PIPELINE_CONFIG } from "../../constants";
import { safeSystemFetch } from "../../lib/shared-utils";
import { Button } from "../ui/Button";
import { Tooltip } from "../ui/Tooltip";
import { PromptStatus, LogLevel } from "../../constants/enums";
import { PIPELINE_STEP5_TEXTS, LOG_LEVEL_SYMBOLS, COMMON_STRINGS } from "../../constants/texts";
import { delayAsync } from "../../lib/shared-utils.js";

const { Play, Square, Download, Trash, Sparkles, Terminal, RefreshCw, FileText, Eye } = LucideIcons as any;

interface PromptItem {
  id: number;
  prompt: string;
  status: PromptStatus;
  resultBase64?: string;
  resultUrl?: string;
  errorMsg?: string;
  elapsedTime?: number;
}

export default function PipelineStep5(props: PipelineWizardState) {
  const { currentLang, setZoomedImage, sandboxConfig, t, project } = props;

  const currentGenerateType = project?.visualConfig?.generateType || GenerateType.Image;
  const currentEngine = project?.visualConfig?.imageGeneratorEngine || ImageGeneratorEngine.Veo3;
  const currentGenerationMode = project?.visualConfig?.generationMode || ImageGenerationMode.LabsFlow;
  const currentAspectRatio = project?.visualConfig?.aspectRatio || AspectRatio.SixteenNine;
  const currentStyle = project?.visualConfig?.style || COMMON_STRINGS.CUSTOM;
  const currentVideoDuration = project?.visualConfig?.videoDuration || "8s";

  const [inputText, setInputText] = useState<string>("");

  const [prompts, setPrompts] = useState<PromptItem[]>([]);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [currentIndex, setCurrentIndex] = useState<number>(PIPELINE_CONFIG.INDEX_INVALID);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);

  const isCancelledRef = useRef<boolean>(false);
  const consoleEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [consoleLogs]);

  const addLog = (msg: string, type: LogLevel = LogLevel.INFO) => {
    const time = new Date().toLocaleTimeString();
    const prefix = LOG_LEVEL_SYMBOLS[type.toUpperCase() as keyof typeof LOG_LEVEL_SYMBOLS] || LOG_LEVEL_SYMBOLS.INFO;
    setConsoleLogs((prev) => [...prev, `[${time}] ${prefix} ${msg}`]);
  };

  const parsePrompts = (text: string): string[] => {
    if (!text.trim()) return [];
    return _.chain(text.split("\n"))
      .map((line) => line.trim().replace(PROMPT_NUMBERING_PREFIX_REGEX, "").trim())
      .filter((line) => line.length > 0)
      .value();
  };

  useEffect(() => {
    if (!isRunning) {
      const parsed = parsePrompts(inputText);
      setPrompts(
        _.map(parsed, (prompt, idx) => ({
          id: idx + 1,
          prompt,
          status: PromptStatus.IDLE,
        })),
      );
    }
  }, [inputText, isRunning]);

  const handlePasteSamples = () => {
    setInputText(PIPELINE_STEP5_TEXTS.PROMPT_SAMPLE);
    addLog(t.node6_log_sample_loaded, LogLevel.INFO);
  };

  const handleStartGeneration = async () => {
    if (_.isEmpty(prompts)) {
      addLog(t.node6_log_invalid_prompts, LogLevel.WARN);
      return;
    }

    setIsRunning(true);
    isCancelledRef.current = false;
    setConsoleLogs([]);
    addLog(t.node6_log_start, LogLevel.INFO);

    setPrompts((prev) => _.map(prev, (p) => ({ ...p, status: PromptStatus.IDLE, resultBase64: undefined, resultUrl: undefined, errorMsg: undefined, elapsedTime: undefined })));

    for (let i = 0; i < prompts.length; i++) {
      if (isCancelledRef.current) {
        addLog(t.node6_log_cancelled, LogLevel.WARN);
        break;
      }

      setCurrentIndex(i);
      setPrompts((prev) => _.map(prev, (p, idx) => (idx === i ? { ...p, status: PromptStatus.RUNNING } : p)));

      const currentItem = prompts[i];
      addLog(t.node6_log_processing.replace("{index}", String(i + 1)).replace("{total}", String(prompts.length)), LogLevel.INFO);

      const startTime = Date.now();
      try {
        const payload = {
          prompt: currentItem.prompt,
          style: currentStyle,
          bypassCache: true,
          visualConfig: {
            generateType: currentGenerateType,
            imageGeneratorEngine: currentEngine,
            generationMode: currentGenerationMode,
            aspectRatio: currentAspectRatio,
            videoDuration: currentVideoDuration,
          },
          sandboxConfig,
        };

        const result = await safeSystemFetch(API_ROUTES.PIPELINE_GENERATE_IMAGE, payload);

        if (!result.success) {
          throw new Error(result.error || t.node6_log_api_error);
        }

        const data = result.data;
        const durationSec = Math.round((Date.now() - startTime) / PIPELINE_CONFIG.MS_PER_SEC);

        if (data.success && data.base64) {
          if (data.newProjectId && data.newProjectId !== sandboxConfig.projectId) {
            props.setSandboxConfig((prev: any) => ({
              ...prev,
              projectId: data.newProjectId,
            }));
          }
          setPrompts((prev) =>
            _.map(prev, (p, idx) =>
              idx === i
                ? {
                    ...p,
                    status: PromptStatus.SUCCESS,
                    resultBase64: data.base64,
                    resultUrl: data.fallbackUrl || `${COMMON_STRINGS.BASE64_JPEG_PREFIX}${data.base64}`,
                    elapsedTime: durationSec,
                  }
                : p,
            ),
          );
          addLog(t.node6_log_success.replace("{index}", String(i + 1)).replace("{duration}", String(durationSec)), LogLevel.SUCCESS);
        } else {
          throw new Error(data.warning || t.node6_log_api_error);
        }
      } catch (err: any) {
        const durationSec = Math.round((Date.now() - startTime) / PIPELINE_CONFIG.MS_PER_SEC);
        setPrompts((prev) =>
          _.map(prev, (p, idx) =>
            idx === i
              ? {
                  ...p,
                  status: PromptStatus.ERROR,
                  errorMsg: err.message,
                  elapsedTime: durationSec,
                }
              : p,
          ),
        );
        addLog(t.node6_log_error.replace("{index}", String(i + 1)).replace("{error}", err.message), LogLevel.ERROR);
      }

      if (i < prompts.length - 1 && !isCancelledRef.current) {
        await delayAsync(PIPELINE_CONFIG.STEP5_DELAY_MS);
      }
    }

    setIsRunning(false);
    setCurrentIndex(PIPELINE_CONFIG.INDEX_INVALID);
    addLog(t.node6_log_completed, LogLevel.SUCCESS);
  };

  const handleCancelGeneration = () => {
    isCancelledRef.current = true;
    setIsRunning(false);
    setCurrentIndex(PIPELINE_CONFIG.INDEX_INVALID);
    addLog(t.node6_log_cancelling, LogLevel.WARN);
  };

  const handleDownloadAllZip = async () => {
    const successItems = _.filter(prompts, (p: PromptItem) => p.status === PromptStatus.SUCCESS && !!p.resultBase64) as PromptItem[];
    if (_.isEmpty(successItems)) {
      addLog(t.node6_log_zip_empty, LogLevel.WARN);
      return;
    }

    addLog(t.node6_log_zip_start, LogLevel.INFO);
    try {
      const zip = new JSZip();

      _.forEach(successItems, (item, index) => {
        const ext = currentGenerateType === GenerateType.Video ? COMMON_STRINGS.MP4_EXT : COMMON_STRINGS.JPG_EXT;
        const filename = `${index + 1}_asset.${ext}`;
        zip.file(filename, item.resultBase64!, { base64: true });
      });

      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = url;

      const zipNameTexts = PIPELINE_STEP5_TEXTS[currentLang as "vi" | "en"] || PIPELINE_STEP5_TEXTS.en;
      a.download = currentGenerateType === GenerateType.Video ? zipNameTexts.VIDEO_ZIP_NAME : zipNameTexts.IMAGE_ZIP_NAME;
      
      document.body.appendChild(a);
      a.click();

      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 150);

      addLog(t.node6_log_zip_success, LogLevel.SUCCESS);
    } catch (e: any) {
      addLog(t.node6_log_zip_error.replace("{error}", e.message), LogLevel.ERROR);
    }
  };

  const handleClearAll = () => {
    setInputText("");
    setPrompts([]);
    setConsoleLogs([]);
    addLog(t.node6_log_cleared, LogLevel.INFO);
  };

  const handleZoomResult = (item: PromptItem) => {
    if (!item.resultUrl) return;
    setZoomedImage({
      url: item.resultUrl,
      title: t.node6_prompt_label.replace("{id}", String(item.id)),
    });
  };

  return (
    <div className="bg-gradient-to-b from-slate-900/90 to-slate-950/95 border border-slate-800/85 p-6 md:p-8 rounded-2xl shadow-2xl space-y-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/[0.03] rounded-full blur-3xl pointer-events-none" />
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        <div className="lg:col-span-1 space-y-5 flex flex-col justify-stretch">
          <div className="bg-slate-900/40 border border-slate-850 backdrop-blur-sm p-5 rounded-xl flex-1 flex flex-col space-y-4 shadow-xl relative overflow-visible z-20">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tooltip content="Nhập danh sách Prompts, mỗi prompt một dòng. AI sẽ đọc và sinh ra ảnh/video hàng loạt." position="bottom" align="start">
                <span className="flex items-center gap-2 cursor-help"><FileText className="w-4 h-4 text-rose-500 shrink-0" /> <h4 className="font-bold text-slate-100 text-xs font-mono uppercase tracking-wider">{t.node6_prompts_list}</h4></span>
              </Tooltip>
            </div>
            {!isRunning && (
              <div className="flex gap-2">
                <Button variant="outline" size="xs" onClick={handlePasteSamples} className="font-mono text-rose-400 border-slate-700 font-bold" title={t.pasteSamplePrompts}>
                  {t.node6_sample_prompts}
                </Button>
                <Button variant="outline" size="xs" onClick={handleClearAll} className="text-slate-550 hover:text-rose-400 hover:bg-rose-955/30 border-slate-850 hover:border-rose-500/20 px-2 shadow-none" title={t.clearAll}>
                  <Trash className="w-2.5 h-2.5" />
                </Button>
              </div>
            )}
          </div>
          <textarea disabled={isRunning} value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder={t.node6_placeholder} className="w-full flex-1 min-h-[180px] bg-slate-955 border border-slate-800 focus:border-rose-500 text-slate-100 p-3.5 rounded-xl text-xs leading-relaxed focus:outline-none transition-all font-sans resize-none" />
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
            <span>{t.node6_detected_prompts.replace("{count}", String(prompts.length))}</span>
          </div>
        </div>

        <div className="flex gap-3">
          {isRunning ? (
            <Button variant="danger" size="lg" onClick={handleCancelGeneration} className="flex-1 font-bold">
              <Square className="w-4 h-4 fill-white" />
              <span>{t.node6_stop_gen}</span>
            </Button>
          ) : (
            <Tooltip content="Bắt đầu chạy AI render ra hình ảnh hoặc video cho toàn bộ Prompts." position="top" align="center">
              <Button
                variant="primary"
                size="lg"
                onClick={handleStartGeneration}
                disabled={prompts.length === 0}
                className="flex-1 font-bold relative z-20"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>{t.node6_start_gen}</span>
              </Button>
            </Tooltip>
          )}

          <Tooltip content="Tải về toàn bộ thư mục chứa các assets đã render thành công." position="top" align="end">
            <Button
              variant="secondary"
              size="lg"
              onClick={handleDownloadAllZip}
              disabled={!_.some(prompts, (p: PromptItem) => p.status === PromptStatus.SUCCESS)}
              className="px-4 relative z-20"
              title={t.node6_zip_tooltip}
            >
              <Download className="w-4 h-4" />
            </Button>
          </Tooltip>
        </div>
      </div>

      <div className="lg:col-span-2 space-y-6 flex flex-col justify-stretch h-full">
        <div className="bg-slate-900 border border-slate-800 rounded-xl flex flex-col overflow-hidden min-h-[160px] max-h-[220px] shadow-xl">
          <div className="p-3 border-b border-slate-800 bg-slate-955 flex items-center gap-2 select-none">
            <Terminal className="w-4 h-4 text-rose-500" />
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">{t.node6_console_title}</span>
          </div>
          <div className="flex-1 p-4 bg-slate-955 text-[10px] font-mono text-slate-400 overflow-y-auto space-y-2 select-text custom-scrollbar">
            {_.isEmpty(consoleLogs) ? (
              <div className="text-slate-650 italic">{t.node6_console_waiting}</div>
            ) : (
              _.map(consoleLogs, (log, i) => (
                <div key={i} className="leading-relaxed whitespace-pre-wrap select-all">
                  {log}
                </div>
              ))
            )}
            <div ref={consoleEndRef} />
          </div>
        </div>

        <div className="bg-slate-900/40 border border-slate-850 backdrop-blur-sm p-5 rounded-xl flex-1 flex flex-col shadow-xl relative overflow-hidden min-h-[350px]">
          <div className="border-b border-slate-800 pb-3 flex items-center gap-2 select-none mb-4">
            <Sparkles className="w-4 h-4 text-rose-500 animate-pulse" />
            <h4 className="font-bold text-slate-100 text-xs font-mono uppercase tracking-wider">{t.node6_library_title}</h4>
          </div>

          {_.isEmpty(prompts) ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 select-none">
              <div className="w-12 h-12 bg-slate-950 border border-slate-800 text-slate-650 rounded-full flex items-center justify-center shadow-inner mb-3">
                <FileText className="w-5 h-5" />
              </div>
              <h5 className="font-bold text-slate-350 text-sm">{t.node6_library_empty}</h5>
              <p className="text-xs text-slate-550 max-w-sm mt-1 leading-normal">{t.node6_library_empty_desc}</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto custom-scrollbar max-h-[50vh] pr-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {_.map(prompts, (item, idx) => {
                  const isCurrent = idx === currentIndex;
                  return (
                    <div
                      key={item.id}
                      className={cn(`border rounded-xl p-4 flex flex-col justify-between min-h-[160px] relative overflow-hidden transition-all duration-300 ${
                        isCurrent ? "bg-rose-500/[0.03] border-rose-500 shadow-md ring-1 ring-rose-500/20 scale-[1.01]" : _.includes([PromptStatus.SUCCESS], item.status) ? "bg-slate-900 border-slate-800 hover:border-slate-700" : _.includes([PromptStatus.ERROR], item.status) ? "bg-red-950/10 border-red-500/30" : "bg-slate-950 border-slate-900/60 opacity-60"
                      }`)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[9px] font-mono font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-850 text-slate-450 uppercase tracking-widest">{t.node6_prompt_label.replace("{id}", String(item.id))}</span>

                        <div className="flex items-center gap-1.5">
                          {item.elapsedTime !== undefined && <span className="text-[8px] font-mono text-slate-500">{item.elapsedTime}s</span>}
                          {_.includes([PromptStatus.RUNNING], item.status) && (
                            <span className="flex h-2 w-2 relative">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                            </span>
                          )}
                          {_.includes([PromptStatus.SUCCESS], item.status) && <span className="bg-emerald-500/10 text-emerald-400 text-[8px] font-black uppercase px-1.5 py-0.5 rounded border border-emerald-500/15">{t.node6_badge_done}</span>}
                          {_.includes([PromptStatus.ERROR], item.status) && <span className="bg-red-500/10 text-red-400 text-[8px] font-black uppercase px-1.5 py-0.5 rounded border border-red-500/15">{t.node6_badge_error}</span>}
                        </div>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed font-sans line-clamp-3 select-all mb-3">{item.prompt}</p>

                      <div className="h-[140px] bg-slate-950 rounded-xl border border-slate-850 overflow-hidden flex items-center justify-center relative group">
                        {_.includes([PromptStatus.RUNNING], item.status) ? (
                          <div className="flex flex-col items-center gap-2">
                            <RefreshCw className="w-5 h-5 text-rose-500 animate-spin" />
                            <span className="text-[9px] font-mono font-bold text-rose-400 uppercase tracking-widest animate-pulse">{t.node6_rendering}</span>
                          </div>
                        ) : _.includes([PromptStatus.SUCCESS], item.status) && item.resultBase64 ? (
                          <>
                            {currentGenerateType === GenerateType.Video ? <video src={item.resultUrl} controls className="w-full h-full object-cover" /> : <img src={item.resultUrl} alt={t.node6_prompt_label.replace("{id}", String(item.id))} className="w-full h-full object-cover" />}

                            {currentGenerateType === GenerateType.Image && (
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-3">
                                <Button type="button" variant="ghost" onClick={() => handleZoomResult(item)} className="p-2 bg-slate-900 border border-slate-700 rounded-xl text-white hover:text-rose-400 hover:scale-105 cursor-pointer shadow-none h-auto w-auto transition-all" title={t.Image_Lightbox_Preview}>
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <a href={item.resultUrl} download={`${COMMON_STRINGS.ARTWORK_PREFIX}${item.id}.${COMMON_STRINGS.JPG_EXT}`} className="p-2 bg-slate-900 border border-slate-700 rounded-xl text-white hover:text-rose-400 hover:scale-105 cursor-pointer shadow transition-all" title={t.download}>
                                  <Download className="w-4 h-4" />
                                </a>
                              </div>
                            )}
                          </>
                        ) : _.includes([PromptStatus.ERROR], item.status) ? (
                          <div className="p-4 text-center">
                            <span className="text-[10px] text-red-400 font-mono block leading-relaxed line-clamp-3 select-all">{item.errorMsg}</span>
                          </div>
                        ) : (
                          <span className="text-[9px] font-mono text-slate-600 uppercase tracking-widest select-none">{t.node6_waiting}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
