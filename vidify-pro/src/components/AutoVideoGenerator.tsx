import React, { useState, useEffect } from "react";
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
  VoiceConfig,
  BackgroundMode,
} from "../types";
import { type Voice as CatalogVoice } from "./VoiceSelectionDialog";
import { AppTab, AppTheme, AppLanguage } from "../constants/enums";
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
import { REGENERATION_TARGET, REGENERATION_TEXTS, PROJECT_ASSET_GROUP } from "../constants/config";
import { Lang } from "../lib/lang";
import { getAutoVideoTexts, getImageEngineOptions, getSplitLabels, truncateWords } from "./auto-video/autoVideoGeneratorUtils";
import { jsonUtils } from "../lib/json";
import { storageUtils } from "../lib/storage";
import { logger } from "../utils/logger";
import { readFilesAsDataURL } from "../lib/shared-utils";
import { Zap, Sliders } from "lucide-react";

import { ActionPanelSection } from "./auto-video/ActionPanelSection";
import { AdvancedImageSettingsSection } from "./auto-video/AdvancedImageSettingsSection";
import { GenerationSettingsSection } from "./auto-video/GenerationSettingsSection";
import { ImageReferenceSection } from "./auto-video/ImageReferenceSection";
import { LogPanelSection } from "./auto-video/LogPanelSection";
import { PresetSection } from "./auto-video/PresetSection";
import { PreviewPanelSection } from "./auto-video/PreviewPanelSection";
import { ProjectInputSection } from "./auto-video/ProjectInputSection";
import { ProjectSettingsSection } from "./auto-video/ProjectSettingsSection";
import { SeoPanelSection } from "./auto-video/SeoPanelSection";
import { ThumbnailsPanelSection } from "./auto-video/ThumbnailsPanelSection";
import { VoiceSelectionSection } from "./auto-video/VoiceSelectionSection";
import { toast } from "sonner";

interface AutoVideoGeneratorProps {
  currentLang: Lang;
  projects: VideoProject[];
  selectedProjectId?: string | null;
  onSelectProject: (id: string) => void;
  onCreateProject: (name: string, desc: string) => Promise<void>;
  onUpdateProject: (project: VideoProject, immediate?: boolean) => Promise<void> | void;
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
  const T = getAutoVideoTexts(currentLang);
  const mediaMixTexts = MEDIA_MIX_TEXTS[currentLang as "vi" | "en"] || MEDIA_MIX_TEXTS.vi;
  const splitLabelMap = getSplitLabels(T);

  const { state, actions } = useAutoVideoState(selectedProjectId, projects, currentLang);
  const { pipelineState, pipelineActions, syncSelectedProject } = useAutoVideoPipeline(projects, onUpdateProject, currentLang);

  const {
    inputType, scriptContent, genre, language, duration, splitStrategy,
    voiceProvider, voiceURI, voiceName, isVoiceDialogOpen,
    generationMode, imageGeneratorEngine, generateType, maxVideoScenes,
    aspectRatio, chromeHeadless, stylePreset, styleBackgroundMode, styleTextInImageMode, referenceImages, sceneReferenceImages,
    characterImages, thumbnailCount, thumbnailStylePreset, thumbnailBackgroundMode, thumbnailTextInImageMode, thumbnailReferenceImages,
    projectName, resumeMode, showAdvancedImageSettings,
    rewriteLevel, similarityReduction, creativityLevel, factCheck, audience, writingStyle,
    hookStrategy, hookDuration, hookPosition, voiceSpeed, voicePitch, voiceVolume,
    promptInputMethod, sampleCount, videoDuration, geminiChatSpeed, batchDelay,
    ffmpegQuality, isConfigLoaded,
  } = state;

  const {
    setInputType, setScriptContent, setGenre, setLanguage, setDuration, setSplitStrategy,
    setVoiceProvider, setVoiceURI, setVoiceName, setIsVoiceDialogOpen,
    setGenerationMode, setImageGeneratorEngine, setGenerateType, setMaxVideoScenes,
    setAspectRatio, setChromeHeadless, setStylePreset, setStyleBackgroundMode, setStyleTextInImageMode,
    setReferenceImages, setSceneReferenceImages,
    setThumbnailCount, setThumbnailStylePreset, setThumbnailBackgroundMode, setThumbnailTextInImageMode, setThumbnailReferenceImages,
    setProjectName, setResumeMode, setShowAdvancedImageSettings,
  } = actions;

  const { isProcessing, isCancelling, currentStepIndex, stepProgress, logs, renderedVideoUrl, activeCreatedProject } = pipelineState;
  const { startPipeline, cancelPipeline, setActiveCreatedProject } = pipelineActions;

