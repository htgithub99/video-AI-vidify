import { Video } from "lucide-react";
import { Button } from "./ui/Button";
import { VideoProject } from "../types";
import { Lang, translations } from "../lib/lang";

interface DashboardViewProps {
  currentLang: Lang;
  credits: number;
  costTracker: number;
  projects: VideoProject[];
  onSelectProject: (id: string) => void;
  onNavigateToProjects: () => void;
}

export default function DashboardView({
  currentLang,
  credits,
  costTracker,
  projects,
  onSelectProject,
  onNavigateToProjects,
}: DashboardViewProps) {
  const t = translations[currentLang];
  const latestProject = projects.length > 0 ? projects[projects.length - 1] : null;

  return (
    <div className="flex-grow h-full overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 w-full max-w-7xl mx-auto space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            {t.dashboardCreatorInfo}
          </h3>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-rose-600/10 border-2 border-rose-500 flex items-center justify-center">
              <Video className="w-8 h-8 text-rose-500" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-100">{t.dashboardAICreator}</h4>
              <p className="text-xs text-slate-500 mt-0.5">{t.dashboardMemberPro}</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            {t.dashboardCreditsBalance}
          </h3>
          <div className="text-2xl font-black text-rose-400 font-mono">
            {credits.toLocaleString()} {t.dashboardPoints}
          </div>
          <p className="text-[10px] text-slate-500 mt-2">
            {t.dashboardSyncedRealtime}
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
            {t.dashboardEstimatedCost}
          </h3>
          <div className="text-2xl font-black text-green-400 font-mono">${costTracker.toFixed(4)} USD</div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2">
            {t.dashboardAI_Metrics}
          </p>
        </div>
      </div>

      {latestProject ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-450 mb-4">
            {t.dashboardLatestProject}
          </h3>
          <div className="flex flex-col sm:flex-row gap-5 items-start">
            <div className="w-full sm:w-48 aspect-video bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-center overflow-hidden shrink-0 relative">
              <Video className="w-12 h-12 text-slate-700" />
              <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/70 text-[9px] font-bold font-mono text-white shadow-sm">
                {latestProject.config.language === "vi" ? "VI" : "EN"}
              </div>
            </div>
            <div className="flex-1 space-y-2">
              <h4 className="text-sm font-bold text-slate-100 uppercase">{latestProject.name}</h4>
              <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
                {latestProject.description || t.dashboardNoDesc}
              </p>
              <div className="pt-3 flex gap-2">
                <Button variant="primary" size="sm" onClick={() => onSelectProject(latestProject.id)}>
                  {t.dashboardOpenStudio}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-sm text-center">
          <Video className="w-12 h-12 text-slate-700 mx-auto mb-4" />
          <h4 className="text-sm font-bold text-slate-100">
            {t.dashboardWelcome}
          </h4>
          <p className="text-xs text-slate-400 mt-2 max-w-sm mx-auto leading-relaxed">
            {t.dashboardWelcomeDesc}
          </p>
          <Button variant="primary" size="sm" className="mt-4" onClick={onNavigateToProjects}>
            {t.dashboardGoToContent}
          </Button>
        </div>
      )}
    </div>
  );
}
