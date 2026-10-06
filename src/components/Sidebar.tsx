import _ from "lodash";
import { ChevronLeft, ChevronRight, Clapperboard, Film, FolderKanban, LayoutDashboard, LucideIcon, Music2, Scissors, Settings, Shuffle, Sparkles, Video, X, Zap } from "lucide-react";
import { FC, useState } from "react";
import { AppTab } from "../constants/enums";
import { PlanType } from "../constants/security";
import { SOURCE_TEXT_GHOST, SOURCE_TEXT_SM, SOURCE_TEXT_UNSTYLED } from "../constants/sourceText";
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
      className={cn("app-nav-item w-full flex items-center gap-3 px-3 py-2.5 transition-all outline-none select-none relative group rounded-xl border cursor-pointer", {
        "bg-rose-500/15 text-rose-500 font-extrabold border-rose-500/30 shadow-sm shadow-rose-500/10": isSelected,
        "opacity-40 cursor-not-allowed text-slate-500 border-transparent": isDisabled && !isSelected,
        "text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 border-transparent": !isSelected && !isDisabled,
        "justify-center px-0": isCollapsed,
        "text-left": !isCollapsed,
      })}
      title={item.label}>
      <div
        className={cn("app-nav-icon w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors", {
          "bg-rose-600 text-white shadow-sm": isSelected,
          "bg-slate-900 text-slate-600": isDisabled && !isSelected,
          "bg-slate-900/80 border border-slate-800 text-slate-400 group-hover:text-slate-200 group-hover:border-slate-700": !isSelected && !isDisabled,
        })}>
        <Icon className={cn("w-4 h-4")} />
      </div>
      {!isCollapsed && <span className={cn("text-xs font-bold tracking-wide truncate")}>{item.label}</span>}
    </Button>
  );
};
export default function Sidebar({ currentLang, activeTab, setActiveTab, selectedProjectId, activeProjectName, isMobileOpen = false, onCloseMobile }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { licenseInfo } = useLicense();
  const texts = _.get(SIDEBAR_TEXTS, currentLang, SIDEBAR_TEXTS.vi);
  const hasSelectedProject = Boolean(selectedProjectId);
  const isGlobalTab = _.includes([AppTab.DASHBOARD, AppTab.PROJECTS, AppTab.SETTINGS], activeTab as AppTab);
  const shouldHideProjectTabs = !hasSelectedProject || isGlobalTab || _.includes([AppTab.MUSIC_CREATOR, AppTab.MUSIC_MIXER, AppTab.VIDEO_CREATOR, AppTab.SHORTS_EXTRACTOR, AppTab.VIDEO_EXPORT, AppTab.MOTION_VIDEO], activeTab as AppTab);
  const menuItems: MenuItemConfig[] = [
    {
      id: AppTab.DASHBOARD,
      label: texts.DASHBOARD,
      icon: LayoutDashboard,
      requiresProject: false,
    },
    {
      id: AppTab.PROJECTS,
      label: texts.CONTENT,
      icon: FolderKanban,
      requiresProject: false,
    },
    {
      id: AppTab.AUTO_GENERATOR,
      label: texts.AUTO_CREATOR,
      icon: Zap,
      requiresProject: true,
      hide: shouldHideProjectTabs,
    },
    {
      id: AppTab.CINEMATIC_FILM,
      label: texts.CINEMATIC_FILM,
      icon: Clapperboard,
      requiresProject: true,
      hide: shouldHideProjectTabs,
    },
    {
      id: AppTab.MUSIC_CREATOR,
      label: texts.MUSIC_CREATOR,
      icon: Music2,
      requiresProject: false,
    },
    {
      id: AppTab.MUSIC_MIXER,
      label: texts.MUSIC_MIXER,
      icon: Shuffle,
      requiresProject: false,
    },
    {
      id: AppTab.VIDEO_CREATOR,
      label: texts.VIDEO_CREATOR,
      icon: Video,
      requiresProject: false,
    },
    {
      id: AppTab.SHORTS_EXTRACTOR,
      label: texts.SHORTS_EXTRACTOR,
      icon: Scissors,
      requiresProject: false,
    },
    {
      id: AppTab.VIDEO_EXPORT,
      label: texts.VIDEO_EXPORT,
      icon: Film,
      requiresProject: false,
    },
    {
      id: AppTab.MOTION_VIDEO,
      label: texts.MOTION_VIDEO,
      icon: Sparkles,
      requiresProject: false,
    },
    {
      id: AppTab.SETTINGS,
      label: texts.SETTINGS,
      icon: Settings,
      requiresProject: false,
      hide: _.isEqual(licenseInfo?.plan_type, PlanType.FREE),
    },
  ];
  const handleItemSelect = (id: AppTab) => {
    setActiveTab(id);
    if (onCloseMobile) onCloseMobile();
  };
  const projectTitle = selectedProjectId && activeProjectName ? activeProjectName : texts.AI_CREATOR;
  const projectSubtitle = selectedProjectId ? texts.ACTIVE_PROJECT : texts.NO_PROJECT_ACTIVE;
  const sidebarContent = (
    <aside className={cn("app-sidebar bg-slate-955 text-slate-200 flex flex-col justify-between transition-[width] duration-200 h-full min-h-full self-stretch select-none z-20 shrink-0", { "w-18": isCollapsed, "w-60": !isCollapsed })}>
      <div className={cn("p-3 flex flex-col items-center justify-center relative shrink-0")}>
        {onCloseMobile && (
          <Button variant={SOURCE_TEXT_UNSTYLED} onClick={onCloseMobile} className={cn("btn-icon-tiny lg:hidden absolute top-3 right-3 p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-900 border-none transition-colors")} title={texts.CLOSE_MENU}>
            <X className={cn("w-4 h-4")} />
          </Button>
        )}
        <div className={cn("relative flex items-center justify-center w-full")}>
          {!isCollapsed ? (
            <div className={cn("app-sidebar-project flex items-center gap-3 p-3 rounded-2xl bg-slate-900/60 animate-fadeIn w-full shadow-sm")}>
              <div className={cn("w-9 h-9 rounded-xl bg-rose-500/15 flex items-center justify-center shrink-0 shadow-sm shadow-rose-500/10")}>
                <Video className={cn("w-4 h-4 text-rose-500")} />
              </div>
              <div className={cn("min-w-0 flex-1")}>
                <h2 className={cn("text-xs font-bold text-slate-100 truncate")} title={projectTitle}>
                  {projectTitle}
                </h2>
                <span className={cn("text-[10px] font-medium text-slate-400 truncate block mt-0.5")} title={projectSubtitle}>
                  {projectSubtitle}
                </span>
              </div>
            </div>
          ) : (
            <div className={cn("w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-600/20 to-amber-500/20 flex items-center justify-center my-2 shadow-md")}>
              <Video className={cn("w-5 h-5 text-rose-500")} />
            </div>
          )}
        </div>
      </div>
      <nav className={cn("flex-1 px-3 py-4 space-y-1.5 overflow-y-auto custom-scrollbar min-h-0 grow")}>
        {_.map(
          _.filter(menuItems, (item) => !item.hide),
          (item) => {
            const isSelected = _.isEqual(activeTab, item.id);
            return <SidebarItem key={item.id} item={item} isSelected={isSelected} isDisabled={false} isCollapsed={isCollapsed} onSelect={handleItemSelect} />;
          },
        )}
      </nav>
      <div className={cn("app-sidebar-footer hidden lg:block p-3 bg-slate-955 shrink-0 mt-auto")}>
        <Button variant={SOURCE_TEXT_GHOST} size={SOURCE_TEXT_SM} onClick={() => setIsCollapsed(!isCollapsed)} className={cn("w-full h-10 flex items-center justify-center gap-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded-xl transition-all font-bold bg-slate-900/40 shadow-none border-none")}>
          {isCollapsed ? <ChevronRight className={cn("w-4 h-4")} /> : <ChevronLeft className={cn("w-4 h-4")} />}
          {!isCollapsed && <span className={cn("text-xs font-mono font-bold")}>{texts.COLLAPSE}</span>}
        </Button>
      </div>
    </aside>
  );
  return (
    <>
      <div className={cn("hidden lg:flex h-full min-h-full self-stretch shrink-0")}>{sidebarContent}</div>
      {isMobileOpen && (
        <div className={cn("lg:hidden fixed inset-0 z-50 flex")}>
          <div className={cn("fixed inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200")} onClick={onCloseMobile} />
          <div className={cn("relative z-50 h-full animate-in slide-in-from-left duration-200")}>{sidebarContent}</div>
        </div>
      )}
    </>
  );
}
