import _ from "lodash";
import { PUPPET as P } from "../../../constants/motionPuppet.js";
import { PUPPET_SET as Q, PUPPET_SLOTS } from "../../../constants/motionPuppetSets.js";
import { MOTION_PACK as PACK } from "../../../constants/motionPack.js";
import { puppetPackActive } from "./packPolicy.js";
import { MOTION_LIBRARY_RELEASE as RELEASE } from "../../../constants/motionLibraryRelease.js";
import { motionPieceContactSpots } from "../../../lib/motionResourceSemantics.js";
import { MOTION_STAGE_CONSTRAINTS as C } from "../../../constants/motionStageConstraints.js";
import { MOTION_STAGE_GEOMETRY as G } from "../../../constants/motionStageGeometry.js";
import { puppetFloorContacts } from "../../../lib/motionStageGeometry.js";
import type { PuppetBase, PuppetPiece, PuppetComposition, PuppetLight, PuppetSpot, PuppetFixture } from "../../../types/motionPuppet.js";
const W = P.SET_W;
const H = P.SET_H;
const persp = (y: number, hz: number, fy: number): number => _.clamp(P.PERSP_MIN + (P.PERSP_SPAN * (y - hz)) / Math.max(1, fy - hz), P.PERSP_MIN, 1);
const prefixIds = (svg: string, n: string): string => svg.replace(Q.ID_RE, (_m, id) => Q.ID_ATTR(Q.PREFIX(n, id))).replace(Q.URL_RE, (_m, id) => Q.URL_REF(Q.PREFIX(n, id)));
const splitSvg = (svg: string): { defs: string; inner: string } => {
  const m = svg.match(Q.INNER_RE);
  const body = m ? m[1] : P.EMPTY;
  const d = body.match(Q.DEFS_RE);
  return { defs: d ? d[1] : P.EMPTY, inner: d ? body.replace(d[0], P.EMPTY) : body };
};
const between = (s: string, a: string, b: string): string => {
  const i = s.indexOf(a);
  if (i < 0) return P.EMPTY;
  const from = i + a.length;
  const j = b ? s.indexOf(b, from) : -1;
  const body = j < 0 ? s.slice(from) : s.slice(from, j);
  return body.endsWith(Q.G_CLOSE) ? body.slice(0, -Q.G_CLOSE.length) : body;
};
const baseParts = (svg: string) => {
  const { defs } = splitSvg(svg);
  return { defs, sky: between(svg, Q.BASE_MARK_SKY, Q.BASE_MARK_BACK), back: between(svg, Q.BASE_MARK_BACK, Q.BASE_MARK_FLOOR), floor: between(svg, Q.BASE_MARK_FLOOR, Q.SVG_END) };
};
const swapSides = (s: string): string => s.replace(Q.LEFT_RIGHT_RE, (m) => Q.SWAP[m] || m);
const swapKey = (k: string): string => swapSides(k.split(Q.KEY_SPLIT).join(Q.KEY_JOIN)).split(Q.KEY_JOIN).join(Q.KEY_SPLIT);
export const puppetBaseFamily = (b: Pick<PuppetBase, "interior">): string => (b.interior ? Q.FAMILY_INTERIOR : Q.FAMILY_EXTERIOR);
export const puppetPieceSlots = (base: Pick<PuppetBase, "interior">, piece: Pick<PuppetPiece, "slots" | "kind" | "placementSurface">): string[] => (!base.interior && piece.kind === "building" && !piece.placementSurface && piece.slots.some((slot) => (C.BUILDING_SLOTS as readonly string[]).includes(slot)) ? _.uniq([...piece.slots, ...C.BUILDING_SLOTS]) : piece.slots);
export interface PuppetComposed {
  framingBounds: [number, number, number, number][];
  features: string[];
  fixtures: PuppetFixture[];
  compositions: PuppetComposition[];
  svg: string;
  spots: PuppetSpot[];
  lights: PuppetLight[];
  floorY: number;
  horizonY: number;
}
export const piecePlacement = (base: PuppetBase, slot: string, piece: PuppetPiece) => {
  const sd = PUPPET_SLOTS[puppetBaseFamily(base)][slot];
  if (!sd) return null;
  const region = sd.region ? base.regions?.[sd.region]?.bounds : undefined;
  if ((sd.region && !region) || (piece.placementSurface && sd.region !== piece.placementSurface)) return null;
  const hz = base.horizonY,
    fy = base.floorY,
    box = piece.box,
    a = piece.anchor;
  const ty = region ? region[1] + (sd.d || 0) * region[3] : sd.wall != null ? hz * sd.wall : hz + (sd.d || 0) * (fy - hz),
    tx = region ? region[0] + sd.x * region[2] : sd.x * W;
  let s = piece.native ? persp(ty, hz, fy) / persp(a[1], piece.native.hz, piece.native.fy) : (((piece.size || P.SIZE_DEFAULT) / P.PERSON_M) * P.PERSON_H * H * persp(ty, hz, fy)) / (Math.max(box[2], box[3]) * P.PROP_FILL);
  const naturalScale = s;
  if (sd.maxW && box[2] * s > sd.maxW * W) s = (sd.maxW * W) / box[2];
  if (base.libraryVersion === RELEASE.VERSION) {
    const points = [
      [box[0], box[1]],
      [box[0] + box[2], box[1] + box[3]],
      ...piece.spots.flatMap((spot) => [
        [spot.x, spot.y],
        [spot.x, spot.groundY ?? spot.y],
        [spot.x, spot.seatY ?? spot.y],
      ]),
    ];
    for (const [x, y] of points) {
      const dx = x - a[0],
        dy = y - a[1];
      if (dx) s = Math.min(s, dx > 0 ? (W - tx) / dx : tx / -dx);
      if (dy) s = Math.min(s, dy > 0 ? (H - ty) / dy : ty / -dy);
    }
    for (const spot of piece.spots) {
      if (![P.SPOT_STAND, P.SPOT_DOOR, P.SPOT_LIE].some((kind) => kind === spot.kind)) continue;
      const dx = spot.x - a[0];
      if (dx) s = Math.min(s, dx > 0 ? (W - G.ACTOR_INSET - tx) / dx : (tx - G.ACTOR_INSET) / -dx);
    }
    if (!Number.isFinite(s) || s <= 0) return null;
  }
  return { slot, piece, sd, tx, ty, s, naturalScale, hz, fy, box: [tx + (box[0] - a[0]) * s, ty + (box[1] - a[1]) * s, box[2] * s, box[3] * s] };
};
export const boxesOverlap = (a: number[], b: number[]): boolean => a[0] < b[0] + b[2] && a[0] + a[2] > b[0] && a[1] < b[1] + b[3] && a[1] + a[3] > b[1];
export const pieceSpots = ({ piece, tx, ty, s, naturalScale, hz, fy }: NonNullable<ReturnType<typeof piecePlacement>>): PuppetSpot[] =>
  motionPieceContactSpots(piece).map((sp) => ({
    ...sp,
    scale: piece.native ? persp(sp.groundY ?? sp.y, piece.native.hz, piece.native.fy) * s : persp(ty + ((sp.groundY ?? sp.y) - piece.anchor[1]) * s, hz, fy) * Math.min(1, s / naturalScale),
    x: Math.round(tx + (sp.x - piece.anchor[0]) * s),
    y: Math.round(ty + (sp.y - piece.anchor[1]) * s),
    ...(sp.groundY != null ? { groundY: Math.round(ty + (sp.groundY - piece.anchor[1]) * s) } : {}),
    ...(sp.seatY != null ? { seatY: Math.round(ty + (sp.seatY - piece.anchor[1]) * s) } : {}),
    ...(sp.bounds ? { bounds: [tx + (sp.bounds[0] - piece.anchor[0]) * s, ty + (sp.bounds[1] - piece.anchor[1]) * s, sp.bounds[2] * s, sp.bounds[3] * s] as [number, number, number, number] } : {}),
  }));
