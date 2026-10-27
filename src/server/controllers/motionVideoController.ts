import { startMotionProduction, resumeMotionProduction, getMotionProduction, cancelMotionProduction, getMotionProductionLogs } from "../services/motionProductionService.js";
import { motionStoryLogs } from "../services/motionLogStore.js";
import { MOTION_ASSET_PREVIEW as ASSET_PREVIEW } from "../../constants/motionAssetPreview.js";
import { isRemotionSpec, motionVisualSettingsFor } from "../../lib/motionVisual.js";
import { MOTION_VISUAL } from "../../constants/motionVisual.js";
import { renderRemotionStill } from "../services/motionRemotionRenderService.js";
import { compileRemotionStory } from "../services/remotion/storyCompiler.js";
import type { MotionStoryScript, MotionProductionResult } from "../../types/motionVideo.js";
import { analyzeMotionStoryInput, scriptMotionStoryInput, seoMotionStoryInput, scenesMotionStoryInput, voiceMotionStoryInput, compileMotionStoryInput, startMotionVideoRenderInput, readStorySource, storyLanguage, aiExec, drawExec, validateSpec } from "../services/motionProductionActions.js";
const respondMotionAction = async (req: Request, res: Response, action: (body: Record<string, any>) => unknown): Promise<void> => {
  try {
    res.json(await action(req.body || {}));
  } catch (error) {
    fail(res, 400, error);
  }
};
import { puppetSheet } from "../services/puppet/qa.js";

import { listPuppetKit, puppetKitThumb, removePuppetKit, renamePuppetKit } from "../services/puppet/kitAdmin.js";
import { seedPuppetKit } from "../services/puppet/kitSeed.js";
import { PUPPET_KIT_API, PUPPET_STYLE_DEFAULT } from "../../constants/motionPuppet.js";
import { PUPPET_SEED_DEFAULT } from "../../constants/motionPuppetSeed.js";

import { deleteTrainedVoice, listTrainedVoices, trainVieneuVoice } from "../services/motionVoiceTrainService.js";
import { MOTION_VOICE_TRAIN } from "../../constants/motionVoiceTrain.js";

import { motionSoundAudition } from "../services/motionSoundMixService.js";
import { ensureMotionSfxLibrary, resolveMotionSfxAsset } from "../services/motionSfxLibraryService.js";

import * as MR from "../../constants/motionRuntime.js";

import { randomUUID } from "crypto";
import type { Request, Response } from "express";
import fs from "fs";

import { addAi33Voice, ai33VoiceSample, isAi33Voice, listMotionVoices as listMotionVoiceSources, removeAi33Voice, synthesizeMotionSpeech } from "../services/motionVoiceSourceService.js";

import _ from "lodash";

