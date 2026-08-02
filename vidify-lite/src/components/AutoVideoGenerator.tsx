import React, { useState, useEffect } from "react";
import _ from "lodash";
import { usePresets } from "../hooks/usePresets";
import { useAutoVideoState } from "../hooks/useAutoVideoState";
import { useAutoVideoPipeline } from "../hooks/useAutoVideoPipeline";
import {
  VideoProject,
  ProjectInputType,
  ProjectLanguage,
  AspectRatio,
  ImageGenerationMode,
  ImageGeneratorEngine,
  GenerateType,
  VoiceConfig,
} from "../types";
import { AppTab, AppTheme } from "../constants/enums";
import {
  GENRE_OPTIONS,
  DURATION_OPTIONS,
  PROJECT_LANGUAGE_OPTIONS,
  SPLIT_STRATEGY_OPTIONS,
  API_ROUTES,
  HTTP_METHODS,
  CONTENT_TYPES,
  CONTENT_TYPE_HEADER,
  REFACTOR_CONSTANTS,
  genreLabels,
  MEDIA_MIX_CONFIG,
  API_HEADERS,
  STORAGE_KEYS,
} from "../constants";
import { MEDIA_MIX_TEXTS, PRESET_CONSTANTS } from "../constants/texts";
import { AUTO_GENERATOR_CONSTANTS, AUTO_GENERATOR_SCENE_REFERENCE_CONFIG, PROJECT_ASSET_GROUP, REGENERATION_TARGET, REGENERATION_TEXTS } from "../constants/config";
import { Lang } from "../lib/lang";
import { Button } from "./ui/Button";
import { Tooltip } from "./ui/Tooltip";
import { VoiceSelectionDialog, type Voice as CatalogVoice } from "./VoiceSelectionDialog";
import { ProgressLogTimeline } from "./ProgressLogTimeline";
import { ImageDeleteOverlay, ImageUploadZone } from "./auto-video/ImageUploadZone";
import { getAutoVideoTexts, getImageEngineOptions, getSplitLabels, truncateWords } from "./auto-video/autoVideoGeneratorUtils";
import { cn } from "../lib/utils";
import { jsonUtils } from "../lib/json";
import { storageUtils } from "../lib/storage";
import { logger } from "../utils/logger";
import { readFilesAsDataURL } from "../lib/shared-utils";
import {
  Zap, Sparkles, Mic, Video, Download, ChevronDown, Save, Trash, Sliders,
  Eye, FileText, Layers, Check, Clock, Layout, Wand2, Globe, Film,
  X, ImageIcon, Target, Copy, RefreshCw, Activity,
} from "lucide-react";

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
    aspectRatio, chromeHeadless, stylePreset, referenceImages, sceneReferenceImages,
    characterImages, thumbnailCount, thumbnailStylePreset, thumbnailReferenceImages,
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
    setAspectRatio, setChromeHeadless, setStylePreset,
    setReferenceImages, setSceneReferenceImages,
    setThumbnailCount, setThumbnailStylePreset, setThumbnailReferenceImages,
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
        [REFACTOR_CONSTANTS.AVG_THUMBNAIL_COUNT_KEY]: thumbnailCount,
        [REFACTOR_CONSTANTS.AVG_THUMBNAIL_STYLE_PRESET_KEY]: thumbnailStylePreset,
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
    applyIfExists(REFACTOR_CONSTANTS.AVG_MAX_VIDEO_SCENES_KEY, (v) => setMaxVideoScenes(v as number));
    applyIfExists(REFACTOR_CONSTANTS.AVG_THUMBNAIL_COUNT_KEY, (v) => setThumbnailCount(v as number));
    applyIfExists(REFACTOR_CONSTANTS.AVG_THUMBNAIL_STYLE_PRESET_KEY, (v) => setThumbnailStylePreset(v as string));
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
      chromeHeadless, geminiChatSpeed, batchDelay, stylePreset,
      referenceImages, sceneReferenceImages, characterImages,
      thumbnailCount, thumbnailStylePreset, thumbnailReferenceImages,
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
      alert(regenerationTexts.failed);
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

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400 font-mono">{T.presetLabel}</span>
          <div className="relative flex items-center bg-slate-955/80 border border-slate-800/80 rounded-lg px-2.5 py-1">
            <select
              value={selectedPresetId}
              onChange={(e) => handleApplyPreset(e.target.value)}
              className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer pr-5 appearance-none"
            >
              <option value={REFACTOR_CONSTANTS.VD_EMPTY_STRING} className="bg-slate-955 text-slate-300">{T.presetDefaultOption}</option>
              {_.map(presets, (p) => (
                <option key={p.id} value={p.id} className="bg-slate-955 text-slate-300" title={p.name}>
                  {truncateWords(p.name, 4)}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 text-slate-500 w-3.5 h-3.5" />
          </div>

          <div className="flex items-center gap-1">
            <input
              type={REFACTOR_CONSTANTS.INPUT_TYPE_TEXT}
              placeholder={T.presetNamePlaceholder}
              value={_presetNameInputState}
              onChange={(e) => setPresetNameInputState(e.target.value)}
              className="bg-slate-955 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-200 w-28 focus:outline-none focus:border-rose-500"
            />
            <Button variant={REFACTOR_CONSTANTS.VARIANT_SECONDARY} size={REFACTOR_CONSTANTS.SIZE_XS} onClick={handleSavePreset} title={T.savePresetTooltip}>
              <Save className="w-3.5 h-3.5 text-rose-400" /> {T.savePresetBtn}
            </Button>

            {selectedPresetId && (
              <Button variant={REFACTOR_CONSTANTS.VARIANT_GHOST} size={REFACTOR_CONSTANTS.SIZE_XS} onClick={() => handleDeletePreset(selectedPresetId)} title={T.deletePresetTooltip}>
                <Trash className="w-3.5 h-3.5 text-slate-500 hover:text-rose-500" />
              </Button>
            )}
          </div>
        </div>
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

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-mono font-bold text-xs">1</span>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono flex items-center gap-1.5" title={T.sec1TitleTooltip}>
                  <FileText className="w-3.5 h-3.5 text-emerald-400" /> {T.sec1Title}
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {([
                  { type: ProjectInputType.Script, icon: <FileText className="w-4 h-4 text-rose-500" />, label: T.inputTypeScript, tooltip: T.inputTypeScriptTooltip },
                  { type: ProjectInputType.Idea, icon: <Sparkles className="w-4 h-4 text-rose-500" />, label: T.inputTypeIdea, tooltip: T.inputTypeIdeaTooltip },
                ] as const).map(({ type, icon, label, tooltip }) => (
                  <Button
                    key={type}
                    type={REFACTOR_CONSTANTS.BUTTON_TYPE_BUTTON}
                    variant={REFACTOR_CONSTANTS.VARIANT_UNSTYLED}
                    onClick={() => setInputType(type)}
                    className={cn(
                      "p-3 rounded-xl border text-left transition-all duration-200 flex items-center justify-between",
                      _.isEqual(inputType, type)
                        ? "bg-rose-500/10 border-rose-500 text-rose-400 ring-1 ring-rose-500/20 font-bold"
                        : "bg-slate-955/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200",
                    )}
                    title={tooltip}
                  >
                    <div className="flex items-center gap-2">{icon}<span className="text-xs">{label}</span></div>
                    {_.isEqual(inputType, type) && <Check className="w-4 h-4 text-rose-500" />}
                  </Button>
                ))}
              </div>

              <textarea
                rows={4}
                value={scriptContent}
                onChange={(e) => setScriptContent(e.target.value)}
                placeholder={_.isEqual(inputType, ProjectInputType.Script) ? T.scriptPlaceholderScript : T.scriptPlaceholderIdea}
                className="w-full bg-slate-955 border border-slate-800 focus:border-rose-500/80 text-slate-200 p-3 rounded-xl text-xs leading-relaxed outline-none resize-none shadow-inner"
              />

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: T.lblGenre, icon: <Layers className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />, value: genre, onChange: setGenre, options: _.map(GENRE_OPTIONS, (g) => ({ value: g, label: genreLabels[g as keyof typeof genreLabels] || g })) },
                  { label: T.lblLanguage, icon: <Globe className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />, value: language, onChange: (v: string) => setLanguage(v as ProjectLanguage), options: _.map(PROJECT_LANGUAGE_OPTIONS, (l) => ({ value: l.value, label: _.isEqual(l.value, "vi") ? T.langVi : T.langEn })) },
                  { label: T.lblDuration, icon: <Clock className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />, value: duration, onChange: setDuration, options: _.map(DURATION_OPTIONS, (d) => ({ value: d.val, label: d.label })) },
                  { label: T.lblSplitStrategy, icon: <Sliders className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />, value: splitStrategy, onChange: setSplitStrategy, options: _.map(SPLIT_STRATEGY_OPTIONS, (s) => ({ value: s.value, label: _.get(splitLabelMap, s.value, s.value) })) },
                ].map(({ label, icon, value, onChange, options }) => (
                  <div key={label} className="space-y-1">
                    <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block">{label}</span>
                    <div className="relative flex items-center bg-slate-955 border border-slate-800 rounded-xl px-2.5 py-2 focus-within:border-rose-500/50 transition-colors">
                      {icon}
                      <select value={value} onChange={(e) => onChange(e.target.value)} className="flex-1 bg-transparent text-slate-200 text-xs font-semibold outline-none cursor-pointer appearance-none pr-5">
                        {_.map(options, (o) => <option key={o.value} value={o.value} className="bg-slate-955 text-slate-300">{o.label}</option>)}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-2 text-slate-500 w-3.5 h-3.5" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-800/80 my-2" />

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center font-mono font-bold text-xs">2</span>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono flex items-center gap-1.5" title={T.sec2TitleTooltip}>
                  <Mic className="w-3.5 h-3.5 text-rose-500" /> {T.sec2Title}
                </h3>
              </div>

              <div>
                <Button
                  type={REFACTOR_CONSTANTS.BUTTON_TYPE_BUTTON}
                  variant={REFACTOR_CONSTANTS.VARIANT_UNSTYLED}
                  onClick={() => setIsVoiceDialogOpen(true)}
                  className="w-full bg-slate-955/80 border border-slate-800 hover:border-rose-500/50 rounded-xl p-3 text-left flex items-center justify-between transition-all group h-auto"
                  title={T.voiceBtnTooltip}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500">
                      <Mic className="w-5 h-5" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Tooltip content={voiceName || voiceURI} position="top">
                        <span className="font-bold text-slate-100 text-xs group-hover:text-rose-400 transition-colors">
                          {truncateWords(voiceName || voiceURI, 4)}
                        </span>
                      </Tooltip>
                      <span className="text-[9px] text-slate-400 font-mono uppercase bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded">{voiceProvider}</span>
                    </div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-500 group-hover:text-rose-400" />
                </Button>
              </div>

              {isVoiceDialogOpen && (
                <VoiceSelectionDialog
                  key={voiceDialogPersistenceScope}
                  isOpen={isVoiceDialogOpen}
                  onClose={() => setIsVoiceDialogOpen(false)}
                  currentLang={currentLang}
                  selectedVoiceId={voiceURI}
                  favoriteVoices={[]}
                  onToggleFavoriteVoice={() => {}}
                  persistenceScope={voiceDialogPersistenceScope}
                  onSelectVoice={handleVoiceSelect}
                />
              )}
            </div>

            <div className="border-t border-slate-800/80 my-2" />

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-mono font-bold text-xs">3</span>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono flex items-center gap-1.5" title={T.sec3TitleTooltip}>
                  <Wand2 className="w-3.5 h-3.5 text-blue-400" /> {T.sec3Title}
                </h3>
              </div>

              <div className="space-y-3.5">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block">{T.lblGenMode}</span>
                    <div className="relative flex items-center bg-slate-955 border border-slate-800 rounded-xl px-2.5 py-2 focus-within:border-rose-500/50 transition-colors">
                      <Wand2 className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
                      <select
                        value={generationMode}
                        onChange={(e) => {
                          setGenerationMode(e.target.value as ImageGenerationMode);
                          setImageGeneratorEngine(ImageGeneratorEngine.Veo3);
                        }}
                        className="flex-1 bg-transparent text-slate-200 text-xs font-semibold outline-none cursor-pointer appearance-none pr-5"
                      >
                        <option value={ImageGenerationMode.LabsFlow} className="bg-slate-955 text-slate-300">{T.optionFlowMode}</option>
                        <option value={ImageGenerationMode.GeminiChat} className="bg-slate-955 text-slate-300">{T.optionAssistantMode}</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-2 text-slate-500 w-3.5 h-3.5" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block">{T.lblEngine}</span>
                    <div className="relative flex items-center bg-slate-955 border border-slate-800 rounded-xl px-2.5 py-2 focus-within:border-rose-500/50 transition-colors">
                      <Sparkles className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
                      <select value={imageGeneratorEngine} onChange={(e) => setImageGeneratorEngine(e.target.value as ImageGeneratorEngine)} className="flex-1 bg-transparent text-slate-200 text-xs font-semibold outline-none cursor-pointer appearance-none pr-5">
                        {_.map(getImageEngineOptions(generationMode, generateType), (opt) => (
                          <option key={opt.value + opt.label} value={opt.value} className="bg-slate-955 text-slate-300">{opt.label}</option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-2 text-slate-500 w-3.5 h-3.5" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block">{T.lblAspectRatio}</span>
                    <div className="relative flex items-center bg-slate-955 border border-slate-800 rounded-xl px-2.5 py-2 focus-within:border-rose-500/50 transition-colors">
                      <Layout className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
                      <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value as AspectRatio)} className="flex-1 bg-transparent text-slate-200 text-xs font-semibold outline-none cursor-pointer appearance-none pr-5">
                        {_.map(_.values(AspectRatio), (r) => (
                          <option key={r} value={r} className="bg-slate-955 text-slate-300">
                            {r} {_.isEqual(r, AspectRatio.NineSixteen) ? REFACTOR_CONSTANTS.RATIO_TIKTOK_SUFFIX : _.isEqual(r, AspectRatio.SixteenNine) ? REFACTOR_CONSTANTS.RATIO_YOUTUBE_SUFFIX : REFACTOR_CONSTANTS.VD_EMPTY_STRING}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-2 text-slate-500 w-3.5 h-3.5" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block">{T.lblGenType}</span>
                    <div className="relative flex items-center bg-slate-955 border border-slate-800 rounded-xl px-2.5 py-2 focus-within:border-rose-500/50 transition-colors">
                      <Film className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
                      <select
                        value={generateType}
                        onChange={(e) => {
                          setGenerateType(e.target.value as GenerateType);
                          if (generationMode !== ImageGenerationMode.GeminiChat) {
                            setImageGeneratorEngine(ImageGeneratorEngine.Veo3);
                          }
                        }}
                        className="flex-1 bg-transparent text-slate-200 text-xs font-semibold outline-none cursor-pointer appearance-none pr-5"
                      >
                        <option value={GenerateType.Image} className="bg-slate-955 text-slate-300">{T.optionImage}</option>
                        <option value={GenerateType.Video} className="bg-slate-955 text-slate-300">{T.optionVideo}</option>
                        <option value={GenerateType.Mixed} className="bg-slate-955 text-slate-300">{T.optionMixed}</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-2 text-slate-500 w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>

                {_.isEqual(generateType, GenerateType.Mixed) && (
                  <div className="max-w-xs">
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block" title={mediaMixTexts.maxVideosTooltip}>
                        {mediaMixTexts.maxVideos}
                      </span>
                      <div className="relative flex items-center bg-slate-955 border border-slate-800 rounded-xl px-2.5 py-2 focus-within:border-rose-500/50 transition-colors">
                        <Film className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
                        <select value={maxVideoScenes} onChange={(event) => setMaxVideoScenes(_.toInteger(event.target.value))} className="flex-1 bg-transparent text-slate-200 text-xs font-semibold outline-none cursor-pointer appearance-none pr-5">
                          {_.map(MEDIA_MIX_CONFIG.VIDEO_COUNT_OPTIONS, (count) => (
                            <option key={count} value={count} className="bg-slate-955 text-slate-300">{count}</option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-2 text-slate-500 w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                )}

                <div className={cn(AUTO_GENERATOR_CONSTANTS.ADVANCED_PANEL_CLASS, showAdvancedImageSettings && AUTO_GENERATOR_CONSTANTS.ADVANCED_PANEL_OPEN_CLASS)}>
                  <Button
                    type={REFACTOR_CONSTANTS.BUTTON_TYPE_BUTTON}
                    variant={REFACTOR_CONSTANTS.VARIANT_UNSTYLED}
                    onClick={() => setShowAdvancedImageSettings(!showAdvancedImageSettings)}
                    aria-expanded={showAdvancedImageSettings}
                    className={AUTO_GENERATOR_CONSTANTS.ADVANCED_TRIGGER_CLASS}
                  >
                    <span className={AUTO_GENERATOR_CONSTANTS.ADVANCED_LAYOUT_CLASS}>
                      <span className={AUTO_GENERATOR_CONSTANTS.ADVANCED_ICON_WRAP_CLASS}><Sliders className={AUTO_GENERATOR_CONSTANTS.ADVANCED_ICON_CLASS} /></span>
                      <span className={AUTO_GENERATOR_CONSTANTS.ADVANCED_TEXT_WRAP_CLASS}>
                        <span className={AUTO_GENERATOR_CONSTANTS.ADVANCED_TITLE_CLASS}>{T.advancedConfig}</span>
                        <span className={AUTO_GENERATOR_CONSTANTS.ADVANCED_HINT_CLASS} title={T.advancedConfigTooltip}>{T.advancedConfigHint}</span>
                      </span>
                    </span>
                    <span className={AUTO_GENERATOR_CONSTANTS.ADVANCED_CHEVRON_WRAP_CLASS}>
                      <ChevronDown className={cn(AUTO_GENERATOR_CONSTANTS.ADVANCED_CHEVRON_CLASS, showAdvancedImageSettings && AUTO_GENERATOR_CONSTANTS.ADVANCED_CHEVRON_OPEN_CLASS)} />
                    </span>
                  </Button>
                  {showAdvancedImageSettings && (
                    <div className={AUTO_GENERATOR_CONSTANTS.ADVANCED_CONTENT_CLASS}>
                      {[
                        {
                          label: T.lblChromeHeadless,
                          tooltip: T.lblChromeHeadlessTooltip,
                          icon: <Globe className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />,
                          value: chromeHeadless ? REFACTOR_CONSTANTS.CHROME_MODE_HEADLESS : REFACTOR_CONSTANTS.CHROME_MODE_WINDOWED,
                          onChange: (v: string) => setChromeHeadless(v === REFACTOR_CONSTANTS.CHROME_MODE_HEADLESS),
                          options: [
                            { value: REFACTOR_CONSTANTS.CHROME_MODE_HEADLESS, label: T.optionHeadless },
                            { value: REFACTOR_CONSTANTS.CHROME_MODE_WINDOWED, label: T.optionWindowed },
                          ] as { value: string; label: string }[],
                        },
                        {
                          label: T.lblResumeMode,
                          tooltip: T.lblResumeModeTooltip,
                          icon: <RefreshCw className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />,
                          value: resumeMode ? REFACTOR_CONSTANTS.RESUME_MODE_RESUME : REFACTOR_CONSTANTS.RESUME_MODE_NEW,
                          onChange: (v: string) => setResumeMode(v === REFACTOR_CONSTANTS.RESUME_MODE_RESUME),
                          options: [
                            { value: REFACTOR_CONSTANTS.RESUME_MODE_RESUME, label: T.optionResume },
                            { value: REFACTOR_CONSTANTS.RESUME_MODE_NEW, label: T.optionNew },
                          ] as { value: string; label: string }[],
                        },
                      ].map(({ label, tooltip, icon, value, onChange, options }) => (
                        <div key={label} className="space-y-1">
                          <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block" title={tooltip}>{label}</span>
                          <div className="relative flex items-center bg-slate-955 border border-slate-800 rounded-xl px-2.5 py-2 focus-within:border-rose-500/50 transition-colors" title={tooltip}>
                            {icon}
                            <select value={value} onChange={(e) => onChange(e.target.value)} className="flex-1 bg-transparent text-slate-200 text-xs font-semibold outline-none cursor-pointer appearance-none pr-5">
                              {_.map(options, (o) => <option key={o.value} value={o.value} className="bg-slate-955 text-slate-300">{o.label}</option>)}
                            </select>
                            <ChevronDown className="pointer-events-none absolute right-2 text-slate-500 w-3.5 h-3.5" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      <Tooltip content={T.styleUploadSub} position="top" className="w-full block">
                        <ImageUploadZone
                          onUpload={handleStyleFilesUpload}
                          hoverColor="emerald"
                          title={T.styleUploadTitle}
                          subtitle={T.styleUploadSub}
                          hideSubtitle={true}
                        />
                      </Tooltip>
                      {_.map(referenceImages, (imgBase64, idx) => (
                        <div key={idx} className="relative w-full aspect-square rounded-xl group shadow-md overflow-hidden border border-slate-800/80 hover:border-emerald-500/30 transition-colors">
                          <img src={imgBase64} alt={`${REFACTOR_CONSTANTS.STYLE_REF_PREFIX}${idx + 1}`} className="w-full h-full object-cover rounded-xl" />
                          <ImageDeleteOverlay onDelete={() => setReferenceImages((prev) => _.filter(prev, (_v, i) => !_.isEqual(i, idx)))} tooltip={T.deleteStyleImgTooltip} />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      <Tooltip content={T.sceneReferenceUploadSub} position="top" className="w-full block">
                        <ImageUploadZone
                          onUpload={handleSceneReferenceFilesUpload}
                          hoverColor="sky"
                          title={T.sceneReferenceUploadTitle}
                          subtitle={T.sceneReferenceUploadSub}
                          hideSubtitle={true}
                          uploadClass={AUTO_GENERATOR_SCENE_REFERENCE_CONFIG.UPLOAD_CLASS}
                          inputClass={AUTO_GENERATOR_SCENE_REFERENCE_CONFIG.INPUT_CLASS}
                          contentClass={AUTO_GENERATOR_SCENE_REFERENCE_CONFIG.UPLOAD_CONTENT_CLASS}
                          iconBoxClass={AUTO_GENERATOR_SCENE_REFERENCE_CONFIG.UPLOAD_ICON_BOX_CLASS}
                          iconClass={AUTO_GENERATOR_SCENE_REFERENCE_CONFIG.UPLOAD_ICON_CLASS}
                          titleClass={AUTO_GENERATOR_SCENE_REFERENCE_CONFIG.UPLOAD_TITLE_CLASS}
                          subtitleClass={AUTO_GENERATOR_SCENE_REFERENCE_CONFIG.UPLOAD_SUBTITLE_CLASS}
                        />
                      </Tooltip>
                      {_.map(sceneReferenceImages, (imgBase64, idx) => (
                        <div key={idx} className={AUTO_GENERATOR_SCENE_REFERENCE_CONFIG.IMAGE_CARD_CLASS}>
                          <img src={imgBase64} alt={`${T.sceneReferenceAlt} ${idx + 1}`} className={AUTO_GENERATOR_SCENE_REFERENCE_CONFIG.IMAGE_CLASS} />
                          <div className={AUTO_GENERATOR_SCENE_REFERENCE_CONFIG.IMAGE_OVERLAY_CLASS}>
                            <Button
                              type={REFACTOR_CONSTANTS.BUTTON_TYPE_BUTTON}
                              variant={REFACTOR_CONSTANTS.VARIANT_UNSTYLED}
                              onClick={() => setSceneReferenceImages((prev) => _.filter(prev, (_v, i) => !_.isEqual(i, idx)))}
                              className={AUTO_GENERATOR_SCENE_REFERENCE_CONFIG.DELETE_BUTTON_CLASS}
                              title={T.deleteSceneReferenceTooltip}
                            >
                              <X className={AUTO_GENERATOR_SCENE_REFERENCE_CONFIG.DELETE_ICON_CLASS} />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-800/80 my-2" />

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center font-mono font-bold text-xs">4</span>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono flex items-center gap-1.5" title={T.sec4TitleTooltip}>
                  <ImageIcon className="w-3.5 h-3.5 text-purple-400" /> {T.sec4Title}
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block">{T.lblProjectName}</span>
                  <input
                    type={REFACTOR_CONSTANTS.INPUT_TYPE_TEXT}
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder={REFACTOR_CONSTANTS.PROJECT_NAME_PLACEHOLDER}
                    className="w-full bg-slate-955 border border-slate-800 focus:border-rose-500/80 text-slate-200 p-2 rounded-xl text-xs outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block">{T.lblThumbCount}</span>
                  <div className="relative flex items-center bg-slate-955 border border-slate-800 rounded-xl px-2.5 py-2">
                    <Layout className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
                    <select value={thumbnailCount} onChange={(e) => setThumbnailCount(Number(e.target.value))} className="flex-1 bg-transparent text-slate-200 text-xs font-semibold outline-none cursor-pointer appearance-none pr-5">
                      {[1, 2, 3, 4].map((n) => <option key={n} value={n} className="bg-slate-955 text-slate-300">{T.thumbCountOption(n)}</option>)}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2 text-slate-500 w-3.5 h-3.5" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                <Tooltip content={T.thumbUploadSub} position="top" className="w-full block">
                  <ImageUploadZone
                    onUpload={handleThumbnailStyleFilesUpload}
                    hoverColor="purple"
                    title={T.thumbUploadTitle}
                    subtitle={T.thumbUploadSub}
                    hideSubtitle={true}
                  />
                </Tooltip>
                {_.map(thumbnailReferenceImages, (imgBase64, idx) => (
                  <div key={idx} className="relative w-full aspect-square rounded-xl group shadow-md overflow-hidden border border-slate-800/80 hover:border-purple-500/30 transition-colors">
                    <img src={imgBase64} alt={`${REFACTOR_CONSTANTS.THUMB_REF_PREFIX}${idx + 1}`} className="w-full h-full object-cover rounded-xl" />
                    <ImageDeleteOverlay onDelete={() => setThumbnailReferenceImages((prev) => _.filter(prev, (_v, i) => !_.isEqual(i, idx)))} tooltip={T.deleteThumbImgTooltip} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 h-auto lg:h-full overflow-y-visible lg:overflow-y-auto p-5 bg-slate-955 space-y-5 flex flex-col justify-between scrollbar-none">
          <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-3xl space-y-4 shadow-xl text-center relative overflow-hidden shrink-0">
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="space-y-1">
              <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-mono flex items-center justify-center gap-2" title={T.rightActionTitleTooltip}>
                <Sparkles className="w-4 h-4 text-rose-500 animate-pulse" />
                {T.rightActionTitle}
              </h2>
              <p className="text-[11px] text-slate-400 leading-relaxed">{T.rightActionSub}</p>
            </div>

            <div className="flex items-center gap-3 w-full">
              <Button
                variant={REFACTOR_CONSTANTS.VARIANT_PRIMARY}
                size={REFACTOR_CONSTANTS.SIZE_LG}
                onClick={() => handleStartAutoGenerate()}
                disabled={isProcessing || _.isEmpty(_.trim(scriptContent))}
                isLoading={isProcessing}
                className="flex-1 py-4 text-sm font-extrabold bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 border border-rose-400/30 text-white rounded-xl shadow-xl shadow-rose-600/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                title={T.startBtnTooltip}
              >
                <Zap className="w-5 h-5 text-amber-300 fill-amber-300 shrink-0" />
                <span className="truncate">{isProcessing ? T.startBtnProcessing : T.startBtnStart}</span>
              </Button>

              {isProcessing && (
                <Button
                  variant={REFACTOR_CONSTANTS.VARIANT_SECONDARY}
                  size={REFACTOR_CONSTANTS.SIZE_LG}
                  onClick={cancelPipeline}
                  disabled={isCancelling}
                  className="flex-1 py-4 text-sm font-bold border border-red-500/30 bg-red-950/20 hover:bg-red-950/40 text-red-400 rounded-xl transition-all duration-300 flex items-center justify-center gap-2"
                  title={T.cancelBtnTooltip}
                >
                  <X className="w-4 h-4 text-red-500 shrink-0" />
                  <span className="truncate">{isCancelling ? T.cancelBtnCancelling : T.cancelBtn}</span>
                </Button>
              )}
            </div>

            {(isProcessing || _.gt(stepProgress, 0)) && (
              <div className="space-y-2 pt-2 text-left">
                <div className="flex justify-between items-center text-[10px] font-mono font-bold">
                  <span className="text-rose-400">{T.progressNodeLabel} [{currentStepIndex}/4]</span>
                  <span className="text-slate-200">{stepProgress}%</span>
                </div>
                <div className="w-full bg-slate-955 h-2 rounded-full overflow-hidden border border-slate-800">
                  <div className="bg-gradient-to-r from-rose-600 to-amber-500 h-full transition-all duration-300" style={{ width: `${stepProgress}%` }} />
                </div>
              </div>
            )}
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4 shadow-xl flex-1 flex flex-col min-h-[260px]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="font-bold flex items-center gap-2 text-sm text-slate-100" title={T.logHeaderTooltip}>
                <span className="w-8 h-8 rounded-xl bg-amber-500/10 dark:bg-amber-500/15 text-amber-400 dark:text-amber-300 flex items-center justify-center">
                  <Activity className="w-4 h-4" />
                </span>
                {T.logHeaderTitle}
              </span>
              <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-slate-300">
                {T.logEventsCount(logs.length)}
              </span>
            </div>

            <div className="flex-1 rounded-2xl p-4 overflow-y-auto space-y-3 leading-relaxed flex flex-col min-h-[180px] max-h-[420px] bg-slate-955/30 scrollbar-none">
              {_.isEmpty(logs) ? (
                <div className={cn(
                  "flex-1 flex flex-col items-center justify-center italic text-center text-xs p-6 w-full h-full my-auto gap-2",
                  _.isEqual(theme, "light") ? "text-slate-500" : "text-slate-400",
                )}>
                  <Activity className="w-8 h-8 mb-1 opacity-50" />
                  <span>{T.logEmpty}</span>
                </div>
              ) : <ProgressLogTimeline logs={logs} theme={theme} />}
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-3xl space-y-4 shadow-xl flex-1 flex flex-col justify-between">
            <h3 className="text-xs font-bold text-slate-100 font-mono uppercase flex items-center gap-2" title={T.previewHeaderTooltip}>
              <Eye className="w-4 h-4 text-amber-400" /> {T.previewHeaderTitle}
            </h3>

            <div className="flex-1 min-h-[260px] bg-slate-950 rounded-2xl border border-slate-800/80 overflow-hidden relative p-4 shadow-inner">
              {!_.isEmpty(renderedVideoUrl) ? (
                <div className="absolute inset-4 flex items-center justify-center">
                  <video src={renderedVideoUrl} controls className="max-w-full max-h-full object-contain rounded-xl" autoPlay />
                </div>
              ) : (
                <div className="absolute inset-0 text-center p-6 text-slate-400 font-mono text-xs flex flex-col items-center justify-center gap-3">
                  <Video className="w-10 h-10 text-slate-600" />
                  <span className="text-slate-400 leading-relaxed max-w-xs block">{T.previewEmpty}</span>
                </div>
              )}
            </div>

            {!_.isEmpty(renderedVideoUrl) && (
              <div className="flex gap-2 pt-1">
                <Button
                  variant={REFACTOR_CONSTANTS.VARIANT_PRIMARY}
                  size={REFACTOR_CONSTANTS.SIZE_SM}
                  onClick={() => {
                    const a = document.createElement("a");
                    a.href = renderedVideoUrl;
                    a.download = _.join([projectName, REFACTOR_CONSTANTS.AVG_MP4_SUFFIX], REFACTOR_CONSTANTS.VD_EMPTY_STRING);
                    a.click();
                  }}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 border-emerald-500/30 text-white font-bold text-xs"
                  title={T.downloadVideoTooltip}
                >
                  <Download className="w-4 h-4" /> {T.downloadVideoBtn}
                </Button>

                {activeCreatedProject && (
                  <Button
                    variant={REFACTOR_CONSTANTS.VARIANT_SECONDARY}
                    size={REFACTOR_CONSTANTS.SIZE_SM}
                    onClick={() => onSelectProject(activeCreatedProject.id)}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold"
                    title={T.openStudioTooltip}
                  >
                    <Sliders className="w-4 h-4 text-rose-400" /> {T.openStudioBtn}
                  </Button>
                )}
              </div>
            )}
            {activeCreatedProject && (
              <div className="grid grid-cols-3 gap-2 pt-1">
                <Button size={REFACTOR_CONSTANTS.SIZE_SM} variant={REFACTOR_CONSTANTS.VARIANT_SECONDARY} disabled={isProcessing} onClick={() => void handleRegenerate(REGENERATION_TARGET.VOICE)} title={regenerationTexts.voice}><Mic className="w-4 h-4" />{regenerationTexts.voice}</Button>
                <Button size={REFACTOR_CONSTANTS.SIZE_SM} variant={REFACTOR_CONSTANTS.VARIANT_SECONDARY} disabled={isProcessing} onClick={() => void handleRegenerate(REGENERATION_TARGET.IMAGES)} title={regenerationTexts.images}><ImageIcon className="w-4 h-4" />{regenerationTexts.images}</Button>
                <Button size={REFACTOR_CONSTANTS.SIZE_SM} variant={REFACTOR_CONSTANTS.VARIANT_SECONDARY} disabled={isProcessing} onClick={() => void handleRegenerate(REGENERATION_TARGET.RENDER)} title={regenerationTexts.render}><RefreshCw className="w-4 h-4" />{regenerationTexts.render}</Button>
              </div>
            )}
          </div>

          {activeCreatedProject?.seo && (
            <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-3xl space-y-4 shadow-xl text-left">
              <h3 className="text-xs font-bold text-slate-100 font-mono uppercase flex items-center gap-2" title={AUTO_GENERATOR_CONSTANTS.UI_SEO_TITLE_TOOLTIP}>
                <Target className="w-4 h-4 text-rose-500" /> {AUTO_GENERATOR_CONSTANTS.UI_SEO_TITLE_SHORT}
              </h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block" title={AUTO_GENERATOR_CONSTANTS.UI_SEO_TITLE_SUGGESTION_TOOLTIP}>
                    {AUTO_GENERATOR_CONSTANTS.UI_SEO_TITLE_SUGGESTION}
                  </span>
                  <div className="space-y-3">
                    {_.map(activeCreatedProject.seo.titles || [], (title, i) => (
                      <div key={i} className="bg-slate-950/60 border border-slate-800/80 p-3 rounded-2xl space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <p className="font-bold text-slate-100 text-xs leading-snug">{title.text}</p>
                          <Button
                            type={REFACTOR_CONSTANTS.BUTTON_TYPE_BUTTON}
                            variant={REFACTOR_CONSTANTS.VARIANT_UNSTYLED}
                            onClick={() => { navigator.clipboard.writeText(title.text); alert(AUTO_GENERATOR_CONSTANTS.UI_SEO_COPIED_TITLE); }}
                            className="text-slate-500 hover:text-slate-100 p-1 rounded hover:bg-slate-900 shrink-0 h-auto"
                            title={AUTO_GENERATOR_CONSTANTS.UI_SEO_COPY_TITLE_TOOLTIP}
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-900 text-[9px] font-mono">
                          {[
                            { label: AUTO_GENERATOR_CONSTANTS.UI_SEO_METRIC_SEARCH, score: title.searchScore },
                            { label: AUTO_GENERATOR_CONSTANTS.UI_SEO_METRIC_CTR, score: title.ctrScore },
                            { label: AUTO_GENERATOR_CONSTANTS.UI_SEO_METRIC_COMPET, score: title.compScore },
                            { label: AUTO_GENERATOR_CONSTANTS.UI_SEO_METRIC_SEO, score: title.seoScore },
                          ].map(({ label, score }) => (
                            <div key={label}>
                              <div className="flex justify-between mb-0.5 text-slate-400">
                                <span>{label}</span>
                                <span className="text-rose-450 font-bold">{score}%</span>
                              </div>
                              <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden">
                                <div className="bg-rose-500 h-full" style={{ width: `${score}%` }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block" title={AUTO_GENERATOR_CONSTANTS.UI_SEO_DESC_SUGGESTION_TOOLTIP}>
                    {AUTO_GENERATOR_CONSTANTS.UI_SEO_DESC_SUGGESTION}
                  </span>
                  <div className="space-y-2">
                    {_.map(activeCreatedProject.seo.descriptions || [], (desc, i) => (
                      <div key={i} className="bg-slate-950/60 border border-slate-800/80 p-3 rounded-2xl flex items-start justify-between gap-3">
                        <p className="text-[11px] text-slate-300 leading-relaxed font-sans">{desc.text}</p>
                        <Button
                          type={REFACTOR_CONSTANTS.BUTTON_TYPE_BUTTON}
                          variant={REFACTOR_CONSTANTS.VARIANT_UNSTYLED}
                          onClick={() => { navigator.clipboard.writeText(desc.text); alert(AUTO_GENERATOR_CONSTANTS.UI_SEO_COPIED_DESC); }}
                          className="text-slate-500 hover:text-slate-100 p-1 rounded hover:bg-slate-900 shrink-0 h-auto"
                          title={AUTO_GENERATOR_CONSTANTS.UI_SEO_COPY_DESC_TOOLTIP}
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                  {[
                    { label: AUTO_GENERATOR_CONSTANTS.UI_SEO_HASHTAGS, items: activeCreatedProject.seo.hashtags || [], isHashtag: true },
                    { label: AUTO_GENERATOR_CONSTANTS.UI_SEO_TAGS, items: activeCreatedProject.seo.tags || [], isHashtag: false },
                  ].map(({ label, items, isHashtag }) => (
                    <div key={label} className="space-y-1.5">
                      <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider font-bold">{label}</span>
                      <div className="flex flex-wrap gap-1.5">
                        {_.map(items, (tag, i) => (
                          <span key={i} className={isHashtag ? "bg-slate-950/60 border border-slate-800 text-rose-400 font-mono text-[10px] px-2 py-1 rounded-lg" : "bg-slate-950/60 border border-slate-800 text-slate-300 font-sans text-[10px] px-2 py-1 rounded-lg"}>
                            {isHashtag ? `#${tag.replace(/^#+/, REFACTOR_CONSTANTS.VD_EMPTY_STRING)}` : tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeCreatedProject?.thumbnails && activeCreatedProject.thumbnails.length > 0 && (
            <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-3xl space-y-4 shadow-xl text-left">
              <h3 className="text-xs font-bold text-slate-100 font-mono uppercase flex items-center gap-2" title={AUTO_GENERATOR_CONSTANTS.UI_THUMBNAILS_TITLE_TOOLTIP}>
                <ImageIcon className="w-4 h-4 text-rose-500" /> {AUTO_GENERATOR_CONSTANTS.UI_THUMBNAILS_TITLE}
              </h3>
              <div className="grid grid-cols-1 gap-4">
                {_.map(activeCreatedProject.thumbnails, (thumb) => (
                  <div key={thumb.id} className="bg-slate-950 border border-slate-800/80 rounded-2xl overflow-hidden shadow-md flex flex-col sm:flex-row p-3 gap-3">
                    <div className="sm:w-1/2 aspect-video relative overflow-hidden bg-slate-900 rounded-xl border border-slate-800">
                      {thumb.imageUrl ? (
                        <img src={thumb.imageUrl} alt="Thumbnail Idea" className="w-full h-full object-cover" />
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 text-slate-500 text-[10px]">
                          <span>{AUTO_GENERATOR_CONSTANTS.UI_THUMBNAILS_UNRENDERED}</span>
                        </div>
                      )}
                      <div className="absolute top-2 left-2">
                        <span className="bg-black/60 backdrop-blur-md text-white border border-white/10 text-[9px] font-bold px-2 py-0.5 rounded-full">
                          {thumb.style} Look
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 flex flex-col justify-between py-1 min-w-0">
                      <div>
                        {thumb.hasText && thumb.textText && (
                          <h4 className="text-amber-400 font-black text-xs uppercase mb-1 line-clamp-1">"{thumb.textText}"</h4>
                        )}
                        <p className="text-[10px] text-slate-400 italic line-clamp-2 leading-relaxed">"{thumb.prompt}"</p>
                      </div>
                      {thumb.imageUrl && (
                        <div className="pt-2 flex gap-2">
                          <Button
                            variant={REFACTOR_CONSTANTS.VARIANT_PRIMARY}
                            size={REFACTOR_CONSTANTS.SIZE_SM}
                            onClick={() => {
                              const a = document.createElement("a");
                              a.href = thumb.imageUrl!;
                              a.download = `${AUTO_GENERATOR_CONSTANTS.UI_THUMBNAILS_FILE_PREFIX}${thumb.id || AUTO_GENERATOR_CONSTANTS.UI_THUMBNAILS_IDEA_FALLBACK}${REFACTOR_CONSTANTS.CACHE_EXT_PNG}`;
                              a.click();
                            }}
                            className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold py-1.5 h-auto"
                            title={AUTO_GENERATOR_CONSTANTS.UI_THUMBNAILS_DOWNLOAD_TOOLTIP}
                          >
                            <Download className="w-3.5 h-3.5" /> {AUTO_GENERATOR_CONSTANTS.UI_THUMBNAILS_DOWNLOAD}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
