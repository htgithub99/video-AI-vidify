import { MotionRuleCard } from "./MotionRuleCard";
import { MOTION_RULE_STYLES } from "../../constants/motionStyles";
import * as MR from "../../constants/motionRuntime.js";
import { MotionDetailRow } from "./MotionDetailRow";
import { MOTION_VIDEO_TEXTS } from "../../constants/motionVideoTexts";
import React, { useState, useMemo } from "react";
import { Sparkles, ChevronDown, ChevronUp, Target, Film, Palette, ShieldCheck, CheckCircle2, Radio, Clock, FileCheck, BookmarkCheck, Ban, Sparkle } from "lucide-react";
import type { MotionVideoDna } from "../../types/motionVideo";
import { Button } from "../ui/Button";
interface MotionVideoDnaCardProps { dna: MotionVideoDna; text?: Record<string, string>; currentLang?: "vi" | "en"; }
type DnaTab = "all" | "format" | "narrative" | "visual" | "rules";
export const MotionVideoDnaCard: React.FC<MotionVideoDnaCardProps> = ({ dna, text: textOverrides = {}, currentLang = MR.MOTION_TEXT_VI }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<DnaTab>(MR.MOTION_TEXT_ALL);
  const isEn = currentLang === MR.MOTION_TEXT_EN;
  const text = { ...MOTION_VIDEO_TEXTS[currentLang], ...textOverrides };
  const tabs = useMemo(
    () => [
      { id: MR.MOTION_TEXT_ALL as DnaTab, label: isEn ? MR.MOTION_TEXT_ALL_PROFILE : MR.MOTION_TEXT_TAT_CA_DNA, icon: Sparkles },
      { id: MR.MOTION_TEXT_FORMAT as DnaTab, label: isEn ? MR.MOTION_TEXT_FORMAT_AUDIENCE : MR.MOTION_TEXT_DINH_DANG_KHAN_GIA, icon: Target },
      { id: MR.MOTION_TEXT_NARRATIVE as DnaTab, label: isEn ? MR.MOTION_TEXT_PACE_NARRATIVE : MR.MOTION_TEXT_NHIP_DUNG_KICH_BAN, icon: Film },
      { id: MR.MOTION_TEXT_VISUAL as DnaTab, label: isEn ? MR.MOTION_TEXT_VISUAL_WORLD : MR.MOTION_TEXT_THI_GIAC_BOI_CANH, icon: Palette },
      { id: MR.MOTION_TEXT_RULES as DnaTab, label: isEn ? MR.MOTION_TEXT_RULES_EVIDENCE : MR.MOTION_TEXT_TIEU_CHUAN_CAN_CU, icon: ShieldCheck },
    ],
    [isEn],
  );
  if (!dna) return null;
  const confidenceScore = dna.audienceProfile?.confidence ?? dna.evidence?.[0]?.confidence ?? 95;
  return (
    <div className={MR.MOTION_TEXT_OVERFLOW_HIDDEN_ROUNDED_2XL_BORDER_BORDER_PURPLE_500_25_BG_GRADIE}>
      <div onClick={() => setIsOpen(!isOpen)} className={MR.MOTION_TEMPLATE_FLEX_FLEX_WRAP_ITEMS_CENTER_JUSTIFY_BETWEEN_GAP_3_BG_PURPLE_900_1(isOpen ? MR.MOTION_TEXT_BORDER_B_BORDER_PURPLE_500_15 : "")}>
        <div className={MR.MOTION_TEXT_FLEX_ITEMS_CENTER_GAP_2_5}>
          <div className={MR.MOTION_TEXT_FLEX_H_8_W_8_ITEMS_CENTER_JUSTIFY_CENTER_ROUNDED_XL_BG_PURPLE_500}>
            <Sparkles className={MR.MOTION_TEXT_H_4_W_4_TEXT_PURPLE_300_ANIMATE_PULSE} />
          </div>
          <div>
            <div className={MR.MOTION_TEXT_FLEX_ITEMS_CENTER_GAP_2}>
              <h4 className={MR.MOTION_TEXT_TEXT_SM_FONT_BOLD_TRACKING_TIGHT_TEXT_PURPLE_100}>{text.VIDEO_DNA_TITLE || MR.MOTION_TEXT_VIDEO_DNA_PROFILE}</h4>
              {dna.format?.primary && <span className={MR.MOTION_TEXT_ROUNDED_FULL_BG_PURPLE_500_20_PX_2_5_PY_0_5_TEXT_11PX_FONT_SEMIBO}>{dna.format.primary}</span>}
              {dna.format?.factual !== undefined && (
                <span className={MR.MOTION_TEMPLATE_ROUNDED_FULL_PX_2_PY_0_5_TEXT_10PX_FONT_MEDIUM_BORDER(dna.format.factual ? MR.MOTION_TEXT_BG_EMERALD_500_15_TEXT_EMERALD_300_BORDER_EMERALD_500_30 : MR.MOTION_TEXT_BG_BLUE_500_15_TEXT_BLUE_300_BORDER_BLUE_500_30)}>
                  {dna.format.factual ? (isEn ? MR.MOTION_TEXT_FACTUAL : MR.MOTION_TEXT_CHUYEN_CO_THAT) : isEn ? MR.MOTION_TEXT_FICTION : MR.MOTION_TEXT_HU_CAU}
                </span>
              )}
            </div>
            <p className={MR.MOTION_TEXT_TEXT_11PX_TEXT_PURPLE_300_70}>{dna.intent ? dna.intent : isEn ? MR.MOTION_TEXT_CREATIVE_BLUEPRINT_DERIVED_FROM_SOURCE_DATA : MR.MOTION_TEXT_BO_GEN_SANG_TAO_DUOC_CHUAN_HOA_THEO_DU_LIEU_GOC}</p>
          </div>
        </div>
        <div className={MR.MOTION_TEXT_FLEX_ITEMS_CENTER_GAP_2} onClick={(e) => e.stopPropagation()}>
          {confidenceScore > 0 && (
            <div className={MR.MOTION_TEXT_FLEX_ITEMS_CENTER_GAP_1_5_ROUNDED_LG_BG_SLATE_900_80_PX_2_5_PY_1_}>
              <span className={MR.MOTION_TEXT_H_1_5_W_1_5_ROUNDED_FULL_BG_EMERALD_400_ANIMATE_PING} />
              <span>
                {confidenceScore}
                {MR.MOTION_TEXT_SYMBOL_17}
                {isEn ? MR.MOTION_TEXT_CONFIDENCE : MR.MOTION_TEXT_DO_TIN_CAY}
              </span>
            </div>
          )}
          <Button variant={MR.MOTION_TEXT_UNSTYLED} onClick={() => setIsOpen(!isOpen)} className={MR.MOTION_TEXT_H_8_PX_2_5_TEXT_XS_TEXT_PURPLE_200_HOVER_TEXT_WHITE_INLINE_FLEX_I}>
            {isOpen ? (
              <>
                <span className={MR.MOTION_TEXT_HIDDEN_SM_INLINE_MR_1_5}>{isEn ? MR.MOTION_TEXT_COLLAPSE : MR.MOTION_TEXT_THU_GON}</span>
                <ChevronUp className={MR.MOTION_TEXT_H_4_W_4_TEXT_PURPLE_300} />
              </>
            ) : (
              <>
                <span className={MR.MOTION_TEXT_HIDDEN_SM_INLINE_MR_1_5}>{isEn ? MR.MOTION_TEXT_EXPAND : MR.MOTION_TEXT_MO_RONG}</span>
                <ChevronDown className={MR.MOTION_TEXT_H_4_W_4_TEXT_PURPLE_300} />
              </>
            )}
          </Button>
        </div>
      </div>
      {isOpen && (
        <div className={MR.MOTION_TEXT_P_4_SM_P_5_SPACE_Y_4}>
          <div className={MR.MOTION_TEXT_FLEX_FLEX_WRAP_ITEMS_CENTER_GAP_1_5_ROUNDED_XL_BG_SLATE_900_90_P_}>
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button key={tab.id} type={MR.MOTION_TEXT_BUTTON} onClick={() => setActiveTab(tab.id)} className={MR.MOTION_TEMPLATE_FLEX_ITEMS_CENTER_GAP_1_5_ROUNDED_LG_PX_3_PY_1_5_TEXT_XS_FONT_MED(isActive ? MR.MOTION_TEXT_BG_PURPLE_600_TEXT_WHITE_SHADOW_MD_SHADOW_PURPLE_900_30_FONT_SEMI : MR.MOTION_TEXT_TEXT_SLATE_400_HOVER_BG_SLATE_800_60_HOVER_TEXT_SLATE_200)}>
                  <Icon className={MR.MOTION_TEMPLATE_H_3_5_W_3_5(isActive ? MR.MOTION_TEXT_TEXT_WHITE : MR.MOTION_TEXT_TEXT_SLATE_400)} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
          {(activeTab === MR.MOTION_TEXT_ALL || activeTab === MR.MOTION_TEXT_FORMAT) && (
            <div className={MR.MOTION_TEXT_SPACE_Y_3}>
              <div className={MR.MOTION_TEXT_FLEX_ITEMS_CENTER_GAP_2_TEXT_XS_FONT_BOLD_UPPERCASE_TRACKING_WIDE}>
                <Target className={MR.MOTION_TEXT_H_4_W_4_TEXT_PURPLE_400} />
                <span>{isEn ? MR.MOTION_TEXT_FORMAT_PURPOSE_AUDIENCE_PROFILE : MR.MOTION_TEXT_DINH_DANG_MUC_TIEU_CHAN_DUNG_KHAN_GIA}</span>
              </div>
              <div className={MR.MOTION_TEXT_GRID_GRID_COLS_1_MD_GRID_COLS_2_GAP_3}>
                <div className={MR.MOTION_TEXT_ROUNDED_XL_BORDER_BORDER_SLATE_800_BG_SLATE_900_50_P_3_5_SPACE_Y_}>
                  <div className={MR.MOTION_TEXT_FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN}>
                    <span className={MR.MOTION_TEXT_TEXT_XS_FONT_SEMIBOLD_TEXT_SLATE_300}>{text.VIDEO_DNA_FORMAT || MR.MOTION_TEXT_DANG_VIDEO}</span>
                    {dna.format?.secondary && dna.format.secondary.length > 0 && (
                      <div className={MR.MOTION_TEXT_FLEX_FLEX_WRAP_GAP_1}>
                        {dna.format.secondary.map((sec, idx) => (
                          <span key={idx} className={MR.MOTION_TEXT_ROUNDED_MD_BG_SLATE_800_PX_1_5_PY_0_5_TEXT_10PX_TEXT_SLATE_300_BO}>
                            {sec}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  {dna.format?.reason && (
                    <p className={MR.MOTION_TEXT_TEXT_XS_LEADING_RELAXED_TEXT_SLATE_400_ITALIC_BG_SLATE_950_40_P_2}>
                      {MR.MOTION_TEXT_SYMBOL_47}
                      {dna.format.reason}
                      {MR.MOTION_TEXT_SYMBOL_47}
                    </p>
                  )}
                  {dna.era && (
                    <div className={MR.MOTION_TEXT_PT_1_5_BORDER_T_BORDER_SLATE_800_70_GRID_GRID_COLS_2_GAP_2_TEXT_X}>
                      <div>
                        <span className={MR.MOTION_TEXT_TEXT_10PX_FONT_MEDIUM_TEXT_SLATE_500_UPPERCASE_BLOCK}>{text.VIDEO_DNA_ERA || MR.MOTION_TEXT_THOI_KY_CAU_CHUYEN}</span>
                        <span className={MR.MOTION_TEXT_TEXT_SLATE_300_FONT_MEDIUM}>{dna.era.storyPeriod || MR.MOTION_TEXT_SYMBOL_19}</span>
                      </div>
                      <div>
                        <span className={MR.MOTION_TEXT_TEXT_10PX_FONT_MEDIUM_TEXT_SLATE_500_UPPERCASE_BLOCK}>{MR.MOTION_TEXT_PHONG_CACH_SAN_XUAT}</span>
                        <span className={MR.MOTION_TEXT_TEXT_SLATE_300_FONT_MEDIUM}>{dna.era.productionStyle || MR.MOTION_TEXT_SYMBOL_19}</span>
                      </div>
                    </div>
                  )}
                </div>
                <div className={MR.MOTION_TEXT_ROUNDED_XL_BORDER_BORDER_SLATE_800_BG_SLATE_900_50_P_3_5_SPACE_Y_}>
                  <div className={MR.MOTION_TEXT_FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN}>
                    <span className={MR.MOTION_TEXT_TEXT_XS_FONT_SEMIBOLD_TEXT_SLATE_300}>{text.VIDEO_DNA_AUDIENCE_PROFILE || MR.MOTION_TEXT_KHAN_GIA_MUC_TIEU}</span>
                    {dna.audienceProfile?.ageRange && <span className={MR.MOTION_TEXT_ROUNDED_MD_BG_PURPLE_500_10_PX_2_PY_0_5_TEXT_11PX_FONT_BOLD_TEXT_}>{dna.audienceProfile.ageRange}</span>}
                  </div>
                  {dna.audienceProfile ? (
                    <div className={MR.MOTION_TEXT_SPACE_Y_1_5_TEXT_XS_TEXT_SLATE_300}>
                      <div className={MR.MOTION_TEXT_FLEX_ITEMS_CENTER_GAP_2_FLEX_WRAP}>
                        <span className={MR.MOTION_TEXT_ROUNDED_BG_SLATE_800_80_PX_2_PY_0_5_TEXT_11PX_TEXT_SLATE_300}>
                          {MR.MOTION_TEXT_SYMBOL_18}
                          {dna.audienceProfile.country}
                        </span>
                        <span className={MR.MOTION_TEXT_ROUNDED_BG_SLATE_800_80_PX_2_PY_0_5_TEXT_11PX_TEXT_SLATE_300}>
                          {MR.MOTION_TEXT_SYMBOL_20}
                          {dna.audienceProfile.language}
                          {MR.MOTION_TEXT_SYMBOL_6}
                          {dna.audienceProfile.dialect}
                          {MR.MOTION_TEXT_SYMBOL_7}
                        </span>
                        {dna.audienceProfile.suitability && (
                          <span className={MR.MOTION_TEXT_ROUNDED_BG_EMERALD_950_40_PX_2_PY_0_5_TEXT_11PX_TEXT_EMERALD_300_}>
                            {MR.MOTION_TEXT_SYMBOL_22}
                            {dna.audienceProfile.suitability}
                          </span>
                        )}
                      </div>
                      {dna.audienceProfile.viewingContext && (
                        <MotionDetailRow className={MR.MOTION_TEXT_TEXT_11PX_TEXT_SLATE_400_PT_1} label={MR.MOTION_TEXT_BOI_CANH_XEM}>
                          {dna.audienceProfile.viewingContext}
                        </MotionDetailRow>
                      )}
                    </div>
                  ) : (
                    <p className={MR.MOTION_TEXT_TEXT_XS_TEXT_SLATE_400}>{dna.audience || MR.MOTION_TEXT_SYMBOL_19}</p>
                  )}
                  {dna.influences && dna.influences.length > 0 && (
                    <div className={MR.MOTION_TEXT_PT_1_5_BORDER_T_BORDER_SLATE_800_70}>
                      <span className={MR.MOTION_TEXT_TEXT_10PX_FONT_MEDIUM_TEXT_SLATE_500_UPPERCASE_BLOCK_MB_1}>{text.VIDEO_DNA_INFLUENCES || MR.MOTION_TEXT_ANH_HUONG_THAM_KHAO}</span>
                      <div className={MR.MOTION_TEXT_FLEX_FLEX_WRAP_GAP_1_5}>
                        {dna.influences.map((inf, idx) => (
                          <span key={idx} className={MR.MOTION_TEXT_ROUNDED_MD_BG_PURPLE_950_30_PX_2_PY_0_5_TEXT_11PX_TEXT_PURPLE_200}>
                            {inf.name}{" "}
                            <span className={MR.MOTION_TEXT_TEXT_PURPLE_400_80_TEXT_10PX}>
                              {MR.MOTION_TEXT_SYMBOL_23}
                              {inf.role}
                              {MR.MOTION_TEXT_SYMBOL_7}
                            </span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          {(activeTab === MR.MOTION_TEXT_ALL || activeTab === MR.MOTION_TEXT_NARRATIVE) && (
            <div className={MR.MOTION_TEXT_SPACE_Y_3_PT_1}>
              <div className={MR.MOTION_TEXT_FLEX_ITEMS_CENTER_GAP_2_TEXT_XS_FONT_BOLD_UPPERCASE_TRACKING_WIDE}>
                <Film className={MR.MOTION_TEXT_H_4_W_4_TEXT_PURPLE_400} />
                <span>{isEn ? MR.MOTION_TEXT_PACING_NARRATIVE_STORYTELLING_DNA : MR.MOTION_TEXT_NHIP_DUNG_GIONG_DAN_MO_TIP_KICH_BAN}</span>
              </div>
              <div className={MR.MOTION_TEXT_GRID_GRID_COLS_1_MD_GRID_COLS_2_GAP_3}>
                {dna.editDna && (
                  <div className={MR.MOTION_TEXT_ROUNDED_XL_BORDER_BORDER_SLATE_800_BG_SLATE_900_50_P_3_5_SPACE_Y_}>
                    <div className={MR.MOTION_TEXT_FLEX_ITEMS_CENTER_GAP_1_5_TEXT_XS_FONT_SEMIBOLD_TEXT_PURPLE_200}>
                      <Clock className={MR.MOTION_TEXT_H_3_5_W_3_5_TEXT_PURPLE_400} />
                      <span>{text.VIDEO_DNA_EDIT || MR.MOTION_TEXT_NHIP_DIEU_DUNG_HINH}</span>
                    </div>
                    <div className={MR.MOTION_TEXT_GRID_GRID_COLS_2_GAP_2_TEXT_XS}>
                      <div className={MR.MOTION_TEXT_ROUNDED_LG_BG_SLATE_950_50_P_2_BORDER_BORDER_SLATE_800_60}>
                        <span className={MR.MOTION_TEXT_TEXT_10PX_TEXT_SLATE_500_BLOCK_UPPERCASE}>{MR.MOTION_TEXT_TOC_DO_NHIP}</span>
                        <span className={MR.MOTION_TEXT_TEXT_SLATE_200_FONT_MEDIUM}>{dna.editDna.pace}</span>
                      </div>
                      <div className={MR.MOTION_TEXT_ROUNDED_LG_BG_SLATE_950_50_P_2_BORDER_BORDER_SLATE_800_60}>
                        <span className={MR.MOTION_TEXT_TEXT_10PX_TEXT_SLATE_500_BLOCK_UPPERCASE}>{MR.MOTION_TEXT_HOOK_MO_DAU}</span>
                        <span className={MR.MOTION_TEXT_TEXT_SLATE_200_FONT_MEDIUM}>{dna.editDna.hookPlacement}</span>
                      </div>
                    </div>
                    {dna.editDna.rhythm && (
                      <MotionDetailRow className={MR.MOTION_TEXT_TEXT_XS_TEXT_SLATE_300_LEADING_RELAXED} label={MR.MOTION_TEXT_NHIP_CAU_CHUYEN}>
                        {dna.editDna.rhythm}
                      </MotionDetailRow>
                    )}
                    {dna.editDna.narratorVoice && (
                      <MotionDetailRow className={MR.MOTION_TEXT_TEXT_XS_TEXT_SLATE_300_LEADING_RELAXED} label={MR.MOTION_TEXT_GIONG_DOC}>
                        {dna.editDna.narratorVoice}
                      </MotionDetailRow>
                    )}
                    {dna.editDna.soundBed && (
                      <MotionDetailRow className={MR.MOTION_TEXT_TEXT_XS_TEXT_SLATE_300_LEADING_RELAXED} label={MR.MOTION_TEXT_AM_NEN}>
                        {dna.editDna.soundBed}
                      </MotionDetailRow>
                    )}
                    {dna.editDna.visualToolkit && dna.editDna.visualToolkit.length > 0 && (
                      <div className={MR.MOTION_TEXT_PT_1_5_BORDER_T_BORDER_SLATE_800_70}>
                        <span className={MR.MOTION_TEXT_TEXT_10PX_TEXT_SLATE_500_BLOCK_UPPERCASE_MB_1}>{MR.MOTION_TEXT_CONG_CU_THI_GIAC}</span>
                        <div className={MR.MOTION_TEXT_FLEX_FLEX_WRAP_GAP_1}>
                          {dna.editDna.visualToolkit.map((tool, idx) => (
                            <span key={idx} className={MR.MOTION_TEXT_ROUNDED_BG_SLATE_800_PX_1_5_PY_0_5_TEXT_10PX_TEXT_SLATE_300}>
                              {tool}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {dna.narrativeDna && (
                  <div className={MR.MOTION_TEXT_ROUNDED_XL_BORDER_BORDER_SLATE_800_BG_SLATE_900_50_P_3_5_SPACE_Y_}>
                    <div className={MR.MOTION_TEXT_FLEX_ITEMS_CENTER_GAP_1_5_TEXT_XS_FONT_SEMIBOLD_TEXT_PURPLE_200}>
                      <Radio className={MR.MOTION_TEXT_H_3_5_W_3_5_TEXT_PURPLE_400} />
                      <span>{text.VIDEO_DNA_STORYTELLING || MR.MOTION_TEXT_LOI_DAN_CHU_DE}</span>
                    </div>
                    {dna.narrativeDna.narrativeVoice && (
                      <div className={MR.MOTION_TEXT_ROUNDED_LG_BG_SLATE_950_50_P_2_5_BORDER_BORDER_SLATE_800_60_TEXT_}>
                        <span className={MR.MOTION_TEXT_TEXT_10PX_TEXT_SLATE_500_BLOCK_UPPERCASE_FONT_MEDIUM}>{MR.MOTION_TEXT_GIONG_DIEU_KE_CHUYEN}</span>
                        {dna.narrativeDna.narrativeVoice}
                      </div>
                    )}
                    {dna.narrativeDna.themes && dna.narrativeDna.themes.length > 0 && (
                      <div>
                        <span className={MR.MOTION_TEXT_TEXT_10PX_TEXT_SLATE_500_BLOCK_UPPERCASE_MB_1}>{MR.MOTION_TEXT_CHU_DE_CHINH_THEMES}</span>
                        <div className={MR.MOTION_TEXT_FLEX_FLEX_WRAP_GAP_1}>
                          {dna.narrativeDna.themes.map((th, idx) => (
                            <span key={idx} className={MR.MOTION_TEXT_ROUNDED_MD_BG_PURPLE_900_30_PX_2_PY_0_5_TEXT_11PX_TEXT_PURPLE_200}>
                              {MR.MOTION_TEXT_SYMBOL_44}
                              {th}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {dna.narrativeDna.imagery && dna.narrativeDna.imagery.length > 0 && (
                      <div>
                        <span className={MR.MOTION_TEXT_TEXT_10PX_TEXT_SLATE_500_BLOCK_UPPERCASE_MB_1}>{MR.MOTION_TEXT_HINH_TUONG_GOI_MO_IMAGERY}</span>
                        <div className={MR.MOTION_TEXT_FLEX_FLEX_WRAP_GAP_1}>
                          {dna.narrativeDna.imagery.map((im, idx) => (
                            <span key={idx} className={MR.MOTION_TEXT_ROUNDED_MD_BG_BLUE_900_30_PX_2_PY_0_5_TEXT_11PX_TEXT_BLUE_200_BOR}>
                              {MR.MOTION_TEXT_SYMBOL_31}
                              {im}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {dna.narrativeDna.vocabulary && (
                      <MotionDetailRow className={MR.MOTION_TEXT_TEXT_XS_TEXT_SLATE_400} label={MR.MOTION_TEXT_VON_TU}>
                        {dna.narrativeDna.vocabulary}
                      </MotionDetailRow>
                    )}
                  </div>
                )}
              </div>
              {dna.opening && (
                <div className={MR.MOTION_TEXT_ROUNDED_XL_BORDER_BORDER_PURPLE_500_20_BG_PURPLE_950_20_P_3_5_SPA}>
                  <div className={MR.MOTION_TEXT_FLEX_ITEMS_CENTER_GAP_2_TEXT_XS_FONT_SEMIBOLD_TEXT_PURPLE_200}>
                    <Sparkle className={MR.MOTION_TEXT_H_4_W_4_TEXT_PURPLE_400} />
                    <span>{text.VIDEO_DNA_OPENING || MR.MOTION_TEXT_KHUNG_HINH_MO_DAU_FIRST_3_SECONDS_HOOK}</span>
                  </div>
                  <p className={MR.MOTION_TEXT_TEXT_XS_TEXT_SLATE_200_FONT_MEDIUM}>{dna.opening.visual}</p>
                  {dna.opening.purpose && (
                    <p className={MR.MOTION_TEXT_TEXT_XS_TEXT_PURPLE_300_80}>
                      <span className={MR.MOTION_TEXT_TEXT_SLATE_400_FONT_MEDIUM}>{MR.MOTION_TEXT_MUC_DICH}</span>
                      {dna.opening.purpose}
                    </p>
                  )}
                  {dna.opening.acceptance && dna.opening.acceptance.length > 0 && (
                    <div className={MR.MOTION_TEXT_FLEX_FLEX_WRAP_GAP_1_5_PT_1}>
                      {dna.opening.acceptance.map((acc, idx) => (
                        <span key={idx} className={MR.MOTION_TEXT_ROUNDED_BG_SLATE_900_PX_2_PY_0_5_TEXT_10PX_TEXT_EMERALD_300_BORDE}>
                          <CheckCircle2 className={MR.MOTION_TEXT_H_2_5_W_2_5} />
                          {acc}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          {(activeTab === MR.MOTION_TEXT_ALL || activeTab === MR.MOTION_TEXT_VISUAL) && (
            <div className={MR.MOTION_TEXT_SPACE_Y_3_PT_1}>
              <div className={MR.MOTION_TEXT_FLEX_ITEMS_CENTER_GAP_2_TEXT_XS_FONT_BOLD_UPPERCASE_TRACKING_WIDE}>
                <Palette className={MR.MOTION_TEXT_H_4_W_4_TEXT_PURPLE_400} />
                <span>{isEn ? MR.MOTION_TEXT_VISUAL_LANGUAGE_CHARACTERS_WORLD : MR.MOTION_TEXT_THI_GIAC_NHAN_VAT_BOI_CANH_KHONG_GIAN}</span>
              </div>
              <div className={MR.MOTION_TEXT_GRID_GRID_COLS_1_MD_GRID_COLS_2_GAP_3}>
                {dna.visualDna && (
                  <div className={MR.MOTION_TEXT_ROUNDED_XL_BORDER_BORDER_SLATE_800_BG_SLATE_900_50_P_3_5_SPACE_Y__2}>
                    <span className={MR.MOTION_TEXT_TEXT_XS_FONT_SEMIBOLD_TEXT_SLATE_200_BLOCK}>{text.VIDEO_DNA_VISUAL || MR.MOTION_TEXT_NGON_NGU_HINH_ANH}</span>
                    <div className={MR.MOTION_TEXT_SPACE_Y_1_5_TEXT_SLATE_300_LEADING_RELAXED}>
                      {dna.visualDna.style && <MotionDetailRow label={MR.MOTION_TEXT_PHONG_CACH}>{dna.visualDna.style}</MotionDetailRow>}
                      {dna.visualDna.composition && <MotionDetailRow label={MR.MOTION_TEXT_BO_CUC}>{dna.visualDna.composition}</MotionDetailRow>}
                      {dna.visualDna.lighting && <MotionDetailRow label={MR.MOTION_TEXT_ANH_SANG}>{dna.visualDna.lighting}</MotionDetailRow>}
                      {dna.visualDna.palette && <MotionDetailRow label={MR.MOTION_TEXT_MAU_SAC}>{dna.visualDna.palette}</MotionDetailRow>}
                      {dna.visualDna.materials && <MotionDetailRow label={MR.MOTION_TEXT_CHAT_LIEU}>{dna.visualDna.materials}</MotionDetailRow>}
                      {dna.visualDna.subjectHierarchy && <MotionDetailRow label={MR.MOTION_TEXT_PHAN_CAP_CHU_THE}>{dna.visualDna.subjectHierarchy}</MotionDetailRow>}
                    </div>
                  </div>
                )}
                {dna.characters && (
                  <div className={MR.MOTION_TEXT_ROUNDED_XL_BORDER_BORDER_SLATE_800_BG_SLATE_900_50_P_3_5_SPACE_Y__2}>
                    <span className={MR.MOTION_TEXT_TEXT_XS_FONT_SEMIBOLD_TEXT_SLATE_200_BLOCK}>{text.VIDEO_DNA_CHARACTERS || MR.MOTION_TEXT_QUY_CHUAN_NHAN_VAT}</span>
                    <div className={MR.MOTION_TEXT_SPACE_Y_1_5_TEXT_SLATE_300_LEADING_RELAXED}>
                      {dna.characters.design && <MotionDetailRow label={MR.MOTION_TEXT_THIET_KE}>{dna.characters.design}</MotionDetailRow>}
                      {dna.characters.proportions && <MotionDetailRow label={MR.MOTION_TEXT_TY_LE}>{dna.characters.proportions}</MotionDetailRow>}
                      {dna.characters.poseLanguage && <MotionDetailRow label={MR.MOTION_TEXT_TU_THE}>{dna.characters.poseLanguage}</MotionDetailRow>}
                      {dna.characters.continuity && dna.characters.continuity.length > 0 && (
                        <div className={MR.MOTION_TEXT_PT_1}>
                          <span className={MR.MOTION_TEXT_TEXT_SLATE_500_FONT_MEDIUM_BLOCK}>{MR.MOTION_TEXT_TINH_NHAT_QUAN}</span>
                          <ul className={MR.MOTION_TEXT_LIST_DISC_LIST_INSIDE_SPACE_Y_0_5_TEXT_SLATE_400_PL_1_PT_0_5}>
                            {dna.characters.continuity.map((c, i) => (
                              <li key={i}>{c}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {dna.environment && (
                  <div className={MR.MOTION_TEXT_ROUNDED_XL_BORDER_BORDER_SLATE_800_BG_SLATE_900_50_P_3_5_SPACE_Y__2}>
                    <span className={MR.MOTION_TEXT_TEXT_XS_FONT_SEMIBOLD_TEXT_SLATE_200_BLOCK}>{text.VIDEO_DNA_ENVIRONMENT || MR.MOTION_TEXT_KHONG_GIAN_DAO_CU}</span>
                    <div className={MR.MOTION_TEXT_SPACE_Y_1_5_TEXT_SLATE_300_LEADING_RELAXED}>
                      {dna.environment.space && <MotionDetailRow label={MR.MOTION_TEXT_KHONG_GIAN}>{dna.environment.space}</MotionDetailRow>}
                      {dna.environment.scale && <MotionDetailRow label={MR.MOTION_TEXT_QUY_MO}>{dna.environment.scale}</MotionDetailRow>}
                      {dna.environment.propRules && <MotionDetailRow label={MR.MOTION_TEXT_DAO_CU}>{dna.environment.propRules}</MotionDetailRow>}
                      {dna.environment.continuity && dna.environment.continuity.length > 0 && (
                        <div className={MR.MOTION_TEXT_PT_1}>
                          <span className={MR.MOTION_TEXT_TEXT_SLATE_500_FONT_MEDIUM_BLOCK}>{MR.MOTION_TEXT_TINH_NHAT_QUAN_KHONG_GIAN}</span>
                          <ul className={MR.MOTION_TEXT_LIST_DISC_LIST_INSIDE_SPACE_Y_0_5_TEXT_SLATE_400_PL_1_PT_0_5}>
                            {dna.environment.continuity.map((c, i) => (
                              <li key={i}>{c}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <div className={MR.MOTION_TEXT_ROUNDED_XL_BORDER_BORDER_SLATE_800_BG_SLATE_900_50_P_3_5_SPACE_Y__2}>
                  <span className={MR.MOTION_TEXT_TEXT_XS_FONT_SEMIBOLD_TEXT_SLATE_200_BLOCK}>{MR.MOTION_TEXT_CAMERA_AM_THANH}</span>
                  {dna.cinematography && (
                    <div className={MR.MOTION_TEXT_SPACE_Y_1_TEXT_SLATE_300_PB_2_BORDER_B_BORDER_SLATE_800_70}>
                      <MotionDetailRow label={MR.MOTION_TEXT_CAMERA_2}>{Object.values(dna.cinematography).join(MR.MOTION_TEXT_SYMBOL_10)}</MotionDetailRow>
                    </div>
                  )}
                  {dna.audioText && (
                    <div className={MR.MOTION_TEXT_SPACE_Y_1_TEXT_SLATE_300_PT_1}>
                      <MotionDetailRow label={MR.MOTION_TEXT_AM_THANH_PHU_DE}>{Object.values(dna.audioText).join(MR.MOTION_TEXT_SYMBOL_10)}</MotionDetailRow>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          {(activeTab === MR.MOTION_TEXT_ALL || activeTab === MR.MOTION_TEXT_RULES) && (
            <div className={MR.MOTION_TEXT_SPACE_Y_3_PT_1}>
              <div className={MR.MOTION_TEXT_FLEX_ITEMS_CENTER_GAP_2_TEXT_XS_FONT_BOLD_UPPERCASE_TRACKING_WIDE}>
                <ShieldCheck className={MR.MOTION_TEXT_H_4_W_4_TEXT_PURPLE_400} />
                <span>{isEn ? MR.MOTION_TEXT_QUALITY_STANDARDS_CONSTRAINTS_GROUNDING_EVIDENCE : MR.MOTION_TEXT_QUY_CHUAN_CHAT_LUONG_RANG_BUOC_CAN_CU_XAC_THUC}</span>
              </div>
              <div className={MR.MOTION_TEXT_GRID_GRID_COLS_1_MD_GRID_COLS_3_GAP_3}>
                <MotionRuleCard items={dna.mustPreserve} icon={CheckCircle2} label={text.VIDEO_DNA_PRESERVE} styles={MOTION_RULE_STYLES.mustPreserve} />
                <MotionRuleCard items={dna.mustVary} icon={Sparkles} label={text.VIDEO_DNA_VARY} styles={MOTION_RULE_STYLES.mustVary} />
                <MotionRuleCard items={dna.mustNotCopy} icon={Ban} label={text.VIDEO_DNA_AVOID} styles={MOTION_RULE_STYLES.mustNotCopy} />
              </div>
              {dna.qualityChecks && dna.qualityChecks.length > 0 && (
                <div className={MR.MOTION_TEXT_ROUNDED_XL_BORDER_BORDER_SLATE_800_BG_SLATE_900_50_P_3_5_SPACE_Y__3}>
                  <div className={MR.MOTION_TEXT_FLEX_ITEMS_CENTER_GAP_1_5_TEXT_XS_FONT_SEMIBOLD_TEXT_SLATE_200}>
                    <FileCheck className={MR.MOTION_TEXT_H_4_W_4_TEXT_PURPLE_400} />
                    <span>{text.VIDEO_DNA_CHECKS || MR.MOTION_TEXT_TIEU_CHI_KIEM_SOAT_CHAT_LUONG}</span>
                  </div>
                  <div className={MR.MOTION_TEXT_FLEX_FLEX_WRAP_GAP_2}>
                    {dna.qualityChecks.map((qc, idx) => (
                      <span key={idx} className={MR.MOTION_TEXT_ROUNDED_LG_BG_SLATE_950_60_PX_2_5_PY_1_TEXT_XS_TEXT_SLATE_300_BOR}>
                        <CheckCircle2 className={MR.MOTION_TEXT_H_3_W_3_TEXT_PURPLE_400} />
                        {qc}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {dna.evidence && dna.evidence.length > 0 && (
                <div className={MR.MOTION_TEXT_ROUNDED_XL_BORDER_BORDER_SLATE_800_BG_SLATE_900_50_P_3_5_SPACE_Y__3}>
                  <div className={MR.MOTION_TEXT_FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN}>
                    <div className={MR.MOTION_TEXT_FLEX_ITEMS_CENTER_GAP_1_5_TEXT_XS_FONT_SEMIBOLD_TEXT_SLATE_200}>
                      <BookmarkCheck className={MR.MOTION_TEXT_H_4_W_4_TEXT_AMBER_400} />
                      <span>{text.VIDEO_DNA_EVIDENCE || MR.MOTION_TEXT_CAN_CU_DAN_CHUNG_TU_DU_LIEU_GOC}</span>
                    </div>
                    <span className={MR.MOTION_TEXT_TEXT_11PX_TEXT_SLATE_500}>
                      {dna.evidence.length} {isEn ? MR.MOTION_TEXT_SOURCES : MR.MOTION_TEXT_DAN_CHUNG}
                    </span>
                  </div>
                  <div className={MR.MOTION_TEXT_SPACE_Y_2_MAX_H_48_OVERFLOW_Y_AUTO_PR_1}>
                    {dna.evidence.map((ev, idx) => (
                      <div key={idx} className={MR.MOTION_TEXT_ROUNDED_LG_BG_SLATE_950_70_P_2_5_BORDER_BORDER_SLATE_800_80_TEXT_}>
                        <div className={MR.MOTION_TEXT_FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN_GAP_2}>
                          <span className={MR.MOTION_TEXT_FONT_SEMIBOLD_TEXT_SLATE_200}>{ev.claim}</span>
                          {ev.confidence > 0 && (
                            <span className={MR.MOTION_TEXT_ROUNDED_BG_EMERALD_950_60_PX_1_5_PY_0_2_TEXT_10PX_FONT_BOLD_TEXT_}>
                              {ev.confidence}
                              {MR.MOTION_TEXT_SYMBOL_40}
                            </span>
                          )}
                        </div>
                        <p className={MR.MOTION_TEXT_TEXT_11PX_TEXT_SLATE_400_ITALIC}>
                          {MR.MOTION_TEXT_SYMBOL_47}
                          {ev.sourceClue}
                          {MR.MOTION_TEXT_SYMBOL_47}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
