import { cn } from "../../lib/utils";
import { PipelineWizardState } from "./usePipelineWizard";
import * as LucideIcons from "lucide-react";
import { Button } from "../ui/Button";
import { Tooltip } from "../ui/Tooltip";
import _ from "lodash";
import { LEADING_HASHTAGS_REGEX, PIPELINE_STEP3_TEXTS, ThumbnailActionPosition } from "../../constants";
import { WizardStep } from "../../types";

const { Search, Copy, Target, RefreshCw, ArrowLeft, ArrowRight, Sparkles, Hash, Tag, FileText } = LucideIcons as any;

export default function PipelineStep3(props: PipelineWizardState) {
  const { t, project, loadingStates, setInfoMsg, setCurrentStep, handleTriggerSEOBoost } = props;

  const hasMeasuredScore = (score: unknown): boolean => _.isFinite(score) && _.gte(_.toNumber(score), 0);
  const showScore = (score: unknown): string => (hasMeasuredScore(score) ? `${score}%` : "Chưa đo");
  const scoreWidth = (score: unknown): string => `${hasMeasuredScore(score) ? score : 0}%`;

  const isGenerating = !!loadingStates["seoBoost_loading"];

  return (
    <div className={cn("bg-gradient-to-b from-slate-900/90 to-slate-950/95 rounded-xl p-4 sm:p-6 space-y-6 shadow-2xl relative overflow-visible w-full text-left")}>
      <div className={cn("border-b border-slate-800/80 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-20")}>
        <div>
          <h3 className={cn("text-lg font-bold text-slate-100 flex items-center gap-2 relative z-20")}>
            <Tooltip content="Tự động phân tích kịch bản và tối ưu bộ từ khóa, tiêu đề cuốn hút và hashtags chuẩn SEO." position="bottom" align="start">
              <span className={cn("flex items-center gap-2 cursor-help")}>
                <Target className={cn("w-5 h-5 text-rose-500")} /> {t.seoOptimizer || PIPELINE_STEP3_TEXTS.SEO_RESULT}
              </span>
            </Tooltip>
          </h3>
          <p className={cn("text-slate-400 text-xs mt-1 relative z-10")}>
            Tối ưu hóa tiêu đề, mô tả và hashtags giúp video đạt tỷ lệ click (CTR) cao trên YouTube &amp; TikTok.
          </p>
        </div>

        <Tooltip content="Kích hoạt AI phân tích kịch bản để tạo ra các biến thể tiêu đề và thẻ hashtags tối ưu." position="top" align="end">
          <Button
            variant="primary"
            onClick={() => {
              if (handleTriggerSEOBoost) handleTriggerSEOBoost(true, ThumbnailActionPosition.TOP);
            }}
            disabled={isGenerating}
            isLoading={isGenerating}
            className={cn("self-start sm:self-auto relative z-20 shadow-lg shadow-rose-600/25 px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2")}
            title={t.Create_prompt_guides_and_}>
            {isGenerating ? <RefreshCw className={cn("w-4 h-4 animate-spin")} /> : <Sparkles className={cn("w-4 h-4 text-amber-200 animate-pulse")} />}
            <span>{isGenerating ? t.Processing || "Đang xử lý..." : "Tối ưu SEO AI"}</span>
          </Button>
        </Tooltip>
      </div>

      <div className={cn("grid grid-cols-1 lg:grid-cols-5 gap-6")}>
        <div className={cn("lg:col-span-3 space-y-6 flex flex-col")}>
          <div className={cn("bg-gradient-to-br from-slate-900/60 via-slate-950/80 to-slate-900/40 border border-slate-800/80 p-5 rounded-2xl space-y-4 shadow-xl backdrop-blur-md relative overflow-hidden")}>
            <div className={cn("flex items-center justify-between border-b border-slate-800/80 pb-3")}>
              <div className={cn("flex items-center gap-2")}>
                <FileText className={cn("w-4 h-4 text-rose-500")} />
                <span className={cn("text-xs font-bold text-slate-200 uppercase tracking-wider font-mono")}>
                  {t.Titles_Options_Group || PIPELINE_STEP3_TEXTS.TITLES_OPTIONS}
                </span>
              </div>
              <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20")}>
                {project.seo?.titles?.length || 0} Gợi ý
              </span>
            </div>

            <div className={cn("space-y-3.5")}>
              {_.isEmpty(project.seo?.titles) &&
                (isGenerating ? (
                  <div className={cn("space-y-3")}>
                    {_.map(_.range(1, 4), (idx) => (
                      <div key={idx} className={cn("bg-slate-950/60 border border-slate-800/80 p-4 rounded-xl space-y-3 animate-pulse")}>
                        <div className={cn("h-4 bg-slate-800 rounded w-3/4")} />
                        <div className={cn("grid grid-cols-4 gap-3 pt-2")}>
                          <div className={cn("h-2 bg-slate-800 rounded-full")} />
                          <div className={cn("h-2 bg-slate-800 rounded-full")} />
                          <div className={cn("h-2 bg-slate-800 rounded-full")} />
                          <div className={cn("h-2 bg-slate-800 rounded-full")} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={cn("bg-slate-950/40 border border-slate-800/80 rounded-xl p-8 text-center flex flex-col items-center justify-center space-y-3")}>
                    <div className={cn("w-10 h-10 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-full flex items-center justify-center")}>
                      <Search className={cn("w-5 h-5")} />
                    </div>
                    <div className={cn("space-y-1")}>
                      <p className={cn("text-xs font-bold text-slate-200")}>{t.No_SEO_Data || PIPELINE_STEP3_TEXTS.NO_SEO_DATA}</p>
                      <p className={cn("text-[11px] text-slate-400 max-w-xs leading-relaxed")}>
                        {t.Click_Optimize_Boost_at_t || PIPELINE_STEP3_TEXTS.CLICK_OPTIMIZE_HINT}
                      </p>
                    </div>
                  </div>
                ))}

              {_.map(project.seo?.titles || [], (title, i) => (
                <div
                  key={i}
                  className={cn(
                    "bg-slate-950/50 hover:border-rose-500/40 transition-all border border-slate-800/80 p-4 rounded-xl space-y-3 group",
                  )}>
                  <div className={cn("flex items-start justify-between gap-3")}>
                    <p className={cn("font-bold text-slate-100 text-sm leading-snug")}>{title.text}</p>
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => {
                        navigator.clipboard.writeText(title.text);
                        setInfoMsg(t.Copied_title_to_clipboard || PIPELINE_STEP3_TEXTS.COPIED_TITLE);
                      }}
                      className={cn("toast-close-btn p-1.5 text-slate-400 hover:text-rose-500 shrink-0")}
                      title={t.Copy_title || PIPELINE_STEP3_TEXTS.COPY_TITLE}>
                      <Copy className={cn("w-4 h-4")} />
                    </Button>
                  </div>

                  <div className={cn("grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-800/80 text-xs font-mono")}>
                    <div>
                      <div className={cn("flex justify-between mb-1 text-[10px] text-slate-400 font-bold")}>
                        <span>{t.Search || PIPELINE_STEP3_TEXTS.SEARCH_TITLE}</span>
                        <span className={cn("text-rose-400 font-bold")}>{showScore(title.searchScore)}</span>
                      </div>
                      <div className={cn("w-full bg-slate-800 h-1.5 rounded-full overflow-hidden")}>
                        <div className={cn("bg-rose-500 h-full rounded-full transition-all")} style={{ width: scoreWidth(title.searchScore) }} />
                      </div>
                    </div>

                    <div>
                      <div className={cn("flex justify-between mb-1 text-[10px] text-slate-400 font-bold")}>
                        <span>{t.CTR || PIPELINE_STEP3_TEXTS.CTR_TITLE}</span>
                        <span className={cn("text-amber-400 font-bold")}>{showScore(title.ctrScore)}</span>
                      </div>
                      <div className={cn("w-full bg-slate-800 h-1.5 rounded-full overflow-hidden")}>
                        <div className={cn("bg-amber-500 h-full rounded-full transition-all")} style={{ width: scoreWidth(title.ctrScore) }} />
                      </div>
                    </div>

                    <div>
                      <div className={cn("flex justify-between mb-1 text-[10px] text-slate-400 font-bold")}>
                        <span>{t.Compet || PIPELINE_STEP3_TEXTS.COMPETITION_TITLE}</span>
                        <span className={cn("text-blue-400 font-bold")}>{showScore(title.compScore)}</span>
                      </div>
                      <div className={cn("w-full bg-slate-800 h-1.5 rounded-full overflow-hidden")}>
                        <div className={cn("bg-blue-500 h-full rounded-full transition-all")} style={{ width: scoreWidth(title.compScore) }} />
                      </div>
                    </div>

                    <div>
                      <div className={cn("flex justify-between mb-1 text-[10px] text-slate-400 font-bold")}>
                        <span>{t.SEO_Score || PIPELINE_STEP3_TEXTS.SEO_SCORE_TITLE}</span>
                        <span className={cn("text-emerald-400 font-bold")}>{showScore(title.seoScore)}</span>
                      </div>
                      <div className={cn("w-full bg-slate-800 h-1.5 rounded-full overflow-hidden")}>
                        <div className={cn("bg-emerald-500 h-full rounded-full transition-all")} style={{ width: scoreWidth(title.seoScore) }} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={cn("bg-gradient-to-br from-slate-900/60 via-slate-950/80 to-slate-900/40 border border-slate-800/80 p-5 rounded-2xl space-y-4 shadow-xl backdrop-blur-md relative overflow-hidden")}>
            <div className={cn("flex items-center justify-between border-b border-slate-800/80 pb-3")}>
              <div className={cn("flex items-center gap-2")}>
                <FileText className={cn("w-4 h-4 text-emerald-500")} />
                <span className={cn("text-xs font-bold text-slate-200 uppercase tracking-wider font-mono")}>
                  {t.Description_Options || PIPELINE_STEP3_TEXTS.DESC_OPTIONS}
                </span>
              </div>
              <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20")}>
                {project.seo?.descriptions?.length || 0} Đoạn
              </span>
            </div>

            <div className={cn("space-y-3")}>
              {_.isEmpty(project.seo?.descriptions) &&
                (isGenerating ? (
                  <div className={cn("space-y-3 w-full")}>
                    {_.map(_.range(1, 3), (idx) => (
                      <div key={idx} className={cn("bg-slate-950/60 border border-slate-800/80 p-4 rounded-xl space-y-2 animate-pulse")}>
                        <div className={cn("h-3 bg-slate-800 rounded w-full")} />
                        <div className={cn("h-3 bg-slate-800 rounded w-5/6")} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={cn("text-[11px] text-slate-400 border border-slate-800/80 bg-slate-950/40 p-5 rounded-xl text-center")}>
                    {t.Descriptions_are_empty || PIPELINE_STEP3_TEXTS.DESCRIPTIONS_EMPTY}
                  </div>
                ))}

              {_.map(project.seo?.descriptions || [], (desc, i) => (
                <div
                  key={i}
                  className={cn(
                    "bg-slate-950/50 hover:border-emerald-500/40 transition-all border border-slate-800/80 p-4 rounded-xl space-y-2 group",
                  )}>
                  <div className={cn("flex items-start justify-between gap-4")}>
                    <p className={cn("text-xs text-slate-200 leading-relaxed font-sans")}>{desc.text}</p>
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={() => {
                        navigator.clipboard.writeText(desc.text);
                        setInfoMsg(t.Copied_description_to_cli || PIPELINE_STEP3_TEXTS.COPIED_DESC);
                      }}
                      className={cn("toast-close-btn p-1.5 text-slate-400 hover:text-emerald-500 shrink-0")}
                      title={t.Copy || PIPELINE_STEP3_TEXTS.COPY_DESC}>
                      <Copy className={cn("w-4 h-4")} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={cn("lg:col-span-2 space-y-6 flex flex-col")}>
          <div className={cn("bg-gradient-to-br from-slate-900/60 via-slate-950/80 to-slate-900/40 border border-slate-800/80 p-5 rounded-2xl space-y-4 shadow-xl backdrop-blur-md relative overflow-hidden")}>
            <div className={cn("flex items-center justify-between border-b border-slate-800/80 pb-3")}>
              <div className={cn("flex items-center gap-2")}>
                <Hash className={cn("w-4 h-4 text-amber-500")} />
                <span className={cn("text-xs font-bold text-slate-200 uppercase tracking-wider font-mono")}>
                  {t.hashtags || PIPELINE_STEP3_TEXTS.HASHTAGS}
                </span>
              </div>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => {
                  const hashtagsText = _.join(
                    _.map(project.seo?.hashtags || [], (tag) => `#${tag.replace(LEADING_HASHTAGS_REGEX, "")}`),
                    " ",
                  );
                  navigator.clipboard.writeText(hashtagsText);
                  setInfoMsg(t.Copied_Hashtags_to_clipbo || PIPELINE_STEP3_TEXTS.COPIED_HASHTAGS);
                }}
                disabled={_.isEmpty(project.seo?.hashtags)}
                className={cn("toast-close-btn text-slate-400 hover:text-amber-500")}
                title={t.Copy_Hashtags || PIPELINE_STEP3_TEXTS.COPY_HASHTAGS}>
                <Copy className={cn("w-4 h-4")} />
              </Button>
            </div>

            <div className={cn("flex flex-wrap gap-2")}>
              {_.isEmpty(project.seo?.hashtags) &&
                (isGenerating ? (
                  <div className={cn("flex gap-2 flex-wrap w-full")}>
                    {_.map(_.range(1, 5), (idx) => (
                      <div key={idx} className={cn("bg-slate-800/80 animate-pulse h-7 w-20 rounded-lg")} />
                    ))}
                  </div>
                ) : (
                  <span className={cn("text-[11px] text-slate-400 font-sans")}>{t.No_hashtags || PIPELINE_STEP3_TEXTS.NO_HASHTAGS}</span>
                ))}

              {_.map(project.seo?.hashtags || [], (tag, i) => (
                <span
                  key={i}
                  className={cn(
                    "bg-amber-500/10 border border-amber-500/20 text-amber-400 font-mono font-bold text-xs px-3 py-1.5 rounded-xl shadow-sm transition hover:scale-105",
                  )}>
                  #{tag.replace(LEADING_HASHTAGS_REGEX, "")}
                </span>
              ))}
            </div>
          </div>

          <div className={cn("bg-gradient-to-br from-slate-900/60 via-slate-950/80 to-slate-900/40 border border-slate-800/80 p-5 rounded-2xl space-y-4 shadow-xl backdrop-blur-md relative overflow-hidden")}>
            <div className={cn("flex items-center justify-between border-b border-slate-800/80 pb-3")}>
              <div className={cn("flex items-center gap-2")}>
                <Tag className={cn("w-4 h-4 text-blue-500")} />
                <span className={cn("text-xs font-bold text-slate-200 uppercase tracking-wider font-mono")}>
                  {t.tags || PIPELINE_STEP3_TEXTS.TAGS}
                </span>
              </div>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => {
                  const tagsText = _.join(project.seo?.tags || [], ", ");
                  navigator.clipboard.writeText(tagsText);
                  setInfoMsg(t.Copied_Tags_to_clipboard || PIPELINE_STEP3_TEXTS.COPIED_TAGS);
                }}
                disabled={_.isEmpty(project.seo?.tags)}
                className={cn("toast-close-btn text-slate-400 hover:text-blue-500")}
                title={t.Copy_Tags || PIPELINE_STEP3_TEXTS.COPY_TAGS}>
                <Copy className={cn("w-4 h-4")} />
              </Button>
            </div>

            <div className={cn("flex flex-wrap gap-2")}>
              {_.isEmpty(project.seo?.tags) &&
                (isGenerating ? (
                  <div className={cn("flex gap-2 flex-wrap w-full")}>
                    {_.map(_.range(1, 7), (idx) => (
                      <div key={idx} className={cn("bg-slate-800/80 animate-pulse h-6 w-16 rounded-lg")} />
                    ))}
                  </div>
                ) : (
                  <span className={cn("text-[11px] text-slate-400 font-sans")}>{t.No_keywords || PIPELINE_STEP3_TEXTS.NO_TAGS}</span>
                ))}

              {_.map(project.seo?.tags || [], (tag, i) => (
                <span
                  key={i}
                  className={cn(
                    "bg-slate-950 border border-slate-800 text-slate-200 font-sans font-medium text-xs px-3 py-1.5 rounded-xl shadow-sm transition hover:border-slate-700",
                  )}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className={cn("pt-4 border-t border-slate-800/80 flex items-center justify-between mt-6 relative z-10")}>
        <Button
          variant="secondary"
          size="md"
          onClick={() => setCurrentStep(WizardStep.AssetManager)}
          className={cn("flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold")}
          title={t.Back}>
          <ArrowLeft className={cn("w-4 h-4")} />
          <span>{t.Back}</span>
        </Button>

        <Button
          variant="primary"
          size="md"
          onClick={() => setCurrentStep(WizardStep.Export)}
          className={cn("flex items-center gap-2 px-6 py-2.5 rounded-xl font-extrabold text-white tracking-wide shadow-lg")}
          title={t.Continue}>
          <span>{t.Continue}</span>
          <ArrowRight className={cn("w-4 h-4")} />
        </Button>
      </div>
    </div>
  );
}
