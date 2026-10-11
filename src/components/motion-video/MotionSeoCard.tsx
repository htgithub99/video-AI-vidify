import * as MR from "../../constants/motionRuntime.js";
import { MOTION_SEO_TEXTS } from "../../constants/motionVideoTexts";
import { Copy, Download, Image as ImageIcon, Maximize2, RefreshCw, Search, Sparkles } from "lucide-react";
import { useMemo, useState, type FC } from "react";
import { toast } from "sonner";
import { chapterLines, renderSeoDescription } from "../../lib/motionSeo";
import { cn } from "../../lib/utils";
import type { MotionSeoPack, MotionThumbnail } from "../../types/motionVideo";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";
const copy = (text: string, done: string) => { void navigator.clipboard.writeText(text).then(() => toast.success(done)); };
export const MotionSeoCard: FC<{ seo: MotionSeoPack | null; busy: boolean; canGenerate: boolean; onGenerate: () => void; lang?: string; thumbnail?: MotionThumbnail | null; thumbnails?: Record<number, MotionThumbnail>; onThumbnail?: (optionIndex: number) => void; }> = ({ seo, busy, canGenerate, onGenerate, lang, thumbnail, thumbnails, onThumbnail }) => {
  const [zoomModal, setZoomModal] = useState<{ image: string; prompt: string; optionIndex?: number; } | null>(null);
  const t = lang === MR.MOTION_TEXT_EN ? MOTION_SEO_TEXTS.en : MOTION_SEO_TEXTS.vi;
  const thumbList = useMemo(() => {
    const map = thumbnails || {};
    const items: Array< MotionThumbnail & { optionIndex: number; } > = [];
    const totalOptions = seo?.options?.length || 5;
    for (let i = 0; i < totalOptions; i++) {
      if (map[i]) { items.push({ ...map[i], optionIndex: i }); }
    }
    if (items.length === 0 && thumbnail) { items.push({ ...thumbnail, optionIndex: thumbnail.optionIndex ?? 0 }); }
    return items;
  }, [thumbnails, thumbnail, seo]);
  const all = seo ? seo.options.map((o, i) => MR.MOTION_TEMPLATE_SYMBOL_43(t.option, i + 1, t.score, o.seoScore, t.titleL, o.title, t.descL, renderSeoDescription(o, seo), t.hashL, o.hashtags.join(" "), t.tagL, o.tags.join(MR.MOTION_TEXT_SYMBOL_14))).join(MR.MOTION_TEXT_SYMBOL_4) : "";
  return (
    <div className={MR.MOTION_TEXT_ROUNDED_2XL_BORDER_BORDER_SLATE_200_90_DARK_BORDER_SLATE_700_60_B}>
      <div className={MR.MOTION_TEXT_FLEX_FLEX_WRAP_ITEMS_CENTER_JUSTIFY_BETWEEN_GAP_2_BORDER_B_BORDER}>
        <div className={MR.MOTION_TEXT_FLEX_ITEMS_CENTER_GAP_2_TEXT_SM_FONT_BOLD_TEXT_SLATE_900_DARK_TEX}>
          <Search className={MR.MOTION_TEXT_W_4_H_4_TEXT_PURPLE_600_DARK_TEXT_PURPLE_400} />
          <span>{t.title}</span>
          {seo && (
            <span className={MR.MOTION_TEXT_TEXT_11PX_FONT_NORMAL_TEXT_SLATE_500_DARK_TEXT_SLATE_400}>
              {MR.MOTION_TEXT_SYMBOL_15}
              {seo.timingFrom === MR.MOTION_TEXT_VOICE ? t.voice : t.estimate}
            </span>
          )}
        </div>
        <div className={MR.MOTION_TEXT_FLEX_ITEMS_CENTER_GAP_2}>
          {seo && (
            <Button variant={MR.MOTION_TEXT_UNSTYLED} type={MR.MOTION_TEXT_BUTTON} onClick={() => copy(all, t.copied)} className={MR.MOTION_TEXT_INLINE_FLEX_ITEMS_CENTER_GAP_1_5_PX_3_PY_1_5_ROUNDED_XL_TEXT_XS_F_2}>
              <Copy className={MR.MOTION_TEXT_W_3_5_H_3_5_TEXT_PURPLE_600_DARK_TEXT_PURPLE_400} />
              <span>{t.copyAll}</span>
            </Button>
          )}
          <Button variant={MR.MOTION_TEXT_UNSTYLED} type={MR.MOTION_TEXT_BUTTON} disabled={busy || !canGenerate} onClick={onGenerate} className={MR.MOTION_TEXT_INLINE_FLEX_ITEMS_CENTER_GAP_1_5_PX_3_5_PY_1_5_ROUNDED_XL_TEXT_XS}>
            <RefreshCw className={cn(MR.MOTION_TEXT_W_3_5_H_3_5, busy && MR.MOTION_TEXT_ANIMATE_SPIN)} />
            <span>{seo ? t.regenerate : t.generate}</span>
          </Button>
        </div>
      </div>
      {onThumbnail && (
        <div className={MR.MOTION_TEXT_ROUNDED_XL_BORDER_BORDER_SLATE_200_90_DARK_BORDER_SLATE_700_60_BG}>
          <div className={MR.MOTION_TEXT_FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN_GAP_2_FLEX_WRAP}>
            <span className={MR.MOTION_TEXT_FONT_BOLD_TEXT_SLATE_900_DARK_TEXT_SLATE_100_FLEX_ITEMS_CENTER_GA}>
              <ImageIcon className={MR.MOTION_TEXT_W_3_5_H_3_5_TEXT_PURPLE_600_DARK_TEXT_PURPLE_400} />
              <span>{t.thumb}</span>
              {thumbList.length > 0 && (
                <span className={MR.MOTION_TEXT_PX_2_PY_0_5_ROUNDED_FULL_BG_PURPLE_500_15_BORDER_BORDER_PURPLE_50}>
                  {thumbList.length}
                  {MR.MOTION_TEXT_SYMBOL_16}
                  {seo?.options?.length || 5}
                </span>
              )}
            </span>
            {!seo && (
              <Button variant={MR.MOTION_TEXT_UNSTYLED} type={MR.MOTION_TEXT_BUTTON} disabled={busy} onClick={() => onThumbnail(0)} className={MR.MOTION_TEXT_INLINE_FLEX_ITEMS_CENTER_GAP_1_5_PX_3_PY_1_5_ROUNDED_XL_TEXT_XS_F_3}>
                <ImageIcon className={MR.MOTION_TEXT_W_3_5_H_3_5} />
                <span>{t.thumbMake}</span>
              </Button>
            )}
          </div>
          {thumbList.length > 0 ? (
            <div className={MR.MOTION_TEXT_GRID_GRID_COLS_1_SM_GRID_COLS_2_XL_GRID_COLS_3_GAP_3_PT_1}>
              {thumbList.map((thumb) => (
                <div key={thumb.optionIndex} onClick={() => setZoomModal(thumb)} className={MR.MOTION_TEXT_GROUP_RELATIVE_ASPECT_VIDEO_ROUNDED_XL_OVERFLOW_HIDDEN_BORDER_BOR}>
                  <img src={thumb.image} alt={MR.MOTION_TEMPLATE_SYMBOL_44(t.thumb, thumb.optionIndex + 1)} className={MR.MOTION_TEXT_W_FULL_H_FULL_OBJECT_COVER_TRANSITION_TRANSFORM_DURATION_500_GROU} loading={MR.MOTION_TEXT_LAZY} />
                  <div className={MR.MOTION_TEXT_ABSOLUTE_INSET_0_BG_GRADIENT_TO_T_FROM_SLATE_950_80_VIA_TRANSPARE} />
                  <div className={MR.MOTION_TEXT_ABSOLUTE_TOP_2_LEFT_2_POINTER_EVENTS_NONE}>
                    <span className={MR.MOTION_TEXT_PX_2_PY_0_5_ROUNDED_MD_BG_SLATE_950_85_BACKDROP_BLUR_MD_TEXT_10PX}>
                      {t.option} {thumb.optionIndex + 1}
                    </span>
                  </div>
                  <a href={thumb.image} download={MR.MOTION_TEMPLATE_THUMBNAIL_OPTION_PNG(thumb.optionIndex + 1)} onClick={(e) => e.stopPropagation()} title={t.download} aria-label={t.download} className={MR.MOTION_TEXT_ABSOLUTE_TOP_2_RIGHT_2_Z_10_W_7_H_7_ROUNDED_LG_BG_SLATE_950_85_HO}>
                    <Download className={MR.MOTION_TEXT_W_3_5_H_3_5} />
                  </a>
                  <div className={MR.MOTION_TEXT_ABSOLUTE_INSET_0_FLEX_ITEMS_CENTER_JUSTIFY_CENTER_BG_BLACK_40_OPA}>
                    <div className={MR.MOTION_TEXT_W_8_H_8_ROUNDED_FULL_BG_SLATE_950_85_BORDER_BORDER_PURPLE_400_50_}>
                      <Maximize2 className={MR.MOTION_TEXT_W_3_5_H_3_5} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className={MR.MOTION_TEXT_TEXT_SLATE_500_DARK_TEXT_SLATE_400_LEADING_RELAXED}>{t.thumbHint}</p>
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
                <div className={MR.MOTION_TEXT_RELATIVE_W_FULL_ROUNDED_2XL_OVERFLOW_HIDDEN_BG_BLACK_95_BORDER_BO}>
                  <img src={zoomModal.image} alt={t.thumb} className={MR.MOTION_TEXT_MAX_W_FULL_MAX_H_65VH_OBJECT_CONTAIN_ROUNDED_XL_SELECT_NONE} />
                </div>
                {zoomModal.prompt && (
                  <div className={MR.MOTION_TEXT_P_3_5_ROUNDED_XL_BG_SLATE_100_DARK_BG_SLATE_900_90_BORDER_BORDER_}>
                    <div className={MR.MOTION_TEXT_FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN}>
                      <span className={MR.MOTION_TEXT_TEXT_10PX_FONT_MONO_FONT_BOLD_UPPERCASE_TEXT_PURPLE_700_DARK_TEXT}>
                        <Sparkles className={MR.MOTION_TEXT_W_3_H_3} />
                        {t.prompt}
                      </span>
                      <Button variant={MR.MOTION_TEXT_UNSTYLED} type={MR.MOTION_TEXT_BUTTON} onClick={() => copy(zoomModal.prompt, t.copied)} className={MR.MOTION_TEXT_TEXT_11PX_TEXT_SLATE_600_DARK_TEXT_SLATE_400_HOVER_TEXT_PURPLE_60}>
                        <Copy className={MR.MOTION_TEXT_W_3_H_3} />
                        <span>{t.copy}</span>
                      </Button>
                    </div>
                    <p className={MR.MOTION_TEXT_TEXT_SLATE_800_DARK_TEXT_SLATE_200_LEADING_RELAXED_FONT_SANS_TEXT}>{zoomModal.prompt}</p>
                  </div>
                )}
                <div className={MR.MOTION_TEXT_FLEX_ITEMS_CENTER_JUSTIFY_END_GAP_2_5_PT_3_BORDER_T_BORDER_SLATE_}>
                  <a href={zoomModal.image} download={MR.MOTION_TEMPLATE_THUMBNAIL_OPTION_PNG_2((zoomModal.optionIndex ?? 0) + 1)} className={MR.MOTION_TEXT_H_9_MIN_H_36PX_PX_4_PY_2_ROUNDED_XL_TEXT_XS_FONT_BOLD_INLINE_FLEX}>
                    <Download className={MR.MOTION_TEXT_W_3_5_H_3_5} />
                    <span>{t.download}</span>
                  </a>
                  <Button variant={MR.MOTION_TEXT_UNSTYLED} type={MR.MOTION_TEXT_BUTTON} onClick={() => setZoomModal(null)} className={MR.MOTION_TEXT_H_9_MIN_H_36PX_PX_4_PY_2_ROUNDED_XL_TEXT_XS_FONT_BOLD_INLINE_FLEX_3}>
                    {t.close}
                  </Button>
                </div>
              </div>
            </Modal>
          )}
        </div>
      )}
      {!seo ? (
        <p className={MR.MOTION_TEXT_TEXT_XS_TEXT_SLATE_500_DARK_TEXT_SLATE_400}>{t.hint}</p>
      ) : (
        <div className={MR.MOTION_TEXT_SPACE_Y_3_MAX_H_520PX_OVERFLOW_Y_AUTO_CUSTOM_SCROLLBAR_PR_1}>
          {seo.options.map((o, i) => {
            const description = renderSeoDescription(o, seo);
            const hasThumb = Boolean(thumbnails?.[i] || (thumbnail?.optionIndex === i && thumbnail?.image));
            return (
              <div key={i} className={MR.MOTION_TEXT_ROUNDED_XL_BORDER_BORDER_SLATE_200_90_DARK_BORDER_SLATE_800_BG_WH}>
                <div className={MR.MOTION_TEXT_FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN_GAP_2_BORDER_B_BORDER_SLATE_100}>
                  <span className={MR.MOTION_TEXT_FONT_BOLD_TEXT_PURPLE_700_DARK_TEXT_PURPLE_300_TEXT_XS}>
                    {t.option} {i + 1}
                  </span>
                  <div className={MR.MOTION_TEXT_FLEX_ITEMS_CENTER_GAP_2}>
                    {onThumbnail && (
                      <Button
                        variant={MR.MOTION_TEXT_UNSTYLED}
                        type={MR.MOTION_TEXT_BUTTON}
                        disabled={busy}
                        onClick={() => onThumbnail(i)}
                        className={MR.MOTION_TEMPLATE_INLINE_FLEX_ITEMS_CENTER_GAP_1_5_PX_2_5_PY_1_ROUNDED_LG_TEXT_XS_F(hasThumb ? MR.MOTION_TEXT_BORDER_BORDER_EMERALD_500_40_BG_EMERALD_500_10_TEXT_EMERALD_700_D : MR.MOTION_TEXT_BORDER_BORDER_SLATE_300_DARK_BORDER_SLATE_700_BG_SLATE_100_DARK_B)}>
                        <ImageIcon className={MR.MOTION_TEXT_W_3_5_H_3_5} />
                        <span>{hasThumb ? t.regenerateCover : t.thumbMake}</span>
                      </Button>
                    )}
                    <span className={MR.MOTION_TEXT_ROUNDED_LG_BG_PURPLE_500_10_DARK_BG_PURPLE_500_20_BORDER_BORDER_P}>
                      {t.score} {o.seoScore}
                    </span>
                  </div>
                </div>
                {[
                  [t.titleL, o.title],
                  [t.descL, description],
                  [t.hashL, o.hashtags.join(" ")],
                  [t.tagL, o.tags.join(MR.MOTION_TEXT_SYMBOL_14)],
                ].map(([label, value]) => (
                  <div key={label} className={MR.MOTION_TEXT_FLEX_GAP_2_ITEMS_START_GROUP}>
                    <div className={MR.MOTION_TEXT_FLEX_1_MIN_W_0}>
                      <div className={MR.MOTION_TEXT_TEXT_10PX_FONT_BOLD_UPPERCASE_TRACKING_WIDER_TEXT_SLATE_500_DARK_}>{label}</div>
                      <div className={MR.MOTION_TEXT_WHITESPACE_PRE_WRAP_BREAK_WORDS_TEXT_SLATE_800_DARK_TEXT_SLATE_10}>{value}</div>
                    </div>
                    <Button variant={MR.MOTION_TEXT_UNSTYLED} type={MR.MOTION_TEXT_BUTTON} title={t.copy} aria-label={MR.MOTION_TEMPLATE_SYMBOL_46(t.copy, label)} onClick={() => copy(value, t.copied)} className={MR.MOTION_TEXT_SELF_START_P_1_5_ROUNDED_LG_TEXT_SLATE_400_HOVER_TEXT_PURPLE_600_}>
                      <Copy className={MR.MOTION_TEXT_W_3_5_H_3_5} />
                    </Button>
                  </div>
                ))}
              </div>
            );
          })}
          {chapterLines(seo) && (
            <div className={MR.MOTION_TEXT_ROUNDED_XL_BORDER_BORDER_SLATE_200_90_DARK_BORDER_SLATE_800_BG_WH_2}>
              <div className={MR.MOTION_TEXT_TEXT_10PX_FONT_BOLD_UPPERCASE_TRACKING_WIDER_TEXT_SLATE_500_DARK_}>{t.chapters}</div>
              <pre className={MR.MOTION_TEXT_WHITESPACE_PRE_WRAP_FONT_MONO_TEXT_SLATE_800_DARK_TEXT_SLATE_200_}>{chapterLines(seo)}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
