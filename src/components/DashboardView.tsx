import { FC, ReactNode } from "react";
import { Video, Image as ImageIcon, Mic } from "lucide-react";
import { Button } from "./ui/Button";
import { VideoProject } from "../types";
import { Lang, translations } from "../lib/lang";
import { useLicense } from "../contexts/LicenseContext";
import { QUOTA_TEXTS } from "../constants/texts";
import { AppLanguage } from "../constants/enums";
import { SecurityConstants, UIConstants } from "../constants/security";
import _ from "lodash";

interface DashboardViewProps { currentLang: Lang; projects: VideoProject[]; onSelectProject: (id: string) => void; onNavigateToProjects: () => void; }

interface QuotaProgressBarProps { icon: ReactNode; label: string; usage: number; limit: number; percent: number; isUnlimited: boolean; colorClass: string; bgBarClass: string; formatNumber?: boolean; }

const QuotaProgressBar: FC<QuotaProgressBarProps> = ({ icon, label, usage, limit, percent, isUnlimited, colorClass, bgBarClass, formatNumber = false }) => {
  const formattedUsage = formatNumber ? usage.toLocaleString() : usage;
  const formattedLimit = isUnlimited ? UIConstants.INFINITY : formatNumber ? limit.toLocaleString() : limit;

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center text-[10px] font-bold">
        <span className={`${colorClass} flex items-center gap-1.5`}>
          {icon} {label}
        </span>
        <span className="text-slate-500">
          <span className="text-slate-200">{formattedUsage}</span> / {formattedLimit}
        </span>
      </div>
      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full ${bgBarClass} rounded-full transition-all duration-500`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
};

export default function DashboardView({ currentLang, projects, onSelectProject, onNavigateToProjects }: DashboardViewProps) {
  const t = translations[currentLang];
  const isVietnamese = _.isEqual(currentLang, AppLanguage.VI);
  const langKey = isVietnamese ? UIConstants.LANG_VI : UIConstants.LANG_EN;
  const quotaText = _.get(QUOTA_TEXTS, langKey, QUOTA_TEXTS.VN);
  const latestProject = _.last(projects) || null;

  const { licenseInfo } = useLicense();

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
    <div className="flex-grow h-full overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 w-full max-w-7xl mx-auto space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">{t.dashboardCreatorInfo}</h3>
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

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col gap-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">{quotaText.MEDIA_QUOTA}</h3>
          <div className="space-y-4 flex-1">
            <QuotaProgressBar icon={<Video className="w-3 h-3" />} label={quotaText.VIDEO} usage={usageVideo} limit={limitVideo} percent={videoPercent} isUnlimited={isUnlimited} colorClass="text-blue-400" bgBarClass="bg-blue-500" />
            <QuotaProgressBar icon={<ImageIcon className="w-3 h-3" />} label={quotaText.IMAGE} usage={usageImage} limit={limitImage} percent={imagePercent} isUnlimited={isUnlimited} colorClass="text-emerald-400" bgBarClass="bg-emerald-500" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col gap-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">{quotaText.VOICE_QUOTA}</h3>
          <QuotaProgressBar icon={<Mic className="w-3 h-3" />} label={quotaText.CHARS} usage={usageVoice} limit={limitVoice} percent={voicePercent} isUnlimited={isUnlimited} colorClass="text-amber-400" bgBarClass="bg-amber-500" formatNumber />
          <p className="text-[10px] text-slate-500 mt-auto">{quotaText.SYNC_MSG}</p>
        </div>
      </div>

      {latestProject ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">{t.dashboardLatestProject}</h3>
          <div className="flex flex-col sm:flex-row gap-5 items-start">
            <div className="w-full sm:w-48 aspect-video bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-center overflow-hidden shrink-0 relative">
              <Video className="w-12 h-12 text-slate-700" />
              <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/70 text-[9px] font-bold font-mono text-white shadow-sm">{_.isEqual(latestProject.config?.language, AppLanguage.VI) ? UIConstants.LANG_VI : UIConstants.LANG_EN}</div>
            </div>
            <div className="flex-1 space-y-2">
              <h4 className="text-sm font-bold text-slate-100 uppercase">{latestProject.name}</h4>
              <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">{latestProject.description || t.dashboardNoDesc}</p>
              <div className="pt-3 flex gap-2">
                <Button variant="primary" size="sm" onClick={() => onSelectProject(latestProject.id)} title={t.dashboardOpenStudio}>
                  {t.dashboardOpenStudio}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-sm text-center">
          <Video className="w-12 h-12 text-slate-700 mx-auto mb-4" />
          <h4 className="text-sm font-bold text-slate-100">{t.dashboardWelcome}</h4>
          <p className="text-xs text-slate-400 mt-2 max-w-sm mx-auto leading-relaxed">{t.dashboardWelcomeDesc}</p>
          <Button variant="primary" size="sm" className="mt-4" onClick={onNavigateToProjects} title={t.dashboardGoToContent}>
            {t.dashboardGoToContent}
          </Button>
        </div>
      )}
    </div>
  );
}
