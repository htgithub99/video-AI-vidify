import { cn } from "../lib/utils";
import { FC, ReactNode } from "react";
import { Video, Image as ImageIcon, Mic, Sparkles, FolderKanban, Play, ArrowRight, Activity, Zap } from "lucide-react";
import { Button } from "./ui/Button";
import { DashboardSkeleton } from "./ui/Skeleton";
import { VideoProject } from "../types";
import { Lang, translations } from "../lib/lang";
import { useLicense } from "../contexts/LicenseContext";
import { QUOTA_TEXTS, UI_COMMON_TEXTS } from "../constants/texts";
import { AppLanguage } from "../constants/enums";
import { SecurityConstants, UIConstants } from "../constants/security";
import _ from "lodash";

interface DashboardViewProps {
  currentLang: Lang;
  projects: VideoProject[];
  onSelectProject: (id: string) => void;
  onNavigateToProjects: () => void;
}

interface QuotaProgressBarProps {
  icon: ReactNode;
  label: string;
  usage: number;
  limit: number;
  percent: number;
  isUnlimited: boolean;
  colorClass: string;
  bgBarClass: string;
  formatNumber?: boolean;
}

const QuotaProgressBar: FC<QuotaProgressBarProps> = ({ icon, label, usage, limit, percent, isUnlimited, colorClass, bgBarClass, formatNumber = false }) => {
  const formattedUsage = formatNumber ? usage.toLocaleString() : usage;
  const formattedLimit = isUnlimited ? UIConstants.INFINITY : formatNumber ? limit.toLocaleString() : limit;

  return (
    <div className={cn("space-y-2")}>
      <div className={cn("flex justify-between items-center text-xs font-bold gap-2")}>
        <span className={`${colorClass} flex items-center gap-1.5 truncate`} title={label}>
          {icon} <span className={cn("truncate")}>{label}</span>
        </span>
        <span className={cn("text-slate-400 font-mono text-[11px] shrink-0")}>
          <span className={cn("text-slate-100 font-extrabold")}>{formattedUsage}</span>
          <span className={cn("text-slate-600 mx-1")}>/</span>
          {formattedLimit}
        </span>
      </div>
      <div className={cn("h-2 bg-slate-955/80 border border-slate-800/80 rounded-full overflow-hidden p-0.5")}>
        <div className={`h-full ${bgBarClass} rounded-full transition-all duration-500 shadow-sm`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
};

export default function DashboardView({ currentLang, projects, onSelectProject, onNavigateToProjects }: DashboardViewProps) {
  const { licenseInfo } = useLicense();

  if (!licenseInfo) {
    return <DashboardSkeleton />;
  }

  const t = translations[currentLang];
  const isVietnamese = _.isEqual(currentLang, AppLanguage.VI);
  const langKey = isVietnamese ? UIConstants.LANG_VI : UIConstants.LANG_EN;
  const quotaText = _.get(QUOTA_TEXTS, langKey, QUOTA_TEXTS.VN);
  const commonTexts = _.get(UI_COMMON_TEXTS, currentLang, UI_COMMON_TEXTS.vi);
  const latestProject = _.last(projects) || null;

  const limitVideo = _.get(licenseInfo, SecurityConstants.LIMITS_VIDEO, SecurityConstants.ZERO);
  const limitImage = _.get(licenseInfo, SecurityConstants.LIMITS_IMAGE, SecurityConstants.ZERO);
  const limitVoice = _.get(licenseInfo, SecurityConstants.LIMITS_VOICE, SecurityConstants.ZERO);
  const isUnlimited = Boolean(_.get(licenseInfo, SecurityConstants.LIMITS_UNLIMITED, false));

  const usageVideo = _.get(licenseInfo, SecurityConstants.USAGE_VIDEO, SecurityConstants.ZERO);
  const usageImage = _.get(licenseInfo, SecurityConstants.USAGE_IMAGE, SecurityConstants.ZERO);
  const usageVoice = _.get(licenseInfo, SecurityConstants.USAGE_VOICE, SecurityConstants.ZERO);

  const calculatePercent = (used: number, limit: number): number => (isUnlimited ? 100 : _.clamp((used / (_.max([limit, 1]) as number)) * 100, 0, 100));

  const videoPercent = calculatePercent(usageVideo, limitVideo);
  const imagePercent = calculatePercent(usageImage, limitImage);
  const voicePercent = calculatePercent(usageVoice, limitVoice);

  return (
    <div className={cn("flex-grow h-full overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 w-full max-w-7xl mx-auto space-y-6 text-left")}>
      <div className={cn("relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-rose-950/40 border border-slate-800/80 p-6 sm:p-8 backdrop-blur-md shadow-xl")}>
        <div className={cn("absolute top-0 right-0 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none")} />
        <div className={cn("relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6")}>
          <div className={cn("space-y-2 max-w-2xl min-w-0")}>
            <div className={cn("inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-black max-w-full")}>
              <Sparkles className={cn("w-3.5 h-3.5 shrink-0")} />
              <span className={cn("truncate")} title={commonTexts.DASHBOARD_BADGE}>
                {commonTexts.DASHBOARD_BADGE}
              </span>
            </div>
            <h2 className={cn("text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-logo truncate")} title={t.dashboardAICreator}>
              {t.dashboardAICreator}
            </h2>
            <p className={cn("text-xs sm:text-sm text-slate-300 leading-relaxed truncate")} title={commonTexts.DASHBOARD_HERO_SUBTITLE}>
              {commonTexts.DASHBOARD_HERO_SUBTITLE}
            </p>
          </div>
          <div className={cn("flex items-center gap-3 shrink-0")}>
            <Button variant="primary" size="md" onClick={onNavigateToProjects} className={cn("rounded-2xl flex items-center gap-2")}>
              <FolderKanban className={cn("w-4 h-4 shrink-0")} />
              <span className={cn("truncate")}>{t.dashboardGoToContent}</span>
            </Button>
          </div>
        </div>
      </div>

      <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-6")}>
        <div className={cn("glass-card rounded-3xl p-6 shadow-md flex flex-col justify-between")}>
          <div className={cn("flex items-center justify-between mb-4")}>
            <h3 className={cn("text-xs font-extrabold uppercase tracking-wider text-slate-400 font-mono truncate")} title={t.dashboardCreatorInfo}>
              {t.dashboardCreatorInfo}
            </h3>
            <span className={cn("w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping shrink-0")} />
          </div>
          <div className={cn("flex items-center gap-4 my-2 min-w-0")}>
            <div className={cn("w-16 h-16 rounded-2xl bg-gradient-to-tr from-rose-600 to-amber-500 p-0.5 shadow-lg shadow-rose-500/20 shrink-0")}>
              <div className={cn("w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center")}>
                <Video className={cn("w-8 h-8 text-rose-400")} />
              </div>
            </div>
            <div className={cn("min-w-0 flex-1")}>
              <h4 className={cn("text-base font-extrabold text-slate-100 truncate")} title={t.dashboardAICreator}>
                {t.dashboardAICreator}
              </h4>
              <p className={cn("text-xs text-rose-400 font-bold mt-0.5 flex items-center gap-1 truncate")} title={t.dashboardMemberPro}>
                <Zap className={cn("w-3 h-3 text-amber-400 fill-amber-400 shrink-0")} />
                <span className={cn("truncate")}>{t.dashboardMemberPro}</span>
              </p>
              <p className={cn("text-[11px] text-slate-500 font-mono mt-1 truncate")} title={commonTexts.PROJECTS_CREATED_COUNT(projects.length)}>
                {commonTexts.PROJECTS_CREATED_COUNT(projects.length)}
              </p>
            </div>
          </div>
        </div>

        <div className={cn("glass-card rounded-3xl p-6 shadow-md flex flex-col justify-between gap-4")}>
          <div className={cn("flex items-center justify-between")}>
            <h3 className={cn("text-xs font-extrabold uppercase tracking-wider text-slate-400 font-mono truncate")} title={quotaText.MEDIA_QUOTA}>
              {quotaText.MEDIA_QUOTA}
            </h3>
            <Activity className={cn("w-4 h-4 text-emerald-400 shrink-0")} />
          </div>
          <div className={cn("space-y-4 flex-1")}>
            <QuotaProgressBar icon={<Video className={cn("w-3.5 h-3.5 shrink-0")} />} label={quotaText.VIDEO} usage={usageVideo} limit={limitVideo} percent={videoPercent} isUnlimited={isUnlimited} colorClass="text-blue-400" bgBarClass="bg-gradient-to-r from-blue-500 to-sky-400" />
            <QuotaProgressBar icon={<ImageIcon className={cn("w-3.5 h-3.5 shrink-0")} />} label={quotaText.IMAGE} usage={usageImage} limit={limitImage} percent={imagePercent} isUnlimited={isUnlimited} colorClass="text-emerald-400" bgBarClass="bg-gradient-to-r from-emerald-500 to-teal-400" />
          </div>
        </div>

        <div className={cn("glass-card rounded-3xl p-6 shadow-md flex flex-col justify-between gap-4")}>
          <div className={cn("flex items-center justify-between")}>
            <h3 className={cn("text-xs font-extrabold uppercase tracking-wider text-slate-400 font-mono truncate")} title={quotaText.VOICE_QUOTA}>
              {quotaText.VOICE_QUOTA}
            </h3>
            <Mic className={cn("w-4 h-4 text-amber-400 shrink-0")} />
          </div>
          <QuotaProgressBar icon={<Mic className={cn("w-3.5 h-3.5 shrink-0")} />} label={quotaText.CHARS} usage={usageVoice} limit={limitVoice} percent={voicePercent} isUnlimited={isUnlimited} colorClass="text-amber-400" bgBarClass="bg-gradient-to-r from-amber-500 to-orange-400" formatNumber />
          <p className={cn("text-[10px] text-slate-500 font-mono mt-auto truncate")} title={quotaText.SYNC_MSG}>
            {quotaText.SYNC_MSG}
          </p>
        </div>
      </div>

      {latestProject ? (
        <div className={cn("glass-card rounded-3xl p-6 sm:p-8 shadow-md")}>
          <div className={cn("flex items-center justify-between mb-6 gap-2")}>
            <h3 className={cn("text-xs font-extrabold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2 truncate")} title={t.dashboardLatestProject}>
              <FolderKanban className={cn("w-4 h-4 text-rose-500 shrink-0")} />
              <span className={cn("truncate")}>{t.dashboardLatestProject}</span>
            </h3>
            <Button variant="ghost" size="xs" onClick={onNavigateToProjects} className={cn("text-rose-400 hover:text-rose-300 flex items-center gap-1 font-bold shrink-0")}>
              <span className={cn("truncate")}>{commonTexts.VIEW_ALL}</span>
              <ArrowRight className={cn("w-3.5 h-3.5")} />
            </Button>
          </div>

          <div className={cn("flex flex-col sm:flex-row gap-6 items-start")}>
            <div className={cn("w-full sm:w-56 aspect-video bg-slate-950/90 border border-slate-800/80 rounded-2xl flex items-center justify-center overflow-hidden shrink-0 relative group shadow-inner")}>
              <Video className={cn("w-12 h-12 text-slate-700 group-hover:scale-110 transition-transform duration-300")} />
              <div className={cn("absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-black/80 backdrop-blur-sm text-[10px] font-bold font-mono text-white shadow-sm border border-white/10 truncate max-w-[80px]")}>{_.isEqual(latestProject.config?.language, AppLanguage.VI) ? UIConstants.LANG_VI : UIConstants.LANG_EN}</div>
            </div>
            <div className={cn("flex-1 space-y-3 min-w-0 w-full")}>
              <div className={cn("min-w-0")}>
                <h4 className={cn("text-lg font-extrabold text-slate-100 tracking-wide truncate")} title={latestProject.name}>
                  {latestProject.name}
                </h4>
                <p className={cn("text-xs text-slate-400 leading-relaxed max-w-2xl mt-1 truncate")} title={latestProject.description || t.dashboardNoDesc}>
                  {latestProject.description || t.dashboardNoDesc}
                </p>
              </div>
              <div className={cn("pt-2 flex flex-wrap gap-3")}>
                <Button variant="primary" size="md" onClick={() => onSelectProject(latestProject.id)} className={cn("rounded-2xl flex items-center gap-2")} title={t.dashboardOpenStudio}>
                  <Play className={cn("w-4 h-4 fill-white shrink-0")} />
                  <span className={cn("truncate")}>{t.dashboardOpenStudio}</span>
                </Button>
                <Button variant="outline" size="md" onClick={onNavigateToProjects} className={cn("rounded-2xl truncate")}>
                  {t.dashboardGoToContent}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className={cn("glass-card rounded-3xl p-10 shadow-md text-center")}>
          <div className={cn("w-16 h-16 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto mb-4 text-slate-600")}>
            <Video className={cn("w-8 h-8")} />
          </div>
          <h4 className={cn("text-base font-extrabold text-slate-100 truncate")} title={t.dashboardWelcome}>
            {t.dashboardWelcome}
          </h4>
          <p className={cn("text-xs text-slate-400 mt-2 max-w-md mx-auto leading-relaxed truncate")} title={t.dashboardWelcomeDesc}>
            {t.dashboardWelcomeDesc}
          </p>
          <Button variant="primary" size="md" className={cn("mt-5 rounded-2xl")} onClick={onNavigateToProjects} title={t.dashboardGoToContent}>
            <span className={cn("truncate")}>{t.dashboardGoToContent}</span>
          </Button>
        </div>
      )}
    </div>
  );
}
