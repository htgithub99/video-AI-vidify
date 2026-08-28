import { useState, useEffect, useMemo, useRef } from "react";
import _ from "lodash";
import { toast } from "sonner";
import { usePresets } from "../hooks/usePresets";
import { useAutoVideoState } from "../hooks/useAutoVideoState";
import { useAutoVideoPipeline } from "../hooks/useAutoVideoPipeline";
import { VideoProject, ProjectInputType, ImageGenerationMode, ImageGeneratorEngine, GenerateType } from "../types";
import { type Voice as CatalogVoice } from "./VoiceSelectionDialog";
import { AppTheme, AppLanguage, VideoGenre } from "../constants/enums";
import { API_ROUTES, HTTP_METHODS, CONTENT_TYPES, CONTENT_TYPE_HEADER, REFACTOR_CONSTANTS } from "../constants";
import { MEDIA_MIX_TEXTS } from "../constants/texts";
import { REGENERATION_TARGET, REGENERATION_TEXTS, CINEMATIC_CONFIG } from "../constants/config";
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
import { ProjectSettingsSection } from "./auto-video/ProjectSettingsSection";
import { SeoPanelSection } from "./auto-video/SeoPanelSection";
import { ThumbnailsPreviewSection } from "./auto-video/ThumbnailsPreviewSection";
import { VoiceSelectionSection } from "./auto-video/VoiceSelectionSection";
import CinematicFilmSetupSection from "./cinematic/CinematicFilmSetupSection";
import { CINEMATIC_FILM_STYLE_PRESET_IDS } from "../constants/stylePresets";
import { genreLabels } from "../constants/data";

interface AutoVideoGeneratorProps { currentLang: Lang; projects: VideoProject[]; selectedProjectId?: string | null; onSelectProject: (id: string) => void; onCreateProject: (name: string, desc: string) => Promise<void>; onUpdateProject: (project: VideoProject, immediate?: boolean) => Promise<VideoProject | void> | void; theme?: AppTheme; cinematicMode?: boolean; }

