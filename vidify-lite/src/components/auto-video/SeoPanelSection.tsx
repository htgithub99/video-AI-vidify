import _ from "lodash";
import { Copy, Target } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../ui/Button";
import { REFACTOR_CONSTANTS } from "../../constants";
import { AUTO_GENERATOR_CONSTANTS } from "../../constants/config";

interface SeoPanelSectionProps {
  activeCreatedProject: any;
}

export const SeoPanelSection: React.FC<SeoPanelSectionProps> = ({ activeCreatedProject }) => {
  if (!activeCreatedProject?.seo || (_.isEmpty(activeCreatedProject.seo.titles) && _.isEmpty(activeCreatedProject.seo.descriptions))) {
    return null;
  }

  return (
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
                    onClick={() => { navigator.clipboard.writeText(title.text); toast.success(AUTO_GENERATOR_CONSTANTS.UI_SEO_COPIED_TITLE); }}
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
                  onClick={() => { navigator.clipboard.writeText(desc.text); toast.success(AUTO_GENERATOR_CONSTANTS.UI_SEO_COPIED_DESC); }}
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
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider font-bold">{label}</span>
                {!_.isEmpty(items) && (
                  <Button
                    type={REFACTOR_CONSTANTS.BUTTON_TYPE_BUTTON}
                    variant={REFACTOR_CONSTANTS.VARIANT_UNSTYLED}
                    onClick={() => {
                      const textToCopy = isHashtag
                        ? _.map(items, (t) => `#${t.replace(/^#+/, REFACTOR_CONSTANTS.VD_EMPTY_STRING)}`).join(" ")
                        : items.join(", ");
                      navigator.clipboard.writeText(textToCopy);
                      toast.success(`Đã sao chép ${label.toLowerCase()}!`);
                    }}
                    className="text-slate-500 hover:text-slate-100 p-1 rounded hover:bg-slate-900 shrink-0 h-auto"
                    title={`Copy ${label}`}
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {_.map(items, (tag, i) => (
                  <span
                    key={i}
                    className={
                      isHashtag
                        ? "bg-slate-950/60 border border-slate-800 text-rose-400 font-mono text-[10px] px-2 py-1 rounded-lg"
                        : "bg-slate-950/60 border border-slate-800 text-slate-300 font-sans text-[10px] px-2 py-1 rounded-lg"
                    }
                  >
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
