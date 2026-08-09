import { cn } from "../../lib/utils";
import { useState, useEffect } from "react";
import { PipelineWizardState } from "./usePipelineWizard";
import * as LucideIcons from "lucide-react";
import { safeSystemFetch } from "../../lib/shared-utils";
import {
  API_ROUTES,
  UltraStreamLogType,
  ErrorMessage,
  STORAGE_KEYS,
  LogLevel,
  LOG_LEVEL_SYMBOLS,
  DEFAULT_AUDIO_ORDER_LIST,
  HTTP_HEADERS,
  CONTENT_TYPES,
  getBackendMsg,
  HTTP_METHODS,
  LOG_KEYWORDS,
  PIPELINE_STEP6_UI_TEXTS,
  INPUT_MODES,
  FOLDER_TYPES,
  MOTION_OPTIONS,
  TRANSITION_OPTIONS,
  PIPELINE_MODAL_TYPES,
  COMMON_OPTIONS,
} from "../../constants";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";
import { Tooltip } from "../ui/Tooltip";
import _ from "lodash";
import { jsonUtils } from "../../lib/json";
import { appLog } from "../../lib/logger";

const {
  Play,
  Sparkles,
  Terminal,
  FileJson,
  FolderOpen,
  CheckSquare,
  Square,
  Settings,
  Wand2,
  Wrench,
} = LucideIcons as any;

type ModalType =
  (typeof PIPELINE_MODAL_TYPES)[keyof typeof PIPELINE_MODAL_TYPES];

interface CapcutTemplate {
  id: string;
  name: string;
  filePath: string;
}

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
  is_auto_mode: boolean;
  input_mode: string;
  template_id: string;
  parent_folder: string;
  images_dir: string;
  voices_dir: string;
  camera_motion: string;
  transitions: string;
  project_name: string;
  auto_export_video: boolean;
  video_output_dir: string;
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
  is_auto_mode: true,
  input_mode: INPUT_MODES.ZIP,
  template_id: "",
  parent_folder: "",
  images_dir: "",
  voices_dir: "",
  camera_motion: MOTION_OPTIONS[0].value,
  transitions: TRANSITION_OPTIONS[0].value,
  project_name: "",
  auto_export_video: false,
  video_output_dir: "",
};

