import _ from "lodash";
import { PUPPET as P } from "../../../constants/motionPuppet.js";
import type { PuppetFrame, PuppetFrameActor, PuppetProp, PuppetSet, PuppetSpot, PuppetStyleBody } from "../../../types/motionPuppet.js";

type SetLike = Pick<PuppetSet, "floorY" | "horizonY" | "spots"> & Partial<Pick<PuppetSet, "lights">>;
type PropLike = Pick<PuppetProp, "height" | "size" | "mount">;
export interface PuppetLayoutCtx { set?: SetLike | null; prop?: PropLike | null; body: Pick<PuppetStyleBody, "head" | "headW" | "bodyW">; heights: Record<string, number>; }
type Placed = Pick<PuppetFrame, "shot" | "actors" | "prop" | "propAt" | "propX" | "propY" | "propH" | "overlays" | "smokeX" | "smokeY" | "form" | "anchor">;

const W = P.SET_W;
const H = P.SET_H;
const keyOf = (v: unknown): string | null => {
  const k = _.snakeCase(_.toString(v || P.EMPTY));
  return P.KEY_RE.test(k) ? k : null;
};

export const cleanPuppetSpots = (raw: unknown): PuppetSpot[] =>
  _.take(
    _.uniqBy(
      _.compact(
        _.map(_.castArray(raw || []), (s: any) => {
          const key = keyOf(s?.key);
          const kind = _.toString(s?.kind);
          const x = Number(s?.x), y = Number(s?.y);
          if (!key || !_.includes(P.SPOT_KINDS, kind) || !_.isFinite(x) || !_.isFinite(y)) return null;
          return { key, kind, x: Math.round(_.clamp(x, 0, W)), y: Math.round(_.clamp(y, 0, H)), label: _.truncate(_.toString(s?.label || key), { length: P.SPOT_LABEL_MAX }) };
        }),
      ),
      (s) => s.key,
    ),
    P.SPOTS_MAX,
  );

export const puppetHorizon = (s: SetLike | null | undefined): number => {
  const fy = s?.floorY || P.FLOOR_DEFAULT;
  if (s?.horizonY) return s.horizonY;
  const stands = _.filter(s?.spots || [], (p) => p.kind !== P.SPOT_SURFACE && p.kind !== P.SPOT_HANG);
  const top = stands.length ? _.min(_.map(stands, (p) => p.y))! - P.HORIZON_MARGIN : fy - P.HORIZON_GAP;
  return _.clamp(top, fy - P.HORIZON_GAP * 2, fy - P.HORIZON_MARGIN * 2);
};

export const puppetSpots = (s: SetLike | null | undefined): PuppetSpot[] => {
  const fy = s?.floorY || P.FLOOR_DEFAULT;
  const base: PuppetSpot[] = [
    ..._.map(P.SPOT_FRONT, ([key, x, label]) => ({ key, kind: P.SPOT_STAND, x: Math.round(x * W), y: fy - P.SPOT_INSET, label })),
    { key: P.SPOT_OPEN_KEY, kind: P.SPOT_OPEN, x: W / 2, y: fy - P.SPOT_OPEN_INSET, label: P.SPOT_OPEN_LABEL },
    { key: P.SPOT_FLOOR_KEY, kind: P.SPOT_LIE, x: W / 2, y: fy - P.SPOT_INSET, label: P.SPOT_FLOOR_LABEL },
  ];
  const own = s?.spots || [];
  return _.filter(own, { kind: P.SPOT_STAND }).length >= P.SPOT_STAND_MIN ? own : _.uniqBy([...own, ...base], (p) => p.key);
};

export const puppetSpotsText = (place: string, s: SetLike | null | undefined): string => P.PLACE_SPOTS(place, _.map(puppetSpots(s), (p) => P.SPOT_TEXT(p.key, p.kind, p.label)).join(P.SPOT_SEP));

const ACTOR_KINDS = [P.SPOT_STAND, P.SPOT_SIT, P.SPOT_LIE, P.SPOT_DOOR];

export const puppetFormOf = (f: Pick<PuppetFrame, "form" | "shot" | "prop">, main: PuppetFrameActor[]): string => {
  if (f.form && _.includes(P.FORMS, f.form)) return f.form;
  if (main.length > 1 && _.some(main, (a) => a.pose === P.SPOT_LIE)) return P.FORM_ATTEND;
  if (f.shot === P.SHOT_OBJECT && f.prop && main.length >= 2) return P.FORM_AROUND;
  if (main.length === 2) return _.includes(P.SHOT_PAIR, f.shot) ? P.FORM_TALK : P.FORM_PAIR;
  if (main.length >= 3) return P.FORM_ROW;
  return P.FORM_SINGLE;
};
const wantKind = (a: PuppetFrameActor): string => P.POSE_KIND[a.pose] || P.SPOT_STAND;

