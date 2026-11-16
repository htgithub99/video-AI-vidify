import { MotionMetricCard } from "./MotionMetricCard";
import { MotionDetailRow } from "./MotionDetailRow";
import { MotionRuleCard } from "./MotionRuleCard";
import { MOTION_RULE_STYLES } from "../constants/motionStyles";
import * as MR from "../../../constants/motionRuntime.js";
import { MOTION_VIDEO_TEXTS } from "../../../constants/motionVideoTexts";
import React, { useState } from "react";
import { Sparkles, ChevronDown, Globe, Users, Film, Clock, SlidersHorizontal, Palette, Check, RefreshCw, AlertTriangle, Sparkle, BookmarkCheck, ShieldCheck } from "lucide-react";
import type { MotionVideoDna } from "../../../types/motionVideo";
import { cn } from "../../../lib/utils";
interface MotionVideoDnaCardProps {
  dna: MotionVideoDna;
  text?: Record<string, string>;
  currentLang?: "vi" | "en";
}
export const MotionVideoDnaCard: React.FC<MotionVideoDnaCardProps> = ({ dna, text: textOverrides = {}, currentLang = MR.MOTION_TEXT_VI }) => {
  const [isOpen, setIsOpen] = useState(false);
  const isEn = currentLang === MR.MOTION_TEXT_EN;
  const text = { ...MOTION_VIDEO_TEXTS[currentLang], ...textOverrides };
  if (!dna) return null;
  const confidenceScore = dna.audienceProfile?.confidence ?? dna.evidence?.[0]?.confidence ?? 95;
  return (
    <details open={isOpen} onToggle={(e) => setIsOpen((e.currentTarget as HTMLDetailsElement).open)} className={MR.ROUNDED_2XL_BORDER_BORDER_PURPLE_500_20_BG_SLATE_900_70_}>
      <summary className={MR.MOTION_TEXT_FLEX_CURSOR_POINTER_LIST_NONE_ITEMS_CENTER_JUSTIFY_BETWEEN_GAP_3_}>
        <div className={MR.MOTION_TEXT_FLEX_ITEMS_CENTER_GAP_2_5_MIN_W_0}>
          <div className={MR.MOTION_TEXT_W_6_H_6_ROUNDED_LG_BG_AMBER_500_15_BORDER_BORDER_AMBER_500_30_FLE}>
            <Sparkles className={MR.H_3_5_W_3_5_TEXT_AMBER_400_A8526B} />
          </div>
          <div className={MR.MOTION_TEXT_FLEX_ITEMS_CENTER_GAP_2_FLEX_WRAP_MIN_W_0}>
            <span className={MR.FONT_BOLD_TEXT_XS_SM_TEXT_SM_TEXT_SLATE_100_TRACKING_TIG}>{text.VIDEO_DNA_TITLE || MR.MOTION_TEXT_PHAN_TICH_DNA}</span>
            {dna.format?.primary && <span className={MR.MOTION_TEXT_PX_2_5_PY_0_5_ROUNDED_FULL_TEXT_10PX_FONT_MONO_FONT_BOLD_BG_F3E8F}>{dna.format.primary}</span>}
            {dna.format?.factual !== undefined && <span className={MR.MOTION_TEXT_PX_2_5_PY_0_5_ROUNDED_FULL_TEXT_10PX_FONT_MONO_FONT_BOLD_BG_DCFCE}>{dna.format.factual ? (isEn ? MR.MOTION_TEXT_FACTUAL : MR.MOTION_TEXT_CHUYEN_CO_THAT) : isEn ? MR.MOTION_TEXT_FICTION : MR.MOTION_TEXT_HU_CAU}</span>}
            {confidenceScore > 0 && (
              <span className={MR.MOTION_TEXT_PX_2_5_PY_0_5_ROUNDED_FULL_TEXT_10PX_FONT_MONO_FONT_BOLD_BG_DCFCE_2}>
                <span className={MR.W_1_5_H_1_5_ROUNDED_FULL_BG_EMERALD_400_ANIMATE_PULSE_937889} />
                <span>
                  {confidenceScore}
                  {MR.MOTION_TEXT_SYMBOL_17}
                  {isEn ? MR.MOTION_TEXT_CONFIDENCE : MR.MOTION_TEXT_KHOP}
                </span>
              </span>
            )}
          </div>
        </div>
        <div className={MR.FLEX_ITEMS_CENTER_GAP_1_TEXT_XS_TEXT_SLATE_400_GROUP_HOV}>
          <span className={MR.MOTION_TEXT_HIDDEN_SM_INLINE_TEXT_11PX}>{isOpen ? MR.MOTION_TEXT_THU_GON : MR.MOTION_TEXT_MO_RONG}</span>
          <ChevronDown className={cn(MR.MOTION_TEXT_H_4_W_4_TRANSITION_TRANSFORM_DURATION_200_GROUP_OPEN_ROTATE_180)} />
        </div>
      </summary>
      <div className={MR.P_4_SM_P_5_SPACE_Y_4_TEXT_LEFT_BG_SLATE_900_40}>
        <div className={MR.MOTION_TEXT_GRID_GRID_COLS_1_SM_GRID_COLS_2_LG_GRID_COLS_4_GAP_3}>
          <MotionMetricCard>
            <span className={MR.MOTION_TEXT_TEXT_10PX_UPPERCASE_FONT_MONO_FONT_BOLD_TRACKING_WIDER_TEXT_581C8}>
              <Film className={MR.W_3_5_H_3_5_TEXT_PURPLE_400_SHRINK_0_A38F91} />
              <span>{text.VIDEO_DNA_FORMAT || MR.MOTION_TEXT_DINH_DANG}</span>
            </span>
            <div className={MR.MOTION_TEXT_FLEX_ITEMS_CENTER_GAP_1_5_FLEX_WRAP}>
              <span className={MR.TEXT_11PX_FONT_BOLD_TEXT_PURPLE_300_BG_PURPLE_500_15_BOR}>{dna.format?.primary || MR.MOTION_TEXT_VIDEO}</span>
              {dna.format?.secondary?.map((sec, idx) => (
                <span key={idx} className={MR.TEXT_10PX_FONT_BOLD_TEXT_SLATE_300_BG_SLATE_800_PX_1_5_P}>
                  {sec}
                </span>
              ))}
            </div>
            {dna.format?.reason && (
              <p className={MR.TEXT_11PX_TEXT_SLATE_300_FONT_MEDIUM_ITALIC_LINE_CLAMP_2}>
                {MR.MOTION_TEXT_SYMBOL_47}
                {dna.format.reason}
                {MR.MOTION_TEXT_SYMBOL_47}
              </p>
            )}
          </MotionMetricCard>
          <MotionMetricCard>
            <span className={MR.MOTION_TEXT_TEXT_10PX_UPPERCASE_FONT_MONO_FONT_BOLD_TRACKING_WIDER_TEXT_5B21B}>
              <Users className={MR.W_3_5_H_3_5_TEXT_VIOLET_400_SHRINK_0} />
              <span>{text.VIDEO_DNA_AUDIENCE_PROFILE || MR.MOTION_TEXT_KHAN_GIA_MUC_TIEU}</span>
            </span>
            <div className={MR.MOTION_TEXT_FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN_GAP_1_5_FLEX_WRAP}>
              <span className={MR.TEXT_XS_FONT_SEMIBOLD_TEXT_SLATE_100_LEADING_SNUG_122650}>{dna.audienceProfile?.ageRange || MR.MOTION_TEXT_MOI_LUA_TUOI}</span>
              <span className={MR.TEXT_10PX_FONT_MONO_FONT_BOLD_TEXT_EMERALD_300_BG_EMERAL}>
                {confidenceScore}
                {MR.MOTION_TEXT_SYMBOL_40}
              </span>
            </div>
            <p className={MR.TEXT_11PX_FONT_SEMIBOLD_TEXT_SLATE_300_TRUNCATE}>{[dna.audienceProfile?.country, dna.audienceProfile?.language, dna.audienceProfile?.dialect].filter(Boolean).join(MR.MOTION_TEXT_SYMBOL_57)}</p>
          </MotionMetricCard>
          <MotionMetricCard>
            <span className={MR.MOTION_TEXT_TEXT_10PX_UPPERCASE_FONT_MONO_FONT_BOLD_TRACKING_WIDER_TEXT_92400}>
              <Clock className={MR.W_3_5_H_3_5_TEXT_AMBER_400_SHRINK_0} />
              <span>{text.VIDEO_DNA_ERA || MR.MOTION_TEXT_THOI_KY_PHONG_CACH}</span>
            </span>
            <p className={MR.TEXT_XS_FONT_SEMIBOLD_TEXT_SLATE_100_LEADING_SNUG_122650}>{dna.era?.storyPeriod || MR.MOTION_TEXT_HIEN_DAI}</p>
            <p className={MR.TEXT_11PX_FONT_MEDIUM_TEXT_SLATE_300_TRUNCATE}>{dna.era?.productionStyle || MR.MOTION_TEXT_TIEU_CHUAN}</p>
          </MotionMetricCard>
          <MotionMetricCard>
            <span className={MR.MOTION_TEXT_TEXT_10PX_UPPERCASE_FONT_MONO_FONT_BOLD_TRACKING_WIDER_TEXT_312E8}>
              <Globe className={MR.W_3_5_H_3_5_TEXT_INDIGO_400_SHRINK_0} />
              <span>{isEn ? MR.MOTION_TEXT_CONTEXT : MR.MOTION_TEXT_BOI_CANH_XEM_2}</span>
            </span>
            <p className={MR.TEXT_XS_FONT_SEMIBOLD_TEXT_SLATE_100_LEADING_SNUG_TRUNCA}>{dna.audienceProfile?.viewingContext || MR.MOTION_TEXT_DA_NEN_TANG}</p>
            <p className={MR.TEXT_11PX_FONT_MEDIUM_TEXT_SLATE_300_LINE_CLAMP_2_LEADIN}>{dna.audienceProfile?.suitability ? MR.MOTION_TEMPLATE_SYMBOL_8(dna.audienceProfile.suitability) : MR.MOTION_TEXT_DINH_DANG_CHUAN}</p>
          </MotionMetricCard>
        </div>
        <div className={MR.MOTION_TEXT_GRID_GRID_COLS_1_MD_GRID_COLS_2_GAP_3}>
          <div className={MR.P_3_5_ROUNDED_XL_BG_INDIGO_950_20_BORDER_BORDER_INDIGO_5}>
            <div className={MR.MOTION_TEXT_FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN_GAP_2_BORDER_B_BORDER_INDIGO_20}>
              <div className={MR.FLEX_ITEMS_CENTER_GAP_1_5_TEXT_INDIGO_300_FONT_MONO_FONT}>
                <SlidersHorizontal className={MR.W_3_5_H_3_5_SHRINK_0_TEXT_INDIGO_400} />
                <span>{text.VIDEO_DNA_EDIT || MR.MOTION_TEXT_NHIP_DUNG_GIONG_DOC}</span>
              </div>
              {dna.editDna?.pace && <span className={MR.TEXT_11PX_FONT_MONO_FONT_BOLD_TEXT_INDIGO_300_BG_SLATE_9}>{dna.editDna.pace}</span>}
            </div>
            <div className={MR.MOTION_TEXT_SPACE_Y_2_TEXT_XS}>
              {dna.editDna?.hookPlacement && (
                <MotionDetailRow className={MR.MOTION_TEXT_LEADING_RELAXED} labelClassName={MR.FONT_BOLD_TEXT_SLATE_100} label={MR.MOTION_TEXT_HOOK_MO_DAU_2} valueClassName={MR.FONT_MEDIUM_TEXT_SLATE_200}>
                  {dna.editDna.hookPlacement}
                </MotionDetailRow>
              )}
              {dna.editDna?.rhythm && (
                <MotionDetailRow className={MR.MOTION_TEXT_LEADING_RELAXED} labelClassName={MR.FONT_BOLD_TEXT_SLATE_100} label={MR.MOTION_TEXT_NHIP_CAU_CHUYEN} valueClassName={MR.FONT_MEDIUM_TEXT_SLATE_200}>
                  {dna.editDna.rhythm}
                </MotionDetailRow>
              )}
              {(dna.editDna?.narratorVoice || dna.narrativeDna?.narrativeVoice) && (
                <MotionDetailRow className={MR.MOTION_TEXT_LEADING_RELAXED} labelClassName={MR.FONT_BOLD_TEXT_SLATE_100} label={MR.MOTION_TEXT_GIONG_DOC_DAN} valueClassName={MR.FONT_MEDIUM_TEXT_SLATE_200}>
                  {dna.editDna?.narratorVoice || dna.narrativeDna?.narrativeVoice}
                </MotionDetailRow>
              )}
              {dna.editDna?.soundBed && (
                <MotionDetailRow className={MR.MOTION_TEXT_LEADING_RELAXED} labelClassName={MR.FONT_BOLD_TEXT_SLATE_100} label={MR.MOTION_TEXT_AM_NEN} valueClassName={MR.FONT_MEDIUM_TEXT_SLATE_200}>
                  {dna.editDna.soundBed}
                </MotionDetailRow>
              )}
              {dna.narrativeDna?.themes && dna.narrativeDna.themes.length > 0 && (
                <div className={MR.MOTION_TEXT_PT_1_5_FLEX_FLEX_WRAP_GAP_1_5}>
                  {dna.narrativeDna.themes.map((th, idx) => (
                    <span key={idx} className={MR.TEXT_XS_FONT_MONO_FONT_BOLD_TEXT_INDIGO_300_BG_SLATE_900}>
                      {MR.MOTION_TEXT_SYMBOL_44}
                      {th}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className={MR.P_3_5_ROUNDED_XL_BG_PURPLE_950_20_BORDER_BORDER_PURPLE_5}>
            <div className={MR.MOTION_TEXT_FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN_GAP_2_BORDER_B_BORDER_PURPLE_20}>
              <div className={MR.FLEX_ITEMS_CENTER_GAP_1_5_TEXT_PURPLE_300_FONT_MONO_FONT}>
                <Palette className={MR.W_3_5_H_3_5_SHRINK_0_TEXT_PURPLE_400} />
                <span>{text.VIDEO_DNA_VISUAL || MR.MOTION_TEXT_NGON_NGU_THI_GIAC_BOI_CANH}</span>
              </div>
              {dna.visualDna?.style && <span className={MR.TEXT_11PX_FONT_MONO_FONT_BOLD_TEXT_PURPLE_300_BG_SLATE_9}>{dna.visualDna.style}</span>}
            </div>
            <div className={MR.MOTION_TEXT_SPACE_Y_2_TEXT_XS}>
              {dna.visualDna?.composition && (
                <MotionDetailRow className={MR.MOTION_TEXT_LEADING_RELAXED} labelClassName={MR.FONT_BOLD_TEXT_SLATE_100} label={MR.MOTION_TEXT_BO_CUC} valueClassName={MR.FONT_MEDIUM_TEXT_SLATE_200}>
                  {dna.visualDna.composition}
                </MotionDetailRow>
              )}
              {dna.visualDna?.lighting && (
                <MotionDetailRow className={MR.MOTION_TEXT_LEADING_RELAXED} labelClassName={MR.FONT_BOLD_TEXT_SLATE_100} label={MR.MOTION_TEXT_ANH_SANG} valueClassName={MR.FONT_MEDIUM_TEXT_SLATE_200}>
                  {dna.visualDna.lighting}
                </MotionDetailRow>
              )}
              {dna.visualDna?.palette && (
                <MotionDetailRow className={MR.MOTION_TEXT_LEADING_RELAXED} labelClassName={MR.FONT_BOLD_TEXT_SLATE_100} label={MR.MOTION_TEXT_MAU_SAC} valueClassName={MR.FONT_MEDIUM_TEXT_SLATE_200}>
                  {dna.visualDna.palette}
                </MotionDetailRow>
              )}
              {dna.characters?.design && (
                <MotionDetailRow className={MR.MOTION_TEXT_LEADING_RELAXED} labelClassName={MR.FONT_BOLD_TEXT_SLATE_100} label={MR.MOTION_TEXT_NHAN_VAT} valueClassName={MR.FONT_MEDIUM_TEXT_SLATE_200}>
                  {dna.characters.design}
                </MotionDetailRow>
              )}
              {dna.environment?.space && (
                <MotionDetailRow className={MR.MOTION_TEXT_LEADING_RELAXED} labelClassName={MR.FONT_BOLD_TEXT_SLATE_100} label={MR.MOTION_TEXT_KHONG_GIAN} valueClassName={MR.FONT_MEDIUM_TEXT_SLATE_200}>
                  {dna.environment.space}
                </MotionDetailRow>
              )}
            </div>
          </div>
        </div>
        <div className={MR.MOTION_TEXT_GRID_GRID_COLS_1_MD_GRID_COLS_3_GAP_3}>
          <MotionRuleCard items={dna.mustPreserve} icon={Check} label={text.VIDEO_DNA_PRESERVE || MR.MOTION_TEXT_BAO_TOAN_MUST_PRESERVE} emptyText={MR.MOTION_TEXT_KHONG_CO_RANG_BUOC_CU_THE} styles={MOTION_RULE_STYLES.mustPreserve} />
          <MotionRuleCard items={dna.mustVary} icon={RefreshCw} label={text.VIDEO_DNA_VARY || MR.MOTION_TEXT_CAN_THAY_DOI_MUST_VARY} emptyText={MR.MOTION_TEXT_TUY_BIEN_LINH_HOAT_THEO_TUNG_CANH} styles={MOTION_RULE_STYLES.mustVary} />
          <MotionRuleCard items={dna.mustNotCopy} icon={AlertTriangle} label={text.VIDEO_DNA_AVOID || MR.MOTION_TEXT_CAM_SAO_CHEP_MUST_NOT_COPY} emptyText={MR.MOTION_TEXT_KHONG_TRUNG_LAP_BAN_QUYEN_GOC} styles={MOTION_RULE_STYLES.mustNotCopy} />
        </div>
        {dna.opening && (
          <div className={MR.P_3_5_ROUNDED_XL_BG_PURPLE_950_20_BORDER_BORDER_PURPLE_5_9283E3}>
            <div className={MR.FLEX_ITEMS_CENTER_GAP_1_5_FONT_BOLD_TEXT_XS_TEXT_PURPLE_}>
              <Sparkle className={MR.W_3_5_H_3_5_SHRINK_0_TEXT_PURPLE_400} />
              <span>{text.VIDEO_DNA_OPENING || MR.MOTION_TEXT_KHUNG_HINH_MO_DAU_3_GIAY_DAU_HOOK}</span>
            </div>
            <p className={MR.TEXT_XS_FONT_SEMIBOLD_TEXT_SLATE_100_LEADING_RELAXED}>{dna.opening.visual}</p>
            {dna.opening.purpose && (
              <p className={MR.TEXT_XS_TEXT_SLATE_300_F27673}>
                <span className={MR.FONT_BOLD_TEXT_SLATE_100}>{MR.MOTION_TEXT_MUC_DICH}</span>
                {dna.opening.purpose}
              </p>
            )}
          </div>
        )}
        {dna.evidence && dna.evidence.length > 0 && (
          <div className={MR.P_3_5_ROUNDED_XL_BG_SLATE_950_60_BORDER_BORDER_PURPLE_50}>
            <div className={MR.MOTION_TEXT_FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN_GAP_2_BORDER_B_BORDER_SLATE_200_2}>
              <div className={MR.FLEX_ITEMS_CENTER_GAP_1_5_FONT_BOLD_TEXT_XS_TEXT_AMBER_4}>
                <BookmarkCheck className={MR.W_3_5_H_3_5_SHRINK_0_TEXT_AMBER_400_DC24A2} />
                <span>{text.VIDEO_DNA_EVIDENCE || MR.MOTION_TEXT_CAN_CU_DAN_CHUNG_TU_DU_LIEU_GOC_2}</span>
              </div>
              <span className={MR.TEXT_10PX_FONT_MONO_FONT_BOLD_TEXT_SLATE_400}>
                {dna.evidence.length} {isEn ? MR.MOTION_TEXT_SOURCES_2 : MR.MOTION_TEXT_DAN_CHUNG_2}
              </span>
            </div>
            <div className={MR.MOTION_TEXT_GRID_GRID_COLS_1_SM_GRID_COLS_2_GAP_2}>
              {dna.evidence.map((ev, idx) => (
                <div key={idx} className={MR.P_2_5_ROUNDED_LG_BG_SLATE_900_80_BORDER_BORDER_PURPLE_50}>
                  <div className={MR.MOTION_TEXT_FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN_GAP_1_5}>
                    <span className={MR.TEXT_XS_FONT_BOLD_TEXT_SLATE_100_TRUNCATE_7503CC}>{ev.claim}</span>
                    {ev.confidence > 0 && (
                      <span className={MR.TEXT_10PX_FONT_MONO_FONT_BOLD_SHRINK_0_TEXT_EMERALD_400}>
                        {ev.confidence}
                        {MR.MOTION_TEXT_SYMBOL_40}
                      </span>
                    )}
                  </div>
                  <p className={MR.TEXT_11PX_ITALIC_TRUNCATE_TEXT_SLATE_400}>
                    {MR.MOTION_TEXT_SYMBOL_47}
                    {ev.sourceClue}
                    {MR.MOTION_TEXT_SYMBOL_47}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
        {dna.qualityChecks && dna.qualityChecks.length > 0 && (
          <div className={MR.P_3_5_ROUNDED_XL_BG_SLATE_950_60_BORDER_BORDER_PURPLE_50}>
            <div className={MR.FLEX_ITEMS_CENTER_GAP_1_5_FONT_BOLD_TEXT_XS_TEXT_SLATE_1}>
              <ShieldCheck className={MR.W_4_H_4_SHRINK_0_TEXT_PURPLE_400_82BC8C} />
              <span>{text.VIDEO_DNA_CHECKS || MR.MOTION_TEXT_TIEU_CHUAN_NGHIEM_THU}</span>
            </div>
            <div className={MR.MOTION_TEXT_FLEX_FLEX_WRAP_GAP_2}>
              {dna.qualityChecks.map((qc, idx) => (
                <span key={idx} className={MR.MOTION_TEXT_INLINE_FLEX_ITEMS_CENTER_GAP_1_5_PX_3_PY_1_5_ROUNDED_LG_TEXT_XS_F}>
                  <span className={MR.FONT_BOLD_TEXT_EMERALD_400}>{MR.MOTION_TEXT_SYMBOL_3}</span>
                  <span>{qc}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </details>
  );
};
