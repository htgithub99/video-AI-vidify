import _ from "lodash";
import { createHash } from "crypto";
import { MOTION_2D as C } from "../../../constants/motion2d.js";
import { MOTION_BOARD2D as B } from "../../../constants/motionBoard2d.js";
import { MOTION_SOUND_CONFIG } from "../../../constants/motionSound.js";
import { MOTION_STYLE_PRESET_KEY, motionStylePreset } from "../../../constants/motionStylePresets.js";
import * as MR from "../../../constants/motionRuntime.js";
import { bindVideoDnaSettings } from "../../../lib/motionVideoDna.js";
import { collectBoard2dLines } from "../../../lib/motionBoard2d.js";
import type { MotionStoryAnalysis, MotionStoryScript } from "../../../types/motionVideo.js";
import { compileStorySpec } from "../motionDirectorService.js";
import { applyReferenceRenderStyle, prepareMotionGen, withBeatPlaces, type GenOptions } from "../motionGenService.js";
import { motionAssetStyleKey } from "../motionSceneLibraryService.js";
import { releaseMotionAiSession, resolveMotionReferenceStyle } from "../motionStoryService.js";
import { board2dStyleKey, buildBoard2d, type Board2dOptions } from "./board2d.js";
import { buildCast2d } from "./cast2d.js";
import { board2dSheet } from "./sheet2d.js";

const missingLines = (script: MotionStoryScript): number => {
  const sentences = script.gen?.board2d?.sentences || {};
  return _.filter(collectBoard2dLines(script, MR.MOTION_TEXT_SCENE), (l) => !sentences[l.key]).length;
};

export const buildScenes2d = async (script: MotionStoryScript, analysis: MotionStoryAnalysis, o: GenOptions): Promise<MotionStoryScript> => {
  const progress = o.progress || _.noop;
  o.log(C.LOG_START);
  const referenceKey = o.referenceKey || (o.styleReferences?.length ? createHash(MR.MOTION_TEXT_SHA256).update(JSON.stringify(o.styleReferences)).digest(MR.MOTION_TEXT_HEX) : MR.MOTION_TEXT_EMPTY);
  if (o.styleReferences?.length) analysis = { ...analysis, referenceStyle: await resolveMotionReferenceStyle(o.styleReferences, { exec: o.mainExec || o.exec, signal: o.signal, log: o.log, ai: o.ai }) };
  analysis = bindVideoDnaSettings({ ...analysis, characterMotion: o.characterMotion === true }, { drawingMode: MR.MOTION_TEXT_2D, characterMode: MR.MOTION_TEXT_DRAWN, aspect: o.aspect || MR.MOTION_TEXT_16_9 });
  const gen = prepareMotionGen(script.gen, analysis, MR.MOTION_TEXT_2D, referenceKey);
  gen.characterMotion = o.characterMotion === true;
  applyReferenceRenderStyle(analysis, gen);
  gen.assetStyleKey = !o.styleReferences?.length && motionStylePreset(analysis.stylePreset) ? MOTION_STYLE_PRESET_KEY(analysis.stylePreset!, MR.MOTION_TEXT_2D) : motionAssetStyleKey(o.styleReferences, MR.MOTION_TEXT_2D);
  const sceneBeats = _.filter(script.beats, (b) => b.visual === MR.MOTION_TEXT_SCENE);
  _.forEach(sceneBeats, (b) => (b.place = b.place || analysis.places[0]?.key));
  analysis = withBeatPlaces(analysis, sceneBeats, o);
  const out: MotionStoryScript = { ...script, gen };
  const emit = () => o.partial?.({ ...out, gen: _.cloneDeep(gen) });
  const bo: Board2dOptions = { exec: o.exec, mainExec: o.mainExec || o.exec, signal: o.signal, log: o.log, ai: o.ai, allPlaces: true, places: o.onlyLocations?.length ? o.onlyLocations : undefined, redraw: !!o.onlyLocations?.length };
  const styleKey = board2dStyleKey(gen);
  progress(0.03, C.STAGE_CAST);
  const cast = await buildCast2d(analysis, gen, styleKey, bo);
  emit();
  for (let round = 0; round <= C.GATE_TRIES; round++) {
    if (round) o.log(C.LOG_GATE_RETRY(round));
    progress(0.1 + 0.1 * round, B.STAGE);
    await buildBoard2d(out, analysis, gen, MR.MOTION_TEXT_SCENE, { ...bo, ...(round ? { places: [], redraw: false } : {}), progress: (p) => progress(0.1 + 0.6 * p, B.STAGE) });
    if (gen.board2d) gen.board2d.cast = cast;
    emit();
    if (!missingLines(out) || o.signal?.aborted) break;
  }
  await releaseMotionAiSession(o.log).catch(_.noop);
  const board = gen.board2d!;
  const places = _.uniq(_.compact(_.map(sceneBeats, MR.MOTION_TEXT_PLACE)));
  board.report = { sentences: _.size(board.sentences), fallback: missingLines(out), sets: _.size(_.pick(board.sets, places)), codeSets: _.keys(_.pick(board.codeSets || {}, places)), cast: _.size(cast) };
  o.log(C.LOG_GATE(board.report.sentences, board.report.fallback, board.report.sets, board.report.codeSets.length, board.report.cast));
  progress(0.8, C.STAGE_SHEET);
  try {
    const { spec } = compileStorySpec(out, analysis, { aspect: o.aspect || MR.MOTION_TEXT_16_9 });
    board.sheet = _.map(await board2dSheet(spec), (it) => ({ t: it.t, text: it.text, file: it.file }));
    o.log(C.LOG_SHEET(board.sheet.length));
  } catch (e: any) {
    if (o.signal?.aborted) throw e;
    o.log(C.LOG_SHEET_FAIL(String(e?.message || e)));
  }
  gen.failed = [];
  gen.soundPlanVersion = MOTION_SOUND_CONFIG.VERSION;
  gen.updatedAt = new Date().toISOString();
  emit();
  progress(1, MR.MOTION_TEXT_DONE);
  return out;
};
