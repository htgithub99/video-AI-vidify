import * as RT_MAINTENANCE from "../../../../constants/runtime/maintenance.js";
import { planMotionHtmlScenes, createMotionHtmlSceneStreamer } from "./html/scenePipeline.js";
import { motionHtmlPlanCurrent, usesMotionHtml } from "../../../../lib/motionHtmlScene.js";
import { runMotionScriptEditorial } from "../../../../lib/motionScriptEditorial.js";
import { MOTION_SCENE_PACING } from "../../../../constants/motionScenePacing.js";
import { motionHtmlChapterBudget } from "../../../../lib/motionHtmlAuthoring.js";
import { RUNTIME_TEXT as RT_SERVER } from "../../../../constants/runtime/server.js";
import { RUNTIME_TEXT as RT_SHARED } from "../../../../constants/runtime/shared.js";
import { stringifyJson } from "../../../../lib/jsonStringify.js";
import { assertMotionScriptComplete, assertMotionProductionMode, missingMotionChapters, motionEarlyHtmlSceneInput, mergeMotionRemotionState } from "../../../../lib/motionProduction.js";
import { MOTION_CHAPTER_REPAIR } from "../../../../constants/motionChapterRepair.js";
import { MOTION_PRODUCTION } from "../../../../constants/motionProduction.js";
import { motionVisualSettingsFor, isRemotionSpec } from "../../../../lib/motionVisual.js";
import { applyMotionRenderBehavior, motionRenderBehaviorFor } from "../../../../lib/motionRenderBehavior.js";
import { validateRemotionSpec, assertRemotionExportable, remotionStateMissingScenes } from "../../../../lib/motionRemotion.js";
import { MOTION_SCENE_COMPOSITION as C } from "../../../../constants/motionSceneComposition.js";
import type { MotionRenderSpec } from "../../../../types/motionVisual.js";
import { buildRemotionScenes } from "./remotion/scenePipeline.js";
import { compileRemotionStory } from "./remotion/storyCompiler.js";
import { motionEditorialContext } from "./motionEditorialContextService.js";
import { MOTION_SOUND_CONFIG as SOUND } from "../../../../constants/motionSound.js";
import { normalizeSoundCues } from "../../../../lib/motionSound.js";
import { buildMotionSoundTrack, mixMotionSoundAudio } from "./motionSoundMixService.js";
import { normalizeMotionReferences } from "../../../../lib/motionReference.js";
import * as MR from "../../../../constants/motionRuntime.js";
import { bindVideoDnaSettings, videoDnaErrors, videoDnaSourceKey } from "../../../../lib/motionVideoDna.js";
import { MOTION_VIDEO_GENRE_ERROR, motionGenreSpec, motionVideoGenre } from "../../../../constants/motionGenre.js";
import { motionBeatSheetCoverage } from "../../../../lib/motionBeatSheet.js";
import { MOTION_BEAT_SHEET } from "../../../../constants/motionBeatSheet.js";
import { motionChapterRanges, motionChapterKeyPoints } from "../../../../lib/motionStoryTimeline.js";
import { MOTION_STORY_TIMELINE } from "../../../../constants/motionStoryTimeline.js";
import { MOTION_MUSIC } from "../../../../constants/motionMusic.js";
import _ from "lodash";
import { motionSpeechRate, motionSpeechRateMeasured, speechUnits } from "./motionSpeechRateService.js";
import { motionLanguage, motionLanguageCode } from "../../../../lib/motionLanguage.js";
import { motionStorytelling, motionStorytellingExpansion, motionStorytellingSilent, motionStorytellingText } from "../../../../lib/motionStorytelling.js";
import { motionSourceCapacitySeconds } from "../../../../lib/motionStoryTimeline.js";
import { sourceSlice, mapMotionAiPool, prepareMotionContentRooms } from "./motionStoryService.js";
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
  MOTION_TEXT_KICH_BAN_DUNG_SPEC_CHUA_CO_CANH_NAO,
  MOTION_TEXT_QUA_NHIEU_CANH_TRONG_MOT_VIDEO,
} from "../../../../constants/motionRuntime.js";
import { MOTION_STORY_CONFIG } from "../../../../constants/motionVideo.js";
import { parseJson } from "../../../../lib/jsonStringify.js";
import { logger } from "../../../../lib/logger.js";
import { MotionEncoderPreference, MotionQuality, MotionStoryJobKind, MotionStoryLength, type MotionAiExecution, type MotionBeat, type MotionChapter, type MotionSpec, type MotionStoryAnalysis, type MotionStoryScript, type MotionStorySource } from "../../../../types/motionVideo.js";
import { buildMotionVoiceTrack, fitUploadedVoice, readMotionVoiceTrack } from "./motionAudioService.js";
import { withMotionVoiceMode } from "../../../../lib/motionVoice.js";
import { MOTION_VOICE, MOTION_VOICE_PATTERNS } from "../../../../constants/motionVoice.js";
import { createHash } from "crypto";
import { estimateBeatSeconds } from "./motionDirectorService.js";
import { emptyGen } from "./motionGenState.js";
import { MOTION_AI_ROLE } from "../../../../constants/motionAiFallback.js";
import { motionContentWorkerIds } from "../../../../lib/motionAiExecution.js";
import { startMotionRender } from "./motionRenderService.js";
import { startStoryJob, type StoryJobContext } from "./motionStoryJobService.js";
import { motionInputKey } from "./motionFileUtils.js";
import { analyzeStory, editScript, normalizeBeats, parseStorySource, writeChapterBeats, type MotionEditorialSession, type MotionAnalysisDraft } from "./motionStoryService.js";
import { isTerminalMotionAiError } from "../../../../server/services/chatSubmissionRecovery.js";
import { MOTION_EDITORIAL } from "../../../../constants/motionEditorial.js";
import { generateMotionSeo, seoScriptKey, type MotionSeoDraft } from "./motionSeoService.js";
import { motionTaskCheckpoint } from "./motionTaskCheckpoint.js";
import { resolveSourceInput, withFetchInfo } from "./motionSourceFetchService.js";
import { motionAnalysisSettingsMessage } from "../../../../lib/motionSettingsCompatibility.js";
import { cleanTranscriptInput } from "../../../../lib/motionSourceClean.js";
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
  if (isRemotionSpec(spec)) assertRemotionExportable(spec);
  const o = body?.options || {};
  const job = startMotionRender(spec, {
    quality: _.includes(_.values(MotionQuality), o.quality) ? o.quality : MotionQuality.STANDARD,
    aspect: _.toString(o.aspect || spec.aspect || MOTION_TEXT_16_9),
    fps: _.toNumber(o.fps) || undefined,
    encoder: _.includes(_.values(MotionEncoderPreference), o.encoder) ? o.encoder : MotionEncoderPreference.AUTO,
    title: _.truncate(_.toString(o.title || spec.title || MR.MOTION_TEXT_EMPTY), { length: 120 }),
    requireAudio: o.requireAudio === true,
    clearGeminiChatsBeforeExport: o.clearGeminiChatsBeforeExport === true,
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
export const storyLanguage = (v: unknown): string => motionLanguageCode(v);
export const storyLength = (v: unknown): MotionStoryLength => (_.includes(_.values(MotionStoryLength), v) ? (v as MotionStoryLength) : MotionStoryLength.FULL);
export const aiExec = (v: any): MotionAiExecution => ({
  provider: _.toString(v?.provider || MR.MOTION_TEXT_EMPTY),
  model: _.toString(v?.model || MR.MOTION_TEXT_EMPTY),
  mode: _.toString(v?.mode || MR.MOTION_TEXT_EMPTY),
  chromeHeadless: v?.chromeHeadless !== false,
  ...(typeof v?.allowFallback === "boolean" ? { allowFallback: v.allowFallback, ...(v.allowFallback === false ? { strictProvider: true } : {}) } : {}),
  ...(v?.strictProvider === true ? { strictProvider: true } : {}),
  ...(typeof v?.multiSceneRooms === "boolean" ? { multiSceneRooms: v.multiSceneRooms } : {}),
  ...(typeof v?.multiRoom === "boolean" ? { multiRoom: v.multiRoom } : {}),
  ...(v?.light?.provider ? { light: { provider: _.toString(v.light.provider), model: _.toString(v.light.model || MR.MOTION_TEXT_EMPTY), chromeHeadless: v.light.chromeHeadless !== false, allowFallback: v.light.allowFallback !== false, multiRoom: v.light.multiRoom === true } } : {}),
});
export const drawExec = (v: any): MotionAiExecution => ({ ...aiExec(v), role: MOTION_AI_ROLE.DRAW });
const editorialAiIdentity = ({ provider, model, mode, multiSceneRooms }: MotionAiExecution) => ({ provider, model, mode, ...(multiSceneRooms === false ? { multiSceneRooms: false } : {}) });
export const editorialSession = (body: any, source: MotionStorySource, exec: MotionAiExecution): MotionEditorialSession | undefined => {
  const id = _.toString(body?.editorialSessionId);
  if (!MOTION_EDITORIAL.ID_PATTERN.test(id) || !source?.segments) return undefined;
  const sceneExec = body?.sceneAiExecution ? aiExec(body.sceneAiExecution) : undefined;
  const revision = createHash(RT_SERVER.SHA256)
    .update(stringifyJson([videoDnaSourceKey(source), source.notes, storyLanguage(body?.language), editorialAiIdentity(exec), ...(sceneExec ? [editorialAiIdentity(sceneExec)] : [])]))
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
      const options = {
        language,
        length,
        parts: Math.max(1, Number(body?.parts) || 1),
        visualSettings,
        styleReferences: visualSettings.mode === RT_SHARED.REMOTION ? [] : styleReferences,
        videoGenre: motionVideoGenre(body?.videoGenre),
        stylePreset: undefined,
        characterMotion: body?.characterMotion === true,
        aspect: _.toString(body?.aspect || MR.MOTION_TEXT_16_9),
        exec,
        storytelling: motionStorytelling(body?.storytelling),
        renameEntities: body?.renameEntities === true,
      };
      const recovery = motionTaskCheckpoint<MotionAnalysisDraft>(body.productionId || body.editorialSessionId, MotionStoryJobKind.ANALYZE, [source, options]);
      const analysis = await analyzeStory(source, { ...options, signal: ctx.signal, log: ctx.log, draft: recovery.read(), onDraft: recovery.save });
      ctx.log(MOTION_TEMPLATE_AI_CHIA_CHUONG_NHAN_VAT_BOI_CANH_DIEM(String(analysis.chapters.length), String(analysis.cast.length), String(analysis.places.length), String(analysis.facts.length)));
      const chosenSeconds = _.sumBy(analysis.chapters, (chapter) => chapter.targetSeconds || 0);
      const expansion = motionStorytellingExpansion(analysis.storytelling, analysis.videoGenre);
      const capacity = motionSourceCapacitySeconds(
        analysis.chapters.map((chapter) => ({ text: sourceSlice(source, chapter.from, chapter.to), keyPoints: chapter.keyPoints?.length || 0, seconds: chapter.targetSeconds || 0 })),
        MOTION_STORY_CONFIG.TARGET_BEAT_SECONDS,
        1,
      );
      if (chosenSeconds > 0 && capacity > 0) ctx.log(motionStorytellingText(language).CAPACITY(Math.round(capacity / 60), Math.round(chosenSeconds / 60), Math.min(expansion, chosenSeconds / capacity), motionStorytellingText(language).OPTIONS[motionStorytelling(analysis.storytelling)]));
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
  if (analysis)
    analysis = {
      ...analysis,
      visualSettings,
      stylePreset: undefined,
      ...(analysis.authoringSettings && visualSettings.mode === RT_MAINTENANCE.REMOTION
        ? { authoringSettings: { ...analysis.authoringSettings, language: storyLanguage(body?.language), visualProfile: visualSettings.profileId, visualProportion: visualSettings.proportion, visualLayout: visualSettings.layout, picturePacing: visualSettings.pacing || analysis.authoringSettings.picturePacing, targetPictureSeconds: visualSettings.pacing ? MOTION_SCENE_PACING.SECONDS[visualSettings.pacing] : analysis.authoringSettings.targetPictureSeconds } }
        : {}),
    };
  if (!source?.segments?.length || !analysis?.chapters?.length) throw new Error(MOTION_TEXT_CAN_PHAN_TICH_CAU_CHUYEN_TRUOC);
  if (body?.videoGenre !== undefined && analysis.videoGenre !== motionVideoGenre(body.videoGenre)) throw new Error(MOTION_VIDEO_GENRE_ERROR.CHANGED);
  const settingsError = motionAnalysisSettingsMessage({ ...body, analysis });
  if (settingsError) throw new Error(settingsError);
  const rangedChapters = motionChapterRanges(analysis.chapters, source.sourceSeconds);
  const rangeFixes = rangedChapters.filter((chapter, index) => chapter.from !== analysis.chapters[index].from || chapter.to !== analysis.chapters[index].to).length;
  if (rangeFixes) analysis = { ...analysis, chapters: rangedChapters };
  const pointFix = motionChapterKeyPoints(analysis.chapters, source.sourceSeconds);
  if (pointFix.moved || pointFix.invented) analysis = { ...analysis, chapters: pointFix.chapters };
  const language = storyLanguage(body?.language);
  if (analysis.videoDna) {
    const errors = videoDnaErrors(analysis.videoDna);
    if (errors.length) throw new Error(MR.MOTION_TEMPLATE_INVALID_VIDEO_DNA(errors.slice(0, 5).join(MR.MOTION_TEXT_SYMBOL_41)));
    if (analysis.videoDna.sourceKey !== videoDnaSourceKey(source)) throw new Error(MR.MOTION_TEXT_INPUT_CHANGED_ANALYZE_VIDEO_DNA_AGAIN_BEFORE_WRITING_SCENES);
    if (body?.length && analysis.videoDna.settings.length !== storyLength(body.length)) throw new Error(MR.MOTION_TEXT_VIDEO_LENGTH_CHANGED_ANALYZE_VIDEO_DNA_AGAIN);
    analysis = bindVideoDnaSettings(analysis, { language: motionLanguageCode(language), aspect: _.toString(body?.aspect || analysis.videoDna.settings.aspect), drawingMode: MR.MOTION_TEXT_2D, characterMode: MR.MOTION_TEXT_DRAWN });
  }
  const exec = aiExec(body?.aiExecution);
  const sceneExec = drawExec(body?.sceneAiExecution || body?.aiExecution);
  const planExec = body?.planAiExecution ? { ...aiExec(body.planAiExecution), role: MOTION_AI_ROLE.PLAN } : undefined;
  const scriptExec: MotionAiExecution = body?.scriptAiExecution ? { ...aiExec(body.scriptAiExecution), role: MOTION_AI_ROLE.SCRIPT } : exec;
  const only: string[] = _.map(_.castArray(body?.chapterIds || []), _.toString);
  const existing: MotionBeat[] = _.castArray(body?.beats || []);
  const speechRate = body?.durationRepair && Number(body?.speechRate) > 0 ? Number(body.speechRate) : motionSpeechRate(body?.voiceChannel, language);
  const speechRateMeasured = (body?.durationRepair && Number(body?.speechRate) > 0) || motionSpeechRateMeasured(body?.voiceChannel, language);
  const multiVoice = body?.multiVoice ?? body?.voiceSettings?.multiVoice ?? true;
  const voiceScript = (script: MotionStoryScript): MotionStoryScript => withMotionVoiceMode({ ...script, voiceSettings: body?.voiceSettings }, multiVoice);
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
      if (rangeFixes) ctx.log(MOTION_STORY_TIMELINE.RANGE.LOG(rangeFixes));
      if (pointFix.moved || pointFix.invented) ctx.log(MOTION_STORY_TIMELINE.KEYPOINT.LOG(pointFix.moved, pointFix.invented));
      const chapters = analysis.chapters;
      const carried = body?.carryGen ? ({ ...emptyGen(), ...body.carryGen } as MotionStoryScript["gen"]) : undefined;
      let keepGen = ((body?.resume === true || !_.isEmpty(only)) && (body?.gen as MotionStoryScript["gen"])) || carried;
      const byChapter: Record<string, MotionBeat[]> = _.groupBy(existing, MOTION_TEXT_CHAPTERID);
      const chapterDrafts: NonNullable<MotionStoryScript["chapterDrafts"]> = structuredClone(body?.chapterDrafts || {});
      const durationRepairStates: NonNullable<MotionStoryScript["durationRepairStates"]> = structuredClone(body?.durationRepairStates || {});
      const settled = new Set<string>();
      const checkpoint = () => ctx.partial(voiceScript({ title: analysis.title, visualSettings, language, beats: _.flatMap(chapters, (c) => byChapter[c.id] || []), gen: keepGen, voiceChannel: body?.voiceChannel, chapterDrafts, durationRepairStates, readyChapterIds: [...settled] }));
      const todo = _.filter(chapters, (c) => (_.isEmpty(only) || _.includes(only, c.id)) && (body?.resume !== true || !!chapterDrafts[c.id] || !byChapter[c.id]?.some((beat) => beat.narration?.trim())));
      for (const chapter of chapters) {
        if (!todo.some((item) => item.id === chapter.id) && !chapterDrafts[chapter.id] && byChapter[chapter.id]?.some((beat) => beat.narration?.trim())) {
          settled.add(chapter.id);
        }
      }
      const editPass = (body?.editorPass !== false || body?.durationRepair === true) && (todo.length > 0 || body?.durationRepair === true || !body?.edit);
      const streamBeats = (): MotionBeat[] => _.flatMap(chapters, (c) => (!editPass || settled.has(c.id) ? byChapter[c.id] || [] : []));
      const scope = body.productionId || body.editorialSessionId;
      const planScenes = body?.planScenes !== false;
      const canStreamHtmlScenes = planScenes && visualSettings.mode === RT_MAINTENANCE.REMOTION && !(globalThis as any).__motionHtmlStages && body?.durationRepair !== true && todo.length > 0;
      const htmlStreamer = canStreamHtmlScenes ? createMotionHtmlSceneStreamer(analysis, visualSettings, language, keepGen?.remotion, { exec: sceneExec.provider ? sceneExec : exec, mainExec: exec, planExec, scope, signal: ctx.signal, log: ctx.log, aspect: body.aspect, sfx: body.sfx !== false, renderBehavior: motionRenderBehaviorFor(body) }) : undefined;
      const streamSettled = (): void =>
        htmlStreamer?.push(streamBeats(), chapterDrafts, false, (remotion) => {
          keepGen = { ...(keepGen || emptyGen()), remotion };
          checkpoint();
        });
      if (htmlStreamer) {
        keepGen = { ...(keepGen || emptyGen()), remotion: htmlStreamer.getState() };
        void prepareMotionContentRooms(scriptExec, ctx.signal, ctx.log).catch(_.noop);
        if (existing.length > 0) streamSettled();
      }
      let done = 0;
      const failed: MotionChapter[] = [];
      const pipelined = !analysis.authoringSettings && body?.editorPass !== false && body?.durationRepair !== true && todo.length === chapters.length && chapters.length > 1;
      const editScope = body.productionId || body.editorialSessionId || ctx.signal.toString();
      const chapterEdits = new Map<string, Promise<MotionStoryScript["edit"] | undefined>>();
      const logChapterScore = (chapter: MotionChapter, stage = "") => {
        if (analysis.authoringSettings) return;
        const silent = motionStorytellingSilent(analysis.storytelling);
        const wantedUnits = Math.round(Math.max(15, (chapter.targetSeconds || 0) - (silent ? silent.chapterCard + silent.chapterEnd : 0)) * speechRate * (speechRateMeasured ? MOTION_STORY_CONFIG.LENGTH_SAFETY_MEASURED : MOTION_STORY_CONFIG.LENGTH_SAFETY));
        const coverage = motionBeatSheetCoverage(byChapter[chapter.id] || [], chapter);
        const own = byChapter[chapter.id] || [];
        const viewer = motionGenreSpec(analysis.videoGenre).VOICE.detached ? Math.round((100 * own.filter((beat: MotionBeat) => motionLanguage(language).markers.viewer.test(beat.narration)).length) / Math.max(1, own.length)) : undefined;
        ctx.log(MOTION_BEAT_SHEET.QUALITY_LOG(chapter.id, wantedUnits > 0 ? Math.round((100 * _.sumBy(own, (beat: MotionBeat) => speechUnits(beat.narration))) / wantedUnits) : 0, viewer, coverage.covered, coverage.events, coverage.texture, stage));
      };
      const editChapter = (chapter: MotionChapter, idx: number): Promise<MotionStoryScript["edit"] | undefined> =>
        runMotionScriptEditorial(
          _.flatMap(chapters.slice(0, idx + 1), (item: MotionChapter) => byChapter[item.id] || []),
          analysis,
          language,
          source.text,
          (current, focusIds, supplemental) => editScript(source, analysis, current, { language, speechRate, exec: scriptExec, signal: ctx.signal, log: ctx.log, scope: editScope + MOTION_STORY_CONFIG.EDIT_SCOPE(chapter.id) + (supplemental ? MOTION_STORY_CONFIG.EDIT_SUPPLEMENTAL : ""), focusIds, supplemental }),
          ctx.log,
          new Set([chapter.id]),
        )
          .then((result) => {
            byChapter[chapter.id] = result.beats.filter((beat) => beat.chapterId === chapter.id);
            settled.add(chapter.id);
            streamSettled();
            checkpoint();
            logChapterScore(chapter, MOTION_BEAT_SHEET.AFTER_EDIT);
            return result.edit;
          })
          .catch((error) => {
            if (isTerminalMotionAiError(error, ctx.signal)) throw error;
            ctx.log(MR.MOTION_TEMPLATE_BO_QUA_BUOC_BIEN_TAP(_.truncate(_.toString((error as Error)?.message || error), { length: 120 })));
            settled.add(chapter.id);
            streamSettled();
            checkpoint();
            return undefined;
          });
      const writeOne = async (chapter: MotionChapter) => {
        if (ctx.signal.aborted) throw new Error(MOTION_TEXT_CANCELLED);
        const idx = _.findIndex(chapters, { id: chapter.id });
        ctx.progress(done / todo.length, chapter.id);
        ctx.log(MOTION_TEMPLATE_VIET_LOI_DAN_PHAN_CANH_CHUONG(String(idx + 1), String(chapters.length), String(chapter.title)));
        const prevChapter = idx > 0 ? chapters[idx - 1] : undefined;
        const previous = prevChapter ? byChapter[prevChapter.id] : undefined;
        const history = _.flatMap(chapters.slice(0, idx), (item) => byChapter[item.id] || []);
        try {
          byChapter[chapter.id] = await writeChapterBeats(source, analysis, chapter, {
            language,
            multiVoice,
            exec: scriptExec,
            signal: ctx.signal,
            log: ctx.log,
            previous,
            history,
            previousSummary: prevChapter?.summary,
            isFirst: idx === 0,
            isLast: idx === chapters.length - 1,
            speechRate,
            speechRateMeasured,
            draft: chapterDrafts[chapter.id],
            durationRepair: body?.durationRepair === true,
            durationRepairScope: body?.durationRepairScope,
            repairState: body?.durationRepair === true ? durationRepairStates[chapter.id] : undefined,
            existing: byChapter[chapter.id],
            onDraft: (draft) => {
              chapterDrafts[chapter.id] = draft;
              if (body?.durationRepair === true && draft.repairState) durationRepairStates[chapter.id] = structuredClone(draft.repairState);
              if (analysis.authoringSettings && Array.isArray(draft.rows) && draft.rows.length > 0) {
                byChapter[chapter.id] = normalizeBeats(draft.rows, chapter.id, analysis);
              }
              streamSettled();
              checkpoint();
            },
          });
          delete chapterDrafts[chapter.id];
          if (!editPass) settled.add(chapter.id);
          if (htmlStreamer) {
            streamSettled();
            void htmlStreamer
              .waitForChapter(chapter.id)
              .then(() => checkpoint())
              .catch(_.noop);
          }
        } catch (error) {
          if (isTerminalMotionAiError(error, ctx.signal) || MOTION_PRODUCTION.SERVICE_ERROR_RE.test(String((error as Error)?.message))) throw error;
          failed.push(chapter);
          ctx.log(MOTION_CHAPTER_REPAIR.FAILED(chapter.id, _.toString((error as Error)?.message || error)));
          return;
        }
        done++;
        ctx.progress(done / todo.length, chapter.id);
        ctx.log(MOTION_TEMPLATE_BEAT(String(byChapter[chapter.id].length)));
        const silent = motionStorytellingSilent(analysis.storytelling);
        const wantedUnits = analysis.authoringSettings ? motionHtmlChapterBudget(analysis, chapter, speechRate, idx === 0, idx === chapters.length - 1).units : Math.round(Math.max(15, (chapter.targetSeconds || 0) - (silent ? silent.chapterCard + silent.chapterEnd : 0)) * speechRate * (speechRateMeasured ? MOTION_STORY_CONFIG.LENGTH_SAFETY_MEASURED : MOTION_STORY_CONFIG.LENGTH_SAFETY));
        if (wantedUnits > 0)
          ctx.log(
            motionStorytellingText(language).CHAPTER(
              chapter.id,
              _.sumBy(byChapter[chapter.id], (beat) => speechUnits(beat.narration)),
              wantedUnits,
            ),
          );
        logChapterScore(chapter);
        checkpoint();
        if (pipelined && idx < chapters.length - 1) {
          const editTask = editChapter(chapter, idx);
          editTask.catch(_.noop);
          chapterEdits.set(chapter.id, editTask);
        }
      };
      if (analysis.authoringSettings && todo.length > 1 && !(globalThis as any).__motionHtmlStages) {
        for (const chapter of todo) {
          if (!byChapter[chapter.id]?.length) {
            chapterDrafts[chapter.id] ||= { inputKey: "", rows: [], pending: [{ id: RT_MAINTENANCE.VALUE_0_2, fields: [RT_MAINTENANCE.NARRATION] as any }] };
          }
        }
        void prepareMotionContentRooms(scriptExec, ctx.signal, ctx.log).catch(_.noop);
        await mapMotionAiPool(todo, async (chapter) => writeOne(chapter), motionContentWorkerIds(scriptExec).length);
      } else {
        for (const chapter of todo) await writeOne(chapter);
      }
      if (failed.length) ctx.log(MR.MOTION_TEMPLATE_CON_CHUONG_CHUA_VIET_DUOC_CAC_CHUONG_KHAC_VAN_DUOC_GIU_BAM_VIET_T(failed.length, _.map(failed, MR.MOTION_TEXT_TITLE).join(MR.MOTION_TEXT_SYMBOL_14)));
      const chapterReports = (await Promise.all([...chapterEdits.values()])).filter((part): part is NonNullable<MotionStoryScript["edit"]> => !!part);
      let beats = _.flatMap(chapters, (c) => byChapter[c.id] || []);
      let edit: MotionStoryScript["edit"];
      const complete = !failed.length && !Object.keys(chapterDrafts).length && _.every(chapters, (c) => byChapter[c.id]?.length);
      if (complete && (todo.length > 0 || body?.durationRepair === true || !body?.edit) && (body?.editorPass !== false || body?.durationRepair === true)) {
        try {
          const result = await runMotionScriptEditorial(
            beats,
            analysis,
            language,
            source.text,
            (current, focusIds, supplemental) => editScript(source, analysis, current, { language, speechRate, exec: scriptExec, signal: ctx.signal, log: ctx.log, scope: editScope + (supplemental ? MOTION_STORY_CONFIG.EDIT_SUPPLEMENTAL : ""), focusIds, supplemental }),
            ctx.log,
            pipelined ? new Set(chapters.filter((chapter: MotionChapter) => !chapterEdits.has(chapter.id)).map((chapter: MotionChapter) => chapter.id)) : undefined,
          );
          beats = result.beats;
          for (const chapter of chapters) byChapter[chapter.id] = beats.filter((beat) => beat.chapterId === chapter.id);
          edit = chapterReports.reduce<NonNullable<MotionStoryScript["edit"]>>(
            (sum, part) => ({ ...sum, reviewed: sum.reviewed + part.reviewed, rewritten: sum.rewritten + part.rewritten, notes: [...part.notes, ...sum.notes], requests: (sum.requests || 0) + (part.requests || 0), extraRequests: (sum.extraRequests || 0) + (part.extraRequests || 0), dropped: (sum.dropped || 0) + (part.dropped || 0) }),
            result.edit,
          );
        } catch (error) {
          if (isTerminalMotionAiError(error, ctx.signal)) throw error;
          ctx.log(MR.MOTION_TEMPLATE_BO_QUA_BUOC_BIEN_TAP(_.truncate(_.toString((error as Error)?.message || error), { length: 120 })));
        }
      }
      if (complete) for (const chapter of chapters) settled.add(chapter.id);
      const script = voiceScript({ title: analysis.title, visualSettings, language, beats, gen: keepGen, voiceChannel: body?.voiceChannel, chapterDrafts, durationRepairStates, ...(edit ? { edit } : {}) });
      const chosenTotal = _.sumBy(analysis.chapters, (chapter) => chapter.targetSeconds || 0);
      const silentTotal = (() => {
        if (analysis.authoringSettings) return analysis.chapters.reduce((sum, chapter, index) => sum + motionHtmlChapterBudget(analysis, chapter, speechRate, index === 0, index === analysis.chapters.length - 1).pause, 0);
        const silent = motionStorytellingSilent(analysis.storytelling);
        return silent ? analysis.chapters.length * (silent.chapterCard + silent.chapterEnd) + silent.videoEnd : 0;
      })();
      if (analysis.authoringSettings) script.authoringTiming = { plannedDurationSeconds: chosenTotal, estimatedSpeechSeconds: _.sumBy(beats, (beat) => speechUnits(beat.narration)) / speechRate, plannedPauseSeconds: silentTotal, speechRate, speechRateSource: speechRateMeasured ? RT_MAINTENANCE.MEASURED : RT_MAINTENANCE.LANGUAGE_DEFAULT };
      if (complete && chosenTotal > 0) ctx.log(motionStorytellingText(language).ESTIMATE(_.sumBy(beats, (beat) => speechUnits(beat.narration)) / speechRate + silentTotal, chosenTotal));
      ctx.partial(script);
      assertMotionScriptComplete(script, analysis);
      if (planScenes && visualSettings.mode === RT_MAINTENANCE.REMOTION && usesMotionHtml(script)) {
        const planned = htmlStreamer
          ? await htmlStreamer.finish(
              script,
              (draft) => ctx.partial(draft),
              (value, stage) => ctx.progress(0.8 + value * 0.19, stage),
            )
          : await planMotionHtmlScenes(script, analysis, { exec: sceneExec.provider ? sceneExec : exec, mainExec: exec, planExec, scope, signal: ctx.signal, log: ctx.log, partial: (draft) => ctx.partial(draft), progress: (value, stage) => ctx.progress(0.8 + value * 0.19, stage), aspect: body.aspect, sfx: body.sfx !== false });
        ctx.log(RT_MAINTENANCE.HOAN_TAT_CHIA_PHAN_CANH_VA_PROMPT_0_4_TRUOC);
        ctx.partial(planned);
        return planned;
      }
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
    (() => {
      const session = editorialSession(body, body?.source, exec);
      return session ? { ...session, worker: true } : undefined;
    })(),
  );
  return { success: true, job };
};
export const scenesMotionStoryInput = (body: Record<string, any>) => {
  assertMotionProductionMode(body);
  const visualSettings = motionVisualSettingsFor(body);
  const raw = body?.analysis as MotionStoryAnalysis;
  const analysis = (raw ? { ...raw, visualSettings, stylePreset: undefined } : raw) as MotionStoryAnalysis;
  const fullScript = body?.script as MotionStoryScript;
  if (!analysis?.places || !fullScript?.beats?.length) throw new Error(MOTION_TEXT_CAN_VIET_LOI_DAN_PHAN_CANH_TRUOC);
  const missingChapters = missingMotionChapters(fullScript, analysis);
  const ready = missingChapters.length ? motionEarlyHtmlSceneInput(fullScript, analysis) : undefined;
  const script = ready ? ready.script : fullScript;
  assertMotionScriptComplete(script, ready ? ready.analysis : analysis);
  const withFull = (built: MotionStoryScript): MotionStoryScript => (ready ? { ...fullScript, gen: { ...(fullScript.gen || built.gen), ...built.gen, remotion: mergeMotionRemotionState(built.gen?.remotion, fullScript.gen?.remotion) } } : built);
  const exec = drawExec(body?.aiExecution);
  const mainExec = { ...aiExec(body?.mainAiExecution || body?.aiExecution), role: MOTION_AI_ROLE.MAIN };
  const planExec = body?.planAiExecution ? { ...aiExec(body.planAiExecution), role: MOTION_AI_ROLE.PLAN } : undefined;
  const onlyBeats: string[] = _.map(_.castArray(body?.beats || []), _.toString);
  const onlyLocations: string[] = _.map(_.castArray(body?.locations || []), _.toString);
  const note = _.truncate(_.toString(body?.note || MR.MOTION_TEXT_EMPTY), { length: 400 });
  const job = startInputJob(
    body,
    body?.keepBrowser === true,
    MotionStoryJobKind.SCENES,
    async (ctx) => {
      if (ready) ctx.log(MOTION_PRODUCTION.PARTIAL_SCENES(ready.ready, ready.total, missingChapters.map((chapter) => chapter.title || chapter.id).join(MOTION_PRODUCTION.SEPARATOR)));
      const scopedAnalysis = ready ? ready.analysis : analysis;
      let target: MotionStoryScript = { ...script, visualSettings };
      if (usesMotionHtml(target) && !motionHtmlPlanCurrent(target, scopedAnalysis))
        target = await planMotionHtmlScenes(target, scopedAnalysis, { exec, mainExec, planExec, scope: body.productionId || body.editorialSessionId, signal: ctx.signal, log: ctx.log, partial: (draft: MotionStoryScript) => ctx.partial(withFull(draft)), aspect: body.aspect, sfx: body.sfx !== false, renderBehavior: motionRenderBehaviorFor(body) });
      const result = await buildRemotionScenes(target, scopedAnalysis, {
        exec,
        mainExec,
        signal: ctx.signal,
        log: ctx.log,
        progress: ctx.progress,
        partial: (draft: MotionStoryScript) => ctx.partial(withFull(draft)),
        scope: body.productionId || body.editorialSessionId,
        aspect: body.aspect,
        renderBehavior: motionRenderBehaviorFor(body),
        sfx: body.sfx !== false,
        sheetCarry: body.sheetCarry === true,
        restart: body.restart === true,
        rebuildKey: body.rebuildKey || motionInputKey([script.gen?.remotion, body.restart, body.scenes]),
        retryFailed: body.retryFailed === true,
        onlyBeats,
        onlyScenes: _.map(_.castArray(body?.scenes || []), _.toString),
        onlyLocations,
        note: note || undefined,
      });
      ctx.partial(withFull(result));
      const selectedScenes = _.map(_.castArray(body?.scenes || []), _.toString);
      const missing = remotionStateMissingScenes(result.gen!.remotion!).filter((id) => !selectedScenes.length || selectedScenes.includes(id));
      if (missing.length) throw new Error(C.INCOMPLETE(missing));
      return withFull(result);
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
      castChapterIds: _.map(_.castArray(body?.castChapterIds || []), _.toString),
      warmup: body?.voiceWarmup === true,
      signal: ctx.signal,
      log: ctx.log,
      onProgress: (done, total) => ctx.progress((0.98 * done) / Math.max(1, total), done === total ? MOTION_VOICE.MIXING : MOTION_VOICE.PROGRESS(done, total)),
    });
    ctx.log(MOTION_TEMPLATE_GIONG_DOC_GIAY(String(Math.round(track.totalSeconds))));
    if (body?.voiceWarmup === true) return track;
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
  const voiceTrack = readMotionVoiceTrack(requestedVoice?.audioId, script, analysis, body.asrCheck === true);
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
  const previewOnly = body?.previewOnly === true;
  const compiled = compileRemotionStory({ ...directedScript, visualSettings }, analysis ? { ...analysis, visualSettings } : null, { aspect, durations, fps: body.fps, voiceTrack, renderBehavior: behavior, subtitles: body.subtitles, review: previewOnly });
  compiled.spec = applyMotionRenderBehavior(compiled.spec, behavior);
  if (previewOnly) return { success: true, spec: compiled.spec, sfxCues: compiled.sfxCues, starts: compiled.starts, missing: compiled.missing, sfxId: undefined, audioPreviewId: undefined, soundSelections: [], voiceStale };
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
