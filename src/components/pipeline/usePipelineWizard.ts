import { StoryboardSourceMode } from "../../constants";
import { base64ToArrayBuffer, blobToBase64 } from "../../lib/fileUtils.js";
import { PipelineConstants } from "../../constants/pipelineConstants";
import { logger, subscribeToLogs } from "../../utils/logger";
import { jsonUtils } from "../../lib/json";
import { storageUtils } from '../../lib/storage';
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import _ from 'lodash';

import { formatTimeHelper } from "../../utils/helpers";
import { translations } from "../../lib/lang";

import { APP_LOCALES, DEFAULT_PROVIDER, API_QUERY_PARAMS, API_ROUTES, REFACTOR_CONSTANTS, SecurityConstants, VOICE_GENDER, MEDIA_MIX_CONFIG, UI_MESSAGE_DURATION, PIPELINE_CLIENT_ERRORS, PRODUCTION_AUDIO_CONFIG, normalizeGenreValue } from "../../constants";
import { setTemporaryState } from "./pipeline-utils";
import { fetchSystemApi, formatRoundedTime, getVoiceGender, getVoiceModifiers, isPremiumVoice, isProjectContentEqual, safeFetchJsonWithAuth, safeResponseJson } from "./pipeline-business-utils";
import { LOADING_KEYS } from "../../constants/loading";
import { ConsoleLogType, EXPORT_TYPES, LogEvent } from "../../constants/enums";
import { CONSOLE_LOG_IGNORED_MESSAGES, LOG_SUCCESS_KEYWORDS, LOG_PENDING_KEYWORDS, LOG_WARN_KEYWORDS, LOG_ERROR_KEYWORDS, VITE_CONNECTED_KEYWORD, VITE_CONNECTION_LOST_KEYWORDS, VITE_FAILED_RELOAD_KEYWORD, VITE_HOT_UPDATE_KEYWORDS } from "../../constants/data";
import { APP_TEXTS, AUDIO_MIME_TYPE, BLOB_PREFIX, RESTORE_SCENE_BLOB_ERR, RESTORE_BLOB_ERR, COMMON_STRINGS, EXTERNAL_AUDIO_TEXTS, ERROR_MESSAGES, VITE_HMR_LOGS, AUTO_GENERATE_TEXTS } from "../../constants/texts";
import { VideoProject, HookVersion, StoryboardScene, ThumbnailItem, WizardStep, ImageGeneratorEngine, ProjectLanguage, HookPosition, ImageGenerationMode, GenerateType, AudioType, Gender, StyleReferencePurpose } from "../../types";
import { applyAudioEffects, cleanScriptText } from "../../lib/audioProcessor";
import { getSceneTimeRanges } from "../../lib/videoRenderer";
import { safeSystemFetch, logSystemAction, randomDelay, getBatchDelayMs } from "../../lib/shared-utils";
import { WHITESPACE_REGEX } from "../../constants/regexes";
import { CAPCUT_CONFIG } from "../../constants/capcut";

import { delayAsync } from "../../lib/shared-utils.js";
import { applyVoiceSelection } from "../../lib/voiceRouting";
import { formatUserFacingLog } from "../../lib/userLogFormatter";
import { fetchVoiceCatalog } from "../../services/voiceCatalogService";
import { createProjectImageUrl, generateProjectImages, hasSceneAsset, resolveSceneGenerateType, selectVideoSceneIds, type ProjectImageResult } from "../../services/projectImageGenerationService";
import { createThumbnailGenerationPrompt, resolveThumbnailReferenceImages } from "../../services/thumbnailPromptService";
import { acceptGeneratedThumbnail } from "../../services/thumbnailQualityPipelineService";
import { createCharacterIdentityDescription, createSceneGenerationContext } from "../../services/sceneReferenceService";
import { appendImagePromptAspectRatio } from "../../services/imagePromptQualityService";
import { compileImagePrompt } from "../../services/imagePromptCompilerService";
import { resolveStylePreset } from "../../constants/stylePresets";
import { hasStyleContaminatedCharacterLibrary, normalizeCharacterLibrary } from "../../services/visualContinuityService";
import { createSceneContinuityKey, createThumbnailContinuityKey } from "../../services/imageGenerationContinuityService";
import { clearBlockedAudioSource, hasProductionAudioSource, isBlockedAudioSource, isProductionAudioSource } from "../../services/productionAudioService";
import { createThumbnailStyleDirective } from "../../services/styleReferenceService";

let activePreviewToken = 0;
let activeCloudPreviewAudio: any = null;
let handleNextStep = () => { };
let handlePrevStep = () => { };
let audioRef: any = null;
let videoRef: any = null;
let simVideoRef: any = null;
let workspaceRef: any = null;

