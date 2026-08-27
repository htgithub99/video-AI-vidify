import React from "react";
import _ from "lodash";
import { Settings2, Layers, ChevronDown, Check, Clock, Layout, Sparkles, FileText, Copy, ShieldCheck, ArrowRight, Sliders, Info } from "lucide-react";
import { cn } from "../../lib/utils";
import { genreLabels, audLabels, styleLabels, GENRE_OPTION_GROUPS, AUDIENCE_OPTIONS, WRITING_STYLE_OPTIONS, HOOK_STRATEGY_OPTIONS, HOOK_POSITION_OPTIONS, DURATION_OPTIONS, PROJECT_LANGUAGE_OPTIONS, SPLIT_STRATEGY_OPTIONS, SplitStrategy } from "../../constants";
import { Button } from "../ui/Button";
import { Tooltip } from "../ui/Tooltip";
import { PipelineWizardState } from "./usePipelineWizard";
import { WizardStep, ProjectInputType, ProjectLanguage } from "../../types";
import { AUTO_GENERATE_TEXTS } from "../../constants/texts";

const STEP0_TEXTS = { TOOLTIP_INPUT_METHOD: "Chọn phương thức cung cấp đầu vào: Nhập kịch bản có sẵn hoặc mô tả ý tưởng để AI tự viết kịch bản.", TOOLTIP_CONFIG_DETAIL: "Tuỳ chỉnh cấu hình chi tiết để định hướng cho AI khi viết kịch bản và sinh hình ảnh.", TOOLTIP_AUTO_GENERATE: "Bắt đầu phân tích văn bản đầu vào và tự động tạo ra một kịch bản Video hoàn chỉnh bằng AI.", CHAPTER_PLACEHOLDER: "Nhập tên chương...", } as const;

interface SettingSliderProps { label: string; value: number; displayValue: string; min: number; max: number; colorClass: string; accentClass: string; onChange: (val: number) => void; }

const SettingSlider: React.FC<SettingSliderProps> = ({ label, value, displayValue, min, max, colorClass, accentClass, onChange }) => (
  <div className="bg-slate-950/45 border border-slate-900/60 p-3.5 rounded-xl space-y-2.5 shadow-inner hover:border-slate-800 transition-all">
    <div className="flex items-center justify-between text-[10px] font-mono font-bold uppercase tracking-wider">
      <span className="text-slate-450">{label}</span>
      <span className={cn("px-2 py-0.5 rounded-full border", colorClass)}>{displayValue}</span>
    </div>
    <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(_.toNumber(e.target.value))} className={cn("w-full h-1 bg-slate-900 hover:bg-slate-850 rounded-lg appearance-none cursor-pointer focus:outline-none", accentClass)} />
  </div>
);

