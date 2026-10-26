import { StudioCard } from "../ui/Studio.js";
import * as MR from "../../constants/motionRuntime.js";
import { MOTION_SEO_TEXTS } from "../../constants/motionVideoTexts";
import { Check, Copy, Download, FileText, Image as ImageIcon, Maximize2, RefreshCw, Search, SlidersHorizontal, Sparkles, Clock } from "lucide-react";
import { useMemo, useState, type FC } from "react";
import { useMotionClipboard } from "../../hooks/useMotionClipboard";
import { MotionCopyButton } from "./MotionCopyButton";
import { chapterLines, renderSeoDescription, renderSeoOptionText } from "../../lib/motionSeo";
import { cn } from "../../lib/utils";
import type { MotionSeoOption, MotionSeoPack, MotionThumbnail } from "../../types/motionVideo";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";
interface MotionSeoCardProps {
  seo: MotionSeoPack | null;
  busy: boolean;
  canGenerate: boolean;
  onGenerate: () => void;
  lang?: string;
  thumbnail?: MotionThumbnail | null;
  thumbnails?: Record<number, MotionThumbnail>;
  onThumbnail?: (optionIndex: number) => void;
}
export const MotionSeoCard: FC<MotionSeoCardProps> = ({ seo, busy, canGenerate, onGenerate, lang, thumbnail, thumbnails, onThumbnail }) => {
  const { copiedKey, copyText: handleCopy } = useMotionClipboard();
  const [zoomModal, setZoomModal] = useState<{ image: string; prompt: string; optionIndex?: number } | null>(null);
  const t = lang === MR.MOTION_TEXT_EN ? MOTION_SEO_TEXTS.en : MOTION_SEO_TEXTS.vi;
  const thumbList = useMemo(() => {
    const map = thumbnails || {};
    const items: Array<MotionThumbnail & { optionIndex: number }> = [];
    const totalOptions = seo?.options?.length || 5;
    for (let i = 0; i < totalOptions; i++) {
      if (map[i]) {
        items.push({ ...map[i], optionIndex: i });
      }
    }
    if (items.length === 0 && thumbnail) {
      items.push({ ...thumbnail, optionIndex: thumbnail.optionIndex ?? 0 });
    }
    return items;
  }, [thumbnails, thumbnail, seo]);
  const all = seo ? seo.options.map((option, index) => renderSeoOptionText(option, seo, index, t)).join(MR.MOTION_TEXT_SYMBOL_4) : "";
  const handleCopyFullOption = (option: MotionSeoOption, index: number) => {
    if (seo) handleCopy(renderSeoOptionText(option, seo, index, t), MR.MOTION_TEMPLATE_SEO_FULL(index), t.copied);
  };
  const renderCopyField = (value: string, key: string, titleText?: string) => (
    <MotionCopyButton
      copied={copiedKey === key}
      onClick={() => handleCopy(value, key, t.copied)}
      title={copiedKey === key ? t.copied : titleText || t.copy}
      className={MR.MOTION_TEXT_BTN_ICON_TINY_W_6_H_6_MIN_W_24PX_MAX_W_24PX_MIN_H_24PX_MAX_H_24PX}
      copiedIconClassName={MR.MOTION_TEXT_W_3_5_H_3_5_TEXT_EMERALD_500_DARK_TEXT_EMERALD_400_SHRINK_0}
      iconClassName={MR.MOTION_TEXT_W_3_5_H_3_5_SHRINK_0}
    />
  );
  const chaptersText = seo ? chapterLines(seo) : "";
  return (
    <StudioCard className={MR.MOTION_TEXT_ROUNDED_2XL_BORDER_BORDER_SLATE_200_90_DARK_BORDER_SLATE_800_80_B}>
      <div className={MR.MOTION_TEXT_FLEX_FLEX_WRAP_ITEMS_CENTER_JUSTIFY_BETWEEN_GAP_2_BORDER_B_BORDER}>
        <div className={MR.MOTION_TEXT_FLEX_ITEMS_CENTER_GAP_2}>
          <Sparkles className={MR.MOTION_TEXT_W_4_H_4_TEXT_FUCHSIA_500_SHRINK_0} />
          <h3 className={MR.MOTION_TEXT_TEXT_SM_SM_TEXT_BASE_FONT_EXTRABOLD_TEXT_0F172A_DARK_TEXT_SLATE_1}>{t.title}</h3>
          {seo && (
            <span className={MR.MOTION_TEXT_TEXT_11PX_FONT_NORMAL_TEXT_64748B_DARK_TEXT_SLATE_400}>
              {MR.MOTION_TEXT_SYMBOL_15}
              {seo.timingFrom === MR.MOTION_TEXT_VOICE ? t.voice : t.estimate}
            </span>
          )}
        </div>
        <div className={MR.MOTION_TEXT_FLEX_ITEMS_CENTER_GAP_2_FLEX_WRAP}>
          {seo && (
            <>
              <span className={MR.MOTION_TEXT_TEXT_11PX_FONT_MONO_FONT_BOLD_TEXT_A21CAF_DARK_TEXT_FUCHSIA_300_B}>
                {seo.options.length} {t.option.toLowerCase()}
              </span>
              <Button
                variant={MR.MOTION_TEXT_UNSTYLED}
                type={MR.MOTION_TEXT_BUTTON}
                onClick={() => handleCopy(all, MR.MOTION_TEXT_SEO_ALL, t.copied)}
                className={cn(MR.MOTION_TEXT_H_8_PX_3_ROUNDED_LG_INLINE_FLEX_ITEMS_CENTER_JUSTIFY_CENTER_GAP_1, copiedKey === MR.MOTION_TEXT_SEO_ALL ? MR.MOTION_TEXT_BG_GRADIENT_TO_R_FROM_EMERALD_600_TO_TEAL_600_HOVER_FROM_EMERALD_ : MR.MOTION_TEXT_BG_GRADIENT_TO_R_FROM_PURPLE_600_TO_PINK_600_HOVER_FROM_PURPLE_50)}>
                {copiedKey === MR.MOTION_TEXT_SEO_ALL ? <Check className={MR.MOTION_TEXT_W_3_5_H_3_5_SHRINK_0_TEXT_WHITE} /> : <Copy className={MR.MOTION_TEXT_W_3_5_H_3_5_SHRINK_0_TEXT_WHITE} />}
                <span>{copiedKey === MR.MOTION_TEXT_SEO_ALL ? t.copied : t.copyAll}</span>
              </Button>
            </>
          )}
          <Button variant={MR.MOTION_TEXT_UNSTYLED} type={MR.MOTION_TEXT_BUTTON} disabled={busy || !canGenerate} onClick={onGenerate} className={MR.MOTION_TEXT_H_8_PX_3_ROUNDED_LG_INLINE_FLEX_ITEMS_CENTER_JUSTIFY_CENTER_GAP_1_2}>
            <RefreshCw className={cn(MR.MOTION_TEXT_W_3_5_H_3_5, busy && MR.MOTION_TEXT_ANIMATE_SPIN)} />
            <span>{seo ? t.regenerate : t.generate}</span>
          </Button>
        </div>
      </div>
      {onThumbnail && (
        <div className={MR.MOTION_TEXT_ROUNDED_XL_BORDER_BORDER_SLATE_200_90_DARK_BORDER_SLATE_800_80_BG}>
          <div className={MR.MOTION_TEXT_FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN_GAP_2_FLEX_WRAP}>
            <span className={MR.MOTION_TEXT_FONT_BOLD_TEXT_0F172A_DARK_TEXT_SLATE_100_FLEX_ITEMS_CENTER_GAP_2}>
              <ImageIcon className={MR.MOTION_TEXT_W_4_H_4_TEXT_PURPLE_600_DARK_TEXT_PURPLE_400} />
              <span>{t.thumb}</span>
              {thumbList.length > 0 && (
                <span className={MR.MOTION_TEXT_PX_2_PY_0_5_ROUNDED_FULL_BG_PURPLE_500_15_BORDER_BORDER_PURPLE_50_2}>
                  {thumbList.length}
                  {MR.MOTION_TEXT_SYMBOL_16}
                  {seo?.options?.length || 5}
                </span>
              )}
            </span>
            {!seo && (
              <Button variant={MR.MOTION_TEXT_UNSTYLED} type={MR.MOTION_TEXT_BUTTON} disabled={busy} onClick={() => onThumbnail(0)} className={MR.MOTION_TEXT_H_8_PX_3_ROUNDED_LG_INLINE_FLEX_ITEMS_CENTER_JUSTIFY_CENTER_GAP_1_3}>
                <ImageIcon className={MR.MOTION_TEXT_W_3_5_H_3_5} />
                <span>{t.thumbMake}</span>
              </Button>
            )}
          </div>
          {thumbList.length > 0 ? (
            <div className={MR.MOTION_TEXT_GRID_GRID_COLS_1_SM_GRID_COLS_2_XL_GRID_COLS_3_GAP_3_PT_1}>
              {thumbList.map((thumb) => (
                <div key={thumb.optionIndex} onClick={() => setZoomModal(thumb)} className={MR.MOTION_TEXT_GROUP_RELATIVE_ASPECT_VIDEO_ROUNDED_XL_OVERFLOW_HIDDEN_BORDER_BOR_2}>
                  <img src={thumb.image} alt={MR.MOTION_TEMPLATE_SYMBOL_44(t.thumb, thumb.optionIndex + 1)} className={MR.MOTION_TEXT_W_FULL_H_FULL_OBJECT_COVER_TRANSITION_TRANSFORM_DURATION_500_GROU} loading={MR.MOTION_TEXT_LAZY} />
                  <div className={MR.MOTION_TEXT_ABSOLUTE_INSET_0_BG_GRADIENT_TO_T_FROM_SLATE_950_80_VIA_TRANSPARE_2} />
                  <div className={MR.MOTION_TEXT_ABSOLUTE_TOP_2_LEFT_2_POINTER_EVENTS_NONE}>
                    <span className={MR.MOTION_TEXT_PX_2_PY_0_5_ROUNDED_MD_BG_SLATE_950_85_BACKDROP_BLUR_MD_TEXT_10PX_2}>
                      {t.option} {thumb.optionIndex + 1}
                    </span>
                  </div>
                  <a href={thumb.image} download={MR.MOTION_TEMPLATE_THUMBNAIL_OPTION_PNG(thumb.optionIndex + 1)} onClick={(e) => e.stopPropagation()} title={t.download} aria-label={t.download} className={MR.MOTION_TEXT_ABSOLUTE_TOP_2_RIGHT_2_Z_10_W_7_H_7_ROUNDED_LG_BG_TRANSPARENT_HOV}>
                    <Download className={MR.MOTION_TEXT_W_3_5_H_3_5} />
                  </a>
                  <div className={MR.MOTION_TEXT_ABSOLUTE_INSET_0_FLEX_ITEMS_CENTER_JUSTIFY_CENTER_BG_BLACK_30_OPA}>
                    <div className={MR.MOTION_TEXT_W_8_H_8_ROUNDED_FULL_BG_SLATE_950_85_BORDER_BORDER_PURPLE_400_50__2}>
                      <Maximize2 className={MR.MOTION_TEXT_W_3_5_H_3_5} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className={MR.MOTION_TEXT_TEXT_XS_TEXT_64748B_DARK_TEXT_SLATE_400_LEADING_RELAXED}>{t.thumbHint}</p>
          )}
          {zoomModal && (
            <Modal
              isOpen
              onClose={() => setZoomModal(null)}
              maxWidth={MR.MOTION_TEXT_4XL}
              title={
                <div className={MR.MOTION_TEXT_FLEX_ITEMS_CENTER_GAP_2}>
                  <ImageIcon className={MR.MOTION_TEXT_W_4_H_4_TEXT_PURPLE_600_DARK_TEXT_PURPLE_400_SHRINK_0} />
                  <span className={MR.MOTION_TEXT_TRUNCATE}>
                    {t.thumb} {zoomModal.optionIndex !== undefined ? MR.MOTION_TEMPLATE_SYMBOL_45(t.thumbFor, zoomModal.optionIndex + 1) : ""}
                  </span>
                </div>
              }>
              <div className={MR.MOTION_TEXT_SPACE_Y_4}>
                <div className={MR.MOTION_TEXT_RELATIVE_W_FULL_ROUNDED_2XL_OVERFLOW_HIDDEN_BG_BLACK_95_BORDER_BO_2}>
                  <img src={zoomModal.image} alt={t.thumb} className={MR.MOTION_TEXT_MAX_W_FULL_MAX_H_65VH_OBJECT_CONTAIN_ROUNDED_XL_SELECT_NONE} />
                </div>
                {zoomModal.prompt && (
                  <div className={MR.MOTION_TEXT_P_3_5_ROUNDED_XL_BG_SLATE_100_DARK_BG_SLATE_900_90_BORDER_BORDER__2}>
                    <div className={MR.MOTION_TEXT_FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN}>
                      <span className={MR.MOTION_TEXT_TEXT_10PX_FONT_MONO_FONT_BOLD_UPPERCASE_TRACKING_WIDER_TEXT_PURPL}>
                        <Sparkles className={MR.MOTION_TEXT_W_3_H_3_TEXT_PURPLE_600_DARK_TEXT_PURPLE_400} />
                        <span>{t.prompt}</span>
                      </span>
                      <Button variant={MR.MOTION_TEXT_UNSTYLED} type={MR.MOTION_TEXT_BUTTON} onClick={() => handleCopy(zoomModal.prompt, MR.MOTION_TEXT_ZOOM_PROMPT, t.copied)} className={MR.MOTION_TEXT_TEXT_11PX_TEXT_SLATE_600_DARK_TEXT_SLATE_400_HOVER_TEXT_PURPLE_60_2}>
                        <Copy className={MR.MOTION_TEXT_W_3_H_3} />
                        <span>{t.copy}</span>
                      </Button>
                    </div>
                    <p className={MR.MOTION_TEXT_TEXT_XS_TEXT_1E293B_DARK_TEXT_SLATE_200_LEADING_RELAXED_FONT_SANS}>{zoomModal.prompt}</p>
                  </div>
                )}
                <div className={MR.MOTION_TEXT_FLEX_ITEMS_CENTER_JUSTIFY_END_GAP_2_5_PT_3_BORDER_T_BORDER_SLATE_}>
                  <a href={zoomModal.image} download={MR.MOTION_TEMPLATE_THUMBNAIL_OPTION_PNG((zoomModal.optionIndex ?? 0) + 1)} className={MR.MOTION_TEXT_H_9_PX_4_PY_2_ROUNDED_XL_TEXT_XS_FONT_BOLD_INLINE_FLEX_ITEMS_CENT}>
                    <Download className={MR.MOTION_TEXT_W_3_5_H_3_5} />
                    <span>{t.download}</span>
                  </a>
                  <Button variant={MR.MOTION_TEXT_UNSTYLED} type={MR.MOTION_TEXT_BUTTON} onClick={() => setZoomModal(null)} className={MR.MOTION_TEXT_H_9_PX_4_PY_2_ROUNDED_XL_TEXT_XS_FONT_BOLD_INLINE_FLEX_ITEMS_CENT_2}>
                    {t.close}
                  </Button>
                </div>
              </div>
            </Modal>
          )}
        </div>
      )}
      {!seo ? (
        <p className={MR.MOTION_TEXT_TEXT_XS_TEXT_64748B_DARK_TEXT_SLATE_400}>{t.hint}</p>
      ) : (
        <div className={MR.MOTION_TEXT_SPACE_Y_4}>
          <div className={MR.MOTION_TEXT_GRID_GRID_COLS_1_MD_GRID_COLS_2_GAP_4_ITEMS_STRETCH}>
            {seo.options.map((opt, i) => {
              const description = renderSeoDescription(opt, seo);
              const hasThumb = Boolean(thumbnails?.[i] || (thumbnail?.optionIndex === i && thumbnail?.image));
              return (
                <StudioCard key={i} className={MR.MOTION_TEXT_P_4_ROUNDED_2XL_BG_WHITE_80_DARK_BG_SLATE_955_90_BORDER_BORDER_SL}>
                  <div className={MR.MOTION_TEXT_FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN_GAP_2_BORDER_B_BORDER_SLATE_200}>
                    <div className={MR.MOTION_TEXT_FLEX_ITEMS_CENTER_GAP_2_MIN_W_0_FLEX_WRAP}>
                      <span className={MR.MOTION_TEXT_INLINE_FLEX_ITEMS_CENTER_JUSTIFY_CENTER_PX_2_5_PY_0_5_ROUNDED_LG_}>
                        {t.option} {i + 1}
                      </span>
                      {opt.sourceTitleBased && <span className={MR.MOTION_TEXT_INLINE_FLEX_ITEMS_CENTER_JUSTIFY_CENTER_PX_2_5_PY_0_5_ROUNDED_LG_}>{t.sourceTitle}</span>}
                      <span className={MR.MOTION_TEXT_INLINE_FLEX_ITEMS_CENTER_GAP_1_PX_2_5_PY_0_5_ROUNDED_LG_BG_EMERAL}>
                        <Sparkles className={MR.MOTION_TEXT_W_3_H_3_TEXT_EMERALD_600_DARK_TEXT_EMERALD_400} />
                        <span>
                          {t.score} {opt.seoScore}
                        </span>
                      </span>
                    </div>
                    <div className={MR.MOTION_TEXT_FLEX_ITEMS_CENTER_GAP_1_5}>
                      {onThumbnail && (
                        <Button
                          variant={MR.MOTION_TEXT_UNSTYLED}
                          type={MR.MOTION_TEXT_BUTTON}
                          disabled={busy}
                          onClick={() => onThumbnail(i)}
                          title={hasThumb ? t.regenerateCover : t.thumbMake}
                          className={cn(MR.MOTION_TEXT_H_7_PX_2_5_ROUNDED_LG_INLINE_FLEX_ITEMS_CENTER_JUSTIFY_CENTER_GAP, hasThumb ? MR.MOTION_TEXT_BG_EMERALD_500_15_BORDER_BORDER_EMERALD_500_30_TEXT_EMERALD_700_D : MR.MOTION_TEXT_BG_PURPLE_500_15_BORDER_BORDER_PURPLE_500_30_TEXT_PURPLE_700_DARK)}>
                          <ImageIcon className={MR.MOTION_TEXT_W_3_H_3} />
                          <span>{hasThumb ? t.regenerateCover : t.thumbMake}</span>
                        </Button>
                      )}
                      <MotionCopyButton
                        copied={copiedKey === MR.MOTION_TEMPLATE_SEO_FULL(i)}
                        onClick={() => handleCopyFullOption(opt, i)}
                        className={MR.MOTION_TEXT_BTN_ICON_TINY_W_7_H_7_MIN_W_28PX_MAX_W_28PX_MIN_H_28PX_MAX_H_28PX}
                        title={copiedKey === MR.MOTION_TEMPLATE_SEO_FULL(i) ? t.copied : t.copy}
                        copiedIconClassName={MR.MOTION_TEXT_W_4_H_4_TEXT_EMERALD_500_DARK_TEXT_EMERALD_400_SHRINK_0}
                        iconClassName={MR.MOTION_TEXT_W_4_H_4_SHRINK_0}
                      />
                    </div>
                  </div>
                  <div className={MR.MOTION_TEXT_SPACE_Y_2_5_FLEX_1_FLEX_FLEX_COL_JUSTIFY_BETWEEN}>
                    <div className={MR.MOTION_TEXT_SPACE_Y_2_5}>
                      <StudioCard className={MR.MOTION_TEXT_P_3_ROUNDED_XL_BG_SLATE_50_90_DARK_BG_SLATE_900_60_BORDER_BORDER_}>
                        <div className={MR.MOTION_TEXT_FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN_GAP_2}>
                          <span className={MR.MOTION_TEXT_TEXT_10PX_UPPERCASE_FONT_MONO_FONT_BOLD_TRACKING_WIDER_TEXT_64748}>
                            <FileText className={MR.MOTION_TEXT_W_3_H_3_TEXT_PURPLE_500} />
                            <span>{t.titleL}</span>
                          </span>
                          {renderCopyField(opt.title, MR.MOTION_TEMPLATE_SEO_TITLE(i))}
                        </div>
                        <h4 className={MR.MOTION_TEXT_TEXT_XS_SM_TEXT_13PX_FONT_BLACK_TEXT_0F172A_DARK_TEXT_SLATE_100_L}>{opt.title}</h4>
                      </StudioCard>
                      <StudioCard className={MR.MOTION_TEXT_P_3_ROUNDED_XL_BG_SLATE_50_90_DARK_BG_SLATE_900_60_BORDER_BORDER_}>
                        <div className={MR.MOTION_TEXT_FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN_GAP_2}>
                          <span className={MR.MOTION_TEXT_TEXT_10PX_UPPERCASE_FONT_MONO_FONT_BOLD_TRACKING_WIDER_TEXT_64748}>
                            <SlidersHorizontal className={MR.MOTION_TEXT_W_3_H_3_TEXT_SKY_500} />
                            <span>{t.descL}</span>
                          </span>
                          {renderCopyField(description, MR.MOTION_TEMPLATE_SEO_DESC(i))}
                        </div>
                        <p className={MR.MOTION_TEXT_TEXT_XS_TEXT_334155_DARK_TEXT_SLATE_300_LEADING_RELAXED_MAX_H_32_}>{description}</p>
                      </StudioCard>
                    </div>
                    <div className={MR.MOTION_TEXT_GRID_GRID_COLS_1_XL_GRID_COLS_2_GAP_2_5_PT_1}>
                      <StudioCard className={MR.MOTION_TEXT_P_3_ROUNDED_XL_BG_SLATE_50_90_DARK_BG_SLATE_900_60_BORDER_BORDER__2}>
                        <div className={MR.MOTION_TEXT_SPACE_Y_2}>
                          <div className={MR.MOTION_TEXT_FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN_GAP_2}>
                            <span className={MR.MOTION_TEXT_TEXT_10PX_UPPERCASE_FONT_MONO_FONT_BOLD_TRACKING_WIDER_TEXT_64748}>
                              <span className={MR.MOTION_TEXT_FONT_BOLD_TEXT_PURPLE_600_DARK_TEXT_PURPLE_400}>{MR.MOTION_TEXT_SYMBOL_44}</span>
                              <span>
                                {t.hashL}
                                {MR.MOTION_TEXT_SYMBOL_6}
                                {opt.hashtags.length}
                                {MR.MOTION_TEXT_SYMBOL_7}
                              </span>
                            </span>
                            {renderCopyField(opt.hashtags.join(" "), MR.MOTION_TEMPLATE_SEO_HASH(i))}
                          </div>
                          <div className={MR.MOTION_TEXT_FLEX_FLEX_WRAP_GAP_X_2_GAP_Y_1_5_MAX_H_24_OVERFLOW_Y_AUTO_SCROLLB}>
                            {opt.hashtags.map((tag, hIdx) => (
                              <span key={hIdx} className={MR.MOTION_TEXT_TEXT_10PX_FONT_MONO_FONT_BOLD_TEXT_7E22CE_DARK_TEXT_PURPLE_300_SE}>
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </StudioCard>
                      <StudioCard className={MR.MOTION_TEXT_P_3_ROUNDED_XL_BG_SLATE_50_90_DARK_BG_SLATE_900_60_BORDER_BORDER__2}>
                        <div className={MR.MOTION_TEXT_SPACE_Y_2}>
                          <div className={MR.MOTION_TEXT_FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN_GAP_2}>
                            <span className={MR.MOTION_TEXT_TEXT_10PX_UPPERCASE_FONT_MONO_FONT_BOLD_TRACKING_WIDER_TEXT_64748}>
                              <Search className={MR.MOTION_TEXT_W_3_H_3_TEXT_EMERALD_500} />
                              <span>
                                {t.tagL}
                                {MR.MOTION_TEXT_SYMBOL_6}
                                {opt.tags.length}
                                {MR.MOTION_TEXT_SYMBOL_7}
                              </span>
                            </span>
                            {renderCopyField(opt.tags.join(MR.MOTION_TEXT_SYMBOL_14), MR.MOTION_TEMPLATE_SEO_TAG(i))}
                          </div>
                          <p className={MR.MOTION_TEXT_TEXT_10PX_FONT_MONO_TEXT_475569_DARK_TEXT_SLATE_300_LEADING_RELAX}>{opt.tags.join(MR.MOTION_TEXT_SYMBOL_14)}</p>
                        </div>
                      </StudioCard>
                    </div>
                  </div>
                </StudioCard>
              );
            })}
          </div>
          {chaptersText && (
            <StudioCard className={MR.MOTION_TEXT_P_4_ROUNDED_2XL_BG_WHITE_80_DARK_BG_SLATE_955_90_BORDER_BORDER_SL_2}>
              <div className={MR.MOTION_TEXT_FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN_GAP_2}>
                <span className={MR.MOTION_TEXT_TEXT_10PX_UPPERCASE_FONT_MONO_FONT_BOLD_TRACKING_WIDER_TEXT_64748}>
                  <Clock className={MR.MOTION_TEXT_W_3_5_H_3_5_TEXT_PURPLE_600_DARK_TEXT_PURPLE_400} />
                  <span>{t.chapters}</span>
                </span>
                {renderCopyField(chaptersText, MR.MOTION_TEXT_SEO_CHAPTERS)}
              </div>
              <pre className={MR.MOTION_TEXT_P_3_ROUNDED_XL_BG_SLATE_50_90_DARK_BG_SLATE_900_60_BORDER_BORDER__3}>{chaptersText}</pre>
            </StudioCard>
          )}
        </div>
      )}
    </StudioCard>
  );
};