export function usePipelineWizard(props: any) {
  const { theme, currentLang, project: initialProject, onSaveProject, costTracker, setCostTracker, credits, setCredits } = props;
  const t = translations[currentLang];

  const logAction = (actionName: string) => {
    logSystemAction(actionName);
  };

  const normalizedInitialProject = useMemo(() => {
    if (!initialProject) return initialProject;
    return {
      ...initialProject,
      voiceConfig: clearBlockedAudioSource(_.defaultTo(initialProject.voiceConfig, PipelineConstants.DEFAULT_VOICE_CONFIG)),
      input: _.defaultTo(initialProject.input, PipelineConstants.DEFAULT_PROJECT_INPUT),
      config: {
        ..._.defaultTo(initialProject.config, PipelineConstants.DEFAULT_PROJECT_CONFIG),
        genre: normalizeGenreValue(initialProject.config?.genre),
      },
      hookConfig: _.defaultTo(initialProject.hookConfig, PipelineConstants.DEFAULT_HOOK_CONFIG),
      visualConfig: _.defaultTo(initialProject.visualConfig, PipelineConstants.DEFAULT_VISUAL_CONFIG),
    };
  }, [initialProject]);

  const [project, setProject] = useState<VideoProject>(normalizedInitialProject);

  useEffect(() => {
    if (normalizedInitialProject) {
      setProject((prev) => {
        if (!prev || prev.id !== normalizedInitialProject.id) return normalizedInitialProject;

        const isServerUpdate = normalizedInitialProject.updatedAt !== prev.updatedAt;
        if (isServerUpdate) {
          return prev;
        }
        const isTimingLogChanged = _.some([prev.voiceConfig?.timingLog !== normalizedInitialProject.voiceConfig?.timingLog], Boolean);

        let mergedStoryboard = _.defaultTo(prev.storyboard, []);
        if (_.some([isServerUpdate, !prev.storyboard, _.isEmpty(prev?.storyboard)], Boolean)) {
          mergedStoryboard = _.defaultTo(normalizedInitialProject.storyboard, []);
        } else if (isTimingLogChanged) {
          mergedStoryboard = prev.storyboard;
        } else {
          mergedStoryboard = _.defaultTo(prev.storyboard, []).map((localScene) => {
            if (localScene.assetUrl === REFACTOR_CONSTANTS.VD_EMPTY_STRING) return localScene;
            const serverScene = _.find(normalizedInitialProject.storyboard, (s) => _.isEqual(s.id, localScene.id));
            return serverScene?.assetUrl?.startsWith(COMMON_STRINGS.SLASH_ASSETS_SLASH)
              ? {
                ...localScene,
                assetUrl: serverScene.assetUrl,
                assetUrls: _.defaultTo(serverScene.assetUrls, [serverScene.assetUrl]),
              }
              : localScene;
          });
        }

        let mergedThumbnails = _.defaultTo(prev.thumbnails, []);
        if (_.some([isServerUpdate, !prev.thumbnails, _.isEmpty(prev?.thumbnails)], Boolean)) {
          mergedThumbnails = _.defaultTo(normalizedInitialProject.thumbnails, []);
        } else {
          mergedThumbnails = _.defaultTo(prev.thumbnails, []).map((localThumb) => {
            const serverThumb = _.find(normalizedInitialProject.thumbnails, (t) => _.isEqual(t.id, localThumb.id));
            return serverThumb?.imageUrl?.startsWith(COMMON_STRINGS.SLASH_ASSETS_SLASH) ? { ...localThumb, imageUrl: serverThumb.imageUrl } : localThumb;
          });
        }

        const shouldUpdateVoiceConfig = normalizedInitialProject.voiceConfig ? _.some(["audioUrl", "audioBase64", "timingLog"], (key) => prev.voiceConfig?.[key as any] !== normalizedInitialProject.voiceConfig?.[key as any]) : false;

        const syncField = (key: keyof VideoProject, fallback: any = undefined, checkEmptyArray = false) => {
          const serverVal = normalizedInitialProject[key];
          const localVal = prev[key];
          const isEmpty = checkEmptyArray ? !(localVal as any)?.length : !localVal;
          return isServerUpdate || isEmpty ? _.defaultTo(serverVal, fallback) : localVal;
        };

        const voiceConfig = isServerUpdate
          ? _.defaultTo(normalizedInitialProject.voiceConfig, prev.voiceConfig)
          : _.every([!isTimingLogChanged, shouldUpdateVoiceConfig, !!normalizedInitialProject.voiceConfig], Boolean)
            ? {
              ...(_.defaultTo(prev.voiceConfig, {})),
              audioUrl: normalizedInitialProject.voiceConfig.audioUrl,
              audioBase64: normalizedInitialProject.voiceConfig.audioBase64,
              timingLog: _.defaultTo(normalizedInitialProject.voiceConfig.timingLog, prev.voiceConfig?.timingLog),
            }
            : prev.voiceConfig;

        const scriptRewritten = syncField("scriptRewritten", "");
        const chapters = syncField("chapters", [], true);
        const seoConfig = syncField("seoConfig");
        const seo = syncField("seo");
        const assets = syncField("assets", [], true);

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
          [prev.currentStep, normalizedInitialProject.currentStep],
          [prev.creditsUsed, normalizedInitialProject.creditsUsed],
        ];
        const hasChanges = _.some(compareItems, ([a, b, isJson]) => (isJson ? !_.isEqual(a, b) : a !== b));

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
          currentStep: normalizedInitialProject.currentStep,
          creditsUsed: normalizedInitialProject.creditsUsed,
        };
      });
    }
  }, [normalizedInitialProject]);

  const [currentStep, setCurrentStep] = useState<WizardStep>(() => {
    return (initialProject as any).currentStep !== undefined ? (initialProject as any).currentStep : WizardStep.SourceInput;
  });

  const [leftSidebarOpen, setLeftSidebarOpen] = useState<boolean>(false);

  const [rightSidebarOpen, setRightSidebarOpen] = useState<boolean>(false);

  const [loading, setLoading] = useState(false);

  const [isVoiceDialogOpen, setIsVoiceDialogOpen] = useState(false);

  const selectVoiceForProject = useCallback((voice: any) => {
    const updatedProject = applyVoiceSelection(project, {
        voiceURI: _.get(voice, REFACTOR_CONSTANTS.VD_VOICE_ID_KEY),
        voiceName: _.get(voice, REFACTOR_CONSTANTS.VOICE_CATALOG_NAME_PATH),
        previewUrl: _.get(voice, REFACTOR_CONSTANTS.VOICE_CATALOG_PREVIEW_PATH),
        provider: _.get(
          voice,
          REFACTOR_CONSTANTS.VOICE_CATALOG_PROVIDER_PATH,
          _.get(project, REFACTOR_CONSTANTS.VOICE_CONFIG_PROVIDER_PATH),
        ),
        gender: _.isEqual(
          _.toLower(_.get(voice, REFACTOR_CONSTANTS.VOICE_CATALOG_GENDER_PATH)),
          VOICE_GENDER.MALE,
        )
          ? Gender.Male
          : Gender.Female,
    });
    setProject(updatedProject);
    void onSaveProject(updatedProject, true);
    setIsVoiceDialogOpen(false);
  }, [project, onSaveProject]);

  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

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
  const [sceneEditTextAllowed, setSceneEditTextAllowed] = useState(false);

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
      const newVal = typeof val === "function" ? val(currentVal) : val;
      return {
        ...prev,
        [LOADING_KEYS.GENERATE_DETAILED_PROMPT_PREFIX + activeSceneId]: newVal,
      };
    });
  };

  const [isDeletingImage, setIsDeletingImage] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const [showPromptGeneratorPanel, setShowPromptGeneratorPanel] = useState(false);

  const [activeSlideIndices, setActiveSlideIndices] = useState<Record<string, number>>({});

  const [copiedAll, setCopiedAll] = useState(false);

  const [showGlobalConfig, setShowGlobalConfig] = useState(false);

  const [showAdvancedVisualConfig, setShowAdvancedVisualConfig] = useState(false);

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
      const stored = storageUtils.get(PipelineConstants.STORAGE_KEYS.FAVORITE_STYLES);
      setFavoriteStyles(
        jsonUtils.safeParse<any[]>(stored, [
          {
            id: REFACTOR_CONSTANTS.DEFAULT_FAVORITE_STYLE_ID,
              name: REFACTOR_CONSTANTS.DEFAULT_FAVORITE_STYLE_NAME,
              prompt: REFACTOR_CONSTANTS.DEFAULT_FAVORITE_STYLE_PROMPT,
          },
        ])
      );
    } catch (e) {
      logger.error(REFACTOR_CONSTANTS.LOG_ERROR_GENERAL, e);
    }
  }, []);

  const saveFavoriteStyles = (list: any[]) => {
    setFavoriteStyles(list);
    storageUtils.set(PipelineConstants.STORAGE_KEYS.FAVORITE_STYLES, jsonUtils.safeStringify(list));
  };

  const handleAddFavoriteStyle = (name: string, promptText: string) => {
    if (!name.trim() || !promptText.trim()) return;
    saveFavoriteStyles([
      ...favoriteStyles,
      {
        id: `style_${Date.now()}`,
        name: name.trim(),
        prompt: promptText.trim(),
      },
    ]);
    setTemporaryState(setInfoMsg, t.saveStyleSuccess, REFACTOR_CONSTANTS.VD_EMPTY_STRING, UI_MESSAGE_DURATION.STANDARD_MS);
  };

  const handleDeleteFavoriteStyle = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    saveFavoriteStyles(_.filter(favoriteStyles, (item) => !_.isEqual(item.id, id)));
  };

  const handleSaveEditStyle = (id: string, name: string, promptText: string) => {
    if (!name.trim() || !promptText.trim()) return;
    saveFavoriteStyles(favoriteStyles.map((item) => (item.id === id ? { ...item, name: name.trim(), prompt: promptText.trim() } : item)));
    setTemporaryState(setInfoMsg, t.updateStyleSuccess, REFACTOR_CONSTANTS.VD_EMPTY_STRING, UI_MESSAGE_DURATION.STANDARD_MS);
  };

  const handleSaveCurrentStyle = () => {
    const curStyle = project.visualConfig?.referencePrompt;
    if (!curStyle) return;
    if (_.some(favoriteStyles, (s) => _.isEqual(s.prompt, curStyle))) {
      setTemporaryState(setInfoMsg, t.saveStyleSuccess, REFACTOR_CONSTANTS.VD_EMPTY_STRING, UI_MESSAGE_DURATION.STANDARD_MS);
      return;
    }
    saveFavoriteStyles([
      ...favoriteStyles,
      {
        id: `style_${Date.now()}`,
        name: curStyle.substring(0, 15) + "...",
        prompt: curStyle,
      },
    ]);
    setTemporaryState(setInfoMsg, t.saveStyleSuccess, REFACTOR_CONSTANTS.VD_EMPTY_STRING, UI_MESSAGE_DURATION.STANDARD_MS);
  };

  const handleApplyFavoriteStyle = (promptText: string) => {
    setProject((prev) => ({
      ...prev,
      visualConfig: { ...prev.visualConfig, referencePrompt: promptText },
    }));
    setTemporaryState(setInfoMsg, t.applyStyleSuccess, REFACTOR_CONSTANTS.VD_EMPTY_STRING, UI_MESSAGE_DURATION.STANDARD_MS);
  };

  const [favoriteVoices, setFavoriteVoices] = useState<any[]>([]);
  const [showFavVoices, setShowFavVoices] = useState(false);

  useEffect(() => {
    try {
      const stored = storageUtils.get(PipelineConstants.STORAGE_KEYS.FAVORITE_VOICES);
      setFavoriteVoices(
        jsonUtils.safeParse<any[]>(stored, [
          {
            id: REFACTOR_CONSTANTS.DEFAULT_FAVORITE_VOICE_ID,
              name: REFACTOR_CONSTANTS.DEFAULT_FAVORITE_VOICE_NAME,
              voiceURI: REFACTOR_CONSTANTS.DEFAULT_FAVORITE_VOICE_URI,
              channelName: REFACTOR_CONSTANTS.DEFAULT_FAVORITE_VOICE_CHANNEL,
          },
        ])
      );
    } catch (e) {
      logger.error(REFACTOR_CONSTANTS.LOG_ERROR_GENERAL, e);
    }
  }, []);

  const saveFavoriteVoices = (list: any[]) => {
    setFavoriteVoices(list);
    storageUtils.set(PipelineConstants.STORAGE_KEYS.FAVORITE_VOICES, jsonUtils.safeStringify(list));
  };

  const handleAddFavoriteVoice = (name: string, voiceURI: string, channelName?: string) => {
    if (!name.trim() || !voiceURI.trim()) return;
    saveFavoriteVoices([
      ...favoriteVoices,
      {
        id: `fav_${Date.now()}`,
        name: name.trim(),
        voiceURI: voiceURI.trim(),
        channelName: channelName?.trim() || "Custom",
      },
    ]);
    setTemporaryState(setInfoMsg, t.saveVoiceSuccess, REFACTOR_CONSTANTS.VD_EMPTY_STRING, UI_MESSAGE_DURATION.STANDARD_MS);
  };

  const handleDeleteFavoriteVoice = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    saveFavoriteVoices(_.filter(favoriteVoices, (item) => !_.isEqual(item.id, id)));
  };

  const handleSaveEditVoice = (id: string, name: string, voiceURI: string, channelName?: string) => {
    if (!name.trim() || !voiceURI.trim()) return;
    saveFavoriteVoices(
      favoriteVoices.map((item) =>
        item.id === id
          ? {
            ...item,
            name: name.trim(),
            voiceURI: voiceURI.trim(),
            channelName: channelName?.trim() || item.channelName,
          }
          : item,
      ),
    );
    setTemporaryState(setInfoMsg, t.updateVoiceSuccess, REFACTOR_CONSTANTS.VD_EMPTY_STRING, UI_MESSAGE_DURATION.STANDARD_MS);
  };

  const handleToggleFavoriteVoice = (voiceId: string, name: string, providerName?: string) => {
    const exists = _.some(favoriteVoices, (v) => _.isEqual(v.voiceURI, voiceId));
    if (exists) {
      saveFavoriteVoices(_.filter(favoriteVoices, (v) => !_.isEqual(v.voiceURI, voiceId)));
    } else {
      saveFavoriteVoices([
        ...favoriteVoices,
        {
          id: `fav_${Date.now()}`,
          name: name.trim(),
          voiceURI: voiceId.trim(),
          channelName: providerName || "Custom",
        },
      ]);
      setTemporaryState(setInfoMsg, t.saveVoiceSuccess, REFACTOR_CONSTANTS.VD_EMPTY_STRING, UI_MESSAGE_DURATION.STANDARD_MS);
    }
  };

  const [storyboardPage, setStoryboardPage] = useState(1);

  const scenesPerPage = 12;

  const paginatedStoryboard = useMemo(() => {
    return (project.storyboard || []).slice((storyboardPage - 1) * scenesPerPage, storyboardPage * scenesPerPage);
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
      const saved = storageUtils.get(PipelineConstants.STORAGE_KEYS.API_SANDBOX_CONFIG);
      if (saved && saved.trim() !== "undefined" && saved.trim() !== "null" && saved.trim() !== "") {
        const parsed = jsonUtils.safeParse<any>(saved, null);
        if (parsed && typeof parsed === "object") {
          return parsed;
        }
      }
    } catch (e) {
      logger.error(REFACTOR_CONSTANTS.LOG_ERROR_LOADING_SANDBOX, e);
    }
    return {
      projectId: "",
      authToken: "",
      recaptchaToken: "",
      sessionId: "",
      imageModelName: REFACTOR_CONSTANTS.DEFAULT_IMAGE_MODEL_NAME,
    };
  });

  useEffect(() => {
    if (sandboxConfig && typeof sandboxConfig === "object") {
      const currentSaved = storageUtils.get(PipelineConstants.STORAGE_KEYS.API_SANDBOX_CONFIG);
      const newStr = jsonUtils.safeStringify(sandboxConfig);
      if (currentSaved !== newStr) {
        storageUtils.set(PipelineConstants.STORAGE_KEYS.API_SANDBOX_CONFIG, newStr);
      }
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
        const saved = storageUtils.get(PipelineConstants.STORAGE_KEYS.API_SANDBOX_CONFIG);
        if (saved && saved.trim() !== "undefined" && saved.trim() !== "null" && saved.trim() !== "") {
          const parsed = jsonUtils.safeParse<any>(saved, null);
          if (parsed && typeof parsed === "object") {
            setSandboxConfig((prev: any) => {
              if (_.isEqual(prev, parsed)) return prev;
              return parsed;
            });
          }
        }
      } catch (err) {
        logger.error("ERROR_SYNCING_SANDBOX", err);
      }
    };
    window.addEventListener("storage", syncConfig);
    return () => window.removeEventListener("storage", syncConfig);
  }, []);

  const [systemLogs, setSystemLogs] = useState<{ time: string; type: ConsoleLogType; msg: string }[]>(() => {
    try {
      const savedLogs = sessionStorage.getItem(REFACTOR_CONSTANTS.PIPELINE_SYSTEM_LOGS_KEY);
      if (savedLogs) return jsonUtils.safeParse<any[]>(savedLogs, []);
    } catch { }
    return [];
  });

  useEffect(() => {
    try {
      sessionStorage.setItem(REFACTOR_CONSTANTS.PIPELINE_SYSTEM_LOGS_KEY, jsonUtils.safeStringify(systemLogs));
    } catch (e: any) {
      if (_.isEqual(e.name, REFACTOR_CONSTANTS.STORAGE_QUOTA_ERROR_NAME)) {
        const reduced = _.slice(systemLogs, REFACTOR_CONSTANTS.SYSTEM_LOG_REDUCED_START);
        try {
          sessionStorage.setItem(REFACTOR_CONSTANTS.PIPELINE_SYSTEM_LOGS_KEY, jsonUtils.safeStringify(reduced));
        } catch { }
      }
    }
  }, [systemLogs]);

  const [showLogsModal, setShowLogsModal] = useState(false);

  useEffect(() => {
    const captureLog = (type: ConsoleLogType, args: unknown[]) => {
      try {
        const msg = _.join(
          _.map(args, (value) => (
            _.isObject(value)
              ? jsonUtils.safeStringify(value)
              : _.toString(value)
          )),
          REFACTOR_CONSTANTS.VD_BLANK,
        );
        if (_.some(CONSOLE_LOG_IGNORED_MESSAGES, (keyword) => _.includes(msg, keyword))) return;

        let processedMsg = msg;
        const msgLower = _.toLower(msg);

        const logsLang = _.includes([COMMON_STRINGS.VI, COMMON_STRINGS.EN], currentLang) ? currentLang : COMMON_STRINGS.VI;
        const logTexts = VITE_HMR_LOGS[logsLang as "vi" | "en"];

        if (_.some(VITE_CONNECTION_LOST_KEYWORDS, (keyword) => _.includes(msgLower, keyword))) {
          processedMsg = logTexts.SERVER_CONNECTION_LOST;
        } else if (_.includes(msgLower, VITE_FAILED_RELOAD_KEYWORD)) {
          processedMsg = logTexts.FAILED_RELOAD_GENERIC;
        } else if (_.includes(msgLower, VITE_CONNECTED_KEYWORD)) {
          processedMsg = logTexts.CONNECTED;
        } else if (_.some(VITE_HOT_UPDATE_KEYWORDS, (keyword) => _.includes(msgLower, keyword))) {
          processedMsg = logTexts.HOT_UPDATED;
        }

        processedMsg = formatUserFacingLog(processedMsg, currentLang);
        let enrichedType = type;
        const processedMsgLower = _.toLower(processedMsg);
        if (_.some(LOG_SUCCESS_KEYWORDS, (term) => _.includes(processedMsgLower, term))) enrichedType = ConsoleLogType.SUCCESS;
        else if (_.some(LOG_PENDING_KEYWORDS, (term) => _.includes(processedMsgLower, term))) enrichedType = ConsoleLogType.PENDING;
        else if (_.isEqual(type, ConsoleLogType.LOG) && _.some(LOG_WARN_KEYWORDS, (term) => _.includes(processedMsgLower, term))) enrichedType = ConsoleLogType.WARN;
        else if (_.isEqual(type, ConsoleLogType.LOG) && _.some(LOG_ERROR_KEYWORDS, (term) => _.includes(processedMsgLower, term))) enrichedType = ConsoleLogType.ERROR;

        const time = new Date().toLocaleTimeString();
        setTimeout(() => {
          setSystemLogs((prev) => _.slice(
            _.concat(prev, { time, type: enrichedType, msg: processedMsg }),
            REFACTOR_CONSTANTS.SYSTEM_LOG_LIMIT_START,
          ));
        }, REFACTOR_CONSTANTS.LOG_CAPTURE_DELAY_MS);
      } catch { }
    };

    return subscribeToLogs(captureLog);
  }, [currentLang]);

  const [ttsAudioUrl, setTtsAudioUrl] = useState<string | null>(null);

  const [ttsAudioBytes, setTtsAudioBytes] = useState<string | null>(null);

  const [alignmentsLog, setAlignmentsLog] = useState<string>("");

  const [bulkVoiceStatus, setBulkVoiceStatus] = useState<string>("");

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
    setPlayingVoiceURI(null);
    setVoiceDropdownOpen(false);
  };

  const [voiceSearch, setVoiceSearch] = useState("");

  const [voiceTypeFilter, setVoiceTypeFilter] = useState<"premium" | "local">("premium");

  const [voiceHealth, setVoiceHealth] = useState<Record<string, "ok" | "error">>({});

  const [voiceLangFilter, setVoiceLangFilter] = useState<"all" | "vi" | "en">("all");

  const [selectedGenderFilter, setSelectedGenderFilter] = useState<"all" | "male" | "female">("all");

  const [playingVoiceURI, setPlayingVoiceURI] = useState<string | null>(null);

  const [voiceAudioDuration, setVoiceAudioDuration] = useState<number | null>(null);

  const [storyboardSourceMode, setStoryboardSourceMode] = useState<StoryboardSourceMode>(() => {
    return (initialProject as any)?.storyboardSourceMode || StoryboardSourceMode.SCRIPT;
  });

  const [isAudioDragging, setIsAudioDragging] = useState(false);

  const step2AudioRef = useRef<HTMLAudioElement | null>(null);

  const [step2IsPlaying, setStep2IsPlaying] = useState(false);

  const [step2CurrentTime, setStep2CurrentTime] = useState(0);

  const [step2Duration, setStep2Duration] = useState(0);

  useEffect(() => {
    if (step2AudioRef.current) {
      step2AudioRef.current.pause();
    }
    setStep2IsPlaying(false);
    setStep2CurrentTime(0);
  }, [project.voiceConfig?.audioUrl]);

  const [audioCurrentTime, setAudioCurrentTime] = useState(0);

  const [audioDurationState, setAudioDurationState] = useState(0);

  const [isPlayingRealAudio, setIsPlayingRealAudio] = useState(false);

  const [audioVolume, setAudioVolume] = useState(1.0);

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
    if (isProductionAudioSource(ttsAudioUrl || undefined)) {
      const audio = new Audio(ttsAudioUrl);
      const onLoadedMetadata = () => {
        setVoiceAudioDuration(audio.duration);
      };
      audio.addEventListener("loadedmetadata", onLoadedMetadata);
      return () => {
        audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      };
    } else {
      setVoiceAudioDuration(null);
    }
  }, [ttsAudioUrl, project.scriptRewritten, project.config.duration]);

  useEffect(() => {
    setRenderedVideoBlob(null);
  }, [project.storyboard, project.voiceConfig?.audioUrl, project.voiceConfig?.speed, project.voiceConfig?.pitch, project.voiceConfig?.volume, project.scriptRewritten, ttsAudioUrl, activeSlideIndices]);

  const playVoicePreview = async (voiceURI: string, gender: string, lang: string, speed?: number, pitch?: number, previewUrl?: string) => {
    activePreviewToken = Date.now();
    const currentToken = activePreviewToken;

    if (activeCloudPreviewAudio) {
      activeCloudPreviewAudio.pause();
      activeCloudPreviewAudio.currentTime = 0;
      activeCloudPreviewAudio = null;
    }

    if (playingVoiceURI === voiceURI) {
      setPlayingVoiceURI(null);
      activePreviewToken = 0;
      return;
    }

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
    const sampleText = isVi ? "Xin chào, đây là âm thanh nghe thử của tôi." : "Hello, this is a quick audio preview of my voice.";

    const useCloudVoice = isPremiumVoice({ name: voiceURI, provider: project.voiceConfig.provider });

    const { finalSpeed, finalPitch } = getVoiceModifiers(voiceURI, speed || 1.0, pitch || 1.0);

    if (useCloudVoice) {
      try {
        const res = await fetchSystemApi(API_ROUTES.PIPELINE_VOICE, {
          text: sampleText,
          voiceURI: voiceURI,
          voice_id: voiceURI,
          provider: project.voiceConfig.provider,
          gender: gender,
          speed: finalSpeed,
          pitch: finalPitch,
          ...(_.startsWith(voiceURI, "vbee-") || _.includes(voiceURI, "vbee") ? { voice_ownership: "community" } : {}),
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
            blob = await applyAudioEffects(bytes.buffer.slice(0), finalSpeed, finalPitch, 1.0);
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

    if (activePreviewToken === currentToken) setPlayingVoiceURI(null);
  };

  useEffect(() => {
    let isActive = true;
    const params = new URLSearchParams();
    params.append(API_QUERY_PARAMS.PROVIDER, DEFAULT_PROVIDER);

    void fetchVoiceCatalog(params)
      .then((responseData) => {
        const voices = _.get(responseData, SecurityConstants.DATA_KEY);
        if (!_.every([
          isActive,
          _.get(responseData, SecurityConstants.SUCCESS_KEY),
          _.isArray(voices),
        ], Boolean)) return;

        const mappedVoices = _.map(voices, (voice) => {
          const voiceName = _.get(voice, REFACTOR_CONSTANTS.VOICE_CATALOG_NAME_PATH, SecurityConstants.EMPTY_STRING);
          const voiceGender = _.get(voice, REFACTOR_CONSTANTS.VOICE_CATALOG_GENDER_PATH, SecurityConstants.EMPTY_STRING);
          return {
            voiceURI: _.get(voice, REFACTOR_CONSTANTS.VD_VOICE_ID_KEY),
            name: _.isEmpty(voiceGender)
              ? voiceName
              : _.join([voiceName, voiceGender], REFACTOR_CONSTANTS.VOICE_CATALOG_NAME_SEPARATOR),
            lang: _.get(voice, REFACTOR_CONSTANTS.VOICE_CATALOG_LANGUAGE_PATH, APP_LOCALES.VI),
            localService: REFACTOR_CONSTANTS.VOICE_CATALOG_REMOTE_SERVICE,
            default: REFACTOR_CONSTANTS.VOICE_CATALOG_NOT_DEFAULT,
          };
        });
        setSystemVoices(mappedVoices);
      })
      .catch((error) => {
        if (isActive) logger.error(LogEvent.FAILED_LOAD_VOICES, error);
      });

    return () => {
      isActive = false;
    };
  }, []);

  const [isPlayingSim, setIsPlayingSim] = useState(false);

  const [currentSimTime, setCurrentSimTime] = useState(0);

  const [simActiveScene, setSimActiveScene] = useState<StoryboardScene | null>(null);

  const simAudioRef = useRef<HTMLAudioElement | null>(null);

  const isRestoringRef = useRef(false);

  useEffect(() => {
    if (isRestoringRef.current) {
      isRestoringRef.current = false;
      return;
    }

    if (isProjectContentEqual(project, normalizedInitialProject)) return;

    const timer = setTimeout(() => {
      onSaveProject(project);
    }, REFACTOR_CONSTANTS.SAVE_PROJECT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [project, normalizedInitialProject, onSaveProject]);

  useEffect(() => {
    if (isProductionAudioSource(project?.voiceConfig?.audioUrl)) {
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

      const isHookUnchanged =
        [
          [currentHookConfig.type, hookStrategy],
          [currentHookConfig.duration, hookDuration],
          [currentHookConfig.count, hookCount],
          [currentHookConfig.positions, hookPosition],
        ].every(([a, b]) => a === b) && _.isEqual(currentHookConfig.versions, hooksDraft);

      return isHookUnchanged
        ? prev
        : {
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
  const lastUpdatedAtRef = useRef<string | null>(null);
  const cancelBatchImageRef = useRef<boolean>(false);
  const imageCheckpointQueueRef = useRef<Promise<void>>(Promise.resolve());

  const persistImageCheckpoint = useCallback((checkpointProject: VideoProject): void => {
    const projectSnapshot = _.cloneDeep(checkpointProject);
    imageCheckpointQueueRef.current = imageCheckpointQueueRef.current
      .then(async () => {
        await onSaveProject(projectSnapshot, true);
      })
      .catch((error) => {
        logger.error(ERROR_MESSAGES.AUTO_SAVE_ERR, error);
      });
  }, [onSaveProject]);

  useEffect(() => {
    if (!initialProject) return;

    const isNewProject = lastProjectIdRef.current !== initialProject.id;
    const isServerUpdate = lastUpdatedAtRef.current && initialProject.updatedAt !== lastUpdatedAtRef.current;

    lastProjectIdRef.current = initialProject.id;
    lastUpdatedAtRef.current = initialProject.updatedAt;

    if (isNewProject || isServerUpdate) {
      if ((initialProject as any).currentStep !== undefined) {
        setCurrentStep((initialProject as any).currentStep);
      } else {
        setCurrentStep(WizardStep.SourceInput);
      }

      if ((initialProject as any).storyboardSourceMode) {
        setStoryboardSourceMode((initialProject as any).storyboardSourceMode);
      } else {
        setStoryboardSourceMode(StoryboardSourceMode.SCRIPT);
      }

      if (initialProject.hookConfig) {
        setHookStrategy(initialProject.hookConfig.type || "Auto");
        setHookDuration(initialProject.hookConfig.duration || 10);
        setHookCount(initialProject.hookConfig.count || 3);
        setHookPosition(initialProject.hookConfig.positions || HookPosition.Start);
        setHooksDraft(initialProject.hookConfig.versions || []);
      } else {
        setHookStrategy("Auto");
        setHookDuration(10);
        setHookCount(3);
        setHookPosition(HookPosition.Start);
        setHooksDraft([]);
      }

      let restoredVoiceConfig = initialProject.voiceConfig ? clearBlockedAudioSource({ ...initialProject.voiceConfig }) : undefined;
      let restoredTtsUrl: string | null = null;

      if (restoredVoiceConfig) {
        if (restoredVoiceConfig.audioUrl) {
          restoredTtsUrl = restoredVoiceConfig.audioUrl;
          if (restoredTtsUrl.startsWith(BLOB_PREFIX)) {
            if (restoredVoiceConfig.audioBase64) {
              try {
                const arr = base64ToArrayBuffer(restoredVoiceConfig.audioBase64);
                const blob = new Blob([arr], { type: AUDIO_MIME_TYPE });
                restoredTtsUrl = URL.createObjectURL(blob);
              } catch (e) {
                logger.error(RESTORE_BLOB_ERR, e);
                restoredTtsUrl = null;
              }
            } else {
              restoredTtsUrl = null;
            }
          }
          restoredVoiceConfig.audioUrl = restoredTtsUrl || undefined;
          setTtsAudioUrl(restoredTtsUrl);
        } else {
          setTtsAudioUrl(null);
        }

        if (restoredVoiceConfig.timingLog) {
          setAlignmentsLog(restoredVoiceConfig.timingLog);
        } else if (restoredVoiceConfig.subtitleFiles && restoredVoiceConfig.subtitleFiles.length > 0) {
          setAlignmentsLog(t.alignmentLoaded);
        } else {
          setAlignmentsLog("");
        }
      } else {
        setTtsAudioUrl(null);
        setAlignmentsLog("");
      }

      const restoredStoryboard = (initialProject.storyboard || []).map((scene) => {
        if (isBlockedAudioSource(scene.audioUrl)) return { ...scene, audioUrl: undefined };
        if (scene.audioUrl?.startsWith(BLOB_PREFIX)) {
          if (scene.audioBase64) {
            try {
              const arr = base64ToArrayBuffer(scene.audioBase64);
              const blob = new Blob([arr], { type: AUDIO_MIME_TYPE });
              return { ...scene, audioUrl: URL.createObjectURL(blob) };
            } catch (e) {
              logger.error(RESTORE_SCENE_BLOB_ERR, e);
            }
          }
          return { ...scene, audioUrl: undefined };
        }
        return scene;
      });

      const restoredProject: VideoProject = {
        ...initialProject,
        storyboard: restoredStoryboard,
        voiceConfig: restoredVoiceConfig || PipelineConstants.DEFAULT_VOICE_CONFIG,
        input: initialProject.input || PipelineConstants.DEFAULT_PROJECT_INPUT,
        config: initialProject.config || PipelineConstants.DEFAULT_PROJECT_CONFIG,
        hookConfig: initialProject.hookConfig || PipelineConstants.DEFAULT_HOOK_CONFIG,
        visualConfig: initialProject.visualConfig || PipelineConstants.DEFAULT_VISUAL_CONFIG,
      };

      isRestoringRef.current = true;
      setProject(restoredProject);
    }
  }, [initialProject]);

  useEffect(() => {
    if (isRestoringRef.current) {
      isRestoringRef.current = false;
    }
  }, [project?.id]);

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

      const { success, data, error } = await safeSystemFetch(API_ROUTES.PIPELINE_SCRIPT, payload);

      if (!success || data?.error || data?.warning) {
        throw new Error(error || data?.error || data?.warning || PIPELINE_CLIENT_ERRORS.REQUEST_REJECTED);
      }

      setProject((prev) => ({
        ...prev,
        scriptRewritten: data.rewrittenScript || "",
        factCheckNotes: data.factCheckNotes || "",
        chapters: data.chapters || [],
      }));

      const successMsg = t.Generation_completed_The_ || "Hoàn thành biên kịch.";
      setInfoMsg(successMsg);
      logger.info(`[Script] ✅ Thành công: ${successMsg}`);

      if (!data.cached) {
        trackOperationCost(10, 0.0005);
      }
      return data;
    } catch (e: any) {
      setErrorMsg(t.scriptPipelineError.replace("{error}", e.message));
    } finally {
      setLoadingStates((prev) => ({ ...prev, processInput: false }));
      setLoading(false);
    }
  };

  const handleTriggerStoryboardSplit = async (force = false, btnPosition = "top", isFromAutoGenerateAll = false, customScript?: string) => {
    logAction("handleTriggerStoryboardSplit");

    const isForce = force === true;
    if (project.storyboard && project.storyboard.length > 0 && !isForce) {
      setInfoMsg(t.Loaded_current_scenes_sto);
      return project.storyboard;
    }

    const scriptToSplit = customScript || project.scriptRewritten;
    if (!scriptToSplit) {
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
        rewrittenScript: scriptToSplit,
        chapters: project.chapters,
        config: {
          ...project.config,
          ...project.voiceConfig,
          visualStylePreset: project.visualConfig.stylePreset,
          aspectRatio: project.visualConfig.aspectRatio,
          imageQuality: project.visualConfig.imageQuality,
          characterConsistencyLevel: project.visualConfig.characterConsistencyLevel,
          contextConsistencyLevel: project.visualConfig.contextConsistencyLevel,
          negativePrompt: project.visualConfig.negativePrompt,
        },
        visualStyle: project.visualConfig.style || "Cinematic",
        referenceImages: project.visualConfig.referenceImages || [],
        referenceStyle: project.visualConfig.referencePrompt,
        referenceCharacters:
          project.visualConfig.characters && project.visualConfig.characters.length > 0
            ? project.visualConfig.characters.map((c) => ({
              name: c.name,
              prompt: c.prompt || c.description,
            }))
            : undefined,
        referenceCharacter: project.visualConfig.characterPrompt || undefined,
        visualDensity: project.visualConfig.density || 5,
        voiceDuration: storyboardSourceMode === StoryboardSourceMode.AUDIO ? voiceAudioDuration : null,
        targetDuration: project.config.targetDuration,
        sourceMode: storyboardSourceMode,
        bypassCache: isForce,
      };

      const { success, data, error } = await safeSystemFetch(API_ROUTES.PIPELINE_STORYBOARD, payload);

      if (!success || data?.error || data?.warning) {
        throw new Error(error || data?.error || data?.warning || PIPELINE_CLIENT_ERRORS.REQUEST_REJECTED);
      }

      if (data.scenes) {
        const updatedScenes = data.scenes.map((scene: any) => {
          return { ...scene, prompt: scene.prompt || "" };
        });

        let audioUrl = project.voiceConfig?.audioUrl;
        let audioBase64 = project.voiceConfig?.audioBase64;

        const hasVoiceSource = hasProductionAudioSource([audioBase64, audioUrl]);

        let finalScenes = updatedScenes;
        let syncLogText = "";

        if (hasVoiceSource) {
          const langKey = _.eq(currentLang, "en") ? "en" : "vi";
          const texts = EXTERNAL_AUDIO_TEXTS[langKey];
          setBulkVoiceStatus(t.aligningVoiceWithWhisper || texts.ALIGNING);
          try {
            const rawAudioBase64 = await getVoiceSourceBase64({ audioUrl, audioBase64 });
            if (!_.isEmpty(rawAudioBase64)) {
              finalScenes = await alignStoryboardVoice(updatedScenes, rawAudioBase64);

              const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
              let totalDuration = 10;
              try {
                const arrayBufferRaw = base64ToArrayBuffer(rawAudioBase64);
                const decoded = await audioCtx.decodeAudioData(arrayBufferRaw.slice(0));
                totalDuration = Math.max(3, decoded.duration);
              } catch (decodeErr) {
                logger.warn("FAILED_DECODE_AUDIO_DURATION", decodeErr);
              } finally {
                audioCtx.close();
              }

              syncLogText = texts.SYNC_COMPLETE.replace("{totalDuration}", totalDuration.toFixed(1));
              finalScenes.forEach((scene: any, idx: number) => {
                syncLogText += texts.SYNC_ITEM
                  .replace("{index}", (idx + 1).toString())
                  .replace("{startTime}", formatRoundedTime(scene.startTime))
                  .replace("{endTime}", formatRoundedTime(scene.endTime))
                  .replace("{duration}", Math.round(scene.duration || 0).toString())
                  .replace("{script}", (scene.script || scene.subtitle || "").substring(0, 35));
              });
            }
          } catch (alignErr: any) {
            const langKey = currentLang === "en" ? "en" : "vi";
            const texts = EXTERNAL_AUDIO_TEXTS[langKey];
            logger.error("STORYBOARD_ALIGN_VOICE_ERR", alignErr);
            setErrorMsg(texts.ALIGN_ERROR.replace("{error}", alignErr.message));
          }
        } else {
          finalScenes = updatedScenes.map((sc: any) => ({
            ...sc,
            duration: 0,
            startTime: "",
            endTime: "",
            _start: undefined,
            _end: undefined,
          }));
          syncLogText = t.syncLedgerSuccess.replace("{totalDuration}", "0.0");
        }

        setAlignmentsLog(syncLogText);

        const updatedProject = {
          ...project,
          storyboard: finalScenes,
          isRecreatingStoryboard: true,
          voiceConfig: {
            ...project.voiceConfig,
            audioUrl: audioUrl || "",
            audioBase64: audioBase64 || undefined,
            timingLog: syncLogText,
          },
        };

        setProject(updatedProject);
        setTimeout(() => {
          onSaveProject(updatedProject, true);
        }, 0);

        trackOperationCost(18, 0.0012);
        const successMsg = t.Storyboard_coordinates_fo;
        setInfoMsg(successMsg);
        logger.info(`[Storyboard] ✅ Thành công: ${successMsg}`);
        return finalScenes;
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
    requestedGenerateType?: GenerateType.Image | GenerateType.Video,
    rewriteBeforeGeneration = false,
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
      const sourceScene = _.find(project.storyboard, { id: sceneId });
      let plannedScene = sourceScene ? { ...sourceScene } : undefined;
      let generationCharacters = _.defaultTo(project.visualConfig.characters, []);
      let generationVisualBible = project.visualBible;
      const cleanStyle = resolveStylePreset(project.visualConfig.stylePreset || project.visualConfig.style).positivePrompt;

      if (rewriteBeforeGeneration && sourceScene) {
        if (hasStyleContaminatedCharacterLibrary(generationCharacters)) {
          const characterResult = await safeSystemFetch(API_ROUTES.PIPELINE_ANALYZE_CHARACTER, {
            script: project.scriptRewritten || _.join(_.map(project.storyboard, "script"), " "),
            visualStyle: cleanStyle,
          });
          if (!characterResult.success || !_.isArray(characterResult.data?.characters) || _.isEmpty(characterResult.data.characters)) {
            throw new Error(PIPELINE_CLIENT_ERRORS.CHARACTER_ANALYSIS_FAILED);
          }
          generationCharacters = normalizeCharacterLibrary(_.map(characterResult.data.characters, (character: any, index: number) => ({
            ...character,
            id: character.id || `char_${_.add(index, 1)}`,
            prompt: character.prompt || character.description,
            images: [],
            extracted: false,
          })));
        }

        const cleanVisualBible = {
          ...project.visualBible,
          colorPalette: "",
          characterSpecs: _.join(_.map(generationCharacters, character => `${character.name}: ${createCharacterIdentityDescription(character)}`), "\n"),
          landscapeSpecs: "",
          lightingMood: "",
          background: "",
          lineStyle: "",
          colorMode: "",
          shading: "",
          textPolicy: "No readable text unless the current scene explicitly requires it.",
          styleProfile: undefined,
          visualStyle: cleanStyle,
        };
        generationVisualBible = cleanVisualBible;
        const optimizeResult = await safeSystemFetch(API_ROUTES.PIPELINE_OPTIMIZE_PROMPTS, {
          storyboard: [{ ...sourceScene, prompt: "", generationPrompt: undefined }],
          visualConfig: { ...project.visualConfig, style: cleanStyle, referencePrompt: cleanStyle, characters: generationCharacters },
          visualBible: cleanVisualBible,
          aspectRatio: project.visualConfig.aspectRatio,
          language: project.config.language,
          bypassCache: true,
        });
        if (!optimizeResult.success || !_.first(optimizeResult.data?.storyboard) || !optimizeResult.data?.promptQa?.passed) {
          throw new Error(PIPELINE_CLIENT_ERRORS.PROMPT_GENERATION_FAILED);
        }
        plannedScene = _.first(optimizeResult.data.storyboard) as StoryboardScene;
        customPrompt = compileImagePrompt(plannedScene, {
          aspectRatio: project.visualConfig.aspectRatio,
          targetStyle: cleanStyle,
          characters: generationCharacters,
          visualBible: cleanVisualBible,
        });
      }

      const generationContext = plannedScene
        ? createSceneGenerationContext({ ...plannedScene, prompt: customPrompt }, { ...project.visualConfig, characters: generationCharacters })
        : { prompt: customPrompt, referenceImages: project.visualConfig.referenceImages || [] };
      const finalPrompt = appendImagePromptAspectRatio(generationContext.prompt, project.visualConfig.aspectRatio);
      const sceneGenerateType = requestedGenerateType
        || (_.isEqual(project.visualConfig.generateType, GenerateType.Video)
          ? GenerateType.Video
          : GenerateType.Image);
      const response = await fetchSystemApi(API_ROUTES.PIPELINE_GENERATE_IMAGE, {
        prompt: finalPrompt,
        style: project.visualConfig.style,
        resolution: project.visualConfig.quality,
        bypassCache: isForce,
        engine: project.visualConfig.imageGeneratorEngine || ImageGeneratorEngine.Veo3,
        sandboxConfig: sandboxConfig,
        visualConfig: {
          ...project.visualConfig,
          referenceImages: generationContext.referenceImages,
          generateType: sceneGenerateType,
        },
      });
      const data = await safeResponseJson(response, {});

      if (data.warning) {
        if (!isBatch) setErrorMsg(data.warning);
        else throw new Error(data.warning);
      }

      if (data.newProjectId && data.newProjectId !== sandboxConfig.projectId) {
        setSandboxConfig((prev: any) => ({
          ...prev,
          projectId: data.newProjectId,
        }));
      }

      let imageUrl = "";
      if (data.success && data.base64) {
        imageUrl = _.join([
          _.isEqual(sceneGenerateType, GenerateType.Video)
            ? REFACTOR_CONSTANTS.DATA_VIDEO_BASE64_PREFIX
            : REFACTOR_CONSTANTS.AVG_DATA_IMAGE_BASE64_PREFIX,
          data.base64,
        ], REFACTOR_CONSTANTS.VD_EMPTY_STRING);
        trackOperationCost(40, 0.03);
      } else if (_.every([
        data.fallbackUrl,
        _.isEqual(sceneGenerateType, GenerateType.Image),
      ], Boolean)) {
        imageUrl = data.fallbackUrl;
        trackOperationCost(5, 0.0002);
      } else {
        throw new Error(data.warning || REFACTOR_CONSTANTS.ERR_UNKNOWN);
      }

      setProject((prev) => {
        const updated = (prev.storyboard || []).map((sc) => {
          if (sc.id === sceneId) {
            return {
              ...(plannedScene || sc),
              prompt: customPrompt,
              generationPrompt: finalPrompt,
              assetUrl: imageUrl,
              assetUrls: [imageUrl],
              isGenerated: true,
              assetType: sceneGenerateType,
            };
          }
          return sc;
        });
        const updatedProject = {
          ...prev,
          storyboard: updated,
          ...(rewriteBeforeGeneration ? {
            visualConfig: {
              ...prev.visualConfig,
              style: cleanStyle,
              referencePrompt: cleanStyle,
              characters: generationCharacters,
              characterPrompt: _.get(_.first(generationCharacters), "prompt", ""),
              characterAnalysis: _.join(_.map(generationCharacters, character => `${character.name} ${character.description || ""}`), "\n"),
              characterConsistency: !_.isEmpty(generationCharacters),
            },
            visualBible: generationVisualBible,
          } : {}),
        };
        setTimeout(() => {
          onSaveProject(updatedProject, true);
        }, 0);
        return updatedProject;
      });
      logger.info(`[Hệ thống] ✅ Thành công: Tạo hình ảnh thành công cho phân cảnh ${sceneId}.`);
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
    await delayAsync(600);
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
      setTimeout(() => {
        onSaveProject(updatedProject, true);
      }, 0);
      return updatedProject;
    });

    setActiveSlideIndices((indices) => ({
      ...indices,
      [sceneId]: 0,
    }));

    setIsUploadingImage(false);
    const successMsg = t.imageUploadSuccess.replace("{sceneId}", sceneId);
    setInfoMsg(successMsg);
    logger.info(`[Hệ thống] ✅ Thành công: ${successMsg}`);
  };

  const handleCopyPrompt = (promptText: string) => {
    logAction("handleCopyPrompt");
    navigator.clipboard.writeText(promptText);
    const successMsg = t.Scene_visual_prompt_copie || "Đã sao chép prompt.";
    setTemporaryState(setInfoMsg, successMsg, REFACTOR_CONSTANTS.VD_EMPTY_STRING, UI_MESSAGE_DURATION.EXTENDED_MS);
    logger.info(`[Hệ thống] ✅ Thành công: ${successMsg}`);
  };

  const handleGenerateHooks = async (force = false) => {
    logAction("handleGenerateHooks");
    if (!(project.input?.content || "").trim()) {
      setErrorMsg(t.Please_enter_script_conte || "Vui lòng nhập nội dung trước khi tạo hook.");
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

      const { success, data, error } = await safeSystemFetch(API_ROUTES.PIPELINE_HOOKS, payload);

      if (!success || data?.error || data?.warning) {
        throw new Error(error || data?.error || data?.warning || PIPELINE_CLIENT_ERRORS.HOOK_GENERATION_FAILED);
      }

      const generatedVersions = data.versions || [];
      setHooksDraft(generatedVersions);

      const successMsg = t.generateHookSuccess || "Tạo hook thành công.";
      setInfoMsg(successMsg);
      logger.info(`[Hooks] ✅ Success: Generated ${generatedVersions.length} hooks.`);
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
    const successMsg = t.Hook_content_copied_to_cl || "Đã sao chép nội dung hook.";
    setTemporaryState(setInfoMsg, successMsg, REFACTOR_CONSTANTS.VD_EMPTY_STRING, UI_MESSAGE_DURATION.EXTENDED_MS);
    logger.info(`[Hệ thống] ✅ Thành công: ${successMsg}`);
  };

  const handleCopyAllPrompts = () => {
    logAction("handleCopyAllPrompts");
    const storyboard = project.storyboard || [];
    if (_.isEmpty(storyboard)) {
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
        setTemporaryState(setCopiedAll, true, false, UI_MESSAGE_DURATION.STANDARD_MS);
        const successMsg = t.Pure_optimized_scene_prom || "Đã sao chép toàn bộ prompt.";
        setInfoMsg(successMsg);
        logger.info(`[Hệ thống] ✅ Thành công: ${successMsg}`);
      })
      .catch((err) => {
        logger.error("FAILED_COPY_PROMPTS", err);
      });
  };

  const handleReferenceImagesUpload = async (files: FileList | null) => {
    logAction("handleReferenceImagesUpload");
    if (!files) return;
    const ArrayFiles = Array.from(files);
    if (_.isEmpty(ArrayFiles)) return;

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
    if (!images || _.isEmpty(images)) return;

    setLoadingStates((prev) => ({ ...prev, extractStyle: true }));
    setLoading(true);
    setErrorMsg("");
    setInfoMsg(t.MULTI_STEP_SYSTEM_FLOW_Ex);

    try {
      const extractPayload = { images, fallbackStyle: project.visualConfig?.referencePrompt, purpose: StyleReferencePurpose.Scene };
      const { success: extractSuccess, data: extractData, error: extractError } = await safeSystemFetch(API_ROUTES.PIPELINE_EXTRACT_STYLE, extractPayload);

      if (!extractSuccess || extractData?.error) {
        throw new Error(extractError || extractData?.error || PIPELINE_CLIENT_ERRORS.STYLE_EXTRACTION_FAILED);
      }

      const extractedStyle = extractData.style;
      const negativeStylePrompt = extractData.negativeStylePrompt || extractData.styleProfile?.negativeStylePrompt || "";
      const styleFingerprint = _.toString(extractData.fingerprint) || extractedStyle;

      setProject((prev) => ({
        ...prev,
        visualConfig: {
          ...prev.visualConfig,
          style: extractedStyle,
          referencePrompt: extractedStyle,
          negativeStylePrompt,
          styleFingerprint,
          styleReferenceLocked: true,
        },
        visualBible: {
          ...prev.visualBible,
          visualStyle: extractedStyle,
          styleProfile: extractData.styleProfile,
          negativeStylePrompt,
          styleFingerprint,
          styleReferenceLocked: true,
        },
      }));

      setLoadingStates((prev) => ({ ...prev, extractStyle: false }));
      const successMsg = t.Style_extracted_successfu || "Trích xuất phong cách thiết kế thành công.";
      setTemporaryState(setInfoMsg, successMsg, REFACTOR_CONSTANTS.VD_EMPTY_STRING, UI_MESSAGE_DURATION.EXTENDED_MS);
      logger.info(`[Hệ thống] ✅ Thành công: ${successMsg}`);
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
    if (!project.storyboard || _.isEmpty(project.storyboard)) {
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
      const { success: rewriteSuccess, data: rewriteData } = await safeSystemFetch(API_ROUTES.PIPELINE_REWRITE_PROMPTS, rewritePayload);

      if (rewriteSuccess && rewriteData?.storyboard) {
        setProject((prev) => ({
          ...prev,
          storyboard: rewriteData.storyboard,
        }));
        const successMsg = t.Successfully_applied_styl || "Áp dụng phong cách thiết kế thành công.";
        setInfoMsg(successMsg);
        logger.info(`[Hệ thống] ✅ Thành công: ${successMsg}`);
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
    const isVi = project.config.language === "vi";
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
      const { success, data, error } = await safeSystemFetch(API_ROUTES.PIPELINE_OPTIMIZE_PROMPTS, payload);

      if (success && data?.storyboard) {
        setProject((prev) => ({ ...prev, storyboard: data.storyboard }));
        setInfoMsg(t.optimizePromptsSuccess || txt.OPTIMIZE_PROMPTS_SUCCESS_FALLBACK);
      } else {
        throw new Error(error || data?.error || txt.OPTIMIZATION_FAILED);
      }
    } catch (err: any) {
      setErrorMsg(t.optimizePromptsError ? t.optimizePromptsError.replace("{error}", err.message) : txt.OPTIMIZE_PROMPTS_FAILED_FALLBACK + err.message);
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
      const { success, data, error } = await safeSystemFetch(API_ROUTES.PIPELINE_ANALYZE_CHARACTER, { script });
      if (!success || data?.error) {
        throw new Error(error || data?.error || PIPELINE_CLIENT_ERRORS.CHARACTER_ANALYSIS_FAILED);
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
          characterAnalysis: rawCharacters.map((c: any) => `${c.name}: ${c.description}`).join("\n"),
          characterExtracted: false,
        },
      }));

      const successMsg = t.charAnalyzeSuccess || "Phân tích nhân vật thành công.";
      setInfoMsg(successMsg);
      logger.info(`[Hệ thống] ✅ Thành công: ${successMsg}`);
    } catch (e: any) {
      logger.error(REFACTOR_CONSTANTS.LOG_ERROR_GENERAL, e);
      setErrorMsg(`${t.charAnalyzeFailed} ${e.message}`);
    } finally {
      setLoadingStates((prev) => ({ ...prev, analyzeCharacter: false }));
      setLoading(false);
    }
  };

  const handleCharacterImagesUpload = async (charId: string, files: FileList | null) => {
    logAction("handleCharacterImagesUpload");
    if (!files) return;
    const ArrayFiles = Array.from(files);
    if (_.isEmpty(ArrayFiles)) return;

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
    if (!images || _.isEmpty(images)) {
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
      const { success, data, error } = await safeSystemFetch(API_ROUTES.PIPELINE_EXTRACT_CHARACTER, payload);

      if (!success || data?.error) {
        throw new Error(error || data?.error || PIPELINE_CLIENT_ERRORS.CHARACTER_EXTRACTION_FAILED);
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

      const successMsg = t.charExtractSuccess || "Trích xuất đặc điểm nhân vật thành công.";
      setInfoMsg(successMsg);
      logger.info(`[Hệ thống] ✅ Thành công: ${successMsg}`);
    } catch (e: any) {
      logger.error(REFACTOR_CONSTANTS.LOG_ERROR_GENERAL, e);
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
    if (!project.storyboard || _.isEmpty(project.storyboard)) {
      setInfoMsg(t.charNoScenes);
      return;
    }
    const characters = project.visualConfig?.characters || [];
    const activeChars = characters.filter((c) => c.prompt || c.description);
    if (_.isEmpty(activeChars)) {
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
      const { success, data } = await safeSystemFetch(API_ROUTES.PIPELINE_REWRITE_PROMPTS_CHARACTER, payload);
      if (success && data?.storyboard) {
        setProject((prev) => ({
          ...prev,
          storyboard: data.storyboard,
        }));
        const successMsg = t.charApplySuccess;
        setInfoMsg(successMsg);
        logger.info("STORYBOARD_CHAR_SUCCESS");
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

  const handleApplyCharacterToThumbnails = async () => {
    logAction("handleApplyCharacterToThumbnails");
    if (!project.thumbnails || _.isEmpty(project.thumbnails)) {
      setInfoMsg(t.No_thumbnails_to_apply_style || "Chưa có ảnh bìa để áp dụng phong cách.");
      return;
    }
    const characters = project.visualConfig?.characters || [];
    const activeChars = characters.filter((c) => c.prompt || c.description);
    if (_.isEmpty(activeChars)) {
      setInfoMsg(t.charNoPrompt);
      return;
    }

    setLoadingStates((prev) => ({ ...prev, applyCharacter: true }));
    setLoading(true);
    setErrorMsg("");
    setInfoMsg(t.charApplying);

    try {
      const payload = {
        thumbnails: project.thumbnails,
        characters: activeChars.map((c) => ({
          name: c.name,
          prompt: c.prompt || c.description,
        })),
        aspectRatio: project.visualConfig.aspectRatio || "16:9",
      };
      const { success, data } = await safeSystemFetch(API_ROUTES.PIPELINE_REWRITE_THUMBNAILS_CHARACTER, payload);
      if (success && data?.thumbnails) {
        setProject((prev) => {
          const updatedProject = {
            ...prev,
            thumbnails: data.thumbnails,
          };
          setTimeout(() => {
            onSaveProject(updatedProject, true);
          }, 0);
          return updatedProject;
        });
        const successMsg = t.charApplySuccess;
        setInfoMsg(successMsg);
        logger.info("THUMBNAIL_CHAR_SUCCESS");
      } else {
        setProject((prev) => {
          const updatedProject = {
            ...prev,
            thumbnails: (prev.thumbnails || []).map((thumb) => ({
              ...thumb,
              prompt: thumb.prompt || "",
            })),
          };
          setTimeout(() => {
            onSaveProject(updatedProject, true);
          }, 0);
          return updatedProject;
        });
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
    if (!files || _.isEmpty(files)) return;

    const sortedFiles = Array.from(files).sort((a, b) =>
      a.name.localeCompare(b.name, undefined, {
        numeric: true,
        sensitivity: "base",
      }),
    );

    const storyboard = project.storyboard || [];
    if (_.isEmpty(storyboard)) return;

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
            if (sceneNumbers && sceneNumbers.length > 0 && sceneNumbers[0] === fileNum) {
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

    if (_.isEmpty(results)) {
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
        warnings = t.missingImagesWarning.replace("{ids}", missingIds.join(", "));
      }

      const outOfOrderMatches = results.filter((r) => {
        const numericPart = r.fileName.match(/\d+/);
        if (numericPart) {
          return numericPart[0] !== r.sceneId;
        }
        return false;
      });

      if (outOfOrderMatches.length > 0) {
        const warningDetail = t.mismatchImagesWarning.replace("{fileName}", outOfOrderMatches[0].fileName).replace("{sceneId}", outOfOrderMatches[0].sceneId);
        warnings = warnings ? `${warnings} | ${warningDetail}` : warningDetail;
      }

      const updatedProject = { ...prev, storyboard: updatedScenes };
      setTimeout(() => {
        onSaveProject(updatedProject, true);
      }, 0);
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

    const successMsg = t.bulkUploadSuccess.replace("{count}", results.length.toString());
    setInfoMsg(successMsg);
    logger.info(`[Hệ thống] ✅ Thành công: ${successMsg}`);
  };

  const handlePrevSlide = (sceneId: string, max: number) => {
    logAction("handlePrevSlide");
    setActiveSlideIndices((prev) => {
      const current = prev[sceneId] !== undefined ? prev[sceneId] : max - 1;
      const nextIdx = current === 0 ? max - 1 : current - 1;
      return { ...prev, [sceneId]: nextIdx };
    });
  };

  const handleThumbnailReferenceImagesUpload = async (files: FileList | null) => {
    logAction("handleThumbnailReferenceImagesUpload");
    if (!files) return;
    const ArrayFiles = Array.from(files);
    if (_.isEmpty(ArrayFiles)) return;

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
    if (!images || _.isEmpty(images)) return;

    setLoadingStates((prev) => ({ ...prev, extractThumbnailStyle: true }));
    try {
      const response = await fetchSystemApi(API_ROUTES.PIPELINE_EXTRACT_STYLE, { images, purpose: StyleReferencePurpose.Thumbnail });
      const data = await response.json();
      if (data.style) {
        setProject((prev) => {
          const thumbnailStyleProfile = data.styleProfile;
          const thumbnailReferencePrompt = createThumbnailStyleDirective(
            prev.visualBible?.styleProfile,
            thumbnailStyleProfile,
          ) || data.style;
          const updatedProject = {
            ...prev,
            visualConfig: {
              ...prev.visualConfig,
              thumbnailReferencePrompt,
              thumbnailStyleProfile,
            },
          };
          setTimeout(() => {
            onSaveProject(updatedProject, true);
          }, 0);
          return updatedProject;
        });
        const successMsg = t.Thumbnail_style_extracted;
        setInfoMsg(successMsg);
        logger.info(`[Thumbnail] ✅ Thành công: ${successMsg}`);
      } else if (data.error) {
        setErrorMsg(data.error);
      }
    } catch (e: any) {
      setErrorMsg(e.message);
    } finally {
      setLoadingStates((prev) => ({ ...prev, extractThumbnailStyle: false }));
    }
  };

  const handleApplyThumbnailStyle = async () => {
    logAction("handleApplyThumbnailStyle");
    if (!project.thumbnails || _.isEmpty(project.thumbnails)) {
      setInfoMsg(t.No_thumbnails_to_apply_style);
      return;
    }
    const currentStyle = project.visualConfig?.thumbnailReferencePrompt;
    if (!currentStyle) {
      setInfoMsg(t.No_style_extracted_yet);
      return;
    }

    setLoadingStates((prev) => ({ ...prev, applyThumbnailStyle: true }));
    setLoading(true);
    setErrorMsg("");
    setInfoMsg(t.Applying_style_to_scenes);

    try {
      const rewritePayload = {
        thumbnails: project.thumbnails,
        newStyle: currentStyle,
        aspectRatio: project.visualConfig.aspectRatio || "16:9",
      };
      const { success: rewriteSuccess, data: rewriteData } = await safeSystemFetch(API_ROUTES.PIPELINE_REWRITE_THUMBNAILS, rewritePayload);

      if (rewriteSuccess && rewriteData?.thumbnails) {
        setProject((prev) => {
          const updatedProject = {
            ...prev,
            thumbnails: rewriteData.thumbnails,
          };
          setTimeout(() => {
            onSaveProject(updatedProject, true);
          }, 0);
          return updatedProject;
        });
        const successMsg = t.Successfully_applied_styl;
        setInfoMsg(successMsg);
        logger.info(`[Thumbnail] ✅ Thành công: ${successMsg}`);
      } else {
        setProject((prev) => {
          const updatedProject = {
            ...prev,
            thumbnails: (prev.thumbnails || []).map((thumb) => ({
              ...thumb,
              prompt: thumb.prompt || "",
            })),
          };
          setTimeout(() => {
            onSaveProject(updatedProject, true);
          }, 0);
          return updatedProject;
        });
        setInfoMsg(t.Applied_style_fallback_mo);
      }
    } catch (err: any) {
      setErrorMsg(t.applyStyleError ? t.applyStyleError.replace("{error}", err.message) : err.message);
    } finally {
      setLoadingStates((prev) => ({ ...prev, applyThumbnailStyle: false }));
      setLoading(false);
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
    await delayAsync(500);

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
      setTimeout(() => {
        onSaveProject(updatedProject, true);
      }, 0);
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
      setTimeout(() => {
        onSaveProject(updatedProject, true);
      }, 0);
      return updatedProject;
    });

    setActiveSlideIndices({});

    const successMsg = t.deleteAllImagesSuccess;
    setInfoMsg(successMsg);
    logger.info(`[Hệ thống] ✅ Thành công: ${successMsg}`);
  };

  const handleCancelBatchGenerate = () => {
    cancelBatchImageRef.current = true;
    setIsCancellingBatch(true);
    setInfoMsg(t.cancellingBatchGen);
  };

  const handleBatchGenerateAllImages = async (_isFromAutoGenerateAll = false, providedScenes?: any[]) => {
    logAction("handleBatchGenerateAllImages");
    if (isBatchGenerating) return;

    cancelBatchImageRef.current = false;

    const scenes = providedScenes || project.storyboard || [];
    if (_.isEmpty(scenes)) {
      setErrorMsg(t.No_storyboard_scenes_foun);
      return;
    }

    const targetScenes = _.filter(scenes, (scene) => !hasSceneAsset(scene));
    if (_.isEmpty(targetScenes)) {
      setInfoMsg(t.imagesAlreadyComplete);
      return;
    }

    setIsBatchGenerating(true);
    setLoading(false);
    setErrorMsg("");
    setBatchProgressMsg(t.initializingBatchGen);

    const totalToProcess = targetScenes.length;
    let completedCount = 0;
    let hasError = false;

    const isGeminiChat = project.visualConfig.generationMode === ImageGenerationMode.GeminiChat;
    const concurrency = SecurityConstants.DEFAULT_AMOUNT;
    const configuredGenerateType = project.visualConfig.generateType || GenerateType.Image;
    const existingVideoCount = _.size(_.filter(
      scenes,
      (scene) => _.isEqual(scene.assetType, GenerateType.Video)
        && hasSceneAsset(scene),
    ));
    const remainingVideoSlots = _.max([
      _.subtract(
        project.visualConfig.maxVideoScenes || MEDIA_MIX_CONFIG.DEFAULT_MAX_VIDEOS,
        existingVideoCount,
      ),
      SecurityConstants.ZERO,
    ])!;
    const videoSceneIds = await selectVideoSceneIds(
      targetScenes,
      configuredGenerateType,
      remainingVideoSlots,
    );

    try {
      if (isGeminiChat) {
        for (const scene of targetScenes) {
          setLoadingStates((prev) => ({
            ...prev,
            [LOADING_KEYS.RENDER_SCENE_PREFIX + scene.id]: true,
          }));
        }

        const generationPrompts = new Map<string, string>();
        const batchItems = _.map(targetScenes, (scene) => {
          const generationContext = createSceneGenerationContext(scene, project.visualConfig);
          const prompt = appendImagePromptAspectRatio(generationContext.prompt, project.visualConfig.aspectRatio);
          generationPrompts.set(scene.id, prompt);
          return {
            sceneId: scene.id,
            prompt,
            referenceImages: generationContext.referenceImages,
            continuityKey: createSceneContinuityKey(scene, project.visualConfig.characters),
            generateType: resolveSceneGenerateType(
              scene.id,
              configuredGenerateType,
              videoSceneIds,
            ),
          };
        });
        const applyResult = (result: ProjectImageResult) => {
          const imageUrl = createProjectImageUrl(result);
          if (_.isEmpty(imageUrl)) {
            return;
          }
          setProject((prev) => {
            const updated = _.map(prev.storyboard || [], (sc) => {
              if (_.eq(sc.id, result.sceneId)) {
                return {
                  ...sc,
                  generationPrompt: generationPrompts.get(sc.id),
                  assetUrl: imageUrl,
                  assetUrls: [imageUrl],
                  isGenerated: true,
                  assetType: result.assetType || GenerateType.Image,
                };
              }
              return sc;
            });
            const updatedProject = { ...prev, storyboard: updated };
            persistImageCheckpoint(updatedProject);
            return updatedProject;
          });
          completedCount = _.add(completedCount, SecurityConstants.DEFAULT_AMOUNT);
        };

        await generateProjectImages({
          items: batchItems,
          visualConfig: project.visualConfig,
          style: project.visualConfig.style,
          sandboxConfig,
          cancelRef: cancelBatchImageRef,
          onBatchResult: (result) => {
            setLoadingStates((prev) => ({
              ...prev,
              [LOADING_KEYS.RENDER_SCENE_PREFIX + result.sceneId]: false,
            }));

            if (result.success) {
              applyResult(result);
            } else {
              logger.error(LogEvent.BATCH_SCENE_FAILED, result.sceneId, result.warning);
              setErrorMsg(t.errorRenderingSceneBatch
                .replace(REFACTOR_CONSTANTS.TEMPLATE_SCENE_ID, result.sceneId)
                .replace(
                  REFACTOR_CONSTANTS.TEMPLATE_ERROR,
                  result.warning || REFACTOR_CONSTANTS.UNKNOWN_WARNING,
                ));
            }

            setBatchProgressMsg(t.generatingSceneBatch
              .replace(REFACTOR_CONSTANTS.TEMPLATE_SCENE_ID, result.sceneId)
              .replace(REFACTOR_CONSTANTS.TEMPLATE_CURRENT_INDEX, _.toString(completedCount))
              .replace(REFACTOR_CONSTANTS.TEMPLATE_TOTAL, _.toString(totalToProcess)));
          },
        });
      } else {
        const batches = _.chunk(targetScenes, concurrency);
        let completedBatchesCount = 0;

        for (let i = 0; i < batches.length && !hasError; i++) {
          if (cancelBatchImageRef.current) {
            setInfoMsg(t.batchGenCancelled.replace("{completedCount}", completedCount.toString()));
            break;
          }

          const batchScenes = batches[i];
          const displayIndex = completedBatchesCount * concurrency + 1;

          setBatchProgressMsg(
            t.generatingSceneBatch
              .replace("{sceneId}", batchScenes.map((s) => s.id).join(", "))
              .replace("{currentIndex}", displayIndex.toString())
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
            await handleRenderSceneImage(
              scene.id,
              scene.prompt,
              false,
              true,
              resolveSceneGenerateType(
                scene.id,
                configuredGenerateType,
                videoSceneIds,
              ),
            );
            completedCount++;
          } catch (err: any) {
            logger.error("ERROR_RENDERING_SCENE_BATCH", scene.id, err);
            setErrorMsg(t.errorRenderingSceneBatch.replace("{sceneId}", scene.id).replace("{error}", err.message));
            hasError = true;
          } finally {
            setLoadingStates((prev) => ({
              ...prev,
              ["renderScene_" + scene.id]: false,
            }));
          }

          completedBatchesCount++;

          if (i < batches.length - 1 && !hasError && !cancelBatchImageRef.current) {
            const delayMs = getBatchDelayMs(project.visualConfig.batchDelay);
            const delaySecs = (delayMs / 1000).toFixed(1);
            setBatchProgressMsg(project.config.language === "vi" ? APP_TEXTS.VN.WAITING_MSG(delaySecs) : APP_TEXTS.EN.WAITING_MSG(delaySecs));
            await randomDelay(delayMs, delayMs);
          }
        }
      }

      if (!cancelBatchImageRef.current && !hasError) {
        const successMsg = t.batchGenSuccess.replace("{completedCount}", completedCount.toString());
        setInfoMsg(successMsg);
      }
    } catch (err: any) {
      logger.error("BATCH_GEN_FAILURE", err);
      setErrorMsg(t.batchGenFailed.replace("{error}", err.message));
    } finally {
      setIsBatchGenerating(false);
      setIsCancellingBatch(false);
      setBatchProgressMsg("");
    }
  };

  const openSceneModal = (scene: StoryboardScene) => {
    setActiveSceneId(scene.id);
    setSceneEditScript(scene.script);
    setSceneEditSubtitle(scene.subtitle);
    setSceneEditPrompt(scene.generationPrompt || scene.prompt);
    setSceneEditTextAllowed(Boolean(scene.textAllowed));
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
      const { success, data, error } = await safeSystemFetch(API_ROUTES.PIPELINE_DETAILED_PROMPT, payload);
      if (!success || data?.error || data?.warning) {
        throw new Error(error || data?.error || data?.warning || PIPELINE_CLIENT_ERRORS.PROMPT_GENERATION_FAILED);
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
        const successMsg = t.Detailed_image_prompt_gen || "Mở rộng prompt thành công.";
        setTemporaryState(setInfoMsg, successMsg, REFACTOR_CONSTANTS.VD_EMPTY_STRING, UI_MESSAGE_DURATION.EXTENDED_MS);
        logger.info(`[Hệ thống] ✅ Thành công: ${successMsg}`);
      }
    } catch (err: any) {
      logger.error("ERROR_GEN_DETAILED_PROMPT", err);
      setTemporaryState(setErrorMsg, t.promptGenError.replace("{error}", err.message), REFACTOR_CONSTANTS.VD_EMPTY_STRING, UI_MESSAGE_DURATION.EXTENDED_MS);
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
          const changed = [sc.script !== sceneEditScript, sc.subtitle !== sceneEditSubtitle].some(Boolean);
          return {
            ...sc,
            script: sceneEditScript,
            subtitle: sceneEditSubtitle,
            prompt: sceneEditPrompt,
            textAllowed: sceneEditTextAllowed,
            cameraMotion: sceneEditMotion,
            effects: sceneEditFx,
            transition: sceneEditTransition,
            audioUrl: changed ? undefined : sc.audioUrl,
            audioBase64: changed ? undefined : sc.audioBase64,
          };
        }
        return sc;
      });

      const totalDuration = updated.reduce((sum: number, s: any) => sum + (s.duration || 0), 0);
      let syncLogText = t.syncLedgerSuccess.replace("{totalDuration}", totalDuration.toFixed(1));

      updated.forEach((scene: any, idx: number) => {
        syncLogText += t.syncLedgerItem
          .replace("{index}", (idx + 1).toString())
          .replace("{startTime}", formatRoundedTime(scene.startTime))
          .replace("{endTime}", formatRoundedTime(scene.endTime))
          .replace("{duration}", Math.round(scene.duration || 0).toString())
          .replace("{script}", (scene.script || scene.subtitle || "").substring(0, 35));
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
    const successMsg = t.Scene_mod_saved_successfu || "Lưu chỉnh sửa phân cảnh thành công.";
    setInfoMsg(successMsg);
    logger.info(`[Hệ thống] ✅ Thành công: ${successMsg}`);
  };

  const handleTriggerAssetAndThumbnail = async (force = false, btnPosition = "top") => {
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

      const { success, data, error } = await safeSystemFetch(API_ROUTES.PIPELINE_THUMBNAILS, payload);

      if (!success || data?.error || data?.warning) {
        throw new Error(error || data?.error || data?.warning || PIPELINE_CLIENT_ERRORS.REQUEST_REJECTED);
      }

      if (data.thumbnails) {
        const formattedThumbs = data.thumbnails.map((th: ThumbnailItem) => {
          return {
            ...th,
            imageUrl: "",
          };
        });

        setProject((prev) => ({
          ...prev,
          thumbnails: formattedThumbs,
        }));
        trackOperationCost(15, 0.0008);
        const successMsg = t.High_engagement_Thumbnail || "Hoàn thành tạo ảnh thu nhỏ.";
        setInfoMsg(successMsg);
        logger.info(`[Thumbnail] ✅ Thành công: ${successMsg}`);
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

  const handleRenderThumbnailImage = async (thumbId: string, promptText: string, styleText: string, force = false) => {
    logAction("handleRenderThumbnailImage");
    const isForce = force === true;
    setLoadingStates((prev) => ({ ...prev, ["renderThumb_" + thumbId]: true }));
    setLoading(true);
    setErrorMsg("");
    try {
      const currentAspectRatio = project.visualConfig.aspectRatio || "16:9";
      const thumbnail = _.find(project.thumbnails, { id: thumbId }) || {
        id: thumbId,
        prompt: promptText,
        style: styleText,
        hasText: false,
      } as ThumbnailItem;
      const referenceImages = resolveThumbnailReferenceImages(project.visualConfig);
      const generationPrompt = createThumbnailGenerationPrompt(thumbnail, styleText, currentAspectRatio, !_.isEmpty(referenceImages), project.visualConfig.characters);

      const data = await safeFetchJsonWithAuth(API_ROUTES.PIPELINE_GENERATE_IMAGE, {
        prompt: generationPrompt,
        style: styleText,
        resolution: "Standard",
        bypassCache: isForce,
        engine: project.visualConfig.imageGeneratorEngine || ImageGeneratorEngine.Veo3,
        sandboxConfig: sandboxConfig,
        visualConfig: { ...project.visualConfig, referenceImages },
      });
      if (data.warning) {
        setErrorMsg(data.warning);
      }

      if (data.newProjectId && data.newProjectId !== sandboxConfig.projectId) {
        setSandboxConfig((prev: any) => ({
          ...prev,
          projectId: data.newProjectId,
        }));
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
        throw new Error(REFACTOR_CONSTANTS.ERR_THUMBNAIL_QUALITY_REJECTED);
      }

      const validatedThumbnail = acceptGeneratedThumbnail({ ...thumbnail, imageUrl: imgUrl, generationPrompt });

      setProject((prev) => {
        const updated = (prev.thumbnails || []).map((th) => {
          if (th.id === thumbId) {
            return { ...th, ...validatedThumbnail };
          }
          return th;
        });
        const updatedProject = { ...prev, thumbnails: updated };
        setTimeout(() => {
          onSaveProject(updatedProject, true);
        }, 0);
        return updatedProject;
      });
      if (isSuccess) {
        const successMsg = t.Mockup_thumbnail_painted_ || "Tạo ảnh thu nhỏ thành công.";
        setInfoMsg(successMsg);
        logger.info(`[Thumbnail] ✅ Thành công: ${successMsg}`);
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

  const handleRenderAllThumbnailImages = async () => {
    logAction("handleRenderAllThumbnailImages");
    const thumbs = project.thumbnails || [];
    if (_.isEmpty(thumbs)) {
      setErrorMsg(t.No_Thumbnail_Prompts);
      return;
    }

    let targets = thumbs.filter((th) => !th.imageUrl);
    if (_.isEmpty(targets)) {
      targets = [...thumbs];
    }

    setLoadingStates((prev) => ({ ...prev, renderAllThumbs_loading: true }));
    setLoading(true);
    setErrorMsg("");

    try {
      if (_.isEqual(project.visualConfig.generationMode, ImageGenerationMode.GeminiChat)) {
        const currentAspectRatio = project.visualConfig.aspectRatio || "16:9";
        const referenceImages = resolveThumbnailReferenceImages(project.visualConfig);
        const generationPrompts = new Map<string, string>();
        const generatedImageUrls = new Map<string, string>();
        const items = _.map(targets, thumbnail => {
          const generationPrompt = createThumbnailGenerationPrompt(thumbnail, thumbnail.style, currentAspectRatio, !_.isEmpty(referenceImages), project.visualConfig.characters);
          generationPrompts.set(thumbnail.id, generationPrompt);
          return { sceneId: thumbnail.id, prompt: generationPrompt, generateType: GenerateType.Image, referenceImages, continuityKey: createThumbnailContinuityKey() };
        });
        const collectThumbnailResult = (result: ProjectImageResult) => {
          const imageUrl = createProjectImageUrl(result);
          if (_.isEmpty(imageUrl)) return;
          generatedImageUrls.set(result.sceneId, imageUrl);
        };
        await generateProjectImages({
          items,
          visualConfig: { ...project.visualConfig, referenceImages, batchTabCount: _.size(targets) },
          style: project.visualConfig.thumbnailReferencePrompt || project.visualConfig.style,
          sandboxConfig,
          cancelRef: cancelBatchImageRef,
          onBatchResult: result => { if (result.success) collectThumbnailResult(result); },
        });
        const validatedThumbnails = _.map(targets, thumbnail => {
          const imageUrl = generatedImageUrls.get(thumbnail.id);
          if (_.isEmpty(imageUrl)) return thumbnail;
          return acceptGeneratedThumbnail({ ...thumbnail, imageUrl, generationPrompt: generationPrompts.get(thumbnail.id) });
        });
        const validatedById = _.keyBy(validatedThumbnails, "id");
        setProject(prev => {
          const updatedProject = {
            ...prev,
            thumbnails: _.map(prev.thumbnails, thumbnail => validatedById[thumbnail.id] || thumbnail),
          };
          setTimeout(() => onSaveProject(updatedProject, true), UI_MESSAGE_DURATION.OBJECT_URL_REVOKE_MS);
          return updatedProject;
        });
      } else {
        for (const thumb of targets) {
          await handleRenderThumbnailImage(thumb.id, thumb.prompt, thumb.style, true);
        }
      }
      setInfoMsg(t.bulkRenderThumbnailsSuccess);
    } catch (err: any) {
      logger.error("BULK_RENDER_THUMBS_FAILED", err);
      setErrorMsg(err.message);
    } finally {
      setLoadingStates((prev) => ({ ...prev, renderAllThumbs_loading: false }));
      setLoading(false);
    }
  };

  const handleDownloadVoice = async () => {
    logAction("handleDownloadVoice");
    if (!isProductionAudioSource(ttsAudioUrl || undefined)) return;
    const a = document.createElement("a");
    a.href = ttsAudioUrl!;
    a.download = `voiceover_${project.voiceConfig?.gender || "speaker"}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleRegenerateUnifiedVoice = async (voiceConfigOverride?: any) => {
    logAction("handleRegenerateUnifiedVoice");
    stopPlaybackSim();
    if (activeCloudPreviewAudio) {
      activeCloudPreviewAudio.pause();
      activeCloudPreviewAudio.currentTime = 0;
      activeCloudPreviewAudio = null;
    }

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
        await handleTriggerAllSceneVoices(project.storyboard, true, voiceConfigOverride);
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

  const handleTriggerVoiceGenerate = async (_force = false, btnPosition = "top") => {
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

  const getVoiceSourceBase64 = async (voiceConfig: any) => {
    let audioBase64 = voiceConfig?.audioBase64;
    if (!audioBase64 && voiceConfig?.audioUrl) {
      try {
        const audioFetchRes = await fetch(voiceConfig.audioUrl);
        if (audioFetchRes.ok) {
          const audioArrayBuffer = await audioFetchRes.arrayBuffer();
          const uint8Array = new Uint8Array(audioArrayBuffer);
          const chunkSize = 0x8000;
          let binary = "";
          for (let i = 0; i < uint8Array.length; i += chunkSize) {
            binary += String.fromCharCode(...uint8Array.subarray(i, i + chunkSize));
          }
          audioBase64 = btoa(binary);
        }
      } catch (fetchErr) {
        logger.error(ERROR_MESSAGES.FETCH_AUDIO_URL_FOR_ALIGN_ERR, fetchErr);
      }
    }
    return audioBase64;
  };

  const alignStoryboardVoice = async (scenes: any[], audioBase64: string) => {
    let alignData = await safeFetchJsonWithAuth(API_ROUTES.PIPELINE_ALIGN_VOICE, {
      audioBase64: audioBase64,
      scenes: _.map(scenes, (sc) => ({
        id: sc.id,
        script: sc.script || sc.subtitle || "",
      })),
    });

    if (!alignData || !alignData.success || !_.isArray(alignData.alignments)) {
      const langKey = currentLang === "en" ? "en" : "vi";
      const texts = EXTERNAL_AUDIO_TEXTS[langKey];
      throw new Error(alignData.error || texts.SERVER_ALIGN_ERROR);
    }

    return scenes.map((sc: any) => {
      const align = alignData.alignments.find((a: any) => a.id === sc.id);
      if (align) {
        return {
          ...sc,
          duration: align.duration,
          startTime: formatTimeHelper(align.start),
          endTime: formatTimeHelper(align.end),
          _start: align.start,
          _end: align.end,
          audioUrl: undefined,
          audioBase64: undefined,
        };
      }
      return {
        ...sc,
        audioUrl: undefined,
        audioBase64: undefined,
      };
    });
  };

  const handleAlignAndSaveVoice = async (audioName: string, audioUrl: string, audioBase64: string, audioType: AudioType, isFromAutoGenerateAll = false) => {
    stopPlaybackSim();

    const lang = currentLang === "en" ? "en" : "vi";
    const texts = EXTERNAL_AUDIO_TEXTS[lang];

    const scenes = project.storyboard || [];
    if (_.isEmpty(scenes)) {
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
      const alignedScenes = await alignStoryboardVoice(scenes, audioBase64);

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
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
      let syncLogText = texts.SYNC_COMPLETE.replace("{totalDuration}", totalDuration.toFixed(1));
      alignedScenes.forEach((scene: any, idx: number) => {
        syncLogText += texts.SYNC_ITEM
          .replace("{index}", (idx + 1).toString())
          .replace("{startTime}", formatRoundedTime(scene.startTime))
          .replace("{endTime}", formatRoundedTime(scene.endTime))
          .replace("{duration}", Math.round(scene.duration || 0).toString())
          .replace("{script}", (scene.script || scene.subtitle || "").substring(0, 35));
      });

      setAlignmentsLog(syncLogText);
      setTtsAudioUrl(audioUrl);
      setTtsAudioBytes(audioBase64);

      const lazyProject = {
        ...project,
        storyboard: alignedScenes,
        voiceConfig: {
          ...project.voiceConfig,
          audioType: audioType,
          uploadedAudioName: audioType === AudioType.Upload ? audioName : project.voiceConfig.uploadedAudioName,
          audioUrl: audioUrl,
          audioBase64: audioBase64,
          timingLog: syncLogText,
        },
      };

      setProject(lazyProject);
      onSaveProject(lazyProject, true);

      setTimeout(() => {
        voicePlayerSectionRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 300);

      if (!isFromAutoGenerateAll) {
        setLoadingStates((prev) => ({
          ...prev,
          bulkVoiceGenerate_loading: false,
          voiceGenerate_loading: false,
        }));
      }
      setLoading(false);
      setBulkVoiceStatus("");

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

  const handleTriggerAllSceneVoices = async (providedScenes?: any[], isFromAutoGenerateAll = false, voiceConfigOverride?: any) => {
    logAction("handleTriggerAllSceneVoices");
    stopPlaybackSim();

    const scenes = providedScenes || project.storyboard || [];
    if (_.isEmpty(scenes)) {
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
      const vConfig = voiceConfigOverride || project.voiceConfig || PipelineConstants.DEFAULT_VOICE_CONFIG;
      const updatedScenes = [...scenes];

      let fullScript = project.scriptRewritten || "";
      if (!fullScript) {
        fullScript = updatedScenes.map((s) => cleanScriptText(s.script || s.subtitle || "")).join(" ");
      }

      if (!fullScript.trim()) {
        throw new Error(t.Script_is_empty);
      }

      setBulkVoiceStatus(t.MULTI_STEP_SYSTEM_FLOW_Ge_3);

      const voiceURI = vConfig.voiceURI || "preset-vi-bac-female";
      const { finalSpeed, finalPitch } = getVoiceModifiers(voiceURI, vConfig.speed || 1.0, vConfig.pitch || 1.0);

      const audioData = await safeFetchJsonWithAuth(API_ROUTES.PIPELINE_VOICE, {
        text: fullScript,
        gender: vConfig.gender,
        age: vConfig.age,
        emotion: vConfig.emotion,
        speed: finalSpeed,
        pitch: finalPitch,
        volume: vConfig.volume || 1.0,
        voiceURI: voiceURI,
        voice_id: voiceURI,
        provider: vConfig.provider,
        ...(_.startsWith(voiceURI, "vbee-") || _.includes(voiceURI, "vbee") ? { voice_ownership: "community" } : {}),
      });

      if (!audioData || !audioData.success || !audioData.audioBase64) {
        throw new Error(audioData?.warning || audioData?.error || PIPELINE_CLIENT_ERRORS.AUDIO_MISSING);
      }

      const arrayBuffer = base64ToArrayBuffer(audioData.audioBase64);
      const bufferClone = arrayBuffer.slice(0);
      let processedBlob;
      try {
        processedBlob = await applyAudioEffects(bufferClone, finalSpeed, finalPitch, vConfig.volume || 1.0);
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

      return await handleAlignAndSaveVoice("", mergedUrl, processedBase64, AudioType.Generated, isFromAutoGenerateAll);
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

  const handleAutoGenerateVideo = async () => {
    logAction("handleAutoGenerateVideo");
    
    if (_.isEmpty(_.trim(project.input?.content))) {
      setErrorMsg(t.Please_enter_script_conte || AUTO_GENERATE_TEXTS.EMPTY_SCRIPT_ERR);
      return;
    }

    setLoadingStates((prev) => ({ ...prev, autoGenerateAll: true }));
    try {
      const IS_FORCE = true;
      let currentScript = project.scriptRewritten;

      if (_.isEmpty(currentScript)) {
        setCurrentStep(WizardStep.SourceInput);
        setInfoMsg(t.MULTI_STEP_SYSTEM_FLOW_Dr || AUTO_GENERATE_TEXTS.DRAFTING_SCRIPT);
        const scriptData = await handleProcessInputAndConfig(IS_FORCE);
        if (scriptData && !_.isEmpty(scriptData.rewrittenScript)) {
          currentScript = scriptData.rewrittenScript;
        } else {
          throw new Error(AUTO_GENERATE_TEXTS.SCRIPT_ERR);
        }
      }

      setCurrentStep(WizardStep.Storyboard);
      setInfoMsg(t.MULTI_STEP_SYSTEM_FLOW_An || AUTO_GENERATE_TEXTS.STORYBOARDING);
      const newStoryboard = await handleTriggerStoryboardSplit(IS_FORCE, AUTO_GENERATE_TEXTS.POSITION_TOP, IS_FORCE, currentScript);
      
      const hasValidScenes = _.isArray(newStoryboard) && _.some(newStoryboard, scene => !_.isEmpty(scene.id));
      if (!hasValidScenes) {
        throw new Error(AUTO_GENERATE_TEXTS.STORYBOARD_ERR);
      }

      setCurrentStep(WizardStep.AssetManager);
      setInfoMsg(t.MULTI_STEP_SYSTEM_FLOW_Ge_3 || AUTO_GENERATE_TEXTS.VOICEOVER);
      await handleTriggerAllSceneVoices(newStoryboard, IS_FORCE);

      setInfoMsg(t.initializingBatchGen || AUTO_GENERATE_TEXTS.IMAGES);
      await handleBatchGenerateAllImages(IS_FORCE, newStoryboard);

      setInfoMsg(AUTO_GENERATE_TEXTS.SUCCESS);
      logger.info(`[Hệ thống] ✅ ${AUTO_GENERATE_TEXTS.SUCCESS}`);
    } catch (err: any) {
      logger.error(AUTO_GENERATE_TEXTS.ERR_CODE, err);
      setErrorMsg(err.message || AUTO_GENERATE_TEXTS.GENERIC_ERR);
    } finally {
      setLoadingStates((prev) => ({ ...prev, autoGenerateAll: false }));
    }
  };

  const handleProcessExternalAudio = async (audioName: string, audioUrl: string, audioBase64: string) => {
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
      const newStoryboard = await handleTriggerStoryboardSplit(true, "top", true);
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
      const data = await safeFetchJsonWithAuth(API_ROUTES.PIPELINE_SEO, {
        originalInput: project.input?.content || "",
        config: project.config,
        seoConfig: project.seoConfig,
        rewrittenScript: project.scriptRewritten,
        bypassCache: isForce,
      });

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
        const successMsg = t.SEO_metrics_formulated_su || "Tối ưu hóa SEO thành công.";
        if (data.warning) {
          setInfoMsg(`${successMsg} (${data.warning})`);
        } else {
          setInfoMsg(successMsg);
        }
        logger.info(`[SEO] ✅ Thành công: ${successMsg}`);
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

  const startPlaybackSim = () => {
    if (!project.storyboard || _.isEmpty(project.storyboard)) return;
    setIsPlayingSim(true);
    setCurrentSimTime(0);
    setSimActiveScene(project.storyboard[0]);

    if (isProductionAudioSource(ttsAudioUrl || undefined)) {
      if (simAudioRef.current) {
        simAudioRef.current.pause();
        simAudioRef.current = null;
      }

      const audio = new Audio(ttsAudioUrl);
      audio.playbackRate = 1.0;
      audio.volume = project.voiceConfig?.volume !== undefined ? project.voiceConfig?.volume : 1.0;
      simAudioRef.current = audio;

      audio.ontimeupdate = () => {
        const currentTime = audio.currentTime;
        setCurrentSimTime(currentTime);

        const ranges = getSceneTimeRanges(project.storyboard || []);
        const matchingRange = ranges.find((r) => currentTime >= r.start && currentTime < r.end) || ranges[ranges.length - 1];

        if (matchingRange) {
          const matchingScene = project.storyboard?.find((sc) => sc.id === matchingRange.id);
          if (matchingScene && (!simActiveScene || simActiveScene.id !== matchingScene.id)) {
            setSimActiveScene(matchingScene);
          }
        }
      };

      audio.onended = () => {
        stopPlaybackSim();
      };

      audio.play().catch((err) => {
        logger.warn("AUDIO_PLAYBACK_FAILED", err);
        setErrorMsg(PRODUCTION_AUDIO_CONFIG.SOURCE_REQUIRED_ERROR);
        setIsPlayingSim(false);
      });
    } else {
      setErrorMsg(PRODUCTION_AUDIO_CONFIG.SOURCE_REQUIRED_ERROR);
      setIsPlayingSim(false);
    }
  };

  const stopPlaybackSim = () => {
    setIsPlayingSim(false);
    if (simAudioRef.current) {
      simAudioRef.current.pause();
      simAudioRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (simAudioRef.current) {
        simAudioRef.current.pause();
        simAudioRef.current = null;
      }
    };
  }, []);

  const getSceneImageUrl = (scene: any): string => {
    return _.toString(scene?.assetUrl);
  };

  const handleDownloadJSONProject = async () => {
    logAction("handleDownloadJSONProject");
    stopPlaybackSim();
    setLoadingExportType(EXPORT_TYPES.ZIP);

    try {
      setInfoMsg(t.waitExportProcess || "Đang chuẩn bị gói dự án...");
      const response = await fetch(API_ROUTES.PIPELINE_EXPORT_ZIP, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: jsonUtils.safeStringify({ projectId: project.id }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const blob = await response.blob();
      const fileName = `${project.name.replace(WHITESPACE_REGEX, "_")}${CAPCUT_CONFIG.EXPORT_BUNDLE_SUFFIX}`;
      const url = window.URL.createObjectURL(blob);
      const dlAnchorElem = document.createElement("a");
      dlAnchorElem.setAttribute("href", url);
      dlAnchorElem.setAttribute("download", fileName);
      dlAnchorElem.click();

      window.setTimeout(() => window.URL.revokeObjectURL(url), UI_MESSAGE_DURATION.OBJECT_URL_REVOKE_MS);

      const successMsg = t.Package_ZIP_created_succe || "Đã đóng gói dự án thành công.";
      setInfoMsg(successMsg);
      logger.info(`[Hệ thống] ✅ Thành công: ${successMsg}`);
    } catch (zipError: any) {
      logger.error("CAPCUT_ZIP_GEN_ERROR", zipError);
      setInfoMsg(t.Error_generating_template || "Lỗi đóng gói file ZIP.");
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
    selectVoiceForProject,
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
    sceneEditTextAllowed,
    setSceneEditTextAllowed,
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
    audioCurrentTime,
    setAudioCurrentTime,
    audioDurationState,
    setAudioDurationState,
    isPlayingRealAudio,
    setIsPlayingRealAudio,
    audioVolume,
    setAudioVolume,
    isOfflineRendering,
    setIsOfflineRendering,
    offlineRenderProgress,
    setOfflineRenderProgress,
    loadingExportType,
    setLoadingExportType,
    renderedVideoBlob,
    setRenderedVideoBlob,
    playVoicePreview,
    isPlayingSim,
    setIsPlayingSim,
    currentSimTime,
    setCurrentSimTime,
    simActiveScene,
    setSimActiveScene,
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
    handleApplyThumbnailStyle,
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
    handleRenderAllThumbnailImages,
    handleDownloadVoice,
    handleRegenerateUnifiedVoice,
    handleTriggerVoiceGenerate,
    handleTriggerAllSceneVoices,
    handleTriggerStoryboardAndVoices,
    handleAutoGenerateVideo,
    handleProcessExternalAudio,
    handleTriggerSEOBoost,
    onSaveProject,
    handleOpenExportCenter,
    startPlaybackSim,
    stopPlaybackSim,
    getSceneImageUrl,
    handleDownloadJSONProject,
    handleAnalyzeCharacter,
    handleCharacterImagesUpload,
    handleExtractCharacter,
    handleApplyCharacterToScenes,
    handleApplyCharacterToThumbnails,
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