import { clearVoiceSpeedReference, measureVoiceSpeedReference, measureVoiceSpeedAudio, readVoiceSpeedSettings } from "../services/motionVoiceSpeedService.js";
import path from "path";
import {
  MOTION_TEMPLATE_MOTION,
  MOTION_TEXT_AAC,
  MOTION_TEXT_APPLICATION_JAVASCRIPT,
  MOTION_TEXT_BASE64,
  MOTION_TEXT_CACHE_CONTROL,
  MOTION_TEXT_CAN_PHAN_TICH_CAU_CHUYEN_TRUOC,
  MOTION_TEXT_DANG_RENDER_KHONG_THE_XOA_TAT_CA,
  MOTION_TEXT_DEMO,
  MOTION_TEXT_DINH_DANG_AM_THANH_KHONG_HO_TRO,
  MOTION_TEXT_FLAC,
  MOTION_TEXT_KHONG_TIM_THAY_TEP_VIDEO,
  MOTION_TEXT_KHONG_TIM_THAY_TIEN_TRINH,
  MOTION_TEXT_KHONG_TIM_THAY_TIEN_TRINH_RENDER,
  MOTION_TEXT_KHONG_TIM_THAY_VIDEO_MAU,
  MOTION_TEXT_M4A,
  MOTION_TEXT_MESSAGE,
  MOTION_TEXT_MOTION_VIDEO_CHECK_FAILED,
  MOTION_TEXT_MP3,
  MOTION_TEXT_NO_CACHE,
  MOTION_TEXT_OGG,
  MOTION_TEXT_PHIEN_LUU_DA_HET_HAN_HAY_CHON_LAI,
  MOTION_TEXT_PRIVATE_MAX_AGE_86400,
  MOTION_TEXT_SELECT_SAVE_FILE,
  MOTION_TEXT_TEP_AM_THANH_QUA_LON,
  MOTION_TEXT_TEP_AM_THANH_TRONG,
  MOTION_TEXT_VOICE_MP3,
  MOTION_TEXT_WAV,
} from "../../constants/motionRuntime.js";
import { MOTION_VIDEO_CONSTANTS } from "../../constants/motionVideo.js";
import { FeatureType } from "../../constants/security.js";
import { STORAGE_TEXTS } from "../../constants/storage.js";
import { SUNO_AUTOMATION_CONFIG } from "../../constants/sunoAutomation.js";

import { logger } from "../../lib/logger.js";
import { MotionStoryJobKind, type MotionSeoOption, type MotionStoryAnalysis } from "../../types/motionVideo.js";
import { getResolvedLicenseKey } from "../services/apiKeyResolver.js";
import { LicenseService } from "../services/licenseService.js";

import { MOTION_VOICE, MOTION_VOICE_LIBRARY, MOTION_VOICE_PATTERNS } from "../../constants/motionVoice.js";
import { applyVoiceLibrary, deleteVoiceChannel, readVoiceChannels, removeCustomVoice, saveVoiceChannel, updateVoiceMeta } from "../services/motionVoiceLibraryService.js";

import { registerVieneuVoice, vieneuRoot } from "../services/vieneuTtsService.js";
import { prepareMotionVoiceReference } from "../services/motionVoiceReferenceService.js";
import { createHash } from "crypto";

import { getMotionDemoSpec, getMotionEngineClientScript } from "../services/motionEngineService.js";
import { resolveGenPreview } from "../services/puppet/genState.js";

import { clearMotionResults, deleteMotionResult, getMotionAudioDirectory, getMotionRootDirectory, getMotionWorkDirectory, listMotionResults } from "../services/motionLibraryService.js";
import { cancelMotionJob, checkMotionSpec, execFileText, getMotionJob, isMotionRenderBusy, probeMediaDuration } from "../services/motionRenderService.js";
import { cancelStoryJob, getStoryJob, startStoryJob } from "../services/motionStoryJobService.js";
import { releaseMotionEditorialSession } from "../services/motionStoryService.js";

import { generateMotionThumbnail } from "../services/motionThumbnailService.js";

import { cleanStorageJunk, scanStorageJunk } from "../services/storageService.js";
import { getPythonCommand, getStaticResourcePath } from "../utils/paths.js";
const fail = (res: Response, status: number, error: unknown) => res.status(status).json({ success: false, error: _.toString(_.get(error, MOTION_TEXT_MESSAGE, error)) });
const saveDestinations = new Map<string, string>();

