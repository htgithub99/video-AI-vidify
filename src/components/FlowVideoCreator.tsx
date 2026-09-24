import { useEffect, useState } from "react";
import {
  Film,
  FolderOpen,
    Settings2,
  Sparkles,
  WandSparkles,
  Copy,
  Check,
  Trash2,
  Maximize2,
  AlertTriangle,
  FolderCheck,
  Video,
} from "lucide-react";
import { toast } from "sonner";
import { API_ROUTES, FLOW_DIRECT_VIDEO_CONFIG } from "../constants";
import { Lang } from "../lib/lang";
import {
  AiPlanningChatModel,
  AiPlanningExecutionMode,
  AiPlanningFallbackProvider,
  AspectRatio,
  GenerateType,
  ImageGenerationMode,
  ImageGeneratorEngine,
  StoryboardScene,
  VideoProject,
} from "../types";
import {
  submitProjectFlowVideoBatch,
  recoverProjectFlowVideo,
} from "../services/projectImageGenerationService";
import ChatPlanningSettingsBlock from "./common/ChatPlanningSettingsBlock";
import { Button } from "./ui/Button";
import { Modal } from "./ui/Modal";
import { cn } from "../lib/utils";
import { jsonUtils } from "../lib/json";

type Clip = {
  id: string;
  prompt: string;
  url?: string;
  savedPath?: string;
  status: "waiting" | "generating" | "done" | "failed";
  error?: string;
};

interface PersistedState {
  projectId?: string;
  request?: string;
  folderPath?: string;
  clips?: Clip[];
  provider?: AiPlanningFallbackProvider;
  model?: AiPlanningChatModel;
  executionMode?: AiPlanningExecutionMode;
  chromeHeadless?: boolean;
}

const LOCAL_STORAGE_KEY = "flow-video-creator-state-v1";

const readSavedState = () => jsonUtils.getItem<PersistedState>(LOCAL_STORAGE_KEY, {});

const SAMPLE_PROMPTS = [
  {
    title: "Bolero trữ tình",
    text: "Tạo 10 video phong cảnh đồng quê Việt Nam, cánh đồng lúa vàng, sông quê chiều tà, hoàng hôn buông xuống và mưa rào nhẹ nhàng làm nền cho video nhạc bolero trữ tình",
  },
  {
    title: "Lo-fi Chillout",
    text: "Tạo 10 video không gian quán cà phê ấm cúng ban đêm, trời mưa ngoài cửa kính, ánh đèn vàng lung linh, góc học tập vintage phong cách Lo-fi chillout",
  },
  {
    title: "Thiên nhiên 4K",
    text: "Tạo 10 video flycam góc rộng 4K quay phong cảnh núi rừng Tây Bắc hùng vĩ, thác nước trắng xóa, biển mây bồng bềnh và thung lũng xanh mướt tuyệt đẹp",
  },
  {
    title: "Cyberpunk Neon",
    text: "Tạo 10 video thành phố tương lai cyberpunk rực rỡ ánh đèn neon tím hồng, xe bay lướt trong màn mưa đêm, công nghệ holographic 3D hiện đại",
  },
];

