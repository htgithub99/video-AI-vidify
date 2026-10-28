import {
  SOURCE_TEXT_APP_NAV_ITEM_W_FULL_FLEX_ITEMS,
  SOURCE_TEXT_APP_NAV_ICON_W_8_H_8,
  SOURCE_TEXT_W_4_H_4,
  SOURCE_TEXT_TEXT_XS_FONT_BOLD_TRACKING_WIDE_TRUNCATE,
  SOURCE_TEXT_PROXY,
  SOURCE_TEXT_APP_SIDEBAR_BG_SLATE_955_TEXT_SLATE,
  SOURCE_TEXT_P_3_FLEX_FLEX_COL_ITEMS_CENTER,
  SOURCE_TEXT_BTN_ICON_TINY_LG_HIDDEN_ABSOLUTE_TOP,
  SOURCE_TEXT_RELATIVE_FLEX_ITEMS_CENTER_JUSTIFY_CENTER_W,
  SOURCE_TEXT_APP_SIDEBAR_PROJECT_FLEX_ITEMS_CENTER_GAP,
  SOURCE_TEXT_W_9_H_9_ROUNDED_XL_BG,
  SOURCE_TEXT_W_4_H_4_TEXT_ROSE_500,
  SOURCE_TEXT_MIN_W_0_FLEX_1,
  SOURCE_TEXT_TEXT_XS_FONT_BOLD_TEXT_SLATE_100_3,
  SOURCE_TEXT_TEXT_10PX_FONT_MEDIUM_TEXT_SLATE_400,
  SOURCE_TEXT_W_10_H_10_ROUNDED_2XL_BG,
  SOURCE_TEXT_W_5_H_5_TEXT_ROSE_500,
  SOURCE_TEXT_FLEX_1_PX_3_PY_4_SPACE,
  SOURCE_TEXT_APP_SIDEBAR_FOOTER_HIDDEN_LG_BLOCK_P,
  SOURCE_TEXT_W_FULL_H_10_FLEX_ITEMS_CENTER,
  SOURCE_TEXT_TEXT_XS_FONT_MONO_FONT_BOLD,
  SOURCE_TEXT_HIDDEN_LG_FLEX_H_FULL_MIN_H,
  SOURCE_TEXT_LG_HIDDEN_FIXED_INSET_0_Z_50,
  SOURCE_TEXT_FIXED_INSET_0_BG_BLACK_70_BACKDROP,
  SOURCE_TEXT_RELATIVE_Z_50_H_FULL_ANIMATE_IN,
  SOURCE_TEXT_GHOST,
  SOURCE_TEXT_SM,
  SOURCE_TEXT_UNSTYLED,
} from "../constants/sourceText.js";
import _ from "lodash";
import { ChevronLeft, ChevronRight, Clapperboard, Film, FolderKanban, Globe, LayoutDashboard, LucideIcon, Music2, Scissors, Settings, Shuffle, Sparkles, Video, X, Zap } from "lucide-react";
import { FC, useState } from "react";
import { AppTab } from "../constants/enums";
import { PlanType } from "../constants/security";
import { SIDEBAR_TEXTS } from "../constants/texts";
import { useLicense } from "../contexts/LicenseContext";
import { Lang } from "../lib/lang.js";
import { cn } from "../lib/utils";
import { Button } from "./ui/Button";
interface SidebarProps {
  currentLang: Lang;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedProjectId: string | null;
  activeProjectName: string | null;
  theme?: "light" | "dark" | string;
  toggleTheme?: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}
