import { VoiceSelectionDialog } from "../../components/VoiceSelectionDialog";
import { appWarn } from "../../lib/logger.js";
import { motionLabels } from "../../constants/data";
import {
  formatAudioTime,
  formatCleanTime,
  formatCleanDuration,
} from "../../lib/timeUtils";
import { useRef, useState } from "react";
import { PipelineWizardState } from "./usePipelineWizard";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { WizardStep, AudioType, Gender, ImageGenerationMode, ImageGeneratorEngine, ImageModelLabel } from "../../types";

import * as LucideIcons from "lucide-react";

const {
  Layout,
  RefreshCw,
  Mic,
  ChevronDown,
  Pause,
  Play,
  Volume2,
  Music,
  Download,
  Terminal,
  Check,
  FileText,
  Sparkles,
  Upload,
  Sliders,
  ChevronUp,
  ImageIcon,
  X,
  Copy,
  Layers,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Trash,
  ArrowLeft,
  ArrowRight,
  User,
} = LucideIcons as any;

export default function PipelineStep1(props: PipelineWizardState) {
  const getMotionLabel = (motion: string): string => {
    return motionLabels[motion as keyof typeof motionLabels] || motion;
  };

  const voiceTestAudioRef = useRef<HTMLAudioElement>(null);
  const [testingVoiceURI, setTestingVoiceURI] = useState<string | null>(null);

  const playVoicePreviewFunc = (
    voiceURI: string,
    _gender: string,
    _lang: string,
    _speed: number,
    _pitch: number,
    previewUrl?: string,
  ) => {
    if (!previewUrl) return;

    if (testingVoiceURI === voiceURI) {
      voiceTestAudioRef.current?.pause();
      setTestingVoiceURI(null);
      return;
    }

    voiceTestAudioRef.current?.pause();

    if (voiceTestAudioRef.current) {
      voiceTestAudioRef.current.src = previewUrl;
      voiceTestAudioRef.current.play().catch(() => {});
      setTestingVoiceURI(voiceURI);
    }
  };

  const createSpeechUtterance = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    return utterance;
  };

  const {
    t,
    project,
    setProject,
    setCurrentStep,
    isVoiceDialogOpen,
    setIsVoiceDialogOpen,
    loadingStates,
    setInfoMsg,
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
    showPromptGeneratorPanel,
    setShowPromptGeneratorPanel,
    activeSlideIndices,
    copiedAll,
    showAdvancedVisualConfig,
    setShowAdvancedVisualConfig,
    bulkUploadWarning,
    isBatchGenerating,
    isCancellingBatch,
    batchProgressMsg,
    storyboardPage,
    setStoryboardPage,
    scenesPerPage,
    paginatedStoryboard,
    ttsAudioUrl,
    alignmentsLog,
    bulkVoiceStatus,
    isPlayingTts,
    setIsPlayingTts,
    audioPreviewRef,
    voicePlayerSectionRef,
    voiceAudioDuration,
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
    simulatedCurrentTime,
    setSimulatedCurrentTime,
    handleTriggerStoryboardSplit,
    handleRenderSceneImage,
    handleUploadSceneImage,
    handleCopyAllPrompts,
    handleReferenceImagesUpload,
    handleExtractStyle,
    handleApplyStyleToScenes,
    handleBulkUploadImages,
    handlePrevSlide,
    handleNextSlide,
    handleDeleteSceneImage,
    handleDeleteAllSceneImages,
    handleBatchGenerateAllImages,
    handleCancelBatchGenerate,
    openSceneModal,
    handleGenerateDetailedPrompt,
    handleSaveSceneEdits,
    handleDownloadVoice,
    handleTriggerAllSceneVoices,
    getSceneImageUrl,
    currentLang,
    handleAnalyzeCharacter,
    handleCharacterImagesUpload,
    handleExtractCharacter,
    handleApplyCharacterToScenes,
  } = props;
  return (
    <>
      {}
      <audio
        ref={voiceTestAudioRef}
        onEnded={() => setTestingVoiceURI(null)}
        className="hidden"
      />
      <div className="bg-gradient-to-b from-slate-900/90 to-slate-950/95 border border-slate-800/85 rounded-2xl p-6 space-y-6 shadow-2xl relative overflow-visible">
        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/[0.03] rounded-full blur-3xl pointer-events-none" />
        <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
          <div>
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Layout className="w-5 h-5 text-rose-500" />
              {t.storyboardDirector} &amp; {t.Scene_Voiceovers}
            </h3>
            <p className="text-slate-400 text-xs mt-1">
              {t.Design_sequential_visual_}
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => handleTriggerStoryboardSplit(true, "top")}
              disabled={!!loadingStates["storyboardSplit_loading"]}
              className="flex items-center gap-2 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 border border-rose-400/20 disabled:from-slate-800 disabled:to-slate-800 disabled:opacity-75 disabled:cursor-not-allowed text-white font-extrabold text-xs px-5 py-2.5 rounded-lg transition-all cursor-pointer shadow-lg hover:shadow-rose-500/20 active:scale-95"
              title={t.Automatically_split_story}
            >
              {loadingStates["storyboardSplit_loading"] ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{t.Processing}</span>
                </>
              ) : (
                <>
                  <Layout className="w-4 h-4 text-rose-200" />
                  <span>{t.Generate_Storyboard}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {}
        <div className="bg-slate-950/40 p-5 rounded-xl border border-slate-800/60 max-w-full space-y-5 shadow-lg text-left relative overflow-hidden">
          <h4 className="text-xs font-bold uppercase tracking-wider text-rose-450 border-b border-slate-800/60 pb-2">
            {t.Settings}
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {}
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 font-mono font-bold uppercase block">
                  {t.txt_1_Voice_Actor}
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsVoiceDialogOpen(true)}
                    className="w-full flex items-center justify-between bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 transition-colors shadow-sm text-left group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center shrink-0 group-hover:bg-rose-500/20 transition-colors">
                        <Mic className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-400 transition-colors" />
                      </div>
                      <div className="min-w-0">
                        <span className="block font-medium truncate">
                          {project.voiceConfig.voiceName ||
                            project.voiceConfig.voiceURI ||
                            t.Select_voice}
                        </span>
                        <span className="block text-[10px] text-slate-500 truncate mt-0.5">
                          {project.voiceConfig.provider || "System Voice"}
                        </span>
                      </div>
                    </div>
                    <ChevronDown className="w-4 h-4 text-slate-500 shrink-0 ml-2" />
                  </button>

                  <VoiceSelectionDialog
                    isOpen={isVoiceDialogOpen}
                    onClose={() => setIsVoiceDialogOpen(false)}
                    currentLang={currentLang}
                    selectedVoiceId={project.voiceConfig.voiceURI}
                    onSelectVoice={(voice) => {
                      setProject((prev) => ({
                        ...prev,
                        voiceConfig: {
                          ...prev.voiceConfig,
                          voiceURI: voice.voice_id,
                          voiceName: voice.name,
                          previewUrl: voice.preview_url,

                          gender:
                            voice.gender === "male"
                              ? Gender.Male
                              : Gender.Female,
                        },
                      }));
                      setIsVoiceDialogOpen(false);
                    }}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const voiceURI =
                      project.voiceConfig.voiceURI || "preset-vi-bac-female";
                    const gender = project.voiceConfig.gender || "female";

                    playVoicePreviewFunc(
                      voiceURI,
                      gender,
                      currentLang,
                      project.voiceConfig.speed || 1.0,
                      project.voiceConfig.pitch || 1.0,
                      project.voiceConfig.previewUrl,
                    );
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-[11px] py-1.5 rounded-lg transition-all cursor-pointer"
                >
                  {testingVoiceURI ===
                  (project.voiceConfig.voiceURI || "preset-vi-bac-female") ? (
                    <Pause className="w-3.5 h-3.5 animate-pulse text-amber-400" />
                  ) : (
                    <Play className="w-3.5 h-3.5 text-rose-450" />
                  )}
                  {t.Test_voice}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleTriggerAllSceneVoices(project.storyboard, false)
                  }
                  disabled={
                    !!loadingStates["bulkVoiceGenerate_loading"] ||
                    !project.storyboard ||
                    project.storyboard.length === 0
                  }
                  className="flex-1 flex items-center justify-center gap-1.5 bg-rose-600 hover:bg-rose-500 disabled:bg-slate-800 disabled:opacity-75 disabled:cursor-not-allowed border border-rose-500/30 text-white font-bold text-[11px] py-1.5 rounded-lg transition-all cursor-pointer shadow-md active:scale-95"
                  title={t.Generate_all_scene_voiceo}
                >
                  {loadingStates["bulkVoiceGenerate_loading"] ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>{t.Loading}</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-3.5 h-3.5 text-rose-100" />
                      <span>{t.Generate_Voice}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {}
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-400 font-mono font-bold uppercase block">
                  {t.txt_2_Split_Density}
                </label>
                <div className="relative flex items-center bg-slate-900 border border-slate-800 rounded-lg pr-3">
                  <select
                    value={project.config.splitStrategy || "long_sentence"}
                    onChange={(e) =>
                      setProject((prev) => ({
                        ...prev,
                        config: {
                          ...prev.config,
                          splitStrategy: e.target.value,
                        },
                      }))
                    }
                    className="flex-1 bg-transparent border-none text-slate-205 text-xs font-semibold outline-none cursor-pointer appearance-none p-2 w-full font-sans animate-fade-in"
                  >
                    <option
                      value="word"
                      title={t.Word_aligned_Maximizes_im}
                      className="bg-slate-950 text-slate-200"
                    >
                      {t.By_word}
                    </option>
                    <option
                      value="short_sentence"
                      title={t.Fast_paced_vibrant_short_}
                      className="bg-slate-950 text-slate-200"
                    >
                      {t.Short_sentence}
                    </option>
                    <option
                      value="long_sentence"
                      title={t.Default_balanced_standard}
                      className="bg-slate-950 text-slate-200"
                    >
                      {t.Long_sentence}
                    </option>
                    <option
                      value="multi_prompt"
                      title={t.Min_1_prompt_per_sentence}
                      className="bg-slate-950 text-emerald-300 font-bold"
                    >
                      {t.Multi_prompt_Sentence}
                    </option>
                    <option
                      value="paragraph"
                      title={t.Logical_paragraph_aligned}
                      className="bg-slate-950 text-slate-200"
                    >
                      {t.Paragraph_density}
                    </option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-500 pointer-events-none absolute right-3" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {}
        {(ttsAudioUrl || loadingStates["bulkVoiceGenerate_loading"]) && (
          <div
            ref={voicePlayerSectionRef}
            className="bg-slate-955/60 p-5 rounded-xl border border-rose-500/25 space-y-4 mb-4 shadow-xl text-left relative overflow-hidden animate-fade-in animate-duration-300"
          >
            {}
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/[0.02] rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4.5 h-4.5 text-rose-500 shrink-0 animate-pulse" />
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                  {t.Master_Narration_Voiceove}
                </h3>
              </div>
              <span className="text-[9px] text-emerald-400 font-mono bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/20 animate-pulse">
                {t.LIVE_AUDIO_READY}
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {}
              <div className="bg-slate-900/95 border border-slate-850 p-4 rounded-xl space-y-4 shadow-xl relative">
                {}
                <style>{`
 @keyframes active-soundwave {
 0% { height: 4px; }
 100% { height: 26px; }
 }
 .seeker-input::-webkit-slider-thumb {
 -webkit-appearance: none;
 appearance: none;
 width: 10px;
 height: 10px;
 border-radius: 9999px;
 background-color: #ffffff;
 border: 2px solid #f43f5e;
 cursor: pointer;
 box-shadow: 0 0 10px rgba(244, 63, 94, 0.6);
 transition: all 150ms ease-in-out;
 }
 .seeker-input::-webkit-slider-thumb:hover {
 transform: scale(1.3);
 background-color: #f43f5e;
 border-color: #ffffff;
 }
 .seeker-input::-moz-range-thumb {
 width: 10px;
 height: 10px;
 border-radius: 9999px;
 background-color: #ffffff;
 border: 2px solid #f43f5e;
 cursor: pointer;
 box-shadow: 0 0 10px rgba(244, 63, 94, 0.6);
 transition: all 150ms ease-in-out;
 }
 .seeker-input::-moz-range-thumb:hover {
 transform: scale(1.3);
 background-color: #f43f5e;
 border-color: #ffffff;
 }
 `}</style>

                {}
                <div className="flex items-center justify-between gap-3 text-xs font-mono font-bold tracking-wider uppercase pb-2 border-b border-slate-800/60 text-slate-400">
                  <span className="flex items-center gap-1.5 text-rose-450 text-[10px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                    {t.Audio_rendering_preview}
                  </span>
                  <span className="text-[9px] text-slate-500 font-sans flex items-center gap-1.5">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${isPlayingTts || isPlayingRealAudio ? "bg-emerald-500 animate-ping" : "bg-slate-600"}`}
                    />
                    {isPlayingTts || isPlayingRealAudio
                      ? t.Live_playing
                      : t.Deck_ready}
                  </span>
                </div>

                {loadingStates["bulkVoiceGenerate_loading"] ? (
                  <div className="flex flex-col items-center justify-center p-6 bg-slate-950/50 border border-slate-800 rounded-xl space-y-4 animate-pulse">
                    <div className="flex gap-1.5 items-end h-8">
                      <span className="w-1 bg-rose-500 rounded h-4 animate-[bounce_0.6s_infinite]"></span>
                      <span className="w-1 bg-amber-500 rounded h-7 animate-[bounce_0.6s_infinite_delay-100ms]"></span>
                      <span className="w-1 bg-rose-500 rounded h-3 animate-[bounce_0.6s_infinite_delay-200ms]"></span>
                      <span className="w-1 bg-amber-500 rounded h-8 animate-[bounce_0.6s_infinite_delay-300ms]"></span>
                      <span className="w-1 bg-rose-500 rounded h-5 animate-[bounce_0.6s_infinite_delay-150ms]"></span>
                    </div>
                    <div className="space-y-1 text-center">
                      <p className="text-xs font-bold text-slate-200">
                        {t.Synthesizing_voice}
                      </p>
                      <p className="text-[10px] text-slate-500 font-sans leading-relaxed max-w-xs mx-auto">
                        {t.Building_audio_waves_and_}
                      </p>
                    </div>
                  </div>
                ) : !ttsAudioUrl ? (
                  <div className="text-xs text-slate-400 p-6 text-center italic font-sans flex flex-col items-center justify-center gap-3.5 bg-slate-950/20 border border-dashed border-slate-800 rounded-lg">
                    <Volume2 className="w-8 h-8 text-rose-500/80 mb-0.5 animate-pulse" />
                    <span className="font-semibold text-slate-300 not-italic block text-sm">
                      {t.No_voiceover_synthesized_}
                    </span>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {}
                    {ttsAudioUrl !== "simulated" && (
                      <audio
                        ref={audioPreviewRef}
                        src={ttsAudioUrl}
                        onTimeUpdate={(e) =>
                          setAudioCurrentTime(e.currentTarget.currentTime)
                        }
                        onDurationChange={(e) =>
                          setAudioDurationState(e.currentTarget.duration)
                        }
                        onPlay={() => setIsPlayingRealAudio(true)}
                        onPause={() => setIsPlayingRealAudio(false)}
                        onEnded={() => {
                          setIsPlayingRealAudio(false);
                          setAudioCurrentTime(0);
                        }}
                        className="hidden"
                      />
                    )}

                    {}
                    <div className="bg-slate-905 p-2.5 rounded-lg border border-slate-850 flex flex-wrap items-center justify-between gap-3 shadow-inner">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 flex items-center justify-center bg-gradient-to-br from-rose-500/10 to-amber-500/10 rounded-lg border border-rose-500/20 text-rose-400">
                          <Music className="w-4 h-4 shrink-0" />
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-450 font-sans font-medium">
                            {t.AI_Speech_Channel}
                          </div>
                          <div className="text-[11px] text-slate-200 font-bold flex items-center gap-1 mt-0.5">
                            <span className="text-slate-300">
                              {project.voiceConfig.gender === "female"
                                ? t.Female_Speaker
                                : project.voiceConfig.gender === "male"
                                  ? t.Male_Speaker
                                  : t.Standard_Speaker}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-slate-700" />
                            <span className="text-[9px] text-rose-400 font-semibold uppercase bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                              {project.voiceConfig.emotion || "Normal"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {}
                      <div className="bg-slate-950 px-2 py-1 rounded border border-slate-800 text-[9px] font-mono text-slate-450 text-right space-y-0.5">
                        <div className="font-bold text-slate-350">
                          {t.txt_16_bit_WAV}
                        </div>
                        <div className="text-[8px] text-slate-600">
                          {t.txt_44_1kHz_Mono}
                        </div>
                      </div>
                    </div>

                    {}
                    <div className="py-2.5 flex items-center justify-center gap-[4px] h-11 bg-slate-950/80 rounded-lg border border-slate-900 relative overflow-hidden px-1.5">
                      <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-slate-950 to-transparent pointer-events-none" />
                      <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-slate-950 to-transparent pointer-events-none" />

                      {Array.from({ length: 44 }).map((_, i) => {
                        const isMainPlaying =
                          ttsAudioUrl === "simulated"
                            ? isPlayingTts
                            : isPlayingRealAudio;
                        const baseCurve =
                          3 + Math.floor(Math.abs(Math.sin(i * 0.15)) * 14);

                        return (
                          <span
                            key={i}
                            style={{
                              animationName: isMainPlaying
                                ? "active-soundwave"
                                : "none",
                              animationDuration: `${(0.4 + (i % 7) * 0.08).toFixed(2)}s`,
                              animationDelay: `${((i % 4) * 0.05).toFixed(2)}s`,
                              animationIterationCount: "infinite",
                              animationDirection: "alternate",
                              animationTimingFunction: "ease-in-out",
                              height: isMainPlaying
                                ? undefined
                                : `${baseCurve}px`,
                            }}
                            className={`w-0.5 rounded-full transition-all duration-300 ${
                              isMainPlaying
                                ? "bg-gradient-to-t from-amber-500 via-rose-500 to-[#ffffff]"
                                : "bg-slate-800"
                            }`}
                          />
                        );
                      })}
                    </div>

                    {}
                    <div className="space-y-1">
                      <div className="relative group/seeker select-none pt-1">
                        <input
                          type="range"
                          min={0}
                          max={
                            ttsAudioUrl === "simulated"
                              ? voiceAudioDuration || 10
                              : audioDurationState || 10
                          }
                          value={
                            ttsAudioUrl === "simulated"
                              ? simulatedCurrentTime
                              : audioCurrentTime
                          }
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            if (ttsAudioUrl === "simulated") {
                              setSimulatedCurrentTime(val);
                            } else {
                              if (audioPreviewRef.current) {
                                audioPreviewRef.current.currentTime = val;
                                setAudioCurrentTime(val);
                              }
                            }
                          }}
                          className="seeker-input w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer focus:outline-none relative z-10"
                        />
                        <div
                          className="absolute top-1/2 -translate-y-1/2 left-0 h-1 bg-gradient-to-r from-amber-500 to-rose-500 rounded-lg pointer-events-none z-0"
                          style={{
                            width: `${Math.min(100, Math.max(0, ((ttsAudioUrl === "simulated" ? simulatedCurrentTime : audioCurrentTime) / (ttsAudioUrl === "simulated" ? voiceAudioDuration || 10 : audioDurationState || 10)) * 100))}%`,
                          }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[9px] font-mono text-slate-500 px-0.5">
                        <span className="font-bold text-slate-400">
                          {formatAudioTime(
                            ttsAudioUrl === "simulated"
                              ? simulatedCurrentTime
                              : audioCurrentTime,
                          )}
                        </span>
                        <span>
                          {formatAudioTime(
                            ttsAudioUrl === "simulated"
                              ? voiceAudioDuration || 0
                              : audioDurationState || 0,
                          )}
                        </span>
                      </div>
                    </div>

                    {}
                    <div className="flex items-center justify-between pt-1 gap-2 border-t border-slate-900/80 pt-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          const speedOptions = [0.8, 1.0, 1.2];
                          const currentSpeed = project.voiceConfig.speed || 1.0;
                          const nextIdx =
                            (speedOptions.indexOf(currentSpeed) + 1) %
                            speedOptions.length;
                          const nextSpeed = speedOptions[nextIdx];
                          setProject((prev) => ({
                            ...prev,
                            voiceConfig: {
                              ...prev.voiceConfig,
                              speed: nextSpeed,
                            },
                          }));
                        }}
                        className="bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold tracking-wide text-slate-350 hover:text-slate-100 transition-all cursor-pointer shadow-sm flex items-center gap-1.5 h-8 select-none"
                        title={t.Click_to_toggle_speech_ra}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shrink-0" />
                        <span>
                          {project.voiceConfig.speed || 1.0}
                          {t.x}
                        </span>
                      </button>

                      <div className="flex items-center justify-center">
                        {(
                          ttsAudioUrl === "simulated"
                            ? isPlayingTts
                            : isPlayingRealAudio
                        ) ? (
                          <button
                            type="button"
                            onClick={() => {
                              if (ttsAudioUrl === "simulated") {
                                if ("speechSynthesis" in window) {
                                  window.speechSynthesis.cancel();
                                  setIsPlayingTts(false);
                                }
                              } else {
                                audioPreviewRef.current?.pause();
                              }
                            }}
                            className="w-8.5 h-8.5 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 hover:scale-105 active:scale-95 text-white font-bold flex items-center justify-center cursor-pointer shadow-md shadow-rose-500/20 active:opacity-90 transition-all border border-rose-400/20 relative"
                          >
                            <span className="absolute inset-0 rounded-full bg-rose-500/15 animate-ping pointer-events-none" />
                            <div className="flex gap-[2.5px] items-center justify-center">
                              <span className="w-0.5 h-3 bg-white rounded-sm"></span>
                              <span className="w-0.5 h-3 bg-white rounded-sm"></span>
                            </div>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              if (ttsAudioUrl === "simulated") {
                                if ("speechSynthesis" in window) {
                                  window.speechSynthesis.cancel();
                                  const textToSpeak =
                                    project.scriptRewritten || "";
                                  if (!textToSpeak) return;

                                  const utterance =
                                    createSpeechUtterance(textToSpeak);
                                  utterance.onstart = () =>
                                    setIsPlayingTts(true);
                                  utterance.onend = () => {
                                    setIsPlayingTts(false);
                                    setSimulatedCurrentTime(0);
                                  };
                                  utterance.onerror = () =>
                                    setIsPlayingTts(false);
                                  window.speechSynthesis.speak(utterance);
                                }
                              } else {
                                audioPreviewRef.current
                                  ?.play()
                                  .catch((e) =>
                                    appWarn("AUDIO_PLAYBACK_FAILED", e),
                                  );
                              }
                            }}
                            className="w-8.5 h-8.5 rounded-full bg-gradient-to-r from-rose-500 to-rose-600 hover:scale-105 active:scale-95 text-white font-bold flex items-center justify-center cursor-pointer shadow-lg shadow-rose-500/20 active:opacity-90 transition-all border border-rose-500/10"
                          >
                            <Play className="w-3.5 h-3.5 fill-current ml-0.5 shrink-0" />
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={handleDownloadVoice}
                          className={`flex items-center gap-1.5 border px-3 py-1.5 rounded-lg text-[10px] font-mono uppercase tracking-wider transition-all cursor-pointer shadow-md active:scale-95 h-8 font-bold ${
                            ttsAudioUrl === "simulated"
                              ? "bg-slate-900 border-slate-800 hover:bg-slate-850 hover:border-slate-700 text-slate-300"
                              : "bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-550 hover:to-rose-700 text-white border-rose-500/10"
                          }`}
                          title={t.Download_voiceover_file}
                        >
                          <Download className="w-3.5 h-3.5 text-current shrink-0" />
                          <span>{t.DL_VOICE}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {}
              <div className="border border-slate-800 rounded-lg bg-slate-950/90 overflow-hidden font-mono text-[10px] leading-relaxed relative flex flex-col min-h-[220px] max-h-[320px]">
                {}
                <div className="bg-slate-900 px-3 py-1.5 flex items-center justify-between border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    {loadingStates["bulkVoiceGenerate_loading"] ? (
                      <span className="relative flex h-2 w-2 shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                      </span>
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    )}
                    <span className="text-[9px] text-slate-300 font-bold uppercase tracking-wider font-mono flex items-center gap-1.5">
                      {t.Console_Synchronization_l}
                    </span>
                  </div>
                  {alignmentsLog && (
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(alignmentsLog);
                        setInfoMsg(t.Copied_alignments_ledger);
                      }}
                      className="text-[9px] text-slate-400 hover:text-slate-100 bg-slate-955 hover:bg-slate-800 border border-slate-800 px-2 py-0.5 rounded cursor-pointer transition-colors font-sans font-bold"
                    >
                      {t.Copy}
                    </button>
                  )}
                </div>

                {}
                <div className="p-3 overflow-y-auto custom-scrollbar space-y-1.5 text-[11px] flex-1">
                  {loadingStates["bulkVoiceGenerate_loading"] ? (
                    <div className="space-y-2 select-none">
                      <div className="flex items-center gap-2 text-rose-400 animate-pulse">
                        <span>🚀</span>
                        <span>
                          {t.SYSTEM} {t.Launching_Real_time_Align}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-amber-300 animate-pulse font-mono pl-4">
                        <span className="animate-spin text-[10px]">⚙️</span>
                        <span>
                          {bulkVoiceStatus || t.PROCESS_Generating_audio_}
                        </span>
                      </div>
                    </div>
                  ) : alignmentsLog ? (
                    alignmentsLog
                      .split("\n")
                      .filter((line) => line.trim().length > 0)
                      .map((line, idx) => {
                        let icon = "⚙️";
                        let textColor = "text-slate-400";

                        if (
                          line.includes("[Bắt đầu]") ||
                          line.includes("[Launch]") ||
                          line.includes("[Start]")
                        ) {
                          icon = "🚀";
                          textColor = "text-emerald-400 font-semibold";
                        } else if (
                          line.includes("[Cấu hình]") ||
                          line.includes("[Config]")
                        ) {
                          icon = "🔧";
                          textColor = "text-sky-400";
                        } else if (
                          line.includes("[Thực thi]") ||
                          line.includes("[Process]")
                        ) {
                          icon = "🔄";
                          textColor = "text-amber-400";
                        } else if (
                          line.includes("[Chất lượng]") ||
                          line.includes("[Quality]")
                        ) {
                          icon = "⚡";
                          textColor = "text-rose-400 font-semibold";
                        } else if (
                          line.startsWith("👉") ||
                          line.includes("Phân cảnh") ||
                          line.includes("Scene")
                        ) {
                          icon = "⏱️";
                          textColor = "text-indigo-300 font-sans";
                        } else if (
                          line.includes("[Hoàn thành]") ||
                          line.includes("[Status]")
                        ) {
                          icon = "✅";
                          textColor = "text-emerald-400 font-semibold";
                        } else if (
                          line.includes("[Phụ đề]") ||
                          line.includes("[Subtitles]")
                        ) {
                          icon = "📋";
                          textColor = "text-fuchsia-400";
                        }

                        return (
                          <div
                            key={idx}
                            className="flex items-start gap-2 p-1 rounded hover:bg-slate-900/50 transition-colors"
                          >
                            <span className="shrink-0 text-xs">{icon}</span>
                            <span className={textColor}>{line}</span>
                          </div>
                        );
                      })
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500 py-6 text-center space-y-2">
                      <Terminal className="w-6 h-6 text-slate-700 animate-pulse" />
                      <span className="text-[10px] font-sans leading-normal">
                        {t.Console_is_waiting_for_ti}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {}
        <div className="bg-slate-950/40 p-4.5 rounded-xl border border-slate-800/60 space-y-4 mb-4 shadow-xl text-left relative overflow-hidden">
          {}
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/[0.02] rounded-full blur-2xl pointer-events-none" />

          <div className="space-y-1">
            <span className="flex items-center gap-1 text-rose-450 font-mono text-[9px] font-bold tracking-wider uppercase">
              <span className="w-1 h-1 rounded-full bg-rose-500 animate-pulse" />
              {t.Storyboard_splitting_path}
            </span>
            <h3 className="text-xs font-bold text-slate-350">
              {t.Select_Storyboard_Split_M}
            </h3>
          </div>

          {}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 relative z-10">
            {}
            <button
              type="button"
              onClick={() => {
                setStoryboardSourceMode("audio");
                setInfoMsg(t.Switching_to_Audio_Voice_);
              }}
              className={`p-3.5 rounded-xl border text-left transition-all relative overflow-hidden cursor-pointer group flex flex-col justify-between min-h-[90px] ${
                storyboardSourceMode === "audio"
                  ? "border-rose-500/35 bg-rose-950/15 shadow-md shadow-rose-950/10"
                  : "border-slate-800/80 hover:border-slate-700 bg-slate-900/20"
              }`}
            >
              {}
              <div
                className={`absolute top-3.5 right-3.5 w-4 h-4 rounded-full flex items-center justify-center transition-all ${
                  storyboardSourceMode === "audio"
                    ? "bg-rose-500 text-white scale-100"
                    : "bg-slate-800 text-transparent scale-75"
                }`}
              >
                <Check className="w-2.5 h-2.5" />
              </div>

              <div className="flex items-start gap-3">
                <div
                  className={`p-2 rounded-lg border shrink-0 transition-colors ${
                    storyboardSourceMode === "audio"
                      ? "bg-rose-500/10 border-rose-500/20 text-rose-450"
                      : "bg-slate-950 border-slate-850 text-slate-400 group-hover:text-slate-300"
                  }`}
                >
                  <Music className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-slate-200">
                      {t.Audio_voice_mode}
                    </span>
                    <span className="text-[8px] bg-emerald-500/10 text-emerald-400 px-1 py-0.2 rounded border border-emerald-500/25 font-sans tracking-tight">
                      {t.Recommended}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed max-w-[280px]">
                    {t.Align_scenes_timings_dyna}
                  </p>
                </div>
              </div>
            </button>

            {}
            <button
              type="button"
              onClick={() => {
                setStoryboardSourceMode("script");
                setInfoMsg(t.Switching_to_full_text_sc);
              }}
              className={`p-3.5 rounded-xl border text-left transition-all relative overflow-hidden cursor-pointer group flex flex-col justify-between min-h-[90px] ${
                storyboardSourceMode === "script"
                  ? "border-rose-500/35 bg-rose-950/15 shadow-md shadow-rose-950/10"
                  : "border-slate-800/80 hover:border-slate-700 bg-slate-900/20"
              }`}
            >
              {}
              <div
                className={`absolute top-3.5 right-3.5 w-4 h-4 rounded-full flex items-center justify-center transition-all ${
                  storyboardSourceMode === "script"
                    ? "bg-rose-500 text-white scale-100"
                    : "bg-slate-800 text-transparent scale-75"
                }`}
              >
                <Check className="w-2.5 h-2.5" />
              </div>

              <div className="flex items-start gap-3">
                <div
                  className={`p-2 rounded-lg border shrink-0 transition-colors ${
                    storyboardSourceMode === "script"
                      ? "bg-rose-500/10 border-rose-500/20 text-rose-450"
                      : "bg-slate-950 border-slate-850 text-slate-400 group-hover:text-slate-300"
                  }`}
                >
                  <FileText className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-slate-200">
                      {t.Script_mode}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed max-w-[280px]">
                    {t.Utilize_raw_screenplay_sc}
                  </p>
                </div>
              </div>
            </button>
          </div>

          {storyboardSourceMode === "audio" ? (
            <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800/70 space-y-3.5 animate-fade-in text-left relative overflow-hidden">
              <style>{`
 .compact-seeker::-webkit-slider-runnable-track {
 height: 4px !important;
 background: #1e293b !important;
 border: none !important;
 }
 .compact-seeker::-webkit-slider-thumb {
 width: 10px !important;
 height: 10px !important;
 margin-top: -3px !important;
 border: none !important;
 box-shadow: none !important;
 background-color: #3b82f6 !important;
 }
 .compact-seeker-emerald::-webkit-slider-runnable-track {
 height: 4px !important;
 background: #1e293b !important;
 border: none !important;
 }
 .compact-seeker-emerald::-webkit-slider-thumb {
 width: 10px !important;
 height: 10px !important;
 margin-top: -3px !important;
 border: none !important;
 box-shadow: none !important;
 background-color: #10b981 !important;
 }
 @keyframes bounce-bar {
 0% { height: 3px; }
 100% { height: 14px; }
 }
 `}</style>

              {}
              <div className="absolute -top-12 -right-12 w-40 h-40 bg-emerald-500/[0.02] rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-rose-500/[0.02] rounded-full blur-3xl pointer-events-none" />

              {}
              <div className="flex bg-slate-950/80 p-1 border border-slate-900 rounded-lg relative z-10 max-w-sm">
                <button
                  type="button"
                  onClick={() => {
                    setProject((prev) => ({
                      ...prev,
                      voiceConfig: {
                        ...prev.voiceConfig,
                        audioType: AudioType.Generated,
                        audioUrl: ttsAudioUrl || "simulated_speech",
                      },
                    }));
                  }}
                  className={`flex-1 px-3 py-1.5 rounded-md text-xs font-semibold tracking-tight transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                    project.voiceConfig.audioType !== AudioType.Upload
                      ? "bg-slate-800 text-slate-100 border-slate-700/50 shadow-sm"
                      : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
                  }`}
                >
                  <Sparkles
                    className={`w-3 h-3 ${project.voiceConfig.audioType !== AudioType.Upload ? "text-amber-400" : "text-slate-500"}`}
                  />
                  <span>{t.AI_Speech}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setProject((prev) => ({
                      ...prev,
                      voiceConfig: {
                        ...prev.voiceConfig,
                        audioType: AudioType.Upload,
                        audioUrl: project.voiceConfig.uploadedAudioName
                          ? project.voiceConfig.audioUrl
                          : undefined,
                      },
                    }));
                  }}
                  className={`flex-1 px-3 py-1.5 rounded-md text-xs font-semibold tracking-tight transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                    project.voiceConfig.audioType === AudioType.Upload
                      ? "bg-slate-800 text-slate-100 border-slate-700/50 shadow-sm"
                      : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
                  }`}
                >
                  <Upload
                    className={`w-3 h-3 ${project.voiceConfig.audioType === AudioType.Upload ? "text-emerald-400" : "text-slate-500"}`}
                  />
                  <span>{t.External_Audio}</span>
                </button>
              </div>

              {}
              <div className="relative z-10 min-h-[110px] font-sans">
                {project.voiceConfig.audioType !== AudioType.Upload ? (
                  <div className="space-y-3">
                    {ttsAudioUrl && ttsAudioUrl !== "simulated" ? (
                      <div className="bg-slate-950/45 border border-slate-850 p-3 rounded-xl space-y-2.5 shadow-md relative overflow-hidden text-left">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/[0.015] rounded-full blur-2xl pointer-events-none" />

                        {}
                        <audio
                          ref={step2AudioRef}
                          src={ttsAudioUrl}
                          onTimeUpdate={(e) =>
                            setStep2CurrentTime(e.currentTarget.currentTime)
                          }
                          onDurationChange={(e) =>
                            setStep2Duration(e.currentTarget.duration)
                          }
                          onPlay={() => setStep2IsPlaying(true)}
                          onPause={() => setStep2IsPlaying(false)}
                          onEnded={() => {
                            setStep2IsPlaying(false);
                            setStep2CurrentTime(0);
                          }}
                          className="hidden"
                        />

                        {}
                        <div className="flex items-center justify-between gap-3 relative z-10">
                          <div className="flex items-center gap-2.5 min-w-0">
                            {step2IsPlaying ? (
                              <button
                                type="button"
                                onClick={() => step2AudioRef.current?.pause()}
                                className="w-8.5 h-8.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center cursor-pointer transition-all shrink-0 shadow-sm relative active:scale-95"
                              >
                                <span className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping pointer-events-none" />
                                <div className="flex gap-[1.5px] items-center justify-center font-bold">
                                  <span className="w-0.5 h-2.5 bg-slate-950 rounded-sm" />
                                  <span className="w-0.5 h-2.5 bg-slate-950 rounded-sm" />
                                </div>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  step2AudioRef.current
                                    ?.play()
                                    .catch((e) =>
                                      appWarn("AUDIO_PLAYBACK_FAILED", e),
                                    )
                                }
                                className="w-8.5 h-8.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center cursor-pointer transition-all shrink-0 shadow-sm active:scale-95"
                              >
                                <Play className="w-3 h-3 fill-current ml-0.5 shrink-0" />
                              </button>
                            )}

                            <div className="truncate shrink-1">
                              <div className="text-xs font-bold text-slate-200 truncate flex items-center gap-1.5 leading-tight">
                                <span>
                                  {project.voiceConfig.gender === "female"
                                    ? t.Female_speaker_AI
                                    : project.voiceConfig.gender === "male"
                                      ? t.Male_speaker_AI
                                      : t.Standard_voice}
                                </span>
                                {project.voiceConfig.emotion && (
                                  <span className="text-[9px] text-teal-400 bg-teal-500/10 px-1 py-0.2 rounded font-mono uppercase tracking-tight">
                                    {project.voiceConfig.emotion}
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-500 mt-0.5 leading-none">
                                {t.Smart_aligned_timeline_vo}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-right shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                if (step2AudioRef.current) {
                                  step2AudioRef.current.currentTime = 0;
                                  setStep2CurrentTime(0);
                                }
                              }}
                              className="px-2 py-0.5 text-[9px] uppercase font-mono font-bold tracking-wider rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                            >
                              {t.Reset}
                            </button>

                            <span className="text-[9px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                              <span>{t.AI_Voice}</span>
                            </span>
                          </div>
                        </div>

                        {}
                        <div className="flex items-center gap-3 relative z-10 pt-2 border-t border-slate-900/60">
                          <span className="text-[10px] font-mono font-bold text-emerald-400 min-w-[32px] text-left">
                            {formatAudioTime(step2CurrentTime)}
                          </span>

                          <div className="flex-1 relative select-none">
                            <input
                              type="range"
                              min={0}
                              max={step2Duration || 10}
                              value={step2CurrentTime}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                if (step2AudioRef.current) {
                                  step2AudioRef.current.currentTime = val;
                                  setStep2CurrentTime(val);
                                }
                              }}
                              className="compact-seeker w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer focus:outline-none relative z-10"
                            />
                            <div
                              className="absolute top-1/2 -translate-y-1/2 left-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-lg pointer-events-none z-0"
                              style={{
                                width: `${Math.min(100, Math.max(0, (step2CurrentTime / (step2Duration || 10)) * 100))}%`,
                              }}
                            />
                          </div>

                          <span className="text-[10px] font-mono text-slate-500 min-w-[32px] text-right">
                            {formatAudioTime(step2Duration || 0)}
                          </span>

                          {}
                          <div className="flex items-end gap-0.5 h-3.5 w-3.5 shrink-0">
                            <span
                              style={{
                                height: step2IsPlaying ? "auto" : "3px",
                              }}
                              className={`w-[1.5px] rounded-sm bg-emerald-400 ${step2IsPlaying ? "animate-[bounce-bar_0.6s_infinite_alternate]" : ""}`}
                            />
                            <span
                              style={{
                                height: step2IsPlaying ? "auto" : "2px",
                              }}
                              className={`w-[1.5px] rounded-sm bg-emerald-400 ${step2IsPlaying ? "animate-[bounce-bar_0.8s_infinite_alternate_0.15s]" : ""}`}
                            />
                            <span
                              style={{
                                height: step2IsPlaying ? "auto" : "4px",
                              }}
                              className={`w-[1.5px] rounded-sm bg-emerald-400 ${step2IsPlaying ? "animate-[bounce-bar_0.5s_infinite_alternate_0.3s]" : ""}`}
                            />
                          </div>
                        </div>
                      </div>
                    ) : project.voiceConfig.audioUrl === "simulated_speech" ? (
                      <div className="bg-slate-950/45 border border-slate-855 p-3 rounded-xl space-y-2.5 shadow-md relative overflow-hidden text-left">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/[0.015] rounded-full blur-2xl pointer-events-none" />

                        {}
                        <div className="flex items-center justify-between gap-3 relative z-10">
                          <div className="flex items-center gap-2.5 min-w-0">
                            {step2IsSimulatedPlaying ? (
                              <button
                                type="button"
                                onClick={() => {
                                  if ("speechSynthesis" in window) {
                                    window.speechSynthesis.cancel();
                                  }
                                  setStep2IsSimulatedPlaying(false);
                                }}
                                className="w-8.5 h-8.5 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center cursor-pointer transition-all shrink-0 shadow-sm relative active:scale-95"
                              >
                                <span className="absolute inset-0 rounded-full bg-amber-500/20 animate-ping pointer-events-none" />
                                <div className="flex gap-[1.5px] items-center justify-center font-bold">
                                  <span className="w-0.5 h-2.5 bg-slate-950 rounded-sm" />
                                  <span className="w-0.5 h-2.5 bg-slate-950 rounded-sm" />
                                </div>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  if ("speechSynthesis" in window) {
                                    window.speechSynthesis.cancel();
                                    const textToSpeak =
                                      project.scriptRewritten || "";
                                    if (!textToSpeak) return;

                                    const utterance =
                                      createSpeechUtterance(textToSpeak);
                                    utterance.onstart = () =>
                                      setStep2IsSimulatedPlaying(true);
                                    utterance.onend = () => {
                                      setStep2IsSimulatedPlaying(false);
                                      setStep2SimulatedCurrentTime(0);
                                    };
                                    utterance.onerror = () =>
                                      setStep2IsSimulatedPlaying(false);
                                    window.speechSynthesis.speak(utterance);
                                  }
                                }}
                                className="w-8.5 h-8.5 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center cursor-pointer transition-all shrink-0 shadow-sm active:scale-95"
                              >
                                <Play className="w-3 h-3 fill-current ml-0.5 shrink-0" />
                              </button>
                            )}

                            <div className="truncate shrink-1">
                              <span className="text-xs font-bold text-slate-200 truncate">
                                {t.Simulated_Voice}
                              </span>
                              <div className="text-[10px] text-slate-500 leading-none mt-0.5">
                                {t.Synthesized_audio_demo}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-right shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                if ("speechSynthesis" in window) {
                                  window.speechSynthesis.cancel();
                                }
                                setStep2IsSimulatedPlaying(false);
                                setStep2SimulatedCurrentTime(0);
                              }}
                              className="px-2 py-0.5 text-[9px] uppercase font-mono font-bold tracking-wider rounded bg-slate-900 border border-slate-850 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                            >
                              {t.Reset}
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                if ("speechSynthesis" in window) {
                                  window.speechSynthesis.cancel();
                                }
                                setStep2IsSimulatedPlaying(false);
                                setProject((prev) => ({
                                  ...prev,
                                  voiceConfig: {
                                    ...prev.voiceConfig,
                                    audioUrl: undefined,
                                    audioType: AudioType.Generated,
                                  },
                                }));
                              }}
                              className="px-2 py-0.5 text-[9px] font-mono tracking-wider font-bold rounded border border-rose-950 text-rose-400 hover:bg-rose-950/25 transition-colors cursor-pointer"
                            >
                              {t.Exit_synth}
                            </button>
                          </div>
                        </div>

                        {}
                        <div className="flex items-center gap-3 relative z-10 pt-2 border-t border-slate-900/60">
                          <span className="text-[10px] font-mono font-bold text-amber-500 min-w-[32px] text-left">
                            {formatAudioTime(step2SimulatedCurrentTime)}
                          </span>

                          <div className="flex-1 relative select-none">
                            <input
                              type="range"
                              min={0}
                              max={voiceAudioDuration || 10}
                              value={step2SimulatedCurrentTime}
                              onChange={(e) =>
                                setStep2SimulatedCurrentTime(
                                  parseFloat(e.target.value),
                                )
                              }
                              className="compact-seeker w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer focus:outline-none relative z-10"
                            />
                            <div
                              className="absolute top-1/2 -translate-y-1/2 left-0 h-1 bg-gradient-to-r from-amber-500 to-rose-400 rounded-lg pointer-events-none z-0"
                              style={{
                                width: `${Math.min(100, Math.max(0, (step2SimulatedCurrentTime / (voiceAudioDuration || 10)) * 100))}%`,
                              }}
                            />
                          </div>

                          <span className="text-[10px] font-mono text-slate-500 min-w-[32px] text-right">
                            {formatAudioTime(voiceAudioDuration || 0)}
                          </span>

                          {}
                          <div className="flex items-end gap-0.5 h-3.5 w-3.5 shrink-0">
                            <span
                              style={{
                                height: step2IsSimulatedPlaying
                                  ? "auto"
                                  : "3px",
                              }}
                              className={`w-[1.5px] rounded-sm bg-amber-400 ${step2IsSimulatedPlaying ? "animate-[bounce-bar_0.6s_infinite_alternate]" : ""}`}
                            />
                            <span
                              style={{
                                height: step2IsSimulatedPlaying
                                  ? "auto"
                                  : "2px",
                              }}
                              className={`w-[1.5px] rounded-sm bg-amber-400 ${step2IsSimulatedPlaying ? "animate-[bounce-bar_0.8s_infinite_alternate_0.15s]" : ""}`}
                            />
                            <span
                              style={{
                                height: step2IsSimulatedPlaying
                                  ? "auto"
                                  : "4px",
                              }}
                              className={`w-[1.5px] rounded-sm bg-amber-400 ${step2IsSimulatedPlaying ? "animate-[bounce-bar_0.5s_infinite_alternate_0.3s]" : ""}`}
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-slate-950/45 border border-slate-900 rounded-xl text-center space-y-3 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/[0.01] rounded-full blur-2xl pointer-events-none" />
                        <div className="flex flex-col items-center justify-center space-y-1.5 max-w-sm mx-auto">
                          <div className="p-2 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
                            <Volume2 className="w-5 h-5 shrink-0 animate-pulse" />
                          </div>
                          <div className="space-y-0.5">
                            <h5 className="text-[11px] font-bold text-slate-250">
                              {t.AI_voiceover_not_compiled}
                            </h5>
                            <p className="text-[10px] text-slate-500 leading-relaxed max-w-xs">
                              {t.Compile_AI_speech_at_step}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setProject((prev) => ({
                              ...prev,
                              voiceConfig: {
                                ...prev.voiceConfig,
                                audioType: AudioType.Simulated,
                                uploadedAudioName: t.Sample_Speech,
                                audioUrl: "simulated_speech",
                              },
                            }));
                            setInfoMsg(t.Activated_simulated_speec);
                          }}
                          className="w-full max-w-[170px] mx-auto py-1.5 bg-gradient-to-r from-purple-600 to-rose-500 hover:from-purple-500 hover:to-rose-450 text-white font-bold text-[10px] uppercase tracking-wider rounded-lg transition-all cursor-pointer shadow active:scale-95 flex items-center justify-center gap-1"
                        >
                          <Sparkles className="w-3 h-3 animate-pulse text-amber-200" />
                          <span>{t.Simulated_Voice_5}</span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {project.voiceConfig.audioUrl ? (
                      <div className="bg-slate-950/45 border border-slate-850 p-3 rounded-xl space-y-2.5 shadow-md relative overflow-hidden text-left">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/[0.015] rounded-full blur-2xl pointer-events-none" />

                        {}
                        <audio
                          ref={step2AudioRef}
                          src={project.voiceConfig.audioUrl}
                          onTimeUpdate={(e) =>
                            setStep2CurrentTime(e.currentTarget.currentTime)
                          }
                          onDurationChange={(e) =>
                            setStep2Duration(e.currentTarget.duration)
                          }
                          onPlay={() => setStep2IsPlaying(true)}
                          onPause={() => setStep2IsPlaying(false)}
                          onEnded={() => {
                            setStep2IsPlaying(false);
                            setStep2CurrentTime(0);
                          }}
                          className="hidden"
                        />

                        {}
                        <div className="flex items-center justify-between gap-3 relative z-10">
                          <div className="flex items-center gap-2.5 min-w-0">
                            {step2IsPlaying ? (
                              <button
                                type="button"
                                onClick={() => step2AudioRef.current?.pause()}
                                className="w-8.5 h-8.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center cursor-pointer transition-all shrink-0 shadow-sm relative active:scale-95"
                              >
                                <span className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping pointer-events-none" />
                                <div className="flex gap-[1.5px] items-center justify-center font-bold">
                                  <span className="w-0.5 h-2.5 bg-slate-950 rounded-sm" />
                                  <span className="w-0.5 h-2.5 bg-slate-950 rounded-sm" />
                                </div>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  step2AudioRef.current
                                    ?.play()
                                    .catch((e) =>
                                      appWarn("AUDIO_PLAYBACK_FAILED", e),
                                    )
                                }
                                className="w-8.5 h-8.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center cursor-pointer transition-all shrink-0 shadow-sm active:scale-95"
                              >
                                <Play className="w-3 h-3 fill-current ml-0.5 shrink-0" />
                              </button>
                            )}

                            <div className="truncate shrink-1">
                              <span className="text-xs font-bold text-slate-205 truncate">
                                {project.voiceConfig.uploadedAudioName ||
                                  "External_audio.mp3"}
                              </span>
                              <div className="text-[10px] text-slate-500 leading-none mt-0.5">
                                {t.Linked_external_narration}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                if (step2AudioRef.current) {
                                  step2AudioRef.current.currentTime = 0;
                                  setStep2CurrentTime(0);
                                }
                              }}
                              className="px-2 py-0.5 text-[9px] uppercase font-mono font-bold tracking-wider rounded bg-slate-900 border border-slate-850 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                            >
                              {t.Reset}
                            </button>

                            <label className="text-[9px] text-slate-405 hover:text-slate-205 hover:bg-slate-800 border border-slate-800 font-mono px-2 py-0.5 rounded transition-colors font-bold uppercase cursor-pointer block">
                              <span>{t.Replace}</span>
                              <input
                                type="file"
                                accept="audio/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const objectUrl = URL.createObjectURL(file);
                                    setProject((prev) => ({
                                      ...prev,
                                      voiceConfig: {
                                        ...prev.voiceConfig,
                                        audioType: AudioType.Upload,
                                        uploadedAudioName: file.name,
                                        audioUrl: objectUrl,
                                      },
                                    }));
                                  }
                                }}
                              />
                            </label>

                            <button
                              type="button"
                              onClick={() => {
                                setProject((p) => ({
                                  ...p,
                                  voiceConfig: {
                                    ...p.voiceConfig,
                                    uploadedAudioName: undefined,
                                    audioUrl: undefined,
                                  },
                                }));
                              }}
                              className="text-[9px] text-rose-400 hover:text-rose-350 hover:bg-rose-950/20 border border-slate-800 font-mono px-2 py-0.5 rounded transition-colors font-bold uppercase cursor-pointer"
                            >
                              {t.Remove}
                            </button>
                          </div>
                        </div>

                        {}
                        <div className="flex items-center gap-3 relative z-10 pt-2 border-t border-slate-900/60">
                          <span className="text-[10px] font-mono font-bold text-emerald-400 min-w-[32px] text-left">
                            {formatAudioTime(step2CurrentTime)}
                          </span>

                          <div className="flex-1 relative select-none">
                            <input
                              type="range"
                              min={0}
                              max={step2Duration || 10}
                              value={step2CurrentTime}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                if (step2AudioRef.current) {
                                  step2AudioRef.current.currentTime = val;
                                  setStep2CurrentTime(val);
                                }
                              }}
                              className="compact-seeker-emerald w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer focus:outline-none relative z-10"
                            />
                            <div
                              className="absolute top-1/2 -translate-y-1/2 left-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-lg pointer-events-none z-0"
                              style={{
                                width: `${Math.min(100, Math.max(0, (step2CurrentTime / (step2Duration || 10)) * 100))}%`,
                              }}
                            />
                          </div>

                          <span className="text-[10px] font-mono text-slate-500 min-w-[32px] text-right">
                            {formatAudioTime(step2Duration || 0)}
                          </span>

                          {}
                          <div className="flex items-end gap-0.5 h-3.5 w-3.5 shrink-0">
                            <span
                              style={{
                                height: step2IsPlaying ? "auto" : "3px",
                              }}
                              className={`w-[1.5px] rounded-sm bg-emerald-400 ${step2IsPlaying ? "animate-[bounce-bar_0.6s_infinite_alternate]" : ""}`}
                            />
                            <span
                              style={{
                                height: step2IsPlaying ? "auto" : "2px",
                              }}
                              className={`w-[1.5px] rounded-sm bg-emerald-405 ${step2IsPlaying ? "animate-[bounce-bar_0.8s_infinite_alternate_0.15s]" : ""}`}
                            />
                            <span
                              style={{
                                height: step2IsPlaying ? "auto" : "4px",
                              }}
                              className={`w-[1.5px] rounded-sm bg-emerald-400 ${step2IsPlaying ? "animate-[bounce-bar_0.5s_infinite_alternate_0.3s]" : ""}`}
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsAudioDragging(true);
                        }}
                        onDragLeave={() => setIsAudioDragging(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setIsAudioDragging(false);
                          const file = e.dataTransfer.files?.[0];
                          if (file && file.type.startsWith("audio/")) {
                            const objectUrl = URL.createObjectURL(file);
                            setProject((prev) => ({
                              ...prev,
                              voiceConfig: {
                                ...prev.voiceConfig,
                                audioType: AudioType.Upload,
                                uploadedAudioName: file.name,
                                audioUrl: objectUrl,
                              },
                            }));
                            setInfoMsg(
                              t.loadedFile.replace("{name}", file.name),
                            );
                          }
                        }}
                        className="relative z-10"
                      >
                        <label
                          className={`w-full min-h-[95px] py-4 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer bg-slate-955/40 ${
                            isAudioDragging
                              ? "border-emerald-500/60 bg-emerald-950/25 animate-pulse scale-[1.01]"
                              : "border-slate-850 hover:border-emerald-500/40 hover:bg-slate-950/60"
                          }`}
                        >
                          <Upload
                            className={`w-5 h-5 transition-transform ${isAudioDragging ? "text-emerald-400 scale-125" : "text-slate-500"}`}
                          />
                          <div className="text-center space-y-0.5">
                            <span className="text-[11px] font-bold text-slate-300 block font-sans">
                              {isAudioDragging
                                ? t.Drop_audio_file_now
                                : t.Drag_audio_or_Click_to_up}
                            </span>
                            <span className="text-[9px] text-slate-500 block font-sans">
                              {t.Supported_up_to_50MB_wav_}
                            </span>
                          </div>
                          <input
                            type="file"
                            accept="audio/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const objectUrl = URL.createObjectURL(file);
                                setProject((prev) => ({
                                  ...prev,
                                  voiceConfig: {
                                    ...prev.voiceConfig,
                                    audioType: AudioType.Upload,
                                    uploadedAudioName: file.name,
                                    audioUrl: objectUrl,
                                  },
                                }));
                              }
                            }}
                          />
                        </label>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800/70 space-y-3 animate-fade-in text-left">
              <textarea
                value={project.scriptRewritten || ""}
                onChange={(e) =>
                  setProject((prev) => ({
                    ...prev,
                    scriptRewritten: e.target.value,
                  }))
                }
                placeholder={t.Paste_verbose_storyboard_}
                className="bg-slate-950 border border-slate-850 rounded-xl p-3 w-full text-xs text-slate-300 leading-relaxed font-sans outline-none focus:border-rose-500/50 custom-scrollbar resize-none min-h-[140px]"
              />
              <div className="text-[10px] text-slate-500 italic text-right px-1">
                {t.Tip_Pasting_full_narratio}
              </div>
            </div>
          )}
        </div>

        {}
        <div className="bg-slate-950/60 border border-slate-800/85 rounded-xl p-4 space-y-3 shadow-inner text-left">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() =>
                setShowAdvancedVisualConfig(!showAdvancedVisualConfig)
              }
              className="flex items-center gap-2 text-xs font-bold text-rose-450 hover:text-rose-350 cursor-pointer transition-colors"
              title={t.Modify_visual_configurati}
            >
              <Sliders className="w-4 h-4 text-rose-500 animate-pulse" />
              {t.Veo_3_Creative_Studio_Dec}
              <span className="text-[9px] uppercase font-mono font-medium tracking-wide px-2 py-0.5 bg-rose-950/45 border border-rose-500/10 text-rose-400 rounded">
                {(() => {
                  const engine = project.visualConfig?.imageGeneratorEngine || ImageGeneratorEngine.Veo3;
                  let modelLabel = ImageModelLabel.Veo3;
                  if (engine === ImageGeneratorEngine.Imagen) {
                    modelLabel = ImageModelLabel.Imagen;
                  } else if (engine === ImageGeneratorEngine.LabsSandbox) {
                    modelLabel = ImageModelLabel.LabsSandbox;
                  }
                  if (project.visualConfig?.generationMode === ImageGenerationMode.GeminiChat) {
                    return `GEMINI ROOM • ${modelLabel}`;
                  }
                  return modelLabel;
                })()}
              </span>
            </button>
            <button
              type="button"
              onClick={() =>
                setShowAdvancedVisualConfig(!showAdvancedVisualConfig)
              }
              className="flex items-center gap-1.5 text-slate-400 hover:text-slate-100 text-xs font-medium cursor-pointer transition-all"
            >
              <span>{showAdvancedVisualConfig ? t.Collapse : t.Expand}</span>
              {showAdvancedVisualConfig ? (
                <ChevronUp className="w-4 h-4 dynamic-icon" />
              ) : (
                <ChevronDown className="w-4 h-4 dynamic-icon" />
              )}
            </button>
          </div>

          {showAdvancedVisualConfig && (
            <div className="pt-4 border-t border-slate-800/80 space-y-4 text-left">
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] text-rose-400 font-mono font-bold flex items-center gap-1.5 uppercase tracking-wider">
                  <ImageIcon className="w-3.5 h-3.5 text-rose-500" />
                  {t.Active_Drawing_Engine}
                  <span className="text-[9px] bg-emerald-950/45 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-mono font-normal flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                    {t.IMAGE_REFERENCE_NODE}
                  </span>
                </label>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col md:flex-row gap-4 font-sans shadow-inner items-stretch">
                {}
                <div
                  className="bg-slate-900/40 border-[2px] border-dashed border-slate-800 hover:border-emerald-500/50 rounded-lg p-3 transition-all flex flex-col items-center justify-center text-center relative group cursor-pointer w-full md:w-64 shrink-0 min-h-[90px]"
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (e.dataTransfer.files) {
                      handleReferenceImagesUpload(e.dataTransfer.files);
                    }
                  }}
                >
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      if (e.target.files) {
                        handleReferenceImagesUpload(e.target.files);
                        e.target.value = "";
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="p-1.5 bg-slate-950 rounded-lg border border-slate-800 group-hover:scale-110 group-hover:border-emerald-500/30 transition-all duration-300 mb-1 shadow-lg">
                    <Upload className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-400 transition-colors" />
                  </div>
                  <span className="text-[9px] font-bold text-slate-200 block mb-0.5 whitespace-nowrap">
                    {t.Upload_style_images}
                  </span>
                  <span className="text-[8px] text-slate-500 leading-tight block whitespace-nowrap">
                    {t.System_extracts_Style_Art}
                  </span>
                </div>

                {}
                <div className="flex-1 flex flex-col min-w-0 w-full min-h-[90px]">
                  {project.visualConfig?.referenceImages &&
                  project.visualConfig.referenceImages.length > 0 ? (
                    <div className="flex flex-col gap-3 h-full">
                      <div className="flex flex-wrap gap-2">
                        {project.visualConfig.referenceImages.map(
                          (imgBase64, idx) => (
                            <div
                              key={idx}
                              className="relative w-12 h-12 rounded-lg group shadow-sm"
                            >
                              <div className="w-full h-full border border-slate-800 bg-black rounded-lg overflow-hidden">
                                <img
                                  src={imgBase64}
                                  alt={`Style reference ${idx + 1}`}
                                  className="w-full h-full object-cover opacity-90 transition-opacity group-hover:opacity-100"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-lg"></div>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setProject((prev) => {
                                    const updated = [
                                      ...(prev.visualConfig?.referenceImages ||
                                        []),
                                    ];
                                    updated.splice(idx, 1);
                                    return {
                                      ...prev,
                                      visualConfig: {
                                        ...prev.visualConfig,
                                        referenceImages: updated,
                                      },
                                    };
                                  });
                                }}
                                className="absolute -top-2 -right-2 w-5 h-5 bg-rose-500 hover:bg-rose-600 border border-rose-400/50 rounded-full flex items-center justify-center text-white transition-all z-20 backdrop-blur-sm opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 shadow-md cursor-pointer"
                                title={t.Remove}
                              >
                                <X className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          ),
                        )}
                      </div>

                      <div className="mt-auto flex flex-col sm:flex-row sm:items-center gap-2 border-t border-slate-800/50 pt-2">
                        {project.visualConfig?.referencePrompt && (
                          <div className="flex-1 min-w-0 bg-emerald-950/20 border border-emerald-500/30 rounded-md p-1.5 flex items-center justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-emerald-400 font-bold text-[9px] mb-0.5 uppercase tracking-wider flex items-center gap-1">
                                <Sparkles className="w-2.5 h-2.5" /> {t.Style}
                              </h4>
                              <p
                                className="text-slate-300 text-[10px] leading-relaxed italic line-clamp-1"
                                title={project.visualConfig.referencePrompt}
                              >
                                {project.visualConfig.referencePrompt}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(
                                  project.visualConfig?.referencePrompt || "",
                                );
                                setInfoMsg(t.Copied_style);
                              }}
                              className="shrink-0 p-1 bg-emerald-900/50 hover:bg-emerald-800 border border-emerald-500/30 rounded text-emerald-400 transition-colors"
                              title={t.Copy_style}
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={handleExtractStyle}
                          disabled={!!loadingStates["extractStyle"]}
                          className="shrink-0 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:from-slate-800 disabled:to-slate-850 disabled:opacity-75 disabled:cursor-not-allowed text-white font-bold text-[10px] rounded-lg flex items-center justify-center gap-1.5 shadow transition-all cursor-pointer active:scale-95 border border-emerald-500/30"
                        >
                          {loadingStates["extractStyle"] ? (
                            <>
                              <RefreshCw className="w-3 h-3 animate-spin" />
                              <span>{t.Extracting}</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3 h-3 text-emerald-100" />
                              <span>{t.Extract_Style}</span>
                            </>
                          )}
                        </button>
                        {project.visualConfig?.referencePrompt &&
                          project.storyboard &&
                          project.storyboard.length > 0 && (
                            <button
                              type="button"
                              onClick={handleApplyStyleToScenes}
                              disabled={!!loadingStates["applyStyle"]}
                              className="shrink-0 px-3 py-1.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 disabled:from-slate-800 disabled:to-slate-850 disabled:opacity-75 disabled:cursor-not-allowed text-white font-bold text-[10px] rounded-lg flex items-center justify-center gap-1.5 shadow transition-all cursor-pointer active:scale-95 border border-amber-500/30"
                            >
                              {loadingStates["applyStyle"] ? (
                                <>
                                  <RefreshCw className="w-3 h-3 animate-spin" />
                                  <span>{t.Applying}</span>
                                </>
                              ) : (
                                <>
                                  <Check className="w-3 h-3 text-amber-100" />
                                  <span>{t.Apply_Style}</span>
                                </>
                              )}
                            </button>
                          )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center h-full border border-dashed border-slate-800/60 rounded-lg bg-slate-900/20 text-slate-500 text-[10px] italic">
                      {t.No_reference_images_uploa}
                    </div>
                  )}
                </div>
              </div>

              {/* Character Reference Divider & Block */}
              <div className="border-t border-slate-800/80 my-2 pt-2" />

              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] text-rose-455 font-mono font-bold flex items-center gap-1.5 uppercase tracking-wider">
                  <User className="w-3.5 h-3.5 text-rose-500" />
                  {t.charConsistencyTitle}
                  <span className="text-[9px] bg-emerald-950/45 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-mono font-normal flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                    CHARACTER REFERENCE NODE
                  </span>
                </label>
              </div>

              {/* Step 1: Character script analysis / list */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-3 shadow-inner">
                {!project.visualConfig?.characters ||
                project.visualConfig.characters.length === 0 ? (
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 text-[11px] text-slate-350 leading-relaxed italic">
                      {t.charNotAnalyzed}
                    </div>
                    <button
                      type="button"
                      onClick={handleAnalyzeCharacter}
                      disabled={!!loadingStates["analyzeCharacter"]}
                      className="shrink-0 px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 text-rose-400 hover:text-rose-350 text-[10px] font-bold rounded-lg flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                    >
                      {loadingStates["analyzeCharacter"] ? (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                      ) : (
                        <Sparkles className="w-3 h-3" />
                      )}
                      {t.charAnalyzeBtn}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Header with re-analyze and apply options */}
                    <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                      <span className="text-[10px] text-slate-400 font-mono">
                        {t.charDetectedCount.replace(
                          "{count}",
                          project.visualConfig.characters.length.toString(),
                        )}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleAnalyzeCharacter}
                          disabled={!!loadingStates["analyzeCharacter"]}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-[9px] font-bold rounded flex items-center gap-1 transition-all cursor-pointer"
                        >
                          <RefreshCw
                            className={`w-2.5 h-2.5 ${loadingStates["analyzeCharacter"] ? "animate-spin" : ""}`}
                          />
                          {t.charReAnalyze}
                        </button>
                        {project.visualConfig.characters.some(
                          (c) => c.prompt || c.description,
                        ) &&
                          project.storyboard &&
                          project.storyboard.length > 0 && (
                            <button
                              type="button"
                              onClick={handleApplyCharacterToScenes}
                              disabled={!!loadingStates["applyCharacter"]}
                              className="px-2.5 py-1 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-[9px] font-bold rounded flex items-center gap-1 transition-all shadow border border-amber-500/30 cursor-pointer"
                            >
                              {loadingStates["applyCharacter"] ? (
                                <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                              ) : (
                                <Check className="w-2.5 h-2.5" />
                              )}
                            </button>
                          )}
                      </div>
                    </div>

                    {/* Characters Loop */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {project.visualConfig.characters.map((char) => {
                        const isExtracting =
                          !!loadingStates[`extractCharacter_${char.id}`];
                        return (
                          <div
                            key={char.id}
                            className="bg-slate-955/65 rounded-xl p-3 border border-slate-850 flex flex-col justify-between gap-2.5 relative shadow-md"
                          >
                            <div className="flex flex-row gap-3 items-stretch">
                              {/* Left column: Text details */}
                              <div className="flex-1 min-w-0 flex flex-col justify-between">
                                <div>
                                  <div className="flex items-center justify-between gap-1">
                                    <h4 className="text-[11px] font-bold text-rose-350 flex items-center gap-1 min-w-0">
                                      <User className="w-3 h-3 text-rose-500 shrink-0" />
                                      <span className="truncate">
                                        {char.name}
                                      </span>
                                    </h4>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        navigator.clipboard.writeText(
                                          `${char.name}: ${char.description}`,
                                        );
                                        setInfoMsg(t.charDescCopied);
                                        setTimeout(() => setInfoMsg(""), 3000);
                                      }}
                                      title={t.charCopyDesc}
                                      className="shrink-0 p-0.5 bg-slate-900 hover:bg-slate-800 border border-slate-855 rounded text-slate-400 hover:text-slate-205 transition-colors cursor-pointer"
                                    >
                                      <Copy className="w-2.5 h-2.5" />
                                    </button>
                                  </div>
                                  <p
                                    className="text-[9px] text-slate-400 mt-1 leading-relaxed bg-slate-900/30 p-1.5 rounded border border-slate-855/50 line-clamp-3"
                                    title={char.description}
                                  >
                                    {char.description}
                                  </p>
                                </div>
                              </div>

                              {/* Divider inside card */}
                              <div className="w-[1px] bg-slate-800/80 my-1 self-stretch" />

                              {/* Right column: Upload & Previews */}
                              <div className="w-24 sm:w-28 shrink-0 flex flex-col gap-1.5 justify-between">
                                <div
                                  className="bg-slate-900/40 border border-dashed border-slate-800 hover:border-emerald-500/50 rounded p-1.5 transition-all flex flex-col items-center justify-center text-center relative group cursor-pointer h-[42px]"
                                  onDragOver={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                  }}
                                  onDrop={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (e.dataTransfer.files) {
                                      handleCharacterImagesUpload(
                                        char.id,
                                        e.dataTransfer.files,
                                      );
                                    }
                                  }}
                                >
                                  <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    onChange={(e) => {
                                      if (e.target.files) {
                                        handleCharacterImagesUpload(
                                          char.id,
                                          e.target.files,
                                        );
                                        e.target.value = "";
                                      }
                                    }}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                  />
                                  <Upload className="w-2.5 h-2.5 text-slate-500 group-hover:text-emerald-400 mb-0.5" />
                                  <span className="text-[7px] font-bold text-slate-350 block leading-tight truncate max-w-[80px]">
                                    {t.charUploadFor.replace(
                                      "{name}",
                                      char.name,
                                    )}
                                  </span>
                                </div>

                                {/* Preview Thumbnails */}
                                <div className="min-w-0 w-full">
                                  {char.images && char.images.length > 0 ? (
                                    <div className="flex flex-wrap gap-1 max-h-[32px] overflow-y-auto p-0.5 bg-slate-900/10 rounded border border-slate-900/30">
                                      {char.images.map((imgBase64, idx) => (
                                        <div
                                          key={idx}
                                          className="relative w-6 h-6 rounded group shadow-sm"
                                        >
                                          <div className="w-full h-full border border-slate-800 bg-black rounded overflow-hidden">
                                            <img
                                              src={imgBase64}
                                              alt={`${char.name} ref ${idx + 1}`}
                                              className="w-full h-full object-cover opacity-90 transition-opacity group-hover:opacity-100"
                                            />
                                          </div>
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setProject((prev) => {
                                                const updatedChars = (
                                                  prev.visualConfig
                                                    ?.characters || []
                                                ).map((c) => {
                                                  if (c.id === char.id) {
                                                    const newImgs = [
                                                      ...(c.images || []),
                                                    ];
                                                    newImgs.splice(idx, 1);
                                                    return {
                                                      ...c,
                                                      images: newImgs,
                                                    };
                                                  }
                                                  return c;
                                                });
                                                return {
                                                  ...prev,
                                                  visualConfig: {
                                                    ...prev.visualConfig,
                                                    characters: updatedChars,
                                                    characterImages:
                                                      updatedChars[0]?.images ||
                                                      [],
                                                  },
                                                };
                                              });
                                            }}
                                            className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 hover:bg-rose-600 border border-rose-400/50 rounded-full flex items-center justify-center text-white transition-all z-20 backdrop-blur-sm opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 shadow shadow-md cursor-pointer"
                                          >
                                            <X className="w-1.5 h-1.5" />
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="flex items-center justify-center py-1 bg-slate-950/20 border border-dashed border-slate-900 rounded text-[7px] text-slate-500 italic text-center whitespace-nowrap">
                                      Chưa có ảnh
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Prompt Spec & Extraction Actions at bottom */}
                            <div className="border-t border-slate-900/60 pt-2 space-y-2">
                              {char.prompt && (
                                <div className="bg-emerald-950/20 border border-emerald-500/20 rounded p-1 flex items-center justify-between gap-1.5">
                                  <div className="flex-1 min-w-0">
                                    <h4 className="text-emerald-400 font-bold text-[8px] mb-0.5 uppercase tracking-wider flex items-center gap-1">
                                      <Sparkles className="w-2 h-2" />{" "}
                                      {t.charPromptTitle}
                                    </h4>
                                    <p
                                      className="text-slate-350 text-[8px] leading-relaxed italic line-clamp-1"
                                      title={char.prompt}
                                    >
                                      {char.prompt}
                                    </p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard.writeText(
                                        char.prompt || "",
                                      );
                                      setInfoMsg(t.charCopied);
                                      setTimeout(() => setInfoMsg(""), 3000);
                                    }}
                                    className="shrink-0 p-1 bg-emerald-900/40 hover:bg-emerald-800/60 border border-emerald-500/20 rounded text-emerald-400 transition-colors cursor-pointer"
                                  >
                                    <Copy className="w-2.5 h-2.5" />
                                  </button>
                                </div>
                              )}

                              <button
                                type="button"
                                onClick={() => handleExtractCharacter(char.id)}
                                disabled={isExtracting}
                                className="w-full py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:from-slate-800 disabled:to-slate-850 disabled:opacity-75 disabled:cursor-not-allowed text-white font-bold text-[9px] rounded flex items-center justify-center gap-1 shadow transition-all cursor-pointer border border-emerald-500/30"
                              >
                                {isExtracting ? (
                                  <>
                                    <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                                    <span>{t.charExtractingBtn}</span>
                                  </>
                                ) : (
                                  <>
                                    <Sparkles className="w-2.5 h-2.5 text-emerald-100" />
                                    <span>{t.charExtractBtn}</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {}
        <div className="bg-slate-950/80 border border-slate-850 rounded-xl p-5 space-y-4 shadow-xl">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 pb-3 border-b border-slate-900">
            <div>
              <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2 font-mono">
                <Layers className="w-4 h-4 text-rose-500 animate-pulse" />
                {t.Bulk_visuals_sync_suite}
              </h4>
              <p className="text-slate-400 text-[11px] mt-0.5">
                {t.Export_all_scene_prompts_}
              </p>
            </div>
          </div>

          {}
          {bulkUploadWarning && (
            <div className="p-3 bg-amber-950/40 border border-amber-500/25 text-xs text-amber-300 rounded-lg flex items-start gap-2">
              <span className="text-sm">⚠️</span>
              <p className="leading-relaxed font-sans">{bulkUploadWarning}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {}
            <div className="bg-slate-900/60 border border-slate-850/50 p-4 rounded-lg flex flex-col justify-between space-y-3">
              <div className="space-y-1">
                <span className="text-[10px] text-rose-450 font-bold uppercase tracking-wider font-mono">
                  {t.Step_1_Bulk_copy_raw_prom}
                </span>
                <p className="text-slate-300 text-xs leading-relaxed">
                  {t.Copy_all_chronological_sc}
                </p>
              </div>

              <button
                onClick={handleCopyAllPrompts}
                className={`w-full py-2.5 px-4 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  copiedAll
                    ? "bg-emerald-600 text-white"
                    : "bg-rose-955/40 hover:bg-rose-900/40 text-rose-400 border border-rose-500/20"
                }`}
              >
                {copiedAll ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                {copiedAll ? t.Copied_successfully : t.Copy_All}
              </button>
            </div>

            {}
            <div
              className="bg-slate-900/30 border border-dashed border-rose-500/20 hover:border-rose-500/40 rounded-lg p-4 transition flex flex-col items-center justify-center text-center space-y-3 min-h-[140px] relative group"
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (e.dataTransfer.files) {
                  handleBulkUploadImages(e.dataTransfer.files);
                }
              }}
            >
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files) {
                    handleBulkUploadImages(e.target.files);
                  }
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />

              <div className="p-3 bg-rose-955 rounded-full border border-rose-500/10 group-hover:scale-105 transition-all">
                <Upload className="w-5 h-5 text-rose-455" />
              </div>

              <div className="space-y-0.5 pointer-events-none">
                <p className="text-xs text-slate-300 font-bold">
                  {t.Step_2_Batch_upload_scene}
                </p>
                <p className="text-[11px] text-slate-400 max-w-[320px] mx-auto">
                  {t.Drag_drop_all_generated_i}
                </p>
              </div>
            </div>
          </div>

          {}
          <div className="p-3.5 bg-slate-950 border border-slate-900 rounded-lg space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider font-bold block">
              {t.How_auto_alignment_works}
            </span>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {currentLang === "vi" ? (
                <>
                  {t.H_th_ng_s_ng_b_theo_t_n_f}{" "}
                  <code className="text-rose-400 font-bold">{t.txt_1_jpg}</code>
                  ,{" "}
                  <code className="text-rose-400 font-bold">{t.txt_2_jpg}</code>
                  {t.ho_c_ch_a_ch_s_t_ng_ng_v_} <b>{t.A_Z}</b>{" "}
                  {t.ph_n_ph_i_u_t_u_n_cu_i}
                </>
              ) : (
                <>
                  {t.Aligns_based_on_number_in}{" "}
                  <code className="text-rose-455">{t.txt_1_jpg}</code> {t.or}{" "}
                  <code className="text-rose-455">{t.scene_2_jpg}</code>
                  {t.Otherwise_distributes_sor}
                </>
              )}
            </p>
          </div>
        </div>

        {}
        <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3 text-left w-full md:w-auto">
            <div className="p-2 bg-rose-950/40 rounded-lg text-rose-450 border border-rose-500/10">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-1.5">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                {t.Auto_Render_All_Scene_Art}
              </h4>
              <div className="relative group/tooltip inline-block">
                <HelpCircle className="w-3.5 h-3.5 text-slate-400 hover:text-slate-200 cursor-help transition-colors" />
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-72 bg-slate-900 border border-slate-800 p-3 rounded-lg text-slate-350 text-[10px] leading-relaxed shadow-xl opacity-0 group-hover/tooltip:opacity-100 pointer-events-none transition-all duration-200 z-50">
                  <p>{t.Process_all_storyboard_de}</p>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            {isBatchGenerating ? (
              <div className="flex items-center gap-2 w-full md:w-auto justify-center">
                <div className="flex items-center gap-3 bg-slate-900 border border-rose-500/20 px-4 py-2.5 rounded-lg text-xs font-mono text-rose-300">
                  <RefreshCw className="w-4 h-4 animate-spin text-rose-500 shrink-0" />
                  <span>{batchProgressMsg}</span>
                </div>
                <button
                  type="button"
                  onClick={handleCancelBatchGenerate}
                  disabled={isCancellingBatch}
                  className="bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-slate-300 hover:text-white px-3 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 border border-slate-700 shadow-sm"
                  title={t.stopImageGen}
                >
                  {isCancellingBatch ? (
                    <RefreshCw className="w-3.5 h-3.5 text-rose-400 animate-spin" />
                  ) : (
                    <X className="w-3.5 h-3.5 text-rose-400" />
                  )}
                  {isCancellingBatch ? t.cancelling : t.cancel}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleBatchGenerateAllImages}
                disabled={
                  isBatchGenerating || (project.storyboard || []).length === 0
                }
                className="w-full md:w-auto bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 disabled:from-slate-800 disabled:to-slate-850 disabled:opacity-75 disabled:cursor-not-allowed text-white font-mono font-bold text-xs px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 cursor-pointer transition shadow-lg active:scale-95"
                title={t.Trigger_batch_AI_renderin}
              >
                <Sparkles className="w-4 h-4 text-amber-200 animate-pulse" />
                <span>{t.BATCH_RENDER}</span>
              </button>
            )}
          </div>
        </div>

        {}
        {!project.storyboard || project.storyboard.length === 0 ? (
          loadingStates["storyboardSplit_loading"] ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
              {[1, 2, 3, 4, 5, 6].map((idx) => (
                <div
                  key={idx}
                  className="bg-slate-950/40 border border-slate-800 rounded-xl overflow-hidden shadow-lg animate-pulse p-4 space-y-4"
                >
                  <div className="aspect-[16/9] bg-slate-900 rounded-lg flex items-center justify-center border border-slate-800/60 relative">
                    <RefreshCw className="w-5 h-5 text-rose-500 animate-spin" />
                  </div>
                  <div className="h-4 bg-slate-900 rounded-md w-1/4"></div>
                  <div className="space-y-2">
                    <div className="h-3 bg-slate-900 rounded-md w-full"></div>
                    <div className="h-3 bg-slate-900 rounded-md w-5/6"></div>
                  </div>
                  <div className="border-t border-slate-900/60 pt-2.5"></div>
                  <div className="space-y-2">
                    <div className="h-2.5 bg-slate-900 rounded-md w-2/3"></div>
                    <div className="h-2.5 bg-slate-900 rounded-md w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-slate-950/30 border border-slate-800/80 rounded-2xl p-10 text-center flex flex-col items-center justify-center max-w-md mx-auto space-y-4 my-2 group hover:border-slate-700/60 transition-all duration-300">
              <div className="w-12 h-12 bg-slate-900 border border-slate-800 rounded-full flex items-center justify-center text-rose-500 shadow-md group-hover:scale-105 group-hover:border-rose-500/20 transition-all duration-300 animate-pulse">
                <Layout className="w-5 h-5 text-rose-500" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold font-mono tracking-wider text-slate-300 uppercase">
                  {t.No_Storyboard_Scenes}
                </h4>
                <p className="text-[11px] text-slate-500 max-w-xs leading-relaxed">
                  {t.Click_button_below_to_sub}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleTriggerStoryboardSplit(true, "empty")}
                disabled={loadingStates["storyboardSplit_loading"]}
                className="bg-rose-950/40 text-rose-300 hover:text-white hover:bg-rose-600 border border-rose-500/20 hover:border-rose-500 text-[10px] font-bold px-4 py-2 rounded-lg transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingStates["storyboardSplit_loading"] ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-300" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                )}
                <span>
                  {loadingStates["storyboardSplit_loading"]
                    ? t.Processing
                    : t.Generate_Storyboard}
                </span>
              </button>
            </div>
          )
        ) : (
          <div className="relative">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <h4 className="text-[15px] font-bold text-slate-200 flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                <span className="flex items-center gap-2">
                  <span className="text-slate-300 font-medium text-sm">
                    {t.totalScenesCount.split("{count}")[0]}
                  </span>
                  <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full text-xs font-bold text-emerald-400 font-mono shadow-[0_0_10px_rgba(16,185,129,0.05)]">
                    <span>{(project.storyboard || []).length}</span>
                    {(loadingStates["storyboardSplit_loading"] ||
                      loadingStates["bulkVoiceGenerate_loading"]) && (
                      <RefreshCw className="w-3 h-3 animate-spin text-emerald-400" />
                    )}
                  </span>
                  {t.totalScenesCount.split("{count}")[1] && (
                    <span className="text-slate-300 font-medium text-sm">
                      {t.totalScenesCount.split("{count}")[1]}
                    </span>
                  )}
                </span>
              </h4>
              {project.storyboard && project.storyboard.length > 0 && (
                <button
                  type="button"
                  onClick={handleDeleteAllSceneImages}
                  disabled={
                    !!(
                      loadingStates["storyboardSplit_loading"] ||
                      loadingStates["bulkVoiceGenerate_loading"]
                    )
                  }
                  className="px-2.5 py-1.5 bg-rose-600/10 hover:bg-rose-600/20 border border-rose-500/20 hover:border-rose-500/40 text-rose-400 hover:text-rose-350 text-[10px] font-bold rounded-lg flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  title={t.deleteAllImagesBtn}
                >
                  <Trash className="w-3 h-3 text-rose-500" />
                  <span>{t.deleteAllImagesBtn}</span>
                </button>
              )}
            </div>

            <div className="relative min-h-[250px] rounded-xl overflow-hidden">
              {(loadingStates["storyboardSplit_loading"] ||
                loadingStates["bulkVoiceGenerate_loading"]) && (
                <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md rounded-xl z-20 flex flex-col items-center justify-center p-8 text-center space-y-4 border border-rose-500/10">
                  <div className="p-4 bg-rose-500/10 rounded-full border border-rose-500/20 animate-spin">
                    <Sparkles className="w-8 h-8 text-rose-500" />
                  </div>
                  <div className="space-y-1 max-w-sm">
                    <p className="font-bold text-slate-200 text-sm">
                      {loadingStates["bulkVoiceGenerate_loading"]
                        ? t.Generating_all_voices
                        : t.MULTI_STEP_SYSTEM_FLOW_Di}
                    </p>
                    <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                      {loadingStates["bulkVoiceGenerate_loading"]
                        ? t.System_is_synthesizing_te
                        : t.Mapping_detailed_timeline}
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {paginatedStoryboard.map((scene) => {
                  const urls =
                    scene.assetUrls || (scene.assetUrl ? [scene.assetUrl] : []);
                  const hasAsset = urls.length > 0;
                  const activeImgIdx =
                    activeSlideIndices[scene.id] !== undefined
                      ? activeSlideIndices[scene.id]
                      : urls.length > 0
                        ? urls.length - 1
                        : 0;
                  const displayUrl = hasAsset
                    ? urls[activeImgIdx]
                    : getSceneImageUrl(scene);

                  return (
                    <div
                      key={scene.id}
                      onClick={() => openSceneModal(scene)}
                      className="group relative aspect-[16/9] bg-slate-900 border border-slate-800/80 hover:border-rose-500/55 rounded-xl overflow-hidden shadow-md hover:shadow-2xl hover:shadow-rose-500/[0.04] transition-all duration-350 cursor-pointer hover:scale-[1.03] hover:-translate-y-1"
                    >
                      <img
                        referrerPolicy="no-referrer"
                        src={displayUrl}
                        loading="lazy"
                        alt={scene.assetName || `Scene ${scene.id}`}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />

                      {}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-slate-950/30 opacity-90 group-hover:opacity-100 transition-opacity" />

                      {}
                      {loadingStates["renderScene_" + scene.id] && (
                        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-[2px] flex flex-col items-center justify-center z-10 p-2 text-center space-y-1.5 animate-fadeIn">
                          <RefreshCw className="w-5 h-5 text-rose-500 animate-spin" />
                          <span className="text-[10px] font-mono text-rose-300 font-bold tracking-wider uppercase">
                            {t.Drawing}
                          </span>
                        </div>
                      )}

                      {}
                      <div className="absolute top-2 left-2 flex items-center gap-1.5 z-10">
                        <span className="bg-slate-950/85 backdrop-blur-md text-slate-100 text-[10px] font-bold px-2 py-0.5 rounded font-mono border border-slate-800/70 shadow">
                          #{scene.id}
                        </span>
                        <span className="bg-rose-600/90 backdrop-blur-md text-white text-[9px] font-bold px-1.5 py-0.5 rounded font-mono shadow-sm">
                          {formatCleanDuration(scene.duration)}
                          {t.s}
                        </span>
                      </div>

                      {}
                      {scene.cameraMotion &&
                        scene.cameraMotion !== "Static" && (
                          <div className="absolute top-2 right-2 z-10">
                            <span className="bg-slate-950/80 backdrop-blur-md text-slate-355 text-[9px] font-mono px-1.5 py-0.5 rounded border border-slate-800/60 shadow-sm">
                              {getMotionLabel(scene.cameraMotion)}
                            </span>
                          </div>
                        )}

                      {}
                      {!hasAsset &&
                        !loadingStates["renderScene_" + scene.id] && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center p-3 pointer-events-none z-10">
                            <div className="p-2 bg-slate-950/70 rounded-full border border-slate-800/80 mb-1 shadow-md">
                              <ImageIcon className="w-4 h-4 text-slate-400 group-hover:text-rose-400 transition-colors" />
                            </div>
                            <span className="text-slate-400 group-hover:text-rose-400 text-[10px] font-bold transition-colors shadow">
                              {t.No_AI_image}
                            </span>
                          </div>
                        )}

                      {}
                      <div className="absolute bottom-2.5 inset-x-2.5 z-10 flex flex-col justify-end text-left">
                        <p className="text-white text-[11px] font-bold leading-snug line-clamp-1 group-hover:line-clamp-2 transition-all font-sans drop-shadow-[0_1.5px_1.5px_rgba(0,0,0,0.8)]">
                          {scene.script || scene.subtitle || t.No_description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {}
              {(project.storyboard || []).length > scenesPerPage && (
                <div className="flex items-center justify-between border-t border-slate-800 pt-5 mt-6 shrink-0 z-10">
                  <button
                    type="button"
                    disabled={storyboardPage === 1}
                    onClick={(e) => {
                      e.stopPropagation();
                      setStoryboardPage((prev) => Math.max(1, prev - 1));
                    }}
                    className="bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 hover:text-slate-100 font-sans text-sm font-medium px-4 py-2 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer hover:scale-[1.02] active:scale-[0.97] disabled:hover:scale-100 flex items-center gap-2 shadow-sm"
                    title={t.Go_to_previous_page}
                  >
                    ← {t.Previous}
                  </button>
                  <div className="text-[11px] font-sans font-medium text-slate-500 bg-slate-800/30 border border-slate-800 px-3.5 py-1.5 rounded-full">
                    {t.pageIndicator
                      .replace("{current}", storyboardPage.toString())
                      .replace(
                        "{total}",
                        Math.ceil(
                          (project.storyboard || []).length / scenesPerPage,
                        ).toString(),
                      )}
                  </div>
                  <button
                    type="button"
                    disabled={
                      storyboardPage >=
                      Math.ceil(
                        (project.storyboard || []).length / scenesPerPage,
                      )
                    }
                    onClick={(e) => {
                      e.stopPropagation();
                      setStoryboardPage((prev) => prev + 1);
                    }}
                    className="bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 hover:text-slate-100 font-sans text-sm font-medium px-4 py-2 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer hover:scale-[1.02] active:scale-[0.97] disabled:hover:scale-100 flex items-center gap-2 shadow-sm"
                    title={t.Go_to_next_page}
                  >
                    {t.Next} →
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {}
        {activeSceneId &&
          (() => {
            const activeScene = (project.storyboard || []).find(
              (sc) => sc.id === activeSceneId,
            );
            if (!activeScene) return null;
            const urls =
              activeScene.assetUrls ||
              (activeScene.assetUrl ? [activeScene.assetUrl] : []);
            const hasAsset = urls.length > 0;
            const activeImgIdx =
              activeSlideIndices[activeScene.id] !== undefined
                ? activeSlideIndices[activeScene.id]
                : urls.length > 0
                  ? urls.length - 1
                  : 0;
            const displayUrl = hasAsset
              ? urls[activeImgIdx]
              : getSceneImageUrl(activeScene);

            return (
              <Modal
                isOpen={true}
                onClose={() => setActiveSceneId(null)}
                title={
                  <div className="flex items-center gap-2.5">
                    <Layers className="w-4 h-4 text-rose-500 animate-pulse" />
                    <span>
                      {t.Scene_Inspector} - {activeScene.id}
                    </span>
                    <span className="text-slate-400 font-mono text-[10px] bg-slate-800 px-2 py-0.5 rounded-full ml-2">
                      {formatCleanTime(activeScene.startTime)} -{" "}
                      {formatCleanTime(activeScene.endTime)} (
                      {formatCleanDuration(activeScene.duration)}
                      {t.s_6}
                    </span>
                  </div>
                }
              >
                <div className="flex flex-col h-full bg-slate-900">
                  <div className="p-6 overflow-y-auto grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1">
                    {}
                    <div className="space-y-4 flex flex-col">
                      <div className="space-y-1.5 text-left">
                        <label className="text-[10px] text-slate-450 uppercase font-mono font-bold block tracking-wider">
                          {t.Scene_Artwork}
                        </label>

                        <div className="aspect-[16/9] bg-slate-955 rounded-xl overflow-hidden border border-slate-800 relative flex items-center justify-center shadow-inner">
                          <img
                            referrerPolicy="no-referrer"
                            src={displayUrl}
                            alt={
                              activeScene.assetName || `Scene ${activeScene.id}`
                            }
                            className="w-full h-full object-cover"
                          />

                          {!hasAsset && (
                            <div className="absolute inset-0 bg-slate-950/20 flex flex-col items-center justify-center p-4 text-center pointer-events-none">
                              <span className="bg-rose-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow">
                                {t.No_AI_Artwork_Rendered}
                              </span>
                            </div>
                          )}

                          {}
                          {urls.length > 1 && (
                            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePrevSlide(activeScene.id, urls.length);
                                }}
                                className="w-8 h-8 bg-slate-950/90 hover:bg-slate-900/90 text-slate-200 rounded-full transition flex items-center justify-center border border-slate-800 shadow cursor-pointer"
                              >
                                <ChevronLeft className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleNextSlide(activeScene.id, urls.length);
                                }}
                                className="w-8 h-8 bg-slate-950/90 hover:bg-slate-900/90 text-slate-200 rounded-full transition flex items-center justify-center border border-slate-800 shadow cursor-pointer"
                              >
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </div>
                          )}

                          {}
                          {urls.length > 1 && (
                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-slate-950/85 text-slate-100 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono">
                              {activeImgIdx + 1} / {urls.length}
                            </div>
                          )}
                        </div>
                      </div>

                      {}
                      <div className="grid grid-cols-2 gap-2.5">
                        <button
                          type="button"
                          onClick={() =>
                            handleRenderSceneImage(
                              activeScene.id,
                              sceneEditPrompt,
                            )
                          }
                          disabled={
                            !!loadingStates["renderScene_" + activeScene.id]
                          }
                          className="flex items-center justify-center gap-1.5 text-xs font-bold text-rose-450 hover:text-white bg-rose-500/10 hover:bg-rose-600 px-3 py-2.5 rounded-xl border border-rose-500/20 cursor-pointer transition shadow-sm active:scale-95 disabled:opacity-75 disabled:cursor-not-allowed"
                          title={t.Render_AI_image_matching_}
                        >
                          {loadingStates["renderScene_" + activeScene.id] ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                          )}
                          <span>
                            {loadingStates["renderScene_" + activeScene.id]
                              ? t.Drawing
                              : urls.length > 0
                                ? t.Regen_AI
                                : t.Render_AI}
                          </span>
                        </button>

                        <label className="flex items-center justify-center gap-1.5 text-xs font-bold text-cyan-400 hover:text-white bg-cyan-500/10 hover:bg-cyan-600 px-3 py-2.5 rounded-xl border border-cyan-500/20 cursor-pointer transition shadow-sm text-center">
                          <Upload className="w-3.5 h-3.5" />
                          <span>{t.Upload_file}</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  if (typeof reader.result === "string") {
                                    handleUploadSceneImage(
                                      activeScene.id,
                                      reader.result,
                                    );
                                  }
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                      </div>

                      {hasAsset && (
                        <button
                          type="button"
                          onClick={() =>
                            handleDeleteSceneImage(activeScene.id, activeImgIdx)
                          }
                          className="w-full flex items-center justify-center gap-1.5 text-xs font-bold text-red-500 hover:text-white bg-red-500/10 hover:bg-red-650 px-3 py-2 rounded-xl border border-red-500/20 transition cursor-pointer"
                        >
                          <Trash className="w-3.5 h-3.5" />
                          <span>{t.Delete_Image}</span>
                        </button>
                      )}

                      {}
                      <div className="bg-slate-955 p-3 rounded-xl border border-slate-800 space-y-1.5 text-xs text-slate-400 text-left">
                        <div className="flex justify-between">
                          <span className="font-mono text-slate-500">
                            {t.Duration}:
                          </span>
                          <span className="font-bold text-slate-200">
                            {formatCleanDuration(activeScene.duration)}
                            {t.s}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-mono text-slate-500">
                            {t.Camera_motion}:
                          </span>
                          <span className="font-bold text-slate-200">
                            {getMotionLabel(
                              activeScene.cameraMotion || "Static",
                            )}
                          </span>
                        </div>
                        {activeScene.effects && (
                          <div className="flex justify-between">
                            <span className="font-mono text-slate-500">
                              {t.FX}:
                            </span>
                            <span className="font-bold text-slate-200">
                              {activeScene.effects}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {}
                    <div className="space-y-4 text-left">
                      {}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] text-slate-450 uppercase font-mono font-bold block tracking-wider">
                            {t.Narration_text}
                          </label>
                          {sceneEditScript && (
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(sceneEditScript);
                                setInfoMsg(t.copiedScript);
                                setTimeout(() => setInfoMsg(""), 3000);
                              }}
                              title="Copy lời thuyết minh"
                              className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-slate-100 text-[9px] font-bold rounded flex items-center gap-1 transition-all cursor-pointer border border-slate-700/60"
                            >
                              <Copy className="w-2.5 h-2.5" />
                              <span>{t.Copy}</span>
                            </button>
                          )}
                        </div>
                        <textarea
                          value={sceneEditScript}
                          rows={3}
                          onChange={(e) => setSceneEditScript(e.target.value)}
                          className="w-full bg-slate-955 border border-slate-800 text-slate-200 text-xs p-3 rounded-xl focus:outline-none focus:border-rose-500 transition-all duration-200"
                        />
                      </div>

                      {}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] text-slate-450 uppercase font-mono font-bold block tracking-wider">
                            {t.Subtitle}
                          </label>
                          {sceneEditSubtitle && (
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(
                                  sceneEditSubtitle,
                                );
                                setInfoMsg(t.copiedSubtitle);
                                setTimeout(() => setInfoMsg(""), 3000);
                              }}
                              title="Copy phụ đề"
                              className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-slate-100 text-[9px] font-bold rounded flex items-center gap-1 transition-all cursor-pointer border border-slate-700/60"
                            >
                              <Copy className="w-2.5 h-2.5" />
                              <span>{t.Copy}</span>
                            </button>
                          )}
                        </div>
                        <input
                          type="text"
                          value={sceneEditSubtitle}
                          onChange={(e) => setSceneEditSubtitle(e.target.value)}
                          className="w-full bg-slate-955 border border-slate-800 text-slate-200 text-xs p-3 rounded-xl focus:outline-none focus:border-rose-500 transition-all duration-200"
                        />
                      </div>

                      {}
                      <div className="bg-slate-955 border border-slate-800 rounded-xl p-4 space-y-4 shadow-inner">
                        <div className="flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() =>
                              setShowPromptGeneratorPanel(
                                !showPromptGeneratorPanel,
                              )
                            }
                            className="flex items-center gap-2 text-rose-450 hover:text-rose-400 font-bold text-xs cursor-pointer transition-colors"
                          >
                            <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                            <span>{t.Designer}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setShowPromptGeneratorPanel(
                                !showPromptGeneratorPanel,
                              )
                            }
                            className="text-[11px] text-slate-400 hover:text-slate-100 cursor-pointer transition-colors font-mono"
                          >
                            {showPromptGeneratorPanel ? t.Hide : t.Show}
                          </button>
                        </div>

                        {showPromptGeneratorPanel && (
                          <div className="pt-3 border-t border-slate-800 space-y-4 text-left animate-fadeIn max-h-[220px] overflow-y-auto pr-1">
                            {}
                            <div className="space-y-1.5">
                              <label className="text-[10px] text-slate-450 uppercase font-mono block font-bold">
                                {t.txt_1_Environment_Setting}
                              </label>
                              <input
                                type="text"
                                placeholder={t.misty_pine_forest_vintage}
                                value={promptSetting}
                                onChange={(e) =>
                                  setPromptSetting(e.target.value)
                                }
                                className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs p-2.5 rounded-xl focus:outline-none focus:border-rose-500/50 transition-all duration-200"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[10px] text-slate-450 uppercase font-mono block font-bold">
                                {t.txt_2_Time_of_Day_Lighting}
                              </label>
                              <input
                                type="text"
                                placeholder={t.warm_golden_sunset_low_ke}
                                value={promptTime}
                                onChange={(e) => setPromptTime(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs p-2.5 rounded-xl focus:outline-none focus:border-rose-500/50 transition-all duration-200"
                              />
                            </div>

                            {}
                            <div className="space-y-1.5">
                              <label className="text-[10px] text-slate-450 uppercase font-mono block font-bold">
                                {t.txt_3_Character_details}
                              </label>
                              <input
                                type="text"
                                placeholder={t.old_wise_magician}
                                value={promptCharacter}
                                onChange={(e) =>
                                  setPromptCharacter(e.target.value)
                                }
                                className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs p-2.5 rounded-xl focus:outline-none focus:border-rose-500/50 transition-all duration-200"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[10px] text-slate-450 uppercase font-mono block font-bold">
                                {t.txt_4_Costume_Attire}
                              </label>
                              <input
                                type="text"
                                placeholder={t.rough_leather_boots}
                                value={promptCostume}
                                onChange={(e) =>
                                  setPromptCostume(e.target.value)
                                }
                                className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs p-2.5 rounded-xl focus:outline-none focus:border-rose-500/50 transition-all duration-200"
                              />
                            </div>

                            {}
                            <div className="space-y-1.5">
                              <label className="text-[10px] text-slate-450 uppercase font-mono block font-bold">
                                {t.txt_5_Camera_Angle}
                              </label>
                              <input
                                type="text"
                                placeholder={t.cinematic_close_up_portra}
                                value={promptCameraAngle}
                                onChange={(e) =>
                                  setPromptCameraAngle(e.target.value)
                                }
                                className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs p-2.5 rounded-xl focus:outline-none focus:border-rose-500/50 transition-all duration-200"
                              />
                            </div>

                            <div className="flex justify-end pt-2">
                              <button
                                type="button"
                                onClick={handleGenerateDetailedPrompt}
                                disabled={isGeneratingDetailedPrompt}
                                className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-500 disabled:bg-slate-800 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow cursor-pointer active:scale-95"
                              >
                                {isGeneratingDetailedPrompt ? (
                                  <>
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                    <span>{t.Writing}</span>
                                  </>
                                ) : (
                                  <>
                                    <Sparkles className="w-3.5 h-3.5 text-amber-200 animate-pulse" />
                                    <span>{t.Optimize_Prompt}</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] text-slate-450 uppercase font-mono font-bold block tracking-wider">
                            {t.imagePrompt}
                          </label>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={handleGenerateDetailedPrompt}
                              disabled={isGeneratingDetailedPrompt}
                              title={t.regenerate}
                              className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-slate-100 disabled:opacity-50 text-[9px] font-bold rounded flex items-center gap-1 transition-all cursor-pointer border border-slate-700/60"
                            >
                              {isGeneratingDetailedPrompt ? (
                                <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                              ) : (
                                <RefreshCw className="w-2.5 h-2.5" />
                              )}
                              <span>{t.regenerate}</span>
                            </button>

                            {sceneEditPrompt && (
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(
                                    sceneEditPrompt,
                                  );
                                  setInfoMsg(t.copiedPrompt);
                                  setTimeout(() => setInfoMsg(""), 3000);
                                }}
                                title="Copy mô tả hình ảnh AI"
                                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-slate-100 text-[9px] font-bold rounded flex items-center gap-1 transition-all cursor-pointer border border-slate-700/60"
                              >
                                <Copy className="w-2.5 h-2.5" />
                                <span>{t.Copy}</span>
                              </button>
                            )}
                          </div>
                        </div>
                        <textarea
                          value={sceneEditPrompt}
                          rows={4}
                          onChange={(e) => setSceneEditPrompt(e.target.value)}
                          className="w-full bg-slate-955 border border-slate-800 text-slate-200 text-xs p-3 rounded-xl focus:outline-none focus:border-rose-500 transition-all duration-200"
                        />
                      </div>

                      {}
                      <div className="grid grid-cols-3 gap-2.5">
                        <div className="space-y-1.5 text-left">
                          <label className="text-[9px] text-slate-450 uppercase font-mono font-bold block tracking-wider">
                            {t.cameraMotion}
                          </label>
                          <select
                            value={sceneEditMotion}
                            onChange={(e) => setSceneEditMotion(e.target.value)}
                            className="w-full bg-slate-955 border border-slate-800 text-slate-200 text-xs p-2.5 rounded-xl outline-none"
                          >
                            {[
                              "Zoom In",
                              "Zoom Out",
                              "Pan Left",
                              "Pan Right",
                              "Static",
                            ].map((motion) => {
                              return (
                                <option
                                  key={motion}
                                  value={motion}
                                  className="bg-slate-900 text-slate-200"
                                >
                                  {currentLang === "vi"
                                    ? motionLabels[motion] || motion
                                    : motion}
                                </option>
                              );
                            })}
                          </select>
                        </div>

                        <div className="space-y-1.5 text-left">
                          <label className="text-[9px] text-slate-450 uppercase font-mono font-bold block tracking-wider">
                            {t.fx}
                          </label>
                          <input
                            type="text"
                            placeholder={t.E_g_Blur}
                            value={sceneEditFx}
                            onChange={(e) => setSceneEditFx(e.target.value)}
                            className="w-full bg-slate-955 border border-slate-800 text-slate-200 text-xs p-2.5 rounded-xl outline-none"
                          />
                        </div>

                        <div className="space-y-1.5 text-left">
                          <label className="text-[9px] text-slate-450 uppercase font-mono font-bold block tracking-wider">
                            {t.transition}
                          </label>
                          <input
                            type="text"
                            placeholder={t.E_g_Fade}
                            value={sceneEditTransition}
                            onChange={(e) =>
                              setSceneEditTransition(e.target.value)
                            }
                            className="w-full bg-slate-955 border border-slate-800 text-slate-200 text-xs p-2.5 rounded-xl outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  {}
                  <div className="bg-slate-900/50 px-6 py-4.5 border-t border-slate-800 flex items-center justify-end gap-3.5 shrink-0">
                    <Button
                      variant="ghost"
                      onClick={() => setActiveSceneId(null)}
                      className="px-4.5 py-2.5"
                    >
                      {t.Cancel}
                    </Button>
                    <Button
                      variant="primary"
                      onClick={handleSaveSceneEdits}
                      className="px-5 py-2.5 shadow-lg shadow-rose-600/15"
                    >
                      {t.Save_Changes}
                    </Button>
                  </div>
                </div>
              </Modal>
            );
          })()}

        <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={() => setCurrentStep(WizardStep.SourceInput)}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-xs px-5 py-3 rounded-lg transition-all cursor-pointer shadow"
          >
            <ArrowLeft className="w-4 h-4" />
            {t.Back}
          </button>
          <button
            onClick={() => setCurrentStep(WizardStep.AssetManager)}
            className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs px-5 py-3 rounded-lg transition-all cursor-pointer shadow"
          >
            {t.Continue}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  );
}
