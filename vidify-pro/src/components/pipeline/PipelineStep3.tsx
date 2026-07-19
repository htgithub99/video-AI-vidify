import { PipelineWizardState } from "./usePipelineWizard";
import * as LucideIcons from "lucide-react";
import { WizardStep } from "../../types";
import { Button } from "../ui/Button";
import _ from "lodash";
import { SEO_DEFAULT_CONFIGS, LEADING_HASHTAGS_REGEX, ThumbnailActionPosition } from "../../constants";

const { Sparkles, RefreshCw, Sliders, ChevronDown, Search, Copy, ArrowLeft, ArrowRight } = LucideIcons as any;

export default function PipelineStep3(props: PipelineWizardState) {
  const { t, project, setProject, setCurrentStep, loadingStates, setInfoMsg, handleTriggerSEOBoost, onSaveProject } = props;
  return (
    <>
      <div className="bg-gradient-to-b from-slate-900/90 to-slate-950/95 border border-slate-800/85 rounded-xl p-6 space-y-6 shadow-2xl relative overflow-visible">
        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/[0.03] rounded-full blur-3xl pointer-events-none" />
        <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
          <div>
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-rose-500" />
              {t.seoOptimizer}
            </h3>
            <p className="text-slate-400 text-xs mt-1">{t.seoDescription}</p>
          </div>

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => handleTriggerSEOBoost(true, ThumbnailActionPosition.TOP)}
            isLoading={!!loadingStates["seoBoost_loading"]}
            className="flex items-center gap-1.5 shadow-md self-start sm:self-auto"
            title={t.Optimize_metadata_and_tri}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{t.Optimize_SEO}</span>
          </Button>
        </div>
        <div className="bg-slate-950/45 border border-slate-805 p-5 rounded-xl space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-xs text-slate-400 font-mono font-bold uppercase block">{t.SEO_Optimization_Input}</label>
            <span className="text-[10px] text-slate-600 font-mono ring-1 ring-slate-800 px-1.5 py-0.5 rounded">{t.INPUT_STATE}</span>
          </div>
          <textarea
            value={project.scriptRewritten || ""}
            onChange={(e) =>
              setProject((prev) => ({
                ...prev,
                scriptRewritten: e.target.value,
              }))
            }
            placeholder={t.Empty_script_Paste_here}
            className="bg-slate-900 border border-slate-800 rounded-lg p-3 w-full text-xs text-slate-300 leading-relaxed font-sans outline-none focus:border-rose-500 min-h-[120px] max-h-60 custom-scrollbar resize-y"
          />
        </div>
        <div className="pb-6 border-b border-slate-800">
          <div className="space-y-1.5 max-w-sm">
            <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block">{t.Number_of_Title_Variants_}</span>
            <div className="relative flex items-center bg-slate-950/60 border border-slate-800/80 rounded-xl focus-within:border-rose-500/80 focus-within:ring-1 focus-within:ring-rose-500/20 px-3.5 py-2.5 transition-all shadow-sm">
              <Sliders className="w-4 h-4 text-slate-450 mr-2.5 shrink-0" />
              <select
                value={project.seoConfig?.numTitles || SEO_DEFAULT_CONFIGS.NUM_TITLES}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || SEO_DEFAULT_CONFIGS.NUM_TITLES;
                  const updatedProject = {
                    ...project,
                    seoConfig: {
                      ...(project.seoConfig || {}),
                      numTitles: val,
                      numDescriptions: SEO_DEFAULT_CONFIGS.NUM_DESCRIPTIONS,
                      numHashtags: SEO_DEFAULT_CONFIGS.NUM_HASHTAGS,
                      numTags: SEO_DEFAULT_CONFIGS.NUM_TAGS,
                    },
                  };
                  setProject(updatedProject);
                  onSaveProject(updatedProject, true);
                }}
                className="flex-1 bg-slate-900 border-none text-slate-205 text-xs font-semibold outline-none cursor-pointer appearance-none pr-6"
              >
                {_.map(_.range(SEO_DEFAULT_CONFIGS.MIN_TITLES_OPTION, SEO_DEFAULT_CONFIGS.MAX_TITLES_OPTION + 1), (num) => (
                  <option key={num} value={num} className="bg-slate-950 text-slate-300">
                    {num} {t.variants}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 text-slate-500 w-4 h-4" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          <div className="lg:col-span-2 space-y-5 flex flex-col h-full bg-slate-900 p-5 rounded-xl border border-slate-800">
            <div className="space-y-3">
              <span className="text-xs text-slate-400 font-mono font-bold uppercase tracking-wider block">{t.Titles_Options_Group}</span>
              <div className="space-y-4">
                {_.isEmpty(project.seo?.titles) &&
                  (loadingStates["seoBoost_loading"] ? (
                    <div className="space-y-4 w-full">
                      {_.map(_.range(1, 4), (idx) => (
                        <div key={idx} className="bg-slate-950/40 border border-slate-800 p-4 rounded-xl space-y-3 animate-pulse">
                          <div className="h-4 bg-slate-900 rounded-md w-3/4"></div>
                          <div className="grid grid-cols-4 gap-4 pt-3 border-t border-slate-900 text-xs">
                            <div className="h-2 bg-slate-900 rounded-full"></div>
                            <div className="h-2 bg-slate-900 rounded-full"></div>
                            <div className="h-2 bg-slate-900 rounded-full"></div>
                            <div className="h-2 bg-slate-900 rounded-full"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-8 text-center flex flex-col items-center justify-center space-y-3">
                      <div className="w-10 h-10 bg-slate-900 border border-slate-800 rounded-full flex items-center justify-center text-slate-500">
                        <Search className="w-4 h-4 text-rose-500" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-slate-300">{t.No_SEO_Data}</p>
                        <p className="text-[11px] text-slate-500 max-w-xs leading-relaxed">{t.Click_Optimize_Boost_at_t}</p>
                      </div>
                    </div>
                  ))}
                {_.map(project.seo?.titles || [], (title, i) => (
                  <div key={i} className="bg-slate-950/60 hover:border-rose-500/20 transition-all border border-slate-800/80 p-4 rounded-xl space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <p className="font-bold text-slate-100 text-sm leading-snug">{title.text}</p>
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => {
                          navigator.clipboard.writeText(title.text);
                          setInfoMsg(t.Copied_title_to_clipboard);
                        }}
                        className="text-slate-500 hover:text-slate-100 p-1 rounded hover:bg-slate-900 shrink-0 h-auto w-auto shadow-none"
                        title={t.Copy_title}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 border-t border-slate-900 text-xs font-mono">
                      <div>
                        <div className="flex justify-between mb-1 text-[10px] text-slate-400">
                          <span>{t.Search}</span>
                          <span className="text-rose-600 dark:text-rose-300 font-bold">{title.searchScore}%</span>
                        </div>
                        <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden">
                          <div className="bg-rose-500 dark:bg-rose-300 h-full" style={{ width: `${title.searchScore}%` }}></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between mb-1 text-[10px] text-slate-400">
                          <span>{t.CTR}</span>
                          <span className="text-rose-600 dark:text-rose-400 font-bold">{title.ctrScore}%</span>
                        </div>
                        <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden">
                          <div className="bg-rose-600 dark:bg-rose-400 h-full" style={{ width: `${title.ctrScore}%` }}></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between mb-1 text-[10px] text-slate-400">
                          <span>{t.Compet}</span>
                          <span className="text-rose-600 dark:text-rose-500 font-bold">{title.compScore}%</span>
                        </div>
                        <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden">
                          <div className="bg-rose-600 dark:bg-rose-500 h-full" style={{ width: `${title.compScore}%` }}></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between mb-1 text-[10px] text-slate-400">
                          <span>{t.SEO_Score}</span>
                          <span className="text-rose-700 dark:text-rose-600 font-bold">{title.seoScore}%</span>
                        </div>
                        <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden">
                          <div className="bg-rose-700 dark:bg-rose-600 h-full" style={{ width: `${title.seoScore}%` }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <span className="text-xs text-slate-400 font-mono font-bold uppercase tracking-wider block">{t.Description_Options}</span>
              <div className="space-y-4">
                {_.isEmpty(project.seo?.descriptions) &&
                  (loadingStates["seoBoost_loading"] ? (
                    <div className="space-y-4 w-full">
                      {_.map(_.range(1, 3), (idx) => (
                        <div key={idx} className="bg-slate-950/40 border border-slate-800 p-4 rounded-xl space-y-2 animate-pulse">
                          <div className="h-3 bg-slate-900 rounded-md w-full"></div>
                          <div className="h-3 bg-slate-900 rounded-md w-5/6"></div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-500 border border-slate-800 bg-slate-950/40 p-4 rounded-xl text-center">{t.Descriptions_are_empty}</div>
                  ))}
                {_.map(project.seo?.descriptions || [], (desc, i) => (
                  <div key={i} className="bg-slate-950/60 hover:border-rose-500/20 transition-all border border-slate-800/80 p-4 rounded-xl space-y-2">
                    <div className="flex items-start justify-between gap-4">
                      <p className="text-xs text-slate-300 leading-relaxed font-sans">{desc.text}</p>
                      <Button
                        variant="ghost"
                        size="xs"
                        onClick={() => {
                          navigator.clipboard.writeText(desc.text);
                          setInfoMsg(t.Copied_description_to_cli);
                        }}
                        className="text-slate-500 hover:text-slate-100 p-1 rounded hover:bg-slate-900 shrink-0 shadow-none"
                        title={t.Copy}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-5">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 uppercase font-mono tracking-widest font-bold">{t.hashtags}</span>
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => {
                      const hashtagsText = _.join(
                        _.map(project.seo?.hashtags || [], (tag) => `#${tag.replace(LEADING_HASHTAGS_REGEX, "")}`),
                        " "
                      );
                      navigator.clipboard.writeText(hashtagsText);
                      setInfoMsg(t.Copied_Hashtags_to_clipbo);
                    }}
                    className="text-slate-500 hover:text-slate-100 p-1 rounded hover:bg-slate-900 shrink-0 shadow-none"
                    title={t.Copy_Hashtags}
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {_.isEmpty(project.seo?.hashtags) &&
                    (loadingStates["seoBoost_loading"] ? (
                      <div className="flex gap-2 flex-wrap w-full">
                        {_.map(_.range(1, 5), (idx) => (
                          <div key={idx} className="bg-slate-900/60 border border-slate-800/80 animate-pulse h-7 w-16 rounded-md"></div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-500 font-mono tracking-tight">{t.No_hashtags}</span>
                    ))}
                  {_.map(project.seo?.hashtags || [], (tag, i) => (
                    <span key={i} className="bg-slate-950/60 border border-slate-800 text-rose-400 font-mono text-[11px] px-2.5 py-1.5 rounded-lg shadow-sm">
                      #{tag.replace(LEADING_HASHTAGS_REGEX, "")}
                    </span>
                  ))}
                </div>
              </div>
              <div className="space-y-2 pt-3 border-t border-slate-900">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 uppercase font-mono tracking-widest font-bold">{t.tags}</span>
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => {
                      const tagsText = _.join(project.seo?.tags || [], ", ");
                      navigator.clipboard.writeText(tagsText);
                      setInfoMsg(t.Copied_Tags_to_clipboard);
                    }}
                    className="text-slate-500 hover:text-slate-100 p-1 rounded hover:bg-slate-900 shrink-0 shadow-none"
                    title={t.Copy_Tags}
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {_.isEmpty(project.seo?.tags) &&
                    (loadingStates["seoBoost_loading"] ? (
                      <div className="flex gap-2 flex-wrap w-full">
                        {_.map(_.range(1, 7), (idx) => (
                          <div key={idx} className="bg-slate-900/60 border border-slate-800/80 animate-pulse h-6 w-12 rounded-md"></div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-500 font-mono tracking-tight">{t.No_keywords}</span>
                    ))}
                  {_.map(project.seo?.tags || [], (tag, i) => (
                    <span key={i} className="bg-slate-950/60 border border-slate-800 text-slate-300 font-sans text-[11px] px-2.5 py-1.5 rounded-lg shadow-sm">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
          <Button
            variant="secondary"
            size="md"
            onClick={() => setCurrentStep(WizardStep.AssetManager)}
            className="flex items-center gap-1.5 px-5 py-3 shadow"
            title={t.Back}
          >
            <ArrowLeft className="w-4 h-4" />
            {t.Back}
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={() => setCurrentStep(WizardStep.Export)}
            className="flex items-center gap-1.5 px-5 py-3 shadow"
            title={t.Continue}
          >
            {t.Continue}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </>
  );
}
