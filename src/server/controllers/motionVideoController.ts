import * as MR from "../../constants/motionRuntime.js";
import { bindVideoDnaSettings, videoDnaErrors, videoDnaSourceKey } from "../../lib/motionVideoDna.js";
import { randomUUID } from "crypto";
import type { Request, Response } from "express";
import fs from "fs";
import _ from "lodash";
import path from "path";
import {
  MOTION_TEMPLATE_AI_CHIA_CHUONG_NHAN_VAT_BOI_CANH_DIEM,
  MOTION_TEMPLATE_BEAT,
  MOTION_TEMPLATE_GIONG_DOC_GIAY,
  MOTION_TEMPLATE_MOTION,
  MOTION_TEMPLATE_PHAN_TICH_CAU_CHUYEN_TU_PHUT,
  MOTION_TEMPLATE_SYMBOL_4,
  MOTION_TEMPLATE_TAO_GIONG_AI33_CHO_BEAT_SONG_SONG,
  MOTION_TEMPLATE_VIET_LOI_DAN_PHAN_CANH_CHUONG,
  MOTION_TEXT_16_9,
  MOTION_TEXT_1_1,
  MOTION_TEXT_4_5,
  MOTION_TEXT_9_16,
  MOTION_TEXT_AAC,
  MOTION_TEXT_ANALYZE,
  MOTION_TEXT_APPLICATION_JAVASCRIPT,
  MOTION_TEXT_BASE64,
  MOTION_TEXT_CACHE_CONTROL,
  MOTION_TEXT_CANCELLED,
  MOTION_TEXT_CAN_PHAN_TICH_CAU_CHUYEN_TRUOC,
  MOTION_TEXT_CAN_VIET_LOI_DAN_PHAN_CANH_TRUOC,
  MOTION_TEXT_CHAPTERID,
  MOTION_TEXT_CHUA_CO_KICH_BAN,
  MOTION_TEXT_CHUA_CO_LOI_DAN_DE_TAO_GIONG,
  MOTION_TEXT_CHUA_CO_NOI_DUNG_CAU_CHUYEN,
  MOTION_TEXT_DANG_RENDER_KHONG_THE_XOA_TAT_CA,
  MOTION_TEXT_DARK,
  MOTION_TEXT_DEMO,
  MOTION_TEXT_DINH_DANG_AM_THANH_KHONG_HO_TRO,
  MOTION_TEXT_EN,
  MOTION_TEXT_FLAC,
  MOTION_TEXT_HAY_CHON_GIONG_DOC_AI33,
  MOTION_TEXT_KHONG_TIM_THAY_TEP_VIDEO,
  MOTION_TEXT_KHONG_TIM_THAY_TIEN_TRINH,
  MOTION_TEXT_KHONG_TIM_THAY_TIEN_TRINH_RENDER,
  MOTION_TEXT_KHONG_TIM_THAY_VIDEO_MAU,
  MOTION_TEXT_KICH_BAN_DUNG_SPEC_CHUA_CO_CANH_NAO,
  MOTION_TEXT_M4A,
  MOTION_TEXT_MESSAGE,
  MOTION_TEXT_MOTION_VIDEO_CHECK_FAILED,
  MOTION_TEXT_MP3,
  MOTION_TEXT_NO_CACHE,
  MOTION_TEXT_OGG,
  MOTION_TEXT_PHIEN_LUU_DA_HET_HAN_HAY_CHON_LAI,
  MOTION_TEXT_PRIVATE_MAX_AGE_86400,
  MOTION_TEXT_QUA_NHIEU_CANH_TRONG_MOT_VIDEO,
  MOTION_TEXT_SELECT_SAVE_FILE,
  MOTION_TEXT_TEP_AM_THANH_QUA_LON,
  MOTION_TEXT_TEP_AM_THANH_TRONG,
  MOTION_TEXT_VI,
  MOTION_TEXT_VOICE_MP3,
  MOTION_TEXT_WAV,
} from "../../constants/motionRuntime.js";
import { MOTION_VIDEO_CONSTANTS } from "../../constants/motionVideo.js";
import { FeatureType } from "../../constants/security.js";
import { STORAGE_TEXTS } from "../../constants/storage.js";
import { SUNO_AUTOMATION_CONFIG } from "../../constants/sunoAutomation.js";
import { parseJson } from "../../lib/jsonStringify.js";
import { logger } from "../../lib/logger.js";
import { MotionEncoderPreference, MotionQuality, MotionStoryJobKind, MotionStoryLength, type MotionAiExecution, type MotionBeat, type MotionChapter, type MotionSeoOption, type MotionSpec, type MotionStoryAnalysis, type MotionStoryScript, type MotionStorySource } from "../../types/motionVideo.js";
import { getResolvedLicenseKey } from "../services/apiKeyResolver.js";
import { LicenseService } from "../services/licenseService.js";
import { libraryMime } from "../services/motionAssetLibraryService.js";
import { buildAi33VoiceTrack, fitUploadedVoice } from "../services/motionAudioService.js";
import { compileStorySpec, estimateBeatSeconds } from "../services/motionDirectorService.js";
import { getMotionDemoSpec, getMotionEngineClientScript, resolveMotionAsset } from "../services/motionEngineService.js";
import { buildScenes, resolveGenPreview } from "../services/motionGenService.js";
import { clearMotionResults, deleteMotionResult, getMotionAudioDirectory, getMotionRootDirectory, listMotionResults } from "../services/motionLibraryService.js";
import { cancelMotionJob, checkMotionSpec, execFileText, getMotionJob, isMotionRenderBusy, probeMediaDuration, startMotionRender } from "../services/motionRenderService.js";
import { cancelStoryJob, getStoryJob, startStoryJob } from "../services/motionStoryJobService.js";
import { analyzeStory, editScript, mapMotionAiPool, parseStorySource, writeChapterBeats } from "../services/motionStoryService.js";
import { generateMotionSeo } from "../services/motionSeoService.js";
import { generateMotionThumbnail } from "../services/motionThumbnailService.js";
import { resolveSourceInput, withFetchInfo } from "../services/motionSourceFetchService.js";
import { cleanTranscriptInput } from "../../lib/motionSourceClean.js";
const readStorySource = async (text: string): Promise<MotionStorySource> => { const r = await resolveSourceInput(text); const { text: cleaned, report } = cleanTranscriptInput(r.text); const source = withFetchInfo(parseStorySource(cleaned), r.notes, r.fetched); return report.splitNumbers || report.soundCues || report.missingQuotes ? { ...source, cleaned: report } : source; };
import { cleanStorageJunk, scanStorageJunk } from "../services/storageService.js";
import { getPythonCommand, getStaticResourcePath } from "../utils/paths.js";
const fail = (res: Response, status: number, error: unknown) => res.status(status).json({ success: false, error: _.toString(_.get(error, MOTION_TEXT_MESSAGE, error)) });
const saveDestinations = new Map<string, string>();
const validateSpec = (raw: unknown): MotionSpec => { const spec = (_.isString(raw) ? parseJson(raw) : raw) as MotionSpec; if (!spec || !_.isArray(spec.shots) || _.isEmpty(spec.shots)) throw new Error(MOTION_TEXT_KICH_BAN_DUNG_SPEC_CHUA_CO_CANH_NAO); if (spec.shots.length > 2000) throw new Error(MOTION_TEXT_QUA_NHIEU_CANH_TRONG_MOT_VIDEO); return spec; };
export const getMotionEngineScript = (_req: Request, res: Response): void => { try { res.type(MOTION_TEXT_APPLICATION_JAVASCRIPT).send(getMotionEngineClientScript()); } catch (error) { fail(res, 500, error); } };
export const getMotionDemo = (req: Request, res: Response): void => { const spec = getMotionDemoSpec(_.toString(req.query.name || MOTION_TEXT_DEMO)); if (!spec) return void fail(res, 404, MOTION_TEXT_KHONG_TIM_THAY_VIDEO_MAU); res.json({ success: true, spec }); };
export const uploadMotionAudio = async (req: Request, res: Response): Promise<void> => {
  try {
    const name = path.basename(_.toString(req.body?.name || MOTION_TEXT_VOICE_MP3));
    const ext = _.toLower(path.extname(name)) || MOTION_TEXT_MP3;
    if (!_.includes([MOTION_TEXT_MP3, MOTION_TEXT_WAV, MOTION_TEXT_M4A, MOTION_TEXT_AAC, MOTION_TEXT_OGG, MOTION_TEXT_FLAC], ext)) throw new Error(MOTION_TEXT_DINH_DANG_AM_THANH_KHONG_HO_TRO);
    const buf = Buffer.from(_.toString(req.body?.base64).replace(/^data:[^,]+,/, ""), MOTION_TEXT_BASE64);
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
export const checkMotionVideo = async (req: Request, res: Response): Promise<void> => { try { res.json({ success: true, ...(await checkMotionSpec(validateSpec(req.body?.spec))) }); } catch (error) { logger.error(MOTION_TEXT_MOTION_VIDEO_CHECK_FAILED, error); fail(res, 400, error); } };
export const startMotionVideoRender = (req: Request, res: Response): void => {
  try {
    const spec = validateSpec(req.body?.spec);
    const o = req.body?.options || {};
    const job = startMotionRender(spec, {
      quality: _.includes(_.values(MotionQuality), o.quality) ? o.quality : MotionQuality.STANDARD,
      aspect: _.toString(o.aspect || spec.aspect || MOTION_TEXT_16_9),
      fps: _.toNumber(o.fps) || undefined,
      encoder: _.includes(_.values(MotionEncoderPreference), o.encoder) ? o.encoder : MotionEncoderPreference.AUTO,
      title: _.truncate(_.toString(o.title || spec.title || ""), { length: 120 }),
      audioId: o.audioId ? path.basename(_.toString(o.audioId)) : undefined,
      audioVolume: _.toNumber(o.audioVolume ?? 1),
      sfxVolume: _.toNumber(o.sfxVolume ?? 0.5),
      sfx:
        o.sfx && _.isArray(o.sfx.cues)
          ? {
              cues: _.take(
                _.map(o.sfx.cues, (c: any) => ({ t: _.toNumber(c?.t), kind: _.toString(c?.kind) })),
                500,
              ),
              mood: _.toString(o.sfx.mood || MOTION_TEXT_DARK),
            }
          : undefined,
    });
    res.json({ success: true, job });
  } catch (error) {
    fail(res, 400, error);
  }
};
export const getMotionVideoStatus = (req: Request, res: Response): void => { const job = getMotionJob(_.toString(req.params.jobId)); if (!job) return void fail(res, 404, MOTION_TEXT_KHONG_TIM_THAY_TIEN_TRINH_RENDER); res.json({ success: true, job }); };
export const cancelMotionVideo = (req: Request, res: Response): void => { res.json({ success: true, cancelled: cancelMotionJob(req.body?.jobId ? _.toString(req.body.jobId) : undefined) }); };
export const listMotionVideoResults = (_req: Request, res: Response): void => { res.json({ success: true, items: listMotionResults() }); };
export const deleteMotionVideoResult = (req: Request, res: Response): void => { res.json(deleteMotionResult(_.toString(req.params.id))); };
export const getStorageJunk = (_req: Request, res: Response): void => { try { res.json({ success: true, report: scanStorageJunk() }); } catch (error) { fail(res, 500, error); } };
export const cleanStorageJunkHandler = async (req: Request, res: Response): Promise<void> => { if (isMotionRenderBusy()) return void fail(res, 409, STORAGE_TEXTS.BUSY); try { res.json({ success: true, ...(await cleanStorageJunk(_.map(_.castArray(req.body?.groups || []), _.toString))) }); } catch (error) { fail(res, 500, error); } };
export const clearMotionVideoResults = (_req: Request, res: Response): void => { if (isMotionRenderBusy()) return void fail(res, 409, MOTION_TEXT_DANG_RENDER_KHONG_THE_XOA_TAT_CA); res.json({ success: true, ...clearMotionResults() }); };
export const selectMotionSaveDestination = async (req: Request, res: Response): Promise<void> => {
  try {
    const suggested = path.basename(_.toString(req.body?.suggestedName || MOTION_TEMPLATE_MOTION(MR.MOTION_TEMPLATE_SYMBOL_82(MOTION_VIDEO_CONSTANTS.EXT_MP4))));
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
const storyLanguage = (v: unknown): string => (v === MOTION_TEXT_EN ? MOTION_TEXT_EN : MOTION_TEXT_VI);
const storyLength = (v: unknown): MotionStoryLength => (_.includes(_.values(MotionStoryLength), v) ? (v as MotionStoryLength) : MotionStoryLength.FULL);
const aiExec = (v: any): MotionAiExecution => ({ provider: _.toString(v?.provider || ""), model: _.toString(v?.model || ""), mode: _.toString(v?.mode || ""), chromeHeadless: v?.chromeHeadless !== false });
export const parseMotionStory = async (req: Request, res: Response): Promise<void> => { try { res.json({ success: true, source: await readStorySource(_.toString(req.body?.text)) }); } catch (error) { fail(res, 400, error); } };
export const analyzeMotionStory = async (req: Request, res: Response): Promise<void> => {
  try {
    const source = (req.body?.source as MotionStorySource) || (await readStorySource(_.toString(req.body?.text)));
    if (!source?.segments?.length) throw new Error(MOTION_TEXT_CHUA_CO_NOI_DUNG_CAU_CHUYEN);
    const language = storyLanguage(req.body?.language);
    const length = storyLength(req.body?.length);
    const exec = aiExec(req.body?.aiExecution);
    const job = startStoryJob(MotionStoryJobKind.ANALYZE, async (ctx) => {
      ctx.progress(0.1, MOTION_TEXT_ANALYZE);
      ctx.log(MOTION_TEMPLATE_PHAN_TICH_CAU_CHUYEN_TU_PHUT(MR.MOTION_TEMPLATE_SYMBOL_83(source.words), MR.MOTION_TEMPLATE_SYMBOL_84(Math.round(source.sourceSeconds / 60))));
      const analysis = await analyzeStory(source, { language, length, drawingMode: req.body?.drawingMode === MR.MOTION_TEXT_2D ? MR.MOTION_TEXT_2D : MR.MOTION_TEXT_3D, customCharacters: req.body?.customCharacters === true, aspect: _.toString(req.body?.aspect || MR.MOTION_TEXT_16_9), exec, signal: ctx.signal, log: ctx.log });
      ctx.log(MOTION_TEMPLATE_AI_CHIA_CHUONG_NHAN_VAT_BOI_CANH_DIEM(MR.MOTION_TEMPLATE_SYMBOL_85(analysis.chapters.length), MR.MOTION_TEMPLATE_SYMBOL_86(analysis.cast.length), MR.MOTION_TEMPLATE_SYMBOL_87(analysis.places.length), MR.MOTION_TEMPLATE_SYMBOL_88(analysis.facts.length)));
      return analysis;
    });
    res.json({ success: true, job });
  } catch (error) {
    fail(res, 400, error);
  }
};
export const scriptMotionStory = (req: Request, res: Response): void => {
  try {
    const source = req.body?.source as MotionStorySource;
    let analysis = req.body?.analysis as MotionStoryAnalysis;
    if (!source?.segments?.length || !analysis?.chapters?.length) throw new Error(MOTION_TEXT_CAN_PHAN_TICH_CAU_CHUYEN_TRUOC);
    const language = storyLanguage(req.body?.language);
    if (analysis.videoDna) {
      const errors = videoDnaErrors(analysis.videoDna);
      if (errors.length) throw new Error(MR.MOTION_TEMPLATE_INVALID_VIDEO_DNA(errors.slice(0, 5).join(MR.MOTION_TEXT_SYMBOL_41)));
      if (analysis.videoDna.sourceKey !== videoDnaSourceKey(source)) throw new Error(MR.MOTION_TEXT_INPUT_CHANGED_ANALYZE_VIDEO_DNA_AGAIN_BEFORE_WRITING_SCENES);
      if (req.body?.length && analysis.videoDna.settings.length !== storyLength(req.body.length)) throw new Error(MR.MOTION_TEXT_VIDEO_LENGTH_CHANGED_ANALYZE_VIDEO_DNA_AGAIN);
      analysis = bindVideoDnaSettings(analysis, {
        language: language === MR.MOTION_TEXT_EN ? MR.MOTION_TEXT_EN : MR.MOTION_TEXT_VI,
        aspect: _.toString(req.body?.aspect || analysis.videoDna.settings.aspect),
        drawingMode: req.body?.drawingMode === MR.MOTION_TEXT_2D ? MR.MOTION_TEXT_2D : MR.MOTION_TEXT_3D,
        characterMode: req.body?.customCharacters === true ? MR.MOTION_TEXT_DRAWN : MR.MOTION_TEXT_MANNEQUIN,
      });
    }
    const exec = aiExec(req.body?.aiExecution);
    const only: string[] = _.map(_.castArray(req.body?.chapterIds || []), _.toString);
    const existing: MotionBeat[] = _.castArray(req.body?.beats || []);
    const job = startStoryJob(MotionStoryJobKind.SCRIPT, async (ctx) => {
      const chapters = analysis.chapters;
      const byChapter: Record<string, MotionBeat[]> = _.groupBy(existing, MOTION_TEXT_CHAPTERID);
      const todo = _.filter(chapters, (c) => _.isEmpty(only) || _.includes(only, c.id));
      let done = 0;
      const failed: MotionChapter[] = [];
      const writeOne = async (chapter: MotionChapter) => {
        if (ctx.signal.aborted) throw new Error(MOTION_TEXT_CANCELLED);
        const idx = _.findIndex(chapters, { id: chapter.id });
        ctx.progress(done / todo.length, chapter.id);
        ctx.log(MOTION_TEMPLATE_VIET_LOI_DAN_PHAN_CANH_CHUONG(MR.MOTION_TEMPLATE_SYMBOL_89(idx + 1), MR.MOTION_TEMPLATE_SYMBOL_90(chapters.length), MR.MOTION_TEMPLATE_SYMBOL_91(chapter.title)));
        const prevChapter = idx > 0 ? chapters[idx - 1] : undefined;
        const previous = prevChapter ? byChapter[prevChapter.id] : undefined;
        try {
          byChapter[chapter.id] = await writeChapterBeats(source, analysis, chapter, { language, exec, signal: ctx.signal, log: ctx.log, previous, previousSummary: prevChapter?.summary, isFirst: idx === 0, isLast: idx === chapters.length - 1 });
        } catch (error) {
          if (ctx.signal.aborted) throw error;
          failed.push(chapter);
          ctx.log(MR.MOTION_TEMPLATE_CHUONG_LOI_SE_THU_LAI(idx + 1, _.truncate(_.toString((error as Error)?.message || error), { length: 120 })));
          return;
        }
        done++;
        ctx.progress(done / todo.length, chapter.id);
        ctx.log(MOTION_TEMPLATE_BEAT(MR.MOTION_TEMPLATE_SYMBOL_92(byChapter[chapter.id].length)));
        ctx.partial({ title: analysis.title, language, beats: _.flatMap(chapters, (c) => byChapter[c.id] || []) });
      };
      await mapMotionAiPool(todo, writeOne);
      const retry = failed.splice(0);
      for (const chapter of retry) await writeOne(chapter);
      if (failed.length) ctx.log(MR.MOTION_TEMPLATE_CON_CHUONG_CHUA_VIET_DUOC_CAC_CHUONG_KHAC_VAN_DUOC_GIU_BAM_VIET_T(failed.length, _.map(failed, MR.MOTION_TEXT_TITLE).join(MR.MOTION_TEXT_SYMBOL_14)));
      const keepGen = _.isEmpty(only) ? undefined : (req.body?.gen as MotionStoryScript["gen"]);
      let beats = _.flatMap(chapters, (c) => byChapter[c.id] || []);
      let edit: MotionStoryScript["edit"];
      const complete = _.every(chapters, (c) => byChapter[c.id]?.length);
      if ((_.isEmpty(only) || req.body?.resume === true) && complete && req.body?.editorPass !== false) {
        ctx.log(MR.MOTION_TEXT_BIEN_TAP_VIEN_DOC_LAI_TOAN_BO_LOI_DAN);
        try {
          const r = await editScript(source, analysis, beats, { language, exec, signal: ctx.signal, log: ctx.log });
          beats = r.beats;
          edit = r.edit;
        } catch (error) {
          if (ctx.signal.aborted) throw error;
          ctx.log(MR.MOTION_TEMPLATE_BO_QUA_BUOC_BIEN_TAP(_.truncate(_.toString((error as Error)?.message || error), { length: 120 })));
        }
      }
      const script: MotionStoryScript = { title: analysis.title, language, beats, gen: keepGen, ...(edit ? { edit } : {}) };
      return script;
    });
    res.json({ success: true, job });
  } catch (error) {
    fail(res, 400, error);
  }
};
export const seoMotionStory = (req: Request, res: Response): void => {
  try {
    const analysis = req.body?.analysis as MotionStoryAnalysis;
    const script = req.body?.script as MotionStoryScript;
    if (!analysis?.chapters?.length || !script?.beats?.length) throw new Error(MOTION_TEXT_CAN_VIET_LOI_DAN_PHAN_CANH_TRUOC);
    const language = storyLanguage(req.body?.language);
    const exec = aiExec(req.body?.aiExecution);
    const durations = _.isArray(req.body?.durations) && req.body.durations.length === script.beats.length ? _.map(req.body.durations, _.toNumber) : undefined;
    const job = startStoryJob(MotionStoryJobKind.SEO, (ctx) => generateMotionSeo(analysis, script, { language, exec, durations, signal: ctx.signal, log: ctx.log }));
    res.json({ success: true, job });
  } catch (error) {
    fail(res, 400, error);
  }
};
export const thumbnailMotionStory = (req: Request, res: Response): void => {
  try {
    const analysis = req.body?.analysis as MotionStoryAnalysis;
    if (!analysis?.chapters?.length) throw new Error(MOTION_TEXT_CAN_PHAN_TICH_CAU_CHUYEN_TRUOC);
    const seo = _.isPlainObject(req.body?.seo) ? (req.body.seo as MotionSeoOption) : undefined;
    const exec = aiExec(req.body?.aiExecution);
    const licenseKey = getResolvedLicenseKey(req);
    const job = startStoryJob(MotionStoryJobKind.THUMBNAIL, async (ctx) => {
      const result = await generateMotionThumbnail(analysis, seo, { language: storyLanguage(req.body?.language), aspect: _.toString(req.body?.aspect || MR.MOTION_TEXT_16_9), note: _.truncate(_.toString(req.body?.note || ""), { length: 600 }), exec, chromeHeadless: exec.chromeHeadless, signal: ctx.signal, log: ctx.log });
      if (licenseKey) await LicenseService.incrementUsage(licenseKey, FeatureType.IMAGE, 1).catch(_.noop);
      return result;
    });
    res.json({ success: true, job });
  } catch (error) {
    fail(res, 400, error);
  }
};
export const scenesMotionStory = (req: Request, res: Response): void => {
  try {
    const analysis = req.body?.analysis as MotionStoryAnalysis;
    const script = req.body?.script as MotionStoryScript;
    if (!analysis?.places || !script?.beats?.length) throw new Error(MOTION_TEXT_CAN_VIET_LOI_DAN_PHAN_CANH_TRUOC);
    const exec = aiExec(req.body?.aiExecution);
    const onlyBeats: string[] = _.map(_.castArray(req.body?.beats || []), _.toString);
    const onlyLocations: string[] = _.map(_.castArray(req.body?.locations || []), _.toString);
    const note = _.truncate(_.toString(req.body?.note || ""), { length: 400 });
    if (req.body?.restart) delete script.gen;
    const job = startStoryJob(MotionStoryJobKind.SCENES, async (ctx) =>
      buildScenes(script, analysis, {
        exec,
        signal: ctx.signal,
        log: ctx.log,
        progress: ctx.progress,
        partial: (r) => r && ctx.partial(r),
        aspect: _.toString(req.body?.aspect || MOTION_TEXT_16_9),
        onlyBeats,
        onlyLocations,
        restyle: !!req.body?.restyle,
        note: note || undefined,
        review: req.body?.review !== false,
        customCharacters: req.body?.customCharacters === true,
        drawingMode: req.body?.drawingMode === MR.MOTION_TEXT_2D ? MR.MOTION_TEXT_2D : MR.MOTION_TEXT_3D,
      }),
    );
    res.json({ success: true, job });
  } catch (error) {
    fail(res, 400, error);
  }
};
export const serveGenPreview = (req: Request, res: Response): void => { const file = resolveGenPreview(_.toString(req.query.path)); if (!file) return void res.status(404).end(); res.setHeader(MOTION_TEXT_CACHE_CONTROL, MOTION_TEXT_NO_CACHE); res.sendFile(file); };
export const serveMotionAsset = (req: Request, res: Response): void => { const rel = _.toString((req.params as Record<string, string>)[0] || ""); const file = resolveMotionAsset(rel); if (!file) return void res.status(404).end(); res.setHeader(MOTION_TEXT_CACHE_CONTROL, MOTION_TEXT_PRIVATE_MAX_AGE_86400); res.type(libraryMime(file)); res.sendFile(file); };
export const voiceMotionStory = (req: Request, res: Response): void => {
  try {
    const beats: MotionBeat[] = _.filter(_.castArray(req.body?.beats || []), (b) => !_.isEmpty(_.trim(b?.narration)));
    if (_.isEmpty(beats)) throw new Error(MOTION_TEXT_CHUA_CO_LOI_DAN_DE_TAO_GIONG);
    const voiceId = _.toString(req.body?.voiceId);
    if (!voiceId) throw new Error(MOTION_TEXT_HAY_CHON_GIONG_DOC_AI33);
    const speed = _.toNumber(req.body?.speed) || 1;
    const licenseKey = getResolvedLicenseKey(req);
    const job = startStoryJob(MotionStoryJobKind.VOICE, async (ctx) => {
      ctx.log(MOTION_TEMPLATE_TAO_GIONG_AI33_CHO_BEAT_SONG_SONG(MR.MOTION_TEMPLATE_SYMBOL_93(beats.length)));
      const track = await buildAi33VoiceTrack(beats, { voiceId, speed, signal: ctx.signal, log: ctx.log, onProgress: (d, t) => ctx.progress(d / t, MOTION_TEMPLATE_SYMBOL_4(MR.MOTION_TEMPLATE_SYMBOL_94(d), MR.MOTION_TEMPLATE_SYMBOL_95(t))) });
      if (licenseKey) await LicenseService.incrementUsage(licenseKey, FeatureType.VOICE, track.characters).catch(_.noop);
      ctx.log(MOTION_TEMPLATE_GIONG_DOC_GIAY(MR.MOTION_TEMPLATE_SYMBOL_96(Math.round(track.totalSeconds))));
      return track;
    });
    res.json({ success: true, job });
  } catch (error) {
    fail(res, 400, error);
  }
};
export const compileMotionStory = (req: Request, res: Response): void => {
  try {
    const script = req.body?.script as MotionStoryScript;
    if (!script?.beats?.length) throw new Error(MOTION_TEXT_CHUA_CO_KICH_BAN);
    const analysis = (req.body?.analysis as MotionStoryAnalysis) || null;
    const aspect = _.includes([MOTION_TEXT_16_9, MOTION_TEXT_9_16, MOTION_TEXT_1_1, MOTION_TEXT_4_5], req.body?.aspect) ? req.body.aspect : MOTION_TEXT_16_9;
    let durations: number[] | undefined = _.isArray(req.body?.durations) ? _.map(req.body.durations, _.toNumber) : undefined;
    const uploadedSeconds = _.toNumber(req.body?.uploadedAudioSeconds);
    if (!durations && uploadedSeconds > 0) durations = fitUploadedVoice( script.beats, _.map(script.beats, (b) => estimateBeatSeconds(b, script.language)), uploadedSeconds, );
    const compiled = compileStorySpec(script, analysis, { aspect, durations, look: req.body?.look, accent: req.body?.accent });
    res.json({ success: true, spec: compiled.spec, sfxCues: compiled.sfxCues, starts: compiled.starts, missing: compiled.missing });
  } catch (error) {
    fail(res, 400, error);
  }
};
export const getMotionStoryStatus = (req: Request, res: Response): void => { const job = getStoryJob(_.toString(req.params.jobId)); if (!job) return void fail(res, 404, MOTION_TEXT_KHONG_TIM_THAY_TIEN_TRINH); res.json({ success: true, job }); };
export const cancelMotionStory = (req: Request, res: Response): void => { res.json({ success: true, cancelled: cancelStoryJob(req.body?.jobId ? _.toString(req.body.jobId) : undefined) }); };