export default function PipelineStep6(props: PipelineWizardState) {
  const { t } = props;

  const [config, setConfig] = useState<UltraConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CAPCUT_ULTRA_CONFIG);
      return saved
        ? { ...DEFAULT_CONFIG, ...jsonUtils.safeParse<any>(saved, {}) }
        : DEFAULT_CONFIG;
    } catch (e) {
      return DEFAULT_CONFIG;
    }
  });

  const [isRunning, setIsRunning] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  const [templates, setTemplates] = useState<CapcutTemplate[]>([]);

  const [appModal, setAppModal] = useState<{
    isOpen: boolean;
    title: string;
    type: ModalType;
    message: string;
    inputValue: string;
    onConfirm: (val?: string) => void;
  }>({
    isOpen: false,
    title: "",
    type: PIPELINE_MODAL_TYPES.CONFIRM,
    message: "",
    inputValue: "",
    onConfirm: () => {},
  });
  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEYS.CAPCUT_ULTRA_CONFIG,
      jsonUtils.safeStringify(config),
    );
  }, [config]);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await fetch(API_ROUTES.PIPELINE_TEMPLATES);
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
        if (data.length > 0 && !config.template_id) {
          setConfig((p) => ({ ...p, template_id: data[0].filePath }));
        }
      }
    } catch (e: any) {
      addLog(
        `${PIPELINE_STEP6_UI_TEXTS.LOG_ERROR_PREFIX}${e.message}`,
        LogLevel.ERROR,
      );
    }
  };

  const executeDeleteTemplate = async (id: string) => {
    try {
      const res = await fetch(`${API_ROUTES.PIPELINE_TEMPLATES}/${id}`, {
        method: HTTP_METHODS.DELETE,
      });
      if (res.ok) {
        addLog(PIPELINE_STEP6_UI_TEXTS.LOG_DELETE_SUCCESS, LogLevel.SUCCESS);
        if (_.includes(config.template_id, id)) {
          setConfig((p) => ({ ...p, template_id: "" }));
        }
        fetchTemplates();
      } else {
        addLog(PIPELINE_STEP6_UI_TEXTS.LOG_DELETE_ERROR, LogLevel.ERROR);
      }
    } catch (e: any) {
      addLog(
        `${PIPELINE_STEP6_UI_TEXTS.LOG_ERROR_PREFIX}${e.message}`,
        LogLevel.ERROR,
      );
    }
  };

  const handleDeleteTemplate = (id: string) => {
    setAppModal({
      isOpen: true,
      title: PIPELINE_STEP6_UI_TEXTS.MODAL_TITLE_DELETE,
      type: PIPELINE_MODAL_TYPES.CONFIRM,
      message: PIPELINE_STEP6_UI_TEXTS.MODAL_MSG_DELETE,
      inputValue: "",
      onConfirm: () => executeDeleteTemplate(id),
    });
  };

  const executeRenameTemplate = async (id: string, newName: string) => {
    try {
      const res = await fetch(`${API_ROUTES.PIPELINE_TEMPLATES}/${id}`, {
        method: HTTP_METHODS.PUT,
        headers: { [HTTP_HEADERS.CONTENT_TYPE]: CONTENT_TYPES.JSON },
        body: jsonUtils.safeStringify({ newName: _.trim(newName) }),
      });
      if (res.ok) {
        addLog(PIPELINE_STEP6_UI_TEXTS.LOG_RENAME_SUCCESS, LogLevel.SUCCESS);
        const data = await res.json();
        fetchTemplates();
        if (_.includes(config.template_id, id)) {
          setConfig((p) => ({ ...p, template_id: data.filePath }));
        }
      } else {
        addLog(PIPELINE_STEP6_UI_TEXTS.LOG_RENAME_ERROR, LogLevel.ERROR);
      }
    } catch (e: any) {
      addLog(
        `${PIPELINE_STEP6_UI_TEXTS.LOG_ERROR_PREFIX}${e.message}`,
        LogLevel.ERROR,
      );
    }
  };

  const handleRenameTemplate = (id: string, currentName: string) => {
    setAppModal({
      isOpen: true,
      title: PIPELINE_STEP6_UI_TEXTS.MODAL_TITLE_RENAME,
      type: PIPELINE_MODAL_TYPES.PROMPT,
      message: PIPELINE_STEP6_UI_TEXTS.MODAL_MSG_RENAME,
      inputValue: currentName,
      onConfirm: (newName) => {
        if (!_.isEmpty(_.trim(newName)) && newName !== currentName) {
          executeRenameTemplate(id, newName!);
        }
      },
    });
  };

  const executeUploadTemplate = async (
    folderPath: string,
    customName: string,
  ) => {
    try {
      const finalName =
        customName.trim() || PIPELINE_STEP6_UI_TEXTS.DEFAULT_TEMPLATE_NAME;
      if (!finalName) {
        addLog(PIPELINE_STEP6_UI_TEXTS.ERR_NO_TEMPLATE_NAME, LogLevel.WARN);
        return;
      }
      const payload = {
        name: finalName,
        folderPath: folderPath,
      };

      const res = await fetch(API_ROUTES.PIPELINE_TEMPLATES, {
        method: HTTP_METHODS.POST,
        headers: { [HTTP_HEADERS.CONTENT_TYPE]: CONTENT_TYPES.JSON },
        body: jsonUtils.safeStringify(payload),
      });

      if (res.ok) {
        addLog(PIPELINE_STEP6_UI_TEXTS.LOG_UPLOAD_SUCCESS, LogLevel.SUCCESS);
        fetchTemplates();
      } else {
        const errData = await res.json();
        throw new Error(
          errData.error || PIPELINE_STEP6_UI_TEXTS.LOG_ERR_TEMPLATE,
        );
      }
    } catch (err: any) {
      addLog(
        `${PIPELINE_STEP6_UI_TEXTS.LOG_UPLOAD_ERROR}${err.message}`,
        LogLevel.ERROR,
      );
    }
  };

  const handleAddTemplateClick = async () => {
    try {
      const response = await safeSystemFetch(
        API_ROUTES.PIPELINE_SELECT_FOLDER,
        {},
      );
      if (response.success && response.data?.folderPath) {
        const folderPath = response.data.folderPath;
        const folderName =
          folderPath.split("\\").pop()?.split("/").pop() ||
          PIPELINE_STEP6_UI_TEXTS.DEFAULT_TEMPLATE_NAME;

        setAppModal({
          isOpen: true,
          title: PIPELINE_STEP6_UI_TEXTS.MODAL_TITLE_UPLOAD,
          type: PIPELINE_MODAL_TYPES.PROMPT,
          message: PIPELINE_STEP6_UI_TEXTS.MODAL_MSG_UPLOAD,
          inputValue: folderName,
          onConfirm: (val) => {
            if (!_.isEmpty(_.trim(val))) {
              executeUploadTemplate(folderPath, val!);
            }
          },
        });
      }
    } catch (err: any) {
      addLog(err.message, LogLevel.ERROR);
    }
  };

  const addLog = (msg: string, type: LogLevel = LogLevel.INFO) => {
    const time = new Date().toLocaleTimeString();
    const prefixMap: Record<LogLevel, string> = {
      [LogLevel.SUCCESS]: LOG_LEVEL_SYMBOLS.SUCCESS,
      [LogLevel.ERROR]: LOG_LEVEL_SYMBOLS.ERROR,
      [LogLevel.WARN]: LOG_LEVEL_SYMBOLS.WARN,
      [LogLevel.INFO]: LOG_LEVEL_SYMBOLS.INFO,
    };
    const prefix = prefixMap[type] || LOG_LEVEL_SYMBOLS.INFO;
    const logString = `[${time}] ${prefix} ${msg}`;
    setConsoleLogs((prev) => [...prev, logString]);
    appLog(logString);
  };

  const leftSwitches = [
    {
      key: "dynamic_motion",
      label: t.node7_opt_motion,
      tooltip: t.node7_opt_motion_tt,
    },
    {
      key: "auto_fill_canvas",
      label: t.node7_opt_fill_canvas,
      tooltip: t.node7_opt_fill_canvas_tt,
    },
    {
      key: "randomize_video",
      label: t.node7_opt_randomize,
      tooltip: t.node7_opt_randomize_tt,
    },
    {
      key: "reverse_timeline",
      label: t.node7_opt_reverse,
      tooltip: t.node7_opt_reverse_tt,
    },
    {
      key: "clear_transitions",
      label: t.node7_opt_clear_trans,
      tooltip: t.node7_opt_clear_trans_tt,
    },
    {
      key: "sync_image_to_audio",
      label: t.node7_opt_sync,
      tooltip: t.node7_opt_sync_tt,
    },
  ];

  const rightSwitches = [
    {
      key: "auto_transition",
      label: t.node7_opt_transition,
      tooltip: t.node7_opt_transition_tt,
    },
    {
      key: "custom_audio_order",
      label: t.node7_opt_custom_order,
      tooltip: t.node7_opt_custom_order_tt,
    },
    {
      key: "ultra_music_mix",
      label: t.node7_opt_music_mix,
      tooltip: t.node7_opt_music_mix_tt,
    },
    {
      key: "normalize_volume",
      label: t.node7_opt_normalize,
      tooltip: t.node7_opt_normalize_tt,
    },
    {
      key: "ai_sfx_generator",
      label: t.node7_opt_sfx,
      tooltip: t.node7_opt_sfx_tt,
    },
    {
      key: "auto_subtitles",
      label: t.node7_opt_subtitles,
      tooltip: t.node7_opt_subtitles_tt,
    },
  ];

  const switches = [...leftSwitches, ...rightSwitches];

  const handleToggle = (key: keyof UltraConfig) => {
    setConfig((prev) => ({ ...prev, [key]: !prev[key] as any }));
  };

  const toggleAllSwitches = (value: boolean) => {
    setConfig((prev) =>
      _.reduce(
        switches,
        (acc, sw) => {
          (acc as any)[sw.key] = value;
          return acc;
        },
        { ...prev },
      ),
    );
    addLog(value ? t.node7_select_all : t.node7_deselect_all, LogLevel.INFO);
  };

  const handleSelectFile = async () => {
    try {
      const response = await safeSystemFetch(
        API_ROUTES.PIPELINE_SELECT_FILE,
        {},
      );
      if (response.success && response.data?.filePath) {
        setConfig((prev) => ({
          ...prev,
          draft_json_path: response.data.filePath,
        }));
        addLog(
          t.node7_log_selected_file.replace("{path}", response.data.filePath),
          LogLevel.SUCCESS,
        );
      }
    } catch (err: any) {
      addLog(err.message, LogLevel.ERROR);
    }
  };

  const handleSelectFolder = async (
    type: (typeof FOLDER_TYPES)[keyof typeof FOLDER_TYPES] = FOLDER_TYPES.SFX,
  ) => {
    try {
      const response = await safeSystemFetch(
        API_ROUTES.PIPELINE_SELECT_FOLDER,
        {},
      );
      if (response.success && response.data?.folderPath) {
        if (type === FOLDER_TYPES.PARENT) {
          setConfig((prev) => ({
            ...prev,
            parent_folder: response.data.folderPath,
          }));
          addLog(
            `${PIPELINE_STEP6_UI_TEXTS.LOG_SELECT_PARENT}${response.data.folderPath}`,
            LogLevel.SUCCESS,
          );
        } else if (type === FOLDER_TYPES.IMAGES) {
          setConfig((prev) => ({
            ...prev,
            images_dir: response.data.folderPath,
          }));
          addLog(
            `${PIPELINE_STEP6_UI_TEXTS.LOG_SELECT_IMAGES}${response.data.folderPath}`,
            LogLevel.SUCCESS,
          );
        } else if (type === FOLDER_TYPES.VOICES) {
          setConfig((prev) => ({
            ...prev,
            voices_dir: response.data.folderPath,
          }));
          addLog(
            `${PIPELINE_STEP6_UI_TEXTS.LOG_SELECT_VOICES}${response.data.folderPath}`,
            LogLevel.SUCCESS,
          );
        } else if (type === FOLDER_TYPES.VIDEO_OUTPUT) {
          setConfig((prev) => ({
            ...prev,
            video_output_dir: response.data.folderPath,
          }));
          addLog(
            `${PIPELINE_STEP6_UI_TEXTS.LOG_SELECT_VIDEO_OUTPUT}${response.data.folderPath}`,
            LogLevel.SUCCESS,
          );
        } else {
          setConfig((prev) => ({
            ...prev,
            sfx_folder: response.data.folderPath,
          }));
        }
      }
    } catch (err: any) {
      addLog(err.message, LogLevel.ERROR);
    }
  };

  const handleRunProcess = async () => {
    if (config.is_auto_mode) {
      if (_.isEmpty(config.template_id)) {
        addLog(PIPELINE_STEP6_UI_TEXTS.ERR_SELECT_TEMPLATE, LogLevel.ERROR);
        return;
      }
      if (
        config.input_mode === INPUT_MODES.ZIP &&
        _.isEmpty(config.parent_folder)
      ) {
        addLog(PIPELINE_STEP6_UI_TEXTS.ERR_SELECT_ZIP, LogLevel.ERROR);
        return;
      }
      if (
        config.input_mode === INPUT_MODES.SPLIT &&
        _.some([config.images_dir, config.voices_dir], _.isEmpty)
      ) {
        addLog(PIPELINE_STEP6_UI_TEXTS.ERR_SELECT_SPLIT, LogLevel.ERROR);
        return;
      }
    } else {
      if (_.isEmpty(_.trim(config.draft_json_path))) {
        addLog(t.node7_log_missing_file, LogLevel.ERROR);
        return;
      }
    }

    if (
      config.auto_export_video &&
      _.isEmpty(_.trim(config.video_output_dir))
    ) {
      addLog(PIPELINE_STEP6_UI_TEXTS.ERR_SELECT_VIDEO_OUTPUT, LogLevel.ERROR);
      return;
    }

    setIsRunning(true);
    setConsoleLogs([]);
    addLog(t.node7_log_started, LogLevel.INFO);

    try {
      const payload = {
        filePath: config.draft_json_path.trim(),
        geminiApiKey: config.api_key.trim(),
        sfxFolder: config.sfx_folder.trim(),
        isAutoMode: config.is_auto_mode,
        templateId: config.template_id,
        parentFolder:
          config.input_mode === INPUT_MODES.ZIP ? config.parent_folder : "",
        imagesDir:
          config.input_mode === INPUT_MODES.SPLIT ? config.images_dir : "",
        voicesDir:
          config.input_mode === INPUT_MODES.SPLIT ? config.voices_dir : "",
        projectId:
          config.input_mode === INPUT_MODES.CURRENT
            ? props.project?.id
            : undefined,
        projectName: config.project_name.trim(),
        autoExportVideo: config.auto_export_video,
        videoOutputDir: config.auto_export_video
          ? config.video_output_dir.trim()
          : "",
        projectStyle: {
          camera_motion: config.dynamic_motion
            ? config.camera_motion
            : COMMON_OPTIONS.NONE,
          transitions: config.auto_transition
            ? config.transitions
            : COMMON_OPTIONS.NONE,
        },
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

      const response = await fetch(API_ROUTES.PIPELINE_RUN_ULTRA, {
        method: HTTP_METHODS.POST,
        headers: { [HTTP_HEADERS.CONTENT_TYPE]: CONTENT_TYPES.JSON },
        body: jsonUtils.safeStringify(payload),
      });

      if (!response.body)
        throw new Error(getBackendMsg("STREAM_NOT_SUPPORTED"));

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      let lastSuccessMessage = "";
      let streamComplete = false;
      while (!streamComplete) {
        const { value, done } = await reader.read();
        if (done) {
          streamComplete = true;
          continue;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim()) continue;
          let parsed = false;
          try {
            const data = jsonUtils.safeParse<any>(line, null);
            parsed = true;
            if (data?.type === UltraStreamLogType.LOG) {
              addLog(data.message, LogLevel.INFO);
            } else if (data?.type === UltraStreamLogType.ERROR_LOG) {
              addLog(data.message, LogLevel.WARN);
            } else if (data && "success" in data) {
              if (data.success) {
                lastSuccessMessage = data.message || t.node7_log_success;
              } else {
                addLog(
                  data.error || ErrorMessage.CAPCUT_ULTRA_OPTIMIZATION_ERROR,
                  LogLevel.ERROR,
                );
              }
            }
          } catch (_parseErr: any) {
            if (!parsed && line.trim()) {
              addLog(line.trim(), LogLevel.INFO);
            }
          }
        }
      }

      if (!_.isEmpty(_.trim(buffer))) {
        try {
          const data = jsonUtils.safeParse<any>(buffer, null);
          if (data && "success" in data) {
            if (data.success) {
              lastSuccessMessage = data.message || t.node7_log_success;
            } else {
              addLog(
                data.error || ErrorMessage.CAPCUT_ULTRA_OPTIMIZATION_ERROR,
                LogLevel.ERROR,
              );
            }
          }
        } catch (_ignored) {}
      }

      if (lastSuccessMessage) {
        addLog(lastSuccessMessage, LogLevel.SUCCESS);
      }
    } catch (err: any) {
      addLog(t.node7_log_error.replace("{error}", err.message), LogLevel.ERROR);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="bg-gradient-to-b from-slate-900/90 to-slate-950/95 border border-slate-800/85 p-6 md:p-8 rounded-2xl shadow-2xl space-y-6 relative overflow-visible">
      <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/[0.03] rounded-full blur-3xl pointer-events-none" />
      <div className="flex flex-col gap-1 text-left relative z-10">
        <h2 className="text-xl font-extrabold text-slate-100 flex items-center gap-2 tracking-tight uppercase">
          <Sparkles className="w-5 h-5 text-rose-500" />
          {t.node7_title}
        </h2>
        <p className="text-xs text-slate-450 leading-relaxed">{t.node7_desc}</p>
      </div>

      <div className="bg-slate-900/60 border border-slate-850 rounded-xl overflow-hidden shadow-2xl flex flex-col text-left animate-fadeIn">
        <div className="px-5 py-3 border-b border-slate-850 bg-slate-900/40 flex items-center justify-between shrink-0">
          <span className="text-[10px] font-bold text-slate-400 tracking-wider font-mono flex items-center gap-1.5 select-none">
            <Terminal className="w-3.5 h-3.5 text-rose-500" />
            {t.node7_console_title}
          </span>
        </div>
        <div className="p-5 bg-slate-950 font-mono text-[11px] leading-relaxed text-slate-350 h-[300px] overflow-y-auto custom-scrollbar space-y-1.5 select-text">
          {consoleLogs.length === 0 ? (
            <div className="text-slate-650 italic">
              {t.node7_console_waiting}
            </div>
          ) : (
            _.map(consoleLogs, (log, index) => {
              let textClass = "text-slate-300";
              if (
                _.some([LOG_LEVEL_SYMBOLS.SUCCESS, LOG_KEYWORDS.SUCCESS], (k) =>
                  _.includes(log, k),
                )
              )
                textClass = "text-teal-400 font-semibold";
              else if (
                _.some([LOG_LEVEL_SYMBOLS.ERROR, LOG_KEYWORDS.ERROR], (k) =>
                  _.includes(log, k),
                )
              )
                textClass = "text-rose-500 font-semibold";
              else if (
                _.some([LOG_LEVEL_SYMBOLS.WARN], (k) => _.includes(log, k))
              )
                textClass = "text-amber-400";
              return (
                <div key={index} className={textClass}>
                  {log}
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-5 flex flex-col bg-slate-900/40 p-5 rounded-xl border border-slate-850 backdrop-blur-sm text-left">
          <div className="flex gap-2 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800/80 mb-6 shrink-0 shadow-inner">
            <button
              onClick={() => setConfig((p) => ({ ...p, is_auto_mode: true }))}
              className={cn(
                "flex-1 py-2.5 text-[10px] font-bold tracking-widest uppercase rounded-lg flex items-center justify-center gap-2 transition-all",
                config.is_auto_mode
                  ? "bg-rose-500 text-white shadow-md"
                  : "text-slate-450 hover:text-slate-200 hover:bg-slate-900",
              )}
            >
              <Wand2 className="w-3.5 h-3.5" />
              {PIPELINE_STEP6_UI_TEXTS.BTN_AUTO}
            </button>
            <button
              onClick={() => setConfig((p) => ({ ...p, is_auto_mode: false }))}
              className={cn(
                "flex-1 py-2.5 text-[10px] font-bold tracking-widest uppercase rounded-lg flex items-center justify-center gap-2 transition-all",
                !config.is_auto_mode
                  ? "bg-slate-700 text-white shadow-md"
                  : "text-slate-450 hover:text-slate-200 hover:bg-slate-900",
              )}
            >
              <Wrench className="w-3.5 h-3.5" />
              {PIPELINE_STEP6_UI_TEXTS.BTN_MANUAL}
            </button>
          </div>

          <div className="flex-1">
            {config.is_auto_mode ? (
              <div className="space-y-6 animate-fadeIn">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label
                      className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 font-mono select-none"
                      title={PIPELINE_STEP6_UI_TEXTS.TOOLTIP_TEMPLATE}
                    >
                      <FileJson className="w-3.5 h-3.5 text-rose-500" />
                      {PIPELINE_STEP6_UI_TEXTS.TITLE_TEMPLATE}
                    </label>
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={handleAddTemplateClick}
                      disabled={templates.length >= 2}
                      className="h-6 px-2.5 text-[10px] bg-slate-800/50 hover:bg-slate-700 text-slate-300 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FolderOpen className="w-3 h-3 mr-1 text-rose-400" />
                      {PIPELINE_STEP6_UI_TEXTS.BTN_UPLOAD}
                    </Button>
                  </div>
                  <div
                    className={cn(
                      "grid gap-3",
                      templates.length > 0 ? "grid-cols-2" : "grid-cols-1",
                    )}
                  >
                    {templates.length === 0 ? (
                      <div className="w-full flex items-center justify-center bg-slate-950/40 border border-slate-800/50 border-dashed rounded-xl px-4 py-6 text-xs text-slate-500 italic">
                        {PIPELINE_STEP6_UI_TEXTS.NO_TEMPLATE_FOUND}
                      </div>
                    ) : (
                      _.map(templates, (t) => (
                        <div
                          key={t.id}
                          className={cn(
                            "group flex flex-col justify-between px-4 py-3 text-xs rounded-xl border transition-all cursor-pointer h-full gap-2",
                            config.template_id === t.filePath
                              ? "bg-rose-500/15 border-rose-500 shadow-[0_0_15px_-3px_rgba(244,63,94,0.2)] ring-1 ring-rose-500/50"
                              : "bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/40",
                          )}
                          onClick={() =>
                            setConfig((p) => ({
                              ...p,
                              template_id: t.filePath,
                            }))
                          }
                        >
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-2 overflow-hidden flex-1">
                              <div
                                className={cn(
                                  "w-2.5 h-2.5 rounded-full shrink-0 transition-all",
                                  config.template_id === t.filePath
                                    ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]"
                                    : "bg-slate-700",
                                )}
                              />
                              <span
                                className={cn(
                                  "truncate font-medium transition-colors",
                                  config.template_id === t.filePath
                                    ? "text-rose-400 font-bold"
                                    : "text-slate-300 group-hover:text-slate-200",
                                )}
                                title={t.name}
                              >
                                {t.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 lg:opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                              <button
                                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-blue-400 transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRenameTemplate(t.id, t.name);
                                }}
                                title={
                                  PIPELINE_STEP6_UI_TEXTS.MODAL_TITLE_RENAME
                                }
                              >
                                <LucideIcons.Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteTemplate(t.id);
                                }}
                                title={
                                  PIPELINE_STEP6_UI_TEXTS.MODAL_TITLE_DELETE
                                }
                              >
                                <LucideIcons.Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="space-y-3 pt-2 border-t border-slate-800/50">
                  <div className="flex items-center justify-between">
                    <label
                      className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 font-mono select-none"
                      title={PIPELINE_STEP6_UI_TEXTS.TOOLTIP_PROJECT_NAME}
                    >
                      <FileJson className="w-3.5 h-3.5 text-rose-500" />
                      {PIPELINE_STEP6_UI_TEXTS.TITLE_PROJECT_NAME}
                    </label>
                  </div>
                  <input
                    type="text"
                    value={config.project_name}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        project_name: e.target.value,
                      }))
                    }
                    placeholder={
                      PIPELINE_STEP6_UI_TEXTS.PLACEHOLDER_PROJECT_NAME
                    }
                    className="w-full bg-slate-950/80 border border-slate-800/80 focus:border-rose-500/50 rounded-xl px-4 h-10 text-xs text-slate-200 shadow-inner"
                  />
                </div>

                <div className="pt-2 border-t border-slate-800/50">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label
                        className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 font-mono select-none"
                        title={PIPELINE_STEP6_UI_TEXTS.TOOLTIP_MEDIA}
                      >
                        <FolderOpen className="w-3.5 h-3.5 text-rose-500" />
                        {PIPELINE_STEP6_UI_TEXTS.TITLE_MEDIA}
                      </label>
                      <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800/80">
                        <button
                          onClick={() =>
                            setConfig((p) => ({
                              ...p,
                              input_mode: INPUT_MODES.ZIP,
                            }))
                          }
                          className={cn(
                            "px-3 py-1 text-[9px] font-bold uppercase rounded-md transition-all",
                            config.input_mode === INPUT_MODES.ZIP
                              ? "bg-slate-800 text-white shadow-sm"
                              : "text-slate-500 hover:text-slate-300",
                          )}
                          title={PIPELINE_STEP6_UI_TEXTS.BTN_MODE_ZIP_TOOLTIP}
                        >
                          {PIPELINE_STEP6_UI_TEXTS.BTN_MODE_ZIP}
                        </button>
                        <button
                          onClick={() =>
                            setConfig((p) => ({
                              ...p,
                              input_mode: INPUT_MODES.SPLIT,
                            }))
                          }
                          className={cn(
                            "px-3 py-1 text-[9px] font-bold uppercase rounded-md transition-all",
                            config.input_mode === INPUT_MODES.SPLIT
                              ? "bg-slate-800 text-white shadow-sm"
                              : "text-slate-500 hover:text-slate-300",
                          )}
                          title={PIPELINE_STEP6_UI_TEXTS.BTN_MODE_SPLIT_TOOLTIP}
                        >
                          {PIPELINE_STEP6_UI_TEXTS.BTN_MODE_SPLIT}
                        </button>
                        <button
                          onClick={() =>
                            setConfig((p) => ({
                              ...p,
                              input_mode: INPUT_MODES.CURRENT,
                            }))
                          }
                          className={cn(
                            "px-3 py-1 text-[9px] font-bold uppercase rounded-md transition-all",
                            config.input_mode === INPUT_MODES.CURRENT
                              ? "bg-slate-800 text-white shadow-sm"
                              : "text-slate-500 hover:text-slate-300",
                          )}
                          title={
                            PIPELINE_STEP6_UI_TEXTS.BTN_MODE_CURRENT_TOOLTIP
                          }
                        >
                          {PIPELINE_STEP6_UI_TEXTS.BTN_MODE_CURRENT}
                        </button>
                      </div>
                    </div>

                    {config.input_mode === INPUT_MODES.ZIP ? (
                      <div className="flex gap-2 animate-fadeIn">
                        <input
                          type="text"
                          value={config.parent_folder}
                          onChange={(e) =>
                            setConfig((prev) => ({
                              ...prev,
                              parent_folder: e.target.value,
                            }))
                          }
                          placeholder={PIPELINE_STEP6_UI_TEXTS.PLACEHOLDER_ZIP}
                          className="flex-1 bg-slate-950/80 border border-slate-800/80 focus:border-rose-500/50 rounded-xl px-4 h-10 text-xs text-slate-200 shadow-inner"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() =>
                            handleSelectFolder(FOLDER_TYPES.PARENT)
                          }
                          className="px-4 h-10 bg-slate-950/80 hover:bg-slate-900 border border-slate-800/80 rounded-xl text-slate-400 transition-colors"
                        >
                          <FolderOpen className="w-4 h-4 text-rose-500" />
                        </Button>
                      </div>
                    ) : config.input_mode === INPUT_MODES.SPLIT ? (
                      <div className="grid grid-cols-2 gap-3 animate-fadeIn">
                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            value={config.images_dir}
                            onChange={(e) =>
                              setConfig((prev) => ({
                                ...prev,
                                images_dir: e.target.value,
                              }))
                            }
                            placeholder={
                              PIPELINE_STEP6_UI_TEXTS.PLACEHOLDER_IMAGES
                            }
                            className="flex-1 w-0 bg-slate-950/80 border border-slate-800/80 focus:border-rose-500/50 rounded-xl px-3 h-10 text-xs text-slate-200 shadow-inner"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() =>
                              handleSelectFolder(FOLDER_TYPES.IMAGES)
                            }
                            className="px-3 h-10 shrink-0 bg-slate-950/80 border border-slate-800/80 rounded-xl text-slate-400 hover:text-rose-400 transition-colors"
                          >
                            <FolderOpen className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            value={config.voices_dir}
                            onChange={(e) =>
                              setConfig((prev) => ({
                                ...prev,
                                voices_dir: e.target.value,
                              }))
                            }
                            placeholder={
                              PIPELINE_STEP6_UI_TEXTS.PLACEHOLDER_VOICES
                            }
                            className="flex-1 w-0 bg-slate-950/80 border border-slate-800/80 focus:border-rose-500/50 rounded-xl px-3 h-10 text-xs text-slate-200 shadow-inner"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() =>
                              handleSelectFolder(FOLDER_TYPES.VOICES)
                            }
                            className="px-3 h-10 shrink-0 bg-slate-950/80 border border-slate-800/80 rounded-xl text-slate-400 hover:text-rose-400 transition-colors"
                          >
                            <FolderOpen className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2 animate-fadeIn p-2 border border-slate-800/80 rounded-xl bg-slate-900/30 items-center justify-center h-10">
                        <span className="text-xs text-slate-400 italic text-center px-4">
                          {PIPELINE_STEP6_UI_TEXTS.AUTO_GET_MEDIA}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/50">
                  <div
                    onClick={() =>
                      setConfig((prev) => ({
                        ...prev,
                        auto_export_video: !prev.auto_export_video,
                      }))
                    }
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer select-none",
                      config.auto_export_video
                        ? "bg-amber-500/15 border-amber-500/80 shadow-[0_0_15px_-3px_rgba(245,158,11,0.2)] ring-1 ring-amber-500/40"
                        : "bg-slate-950/20 border-slate-850 hover:border-slate-800 hover:bg-slate-900/10",
                    )}
                  >
                    <div className="relative shrink-0">
                      <div
                        className={cn(
                          "w-8 h-4.5 rounded-full transition-colors duration-200",
                          config.auto_export_video
                            ? "bg-amber-500"
                            : "bg-slate-800",
                        )}
                      />
                      <div
                        className={cn(
                          "absolute top-0.5 left-0.5 w-3.5 h-3.5 rounded-full bg-white transition-transform duration-200",
                          config.auto_export_video ? "translate-x-3.5" : "",
                        )}
                      />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span
                        className={cn(
                          "text-[11px] font-semibold leading-tight",
                          config.auto_export_video
                            ? "text-amber-400"
                            : "text-slate-400",
                        )}
                      >
                        {PIPELINE_STEP6_UI_TEXTS.LABEL_EXPORT_VIDEO}
                      </span>
                      <span className="text-[10px] text-slate-600 leading-tight">
                        {PIPELINE_STEP6_UI_TEXTS.TOOLTIP_EXPORT_VIDEO}
                      </span>
                    </div>
                  </div>

                  <div
                    className={cn(
                      "grid transition-[grid-template-rows,opacity,margin] duration-300 ease-in-out",
                      config.auto_export_video
                        ? "grid-rows-[1fr] opacity-100 mt-3"
                        : "grid-rows-[0fr] opacity-0 mt-0",
                    )}
                  >
                    <div className="overflow-hidden">
                      <div className="space-y-1.5 pb-1">
                        <label
                          className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5 font-mono select-none"
                          title={
                            PIPELINE_STEP6_UI_TEXTS.TOOLTIP_VIDEO_OUTPUT_DIR
                          }
                        >
                          <LucideIcons.Video className="w-3.5 h-3.5 text-amber-400" />
                          {PIPELINE_STEP6_UI_TEXTS.TITLE_VIDEO_OUTPUT_DIR}
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={config.video_output_dir}
                            onChange={(e) =>
                              setConfig((prev) => ({
                                ...prev,
                                video_output_dir: e.target.value,
                              }))
                            }
                            placeholder={
                              PIPELINE_STEP6_UI_TEXTS.PLACEHOLDER_VIDEO_OUTPUT_DIR
                            }
                            className="flex-1 bg-slate-950/80 border border-amber-800/40 focus:border-amber-500/50 rounded-xl px-4 h-10 text-xs text-slate-200 shadow-inner outline-none"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() =>
                              handleSelectFolder(FOLDER_TYPES.VIDEO_OUTPUT)
                            }
                            className="px-4 h-10 bg-slate-950/80 hover:bg-amber-900/20 border border-amber-800/40 rounded-xl text-amber-400 transition-colors"
                            title={
                              PIPELINE_STEP6_UI_TEXTS.TOOLTIP_VIDEO_OUTPUT_DIR
                            }
                          >
                            <FolderOpen className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-5 animate-fadeIn">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-450 uppercase tracking-wider flex items-center gap-1.5 font-mono select-none">
                    <FileJson className="w-3.5 h-3.5 text-rose-500" />
                    {t.node7_input_file_label}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={config.draft_json_path}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          draft_json_path: e.target.value,
                        }))
                      }
                      placeholder={t.node7_placeholder_file}
                      className="flex-1 bg-slate-950/80 border border-slate-800/80 rounded-xl px-4 py-3 text-xs text-slate-200 shadow-inner"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={handleSelectFile}
                      className="px-4 bg-slate-950/80 hover:bg-slate-900 border border-slate-800/80 rounded-xl text-slate-400"
                    >
                      <FolderOpen className="w-4 h-4 text-rose-500" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 mt-5 border-t border-slate-850">
            <Button
              variant="primary"
              size="lg"
              onClick={handleRunProcess}
              disabled={isRunning}
              className="w-full"
            >
              {isRunning ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>{t.node7_status_processing}</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>
                    {config.is_auto_mode
                      ? PIPELINE_STEP6_UI_TEXTS.BTN_RUN_AUTO
                      : t.node7_run_btn}
                  </span>
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900/40 p-5 rounded-xl border border-slate-850 backdrop-blur-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-850 pb-3">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono select-none flex items-center gap-2">
                <Settings className="w-4 h-4 text-rose-500" />
                {t.node7_opt_title}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => toggleAllSwitches(true)}
                  className="text-slate-450 border-slate-800 flex items-center gap-1 shadow-none"
                >
                  <CheckSquare className="w-3 h-3 text-rose-500" />{" "}
                  {t.node7_select_all}
                </Button>
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => toggleAllSwitches(false)}
                  className="text-slate-450 border-slate-800 flex items-center gap-1 shadow-none"
                >
                  <Square className="w-3 h-3 text-slate-500" />{" "}
                  {t.node7_deselect_all}
                </Button>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6 text-left">
              <div className="flex-1 flex flex-col gap-3.5">
                {_.map(leftSwitches, (sw) => {
                  const isActive = config[
                    sw.key as keyof UltraConfig
                  ] as boolean;
                  return (
                    <div
                      key={sw.key}
                      className={cn(
                        "rounded-xl border transition-all",
                        isActive
                          ? "bg-slate-900/40 border-rose-500/50 shadow-[0_0_15px_-3px_rgba(244,63,94,0.15)] ring-1 ring-rose-500/20"
                          : "bg-slate-950/20 border-slate-850 hover:border-slate-800 hover:bg-slate-900/10",
                      )}
                    >
                      <div
                        onClick={() =>
                          handleToggle(sw.key as keyof UltraConfig)
                        }
                        className="flex items-center gap-3 p-3 cursor-pointer select-none"
                      >
                        <div className="relative shrink-0 mt-0.5">
                          <div
                            className={cn(
                              `w-8 h-4.5 rounded-full transition-all duration-200 ${isActive ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]" : "bg-slate-800"}`,
                            )}
                          />
                          <div
                            className={cn(
                              `absolute top-0.5 left-0.5 w-3.5 h-3.5 rounded-full bg-white transition-transform duration-200 ${isActive ? "translate-x-3.5" : ""}`,
                            )}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              `text-[11px] leading-tight font-medium ${isActive ? "text-rose-455 font-semibold" : "text-slate-400"}`,
                            )}
                          >
                            {sw.label}
                          </span>
                          <Tooltip content={sw.tooltip} position="top">
                            <LucideIcons.Info className="w-3.5 h-3.5 text-slate-500 opacity-60 hover:opacity-100 transition-opacity" />
                          </Tooltip>
                        </div>
                      </div>

                      {sw.key === "dynamic_motion" && (
                        <div
                          className={cn(
                            "grid transition-[grid-template-rows,opacity,margin] duration-300 ease-in-out",
                            isActive
                              ? "grid-rows-[1fr] opacity-100"
                              : "grid-rows-[0fr] opacity-0",
                          )}
                        >
                          <div className="overflow-hidden">
                            <div className="px-3 pb-3 border-t border-slate-800/50 mt-1 pt-3 space-y-2">
                              <label
                                className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono pl-1"
                                title={PIPELINE_STEP6_UI_TEXTS.TOOLTIP_MOTION}
                              >
                                <LucideIcons.Camera className="w-3.5 h-3.5 text-indigo-400" />
                                {PIPELINE_STEP6_UI_TEXTS.TITLE_MOTION}
                              </label>
                              <div className="relative flex items-center bg-slate-950/80 border border-slate-800/80 rounded-xl focus-within:border-rose-500/80 focus-within:ring-1 focus-within:ring-rose-500/20 px-3 py-2.5 transition-all shadow-sm h-10">
                                <select
                                  value={config.camera_motion}
                                  onChange={(e) =>
                                    setConfig((p) => ({
                                      ...p,
                                      camera_motion: e.target.value,
                                    }))
                                  }
                                  className="flex-1 bg-transparent border-none text-slate-200 text-xs font-semibold outline-none cursor-pointer appearance-none pr-6 w-full"
                                >
                                  {_.map(MOTION_OPTIONS, (opt) => (
                                    <option
                                      key={opt.value}
                                      value={opt.value}
                                      className="bg-slate-900 text-slate-200"
                                    >
                                      {opt.label}
                                    </option>
                                  ))}
                                </select>
                                <LucideIcons.ChevronDown className="pointer-events-none absolute right-3 text-slate-500 w-4 h-4" />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex-1 flex flex-col gap-3.5">
                {_.map(rightSwitches, (sw) => {
                  const isActive = config[
                    sw.key as keyof UltraConfig
                  ] as boolean;
                  return (
                    <div
                      key={sw.key}
                      className={cn(
                        "rounded-xl border transition-all",
                        isActive
                          ? "bg-slate-900/40 border-rose-500/50 shadow-[0_0_15px_-3px_rgba(244,63,94,0.15)] ring-1 ring-rose-500/20"
                          : "bg-slate-950/20 border-slate-850 hover:border-slate-800 hover:bg-slate-900/10",
                      )}
                    >
                      <div
                        onClick={() =>
                          handleToggle(sw.key as keyof UltraConfig)
                        }
                        className="flex items-center gap-3 p-3 cursor-pointer select-none"
                      >
                        <div className="relative shrink-0 mt-0.5">
                          <div
                            className={cn(
                              `w-8 h-4.5 rounded-full transition-all duration-200 ${isActive ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]" : "bg-slate-800"}`,
                            )}
                          />
                          <div
                            className={cn(
                              `absolute top-0.5 left-0.5 w-3.5 h-3.5 rounded-full bg-white transition-transform duration-200 ${isActive ? "translate-x-3.5" : ""}`,
                            )}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              `text-[11px] leading-tight font-medium ${isActive ? "text-rose-455 font-semibold" : "text-slate-400"}`,
                            )}
                          >
                            {sw.label}
                          </span>
                          <Tooltip content={sw.tooltip} position="top">
                            <LucideIcons.Info className="w-3.5 h-3.5 text-slate-500 opacity-60 hover:opacity-100 transition-opacity" />
                          </Tooltip>
                        </div>
                      </div>

                      {sw.key === "auto_transition" && (
                        <div
                          className={cn(
                            "grid transition-[grid-template-rows,opacity,margin] duration-300 ease-in-out",
                            isActive
                              ? "grid-rows-[1fr] opacity-100"
                              : "grid-rows-[0fr] opacity-0",
                          )}
                        >
                          <div className="overflow-hidden">
                            <div className="px-3 pb-3 border-t border-slate-800/50 mt-1 pt-3 space-y-2">
                              <label
                                className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono pl-1"
                                title={
                                  PIPELINE_STEP6_UI_TEXTS.TOOLTIP_TRANSITION
                                }
                              >
                                <LucideIcons.ArrowRightLeft className="w-3.5 h-3.5 text-emerald-400" />
                                {PIPELINE_STEP6_UI_TEXTS.TITLE_TRANSITION}
                              </label>
                              <div className="relative flex items-center bg-slate-950/80 border border-slate-800/80 rounded-xl focus-within:border-rose-500/80 focus-within:ring-1 focus-within:ring-rose-500/20 px-3 py-2.5 transition-all shadow-sm h-10">
                                <select
                                  value={config.transitions}
                                  onChange={(e) =>
                                    setConfig((p) => ({
                                      ...p,
                                      transitions: e.target.value,
                                    }))
                                  }
                                  className="flex-1 bg-transparent border-none text-slate-200 text-xs font-semibold outline-none cursor-pointer appearance-none pr-6 w-full"
                                >
                                  {_.map(TRANSITION_OPTIONS, (opt) => (
                                    <option
                                      key={opt.value}
                                      value={opt.value}
                                      className={cn(
                                        "bg-slate-900",
                                        (opt as any).customClass ||
                                          "text-slate-200",
                                      )}
                                    >
                                      {opt.label}
                                    </option>
                                  ))}
                                </select>
                                <LucideIcons.ChevronDown className="pointer-events-none absolute right-3 text-slate-500 w-4 h-4" />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={appModal.isOpen}
        onClose={() => setAppModal((p) => ({ ...p, isOpen: false }))}
        title={appModal.title}
        maxWidth="max-w-md"
      >
        <div className="p-6 space-y-6">
          <p className="text-slate-300 text-sm">{appModal.message}</p>
          {appModal.type === PIPELINE_MODAL_TYPES.PROMPT && (
            <input
              type="text"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-rose-500"
              value={appModal.inputValue}
              onChange={(e) =>
                setAppModal((p) => ({ ...p, inputValue: e.target.value }))
              }
              autoFocus
            />
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="ghost"
              onClick={() => setAppModal((p) => ({ ...p, isOpen: false }))}
            >
              {PIPELINE_STEP6_UI_TEXTS.BTN_CANCEL}
            </Button>
            <Button
              className={
                appModal.type === PIPELINE_MODAL_TYPES.CONFIRM
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : "bg-rose-600 hover:bg-rose-700 text-white"
              }
              onClick={() => {
                setAppModal((p) => ({ ...p, isOpen: false }));
                appModal.onConfirm(
                  appModal.type === PIPELINE_MODAL_TYPES.PROMPT
                    ? appModal.inputValue
                    : undefined,
                );
              }}
            >
              {PIPELINE_STEP6_UI_TEXTS.BTN_CONFIRM}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
