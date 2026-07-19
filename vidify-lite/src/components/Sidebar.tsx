import { cn } from "../lib/utils";
import { useState } from "react";
import { Lang } from "../lib/lang.js";
import { SIDEBAR_TEXTS } from "../constants/texts";
import { Video, LayoutDashboard, FolderKanban, Sliders, Settings, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./ui/Button";
import { useLicense } from "../contexts/LicenseContext";

interface SidebarProps {
  currentLang: Lang;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedProjectId: string | null;
  activeProjectName: string | null;
  theme: "light" | "dark";
  toggleTheme: () => void;
}

export default function Sidebar({
  currentLang,
  activeTab,
  setActiveTab,
  selectedProjectId,
  activeProjectName,
  theme,
  toggleTheme,
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { licenseInfo } = useLicense();

  const menuItems = [
    {
      id: "dashboard",
      label: SIDEBAR_TEXTS[currentLang].DASHBOARD,
      icon: LayoutDashboard,
      requiresProject: false,
    },
    {
      id: "projects",
      label: SIDEBAR_TEXTS[currentLang].CONTENT,
      icon: FolderKanban,
      requiresProject: false,
    },
    {
      id: "studio",
      label: SIDEBAR_TEXTS[currentLang].AI_STUDIO,
      icon: Sliders,
      requiresProject: true,
    },
    {
      id: "settings",
      label: SIDEBAR_TEXTS[currentLang].SETTINGS,
      icon: Settings,
      requiresProject: false,
      hide: licenseInfo?.plan_type === 'FREE',
    },
  ];

  return (
    <aside
      className={cn(`bg-slate-900 border-r border-slate-800 text-slate-200 flex flex-col transition-all duration-300 h-full select-none ${
        isCollapsed ? "w-16" : "w-64"
      }`)}
    >
      <div className="p-4 border-b border-slate-800 flex flex-col items-center justify-center relative">
        <div className="relative flex items-center justify-center w-full">
          {!isCollapsed ? (
            <div className="flex flex-col items-center py-2 animate-fadeIn">
              <div className="w-16 h-16 rounded-full bg-rose-600/10 border-2 border-rose-500 flex items-center justify-center mb-3 shadow-lg overflow-hidden">
                <Video className="w-8 h-8 text-rose-500" />
              </div>
              <h2 className="text-xs font-bold text-slate-100 max-w-[200px] truncate text-center font-mono">
                {selectedProjectId && activeProjectName ? activeProjectName : SIDEBAR_TEXTS[currentLang].AI_CREATOR}
              </h2>
              <p className="text-[10px] text-slate-400 mt-1">
                {selectedProjectId ? SIDEBAR_TEXTS[currentLang].ACTIVE_PROJECT : SIDEBAR_TEXTS[currentLang].NO_PROJECT_ACTIVE}
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
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isSelected = activeTab === item.id;
          const isDisabled = item.requiresProject && !selectedProjectId;

          if (item.hide || isDisabled) return null;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              disabled={isDisabled}
              className={cn(`w-full flex items-center gap-3 px-2.5 py-2.5 rounded-xl transition-all duration-200 outline-none ${
                isSelected
                  ? "bg-rose-500/10 text-rose-500 font-extrabold ring-1 ring-rose-500/30"
                  : isDisabled
                  ? "opacity-50 cursor-not-allowed text-slate-500"
                  : "bg-slate-900 text-slate-500 hover:text-slate-300 hover:bg-slate-850"
              } ${isCollapsed ? "justify-center px-0" : "text-left"}`)}
              title={isCollapsed ? item.label : ""}
            >
              <div className={cn(`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all ${isSelected ? "bg-rose-600 text-white shadow-md shadow-rose-500/20 ring-2 ring-rose-500/20" : isDisabled ? "bg-slate-900 text-slate-600" : "bg-slate-950/20 border border-slate-800 text-slate-500"}`)}>
                <Icon className="w-4 h-4" />
              </div>
              {!isCollapsed && <span className="text-[11px] uppercase tracking-wider font-bold truncate mt-0.5">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      <div className="p-3 border-t border-slate-800 flex justify-center items-center">
        <Button
          variant="ghost"
          size="xs"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full py-2 hover:bg-slate-850 flex items-center justify-center text-slate-400 hover:text-slate-200 shadow-none"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
      </div>
    </aside>
  );
}
