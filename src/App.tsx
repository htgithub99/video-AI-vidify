import {
  SOURCE_TEMPLATE_SYMBOL_86,
  SOURCE_TEMPLATE_SYMBOL_75,
  SOURCE_TEXT_APP_SHELL_H_SCREEN_W_SCREEN_MAX,
  SOURCE_TEXT_FLEX_1_MIN_W_0_H_FULL,
  SOURCE_TEXT_APP_MAIN_FLEX_1_MIN_H_0,
  SOURCE_TEXT_TAB_LOADING_OVERLAY_SELECT_NONE,
  SOURCE_TEXT_W_FULL_H_FULL_MIN_H_0,
  SOURCE_TEXT_HIDDEN,
  SOURCE_TEXT_W_FULL_H_FULL,
  SOURCE_TEMPLATE_AUTO,
  SOURCE_TEMPLATE_FILM,
  SOURCE_TEMPLATE_PARENT,
  SOURCE_TEMPLATE_SYMBOL,
  SOURCE_TEMPLATE_SYMBOL_2,
  SOURCE_TEMPLATE_SYMBOL_3,
  SOURCE_TEXT_AUTO,
  SOURCE_TEXT_CINEMATIC_AI_EPISODE,
  SOURCE_TEXT_CINEMATIC_PHOTOREAL,
  SOURCE_TEXT_FILM,
  SOURCE_TEXT_SINGLE,
  SOURCE_TEXT_TOP_RIGHT,
} from "./constants/sourceText.js";
import _ from "lodash";
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Toaster } from "sonner";
import AutoVideoGenerator from "./components/AutoVideoGenerator.tsx";
import CinematicFilmStudio from "./components/CinematicFilmStudio.tsx";
import DashboardView from "./components/DashboardView.tsx";
import FlowVideoCreator from "./components/FlowVideoCreator.tsx";
import Header from "./components/Header.tsx";
import MotionVideoCreator from "./components/MotionVideoCreator.tsx";
import MusicCreator from "./components/MusicCreator.tsx";
import MusicMixer from "./components/MusicMixer.tsx";
import ProjectList from "./components/ProjectList.tsx";
import SettingsView from "./components/SettingsView.tsx";
import ShortsExtractor from "./components/ShortsExtractor.tsx";
import Sidebar from "./components/Sidebar.tsx";
import { PageLoadingSpinner } from "./components/ui/Skeleton.tsx";
import VideoExporter from "./components/VideoExporter.tsx";
import { API_ROUTES, CINEMATIC_CONFIG, COMMON_STRINGS, CONTENT_TYPE_HEADER, CONTENT_TYPES, DEFAULT_PROJECT_CONFIGS, ERROR_MESSAGES, ErrorMessage, HTTP_METHODS, LOADING_CONFIG, PROJECT_LIST_CONSTANTS, REFACTOR_CONSTANTS, STORAGE_KEYS, STYLE_PRESET_CONFIG, THEME_VALUES } from "./constants";
import { AppTab, VideoGenre } from "./constants/enums";
import { jsonUtils } from "./lib/json";
import { Lang } from "./lib/lang.js";
import { appError, setLogLanguage } from "./lib/logger.js";
import { delayAsync, generateRandomString } from "./lib/shared-utils.js";
import { storageUtils } from "./lib/storage";
import { cn } from "./lib/utils";
import { AgeGroup, AspectRatio, AssetsMode, AudioType, Gender, GenerateType, HookPosition, ImageGenerationMode, ImageGeneratorEngine, ProjectInputType, ProjectKind, ProjectLanguage, PromptInputMethod, VideoProject } from "./types.js";
const INVALID_CACHE_VALUES = [COMMON_STRINGS.UNDEFINED, COMMON_STRINGS.NULL];
const ProxyManager = lazy(() => import("./components/ProxyManager.tsx"));
const getProjectKindForTab = (tab: string): ProjectKind | undefined => {
  if (_.isEqual(tab, AppTab.AUTO_GENERATOR)) return ProjectKind.Auto;
  if (_.isEqual(tab, AppTab.CINEMATIC_FILM)) return ProjectKind.Cinematic;
  return undefined;
};
const getWorkspaceProjectKind = (project?: VideoProject): ProjectKind | undefined => {
  if (!project) return undefined;
  if (project.projectKind) return project.projectKind;
  if (_.endsWith(project.name, COMMON_STRINGS.AUTO_CHILD_SUFFIX)) return ProjectKind.Auto;
  if (_.endsWith(project.name, COMMON_STRINGS.CINEMATIC_CHILD_SUFFIX)) return ProjectKind.Cinematic;
  return project.parentId ? undefined : ProjectKind.Container;
};
const findWorkspaceChild = (projects: VideoProject[], parentId: string, kind: ProjectKind): VideoProject | undefined => _.find(projects, (project) => _.isEqual(project.parentId, parentId) && _.isEqual(getWorkspaceProjectKind(project), kind));
const findProjectForWorkspaceTab = (projects: VideoProject[], selectedProjectId: string | null, tab: string): VideoProject | undefined => {
  const targetKind = getProjectKindForTab(tab);
  const selectedProject = _.find(projects, { id: selectedProjectId });
  if (!targetKind || !selectedProject) return undefined;
  if (_.isEqual(getWorkspaceProjectKind(selectedProject), targetKind)) return selectedProject;
  const parentId = selectedProject.parentId || selectedProject.id;
  return findWorkspaceChild(projects, parentId, targetKind);
};
const convertToSlug = (text: string): string => {
  return _.trim(
    _.toLower(text)
      .normalize(REFACTOR_CONSTANTS.VD_NORMALIZE_FORM)
      .replace(REFACTOR_CONSTANTS.VD_NORMALIZE_REGEX, REFACTOR_CONSTANTS.VD_EMPTY_STRING)
      .replace(REFACTOR_CONSTANTS.VD_SLUG_CHAR_REGEX, REFACTOR_CONSTANTS.VD_LETTER_D)
      .replace(REFACTOR_CONSTANTS.VD_SLUG_CLEAN_REGEX, REFACTOR_CONSTANTS.VD_EMPTY_STRING)
      .replace(REFACTOR_CONSTANTS.VD_SLUG_SPACE_REGEX, REFACTOR_CONSTANTS.VD_HYPHEN)
      .replace(REFACTOR_CONSTANTS.VD_SLUG_HYPHEN_REGEX, REFACTOR_CONSTANTS.VD_HYPHEN),
  ).substring(REFACTOR_CONSTANTS.ZERO, REFACTOR_CONSTANTS.VD_SLUG_LIMIT);
};
const createProjectRecord = async (project: VideoProject): Promise<VideoProject> => {
  const response = await fetch(API_ROUTES.PROJECTS, {
    method: HTTP_METHODS.POST,
    headers: { [CONTENT_TYPE_HEADER]: CONTENT_TYPES.JSON },
    body: jsonUtils.safeStringify(project),
    signal: AbortSignal.timeout(PROJECT_LIST_CONSTANTS.CREATE_REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(ERROR_MESSAGES.CREATING_PROJECT);
  const savedProject = jsonUtils.safeParse<VideoProject | null>(await response.text(), null);
  if (!savedProject) throw new Error(ERROR_MESSAGES.CREATING_PROJECT);
  return savedProject;
};
export default function App() {
  const [currentLang, setLang] = useState<Lang>(COMMON_STRINGS.VI);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>(() => {
    const savedTab = storageUtils.get(STORAGE_KEYS.ACTIVE_TAB);
    const isValidTab = !_.isEmpty(savedTab) && !_.includes(INVALID_CACHE_VALUES, savedTab);
    if (isValidTab) {
      return savedTab!;
    }
    const cachedProj = storageUtils.get(STORAGE_KEYS.SELECTED_PROJECT_ID);
    const isValidProj = !_.isEmpty(cachedProj) && !_.includes(INVALID_CACHE_VALUES, cachedProj);
    return isValidProj ? AppTab.AUTO_GENERATOR : AppTab.PROJECTS;
  });
  useEffect(() => {
    if (!_.isEmpty(activeTab) && !_.includes(INVALID_CACHE_VALUES, activeTab)) {
      storageUtils.set(STORAGE_KEYS.ACTIVE_TAB, activeTab);
    }
  }, [activeTab]);
  useEffect(() => {
    setLogLanguage(currentLang);
  }, [currentLang]);
  const [projects, setProjects] = useState<VideoProject[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const pendingSavesRef = useRef<Record<string, NodeJS.Timeout>>({});
  const projectsRef = useRef<VideoProject[]>([]);
  const creatingChildRef = useRef<Record<string, boolean>>({});
  useEffect(() => {
    projectsRef.current = projects;
  }, [projects]);
  useEffect(() => {
    return () => {
      _.forEach(_.toPairs(pendingSavesRef.current), ([id, timeout]) => {
        clearTimeout(timeout);
        const proj = _.find(projectsRef.current, { id });
        if (proj) {
          fetch(SOURCE_TEMPLATE_SYMBOL(SOURCE_TEMPLATE_SYMBOL_86(`${API_ROUTES.PROJECTS}`), SOURCE_TEMPLATE_SYMBOL_86(`${id}`)), {
            method: HTTP_METHODS.PUT,
            headers: { [CONTENT_TYPE_HEADER]: CONTENT_TYPES.JSON },
            body: jsonUtils.safeStringify(proj),
            keepalive: true,
          }).catch((error) => appError(ERROR_MESSAGES.FLUSH_SAVE_ON_UNMOUNT, error));
        }
      });
    };
  }, []);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(() => {
    const cached = storageUtils.get(STORAGE_KEYS.SELECTED_PROJECT_ID);
    return !cached || _.includes(INVALID_CACHE_VALUES, cached) ? null : cached;
  });
  useEffect(() => {
    if (selectedProjectId && !_.includes(INVALID_CACHE_VALUES, selectedProjectId)) {
      storageUtils.set(STORAGE_KEYS.SELECTED_PROJECT_ID, selectedProjectId);
    } else {
      storageUtils.remove(STORAGE_KEYS.SELECTED_PROJECT_ID);
    }
  }, [selectedProjectId]);
  const [theme, setTheme] = useState<"dark" | "light">(() => (storageUtils.get(STORAGE_KEYS.APP_THEME) as "dark" | "light") || THEME_VALUES.LIGHT);
  useEffect(() => {
    storageUtils.set(STORAGE_KEYS.APP_THEME, theme);
    if (_.isEqual(theme, THEME_VALUES.LIGHT)) {
      document.documentElement.classList.add(THEME_VALUES.LIGHT);
      document.documentElement.classList.remove(THEME_VALUES.DARK);
    } else {
      document.documentElement.classList.add(THEME_VALUES.DARK);
      document.documentElement.classList.remove(THEME_VALUES.LIGHT);
    }
  }, [theme]);
  const toggleTheme = () => {
    setTheme((prev) => (_.isEqual(prev, THEME_VALUES.DARK) ? THEME_VALUES.LIGHT : THEME_VALUES.DARK));
  };
  useEffect(() => {
    let active = true;
    let timerId: NodeJS.Timeout;
    const cachedId = storageUtils.get(STORAGE_KEYS.SELECTED_PROJECT_ID);
    const fetchProjects = fetch(API_ROUTES.PROJECTS).then(async (res) => {
      try {
        const text = await res.text();
        const trimmedText = _.trim(text);
        if (_.isEmpty(trimmedText) || _.includes(INVALID_CACHE_VALUES, trimmedText)) {
          return [];
        }
        const list = jsonUtils.safeParse<any[]>(text, []);
        if (cachedId && !_.includes(INVALID_CACHE_VALUES, cachedId)) {
          const hasProj = _.some(list, (p: any) => _.isEqual(p.id, cachedId));
          if (hasProj) {
            try {
              const detailRes = await fetch(SOURCE_TEMPLATE_SYMBOL(SOURCE_TEMPLATE_SYMBOL_86(`${API_ROUTES.PROJECTS}`), SOURCE_TEMPLATE_SYMBOL_86(`${cachedId}`)));
              if (detailRes.ok) {
                const detailText = await detailRes.text();
                const detailData = jsonUtils.safeParse(detailText, null);
                if (detailData) return _.map(list, (p: any) => (_.isEqual(p.id, cachedId) ? detailData : p));
              }
            } catch (e) {
              appError(ERROR_MESSAGES.FETCHING_PROJECTS, e);
            }
          }
        }
        return list;
      } catch (e) {
        appError(ERROR_MESSAGES.PARSING_PROJECTS, e);
        return [];
      }
    });
    const fontTimeout = delayAsync(LOADING_CONFIG.FONT_TIMEOUT_MS);
    const fontReady = document.fonts ? document.fonts.ready : Promise.resolve();
    const waitForFonts = Promise.race([fontReady, fontTimeout]);
    Promise.all([fetchProjects, waitForFonts])
      .then(([projectsData]) => {
        if (active && _.isArray(projectsData)) {
          setProjects(projectsData);
        }
      })
      .catch((err) => appError(ERROR_MESSAGES.FETCHING_PROJECTS, err))
      .finally(() => {
        if (active) {
          setIsLoadingProjects(false);
          const loader = document.getElementById(LOADING_CONFIG.ELEMENT_ID);
          if (loader) {
            loader.classList.add(LOADING_CONFIG.FADE_OUT_CLASS);
            timerId = setTimeout(() => {
              loader.remove();
            }, LOADING_CONFIG.REMOVE_DELAY_MS);
          }
        }
      });
    return () => {
      active = false;
      if (timerId) clearTimeout(timerId);
    };
  }, []);
  useEffect(() => {
    if (_.includes([AppTab.AUTO_GENERATOR, AppTab.CINEMATIC_FILM], activeTab as AppTab) && selectedProjectId) {
      const activeProj = _.find(projects, { id: selectedProjectId });
      if (activeProj) {
        const isFilmWorkspace = _.isEqual(activeTab, AppTab.CINEMATIC_FILM);
        const targetSuffix = isFilmWorkspace ? COMMON_STRINGS.CINEMATIC_CHILD_SUFFIX : COMMON_STRINGS.AUTO_CHILD_SUFFIX;
        if (!activeProj.parentId) {
          const targetKind = isFilmWorkspace ? ProjectKind.Cinematic : ProjectKind.Auto;
          const autoChild = findWorkspaceChild(projects, activeProj.id, targetKind);
          if (autoChild) setSelectedProjectId(autoChild.id);
          else {
            const childKey = _.join([activeProj.id, targetSuffix], REFACTOR_CONSTANTS.VD_EMPTY_STRING);
            if (creatingChildRef.current[childKey]) return;
            creatingChildRef.current[childKey] = true;
            const projectSlug = convertToSlug(activeProj.name || COMMON_STRINGS.PROJECT_DEFAULT_NAME);
            const randomStr = generateRandomString();
            const childId = SOURCE_TEMPLATE_SYMBOL_2(SOURCE_TEMPLATE_SYMBOL_86(`${COMMON_STRINGS.PROJECT_PREFIX}`), SOURCE_TEMPLATE_SYMBOL_86(`${projectSlug}`), SOURCE_TEMPLATE_SYMBOL_86(`${isFilmWorkspace ? SOURCE_TEXT_FILM : SOURCE_TEXT_AUTO}`), SOURCE_TEMPLATE_SYMBOL_86(`${randomStr}`));
            const childProject: VideoProject = {
              ...activeProj,
              id: childId,
              parentId: activeProj.id,
              projectKind: isFilmWorkspace ? ProjectKind.Cinematic : ProjectKind.Auto,
              name: SOURCE_TEMPLATE_SYMBOL_75(`${activeProj.name}`, `${targetSuffix}`),
              input: isFilmWorkspace ? { type: ProjectInputType.Idea, content: REFACTOR_CONSTANTS.VD_EMPTY_STRING } : activeProj.input,
              config: isFilmWorkspace
                ? {
                    ...activeProj.config,
                    genre: VideoGenre.CINEMATIC_EPISODE,
                    filmFormat: CINEMATIC_CONFIG.SERIES_MODE.SINGLE,
                    episodeCount: CINEMATIC_CONFIG.SINGLE_EPISODE_COUNT,
                    seriesBibleRequired: false,
                  }
                : activeProj.config,
              visualConfig: isFilmWorkspace
                ? {
                    ...activeProj.visualConfig,
                    style: STYLE_PRESET_CONFIG.CINEMATIC_PHOTOREAL_ID,
                    generationMode: ImageGenerationMode.LabsFlow,
                    generateType: GenerateType.Video,
                    imageGeneratorEngine: ImageGeneratorEngine.Veo3,
                  }
                : activeProj.visualConfig,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            fetch(API_ROUTES.PROJECTS, {
              method: HTTP_METHODS.POST,
              headers: { [CONTENT_TYPE_HEADER]: CONTENT_TYPES.JSON },
              body: jsonUtils.safeStringify(childProject),
            })
              .then((response) => {
                if (response.ok) {
                  setProjects((prev) => [...prev, childProject]);
                  setSelectedProjectId(childId);
                }
              })
              .catch((err) => appError(ERROR_MESSAGES.CREATING_PROJECT, err))
              .finally(() => {
                creatingChildRef.current[childKey] = false;
              });
          }
        } else if (!_.isEqual(getWorkspaceProjectKind(activeProj), isFilmWorkspace ? ProjectKind.Cinematic : ProjectKind.Auto)) {
          const autoChild = findWorkspaceChild(projects, activeProj.parentId, isFilmWorkspace ? ProjectKind.Cinematic : ProjectKind.Auto);
          if (autoChild) setSelectedProjectId(autoChild.id);
          else {
            setSelectedProjectId(_.some(projects, { id: activeProj.parentId }) ? activeProj.parentId : null);
          }
        }
      }
    }
  }, [activeTab, selectedProjectId, projects]);
  const handleSelectProject = useCallback(async (id: string | null) => {
    if (!id) {
      setSelectedProjectId(null);
      setActiveTab(AppTab.PROJECTS);
      return;
    }
    const project = _.find(projectsRef.current, { id });
    if (project && !project.input) {
      try {
        const res = await fetch(SOURCE_TEMPLATE_SYMBOL(SOURCE_TEMPLATE_SYMBOL_86(`${API_ROUTES.PROJECTS}`), SOURCE_TEMPLATE_SYMBOL_86(`${id}`)));
        if (!res.ok) throw new Error(ErrorMessage.PROJECT_LOAD_ERROR);
        const detailText = await res.text();
        const detailData = jsonUtils.safeParse(detailText, null);
        const resolvedProject = detailData || project;
        if (detailData) {
          setProjects((prev) => _.map(prev, (p) => (_.isEqual(p.id, id) ? detailData : p)));
          projectsRef.current = _.map(projectsRef.current, (p) => (_.isEqual(p.id, id) ? detailData : p));
        }
        const resolvedKind = getWorkspaceProjectKind(resolvedProject);
        const childProjects = _.filter(projectsRef.current, (candidate) => _.isEqual(candidate.parentId, id));
        const defaultChild = _.find(childProjects, (candidate) => _.isEqual(getWorkspaceProjectKind(candidate), ProjectKind.Auto)) || _.find(childProjects, (candidate) => _.isEqual(getWorkspaceProjectKind(candidate), ProjectKind.Cinematic));
        const targetProject = _.isEqual(resolvedKind, ProjectKind.Container) ? defaultChild : resolvedProject;
        const targetId = targetProject?.id || id;
        setSelectedProjectId(targetId);
        if (_.isEqual(getWorkspaceProjectKind(targetProject), ProjectKind.Cinematic)) {
          setActiveTab(AppTab.CINEMATIC_FILM);
        } else if (_.isEqual(getWorkspaceProjectKind(targetProject), ProjectKind.Auto)) {
          setActiveTab(AppTab.AUTO_GENERATOR);
        } else {
          setActiveTab(AppTab.PROJECTS);
        }
      } catch (err) {
        appError(ERROR_MESSAGES.FETCHING_PROJECTS, err);
      }
    } else {
      const projectKind = getWorkspaceProjectKind(project);
      const childProjects = _.filter(projectsRef.current, (candidate) => _.isEqual(candidate.parentId, id));
      const defaultChild = _.find(childProjects, (candidate) => _.isEqual(getWorkspaceProjectKind(candidate), ProjectKind.Auto)) || _.find(childProjects, (candidate) => _.isEqual(getWorkspaceProjectKind(candidate), ProjectKind.Cinematic));
      const targetProject = _.isEqual(projectKind, ProjectKind.Container) ? defaultChild : project;
      const targetId = targetProject?.id || id;
      setSelectedProjectId(targetId);
      if (_.isEqual(getWorkspaceProjectKind(targetProject), ProjectKind.Cinematic)) {
        setActiveTab(AppTab.CINEMATIC_FILM);
      } else if (_.isEqual(getWorkspaceProjectKind(targetProject), ProjectKind.Auto)) {
        setActiveTab(AppTab.AUTO_GENERATOR);
      } else {
        setActiveTab(AppTab.PROJECTS);
      }
    }
  }, []);
  const handleCreateProject = async (name: string, desc: string) => {
    const projectSlug = convertToSlug(name || COMMON_STRINGS.PROJECT_DEFAULT_NAME);
    const randomStr = () => generateRandomString();
    const parentId = SOURCE_TEMPLATE_PARENT(SOURCE_TEMPLATE_SYMBOL_86(`${COMMON_STRINGS.PROJECT_PREFIX}`), SOURCE_TEMPLATE_SYMBOL_86(`${projectSlug}`), SOURCE_TEMPLATE_SYMBOL_86(`${randomStr()}`));
    const parentProject: VideoProject = {
      id: parentId,
      projectKind: ProjectKind.Container,
      name: name,
      description: desc,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      input: {
        type: ProjectInputType.Script,
        content: REFACTOR_CONSTANTS.VD_EMPTY_STRING,
      },
      config: {
        genre: DEFAULT_PROJECT_CONFIGS.GENRE,
        language: currentLang as unknown as ProjectLanguage,
        duration: DEFAULT_PROJECT_CONFIGS.DURATION,
        rewriteLevel: 50,
        similarityReduction: 5,
        creativityLevel: 6,
        factCheck: true,
        audience: DEFAULT_PROJECT_CONFIGS.AUDIENCE,
        writingStyle: DEFAULT_PROJECT_CONFIGS.WRITING_STYLE,
      },
      hookConfig: {
        type: DEFAULT_PROJECT_CONFIGS.HOOK_TYPE,
        duration: 10,
        count: 3,
        positions: HookPosition.Start,
        versions: [],
      },
      voiceConfig: {
        provider: DEFAULT_PROJECT_CONFIGS.VOICE_PROVIDER,
        audioType: AudioType.TTS,
        gender: Gender.Male,
        age: AgeGroup.Adult,
        emotion: DEFAULT_PROJECT_CONFIGS.VOICE_EMOTION,
        speed: 1.0,
        pitch: 1.0,
        volume: 1.0,
        voiceURI: DEFAULT_PROJECT_CONFIGS.VOICE_URI,
      },
      visualConfig: {
        source: DEFAULT_PROJECT_CONFIGS.VISUAL_SOURCE,
        style: DEFAULT_PROJECT_CONFIGS.VISUAL_STYLE,
        quality: DEFAULT_PROJECT_CONFIGS.VISUAL_QUALITY,
        density: 5,
        characterConsistency: true,
        assetsMode: AssetsMode.Mixed,
        generationMode: ImageGenerationMode.GeminiChat,
        imageGeneratorEngine: ImageGeneratorEngine.LabsSandbox,
        generateType: GenerateType.Image,
        aspectRatio: AspectRatio.SixteenNine,
        promptInputMethod: PromptInputMethod.Paste,
        generateCount: 1,
      },
      creditsUsed: 0,
    };
    const autoChildId = SOURCE_TEMPLATE_AUTO(SOURCE_TEMPLATE_SYMBOL_86(`${COMMON_STRINGS.PROJECT_PREFIX}`), SOURCE_TEMPLATE_SYMBOL_86(`${projectSlug}`), SOURCE_TEMPLATE_SYMBOL_86(`${randomStr()}`));
    const autoChildProject: VideoProject = {
      ...parentProject,
      id: autoChildId,
      parentId: parentId,
      projectKind: ProjectKind.Auto,
      name: SOURCE_TEMPLATE_SYMBOL_75(`${parentProject.name}`, `${COMMON_STRINGS.AUTO_CHILD_SUFFIX}`),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const filmChildId = SOURCE_TEMPLATE_FILM(SOURCE_TEMPLATE_SYMBOL_86(`${COMMON_STRINGS.PROJECT_PREFIX}`), SOURCE_TEMPLATE_SYMBOL_86(`${projectSlug}`), SOURCE_TEMPLATE_SYMBOL_86(`${randomStr()}`));
    const filmChildProject: VideoProject = {
      ...parentProject,
      id: filmChildId,
      parentId,
      projectKind: ProjectKind.Cinematic,
      name: SOURCE_TEMPLATE_SYMBOL_75(`${parentProject.name}`, `${COMMON_STRINGS.CINEMATIC_CHILD_SUFFIX}`),
      input: { type: ProjectInputType.Idea, content: REFACTOR_CONSTANTS.VD_EMPTY_STRING },
      config: {
        ...parentProject.config,
        genre: SOURCE_TEXT_CINEMATIC_AI_EPISODE,
        filmFormat: SOURCE_TEXT_SINGLE,
        episodeCount: 1,
        seriesBibleRequired: false,
      },
      visualConfig: {
        ...parentProject.visualConfig,
        style: SOURCE_TEXT_CINEMATIC_PHOTOREAL,
        generationMode: ImageGenerationMode.LabsFlow,
        generateType: GenerateType.Video,
        imageGeneratorEngine: ImageGeneratorEngine.Veo3,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    try {
      const parentData = await createProjectRecord(parentProject);
      const [autoData, filmData] = await Promise.all([createProjectRecord(autoChildProject), createProjectRecord(filmChildProject)]);
      setProjects((prev) => [...prev, parentData, autoData, filmData]);
      setSelectedProjectId(parentData.id);
    } catch (e) {
      appError(ERROR_MESSAGES.CREATING_PROJECT, e);
      throw e;
    }
  };
  const handleUpdateProject = useCallback((updated: VideoProject, immediate = false) => {
    setProjects((prev) => {
      const exists = _.some(prev, { id: updated.id });
      if (exists) return _.map(prev, (p) => (_.isEqual(p.id, updated.id) ? updated : p));
      return [...prev, updated];
    });
    if (pendingSavesRef.current[updated.id]) clearTimeout(pendingSavesRef.current[updated.id]);
    const doSave = async () => {
      try {
        const response = await fetch(SOURCE_TEMPLATE_SYMBOL(SOURCE_TEMPLATE_SYMBOL_86(`${API_ROUTES.PROJECTS}`), SOURCE_TEMPLATE_SYMBOL_86(`${updated.id}`)), {
          method: HTTP_METHODS.PUT,
          headers: { [CONTENT_TYPE_HEADER]: CONTENT_TYPES.JSON },
          body: jsonUtils.safeStringify(updated),
        });
        if (!response.ok) {
          throw new Error(SOURCE_TEMPLATE_SYMBOL_3(SOURCE_TEMPLATE_SYMBOL_86(`${ERROR_MESSAGES.HTTP_ERROR_PREFIX}`), SOURCE_TEMPLATE_SYMBOL_86(`${response.status}`), SOURCE_TEMPLATE_SYMBOL_86(`${response.statusText}`)));
        }
        const savedProject = (await response.json()) as VideoProject;
        setProjects((prev) => _.map(prev, (project) => (_.isEqual(project.id, savedProject.id) ? savedProject : project)));
        delete pendingSavesRef.current[updated.id];
        return savedProject;
      } catch (e) {
        appError(ERROR_MESSAGES.AUTO_SAVE_ERR, e);
        return undefined;
      }
    };
    if (immediate) {
      delete pendingSavesRef.current[updated.id];
      return doSave();
    } else {
      pendingSavesRef.current[updated.id] = setTimeout(doSave, REFACTOR_CONSTANTS.SAVE_PROJECT_DELAY_MS);
      return Promise.resolve();
    }
  }, []);
  const handleDeleteProject = async (id: string) => {
    try {
      const res = await fetch(SOURCE_TEMPLATE_SYMBOL(SOURCE_TEMPLATE_SYMBOL_86(`${API_ROUTES.PROJECTS}`), SOURCE_TEMPLATE_SYMBOL_86(`${id}`)), { method: HTTP_METHODS.DELETE });
      if (res.ok) {
        setProjects((prev) => _.filter(prev, (p) => !_.isEqual(p.id, id)));
        if (_.isEqual(selectedProjectId, id)) {
          handleSelectProject(null);
        }
      }
    } catch (e) {
      appError(ERROR_MESSAGES.DELETING_PROJECT, e);
    }
  };
  const [isTabSwitching, setIsTabSwitching] = useState(false);
  const tabSwitchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeProject = _.find(projects, { id: selectedProjectId });
  const handleActiveTabChange = useCallback(
    (tab: string) => {
      if (_.isEqual(tab, activeTab)) {
        return;
      }
      if (tabSwitchTimerRef.current) {
        clearTimeout(tabSwitchTimerRef.current);
      }
      setIsTabSwitching(true);
      const targetWorkspaceProject = findProjectForWorkspaceTab(projectsRef.current, selectedProjectId, tab);
      if (_.includes([AppTab.PROJECTS, AppTab.DASHBOARD, AppTab.SETTINGS], tab as AppTab)) {
        setSelectedProjectId(null);
      } else if (_.isEqual(tab, AppTab.PROXY)) {
      } else if (targetWorkspaceProject) {
        setSelectedProjectId(targetWorkspaceProject.id);
      } else if (_.isEmpty(selectedProjectId) && !_.isEmpty(projectsRef.current)) {
        const fallbackProj = _.first(projectsRef.current);
        if (fallbackProj) setSelectedProjectId(fallbackProj.id);
      }
      setActiveTab(tab);
      tabSwitchTimerRef.current = setTimeout(() => {
        setIsTabSwitching(false);
      }, 500);
    },
    [activeTab, selectedProjectId],
  );
  useEffect(() => {
    return () => {
      if (tabSwitchTimerRef.current) {
        clearTimeout(tabSwitchTimerRef.current);
      }
    };
  }, []);
  const handleUpdateProjectDetails = async (id: string, name: string, description: string) => {
    const projToUpdate = _.find(projects, { id });
    if (!projToUpdate) return;
    const updated = { ...projToUpdate, name, description, updatedAt: new Date().toISOString() };
    setProjects((prev) => _.map(prev, (p) => (_.isEqual(p.id, id) ? updated : p)));
    try {
      const res = await fetch(SOURCE_TEMPLATE_SYMBOL(SOURCE_TEMPLATE_SYMBOL_86(`${API_ROUTES.PROJECTS}`), SOURCE_TEMPLATE_SYMBOL_86(`${id}`)), {
        method: HTTP_METHODS.PUT,
        headers: { [CONTENT_TYPE_HEADER]: CONTENT_TYPES.JSON },
        body: jsonUtils.safeStringify(updated),
      });
      if (res.ok) {
        const text = await res.text();
        const savedProject = jsonUtils.safeParse(text, null);
        if (savedProject) setProjects((prev) => _.map(prev, (p) => (_.isEqual(p.id, id) ? savedProject : p)));
      } else {
        setProjects((prev) => _.map(prev, (p) => (_.isEqual(p.id, id) ? projToUpdate : p)));
        appError(_.join([ERROR_MESSAGES.UPDATING_PROJECT, res.status], REFACTOR_CONSTANTS.VD_BLANK));
      }
    } catch (e) {
      setProjects((prev) => _.map(prev, (p) => (_.isEqual(p.id, id) ? projToUpdate : p)));
      appError(ERROR_MESSAGES.UPDATING_PROJECT, e);
    }
  };
  return (
    <div className={cn(SOURCE_TEXT_APP_SHELL_H_SCREEN_W_SCREEN_MAX)}>
      <Sidebar currentLang={currentLang} activeTab={activeTab} setActiveTab={handleActiveTabChange} selectedProjectId={selectedProjectId} activeProjectName={activeProject?.name || null} theme={theme as any} toggleTheme={toggleTheme} isMobileOpen={isMobileMenuOpen} onCloseMobile={() => setIsMobileMenuOpen(false)} />
      <div className={cn(SOURCE_TEXT_FLEX_1_MIN_W_0_H_FULL)}>
        <Header currentLang={currentLang} setLang={setLang} theme={theme as any} toggleTheme={toggleTheme} isMobileMenuOpen={isMobileMenuOpen} onToggleMobileMenu={() => setIsMobileMenuOpen((open) => !open)} />
        <Toaster position={SOURCE_TEXT_TOP_RIGHT} theme={theme as any} richColors />
        <main className={cn(SOURCE_TEXT_APP_MAIN_FLEX_1_MIN_H_0)}>
          {isTabSwitching && (
            <div className={cn(SOURCE_TEXT_TAB_LOADING_OVERLAY_SELECT_NONE)}>
              <PageLoadingSpinner />
            </div>
          )}
          <div className={cn(SOURCE_TEXT_W_FULL_H_FULL_MIN_H_0, !_.isEqual(activeTab, AppTab.DASHBOARD) && SOURCE_TEXT_HIDDEN)}>
            <DashboardView currentLang={currentLang} projects={projects} isLoading={isLoadingProjects} onSelectProject={handleSelectProject} onNavigateToProjects={() => handleActiveTabChange(AppTab.PROJECTS)} />
          </div>
          <div className={cn(SOURCE_TEXT_W_FULL_H_FULL_MIN_H_0, !_.isEqual(activeTab, AppTab.PROJECTS) && SOURCE_TEXT_HIDDEN)}>
            <div className={cn(SOURCE_TEXT_W_FULL_H_FULL_MIN_H_0)}>
              <ProjectList currentLang={currentLang} projects={projects} isLoading={isLoadingProjects} onSelectProject={(project) => handleSelectProject(project.id)} onCreateProject={handleCreateProject} onUpdateProject={handleUpdateProjectDetails} onDeleteProject={handleDeleteProject} />
            </div>
          </div>
          <div className={cn(SOURCE_TEXT_W_FULL_H_FULL_MIN_H_0, !_.isEqual(activeTab, AppTab.AUTO_GENERATOR) && SOURCE_TEXT_HIDDEN)}>
            <AutoVideoGenerator currentLang={currentLang} projects={projects} selectedProjectId={selectedProjectId} onSelectProject={handleSelectProject} onCreateProject={handleCreateProject} onUpdateProject={handleUpdateProject} theme={theme as any} />
          </div>
          <div className={cn(SOURCE_TEXT_W_FULL_H_FULL_MIN_H_0, !_.isEqual(activeTab, AppTab.CINEMATIC_FILM) && SOURCE_TEXT_HIDDEN)}>
            <CinematicFilmStudio currentLang={currentLang} projects={projects} selectedProjectId={selectedProjectId} onSelectProject={handleSelectProject} onCreateProject={handleCreateProject} onUpdateProject={handleUpdateProject} theme={theme as any} />
          </div>
          {_.isEqual(activeTab, AppTab.MUSIC_CREATOR) && (
            <div className={cn(SOURCE_TEXT_W_FULL_H_FULL_MIN_H_0)}>
              <MusicCreator currentLang={currentLang} />
            </div>
          )}
          {_.isEqual(activeTab, AppTab.PROXY) && (
            <div className={SOURCE_TEXT_W_FULL_H_FULL_MIN_H_0}>
              <Suspense fallback={<PageLoadingSpinner className={SOURCE_TEXT_W_FULL_H_FULL} />}>
                <ProxyManager currentLang={currentLang} />
              </Suspense>
            </div>
          )}
          {_.isEqual(activeTab, AppTab.MUSIC_MIXER) && (
            <div className={cn(SOURCE_TEXT_W_FULL_H_FULL_MIN_H_0)}>
              <MusicMixer currentLang={currentLang} />
            </div>
          )}
          {_.isEqual(activeTab, AppTab.VIDEO_CREATOR) && (
            <div className={cn(SOURCE_TEXT_W_FULL_H_FULL_MIN_H_0)}>
              <FlowVideoCreator currentLang={currentLang} projects={projects} selectedProjectId={selectedProjectId} />
            </div>
          )}
          {_.isEqual(activeTab, AppTab.SHORTS_EXTRACTOR) && (
            <div className={cn(SOURCE_TEXT_W_FULL_H_FULL_MIN_H_0)}>
              <ShortsExtractor currentLang={currentLang} />
            </div>
          )}
          {_.isEqual(activeTab, AppTab.VIDEO_EXPORT) && (
            <div className={cn(SOURCE_TEXT_W_FULL_H_FULL_MIN_H_0)}>
              <VideoExporter currentLang={currentLang} />
            </div>
          )}
          {_.isEqual(activeTab, AppTab.MOTION_VIDEO) && (
            <div className={cn(SOURCE_TEXT_W_FULL_H_FULL_MIN_H_0)}>
              <MotionVideoCreator currentLang={currentLang} />
            </div>
          )}
          {_.isEqual(activeTab, AppTab.SETTINGS) && (
            <div className={cn(SOURCE_TEXT_W_FULL_H_FULL_MIN_H_0)}>
              <SettingsView currentLang={currentLang} isLoading={isLoadingProjects} />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
