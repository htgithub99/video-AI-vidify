import { Video, Image as ImageIcon, Mic } from "lucide-react";
import { Button } from "./ui/Button";
import { VideoProject } from "../types";
import { Lang, translations } from "../lib/lang";
import { useLicense } from "../contexts/LicenseContext";
import { QUOTA_TEXTS } from "../constants/texts";
import _ from "lodash";

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
  const langKey = _.isEqual(currentLang, "vi") ? "VN" : "EN";
  const quotaText = QUOTA_TEXTS[langKey];
  const latestProject =
    projects.length > 0 ? projects[projects.length - 1] : null;

  const { licenseInfo } = useLicense();

  const limitVideo = _.get(licenseInfo, "limits.video", 0);
  const limitImage = _.get(licenseInfo, "limits.image", 0);
  const limitVoice = _.get(licenseInfo, "limits.voice", 0);
  const isUnlimited = _.get(licenseInfo, "limits.unlimited", false);

  const usageVideo = _.get(licenseInfo, "usage.video", 0);
  const usageImage = _.get(licenseInfo, "usage.image", 0);
  const usageVoice = _.get(licenseInfo, "usage.voice", 0);

  const getPercent = (used: number, limit: number) =>
    isUnlimited
      ? 100
      : Math.min(100, (used / _.clamp(limit, 1, Infinity)) * 100);

  const videoPercent = getPercent(usageVideo, limitVideo);
  const imagePercent = getPercent(usageImage, limitImage);
  const voicePercent = getPercent(usageVoice, limitVoice);

  return (
    <div className="flex-grow h-full overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 w-full max-w-7xl mx-auto space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            {t.dashboardCreatorInfo}
          </h3>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-rose-600/10 border-2 border-rose-500 flex items-center justify-center">
              <Video className="w-8 h-8 text-rose-500" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-100">
                {t.dashboardAICreator}
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                {t.dashboardMemberPro}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col gap-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {quotaText.MEDIA_QUOTA}
          </h3>
          <div className="space-y-4 flex-1">
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[10px] font-bold">
                <span className="text-blue-400 flex items-center gap-1.5">
                  <Video className="w-3 h-3" /> {quotaText.VIDEO}
                </span>
                <span className="text-slate-500">
                  <span className="text-slate-200">{usageVideo}</span> /{" "}
                  {isUnlimited ? "∞" : limitVideo}
                </span>
              </div>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${videoPercent}%` }}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[10px] font-bold">
                <span className="text-emerald-400 flex items-center gap-1.5">
                  <ImageIcon className="w-3 h-3" /> {quotaText.IMAGE}
                </span>
                <span className="text-slate-500">
                  <span className="text-slate-200">{usageImage}</span> /{" "}
                  {isUnlimited ? "∞" : limitImage}
                </span>
              </div>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${imagePercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col gap-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {quotaText.VOICE_QUOTA}
          </h3>
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-[10px] font-bold">
              <span className="text-amber-400 flex items-center gap-1.5">
                <Mic className="w-3 h-3" /> {quotaText.CHARS}
              </span>
              <span className="text-slate-500">
                <span className="text-slate-200">
                  {usageVoice.toLocaleString()}
                </span>{" "}
                / {isUnlimited ? "∞" : limitVoice.toLocaleString()}
              </span>
            </div>
            <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-500"
                style={{ width: `${voicePercent}%` }}
              />
            </div>
          </div>
          <p className="text-[10px] text-slate-500 mt-auto">
            {quotaText.SYNC_MSG}
          </p>
        </div>
      </div>

      {latestProject ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
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
              <h4 className="text-sm font-bold text-slate-100 uppercase">
                {latestProject.name}
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
                {latestProject.description || t.dashboardNoDesc}
              </p>
              <div className="pt-3 flex gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onSelectProject(latestProject.id)}
                >
                  {t.dashboardOpenStudio}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-sm text-center">
          <Video className="w-12 h-12 text-slate-700 mx-auto mb-4" />
          <h4 className="text-sm font-bold text-slate-100">
            {t.dashboardWelcome}
          </h4>
          <p className="text-xs text-slate-400 mt-2 max-w-sm mx-auto leading-relaxed">
            {t.dashboardWelcomeDesc}
          </p>
          <Button
            variant="primary"
            size="sm"
            className="mt-4"
            onClick={onNavigateToProjects}
          >
            {t.dashboardGoToContent}
          </Button>
        </div>
      )}
    </div>
  );
}
