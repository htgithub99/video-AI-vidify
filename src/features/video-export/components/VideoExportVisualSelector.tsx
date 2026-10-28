import { RUNTIME_TEXT as RT_VIDEO_EXPORT } from "../constants/runtimeText.js";
import { RUNTIME_TEXT as RT_SHARED } from "../../../constants/runtime/shared.js";
import { StudioInput } from "../../../components/ui/Studio.js";
import {
  VIDEO_EXPORT_TEMPLATE_KET_QUA_TIM_KIEM_CHO,
  VIDEO_EXPORT_TEXT_5XL,
  VIDEO_EXPORT_TEXT_AM_THANH,
  VIDEO_EXPORT_TEXT_BO_LOC,
  VIDEO_EXPORT_TEXT_BUTTON,
  VIDEO_EXPORT_TEXT_CHUYEN_TIEP,
  VIDEO_EXPORT_TEXT_DANG_THINH_HANH_TAT_CA,
  VIDEO_EXPORT_TEXT_DA_CHON,
  VIDEO_EXPORT_TEXT_FROM_AMBER_200_VIA_ROSE_300,
  VIDEO_EXPORT_TEXT_FROM_AMBER_500_VIA_ROSE_600,
  VIDEO_EXPORT_TEXT_FROM_AMBER_600_VIA_ORANGE_600,
  VIDEO_EXPORT_TEXT_FROM_AMBER_600_VIA_ORANGE_700,
  VIDEO_EXPORT_TEXT_FROM_AMBER_700_VIA_YELLOW_800,
  VIDEO_EXPORT_TEXT_FROM_BLUE_500_VIA_CYAN_600,
  VIDEO_EXPORT_TEXT_FROM_BLUE_600_VIA_CYAN_500,
  VIDEO_EXPORT_TEXT_FROM_BLUE_600_VIA_INDIGO_600,
  VIDEO_EXPORT_TEXT_FROM_CYAN_400_VIA_BLUE_600,
  VIDEO_EXPORT_TEXT_FROM_CYAN_500_VIA_FUCHSIA_600,
  VIDEO_EXPORT_TEXT_FROM_CYAN_500_VIA_PURPLE_600,
  VIDEO_EXPORT_TEXT_FROM_EMERALD_500_VIA_TEAL_600,
  VIDEO_EXPORT_TEXT_FROM_EMERALD_600_VIA_TEAL_700,
  VIDEO_EXPORT_TEXT_FROM_FUCHSIA_600_VIA_PURPLE_600,
  VIDEO_EXPORT_TEXT_FROM_INDIGO_500_VIA_PURPLE_600,
  VIDEO_EXPORT_TEXT_FROM_INDIGO_600_VIA_PURPLE_600,
  VIDEO_EXPORT_TEXT_FROM_INDIGO_700_VIA_PURPLE_600,
  VIDEO_EXPORT_TEXT_FROM_LIME_500_VIA_EMERALD_600,
  VIDEO_EXPORT_TEXT_FROM_ORANGE_500_VIA_AMBER_600,
  VIDEO_EXPORT_TEXT_FROM_ORANGE_500_VIA_ROSE_600,
  VIDEO_EXPORT_TEXT_FROM_PINK_500_VIA_PURPLE_600,
  VIDEO_EXPORT_TEXT_FROM_PINK_500_VIA_ROSE_600,
  VIDEO_EXPORT_TEXT_FROM_PURPLE_600_VIA_INDIGO_500,
  VIDEO_EXPORT_TEXT_FROM_PURPLE_600_VIA_INDIGO_600,
  VIDEO_EXPORT_TEXT_FROM_PURPLE_600_VIA_PINK_500,
  VIDEO_EXPORT_TEXT_FROM_PURPLE_700_VIA_INDIGO_600,
  VIDEO_EXPORT_TEXT_FROM_RED_600_VIA_ORANGE_600,
  VIDEO_EXPORT_TEXT_FROM_RED_600_VIA_ROSE_600,
  VIDEO_EXPORT_TEXT_FROM_ROSE_500_VIA_PINK_600,
  VIDEO_EXPORT_TEXT_FROM_ROSE_500_VIA_PURPLE_600,
  VIDEO_EXPORT_TEXT_FROM_SKY_400_VIA_BLUE_500,
  VIDEO_EXPORT_TEXT_FROM_SKY_500_VIA_BLUE_600,
  VIDEO_EXPORT_TEXT_FROM_SKY_600_VIA_INDIGO_600,
  VIDEO_EXPORT_TEXT_FROM_SLATE_400_VIA_ZINC_600,
  VIDEO_EXPORT_TEXT_FROM_SLATE_700_VIA_ZINC_800,
  VIDEO_EXPORT_TEXT_FROM_SLATE_700_VIA_ZINC_800_2,
  VIDEO_EXPORT_TEXT_FROM_SLATE_800_VIA_SKY_900,
  VIDEO_EXPORT_TEXT_FROM_TEAL_400_VIA_EMERALD_500,
  VIDEO_EXPORT_TEXT_FROM_TEAL_500_VIA_CYAN_600,
  VIDEO_EXPORT_TEXT_FROM_TEAL_600_VIA_CYAN_600,
  VIDEO_EXPORT_TEXT_FROM_VIOLET_600_VIA_PURPLE_700,
  VIDEO_EXPORT_TEXT_FROM_YELLOW_100_VIA_AMBER_200,
  VIDEO_EXPORT_TEXT_FROM_ZINC_500_VIA_STONE_600,
  VIDEO_EXPORT_TEXT_FROM_ZINC_700_VIA_SLATE_800,
  VIDEO_EXPORT_TEXT_FROM_ZINC_900_VIA_NEUTRAL_700,
  VIDEO_EXPORT_TEXT_FROM_ZINC_950_VIA_NEUTRAL_900,
  VIDEO_EXPORT_TEXT_HIEU_UNG,
  VIDEO_EXPORT_TEXT_KHONG_TIM_THAY_HIEU_UNG_PHU,
  VIDEO_EXPORT_TEXT_MOI_NGUOI_DANG_TIM_KIEM_RETRO,
  VIDEO_EXPORT_TEXT_NHAN_DAN,
  VIDEO_EXPORT_TEXT_SYMBOL_10,
  VIDEO_EXPORT_TEXT_SYMBOL_5,
  VIDEO_EXPORT_TEXT_SYMBOL_9,
  VIDEO_EXPORT_TEXT_TEP_PHUONG_TIEN,
  VIDEO_EXPORT_TEXT_TEXT,
  VIDEO_EXPORT_TEXT_UNSTYLED,
  VIDEO_EXPORT_TEXT_VAN_BAN,
  VIDEO_EXPORT_TEXT_YEU_THICH_TAT_CA,
} from "../../../constants/videoExportText";
import { FC, useMemo, useState } from "react";
import _ from "lodash";
import { Check, ChevronDown, ChevronRight, Download, Film, FolderOpen, Music, Search, Sliders, Sparkles, Sticker, Type, Wand2, X } from "lucide-react";
import { Button } from "../../../components/ui/Button.js";
import { Modal } from "../../../components/ui/Modal.js";
import { cn } from "../../../lib/utils.js";
import { VIDEO_EXPORT_CONSTANTS } from "../constants/videoExport.js";
import { getVideoExportOptions, VideoExportTexts } from "./videoExportUtils.js";
import { VideoExportOptionItem, VideoExportOptionSection } from "./VideoExportOptionGrid.js";
type VideoExportVisualSelectorProps<T extends string | number> = { text: VideoExportTexts; label: string; badge?: string; value: T; options?: VideoExportOptionItem<T>[]; sections?: VideoExportOptionSection<T>[]; disabled?: boolean; accentColor?: typeof VIDEO_EXPORT_CONSTANTS.COLOR_PURPLE | typeof VIDEO_EXPORT_CONSTANTS.COLOR_CYAN; onChange: (value: T) => void };
const PRESET_GRADIENTS: Record<string, string> = {
  flash_white: VIDEO_EXPORT_TEXT_FROM_AMBER_200_VIA_ROSE_300,
  glitch_rgb: VIDEO_EXPORT_TEXT_FROM_CYAN_500_VIA_FUCHSIA_600,
  heart_beat: VIDEO_EXPORT_TEXT_FROM_ROSE_500_VIA_PINK_600,
  disco_strobe: VIDEO_EXPORT_TEXT_FROM_PURPLE_600_VIA_INDIGO_500,
  bounce_zoom: VIDEO_EXPORT_TEXT_FROM_ORANGE_500_VIA_AMBER_600,
  dreamy_glow: VIDEO_EXPORT_TEXT_FROM_TEAL_400_VIA_EMERALD_500,
  vintage_film: VIDEO_EXPORT_TEXT_FROM_AMBER_700_VIA_YELLOW_800,
  neon_cyber: VIDEO_EXPORT_TEXT_FROM_CYAN_400_VIA_BLUE_600,
  cinema_drama: VIDEO_EXPORT_TEXT_FROM_SLATE_800_VIA_SKY_900,
  black_white: VIDEO_EXPORT_TEXT_FROM_ZINC_900_VIA_NEUTRAL_700,
  retro_decades: VIDEO_EXPORT_TEXT_FROM_AMBER_600_VIA_ORANGE_600,
  white_noise: VIDEO_EXPORT_TEXT_FROM_SLATE_400_VIA_ZINC_600,
  zoom_in: VIDEO_EXPORT_TEXT_FROM_BLUE_600_VIA_INDIGO_600,
  zoom_out: VIDEO_EXPORT_TEXT_FROM_PURPLE_700_VIA_INDIGO_600,
  ken_burns: VIDEO_EXPORT_TEXT_FROM_AMBER_600_VIA_ORANGE_700,
  pulse: VIDEO_EXPORT_TEXT_FROM_PINK_500_VIA_ROSE_600,
  shake: VIDEO_EXPORT_TEXT_FROM_RED_600_VIA_ORANGE_600,
  swing: VIDEO_EXPORT_TEXT_FROM_TEAL_500_VIA_CYAN_600,
  zoom_rotate: VIDEO_EXPORT_TEXT_FROM_EMERALD_500_VIA_TEAL_600,
  none: VIDEO_EXPORT_TEXT_FROM_ZINC_700_VIA_SLATE_800,
  random: VIDEO_EXPORT_TEXT_FROM_FUCHSIA_600_VIA_PURPLE_600,
  fade: VIDEO_EXPORT_TEXT_FROM_SLATE_700_VIA_ZINC_800,
  fadeblack: VIDEO_EXPORT_TEXT_FROM_ZINC_950_VIA_NEUTRAL_900,
  dissolve: VIDEO_EXPORT_TEXT_FROM_PURPLE_600_VIA_PINK_500,
  fadewhite: VIDEO_EXPORT_TEXT_FROM_YELLOW_100_VIA_AMBER_200,
  hblur: VIDEO_EXPORT_TEXT_FROM_SKY_500_VIA_BLUE_600,
  fadegrays: VIDEO_EXPORT_TEXT_FROM_ZINC_500_VIA_STONE_600,
  slideleft: VIDEO_EXPORT_TEXT_FROM_BLUE_500_VIA_CYAN_600,
  slideright: VIDEO_EXPORT_TEXT_FROM_TEAL_600_VIA_CYAN_600,
  slideup: VIDEO_EXPORT_TEXT_FROM_PURPLE_600_VIA_INDIGO_600,
  slidedown: VIDEO_EXPORT_TEXT_FROM_SKY_600_VIA_INDIGO_600,
  smoothleft: VIDEO_EXPORT_TEXT_FROM_INDIGO_500_VIA_PURPLE_600,
  coverleft: VIDEO_EXPORT_TEXT_FROM_ROSE_500_VIA_PURPLE_600,
  revealright: VIDEO_EXPORT_TEXT_FROM_INDIGO_700_VIA_PURPLE_600,
  circleopen: VIDEO_EXPORT_TEXT_FROM_PINK_500_VIA_PURPLE_600,
  circleclose: VIDEO_EXPORT_TEXT_FROM_CYAN_500_VIA_PURPLE_600,
  radial: VIDEO_EXPORT_TEXT_FROM_AMBER_500_VIA_ROSE_600,
  horzopen: VIDEO_EXPORT_TEXT_FROM_EMERALD_600_VIA_TEAL_700,
  diagtl: VIDEO_EXPORT_TEXT_FROM_VIOLET_600_VIA_PURPLE_700,
  hlslice: VIDEO_EXPORT_TEXT_FROM_RED_600_VIA_ROSE_600,
  zoomin: VIDEO_EXPORT_TEXT_FROM_BLUE_600_VIA_CYAN_500,
  pixelize: VIDEO_EXPORT_TEXT_FROM_LIME_500_VIA_EMERALD_600,
  squeezeh: VIDEO_EXPORT_TEXT_FROM_ORANGE_500_VIA_ROSE_600,
  hlwind: VIDEO_EXPORT_TEXT_FROM_SKY_400_VIA_BLUE_500,
  distance: VIDEO_EXPORT_TEXT_FROM_SLATE_700_VIA_ZINC_800_2,
};
export const VideoExportVisualSelector = <T extends string | number>({ text, label, badge, value, options = [], sections, disabled = false, accentColor = VIDEO_EXPORT_CONSTANTS.COLOR_PURPLE, onChange }: VideoExportVisualSelectorProps<T>): ReturnType<FC> => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [activeCategory, setActiveCategory] = useState<string>(VIDEO_EXPORT_CONSTANTS.CATEGORY_ALL);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isSidebarEffectsOpen, setIsSidebarEffectsOpen] = useState<boolean>(true);
  const allItems = useMemo(() => getVideoExportOptions(options, sections), [sections, options]);
  const selectedItem = useMemo(() => _.find(allItems, (item) => item.value === value), [allItems, value]);
  const SelectedIcon = selectedItem?.icon || (accentColor === VIDEO_EXPORT_CONSTANTS.COLOR_CYAN ? Sparkles : Wand2);
  const selectedSectionName = useMemo(() => {
    if (!sections) return undefined;
    const found = _.find(sections, (sec) => _.some(sec.options, (opt) => opt.value === value));
    return found?.label;
  }, [sections, value]);
  const categories = useMemo(() => {
    if (_.isEmpty(sections)) return [];
    return [{ key: VIDEO_EXPORT_CONSTANTS.CATEGORY_ALL, label: text.VISUAL_ALL_CATEGORY, count: allItems.length }, ..._.map(sections, (sec) => ({ key: sec.key, label: sec.label, count: sec.options.length }))];
  }, [sections, allItems.length, text.VISUAL_ALL_CATEGORY]);
  const filteredItems = useMemo(() => {
    let list = allItems;
    if (activeCategory !== VIDEO_EXPORT_CONSTANTS.CATEGORY_ALL && sections) {
      const targetSec = _.find(sections, (sec) => sec.key === activeCategory);
      list = targetSec ? targetSec.options : allItems;
    }
    const query = _.trim(searchQuery).toLowerCase();
    if (!query) return list;
    return _.filter(list, (item) => _.includes(item.label.toLowerCase(), query));
  }, [allItems, activeCategory, sections, searchQuery]);
  const isPurple = accentColor === VIDEO_EXPORT_CONSTANTS.COLOR_PURPLE;
  const currentCategoryLabel = useMemo(() => {
    if (activeCategory === VIDEO_EXPORT_CONSTANTS.CATEGORY_ALL) return VIDEO_EXPORT_TEXT_DANG_THINH_HANH_TAT_CA;
    const found = _.find(categories, (c) => c.key === activeCategory);
    return found?.label || VIDEO_EXPORT_TEXT_HIEU_UNG;
  }, [categories, activeCategory]);
  return (
    <div className={cn(RT_VIDEO_EXPORT.SPACE_Y_1_5_PT_0_5_TEXT_LEFT)}>
      <div className={cn(RT_SHARED.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN_GAP_2)}>
        <span className={cn(RT_VIDEO_EXPORT.TEXT_XS_FONT_MEDIUM_TEXT_ZINC_800_DARK_TEXT_SLATE)}>{label}</span>
        {badge && <span className={cn(RT_VIDEO_EXPORT.PX_1_5_PY_0_2_ROUNDED_TEXT_10PX_FONT)}>{badge}</span>}
      </div>
      <Button variant={VIDEO_EXPORT_TEXT_UNSTYLED} type={VIDEO_EXPORT_TEXT_BUTTON} disabled={disabled} onClick={() => setIsModalOpen(true)} className={cn(RT_VIDEO_EXPORT.W_FULL_P_2_5_ROUNDED_2XL_BORDER_TRANSITION_ALL, RT_VIDEO_EXPORT.BG_WHITE_DARK_BG_SLATE_955_70_BORDER_SLATE_200)}>
        <div className={cn(RT_SHARED.FLEX_ITEMS_CENTER_GAP_2_5_MIN_W_0)}>
          <div className={cn(RT_VIDEO_EXPORT.W_10_H_10_ROUNDED_XL_FLEX_ITEMS_CENTER_JUSTIFY)}>
            <div className={RT_VIDEO_EXPORT.ABSOLUTE_TOP_1_LEFT_1_TEXT_9PX}>{VIDEO_EXPORT_TEXT_SYMBOL_9}</div>
            <SelectedIcon className={cn(RT_SHARED.W_5_H_5)} />
          </div>
          <div className={cn(RT_VIDEO_EXPORT.MIN_W_0_SPACE_Y_0_5)}>
            <div className={cn(RT_VIDEO_EXPORT.TEXT_XS_FONT_EXTRABOLD_TEXT_ZINC_900_DARK_TEXT_WHITE)}>
              <span>{selectedItem?.label || text.VISUAL_SELECT_UNSELECTED}</span>
              {selectedSectionName && <span className={cn(RT_VIDEO_EXPORT.TEXT_9PX_FONT_MONO_FONT_BOLD_PX_1_5_PY)}>{selectedSectionName}</span>}
            </div>
            <div className={cn(RT_VIDEO_EXPORT.TEXT_11PX_TEXT_ZINC_600_DARK_TEXT_ZINC_400_FONT)}>{text.VISUAL_SELECT_CLICK_HINT(allItems.length)}</div>
          </div>
        </div>
        <div className={cn(RT_VIDEO_EXPORT.TEXT_XS_FONT_BOLD_TEXT_CYAN_600_DARK_TEXT_CYAN)}>
          <span>{text.VISUAL_SELECT_CHANGE}</span>
          <ChevronRight className={cn(RT_SHARED.W_3_5_H_3_5)} />
        </div>
      </Button>
      {isModalOpen && (
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={text.VISUAL_MODAL_TITLE(label)} maxWidth={VIDEO_EXPORT_TEXT_5XL}>
          <div className={RT_VIDEO_EXPORT.FLEX_FLEX_COL_H_75VH_MAX_H_750PX_SELECT_NONE}>
            <div className={RT_VIDEO_EXPORT.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN_PX_4_PY_2_5}>
              <div className={RT_VIDEO_EXPORT.FLEX_ITEMS_CENTER_GAP_1_SM_GAP_2_OVERFLOW_X}>
                <div className={RT_VIDEO_EXPORT.FLEX_ITEMS_CENTER_GAP_1_5_PX_3_PY_1}>
                  <FolderOpen className={RT_SHARED.W_3_5_H_3_5} />
                  <span className={RT_SHARED.HIDDEN_SM_INLINE}>{VIDEO_EXPORT_TEXT_TEP_PHUONG_TIEN}</span>
                </div>
                <div className={RT_VIDEO_EXPORT.FLEX_ITEMS_CENTER_GAP_1_5_PX_3_PY_1}>
                  <Music className={RT_SHARED.W_3_5_H_3_5} />
                  <span className={RT_SHARED.HIDDEN_SM_INLINE}>{VIDEO_EXPORT_TEXT_AM_THANH}</span>
                </div>
                <div className={RT_VIDEO_EXPORT.FLEX_ITEMS_CENTER_GAP_1_5_PX_3_PY_1}>
                  <Type className={RT_SHARED.W_3_5_H_3_5} />
                  <span className={RT_SHARED.HIDDEN_SM_INLINE}>{VIDEO_EXPORT_TEXT_VAN_BAN}</span>
                </div>
                <div className={RT_VIDEO_EXPORT.FLEX_ITEMS_CENTER_GAP_1_5_PX_3_PY_1}>
                  <Sticker className={RT_SHARED.W_3_5_H_3_5} />
                  <span className={RT_SHARED.HIDDEN_SM_INLINE}>{VIDEO_EXPORT_TEXT_NHAN_DAN}</span>
                </div>
                <div className={RT_VIDEO_EXPORT.FLEX_ITEMS_CENTER_GAP_1_5_PX_3_PY_1_961042}>
                  <Sparkles className={RT_VIDEO_EXPORT.W_3_5_H_3_5_FILL_00E5FF} />
                  <span>{label}</span>
                </div>
                <div className={RT_VIDEO_EXPORT.FLEX_ITEMS_CENTER_GAP_1_5_PX_3_PY_1}>
                  <Film className={RT_SHARED.W_3_5_H_3_5} />
                  <span className={RT_SHARED.HIDDEN_SM_INLINE}>{VIDEO_EXPORT_TEXT_CHUYEN_TIEP}</span>
                </div>
                <div className={RT_VIDEO_EXPORT.FLEX_ITEMS_CENTER_GAP_1_5_PX_3_PY_1}>
                  <Sliders className={RT_SHARED.W_3_5_H_3_5} />
                  <span className={RT_SHARED.HIDDEN_SM_INLINE}>{VIDEO_EXPORT_TEXT_BO_LOC}</span>
                </div>
              </div>
            </div>
            <div className={RT_VIDEO_EXPORT.FLEX_FLEX_1_MIN_H_0_OVERFLOW_HIDDEN_BG_141416}>
              <div className={RT_VIDEO_EXPORT.W_52_MD_W_56_SHRINK_0_BG_19191D_BORDER}>
                <Button
                  variant={VIDEO_EXPORT_TEXT_UNSTYLED}
                  type={VIDEO_EXPORT_TEXT_BUTTON}
                  onClick={() => {
                    setActiveCategory(VIDEO_EXPORT_CONSTANTS.CATEGORY_ALL);
                    setSearchQuery("");
                  }}
                  className={cn(RT_VIDEO_EXPORT.W_FULL_PX_3_PY_2_ROUNDED_XL_TEXT_XS, activeCategory === VIDEO_EXPORT_CONSTANTS.CATEGORY_ALL && !searchQuery ? RT_VIDEO_EXPORT.BG_0E383D_TEXT_00E5FF_BORDER_00E5FF_30_SHADOW_SM : RT_VIDEO_EXPORT.TEXT_ZINC_400_BORDER_TRANSPARENT_HOVER_BG_ZINC_800_60)}>
                  <span>{VIDEO_EXPORT_TEXT_YEU_THICH_TAT_CA}</span>
                  <span className={RT_VIDEO_EXPORT.ML_AUTO_TEXT_10PX_FONT_MONO_PX_1_5_PY}>{allItems.length}</span>
                </Button>
                <div className={RT_VIDEO_EXPORT.MT_1}>
                  <Button variant={VIDEO_EXPORT_TEXT_UNSTYLED} type={VIDEO_EXPORT_TEXT_BUTTON} onClick={() => setIsSidebarEffectsOpen(!isSidebarEffectsOpen)} className={RT_VIDEO_EXPORT.W_FULL_PX_2_5_PY_1_5_TEXT_ZINC}>
                    <span className={RT_SHARED.TRUNCATE}>{label}</span>
                    <ChevronDown className={cn(RT_VIDEO_EXPORT.W_3_5_H_3_5_TRANSITION_TRANSFORM_DURATION_200, isSidebarEffectsOpen ? RT_VIDEO_EXPORT.ROTATE_0 : RT_VIDEO_EXPORT.ROTATE_90)} />
                  </Button>
                  {isSidebarEffectsOpen && !_.isEmpty(categories) && (
                    <div className={RT_VIDEO_EXPORT.SPACE_Y_0_5_MT_1_PL_1}>
                      {_.map(categories, (cat) => {
                        if (cat.key === VIDEO_EXPORT_CONSTANTS.CATEGORY_ALL) return null;
                        const isCatActive = activeCategory === cat.key;
                        return (
                          <Button
                            key={cat.key}
                            variant={VIDEO_EXPORT_TEXT_UNSTYLED}
                            type={VIDEO_EXPORT_TEXT_BUTTON}
                            onClick={() => {
                              setActiveCategory(cat.key);
                              setSearchQuery("");
                            }}
                            className={cn(RT_VIDEO_EXPORT.W_FULL_PX_3_PY_2_ROUNDED_XL_TEXT_XS_99D461, isCatActive ? RT_VIDEO_EXPORT.BG_0E383D_TEXT_00E5FF_FONT_BOLD_BORDER_00E5FF_30_SHADOW : RT_VIDEO_EXPORT.TEXT_ZINC_400_BORDER_TRANSPARENT_HOVER_BG_ZINC_800_50)}>
                            <span className={RT_SHARED.TRUNCATE}>{cat.label}</span>
                            <span className={cn(RT_VIDEO_EXPORT.TEXT_10PX_FONT_MONO_PX_1_5_PY_0_2, isCatActive ? RT_VIDEO_EXPORT.BG_00E5FF_20_TEXT_00E5FF : RT_VIDEO_EXPORT.BG_BLACK_30_TEXT_ZINC_500)}>{cat.count}</span>
                          </Button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
              <div className={RT_VIDEO_EXPORT.FLEX_1_FLEX_FLEX_COL_MIN_W_0_BG_121214}>
                <div className={RT_VIDEO_EXPORT.RELATIVE_W_FULL_MAX_W_XL_SHRINK_0}>
                  <Search className={RT_VIDEO_EXPORT.ABSOLUTE_LEFT_3_5_TOP_1_2_TRANSLATE_Y_1} />
                  <StudioInput type={VIDEO_EXPORT_TEXT_TEXT} autoFocus value={searchQuery} placeholder={VIDEO_EXPORT_TEXT_MOI_NGUOI_DANG_TIM_KIEM_RETRO} onChange={(e) => setSearchQuery(e.target.value)} className={RT_VIDEO_EXPORT.W_FULL_H_9_PL_10_PR_9_ROUNDED_FULL} />
                  {searchQuery && (
                    <Button variant={VIDEO_EXPORT_TEXT_UNSTYLED} type={VIDEO_EXPORT_TEXT_BUTTON} onClick={() => setSearchQuery("")} className={RT_VIDEO_EXPORT.ABSOLUTE_RIGHT_2_5_TOP_1_2_TRANSLATE_Y_1}>
                      <X className={RT_SHARED.W_3_H_3} />
                    </Button>
                  )}
                </div>
                <div className={RT_VIDEO_EXPORT.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN_SHRINK_0_PX_0_5}>
                  <div className={RT_VIDEO_EXPORT.TEXT_SM_FONT_BOLD_TEXT_ZINC_100_FLEX_ITEMS_CENTER}>
                    <span>{searchQuery ? VIDEO_EXPORT_TEMPLATE_KET_QUA_TIM_KIEM_CHO(`${searchQuery}`) : currentCategoryLabel}</span>
                    <span className={RT_VIDEO_EXPORT.TEXT_XS_FONT_MONO_FONT_NORMAL_TEXT_ZINC_400}>
                      {VIDEO_EXPORT_TEXT_SYMBOL_10}
                      {filteredItems.length}
                      {VIDEO_EXPORT_TEXT_SYMBOL_5}
                    </span>
                  </div>
                </div>
                <div className={RT_VIDEO_EXPORT.FLEX_1_OVERFLOW_Y_AUTO_PR_1_5_CUSTOM_SCROLLBAR}>
                  {_.isEmpty(filteredItems) ? (
                    <div className={RT_VIDEO_EXPORT.PY_16_TEXT_CENTER_TEXT_ZINC_500_TEXT_XS_FONT}>
                      <Search className={RT_VIDEO_EXPORT.W_8_H_8_TEXT_ZINC_600_STROKE_1_5} />
                      <span>{VIDEO_EXPORT_TEXT_KHONG_TIM_THAY_HIEU_UNG_PHU}</span>
                    </div>
                  ) : (
                    <div className={RT_VIDEO_EXPORT.GRID_GRID_COLS_2_SM_GRID_COLS_3_MD_GRID}>
                      {_.map(filteredItems, (item) => {
                        const isSelected = item.value === value;
                        const ItemIcon = item.icon || (isPurple ? Wand2 : Sparkles);
                        const valKey = _.toString(item.value).toLowerCase();
                        const gradientTheme = PRESET_GRADIENTS[valKey] || VIDEO_EXPORT_TEXT_FROM_INDIGO_600_VIA_PURPLE_600;
                        return (
                          <div
                            key={`${item.value}`}
                            onClick={() => {
                              onChange(item.value);
                              setIsModalOpen(false);
                            }}
                            className={cn(RT_VIDEO_EXPORT.GROUP_FLEX_FLEX_COL_ITEMS_CENTER_GAP_1_5_TRANSITION)}>
                            <div className={cn(RT_VIDEO_EXPORT.W_FULL_ASPECT_SQUARE_ROUNDED_2XL_RELATIVE_OVERFLOW_HIDDEN_FLEX, isSelected ? RT_VIDEO_EXPORT.BORDER_2_BORDER_00E5FF_RING_2_RING_00E5FF_50_SHADOW : RT_VIDEO_EXPORT.BORDER_ZINC_800_BG_1A1A1F_HOVER_BORDER_ZINC_400_HOVER)}>
                              <div className={cn(RT_VIDEO_EXPORT.ABSOLUTE_INSET_0_BG_GRADIENT_TO_BR_OPACITY_80_GROUP, gradientTheme)} />
                              <div className={cn(RT_VIDEO_EXPORT.ABSOLUTE_INSET_0_TRANSITION_COLORS_DURATION_200, isSelected ? RT_VIDEO_EXPORT.BG_CYAN_950_20 : RT_VIDEO_EXPORT.BG_BLACK_40_GROUP_HOVER_BG_BLACK_20)} />
                              <div className={RT_VIDEO_EXPORT.ABSOLUTE_TOP_2_LEFT_2_W_5_H_5_ROUNDED}>{VIDEO_EXPORT_TEXT_SYMBOL_9}</div>
                              <div className={cn(RT_VIDEO_EXPORT.RELATIVE_Z_10_W_11_H_11_ROUNDED_XL_BACKDROP, isSelected ? RT_VIDEO_EXPORT.BG_00E5FF_25_BORDER_00E5FF_60_TEXT_00E5FF_SHADOW_00E5FF : RT_VIDEO_EXPORT.BG_BLACK_40_BORDER_WHITE_10_TEXT_WHITE)}>
                                <ItemIcon className={RT_SHARED.W_5_H_5} />
                              </div>
                              <div className={cn(RT_VIDEO_EXPORT.ABSOLUTE_BOTTOM_2_RIGHT_2_W_6_H_6_ROUNDED, isSelected ? RT_VIDEO_EXPORT.BG_00E5FF_TEXT_BLACK_RING_2_RING_WHITE_50_SCALE : RT_VIDEO_EXPORT.BG_BLACK_70_TEXT_WHITE_90_GROUP_HOVER_BG_WHITE)}>{isSelected ? <Check className={RT_VIDEO_EXPORT.W_3_5_H_3_5_STROKE_3} /> : <Download className={RT_VIDEO_EXPORT.W_3_H_3_STROKE_2_5} />}</div>
                              {isSelected && <div className={RT_VIDEO_EXPORT.ABSOLUTE_TOP_2_RIGHT_2_PX_2_PY_0_5}>{VIDEO_EXPORT_TEXT_DA_CHON}</div>}
                            </div>
                            <div className={RT_VIDEO_EXPORT.W_FULL_TEXT_CENTER_PX_1}>
                              <span className={cn(RT_VIDEO_EXPORT.TEXT_XS_TRUNCATE_BLOCK_TRANSITION_COLORS_LEADING_TIGHT, isSelected ? RT_VIDEO_EXPORT.TEXT_00E5FF_FONT_BLACK : RT_VIDEO_EXPORT.TEXT_ZINC_300_GROUP_HOVER_TEXT_WHITE_FONT_MEDIUM)}>{item.label}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
