import { RUNTIME_TEXT as RT_SHARED } from "../../../constants/runtime/shared.js";
import { RUNTIME_TEXT as RT_FLOW } from "../constants/runtimeText.js";
import { StudioHeader, StudioPage, StudioCanvas, StudioDisclosureButton, StudioFieldset, StudioCard, StudioTextarea } from "../../../components/ui/Studio.js";
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
} from "../../../constants/sourceText";
import { readBlobAsDataUrl } from "../../../lib/fileUtils";
import { DestructiveActionNotice } from "../../../components/common/DestructiveActionNotice";
import { delayAsync } from "../../../lib/asyncUtils";
import { getErrorMessage } from "../../../utils/errorUtils";
import { useEffect, useState } from "react";
import { Film, FolderOpen, Sparkles, Copy, Check, Trash2, AlertTriangle, Video, Play, Flame, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import { recordWorkflowActivity } from "../../../services/workflowActivity";
import { WORKFLOW_ACTIVITY_CONFIG, WORKFLOW_ACTIVITY_EVENT } from "../../../constants/workflowActivity";
import { stringifyJson } from "../../../lib/jsonStringify";
import { API_ROUTES, FLOW_BUSY_STATES, FLOW_CLIP_STATUSES, FLOW_DIRECT_VIDEO_CONFIG, FLOW_VIDEO_MEDIA_CONFIG, FLOW_VIDEO_TEXTS, LANGUAGE_CODES } from "../../../constants";
import { Lang } from "../../../lib/lang";
import { AiPlanningChatModel, AiPlanningExecutionMode, AiPlanningFallbackProvider, AspectRatio, GenerateType, ImageGenerationMode, ImageGeneratorEngine, StoryboardScene, VideoProject } from "../../../types";
import { submitProjectFlowVideoBatch, recoverProjectFlowVideo, isPersistedProjectVideoUrl } from "../../../services/projectImageGenerationService";
import ChatPlanningSettingsBlock from "../../../components/common/ChatPlanningSettingsBlock";
import { Button } from "../../../components/ui/Button";
import { Modal } from "../../../components/ui/Modal";
import { cn } from "../../../lib/utils";
import { jsonUtils } from "../../../lib/json";
import { resolveFlowVideoPlanningModel } from "../../../services/flowVideoPlanningModel";
import { normalizeVideoModelSettings } from "../../../services/videoModelCapabilityService";
import FlowVideoProductionSettings, { FlowVideoProductionConfig } from "./FlowVideoProductionSettings";
import { FLOW_VIDEO_MODEL_OPTIONS } from "../constants/flowVideoSettings";
import { FLOW_VIDEO_CHARACTER_REFERENCE_CONFIG } from "../constants/flowVideoSettings";
import FlowVideoCharacterImages, { FlowVideoCharacterImage } from "./FlowVideoCharacterImages";
import { getVideoModelCapabilities } from "../../../services/videoModelCapabilityService";
type Clip = { id: string; title?: string; prompt: string; url?: string; savedPath?: string; remoteMediaIds?: string[]; status: "waiting" | "generating" | "done" | "failed"; error?: string };
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
  return _.slice(phrase.split(/\s+/), 0, 8).join(RT_SHARED.SYMBOL_36A9E7) || SOURCE_TEXT_VIDEO_CHUA_DAT_TEN;
};
const SAMPLE_PROMPTS = [
  { title: SOURCE_TEXT_BOLERO_TRU_TINH, text: SOURCE_TEXT_TAO_10_VIDEO_DA_DANG_THEO },
  { title: SOURCE_TEXT_LO_FI_CHILLOUT, text: SOURCE_TEXT_TAO_10_VIDEO_KHONG_GIAN_QUAN },
  { title: SOURCE_TEXT_THIEN_NHIEN_4K, text: SOURCE_TEXT_TAO_10_VIDEO_FLYCAM_GOC_RONG },
  { title: SOURCE_TEXT_CYBERPUNK_NEON, text: SOURCE_TEXT_TAO_10_VIDEO_THANH_PHO_TUONG },
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
    const normalized = normalizeVideoModelSettings(engine, { duration: stored?.duration || projectVisual?.videoDuration, resolution: stored?.resolution || projectVisual?.videoResolution, aspectRatio: stored?.aspectRatio || (projectVisual?.aspectRatio as AspectRatio) });
    return { engine, duration: normalized.duration, resolution: normalized.resolution, aspectRatio: normalized.aspectRatio, chromeHeadless: stored?.chromeHeadless ?? projectVisual?.chromeHeadless ?? true };
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
    jsonUtils.setItem(LOCAL_STORAGE_KEY, { projectId, request, folderPath, clips, provider, model, executionMode, chromeHeadless, productionConfig });
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
      const response = await fetch(API_ROUTES.PIPELINE_SELECT_FOLDER, { method: SOURCE_TEXT_POST, headers: { "Content-Type": SOURCE_TEXT_APPLICATION_JSON } });
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
    const response = await fetch(url, { method: SOURCE_TEXT_POST, headers: { "Content-Type": SOURCE_TEXT_APPLICATION_JSON }, body: stringifyJson(body) });
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
      const data = await post(API_ROUTES.PIPELINE_PLAN_FLOW_VIDEO_PROMPTS, { request: request.trim(), projectId: projectId || undefined, execution: { provider, model, mode: executionMode, chromeHeadless } });
      const generatedVideos: { title: string; prompt: string }[] = data.videos || [];
      if (!generatedVideos.length) throw new Error(flowTexts.PLAN_FAILED);
      setClips(_.map(generatedVideos, ({ title, prompt }, index: number) => ({ id: SOURCE_TEMPLATE_FLOWCLIP(`${Date.now()}`, `${index + 1}`), title, prompt, status: SOURCE_TEXT_WAITING })));
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
        visualConfig: { ...project.visualConfig, generationMode: ImageGenerationMode.LabsFlow, imageGeneratorEngine: productionConfig.engine, generateType: GenerateType.Video, aspectRatio: productionConfig.aspectRatio, videoDuration: productionConfig.duration, videoResolution: productionConfig.resolution, chromeHeadless: productionConfig.chromeHeadless },
        updatedAt: new Date().toISOString(),
      };
      if (pending.length) {
        const save = await fetch(SOURCE_TEMPLATE_SYMBOL(`${API_ROUTES.PROJECTS}`, `${encodeURIComponent(projectId)}`), { method: SOURCE_TEXT_PUT, headers: { "Content-Type": SOURCE_TEXT_APPLICATION_JSON }, body: stringifyJson(nextProject) });
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
                [{ sceneId: clip.id, prompt: clip.prompt, generateType: GenerateType.Video, referenceImages: _.map(characterImages, (image) => image.dataUrl), referenceImageNames: _.map(characterImages, (image) => image.name), requireReferenceReady: characterImages.length > 0 }],
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
    const allText = _.map(clips, (c, i) => SOURCE_TEMPLATE_SYMBOL_6(`${i + 1}`, `${c.prompt}`)).join(RT_SHARED.SYMBOL_75A11D);
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
    <StudioPage>
      <StudioCanvas>
        <StudioHeader
          icon={Film}
          title={<>{flowTexts.VIDEO_CREATOR_TITLE}</>}
          description={<>{isVi ? SOURCE_TEXT_AI_VIET_PROMPT_TU_YEU_CAU : SOURCE_TEXT_AI_WRITES_PROMPTS_FROM_YOUR_CONCEPT}</>}
          badge={<>{SOURCE_TEXT_AI_FLOW}</>}
          actions={
            <>
              <div className={cn(RT_SHARED.FLEX_ITEMS_CENTER_GAP_2_SELF_START_SM_SELF_AUTO)}>
                <StudioDisclosureButton type={SOURCE_TEXT_BUTTON} onClick={() => setShowSettings(!showSettings)} disabled={!!busy} expanded={showSettings} label={<>{flowTexts.AI_SETTINGS}</>} />
              </div>
            </>
          }></StudioHeader>
        {showSettings && (
          <StudioFieldset disabled={!!busy} className={cn(RT_FLOW.GLASS_CARD_ROUNDED_2XL_P_4_BG_SLATE_900_80)}>
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
          </StudioFieldset>
        )}
        <div className={cn(RT_FLOW.GRID_GRID_COLS_1_LG_GRID_COLS_12_GAP_5)}>
          <StudioCard className={cn(RT_FLOW.LG_COL_SPAN_6_FLEX_FLEX_COL_JUSTIFY_BETWEEN_GAP)}>
            <div className={cn(RT_FLOW.SPACE_Y_3_5_FLEX_1_FLEX_FLEX_COL)}>
              <div className={cn(RT_FLOW.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN_BORDER_B_BORDER_SLATE_800)}>
                <div className={cn(RT_SHARED.FLEX_ITEMS_CENTER_GAP_2_5_MIN_W_0)}>
                  <span className={cn(RT_SHARED.W_6_H_6_ROUNDED_XL_BG_PURPLE_500_15)}>{SOURCE_TEXT_01}</span>
                  <h2 className={cn(RT_SHARED.TEXT_XS_FONT_BOLD_UPPERCASE_TRACKING_WIDER_TEXT_SLATE_100)}>
                    <Sparkles className={cn(RT_SHARED.W_3_5_H_3_5_TEXT_PURPLE_400)} />
                    <span>{flowTexts.REQUEST_LABEL}</span>
                  </h2>
                </div>
              </div>
              <div className={cn(RT_SHARED.SPACE_Y_1_5)}>
                <div className={cn(RT_FLOW.FLEX_ITEMS_CENTER_GAP_1_5_TEXT_10PX_FONT_MONO)}>
                  <Flame className={cn(RT_SHARED.W_3_5_H_3_5_TEXT_AMBER_400)} />
                  <span>{flowTexts.QUICK_SAMPLES}</span>
                </div>
                <div className={cn(RT_SHARED.FLEX_FLEX_WRAP_GAP_1_5)}>
                  {_.map(SAMPLE_PROMPTS, (sample) => {
                    const isSelected = request === sample.text;
                    return (
                      <Button
                        variant={SOURCE_TEXT_UNSTYLED}
                        key={sample.title}
                        type={SOURCE_TEXT_BUTTON}
                        disabled={!!busy}
                        onClick={() => setRequest(sample.text)}
                        className={cn(RT_FLOW.RELATIVE_H_8_PX_3_ROUNDED_XL_BORDER_FONT_BOLD, {
                          "bg-gradient-to-r from-purple-600 to-pink-600 border-purple-400 text-white shadow-purple-600/30 shadow-md scale-[1.02]": isSelected,
                          "bg-white/80 dark:bg-slate-955/90 border-slate-200 dark:border-slate-800 !text-[#1e293b] hover:!text-[#6b21a8] dark:!text-slate-300 dark:hover:!text-white hover:border-purple-400/60 dark:hover:border-purple-500/40 hover:bg-purple-50/60 dark:hover:bg-slate-900/90": !isSelected,
                        })}>
                        <span>{sample.title}</span>
                      </Button>
                    );
                  })}
                </div>
              </div>
              <div className={cn(RT_FLOW.FLEX_1_MIN_H_130PX_FLEX_FLEX_COL)}>
                <StudioTextarea value={request} onChange={(event) => setRequest(event.target.value)} disabled={!!busy} placeholder={flowTexts.REQUEST_PLACEHOLDER} className={cn(RT_FLOW.W_FULL_FLEX_1_MIN_H_130PX_ROUNDED_XL_BORDER)} />
              </div>
              <Button
                variant={SOURCE_TEXT_UNSTYLED}
                type={SOURCE_TEXT_BUTTON}
                disabled={!!busy || !request.trim()}
                onClick={plan}
                className={cn(RT_FLOW.W_FULL_H_10_PX_4_ROUNDED_XL_TEXT_XS, { "bg-purple-600/50 text-purple-200 border border-purple-400/30 cursor-wait": busy === FLOW_BUSY_STATES.PLANNING, "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white border border-purple-400/30 shadow-purple-600/20 active:scale-98": !(busy === FLOW_BUSY_STATES.PLANNING) })}>
                {busy === FLOW_BUSY_STATES.PLANNING ? (
                  <>
                    <Sparkles className={cn(RT_FLOW.W_4_H_4_ANIMATE_SPIN_SHRINK_0_TEXT_FUCHSIA)} />
                    <span>{flowTexts.WRITING_PROMPTS}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className={cn(RT_SHARED.W_4_H_4_SHRINK_0)} />
                    <span>{flowTexts.WRITE_PROMPTS}</span>
                  </>
                )}
              </Button>
            </div>
            <div className={cn(RT_FLOW.PT_3_BORDER_T_BORDER_SLATE_800_80_SPACE_Y)}>
              <div className={cn(RT_SHARED.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN_GAP_2)}>
                <div className={cn(RT_SHARED.FLEX_ITEMS_CENTER_GAP_2)}>
                  <SlidersHorizontal className={cn(RT_SHARED.W_3_5_H_3_5_TEXT_AMBER_400)} />
                  <span className={cn(RT_FLOW.TEXT_XS_FONT_BOLD_UPPERCASE_TRACKING_WIDER_TEXT_SLATE_100)}>{flowTexts.FLOW_SETTINGS}</span>
                </div>
                {folderPath && (
                  <span className={cn(RT_FLOW.TEXT_10PX_FONT_MONO_TEXT_EMERALD_400_FLEX_ITEMS_CENTER)}>
                    <Check className={cn(RT_SHARED.W_3_H_3)} /> {flowTexts.SELECTED}
                  </span>
                )}
              </div>
              <FlowVideoProductionSettings config={productionConfig} onChange={setProductionConfig} disabled={!!busy} texts={flowTexts} hasCharacterImages={characterImages.length > 0} />
              <FlowVideoCharacterImages images={characterImages} disabled={!!busy || !projectId || !characterImagesLoaded || isReadingCharacterImages} texts={flowTexts} onAdd={addCharacterImages} onRemove={(id) => setCharacterImages((current) => _.filter(current, (image) => image.id !== id))} />
              <div className={cn(RT_FLOW.GRID_GRID_COLS_1_SM_GRID_COLS_12_GAP_2)}>
                <div onClick={!busy ? chooseFolder : undefined} className={cn(RT_FLOW.SM_COL_SPAN_7_FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN_GAP, { "border-purple-500/40 hover:border-purple-500": folderPath, "border-dashed border-slate-700 hover:border-purple-500/60": !folderPath }, { "opacity-50 cursor-not-allowed": busy, "cursor-pointer": !busy })}>
                  <div className={cn(RT_SHARED.FLEX_ITEMS_CENTER_GAP_2_MIN_W_0)}>
                    <FolderOpen className={cn(RT_SHARED.W_4_H_4_TEXT_PURPLE_400_SHRINK_0)} />
                    <span className={cn(RT_FLOW.TEXT_XS_FONT_MEDIUM_TEXT_SLATE_200_TRUNCATE)}>{folderPath || flowTexts.SELECT_FOLDER}</span>
                  </div>
                  <span className={cn(RT_FLOW.TEXT_11PX_FONT_SEMIBOLD_TEXT_PURPLE_300_SHRINK_0)}>{folderPath ? flowTexts.CHANGE : flowTexts.BROWSE}</span>
                </div>
                <Button
                  variant={SOURCE_TEXT_UNSTYLED}
                  type={SOURCE_TEXT_BUTTON}
                  disabled={!!busy || !characterImagesLoaded || isReadingCharacterImages || (!readyClipsCount && !recoverableVideosCount && !unsavedVideosCount) || !folderPath}
                  onClick={generate}
                  className={cn(RT_FLOW.SM_COL_SPAN_5_H_FULL_MIN_H_42PX_PX, {
                    "border border-slate-800 bg-slate-800/40 text-slate-500 cursor-not-allowed shadow-none": (!readyClipsCount && !recoverableVideosCount && !unsavedVideosCount) || !folderPath,
                    "border border-rose-500/40 bg-rose-950/80 text-rose-300 cursor-wait animate-pulse": !((!readyClipsCount && !recoverableVideosCount && !unsavedVideosCount) || !folderPath) && busy === FLOW_BUSY_STATES.GENERATING,
                    "border border-rose-500/40 bg-gradient-to-r from-rose-600 via-red-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white shadow-rose-600/30 cursor-pointer active:scale-98": !((!readyClipsCount && !recoverableVideosCount && !unsavedVideosCount) || !folderPath) && !(busy === FLOW_BUSY_STATES.GENERATING),
                  })}>
                  {busy === FLOW_BUSY_STATES.GENERATING ? (
                    <>
                      <Sparkles className={cn(RT_FLOW.W_4_H_4_ANIMATE_SPIN_SHRINK_0_TEXT_WHITE)} />
                      <span className={cn(RT_SHARED.TRUNCATE)}>{progress || flowTexts.RENDERING}</span>
                    </>
                  ) : (
                    <>
                      <Video className={cn(RT_SHARED.W_4_H_4_SHRINK_0)} />
                      <span className={cn(RT_SHARED.TRUNCATE)}>{recoverableVideosCount ? flowTexts.RESUME_VIDEOS(recoverableVideosCount) : unsavedVideosCount ? flowTexts.SAVE_REMAINING_VIDEOS(unsavedVideosCount) : flowTexts.CREATE_VIDEOS(readyClipsCount)}</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </StudioCard>
          <StudioCard className={cn(RT_FLOW.LG_COL_SPAN_6_FLEX_FLEX_COL_GLASS_CARD_ROUNDED)}>
            <div className={cn(RT_FLOW.FLEX_FLEX_WRAP_ITEMS_CENTER_JUSTIFY_BETWEEN_GAP_3_BORDER)}>
              <div className={cn(RT_SHARED.FLEX_ITEMS_CENTER_GAP_2_5_MIN_W_0)}>
                <span className={cn(RT_SHARED.W_6_H_6_ROUNDED_XL_BG_PURPLE_500_15)}>{SOURCE_TEXT_02}</span>
                <h3 className={cn(RT_SHARED.TEXT_XS_FONT_BOLD_UPPERCASE_TRACKING_WIDER_TEXT_SLATE_100)}>
                  <Sparkles className={cn(RT_SHARED.W_3_5_H_3_5_TEXT_PURPLE_400)} />
                  <span>{flowTexts.PROMPT_LIST}</span>
                  <span className={cn(RT_SHARED.PX_1_5_PY_0_2_ROUNDED_TEXT_9PX_BG)}>{clips.length}</span>
                </h3>
              </div>
              {clips.length > 0 && (
                <div className={cn(RT_SHARED.FLEX_ITEMS_CENTER_GAP_1_5)}>
                  <Button variant={SOURCE_TEXT_UNSTYLED} type={SOURCE_TEXT_BUTTON} onClick={handleCopyAllPrompts} className={cn(RT_FLOW.BTN_ICON_TINY_W_7_H_7_MIN_W_28PX)} title={isCopiedAll ? (isVi ? SOURCE_TEXT_DA_SAO_CHEP : SOURCE_TEXT_COPIED) : flowTexts.COPY_ALL}>
                    {isCopiedAll ? <Check className={cn(RT_FLOW.W_4_H_4_TEXT_EMERALD_500_DARK_TEXT_EMERALD)} /> : <Copy className={cn(RT_SHARED.W_4_H_4)} />}
                  </Button>
                  <Button variant={SOURCE_TEXT_UNSTYLED} type={SOURCE_TEXT_BUTTON} onClick={handleClearAllPrompts} disabled={!!busy} className={cn(RT_FLOW.BTN_ICON_TINY_W_7_H_7_MIN_W_28PX_9DA0C7)} title={flowTexts.CLEAR_ALL}>
                    <Trash2 className={cn(RT_SHARED.W_4_H_4_SHRINK_0)} />
                  </Button>
                </div>
              )}
            </div>
            <div className={cn(RT_FLOW.FLEX_1_MIN_H_0_FLEX_FLEX_COL_OVERFLOW_HIDDEN)}>
              {!clips.length ? (
                <div className={cn(RT_FLOW.FLEX_1_FLEX_ITEMS_CENTER_JUSTIFY_CENTER_TEXT_CENTER_PY)}>
                  <p className={cn(RT_FLOW.TEXT_XS_FONT_MEDIUM)}>{flowTexts.ENTER_REQUEST}</p>
                </div>
              ) : (
                <div className={cn(RT_FLOW.FLEX_1_MIN_H_0_OVERFLOW_Y_AUTO_CUSTOM_SCROLLBAR)}>
                  {_.map(clips, (clip, index) => (
                    <div
                      key={clip.id}
                      className={cn(RT_FLOW.GROUP_FLEX_ITEMS_START_GAP_2_5_ROUNDED_XL_BORDER, {
                        "border-emerald-500/30": clip.status === FLOW_CLIP_STATUSES.DONE,
                        "border-rose-500/30": !(clip.status === FLOW_CLIP_STATUSES.DONE) && clip.status === FLOW_CLIP_STATUSES.FAILED,
                        "border-purple-500/60 ring-1 ring-purple-500/20": !(clip.status === FLOW_CLIP_STATUSES.DONE) && !(clip.status === FLOW_CLIP_STATUSES.FAILED) && clip.status === FLOW_CLIP_STATUSES.GENERATING,
                        "border-slate-800/80": !(clip.status === FLOW_CLIP_STATUSES.DONE) && !(clip.status === FLOW_CLIP_STATUSES.FAILED) && !(clip.status === FLOW_CLIP_STATUSES.GENERATING),
                      })}>
                      <span className={cn(RT_FLOW.W_5_H_5_ROUNDED_MD_BG_PURPLE_500_10)}>{index + 1}</span>
                      <p className={cn(RT_FLOW.FLEX_1_MIN_W_0_TEXT_XS_TEXT_SLATE_200)} title={clip.prompt}>
                        {clip.prompt}
                      </p>
                      <div className={cn(RT_FLOW.FLEX_ITEMS_CENTER_GAP_1_SHRINK_0_PT_0_5)}>
                        <Button variant={SOURCE_TEXT_UNSTYLED} type={SOURCE_TEXT_BUTTON} onClick={() => handleCopyPrompt(clip.id, clip.prompt)} className={cn(RT_FLOW.BTN_ICON_TINY_W_6_H_6_MIN_W_24PX)} title={copiedPromptId === clip.id ? (isVi ? SOURCE_TEXT_DA_SAO_CHEP : SOURCE_TEXT_COPIED) : flowTexts.COPY}>
                          {copiedPromptId === clip.id ? <Check className={cn(RT_FLOW.W_3_5_H_3_5_TEXT_EMERALD_500_DARK)} /> : <Copy className={cn(RT_SHARED.W_3_5_H_3_5_SHRINK_0)} />}
                        </Button>
                        <Button variant={SOURCE_TEXT_UNSTYLED} type={SOURCE_TEXT_BUTTON} disabled={!!busy} onClick={() => handleDeleteClip(clip)} className={cn(RT_FLOW.BTN_ICON_TINY_W_6_H_6_MIN_W_24PX_5328FC)} title={flowTexts.DELETE}>
                          <Trash2 className={cn(RT_SHARED.W_3_5_H_3_5_SHRINK_0)} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </StudioCard>
        </div>
        <StudioCard className={cn(RT_FLOW.GLASS_CARD_ROUNDED_2XL_SM_ROUNDED_3XL_P_5_SM)}>
          <div className={cn(RT_FLOW.FLEX_FLEX_WRAP_ITEMS_CENTER_JUSTIFY_BETWEEN_GAP_3_BORDER_254F0C)}>
            <div className={cn(RT_SHARED.FLEX_ITEMS_CENTER_GAP_2_5)}>
              <span className={cn(RT_FLOW.W_6_H_6_ROUNDED_XL_BG_ROSE_500_15)}>{SOURCE_TEXT_03}</span>
              <h3 className={cn(RT_FLOW.TEXT_XS_FONT_BOLD_UPPERCASE_TRACKING_WIDER_TEXT_SLATE_100_F45694)}>
                <Film className={cn(RT_FLOW.W_3_5_H_3_5_TEXT_ROSE_400)} />
                <span>{flowTexts.RENDERED_VIDEOS}</span>
              </h3>
              <span className={cn(RT_FLOW.TEXT_10PX_FONT_BOLD_TEXT_ROSE_300_BG_ROSE_500)}>
                {completedVideosCount}
                {SOURCE_TEXT_SYMBOL_2}
                {clips.length} {flowTexts.READY}
              </span>
            </div>
          </div>
          {!clips.length ? (
            <div className={cn(RT_FLOW.TEXT_CENTER_PY_10_SPACE_Y_2_TEXT_SLATE_500)}>
              <div className={cn(RT_FLOW.W_10_H_10_ROUNDED_2XL_BG_SLATE_800_60)}>
                <Video className={cn(RT_FLOW.W_5_H_5_TEXT_SLATE_500)} />
              </div>
              <p className={cn(RT_FLOW.TEXT_XS_FONT_MEDIUM)}>{flowTexts.NO_VIDEOS}</p>
            </div>
          ) : (
            <div className={cn(RT_FLOW.GRID_GRID_COLS_1_SM_GRID_COLS_2_MD_GRID)}>
              {_.map(clips, (clip) => {
                const isDone = clip.status === FLOW_CLIP_STATUSES.DONE;
                const isGenerating = clip.status === FLOW_CLIP_STATUSES.GENERATING;
                const isFailed = clip.status === FLOW_CLIP_STATUSES.FAILED;
                return (
                  <div key={clip.id} className={cn(RT_FLOW.GROUP_ROUNDED_2XL_BORDER_BG_SLATE_955_OVERFLOW_HIDDEN_TRANSITION, { "border-purple-500/30 hover:border-purple-500/60": isDone, "border-rose-500/30": !isDone && isFailed, "border-purple-500/60 ring-1 ring-purple-500/20 animate-pulse": !isDone && !isFailed && isGenerating, "border-slate-800": !isDone && !isFailed && !isGenerating })}>
                    <div className={cn(RT_FLOW.RELATIVE_ASPECT_VIDEO_BG_BLACK_FLEX_ITEMS_CENTER_JUSTIFY_CENTER)}>
                      {clip.url ? (
                        <div onClick={() => setPreviewVideoUrl(clip.url || null)} className={cn(RT_FLOW.RELATIVE_W_FULL_H_FULL_CURSOR_POINTER_GROUP_VIDEO_FLEX)} title={flowTexts.VIEW_VIDEO}>
                          <video src={clip.url} preload={SOURCE_TEXT_METADATA} className={cn(RT_FLOW.W_FULL_H_FULL_OBJECT_CONTAIN_POINTER_EVENTS_NONE)} />
                          <div className={cn(RT_FLOW.ABSOLUTE_INSET_0_BG_BLACK_25_GROUP_HOVER_VIDEO_BG)}>
                            <div className={cn(RT_FLOW.W_10_H_10_ROUNDED_FULL_BG_BLACK_60_GROUP)}>
                              <Play className={cn(RT_SHARED.W_4_H_4_FILL_CURRENT_ML_0_5)} />
                            </div>
                          </div>
                        </div>
                      ) : isGenerating ? (
                        <div className={cn(RT_FLOW.FLEX_FLEX_COL_ITEMS_CENTER_JUSTIFY_CENTER_GAP_2_P)}>
                          <div className={cn(RT_SHARED.RELATIVE_FLEX_ITEMS_CENTER_JUSTIFY_CENTER)}>
                            <div className={cn(RT_FLOW.ABSOLUTE_INSET_0_ROUNDED_FULL_BG_PURPLE_500_30_BLUR)} />
                            <Sparkles className={cn(RT_FLOW.W_7_H_7_TEXT_PURPLE_400_ANIMATE_SPIN_RELATIVE)} />
                          </div>
                          <span className={cn(RT_FLOW.TEXT_XS_FONT_SEMIBOLD_TEXT_PURPLE_300_TRACKING_WIDE)}>{flowTexts.GENERATING}</span>
                        </div>
                      ) : isFailed ? (
                        <div className={cn(RT_FLOW.FLEX_FLEX_COL_ITEMS_CENTER_GAP_1_P_3_TEXT)}>
                          <AlertTriangle className={cn(RT_FLOW.W_5_H_5_TEXT_ROSE_400)} />
                          <span className={cn(RT_FLOW.TEXT_10PX_FONT_SEMIBOLD_TEXT_ROSE_300)}>{flowTexts.FAILED}</span>
                        </div>
                      ) : (
                        <div className={cn(RT_FLOW.FLEX_FLEX_COL_ITEMS_CENTER_GAP_1_P_3_TEXT_22CF5D)}>
                          <Film className={cn(RT_FLOW.W_6_H_6_TEXT_SLATE_700)} />
                          <span className={cn(RT_FLOW.TEXT_10PX_FONT_MONO_TEXT_SLATE_500)}>{flowTexts.WAITING}</span>
                        </div>
                      )}
                      {(isDone || isFailed) && (
                        <div className={cn(RT_FLOW.ABSOLUTE_BOTTOM_2_LEFT_2_POINTER_EVENTS_NONE)}>
                          <span className={cn(RT_FLOW.TEXT_9PX_FONT_MONO_FONT_BOLD_PX_1_5_PY, { "bg-emerald-500/80 text-white": isDone, "bg-rose-500/80 text-white": !isDone })}>
                            {isDone && <Check className={cn(RT_FLOW.W_2_5_H_2_5)} />}
                            {isFailed && <AlertTriangle className={cn(RT_FLOW.W_2_5_H_2_5)} />}
                            {isDone ? flowTexts.DONE : flowTexts.FAILED}
                          </span>
                        </div>
                      )}
                    </div>
                    <div
                      className={cn(RT_FLOW.P_2_5_BG_SLATE_900_60_BORDER_T_BORDER, clip.url && RT_FLOW.CURSOR_POINTER_HOVER_BG_SLATE_900_90_TRANSITION_COLORS)}
                      onClick={() => {
                        if (clip.url) setPreviewVideoUrl(clip.url);
                      }}>
                      <p className={cn(RT_FLOW.TEXT_XS_FONT_SEMIBOLD_TEXT_SLATE_200_TRUNCATE)} title={resolveClipTitle(clip)}>
                        {resolveClipTitle(clip)}
                      </p>
                      <p className={cn(RT_FLOW.TEXT_10PX_TEXT_SLATE_400_LEADING_RELAXED_LINE_CLAMP_2)} title={clip.prompt}>
                        {clip.prompt}
                      </p>
                      {clip.error && (
                        <p className={cn(RT_FLOW.TEXT_10PX_TEXT_ROSE_400_TRUNCATE_MT_1)} title={clip.error}>
                          {clip.error}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </StudioCard>
      </StudioCanvas>
      {previewVideoUrl && (
        <Modal isOpen={Boolean(previewVideoUrl)} onClose={() => setPreviewVideoUrl(null)} title={flowTexts.PREVIEW} maxWidth={SOURCE_TEXT_XL}>
          <div className={cn(RT_FLOW.SPACE_Y_4_P_2)}>
            <div className={cn(RT_FLOW.ASPECT_VIDEO_BG_BLACK_ROUNDED_2XL_OVERFLOW_HIDDEN_BORDER_BORDER)}>
              <video src={previewVideoUrl} controls autoPlay className={cn(RT_FLOW.W_FULL_H_FULL_OBJECT_CONTAIN)} />
            </div>
            <div className={cn(RT_FLOW.FLEX_ITEMS_CENTER_JUSTIFY_END)}>
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
          <span className={cn(RT_FLOW.INLINE_FLEX_ITEMS_CENTER_GAP_2_TEXT_SLATE_100)}>
            <Trash2 className={cn(RT_SHARED.W_4_H_4_TEXT_ROSE_500_SHRINK_0)} />
            <span className={cn(RT_FLOW.TEXT_SM_FONT_BOLD)}>{flowTexts.CONFIRM_DELETE}</span>
          </span>
        }>
        <div className={cn(RT_FLOW.SPACE_Y_4_TEXT_LEFT_P_1)}>
          <p className={cn(RT_FLOW.TEXT_XS_SM_TEXT_SM_TEXT_SLATE_300_LEADING_RELAXED)}>{flowTexts.CONFIRM_DELETE_BODY}</p>
          {clipToDelete && (
            <div className={cn(RT_FLOW.P_3_ROUNDED_XL_BG_SLATE_955_BORDER_BORDER_SLATE)}>
              {SOURCE_TEXT_SYMBOL_3}
              {clipToDelete.prompt}
              {SOURCE_TEXT_SYMBOL_3}
            </div>
          )}
          <DestructiveActionNotice className={cn(RT_FLOW.P_3_ROUNDED_XL_BG_ROSE_500_10_BORDER_BORDER)} iconClassName={cn(RT_FLOW.W_4_H_4_TEXT_ROSE_400_SHRINK_0)}>
            {flowTexts.IRREVERSIBLE}
          </DestructiveActionNotice>
          <div className={cn(RT_FLOW.FLEX_JUSTIFY_END_ITEMS_CENTER_GAP_2_5_PT_3)}>
            <Button type={SOURCE_TEXT_BUTTON} variant={SOURCE_TEXT_SECONDARY} size={SOURCE_TEXT_SM} onClick={() => setClipToDelete(null)} className={cn(RT_FLOW.H_9_PX_4_ROUNDED_XL_TEXT_XS_FONT_SEMIBOLD)}>
              {flowTexts.CANCEL}
            </Button>
            <Button type={SOURCE_TEXT_BUTTON} variant={SOURCE_TEXT_DANGER} size={SOURCE_TEXT_SM} onClick={confirmDeleteClip} className={cn(RT_FLOW.H_9_PX_5_ROUNDED_XL_TEXT_XS_FONT_BOLD)}>
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
          <span className={cn(RT_FLOW.INLINE_FLEX_ITEMS_CENTER_GAP_2_TEXT_SLATE_100)}>
            <Trash2 className={cn(RT_SHARED.W_4_H_4_TEXT_ROSE_500_SHRINK_0)} />
            <span className={cn(RT_FLOW.TEXT_SM_FONT_BOLD)}>{flowTexts.CLEAR_ALL}</span>
          </span>
        }>
        <div className={cn(RT_FLOW.SPACE_Y_4_TEXT_LEFT_P_1)}>
          <p className={cn(RT_FLOW.TEXT_XS_SM_TEXT_SM_TEXT_SLATE_300_LEADING_RELAXED)}>{flowTexts.CLEAR_ALL_CONFIRM(clips.length)}</p>
          <DestructiveActionNotice className={cn(RT_FLOW.P_3_ROUNDED_XL_BG_ROSE_500_10_BORDER_BORDER)} iconClassName={cn(RT_FLOW.W_4_H_4_TEXT_ROSE_400_SHRINK_0)}>
            {flowTexts.IRREVERSIBLE}
          </DestructiveActionNotice>
          <div className={cn(RT_FLOW.FLEX_JUSTIFY_END_ITEMS_CENTER_GAP_2_5_PT_3)}>
            <Button type={SOURCE_TEXT_BUTTON} variant={SOURCE_TEXT_SECONDARY} size={SOURCE_TEXT_SM} onClick={() => setShowClearAllModal(false)} className={cn(RT_FLOW.H_9_PX_4_ROUNDED_XL_TEXT_XS_FONT_SEMIBOLD)}>
              {flowTexts.CANCEL}
            </Button>
            <Button type={SOURCE_TEXT_BUTTON} variant={SOURCE_TEXT_DANGER} size={SOURCE_TEXT_SM} onClick={confirmClearAllPrompts} className={cn(RT_FLOW.H_9_PX_5_ROUNDED_XL_TEXT_XS_FONT_BOLD)}>
              {flowTexts.CLEAR_PROMPTS}
            </Button>
          </div>
        </div>
      </Modal>
    </StudioPage>
  );
}
