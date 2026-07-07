import React, { useState } from "react";
import { Lang, translations } from "../lib/lang.js";
import { VideoProject } from "../types.js";
import { Plus, Video, Calendar, Trash2, Edit3, Film, Lightbulb, PlayCircle, Coins } from "lucide-react";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";

interface ProjectListProps {
  currentLang: Lang;
  projects: VideoProject[];
  onSelectProject: (p: VideoProject) => void;
  onCreateProject: (name: string, desc: string) => void;
  onUpdateProject?: (id: string, name: string, desc: string) => void;
  onDeleteProject: (id: string) => void;
}

export default function ProjectList({ currentLang, projects, onSelectProject, onCreateProject, onUpdateProject, onDeleteProject }: ProjectListProps) {
  const t = translations[currentLang];
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [projectToDelete, setProjectToDelete] = useState<VideoProject | null>(null);

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

  return (
    <div className="space-y-6">
      {}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-sm">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <Film className="w-5 h-5 text-blue-500" />
            {t.projects}
          </h2>
          <p className="text-xs text-slate-400 mt-1 pr-4 leading-relaxed font-medium">{t.Synthesize_stories_design}</p>
        </div>
        <Button variant="primary" onClick={handleOpenCreateTarget} className="flex items-center gap-2 self-start sm:self-auto px-5 py-2.5">
          <Plus className="w-4 h-4" />
          {t.newProject}
        </Button>
      </div>

      {}
      {projects.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/30 rounded-xl border border-dashed border-slate-700 flex flex-col items-center justify-center p-6 space-y-4">
          <div className="p-4 bg-slate-900 rounded-full border border-slate-800">
            <Video className="w-8 h-8 text-slate-500" />
          </div>
          <p className="text-slate-400 max-w-md text-xs font-medium">{t.noProjects}</p>
          <Button variant="ghost" onClick={handleOpenCreateTarget} className="flex items-center gap-2 text-blue-500 hover:text-blue-400">
            <Plus className="w-4 h-4" />
            {t.createNew}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => {
            const dateStr = new Date(project.updatedAt).toLocaleDateString(t.en_US, {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div key={project.id} onClick={() => onSelectProject(project)} className="bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-700 hover:scale-[1.02] cursor-pointer transition-all duration-300 flex flex-col justify-between shadow-sm hover:shadow-md overflow-hidden group">
                {}
                <div className="h-1 bg-blue-500/80 w-1/4 rounded-br-full"></div>

                <div className="p-5 flex-1 space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-slate-100 text-sm tracking-tight group-hover:text-blue-400 transition-colors line-clamp-1">{project.name}</h3>
                    <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1 shrink-0">
                      <Coins className="w-3.5 h-3.5 text-blue-500/70" />
                      {project.creditsUsed} {t.pts}
                    </span>
                  </div>

                  <p className="text-slate-400 text-xs line-clamp-2 min-h-[2rem] leading-relaxed">{project.description || t.No_description_1}</p>

                  <div className="pt-4 border-t border-slate-800/50 flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] text-slate-500 font-medium">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{dateStr}</span>
                    </div>

                    <span className="bg-slate-800/50 text-slate-400 px-2 py-0.5 rounded-full text-[10px] font-medium">{project.config.genre || "Story"}</span>

                    <span className="bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded-full text-[10px] font-medium">{project.config.language === "en" ? "EN" : "VI"}</span>
                  </div>
                </div>

                {}
                <div className="bg-slate-900/50 px-5 py-3 border-t border-slate-800/50 flex items-center justify-between gap-2">
                  <Button
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectProject(project);
                    }}
                    className="flex items-center gap-2 text-xs text-blue-500 border-blue-500/30 hover:bg-blue-500/10"
                  >
                    <PlayCircle className="w-4 h-4" />
                    {t.Open}
                  </Button>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEditTarget(project);
                      }}
                      className="p-2 text-slate-400 hover:text-blue-500 hover:bg-slate-800/50"
                      title={t.editProject}
                    >
                      <Edit3 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        setProjectToDelete(project);
                      }}
                      className="p-2 text-slate-400 hover:text-rose-500 hover:bg-slate-800/50"
                      title={t.delete}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {}
      <Modal
        isOpen={!!projectToDelete}
        onClose={() => setProjectToDelete(null)}
        title={
          <div className="flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-rose-500" />
            <span>{t.Confirm_Deletion}</span>
          </div>
        }
      >
        <div className="p-6">
          <p className="text-slate-300 text-sm mb-4">
            {t.Are_you_sure_you_want_to_}
            <span className="font-bold text-white px-2">"{projectToDelete?.name}"</span>?
          </p>
          <p className="text-rose-400 text-xs font-medium">{t.This_action_cannot_be_und}</p>
          <div className="flex items-center justify-end gap-3 pt-6 mt-2">
            <Button variant="ghost" onClick={() => setProjectToDelete(null)} className="px-4 py-2">
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
              className="px-5 py-2"
            >
              {t.delete}
            </Button>
          </div>
        </div>
      </Modal>

      {}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={
          <div className="flex items-center gap-2">
            <Video className="w-5 h-5 text-blue-500" />
            <span>{editingId ? t.Edit_Project : t.newProject}</span>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 font-mono uppercase block tracking-wider">{t.projectName} *</label>
            <input type="text" required placeholder={t.E_g_Legends_of_Rome} value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-slate-800 border border-slate-700 focus:border-slate-500 text-slate-200 rounded-xl p-3 text-xs focus:outline-none transition-all font-sans" />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">{t.projectDesc}</label>
            <textarea placeholder={t.Write_custom_script_idea_} value={desc} rows={3} onChange={(e) => setDesc(e.target.value)} className="w-full bg-slate-800 border border-slate-700 focus:border-slate-500 text-slate-200 rounded-xl p-3 text-xs focus:outline-none transition-all resize-none font-sans" />
          </div>

          {}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-start gap-3 text-xs text-slate-400">
            <Lightbulb className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-bold uppercase tracking-wider text-slate-300 text-[10px] block mb-1">{t.Niche_ideas}</span> {t.You_can_choice_History_Do}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <Button type="button" variant="ghost" onClick={() => setShowModal(false)} className="px-4 py-2">
              {t.cancel}
            </Button>
            <Button type="submit" variant="primary" className="px-5 py-2 !bg-blue-600 hover:!bg-blue-500 shadow-blue-900/10">
              {editingId ? t.Update : t.create}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