interface Item { x: number; y: number; w: number; fixed: boolean; actor?: number; group?: number; }

const separate = (items: Item[]): void => {
  const gap = P.LAYOUT_GAP * W;
  for (let round = 0; round < P.LAYOUT_ROUNDS; round++) {
    let moved = false;
    const order = _.sortBy(items, (it) => it.x);
    for (let i = 0; i < order.length; i++)
      for (let j = i + 1; j < order.length; j++) {
        const a = order[i], b = order[j];
        if (Math.abs(a.y - b.y) > P.LAYOUT_DEPTH || (a.group != null && a.group === b.group)) continue;
        const need = (a.w + b.w) / 2 + gap - (b.x - a.x);
        if (need <= 0) continue;
        moved = true;
        if (a.fixed && b.fixed) continue;
        if (a.fixed) b.x += need;
        else if (b.fixed) a.x -= need;
        else {
          a.x -= need / 2;
          b.x += need / 2;
        }
      }
    for (const it of items) if (!it.fixed) it.x = _.clamp(it.x, P.LAYOUT_EDGE * W + it.w / 2, W - P.LAYOUT_EDGE * W - it.w / 2);
    if (!moved) return;
  }
};

export const layoutPuppetFrame = <T extends Placed>(f: T, ctx: PuppetLayoutCtx): T => {
  const fy = ctx.set?.floorY || P.FLOOR_DEFAULT;
  const hz = puppetHorizon(ctx.set);
  const persp = (y: number): number => _.clamp(P.PERSP_MIN + (P.PERSP_SPAN * (y - hz)) / Math.max(1, fy - hz), P.PERSP_MIN, 1);
  const spots = puppetSpots(ctx.set);
  const byKey = _.keyBy(spots, (s) => s.key);
  const personH = (char: string): number => P.PERSON_H * H * (ctx.heights[char] || 1);
  const personW = (char: string): number => personH(char) * ctx.body.head * ctx.body.headW * Math.max(1, ctx.body.bodyW) * P.PERSON_W;
  const used = new Set<string>();
  const front = new Set(_.map(P.SPOT_FRONT, (s) => s[0]));
  const pick = (kind: string, order: number): PuppetSpot | null => {
    const free = _.filter(spots, (s) => s.kind === kind && !used.has(s.key));
    if (!free.length) return null;
    const target = (W * (order + 1)) / (f.actors.length + 1);
    return _.sortBy(free, (s) => (front.has(s.key) ? 0 : P.FRONT_WEIGHT * W) + Math.abs(s.x - target))[0];
  };
  const pinned = new Set<number>();
  const actors = _.map(f.actors, (a, i) => {
    if (a.depth === P.DEPTH_FORE) return { ...a };
    const own = a.spot ? byKey[a.spot] : null;
    let s = own && _.includes(ACTOR_KINDS, own.kind) && !used.has(own.key) ? own : null;
    if (!s) s = pick(wantKind(a), i) || pick(P.SPOT_STAND, i);
    if (s) used.add(s.key);
    const y = s ? s.y : fy - P.SPOT_INSET;
    const x = s ? s.x : (W * (i + 1)) / (f.actors.length + 1);
    const wear = _.filter(a.wear || [], (w) => P.WEARABLE_RE.test(_.replace(w, /_/g, P.SPACE)));
    if (own && s === own && !front.has(own.key) && !_.includes(P.FREE_SPOTS, own.key)) pinned.add(i);
    return { ...a, spot: s?.key || a.spot, x, y, k: +persp(y).toFixed(3), wear: wear.length ? wear : undefined };
  });
  const items: Item[] = _.compact(_.map(actors, (a, i) => (a.depth === P.DEPTH_FORE ? null : { x: a.x!, y: a.y!, w: personW(a.char) * (a.k || 1), fixed: pinned.has(i), actor: i })));
  const out: T = { ...f };
  const held = _.some(f.actors, (a) => !!a.hold && a.hold === f.prop);
  const poses: Record<number, string> = {};
  const faces: Record<number, string> = {};
  const arrange = (prop: Item | null): void => {
    const all = _.filter(items, (it) => it.actor != null);
    const extras = _.filter(all, (it) => P.EXTRA_RE.test(actors[it.actor!].char));
    const people = extras.length === all.length ? all : _.difference(all, extras);
    const main = _.filter(people, (it) => !pinned.has(it.actor!));
    if (!main.length) return;
    const form = puppetFormOf(f, _.map(people, (it) => actors[it.actor!]));
    const bw = _.max(_.map(main, (it) => it.w))!;
    const anchor = f.anchor ? byKey[f.anchor] : null;
    const lying = _.find(people, (it) => actors[it.actor!].pose === P.SPOT_LIE);
    const ax = anchor ? anchor.x : form === P.FORM_AROUND && prop ? prop.x : form === P.FORM_ATTEND && lying ? lying.x : _.mean(_.map(main, (it) => it.x));
    const ay = anchor ? anchor.y : form === P.FORM_ATTEND && lying ? lying.y : _.max(_.map(main, (it) => it.y))!;
    const place = (it: Item, x: number, y: number): void => {
      if (pinned.has(it.actor!)) return;
      it.x = _.clamp(x, P.LAYOUT_EDGE * W + it.w / 2, W - P.LAYOUT_EDGE * W - it.w / 2);
      it.y = y;
      it.group = 1;
    };
    const line = (gap: number) => main.forEach((it, i) => place(it, ax + (i - (main.length - 1) / 2) * gap * bw, ay));
    if (form === P.FORM_ROW) line(P.FORM_GAP.row);
    else if (form === P.FORM_PAIR) line(P.FORM_GAP.pair);
    else if (form === P.FORM_TALK) line(P.FORM_GAP.talk);
    else if (form === P.FORM_APART) main.forEach((it, i) => place(it, ax + (i === 0 ? 0 : (i % 2 ? 1 : -1) * Math.ceil(i / 2) * P.FORM_GAP.apart * bw), ay));
    else if (form === P.FORM_ATTEND && lying) {
      const a = actors[lying.actor!];
      const len = personH(a.char) * P.LIE_LEN * persp(ay);
      const head = a.face === P.FACE_LEFT ? 1 : -1;
      place(lying, ax, ay);
      _.without(main, lying).forEach((it, i) => {
        const [side, dy] = P.ATTEND_SLOTS[Math.min(i, P.ATTEND_SLOTS.length - 1)];
        place(it, side ? ax + head * side * (len / 2 + P.ATTEND_MARGIN * it.w) : ax + P.ATTEND_BEHIND_X * len, ay + dy);
        if (i === 0 && _.includes(P.STAND_POSES, actors[it.actor!].pose)) poses[it.actor!] = P.POSE_KNEEL;
      });
    } else if (form === P.FORM_CLUSTER) {
      const half = Math.ceil(main.length / 2);
      main.forEach((it, i) => {
        const side = i < half ? 0 : 1;
        const n = side ? main.length - half : half;
        const j = side ? i - half : i;
        place(it, W * P.CLUSTER_X[side] + (j - (n - 1) / 2) * P.FORM_GAP.cluster * bw, ay);
      });
    } else if (form === P.FORM_WHISPER) {
      line(P.FORM_GAP.whisper);
      main.forEach((it, i) => (faces[it.actor!] = i < main.length / 2 ? P.FACE_RIGHT : P.FACE_LEFT));
    } else if (form === P.FORM_SEARCH) main.forEach((it, i) => place(it, ax + (i - (main.length - 1) / 2) * P.FORM_GAP.search * bw, ay - (i % 2) * P.SEARCH_DY));
    else if (form === P.FORM_FILE) main.forEach((it, i) => place(it, ax + (i - (main.length - 1) / 2) * P.FILE_DX * bw, ay - i * P.FILE_DY));
    else if (form === P.FORM_AROUND && prop) {
      main.forEach((it, i) => {
        const [sx, dy] = P.AROUND_SLOTS[Math.min(i, P.AROUND_SLOTS.length - 1)];
        place(it, prop.x + sx * (prop.w / 2 + P.AROUND_MARGIN * it.w), prop.y + dy);
      });
    }
    if (extras.length && main !== all) {
      const by = hz + P.CROWD_D * (fy - hz);
      extras.forEach((it, i) => {
        const x = W * (P.CROWD_X[0] + ((P.CROWD_X[1] - P.CROWD_X[0]) * (i + 0.5)) / extras.length);
        place(it, x, by);
        it.group = 2;
        it.w = personW(actors[it.actor!].char) * persp(by);
      });
    }
  };
  if (f.prop && ctx.prop && !held && !_.includes([P.SHOT_INSERT, P.SHOT_SYMBOL], f.shot)) {
    const size = _.clamp(Number(ctx.prop.size || ctx.prop.height) || P.SIZE_DEFAULT, P.SIZE_MIN, P.SIZE_MAX);
    const real = ((size / P.PERSON_M) * P.PERSON_H * H) / P.PROP_FILL;
    const mount = ctx.prop.mount || P.MOUNT_FLOOR;
    const at = f.propAt ? byKey[f.propAt] : null;
    const main = _.find(items, (it) => it.actor != null);
    let x: number, y: number, h: number, fixed = true, floor = true;
    if (f.shot === P.SHOT_OBJECT) {
      const s = (at && (at.kind === P.SPOT_OPEN || at.kind === P.SPOT_SURFACE) ? at : _.find(spots, { kind: P.SPOT_OPEN })) || { key: P.SPOT_OPEN_KEY, kind: P.SPOT_OPEN, x: W / 2, y: fy - P.SPOT_OPEN_INSET, label: P.SPOT_OPEN_LABEL };
      h = _.clamp(real * persp(s.y), P.OBJECT_H * H * P.OBJECT_MIN, P.OBJECT_H * H);
      x = s.x;
      y = s.y;
      floor = s.kind !== P.SPOT_SURFACE;
    } else {
      const surface = at && at.kind === P.SPOT_SURFACE ? at : mount === P.MOUNT_TABLE && !at ? _.minBy(_.filter(spots, { kind: P.SPOT_SURFACE }), (s) => Math.abs(s.x - (main?.x ?? W / 2))) : null;
      const hang = at && at.kind === P.SPOT_HANG ? at : mount === P.MOUNT_HANG && !at ? _.find(spots, { kind: P.SPOT_HANG }) || null : null;
      if (surface) {
        h = real * persp(surface.y);
        x = surface.x;
        y = surface.y;
        floor = false;
      } else if (hang) {
        h = real * persp(fy);
        x = hang.x;
        y = hang.y + h * P.PROP_FILL;
        floor = false;
      } else if (at && at.kind === P.SPOT_OPEN) {
        h = real * persp(at.y);
        x = at.x;
        y = at.y;
      } else {
        const ay = main ? main.y : fy - P.SPOT_OPEN_INSET;
        h = real * persp(ay);
        const side = main && main.x > W / 2 ? -1 : 1;
        x = main ? main.x + side * (main.w / 2 + (h * P.PROP_W) / 2) * P.BESIDE : W / 2;
        y = mount === P.MOUNT_AIR ? ay - personH(f.actors[0]?.char || P.EMPTY) * P.AIR_LIFT : ay;
        fixed = false;
      }
    }
    const item: Item = { x, y, w: h * P.PROP_W, fixed };
    if (floor) items.push(item);
    arrange(item);
    separate(items);
    out.propX = +(_.clamp(item.x, 0, W) / W).toFixed(4);
    out.propY = Math.round(y);
    out.propH = Math.round(h);
  } else {
    arrange(null);
    separate(items);
    if (held) Object.assign(out, { propX: undefined, propY: undefined, propH: undefined });
  }
  for (const it of items) if (it.actor != null) actors[it.actor] = { ...actors[it.actor], ...(poses[it.actor] ? { pose: poses[it.actor] } : {}), ...(faces[it.actor] ? { face: faces[it.actor] } : {}), x: +(it.x / W).toFixed(4), y: Math.round(it.y), k: +persp(it.y).toFixed(3) };
  out.actors = actors;
  return smokeOf(out, ctx, spots);
};

