import _ from "lodash";
import { MOTION_BOARD2D as B } from "../constants/motionBoard2d.js";
import type { MotionBeat, MotionBoard2dSentence, MotionStoryScript } from "../types/motionVideo.js";

export interface Board2dLine { key: string; text: string; beatId: string; place?: string; speaker?: string; chapterId: string; cast: string[]; }
export const board2dSentenceKey = (text: string): string => _.trim(String(text || B.EMPTY).toLowerCase().normalize(B.NFC).replace(B.NORM_STRIP_RE, B.SPACE));
export const splitBoard2dSentences = (text: string): string[] => _.compact(_.map(String(text || B.EMPTY).match(B.SENTENCE_RE) || [], _.trim));
export const board2dPoint = (v: unknown, d: number[]): number[] => (Array.isArray(v) && v.length >= 2 && _.every(v.slice(0, 2), _.isFinite) ? [Number(v[0]), Number(v[1])] : d);
const pick = (v: unknown, list: readonly string[], d: string | null): string | null => (_.isString(v) && list.includes(v) ? v : d);
const castKey = (v: unknown, cast: string[]): string | null => (_.isString(v) && cast.includes(v) ? v : null);
export const board2dObjKey = (v: unknown): string | null => {
  const k = _.snakeCase(String(v || B.EMPTY));
  return B.KEY_RE.test(k) ? k : null;
};

export const normalizeBoard2dSentence = (raw: any, cast: string[]): MotionBoard2dSentence | null => {
  if (!raw || !_.isObject(raw)) return null;
  const r = raw as any;
  const mode = pick(r.mode, B.MODES, null) as MotionBoard2dSentence["mode"] | null;
  if (!mode) return null;
  const objects = _.take(
    _.compact(
      _.map(_.castArray(r.objects || []), (o: any) => {
        const key = board2dObjKey(o?.key);
        if (!key) return null;
        return { key, color: _.isString(o?.color) && B.HEX_RE.test(o.color) ? o.color : null, count: _.clamp(Math.round(Number(o?.count) || 1), 1, B.MAX_COUNT), state: pick(o?.state, B.STATES, null) };
      }),
    ),
    3,
  );
  const actors = _.uniqBy(
    _.compact(
      _.map(_.castArray(r.actors || []), (a: any) => {
        const c = castKey(a?.cast, cast);
        if (!c) return null;
        const face = castKey(a?.face, cast) || pick(a?.face, B.FACES, null) || undefined;
        return { cast: c, pose: pick(a?.pose, B.POSES, B.POSE_DEFAULT) as string, expression: pick(a?.expression, B.EXPRESSIONS, B.EXPR_DEFAULT) as string, face };
      }),
    ),
    B.F_CAST,
  );
  const items = _.take(
    _.compact(
      _.map(_.castArray(r.items || []), (it: any) => {
        const key = board2dObjKey(it?.key);
        if (!key) return null;
        return { key, x: _.clamp(Number(it?.x) || 0.5, 0, 1), y: _.clamp(Number(it?.y) || 0.75, 0, 1), scale: _.clamp(Number(it?.scale) || 0.4, 0.05, 1) };
      }),
    ),
    B.MAX_ITEMS,
  );
  const kind = mode === B.MODE_VIGNETTE ? pick(r.kind, B.KINDS, null) : null;
  if (mode === B.MODE_VIGNETTE && !kind) return null;
  if (mode === B.MODE_CUTAWAY && !items.length) return null;
  return { mode, kind, subject: castKey(r.subject, cast), target: castKey(r.target, cast), objects, actors, camera: pick(r.camera, B.CAMERAS, B.CAMERA_DEFAULT) as string, light: pick(r.light, B.LIGHTS, null), items };
};

export const collectBoard2dLines = (script: MotionStoryScript, sceneVisual: string): Board2dLine[] => {
  const out: Board2dLine[] = [];
  const seen = new Set<string>();
  for (const beat of script.beats as MotionBeat[]) {
    if (beat.visual !== sceneVisual) continue;
    const parts = beat.utterances?.length ? beat.utterances.map((u) => ({ text: u.text, speaker: u.role === B.DIALOGUE ? u.speaker : undefined })) : [{ text: beat.narration, speaker: undefined }];
    for (const part of parts)
      for (const text of splitBoard2dSentences(part.text)) {
        const key = board2dSentenceKey(text);
        if (!key || seen.has(key)) continue;
        seen.add(key);
        out.push({ key, text, beatId: beat.id, place: beat.place, speaker: part.speaker, chapterId: beat.chapterId, cast: beat.cast || [] });
      }
  }
  return out;
};


export const board2dCodeAlias = (key: string): string | null => (_.includes(B.CODE_OBJECTS as readonly string[], key) ? key : _.find(B.CODE_OBJECTS as readonly string[], (c) => _.includes(_.split(key, B.UNDERSCORE), c)) || null);
