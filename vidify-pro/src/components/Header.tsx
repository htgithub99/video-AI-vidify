import { cn } from "../lib/utils";
import { Lang, translations } from "../lib/lang.js";
import { Video, Image as ImageIcon, Mic, Sun, Moon } from "lucide-react";
import { Button } from "./ui/Button";
import { AppTheme, AppLanguage } from "../constants/enums";
import { useLicense } from "../contexts/LicenseContext";
import { UIConstants } from "../constants/security";
import { QUOTA_TEXTS } from "../constants/texts";
import _ from "lodash";

const LANG_BTN_BASE = "px-3 py-1.5 text-[10px] rounded-lg font-extrabold transition-all duration-200 outline-none flex items-center justify-center relative z-10 focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-1 active:scale-95";
const LANG_BTN_ACTIVE = "bg-white dark:bg-slate-800 text-rose-600 shadow-md border border-slate-200 dark:border-slate-700";
const LANG_BTN_INACTIVE = "text-slate-500 hover:text-slate-700 hover:bg-slate-300/60 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/60 border border-transparent";

interface HeaderProps {
  currentLang: AppLanguage | Lang;
  setLang: (lang: Lang) => void;
  credits: number;
  costTracker: number;
  theme: AppTheme | string;
  toggleTheme: () => void;
}

export default function Header({
  currentLang,
  setLang,
  credits,
  costTracker,
  theme,
  toggleTheme,
}: HeaderProps) {
  const t = translations[currentLang as Lang];
  const langKey = _.isEqual(currentLang, AppLanguage.VI) ? 'VN' : 'EN';
  const quotaText = QUOTA_TEXTS[langKey];
  const { licenseInfo } = useLicense();

  const limitVideo = _.get(licenseInfo, 'limits.video', 0);
  const limitImage = _.get(licenseInfo, 'limits.image', 0);
  const limitVoice = _.get(licenseInfo, 'limits.voice', 0);
  const isUnlimited = _.get(licenseInfo, 'limits.unlimited', false);

  const usageVideo = _.get(licenseInfo, 'usage.video', 0);
  const usageImage = _.get(licenseInfo, 'usage.image', 0);
  const usageVoice = _.get(licenseInfo, 'usage.voice', 0);

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-200 sticky top-0 z-50 shadow-sm flex-shrink-0">
      <div className="w-full max-w-[100vw] xl:max-w-screen-2xl mx-auto px-4 lg:px-8 py-2.5 flex items-center justify-between gap-4 relative">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-rose-600 rounded-xl flex items-center justify-center shadow-md shadow-rose-500/10">
            <Video className="w-4.5 h-4.5 text-slate-100 animate-pulse" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-wide text-slate-100 flex items-center gap-2 font-logo">
              {t.appTitle}
              <span className="text-[9px] bg-rose-500/10 text-rose-400 font-extrabold px-1.5 py-0.5 rounded border border-rose-500/20 tracking-tighter">
                {t.v2_4_PRO}
              </span>
            </h1>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5">
          <div className="hidden md:flex items-center gap-1.5 mr-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse"></div>
            <span className="text-[9px] uppercase font-bold text-slate-400 font-mono tracking-wider">{t.Live_Sync}</span>
          </div>

          <div className="hidden sm:flex items-center gap-2 bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-lg px-2.5 py-1.5 shadow-sm transition-colors hover:bg-slate-800" title={quotaText.VIDEO_TOOLTIP}>
            <Video className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-[10px] font-bold text-slate-400">
              <span className="text-blue-400 font-black">{usageVideo}</span> / {isUnlimited ? UIConstants.INFINITY : limitVideo}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-2 bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-lg px-2.5 py-1.5 shadow-sm transition-colors hover:bg-slate-800" title={quotaText.IMAGE_TOOLTIP}>
            <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[10px] font-bold text-slate-400">
              <span className="text-emerald-400 font-black">{usageImage}</span> / {isUnlimited ? UIConstants.INFINITY : limitImage}
            </span>
          </div>

          <div className="flex items-center gap-2 bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-lg px-2.5 py-1.5 shadow-sm transition-colors hover:bg-slate-800" title={quotaText.VOICE_TOOLTIP}>
            <Mic className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[10px] font-bold text-slate-400">
              <span className="text-amber-400 font-black">{usageVoice.toLocaleString()}</span> / {isUnlimited ? UIConstants.INFINITY : limitVoice.toLocaleString()}
            </span>
          </div>

          <Button
            variant="secondary"
            size="xs"
            onClick={toggleTheme}
            className="p-2 bg-slate-800/40 border border-slate-700/50 text-slate-400 hover:text-slate-100 hover:bg-slate-700 rounded-xl shadow-none"
          >
            {theme === AppTheme.DARK ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>

          <div className="flex items-center bg-slate-200/60 dark:bg-slate-900/60 border border-slate-300/50 dark:border-slate-800/80 rounded-xl p-1 shrink-0 gap-1 shadow-inner relative">
            {Object.values(AppLanguage).map((langCode) => (
              <button
                key={langCode}
                onClick={() => setLang(langCode as Lang)}
                className={cn(LANG_BTN_BASE, currentLang === langCode ? LANG_BTN_ACTIVE : LANG_BTN_INACTIVE)}
              >
                {langCode.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
