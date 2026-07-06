import { base64ToArrayBuffer, blobToBase64 } from "../../lib/fileUtils.js";
import { useState, useEffect, useRef, useMemo } from "react";
import { formatCleanDuration } from "./pipeline-utils";
import { formatTimeHelper } from "../../utils/helpers";
import { translations } from "../../lib/lang";

import { appLog, appError, appWarn } from "../../lib/logger.js";

const logger = {
  log: appLog,
  error: appError,
  warn: appWarn,
};
import { EXTERNAL_URLS, API_ROUTES } from "../../constants/apiRoutes";
import { LOADING_KEYS } from "../../constants/loading";
import { VOICE_ALIGN_LOGS, getPipelineLog } from "../../constants/messages";
import { EXPORT_TYPES } from "../../constants/enums";
import {
  LOG_SUCCESS_KEYWORDS,
  LOG_PENDING_KEYWORDS,
  LOG_WARN_KEYWORDS,
  LOG_ERROR_KEYWORDS,
} from "../../constants/data";
import {
  APP_TEXTS,
  AUDIO_MIME_TYPE,
  SIMULATED_SPEECH_VAL,
  BLOB_PREFIX,
  RESTORE_SCENE_BLOB_ERR,
  RESTORE_BLOB_ERR,
  COMMON_STRINGS,
  EXTERNAL_AUDIO_TEXTS,
} from "../../constants/texts";
import {
  VideoProject,
  HookVersion,
  StoryboardScene,
  ThumbnailItem,
  WizardStep,
  ImageGeneratorEngine,
  ProjectLanguage,
  HookPosition,
  ImageGenerationMode,
  GeminiChatSpeed,
  GEMINI_CHAT_SPEED_TAB_COUNT,
  AudioType,
  Gender,
  AgeGroup,
  ProjectInputType,
} from "../../types";
import {
  applyAudioEffects,


  cleanScriptText,
} from "../../lib/audioProcessor";
import {
  getSceneTimeRanges,
  compileVideoToBlob,
} from "../../lib/videoRenderer";
import JSZip from "jszip";
import {
  safeSystemFetch,
  logSystemAction,
  getStoredApiKey,
  randomDelay,
  getBatchDelayMs,
} from "../../lib/shared-utils";
import { STORAGE_KEYS } from "../../constants/storageKeys";

import { VOICE_MODIFIERS } from "../../constants/defaultConfigs";

let activePreviewToken = 0;
let activeCloudPreviewAudio: any = null;
const getVoiceGender = (voice: any) =>
  voice?.gender?.toLowerCase() || "neutral";
const isPremiumVoice = (voice: any) =>
  voice?.name?.includes("Premium") || false;
const getVoiceModifiers = (
  voiceURI: string,
  baseSpeed: number = 1.0,
  basePitch: number = 1.0,
) => {
  let finalSpeed = baseSpeed;
  let finalPitch = basePitch;

  if (!voiceURI) return { finalSpeed, finalPitch };

  const modifiers = VOICE_MODIFIERS[voiceURI] || (voiceURI.includes("child") ? VOICE_MODIFIERS["preset-vi-kid"] : null);
  if (modifiers) {
    finalSpeed = modifiers.speed;
    finalPitch = modifiers.pitch;
  }

  return { finalSpeed, finalPitch };
};

const safeResponseJson = async (r: any, f: any) => {
  try {
    return await r.json();
  } catch (e) {
    return f;
  }
};
const fallbackImageCache = new Map<string, string>();
const getTargetDurationSeconds = (d: any) => 15;
let handleNextStep = () => { };
let handlePrevStep = () => { };
let audioRef: any = null;
let videoRef: any = null;
let simVideoRef: any = null;
let workspaceRef: any = null;

const defaultVoiceConfig = {
  provider: "edge",
  audioType: AudioType.TTS,
  gender: Gender.Male,
  age: AgeGroup.Adult,
  emotion: "neutral",
  speed: 1.0,
  pitch: 1.0,
  volume: 1.0,
  voiceURI: "preset-vi-bac-female",
};

const defaultProjectInput = {
  type: ProjectInputType.Script,
  content: "",
};

const defaultProjectConfig = {
  genre: "Tâm lý",
  language: "vi" as any,
  duration: "15",
  rewriteLevel: 50,
  similarityReduction: 5,
  creativityLevel: 6,
  factCheck: true,
  audience: "Đại chúng",
  writingStyle: "Tự nhiên",
};

const defaultHookConfig = {
  type: "Auto",
  duration: 10,
  count: 3,
  positions: "start" as any,
  versions: [],
};

const defaultVisualConfig = {
  source: "imagen",
  style: "Cinematic",
  quality: "1080p",
  density: 5,
  characterConsistency: true,
  assetsMode: "mixed" as any,
  imageGeneratorEngine: "veo3" as any,
  generateType: "image" as any,
  aspectRatio: "16:9",
  promptInputMethod: "paste" as any,
  generateCount: 1,
};

