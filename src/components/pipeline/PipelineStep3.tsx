import { PipelineWizardState } from "./usePipelineWizard";
import * as LucideIcons from "lucide-react";
import { Button } from "../ui/Button";
import _ from "lodash";
import { LEADING_HASHTAGS_REGEX, PIPELINE_STEP3_TEXTS } from "../../constants";

const { Search, Copy, Target } = LucideIcons as any;

export default function PipelineStep3(props: PipelineWizardState) {
  const { t, project, loadingStates, setInfoMsg } = props;
  const hasMeasuredScore = (score: unknown): boolean => _.isFinite(score) && _.gte(_.toNumber(score), 0);
  const showScore = (score: unknown): string => hasMeasuredScore(score) ? `${score}%` : "Chưa đo";
  const scoreWidth = (score: unknown): string => `${hasMeasuredScore(score) ? score : 0}%`;
  return (
    <div className="space-y-6 relative overflow-visible h-full flex flex-col">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-1 shrink-0">
          <h4 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Target className="w-5 h-5 text-rose-500" />
            {t.seoOptimizer || PIPELINE_STEP3_TEXTS.SEO_RESULT}
          </h4>
        </div>

        <div className="flex flex-col gap-5 items-stretch flex-1">
          <div className="space-y-5 flex flex-col bg-slate-900/40 p-5 rounded-xl border border-slate-800/50 flex-1">
            <div className="space-y-3">
              <span className="text-xs text-slate-400 font-mono font-bold uppercase tracking-wider block">{t.Titles_Options_Group || PIPELINE_STEP3_TEXTS.TITLES_OPTIONS}</span>
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
                        <p className="text-xs font-semibold text-slate-300">{t.No_SEO_Data || PIPELINE_STEP3_TEXTS.NO_SEO_DATA}</p>
                        <p className="text-[11px] text-slate-500 max-w-xs leading-relaxed">{t.Click_Optimize_Boost_at_t || PIPELINE_STEP3_TEXTS.CLICK_OPTIMIZE_HINT}</p>
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
                          setInfoMsg(t.Copied_title_to_clipboard || PIPELINE_STEP3_TEXTS.COPIED_TITLE);
                        }}
                        className="text-slate-500 hover:text-slate-100 p-1 rounded hover:bg-slate-900 shrink-0 h-auto w-auto shadow-none"
                        title={t.Copy_title || PIPELINE_STEP3_TEXTS.COPY_TITLE}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 border-t border-slate-900 text-xs font-mono">
                      <div>
                        <div className="flex justify-between mb-1 text-[10px] text-slate-400">
                          <span>{t.Search || PIPELINE_STEP3_TEXTS.SEARCH_TITLE}</span>
                          <span className="text-rose-600 dark:text-rose-300 font-bold">{showScore(title.searchScore)}</span>
                        </div>
                        <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden">
                          <div className="bg-rose-500 dark:bg-rose-300 h-full" style={{ width: scoreWidth(title.searchScore) }}></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between mb-1 text-[10px] text-slate-400">
                          <span>{t.CTR || PIPELINE_STEP3_TEXTS.CTR_TITLE}</span>
                          <span className="text-rose-600 dark:text-rose-400 font-bold">{showScore(title.ctrScore)}</span>
                        </div>
                        <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden">
                          <div className="bg-rose-600 dark:bg-rose-400 h-full" style={{ width: scoreWidth(title.ctrScore) }}></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between mb-1 text-[10px] text-slate-400">
                          <span>{t.Compet || PIPELINE_STEP3_TEXTS.COMPETITION_TITLE}</span>
                          <span className="text-rose-600 dark:text-rose-500 font-bold">{showScore(title.compScore)}</span>
                        </div>
                        <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden">
                          <div className="bg-rose-600 dark:bg-rose-500 h-full" style={{ width: scoreWidth(title.compScore) }}></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between mb-1 text-[10px] text-slate-400">
                          <span>{t.SEO_Score || PIPELINE_STEP3_TEXTS.SEO_SCORE_TITLE}</span>
                          <span className="text-rose-700 dark:text-rose-600 font-bold">{showScore(title.seoScore)}</span>
                        </div>
                        <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden">
                          <div className="bg-rose-700 dark:bg-rose-600 h-full" style={{ width: scoreWidth(title.seoScore) }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <span className="text-xs text-slate-400 font-mono font-bold uppercase tracking-wider block">{t.Description_Options || PIPELINE_STEP3_TEXTS.DESC_OPTIONS}</span>
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
                    <div className="text-[11px] text-slate-500 border border-slate-800 bg-slate-950/40 p-4 rounded-xl text-center">{t.Descriptions_are_empty || PIPELINE_STEP3_TEXTS.DESCRIPTIONS_EMPTY}</div>
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
                          setInfoMsg(t.Copied_description_to_cli || PIPELINE_STEP3_TEXTS.COPIED_DESC);
                        }}
                        className="text-slate-500 hover:text-slate-100 p-1 rounded hover:bg-slate-900 shrink-0 shadow-none"
                        title={t.Copy || PIPELINE_STEP3_TEXTS.COPY_DESC}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="bg-slate-900/40 border border-slate-800/50 p-5 rounded-xl space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 uppercase font-mono tracking-widest font-bold">{t.hashtags || PIPELINE_STEP3_TEXTS.HASHTAGS}</span>
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => {
                      const hashtagsText = _.join(
                        _.map(project.seo?.hashtags || [], (tag) => `#${tag.replace(LEADING_HASHTAGS_REGEX, "")}`),
                        " "
                      );
                      navigator.clipboard.writeText(hashtagsText);
                      setInfoMsg(t.Copied_Hashtags_to_clipbo || PIPELINE_STEP3_TEXTS.COPIED_HASHTAGS);
                    }}
                    className="text-slate-500 hover:text-slate-100 p-1 rounded hover:bg-slate-900 shrink-0 shadow-none"
                    title={t.Copy_Hashtags || PIPELINE_STEP3_TEXTS.COPY_HASHTAGS}
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
                      <span className="text-[10px] text-slate-500 font-mono tracking-tight">{t.No_hashtags || PIPELINE_STEP3_TEXTS.NO_HASHTAGS}</span>
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
                  <span className="text-[10px] text-slate-400 uppercase font-mono tracking-widest font-bold">{t.tags || PIPELINE_STEP3_TEXTS.TAGS}</span>
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => {
                      const tagsText = _.join(project.seo?.tags || [], ", ");
                      navigator.clipboard.writeText(tagsText);
                      setInfoMsg(t.Copied_Tags_to_clipboard || PIPELINE_STEP3_TEXTS.COPIED_TAGS);
                    }}
                    className="text-slate-500 hover:text-slate-100 p-1 rounded hover:bg-slate-900 shrink-0 shadow-none"
                    title={t.Copy_Tags || PIPELINE_STEP3_TEXTS.COPY_TAGS}
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
                      <span className="text-[10px] text-slate-500 font-mono tracking-tight">{t.No_keywords || PIPELINE_STEP3_TEXTS.NO_TAGS}</span>
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
  );
}
