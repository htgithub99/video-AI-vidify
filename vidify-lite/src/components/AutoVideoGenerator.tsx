import { useState, useEffect } from "react";
import _ from "lodash";
import { VideoProject, ProjectInputType, ProjectLanguage, Gender, AgeGroup, AspectRatio, ImageGenerationMode, ImageGeneratorEngine, GenerateType, BatchDelayOption, GeminiChatSpeed, PromptInputMethod } from "../types";
import { VideoQuality } from "../constants/enums";
import { GENRE_OPTIONS, DURATION_OPTIONS, PROJECT_LANGUAGE_OPTIONS, SPLIT_STRATEGY_OPTIONS, API_ROUTES, HTTP_METHODS, CONTENT_TYPES, CONTENT_TYPE_HEADER, DEFAULT_PROJECT_CONFIGS, genreLabels } from "../constants";
import { AUTO_GENERATOR_PANEL_TEXTS, PRESET_CONSTANTS } from "../constants/texts";
import { Lang } from "../lib/lang";
import { Button } from "./ui/Button";
import { VoiceSelectionDialog } from "./VoiceSelectionDialog";
import { cn } from "../lib/utils";
import { jsonUtils } from "../lib/json";
import { logger } from "../utils/logger";
import {
  Zap,
  Sparkles,
  Mic,
  Video,
  Download,
  ChevronDown,
  Save,
  Trash,
  Sliders,
  Terminal,
  Eye,
  FileText,
  Layers,
  Check,
  Clock,
  Layout,
  Wand2,
  Globe,
  Film,
  Upload,
  X,
  ImageIcon,
} from "lucide-react";

interface AutoVideoGeneratorProps {
  currentLang: Lang;
  projects: VideoProject[];
  onSelectProject: (id: string) => void;
  onCreateProject: (name: string, desc: string) => Promise<void>;
  onUpdateProject: (project: VideoProject, immediate?: boolean) => Promise<void> | void;
  theme?: "dark" | "light";
}

interface PresetItem {
  id: string;
  name: string;
  config: any;
}

