import { cn } from "../lib/utils";
import React from "react";
import { usePipelineWizard } from "./pipeline/usePipelineWizard";
import PipelineStep0 from "./pipeline/PipelineStep0";
import PipelineStep1 from "./pipeline/PipelineStep1";
import PipelineStep2 from "./pipeline/PipelineStep2";
import PipelineStep3 from "./pipeline/PipelineStep3";
import PipelineStep4 from "./pipeline/PipelineStep4";
import PipelineStep5 from "./pipeline/PipelineStep5";
import PipelineStep6 from "./pipeline/PipelineStep6";
import { PipelineWizardProps, WizardStep, GenerateType, PromptInputMethod, ImageGeneratorEngine, ImageGenerationMode, GeminiChatSpeed, AspectRatio, BatchDelayOption } from "../types";
import { APP_TEXTS, GEMINI_CHAT_SPEED_OPTIONS, BATCH_DELAY_OPTIONS, COMMON_STRINGS, APP_CONFIG, AppLanguage, VOICE_PROVIDER_MAPPINGS, VOICE_DESCRIPTION_KEYS } from "../constants";
import { VOICE_MODIFIERS } from "../constants/defaultConfigs";
import _ from "lodash";


import { motion, AnimatePresence } from "framer-motion";
import * as LucideIcons from "lucide-react";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import { Tooltip } from "./ui/Tooltip";
import { AlertCircle, Download, Pause, Terminal, Workflow } from "lucide-react";

const { ArrowLeft, Settings2, Volume2, Play, User, Layers, Check, Sparkles, Search, X, ImageIcon, Video, ChevronDown, Type, ClipboardPaste, Heart, Trash, Copy, Pencil, Palette } = LucideIcons as any;

