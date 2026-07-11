import { Lang, translations } from "../lib/lang.js";
import { Video, Coins, TrendingUp, Sun, Moon } from "lucide-react";
import { Button } from "./ui/Button";

interface HeaderProps {
  currentLang: Lang;
  setLang: (lang: Lang) => void;
  credits: number;
  costTracker: number;
  theme: "light" | "dark";
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
  const t = translations[currentLang];

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-200 sticky top-0 z-50 shadow-sm flex-shrink-0">
      <div className="w-full max-w-[100vw] xl:max-w-screen-2xl mx-auto px-4 lg:px-8 py-2.5 flex items-center justify-between gap-4 relative">
        {/* Left Section: App Logo & Studio Brand */}
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

        {/* Right Section: Controls, Credits, Cost & Theme */}
        <div className="flex items-center justify-end gap-2.5">
          {/* Live Sync Status */}
          <div className="hidden md:flex items-center gap-1.5 mr-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse"></div>
            <span className="text-[9px] uppercase font-bold text-slate-400 font-mono tracking-wider">{t.Live_Sync}</span>
          </div>

          {/* Credits Chip */}
          <div className="flex items-center gap-1.5 bg-slate-800/40 border border-slate-700/50 rounded-xl px-2.5 py-1.5 text-xs">
            <Coins className="w-3.5 h-3.5 text-rose-400" />
            <span className="font-mono font-bold text-rose-400">
              {credits.toLocaleString()} {t.pts}
            </span>
          </div>

          {/* USD Cost Chip */}
          <div className="flex items-center gap-1.5 bg-slate-800/40 border border-slate-700/50 rounded-xl px-2.5 py-1.5 text-xs">
            <TrendingUp className="w-3.5 h-3.5 text-green-400" />
            <span className="font-mono font-bold text-green-400">
              ${costTracker.toFixed(4)} {t.USD}
            </span>
          </div>

          {/* Theme Switcher */}
          <Button
            variant="secondary"
            size="xs"
            onClick={toggleTheme}
            className="p-2 bg-slate-800/40 border border-slate-700/50 text-slate-400 hover:text-slate-100 hover:bg-slate-700 rounded-xl shadow-none"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>

          {/* Language Switcher */}
          <div className="flex items-center bg-slate-800/40 border border-slate-700/50 rounded-xl p-0.5 shrink-0">
            <Button
              variant="ghost"
              size="xs"
              onClick={() => setLang("vi")}
              className={`px-2 py-1 text-[9px] rounded-lg shadow-none font-bold ${currentLang === "vi" ? "bg-slate-700 text-slate-100 hover:bg-slate-600" : "text-slate-400 hover:text-slate-200 hover:bg-transparent"}`}
            >
              {t.VI}
            </Button>
            <Button
              variant="ghost"
              size="xs"
              onClick={() => setLang("en")}
              className={`px-2 py-1 text-[9px] rounded-lg shadow-none font-bold ${currentLang === "en" ? "bg-slate-700 text-slate-100 hover:bg-slate-600" : "text-slate-400 hover:text-slate-200 hover:bg-transparent"}`}
            >
              {t.EN}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