export const getMotionEngineScript = (_req: Request, res: Response): void => {
  try {
    res.type(MOTION_TEXT_APPLICATION_JAVASCRIPT).send(getMotionEngineClientScript());
  } catch (error) {
    fail(res, 500, error);
  }
};
export const getMotionDemo = (req: Request, res: Response): void => {
  const spec = getMotionDemoSpec(_.toString(req.query.name || MOTION_TEXT_DEMO));
  if (!spec) return void fail(res, 404, MOTION_TEXT_KHONG_TIM_THAY_VIDEO_MAU);
  res.json({ success: true, spec });
};
export const uploadMotionAudio = async (req: Request, res: Response): Promise<void> => {
  try {
    const name = path.basename(_.toString(req.body?.name || MOTION_TEXT_VOICE_MP3));
    const ext = _.toLower(path.extname(name)) || MOTION_TEXT_MP3;
    if (!_.includes([MOTION_TEXT_MP3, MOTION_TEXT_WAV, MOTION_TEXT_M4A, MOTION_TEXT_AAC, MOTION_TEXT_OGG, MOTION_TEXT_FLAC], ext)) throw new Error(MOTION_TEXT_DINH_DANG_AM_THANH_KHONG_HO_TRO);
    const buf = Buffer.from(_.toString(req.body?.base64).replace(MOTION_VOICE_PATTERNS.DATA_URL, MR.MOTION_TEXT_EMPTY), MOTION_TEXT_BASE64);
    if (buf.length < 1000) throw new Error(MOTION_TEXT_TEP_AM_THANH_TRONG);
    if (buf.length > MOTION_VIDEO_CONSTANTS.MAX_AUDIO_BYTES) throw new Error(MOTION_TEXT_TEP_AM_THANH_QUA_LON);
    const id = MR.MOTION_TEMPLATE_SYMBOL_81(randomUUID(), ext);
    const file = path.join(getMotionAudioDirectory(), id);
    await fs.promises.writeFile(file, buf);
    const durationSeconds = await probeMediaDuration(file);
    res.json({ success: true, audio: { id, name, durationSeconds, sizeBytes: buf.length } });
  } catch (error) {
    fail(res, 400, error);
  }
};
export const checkMotionVideo = async (req: Request, res: Response): Promise<void> => {
  try {
    res.json({ success: true, ...(await checkMotionSpec(validateSpec(req.body?.spec))) });
  } catch (error) {
    logger.error(MOTION_TEXT_MOTION_VIDEO_CHECK_FAILED, error);
    fail(res, 400, error);
  }
};
export const renderBoard2dSheet = async (req: Request, res: Response): Promise<void> => {
  try {
    const spec = validateSpec(req.body?.spec);
    if (isRemotionSpec(spec)) throw new Error(MOTION_VISUAL.SETTINGS_CHANGED);
    res.json({ success: true, items: _.map(await puppetSheet(spec), (it) => _.omit(it, [PUPPET_KIT_API.ABS])) });
  } catch (error) {
    fail(res, 400, error);
  }
};
export const startMotionVideoRender = (req: Request, res: Response): Promise<void> => respondMotionAction(req, res, startMotionVideoRenderInput);
export const getMotionVideoStatus = (req: Request, res: Response): void => {
  const job = getMotionJob(_.toString(req.params.jobId));
  if (!job) return void fail(res, 404, MOTION_TEXT_KHONG_TIM_THAY_TIEN_TRINH_RENDER);
  res.json({ success: true, job });
};
export const cancelMotionVideo = (req: Request, res: Response): void => {
  res.json({ success: true, cancelled: cancelMotionJob(req.body?.jobId ? _.toString(req.body.jobId) : undefined) });
};
export const listMotionVideoResults = (_req: Request, res: Response): void => {
  res.json({ success: true, items: listMotionResults() });
};
export const deleteMotionVideoResult = (req: Request, res: Response): void => {
  res.json(deleteMotionResult(_.toString(req.params.id)));
};
export const getStorageJunk = (_req: Request, res: Response): void => {
  try {
    res.json({ success: true, report: scanStorageJunk() });
  } catch (error) {
    fail(res, 500, error);
  }
};
export const cleanStorageJunkHandler = async (req: Request, res: Response): Promise<void> => {
  if (isMotionRenderBusy()) return void fail(res, 409, STORAGE_TEXTS.BUSY);
  try {
    res.json({ success: true, ...(await cleanStorageJunk(_.map(_.castArray(req.body?.groups || []), _.toString))) });
  } catch (error) {
    fail(res, 500, error);
  }
};
export const clearMotionVideoResults = (_req: Request, res: Response): void => {
  if (isMotionRenderBusy()) return void fail(res, 409, MOTION_TEXT_DANG_RENDER_KHONG_THE_XOA_TAT_CA);
  res.json({ success: true, ...clearMotionResults() });
};
export const selectMotionSaveDestination = async (req: Request, res: Response): Promise<void> => {
  try {
    const suggested = path.basename(_.toString(req.body?.suggestedName || MOTION_TEMPLATE_MOTION(String(MOTION_VIDEO_CONSTANTS.EXT_MP4))));
    const target = await execFileText(getPythonCommand(), [getStaticResourcePath(SUNO_AUTOMATION_CONFIG.CAPCUT_ULTRA_TOOL_SCRIPT), MOTION_TEXT_SELECT_SAVE_FILE, suggested, MOTION_VIDEO_CONSTANTS.EXT_MP4]);
    if (!target) return void res.json({ success: true, cancelled: true });
    const token = randomUUID();
    saveDestinations.set(token, target);
    setTimeout(() => saveDestinations.delete(token), MOTION_VIDEO_CONSTANTS.SAVE_TOKEN_TTL_MS).unref();
    res.json({ success: true, token, targetPath: target });
  } catch (error) {
    fail(res, 500, error);
  }
};
export const saveMotionVideo = async (req: Request, res: Response): Promise<void> => {
  try {
    const target = saveDestinations.get(_.toString(req.body?.token));
    if (!target) throw new Error(MOTION_TEXT_PHIEN_LUU_DA_HET_HAN_HAY_CHON_LAI);
    saveDestinations.delete(_.toString(req.body?.token));
    const source = path.join(getMotionRootDirectory(), path.basename(_.toString(req.body?.fileName)));
    if (!fs.existsSync(source)) throw new Error(MOTION_TEXT_KHONG_TIM_THAY_TEP_VIDEO);
    await fs.promises.mkdir(path.dirname(target), { recursive: true });
    await fs.promises.copyFile(source, target);
    res.json({ success: true, savedPath: target });
  } catch (error) {
    fail(res, 400, error);
  }
};