export default function PipelineWizard(props: PipelineWizardProps) {
  const wizard = usePipelineWizard(props);
  const {
    t,
    project,
    setProject,
    currentStep,
    setCurrentStep,
    leftSidebarOpen,
    setLeftSidebarOpen,
    rightSidebarOpen,
    setRightSidebarOpen,
    errorMsg,
    setErrorMsg,
    infoMsg,
    setInfoMsg,
    zoomedImage,
    setZoomedImage,
    systemLogs,
    showLogsModal,
    setShowLogsModal,
    systemVoices,
    voiceDropdownOpen,
    handleCloseVoiceModal,
    voiceSearch,
    setVoiceSearch,
    voiceTypeFilter,
    setVoiceTypeFilter,
    voiceLangFilter,
    setVoiceLangFilter,
    selectedGenderFilter,
    setSelectedGenderFilter,
    playingVoiceURI,
    playVoicePreview,
    currentLang,
    getVoiceGender,
    isPremiumVoice,
    favoriteStyles,
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
  } = wizard;

  const logsEndRef = React.useRef<HTMLDivElement>(null);
  const [showGenSettings, setShowGenSettings] = React.useState(false);
  const [favFormName, setFavFormName] = React.useState("");
  const [favFormURI, setFavFormURI] = React.useState("");
  const [favFormChannel, setFavFormChannel] = React.useState("");
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editFormName, setEditFormName] = React.useState("");
  const [editFormURI, setEditFormURI] = React.useState("");
  const [editFormChannel, setEditFormChannel] = React.useState("");

  const [favStyleFormName, setFavStyleFormName] = React.useState("");
  const [favStyleFormPrompt, setFavStyleFormPrompt] = React.useState("");
  const [editingStyleId, setEditingStyleId] = React.useState<string | null>(null);
  const [editStyleFormName, setEditStyleFormName] = React.useState("");
  const [editStyleFormPrompt, setEditStyleFormPrompt] = React.useState("");

  const [visitedSteps, setVisitedSteps] = React.useState<Record<number, boolean>>({
    [currentStep]: true,
  });

  if (!visitedSteps[currentStep]) {
    setVisitedSteps((prev) => ({ ...prev, [currentStep]: true }));
  }

  const handleAddFavorite = () => {
    if (!favFormName.trim() || !favFormURI.trim()) return;
    handleAddFavoriteVoice(favFormName, favFormURI, favFormChannel);
    setFavFormName("");
    setFavFormURI("");
    setFavFormChannel("");
  };

  const handleDeleteFavorite = (id: string, e: React.MouseEvent) => {
    handleDeleteFavoriteVoice(id, e);
    if (editingId === id) {
      handleCancelEdit();
    }
  };

  const handleStartEdit = (item: any) => {
    setEditingId(item.id);
    setEditFormName(item.name);
    setEditFormURI(item.voiceURI);
    setEditFormChannel(item.channelName);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditFormName("");
    setEditFormURI("");
    setEditFormChannel("");
  };

  const handleSaveEdit = (id: string) => {
    if (!editFormName.trim() || !editFormURI.trim()) return;
    handleSaveEditVoice(id, editFormName, editFormURI, editFormChannel);
    handleCancelEdit();
  };

  const handleSaveCurrentVoice = () => {
    const curURI = project.voiceConfig?.voiceURI;
    const curName = project.voiceConfig?.voiceName || curURI;
    const curProvider = project.voiceConfig?.provider || COMMON_STRINGS.CUSTOM;

    if (!curURI) return;
    if (_.some(favoriteVoices, (v) => v.voiceURI === curURI)) {
      setInfoMsg(t.saveVoiceSuccess);
      setTimeout(() => setInfoMsg(""), APP_CONFIG.TOAST_DURATION);
      return;
    }

    handleAddFavoriteVoice(curName, curURI, curProvider);
  };

  const updateVisualConfig = (updates: Partial<typeof project.visualConfig>) => {
    setProject({
      ...project,
      visualConfig: {
        ...project.visualConfig,
        ...updates,
      },
    });
  };

  React.useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [systemLogs, showLogsModal]);

  return (
    <div className="flex-1 w-full h-full flex flex-col min-h-0 bg-slate-950 text-slate-100 font-sans overflow-hidden select-none">
      <div className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 shrink-0 z-50 shadow-sm relative">
        <div className="flex items-center gap-3">
          <Tooltip content={t.Back_to_projects} position="bottom">
            <Button variant="ghost" size="sm" onClick={props.onBackToDashboard} className="flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-slate-100 bg-slate-900 hover:bg-slate-850 px-3 py-1.5 rounded-lg border border-transparent shadow-none h-auto">
              <ArrowLeft className="w-3.5 h-3.5 text-rose-500" />
              <span>{t.Projects}</span>
            </Button>
          </Tooltip>
          <div className="h-4 w-[1px] bg-slate-850" />
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-medium text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-full select-none">{t.Pro}</span>
            <span className="text-xs font-medium text-slate-300 truncate max-w-[150px] sm:max-w-none">{project.name}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 relative">
          <Tooltip content={t.Image_Generation_Settings} position="bottom">
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={() => {
                setShowGenSettings(!showGenSettings);
                setShowFavVoices(false);
                setShowFavStyles(false);
                setShowLogsModal(false);
              }}
              className={cn(`p-2 rounded-lg border shadow-none h-auto w-auto ${showGenSettings ? "bg-rose-500/10 border-rose-500/20 text-rose-500 hover:text-rose-500 hover:bg-rose-500/10" : "bg-slate-900 border-transparent text-slate-500 hover:text-slate-200 hover:bg-slate-850"}`)}
            >
              <ImageIcon className="w-4 h-4" />
            </Button>
          </Tooltip>

          <Tooltip content={t.favVoicesTitle} position="bottom">
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={() => {
                setShowFavVoices(!showFavVoices);
                setShowFavStyles(false);
                setShowGenSettings(false);
                setShowLogsModal(false);
              }}
              className={cn(`p-2 rounded-lg border shadow-none h-auto w-auto ${showFavVoices ? "bg-rose-500/10 border-rose-500/20 text-rose-500 hover:text-rose-500 hover:bg-rose-500/10" : "bg-slate-900 border-transparent text-slate-500 hover:text-slate-200 hover:bg-slate-850"}`)}
            >
              <Heart className={cn(`w-4 h-4 ${showFavVoices ? "fill-rose-500 text-rose-500" : ""}`)} />
            </Button>
          </Tooltip>

          <Tooltip content={t.favStylesTitle} position="bottom">
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={() => {
                setShowFavStyles(!showFavStyles);
                setShowFavVoices(false);
                setShowGenSettings(false);
                setShowLogsModal(false);
              }}
              className={cn(`p-2 rounded-lg border shadow-none h-auto w-auto ${showFavStyles ? "bg-rose-500/10 border-rose-500/20 text-rose-500 hover:text-rose-500 hover:bg-rose-500/10" : "bg-slate-900 border-transparent text-slate-500 hover:text-slate-200 hover:bg-slate-850"}`)}
            >
              <Palette className={cn(`w-4 h-4 ${showFavStyles ? "fill-rose-500 text-rose-500" : ""}`)} />
            </Button>
          </Tooltip>

          <AnimatePresence>
            {showGenSettings && (
              <motion.div initial={{ opacity: 0, y: -15, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.98 }} transition={{ duration: 0.15, ease: "easeOut" }} style={{ transformOrigin: "top right" }} className="absolute top-full right-[50px] mt-2 w-[300px] bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-[9999] overflow-hidden">
                <div className="p-4 space-y-4">
                  <div className="space-y-1.5">
                    <div className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest px-1">{t.Generation_Mode}</div>
                    <div className="flex gap-1 bg-slate-950 rounded-[10px] p-1.5 border border-slate-800/60 shadow-inner">
                      <Button variant="unstyled" type="button" onClick={() => updateVisualConfig({ generationMode: ImageGenerationMode.LabsFlow })} className={cn(`flex-1 py-1.5 rounded-md text-[10px] font-bold transition-all shadow-sm h-auto flex items-center justify-center ${project.visualConfig.generationMode !== ImageGenerationMode.GeminiChat ? "bg-slate-800 text-slate-100 border border-slate-600 shadow-md shadow-black/40 ring-1 ring-slate-900/50 z-10" : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 hover:shadow-sm border border-transparent focus:outline-none focus:ring-2 focus:ring-rose-500/30"}`)}>
                        {t.Labs_Flow_Mode}
                      </Button>
                      <Button variant="unstyled" type="button" onClick={() => updateVisualConfig({ generationMode: ImageGenerationMode.GeminiChat })} className={cn(`flex-1 py-1.5 rounded-md text-[10px] font-bold transition-all shadow-sm h-auto flex items-center justify-center ${project.visualConfig.generationMode === ImageGenerationMode.GeminiChat ? "bg-slate-800 text-slate-100 border border-slate-600 shadow-md shadow-black/40 ring-1 ring-slate-900/50 z-10" : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 hover:shadow-sm border border-transparent focus:outline-none focus:ring-2 focus:ring-rose-500/30"}`)}>
                        {t.Gemini_Chat_Mode}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest px-1">{t.Generate_Type}</div>
                    <div className="flex gap-1 bg-slate-950 rounded-[10px] p-1.5 border border-slate-800/60 shadow-inner">
                      <Button variant="unstyled" type="button" onClick={() => updateVisualConfig({ generateType: GenerateType.Image })} className={cn(`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-[11px] font-bold transition-all shadow-sm h-auto ${project.visualConfig.generateType !== GenerateType.Video ? "bg-slate-800 text-slate-100 border border-slate-600 shadow-md shadow-black/40 ring-1 ring-slate-900/50 z-10" : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 hover:shadow-sm border border-transparent focus:outline-none focus:ring-2 focus:ring-rose-500/30"}`)}>
                        <ImageIcon className="w-3.5 h-3.5" /> {t.Image}
                      </Button>
                      <Button variant="unstyled" type="button" onClick={() => updateVisualConfig({ generateType: GenerateType.Video })} className={cn(`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-[11px] font-bold transition-all shadow-sm h-auto ${project.visualConfig.generateType === GenerateType.Video ? "bg-slate-800 text-slate-100 border border-slate-600 shadow-md shadow-black/40 ring-1 ring-slate-900/50 z-10" : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 hover:shadow-sm border border-transparent focus:outline-none focus:ring-2 focus:ring-rose-500/30"}`)}>
                        <Video className="w-3.5 h-3.5" /> {t.Video}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest px-1">{t.Aspect_Ratio}</div>
                    <div className="flex gap-1 bg-slate-950 rounded-[10px] p-1.5 border border-slate-800/60 shadow-inner">
                      {Object.values(AspectRatio).map((ratio) => (
                        <Button variant="unstyled" type="button" key={ratio} onClick={() => updateVisualConfig({ aspectRatio: ratio })} className={cn(`flex-1 py-1.5 rounded-md text-[10px] font-bold transition-all shadow-sm h-auto flex items-center justify-center ${project.visualConfig.aspectRatio === ratio || (!project.visualConfig.aspectRatio && ratio === AspectRatio.SixteenNine) ? "bg-slate-800 text-slate-100 border border-slate-600 shadow-md shadow-black/40 ring-1 ring-slate-900/50 z-10" : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 hover:shadow-sm border border-transparent focus:outline-none focus:ring-2 focus:ring-rose-500/30"}`)}>
                          {ratio}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest px-1">{t.Input_Method_Labs}</div>
                    <div className="flex gap-1 bg-slate-950 rounded-[10px] p-1.5 border border-slate-800/60 shadow-inner">
                      <Button variant="unstyled" type="button" onClick={() => updateVisualConfig({ promptInputMethod: PromptInputMethod.Type })} className={cn(`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[10px] font-bold transition-all shadow-sm h-auto ${project.visualConfig.promptInputMethod === PromptInputMethod.Type ? "bg-slate-800 text-slate-100 border border-slate-600 shadow-md shadow-black/40 ring-1 ring-slate-900/50 z-10" : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 hover:shadow-sm border border-transparent focus:outline-none focus:ring-2 focus:ring-rose-500/30"}`)}>
                        <Type className="w-3 h-3" /> {t.Type_Text}
                      </Button>
                      <Button variant="unstyled" type="button" onClick={() => updateVisualConfig({ promptInputMethod: PromptInputMethod.Paste })} className={cn(`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[10px] font-bold transition-all shadow-sm h-auto ${project.visualConfig.promptInputMethod !== PromptInputMethod.Type ? "bg-slate-800 text-slate-100 border border-slate-600 shadow-md shadow-black/40 ring-1 ring-slate-900/50 z-10" : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 hover:shadow-sm border border-transparent focus:outline-none focus:ring-2 focus:ring-rose-500/30"}`)}>
                        <ClipboardPaste className="w-3 h-3" /> {t.Quick_Paste}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest px-1">{t.Sample_Count}</div>
                    <div className="flex gap-1 bg-slate-950 rounded-[10px] p-1.5 border border-slate-800/60 shadow-inner">
                      {[1, 2, 3, 4].map((count) => (
                        <Button variant="unstyled" type="button" key={count} onClick={() => updateVisualConfig({ generateCount: count })} className={cn(`flex-1 py-1.5 rounded-md text-[10px] font-bold transition-all shadow-sm h-auto flex items-center justify-center ${project.visualConfig.generateCount === count || (count === 1 && !project.visualConfig.generateCount) ? "bg-slate-800 text-slate-100 border border-slate-600 shadow-md shadow-black/40 ring-1 ring-slate-900/50 z-10" : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 hover:shadow-sm border border-transparent focus:outline-none focus:ring-2 focus:ring-rose-500/30"}`)}>
                          {count === 1 ? "1x" : `x${count}`}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest px-1">{t.Chrome_Mode}</div>
                    <div className="flex gap-1 bg-slate-950 rounded-[10px] p-1.5 border border-slate-800/60 shadow-inner">
                      <Button variant="unstyled" type="button" onClick={() => updateVisualConfig({ chromeHeadless: true })} className={cn(`flex-1 py-1.5 rounded-md text-[10px] font-bold transition-all shadow-sm h-auto flex items-center justify-center ${project.visualConfig.chromeHeadless !== false ? "bg-slate-800 text-slate-100 border border-slate-600 shadow-md shadow-black/40 ring-1 ring-slate-900/50 z-10" : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 hover:shadow-sm border border-transparent focus:outline-none focus:ring-2 focus:ring-rose-500/30"}`)}>
                        {t.Chrome_Hidden}
                      </Button>
                      <Button variant="unstyled" type="button" onClick={() => updateVisualConfig({ chromeHeadless: false })} className={cn(`flex-1 py-1.5 rounded-md text-[10px] font-bold transition-all shadow-sm h-auto flex items-center justify-center ${project.visualConfig.chromeHeadless === false ? "bg-slate-800 text-slate-100 border border-slate-600 shadow-md shadow-black/40 ring-1 ring-slate-900/50 z-10" : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 hover:shadow-sm border border-transparent focus:outline-none focus:ring-2 focus:ring-rose-500/30"}`)}>
                        {t.Chrome_Visible}
                      </Button>
                    </div>
                  </div>
                  {project.visualConfig.generationMode === ImageGenerationMode.GeminiChat && (
                    <div className="space-y-1.5">
                      <div className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest px-1">{t.Generation_Speed}</div>
                      <div className="flex gap-1 bg-slate-950 rounded-[10px] p-1.5 border border-slate-800/60 shadow-inner">
                        {GEMINI_CHAT_SPEED_OPTIONS.map((opt) => {
                          const label = t[opt.labelKey as keyof typeof t] || opt.fallbackLabel;
                          const isActive = project.visualConfig.geminiChatSpeed === opt.value || (!project.visualConfig.geminiChatSpeed && opt.value === GeminiChatSpeed.Slow);
                          return (
                            <Button variant="unstyled" type="button" key={opt.value} onClick={() => updateVisualConfig({ geminiChatSpeed: opt.value as any })} className={cn(`flex-1 py-1.5 rounded-md text-[10px] font-bold transition-all shadow-sm h-auto flex items-center justify-center ${isActive ? "bg-slate-800 text-slate-100 border border-slate-600 shadow-md shadow-black/40 ring-1 ring-slate-900/50 z-10" : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 hover:shadow-sm border border-transparent focus:outline-none focus:ring-2 focus:ring-rose-500/30"}`)}>
                              {label}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <div className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest px-1">{t.Batch_Delay || (currentLang === AppLanguage.VI ? APP_TEXTS.VN.BATCH_DELAY : APP_TEXTS.EN.BATCH_DELAY)}</div>
                    <div className="relative">
                      <select
                        value={project.visualConfig.batchDelay || BatchDelayOption.Default}
                        onChange={(e) => updateVisualConfig({ batchDelay: e.target.value as BatchDelayOption })}
                        className="w-full appearance-none bg-slate-950 border border-slate-800/50 rounded-lg py-2 pl-3 pr-8 text-[11px] text-slate-200 font-semibold focus:outline-none focus:border-rose-500/50 transition-colors cursor-pointer shadow-inner"
                      >
                        {BATCH_DELAY_OPTIONS.map((opt) => {
                          const label = t[opt.labelKey as keyof typeof t] || (currentLang === AppLanguage.VI ? APP_TEXTS.VN[opt.labelKey as keyof typeof APP_TEXTS.VN] : APP_TEXTS.EN[opt.labelKey as keyof typeof APP_TEXTS.EN]) || opt.value;
                          return (
                            <option key={opt.value} value={opt.value} className="bg-slate-900 text-slate-200">
                              {label}
                            </option>
                          );
                        })}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest px-1">{t.Drawing_Model}</div>
                    <div className="relative">
                      <select
                        value={project.visualConfig.imageGeneratorEngine || ImageGeneratorEngine.Veo3}
                        onChange={(e) => updateVisualConfig({ imageGeneratorEngine: e.target.value as any })}
                        className="w-full appearance-none bg-slate-950 border border-slate-800/50 rounded-lg py-2.5 pl-3 pr-8 text-[11px] text-slate-200 font-semibold focus:outline-none focus:border-rose-500/50 transition-colors cursor-pointer shadow-inner"
                      >
                        {project.visualConfig.generationMode === ImageGenerationMode.GeminiChat ? [
                          <option key="gemini-pro" value={ImageGeneratorEngine.Imagen} className="bg-slate-900 text-slate-200">{t.Gemini_Pro}</option>,
                          <option key="gemini-flash" value={ImageGeneratorEngine.Veo3} className="bg-slate-900 text-slate-200">{t.Gemini_Flash}</option>,
                          <option key="gemini-flash-lite" value={ImageGeneratorEngine.LabsSandbox} className="bg-slate-900 text-slate-200">{t.Gemini_Flash_Lite}</option>
                        ] : [
                          <option key="imagen-3" value={ImageGeneratorEngine.Imagen} className="bg-slate-900 text-slate-200">{t.Imagen_3}</option>,
                          <option key="nano-banana" value={ImageGeneratorEngine.Veo3} className="bg-slate-900 text-slate-200">{t.Nano_Banana_2}</option>,
                          <option key="labs-sandbox" value={ImageGeneratorEngine.LabsSandbox} className="bg-slate-900 text-slate-200">{t.Labs_Sandbox}</option>
                        ]}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showFavVoices && (
              <motion.div initial={{ opacity: 0, y: -15, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.98 }} transition={{ duration: 0.15, ease: "easeOut" }} style={{ transformOrigin: "top right" }} className="absolute top-full right-0 mt-2 w-[340px] bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-[9999] overflow-hidden">
                <div className="p-4 space-y-4 text-left">
                  <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5 font-mono">
                      <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                      {t.favVoicesTitle}
                    </span>
                    {project.voiceConfig?.voiceURI && (
                      <Button variant="secondary" size="xs" type="button" onClick={handleSaveCurrentVoice} className="px-2 py-1 text-[9px] font-bold rounded flex items-center gap-1">
                        <Volume2 className="w-2.5 h-2.5 text-rose-500" />
                        {t.saveCurrentVoice}
                      </Button>
                    )}
                  </div>

                  <div className="space-y-2 max-h-[180px] overflow-y-auto custom-scrollbar pr-1">
                    {favoriteVoices.length === 0 ? (
                      <div className="text-[10px] text-slate-500 italic text-center py-4">{t.favVoicesEmpty}</div>
                    ) : (
                      favoriteVoices.map((item) => {
                        const isCurrent = project.voiceConfig?.voiceURI === item.voiceURI;
                        const isEditing = editingId === item.id;
                        return (
                          <div key={item.id} className={cn(`group flex flex-col justify-between p-2 rounded-lg border transition-all ${isCurrent ? "bg-rose-550/[0.04] border-rose-500/30" : "bg-slate-950/40 border-slate-850 hover:border-slate-700 hover:bg-slate-900/30"}`)}>
                            {isEditing ? (
                              <div className="space-y-2 w-full text-left">
                                <div className="grid grid-cols-2 gap-1.5">
                                  <input type="text" value={editFormName} onChange={(e) => setEditFormName(e.target.value)} placeholder={t.voiceNamePlaceholder} className="w-full bg-slate-955 border border-slate-800 rounded px-1.5 py-1 text-[9px] text-slate-200 placeholder-slate-600 focus:outline-none focus:border-rose-500/50" />
                                  <input type="text" value={editFormChannel} onChange={(e) => setEditFormChannel(e.target.value)} placeholder={t.channelNamePlaceholder} className="w-full bg-slate-955 border border-slate-800 rounded px-1.5 py-1 text-[9px] text-slate-200 placeholder-slate-600 focus:outline-none focus:border-rose-500/50" />
                                </div>
                                <div className="flex gap-1.5">
                                  <input type="text" value={editFormURI} onChange={(e) => setEditFormURI(e.target.value)} placeholder={t.voiceIdPlaceholder} className="flex-1 bg-slate-955 border border-slate-800 rounded px-1.5 py-1 text-[9px] text-slate-200 placeholder-slate-600 focus:outline-none focus:border-rose-500/50" />
                                  <Button variant="primary" size="xs" type="button" onClick={() => handleSaveEdit(item.id)} className="px-2 py-1 text-[9px] font-bold bg-emerald-600 hover:bg-emerald-500 border-emerald-500/20 text-white flex items-center justify-center h-auto w-auto">
                                    <Check className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button variant="secondary" size="xs" type="button" onClick={handleCancelEdit} className="px-2 py-1 text-slate-355 text-[9px] font-bold flex items-center justify-center h-auto w-auto">
                                    <X className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between w-full">
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5">
                                    <span className={cn(`text-[10px] font-bold truncate ${isCurrent ? "text-rose-450" : "text-slate-200"}`)}>{item.name}</span>
                                    <Button
                                      variant="ghost"
                                      size="xs"
                                      type="button"
                                      onClick={() => {
                                        navigator.clipboard.writeText(item.name);
                                        setInfoMsg(t.voiceNameCopied);
                                        setTimeout(() => setInfoMsg(""), APP_CONFIG.TOAST_DURATION);
                                      }}
                                      title={t.copyVoiceName}
                                      className="p-0.5 hover:bg-slate-850 rounded text-slate-400 hover:text-slate-200 shadow-none h-auto w-auto"
                                    >
                                      <Copy className="w-2.5 h-2.5" />
                                    </Button>
                                    <span className="shrink-0 text-[8px] bg-slate-950 px-1 py-0.2 rounded border border-slate-850 font-mono text-slate-500">{item.channelName}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className="block text-[8px] text-slate-500 truncate font-mono select-all">{item.voiceURI}</span>
                                    <Button
                                      variant="ghost"
                                      size="xs"
                                      type="button"
                                      onClick={() => {
                                        navigator.clipboard.writeText(item.voiceURI);
                                        setInfoMsg(t.voiceIdCopied);
                                        setTimeout(() => setInfoMsg(""), APP_CONFIG.TOAST_DURATION);
                                      }}
                                      title="Copy Voice ID"
                                      className="p-0.5 hover:bg-slate-850 rounded text-slate-550 hover:text-slate-350 shadow-none h-auto w-auto"
                                    >
                                      <Copy className="w-2 h-2" />
                                    </Button>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 shrink-0 ml-2">
                                  <Button variant="ghost" size="xs" type="button" onClick={() => handleStartEdit(item)} className="p-1 hover:bg-slate-850 border border-transparent hover:border-slate-700 text-slate-400 hover:text-slate-200 rounded opacity-0 group-hover:opacity-100 shadow-none h-auto w-auto" title={t.editVoice}>
                                    <Pencil className="w-3 h-3" />
                                  </Button>
                                  <Button variant="ghost" size="xs" type="button" onClick={(e) => handleDeleteFavorite(item.id, e)} className="p-1 hover:bg-rose-950/30 border border-transparent hover:border-rose-500/20 text-slate-550 hover:text-rose-400 rounded opacity-0 group-hover:opacity-100 shadow-none h-auto w-auto" title={t.deleteVoice}>
                                    <Trash className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="border-t border-slate-850 pt-3 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <input type="text" value={favFormName} onChange={(e) => setFavFormName(e.target.value)} placeholder={t.voiceNamePlaceholder} className="w-full bg-slate-955 border border-slate-800 rounded p-1.5 text-[10px] text-slate-200 placeholder-slate-600 focus:outline-none focus:border-rose-500/50" />
                      <input type="text" value={favFormChannel} onChange={(e) => setFavFormChannel(e.target.value)} placeholder={t.channelNamePlaceholder} className="w-full bg-slate-955 border border-slate-800 rounded p-1.5 text-[10px] text-slate-200 placeholder-slate-600 focus:outline-none focus:border-rose-500/50" />
                    </div>
                    <div className="flex gap-2">
                      <input type="text" value={favFormURI} onChange={(e) => setFavFormURI(e.target.value)} placeholder={t.voiceIdPlaceholder} className="flex-1 bg-slate-955 border border-slate-800 rounded p-1.5 text-[10px] text-slate-200 placeholder-slate-600 focus:outline-none focus:border-rose-500/50" />
                      <Button variant="primary" size="sm" type="button" onClick={handleAddFavorite} className="px-3 text-white text-[10px] font-bold rounded">
                        {t.addFavVoiceBtn}
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showFavStyles && (
              <motion.div
                initial={{ opacity: 0, y: -15, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.98 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                style={{ transformOrigin: "top right" }}
                className="absolute top-full right-0 mt-2 w-[340px] bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-[9999] overflow-hidden"
              >
                <div className="p-4 space-y-4 text-left">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5 font-mono">
                      <Palette className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                      {t.favStylesTitle}
                    </span>
                    {project.visualConfig?.referencePrompt && (
                      <Button variant="secondary" size="xs" type="button" onClick={handleSaveCurrentStyle} className="px-2.5 py-1 text-[10px] font-bold rounded-lg flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5 text-rose-500" />
                        {t.saveCurrentStyle}
                      </Button>
                    )}
                  </div>

                  <div className="space-y-2 max-h-[180px] overflow-y-auto custom-scrollbar pr-1">
                    {favoriteStyles.length === 0 ? (
                      <div className="text-[10px] text-slate-500 italic text-center py-4">{t.favStylesEmpty}</div>
                    ) : (
                      favoriteStyles.map((item) => {
                        const isCurrent = project.visualConfig?.referencePrompt === item.prompt;
                        const isEditing = editingStyleId === item.id;
                        return (
                          <div key={item.id} className={cn(`group flex flex-col justify-between p-2.5 rounded-lg border transition-all ${isCurrent ? "bg-rose-500/[0.04] border-rose-500/30" : "bg-slate-950/40 border-slate-800 hover:border-slate-700 hover:bg-slate-850"}`)}>
                            {isEditing ? (
                              <div className="space-y-2 w-full text-left">
                                <input type="text" value={editStyleFormName} onChange={(e) => setEditStyleFormName(e.target.value)} placeholder={t.styleNamePlaceholder} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-[10px] text-slate-200 font-medium placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-rose-500/30 focus:border-rose-500/50 transition-all" />
                                <div className="flex gap-1.5">
                                  <input type="text" value={editStyleFormPrompt} onChange={(e) => setEditStyleFormPrompt(e.target.value)} placeholder={t.stylePromptPlaceholder} className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-[10px] text-slate-200 font-medium placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-rose-500/30 focus:border-rose-500/50 transition-all" />
                                  <Button
                                    variant="primary"
                                    size="xs"
                                    type="button"
                                    onClick={() => {
                                      handleSaveEditStyle(item.id, editStyleFormName, editStyleFormPrompt);
                                      setEditingStyleId(null);
                                    }}
                                    className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 border-emerald-500/20 text-white text-[10px] font-bold rounded flex items-center justify-center h-auto w-auto"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button variant="secondary" size="xs" type="button" onClick={() => setEditingStyleId(null)} className="px-2 py-1 text-[10px] font-bold rounded flex items-center justify-center h-auto w-auto">
                                    <X className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between w-full">
                                <div className="min-w-0 flex-1 cursor-pointer" onClick={() => handleApplyFavoriteStyle(item.prompt)}>
                                  <div className="flex items-center gap-1.5">
                                    <span className={cn(`text-[11px] font-bold truncate ${isCurrent ? "text-rose-500" : "text-slate-200"}`)}>{item.name}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 mt-1">
                                    <span className="block text-[10px] text-slate-400 truncate font-mono select-all max-w-[190px]">{item.prompt}</span>
                                    <Button
                                      variant="ghost"
                                      size="xs"
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        navigator.clipboard.writeText(item.prompt);
                                        setInfoMsg(t.stylePromptCopied);
                                        setTimeout(() => setInfoMsg(""), APP_CONFIG.TOAST_DURATION);
                                      }}
                                      title={t.copyStyleDesc}
                                      className="shrink-0 p-1.5 bg-slate-900 hover:bg-slate-850 border border-transparent hover:border-slate-700 rounded-lg text-slate-400 hover:text-slate-200 shadow-none h-auto w-auto transition-all"
                                    >
                                      <Copy className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                  <Button
                                    variant="ghost"
                                    size="xs"
                                    type="button"
                                    onClick={() => {
                                      setEditingStyleId(item.id);
                                      setEditStyleFormName(item.name);
                                      setEditStyleFormPrompt(item.prompt);
                                    }}
                                    className="p-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 rounded-lg shadow-sm h-auto w-auto transition-all"
                                    title={t.editStyle}
                                  >
                                    <Pencil className="w-3 h-3" />
                                  </Button>
                                  <Button variant="ghost" size="xs" type="button" onClick={(e) => handleDeleteFavoriteStyle(item.id, e)} className="p-1.5 bg-rose-950/30 hover:bg-rose-900/50 border border-rose-900/30 hover:border-rose-500/30 text-rose-400 hover:text-rose-300 rounded-lg shadow-sm h-auto w-auto transition-all" title={t.deleteStyle}>
                                    <Trash className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="border-t border-slate-800 pt-3 space-y-2 mt-2">
                    <input type="text" value={favStyleFormName} onChange={(e) => setFavStyleFormName(e.target.value)} placeholder={t.styleNamePlaceholder} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-200 font-medium placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-rose-500/30 focus:border-rose-500/50 transition-all shadow-inner" />
                    <div className="flex gap-2">
                      <input type="text" value={favStyleFormPrompt} onChange={(e) => setFavStyleFormPrompt(e.target.value)} placeholder={t.stylePromptPlaceholder} className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-200 font-medium placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-rose-500/30 focus:border-rose-500/50 transition-all shadow-inner" />
                      <Button
                        variant="primary"
                        size="sm"
                        type="button"
                        onClick={() => {
                          handleAddFavoriteStyle(favStyleFormName, favStyleFormPrompt);
                          setFavStyleFormName("");
                          setFavStyleFormPrompt("");
                        }}
                        className="px-4 py-1.5 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 border border-rose-500/50 text-white text-[11px] font-bold rounded-lg shrink-0 shadow-md transition-all active:scale-95"
                      >
                        {t.addFavStyleBtn}
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <Tooltip content={t.System_Logs} position="bottom">
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={() => {
                setShowLogsModal(!showLogsModal);
                setShowGenSettings(false);
                setShowFavVoices(false);
                setShowFavStyles(false);
              }}
              className={cn(`p-2 rounded-lg border shadow-none h-auto w-auto ${showLogsModal ? "bg-rose-500/10 border-rose-500/20 text-rose-500 hover:text-rose-500 hover:bg-rose-500/10" : "bg-slate-900 border-transparent text-slate-500 hover:text-slate-200 hover:bg-slate-850"}`)}
            >
              <Terminal className="w-4 h-4" />
            </Button>
          </Tooltip>

          <Tooltip content={t.Step_Flow_L_key} position="bottom">
            <Button variant="ghost" size="sm" type="button" onClick={() => setLeftSidebarOpen(!leftSidebarOpen)} className={cn(`p-2 rounded-lg border shadow-none h-auto w-auto ${leftSidebarOpen ? "bg-rose-500/10 border-rose-500/20 text-rose-500 hover:text-rose-500 hover:bg-rose-500/10" : "bg-slate-900 border-transparent text-slate-500 hover:text-slate-200 hover:bg-slate-850"}`)}>
              <Workflow className="w-4 h-4" />
            </Button>
          </Tooltip>

          <Tooltip content={t.Settings_R_key} position="bottom">
            <Button variant="ghost" size="sm" type="button" onClick={() => setRightSidebarOpen(!rightSidebarOpen)} className={cn(`p-2 rounded-lg border shadow-none h-auto w-auto ${rightSidebarOpen ? "bg-rose-500/10 border-rose-500/20 text-rose-500 hover:text-rose-500 hover:bg-rose-500/10" : "bg-slate-900 border-transparent text-slate-500 hover:text-slate-200 hover:bg-slate-850"}`)}>
              <Settings2 className="w-4 h-4" />
            </Button>
          </Tooltip>
        </div>
        <AnimatePresence>
          {showLogsModal && (
            <motion.div
              initial={{
                opacity: 0,
                y: -15,
                scale: 0.98,
              }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                y: -10,
                scale: 0.98,
              }}
              transition={{
                duration: 0.15,
                ease: "easeOut",
              }}
              style={{
                transformOrigin: "top right",
              }}
              className="absolute top-full right-4 w-[600px] max-w-[90vw] bg-slate-900 border-x border-b border-slate-800 rounded-b-xl shadow-2xl z-50 overflow-hidden"
            >
              <div className="p-4 bg-slate-950 border-t border-slate-800 text-xs font-mono text-slate-300 max-h-[60vh] min-h-[250px] overflow-y-auto space-y-2 select-text">
                {systemLogs.length === 0 ? (
                  <div className="text-slate-500 italic">{t.No_logs_available}</div>
                ) : (
                  systemLogs.map((log, i) => {
                    let badgeClass = "bg-sky-500/10 text-sky-500 border-sky-500/20";
                    let badgeText = "INFO";
                    let bgClass = "";
                    let textClass = "text-slate-300";
                    if (log.type === "error") {
                      badgeClass = "bg-red-500/10 text-red-500 border-red-500/30";
                      badgeText = "ERR";
                      bgClass = "bg-red-500/5 -mx-2 px-2";
                      textClass = "text-red-500 font-medium";
                    } else if (log.type === "warn") {
                      badgeClass = "bg-orange-500/10 text-orange-500 border-orange-500/30";
                      badgeText = "WARN";
                      textClass = "text-orange-500";
                    } else if (log.type === "success") {
                      badgeClass = "bg-teal-500/10 text-teal-500 border-teal-500/30";
                      badgeText = "OK";
                      textClass = "text-teal-500 font-medium";
                    } else if (log.type === "pending") {
                      badgeClass = "bg-fuchsia-500/10 text-fuchsia-500 border-fuchsia-500/30";
                      badgeText = "WAIT";
                      textClass = "text-fuchsia-500 font-medium";
                    }
                    return (
                      <div key={i} className={cn(`flex items-start gap-2 border-b border-slate-800/50 pb-2 pt-1 ${bgClass}`)}>
                        <span className="text-slate-500 shrink-0 mt-0.5">[{log.time}]</span>
                        <span className={cn(`shrink-0 text-[9px] uppercase font-bold w-10 text-center py-0.5 mt-0.5 rounded border ${badgeClass}`)}>{badgeText}</span>
                        <span className={cn(`break-all whitespace-pre-wrap leading-relaxed ${textClass}`)}>{log.msg}</span>
                      </div>
                    );
                  })
                )}
                <div ref={logsEndRef} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="flex-grow w-full flex overflow-hidden min-h-0 relative select-none bg-slate-955">
        <div className={cn(`transition-all duration-300 flex flex-col bg-slate-900 border-r border-slate-800 shrink-0 h-full overflow-hidden ${leftSidebarOpen ? "w-60" : "w-0 border-r-0"}`)}>
          <div className="p-3 border-b border-slate-800 bg-slate-950/30 flex items-center justify-between shrink-0 select-none">
            <span className="text-[9px] font-bold text-slate-400 tracking-wider font-mono uppercase">{t.FLOW_WORKSPACE}</span>
            <span className="text-[8px] font-mono text-slate-500 bg-slate-950 border border-slate-800 px-1.5 py-0.5 rounded-md font-bold">{t.NODES}</span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-3.5 custom-scrollbar bg-slate-950/10">
            {[0, 1, 2, 3, 4, 5, 6].map((stepIdx) => {
              const shortLabel = t.stepShortLabels?.[stepIdx] || "";
              const tooltip = t.stepTooltips?.[stepIdx] || "";
              const isCompleted = stepIdx < currentStep;
              const isCurrent = stepIdx === currentStep;
              return (
                <div key={stepIdx} className="relative">
                  {stepIdx < 6 && <div className="absolute left-[22px] top-11 bottom-[-22px] w-[2px] bg-gradient-to-b from-rose-500/20 to-slate-800 z-0" />}

                  <Button
                    variant="unstyled"
                    onClick={() => setCurrentStep(stepIdx)}
                    title={tooltip}
                    className={cn(`w-full text-left p-2.5 rounded-xl relative z-10 flex items-center gap-3 select-none h-auto justify-start transition-all ${isCurrent ? "bg-rose-500/10 text-rose-500 font-extrabold ring-1 ring-rose-500/30" : isCompleted ? "bg-slate-900/40 text-slate-400 hover:bg-slate-900" : "bg-slate-900 text-slate-500 hover:text-slate-300 hover:bg-slate-850"}`)}
                  >
                    <div className={cn(`w-7 h-7 rounded-lg flex items-center justify-center font-mono text-[10px] font-black shrink-0 transition-all ${isCurrent ? "bg-rose-600 text-white shadow-md shadow-rose-500/20 ring-2 ring-rose-500/20" : isCompleted ? "bg-slate-800 text-slate-300" : "bg-slate-900 text-slate-500"}`)}>0{stepIdx + 1}</div>

                    <div className="flex-1 min-w-0">
                      <div className={cn(`text-[8px] font-mono leading-none tracking-wider uppercase ${isCurrent ? "text-rose-400" : "text-slate-500"}`)}>
                        {t.NODE}
                        {stepIdx + 1}
                      </div>
                      <div className="text-[10px] font-black uppercase truncate mt-0.5 text-left">{shortLabel}</div>
                    </div>
                  </Button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex-1 h-full min-w-0 flex flex-col relative select-none bg-slate-955 overflow-hidden">
          <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 pointer-events-none select-none">
            <span className="text-[9px] bg-slate-900/90 text-slate-450 border border-slate-800 px-2.5 py-1 rounded-md font-mono backdrop-blur font-bold">{t.FPS_24_COMPLIANT}</span>
            <span className="text-[9px] bg-rose-600 text-white font-extrabold border border-rose-500 px-2.5 py-1 rounded-md uppercase tracking-wider shadow-sm">{t.stepShortLabels?.[currentStep]}</span>
          </div>

          <div className="flex-1 flex flex-col min-h-0 relative z-0 overflow-hidden">
            {visitedSteps[WizardStep.SourceInput] && (
              <div className={cn(`flex-1 overflow-y-auto px-5 py-5 custom-scrollbar ${currentStep === WizardStep.SourceInput ? "" : "hidden"}`)}>
                <PipelineStep0 {...wizard} />
              </div>
            )}
            {visitedSteps[WizardStep.Storyboard] && (
              <div className={cn(`flex-1 overflow-y-auto px-5 py-5 custom-scrollbar ${currentStep === WizardStep.Storyboard ? "" : "hidden"}`)}>
                <PipelineStep1 {...wizard} />
              </div>
            )}
            {visitedSteps[WizardStep.AssetManager] && (
              <div className={cn(`flex-1 overflow-y-auto px-5 py-5 custom-scrollbar ${currentStep === WizardStep.AssetManager ? "" : "hidden"}`)}>
                <PipelineStep2 {...wizard} />
              </div>
            )}
            {visitedSteps[WizardStep.SEOBoost] && (
              <div className={cn(`flex-1 overflow-y-auto px-5 py-5 custom-scrollbar ${currentStep === WizardStep.SEOBoost ? "" : "hidden"}`)}>
                <PipelineStep3 {...wizard} />
              </div>
            )}
            {visitedSteps[WizardStep.Export] && (
              <div className={cn(`flex-1 overflow-y-auto px-5 py-5 custom-scrollbar ${currentStep === WizardStep.Export ? "" : "hidden"}`)}>
                <PipelineStep4 {...wizard} />
              </div>
            )}
            {visitedSteps[WizardStep.IndependentGenerator] && (
              <div className={cn(`flex-1 overflow-y-auto px-5 py-5 custom-scrollbar ${currentStep === WizardStep.IndependentGenerator ? "" : "hidden"}`)}>
                <PipelineStep5 {...wizard} />
              </div>
            )}
            {visitedSteps[WizardStep.CapCutUltra] && (
              <div className={cn(`flex-1 overflow-y-auto px-5 py-5 custom-scrollbar ${currentStep === WizardStep.CapCutUltra ? "" : "hidden"}`)}>
                <PipelineStep6 {...wizard} />
              </div>
            )}
            <Modal isOpen={!!zoomedImage} onClose={() => setZoomedImage(null)} title={zoomedImage?.title || t.Image_Lightbox_Preview}>
              {zoomedImage && (
                <div className="flex flex-col md:flex-row h-full min-h-[50vh] bg-slate-900">
                  <div className="flex-1 bg-slate-950 p-4 flex flex-col justify-center items-center relative overflow-hidden group">
                    <img referrerPolicy="no-referrer" src={zoomedImage.url} alt={zoomedImage.title} className="max-w-full max-h-[50vh] md:max-h-[75vh] object-contain rounded-xl shadow-2xl ring-1 ring-slate-800" />
                  </div>
                  <div className="w-full md:w-80 p-6 border-t md:border-t-0 md:border-l border-slate-800 flex flex-col bg-slate-900">
                    <div className="flex-1 flex flex-col min-h-0">
                      {zoomedImage.prompt && (
                        <div className="flex-1 flex flex-col min-h-0 space-y-2">
                          <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider font-mono flex items-center gap-1.5 shrink-0">
                            <Sparkles className="w-3 h-3" />
                            {t.Generation_Prompt}
                          </div>
                          <p className="flex-1 text-[11px] text-slate-300 bg-slate-950 p-4 rounded-xl border border-slate-800 leading-relaxed overflow-y-auto custom-scrollbar select-all min-h-[150px]">{zoomedImage.prompt}</p>
                        </div>
                      )}
                    </div>

                    <div className="mt-6 pt-6 border-t border-slate-800 flex flex-row gap-2.5 shrink-0">
                      <a href={zoomedImage.url} download={`${zoomedImage.title.replace(/\s+/g, "_").toLowerCase()}_artwork.jpg`} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-b from-rose-500 to-rose-600 hover:from-rose-450 hover:to-rose-550 active:from-rose-600 active:to-rose-700 text-white text-xs font-bold py-2.5 rounded-xl transition-all shadow-sm">
                        <Download className="w-3.5 h-3.5" />
                        <span>{t.download}</span>
                      </a>
                      <Button variant="secondary" onClick={() => setZoomedImage(null)} className="flex-1 py-2.5 text-xs font-bold rounded-xl">
                        {t.Close}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </Modal>
            <Modal
              isOpen={voiceDropdownOpen}
              onClose={handleCloseVoiceModal}
              title={
                <div className="flex items-center gap-3">
                  <Volume2 className="w-4 h-4 text-rose-500 animate-pulse" />
                  <span>{t.Voice_Registry}</span>
                  <span className="text-[10px] font-mono font-bold bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
                    {systemVoices.length} {t.Voices}
                  </span>
                </div>
              }
            >
              <div className="flex flex-col h-full bg-slate-900">
                <div className="flex-1 overflow-y-auto">
                  <div className="p-4 sm:p-5 border-b border-slate-850/80 bg-slate-900/40 space-y-4">
                    <div className="flex flex-col md:flex-row gap-3.5">
                      <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                          type="text"
                          value={voiceSearch}
                          onChange={(e) => setVoiceSearch(e.target.value)}
                          placeholder={t.Search_voices_registry_by}
                          className="w-full bg-slate-100 hover:bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-9 py-2 text-xs text-slate-200 font-semibold placeholder-slate-550 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20 transition-all h-10"
                        />
                        {voiceSearch && (
                          <Button variant="unstyled" type="button" onClick={() => setVoiceSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 bg-slate-850 text-slate-400 hover:text-slate-200 rounded-full hover:scale-105 transition shadow-none h-auto w-auto">
                            <X className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                      <div className="flex gap-1 bg-slate-950 rounded-[10px] p-1.5 border border-slate-800/60 shadow-inner">
                        {[
                          {
                            id: "premium",
                            label: t.Cloud_AI_Premium,
                          },
                          {
                            id: "local",
                            label: t.Offline_Local_TTS,
                          },
                        ].map((tab) => {
                          const isActive = voiceTypeFilter === tab.id;
                          return (
                            <Button variant="unstyled"
                              key={tab.id}
                              type="button"
                              onClick={() => {
                                setVoiceTypeFilter(tab.id as any);
                              }}
                              className={cn(`flex-1 py-1.5 rounded-md text-[10px] font-bold transition-all shadow-sm h-auto flex items-center justify-center gap-1.5 ${isActive ? "bg-slate-800 text-slate-100 border border-slate-600 shadow-md shadow-black/40 ring-1 ring-slate-900/50 z-10" : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 hover:shadow-sm border border-transparent focus:outline-none focus:ring-2 focus:ring-rose-500/30"}`)}
                            >
                              {tab.id === "premium" ? <Sparkles className="w-3 h-3 text-amber-500 shrink-0" /> : <Layers className="w-3 h-3 text-sky-400 shrink-0" />}
                              <span>{tab.label}</span>
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1 border-t border-slate-850/50">
                      <div className="flex gap-1 bg-slate-950 rounded-[10px] p-1.5 border border-slate-800/60 shadow-inner">
                        {[
                          {
                            id: "all",
                            label: t.All,
                          },
                          {
                            id: "vi",
                            label: t.Vietnamese,
                          },
                          {
                            id: "en",
                            label: t.English,
                          },
                        ].map((loc) => {
                          const isActive = voiceLangFilter === loc.id;
                          return (
                            <Button variant="unstyled" key={loc.id} type="button" onClick={() => setVoiceLangFilter(loc.id as any)} className={cn(`px-4 py-1.5 rounded-md text-[10px] font-bold transition-all shadow-sm h-auto flex items-center justify-center ${isActive ? "bg-slate-800 text-slate-100 border border-slate-600 shadow-md shadow-black/40 ring-1 ring-slate-900/50 z-10" : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 hover:shadow-sm border border-transparent focus:outline-none focus:ring-2 focus:ring-rose-500/30"}`)}>
                              {loc.label}
                            </Button>
                          );
                        })}
                      </div>

                      {voiceTypeFilter === "premium" && (
                        <div className="text-[11px] text-amber-400 font-semibold flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 bg-amber-500 rounded-full shrink-0 animate-pulse" />
                          <span>⚡ {t.Premium_studio_quality_vo}</span>
                        </div>
                      )}
                      <div className="flex gap-1 bg-slate-950 rounded-[10px] p-1.5 border border-slate-800/60 shadow-inner">
                        {[
                          {
                            id: "all",
                            label: t.All,
                          },
                          {
                            id: "male",
                            label: t.Male_9,
                          },
                          {
                            id: "female",
                            label: t.Female_10,
                          },
                        ].map((gen) => {
                          const isActive = selectedGenderFilter === gen.id;
                          return (
                            <Button variant="unstyled" key={gen.id} type="button" onClick={() => setSelectedGenderFilter(gen.id as any)} className={cn(`px-4 py-1.5 rounded-md text-[10px] font-bold transition-all shadow-sm h-auto flex items-center justify-center ${isActive ? "bg-slate-800 text-slate-100 border border-slate-600 shadow-md shadow-black/40 ring-1 ring-slate-900/50 z-10" : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 hover:shadow-sm border border-transparent focus:outline-none focus:ring-2 focus:ring-rose-500/30"}`)}>
                              {gen.label}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 sm:p-5 bg-slate-950/15 select-none custom-scrollbar min-h-[280px] max-h-[48vh]">
                    {(() => {
                      const filtered = systemVoices.filter((voice) => {
                        if (voiceLangFilter === AppLanguage.VI && !voice.lang.toLowerCase().startsWith("vi")) return false;
                        if (voiceLangFilter === "en" && !voice.lang.toLowerCase().startsWith("en")) return false;

                        if (voiceSearch) {
                          const q = voiceSearch.toLowerCase();
                          if (!_.some([voice.name, voice.lang, voice.voiceURI], (field) => _.includes(field.toLowerCase(), q))) return false;
                        }

                        const voiceGender = getVoiceGender(voice);
                        if (selectedGenderFilter === "male" && voiceGender !== "male") return false;
                        if (selectedGenderFilter === "female" && voiceGender !== "female") return false;
                        return true;
                      });
                      if (filtered.length === 0) {
                        return (
                          <div className="py-12 flex flex-col items-center justify-center text-center space-y-3.5">
                            <div className="w-12 h-12 bg-slate-950 border border-slate-800 text-slate-600 rounded-full flex items-center justify-center shadow-inner">
                              <User className="w-5 h-5 animate-pulse text-slate-400" />
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-slate-300">{t.No_speakers_found_matchin}</h4>
                              <p className="text-xs text-slate-500 max-w-sm mt-1 leading-relaxed">{t.Adjust_search_query_revok}</p>
                            </div>
                          </div>
                        );
                      }
                      return (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {filtered.map((voice) => {
                            const isSelected = project.voiceConfig.voiceURI === voice.voiceURI;
                            const isPremium = isPremiumVoice(voice.voiceURI);
                            const voiceGender = getVoiceGender(voice);
                            const isFemale = voiceGender === "female";
                            const isMale = voiceGender === "male";
                            return (
                              <div
                                key={voice.voiceURI}
                                onClick={() => {
                                  const gender = voiceGender;
                                  let speed = 1.0;
                                  let pitch = 1.0;
                                  const pUri = voice.voiceURI;
                                  const matchedMapping = _.find(VOICE_PROVIDER_MAPPINGS, (mapping) => 
                                    _.some(mapping.prefixes, (prefix) => _.startsWith(pUri, prefix))
                                  );
                                  const provider = matchedMapping ? matchedMapping.provider : (project.voiceConfig?.provider || "Gemini Speech");
                                  
                                  const modifiers = VOICE_MODIFIERS[pUri] || (_.includes(pUri, "child") ? VOICE_MODIFIERS["preset-vi-kid"] : null);
                                  if (modifiers) {
                                    speed = modifiers.speed;
                                    pitch = modifiers.pitch;
                                  }

                                  const voiceConfigOverride = {
                                    ...project.voiceConfig,
                                    voiceURI: pUri,
                                    speed,
                                    pitch,
                                    gender,
                                    provider,
                                  };
                                  setProject((prev) => {
                                    return {
                                      ...prev,
                                      voiceConfig: voiceConfigOverride,
                                    };
                                  });

                                  playVoicePreview(voice.voiceURI, gender, voice.lang, speed, pitch);
                                }}
                                className={cn(`group border rounded-xl p-4.5 text-left transition-all duration-200 cursor-pointer relative overflow-hidden flex flex-col justify-between min-h-[145px] ${isSelected ? "bg-rose-500/[0.04] bg-rose-550/[0.02] border-rose-500/80 ring-1 ring-rose-500/20" : "bg-slate-900 border-slate-200 hover:border-slate-700"}`)}
                              >
                                {isSelected && <div className="absolute top-0 right-0 w-3 h-3 bg-rose-500 rounded-bl-lg" />}

                                <div className="space-y-2.5">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    {isPremium ? <span className="bg-amber-500/10 text-amber-400 text-[8px] font-black tracking-widest uppercase px-1.5 py-0.5 rounded border border-amber-500/15">{t.CLOUD_AI}</span> : <span className="bg-slate-950 text-slate-400 text-[8px] font-black tracking-widest uppercase px-1.5 py-0.5 rounded border border-slate-850">{t.NATIVE_TTS}</span>}

                                    {voice.lang && <span className="bg-slate-950 text-slate-400 text-[8px] font-black tracking-widest uppercase px-1.5 py-0.5 rounded border border-slate-850 select-all font-mono">{voice.lang}</span>}

                                    <span className="text-[8px] font-mono font-black text-rose-450 uppercase tracking-widest bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/10">{isFemale ? t.FEMALE : isMale ? t.MALE : t.NEUTRAL}</span>
                                  </div>
                                  <div>
                                    <h4 className="text-xs font-black text-slate-100 truncate leading-snug group-hover:text-rose-450 transition-colors shadow-sm">{voice.name?.replace("✨ Giọng", "") || voice.voiceURI}</h4>
                                    <p className="text-[10px] text-slate-450 italic font-medium leading-relaxed mt-1 line-clamp-2">
                                      {(() => {
                                        const descKey = VOICE_DESCRIPTION_KEYS[voice.voiceURI];
                                        return descKey ? t[descKey as keyof typeof t] : (voice.localService ? t.Offline_system_synthesize : t.Online_speech_voice);
                                      })()}
                                    </p>
                                  </div>
                                </div>
                                <div className="pt-2 border-t border-slate-800/80 mt-3 flex items-center justify-between gap-2.5">
                                  <span className="text-[9px] font-mono text-slate-500 font-bold uppercase truncate max-w-[125px]">{voice.localService ? t.Offline_Supported : t.Online_API_Required}</span>

                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <Button
                                      variant="ghost"
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const gender = voiceGender;
                                        const speed = project.voiceConfig.speed || 1.0;
                                        const pitch = project.voiceConfig.pitch || 1.0;
                                        playVoicePreview(voice.voiceURI, gender, voice.lang, speed, pitch);
                                      }}
                                      className={cn(`w-8 h-8 rounded-xl border flex items-center justify-center shadow-none p-0 ${playingVoiceURI === voice.voiceURI ? "bg-rose-600 border-rose-600 hover:bg-rose-500 hover:text-white text-white" : "bg-slate-100 hover:bg-slate-850 border-slate-800 text-slate-350"}`)}
                                      title={playingVoiceURI === voice.voiceURI ? t.Stop_preview : t.Listen_sample}
                                    >
                                      {playingVoiceURI === voice.voiceURI ? <Pause className="w-3 h-3 animate-pulse" /> : <Play className="w-3 h-3" />}
                                    </Button>

                                    <span className={cn(`px-2.5 py-1 rounded-lg text-[9px] font-mono font-black uppercase transition-all shrink-0 border ${isSelected ? "bg-rose-500 text-white border-rose-500" : "bg-slate-950 text-slate-400 border-slate-850"}`)}>{isSelected ? t.ACTIVE : t.SELECT}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                  <div className="p-4 sm:p-5 border-t border-slate-800 flex items-center justify-between gap-4 bg-slate-950/40 shrink-0">
                    <span className="text-[10px] sm:text-xs text-slate-450 font-medium">⚠️ {t.Switching_locks_subtitles}</span>
                    <Button variant="primary" onClick={handleCloseVoiceModal} className="px-5 py-2.5">
                      {t.APPLY}
                    </Button>
                  </div>
                </div>
              </div>
            </Modal>
          </div>
        </div>
        <div className={cn(`transition-all duration-300 flex flex-col bg-slate-950 border-l border-slate-850 shrink-0 h-full overflow-hidden ${rightSidebarOpen ? "w-72" : "w-0 border-l-0"}`)}>
          <div className="p-3 border-b border-slate-900 bg-slate-900/40 flex items-center justify-between shrink-0 select-none">
            <span className="text-[10px] font-bold text-slate-400 tracking-wider font-mono">{t.WORKSPACE}</span>
            <span className="text-[9px] font-mono text-slate-650 bg-slate-900 px-1.5 py-0.5 rounded">{t.PROPS}</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar bg-slate-955/40 text-[11px] text-slate-300">
            <div className="space-y-2">
              <div className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-1">{t.General_Metadata}</div>
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-850 space-y-3">
                <div className="flex flex-col gap-1">
                  <span className="text-slate-500 font-mono text-[9px] uppercase">{t.Project_Hash}</span>
                  <span className="font-mono text-slate-300">{(project.id || "").substring(0, 8)}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-slate-500 font-mono text-[9px] uppercase">{t.Content_Target_Lang}</span>
                  <span className="font-bold text-slate-200">{project.config.language.toUpperCase()}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-slate-500 font-mono text-[9px] uppercase">{t.Format_Strategy}</span>
                  <span className="font-bold text-rose-450">{project.config.format}</span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-1">{t.Active_Profiles}</div>
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-850 space-y-3">
                <div className="flex flex-col gap-1">
                  <span className="text-slate-500 font-mono text-[9px] uppercase">{t.Narrator_ID}</span>
                  <span className="font-sans font-medium text-slate-300">{project.voiceConfig.voiceURI || "Default"}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-slate-500 font-mono text-[9px] uppercase">{t.Vision_Identity}</span>
                  <span className="font-sans font-medium text-slate-300">{project.visualConfig?.style || "Cinematic Photo"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="fixed bottom-6 right-6 z-[999999] flex flex-col gap-3 pointer-events-none">
          <AnimatePresence>
            {errorMsg && (
              <motion.div
                key="errorMsg"
                initial={{
                  opacity: 0,
                  y: 30,
                  scale: 0.95,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                }}
                exit={{
                  opacity: 0,
                  scale: 0.95,
                  transition: {
                    duration: 0.15,
                  },
                }}
                className="bg-slate-900 shadow-2xl shadow-rose-950/20 p-4 rounded-xl text-slate-200 text-xs flex items-start gap-3 pointer-events-auto max-w-sm border border-slate-800 relative overflow-hidden"
              >
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-rose-500" />
                <AlertCircle className="w-4.5 h-4.5 text-rose-500 shrink-0 mt-0.5 ml-1" />
                <div className="flex-grow flex flex-col gap-0.5 text-left">
                  <span className="text-[10px] uppercase font-mono font-bold text-rose-500 tracking-wider">{t.System_Error}</span>
                  <p className="leading-snug text-slate-300 font-medium">{errorMsg}</p>
                </div>
                <Button variant="ghost" size="xs" onClick={() => setErrorMsg("")} className="text-slate-500 hover:text-slate-200 shrink-0 p-0.5 hover:bg-slate-850 rounded shadow-none h-auto w-auto">
                  <X className="w-3.5 h-3.5" />
                </Button>
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose-500/10">
                  <div className="h-full bg-rose-500 animate-shrinkWidth" />
                </div>
              </motion.div>
            )}
            {infoMsg && (
              <motion.div
                key="infoMsg"
                initial={{
                  opacity: 0,
                  y: 30,
                  scale: 0.95,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                }}
                exit={{
                  opacity: 0,
                  scale: 0.95,
                  transition: {
                    duration: 0.15,
                  },
                }}
                className="bg-slate-900 shadow-2xl shadow-emerald-950/20 p-4 rounded-xl text-slate-200 text-xs flex items-start gap-3 pointer-events-auto max-w-sm border border-slate-800 relative overflow-hidden"
              >
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-500" />
                <Check className="w-4.5 h-4.5 text-emerald-500 shrink-0 mt-0.5 ml-1 animate-pulse" />
                <div className="flex-grow flex flex-col gap-0.5 text-left">
                  <span className="text-[10px] uppercase font-mono font-bold text-emerald-500 tracking-wider">{t.Success}</span>
                  <p className="leading-snug text-slate-300 font-medium">{infoMsg}</p>
                </div>
                <Button variant="ghost" size="xs" onClick={() => setInfoMsg("")} className="text-slate-500 hover:text-slate-200 shrink-0 p-0.5 hover:bg-slate-850 rounded shadow-none h-auto w-auto">
                  <X className="w-3.5 h-3.5" />
                </Button>
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500/10">
                  <div className="h-full bg-emerald-500 animate-shrinkWidth" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