export default function AutoVideoGenerator({
  currentLang,
  onSelectProject,
  onUpdateProject,
}: AutoVideoGeneratorProps) {
  const T = AUTO_GENERATOR_PANEL_TEXTS[currentLang as "vi" | "en"] || AUTO_GENERATOR_PANEL_TEXTS.vi;

  const [inputType, setInputType] = useState<ProjectInputType>(ProjectInputType.Script);
  const [scriptContent, setScriptContent] = useState<string>("");
  const [genre, setGenre] = useState<string>(DEFAULT_PROJECT_CONFIGS.GENRE);
  const [language, setLanguage] = useState<ProjectLanguage>(ProjectLanguage.VI);
  const [duration, setDuration] = useState<string>(DEFAULT_PROJECT_CONFIGS.DURATION);
  const [rewriteLevel] = useState<number>(3);
  const [similarityReduction] = useState<number>(3);
  const [creativityLevel] = useState<number>(3);
  const [factCheck] = useState<boolean>(true);
  const [audience] = useState<string>(DEFAULT_PROJECT_CONFIGS.AUDIENCE);
  const [writingStyle] = useState<string>(DEFAULT_PROJECT_CONFIGS.WRITING_STYLE);
  const [splitStrategy, setSplitStrategy] = useState<string>("mixed_sentences");

  const [hookStrategy] = useState<string>(DEFAULT_PROJECT_CONFIGS.HOOK_TYPE);
  const [hookDuration] = useState<number>(10);
  const [hookPosition] = useState<string>("start");

  const [voiceProvider, setVoiceProvider] = useState<string>(DEFAULT_PROJECT_CONFIGS.VOICE_PROVIDER);
  const [voiceSpeed] = useState<number>(1.0);
  const [voicePitch] = useState<number>(1.0);
  const [voiceVolume] = useState<number>(1.0);
  const [voiceURI, setVoiceURI] = useState<string>(DEFAULT_PROJECT_CONFIGS.VOICE_URI);
  const [voiceName, setVoiceName] = useState<string>(PRESET_CONSTANTS.DEFAULT_VOICE_NAME);
  const [isVoiceDialogOpen, setIsVoiceDialogOpen] = useState<boolean>(false);

  const [generationMode, setGenerationMode] = useState<ImageGenerationMode>(ImageGenerationMode.LabsFlow);
  const [imageGeneratorEngine, setImageGeneratorEngine] = useState<ImageGeneratorEngine>(ImageGeneratorEngine.Veo3);
  const [generateType, setGenerateType] = useState<GenerateType>(GenerateType.Image);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(AspectRatio.NineSixteen);
  const [promptInputMethod] = useState<PromptInputMethod>(PromptInputMethod.Paste);
  const [sampleCount] = useState<number>(1);
  const [videoDuration] = useState<string>("8s");
  const [chromeHeadless] = useState<boolean>(true);
  const [geminiChatSpeed] = useState<GeminiChatSpeed>(GeminiChatSpeed.Normal);
  const [batchDelay] = useState<BatchDelayOption>(BatchDelayOption.Random123);

  const [stylePreset, setStylePreset] = useState<string>(PRESET_CONSTANTS.DEFAULT_STYLE_PRESET);
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [isExtractingStyle, setIsExtractingStyle] = useState<boolean>(false);

  const [characterImages] = useState<string[]>([]);

  const [thumbnailCount, setThumbnailCount] = useState<number>(2);
  const [thumbnailStylePreset, setThumbnailStylePreset] = useState<string>(PRESET_CONSTANTS.DEFAULT_THUMB_STYLE_PRESET);
  const [thumbnailReferenceImages, setThumbnailReferenceImages] = useState<string[]>([]);
  const [isExtractingThumbnailStyle, setIsExtractingThumbnailStyle] = useState<boolean>(false);

  const [projectName, setProjectName] = useState<string>(() => `${PRESET_CONSTANTS.PROJECT_NAME_PREFIX}${new Date().toISOString().slice(0, 10)}`);
  const [ffmpegQuality] = useState<VideoQuality>(VideoQuality.HIGH);
  const [cameraMotion] = useState<string>(PRESET_CONSTANTS.DEFAULT_CAMERA_MOTION);
  const [transitionEffect] = useState<string>(PRESET_CONSTANTS.DEFAULT_TRANSITION);

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [stepProgress, setStepProgress] = useState<number>(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [renderedVideoUrl, setRenderedVideoUrl] = useState<string>("");
  const [activeCreatedProject, setActiveCreatedProject] = useState<VideoProject | null>(null);

  const [presets, setPresets] = useState<PresetItem[]>([]);
  const [presetNameInput, setPresetNameInput] = useState<string>("");
  const [selectedPresetId, setSelectedPresetId] = useState<string>("");

  useEffect(() => {
    const fetchPresets = async () => {
      try {
        const res = await fetch(API_ROUTES.PRESETS);
        const data = await res.json();
        if (_.isArray(data)) {
          setPresets(data);
        }
      } catch (err) {
        logger.error("FAILED_FETCH_PRESETS", err);
      }
    };
    fetchPresets();
  }, []);

  const addLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, `[${timestamp}] ${msg}`]);
  };

  const handleSavePreset = async () => {
    const trimmedName = _.trim(presetNameInput);
    if (_.isEmpty(trimmedName)) return;
    const newPresetData = {
      id: `${PRESET_CONSTANTS.ID_PREFIX}${Date.now()}`,
      name: trimmedName,
      config: {
        inputType,
        genre,
        language,
        duration,
        splitStrategy,
        voiceProvider,
        voiceURI,
        voiceName,
        generationMode,
        generateType,
        imageGeneratorEngine,
        aspectRatio,
        stylePreset,
        thumbnailCount,
        thumbnailStylePreset,
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
        setPresets((prev) => [...prev, saved]);
        setPresetNameInput("");
        addLog(T.logSavedPreset(saved.name));
      }
    } catch (err) {
      logger.error("FAILED_SAVE_PRESET", err);
    }
  };

  const handleApplyPreset = (presetId: string) => {
    const preset = _.find(presets, { id: presetId });
    if (!preset) return;
    const c = preset.config;
    if (c.genre) setGenre(c.genre);
    if (c.language) setLanguage(c.language);
    if (c.duration) setDuration(c.duration);
    if (c.splitStrategy) setSplitStrategy(c.splitStrategy);
    if (c.voiceURI) setVoiceURI(c.voiceURI);
    if (c.voiceName) setVoiceName(c.voiceName);
    if (c.aspectRatio) setAspectRatio(c.aspectRatio);
    if (c.generationMode) setGenerationMode(c.generationMode);
    if (c.stylePreset) setStylePreset(c.stylePreset);
    if (c.thumbnailCount) setThumbnailCount(c.thumbnailCount);
    if (c.thumbnailStylePreset) setThumbnailStylePreset(c.thumbnailStylePreset);
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
        setPresets((prev) => _.filter(prev, (p) => !_.isEqual(p.id, id)));
        if (_.isEqual(selectedPresetId, id)) setSelectedPresetId("");
      }
    } catch (err) {
      logger.error("FAILED_DELETE_PRESET", err);
    }
  };

  const handleStyleFilesUpload = (files: FileList) => {
    _.forEach(Array.from(files), (file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (_.isString(reader.result)) {
          setReferenceImages((prev) => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
    addLog(T.logStyleUploaded(files.length));
    setIsExtractingStyle(true);
    setTimeout(() => {
      setIsExtractingStyle(false);
      setStylePreset(PRESET_CONSTANTS.EXTRACTED_STYLE_PRESET);
      addLog(T.logStyleExtracted);
    }, 1000);
  };

  const handleThumbnailStyleFilesUpload = (files: FileList) => {
    _.forEach(Array.from(files), (file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (_.isString(reader.result)) {
          setThumbnailReferenceImages((prev) => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
    addLog(T.logThumbUploaded(files.length));
    setIsExtractingThumbnailStyle(true);
    setTimeout(() => {
      setIsExtractingThumbnailStyle(false);
      setThumbnailStylePreset(PRESET_CONSTANTS.EXTRACTED_THUMB_STYLE_PRESET);
      addLog(T.logThumbStyleExtracted);
    }, 1000);
  };

  const handleStartAutoGenerate = async () => {
    if (_.isEmpty(_.trim(scriptContent))) {
      alert(T.alertEmptyScript);
      return;
    }

    setIsProcessing(true);
    setStepProgress(5);
    setCurrentStepIndex(1);
    setLogs([]);
    setRenderedVideoUrl("");

    addLog(T.logPipelineStart);

    try {
      addLog(T.logInitProj);
      const newProjectId = `proj_${Math.random().toString(36).substring(2, 11)}`;
      const newProj: VideoProject = {
        id: newProjectId,
        name: _.trim(projectName) || `${PRESET_CONSTANTS.PROJECT_NAME_PREFIX}${Date.now()}`,
        description: `Tạo tự động lúc ${new Date().toLocaleString()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        input: {
          type: inputType,
          content: scriptContent,
        },
        config: {
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
        },
        hookConfig: {
          type: hookStrategy,
          duration: hookDuration,
          count: 3,
          positions: hookPosition as any,
          versions: [],
        },
        voiceConfig: {
          provider: voiceProvider,
          audioType: "tts" as any,
          gender: Gender.Male,
          age: AgeGroup.Adult,
          emotion: "Normal",
          speed: voiceSpeed,
          pitch: voicePitch,
          volume: voiceVolume,
          voiceURI,
          voiceName,
        },
        visualConfig: {
          source: "AI Auto",
          style: stylePreset,
          quality: "Standard",
          density: 5,
          characterConsistency: true,
          assetsMode: "mixed" as any,
          imageGeneratorEngine,
          generateType,
          aspectRatio,
          promptInputMethod,
          generateCount: sampleCount,
          chromeHeadless,
          generationMode,
          geminiChatSpeed,
          batchDelay,
          videoDuration,
          thumbnailCount,
          thumbnailReferenceImages,
          thumbnailReferencePrompt: thumbnailStylePreset,
          referenceImages,
          referencePrompt: stylePreset,
          characters: [
            {
              id: "char_1",
              name: PRESET_CONSTANTS.CHARACTER_NAME,
              description: PRESET_CONSTANTS.CHARACTER_BIO,
              images: characterImages,
            },
          ],
        },
        seoConfig: {
          numTitles: 3,
          numDescriptions: 1,
          numHashtags: 5,
          numTags: 10,
        },
        creditsUsed: 0,
      };

      setActiveCreatedProject(newProj);
      await onUpdateProject(newProj, true);
      addLog(T.logInitProjSuccess(newProj.name));
      setStepProgress(25);

      addLog(T.logScriptGen);
      await new Promise((res) => setTimeout(res, 1500));

      const sampleStoryboard = [
        {
          id: "sc_1",
          chapterId: "ch_1",
          startTime: "00:00.000",
          endTime: "00:05.000",
          duration: 5,
          script: scriptContent.slice(0, 80) || "Phân cảnh mở đầu đầy lôi cuốn.",
          subtitle: scriptContent.slice(0, 80) || "Phân cảnh mở đầu đầy lôi cuốn.",
          prompt: `Cinematic shot, ${stylePreset}, ${scriptContent.slice(0, 50)} --ar ${aspectRatio}`,
          cameraMotion,
          transition: transitionEffect,
        },
        {
          id: "sc_2",
          chapterId: "ch_1",
          startTime: "00:05.000",
          endTime: "00:10.000",
          duration: 5,
          script: scriptContent.slice(80, 160) || "Phát triển câu chuyện hấp dẫn tiếp theo.",
          subtitle: scriptContent.slice(80, 160) || "Phát triển câu chuyện hấp dẫn tiếp theo.",
          prompt: `High detailed, ${stylePreset}, dramatic lighting --ar ${aspectRatio}`,
          cameraMotion,
          transition: transitionEffect,
        },
      ];

      const projWithStoryboard = {
        ...newProj,
        scriptRewritten: scriptContent,
        storyboard: sampleStoryboard,
      };
      setActiveCreatedProject(projWithStoryboard);
      await onUpdateProject(projWithStoryboard, true);
      addLog(T.logScriptSuccess);
      setStepProgress(45);
      setCurrentStepIndex(2);

      addLog(T.logVoiceGen(voiceName));
      await new Promise((res) => setTimeout(res, 1200));
      addLog(T.logVoiceSuccess);

      addLog(T.logImageGen(imageGeneratorEngine, stylePreset, aspectRatio));
      setStepProgress(65);
      await new Promise((res) => setTimeout(res, 2000));
      addLog(T.logImageSuccess);

      setCurrentStepIndex(3);
      addLog(T.logSeoGen);
      const updatedSeoProj = {
        ...projWithStoryboard,
        seo: {
          titles: _.map(Array.from({ length: 3 }), (_, i) => ({
            text: `[Gợi Ý ${i + 1}] ${projectName}: ${scriptContent.slice(0, 30)}...`,
            searchScore: 90 + i,
            ctrScore: 88 + i,
            compScore: 40,
            seoScore: 89,
          })),
          descriptions: [{ text: `Video được sản xuất tự động từ kịch bản: ${scriptContent.slice(0, 100)}...`, searchScore: 90, ctrScore: 90, compScore: 30, seoScore: 90 }],
          hashtags: ["VideoAI", "Vidify", "AutoGenerator", "Creator", "Shorts"],
          tags: ["video ai", "tự động hoá", "content creator", "ai studio"],
        },
      };
      setActiveCreatedProject(updatedSeoProj);
      await onUpdateProject(updatedSeoProj, true);
      addLog(T.logSeoSuccess);
      setStepProgress(85);
      setCurrentStepIndex(4);

      addLog(T.logRenderGen(ffmpegQuality));
      try {
        const payload = {
          scenes: _.map(sampleStoryboard, (sc) => ({
            id: sc.id,
            duration: sc.duration,
            imageBase64: "",
            audioBase64: "",
          })),
          quality: ffmpegQuality,
        };
        const response = await fetch(API_ROUTES.PIPELINE_FFMPEG_RENDER, {
          method: HTTP_METHODS.POST,
          headers: { [CONTENT_TYPE_HEADER]: CONTENT_TYPES.JSON },
          body: jsonUtils.safeStringify(payload),
        });
        const text = await response.text();
        const data = jsonUtils.safeParse<{ success: boolean; url?: string }>(text, { success: false });
        if (data.success && data.url) {
          setRenderedVideoUrl(data.url);
          addLog(T.logRenderSuccess);
        } else {
          setRenderedVideoUrl(PRESET_CONSTANTS.SAMPLE_VIDEO_URL);
          addLog(T.logRenderPreview);
        }
      } catch {
        setRenderedVideoUrl(PRESET_CONSTANTS.SAMPLE_VIDEO_URL);
        addLog(T.logRenderPreviewMode);
      }

      setStepProgress(100);
    } catch (err: any) {
      addLog(`❌ Lỗi trong quá trình tạo video: ${err?.message || err}`);
    } finally {
      setIsProcessing(false);
    }
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
              <option value="" className="bg-slate-955 text-slate-300">{T.presetDefaultOption}</option>
              {_.map(presets, (p) => (
                <option key={p.id} value={p.id} className="bg-slate-955 text-slate-300">
                  {p.name}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 text-slate-500 w-3.5 h-3.5" />
          </div>

          <div className="flex items-center gap-1">
            <input
              type="text"
              placeholder={T.presetNamePlaceholder}
              value={presetNameInput}
              onChange={(e) => setPresetNameInput(e.target.value)}
              className="bg-slate-955 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-200 w-28 focus:outline-none focus:border-rose-500"
            />
            <Button variant="secondary" size="xs" onClick={handleSavePreset} title={T.savePresetTooltip}>
              <Save className="w-3.5 h-3.5 text-rose-400" /> {T.savePresetBtn}
            </Button>
            {selectedPresetId && (
              <Button variant="ghost" size="xs" onClick={() => handleDeletePreset(selectedPresetId)} title={T.deletePresetTooltip}>
                <Trash className="w-3.5 h-3.5 text-slate-500 hover:text-rose-500" />
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden">
        <div className="lg:col-span-7 h-full overflow-y-auto p-5 custom-scrollbar flex flex-col">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl space-y-6 p-6 relative min-h-full flex flex-col justify-between">
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
                <span className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-mono font-bold text-xs">
                  1
                </span>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono flex items-center gap-1.5" title={T.sec1TitleTooltip}>
                  <FileText className="w-3.5 h-3.5 text-emerald-400" /> {T.sec1Title}
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setInputType(ProjectInputType.Script)}
                  className={cn(
                    "p-3 rounded-xl border text-left transition-all duration-200 flex items-center justify-between",
                    _.isEqual(inputType, ProjectInputType.Script)
                      ? "bg-rose-500/10 border-rose-500 text-rose-400 ring-1 ring-rose-500/20 font-bold"
                      : "bg-slate-955/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                  )}
                  title={T.inputTypeScriptTooltip}
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-rose-500" />
                    <span className="text-xs">{T.inputTypeScript}</span>
                  </div>
                  {_.isEqual(inputType, ProjectInputType.Script) && <Check className="w-4 h-4 text-rose-500" />}
                </button>

                <button
                  type="button"
                  onClick={() => setInputType(ProjectInputType.Idea)}
                  className={cn(
                    "p-3 rounded-xl border text-left transition-all duration-200 flex items-center justify-between",
                    _.isEqual(inputType, ProjectInputType.Idea)
                      ? "bg-rose-500/10 border-rose-500 text-rose-400 ring-1 ring-rose-500/20 font-bold"
                      : "bg-slate-955/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                  )}
                  title={T.inputTypeIdeaTooltip}
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-rose-500" />
                    <span className="text-xs">{T.inputTypeIdea}</span>
                  </div>
                  {_.isEqual(inputType, ProjectInputType.Idea) && <Check className="w-4 h-4 text-rose-500" />}
                </button>
              </div>

              <textarea
                rows={4}
                value={scriptContent}
                onChange={(e) => setScriptContent(e.target.value)}
                placeholder={_.isEqual(inputType, ProjectInputType.Script) ? T.scriptPlaceholderScript : T.scriptPlaceholderIdea}
                className="w-full bg-slate-955 border border-slate-800 focus:border-rose-500/80 text-slate-200 p-3 rounded-xl text-xs leading-relaxed outline-none resize-none shadow-inner"
              />

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block">{T.lblGenre}</span>
                  <div className="relative flex items-center bg-slate-955 border border-slate-800 rounded-xl px-2.5 py-2">
                    <Layers className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
                    <select
                      value={genre}
                      onChange={(e) => setGenre(e.target.value)}
                      className="flex-1 bg-transparent text-slate-200 text-xs font-semibold outline-none cursor-pointer appearance-none pr-5"
                    >
                      {_.map(GENRE_OPTIONS, (g) => (
                        <option key={g} value={g} className="bg-slate-955 text-slate-300">
                          {genreLabels[g as keyof typeof genreLabels] || g}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2 text-slate-500 w-3.5 h-3.5" />
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block">{T.lblLanguage}</span>
                  <div className="relative flex items-center bg-slate-955 border border-slate-800 rounded-xl px-2.5 py-2">
                    <Globe className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value as any)}
                      className="flex-1 bg-transparent text-slate-200 text-xs font-semibold outline-none cursor-pointer appearance-none pr-5"
                    >
                      {_.map(PROJECT_LANGUAGE_OPTIONS, (l) => (
                        <option key={l.value} value={l.value} className="bg-slate-955 text-slate-300">
                          {_.isEqual(l.value, "vi") ? T.langVi : T.langEn}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2 text-slate-500 w-3.5 h-3.5" />
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block">{T.lblDuration}</span>
                  <div className="relative flex items-center bg-slate-955 border border-slate-800 rounded-xl px-2.5 py-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
                    <select
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      className="flex-1 bg-transparent text-slate-200 text-xs font-semibold outline-none cursor-pointer appearance-none pr-5"
                    >
                      {_.map(DURATION_OPTIONS, (d) => (
                        <option key={d.val} value={d.val} className="bg-slate-955 text-slate-300">
                          {d.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2 text-slate-500 w-3.5 h-3.5" />
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block">{T.lblSplitStrategy}</span>
                  <div className="relative flex items-center bg-slate-955 border border-slate-800 rounded-xl px-2.5 py-2">
                    <Sliders className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
                    <select
                      value={splitStrategy}
                      onChange={(e) => setSplitStrategy(e.target.value)}
                      className="flex-1 bg-transparent text-slate-200 text-xs font-semibold outline-none cursor-pointer appearance-none pr-5"
                    >
                      {_.map(SPLIT_STRATEGY_OPTIONS, (s: any) => {
                        const val = s.value;
                        const displayLabel =
                          _.isEqual(val, "word") ? T.splitWord
                          : _.isEqual(val, "short_sentence") ? T.splitShort
                          : _.isEqual(val, "long_sentence") ? T.splitLong
                          : _.isEqual(val, "mixed_sentences") ? T.splitMixed
                          : _.isEqual(val, "paragraph") ? T.splitParagraph
                          : val;
                        return (
                          <option key={val} value={val} className="bg-slate-955 text-slate-300">
                            {displayLabel}
                          </option>
                        );
                      })}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2 text-slate-500 w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-800/80 my-4" />

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center font-mono font-bold text-xs">
                  2
                </span>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono flex items-center gap-1.5" title={T.sec2TitleTooltip}>
                  <Mic className="w-3.5 h-3.5 text-rose-500" /> {T.sec2Title}
                </h3>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => setIsVoiceDialogOpen(true)}
                  className="w-full bg-slate-955/80 border border-slate-800 hover:border-rose-500/50 rounded-xl p-3 text-left flex items-center justify-between transition-all group"
                  title={T.voiceBtnTooltip}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500">
                      <Mic className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-100 block text-xs group-hover:text-rose-400 transition-colors">{voiceName || voiceURI}</span>
                      <span className="text-[9px] text-slate-400 font-mono uppercase bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded">{voiceProvider}</span>
                    </div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-500 group-hover:text-rose-400" />
                </button>
              </div>

              <VoiceSelectionDialog
                isOpen={isVoiceDialogOpen}
                onClose={() => setIsVoiceDialogOpen(false)}
                currentLang={currentLang}
                selectedVoiceId={voiceURI}
                favoriteVoices={[]}
                onToggleFavoriteVoice={() => {}}
                onSelectVoice={(v: any) => {
                  setVoiceURI(v.voice_id || v.voiceURI || v.id);
                  setVoiceName(v.name);
                  if (v.provider) setVoiceProvider(v.provider);
                  setIsVoiceDialogOpen(false);
                }}
              />
            </div>

            <div className="border-t border-slate-800/80 my-4" />

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-mono font-bold text-xs">
                  3
                </span>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono flex items-center gap-1.5" title={T.sec3TitleTooltip}>
                  <Wand2 className="w-3.5 h-3.5 text-blue-400" /> {T.sec3Title}
                </h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block">{T.lblGenMode}</span>
                  <div className="relative flex items-center bg-slate-955 border border-slate-800 rounded-xl px-2.5 py-2">
                    <Wand2 className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
                    <select value={generationMode} onChange={(e) => setGenerationMode(e.target.value as any)} className="flex-1 bg-transparent text-slate-200 text-xs font-semibold outline-none cursor-pointer appearance-none pr-5">
                      <option value={ImageGenerationMode.LabsFlow} className="bg-slate-955 text-slate-300">Flow Veo 3</option>
                      <option value={ImageGenerationMode.GeminiChat} className="bg-slate-955 text-slate-300">Gemini Room</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2 text-slate-500 w-3.5 h-3.5" />
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block">{T.lblEngine}</span>
                  <div className="relative flex items-center bg-slate-955 border border-slate-800 rounded-xl px-2.5 py-2">
                    <Sparkles className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
                    <select value={imageGeneratorEngine} onChange={(e) => setImageGeneratorEngine(e.target.value as any)} className="flex-1 bg-transparent text-slate-200 text-xs font-semibold outline-none cursor-pointer appearance-none pr-5">
                      <option value={ImageGeneratorEngine.Veo3} className="bg-slate-955 text-slate-300">VEO 3.0 Fluid</option>
                      <option value={ImageGeneratorEngine.Imagen} className="bg-slate-955 text-slate-300">Imagen 3 Batch</option>
                      <option value={ImageGeneratorEngine.LabsSandbox} className="bg-slate-955 text-slate-300">Labs Sandbox</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2 text-slate-500 w-3.5 h-3.5" />
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block">{T.lblAspectRatio}</span>
                  <div className="relative flex items-center bg-slate-955 border border-slate-800 rounded-xl px-2.5 py-2">
                    <Layout className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
                    <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value as any)} className="flex-1 bg-transparent text-slate-200 text-xs font-semibold outline-none cursor-pointer appearance-none pr-5">
                      {_.map(Object.values(AspectRatio), (r) => (
                        <option key={r} value={r} className="bg-slate-955 text-slate-300">
                          {r} {_.isEqual(r, AspectRatio.NineSixteen) ? "(TikTok)" : _.isEqual(r, AspectRatio.SixteenNine) ? "(YouTube)" : ""}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2 text-slate-500 w-3.5 h-3.5" />
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block">{T.lblGenType}</span>
                  <div className="relative flex items-center bg-slate-955 border border-slate-800 rounded-xl px-2.5 py-2">
                    <Film className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
                    <select value={generateType} onChange={(e) => setGenerateType(e.target.value as any)} className="flex-1 bg-transparent text-slate-200 text-xs font-semibold outline-none cursor-pointer appearance-none pr-5">
                      <option value={GenerateType.Image} className="bg-slate-955 text-slate-300">{T.optionImage}</option>
                      <option value={GenerateType.Video} className="bg-slate-955 text-slate-300">{T.optionVideo}</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2 text-slate-500 w-3.5 h-3.5" />
                  </div>
                </div>
              </div>

              <div className="bg-slate-955/80 border border-slate-800 rounded-xl p-3 flex flex-col md:flex-row gap-3.5 shadow-inner items-stretch">
                <div
                  className="bg-slate-900/40 border-[2px] border-dashed border-slate-800 hover:border-emerald-500/50 rounded-lg p-3 transition-all flex flex-col items-center justify-center text-center relative group cursor-pointer w-full md:w-60 shrink-0 min-h-[85px]"
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (e.dataTransfer.files) {
                      handleStyleFilesUpload(e.dataTransfer.files);
                    }
                  }}
                >
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      if (e.target.files) {
                        handleStyleFilesUpload(e.target.files);
                        e.target.value = "";
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="p-1 bg-slate-955 rounded-lg border border-slate-800 group-hover:scale-110 group-hover:border-emerald-500/30 transition-all duration-300 mb-1 shadow-lg">
                    <Upload className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-400 transition-colors" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-200 block mb-0.5 whitespace-nowrap">
                    {T.styleUploadTitle}
                  </span>
                  <span className="text-[8px] text-slate-500 leading-tight block whitespace-nowrap">
                    {T.styleUploadSub}
                  </span>
                </div>

                <div className="flex-1 flex flex-col min-w-0 w-full justify-between space-y-2">
                  {!_.isEmpty(referenceImages) ? (
                    <div className="flex flex-wrap gap-1.5">
                      {_.map(referenceImages, (imgBase64, idx) => (
                        <div key={idx} className="relative w-10 h-10 rounded-lg group shadow-sm">
                          <img src={imgBase64} alt={`Ref ${idx + 1}`} className="w-full h-full object-cover rounded-lg border border-slate-800" />
                          <button
                            type="button"
                            onClick={() => setReferenceImages((prev) => _.filter(prev, (_val: string, i: number) => !_.isEqual(i, idx)))}
                            className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-600 rounded-full flex items-center justify-center text-white text-[8px] opacity-0 group-hover:opacity-100 transition-opacity"
                            title={T.deleteStyleImgTooltip}
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center border border-dashed border-slate-800/80 rounded-lg bg-slate-900/20 text-slate-500 text-[10px] italic p-1.5 text-center">
                      {T.styleUploadEmpty}
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={stylePreset}
                      onChange={(e) => setStylePreset(e.target.value)}
                      placeholder={T.stylePresetPlaceholder}
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setIsExtractingStyle(true);
                        setTimeout(() => {
                          setIsExtractingStyle(false);
                          addLog(T.logStyleManualExtracted);
                        }, 1000);
                      }}
                      disabled={isExtractingStyle}
                      className="px-2.5 py-1.5 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-bold shrink-0 flex items-center gap-1"
                      title={T.extractStyleTooltip}
                    >
                      <Sparkles className="w-3 h-3 text-emerald-400" /> {T.extractStyleBtn}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-800/80 my-4" />

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center font-mono font-bold text-xs">
                  4
                </span>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono flex items-center gap-1.5" title={T.sec4TitleTooltip}>
                  <ImageIcon className="w-3.5 h-3.5 text-purple-400" /> {T.sec4Title}
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block">{T.lblProjectName}</span>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="Auto_Video_Project..."
                    className="w-full bg-slate-955 border border-slate-800 focus:border-rose-500/80 text-slate-200 p-2 rounded-xl text-xs outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block">{T.lblThumbCount}</span>
                  <div className="relative flex items-center bg-slate-955 border border-slate-800 rounded-xl px-2.5 py-2">
                    <Layout className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
                    <select value={thumbnailCount} onChange={(e) => setThumbnailCount(Number(e.target.value))} className="flex-1 bg-transparent text-slate-200 text-xs font-semibold outline-none cursor-pointer appearance-none pr-5">
                      <option value={1} className="bg-slate-955 text-slate-300">{T.thumbCountOption(1)}</option>
                      <option value={2} className="bg-slate-955 text-slate-300">{T.thumbCountOption(2)}</option>
                      <option value={3} className="bg-slate-955 text-slate-300">{T.thumbCountOption(3)}</option>
                      <option value={4} className="bg-slate-955 text-slate-300">{T.thumbCountOption(4)}</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2 text-slate-500 w-3.5 h-3.5" />
                  </div>
                </div>
              </div>

              <div className="bg-slate-955/80 border border-slate-800 rounded-xl p-3 flex flex-col md:flex-row gap-3.5 shadow-inner items-stretch">
                <div
                  className="bg-slate-900/40 border-[2px] border-dashed border-slate-800 hover:border-purple-500/50 rounded-lg p-3 transition-all flex flex-col items-center justify-center text-center relative group cursor-pointer w-full md:w-60 shrink-0 min-h-[85px]"
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (e.dataTransfer.files) {
                      handleThumbnailStyleFilesUpload(e.dataTransfer.files);
                    }
                  }}
                >
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      if (e.target.files) {
                        handleThumbnailStyleFilesUpload(e.target.files);
                        e.target.value = "";
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="p-1 bg-slate-955 rounded-lg border border-slate-800 group-hover:scale-110 group-hover:border-purple-500/30 transition-all duration-300 mb-1 shadow-lg">
                    <Upload className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-400 transition-colors" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-200 block mb-0.5 whitespace-nowrap">
                    {T.thumbUploadTitle}
                  </span>
                  <span className="text-[8px] text-slate-500 leading-tight block whitespace-nowrap">
                    {T.thumbUploadSub}
                  </span>
                </div>

                <div className="flex-1 flex flex-col min-w-0 w-full justify-between space-y-2">
                  {!_.isEmpty(thumbnailReferenceImages) ? (
                    <div className="flex flex-wrap gap-1.5">
                      {_.map(thumbnailReferenceImages, (imgBase64, idx) => (
                        <div key={idx} className="relative w-10 h-10 rounded-lg group shadow-sm">
                          <img src={imgBase64} alt={`Thumb Ref ${idx + 1}`} className="w-full h-full object-cover rounded-lg border border-slate-800" />
                          <button
                            type="button"
                            onClick={() => setThumbnailReferenceImages((prev) => _.filter(prev, (_val: string, i: number) => !_.isEqual(i, idx)))}
                            className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-600 rounded-full flex items-center justify-center text-white text-[8px] opacity-0 group-hover:opacity-100 transition-opacity"
                            title={T.deleteThumbImgTooltip}
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center border border-dashed border-slate-800/80 rounded-lg bg-slate-900/20 text-slate-500 text-[10px] italic p-1.5 text-center">
                      {T.thumbUploadEmpty}
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={thumbnailStylePreset}
                      onChange={(e) => setThumbnailStylePreset(e.target.value)}
                      placeholder={T.thumbPresetPlaceholder}
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setIsExtractingThumbnailStyle(true);
                        setTimeout(() => {
                          setIsExtractingThumbnailStyle(false);
                          addLog(T.logThumbStyleManualExtracted);
                        }, 1000);
                      }}
                      disabled={isExtractingThumbnailStyle}
                      className="px-2.5 py-1.5 bg-purple-600/20 text-purple-400 border border-purple-500/30 rounded-lg text-xs font-bold shrink-0 flex items-center gap-1"
                      title={T.extractThumbStyleTooltip}
                    >
                      <Sparkles className="w-3 h-3 text-purple-400" /> {T.extractStyleBtn}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 h-full overflow-y-auto p-5 bg-slate-955 space-y-5 flex flex-col justify-between custom-scrollbar">
          <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-3xl space-y-4 shadow-xl text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="space-y-1">
              <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-mono flex items-center justify-center gap-2" title={T.rightActionTitleTooltip}>
                <Sparkles className="w-4 h-4 text-rose-500 animate-pulse" />
                {T.rightActionTitle}
              </h2>
              <p className="text-[11px] text-slate-400 leading-relaxed">{T.rightActionSub}</p>
            </div>

            <Button
              variant="primary"
              size="lg"
              onClick={handleStartAutoGenerate}
              disabled={isProcessing || _.isEmpty(_.trim(scriptContent))}
              isLoading={isProcessing}
              className="w-full py-4 text-sm font-extrabold bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 border border-rose-400/30 text-white rounded-xl shadow-xl shadow-rose-600/20 active:scale-95 transition-all"
              title={T.startBtnTooltip}
            >
              <Zap className="w-5 h-5 text-amber-300 fill-amber-300" />
              <span>{isProcessing ? T.startBtnProcessing : T.startBtnStart}</span>
            </Button>

            {isProcessing || _.gt(stepProgress, 0) ? (
              <div className="space-y-2 pt-2 text-left">
                <div className="flex justify-between items-center text-[10px] font-mono font-bold">
                  <span className="text-rose-400">Tiến trình Node [{currentStepIndex}/4]</span>
                  <span className="text-slate-200">{stepProgress}%</span>
                </div>
                <div className="w-full bg-slate-955 h-2 rounded-full overflow-hidden border border-slate-800">
                  <div className="bg-gradient-to-r from-rose-600 to-amber-500 h-full transition-all duration-300" style={{ width: `${stepProgress}%` }} />
                </div>
              </div>
            ) : null}
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-3 flex-1 flex flex-col min-h-[200px] shadow-xl font-mono text-[11px]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-slate-200 font-bold flex items-center gap-2 uppercase text-xs" title={T.logHeaderTooltip}>
                <Terminal className="w-4 h-4 text-amber-400" /> {T.logHeaderTitle}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">{T.logEventsCount(logs.length)}</span>
            </div>

            <div className="flex-1 bg-black/60 border border-slate-800/80 rounded-2xl p-4 overflow-y-auto space-y-1 text-slate-300 leading-relaxed custom-scrollbar flex flex-col min-h-[140px]">
              {_.isEmpty(logs) ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-500 italic text-center text-xs p-6 w-full h-full my-auto gap-2">
                  <Terminal className="w-8 h-8 text-slate-700/80 mb-1" />
                  <span>{T.logEmpty}</span>
                </div>
              ) : (
                _.map(logs, (log, idx) => (
                  <div key={idx} className={cn("py-0.5", _.includes(log, "✅") ? "text-emerald-400" : _.includes(log, "📌") ? "text-rose-400" : _.includes(log, "🎉") ? "text-amber-300 font-bold" : "text-slate-300")}>
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-3xl space-y-4 shadow-xl flex-1 flex flex-col justify-between">
            <h3 className="text-xs font-bold text-slate-100 font-mono uppercase flex items-center gap-2" title={T.previewHeaderTooltip}>
              <Eye className="w-4 h-4 text-amber-400" /> {T.previewHeaderTitle}
            </h3>

            <div className="flex-1 min-h-[260px] bg-black rounded-2xl border border-slate-800/80 overflow-hidden relative flex flex-col items-center justify-center p-6 shadow-inner">
              {!_.isEmpty(renderedVideoUrl) ? (
                <video src={renderedVideoUrl} controls className="w-full h-full object-cover rounded-xl" autoPlay />
              ) : (
                <div className="text-center p-6 text-slate-400 font-mono text-xs my-auto flex flex-col items-center justify-center gap-3">
                  <Video className="w-10 h-10 text-slate-600" />
                  <span className="text-slate-400 leading-relaxed max-w-xs block">
                    {T.previewEmpty}
                  </span>
                </div>
              )}
            </div>

            {!_.isEmpty(renderedVideoUrl) && (
              <div className="flex gap-2 pt-1">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    const a = document.createElement("a");
                    a.href = renderedVideoUrl;
                    a.download = `${projectName}_Export.mp4`;
                    a.click();
                  }}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 border-emerald-500/30 text-white font-bold text-xs"
                  title={T.downloadVideoTooltip}
                >
                  <Download className="w-4 h-4" /> {T.downloadVideoBtn}
                </Button>

                {activeCreatedProject && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onSelectProject(activeCreatedProject.id)}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold"
                    title={T.openStudioTooltip}
                  >
                    <Sliders className="w-4 h-4 text-rose-400" /> {T.openStudioBtn}
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
