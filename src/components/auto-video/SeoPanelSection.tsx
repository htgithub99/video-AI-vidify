import { cn } from "../../lib/utils";
import React from "react";
import _ from "lodash";
import { Copy, Target } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../ui/Button";
import { REFACTOR_CONSTANTS } from "../../constants";
import { AUTO_GENERATOR_CONSTANTS } from "../../constants/config";
import { AUTO_VIDEO_UI_TEXTS } from "../../constants/texts";
import { VideoProject } from "../../types";

interface SeoPanelSectionProps { activeCreatedProject: VideoProject | null | undefined; }

export const SeoPanelSection: React.FC<SeoPanelSectionProps> = ({ activeCreatedProject }) => {
  const seo = activeCreatedProject?.seo;
  if (!seo || (_.isEmpty(seo.titles) && _.isEmpty(seo.descriptions))) {
    return null;
  }

  const uiTexts = AUTO_VIDEO_UI_TEXTS.vi;
  const scoreAvailable = (score: unknown): boolean => _.isFinite(score) && _.gte(_.toNumber(score), 0);
  const usesUnscoredFallback = _.some(seo.titles, (title) => !scoreAvailable(title.seoScore)) || _.includes(_.castArray(_.get(seo, "rotationLogs")), "seo_source_fallback_used") || _.every(seo.titles, (title) => _.every([title.searchScore, title.ctrScore, title.compScore, title.seoScore], (score) => _.isEqual(score, 0)));

  const handleCopyTitle = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(AUTO_GENERATOR_CONSTANTS.UI_SEO_COPIED_TITLE);
  };

  const handleCopyDesc = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(AUTO_GENERATOR_CONSTANTS.UI_SEO_COPIED_DESC);
  };

  const handleCopyTags = (items: string[], isHashtag: boolean) => {
    const textToCopy = isHashtag ? _.map(items, (t) => `#${t.replace(/^#+/, REFACTOR_CONSTANTS.VD_EMPTY_STRING)}`).join(" ") : items.join(", ");
    navigator.clipboard.writeText(textToCopy);
    toast.success(AUTO_GENERATOR_CONSTANTS.UI_SEO_COPIED_TAGS);
  };

  return (
    <div className={cn("bg-slate-900/90 border border-slate-800 p-5 rounded-3xl space-y-4 shadow-xl text-left")}>
      <h3 className={cn("text-xs font-bold text-slate-100 font-mono uppercase flex items-center gap-2")} title={AUTO_GENERATOR_CONSTANTS.UI_SEO_TITLE_TOOLTIP}>
        <Target className={cn("w-4 h-4 text-rose-500")} /> {AUTO_GENERATOR_CONSTANTS.UI_SEO_TITLE_SHORT}
      </h3>
      {usesUnscoredFallback && <div className={cn("rounded-xl border border-amber-800/50 bg-amber-950/20 px-3 py-2 text-[10px] leading-relaxed text-amber-300")}>{uiTexts.seoUnscoredWarning}</div>}
      <div className={cn("space-y-4")}>
        <div className={cn("space-y-2")}>
          <span className={cn("text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block")} title={AUTO_GENERATOR_CONSTANTS.UI_SEO_TITLE_SUGGESTION_TOOLTIP}>
            {AUTO_GENERATOR_CONSTANTS.UI_SEO_TITLE_SUGGESTION}
          </span>
          <div className={cn("space-y-3")}>
            {_.map(seo.titles || [], (title, i) => (
              <div key={i} className={cn("bg-slate-955/60 border border-slate-800/80 p-3 rounded-2xl space-y-2")}>
                <div className={cn("flex items-start justify-between gap-3")}>
                  <p className={cn("font-bold text-slate-100 text-xs leading-snug")}>{title.text}</p>
                  <Button type={REFACTOR_CONSTANTS.BUTTON_TYPE_BUTTON} variant={REFACTOR_CONSTANTS.VARIANT_UNSTYLED} onClick={() => handleCopyTitle(title.text)} className={cn("text-slate-500 hover:text-slate-100 p-1 rounded hover:bg-slate-900 shrink-0 h-auto cursor-pointer")} title={AUTO_GENERATOR_CONSTANTS.UI_SEO_COPY_TITLE_TOOLTIP}>
                    <Copy className={cn("w-3.5 h-3.5")} />
                  </Button>
                </div>
                <div className={cn("grid grid-cols-4 gap-2 pt-2 border-t border-slate-900 text-[9px] font-mono")}>
                  {[ { label: AUTO_GENERATOR_CONSTANTS.UI_SEO_METRIC_SEARCH, score: title.searchScore },
                    { label: AUTO_GENERATOR_CONSTANTS.UI_SEO_METRIC_CTR, score: title.ctrScore },
                    { label: AUTO_GENERATOR_CONSTANTS.UI_SEO_METRIC_COMPET, score: title.compScore },
                    { label: AUTO_GENERATOR_CONSTANTS.UI_SEO_METRIC_SEO, score: title.seoScore }, ].map(({ label, score }) => (
                    <div key={label}>
                      <div className={cn("flex justify-between mb-0.5 text-slate-400")}>
                        <span>{label}</span>
                        <span className={cn("text-rose-450 font-bold")}>{!usesUnscoredFallback && scoreAvailable(score) ? `${score}%` : uiTexts.notMeasured}</span>
                      </div>
                      <div className={cn("w-full bg-slate-900 h-1 rounded-full overflow-hidden")}>
                        <div className={cn("bg-rose-500 h-full")} style={{ width: `${!usesUnscoredFallback && scoreAvailable(score) ? score : 0}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={cn("space-y-2 pt-2 border-t border-slate-800")}>
          <span className={cn("text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block")} title={AUTO_GENERATOR_CONSTANTS.UI_SEO_DESC_SUGGESTION_TOOLTIP}>
            {AUTO_GENERATOR_CONSTANTS.UI_SEO_DESC_SUGGESTION}
          </span>
          <div className={cn("space-y-2")}>
            {_.map(seo.descriptions || [], (desc, i) => (
              <div key={i} className={cn("bg-slate-955/60 border border-slate-800/80 p-3 rounded-2xl flex items-start justify-between gap-3")}>
                <p className={cn("text-[11px] text-slate-300 leading-relaxed font-sans")}>{desc.text}</p>
                <Button type={REFACTOR_CONSTANTS.BUTTON_TYPE_BUTTON} variant={REFACTOR_CONSTANTS.VARIANT_UNSTYLED} onClick={() => handleCopyDesc(desc.text)} className={cn("text-slate-500 hover:text-slate-100 p-1 rounded hover:bg-slate-900 shrink-0 h-auto cursor-pointer")} title={AUTO_GENERATOR_CONSTANTS.UI_SEO_COPY_DESC_TOOLTIP}>
                  <Copy className={cn("w-3.5 h-3.5")} />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className={cn("grid grid-cols-2 gap-3 pt-2 border-t border-slate-800")}>
          {[
            { label: AUTO_GENERATOR_CONSTANTS.UI_SEO_HASHTAGS, items: seo.hashtags || [], isHashtag: true },
            { label: AUTO_GENERATOR_CONSTANTS.UI_SEO_TAGS, items: seo.tags || [], isHashtag: false },
          ].map(({ label, items, isHashtag }) => (
            <div key={label} className={cn("space-y-1.5")}>
              <div className={cn("flex items-center justify-between")}>
                <span className={cn("text-[10px] text-slate-400 uppercase font-mono tracking-wider font-bold")}>{label}</span>
                {!_.isEmpty(items) && (
                  <Button type={REFACTOR_CONSTANTS.BUTTON_TYPE_BUTTON} variant={REFACTOR_CONSTANTS.VARIANT_UNSTYLED} onClick={() => handleCopyTags(items, isHashtag)} className={cn("text-slate-500 hover:text-slate-100 p-1 rounded hover:bg-slate-900 shrink-0 h-auto cursor-pointer")} title={AUTO_GENERATOR_CONSTANTS.UI_SEO_COPY_TAGS_TOOLTIP}>
                    <Copy className={cn("w-3.5 h-3.5")} />
                  </Button>
                )}
              </div>
              <div className={cn("flex flex-wrap gap-1.5")}>
                {_.map(items, (tag, i) => (
                  <span key={i} className={isHashtag ? "bg-slate-955/60 border border-slate-800 text-rose-400 font-mono text-[10px] px-2 py-1 rounded-lg" : "bg-slate-955/60 border border-slate-800 text-slate-300 font-sans text-[10px] px-2 py-1 rounded-lg"}>
                    {isHashtag ? `#${tag.replace(/^#+/, REFACTOR_CONSTANTS.VD_EMPTY_STRING)}` : tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
