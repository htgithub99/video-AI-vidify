import { ChangeEvent, DragEvent, FC, useEffect, useMemo, useRef, useState } from "react";
import JSZip from "jszip";
import _ from "lodash";
import {
  Download,
  FolderOpen,
  FolderPlus,
  Music2,
  Shuffle,
  Trash2,
  Sparkles,
  SlidersHorizontal,
  X,
  Disc3,
  Layers,
  FileArchive,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Square,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "./ui/Button";
import { Tooltip } from "./ui/Tooltip";
import { Lang } from "../lib/lang.js";
import { MUSIC_MIXER_TEXTS } from "../constants/texts";
import { cn } from "../lib/utils";
import { jsonUtils } from "../lib/json";
import ChatPlanningSettingsBlock from "./common/ChatPlanningSettingsBlock";
import { AiPlanningChatModel, AiPlanningExecutionMode, AiPlanningFallbackProvider } from "../types";
import { API_ROUTES } from "../constants";
import { MUSIC_MIXER_SERVER } from "../constants/musicMixer";
import { recordWorkflowActivity } from "../services/workflowActivity";
import { WORKFLOW_ACTIVITY_CONFIG, WORKFLOW_ACTIVITY_EVENT } from "../constants/workflowActivity";

type Track = { file: File; path: string; folder: string; folderPath?: string; sourcePath?: string; sourceUrl?: string; size?: number; durationSeconds?: number };
type SeoData = ReturnType<typeof createSeo>;
type ResultFolder = { name: string; tracks: Track[]; seo?: SeoData; seoOptions?: any[] };

const AUDIO_EXT = /\.(mp3|wav|m4a|aac|flac|ogg|opus|webm)$/i;
const MIXER_DB = MUSIC_MIXER_SERVER.DATABASE_NAME;

const numberedName = (file: File, index: number) =>
  `${String(index + 1).padStart(2, "0")}.${file.name.replace(/\.[^.]+$/, "").replace(/^\d+[\s._-]*/, "").replace(/\s*\(\d+\)$/, "")}${file.name.match(/\.[^.]+$/)?.[0] || ""}`;
const cleanTrackTitle = (name: string) => name.replace(/\.[^.]+$/, "").replace(/^\d+[\s._-]*/, "").replace(/\s*\(\d+\)$/, "");
const getDisplayFolderName = (folderName: string, folderPath?: string) => {
  if (!folderPath) return folderName;
  const normalized = folderPath.replace(/^[A-Za-z]:[\\/]/, "");
  const parts = normalized.split(/[\\/]/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[parts.length - 2]} \\ ${parts[parts.length - 1]}`;
  }
  return parts[0] || folderName;
};

const saveZip = async (blob: Blob, name: string) => {
  const dataUrl = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(reader.error); reader.readAsDataURL(blob); });
  const response = await fetch(API_ROUTES.PIPELINE_SAVE_FILE, { method: "POST", headers: { "Content-Type": "application/json" }, body: jsonUtils.safeStringify({ suggestedName: name, dataUrl }) });
  const result = await response.json();
  if (!response.ok || !result.success) throw new Error(result.error || MUSIC_MIXER_SERVER.ZIP_SAVE_ERROR);
};

const createSeo = (folder: ResultFolder) => {
  const title = `${folder.name} - ${MUSIC_MIXER_SERVER.DEFAULT_SEO_TITLE_SUFFIX}`;
  let elapsed = 0;
  const tracks = folder.tracks.map((track) => { const minutes = Math.floor(elapsed / 60); const seconds = Math.floor(elapsed % 60); const stamp = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`; elapsed += track.durationSeconds || 0; return `${stamp} ${cleanTrackTitle(track.file.name)}`; });
  return {
    title,
    description: `${MUSIC_MIXER_SERVER.DEFAULT_SEO_DESCRIPTION_PREFIX} ${folder.tracks.length} tracks. ${MUSIC_MIXER_SERVER.DEFAULT_SEO_DESCRIPTION_SUFFIX}`,
    tags: MUSIC_MIXER_SERVER.DEFAULT_SEO_TAGS,
    chapters: tracks.map((name, index) => ({ position: index + 1, label: name })),
    tracks,
  };
};
const ensureTrackFile = async (track: Track): Promise<File> => {
  if (track.file.size > 0 || (!track.sourcePath && !track.sourceUrl)) return track.file;
  const response = track.sourcePath
    ? await fetch(API_ROUTES.PIPELINE_MUSIC_MIXER_SOURCE_FILE, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sourcePath: track.sourcePath }) })
    : await fetch(track.sourceUrl!);
  if (!response.ok) throw new Error(MUSIC_MIXER_SERVER.SOURCE_READ_ERROR);
  const blob = await response.blob();
  return new File([blob], track.file.name, { type: blob.type || track.file.type });
};
const formatSeoText = (folder: ResultFolder) => {
  const orderedTracks = folder.tracks.map((track) => cleanTrackTitle(track.file.name));
  let elapsed = 0;
  const timeline = folder.tracks.map((track) => { const stamp = `${String(Math.floor(elapsed / 60)).padStart(2, "0")}:${String(Math.floor(elapsed % 60)).padStart(2, "0")}`; elapsed += track.durationSeconds || 0; return `${stamp} ${cleanTrackTitle(track.file.name)}`; });
  const options = folder.seoOptions?.length ? folder.seoOptions : [{ title: folder.seo?.title || "", description: folder.seo?.description || "", hashtags: [], tags: [], seoScore: "AI" }];
  return `SEO CHO TOÀN BỘ DANH SÁCH NHẠC\n\n[URL PLAYLIST]:\n\n${options.map((option, index) => `=== Mẫu ${index + 1} (Điểm ${option.seoScore || "AI"}) ===\n\n[Tiêu đề]:\n${option.title || ""}\n\n[Mô tả]:\n${option.description || ""}\n\n${timeline.join("\n")}\n\n[Thứ tự nhạc]:\n${orderedTracks.join(" / ")}\n\n[HASHTAGS]:\n${(option.hashtags || []).join(" ")}\n\n[TAGS / KEYWORDS]:\n${(option.tags || []).join(", ")}`).join("\n\n----------------------------------------\n\n")}`;
};

const shuffle = <T,>(items: T[]): T[] => {
  const output = [...items];
  for (let i = output.length - 1; i > 0; i--) {
    const bytes = new Uint32Array(1);
    crypto.getRandomValues(bytes);
    const j = bytes[0] % (i + 1);
    [output[i], output[j]] = [output[j], output[i]];
  }
  return output;
};

const readEntries = (reader: any): Promise<any[]> =>
  new Promise((resolve, reject) => reader.readEntries(resolve, reject));

const readFile = (entry: any): Promise<File> =>
  new Promise((resolve, reject) => entry.file(resolve, reject));

