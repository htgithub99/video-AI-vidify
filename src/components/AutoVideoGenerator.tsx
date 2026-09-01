import { cn } from "../lib/utils";
import { useState, useEffect, useMemo, useRef } from "react";
import _ from "lodash";
import { toast } from "sonner";
import { usePresets } from "../hooks/usePresets";
import { useAutoVideoState } from "../hooks/useAutoVideoState";
import { useAutoVideoPipeline } from "../hooks/useAutoVideoPipeline";
import { AiPlanningChatModel, AiPlanningExecutionMode, AiPlanningFallbackProvider, VideoProject, ProjectInputType, ProjectKind, ProjectLanguage, ImageGenerationMode, ImageGeneratorEngine, GenerateType, BackgroundMode, TextInImageMode } from "../types";
import { type Voice as CatalogVoice } from "./VoiceSelectionDialog";
import { AppTheme, AppLanguage, VideoGenre } from "../constants/enums";
import { API_ROUTES, FLOW_DIRECT_VIDEO_CONFIG, HTTP_METHODS, CONTENT_TYPES, CONTENT_TYPE_HEADER, REFACTOR_CONSTANTS } from "../constants";
import { MEDIA_MIX_TEXTS } from "../constants/texts";
import { REGENERATION_TARGET, REGENERATION_TEXTS, CINEMATIC_CONFIG } from "../constants/config";
import { CINEMATIC_CHAT_MODEL_OPTIONS } from "../constants/cinematicConstants";
import { deleteProjectRegenerationAssets, applyProjectRegenerationReset } from "../services/projectRegenerationService";
import { Lang } from "../lib/lang";
import { getAutoVideoTexts, getImageEngineOptions, getSplitLabels, truncateWords, buildPresetPayload, applyPresetConfigToState } from "./auto-video/autoVideoGeneratorUtils";
import { jsonUtils } from "../lib/json";
import { storageUtils } from "../lib/storage";
import { logger } from "../utils/logger";
import { ActionPanelSection } from "./auto-video/ActionPanelSection";
import { AdvancedImageSettingsSection } from "./auto-video/AdvancedImageSettingsSection";
import { GenerationSettingsSection } from "./auto-video/GenerationSettingsSection";
import { StylePresetSelector } from "./auto-video/StylePresetSelector";
import { LogPanelSection } from "./auto-video/LogPanelSection";
import { PresetSection } from "./auto-video/PresetSection";
import { PreviewPanelSection } from "./auto-video/PreviewPanelSection";
import { ProjectInputSection } from "./auto-video/ProjectInputSection";
import { ScriptSettingsCard } from "./auto-video/ScriptSettingsCard";
import { ProjectSettingsSection } from "./auto-video/ProjectSettingsSection";
import { SeoPanelSection } from "./auto-video/SeoPanelSection";
import { ThumbnailsPreviewSection } from "./auto-video/ThumbnailsPreviewSection";
import { VoiceSelectionSection } from "./auto-video/VoiceSelectionSection";
import CinematicFilmSetupSection from "./cinematic/CinematicFilmSetupSection";
import ChatPlanningSettingsBlock from "./common/ChatPlanningSettingsBlock";
import { CINEMATIC_FILM_STYLE_PRESET_IDS } from "../constants/stylePresets";
import { genreLabels } from "../constants/data";
import { AutoVideoStudioSkeleton } from "./ui/Skeleton";
import { ProgressLogContext } from "../constants/progressLog";

interface AutoVideoGeneratorProps {
  currentLang: Lang;
  projects: VideoProject[];
  selectedProjectId?: string | null;
  onSelectProject: (id: string) => void;
  onCreateProject: (name: string, desc: string) => Promise<void>;
  onUpdateProject: (project: VideoProject, immediate?: boolean) => Promise<VideoProject | void> | void;
  theme?: AppTheme;
  cinematicMode?: boolean;
}

