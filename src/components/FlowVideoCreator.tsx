import _ from "lodash";
import {
  SOURCE_TEMPLATE_00_00,
  SOURCE_TEMPLATE_FLOWCLIP,
  SOURCE_TEMPLATE_SYMBOL,
  SOURCE_TEMPLATE_SYMBOL_5,
  SOURCE_TEMPLATE_SYMBOL_6,
  SOURCE_TEXT_0,
  SOURCE_TEXT_00_00_00,
  SOURCE_TEXT_01,
  SOURCE_TEXT_02,
  SOURCE_TEXT_03,
  SOURCE_TEXT_AI_FLOW,
  SOURCE_TEXT_AI_VIET_PROMPT_TU_YEU_CAU,
  SOURCE_TEXT_AI_WRITES_PROMPTS_FROM_YOUR_CONCEPT,
  SOURCE_TEXT_APPLICATION_JSON,
  SOURCE_TEXT_BOLERO_TRU_TINH,
  SOURCE_TEXT_BUTTON,
  SOURCE_TEXT_CINEMATIC,
  SOURCE_TEXT_CONTAINER,
  SOURCE_TEXT_COPIED,
  SOURCE_TEXT_CYBERPUNK_NEON,
  SOURCE_TEXT_DANGER,
  SOURCE_TEXT_DA_SAO_CHEP,
  SOURCE_TEXT_FLOW_VIDEO_CLIPS,
  SOURCE_TEXT_FLOW_VIDEO_CREATOR_STATE_V1,
  SOURCE_TEXT_LO_FI_CHILLOUT,
  SOURCE_TEXT_MD,
  SOURCE_TEXT_METADATA,
  SOURCE_TEXT_POST,
  SOURCE_TEXT_PUT,
  SOURCE_TEXT_SECONDARY,
  SOURCE_TEXT_SM,
  SOURCE_TEXT_SYMBOL_2,
  SOURCE_TEXT_SYMBOL_3,
  SOURCE_TEXT_TAO_10_VIDEO_DA_DANG_THEO,
  SOURCE_TEXT_TAO_10_VIDEO_FLYCAM_GOC_RONG,
  SOURCE_TEXT_TAO_10_VIDEO_KHONG_GIAN_QUAN,
  SOURCE_TEXT_TAO_10_VIDEO_THANH_PHO_TUONG,
  SOURCE_TEXT_THIEN_NHIEN_4K,
  SOURCE_TEXT_UNSTYLED,
  SOURCE_TEXT_VIDEO_CHUA_DAT_TEN,
  SOURCE_TEXT_WAITING,
  SOURCE_TEXT_XL,
} from "../constants/sourceText";
import { readBlobAsDataUrl } from "../lib/fileUtils";
import { DestructiveActionNotice } from "./common/DestructiveActionNotice";
import { delayAsync } from "../lib/asyncUtils";
import { getErrorMessage } from "../utils/errorUtils";
import { useEffect, useState } from "react";
import { Film, FolderOpen, Sparkles, Copy, Check, Trash2, AlertTriangle, Video, Play, Flame, ChevronDown, ChevronUp, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import { recordWorkflowActivity } from "../services/workflowActivity";
import { WORKFLOW_ACTIVITY_CONFIG, WORKFLOW_ACTIVITY_EVENT } from "../constants/workflowActivity";
import { stringifyJson } from "../lib/jsonStringify";
import { API_ROUTES, FLOW_BUSY_STATES, FLOW_CLIP_STATUSES, FLOW_DIRECT_VIDEO_CONFIG, FLOW_VIDEO_MEDIA_CONFIG, FLOW_VIDEO_TEXTS, LANGUAGE_CODES } from "../constants";
import { Lang } from "../lib/lang";
import { AiPlanningChatModel, AiPlanningExecutionMode, AiPlanningFallbackProvider, AspectRatio, GenerateType, ImageGenerationMode, ImageGeneratorEngine, StoryboardScene, VideoProject } from "../types";
import { submitProjectFlowVideoBatch, recoverProjectFlowVideo, isPersistedProjectVideoUrl } from "../services/projectImageGenerationService";
import ChatPlanningSettingsBlock from "./common/ChatPlanningSettingsBlock";
import { Button } from "./ui/Button";
import { Modal } from "./ui/Modal";
import { cn } from "../lib/utils";
import { jsonUtils } from "../lib/json";
import { resolveFlowVideoPlanningModel } from "../services/flowVideoPlanningModel";
import { normalizeVideoModelSettings } from "../services/videoModelCapabilityService";
import FlowVideoProductionSettings, { FlowVideoProductionConfig } from "./flow-video/FlowVideoProductionSettings";
import { FLOW_VIDEO_MODEL_OPTIONS } from "../constants/flowVideoSettings";
import { FLOW_VIDEO_CHARACTER_REFERENCE_CONFIG } from "../constants/flowVideoSettings";
import FlowVideoCharacterImages, { FlowVideoCharacterImage } from "./flow-video/FlowVideoCharacterImages";
import { getVideoModelCapabilities } from "../services/videoModelCapabilityService";
type Clip = {
  id: string;
  title?: string;
  prompt: string;
  url?: string;
  savedPath?: string;
  remoteMediaIds?: string[];
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
  productionConfig?: FlowVideoProductionConfig;
}
const LOCAL_STORAGE_KEY = SOURCE_TEXT_FLOW_VIDEO_CREATOR_STATE_V1;
const loadPersistedFlowVideoState = () => jsonUtils.getItem<PersistedState>(LOCAL_STORAGE_KEY, {});
const resolveClipTitle = (clip: Clip): string => {
  if (clip.title?.trim()) return clip.title.trim();
  const phrase = clip.prompt
    .trim()
    .split(/[.!?;,\n]/, 1)[0]
    .trim();
  return _.slice(phrase.split(/\s+/), 0, 8).join(" ") || SOURCE_TEXT_VIDEO_CHUA_DAT_TEN;
};
const SAMPLE_PROMPTS = [
  {
    title: SOURCE_TEXT_BOLERO_TRU_TINH,
    text: SOURCE_TEXT_TAO_10_VIDEO_DA_DANG_THEO,
  },
  {
    title: SOURCE_TEXT_LO_FI_CHILLOUT,
    text: SOURCE_TEXT_TAO_10_VIDEO_KHONG_GIAN_QUAN,
  },
  {
    title: SOURCE_TEXT_THIEN_NHIEN_4K,
    text: SOURCE_TEXT_TAO_10_VIDEO_FLYCAM_GOC_RONG,
  },
  {
    title: SOURCE_TEXT_CYBERPUNK_NEON,
    text: SOURCE_TEXT_TAO_10_VIDEO_THANH_PHO_TUONG,
  },
];
export default function FlowVideoCreator({ currentLang, projects, selectedProjectId }: { currentLang: Lang; projects: VideoProject[]; selectedProjectId: string | null }) {
  const flowTexts = FLOW_VIDEO_TEXTS[currentLang === LANGUAGE_CODES.VI ? LANGUAGE_CODES.VI : LANGUAGE_CODES.EN];
  const [saved] = useState(loadPersistedFlowVideoState);
  const [projectId, setProjectId] = useState<string>(saved.projectId || "");
  const [request, setRequest] = useState<string>(saved.request || "");
  const [folderPath, setFolderPath] = useState<string>(saved.folderPath || "");
  const [clips, setClips] = useState<Clip[]>(saved.clips || []);
  const [provider, setProvider] = useState<AiPlanningFallbackProvider>(saved.provider || AiPlanningFallbackProvider.ChatGptUi);
  const [model, setModel] = useState<AiPlanningChatModel>(resolveFlowVideoPlanningModel(saved.provider || AiPlanningFallbackProvider.ChatGptUi, saved.model));
  const [executionMode, setExecutionMode] = useState<AiPlanningExecutionMode>(saved.executionMode || AiPlanningExecutionMode.RoomOnly);
  const [chromeHeadless, setChromeHeadless] = useState<boolean>(saved.chromeHeadless ?? true);
  const [productionConfig, setProductionConfig] = useState<FlowVideoProductionConfig>(() => {
    const projectVisual = _.find(projects, (project) => project.id === (saved.projectId || selectedProjectId))?.visualConfig;
    const stored = saved.productionConfig;
    const requestedEngine = stored?.engine || projectVisual?.imageGeneratorEngine || ImageGeneratorEngine.Veo3;
    const engine = _.some(FLOW_VIDEO_MODEL_OPTIONS, (option) => option.value === requestedEngine) ? requestedEngine : ImageGeneratorEngine.Veo3;
    const normalized = normalizeVideoModelSettings(engine, {
      duration: stored?.duration || projectVisual?.videoDuration,
      resolution: stored?.resolution || projectVisual?.videoResolution,
      aspectRatio: stored?.aspectRatio || (projectVisual?.aspectRatio as AspectRatio),
    });
    return {
      engine,
      duration: normalized.duration,
      resolution: normalized.resolution,
      aspectRatio: normalized.aspectRatio,
      chromeHeadless: stored?.chromeHeadless ?? projectVisual?.chromeHeadless ?? true,
    };
  });
  const [showSettings, setShowSettings] = useState(false);
  const [busy, setBusy] = useState<"planning" | "generating" | null>(null);
  const [progress, setProgress] = useState("");
  const [copiedPromptId, setCopiedPromptId] = useState<string | null>(null);
  const [isCopiedAll, setIsCopiedAll] = useState(false);
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);
  const [clipToDelete, setClipToDelete] = useState<Clip | null>(null);
  const [showClearAllModal, setShowClearAllModal] = useState(false);
  const [characterImages, setCharacterImages] = useState<FlowVideoCharacterImage[]>([]);
  const [characterImagesLoaded, setCharacterImagesLoaded] = useState(false);
  const [isReadingCharacterImages, setIsReadingCharacterImages] = useState(false);
  const isVi = currentLang === LANGUAGE_CODES.VI;
  useEffect(() => {
    jsonUtils.setItem(LOCAL_STORAGE_KEY, {
      projectId,
      request,
      folderPath,
      clips,
      provider,
      model,
      executionMode,
      chromeHeadless,
      productionConfig,
    });
  }, [projectId, request, folderPath, clips, provider, model, executionMode, chromeHeadless, productionConfig]);
  useEffect(() => {
    if (!projectId) {
      const selected = _.find(projects, (project) => project.id === selectedProjectId);
      const film = _.find(projects, (project) => project.parentId === selectedProjectId && project.projectKind === SOURCE_TEXT_CINEMATIC) || _.find(projects, (project) => project.projectKind === SOURCE_TEXT_CINEMATIC);
      setProjectId(selected?.projectKind === SOURCE_TEXT_CONTAINER ? film?.id || "" : selected?.id || film?.id || "");
    }
  }, [selectedProjectId, projectId, projects]);
  useEffect(() => {
    let active = true;
    setCharacterImagesLoaded(false);
    setCharacterImages([]);
    if (!projectId) return;
    void jsonUtils.getAsyncItem<FlowVideoCharacterImage[]>(FLOW_VIDEO_CHARACTER_REFERENCE_CONFIG.STORAGE_KEY(projectId), []).then((stored) => {
      if (!active) return;
      setCharacterImages(Array.isArray(stored) ? _.slice(stored, 0, FLOW_VIDEO_CHARACTER_REFERENCE_CONFIG.MAX_IMAGES) : []);
      setCharacterImagesLoaded(true);
    });
    return () => {
      active = false;
    };
  }, [projectId]);
  useEffect(() => {
    if (!projectId || !characterImagesLoaded) return;
    void jsonUtils.setAsyncItem(FLOW_VIDEO_CHARACTER_REFERENCE_CONFIG.STORAGE_KEY(projectId), characterImages);
  }, [projectId, characterImages, characterImagesLoaded]);
  useEffect(() => {
    if (!characterImagesLoaded || !characterImages.length || getVideoModelCapabilities(productionConfig.engine).supportsReferences) return;
    setProductionConfig((current) => {
      const engine = ImageGeneratorEngine.Veo3;
      const normalized = normalizeVideoModelSettings(engine, current, true);
      return { ...current, engine, duration: normalized.duration, resolution: normalized.resolution, aspectRatio: normalized.aspectRatio };
    });
  }, [characterImagesLoaded, characterImages.length, productionConfig.engine]);
  const addCharacterImages = async (files: FileList) => {
    const selectedFiles = Array.from(files);
    const availableSlots = FLOW_VIDEO_CHARACTER_REFERENCE_CONFIG.MAX_IMAGES - characterImages.length;
    if (selectedFiles.length > availableSlots) {
      toast.error(flowTexts.CHARACTER_IMAGES_LIMIT(FLOW_VIDEO_CHARACTER_REFERENCE_CONFIG.MAX_IMAGES));
    }
    const acceptedFiles = _.slice(selectedFiles, 0, availableSlots);
    if (_.some(acceptedFiles, (file) => !_.includes(FLOW_VIDEO_CHARACTER_REFERENCE_CONFIG.ACCEPTED_TYPES, file.type as (typeof FLOW_VIDEO_CHARACTER_REFERENCE_CONFIG.ACCEPTED_TYPES)[number]) || file.size > FLOW_VIDEO_CHARACTER_REFERENCE_CONFIG.MAX_FILE_BYTES)) {
      return toast.error(flowTexts.CHARACTER_IMAGE_INVALID);
    }
    setIsReadingCharacterImages(true);
    try {
      const images = await Promise.all(
        _.map(acceptedFiles, async (file, index): Promise<FlowVideoCharacterImage> => {
          try {
            const dataUrl = await readBlobAsDataUrl(file);
            return { id: SOURCE_TEMPLATE_SYMBOL_5(`${Date.now()}`, `${index}`), name: file.name, dataUrl };
          } catch {
            throw new Error(flowTexts.CHARACTER_IMAGE_READ_FAILED);
          }
        }),
      );
      if (!images.length) return;
      setCharacterImages((current) => _.slice(_.concat(current, images), 0, FLOW_VIDEO_CHARACTER_REFERENCE_CONFIG.MAX_IMAGES));
      recordWorkflowActivity(WORKFLOW_ACTIVITY_CONFIG.AREAS.flow, WORKFLOW_ACTIVITY_EVENT.flowReference, images.length);
      if (!getVideoModelCapabilities(productionConfig.engine).supportsReferences) {
        setProductionConfig((current) => {
          const engine = ImageGeneratorEngine.Veo3;
          const normalized = normalizeVideoModelSettings(engine, current, true);
          return { ...current, engine, duration: normalized.duration, resolution: normalized.resolution, aspectRatio: normalized.aspectRatio };
        });
        toast.info(flowTexts.CHARACTER_MODEL_ADJUSTED);
      }
    } catch {
      toast.error(flowTexts.CHARACTER_IMAGE_READ_FAILED);
    } finally {
      setIsReadingCharacterImages(false);
    }
  };
  const chooseFolder = async () => {
    try {
      const response = await fetch(API_ROUTES.PIPELINE_SELECT_FOLDER, {
        method: SOURCE_TEXT_POST,
        headers: { "Content-Type": SOURCE_TEXT_APPLICATION_JSON },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || flowTexts.SELECT_FOLDER_ERROR);
      if (data.folderPath) {
        setFolderPath(data.folderPath);
        recordWorkflowActivity(WORKFLOW_ACTIVITY_CONFIG.AREAS.flow, WORKFLOW_ACTIVITY_EVENT.flowFolder);
      }
    } catch (error) {
      toast.error(getErrorMessage(error, flowTexts.SELECT_FOLDER_ERROR));
    }
  };
  const post = async (url: string, body: object) => {
    const response = await fetch(url, {
      method: SOURCE_TEXT_POST,
      headers: { "Content-Type": SOURCE_TEXT_APPLICATION_JSON },
      body: stringifyJson(body),
    });
    const data = await response.json();
    if (!response.ok || data.success === false) {
      throw new Error(data.error || data.warning || flowTexts.REQUEST_FAILED);
    }
    return data;
  };
  const plan = async () => {
    if (!request.trim()) {
      return toast.error(flowTexts.REQUEST_REQUIRED);
    }
    const previousClips = clips;
    recordWorkflowActivity(WORKFLOW_ACTIVITY_CONFIG.AREAS.flow, WORKFLOW_ACTIVITY_EVENT.flowPlanStart);
    setClips([]);
    setBusy(FLOW_BUSY_STATES.PLANNING);
    try {
      const data = await post(API_ROUTES.PIPELINE_PLAN_FLOW_VIDEO_PROMPTS, {
        request: request.trim(),
        projectId: projectId || undefined,
        execution: { provider, model, mode: executionMode, chromeHeadless },
      });
      const generatedVideos: { title: string; prompt: string }[] = data.videos || [];
      if (!generatedVideos.length) throw new Error(flowTexts.PLAN_FAILED);
      setClips(
        _.map(generatedVideos, ({ title, prompt }, index: number) => ({
          id: SOURCE_TEMPLATE_FLOWCLIP(`${Date.now()}`, `${index + 1}`),
          title,
          prompt,
          status: SOURCE_TEXT_WAITING,
        })),
      );
      toast.success(flowTexts.PLAN_SUCCESS(generatedVideos.length));
      recordWorkflowActivity(WORKFLOW_ACTIVITY_CONFIG.AREAS.flow, WORKFLOW_ACTIVITY_EVENT.flowPlanDone, generatedVideos.length);
    } catch (error) {
      recordWorkflowActivity(WORKFLOW_ACTIVITY_CONFIG.AREAS.flow, WORKFLOW_ACTIVITY_EVENT.flowPlanFail, undefined, getErrorMessage(error, flowTexts.PLAN_FAILED));
      setClips(previousClips);
      toast.error(getErrorMessage(error, flowTexts.PLAN_FAILED));
    } finally {
      setBusy(null);
    }
  };
  const generate = async () => {
    if (!projectId) {
      return toast.error(flowTexts.PROJECT_REQUIRED);
    }
    if (!folderPath) {
      return toast.error(flowTexts.FOLDER_REQUIRED);
    }
    if (!characterImagesLoaded || isReadingCharacterImages) return;
    if (_.every(clips, (clip) => clip.savedPath)) return;
    recordWorkflowActivity(WORKFLOW_ACTIVITY_CONFIG.AREAS.flow, WORKFLOW_ACTIVITY_EVENT.flowGenerateStart, _.filter(clips, (clip) => !clip.savedPath).length);
    const clipDurationSeconds = Number.parseInt(productionConfig.duration, 10);
    setBusy(FLOW_BUSY_STATES.GENERATING);
    try {
      const response = await fetch(SOURCE_TEMPLATE_SYMBOL(`${API_ROUTES.PROJECTS}`, `${encodeURIComponent(projectId)}`));
      if (!response.ok) throw new Error(flowTexts.LOAD_PROJECT_FAILED);
      const project: VideoProject = await response.json();
      const existing = project.storyboard || [];
      const workClips = _.map(clips, (clip) => {
        if (clip.savedPath) return clip;
        const scene = _.find(existing, (item) => item.id === clip.id && item.prompt === clip.prompt);
        const url = clip.url || (isPersistedProjectVideoUrl(scene?.assetUrl) ? scene?.assetUrl : undefined);
        const remoteMediaIds = clip.remoteMediaIds?.length ? clip.remoteMediaIds : scene?.remoteVideoDownloadPending ? (scene.remoteVideoMediaIds?.length ? scene.remoteVideoMediaIds : scene.remoteVideoMediaId ? [scene.remoteVideoMediaId] : []) : [];
        return { ...clip, url, remoteMediaIds };
      });
      setClips(workClips);
      const pending = _.filter(workClips, (clip) => !clip.savedPath && !clip.url && !clip.remoteMediaIds?.length);
      const scenes: StoryboardScene[] = _.map(pending, (clip) => ({
        id: clip.id,
        chapterId: SOURCE_TEXT_FLOW_VIDEO_CLIPS,
        startTime: SOURCE_TEXT_00_00_00,
        endTime: SOURCE_TEMPLATE_00_00(`${String(clipDurationSeconds).padStart(2, SOURCE_TEXT_0)}`),
        duration: clipDurationSeconds,
        script: clip.prompt,
        subtitle: "",
        prompt: clip.prompt,
        assetName: resolveClipTitle(clip),
        cameraMotion: "",
        assetType: GenerateType.Video,
      }));
      const nextProject: VideoProject = {
        ...project,
        storyboard: [..._.filter(existing, (scene) => !_.some(pending, (clip) => clip.id === scene.id)), ...scenes],
        visualConfig: {
          ...project.visualConfig,
          generationMode: ImageGenerationMode.LabsFlow,
          imageGeneratorEngine: productionConfig.engine,
          generateType: GenerateType.Video,
          aspectRatio: productionConfig.aspectRatio,
          videoDuration: productionConfig.duration,
          videoResolution: productionConfig.resolution,
          chromeHeadless: productionConfig.chromeHeadless,
        },
        updatedAt: new Date().toISOString(),
      };
      if (pending.length) {
        const save = await fetch(SOURCE_TEMPLATE_SYMBOL(`${API_ROUTES.PROJECTS}`, `${encodeURIComponent(projectId)}`), {
          method: SOURCE_TEXT_PUT,
          headers: { "Content-Type": SOURCE_TEXT_APPLICATION_JSON },
          body: stringifyJson(nextProject),
        });
        if (!save.ok) throw new Error(flowTexts.SAVE_PROMPTS_FAILED);
      }
      let flowProjectId = project.visualConfig?.flowProjectId;
      for (let index = 0; index < workClips.length; index++) {
        const clip = workClips[index];
        if (clip.savedPath) continue;
        recordWorkflowActivity(WORKFLOW_ACTIVITY_CONFIG.AREAS.flow, WORKFLOW_ACTIVITY_EVENT.flowClipStart, index + 1);
        setProgress(flowTexts.BATCH_PROGRESS(index + 1, index + 1, workClips.length));
        setClips((before) => _.map(before, (item) => (item.id === clip.id ? { ...item, status: FLOW_CLIP_STATUSES.GENERATING, error: undefined } : item)));
        try {
          let url = clip.url;
          let mediaIds = clip.remoteMediaIds || [];
          if (!url && !mediaIds.length) {
            for (let attempt = 0; attempt <= FLOW_DIRECT_VIDEO_CONFIG.GENERATION_RETRY_COUNT; attempt++) {
              const result = await submitProjectFlowVideoBatch(
                [
                  {
                    sceneId: clip.id,
                    prompt: clip.prompt,
                    generateType: GenerateType.Video,
                    referenceImages: _.map(characterImages, (image) => image.dataUrl),
                    referenceImageNames: _.map(characterImages, (image) => image.name),
                    requireReferenceReady: characterImages.length > 0,
                  },
                ],
                { ...nextProject.visualConfig, flowProjectId, generateCount: FLOW_DIRECT_VIDEO_CONFIG.VIDEO_OUTPUT_COUNT },
                { localProjectId: projectId, flowProjectId },
              );
              if (result.newProjectId) flowProjectId = result.newProjectId;
              const generated = _.find(result.results, (item) => item.sceneId === clip.id);
              mediaIds = generated?.remoteMediaIds?.length ? generated.remoteMediaIds : generated?.remoteMediaId ? [generated.remoteMediaId] : [];
              url = generated?.fallbackUrl;
              if (generated?.success || mediaIds.length) break;
              const message = generated?.warning || result.warning || flowTexts.FLOW_GENERATION_FAILED;
              if (generated?.remoteMediaCreated !== false || attempt === FLOW_DIRECT_VIDEO_CONFIG.GENERATION_RETRY_COUNT) throw new Error(message);
            }
            workClips[index] = { ...clip, url, remoteMediaIds: mediaIds };
            setClips((before) => _.map(before, (item) => (item.id === clip.id ? { ...item, url, remoteMediaIds: mediaIds } : item)));
          }
          if (!url && mediaIds.length) {
            for (let attempt = 0; attempt < FLOW_VIDEO_MEDIA_CONFIG.RECOVERY_ATTEMPTS && !url; attempt++) {
              const recovered = await recoverProjectFlowVideo({ projectId, sceneId: clip.id, mediaIds, expectedOutputCount: 1 });
              if (recovered.success) url = recovered.fallbackUrl;
              else if (recovered.remoteMediaCreated === false) {
                mediaIds = [];
                setClips((before) => _.map(before, (item) => (item.id === clip.id ? { ...item, remoteMediaIds: [] } : item)));
                break;
              } else if (attempt < FLOW_VIDEO_MEDIA_CONFIG.RECOVERY_ATTEMPTS - 1) {
                await delayAsync(FLOW_VIDEO_MEDIA_CONFIG.RECOVERY_RETRY_DELAY_MS);
              }
            }
          }
          if (!url) throw new Error(flowTexts.VIDEO_DOWNLOAD_PENDING);
          workClips[index] = { ...workClips[index], url, remoteMediaIds: mediaIds };
          setClips((before) => _.map(before, (item) => (item.id === clip.id ? { ...item, url, remoteMediaIds: mediaIds } : item)));
          const saved = await post(API_ROUTES.PIPELINE_SAVE_FLOW_VIDEOS, { projectId, folderPath, sceneIds: [clip.id] });
          const savedPath: string | undefined = saved.savedPaths?.[0];
          if (!savedPath) throw new Error(flowTexts.SAVE_VIDEO_FAILED);
          workClips[index] = { ...workClips[index], savedPath, status: FLOW_CLIP_STATUSES.DONE, error: undefined };
          setClips((before) => _.map(before, (item) => (item.id === clip.id ? { ...item, url, savedPath, status: FLOW_CLIP_STATUSES.DONE, error: undefined } : item)));
          recordWorkflowActivity(WORKFLOW_ACTIVITY_CONFIG.AREAS.flow, WORKFLOW_ACTIVITY_EVENT.flowClipDone, index + 1);
        } catch (error) {
          const message = getErrorMessage(error, flowTexts.FLOW_ERROR);
          recordWorkflowActivity(WORKFLOW_ACTIVITY_CONFIG.AREAS.flow, WORKFLOW_ACTIVITY_EVENT.flowClipFail, index + 1, message);
          recordWorkflowActivity(WORKFLOW_ACTIVITY_CONFIG.AREAS.flow, WORKFLOW_ACTIVITY_EVENT.flowGenerateFail, undefined, message);
          setClips((before) => _.map(before, (item) => (item.id === clip.id ? { ...item, status: FLOW_CLIP_STATUSES.FAILED, error: message } : item)));
          toast.error(message);
          return;
        }
      }
      toast.success(flowTexts.BATCH_COMPLETE);
      recordWorkflowActivity(WORKFLOW_ACTIVITY_CONFIG.AREAS.flow, WORKFLOW_ACTIVITY_EVENT.flowGenerateDone);
    } catch (error) {
      recordWorkflowActivity(WORKFLOW_ACTIVITY_CONFIG.AREAS.flow, WORKFLOW_ACTIVITY_EVENT.flowGenerateFail, undefined, getErrorMessage(error, flowTexts.CREATE_FAILED));
      toast.error(getErrorMessage(error, flowTexts.CREATE_FAILED));
    } finally {
      setBusy(null);
      setProgress("");
    }
  };
  const handleCopyPrompt = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPromptId(id);
    toast.success(flowTexts.PROMPT_COPIED);
    recordWorkflowActivity(WORKFLOW_ACTIVITY_CONFIG.AREAS.flow, WORKFLOW_ACTIVITY_EVENT.flowCopy);
    setTimeout(() => setCopiedPromptId(null), 2000);
  };
  const handleCopyAllPrompts = () => {
    if (!clips.length) return;
    const allText = _.map(clips, (c, i) => SOURCE_TEMPLATE_SYMBOL_6(`${i + 1}`, `${c.prompt}`)).join("\n\n");
    navigator.clipboard.writeText(allText);
    setIsCopiedAll(true);
    toast.success(flowTexts.PROMPTS_COPIED(clips.length));
    recordWorkflowActivity(WORKFLOW_ACTIVITY_CONFIG.AREAS.flow, WORKFLOW_ACTIVITY_EVENT.flowCopy, clips.length);
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
    setClips((prev) => _.filter(prev, (c) => c.id !== clipToDelete.id));
    setClipToDelete(null);
    toast.success(flowTexts.PROMPT_DELETED);
    recordWorkflowActivity(WORKFLOW_ACTIVITY_CONFIG.AREAS.flow, WORKFLOW_ACTIVITY_EVENT.flowDelete);
  };
  const confirmClearAllPrompts = () => {
    recordWorkflowActivity(WORKFLOW_ACTIVITY_CONFIG.AREAS.flow, WORKFLOW_ACTIVITY_EVENT.flowDelete, clips.length);
    setClips([]);
    setShowClearAllModal(false);
    toast.info(flowTexts.PROMPTS_CLEARED);
  };
  const readyClipsCount = _.filter(clips, (clip) => !clip.savedPath && !clip.url && !clip.remoteMediaIds?.length).length;
  const recoverableVideosCount = _.filter(clips, (clip) => !clip.savedPath && !clip.url && !!clip.remoteMediaIds?.length).length;
  const unsavedVideosCount = _.filter(clips, (clip) => clip.url && !clip.savedPath).length;
  const completedVideosCount = _.filter(clips, (clip) => clip.url).length;
  return (
    <div className={cn("creation-workspace w-full h-full min-h-0 flex flex-col overflow-y-auto p-4 sm:p-6 bg-slate-955 font-sans text-slate-100 custom-scrollbar")}>
      <div className={cn("bg-gradient-to-b from-slate-900/90 to-slate-950/95 rounded-2xl p-4 sm:p-6 space-y-6 shadow-2xl relative overflow-visible w-full border border-slate-800/80")}>
        <div className={cn("glass-card rounded-2xl p-4 sm:p-5 shadow-lg border border-slate-800/80 bg-slate-900/60 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4")}>
          <div className={cn("flex items-center gap-3 min-w-0")}>
            <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-500 via-fuchsia-500 to-pink-600 p-0.5 shadow-md shadow-purple-500/20 shrink-0")}>
              <div className={cn("w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center text-purple-400")}>
                <Film className={cn("w-5 h-5")} />
              </div>
            </div>
            <div className={cn("min-w-0")}>
              <div className={cn("flex items-center gap-2 flex-wrap")}>
                <h1 className={cn("text-base sm:text-lg font-black text-slate-100 tracking-tight uppercase font-sans")}>{flowTexts.VIDEO_CREATOR_TITLE}</h1>
                <span className={cn("px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider bg-purple-500/15 border border-purple-500/30 text-purple-300 flex items-center gap-1 shadow-xs")}>
                  <Sparkles className={cn("w-2.5 h-2.5 text-purple-400")} />
                  {SOURCE_TEXT_AI_FLOW}
                </span>
              </div>
              <p className={cn("text-[11px] text-slate-400 mt-0.5")}>{isVi ? SOURCE_TEXT_AI_VIET_PROMPT_TU_YEU_CAU : SOURCE_TEXT_AI_WRITES_PROMPTS_FROM_YOUR_CONCEPT}</p>
            </div>
          </div>
          <div className={cn("flex items-center gap-2 self-start sm:self-auto")}>
            <Button
              variant={SOURCE_TEXT_UNSTYLED}
              type={SOURCE_TEXT_BUTTON}
              onClick={() => setShowSettings(!showSettings)}
              disabled={!!busy}
              className={cn("group inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-xs leading-none select-none", {
                "bg-purple-600/15 border-purple-500/50 text-purple-700 dark:text-purple-300 shadow-purple-500/10": showSettings,
                "bg-white/95 hover:bg-purple-50/90 border-slate-200/90 hover:border-purple-300/80 text-slate-800 hover:text-purple-700 dark:bg-slate-900/90 dark:hover:bg-slate-850 dark:border-slate-800 dark:hover:border-purple-500/40 dark:text-slate-200 dark:hover:text-purple-300": !showSettings,
              })}>
              <SlidersHorizontal className={cn("w-3.5 h-3.5 text-purple-500 dark:text-purple-400 shrink-0 group-hover:scale-105 transition-transform")} />
              <span className={cn("inline-flex items-center leading-none text-slate-800 dark:text-slate-200 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors")}>{flowTexts.AI_SETTINGS}</span>
              {showSettings ? <ChevronUp className={cn("w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0 transition-colors")} /> : <ChevronDown className={cn("w-3.5 h-3.5 text-slate-500 dark:text-slate-400 group-hover:text-purple-600 dark:group-hover:text-purple-300 shrink-0 transition-colors")} />}
            </Button>
          </div>
        </div>
        {showSettings && (
          <fieldset disabled={!!busy} className={cn("glass-card rounded-2xl p-4 bg-slate-900/80 border border-slate-800/90 shadow-xl space-y-4")}>
            <ChatPlanningSettingsBlock
              provider={provider}
              model={model}
              executionMode={executionMode}
              chromeHeadless={chromeHeadless}
              onProviderChange={(nextProvider) => {
                setModel((currentModel) => resolveFlowVideoPlanningModel(nextProvider, currentModel));
                setProvider(nextProvider);
              }}
              onModelChange={setModel}
              onExecutionModeChange={setExecutionMode}
              onChromeHeadlessChange={setChromeHeadless}
              currentLang={currentLang}
            />
          </fieldset>
        )}
        <div className={cn("grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch")}>
          <div className={cn("lg:col-span-6 flex flex-col justify-between gap-4 glass-card rounded-2xl sm:rounded-3xl p-5 shadow-xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-xl")}>
            <div className={cn("space-y-3.5 flex-1 flex flex-col")}>
              <div className={cn("flex items-center justify-between border-b border-slate-800/80 pb-2.5")}>
                <div className={cn("flex items-center gap-2.5 min-w-0")}>
                  <span className={cn("w-6 h-6 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center font-mono font-black text-xs shadow-sm shadow-purple-500/20")}>{SOURCE_TEXT_01}</span>
                  <h2 className={cn("text-xs font-bold uppercase tracking-wider text-slate-100 font-mono flex items-center gap-1.5")}>
                    <Sparkles className={cn("w-3.5 h-3.5 text-purple-400")} />
                    <span>{flowTexts.REQUEST_LABEL}</span>
                  </h2>
                </div>
              </div>
              <div className={cn("space-y-1.5")}>
                <div className={cn("flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold")}>
                  <Flame className={cn("w-3.5 h-3.5 text-amber-400")} />
                  <span>{flowTexts.QUICK_SAMPLES}</span>
                </div>
                <div className={cn("flex flex-wrap gap-1.5")}>
                  {_.map(SAMPLE_PROMPTS, (sample) => {
                    const isSelected = request === sample.text;
                    return (
                      <Button
                        variant={SOURCE_TEXT_UNSTYLED}
                        key={sample.title}
                        type={SOURCE_TEXT_BUTTON}
                        disabled={!!busy}
                        onClick={() => setRequest(sample.text)}
                        className={cn("relative h-8 px-3 rounded-xl border font-bold text-xs inline-flex items-center justify-center transition-all cursor-pointer shadow-xs select-none", {
                          "bg-gradient-to-r from-purple-600 to-pink-600 border-purple-400 text-white shadow-purple-600/30 shadow-md scale-[1.02]": isSelected,
                          "bg-white/80 dark:bg-slate-955/90 border-slate-200 dark:border-slate-800 !text-[#1e293b] hover:!text-[#6b21a8] dark:!text-slate-300 dark:hover:!text-white hover:border-purple-400/60 dark:hover:border-purple-500/40 hover:bg-purple-50/60 dark:hover:bg-slate-900/90": !isSelected,
                        })}>
                        <span>{sample.title}</span>
                      </Button>
                    );
                  })}
                </div>
              </div>
              <div className={cn("flex-1 min-h-[130px] flex flex-col")}>
                <textarea
                  value={request}
                  onChange={(event) => setRequest(event.target.value)}
                  disabled={!!busy}
                  placeholder={flowTexts.REQUEST_PLACEHOLDER}
                  className={cn("w-full flex-1 min-h-[130px] rounded-xl border border-slate-800 bg-slate-955/90 p-3 text-xs text-slate-100 placeholder:text-slate-500 outline-none resize-y focus:border-purple-500/80 focus:ring-1 focus:ring-purple-500/20 transition-all custom-scrollbar leading-relaxed")}
                />
              </div>
              <Button
                variant={SOURCE_TEXT_UNSTYLED}
                type={SOURCE_TEXT_BUTTON}
                disabled={!!busy || !request.trim()}
                onClick={plan}
                className={cn("w-full h-10 px-4 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-2 transition-all shadow-md select-none cursor-pointer leading-none", {
                  "bg-purple-600/50 text-purple-200 border border-purple-400/30 cursor-wait": busy === FLOW_BUSY_STATES.PLANNING,
                  "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white border border-purple-400/30 shadow-purple-600/20 active:scale-98": !(busy === FLOW_BUSY_STATES.PLANNING),
                })}>
                {busy === FLOW_BUSY_STATES.PLANNING ? (
                  <>
                    <Sparkles className={cn("w-4 h-4 animate-spin shrink-0 text-fuchsia-300")} />
                    <span>{flowTexts.WRITING_PROMPTS}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className={cn("w-4 h-4 shrink-0")} />
                    <span>{flowTexts.WRITE_PROMPTS}</span>
                  </>
                )}
              </Button>
            </div>
            <div className={cn("pt-3 border-t border-slate-800/80 space-y-3")}>
              <div className={cn("flex items-center justify-between gap-2")}>
                <div className={cn("flex items-center gap-2")}>
                  <SlidersHorizontal className={cn("w-3.5 h-3.5 text-amber-400")} />
                  <span className={cn("text-xs font-bold uppercase tracking-wider text-slate-100 font-mono")}>{flowTexts.FLOW_SETTINGS}</span>
                </div>
                {folderPath && (
                  <span className={cn("text-[10px] font-mono text-emerald-400 flex items-center gap-1")}>
                    <Check className={cn("w-3 h-3")} /> {flowTexts.SELECTED}
                  </span>
                )}
              </div>
              <FlowVideoProductionSettings config={productionConfig} onChange={setProductionConfig} disabled={!!busy} texts={flowTexts} hasCharacterImages={characterImages.length > 0} />
              <FlowVideoCharacterImages images={characterImages} disabled={!!busy || !projectId || !characterImagesLoaded || isReadingCharacterImages} texts={flowTexts} onAdd={addCharacterImages} onRemove={(id) => setCharacterImages((current) => _.filter(current, (image) => image.id !== id))} />
              <div className={cn("grid grid-cols-1 sm:grid-cols-12 gap-2.5")}>
                <div onClick={!busy ? chooseFolder : undefined} className={cn("sm:col-span-7 flex items-center justify-between gap-2 rounded-xl border p-2.5 bg-slate-955/90 transition-all", { "border-purple-500/40 hover:border-purple-500": folderPath, "border-dashed border-slate-700 hover:border-purple-500/60": !folderPath }, { "opacity-50 cursor-not-allowed": busy, "cursor-pointer": !busy })}>
                  <div className={cn("flex items-center gap-2 min-w-0")}>
                    <FolderOpen className={cn("w-4 h-4 text-purple-400 shrink-0")} />
                    <span className={cn("text-xs font-medium text-slate-200 truncate")}>{folderPath || flowTexts.SELECT_FOLDER}</span>
                  </div>
                  <span className={cn("text-[11px] font-semibold text-purple-300 shrink-0")}>{folderPath ? flowTexts.CHANGE : flowTexts.BROWSE}</span>
                </div>
                <Button
                  variant={SOURCE_TEXT_UNSTYLED}
                  type={SOURCE_TEXT_BUTTON}
                  disabled={!!busy || !characterImagesLoaded || isReadingCharacterImages || (!readyClipsCount && !recoverableVideosCount && !unsavedVideosCount) || !folderPath}
                  onClick={generate}
                  className={cn("sm:col-span-5 h-full min-h-[42px] px-3 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-2 transition-all shadow-lg select-none leading-none", {
                    "border border-slate-800 bg-slate-800/40 text-slate-500 cursor-not-allowed shadow-none": (!readyClipsCount && !recoverableVideosCount && !unsavedVideosCount) || !folderPath,
                    "border border-rose-500/40 bg-rose-950/80 text-rose-300 cursor-wait animate-pulse": !((!readyClipsCount && !recoverableVideosCount && !unsavedVideosCount) || !folderPath) && busy === FLOW_BUSY_STATES.GENERATING,
                    "border border-rose-500/40 bg-gradient-to-r from-rose-600 via-red-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white shadow-rose-600/30 cursor-pointer active:scale-98": !((!readyClipsCount && !recoverableVideosCount && !unsavedVideosCount) || !folderPath) && !(busy === FLOW_BUSY_STATES.GENERATING),
                  })}>
                  {busy === FLOW_BUSY_STATES.GENERATING ? (
                    <>
                      <Sparkles className={cn("w-4 h-4 animate-spin shrink-0 text-white")} />
                      <span className={cn("truncate")}>{progress || flowTexts.RENDERING}</span>
                    </>
                  ) : (
                    <>
                      <Video className={cn("w-4 h-4 shrink-0")} />
                      <span className={cn("truncate")}>{recoverableVideosCount ? flowTexts.RESUME_VIDEOS(recoverableVideosCount) : unsavedVideosCount ? flowTexts.SAVE_REMAINING_VIDEOS(unsavedVideosCount) : flowTexts.CREATE_VIDEOS(readyClipsCount)}</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
          <div className={cn("lg:col-span-6 flex flex-col glass-card rounded-2xl sm:rounded-3xl p-5 shadow-xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-xl lg:h-0 lg:min-h-full min-h-[420px] overflow-hidden")}>
            <div className={cn("flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-2.5 mb-3 shrink-0")}>
              <div className={cn("flex items-center gap-2.5 min-w-0")}>
                <span className={cn("w-6 h-6 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center font-mono font-black text-xs shadow-sm shadow-purple-500/20")}>{SOURCE_TEXT_02}</span>
                <h3 className={cn("text-xs font-bold uppercase tracking-wider text-slate-100 font-mono flex items-center gap-1.5")}>
                  <Sparkles className={cn("w-3.5 h-3.5 text-purple-400")} />
                  <span>{flowTexts.PROMPT_LIST}</span>
                  <span className={cn("px-1.5 py-0.2 rounded text-[9px] bg-purple-500/15 border border-purple-500/30 text-purple-300 font-mono")}>{clips.length}</span>
                </h3>
              </div>
              {clips.length > 0 && (
                <div className={cn("flex items-center gap-1.5")}>
                  <Button
                    variant={SOURCE_TEXT_UNSTYLED}
                    type={SOURCE_TEXT_BUTTON}
                    onClick={handleCopyAllPrompts}
                    className={cn("btn-icon-tiny w-7 h-7 min-w-[28px] max-w-[28px] min-h-[28px] max-h-[28px] !p-0 aspect-square rounded-lg flex items-center justify-center text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-200 transition-colors bg-transparent border-none shadow-none cursor-pointer shrink-0 select-none active:scale-95")}
                    title={isCopiedAll ? (isVi ? SOURCE_TEXT_DA_SAO_CHEP : SOURCE_TEXT_COPIED) : flowTexts.COPY_ALL}>
                    {isCopiedAll ? <Check className={cn("w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0")} /> : <Copy className={cn("w-4 h-4")} />}
                  </Button>
                  <Button
                    variant={SOURCE_TEXT_UNSTYLED}
                    type={SOURCE_TEXT_BUTTON}
                    onClick={handleClearAllPrompts}
                    disabled={!!busy}
                    className={cn("btn-icon-tiny w-7 h-7 min-w-[28px] max-w-[28px] min-h-[28px] max-h-[28px] !p-0 aspect-square rounded-lg flex items-center justify-center text-rose-500 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-200 transition-colors bg-transparent border-none shadow-none cursor-pointer shrink-0 select-none active:scale-95 disabled:opacity-30")}
                    title={flowTexts.CLEAR_ALL}>
                    <Trash2 className={cn("w-4 h-4 shrink-0")} />
                  </Button>
                </div>
              )}
            </div>
            <div className={cn("flex-1 min-h-0 flex flex-col overflow-hidden")}>
              {!clips.length ? (
                <div className={cn("flex-1 flex items-center justify-center text-center py-8 text-slate-500")}>
                  <p className={cn("text-xs font-medium")}>{flowTexts.ENTER_REQUEST}</p>
                </div>
              ) : (
                <div className={cn("flex-1 min-h-0 overflow-y-auto custom-scrollbar space-y-2 pr-1.5 pb-1")}>
                  {_.map(clips, (clip, index) => (
                    <div
                      key={clip.id}
                      className={cn("group flex items-start gap-2.5 rounded-xl border px-3 py-2.5 bg-slate-955/70 hover:bg-slate-950/90 transition-all hover:border-purple-500/40 shrink-0 w-full min-w-0", {
                        "border-emerald-500/30": clip.status === FLOW_CLIP_STATUSES.DONE,
                        "border-rose-500/30": !(clip.status === FLOW_CLIP_STATUSES.DONE) && clip.status === FLOW_CLIP_STATUSES.FAILED,
                        "border-purple-500/60 ring-1 ring-purple-500/20": !(clip.status === FLOW_CLIP_STATUSES.DONE) && !(clip.status === FLOW_CLIP_STATUSES.FAILED) && clip.status === FLOW_CLIP_STATUSES.GENERATING,
                        "border-slate-800/80": !(clip.status === FLOW_CLIP_STATUSES.DONE) && !(clip.status === FLOW_CLIP_STATUSES.FAILED) && !(clip.status === FLOW_CLIP_STATUSES.GENERATING),
                      })}>
                      <span className={cn("w-5 h-5 rounded-md bg-purple-500/10 border border-purple-500/20 text-purple-300 font-mono font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5")}>{index + 1}</span>
                      <p className={cn("flex-1 min-w-0 text-xs text-slate-200 leading-relaxed font-sans select-text break-words line-clamp-2")} title={clip.prompt}>
                        {clip.prompt}
                      </p>
                      <div className={cn("flex items-center gap-1 shrink-0 pt-0.5")}>
                        <Button
                          variant={SOURCE_TEXT_UNSTYLED}
                          type={SOURCE_TEXT_BUTTON}
                          onClick={() => handleCopyPrompt(clip.id, clip.prompt)}
                          className={cn("btn-icon-tiny w-6 h-6 min-w-[24px] max-w-[24px] min-h-[24px] max-h-[24px] !p-0 aspect-square rounded-md flex items-center justify-center text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-200 transition-colors bg-transparent border-none shadow-none cursor-pointer shrink-0 select-none active:scale-90")}
                          title={copiedPromptId === clip.id ? (isVi ? SOURCE_TEXT_DA_SAO_CHEP : SOURCE_TEXT_COPIED) : flowTexts.COPY}>
                          {copiedPromptId === clip.id ? <Check className={cn("w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 shrink-0")} /> : <Copy className={cn("w-3.5 h-3.5 shrink-0")} />}
                        </Button>
                        <Button
                          variant={SOURCE_TEXT_UNSTYLED}
                          type={SOURCE_TEXT_BUTTON}
                          disabled={!!busy}
                          onClick={() => handleDeleteClip(clip)}
                          className={cn("btn-icon-tiny w-6 h-6 min-w-[24px] max-w-[24px] min-h-[24px] max-h-[24px] !p-0 aspect-square rounded-md flex items-center justify-center text-rose-500 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-200 transition-colors bg-transparent border-none shadow-none cursor-pointer shrink-0 select-none active:scale-90 disabled:opacity-30")}
                          title={flowTexts.DELETE}>
                          <Trash2 className={cn("w-3.5 h-3.5 shrink-0")} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className={cn("glass-card rounded-2xl sm:rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-xl w-full")}>
          <div className={cn("flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3")}>
            <div className={cn("flex items-center gap-2.5")}>
              <span className={cn("w-6 h-6 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center font-mono font-black text-xs shadow-sm shadow-rose-500/20")}>{SOURCE_TEXT_03}</span>
              <h3 className={cn("text-xs font-bold uppercase tracking-wider text-slate-100 font-mono flex items-center gap-2")}>
                <Film className={cn("w-3.5 h-3.5 text-rose-400")} />
                <span>{flowTexts.RENDERED_VIDEOS}</span>
              </h3>
              <span className={cn("text-[10px] font-bold text-rose-300 bg-rose-500/15 border border-rose-500/30 px-2 py-0.5 rounded-full font-mono")}>
                {completedVideosCount}
                {SOURCE_TEXT_SYMBOL_2}
                {clips.length} {flowTexts.READY}
              </span>
            </div>
          </div>
          {!clips.length ? (
            <div className={cn("text-center py-10 space-y-2 text-slate-500")}>
              <div className={cn("w-10 h-10 rounded-2xl bg-slate-800/60 border border-slate-700/60 text-slate-400 flex items-center justify-center mx-auto")}>
                <Video className={cn("w-5 h-5 text-slate-500")} />
              </div>
              <p className={cn("text-xs font-medium")}>{flowTexts.NO_VIDEOS}</p>
            </div>
          ) : (
            <div className={cn("grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4")}>
              {_.map(clips, (clip) => {
                const isDone = clip.status === FLOW_CLIP_STATUSES.DONE;
                const isGenerating = clip.status === FLOW_CLIP_STATUSES.GENERATING;
                const isFailed = clip.status === FLOW_CLIP_STATUSES.FAILED;
                return (
                  <div
                    key={clip.id}
                    className={cn("group rounded-2xl border bg-slate-955 overflow-hidden transition-all shadow-md flex flex-col justify-between hover:shadow-xl", {
                      "border-purple-500/30 hover:border-purple-500/60": isDone,
                      "border-rose-500/30": !isDone && isFailed,
                      "border-purple-500/60 ring-1 ring-purple-500/20 animate-pulse": !isDone && !isFailed && isGenerating,
                      "border-slate-800": !isDone && !isFailed && !isGenerating,
                    })}>
                    <div className={cn("relative aspect-video bg-black flex items-center justify-center overflow-hidden")}>
                      {clip.url ? (
                        <div onClick={() => setPreviewVideoUrl(clip.url || null)} className={cn("relative w-full h-full cursor-pointer group/video flex items-center justify-center")} title={flowTexts.VIEW_VIDEO}>
                          <video src={clip.url} preload={SOURCE_TEXT_METADATA} className={cn("w-full h-full object-contain pointer-events-none")} />
                          <div className={cn("absolute inset-0 bg-black/25 group-hover/video:bg-black/10 transition-colors flex items-center justify-center")}>
                            <div className={cn("w-10 h-10 rounded-full bg-black/60 group-hover/video:bg-purple-600/90 text-white flex items-center justify-center shadow-lg backdrop-blur-xs transition-all transform group-hover/video:scale-110 border border-white/20")}>
                              <Play className={cn("w-4 h-4 fill-current ml-0.5")} />
                            </div>
                          </div>
                        </div>
                      ) : isGenerating ? (
                        <div className={cn("flex flex-col items-center justify-center gap-2 p-3 text-center")}>
                          <div className={cn("relative flex items-center justify-center")}>
                            <div className={cn("absolute inset-0 rounded-full bg-purple-500/30 blur-md animate-pulse")} />
                            <Sparkles className={cn("w-7 h-7 text-purple-400 animate-spin relative z-10")} />
                          </div>
                          <span className={cn("text-xs font-semibold text-purple-300 tracking-wide")}>{flowTexts.GENERATING}</span>
                        </div>
                      ) : isFailed ? (
                        <div className={cn("flex flex-col items-center gap-1 p-3 text-center")}>
                          <AlertTriangle className={cn("w-5 h-5 text-rose-400")} />
                          <span className={cn("text-[10px] font-semibold text-rose-300")}>{flowTexts.FAILED}</span>
                        </div>
                      ) : (
                        <div className={cn("flex flex-col items-center gap-1 p-3 text-center text-slate-600")}>
                          <Film className={cn("w-6 h-6 text-slate-700")} />
                          <span className={cn("text-[10px] font-mono text-slate-500")}>{flowTexts.WAITING}</span>
                        </div>
                      )}
                      {(isDone || isFailed) && (
                        <div className={cn("absolute bottom-2 left-2 pointer-events-none")}>
                          <span className={cn("text-[9px] font-mono font-bold px-1.5 py-0.5 rounded backdrop-blur-md flex items-center gap-1", { "bg-emerald-500/80 text-white": isDone, "bg-rose-500/80 text-white": !isDone })}>
                            {isDone && <Check className={cn("w-2.5 h-2.5")} />}
                            {isFailed && <AlertTriangle className={cn("w-2.5 h-2.5")} />}
                            {isDone ? flowTexts.DONE : flowTexts.FAILED}
                          </span>
                        </div>
                      )}
                    </div>
                    <div
                      className={cn("p-2.5 bg-slate-900/60 border-t border-slate-800/80 min-w-0", clip.url && "cursor-pointer hover:bg-slate-900/90 transition-colors")}
                      onClick={() => {
                        if (clip.url) setPreviewVideoUrl(clip.url);
                      }}>
                      <p className={cn("text-xs font-semibold text-slate-200 truncate")} title={resolveClipTitle(clip)}>
                        {resolveClipTitle(clip)}
                      </p>
                      <p className={cn("text-[10px] text-slate-400 leading-relaxed line-clamp-2 break-words mt-1")} title={clip.prompt}>
                        {clip.prompt}
                      </p>
                      {clip.error && (
                        <p className={cn("text-[10px] text-rose-400 truncate mt-1")} title={clip.error}>
                          {clip.error}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      {previewVideoUrl && (
        <Modal isOpen={Boolean(previewVideoUrl)} onClose={() => setPreviewVideoUrl(null)} title={flowTexts.PREVIEW} maxWidth={SOURCE_TEXT_XL}>
          <div className={cn("space-y-4 p-2")}>
            <div className={cn("aspect-video bg-black rounded-2xl overflow-hidden border border-slate-800 shadow-2xl flex items-center justify-center")}>
              <video src={previewVideoUrl} controls autoPlay className={cn("w-full h-full object-contain")} />
            </div>
            <div className={cn("flex items-center justify-end")}>
              <Button type={SOURCE_TEXT_BUTTON} variant={SOURCE_TEXT_SECONDARY} onClick={() => setPreviewVideoUrl(null)}>
                {flowTexts.CLOSE}
              </Button>
            </div>
          </div>
        </Modal>
      )}
      <Modal
        isOpen={Boolean(clipToDelete)}
        onClose={() => setClipToDelete(null)}
        maxWidth={SOURCE_TEXT_MD}
        title={
          <span className={cn("inline-flex items-center gap-2 text-slate-100")}>
            <Trash2 className={cn("w-4 h-4 text-rose-500 shrink-0")} />
            <span className={cn("text-sm font-bold")}>{flowTexts.CONFIRM_DELETE}</span>
          </span>
        }>
        <div className={cn("space-y-4 text-left p-1")}>
          <p className={cn("text-xs sm:text-sm text-slate-300 leading-relaxed")}>{flowTexts.CONFIRM_DELETE_BODY}</p>
          {clipToDelete && (
            <div className={cn("p-3 rounded-xl bg-slate-955 border border-slate-800 text-xs text-slate-300 italic line-clamp-3 leading-relaxed")}>
              {SOURCE_TEXT_SYMBOL_3}
              {clipToDelete.prompt}
              {SOURCE_TEXT_SYMBOL_3}
            </div>
          )}
          <DestructiveActionNotice className={cn("p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-semibold flex items-center gap-2")} iconClassName={cn("w-4 h-4 text-rose-400 shrink-0")}>
            {flowTexts.IRREVERSIBLE}
          </DestructiveActionNotice>
          <div className={cn("flex justify-end items-center gap-2.5 pt-3 border-t border-slate-800")}>
            <Button type={SOURCE_TEXT_BUTTON} variant={SOURCE_TEXT_SECONDARY} size={SOURCE_TEXT_SM} onClick={() => setClipToDelete(null)} className={cn("h-9 px-4 rounded-xl text-xs font-semibold")}>
              {flowTexts.CANCEL}
            </Button>
            <Button type={SOURCE_TEXT_BUTTON} variant={SOURCE_TEXT_DANGER} size={SOURCE_TEXT_SM} onClick={confirmDeleteClip} className={cn("h-9 px-5 rounded-xl text-xs font-bold shadow-md shadow-rose-600/20")}>
              {flowTexts.DELETE}
            </Button>
          </div>
        </div>
      </Modal>
      <Modal
        isOpen={showClearAllModal}
        onClose={() => setShowClearAllModal(false)}
        maxWidth={SOURCE_TEXT_MD}
        title={
          <span className={cn("inline-flex items-center gap-2 text-slate-100")}>
            <Trash2 className={cn("w-4 h-4 text-rose-500 shrink-0")} />
            <span className={cn("text-sm font-bold")}>{flowTexts.CLEAR_ALL}</span>
          </span>
        }>
        <div className={cn("space-y-4 text-left p-1")}>
          <p className={cn("text-xs sm:text-sm text-slate-300 leading-relaxed")}>{flowTexts.CLEAR_ALL_CONFIRM(clips.length)}</p>
          <DestructiveActionNotice className={cn("p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-semibold flex items-center gap-2")} iconClassName={cn("w-4 h-4 text-rose-400 shrink-0")}>
            {flowTexts.IRREVERSIBLE}
          </DestructiveActionNotice>
          <div className={cn("flex justify-end items-center gap-2.5 pt-3 border-t border-slate-800")}>
            <Button type={SOURCE_TEXT_BUTTON} variant={SOURCE_TEXT_SECONDARY} size={SOURCE_TEXT_SM} onClick={() => setShowClearAllModal(false)} className={cn("h-9 px-4 rounded-xl text-xs font-semibold")}>
              {flowTexts.CANCEL}
            </Button>
            <Button type={SOURCE_TEXT_BUTTON} variant={SOURCE_TEXT_DANGER} size={SOURCE_TEXT_SM} onClick={confirmClearAllPrompts} className={cn("h-9 px-5 rounded-xl text-xs font-bold shadow-md shadow-rose-600/20")}>
              {flowTexts.CLEAR_PROMPTS}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
