import { RUNTIME_TEXT as RT_SHARED } from "../../../constants/runtime/shared.js";
import { CopyButton } from "../../../components/common/CopyButton.js";
import { useClipboardFeedback } from "../../../hooks/useClipboardFeedback.js";
import { CLIPBOARD_FEEDBACK } from "../../../constants/clipboardFeedback.js";
import { RUNTIME_TEXT as RT_VIDEO_GENERATION } from "../constants/runtimeText.js";
import { StudioCard } from "../../../components/ui/Studio.js";
import { SOURCE_TEMPLATE_SYMBOL_30, SOURCE_TEMPLATE_SYMBOL_31, SOURCE_TEXT_ROTATIONLOGS, SOURCE_TEXT_SEO_SOURCE_FALLBACK_USED, SOURCE_TEXT_SYMBOL_10 } from "../../../constants/sourceText";
import { cn } from "../../../lib/utils";
import React from "react";
import _ from "lodash";
import { Target } from "lucide-react";
import { REFACTOR_CONSTANTS } from "../../../constants";
import { AUTO_GENERATOR_CONSTANTS } from "../../../constants/config";
import { AUTO_VIDEO_UI_TEXTS } from "../../../constants/texts";
import { VideoProject } from "../../../types";
interface SeoPanelSectionProps {
  activeCreatedProject: VideoProject | null | undefined;
}
export const SeoPanelSection: React.FC<SeoPanelSectionProps> = ({ activeCreatedProject }) => {
  const { copyText } = useClipboardFeedback();
  const seo = activeCreatedProject?.seo;
  if (!seo || (_.isEmpty(seo.titles) && _.isEmpty(seo.descriptions))) {
    return null;
  }
  const uiTexts = AUTO_VIDEO_UI_TEXTS.vi;
  const scoreAvailable = (score: unknown): boolean => _.isFinite(score) && _.gte(_.toNumber(score), 0);
  const usesUnscoredFallback = _.some(seo.titles, (title) => !scoreAvailable(title.seoScore)) || _.includes(_.castArray(_.get(seo, SOURCE_TEXT_ROTATIONLOGS)), SOURCE_TEXT_SEO_SOURCE_FALLBACK_USED) || _.every(seo.titles, (title) => _.every([title.searchScore, title.ctrScore, title.compScore, title.seoScore], (score) => _.isEqual(score, 0)));
  const handleCopyTitle = (text: string) => {
    void copyText(text, CLIPBOARD_FEEDBACK.ALL, AUTO_GENERATOR_CONSTANTS.UI_SEO_COPIED_TITLE);
  };
  const handleCopyDesc = (text: string) => {
    void copyText(text, CLIPBOARD_FEEDBACK.ALL, AUTO_GENERATOR_CONSTANTS.UI_SEO_COPIED_DESC);
  };
  const handleCopyTags = (items: string[], isHashtag: boolean) => {
    const textToCopy = isHashtag ? _.map(items, (t) => SOURCE_TEMPLATE_SYMBOL_30(`${t.replace(/^#+/, REFACTOR_CONSTANTS.VD_EMPTY_STRING)}`)).join(RT_SHARED.SYMBOL_36A9E7) : items.join(SOURCE_TEXT_SYMBOL_10);
    void copyText(textToCopy, CLIPBOARD_FEEDBACK.ALL, AUTO_GENERATOR_CONSTANTS.UI_SEO_COPIED_TAGS);
  };
  return (
    <StudioCard className={cn(RT_VIDEO_GENERATION.BG_SLATE_900_90_BORDER_BORDER_SLATE_800_P_5)}>
      <h3 className={cn(RT_VIDEO_GENERATION.TEXT_XS_FONT_BOLD_TEXT_SLATE_100_FONT_MONO_UPPERCASE_5E84F2)} title={AUTO_GENERATOR_CONSTANTS.UI_SEO_TITLE_TOOLTIP}>
        <Target className={cn(RT_SHARED.W_4_H_4_TEXT_ROSE_500)} /> {AUTO_GENERATOR_CONSTANTS.UI_SEO_TITLE_SHORT}
      </h3>
      {usesUnscoredFallback && <div className={cn(RT_VIDEO_GENERATION.ROUNDED_XL_BORDER_BORDER_AMBER_800_50_BG_AMBER_950)}>{uiTexts.seoUnscoredWarning}</div>}
      <div className={cn(RT_VIDEO_GENERATION.SPACE_Y_4)}>
        <div className={cn(RT_SHARED.SPACE_Y_2)}>
          <span className={cn(RT_VIDEO_GENERATION.TEXT_10PX_TEXT_SLATE_400_FONT_MONO_FONT_BOLD_UPPERCASE)} title={AUTO_GENERATOR_CONSTANTS.UI_SEO_TITLE_SUGGESTION_TOOLTIP}>
            {AUTO_GENERATOR_CONSTANTS.UI_SEO_TITLE_SUGGESTION}
          </span>
          <div className={cn(RT_VIDEO_GENERATION.SPACE_Y_3)}>
            {_.map(seo.titles || [], (title, i) => (
              <div key={i} className={cn(RT_VIDEO_GENERATION.BG_SLATE_955_60_BORDER_BORDER_SLATE_800_80_P)}>
                <div className={cn(RT_VIDEO_GENERATION.FLEX_ITEMS_START_JUSTIFY_BETWEEN_GAP_3)}>
                  <p className={cn(RT_VIDEO_GENERATION.FONT_BOLD_TEXT_SLATE_100_TEXT_XS_LEADING_SNUG)}>{title.text}</p>
                  <CopyButton onClick={() => handleCopyTitle(title.text)} className={cn(RT_VIDEO_GENERATION.TEXT_SLATE_500_HOVER_TEXT_SLATE_100_P_1_ROUNDED)} title={AUTO_GENERATOR_CONSTANTS.UI_SEO_COPY_TITLE_TOOLTIP} iconClassName={RT_SHARED.W_3_5_H_3_5} />
                </div>
                <div className={cn(RT_VIDEO_GENERATION.GRID_GRID_COLS_4_GAP_2_PT_2_BORDER_T)}>
                  {_.map(
                    [
                      { label: AUTO_GENERATOR_CONSTANTS.UI_SEO_METRIC_SEARCH, score: title.searchScore },
                      { label: AUTO_GENERATOR_CONSTANTS.UI_SEO_METRIC_CTR, score: title.ctrScore },
                      { label: AUTO_GENERATOR_CONSTANTS.UI_SEO_METRIC_COMPET, score: title.compScore },
                      { label: AUTO_GENERATOR_CONSTANTS.UI_SEO_METRIC_SEO, score: title.seoScore },
                    ],
                    ({ label, score }) => (
                      <div key={label}>
                        <div className={cn(RT_VIDEO_GENERATION.FLEX_JUSTIFY_BETWEEN_MB_0_5_TEXT_SLATE_400)}>
                          <span>{label}</span>
                          <span className={cn(RT_VIDEO_GENERATION.TEXT_ROSE_450_FONT_BOLD)}>{!usesUnscoredFallback && scoreAvailable(score) ? SOURCE_TEMPLATE_SYMBOL_31(`${score}`) : uiTexts.notMeasured}</span>
                        </div>
                        <div className={cn(RT_VIDEO_GENERATION.W_FULL_BG_SLATE_900_H_1_ROUNDED_FULL_OVERFLOW)}>
                          <div className={cn(RT_VIDEO_GENERATION.BG_ROSE_500_H_FULL)} style={{ width: `${!usesUnscoredFallback && scoreAvailable(score) ? score : 0}${RT_SHARED.SYMBOL}` }} />
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className={cn(RT_VIDEO_GENERATION.SPACE_Y_2_PT_2_BORDER_T_BORDER_SLATE_800)}>
          <span className={cn(RT_VIDEO_GENERATION.TEXT_10PX_TEXT_SLATE_400_FONT_MONO_FONT_BOLD_UPPERCASE)} title={AUTO_GENERATOR_CONSTANTS.UI_SEO_DESC_SUGGESTION_TOOLTIP}>
            {AUTO_GENERATOR_CONSTANTS.UI_SEO_DESC_SUGGESTION}
          </span>
          <div className={cn(RT_SHARED.SPACE_Y_2)}>
            {_.map(seo.descriptions || [], (desc, i) => (
              <div key={i} className={cn(RT_VIDEO_GENERATION.BG_SLATE_955_60_BORDER_BORDER_SLATE_800_80_P_55C5CD)}>
                <p className={cn(RT_VIDEO_GENERATION.TEXT_11PX_TEXT_SLATE_300_LEADING_RELAXED_FONT_SANS)}>{desc.text}</p>
                <CopyButton onClick={() => handleCopyDesc(desc.text)} className={cn(RT_VIDEO_GENERATION.TEXT_SLATE_500_HOVER_TEXT_SLATE_100_P_1_ROUNDED)} title={AUTO_GENERATOR_CONSTANTS.UI_SEO_COPY_DESC_TOOLTIP} iconClassName={RT_SHARED.W_3_5_H_3_5} />
              </div>
            ))}
          </div>
        </div>
        <div className={cn(RT_VIDEO_GENERATION.GRID_GRID_COLS_2_GAP_3_PT_2_BORDER_T)}>
          {_.map(
            [
              { label: AUTO_GENERATOR_CONSTANTS.UI_SEO_HASHTAGS, items: seo.hashtags || [], isHashtag: true },
              { label: AUTO_GENERATOR_CONSTANTS.UI_SEO_TAGS, items: seo.tags || [], isHashtag: false },
            ],
            ({ label, items, isHashtag }) => (
              <div key={label} className={cn(RT_SHARED.SPACE_Y_1_5)}>
                <div className={cn(RT_SHARED.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN)}>
                  <span className={cn(RT_VIDEO_GENERATION.TEXT_10PX_TEXT_SLATE_400_UPPERCASE_FONT_MONO_TRACKING_WIDER)}>{label}</span>
                  {!_.isEmpty(items) && <CopyButton onClick={() => handleCopyTags(items, isHashtag)} className={cn(RT_VIDEO_GENERATION.TEXT_SLATE_500_HOVER_TEXT_SLATE_100_P_1_ROUNDED)} title={AUTO_GENERATOR_CONSTANTS.UI_SEO_COPY_TAGS_TOOLTIP} iconClassName={RT_SHARED.W_3_5_H_3_5} />}
                </div>
                <div className={cn(RT_SHARED.FLEX_FLEX_WRAP_GAP_1_5)}>
                  {_.map(items, (tag, i) => (
                    <span key={i} className={cn(RT_VIDEO_GENERATION.BG_SLATE_955_60_BORDER_BORDER_SLATE_800_TEXT_10PX, { "text-rose-400 font-mono": isHashtag, "text-slate-300 font-sans": !isHashtag })}>
                      {isHashtag ? SOURCE_TEMPLATE_SYMBOL_30(`${tag.replace(/^#+/, REFACTOR_CONSTANTS.VD_EMPTY_STRING)}`) : tag}
                    </span>
                  ))}
                </div>
              </div>
            ),
          )}
        </div>
      </div>
    </StudioCard>
  );
};
