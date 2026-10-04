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
} from "../../constants/videoExportText";
import { FC, useMemo, useState } from "react";
import _ from "lodash";
import { Check, ChevronDown, ChevronRight, Download, Film, FolderOpen, Music, Search, Sliders, Sparkles, Sticker, Type, Wand2, X } from "lucide-react";
import { Button } from "../ui/Button.js";
import { Modal } from "../ui/Modal.js";
import { cn } from "../../lib/utils.js";
import { VIDEO_EXPORT_CONSTANTS } from "../../constants/videoExport.js";
import { getVideoExportOptions, VideoExportTexts } from "./videoExportUtils.js";
import { VideoExportOptionItem, VideoExportOptionSection } from "./VideoExportOptionGrid.js";
type VideoExportVisualSelectorProps<T extends string | number> = {
  text: VideoExportTexts;
  label: string;
  badge?: string;
  value: T;
  options?: VideoExportOptionItem<T>[];
  sections?: VideoExportOptionSection<T>[];
  disabled?: boolean;
  accentColor?: typeof VIDEO_EXPORT_CONSTANTS.COLOR_PURPLE | typeof VIDEO_EXPORT_CONSTANTS.COLOR_CYAN;
  onChange: (value: T) => void;
};
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
    <div className={cn("space-y-1.5 pt-0.5 text-left")}>
      <div className={cn("flex items-center justify-between gap-2")}>
        <span className={cn("text-xs font-medium text-zinc-800 dark:text-slate-300")}>{label}</span>
        {badge && <span className={cn("px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-purple-500/15 border border-purple-500/30 text-purple-600 dark:text-purple-400")}>{badge}</span>}
      </div>
      <Button
        variant={VIDEO_EXPORT_TEXT_UNSTYLED}
        type={VIDEO_EXPORT_TEXT_BUTTON}
        disabled={disabled}
        onClick={() => setIsModalOpen(true)}
        className={cn("w-full p-2.5 rounded-2xl border transition-all text-left flex items-center justify-between gap-3 group cursor-pointer select-none disabled:opacity-60 disabled:cursor-not-allowed", "bg-white dark:bg-slate-955/70 border-slate-200 dark:border-slate-800 hover:border-cyan-400 dark:hover:border-cyan-500/50 hover:bg-slate-50 dark:hover:bg-slate-900/80 shadow-2xs")}>
        <div className={cn("flex items-center gap-2.5 min-w-0")}>
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-transform group-hover:scale-105 bg-gradient-to-tr from-cyan-500/20 to-purple-500/20 border-cyan-400/30 text-cyan-600 dark:text-cyan-400 shadow-sm relative overflow-hidden")}>
            <div className="absolute top-1 left-1 text-[9px]">{VIDEO_EXPORT_TEXT_SYMBOL_9}</div>
            <SelectedIcon className={cn("w-5 h-5")} />
          </div>
          <div className={cn("min-w-0 space-y-0.5")}>
            <div className={cn("text-xs font-extrabold text-zinc-900 dark:text-white truncate flex items-center gap-1.5")}>
              <span>{selectedItem?.label || text.VISUAL_SELECT_UNSELECTED}</span>
              {selectedSectionName && <span className={cn("text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-cyan-100 dark:bg-cyan-950/80 text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-500/30")}>{selectedSectionName}</span>}
            </div>
            <div className={cn("text-[11px] text-zinc-600 dark:text-zinc-400 font-medium")}>{text.VISUAL_SELECT_CLICK_HINT(allItems.length)}</div>
          </div>
        </div>
        <div className={cn("text-xs font-bold text-cyan-600 dark:text-cyan-400 flex items-center gap-0.5 shrink-0 transition-all group-hover:translate-x-0.5 group-hover:text-cyan-700 dark:group-hover:text-cyan-300")}>
          <span>{text.VISUAL_SELECT_CHANGE}</span>
          <ChevronRight className={cn("w-3.5 h-3.5")} />
        </div>
      </Button>
      {isModalOpen && (
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={text.VISUAL_MODAL_TITLE(label)} maxWidth={VIDEO_EXPORT_TEXT_5XL}>
          <div className="flex flex-col h-[75vh] max-h-[750px] select-none text-left -m-4 sm:-m-6">
            <div className="flex items-center justify-between px-4 py-2.5 bg-[#1f1f24] dark:bg-[#161619] border-b border-zinc-800 shrink-0">
              <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar py-0.5">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer">
                  <FolderOpen className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{VIDEO_EXPORT_TEXT_TEP_PHUONG_TIEN}</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer">
                  <Music className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{VIDEO_EXPORT_TEXT_AM_THANH}</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer">
                  <Type className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{VIDEO_EXPORT_TEXT_VAN_BAN}</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer">
                  <Sticker className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{VIDEO_EXPORT_TEXT_NHAN_DAN}</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black text-[#00e5ff] bg-[#00e5ff]/10 border border-[#00e5ff]/30 shadow-sm cursor-pointer">
                  <Sparkles className="w-3.5 h-3.5 fill-[#00e5ff]" />
                  <span>{label}</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer">
                  <Film className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{VIDEO_EXPORT_TEXT_CHUYEN_TIEP}</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer">
                  <Sliders className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{VIDEO_EXPORT_TEXT_BO_LOC}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-1 min-h-0 overflow-hidden bg-[#141416]">
              <div className="w-52 md:w-56 shrink-0 bg-[#19191d] border-r border-zinc-800/80 flex flex-col p-2 gap-1 overflow-y-auto custom-scrollbar">
                <Button
                  variant={VIDEO_EXPORT_TEXT_UNSTYLED}
                  type={VIDEO_EXPORT_TEXT_BUTTON}
                  onClick={() => {
                    setActiveCategory(VIDEO_EXPORT_CONSTANTS.CATEGORY_ALL);
                    setSearchQuery("");
                  }}
                  className={cn("w-full px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer select-none text-left border", activeCategory === VIDEO_EXPORT_CONSTANTS.CATEGORY_ALL && !searchQuery ? "bg-[#0e383d] text-[#00e5ff] border-[#00e5ff]/30 shadow-sm" : "text-zinc-400 border-transparent hover:bg-zinc-800/60 hover:text-zinc-200")}>
                  <span>{VIDEO_EXPORT_TEXT_YEU_THICH_TAT_CA}</span>
                  <span className="ml-auto text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-black/40 text-zinc-400 font-semibold">{allItems.length}</span>
                </Button>
                <div className="mt-1">
                  <Button variant={VIDEO_EXPORT_TEXT_UNSTYLED} type={VIDEO_EXPORT_TEXT_BUTTON} onClick={() => setIsSidebarEffectsOpen(!isSidebarEffectsOpen)} className="w-full px-2.5 py-1.5 text-zinc-400 hover:text-white text-xs font-bold flex items-center justify-between transition-colors cursor-pointer">
                    <span className="truncate">{label}</span>
                    <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-200", isSidebarEffectsOpen ? "rotate-0" : "-rotate-90")} />
                  </Button>
                  {isSidebarEffectsOpen && !_.isEmpty(categories) && (
                    <div className="space-y-0.5 mt-1 pl-1">
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
                            className={cn("w-full px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-between gap-1.5 cursor-pointer select-none text-left border", isCatActive ? "bg-[#0e383d] text-[#00e5ff] font-bold border-[#00e5ff]/30 shadow-sm" : "text-zinc-400 border-transparent hover:bg-zinc-800/50 hover:text-zinc-200")}>
                            <span className="truncate">{cat.label}</span>
                            <span className={cn("text-[10px] font-mono px-1.5 py-0.2 rounded-full font-semibold shrink-0", isCatActive ? "bg-[#00e5ff]/20 text-[#00e5ff]" : "bg-black/30 text-zinc-500")}>{cat.count}</span>
                          </Button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex-1 flex flex-col min-w-0 bg-[#121214] p-4 gap-3.5 overflow-hidden">
                <div className="relative w-full max-w-xl shrink-0">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                  <input
                    type={VIDEO_EXPORT_TEXT_TEXT}
                    autoFocus
                    value={searchQuery}
                    placeholder={VIDEO_EXPORT_TEXT_MOI_NGUOI_DANG_TIM_KIEM_RETRO}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-9 pl-10 pr-9 rounded-full bg-[#1e1e23] border border-zinc-700/60 text-xs font-medium text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#00e5ff] focus:ring-1 focus:ring-[#00e5ff]/30 transition-all shadow-inner"
                  />
                  {searchQuery && (
                    <Button variant={VIDEO_EXPORT_TEXT_UNSTYLED} type={VIDEO_EXPORT_TEXT_BUTTON} onClick={() => setSearchQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-zinc-700 hover:bg-zinc-600 text-zinc-300 flex items-center justify-center cursor-pointer">
                      <X className="w-3 h-3" />
                    </Button>
                  )}
                </div>
                <div className="flex items-center justify-between shrink-0 px-0.5">
                  <div className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                    <span>{searchQuery ? VIDEO_EXPORT_TEMPLATE_KET_QUA_TIM_KIEM_CHO(`${searchQuery}`) : currentCategoryLabel}</span>
                    <span className="text-xs font-mono font-normal text-zinc-400">
                      {VIDEO_EXPORT_TEXT_SYMBOL_10}
                      {filteredItems.length}
                      {VIDEO_EXPORT_TEXT_SYMBOL_5}
                    </span>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto pr-1.5 custom-scrollbar min-h-0">
                  {_.isEmpty(filteredItems) ? (
                    <div className="py-16 text-center text-zinc-500 text-xs font-medium flex flex-col items-center justify-center gap-2">
                      <Search className="w-8 h-8 text-zinc-600 stroke-[1.5]" />
                      <span>{VIDEO_EXPORT_TEXT_KHONG_TIM_THAY_HIEU_UNG_PHU}</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 p-0.5">
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
                            className={cn("group flex flex-col items-center gap-1.5 transition-all cursor-pointer select-none")}>
                            <div className={cn("w-full aspect-square rounded-2xl relative overflow-hidden flex flex-col items-center justify-center transition-all duration-200 border", isSelected ? "border-2 border-[#00e5ff] ring-2 ring-[#00e5ff]/50 shadow-xl shadow-[#00e5ff]/25 scale-[1.04]" : "border-zinc-800 bg-[#1a1a1f] hover:border-zinc-400 hover:scale-[1.02] hover:shadow-lg shadow-md")}>
                              <div className={cn("absolute inset-0 bg-gradient-to-br opacity-80 group-hover:opacity-100 transition-opacity duration-300", gradientTheme)} />
                              <div className={cn("absolute inset-0 transition-colors duration-200", isSelected ? "bg-cyan-950/20" : "bg-black/40 group-hover:bg-black/20")} />
                              <div className="absolute top-2 left-2 w-5 h-5 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-[10px] text-purple-300 shadow-sm border border-purple-400/30 z-10">{VIDEO_EXPORT_TEXT_SYMBOL_9}</div>
                              <div className={cn("relative z-10 w-11 h-11 rounded-xl backdrop-blur-md border flex items-center justify-center shadow-lg transition-transform group-hover:scale-110", isSelected ? "bg-[#00e5ff]/25 border-[#00e5ff]/60 text-[#00e5ff] shadow-[#00e5ff]/30" : "bg-black/40 border-white/10 text-white")}>
                                <ItemIcon className="w-5 h-5" />
                              </div>
                              <div className={cn("absolute bottom-2 right-2 w-6 h-6 rounded-full flex items-center justify-center shadow-md transition-all z-10", isSelected ? "bg-[#00e5ff] text-black ring-2 ring-white/50 scale-110" : "bg-black/70 text-white/90 group-hover:bg-white group-hover:text-black")}>
                                {isSelected ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Download className="w-3 h-3 stroke-[2.5]" />}
                              </div>
                              {isSelected && <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-[#00e5ff] text-black text-[9px] font-black tracking-tight shadow-md z-10">{VIDEO_EXPORT_TEXT_DA_CHON}</div>}
                            </div>
                            <div className="w-full text-center px-1">
                              <span className={cn("text-xs truncate block transition-colors leading-tight", isSelected ? "text-[#00e5ff] font-black" : "text-zinc-300 group-hover:text-white font-medium")}>{item.label}</span>
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
