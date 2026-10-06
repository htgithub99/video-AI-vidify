import {
  MOTION_TEMPLATE_ALREADY_CONTAINS_A_PARKED_NEVER_ADD_PROPS_CLIMB,
  MOTION_TEMPLATE_AN_PROP_BECOMES_A_FULL,
  MOTION_TEMPLATE_BY_THE,
  MOTION_TEMPLATE_CHARACTER_ROLES_THE_DIRECTOR_SEATS_ARMS_AND_PLACES,
  MOTION_TEMPLATE_DOOR,
  MOTION_TEMPLATE_LIE_ON_THE,
  MOTION_TEMPLATE_OVERLAPPED,
  MOTION_TEMPLATE_PULLED_INTO_FRAME,
  MOTION_TEMPLATE_ROWS_OF,
  MOTION_TEMPLATE_SITS_AT_THE,
  MOTION_TEMPLATE_SITTING_USES,
  MOTION_TEMPLATE_STAGING,
  MOTION_TEMPLATE_STANDING_PEOPLE_USE_LANE,
  MOTION_TEMPLATE_STANDS,
  MOTION_TEMPLATE_STAY_SEATED,
  MOTION_TEMPLATE_SYMBOL_46,
  MOTION_TEMPLATE_TAKE_COVER_USES,
  MOTION_TEXT_AFRAID,
  MOTION_TEXT_AIM,
  MOTION_TEXT_AMOUNT,
  MOTION_TEXT_ARMED_WITH_GUNS_POLICE_SPECIAL_FORCES_SOLDIERS_GANGSTERS,
  MOTION_TEXT_AT_THE_FRONT,
  MOTION_TEXT_AUTO_FILLED_WITH_BACKGROUND_PEOPLE,
  MOTION_TEXT_BACK,
  MOTION_TEXT_BED,
  MOTION_TEXT_BEHIND,
  MOTION_TEXT_BESIDE,
  MOTION_TEXT_BREACH,
  MOTION_TEXT_CHAIR,
  MOTION_TEXT_CHECK_WATCH,
  MOTION_TEXT_CIVILIAN,
  MOTION_TEXT_CLERKS_TELLERS_WAITERS,
  MOTION_TEXT_CLIMB,
  MOTION_TEXT_COCKPIT_DOOR,
  MOTION_TEXT_COOKS,
  MOTION_TEXT_CRATE,
  MOTION_TEXT_CREW,
  MOTION_TEXT_DESK,
  MOTION_TEXT_DOCTORS_NURSES,
  MOTION_TEXT_DOOR,
  MOTION_TEXT_DRIFT,
  MOTION_TEXT_DRINK,
  MOTION_TEXT_ENTER_LEFT,
  MOTION_TEXT_ENTER_RIGHT,
  MOTION_TEXT_EVAC,
  MOTION_TEXT_FALL,
  MOTION_TEXT_FEAR,
  MOTION_TEXT_FIRE,
  MOTION_TEXT_FOLLOW,
  MOTION_TEXT_FORE,
  MOTION_TEXT_FRONT,
  MOTION_TEXT_FURNITURE,
  MOTION_TEXT_GUN,
  MOTION_TEXT_GUNNER,
  MOTION_TEXT_H,
  MOTION_TEXT_HANDS_POCKET,
  MOTION_TEXT_HANDS_UP,
  MOTION_TEXT_ID,
  MOTION_TEXT_IDLE,
  MOTION_TEXT_INTERIOR,
  MOTION_TEXT_JUDGES,
  MOTION_TEXT_JUMP,
  MOTION_TEXT_KINGS_QUEENS_EMPERORS,
  MOTION_TEXT_KNOCK,
  MOTION_TEXT_LADDER,
  MOTION_TEXT_LANE,
  MOTION_TEXT_LEFT,
  MOTION_TEXT_LOOK_AROUND,
  MOTION_TEXT_MELEE_FIGHTERS_SWORDS_SPEARS_ARMOR,
  MOTION_TEXT_MID,
  MOTION_TEXT_MOVE,
  MOTION_TEXT_OFFSET,
  MOTION_TEXT_OPEN,
  MOTION_TEXT_PILOT,
  MOTION_TEXT_PILOTS,
  MOTION_TEXT_POINT,
  MOTION_TEXT_PRIESTS_MONKS_NUNS,
  MOTION_TEXT_RIGHT,
  MOTION_TEXT_ROLE,
  MOTION_TEXT_RUN,
  MOTION_TEXT_SHOOT,
  MOTION_TEXT_SIT,
  MOTION_TEXT_SIT_AFRAID,
  MOTION_TEXT_SLEEP,
  MOTION_TEXT_SLIDE,
  MOTION_TEXT_SNEAK,
  MOTION_TEXT_SOMEONE,
  MOTION_TEXT_STAND,
  MOTION_TEXT_STAY,
  MOTION_TEXT_STUDENTS_PUPILS,
  MOTION_TEXT_SYMBOL_14,
  MOTION_TEXT_SYMBOL_16,
  MOTION_TEXT_SYMBOL_27,
  MOTION_TEXT_SYMBOL_34,
  MOTION_TEXT_SYMBOL_41,
  MOTION_TEXT_TABLETOP,
  MOTION_TEXT_TAKE_COVER,
  MOTION_TEXT_TALK,
  MOTION_TEXT_TEACHERS,
  MOTION_TEXT_THINK,
  MOTION_TEXT_TOWARD_CENTER,
  MOTION_TEXT_TO_SIT_ON,
  MOTION_TEXT_WALK,
  MOTION_TEXT_WALL,
  MOTION_TEXT_WINDOW,
  MOTION_TEXT_WITH_PEOPLE_SEATED_BEHIND_THEM,
  MOTION_TEXT_X,
  MOTION_TEXT_ZOOMTO,
} from "../../constants/motionRuntime.js";
import _ from "lodash";
import { MOTION_CUES, MOTION_INTERACT } from "../../constants/motionVideo.js";
import type { MotionBeat, MotionBeatProp, MotionStoryAnalysis } from "../../types/motionVideo.js";
import { loadMotionEngine, type MotionAfford, type MotionEnvProp } from "./motionEngineService.js";
import { listMotionCharacters } from "./motionLibraryService.js";
type Lane = "back" | "mid" | "front" | "fore";
type Facing = "left" | "right";
export interface SetPieceActor {
  src: { cast: string; action?: string };
  action: string;
  then?: string;
  move: string;
  lane: Lane;
  x: number;
  shortWalk: boolean;
  hold?: string;
  facing?: Facing;
  seated?: boolean;
  placed?: boolean;
  extra?: boolean;
  y?: number;
  z?: number;
}
export interface SetPieceItem {
  src: MotionBeatProp;
  lane: Lane;
  x: number;
  scale?: number;
  halfW: number;
  furniture: boolean;
  seat?: boolean;
  y?: number;
}
interface Frame {
  WW: number;
  cx: number;
  zoom: number;
  vw: number;
}
interface Slot {
  x: number;
  lane: Lane;
  h: number;
  k: number;
  facing?: Facing;
  role?: string;
  asset?: string;
  behind?: boolean;
  item?: SetPieceItem;
  crowd?: { pool: string[]; fill: number; action: string };
  fillParam?: string;
  taken?: boolean;
}
type Spec = Record<string, any>;
type RolesOf = (key: string) => string[];
const LANES: Lane[] = [MOTION_TEXT_BACK, MOTION_TEXT_MID, MOTION_TEXT_FRONT, MOTION_TEXT_FORE];
const LANE_Y: Record<Lane, number> = { back: -128, mid: -60, front: 0, fore: 70 };
const LANE_S: Record<Lane, number> = { back: 0.8, mid: 0.9, front: 1, fore: 1.12 };
const SEAT_BASE = 50;
const laneShift = (lane: Lane, d: number): Lane | null => LANES[LANES.indexOf(lane) + d] || null;
const hash = (n: number): number => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const registry = () => loadMotionEngine().registryInfo;
const affordOf = (asset: string | undefined): MotionAfford | null => (asset ? registry().assets[asset]?.afford || null : null);
const sizeOf = (asset: string): number[] => registry().assets[asset]?.size || [120, 120];
const needOf = (action: string | undefined) => (action ? registry().interact.needs[action] : undefined);
const stepsOf = (spec: Spec): string[] => _.compact([spec.action, ..._.map(spec.actions || [], (k: [number, string]) => k[1])]);
const cuesOf = (beat: MotionBeat, extra: string[] = []): Set<string> => new Set([..._.filter(_.keys(MOTION_CUES), (k) => MOTION_CUES[k].test(beat.narration || "")), ...extra]);
const faceSign = (f: Facing | undefined): number => (f === MOTION_TEXT_LEFT ? -1 : 1);
export const castCharOf =
  (analysis: MotionStoryAnalysis | null) =>
  (key: string): string => {
    const c = _.find(analysis?.cast || [], { key });
    return _.toString(c?.characterId || key);
  };
