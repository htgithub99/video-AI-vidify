import React, { useState } from "react";
import { Lang, translations } from "../lib/lang.js";
import { VideoProject } from "../types.js";
import { Plus, Video, Calendar, Trash2, Edit3, Film, Lightbulb, PlayCircle, Coins, Search, Globe, ChevronRight } from "lucide-react";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import { COMMON_STRINGS } from "../constants/index.js";

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
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [projectToDelete, setProjectToDelete] = useState<VideoProject | null>(null);

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [filterLang, setFilterLang] = useState<"all" | "vi" | "en">("all");
  const [filterGenre, setFilterGenre] = useState<string>("all");

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

  // Filter projects logic
  const filteredProjects = projects.filter((proj) => {
    const matchesSearch = proj.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (proj.description || "").toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesLang = filterLang === "all" ? true : proj.config.language.toLowerCase() === filterLang;
    const matchesGenre = filterGenre === "all" ? true : proj.config.genre === filterGenre;

    return matchesSearch && matchesLang && matchesGenre;
  });

  // Extract all available genres for filtering
  const genres = ["all", ...Array.from(new Set(projects.map((p) => p.config.genre).filter(Boolean)))];

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-sm">
        <div>
          <h2 className="text-base font-black tracking-tight text-slate-100 flex items-center gap-2 uppercase font-mono">
            <Film className="w-5 h-5 text-rose-500" />
            {t.projects}
          </h2>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed font-medium">
            {currentLang === "vi" ? "Quản lý và biên tập tất cả các dự án sản xuất video AI của bạn" : t.Synthesize_stories_design}
          </p>
        </div>
        <Button variant="primary" onClick={handleOpenCreateTarget} className="flex items-center gap-2 self-start md:self-auto px-5 py-2.5 bg-gradient-to-r from-rose-600 to-rose-500 text-white font-bold rounded-xl shadow-md shadow-rose-500/10">
          <Plus className="w-4 h-4" />
          {t.newProject}
        </Button>
      </div>

      {/* Filter Toolbar (Chips Style like YouTube Studio) */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-slate-900/50 border border-slate-800/80 p-4 rounded-2xl">
        {/* Chips and filters */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Language filter chips */}
          <button
            onClick={() => setFilterLang("all")}
            className={`px-3 py-1.5 text-[10px] uppercase font-bold rounded-lg transition-all ${
              filterLang === "all"
                ? "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                : "bg-slate-800/50 text-slate-400 border border-slate-700/60 hover:bg-slate-800"
            }`}
          >
            {currentLang === "vi" ? "Tất cả ngôn ngữ" : "All Languages"}
          </button>
          <button
            onClick={() => setFilterLang("vi")}
            className={`px-3 py-1.5 text-[10px] uppercase font-bold rounded-lg transition-all ${
              filterLang === "vi"
                ? "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                : "bg-slate-800/50 text-slate-400 border border-slate-700/60 hover:bg-slate-800"
            }`}
          >
            🇻🇳 Tiếng Việt
          </button>
          <button
            onClick={() => setFilterLang("en")}
            className={`px-3 py-1.5 text-[10px] uppercase font-bold rounded-lg transition-all ${
              filterLang === "en"
                ? "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                : "bg-slate-800/50 text-slate-400 border border-slate-700/60 hover:bg-slate-800"
            }`}
          >
            🇺🇸 English
          </button>

          {/* Genre filter select dropdown */}
          {genres.length > 2 && (
            <select
              value={filterGenre}
              onChange={(e) => setFilterGenre(e.target.value)}
              className="bg-slate-800/50 border border-slate-700/60 text-slate-400 rounded-lg px-2 py-1.5 text-[10px] font-bold outline-none focus:border-rose-500/50 transition-all uppercase"
            >
              <option value="all">{currentLang === "vi" ? "TẤT CẢ THỂ LOẠI" : "ALL GENRES"}</option>
              {genres.filter(g => g !== "all").map(g => (
                <option key={g} value={g}>{g.toUpperCase()}</option>
              ))}
            </select>
          )}
        </div>

        {/* Search Input bar */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={currentLang === "vi" ? "Tìm kiếm dự án..." : "Search projects..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-800 text-xs text-slate-200 pl-9 pr-4 py-2 rounded-xl focus:outline-none focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/50 transition-all font-sans"
          />
        </div>
      </div>

      {/* Main List content */}
      {filteredProjects.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/10 rounded-2xl border border-dashed border-slate-800 flex flex-col items-center justify-center p-6 space-y-4">
          <div className="p-4 bg-slate-900/50 rounded-full border border-slate-800">
            <Video className="w-8 h-8 text-slate-600" />
          </div>
          <p className="text-slate-400 text-xs font-semibold max-w-sm leading-relaxed">
            {projects.length === 0
              ? t.noProjects
              : (currentLang === "vi" ? "Không tìm thấy dự án phù hợp với bộ lọc." : "No projects matched your criteria.")}
          </p>
          <Button variant="ghost" onClick={handleOpenCreateTarget} className="flex items-center gap-2 text-rose-500 hover:text-rose-400 font-bold text-xs">
            <Plus className="w-4.5 h-4.5" />
            {t.createNew}
          </Button>
        </div>
      ) : (
        /* YouTube Studio style Table List view */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase font-black tracking-wider bg-slate-950/20">
                  <th className="py-4 px-6 min-w-[280px]">{currentLang === "vi" ? "Dự án video" : "Video Project"}</th>
                  <th className="py-4 px-4 text-center min-w-[100px]">{t.outputLang}</th>
                  <th className="py-4 px-4 text-center min-w-[120px]">{currentLang === "vi" ? "Tiêu hao" : "Credits"}</th>
                  <th className="py-4 px-4 min-w-[140px]">{currentLang === "vi" ? "Cập nhật lần cuối" : "Updated At"}</th>
                  <th className="py-4 px-6 text-right min-w-[150px]">{currentLang === "vi" ? "Hành động" : "Actions"}</th>
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
                      className="hover:bg-slate-800/20 cursor-pointer transition-all duration-150 group"
                    >
                      {/* Project info & thumbnail */}
                      <td className="py-4 px-6">
                        <div className="flex items-start gap-4">
                          {/* 16:9 Thumbnail preview box */}
                          <div className="w-28 aspect-video bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-center overflow-hidden shrink-0 relative group-hover:border-slate-700 transition-colors">
                            <Video className="w-6 h-6 text-slate-700 group-hover:text-rose-500/50 transition-colors" />
                            {project.config.genre && (
                              <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/70 text-[8px] font-bold font-mono text-white uppercase tracking-tighter shadow-sm">
                                {project.config.genre}
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

                      {/* Language cell */}
                      <td className="py-4 px-4 text-center">
                        <span className="inline-flex items-center gap-1 bg-slate-800/40 border border-slate-700/50 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-lg text-[9px] font-bold">
                          <Globe className="w-3 h-3 text-slate-500" />
                          {project.config.language === COMMON_STRINGS.EN ? t.englishLanguage : t.vietnamLanguage}
                        </span>
                      </td>

                      {/* Credits Used cell */}
                      <td className="py-4 px-4 text-center">
                        <span className="inline-flex items-center gap-1 text-slate-200 text-[10px] font-bold font-mono">
                          <Coins className="w-3.5 h-3.5 text-rose-500/80" />
                          {project.creditsUsed.toLocaleString()} {t.pts}
                        </span>
                      </td>

                      {/* Last updated date cell */}
                      <td className="py-4 px-4 text-xs text-slate-500 dark:text-slate-400 font-mono font-medium">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          <span>{dateStr}</span>
                        </div>
                      </td>

                      {/* Action buttons cell */}
                      <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="primary"
                            size="xs"
                            onClick={() => onSelectProject(project)}
                            className="text-[10px] uppercase font-bold py-1.5 px-3 rounded-lg flex items-center gap-1 bg-rose-600/10 text-rose-400 border border-rose-500/20 hover:bg-rose-600/20"
                          >
                            <PlayCircle className="w-3.5 h-3.5" />
                            <span>{t.Open}</span>
                            <ChevronRight className="w-3 h-3" />
                          </Button>

                          <Button
                            variant="ghost"
                            onClick={() => handleOpenEditTarget(project)}
                            className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-rose-500 hover:bg-slate-800 rounded-lg shadow-none"
                            title={t.editProject}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </Button>

                          <Button
                            variant="ghost"
                            onClick={() => setProjectToDelete(project)}
                            className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-red-500 hover:bg-slate-800 rounded-lg shadow-none"
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

      {/* Delete confirmation modal */}
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

      {/* Create / Edit Project modal */}
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
            <input type="text" required placeholder={t.E_g_Legends_of_Rome} value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-slate-800/80 border border-slate-700/60 focus:border-rose-500/50 text-slate-200 rounded-xl p-3 text-xs focus:outline-none transition-all font-sans" />
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-extrabold text-slate-400 font-mono uppercase block tracking-wider">{t.projectDesc}</label>
            <textarea placeholder={t.Write_custom_script_idea_} value={desc} rows={3} onChange={(e) => setDesc(e.target.value)} className="w-full bg-slate-800/80 border border-slate-700/60 focus:border-rose-500/50 text-slate-200 rounded-xl p-3 text-xs focus:outline-none transition-all resize-none font-sans" />
          </div>

          {/* AI Info Tip Box */}
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
