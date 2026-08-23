import { useState, useEffect, useMemo, useRef } from "react";
import _ from "lodash";
import { usePresets } from "../hooks/usePresets";
import { useAutoVideoState } from "../hooks/useAutoVideoState";
import { useAutoVideoPipeline } from "../hooks/useAutoVideoPipeline";
import {
  VideoProject,
  ProjectLanguage,
  AspectRatio,
  ImageGenerationMode,
  GenerateType,
  BackgroundMode,
  ThumbnailTextMode,
  ImageFocusMode,
} from "../types";
import { type Voice as CatalogVoice } from "./VoiceSelectionDialog";
import { AppTheme, AppLanguage } from "../constants/enums";
import {
  API_ROUTES,
  HTTP_METHODS,
  CONTENT_TYPES,
  CONTENT_TYPE_HEADER,
  REFACTOR_CONSTANTS,
  API_HEADERS,
  STORAGE_KEYS,
} from "../constants";
import { MEDIA_MIX_TEXTS, PRESET_CONSTANTS } from "../constants/texts";
import { REGENERATION_TARGET, REGENERATION_TEXTS, PROJECT_ASSET_GROUP, AUTO_GENERATOR_CONSTANTS } from "../constants/config";
import { clearAllProjectVisualOutputs, clearProjectVideoOutputs } from "../services/projectRegenerationService";
import { Lang } from "../lib/lang";
import { getAutoVideoTexts, getImageEngineOptions, getSplitLabels, truncateWords } from "./auto-video/autoVideoGeneratorUtils";
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
import { ProjectSettingsSection } from "./auto-video/ProjectSettingsSection";
import { SeoPanelSection } from "./auto-video/SeoPanelSection";
import { ThumbnailsPreviewSection } from "./auto-video/ThumbnailsPreviewSection";
import { VoiceSelectionSection } from "./auto-video/VoiceSelectionSection";
import { toast } from "sonner";
import { normalizeBackgroundMode, SCENE_TEXT_MODE } from "../services/visualConfigModeService";

interface AutoVideoGeneratorProps {
  currentLang: Lang;
  projects: VideoProject[];
  selectedProjectId?: string | null;
  onSelectProject: (id: string) => void;
  onCreateProject: (name: string, desc: string) => Promise<void>;
  onUpdateProject: (project: VideoProject, immediate?: boolean) => Promise<VideoProject | void> | void;
  theme?: AppTheme;
}

