import { stringifyJson } from "../../lib/jsonStringify.js";
import { randomUUID } from "crypto";
import fs from "fs";
import _ from "lodash";
import path from "path";
import {
  MOTION_TEMPLATE_DUNG_ANH_NHAP_DE_AI_KIEM_TRA_HINH,
  MOTION_TEMPLATE_KIEM_TRA_HINH_BANG_AI_LOI_GIU_NGUYEN,
  MOTION_TEMPLATE_ROLE_STORYBOARD_SUPERVISOR_OF_AN_EDUCATIONAL_DOCUMENTARY_YOU,
  MOTION_TEMPLATE_SHOT_WORDS,
  MOTION_TEMPLATE_SUA,
  MOTION_TEMPLATE_SYMBOL_33,
  MOTION_TEMPLATE_SYMBOL_34,
  MOTION_TEXT_0,
  MOTION_TEXT_16_9,
  MOTION_TEXT_AUDIOFILE,
  MOTION_TEXT_CANCELLED,
  MOTION_TEXT_DURATION,
  MOTION_TEXT_EN,
  MOTION_TEXT_ENGLISH,
  MOTION_TEXT_ID,
  MOTION_TEXT_IMAGE_JPEG,
  MOTION_TEXT_MESSAGE,
  MOTION_TEXT_MOTION_STORYBOARD_REVIEW,
  MOTION_TEXT_OBJECT,
  MOTION_TEXT_SCENE,
  MOTION_TEXT_STORYBOARD_REVIEW,
  MOTION_TEXT_SYMBOL_27,
  MOTION_TEXT_SYMBOL_41,
  MOTION_TEXT_T_2,
  MOTION_TEXT_VIETNAMESE,
} from "../../constants/motionRuntime.js";
import type { MotionAiExecution, MotionBeat, MotionStoryAnalysis, MotionStoryScript } from "../../types/motionVideo.js";
import { compileStorySpec } from "./motionDirectorService.js";
import { loadMotionEngine } from "./motionEngineService.js";
import { getMotionRootDirectory } from "./motionLibraryService.js";
import { withRealCatalog } from "./motionRealAssetService.js";
import { renderMotionStills } from "./motionRenderService.js";
import { catalogGuide, mapMotionAiPool, normalizeBeats, runMotionAi, storyboardRules, TEXT_ONLY_PREAMBLE, type MotionAiImage } from "./motionStoryService.js";
const ARTIFACT_REVIEW = MOTION_TEXT_MOTION_STORYBOARD_REVIEW;
const MAX_IMAGES_PER_CALL = 10;
interface ReviewOptions {
  aspect?: string;
  exec: MotionAiExecution;
  signal?: AbortSignal;
  log?: (s: string) => void;
  beatIds?: string[];
}
const baseBeatId = (shotId: string): string => shotId.replace(/_s\d+$/, "");
const compactBeat = (b: MotionBeat) => _.omitBy(_.omit(b, [MOTION_TEXT_DURATION, MOTION_TEXT_AUDIOFILE]), (v) => v == null || (_.isArray(v) && !v.length));
export const reviewStoryboard = async (script: MotionStoryScript, analysis: MotionStoryAnalysis, opts: ReviewOptions): Promise<{ beats: MotionBeat[]; fixed: string[]; reviewed: number }> => {
  const beats = _.cloneDeep(script.beats);
  const wanted = opts.beatIds?.length ? new Set(opts.beatIds) : null;
  const compiled = compileStorySpec({ ...script, beats }, analysis, { aspect: opts.aspect || MOTION_TEXT_16_9 });
  const picks = _.compact(
    _.map(compiled.spec.shots, (sh) => {
      if (!_.includes([MOTION_TEXT_SCENE, MOTION_TEXT_OBJECT], sh.template)) return null;
      const beatId = baseBeatId(sh.id);
      if (wanted && !wanted.has(beatId)) return null;
      return { id: sh.id, t: sh.start + (sh.end - sh.start) * 0.62 };
    }),
  );
  if (!picks.length) return { beats, fixed: [], reviewed: 0 };
  const dir = path.join(getMotionRootDirectory(), MOTION_TEXT_STORYBOARD_REVIEW, randomUUID().slice(0, 8));
  opts.log?.(MOTION_TEMPLATE_DUNG_ANH_NHAP_DE_AI_KIEM_TRA_HINH(`${picks.length}`));
  const stills = await renderMotionStills(compiled.spec, picks, dir);
  const catalog = withRealCatalog(loadMotionEngine().catalog);
  const isVi = script.language !== MOTION_TEXT_EN;
  const fixed: string[] = [];
  const byId = _.keyBy(beats, MOTION_TEXT_ID);
  const textOf = (shotId: string): string => {
    const beat = byId[baseBeatId(shotId)];
    const m = /_s(\d+)$/.exec(shotId);
    if (beat && m && beat.shots?.[_.toNumber(m[1]) - 1]) return beat.shots[_.toNumber(m[1]) - 1].text;
    return beat?.narration || "";
  };
  await mapMotionAiPool(_.chunk(stills, MAX_IMAGES_PER_CALL), async (group) => {
    if (opts.signal?.aborted) throw new Error(MOTION_TEXT_CANCELLED);
    const groupBeatIds = _.uniq(_.map(group, (g) => baseBeatId(g.id)));
    const groupBeats = _.compact(_.map(groupBeatIds, (id) => byId[id]));
    const images: MotionAiImage[] = _.map(group, (g, i) => ({ name: MOTION_TEMPLATE_SYMBOL_33(`${String(i + 1).padStart(2, MOTION_TEXT_0)}`, `${path.basename(g.file)}`), mimeType: MOTION_TEXT_IMAGE_JPEG, path: g.file }));
    const prompt = MOTION_TEMPLATE_ROLE_STORYBOARD_SUPERVISOR_OF_AN_EDUCATIONAL_DOCUMENTARY_YOU(
      `${TEXT_ONLY_PREAMBLE}`,
      `${analysis.title}`,
      `${analysis.logline}`,
      `${_.map(analysis.cast, (c) => MOTION_TEMPLATE_SYMBOL_34(`${c.key}`, `${c.name}`, `${c.role || ""}`)).join(MOTION_TEXT_SYMBOL_41)}`,
      `${_.map(group, (g, i) => MOTION_TEMPLATE_SHOT_WORDS(`${i + 1}`, `${g.id}`, `${textOf(g.id)}`)).join(MOTION_TEXT_SYMBOL_27)}`,
      `${stringifyJson(_.map(groupBeats, compactBeat))}`,
      `${storyboardRules(isVi ? MOTION_TEXT_VIETNAMESE : MOTION_TEXT_ENGLISH)}`,
      `${catalogGuide(catalog, true, analysis.places || [])}`,
    );
    let raw: any;
    try {
      raw = await runMotionAi(prompt, ARTIFACT_REVIEW, opts.exec, opts.signal, opts.log, images);
    } catch (error) {
      if (opts.signal?.aborted) throw error;
      opts.log?.(MOTION_TEMPLATE_KIEM_TRA_HINH_BANG_AI_LOI_GIU_NGUYEN(`${_.truncate(_.toString(_.get(error, MOTION_TEXT_MESSAGE, error)), { length: 120 })}`));
      return;
    }
    for (const r of _.castArray(raw?.reviews || [])) {
      const id = _.toString(r?.id);
      const original = byId[id];
      if (!original || r?.ok !== false || !_.isPlainObject(r?.beat)) continue;
      const candidate = { ...r.beat, narration: original.narration };
      const [fixedBeat] = normalizeBeats([candidate], original.chapterId, analysis, catalog);
      if (!fixedBeat) continue;
      const merged: MotionBeat = { ...fixedBeat, id: original.id, chapterId: original.chapterId, narration: original.narration, duration: original.duration, audioFile: original.audioFile };
      if (original.emphasis) merged.emphasis = true;
      const idx = _.findIndex(beats, { id });
      beats[idx] = merged;
      byId[id] = merged;
      fixed.push(id);
      opts.log?.(MOTION_TEMPLATE_SUA(`${id}`, `${_.truncate(_.toString(r?.problems || ""), { length: 140 })}`));
    }
  });
  try {
    const root = path.dirname(dir);
    const old = _.slice(
      _.sortBy(
        _.map(fs.readdirSync(root), (n) => ({ n, t: fs.statSync(path.join(root, n)).mtimeMs })),
        MOTION_TEXT_T_2,
      ),
      0,
      -3,
    );
    for (const o of old) fs.rmSync(path.join(root, o.n), { recursive: true, force: true });
  } catch {}
  return { beats, fixed, reviewed: picks.length };
};
