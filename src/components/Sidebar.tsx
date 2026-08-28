import { FC, useState } from "react";
import { cn } from "../lib/utils";
import { Lang } from "../lib/lang.js";
import { SIDEBAR_TEXTS } from "../constants/texts";
import { PlanType } from "../constants/security";
import { AppTab } from "../constants/enums";
import { Video, LayoutDashboard, FolderKanban, Sliders, Settings, ChevronLeft, ChevronRight, Zap, Clapperboard, LucideIcon, X } from "lucide-react";
import { Button } from "./ui/Button";
import { useLicense } from "../contexts/LicenseContext";
import _ from "lodash";

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
    <button
      onClick={() => onSelect(item.id)}
      disabled={isDisabled}
      className={cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all duration-200 outline-none select-none relative group", {
        "bg-rose-500/15 text-rose-400 font-extrabold shadow-sm border border-rose-500/30": isSelected,
        "opacity-40 cursor-not-allowed text-slate-500": isDisabled && !isSelected,
        "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 border border-transparent": !isSelected && !isDisabled,
        "justify-center px-0": isCollapsed,
        "text-left": !isCollapsed,
      })}
      title={item.label}>
      {isSelected && <div className={cn("absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-rose-500 rounded-r-full shadow-[0_0_10px_rgba(244,63,94,0.7)]")} />}
      <div
        className={cn("w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all", {
          "bg-gradient-to-tr from-rose-600 to-amber-500 text-white shadow-md shadow-rose-500/25 ring-1 ring-white/20": isSelected,
          "bg-slate-900 text-slate-600": isDisabled && !isSelected,
          "bg-slate-900/80 border border-slate-800 text-slate-400 group-hover:text-slate-200 group-hover:border-slate-700": !isSelected && !isDisabled,
        })}>
        <Icon className={cn("w-4 h-4")} />
      </div>
      {!isCollapsed && <span className={cn("text-xs font-bold tracking-wide truncate")}>{item.label}</span>}
    </button>
  );
};

export default function Sidebar({ currentLang, activeTab, setActiveTab, selectedProjectId, activeProjectName, isMobileOpen = false, onCloseMobile }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { licenseInfo } = useLicense();
  const texts = _.get(SIDEBAR_TEXTS, currentLang, SIDEBAR_TEXTS.vi);

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
    },
    {
      id: AppTab.CINEMATIC_FILM,
      label: texts.CINEMATIC_FILM,
      icon: Clapperboard,
      requiresProject: true,
    },
    {
      id: AppTab.STUDIO,
      label: texts.AI_STUDIO,
      icon: Sliders,
      requiresProject: true,
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
    <aside className={cn("bg-slate-955 border-r border-slate-800/80 text-slate-200 flex flex-col transition-all duration-300 h-full select-none backdrop-blur-md z-20", isCollapsed ? "w-18" : "w-64")}>
      <div className={cn("p-4 border-b border-slate-800/80 flex flex-col items-center justify-center relative")}>
        {onCloseMobile && (
          <button onClick={onCloseMobile} className={cn("md:hidden absolute top-3 right-3 p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-900 border border-slate-800 transition-colors")} title="Đóng menu">
            <X className={cn("w-4 h-4")} />
          </button>
        )}

        <div className={cn("relative flex items-center justify-center w-full")}>
          {!isCollapsed ? (
            <div className={cn("flex flex-col items-center py-1 animate-fadeIn w-full")}>
              <div className={cn("w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-600/20 to-amber-500/20 border border-rose-500/30 flex items-center justify-center mb-2.5 shadow-lg shadow-rose-500/10")}>
                <Video className={cn("w-7 h-7 text-rose-500")} />
              </div>
              <h2 className={cn("text-xs font-bold text-slate-100 max-w-[200px] truncate text-center font-mono")} title={projectTitle}>
                {projectTitle}
              </h2>
              <span className={cn("text-[10px] font-semibold text-slate-400 mt-0.5 px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 truncate max-w-[180px]")} title={projectSubtitle}>
                {projectSubtitle}
              </span>
            </div>
          ) : (
            <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600/20 to-amber-500/20 border border-rose-500/30 flex items-center justify-center my-2 shadow-md")}>
              <Video className={cn("w-5 h-5 text-rose-500")} />
            </div>
          )}
        </div>
      </div>

      <nav className={cn("flex-1 px-3 py-4 space-y-1.5 overflow-y-auto custom-scrollbar")}>
        {_.map(
          _.filter(menuItems, (item) => !item.hide),
          (item) => {
            const isSelected = _.isEqual(activeTab, item.id);
            const isDisabled = item.requiresProject && !selectedProjectId;
            return <SidebarItem key={item.id} item={item} isSelected={isSelected} isDisabled={isDisabled} isCollapsed={isCollapsed} onSelect={handleItemSelect} />;
          },
        )}
      </nav>

      <div className={cn("hidden md:block p-3 border-t border-slate-800/80 bg-slate-950/40")}>
        <Button variant="ghost" size="sm" onClick={() => setIsCollapsed(!isCollapsed)} className={cn("w-full flex items-center justify-center gap-2 py-2 text-slate-400 hover:text-slate-200 hover:bg-slate-850 rounded-xl transition-all shadow-none")}>
          {isCollapsed ? <ChevronRight className={cn("w-4 h-4")} /> : <ChevronLeft className={cn("w-4 h-4")} />}
          {!isCollapsed && <span className={cn("text-xs font-mono font-bold")}>{texts.COLLAPSE}</span>}
        </Button>
      </div>
    </aside>
  );

  return (
    <>
      <div className={cn("hidden md:flex h-full shrink-0")}>{sidebarContent}</div>

      {isMobileOpen && (
        <div className={cn("md:hidden fixed inset-0 z-50 flex")}>
          <div className={cn("fixed inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200")} onClick={onCloseMobile} />
          <div className={cn("relative z-50 h-full animate-in slide-in-from-left duration-200")}>{sidebarContent}</div>
        </div>
      )}
    </>
  );
}
