import { ErrorMessage } from "./constants";
import { lazy, Suspense, useState, useEffect, useRef, useCallback } from "react";
import { Toaster } from "sonner";
import Header from "./components/Header.tsx";
import Sidebar from "./components/Sidebar.tsx";
import ProjectList from "./components/ProjectList.tsx";
import SettingsView from "./components/SettingsView.tsx";
import DashboardView from "./components/DashboardView.tsx";
import TabContentLoading from "./components/TabContentLoading.tsx";

import { VideoProject, ProjectInputType, ProjectKind, ProjectLanguage, HookPosition, AudioType, Gender, AgeGroup, AssetsMode, ImageGeneratorEngine, GenerateType, PromptInputMethod, AspectRatio } from "./types.js";
import { Lang } from "./lib/lang.js";
import { appError, setLogLanguage } from "./lib/logger.js";
import { API_ROUTES, STORAGE_KEYS, LOADING_CONFIG, TAB_CONTENT_LOADING_CONFIG, HTTP_METHODS, CONTENT_TYPES, ERROR_MESSAGES, CONTENT_TYPE_HEADER, THEME_VALUES, COMMON_STRINGS, DEFAULT_PROJECT_CONFIGS, REFACTOR_CONSTANTS, PROJECT_LIST_CONSTANTS } from "./constants";
import { AppTab } from "./constants/enums";
import _ from "lodash";
import { delayAsync, generateRandomString } from "./lib/shared-utils.js";
import { jsonUtils } from "./lib/json";
import { storageUtils } from "./lib/storage";

const INVALID_CACHE_VALUES = [COMMON_STRINGS.UNDEFINED, COMMON_STRINGS.NULL];
const PROJECT_WORKSPACE_TABS = [AppTab.AUTO_GENERATOR, AppTab.STUDIO];
const PipelineWizard = lazy(() => import("./components/PipelineWizard.tsx"));
const AutoVideoGenerator = lazy(() => import("./components/AutoVideoGenerator.tsx"));

const isProjectWorkspaceTab = (tab: string): boolean => _.includes(PROJECT_WORKSPACE_TABS, tab as AppTab);

const convertToSlug = (text: string): string => {
  return _.trim(
    _.toLower(text)
      .normalize(REFACTOR_CONSTANTS.VD_NORMALIZE_FORM)
      .replace(REFACTOR_CONSTANTS.VD_NORMALIZE_REGEX, REFACTOR_CONSTANTS.VD_EMPTY_STRING)
      .replace(REFACTOR_CONSTANTS.VD_SLUG_CHAR_REGEX, REFACTOR_CONSTANTS.VD_LETTER_D)
      .replace(REFACTOR_CONSTANTS.VD_SLUG_CLEAN_REGEX, REFACTOR_CONSTANTS.VD_EMPTY_STRING)
      .replace(REFACTOR_CONSTANTS.VD_SLUG_SPACE_REGEX, REFACTOR_CONSTANTS.VD_HYPHEN)
      .replace(REFACTOR_CONSTANTS.VD_SLUG_HYPHEN_REGEX, REFACTOR_CONSTANTS.VD_HYPHEN)
  ).substring(REFACTOR_CONSTANTS.ZERO, REFACTOR_CONSTANTS.VD_SLUG_LIMIT);
};

const isProjectReadyForTab = (project: VideoProject | undefined, tab: string): boolean => _.some([_.every([_.isEqual(tab, AppTab.AUTO_GENERATOR), _.some([_.isEqual(project?.projectKind, ProjectKind.Auto), _.endsWith(project?.name, COMMON_STRINGS.AUTO_CHILD_SUFFIX)])], Boolean), _.every([_.isEqual(tab, AppTab.STUDIO), _.some([_.isEqual(project?.projectKind, ProjectKind.Studio), _.endsWith(project?.name, COMMON_STRINGS.STUDIO_CHILD_SUFFIX)])], Boolean)], Boolean);