export default function AutoVideoGenerator({
  currentLang,
  projects,
  selectedProjectId,
  onSelectProject,
  onUpdateProject,
  theme = AppTheme.DARK,
}: AutoVideoGeneratorProps) {
  const T = useMemo(() => getAutoVideoTexts(currentLang), [currentLang]);
  const mediaMixTexts = useMemo(() => _.get(MEDIA_MIX_TEXTS, currentLang, MEDIA_MIX_TEXTS.vi), [currentLang]);
  const splitLabelMap = useMemo(() => getSplitLabels(T), [T]);

  const { state, actions } = useAutoVideoState(selectedProjectId, projects, currentLang);
  const { pipelineState, pipelineActions, syncSelectedProject } = useAutoVideoPipeline(projects, onUpdateProject, currentLang);

  const {
    inputType, scriptContent, genre, language, duration, splitStrategy,
    voiceProvider, voiceURI, voiceName, isVoiceDialogOpen,
    generationMode, imageGeneratorEngine, generateType, maxVideoScenes,
    aspectRatio, chromeHeadless, stylePreset, styleBackgroundMode, styleTextInImageMode, imageFocusMode, referenceImages, sceneReferenceImages,
    characterImages, thumbnailCount, thumbnailStylePreset, thumbnailBackgroundMode, thumbnailTextInImageMode, thumbnailImageFocusMode, thumbnailReferenceImages,
    thumbnailSceneReferenceImages,
    projectName, resumeMode, showAdvancedImageSettings,
    rewriteLevel, similarityReduction, creativityLevel, factCheck, audience, writingStyle,
    hookStrategy, hookDuration, hookPosition, voiceSpeed, voicePitch, voiceVolume,
    promptInputMethod, sampleCount, videoDuration, geminiChatSpeed, batchDelay,
    ffmpegQuality, isConfigLoaded, musicAssetUrl,
  } = state;

  const {
    setInputType, setScriptContent, setGenre, setLanguage, setDuration, setSplitStrategy,
    setVoiceProvider, setVoiceURI, setVoiceName, setIsVoiceDialogOpen,
    setGenerationMode, setImageGeneratorEngine, setGenerateType, setMaxVideoScenes,
    setAspectRatio, setChromeHeadless, setStylePreset, setStyleBackgroundMode, setStyleTextInImageMode, setImageFocusMode,
    setThumbnailCount, setThumbnailStylePreset, setThumbnailBackgroundMode, setThumbnailTextInImageMode, setThumbnailImageFocusMode,
    setProjectName, setResumeMode, setShowAdvancedImageSettings, setMusicAssetUrl,
  } = actions;

  const { isProcessing, isCancelling, currentStepIndex, stepProgress, logs, renderedVideoUrl, activeCreatedProject } = pipelineState;
  const { startPipeline, cancelPipeline, setActiveCreatedProject } = pipelineActions;

  useEffect(() => {
    syncSelectedProject(selectedProjectId);
  }, [selectedProjectId, projects, syncSelectedProject]);

  useEffect(() => {
    if (!selectedProjectId || !isConfigLoaded || isProcessing) return;
    const foundProj = _.find(projects, { id: selectedProjectId });
    if (foundProj) {
      setActiveCreatedProject(foundProj);
      storageUtils.setAsync(REFACTOR_CONSTANTS.KEY_SELECTED_AUTO_PROJECT, selectedProjectId);
      pipelineActions.setRenderedVideoUrl(foundProj.renderedVideoUrl || REFACTOR_CONSTANTS.VD_EMPTY_STRING);
      const cachedLogsStr = storageUtils.get(`${REFACTOR_CONSTANTS.KEY_AUTO_PIPELINE_PROJECT_LOGS_PREFIX}${foundProj.id}`);
      const cachedLogs = cachedLogsStr ? jsonUtils.safeParse<string[]>(cachedLogsStr, []) : [];
      const projectLogs = !_.isEmpty(foundProj.generationLogs) ? foundProj.generationLogs : cachedLogs;
      if (!_.isEmpty(projectLogs)) {
        pipelineActions.setLogs(projectLogs);
      }
    }
  }, [selectedProjectId, projects, isConfigLoaded, isProcessing, setActiveCreatedProject, pipelineActions]);

  const { data: presetsData, refetch: refetchPresets } = usePresets();
  const presets = presetsData || [];

  const [presetNameInputState, setPresetNameInputState] = useState<string>(REFACTOR_CONSTANTS.VD_EMPTY_STRING);
  const [selectedPresetId, setSelectedPresetId] = useState<string>(REFACTOR_CONSTANTS.VD_EMPTY_STRING);

  const addLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const formatted = `[${timestamp}] ${msg}`;
    pipelineActions.setLogs((prev) => {
      const updated = [...prev, formatted];
      storageUtils.set(REFACTOR_CONSTANTS.KEY_AUTO_PIPELINE_CURRENT_LOGS, jsonUtils.safeStringify(updated));
      return updated;
    });
  };

  const handleSavePreset = async () => {
    const trimmedName = _.trim(presetNameInputState);
    if (_.isEmpty(trimmedName)) return;
    const newPresetData = {
      id: `${PRESET_CONSTANTS.ID_PREFIX}${Date.now()}`,
      name: trimmedName,
      config: {
        [REFACTOR_CONSTANTS.AVG_INPUT_TYPE_KEY]: inputType,
        [REFACTOR_CONSTANTS.AVG_GENRE_KEY]: genre,
        [REFACTOR_CONSTANTS.AVG_LANGUAGE_KEY]: language,
        [REFACTOR_CONSTANTS.AVG_DURATION_KEY]: duration,
        [REFACTOR_CONSTANTS.AVG_SPLIT_STRATEGY_KEY]: splitStrategy,
        [REFACTOR_CONSTANTS.AVG_VOICE_PROVIDER_KEY]: voiceProvider,
        [REFACTOR_CONSTANTS.AVG_VOICE_URI_KEY]: voiceURI,
        [REFACTOR_CONSTANTS.AVG_VOICE_NAME_KEY]: voiceName,
        [REFACTOR_CONSTANTS.AVG_GENERATION_MODE_KEY]: generationMode,
        [REFACTOR_CONSTANTS.AVG_GENERATE_TYPE_KEY]: generateType,
        [REFACTOR_CONSTANTS.AVG_MAX_VIDEO_SCENES_KEY]: maxVideoScenes,
        [REFACTOR_CONSTANTS.AVG_IMAGE_GENERATOR_ENGINE_KEY]: imageGeneratorEngine,
        [REFACTOR_CONSTANTS.AVG_ASPECT_RATIO_KEY]: aspectRatio,
        [REFACTOR_CONSTANTS.AVG_STYLE_PRESET_KEY]: stylePreset,
        [REFACTOR_CONSTANTS.STYLE_BACKGROUND_MODE_KEY]: styleBackgroundMode,
        [REFACTOR_CONSTANTS.STYLE_TEXT_IN_IMAGE_MODE_KEY]: styleTextInImageMode,
        [REFACTOR_CONSTANTS.IMAGE_FOCUS_MODE_KEY]: imageFocusMode,
        [REFACTOR_CONSTANTS.AVG_THUMBNAIL_COUNT_KEY]: thumbnailCount,
        [REFACTOR_CONSTANTS.AVG_THUMBNAIL_STYLE_PRESET_KEY]: thumbnailStylePreset,
        [REFACTOR_CONSTANTS.THUMBNAIL_BACKGROUND_MODE_KEY]: thumbnailBackgroundMode,
        [REFACTOR_CONSTANTS.THUMBNAIL_TEXT_IN_IMAGE_MODE_KEY]: thumbnailTextInImageMode,
        [REFACTOR_CONSTANTS.THUMBNAIL_IMAGE_FOCUS_MODE_KEY]: thumbnailImageFocusMode,
      },
    };
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
    const c = _.get(preset, "config", {});
    const applyIfExists = (key: string, setter: (v: unknown) => void) => {
      const val = _.get(c, key);
      if (!_.isUndefined(val)) setter(val);
    };
    applyIfExists(REFACTOR_CONSTANTS.AVG_GENRE_KEY, (v) => setGenre(v as string));
    applyIfExists(REFACTOR_CONSTANTS.AVG_LANGUAGE_KEY, (v) => setLanguage(v as ProjectLanguage));
    applyIfExists(REFACTOR_CONSTANTS.AVG_DURATION_KEY, (v) => setDuration(v as string));
    applyIfExists(REFACTOR_CONSTANTS.AVG_SPLIT_STRATEGY_KEY, (v) => setSplitStrategy(v as string));
    applyIfExists(REFACTOR_CONSTANTS.AVG_VOICE_URI_KEY, (v) => setVoiceURI(v as string));
    applyIfExists(REFACTOR_CONSTANTS.AVG_VOICE_NAME_KEY, (v) => setVoiceName(v as string));
    applyIfExists(REFACTOR_CONSTANTS.AVG_ASPECT_RATIO_KEY, (v) => setAspectRatio(v as AspectRatio));
    applyIfExists(REFACTOR_CONSTANTS.AVG_GENERATION_MODE_KEY, (v) => setGenerationMode(v as ImageGenerationMode));
    applyIfExists(REFACTOR_CONSTANTS.AVG_GENERATE_TYPE_KEY, (v) => setGenerateType(v as GenerateType));
    applyIfExists(REFACTOR_CONSTANTS.AVG_STYLE_PRESET_KEY, (v) => setStylePreset(v as string));
    applyIfExists(REFACTOR_CONSTANTS.STYLE_BACKGROUND_MODE_KEY, (v) => setStyleBackgroundMode(normalizeBackgroundMode(v as BackgroundMode)));
    setStyleTextInImageMode(SCENE_TEXT_MODE);
    applyIfExists(REFACTOR_CONSTANTS.IMAGE_FOCUS_MODE_KEY, (v) => setImageFocusMode(v as ImageFocusMode));
    applyIfExists(REFACTOR_CONSTANTS.AVG_MAX_VIDEO_SCENES_KEY, (v) => setMaxVideoScenes(v as number));
    applyIfExists(REFACTOR_CONSTANTS.AVG_THUMBNAIL_COUNT_KEY, (v) => setThumbnailCount(v as number));
    applyIfExists(REFACTOR_CONSTANTS.AVG_THUMBNAIL_STYLE_PRESET_KEY, (v) => setThumbnailStylePreset(v as string));
    applyIfExists(REFACTOR_CONSTANTS.THUMBNAIL_BACKGROUND_MODE_KEY, (v) => setThumbnailBackgroundMode(normalizeBackgroundMode(v as BackgroundMode)));
    applyIfExists(REFACTOR_CONSTANTS.THUMBNAIL_TEXT_IN_IMAGE_MODE_KEY, (v) => setThumbnailTextInImageMode(v as ThumbnailTextMode));
    applyIfExists(REFACTOR_CONSTANTS.THUMBNAIL_IMAGE_FOCUS_MODE_KEY, (v) => setThumbnailImageFocusMode(v as ImageFocusMode));
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

  const handleStartAutoGenerate = (overrides: { forceRegenerateVoice?: boolean; forceRegenerateScenes?: boolean; resumeMode?: boolean } = {}): Promise<void> => (
    startPipeline({
      scriptContent, inputType, genre, language, duration, rewriteLevel,
      similarityReduction, creativityLevel, factCheck, audience, writingStyle,
      splitStrategy, hookStrategy, hookDuration, hookPosition,
      voiceProvider, voiceSpeed, voicePitch, voiceVolume, voiceURI, voiceName,
      generationMode, imageGeneratorEngine, generateType, maxVideoScenes,
      aspectRatio, promptInputMethod, sampleCount, videoDuration,
      chromeHeadless, geminiChatSpeed, batchDelay, stylePreset, styleBackgroundMode, styleTextInImageMode, imageFocusMode,
      referenceImages, sceneReferenceImages, characterImages,
      thumbnailCount, thumbnailStylePreset, thumbnailBackgroundMode, thumbnailTextInImageMode, thumbnailImageFocusMode, thumbnailReferenceImages,
      thumbnailSceneReferenceImages,
      projectName, resumeMode: overrides.resumeMode ?? resumeMode, ffmpegQuality, selectedProjectId,
      forceRegenerateVoice: overrides.forceRegenerateVoice,
      forceRegenerateScenes: overrides.forceRegenerateScenes,
      musicAssetUrl,
    })
  );

  // The automatic pipeline runs in the browser. A tab reload destroys the
  // in-memory async chain, but its latest project checkpoint intentionally
  // remains `Generating`. Resume that orphaned run once after hydration so a
  // reload cannot leave an otherwise recoverable video permanently stuck.
  const recoveredPipelineProjectIdsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!isConfigLoaded || isProcessing || !activeCreatedProject) return;
    if (!_.isEqual(activeCreatedProject.status, REFACTOR_CONSTANTS.STATUS_GENERATING)) return;
    if (_.isEmpty(activeCreatedProject.activeRunId)) return;
    if (recoveredPipelineProjectIdsRef.current.has(activeCreatedProject.id)) return;
    if (!_.isEqual(selectedProjectId, activeCreatedProject.id)) return;
    if (_.isEmpty(_.trim(scriptContent))) return;

    recoveredPipelineProjectIdsRef.current.add(activeCreatedProject.id);
    void handleStartAutoGenerate({ resumeMode: true });
  }, [
    activeCreatedProject,
    isConfigLoaded,
    isProcessing,
    scriptContent,
    selectedProjectId,
  ]);

  const [regeneratingTarget, setRegeneratingTarget] = useState<string | null>(null);
  const regenerationTexts = useMemo(() => _.get(REGENERATION_TEXTS, currentLang, REGENERATION_TEXTS.vi), [currentLang]);

  const deleteProjectRegenerationAssets = async (projectId: string, target: string): Promise<boolean> => {
    const groups = _.isEqual(target, REGENERATION_TARGET.VOICE)
      ? [PROJECT_ASSET_GROUP.VOICES, PROJECT_ASSET_GROUP.VIDEOS]
      : _.isEqual(target, REGENERATION_TARGET.IMAGES)
        ? [PROJECT_ASSET_GROUP.VISUALS]
        : [PROJECT_ASSET_GROUP.VIDEOS];

    for (const group of groups) {
      const response = await fetch(`${API_ROUTES.PIPELINE_PROJECT_ASSETS}/${projectId}/${group}`, {
        method: HTTP_METHODS.DELETE,
        headers: { [API_HEADERS.LICENSE_KEY]: storageUtils.get(STORAGE_KEYS.LICENSE_KEY) || REFACTOR_CONSTANTS.VD_EMPTY_STRING },
      });
      if (!response.ok) return false;
    }
    return true;
  };

  const applyProjectRegenerationReset = (project: VideoProject, target: string): { updatedProject: VideoProject; changed: boolean } => {
    let updatedProject = _.cloneDeep(project);
    let changed = false;
    const isVoice = _.isEqual(target, REGENERATION_TARGET.VOICE);
    const isImages = _.isEqual(target, REGENERATION_TARGET.IMAGES);
    const isVideos = _.isEqual(target, REGENERATION_TARGET.RENDER);

    if (isVoice && !_.isEmpty(updatedProject.voiceConfig)) {
      _.set(updatedProject.voiceConfig, AUTO_GENERATOR_CONSTANTS.VOICE_CONFIG_AUDIO_BASE64_PATH, REFACTOR_CONSTANTS.VD_EMPTY_STRING);
      _.set(updatedProject.voiceConfig, AUTO_GENERATOR_CONSTANTS.AVG_AUDIO_URL_KEY, REFACTOR_CONSTANTS.VD_EMPTY_STRING);
      updatedProject.renderedVideoUrl = undefined;
      updatedProject.storyboard = _.map(_.defaultTo(updatedProject.storyboard, []), sc => ({
        ...sc,
        audioUrl: undefined,
        audioBase64: undefined,
      }));
      changed = true;
    } else if (isImages) {
      updatedProject = clearAllProjectVisualOutputs(updatedProject);
      changed = true;
    } else if (isVideos) {
      updatedProject = clearProjectVideoOutputs(updatedProject);
      changed = true;
    }
    return { updatedProject, changed };
  };

  const handleRegenerate = async (target: string) => {
    const project = activeCreatedProject;
    if (!project || isProcessing) return;

    setRegeneratingTarget(target);
    try {
      const isDeleteSuccess = await deleteProjectRegenerationAssets(project.id, target);
      if (!isDeleteSuccess) {
        toast.error(regenerationTexts.failed);
        return;
      }

      pipelineActions.setRenderedVideoUrl(REFACTOR_CONSTANTS.VD_EMPTY_STRING);

      const { updatedProject, changed } = applyProjectRegenerationReset(project, target);
      if (changed) {
        setActiveCreatedProject(updatedProject);
        await onUpdateProject(updatedProject, true);
      }

      const isVoice = _.isEqual(target, REGENERATION_TARGET.VOICE);
      const isImages = _.isEqual(target, REGENERATION_TARGET.IMAGES);
      const isVideos = _.isEqual(target, REGENERATION_TARGET.RENDER);

      if (isVoice) {
        await handleStartAutoGenerate({ forceRegenerateVoice: true, resumeMode: true });
      } else if (isImages) {
        await handleStartAutoGenerate({ forceRegenerateScenes: true, resumeMode: true });
      } else if (isVideos) {
        await handleStartAutoGenerate({ resumeMode: true });
      }
    } catch (err: any) {
      toast.error(err.message || regenerationTexts.failed);
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

  return (
    <div className="h-full flex flex-col overflow-y-auto bg-slate-955 font-sans text-slate-100">
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0">
        <div className="lg:col-span-7 h-auto lg:h-full overflow-y-visible lg:overflow-y-auto p-5 space-y-4 border-b lg:border-b-0 lg:border-r border-slate-800 scrollbar-none">
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

          <div className="space-y-4">
            <ProjectInputSection
              inputType={inputType}
              setInputType={setInputType}
              scriptContent={scriptContent}
              setScriptContent={setScriptContent}
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
            />

            <VoiceSelectionSection
              voiceName={voiceName}
              voiceURI={voiceURI}
              voiceProvider={voiceProvider}
              isVoiceDialogOpen={isVoiceDialogOpen}
              setIsVoiceDialogOpen={setIsVoiceDialogOpen}
              voiceDialogPersistenceScope="auto_video_generator"
              currentLang={currentLang}
              handleVoiceSelect={handleVoiceSelectAndClose}
              truncateWords={truncateWords}
              T={T}
            />

            <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-5 space-y-4 shadow-xl backdrop-blur-md">
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
              />

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

              <div className="pt-2 border-t border-slate-800/80">
                <StylePresetSelector
                  selectedStyle={stylePreset}
                  onSelectStyle={setStylePreset}
                  language={currentLang}
                  accentColor="blue"
                />
              </div>
            </div>

            <ProjectSettingsSection
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
            />
          </div>
        </div>

        <div className="lg:col-span-5 h-auto lg:h-full overflow-y-visible lg:overflow-y-auto p-5 bg-slate-955 space-y-5 flex flex-col justify-between scrollbar-none">
          <ActionPanelSection
            scriptContent={scriptContent}
            isProcessing={isProcessing}
            isCancelling={isCancelling}
            currentStepIndex={currentStepIndex}
            stepProgress={stepProgress}
            handleStartAutoGenerate={handleStartAutoGenerate}
            cancelPipeline={cancelPipeline}
            T={T}
          />

          <LogPanelSection
            logs={logs}
            theme={theme}
            T={T}
            language={currentLang}
          />

          <PreviewPanelSection
            renderedVideoUrl={renderedVideoUrl}
            projectName={projectName}
            activeCreatedProject={activeCreatedProject}
            isProcessing={isProcessing}
            regeneratingTarget={regeneratingTarget}
            handleRegenerate={handleRegenerate}
            onSelectProject={onSelectProject}
            T={T}
            regenerationTexts={regenerationTexts}
          />

          <ThumbnailsPreviewSection
            activeCreatedProject={activeCreatedProject}
          />

          <SeoPanelSection
            activeCreatedProject={activeCreatedProject}
          />
        </div>
      </div>
    </div>
  );
}
