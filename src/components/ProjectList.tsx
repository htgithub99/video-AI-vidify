import { cn } from "../lib/utils";
import React, { useState } from "react";
import { Lang, translations } from "../lib/lang.js";
import { VideoProject } from "../types.js";
import { Plus, Video, Calendar, Trash2, Edit3, Film, Lightbulb, PlayCircle, Coins, Search, Globe, ChevronRight } from "lucide-react";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import { COMMON_STRINGS } from "../constants/index.js";

const FILTER_ALL = "all";
const LANG_VI = "vi";
const LANG_EN = "en";

const LOCAL_TEXTS = {
  vi: {
    desc: "Quản lý và biên tập tất cả các dự án sản xuất video AI của bạn",
    allLangs: "Tất cả ngôn ngữ",
    viBtn: "🇻🇳 Tiếng Việt",
    enBtn: "🇺🇸 English",
    allGenres: "TẤT CẢ THỂ LOẠI",
    searchPlaceholder: "Tìm kiếm dự án...",
    noProjectsMatch: "Không tìm thấy dự án phù hợp với bộ lọc.",
    colVideoProject: "Dự án video",
    colCredits: "Tiêu hao",
    colUpdatedAt: "Cập nhật lần cuối",
    colActions: "Hành động",
    genreLabels: {
      Documentary: "Tài Liệu",
      Explanation: "Giải Thích",
      Review: "Đánh Giá",
      History: "Lịch Sử",
      Science: "Khoa Học",
      Story: "Kể Chuyện",
      News: "Tin Tức",
    } as Record<string, string>,
  },
  en: {
    desc: "Synthesize stories, design video structures with AI...",
    allLangs: "All Languages",
    viBtn: "🇻🇳 Tiếng Việt",
    enBtn: "🇺🇸 English",
    allGenres: "ALL GENRES",
    searchPlaceholder: "Search projects...",
    noProjectsMatch: "No projects matched your criteria.",
    colVideoProject: "Video Project",
    colCredits: "Credits",
    colUpdatedAt: "Updated At",
    colActions: "Actions",
    genreLabels: {
      Documentary: "Documentary",
      Explanation: "Explanation",
      Review: "Review",
      History: "History",
      Science: "Science",
      Story: "Story",
      News: "News",
    } as Record<string, string>,
  },
};

const getGenreLabel = (genre: string, lang: Lang) => {
  const labels = LOCAL_TEXTS[lang].genreLabels;
  return labels[genre] || genre;
};

interface ProjectListProps {
  currentLang: Lang;
  projects: VideoProject[];
  onSelectProject: (p: VideoProject) => void;
  onCreateProject: (name: string, desc: string) => void;
  onUpdateProject?: (id: string, name: string, desc: string) => void;
  onDeleteProject: (id: string) => void;
}