export default function AutoVideoGenerator({ currentLang, projects, selectedProjectId, onSelectProject, onUpdateProject, theme = AppTheme.DARK, cinematicMode = false }: AutoVideoGeneratorProps) {
  const T = useMemo(() => getAutoVideoTexts(currentLang), [currentLang]);
  const mediaMixTexts = useMemo(() => _.get(MEDIA_MIX_TEXTS, currentLang, MEDIA_MIX_TEXTS.vi), [currentLang]);
  const splitLabelMap = useMemo(() => getSplitLabels(T), [T]);

  const { state, actions } = useAutoVideoState(selectedProjectId, projects, currentLang);
  const { pipelineState, pipelineActions, syncSelectedProject } = useAutoVideoPipeline(projects, onUpdateProject, currentLang);

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

  const presentationProject = isProcessing && !_.isEqual(activeCreatedProject?.status, REFACTOR_CONSTANTS.STATUS_GENERATING) ? null : activeCreatedProject;

  const { startPipeline, cancelPipeline, setActiveCreatedProject, setRenderedVideoUrl, setLogs } = pipelineActions;

  const [filmSeriesMode, setFilmSeriesMode] = useState<"single" | "series">(CINEMATIC_CONFIG.DEFAULT_SERIES_MODE);
  const [filmEpisodeCount, setFilmEpisodeCount] = useState<number>(CINEMATIC_CONFIG.DEFAULT_EPISODE_COUNT);

  useEffect(() => {
    syncSelectedProject(selectedProjectId);
  }, [selectedProjectId, projects, syncSelectedProject]);

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
  }, [cinematicMode, duration, genre, generationMode, generateType, imageGeneratorEngine, inputType, stylePreset, thumbnailStylePreset, setDuration, setGenre, setInputType, setGenerateType, setGenerationMode, setImageGeneratorEngine, setStylePreset, setThumbnailStylePreset]);

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
      storageUtils.setAsync(REFACTOR_CONSTANTS.KEY_SELECTED_AUTO_PROJECT, selectedProjectId);
      setRenderedVideoUrl(foundProj.renderedVideoUrl || REFACTOR_CONSTANTS.VD_EMPTY_STRING);
      const cachedLogsStr = storageUtils.get(`${REFACTOR_CONSTANTS.KEY_AUTO_PIPELINE_PROJECT_LOGS_PREFIX}${foundProj.id}`);
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
      storageUtils.set(REFACTOR_CONSTANTS.KEY_AUTO_PIPELINE_CURRENT_LOGS, jsonUtils.safeStringify(updated));
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

  const handleStartAutoGenerate = (overrides: { forceRegenerateVoice?: boolean; forceRegenerateScenes?: boolean; resumeMode?: boolean } = {}): Promise<void> =>
    startPipeline({
      scriptContent,
      inputType,
      genre,
      language,
      duration,
      rewriteLevel,
      similarityReduction,
      creativityLevel,
      factCheck,
      audience,
      writingStyle,
      splitStrategy,
      hookStrategy,
      hookDuration,
      hookPosition,
      voiceProvider,
      voiceSpeed,
      voicePitch,
      voiceVolume,
      voiceURI,
      voiceName,
      generationMode,
      imageGeneratorEngine,
      generateType,
      maxVideoScenes,
      aspectRatio,
      promptInputMethod,
      sampleCount,
      videoDuration,
      videoResolution,
      chromeHeadless,
      geminiChatSpeed,
      batchDelay,
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
      resumeMode: overrides.resumeMode ?? resumeMode,
      ffmpegQuality,
      selectedProjectId,
      forceRegenerateVoice: overrides.forceRegenerateVoice,
      forceRegenerateScenes: overrides.forceRegenerateScenes,
      musicAssetUrl,
      cinematicMode,
      filmFormat: cinematicMode ? filmSeriesMode : undefined,
      episodeCount: cinematicMode ? (_.isEqual(filmSeriesMode, CINEMATIC_CONFIG.SERIES_MODE.SERIES) ? filmEpisodeCount : CINEMATIC_CONFIG.SINGLE_EPISODE_COUNT) : undefined,
    });

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
  }, [activeCreatedProject, isConfigLoaded, isProcessing, scriptContent, selectedProjectId]);

  const [regeneratingTarget, setRegeneratingTarget] = useState<string | null>(null);
  const regenerationTexts = useMemo(() => _.get(REGENERATION_TEXTS, currentLang, REGENERATION_TEXTS.vi), [currentLang]);

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

      if (_.isEqual(target, REGENERATION_TARGET.VOICE)) {
        await handleStartAutoGenerate({ forceRegenerateVoice: true, resumeMode: true });
      } else if (_.isEqual(target, REGENERATION_TARGET.IMAGES)) {
        await handleStartAutoGenerate({ forceRegenerateScenes: true, resumeMode: true });
      } else if (_.isEqual(target, REGENERATION_TARGET.RENDER)) {
        await handleStartAutoGenerate({ resumeMode: true });
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

  return (
    <div className="h-full flex flex-col overflow-y-auto bg-slate-955 font-sans text-slate-100">
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0">
        <div className="lg:col-span-7 h-auto lg:h-full overflow-y-visible lg:overflow-y-auto p-5 space-y-4 border-b lg:border-b-0 lg:border-r border-slate-800 scrollbar-none">
          {!cinematicMode && <PresetSection presets={presets} selectedPresetId={selectedPresetId} presetNameInputState={presetNameInputState} setPresetNameInputState={setPresetNameInputState} handleSavePreset={handleSavePreset} handleApplyPreset={handleApplyPreset} handleDeletePreset={handleDeletePreset} T={T} truncateWords={truncateWords} />}

          <div className="space-y-4">
            {cinematicMode ? (
              <CinematicFilmSetupSection idea={scriptContent} setIdea={setScriptContent} language={language} setLanguage={setLanguage} duration={duration} setDuration={setDuration} seriesMode={filmSeriesMode} setSeriesMode={setFilmSeriesMode} episodeCount={filmEpisodeCount} setEpisodeCount={setFilmEpisodeCount} />
            ) : (
              <ProjectInputSection inputType={inputType} setInputType={setInputType} scriptContent={scriptContent} setScriptContent={setScriptContent} genre={genre} setGenre={setGenre} language={language} setLanguage={setLanguage} duration={duration} setDuration={setDuration} splitStrategy={splitStrategy} setSplitStrategy={setSplitStrategy} splitLabelMap={splitLabelMap} T={T} lockedGenreLabel={lockedGenreLabel} />
            )}

            {!cinematicMode && <VoiceSelectionSection voiceName={voiceName} voiceURI={voiceURI} voiceProvider={voiceProvider} isVoiceDialogOpen={isVoiceDialogOpen} setIsVoiceDialogOpen={setIsVoiceDialogOpen} voiceDialogPersistenceScope={CINEMATIC_CONFIG.PERSISTENCE_SCOPE} currentLang={currentLang} handleVoiceSelect={handleVoiceSelectAndClose} truncateWords={truncateWords} T={T} />}

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

              <div className="pt-2 border-t border-slate-800/80">
                <StylePresetSelector selectedStyle={stylePreset} onSelectStyle={setStylePreset} language={currentLang} accentColor={CINEMATIC_CONFIG.ACCENT_COLOR_BLUE} genre={genre} allowedPresetIds={cinematicMode ? CINEMATIC_FILM_STYLE_PRESET_IDS : undefined} />
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
        </div>

        <div className="lg:col-span-5 h-auto lg:h-full overflow-y-visible lg:overflow-y-auto p-5 bg-slate-955 space-y-5 flex flex-col justify-between scrollbar-none">
          <ActionPanelSection scriptContent={scriptContent} isProcessing={isProcessing} isCancelling={isCancelling} currentStepIndex={currentStepIndex} stepProgress={stepProgress} handleStartAutoGenerate={() => handleStartAutoGenerate({ resumeMode: false })} cancelPipeline={cancelPipeline} T={T} />

          <LogPanelSection logs={logs} theme={theme} T={T} language={currentLang} />

          <PreviewPanelSection renderedVideoUrl={renderedVideoUrl} projectName={projectName} activeCreatedProject={presentationProject} isProcessing={isProcessing} regeneratingTarget={regeneratingTarget} handleRegenerate={handleRegenerate} onSelectProject={onSelectProject} T={T} regenerationTexts={regenerationTexts} />

          <ThumbnailsPreviewSection activeCreatedProject={presentationProject} />

          <SeoPanelSection activeCreatedProject={presentationProject} />
        </div>
      </div>
    </div>
  );
}
