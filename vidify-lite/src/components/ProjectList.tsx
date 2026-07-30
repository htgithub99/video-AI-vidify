import { cn } from "../lib/utils";
import React, { useState } from "react";
import { Lang, translations } from "../lib/lang.js";
import { VideoProject } from "../types.js";
import { Plus, Video, Calendar, Trash2, Edit3, Film, Lightbulb, PlayCircle, Coins, Search, Globe, ChevronRight, ChevronDown, Layers, Image, Mic } from "lucide-react";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import { COMMON_STRINGS, ERROR_MESSAGES } from "../constants/index.js";
import _ from "lodash";
import { appError } from "../lib/logger.js";
import { delayAsync } from "../lib/shared-utils.js";
import { PROJECT_LIST_TEXTS, PROJECT_LIST_CONSTANTS, SortOrder } from "../constants/index.js";
import { useLicense } from "../contexts/LicenseContext";

const getGenreLabel = (genre: string, lang: Lang) => {
  const labels = PROJECT_LIST_TEXTS[lang].genreLabels;
  return labels[genre] || genre;
};

interface ProjectListProps {
  currentLang: Lang;
  projects: VideoProject[];
  onSelectProject: (p: VideoProject) => void;
  onCreateProject: (name: string, desc: string) => Promise<void> | void;
  onUpdateProject?: (id: string, name: string, desc: string) => Promise<void> | void;
  onDeleteProject: (id: string) => Promise<void> | void;
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
  const localT = PROJECT_LIST_TEXTS[currentLang];
  const { licenseInfo } = useLicense();
  const limitVideo = licenseInfo?.limits?.video ?? 0;
  const limitImage = licenseInfo?.limits?.image ?? 0;
  const limitVoice = licenseInfo?.limits?.voice ?? 0;
  const isUnlimited = licenseInfo?.limits?.unlimited ?? false;

