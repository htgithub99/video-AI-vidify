import { RUNTIME_TEXT as RT_SERVER } from "../../constants/runtime/server.js";
import { RUNTIME_TEXT as RT_SHARED } from "../../constants/runtime/shared.js";
import { stringifyJson } from "../../lib/jsonStringify.js";
import { assertMotionScriptComplete, assertMotionProductionMode } from "../../lib/motionProduction.js";
import { MOTION_CHAPTER_REPAIR } from "../../constants/motionChapterRepair.js";
import { MOTION_PRODUCTION } from "../../constants/motionProduction.js";
import { motionVisualSettingsFor, isRemotionSpec } from "../../lib/motionVisual.js";
import { applyMotionRenderBehavior, motionRenderBehaviorFor } from "../../lib/motionRenderBehavior.js";
import { validateRemotionSpec } from "../../lib/motionRemotion.js";
import type { MotionRenderSpec } from "../../types/motionVisual.js";
import { buildRemotionScenes } from "./remotion/scenePipeline.js";
import { compileRemotionStory } from "./remotion/storyCompiler.js";
import { motionEditorialContext } from "./motionEditorialContextService.js";
import { buildScenesPuppet } from "./puppet/pipelinePuppet.js";
import { MOTION_SOUND_CONFIG as SOUND } from "../../constants/motionSound.js";
import { normalizeSoundCues } from "../../lib/motionSound.js";
import { buildMotionSoundTrack, mixMotionSoundAudio } from "./motionSoundMixService.js";
import { normalizeMotionReferences } from "../../lib/motionReference.js";
import * as MR from "../../constants/motionRuntime.js";
import { bindVideoDnaSettings, videoDnaErrors, videoDnaSourceKey } from "../../lib/motionVideoDna.js";
import { MOTION_VIDEO_GENRE_ERROR, motionVideoGenre } from "../../constants/motionGenre.js";
import { listMotionVoices as listMotionVoiceSources } from "./motionVoiceSourceService.js";
import { MOTION_MUSIC } from "../../constants/motionMusic.js";
import _ from "lodash";
import { motionSpeechRate, speechUnits } from "./motionSpeechRateService.js";
import { recordVoiceSpeedFeedback, voicesUseAutoSpeed } from "./motionVoiceSpeedService.js";
import path from "path";
import {
  MOTION_TEMPLATE_AI_CHIA_CHUONG_NHAN_VAT_BOI_CANH_DIEM,
  MOTION_TEMPLATE_BEAT,
  MOTION_TEMPLATE_GIONG_DOC_GIAY,
  MOTION_TEMPLATE_PHAN_TICH_CAU_CHUYEN_TU_PHUT,
  MOTION_TEMPLATE_VIET_LOI_DAN_PHAN_CANH_CHUONG,
  MOTION_TEXT_16_9,
  MOTION_TEXT_1_1,
  MOTION_TEXT_4_5,
  MOTION_TEXT_9_16,
  MOTION_TEXT_ANALYZE,
  MOTION_TEXT_CANCELLED,
  MOTION_TEXT_CAN_PHAN_TICH_CAU_CHUYEN_TRUOC,
  MOTION_TEXT_CAN_VIET_LOI_DAN_PHAN_CANH_TRUOC,
  MOTION_TEXT_CHAPTERID,
  MOTION_TEXT_CHUA_CO_KICH_BAN,
  MOTION_TEXT_CHUA_CO_NOI_DUNG_CAU_CHUYEN,
  MOTION_TEXT_DARK,
  MOTION_TEXT_EN,
  MOTION_TEXT_KICH_BAN_DUNG_SPEC_CHUA_CO_CANH_NAO,
  MOTION_TEXT_QUA_NHIEU_CANH_TRONG_MOT_VIDEO,
  MOTION_TEXT_VI,
} from "../../constants/motionRuntime.js";
import { MOTION_STORY_CONFIG } from "../../constants/motionVideo.js";
import { parseJson } from "../../lib/jsonStringify.js";
import { logger } from "../../lib/logger.js";
import { MotionEncoderPreference, MotionQuality, MotionStoryJobKind, MotionStoryLength, type MotionAiExecution, type MotionBeat, type MotionChapter, type MotionSpec, type MotionStoryAnalysis, type MotionStoryScript, type MotionStorySource } from "../../types/motionVideo.js";
import { buildMotionVoiceTrack, fitUploadedVoice, readMotionVoiceTrack } from "./motionAudioService.js";
import { motionVoiceCast, withMotionVoiceMode } from "../../lib/motionVoice.js";
import { MOTION_VOICE, MOTION_VOICE_PATTERNS } from "../../constants/motionVoice.js";
import { directMotionVoice } from "./motionVoiceDirectionService.js";
import { createHash } from "crypto";
import { compileStorySpec, estimateBeatSeconds } from "./motionDirectorService.js";
import { emptyGen } from "./puppet/genState.js";
import { MOTION_AI_ROLE } from "../../constants/motionAiFallback.js";
import { startMotionRender } from "./motionRenderService.js";
import { startStoryJob, type StoryJobContext } from "./motionStoryJobService.js";
import { motionInputKey } from "./motionFileUtils.js";
import { analyzeStory, editScript, mapMotionAiPool, parseStorySource, writeChapterBeats, type MotionEditorialSession, type MotionAnalysisDraft } from "./motionStoryService.js";
import { isTerminalMotionAiError } from "./chatSubmissionRecovery.js";
import { MOTION_EDITORIAL } from "../../constants/motionEditorial.js";
import { generateMotionSeo, seoScriptKey, type MotionSeoDraft } from "./motionSeoService.js";
import { motionTaskCheckpoint } from "./motionTaskCheckpoint.js";
import { resolveSourceInput, withFetchInfo } from "./motionSourceFetchService.js";
import { cleanTranscriptInput } from "../../lib/motionSourceClean.js";
const startInputJob = (body: Record<string, any>, keepBrowser: boolean, kind: MotionStoryJobKind, run: (ctx: StoryJobContext) => Promise<unknown>, editorial?: MotionEditorialSession) => startStoryJob(keepBrowser, kind, run, editorial, body.productionId || editorial?.id ? motionInputKey([body.productionId || editorial?.id, kind, body]) : undefined);
export const readStorySource = async (text: string): Promise<MotionStorySource> => {
  const r = await resolveSourceInput(text);
  const { text: cleaned, report } = cleanTranscriptInput(r.text);
  const source = withFetchInfo(parseStorySource(cleaned), r.notes, r.fetched);
  return report.splitNumbers || report.soundCues || report.missingQuotes ? { ...source, cleaned: report } : source;
};
export const validateSpec = (raw: unknown): MotionRenderSpec => {
  const spec = (_.isString(raw) ? parseJson(raw) : raw) as MotionSpec;
  if (isRemotionSpec(spec)) return applyMotionRenderBehavior(validateRemotionSpec(spec), motionRenderBehaviorFor(spec));
  if (!spec || !_.isArray(spec.shots) || _.isEmpty(spec.shots)) throw new Error(MOTION_TEXT_KICH_BAN_DUNG_SPEC_CHUA_CO_CANH_NAO);
  if (spec.shots.length > 2000) throw new Error(MOTION_TEXT_QUA_NHIEU_CANH_TRONG_MOT_VIDEO);
  return applyMotionRenderBehavior(spec, motionRenderBehaviorFor(spec));
};
export const startMotionVideoRenderInput = (body: Record<string, any>) => {
  const spec = validateSpec(body?.spec);
  const o = body?.options || {};
  const job = startMotionRender(spec, {
    quality: _.includes(_.values(MotionQuality), o.quality) ? o.quality : MotionQuality.STANDARD,
    aspect: _.toString(o.aspect || spec.aspect || MOTION_TEXT_16_9),
    fps: _.toNumber(o.fps) || undefined,
    encoder: _.includes(_.values(MotionEncoderPreference), o.encoder) ? o.encoder : MotionEncoderPreference.AUTO,
    title: _.truncate(_.toString(o.title || spec.title || MR.MOTION_TEXT_EMPTY), { length: 120 }),
    requireAudio: o.requireAudio === true,
    editorialSessionId: MOTION_EDITORIAL.ID_PATTERN.test(o.editorialSessionId || body.editorialSessionId || body.productionId || MR.MOTION_TEXT_EMPTY) ? o.editorialSessionId || body.editorialSessionId || body.productionId : undefined,
    speechRanges: Array.isArray(o.speechRanges) ? o.speechRanges.filter((range: any) => Number.isFinite(range?.start) && Number.isFinite(range?.end) && range.end > range.start).map((range: any) => ({ start: range.start, end: range.end })) : undefined,
    audioId: o.audioId ? path.basename(_.toString(o.audioId)) : undefined,
    audioVolume: _.toNumber(o.audioVolume ?? 1),
    mixedAudioId: MOTION_VOICE_PATTERNS.MIX_TRACK.test(o.mixedAudioId) ? o.mixedAudioId : undefined,
    sfxId: MOTION_VOICE_PATTERNS.SFX_TRACK.test(o.sfxId) ? o.sfxId : undefined,
    sfxVolume: _.toNumber(o.sfxVolume ?? 0.5),
    music: o.music && o.music.mood !== MOTION_MUSIC.OFF ? { mood: _.toString(o.music.mood || MOTION_MUSIC.AUTO), volume: _.clamp(_.toNumber(o.music.volume ?? MOTION_MUSIC.DEFAULT_VOLUME) || 0, 0, 1) } : undefined,
    sfx: o.sfx && _.isArray(o.sfx.cues) ? { cues: normalizeSoundCues(o.sfx.cues, spec.duration), mood: _.toString(o.sfx.mood || MOTION_TEXT_DARK) } : undefined,
  });
  return { success: true, job };
};
export const storyLanguage = (v: unknown): string => (v === MOTION_TEXT_EN ? MOTION_TEXT_EN : MOTION_TEXT_VI);
export const storyLength = (v: unknown): MotionStoryLength => (_.includes(_.values(MotionStoryLength), v) ? (v as MotionStoryLength) : MotionStoryLength.FULL);
export const aiExec = (v: any): MotionAiExecution => ({ provider: _.toString(v?.provider || MR.MOTION_TEXT_EMPTY), model: _.toString(v?.model || MR.MOTION_TEXT_EMPTY), mode: _.toString(v?.mode || MR.MOTION_TEXT_EMPTY), chromeHeadless: v?.chromeHeadless !== false, ...(v?.strictProvider === true ? { strictProvider: true } : {}) });
export const drawExec = (v: any): MotionAiExecution => ({ ...aiExec(v), role: MOTION_AI_ROLE.DRAW });
export const editorialSession = (body: any, source: MotionStorySource, exec: MotionAiExecution): MotionEditorialSession | undefined => {
  const id = _.toString(body?.editorialSessionId);
  if (!MOTION_EDITORIAL.ID_PATTERN.test(id) || !source?.segments) return undefined;
  const revision = createHash(RT_SERVER.SHA256)
    .update(stringifyJson([videoDnaSourceKey(source), source.notes, storyLanguage(body?.language), { provider: exec.provider, model: exec.model, mode: exec.mode }]))
    .digest(RT_SERVER.HEX);
  return { id, revision, context: motionEditorialContext(source, body?.analysis, body?.script, body?.beats, storyLanguage(body?.language)) };
};
export const analyzeMotionStoryInput = async (body: Record<string, any>) => {
  assertMotionProductionMode(body);
  const visualSettings = motionVisualSettingsFor(body);
  const source = (body?.source as MotionStorySource) || (await readStorySource(_.toString(body?.text)));
  if (!source?.segments?.length) throw new Error(MOTION_TEXT_CHUA_CO_NOI_DUNG_CAU_CHUYEN);
  const language = storyLanguage(body?.language);
  const length = storyLength(body?.length);
  const styleReferences = normalizeMotionReferences(body?.styleReferences);
  const exec = aiExec(body?.aiExecution);
  const job = startInputJob(
    body,
    body?.keepBrowser === true,
    MotionStoryJobKind.ANALYZE,
    async (ctx) => {
      ctx.progress(0.1, MOTION_TEXT_ANALYZE);
      ctx.log(MOTION_TEMPLATE_PHAN_TICH_CAU_CHUYEN_TU_PHUT(String(Number.isFinite(source.words) ? source.words : speechUnits(source.text)), String(Math.round(source.sourceSeconds / 60))));
      const options = { language, length, visualSettings, styleReferences: visualSettings.mode === RT_SHARED.REMOTION ? [] : styleReferences, videoGenre: motionVideoGenre(body?.videoGenre), stylePreset: visualSettings.mode === RT_SHARED.LIBRARY ? visualSettings.packId : undefined, characterMotion: body?.characterMotion === true, aspect: _.toString(body?.aspect || MR.MOTION_TEXT_16_9), exec };
      const recovery = motionTaskCheckpoint<MotionAnalysisDraft>(body.productionId || body.editorialSessionId, MotionStoryJobKind.ANALYZE, [source, options]);
      const analysis = await analyzeStory(source, { ...options, signal: ctx.signal, log: ctx.log, draft: recovery.read(), onDraft: recovery.save });
      ctx.log(MOTION_TEMPLATE_AI_CHIA_CHUONG_NHAN_VAT_BOI_CANH_DIEM(String(analysis.chapters.length), String(analysis.cast.length), String(analysis.places.length), String(analysis.facts.length)));
      return analysis;
    },
    editorialSession(body, source, exec),
  );
  return { success: true, job };
};
export const scriptMotionStoryInput = (body: Record<string, any>) => {
  assertMotionProductionMode(body);
  const source = body?.source as MotionStorySource;
  let analysis = body?.analysis as MotionStoryAnalysis;
  const visualSettings = motionVisualSettingsFor(body);
  if (analysis) analysis = { ...analysis, visualSettings, stylePreset: visualSettings.mode === RT_SHARED.LIBRARY ? visualSettings.packId : undefined };
  if (!source?.segments?.length || !analysis?.chapters?.length) throw new Error(MOTION_TEXT_CAN_PHAN_TICH_CAU_CHUYEN_TRUOC);
  if (body?.videoGenre !== undefined && analysis.videoGenre !== motionVideoGenre(body.videoGenre)) throw new Error(MOTION_VIDEO_GENRE_ERROR.CHANGED);
  const language = storyLanguage(body?.language);
  if (analysis.videoDna) {
    const errors = videoDnaErrors(analysis.videoDna);
    if (errors.length) throw new Error(MR.MOTION_TEMPLATE_INVALID_VIDEO_DNA(errors.slice(0, 5).join(MR.MOTION_TEXT_SYMBOL_41)));
    if (analysis.videoDna.sourceKey !== videoDnaSourceKey(source)) throw new Error(MR.MOTION_TEXT_INPUT_CHANGED_ANALYZE_VIDEO_DNA_AGAIN_BEFORE_WRITING_SCENES);
    if (body?.length && analysis.videoDna.settings.length !== storyLength(body.length)) throw new Error(MR.MOTION_TEXT_VIDEO_LENGTH_CHANGED_ANALYZE_VIDEO_DNA_AGAIN);
    analysis = bindVideoDnaSettings(analysis, { language: language === MR.MOTION_TEXT_EN ? MR.MOTION_TEXT_EN : MR.MOTION_TEXT_VI, aspect: _.toString(body?.aspect || analysis.videoDna.settings.aspect), drawingMode: MR.MOTION_TEXT_2D, characterMode: MR.MOTION_TEXT_DRAWN });
  }
  const exec = aiExec(body?.aiExecution);
  const only: string[] = _.map(_.castArray(body?.chapterIds || []), _.toString);
  const existing: MotionBeat[] = _.castArray(body?.beats || []);
  const speechRate = body?.durationRepair && Number(body?.speechRate) > 0 ? Number(body.speechRate) : motionSpeechRate(body?.voiceChannel, language);
  const voiceScript = (script: MotionStoryScript): MotionStoryScript => withMotionVoiceMode({ ...script, voiceSettings: body?.voiceSettings }, body?.multiVoice ?? body?.voiceSettings?.multiVoice ?? true);
  const job = startInputJob(
    body,
    body?.keepBrowser === true,
    MotionStoryJobKind.SCRIPT,
    async (ctx) => {
      ctx.log(
        MOTION_STORY_CONFIG.SPEECH_RATE_LOG(
          speechRate,
          _.sumBy(analysis.chapters, (chapter) => chapter.targetSeconds || 0),
        ),
      );
      const chapters = analysis.chapters;
      const carried = body?.carryGen ? ({ ...emptyGen(), ...body.carryGen } as MotionStoryScript["gen"]) : undefined;
      const keepGen = ((body?.resume === true || !_.isEmpty(only)) && (body?.gen as MotionStoryScript["gen"])) || carried;
      const byChapter: Record<string, MotionBeat[]> = _.groupBy(existing, MOTION_TEXT_CHAPTERID);
      const chapterDrafts: NonNullable<MotionStoryScript["chapterDrafts"]> = structuredClone(body?.chapterDrafts || {});
      const durationRepairStates: NonNullable<MotionStoryScript["durationRepairStates"]> = structuredClone(body?.durationRepairStates || {});
      const checkpoint = () => ctx.partial(voiceScript({ title: analysis.title, visualSettings, language, beats: _.flatMap(chapters, (c) => byChapter[c.id] || []), gen: keepGen, voiceChannel: body?.voiceChannel, chapterDrafts, durationRepairStates }));
      const todo = _.filter(chapters, (c) => (_.isEmpty(only) || _.includes(only, c.id)) && (body?.resume !== true || !!chapterDrafts[c.id] || !byChapter[c.id]?.some((beat) => beat.narration?.trim())));
      let done = 0;
      const failed: MotionChapter[] = [];
      const writeOne = async (chapter: MotionChapter) => {
        if (ctx.signal.aborted) throw new Error(MOTION_TEXT_CANCELLED);
        const idx = _.findIndex(chapters, { id: chapter.id });
        ctx.progress(done / todo.length, chapter.id);
        ctx.log(MOTION_TEMPLATE_VIET_LOI_DAN_PHAN_CANH_CHUONG(String(idx + 1), String(chapters.length), String(chapter.title)));
        const prevChapter = idx > 0 ? chapters[idx - 1] : undefined;
        const previous = prevChapter ? byChapter[prevChapter.id] : undefined;
        try {
          byChapter[chapter.id] = await writeChapterBeats(source, analysis, chapter, {
            language,
            exec,
            signal: ctx.signal,
            log: ctx.log,
            previous,
            previousSummary: prevChapter?.summary,
            isFirst: idx === 0,
            isLast: idx === chapters.length - 1,
            speechRate,
            draft: chapterDrafts[chapter.id],
            durationRepair: body?.durationRepair === true,
            durationRepairScope: body?.durationRepairScope,
            repairState: body?.durationRepair === true ? durationRepairStates[chapter.id] : undefined,
            existing: byChapter[chapter.id],
            onDraft: (draft) => {
              chapterDrafts[chapter.id] = draft;
              if (body?.durationRepair === true && draft.repairState) durationRepairStates[chapter.id] = structuredClone(draft.repairState);
              checkpoint();
            },
          });
          delete chapterDrafts[chapter.id];
        } catch (error) {
          if (isTerminalMotionAiError(error, ctx.signal) || MOTION_PRODUCTION.SERVICE_ERROR_RE.test(String((error as Error)?.message))) throw error;
          failed.push(chapter);
          ctx.log(MOTION_CHAPTER_REPAIR.FAILED(chapter.id, _.toString((error as Error)?.message || error)));
          return;
        }
        done++;
        ctx.progress(done / todo.length, chapter.id);
        ctx.log(MOTION_TEMPLATE_BEAT(String(byChapter[chapter.id].length)));
        checkpoint();
      };
      await mapMotionAiPool(todo, writeOne);
      if (failed.length) ctx.log(MR.MOTION_TEMPLATE_CON_CHUONG_CHUA_VIET_DUOC_CAC_CHUONG_KHAC_VAN_DUOC_GIU_BAM_VIET_T(failed.length, _.map(failed, MR.MOTION_TEXT_TITLE).join(MR.MOTION_TEXT_SYMBOL_14)));
      let beats = _.flatMap(chapters, (c) => byChapter[c.id] || []);
      let edit: MotionStoryScript["edit"];
      const complete = !failed.length && !Object.keys(chapterDrafts).length && _.every(chapters, (c) => byChapter[c.id]?.length);
      const editorial = complete && body?.editorPass !== false && !(only?.length && body?.resume !== true) && chapters.length > 1;
      if (editorial) {
        ctx.log(MR.MOTION_TEXT_BIEN_TAP_VIEN_DOC_LAI_TOAN_BO_LOI_DAN);
        try {
          const r = await editScript(source, analysis, beats, { language, exec, signal: ctx.signal, log: ctx.log, scope: body.productionId || body.editorialSessionId });
          beats = r.beats;
          edit = r.edit;
        } catch (error) {
          if (isTerminalMotionAiError(error, ctx.signal)) throw error;
          ctx.log(MR.MOTION_TEMPLATE_BO_QUA_BUOC_BIEN_TAP(_.truncate(_.toString((error as Error)?.message || error), { length: 120 })));
        }
      }
      const script = voiceScript({ title: analysis.title, visualSettings, language, beats, gen: keepGen, voiceChannel: body?.voiceChannel, chapterDrafts, durationRepairStates, ...(edit ? { edit } : {}) });
      ctx.partial(script);
      assertMotionScriptComplete(script, analysis);
      return script;
    },
    editorialSession(body, source, exec),
  );
  return { success: true, job };
};
export const seoMotionStoryInput = (body: Record<string, any>) => {
  const analysis = body?.analysis as MotionStoryAnalysis;
  const script = body?.script as MotionStoryScript;
  if (!analysis?.chapters?.length || !script?.beats?.length) throw new Error(MOTION_TEXT_CAN_VIET_LOI_DAN_PHAN_CANH_TRUOC);
  assertMotionScriptComplete(script, analysis);
  const language = storyLanguage(body?.language);
  const exec = aiExec(body?.aiExecution);
  const durations = _.isArray(body?.durations) && body.durations.length === script.beats.length ? _.map(body.durations, _.toNumber) : undefined;
  const source = body?.source as Pick<MotionStorySource, "title"> | undefined;
  const job = startInputJob(
    body,
    body?.keepBrowser === true,
    MotionStoryJobKind.SEO,
    (ctx) => {
      const recovery = motionTaskCheckpoint<MotionSeoDraft>(body.productionId || body.editorialSessionId, MotionStoryJobKind.SEO, [analysis, seoScriptKey(script), language, exec, source]);
      return generateMotionSeo(analysis, script, { language, exec, source, durations, signal: ctx.signal, log: ctx.log, draft: recovery.read(), onDraft: recovery.save });
    },
    editorialSession(body, body?.source, exec),
  );
  return { success: true, job };
};
export const scenesMotionStoryInput = (body: Record<string, any>) => {
  assertMotionProductionMode(body);
  const behavior = motionRenderBehaviorFor(body);
  const visualSettings = motionVisualSettingsFor(body);
  const raw = body?.analysis as MotionStoryAnalysis;
  const analysis = (raw ? { ...raw, visualSettings, stylePreset: visualSettings.mode === RT_SHARED.LIBRARY ? visualSettings.packId : undefined } : raw) as MotionStoryAnalysis;
  const script = body?.script as MotionStoryScript;
  if (!analysis?.places || !script?.beats?.length) throw new Error(MOTION_TEXT_CAN_VIET_LOI_DAN_PHAN_CANH_TRUOC);
  assertMotionScriptComplete(script, analysis);
  const exec = drawExec(body?.aiExecution);
  const mainExec = { ...aiExec(body?.mainAiExecution || body?.aiExecution), role: MOTION_AI_ROLE.MAIN };
  const styleReferences = normalizeMotionReferences(body?.styleReferences);
  const onlyBeats: string[] = _.map(_.castArray(body?.beats || []), _.toString);
  const onlyLocations: string[] = _.map(_.castArray(body?.locations || []), _.toString);
  const note = _.truncate(_.toString(body?.note || MR.MOTION_TEXT_EMPTY), { length: 400 });
  if (visualSettings.mode === RT_SHARED.REMOTION) {
    const job = startInputJob(
      body,
      body?.keepBrowser === true,
      MotionStoryJobKind.SCENES,
      (ctx) =>
        buildRemotionScenes({ ...script, visualSettings }, analysis, {
          exec,
          mainExec,
          signal: ctx.signal,
          log: ctx.log,
          progress: ctx.progress,
          partial: ctx.partial,
          scope: body.productionId || body.editorialSessionId,
          aspect: body.aspect,
          renderBehavior: motionRenderBehaviorFor(body),
          sfx: body.sfx !== false,
          review: body.review !== false,
          restart: body.restart === true,
          onlyBeats,
          onlyScenes: _.map(_.castArray(body?.scenes || []), _.toString),
          onlyLocations,
          note: note || undefined,
        }),
      (() => {
        const session = editorialSession(body, body.source, mainExec);
        return session ? { ...session, worker: true } : undefined;
      })(),
    );
    return { success: true, job };
  }
  if (body?.restart) delete script.gen;
  const job = startInputJob(
    body,
    body?.keepBrowser === true,
    MotionStoryJobKind.SCENES,
    async (ctx) => {
      const autoVoice = body?.autoVoice !== false;
      ctx.progress(0, MOTION_STORY_CONFIG.SCENES_PREPARING);
      const audioAbort = new AbortController();
      const cancelAudio = () => audioAbort.abort(ctx.signal.reason);
      ctx.signal.addEventListener(RT_SHARED.ABORT, cancelAudio, { once: true });
      if (ctx.signal.aborted) cancelAudio();
      const voiceOpts = { exec: mainExec, session: editorialSession(body, body.source, mainExec), scope: body.productionId || body.editorialSessionId, asr: body?.asrCheck === true, aspect: _.toString(body?.aspect || MOTION_TEXT_16_9), signal: audioAbort.signal, log: ctx.log, onProgress: (done: number, total: number) => done === total && ctx.log(MOTION_VOICE.MIXING) };
      let planJob: Promise<Awaited<ReturnType<typeof directMotionVoice>> | undefined> = Promise.resolve(undefined);
      let voiceJob: Promise<Awaited<ReturnType<typeof buildMotionVoiceTrack>> | undefined> = Promise.resolve(undefined);
      const prepareAudio = async (readyScript: MotionStoryScript) => {
        planJob = autoVoice ? listMotionVoiceSources(audioAbort.signal, ctx.log).then((sources) => directMotionVoice(readyScript, analysis, sources, voiceOpts)) : Promise.resolve(undefined);
        voiceJob = planJob.then((plan) => (plan ? buildMotionVoiceTrack({ ...readyScript, gen: { ...(readyScript.gen || emptyGen()), voiceCast: motionVoiceCast(readyScript.gen?.voiceCast, plan.roles) } }, analysis, voiceOpts) : undefined));
        voiceJob.catch(_.noop);
        return planJob.then((plan) => plan?.direction).catch(() => undefined);
      };
      try {
        const result = await buildScenesPuppet(script, analysis, {
          prepareAudio,
          resolveVoice: () => voiceJob,
          exec,
          mainExec,
          signal: ctx.signal,
          log: ctx.log,
          progress: (value, stage) => ctx.progress(value * (autoVoice ? 0.9 : 0.99), stage === MR.MOTION_TEXT_DONE ? MOTION_STORY_CONFIG.SCENES_COMPLETED : stage),
          partial: (r) => r && ctx.partial(r),
          aspect: _.toString(body?.aspect || MOTION_TEXT_16_9),
          onlyBeats,
          onlyLocations,
          styleReferences,
          characterMotion: behavior.actors === RT_SHARED.SIMPLE,
          note: note || undefined,
          review: body?.review !== false,
          sfx: body?.sfx !== false,
          previews: body?.previews !== false,
          readiness: body?.illustration,
        });
        if (result.gen) result.gen.renderBehavior = behavior;
        const plan = await planJob;
        if (plan && result.gen) result.gen.voiceCast = motionVoiceCast(result.gen.voiceCast, plan.roles);
        if (autoVoice && !result.gen?.failed?.length) {
          ctx.progress(0.92, MOTION_VOICE.GENERATING);
          result.voiceTrack = await voiceJob;
          ctx.partial(result);
        }
        return result;
      } finally {
        audioAbort.abort();
        ctx.signal.removeEventListener(RT_SHARED.ABORT, cancelAudio);
      }
    },
    (() => {
      const session = editorialSession(body, body.source, mainExec);
      return session ? { ...session, worker: true } : undefined;
    })(),
  );
  return { success: true, job };
};
export const voiceMotionStoryInput = (body: Record<string, any>) => {
  const script = body?.script as MotionStoryScript;
  if (!script?.beats?.length) throw new Error(MOTION_VOICE.EMPTY);
  const analysis = (body?.analysis as MotionStoryAnalysis) || null;
  assertMotionScriptComplete(script, analysis);
  const exec = { ...aiExec(body?.mainAiExecution || body?.aiExecution), role: MOTION_AI_ROLE.MAIN };
  const job = startInputJob(body, body?.keepBrowser === true, MotionStoryJobKind.VOICE, async (ctx) => {
    const track = await buildMotionVoiceTrack(script, analysis, {
      exec,
      session: editorialSession(body, body.source, exec),
      scope: body.productionId || body.editorialSessionId,
      asr: body?.asrCheck === true,
      aspect: _.toString(body?.aspect || MOTION_TEXT_16_9),
      signal: ctx.signal,
      log: ctx.log,
      onProgress: (done, total) => ctx.progress((0.98 * done) / Math.max(1, total), done === total ? MOTION_VOICE.MIXING : MOTION_VOICE.PROGRESS(done, total)),
    });
    ctx.log(MOTION_TEMPLATE_GIONG_DOC_GIAY(String(Math.round(track.totalSeconds))));
    const feedback = recordVoiceSpeedFeedback(
      _.sumBy(track.clips || [], (clip) => speechUnits(clip.text)),
      track.totalSeconds,
      voicesUseAutoSpeed(_.uniq(_.map(track.clips || [], (clip) => clip.voiceId))),
    );
    if (feedback) ctx.log(feedback);
    return track;
  });
  return { success: true, job };
};
export const compileMotionStoryInput = async (body: Record<string, any>) => {
  const behavior = motionRenderBehaviorFor(body);
  const script = body?.script as MotionStoryScript;
  if (!script?.beats?.length) throw new Error(MOTION_TEXT_CHUA_CO_KICH_BAN);
  const analysis = (body?.analysis as MotionStoryAnalysis) || null;
  const visualSettings = motionVisualSettingsFor(body);
  assertMotionScriptComplete(script, analysis);
  const aspect = _.includes([MOTION_TEXT_16_9, MOTION_TEXT_9_16, MOTION_TEXT_1_1, MOTION_TEXT_4_5], body?.aspect) ? body.aspect : MOTION_TEXT_16_9;
  const requestedVoice = body?.voiceTrack || script.voiceTrack;
  const voiceTrack = readMotionVoiceTrack(requestedVoice?.audioId, script, analysis);
  const voiceStale = !!requestedVoice?.audioId && !voiceTrack && (!body?.audioId || body.audioId === requestedVoice.audioId);
  let durations: number[] | undefined = voiceTrack?.durations || (!voiceStale && _.isArray(body?.durations) ? _.map(body.durations, _.toNumber) : undefined);
  const uploadedSeconds = _.toNumber(body?.uploadedAudioSeconds);
  if (!durations && uploadedSeconds > 0)
    durations = fitUploadedVoice(
      script.beats,
      _.map(script.beats, (b) => estimateBeatSeconds(b, script.language)),
      uploadedSeconds,
    );
  const directedScript = script.gen ? { ...script, gen: { ...script.gen, characterMotion: behavior.actors === RT_SHARED.SIMPLE, renderBehavior: behavior } } : script;
  const compiled = visualSettings.mode === RT_SHARED.REMOTION ? compileRemotionStory({ ...directedScript, visualSettings }, analysis ? { ...analysis, visualSettings } : null, { aspect, durations, fps: body.fps, voiceTrack, renderBehavior: behavior, subtitles: body.subtitles }) : compileStorySpec(directedScript, analysis, { aspect, durations, look: body?.look, accent: body?.accent, voiceTrack });
  compiled.spec = applyMotionRenderBehavior(compiled.spec, behavior);
  const duration = compiled.spec.duration || 1,
    voiceId = voiceTrack?.audioId || (!voiceStale && body?.audioId ? path.basename(String(body.audioId)) : undefined);
  let sound: Awaited<ReturnType<typeof buildMotionSoundTrack>> = { selections: [] },
    audioPreviewId: string | undefined;
  if (body?.sfx === true)
    try {
      sound = await buildMotionSoundTrack(duration, compiled.sfxCues, body?.soundOverrides);
    } catch {
      logger.warn(SOUND.UNAVAILABLE);
    }
  try {
    audioPreviewId = await mixMotionSoundAudio(duration, voiceId, sound.sfxId, body?.sfxVolume ?? 0.5);
  } catch {
    logger.warn(SOUND.SKIPPED);
    audioPreviewId = voiceId;
  }
  return { success: true, spec: compiled.spec, sfxCues: compiled.sfxCues, starts: compiled.starts, missing: compiled.missing, sfxId: sound.sfxId, audioPreviewId, soundSelections: sound.selections, voiceStale };
};