export default function PipelineStep0(props: PipelineWizardState) {
  const { t, project, setProject, setCurrentStep, loadingStates, setInfoMsg, handleProcessInputAndConfig, hookStrategy, setHookStrategy, hookDuration, setHookDuration, hookPosition, setHookPosition, handleAutoGenerateVideo } = props;

  const currentInputType = project.input?.type || ProjectInputType.Script;
  const isInputEmpty = _.isEmpty(_.trim(project.input?.content));
  const isAutoGenerating = !!loadingStates["autoGenerateAll"];
  const isProcessingInput = !!loadingStates["processInput"];

  const wordCount = _.filter(_.split(_.trim(project.scriptRewritten || ""), /\s+/), Boolean).length;
  const charCount = _.size(project.scriptRewritten || "");
  const estimatedMinutes = Math.ceil(wordCount / 130);

  return (
    <div className="bg-gradient-to-b from-slate-900/90 to-slate-950/95 border border-slate-800/85 rounded-xl p-6 space-y-6 shadow-2xl relative overflow-visible">
      <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/[0.03] rounded-full blur-3xl pointer-events-none" />

      <div className="border-b border-slate-800 pb-4 relative z-20">
        <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2 relative z-20">
          <Tooltip content={STEP0_TEXTS.TOOLTIP_INPUT_METHOD} position="bottom" align="start">
            <span className="flex items-center gap-2 cursor-help">
              <Settings2 className="w-5 h-5 text-rose-500" />
              {t.stepInput}
              <Info className="w-4 h-4 text-slate-500" />
            </span>
          </Tooltip>
        </h3>
        <p className="text-slate-400 text-xs mt-1 relative z-10">{t.Select_your_story_materia}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-5 h-full justify-stretch">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 block font-mono uppercase tracking-wider">{t.sourceType}</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button
                type="button"
                variant="unstyled"
                onClick={() =>
                  setProject((prev) => ({
                    ...prev,
                    input: {
                      type: ProjectInputType.Script,
                      content: prev.input?.content || "",
                    },
                  }))
                }
                className={cn("p-3.5 rounded-2xl border-2 text-left cursor-pointer transition-all duration-300 flex items-center justify-between min-h-[58px] w-full", _.isEqual(currentInputType, ProjectInputType.Script) ? "bg-rose-500/15 border-rose-500/80 text-rose-500 font-black shadow-sm ring-1 ring-rose-500/30" : "bg-slate-900/90 border-slate-800/90 text-slate-400 hover:border-slate-700 hover:text-slate-200 font-bold hover:bg-slate-850")}>
                <div className="flex items-center gap-3">
                  <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors", _.isEqual(currentInputType, ProjectInputType.Script) ? "bg-rose-500/20 text-rose-500" : "bg-slate-800 text-slate-400")}>
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-xs block uppercase tracking-wider">{t.originalScript}</span>
                    <span className="text-[10px] font-medium opacity-80 block">{t.originalScriptDesc}</span>
                  </div>
                </div>
                {_.isEqual(currentInputType, ProjectInputType.Script) && <Check className="w-4 h-4 text-rose-500 stroke-[3] shrink-0" />}
              </Button>

              <Button
                type="button"
                variant="unstyled"
                onClick={() =>
                  setProject((prev) => ({
                    ...prev,
                    input: {
                      type: ProjectInputType.Idea,
                      content: prev.input?.content || "",
                    },
                  }))
                }
                className={cn("p-3.5 rounded-2xl border-2 text-left cursor-pointer transition-all duration-300 flex items-center justify-between min-h-[58px] w-full", _.isEqual(currentInputType, ProjectInputType.Idea) ? "bg-rose-500/15 border-rose-500/80 text-rose-500 font-black shadow-sm ring-1 ring-rose-500/30" : "bg-slate-900/90 border-slate-800/90 text-slate-400 hover:border-slate-700 hover:text-slate-200 font-bold hover:bg-slate-850")}>
                <div className="flex items-center gap-3">
                  <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors", _.isEqual(currentInputType, ProjectInputType.Idea) ? "bg-amber-500/20 text-amber-500" : "bg-slate-800 text-slate-400")}>
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-xs block uppercase tracking-wider">{t.storyIdea}</span>
                    <span className="text-[10px] font-medium opacity-80 block">{t.storyIdeaDesc}</span>
                  </div>
                </div>
                {_.isEqual(currentInputType, ProjectInputType.Idea) && <Check className="w-4 h-4 text-rose-500 stroke-[3] shrink-0" />}
              </Button>
            </div>
          </div>

          <div className="space-y-1.5 flex-1 flex flex-col h-full min-h-[350px]">
            <label className="text-xs font-semibold text-slate-300 block font-mono uppercase">{t.N_i_dung_c_t_truy_n}</label>
            <textarea
              value={project.input?.content || ""}
              onChange={(e) =>
                setProject((prev) => ({
                  ...prev,
                  input: {
                    type: prev.input?.type || ProjectInputType.Script,
                    content: e.target.value,
                  },
                }))
              }
              placeholder={t.Nh_p_n_i_dung_k_ch_b_n_nh}
              className="w-full flex-1 bg-slate-950 border border-slate-800 focus:border-rose-500 text-slate-100 p-4 rounded-xl text-sm ring-none focus:outline-none transition-all font-sans leading-relaxed resize-none min-h-[250px]"
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-5 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl pointer-events-none" />
            <div className="border-b border-slate-800 pb-3 flex items-center gap-2 relative z-20">
              <Tooltip content={STEP0_TEXTS.TOOLTIP_CONFIG_DETAIL} position="bottom" align="start">
                <span className="flex items-center gap-2 cursor-help">
                  <Settings2 className="w-4 h-4 text-rose-500 shrink-0" />
                  <h4 className="font-bold text-slate-100 text-xs font-mono uppercase tracking-wider">
                    {t.C_u_h_nh_K_ch_b_n} <Info className="w-3 h-3 text-slate-500" />
                  </h4>
                </span>
              </Tooltip>
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block">{t.Th_lo_i_video}</span>
              <div className="relative flex items-center bg-slate-950/60 border border-slate-800/80 rounded-xl focus-within:border-rose-500/80 focus-within:ring-1 focus-within:ring-rose-500/20 px-3 py-2.5 transition-all shadow-sm">
                <Layers className="w-4 h-4 text-slate-450 mr-2.5 shrink-0" />
                <select
                  value={project.config.genre}
                  onChange={(e) =>
                    setProject((prev) => ({
                      ...prev,
                      config: { ...prev.config, genre: e.target.value },
                    }))
                  }
                  className="flex-1 bg-slate-900 border-none text-slate-200 text-xs font-semibold outline-none cursor-pointer appearance-none pr-6">
                  {_.map(GENRE_OPTION_GROUPS, (group) => (
                    <optgroup key={group.label} label={group.label} className="bg-slate-950 text-slate-400">
                      {_.map(group.options, (genre) => (
                        <option key={genre} value={genre} className="bg-slate-950 text-slate-300">
                          {genreLabels[genre as keyof typeof genreLabels] || genre}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 text-slate-500 w-4 h-4" />
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block">{t.Ng_n_ng_u_ra}</span>
              <div className="relative flex items-center bg-slate-950/60 border border-slate-800/80 rounded-xl focus-within:border-rose-500/80 focus-within:ring-1 focus-within:ring-rose-500/20 px-3 py-2.5 transition-all shadow-sm">
                <Check className="w-4 h-4 text-slate-450 mr-2.5 shrink-0" />
                <select
                  value={project.config.language}
                  onChange={(e) =>
                    setProject((prev) => ({
                      ...prev,
                      config: { ...prev.config, language: e.target.value as ProjectLanguage },
                    }))
                  }
                  className="flex-1 bg-slate-900 border-none text-slate-200 text-xs font-semibold outline-none cursor-pointer appearance-none pr-6">
                  {_.map(PROJECT_LANGUAGE_OPTIONS, (opt) => (
                    <option key={opt.value} value={opt.value} className="bg-slate-950 text-slate-300">
                      {_.get(t, opt.labelKey, opt.value)}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 text-slate-500 w-4 h-4" />
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block">{t.C_u_h_nh_S_l_ng_t_Th_i_l_}</span>
              <div className="relative flex items-center bg-slate-950/60 border border-slate-800/80 rounded-xl focus-within:border-rose-500/80 focus-within:ring-1 focus-within:ring-rose-500/20 px-3 py-2.5 transition-all shadow-sm">
                <Clock className="w-4 h-4 text-slate-450 mr-2.5 shrink-0" />
                <select
                  value={project.config.duration}
                  onChange={(e) =>
                    setProject((prev) => ({
                      ...prev,
                      config: { ...prev.config, duration: e.target.value },
                    }))
                  }
                  className="flex-1 bg-slate-900 border-none text-slate-200 text-xs font-semibold outline-none cursor-pointer appearance-none pr-6">
                  {_.map(DURATION_OPTIONS, (item) => (
                    <option key={item.val} value={item.val} className="bg-slate-950 text-slate-300">
                      {item.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 text-slate-500 w-4 h-4" />
              </div>
              <p className="text-[10px] text-slate-500 leading-normal pl-1">{t.AI_s_bu_c_ph_i_m_r_ng_n_i}</p>
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block">{t.txt_2_Split_Density}</span>
              <div className="relative flex items-center bg-slate-950/60 border border-slate-800/80 rounded-xl focus-within:border-rose-500/80 focus-within:ring-1 focus-within:ring-rose-500/20 px-3 py-2.5 transition-all shadow-sm">
                <Sliders className="w-4 h-4 text-slate-450 mr-2.5 shrink-0" />
                <select
                  value={project.config.splitStrategy || SplitStrategy.MIXED_SENTENCES}
                  onChange={(e) =>
                    setProject((prev) => ({
                      ...prev,
                      config: { ...prev.config, splitStrategy: e.target.value },
                    }))
                  }
                  className="flex-1 bg-slate-900 border-none text-slate-200 text-xs font-semibold outline-none cursor-pointer appearance-none pr-6 font-sans w-full">
                  {_.map(SPLIT_STRATEGY_OPTIONS, (opt) => (
                    <option key={opt.value} value={opt.value} title={_.get(t, opt.titleKey, opt.value)} className={cn("bg-slate-950", opt.className)}>
                      {_.get(t, opt.labelKey, opt.value)}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 text-slate-500 w-4 h-4" />
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block">{t.Kh_n_gi_m_c_ti_u}</span>
              <div className="relative flex items-center bg-slate-950/60 border border-slate-800/80 rounded-xl focus-within:border-rose-500/80 focus-within:ring-1 focus-within:ring-rose-500/20 px-3 py-2.5 transition-all shadow-sm">
                <Layout className="w-4 h-4 text-slate-450 mr-2.5 shrink-0" />
                <select
                  value={project.config.audience}
                  onChange={(e) =>
                    setProject((prev) => ({
                      ...prev,
                      config: { ...prev.config, audience: e.target.value },
                    }))
                  }
                  className="flex-1 bg-slate-900 border-none text-slate-200 text-xs font-semibold outline-none cursor-pointer appearance-none pr-6">
                  {_.map(AUDIENCE_OPTIONS, (aud) => (
                    <option key={aud} value={aud} className="bg-slate-950 text-slate-300">
                      {audLabels[aud as keyof typeof audLabels] || aud}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 text-slate-500 w-4 h-4" />
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] text-slate-450 font-mono font-bold uppercase tracking-wider block">{t.Phong_c_ch_h_nh_v_n}</span>
              <div className="relative flex items-center bg-slate-950/60 border border-slate-800/80 rounded-xl focus-within:border-rose-500/80 focus-within:ring-1 focus-within:ring-rose-500/20 px-3 py-2.5 transition-all shadow-sm">
                <Sparkles className="w-4 h-4 text-slate-450 mr-2.5 shrink-0" />
                <select
                  value={project.config.writingStyle}
                  onChange={(e) =>
                    setProject((prev) => ({
                      ...prev,
                      config: { ...prev.config, writingStyle: e.target.value },
                    }))
                  }
                  className="flex-1 bg-slate-900 border-none text-slate-200 text-xs font-semibold outline-none cursor-pointer appearance-none pr-6">
                  {_.map(WRITING_STYLE_OPTIONS, (style) => (
                    <option key={style} value={style} className="bg-slate-950 text-slate-300">
                      {styleLabels[style as keyof typeof styleLabels] || style}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 text-slate-500 w-4 h-4" />
              </div>
            </div>

            <SettingSlider
              label={t.C_ng_Vi_t_l_i}
              value={project.config.rewriteLevel}
              displayValue={`${project.config.rewriteLevel}%`}
              min={0}
              max={100}
              colorClass="text-rose-450 bg-rose-500/10 border-rose-500/10"
              accentClass="accent-rose-600"
              onChange={(val) =>
                setProject((prev) => ({
                  ...prev,
                  config: { ...prev.config, rewriteLevel: val },
                }))
              }
            />

            <SettingSlider
              label={t.Gi_m_tr_ng_l_p}
              value={project.config.similarityReduction}
              displayValue={`${project.config.similarityReduction}/10`}
              min={1}
              max={10}
              colorClass="text-amber-450 bg-amber-500/10 border-amber-500/10"
              accentClass="accent-amber-500"
              onChange={(val) =>
                setProject((prev) => ({
                  ...prev,
                  config: { ...prev.config, similarityReduction: val },
                }))
              }
            />

            <SettingSlider
              label={t.s_ng_t_o}
              value={project.config.creativityLevel}
              displayValue={`${project.config.creativityLevel}/10`}
              min={1}
              max={10}
              colorClass="text-rose-450 bg-rose-500/10 border-rose-500/10"
              accentClass="accent-rose-600"
              onChange={(val) =>
                setProject((prev) => ({
                  ...prev,
                  config: { ...prev.config, creativityLevel: val },
                }))
              }
            />

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-4">
              <div className="flex flex-col max-w-[70%]">
                <span className="text-[11px] font-bold text-slate-200">{t.X_c_th_c_th_ng_tin_Fact_c}</span>
                <span className="text-[10px] text-slate-500 leading-normal mt-0.5">{t.T_ng_ph_n_t_ch_v_x_c_minh}</span>
              </div>

              <Button
                variant="unstyled"
                type="button"
                onClick={() =>
                  setProject((prev) => ({
                    ...prev,
                    config: {
                      ...prev.config,
                      factCheck: !prev.config.factCheck,
                    },
                  }))
                }
                className={cn("w-11 h-6 flex items-center justify-start rounded-full p-0.5 transition-colors cursor-pointer outline-none focus:ring-1 focus:ring-rose-500/20 shadow-none hover:bg-slate-900 shrink-0", project.config.factCheck ? "bg-rose-600 hover:bg-rose-600" : "bg-slate-800 hover:bg-slate-850")}>
                <div className={cn("bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-200 shrink-0", project.config.factCheck ? "translate-x-5" : "translate-x-0")} />
              </Button>
            </div>

            <div className="pt-4 border-t border-slate-800 space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-rose-500 shrink-0" />
                <h5 className="font-bold text-slate-200 text-xs font-mono uppercase tracking-wider">{t.hookConfigTitle}</h5>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block">{t.hookType}</span>
                <div className="relative flex items-center bg-slate-955 border border-slate-800 rounded-xl focus-within:border-rose-500/80 px-3 py-2.5 transition-all shadow-sm">
                  <Sparkles className="w-4 h-4 text-slate-450 mr-2.5 shrink-0" />
                  <select value={hookStrategy} onChange={(e) => setHookStrategy(e.target.value)} className="flex-1 bg-slate-900 border-none text-slate-200 text-xs font-semibold outline-none cursor-pointer appearance-none pr-6">
                    {_.map(HOOK_STRATEGY_OPTIONS, (opt) => (
                      <option key={opt.value} value={opt.value} className="bg-slate-950 text-slate-300">
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 text-slate-500 w-4 h-4" />
                </div>
              </div>

              <SettingSlider label={t.hookDuration} value={hookDuration} displayValue={`${hookDuration}s`} min={3} max={30} colorClass="text-rose-450 bg-rose-500/10 border-rose-500/10" accentClass="accent-rose-600" onChange={setHookDuration} />

              <div className="space-y-1.5">
                <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block">{t.hookPositions}</span>
                <div className="relative flex items-center bg-slate-955 border border-slate-800 rounded-xl focus-within:border-rose-500/80 px-3 py-2.5 transition-all shadow-sm">
                  <Layout className="w-4 h-4 text-slate-450 mr-2.5 shrink-0" />
                  <select value={hookPosition} onChange={(e) => setHookPosition(e.target.value as any)} className="flex-1 bg-slate-900 border-none text-slate-200 text-xs font-semibold outline-none cursor-pointer appearance-none pr-6">
                    {_.map(HOOK_POSITION_OPTIONS, (opt) => (
                      <option key={opt.value} value={opt.value} className="bg-slate-950 text-slate-300">
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 text-slate-500 w-4 h-4" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-800 flex items-center justify-end relative z-20 gap-3">
        <Tooltip content={STEP0_TEXTS.TOOLTIP_AUTO_GENERATE} position="top" align="end">
          <Button type="button" variant="secondary" size="lg" onClick={() => handleAutoGenerateVideo()} disabled={isInputEmpty || isAutoGenerating || isProcessingInput} isLoading={isAutoGenerating} className="px-6 py-3.5 bg-gradient-to-r from-emerald-600/20 to-emerald-500/20 hover:from-emerald-600/30 hover:to-emerald-500/30 border border-emerald-500/30 text-emerald-400 hover:text-emerald-300">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>{AUTO_GENERATE_TEXTS.BTN_AUTO}</span>
          </Button>
        </Tooltip>

        <Tooltip content={STEP0_TEXTS.TOOLTIP_AUTO_GENERATE} position="top" align="end">
          <Button type="button" variant="primary" size="lg" onClick={() => handleProcessInputAndConfig(true)} disabled={isInputEmpty || isAutoGenerating || isProcessingInput} isLoading={isProcessingInput && !isAutoGenerating} title={t.Ph_n_t_ch_t_ng_v_bi_n_so_} className="px-6 py-3.5">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>{t.Generate_Script}</span>
          </Button>
        </Tooltip>
      </div>

      {(project.scriptRewritten || isProcessingInput) && (
        <div className="pt-6 border-t border-slate-800 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <FileText className="w-5 h-5 text-rose-500" />
              {t.enhancedScript}
            </h3>
          </div>

          <div className={cn("grid grid-cols-1 lg:grid-cols-3 gap-6 lg:items-stretch relative", isProcessingInput && !project.scriptRewritten ? "min-h-[460px]" : "")}>
            <div className="lg:col-span-2 space-y-3 flex flex-col h-full">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold font-mono text-slate-400">{t.FULL_VERBOSE_SCRIPT}</span>
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => {
                      if (project.scriptRewritten) {
                        navigator.clipboard.writeText(project.scriptRewritten);
                        setInfoMsg(t.Copied_script);
                      }
                    }}
                    className="text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-slate-900 transition-colors shadow-none"
                    title={t.Copy}>
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                </div>
                <div className="flex gap-4 text-[10px] font-mono text-slate-500">
                  <span>
                    {t.Words}: <strong className="text-slate-300">{wordCount}</strong>
                  </span>
                  <span>
                    {t.Chars}: <strong className="text-slate-300">{charCount}</strong>
                  </span>
                  <span>
                    {t.Est_Time}:{" "}
                    <strong className="text-rose-400">
                      ~{estimatedMinutes} {t.min}
                    </strong>
                  </span>
                </div>
              </div>

              {isProcessingInput ? (
                <div className="w-full flex-1 bg-slate-955 border border-slate-800/80 rounded-xl p-6 flex flex-col justify-between min-h-[380px] lg:min-h-[440px] h-full relative overflow-hidden animate-pulse">
                  <div className="space-y-3">
                    <div className="h-4 bg-slate-900 rounded w-3/4 animate-pulse" />
                    <div className="h-4 bg-slate-900 rounded w-5/6 animate-pulse" />
                    <div className="h-4 bg-slate-900 rounded w-2/3 animate-pulse" />
                    <div className="h-4 bg-slate-900 rounded w-full animate-pulse" />
                    <div className="h-4 bg-slate-900 rounded w-4/5 animate-pulse" />
                  </div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-slate-950/30 backdrop-blur-[1px] z-10">
                    <div className="p-3 bg-rose-500/10 rounded-full border border-rose-500/20 mb-3 animate-bounce">
                      <Sparkles className="w-5 h-5 text-rose-500 animate-pulse" />
                    </div>
                    <p className="font-bold text-slate-200 text-xs text-center font-mono">{t.ang_so_n_k_ch_b_n}</p>
                    <p className="text-[10px] text-slate-400 mt-1 max-w-[200px] text-center leading-relaxed font-sans">{t.M_h_nh_AI_ang_ki_n_t_o_k_}</p>
                  </div>
                  <div className="space-y-3">
                    <div className="h-4 bg-slate-900 rounded w-1/2 animate-pulse" />
                    <div className="h-4 bg-slate-900 rounded w-4/5 animate-pulse" />
                  </div>
                </div>
              ) : (
                <textarea
                  value={project.scriptRewritten || ""}
                  onChange={(e) =>
                    setProject((prev) => ({
                      ...prev,
                      scriptRewritten: e.target.value,
                    }))
                  }
                  className="w-full flex-1 bg-slate-955 border border-slate-800 focus:border-rose-500 text-slate-100 p-4 rounded-xl text-sm leading-relaxed focus:outline-none transition-all font-sans min-h-[380px] lg:min-h-[440px] h-full"
                />
              )}
            </div>

            <div className="space-y-4 flex flex-col h-full">
              {project.config.factCheck && (
                <div className="bg-slate-955 border border-slate-800/80 p-4 rounded-xl space-y-2 shrink-0">
                  <span className="text-[10px] bg-rose-500/10 text-rose-350 font-bold px-2 py-0.5 rounded border border-rose-500/20 font-mono inline-flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {t.Fact_Check_Insight}
                  </span>
                  {isProcessingInput ? (
                    <div className="space-y-1.5 animate-pulse py-1">
                      <div className="h-3 bg-slate-900 rounded w-5/6" />
                      <div className="h-3 bg-slate-900 rounded w-3/4" />
                    </div>
                  ) : (
                    <p className="text-slate-400 text-xs leading-relaxed italic max-h-[140px] overflow-y-auto">{project.factCheckNotes || t.Analyzing_historical_data}</p>
                  )}
                </div>
              )}

              <div className="bg-slate-955 border border-slate-800 p-4 rounded-xl space-y-3 flex-1 flex flex-col min-h-[260px]">
                <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider font-bold shrink-0">{t.Chapters_Script_Outline}</span>
                <div className="space-y-2.5 flex-1 overflow-y-auto pr-1 max-h-[350px] lg:max-h-[500px]">
                  {isProcessingInput ? (
                    <div className="space-y-3 py-1">
                      {_.map([1, 2, 3], (num) => (
                        <div key={num} className="bg-slate-900 border border-slate-800/50 p-2.5 rounded-lg space-y-2 animate-pulse">
                          <div className="h-2.5 bg-slate-800 rounded w-1/4" />
                          <div className="h-3 bg-slate-800 rounded w-1/2" />
                          <div className="h-2.5 bg-slate-800 rounded w-5/6" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    _.map(project.chapters || [], (ch) => (
                      <div key={ch.id} className="bg-slate-900 border border-slate-800/60 p-3.5 rounded-xl space-y-2 shadow-sm hover:border-rose-500/20 transition-all group">
                        <span className="inline-flex items-center text-[9px] text-rose-500 font-mono font-bold uppercase tracking-wider bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20 shadow-inner">
                          {t.Chapter}: {ch.id}
                        </span>
                        <input
                          type="text"
                          value={ch.title}
                          onChange={(e) => {
                            const val = e.target.value;
                            setProject((prev) => ({
                              ...prev,
                              chapters: _.map(prev.chapters || [], (item) => (_.isEqual(item.id, ch.id) ? { ...item, title: val } : item)),
                            }));
                          }}
                          className="w-full bg-transparent hover:bg-slate-850 focus:bg-slate-800 border border-transparent focus:border-rose-500/40 rounded-lg px-2 py-1.5 text-slate-100 font-bold text-xs focus:outline-none transition-all placeholder-slate-500/50 -ml-2"
                          placeholder={STEP0_TEXTS.CHAPTER_PLACEHOLDER}
                        />
                        <div className="text-[11px] text-slate-400 leading-relaxed font-sans">{ch.scriptSegment}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="pt-4 border-t border-slate-800 flex items-center justify-end mt-6">
        <Button variant="primary" size="lg" onClick={() => setCurrentStep(WizardStep.Storyboard)} className="flex items-center gap-1.5 px-5 py-3 shadow">
          {t.Continue}
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
