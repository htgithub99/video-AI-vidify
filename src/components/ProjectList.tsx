import { cn } from "../lib/utils";
import React, { useState } from "react";
import { Lang, translations } from "../lib/lang.js";
import { VideoProject, GenerateType } from "../types.js";
import { Plus, Video, Calendar, Trash2, Edit3, Film, Lightbulb, PlayCircle, Search, Globe, ChevronRight, ChevronDown, Layers, Image, Mic } from "lucide-react";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import { ProjectTableSkeleton, ProjectListSkeleton } from "./ui/Skeleton";
import { COMMON_STRINGS, ERROR_MESSAGES, REFACTOR_CONSTANTS, PROJECT_LIST_TEXTS, PROJECT_LIST_CONSTANTS, SortOrder } from "../constants/index.js";
import _ from "lodash";
import { appError } from "../lib/logger.js";
import { delayAsync } from "../lib/shared-utils.js";
import { useLicense } from "../contexts/LicenseContext";

const getGenreLabel = (genre: string, lang: Lang) => {
  const labels = PROJECT_LIST_TEXTS[lang].genreLabels;
  return labels[genre] || genre;
};

interface ProjectListProps {
  currentLang: Lang;
  projects: VideoProject[];
  isLoading?: boolean;
  onSelectProject: (p: VideoProject) => void;
  onCreateProject: (name: string, desc: string) => Promise<void> | void;
  onUpdateProject?: (id: string, name: string, desc: string) => Promise<void> | void;
  onDeleteProject: (id: string) => Promise<void> | void;
}

