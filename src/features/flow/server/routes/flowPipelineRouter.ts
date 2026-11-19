import { CHAT_PLANNING_RUNTIME as C } from "../../../../constants/chatPlanningRuntime.js";
import {
  SOURCE_TEMPLATE_SYMBOL_86,
  SOURCE_TEMPLATE_FLOW_VIDEO,
  SOURCE_TEMPLATE_FLOW_VIDEO_PROMPTS,
  SOURCE_TEMPLATE_MP4,
  SOURCE_TEMPLATE_MP4_2,
  SOURCE_TEMPLATE_VIDEO_CHUA_SAN_SANG_DE_LUU,
  SOURCE_TEMPLATE_WRITE_EXACTLY_DISTINCT_VIDEO_CONCEPTS_FOR,
  SOURCE_TEXT_ABORTED,
  SOURCE_TEXT_AI_CHUA_TRA_DU_TEN_VA,
  SOURCE_TEXT_FINISH,
  SOURCE_TEXT_FLOW_VIDEO_PROMPTS,
  SOURCE_TEXT_GENERATE_FLOW_VIDEO_BATCH,
  SOURCE_TEXT_HAY_GHI_SO_VIDEO_1_50,
  SOURCE_TEXT_KHONG_THE_LUU_VIDEO,
  SOURCE_TEXT_KHONG_THE_VIET_PROMPT_VIDEO,
  SOURCE_TEXT_KHONG_TIM_THAY_DU_AN,
  SOURCE_TEXT_PHONG_CHAT_TRA_KET_QUA_KHONG,
  SOURCE_TEXT_PLAN_FLOW_VIDEO_PROMPTS,
  SOURCE_TEXT_RECOVER_FLOW_VIDEO,
  SOURCE_TEXT_SAVE_FLOW_VIDEOS,
  SOURCE_TEXT_SCENEID,
  SOURCE_TEXT_SUCCESS,
  SOURCE_TEXT_SYMBOL_25,
  SOURCE_TEXT_SYSTEM_ERROR,
  SOURCE_TEXT_THIEU_DU_AN_VIDEO_HOAC_THU,
  SOURCE_TEXT_VIDEOS,
  SOURCE_TEXT_VI_TRI_LUU_KHONG_PHAI_THU,
} from "../../../../constants/sourceText.js";
import express, { Request, Response } from "express";
import fs from "fs";
import _ from "lodash";
import path from "path";
import { BACKEND_MESSAGES, CONTENT_TYPES, HTTP_STATUS_CODES, LogEvent, ROUTER_PATHS } from "../../../../constants";
import { FLOW_CHARACTER_CONFIG, FLOW_DIRECT_VIDEO_CONFIG, FLOW_VIDEO_MEDIA_CONFIG, GEMINI_MEDIA_ERRORS, PROJECT_ASSET_INVALID_REQUEST } from "../../../../constants/config.js";
import { FeatureType, SecurityConstants } from "../../../../constants/security.js";
import { stringifyJson } from "../../../../lib/jsonStringify.js";
import { createAppError, getMessage, logger } from "../../../../lib/logger.js";
import { resolveFlowVideoPlanningModel } from "../../../../services/flowVideoPlanningModel.js";
import { AiPlanningExecutionMode, AiPlanningFallbackProvider, GenerateType, SceneAssetStatus } from "../../../../types.js";
import { getErrorMessage } from "../../../../utils/errorUtils";
import { requireLicense } from "../../../../server/middlewares/requireLicense.js";
import { beginChatPlanningRun, closeChatBrowserIfIdle, closeChatPlanningRoom, generatePlanningWithChatUi } from "../../../../server/services/chatUiPlanningService.js";
import { generateContentWithRetry } from "../../../../server/services/geminiService.js";
import { resolveLocalProjectAssetPath } from "../../../../server/services/imageAssetService.js";
import { ensureFlowCharacters, generateFlowVideoPromptBatchWithPlaywright, recoverExistingFlowVideo } from "../../../../server/services/imageGeneratorService.js";
import { getProjectDetailFromDb, saveProjectDetailToDb } from "../../../../server/utils/db.js";
import { safeParseJSON } from "../../../../server/utils/helpers.js";
import { incrementFeatureUsage, requireBatchVisualLicense, persistProjectVideo, getPersistedProjectVideoVariantUrl, persistRecoveredFlowScene, activeVideoProjectKeys } from "../../../../server/controllers/pipelineShared.js";
const router = express.Router();
router.post(SOURCE_TEXT_RECOVER_FLOW_VIDEO, requireLicense(FeatureType.VIDEO), async (req: Request, res: Response) => {
  try {
    const localProjectId = path.basename(_.toString(req.body?.projectId));
    const sceneId = path.basename(_.toString(req.body?.sceneId));
    const project = await getProjectDetailFromDb(localProjectId);
    const flowProjectId = _.trim(_.toString(project?.visualConfig?.flowProjectId));
    const scene = _.find(project?.storyboard, { id: sceneId });
    const persistedMediaIds = _.uniq(_.compact(_.map(!_.isEmpty(scene?.remoteVideoMediaIds) ? scene?.remoteVideoMediaIds : [scene?.remoteVideoMediaId], (mediaId) => _.trim(_.toString(mediaId)))));
    const requestedMediaIds = _.uniq(_.compact(_.map(!_.isEmpty(req.body?.mediaIds) ? _.castArray(req.body.mediaIds) : [req.body?.mediaId], (mediaId) => _.trim(_.toString(mediaId)))));
    const expectedOutputCount = _.defaultTo(scene?.remoteVideoExpectedCount, !_.isEmpty(scene?.remoteVideoMediaIds) ? FLOW_VIDEO_MEDIA_CONFIG.EXPECTED_OUTPUT_COUNT : SecurityConstants.DEFAULT_AMOUNT);
    if (_.some([localProjectId, sceneId, flowProjectId], _.isEmpty) || _.isEmpty(requestedMediaIds)) {
      throw createAppError(FLOW_VIDEO_MEDIA_CONFIG.INVALID_MEDIA_ERROR);
    }
    if (!scene || !_.isEqual(requestedMediaIds, persistedMediaIds)) throw createAppError(PROJECT_ASSET_INVALID_REQUEST);
    const fallbackUrls: string[] = [];
    let recoveryWarning: string = FLOW_VIDEO_MEDIA_CONFIG.REMOTE_DOWNLOAD_PENDING_ERROR;
    for (const [variantIndex, mediaId] of persistedMediaIds.entries()) {
      const existingVariantUrl = _.gt(expectedOutputCount, SecurityConstants.DEFAULT_AMOUNT)
        ? getPersistedProjectVideoVariantUrl(localProjectId, sceneId, variantIndex)
        : (() => {
            const existingVideoUrl = _.toString(scene.assetUrl);
            return FLOW_VIDEO_MEDIA_CONFIG.PROJECT_ASSET_URL_PATTERN.test(existingVideoUrl) && resolveLocalProjectAssetPath(existingVideoUrl) ? existingVideoUrl : undefined;
          })();
      if (existingVariantUrl) {
        fallbackUrls.push(existingVariantUrl);
        continue;
      }
      const result = await recoverExistingFlowVideo({ flowProjectId, mediaId, expectedDuration: _.toString(project?.visualConfig?.videoDuration), sourceUrl: scene.remoteVideoSourceUrl, chromeHeadless: project?.visualConfig?.chromeHeadless, retainBrowserSession: true });
      if (!result.success || _.isEmpty(result.base64)) {
        recoveryWarning = _.defaultTo(result.warning, recoveryWarning);
        break;
      }
      fallbackUrls.push(await persistProjectVideo(localProjectId, sceneId, result.base64!, _.gt(expectedOutputCount, SecurityConstants.DEFAULT_AMOUNT) ? variantIndex : undefined));
    }
    if (_.lt(_.size(fallbackUrls), expectedOutputCount)) {
      const recoveryWasRejected = GEMINI_MEDIA_ERRORS.PROVIDER_REJECTION_PATTERN.test(recoveryWarning);
      const recoveryMediaIsStale = FLOW_VIDEO_MEDIA_CONFIG.STALE_MEDIA_PATTERN.test(recoveryWarning);
      const shouldRegenerate = recoveryWasRejected || recoveryMediaIsStale;
      scene.remoteVideoDownloadPending = !shouldRegenerate;
      scene.remoteVideoExpectedCount = expectedOutputCount;
      scene.assetStatus = SceneAssetStatus.Failed;
      scene.assetError = recoveryWarning;
      if (shouldRegenerate) {
        scene.remoteVideoMediaId = undefined;
        scene.remoteVideoMediaIds = undefined;
        scene.remoteVideoSourceUrl = undefined;
      }
      await saveProjectDetailToDb(project);
      return res.json({ success: false, base64: null, fallbackUrl: SecurityConstants.EMPTY_STRING, fallbackUrls: [], warning: recoveryWarning, remoteMediaId: shouldRegenerate ? undefined : _.head(persistedMediaIds), remoteMediaIds: shouldRegenerate ? [] : persistedMediaIds, remoteMediaCreated: !shouldRegenerate });
    }
    await persistRecoveredFlowScene(project, scene, persistedMediaIds, fallbackUrls);
    return res.json({ success: true, base64: null, fallbackUrl: _.head(fallbackUrls), fallbackUrls, remoteMediaId: _.head(persistedMediaIds), remoteMediaIds: persistedMediaIds, remoteMediaCreated: true });
  } catch (error) {
    logger.error(LogEvent.GENERATE_IMAGE_ROUTE_ERROR, error);
    return res.json({ success: false, base64: null, fallbackUrl: C.EMPTY, warning: getMessage(SOURCE_TEXT_SYSTEM_ERROR, undefined, getErrorMessage(error, FLOW_VIDEO_MEDIA_CONFIG.INVALID_MEDIA_ERROR)) });
  }
});
router.post(SOURCE_TEXT_PLAN_FLOW_VIDEO_PROMPTS, requireLicense(FeatureType.VIDEO), async (req: Request, res: Response) => {
  const request = _.trim(_.toString(req.body?.request));
  const count = _.toInteger(request.match(/(?:^|\s)(\d{1,2})\s*(?:video|clip|đoạn\s+video)\b/i)?.[1]);
  if (!request || count < 1 || count > 50) return res.status(400).json({ success: false, error: SOURCE_TEXT_HAY_GHI_SO_VIDEO_1_50 });
  const execution = req.body?.execution || {};
  const provider = execution.provider || AiPlanningFallbackProvider.GeminiChat;
  const requestId = SOURCE_TEMPLATE_FLOW_VIDEO_PROMPTS(SOURCE_TEMPLATE_SYMBOL_86(`${Date.now()}`), SOURCE_TEMPLATE_SYMBOL_86(`${Math.random().toString(36).slice(2)}`));
  const artifactType = SOURCE_TEXT_FLOW_VIDEO_PROMPTS;
  const prompt = SOURCE_TEMPLATE_WRITE_EXACTLY_DISTINCT_VIDEO_CONCEPTS_FOR(SOURCE_TEMPLATE_SYMBOL_86(`${count}`), SOURCE_TEMPLATE_SYMBOL_86(`${stringifyJson(request)}`), SOURCE_TEMPLATE_SYMBOL_86(`${stringifyJson(requestId)}`), SOURCE_TEMPLATE_SYMBOL_86(`${stringifyJson(artifactType)}`), SOURCE_TEMPLATE_SYMBOL_86(`${count}`));
  try {
    let raw: string;
    if (execution.mode === AiPlanningExecutionMode.ApiOnly) {
      raw = _.toString((await generateContentWithRetry({ contents: prompt, config: { responseMimeType: CONTENT_TYPES.JSON } })).text);
    } else {
      const projectId = _.toString(req.body?.projectId || requestId);
      const run = beginChatPlanningRun(requestId, Date.now(), SOURCE_TEXT_FLOW_VIDEO_PROMPTS, provider);
      req.once(SOURCE_TEXT_ABORTED, run.cancel);
      res.once(SOURCE_TEXT_FINISH, run.complete);
      try {
        const response = await generatePlanningWithChatUi({ provider, model: resolveFlowVideoPlanningModel(provider, execution.model), prompt, projectId, workerId: SOURCE_TEXT_FLOW_VIDEO_PROMPTS, chromeHeadless: execution.chromeHeadless !== false, artifactType, requestId, signal: run.signal, closeRoomOnComplete: true });
        raw = response.text;
      } finally {
        run.complete();
        await closeChatPlanningRoom({ provider, projectId, workerId: SOURCE_TEXT_FLOW_VIDEO_PROMPTS });
        await closeChatBrowserIfIdle();
      }
    }
    const parsed = safeParseJSON(raw, { prompts: [] });
    if (execution.mode !== AiPlanningExecutionMode.ApiOnly && (parsed.requestId !== requestId || parsed.artifactType !== artifactType)) throw new Error(SOURCE_TEXT_PHONG_CHAT_TRA_KET_QUA_KHONG);
    const videos = _.map(_.get(parsed, SOURCE_TEXT_VIDEOS, []), (item) => ({ title: _.trim(_.toString(item?.title)), prompt: _.trim(_.toString(item?.prompt)) }));
    if (videos.length !== count || _.some(videos, (video) => !video.title || !video.prompt)) throw new Error(SOURCE_TEXT_AI_CHUA_TRA_DU_TEN_VA);
    return res.json({ success: true, videos });
  } catch (error) {
    return res.status(503).json({ success: false, error: getErrorMessage(error, SOURCE_TEXT_KHONG_THE_VIET_PROMPT_VIDEO) });
  }
});
router.post(SOURCE_TEXT_SAVE_FLOW_VIDEOS, requireLicense(FeatureType.VIDEO), async (req: Request, res: Response) => {
  try {
    const projectId = path.basename(_.toString(req.body?.projectId));
    const folderPath = path.resolve(_.trim(_.toString(req.body?.folderPath)));
    const requestedIds = _.uniq(_.map(_.castArray(req.body?.sceneIds || []), (id) => path.basename(_.toString(id))));
    if (!projectId || !requestedIds.length || requestedIds.length > 50 || !req.body?.folderPath) return res.status(400).json({ success: false, error: SOURCE_TEXT_THIEU_DU_AN_VIDEO_HOAC_THU });
    const folderStats = await fs.promises.stat(folderPath);
    if (!folderStats.isDirectory()) return res.status(400).json({ success: false, error: SOURCE_TEXT_VI_TRI_LUU_KHONG_PHAI_THU });
    const project = await getProjectDetailFromDb(projectId);
    if (!project) return res.status(404).json({ success: false, error: SOURCE_TEXT_KHONG_TIM_THAY_DU_AN });
    const savedPaths: string[] = [];
    for (const [index, sceneId] of requestedIds.entries()) {
      const scene = _.find(project.storyboard, { id: sceneId });
      const source = resolveLocalProjectAssetPath(_.toString(scene?.assetUrl));
      if (!source) return res.status(400).json({ success: false, error: SOURCE_TEMPLATE_VIDEO_CHUA_SAN_SANG_DE_LUU(SOURCE_TEMPLATE_SYMBOL_86(`${index + 1}`)) });
      const title = _.filter(
        _.trim(_.toString(scene?.assetName))
          .replace(/[<>:"/\\|?*]/g, C.EMPTY)
          .split(C.EMPTY),
        (character) => character.charCodeAt(0) >= 32,
      )
        .join(C.EMPTY)
        .replace(/[. ]+$/g, C.EMPTY)
        .slice(0, 90);
      const stem = title || SOURCE_TEMPLATE_FLOW_VIDEO(SOURCE_TEMPLATE_SYMBOL_86(`${sceneId.replace(/[^a-zA-Z0-9_-]/g, SOURCE_TEXT_SYMBOL_25)}`));
      let destination = path.join(folderPath, SOURCE_TEMPLATE_MP4(SOURCE_TEMPLATE_SYMBOL_86(`${stem}`)));
      for (
        let suffix = 2;
        await fs.promises
          .access(destination)
          .then(() => true)
          .catch(() => false);
        suffix++
      )
        destination = path.join(folderPath, SOURCE_TEMPLATE_MP4_2(SOURCE_TEMPLATE_SYMBOL_86(`${stem}`), SOURCE_TEMPLATE_SYMBOL_86(`${suffix}`)));
      await fs.promises.copyFile(source, destination);
      savedPaths.push(destination);
    }
    return res.json({ success: true, savedPaths });
  } catch (error) {
    return res.status(500).json({ success: false, error: getErrorMessage(error, SOURCE_TEXT_KHONG_THE_LUU_VIDEO) });
  }
});
router.post(SOURCE_TEXT_GENERATE_FLOW_VIDEO_BATCH, requireBatchVisualLicense, async (req: Request, res: Response) => {
  let activeVideoProjectKey: string = C.EMPTY;
  try {
    const requestedItems = _.map(_.castArray(req.body?.items || []), (item) => ({
      sceneId: path.basename(_.toString(item?.sceneId)),
      prompt: _.toString(item?.prompt),
      referenceImages: _.compact(_.castArray(item?.referenceImages || [])),
      referenceImageNames: _.compact(_.castArray(item?.referenceImageNames || [])),
      referenceCharacterNames: _.compact(_.castArray(item?.referenceCharacterNames || [])),
      requireReferenceReady: item?.requireReferenceReady === true,
    }));
    if (_.size(requestedItems) !== FLOW_DIRECT_VIDEO_CONFIG.PROMPTS_PER_BATCH || _.some(requestedItems, (item) => _.isEmpty(item.sceneId) || _.isEmpty(_.trim(item.prompt)))) {
      return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({ success: false, results: [], warning: BACKEND_MESSAGES.BATCH_GEN_NO_ITEMS });
    }
    const localProjectId = path.basename(_.toString(req.body?.sandboxConfig?.localProjectId));
    const localProject = await getProjectDetailFromDb(localProjectId);
    if (!localProject) return res.status(404).json({ success: false, results: [], warning: PROJECT_ASSET_INVALID_REQUEST });
    activeVideoProjectKey = localProjectId;
    if (activeVideoProjectKeys.has(activeVideoProjectKey)) {
      return res.json({ success: false, results: [], warning: FLOW_VIDEO_MEDIA_CONFIG.SUBMISSION_IN_PROGRESS_ERROR });
    }
    activeVideoProjectKeys.add(activeVideoProjectKey);
    const requestedSceneIds = new Set(_.map(requestedItems, SOURCE_TEXT_SCENEID));
    const requestedScenes = _.filter(localProject.storyboard || [], (scene) => requestedSceneIds.has(_.toString(scene.id)));
    if (!_.isEqual(requestedScenes.length, requestedItems.length)) {
      return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({ success: false, results: [], warning: PROJECT_ASSET_INVALID_REQUEST });
    }
    const knownVideoMediaIds = _.uniq(_.compact(_.flatMap(localProject.storyboard || [], (scene) => _.map(!_.isEmpty(scene.remoteVideoMediaIds) ? scene.remoteVideoMediaIds : [scene.remoteVideoMediaId], (mediaId) => _.trim(_.toString(mediaId))))));
    const persistedFlowProjectId = _.toString(localProject.visualConfig?.flowProjectId || req.body?.sandboxConfig?.flowProjectId);
    const results = await generateFlowVideoPromptBatchWithPlaywright({ items: requestedItems, visualConfig: { ...req.body?.visualConfig, generateType: GenerateType.Video }, sandboxConfig: { ...req.body?.sandboxConfig, localProjectId, flowProjectId: persistedFlowProjectId || undefined, knownVideoMediaIds }, retainBrowserSession: true });
    const resolvedFlowProjectId = _.toString(_.find(results, (result) => !_.isEmpty(result.newProjectId))?.newProjectId || persistedFlowProjectId);
    const assignedMediaIds = new Set<string>();
    for (const result of results) {
      const scene = _.find(localProject.storyboard, { id: result.sceneId });
      const mediaIds = _.uniq(_.compact(_.map(result.remoteMediaIds || [result.remoteMediaId], (mediaId) => _.trim(_.toString(mediaId)))));
      if (!scene || _.some(mediaIds, (mediaId) => assignedMediaIds.has(mediaId) || _.includes(knownVideoMediaIds, mediaId))) {
        result.success = false;
        result.warning = FLOW_VIDEO_MEDIA_CONFIG.DUPLICATE_MEDIA_ID_ERROR;
        continue;
      }
      _.forEach(mediaIds, (mediaId) => assignedMediaIds.add(mediaId));
      if (result.success && !_.isEmpty(mediaIds)) {
        if (!_.isEmpty(result.base64)) {
          const assetUrl = await persistProjectVideo(localProjectId, result.sceneId, result.base64!);
          scene.assetUrl = assetUrl;
          scene.assetUrls = [assetUrl];
          scene.assetType = GenerateType.Video;
          scene.assetStatus = SceneAssetStatus.Generated;
          scene.assetError = undefined;
          scene.remoteVideoDownloadPending = false;
        } else {
          scene.remoteVideoDownloadPending = true;
          scene.assetStatus = SceneAssetStatus.Generating;
          scene.assetError = FLOW_VIDEO_MEDIA_CONFIG.REMOTE_DOWNLOAD_PENDING_ERROR;
        }
        scene.remoteVideoMediaId = _.head(mediaIds);
        scene.remoteVideoMediaIds = mediaIds;
        scene.remoteVideoSourceUrl = result.remoteVideoSourceUrl;
        scene.remoteVideoExpectedCount = FLOW_DIRECT_VIDEO_CONFIG.VIDEO_OUTPUT_COUNT;
      } else {
        scene.assetStatus = SceneAssetStatus.Failed;
        scene.assetError = _.defaultTo(result.warning, FLOW_DIRECT_VIDEO_CONFIG.GENERATION_REJECTED_ERROR);
      }
    }
    localProject.visualConfig = { ...localProject.visualConfig, flowProjectId: resolvedFlowProjectId || localProject.visualConfig?.flowProjectId };
    await saveProjectDetailToDb(localProject);
    const successfulCount = _.size(_.filter(results, SOURCE_TEXT_SUCCESS));
    if (_.gt(successfulCount, SecurityConstants.ZERO)) await incrementFeatureUsage(req, FeatureType.VIDEO, successfulCount);
    return res.json({ success: _.gt(successfulCount, SecurityConstants.ZERO), results, newProjectId: resolvedFlowProjectId });
  } catch (error) {
    logger.error(LogEvent.GENERATE_IMAGE_ROUTE_ERROR, error);
    return res.json({ success: false, results: [], warning: getErrorMessage(error, FLOW_VIDEO_MEDIA_CONFIG.INVALID_MEDIA_ERROR) });
  } finally {
    if (!_.isEmpty(activeVideoProjectKey)) activeVideoProjectKeys.delete(activeVideoProjectKey);
  }
});
router.post(ROUTER_PATHS.ENSURE_FLOW_CHARACTERS, requireLicense(FeatureType.IMAGE), async (req: Request, res: Response) => {
  try {
    const localProjectId = path.basename(_.toString(req.body?.projectId));
    const localProject = await getProjectDetailFromDb(localProjectId);
    if (!localProject) return res.status(404).json({ success: false, error: PROJECT_ASSET_INVALID_REQUEST });
    const requestedCharacters = _.map(_.castArray(req.body?.characters || []), (character) => {
      const flowPrompt = _.trim(_.toString(character?.referenceGenerationPrompt));
      const identityPrompt = _.trim(_.toString(character?.prompt || character?.description));
      return { id: _.trim(_.toString(character?.id)), name: _.trim(_.toString(character?.name)), prompt: _.isEmpty(flowPrompt) || FLOW_CHARACTER_CONFIG.LEGACY_REFERENCE_PROMPT_PATTERN.test(flowPrompt) ? identityPrompt || flowPrompt : flowPrompt, info: _.trim(_.toString(character?.description || character?.prompt)) };
    });
    const result = await ensureFlowCharacters({ characters: requestedCharacters, projectId: localProjectId, flowProjectId: _.toString(localProject.visualConfig?.flowProjectId), chromeHeadless: _.isBoolean(req.body?.chromeHeadless) ? req.body.chromeHeadless : localProject.visualConfig?.chromeHeadless, language: req.body?.language, retainBrowserSession: true });
    if (!_.isEmpty(result.newProjectId)) {
      localProject.visualConfig = { ...localProject.visualConfig, flowProjectId: result.newProjectId };
      await saveProjectDetailToDb(localProject);
    }
    if (result.success) await incrementFeatureUsage(req, FeatureType.IMAGE, result.characters.length);
    return res.json(result);
  } catch (error) {
    logger.error(LogEvent.GENERATE_IMAGE_ROUTE_ERROR, error);
    return res.json({ success: false, characters: [], warning: getErrorMessage(error, PROJECT_ASSET_INVALID_REQUEST) });
  }
});
export default router;
