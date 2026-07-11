import { useState, useEffect } from "react";
import { PipelineWizardState } from "./usePipelineWizard";
import * as LucideIcons from "lucide-react";
import { safeSystemFetch } from "../../lib/shared-utils";
import { appError } from "../../lib/logger";
import { API_ROUTES, UltraStreamLogType, ErrorMessage, STORAGE_KEYS, LogLevel, LOG_LEVEL_SYMBOLS, DEFAULT_AUDIO_ORDER_LIST, HTTP_HEADERS, CONTENT_TYPES, getBackendMsg } from "../../constants";
import { Button } from "../ui/Button";

const { Play, Sparkles, Terminal, FileJson, FolderOpen, Key, CheckSquare, Square, Eye, EyeOff } = LucideIcons as any;

interface UltraConfig {
  sync_image_to_audio: boolean;
  ultra_music_mix: boolean;
  custom_audio_order: boolean;
  randomize_video: boolean;
  dynamic_motion: boolean;
  auto_transition: boolean;
  clear_transitions: boolean;
  auto_fill_canvas: boolean;
  normalize_volume: boolean;
  reverse_timeline: boolean;
  auto_subtitles: boolean;
  ai_sfx_generator: boolean;
  audio_order_list: string;
  api_key: string;
  sfx_folder: string;
  draft_json_path: string;
}

const DEFAULT_CONFIG: UltraConfig = {
  sync_image_to_audio: true,
  ultra_music_mix: false,
  custom_audio_order: false,
  randomize_video: false,
  dynamic_motion: true,
  auto_transition: true,
  clear_transitions: false,
  auto_fill_canvas: true,
  normalize_volume: true,
  reverse_timeline: false,
  auto_subtitles: false,
  ai_sfx_generator: false,
  audio_order_list: DEFAULT_AUDIO_ORDER_LIST,
  api_key: "",
  sfx_folder: "",
  draft_json_path: "",
};