interface MenuItemConfig {
  id: AppTab;
  label: string;
  icon: LucideIcon;
  requiresProject: boolean;
  hide?: boolean;
}
interface SidebarItemProps {
  item: MenuItemConfig;
  isSelected: boolean;
  isDisabled: boolean;
  isCollapsed: boolean;
  onSelect: (id: AppTab) => void;
}
const SidebarItem: FC<SidebarItemProps> = ({ item, isSelected, isDisabled, isCollapsed, onSelect }) => {
  const Icon = item.icon;
  return (
    <Button
      variant={SOURCE_TEXT_UNSTYLED}
      onClick={() => onSelect(item.id)}
      disabled={isDisabled}
      data-active={isSelected}
      className={cn(SOURCE_TEXT_APP_NAV_ITEM_W_FULL_FLEX_ITEMS, {
        "bg-rose-500/15 text-rose-500 font-extrabold border-rose-500/30 shadow-sm shadow-rose-500/10": isSelected,
        "opacity-40 cursor-not-allowed text-slate-500 border-transparent": isDisabled && !isSelected,
        "text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 border-transparent": !isSelected && !isDisabled,
        "justify-center px-0": isCollapsed,
        "text-left": !isCollapsed,
      })}
      title={item.label}>
      <div className={cn(SOURCE_TEXT_APP_NAV_ICON_W_8_H_8, { "bg-rose-600 text-white shadow-sm": isSelected, "bg-slate-900 text-slate-600": isDisabled && !isSelected, "bg-slate-900/80 border border-slate-800 text-slate-400 group-hover:text-slate-200 group-hover:border-slate-700": !isSelected && !isDisabled })}>
        <Icon className={cn(SOURCE_TEXT_W_4_H_4)} />
      </div>
      {!isCollapsed && <span className={cn(SOURCE_TEXT_TEXT_XS_FONT_BOLD_TRACKING_WIDE_TRUNCATE)}>{item.label}</span>}
    </Button>
  );
};
export default function Sidebar({ currentLang, activeTab, setActiveTab, selectedProjectId, activeProjectName, isMobileOpen = false, onCloseMobile }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { licenseInfo } = useLicense();
  const texts = _.get(SIDEBAR_TEXTS, currentLang, SIDEBAR_TEXTS.vi);
  const hasSelectedProject = Boolean(selectedProjectId);
  const isGlobalTab = _.includes([AppTab.DASHBOARD, AppTab.PROJECTS, AppTab.SETTINGS, AppTab.PROXY], activeTab as AppTab);
  const shouldHideProjectTabs = !hasSelectedProject || isGlobalTab || _.includes([AppTab.MUSIC_CREATOR, AppTab.MUSIC_MIXER, AppTab.VIDEO_CREATOR, AppTab.SHORTS_EXTRACTOR, AppTab.VIDEO_EXPORT, AppTab.MOTION_VIDEO], activeTab as AppTab);
  const menuItems: MenuItemConfig[] = [
    { id: AppTab.DASHBOARD, label: texts.DASHBOARD, icon: LayoutDashboard, requiresProject: false },
    { id: AppTab.PROJECTS, label: texts.CONTENT, icon: FolderKanban, requiresProject: false },
    { id: AppTab.AUTO_GENERATOR, label: texts.AUTO_CREATOR, icon: Zap, requiresProject: true, hide: shouldHideProjectTabs },
    { id: AppTab.CINEMATIC_FILM, label: texts.CINEMATIC_FILM, icon: Clapperboard, requiresProject: true, hide: shouldHideProjectTabs },
    { id: AppTab.MUSIC_CREATOR, label: texts.MUSIC_CREATOR, icon: Music2, requiresProject: false },
    { id: AppTab.PROXY, label: SOURCE_TEXT_PROXY, icon: Globe, requiresProject: false },
    { id: AppTab.MUSIC_MIXER, label: texts.MUSIC_MIXER, icon: Shuffle, requiresProject: false },
    { id: AppTab.VIDEO_CREATOR, label: texts.VIDEO_CREATOR, icon: Video, requiresProject: false },
    { id: AppTab.SHORTS_EXTRACTOR, label: texts.SHORTS_EXTRACTOR, icon: Scissors, requiresProject: false },
    { id: AppTab.VIDEO_EXPORT, label: texts.VIDEO_EXPORT, icon: Film, requiresProject: false },
    { id: AppTab.MOTION_VIDEO, label: texts.MOTION_VIDEO, icon: Sparkles, requiresProject: false },
    { id: AppTab.SETTINGS, label: texts.SETTINGS, icon: Settings, requiresProject: false, hide: _.isEqual(licenseInfo?.plan_type, PlanType.FREE) },
  ];
  const handleItemSelect = (id: AppTab) => {
    setActiveTab(id);
    if (onCloseMobile) onCloseMobile();
  };
  const projectTitle = selectedProjectId && activeProjectName ? activeProjectName : texts.AI_CREATOR;
  const projectSubtitle = selectedProjectId ? texts.ACTIVE_PROJECT : texts.NO_PROJECT_ACTIVE;
  const sidebarContent = (
    <aside className={cn(SOURCE_TEXT_APP_SIDEBAR_BG_SLATE_955_TEXT_SLATE, { "w-18": isCollapsed, "w-60": !isCollapsed })}>
      <div className={cn(SOURCE_TEXT_P_3_FLEX_FLEX_COL_ITEMS_CENTER)}>
        {onCloseMobile && (
          <Button variant={SOURCE_TEXT_UNSTYLED} onClick={onCloseMobile} className={cn(SOURCE_TEXT_BTN_ICON_TINY_LG_HIDDEN_ABSOLUTE_TOP)} title={texts.CLOSE_MENU}>
            <X className={cn(SOURCE_TEXT_W_4_H_4)} />
          </Button>
        )}
        <div className={cn(SOURCE_TEXT_RELATIVE_FLEX_ITEMS_CENTER_JUSTIFY_CENTER_W)}>
          {!isCollapsed ? (
            <div className={cn(SOURCE_TEXT_APP_SIDEBAR_PROJECT_FLEX_ITEMS_CENTER_GAP)}>
              <div className={cn(SOURCE_TEXT_W_9_H_9_ROUNDED_XL_BG)}>
                <Video className={cn(SOURCE_TEXT_W_4_H_4_TEXT_ROSE_500)} />
              </div>
              <div className={cn(SOURCE_TEXT_MIN_W_0_FLEX_1)}>
                <h2 className={cn(SOURCE_TEXT_TEXT_XS_FONT_BOLD_TEXT_SLATE_100_3)} title={projectTitle}>
                  {projectTitle}
                </h2>
                <span className={cn(SOURCE_TEXT_TEXT_10PX_FONT_MEDIUM_TEXT_SLATE_400)} title={projectSubtitle}>
                  {projectSubtitle}
                </span>
              </div>
            </div>
          ) : (
            <div className={cn(SOURCE_TEXT_W_10_H_10_ROUNDED_2XL_BG)}>
              <Video className={cn(SOURCE_TEXT_W_5_H_5_TEXT_ROSE_500)} />
            </div>
          )}
        </div>
      </div>
      <nav className={cn(SOURCE_TEXT_FLEX_1_PX_3_PY_4_SPACE)}>
        {_.map(
          _.filter(menuItems, (item) => !item.hide),
          (item) => {
            const isSelected = _.isEqual(activeTab, item.id);
            return <SidebarItem key={item.id} item={item} isSelected={isSelected} isDisabled={false} isCollapsed={isCollapsed} onSelect={handleItemSelect} />;
          },
        )}
      </nav>
      <div className={cn(SOURCE_TEXT_APP_SIDEBAR_FOOTER_HIDDEN_LG_BLOCK_P)}>
        <Button variant={SOURCE_TEXT_GHOST} size={SOURCE_TEXT_SM} onClick={() => setIsCollapsed(!isCollapsed)} className={cn(SOURCE_TEXT_W_FULL_H_10_FLEX_ITEMS_CENTER)}>
          {isCollapsed ? <ChevronRight className={cn(SOURCE_TEXT_W_4_H_4)} /> : <ChevronLeft className={cn(SOURCE_TEXT_W_4_H_4)} />}
          {!isCollapsed && <span className={cn(SOURCE_TEXT_TEXT_XS_FONT_MONO_FONT_BOLD)}>{texts.COLLAPSE}</span>}
        </Button>
      </div>
    </aside>
  );
  return (
    <>
      <div className={cn(SOURCE_TEXT_HIDDEN_LG_FLEX_H_FULL_MIN_H)}>{sidebarContent}</div>
      {isMobileOpen && (
        <div className={cn(SOURCE_TEXT_LG_HIDDEN_FIXED_INSET_0_Z_50)}>
          <div className={cn(SOURCE_TEXT_FIXED_INSET_0_BG_BLACK_70_BACKDROP)} onClick={onCloseMobile} />
          <div className={cn(SOURCE_TEXT_RELATIVE_Z_50_H_FULL_ANIMATE_IN)}>{sidebarContent}</div>
        </div>
      )}
    </>
  );
}
