import { useState, useEffect, useRef } from "react";
import { PipelineWizardState } from "./usePipelineWizard";
import * as LucideIcons from "lucide-react";
import { GenerateType, ImageGeneratorEngine, ImageGenerationMode, AspectRatio } from "../../types";
import JSZip from "jszip";
import { API_ROUTES, PROMPT_NUMBERING_PREFIX_REGEX } from "../../constants";
import { safeSystemFetch } from "../../lib/shared-utils";

const { Play, Square, Download, Trash, Sparkles, Terminal, RefreshCw, FileText, Eye } = LucideIcons as any;

interface PromptItem {
  id: number;
  prompt: string;
  status: "idle" | "running" | "success" | "error";
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
  const currentStyle = project?.visualConfig?.style || "cinematic";

  const [inputText, setInputText] = useState<string>("");

  const [prompts, setPrompts] = useState<PromptItem[]>([]);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);

  const isCancelledRef = useRef<boolean>(false);
  const consoleEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [consoleLogs]);

  const addLog = (msg: string, type: "info" | "success" | "warn" | "error" = "info") => {
    const time = new Date().toLocaleTimeString();
    const prefix = type === "success" ? "✅" : type === "error" ? "❌" : type === "warn" ? "⚠️" : "ℹ️";
    setConsoleLogs((prev) => [...prev, `[${time}] ${prefix} ${msg}`]);
  };

  const parsePrompts = (text: string): string[] => {
    if (!text.trim()) return [];
    return text
      .split("\n")
      .map((line) => {
        let cleaned = line.trim().replace(PROMPT_NUMBERING_PREFIX_REGEX, "");
        return cleaned.trim();
      })
      .filter((line) => line.length > 0);
  };

  useEffect(() => {
    if (!isRunning) {
      const parsed = parsePrompts(inputText);
      setPrompts(
        parsed.map((prompt, idx) => ({
          id: idx + 1,
          prompt,
          status: "idle",
        })),
      );
    }
  }, [inputText, isRunning]);

  const handlePasteSamples = () => {
    const sampleText = `1. A group of 2D hand-drawn stickman cartoon hunters with intense, focused expressions, holding primitive stone spears, crouching behind massive, photorealistic granite boulders. In the distance, a colossal prehistoric beast moves through a foggy, ancient valley.
2. A group of 2D hand-drawn stickman cartoon hunters with intense, focused expressions, holding primitive stone spears, crouching behind massive, photorealistic granite boulders. In the distance, a colossal prehistoric beast moves through a foggy, ancient valley.`;
    setInputText(sampleText);
    addLog(t.node6_log_sample_loaded, "info");
  };

  const handleStartGeneration = async () => {
    if (prompts.length === 0) {
      addLog(t.node6_log_invalid_prompts, "warn");
      return;
    }

    setIsRunning(true);
    isCancelledRef.current = false;
    setConsoleLogs([]);
    addLog(t.node6_log_start, "info");

    setPrompts((prev) => prev.map((p) => ({ ...p, status: "idle", resultBase64: undefined, resultUrl: undefined, errorMsg: undefined, elapsedTime: undefined })));

    for (let i = 0; i < prompts.length; i++) {
      if (isCancelledRef.current) {
        addLog(t.node6_log_cancelled, "warn");
        break;
      }

      setCurrentIndex(i);
      setPrompts((prev) => prev.map((p, idx) => (idx === i ? { ...p, status: "running" } : p)));

      const currentItem = prompts[i];
      addLog(t.node6_log_processing.replace("{index}", String(i + 1)).replace("{total}", String(prompts.length)), "info");

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
          },
          sandboxConfig,
        };

        const result = await safeSystemFetch(API_ROUTES.PIPELINE_GENERATE_IMAGE, payload);

        if (!result.success) {
          throw new Error(result.error || t.node6_log_api_error);
        }

        const data = result.data;
        const durationSec = Math.round((Date.now() - startTime) / 1000);

        if (data.success && data.base64) {
          setPrompts((prev) =>
            prev.map((p, idx) =>
              idx === i
                ? {
                    ...p,
                    status: "success",
                    resultBase64: data.base64,
                    resultUrl: data.fallbackUrl || `data:image/jpeg;base64,${data.base64}`,
                    elapsedTime: durationSec,
                  }
                : p,
            ),
          );
          addLog(t.node6_log_success.replace("{index}", String(i + 1)).replace("{duration}", String(durationSec)), "success");
        } else {
          throw new Error(data.warning || t.node6_log_api_error);
        }
      } catch (err: any) {
        const durationSec = Math.round((Date.now() - startTime) / 1000);
        setPrompts((prev) =>
          prev.map((p, idx) =>
            idx === i
              ? {
                  ...p,
                  status: "error",
                  errorMsg: err.message,
                  elapsedTime: durationSec,
                }
              : p,
          ),
        );
        addLog(t.node6_log_error.replace("{index}", String(i + 1)).replace("{error}", err.message), "error");
      }

      if (i < prompts.length - 1 && !isCancelledRef.current) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    setIsRunning(false);
    setCurrentIndex(-1);
    addLog(t.node6_log_completed, "success");
  };

  const handleCancelGeneration = () => {
    isCancelledRef.current = true;
    setIsRunning(false);
    setCurrentIndex(-1);
    addLog(t.node6_log_cancelling, "warn");
  };

  const handleDownloadAllZip = async () => {
    const successItems = prompts.filter((p) => p.status === "success" && p.resultBase64);
    if (successItems.length === 0) {
      addLog(t.node6_log_zip_empty, "warn");
      return;
    }

    addLog(t.node6_log_zip_start, "info");
    try {
      const zip = new JSZip();

      successItems.forEach((item, index) => {
        const ext = currentGenerateType === GenerateType.Video ? "mp4" : "jpg";
        const filename = `${index + 1}_asset.${ext}`;
        zip.file(filename, item.resultBase64!, { base64: true });
      });

      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = url;
      a.download = currentGenerateType === GenerateType.Video ? (currentLang === "vi" ? "danh_sach_video_doc_lap.zip" : "independent_video_list.zip") : currentLang === "vi" ? "danh_sach_anh_doc_lap.zip" : "independent_image_list.zip";
      document.body.appendChild(a);
      a.click();

      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 150);

      addLog(t.node6_log_zip_success, "success");
    } catch (e: any) {
      addLog(t.node6_log_zip_error.replace("{error}", e.message), "error");
    }
  };

  const handleClearAll = () => {
    setInputText("");
    setPrompts([]);
    setConsoleLogs([]);
    addLog(t.node6_log_cleared, "info");
  };

  const handleZoomResult = (item: PromptItem) => {
    if (!item.resultUrl) return;
    setZoomedImage({
      url: item.resultUrl,
      title: t.node6_prompt_label.replace("{id}", String(item.id)),
      prompt: item.prompt,
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 space-y-5">
        <div className="bg-gradient-to-b from-slate-900/90 to-slate-950/95 border border-slate-800/85 p-5 rounded-2xl space-y-4 shadow-xl relative overflow-hidden">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-rose-500 shrink-0" />
              <h4 className="font-bold text-slate-100 text-xs font-mono uppercase tracking-wider">{t.node6_prompts_list}</h4>
            </div>
            {!isRunning && (
              <div className="flex gap-2">
                <button onClick={handlePasteSamples} className="text-[9px] font-mono font-bold bg-slate-850 hover:bg-slate-800 border border-slate-700 px-2 py-0.5 rounded text-rose-400 cursor-pointer" title="Dán 2 prompt stickman mẫu">
                  {t.node6_sample_prompts}
                </button>
                <button onClick={handleClearAll} className="text-[9px] font-mono font-bold bg-slate-950 hover:bg-rose-950/30 border border-slate-850 hover:border-rose-500/20 px-2 py-0.5 rounded text-slate-550 hover:text-rose-400 cursor-pointer">
                  <Trash className="w-2.5 h-2.5" />
                </button>
              </div>
            )}
          </div>
          <textarea disabled={isRunning} value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder={t.node6_placeholder} className="w-full h-[220px] bg-slate-955 border border-slate-800 focus:border-rose-500 text-slate-100 p-3.5 rounded-xl text-xs leading-relaxed focus:outline-none transition-all font-sans resize-none" />
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
            <span>{t.node6_detected_prompts.replace("{count}", String(prompts.length))}</span>
          </div>
        </div>

        <div className="flex gap-3">
          {isRunning ? (
            <button onClick={handleCancelGeneration} className="flex-1 py-3.5 bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white font-bold text-xs rounded-xl shadow-lg cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 transition-all">
              <Square className="w-4 h-4 fill-white" />
              <span>{t.node6_stop_gen}</span>
            </button>
          ) : (
            <button
              onClick={handleStartGeneration}
              disabled={prompts.length === 0}
              className="flex-1 py-3.5 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-455 disabled:from-slate-900 disabled:to-slate-950 disabled:border-slate-850 disabled:text-slate-600 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl shadow-lg cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 transition-all"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>{t.node6_start_gen}</span>
            </button>
          )}

          <button
            onClick={handleDownloadAllZip}
            disabled={prompts.filter((p) => p.status === "success").length === 0}
            className="px-4 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-950 disabled:text-slate-700 disabled:border-slate-850 disabled:cursor-not-allowed border border-slate-800 rounded-xl text-slate-200 shadow transition-all cursor-pointer flex items-center justify-center"
            title={t.node6_zip_tooltip}
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="lg:col-span-2 space-y-6 flex flex-col justify-stretch h-full">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl flex flex-col overflow-hidden min-h-[160px] max-h-[220px] shadow-xl">
          <div className="p-3 border-b border-slate-800 bg-slate-950 flex items-center gap-2 select-none">
            <Terminal className="w-4 h-4 text-rose-500" />
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">{t.node6_console_title}</span>
          </div>
          <div className="flex-1 p-4 bg-slate-955 text-[10px] font-mono text-slate-400 overflow-y-auto space-y-2 select-text custom-scrollbar">
            {consoleLogs.length === 0 ? (
              <div className="text-slate-650 italic">{t.node6_console_waiting}</div>
            ) : (
              consoleLogs.map((log, i) => (
                <div key={i} className="leading-relaxed whitespace-pre-wrap select-all">
                  {log}
                </div>
              ))
            )}
            <div ref={consoleEndRef} />
          </div>
        </div>

        <div className="bg-gradient-to-b from-slate-900/90 to-slate-950/95 border border-slate-800/85 p-5 rounded-2xl flex-1 flex flex-col shadow-2xl relative overflow-visible min-h-[350px]">
          <div className="border-b border-slate-800 pb-3 flex items-center gap-2 select-none mb-4">
            <Sparkles className="w-4 h-4 text-rose-500 animate-pulse" />
            <h4 className="font-bold text-slate-100 text-xs font-mono uppercase tracking-wider">{t.node6_library_title}</h4>
          </div>

          {prompts.length === 0 ? (
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
                {prompts.map((item, idx) => {
                  const isCurrent = idx === currentIndex;
                  return (
                    <div
                      key={item.id}
                      className={`border rounded-2xl p-4 flex flex-col justify-between min-h-[160px] relative overflow-hidden transition-all duration-300 ${
                        isCurrent ? "bg-rose-500/[0.03] border-rose-500 shadow-md ring-1 ring-rose-500/20 scale-[1.01]" : item.status === "success" ? "bg-slate-900 border-slate-800 hover:border-slate-700" : item.status === "error" ? "bg-red-950/10 border-red-500/30" : "bg-slate-950/50 border-slate-900/60 opacity-60"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[9px] font-mono font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-850 text-slate-450 uppercase tracking-widest">{t.node6_prompt_label.replace("{id}", String(item.id))}</span>

                        <div className="flex items-center gap-1.5">
                          {item.elapsedTime !== undefined && <span className="text-[8px] font-mono text-slate-500">{item.elapsedTime}s</span>}
                          {item.status === "running" && (
                            <span className="flex h-2 w-2 relative">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                            </span>
                          )}
                          {item.status === "success" && <span className="bg-emerald-500/10 text-emerald-400 text-[8px] font-black uppercase px-1.5 py-0.5 rounded border border-emerald-500/15">{t.node6_badge_done}</span>}
                          {item.status === "error" && <span className="bg-red-500/10 text-red-400 text-[8px] font-black uppercase px-1.5 py-0.5 rounded border border-red-500/15">{t.node6_badge_error}</span>}
                        </div>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed font-sans line-clamp-3 select-all mb-3">{item.prompt}</p>

                      <div className="h-[140px] bg-slate-950 rounded-xl border border-slate-850 overflow-hidden flex items-center justify-center relative group">
                        {item.status === "running" ? (
                          <div className="flex flex-col items-center gap-2">
                            <RefreshCw className="w-5 h-5 text-rose-500 animate-spin" />
                            <span className="text-[9px] font-mono font-bold text-rose-400 uppercase tracking-widest animate-pulse">{t.node6_rendering}</span>
                          </div>
                        ) : item.status === "success" && item.resultBase64 ? (
                          <>
                            {currentGenerateType === GenerateType.Video ? <video src={item.resultUrl} controls className="w-full h-full object-cover" /> : <img src={item.resultUrl} alt={t.node6_prompt_label.replace("{id}", String(item.id))} className="w-full h-full object-cover" />}

                            {currentGenerateType === GenerateType.Image && (
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-3">
                                <button type="button" onClick={() => handleZoomResult(item)} className="p-2 bg-slate-900 border border-slate-700 rounded-xl text-white hover:text-rose-400 hover:scale-105 cursor-pointer shadow transition-all" title={t.Image_Lightbox_Preview}>
                                  <Eye className="w-4 h-4" />
                                </button>
                                <a href={item.resultUrl} download={`artwork_${item.id}.jpg`} className="p-2 bg-slate-900 border border-slate-700 rounded-xl text-white hover:text-rose-400 hover:scale-105 cursor-pointer shadow transition-all" title={t.download}>
                                  <Download className="w-4 h-4" />
                                </a>
                              </div>
                            )}
                          </>
                        ) : item.status === "error" ? (
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
  );
}