export const parseMotionStory = async (req: Request, res: Response): Promise<void> => {
  try {
    res.json({ success: true, source: await readStorySource(_.toString(req.body?.text)) });
  } catch (error) {
    fail(res, 400, error);
  }
};
export const analyzeMotionStory = (req: Request, res: Response): Promise<void> => respondMotionAction(req, res, analyzeMotionStoryInput);
export const scriptMotionStory = (req: Request, res: Response): Promise<void> => respondMotionAction(req, res, scriptMotionStoryInput);
export const seoMotionStory = (req: Request, res: Response): Promise<void> => respondMotionAction(req, res, seoMotionStoryInput);
export const thumbnailMotionStory = (req: Request, res: Response): void => {
  try {
    const analysis = req.body?.analysis as MotionStoryAnalysis;
    if (!analysis?.chapters?.length) throw new Error(MOTION_TEXT_CAN_PHAN_TICH_CAU_CHUYEN_TRUOC);
    const seo = _.isPlainObject(req.body?.seo) ? (req.body.seo as MotionSeoOption) : undefined;
    const exec = aiExec(req.body?.aiExecution);
    const licenseKey = getResolvedLicenseKey(req);
    const job = startStoryJob(req.body?.keepBrowser === true, MotionStoryJobKind.THUMBNAIL, async (ctx) => {
      if (motionVisualSettingsFor(req.body || {}).mode === "remotion") {
        const script = req.body?.script as MotionStoryScript;
        if (!script?.beats?.length) throw new Error(MOTION_VISUAL.SCENES_REQUIRED);
        const { spec } = compileRemotionStory(script, analysis, { aspect: req.body?.aspect, fps: 30, subtitles: false });
        spec.subtitles = [{ start: 0, end: spec.duration, text: seo?.title || analysis.title }];
        const directory = getMotionWorkDirectory(randomUUID());
        const file = path.join(directory, "thumbnail.png");
        try {
          const selected = spec.scenes.find((scene) => scene.nodes.some((node) => node.kind === "character")) || spec.scenes[0];
          await renderRemotionStill(spec, file, selected.startFrame, ctx.signal);
          return { thumbnail: `data:image/png;base64,${fs.readFileSync(file).toString("base64")}`, prompt: selected.purpose };
        } finally {
          await fs.promises.rm(directory, { recursive: true, force: true });
        }
      }
      const result = await generateMotionThumbnail(analysis, seo, { language: storyLanguage(req.body?.language), aspect: _.toString(req.body?.aspect || MR.MOTION_TEXT_16_9), note: _.truncate(_.toString(req.body?.note || MR.MOTION_TEXT_EMPTY), { length: 600 }), exec, chromeHeadless: exec.chromeHeadless, signal: ctx.signal, log: ctx.log });
      if (licenseKey) await LicenseService.incrementUsage(licenseKey, FeatureType.IMAGE, 1).catch(_.noop);
      return result;
    });
    res.json({ success: true, job });
  } catch (error) {
    fail(res, 400, error);
  }
};
export const scenesMotionStory = (req: Request, res: Response): Promise<void> => respondMotionAction(req, res, scenesMotionStoryInput);
export const serveGenPreview = (req: Request, res: Response): void => {
  const file = resolveGenPreview(_.toString(req.query.path));
  if (!file) return void res.status(404).end();
  res.setHeader(MOTION_TEXT_CACHE_CONTROL, MOTION_TEXT_NO_CACHE);
  res.sendFile(file);
};
export const voiceMotionStory = (req: Request, res: Response): Promise<void> => respondMotionAction(req, res, voiceMotionStoryInput);
export const listMotionVoices = async (_req: Request, res: Response): Promise<void> => {
  try {
    res.json({ success: true, voices: applyVoiceLibrary(await listMotionVoiceSources()) });
  } catch (error) {
    fail(res, 503, error);
  }
};
export const previewMotionVoice = async (req: Request, res: Response): Promise<void> => {
  try {
    const voice = String(req.body?.voice || MOTION_VOICE.DEFAULT).slice(0, 100),
      text = String(req.body?.text || MOTION_VOICE.PREVIEW_TEXT)
        .trim()
        .slice(0, 400);
    const folder = path.join(vieneuRoot(), MOTION_VOICE.PREVIEW_DIR);
    const previewFile = (key: string): string =>
      path.join(
        folder,
        createHash(MR.MOTION_TEXT_SHA256)
          .update(JSON.stringify([voice, key]))
          .digest(MR.MOTION_TEXT_HEX)
          .slice(0, 24) + MR.MOTION_TEXT_WAV,
      );
    fs.mkdirSync(folder, { recursive: true });
    const file = previewFile(text),
      sampleFile = previewFile(MOTION_VOICE_LIBRARY.SAMPLE_KEY);
    if (_.includes([MOTION_VOICE.PREVIEW_TEXT, MOTION_VOICE.PREVIEW_TEXT_EN], text) && isAi33Voice(voice) && (fs.existsSync(sampleFile) || (await ai33VoiceSample(voice, sampleFile).catch(() => false)))) return void res.json({ success: true, seconds: 0, sample: true, base64: (await fs.promises.readFile(sampleFile)).toString(MR.MOTION_TEXT_BASE64) });
    const result = fs.existsSync(file) ? { seconds: 0 } : await synthesizeMotionSpeech(text, voice, file);
    res.json({ success: true, seconds: result.seconds, base64: (await fs.promises.readFile(file)).toString(MR.MOTION_TEXT_BASE64) });
  } catch (error) {
    fail(res, 400, error);
  }
};
export const getMotionVoiceSpeed = (_req: Request, res: Response): void => {
  res.json({ success: true, settings: readVoiceSpeedSettings() });
};
export const measureMotionVoiceSpeed = async (req: Request, res: Response): Promise<void> => {
  try {
    const url = _.toString(req.body?.url).trim();
    res.json({ success: true, settings: url ? await measureVoiceSpeedReference(url) : clearVoiceSpeedReference() });
  } catch (error) {
    fail(res, 400, error);
  }
};
export const measureMotionVoiceSpeedAudio = async (req: Request, res: Response): Promise<void> => {
  try {
    res.json({ success: true, settings: await measureVoiceSpeedAudio(_.toString(req.body?.name), _.toString(req.body?.base64)) });
  } catch (error) {
    fail(res, 400, error);
  }
};
export const trainMotionVoice = (req: Request, res: Response): void => {
  try {
    const input = { name: _.toString(req.body?.name), gender: _.toString(req.body?.gender), description: _.toString(req.body?.description), consent: req.body?.consent === true, files: _.map(_.castArray(req.body?.files || []), (f: any) => ({ name: _.toString(f?.name), base64: _.toString(f?.base64) })) };
    if (!input.consent) throw new Error(MOTION_VOICE_TRAIN.ERR.CONSENT);
    const job = startStoryJob(false, MotionStoryJobKind.TRAIN_VOICE, (ctx) => trainVieneuVoice(input, ctx));
    res.json({ success: true, job });
  } catch (error) {
    fail(res, 400, error);
  }
};
export const listMotionTrainedVoices = (_req: Request, res: Response): void => {
  res.json({ success: true, voices: listTrainedVoices() });
};
export const deleteMotionTrainedVoice = async (req: Request, res: Response): Promise<void> => {
  try {
    res.json({ success: true, voices: await deleteTrainedVoice(_.toString(req.body?.id)) });
  } catch (error) {
    fail(res, 400, error);
  }
};
export const updateMotionVoiceMeta = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.body?.id || MR.MOTION_TEXT_EMPTY);
    if (!applyVoiceLibrary(await listMotionVoiceSources()).some((voice) => voice.id === id)) throw new Error(MOTION_VOICE_LIBRARY.VOICE_NOT_FOUND);
    res.json({ success: true, meta: updateVoiceMeta(id, { name: req.body?.name, gender: req.body?.gender, age: req.body?.age, speed: req.body?.speed }) });
  } catch (error) {
    fail(res, 400, error);
  }
};
export const removeMotionVoice = (req: Request, res: Response): void => {
  try {
    const id = String(req.body?.id || MR.MOTION_TEXT_EMPTY);
    removeCustomVoice(id);
    removeAi33Voice(id);
    res.json({ success: true });
  } catch (error) {
    fail(res, 400, error);
  }
};
export const addMotionAi33Voice = (req: Request, res: Response): void => {
  try {
    res.json({ success: true, voice: addAi33Voice(req.body?.voice) });
  } catch (error) {
    fail(res, 400, error);
  }
};
export const listMotionVoiceChannels = (_req: Request, res: Response): void => {
  try {
    res.json({ success: true, ...readVoiceChannels() });
  } catch (error) {
    fail(res, 500, error);
  }
};
export const saveMotionVoiceChannel = async (req: Request, res: Response): Promise<void> => {
  try {
    res.json({ success: true, ...saveVoiceChannel(req.body?.channel, applyVoiceLibrary(await listMotionVoiceSources()), req.body?.makeDefault === true) });
  } catch (error) {
    fail(res, 400, error);
  }
};
export const removeMotionVoiceChannel = (req: Request, res: Response): void => {
  try {
    res.json({ success: true, ...deleteVoiceChannel(String(req.body?.id || MR.MOTION_TEXT_EMPTY)) });
  } catch (error) {
    fail(res, 400, error);
  }
};
export const registerMotionVoice = async (req: Request, res: Response): Promise<void> => {
  const name = String(req.body?.name || MOTION_VOICE.NARRATOR).slice(0, 100),
    data = Buffer.from(String(req.body?.base64 || MR.MOTION_TEXT_EMPTY).replace(MOTION_VOICE_PATTERNS.OPTIONAL_DATA_URL, MR.MOTION_TEXT_EMPTY), MR.MOTION_TEXT_BASE64);
  let source: string = MR.MOTION_TEXT_EMPTY;
  try {
    if (!data.length || data.length > MOTION_VOICE.MAX_REFERENCE_BYTES) throw new Error(MOTION_VOICE.REFERENCE_INVALID);
    const root = path.join(vieneuRoot(), MR.MOTION_TEXT_REFERENCES);
    fs.mkdirSync(root, { recursive: true });
    const id = MR.MOTION_TEXT_CUSTOM + createHash(MR.MOTION_TEXT_SHA256).update(String(MOTION_VOICE_LIBRARY.SAMPLE_VERSION)).update(data).digest(MR.MOTION_TEXT_HEX).slice(0, 32),
      file = path.join(root, id + MR.MOTION_TEXT_WAV);
    source = path.join(root, randomUUID() + MR.MOTION_TEXT_INPUT);
    await fs.promises.writeFile(source, data);
    const seconds = await probeMediaDuration(source);
    if (seconds < 3) throw new Error(MOTION_VOICE.REFERENCE_INVALID);
    await prepareMotionVoiceReference(source, file);
    const voice = await registerVieneuVoice(id, name, ([MR.MOTION_TEXT_MALE, MR.MOTION_TEXT_FEMALE] as readonly string[]).includes(req.body?.gender) ? req.body.gender : MR.MOTION_TEXT_EMPTY, file);
    const meta = updateVoiceMeta(id, { name, gender: req.body?.gender, age: req.body?.age }, true);
    res.json({ success: true, voice: { ...voice, ...meta, hidden: undefined, custom: true } });
  } catch (error) {
    fail(res, 400, error);
  } finally {
    if (source) await fs.promises.rm(source, { force: true }).catch(() => {});
  }
};
export const compileMotionStory = (req: Request, res: Response): Promise<void> => respondMotionAction(req, res, compileMotionStoryInput);
export const createMotionProduction = (req: Request, res: Response): Promise<void> => respondMotionAction(req, res, (body) => ({ success: true, job: startMotionProduction(body) }));
export const continueMotionProduction = (req: Request, res: Response): Promise<void> => respondMotionAction(req, res, (body) => ({ success: true, job: resumeMotionProduction(String(body.productionId)) }));
export const getMotionStoryStatus = (req: Request, res: Response): void => {
  const job = getMotionProduction(_.toString(req.params.jobId)) || getStoryJob(_.toString(req.params.jobId));
  if (!job) return void fail(res, 404, MOTION_TEXT_KHONG_TIM_THAY_TIEN_TRINH);
  res.json({ success: true, job });
};
export const getMotionStoryLogs = (req: Request, res: Response): void => {
  try {
    const id = _.toString(req.params.jobId);
    const after = Number(req.query.after) || 0;
    let page = getMotionProductionLogs(id, after);
    if (!page) {
      const job = getStoryJob(id) || getMotionJob(id);
      if (!job) return void fail(res, 404, MOTION_TEXT_KHONG_TIM_THAY_TIEN_TRINH);
      const store = motionStoryLogs();
      store.seed(id, job.log);
      page = store.read(id, after);
    }
    res.json({ success: true, ...page });
  } catch (error) {
    fail(res, 400, error);
  }
};
export const cancelMotionStory = async (req: Request, res: Response): Promise<void> => {
  const sessionId = _.toString(req.body?.editorialSessionId);
  const jobId = _.toString(req.body?.jobId || sessionId);
  const production = jobId ? getMotionProduction(jobId) : undefined;
  const cancelled = production ? cancelMotionProduction(jobId) : jobId ? cancelStoryJob(req.body?.jobId ? _.toString(req.body.jobId) : undefined, sessionId || undefined) : false;
  if (sessionId) await releaseMotionEditorialSession(sessionId);
  res.json({ success: true, cancelled });
};
export const listMotionSfx = async (_req: Request, res: Response): Promise<void> => {
  try {
    const assets = await ensureMotionSfxLibrary();
    res.json({ success: true, assets: assets.map(({ id, name, duration, kinds }) => ({ id, name, duration, kinds })) });
  } catch {
    res.json({ success: true, assets: [] });
  }
};
export const serveMotionSfx = async (req: Request, res: Response): Promise<void> => {
  try {
    const auditionId = req.query?.start != null ? await motionSoundAudition(String(req.params.assetId), Number(req.query.start), Number(req.query.duration)) : undefined;
    const file = auditionId ? path.join(getMotionAudioDirectory(), auditionId) : await resolveMotionSfxAsset(String(req.params.assetId));
    if (!file) {
      res.status(404).end();
      return;
    }
    res.setHeader(MOTION_TEXT_CACHE_CONTROL, MOTION_TEXT_PRIVATE_MAX_AGE_86400);
    res.sendFile(file);
  } catch {
    res.status(404).end();
  }
};
export const seedPuppetKitItems = (req: Request, res: Response): void => {
  try {
    const styleId = _.toString(req.body?.styleId || PUPPET_STYLE_DEFAULT);
    const exec = drawExec(req.body?.aiExecution);
    const job = startStoryJob(false, MotionStoryJobKind.LIBRARY, async (ctx) => seedPuppetKit(styleId, _.toString(req.body?.genre || PUPPET_SEED_DEFAULT), { exec, signal: ctx.signal, log: ctx.log }, (v) => ctx.progress(v)));
    res.json({ success: true, job });
  } catch (error) {
    fail(res, 400, error);
  }
};
export const listPuppetKitItems = (req: Request, res: Response): void => {
  try {
    res.json({ success: true, items: listPuppetKit(req.query.type, req.query.styleId) });
  } catch (error) {
    fail(res, 400, error);
  }
};
export const removePuppetKitItems = (req: Request, res: Response): void => {
  try {
    res.json({ success: true, removed: removePuppetKit(req.body?.type, req.body?.ids ?? [req.body?.id]) });
  } catch (error) {
    fail(res, 400, error);
  }
};
export const renamePuppetKitItem = (req: Request, res: Response): void => {
  try {
    res.json({ success: renamePuppetKit(req.body?.type, req.body?.id, req.body?.name) });
  } catch (error) {
    fail(res, 400, error);
  }
};
export const servePuppetKitThumb = (req: Request, res: Response): void => {
  try {
    const p = req.params as Record<string, string>;
    const project = typeof req.query[ASSET_PREVIEW.QUERY] === "string" ? (req.query[ASSET_PREVIEW.QUERY] as string) : undefined;
    const job = project ? getMotionProduction(project) || getStoryJob(project) : undefined;
    if (project && !job) return void res.status(404).end();
    const result = job?.result as MotionProductionResult | MotionStoryScript | undefined;
    const gen = result && ("script" in result ? result.script?.gen : "gen" in result ? result.gen : undefined);
    const thumb = puppetKitThumb(p.type, p.id, gen?.puppet?.pack);
    if (!thumb) return void res.status(404).end();
    res.setHeader(PUPPET_KIT_API.CACHE, PUPPET_KIT_API.NO_CACHE);
    if (thumb.file) return void res.sendFile(thumb.file);
    res.setHeader(PUPPET_KIT_API.CSP, PUPPET_KIT_API.CSP_VALUE);
    res.type(PUPPET_KIT_API.SVG_TYPE).send(thumb.svg);
  } catch (error) {
    fail(res, 400, error);
  }
};
