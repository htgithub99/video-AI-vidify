import { RUNTIME_TEXT as RT_SHARED } from "../../../constants/runtime/shared.js";
import { RUNTIME_TEXT as RT_DASHBOARD } from "../constants/runtimeText.js";
import { StudioPage, StudioCard, StudioHeader, StudioCanvas } from "../../../components/ui/Studio.js";
import { SOURCE_TEXT_BG_GRADIENT_TO_R_FROM_AMBER, SOURCE_TEXT_BG_GRADIENT_TO_R_FROM_BLUE, SOURCE_TEXT_BG_GRADIENT_TO_R_FROM_EMERALD, SOURCE_TEXT_GHOST, SOURCE_TEXT_MD, SOURCE_TEXT_OUTLINE, SOURCE_TEXT_PRIMARY, SOURCE_TEXT_SYMBOL, SOURCE_TEXT_TEXT_AMBER_400, SOURCE_TEXT_TEXT_BLUE_400, SOURCE_TEXT_TEXT_EMERALD_400, SOURCE_TEXT_XS } from "../../../constants/sourceText";
import { cn } from "../../../lib/utils";
import { FC, ReactNode } from "react";
import { Video, Image as ImageIcon, Mic, Sparkles, FolderKanban, Play, ArrowRight, Activity, Zap } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { DashboardSkeleton } from "../../../components/ui/Skeleton";
import { VideoProject } from "../../../types";
import { Lang, translations } from "../../../lib/lang";
import { useLicense } from "../../../contexts/LicenseContext";
import { QUOTA_TEXTS, UI_COMMON_TEXTS } from "../../../constants/texts";
import { AppLanguage } from "../../../constants/enums";
import { SecurityConstants, UIConstants } from "../../../constants/security";
import _ from "lodash";
interface DashboardViewProps {
  currentLang: Lang;
  projects: VideoProject[];
  isLoading?: boolean;
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
    <div className={cn(RT_SHARED.SPACE_Y_2)}>
      <div className={cn(RT_DASHBOARD.FLEX_JUSTIFY_BETWEEN_ITEMS_CENTER_TEXT_XS_FONT_BOLD_GAP)}>
        <span className={cn(colorClass, RT_DASHBOARD.FLEX_ITEMS_CENTER_GAP_1_5_TRUNCATE)} title={label}>
          {icon} <span className={cn(RT_SHARED.TRUNCATE)}>{label}</span>
        </span>
        <span className={cn(RT_DASHBOARD.TEXT_SLATE_400_FONT_MONO_TEXT_11PX_SHRINK_0)}>
          <span className={cn(RT_DASHBOARD.TEXT_SLATE_100_FONT_EXTRABOLD)}>{formattedUsage}</span>
          <span className={cn(RT_SHARED.TEXT_SLATE_600_MX_1)}>{SOURCE_TEXT_SYMBOL}</span>
          {formattedLimit}
        </span>
      </div>
      <div className={cn(RT_DASHBOARD.H_2_BG_SLATE_955_80_BORDER_BORDER_SLATE_800)}>
        <div className={cn(RT_DASHBOARD.H_FULL_ROUNDED_FULL_TRANSITION_ALL_DURATION_500_SHADOW_SM, bgBarClass)} style={{ width: `${percent}${RT_SHARED.SYMBOL}` }} />
      </div>
    </div>
  );
};
export default function DashboardView({ currentLang, projects, isLoading = false, onSelectProject, onNavigateToProjects }: DashboardViewProps) {
  const { licenseInfo } = useLicense();
  if (!licenseInfo || isLoading) {
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
    <StudioPage>
      <StudioCanvas>
        <StudioHeader
          icon={Sparkles}
          title={t.dashboardAICreator}
          badge={commonTexts.DASHBOARD_BADGE}
          description={commonTexts.DASHBOARD_HERO_SUBTITLE}
          actions={
            <Button variant={SOURCE_TEXT_PRIMARY} size={SOURCE_TEXT_MD} onClick={onNavigateToProjects} className={cn(RT_DASHBOARD.ROUNDED_2XL_FLEX_ITEMS_CENTER_GAP_2)}>
              <FolderKanban className={cn(RT_SHARED.W_4_H_4_SHRINK_0)} />
              <span className={cn(RT_SHARED.TRUNCATE)}>{t.dashboardGoToContent}</span>
            </Button>
          }
        />
        <div className={cn(RT_DASHBOARD.GRID_GRID_COLS_1_MD_GRID_COLS_3_GAP_6)}>
          <StudioCard className={cn(RT_DASHBOARD.GLASS_CARD_ROUNDED_3XL_P_6_SHADOW_MD_FLEX_FLEX)}>
            <div className={cn(RT_DASHBOARD.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN_MB_4)}>
              <h3 className={cn(RT_DASHBOARD.TEXT_XS_FONT_EXTRABOLD_UPPERCASE_TRACKING_WIDER_TEXT_SLATE_400)} title={t.dashboardCreatorInfo}>
                {t.dashboardCreatorInfo}
              </h3>
              <span className={cn(RT_DASHBOARD.W_2_5_H_2_5_ROUNDED_FULL_BG_ROSE)} />
            </div>
            <div className={cn(RT_DASHBOARD.FLEX_ITEMS_CENTER_GAP_4_MY_2_MIN_W_0)}>
              <div className={cn(RT_DASHBOARD.W_16_H_16_ROUNDED_2XL_BG_GRADIENT_TO_TR)}>
                <div className={cn(RT_SHARED.W_FULL_H_FULL_BG_SLATE_950_ROUNDED_14PX_FLEX)}>
                  <Video className={cn(RT_DASHBOARD.W_8_H_8_TEXT_ROSE_400)} />
                </div>
              </div>
              <div className={cn(RT_SHARED.MIN_W_0_FLEX_1)}>
                <h4 className={cn(RT_DASHBOARD.TEXT_BASE_FONT_EXTRABOLD_TEXT_SLATE_100_TRUNCATE)} title={t.dashboardAICreator}>
                  {t.dashboardAICreator}
                </h4>
                <p className={cn(RT_DASHBOARD.TEXT_XS_TEXT_ROSE_400_FONT_BOLD_MT_0_5)} title={t.dashboardMemberPro}>
                  <Zap className={cn(RT_DASHBOARD.W_3_H_3_TEXT_AMBER_400_FILL_AMBER_400)} />
                  <span className={cn(RT_SHARED.TRUNCATE)}>{t.dashboardMemberPro}</span>
                </p>
                <p className={cn(RT_DASHBOARD.TEXT_11PX_TEXT_SLATE_500_FONT_MONO_MT_1_TRUNCATE)} title={commonTexts.PROJECTS_CREATED_COUNT(projects.length)}>
                  {commonTexts.PROJECTS_CREATED_COUNT(projects.length)}
                </p>
              </div>
            </div>
          </StudioCard>
          <StudioCard className={cn(RT_DASHBOARD.GLASS_CARD_ROUNDED_3XL_P_6_SHADOW_MD_FLEX_FLEX_06FAEE)}>
            <div className={cn(RT_SHARED.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN)}>
              <h3 className={cn(RT_DASHBOARD.TEXT_XS_FONT_EXTRABOLD_UPPERCASE_TRACKING_WIDER_TEXT_SLATE_400)} title={quotaText.MEDIA_QUOTA}>
                {quotaText.MEDIA_QUOTA}
              </h3>
              <Activity className={cn(RT_DASHBOARD.W_4_H_4_TEXT_EMERALD_400_SHRINK_0)} />
            </div>
            <div className={cn(RT_SHARED.SPACE_Y_4_FLEX_1)}>
              <QuotaProgressBar icon={<Video className={cn(RT_SHARED.W_3_5_H_3_5_SHRINK_0)} />} label={quotaText.VIDEO} usage={usageVideo} limit={limitVideo} percent={videoPercent} isUnlimited={isUnlimited} colorClass={SOURCE_TEXT_TEXT_BLUE_400} bgBarClass={SOURCE_TEXT_BG_GRADIENT_TO_R_FROM_BLUE} />
              <QuotaProgressBar icon={<ImageIcon className={cn(RT_SHARED.W_3_5_H_3_5_SHRINK_0)} />} label={quotaText.IMAGE} usage={usageImage} limit={limitImage} percent={imagePercent} isUnlimited={isUnlimited} colorClass={SOURCE_TEXT_TEXT_EMERALD_400} bgBarClass={SOURCE_TEXT_BG_GRADIENT_TO_R_FROM_EMERALD} />
            </div>
          </StudioCard>
          <StudioCard className={cn(RT_DASHBOARD.GLASS_CARD_ROUNDED_3XL_P_6_SHADOW_MD_FLEX_FLEX_06FAEE)}>
            <div className={cn(RT_SHARED.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN)}>
              <h3 className={cn(RT_DASHBOARD.TEXT_XS_FONT_EXTRABOLD_UPPERCASE_TRACKING_WIDER_TEXT_SLATE_400)} title={quotaText.VOICE_QUOTA}>
                {quotaText.VOICE_QUOTA}
              </h3>
              <Mic className={cn(RT_SHARED.W_4_H_4_TEXT_AMBER_400_SHRINK_0)} />
            </div>
            <QuotaProgressBar icon={<Mic className={cn(RT_SHARED.W_3_5_H_3_5_SHRINK_0)} />} label={quotaText.CHARS} usage={usageVoice} limit={limitVoice} percent={voicePercent} isUnlimited={isUnlimited} colorClass={SOURCE_TEXT_TEXT_AMBER_400} bgBarClass={SOURCE_TEXT_BG_GRADIENT_TO_R_FROM_AMBER} formatNumber />
            <p className={cn(RT_DASHBOARD.TEXT_10PX_TEXT_SLATE_500_FONT_MONO_MT_AUTO_TRUNCATE)} title={quotaText.SYNC_MSG}>
              {quotaText.SYNC_MSG}
            </p>
          </StudioCard>
        </div>
        {latestProject ? (
          <StudioCard className={cn(RT_DASHBOARD.GLASS_CARD_ROUNDED_3XL_P_6_SM_P_8_SHADOW)}>
            <div className={cn(RT_DASHBOARD.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN_MB_6_GAP_2)}>
              <h3 className={cn(RT_DASHBOARD.TEXT_XS_FONT_EXTRABOLD_UPPERCASE_TRACKING_WIDER_TEXT_SLATE_300)} title={t.dashboardLatestProject}>
                <FolderKanban className={cn(RT_SHARED.W_4_H_4_TEXT_ROSE_500_SHRINK_0)} />
                <span className={cn(RT_SHARED.TRUNCATE)}>{t.dashboardLatestProject}</span>
              </h3>
              <Button variant={SOURCE_TEXT_GHOST} size={SOURCE_TEXT_XS} onClick={onNavigateToProjects} className={cn(RT_DASHBOARD.TEXT_ROSE_400_HOVER_TEXT_ROSE_300_FLEX_ITEMS_CENTER)}>
                <span className={cn(RT_SHARED.TRUNCATE)}>{commonTexts.VIEW_ALL}</span>
                <ArrowRight className={cn(RT_SHARED.W_3_5_H_3_5)} />
              </Button>
            </div>
            <div className={cn(RT_DASHBOARD.FLEX_FLEX_COL_SM_FLEX_ROW_GAP_6_ITEMS_START)}>
              <div className={cn(RT_DASHBOARD.W_FULL_SM_W_56_ASPECT_VIDEO_BG_SLATE_950)}>
                <Video className={cn(RT_DASHBOARD.W_12_H_12_TEXT_SLATE_700_GROUP_HOVER_SCALE)} />
                <div className={cn(RT_DASHBOARD.ABSOLUTE_TOP_2_5_RIGHT_2_5_PX_2_PY)}>{_.isEqual(latestProject.config?.language, AppLanguage.VI) ? UIConstants.LANG_VI : UIConstants.LANG_EN}</div>
              </div>
              <div className={cn(RT_DASHBOARD.FLEX_1_SPACE_Y_3_MIN_W_0_W_FULL)}>
                <div className={cn(RT_SHARED.MIN_W_0)}>
                  <h4 className={cn(RT_DASHBOARD.TEXT_LG_FONT_EXTRABOLD_TEXT_SLATE_100_TRACKING_WIDE_TRUNCATE)} title={latestProject.name}>
                    {latestProject.name}
                  </h4>
                  <p className={cn(RT_DASHBOARD.TEXT_XS_TEXT_SLATE_400_LEADING_RELAXED_MT_1_TRUNCATE)} title={latestProject.description || t.dashboardNoDesc}>
                    {latestProject.description || t.dashboardNoDesc}
                  </p>
                </div>
                <div className={cn(RT_DASHBOARD.PT_2_FLEX_FLEX_WRAP_GAP_3)}>
                  <Button variant={SOURCE_TEXT_PRIMARY} size={SOURCE_TEXT_MD} onClick={() => onSelectProject(latestProject.id)} className={cn(RT_DASHBOARD.ROUNDED_2XL_FLEX_ITEMS_CENTER_GAP_2)} title={t.dashboardOpenStudio}>
                    <Play className={cn(RT_DASHBOARD.W_4_H_4_FILL_WHITE_SHRINK_0)} />
                    <span className={cn(RT_SHARED.TRUNCATE)}>{t.dashboardOpenStudio}</span>
                  </Button>
                  <Button variant={SOURCE_TEXT_OUTLINE} size={SOURCE_TEXT_MD} onClick={onNavigateToProjects} className={cn(RT_DASHBOARD.ROUNDED_2XL_TRUNCATE)}>
                    {t.dashboardGoToContent}
                  </Button>
                </div>
              </div>
            </div>
          </StudioCard>
        ) : (
          <StudioCard className={cn(RT_DASHBOARD.GLASS_CARD_ROUNDED_3XL_P_10_SHADOW_MD_TEXT_CENTER)}>
            <div className={cn(RT_DASHBOARD.W_16_H_16_ROUNDED_3XL_BG_SLATE_900_BORDER)}>
              <Video className={cn(RT_DASHBOARD.W_8_H_8)} />
            </div>
            <h4 className={cn(RT_DASHBOARD.TEXT_BASE_FONT_EXTRABOLD_TEXT_SLATE_100_TRUNCATE)} title={t.dashboardWelcome}>
              {t.dashboardWelcome}
            </h4>
            <p className={cn(RT_DASHBOARD.TEXT_XS_TEXT_SLATE_400_MT_2_MAX_W_MD)} title={t.dashboardWelcomeDesc}>
              {t.dashboardWelcomeDesc}
            </p>
            <Button variant={SOURCE_TEXT_PRIMARY} size={SOURCE_TEXT_MD} className={cn(RT_DASHBOARD.MT_5_ROUNDED_2XL)} onClick={onNavigateToProjects} title={t.dashboardGoToContent}>
              <span className={cn(RT_SHARED.TRUNCATE)}>{t.dashboardGoToContent}</span>
            </Button>
          </StudioCard>
        )}
      </StudioCanvas>
    </StudioPage>
  );
}