export default function ProjectList({ currentLang, projects, isLoading = false, onSelectProject, onCreateProject, onUpdateProject, onDeleteProject }: ProjectListProps) {
  const t = translations[currentLang];
  const localT = PROJECT_LIST_TEXTS[currentLang];
  const { licenseInfo, refetchLicense } = useLicense();
  const limitVideo = _.defaultTo(licenseInfo?.limits?.video, 0);
  const limitImage = _.defaultTo(licenseInfo?.limits?.image, 0);
  const limitVoice = _.defaultTo(licenseInfo?.limits?.voice, 0);
  const isUnlimited = _.defaultTo(licenseInfo?.limits?.unlimited, false);

  const [showModal, setShowModal] = useState(false);
  const [expandedParentIds, setExpandedParentIds] = useState<Record<string, boolean>>({});
  const [isLoadingAction, setIsLoadingAction] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [openingProjectId, setOpeningProjectId] = useState<string | null>(null);
  const [name, setName] = useState<string>(REFACTOR_CONSTANTS.VD_EMPTY_STRING);
  const [desc, setDesc] = useState<string>(REFACTOR_CONSTANTS.VD_EMPTY_STRING);
  const [projectToDelete, setProjectToDelete] = useState<VideoProject | null>(null);

  const [searchQuery, setSearchQuery] = useState<string>(REFACTOR_CONSTANTS.VD_EMPTY_STRING);
  const [filterLang, setFilterLang] = useState<string>(PROJECT_LIST_CONSTANTS.FILTER_ALL);
  const [filterGenre, setFilterGenre] = useState<string>(PROJECT_LIST_CONSTANTS.FILTER_ALL);
  const [currentPage, setCurrentPage] = useState(1);

  React.useEffect(() => {
    refetchLicense?.();
  }, []);

  React.useEffect(() => {
    setCurrentPage(PROJECT_LIST_CONSTANTS.PAGE_ONE);
  }, [searchQuery, filterLang, filterGenre]);

  const handleOpenCreateTarget = () => {
    setEditingId(null);
    setName(REFACTOR_CONSTANTS.VD_EMPTY_STRING);
    setDesc(REFACTOR_CONSTANTS.VD_EMPTY_STRING);
    setShowModal(true);
  };

  const handleOpenEditTarget = (p: VideoProject) => {
    setEditingId(p.id);
    setName(p.name);
    setDesc(p.description || REFACTOR_CONSTANTS.VD_EMPTY_STRING);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsLoadingAction(true);
    setShowModal(false);

    try {
      await delayAsync(PROJECT_LIST_CONSTANTS.SLEEP_DURATION_MS);

      if (editingId && onUpdateProject) await onUpdateProject(editingId, name, desc);
      else {
        await onCreateProject(name, desc);
      }
    } catch (err) {
      appError(ERROR_MESSAGES.UPDATING_PROJECT, err);
    } finally {
      setIsLoadingAction(false);
      setName(REFACTOR_CONSTANTS.VD_EMPTY_STRING);
      setDesc(REFACTOR_CONSTANTS.VD_EMPTY_STRING);
      setEditingId(null);
    }
  };

  const handleOpenProject = async (project: VideoProject) => {
    setOpeningProjectId(project.id);
    try {
      await onSelectProject(project);
    } finally {
      setOpeningProjectId(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!projectToDelete) return;
    setIsLoadingAction(true);
    const idToDelete = projectToDelete.id;
    try {
      await delayAsync(PROJECT_LIST_CONSTANTS.SLEEP_DURATION_MS);
      await onDeleteProject(idToDelete);
      setProjectToDelete(null);
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
      const matchesSearch = _.some([proj.name, proj.description || REFACTOR_CONSTANTS.VD_EMPTY_STRING], (text) => _.includes(_.toLower(text), searchLower));
      const matchesLang = _.isEqual(filterLang, PROJECT_LIST_CONSTANTS.FILTER_ALL) || _.isEqual(_.toLower(proj.config.language), filterLang);
      const matchesGenre = _.isEqual(filterGenre, PROJECT_LIST_CONSTANTS.FILTER_ALL) || _.isEqual(proj.config.genre, filterGenre);

      return _.every([matchesSearch, matchesLang, matchesGenre], Boolean);
    }),
    [(p) => new Date(p.updatedAt || 0).getTime()],
    [SortOrder.DESC],
  );

  const totalPages = _.max([PROJECT_LIST_CONSTANTS.PAGE_ONE, _.ceil(filteredProjects.length / PROJECT_LIST_CONSTANTS.ITEMS_PER_PAGE)]) as number;
  const safeCurrentPage = _.clamp(currentPage, 1, totalPages);
  const paginatedProjects = _.slice(filteredProjects, (safeCurrentPage - 1) * PROJECT_LIST_CONSTANTS.ITEMS_PER_PAGE, safeCurrentPage * PROJECT_LIST_CONSTANTS.ITEMS_PER_PAGE);
  const availableGenres: string[] = [
    PROJECT_LIST_CONSTANTS.FILTER_ALL,
    ...Array.from(new Set<string>(_.compact(_.map(projects, (p) => p.config?.genre)))),
  ];

  if (isLoading && projects.length === 0) {
    return <ProjectListSkeleton />;
  }

  return (
    <div className={cn("w-full h-full min-h-full flex-1 flex flex-col space-y-6")}>
      <div className={cn("flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-6 sm:p-7 rounded-3xl shadow-lg relative overflow-hidden")}>
        <div className={cn("absolute top-0 right-0 w-80 h-80 bg-rose-500/5 rounded-full blur-3xl pointer-events-none")} />
        <div className={cn("relative z-10 space-y-1")}>
          <h2 className={cn("text-xl font-extrabold tracking-tight text-slate-100 flex items-center gap-2.5 font-logo")}>
            <div className={cn("p-2 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400")}>
              <Film className={cn("w-5 h-5")} />
            </div>
            {t.projects}
          </h2>
          <p className={cn("text-xs text-slate-400 leading-relaxed font-medium")}>
            {_.isEqual(currentLang, PROJECT_LIST_CONSTANTS.LANG_VI) ? localT.desc : t.Synthesize_stories_design || localT.desc}
          </p>
        </div>
        <Button
          variant={REFACTOR_CONSTANTS.VARIANT_PRIMARY}
          onClick={handleOpenCreateTarget}
          className={cn("flex items-center gap-2 self-start md:self-auto px-5 py-2.5 rounded-2xl font-bold shadow-md shadow-rose-600/20")}>
          <Plus className={cn("w-4 h-4")} />
          {t.newProject}
        </Button>
      </div>

      <div className={cn("flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between glass-card p-4 rounded-2xl")}>
        <div className={cn("flex flex-wrap items-center gap-2 w-full sm:w-auto")}>
          <button
            onClick={() => setFilterLang(PROJECT_LIST_CONSTANTS.FILTER_ALL)}
            className={cn(
              "px-4 py-2 h-10 text-xs font-bold rounded-xl transition-colors cursor-pointer select-none border flex items-center justify-center",
              _.isEqual(filterLang, PROJECT_LIST_CONSTANTS.FILTER_ALL)
                ? "bg-rose-600 border-rose-500 text-white shadow-sm shadow-rose-600/30"
                : "bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-850",
            )}>
            {localT.allLangs}
          </button>
          <button
            onClick={() => setFilterLang(PROJECT_LIST_CONSTANTS.LANG_VI)}
            className={cn(
              "px-4 py-2 h-10 text-xs font-bold rounded-xl transition-colors cursor-pointer select-none border flex items-center justify-center",
              _.isEqual(filterLang, PROJECT_LIST_CONSTANTS.LANG_VI)
                ? "bg-rose-600 border-rose-500 text-white shadow-sm shadow-rose-600/30"
                : "bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-850",
            )}>
            {localT.viBtn}
          </button>
          <button
            onClick={() => setFilterLang(PROJECT_LIST_CONSTANTS.LANG_EN)}
            className={cn(
              "px-4 py-2 h-10 text-xs font-bold rounded-xl transition-colors cursor-pointer select-none border flex items-center justify-center",
              _.isEqual(filterLang, PROJECT_LIST_CONSTANTS.LANG_EN)
                ? "bg-rose-600 border-rose-500 text-white shadow-sm shadow-rose-600/30"
                : "bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-850",
            )}>
            {localT.enBtn}
          </button>

          {availableGenres.length > 2 && (
            <select
              value={filterGenre}
              onChange={(e) => setFilterGenre(e.target.value)}
              className={cn(
                "bg-slate-900/90 border border-slate-800 text-slate-300 rounded-xl px-3 h-10 text-xs font-bold outline-none hover:border-slate-700 transition-all flex items-center",
              )}>
              <option value={PROJECT_LIST_CONSTANTS.FILTER_ALL}>{localT.allGenres}</option>
              {_.map(
                _.filter(availableGenres, (g: string) => !_.isEqual(g, PROJECT_LIST_CONSTANTS.FILTER_ALL)),
                (g: string) => (
                  <option key={g} value={g}>
                    {getGenreLabel(g, currentLang)}
                  </option>
                ),
              )}
            </select>
          )}
        </div>

        <div className={cn("relative w-full sm:w-72")}>
          <Search className={cn("w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2")} />
          <input
            type={REFACTOR_CONSTANTS.INPUT_TYPE_TEXT}
            placeholder={localT.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(
              "w-full h-10 bg-slate-950/80 border border-slate-800 text-xs text-slate-100 pl-9 pr-4 py-2 rounded-xl focus:outline-none focus:border-rose-500/80 transition-all font-sans",
            )}
          />
        </div>
      </div>

      {isLoading || isLoadingAction ? (
        <ProjectTableSkeleton rows={4} />
      ) : filteredProjects.length === 0 ? (
        <div className={cn("text-center py-20 glass-card rounded-3xl border border-dashed border-slate-800 flex flex-col items-center justify-center p-8 space-y-4")}>
          <div className={cn("p-4 bg-slate-900/90 rounded-2xl border border-slate-800 text-rose-500 shadow-inner")}>
            <Video className={cn("w-8 h-8")} />
          </div>
          <p className={cn("text-slate-400 text-xs font-semibold max-w-sm leading-relaxed")}>{projects.length === 0 ? t.noProjects : localT.noProjectsMatch}</p>
          <Button variant={REFACTOR_CONSTANTS.VARIANT_PRIMARY} onClick={handleOpenCreateTarget} className={cn("flex items-center gap-2 font-bold text-xs rounded-xl")}>
            <Plus className={cn("w-4 h-4")} />
            {t.createNew}
          </Button>
        </div>
      ) : (
        <div className={cn("glass-card rounded-3xl shadow-lg overflow-hidden border border-slate-800/80")}>
          <div className={cn("overflow-x-auto")}>
            <table className={cn("project-table w-full border-collapse text-left")}>
              <thead>
                <tr className={cn("border-b border-slate-800 text-[11px] font-mono text-slate-400 uppercase font-black tracking-wider bg-slate-955/60")}>
                  <th className={cn("py-4 px-6 min-w-[280px]")}>{localT.colVideoProject}</th>
                  <th className={cn("py-4 px-4 text-center min-w-[100px]")}>{t.outputLang}</th>
                  <th className={cn("py-4 px-4 text-center min-w-[120px]")}>{localT.colCredits}</th>
                  <th className={cn("py-4 px-4 min-w-[140px]")}>{localT.colUpdatedAt}</th>
                  <th className={cn("py-4 px-6 text-right min-w-[150px]")}>{localT.colActions}</th>
                </tr>
              </thead>
              <tbody className={cn("divide-y divide-slate-800/60")}>
                {paginatedProjects.map((project) => {
                  const dateStr = new Date(project.updatedAt).toLocaleDateString(t.en_US, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  const children = _.filter(projects, { parentId: project.id });
                  const hasChildren = children.length > 0;

                  const allRelatedProjects = [project, ...children];
                  let imagesCount = 0;
                  let videosCount = 0;
                  let voiceCount = 0;

                  _.forEach(allRelatedProjects, (p) => {
                    const sb = _.defaultTo(p.storyboard, []);
                    imagesCount += _.filter(
                      sb,
                      (scene) => (!scene.assetType || _.isEqual(scene.assetType, GenerateType.Image)) && (!_.isEmpty(scene.assetUrl) || !_.isEmpty(scene.assetUrls)),
                    ).length;
                    videosCount += _.filter(sb, (scene) => _.isEqual(scene.assetType, GenerateType.Video) && (!_.isEmpty(scene.assetUrl) || !_.isEmpty(scene.assetUrls))).length;
                    voiceCount += _.sumBy(sb, (scene) => (scene.script || scene.subtitle || REFACTOR_CONSTANTS.VD_EMPTY_STRING).length);
                  });

                  const usedVideos = videosCount;
                  const usedImages = imagesCount;
                  const usedVoice = voiceCount;

                  return (
                    <React.Fragment key={project.id}>
                      <tr onClick={() => onSelectProject(project)} className={cn("group hover:bg-slate-850/70 cursor-pointer transition-colors duration-200")}>
                        <td className={cn("py-4 px-6")}>
                          <div className={cn("flex items-center gap-4")}>
                            <div className={cn("w-6 shrink-0 flex items-center justify-center")}>
                              {hasChildren && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setExpandedParentIds((prev) => ({ ...prev, [project.id]: !prev[project.id] }));
                                  }}
                                  className={cn("p-1.5 hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-slate-100 shrink-0")}>
                                  {expandedParentIds[project.id] ? (
                                    <ChevronDown className={cn("w-4 h-4 text-rose-500")} />
                                  ) : (
                                    <ChevronRight className={cn("w-4 h-4 text-slate-400")} />
                                  )}
                                </button>
                              )}
                            </div>
                            <div
                              className={cn(
                                "w-14 h-14 bg-slate-950/90 border border-slate-800 rounded-2xl flex items-center justify-center shrink-0 group-hover:border-rose-500/40 transition-colors shadow-inner",
                              )}>
                              <Video className={cn("w-6 h-6 text-slate-500 group-hover:text-rose-500 transition-colors")} />
                            </div>
                            <div className={cn("space-y-1 min-w-0 flex-1")}>
                              <div className={cn("flex items-center gap-2 min-w-0")}>
                                <h3
                                  className={cn("font-extrabold text-slate-100 text-xs tracking-tight group-hover:text-rose-400 transition-colors truncate")}
                                  title={project.name}>
                                  {project.name}
                                </h3>
                              </div>
                              <p className={cn("text-slate-400 text-[11px] font-medium truncate leading-relaxed max-w-md")} title={project.description || t.No_description_1}>
                                {project.description || t.No_description_1}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className={cn("py-4 px-4 text-center whitespace-nowrap")}>
                          <span
                            className={cn("inline-flex items-center gap-1 bg-slate-900/80 border border-slate-800 text-slate-300 px-2.5 py-1 rounded-xl text-[10px] font-bold")}>
                            <Globe className={cn("w-3 h-3 text-sky-400")} />
                            {project.config.language === COMMON_STRINGS.EN ? t.englishLanguage : t.vietnamLanguage}
                          </span>
                        </td>

                        <td className={cn("py-4 px-4 whitespace-nowrap")}>
                          <div className={cn("flex items-center justify-center gap-4 text-xs font-mono font-bold select-none whitespace-nowrap")}>
                            <div className={cn("flex items-center gap-1.5 shrink-0")} title={localT.videoTooltip}>
                              <Video className={cn("w-4 h-4 text-blue-400 shrink-0")} />
                              <span className={cn("text-slate-400 whitespace-nowrap")}>
                                <strong className={cn("text-blue-400")}>{usedVideos}</strong>
                                <span className={cn("mx-0.5 text-slate-600")}>{REFACTOR_CONSTANTS.VD_SLASH}</span>
                                {isUnlimited ? REFACTOR_CONSTANTS.SYMBOL_INFINITY : limitVideo.toLocaleString()}
                              </span>
                            </div>

                            <div className={cn("flex items-center gap-1.5 shrink-0")} title={localT.imageTooltip}>
                              <Image className={cn("w-4 h-4 text-emerald-400 shrink-0")} />
                              <span className={cn("text-slate-400 whitespace-nowrap")}>
                                <strong className={cn("text-emerald-400")}>{usedImages}</strong>
                                <span className={cn("mx-0.5 text-slate-600")}>{REFACTOR_CONSTANTS.VD_SLASH}</span>
                                {isUnlimited ? REFACTOR_CONSTANTS.SYMBOL_INFINITY : limitImage.toLocaleString()}
                              </span>
                            </div>

                            <div className={cn("flex items-center gap-1.5 shrink-0")} title={localT.voiceTooltip}>
                              <Mic className={cn("w-4 h-4 text-amber-400 shrink-0")} />
                              <span className={cn("text-slate-400 whitespace-nowrap")}>
                                <strong className={cn("text-amber-400")}>{usedVoice.toLocaleString()}</strong>
                                <span className={cn("mx-0.5 text-slate-600")}>{REFACTOR_CONSTANTS.VD_SLASH}</span>
                                {isUnlimited ? REFACTOR_CONSTANTS.SYMBOL_INFINITY : limitVoice.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className={cn("py-4 px-4 text-xs text-slate-400 font-mono font-medium whitespace-nowrap")}>
                          <div className={cn("flex items-center gap-1.5 whitespace-nowrap")}>
                            <Calendar className={cn("w-3.5 h-3.5 text-slate-500 shrink-0")} />
                            <span className={cn("whitespace-nowrap")}>{dateStr}</span>
                          </div>
                        </td>

                        <td className={cn("py-4 px-6 text-right")} onClick={(e) => e.stopPropagation()}>
                          <div className={cn("flex items-center justify-end gap-2")}>
                            <Button
                              variant={REFACTOR_CONSTANTS.VARIANT_PRIMARY}
                              size={REFACTOR_CONSTANTS.SIZE_XS}
                              isLoading={openingProjectId === project.id}
                              onClick={() => handleOpenProject(project)}
                              className={cn("text-[10px] font-bold py-1.5 px-3 rounded-xl flex items-center gap-1 shadow-sm")}>
                              <PlayCircle className={cn("w-3.5 h-3.5")} />
                              <span>{t.Open}</span>
                              <ChevronRight className={cn("w-3 h-3")} />
                            </Button>

                            <Button
                              variant={REFACTOR_CONSTANTS.VARIANT_GHOST}
                              onClick={() => handleOpenEditTarget(project)}
                              className={cn("p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 rounded-xl")}
                              title={t.editProject}>
                              <Edit3 className={cn("w-3.5 h-3.5")} />
                            </Button>

                            <Button
                              variant={REFACTOR_CONSTANTS.VARIANT_GHOST}
                              onClick={() => setProjectToDelete(project)}
                              className={cn("p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl")}
                              title={t.delete}>
                              <Trash2 className={cn("w-3.5 h-3.5")} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                      {expandedParentIds[project.id] && hasChildren && (
                        <tr className={cn("bg-slate-950/40 border-b border-slate-800/60")} onClick={(e) => e.stopPropagation()}>
                          <td colSpan={5} className={cn("py-3 px-6")}>
                            <div className={cn("space-y-2 pl-6 border-l-2 border-rose-500/30 ml-4 py-1")}>
                              <h4 className={cn("text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 font-mono flex items-center gap-1 select-none")}>
                                <Layers className={cn("w-3.5 h-3.5 text-rose-500/60")} />
                                {localT.linkedChildProjects}
                              </h4>
                              <div className={cn("grid gap-2")}>
                                {children.map((child) => (
                                  <div
                                    key={child.id}
                                    onClick={() => onSelectProject(child)}
                                    className={cn(
                                      "flex items-center justify-between p-3 bg-slate-900/80 hover:bg-slate-850 border border-slate-800 rounded-2xl cursor-pointer transition-all duration-200 group/child shadow-sm",
                                    )}>
                                    <div className={cn("flex items-center gap-3")}>
                                      <PlayCircle className={cn("w-4 h-4 text-rose-500/70 group-hover/child:text-rose-500 transition-colors")} />
                                      <div className={cn("flex flex-col gap-0.5")}>
                                        <span className={cn("text-xs font-bold text-slate-200 group-hover/child:text-rose-400 transition-colors")}>{child.name}</span>
                                        <span className={cn("text-[9px] text-slate-500 font-medium font-mono")}>
                                          {localT.updatedPrefix}:{" "}
                                          {new Date(child.updatedAt).toLocaleString(t.en_US, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                                        </span>
                                      </div>
                                    </div>
                                    <div className={cn("flex items-center gap-2")} onClick={(e) => e.stopPropagation()}>
                                      <Button
                                        variant={REFACTOR_CONSTANTS.VARIANT_PRIMARY}
                                        size={REFACTOR_CONSTANTS.SIZE_XS}
                                        isLoading={openingProjectId === child.id}
                                        onClick={() => handleOpenProject(child)}
                                        className={cn("text-[9px] font-bold py-1 px-3 rounded-xl shadow-sm")}>
                                        {t.Open}
                                      </Button>
                                      <Button
                                        variant={REFACTOR_CONSTANTS.VARIANT_GHOST}
                                        onClick={() => setProjectToDelete(child)}
                                        className={cn("p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl")}
                                        title={t.delete}>
                                        <Trash2 className={cn("w-3.5 h-3.5")} />
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
            <div className={cn("flex items-center justify-between p-4 border-t border-slate-800/80 bg-slate-950/40")}>
              <div className={cn("text-[11px] text-slate-400 font-medium font-mono")}>
                {localT.showing} {(safeCurrentPage - PROJECT_LIST_CONSTANTS.PAGE_ONE) * PROJECT_LIST_CONSTANTS.ITEMS_PER_PAGE + PROJECT_LIST_CONSTANTS.PAGE_ONE}{" "}
                {PROJECT_LIST_CONSTANTS.DASH_DELIMITER} {_.min([safeCurrentPage * PROJECT_LIST_CONSTANTS.ITEMS_PER_PAGE, filteredProjects.length])}{" "}
                {PROJECT_LIST_CONSTANTS.PAGINATION_DELIMITER} {filteredProjects.length}
              </div>
              <div className={cn("flex items-center gap-2")}>
                <Button
                  variant={REFACTOR_CONSTANTS.VARIANT_GHOST}
                  onClick={() => setCurrentPage((prev) => _.max([prev - 1, 1]) as number)}
                  disabled={_.isEqual(safeCurrentPage, PROJECT_LIST_CONSTANTS.PAGE_ONE)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-bold rounded-xl transition-all",
                    _.isEqual(safeCurrentPage, PROJECT_LIST_CONSTANTS.PAGE_ONE)
                      ? "text-slate-600 cursor-not-allowed"
                      : "text-slate-300 bg-slate-900 border border-slate-800 hover:bg-slate-850 hover:text-white",
                  )}>
                  {t.Previous}
                </Button>
                <div className={cn("text-xs text-slate-300 font-bold font-mono px-3 py-1 rounded-xl bg-slate-900 border border-slate-800")}>
                  {safeCurrentPage} / {totalPages}
                </div>
                <Button
                  variant={REFACTOR_CONSTANTS.VARIANT_GHOST}
                  onClick={() => setCurrentPage((prev) => _.min([prev + 1, totalPages]) as number)}
                  disabled={_.isEqual(safeCurrentPage, totalPages)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-bold rounded-xl transition-all",
                    _.isEqual(safeCurrentPage, totalPages)
                      ? "text-slate-600 cursor-not-allowed"
                      : "text-slate-300 bg-slate-900 border border-slate-800 hover:bg-slate-850 hover:text-white",
                  )}>
                  {t.Next}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <Modal
        isOpen={!!projectToDelete}
        onClose={() => {
          if (!isLoadingAction) setProjectToDelete(null);
        }}
        maxWidth="max-w-md"
        title={
          <div className={cn("flex items-center gap-2")}>
            <Trash2 className={cn("w-4 h-4 text-rose-500")} />
            <span>{t.Confirm_Deletion}</span>
          </div>
        }>
        <div className={cn("space-y-4")}>
          <p className={cn("text-slate-300 text-xs leading-relaxed")}>
            {t.Are_you_sure_you_want_to_}
            <span className={cn("font-bold text-slate-100 px-1")}>"{projectToDelete?.name}"</span>?
          </p>
          <div className={cn("p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold leading-relaxed")}>{t.This_action_cannot_be_und}</div>
          <div className={cn("flex items-center justify-end gap-2.5 pt-4 border-t border-slate-800")}>
            <Button
              variant={REFACTOR_CONSTANTS.VARIANT_GHOST}
              disabled={isLoadingAction}
              onClick={() => setProjectToDelete(null)}
              className={cn("px-4 py-2 text-xs font-bold rounded-xl")}>
              {t.cancel}
            </Button>
            <Button variant={REFACTOR_CONSTANTS.VARIANT_DANGER} isLoading={isLoadingAction} onClick={handleDeleteConfirm} className={cn("px-5 py-2 text-xs font-bold rounded-xl")}>
              {t.delete}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        maxWidth="max-w-lg"
        title={
          <div className={cn("flex items-center gap-2")}>
            <Video className={cn("w-4 h-4 text-rose-500")} />
            <span>{editingId ? t.Edit_Project : t.newProject}</span>
          </div>
        }>
        <form onSubmit={handleSubmit} className={cn("space-y-4")}>
          <div className={cn("space-y-1.5")}>
            <label className={cn("text-[10px] font-extrabold text-slate-300 font-mono uppercase block tracking-wider")}>{t.projectName} *</label>
            <input
              type={REFACTOR_CONSTANTS.INPUT_TYPE_TEXT}
              required
              placeholder={t.E_g_Legends_of_Rome}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={cn(
                "w-full h-10 bg-slate-955 border border-slate-800 focus:border-rose-500 text-slate-100 rounded-xl px-3 text-xs focus:outline-none transition-all font-sans",
              )}
            />
          </div>

          <div className={cn("space-y-1.5")}>
            <label className={cn("text-[10px] font-extrabold text-slate-300 font-mono uppercase block tracking-wider")}>{t.projectDesc}</label>
            <textarea
              placeholder={t.Write_custom_script_idea_}
              value={desc}
              rows={3}
              onChange={(e) => setDesc(e.target.value)}
              className={cn(
                "w-full bg-slate-950 border border-slate-800 focus:border-rose-500 text-slate-100 rounded-xl p-3 text-xs focus:outline-none transition-all resize-none font-sans",
              )}
            />
          </div>

          <div className={cn("bg-slate-950/80 border border-slate-800 p-4 rounded-2xl flex items-start gap-3 text-xs text-slate-300")}>
            <Lightbulb className={cn("w-4 h-4 text-amber-400 shrink-0 mt-0.5")} />
            <div className={cn("leading-relaxed text-[11px]")}>
              <span className={cn("font-extrabold uppercase tracking-wider text-amber-400 text-[10px] block mb-0.5")}>{t.Niche_ideas}</span> {t.You_can_choice_History_Do}
            </div>
          </div>

          <div className={cn("flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800")}>
            <Button
              type={REFACTOR_CONSTANTS.BUTTON_TYPE_BUTTON}
              variant={REFACTOR_CONSTANTS.VARIANT_GHOST}
              onClick={() => setShowModal(false)}
              className={cn("px-4 py-2 text-xs font-bold rounded-xl")}>
              {t.cancel}
            </Button>
            <Button
              type={REFACTOR_CONSTANTS.BUTTON_TYPE_SUBMIT}
              variant={REFACTOR_CONSTANTS.VARIANT_PRIMARY}
              isLoading={isLoadingAction}
              className={cn("px-5 py-2 text-xs font-bold rounded-xl")}>
              {editingId ? t.Update : t.create}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