export default function FlowVideoCreator({
  currentLang,
  projects,
  selectedProjectId,
}: {
  currentLang: Lang;
  projects: VideoProject[];
  selectedProjectId: string | null;
}) {
  const [saved] = useState(readSavedState);
  const [projectId, setProjectId] = useState<string>(saved.projectId || "");
  const [request, setRequest] = useState<string>(saved.request || "");
  const [folderPath, setFolderPath] = useState<string>(saved.folderPath || "");
  const [clips, setClips] = useState<Clip[]>(saved.clips || []);
  const [provider, setProvider] = useState<AiPlanningFallbackProvider>(
    saved.provider || AiPlanningFallbackProvider.ChatGptUi,
  );
  const [model, setModel] = useState<AiPlanningChatModel>(
    saved.model || AiPlanningChatModel.ChatGptAuto,
  );
  const [executionMode, setExecutionMode] = useState<AiPlanningExecutionMode>(
    saved.executionMode || AiPlanningExecutionMode.RoomOnly,
  );
  const [chromeHeadless, setChromeHeadless] = useState<boolean>(
    saved.chromeHeadless ?? true,
  );
  const [showSettings, setShowSettings] = useState(false);
  const [busy, setBusy] = useState<"planning" | "generating" | null>(null);
  const [progress, setProgress] = useState("");
  const [copiedPromptId, setCopiedPromptId] = useState<string | null>(null);
  const [isCopiedAll, setIsCopiedAll] = useState(false);
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);
  const [clipToDelete, setClipToDelete] = useState<Clip | null>(null);
  const [showClearAllModal, setShowClearAllModal] = useState(false);

  const isVi = currentLang === "vi";

  useEffect(() => {
    jsonUtils.setItem(
      LOCAL_STORAGE_KEY,
      {
        projectId,
        request,
        folderPath,
        clips,
        provider,
        model,
        executionMode,
        chromeHeadless,
      },
    );
  }, [
    projectId,
    request,
    folderPath,
    clips,
    provider,
    model,
    executionMode,
    chromeHeadless,
  ]);

  useEffect(() => {
    if (!projectId) {
      const selected = projects.find((project) => project.id === selectedProjectId);
      const film =
        projects.find((project) => project.parentId === selectedProjectId && project.projectKind === "cinematic") ||
        projects.find((project) => project.projectKind === "cinematic");
      setProjectId(selected?.projectKind === "container" ? film?.id || "" : selected?.id || film?.id || "");
    }
  }, [selectedProjectId, projectId, projects]);

  const chooseFolder = async () => {
    try {
      const response = await fetch(API_ROUTES.PIPELINE_SELECT_FOLDER, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || (isVi ? "Không thể chọn thư mục." : "Unable to select folder."));
      if (data.folderPath) setFolderPath(data.folderPath);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : (isVi ? "Không thể chọn thư mục." : "Unable to select folder."));
    }
  };

  const post = async (url: string, body: object) => {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (!response.ok || data.success === false) {
      throw new Error(data.error || data.warning || (isVi ? "Yêu cầu thất bại." : "Request failed."));
    }
    return data;
  };

  const plan = async () => {
    if (!request.trim()) {
      return toast.error(isVi ? "Vui lòng nhập yêu cầu tạo video." : "Please enter your video request.");
    }
    setBusy("planning");
    try {
      const data = await post(API_ROUTES.PIPELINE_PLAN_FLOW_VIDEO_PROMPTS, {
        request: request.trim(),
        projectId: projectId || undefined,
        execution: { provider, model, mode: executionMode, chromeHeadless },
      });
      const generatedPrompts: string[] = data.prompts || [];
      setClips(
        generatedPrompts.map((prompt: string, index: number) => ({
          id: `flowclip-${Date.now()}-${index + 1}`,
          prompt,
          status: "waiting",
        })),
      );
      toast.success(isVi ? `Đã viết ${generatedPrompts.length} prompt.` : `Generated ${generatedPrompts.length} prompts.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : (isVi ? "Không thể viết prompt." : "Failed to plan prompts."));
    } finally {
      setBusy(null);
    }
  };

  const generate = async () => {
    if (!projectId) {
      return toast.error(isVi ? "Chọn hoặc tạo dự án trước khi tạo video." : "Please select or create a project first.");
    }
    if (!folderPath) {
      return toast.error(isVi ? "Chọn thư mục lưu video." : "Please select destination folder.");
    }
    const pending = clips.filter((clip) => clip.status !== "done");
    const unsaved = clips.filter((clip) => clip.url && !clip.savedPath);
    if (!pending.length && !unsaved.length) return;

    setBusy("generating");
    try {
      for (const clip of unsaved) {
        try {
          const saved = await post(API_ROUTES.PIPELINE_SAVE_FLOW_VIDEOS, { projectId, folderPath, sceneIds: [clip.id] });
          setClips((before) => before.map((item) => item.id === clip.id ? { ...item, savedPath: saved.savedPaths?.[0], error: undefined } : item));
        } catch (error) {
          setClips((before) => before.map((item) => item.id === clip.id ? { ...item, error: error instanceof Error ? error.message : "Không thể lưu video." } : item));
        }
      }
      if (!pending.length) return;
      const response = await fetch(`${API_ROUTES.PROJECTS}/${encodeURIComponent(projectId)}`);
      if (!response.ok) throw new Error(isVi ? "Không thể tải dự án." : "Failed to load project.");
      const project: VideoProject = await response.json();
      const existing = project.storyboard || [];
      const scenes: StoryboardScene[] = pending.map((clip) => ({
        id: clip.id,
        chapterId: "flow-video-clips",
        startTime: "00:00:00",
        endTime: "00:00:08",
        duration: 8,
        script: clip.prompt,
        subtitle: "",
        prompt: clip.prompt,
        cameraMotion: "",
        assetType: GenerateType.Video,
      }));

      const nextProject: VideoProject = {
        ...project,
        storyboard: [
          ...existing.filter((scene) => !pending.some((clip) => clip.id === scene.id)),
          ...scenes,
        ],
        visualConfig: {
          ...project.visualConfig,
          generationMode: ImageGenerationMode.LabsFlow,
          imageGeneratorEngine: ImageGeneratorEngine.Veo3,
          generateType: GenerateType.Video,
          aspectRatio: project.visualConfig?.aspectRatio || AspectRatio.SixteenNine,
          videoDuration: project.visualConfig?.videoDuration || FLOW_DIRECT_VIDEO_CONFIG.DEFAULT_DURATION,
          videoResolution: project.visualConfig?.videoResolution || FLOW_DIRECT_VIDEO_CONFIG.DEFAULT_RESOLUTION,
        },
        updatedAt: new Date().toISOString(),
      };

      const save = await fetch(`${API_ROUTES.PROJECTS}/${encodeURIComponent(projectId)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nextProject),
      });
      if (!save.ok) throw new Error(isVi ? "Không thể lưu prompt vào dự án." : "Failed to save prompts into project.");

      let flowProjectId = project.visualConfig?.flowProjectId;
      for (let offset = 0; offset < pending.length; offset += FLOW_DIRECT_VIDEO_CONFIG.PROMPTS_PER_BATCH) {
        const batch = pending.slice(offset, offset + FLOW_DIRECT_VIDEO_CONFIG.PROMPTS_PER_BATCH);
        setProgress(
          isVi
            ? `Đang tạo ${offset + 1}–${Math.min(offset + batch.length, pending.length)}/${pending.length}`
            : `Generating ${offset + 1}–${Math.min(offset + batch.length, pending.length)}/${pending.length}`,
        );
        setClips((before) =>
          before.map((clip) =>
            batch.some((item) => item.id === clip.id) ? { ...clip, status: "generating" } : clip,
          ),
        );

        try {
          const result = await submitProjectFlowVideoBatch(
            batch.map((clip) => ({
              sceneId: clip.id,
              prompt: clip.prompt,
              generateType: GenerateType.Video,
            })),
            { ...nextProject.visualConfig, flowProjectId, generateCount: 1 },
            { localProjectId: projectId, flowProjectId },
          );

          if (result.newProjectId) flowProjectId = result.newProjectId;

          for (const clip of batch) {
            const generated = result.results.find((item) => item.sceneId === clip.id);
            if (!generated?.success) {
              setClips((before) =>
                before.map((item) =>
                  item.id === clip.id
                    ? {
                        ...item,
                        status: "failed",
                        error: generated?.warning || result.warning || (isVi ? "Flow không tạo được video." : "Flow failed to generate video."),
                      }
                    : item,
                ),
              );
              continue;
            }

            const mediaIds = generated.remoteMediaIds?.length
              ? generated.remoteMediaIds
              : generated.remoteMediaId
                ? [generated.remoteMediaId]
                : [];
            let url = generated.fallbackUrl;

            if (!url && mediaIds.length) {
              for (let attempt = 0; attempt < 4 && !url; attempt++) {
                const recovered = await recoverProjectFlowVideo({
                  projectId,
                  sceneId: clip.id,
                  mediaIds,
                  expectedOutputCount: 1,
                });
                if (recovered.success) url = recovered.fallbackUrl;
                else if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, 3000));
              }
            }

            let savedPath: string | undefined;
            let saveError: string | undefined;
            if (url) {
              try {
                const savedRes = await post(API_ROUTES.PIPELINE_SAVE_FLOW_VIDEOS, {
                  projectId,
                  folderPath,
                  sceneIds: [clip.id],
                });
                savedPath = savedRes.savedPaths?.[0];
              } catch (error) {
                saveError = error instanceof Error ? error.message : (isVi ? "Không thể lưu vào thư mục." : "Failed to save into chosen folder.");
              }
            }

            setClips((before) =>
              before.map((item) =>
                item.id === clip.id
                  ? {
                      ...item,
                      url,
                      savedPath,
                      status: url ? "done" : "failed",
                      error:
                        saveError ||
                        (url
                          ? undefined
                          : isVi
                            ? "Video đã tạo nhưng chưa tải về được. Bấm Tạo video để thử lại."
                            : "Video created but download pending. Click Generate to retry."),
                    }
                  : item,
              ),
            );
          }
        } catch (error) {
          setClips((before) =>
            before.map((item) =>
              batch.some((clip) => clip.id === item.id)
                ? {
                    ...item,
                    status: "failed",
                    error: error instanceof Error ? error.message : (isVi ? "Lỗi Flow" : "Flow Error"),
                  }
                : item,
            ),
          );
        }
      }
      toast.success(isVi ? "Đã xử lý xong danh sách video." : "Batch video processing completed.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : (isVi ? "Không thể tạo video." : "Failed to create videos."));
    } finally {
      setBusy(null);
      setProgress("");
    }
  };

  const handleCopyPrompt = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPromptId(id);
    toast.success(isVi ? "Đã chép prompt." : "Prompt copied.");
    setTimeout(() => setCopiedPromptId(null), 2000);
  };

  const handleCopyAllPrompts = () => {
    if (!clips.length) return;
    const allText = clips.map((c, i) => `${i + 1}. ${c.prompt}`).join("\n\n");
    navigator.clipboard.writeText(allText);
    setIsCopiedAll(true);
    toast.success(isVi ? `Đã chép ${clips.length} prompt.` : `Copied ${clips.length} prompts.`);
    setTimeout(() => setIsCopiedAll(false), 2000);
  };

  const handleDeleteClip = (clip: Clip) => {
    setClipToDelete(clip);
  };

  const handleClearAllPrompts = () => {
    if (!clips.length) return;
    setShowClearAllModal(true);
  };

  const confirmDeleteClip = () => {
    if (!clipToDelete) return;
    setClips((prev) => prev.filter((c) => c.id !== clipToDelete.id));
    setClipToDelete(null);
    toast.success(isVi ? "Đã xóa prompt." : "Prompt deleted.");
  };

  const confirmClearAllPrompts = () => {
    setClips([]);
    setShowClearAllModal(false);
    toast.info(isVi ? "Đã xóa toàn bộ danh sách prompt." : "Cleared all prompts.");
  };

  const readyClipsCount = clips.filter((clip) => clip.status !== "done").length;
  const unsavedVideosCount = clips.filter((clip) => clip.url && !clip.savedPath).length;
  const completedVideosCount = clips.filter((clip) => clip.url).length;

  return (
    <div className="creation-workspace w-full h-full min-h-0 flex flex-col overflow-y-auto p-4 sm:p-6 bg-slate-955 font-sans text-slate-100 custom-scrollbar">
      <div className="bg-gradient-to-b from-slate-900/90 to-slate-950/95 rounded-2xl p-4 sm:p-6 space-y-6 shadow-2xl relative overflow-visible w-full border border-slate-800/80">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-600 via-fuchsia-600 to-rose-500 flex items-center justify-center shadow-lg shadow-purple-500/30 text-white shrink-0">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-white">
                  {isVi ? "Tạo video bằng Flow" : "Create Videos with Flow"}
                </h1>
                <span className="text-[10px] font-bold uppercase font-mono px-2 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300">
                  AI Flow
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isVi
                  ? "AI viết prompt từ yêu cầu, Flow tạo video và lưu vào thư mục bạn chọn."
                  : "AI writes prompts from your concept, Flow renders and auto-saves to your chosen folder."}
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="unstyled"
            onClick={() => setShowSettings(!showSettings)}
            className={cn(
              "h-9 px-3 rounded-xl border text-xs font-semibold inline-flex items-center gap-2 transition-all cursor-pointer select-none",
              showSettings
                ? "border-purple-500/60 bg-purple-500/20 text-purple-300"
                : "border-slate-800 hover:border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white",
            )}
          >
            <Settings2 className="w-4 h-4 text-purple-400" />
            <span>{isVi ? "Cấu hình phòng chat AI" : "AI Settings"}</span>
          </Button>
        </div>
        {showSettings && (
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/90 border border-purple-500/30 shadow-inner">
            <ChatPlanningSettingsBlock
              provider={provider}
              model={model}
              executionMode={executionMode}
              chromeHeadless={chromeHeadless}
              onProviderChange={setProvider}
              onModelChange={setModel}
              onExecutionModeChange={setExecutionMode}
              onChromeHeadlessChange={setChromeHeadless}
              currentLang={currentLang}
            />
          </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          <div className="lg:col-span-6 flex flex-col justify-between gap-4 glass-card rounded-2xl sm:rounded-3xl p-5 shadow-xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-xl">
            <div className="space-y-3.5 flex-1 flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center font-mono font-bold text-xs">
                    01
                  </span>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-100 font-mono flex items-center gap-1.5">
                    <WandSparkles className="w-3.5 h-3.5 text-purple-400" />
                    {isVi ? "Yêu cầu tạo video" : "Prompt Request"}
                  </h2>
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                  <Sparkles className="w-3 h-3 text-purple-400" />
                  <span>{isVi ? "Gợi ý mẫu" : "Quick Samples"}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {SAMPLE_PROMPTS.map((sample) => (
                    <button
                      key={sample.title}
                      type="button"
                      disabled={!!busy}
                      onClick={() => setRequest(sample.text)}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-medium border border-purple-500/20 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 hover:text-white transition-all cursor-pointer disabled:opacity-50"
                    >
                      {sample.title}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex-1 min-h-[130px] flex flex-col">
                <textarea
                  value={request}
                  onChange={(event) => setRequest(event.target.value)}
                  disabled={!!busy}
                  placeholder={
                    isVi
                      ? "Ví dụ: Tạo 20 video phong cảnh đồng quê, hoàng hôn và mưa chiều làm nền cho video nhạc bolero..."
                      : "E.g.: Create 20 countryside landscape videos with sunset and gentle rain..."
                  }
                  className="w-full flex-1 min-h-[130px] rounded-xl border border-slate-800 bg-slate-955/90 p-3 text-xs text-slate-100 placeholder:text-slate-500 outline-none resize-y focus:border-purple-500/80 focus:ring-1 focus:ring-purple-500/20 transition-all custom-scrollbar leading-relaxed"
                />
              </div>
              <Button
                type="button"
                variant="unstyled"
                disabled={!!busy || !request.trim()}
                onClick={plan}
                className={cn(
                  "w-full h-10 px-4 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-2 transition-all shadow-md select-none cursor-pointer leading-none",
                  busy === "planning"
                    ? "bg-purple-600/50 text-purple-200 border border-purple-400/30 cursor-wait"
                    : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white border border-purple-400/30 shadow-purple-600/20 active:scale-98",
                )}
              >
                {busy === "planning" ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin shrink-0 text-fuchsia-300" />
                    <span>{isVi ? "Đang viết prompt…" : "Writing prompts…"}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 shrink-0" />
                    <span>{isVi ? "AI viết prompt" : "AI Write Prompts"}</span>
                  </>
                )}
              </Button>
            </div>
            <div className="pt-3 border-t border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <FolderCheck className="w-4 h-4 text-rose-400" />
                  <span className="text-xs font-bold text-slate-200">{isVi ? "Cấu hình Flow" : "Flow Settings"}</span>
                </div>
                {folderPath && (
                  <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                    <Check className="w-3 h-3" /> {isVi ? "Đã chọn thư mục" : "Selected"}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                <div
                  onClick={!busy ? chooseFolder : undefined}
                  className={cn(
                    "sm:col-span-7 flex items-center justify-between gap-2 rounded-xl border p-2.5 bg-slate-955/90 transition-all",
                    folderPath
                      ? "border-purple-500/40 hover:border-purple-500"
                      : "border-dashed border-slate-700 hover:border-purple-500/60",
                    busy ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FolderOpen className="w-4 h-4 text-purple-400 shrink-0" />
                    <span className="text-xs font-medium text-slate-200 truncate">
                      {folderPath || (isVi ? "Chọn thư mục lưu..." : "Select folder...")}
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-purple-300 shrink-0">
                    {folderPath ? (isVi ? "Đổi" : "Change") : (isVi ? "Chọn" : "Browse")}
                  </span>
                </div>

                <Button
                  type="button"
                  variant="unstyled"
                  disabled={!!busy || (!readyClipsCount && !unsavedVideosCount) || !folderPath}
                  onClick={generate}
                  className={cn(
                    "sm:col-span-5 h-full min-h-[42px] px-3 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-2 transition-all shadow-lg select-none leading-none",
                    (!readyClipsCount && !unsavedVideosCount) || !folderPath
                      ? "border border-slate-800 bg-slate-800/40 text-slate-500 cursor-not-allowed shadow-none"
                      : busy === "generating"
                        ? "border border-rose-500/40 bg-rose-950/80 text-rose-300 cursor-wait animate-pulse"
                        : "border border-rose-500/40 bg-gradient-to-r from-rose-600 via-red-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white shadow-rose-600/30 cursor-pointer active:scale-98",
                  )}
                >
                  {busy === "generating" ? (
                    <>
                      <Sparkles className="w-4 h-4 animate-spin shrink-0 text-white" />
                      <span className="truncate">{progress || (isVi ? "Đang tạo…" : "Rendering…")}</span>
                    </>
                  ) : (
                    <>
                      <Video className="w-4 h-4 shrink-0" />
                      <span className="truncate">
                        {isVi
                          ? readyClipsCount ? `Tạo ${readyClipsCount} video bằng Flow` : `Lưu ${unsavedVideosCount} video còn thiếu`
                          : readyClipsCount ? `Create ${readyClipsCount} Videos` : `Save ${unsavedVideosCount} Remaining Videos`}
                      </span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
          <div className="lg:col-span-6 flex flex-col glass-card rounded-2xl sm:rounded-3xl p-5 shadow-xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-xl h-full">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-2.5 mb-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center font-mono font-bold text-xs">
                  02
                </span>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100 font-mono">
                  {isVi ? "Danh sách prompt AI đã viết" : "AI Prompt List"} ({clips.length})
                </h3>
              </div>

              {clips.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    variant="unstyled"
                    onClick={handleCopyAllPrompts}
                    className="w-7 h-7 min-w-[28px] max-w-[28px] min-h-[28px] max-h-[28px] !p-0 aspect-square rounded-lg flex items-center justify-center text-purple-400 hover:text-purple-200 transition-colors bg-transparent border-none shadow-none cursor-pointer shrink-0 select-none active:scale-95"
                    title={isVi ? "Sao chép toàn bộ" : "Copy all"}
                  >
                    {isCopiedAll ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </Button>

                  <Button
                    type="button"
                    variant="unstyled"
                    onClick={handleClearAllPrompts}
                    disabled={!!busy}
                    className="w-7 h-7 min-w-[28px] max-w-[28px] min-h-[28px] max-h-[28px] !p-0 aspect-square rounded-lg flex items-center justify-center text-rose-400 hover:text-rose-200 transition-colors bg-transparent border-none shadow-none cursor-pointer shrink-0 select-none active:scale-95 disabled:opacity-30"
                    title={isVi ? "Xóa hết" : "Clear all"}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

            <div className="flex-1 flex flex-col min-h-0">
              {!clips.length ? (
                <div className="flex-1 flex items-center justify-center text-center py-8 text-slate-500">
                  <p className="text-xs font-medium">
                    {isVi ? "Nhập yêu cầu rồi bấm AI viết prompt." : "Enter concept and click AI Write Prompts."}
                  </p>
                </div>
              ) : (
                <div className="flex-1 space-y-2 max-h-[380px] overflow-y-auto custom-scrollbar pr-1">
                  {clips.map((clip, index) => (
                    <div
                      key={clip.id}
                      className={cn(
                        "group flex items-start gap-2.5 rounded-xl border px-3 py-2.5 bg-slate-955/70 hover:bg-slate-950/90 transition-all hover:border-purple-500/40",
                        clip.status === "done"
                          ? "border-emerald-500/30"
                          : clip.status === "failed"
                            ? "border-rose-500/30"
                            : clip.status === "generating"
                              ? "border-purple-500/60 ring-1 ring-purple-500/20"
                              : "border-slate-800/80",
                      )}
                    >
                      <span className="w-5 h-5 rounded-md bg-purple-500/10 border border-purple-500/20 text-purple-300 font-mono font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                        {index + 1}
                      </span>

                      <p className="flex-1 text-xs text-slate-200 leading-relaxed font-sans select-text break-words">
                        {clip.prompt}
                      </p>

                      <div className="flex items-center gap-1 shrink-0 pt-0.5">
                        <Button
                          type="button"
                          variant="unstyled"
                          onClick={() => handleCopyPrompt(clip.id, clip.prompt)}
                          className="w-6 h-6 min-w-[24px] max-w-[24px] min-h-[24px] max-h-[24px] !p-0 aspect-square rounded-md flex items-center justify-center text-purple-400 hover:text-purple-200 transition-colors bg-transparent border-none shadow-none cursor-pointer shrink-0 select-none active:scale-90"
                          title={isVi ? "Sao chép" : "Copy"}
                        >
                          {copiedPromptId === clip.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </Button>

                        <Button
                          type="button"
                          variant="unstyled"
                          disabled={!!busy}
                          onClick={() => handleDeleteClip(clip)}
                          className="w-6 h-6 min-w-[24px] max-w-[24px] min-h-[24px] max-h-[24px] !p-0 aspect-square rounded-md flex items-center justify-center text-rose-400 hover:text-rose-200 transition-colors bg-transparent border-none shadow-none cursor-pointer shrink-0 select-none active:scale-90 disabled:opacity-30"
                          title={isVi ? "Xóa" : "Delete"}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="glass-card rounded-2xl sm:rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-xl w-full">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center font-mono font-bold text-xs">
                03
              </span>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100 font-mono flex items-center gap-2">
                <Film className="w-4 h-4 text-rose-400" />
                {isVi ? "Video đã tạo" : "Rendered Videos"}
              </h3>
              <span className="text-[10px] font-bold text-rose-300 bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 rounded-full font-mono">
                {completedVideosCount} / {clips.length} {isVi ? "hoàn thành" : "ready"}
              </span>
            </div>

          </div>

          {!clips.length ? (
            <div className="text-center py-10 space-y-2 text-slate-500">
              <div className="w-10 h-10 rounded-2xl bg-slate-800/60 border border-slate-700/60 text-slate-400 flex items-center justify-center mx-auto">
                <Video className="w-5 h-5 text-slate-500" />
              </div>
              <p className="text-xs font-medium">
                {isVi ? "Chưa có video." : "No videos yet."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {clips.map((clip, index) => {
                const isDone = clip.status === "done";
                const isGenerating = clip.status === "generating";
                const isFailed = clip.status === "failed";

                return (
                  <div
                    key={clip.id}
                    className={cn(
                      "group rounded-2xl border bg-slate-955 overflow-hidden transition-all shadow-md flex flex-col justify-between hover:shadow-xl",
                      isDone
                        ? "border-purple-500/30 hover:border-purple-500/60"
                        : isFailed
                          ? "border-rose-500/30"
                          : isGenerating
                            ? "border-purple-500/60 ring-1 ring-purple-500/20 animate-pulse"
                            : "border-slate-800",
                    )}
                  >
                    <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
                      {clip.url ? (
                        <>
                          <video
                            src={clip.url}
                            controls
                            preload="metadata"
                            className="w-full h-full object-contain"
                          />
                          <Button
                            type="button"
                            variant="unstyled"
                            onClick={() => setPreviewVideoUrl(clip.url || null)}
                            className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/70 hover:bg-black text-white/90 hover:text-white backdrop-blur-xs border border-white/20 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            title={isVi ? "Phóng to" : "Zoom"}
                          >
                            <Maximize2 className="w-3.5 h-3.5" />
                          </Button>
                        </>
                      ) : isGenerating ? (
                        <div className="flex flex-col items-center justify-center gap-2 p-3 text-center">
                          <div className="relative flex items-center justify-center">
                            <div className="absolute inset-0 rounded-full bg-purple-500/30 blur-md animate-pulse" />
                            <Sparkles className="w-7 h-7 text-purple-400 animate-spin relative z-10" />
                          </div>
                          <span className="text-xs font-semibold text-purple-300 tracking-wide">
                            {isVi ? "Đang tạo…" : "Generating…"}
                          </span>
                        </div>
                      ) : isFailed ? (
                        <div className="flex flex-col items-center gap-1 p-3 text-center">
                          <AlertTriangle className="w-5 h-5 text-rose-400" />
                          <span className="text-[10px] font-semibold text-rose-300">
                            {isVi ? "Lỗi tạo video" : "Failed"}
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-1 p-3 text-center text-slate-600">
                          <Film className="w-6 h-6 text-slate-700" />
                          <span className="text-[10px] font-mono text-slate-500">
                            {isVi ? "Chờ tạo" : "Waiting"}
                          </span>
                        </div>
                      )}
                      {(isDone || isFailed) && (
                        <div className="absolute bottom-2 left-2 pointer-events-none">
                          <span
                            className={cn(
                              "text-[9px] font-mono font-bold px-1.5 py-0.5 rounded backdrop-blur-md flex items-center gap-1",
                              isDone
                                ? "bg-emerald-500/80 text-white"
                                : "bg-rose-500/80 text-white",
                            )}
                          >
                            {isDone && <Check className="w-2.5 h-2.5" />}
                            {isFailed && <AlertTriangle className="w-2.5 h-2.5" />}
                            {isDone
                              ? isVi ? "Đã tạo" : "Done"
                              : isVi ? "Lỗi" : "Failed"}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-2.5 bg-slate-900/60 border-t border-slate-800/80 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-200">
                          Video {index + 1}
                        </p>
                        {(clip.error || clip.savedPath || isDone || isFailed) && (
                          <p
                            className={cn(
                              "text-[10px] truncate",
                              clip.error ? "text-rose-400" : isDone ? "text-emerald-400" : "text-slate-400",
                            )}
                            title={clip.error || clip.savedPath}
                          >
                            {clip.error ||
                              clip.savedPath ||
                              (isDone
                                ? isVi ? "Đã tạo thành công" : "Done"
                                : isVi ? "Lỗi tạo video" : "Failed")}
                          </p>
                        )}
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      {previewVideoUrl && (
        <Modal
          isOpen={Boolean(previewVideoUrl)}
          onClose={() => setPreviewVideoUrl(null)}
          title={isVi ? "Xem trước Video" : "Video Preview"}
          maxWidth="xl"
        >
          <div className="space-y-4 p-2">
            <div className="aspect-video bg-black rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex items-center justify-center">
              <video
                src={previewVideoUrl}
                controls
                autoPlay
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex items-center justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setPreviewVideoUrl(null)}
              >
                {isVi ? "Đóng" : "Close"}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Xác Nhận Xóa 1 Prompt */}
      <Modal
        isOpen={Boolean(clipToDelete)}
        onClose={() => setClipToDelete(null)}
        maxWidth="md"
        title={
          <span className="inline-flex items-center gap-2 text-slate-100">
            <Trash2 className="w-4 h-4 text-rose-500 shrink-0" />
            <span className="text-sm font-bold">{isVi ? "Xác nhận xóa prompt" : "Delete Prompt"}</span>
          </span>
        }
      >
        <div className="space-y-4 text-left p-1">
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {isVi ? "Bạn có chắc chắn muốn xóa prompt này không?" : "Are you sure you want to delete this prompt?"}
          </p>
          {clipToDelete && (
            <div className="p-3 rounded-xl bg-slate-955 border border-slate-800 text-xs text-slate-300 italic line-clamp-3 leading-relaxed">
              "{clipToDelete.prompt}"
            </div>
          )}
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{isVi ? "Hành động này không thể hoàn tác." : "This action cannot be undone."}</span>
          </div>
          <div className="flex justify-end items-center gap-2.5 pt-3 border-t border-slate-800">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setClipToDelete(null)}
              className="h-9 px-4 rounded-xl text-xs font-semibold"
            >
              {isVi ? "Hủy" : "Cancel"}
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={confirmDeleteClip}
              className="h-9 px-5 rounded-xl text-xs font-bold shadow-md shadow-rose-600/20"
            >
              {isVi ? "Xóa" : "Delete"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Xác Nhận Xóa Toàn Bộ Prompt */}
      <Modal
        isOpen={showClearAllModal}
        onClose={() => setShowClearAllModal(false)}
        maxWidth="md"
        title={
          <span className="inline-flex items-center gap-2 text-slate-100">
            <Trash2 className="w-4 h-4 text-rose-500 shrink-0" />
            <span className="text-sm font-bold">{isVi ? "Xóa toàn bộ prompt" : "Clear All Prompts"}</span>
          </span>
        }
      >
        <div className="space-y-4 text-left p-1">
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {isVi
              ? `Bạn có chắc chắn muốn xóa toàn bộ ${clips.length} prompt kịch bản đã tạo không?`
              : `Are you sure you want to clear all ${clips.length} generated prompts?`}
          </p>
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{isVi ? "Hành động này không thể hoàn tác." : "This action cannot be undone."}</span>
          </div>
          <div className="flex justify-end items-center gap-2.5 pt-3 border-t border-slate-800">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setShowClearAllModal(false)}
              className="h-9 px-4 rounded-xl text-xs font-semibold"
            >
              {isVi ? "Hủy" : "Cancel"}
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={confirmClearAllPrompts}
              className="h-9 px-5 rounded-xl text-xs font-bold shadow-md shadow-rose-600/20"
            >
              {isVi ? "Xóa toàn bộ" : "Clear All"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