export const composePuppetSet = (base: PuppetBase, placed: { slot: string; piece: PuppetPiece }[], night: boolean, mirror: boolean, fixtureStates: Record<string, string> = {}): PuppetComposed => {
  const hz = base.horizonY,
    fy = base.floorY;
  const b = _.mapValues(baseParts(night && base.night ? base.night : base.svg), (part) => prefixIds(part, Q.BASE_PREFIX));
  const layers: Record<string, string[]> = _.fromPairs(_.map(Q.LAYERS, (l) => [l, [] as string[]]));
  const defs: string[] = [b.defs];
  const fixtures: PuppetFixture[] = [];
  const spots: PuppetSpot[] = [];
  const bindings: (Omit<PuppetComposition, "roles"> & { roles: Record<string, number> })[] = [];
  const lights: PuppetLight[] = [];
  const occ: string[] = [];
  const footprints: { key: string; box: number[] }[] = [];
  const placements = placed.map(({ slot, piece }) => piecePlacement(base, slot, piece));
  if (base.libraryVersion === RELEASE.VERSION && placements.some((placement) => !placement)) throw new Error(RELEASE.PLAN_INVALID);
  const items = _.sortBy(_.compact(placements), (it) => it.ty);
  items.forEach((placement, i) => {
    const { piece, sd, tx, ty, s, box: footprint } = placement;
    const box = piece.box,
      a = piece.anchor;
    if ((puppetPackActive() || base.libraryVersion === RELEASE.VERSION) && !sd.wall) {
      const current = { key: piece.key, box: footprint };
      const overlap = footprints.find(({ box: other }) => boxesOverlap(current.box, other));
      if (overlap) throw new Error(PACK.ASSEMBLY_OVERLAP(overlap.key, piece.key));
      footprints.push(current);
    }
    const state = piece.stateKey && fixtureStates[piece.stateKey];
    if (state && !piece.states?.[state]) throw new Error(RELEASE.PLAN_INVALID);
    const artwork = state ? piece.states![state] : piece;
    const src = splitSvg(prefixIds(night && artwork.night ? artwork.night : artwork.svg, Q.PIECE_PREFIX(i)));
    defs.push(src.defs);
    const nested = Q.NESTED(tx - (a[0] - box[0]) * s, ty - (a[1] - box[1]) * s, box[2] * s, box[3] * s, Q.VB(box), src.inner);
    if (piece.stateKey && piece.states) fixtures.push({ key: piece.stateKey, layer: nested, states: Object.fromEntries(Object.entries(piece.states).map(([key, value]) => [key, Q.NESTED(tx - (a[0] - box[0]) * s, ty - (a[1] - box[1]) * s, box[2] * s, box[3] * s, Q.VB(box), splitSvg(prefixIds(night && value.night ? value.night : value.svg, Q.PIECE_PREFIX(i))).inner)])) });
    layers[sd.layer].push(nested);
    if (piece.front && _.includes(Q.OCC_LAYERS, sd.layer)) occ.push(Q.OCC(ty, mirror ? Q.MIRROR(nested) : nested));
    const offset = spots.length;
    for (const composition of piece.compositions || []) {
      const roles = Object.fromEntries(Object.entries(composition.roles).map(([role, key]) => [role, piece.spots.findIndex((spot) => spot.key === key)]));
      if (Object.values(roles).every((index) => index >= 0)) bindings.push({ ...composition, key: Q.PREFIX(Q.PIECE_PREFIX(i), composition.key), roles: Object.fromEntries(Object.entries(roles).map(([role, index]) => [role, index + offset])) });
    }
    spots.push(...pieceSpots(placement));
    for (const l of piece.lights || []) lights.push({ x: Math.round(tx + (l.x - a[0]) * s), y: Math.round(ty + (l.y - a[1]) * s), color: Q.LIGHT_COLOR, kind: l.kind });
  });
  for (const [key, x, label] of P.SPOT_FRONT) spots.push({ key, kind: P.SPOT_STAND, x: Math.round(x * W), y: fy - P.SPOT_INSET, label });
  spots.push({ key: P.SPOT_OPEN_KEY, kind: P.SPOT_OPEN, x: W / 2, y: fy - P.SPOT_OPEN_INSET, label: P.SPOT_OPEN_LABEL });
  spots.push({ key: P.SPOT_FLOOR_KEY, kind: P.SPOT_LIE, x: W / 2, y: fy - P.SPOT_INSET, label: P.SPOT_FLOOR_LABEL });
  spots.push(...puppetFloorContacts(fy, hz));
  const seen: Record<string, number> = {};
  let out = _.map(spots, (sp) => {
    seen[sp.key] = (seen[sp.key] || 0) + 1;
    return seen[sp.key] > 1 ? { ...sp, key: Q.DUP(sp.key, seen[sp.key]) } : sp;
  });
  let outLights = lights;
  let compositions = bindings.map((binding) => ({ ...binding, roles: Object.fromEntries(Object.entries(binding.roles).map(([role, index]) => [role, out[index].key])) }));
  const back = b.back + layers.back.join(P.EMPTY) + b.floor;
  let groups = [back, layers.mid.join(P.EMPTY), layers.floor.join(P.EMPTY), layers.fg.join(P.EMPTY)];
  if (mirror) {
    groups = _.map(groups, (g) => (g ? Q.MIRROR(g) : g));
    out = _.map(out, (sp) => ({ ...sp, ...(sp.face ? { face: swapSides(sp.face) } : {}), ...(sp.fixture ? { fixture: swapKey(sp.fixture) } : {}), ...(sp.bounds ? { bounds: [W - sp.bounds[0] - sp.bounds[2], sp.bounds[1], sp.bounds[2], sp.bounds[3]] as [number, number, number, number] } : {}), x: W - sp.x, key: swapKey(sp.key), label: swapSides(sp.label) }));
    outLights = _.map(lights, (l) => ({ ...l, x: W - l.x }));
    compositions = compositions.map((composition) => ({ ...composition, ...(composition.contacts ? { contacts: composition.contacts.map((contact) => ({ ...contact, actor: swapKey(contact.actor), target: swapKey(contact.target) })) } : {}), roles: Object.fromEntries(Object.entries(composition.roles).map(([role, key]) => [swapKey(role), swapKey(key)])) }));
  }
  const contacts = _.take(out, P.SPOTS_MAX * 2);
  const framingBounds = placed.flatMap(({ slot, piece }) => {
    const placement = piecePlacement(base, slot, piece);
    if (!placement) return [];
    const [x, y, w, h] = placement.box;
    return [[mirror ? W - x - w : x, y, w, h] as [number, number, number, number]];
  });
  return {
    framingBounds,
    features: [base.key, ...placed.map(({ piece }) => piece.key)],
    fixtures,
    svg: Q.SET_SVG(defs.join(P.EMPTY), b.sky, groups[0], groups[1], groups[2], groups[3], occ.join(P.EMPTY)),
    compositions: compositions.filter((composition) => Object.values(composition.roles).every((key) => contacts.some((spot) => spot.key === key))),
    spots: contacts,
    lights: _.take(outLights, P.LIGHTS_MAX),
    floorY: fy,
    horizonY: hz,
  };
};
