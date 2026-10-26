export const MOTION_DRAFT_VERIFICATION = {
  PATTERNS: { API_MODULE: /motionApi\.ts$/, STORAGE_MODULE: /[\\/]lib[\\/]json\.ts$/, ACTIVITY_MODULE: /motionWorkflowActivity\.ts$/, TOAST_MODULE: /^sonner$/, ANY: /.*/ },
  ENTRY: `import React from "react"; import { createRoot } from "react-dom/client"; import { useMotionStudio } from "./src/hooks/useMotionStudio.ts"; function Fixture() { globalThis.motionDraftStudio = useMotionStudio(); return null; } createRoot(document.getElementById("root")).render(<Fixture />);`,
  API_STUB: `export const loadMotionEngineClient = async () => ({}); export const motionRequest = (...args) => globalThis.motionDraftFixture.request(...args); export const pollMotionJob = (...args) => globalThis.motionDraftFixture.poll(...args); export const motionJobStatusUrl = (base, id) => base + id;`,
  STORAGE_STUB: `import { MOTION_EDITORIAL } from "../constants/motionEditorial.ts"; export const jsonUtils = { getItem: (key, fallback) => (key === MOTION_EDITORIAL.LOG_STORAGE_KEY ? globalThis.motionDraftFixture.logJournal : globalThis.motionDraftFixture.stopped) ?? fallback, setItem: (key, value) => { if (key === MOTION_EDITORIAL.LOG_STORAGE_KEY) globalThis.motionDraftFixture.logJournal = structuredClone(value); else globalThis.motionDraftFixture.stopped = value; }, getAsyncItem: async () => structuredClone(globalThis.motionDraftFixture.saved), setAsyncItem: async (_key, value) => { globalThis.motionDraftFixture.saved = structuredClone(value); } };`,
  ACTIVITY_STUB: `export const logMotionActivity = () => {}; export const logStoryTerminal = () => {}; export const loggedMotionAction = async (_event, action) => action();`,
  TOAST_STUB: `const noop = () => {}; export const toast = { success: noop, error: noop, info: noop, warning: noop };`,
  HTML: '<div id="root"></div>',
  FIXTURE: "motion-draft-fixture",
  TOAST_MODULE: "sonner",
  TSX: "tsx",
  BROWSER: "browser",
  IIFE: "iife",
  CHROME: "chrome",
  PAGE_ERROR: "pageerror",
  PAGE_HIDE: "pagehide",
  ERROR: "Fixture analysis failed",
  JOB_ID: "draft-analysis-job",
  GENERATED_KEYS: ["analysis", "script", "voice", "uploadedAudio", "seo", "thumbnail", "thumbnails", "soundOverrides"],
  RESET_KEYS: ["script", "voice", "uploadedAudio", "seo", "thumbnail"],
  NEW_INPUT: "A completely different creative brief for the next video",
  SOURCE: { kind: "brief", title: "Existing source", text: "An existing creative brief", segments: [], words: 5, sourceSeconds: 60 },
  ANALYSIS: { title: "Existing analysis", logline: "Keep this draft", look: "existing-look", cast: [], places: [], chapters: [], facts: [], videoDna: { settings: { language: "vi", length: "10min", targetSeconds: 600, drawingMode: "3d", characterMode: "drawn", aspect: "16:9" } } },
  SCRIPT: {
    title: "Existing script",
    language: "vi",
    beats: [{ id: "beat", chapterId: "chapter", narration: "Keep the existing narration", visual: "scene", place: "room" }],
    gen: { cast: { person: { parts: [{ id: "body", nodes: [] }] } }, locations: { room: { nodes: [{ name: "existing-set" }] } }, staging: { beat: { actors: [] } }, previews: { beat: { file: "existing-preview.jpg" } }, style: {}, locationInfo: {}, failed: [] },
  },
  NEW_ANALYSIS: { title: "Replacement analysis", look: "replacement-look", cast: [], places: [], chapters: [], facts: [] },
  VOICE: { provider: "vieneu", audioId: "existing-voice.wav", voiceId: "existing-speaker", durations: [5], totalSeconds: 5 },
  UPLOAD: { id: "uploaded.wav", name: "Uploaded narration", durationSeconds: 5 },
  SEO: { options: [{ title: "Existing SEO" }], chapters: [], timingFrom: "voice", scriptKey: "existing-script" },
  THUMBNAIL: { image: "existing-thumbnail", prompt: "Existing thumbnail prompt" },
  OVERRIDES: { beat: { muted: true } },
  PATCHES: [{ length: "20min" }, { language: "en" }, { styleReferences: [] }, { stylePreset: "pixel_art", drawingMode: "2d", styleReferences: [] }, { characterMotion: true }, { aspect: "9:16" }, { videoGenre: "horror" }, { quality: "draft", fps: 24 }, { musicMood: "warm", musicVolume: 0.2 }, { subtitles: false }, { aiReview: false }],
  PASSED: "Motion draft passed: settings and source edits preserve generated data and storage; failed/cancelled analysis retains the draft; successful analysis replaces it for normal and resumed jobs.\n",
} as const;
export const MOTION_STYLE_PICKER_VERIFICATION = {
  ENTRY: `import React, { useState } from "react";
    import { createRoot } from "react-dom/client";
    import { useMotionStudio } from "./src/hooks/useMotionStudio.ts";
    import { MotionStyleSetPicker } from "./src/components/motion-video/MotionSceneLibraryPanel.tsx";
    function Studio() {
      const studio = useMotionStudio();
      globalThis.motionStyleStudio = studio;
      return <MotionStyleSetPicker studio={studio} currentLang="vi" />;
    }
    function Fixture() {
      const [revision, setRevision] = useState(0);
      globalThis.remountMotionStyleStudio = () => setRevision(value => value + 1);
      return <Studio key={revision} />;
    }
    createRoot(document.getElementById("root")).render(<Fixture />);`,
  API_STUB: MOTION_DRAFT_VERIFICATION.API_STUB + `export const formatMotionProgress = String; export const formatSeconds = String;`,
  TOAST_STUB: `export const toast = Object.fromEntries(["success", "error", "info", "warning"].map(kind => [kind, message => globalThis.motionStyleToasts.push({ kind, message })]));`,
  FIXTURE: "style-picker-fixture",
  COMBOBOX: "combobox",
  SELECT: "select",
  EMPTY: "",
  INITIAL_PRESET: "pixel_art",
  REFERENCES: [{ name: "style-reference-1", dataUrl: "data:image/png;base64,aGVsbG8=" }],
  STYLES: [
    { key: "test-style-2d", name: "Reference 2D", drawingMode: "2d", images: ["one.png"], createdAt: 1 },
    { key: "test-style-3d", name: "Reference 3D", drawingMode: "3d", images: ["one.png"], createdAt: 2 },
  ],
  REQUEST_FAILURE: "request",
  EMPTY_FAILURE: "empty",
  DOWNLOAD_ERROR: "Reference download failed",
  SUCCESS: "success",
  ERROR: "error",
  RETAIN_SELECTION: "The applied set must stay selected",
  CLEAR_SELECTION: "The default option must allow clearing the selected set",
  RETAIN_FAILED_SELECTION: "Failed downloads must retain the previously applied set",
  PASSED: "Motion style picker passed: applied images and drawing mode, retained selection, clearing selection, persisted restore, download errors, empty sets, and manual changes.\n",
} as const;
