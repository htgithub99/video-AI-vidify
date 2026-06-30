import React, { useState, useEffect } from "react";
import Header from "./components/Header.tsx";
import ProjectList from "./components/ProjectList.tsx";
import PipelineWizard from "./components/PipelineWizard.tsx";
import { VideoProject } from "./types.js";
import { Lang } from "./lib/lang.js";
import { appError, setLogLanguage } from "./lib/logger.js";
import { API_ROUTES } from "./constants/apiRoutes.js";

export default function App() {
  const [currentLang, setLang] = useState<Lang>("vi");

  useEffect(() => {
    setLogLanguage(currentLang);
  }, [currentLang]);
  const [projects, setProjects] = useState<VideoProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    () => {
      const cached = localStorage.getItem("selected_project_id");
      if (!cached || cached === "undefined" || cached === "null") {
        return null;
      }
      return cached;
    },
  );

  useEffect(() => {
    if (
      selectedProjectId &&
      selectedProjectId !== "undefined" &&
      selectedProjectId !== "null"
    ) {
      localStorage.setItem("selected_project_id", selectedProjectId);
    } else {
      localStorage.removeItem("selected_project_id");
    }
  }, [selectedProjectId]);

  const [theme, setTheme] = useState<"dark" | "light">(() => {
    return (localStorage.getItem("app_theme") as "dark" | "light") || "light";
  });

  useEffect(() => {
    localStorage.setItem("app_theme", theme);
    if (theme === "light") {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
    } else {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const [credits, setCredits] = useState<number>(10000);
  const [costTracker, setCostTracker] = useState<number>(0.0);

  useEffect(() => {
    fetch(API_ROUTES.PROJECTS)
      .then(async (res) => {
        try {
          const text = await res.text();
          if (
            !text ||
            text.trim() === "" ||
            text.trim() === "undefined" ||
            text.trim() === "null"
          ) {
            return [];
          }
          return JSON.parse(text);
        } catch (e) {
          appError("ERROR_PARSING_PROJECTS", e);
          return [];
        }
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setProjects(data);
        }
      })
      .catch((err) => appError("ERROR_FETCHING_PROJECTS", err));
  }, []);

  const handleCreateProject = async (name: string, desc: string) => {
    const newProject: VideoProject = {
      id: "proj_" + Math.random().toString(36).substring(2, 11),
      name: name,
      description: desc,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      input: {
        type: "script",
        content: "",
      },
      config: {
        genre: "Storytelling",
        language: currentLang,
        duration: "2m",
        rewriteLevel: 50,
        similarityReduction: 5,
        creativityLevel: 6,
        factCheck: true,
        audience: "General Audience",
        writingStyle: "Professional",
      },
      hookConfig: {
        type: "Auto",
        duration: 10,
        count: 3,
        positions: "start",
        versions: [],
      },
      voiceConfig: {
        provider: "Gemini Speech",
        audioType: "tts",
        gender: "male",
        age: "adult",
        emotion: "Normal",
        speed: 1.0,
        pitch: 1.0,
        volume: 1.0,
        voiceURI: "preset-vi-bac",
      },
      visualConfig: {
        source: "AI Auto",
        style: "Realistic",
        quality: "Standard",
        density: 5,
        characterConsistency: true,
        assetsMode: "mixed",
        imageGeneratorEngine: "veo3",
        generateType: "image",
        aspectRatio: "16:9",
        promptInputMethod: "paste",
        generateCount: 1,
      },
      creditsUsed: 0,
    };

    try {
      const response = await fetch(API_ROUTES.PROJECTS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProject),
      });
      if (response.ok) {
        setProjects((prev) => [...prev, newProject]);
        setSelectedProjectId(newProject.id);
      }
    } catch (e) {
      appError("ERROR_CREATING_PROJECT", e);
    }
  };

  const handleUpdateProject = async (updated: VideoProject) => {
    setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));

    try {
      await fetch(`${API_ROUTES.PROJECTS}/${updated.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
    } catch (e) {
      appError("ERROR_AUTO_SAVING_PROJECT", e);
    }
  };

  const handleDeleteProject = async (id: string) => {
    try {
      const res = await fetch(`${API_ROUTES.PROJECTS}/${id}`, { method: "DELETE" });
      if (res.ok) {
        setProjects((prev) => prev.filter((p) => p.id !== id));
        if (selectedProjectId === id) {
          setSelectedProjectId(null);
        }
      }
    } catch (e) {
      appError("ERROR_DELETING_PROJECT", e);
    }
  };

  const activeProject = projects.find((p) => p.id === selectedProjectId);

  const handleUpdateProjectDetails = async (
    id: string,
    name: string,
    description: string,
  ) => {
    const projToUpdate = projects.find((p) => p.id === id);
    if (!projToUpdate) return;
    const updated = {
      ...projToUpdate,
      name,
      description,
      updatedAt: new Date().toISOString(),
    };
    setProjects((prev) => prev.map((p) => (p.id === id ? updated : p)));
    try {
      await fetch(`${API_ROUTES.PROJECTS}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
    } catch (e) {
      appError("ERROR_UPDATING_PROJECT", e);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col font-sans antialiased text-slate-205 bg-slate-950 transition-colors duration-300 overflow-hidden">
      <Header
        currentLang={currentLang}
        setLang={setLang}
        credits={credits}
        costTracker={costTracker}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      <main className="flex-1 w-full flex flex-col min-h-0 overflow-hidden relative">
        {activeProject ? (
          <PipelineWizard
            theme={theme}
            currentLang={currentLang}
            project={activeProject}
            onSaveProject={handleUpdateProject}
            setProject={handleUpdateProject}
            onBackToDashboard={() => setSelectedProjectId(null)}
            costTracker={costTracker}
            setCostTracker={setCostTracker}
            credits={credits}
            setCredits={setCredits}
          />
        ) : (
          <div className="flex-grow overflow-y-auto px-4 sm:px-6 lg:px-8 py-8 w-full max-w-7xl mx-auto">
            <ProjectList
              currentLang={currentLang}
              projects={projects}
              onSelectProject={(p) => setSelectedProjectId(p.id)}
              onCreateProject={handleCreateProject}
              onUpdateProject={handleUpdateProjectDetails}
              onDeleteProject={handleDeleteProject}
            />
          </div>
        )}
      </main>
    </div>
  );
}
