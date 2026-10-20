import _ from "lodash";
import { createHash } from "crypto";
import { MOTION_2D as C } from "../../../constants/motion2d.js";
import { MOTION_BOARD2D as B } from "../../../constants/motionBoard2d.js";
import { MOTION_SCENE_LIBRARY as SL } from "../../../constants/motionSceneLibrary.js";
import { MOTION_SCENE_LIBRARY_MODES } from "../../../constants/motionSceneCatalog.js";
import { MOTION_LIBRARY_FIT as FIT } from "../../../constants/motionSceneTraits.js";
import { MOTION_VIDEO_CONSTANTS } from "../../../constants/motionVideo.js";
import * as MR from "../../../constants/motionRuntime.js";
import { board2dSentenceKey } from "../../../lib/motionBoard2d.js";
import type { MotionBoard2dProp, MotionBoard2dSet, MotionCast2d, MotionGenState, MotionPlace, MotionSpec, MotionStoryAnalysis } from "../../../types/motionVideo.js";
import { genPreviewDir } from "../motionGenService.js";
import { openStillSession } from "../motionRenderService.js";
import { findSceneIdentity, getSceneAsset, listSceneAssets, motionPlaceFit, saveSceneAsset, sceneAssetFingerprint, sharedStyleKeyOf, touchSceneAssets } from "../motionSceneLibraryService.js";

export interface Board2dDrawn { sets: string[]; props: string[]; }

export const library2dKey = (gen: MotionGenState, analysis: MotionStoryAnalysis): string | null => (analysis.libraryMode === MOTION_SCENE_LIBRARY_MODES.OFF ? null : gen.assetStyleKey || sharedStyleKeyOf(MR.MOTION_TEXT_2D));

const nameKey = (s: string): string => board2dSentenceKey(s);

export const find2dSet = (place: MotionPlace, libKey: string, story: string): { set: MotionBoard2dSet; id: string; name: string } | null => {
  const need = FIT.BASE_WEIGHT + FIT.INTERIOR_WEIGHT + FIT.TAG_WEIGHT * C.LIB.MIN_TAGS;
  const pool = _.filter(listSceneAssets(libKey, SL.KIND_LOCATION), (it) => it.from === C.LIB.FROM_2D && it.interior === !!place.interior && !(it.story === story && nameKey(it.name) !== nameKey(place.name)));
  const ranked = _.orderBy(
    _.map(pool, (it) => ({ it, exact: nameKey(it.name) === nameKey(place.name), fit: motionPlaceFit(it, place) - (it.time === place.time ? FIT.TIME_WEIGHT : 0) })),
    [(r) => (r.exact ? 0 : 1), (r) => -r.fit, (r) => r.it.uses || 0],
  );
  for (const r of ranked) {
    if (!r.exact && r.fit < need) break;
    const asset = getSceneAsset(r.it.id);
    if (asset?.data?.svg2d?.svg) {
      touchSceneAssets([r.it.id]);
      return { set: asset.data.svg2d as MotionBoard2dSet, id: r.it.id, name: r.it.name };
    }
  }
  return null;
};

export const find2dProp = (key: string, libKey: string): MotionBoard2dProp | null => {
  const hit = _.find(listSceneAssets(libKey, SL.KIND_PROP), (it) => it.from === C.LIB.FROM_2D && it.name === key);
  const data = hit ? getSceneAsset(hit.id)?.data : null;
  if (!data?.svg2d?.svg) return null;
  touchSceneAssets([hit!.id]);
  return data.svg2d as MotionBoard2dProp;
};

interface Pending { id: string; kind: string; save: (thumb: string | null) => void; shot: any; sub?: { text: string; entry: any }; }

