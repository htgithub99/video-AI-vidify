import { genreLabels, audLabels, styleLabels } from '../../constants/data';
import React from 'react';
import { PipelineWizardState } from './usePipelineWizard';
import * as LucideIcons from 'lucide-react';
import { WizardStep } from '../../types';



const { Settings2, Layers, ChevronDown, Check, Clock, Layout, Sparkles, RefreshCw, FileText, Copy, ShieldCheck, ArrowRight } = LucideIcons as any;

export default function PipelineStep0(props: PipelineWizardState) {
  const { t, project, setProject, setCurrentStep, loadingStates, setInfoMsg, handleProcessInputAndConfig } = props;
  return (
    <>
      <div className="bg-gradient-to-b from-slate-900/90 to-slate-950/95 border border-slate-800/85 rounded-2xl p-6 space-y-6 shadow-2xl relative overflow-visible">
        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/[0.03] rounded-full blur-3xl pointer-events-none" />
        <div className="border-b border-slate-800 pb-4 relative z-10">
          <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-rose-500" />
            {t.stepInput}
          </h3>
          <p className="text-slate-400 text-xs mt-1">
            {t.Select_your_story_materia}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {}
          <div className="lg:col-span-2 flex flex-col gap-5 h-full justify-stretch">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 block font-mono uppercase">
                {t.sourceType}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() =>
                    setProject((prev) => ({
                      ...prev,
                      input: { ...prev.input, type: "script" },
                    }))
                  }
                  className={`p-4 rounded-xl border text-left cursor-pointer transition-all duration-300 outline-none ${project.input.type === "script"
                    ? "bg-rose-950 border-rose-500 text-rose-500 ring-2 ring-rose-500/20 shadow-[0_0_15px_rgba(37,99,235,0.12)] scale-[1.01]"
                    : "bg-slate-900 border-slate-800 text-slate-350 hover:border-slate-700 hover:bg-slate-950 hover:scale-[1.01] hover:shadow-md"
                    }`}
                >
                  <span className="font-bold text-sm block mb-1 uppercase tracking-wider">
                    {t.originalScript}
                  </span>
                  <span className="text-[11px] font-medium leading-relaxed block text-slate-300">
                    {t.originalScriptDesc}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setProject((prev) => ({
                      ...prev,
                      input: { ...prev.input, type: "idea" },
                    }))
                  }
                  className={`p-4 rounded-xl border text-left cursor-pointer transition-all duration-300 outline-none ${project.input.type === "idea"
                    ? "bg-rose-950 border-rose-500 text-rose-500 ring-2 ring-rose-500/20 shadow-[0_0_15px_rgba(37,99,235,0.12)] scale-[1.01]"
                    : "bg-slate-900 border-slate-800 text-slate-350 hover:border-slate-700 hover:bg-slate-950 hover:scale-[1.01] hover:shadow-md"
                    }`}
                >
                  <span className="font-bold text-sm block mb-1 uppercase tracking-wider">
                    {t.storyIdea}
                  </span>
                  <span className="text-[11px] font-medium leading-relaxed block text-slate-300">
                    {t.storyIdeaDesc}
                  </span>
                </button>
              </div>
            </div>

            {}
            <div className="space-y-1.5 flex-1 flex flex-col h-full min-h-[350px]">
              <label className="text-xs font-semibold text-slate-300 block font-mono uppercase">
                {t.N_i_dung_c_t_truy_n}
              </label>
              <textarea
                value={project.input.content}
                onChange={(e) =>
                  setProject((prev) => ({
                    ...prev,
                    input: { ...prev.input, content: e.target.value },
                  }))
                }
                placeholder={t.Nh_p_n_i_dung_k_ch_b_n_nh}
                className="w-full flex-1 bg-slate-950 border border-slate-800 focus:border-rose-500 text-slate-100 p-4 rounded-xl text-sm ring-none focus:outline-none transition-all font-sans leading-relaxed resize-none min-h-[250px]"
              />
            </div>
          </div>

          {}
          <div className="bg-gradient-to-b from-slate-900 to-slate-950/90 border border-slate-800 p-5 rounded-2xl space-y-5 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl pointer-events-none" />

            <div className="border-b border-slate-800 pb-3 flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-rose-500 shrink-0" />
              <h4 className="font-bold text-slate-100 text-xs font-mono uppercase tracking-wider">
                {t.C_u_h_nh_K_ch_b_n}
              </h4>
            </div>

            {}
            <div className="space-y-1.5">
              <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block">
                {t.Th_lo_i_video}
              </span>
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
                  className="flex-1 bg-transparent border-none text-slate-200 text-xs font-semibold outline-none cursor-pointer appearance-none pr-6"
                >
                  {[
                    "Storytelling",
                    "History",
                    "Documentary",
                    "Explanation",
                    "Review",
                    "Education",
                    "News",
                    "Top List",
                    "True Crime",
                    "Science",
                    "Psychology",
                    "Philosophy",
                  ].map((genre) => {

                    return (
                      <option
                        key={genre}
                        value={genre}
                        className="bg-slate-950 text-slate-300"
                      >
                        {genreLabels[genre] || genre}
                      </option>
                    );
                  })}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 text-slate-500 w-4 h-4" />
              </div>
            </div>

            {}
            <div className="space-y-1.5">
              <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block">
                {t.Ng_n_ng_u_ra}
              </span>
              <div className="relative flex items-center bg-slate-950/60 border border-slate-800/80 rounded-xl focus-within:border-rose-500/80 focus-within:ring-1 focus-within:ring-rose-500/20 px-3 py-2.5 transition-all shadow-sm">
                <Check className="w-4 h-4 text-slate-450 mr-2.5 shrink-0" />
                <select
                  value={project.config.language}
                  onChange={(e) =>
                    setProject((prev) => ({
                      ...prev,
                      config: {
                        ...prev.config,
                        language: e.target.value as "vi" | "en",
                      },
                    }))
                  }
                  className="flex-1 bg-transparent border-none text-slate-200 text-xs font-semibold outline-none cursor-pointer appearance-none pr-6"
                >
                  <option
                    value="vi"
                    className="bg-slate-950 text-slate-300"
                  >
                    {t.Ti_ng_Vi_t}
                  </option>
                  <option
                    value="en"
                    className="bg-slate-950 text-slate-300"
                  >
                    {t.Ti_ng_Anh}
                  </option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 text-slate-500 w-4 h-4" />
              </div>
            </div>

            {}
            <div className="space-y-1.5">
              <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block">
                {t.C_u_h_nh_S_l_ng_t_Th_i_l_}
              </span>
              <div className="relative flex items-center bg-slate-950/60 border border-slate-800/80 rounded-xl focus-within:border-rose-500/80 focus-within:ring-1 focus-within:ring-rose-500/20 px-3 py-2.5 transition-all shadow-sm">
                <Clock className="w-4 h-4 text-slate-450 mr-2.5 shrink-0" />
                <select
                  value={project.config.duration}
                  onChange={(e) =>
                    setProject((prev) => ({
                      ...prev,
                      config: {
                        ...prev.config,
                        duration: e.target.value,
                      },
                    }))
                  }
                  className="flex-1 bg-transparent border-none text-slate-200 text-xs font-semibold outline-none cursor-pointer appearance-none pr-6"
                >
                  {[
                    { val: "2m", label: "300 từ (~2 phút)" },
                    { val: "5m", label: "750 từ (~5 phút)" },
                    { val: "10m", label: "1500 từ (~10 phút)" },
                    { val: "15m", label: "2250 từ (~15 phút)" },
                  ].map((item) => (
                    <option
                      key={item.val}
                      value={item.val}
                      className="bg-slate-950 text-slate-300"
                    >
                      {item.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 text-slate-500 w-4 h-4" />
              </div>
              <p className="text-[10px] text-slate-500 leading-normal pl-1">
                {t.AI_s_bu_c_ph_i_m_r_ng_n_i}
              </p>
            </div>

            {}
            <div className="space-y-1.5">
              <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block">
                {t.Kh_n_gi_m_c_ti_u}
              </span>
              <div className="relative flex items-center bg-slate-950/60 border border-slate-800/80 rounded-xl focus-within:border-rose-500/80 focus-within:ring-1 focus-within:ring-rose-500/20 px-3 py-2.5 transition-all shadow-sm">
                <Layout className="w-4 h-4 text-slate-450 mr-2.5 shrink-0" />
                <select
                  value={project.config.audience}
                  onChange={(e) =>
                    setProject((prev) => ({
                      ...prev,
                      config: {
                        ...prev.config,
                        audience: e.target.value,
                      },
                    }))
                  }
                  className="flex-1 bg-transparent border-none text-slate-200 text-xs font-semibold outline-none cursor-pointer appearance-none pr-6"
                >
                  {[
                    "General Audience",
                    "Kids",
                    "Teenagers",
                    "Adults",
                    "Seniors",
                  ].map((aud) => {

                    return (
                      <option
                        key={aud}
                        value={aud}
                        className="bg-slate-950 text-slate-300"
                      >
                        {audLabels[aud] || aud}
                      </option>
                    );
                  })}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 text-slate-500 w-4 h-4" />
              </div>
            </div>

            {}
            <div className="space-y-1.5">
              <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block">
                {t.Phong_c_ch_h_nh_v_n}
              </span>
              <div className="relative flex items-center bg-slate-950/60 border border-slate-800/80 rounded-xl focus-within:border-rose-500/80 focus-within:ring-1 focus-within:ring-rose-500/20 px-3 py-2.5 transition-all shadow-sm">
                <Sparkles className="w-4 h-4 text-slate-450 mr-2.5 shrink-0" />
                <select
                  value={project.config.writingStyle}
                  onChange={(e) =>
                    setProject((prev) => ({
                      ...prev,
                      config: {
                        ...prev.config,
                        writingStyle: e.target.value,
                      },
                    }))
                  }
                  className="flex-1 bg-transparent border-none text-slate-200 text-xs font-semibold outline-none cursor-pointer appearance-none pr-6"
                >
                  {[
                    "Professional",
                    "Documentary",
                    "Viral",
                    "Mystery",
                    "Drama",
                    "Educational",
                    "Scientific",
                  ].map((style) => {

                    return (
                      <option
                        key={style}
                        value={style}
                        className="bg-slate-950 text-slate-300"
                      >
                        {styleLabels[style] || style}
                      </option>
                    );
                  })}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 text-slate-500 w-4 h-4" />
              </div>
            </div>

            {}
            <div className="bg-slate-950/45 border border-slate-900/60 p-3.5 rounded-xl space-y-2.5 shadow-inner hover:border-slate-800 transition-all">
              <div className="flex items-center justify-between text-[10px] font-mono font-bold uppercase tracking-wider">
                <span className="text-slate-450">
                  {t.C_ng_Vi_t_l_i}
                </span>
                <span className="text-rose-450 bg-rose-500/10 border border-rose-500/10 px-2 py-0.5 rounded-full">
                  {project.config.rewriteLevel}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={project.config.rewriteLevel}
                onChange={(e) =>
                  setProject((prev) => ({
                    ...prev,
                    config: {
                      ...prev.config,
                      rewriteLevel: Number(e.target.value),
                    },
                  }))
                }
                className="w-full h-1 bg-slate-900 hover:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-600 focus:outline-none"
              />
            </div>

            {}
            <div className="bg-slate-950/45 border border-slate-900/60 p-3.5 rounded-xl space-y-2.5 shadow-inner hover:border-slate-800 transition-all">
              <div className="flex items-center justify-between text-[10px] font-mono font-bold uppercase tracking-wider">
                <span className="text-slate-450">{t.Gi_m_tr_ng_l_p}</span>
                <span className="text-amber-450 bg-amber-500/10 border border-amber-500/10 px-2 py-0.5 rounded-full">
                  {project.config.similarityReduction}/10
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={project.config.similarityReduction}
                onChange={(e) =>
                  setProject((prev) => ({
                    ...prev,
                    config: {
                      ...prev.config,
                      similarityReduction: Number(e.target.value),
                    },
                  }))
                }
                className="w-full h-1 bg-slate-900 hover:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500 focus:outline-none"
              />
            </div>

            {}
            <div className="bg-slate-950/45 border border-slate-900/60 p-3.5 rounded-xl space-y-2.5 shadow-inner hover:border-slate-800 transition-all">
              <div className="flex items-center justify-between text-[10px] font-mono font-bold uppercase tracking-wider">
                <span className="text-slate-450">{t.s_ng_t_o}</span>
                <span className="text-sky-450 bg-sky-500/10 border border-sky-500/10 px-2 py-0.5 rounded-full">
                  {project.config.creativityLevel}/10
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={project.config.creativityLevel}
                onChange={(e) =>
                  setProject((prev) => ({
                    ...prev,
                    config: {
                      ...prev.config,
                      creativityLevel: Number(e.target.value),
                    },
                  }))
                }
                className="w-full h-1 bg-slate-900 hover:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500 focus:outline-none"
              />
            </div>

            {}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-4">
              <div className="flex flex-col max-w-[70%]">
                <span className="text-[11px] font-bold text-slate-200">
                  {t.X_c_th_c_th_ng_tin_Fact_c}
                </span>
                <span className="text-[10px] text-slate-500 leading-normal mt-0.5">
                  {t.T_ng_ph_n_t_ch_v_x_c_minh}
                </span>
              </div>

              <button
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
                className={`w-11 h-6 flex items-center rounded-full p-0.5 transition-colors cursor-pointer outline-none focus:ring-1 focus:ring-rose-500/20 ${project.config.factCheck
                  ? "bg-rose-600"
                  : "bg-slate-800"
                  }`}
              >
                <div
                  className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-200 ${project.config.factCheck
                    ? "translate-x-5"
                    : "translate-x-0"
                    }`}
                />
              </button>
            </div>
          </div>
        </div>

        {}
        <div className="pt-4 flex items-center justify-end">
          <button
            type="button"
            onClick={() => handleProcessInputAndConfig()}
            disabled={
              !!loadingStates["processInput"] ||
              !project.input.content.trim()
            }
            className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 disabled:bg-slate-800 disabled:opacity-75 disabled:cursor-not-allowed text-white font-bold text-sm px-6 py-3.5 rounded-xl transition-all shadow-md cursor-pointer active:scale-95"
            title={t.Ph_n_t_ch_t_ng_v_bi_n_so_}
          >
            {loadingStates["processInput"] ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>{t.ang_t_o}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>
                  {t.Generate_Script}
                </span>
              </>
            )}
          </button>
        </div>

        {}
        {(project.scriptRewritten || loadingStates["processInput"]) && (
          <div className="pt-6 border-t border-slate-800 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <FileText className="w-5 h-5 text-rose-500" />
                {t.enhancedScript}
              </h3>
            </div>

            <div
              className={`grid grid-cols-1 lg:grid-cols-3 gap-6 lg:items-stretch relative ${loadingStates["processInput"] && !project.scriptRewritten ? "min-h-[460px]" : ""}`}
            >
              {}

              {}
              <div className="lg:col-span-2 space-y-3 flex flex-col h-full">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold font-mono text-slate-400">
                      {t.FULL_VERBOSE_SCRIPT}
                    </span>
                    <button
                      onClick={() => {
                        if (project.scriptRewritten) {
                          navigator.clipboard.writeText(
                            project.scriptRewritten,
                          );
                          setInfoMsg(
                            t.Copied_script,
                          );
                        }
                      }}
                      className="text-slate-500 hover:text-rose-400 p-1 rounded hover:bg-slate-900 transition-colors"
                      title={t.Copy}
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex gap-4 text-[10px] font-mono text-slate-500">
                    <span>
                      {t.Words}:{" "}
                      <strong className="text-slate-300">
                        {
                          (project.scriptRewritten || "")
                            .trim()
                            .split(/\s+/)
                            .filter(Boolean).length
                        }
                      </strong>
                    </span>
                    <span>
                      {t.Chars}:{" "}
                      <strong className="text-slate-300">
                        {(project.scriptRewritten || "").length}
                      </strong>
                    </span>
                    <span>
                      {t.Est_Time}
                      :{" "}
                      <strong className="text-rose-400">
                        ~
                        {Math.ceil(
                          (project.scriptRewritten || "")
                            .trim()
                            .split(/\s+/)
                            .filter(Boolean).length / 130,
                        )}{" "}
                        {t.min}
                      </strong>
                    </span>
                  </div>
                </div>
                {loadingStates["processInput"] ? (
                  <div className="w-full flex-1 bg-slate-950/60 border border-slate-800/80 rounded-xl p-6 flex flex-col justify-between min-h-[380px] lg:min-h-[440px] h-full relative overflow-hidden animate-pulse">
                    <div className="space-y-3">
                      <div className="h-4 bg-slate-900 rounded w-3/4 animate-pulse"></div>
                      <div className="h-4 bg-slate-900 rounded w-5/6 animate-pulse"></div>
                      <div className="h-4 bg-slate-900 rounded w-2/3 animate-pulse"></div>
                      <div className="h-4 bg-slate-900 rounded w-full animate-pulse"></div>
                      <div className="h-4 bg-slate-900 rounded w-4/5 animate-pulse"></div>
                    </div>
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-slate-950/30 backdrop-blur-[1px] z-10">
                      <div className="p-3 bg-rose-500/10 rounded-full border border-rose-500/20 mb-3 animate-bounce">
                        <Sparkles className="w-5 h-5 text-rose-500 animate-pulse" />
                      </div>
                      <p className="font-bold text-slate-200 text-xs text-center font-mono">
                        {t.ang_so_n_k_ch_b_n}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1 max-w-[200px] text-center leading-relaxed font-sans">
                        {t.M_h_nh_AI_ang_ki_n_t_o_k_}
                      </p>
                    </div>
                    <div className="space-y-3">
                      <div className="h-4 bg-slate-900 rounded w-1/2 animate-pulse"></div>
                      <div className="h-4 bg-slate-900 rounded w-4/5 animate-pulse"></div>
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
                    className="w-full flex-1 bg-slate-950 border border-slate-800 focus:border-rose-500 text-slate-100 p-4 rounded-xl text-sm leading-relaxed focus:outline-none transition-all font-sans min-h-[380px] lg:min-h-[440px] h-full"
                  />
                )}
              </div>

              {}
              <div className="space-y-4 flex flex-col h-full">
                {}
                {project.config.factCheck && (
                  <div className="bg-slate-950 border border-slate-800/80 p-4 rounded-xl space-y-2 shrink-0">
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-300 font-bold px-2 py-0.5 rounded border border-emerald-500/20 font-mono inline-flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      {t.Fact_Check_Insight}
                    </span>
                    {loadingStates["processInput"] ? (
                      <div className="space-y-1.5 animate-pulse py-1">
                        <div className="h-3 bg-slate-900 rounded w-5/6"></div>
                        <div className="h-3 bg-slate-900 rounded w-3/4"></div>
                      </div>
                    ) : (
                      <p className="text-slate-400 text-xs leading-relaxed italic max-h-[140px] overflow-y-auto">
                        {project.factCheckNotes ||
                          (t.Analyzing_historical_data)}
                      </p>
                    )}
                  </div>
                )}

                {}
                <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-3 flex-1 flex flex-col min-h-[260px]">
                  <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider font-bold shrink-0">
                    {t.Chapters_Script_Outline}
                  </span>
                  <div className="space-y-2.5 flex-1 overflow-y-auto pr-1 max-h-[350px] lg:max-h-[500px]">
                    {loadingStates["processInput"] ? (
                      <div className="space-y-3 py-1">
                        {[1, 2, 3].map((num) => (
                          <div
                            key={num}
                            className="bg-slate-900/50 border border-slate-800/50 p-2.5 rounded-lg space-y-2 animate-pulse"
                          >
                            <div className="h-2.5 bg-slate-800 rounded w-1/4"></div>
                            <div className="h-3 bg-slate-800 rounded w-1/2"></div>
                            <div className="h-2.5 bg-slate-800 rounded w-5/6"></div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      (project.chapters || []).map((ch, idx) => (
                        <div
                          key={ch.id}
                          className="bg-slate-900 border border-slate-800/50 p-2.5 rounded-lg space-y-1"
                        >
                          <span className="text-[9px] text-rose-500 font-mono font-bold uppercase">
                            {t.Chapter}:{" "}
                            {ch.id}
                          </span>
                          <input
                            type="text"
                            value={ch.title}
                            onChange={(e) => {
                              const val = e.target.value;
                              setProject((prev) => {
                                const updated = (prev.chapters || []).map(
                                  (item) =>
                                    item.id === ch.id
                                      ? { ...item, title: val }
                                      : item,
                                );
                                return { ...prev, chapters: updated };
                              });
                            }}
                            className="w-full bg-transparent border-none text-slate-100 font-bold text-xs focus:outline-none"
                          />
                          <div className="text-[10px] text-slate-400">
                            {ch.scriptSegment}
                          </div>
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
          <button
            onClick={() => setCurrentStep(WizardStep.Storyboard)}
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