export default function PipelineStep6(props: PipelineWizardState) {
  const { t } = props;

  const [config, setConfig] = useState<UltraConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CAPCUT_ULTRA_CONFIG);
      return saved ? { ...DEFAULT_CONFIG, ...JSON.parse(saved) } : DEFAULT_CONFIG;
    } catch (e) {
      return DEFAULT_CONFIG;
    }
  });

  const [showApiKey, setShowApiKey] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CAPCUT_ULTRA_CONFIG, JSON.stringify(config));
  }, [config]);

  const addLog = (msg: string, type: LogLevel = LogLevel.INFO) => {
    const time = new Date().toLocaleTimeString();
    const prefix = type === LogLevel.SUCCESS ? LOG_LEVEL_SYMBOLS.SUCCESS :
      type === LogLevel.ERROR ? LOG_LEVEL_SYMBOLS.ERROR :
        type === LogLevel.WARN ? LOG_LEVEL_SYMBOLS.WARN : LOG_LEVEL_SYMBOLS.INFO;
    setConsoleLogs((prev) => [...prev, `[${time}] ${prefix} ${msg}`]);
  };

  const handleToggle = (key: keyof UltraConfig) => {
    setConfig((prev) => ({
      ...prev,
      [key]: !prev[key] as any,
    }));
  };

  const handleSelectAll = () => {
    setConfig((prev) => ({
      ...prev,
      sync_image_to_audio: true,
      ultra_music_mix: true,
      custom_audio_order: true,
      randomize_video: true,
      dynamic_motion: true,
      auto_transition: true,
      clear_transitions: true,
      auto_fill_canvas: true,
      normalize_volume: true,
      reverse_timeline: true,
      auto_subtitles: true,
      ai_sfx_generator: true,
    }));
    addLog(t.node7_select_all, LogLevel.INFO);
  };

  const handleDeselectAll = () => {
    setConfig((prev) => ({
      ...prev,
      sync_image_to_audio: false,
      ultra_music_mix: false,
      custom_audio_order: false,
      randomize_video: false,
      dynamic_motion: false,
      auto_transition: false,
      clear_transitions: false,
      auto_fill_canvas: false,
      normalize_volume: false,
      reverse_timeline: false,
      auto_subtitles: false,
      ai_sfx_generator: false,
    }));
    addLog(t.node7_deselect_all, LogLevel.INFO);
  };

  const handleSelectFile = async () => {
    try {
      addLog(t.node7_log_started_dialog, LogLevel.INFO);
      const response = await safeSystemFetch(API_ROUTES.PIPELINE_SELECT_FILE, {});
      if (response.success && response.data?.filePath) {
        setConfig((prev) => ({ ...prev, draft_json_path: response.data.filePath }));
        addLog(t.node7_log_selected_file.replace("{path}", response.data.filePath), LogLevel.SUCCESS);
      } else if (response.error) {
        throw new Error(response.error);
      } else {
        addLog(t.node7_log_canceled_file, LogLevel.WARN);
      }
    } catch (err: any) {
      addLog(t.node7_log_error_file.replace("{error}", err.message), LogLevel.ERROR);
    }
  };

  const handleSelectFolder = async () => {
    try {
      addLog(t.node7_log_started_folder, LogLevel.INFO);
      const response = await safeSystemFetch(API_ROUTES.PIPELINE_SELECT_FOLDER, {});
      if (response.success && response.data?.folderPath) {
        setConfig((prev) => ({ ...prev, sfx_folder: response.data.folderPath }));
        addLog(t.node7_log_selected_folder.replace("{path}", response.data.folderPath), LogLevel.SUCCESS);
      } else if (response.error) {
        throw new Error(response.error);
      } else {
        addLog(t.node7_log_canceled_folder, LogLevel.WARN);
      }
    } catch (err: any) {
      addLog(t.node7_log_error_folder.replace("{error}", err.message), LogLevel.ERROR);
    }
  };

  const handleRunProcess = async () => {
    if (!config.draft_json_path.trim()) {
      addLog(t.node7_log_missing_file, LogLevel.ERROR);
      return;
    }

    if (config.ai_sfx_generator) {
      if (!config.api_key.trim()) {
        addLog(t.node7_log_missing_api, LogLevel.ERROR);
        return;
      }
      if (!config.sfx_folder.trim()) {
        addLog(t.node7_log_missing_sfx, LogLevel.ERROR);
        return;
      }
    }

    setIsRunning(true);
    setConsoleLogs([]);
    addLog(t.node7_log_started, LogLevel.INFO);

    try {
      const payload = {
        filePath: config.draft_json_path.trim(),
        geminiApiKey: config.api_key.trim(),
        sfxFolder: config.sfx_folder.trim(),
        opts: {
          sync_image_to_audio: config.sync_image_to_audio,
          ultra_music_mix: config.ultra_music_mix,
          custom_audio_order: config.custom_audio_order,
          randomize_video: config.randomize_video,
          dynamic_motion: config.dynamic_motion,
          auto_transition: config.auto_transition,
          clear_transitions: config.clear_transitions,
          auto_fill_canvas: config.auto_fill_canvas,
          normalize_volume: config.normalize_volume,
          reverse_timeline: config.reverse_timeline,
          auto_subtitles: config.auto_subtitles,
          ai_sfx_generator: config.ai_sfx_generator,
          audio_order_list: config.audio_order_list.trim(),
        },
      };

      addLog(t.node7_log_calling_backend, LogLevel.INFO);
      const response = await fetch(API_ROUTES.PIPELINE_RUN_ULTRA, {
        method: "POST",
        headers: { [HTTP_HEADERS.CONTENT_TYPE]: CONTENT_TYPES.JSON },
        body: JSON.stringify(payload),
      });

      if (!response.body) {
        throw new Error(getBackendMsg("STREAM_NOT_SUPPORTED"));
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let isReadingStream = true;

      while (isReadingStream) {
        const { value, done } = await reader.read();
        if (done) {
          isReadingStream = false;
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const data = JSON.parse(line);
            if (data.type === UltraStreamLogType.LOG) {
              addLog(data.message, LogLevel.INFO);
            } else if (data.type === UltraStreamLogType.ERROR_LOG) {
              addLog(data.message, LogLevel.WARN);
            } else if ("success" in data) {
              if (data.success) {
                addLog(data.message || t.node7_log_success, LogLevel.SUCCESS);
                addLog(t.node7_log_backup_saved, LogLevel.INFO);
              } else {
                throw new Error(data.error || ErrorMessage.CAPCUT_ULTRA_OPTIMIZATION_ERROR);
              }
            }
          } catch (err: any) {
            if (err instanceof SyntaxError) {
              appError(ErrorMessage.FAILED_TO_PARSE_NDJSON_LINE, line, err);
            } else {
              throw err;
            }
          }
        }
      }
    } catch (err: any) {
      addLog(t.node7_log_error.replace("{error}", err.message), LogLevel.ERROR);
    } finally {
      setIsRunning(false);
    }
  };

  const switches = [
    { key: "sync_image_to_audio", label: t.node7_opt_sync },
    { key: "ultra_music_mix", label: t.node7_opt_music_mix },
    { key: "custom_audio_order", label: t.node7_opt_custom_order },
    { key: "randomize_video", label: t.node7_opt_randomize },
    { key: "dynamic_motion", label: t.node7_opt_motion },
    { key: "auto_transition", label: t.node7_opt_transition },
    { key: "clear_transitions", label: t.node7_opt_clear_trans },
    { key: "auto_fill_canvas", label: t.node7_opt_fill_canvas },
    { key: "normalize_volume", label: t.node7_opt_normalize },
    { key: "reverse_timeline", label: t.node7_opt_reverse },
    { key: "auto_subtitles", label: t.node7_opt_subtitles },
    { key: "ai_sfx_generator", label: t.node7_opt_sfx },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 text-left">
        <h2 className="text-xl font-extrabold text-slate-100 flex items-center gap-2 tracking-tight uppercase">
          <Sparkles className="w-5 h-5 text-rose-500" />
          {t.node7_title}
        </h2>
        <p className="text-xs text-slate-450 leading-relaxed">{t.node7_desc}</p>
      </div>

      <div className="bg-slate-900/60 border border-slate-850 rounded-2xl overflow-hidden shadow-2xl flex flex-col text-left animate-fadeIn">
        <div className="px-5 py-3 border-b border-slate-850 bg-slate-900/40 flex items-center justify-between shrink-0">
          <span className="text-[10px] font-bold text-slate-400 tracking-wider font-mono flex items-center gap-1.5 select-none">
            <Terminal className="w-3.5 h-3.5 text-rose-500" />
            {t.node7_console_title}
          </span>
          <span className="text-[9px] font-mono text-slate-600">STDOUT / STDERR</span>
        </div>
        <div className="p-5 bg-slate-950 font-mono text-[11px] leading-relaxed text-slate-350 min-h-[160px] max-h-[300px] overflow-y-auto custom-scrollbar space-y-1.5 select-text">
          {consoleLogs.length === 0 ? (
            <div className="text-slate-650 italic">{t.node7_console_waiting}</div>
          ) : (
            consoleLogs.map((log, index) => {
              let textClass = "text-slate-300";
              if (log.includes(LOG_LEVEL_SYMBOLS.SUCCESS) || log.includes("SUCCESS")) textClass = "text-teal-400 font-semibold";
              if (log.includes(LOG_LEVEL_SYMBOLS.ERROR) || log.includes("ERROR")) textClass = "text-rose-500 font-semibold";
              if (log.includes(LOG_LEVEL_SYMBOLS.WARN)) textClass = "text-amber-400";
              return (
                <div key={index} className={textClass}>
                  {log}
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-5 space-y-5 bg-slate-900/40 p-5 rounded-2xl border border-slate-850 backdrop-blur-sm text-left">
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-450 uppercase tracking-wider flex items-center gap-1.5 font-mono select-none">
              <FileJson className="w-3.5 h-3.5 text-rose-500" />
              {t.node7_input_file_label}
            </label>
            <div className="flex gap-2">
              <input type="text" value={config.draft_json_path} onChange={(e) => setConfig((prev) => ({ ...prev, draft_json_path: e.target.value }))} placeholder={t.node7_placeholder_file} className="flex-1 bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-rose-500 rounded-xl px-4 py-3 text-xs text-slate-200 placeholder-slate-650 transition-all font-mono" />
              <Button type="button" variant="ghost" onClick={handleSelectFile} title={t.node7_choose_file_btn} className="px-4 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-slate-250 shrink-0 shadow-none">
                <FolderOpen className="w-4 h-4 text-rose-500" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-450 uppercase tracking-wider flex items-center gap-1.5 font-mono select-none">
              <Key className="w-3.5 h-3.5 text-rose-500" />
              {t.node7_api_key_label}
            </label>
            <div className="relative">
              <input
                type={showApiKey ? "text" : "password"}
                value={config.api_key}
                onChange={(e) => setConfig((prev) => ({ ...prev, api_key: e.target.value }))}
                placeholder={t.node7_api_key_placeholder}
                className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-rose-500 rounded-xl pl-4 pr-10 py-3 text-xs text-slate-200 placeholder-slate-650 transition-all font-mono"
              />
              <Button type="button" variant="ghost" onClick={() => setShowApiKey(!showApiKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-350 cursor-pointer p-0 h-auto w-auto shadow-none">
                {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-450 uppercase tracking-wider flex items-center gap-1.5 font-mono select-none">
              <FolderOpen className="w-3.5 h-3.5 text-rose-500" />
              {t.node7_sfx_folder_label}
            </label>
            <div className="flex gap-2">
              <input type="text" value={config.sfx_folder} onChange={(e) => setConfig((prev) => ({ ...prev, sfx_folder: e.target.value }))} placeholder={t.node7_placeholder_sfx} className="flex-1 bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-rose-500 rounded-xl px-4 py-3 text-xs text-slate-200 placeholder-slate-650 transition-all font-mono" />
              <Button type="button" variant="ghost" onClick={handleSelectFolder} title={t.node7_choose_sfx_btn} className="px-4 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-slate-250 shrink-0 shadow-none">
                <FolderOpen className="w-4 h-4 text-rose-500" />
              </Button>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-850">
            <Button variant="primary" size="lg" onClick={handleRunProcess} disabled={isRunning} className="w-full">
              {isRunning ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>{t.node7_status_processing}</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{t.node7_run_btn}</span>
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900/40 p-5 rounded-2xl border border-slate-850 backdrop-blur-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-850 pb-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono select-none">{t.node7_opt_title}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="xs" onClick={handleSelectAll} className="text-slate-450 hover:text-slate-200 border-slate-800 flex items-center gap-1 shadow-none">
                  <CheckSquare className="w-3 h-3 text-rose-500" />
                  {t.node7_select_all}
                </Button>
                <Button variant="outline" size="xs" onClick={handleDeselectAll} className="text-slate-450 hover:text-slate-200 border-slate-800 flex items-center gap-1 shadow-none">
                  <Square className="w-3 h-3 text-slate-500" />
                  {t.node7_deselect_all}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3.5 text-left">
              {switches.map((sw) => {
                const isActive = config[sw.key as keyof UltraConfig] as boolean;
                return (
                  <div key={sw.key} onClick={() => handleToggle(sw.key as keyof UltraConfig)} className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none ${isActive ? "bg-rose-500/[0.03] border-rose-500/30" : "bg-slate-950/20 border-slate-850 hover:border-slate-800 hover:bg-slate-900/10"}`}>
                    <div className="relative shrink-0 mt-0.5">
                      <div className={`w-8 h-4.5 rounded-full transition-colors duration-200 ${isActive ? "bg-rose-600" : "bg-slate-800"}`} />
                      <div className={`absolute top-0.5 left-0.5 w-3.5 h-3.5 rounded-full bg-white transition-transform duration-200 ${isActive ? "translate-x-3.5" : ""}`} />
                    </div>
                    <span className={`text-[11px] leading-tight font-medium ${isActive ? "text-rose-455 font-semibold" : "text-slate-400"}`}>{sw.label}</span>
                  </div>
                );
              })}
            </div>

            {config.custom_audio_order && (
              <div className="pt-3 border-t border-slate-850 text-left space-y-2 animate-fadeIn">
                <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider font-mono">{t.node7_audio_order_label}</label>
                <input type="text" value={config.audio_order_list} onChange={(e) => setConfig((prev) => ({ ...prev, audio_order_list: e.target.value }))} placeholder={t.node7_placeholder_audio_list} className="w-full bg-slate-950 border border-slate-800 focus:border-rose-500 rounded-xl px-4.5 py-2.5 text-xs text-slate-200 placeholder-slate-650 transition-all font-mono" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