export const save2dLibrary = async (spec: MotionSpec, analysis: MotionStoryAnalysis, gen: MotionGenState, drawn: Board2dDrawn, libKey: string, log: (s: string) => void): Promise<void> => {
  const board = (spec.gen as any)?.board2d || {};
  const sets: Record<string, MotionBoard2dSet> = board.sets || {};
  const props: Record<string, MotionBoard2dProp> = board.props || {};
  const cast: Record<string, MotionCast2d> = gen.board2d?.cast || {};
  const story = analysis.title || MR.MOTION_TEXT_EMPTY;
  const descOf = (k: string): string => _.find(_.values(gen.board2d?.sentences || {}), (x) => x.place === k && !!x.placeDesc)?.placeDesc || _.startCase(k);
  const places = [...analysis.places, ..._.map(_.keys(sets), (k) => ({ key: k, name: _.startCase(k), description: descOf(k), interior: B.INTERIOR_RE.test(k + C.SPACE + descOf(k).toLowerCase()) }) as MotionPlace)];
  const anySet = _.find(_.keys(sets), (k) => !!sets[k]) || null;
  const fresh = (kind: string, name: string, data: unknown): boolean => {
    const print = sceneAssetFingerprint(data);
    const list = listSceneAssets(libKey, kind as any);
    if (_.some(list, (it) => it.from === C.LIB.FROM_2D && it.fingerprint === print && !!it.thumb)) return false;
    const id = findSceneIdentity(kind as any, libKey, name, story);
    const item = id ? _.find(list, { id }) : null;
    return !item || item.fingerprint !== print || !item.thumb;
  };
  const shot = (params: any) => ({ template: MOTION_VIDEO_CONSTANTS.TEMPLATE_2D, transition: { type: C.LIB.CUT }, params });
  const todo: Pending[] = [];
  for (const pk of _.uniq(drawn.sets)) {
    const set = sets[pk];
    const place = _.find(places, { key: pk });
    if (!set || !place) continue;
    const data = { svg2d: set };
    if (!fresh(SL.KIND_LOCATION, place.name, data)) continue;
    todo.push({ id: C.LIB.PREFIX.set + todo.length, kind: SL.KIND_LOCATION, shot: shot({ location: pk, time: set.time || place.time, actors: [], camera: { shot: C.SHOT_WIDE } }), save: (thumb) => saveSceneAsset({ kind: SL.KIND_LOCATION, styleKey: libKey, type: place.type, name: place.name, description: place.description, tags: place.tags, time: set.time || place.time, interior: !!place.interior, from: C.LIB.FROM_2D, story }, data, thumb) });
  }
  for (const c of analysis.cast) {
    const info = cast[c.key];
    if (!info) continue;
    const data = { info2d: info, ghost: info.ghost === true };
    if (!fresh(SL.KIND_CHARACTER, c.name, data)) continue;
    const home = (_.find(spec.shots, (s: any) => _.some(s.params?.actors || [], { cast: c.key }) && !!sets[s.params?.location]) as any)?.params?.location || anySet;
    todo.push({ id: C.LIB.PREFIX.cast + todo.length, kind: SL.KIND_CHARACTER, shot: shot({ location: home, actors: [{ cast: c.key, action: C.ACTION_IDLE, at: C.LIB.CAST_AT }], camera: { shot: B.CAMERA_DEFAULT, focus: c.key } }), save: (thumb) => saveSceneAsset({ kind: SL.KIND_CHARACTER, styleKey: libKey, type: info.species || c.type, name: c.name, description: _.compact([c.look, c.description]).join(SL.TEXT.SEP), tags: c.tags, gender: c.gender, role: c.role, from: C.LIB.FROM_2D, story }, data, thumb) });
  }
  for (const key of _.uniq(drawn.props)) {
    const prop = props[key];
    if (!prop) continue;
    const data = { svg2d: prop };
    if (!fresh(SL.KIND_PROP, key, data)) continue;
    const text = C.LIB.PROP_TEXT(key);
    todo.push({ id: C.LIB.PREFIX.prop + todo.length, kind: SL.KIND_PROP, shot: shot({ location: anySet, actors: [] }), sub: { text, entry: { mode: B.MODE_CUTAWAY, kind: null, subject: null, target: null, objects: [{ key, color: null, count: 1, state: null }], actors: [], camera: B.CAMERA_DEFAULT, light: null, items: [{ key, ...C.LIB.PROP_ITEM }], text } }, save: (thumb) => saveSceneAsset({ kind: SL.KIND_PROP, styleKey: libKey, name: key, description: _.startCase(key), tags: [key.replace(C.UNDERSCORE_RE, C.SPACE)], from: C.LIB.FROM_2D, story }, data, thumb) });
  }
  if (!todo.length) return;
  const shots = _.map(todo, (t, i) => ({ ...t.shot, id: t.id, start: i * C.LIB.SHOT, end: (i + 1) * C.LIB.SHOT }));
  const subtitles = _.compact(_.map(todo, (t, i) => (t.sub ? { start: i * C.LIB.SHOT, end: (i + 1) * C.LIB.SHOT, text: t.sub.text } : null)));
  const sentences = { ...(board.sentences || {}) };
  for (const t of todo) if (t.sub) sentences[board2dSentenceKey(t.sub.text)] = t.sub.entry;
  const thumbSpec = { ..._.omit(spec, C.LIB.OMIT), shots, subtitles, subtitleStyle: C.LIB.SUB_OFF, duration: shots.length * C.LIB.SHOT, gen: { ...spec.gen, board2d: { ...board, sentences } } } as unknown as MotionSpec;
  const dir = genPreviewDir(C.LIB.THUMB_DIR, createHash(B.SHA).update(libKey + story + Date.now()).digest(B.HEX).slice(0, 16));
  const picks = _.map(shots, (s) => ({ id: s.id, t: s.start + C.LIB.PICK }));
  let files: Record<string, string> = {};
  const session = await openStillSession();
  try {
    const out = await session.render(thumbSpec, picks, dir, { width: C.LIB.THUMB_W, height: C.LIB.THUMB_H });
    files = _.fromPairs(_.map(out, (o) => [o.id, o.file]));
  } catch (e: any) {
    log(C.LIB.LOG_SAVE_FAIL(String(e?.message || e)));
  } finally {
    await session.close();
  }
  for (const t of todo) t.save(files[t.id] || null);
  const count = (k: string) => _.filter(todo, { kind: k }).length;
  log(C.LIB.LOG_SAVED(count(SL.KIND_LOCATION), count(SL.KIND_CHARACTER), count(SL.KIND_PROP)));
};
