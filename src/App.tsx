import { ErrorMessage } from "./constants";
import { useState, useEffect, useRef, useCallback } from "react";
import Header from "./components/Header.tsx";
import Sidebar from "./components/Sidebar.tsx";
import ProjectList from "./components/ProjectList.tsx";
import PipelineWizard from "./components/PipelineWizard.tsx";
import SettingsView from "./components/SettingsView.tsx";
import DashboardView from "./components/DashboardView.tsx";
import { VideoProject, ProjectInputType, ProjectLanguage, HookPosition, AudioType, Gender, AgeGroup, AssetsMode, ImageGeneratorEngine, GenerateType, PromptInputMethod, AspectRatio } from "./types.js";
import { Lang } from "./lib/lang.js";
import { appError, setLogLanguage } from "./lib/logger.js";
import { API_ROUTES, STORAGE_KEYS, LOADING_CONFIG, HTTP_METHODS, CONTENT_TYPES, ERROR_MESSAGES, CONTENT_TYPE_HEADER, THEME_VALUES, COMMON_STRINGS, DEFAULT_PROJECT_CONFIGS } from "./constants";
import _ from "lodash";

export default function App() {
  const [currentLang, setLang] = useState<Lang>(COMMON_STRINGS.VI);
  const [activeTab, setActiveTab] = useState<string>(() => {
    const cached = localStorage.getItem(STORAGE_KEYS.SELECTED_PROJECT_ID);
    return cached && cached !== "undefined" && cached !== "null" ? "studio" : "projects";
  });

  useEffect(() => {
    setLogLanguage(currentLang);
  }, [currentLang]);
  const [projects, setProjects] = useState<VideoProject[]>([]);
  const pendingSavesRef = useRef<Record<string, NodeJS.Timeout>>({});
  const projectsRef = useRef<VideoProject[]>([]);

  useEffect(() => {
    projectsRef.current = projects;
  }, [projects]);

  useEffect(() => {
    return () => {
      Object.entries(pendingSavesRef.current).forEach(([id, timeout]) => {
        clearTimeout(timeout);
        const proj = projectsRef.current.find((p) => p.id === id);
        if (proj) {
          fetch(`${API_ROUTES.PROJECTS}/${id}`, {
            method: HTTP_METHODS.PUT,
            headers: { [CONTENT_TYPE_HEADER]: CONTENT_TYPES.JSON },
            body: JSON.stringify(proj),
            keepalive: true,
          }).catch((e) => appError(ERROR_MESSAGES.FLUSH_SAVE_ON_UNMOUNT, e));
        }
      });
    };
  }, []);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(() => {
    const cached = localStorage.getItem(STORAGE_KEYS.SELECTED_PROJECT_ID);
    return !cached || ([COMMON_STRINGS.UNDEFINED, COMMON_STRINGS.NULL] as string[]).includes(cached) ? null : cached;
  });

  useEffect(() => {
    if (selectedProjectId && !([COMMON_STRINGS.UNDEFINED, COMMON_STRINGS.NULL] as string[]).includes(selectedProjectId)) {
      localStorage.setItem(STORAGE_KEYS.SELECTED_PROJECT_ID, selectedProjectId);
    } else {
      localStorage.removeItem(STORAGE_KEYS.SELECTED_PROJECT_ID);
    }
  }, [selectedProjectId]);

  const [theme, setTheme] = useState<"dark" | "light">(() => {
    return (localStorage.getItem(STORAGE_KEYS.APP_THEME) as "dark" | "light") || THEME_VALUES.LIGHT;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.APP_THEME, theme);
    if (theme === THEME_VALUES.LIGHT) {
      document.documentElement.classList.add(THEME_VALUES.LIGHT);
      document.documentElement.classList.remove(THEME_VALUES.DARK);
    } else {
      document.documentElement.classList.add(THEME_VALUES.DARK);
      document.documentElement.classList.remove(THEME_VALUES.LIGHT);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === THEME_VALUES.DARK ? THEME_VALUES.LIGHT : THEME_VALUES.DARK));
  };

  const [credits, setCredits] = useState<number>(10000);
  const [costTracker, setCostTracker] = useState<number>(0.0);

  useEffect(() => {
    let active = true;
    let timerId: NodeJS.Timeout;

    const cachedId = localStorage.getItem(STORAGE_KEYS.SELECTED_PROJECT_ID);
    const fetchProjects = fetch(API_ROUTES.PROJECTS).then(async (res) => {
      try {
        const text = await res.text();
        if (!text?.trim() || ([COMMON_STRINGS.UNDEFINED, COMMON_STRINGS.NULL] as string[]).includes(text?.trim())) {
          return [];
        }
        const list = JSON.parse(text);
        if (cachedId && !([COMMON_STRINGS.UNDEFINED, COMMON_STRINGS.NULL] as string[]).includes(cachedId)) {
          const hasProj = list.some((p: any) => p.id === cachedId);
          if (hasProj) {
            try {
              const detailRes = await fetch(`${API_ROUTES.PROJECTS}/${cachedId}`);
              if (detailRes.ok) {
                const detailData = await detailRes.json();
                return list.map((p: any) => (p.id === cachedId ? detailData : p));
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

    const fontTimeout = new Promise((resolve) => setTimeout(resolve, LOADING_CONFIG.FONT_TIMEOUT_MS));
    const fontReady = document.fonts ? document.fonts.ready : Promise.resolve();
    const waitForFonts = Promise.race([fontReady, fontTimeout]);

    Promise.all([fetchProjects, waitForFonts])
      .then(([projectsData]) => {
        if (active && Array.isArray(projectsData)) {
          setProjects(projectsData);
        }
      })
      .catch((err) => appError(ERROR_MESSAGES.FETCHING_PROJECTS, err))
      .finally(() => {
        if (active) {
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

  const handleSelectProject = useCallback(async (id: string | null) => {
    if (!id) {
      setSelectedProjectId(null);
      setActiveTab("projects");
      return;
    }
    const project = projectsRef.current.find((p) => p.id === id);
    if (project && !project.input) {
      try {
        const res = await fetch(`${API_ROUTES.PROJECTS}/${id}`);
        if (!res.ok) throw new Error(ErrorMessage.PROJECT_LOAD_ERROR);
        const detailData = await res.json();
        setProjects((prev) => prev.map((p) => (p.id === id ? detailData : p)));
        setSelectedProjectId(id);
        setActiveTab("studio");
      } catch (err) {
        appError(ERROR_MESSAGES.FETCHING_PROJECTS, err);
      }
    } else {
      setSelectedProjectId(id);
      setActiveTab("studio");
    }
  }, []);

  const handleCreateProject = async (name: string, desc: string) => {
    const newProject: VideoProject = {
      id: COMMON_STRINGS.PROJECT_PREFIX + Math.random().toString(36).substring(2, 11),
      name: name,
      description: desc,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      input: {
        type: ProjectInputType.Script,
        content: "",
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

    try {
      const response = await fetch(API_ROUTES.PROJECTS, {
        method: HTTP_METHODS.POST,
        headers: { [CONTENT_TYPE_HEADER]: CONTENT_TYPES.JSON },
        body: JSON.stringify(newProject),
      });
      if (response.ok) {
        const savedProject = await response.json();
        setProjects((prev) => [...prev, savedProject]);
        setSelectedProjectId(savedProject.id);
      }
    } catch (e) {
      appError(ERROR_MESSAGES.CREATING_PROJECT, e);
    }
  };

  const handleUpdateProject = useCallback((updated: VideoProject, immediate = false) => {
    setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));

    if (pendingSavesRef.current[updated.id]) {
      clearTimeout(pendingSavesRef.current[updated.id]);
    }

    const doSave = async () => {
      try {
        const response = await fetch(`${API_ROUTES.PROJECTS}/${updated.id}`, {
          method: HTTP_METHODS.PUT,
          headers: { "Content-Type": CONTENT_TYPES.JSON },
          body: JSON.stringify(updated),
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
      pendingSavesRef.current[updated.id] = setTimeout(doSave, 1000);
      return Promise.resolve();
    }
  }, []);

  const handleDeleteProject = async (id: string) => {
    try {
      const res = await fetch(`${API_ROUTES.PROJECTS}/${id}`, { method: HTTP_METHODS.DELETE });
      if (res.ok) {
        setProjects((prev) => prev.filter((p) => p.id !== id));
        if (selectedProjectId === id) {
          handleSelectProject(null);
        }
      }
    } catch (e) {
      appError(ERROR_MESSAGES.DELETING_PROJECT, e);
    }
  };

  const activeProject = projects.find((p) => p.id === selectedProjectId);

  const handleUpdateProjectDetails = async (id: string, name: string, description: string) => {
    const projToUpdate = _.find(projects, { id });
    if (!projToUpdate) return;
    const updated = {
      ...projToUpdate,
      name,
      description,
      updatedAt: new Date().toISOString(),
    };
    setProjects((prev) => _.map(prev, (p) => (_.eq(p.id, id) ? updated : p)));
    try {
      const res = await fetch(`${API_ROUTES.PROJECTS}/${id}`, {
        method: HTTP_METHODS.PUT,
        headers: { [CONTENT_TYPE_HEADER]: CONTENT_TYPES.JSON },
        body: JSON.stringify(updated),
      });
      if (res.ok) {
        const savedProject = await res.json();
        setProjects((prev) => _.map(prev, (p) => (_.eq(p.id, id) ? savedProject : p)));
      } else {
        setProjects((prev) => _.map(prev, (p) => (_.eq(p.id, id) ? projToUpdate : p)));
        appError(`${ERROR_MESSAGES.UPDATING_PROJECT}: STATUS ${res.status}`);
      }
    } catch (e) {
      setProjects((prev) => _.map(prev, (p) => (_.eq(p.id, id) ? projToUpdate : p)));
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
        theme={theme}
        toggleTheme={toggleTheme}
      />

      <div className="flex-grow w-full flex min-h-0 overflow-hidden relative bg-slate-955">
        <Sidebar
          currentLang={currentLang}
          activeTab={activeTab}
          setActiveTab={(tab) => {
            if (tab === "studio" && !selectedProjectId) return;
            setActiveTab(tab);
          }}
          selectedProjectId={selectedProjectId}
          activeProjectName={activeProject?.name || null}
          theme={theme}
          toggleTheme={toggleTheme}
        />

        <main className="flex-1 min-h-0 overflow-hidden relative bg-slate-955">
          {activeTab === "studio" && selectedProjectId && activeProject ? (
            <PipelineWizard
              key={selectedProjectId}
              theme={theme}
              currentLang={currentLang}
              project={activeProject}
              onSaveProject={handleUpdateProject}
              setProject={handleUpdateProject}
              onBackToDashboard={() => handleSelectProject(null)}
              costTracker={costTracker}
              setCostTracker={setCostTracker}
              credits={credits}
              setCredits={setCredits}
            />
          ) : activeTab === "settings" ? (
            <SettingsView currentLang={currentLang} />
          ) : activeTab === "dashboard" ? (
            <DashboardView
              currentLang={currentLang}
              credits={credits}
              costTracker={costTracker}
              projects={projects}
              onSelectProject={handleSelectProject}
              onNavigateToProjects={() => setActiveTab("projects")}
            />
          ) : (
            <div className="flex-grow h-full overflow-y-auto px-4 sm:px-6 lg:px-8 py-8 w-full max-w-7xl mx-auto">
              <ProjectList
                currentLang={currentLang}
                projects={projects}
                onSelectProject={(p) => handleSelectProject(p.id)}
                onCreateProject={handleCreateProject}
                onUpdateProject={handleUpdateProjectDetails}
                onDeleteProject={handleDeleteProject}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