export default function AutoVideoGenerator({
  currentLang,
  projects,
  selectedProjectId,
  onSelectProject,
  onUpdateProject,
  theme = AppTheme.DARK,
  cinematicMode = false,
}: AutoVideoGeneratorProps) {
  const T = useMemo(() => getAutoVideoTexts(currentLang), [currentLang]);
  const mediaMixTexts = useMemo(() => _.get(MEDIA_MIX_TEXTS, currentLang, MEDIA_MIX_TEXTS.vi), [currentLang]);
  const splitLabelMap = useMemo(() => getSplitLabels(T), [T]);

  const stateScope = cinematicMode ? CINEMATIC_CONFIG.STATE_SCOPE : "auto";
  const { state, actions } = useAutoVideoState(selectedProjectId, projects, currentLang, stateScope);
  const { pipelineState, pipelineActions, syncSelectedProject } = useAutoVideoPipeline(projects, onUpdateProject, currentLang, stateScope);
  const selectedProjectStorageKey = cinematicMode ? REFACTOR_CONSTANTS.KEY_SELECTED_CINEMATIC_PROJECT : REFACTOR_CONSTANTS.KEY_SELECTED_AUTO_PROJECT;
  const currentLogsStorageKey = cinematicMode ? REFACTOR_CONSTANTS.KEY_CINEMATIC_PIPELINE_CURRENT_LOGS : REFACTOR_CONSTANTS.KEY_AUTO_PIPELINE_CURRENT_LOGS;
  const projectLogsStoragePrefix = cinematicMode
    ? REFACTOR_CONSTANTS.KEY_CINEMATIC_PIPELINE_PROJECT_LOGS_PREFIX
    : REFACTOR_CONSTANTS.KEY_AUTO_PIPELINE_PROJECT_LOGS_PREFIX;

  const {
    inputType,
    scriptContent,
    genre,
    language,
    duration,
    splitStrategy,
    voiceProvider,
    voiceURI,
    voiceName,
    isVoiceDialogOpen,
    generationMode,
    imageGeneratorEngine,
    generateType,
    maxVideoScenes,
    aspectRatio,
    chromeHeadless,
    stylePreset,
    styleBackgroundMode,
    styleTextInImageMode,
    imageFocusMode,
    referenceImages,
    sceneReferenceImages,
    characterImages,
    thumbnailCount,
    thumbnailStylePreset,
    thumbnailBackgroundMode,
    thumbnailTextInImageMode,
    thumbnailImageFocusMode,
    thumbnailReferenceImages,
    thumbnailSceneReferenceImages,
    projectName,
    resumeMode,
    showAdvancedImageSettings,
    rewriteLevel,
    similarityReduction,
    creativityLevel,
    factCheck,
    audience,
    writingStyle,
    hookStrategy,
    hookDuration,
    hookPosition,
    voiceSpeed,
    voicePitch,
    voiceVolume,
    promptInputMethod,
    sampleCount,
    videoDuration,
    videoResolution,
    geminiChatSpeed,
    batchDelay,
    ffmpegQuality,
    isConfigLoaded,
    musicAssetUrl,
  } = state;

  const {
    setInputType,
    setScriptContent,
    setGenre,
    setLanguage,
    setDuration,
    setSplitStrategy,
    setVoiceProvider,
    setVoiceURI,
    setVoiceName,
    setIsVoiceDialogOpen,
    setGenerationMode,
    setImageGeneratorEngine,
    setGenerateType,
    setMaxVideoScenes,
    setAspectRatio,
    setVideoDuration,
    setVideoResolution,
    setChromeHeadless,
    setStylePreset,
    setStyleBackgroundMode,
    setStyleTextInImageMode,
    setImageFocusMode,
    setThumbnailCount,
    setThumbnailStylePreset,
    setThumbnailBackgroundMode,
    setThumbnailTextInImageMode,
    setThumbnailImageFocusMode,
    setProjectName,
    setResumeMode,
    setShowAdvancedImageSettings,
    setMusicAssetUrl,
  } = actions;

  const { isProcessing, isCancelling, currentStepIndex, stepProgress, logs, renderedVideoUrl, activeCreatedProject } = pipelineState;

  const presentationProject = activeCreatedProject;
  const canContinueProject = useMemo(
    () =>
      Boolean(
        presentationProject &&
        !_.isEqual(presentationProject.status, REFACTOR_CONSTANTS.STATUS_COMPLETED) &&
        (presentationProject.generationCheckpoint || !_.isEmpty(presentationProject.storyboard)),
      ),
    [presentationProject],
  );

  const { startPipeline, cancelPipeline, setActiveCreatedProject, setRenderedVideoUrl, setLogs } = pipelineActions;

  const [filmSeriesMode, setFilmSeriesMode] = useState<"single" | "series">(CINEMATIC_CONFIG.DEFAULT_SERIES_MODE);
  const [filmEpisodeCount, setFilmEpisodeCount] = useState<number>(CINEMATIC_CONFIG.DEFAULT_EPISODE_COUNT);
  const [planningFallbackProvider, setPlanningFallbackProvider] = useState<AiPlanningFallbackProvider>(AiPlanningFallbackProvider.GeminiChat);
  const [planningChatModel, setPlanningChatModel] = useState<AiPlanningChatModel>(AiPlanningChatModel.GeminiFlash);
  const [planningExecutionMode, setPlanningExecutionMode] = useState<AiPlanningExecutionMode>(AiPlanningExecutionMode.RoomOnly);
  const [planningChromeHeadless, setPlanningChromeHeadless] = useState(true);

  useEffect(() => {
    syncSelectedProject(selectedProjectId);
  }, [selectedProjectId, projects, syncSelectedProject]);

  useEffect(() => {
    if (!selectedProjectId) return;
    const savedProvider = _.find(projects, { id: selectedProjectId })?.visualConfig?.planningFallbackProvider;
    const savedModel = _.find(projects, { id: selectedProjectId })?.visualConfig?.planningChatModel;
    const savedMode = _.find(projects, { id: selectedProjectId })?.visualConfig?.planningExecutionMode;
    const savedHeadless = _.find(projects, { id: selectedProjectId })?.visualConfig?.planningChromeHeadless;
    if (savedProvider && !_.isEqual(savedProvider, AiPlanningFallbackProvider.Disabled) && _.includes(Object.values(AiPlanningFallbackProvider), savedProvider)) {
      setPlanningFallbackProvider(savedProvider);
    } else {
      setPlanningFallbackProvider(AiPlanningFallbackProvider.GeminiChat);
    }
    if (savedModel && _.includes(Object.values(AiPlanningChatModel), savedModel)) setPlanningChatModel(savedModel);
    if (savedMode && _.includes(Object.values(AiPlanningExecutionMode), savedMode)) setPlanningExecutionMode(savedMode);
    else setPlanningExecutionMode(_.isEqual(savedProvider, AiPlanningFallbackProvider.Disabled) ? AiPlanningExecutionMode.ApiOnly : AiPlanningExecutionMode.RoomOnly);
    setPlanningChromeHeadless(_.isBoolean(savedHeadless) ? savedHeadless : true);
  }, [projects, selectedProjectId]);

  useEffect(() => {
    const availableModels = CINEMATIC_CHAT_MODEL_OPTIONS[planningFallbackProvider];
    if (!_.some(availableModels, { value: planningChatModel }) && !_.isEmpty(availableModels)) setPlanningChatModel(availableModels[0].value);
  }, [planningChatModel, planningFallbackProvider]);

  useEffect(() => {
    if (!cinematicMode) {
      if (_.isEqual(genre, VideoGenre.CINEMATIC_EPISODE)) {
        setGenre(VideoGenre.STORY_DRIVEN_VIDEO_ESSAY);
      }
      return;
    }

    if (!_.isEqual(genre, VideoGenre.CINEMATIC_EPISODE)) {
      setGenre(VideoGenre.CINEMATIC_EPISODE);
    }
    if (!_.isEqual(inputType, ProjectInputType.Idea)) {
      setInputType(ProjectInputType.Idea);
    }
    if (!_.isEqual(generateType, GenerateType.Video)) {
      setGenerateType(GenerateType.Video);
    }
    if (!_.isEqual(generationMode, ImageGenerationMode.LabsFlow)) {
      setGenerationMode(ImageGenerationMode.LabsFlow);
    }
    if (!_.includes(CINEMATIC_CONFIG.DURATIONS, duration)) {
      setDuration(CINEMATIC_CONFIG.DEFAULT_DURATION);
    }
    if (!_.includes(CINEMATIC_FILM_STYLE_PRESET_IDS, stylePreset as (typeof CINEMATIC_FILM_STYLE_PRESET_IDS)[number])) {
      setStylePreset(CINEMATIC_FILM_STYLE_PRESET_IDS[0]);
    }
    if (!_.includes(CINEMATIC_FILM_STYLE_PRESET_IDS, thumbnailStylePreset as (typeof CINEMATIC_FILM_STYLE_PRESET_IDS)[number])) {
      setThumbnailStylePreset(CINEMATIC_FILM_STYLE_PRESET_IDS[0]);
    }

    const videoEngines = getImageEngineOptions(generationMode, GenerateType.Video);
    if (!_.some(videoEngines, (option) => _.isEqual(option.value, imageGeneratorEngine))) {
      setImageGeneratorEngine(_.get(_.first(videoEngines), "value", ImageGeneratorEngine.Veo3));
    }
    if (_.isEqual(imageGeneratorEngine, ImageGeneratorEngine.GrokImagine)) {
      if (!_.includes(REFACTOR_CONSTANTS.GROK_VIDEO_DURATIONS, videoDuration)) setVideoDuration(REFACTOR_CONSTANTS.GROK_FREE_VIDEO_DURATION);
      if (!_.includes(REFACTOR_CONSTANTS.GROK_VIDEO_RESOLUTIONS, videoResolution)) setVideoResolution(REFACTOR_CONSTANTS.GROK_FREE_VIDEO_RESOLUTION);
    } else {
      if (!_.includes(REFACTOR_CONSTANTS.FLOW_VIDEO_DURATIONS, videoDuration)) setVideoDuration(FLOW_DIRECT_VIDEO_CONFIG.DEFAULT_DURATION);
      if (!_.includes(REFACTOR_CONSTANTS.FLOW_VIDEO_RESOLUTIONS, videoResolution)) setVideoResolution(FLOW_DIRECT_VIDEO_CONFIG.DEFAULT_RESOLUTION);
    }
  }, [
    cinematicMode,
    duration,
    genre,
    generationMode,
    generateType,
    imageGeneratorEngine,
    inputType,
    stylePreset,
    thumbnailStylePreset,
    videoDuration,
    videoResolution,
    setDuration,
    setGenre,
    setInputType,
    setGenerateType,
    setGenerationMode,
    setImageGeneratorEngine,
    setVideoDuration,
    setVideoResolution,
    setStylePreset,
    setThumbnailStylePreset,
  ]);

  useEffect(() => {
    if (!cinematicMode && _.includes([GenerateType.Video, GenerateType.Mixed], generateType) && !_.isEqual(generationMode, ImageGenerationMode.GeminiChat)) {
      setGenerationMode(ImageGenerationMode.GeminiChat);
    }
  }, [cinematicMode, generateType, generationMode, setGenerationMode]);

  useEffect(() => {
    if (!selectedProjectId || !isConfigLoaded || isProcessing) return;
    const foundProj = _.find(projects, { id: selectedProjectId });
    if (foundProj) {
      setActiveCreatedProject(foundProj);
      storageUtils.setAsync(selectedProjectStorageKey, selectedProjectId);
      setRenderedVideoUrl(foundProj.renderedVideoUrl || REFACTOR_CONSTANTS.VD_EMPTY_STRING);
      const cachedLogsStr = storageUtils.get(`${projectLogsStoragePrefix}${foundProj.id}`);
      const cachedLogs = cachedLogsStr ? jsonUtils.safeParse<string[]>(cachedLogsStr, []) : [];
      const projectLogs = !_.isEmpty(foundProj.generationLogs) ? foundProj.generationLogs : cachedLogs;
      setLogs(projectLogs || []);
    }
  }, [selectedProjectId, projects, isConfigLoaded, isProcessing, setActiveCreatedProject, setRenderedVideoUrl, setLogs]);

  const { data: presetsData, refetch: refetchPresets } = usePresets();
  const presets = presetsData || [];

  const [presetNameInputState, setPresetNameInputState] = useState<string>(REFACTOR_CONSTANTS.VD_EMPTY_STRING);
  const [selectedPresetId, setSelectedPresetId] = useState<string>(REFACTOR_CONSTANTS.VD_EMPTY_STRING);

  const addLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const formatted = `[${timestamp}] ${msg}`;
    pipelineActions.setLogs((prev) => {
      const updated = [...prev, formatted];
      storageUtils.set(currentLogsStorageKey, jsonUtils.safeStringify(updated));
      return updated;
    });
  };

  const handleSavePreset = async () => {
    const trimmedName = _.trim(presetNameInputState);
    if (_.isEmpty(trimmedName)) return;

    const newPresetData = buildPresetPayload(state, trimmedName);
    try {
      const res = await fetch(API_ROUTES.PRESETS, {
        method: HTTP_METHODS.POST,
        headers: { [CONTENT_TYPE_HEADER]: CONTENT_TYPES.JSON },
        body: jsonUtils.safeStringify(newPresetData),
      });
      const saved = await res.json();
      if (saved && saved.id) {
        refetchPresets();
        setPresetNameInputState(REFACTOR_CONSTANTS.VD_EMPTY_STRING);
        addLog(T.logSavedPreset(saved.name));
      }
    } catch (err) {
      logger.error(REFACTOR_CONSTANTS.VD_EMPTY_STRING, err);
    }
  };

  const handleApplyPreset = (presetId: string) => {
    const preset = _.find(presets, { id: presetId });
    if (!preset) return;
    const config = _.get(preset, "config", {});
    applyPresetConfigToState(config, actions);
    setSelectedPresetId(presetId);
    addLog(T.logAppliedPreset(preset.name));
  };

  const handleDeletePreset = async (id: string) => {
    try {
      const res = await fetch(`${API_ROUTES.PRESETS}/${id}`, {
        method: HTTP_METHODS.DELETE,
      });
      const json = await res.json();
      if (json.success) {
        refetchPresets();
        if (_.isEqual(selectedPresetId, id)) setSelectedPresetId(REFACTOR_CONSTANTS.VD_EMPTY_STRING);
      }
    } catch (err) {
      logger.error(REFACTOR_CONSTANTS.VD_EMPTY_STRING, err);
    }
  };

  const handleMusicUpload = (files: FileList) => {
    const file = _.first(Array.from(files));
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setMusicAssetUrl(_.toString(reader.result));
    reader.onerror = () => toast.error(T.musicUploadError);
    reader.readAsDataURL(file);
  };

  const handleStartAutoGenerate = (
    overrides: { forceRegenerateVoice?: boolean; forceRegenerateScenes?: boolean; resumeMode?: boolean; runIntent?: "new" | "continue" | "render_only" } = {},
  ): Promise<void> =>
    startPipeline({
      scriptContent,
      inputType: cinematicMode ? ProjectInputType.Idea : inputType,
      genre: cinematicMode ? VideoGenre.CINEMATIC_EPISODE : genre,
      language,
      duration,
      rewriteLevel: cinematicMode ? CINEMATIC_CONFIG.PIPELINE_PROFILE.REWRITE_LEVEL : rewriteLevel,
      similarityReduction: cinematicMode ? CINEMATIC_CONFIG.PIPELINE_PROFILE.SIMILARITY_REDUCTION : similarityReduction,
      creativityLevel: cinematicMode ? CINEMATIC_CONFIG.PIPELINE_PROFILE.CREATIVITY_LEVEL : creativityLevel,
      factCheck: cinematicMode ? CINEMATIC_CONFIG.PIPELINE_PROFILE.FACT_CHECK : factCheck,
      audience: cinematicMode
        ? _.isEqual(language, ProjectLanguage.VI)
          ? CINEMATIC_CONFIG.PIPELINE_PROFILE.AUDIENCE_VI
          : CINEMATIC_CONFIG.PIPELINE_PROFILE.AUDIENCE_EN
        : audience,
      writingStyle: cinematicMode ? CINEMATIC_CONFIG.PIPELINE_PROFILE.WRITING_STYLE : writingStyle,
      splitStrategy: cinematicMode ? CINEMATIC_CONFIG.PIPELINE_PROFILE.SPLIT_STRATEGY : splitStrategy,
      hookStrategy: cinematicMode ? CINEMATIC_CONFIG.PIPELINE_PROFILE.HOOK_STRATEGY : hookStrategy,
      hookDuration: cinematicMode ? CINEMATIC_CONFIG.PIPELINE_PROFILE.HOOK_DURATION : hookDuration,
      hookPosition: cinematicMode ? CINEMATIC_CONFIG.PIPELINE_PROFILE.HOOK_POSITION : hookPosition,
      voiceProvider: cinematicMode ? CINEMATIC_CONFIG.PIPELINE_PROFILE.VOICE_PROVIDER : voiceProvider,
      voiceSpeed,
      voicePitch,
      voiceVolume,
      voiceURI: cinematicMode ? REFACTOR_CONSTANTS.VD_EMPTY_STRING : voiceURI,
      voiceName: cinematicMode ? REFACTOR_CONSTANTS.VD_EMPTY_STRING : voiceName,
      generationMode: cinematicMode ? ImageGenerationMode.LabsFlow : generationMode,
      imageGeneratorEngine,
      generateType: cinematicMode ? GenerateType.Video : generateType,
      maxVideoScenes: cinematicMode ? CINEMATIC_CONFIG.UNLIMITED_VIDEO_SCENES : maxVideoScenes,
      aspectRatio,
      promptInputMethod,
      sampleCount: cinematicMode ? 1 : sampleCount,
      videoDuration,
      videoResolution,
      chromeHeadless,
      geminiChatSpeed,
      batchDelay,
      stylePreset,
      styleBackgroundMode: cinematicMode ? BackgroundMode.Contextual : styleBackgroundMode,
      styleTextInImageMode: cinematicMode ? TextInImageMode.NoText : styleTextInImageMode,
      imageFocusMode,
      referenceImages: cinematicMode ? [] : referenceImages,
      sceneReferenceImages: cinematicMode ? [] : sceneReferenceImages,
      characterImages: cinematicMode ? [] : characterImages,
      thumbnailCount,
      thumbnailStylePreset,
      thumbnailBackgroundMode,
      thumbnailTextInImageMode,
      thumbnailImageFocusMode,
      thumbnailReferenceImages: cinematicMode ? [] : thumbnailReferenceImages,
      thumbnailSceneReferenceImages: cinematicMode ? [] : thumbnailSceneReferenceImages,
      projectName,
      resumeMode: overrides.resumeMode ?? resumeMode,
      runIntent: overrides.runIntent,
      ffmpegQuality,
      selectedProjectId,
      forceRegenerateVoice: overrides.forceRegenerateVoice,
      forceRegenerateScenes: overrides.forceRegenerateScenes,
      musicAssetUrl,
      cinematicMode,
      filmFormat: cinematicMode ? filmSeriesMode : undefined,
      episodeCount: cinematicMode ? (_.isEqual(filmSeriesMode, CINEMATIC_CONFIG.SERIES_MODE.SERIES) ? filmEpisodeCount : CINEMATIC_CONFIG.SINGLE_EPISODE_COUNT) : undefined,
      planningFallbackProvider,
      planningChatModel,
      planningExecutionMode,
      planningChromeHeadless,
    });

  const recoveredPipelineProjectIdsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!isConfigLoaded || isProcessing || !activeCreatedProject) return;
    const activeProjectIsCinematic =
      _.isEqual(activeCreatedProject.projectKind, ProjectKind.Cinematic) || _.endsWith(_.toString(activeCreatedProject.name), " - Phim AI");
    if (!_.isEqual(cinematicMode, activeProjectIsCinematic)) return;
    if (!_.isEqual(activeCreatedProject.status, REFACTOR_CONSTANTS.STATUS_GENERATING)) return;
    if (_.isEmpty(activeCreatedProject.activeRunId)) return;
    if (recoveredPipelineProjectIdsRef.current.has(activeCreatedProject.id)) return;
    if (!_.isEqual(selectedProjectId, activeCreatedProject.id)) return;
    if (_.isEmpty(_.trim(scriptContent))) return;

    recoveredPipelineProjectIdsRef.current.add(activeCreatedProject.id);
    void handleStartAutoGenerate({ resumeMode: true });
  }, [activeCreatedProject, cinematicMode, isConfigLoaded, isProcessing, scriptContent, selectedProjectId]);

  const [regeneratingTarget, setRegeneratingTarget] = useState<string | null>(null);
  const regenerationTexts = useMemo(() => _.get(REGENERATION_TEXTS, currentLang, REGENERATION_TEXTS.vi), [currentLang]);

  const handleRegenerate = async (target: string) => {
    const project = activeCreatedProject;
    if (!project || isProcessing) return;

    setRegeneratingTarget(target);
    try {
      const isRenderOnly = _.isEqual(target, REGENERATION_TARGET.RENDER);
      const isDeleteSuccess = isRenderOnly || (await deleteProjectRegenerationAssets(project.id, target));
      if (!isDeleteSuccess) {
        toast.error(regenerationTexts.failed);
        return;
      }

      if (!isRenderOnly) pipelineActions.setRenderedVideoUrl(REFACTOR_CONSTANTS.VD_EMPTY_STRING);

      const { updatedProject, changed } = isRenderOnly ? { updatedProject: project, changed: false } : applyProjectRegenerationReset(project, target);
      if (changed) {
        setActiveCreatedProject(updatedProject);
        await onUpdateProject(updatedProject, true);
      }

      if (_.isEqual(target, REGENERATION_TARGET.VOICE)) {
        await handleStartAutoGenerate({ forceRegenerateVoice: true, resumeMode: true });
      } else if (_.isEqual(target, REGENERATION_TARGET.IMAGES)) {
        await handleStartAutoGenerate({ forceRegenerateScenes: true, resumeMode: true });
      } else if (_.isEqual(target, REGENERATION_TARGET.RENDER)) {
        await handleStartAutoGenerate({ resumeMode: true, runIntent: "render_only" });
      }
    } catch (err: unknown) {
      const errorMessage = _.get(err, "message", regenerationTexts.failed);
      toast.error(errorMessage);
    } finally {
      setRegeneratingTarget(null);
    }
  };

  const handleVoiceSelectAndClose = (v: CatalogVoice) => {
    setVoiceURI(v.voice_id);
    setVoiceName(v.name);
    setVoiceProvider(v.provider || REFACTOR_CONSTANTS.VD_EMPTY_STRING);
    setIsVoiceDialogOpen(false);
  };

  const lockedGenreLabel = useMemo(() => (cinematicMode ? genreLabels[VideoGenre.CINEMATIC_EPISODE] : undefined), [cinematicMode]);

  if (!isConfigLoaded) {
    return <AutoVideoStudioSkeleton />;
  }

  return (
    <div className={cn("creation-workspace w-full h-full min-h-0 flex flex-col overflow-y-auto p-4 sm:p-6 bg-slate-955 font-sans text-slate-100 custom-scrollbar")}>
      <div className={cn("bg-gradient-to-b from-slate-900/90 to-slate-950/95 rounded-xl p-4 sm:p-6 space-y-5 shadow-2xl relative overflow-visible w-full")}>
        {!cinematicMode && (
          <PresetSection
            presets={presets}
            selectedPresetId={selectedPresetId}
            presetNameInputState={presetNameInputState}
            setPresetNameInputState={setPresetNameInputState}
            handleSavePreset={handleSavePreset}
            handleApplyPreset={handleApplyPreset}
            handleDeletePreset={handleDeletePreset}
            T={T}
            truncateWords={truncateWords}
          />
        )}

        <div className={cn("grid grid-cols-1 lg:grid-cols-3 gap-6")}>
          <div className={cn("lg:col-span-2 flex flex-col gap-5 h-full justify-stretch min-w-0")}>
            {cinematicMode ? (
              <CinematicFilmSetupSection
                idea={scriptContent}
                setIdea={setScriptContent}
                language={language}
                setLanguage={setLanguage}
                duration={duration}
                setDuration={setDuration}
                seriesMode={filmSeriesMode}
                setSeriesMode={setFilmSeriesMode}
                episodeCount={filmEpisodeCount}
                setEpisodeCount={setFilmEpisodeCount}
                planningFallbackProvider={planningFallbackProvider}
                setPlanningFallbackProvider={setPlanningFallbackProvider}
                planningChatModel={planningChatModel}
                setPlanningChatModel={setPlanningChatModel}
                planningExecutionMode={planningExecutionMode}
                setPlanningExecutionMode={setPlanningExecutionMode}
                planningChromeHeadless={planningChromeHeadless}
                setPlanningChromeHeadless={setPlanningChromeHeadless}
                currentLang={currentLang}
              />
            ) : (
              <ProjectInputSection inputType={inputType} setInputType={setInputType} scriptContent={scriptContent} setScriptContent={setScriptContent} T={T} />
            )}

            {!cinematicMode && (
              <ChatPlanningSettingsBlock
                provider={planningFallbackProvider}
                model={planningChatModel}
                onProviderChange={setPlanningFallbackProvider}
                onModelChange={setPlanningChatModel}
                executionMode={planningExecutionMode}
                onExecutionModeChange={setPlanningExecutionMode}
                chromeHeadless={planningChromeHeadless}
                onChromeHeadlessChange={setPlanningChromeHeadless}
                currentLang={currentLang}
              />
            )}

            {!cinematicMode && (
              <VoiceSelectionSection
                voiceName={voiceName}
                voiceURI={voiceURI}
                voiceProvider={voiceProvider}
                isVoiceDialogOpen={isVoiceDialogOpen}
                setIsVoiceDialogOpen={setIsVoiceDialogOpen}
                voiceDialogPersistenceScope={CINEMATIC_CONFIG.PERSISTENCE_SCOPE}
                currentLang={currentLang}
                handleVoiceSelect={handleVoiceSelectAndClose}
                truncateWords={truncateWords}
                T={T}
              />
            )}

            <div className={cn("bg-slate-955/50 rounded-xl p-5 space-y-5 shadow-inner w-full")}>
              <GenerationSettingsSection
                generationMode={generationMode}
                setGenerationMode={setGenerationMode}
                imageGeneratorEngine={imageGeneratorEngine}
                setImageGeneratorEngine={setImageGeneratorEngine}
                generateType={generateType}
                setGenerateType={setGenerateType}
                maxVideoScenes={maxVideoScenes}
                setMaxVideoScenes={setMaxVideoScenes}
                aspectRatio={aspectRatio}
                setAspectRatio={setAspectRatio}
                T={T}
                getImageEngineOptions={getImageEngineOptions}
                mediaMixTexts={mediaMixTexts}
                forceVideoOnly={cinematicMode}
                chromeHeadless={chromeHeadless}
                setChromeHeadless={setChromeHeadless}
                videoDuration={videoDuration}
                setVideoDuration={setVideoDuration}
                videoResolution={videoResolution}
                setVideoResolution={setVideoResolution}
              />

              {!cinematicMode && (
                <AdvancedImageSettingsSection
                  showAdvancedImageSettings={showAdvancedImageSettings}
                  setShowAdvancedImageSettings={setShowAdvancedImageSettings}
                  chromeHeadless={chromeHeadless}
                  setChromeHeadless={setChromeHeadless}
                  resumeMode={resumeMode}
                  setResumeMode={setResumeMode}
                  backgroundMode={styleBackgroundMode}
                  setBackgroundMode={setStyleBackgroundMode}
                  textMode={styleTextInImageMode}
                  setTextMode={setStyleTextInImageMode}
                  imageFocusMode={imageFocusMode}
                  setImageFocusMode={setImageFocusMode}
                  language={currentLang as AppLanguage}
                  T={T}
                />
              )}

              <div className={cn("pt-2 border-t border-slate-800/80")}>
                <StylePresetSelector
                  selectedStyle={stylePreset}
                  onSelectStyle={setStylePreset}
                  language={currentLang}
                  accentColor={CINEMATIC_CONFIG.ACCENT_COLOR_BLUE}
                  genre={genre}
                  allowedPresetIds={cinematicMode ? CINEMATIC_FILM_STYLE_PRESET_IDS : undefined}
                />
              </div>
            </div>

            <ProjectSettingsSection
              genre={genre}
              projectName={projectName}
              setProjectName={setProjectName}
              thumbnailCount={thumbnailCount}
              setThumbnailCount={setThumbnailCount}
              thumbnailStylePreset={thumbnailStylePreset}
              setThumbnailStylePreset={setThumbnailStylePreset}
              backgroundMode={thumbnailBackgroundMode}
              setBackgroundMode={setThumbnailBackgroundMode}
              textInImageMode={thumbnailTextInImageMode}
              setTextInImageMode={setThumbnailTextInImageMode}
              imageFocusMode={thumbnailImageFocusMode}
              setImageFocusMode={setThumbnailImageFocusMode}
              language={currentLang as AppLanguage}
              T={T}
              musicAssetUrl={musicAssetUrl}
              onMusicUpload={handleMusicUpload}
              onRemoveMusic={() => setMusicAssetUrl(REFACTOR_CONSTANTS.VD_EMPTY_STRING)}
              allowedStylePresetIds={cinematicMode ? CINEMATIC_FILM_STYLE_PRESET_IDS : undefined}
            />
          </div>

          <div className={cn("space-y-6 flex flex-col min-w-0")}>
            <ActionPanelSection
              scriptContent={scriptContent}
              isProcessing={isProcessing}
              isCancelling={isCancelling}
              currentStepIndex={currentStepIndex}
              stepProgress={stepProgress}
              handleStartAutoGenerate={() => handleStartAutoGenerate({ resumeMode: false, runIntent: "new" })}
              handleContinueAutoGenerate={() => handleStartAutoGenerate({ resumeMode: true, runIntent: "continue" })}
              canContinue={canContinueProject}
              cancelPipeline={cancelPipeline}
              T={T}
            />

            {!cinematicMode && (
              <ScriptSettingsCard
                genre={genre}
                setGenre={setGenre}
                language={language}
                setLanguage={setLanguage}
                duration={duration}
                setDuration={setDuration}
                splitStrategy={splitStrategy}
                setSplitStrategy={setSplitStrategy}
                splitLabelMap={splitLabelMap}
                T={T}
                lockedGenreLabel={lockedGenreLabel}
              />
            )}

            <LogPanelSection
              logs={logs}
              theme={theme}
              T={T}
              language={currentLang}
              context={cinematicMode ? ProgressLogContext.Cinematic : ProgressLogContext.Automatic}
            />

            <PreviewPanelSection
              renderedVideoUrl={renderedVideoUrl}
              projectName={projectName}
              activeCreatedProject={presentationProject}
              isProcessing={isProcessing}
              regeneratingTarget={regeneratingTarget}
              handleRegenerate={handleRegenerate}
              onSelectProject={onSelectProject}
              T={T}
              regenerationTexts={regenerationTexts}
              showVoiceRegeneration={!cinematicMode}
              regenerateVideoClips={cinematicMode}
            />

            <ThumbnailsPreviewSection activeCreatedProject={presentationProject} />

            <SeoPanelSection activeCreatedProject={presentationProject} />
          </div>
        </div>
      </div>
    </div>
  );
}