const smokeOf = <T extends Placed>(f: T, ctx: PuppetLayoutCtx, spots: PuppetSpot[]): T => {
  if (!_.some(f.overlays, (o) => _.includes(P.SMOKE_OVERLAYS, o))) return f;
  const near = (list: { x: number; y: number }[]) => {
    const xs = _.compact(_.map(f.actors, (a) => (a.x != null ? a.x * W : null)));
    const cx = xs.length ? _.mean(xs) : W / 2;
    return _.minBy(list, (p) => Math.abs(p.x - cx)) || null;
  };
  let at: { x: number; y: number } | null = null;
  const held = _.some(f.actors, (a) => a.hold === f.prop || _.includes(a.wear || [], f.prop));
  const source = !!f.prop && !held && P.SMOKE_SOURCE_RE.test(f.prop);
  const altar = _.map(_.filter(spots, (p) => p.kind === P.SPOT_SURFACE && P.SMOKE_SPOT_RE.test(p.key + P.SPACE + (p.label || P.EMPTY))), (p) => ({ x: p.x, y: p.y - P.SMOKE_TIP }));
  if (source && f.propH != null && f.propY != null && f.propX != null) at = { x: f.propX * W, y: f.propY - f.propH * P.PROP_FILL };
  else at = near(_.filter(spots, { kind: P.SPOT_SMOKE })) || near(altar) || near(_.filter(ctx.set?.lights || [], (l) => _.includes(P.SMOKE_LIGHTS, l.kind)));
  if (!at) return { ...f, overlays: _.reject(f.overlays, (o) => _.includes(P.SMOKE_OVERLAYS, o)) };
  return { ...f, smokeX: Math.round(at.x), smokeY: Math.round(at.y) };
};