export default function ProjectList({
  currentLang,
  projects,
  onSelectProject,
  onCreateProject,
  onUpdateProject,
  onDeleteProject,
}: ProjectListProps) {
  const t = translations[currentLang];
  const localT = LOCAL_TEXTS[currentLang];
  
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [projectToDelete, setProjectToDelete] = useState<VideoProject | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterLang, setFilterLang] = useState<string>(FILTER_ALL);
  const [filterGenre, setFilterGenre] = useState<string>(FILTER_ALL);

  const handleOpenCreateTarget = () => {
    setEditingId(null);
    setName("");
    setDesc("");
    setShowModal(true);
  };

  const handleOpenEditTarget = (p: VideoProject) => {
    setEditingId(p.id);
    setName(p.name);
    setDesc(p.description || "");
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (editingId && onUpdateProject) {
      onUpdateProject(editingId, name, desc);
    } else {
      onCreateProject(name, desc);
    }
    setName("");
    setDesc("");
    setShowModal(false);
    setEditingId(null);
  };

  const searchLower = searchQuery.toLowerCase();
  
  const filteredProjects = projects.filter((proj) => {
    const matchesSearch = [proj.name, proj.description || ""].some((text) => 
      text.toLowerCase().includes(searchLower)
    );
    const matchesLang = filterLang === FILTER_ALL || proj.config.language.toLowerCase() === filterLang;
    const matchesGenre = filterGenre === FILTER_ALL || proj.config.genre === filterGenre;

    return matchesSearch && matchesLang && matchesGenre;
  });

  const availableGenres = [FILTER_ALL, ...Array.from(new Set(projects.map((p) => p.config.genre).filter(Boolean)))];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-sm">
        <div>
          <h2 className="text-base font-black tracking-tight text-slate-100 flex items-center gap-2 uppercase font-mono">
            <Film className="w-5 h-5 text-rose-500" />
            {t.projects}
          </h2>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed font-medium">
            {currentLang === LANG_VI ? localT.desc : t.Synthesize_stories_design || localT.desc}
          </p>
        </div>
        <Button variant="primary" onClick={handleOpenCreateTarget} className="flex items-center gap-2 self-start md:self-auto px-5 py-2.5 bg-gradient-to-r from-rose-600 to-rose-500 text-white font-bold rounded-xl shadow-md shadow-rose-500/10">
          <Plus className="w-4 h-4" />
          {t.newProject}
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-slate-900 border border-slate-800/80 p-4 rounded-xl">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setFilterLang(FILTER_ALL)}
            className={cn(`px-3 py-1.5 text-[10px] uppercase font-bold rounded-lg transition-all ${
              filterLang === FILTER_ALL
                ? "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                : "bg-slate-950 text-slate-400 border border-slate-700/60 hover:bg-slate-850"
            }`)}
          >
            {localT.allLangs}
          </button>
          <button
            onClick={() => setFilterLang(LANG_VI)}
            className={cn(`px-3 py-1.5 text-[10px] uppercase font-bold rounded-lg transition-all ${
              filterLang === LANG_VI
                ? "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                : "bg-slate-950 text-slate-400 border border-slate-700/60 hover:bg-slate-850"
            }`)}
          >
            {localT.viBtn}
          </button>
          <button
            onClick={() => setFilterLang(LANG_EN)}
            className={cn(`px-3 py-1.5 text-[10px] uppercase font-bold rounded-lg transition-all ${
              filterLang === LANG_EN
                ? "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                : "bg-slate-950 text-slate-400 border border-slate-700/60 hover:bg-slate-850"
            }`)}
          >
            {localT.enBtn}
          </button>

          {availableGenres.length > 2 && (
            <select
              value={filterGenre}
              onChange={(e) => setFilterGenre(e.target.value)}
              className="bg-slate-950 border border-slate-700/60 text-slate-400 rounded-lg px-2 py-1.5 text-[10px] font-bold outline-none focus:border-rose-500/50 hover:bg-slate-850 transition-all uppercase"
            >
              <option value={FILTER_ALL}>{localT.allGenres}</option>
              {availableGenres.filter(g => g !== FILTER_ALL).map(g => (
                <option key={g} value={g}>{getGenreLabel(g, currentLang).toUpperCase()}</option>
              ))}
            </select>
          )}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={localT.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-200 pl-9 pr-4 py-2 rounded-xl focus:outline-none focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/50 hover:bg-slate-200 dark:hover:bg-slate-850 transition-all font-sans"
          />
        </div>
      </div>

      {filteredProjects.length === 0 ? (
        <div className="text-center py-20 bg-slate-900 rounded-xl border border-dashed border-slate-800 flex flex-col items-center justify-center p-6 space-y-4">
          <div className="p-4 bg-slate-950 rounded-full border border-slate-800">
            <Video className="w-8 h-8 text-slate-600" />
          </div>
          <p className="text-slate-400 text-xs font-semibold max-w-sm leading-relaxed">
            {projects.length === 0 ? t.noProjects : localT.noProjectsMatch}
          </p>
          <Button variant="ghost" onClick={handleOpenCreateTarget} className="flex items-center gap-2 text-rose-500 hover:text-rose-400 font-bold text-xs">
            <Plus className="w-4.5 h-4.5" />
            {t.createNew}
          </Button>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase font-black tracking-wider bg-slate-950/20">
                  <th className="py-4 px-6 min-w-[280px]">{localT.colVideoProject}</th>
                  <th className="py-4 px-4 text-center min-w-[100px]">{t.outputLang}</th>
                  <th className="py-4 px-4 text-center min-w-[120px]">{localT.colCredits}</th>
                  <th className="py-4 px-4 min-w-[140px]">{localT.colUpdatedAt}</th>
                  <th className="py-4 px-6 text-right min-w-[150px]">{localT.colActions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredProjects.map((project) => {
                  const dateStr = new Date(project.updatedAt).toLocaleDateString(t.en_US, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <tr
                      key={project.id}
                      onClick={() => onSelectProject(project)}
                      className="group hover:bg-slate-850 cursor-pointer transition-colors duration-200"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-start gap-4">
                          <div className="w-24 h-14 bg-slate-950 border border-slate-800 rounded flex flex-col items-center justify-center shrink-0 relative overflow-hidden group-hover:border-rose-500/40 transition-colors">
                            <Video className="w-6 h-6 text-slate-700 group-hover:text-rose-500/50 transition-colors" />
                            {project.config.genre && (
                              <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/70 text-[8px] font-bold font-mono text-white uppercase tracking-tighter shadow-sm">
                                {getGenreLabel(project.config.genre, currentLang)}
                              </div>
                            )}
                          </div>
                          <div className="space-y-1">
                            <h3 className="font-bold text-slate-100 text-xs tracking-tight group-hover:text-rose-400 transition-colors uppercase line-clamp-1">
                              {project.name}
                            </h3>
                            <p className="text-slate-400 text-[10px] font-medium line-clamp-2 leading-relaxed max-w-md">
                              {project.description || t.No_description_1}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4 text-center">
                        <span className="inline-flex items-center gap-1 bg-slate-800/40 border border-slate-700/50 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-lg text-[9px] font-bold">
                          <Globe className="w-3 h-3 text-slate-500" />
                          {project.config.language === COMMON_STRINGS.EN ? t.englishLanguage : t.vietnamLanguage}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-center">
                        <span className="inline-flex items-center gap-1 text-slate-200 text-[10px] font-bold font-mono">
                          <Coins className="w-3.5 h-3.5 text-rose-500/80" />
                          {project.creditsUsed.toLocaleString()} {t.pts}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-xs text-slate-500 dark:text-slate-400 font-mono font-medium">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          <span>{dateStr}</span>
                        </div>
                      </td>

                      <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="primary"
                            size="xs"
                            onClick={() => onSelectProject(project)}
                            className="text-[10px] uppercase font-bold py-1.5 px-3 rounded-lg flex items-center gap-1 bg-rose-600 text-white shadow-sm hover:bg-rose-700 border border-transparent transition-all"
                          >
                            <PlayCircle className="w-3.5 h-3.5" />
                            <span>{t.Open}</span>
                            <ChevronRight className="w-3 h-3" />
                          </Button>

                          <Button
                            variant="ghost"
                            onClick={() => handleOpenEditTarget(project)}
                            className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-rose-500 hover:bg-slate-850 rounded-lg shadow-none"
                            title={t.editProject}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </Button>

                          <Button
                            variant="ghost"
                            onClick={() => setProjectToDelete(project)}
                            className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-red-500 hover:bg-slate-850 rounded-lg shadow-none"
                            title={t.delete}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        isOpen={!!projectToDelete}
        onClose={() => setProjectToDelete(null)}
        title={
          <div className="flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-rose-500" />
            <span className="font-bold text-slate-100">{t.Confirm_Deletion}</span>
          </div>
        }
      >
        <div className="p-6">
          <p className="text-slate-300 text-xs mb-4">
            {t.Are_you_sure_you_want_to_}
            <span className="font-bold text-slate-100 px-1">"{projectToDelete?.name}"</span>?
          </p>
          <p className="text-rose-500/80 text-[10px] font-bold uppercase tracking-wider">{t.This_action_cannot_be_und}</p>
          <div className="flex items-center justify-end gap-3 pt-6 mt-2">
            <Button variant="ghost" onClick={() => setProjectToDelete(null)} className="px-4 py-2 text-xs font-bold rounded-xl">
              {t.cancel}
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (projectToDelete) {
                  onDeleteProject(projectToDelete.id);
                  setProjectToDelete(null);
                }
              }}
              className="px-5 py-2 text-xs font-bold rounded-xl"
            >
              {t.delete}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={
          <div className="flex items-center gap-2">
            <Video className="w-5 h-5 text-rose-500" />
            <span className="font-bold text-slate-100">{editingId ? t.Edit_Project : t.newProject}</span>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-[9px] font-extrabold text-slate-400 font-mono uppercase block tracking-wider">{t.projectName} *</label>
            <input type="text" required placeholder={t.E_g_Legends_of_Rome} value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700/60 focus:border-rose-500/50 text-slate-900 dark:text-slate-200 rounded-xl p-3 text-xs focus:outline-none transition-all font-sans" />
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-extrabold text-slate-400 font-mono uppercase block tracking-wider">{t.projectDesc}</label>
            <textarea placeholder={t.Write_custom_script_idea_} value={desc} rows={3} onChange={(e) => setDesc(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700/60 focus:border-rose-500/50 text-slate-900 dark:text-slate-200 rounded-xl p-3 text-xs focus:outline-none transition-all resize-none font-sans" />
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-start gap-3 text-xs text-slate-450">
            <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div className="leading-relaxed text-[11px]">
              <span className="font-extrabold uppercase tracking-wider text-slate-300 text-[9px] block mb-1">{t.Niche_ideas}</span> {t.You_can_choice_History_Do}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <Button type="button" variant="ghost" onClick={() => setShowModal(false)} className="px-4 py-2 text-xs font-bold rounded-xl">
              {t.cancel}
            </Button>
            <Button type="submit" variant="primary" className="px-5 py-2 text-xs font-bold rounded-xl">
              {editingId ? t.Update : t.create}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
