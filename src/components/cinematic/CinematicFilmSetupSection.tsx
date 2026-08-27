import { Clapperboard, Film, Globe, Layers3 } from "lucide-react";
import { ProjectLanguage } from "../../types";

interface Props { idea: string; setIdea: (value: string) => void; language: ProjectLanguage; setLanguage: (value: ProjectLanguage) => void; duration: string; setDuration: (value: string) => void; seriesMode: "single" | "series"; setSeriesMode: (value: "single" | "series") => void; episodeCount: number; setEpisodeCount: (value: number) => void; }

export default function CinematicFilmSetupSection({ idea, setIdea, language, setLanguage, duration, setDuration, seriesMode, setSeriesMode, episodeCount, setEpisodeCount }: Props) {
  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-5 space-y-5 shadow-xl">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
          <Clapperboard className="w-5 h-5 text-amber-300" />
        </div>
        <div>
          <h2 className="text-sm font-black text-slate-100">Tiền kỳ phim AI</h2>
          <p className="text-[11px] text-slate-400 mt-1">Nhập ý tưởng; AI phát triển screenplay, nhân vật, thế giới, shot list và continuity.</p>
        </div>
      </div>

      <textarea rows={6} value={idea} onChange={(event) => setIdea(event.target.value)} placeholder="Ví dụ: Một thợ săn tiền thưởng mắc kẹt trên thuộc địa khai khoáng phải lựa chọn giữa món tiền lớn và việc cứu những người từng phản bội cô..." className="w-full bg-slate-955/90 border border-slate-800 focus:border-amber-500/70 text-slate-100 p-4 rounded-2xl text-sm leading-relaxed outline-none resize-none placeholder:text-slate-600" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <label className="space-y-1.5">
          <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
            <Film className="w-3 h-3" /> Định dạng
          </span>
          <select value={seriesMode} onChange={(event) => setSeriesMode(event.target.value as "single" | "series")} className="w-full bg-slate-955 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 outline-none">
            <option value="single">Phim một tập</option>
            <option value="series">Loạt phim nhiều tập</option>
          </select>
        </label>
        <label className="space-y-1.5">
          <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
            <Layers3 className="w-3 h-3" /> Số tập
          </span>
          <input type="number" min={1} max={24} disabled={seriesMode === "single"} value={seriesMode === "single" ? 1 : episodeCount} onChange={(event) => setEpisodeCount(Math.max(2, Math.min(24, Number(event.target.value))))} className="w-full bg-slate-955 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 disabled:text-slate-600 outline-none" />
        </label>
        <label className="space-y-1.5">
          <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
            <Globe className="w-3 h-3" /> Ngôn ngữ thoại
          </span>
          <select value={language} onChange={(event) => setLanguage(event.target.value as ProjectLanguage)} className="w-full bg-slate-955 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 outline-none">
            <option value={ProjectLanguage.VI}>Tiếng Việt</option>
            <option value={ProjectLanguage.EN}>English</option>
          </select>
        </label>
        <label className="space-y-1.5">
          <span className="text-[10px] uppercase font-bold text-slate-400">Thời lượng mỗi tập</span>
          <select value={duration} onChange={(event) => setDuration(event.target.value)} className="w-full bg-slate-955 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 outline-none">
            <option value="1 minute">1 phút</option>
            <option value="2 minutes">2 phút</option>
            <option value="3 minutes">3 phút</option>
            <option value="3-5 minutes">3–5 phút</option>
            <option value="5-10 minutes">5–10 phút</option>
            <option value="10-15 minutes">10–15 phút</option>
          </select>
        </label>
      </div>

      {seriesMode === "series" && <div className="rounded-xl border border-cyan-800/40 bg-cyan-950/20 px-3 py-2 text-[11px] text-cyan-200">AI sẽ khóa series bible: nhân vật, casting, thế giới, đạo cụ, timeline và mạch truyện xuyên suốt {episodeCount} tập.</div>}
    </div>
  );
}
