import { FC, useState } from "react";
import { cn } from "../lib/utils";
import { Lang } from "../lib/lang.js";
import { SIDEBAR_TEXTS } from "../constants/texts";
import { PlanType } from "../constants/security";
import { AppTab } from "../constants/enums";
import { Video, LayoutDashboard, FolderKanban, Sliders, Settings, ChevronLeft, ChevronRight, Zap, LucideIcon } from "lucide-react";
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

const SidebarItem: FC<SidebarItemProps> = ({
  item,
  isSelected,
  isDisabled,
  isCollapsed,
  onSelect,
}) => {
  const Icon = item.icon;

  return (
    <button
      onClick={() => onSelect(item.id)}
      disabled={isDisabled}
      className={cn(
        "w-full flex items-center gap-3 px-2.5 py-2.5 rounded-xl transition-all duration-200 outline-none",
        isSelected
          ? "bg-rose-500/10 text-rose-500 font-extrabold ring-1 ring-rose-500/30"
          : isDisabled
            ? "opacity-50 cursor-not-allowed text-slate-500"
            : "bg-slate-900 text-slate-500 hover:text-slate-300 hover:bg-slate-850",
        isCollapsed ? "justify-center px-0" : "text-left",
      )}
      title={item.label}
    >
      <div
        className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all",
          isSelected
            ? "bg-rose-600 text-white shadow-md shadow-rose-500/20 ring-2 ring-rose-500/20"
            : isDisabled
              ? "bg-slate-900 text-slate-600"
              : "bg-slate-950/20 border border-slate-800 text-slate-500",
        )}
      >
        <Icon className="w-4 h-4" />
      </div>
      {!isCollapsed && (
        <span className="text-[11px] uppercase tracking-wider font-bold truncate mt-0.5">
          {item.label}
        </span>
      )}
    </button>
  );
};

export default function Sidebar({
  currentLang,
  activeTab,
  setActiveTab,
  selectedProjectId,
  activeProjectName,
}: SidebarProps) {
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

  const projectTitle = selectedProjectId && activeProjectName ? activeProjectName : texts.AI_CREATOR;
  const projectSubtitle = selectedProjectId ? texts.ACTIVE_PROJECT : texts.NO_PROJECT_ACTIVE;

  return (
    <aside
      className={cn(
        "bg-slate-900 border-r border-slate-800 text-slate-200 flex flex-col transition-all duration-300 h-full select-none",
        isCollapsed ? "w-16" : "w-64",
      )}
    >
      <div className="p-4 border-b border-slate-800 flex flex-col items-center justify-center relative">
        <div className="relative flex items-center justify-center w-full">
          {!isCollapsed ? (
            <div className="flex flex-col items-center py-2 animate-fadeIn">
              <div className="w-16 h-16 rounded-full bg-rose-600/10 border-2 border-rose-500 flex items-center justify-center mb-3 shadow-lg overflow-hidden">
                <Video className="w-8 h-8 text-rose-500" />
              </div>
              <h2
                className="text-xs font-bold text-slate-100 max-w-[200px] truncate text-center font-mono"
                title={projectTitle}
              >
                {projectTitle}
              </h2>
              <p className="text-[10px] text-slate-400 mt-1">
                {projectSubtitle}
              </p>
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-rose-600/10 border border-rose-500/50 flex items-center justify-center my-3 shadow-md">
              <Video className="w-5 h-5 text-rose-500" />
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 px-2 py-4 space-y-1.5 overflow-y-auto no-scrollbar">
        {_.map(menuItems, (item) => {
          const isSelected = _.isEqual(activeTab, item.id);
          const isDisabled = Boolean(item.requiresProject && !selectedProjectId);

          if (_.some([item.hide, isDisabled], Boolean)) return null;

          return (
            <SidebarItem
              key={item.id}
              item={item}
              isSelected={isSelected}
              isDisabled={isDisabled}
              isCollapsed={isCollapsed}
              onSelect={(id) => setActiveTab(id)}
            />
          );
        })}
      </nav>

      <div className="p-3 border-t border-slate-800 flex justify-center items-center">
        <Button
          variant="ghost"
          size="xs"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full py-2 hover:bg-slate-850 flex items-center justify-center text-slate-400 hover:text-slate-200 shadow-none"
          title={isCollapsed ? (SIDEBAR_TEXTS[currentLang as keyof typeof SIDEBAR_TEXTS] || SIDEBAR_TEXTS.vi).EXPAND : (SIDEBAR_TEXTS[currentLang as keyof typeof SIDEBAR_TEXTS] || SIDEBAR_TEXTS.vi).COLLAPSE}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
      </div>
    </aside>
  );
}