  useEffect(() => {
    syncSelectedProject(selectedProjectId);
  }, [selectedProjectId, projects]);

  useEffect(() => {
    if (!selectedProjectId || !isConfigLoaded || isProcessing) return;
    const foundProj = _.find(projects, { id: selectedProjectId });
    if (foundProj) {
      setActiveCreatedProject(foundProj);
      storageUtils.setAsync(REFACTOR_CONSTANTS.KEY_SELECTED_AUTO_PROJECT, selectedProjectId);
      pipelineActions.setRenderedVideoUrl(foundProj.renderedVideoUrl || REFACTOR_CONSTANTS.VD_EMPTY_STRING);
      pipelineActions.setLogs(foundProj.generationLogs || []);
    }
  }, [selectedProjectId, projects, isConfigLoaded, isProcessing]);

  const { data: presetsData, refetch: refetchPresets } = usePresets();
  const presets = presetsData || [];

  const [_presetNameInputState, setPresetNameInputState] = useState<string>(REFACTOR_CONSTANTS.VD_EMPTY_STRING);
  const [selectedPresetId, setSelectedPresetId] = useState<string>(REFACTOR_CONSTANTS.VD_EMPTY_STRING);

  const addLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    pipelineActions.setLogs((prev) => [...prev, _.join([`[${timestamp}]`, msg], REFACTOR_CONSTANTS.AVG_BLANK)]);
  };

  const handleSavePreset = async () => {
    const trimmedName = _.trim(_presetNameInputState);
    if (_.isEmpty(trimmedName)) return;
    const newPresetData = {
      id: _.join([PRESET_CONSTANTS.ID_PREFIX, Date.now()], REFACTOR_CONSTANTS.VD_EMPTY_STRING),
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
        [REFACTOR_CONSTANTS.AVG_THUMBNAIL_COUNT_KEY]: thumbnailCount,
        [REFACTOR_CONSTANTS.AVG_THUMBNAIL_STYLE_PRESET_KEY]: thumbnailStylePreset,
        [REFACTOR_CONSTANTS.THUMBNAIL_BACKGROUND_MODE_KEY]: thumbnailBackgroundMode,
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
    applyIfExists(REFACTOR_CONSTANTS.STYLE_BACKGROUND_MODE_KEY, (v) => setStyleBackgroundMode(v as BackgroundMode));
    applyIfExists(REFACTOR_CONSTANTS.AVG_MAX_VIDEO_SCENES_KEY, (v) => setMaxVideoScenes(v as number));
    applyIfExists(REFACTOR_CONSTANTS.AVG_THUMBNAIL_COUNT_KEY, (v) => setThumbnailCount(v as number));
    applyIfExists(REFACTOR_CONSTANTS.AVG_THUMBNAIL_STYLE_PRESET_KEY, (v) => setThumbnailStylePreset(v as string));
    applyIfExists(REFACTOR_CONSTANTS.THUMBNAIL_BACKGROUND_MODE_KEY, (v) => setThumbnailBackgroundMode(v as BackgroundMode));
    setSelectedPresetId(presetId);
    addLog(T.logAppliedPreset(preset.name));
  };

  const handleDeletePreset = async (id: string) => {
    try {
      const res = await fetch(_.join([API_ROUTES.PRESETS, id], REFACTOR_CONSTANTS.VD_SLASH), {
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

  const createImageUploadHandler = (
    setter: React.Dispatch<React.SetStateAction<string[]>>,
    logMessage: (count: number) => string,
  ) => (files: FileList) => {
    readFilesAsDataURL(files, (result) => {
      setter((prev) => [...prev, result]);
    });
    addLog(logMessage(files.length));
  };

  const handleStyleFilesUpload = createImageUploadHandler(setReferenceImages, T.logStyleUploaded);
  const handleSceneReferenceFilesUpload = createImageUploadHandler(setSceneReferenceImages, T.logSceneReferenceUploaded);
  const handleThumbnailStyleFilesUpload = createImageUploadHandler(setThumbnailReferenceImages, T.logThumbUploaded);

  const handleStartAutoGenerate = (overrides: { forceRegenerateVoice?: boolean; forceRegenerateScenes?: boolean; resumeMode?: boolean } = {}) => {
    startPipeline({
      scriptContent, inputType, genre, language, duration, rewriteLevel,
      similarityReduction, creativityLevel, factCheck, audience, writingStyle,
      splitStrategy, hookStrategy, hookDuration, hookPosition,
      voiceProvider, voiceSpeed, voicePitch, voiceVolume, voiceURI, voiceName,
      generationMode, imageGeneratorEngine, generateType, maxVideoScenes,
      aspectRatio, promptInputMethod, sampleCount, videoDuration,
      chromeHeadless, geminiChatSpeed, batchDelay, stylePreset, styleBackgroundMode, styleTextInImageMode,
      referenceImages, sceneReferenceImages, characterImages,
      thumbnailCount, thumbnailStylePreset, thumbnailBackgroundMode, thumbnailTextInImageMode, thumbnailReferenceImages,
      projectName, resumeMode: overrides.resumeMode ?? resumeMode, ffmpegQuality, selectedProjectId,
      forceRegenerateVoice: overrides.forceRegenerateVoice,
      forceRegenerateScenes: overrides.forceRegenerateScenes,
    });
  };

  const regenerationTexts = REGENERATION_TEXTS[currentLang as "vi" | "en"] || REGENERATION_TEXTS.vi;
  const handleRegenerate = async (target: string) => {
    const project = activeCreatedProject;
    if (!project) return;
    if (isProcessing) return;
    const groups = _.isEqual(target, REGENERATION_TARGET.VOICE)
      ? [PROJECT_ASSET_GROUP.VOICES, PROJECT_ASSET_GROUP.VIDEOS]
      : _.isEqual(target, REGENERATION_TARGET.IMAGES)
        ? [PROJECT_ASSET_GROUP.IMAGES, PROJECT_ASSET_GROUP.VIDEOS]
        : [PROJECT_ASSET_GROUP.VIDEOS];
    const responses = await Promise.all(_.map(groups, (group) => fetch(`${API_ROUTES.PIPELINE_PROJECT_ASSETS}/${project.id}/${group}`, {
      method: HTTP_METHODS.DELETE,
      headers: { [API_HEADERS.LICENSE_KEY]: storageUtils.get(STORAGE_KEYS.LICENSE_KEY) || REFACTOR_CONSTANTS.VD_EMPTY_STRING },
    })));
    if (_.some(responses, (response) => !response.ok)) {
      toast.error(regenerationTexts.failed);
      return;
    }
    pipelineActions.setRenderedVideoUrl(REFACTOR_CONSTANTS.VD_EMPTY_STRING);
    handleStartAutoGenerate({
      resumeMode: true,
      forceRegenerateVoice: _.isEqual(target, REGENERATION_TARGET.VOICE),
      forceRegenerateScenes: _.isEqual(target, REGENERATION_TARGET.IMAGES),
    });
  };


  const voiceDialogPersistenceScope = _.join(
    [AppTab.AUTO_GENERATOR, _.defaultTo(activeCreatedProject?.id, _.defaultTo(selectedProjectId, REFACTOR_CONSTANTS.VOICE_DIALOG_GLOBAL_SCOPE))],
    REFACTOR_CONSTANTS.VOICE_DIALOG_SCOPE_SEPARATOR,
  );

  const handleVoiceSelect = (v: CatalogVoice) => {
    const selectedVoiceURI = _.find([
      _.get(v, REFACTOR_CONSTANTS.VD_VOICE_ID_KEY),
      _.get(v, REFACTOR_CONSTANTS.AVG_VOICE_URI_KEY),
      _.get(v, REFACTOR_CONSTANTS.AVG_ID_KEY),
    ], (value) => !_.isEmpty(value));
    const selectedVoiceName = _.get(v, REFACTOR_CONSTANTS.VOICE_CATALOG_NAME_PATH, selectedVoiceURI);
    const selectedVoiceProvider = _.get(v, REFACTOR_CONSTANTS.VOICE_CATALOG_PROVIDER_PATH, voiceProvider);

    setVoiceURI(_.toString(selectedVoiceURI));
    setVoiceName(_.toString(selectedVoiceName));
    setVoiceProvider(_.toString(selectedVoiceProvider));

    const targetProject = activeCreatedProject || (selectedProjectId ? _.find(projects, { id: selectedProjectId }) : undefined);
    if (targetProject) {
      const updatedProject = {
        ...targetProject,
        voiceConfig: {
          ...(targetProject.voiceConfig || {} as VoiceConfig),
          voiceURI: selectedVoiceURI,
          voiceName: selectedVoiceName,
          provider: selectedVoiceProvider,
        } as VoiceConfig,
      };
      setActiveCreatedProject(updatedProject);
      void onUpdateProject(updatedProject, true);
    }
    setIsVoiceDialogOpen(false);
  };

  return (
    <div className="flex-1 h-full w-full bg-slate-955 text-slate-100 flex flex-col min-h-0 overflow-hidden font-sans select-none">
      <div className="h-14 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500">
            <Zap className="w-5 h-5 fill-rose-500/20 animate-pulse" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-100 flex items-center gap-2" title={T.bannerTitleTooltip}>
              {T.bannerTitle}
              <span className="text-[9px] bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded-full font-mono uppercase font-bold">
                {T.bannerBadge}
              </span>
            </h1>
            <p className="text-[11px] text-slate-400">{T.bannerSubtitle}</p>
          </div>
        </div>

        <PresetSection
          presets={presets}
          selectedPresetId={selectedPresetId}
          handleApplyPreset={handleApplyPreset}
          presetNameInputState={_presetNameInputState}
          setPresetNameInputState={setPresetNameInputState}
          handleSavePreset={handleSavePreset}
          handleDeletePreset={handleDeletePreset}
          T={T}
          truncateWords={truncateWords}
        />
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-y-auto lg:overflow-hidden scrollbar-none">
        <div className="lg:col-span-7 h-auto lg:h-full overflow-hidden p-5 flex flex-col">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl space-y-4 p-6 relative lg:h-full flex flex-col justify-start overflow-y-auto scrollbar-none">
            <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="border-b border-slate-800/80 pb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 shadow-inner">
                  <Sliders className="w-5 h-5 text-rose-500" />
                </div>
                <div>
                  <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-100 flex items-center gap-2 font-mono" title={T.panelTitleTooltip}>
                    {T.panelTitle}
                    <span className="text-[9px] bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono">
                      {T.panelBadge}
                    </span>
                  </h2>
                  <p className="text-[11px] text-slate-400 mt-0.5">{T.panelSubtitle}</p>
                </div>
              </div>
            </div>

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

            <div className="border-t border-slate-800/80 my-2" />

            <VoiceSelectionSection
              voiceName={voiceName}
              voiceURI={voiceURI}
              voiceProvider={voiceProvider}
              isVoiceDialogOpen={isVoiceDialogOpen}
              setIsVoiceDialogOpen={setIsVoiceDialogOpen}
              voiceDialogPersistenceScope={voiceDialogPersistenceScope}
              currentLang={currentLang}
              handleVoiceSelect={handleVoiceSelect}
              truncateWords={truncateWords}
              T={T}
            />

            <div className="border-t border-slate-800/80 my-2" />

            <div className="space-y-4">
              <GenerationSettingsSection
                generationMode={generationMode}
                setGenerationMode={setGenerationMode}
                imageGeneratorEngine={imageGeneratorEngine}
                setImageGeneratorEngine={setImageGeneratorEngine}
                aspectRatio={aspectRatio}
                setAspectRatio={setAspectRatio}
                generateType={generateType}
                setGenerateType={setGenerateType}
                maxVideoScenes={maxVideoScenes}
                setMaxVideoScenes={setMaxVideoScenes}
                getImageEngineOptions={getImageEngineOptions}
                T={T}
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
                textInImageMode={styleTextInImageMode}
                setTextInImageMode={setStyleTextInImageMode}
                language={currentLang as AppLanguage}
                T={T}
              />

              <ImageReferenceSection
                referenceImages={referenceImages}
                setReferenceImages={setReferenceImages}
                sceneReferenceImages={sceneReferenceImages}
                setSceneReferenceImages={setSceneReferenceImages}
                handleStyleFilesUpload={handleStyleFilesUpload}
                handleSceneReferenceFilesUpload={handleSceneReferenceFilesUpload}
                T={T}
              />
            </div>

            <div className="border-t border-slate-800/80 my-2" />

            <ProjectSettingsSection
              projectName={projectName}
              setProjectName={setProjectName}
              thumbnailCount={thumbnailCount}
              setThumbnailCount={setThumbnailCount}
              thumbnailReferenceImages={thumbnailReferenceImages}
              setThumbnailReferenceImages={setThumbnailReferenceImages}
              handleThumbnailStyleFilesUpload={handleThumbnailStyleFilesUpload}
              backgroundMode={thumbnailBackgroundMode}
              setBackgroundMode={setThumbnailBackgroundMode}
              textInImageMode={thumbnailTextInImageMode}
              setTextInImageMode={setThumbnailTextInImageMode}
              language={currentLang as AppLanguage}
              T={T}
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

          <LogPanelSection logs={logs} theme={theme} T={T} />

          <PreviewPanelSection
            renderedVideoUrl={renderedVideoUrl}
            projectName={projectName}
            activeCreatedProject={activeCreatedProject}
            isProcessing={isProcessing}
            onSelectProject={onSelectProject}
            handleRegenerate={handleRegenerate}
            T={T}
            regenerationTexts={regenerationTexts}
          />

          {(activeCreatedProject?.seo || activeCreatedProject?.thumbnails) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 shrink-0 mt-2 pb-5">
              <SeoPanelSection activeCreatedProject={activeCreatedProject} T={T} />
              <ThumbnailsPanelSection activeCreatedProject={activeCreatedProject} T={T} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