export function usePipelineWizard(props: any) {
  const {
    theme,
    currentLang,
    project: initialProject,
    onSaveProject,
    costTracker,
    setCostTracker,
    credits,
    setCredits,
  } = props;
  const t = translations[currentLang];

  const logAction = (actionName: string) => {
    logSystemAction(actionName);
  };

  const normalizedInitialProject = useMemo(() => {
    if (!initialProject) return initialProject;
    return {
      ...initialProject,
      voiceConfig: initialProject.voiceConfig || defaultVoiceConfig,
      input: initialProject.input || defaultProjectInput,
      config: initialProject.config || defaultProjectConfig,
      hookConfig: initialProject.hookConfig || defaultHookConfig,
      visualConfig: initialProject.visualConfig || defaultVisualConfig,
    };
  }, [initialProject]);

  const [project, setProject] = useState<VideoProject>(normalizedInitialProject);

  useEffect(() => {
    if (normalizedInitialProject) {
      setProject((prev) => {
        if (!prev || (prev.id !== normalizedInitialProject.id)) return normalizedInitialProject;

        const mergedStoryboard = (prev.storyboard || []).map((localScene) => {
          if (localScene.assetUrl === '') return localScene;
          const serverScene = normalizedInitialProject.storyboard?.find((s) => s.id === localScene.id);
          return serverScene?.assetUrl?.startsWith('/assets/')
            ? { ...localScene, assetUrl: serverScene.assetUrl, assetUrls: serverScene.assetUrls || [serverScene.assetUrl] }
            : localScene;
        });

        const mergedThumbnails = (prev.thumbnails || []).map((localThumb) => {
          const serverThumb = normalizedInitialProject.thumbnails?.find((t) => t.id === localThumb.id);
          return serverThumb?.imageUrl?.startsWith('/assets/')
            ? { ...localThumb, imageUrl: serverThumb.imageUrl }
            : localThumb;
        });

        const shouldUpdateVoiceConfig = normalizedInitialProject.voiceConfig
          ? ['audioUrl', 'audioBase64', 'timingLog'].some(key => prev.voiceConfig?.[key as any] !== normalizedInitialProject.voiceConfig?.[key as any])
          : false;

        const isServerUpdate = normalizedInitialProject.updatedAt !== prev.updatedAt;

        const syncField = (key: keyof VideoProject, fallback: any = undefined, checkEmptyArray = false) => {
          const serverVal = normalizedInitialProject[key];
          const localVal = prev[key];
          const isEmpty = checkEmptyArray ? !(localVal as any)?.length : !localVal;
          return (isServerUpdate || isEmpty) ? (serverVal ?? fallback) : localVal;
        };

        const voiceConfig = isServerUpdate
          ? (normalizedInitialProject.voiceConfig || prev.voiceConfig)
          : (shouldUpdateVoiceConfig && normalizedInitialProject.voiceConfig
            ? {
              ...(prev.voiceConfig || {}),
              audioUrl: normalizedInitialProject.voiceConfig.audioUrl,
              audioBase64: normalizedInitialProject.voiceConfig.audioBase64,
              timingLog: normalizedInitialProject.voiceConfig.timingLog || prev.voiceConfig?.timingLog,
            }
            : prev.voiceConfig);

        const scriptRewritten = syncField('scriptRewritten', "");
        const chapters = syncField('chapters', [], true);
        const seoConfig = syncField('seoConfig');
        const seo = syncField('seo');
        const assets = syncField('assets', [], true);

        const compareItems = [
          [prev.storyboard, mergedStoryboard, true],
          [prev.thumbnails, mergedThumbnails, true],
          [prev.voiceConfig, voiceConfig, true],
          [prev.chapters, chapters, true],
          [prev.seoConfig, seoConfig, true],
          [prev.seo, seo, true],
          [prev.assets, assets, true],
          [prev.scriptRewritten, scriptRewritten],
          [prev.name, normalizedInitialProject.name],
          [prev.description, normalizedInitialProject.description],
          [prev.updatedAt, normalizedInitialProject.updatedAt],
          [prev.currentStep, normalizedInitialProject.currentStep],
          [prev.creditsUsed, normalizedInitialProject.creditsUsed],
        ];
        const hasChanges = compareItems.some(([a, b, isJson]) => isJson ? JSON.stringify(a) !== JSON.stringify(b) : a !== b);

        if (!hasChanges) {
          return prev;
        }

        return {
          ...prev,
          storyboard: mergedStoryboard,
          thumbnails: mergedThumbnails,
          voiceConfig,
          scriptRewritten,
          chapters,
          seoConfig,
          seo,
          assets,
          name: normalizedInitialProject.name,
          description: normalizedInitialProject.description,
          updatedAt: normalizedInitialProject.updatedAt,
          currentStep: normalizedInitialProject.currentStep,
          creditsUsed: normalizedInitialProject.creditsUsed,
        };
      });
    }
  }, [normalizedInitialProject]);

  const [currentStep, setCurrentStep] = useState<WizardStep>(() => {
    return (initialProject as any).currentStep !== undefined
      ? (initialProject as any).currentStep
      : 0;
  });

  const [leftSidebarOpen, setLeftSidebarOpen] = useState<boolean>(true);

  const [rightSidebarOpen, setRightSidebarOpen] = useState<boolean>(true);

  const [loading, setLoading] = useState(false);

  const [isVoiceDialogOpen, setIsVoiceDialogOpen] = useState(false);

  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>(
    {},
  );

  const [errorMsg, setErrorMsg] = useState("");

  const [infoMsg, setInfoMsg] = useState("");

  const [hooksDraft, setHooksDraft] = useState<HookVersion[]>(() => {
    return initialProject?.hookConfig?.versions || [];
  });

  const [hookStrategy, setHookStrategy] = useState<string>(() => {
    return initialProject?.hookConfig?.type || "Auto";
  });

  const [hookDuration, setHookDuration] = useState<number>(() => {
    return initialProject?.hookConfig?.duration || 10;
  });

  const [hookCount, setHookCount] = useState<number>(() => {
    return initialProject?.hookConfig?.count || 3;
  });

  const [hookPosition, setHookPosition] = useState<HookPosition>(() => {
    return initialProject?.hookConfig?.positions || "start";
  });

  const [activeSceneId, setActiveSceneId] = useState<string | null>(null);

  const [sceneEditScript, setSceneEditScript] = useState("");

  const [sceneEditSubtitle, setSceneEditSubtitle] = useState("");

  const [sceneEditPrompt, setSceneEditPrompt] = useState("");

  const [sceneEditMotion, setSceneEditMotion] = useState("Zoom In");

  const [sceneEditFx, setSceneEditFx] = useState("");

  const [sceneEditTransition, setSceneEditTransition] = useState("");

  const [promptSetting, setPromptSetting] = useState("");

  const [promptTime, setPromptTime] = useState("");

  const [promptCharacter, setPromptCharacter] = useState("");

  const [promptCostume, setPromptCostume] = useState("");

  const [promptCameraAngle, setPromptCameraAngle] = useState("");

  const isGeneratingDetailedPrompt = activeSceneId ? !!loadingStates[LOADING_KEYS.GENERATE_DETAILED_PROMPT_PREFIX + activeSceneId] : false;
  const setIsGeneratingDetailedPrompt = (val: boolean | ((prev: boolean) => boolean)) => {
    if (!activeSceneId) return;
    setLoadingStates((prev) => {
      const currentVal = !!prev[LOADING_KEYS.GENERATE_DETAILED_PROMPT_PREFIX + activeSceneId];
      const newVal = typeof val === 'function' ? val(currentVal) : val;
      return {
        ...prev,
        [LOADING_KEYS.GENERATE_DETAILED_PROMPT_PREFIX + activeSceneId]: newVal,
      };
    });
  };

  const [isDeletingImage, setIsDeletingImage] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const [showPromptGeneratorPanel, setShowPromptGeneratorPanel] =
    useState(false);

  const [activeSlideIndices, setActiveSlideIndices] = useState<
    Record<string, number>
  >({});

  const [copiedAll, setCopiedAll] = useState(false);

  const [showGlobalConfig, setShowGlobalConfig] = useState(false);

  const [showAdvancedVisualConfig, setShowAdvancedVisualConfig] =
    useState(false);

  const [bulkUploadWarning, setBulkUploadWarning] = useState("");

  const [isBatchGenerating, setIsBatchGenerating] = useState(false);
  const [isCancellingBatch, setIsCancellingBatch] = useState(false);

  const [batchProgressMsg, setBatchProgressMsg] = useState("");

  const [zoomedImage, setZoomedImage] = useState<{
    url: string;
    title: string;
    prompt?: string;
  } | null>(null);

  const [favoriteStyles, setFavoriteStyles] = useState<any[]>([]);
  const [showFavStyles, setShowFavStyles] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.FAVORITE_STYLES);
      setFavoriteStyles(stored ? JSON.parse(stored) : [
        { id: "style_1", name: "Cinematic Realistic", prompt: "cinematic realistic, photographic, detailed, 8k, dramatic lighting, high contrast" }
      ]);
    } catch (e) {
      logger.error("GENERAL_ERROR", e);
    }
  }, []);

  const saveFavoriteStyles = (list: any[]) => {
    setFavoriteStyles(list);
    localStorage.setItem(STORAGE_KEYS.FAVORITE_STYLES, JSON.stringify(list));
  };

  const handleAddFavoriteStyle = (name: string, promptText: string) => {
    if (!name.trim() || !promptText.trim()) return;
    saveFavoriteStyles([...favoriteStyles, { id: `style_${Date.now()}`, name: name.trim(), prompt: promptText.trim() }]);
    setInfoMsg(t.saveStyleSuccess);
    setTimeout(() => setInfoMsg(""), 3000);
  };

  const handleDeleteFavoriteStyle = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    saveFavoriteStyles(favoriteStyles.filter(item => item.id !== id));
  };

  const handleSaveEditStyle = (id: string, name: string, promptText: string) => {
    if (!name.trim() || !promptText.trim()) return;
    saveFavoriteStyles(favoriteStyles.map(item => item.id === id ? { ...item, name: name.trim(), prompt: promptText.trim() } : item));
    setInfoMsg(t.updateStyleSuccess);
    setTimeout(() => setInfoMsg(""), 3000);
  };

  const handleSaveCurrentStyle = () => {
    const curStyle = project.visualConfig?.referencePrompt;
    if (!curStyle) return;
    if (favoriteStyles.some(s => s.prompt === curStyle)) {
      setInfoMsg(t.saveStyleSuccess);
      setTimeout(() => setInfoMsg(""), 3000);
      return;
    }
    saveFavoriteStyles([...favoriteStyles, { id: `style_${Date.now()}`, name: curStyle.substring(0, 15) + "...", prompt: curStyle }]);
    setInfoMsg(t.saveStyleSuccess);
    setTimeout(() => setInfoMsg(""), 3000);
  };

  const handleApplyFavoriteStyle = (promptText: string) => {
    setProject((prev) => ({ ...prev, visualConfig: { ...prev.visualConfig, referencePrompt: promptText } }));
    setInfoMsg(t.applyStyleSuccess);
    setTimeout(() => setInfoMsg(""), 3000);
  };

  const [favoriteVoices, setFavoriteVoices] = useState<any[]>([]);
  const [showFavVoices, setShowFavVoices] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.FAVORITE_VOICES);
      setFavoriteVoices(stored ? JSON.parse(stored) : [
        { id: 'fav_1', name: 'Brian - Deep, Resonant and Comforting', voiceURI: 'nPczCjzI2devNBz1zQrb', channelName: 'Mystic Frontiers' }
      ]);
    } catch (e) {
      logger.error("GENERAL_ERROR", e);
    }
  }, []);

  const saveFavoriteVoices = (list: any[]) => {
    setFavoriteVoices(list);
    localStorage.setItem(STORAGE_KEYS.FAVORITE_VOICES, JSON.stringify(list));
  };

  const handleAddFavoriteVoice = (name: string, voiceURI: string, channelName?: string) => {
    if (!name.trim() || !voiceURI.trim()) return;
    saveFavoriteVoices([...favoriteVoices, {
      id: `fav_${Date.now()}`,
      name: name.trim(),
      voiceURI: voiceURI.trim(),
      channelName: channelName?.trim() || 'Custom'
    }]);
    setInfoMsg(t.saveVoiceSuccess);
    setTimeout(() => setInfoMsg(""), 3000);
  };

  const handleDeleteFavoriteVoice = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    saveFavoriteVoices(favoriteVoices.filter(item => item.id !== id));
  };

  const handleSaveEditVoice = (id: string, name: string, voiceURI: string, channelName?: string) => {
    if (!name.trim() || !voiceURI.trim()) return;
    saveFavoriteVoices(favoriteVoices.map(item => item.id === id ? {
      ...item,
      name: name.trim(),
      voiceURI: voiceURI.trim(),
      channelName: channelName?.trim() || item.channelName
    } : item));
    setInfoMsg(t.updateVoiceSuccess);
    setTimeout(() => setInfoMsg(""), 3000);
  };

  const handleToggleFavoriteVoice = (voiceId: string, name: string, providerName?: string) => {
    const exists = favoriteVoices.some(v => v.voiceURI === voiceId);
    if (exists) {
      saveFavoriteVoices(favoriteVoices.filter(v => v.voiceURI !== voiceId));
    } else {
      saveFavoriteVoices([...favoriteVoices, {
        id: `fav_${Date.now()}`,
        name: name.trim(),
        voiceURI: voiceId.trim(),
        channelName: providerName || 'Custom'
      }]);
      setInfoMsg(t.saveVoiceSuccess);
      setTimeout(() => setInfoMsg(""), 3000);
    }
  };

  const [storyboardPage, setStoryboardPage] = useState(1);

  const scenesPerPage = 12;

  const paginatedStoryboard = useMemo(() => {
    return (project.storyboard || []).slice(
      (storyboardPage - 1) * scenesPerPage,
      storyboardPage * scenesPerPage,
    );
  }, [project.storyboard, storyboardPage, scenesPerPage]);

  useEffect(() => {
    const totalScenes = (project.storyboard || []).length;
    const maxPage = Math.max(1, Math.ceil(totalScenes / scenesPerPage));
    if (storyboardPage > maxPage) {
      setStoryboardPage(maxPage);
    }
  }, [project.storyboard]);

  const getMotionLabel = (motion: string): string => {
    if (!motion) return "";
    if (currentLang !== "vi") return motion;
    const labels: Record<string, string> = {
      "Zoom In": "Phóng to",
      "Zoom Out": "Thu nhỏ",
      "Pan Left": "Góc trái",
      "Pan Right": "Góc phải",
      Static: "Tĩnh",
    };
    return labels[motion] || motion;
  };

  const [sandboxConfig, setSandboxConfig] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.API_SANDBOX_CONFIG);
      if (
        saved &&
        saved.trim() !== "undefined" &&
        saved.trim() !== "null" &&
        saved.trim() !== ""
      ) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object") {
          return parsed;
        }
      }
    } catch (e) {
      logger.error("ERROR_LOADING_SANDBOX", e);
    }
    return {
      projectId: "cbcf7518-13d7-4eab-b59d-952d5814de53",
      authToken: "",
      recaptchaToken: "",
      sessionId: "",
      imageModelName: "NARWHAL",
    };
  });

  useEffect(() => {
    if (sandboxConfig && typeof sandboxConfig === "object") {
      localStorage.setItem(STORAGE_KEYS.API_SANDBOX_CONFIG, JSON.stringify(sandboxConfig));
    }
  }, [sandboxConfig]);

  useEffect(() => {
    if (infoMsg) {
      const timer = setTimeout(() => {
        setInfoMsg("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [infoMsg]);

  useEffect(() => {
    if (errorMsg) {
      const timer = setTimeout(() => {
        setErrorMsg("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMsg]);

  useEffect(() => {
    const syncConfig = () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEYS.API_SANDBOX_CONFIG);
        if (
          saved &&
          saved.trim() !== "undefined" &&
          saved.trim() !== "null" &&
          saved.trim() !== ""
        ) {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed === "object") {
            setSandboxConfig(parsed);
          }
        }
      } catch (err) {
        logger.error("ERROR_SYNCING_SANDBOX", err);
      }
    };
    window.addEventListener("storage", syncConfig);
    return () => window.removeEventListener("storage", syncConfig);
  }, []);

  const [systemLogs, setSystemLogs] = useState<
    { time: string; type: string; msg: string }[]
  >(() => {
    try {
      const savedLogs = sessionStorage.getItem("pipeline_system_logs");
      if (savedLogs) return JSON.parse(savedLogs);
    } catch (e) { }
    return [];
  });

  useEffect(() => {
    try {
      sessionStorage.setItem("pipeline_system_logs", JSON.stringify(systemLogs));
    } catch (e: any) {
      if (e.name === "QuotaExceededError") {
        const reduced = systemLogs.slice(-100);
        try {
          sessionStorage.setItem("pipeline_system_logs", JSON.stringify(reduced));
        } catch (err) { }
      }
    }
  }, [systemLogs]);

  const [showLogsModal, setShowLogsModal] = useState(false);

  useEffect(() => {
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;

    const captureLog = (type: string, args: any[]) => {
      try {
        const msg = args
          .map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a)))
          .join(" ");

        let enrichedType = type;
        const msgLower = msg.toLowerCase();

        if (LOG_SUCCESS_KEYWORDS.some(term => msgLower.includes(term))) {
          enrichedType = "success";
        } else if (LOG_PENDING_KEYWORDS.some(term => msgLower.includes(term))) {
          enrichedType = "pending";
        } else if (type === "log" && LOG_WARN_KEYWORDS.some(term => msgLower.includes(term))) {
          enrichedType = "warn";
        } else if (type === "log" && LOG_ERROR_KEYWORDS.some(term => msgLower.includes(term))) {
          enrichedType = "error";
        }

        const time = new Date().toLocaleTimeString();
        setSystemLogs((prev) =>
          [...prev, { time, type: enrichedType, msg }].slice(-200),
        );
      } catch (e) { }
    };

    console.log = (...args) => {
      captureLog("log", args);
      originalLog(...args);
    };
    console.warn = (...args) => {
      captureLog("warn", args);
      originalWarn(...args);
    };
    console.error = (...args) => {
      captureLog("error", args);
      originalError(...args);
    };

    return () => {
      console.log = originalLog;
      console.warn = originalWarn;
      console.error = originalError;
    };
  }, []);

  const [ttsAudioUrl, setTtsAudioUrl] = useState<string | null>(null);

  const [ttsAudioBytes, setTtsAudioBytes] = useState<string | null>(null);

  const [alignmentsLog, setAlignmentsLog] = useState<string>("");

  const [bulkVoiceStatus, setBulkVoiceStatus] = useState<string>("");

  const [isPlayingTts, setIsPlayingTts] = useState(false);

  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);

  const voicePlayerSectionRef = useRef<HTMLDivElement | null>(null);

  const [systemVoices, setSystemVoices] = useState<SpeechSynthesisVoice[]>([]);

  const [voiceDropdownOpen, setVoiceDropdownOpen] = useState(false);

  const handleCloseVoiceModal = () => {
    logAction("handleCloseVoiceModal");
    if (activeCloudPreviewAudio) {
      activeCloudPreviewAudio.pause();
      activeCloudPreviewAudio.currentTime = 0;
      activeCloudPreviewAudio = null;
    }
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setPlayingVoiceURI(null);
    setVoiceDropdownOpen(false);
  };

  const [voiceSearch, setVoiceSearch] = useState("");

  const [voiceTypeFilter, setVoiceTypeFilter] = useState<"premium" | "local">(
    "premium",
  );

  const [voiceHealth, setVoiceHealth] = useState<
    Record<string, "ok" | "error">
  >({});

  const [voiceLangFilter, setVoiceLangFilter] = useState<"all" | "vi" | "en">(
    "all",
  );

  const [selectedGenderFilter, setSelectedGenderFilter] = useState<
    "all" | "male" | "female"
  >("all");

  const [playingVoiceURI, setPlayingVoiceURI] = useState<string | null>(null);

  const [voiceAudioDuration, setVoiceAudioDuration] = useState<number | null>(
    null,
  );

  const [storyboardSourceMode, setStoryboardSourceMode] = useState<
    "audio" | "script"
  >(() => {
    return (initialProject as any)?.storyboardSourceMode || "script";
  });

  const [isAudioDragging, setIsAudioDragging] = useState(false);

  const step2AudioRef = useRef<HTMLAudioElement | null>(null);

  const [step2IsPlaying, setStep2IsPlaying] = useState(false);

  const [step2CurrentTime, setStep2CurrentTime] = useState(0);

  const [step2Duration, setStep2Duration] = useState(0);

  const [step2IsSimulatedPlaying, setStep2IsSimulatedPlaying] = useState(false);

  const [step2SimulatedCurrentTime, setStep2SimulatedCurrentTime] = useState(0);

  useEffect(() => {
    let interval: any = null;
    if (
      step2IsSimulatedPlaying &&
      project.voiceConfig?.audioUrl === "simulated_speech"
    ) {
      interval = setInterval(() => {
        setStep2SimulatedCurrentTime((prev) => {
          const maxDur = voiceAudioDuration || 10;
          if (prev >= maxDur) {
            setStep2IsSimulatedPlaying(false);
            if ("speechSynthesis" in window) {
              window.speechSynthesis.cancel();
            }
            clearInterval(interval);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    } else if (!step2IsSimulatedPlaying) {
      clearInterval(interval);
      setStep2SimulatedCurrentTime(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [
    step2IsSimulatedPlaying,
    project.voiceConfig?.audioUrl,
    voiceAudioDuration,
  ]);

  useEffect(() => {
    if (step2AudioRef.current) {
      step2AudioRef.current.pause();
    }
    setStep2IsPlaying(false);
    setStep2CurrentTime(0);
    setStep2IsSimulatedPlaying(false);
    setStep2SimulatedCurrentTime(0);
  }, [project.voiceConfig?.audioUrl]);

  const [audioCurrentTime, setAudioCurrentTime] = useState(0);

  const [audioDurationState, setAudioDurationState] = useState(0);

  const [isPlayingRealAudio, setIsPlayingRealAudio] = useState(false);

  const [audioVolume, setAudioVolume] = useState(1.0);

  const [simulatedCurrentTime, setSimulatedCurrentTime] = useState(0);

  useEffect(() => {
    let interval: any = null;
    if (isPlayingTts && ttsAudioUrl === "simulated") {
      interval = setInterval(() => {
        setSimulatedCurrentTime((prev) => {
          const maxDur = voiceAudioDuration || 10;
          if (prev >= maxDur) {
            setIsPlayingTts(false);
            if ("speechSynthesis" in window) {
              window.speechSynthesis.cancel();
            }
            clearInterval(interval);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    } else if (!isPlayingTts) {
      clearInterval(interval);
      setSimulatedCurrentTime(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlayingTts, ttsAudioUrl, voiceAudioDuration]);

  useEffect(() => {
    if (audioPreviewRef.current) {
      audioPreviewRef.current.playbackRate = 1.0;
    }
  }, [project.voiceConfig?.speed, ttsAudioUrl]);

  const [isOfflineRendering, setIsOfflineRendering] = useState(false);

  const [offlineRenderProgress, setOfflineRenderProgress] = useState(0);

  const [loadingExportType, setLoadingExportType] = useState<EXPORT_TYPES | null>(null);

  const [renderedVideoBlob, setRenderedVideoBlob] = useState<Blob | null>(null);

  useEffect(() => {
    if (
      ttsAudioUrl &&
      ttsAudioUrl !== "simulated" &&
      ttsAudioUrl !== "simulated_speech"
    ) {
      const audio = new Audio(ttsAudioUrl);
      const onLoadedMetadata = () => {
        setVoiceAudioDuration(audio.duration);
      };
      audio.addEventListener("loadedmetadata", onLoadedMetadata);
      return () => {
        audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      };
    } else if (
      ttsAudioUrl === "simulated" ||
      ttsAudioUrl === "simulated_speech"
    ) {
      const estimatedDuration = getTargetDurationSeconds(
        project.config.duration,
      );
      setVoiceAudioDuration(estimatedDuration);
    } else {
      setVoiceAudioDuration(null);
    }
  }, [ttsAudioUrl, project.scriptRewritten, project.config.duration]);

  useEffect(() => {
    setRenderedVideoBlob(null);
  }, [
    project.storyboard,
    project.voiceConfig?.audioUrl,
    project.voiceConfig?.speed,
    project.voiceConfig?.pitch,
    project.voiceConfig?.volume,
    project.scriptRewritten,
    ttsAudioUrl,
    activeSlideIndices,
  ]);

  const createSpeechUtterance = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = project.config.language === "vi" ? "vi-VN" : "en-US";
    utterance.rate = project.voiceConfig?.speed || 1.0;
    utterance.pitch =
      project.voiceConfig?.pitch !== undefined ? project.voiceConfig?.pitch : 1.0;
    utterance.volume =
      project.voiceConfig?.volume !== undefined
        ? project.voiceConfig?.volume
        : 1.0;

    if ("speechSynthesis" in window) {
      const voices = window.speechSynthesis.getVoices();
      const isVi = project.config.language === "vi";
      const gender = project.voiceConfig?.gender || "neutral";
      const selectedUri = project.voiceConfig?.voiceURI;

      let matchedVoice = null;
      if (selectedUri) {
        matchedVoice = voices.find((v) => v.voiceURI === selectedUri);
      }

      if (!matchedVoice) {
        const langVoices = voices.filter((v) =>
          isVi ? v.lang.startsWith("vi") : v.lang.startsWith("en"),
        );
        if (langVoices.length > 0) {
          if (gender === "female") {
            matchedVoice =
              langVoices.find((v) => getVoiceGender(v) === "female") ||
              langVoices[0];
          } else if (gender === "male") {
            matchedVoice =
              langVoices.find((v) => getVoiceGender(v) === "male") ||
              langVoices[0];
          } else {
            matchedVoice =
              langVoices.find((v) => getVoiceGender(v) === "neutral") ||
              langVoices[0];
          }
        }
      }

      if (matchedVoice) {
        utterance.voice = matchedVoice;
        utterance.lang = matchedVoice.lang;
      }
    }
    return utterance;
  };

  const playVoicePreview = async (
    voiceURI: string,
    gender: string,
    lang: string,
    speed?: number,
    pitch?: number,
    previewUrl?: string,
  ) => {
    activePreviewToken = Date.now();
    const currentToken = activePreviewToken;

    if (activeCloudPreviewAudio) {
      activeCloudPreviewAudio.pause();
      activeCloudPreviewAudio.currentTime = 0;
      activeCloudPreviewAudio = null;
    }

    if (playingVoiceURI === voiceURI) {
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
      setPlayingVoiceURI(null);
      activePreviewToken = 0;
      return;
    }

    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setPlayingVoiceURI(voiceURI);

    if (previewUrl) {
      const audio = new Audio(previewUrl);
      activeCloudPreviewAudio = audio;
      audio.onended = () => {
        if (activeCloudPreviewAudio === audio) {
          setPlayingVoiceURI(null);
          activeCloudPreviewAudio = null;
        }
      };
      audio.onerror = () => {
        if (activeCloudPreviewAudio === audio) {
          setPlayingVoiceURI(null);
          activeCloudPreviewAudio = null;
        }
      };
      await audio.play().catch((e) => {
        logger.warn("PREVIEW_PLAYBACK_FAILED", e);
        if (activeCloudPreviewAudio === audio) {
          setPlayingVoiceURI(null);
          activeCloudPreviewAudio = null;
        }
      });
      return;
    }

    const isVi = lang.startsWith("vi") || voiceURI.includes("vi");
    const sampleText = isVi
      ? "Xin chào, đây là âm thanh nghe thử của tôi."
      : "Hello, this is a quick audio preview of my voice.";

    const useCloudVoice = isPremiumVoice(voiceURI);

    const { finalSpeed, finalPitch } = getVoiceModifiers(
      voiceURI,
      speed || 1.0,
      pitch || 1.0,
    );

    if (useCloudVoice) {
      try {
        const res = await fetch("/api/pipeline/voice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: sampleText,
            voiceURI: voiceURI,
            voice_id: voiceURI,
            gender: gender,
            speed: finalSpeed,
            pitch: finalPitch,
          }),
        });

        if (activePreviewToken !== currentToken) {
          return;
        }

        const data = await res.json();
        if (data && data.success && data.audioBase64) {
          if (activePreviewToken !== currentToken) return;

          const binaryString = window.atob(data.audioBase64);
          const len = binaryString.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }

          let blob;
          let dspApplied = false;
          try {
            blob = await applyAudioEffects(
              bytes.buffer.slice(0),
              finalSpeed,
              finalPitch,
              1.0,
            );
            dspApplied = true;
          } catch (e) {
            logger.warn("PREVIEW_DSP_FAILED", e);
            blob = new Blob([bytes], { type: data.mimeType || "audio/wav" });
          }

          if (activePreviewToken !== currentToken) return;

          const url = URL.createObjectURL(blob);
          const tempAudio = new Audio(url);
          activeCloudPreviewAudio = tempAudio;

          tempAudio.playbackRate = dspApplied ? 1.0 : finalSpeed;

          tempAudio.onended = () => {
            if (activeCloudPreviewAudio === tempAudio) {
              setPlayingVoiceURI(null);
              activeCloudPreviewAudio = null;
            }
            URL.revokeObjectURL(url);
          };
          tempAudio.onerror = () => {
            if (activeCloudPreviewAudio === tempAudio) {
              setPlayingVoiceURI(null);
              activeCloudPreviewAudio = null;
            }
          };
          await tempAudio.play();
          return;
        }
      } catch (e) {
        if (activePreviewToken !== currentToken) return;
        logger.warn("CLOUD_PREVIEW_FAILED", e);
      }
    }

    if (activePreviewToken !== currentToken) return;

    if (!("speechSynthesis" in window)) {
      setPlayingVoiceURI(null);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(sampleText);
    utterance.lang = isVi ? "vi-VN" : "en-US";
    utterance.rate = speed !== undefined ? speed : 1.0;
    utterance.pitch = pitch !== undefined ? pitch : 1.0;
    utterance.volume =
      project.voiceConfig?.volume !== undefined
        ? project.voiceConfig?.volume
        : 1.0;

    utterance.onstart = () => {
      setPlayingVoiceURI(voiceURI);
    };
    utterance.onend = () => {
      setPlayingVoiceURI((prev) => (prev === voiceURI ? null : prev));
    };
    utterance.onerror = () => {
      setPlayingVoiceURI((prev) => (prev === voiceURI ? null : prev));
    };

    const voices = window.speechSynthesis.getVoices();
    let matchedVoice = voices.find((v) => v.voiceURI === voiceURI);

    if (!matchedVoice) {
      const langVoices = voices.filter((v) =>
        isVi ? v.lang.startsWith("vi") : v.lang.startsWith("en"),
      );
      if (langVoices.length > 0) {
        if (gender === "female") {
          matchedVoice =
            langVoices.find((v) => getVoiceGender(v) === "female") ||
            langVoices[0];
        } else if (gender === "male") {
          matchedVoice =
            langVoices.find((v) => getVoiceGender(v) === "male") ||
            langVoices[0];
        } else {
          matchedVoice =
            langVoices.find((v) => getVoiceGender(v) === "neutral") ||
            langVoices[0];
        }
      }
    }

    if (matchedVoice) {
      utterance.voice = matchedVoice;
      utterance.lang = matchedVoice.lang;
    }

    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    const loadVoices = async () => {
      try {
        const response = await fetch("/api/voices?provider=edge", {
          headers: {
            "x-ai33-api-key": getStoredApiKey("AI33_API_KEY"),
          },
        });
        if (response.ok) {
          const json = await response.json();
          if (json.success && json.data) {
            const mappedVoices = json.data.map((v: any) => ({
              voiceURI: v.voice_id,
              name: v.name + (v.gender ? ` - ${v.gender}` : ""),
              lang: v.language || "vi-VN",
              localService: false,
              default: false,
            }));
            setSystemVoices(mappedVoices);
          }
        }
      } catch (err) {
        logger.error("FAILED_LOAD_VOICES", err);
      }
    };

    loadVoices();
  }, []);

  const [isPlayingSim, setIsPlayingSim] = useState(false);

  const [currentSimTime, setCurrentSimTime] = useState(0);

  const [simActiveScene, setSimActiveScene] = useState<StoryboardScene | null>(
    null,
  );

  const simTimerRef = useRef<NodeJS.Timeout | null>(null);

  const simAudioRef = useRef<HTMLAudioElement | null>(null);

  const isRestoringRef = useRef(false);

  useEffect(() => {
    if (isRestoringRef.current) {
      isRestoringRef.current = false;
      return;
    }
    onSaveProject(project);
  }, [project, onSaveProject]);

  useEffect(() => {
    if (project?.voiceConfig?.audioUrl) {
      setTtsAudioUrl(project.voiceConfig.audioUrl);
    } else {
      setTtsAudioUrl(null);
    }
  }, [project?.voiceConfig?.audioUrl]);

  useEffect(() => {
    if (project.currentStep !== currentStep) {
      setProject((prev) => ({ ...prev, currentStep }));
    }
  }, [currentStep]);

  useEffect(() => {
    if ((project as any).storyboardSourceMode !== storyboardSourceMode) {
      setProject((prev) => ({ ...prev, storyboardSourceMode }));
    }
  }, [storyboardSourceMode]);

  useEffect(() => {
    setProject((prev) => {
      const currentHookConfig = prev.hookConfig || {
        type: "Auto",
        duration: 10,
        count: 3,
        positions: "start",
        versions: [],
      };

      const isHookUnchanged = [
        [currentHookConfig.type, hookStrategy],
        [currentHookConfig.duration, hookDuration],
        [currentHookConfig.count, hookCount],
        [currentHookConfig.positions, hookPosition]
      ].every(([a, b]) => a === b) && JSON.stringify(currentHookConfig.versions) === JSON.stringify(hooksDraft);

      return isHookUnchanged ? prev : {
        ...prev,
        hookConfig: {
          ...currentHookConfig,
          type: hookStrategy,
          duration: hookDuration,
          count: hookCount,
          positions: hookPosition,
          versions: hooksDraft,
        },
      };
    });
  }, [hookStrategy, hookDuration, hookCount, hookPosition, hooksDraft]);

  const lastProjectIdRef = useRef<string | null>(null);
  const cancelBatchImageRef = useRef<boolean>(false);

  useEffect(() => {
    if (!initialProject) return;

    const isNewProject = lastProjectIdRef.current !== initialProject.id;
    lastProjectIdRef.current = initialProject.id;

    if (isNewProject) {
      if ((initialProject as any).currentStep !== undefined) {
        setCurrentStep((initialProject as any).currentStep);
      } else {
        setCurrentStep(0);
      }

      if ((initialProject as any).storyboardSourceMode) {
        setStoryboardSourceMode((initialProject as any).storyboardSourceMode);
      } else {
        setStoryboardSourceMode("script");
      }

      if (initialProject.hookConfig) {
        setHookStrategy(initialProject.hookConfig.type || "Auto");
        setHookDuration(initialProject.hookConfig.duration || 10);
        setHookCount(initialProject.hookConfig.count || 3);
        setHookPosition(
          initialProject.hookConfig.positions || HookPosition.Start,
        );
        setHooksDraft(initialProject.hookConfig.versions || []);
      } else {
        setHookStrategy("Auto");
        setHookDuration(10);
        setHookCount(3);
        setHookPosition(HookPosition.Start);
        setHooksDraft([]);
      }

      let restoredVoiceConfig = initialProject.voiceConfig
        ? { ...initialProject.voiceConfig }
        : undefined;
      let restoredTtsUrl: string | null = null;

      if (restoredVoiceConfig) {
        if (restoredVoiceConfig.audioUrl) {
          restoredTtsUrl = restoredVoiceConfig.audioUrl;
          if (
            restoredTtsUrl === SIMULATED_SPEECH_VAL ||
            restoredTtsUrl.startsWith(BLOB_PREFIX)
          ) {
            if (restoredVoiceConfig.audioBase64) {
              try {
                const arr = base64ToArrayBuffer(
                  restoredVoiceConfig.audioBase64,
                );
                const blob = new Blob([arr], { type: AUDIO_MIME_TYPE });
                restoredTtsUrl = URL.createObjectURL(blob);
              } catch (e) {
                logger.error(RESTORE_BLOB_ERR, e);
                restoredTtsUrl = COMMON_STRINGS.SIMULATED;
              }
            } else {
              restoredTtsUrl = COMMON_STRINGS.SIMULATED;
            }
          }
          restoredVoiceConfig.audioUrl = restoredTtsUrl;
          setTtsAudioUrl(restoredTtsUrl);
        } else {
          setTtsAudioUrl(null);
        }

        if (restoredVoiceConfig.timingLog) {
          setAlignmentsLog(restoredVoiceConfig.timingLog);
        } else if (
          restoredVoiceConfig.subtitleFiles &&
          restoredVoiceConfig.subtitleFiles.length > 0
        ) {
          setAlignmentsLog(t.alignmentLoaded);
        } else {
          setAlignmentsLog("");
        }
      } else {
        setTtsAudioUrl(null);
        setAlignmentsLog("");
      }

      const restoredStoryboard = (initialProject.storyboard || []).map(
        (scene) => {
          if (
            scene.audioUrl &&
            (scene.audioUrl.startsWith(BLOB_PREFIX) ||
              scene.audioUrl === SIMULATED_SPEECH_VAL)
          ) {
            if (scene.audioBase64) {
              try {
                const arr = base64ToArrayBuffer(scene.audioBase64);
                const blob = new Blob([arr], { type: AUDIO_MIME_TYPE });
                return { ...scene, audioUrl: URL.createObjectURL(blob) };
              } catch (e) {
                logger.error(RESTORE_SCENE_BLOB_ERR, e);
              }
            }
            return scene;
          }
          return scene;
        },
      );

      const restoredProject: VideoProject = {
        ...initialProject,
        storyboard: restoredStoryboard,
        voiceConfig: restoredVoiceConfig || defaultVoiceConfig,
        input: initialProject.input || defaultProjectInput,
        config: initialProject.config || defaultProjectConfig,
        hookConfig: initialProject.hookConfig || defaultHookConfig,
        visualConfig: initialProject.visualConfig || defaultVisualConfig,
      };

      isRestoringRef.current = true;
      setProject(restoredProject);
    }
  }, [initialProject]);

  const trackOperationCost = (creditsUsed: number, usdCost: number) => {
    setCredits((prev) => Math.max(0, prev - creditsUsed));
    setCostTracker((prev) => prev + usdCost);
    setProject((prev) => ({
      ...prev,
      creditsUsed: prev.creditsUsed + creditsUsed,
    }));
  };

  const handleProcessInputAndConfig = async (force = false) => {
    logAction("handleProcessInputAndConfig");

    if (!(project.input?.content || "").trim()) {
      setErrorMsg(t.Please_enter_script_conte);
      return;
    }

    setInfoMsg(t.MULTI_STEP_SYSTEM_FLOW_Dr);
    setLoadingStates((prev) => ({ ...prev, processInput: true }));
    setLoading(true);
    setErrorMsg("");

    try {

      const selectedHook = (hooksDraft || []).find((h) => h.selected);
      const hookText = selectedHook ? selectedHook.content : "";
      const payload = {
        originalInput: project.input?.content || "",
        inputType: project.input?.type || "script",
        config: {
          ...project.config,
          hookConfig: project.hookConfig,
        },
        selectedHookText: hookText,
        bypassCache: force === true,
      };

      const { success, data, error } = await safeSystemFetch(
        "/api/pipeline/script",
        payload,
      );

      if (!success || data?.error || data?.warning) {
        throw new Error(
          error ||
          data?.error ||
          data?.warning ||
          "System pipeline rejected the request.",
        );
      }

      setProject((prev) => ({
        ...prev,
        scriptRewritten: data.rewrittenScript || "",
        factCheckNotes: data.factCheckNotes || "",
        chapters: data.chapters || [],
      }));

      const successMsg = t.Generation_completed_The_ || "Hoàn thành biên kịch.";
      setInfoMsg(successMsg);
      console.log(`[Script] ✅ Thành công: ${successMsg}`);

      if (!data.cached) {
        trackOperationCost(10, 0.0005);
      }
    } catch (e: any) {
      setErrorMsg(t.scriptPipelineError.replace("{error}", e.message));
    } finally {
      setLoadingStates((prev) => ({ ...prev, processInput: false }));
      setLoading(false);
    }
  };

  const handleTriggerStoryboardSplit = async (
    force = false,
    btnPosition = "top",
    isFromAutoGenerateAll = false,
  ) => {
    logAction("handleTriggerStoryboardSplit");

    const isForce = force === true;
    if (project.storyboard && project.storyboard.length > 0 && !isForce) {
      setInfoMsg(t.Loaded_current_scenes_sto);
      return project.storyboard;
    }

    if (!project.scriptRewritten) {
      setErrorMsg(t.Missing_detailed_script_f);
      return;
    }

    if (!isFromAutoGenerateAll) {
      setLoadingStates((prev) => ({
        ...prev,
        [`storyboardSplit_${btnPosition}`]: true,
        storyboardSplit_loading: true,
      }));
    }
    setLoading(true);
    setErrorMsg("");
    setInfoMsg(t.MULTI_STEP_SYSTEM_FLOW_Fo);

    try {

      const payload = {
        rewrittenScript: project.scriptRewritten,
        chapters: project.chapters,
        config: {
          ...project.config,
          ...project.voiceConfig,
          visualStylePreset: project.visualConfig.stylePreset,
          aspectRatio: project.visualConfig.aspectRatio,
          imageQuality: project.visualConfig.imageQuality,
          characterConsistencyLevel:
            project.visualConfig.characterConsistencyLevel,
          contextConsistencyLevel: project.visualConfig.contextConsistencyLevel,
          negativePrompt: project.visualConfig.negativePrompt,
        },
        visualStyle: project.visualConfig.style || "Cinematic",
        referenceImages: project.visualConfig.referenceImages || [],
        referenceStyle: project.visualConfig.referencePrompt,
        referenceCharacters:
          project.visualConfig.characters &&
            project.visualConfig.characters.length > 0
            ? project.visualConfig.characters.map((c) => ({
              name: c.name,
              prompt: c.prompt || c.description,
            }))
            : undefined,
        referenceCharacter: project.visualConfig.characterPrompt || undefined,
        visualDensity: project.visualConfig.density || 5,
        voiceDuration:
          storyboardSourceMode === "audio" ? voiceAudioDuration : null,
        targetDuration: project.config.targetDuration,
        sourceMode: storyboardSourceMode,
        bypassCache: isForce,
      };

      const { success, data, error } = await safeSystemFetch(
        "/api/pipeline/storyboard",
        payload,
      );

      if (!success || data?.error || data?.warning) {
        throw new Error(
          error ||
          data?.error ||
          data?.warning ||
          "System pipeline rejected the request.",
        );
      }

      if (data.scenes) {
        const updatedScenes = data.scenes.map((scene: any) => {
          return { ...scene, prompt: scene.prompt || "" };
        });

        const totalDuration = updatedScenes.reduce(
          (sum: number, s: any) => sum + (s.duration || 0),
          0,
        );
        let syncLogText = t.syncLedgerSuccess.replace(
          "{totalDuration}",
          totalDuration.toFixed(1),
        );

        updatedScenes.forEach((scene: any, idx: number) => {
          syncLogText += t.syncLedgerItem
            .replace("{index}", (idx + 1).toString())
            .replace("{startTime}", scene.startTime)
            .replace("{endTime}", scene.endTime)
            .replace("{duration}", scene.duration.toString())
            .replace(
              "{script}",
              (scene.script || scene.subtitle || "").substring(0, 35),
            );
        });

        setAlignmentsLog(syncLogText);

        setProject((prev) => ({
          ...prev,
          storyboard: updatedScenes,
          voiceConfig: {
            ...prev.voiceConfig,
            timingLog: syncLogText,
          },
        }));

        trackOperationCost(18, 0.0012);
        const successMsg =
          t.Storyboard_coordinates_fo || "Hoàn thành phân cảnh.";
        setInfoMsg(successMsg);
        console.log(`[Storyboard] ✅ Thành công: ${successMsg}`);
        return updatedScenes;
      }
    } catch (e: any) {
      setErrorMsg(t.storyboardPipelineError.replace("{error}", e.message));
    } finally {
      if (!isFromAutoGenerateAll) {
        setLoadingStates((prev) => ({
          ...prev,
          [`storyboardSplit_${btnPosition}`]: false,
          storyboardSplit_loading: false,
        }));
      }
      setLoading(false);
    }
  };

  const handleRenderSceneImage = async (
    sceneId: string,
    customPrompt: string,
    force = false,
    isBatch = false,
  ) => {
    logAction("handleRenderSceneImage");
    const isForce = force === true;
    if (!isBatch) {
      setLoadingStates((prev) => ({
        ...prev,
        ["renderScene_" + sceneId]: true,
      }));
      setLoading(true);
      setErrorMsg("");
    }
    try {
      const response = await fetch("/api/pipeline/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: customPrompt,
          style: project.visualConfig.style,
          resolution: project.visualConfig.quality,
          bypassCache: isForce,
          engine:
            project.visualConfig.imageGeneratorEngine ||
            ImageGeneratorEngine.Veo3,
          sandboxConfig: sandboxConfig,
          visualConfig: project.visualConfig,
        }),
      });
      const data = await safeResponseJson(response, {});

      if (data.warning) {
        if (!isBatch) setErrorMsg(data.warning);
        else throw new Error(data.warning);
      }

      let imageUrl = "";
      if (data.success && data.base64) {
        imageUrl = `data:image/jpeg;base64,${data.base64}`;
        trackOperationCost(40, 0.03);
      } else if (data.fallbackUrl) {
        imageUrl = data.fallbackUrl;
        trackOperationCost(5, 0.0002);
      } else {
        imageUrl = `${EXTERNAL_URLS.PLACEHOLD_CO}/800x450/g/png?text=${encodeURIComponent(
          project.visualConfig.style,
        )}&bg=gradient`;
        trackOperationCost(2, 0.0001);
      }

      setProject((prev) => {
        const updated = (prev.storyboard || []).map((sc) => {
          if (sc.id === sceneId) {
            return {
              ...sc,
              prompt: customPrompt,
              assetUrl: imageUrl,
              assetUrls: [imageUrl],
              isGenerated: true,
            };
          }
          return sc;
        });
        const updatedProject = { ...prev, storyboard: updated };
        onSaveProject(updatedProject, true);
        return updatedProject;
      });
      console.log(
        `[Hệ thống] ✅ Thành công: Tạo hình ảnh thành công cho phân cảnh ${sceneId}.`,
      );
    } catch (e: any) {
      if (!isBatch) {
        setErrorMsg(t.imagePipelineError.replace("{error}", e.message));
      } else {
        throw e;
      }
    } finally {
      if (!isBatch) {
        setLoadingStates((prev) => ({
          ...prev,
          ["renderScene_" + sceneId]: false,
        }));
        setLoading(false);
      }
    }
  };

  const handleUploadSceneImage = async (sceneId: string, base64DataUrl: string) => {
    logAction("handleUploadSceneImage");
    setIsUploadingImage(true);
    await new Promise((resolve) => setTimeout(resolve, 600));
    setProject((prev) => {
      const updatedScenes = (prev.storyboard || []).map((sc) => {
        if (sc.id === sceneId) {
          const newUrls = [base64DataUrl];
          return {
            ...sc,
            assetUrl: base64DataUrl,
            assetUrls: newUrls,
            assetName: `Scene_${sceneId}_uploaded.jpg`,
            assetType: "image" as const,
          };
        }
        return sc;
      });
      const updatedProject = { ...prev, storyboard: updatedScenes };
      onSaveProject(updatedProject, true);
      return updatedProject;
    });

    setActiveSlideIndices((indices) => ({
      ...indices,
      [sceneId]: 0,
    }));

    setIsUploadingImage(false);
    const successMsg = t.imageUploadSuccess.replace("{sceneId}", sceneId);
    setInfoMsg(successMsg);
    console.log(`[Hệ thống] ✅ Thành công: ${successMsg}`);
  };

  const handleCopyPrompt = (promptText: string) => {
    logAction("handleCopyPrompt");
    navigator.clipboard.writeText(promptText);
    const successMsg = t.Scene_visual_prompt_copie || "Đã sao chép prompt.";
    setInfoMsg(successMsg);
    console.log(`[Hệ thống] ✅ Thành công: ${successMsg}`);
    setTimeout(() => setInfoMsg(""), 4000);
  };

  const handleGenerateHooks = async (force = false) => {
    logAction("handleGenerateHooks");
    if (!(project.input?.content || "").trim()) {
      setErrorMsg(
        t.Please_enter_script_conte ||
        "Vui lòng nhập nội dung trước khi tạo hook.",
      );
      return;
    }
    setLoadingStates((prev) => ({ ...prev, generateHooks: true }));
    setLoading(true);
    setErrorMsg("");
    try {
      const payload = {
        originalInput: project.input?.content || "",
        config: project.config,
        hookType: hookStrategy,
        duration: hookDuration,
        count: hookCount,
        language: project.config.language || ProjectLanguage.VI,
        bypassCache: force === true,
      };

      const { success, data, error } = await safeSystemFetch(
        "/api/pipeline/hooks",
        payload,
      );

      if (!success || data?.error || data?.warning) {
        throw new Error(
          error || data?.error || data?.warning || "Failed to generate hooks.",
        );
      }

      const generatedVersions = data.versions || [];
      setHooksDraft(generatedVersions);

      const successMsg = t.generateHookSuccess || "Tạo hook thành công.";
      setInfoMsg(successMsg);
      console.log(
        `[Hooks] ✅ Success: Generated ${generatedVersions.length} hooks.`,
      );
    } catch (e: any) {
      setErrorMsg(e.message || t.generateHookFailed || "Lỗi tạo hook.");
    } finally {
      setLoadingStates((prev) => ({ ...prev, generateHooks: false }));
      setLoading(false);
    }
  };

  const handleCopyHook = (hookText: string) => {
    logAction("handleCopyHook");
    navigator.clipboard.writeText(hookText);
    const successMsg =
      t.Hook_content_copied_to_cl || "Đã sao chép nội dung hook.";
    setInfoMsg(successMsg);
    console.log(`[Hệ thống] ✅ Thành công: ${successMsg}`);
    setTimeout(() => setInfoMsg(""), 4000);
  };

  const handleCopyAllPrompts = () => {
    logAction("handleCopyAllPrompts");
    const storyboard = project.storyboard || [];
    if (storyboard.length === 0) {
      setInfoMsg(t.No_scenes_available_to_co);
      return;
    }

    const lines = storyboard.map((scene, index) => {
      return `${index + 1}. ${(scene.prompt || "").trim()}`;
    });

    const textBlock = lines.join("\n");

    navigator.clipboard
      .writeText(textBlock)
      .then(() => {
        setCopiedAll(true);
        setTimeout(() => setCopiedAll(false), 3000);
        const successMsg =
          t.Pure_optimized_scene_prom || "Đã sao chép toàn bộ prompt.";
        setInfoMsg(successMsg);
        console.log(`[Hệ thống] ✅ Thành công: ${successMsg}`);
      })
      .catch((err) => {
        logger.error("FAILED_COPY_PROMPTS", err);
      });
  };

  const handleReferenceImagesUpload = async (files: FileList | null) => {
    logAction("handleReferenceImagesUpload");
    if (!files) return;
    const ArrayFiles = Array.from(files);
    if (ArrayFiles.length === 0) return;

    try {
      const newBase64Images: string[] = [];
      for (const file of ArrayFiles) {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        newBase64Images.push(base64);
      }

      setProject((prev) => {
        const existing = prev.visualConfig?.referenceImages || [];
        return {
          ...prev,
          visualConfig: {
            ...prev.visualConfig,
            referenceImages: [...existing, ...newBase64Images],
          },
        };
      });
    } catch (e) {
      logger.error("ERROR_READING_REF_IMAGES", e);
    }
  };

  const handleExtractStyle = async () => {
    logAction("handleExtractStyle");

    const images = project.visualConfig?.referenceImages;
    if (!images || images.length === 0) return;

    setLoadingStates((prev) => ({ ...prev, extractStyle: true }));
    setLoading(true);
    setErrorMsg("");
    setInfoMsg(t.MULTI_STEP_SYSTEM_FLOW_Ex);

    try {

      const extractPayload = { images };
      const {
        success: extractSuccess,
        data: extractData,
        error: extractError,
      } = await safeSystemFetch("/api/pipeline/extract-style", extractPayload);

      if (!extractSuccess || extractData?.error) {
        throw new Error(
          extractError || extractData?.error || "Style extraction failed",
        );
      }

      const extractedStyle = extractData.style;

      setProject((prev) => ({
        ...prev,
        visualConfig: {
          ...prev.visualConfig,
          referencePrompt: extractedStyle,
        },
      }));

      setLoadingStates((prev) => ({ ...prev, extractStyle: false }));
      const successMsg =
        t.Style_extracted_successfu ||
        "Trích xuất phong cách thiết kế thành công.";
      setInfoMsg(successMsg);
      console.log(`[Hệ thống] ✅ Thành công: ${successMsg}`);
      setTimeout(() => setInfoMsg(""), 4000);
    } catch (e: any) {
      logger.error("STYLE_EXTRACTION_ERR", e);
      setErrorMsg(t.styleExtractionError.replace("{error}", e.message));
    } finally {
      setLoadingStates((prev) => ({ ...prev, extractStyle: false }));
      setLoading(false);
    }
  };

  const handleApplyStyleToScenes = async () => {
    logAction("handleApplyStyleToScenes");
    if (!project.storyboard || project.storyboard.length === 0) {
      setInfoMsg(t.No_scenes_to_apply_style);
      return;
    }
    const currentStyle = project.visualConfig?.referencePrompt;
    if (!currentStyle) {
      setInfoMsg(t.No_style_extracted_yet);
      return;
    }

    setLoadingStates((prev) => ({ ...prev, applyStyle: true }));
    setLoading(true);
    setErrorMsg("");
    setInfoMsg(t.Applying_style_to_scenes);

    try {
      const rewritePayload = {
        storyboard: project.storyboard,
        newStyle: currentStyle,
        aspectRatio: project.visualConfig.aspectRatio,
      };
      const { success: rewriteSuccess, data: rewriteData } =
        await safeSystemFetch("/api/pipeline/rewrite-prompts", rewritePayload);

      if (rewriteSuccess && rewriteData?.storyboard) {
        setProject((prev) => ({
          ...prev,
          storyboard: rewriteData.storyboard,
        }));
        const successMsg =
          t.Successfully_applied_styl ||
          "Áp dụng phong cách thiết kế thành công.";
        setInfoMsg(successMsg);
        console.log(`[Hệ thống] ✅ Thành công: ${successMsg}`);
      } else {
        setProject((prev) => ({
          ...prev,
          storyboard: (prev.storyboard || []).map((scene) => ({
            ...scene,
            prompt: scene.prompt || "",
          })),
        }));
        setInfoMsg(t.Applied_style_fallback_mo);
      }
    } catch (err: any) {
      setErrorMsg(t.applyStyleError.replace("{error}", err.message));
    } finally {
      setLoadingStates((prev) => ({ ...prev, applyStyle: false }));
      setLoading(false);
    }
  };

  const handleOptimizeAllPrompts = async () => {
    logAction("handleOptimizeAllPrompts");
    const isVi = project.config.language === 'vi';
    const txt = isVi ? APP_TEXTS.VN : APP_TEXTS.EN;

    if (!project.storyboard?.length) {
      setInfoMsg(t.No_scenes_to_apply_style || txt.NO_SCENES_TO_OPTIMIZE);
      return;
    }

    setLoadingStates((prev) => ({ ...prev, optimizePrompts: true }));
    setLoading(true);
    setErrorMsg("");
    setInfoMsg(t.optimizingPrompts || txt.OPTIMIZING_PROMPTS_FALLBACK);

    try {
      const payload = {
        storyboard: project.storyboard,
        visualConfig: project.visualConfig,
        aspectRatio: project.visualConfig.aspectRatio,
        language: project.config.language,
      };
      const { success, data, error } =
        await safeSystemFetch(API_ROUTES.PIPELINE_OPTIMIZE_PROMPTS, payload);

      if (success && data?.storyboard) {
        setProject((prev) => ({ ...prev, storyboard: data.storyboard }));
        setInfoMsg(t.optimizePromptsSuccess || txt.OPTIMIZE_PROMPTS_SUCCESS_FALLBACK);
      } else {
        throw new Error(error || data?.error || txt.OPTIMIZATION_FAILED);
      }
    } catch (err: any) {
      setErrorMsg(
        t.optimizePromptsError
          ? t.optimizePromptsError.replace("{error}", err.message)
          : txt.OPTIMIZE_PROMPTS_FAILED_FALLBACK + err.message
      );
    } finally {
      setLoadingStates((prev) => ({ ...prev, optimizePrompts: false }));
      setLoading(false);
    }
  };

  const handleAnalyzeCharacter = async () => {
    logAction("handleAnalyzeCharacter");
    const script = project.scriptRewritten || project.input?.content || "";
    if (!script) {
      setErrorMsg(t.charScriptEmpty);
      return;
    }

    setLoadingStates((prev) => ({ ...prev, analyzeCharacter: true }));
    setLoading(true);
    setErrorMsg("");
    setInfoMsg(t.charAnalyzing);

    try {
      const { success, data, error } = await safeSystemFetch(
        "/api/pipeline/analyze-character",
        { script },
      );
      if (!success || data?.error) {
        throw new Error(error || data?.error || "Character analysis failed");
      }

      const rawCharacters = (data.characters || []).slice(0, 3);
      const chars = rawCharacters.map((c: any, index: number) => ({
        id: `char_${index + 1}_${Date.now()}`,
        name: c.name,
        description: c.description,
        images: [],
        prompt: c.prompt || "",
        extracted: false,
      }));

      setProject((prev) => ({
        ...prev,
        visualConfig: {
          ...prev.visualConfig,
          characters: chars,
          characterAnalysis: rawCharacters
            .map((c: any) => `${c.name}: ${c.description}`)
            .join("\n"),
          characterExtracted: false,
        },
      }));

      const successMsg =
        t.charAnalyzeSuccess || "Phân tích nhân vật thành công.";
      setInfoMsg(successMsg);
      console.log(`[Hệ thống] ✅ Thành công: ${successMsg}`);
    } catch (e: any) {
      logger.error("GENERAL_ERROR", e);
      setErrorMsg(`${t.charAnalyzeFailed} ${e.message}`);
    } finally {
      setLoadingStates((prev) => ({ ...prev, analyzeCharacter: false }));
      setLoading(false);
    }
  };

  const handleCharacterImagesUpload = async (
    charId: string,
    files: FileList | null,
  ) => {
    logAction("handleCharacterImagesUpload");
    if (!files) return;
    const ArrayFiles = Array.from(files);
    if (ArrayFiles.length === 0) return;

    try {
      const newBase64Images: string[] = [];
      for (const file of ArrayFiles) {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        newBase64Images.push(base64);
      }

      setProject((prev) => {
        const chars = prev.visualConfig?.characters || [];
        const updatedChars = chars.map((c) => {
          if (c.id === charId) {
            return {
              ...c,
              images: [...(c.images || []), ...newBase64Images],
            };
          }
          return c;
        });

        const firstCharImages = updatedChars[0]?.images || [];

        return {
          ...prev,
          visualConfig: {
            ...prev.visualConfig,
            characters: updatedChars,
            characterImages: firstCharImages,
          },
        };
      });
    } catch (e) {
      logger.error("ERROR_READING_CHAR_IMAGES", e);
    }
  };

  const handleExtractCharacter = async (charId: string) => {
    logAction("handleExtractCharacter for charId " + charId);
    const char = project.visualConfig?.characters?.find((c) => c.id === charId);
    if (!char) return;
    const images = char.images;
    if (!images || images.length === 0) {
      setErrorMsg(t.charNoImages);
      return;
    }

    setLoadingStates((prev) => ({
      ...prev,
      [`extractCharacter_${charId}`]: true,
    }));
    setLoading(true);
    setErrorMsg("");
    setInfoMsg(t.charExtracting);

    try {
      const payload = {
        images,
        characterDescription: char.description,
      };
      const { success, data, error } = await safeSystemFetch(
        "/api/pipeline/extract-character",
        payload,
      );

      if (!success || data?.error) {
        throw new Error(error || data?.error || "Character extraction failed");
      }

      setProject((prev) => {
        const chars = prev.visualConfig?.characters || [];
        const updatedChars = chars.map((c) => {
          if (c.id === charId) {
            return {
              ...c,
              prompt: data.characterPrompt,
              extracted: true,
            };
          }
          return c;
        });

        const firstChar = updatedChars[0];

        return {
          ...prev,
          visualConfig: {
            ...prev.visualConfig,
            characters: updatedChars,
            characterPrompt: firstChar?.prompt || "",
            characterExtracted: firstChar?.extracted || false,
          },
        };
      });

      const successMsg =
        t.charExtractSuccess || "Trích xuất đặc điểm nhân vật thành công.";
      setInfoMsg(successMsg);
      console.log(`[Hệ thống] ✅ Thành công: ${successMsg}`);
    } catch (e: any) {
      logger.error("GENERAL_ERROR", e);
      setErrorMsg(`${t.charExtractFailed} ${e.message}`);
    } finally {
      setLoadingStates((prev) => ({
        ...prev,
        [`extractCharacter_${charId}`]: false,
      }));
      setLoading(false);
    }
  };

  const handleApplyCharacterToScenes = async () => {
    logAction("handleApplyCharacterToScenes");
    if (!project.storyboard || project.storyboard.length === 0) {
      setInfoMsg(t.charNoScenes);
      return;
    }
    const characters = project.visualConfig?.characters || [];
    const activeChars = characters.filter((c) => c.prompt || c.description);
    if (activeChars.length === 0) {
      setInfoMsg(t.charNoPrompt);
      return;
    }

    setLoadingStates((prev) => ({ ...prev, applyCharacter: true }));
    setLoading(true);
    setErrorMsg("");
    setInfoMsg(t.charApplying);

    try {
      const payload = {
        storyboard: project.storyboard,
        characters: activeChars.map((c) => ({
          name: c.name,
          prompt: c.prompt || c.description,
        })),
        aspectRatio: project.visualConfig.aspectRatio,
      };
      const { success, data } = await safeSystemFetch(
        "/api/pipeline/rewrite-prompts-character",
        payload,
      );
      if (success && data?.storyboard) {
        setProject((prev) => ({
          ...prev,
          storyboard: data.storyboard,
        }));
        const successMsg =
          t.charApplySuccess || "Áp dụng đặc điểm nhân vật thành công.";
        setInfoMsg(successMsg);
        console.log(`[Hệ thống] ✅ Thành công: ${successMsg}`);
      } else {
        setProject((prev) => ({
          ...prev,
          storyboard: (prev.storyboard || []).map((scene) => ({
            ...scene,
            prompt: scene.prompt || "",
          })),
        }));
        setInfoMsg(t.charApplyFallback);
      }
    } catch (e: any) {
      setErrorMsg(`${t.charApplyFailed} ${e.message}`);
    } finally {
      setLoadingStates((prev) => ({ ...prev, applyCharacter: false }));
      setLoading(false);
    }
  };

  const handleBulkUploadImages = async (files: FileList) => {
    logAction("handleBulkUploadImages");
    if (!files || files.length === 0) return;

    const sortedFiles = Array.from(files).sort((a, b) =>
      a.name.localeCompare(b.name, undefined, {
        numeric: true,
        sensitivity: "base",
      }),
    );

    const storyboard = project.storyboard || [];
    if (storyboard.length === 0) return;

    const readFileAsBase64 = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === "string") {
            resolve(reader.result);
          } else {
            reject(new Error("File read error"));
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    };

    const results: { sceneId: string; fileName: string; base64: string }[] = [];
    const unmatchedFiles: File[] = [];

    for (const file of sortedFiles) {
      const cleanName = file.name.toLowerCase().replace(/\.[^/.]+$/, "");
      const normFile = cleanName.replace(/[^a-z0-9]/g, "");

      let matchedSceneId: string | null = null;


      for (const scene of storyboard) {
        const normId = scene.id.toLowerCase().replace(/[^a-z0-9]/g, "");
        if (normFile.includes(normId) || normId.includes(normFile)) {
          matchedSceneId = scene.id;
          break;
        }
      }


      if (!matchedSceneId) {
        const fileNumbers = cleanName.match(/\d+/g);
        if (fileNumbers && fileNumbers.length > 0) {
          const fileNum = fileNumbers[0];
          for (const scene of storyboard) {
            const sceneNumbers = scene.id.match(/\d+/g);
            if (
              sceneNumbers &&
              sceneNumbers.length > 0 &&
              sceneNumbers[0] === fileNum
            ) {
              matchedSceneId = scene.id;
              break;
            }
          }
        }
      }

      if (matchedSceneId) {
        try {
          const base64 = await readFileAsBase64(file);
          results.push({
            sceneId: matchedSceneId,
            fileName: file.name,
            base64,
          });
        } catch (e) {
          logger.error("ERROR_READ_MATCHED_FILE", file.name, e);
        }
      } else {
        unmatchedFiles.push(file);
      }
    }


    if (unmatchedFiles.length > 0) {
      let fileIdx = 0;
      for (const scene of storyboard) {

        const alreadyMatched = results.some((r) => r.sceneId === scene.id);
        if (!alreadyMatched && fileIdx < unmatchedFiles.length) {
          const file = unmatchedFiles[fileIdx];
          try {
            const base64 = await readFileAsBase64(file);
            results.push({ sceneId: scene.id, fileName: file.name, base64 });
            fileIdx++;
          } catch (e) {
            logger.error("ERROR_READ_SEQ_FILE", file.name, e);
          }
        }
      }
    }

    if (results.length === 0) {
      setInfoMsg(t.No_matching_image_files_f);
      return;
    }


    let warnings = "";
    setProject((prev) => {
      const updatedScenes = (prev.storyboard || []).map((sc) => {
        const foundMatch = results.find((r) => r.sceneId === sc.id);
        if (foundMatch) {
          const newUrls = [foundMatch.base64];
          return {
            ...sc,
            assetUrl: foundMatch.base64,
            assetUrls: newUrls,
            assetName: `Scene_${sc.id}_bulk.jpg`,
            assetType: "image" as const,
          };
        }
        return sc;
      });

      const missingIds: string[] = [];
      updatedScenes.forEach((sc) => {
        if (!sc.assetUrl) {
          missingIds.push(sc.id);
        }
      });

      if (missingIds.length > 0) {
        warnings = t.missingImagesWarning.replace(
          "{ids}",
          missingIds.join(", "),
        );
      }

      const outOfOrderMatches = results.filter((r) => {
        const numericPart = r.fileName.match(/\d+/);
        if (numericPart) {
          return numericPart[0] !== r.sceneId;
        }
        return false;
      });

      if (outOfOrderMatches.length > 0) {
        const warningDetail = t.mismatchImagesWarning
          .replace("{fileName}", outOfOrderMatches[0].fileName)
          .replace("{sceneId}", outOfOrderMatches[0].sceneId);
        warnings = warnings ? `${warnings} | ${warningDetail}` : warningDetail;
      }

      const updatedProject = { ...prev, storyboard: updatedScenes };
      onSaveProject(updatedProject, true);
      return updatedProject;
    });

    if (warnings) {
      setBulkUploadWarning(warnings);
    } else {
      setBulkUploadWarning("");
    }


    setProject((prev) => {
      results.forEach((match) => {
        const sc = (prev.storyboard || []).find((s) => s.id === match.sceneId);
        if (sc && sc.assetUrls) {
          setActiveSlideIndices((indices) => ({
            ...indices,
            [match.sceneId]: sc.assetUrls!.length - 1,
          }));
        }
      });
      return prev;
    });

    const successMsg = t.bulkUploadSuccess.replace(
      "{count}",
      results.length.toString(),
    );
    setInfoMsg(successMsg);
    console.log(`[Hệ thống] ✅ Thành công: ${successMsg}`);
  };

  const handlePrevSlide = (sceneId: string, max: number) => {
    logAction("handlePrevSlide");
    setActiveSlideIndices((prev) => {
      const current = prev[sceneId] !== undefined ? prev[sceneId] : max - 1;
      const nextIdx = current === 0 ? max - 1 : current - 1;
      return { ...prev, [sceneId]: nextIdx };
    });
  };

  const handleThumbnailReferenceImagesUpload = async (
    files: FileList | null,
  ) => {
    logAction("handleThumbnailReferenceImagesUpload");
    if (!files) return;
    const ArrayFiles = Array.from(files);
    if (ArrayFiles.length === 0) return;

    try {
      const newBase64Images: string[] = [];
      for (const file of ArrayFiles) {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        newBase64Images.push(base64);
      }

      setProject((prev) => {
        const existing = prev.visualConfig?.thumbnailReferenceImages || [];
        return {
          ...prev,
          visualConfig: {
            ...prev.visualConfig,
            thumbnailReferenceImages: [...existing, ...newBase64Images],
          },
        };
      });
    } catch (e) {
      logger.error("ERROR_READ_THUMB_REF_IMAGES", e);
    }
  };

  const handleExtractThumbnailStyle = async () => {
    logAction("handleExtractThumbnailStyle");
    const images = project.visualConfig?.thumbnailReferenceImages;
    if (!images || images.length === 0) return;

    setLoadingStates((prev) => ({ ...prev, extractThumbnailStyle: true }));
    try {
      const response = await fetch("/api/pipeline/extract-style", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images }),
      });
      const data = await response.json();
      if (data.style) {
        if (project.thumbnails && project.thumbnails.length > 0) {
          setInfoMsg(t.Rewriting_thumbnail_promp);
          const rewritePayload = {
            thumbnails: project.thumbnails,
            newStyle: data.style,
          };
          const { success: rewriteSuccess, data: rewriteData } =
            await safeSystemFetch(
              "/api/pipeline/rewrite-thumbnails",
              rewritePayload,
            );

          if (rewriteSuccess && rewriteData?.thumbnails) {
            setProject((prev) => ({
              ...prev,
              thumbnails: rewriteData.thumbnails,
              visualConfig: {
                ...prev.visualConfig,
                thumbnailReferencePrompt: data.style,
              },
            }));
          } else {
            setProject((prev) => {
              const updatedThumbnails = (prev.thumbnails || []).map(
                (thumb) => ({
                  ...thumb,
                  prompt: thumb.prompt || "",
                }),
              );
              return {
                ...prev,
                thumbnails: updatedThumbnails,
                visualConfig: {
                  ...prev.visualConfig,
                  thumbnailReferencePrompt: data.style,
                },
              };
            });
          }
        } else {
          setProject((prev) => ({
            ...prev,
            visualConfig: {
              ...prev.visualConfig,
              thumbnailReferencePrompt: data.style,
            },
          }));
        }
        const successMsg =
          t.Thumbnail_style_extracted ||
          "Trích xuất phong cách ảnh thu nhỏ thành công.";
        setInfoMsg(successMsg);
        console.log(`[Thumbnail] ✅ Thành công: ${successMsg}`);
      } else if (data.error) {
        setErrorMsg(data.error);
      }
    } catch (e: any) {
      setErrorMsg(e.message);
    } finally {
      setLoadingStates((prev) => ({ ...prev, extractThumbnailStyle: false }));
    }
  };

  const handleNextSlide = (sceneId: string, max: number) => {
    logAction("handleNextSlide");
    setActiveSlideIndices((prev) => {
      const current = prev[sceneId] !== undefined ? prev[sceneId] : max - 1;
      const nextIdx = current === max - 1 ? 0 : current + 1;
      return { ...prev, [sceneId]: nextIdx };
    });
  };

  const handleDeleteSceneImage = async (sceneId: string, imgIdx: number) => {
    logAction("handleDeleteSceneImage");
    setIsDeletingImage(true);
    await new Promise((resolve) => setTimeout(resolve, 500));

    setProject((prev) => {
      const updatedStoryboard = (prev.storyboard || []).map((sc) => {
        if (sc.id === sceneId) {
          return {
            ...sc,
            assetUrls: [],
            assetUrl: "",
            assetName: "",
          };
        }
        return sc;
      });
      const updatedProject = {
        ...prev,
        storyboard: updatedStoryboard,
        allowBulkDeleteImages: true,
      };
      onSaveProject(updatedProject, true);
      return updatedProject;
    });

    setActiveSlideIndices((prev) => {
      const currentIdx = prev[sceneId] !== undefined ? prev[sceneId] : 0;
      if (currentIdx >= imgIdx && currentIdx > 0) {
        return {
          ...prev,
          [sceneId]: currentIdx - 1,
        };
      }
      return prev;
    });

    setIsDeletingImage(false);
  };

  const handleDeleteAllSceneImages = () => {
    logAction("handleDeleteAllSceneImages");
    if (!window.confirm(t.deleteAllImagesConfirm)) return;

    setProject((prev) => {
      const updatedStoryboard = (prev.storyboard || []).map((sc) => {
        return {
          ...sc,
          assetUrls: [],
          assetUrl: undefined,
          assetName: undefined,
        };
      });
      const updatedProject = {
        ...prev,
        storyboard: updatedStoryboard,
        allowBulkDeleteImages: true,
      };
      onSaveProject(updatedProject, true);
      return updatedProject;
    });

    setActiveSlideIndices({});

    const successMsg = t.deleteAllImagesSuccess;
    setInfoMsg(successMsg);
    console.log(`[Hệ thống] ✅ Thành công: ${successMsg}`);
  };

  const handleCancelBatchGenerate = () => {
    cancelBatchImageRef.current = true;
    setIsCancellingBatch(true);
    setInfoMsg(t.cancellingBatchGen);
  };

  const handleBatchGenerateAllImages = async () => {
    logAction("handleBatchGenerateAllImages");
    if (isBatchGenerating) return;

    cancelBatchImageRef.current = false;

    const scenes = project.storyboard || [];
    if (scenes.length === 0) {
      setErrorMsg(t.No_storyboard_scenes_foun);
      return;
    }

    let targetScenes = scenes.filter((s) => {
      const urls = s.assetUrls || (s.assetUrl ? [s.assetUrl] : []);
      return urls.length === 0;
    });

    if (targetScenes.length === 0) {
      targetScenes = [...scenes];
    }

    setIsBatchGenerating(true);
    setLoading(false);
    setErrorMsg("");
    setBatchProgressMsg(t.initializingBatchGen);

    const totalToProcess = targetScenes.length;
    let completedCount = 0;
    let hasError = false;

    const isGeminiChat = project.visualConfig.generationMode === ImageGenerationMode.GeminiChat;
    const speed = project.visualConfig.geminiChatSpeed || GeminiChatSpeed.Slow;
    const concurrency = isGeminiChat ? GEMINI_CHAT_SPEED_TAB_COUNT[speed] : 1;

    try {
      if (concurrency > 1 && isGeminiChat) {
        for (const scene of targetScenes) {
          setLoadingStates((prev) => ({
            ...prev,
            ["renderScene_" + scene.id]: true,
          }));
        }

        const batchItems = targetScenes.map(s => ({ sceneId: s.id, prompt: s.prompt }));
        const response = await fetch(API_ROUTES.PIPELINE_GENERATE_BATCH_IMAGES, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: batchItems,
            visualConfig: project.visualConfig,
            style: project.visualConfig.style,
          }),
        });

        if (!response.body) {
          throw new Error(t.streamNotSupported || "Luồng dữ liệu không được hỗ trợ bởi trình duyệt này.");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        let isReadingStream = true;
        while (isReadingStream) {
          if (cancelBatchImageRef.current) {
            reader.cancel().catch(() => { });
            setInfoMsg(
              t.batchGenCancelled.replace(
                "{completedCount}",
                completedCount.toString(),
              ),
            );
            isReadingStream = false;
            break;
          }

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
              const result = JSON.parse(line);

              setLoadingStates((prev) => ({
                ...prev,
                ["renderScene_" + result.sceneId]: false,
              }));

              if (result.success && result.base64) {
                const imageUrl = `data:image/jpeg;base64,${result.base64}`;
                setProject((prev) => {
                  const updated = (prev.storyboard || []).map((sc) => {
                    if (sc.id === result.sceneId) {
                      return {
                        ...sc,
                        assetUrl: imageUrl,
                        assetUrls: [imageUrl],
                        isGenerated: true,
                      };
                    }
                    return sc;
                  });
                  const updatedProject = { ...prev, storyboard: updated };
                  onSaveProject(updatedProject, true);
                  return updatedProject;
                });
                completedCount++;
              } else {
                logger.error("BATCH_SCENE_FAILED", result.sceneId, result.warning);
                setErrorMsg(
                  t.errorRenderingSceneBatch
                    .replace("{sceneId}", result.sceneId)
                    .replace("{error}", result.warning || "Unknown"),
                );
              }

              setBatchProgressMsg(
                t.generatingSceneBatch
                  .replace("{sceneId}", result.sceneId)
                  .replace("{currentIndex}", completedCount.toString())
                  .replace("{totalToProcess}", totalToProcess.toString()),
              );

            } catch (err) {
              logger.error("Failed to parse NDJSON line", line, err);
            }
          }
        }
      } else {
        let currentIndex = 0;

        while (currentIndex < targetScenes.length && !hasError) {
          if (cancelBatchImageRef.current) {
            setInfoMsg(
              t.batchGenCancelled.replace(
                "{completedCount}",
                completedCount.toString(),
              ),
            );
            break;
          }

          const batchScenes = targetScenes.slice(currentIndex, currentIndex + concurrency);

          setBatchProgressMsg(
            t.generatingSceneBatch
              .replace("{sceneId}", batchScenes.map(s => s.id).join(", "))
              .replace("{currentIndex}", (currentIndex + 1).toString())
              .replace("{totalToProcess}", totalToProcess.toString()),
          );

          for (const scene of batchScenes) {
            setLoadingStates((prev) => ({
              ...prev,
              ["renderScene_" + scene.id]: true,
            }));
          }

          const scene = batchScenes[0];
          try {
            await handleRenderSceneImage(scene.id, scene.prompt, false, true);
            completedCount++;
          } catch (err: any) {
            logger.error("ERROR_RENDERING_SCENE_BATCH", scene.id, err);
            setErrorMsg(
              t.errorRenderingSceneBatch
                .replace("{sceneId}", scene.id)
                .replace("{error}", err.message),
            );
            hasError = true;
          } finally {
            setLoadingStates((prev) => ({
              ...prev,
              ["renderScene_" + scene.id]: false,
            }));
          }

          currentIndex += batchScenes.length;

          if (currentIndex < targetScenes.length && !hasError && !cancelBatchImageRef.current) {
            const delayMs = getBatchDelayMs(project.visualConfig.batchDelay);
            const delaySecs = (delayMs / 1000).toFixed(1);
            setBatchProgressMsg(
              project.config.language === 'vi'
                ? APP_TEXTS.VN.WAITING_MSG(delaySecs)
                : APP_TEXTS.EN.WAITING_MSG(delaySecs)
            );
            await randomDelay(delayMs, delayMs);
          }
        }
      }

      if (!cancelBatchImageRef.current && !hasError) {
        const successMsg = t.batchGenSuccess.replace(
          "{completedCount}",
          completedCount.toString(),
        );
        setInfoMsg(successMsg);
      }
    } catch (err: any) {
      logger.error("BATCH_GEN_FAILURE", err);
      setErrorMsg(t.batchGenFailed.replace("{error}", err.message));
    } finally {
      setIsBatchGenerating(false);
      setIsCancellingBatch(false);
      setBatchProgressMsg("");
      if (isGeminiChat && concurrency > 1) {
        fetch(API_ROUTES.PIPELINE_CLEAN_BATCH_IMAGES, { method: "POST" }).catch(() => { });
      }
    }
  };

  const openSceneModal = (scene: StoryboardScene) => {
    setActiveSceneId(scene.id);
    setSceneEditScript(scene.script);
    setSceneEditSubtitle(scene.subtitle);
    setSceneEditPrompt(scene.prompt);
    setSceneEditMotion(scene.cameraMotion);
    setSceneEditFx(scene.effects || "");
    setSceneEditTransition(scene.transition || "");


    setPromptSetting("");
    setPromptTime("");
    setPromptCharacter("");
    setPromptCostume("");
    setPromptCameraAngle("");
    setShowPromptGeneratorPanel(false);
  };

  const handleGenerateDetailedPrompt = async () => {
    logAction("handleGenerateDetailedPrompt");
    setIsGeneratingDetailedPrompt(true);
    setErrorMsg("");
    try {
      const payload = {
        sceneScript: sceneEditScript,
        setting: promptSetting,
        time: promptTime,
        character: promptCharacter,
        costume: promptCostume,
        camera: promptCameraAngle,
        style: project.visualConfig?.stylePreset,
        aspectRatio: project.visualConfig.aspectRatio,
        characterPrompt: project.visualConfig?.characterPrompt,
        referencePrompt: project.visualConfig?.referencePrompt,
        currentPrompt: sceneEditPrompt,
      };
      const { success, data, error } = await safeSystemFetch(
        API_ROUTES.PIPELINE_DETAILED_PROMPT,
        payload,
      );
      if (!success || data?.error || data?.warning) {
        throw new Error(
          error || data?.error || data?.warning || "Prompt generation failed",
        );
      }
      if (data.prompt) {
        setSceneEditPrompt(data.prompt);
        setProject((prev) => {
          const updated = (prev.storyboard || []).map((sc) => {
            if (sc.id === activeSceneId) {
              return { ...sc, prompt: data.prompt };
            }
            return sc;
          });
          return { ...prev, storyboard: updated };
        });
        const successMsg =
          t.Detailed_image_prompt_gen || "Mở rộng prompt thành công.";
        setInfoMsg(successMsg);
        console.log(`[Hệ thống] ✅ Thành công: ${successMsg}`);
        setTimeout(() => setInfoMsg(""), 4000);
      }
    } catch (err: any) {
      logger.error("ERROR_GEN_DETAILED_PROMPT", err);
      setErrorMsg(t.promptGenError.replace("{error}", err.message));
      setTimeout(() => setErrorMsg(""), 4000);
    } finally {
      setIsGeneratingDetailedPrompt(false);
    }
  };

  const handleSaveSceneEdits = () => {
    logAction("handleSaveSceneEdits");
    if (!activeSceneId) return;
    setProject((prev) => {
      const updated = (prev.storyboard || []).map((sc) => {
        if (sc.id === activeSceneId) {
          return {
            ...sc,
            script: sceneEditScript,
            subtitle: sceneEditSubtitle,
            prompt: sceneEditPrompt,
            cameraMotion: sceneEditMotion,
            effects: sceneEditFx,
            transition: sceneEditTransition,
          };
        }
        return sc;
      });

      const totalDuration = updated.reduce(
        (sum: number, s: any) => sum + (s.duration || 0),
        0,
      );
      let syncLogText = t.syncLedgerSuccess.replace(
        "{totalDuration}",
        totalDuration.toFixed(1),
      );

      updated.forEach((scene: any, idx: number) => {
        syncLogText += t.syncLedgerItem
          .replace("{index}", (idx + 1).toString())
          .replace("{startTime}", scene.startTime)
          .replace("{endTime}", scene.endTime)
          .replace("{duration}", scene.duration.toString())
          .replace(
            "{script}",
            (scene.script || scene.subtitle || "").substring(0, 35),
          );
      });

      setAlignmentsLog(syncLogText);

      return {
        ...prev,
        storyboard: updated,
        voiceConfig: {
          ...prev.voiceConfig,
          timingLog: syncLogText,
        },
      };
    });
    setActiveSceneId(null);
    const successMsg =
      t.Scene_mod_saved_successfu || "Lưu chỉnh sửa phân cảnh thành công.";
    setInfoMsg(successMsg);
    console.log(`[Hệ thống] ✅ Thành công: ${successMsg}`);
  };

  const handleTriggerAssetAndThumbnail = async (
    force = false,
    btnPosition = "top",
  ) => {
    logAction("handleTriggerAssetAndThumbnail");

    const isForce = force === true;
    if (project.thumbnails && project.thumbnails.length > 0 && !isForce) {
      setInfoMsg(t.Loaded_current_Thumbnail_);
      return;
    }

    if (!project.scriptRewritten) {
      setErrorMsg(t.Missing_detailed_script_f_1);
      return;
    }

    setLoadingStates((prev) => ({
      ...prev,
      [`assetAndThumbnail_${btnPosition}`]: true,
      assetAndThumbnail_loading: true,
    }));
    setLoading(true);
    setErrorMsg("");
    setInfoMsg(t.MULTI_STEP_SYSTEM_FLOW_De);

    try {

      const payload = {
        rewrittenScript: project.scriptRewritten,
        config: project.config,
        visualConfig: project.visualConfig,
        bypassCache: isForce,
      };

      const { success, data, error } = await safeSystemFetch(
        "/api/pipeline/thumbnails",
        payload,
      );

      if (!success || data?.error || data?.warning) {
        throw new Error(
          error ||
          data?.error ||
          data?.warning ||
          "System pipeline rejected the request.",
        );
      }

      if (data.thumbnails) {
        const formattedThumbs = data.thumbnails.map((th: ThumbnailItem) => {
          return {
            ...th,
            imageUrl: `${EXTERNAL_URLS.PLACEHOLD_CO}/600x338/f43f5e/ffffff?text=${encodeURIComponent(th.style || "Thumbnail")}`,
          };
        });

        setProject((prev) => ({
          ...prev,
          thumbnails: formattedThumbs,
        }));
        trackOperationCost(15, 0.0008);
        const successMsg =
          t.High_engagement_Thumbnail || "Hoàn thành tạo ảnh thu nhỏ.";
        setInfoMsg(successMsg);
        console.log(`[Thumbnail] ✅ Thành công: ${successMsg}`);
      }
    } catch (e: any) {
      setErrorMsg(t.thumbnailPipelineError.replace("{error}", e.message));
    } finally {
      setLoadingStates((prev) => ({
        ...prev,
        [`assetAndThumbnail_${btnPosition}`]: false,
        assetAndThumbnail_loading: false,
      }));
      setLoading(false);
    }
  };

  const handleRenderThumbnailImage = async (
    thumbId: string,
    promptText: string,
    styleText: string,
    force = false,
  ) => {
    logAction("handleRenderThumbnailImage");
    const isForce = force === true;
    setLoadingStates((prev) => ({ ...prev, ["renderThumb_" + thumbId]: true }));
    setLoading(true);
    setErrorMsg("");
    try {
      const response = await fetch("/api/pipeline/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `${promptText}. Designed in rich high-CTR ${styleText} layout.`,
          style: styleText,
          resolution: "Standard",
          bypassCache: isForce,
          engine:
            project.visualConfig.imageGeneratorEngine ||
            ImageGeneratorEngine.Veo3,
          sandboxConfig: sandboxConfig,
          visualConfig: project.visualConfig,
        }),
      });
      const data = await safeResponseJson(response, {});
      if (data.warning) {
        setErrorMsg(data.warning);
      }
      let imgUrl = "";
      let isSuccess = false;
      if (data.success && data.base64) {
        imgUrl = `data:image/jpeg;base64,${data.base64}`;
        trackOperationCost(40, 0.03);
        isSuccess = true;
      } else if (data.fallbackUrl) {
        imgUrl = data.fallbackUrl;
        trackOperationCost(5, 0.0002);
      } else {
        imgUrl = `${EXTERNAL_URLS.PLACEHOLD_CO}/600x338/0369a1/ffffff?text=${encodeURIComponent(styleText)}&bg=gradient`;
        trackOperationCost(2, 0.0001);
      }

      setProject((prev) => {
        const updated = (prev.thumbnails || []).map((th) => {
          if (th.id === thumbId) {
            return { ...th, imageUrl: imgUrl };
          }
          return th;
        });
        const updatedProject = { ...prev, thumbnails: updated };
        onSaveProject(updatedProject, true);
        return updatedProject;
      });
      if (isSuccess) {
        const successMsg =
          t.Mockup_thumbnail_painted_ || "Tạo ảnh thu nhỏ thành công.";
        setInfoMsg(successMsg);
        console.log(`[Thumbnail] ✅ Thành công: ${successMsg}`);
      }
    } catch (e: any) {
      setErrorMsg(e.message);
    } finally {
      setLoadingStates((prev) => ({
        ...prev,
        ["renderThumb_" + thumbId]: false,
      }));
      setLoading(false);
    }
  };

  const handleDownloadVoice = async () => {
    logAction("handleDownloadVoice");
    if (!ttsAudioUrl) return;

    if (ttsAudioUrl === "simulated") {
      setInfoMsg(t.Generating_and_preparing_);
      try {
        setLoadingStates((prev) => ({ ...prev, voiceGenerate_loading: true }));
        if (!project.storyboard || project.storyboard.length === 0) {
          throw new Error(t.You_must_generate_the_sto);
        }
        const mergedUrl = await handleTriggerAllSceneVoices(
          project.storyboard,
          true,
        );

        if (mergedUrl) {
          const a = document.createElement("a");
          a.href = mergedUrl;
          a.download = `voiceover_${project.voiceConfig?.gender || "speaker"}.wav`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          const successMsg =
            t.Voiceover_downloaded_succ || "Tải file giọng nói thành công.";
          setInfoMsg(successMsg);
          console.log(`[TTS] ✅ Thành công: ${successMsg}`);
        } else {
          throw new Error("Missing audio URL from synthesis");
        }
      } catch (err: any) {
        logger.error("SYNTHESIZE_ON_THE_FLY_FAILED", err);
        setErrorMsg(t.voiceSynthError.replace("{error}", err.message));
      } finally {
        setLoadingStates((prev) => ({ ...prev, voiceGenerate_loading: false }));
      }
    } else {
      const a = document.createElement("a");
      a.href = ttsAudioUrl;
      a.download = `voiceover_${project.voiceConfig?.gender || "speaker"}.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const handleRegenerateUnifiedVoice = async (voiceConfigOverride?: any) => {
    logAction("handleRegenerateUnifiedVoice");
    stopPlaybackSim();
    if (activeCloudPreviewAudio) {
      activeCloudPreviewAudio.pause();
      activeCloudPreviewAudio.currentTime = 0;
      activeCloudPreviewAudio = null;
    }

    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    setIsPlayingTts(false);
    setIsPlayingRealAudio(false);

    setLoadingStates((prev) => ({
      ...prev,
      bulkVoiceGenerate_loading: true,
      voiceGenerate_loading: true,
    }));
    setLoading(true);
    setErrorMsg("");
    setInfoMsg("");
    setBulkVoiceStatus(t.MULTI_STEP_SYSTEM_FLOW_Ge);

    try {
      if (project.storyboard && project.storyboard.length > 0) {
        await handleTriggerAllSceneVoices(
          project.storyboard,
          true,
          voiceConfigOverride,
        );
      } else {
        throw new Error(t.You_must_generate_the_sto_2);
      }
    } catch (e: any) {
      logger.error("UNIFIED_SCENE_VOICE_GEN_FAILED", e);
      setErrorMsg(e.message || "Unified voice generation failed.");
    } finally {
      setLoadingStates((prev) => ({
        ...prev,
        bulkVoiceGenerate_loading: false,
        voiceGenerate_loading: false,
      }));
      setLoading(false);
      setBulkVoiceStatus("");
    }
  };

  const handleTriggerVoiceGenerate = async (
    force = false,
    btnPosition = "top",
  ) => {
    logAction("handleTriggerVoiceGenerate");

    if (simAudioRef.current) {
      simAudioRef.current.pause();
      simAudioRef.current.currentTime = 0;
    }
    if (step2AudioRef.current) step2AudioRef.current.pause();

    if (activeCloudPreviewAudio) {
      activeCloudPreviewAudio.pause();
      activeCloudPreviewAudio.currentTime = 0;
      activeCloudPreviewAudio = null;
    }

    if (audioPreviewRef.current) {
      audioPreviewRef.current.pause();
      audioPreviewRef.current.currentTime = 0;
    }

    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    setIsPlayingTts(false);
    setIsPlayingRealAudio(false);

    setLoadingStates((prev) => ({
      ...prev,
      [`voiceGenerate_${btnPosition}`]: true,
      voiceGenerate_loading: true,
      bulkVoiceGenerate_loading: true,
    }));
    setLoading(true);
    setErrorMsg("");
    try {
      await handleTriggerAllSceneVoices();
    } catch (e: any) {
      logger.error("UNIFIED_SEGMENT_VOICE_GEN_FAILED", e);
      setErrorMsg(e.message || "Unified voice generation failed.");
    } finally {
      setLoadingStates((prev) => ({
        ...prev,
        [`voiceGenerate_${btnPosition}`]: false,
        voiceGenerate_loading: false,
        bulkVoiceGenerate_loading: false,
      }));
      setLoading(false);
    }
  };

  const handleAlignAndSaveVoice = async (
    audioName: string,
    audioUrl: string,
    audioBase64: string,
    audioType: AudioType,
    isFromAutoGenerateAll = false,
  ) => {
    stopPlaybackSim();

    const lang = currentLang === "en" ? "en" : "vi";
    const texts = EXTERNAL_AUDIO_TEXTS[lang];

    const scenes = project.storyboard || [];
    if (scenes.length === 0) {
      setErrorMsg(t.No_scenes_to_generate_voi || texts.NO_SCENES);
      return;
    }

    if (!isFromAutoGenerateAll) {
      setLoadingStates((prev) => ({
        ...prev,
        bulkVoiceGenerate_loading: true,
        voiceGenerate_loading: true,
      }));
    }
    setLoading(true);
    setErrorMsg("");
    setInfoMsg("");
    setBulkVoiceStatus(t.aligningVoiceWithWhisper || texts.ALIGNING);

    try {
      const updatedScenes = scenes.map((sc: any) => {
        const cleanText = cleanScriptText(sc.script || sc.subtitle || "");
        return {
          ...sc,
          narrationText: cleanText,
          textLength: cleanText.length,
        };
      });

      const audioCtx = new (
        window.AudioContext || (window as any).webkitAudioContext
      )();

      let totalDuration = 10;
      try {
        const arrayBufferRaw = base64ToArrayBuffer(audioBase64);
        const decoded = await audioCtx.decodeAudioData(arrayBufferRaw.slice(0));
        totalDuration = Math.max(3, decoded.duration);
      } catch (decodeErr) {
        logger.warn("FAILED_DECODE_AUDIO_DURATION", decodeErr);
      } finally {
        audioCtx.close();
      }

      const alignResponse = await fetch(API_ROUTES.PIPELINE_ALIGN_VOICE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audioBase64: audioBase64,
          scenes: updatedScenes.map((sc) => ({
            id: sc.id,
            script: sc.narrationText,
          })),
        }),
      });

      let alignData: any;
      try {
        alignData = await alignResponse.json();
      } catch (jsonErr) {
        alignData = {};
      }

      if (!alignResponse.ok) {
        throw new Error(alignData.error || `API align-voice error status: ${alignResponse.status}`);
      }

      if (alignData && alignData.success && Array.isArray(alignData.alignments)) {
        console.log(VOICE_ALIGN_LOGS.ALIGN_SUCCESS, alignData.alignments);
        for (let i = 0; i < updatedScenes.length; i++) {
          const scene = updatedScenes[i];
          const align = alignData.alignments.find((a: any) => a.id === scene.id);

          scene.script = scene.narrationText;
          scene.subtitle = scene.narrationText;
          scene.audioUrl = undefined;
          scene.audioBase64 = undefined;

          if (align) {
            scene.duration = align.duration;
            scene.startTime = formatTimeHelper(align.start);
            scene.endTime = formatTimeHelper(align.end);
          } else {
            throw new Error(
              t.voiceAlignSceneNotFound
                ? t.voiceAlignSceneNotFound.replace("{sceneId}", scene.id.toString())
                : texts.SCENE_NOT_FOUND.replace("{sceneId}", scene.id.toString())
            );
          }
        }
        setInfoMsg(t.voiceAlignSuccess || texts.ALIGN_SUCCESS);
      } else {
        throw new Error(alignData.error || t.voiceAlignNoValidResult || texts.NO_VALID_RESULT);
      }

      let syncLogText = (t.syncLedgerSuccess || texts.SYNC_COMPLETE).replace(
        "{totalDuration}",
        totalDuration.toFixed(1),
      );

      updatedScenes.forEach((scene: any, idx: number) => {
        syncLogText += (t.syncLedgerItem || texts.SYNC_ITEM)
          .replace("{index}", (idx + 1).toString())
          .replace("{startTime}", scene.startTime)
          .replace("{endTime}", scene.endTime)
          .replace("{duration}", scene.duration.toString())
          .replace(
            "{script}",
            (scene.script || "").substring(0, 35),
          );
      });

      setAlignmentsLog(syncLogText);
      setTtsAudioUrl(audioUrl);
      setTtsAudioBytes(audioBase64);

      const updatedProject = {
        ...project,
        storyboard: updatedScenes,
        voiceConfig: {
          ...project.voiceConfig,
          audioType: audioType,
          uploadedAudioName: audioType === AudioType.Upload ? audioName : project.voiceConfig.uploadedAudioName,
          audioUrl: audioUrl,
          audioBase64: audioBase64,
          timingLog: syncLogText,
        },
      };
      setProject(updatedProject);
      onSaveProject(updatedProject, true);

      setTimeout(() => {
        voicePlayerSectionRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 300);

      return audioUrl;
    } catch (err: any) {
      logger.error(EXTERNAL_AUDIO_TEXTS.LOG_ERROR_KEY, err);
      setErrorMsg(t.voiceAlignError ? t.voiceAlignError.replace("{error}", err.message) : texts.ALIGN_ERROR.replace("{error}", err.message));
      throw err;
    } finally {
      if (!isFromAutoGenerateAll) {
        setLoadingStates((prev) => ({
          ...prev,
          bulkVoiceGenerate_loading: false,
          voiceGenerate_loading: false,
        }));
      }
      setLoading(false);
      setBulkVoiceStatus("");
    }
  };

  const handleTriggerAllSceneVoices = async (
    providedScenes?: any[],
    isFromAutoGenerateAll = false,
    voiceConfigOverride?: any,
  ) => {
    logAction("handleTriggerAllSceneVoices");
    stopPlaybackSim();

    const scenes = providedScenes || project.storyboard || [];
    if (scenes.length === 0) {
      setErrorMsg(t.No_scenes_to_generate_voi);
      return;
    }

    if (!isFromAutoGenerateAll) {
      setLoadingStates((prev) => ({
        ...prev,
        bulkVoiceGenerate_loading: true,
      }));
    }
    setErrorMsg("");
    setInfoMsg("");
    setBulkVoiceStatus("");

    try {
      const vConfig = voiceConfigOverride || project.voiceConfig || defaultVoiceConfig;
      const updatedScenes = [...scenes];

      let fullScript = project.scriptRewritten || "";
      if (!fullScript) {
        fullScript = updatedScenes
          .map((s) => cleanScriptText(s.script || s.subtitle || ""))
          .join(" ");
      }

      if (!fullScript.trim()) {
        throw new Error(t.Script_is_empty);
      }

      setBulkVoiceStatus(t.MULTI_STEP_SYSTEM_FLOW_Ge_3);

      const voiceURI = vConfig.voiceURI || "preset-vi-bac-female";
      const { finalSpeed, finalPitch } = getVoiceModifiers(
        voiceURI,
        vConfig.speed || 1.0,
        vConfig.pitch || 1.0,
      );

      const response = await fetch("/api/pipeline/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: fullScript,
          gender: vConfig.gender,
          age: vConfig.age,
          emotion: vConfig.emotion,
          speed: finalSpeed,
          pitch: finalPitch,
          volume: vConfig.volume || 1.0,
          voiceURI: voiceURI,
          voice_id: voiceURI,
        }),
      });

      const audioData = await safeResponseJson(response, {});

      if (!audioData || !audioData.success || !audioData.audioBase64) {
        throw new Error(
          audioData?.warning || audioData?.error || "No audio returned",
        );
      }

      const arrayBuffer = base64ToArrayBuffer(audioData.audioBase64);
      const bufferClone = arrayBuffer.slice(0);
      let processedBlob;
      try {
        processedBlob = await applyAudioEffects(
          bufferClone,
          finalSpeed,
          finalPitch,
          vConfig.volume || 1.0,
        );
      } catch (effectsError) {
        processedBlob = new Blob([arrayBuffer], {
          type: audioData.mimeType || "audio/wav",
        });
      }

      const mergedUrl = URL.createObjectURL(processedBlob);
      const processedBase64 = await blobToBase64(processedBlob);

      updatedScenes.forEach((sc: any) => {
        const text = cleanScriptText(sc.script || sc.subtitle || "");
        sc.narrationText = text;
        sc.textLength = text.length;
      });

      return await handleAlignAndSaveVoice(
        "",
        mergedUrl,
        processedBase64,
        AudioType.Generated,
        isFromAutoGenerateAll,
      );

    } catch (err: any) {
      logger.error("GENERAL_ERROR", err);
      setErrorMsg(t.errorGeneratingVoiceover.replace("{error}", err.message));
    } finally {
      if (!isFromAutoGenerateAll) {
        setLoadingStates((prev) => ({
          ...prev,
          bulkVoiceGenerate_loading: false,
        }));
      }
      setBulkVoiceStatus("");
    }
  };

  const handleProcessExternalAudio = async (
    audioName: string,
    audioUrl: string,
    audioBase64: string,
  ) => {
    logAction(EXTERNAL_AUDIO_TEXTS.LOG_ACTION);
    try {
      await handleAlignAndSaveVoice(audioName, audioUrl, audioBase64, AudioType.Upload);
    } catch (err) { }
  };

  const handleTriggerStoryboardAndVoices = async () => {
    logAction("handleTriggerStoryboardAndVoices");
    setLoadingStates((prev) => ({
      ...prev,
      storyboardAndVoices_loading: true,
    }));
    try {
      const newStoryboard = await handleTriggerStoryboardSplit(
        true,
        "top",
        true,
      );
      if (newStoryboard && newStoryboard.length > 0) {
        await handleTriggerAllSceneVoices(newStoryboard, true);
      }
    } finally {
      setLoadingStates((prev) => ({
        ...prev,
        storyboardAndVoices_loading: false,
      }));
    }
  };

  const handleTriggerSEOBoost = async (force = false, btnPosition = "top") => {
    logAction("handleTriggerSEOBoost");

    const isForce = force === true;
    if (project.seo?.titles && project.seo.titles.length > 0 && !isForce) {
      setInfoMsg(t.Loaded_current_SEO_draft);
      return;
    }

    if (!project.scriptRewritten) {
      setErrorMsg(t.Missing_detailed_script_f_4);
      return;
    }

    setLoadingStates((prev) => ({
      ...prev,
      [`seoBoost_${btnPosition}`]: true,
      seoBoost_loading: true,
    }));
    setLoading(true);
    setErrorMsg("");
    setInfoMsg(t.MULTI_STEP_SYSTEM_FLOW_An);

    try {

      const response = await fetch("/api/pipeline/seo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalInput: project.input?.content || "",
          config: project.config,
          seoConfig: project.seoConfig,
          rewrittenScript: project.scriptRewritten,
          bypassCache: isForce,
        }),
      });
      const data = await safeResponseJson(response, {});

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.titles) {
        const updatedProject = {
          ...project,
          seo: data,
        };
        setProject(updatedProject);
        onSaveProject(updatedProject, true);
        trackOperationCost(10, 0.0005);
        const successMsg =
          t.SEO_metrics_formulated_su || "Tối ưu hóa SEO thành công.";
        if (data.warning) {
          setInfoMsg(`${successMsg} (${data.warning})`);
        } else {
          setInfoMsg(successMsg);
        }
        console.log(`[SEO] ✅ Thành công: ${successMsg}`);
      } else if (data.warning) {
        throw new Error(data.warning);
      }
    } catch (e: any) {
      setErrorMsg(t.seoPipelineError.replace("{error}", e.message));
    } finally {
      setLoadingStates((prev) => ({
        ...prev,
        [`seoBoost_${btnPosition}`]: false,
        seoBoost_loading: false,
      }));
      setLoading(false);
    }
  };

  const handleOpenExportCenter = () => {
    logAction("handleOpenExportCenter");
    setCurrentStep(WizardStep.Export);
    if (project.storyboard && project.storyboard.length > 0) {
      setSimActiveScene(project.storyboard[0]);
    }
  };

  const handleOfflineRenderWebM = async () => {
    logAction("handleOfflineRenderWebM");
    stopPlaybackSim();
    setIsOfflineRendering(true);
    setOfflineRenderProgress(0);
    setInfoMsg(t.waitExportProcess);

    try {
      const blob = await compileVideoToBlob(
        project.storyboard || [],
        getSceneImageUrl,
        project.voiceConfig,
        ttsAudioUrl,
        (prog) => {
          setOfflineRenderProgress(prog);
        },
      );

      setRenderedVideoBlob(blob);

      const isMp4 = blob.type.includes("mp4");
      const ext = isMp4 ? "mp4" : "webm";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `${project.name.replace(/\s+/g, "_")}_rendered_video.${ext}`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 150);

      setOfflineRenderProgress(100);
      const successMsg =
        t.Cinematic_simulated_video || "Đã xuất video thành công.";
      setInfoMsg(successMsg);
      console.log(`[Hệ thống] ✅ Thành công: ${successMsg}`);
    } catch (err) {
      logger.warn("OFFLINE_RENDERING_ERROR", err);
      setErrorMsg(t.Failed_to_compile_video_C);
    } finally {
      setIsOfflineRendering(false);
    }
  };

  const startPlaybackSim = () => {
    if (!project.storyboard || project.storyboard.length === 0) return;
    setIsPlayingSim(true);
    setCurrentSimTime(0);
    setSimActiveScene(project.storyboard[0]);

    if (
      project.voiceConfig?.audioUrl === "simulated_speech" &&
      "speechSynthesis" in window
    ) {
      window.speechSynthesis.cancel();
      const utterance = createSpeechUtterance(project.storyboard[0].script);
      window.speechSynthesis.speak(utterance);
      startTimerBasedSim();
    } else if (ttsAudioUrl && ttsAudioUrl !== "simulated") {
      if (simAudioRef.current) {
        simAudioRef.current.pause();
        simAudioRef.current = null;
      }

      const audio = new Audio(ttsAudioUrl);
      audio.playbackRate = 1.0;
      audio.volume =
        project.voiceConfig?.volume !== undefined
          ? project.voiceConfig?.volume
          : 1.0;
      simAudioRef.current = audio;

      audio.ontimeupdate = () => {
        const currentTime = audio.currentTime;
        setCurrentSimTime(currentTime);

        const ranges = getSceneTimeRanges(project.storyboard || []);
        const matchingRange =
          ranges.find((r) => currentTime >= r.start && currentTime < r.end) ||
          ranges[ranges.length - 1];

        if (matchingRange) {
          const matchingScene = project.storyboard?.find(
            (sc) => sc.id === matchingRange.id,
          );
          if (
            matchingScene &&
            (!simActiveScene || simActiveScene.id !== matchingScene.id)
          ) {
            setSimActiveScene(matchingScene);
          }
        }
      };

      audio.onended = () => {
        stopPlaybackSim();
      };

      audio.play().catch((err) => {
        logger.warn("AUDIO_PLAYBACK_FAILED", err);
        startTimerBasedSim();
      });
    } else {
      startTimerBasedSim();
    }
  };

  const startTimerBasedSim = () => {
    let secondsElapsed = 0;
    const ranges = getSceneTimeRanges(project.storyboard || []);
    const totalDuration =
      ranges.length > 0 ? ranges[ranges.length - 1].end : 30;

    simTimerRef.current = setInterval(() => {
      secondsElapsed += 1;
      setCurrentSimTime(secondsElapsed);

      if (secondsElapsed >= totalDuration) {
        stopPlaybackSim();
        return;
      }

      const matchingRange = ranges.find(
        (r) => secondsElapsed >= r.start && secondsElapsed < r.end,
      );
      if (matchingRange) {
        const matchingScene = project.storyboard?.find(
          (sc) => sc.id === matchingRange.id,
        );
        if (
          matchingScene &&
          (!simActiveScene || simActiveScene.id !== matchingScene.id)
        ) {
          setSimActiveScene(matchingScene);
          if (
            project.voiceConfig?.audioUrl === "simulated_speech" &&
            "speechSynthesis" in window
          ) {
            window.speechSynthesis.cancel();
            const utterance = createSpeechUtterance(matchingScene.script);
            window.speechSynthesis.speak(utterance);
          }
        }
      }
    }, 1000);
  };

  const stopPlaybackSim = () => {
    setIsPlayingSim(false);
    if (simTimerRef.current) {
      clearInterval(simTimerRef.current);
      simTimerRef.current = null;
    }
    if (simAudioRef.current) {
      simAudioRef.current.pause();
      simAudioRef.current = null;
    }
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  };

  useEffect(() => {
    return () => {
      if (simTimerRef.current) {
        clearInterval(simTimerRef.current);
      }
      if (simAudioRef.current) {
        simAudioRef.current.pause();
        simAudioRef.current = null;
      }
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const renderFallbackSceneImage = (sc: any): string => {
    const canvas = document.createElement("canvas");
    canvas.width = 1280;
    canvas.height = 720;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(0, 0, 1280, 720);

      ctx.fillStyle = "#94a3b8";
      ctx.font = "bold 12px monospace";
      ctx.textAlign = "center";
      const topLabel = `SCENE ID: ${sc.id || "N/A"} | DURATION: ${formatCleanDuration(sc.duration || 5)}s`;
      ctx.fillText(topLabel.toUpperCase(), 640, 45);

      const rect_w = 280;
      const rect_h = 170;
      const x = 640 - rect_w / 2;
      const y = 310 - rect_h / 2;
      const r = 24;

      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + rect_w - r, y);
      ctx.quadraticCurveTo(x + rect_w, y, x + rect_w, y + r);
      ctx.lineTo(x + rect_w, y + rect_h - r);
      ctx.quadraticCurveTo(x + rect_w, y + rect_h, x + rect_w - r, y + rect_h);
      ctx.lineTo(x + r, y + rect_h);
      ctx.quadraticCurveTo(x, y + rect_h, x, y + rect_h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
      ctx.lineWidth = 10;
      ctx.strokeStyle = "#cbd5e1";
      ctx.stroke();

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + rect_w - r, y);
      ctx.quadraticCurveTo(x + rect_w, y, x + rect_w, y + r);
      ctx.lineTo(x + rect_w, y + rect_h - r);
      ctx.quadraticCurveTo(x + rect_w, y + rect_h, x + rect_w - r, y + rect_h);
      ctx.lineTo(x + r, y + rect_h);
      ctx.quadraticCurveTo(x, y + rect_h, x, y + rect_h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
      ctx.clip();

      ctx.beginPath();
      ctx.moveTo(x + 5, y + rect_h + 10);
      ctx.lineTo(x + 90, y + 60);
      ctx.lineTo(x + 185, y + rect_h + 10);
      ctx.closePath();
      ctx.fillStyle = "#cbd5e1";
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(x + 130, y + rect_h + 10);
      ctx.lineTo(x + 205, y + 100);
      ctx.lineTo(x + 275, y + rect_h + 10);
      ctx.closePath();

      ctx.strokeStyle = "#f8fafc";
      ctx.lineWidth = 10;
      ctx.stroke();

      ctx.fillStyle = "#cbd5e1";
      ctx.fill();

      ctx.beginPath();
      ctx.arc(x + 175, y + 55, 18, 0, Math.PI * 2);
      ctx.fillStyle = "#cbd5e1";
      ctx.fill();

      ctx.restore();

      const subtitleText = sc.subtitle || sc.script || "";
      if (subtitleText.trim()) {
        ctx.font = "bold 24px sans-serif";
        ctx.textAlign = "center";

        const words = subtitleText.split(" ");
        const lines: string[] = [];
        let currentLine = "";
        const maxSubWidth = 900;

        for (let i = 0; i < words.length; i++) {
          const testLine = currentLine + words[i] + " ";
          const metrics = ctx.measureText(testLine);
          if (metrics.width > maxSubWidth && i > 0) {
            lines.push(currentLine.trim());
            currentLine = words[i] + " ";
          } else {
            currentLine = testLine;
          }
        }
        lines.push(currentLine.trim());


        const subLineHeight = 32;
        const totalHeight = lines.length * subLineHeight + 24;
        const pillY = 580 - totalHeight / 2;

        ctx.fillStyle = "rgba(15, 23, 42, 0.85)";


        const pillW = 1000;
        const pillX = 640 - pillW / 2;
        const pillR = 16;
        ctx.beginPath();
        ctx.moveTo(pillX + pillR, pillY);
        ctx.lineTo(pillX + pillW - pillR, pillY);
        ctx.quadraticCurveTo(
          pillX + pillW,
          pillY,
          pillX + pillW,
          pillY + pillR,
        );
        ctx.lineTo(pillX + pillW, pillY + totalHeight - pillR);
        ctx.quadraticCurveTo(
          pillX + pillW,
          pillY + totalHeight,
          pillX + pillW - pillR,
          pillY + totalHeight,
        );
        ctx.lineTo(pillX + pillR, pillY + totalHeight);
        ctx.quadraticCurveTo(
          pillX,
          pillY + totalHeight,
          pillX,
          pillY + totalHeight - pillR,
        );
        ctx.lineTo(pillX, pillY + pillR);
        ctx.quadraticCurveTo(pillX, pillY, pillX + pillR, pillY);
        ctx.closePath();
        ctx.fill();


        ctx.fillStyle = "#ffffff";
        lines.forEach((lineText, idx) => {
          ctx.fillText(
            lineText,
            640,
            pillY + 16 + (idx + 0.75) * subLineHeight,
          );
        });
      } else {
        ctx.fillStyle = "#94a3b8";
        ctx.font = "italic 16px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(t.No_subtitles_or_descripti, 640, 560);
      }
    }
    return canvas.toDataURL("image/jpeg", 0.85).split(",")[1];
  };

  const getSceneImageUrl = (scene: any): string => {
    if (!scene) return "";
    if (scene.assetUrl) {
      return scene.assetUrl;
    }
    const cacheKey = `${scene.id}_${scene.duration || 5}_${scene.subtitle || ""}_${scene.script || ""}`;
    if (fallbackImageCache.has(cacheKey)) {
      return fallbackImageCache.get(cacheKey)!;
    }
    const base64 = renderFallbackSceneImage(scene);
    const dataUrl = `data:image/jpeg;base64,${base64}`;
    fallbackImageCache.set(cacheKey, dataUrl);
    return dataUrl;
  };

  const handleDownloadJSONProject = async () => {
    logAction("handleDownloadJSONProject");
    stopPlaybackSim();
    setInfoMsg(t.waitExportProcess);
    setLoadingExportType(EXPORT_TYPES.ZIP);

    try {
      let activeVideoBlob = renderedVideoBlob;
      if (!activeVideoBlob) {
        activeVideoBlob = await compileVideoToBlob(
          project.storyboard || [],
          getSceneImageUrl,
          project.voiceConfig,
          ttsAudioUrl,
          (prog) => {
          },
        );
        setRenderedVideoBlob(activeVideoBlob);
      }

      const zip = new JSZip();

      const activeFolderUuid = "517bd185-0d13-49a4-8227-e73216acc7a9";
      const folderKey = `{${activeFolderUuid}}`;

      const isMp4 = activeVideoBlob.type.includes("mp4");
      const videoExt = isMp4 ? "mp4" : "webm";
      const videoFileName = `rendered_video.${videoExt}`;

      zip.file(`${folderKey}/${videoFileName}`, activeVideoBlob);
      zip.file(videoFileName, activeVideoBlob);

      zip.folder(folderKey);
      zip.folder(`${folderKey}/adjust_mask`);
      zip.folder(`${folderKey}/common_attachment`);
      zip.folder(`${folderKey}/matting`);
      zip.folder(`${folderKey}/qr_upload`);
      zip.folder(`${folderKey}/Resources`);
      zip.folder(`${folderKey}/Resources/voices`);
      zip.folder(`${folderKey}/Resources/images`);
      zip.folder(`${folderKey}/Resources/voice_images`);
      zip.folder(`${folderKey}/Resources/original_voices`);
      zip.folder(`${folderKey}/smart_crop`);
      zip.folder(`${folderKey}/subdraft`);
      zip.folder(`${folderKey}/Timelines`);

      const canvas = document.createElement("canvas");
      canvas.width = 600;
      canvas.height = 400;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const grad = ctx.createLinearGradient(0, 0, 600, 400);
        grad.addColorStop(0, "#0f172a");
        grad.addColorStop(1, "#e11d48");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 600, 400);

        ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
        ctx.lineWidth = 1;
        for (let x = 0; x < 600; x += 30) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, 400);
          ctx.stroke();
        }
        for (let y = 0; y < 400; y += 30) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(600, y);
          ctx.stroke();
        }

        ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
        ctx.beginPath();
        ctx.arc(500, 100, 180, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 32px sans-serif";
        ctx.fillText(project.name || "Untitled Project", 45, 140);

        ctx.fillStyle = "#fca5a5";
        ctx.font = "14px monospace";
        ctx.fillText("• PROFESSIONAL CAPCUT PC EXPORT BUNDLE", 45, 185);
        ctx.fillText(
          `• SCENES: ${project.storyboard?.length || 0} SECTIONS`,
          45,
          210,
        );
        ctx.fillText(`• AUDIO TRANSCRIPTION SYNCHRONIZED`, 45, 235);

        ctx.fillStyle = "#94a3b8";
        ctx.font = "11px sans-serif";
        const dateStr = new Date().toLocaleString();
        ctx.fillText(`Exported on: ${dateStr}`, 45, 335);

        ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
        ctx.font = "bold 12px sans-serif";
        ctx.fillText("AI VIDEO FACTORY © 2026", 45, 360);
      }

      let coverBase64 = "";
      try {
        coverBase64 = canvas.toDataURL("image/jpeg", 0.85).split(",")[1];
      } catch (err) {
        logger.warn("COVER_IMAGE_CANVAS_CAPTURE_FAILED", err);
      }

      if (coverBase64) {
        zip.file("draft_cover.jpg", coverBase64, { base64: true });
        zip.file(`${folderKey}/draft_cover.jpg`, coverBase64, { base64: true });
      } else {
        zip.file("draft_cover.jpg", "Mock Cover Binary Space");
        zip.file(`${folderKey}/draft_cover.jpg`, "Mock Cover Binary Space");
      }

      const sceneImagePromises = (project.storyboard || []).map(
        async (sc, index) => {
          let imgBase64 = "";
          const targetUrl = getSceneImageUrl(sc);
          if (targetUrl && targetUrl.startsWith("data:")) {
            imgBase64 = targetUrl.split(",")[1];
          } else if (targetUrl) {
            try {
              const response = await fetch(targetUrl);
              const blob = await response.blob();
              imgBase64 = await new Promise<string>((resolve, reject) => {
                const r = new FileReader();
                r.onloadend = () => {
                  const res = r.result as string;
                  resolve(res.split(",")[1]);
                };
                r.onerror = reject;
                r.readAsDataURL(blob);
              });
            } catch (e) {
              logger.warn("FAILED_FETCH_SCENE_IMAGE", sc.id, e);
            }
          }

          if (!imgBase64) {
            imgBase64 = renderFallbackSceneImage(sc);
          }


          const itemFileName = `${index + 1}_image.jpg`;
          zip.file(`${folderKey}/Resources/images/${itemFileName}`, imgBase64, {
            base64: true,
          });
          zip.file(`Resources/images/${itemFileName}`, imgBase64, { base64: true });

          zip.file(`${folderKey}/Resources/voice_images/${itemFileName}`, imgBase64, {
            base64: true,
          });
          zip.file(`Resources/voice_images/${itemFileName}`, imgBase64, { base64: true });

          return {
            id: sc.id,
            fileName: itemFileName,
          };
        },
      );

      await Promise.all(sceneImagePromises);


      let ttsBase64 = project.voiceConfig?.audioBase64 || project.output?.audioBase64 || "";
      if (ttsBase64.startsWith("data:")) {
        ttsBase64 = ttsBase64.split(",")[1];
      }

      const voiceUrl = project.voiceConfig?.audioUrl || ttsAudioUrl;
      if (!ttsBase64 && voiceUrl) {
        if (voiceUrl.startsWith("data:")) {
          ttsBase64 = voiceUrl.split(",")[1];
        } else if (
          voiceUrl !== "simulated" &&
          voiceUrl !== "simulated_speech"
        ) {
          try {
            const response = await fetch(voiceUrl);
            const blob = await response.blob();
            ttsBase64 = await new Promise<string>((resolve, reject) => {
              const r = new FileReader();
              r.onloadend = () => {
                const res = r.result as string;
                resolve(res.split(",")[1]);
              };
              r.onerror = reject;
              r.readAsDataURL(blob);
            });
          } catch (e) {
            logger.warn("FAILED_FETCH_NARRATION", e);
          }
        }
      }

      const bufferToWav = (
        buffer: AudioBuffer,
        startSec: number,
        endSec: number,
      ): Blob => {
        const sampleRate = buffer.sampleRate;
        const numChannels = buffer.numberOfChannels;

        const startSample = Math.floor(startSec * sampleRate);
        const endSample = Math.min(
          Math.floor(endSec * sampleRate),
          buffer.length,
        );
        let numSamples = Math.max(0, endSample - startSample);

        const MIN_DURATION = 0.5;
        const minSamples = Math.floor(MIN_DURATION * sampleRate);
        if (numSamples < minSamples) {
          numSamples = minSamples;
        }

        const blockAlign = numChannels * 2;
        const byteRate = sampleRate * blockAlign;
        const dataSize = numSamples * blockAlign;
        const bufferLength = 44 + dataSize;

        const arrayBuf = new ArrayBuffer(bufferLength);
        const view = new DataView(arrayBuf);

        const writeString = (
          v: DataView,
          offset: number,
          stringStr: string,
        ) => {
          for (let j = 0; j < stringStr.length; j++) {
            v.setUint8(offset + j, stringStr.charCodeAt(j));
          }
        };

        writeString(view, 0, "RIFF");
        view.setUint32(4, 36 + dataSize, true);
        writeString(view, 8, "WAVE");
        writeString(view, 12, "fmt ");
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, numChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, byteRate, true);
        view.setUint16(32, blockAlign, true);
        view.setUint16(34, 16, true);
        writeString(view, 36, "data");
        view.setUint32(40, dataSize, true);

        let offset = 44;
        const channelData: Float32Array[] = [];
        for (let c = 0; c < numChannels; c++) {
          channelData.push(buffer.getChannelData(c));
        }

        const maxReadableSample = Math.min(startSample + numSamples, buffer.length);
        for (let i = startSample; i < maxReadableSample; i++) {
          for (let c = 0; c < numChannels; c++) {
            let sample = channelData[c][i] || 0;
            sample = Math.max(-1, Math.min(1, sample));
            const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
            view.setInt16(offset, intSample, true);
            offset += 2;
          }
        }

        return new Blob([view], { type: "audio/wav" });
      };

      let audioBuffer: AudioBuffer | null = null;
      if (ttsBase64) {
        try {
          const arrayBuffer = base64ToArrayBuffer(ttsBase64);
          const audioCtx = new (
            window.AudioContext || (window as any).webkitAudioContext
          )();
          if (audioCtx.state === "suspended") {
            await audioCtx.resume();
          }
          audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
          await audioCtx.close();
        } catch (e) {
          logger.error("FAILED_DECODE_NARRATION_SLICE", e);
        }
      }

      if (audioBuffer) {
        const fullVoiceBlob = bufferToWav(audioBuffer, 0, audioBuffer.duration);
        const fullVoiceBase64 = await new Promise<string>((resolve, reject) => {
          const r = new FileReader();
          r.onloadend = () => {
            const res = r.result as string;
            resolve(res.split(",")[1]);
          };
          r.onerror = reject;
          r.readAsDataURL(fullVoiceBlob);
        });
        zip.file(`${folderKey}/audio_narration.wav`, fullVoiceBase64, {
          base64: true,
        });
        zip.file(`audio_narration.wav`, fullVoiceBase64, { base64: true });


        zip.file(`${folderKey}/Resources/original_voices/original_voice.wav`, fullVoiceBase64, {
          base64: true,
        });
        zip.file(`Resources/original_voices/original_voice.wav`, fullVoiceBase64, { base64: true });
      } else if (ttsBase64) {
        zip.file(`${folderKey}/audio_narration.wav`, ttsBase64, {
          base64: true,
        });
        zip.file(`audio_narration.wav`, ttsBase64, { base64: true });


        zip.file(`${folderKey}/Resources/original_voices/original_voice.wav`, ttsBase64, {
          base64: true,
        });
        zip.file(`Resources/original_voices/original_voice.wav`, ttsBase64, { base64: true });
      } else {
        const placeholderText = "Mock Audio Stream Narration Voice Placeholder";
        zip.file(`${folderKey}/audio_narration.wav`, placeholderText);
        zip.file(`audio_narration.wav`, placeholderText);


        zip.file(`${folderKey}/Resources/original_voices/original_voice.wav`, placeholderText);
        zip.file(`Resources/original_voices/original_voice.wav`, placeholderText);
      }

      const capcutMaterials: any = {
        audios: [],
        beats: [],
        canvases: [],
        chromas: [],
        colors: [],
        drafts: [],
        effects: [],
        flowers: [],
        images: [],
        keyframes: [],
        manual_deformations: [],
        masks: [],
        sound_channel_mappings: [],
        speeds: [],
        stickers: [],
        tail_leaders: [],
        texts: [],
        transitions: [],
        video_effects: [],
        videos: [],
        vocal_separations: [],
      };

      const videoTrackSegments: any[] = [];
      const subtitleTrackSegments: any[] = [];
      const audioTrackSegments: any[] = [];

      let sceneRanges = getSceneTimeRanges(project.storyboard || []);

      if (audioBuffer && ttsBase64 && project.storyboard && project.storyboard.length > 0) {
        setInfoMsg(getPipelineLog("VOICE_ALIGN_START", currentLang === "vi"));
        try {
          const res = await fetch(API_ROUTES.PIPELINE_ALIGN_VOICE, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              audioBase64: ttsBase64,
              scenes: project.storyboard
            })
          });
          const alignData = await res.json();
          if (alignData.success && alignData.alignments) {
            sceneRanges = sceneRanges.map(sc => {
              const align = alignData.alignments.find((a: any) => a.id === sc.id);
              if (align) {
                return { ...sc, start: align.start, end: align.end, duration: align.duration };
              }
              return sc;
            });
          }
        } catch (e) {
          logger.warn("FAILED_TO_CALL_AI_VOICE_ALIGN", e);
        }
      }

      const parsedScenesTimings = sceneRanges.map((sc) => {
        return {
          id: sc.id,
          startUs: Math.round(sc.start * 1000000),
          durationUs: Math.round(sc.duration * 1000000),
          cameraMotion: sc.cameraMotion,
          transition: sc.transition,
          subtitle: sc.subtitle,
        };
      });

      const totalDurationUs =
        sceneRanges.length > 0
          ? Math.round(sceneRanges[sceneRanges.length - 1].end * 1000000)
          : 0;

      const sceneAudios: {
        id: string;
        fileName: string;
        durationUs: number;
      }[] = [];

      if (audioBuffer) {
        setInfoMsg(t.Syncing_scene_voices);
        for (let index = 0; index < sceneRanges.length; index++) {
          const sc = sceneRanges[index];
          try {
            const voiceSegmentBlob = bufferToWav(audioBuffer, sc.start, sc.end);
            const voiceSegmentBase64 = await new Promise<string>(
              (resolve, reject) => {
                const r = new FileReader();
                r.onloadend = () => {
                  const res = r.result as string;
                  resolve(res.split(",")[1]);
                };
                r.onerror = reject;
                r.readAsDataURL(voiceSegmentBlob);
              },
            );
            const filename = `${index + 1}_voice.wav`;

            zip.file(`${folderKey}/Resources/voices/${filename}`, voiceSegmentBase64, {
              base64: true,
            });
            zip.file(`Resources/voices/${filename}`, voiceSegmentBase64, {
              base64: true,
            });

            zip.file(`${folderKey}/Resources/voice_images/${filename}`, voiceSegmentBase64, {
              base64: true,
            });
            zip.file(`Resources/voice_images/${filename}`, voiceSegmentBase64, {
              base64: true,
            });

            sceneAudios.push({
              id: sc.id,
              fileName: filename,
              durationUs: Math.round(sc.duration * 1000000),
            });
          } catch (sliceErr) {
            logger.warn("FAILED_PACKAGE_SLICED_VOICE", sc.id, sliceErr);
          }
        }
      }

      if (sceneAudios.length === 0) {
        for (let index = 0; index < sceneRanges.length; index++) {
          const sc = sceneRanges[index];
          const filename = `${index + 1}_voice.wav`;
          const dummyText = "Mock Audio Stream Segment Placeholder";
          zip.file(`${folderKey}/Resources/voices/${filename}`, dummyText);
          zip.file(`Resources/voices/${filename}`, dummyText);

          zip.file(`${folderKey}/Resources/voice_images/${filename}`, dummyText);
          zip.file(`Resources/voice_images/${filename}`, dummyText);
          sceneAudios.push({
            id: sc.id,
            fileName: filename,
            durationUs: Math.round(sc.duration * 1000000),
          });
        }
      }

      sceneAudios.forEach((sa, idx) => {
        const scRange =
          sceneRanges.find((r) => r.id === sa.id) || sceneRanges[idx];
        const startUs = Math.round(scRange.start * 1000000);
        const durationUs = Math.round(scRange.duration * 1000000);
        const materialId = `material_audio_scene_${sa.id}`;

        capcutMaterials.audios.push({
          id: materialId,
          type: "audio",
          duration: durationUs,
          source_platform: "AI Video Factory TTS Segmented",
          local_material_path: `C:/CapCut/User Data/Drafts/${folderKey}/Resources/voices/${sa.fileName}`,
        });

        audioTrackSegments.push({
          id: `seg_audio_scene_${sa.id}`,
          material_id: materialId,
          source_timerange: {
            duration: durationUs,
            start: 0,
          },
          target_timerange: {
            duration: durationUs,
            start: startUs,
          },
          speed: 1.0,
          volume: project.voiceConfig?.volume || 1.0,
        });
      });

      capcutMaterials.videos.push({
        id: "material_rendered_video_main",
        type: "video",
        duration: totalDurationUs,
        source_platform: "AI Video Factory Render Engine",
        local_material_path: `C:/CapCut/User Data/Drafts/${folderKey}/${videoFileName}`,
      });

      parsedScenesTimings.forEach((timing, index) => {
        const imgMatId = `material_image_${timing.id}`;

        capcutMaterials.images.push({
          id: imgMatId,
          type: "image",
          duration: timing.durationUs,
          local_material_path: `C:/CapCut/User Data/Drafts/${folderKey}/Resources/images/${index + 1}_image.jpg`,
        });

        videoTrackSegments.push({
          id: `seg_backup_video_slide_${timing.id}`,
          material_id: imgMatId,
          source_timerange: {
            duration: timing.durationUs,
            start: 0,
          },
          target_timerange: {
            duration: timing.durationUs,
            start: timing.startUs,
          },
          extra_info: {
            camera_motion: timing.cameraMotion,
            transition_effect: timing.transition,
          },
        });

        const textMatId = `material_text_${timing.id}`;
        capcutMaterials.texts.push({
          id: textMatId,
          type: "text",
          content: JSON.stringify({
            text: timing.subtitle,
            styles: {
              font_size: 15.0,
              text_color: "#ffff00",
              stroke: true,
              stroke_color: "#000000",
            },
          }),
        });

        subtitleTrackSegments.push({
          id: `seg_subtitle_${timing.id}`,
          material_id: textMatId,
          source_timerange: null,
          target_timerange: {
            duration: timing.durationUs,
            start: timing.startUs,
          },
        });
      });

      const draftContentObj = {
        canvas_config: {
          height: 1080,
          width: 1920,
          ratio: "16:9",
        },
        duration: totalDurationUs,
        id: "draft_root_timeline",
        materials: capcutMaterials,
        tracks: [
          {
            id: "track_video_timeline",
            type: "video",
            segments: videoTrackSegments,
          },
          {
            id: "track_audio_timeline",
            type: "audio",
            segments: audioTrackSegments,
          },
          {
            id: "track_subtitle_timeline",
            type: "text",
            segments: subtitleTrackSegments,
          },
        ],
      };

      const draftContentStr = JSON.stringify(draftContentObj, null, 2);

      const writeDraftFile = (name: string, content: string) => {
        zip.file(name, content);
        zip.file(`${folderKey}/${name}`, content);
      };

      writeDraftFile("draft_content.json", draftContentStr);
      writeDraftFile("draft_content.json.bak", draftContentStr);

      writeDraftFile(
        "attachment_editing.json",
        JSON.stringify(
          {
            editing_items: [],
            version: 1,
          },
          null,
          2,
        ),
      );

      writeDraftFile(
        "attachment_pc_common.json",
        JSON.stringify(
          {
            device_id: "ai-studio-pc-pro-export",
            client_version: "4.8.1",
            system_info: "Windows/MacOS PC Engine",
          },
          null,
          2,
        ),
      );

      writeDraftFile(
        "draft.extra",
        JSON.stringify(
          {
            client_os: "win",
            author: "AI Video Factory Pro",
            sync_time: Math.floor(Date.now() / 1000),
          },
          null,
          2,
        ),
      );

      writeDraftFile(
        "draft_agency_config.json",
        JSON.stringify(
          {
            agency_id: "",
            org_id: "",
            user_id: "AI_Studio_Power_User",
          },
          null,
          2,
        ),
      );

      writeDraftFile(
        "draft_biz_config.json",
        JSON.stringify(
          {
            commercial_use: false,
            music_copyright_check: true,
          },
          null,
          2,
        ),
      );

      const draftMetaInfoObj = {
        draft_id: activeFolderUuid,
        draft_name: project.name || "AI_Video_Draft",
        draft_type: "video",
        create_time: Date.now(),
        modify_time: Date.now(),
        draft_duration: totalDurationUs,
        tm_draft_modified: Math.floor(Date.now() / 1000),
        draft_cover_path: "draft_cover.jpg",
        draft_fold_path: "",
      };
      writeDraftFile(
        "draft_meta_info.json",
        JSON.stringify(draftMetaInfoObj, null, 2),
      );

      writeDraftFile(
        "draft_settings",
        JSON.stringify(
          {
            project_setting: {
              fps: 30,
              ratio: "16:9",
              width: 1920,
              height: 1080,
            },
            export_setting: {
              resolution: "1080p",
              fps: 30,
              rate_control: "vbr",
              bit_rate: 8000,
            },
          },
          null,
          2,
        ),
      );

      writeDraftFile(
        "draft_virtual_store.json",
        JSON.stringify(
          {
            cache_items: [],
            local_res_map: [],
          },
          null,
          2,
        ),
      );

      writeDraftFile(
        "key_value.json",
        JSON.stringify(
          {
            draft_opened_count: 1,
            last_open_time: Math.floor(Date.now() / 1000),
          },
          null,
          2,
        ),
      );

      writeDraftFile(
        "performance_opt_info.json",
        JSON.stringify(
          {
            enable_proxy: false,
            render_quality: 100,
          },
          null,
          2,
        ),
      );

      writeDraftFile(
        "template-2.tmp",
        `[AI VIDEO GENERATED TEMPLATE FILE]\nDate: ${new Date().toISOString()}\nProject: ${project.name}`,
      );

      writeDraftFile(
        "timeline_layout.json",
        JSON.stringify(
          {
            track_scale: 1.0,
            timeline_scroll_x: 0.0,
            ruler_offset: 0,
          },
          null,
          2,
        ),
      );

      const content = await zip.generateAsync({ type: "blob" });

      const fileName = `${project.name.replace(/\s+/g, "_")}_CapCut_Project_Bundle.zip`;
      const url = window.URL.createObjectURL(content);
      const dlAnchorElem = document.createElement("a");
      dlAnchorElem.setAttribute("href", url);
      dlAnchorElem.setAttribute("download", fileName);
      dlAnchorElem.click();

      setTimeout(() => window.URL.revokeObjectURL(url), 100);

      const successMsg =
        t.Package_ZIP_created_succe || "Đã đóng gói dự án thành công.";
      setInfoMsg(successMsg);
      console.log(`[Hệ thống] ✅ Thành công: ${successMsg}`);
    } catch (zipError: any) {
      logger.error("CAPCUT_ZIP_GEN_ERROR", zipError);
      setInfoMsg(t.Error_generating_template);
    } finally {
      setLoadingExportType(null);
    }
  };

  const handleDownloadSRT = async () => {
    logAction("handleDownloadSRT");
    setLoadingExportType(EXPORT_TYPES.SRT);
    await new Promise(r => setTimeout(r, 800));
    try {
      let srt = "";
      if (project.storyboard && project.storyboard.length > 0) {
        project.storyboard.forEach((scene, index) => {
          const formatToSRTTime = (timeStr: string) => {
            if (!timeStr) return "00:00:00,000";
            const parts = timeStr.split(":");
            const m = parseInt(parts[0], 10) || 0;
            const s = parseInt(parts[1], 10) || 0;
            return `00:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")},000`;
          };
          const start = formatToSRTTime(scene.startTime);
          const end = formatToSRTTime(scene.endTime);
          const text = scene.subtitle || scene.script || "";
          srt += `${index + 1}\n${start} --> ${end}\n${text}\n\n`;
        });
      } else {
        srt = "1\n00:00:00,000 --> 00:00:10,000\nNo subtitle built yet.";
      }

      const dataStr = "data:text/plain;charset=utf-8," + encodeURIComponent(srt);
      const dlAnchorElem = document.createElement("a");
      dlAnchorElem.setAttribute("href", dataStr);
      dlAnchorElem.setAttribute(
        "download",
        `${project.name.replace(/\s+/g, "_")}_subtitles.srt`,
      );
      dlAnchorElem.click();
      console.log(`[Hệ thống] ✅ Thành công: Đã tải xuống file phụ đề .SRT.`);
    } finally {
      setLoadingExportType(null);
    }
  };

  const handleDownloadCapcutLink = async () => {
    logAction("handleDownloadCapcutLink");
    setLoadingExportType(EXPORT_TYPES.CAPCUT);
    await new Promise(r => setTimeout(r, 800));
    try {
      const sceneRanges = getSceneTimeRanges(project.storyboard || []);
      const capcutSchema = {
        platform: "CapCut Desktop PRO",
        version: "4.8.1",
        timeline: sceneRanges.map((sc) => ({
          trackId: sc.id,
          duration_ms: sc.duration * 1000,
          start_ms: sc.start * 1000,
          end_ms: sc.end * 1000,
          text_caption: sc.subtitle,
          audio_narration: project.voiceConfig?.provider || "edge",
          visual_preset: {
            asset_path: sc.assetName || "Image_Placeholder.jpg",
            motion_effect: sc.cameraMotion,
            transition_effect: sc.transition,
          },
        })),
      };
      const dataStr =
        "data:text/json;charset=utf-8," +
        encodeURIComponent(JSON.stringify(capcutSchema, null, 2));
      const dlAnchorElem = document.createElement("a");
      dlAnchorElem.setAttribute("href", dataStr);
      dlAnchorElem.setAttribute(
        "download",
        `${project.name.replace(/\s+/g, "_")}_CapCut_Desktop.json`,
      );
      dlAnchorElem.click();
      console.log(
        `[Hệ thống] ✅ Thành công: Đã tải xuống file liên kết CapCut Desktop.`,
      );
    } finally {
      setLoadingExportType(null);
    }
  };

  const handleDownloadPremiereXML = async () => {
    logAction("handleDownloadPremiereXML");
    setLoadingExportType(EXPORT_TYPES.PREMIERE);
    await new Promise(r => setTimeout(r, 800));
    try {
      const sceneRanges = getSceneTimeRanges(project.storyboard || []);
      const totalSecs =
        sceneRanges.length > 0 ? sceneRanges[sceneRanges.length - 1].end : 0;
      const xml = `<?xml version="1.0"encoding="UTF-8"?>
<!DOCTYPE xmeml>
<xmeml version="4">
 <sequence id="sequence-1">
 <name>${project.name} - AI Video Factory</name>
 <duration>${Math.round(totalSecs * 24)}</duration>
 <rate><timebase>24</timebase></rate>
 <media>
 <video>
 <track>
 ${sceneRanges
          .map(
            (sc) => `
 <clipitem id="clip-${sc.id}">
 <name>${sc.assetName || "Image_" + sc.id}</name>
 <duration>${Math.round(sc.duration * 24)}</duration>
 <start>${Math.round(sc.start * 24)}</start>
 <end>${Math.round(sc.end * 24)}</end>
 <effect>
 <name>${sc.cameraMotion}</name>
 </effect>
 </clipitem>`,
          )
          .join("")}
 </track>
 </video>
 </media>
 </sequence>
</xmeml>`;
      const dataStr = "data:text/xml;charset=utf-8," + encodeURIComponent(xml);
      const dlAnchorElem = document.createElement("a");
      dlAnchorElem.setAttribute("href", dataStr);
      dlAnchorElem.setAttribute(
        "download",
        `${project.name.replace(/\s+/g, "_")}_Premiere_Pro.xml`,
      );
      dlAnchorElem.click();
      console.log(
        `[Hệ thống] ✅ Thành công: Đã tải xuống file Premiere Pro XML.`,
      );
    } finally {
      setLoadingExportType(null);
    }
  };
  return {
    t,
    project,
    setProject,
    currentStep,
    setCurrentStep,
    leftSidebarOpen,
    setLeftSidebarOpen,
    rightSidebarOpen,
    setRightSidebarOpen,
    loading,
    setLoading,
    isVoiceDialogOpen,
    setIsVoiceDialogOpen,
    loadingStates,
    setLoadingStates,
    errorMsg,
    setErrorMsg,
    infoMsg,
    setInfoMsg,
    hooksDraft,
    setHooksDraft,
    hookStrategy,
    setHookStrategy,
    hookDuration,
    setHookDuration,
    hookCount,
    setHookCount,
    hookPosition,
    setHookPosition,
    activeSceneId,
    setActiveSceneId,
    sceneEditScript,
    setSceneEditScript,
    sceneEditSubtitle,
    setSceneEditSubtitle,
    sceneEditPrompt,
    setSceneEditPrompt,
    sceneEditMotion,
    setSceneEditMotion,
    sceneEditFx,
    setSceneEditFx,
    sceneEditTransition,
    setSceneEditTransition,
    isDeletingImage,
    isUploadingImage,
    promptSetting,
    setPromptSetting,
    promptTime,
    setPromptTime,
    promptCharacter,
    setPromptCharacter,
    promptCostume,
    setPromptCostume,
    promptCameraAngle,
    setPromptCameraAngle,
    isGeneratingDetailedPrompt,
    setIsGeneratingDetailedPrompt,
    showPromptGeneratorPanel,
    setShowPromptGeneratorPanel,
    activeSlideIndices,
    setActiveSlideIndices,
    copiedAll,
    setCopiedAll,
    showGlobalConfig,
    setShowGlobalConfig,
    showAdvancedVisualConfig,
    setShowAdvancedVisualConfig,
    bulkUploadWarning,
    setBulkUploadWarning,
    isBatchGenerating,
    setIsBatchGenerating,
    isCancellingBatch,
    setIsCancellingBatch,
    batchProgressMsg,
    setBatchProgressMsg,
    zoomedImage,
    setZoomedImage,
    storyboardPage,
    setStoryboardPage,
    scenesPerPage,
    paginatedStoryboard,
    getMotionLabel,
    sandboxConfig,
    setSandboxConfig,
    systemLogs,
    setSystemLogs,
    showLogsModal,
    setShowLogsModal,
    ttsAudioUrl,
    setTtsAudioUrl,
    ttsAudioBytes,
    setTtsAudioBytes,
    alignmentsLog,
    setAlignmentsLog,
    bulkVoiceStatus,
    setBulkVoiceStatus,
    isPlayingTts,
    setIsPlayingTts,
    audioPreviewRef,
    voicePlayerSectionRef,
    systemVoices,
    setSystemVoices,
    voiceDropdownOpen,
    setVoiceDropdownOpen,
    handleCloseVoiceModal,
    voiceSearch,
    setVoiceSearch,
    voiceTypeFilter,
    setVoiceTypeFilter,
    voiceHealth,
    setVoiceHealth,
    voiceLangFilter,
    setVoiceLangFilter,
    selectedGenderFilter,
    setSelectedGenderFilter,
    playingVoiceURI,
    setPlayingVoiceURI,
    voiceAudioDuration,
    setVoiceAudioDuration,
    storyboardSourceMode,
    setStoryboardSourceMode,
    isAudioDragging,
    setIsAudioDragging,
    step2AudioRef,
    step2IsPlaying,
    setStep2IsPlaying,
    step2CurrentTime,
    setStep2CurrentTime,
    step2Duration,
    setStep2Duration,
    step2IsSimulatedPlaying,
    setStep2IsSimulatedPlaying,
    step2SimulatedCurrentTime,
    setStep2SimulatedCurrentTime,
    audioCurrentTime,
    setAudioCurrentTime,
    audioDurationState,
    setAudioDurationState,
    isPlayingRealAudio,
    setIsPlayingRealAudio,
    audioVolume,
    setAudioVolume,
    simulatedCurrentTime,
    setSimulatedCurrentTime,
    isOfflineRendering,
    setIsOfflineRendering,
    offlineRenderProgress,
    setOfflineRenderProgress,
    loadingExportType,
    setLoadingExportType,
    renderedVideoBlob,
    setRenderedVideoBlob,
    createSpeechUtterance,
    playVoicePreview,
    isPlayingSim,
    setIsPlayingSim,
    currentSimTime,
    setCurrentSimTime,
    simActiveScene,
    setSimActiveScene,
    simTimerRef,
    simAudioRef,
    lastProjectIdRef,
    trackOperationCost,
    handleProcessInputAndConfig,
    handleTriggerStoryboardSplit,
    handleRenderSceneImage,
    handleUploadSceneImage,
    handleCopyPrompt,
    handleGenerateHooks,
    handleCopyHook,
    handleCopyAllPrompts,
    handleReferenceImagesUpload,
    handleExtractStyle,
    handleApplyStyleToScenes,
    handleOptimizeAllPrompts,
    handleBulkUploadImages,
    handlePrevSlide,
    handleThumbnailReferenceImagesUpload,
    handleExtractThumbnailStyle,
    handleNextSlide,
    handleDeleteSceneImage,
    handleDeleteAllSceneImages,
    handleBatchGenerateAllImages,
    handleCancelBatchGenerate,
    openSceneModal,
    handleGenerateDetailedPrompt,
    handleSaveSceneEdits,
    handleTriggerAssetAndThumbnail,
    handleRenderThumbnailImage,
    handleDownloadVoice,
    handleRegenerateUnifiedVoice,
    handleTriggerVoiceGenerate,
    handleTriggerAllSceneVoices,
    handleTriggerStoryboardAndVoices,
    handleProcessExternalAudio,
    handleTriggerSEOBoost,
    onSaveProject,
    handleOpenExportCenter,
    handleOfflineRenderWebM,
    startPlaybackSim,
    startTimerBasedSim,
    stopPlaybackSim,
    renderFallbackSceneImage,
    getSceneImageUrl,
    handleDownloadJSONProject,
    handleDownloadSRT,
    handleDownloadCapcutLink,
    handleDownloadPremiereXML,
    handleAnalyzeCharacter,
    handleCharacterImagesUpload,
    handleExtractCharacter,
    handleApplyCharacterToScenes,
    theme,
    currentLang,
    handleNextStep,
    handlePrevStep,
    getVoiceGender,
    isPremiumVoice,
    activeCloudPreviewAudio,
    audioRef,
    videoRef,
    simVideoRef,
    workspaceRef,
    costTracker,
    setCostTracker,
    credits,
    setCredits,
    favoriteStyles,
    setFavoriteStyles,
    showFavStyles,
    setShowFavStyles,
    handleAddFavoriteStyle,
    handleDeleteFavoriteStyle,
    handleSaveEditStyle,
    handleSaveCurrentStyle,
    handleApplyFavoriteStyle,
    favoriteVoices,
    showFavVoices,
    setShowFavVoices,
    handleAddFavoriteVoice,
    handleDeleteFavoriteVoice,
    handleSaveEditVoice,
    handleToggleFavoriteVoice,
  };
}
export type PipelineWizardState = ReturnType<typeof usePipelineWizard>;
