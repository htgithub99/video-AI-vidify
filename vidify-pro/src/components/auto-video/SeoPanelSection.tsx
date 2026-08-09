import _ from "lodash";
import { Copy, Target } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../ui/Button";
import { REFACTOR_CONSTANTS } from "../../constants";
import { AUTO_GENERATOR_CONSTANTS } from "../../constants/config";

interface SeoPanelSectionProps {
  activeCreatedProject: any;
  T: any;
}

export const SeoPanelSection: React.FC<SeoPanelSectionProps> = ({
  activeCreatedProject,
  T,
}) => {
  if (
    !activeCreatedProject?.seo ||
    (_.isEmpty(activeCreatedProject.seo.titles) &&
      _.isEmpty(activeCreatedProject.seo.descriptions))
  ) {
    return null;
  }

  return (
    <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4 shadow-xl col-span-1 sm:col-span-2 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 rounded-full blur-2xl pointer-events-none" />

      <h3
        className="text-xs font-bold text-slate-100 font-mono uppercase flex items-center gap-2"
        title={T.seoTitleTooltip}
      >
        <Target className="w-4 h-4 text-sky-400" /> {T.seoTitle}
      </h3>

      <div className="bg-slate-950 rounded-2xl border border-slate-800/80 p-4 shadow-inner space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider font-bold">
              {AUTO_GENERATOR_CONSTANTS.UI_SEO_TITLE_SUGGESTION}
            </span>
            <div className="space-y-2">
              {_.map(activeCreatedProject.seo.titles || [], (title, i) => (
                <div
                  key={i}
                  className="bg-slate-955/60 border border-slate-800 p-2.5 rounded-xl flex items-center justify-between gap-3 group"
                >
                  <p className="text-[11px] font-bold text-slate-200">
                    {title.text}
                  </p>
                  <Button
                    type={REFACTOR_CONSTANTS.BUTTON_TYPE_BUTTON}
                    variant={REFACTOR_CONSTANTS.VARIANT_UNSTYLED}
                    onClick={() => {
                      navigator.clipboard.writeText(title.text);
                      toast.success(
                        AUTO_GENERATOR_CONSTANTS.UI_SEO_COPIED_TITLE,
                      );
                    }}
                    className="text-slate-500 hover:text-slate-100 p-1 rounded hover:bg-slate-900 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 h-auto"
                    title={AUTO_GENERATOR_CONSTANTS.UI_SEO_COPY_TITLE_TOOLTIP}
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider font-bold">
              {AUTO_GENERATOR_CONSTANTS.UI_SEO_DESC_SUGGESTION}
            </span>
            <div className="space-y-2">
              {_.map(activeCreatedProject.seo.descriptions || [], (desc, i) => (
                <div
                  key={i}
                  className="bg-slate-950/60 border border-slate-800/80 p-3 rounded-2xl flex items-start justify-between gap-3"
                >
                  <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                    {desc.text}
                  </p>
                  <Button
                    type={REFACTOR_CONSTANTS.BUTTON_TYPE_BUTTON}
                    variant={REFACTOR_CONSTANTS.VARIANT_UNSTYLED}
                    onClick={() => {
                      navigator.clipboard.writeText(desc.text);
                      toast.success(
                        AUTO_GENERATOR_CONSTANTS.UI_SEO_COPIED_DESC,
                      );
                    }}
                    className="text-slate-500 hover:text-slate-100 p-1 rounded hover:bg-slate-900 shrink-0 h-auto"
                    title={AUTO_GENERATOR_CONSTANTS.UI_SEO_COPY_DESC_TOOLTIP}
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
          {[
            {
              label: AUTO_GENERATOR_CONSTANTS.UI_SEO_HASHTAGS,
              items: activeCreatedProject.seo.hashtags || [],
              isHashtag: true,
            },
            {
              label: AUTO_GENERATOR_CONSTANTS.UI_SEO_TAGS,
              items: activeCreatedProject.seo.tags || [],
              isHashtag: false,
            },
          ].map(({ label, items, isHashtag }) => (
            <div key={label} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider font-bold">
                  {label}
                </span>
                {!_.isEmpty(items) && (
                  <Button
                    type={REFACTOR_CONSTANTS.BUTTON_TYPE_BUTTON}
                    variant={REFACTOR_CONSTANTS.VARIANT_UNSTYLED}
                    onClick={() => {
                      const textToCopy = isHashtag
                        ? _.map(
                            items,
                            (t) =>
                              `#${t.replace(/^#+/, REFACTOR_CONSTANTS.VD_EMPTY_STRING)}`,
                          ).join(" ")
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
                        ? "bg-slate-955/60 border border-slate-800 text-sky-400 font-mono text-[10px] px-2 py-1 rounded-lg"
                        : "bg-slate-955/60 border border-slate-800 text-slate-300 font-sans text-[10px] px-2 py-1 rounded-lg"
                    }
                  >
                    {isHashtag
                      ? `#${tag.replace(/^#+/, REFACTOR_CONSTANTS.VD_EMPTY_STRING)}`
                      : tag}
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