export const castRolesOf = (analysis: MotionStoryAnalysis | null): RolesOf => {
  const charOf = castCharOf(analysis);
  const custom = _.keyBy(listMotionCharacters(), MOTION_TEXT_ID);
  return (key: string) => {
    const id = charOf(key);
    const known = registry().interact.roles[id];
    if (known) return known;
    const engine = loadMotionEngine().engine as { rolesOf?: (def: unknown) => string[] };
    return custom[id] && engine.rolesOf ? engine.rolesOf(custom[id]) : [MOTION_TEXT_CIVILIAN];
  };
};
const hasRole = (rolesOf: RolesOf, key: string, roles: string[] | undefined): boolean => !!roles?.length && _.some(rolesOf(key), (r) => _.includes(roles, r));
export const normalizeSetPieceActions = (beat: MotionBeat, actors: SetPieceActor[], rolesOf: RolesOf): void => {
  const cues = cuesOf(beat);
  for (const a of actors) {
    if (!hasRole(rolesOf, a.src.cast, [MOTION_TEXT_GUNNER])) continue;
    const fix = (act: string | undefined): string | undefined => {
      if (act !== MOTION_TEXT_POINT) return act;
      if (cues.has(MOTION_TEXT_FIRE)) return MOTION_TEXT_SHOOT;
      if (cues.has(MOTION_TEXT_GUN)) return MOTION_TEXT_AIM;
      return act;
    };
    a.action = fix(a.action) || a.action;
    a.then = fix(a.then);
  }
};
interface StageCtx {
  beat: MotionBeat;
  staging: Record<string, any>;
  prefer: Record<string, string>;
  actors: SetPieceActor[];
  items: SetPieceItem[];
  fixtures: MotionEnvProp[];
  frame: Frame;
  rolesOf: RolesOf;
  cues: Set<string>;
  lanes?: string[];
  interior?: boolean;
  occupied: { x: number; lane: Lane }[];
}
const laneOk = (ctx: StageCtx, lane: Lane | null): lane is Lane => !!lane && (!ctx.lanes?.length || _.includes(ctx.lanes, lane));
const makeItem = (asset: string, x: number, lane: Lane, extra: Partial<MotionBeatProp> = {}, scale = 1): SetPieceItem => ({
  src: { asset, move: MOTION_TEXT_STAY, ...extra },
  lane,
  x,
  scale,
  halfW: ((sizeOf(asset)[0] || 120) * scale) / 2,
  furniture: false,
});
const isStay = (a: SetPieceActor) => a.move === MOTION_TEXT_STAY;
const wantsSeat = (ctx: StageCtx, a: SetPieceActor): boolean => {
  if (!isStay(a)) return false;
  for (const act of _.compact([a.action, a.then])) {
    const need = needOf(act);
    if (!need?.seat) continue;
    if (!need.optional) return true;
    if (_.some(fixtureItems(ctx), (f) => _.includes(need.work || [], f.asset) && Math.abs(f.x - a.x) < 420)) return true;
  }
  return hasRole(ctx.rolesOf, a.src.cast, ctx.staging.seatedRoles) && (_.has(registry().interact.seatedVariant, a.action) || !!needOf(a.action)?.seat);
};
const seatSlotsOfItem = (it: { asset: string; x: number; lane: Lane; scale?: number; facing?: string }, item?: SetPieceItem): Slot[] => {
  const af = affordOf(it.asset);
  if (!af) return [];
  const k = it.scale || 1;
  const flip = it.facing === MOTION_TEXT_LEFT ? -1 : 1;
  const facing: Facing | undefined = af.faces ? ((af.faces === MOTION_TEXT_RIGHT ? flip : -flip) > 0 ? MOTION_TEXT_RIGHT : MOTION_TEXT_LEFT) : undefined;
  const out: Slot[] = _.map(af.seat || [], (s) => ({ x: it.x + s.dx * k * flip, lane: it.lane, h: s.h, k, facing, asset: it.asset, role: af.role, item }));
  if (af.work?.seated) {
    const behind = af.work.mode === MOTION_TEXT_BEHIND ? laneShift(it.lane, -1) : it.lane;
    if (behind) out.push({ x: it.x + (af.work.mode === MOTION_TEXT_BESIDE ? -Math.max(Math.abs(af.work.dx || 0), ((sizeOf(it.asset)[0] || 120) / 2 + 40) * k) : af.work.dx || 0), lane: behind, h: SEAT_BASE, k: 1, asset: it.asset, behind: true, item, facing: af.work.mode === MOTION_TEXT_BESIDE ? MOTION_TEXT_RIGHT : undefined });
  }
  return out;
};
const snapSeat = (ctx: StageCtx, a: SetPieceActor, s: Slot): void => {
  s.taken = true;
  ctx.occupied.push({ x: s.x, lane: s.lane });
  a.x = s.x;
  a.lane = s.lane;
  a.facing = s.facing || a.facing || MOTION_TEXT_RIGHT;
  a.seated = true;
  a.placed = true;
  const dy = -(s.h - SEAT_BASE) * s.k * LANE_S[s.lane];
  if (Math.abs(dy) > 1) a.y = Math.round(dy);
  const variant = registry().interact.seatedVariant;
  if (variant[a.action]) a.action = variant[a.action];
  if (ctx.cues.has(MOTION_TEXT_FEAR) && a.action === MOTION_TEXT_SIT) a.action = MOTION_TEXT_SIT_AFRAID;
  if (a.then && !needOf(a.then)?.seat) a.then = variant[a.then] && variant[a.then] !== MOTION_TEXT_SIT ? variant[a.then] : undefined;
  if (s.behind && !_.some(ctx.items, (it) => it.src.asset === ctx.prefer.seat && it.lane === s.lane && Math.abs(it.x - s.x) < 30)) ctx.items.push(makeItem(ctx.prefer.seat || MOTION_TEXT_CHAIR, s.x, s.lane, { facing: a.facing }));
};
const buildRows = (ctx: StageCtx): Slot[] => {
  const slots: Slot[] = [];
  const { frame } = ctx;
  for (const row of ctx.staging.rows || []) {
    _.remove(ctx.items, (it) => it.src.asset === row.asset && !it.src.move);
    _.remove(ctx.items, (it) => it.src.asset === row.asset && it.src.move === MOTION_TEXT_STAY);
    const lo = Math.max(row.from ?? 0, frame.cx - frame.vw * 0.75);
    const hi = Math.min(row.to ?? frame.WW, frame.cx + frame.vw * 0.75);
    const pitch = row.pitch || 120;
    const off = row.offset || 0;
    const sitLane: Lane | null = row.mode === MOTION_TEXT_BEHIND ? laneShift(row.lane, -1) : row.lane;
    if (!sitLane) continue;
    for (let x = Math.ceil((lo - off) / pitch) * pitch + off; x <= hi; x += pitch) {
      const item = makeItem(row.asset, x, row.lane, row.facing === MOTION_TEXT_LEFT ? { facing: MOTION_TEXT_LEFT } : {});
      item.seat = true;
      ctx.items.push(item);
      const s = seatSlotsOfItem({ asset: row.asset, x, lane: row.lane, facing: row.facing }, item);
      for (const slot of row.mode === MOTION_TEXT_BEHIND ? _.filter(s, MOTION_TEXT_BEHIND) : _.reject(s, MOTION_TEXT_BEHIND)) slots.push({ ...slot, facing: row.facing || slot.facing, crowd: row.crowd, fillParam: row.fillParam, behind: row.mode === MOTION_TEXT_BEHIND });
    }
  }
  return slots;
};
const pickSlot = (slots: Slot[], x: number, maxDist = Infinity, filter?: (s: Slot) => boolean): Slot | undefined =>
  _.minBy(
    _.filter(slots, (s) => !s.taken && Math.abs(s.x - x) <= maxDist && (!filter || filter(s))),
    (s) => Math.abs(s.x - x),
  );