const createProjectRecord = async (project: VideoProject): Promise<VideoProject> => {
  const response = await fetch(API_ROUTES.PROJECTS, {
    method: HTTP_METHODS.POST,
    headers: { [CONTENT_TYPE_HEADER]: CONTENT_TYPES.JSON },
    body: jsonUtils.safeStringify(project),
    signal: AbortSignal.timeout(PROJECT_LIST_CONSTANTS.CREATE_REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(ERROR_MESSAGES.CREATING_PROJECT);
  const savedProject = jsonUtils.safeParse<VideoProject>(await response.text(), null);
  if (!savedProject) throw new Error(ERROR_MESSAGES.CREATING_PROJECT);
  return savedProject;
};

export default function App() {
  const [currentLang, setLang] = useState<Lang>(COMMON_STRINGS.VI);
  const [activeTab, setActiveTab] = useState<string>(() => {
    const savedTab = storageUtils.get(STORAGE_KEYS.ACTIVE_TAB);
    const isValidTab = !_.isEmpty(savedTab) && !_.includes(INVALID_CACHE_VALUES, savedTab);
    if (isValidTab) {
      if (_.isEqual(savedTab, AppTab.STUDIO)) {
        const cachedProj = storageUtils.get(STORAGE_KEYS.SELECTED_PROJECT_ID);
        const isValidProj = !_.isEmpty(cachedProj) && !_.includes(INVALID_CACHE_VALUES, cachedProj);
        return isValidProj ? AppTab.STUDIO : AppTab.PROJECTS;
      }
      return savedTab!;
    }
    const cachedProj = storageUtils.get(STORAGE_KEYS.SELECTED_PROJECT_ID);
    const isValidProj = !_.isEmpty(cachedProj) && !_.includes(INVALID_CACHE_VALUES, cachedProj);
    return isValidProj ? AppTab.STUDIO : AppTab.PROJECTS;
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
  const [isSwitchingWorkspaceTab, setIsSwitchingWorkspaceTab] = useState(false);
  const workspaceTabLoadingStartedAtRef = useRef<number | null>(null);
  const pendingSavesRef = useRef<Record<string, NodeJS.Timeout>>({});
  const projectsRef = useRef<VideoProject[]>([]);
  const creatingChildRef = useRef<Record<string, boolean>>({});

  useEffect(() => {
    projectsRef.current = projects;
  }, [projects]);

  useEffect(() => {
    return () => {
      _.forEach(Object.entries(pendingSavesRef.current), ([id, timeout]) => {
        clearTimeout(timeout);
        const proj = _.find(projectsRef.current, { id });
        if (proj) {
          fetch(`${API_ROUTES.PROJECTS}/${id}`, {
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

  const [theme, setTheme] = useState<"dark" | "light">(() => {
    return (storageUtils.get(STORAGE_KEYS.APP_THEME) as "dark" | "light") || THEME_VALUES.LIGHT;
  });

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

  const [credits] = useState<number>(REFACTOR_CONSTANTS.CREDITS_DEFAULT_10000);
  const [costTracker, setCostTracker] = useState<number>(REFACTOR_CONSTANTS.ZERO_FLOAT);

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
              const detailRes = await fetch(`${API_ROUTES.PROJECTS}/${cachedId}`);
              if (detailRes.ok) {
                const detailText = await detailRes.text();
                const detailData = jsonUtils.safeParse(detailText, null);
                if (detailData) {
                  return _.map(list, (p: any) => (_.isEqual(p.id, cachedId) ? detailData : p));
                }
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
    if (_.isEqual(activeTab, AppTab.STUDIO) && selectedProjectId) {
      const activeProj = _.find(projects, { id: selectedProjectId });
      if (activeProj) {
        if (!activeProj.parentId) {
          const studioChild = _.find(projects, (p) => _.isEqual(p.parentId, activeProj.id) && _.endsWith(p.name, COMMON_STRINGS.STUDIO_CHILD_SUFFIX));
          if (studioChild) {
            setSelectedProjectId(studioChild.id);
          } else {
            if (creatingChildRef.current[activeProj.id]) return;
            creatingChildRef.current[activeProj.id] = true;

            const projectSlug = convertToSlug(activeProj.name || COMMON_STRINGS.PROJECT_DEFAULT_NAME);
            const randomStr = generateRandomString();
            const childId = `${COMMON_STRINGS.PROJECT_PREFIX}${projectSlug}_studio_${randomStr}`;
            const childProject: VideoProject = {
              ...activeProj,
              id: childId,
              parentId: activeProj.id,
              name: `${activeProj.name}${COMMON_STRINGS.STUDIO_CHILD_SUFFIX}`,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            
            fetch(API_ROUTES.PROJECTS, {
              method: HTTP_METHODS.POST,
              headers: { [CONTENT_TYPE_HEADER]: CONTENT_TYPES.JSON },
              body: jsonUtils.safeStringify(childProject),
            }).then(response => {
              if (response.ok) {
                setProjects((prev) => [...prev, childProject]);
                setSelectedProjectId(childId);
              }
            }).catch(err => appError(ERROR_MESSAGES.CREATING_PROJECT, err))
            .finally(() => {
              creatingChildRef.current[activeProj.id] = false;
            });
          }
        } else if (_.endsWith(activeProj.name, COMMON_STRINGS.AUTO_CHILD_SUFFIX)) {
          const studioChild = _.find(projects, (p) => _.isEqual(p.parentId, activeProj.parentId) && _.endsWith(p.name, COMMON_STRINGS.STUDIO_CHILD_SUFFIX));
          if (studioChild) {
            setSelectedProjectId(studioChild.id);
          }
        }
      }
    }
  }, [activeTab, selectedProjectId, projects]);

  useEffect(() => {
    if (!isSwitchingWorkspaceTab) {
      return;
    }
    const activeWorkspaceProject = _.find(projects, { id: selectedProjectId });
    if (!isProjectReadyForTab(activeWorkspaceProject, activeTab)) {
      return;
    }
    const startedAt = workspaceTabLoadingStartedAtRef.current || Date.now();
    const elapsedMs = _.subtract(Date.now(), startedAt);
    const remainingMs = _.max([
      _.subtract(TAB_CONTENT_LOADING_CONFIG.MIN_DISPLAY_MS, elapsedMs),
      REFACTOR_CONSTANTS.ZERO_FLOAT,
    ]) || REFACTOR_CONSTANTS.ZERO_FLOAT;
    let frameId: number | undefined;
    const timeoutId = setTimeout(() => {
      frameId = requestAnimationFrame(() => {
        workspaceTabLoadingStartedAtRef.current = null;
        setIsSwitchingWorkspaceTab(false);
      });
    }, remainingMs);
    return () => {
      clearTimeout(timeoutId);
      if (!_.isUndefined(frameId)) {
        cancelAnimationFrame(frameId);
      }
    };
  }, [activeTab, isSwitchingWorkspaceTab, projects, selectedProjectId]);

  useEffect(() => {
    if (!isSwitchingWorkspaceTab) {
      return;
    }
    const timeoutId = setTimeout(
      () => {
        workspaceTabLoadingStartedAtRef.current = null;
        setIsSwitchingWorkspaceTab(false);
      },
      TAB_CONTENT_LOADING_CONFIG.MAX_WAIT_MS,
    );
    return () => clearTimeout(timeoutId);
  }, [isSwitchingWorkspaceTab]);

  useEffect(() => {
    if (_.isEqual(activeTab, AppTab.AUTO_GENERATOR) && selectedProjectId) {
      const activeProj = _.find(projects, { id: selectedProjectId });
      if (activeProj) {
        if (!activeProj.parentId) {
          const autoChild = _.find(projects, (p) => _.isEqual(p.parentId, activeProj.id) && _.endsWith(p.name, COMMON_STRINGS.AUTO_CHILD_SUFFIX));
          if (autoChild) {
            setSelectedProjectId(autoChild.id);
          } else {
            const childKey = _.join([activeProj.id, COMMON_STRINGS.AUTO_CHILD_SUFFIX], REFACTOR_CONSTANTS.VD_EMPTY_STRING);
            if (creatingChildRef.current[childKey]) return;
            creatingChildRef.current[childKey] = true;

            const projectSlug = convertToSlug(activeProj.name || COMMON_STRINGS.PROJECT_DEFAULT_NAME);
            const randomStr = generateRandomString();
            const childId = `${COMMON_STRINGS.PROJECT_PREFIX}${projectSlug}_auto_${randomStr}`;
            const childProject: VideoProject = {
              ...activeProj,
              id: childId,
              parentId: activeProj.id,
              name: `${activeProj.name}${COMMON_STRINGS.AUTO_CHILD_SUFFIX}`,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            
            fetch(API_ROUTES.PROJECTS, {
              method: HTTP_METHODS.POST,
              headers: { [CONTENT_TYPE_HEADER]: CONTENT_TYPES.JSON },
              body: jsonUtils.safeStringify(childProject),
            }).then(response => {
              if (response.ok) {
                setProjects((prev) => [...prev, childProject]);
                setSelectedProjectId(childId);
              }
            }).catch(err => appError(ERROR_MESSAGES.CREATING_PROJECT, err))
            .finally(() => {
              creatingChildRef.current[childKey] = false;
            });
          }
        } else if (_.endsWith(activeProj.name, COMMON_STRINGS.STUDIO_CHILD_SUFFIX)) {
          const autoChild = _.find(projects, (p) => _.isEqual(p.parentId, activeProj.parentId) && _.endsWith(p.name, COMMON_STRINGS.AUTO_CHILD_SUFFIX));
          if (autoChild) {
            setSelectedProjectId(autoChild.id);
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
        const res = await fetch(`${API_ROUTES.PROJECTS}/${id}`);
        if (!res.ok) throw new Error(ErrorMessage.PROJECT_LOAD_ERROR);
        const detailText = await res.text();
        const detailData = jsonUtils.safeParse(detailText, null);
        if (detailData) {
          setProjects((prev) => _.map(prev, (p) => (_.isEqual(p.id, id) ? detailData : p)));
        }
        setSelectedProjectId(id);
        if (project.parentId && _.endsWith(project.name, COMMON_STRINGS.AUTO_CHILD_SUFFIX)) {
          setActiveTab(AppTab.AUTO_GENERATOR);
        } else {
          setActiveTab(AppTab.STUDIO);
        }
      } catch (err) {
        appError(ERROR_MESSAGES.FETCHING_PROJECTS, err);
      }
    } else {
      setSelectedProjectId(id);
      if (project && project.parentId && _.endsWith(project.name, COMMON_STRINGS.AUTO_CHILD_SUFFIX)) {
        setActiveTab(AppTab.AUTO_GENERATOR);
      } else {
        setActiveTab(AppTab.STUDIO);
      }
    }
  }, []);
  const handleCreateProject = async (name: string, desc: string) => {
    const projectSlug = convertToSlug(name || COMMON_STRINGS.PROJECT_DEFAULT_NAME);
    const randomStr = () => generateRandomString();
    
    const parentId = `${COMMON_STRINGS.PROJECT_PREFIX}${projectSlug}_parent_${randomStr()}`;
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
        imageGeneratorEngine: ImageGeneratorEngine.Veo3,
        generateType: GenerateType.Image,
        aspectRatio: AspectRatio.SixteenNine,
        promptInputMethod: PromptInputMethod.Paste,
        generateCount: 1,
      },
      creditsUsed: 0,
    };

    const studioChildId = `${COMMON_STRINGS.PROJECT_PREFIX}${projectSlug}_studio_${randomStr()}`;
    const studioChildProject: VideoProject = {
      ...parentProject,
      id: studioChildId,
      parentId: parentId,
      projectKind: ProjectKind.Studio,
      name: `${parentProject.name}${COMMON_STRINGS.STUDIO_CHILD_SUFFIX}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const autoChildId = `${COMMON_STRINGS.PROJECT_PREFIX}${projectSlug}_auto_${randomStr()}`;
    const autoChildProject: VideoProject = {
      ...parentProject,
      id: autoChildId,
      parentId: parentId,
      projectKind: ProjectKind.Auto,
      name: `${parentProject.name}${COMMON_STRINGS.AUTO_CHILD_SUFFIX}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      const parentData = await createProjectRecord(parentProject);
      const studioData = await createProjectRecord(studioChildProject);
      const autoData = await createProjectRecord(autoChildProject);

      setProjects((prev) => [...prev, parentData, studioData, autoData]);
      setSelectedProjectId(parentData.id);
    } catch (e) {
      appError(ERROR_MESSAGES.CREATING_PROJECT, e);
      throw e;
    }
  };

  const handleUpdateProject = useCallback((updated: VideoProject, immediate = false) => {
    setProjects((prev) => {
      const exists = _.some(prev, { id: updated.id });
      if (exists) {
        return _.map(prev, (p) => (_.isEqual(p.id, updated.id) ? updated : p));
      }
      return [...prev, updated];
    });

    if (pendingSavesRef.current[updated.id]) {
      clearTimeout(pendingSavesRef.current[updated.id]);
    }

    const doSave = async () => {
      try {
        const response = await fetch(`${API_ROUTES.PROJECTS}/${updated.id}`, {
          method: HTTP_METHODS.PUT,
          headers: { [CONTENT_TYPE_HEADER]: CONTENT_TYPES.JSON },
          body: jsonUtils.safeStringify(updated),
        });
        if (!response.ok) {
          throw new Error(`${ERROR_MESSAGES.HTTP_ERROR_PREFIX}${response.status}: ${response.statusText}`);
        }
        delete pendingSavesRef.current[updated.id];
      } catch (e) {
        appError(ERROR_MESSAGES.AUTO_SAVE_ERR, e);
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
      const res = await fetch(`${API_ROUTES.PROJECTS}/${id}`, { method: HTTP_METHODS.DELETE });
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

  const activeProject = _.find(projects, { id: selectedProjectId });

  const handleActiveTabChange = useCallback((tab: string) => {
    if (_.some([
      isSwitchingWorkspaceTab,
      _.isEqual(tab, activeTab),
      _.every([_.isEqual(tab, AppTab.STUDIO), _.isEmpty(selectedProjectId)], Boolean),
    ], Boolean)) {
      return;
    }

    const shouldShowLoading = _.every(
      [activeTab, tab],
      isProjectWorkspaceTab,
    );
    workspaceTabLoadingStartedAtRef.current = shouldShowLoading ? Date.now() : null;
    setIsSwitchingWorkspaceTab(shouldShowLoading);

    if (_.includes([AppTab.PROJECTS, AppTab.DASHBOARD], tab as AppTab)) {
      setSelectedProjectId(null);
    }
    setActiveTab(tab);
  }, [activeTab, isSwitchingWorkspaceTab, selectedProjectId]);

  const handleUpdateProjectDetails = async (id: string, name: string, description: string) => {
    const projToUpdate = _.find(projects, { id });
    if (!projToUpdate) return;
    const updated = {
      ...projToUpdate,
      name,
      description,
      updatedAt: new Date().toISOString(),
    };
    setProjects((prev) => _.map(prev, (p) => (_.isEqual(p.id, id) ? updated : p)));
    try {
      const res = await fetch(`${API_ROUTES.PROJECTS}/${id}`, {
        method: HTTP_METHODS.PUT,
        headers: { [CONTENT_TYPE_HEADER]: CONTENT_TYPES.JSON },
        body: jsonUtils.safeStringify(updated),
      });
      if (res.ok) {
        const text = await res.text();
        const savedProject = jsonUtils.safeParse(text, null);
        if (savedProject) {
          setProjects((prev) => _.map(prev, (p) => (_.isEqual(p.id, id) ? savedProject : p)));
        }
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
    <div className="h-screen w-screen flex flex-col font-sans antialiased text-slate-205 bg-slate-955 transition-colors duration-300 overflow-hidden">
      <Header
        currentLang={currentLang}
        setLang={setLang}
        credits={credits}
        costTracker={costTracker}
        theme={theme as any}
        toggleTheme={toggleTheme}
      />
      
      <Toaster position="top-right" theme={theme as any} richColors />

      <div className="flex-grow w-full flex min-h-0 overflow-hidden relative bg-slate-955">
        <Sidebar
          currentLang={currentLang}
          activeTab={activeTab}
          setActiveTab={handleActiveTabChange}
          selectedProjectId={selectedProjectId}
          activeProjectName={activeProject?.name || null}
          theme={theme as any}
          toggleTheme={toggleTheme}
        />

        <main className="flex-1 min-h-0 overflow-hidden relative bg-slate-955">
          <Suspense fallback={<TabContentLoading />}>
            {isSwitchingWorkspaceTab ? (
              <TabContentLoading />
            ) : _.isEqual(activeTab, AppTab.STUDIO) && selectedProjectId && activeProject ? (
              <PipelineWizard
                key={selectedProjectId}
                theme={theme as any}
                currentLang={currentLang}
                project={activeProject}
                onSaveProject={handleUpdateProject}
                setProject={handleUpdateProject}
                onBackToDashboard={() => handleSelectProject(null)}
                costTracker={costTracker}
                setCostTracker={setCostTracker}
                credits={credits}
                setCredits={() => {}}
              />
            ) : _.isEqual(activeTab, AppTab.AUTO_GENERATOR) ? (
              <AutoVideoGenerator
                currentLang={currentLang}
                projects={projects}
                selectedProjectId={selectedProjectId}
                onSelectProject={handleSelectProject}
                onCreateProject={handleCreateProject}
                onUpdateProject={handleUpdateProject}
                theme={theme as any}
              />
            ) : _.isEqual(activeTab, AppTab.SETTINGS) ? (
              <SettingsView currentLang={currentLang} />
            ) : _.isEqual(activeTab, AppTab.DASHBOARD) ? (
              <DashboardView
                currentLang={currentLang}
                credits={credits}
                costTracker={costTracker}
                projects={projects}
                onSelectProject={handleSelectProject}
                onNavigateToProjects={() => setActiveTab(AppTab.PROJECTS)}
              />
            ) : (
              <div className="flex-grow h-full overflow-y-auto px-4 sm:px-6 lg:px-8 py-8 w-full max-w-7xl mx-auto">
                <ProjectList
                  currentLang={currentLang}
                  projects={projects}
                  isLoading={isLoadingProjects}
                  onSelectProject={(project) => handleSelectProject(project.id)}
                  onCreateProject={handleCreateProject}
                  onUpdateProject={handleUpdateProjectDetails}
                  onDeleteProject={handleDeleteProject}
                />
              </div>
            )}
          </Suspense>
        </main>
      </div>
    </div>
  );
}
