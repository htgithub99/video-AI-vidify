import _ from "lodash";
import {
  MOTION_TEMPLATE_P,
  MOTION_TEMPLATE_SYMBOL_12,
  MOTION_TEMPLATE_S_2,
  MOTION_TEXT_16_9,
  MOTION_TEXT_ADVANCE,
  MOTION_TEXT_AERIAL,
  MOTION_TEXT_AIRCRAFT,
  MOTION_TEXT_AIRPLANE,
  MOTION_TEXT_AIRPLANE_SEAT,
  MOTION_TEXT_AMOUNT,
  MOTION_TEXT_ANIMAL,
  MOTION_TEXT_ARMORED_TRUCK,
  MOTION_TEXT_BACK,
  MOTION_TEXT_BANK_VAULT,
  MOTION_TEXT_BED,
  MOTION_TEXT_BENCH,
  MOTION_TEXT_BICYCLE,
  MOTION_TEXT_BLOCK,
  MOTION_TEXT_BUS,
  MOTION_TEXT_CARRY,
  MOTION_TEXT_CAR_SEDAN,
  MOTION_TEXT_CAR_VINTAGE,
  MOTION_TEXT_CCTV_CAMERA,
  MOTION_TEXT_CHAIR,
  MOTION_TEXT_CHAPTER,
  MOTION_TEXT_CHARGE,
  MOTION_TEXT_CINEMA,
  MOTION_TEXT_CITY_STREET,
  MOTION_TEXT_CLIMB,
  MOTION_TEXT_CLOCK,
  MOTION_TEXT_CLOSE,
  MOTION_TEXT_COUNTER,
  MOTION_TEXT_CRAWL,
  MOTION_TEXT_CUT,
  MOTION_TEXT_DIG,
  MOTION_TEXT_DIP,
  MOTION_TEXT_DOCUMENTARY,
  MOTION_TEXT_DOCUMENTS,
  MOTION_TEXT_DRAG,
  MOTION_TEXT_DRIFT,
  MOTION_TEXT_DRILL,
  MOTION_TEXT_DRINK,
  MOTION_TEXT_DRIVE,
  MOTION_TEXT_DRIVER,
  MOTION_TEXT_DUFFEL_BAG,
  MOTION_TEXT_DUSK,
  MOTION_TEXT_DUST,
  MOTION_TEXT_EN,
  MOTION_TEXT_ENDING,
  MOTION_TEXT_ENTER_LEFT,
  MOTION_TEXT_ENTER_RIGHT,
  MOTION_TEXT_EXIT_LEFT,
  MOTION_TEXT_EXIT_RIGHT,
  MOTION_TEXT_FADE,
  MOTION_TEXT_FFB070,
  MOTION_TEXT_FLASHLIGHT,
  MOTION_TEXT_FOCUS,
  MOTION_TEXT_FOG,
  MOTION_TEXT_FOLLOW,
  MOTION_TEXT_FOLLOW_TARGET,
  MOTION_TEXT_FORE,
  MOTION_TEXT_FRONT,
  MOTION_TEXT_FURNITURE,
  MOTION_TEXT_FX,
  MOTION_TEXT_HANDS_POCKET,
  MOTION_TEXT_HEADLINE,
  MOTION_TEXT_HELICOPTER,
  MOTION_TEXT_HIT,
  MOTION_TEXT_HOSPITAL_BED,
  MOTION_TEXT_IDLE,
  MOTION_TEXT_ILLUSTRATION,
  MOTION_TEXT_INSERT,
  MOTION_TEXT_INTERIOR_DARK,
  MOTION_TEXT_KICH_BAN_CHUA_CO_BEAT_NAO,
  MOTION_TEXT_LEFT,
  MOTION_TEXT_LEFT_TO_RIGHT,
  MOTION_TEXT_LIFT,
  MOTION_TEXT_LOOK_AROUND,
  MOTION_TEXT_MAP,
  MOTION_TEXT_MEDIUM,
  MOTION_TEXT_MID,
  MOTION_TEXT_MONEY_BAG,
  MOTION_TEXT_MOTORBIKE,
  MOTION_TEXT_MOVE,
  MOTION_TEXT_NHAT_BAO,
  MOTION_TEXT_NIGHT,
  MOTION_TEXT_NIGHT_SKY,
  MOTION_TEXT_NONE,
  MOTION_TEXT_OBJECT,
  MOTION_TEXT_OFFICE,
  MOTION_TEXT_PAINT,
  MOTION_TEXT_PAN,
  MOTION_TEXT_PAN_LEFT,
  MOTION_TEXT_PAN_RIGHT,
  MOTION_TEXT_PASSENGER,
  MOTION_TEXT_PHONE,
  MOTION_TEXT_PICKAXE,
  MOTION_TEXT_PICTURE_FRAME,
  MOTION_TEXT_POLICE_CAR,
  MOTION_TEXT_POWER_DRILL,
  MOTION_TEXT_PROP,
  MOTION_TEXT_PULL,
  MOTION_TEXT_PULL_OUT,
  MOTION_TEXT_PUSH,
  MOTION_TEXT_PUSH_IN,
  MOTION_TEXT_QUOTE,
  MOTION_TEXT_REACH,
  MOTION_TEXT_RETREAT,
  MOTION_TEXT_RIDE_BIKE,
  MOTION_TEXT_RIDE_MOTO,
  MOTION_TEXT_RIDE_PASSENGER,
  MOTION_TEXT_RIGHT,
  MOTION_TEXT_RIGHT_TO_LEFT,
  MOTION_TEXT_RUBBLE,
  MOTION_TEXT_RUN,
  MOTION_TEXT_SAFE_DEPOSIT_WALL,
  MOTION_TEXT_SCENE,
  MOTION_TEXT_SCOOTER,
  MOTION_TEXT_SIT,
  MOTION_TEXT_SIT_EAT,
  MOTION_TEXT_SKY,
  MOTION_TEXT_SMALL_PLANE,
  MOTION_TEXT_SMARTPHONE,
  MOTION_TEXT_SNEAK,
  MOTION_TEXT_SOFA,
  MOTION_TEXT_SO_DO_MINH_HOA,
  MOTION_TEXT_STAND,
  MOTION_TEXT_STATS,
  MOTION_TEXT_STAY,
  MOTION_TEXT_STILL,
  MOTION_TEXT_SWEEP_LIGHT,
  MOTION_TEXT_SWIM,
  MOTION_TEXT_SYMBOL_13,
  MOTION_TEXT_TAG,
  MOTION_TEXT_TALK,
  MOTION_TEXT_TAXI,
  MOTION_TEXT_TELEPHONE,
  MOTION_TEXT_TEXT,
  MOTION_TEXT_THINK,
  MOTION_TEXT_THRONE,
  MOTION_TEXT_TIMELINE,
  MOTION_TEXT_TITLE,
  MOTION_TEXT_TOWARD_CENTER,
  MOTION_TEXT_TRUCK,
  MOTION_TEXT_TYPE,
  MOTION_TEXT_VAN,
  MOTION_TEXT_VEHICLE,
  MOTION_TEXT_WALK,
  MOTION_TEXT_WALL_CLOCK,
  MOTION_TEXT_WALL_TORCH,
  MOTION_TEXT_WATERCRAFT,
  MOTION_TEXT_WELD,
  MOTION_TEXT_WIDE,
  MOTION_TEXT_WINE_BOTTLE,
  MOTION_TEXT_X,
} from "../../constants/motionRuntime.js";
import { MOTION_ASPECT_BASE, MOTION_STORY_CONFIG } from "../../constants/motionVideo.js";
import type { MotionBeat, MotionBeatActor, MotionBeatCrowd, MotionBeatProp, MotionShot, MotionSpec, MotionStoryAnalysis, MotionStoryScript } from "../../types/motionVideo.js";
import { loadMotionEngine } from "./motionEngineService.js";
const FRAME_H: Record<string, number> = { "16:9": 1080, "9:16": 1500, "1:1": 1150, "4:5": 1260 };
const LOCOMOTION = [MOTION_TEXT_WALK, MOTION_TEXT_RUN, MOTION_TEXT_SNEAK, MOTION_TEXT_CRAWL, MOTION_TEXT_CARRY, MOTION_TEXT_DRAG, MOTION_TEXT_PUSH, MOTION_TEXT_SWIM];
const SPEED: Record<string, number> = { walk: 190, run: 420, sneak: 110, crawl: 70, carry: 150, drag: 90, push: 110, swim: 120 };
const VEHICLE_SPEED: Record<string, number> = { bicycle: 330, motorbike: 650, scooter: 520, car_sedan: 700, car_vintage: 650, police_car: 760, taxi: 700, van: 620, truck: 520, armored_truck: 480, bus: 480, train: 900, tram: 450, boat: 300, ship: 160, sailboat: 200, raft: 90, rowboat: 110, airplane: 1100, small_plane: 800, helicopter: 600 };
const AIRCRAFT = [MOTION_TEXT_AIRPLANE, MOTION_TEXT_SMALL_PLANE, MOTION_TEXT_HELICOPTER];
const RIDEABLE = [MOTION_TEXT_MOTORBIKE, MOTION_TEXT_SCOOTER, MOTION_TEXT_BICYCLE];
const WALL_MOUNTED = [MOTION_TEXT_WALL_CLOCK, MOTION_TEXT_PICTURE_FRAME, MOTION_TEXT_WALL_TORCH, MOTION_TEXT_CCTV_CAMERA];
const NON_SCENE_TRANSITION_IN = 0.55;
const countUnits = (text: string): number => _.size(_.compact(_.toString(text).split(/\s+/)));
export const estimateBeatSeconds = (beat: MotionBeat, language: string): number => {
  const rate = language === MOTION_TEXT_EN ? MOTION_STORY_CONFIG.EN_WORDS_PER_SECOND : MOTION_STORY_CONFIG.VI_SYLLABLES_PER_SECOND;
  const pauses = (beat.narration.match(/[,.;:!?…]/g) || []).length * 0.18;
  return Math.max(1.2, countUnits(beat.narration) / rate + pauses);
};
export const computeBeatTimeline = (beats: MotionBeat[], durations: number[]): { starts: number[]; ends: number[]; total: number } => {
  const starts: number[] = [];
  const ends: number[] = [];
  let cursor = beats[0]?.visual === MOTION_TEXT_TITLE ? 0.9 : 0.5;
  beats.forEach((b, i) => {
    starts.push(cursor);
    const d = Math.max(0.6, durations[i] || 1);
    ends.push(cursor + d);
    const next = beats[i + 1];
    const gap = !next ? 0 : next.chapterId !== b.chapterId || next.visual === MOTION_TEXT_CHAPTER ? MOTION_STORY_CONFIG.CHAPTER_GAP_SECONDS : MOTION_STORY_CONFIG.BEAT_GAP_SECONDS;
    const hold = _.includes([MOTION_TEXT_TITLE, MOTION_TEXT_QUOTE, MOTION_TEXT_STATS, MOTION_TEXT_COUNTER, MOTION_TEXT_MAP, MOTION_TEXT_TIMELINE, MOTION_TEXT_HEADLINE], b.visual) ? 0.45 : 0;
    cursor += d + gap + hold;
  });
  const tail = MOTION_STORY_CONFIG.TAIL_SECONDS + (_.last(beats)?.visual === MOTION_TEXT_ENDING ? 1.6 : 0);
  return { starts, ends, total: (_.last(ends) || 3) + tail };
};
const splitSubtitle = (text: string, max: number): string[] => {
  const sentences = _.compact(_.map(_.toString(text).match(/[^.!?…]+[.!?…]*["”»)]*/g) || [text], _.trim));
  const out: string[] = [];
  for (const s of sentences) {
    if (s.length <= max) {
      out.push(s);
      continue;
    }
    const parts = _.compact(_.map(s.split(/(?<=[,;:–—])\s+/), _.trim));
    let cur = "";
    for (const p of parts) {
      if ((cur + MOTION_TEXT_SYMBOL_13 + p).trim().length > max && cur) {
        out.push(cur.trim());
        cur = p;
      } else cur = MOTION_TEMPLATE_SYMBOL_12(`${cur}`, `${p}`);
    }
    if (cur.trim()) {
      const words = cur.trim().split(/\s+/);
      let line = "";
      for (const w of words) {
        if ((line + MOTION_TEXT_SYMBOL_13 + w).trim().length > max && line) {
          out.push(line.trim());
          line = w;
        } else line = MOTION_TEMPLATE_SYMBOL_12(`${line}`, `${w}`);
      }
      if (line.trim()) out.push(line.trim());
    }
  }
  return out;
};
const buildSubtitles = (beat: MotionBeat, start: number, end: number): { start: number; end: number; text: string }[] => {
  const pieces = splitSubtitle(beat.narration, MOTION_STORY_CONFIG.SUBTITLE_MAX_CHARS);
  const weights = _.map(pieces, (p) => countUnits(p) + (/[,.;:!?…]$/.test(p) ? 0.8 : 0));
  const total = _.sum(weights) || 1;
  let t = start;
  return _.map(pieces, (text, i) => {
    const d = ((end - start) * weights[i]) / total;
    const s = { start: +t.toFixed(3), end: +(t + d).toFixed(3), text };
    t += d;
    return s;
  });
};
interface Frame {
  WW: number;
  cx: number;
  zoom: number;
  vw: number;
}
const frameFor = (beat: MotionBeat, aspect: string, prevShot: string | undefined): { frame: Frame; camera: Record<string, unknown> } => {
  const info: { width?: number; frame?: { zoom?: number; x?: number } } = loadMotionEngine().registryInfo.envs[beat.env || MOTION_TEXT_CITY_STREET] || { width: 3200 };
  const WW = info.width || 3200;
  const base = MOTION_ASPECT_BASE[aspect] || MOTION_ASPECT_BASE[MOTION_TEXT_16_9];
  const frameW = (FRAME_H[aspect] || 1080) * (base.w / base.h);
  const portrait = base.h > base.w;
  let shot = beat.shot || MOTION_TEXT_MEDIUM;
  if (shot === MOTION_TEXT_CLOSE && prevShot === MOTION_TEXT_CLOSE) shot = MOTION_TEXT_MEDIUM;
  const zoomFor: Record<string, number> = { aerial: portrait ? 0.85 : 0.7, wide: portrait ? 1.45 : 1.35, medium: portrait ? 2.1 : 2.0, close: portrait ? 2.9 : 2.8, follow: portrait ? 2.1 : 1.95, pan_left: portrait ? 1.8 : 1.65, pan_right: portrait ? 1.8 : 1.65, push_in: portrait ? 1.7 : 1.6, pull_out: portrait ? 1.8 : 1.7, insert: portrait ? 4.2 : 3.6 };
  const fixed = info.frame;
  const zoom = fixed?.zoom && shot !== MOTION_TEXT_INSERT ? fixed.zoom : zoomFor[shot] || 1.3;
  const cx = fixed?.x && shot !== MOTION_TEXT_INSERT ? fixed.x : WW / 2;
  const vw = frameW / zoom;
  const camera: Record<string, unknown> = { x: cx, zoom };
  if (shot === MOTION_TEXT_AERIAL) _.assign(camera, { aerial: 1, move: MOTION_TEXT_DRIFT, drift: 90 });
  else if (shot === MOTION_TEXT_WIDE) _.assign(camera, { move: MOTION_TEXT_DRIFT, drift: 70 });
  else if (shot === MOTION_TEXT_MEDIUM) _.assign(camera, { move: MOTION_TEXT_DRIFT, drift: 45 });
  else if (shot === MOTION_TEXT_CLOSE) _.assign(camera, { move: MOTION_TEXT_PUSH, amount: 1.08 });
  else if (shot === MOTION_TEXT_PAN_LEFT) _.assign(camera, { move: MOTION_TEXT_PAN, direction: MOTION_TEXT_LEFT, distance: Math.min(700, vw * 0.45), x: cx + Math.min(350, vw * 0.22) });
  else if (shot === MOTION_TEXT_PAN_RIGHT) _.assign(camera, { move: MOTION_TEXT_PAN, direction: MOTION_TEXT_RIGHT, distance: Math.min(700, vw * 0.45), x: cx - Math.min(350, vw * 0.22) });
  else if (shot === MOTION_TEXT_PUSH_IN) _.assign(camera, { move: MOTION_TEXT_PUSH, amount: 1.22 });
  else if (shot === MOTION_TEXT_PULL_OUT) _.assign(camera, { move: MOTION_TEXT_PULL, amount: 1.3, zoom: portrait ? 1.2 : 1.05 });
  if (fixed?.zoom && shot !== MOTION_TEXT_INSERT) _.assign(camera, { move: MOTION_TEXT_PUSH, amount: 1.05, zoom, x: cx });
  return { frame: { WW, cx, zoom, vw }, camera };
};
const LANES_ORDERED = [MOTION_TEXT_BACK, MOTION_TEXT_MID, MOTION_TEXT_FRONT, MOTION_TEXT_FORE] as const;
type LaneName = (typeof LANES_ORDERED)[number];
const LANE_INDEX: Record<string, number> = { back: 0, mid: 1, front: 2, fore: 3 };
const LANE_GEOMETRY: Record<string, { y: number; s: number }> = { back: { y: -128, s: 0.8 }, mid: { y: -60, s: 0.9 }, front: { y: 0, s: 1 }, fore: { y: 70, s: 1.12 } };
const focusPoint = (asset: string, params: Record<string, unknown>): { dx: number; dy: number } => {
  const info = loadMotionEngine().registryInfo.assets[asset];
  const size = info?.size || [100, 100];
  if (asset === MOTION_TEXT_SAFE_DEPOSIT_WALL) {
    const W = _.toNumber(params.w) || 600,
      H = _.toNumber(params.h) || 420;
    const cols = Math.max(1, Math.floor(W / 50)),
      rows = Math.max(1, Math.floor(H / 34));
    const idx = params.drawer == null ? Math.floor(rows * 0.55) * cols + Math.floor(cols / 2) : Math.abs(Math.round(_.toNumber(params.drawer))) % (cols * rows);
    const r = Math.floor(idx / cols),
      c = idx % cols;
    return { dx: -W / 2 + 4 + c * 50 + 23, dy: -H + 4 + r * 34 + 22 };
  }
  const h = _.toNumber(params.h) || size[1] || 100;
  return { dx: 0, dy: -h * 0.5 };
};
const HANDS_BUSY = [
  MOTION_TEXT_DIG,
  MOTION_TEXT_WELD,
  MOTION_TEXT_DRILL,
  MOTION_TEXT_CARRY,
  MOTION_TEXT_DRAG,
  MOTION_TEXT_LIFT,
  MOTION_TEXT_PHONE,
  MOTION_TEXT_PAINT,
  MOTION_TEXT_DRINK,
  MOTION_TEXT_SWEEP_LIGHT,
  MOTION_TEXT_PUSH,
  MOTION_TEXT_CLIMB,
  MOTION_TEXT_CRAWL,
  MOTION_TEXT_SWIM,
  MOTION_TEXT_TYPE,
  MOTION_TEXT_SIT_EAT,
  MOTION_TEXT_RIDE_MOTO,
  MOTION_TEXT_RIDE_PASSENGER,
  MOTION_TEXT_RIDE_BIKE,
  MOTION_TEXT_DRIVE,
];
const ACTION_TOOL_ASSETS: Record<string, string[]> = { dig: [MOTION_TEXT_PICKAXE], sweep_light: [MOTION_TEXT_FLASHLIGHT], drill: [MOTION_TEXT_POWER_DRILL], phone: [MOTION_TEXT_SMARTPHONE, MOTION_TEXT_TELEPHONE], drink: [MOTION_TEXT_WINE_BOTTLE], carry: [MOTION_TEXT_MONEY_BAG, MOTION_TEXT_DUFFEL_BAG], drag: [MOTION_TEXT_MONEY_BAG, MOTION_TEXT_DUFFEL_BAG] };
const SEATED = [MOTION_TEXT_SIT, MOTION_TEXT_SIT_EAT, MOTION_TEXT_TYPE];
const KEEP_IF_BUILTIN = [MOTION_TEXT_FURNITURE, MOTION_TEXT_PROP, MOTION_TEXT_VEHICLE, MOTION_TEXT_ANIMAL, MOTION_TEXT_AIRCRAFT, MOTION_TEXT_WATERCRAFT];
const PERSONAL_SPACE = 95;
interface StagedActor {
  src: MotionBeatActor;
  action: string;
  then?: string;
  move: string;
  lane: LaneName;
  x: number;
  shortWalk: boolean;
  hold?: string;
  facing?: "left" | "right";
}
interface StagedItem {
  src: MotionBeatProp;
  lane: LaneName;
  x: number;
  scale?: number;
  halfW: number;
  furniture: boolean;
}
const fixLane = (lane: string | undefined, allowed: string[] | undefined, fallback: LaneName): LaneName => {
  const want = (_.includes(LANES_ORDERED, lane) ? lane : fallback) as LaneName;
  if (!allowed?.length || _.includes(allowed, want)) return want;
  return _.minBy(allowed as LaneName[], (l) => Math.abs((LANE_INDEX[l] ?? 2) - (LANE_INDEX[want] ?? 2))) || fallback;
};
const stageScene = (beat: MotionBeat, frame: Frame): { actors: StagedActor[]; items: StagedItem[] } => {
  const info = loadMotionEngine().registryInfo;
  const envInfo = info.envs[beat.env || MOTION_TEXT_CITY_STREET] || { width: 3200 };
  const assets = info.assets;
  const { cx, vw } = frame;
  const spread = vw * 0.78;
  const xOf = (pos: number) => cx + (pos - 0.5) * spread;
  const rawActors = beat.actors || [];
  const actors: StagedActor[] = _.map(rawActors, (a, i) => {
    const pos = a.pos == null ? (rawActors.length <= 1 ? 0.5 : 0.25 + (0.5 * i) / Math.max(1, rawActors.length - 1)) : _.clamp(a.pos, 0, 1);
    const action = a.action || MOTION_TEXT_STAND;
    let move: string = a.move || MOTION_TEXT_STAY;
    let shortWalk = false;
    if (move === MOTION_TEXT_STAY && _.includes(LOCOMOTION, action)) {
      move = a.facing === MOTION_TEXT_LEFT || (a.facing !== MOTION_TEXT_RIGHT && pos > 0.5) ? MOTION_TEXT_RIGHT_TO_LEFT : MOTION_TEXT_LEFT_TO_RIGHT;
      shortWalk = true;
    }
    return { src: a, action, then: a.then, move, lane: fixLane(a.lane, envInfo.lanes, MOTION_TEXT_FRONT), x: xOf(pos), shortWalk, facing: a.facing, hold: a.hold };
  });
  const busy = (a: StagedActor) => _.includes(HANDS_BUSY, a.action) || (!!a.then && _.includes(HANDS_BUSY, a.then));
  const SELF_MOVING = [MOTION_TEXT_VEHICLE, MOTION_TEXT_AIRCRAFT, MOTION_TEXT_WATERCRAFT, MOTION_TEXT_ANIMAL, MOTION_TEXT_FX, MOTION_TEXT_SKY];
  const rawProps = _.map(beat.props || [], (p) => {
    const cat = assets[p.asset]?.category || "";
    if (p.move && p.move !== MOTION_TEXT_STAY && !p.riders?.length && !_.includes(SELF_MOVING, cat)) {
      const dir = p.move;
      const carrier = _.minBy(
        _.filter(actors, (x) => x.move === dir || (dir === MOTION_TEXT_LEFT_TO_RIGHT && /right/.test(x.move)) || (dir === MOTION_TEXT_RIGHT_TO_LEFT && /left/.test(x.move))),
        (x) => Math.abs(x.x - xOf(p.pos == null ? 0.5 : p.pos)),
      );
      return { ...p, move: MOTION_TEXT_STAY, pos: carrier ? _.clamp(0.5 + (carrier.x - cx) / spread, 0, 1) : p.pos };
    }
    return p;
  });
  const tools = new Set(_.flatMap(actors, (a) => [...(ACTION_TOOL_ASSETS[a.action] || []), ...(a.then ? ACTION_TOOL_ASSETS[a.then] || [] : [])]));
  let props = _.filter(rawProps, (p) => {
    if (!assets[p.asset]) return true;
    if ((p.move && p.move !== MOTION_TEXT_STAY) || p.riders?.length) return true;
    const cat = assets[p.asset]?.category || "";
    if (_.includes(envInfo.builtins || [], p.asset) && !_.includes(KEEP_IF_BUILTIN, cat) && _.isEmpty(p.params) && _.isEmpty(p.anim) && p.asset !== beat.focus) return false;
    if (tools.has(p.asset)) return false;
    return true;
  });
  const explicitHolds = new Set(_.compact(_.map(actors, (a) => a.hold)));
  props = _.reject(props, (p) => explicitHolds.has(p.asset) && (!p.params || _.isEmpty(p.params)) && p.asset !== beat.focus);
  const hiddenObject = /(trong túi|giấu|cất kín|bí mật mang|in (his|her|a) pocket|hidden|conceal)/i.test(beat.narration || "");
  props = _.filter(props, (p) => {
    if (explicitHolds.size || hiddenObject) return true;
    const a = assets[p.asset];
    if (!a?.holdable || (p.move && p.move !== MOTION_TEXT_STAY)) return true;
    const px = xOf(p.pos == null ? 0.5 : p.pos);
    const near = _.filter(actors, (x) => Math.abs(x.x - px) <= Math.max(110, spread * 0.15));
    const free = _.filter(near, (x) => !x.hold && !busy(x));
    if (!free.length) return true;
    const best = _.minBy(free, (x) => Math.abs(x.x - px) + (x.lane === MOTION_TEXT_FRONT ? 0 : 40))!;
    best.hold = p.asset;
    return false;
  });
  if (hiddenObject) props = _.reject(props, (p) => !!assets[p.asset]?.holdable && _.isEmpty(p.params) && p.asset !== beat.focus);
  const items: StagedItem[] = _.map(props, (p) => {
    const a = assets[p.asset] || {};
    const size = a.size || [200, 100];
    const moving = !!(p.move && p.move !== MOTION_TEXT_STAY);
    const scale = p.scale ?? (a.realSize && !moving ? +(a.realSize / Math.max(size[0], size[1], 1)).toFixed(3) : undefined);
    const halfW = ((size[0] || 200) * (scale || 1)) / 2;
    return { src: p, lane: fixLane(p.lane, envInfo.lanes, MOTION_TEXT_MID), x: xOf(p.pos == null ? 0.5 : _.clamp(p.pos, 0, 1)), scale, halfW, furniture: !moving && (a.category === MOTION_TEXT_FURNITURE || (size[0] || 0) * (scale || 1) >= 150) };
  });
  for (const a of actors) {
    if (a.move !== MOTION_TEXT_STAY) continue;
    for (const it of items) {
      if (!it.furniture || it.lane !== a.lane) continue;
      if (Math.abs(a.x - it.x) > it.halfW + 25) continue;
      const laneOk = (i: number) => i >= 0 && i <= 2 && (!envInfo.lanes?.length || _.includes(envInfo.lanes, LANES_ORDERED[i]));
      const worksThere = _.includes(SEATED, a.action) || _.includes([MOTION_TEXT_STAND, MOTION_TEXT_IDLE, MOTION_TEXT_TALK, MOTION_TEXT_THINK, MOTION_TEXT_HANDS_POCKET, MOTION_TEXT_LOOK_AROUND, MOTION_TEXT_PHONE], a.action);
      const fwd = LANE_INDEX[it.lane] + 1;
      const behind = LANE_INDEX[a.lane] - 1;
      if (worksThere && laneOk(fwd)) it.lane = LANES_ORDERED[fwd];
      else if (worksThere && laneOk(behind)) a.lane = LANES_ORDERED[behind];
      else a.x = a.x <= it.x ? it.x - it.halfW - 45 : it.x + it.halfW + 45;
    }
  }
  const standing = _.filter(actors, (a) => a.move === MOTION_TEXT_STAY);
  for (let i = 0; i < standing.length; i++)
    for (let j = 0; j < i; j++) {
      const a = standing[i],
        b = standing[j];
      if (Math.abs(LANE_INDEX[a.lane] - LANE_INDEX[b.lane]) <= 1 && Math.abs(a.x - b.x) < 75) a.x = b.x + (a.x >= b.x ? 85 : -85);
    }
  const safeStory = beat.env === MOTION_TEXT_BANK_VAULT || /(két|tủ sắt|kho tiền|hầm tiền|\bsafes?\b|vault|strongbox)/i.test(beat.narration || "");
  for (const a of actors) {
    if (!safeStory || (a.action !== MOTION_TEXT_DRILL && a.action !== MOTION_TEXT_WELD && a.then !== MOTION_TEXT_DRILL && a.then !== MOTION_TEXT_WELD) || a.move !== MOTION_TEXT_STAY) continue;
    const face = a.facing === MOTION_TEXT_LEFT ? -1 : a.facing === MOTION_TEXT_RIGHT ? 1 : a.x <= cx ? 1 : -1;
    a.facing = face > 0 ? MOTION_TEXT_RIGHT : MOTION_TEXT_LEFT;
    items.push({ src: { asset: MOTION_TEXT_SAFE_DEPOSIT_WALL, move: MOTION_TEXT_STAY, params: { w: 150, h: 190, opened: 0.35, seed: Math.round(a.x) } }, lane: a.lane, x: a.x + face * 115, halfW: 75, furniture: true });
  }
  const SEATS = [MOTION_TEXT_CHAIR, MOTION_TEXT_SOFA, MOTION_TEXT_BENCH, MOTION_TEXT_THRONE, MOTION_TEXT_BED, MOTION_TEXT_AIRPLANE_SEAT, MOTION_TEXT_HOSPITAL_BED];
  for (const a of actors) {
    if (a.move !== MOTION_TEXT_STAY || !(_.includes(SEATED, a.action) || (a.then && _.includes(SEATED, a.then)))) continue;
    if (_.some(items, (it) => _.includes(SEATS, it.src.asset) && Math.abs(it.x - a.x) < 90)) continue;
    if (_.includes(envInfo.builtins || [], MOTION_TEXT_CHAIR) && beat.env === MOTION_TEXT_OFFICE) continue;
    const face = a.facing || (a.x < cx - 30 ? MOTION_TEXT_RIGHT : a.x > cx + 30 ? MOTION_TEXT_LEFT : MOTION_TEXT_RIGHT);
    a.facing = face;
    items.push({ src: { asset: MOTION_TEXT_CHAIR, move: MOTION_TEXT_STAY, facing: face }, lane: a.lane, x: a.x, scale: 1, halfW: 35, furniture: false });
  }
  for (const a of actors) {
    if (a.action !== MOTION_TEXT_DIG && a.then !== MOTION_TEXT_DIG) continue;
    if (_.some(items, (it) => it.src.asset === MOTION_TEXT_RUBBLE && Math.abs(it.x - a.x) < 260)) continue;
    const face = a.facing === MOTION_TEXT_LEFT ? -1 : a.facing === MOTION_TEXT_RIGHT ? 1 : a.x <= cx ? 1 : -1;
    a.facing = face > 0 ? MOTION_TEXT_RIGHT : MOTION_TEXT_LEFT;
    const r = assets.rubble?.size || [200, 60];
    const sc = 0.55;
    items.push({ src: { asset: MOTION_TEXT_RUBBLE, move: MOTION_TEXT_STAY }, lane: a.lane, x: a.x + face * 85, scale: sc, halfW: (r[0] * sc) / 2, furniture: false });
  }
  return { actors, items };
};
const actorSpec = (a: StagedActor, all: StagedActor[], items: StagedItem[], frame: Frame, dur: number, index: number): Record<string, unknown> => {
  const { cx, vw } = frame;
  const out: Record<string, unknown> = { who: a.src.cast, lane: a.lane };
  if (a.hold) {
    out.hold = a.hold;
    if (a.src.holdFrom != null) out.holdFrom = a.src.holdFrom;
    if (a.src.holdUntil != null) out.holdUntil = a.src.holdUntil;
  }
  const x = a.x;
  if (a.move === MOTION_TEXT_STAY) {
    out.x = x;
    out.facing = a.facing || (x < cx - 30 ? MOTION_TEXT_RIGHT : x > cx + 30 ? MOTION_TEXT_LEFT : index % 2 ? MOTION_TEXT_LEFT : MOTION_TEXT_RIGHT);
    out.action = a.action;
    if (a.then)
      out.actions = [
        [0, a.action],
        [0.55, a.then],
      ];
    return out;
  }
  const action = a.action;
  const locomotion = _.includes(LOCOMOTION, action) ? action : MOTION_TEXT_WALK;
  const speed = SPEED[locomotion] || 180;
  const stationary = !_.includes(LOCOMOTION, action);
  const travel = Math.min(speed * dur * 0.9, vw * (a.shortWalk ? 0.3 : 0.7));
  let from = x - travel / 2,
    to = x + travel / 2;
  if (a.shortWalk) [from, to] = a.move === MOTION_TEXT_RIGHT_TO_LEFT ? [x + travel / 2, x - travel / 2] : [x - travel / 2, x + travel / 2];
  else if (a.move === MOTION_TEXT_RIGHT_TO_LEFT) [from, to] = [to, from];
  if (a.move === MOTION_TEXT_ENTER_LEFT) [from, to] = [cx - vw / 2 - 120, x];
  if (a.move === MOTION_TEXT_ENTER_RIGHT) [from, to] = [cx + vw / 2 + 120, x];
  if (a.move === MOTION_TEXT_EXIT_RIGHT) [from, to] = [x, cx + vw / 2 + 160];
  if (a.move === MOTION_TEXT_EXIT_LEFT) [from, to] = [x, cx - vw / 2 - 160];
  if (a.move === MOTION_TEXT_TOWARD_CENTER) [from, to] = [x, cx + (x < cx ? -60 : 60)];
  const dir = to >= from ? 1 : -1;
  const exiting = a.move === MOTION_TEXT_EXIT_LEFT || a.move === MOTION_TEXT_EXIT_RIGHT;
  let blocker: StagedActor | null = null;
  if (!exiting) {
    const obstacles: { x: number; gap: number; who?: StagedActor }[] = [
      ..._.map(
        _.filter(all, (o) => o !== a && o.move === MOTION_TEXT_STAY && o.lane === a.lane),
        (o) => ({ x: o.x, gap: PERSONAL_SPACE, who: o }),
      ),
      ..._.map(
        _.filter(items, (it) => it.furniture && (it.lane === a.lane || LANE_INDEX[it.lane] === LANE_INDEX[a.lane] + 1)),
        (it) => ({ x: it.x, gap: it.halfW + 45 }),
      ),
    ];
    const ahead = _.filter(obstacles, (o) => (o.x - from) * dir > 30 && (o.x - to) * dir < o.gap);
    const first = _.minBy(ahead, (o) => (o.x - dir * o.gap - from) * dir);
    if (first) {
      to = first.x - dir * first.gap;
      if ((to - from) * dir < 140) from = to - dir * 140;
      blocker = first.who || null;
    }
  }
  const dist = Math.abs(to - from);
  const stops = !!blocker || stationary || _.includes([MOTION_TEXT_ENTER_LEFT, MOTION_TEXT_ENTER_RIGHT, MOTION_TEXT_TOWARD_CENTER], a.move) || (a.move !== MOTION_TEXT_EXIT_LEFT && a.move !== MOTION_TEXT_EXIT_RIGHT && dist < travel - 1);
  let arrive = stops ? Math.min(1, dist / Math.max(1, speed * dur)) : 1;
  if (stationary || _.includes([MOTION_TEXT_ENTER_LEFT, MOTION_TEXT_ENTER_RIGHT, MOTION_TEXT_TOWARD_CENTER], a.move)) arrive = Math.min(arrive, 0.62);
  if (stops) arrive = Math.max(0.35, arrive);
  out.path =
    arrive < 0.97
      ? [
          [0, from],
          [arrive, to],
          [1, to],
        ]
      : [
          [0, from],
          [1, to],
        ];
  const settle = stationary ? action : a.then || (arrive < 0.97 ? MOTION_TEXT_STAND : undefined);
  if (settle && arrive < 0.97)
    out.actions = [
      [0, locomotion],
      [arrive, settle],
    ];
  else if (a.then)
    out.actions = [
      [0, action],
      [0.7, a.then],
    ];
  else out.action = action;
  if (blocker && !blocker.facing) blocker.facing = dir > 0 ? MOTION_TEXT_LEFT : MOTION_TEXT_RIGHT;
  return out;
};
const crowdSpec = (c: MotionBeatCrowd, frame: Frame, dur: number, index: number): Record<string, unknown> => {
  const { cx, vw } = frame;
  const x = cx + ((c.pos == null ? (index % 2 ? 0.7 : 0.3) : c.pos) - 0.5) * vw * 0.9;
  const action = c.action || (c.move && c.move !== MOTION_TEXT_STAY ? MOTION_TEXT_WALK : MOTION_TEXT_STAND);
  const out: Record<string, unknown> = {
    who: c.cast || c.character,
    count: _.clamp(Math.round(_.toNumber(c.count) || 60), 4, 4000),
    formation: c.formation || MOTION_TEXT_BLOCK,
    action,
    lane: c.lane || MOTION_TEXT_BACK,
    banners: c.banners !== false && (_.toNumber(c.count) || 0) >= 80,
  };
  if (c.bannerColor) out.bannerColor = c.bannerColor;
  const speed = action === MOTION_TEXT_RUN || action === MOTION_TEXT_CHARGE ? 380 : 150;
  const travel = Math.min(speed * dur, vw * 0.9);
  if (!c.move || c.move === MOTION_TEXT_STAY) {
    out.x = x;
    if (c.facing) out.facing = c.facing;
    return out;
  }
  let from = x - travel / 2,
    to = x + travel / 2;
  if (c.move === MOTION_TEXT_RIGHT_TO_LEFT || (c.move === MOTION_TEXT_ADVANCE && c.facing === MOTION_TEXT_LEFT) || (c.move === MOTION_TEXT_RETREAT && c.facing !== MOTION_TEXT_LEFT)) [from, to] = [to, from];
  out.path = [
    [0, from],
    [1, to],
  ];
  if (c.move === MOTION_TEXT_RETREAT) out.facing = c.facing === MOTION_TEXT_LEFT ? MOTION_TEXT_RIGHT : MOTION_TEXT_LEFT;
  return out;
};
const propItem = (p: MotionBeatProp, frame: Frame, dur: number, time?: string, xAt?: number): Record<string, unknown> => {
  const { cx, vw } = frame;
  const x = xAt ?? cx + ((p.pos == null ? 0.5 : p.pos) - 0.5) * vw * 0.78;
  const out: Record<string, unknown> = { asset: p.asset, lane: p.lane || MOTION_TEXT_MID };
  if (_.includes(WALL_MOUNTED, p.asset) && p.params?.y == null) out.y = -175;
  if (p.scale) out.scale = p.scale;
  if (p.facing) out.facing = p.facing;
  if (p.anim && !_.isEmpty(p.anim)) out.anim = p.anim;
  if (p.params) out.params = p.params;
  const aircraft = _.includes(AIRCRAFT, p.asset);
  if (aircraft) _.assign(out, { lane: MOTION_TEXT_BACK, y: -520 });
  const rideable = _.includes(RIDEABLE, p.asset);
  const riders = rideable ? _.take(p.riders || [], p.asset === MOTION_TEXT_BICYCLE ? 1 : 2) : [];
  const moving = p.move && p.move !== MOTION_TEXT_STAY && (!rideable || riders.length > 0);
  if (riders.length) out.riders = _.map(riders, (who, i) => ({ who, seat: i === 0 ? MOTION_TEXT_DRIVER : MOTION_TEXT_PASSENGER }));
  if (!moving) {
    out.x = x;
    return out;
  }
  const speed = VEHICLE_SPEED[p.asset] || 500;
  const travel = Math.max(vw * 1.1, Math.min(speed * dur, vw * 2.4));
  let from = cx - travel / 2,
    to = cx + travel / 2;
  if (p.move === MOTION_TEXT_RIGHT_TO_LEFT) [from, to] = [to, from];
  out.path = [
    [0, from],
    [1, to],
  ];
  const dark = _.includes([MOTION_TEXT_NIGHT, MOTION_TEXT_DUSK, MOTION_TEXT_INTERIOR_DARK], time);
  if (_.includes([MOTION_TEXT_CAR_SEDAN, MOTION_TEXT_CAR_VINTAGE, MOTION_TEXT_POLICE_CAR, MOTION_TEXT_TAXI, MOTION_TEXT_VAN, MOTION_TEXT_TRUCK, MOTION_TEXT_ARMORED_TRUCK, MOTION_TEXT_BUS, MOTION_TEXT_MOTORBIKE, MOTION_TEXT_SCOOTER], p.asset) && p.params?.lights == null) out.params = _.assign({}, p.params || {}, { lights: dark });
  return out;
};
const pickTransition = (beat: MotionBeat, prev: MotionBeat | undefined, index: number): { type: string; duration: number } => {
  if (index === 0) return { type: MOTION_TEXT_FADE, duration: 0.9 };
  if (!prev) return { type: MOTION_TEXT_CUT, duration: 0 };
  if (beat.visual === MOTION_TEXT_CHAPTER || beat.chapterId !== prev.chapterId) return { type: MOTION_TEXT_DIP, duration: 0.9 };
  if (beat.visual === MOTION_TEXT_ENDING) return { type: MOTION_TEXT_FADE, duration: 1.2 };
  const isScene = beat.visual === MOTION_TEXT_SCENE,
    wasScene = prev.visual === MOTION_TEXT_SCENE;
  if (!isScene || !wasScene) return { type: MOTION_TEXT_FADE, duration: NON_SCENE_TRANSITION_IN };
  if (beat.env !== prev.env) return beat.time !== prev.time ? { type: MOTION_TEXT_DIP, duration: 0.6 } : { type: MOTION_TEXT_FADE, duration: 0.5 };
  return index % 5 === 0 ? { type: MOTION_TEXT_PUSH, duration: 0.45 } : { type: MOTION_TEXT_CUT, duration: 0 };
};
const compileDrawnBeatParams = (beat: MotionBeat, analysis: MotionStoryAnalysis | null, aspect: string, dur: number, prevShot?: string): Pick<MotionShot, "template" | "params" | "overlays"> => {
  const d = (beat.data || {}) as Record<string, any>;
  const envBg = (env?: string, time?: string) => (env ? { env, envParams: { time: time || MOTION_TEXT_NIGHT } } : {});
  switch (beat.visual) {
    case MOTION_TEXT_SCENE: {
      const { frame, camera } = frameFor(beat, aspect, prevShot);
      const staged = stageScene(beat, frame);
      const focusIdx0 = beat.focus ? _.findIndex(staged.items, (it) => it.src.asset === beat.focus) : -1;
      if (beat.shot === MOTION_TEXT_INSERT && focusIdx0 >= 0) {
        const it = staged.items[focusIdx0];
        const fp = focusPoint(it.src.asset, it.src.params || {});
        const g = LANE_GEOMETRY[it.lane] || LANE_GEOMETRY.mid;
        const fx = it.x + fp.dx * (it.scale || 1) * g.s;
        staged.actors = _.filter(staged.actors, (a) => a.action === MOTION_TEXT_REACH || a.action === MOTION_TEXT_LIFT || !!a.hold || a.then === MOTION_TEXT_REACH);
        for (const a of staged.actors) {
          const face = a.facing === MOTION_TEXT_LEFT ? -1 : 1;
          a.facing = face > 0 ? MOTION_TEXT_RIGHT : MOTION_TEXT_LEFT;
          a.move = MOTION_TEXT_STAY;
          a.shortWalk = false;
          a.lane = LANE_INDEX[it.lane] < 2 ? LANES_ORDERED[LANE_INDEX[it.lane] + 1] : it.lane;
          a.x = fx - face * 78;
        }
      }
      for (const it of staged.items) {
        const content = _.toString(it.src.params?.content || "");
        if (!content) continue;
        const giver = _.find(staged.actors, (a) => a.hold === content && a.src.holdUntil != null);
        if (!giver) continue;
        const hu = _.clamp(_.toNumber(giver.src.holdUntil), 0.02, 1);
        it.src = {
          ...it.src,
          anim: {
            ...(it.src.anim || {}),
            showContent: [
              [0, 0],
              [hu - 0.01, 0],
              [hu, 1],
            ],
          },
        };
      }
      const order = _.sortBy(_.range(staged.actors.length), (i) => (staged.actors[i].move === MOTION_TEXT_STAY ? 1 : 0));
      const specs: Record<string, unknown>[] = [];
      for (const i of order) specs[i] = actorSpec(staged.actors[i], staged.actors, staged.items, frame, dur, i);
      _.forEach(staged.actors, (a, i) => {
        if (a.move === MOTION_TEXT_STAY && a.facing) specs[i].facing = a.facing;
      });
      const actors = specs;
      const items = _.map(staged.items, (it) => propItem({ ...it.src, lane: it.lane, scale: it.scale }, frame, dur, beat.time, it.x));
      const focusIdx = beat.focus ? _.findIndex(staged.items, (it) => it.src.asset === beat.focus) : -1;
      if (focusIdx >= 0 && (beat.shot === MOTION_TEXT_INSERT || beat.shot === MOTION_TEXT_CLOSE || beat.shot === MOTION_TEXT_PUSH_IN)) {
        const it = staged.items[focusIdx];
        items[focusIdx].id = MOTION_TEXT_FOCUS;
        const fp = focusPoint(it.src.asset, it.src.params || {});
        const laneInfo = LANE_GEOMETRY[it.lane] || LANE_GEOMETRY.mid;
        const k = (it.scale || 1) * laneInfo.s;
        for (const key of [MOTION_TEXT_MOVE, MOTION_TEXT_DRIFT, MOTION_TEXT_AMOUNT, MOTION_TEXT_X]) delete camera[key];
        Object.assign(camera, { follow: MOTION_TEXT_FOCUS, zoom: frame.zoom, offset: fp.dx * k, y: laneInfo.y + fp.dy * k });
        if (beat.shot === MOTION_TEXT_PUSH_IN) Object.assign(camera, { zoomTo: frame.zoom * 1.25 });
      }
      if (beat.shot === MOTION_TEXT_FOLLOW) {
        const mover = _.find(actors, (a) => !!a.path) || _.find(items, (it) => !!it.path);
        if (mover) {
          mover.id = MOTION_TEXT_FOLLOW_TARGET;
          for (const k of [MOTION_TEXT_MOVE, MOTION_TEXT_DRIFT, MOTION_TEXT_AMOUNT, MOTION_TEXT_X]) delete camera[k];
          _.assign(camera, { follow: MOTION_TEXT_FOLLOW_TARGET, zoom: frame.zoom, offset: 0 });
        }
      }
      const params: Record<string, unknown> = { ...(beat.sceneParams || {}), env: beat.env, time: beat.time, camera, actors, items };
      if (beat.sceneAnim && !_.isEmpty(beat.sceneAnim)) params.anim = beat.sceneAnim;
      const envLanes = loadMotionEngine().registryInfo.envs[beat.env || MOTION_TEXT_CITY_STREET]?.lanes;
      if (beat.crowds?.length) params.crowds = _.map(_.take(beat.crowds, 4), (c, i) => crowdSpec({ ...c, lane: fixLane(c.lane, envLanes, MOTION_TEXT_BACK) as MotionBeatCrowd["lane"] }, frame, dur, i));
      if (beat.weather && beat.weather !== MOTION_TEXT_NONE) {
        if (beat.weather === MOTION_TEXT_FOG) params.fog = 0.5;
        else params.weather = beat.weather;
      }
      const overlays = beat.label ? [{ type: MOTION_TEXT_TAG, text: beat.label, at: 0.5, duration: Math.max(1.6, Math.min(4.5, dur - 1)) }] : undefined;
      return { template: MOTION_TEXT_SCENE, params, overlays };
    }
    case MOTION_TEXT_TITLE:
      return { template: MOTION_TEXT_TITLE, params: { kicker: d.kicker || "", title: d.title || analysis?.title || "", subtitle: d.subtitle || "", env: d.env || MOTION_TEXT_CITY_STREET, envParams: { time: d.time || MOTION_TEXT_NIGHT, camera: { move: MOTION_TEXT_PAN, distance: 260 } } } };
    case MOTION_TEXT_CHAPTER:
      return { template: MOTION_TEXT_CHAPTER, params: { number: d.number ?? "", title: d.title || "", label: d.label, ...envBg(d.env, d.time) } };
    case MOTION_TEXT_QUOTE:
      return { template: MOTION_TEXT_QUOTE, params: { text: d.text || beat.narration, author: d.author || "", highlight: _.castArray(d.highlight || []), ...envBg(d.env, d.time) } };
    case MOTION_TEXT_STATS:
      return {
        template: MOTION_TEXT_STATS,
        params: {
          title: d.title || "",
          items: _.take(
            _.map(_.castArray(d.items || []), (it: any) => ({ value: _.toNumber(it?.value) || 0, prefix: _.toString(it?.prefix || ""), suffix: _.toString(it?.suffix || ""), label: _.toString(it?.label || ""), decimals: _.toNumber(it?.decimals) || 0 })),
            4,
          ),
          ...envBg(d.env, d.time),
        },
      };
    case MOTION_TEXT_COUNTER:
      return { template: MOTION_TEXT_COUNTER, params: { from: _.toNumber(d.from) || 0, to: _.isFinite(_.toNumber(d.to)) ? _.toNumber(d.to) : 100, label: d.label || "", format: d.format === MOTION_TEXT_CLOCK ? MOTION_TEXT_CLOCK : undefined, tick: d.tick !== false, ...envBg(d.env, d.time) } };
    case MOTION_TEXT_OBJECT:
      return { template: MOTION_TEXT_OBJECT, params: { asset: d.asset || MOTION_TEXT_DOCUMENTS, params: _.isPlainObject(d.params) ? d.params : {}, caption: d.caption || "", scale: _.toNumber(d.scale) || 3 } };
    case MOTION_TEXT_MAP:
      return {
        template: MOTION_TEXT_MAP,
        params: {
          title: d.title || "",
          note: MOTION_TEXT_SO_DO_MINH_HOA,
          points: _.map(_.castArray(d.points || []), (p: any, i: number, arr: any[]) => ({ id: _.toString(p?.id || MOTION_TEMPLATE_P(`${i}`)), x: _.clamp(_.toNumber(p?.x) || 0.5, 0.05, 0.95), y: _.clamp(_.toNumber(p?.y) || 0.5, 0.08, 0.92), label: _.toString(p?.label || ""), sub: p?.sub, at: 0.05 + (0.5 * i) / Math.max(1, arr.length) })),
          routes: _.map(_.castArray(d.routes || []), (r: any, i: number) => ({ from: _.toString(r?.from), to: _.toString(r?.to), at: 0.2 + i * 0.15, dur: 0.35, bend: 0.12 })),
        },
      };
    case MOTION_TEXT_TIMELINE:
      return {
        template: MOTION_TEXT_TIMELINE,
        params: {
          title: d.title || "",
          events: _.take(
            _.map(_.castArray(d.events || []), (e: any) => ({ label: _.toString(e?.date || e?.label || ""), text: _.toString(e?.text || "") })),
            5,
          ),
        },
      };
    case MOTION_TEXT_HEADLINE:
      return { template: MOTION_TEXT_HEADLINE, params: { paper: d.paper || MOTION_TEXT_NHAT_BAO, date: d.date || "", headline: d.headline || beat.narration.slice(0, 60), sub: d.sub || "" } };
    case MOTION_TEXT_ENDING:
      return { template: MOTION_TEXT_ENDING, params: { text: d.text || beat.narration, sub: d.sub || "", env: d.env || MOTION_TEXT_NIGHT_SKY } };
    default:
      return { template: MOTION_TEXT_QUOTE, params: { text: beat.narration } };
  }
};
const ART_SCENE_VISUALS = [MOTION_TEXT_SCENE, MOTION_TEXT_OBJECT];
const ART_BG_VISUALS = [MOTION_TEXT_TITLE, MOTION_TEXT_ENDING, MOTION_TEXT_CHAPTER, MOTION_TEXT_QUOTE, MOTION_TEXT_STATS, MOTION_TEXT_COUNTER];
const artSeed = (id: string): number => _.reduce(_.toString(id).split(""), (h, ch) => (h * 31 + ch.charCodeAt(0)) % 997, 7);
const compileBeatParams = (beat: MotionBeat, analysis: MotionStoryAnalysis | null, aspect: string, dur: number, prevShot?: string): Pick<MotionShot, "template" | "params" | "overlays"> => {
  const art = beat.art;
  const hasArt = !!art?.image && !art.failed;
  if (hasArt && _.includes(ART_SCENE_VISUALS, beat.visual)) {
    const d = (beat.data || {}) as Record<string, any>;
    const tag = beat.visual === MOTION_TEXT_OBJECT ? _.toString(d.caption || "") : _.toString(beat.label || "");
    const overlays = tag ? [{ type: MOTION_TEXT_TAG, text: tag, at: 0.5, duration: Math.max(1.6, Math.min(4.5, dur - 1)) }] : undefined;
    return { template: MOTION_TEXT_ILLUSTRATION, params: { src: art!.image, move: art!.move || MOTION_TEXT_PUSH_IN, focus: art!.focus, fx: art!.fx || MOTION_TEXT_DUST, seed: artSeed(beat.id) }, overlays };
  }
  const base = compileDrawnBeatParams(beat, analysis, aspect, dur, prevShot);
  if (hasArt && _.includes(ART_BG_VISUALS, beat.visual)) base.params = { ...(base.params || {}), bgImage: art!.image, bgFocus: art!.focus, bgMove: art!.move || MOTION_TEXT_PUSH_IN };
  return base;
};
const beatParts = (beat: MotionBeat): MotionBeat[] => {
  const shots = _.filter(beat.shots || [], (sh) => !!sh && !!sh.visual);
  const part = (sh: (typeof shots)[number], id: string, k: number): MotionBeat => ({ ..._.omit(sh, [MOTION_TEXT_TEXT]), id, chapterId: beat.chapterId, narration: sh.text || beat.narration, emphasis: k === 0 ? beat.emphasis : undefined });
  if (shots.length < 2) return shots.length === 1 ? [part(shots[0], beat.id, 0)] : [beat];
  return _.map(_.take(shots, 4), (sh, k) => part(sh, MOTION_TEMPLATE_S_2(`${beat.id}`, `${k + 1}`), k));
};
export interface CompiledStory {
  spec: MotionSpec;
  starts: number[];
  ends: number[];
  sfxCues: { t: number; kind: "hit" | "rise" | "chapter" }[];
}
export const compileStorySpec = (script: MotionStoryScript, analysis: MotionStoryAnalysis | null, opts: { aspect: string; durations?: number[]; look?: string; accent?: string }): CompiledStory => {
  const beats = script.beats;
  if (_.isEmpty(beats)) throw new Error(MOTION_TEXT_KICH_BAN_CHUA_CO_BEAT_NAO);
  const durations = _.map(beats, (b, i) => opts.durations?.[i] || b.duration || estimateBeatSeconds(b, script.language));
  const { starts, ends, total } = computeBeatTimeline(beats, durations);
  const lead = MOTION_STORY_CONFIG.LEAD_SECONDS;
  const shotStarts = _.map(starts, (s, i) => (i === 0 ? 0 : Math.max(0, s - lead)));
  const shots: MotionShot[] = [];
  const subtitles: { start: number; end: number; text: string }[] = [];
  const sfxCues: CompiledStory["sfxCues"] = [];
  let prevShot: string | undefined;
  beats.forEach((beat, i) => {
    const start = shotStarts[i];
    let end = i + 1 < beats.length ? shotStarts[i + 1] : total;
    if (end - start < MOTION_STORY_CONFIG.MIN_SHOT_SECONDS && i + 1 < beats.length) end = start + MOTION_STORY_CONFIG.MIN_SHOT_SECONDS;
    const parts = beatParts(beat);
    if (parts.length <= 1) {
      const dur = end - start;
      const compiled = compileBeatParams(parts[0] || beat, analysis, opts.aspect, dur, prevShot);
      prevShot = (parts[0] || beat).shot;
      shots.push({ id: beat.id, start: +start.toFixed(3), end: +end.toFixed(3), ...compiled, transition: pickTransition(parts[0] || beat, beats[i - 1], i) });
    } else {
      const weights = _.map(parts, (pt) => Math.max(2, countUnits(pt.narration)));
      const total = _.sum(weights);
      const speech = Math.max(0.5, ends[i] - starts[i]);
      let acc = 0;
      const cuts = _.map(weights, (w) => {
        acc += w;
        return acc / total;
      });
      parts.forEach((pt, k) => {
        const s0 = k === 0 ? start : Math.max(start + 0.8, starts[i] + speech * cuts[k - 1] - lead);
        const s1 = k === parts.length - 1 ? end : Math.max(s0 + 0.8, starts[i] + speech * cuts[k] - lead);
        const compiled = compileBeatParams(pt, analysis, opts.aspect, s1 - s0, prevShot);
        const prevPart = k === 0 ? beats[i - 1] : parts[k - 1];
        const transition = k === 0 ? pickTransition(pt, prevPart, i) : pt.env !== prevPart?.env || pt.visual !== prevPart?.visual ? { type: MOTION_TEXT_FADE, duration: 0.35 } : { type: MOTION_TEXT_CUT, duration: 0 };
        prevShot = pt.shot;
        shots.push({ id: MOTION_TEMPLATE_S_2(`${beat.id}`, `${k + 1}`), start: +s0.toFixed(3), end: +s1.toFixed(3), ...compiled, transition });
      });
    }
    if (!_.includes([MOTION_TEXT_TITLE, MOTION_TEXT_QUOTE, MOTION_TEXT_ENDING, MOTION_TEXT_HEADLINE], beat.visual)) subtitles.push(...buildSubtitles(beat, starts[i], ends[i]));
    if (beat.emphasis) sfxCues.push({ t: starts[i], kind: MOTION_TEXT_HIT });
    if (i > 0 && beat.chapterId !== beats[i - 1].chapterId) sfxCues.push({ t: start, kind: MOTION_TEXT_CHAPTER });
  });
  for (let i = 1; i < shots.length; i++) if (shots[i].start < shots[i - 1].end) shots[i - 1].end = shots[i].start;
  const artSrcs = _.map(shots, (sh) => (sh.template === MOTION_TEXT_ILLUSTRATION ? _.toString(sh.params?.src || "") : ""));
  if (_.some(artSrcs)) {
    shots.forEach((sh, i) => {
      if (!_.includes([MOTION_TEXT_STATS, MOTION_TEXT_QUOTE, MOTION_TEXT_COUNTER, MOTION_TEXT_CHAPTER], sh.template) || sh.params?.bgImage) return;
      const prev = _.findLast(artSrcs.slice(0, i), Boolean);
      const next = _.find(artSrcs.slice(i + 1), Boolean);
      const src = prev || next;
      if (src) sh.params = { ...(sh.params || {}), bgImage: src, bgMove: MOTION_TEXT_STILL };
    });
  }
  for (let i = 1; i < shots.length; i++) if (shots[i].template === MOTION_TEXT_ILLUSTRATION && shots[i - 1].template === MOTION_TEXT_ILLUSTRATION && (!shots[i].transition || shots[i].transition!.type === MOTION_TEXT_CUT)) shots[i].transition = { type: MOTION_TEXT_FADE, duration: 0.45 };
  const cast: MotionSpec["cast"] = {};
  for (const c of analysis?.cast || []) cast[c.key] = { characterId: c.characterId, overrides: _.assign({ name: c.name }, c.overrides || {}) };
  const spec: MotionSpec = {
    title: script.title || analysis?.title,
    aspect: opts.aspect,
    fps: 30,
    look: opts.look || analysis?.look || MOTION_TEXT_DOCUMENTARY,
    accent: opts.accent || analysis?.accent || MOTION_TEXT_FFB070,
    subtitleStyle: MOTION_TEXT_CINEMA,
    cast,
    shots,
    subtitles,
    duration: +total.toFixed(3),
  };
  return { spec, starts, ends, sfxCues };
};