const fixtureItems = (ctx: StageCtx) => [..._.map(ctx.items, (it) => ({ asset: it.src.asset, x: it.x, lane: it.lane, scale: it.scale || 1, facing: it.src.facing, item: it })), ..._.map(ctx.fixtures, (f) => ({ asset: f.asset, x: f.x, lane: (f.lane || MOTION_TEXT_MID) as Lane, scale: f.scale || 1, facing: f.facing, item: undefined as SetPieceItem | undefined }))];
const stageSeats = (ctx: StageCtx): Slot[] => {
  const rowSlots = buildRows(ctx);
  const st = ctx.staging;
  const fixed: Slot[] = _.compact(
    _.map(st.seats || [], (s: any) => {
      const lane = s.lane as Lane;
      const exists = _.find(fixtureItems(ctx), (f) => f.asset === s.asset && Math.abs(f.x - s.x) < 40);
      if (s.mode === MOTION_TEXT_BEHIND) {
        const front = laneShift(lane, 1);
        if (front && !exists) ctx.items.push(makeItem(s.asset, s.x, front));
        return { x: s.x, lane, h: SEAT_BASE, k: 1, facing: s.facing, role: s.role, asset: s.asset, behind: true } as Slot;
      }
      if (!exists && s.asset) ctx.items.push(makeItem(s.asset, s.x, lane, s.facing ? { facing: s.facing } : {}));
      const af = affordOf(s.asset);
      return { x: s.x, lane, h: af?.seat?.[0]?.h ?? SEAT_BASE, k: 1, facing: s.facing || af?.faces, role: s.role, asset: s.asset } as Slot;
    }),
  );
  const loose = (): Slot[] => _.flatMap(fixtureItems(ctx), (f) => (_.some(rowSlots, (r) => r.item === f.item) ? [] : seatSlotsOfItem(f, f.item)));
  const freeSlot = (q: Slot) => !_.some(ctx.occupied, (o) => o.lane === q.lane && Math.abs(o.x - q.x) < 40);
  const ordered = _.sortBy(ctx.actors, (a) => (hasRole(ctx.rolesOf, a.src.cast, _.compact(_.map(fixed, MOTION_TEXT_ROLE))) ? 0 : 1));
  for (const a of ordered) {
    if (!wantsSeat(ctx, a)) continue;
    const need = needOf(a.action)?.seat || needOf(a.then)?.seat;
    const only = _.isArray(need) ? need : null;
    const roleSlot = pickSlot(fixed, a.x, Infinity, (s) => !!s.role && hasRole(ctx.rolesOf, a.src.cast, [s.role]) && (!only || _.includes(only, s.asset)));
    const anyFixed = only ? pickSlot(fixed, a.x, Infinity, (s) => _.includes(only, s.asset)) : undefined;
    const workList = needOf(a.action)?.work || needOf(a.then)?.work;
    const workSlot = workList ? pickSlot(loose(), a.x, 420, (s) => freeSlot(s) && !!s.behind && (_.includes(workList, s.asset) || (_.includes(workList, MOTION_TEXT_SYMBOL_34) && !!registry().assets[s.asset || ""]?.afford?.work?.seated))) : undefined;
    const rowSlot = only ? undefined : pickSlot(rowSlots, a.x);
    const near = pickSlot(loose(), a.x, 320, (s) => freeSlot(s) && !s.behind && (!only || _.includes(only, s.asset)));
    const slot = roleSlot || anyFixed || workSlot || _.minBy(_.compact([rowSlot, near]), (q) => Math.abs(q.x - a.x));
    if (slot) {
      snapSeat(ctx, a, slot);
      continue;
    }
    if (hasRole(ctx.rolesOf, a.src.cast, st.seatedRoles) && !needOf(a.action)?.seat) continue;
    const asset = only?.[0] || ctx.prefer.seat || MOTION_TEXT_CHAIR;
    const facing: Facing = a.facing || (a.x < ctx.frame.cx ? MOTION_TEXT_RIGHT : MOTION_TEXT_LEFT);
    const item = makeItem(asset, a.x, a.lane, { facing });
    item.seat = true;
    ctx.items.push(item);
    const s = seatSlotsOfItem({ asset, x: a.x, lane: a.lane, facing }, item);
    const best = _.minBy(_.reject(s, MOTION_TEXT_BEHIND), (q) => Math.abs(q.x - a.x));
    if (best) snapSeat(ctx, a, { ...best, facing: best.facing || facing });
  }
  return rowSlots;
};
const stageStanding = (ctx: StageCtx, rowSlots: Slot[]): void => {
  const st = ctx.staging;
  const busyLanes = new Set(
    _.map(
      _.filter(rowSlots, (s) => !s.behind),
      MOTION_TEXT_LANE,
    ),
  );
  _.forEach(_.filter(rowSlots, MOTION_TEXT_BEHIND), (s) => busyLanes.add(s.lane));
  for (const a of ctx.actors) {
    if (a.seated) continue;
    if (busyLanes.has(a.lane) && st.aisle) a.lane = st.aisle;
    else if (busyLanes.has(a.lane)) {
      const free = _.find([laneShift(a.lane, 1), laneShift(a.lane, -1)], (l) => laneOk(ctx, l) && !busyLanes.has(l as Lane));
      if (free) a.lane = free;
    }
    if (st.standLimit && isStay(a)) {
      a.lane = st.standLimit.lane;
      a.x = Math.min(a.x, st.standLimit.maxX);
    }
  }
};
const stageBeds = (ctx: StageCtx): void => {
  for (const a of ctx.actors) {
    if (!isStay(a) || (!needOf(a.action)?.bed && !needOf(a.then)?.bed)) continue;
    const beds = _.filter(fixtureItems(ctx), (f) => !!affordOf(f.asset)?.bed);
    let bed = _.minBy(
      _.filter(beds, (f) => Math.abs(f.x - a.x) < 700),
      (f) => Math.abs(f.x - a.x),
    );
    if (!bed && (ctx.cues.has(MOTION_TEXT_SLEEP) || ctx.staging.prefer?.bed)) {
      const asset = ctx.prefer.bed || MOTION_TEXT_BED;
      const it = makeItem(asset, a.x, a.lane);
      ctx.items.push(it);
      bed = { asset, x: a.x, lane: a.lane, scale: 1, facing: undefined, item: it };
    }
    if (!bed) continue;
    const b = affordOf(bed.asset)!.bed!;
    const k = (bed.scale || 1) * LANE_S[bed.lane];
    a.x = bed.x + b.dx * (bed.scale || 1);
    a.lane = bed.lane;
    a.y = -Math.round(b.h * k);
    a.facing = a.facing || MOTION_TEXT_RIGHT;
    a.placed = true;
  }
};
const stageWork = (ctx: StageCtx): void => {
  for (const a of ctx.actors) {
    if (!isStay(a) || a.placed) continue;
    const list = needOf(a.action)?.work || needOf(a.then)?.work;
    if (!list) continue;
    const it = _.minBy(
      _.filter(fixtureItems(ctx), (f) => (_.includes(list, f.asset) || (_.includes(list, MOTION_TEXT_SYMBOL_34) && !!affordOf(f.asset)?.work)) && Math.abs(f.x - a.x) < 450),
      (f) => Math.abs(f.x - a.x),
    );
    if (!it) continue;
    const w = affordOf(it.asset)?.work;
    if (!w) continue;
    if (w.mode === MOTION_TEXT_BEHIND) {
      const behind = laneShift(it.lane, -1);
      if (laneOk(ctx, behind)) {
        a.lane = behind;
        a.x = it.x + (w.dx || 0) * (it.scale || 1);
      } else if (it.item && laneOk(ctx, laneShift(a.lane, 1))) {
        it.item.lane = laneShift(a.lane, 1) as Lane;
        it.item.x = a.x;
      }
    } else {
      const side = a.x <= it.x ? -1 : 1;
      a.x = it.x + side * (w.dx || 160) * (it.scale || 1);
      a.lane = it.lane;
      a.facing = side < 0 ? MOTION_TEXT_RIGHT : MOTION_TEXT_LEFT;
    }
    a.placed = true;
  }
};
const stageSpots = (ctx: StageCtx): void => {
  const calm = [MOTION_TEXT_STAND, MOTION_TEXT_IDLE, MOTION_TEXT_TALK, MOTION_TEXT_THINK, MOTION_TEXT_LOOK_AROUND, MOTION_TEXT_POINT, MOTION_TEXT_HANDS_POCKET, MOTION_TEXT_CHECK_WATCH];
  for (const spot of ctx.staging.spots || []) {
    const a = _.find(ctx.actors, (x) => isStay(x) && !x.placed && !x.seated && hasRole(ctx.rolesOf, x.src.cast, [spot.role]));
    if (!a) continue;
    let x = spot.x;
    if (spot.near) {
      const f = _.find(fixtureItems(ctx), (q) => q.asset === spot.near);
      if (!f) continue;
      x = f.x + (spot.dx || 0);
    }
    if (x == null) continue;
    a.x = x;
    a.lane = spot.lane || a.lane;
    if (spot.facing) a.facing = spot.facing;
    if (spot.action && _.includes(calm, a.action) && a.action !== MOTION_TEXT_TALK && a.action !== MOTION_TEXT_POINT) a.action = spot.action;
    a.placed = true;
  }
};
const DOOR_OPEN: Record<string, [number, number][]> = {
  kick_door: [
    [0, 0],
    [0.42, 0],
    [0.5, 1],
  ],
  open_door: [
    [0, 0],
    [0.3, 0],
    [0.55, 1],
  ],
  knock: [
    [0, 0],
    [0.68, 0],
    [0.82, 1],
  ],
};
const stageDoors = (ctx: StageCtx): void => {
  const st = ctx.staging;
  for (const d of st.doors || []) {
    const existing = _.find(ctx.items, (it) => it.src.asset === d.asset);
    if (existing) {
      if (d.x != null) existing.x = d.x;
      existing.lane = d.lane;
    }
  }
  for (const a of ctx.actors) {
    const act = _.find([a.action, a.then], (s) => !!s && !!needOf(s)?.door);
    const arriving = _.includes([MOTION_TEXT_ENTER_LEFT, MOTION_TEXT_ENTER_RIGHT, MOTION_TEXT_TOWARD_CENTER], a.move);
    if (!act || (!isStay(a) && !arriving)) continue;
    let door = _.minBy(
      _.filter(ctx.items, (it) => !!affordOf(it.src.asset)?.door && Math.abs(it.x - a.x) < 600),
      (it) => Math.abs(it.x - a.x),
    );
    if (!door) {
      const conf = _.find(st.doors || [], (d: any) => d.x != null);
      const asset = ctx.prefer.door || MOTION_TEXT_DOOR;
      const face = faceSign(a.facing || (a.x < ctx.frame.cx ? MOTION_TEXT_RIGHT : MOTION_TEXT_LEFT));
      door = makeItem(asset, conf ? conf.x : a.x + face * 110, (conf?.lane as Lane) || a.lane);
      ctx.items.push(door);
    }
    const dir = a.x <= door.x ? 1 : -1;
    const gap = (door.halfW || 60) + 40;
    if (Math.abs(a.x - door.x) > gap + 40 || Math.abs(a.x - door.x) < gap - 20) a.x = door.x - dir * gap;
    if (LANES.indexOf(door.lane) > LANES.indexOf(a.lane)) a.lane = door.lane;
    a.facing = dir > 0 ? MOTION_TEXT_RIGHT : MOTION_TEXT_LEFT;
    a.placed = true;
    const param = affordOf(door.src.asset)?.door?.param || MOTION_TEXT_OPEN;
    const breach = ctx.cues.has(MOTION_TEXT_BREACH) || act !== MOTION_TEXT_KNOCK;
    const timing = _.map(DOOR_OPEN[act] || DOOR_OPEN.open_door, ([t, v]) => [arriving && t > 0 ? Math.min(0.95, 0.4 + t * 0.6) : t, v] as [number, number]);
    if (breach) door.src = { ...door.src, anim: { ...(door.src.anim || {}), [param]: timing } };
    if (ctx.cues.has(MOTION_TEXT_FIRE) && door.src.asset === MOTION_TEXT_COCKPIT_DOOR) door.src = { ...door.src, params: { ...(door.src.params || {}), holes: 5 } };
  }
};
const placeTabletops = (ctx: StageCtx): void => {
  const tabletop = registry().interact.tabletop;
  const toolUsers = _.filter(ctx.actors, (a) => _.some([a.action, a.then], (s) => !!needOf(s)?.tools));
  for (const it of ctx.items) {
    const designedTop = registry().assets[it.src.asset]?.place === MOTION_TEXT_TABLETOP;
    const wallOutside = !ctx.interior && registry().assets[it.src.asset]?.place === MOTION_TEXT_WALL;
    if ((!_.includes(tabletop, it.src.asset) && !designedTop && !wallOutside) || (it.src.move && it.src.move !== MOTION_TEXT_STAY) || it.y) continue;
    const surfaces = _.filter(fixtureItems(ctx), (f) => !!affordOf(f.asset)?.surface && f.item !== it && Math.abs(f.x - it.x) < 420);
    let surf = _.minBy(surfaces, (f) => Math.abs(f.x - it.x));
    if (!surf) {
      const user = _.find(toolUsers, (a) => _.includes(needOf(a.action)?.tools || needOf(a.then)?.tools || [], it.src.asset) && Math.abs(a.x - it.x) < 600);
      if (!user && !designedTop) continue;
      const desk = makeItem(ctx.prefer.desk || MOTION_TEXT_DESK, it.x, it.lane);
      desk.furniture = true;
      ctx.items.push(desk);
      surf = { asset: desk.src.asset, x: desk.x, lane: desk.lane, scale: 1, facing: undefined, item: desk };
    }
    const sf = affordOf(surf.asset)!.surface!;
    const k = surf.scale || 1;
    const reach = (sf.w * k) / 2 - it.halfW;
    it.x = surf.x + _.clamp(it.x - surf.x, -Math.max(0, reach), Math.max(0, reach));
    it.lane = surf.lane;
    it.y = -Math.round(sf.h * k);
  }
};
const placeWallItems = (ctx: StageCtx): void => {
  for (const it of ctx.items) {
    const info = registry().assets[it.src.asset];
    if (info?.place !== MOTION_TEXT_WALL || (it.src.move && it.src.move !== MOTION_TEXT_STAY) || it.y) continue;
    if (!ctx.interior) continue;
    if (laneOk(ctx, MOTION_TEXT_BACK)) it.lane = MOTION_TEXT_BACK;
    it.y = -Math.round((info.mountY || 150) * LANE_S[it.lane]);
    it.furniture = false;
  }
};
const addMentionedRoles = (ctx: StageCtx): void => {
  const words = registry().interact.roleWords;
  const text = ctx.beat.narration || "";
  for (const spot of ctx.staging.spots || []) {
    const w = words[spot.role];
    if (!w || !new RegExp(w.re, w.flags).test(text)) continue;
    if (_.some(ctx.actors, (a) => hasRole(ctx.rolesOf, a.src.cast, [spot.role]))) continue;
    ctx.actors.push({ extra: true, src: { cast: w.who }, action: spot.action || MOTION_TEXT_STAND, move: MOTION_TEXT_STAY, lane: spot.lane || MOTION_TEXT_FRONT, x: ctx.frame.cx, shortWalk: false, facing: spot.facing });
  }
};
const stageCover = (ctx: StageCtx): void => {
  for (const a of ctx.actors) {
    if (!isStay(a) || (a.action !== MOTION_TEXT_TAKE_COVER && a.then !== MOTION_TEXT_TAKE_COVER) || a.placed) continue;
    const face = faceSign(a.facing || (a.x < ctx.frame.cx ? MOTION_TEXT_RIGHT : MOTION_TEXT_LEFT));
    a.facing = face > 0 ? MOTION_TEXT_RIGHT : MOTION_TEXT_LEFT;
    const covers = _.filter(fixtureItems(ctx), (f) => !!affordOf(f.asset)?.cover && Math.abs(LANES.indexOf(f.lane) - LANES.indexOf(a.lane)) <= 1 && Math.abs(f.x - a.x) < 400);
    let cover = _.minBy(covers, (f) => Math.abs(f.x - (a.x + face * 80)));
    if (!cover) {
      const asset = ctx.prefer.cover || MOTION_TEXT_CRATE;
      const real = registry().assets[asset]?.realSize;
      const sz = sizeOf(asset);
      const scale = real ? +(real / Math.max(sz[0], sz[1], 1)).toFixed(3) : 1;
      const it = makeItem(asset, a.x + face * ((sz[0] * scale) / 2 + 34), a.lane, {}, scale);
      ctx.items.push(it);
      cover = { asset, x: it.x, lane: it.lane, scale, facing: undefined, item: it };
    }
    const half = ((sizeOf(cover.asset)[0] || 100) * (cover.scale || 1)) / 2;
    a.x = cover.x - face * (half + 30);
    a.lane = cover.lane;
    a.placed = true;
  }
};
const stageSpawns = (ctx: StageCtx): void => {
  for (const a of ctx.actors) {
    if (!isStay(a)) continue;
    const act = _.find([a.action, a.then], (s) => !!s && !!needOf(s)?.spawn);
    if (!act) continue;
    const sp = needOf(act)!.spawn!;
    if (sp.cue && !ctx.cues.has(sp.cue)) continue;
    if (_.some(ctx.items, (it) => it.src.asset === sp.asset && Math.abs(it.x - a.x) < (sp.near || 300))) continue;
    const face = faceSign(a.facing || (a.x <= ctx.frame.cx ? MOTION_TEXT_RIGHT : MOTION_TEXT_LEFT));
    a.facing = face > 0 ? MOTION_TEXT_RIGHT : MOTION_TEXT_LEFT;
    const params = sp.params ? { ...sp.params, seed: Math.round(a.x) } : undefined;
    const it = makeItem(sp.asset, a.x + face * sp.dx, a.lane, params ? { params } : {}, sp.scale || 1);
    it.furniture = !sp.scale;
    ctx.items.push(it);
    a.placed = true;
  }
};
const fillCrowd = (ctx: StageCtx, slots: Slot[]): void => {
  let added = 0;
  for (const s of slots) {
    if (s.fillParam && s.item) {
      s.item.src = { ...s.item.src, params: { ...(s.item.src.params || {}), [s.fillParam]: !s.taken && hash(s.x * 0.37) < 0.84, seed: Math.round(s.x), mood: ctx.cues.has(MOTION_TEXT_FEAR) ? MOTION_TEXT_AFRAID : undefined } };
      continue;
    }
    if (s.taken || !s.crowd?.pool.length || hash(s.x * 0.53 + 1) > s.crowd.fill || added >= MOTION_INTERACT.CROWD_MAX) continue;
    const who = s.crowd.pool[Math.floor(hash(s.x * 0.91 + 3) * s.crowd.pool.length)];
    const extra: SetPieceActor = { extra: true, src: { cast: who }, action: ctx.cues.has(MOTION_TEXT_FEAR) ? MOTION_TEXT_SIT_AFRAID : s.crowd.action, move: MOTION_TEXT_STAY, lane: s.lane, x: s.x, shortWalk: false, facing: s.facing };
    const need = needOf(extra.action)?.seat;
    if (!need) extra.action = s.crowd.action === MOTION_TEXT_DRINK ? MOTION_TEXT_SIT : extra.action;
    snapSeat(ctx, extra, s);
    ctx.actors.push(extra);
    added++;
  }
};
export const stageInteractions = (beat: MotionBeat, envInfo: { staging?: Record<string, any>; props?: MotionEnvProp[]; lanes?: string[]; category?: string } | undefined, actors: SetPieceActor[], items: SetPieceItem[], frame: Frame, rolesOf: RolesOf): { focusX?: number } => {
  const staging = envInfo?.staging || {};
  const hidden = staging.hideProps || [];
  const lo = frame.cx - frame.vw,
    hi = frame.cx + frame.vw;
  const ctx: StageCtx = {
    beat,
    staging,
    prefer: { ...registry().interact.prefer, ...(staging.prefer || {}) },
    actors,
    items,
    fixtures: _.filter(envInfo?.props || [], (p) => !_.includes(hidden, p.asset) && p.x >= lo && p.x <= hi),
    frame,
    rolesOf,
    cues: cuesOf(beat, staging.cues),
    lanes: envInfo?.lanes,
    interior: envInfo?.category === MOTION_TEXT_INTERIOR,
    occupied: [],
  };
  normalizeSetPieceActions(beat, actors, rolesOf);
  addMentionedRoles(ctx);
  stageDoors(ctx);
  placeTabletops(ctx);
  placeWallItems(ctx);
  const rowSlots = stageSeats(ctx);
  stageBeds(ctx);
  stageWork(ctx);
  stageSpots(ctx);
  stageStanding(ctx, rowSlots);
  stageCover(ctx);
  stageSpawns(ctx);
  fillCrowd(ctx, rowSlots);
  const xs = _.map(
    _.filter(actors, (a) => !a.extra && isStay(a)),
    MOTION_TEXT_X,
  );
  if (!xs.length) return {};
  const lo2 = _.min(xs) as number,
    hi2 = _.max(xs) as number;
  const half = frame.vw * 0.42;
  if (hi2 - lo2 > frame.vw * 0.84 || (lo2 >= frame.cx - half && hi2 <= frame.cx + half)) return {};
  return { focusX: _.clamp((lo2 + hi2) / 2, frame.vw / 2, frame.WW - frame.vw / 2) };
};
const curvePoint = (sl: { x0: number; x1: number; y1: number }, k: number, h: number): [number, number] => {
  const e = k < 0.8 ? k / 0.8 : 1;
  const yk = Math.sin((e * Math.PI) / 2) * 0.92 + (k >= 0.8 ? 0.08 * ((k - 0.8) / 0.2) : 0);
  return [sl.x0 + (sl.x1 - sl.x0) * k, -h + (sl.y1 + h) * yk];
};
const ladderClimb = (actors: Spec[], items: Spec[], focusXs: number[]): void => {
  for (const a of actors) {
    if (a.path || a.used || !_.includes(stepsOf(a), MOTION_TEXT_CLIMB)) continue;
    const ladder = _.minBy(
      _.filter(items, (it) => !!affordOf(it.asset)?.climb?.vertical && Math.abs(_.toNumber(it.x) - _.toNumber(a.x)) < 420),
      (it) => Math.abs(_.toNumber(it.x) - _.toNumber(a.x)),
    );
    if (!ladder) continue;
    const c = affordOf(ladder.asset)!.climb!;
    const lane = (ladder.lane || MOTION_TEXT_MID) as Lane;
    const top = (_.toNumber(ladder.params?.[c.param || MOTION_TEXT_H]) || c.top || 360) * (ladder.scale || 1) * LANE_S[lane];
    const x = _.toNumber(ladder.x);
    delete a.x;
    a.lane = lane;
    a.z = 2;
    a.path = [
      [0, x - 120, 0],
      [0.15, x, 0],
      [0.85, x, -(top - 120)],
      [1, x, -(top - 120)],
    ];
    a.actions = [
      [0, MOTION_TEXT_WALK],
      [0.15, MOTION_TEXT_CLIMB],
      [0.85, MOTION_TEXT_STAND],
    ];
    delete a.action;
    a.used = true;
    focusXs.push(x - 160, x + 160);
  }
};
export const applySetPieces = (beat: MotionBeat, staging: Record<string, any> | undefined, camera: Record<string, unknown>, actors: Spec[], items: Spec[], rolesOf: RolesOf, frame: Frame): string | undefined => {
  const st = staging || {};
  const style = st.style;
  const cues = cuesOf(beat, st.cues);
  const prefer = { ...registry().interact.prefer, ...(st.prefer || {}) };
  const focusXs: number[] = [];
  const teams = st.teams || {};
  const roleOf = (a: Spec, roles: string[]) => hasRole(rolesOf, a.who, roles);
  const free = (a: Spec) => !a.used && !_.some(a.path || [], (k: number[]) => !!k[2]);
  let anchor: { x: number; scale: number; item: Spec; af: MotionAfford } | null = null;
  if (st.anchor && affordOf(st.anchor.asset)) {
    _.remove(items, (it) => _.includes(st.anchor.replace || [st.anchor.asset], it.asset) && !it.path);
    const item: Spec = { asset: st.anchor.asset, x: st.anchor.x, lane: st.anchor.lane, scale: st.anchor.scale || 1, params: {} };
    items.unshift(item);
    anchor = { x: st.anchor.x, scale: (st.anchor.scale || 1) * LANE_S[st.anchor.lane as Lane], item, af: affordOf(st.anchor.asset)! };
  } else if (st.anchorFrom) {
    const src = _.find(items, (it) => _.includes(st.anchorFrom.assets, it.asset) && !it.path);
    if (src && affordOf(st.anchorFrom.as)) {
      src.asset = st.anchorFrom.as;
      src.lane = st.anchorFrom.lane;
      src.scale = 1;
      delete src.y;
      src.x = _.toNumber(src.x) + (st.anchorFrom.shift || 0);
      src.params = { ...(src.params || {}) };
      _.remove(items, (it) => it !== src && _.includes([MOTION_TEXT_WINDOW, MOTION_TEXT_LADDER], it.asset) && !it.path);
      anchor = { x: src.x, scale: LANE_S[src.lane as Lane], item: src, af: affordOf(src.asset)! };
    }
  }
  if (anchor) {
    const s = anchor.scale;
    const anchorLaneY = LANE_Y[(anchor.item.lane || MOTION_TEXT_BACK) as Lane];
    const entries = anchor.af.entry || [];
    const windows = anchor.af.window || [];
    const params = anchor.item.params;
    const anim: Record<string, [number, unknown][]> = { ...(anchor.item.anim || {}) };
    const windowScene = cues.has(MOTION_TEXT_WINDOW) && windows.length > 0;
    const climbBridge = prefer.climb && affordOf(prefer.climb)?.climb ? prefer.climb : null;
    const slideAsset = prefer.slide && affordOf(prefer.slide)?.slide ? prefer.slide : null;
    const climbTeam = (a: Spec) => roleOf(a, teams.climb?.roles || [MOTION_TEXT_GUNNER]);
    const wantsStairs = !!climbBridge && entries.length > 0 && !windowScene && (_.some(items, (it) => it.asset === climbBridge) || _.some(actors, (a) => _.includes(stepsOf(a), MOTION_TEXT_CLIMB) && !roleOf(a, [MOTION_TEXT_PILOT])) || (cues.has(MOTION_TEXT_CLIMB) && _.some(actors, climbTeam)));
    const wantsWindow = windowScene && _.some(actors, (a) => roleOf(a, [MOTION_TEXT_PILOT]) || _.some(stepsOf(a), (x) => _.includes([MOTION_TEXT_JUMP, MOTION_TEXT_FALL, MOTION_TEXT_CLIMB], x)));
    const wantsSlide = !!slideAsset && entries.length > 0 && (_.some(items, (it) => it.asset === slideAsset) || _.some(actors, (a) => _.includes(stepsOf(a), MOTION_TEXT_SLIDE)) || cues.has(MOTION_TEXT_EVAC));
    const breach = cues.has(MOTION_TEXT_BREACH) || _.some(actors, (a) => _.some(stepsOf(a), (x) => !!needOf(x)?.door));
    if (wantsWindow) {
      const w = windows[0];
      params[w.param] = true;
      const wx = anchor.x + w.dx * s,
        wy = (w.y + 10) * s + MOTION_INTERACT.HANG_DROP * s;
      const escaper = _.find(actors, (a) => free(a) && roleOf(a, [MOTION_TEXT_PILOT])) || _.find(actors, (a) => free(a) && _.some(stepsOf(a), (x) => _.includes([MOTION_TEXT_JUMP, MOTION_TEXT_FALL, MOTION_TEXT_CLIMB], x)));
      if (escaper) {
        escaper.used = true;
        delete escaper.x;
        delete escaper.action;
        Object.assign(escaper, { lane: anchor.item.lane, z: 300, facing: MOTION_TEXT_RIGHT });
        escaper.path = [
          [0, wx - 6, wy - 30 * s],
          [0.14, wx - 6, wy],
          [0.34, wx - 2, wy],
          [0.5, wx + 30, 0],
          [0.58, wx + 60, 0],
          [1, wx + 420, 0],
        ];
        escaper.actions = [
          [0, MOTION_TEXT_HANDS_UP],
          [0.34, MOTION_TEXT_JUMP],
          [0.52, MOTION_TEXT_RUN],
        ];
        focusXs.push(wx, wx + 300);
      }
    }
    const entryAt = (i: number) => {
      const e = entries[Math.min(i, entries.length - 1)];
      return { x: anchor!.x + e.dx * s, sill: anchorLaneY + e.y * s, param: e.param };
    };
    if (wantsStairs && climbBridge) {
      const E = entryAt(0);
      const St = affordOf(climbBridge)!.climb!;
      _.remove(items, (it) => it.asset === climbBridge || it.asset === MOTION_TEXT_LADDER);
      const ms = LANE_S.mid;
      const h = Math.round((LANE_Y.mid - E.sill) / ms);
      const truckX = E.x - St.x1 * ms - 46;
      items.push({ asset: climbBridge, x: truckX, lane: MOTION_TEXT_MID, params: { [St.param || MOTION_TEXT_H]: h } });
      const climbers = _.sortBy(
        _.filter(actors, (a) => free(a) && !roleOf(a, [MOTION_TEXT_PILOT, MOTION_TEXT_CIVILIAN])),
        (a) => -_.toNumber(a.x ?? 0),
      );
      if (_.some(climbers, climbTeam) || cues.has(MOTION_TEXT_CLIMB))
        for (let k = climbers.length; k < (teams.climb?.count || 0); k++) {
          const extra: Spec = { who: teams.climb.pool[k % teams.climb.pool.length], lane: MOTION_TEXT_MID };
          actors.push(extra);
          climbers.push(extra);
        }
      const bx = truckX + St.x0 * ms,
        by = St.y0 * ms;
      const tx = truckX + St.x1 * ms + 18,
        ty = -h * ms;
      let firstTop = 1;
      _.forEach(_.take(climbers, 4), (a, i) => {
        a.used = true;
        const start = 0.1 + i * 0.11;
        const top = Math.min(0.86, start + 0.4);
        const inAt = Math.min(0.97, top + 0.1);
        firstTop = Math.min(firstTop, top);
        const team = climbTeam(a);
        delete a.x;
        delete a.action;
        Object.assign(a, { lane: MOTION_TEXT_MID, facing: MOTION_TEXT_RIGHT });
        a.path = [
          [0, bx - 260 - i * 95, 0],
          [start, bx, by],
          [top, tx, ty],
          [inAt, tx + 44, ty],
          [1, tx + 60, ty],
        ];
        a.actions = [
          [0, MOTION_TEXT_RUN],
          [start, team || _.includes(stepsOf(a), MOTION_TEXT_SNEAK) ? MOTION_TEXT_SNEAK : MOTION_TEXT_WALK],
          [top, breach || team ? MOTION_TEXT_AIM : MOTION_TEXT_STAND],
        ];
        if (breach) a.show = [0, inAt + 0.02];
      });
      if (breach || cues.has(MOTION_TEXT_CLIMB))
        anim[E.param] = [
          [0, 0],
          [Math.max(0.05, firstTop - 0.06), 0],
          [Math.min(0.98, firstTop + 0.06), 1],
        ];
      focusXs.push(bx - 260, E.x + 60, anchor.x - 40 * s);
    }
    if (wantsSlide && slideAsset) {
      const E = entryAt(wantsStairs ? 1 : 0);
      const Sl = affordOf(slideAsset)!.slide!;
      const ms = LANE_S.mid;
      const h = Math.round((LANE_Y.mid - E.sill) / ms);
      const slideX = E.x - Sl.x0 * ms;
      _.remove(items, (it) => it.asset === slideAsset && !it.path);
      items.push({ asset: slideAsset, x: slideX, lane: MOTION_TEXT_MID, params: { [Sl.param || MOTION_TEXT_H]: h } });
      if (wantsStairs) params[E.param] = 1;
      else anim[E.param] = [[0, 1]];
      const count = teams.slide?.count || 4;
      const riders: Spec[] = _.take(
        _.filter(actors, (a) => free(a) && !roleOf(a, [MOTION_TEXT_GUNNER])),
        count,
      );
      for (let k = riders.length; k < count && teams.slide?.pool?.length; k++) {
        const extra: Spec = { who: teams.slide.pool[k % teams.slide.pool.length], lane: MOTION_TEXT_MID };
        actors.push(extra);
        riders.push(extra);
      }
      _.forEach(riders, (a, i) => {
        a.used = true;
        const st0 = 0.02 + i * 0.13;
        const end = Math.min(0.94, st0 + 0.22);
        const pts: [number, number, number][] = _.map(_.range(0, 7), (k) => {
          const [lx, ly] = curvePoint(Sl, k / 6, h);
          return [st0 + (end - st0) * (k / 6), slideX + lx * ms, ly * ms - 20 * ms];
        });
        const lastX = pts[pts.length - 1][1];
        delete a.x;
        delete a.action;
        Object.assign(a, { lane: MOTION_TEXT_MID, facing: MOTION_TEXT_RIGHT });
        a.path = [[0, pts[0][1], pts[0][2]], ...pts, [Math.min(1, end + 0.04), lastX + 30, 0], [1, lastX + 420, 0]];
        a.actions = [
          [0, MOTION_TEXT_SLIDE],
          [end, MOTION_TEXT_RUN],
        ];
        a.show = [st0, Math.min(1, end + 0.3)];
      });
      focusXs.push(E.x - 60, slideX + Sl.x1 * ms + 200);
    }
    if (!_.isEmpty(anim)) anchor.item.anim = anim;
  }
  ladderClimb(actors, items, focusXs);
  for (const a of actors) delete a.used;
  if (focusXs.length) {
    const lo = _.min(focusXs) as number,
      hi = _.max(focusXs) as number;
    const span = Math.max(900, hi - lo + 260);
    const zoom = _.clamp((frame.vw * frame.zoom) / span, 0.95, 1.25);
    for (const k of [MOTION_TEXT_MOVE, MOTION_TEXT_DRIFT, MOTION_TEXT_AMOUNT, MOTION_TEXT_FOLLOW, MOTION_TEXT_OFFSET, MOTION_TEXT_ZOOMTO]) delete camera[k];
    Object.assign(camera, { x: (lo + hi) / 2, zoom, move: MOTION_TEXT_DRIFT, drift: 30, lift: -60 });
  }
  return style;
};
const ROLE_LABEL: Record<string, string> = {
  gunner: MOTION_TEXT_ARMED_WITH_GUNS_POLICE_SPECIAL_FORCES_SOLDIERS_GANGSTERS,
  fighter: MOTION_TEXT_MELEE_FIGHTERS_SWORDS_SPEARS_ARMOR,
  pilot: MOTION_TEXT_PILOTS,
  crew: MOTION_TEXT_CREW,
  student: MOTION_TEXT_STUDENTS_PUPILS,
  teacher: MOTION_TEXT_TEACHERS,
  judge: MOTION_TEXT_JUDGES,
  medic: MOTION_TEXT_DOCTORS_NURSES,
  royal: MOTION_TEXT_KINGS_QUEENS_EMPERORS,
  cook: MOTION_TEXT_COOKS,
  clerk: MOTION_TEXT_CLERKS_TELLERS_WAITERS,
  worshipper: MOTION_TEXT_PRIESTS_MONKS_NUNS,
};
export const roleGuide = (custom: { id: string }[] = []): string => {
  const roles = registry().interact.roles;
  const engine = loadMotionEngine().engine as { rolesOf?: (def: unknown) => string[] };
  const all: Record<string, string[]> = { ...roles, ..._.fromPairs(_.map(custom, (c) => [c.id, engine.rolesOf ? engine.rolesOf(c) : []])) };
  const lines = _.compact(
    _.map(ROLE_LABEL, (label, role) => {
      const ids = _.keys(_.pickBy(all, (r) => _.includes(r, role)));
      return ids.length ? MOTION_TEMPLATE_SYMBOL_46(`${role}`, `${label}`, `${ids.join(MOTION_TEXT_SYMBOL_14)}`) : null;
    }),
  );
  return lines.length ? MOTION_TEMPLATE_CHARACTER_ROLES_THE_DIRECTOR_SEATS_ARMS_AND_PLACES(`${lines.join(MOTION_TEXT_SYMBOL_27)}`) : "";
};
export const stagingNote = (envId: string): string => {
  const env = registry().envs[envId];
  const st = env?.staging;
  if (!st) return "";
  const parts: string[] = [];
  for (const r of st.rows || []) parts.push(MOTION_TEMPLATE_ROWS_OF(`${r.asset}`, `${r.mode === MOTION_TEXT_BEHIND ? MOTION_TEXT_WITH_PEOPLE_SEATED_BEHIND_THEM : MOTION_TEXT_TO_SIT_ON}`, `${r.crowd || r.fillParam ? MOTION_TEXT_AUTO_FILLED_WITH_BACKGROUND_PEOPLE : ""}`));
  for (const s of st.seats || []) parts.push(MOTION_TEMPLATE_SITS_AT_THE(`${s.role || MOTION_TEXT_SOMEONE}`, `${s.asset}`));
  for (const s of st.spots || []) parts.push(MOTION_TEMPLATE_STANDS(`${s.role}`, `${s.near ? MOTION_TEMPLATE_BY_THE(`${s.near}`) : MOTION_TEXT_AT_THE_FRONT}`));
  if (st.seatedRoles?.length) parts.push(MOTION_TEMPLATE_STAY_SEATED(`${st.seatedRoles.join(MOTION_TEXT_SYMBOL_16)}`));
  for (const d of st.doors || []) parts.push(MOTION_TEMPLATE_DOOR(`${d.asset}`));
  if (st.anchor) parts.push(MOTION_TEMPLATE_ALREADY_CONTAINS_A_PARKED_NEVER_ADD_PROPS_CLIMB(`${st.anchor.asset}`, `${(st.anchor.replace || [st.anchor.asset]).join(MOTION_TEXT_SYMBOL_16)}`));
  if (st.anchorFrom) parts.push(MOTION_TEMPLATE_AN_PROP_BECOMES_A_FULL(`${st.anchorFrom.assets.join(MOTION_TEXT_SYMBOL_16)}`, `${st.anchorFrom.as}`));
  if (st.prefer?.cover) parts.push(MOTION_TEMPLATE_TAKE_COVER_USES(`${st.prefer.cover}`));
  if (st.prefer?.bed) parts.push(MOTION_TEMPLATE_LIE_ON_THE(`${st.prefer.bed}`));
  if (st.prefer?.seat && st.prefer.seat !== MOTION_TEXT_CHAIR) parts.push(MOTION_TEMPLATE_SITTING_USES(`${st.prefer.seat}`));
  if (st.aisle) parts.push(MOTION_TEMPLATE_STANDING_PEOPLE_USE_LANE(`${st.aisle}`));
  return parts.length ? MOTION_TEMPLATE_STAGING(`${parts.join(MOTION_TEXT_SYMBOL_41)}`) : "";
};
export const validateScene = (shotId: string, camera: Record<string, unknown>, actors: Spec[], items: Spec[], frame: Frame): string[] => {
  const issues: string[] = [];
  const cx = _.toNumber(camera.x) || frame.cx;
  const zoom = _.toNumber(camera.zoom) || frame.zoom;
  const half = ((frame.vw * frame.zoom) / zoom) * 0.46;
  const still = (o: Spec) => o.x != null && !o.path;
  for (const a of actors) {
    const need = needOf(a.action);
    if (!still(a) || camera.follow || need?.seat || need?.bed || a.y) continue;
    const x = _.toNumber(a.x);
    if (x < cx - half || x > cx + half) {
      a.x = _.clamp(x, cx - half + 40, cx + half - 40);
      issues.push(MOTION_TEMPLATE_PULLED_INTO_FRAME(`${shotId}`, `${a.who}`));
    }
  }
  const standing = _.filter(actors, (a) => still(a) && !_.includes(_.keys(registry().interact.needs), a.action) && !a.y);
  for (let i = 0; i < standing.length; i++)
    for (let j = 0; j < i; j++) {
      const a = standing[i],
        b = standing[j];
      if (a.lane !== b.lane || Math.abs(_.toNumber(a.x) - _.toNumber(b.x)) >= 50) continue;
      a.x = _.toNumber(b.x) + (_.toNumber(a.x) >= _.toNumber(b.x) ? 70 : -70);
      issues.push(MOTION_TEMPLATE_OVERLAPPED(`${shotId}`, `${a.who}`, `${b.who}`));
    }
  const solid = _.filter(items, (it) => still(it) && (registry().assets[it.asset]?.category === MOTION_TEXT_FURNITURE || !!affordOf(it.asset)?.cover) && !affordOf(it.asset)?.seat);
  for (let i = 0; i < solid.length; i++)
    for (let j = 0; j < i; j++) {
      const a = solid[i],
        b = solid[j];
      if (a.lane !== b.lane) continue;
      const wa = (sizeOf(a.asset)[0] * (a.scale || 1)) / 2,
        wb = (sizeOf(b.asset)[0] * (b.scale || 1)) / 2;
      const gap = Math.abs(_.toNumber(a.x) - _.toNumber(b.x));
      if (gap >= (wa + wb) * 0.7) continue;
      a.x = _.toNumber(b.x) + (_.toNumber(a.x) >= _.toNumber(b.x) ? 1 : -1) * (wa + wb + 10);
      issues.push(MOTION_TEMPLATE_OVERLAPPED(`${shotId}`, `${a.asset}`, `${b.asset}`));
    }
  return issues;
};