const walkEntry = async (entry: any): Promise<Track[]> => {
  if (entry.isFile) {
    const file = await readFile(entry);
    const path = String(entry.fullPath || file.name).replace(/^\//, "");
    return AUDIO_EXT.test(file.name) ? [{ file, path, folder: path.split("/")[0] }] : [];
  }
  if (!entry.isDirectory) return [];
  const reader = entry.createReader();
  const children: any[] = [];
  let reading = true;
  while (reading) {
    const page = await readEntries(reader);
    if (!page.length) { reading = false; continue; }
    children.push(...page);
  }
  return (await Promise.all(children.map(walkEntry))).flat();
};

const PRESET_SONGS_PER_RESULT = [5, 10, 15, 20, 25];
const PRESET_RESULT_COUNTS = [2, 3, 5, 8, 10];

const MusicMixer: FC<{ currentLang: Lang }> = ({ currentLang }) => {
  const vi = currentLang === "vi";
  const text = MUSIC_MIXER_TEXTS[vi ? "vi" : "en"];
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [tracks, setTracks] = useState<Track[]>([]);
  const [songsPerResult, setSongsPerResult] = useState(10);
  const [resultCount, setResultCount] = useState(3);
  const [results, setResults] = useState<ResultFolder[]>([]);
  const [busy, setBusy] = useState(false);
  const [isSelectingFolder, setIsSelectingFolder] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadingFolder, setDownloadingFolder] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState("");
  const [seoProvider, setSeoProvider] = useState<AiPlanningFallbackProvider>(AiPlanningFallbackProvider.GeminiChat);
  const [seoModel, setSeoModel] = useState<AiPlanningChatModel>(AiPlanningChatModel.GeminiFlashLite);
  const [seoExecutionMode, setSeoExecutionMode] = useState<AiPlanningExecutionMode>(AiPlanningExecutionMode.RoomOnly);
  const [seoChromeHeadless, setSeoChromeHeadless] = useState(false);
  const [trackOrder, setTrackOrder] = useState<"random" | "featured" | "name">("featured");
  const [isAiConfigOpen, setIsAiConfigOpen] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const projectIdRef = useRef<string | null>(null);
  const folderProjectIdsRef = useRef<string[]>([]);

  useEffect(() => {
    try {
      const saved = jsonUtils.getItem<Record<string, any>>(MUSIC_MIXER_SERVER.SETTINGS_STORAGE_KEY, {});
      if (Number.isFinite(saved.songsPerResult) && saved.songsPerResult > 0) setSongsPerResult(saved.songsPerResult);
      if (Number.isFinite(saved.resultCount) && saved.resultCount > 0) setResultCount(saved.resultCount);
      if (["random", "featured", "name"].includes(saved.trackOrder)) setTrackOrder(saved.trackOrder);
      if (saved.seoProvider) setSeoProvider(saved.seoProvider);
      if (saved.seoModel) setSeoModel(saved.seoModel);
      if (saved.seoExecutionMode) setSeoExecutionMode(saved.seoExecutionMode);
      if (typeof saved.seoChromeHeadless === "boolean") setSeoChromeHeadless(saved.seoChromeHeadless);
    } catch { }
    finally { setSettingsLoaded(true); }
    const request = indexedDB.open(MIXER_DB, MUSIC_MIXER_SERVER.DATABASE_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains("tracks")) request.result.createObjectStore("tracks", { keyPath: "id" });
      if (!request.result.objectStoreNames.contains("results")) request.result.createObjectStore("results", { keyPath: "id" });
    };
    request.onsuccess = () => {
      const db = request.result;
      const get = db.transaction("tracks", "readonly").objectStore("tracks").getAll();
      get.onsuccess = () => setTracks(get.result.map((item: any) => ({ file: new File([item.blob], item.name, { type: item.type, lastModified: item.lastModified }), path: item.path, folder: item.folder, folderPath: item.folderPath, sourcePath: item.sourcePath, sourceUrl: item.sourceUrl, size: item.size, durationSeconds: item.durationSeconds })));
      const savedResults = db.transaction("results", "readonly").objectStore("results").get(MUSIC_MIXER_SERVER.RESULTS_STORE_KEY);
      savedResults.onsuccess = () => { if (savedResults.result?.value) setResults(savedResults.result.value); };
    };
  }, []);

  useEffect(() => {
    if (!settingsLoaded) return;
    jsonUtils.setItem(MUSIC_MIXER_SERVER.SETTINGS_STORAGE_KEY, { songsPerResult, resultCount, trackOrder, seoProvider, seoModel, seoExecutionMode, seoChromeHeadless });
  }, [settingsLoaded, songsPerResult, resultCount, trackOrder, seoProvider, seoModel, seoExecutionMode, seoChromeHeadless]);

  useEffect(() => {
    if (!results.length) return;
    const request = indexedDB.open(MIXER_DB, MUSIC_MIXER_SERVER.DATABASE_VERSION);
    request.onsuccess = () => request.result.transaction("results", "readwrite").objectStore("results").put({ id: MUSIC_MIXER_SERVER.RESULTS_STORE_KEY, value: results });
  }, [results]);

  const groups = useMemo(() => {
    const map = new Map<string, Track[]>();
    tracks.forEach((track) => { const key = track.folderPath || track.folder; map.set(key, [...(map.get(key) || []), track]); });
    return [...map.entries()];
  }, [tracks]);

  const addTracks = (incoming: Track[]) => {
    if (_.isEmpty(incoming)) {
      toast.info(text.EMPTY_SOURCE_HINT);
      return;
    }
    setTracks((current) => {
      const known = new Set(
        current.map((track) => `${track.path}:${track.file.size}:${track.file.lastModified}`),
      );
      const newItems = incoming.filter(
        (track) => !known.has(`${track.path}:${track.file.size}:${track.file.lastModified}`),
      );
      if (newItems.length > 0) {
        toast.success(`${text.TOTAL_LOADED} +${newItems.length} ${text.TRACK_UNIT}`, { id: "music-mixer-upload" });
      }
      const next = [...current, ...newItems];
      const request = indexedDB.open(MIXER_DB, MUSIC_MIXER_SERVER.DATABASE_VERSION);
      request.onupgradeneeded = () => { if (!request.result.objectStoreNames.contains("tracks")) request.result.createObjectStore("tracks", { keyPath: "id" }); if (!request.result.objectStoreNames.contains("results")) request.result.createObjectStore("results", { keyPath: "id" }); };
      request.onsuccess = () => { const transaction = request.result.transaction("tracks", "readwrite"); const store = transaction.objectStore("tracks"); store.clear(); next.forEach((track) => store.put({ id: `${track.path}:${track.file.size}:${track.file.lastModified}`, blob: track.file, name: track.file.name, type: track.file.type, lastModified: track.file.lastModified, path: track.path, folder: track.folder, folderPath: track.folderPath, sourcePath: track.sourcePath, sourceUrl: track.sourceUrl, size: track.size })); };
      return next;
    });
    setResults([]);
    setError("");
  };

  const chooseFolder = async () => {
    setIsSelectingFolder(true);
    try {
      const response = await fetch(API_ROUTES.PIPELINE_MUSIC_MIXER_SELECT_SOURCE, { method: "POST" });
      const selection = await response.json();
      if (!selection.success) return;
      const folder = String(selection.folderPath).split(/[\\/]/).filter(Boolean).pop() || MUSIC_MIXER_SERVER.DEFAULT_FOLDER_NAME;
      const collected: Track[] = selection.files.map((item: { name: string; relativePath: string; sourcePath: string; url: string; size: number; type: string }) => ({ file: new File([], item.name, { type: item.type }), path: `${folder}/${item.relativePath.replaceAll("\\", "/")}`, folder, folderPath: selection.folderPath, sourcePath: item.sourcePath, sourceUrl: item.url, size: item.size }));
      addTracks(collected);
    } catch { setError(text.DROP_ERROR); }
    finally { setIsSelectingFolder(false); }
  };

  const handleRemoveFolder = (folderName: string) => {
    setTracks((current) => {
      const next = current.filter((track) => (track.folderPath || track.folder) !== folderName);
      const request = indexedDB.open(MIXER_DB, MUSIC_MIXER_SERVER.DATABASE_VERSION); request.onsuccess = () => { const store = request.result.transaction("tracks", "readwrite").objectStore("tracks"); store.clear(); next.forEach((track) => store.put({ id: `${track.path}:${track.file.size}:${track.file.lastModified}`, blob: track.file, name: track.file.name, type: track.file.type, lastModified: track.file.lastModified, path: track.path, folder: track.folder, folderPath: track.folderPath, sourcePath: track.sourcePath, sourceUrl: track.sourceUrl, size: track.size, durationSeconds: track.durationSeconds })); };
      return next;
    });
    setResults([]);
    const resultDb = indexedDB.open(MIXER_DB, MUSIC_MIXER_SERVER.DATABASE_VERSION); resultDb.onsuccess = () => resultDb.result.transaction("results", "readwrite").objectStore("results").clear();
  };

  const handleClearAll = () => {
    setTracks([]);
    const request = indexedDB.open(MIXER_DB, MUSIC_MIXER_SERVER.DATABASE_VERSION); request.onupgradeneeded = () => { if (!request.result.objectStoreNames.contains("tracks")) request.result.createObjectStore("tracks", { keyPath: "id" }); if (!request.result.objectStoreNames.contains("results")) request.result.createObjectStore("results", { keyPath: "id" }); }; request.onsuccess = () => request.result.transaction("tracks", "readwrite").objectStore("tracks").clear();
    setResults([]);
    const resultDb = indexedDB.open(MIXER_DB, MUSIC_MIXER_SERVER.DATABASE_VERSION); resultDb.onsuccess = () => resultDb.result.transaction("results", "readwrite").objectStore("results").clear();
    setError("");
  };

  const onFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const files = [...(event.target.files || [])].filter((file) => AUDIO_EXT.test(file.name));
    addTracks(
      files.map((file) => {
        const path = file.webkitRelativePath || file.name;
        return { file, path, folder: path.split(/[\\/]/)[0] };
      }),
    );
    event.target.value = "";
  };

  const onDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const onDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const onDrop = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
    setBusy(true);
    try {
      const entries = [...event.dataTransfer.items]
        .map((item) => (item as any).webkitGetAsEntry?.())
        .filter(Boolean);
      const found = entries.length
        ? (await Promise.all(entries.map(walkEntry))).flat()
        : [...event.dataTransfer.files]
            .filter((file) => AUDIO_EXT.test(file.name))
            .map((file) => ({ file, path: file.name, folder: "Folder" }));
      addTracks(found);
    } catch {
      setError(text.DROP_ERROR);
      toast.error(text.DROP_ERROR);
    } finally {
      setBusy(false);
    }
  };

  const generate = async () => {
    if (!tracks.length || songsPerResult < 1 || resultCount < 1 || songsPerResult > tracks.length) {
      return;
    }
    setBusy(true);
    const abortController = new AbortController();
    abortRef.current = abortController;
    projectIdRef.current = `${MUSIC_MIXER_SERVER.ANALYZE_RUN_PREFIX}${crypto.randomUUID()}`;
    recordWorkflowActivity(WORKFLOW_ACTIVITY_CONFIG.AREAS.mixer, WORKFLOW_ACTIVITY_EVENT.musicMixerStart, tracks.length, MUSIC_MIXER_SERVER.LOG_MIX_START(resultCount, songsPerResult));
    try {
      let source = trackOrder === "name" ? [...tracks].sort((a, b) => a.file.name.localeCompare(b.file.name)) : shuffle(tracks);
      if (trackOrder === "featured" && source.some((track) => !track.sourcePath)) throw new Error(text.PICK_FOLDER_AGAIN);
      const folders: ResultFolder[] = Array.from({ length: resultCount }, (_, index) => ({
        name: `${MUSIC_MIXER_SERVER.EMPTY_MIX_NAME_PREFIX}${String(index + 1).padStart(2, "0")}`,
        tracks: [],
      }));
      folderProjectIdsRef.current = folders.map((folder) => `${projectIdRef.current}-${folder.name}`);

      let cursor = 0;
      for (let row = 0; row < songsPerResult; row++) {
        for (const folder of folders) {
          let candidate = source[cursor++ % source.length];
          let attempts = 0;
          while (folder.tracks.includes(candidate) && attempts < source.length) {
            candidate = source[cursor++ % source.length];
            attempts++;
          }
          folder.tracks.push(candidate);
        }
      }
      const foldersWithSeo: ResultFolder[] = await Promise.all(folders.map(async (folder) => {
        if (!folder.tracks.every((track) => track.sourcePath)) return { ...folder, seo: createSeo(folder), seoOptions: [] };
        const folderProjectId = `${projectIdRef.current}-${folder.name}`;
        const response = await fetch(API_ROUTES.PIPELINE_MUSIC_MIXER_RANK, { method: "POST", signal: abortController.signal, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projectId: folderProjectId, tracks: folder.tracks.map((track) => ({ sourcePath: track.sourcePath, title: track.file.name })), model: seoModel, provider: seoProvider, executionMode: seoExecutionMode, chromeHeadless: seoChromeHeadless }) });
        const ranking = await response.json();
        if (!response.ok || !ranking.success) throw new Error(ranking.error || text.RANK_ERROR);
        const scores = new Map<number, { score: number; durationSeconds?: number }>(ranking.scores.map((item: { index: number; score: number; durationSeconds?: number }) => [item.index - 1, item]));
        const orderedTracks = folder.tracks.map((track, index) => ({ track: { ...track, durationSeconds: scores.get(index)?.durationSeconds || track.durationSeconds }, score: scores.get(index)?.score ?? 0 })).sort((a, b) => b.score - a.score).map((item) => item.track);
        const seoResponse = await fetch(API_ROUTES.PIPELINE_MUSIC_MIXER_SEO, { method: "POST", signal: abortController.signal, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ titles: orderedTracks.map((track) => cleanTrackTitle(track.file.name)), roomId: ranking.roomId, aiExecution: { provider: seoProvider, model: seoModel, chromeHeadless: seoChromeHeadless } }) });
        const seoPayload = await seoResponse.json();
        if (!seoResponse.ok || !seoPayload.success) throw new Error(seoPayload.error || text.RANK_ERROR);
        return { ...folder, tracks: orderedTracks, seo: createSeo({ ...folder, tracks: orderedTracks }), seoOptions: seoPayload.playlistSeoOptions || [] };
      }));
      setResults(foldersWithSeo);
      recordWorkflowActivity(WORKFLOW_ACTIVITY_CONFIG.AREAS.mixer, WORKFLOW_ACTIVITY_EVENT.musicMixerDone, folders.length, MUSIC_MIXER_SERVER.LOG_MIX_DONE);
      setError("");
      toast.success(`${text.RESULTS_TITLE}: ${folders.length} ${text.FOLDER_UNIT}`);
    } catch (err: any) {
      if (abortController.signal.aborted) { recordWorkflowActivity(WORKFLOW_ACTIVITY_CONFIG.AREAS.mixer, WORKFLOW_ACTIVITY_EVENT.musicMixerStop); return; }
      const message = err?.message || text.DROP_ERROR;
      setError(message);
      toast.error(message);
      recordWorkflowActivity(WORKFLOW_ACTIVITY_CONFIG.AREAS.mixer, WORKFLOW_ACTIVITY_EVENT.musicMixerFail, undefined, message);
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  };

  const stopGenerate = () => {
    const controller = abortRef.current;
    if (!controller) return;
    controller.abort();
    setBusy(false);
    recordWorkflowActivity(WORKFLOW_ACTIVITY_CONFIG.AREAS.mixer, WORKFLOW_ACTIVITY_EVENT.musicMixerStop);
    abortRef.current = null;
    const projectId = projectIdRef.current;
    projectIdRef.current = null;
    if (projectId) void fetch(API_ROUTES.PIPELINE_MUSIC_MIXER_CANCEL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projectIds: folderProjectIdsRef.current, projectId, provider: seoProvider }) }).catch(() => undefined);
  };

  const downloadAll = async () => {
    if (_.isEmpty(results)) return;
    setIsDownloading(true);
    setDownloadingFolder("all");
    setError("");
    try {
      const zip = new JSZip();
      for (const folder of results) for (const [index, track] of folder.tracks.entries()) zip.folder(folder.name)!.file(numberedName(track.file, index), await ensureTrackFile(track));
      results.forEach((folder) => { const seo = folder.seo || createSeo(folder); zip.folder(folder.name)!.file("SEO.json", JSON.stringify({ ...seo, options: folder.seoOptions || [] }, null, 2)).file("SEO.txt", formatSeoText(folder)); });
      const blob = await zip.generateAsync({ type: "blob", compression: "STORE" });
      await saveZip(blob, `music-mixes-${Date.now()}.zip`);
      toast.success(text.ZIP_SUCCESS);
    } catch {
      setError(text.ZIP_ERROR);
      toast.error(text.ZIP_ERROR);
    } finally {
      setIsDownloading(false);
      setDownloadingFolder(null);
    }
  };

  const downloadFolder = async (folder: ResultFolder) => {
    setIsDownloading(true);
    setDownloadingFolder(folder.name);
    try {
      const zip = new JSZip();
      for (const [index, track] of folder.tracks.entries()) zip.file(numberedName(track.file, index), await ensureTrackFile(track));
      const seo = folder.seo || createSeo(folder); zip.file("SEO.json", JSON.stringify({ ...seo, options: folder.seoOptions || [] }, null, 2)).file("SEO.txt", formatSeoText(folder));
      const blob = await zip.generateAsync({ type: "blob", compression: "STORE" });
      await saveZip(blob, `${folder.name}.zip`);
      toast.success(`${text.ZIP_SUCCESS} (${folder.name})`);
    } catch {
      setError(text.ZIP_ERROR);
      toast.error(text.ZIP_ERROR);
    } finally {
      setIsDownloading(false);
      setDownloadingFolder(null);
    }
  };

  const isInsufficient = songsPerResult > tracks.length && tracks.length > 0;
  const isFormValid = tracks.length > 0 && songsPerResult >= 1 && resultCount >= 1 && !isInsufficient;
  const isBusy = busy || isDownloading;

  return (
    <div
      aria-busy={isBusy}
      className={cn(
        "creation-workspace w-full h-full min-h-0 flex flex-col overflow-y-auto p-4 sm:p-6 bg-slate-955 font-sans text-slate-100 custom-scrollbar",
      )}
    >
      <div
        className={cn(
          "bg-gradient-to-b from-slate-900/90 to-slate-950/95 rounded-xl sm:rounded-2xl p-4 sm:p-6 space-y-5 shadow-2xl relative overflow-visible w-full border border-slate-800/80",
        )}
      >
        <div
          className={cn(
            "glass-card rounded-2xl p-4 sm:p-5 shadow-lg border border-slate-800/80 bg-slate-900/60 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4",
          )}
        >
          <div className={cn("flex items-center gap-3 min-w-0")}>
            <div
              className={cn(
                "w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-500 via-indigo-500 to-pink-600 p-0.5 shadow-md shadow-indigo-500/20 shrink-0",
              )}
            >
              <div
                className={cn(
                  "w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-indigo-400",
                )}
              >
                <Shuffle className={cn("w-5 h-5")} />
              </div>
            </div>
            <div className={cn("min-w-0")}>
              <div className={cn("flex items-center gap-2 flex-wrap")}>
                <h1
                  className={cn(
                    "text-base sm:text-lg font-black text-slate-100 tracking-tight uppercase font-sans",
                  )}
                >
                  {text.HEADER_TITLE}
                </h1>
                <span
                  className={cn(
                    "px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider bg-purple-500/15 border border-purple-500/30 text-purple-300 flex items-center gap-1 shadow-xs",
                  )}
                >
                  <Sparkles className={cn("w-2.5 h-2.5 text-purple-400")} />
                  {text.HEADER_BADGE}
                </span>
              </div>
              <p className={cn("text-[11px] text-slate-400 mt-0.5")}>{text.HEADER_DESC}</p>
            </div>
          </div>

          <div className={cn("flex items-center gap-2 self-start sm:self-auto")}>
            <Tooltip content={text.AI_CONFIG_TOOLTIP} align="end">
              <Button
                variant="unstyled"
                type="button"
                onClick={() => setIsAiConfigOpen(!isAiConfigOpen)}
                disabled={isBusy}
                className={cn(
                  "group inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-xs leading-none",
                  {
                    "bg-purple-600/15 border-purple-500/50 text-purple-700 dark:text-purple-300 shadow-purple-500/10": isAiConfigOpen,
                    "bg-white/95 hover:bg-purple-50/90 border-slate-200/90 hover:border-purple-300/80 text-slate-800 hover:text-purple-700 dark:bg-slate-900/90 dark:hover:bg-slate-850 dark:border-slate-800 dark:hover:border-purple-500/40 dark:text-slate-200 dark:hover:text-purple-300": !isAiConfigOpen,
                  },
                )}
              >
                <SlidersHorizontal className={cn("w-3.5 h-3.5 text-purple-500 dark:text-purple-400 shrink-0 group-hover:scale-105 transition-transform")} />
                <span className={cn("inline-flex items-center leading-none text-slate-800 dark:text-slate-200 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors")}>
                  {text.AI_CONFIG_TITLE}
                </span>
                {isAiConfigOpen ? (
                  <ChevronUp className={cn("w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0 transition-colors")} />
                ) : (
                  <ChevronDown className={cn("w-3.5 h-3.5 text-slate-500 dark:text-slate-400 group-hover:text-purple-600 dark:group-hover:text-purple-300 shrink-0 transition-colors")} />
                )}
              </Button>
            </Tooltip>
          </div>
        </div>

        {isAiConfigOpen && (
          <fieldset disabled={isBusy} className={cn("glass-card rounded-2xl p-4 bg-slate-900/80 border border-slate-800/90 shadow-xl space-y-4")}>
            <ChatPlanningSettingsBlock
              provider={seoProvider}
              model={seoModel}
              executionMode={seoExecutionMode}
              chromeHeadless={seoChromeHeadless}
              onProviderChange={setSeoProvider}
              onModelChange={setSeoModel}
              onExecutionModeChange={setSeoExecutionMode}
              onChromeHeadlessChange={setSeoChromeHeadless}
              currentLang={currentLang}
            />
          </fieldset>
        )}


        <div className={cn("grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch")}>
          <div className={cn("lg:col-span-2 flex flex-col min-w-0 h-full")}>
            <div
              className={cn(
                "glass-card rounded-2xl sm:rounded-3xl p-5 shadow-xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-xl relative overflow-hidden text-left w-full h-full flex flex-col justify-start gap-4",
              )}
            >
              <div className={cn("flex items-center justify-between relative z-10 flex-wrap gap-2")}>
                <div className={cn("flex items-center gap-2.5 min-w-0")}>
                  <span
                    className={cn(
                      "w-6 h-6 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center font-mono font-black text-xs shadow-sm shadow-purple-500/20",
                    )}
                  >
                    {text.STEP_01}
                  </span>
                  <h3
                    className={cn(
                      "text-xs font-bold uppercase tracking-wider text-slate-100 font-mono flex items-center gap-1.5",
                    )}
                  >
                    <FolderOpen className={cn("w-3.5 h-3.5 text-purple-400")} />
                    <span>{text.SOURCE_TITLE}</span>
                    <span
                      className={cn(
                        "px-1.5 py-0.2 rounded text-[9px] bg-purple-500/15 border border-purple-500/30 text-purple-300 font-mono",
                      )}
                    >
                      {text.SOURCE_BADGE}
                    </span>
                  </h3>
                </div>

                <div className={cn("flex items-center gap-1.5")}>
                  <Tooltip content={isSelectingFolder ? text.SELECTING_FOLDER : text.PICK_FOLDER_BTN} align="end">
                    <Button
                      variant="unstyled"
                      type="button"
                      onClick={chooseFolder}
                      disabled={isBusy || isSelectingFolder}
                      className={cn(
                        "w-8 h-8 bg-transparent hover:bg-transparent border-0 text-slate-400 hover:text-purple-300 flex items-center justify-center cursor-pointer transition-colors shrink-0 p-0 shadow-none outline-none disabled:opacity-50",
                      )}
                    >
                      {isSelectingFolder ? <Sparkles className="w-4 h-4 animate-spin text-purple-400" /> : <FolderPlus className={cn("w-4 h-4 shrink-0")} />}
                    </Button>
                  </Tooltip>
                  {tracks.length > 0 && (
                    <Tooltip content={text.CLEAR_ALL_BTN} align="end">
                      <Button
                        variant="unstyled"
                        type="button"
                        onClick={handleClearAll}
                        disabled={isBusy}
                        className={cn(
                          "w-8 h-8 bg-transparent hover:bg-transparent border-0 text-slate-400 hover:text-rose-400 flex items-center justify-center cursor-pointer transition-colors shrink-0 p-0 shadow-none outline-none disabled:opacity-50",
                        )}
                      >
                        <Trash2 className="w-4 h-4 shrink-0" />
                      </Button>
                    </Tooltip>
                  )}
                  <input
                    ref={fileInputRef}
                    className={cn("sr-only")}
                    type="file"
                    {...{ webkitdirectory: "true", directory: "true", multiple: true }}
                    onChange={onFiles}
                  />
                </div>
              </div>

              <div
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={chooseFolder}
                className={cn(
                  "border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2.5 select-none shrink-0",
                  {
                    "border-purple-400 bg-purple-500/15 ring-2 ring-purple-500/30 scale-[1.01]": isDragOver,
                    "border-slate-800/80 hover:border-purple-500/50 bg-slate-900/50 hover:bg-slate-900/80": !isDragOver,
                  },
                )}
              >
                <div
                  className={cn(
                    "w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-500/15 via-indigo-500/15 to-pink-500/15 border border-purple-500/30 flex items-center justify-center text-purple-300 shadow-md shadow-purple-500/10",
                  )}
                >
                  <FolderPlus className={cn("w-6 h-6")} />
                </div>
                <div className={cn("text-center")}>
                  <p className={cn("text-xs font-bold text-slate-100")}>{text.SOURCE_DROP_TITLE}</p>
                  <p className={cn("text-[11px] text-slate-400 mt-0.5")}>{text.SOURCE_DROP_HINT}</p>
                </div>
              </div>

              <div className={cn("space-y-2 pt-1 flex-1 flex flex-col min-h-0 justify-start")}>
                <div className={cn("flex items-center justify-between text-[11px] font-mono text-slate-400 shrink-0")}>
                  <span className={cn("flex items-center gap-1.5 font-bold text-slate-200")}>
                    <Layers className={cn("w-3.5 h-3.5 text-purple-400")} />
                    <span>
                      {text.TOTAL_LOADED}: <strong className="text-purple-300 font-bold">{tracks.length}</strong> {text.TRACK_UNIT}
                    </span>
                  </span>
                  <span className={cn("px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-300")}>
                    {groups.length} {text.FOLDER_UNIT}
                  </span>
                </div>

                {_.isEmpty(groups) ? (
                  <div
                    className={cn(
                      "flex-1 min-h-[140px] flex flex-col items-center justify-center p-6 rounded-2xl border border-dashed border-slate-800/80 bg-slate-900/40 text-center text-xs text-slate-400 italic",
                    )}
                  >
                    {text.EMPTY_SOURCE_HINT}
                  </div>
                ) : (
                  <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 w-full flex-1 min-h-0 overflow-y-auto custom-scrollbar p-0.5 auto-rows-max content-start")}>
                    {_.map(groups, ([name, items]) => {
                      const folderName = items[0]?.folder || name;
                      const folderPath = items[0]?.folderPath || name;
                      const displayTitle = getDisplayFolderName(folderName, folderPath);
                      return (
                        <div
                          key={name}
                          className={cn(
                            "group relative flex flex-col justify-between p-3 rounded-2xl border border-slate-800/90 bg-slate-900/90 hover:bg-slate-850 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-200 backdrop-blur-md gap-2.5 w-full",
                          )}
                        >
                          <div className={cn("flex items-center justify-between gap-2 min-w-0")}>
                            <div className={cn("flex items-center gap-2.5 min-w-0 flex-1")}>
                              <div className={cn("w-7 h-7 rounded-xl bg-gradient-to-tr from-purple-500/20 to-indigo-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300 shadow-xs shrink-0 group-hover:scale-105 transition-transform")}>
                                <FolderOpen className={cn("w-3.5 h-3.5")} />
                              </div>
                              <span className={cn("text-xs font-bold text-slate-100 truncate group-hover:text-purple-200 transition-colors")} title={displayTitle}>
                                {displayTitle}
                              </span>
                            </div>

                            <Tooltip content={text.CLEAR_FOLDER_TOOLTIP} align="end">
                              <Button
                                variant="unstyled"
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveFolder(name);
                                }}
                                disabled={isBusy}
                                className={cn(
                                  "w-5 h-5 bg-transparent hover:bg-transparent border-0 text-slate-500 hover:text-rose-400 flex items-center justify-center cursor-pointer transition-colors shrink-0 p-0 shadow-none outline-none",
                                )}
                              >
                                <X className={cn("w-3.5 h-3.5")} />
                              </Button>
                            </Tooltip>
                          </div>

                          <div className={cn("flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-[10px] font-mono min-w-0")}>
                            <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-purple-500/15 border border-purple-500/25 text-[10px] font-mono font-semibold text-purple-300 shrink-0")}>
                              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shadow-xs shadow-purple-400/80 shrink-0 animate-pulse"></span>
                              {items.length} {text.TRACK_UNIT}
                            </span>
                            {folderPath && (
                              <span className={cn("text-slate-400 truncate text-[10px] select-all text-right hover:text-slate-200 transition-colors")} title={folderPath}>
                                {folderPath}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className={cn("lg:col-span-1 flex flex-col gap-5 min-w-0 h-full")}>
            <div
              className={cn(
                "glass-card bg-slate-900/90 border border-slate-800/80 p-5 space-y-4 text-left relative overflow-hidden backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-xl",
              )}
            >
              <div className={cn("flex items-center justify-between border-b border-slate-800/80 pb-3")}>
                <div className={cn("flex items-center gap-2.5 min-w-0")}>
                  <div
                    className={cn(
                      "w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-rose-600 p-0.5 shadow-xs shadow-amber-500/20 shrink-0",
                    )}
                  >
                    <div className={cn("w-full h-full bg-slate-950 rounded-[6px] flex items-center justify-center")}>
                      <SlidersHorizontal className={cn("w-4 h-4 text-amber-400")} />
                    </div>
                  </div>
                  <div>
                    <h2
                      className={cn(
                        "text-xs font-bold uppercase tracking-wider text-slate-100 font-mono flex items-center gap-1.5",
                      )}
                    >
                      {text.CONFIG_TITLE}
                    </h2>
                  </div>
                </div>
                <span
                  className={cn(
                    "px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[9px] font-black tracking-normal",
                  )}
                >
                  {text.CONFIG_BADGE}
                </span>
              </div>

              <div className={cn("space-y-2")}>
                <div className={cn("flex items-center justify-between")}>
                  <label className={cn("text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider")}>
                    {text.SONGS_PER_RESULT_LABEL}
                  </label>
                  <span className={cn("text-xs font-mono font-bold text-purple-300")}>
                    {songsPerResult} {text.TRACK_UNIT}
                  </span>
                </div>

                <div className={cn("grid grid-cols-5 gap-1.5")}>
                  {_.map(PRESET_SONGS_PER_RESULT, (count) => {
                    const isSelected = _.isEqual(songsPerResult, count);
                    return (
                      <Button
                        variant="unstyled"
                        key={count}
                        type="button"
                        onClick={() => {
                          setSongsPerResult(count);
                          setResults([]);
                        }}
                        disabled={isBusy}
                        className={cn(
                          "h-8 rounded-xl border font-mono font-bold text-xs flex items-center justify-center transition-all cursor-pointer shadow-xs select-none",
                          {
                            "bg-gradient-to-r from-purple-600 to-pink-600 border-purple-400 text-white shadow-purple-600/30 shadow-md scale-[1.02]": isSelected,
                            "bg-slate-955/90 border-slate-800 text-slate-300 hover:text-white hover:border-purple-500/40 hover:bg-slate-900": !isSelected,
                          },
                        )}
                      >
                        <span>{count}</span>
                      </Button>
                    );
                  })}
                </div>

                <input
                  type="number"
                  min="1"
                  max={Math.max(1, tracks.length)}
                  value={songsPerResult}
                  onChange={(event) => {
                    setSongsPerResult(Math.max(1, Number(event.target.value)));
                    setResults([]);
                  }}
                  disabled={isBusy}
                  className={cn(
                    "w-full h-8.5 bg-slate-955/90 text-slate-100 px-3 rounded-xl text-xs font-mono outline-none shadow-inner border border-slate-800/80 focus:border-purple-500/80",
                  )}
                />
              </div>

              <div className={cn("space-y-2 pt-1")}>
                <div className={cn("flex items-center justify-between")}>
                  <label className={cn("text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider")}>
                    {text.RESULT_COUNT_LABEL}
                  </label>
                  <span className={cn("text-xs font-mono font-bold text-amber-300")}>
                    {resultCount} {text.FOLDER_UNIT}
                  </span>
                </div>

                <div className={cn("grid grid-cols-5 gap-1.5")}>
                  {_.map(PRESET_RESULT_COUNTS, (count) => {
                    const isSelected = _.isEqual(resultCount, count);
                    return (
                      <Button
                        variant="unstyled"
                        key={count}
                        type="button"
                        onClick={() => {
                          setResultCount(count);
                          setResults([]);
                        }}
                        disabled={isBusy}
                        className={cn(
                          "h-8 rounded-xl border font-mono font-bold text-xs flex items-center justify-center transition-all cursor-pointer shadow-xs select-none",
                          {
                            "bg-gradient-to-r from-amber-600 to-rose-600 border-amber-400 text-white shadow-amber-600/30 shadow-md scale-[1.02]": isSelected,
                            "bg-slate-955/90 border-slate-800 text-slate-300 hover:text-white hover:border-amber-500/40 hover:bg-slate-900": !isSelected,
                          },
                        )}
                      >
                        <span>{count}</span>
                      </Button>
                    );
                  })}
                </div>

                <input
                  type="number"
                  min="1"
                  max="100"
                  value={resultCount}
                  onChange={(event) => {
                    setResultCount(Math.max(1, Number(event.target.value)));
                    setResults([]);
                  }}
                  disabled={isBusy}
                  className={cn(
                    "w-full h-8.5 bg-slate-955/90 text-slate-100 px-3 rounded-xl text-xs font-mono outline-none shadow-inner border border-slate-800/80 focus:border-amber-500/80",
                  )}
                />
              </div>

              <div className={cn("space-y-2 pt-1")}>
                <div className={cn("flex items-center justify-between")}>
                  <label className={cn("text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider")}>
                    {text.TRACK_ORDER_LABEL}
                  </label>
                  <span className={cn("text-xs font-mono font-bold text-indigo-300")}>
                    {trackOrder === "random"
                      ? text.TRACK_ORDER_RANDOM
                      : trackOrder === "featured"
                        ? text.TRACK_ORDER_FEATURED
                        : text.TRACK_ORDER_NAME}
                  </span>
                </div>

                <div className={cn("grid grid-cols-3 gap-1.5")}>
                  {(
                    [
                      { id: "random", label: text.TRACK_ORDER_RANDOM },
                      { id: "featured", label: text.TRACK_ORDER_FEATURED },
                      { id: "name", label: text.TRACK_ORDER_NAME },
                    ] as const
                  ).map((item) => {
                    const isSelected = trackOrder === item.id;
                    return (
                      <Button
                        variant="unstyled"
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setTrackOrder(item.id);
                          setResults([]);
                        }}
                        disabled={isBusy}
                        className={cn(
                          "h-8 rounded-xl border font-mono font-bold text-xs flex items-center justify-center transition-all cursor-pointer shadow-xs select-none px-2",
                          {
                            "bg-gradient-to-r from-indigo-600 to-purple-600 border-indigo-400 text-white shadow-indigo-600/30 shadow-md scale-[1.02]": isSelected,
                            "bg-slate-955/90 border-slate-800 text-slate-300 hover:text-white hover:border-indigo-500/40 hover:bg-slate-900": !isSelected,
                          },
                        )}
                      >
                        <span className="truncate">{item.label}</span>
                      </Button>
                    );
                  })}
                </div>
              </div>

              <div
                className={cn(
                  "p-3 rounded-xl bg-slate-955/70 border border-slate-800/80 space-y-1.5 text-[11px] font-mono text-slate-400",
                )}
              >
                <div className={cn("flex items-center justify-between")}>
                  <span>{text.SUMMARY_TOTAL_SOURCE}:</span>
                  <span className={cn("font-bold text-slate-200")}>
                    {tracks.length} {text.TRACK_UNIT}
                  </span>
                </div>
                <div className={cn("flex items-center justify-between")}>
                  <span>{text.SUMMARY_SOURCE_FOLDERS}:</span>
                  <span className={cn("font-bold text-slate-200")}>
                    {groups.length} {text.FOLDER_UNIT}
                  </span>
                </div>
                <div className={cn("flex items-center justify-between")}>
                  <span>{text.SUMMARY_PER_FOLDER}:</span>
                  <span className={cn("font-bold text-purple-300")}>
                    {songsPerResult} {text.TRACK_UNIT}
                  </span>
                </div>
                <div className={cn("flex items-center justify-between border-t border-slate-800/60 pt-1.5")}>
                  <span>{text.SUMMARY_TOTAL_OUTPUT}:</span>
                  <span className={cn("font-bold text-amber-300")}>
                    {songsPerResult * resultCount} {text.TRACK_UNIT}
                  </span>
                </div>
              </div>

              {isInsufficient && (
                <div
                  role="alert"
                  className={cn(
                    "rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200 break-words flex items-start gap-2",
                  )}
                >
                  <AlertCircle className={cn("w-4 h-4 text-amber-400 shrink-0 mt-0.5")} />
                  <span>{text.INSUFFICIENT_WARNING}</span>
                </div>
              )}

              {error && (
                <div
                  role="alert"
                  className={cn(
                    "rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-200 break-words flex items-start gap-2",
                  )}
                >
                  <AlertCircle className={cn("w-4 h-4 text-rose-400 shrink-0 mt-0.5")} />
                  <span>{error}</span>
                </div>
              )}

              <div className={cn("space-y-2 pt-1")}>
                <div className={cn("flex items-center gap-2")}>
                  <Button
                    variant="unstyled"
                    type="button"
                    onClick={generate}
                    disabled={!isFormValid || busy}
                    className={cn(
                      "flex-1 h-11 min-h-[44px] px-4 rounded-xl font-extrabold text-xs inline-flex items-center justify-center gap-2 transition-all shadow-lg tracking-wider uppercase font-sans border leading-none",
                      {
                        "bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 border-purple-400/50 text-white cursor-wait animate-pulse": busy,
                        "bg-gradient-to-r from-rose-600 via-purple-600 to-indigo-600 hover:from-rose-500 hover:via-purple-500 hover:to-indigo-500 border-rose-400/40 shadow-rose-600/25 active:scale-[0.98] text-white cursor-pointer":
                          !busy && isFormValid,
                        "bg-slate-800/80 border-slate-700 text-slate-500 cursor-not-allowed shadow-none":
                          !busy && !isFormValid,
                      },
                    )}
                  >
                    {busy ? (
                      <>
                        <Sparkles className={cn("w-4 h-4 animate-spin text-white shrink-0")} />
                        <span className={cn("truncate inline-flex items-center leading-none")}>
                          {text.GENERATING_BTN}
                        </span>
                      </>
                    ) : (
                      <>
                        <Shuffle className={cn("w-4 h-4 shrink-0")} />
                        <span className={cn("inline-flex items-center leading-none")}>
                          {text.GENERATE_BTN}
                        </span>
                      </>
                    )}
                  </Button>
                  {busy && (
                    <Button
                      variant="unstyled"
                      type="button"
                      onClick={stopGenerate}
                      className={cn(
                        "h-11 min-h-[44px] px-4 rounded-xl border border-rose-500/40 bg-rose-500/15 hover:bg-rose-500/25 text-rose-200 text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer shrink-0",
                      )}
                    >
                      <Square className={cn("w-3.5 h-3.5 fill-rose-300/30")} />
                      <span>{text.STOP_BTN || "Dừng"}</span>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          className={cn(
            "glass-card rounded-2xl sm:rounded-3xl p-5 space-y-4 shadow-xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-xl relative overflow-hidden text-left w-full",
          )}
        >
          <div className={cn("flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4")}>
            <div className={cn("flex items-center gap-2.5 min-w-0")}>
              <span
                className={cn(
                  "w-6 h-6 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center font-mono font-black text-xs shadow-sm shadow-purple-500/20",
                )}
              >
                {text.STEP_03}
              </span>
              <div>
                <h3
                  className={cn(
                    "text-sm font-bold uppercase tracking-wider text-slate-100 font-mono flex items-center gap-2",
                  )}
                >
                  <Disc3 className={cn("w-4 h-4 text-purple-400", { "animate-spin": busy })} />
                  <span>{text.RESULTS_TITLE}</span>
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-full text-[9px] bg-purple-500/15 border border-purple-500/30 text-purple-300 font-mono",
                    )}
                  >
                    {busy
                      ? `${resultCount} ${text.FOLDER_UNIT} · ${songsPerResult} ${text.TRACK_UNIT}/${text.FOLDER_UNIT}`
                      : results.length > 0
                        ? `${results.length} ${text.FOLDER_UNIT} · ${songsPerResult} ${text.TRACK_UNIT}/${text.FOLDER_UNIT}`
                        : `0 ${text.FOLDER_UNIT}`}
                  </span>
                </h3>
              </div>
            </div>

            {!busy && results.length > 0 && (
              <Button
                variant="unstyled"
                type="button"
                onClick={downloadAll}
                disabled={isBusy}
                className={cn(
                  "h-9 px-4 rounded-xl font-bold text-xs inline-flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md leading-none bg-gradient-to-r from-rose-600 via-purple-600 to-indigo-600 hover:from-rose-500 hover:via-purple-500 hover:to-indigo-500 border border-rose-400/40 text-white shadow-rose-600/25 active:scale-95",
                )}
              >
                {isDownloading ? (
                  <>
                    <Sparkles className={cn("w-3.5 h-3.5 animate-spin")} />
                    <span>{text.DOWNLOADING_ZIP}</span>
                  </>
                ) : (
                  <>
                    <FileArchive className={cn("w-3.5 h-3.5")} />
                    <span>{text.DOWNLOAD_ALL_ZIP}</span>
                  </>
                )}
              </Button>
            )}
          </div>

          {busy ? (
            <div className={cn("py-16 flex flex-col items-center justify-center text-center space-y-4")}>
              <div className={cn("w-14 h-14 rounded-2xl border flex items-center justify-center shadow-lg bg-purple-500/15 border-purple-500/30 shadow-purple-500/20")}>
                <Disc3 className={cn("w-7 h-7 text-purple-400 animate-spin")} />
              </div>
              <div className={cn("space-y-1")}>
                <p className={cn("text-sm font-extrabold text-slate-200")}>
                  {text.GENERATING_BTN}
                </p>
                <p className={cn("text-xs text-slate-400 font-mono")}>
                  {`${resultCount} ${text.FOLDER_UNIT} • ${songsPerResult} ${text.TRACK_UNIT}/${text.FOLDER_UNIT}`}
                </p>
              </div>
            </div>
          ) : _.isEmpty(results) ? (
            <div className={cn("py-14 flex flex-col items-center justify-center text-center space-y-3.5")}>
              <div className={cn("w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center text-slate-500 shadow-inner")}>
                <Music2 className={cn("w-7 h-7 text-purple-400/80")} />
              </div>
              <div className={cn("space-y-1 max-w-sm")}>
                <h3 className={cn("text-sm font-extrabold text-slate-200")}>
                  {text.RESULTS_EMPTY_TITLE}
                </h3>
                <p className={cn("text-xs text-slate-400 leading-relaxed")}>
                  {text.RESULTS_EMPTY_DESC}
                </p>
              </div>
            </div>
          ) : (
            <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4")}>
              {_.map(results, (folder) => (
                <div
                  key={folder.name}
                  className={cn(
                    "rounded-2xl border border-slate-800/90 bg-slate-955/80 p-4 space-y-3 shadow-md hover:border-slate-700/80 transition-all flex flex-col justify-between",
                  )}
                >
                  <div className={cn("flex items-center justify-between gap-2 flex-wrap border-b border-slate-800/60 pb-2.5")}>
                    <div className={cn("flex items-center gap-2 min-w-0")}>
                      <div className={cn("w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0")}>
                        <Disc3 className={cn("w-3.5 h-3.5")} />
                      </div>
                      <span className={cn("text-xs font-bold text-purple-300 font-mono")}>
                        {folder.name}
                      </span>
                      <span className={cn("text-[10px] font-mono text-slate-400 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800")}>
                        {folder.tracks.length} {text.TRACK_UNIT}
                      </span>
                    </div>

                    <Button
                      variant="unstyled"
                      type="button"
                      onClick={() => downloadFolder(folder)}
                      disabled={busy || (isDownloading && downloadingFolder !== folder.name)}
                      className={cn(
                        "h-7 px-2.5 rounded-lg border border-purple-500/30 bg-purple-500/15 hover:bg-purple-600 hover:border-purple-600 text-purple-300 hover:text-white text-[11px] font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-xs leading-none",
                      )}
                    >
                      {downloadingFolder === folder.name ? <Sparkles className={cn("w-3 h-3 animate-spin")} /> : <Download className={cn("w-3 h-3")} />}
                      <span>{downloadingFolder === folder.name ? text.DOWNLOADING_ZIP : text.DOWNLOAD_FOLDER_ZIP}</span>
                    </Button>
                  </div>

                  <div className={cn("grid grid-cols-1 gap-1.5 max-h-60 overflow-y-auto custom-scrollbar p-0.5 flex-1")}>
                    {_.map(folder.tracks, (track, index) => (
                      <div
                        key={`${folder.name}-${track.path}-${index}`}
                        className={cn(
                          "flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-900/60 border border-slate-800/60 text-xs hover:border-slate-700/80 transition-colors",
                        )}
                      >
                        <div className={cn("flex items-center gap-2 min-w-0")}>
                          <Music2 className={cn("w-3 h-3 text-indigo-400 shrink-0")} />
                          <span className={cn("font-mono text-slate-400 text-[10px] shrink-0")}>
                            {String(index + 1).padStart(2, "0")}.
                          </span>
                          <span className={cn("font-medium text-slate-200 truncate text-[11px]")}>
                          {cleanTrackTitle(track.file.name)}
                          </span>
                        </div>
                        <span className={cn("text-[10px] font-mono text-slate-500 shrink-0 px-1.5 py-0.2 rounded bg-slate-955 border border-slate-800/80")}>
                          {track.folder}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MusicMixer;

