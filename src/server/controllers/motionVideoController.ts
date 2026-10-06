import { parseJson } from "../../lib/jsonStringify.js";
import { randomUUID } from "crypto";
import type { Request, Response } from "express";
import fs from "fs";
import _ from "lodash";
import path from "path";
import {
  MOTION_TEMPLATE_AI_CHIA_CHUONG_NHAN_VAT_DIEM_CAN_KIEM,
  MOTION_TEMPLATE_BEAT,
  MOTION_TEMPLATE_BO_QUA_BUOC_KIEM_TRA_HINH,
  MOTION_TEMPLATE_DA_SUA_BEAT_CHO_KHOP_LOI_DAN,
  MOTION_TEMPLATE_DA_THEM_NHAN_VAT_MOI_VAO_KHO_NHAN,
  MOTION_TEMPLATE_GIONG_DOC_GIAY,
  MOTION_TEMPLATE_KIEM_TRA_LAI_BEAT_VUA_SUA,
  MOTION_TEMPLATE_MOTION,
  MOTION_TEMPLATE_PHAN_TICH_CAU_CHUYEN_TU_PHUT,
  MOTION_TEMPLATE_SYMBOL_4,
  MOTION_TEMPLATE_TAO_GIONG_AI33_CHO_BEAT_SONG_SONG,
  MOTION_TEMPLATE_VIET_LOI_DAN_PHAN_CANH_CHUONG,
  MOTION_TEXT_16_9,
  MOTION_TEXT_1_1,
  MOTION_TEXT_2D,
  MOTION_TEXT_3D,
  MOTION_TEXT_4_5,
  MOTION_TEXT_9_16,
  MOTION_TEXT_AAC,
  MOTION_TEXT_AI_DE_XUAT,
  MOTION_TEXT_AI_KIEM_TRA_TUNG_CANH_CO_KHOP_LOI,
  MOTION_TEXT_ANALYZE,
  MOTION_TEXT_APPLICATION_JAVASCRIPT,
  MOTION_TEXT_APPLICATION_WASM,
  MOTION_TEXT_BASE64,
  MOTION_TEXT_CACHE_CONTROL,
  MOTION_TEXT_CAN_PHAN_TICH_CAU_CHUYEN_TRUOC,
  MOTION_TEXT_CAN_VIET_LOI_DAN_PHAN_CANH_TRUOC,
  MOTION_TEXT_CANCELLED,
  MOTION_TEXT_CHAPTERID,
  MOTION_TEXT_CHUA_CHON_TAI_NGUYEN,
  MOTION_TEXT_CHUA_CO_KICH_BAN,
  MOTION_TEXT_CHUA_CO_LOI_DAN_DE_TAO_GIONG,
  MOTION_TEXT_CHUA_CO_NOI_DUNG_CAU_CHUYEN,
  MOTION_TEXT_DANG_RENDER_KHONG_THE_XOA_TAT_CA,
  MOTION_TEXT_DARK,
  MOTION_TEXT_DINH_DANG_AM_THANH_KHONG_HO_TRO,
  MOTION_TEXT_DRACO,
  MOTION_TEXT_EN,
  MOTION_TEXT_FLAC,
  MOTION_TEXT_GOI_CHAN_THUC_MAC_DINH,
  MOTION_TEXT_HAY_CHON_GIONG_DOC_AI33,
  MOTION_TEXT_HDRIS,
  MOTION_TEXT_ID,
  MOTION_TEXT_KHONG_TIM_THAY_MO_HINH,
  MOTION_TEXT_KHONG_TIM_THAY_TAC_VU,
  MOTION_TEXT_KHONG_TIM_THAY_TEP_VIDEO,
  MOTION_TEXT_KHONG_TIM_THAY_TIEN_TRINH,
  MOTION_TEXT_KHONG_TIM_THAY_TIEN_TRINH_RENDER,
  MOTION_TEXT_KHONG_TIM_THAY_VIDEO_MAU,
  MOTION_TEXT_KICH_BAN_DUNG_SPEC_CHUA_CO_CANH_NAO,
  MOTION_TEXT_M4A,
  MOTION_TEXT_MESSAGE,
  MOTION_TEXT_MODELS,
  MOTION_TEXT_MOTION_VIDEO_CHECK_FAILED,
  MOTION_TEXT_MP3,
  MOTION_TEXT_OGG,
  MOTION_TEXT_PHIEN_LUU_DA_HET_HAN_HAY_CHON_LAI,
  MOTION_TEXT_PRIVATE_MAX_AGE_86400,
  MOTION_TEXT_QUA_NHIEU_CANH_TRONG_MOT_VIDEO,
  MOTION_TEXT_REAL,
  MOTION_TEXT_REVIEW,
  MOTION_TEXT_SELECT_SAVE_FILE,
  MOTION_TEXT_SPAGGIARI,
  MOTION_TEXT_TAI_TAI_NGUYEN,
  MOTION_TEXT_TAT_CA_CANH_KHOP_LOI_DAN,
  MOTION_TEXT_TEP_AM_THANH_QUA_LON,
  MOTION_TEXT_TEP_AM_THANH_TRONG,
  MOTION_TEXT_TEXTURES,
  MOTION_TEXT_THIEU_DU_LIEU_MO_HINH,
  MOTION_TEXT_VENDOR,
  MOTION_TEXT_VI,
  MOTION_TEXT_VOICE_MP3,
  MOTION_TEXT_WASM,
  MOTION_TEXT_WAV,
} from "../../constants/motionRuntime.js";
import { MOTION_VIDEO_CONSTANTS } from "../../constants/motionVideo.js";
import { FeatureType } from "../../constants/security.js";
import { STORAGE_TEXTS } from "../../constants/storage.js";
import { SUNO_AUTOMATION_CONFIG } from "../../constants/sunoAutomation.js";
import { logger } from "../../lib/logger.js";
import { MotionEncoderPreference, MotionQuality, MotionStoryJobKind, MotionStoryLength, type MotionAiExecution, type MotionBeat, type MotionImageOptions, type MotionSpec, type MotionStoryAnalysis, type MotionStoryScript, type MotionStorySource } from "../../types/motionVideo.js";
import { getResolvedLicenseKey } from "../services/apiKeyResolver.js";
import { LicenseService } from "../services/licenseService.js";
import { illustrateScript } from "../services/motionArtService.js";
import { buildAi33VoiceTrack, fitUploadedVoice } from "../services/motionAudioService.js";
import { compileStorySpec, estimateBeatSeconds } from "../services/motionDirectorService.js";
import { getMotionDemoSpec, getMotionEngineClientScript, getMotionEngineDir, getRealDefaults, loadMotionEngine } from "../services/motionEngineService.js";
import { clearMotionResults, deleteMotionCharacter, deleteMotionResult, getMotionAudioDirectory, getMotionRootDirectory, listMotionCharacters, listMotionResults, saveMotionCharacter } from "../services/motionLibraryService.js";
import { cancelRealJob, deleteRealItem, getRealJob, importRealModel, listPolyHaven, readRealManifest, REAL_RES, realContentType, realStats, resolveRealFile, setRealEnvOverride, starterPackList, startRealDownloadJob, updateRealItem, withRealCatalog } from "../services/motionRealAssetService.js";
import { cancelMotionJob, checkMotionSpec, execFileText, getMotionEnvironmentInfo, getMotionJob, isMotionRenderBusy, probeMediaDuration, startMotionRender } from "../services/motionRenderService.js";
import { cancelStoryJob, getStoryJob, startStoryJob } from "../services/motionStoryJobService.js";
import { reviewStoryboard } from "../services/motionStoryReviewService.js";
import { analyzeStory, parseStorySource, writeChapterBeats } from "../services/motionStoryService.js";
import { cleanStorageJunk, scanStorageJunk } from "../services/storageService.js";
import { getPythonCommand, getStaticResourcePath } from "../utils/paths.js";
const fail = (res: Response, status: number, error: unknown) => res.status(status).json({ success: false, error: _.toString(_.get(error, MOTION_TEXT_MESSAGE, error)) });
const saveDestinations = new Map<string, string>();
const validateSpec = (raw: unknown): MotionSpec => {
  const spec = (_.isString(raw) ? parseJson(raw) : raw) as MotionSpec;
  if (!spec || !_.isArray(spec.shots) || _.isEmpty(spec.shots)) throw new Error(MOTION_TEXT_KICH_BAN_DUNG_SPEC_CHUA_CO_CANH_NAO);
  if (spec.shots.length > 2000) throw new Error(MOTION_TEXT_QUA_NHIEU_CANH_TRONG_MOT_VIDEO);
  return spec;
};
export const getMotionEngineScript = (_req: Request, res: Response): void => {
  try {
    res.type(MOTION_TEXT_APPLICATION_JAVASCRIPT).send(getMotionEngineClientScript());
  } catch (error) {
    fail(res, 500, error);
  }
};
export const getMotionCatalog = (_req: Request, res: Response): void => {
  try {
    res.json({ success: true, catalog: withRealCatalog(loadMotionEngine().catalog), custom: listMotionCharacters() });
  } catch (error) {
    fail(res, 500, error);
  }
};
export const getMotionDemo = (req: Request, res: Response): void => {
  const spec = getMotionDemoSpec(_.toString(req.query.name || MOTION_TEXT_SPAGGIARI));
  if (!spec) return void fail(res, 404, MOTION_TEXT_KHONG_TIM_THAY_VIDEO_MAU);
  res.json({ success: true, spec });
};
export const getMotionEnvironment = async (_req: Request, res: Response): Promise<void> => {
  try {
    res.json({ success: true, info: await getMotionEnvironmentInfo() });
  } catch (error) {
    fail(res, 500, error);
  }
};
export const listMotionLibrary = (_req: Request, res: Response): void => {
  res.json({ success: true, items: listMotionCharacters() });
};
export const createMotionLibraryItem = (req: Request, res: Response): void => {
  try {
    res.json({ success: true, item: saveMotionCharacter(req.body?.item || req.body) });
  } catch (error) {
    fail(res, 400, error);
  }
};
export const updateMotionLibraryItem = (req: Request, res: Response): void => {
  try {
    res.json({ success: true, item: saveMotionCharacter(req.body?.item || req.body, req.params.id) });
  } catch (error) {
    fail(res, 400, error);
  }
};
export const deleteMotionLibraryItem = (req: Request, res: Response): void => {
  res.json({ success: deleteMotionCharacter(req.params.id) });
};
export const uploadMotionAudio = async (req: Request, res: Response): Promise<void> => {
  try {
    const name = path.basename(_.toString(req.body?.name || MOTION_TEXT_VOICE_MP3));
    const ext = _.toLower(path.extname(name)) || MOTION_TEXT_MP3;
    if (!_.includes([MOTION_TEXT_MP3, MOTION_TEXT_WAV, MOTION_TEXT_M4A, MOTION_TEXT_AAC, MOTION_TEXT_OGG, MOTION_TEXT_FLAC], ext)) throw new Error(MOTION_TEXT_DINH_DANG_AM_THANH_KHONG_HO_TRO);
    const buf = Buffer.from(_.toString(req.body?.base64).replace(/^data:[^,]+,/, ""), MOTION_TEXT_BASE64);
    if (buf.length < 1000) throw new Error(MOTION_TEXT_TEP_AM_THANH_TRONG);
    if (buf.length > MOTION_VIDEO_CONSTANTS.MAX_AUDIO_BYTES) throw new Error(MOTION_TEXT_TEP_AM_THANH_QUA_LON);
    const id = `${randomUUID()}${ext}`;
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
      renderMode: o.renderMode === MOTION_TEXT_REAL ? MOTION_TEXT_REAL : o.renderMode === MOTION_TEXT_3D ? MOTION_TEXT_3D : o.renderMode === MOTION_TEXT_2D ? MOTION_TEXT_2D : undefined,
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
    const suggested = path.basename(_.toString(req.body?.suggestedName || MOTION_TEMPLATE_MOTION(`${MOTION_VIDEO_CONSTANTS.EXT_MP4}`)));
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
export const parseMotionStory = (req: Request, res: Response): void => {
  try {
    res.json({ success: true, source: parseStorySource(_.toString(req.body?.text)) });
  } catch (error) {
    fail(res, 400, error);
  }
};
export const analyzeMotionStory = (req: Request, res: Response): void => {
  try {
    const source = (req.body?.source as MotionStorySource) || parseStorySource(_.toString(req.body?.text));
    if (!source?.segments?.length) throw new Error(MOTION_TEXT_CHUA_CO_NOI_DUNG_CAU_CHUYEN);
    const language = storyLanguage(req.body?.language);
    const length = storyLength(req.body?.length);
    const exec = aiExec(req.body?.aiExecution);
    const job = startStoryJob(MotionStoryJobKind.ANALYZE, async (ctx) => {
      ctx.progress(0.1, MOTION_TEXT_ANALYZE);
      ctx.log(MOTION_TEMPLATE_PHAN_TICH_CAU_CHUYEN_TU_PHUT(`${source.words}`, `${Math.round(source.sourceSeconds / 60)}`));
      const analysis = await analyzeStory(source, { language, length, exec, signal: ctx.signal, log: ctx.log });
      let added = 0;
      for (const member of analysis.cast) {
        if (!member.suggested || !_.isPlainObject(member.suggested)) continue;
        try {
          const saved = saveMotionCharacter({ ...member.suggested, name: member.name, tags: _.compact([member.role, MOTION_TEXT_AI_DE_XUAT]) });
          member.characterId = saved.id;
          delete member.suggested;
          added++;
        } catch {}
      }
      if (added) ctx.log(MOTION_TEMPLATE_DA_THEM_NHAN_VAT_MOI_VAO_KHO_NHAN(`${added}`));
      ctx.log(MOTION_TEMPLATE_AI_CHIA_CHUONG_NHAN_VAT_DIEM_CAN_KIEM(`${analysis.chapters.length}`, `${analysis.cast.length}`, `${analysis.facts.length}`));
      return analysis;
    });
    res.json({ success: true, job });
  } catch (error) {
    fail(res, 400, error);
  }
};
export const artMotionStory = (req: Request, res: Response): void => {
  try {
    const analysis = req.body?.analysis as MotionStoryAnalysis;
    const script = req.body?.script as MotionStoryScript;
    if (!analysis?.cast || !script?.beats?.length) throw new Error(MOTION_TEXT_CAN_VIET_LOI_DAN_PHAN_CANH_TRUOC);
    const exec = aiExec(req.body?.aiExecution);
    const image = (req.body?.image || {}) as MotionImageOptions;
    const only: string[] = _.map(_.castArray(req.body?.only || []), _.toString);
    if (req.body?.restart) delete (script as any).art;
    const job = startStoryJob(MotionStoryJobKind.ART, async (ctx) => illustrateScript(script, analysis, { aspect: _.toString(req.body?.aspect || MOTION_TEXT_16_9), exec, image, signal: ctx.signal, log: ctx.log, progress: ctx.progress, partial: ctx.partial, only }));
    res.json({ success: true, job });
  } catch (error) {
    fail(res, 400, error);
  }
};
export const scriptMotionStory = (req: Request, res: Response): void => {
  try {
    const source = req.body?.source as MotionStorySource;
    const analysis = req.body?.analysis as MotionStoryAnalysis;
    if (!source?.segments?.length || !analysis?.chapters?.length) throw new Error(MOTION_TEXT_CAN_PHAN_TICH_CAU_CHUYEN_TRUOC);
    const language = storyLanguage(req.body?.language);
    const exec = aiExec(req.body?.aiExecution);
    const only: string[] = _.map(_.castArray(req.body?.chapterIds || []), _.toString);
    const existing: MotionBeat[] = _.castArray(req.body?.beats || []);
    const job = startStoryJob(MotionStoryJobKind.SCRIPT, async (ctx) => {
      const chapters = analysis.chapters;
      const byChapter: Record<string, MotionBeat[]> = _.groupBy(existing, MOTION_TEXT_CHAPTERID);
      const todo = _.filter(chapters, (c) => _.isEmpty(only) || _.includes(only, c.id));
      let done = 0;
      for (const chapter of todo) {
        if (ctx.signal.aborted) throw new Error(MOTION_TEXT_CANCELLED);
        const idx = _.findIndex(chapters, { id: chapter.id });
        ctx.progress(done / todo.length, chapter.id);
        ctx.log(MOTION_TEMPLATE_VIET_LOI_DAN_PHAN_CANH_CHUONG(`${idx + 1}`, `${chapters.length}`, `${chapter.title}`));
        const previous = idx > 0 ? byChapter[chapters[idx - 1].id] : undefined;
        byChapter[chapter.id] = await writeChapterBeats(source, analysis, chapter, { language, exec, signal: ctx.signal, log: ctx.log, previous, isFirst: idx === 0, isLast: idx === chapters.length - 1 });
        done++;
        ctx.log(MOTION_TEMPLATE_BEAT(`${byChapter[chapter.id].length}`));
        ctx.partial({ title: analysis.title, language, beats: _.flatMap(chapters, (c) => byChapter[c.id] || []) });
      }
      let script = { title: analysis.title, language, beats: _.flatMap(chapters, (c) => byChapter[c.id] || []) };
      if (req.body?.review !== false) {
        let ids = _.map(
          _.filter(script.beats, (b) => _.some(todo, { id: b.chapterId })),
          MOTION_TEXT_ID,
        );
        for (let pass = 1; pass <= 2 && ids.length; pass++) {
          if (ctx.signal.aborted) throw new Error(MOTION_TEXT_CANCELLED);
          ctx.progress(0.92, MOTION_TEXT_REVIEW);
          ctx.log(pass === 1 ? MOTION_TEXT_AI_KIEM_TRA_TUNG_CANH_CO_KHOP_LOI : MOTION_TEMPLATE_KIEM_TRA_LAI_BEAT_VUA_SUA(`${ids.length}`));
          try {
            const r = await reviewStoryboard(script, analysis, { aspect: _.toString(req.body?.aspect || MOTION_TEXT_16_9), exec, signal: ctx.signal, log: ctx.log, beatIds: ids });
            script = { ...script, beats: r.beats };
            ctx.log(r.fixed.length ? MOTION_TEMPLATE_DA_SUA_BEAT_CHO_KHOP_LOI_DAN(`${r.fixed.length}`, `${_.uniq(ids).length}`) : MOTION_TEXT_TAT_CA_CANH_KHOP_LOI_DAN);
            ctx.partial(script);
            ids = r.fixed;
          } catch (error) {
            if (ctx.signal.aborted) throw error;
            ctx.log(MOTION_TEMPLATE_BO_QUA_BUOC_KIEM_TRA_HINH(`${_.truncate(_.toString(_.get(error, MOTION_TEXT_MESSAGE, error)), { length: 140 })}`));
            break;
          }
        }
      }
      return script;
    });
    res.json({ success: true, job });
  } catch (error) {
    fail(res, 400, error);
  }
};
export const voiceMotionStory = (req: Request, res: Response): void => {
  try {
    const beats: MotionBeat[] = _.filter(_.castArray(req.body?.beats || []), (b) => !_.isEmpty(_.trim(b?.narration)));
    if (_.isEmpty(beats)) throw new Error(MOTION_TEXT_CHUA_CO_LOI_DAN_DE_TAO_GIONG);
    const voiceId = _.toString(req.body?.voiceId);
    if (!voiceId) throw new Error(MOTION_TEXT_HAY_CHON_GIONG_DOC_AI33);
    const speed = _.toNumber(req.body?.speed) || 1;
    const licenseKey = getResolvedLicenseKey(req);
    const job = startStoryJob(MotionStoryJobKind.VOICE, async (ctx) => {
      ctx.log(MOTION_TEMPLATE_TAO_GIONG_AI33_CHO_BEAT_SONG_SONG(`${beats.length}`));
      const track = await buildAi33VoiceTrack(beats, { voiceId, speed, signal: ctx.signal, log: ctx.log, onProgress: (d, t) => ctx.progress(d / t, MOTION_TEMPLATE_SYMBOL_4(`${d}`, `${t}`)) });
      if (licenseKey) await LicenseService.incrementUsage(licenseKey, FeatureType.VOICE, track.characters).catch(_.noop);
      ctx.log(MOTION_TEMPLATE_GIONG_DOC_GIAY(`${Math.round(track.totalSeconds)}`));
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
    if (!durations && uploadedSeconds > 0)
      durations = fitUploadedVoice(
        script.beats,
        _.map(script.beats, (b) => estimateBeatSeconds(b, script.language)),
        uploadedSeconds,
      );
    const compiled = compileStorySpec(script, analysis, { aspect, durations, look: req.body?.look, accent: req.body?.accent });
    res.json({ success: true, spec: compiled.spec, sfxCues: compiled.sfxCues, starts: compiled.starts });
  } catch (error) {
    fail(res, 400, error);
  }
};
export const getMotionStoryStatus = (req: Request, res: Response): void => {
  const job = getStoryJob(_.toString(req.params.jobId));
  if (!job) return void fail(res, 404, MOTION_TEXT_KHONG_TIM_THAY_TIEN_TRINH);
  res.json({ success: true, job });
};
export const cancelMotionStory = (req: Request, res: Response): void => {
  res.json({ success: true, cancelled: cancelStoryJob(req.body?.jobId ? _.toString(req.body.jobId) : undefined) });
};
export const getRealManifest = (_req: Request, res: Response): void => {
  try {
    res.json({ success: true, manifest: readRealManifest(), stats: realStats(), defaults: getRealDefaults(), res: REAL_RES });
  } catch (error) {
    fail(res, 500, error);
  }
};
export const serveRealFile = (req: Request, res: Response): void => {
  const rel = _.toString((req.params as Record<string, string>)[0] || "");
  const file = resolveRealFile(rel);
  if (!file) return void res.status(404).end();
  res.setHeader(MOTION_TEXT_CACHE_CONTROL, MOTION_TEXT_PRIVATE_MAX_AGE_86400);
  res.type(realContentType(file));
  res.sendFile(file);
};
export const listRealPolyHaven = async (req: Request, res: Response): Promise<void> => {
  try {
    const type = _.includes([MOTION_TEXT_HDRIS, MOTION_TEXT_TEXTURES, MOTION_TEXT_MODELS], req.query.type) ? (req.query.type as "hdris" | "textures" | "models") : MOTION_TEXT_MODELS;
    const items = await listPolyHaven(type, { category: _.toString(req.query.category || "") || undefined, search: _.toString(req.query.search || "") || undefined, limit: _.clamp(_.toNumber(req.query.limit) || 300, 1, 1000) });
    res.json({ success: true, items });
  } catch (error) {
    fail(res, 502, error);
  }
};
export const downloadRealAssets = (req: Request, res: Response): void => {
  try {
    const list = _.filter(_.castArray(req.body?.items || []), (x: any) => _.includes([MOTION_TEXT_HDRIS, MOTION_TEXT_TEXTURES, MOTION_TEXT_MODELS], x?.type) && /^[A-Za-z0-9_.-]{1,80}$/.test(_.toString(x?.id)));
    if (!list.length) return void fail(res, 400, MOTION_TEXT_CHUA_CHON_TAI_NGUYEN);
    res.json({ success: true, job: startRealDownloadJob(_.toString(req.body?.label || MOTION_TEXT_TAI_TAI_NGUYEN), list) });
  } catch (error) {
    fail(res, 400, error);
  }
};
export const downloadRealStarter = (_req: Request, res: Response): void => {
  try {
    res.json({ success: true, job: startRealDownloadJob(MOTION_TEXT_GOI_CHAN_THUC_MAC_DINH, starterPackList()) });
  } catch (error) {
    fail(res, 400, error);
  }
};
export const getRealJobStatus = (req: Request, res: Response): void => {
  const job = getRealJob(_.toString(req.params.jobId));
  if (!job) return void fail(res, 404, MOTION_TEXT_KHONG_TIM_THAY_TAC_VU);
  res.json({ success: true, job });
};
export const cancelRealJobRequest = (req: Request, res: Response): void => {
  cancelRealJob(_.toString(req.params.jobId));
  res.json({ success: true });
};
export const importRealAsset = (req: Request, res: Response): void => {
  try {
    const b64 = _.toString(req.body?.base64 || "").replace(/^data:[^,]+,/, "");
    if (!b64) return void fail(res, 400, MOTION_TEXT_THIEU_DU_LIEU_MO_HINH);
    res.json({ success: true, item: importRealModel(Buffer.from(b64, MOTION_TEXT_BASE64), req.body?.meta || {}) });
  } catch (error) {
    fail(res, 400, error);
  }
};
export const updateRealAsset = (req: Request, res: Response): void => {
  const item = updateRealItem(_.toString(req.params.id), req.body?.item || req.body || {});
  if (!item) return void fail(res, 404, MOTION_TEXT_KHONG_TIM_THAY_MO_HINH);
  res.json({ success: true, item });
};
export const deleteRealAsset = (req: Request, res: Response): void => {
  res.json({ success: deleteRealItem(_.toString(req.params.id)) });
};
export const setRealEnv = (req: Request, res: Response): void => {
  try {
    res.json({ success: true, manifest: setRealEnvOverride(_.toString(req.body?.envId), req.body?.override || null) });
  } catch (error) {
    fail(res, 400, error);
  }
};
export const serveRealDraco = (req: Request, res: Response): void => {
  const name = path.basename(_.toString(req.params.file));
  if (!/^draco_(decoder\.(js|wasm)|wasm_wrapper\.js)$/.test(name)) return void res.status(404).end();
  const file = path.join(getMotionEngineDir(), MOTION_TEXT_VENDOR, MOTION_TEXT_DRACO, name);
  if (!fs.existsSync(file)) return void res.status(404).end();
  res.type(name.endsWith(MOTION_TEXT_WASM) ? MOTION_TEXT_APPLICATION_WASM : MOTION_TEXT_APPLICATION_JAVASCRIPT);
  res.sendFile(file);
};