  const [showModal, setShowModal] = useState(false);
  const [expandedParentIds, setExpandedParentIds] = useState<Record<string, boolean>>({});
  const [isLoadingAction, setIsLoadingAction] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [projectToDelete, setProjectToDelete] = useState<VideoProject | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterLang, setFilterLang] = useState<string>(PROJECT_LIST_CONSTANTS.FILTER_ALL);
  const [filterGenre, setFilterGenre] = useState<string>(PROJECT_LIST_CONSTANTS.FILTER_ALL);
  const [currentPage, setCurrentPage] = useState(1);

  React.useEffect(() => {
    setCurrentPage(PROJECT_LIST_CONSTANTS.PAGE_ONE);
  }, [searchQuery, filterLang, filterGenre]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoadingAction(true);
    setShowModal(false);

    try {
      await delayAsync(PROJECT_LIST_CONSTANTS.SLEEP_DURATION_MS);

      if (editingId && onUpdateProject) {
        await onUpdateProject(editingId, name, desc);
      } else {
        await onCreateProject(name, desc);
      }
    } catch (err) {
      appError(ERROR_MESSAGES.UPDATING_PROJECT, err);
    } finally {
      setIsLoadingAction(false);
      setName("");
      setDesc("");
      setEditingId(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!projectToDelete) return;
    setIsLoadingAction(true);
    const idToDelete = projectToDelete.id;
    setProjectToDelete(null);
    try {
      await delayAsync(PROJECT_LIST_CONSTANTS.SLEEP_DURATION_MS);
      await onDeleteProject(idToDelete);
    } catch (err) {
      appError(ERROR_MESSAGES.DELETING_PROJECT, err);
    } finally {
      setIsLoadingAction(false);
    }
  };

  const searchLower = _.toLower(searchQuery);

  const filteredProjects = _.orderBy(
    _.filter(projects, (proj) => {
      if (proj.parentId) return false;
      const matchesSearch = _.some([proj.name, proj.description || ""], (text) =>
        _.includes(_.toLower(text), searchLower)
      );
      const matchesLang = _.isEqual(filterLang, PROJECT_LIST_CONSTANTS.FILTER_ALL) || _.isEqual(_.toLower(proj.config.language), filterLang);
      const matchesGenre = _.isEqual(filterGenre, PROJECT_LIST_CONSTANTS.FILTER_ALL) || _.isEqual(proj.config.genre, filterGenre);

      return _.every([matchesSearch, matchesLang, matchesGenre], Boolean);
    }),
    [(p) => new Date(p.updatedAt || 0).getTime()],
    [SortOrder.DESC]
  );

  const totalPages = _.max([PROJECT_LIST_CONSTANTS.PAGE_ONE, _.ceil(filteredProjects.length / PROJECT_LIST_CONSTANTS.ITEMS_PER_PAGE)]) as number;
  const validCurrentPage = _.min([currentPage, totalPages]) as number;

  if (!_.isEqual(validCurrentPage, currentPage)) {
    setCurrentPage(validCurrentPage);
  }

  const paginatedProjects = _.slice(
    filteredProjects,
    (validCurrentPage - PROJECT_LIST_CONSTANTS.PAGE_ONE) * PROJECT_LIST_CONSTANTS.ITEMS_PER_PAGE,
    validCurrentPage * PROJECT_LIST_CONSTANTS.ITEMS_PER_PAGE
  );

  const availableGenres = [PROJECT_LIST_CONSTANTS.FILTER_ALL, ...Array.from(new Set(_.filter(_.map(projects, 'config.genre'), Boolean)))];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-sm">
        <div>
          <h2 className="text-base font-black tracking-tight text-slate-100 flex items-center gap-2 uppercase font-mono">
            <Film className="w-5 h-5 text-rose-500" />
            {t.projects}
          </h2>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed font-medium">
            {_.isEqual(currentLang, PROJECT_LIST_CONSTANTS.LANG_VI) ? localT.desc : t.Synthesize_stories_design || localT.desc}
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
            onClick={() => setFilterLang(PROJECT_LIST_CONSTANTS.FILTER_ALL)}
            className={cn(`px-3 py-1.5 text-[10px] uppercase font-bold rounded-lg transition-all ${_.isEqual(filterLang, PROJECT_LIST_CONSTANTS.FILTER_ALL)
                ? "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                : "bg-slate-950 text-slate-400 border border-slate-700/60 hover:bg-slate-850"
              }`)}
          >
            {localT.allLangs}
          </button>
          <button
            onClick={() => setFilterLang(PROJECT_LIST_CONSTANTS.LANG_VI)}
            className={cn(`px-3 py-1.5 text-[10px] uppercase font-bold rounded-lg transition-all ${_.isEqual(filterLang, PROJECT_LIST_CONSTANTS.LANG_VI)
                ? "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                : "bg-slate-950 text-slate-400 border border-slate-700/60 hover:bg-slate-850"
              }`)}
          >
            {localT.viBtn}
          </button>
          <button
            onClick={() => setFilterLang(PROJECT_LIST_CONSTANTS.LANG_EN)}
            className={cn(`px-3 py-1.5 text-[10px] uppercase font-bold rounded-lg transition-all ${_.isEqual(filterLang, PROJECT_LIST_CONSTANTS.LANG_EN)
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
              <option value={PROJECT_LIST_CONSTANTS.FILTER_ALL}>{localT.allGenres}</option>
              {_.map(_.filter(availableGenres, (g) => !_.isEqual(g, PROJECT_LIST_CONSTANTS.FILTER_ALL)), (g) => (
                <option key={g} value={g}>{_.toUpper(getGenreLabel(g, currentLang))}</option>
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

      {isLoadingAction ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-sm overflow-hidden animate-pulse">
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
                {_.map([1, 2, 3], (i) => (
                  <tr key={i} className="border-b border-slate-800/60">
                    <td className="py-4 px-6">
                      <div className="flex items-start gap-4">
                        <div className="w-24 h-14 bg-slate-800/50 rounded shrink-0"></div>
                        <div className="space-y-2 w-full mt-1">
                          <div className="h-3.5 bg-slate-800 rounded w-1/3"></div>
                          <div className="h-3 bg-slate-800/60 rounded w-2/3"></div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="inline-flex h-5 w-16 bg-slate-800/60 rounded-lg mx-auto"></div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="inline-flex h-4.5 w-12 bg-slate-800/60 rounded mx-auto"></div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1.5">
                        <div className="w-3.5 h-3.5 bg-slate-800/60 rounded-full"></div>
                        <div className="h-3 bg-slate-800/60 rounded w-24"></div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <div className="h-7 w-20 bg-slate-800/60 rounded-lg"></div>
                        <div className="h-7 w-7 bg-slate-800/60 rounded-lg"></div>
                        <div className="h-7 w-7 bg-slate-800/60 rounded-lg"></div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : filteredProjects.length === 0 ? (
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
                {paginatedProjects.map((project) => {
                  const dateStr = new Date(project.updatedAt).toLocaleDateString(t.en_US, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  const imagesCount = _.filter(project.storyboard || [], (scene) => scene.assetType === "image" && !_.isEmpty(scene.assetUrl)).length;
                  const videosCount = _.filter(project.storyboard || [], (scene) => scene.assetType === "video" && !_.isEmpty(scene.assetUrl)).length;
                  const voiceCount = _.sumBy(project.storyboard || [], (scene) => (scene.script || scene.subtitle || "").length);

                  const children = _.filter(projects, { parentId: project.id });
                  const hasChildren = children.length > 0;

                  return (
                    <React.Fragment key={project.id}>
                      <tr
                        onClick={() => onSelectProject(project)}
                        className="group hover:bg-slate-850 cursor-pointer transition-colors duration-200"
                      >
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-4">
                            {hasChildren && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedParentIds((prev) => ({ ...prev, [project.id]: !prev[project.id] }));
                                }}
                                className="p-1 hover:bg-slate-800 rounded transition-colors text-slate-400 hover:text-slate-100 shrink-0"
                              >
                                {expandedParentIds[project.id] ? (
                                  <ChevronDown className="w-4 h-4 text-rose-500" />
                                ) : (
                                  <ChevronRight className="w-4 h-4 text-slate-400" />
                                )}
                              </button>
                            )}
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

                      <td className="py-4 px-4">
                        <div className="flex items-center justify-center gap-4 text-xs font-mono font-bold select-none">
                          {/* Video */}
                          <div className="flex items-center gap-1.5" title={localT.videoTooltip}>
                            <Video className="w-4 h-4 text-blue-500" />
                            <span className="text-slate-400">
                              <strong className="text-blue-400">{videosCount}</strong>
                              <span className="mx-0.5 text-slate-600">/</span>
                              {isUnlimited ? "∞" : limitVideo.toLocaleString()}
                            </span>
                          </div>

                          {/* Image */}
                          <div className="flex items-center gap-1.5" title={localT.imageTooltip}>
                            <Image className="w-4 h-4 text-emerald-500" />
                            <span className="text-slate-400">
                              <strong className="text-emerald-400">{imagesCount}</strong>
                              <span className="mx-0.5 text-slate-600">/</span>
                              {isUnlimited ? "∞" : limitImage.toLocaleString()}
                            </span>
                          </div>

                          {/* Voice */}
                          <div className="flex items-center gap-1.5" title={localT.voiceTooltip}>
                            <Mic className="w-4 h-4 text-amber-500" />
                            <span className="text-slate-400">
                              <strong className="text-amber-400">{voiceCount.toLocaleString()}</strong>
                              <span className="mx-0.5 text-slate-600">/</span>
                              {isUnlimited ? "∞" : limitVoice.toLocaleString()}
                            </span>
                          </div>
                        </div>
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
                    {expandedParentIds[project.id] && hasChildren && (
                      <tr className="bg-slate-950/20 border-b border-slate-800/60" onClick={(e) => e.stopPropagation()}>
                        <td colSpan={5} className="py-3 px-6 bg-slate-950/10">
                          <div className="space-y-2 pl-6 border-l-2 border-rose-500/30 ml-4 py-1">
                            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 font-mono flex items-center gap-1 select-none">
                              <Layers className="w-3.5 h-3.5 text-rose-500/60" />
                              {localT.linkedChildProjects}
                            </h4>
                            <div className="grid gap-2">
                              {children.map((child) => (
                                <div
                                  key={child.id}
                                  onClick={() => onSelectProject(child)}
                                  className="flex items-center justify-between p-3 bg-slate-900/60 hover:bg-slate-850/80 border border-slate-800/80 rounded-xl cursor-pointer transition-all duration-200 group/child shadow-sm"
                                >
                                  <div className="flex items-center gap-3">
                                    <PlayCircle className="w-4 h-4 text-rose-500/70 group-hover/child:text-rose-500 transition-colors" />
                                    <div className="flex flex-col gap-0.5">
                                      <span className="text-xs font-bold text-slate-200 group-hover/child:text-rose-400 transition-colors">
                                        {child.name}
                                      </span>
                                      <span className="text-[9px] text-slate-500 font-medium font-mono">
                                        Cập nhật: {new Date(child.updatedAt).toLocaleString(t.en_US, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                    <Button
                                      variant="primary"
                                      size="xs"
                                      onClick={() => onSelectProject(child)}
                                      className="text-[9px] uppercase font-bold py-1 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 shadow-sm transition-all"
                                    >
                                      {t.Open}
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      onClick={() => setProjectToDelete(child)}
                                      className="p-1.5 text-slate-500 hover:text-red-500 hover:bg-slate-800 rounded-lg transition-colors"
                                      title={t.delete}
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-slate-800 bg-slate-900/50">
              <div className="text-[10px] text-slate-500 font-medium font-mono">
                {localT.showing} {((validCurrentPage - PROJECT_LIST_CONSTANTS.PAGE_ONE) * PROJECT_LIST_CONSTANTS.ITEMS_PER_PAGE) + PROJECT_LIST_CONSTANTS.PAGE_ONE} {PROJECT_LIST_CONSTANTS.DASH_DELIMITER} {_.min([validCurrentPage * PROJECT_LIST_CONSTANTS.ITEMS_PER_PAGE, filteredProjects.length])} {PROJECT_LIST_CONSTANTS.PAGINATION_DELIMITER} {filteredProjects.length}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  onClick={() => setCurrentPage(prev => _.max([prev - 1, 1]) as number)}
                  disabled={_.isEqual(validCurrentPage, PROJECT_LIST_CONSTANTS.PAGE_ONE)}
                  className={cn(
                    "px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all",
                    _.isEqual(validCurrentPage, PROJECT_LIST_CONSTANTS.PAGE_ONE)
                      ? "text-slate-600 cursor-not-allowed bg-slate-900"
                      : "text-slate-400 bg-slate-800/50 hover:bg-slate-800 hover:text-white"
                  )}
                >
                  {t.Previous}
                </Button>
                <div className="text-[10px] text-slate-400 font-bold font-mono px-2">
                  {validCurrentPage} {PROJECT_LIST_CONSTANTS.PAGINATION_DELIMITER} {totalPages}
                </div>
                <Button
                  variant="ghost"
                  onClick={() => setCurrentPage(prev => _.min([prev + 1, totalPages]) as number)}
                  disabled={_.isEqual(validCurrentPage, totalPages)}
                  className={cn(
                    "px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all",
                    _.isEqual(validCurrentPage, totalPages)
                      ? "text-slate-600 cursor-not-allowed bg-slate-900"
                      : "text-slate-400 bg-slate-800/50 hover:bg-slate-800 hover:text-white"
                  )}
                >
                  {t.Next}
                </Button>
              </div>
            </div>
          )}
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
              onClick={handleDeleteConfirm}
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
