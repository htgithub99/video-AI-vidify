import { RUNTIME_TEXT as RT_SERVER } from "../../../constants/runtime/server.js";
import { RUNTIME_TEXT as RT_SHARED } from "../../../constants/runtime/shared.js";
import { stringifyJson } from "../../../lib/jsonStringify.js";
import { MOTION_EFFECTS as EFFECTS } from "../../../constants/motionEffects.js";
import { puppetReadObjects } from "../../../lib/motionReadObjects.js";
import { MOTION_ILLUSTRATION_POLICY as I } from "../../../constants/motionIllustrationPolicy.js";
import { puppetSupportTokens as featureTokens, puppetKeyOf as keyOf } from "../../../lib/motionPuppetValues.js";
import _ from "lodash";
import { MOTION_LIBRARY_RELEASE as RELEASE } from "../../../constants/motionLibraryRelease.js";
import { puppetObjectCatalogKey, puppetObjectIsGeometry, puppetObjectNeedsSpot, puppetSceneFeatureFits, puppetSetFeatureEvidence } from "../../../lib/motionPuppetAssets.js";
import { PUPPET as P } from "../../../constants/motionPuppet.js";
import { MOTION_PLACEMENT as M } from "../../../constants/motionPlacement.js";
import { choosePuppetBlocking } from "./blocking.js";
import { MOTION_BLOCKING as B } from "../../../constants/motionBlocking.js";
import { MOTION_PACK as PACK } from "../../../constants/motionPack.js";
import { puppetSpotGeometryValid, puppetSupportCompatible, puppetSupportKey } from "../../../lib/motionPlacement.js";
import type { PuppetActorState, PuppetFrame, PuppetFrameActor, PuppetProp, PuppetRead, PuppetSet, PuppetSpot, PuppetStyleBody, PuppetObject } from "../../../types/motionPuppet.js";
import { puppetObjectParent, puppetNestedPropIssues, puppetPropSurface } from "../../../lib/motionPropSupport.js";
import { MOTION_STAGE_CONSTRAINTS as C } from "../../../constants/motionStageConstraints.js";
import { puppetActorAssignments, puppetSpatialAnchorMatches } from "./spatialPlacement.js";
import { puppetFloorContacts } from "../../../lib/motionStageGeometry.js";
type SetLike = Pick<PuppetSet, "floorY" | "horizonY" | "spots"> & Partial<Pick<PuppetSet, "lights" | "compositions" | "libraryVersion" | "locationFamily">>;
type PropLike = Pick<PuppetProp, "height" | "size" | "mount"> & Partial<Pick<PuppetProp, "key" | "base" | "surface" | "attachment">>;
export interface PuppetLayoutCtx {
  set?: SetLike | null;
  prop?: PropLike | null;
  props?: Record<string, PropLike | null>;
  body: Pick<PuppetStyleBody, "head" | "headW" | "bodyW">;
  heights: Record<string, number>;
}
type Placed = Pick<PuppetFrame, "propDepthY" | "propParent" | "layoutLocked" | "contacts" | "blocking" | "shot" | "actors" | "items" | "prop" | "propMount" | "propSupport" | "propAt" | "propX" | "propY" | "propH" | "propRot" | "overlays" | "smokeX" | "smokeY" | "effectSource" | "effectTarget" | "effectMode" | "form" | "anchor">;
const W = P.SET_W;
const H = P.SET_H;
export const cleanPuppetSpots = (raw: unknown): PuppetSpot[] =>
  _.take(
    _.uniqBy(
      _.compact(
        _.map(_.castArray(raw || []), (s: any) => {
          const key = keyOf(s?.key);
          const kind = _.toString(s?.kind);
          const x = Number(s?.x),
            y = Number(s?.y);
          if (!key || !_.includes(P.SPOT_KINDS, kind) || !_.isFinite(x) || !_.isFinite(y)) return null;
          return {
            key,
            kind,
            x: Math.round(_.clamp(x, 0, W)),
            y: Math.round(_.clamp(y, 0, H)),
            ...(_.includes(P.FACES, s?.face) ? { face: s.face as string } : {}),
            ...(s?.groundY != null && _.isFinite(Number(s.groundY)) ? { groundY: Math.round(_.clamp(Number(s.groundY), 0, H)) } : {}),
            ...(s?.scale != null && Number.isFinite(s.scale) && s.scale > 0 ? { scale: s.scale as number } : {}),
            ...(kind === P.SPOT_SIT && s?.seatY != null && _.isFinite(Number(s.seatY)) ? { seatY: Math.round(_.clamp(Number(s.seatY), 0, H)) } : {}),
            ...(keyOf(s?.fixture) ? { fixture: keyOf(s.fixture)! } : {}),
            ...(M.RELATIONS[s?.relation] ? { relation: s.relation as string } : {}),
            ...(Array.isArray(s?.bounds) && s.bounds.length === 4 && s.bounds.every((v: unknown) => Number.isFinite(v)) ? { bounds: s.bounds as [number, number, number, number] } : {}),
            label: _.truncate(_.toString(s?.label || key), { length: P.SPOT_LABEL_MAX }),
          };
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
  const base: PuppetSpot[] = [..._.map(P.SPOT_FRONT, ([key, x, label]) => ({ key, kind: P.SPOT_STAND, x: Math.round(x * W), y: fy - P.SPOT_INSET, label })), { key: P.SPOT_OPEN_KEY, kind: P.SPOT_OPEN, x: W / 2, y: fy - P.SPOT_OPEN_INSET, label: P.SPOT_OPEN_LABEL }, { key: P.SPOT_FLOOR_KEY, kind: P.SPOT_LIE, x: W / 2, y: fy - P.SPOT_INSET, label: P.SPOT_FLOOR_LABEL }];
  const own = s?.spots || [];
  const ground: PuppetSpot[] = own
    .filter((spot) => [P.SPOT_DOOR, P.SPOT_LIE, P.SPOT_SURFACE, P.SPOT_SIT].some((kind) => kind === spot.kind))
    .flatMap((spot) => {
      const reference = own.filter((other) => other.kind === P.SPOT_STAND && (!spot.fixture || other.fixture === spot.fixture)).sort((a, b) => Math.abs(a.x - spot.x) - Math.abs(b.x - spot.x))[0];
      const y = spot.groundY ?? ([P.SPOT_SURFACE, P.SPOT_SIT].some((kind) => kind === spot.kind) ? (reference?.groundY ?? reference?.y ?? fy) : spot.y);
      return I.PROP_ANCHOR_OFFSETS.map((offset, index) => ({ key: spot.key + RT_SERVER.PROP + index, kind: P.SPOT_OPEN, fixture: spot.fixture || spot.key, x: _.clamp(spot.x + offset, 0, W), y, label: spot.label }));
    });
  const areas = C.AREAS[s?.locationFamily || P.EMPTY] || [];
  return _.uniqBy([...own, ...ground, ...puppetFloorContacts(fy, s?.horizonY), ...(_.filter(own, { kind: P.SPOT_STAND }).length >= P.SPOT_STAND_MIN ? [] : base)], (p) => p.key).map((spot) => (areas.length && (spot.groundY ?? spot.y) >= (s?.horizonY || 0) ? { ...spot, areas: _.uniq([...(spot.areas || []), ...areas]) } : spot));
};
export const puppetSpotsText = (place: string, s: SetLike | null | undefined): string => P.PLACE_SPOTS(place, _.map(puppetSpots(s), (p) => P.SPOT_TEXT(p.key, p.kind, p.label)).join(P.SPOT_SEP));
export const puppetFormOf = (f: Pick<PuppetFrame, "form" | "shot" | "prop">, main: PuppetFrameActor[]): string => {
  if (f.form && _.includes(P.FORMS, f.form)) return f.form;
  if (main.length > 1 && _.some(main, (a) => a.pose === P.SPOT_LIE)) return P.FORM_ATTEND;
  if (f.shot === P.SHOT_OBJECT && f.prop && main.length >= 2) return P.FORM_AROUND;
  if (main.length === 2) return _.includes(P.SHOT_PAIR, f.shot) ? P.FORM_TALK : P.FORM_PAIR;
  if (main.length >= 3) return P.FORM_ROW;
  return P.FORM_SINGLE;
};
const wantKind = (a: PuppetFrameActor): string => P.POSE_KIND[a.pose] || P.SPOT_STAND;
const featureScore = (spot: PuppetSpot, key: string): number => {
  if (!puppetSpotGeometryValid(spot)) return 0;
  if (spot.areas?.includes(key)) return 1;
  if (!puppetSupportCompatible(key, puppetSupportKey(_.compact([spot.fixture, spot.key]).join(M.KEY_JOIN), spot.relation))) return 0;
  if (spot.key === key) return P.SET_W;
  const requested = featureTokens(key);
  const available = [...featureTokens(spot.fixture || spot.key), ...featureTokens(spot.label)];
  return Math.max(1, _.intersection(_.difference(requested, P.FEATURE_RELATIONS), available).length);
};
export const puppetFeatureSpot = (spots: PuppetSpot[], key: string, kind?: string): PuppetSpot | null =>
  _.maxBy(
    spots.filter((s) => (!kind || s.kind === kind) && featureScore(s, key) > 0),
    (s) => featureScore(s, key),
  ) || null;
export const puppetPropSpotCandidates = (spots: PuppetSpot[], object: Pick<PuppetObject, "mount" | "support" | "placement">): PuppetSpot[] => {
  const kind = object.mount === P.MOUNT_TABLE ? P.SPOT_SURFACE : object.mount === P.MOUNT_HANG ? P.SPOT_HANG : P.SPOT_OPEN;
  const anchors = object.placement ? spots.filter((spot) => !!puppetFeatureSpot([spot], object.placement!.anchor) && [P.SPOT_DOOR, P.SPOT_LIE, P.SPOT_SURFACE, P.SPOT_SIT].some((kind) => kind === spot.kind)) : [];
  return spots
    .filter((spot) => spot.kind === kind && (!object.support || (kind === P.SPOT_OPEN && I.FLOOR_SUPPORT.test(object.support)) || !!puppetFeatureSpot([spot], object.support, kind)) && (!object.placement || anchors.some((anchor) => Math.abs(spot.x - anchor.x) <= I.PROP_ANCHOR_DISTANCE)))
    .sort((a, b) => (object.placement ? Math.min(...anchors.map((anchor) => Math.abs(a.x - anchor.x))) - Math.min(...anchors.map((anchor) => Math.abs(b.x - anchor.x))) || a.key.localeCompare(b.key) : a.key.localeCompare(b.key)));
};
export const puppetStatePose = (state: PuppetActorState): string =>
  _.includes(P.TRAVEL_ACTIONS, state.action)
    ? P.ACTIONS[state.action]
    : state.posture && state.posture !== P.POSE_DEFAULT && _.includes(P.POSTURES, state.posture)
      ? state.posture
      : state.support && P.SEATED_SUPPORT_RE.test(state.support) && _.includes(P.SEATED_ACTIONS, state.action)
        ? P.SPOT_SIT
        : state.posture && _.includes(P.POSTURES, state.posture)
          ? state.posture
          : P.ACTIONS[state.action] || P.POSE_DEFAULT;
export const puppetSupportAssignments = (states: PuppetActorState[], spots: PuppetSpot[], preferred: Map<string, string> = new Map()): Map<string, string> | null => {
  const needs = _.sortBy(states, (state) => state.char)
    .filter((s) => s.support || (P.POSE_KIND[puppetStatePose(s)] && P.POSE_KIND[puppetStatePose(s)] !== P.SPOT_STAND))
    .map((state) => {
      const kind = P.POSE_KIND[puppetStatePose(state)] || P.SPOT_STAND;
      const candidates = _.sortBy(
        spots.filter((spot) => (spot.kind === kind || (kind === P.SPOT_STAND && spot.kind === P.SPOT_DOOR)) && puppetSpotGeometryValid(spot) && (!state.support || featureScore(spot, state.support) > 0)),
        [(spot) => spot.key !== preferred.get(state.char), (spot) => (state.support ? -featureScore(spot, state.support) : 0), (spot) => spot.key],
      );
      return { state, candidates };
    })
    .sort((a, b) => a.candidates.length - b.candidates.length);
  const owners = new Map<string, string>();
  const assign = (index: number, visited: Set<string>): boolean => {
    for (const spot of needs[index].candidates) {
      if (visited.has(spot.key)) continue;
      visited.add(spot.key);
      const owner = owners.get(spot.key);
      if (
        !owner ||
        assign(
          needs.findIndex((need) => need.state.char === owner),
          visited,
        )
      ) {
        owners.set(spot.key, needs[index].state.char);
        return true;
      }
    }
    return false;
  };
  for (let i = 0; i < needs.length; i++) if (!assign(i, new Set())) return null;
  return new Map([...owners].map(([spot, char]) => [char, spot]));
};
export const puppetSetSupportsReads = (set: SetLike, reads: PuppetRead[]): boolean => reads.every((read) => puppetActorAssignments(read, puppetSpots(set), set.compositions) !== null);
export const puppetSetPlacementNeeds = (reads: PuppetRead[]): { support: string; kind: string; count: number }[] => {
  const needs = new Map<string, { support: string; kind: string; count: number }>();
  for (const read of reads) {
    const objects = puppetReadObjects(read);
    const counts = new Map<string, number>();
    const contacts = [
      ...(read.states || []).filter((state) => !!state.support).map((state) => ({ support: state.support!, kind: P.POSE_KIND[puppetStatePose(state)] || P.SPOT_STAND })),
      ...(read.states || []).filter((state) => state.placement?.anchor && !Object.values(C.AREAS).flat().includes(state.placement.anchor) && state.placement.anchor !== state.support).map((state) => ({ support: state.placement!.anchor!, kind: P.POSE_KIND[puppetStatePose(state)] || P.SPOT_STAND })),
      ...objects.filter((object) => !puppetObjectParent(object, objects) && !puppetObjectIsGeometry(object) && [P.MOUNT_TABLE, P.MOUNT_HANG].some((mount) => mount === object.mount)).map((object) => ({ support: object.support || object.mount, kind: object.mount === P.MOUNT_TABLE ? P.SPOT_SURFACE : P.SPOT_HANG })),
      ...objects.filter((object) => object.mount === P.MOUNT_FLOOR && object.placement && !puppetObjectParent(object, objects)).map((object) => ({ support: object.placement!.anchor, kind: P.SPOT_OPEN })),
    ];
    for (const { support, kind } of contacts) {
      const key = support + P.SEP + kind;
      const count = (counts.get(key) || 0) + 1;
      counts.set(key, count);
      if (count > (needs.get(key)?.count || 0)) needs.set(key, { support, kind, count });
    }
  }
  return [...needs.values()];
};
export const puppetSetReadFeatures = (reads: PuppetRead[]): string[] =>
  _.uniq(
    reads.flatMap((read) => [
      ...Object.keys(read.fixtureStates || {}),
      ...(read.states || []).flatMap((state) => _.compact([state.support, state.placement?.anchor])),
      ...puppetReadObjects(read).flatMap((object) =>
        _.compact([puppetObjectNeedsSpot(object) || (object.type === P.WALL_TYPE && !puppetObjectIsGeometry(object)) ? puppetObjectCatalogKey(object) : undefined, object.placement?.anchor, !puppetObjectParent(object, puppetReadObjects(read)) && (object.mount === P.MOUNT_TABLE || object.mount === P.MOUNT_HANG) ? object.support || object.mount : undefined]),
      ),
    ]),
  );
export const puppetSetMissingRequirements = (set: PuppetSet, reads: PuppetRead[], scenery: string[] = []): string[] => {
  const missing: string[] = (set.spots || []).filter((spot) => !puppetSpotGeometryValid(spot)).map((spot) => M.INVALID_CONTACT(spot.key));
  const evidence = puppetSetFeatureEvidence(set);
  for (const read of reads) {
    const objects = puppetReadObjects(read);
    missing.push(...puppetNestedPropIssues(objects));
    const propSlots = new Set<string>();
    for (const state of read.states || [])
      if (state.placement?.anchor && !puppetSpots(set).some((spot) => (spot.kind === (P.POSE_KIND[puppetStatePose(state)] || P.SPOT_STAND) || (spot.kind === P.SPOT_DOOR && (P.POSE_KIND[puppetStatePose(state)] || P.SPOT_STAND) === P.SPOT_STAND)) && puppetSpatialAnchorMatches(spot, state.placement!.anchor!, puppetSpots(set)))) missing.push(C.ANCHOR_MISSING(state.char, state.placement.anchor));
    if (!puppetSetSupportsReads(set, [read])) missing.push(stringifyJson(read.states || []));
    if (
      read.blocking &&
      !choosePuppetBlocking(
        read.blocking,
        (read.states || []).map((state) => ({ char: state.char, pose: puppetStatePose(state), support: state.support, face: P.FACE_DEFAULT, expr: P.EXPR_DEFAULT })),
        set,
      )
    )
      missing.push(stringifyJson(read.blocking));
    for (const object of objects) {
      const geometry = puppetObjectIsGeometry(object);
      const catalogKey = puppetObjectCatalogKey(object);
      if ((puppetObjectNeedsSpot(object) || (object.type === P.WALL_TYPE && !geometry)) && !puppetFeatureSpot(set.spots || [], catalogKey)) missing.push(object.key);
      if (geometry && !puppetSceneFeatureFits(catalogKey, evidence)) missing.push(object.key);
      if (!geometry && !puppetObjectParent(object, objects) && ([P.MOUNT_TABLE, P.MOUNT_HANG].some((mount) => mount === object.mount) || object.placement)) {
        const spot = puppetPropSpotCandidates(puppetSpots(set), object).find((spot) => !propSlots.has(spot.key));
        if (spot) propSlots.add(spot.key);
        else missing.push(PACK.PROP_SUPPORT(object.key, object.support || object.mount));
      }
    }
  }
  for (const key of scenery) if (!puppetSceneFeatureFits(key, evidence)) missing.push(key);
  return _.uniq(missing);
};
interface Item {
  x: number;
  y: number;
  w: number;
  fixed: boolean;
  actor?: number;
  group?: number;
}
const separate = (items: Item[]): void => {
  const gap = P.LAYOUT_GAP * W;
  for (let round = 0; round < P.LAYOUT_ROUNDS; round++) {
    let moved = false;
    const order = _.sortBy(items, (it) => it.x);
    for (let i = 0; i < order.length; i++)
      for (let j = i + 1; j < order.length; j++) {
        const a = order[i],
          b = order[j];
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
  const allProps = [...(f.prop ? [{ prop: f.prop, propSupport: f.propSupport, propAt: f.propAt, propMount: f.propMount, propRot: f.propRot }] : []), ...(f.items || []).filter((item) => item.prop !== f.prop)];
  const nested = allProps.filter((item) => allProps.some((parent) => parent.prop === item.propSupport && parent.prop !== item.prop));
  if (nested.length) {
    const roots = allProps.filter((item) => !nested.includes(item));
    if (!roots.length) throw new Error(PACK.PROP_SUPPORT(f.prop || P.EMPTY, f.propSupport || P.EMPTY));
    const first = roots[0];
    const rootFrame = layoutPuppetFrame({ ...f, prop: first.prop, propSupport: first.propSupport, propMount: first.propMount, propAt: first.propAt, propRot: first.propRot, items: roots.slice(1) }, { ...ctx, prop: ctx.props?.[first.prop] });
    const placed = new Map<string, NonNullable<PuppetFrame["items"]>[number]>([[first.prop, { ...first, propAt: rootFrame.propAt, propX: rootFrame.propX, propY: rootFrame.propY, propH: rootFrame.propH }], ...(rootFrame.items || []).map((item) => [item.prop, item] as const)]);
    let pending = [...nested];
    while (pending.length) {
      const before = pending.length;
      for (const item of [...pending]) {
        const parent = placed.get(item.propSupport!);
        if (!parent) continue;
        const parentAsset = ctx.props?.[parent.prop],
          asset = ctx.props?.[item.prop];
        const surface = parentAsset && puppetPropSurface(parentAsset);
        const siblings = allProps.filter((other) => other.propSupport === item.propSupport);
        if (!surface || !asset || !parentAsset || !parent.propH || parent.propX == null || parent.propY == null || item.propMount !== P.MOUNT_TABLE) throw new Error(PACK.PROP_SUPPORT(item.prop, item.propSupport!));
        const [sx, sy, sw, sh] = surface.bounds;
        const size = asset.size || asset.height,
          parentSize = parentAsset.size || parentAsset.height;
        const height = (parent.propH * size) / parentSize;
        const width = height * P.PROP_W;
        const available = (parent.propH * sw) / P.PROP_BOX;
        if (size > parentSize * surface.maxRatio || width * siblings.length > available) throw new Error(PACK.PROP_SUPPORT(item.prop, item.propSupport!));
        const base = parentAsset.base || [P.PROP_BOX / 2, P.PROP_BOX];
        const x = parent.propX * W + ((sx + (sw * (siblings.indexOf(item) + 0.5)) / siblings.length - base[0]) * parent.propH) / P.PROP_BOX;
        const y = parent.propY + ((sy + sh / 2 - base[1]) * parent.propH) / P.PROP_BOX;
        placed.set(item.prop, { ...item, propAt: undefined, propParent: parent.prop, propDepthY: (parent.propDepthY || parent.propY) + 0.01, propX: x / W, propY: y, propH: height });
        pending = pending.filter((other) => other !== item);
      }
      if (pending.length === before) throw new Error(PACK.PROP_SUPPORT(pending[0].prop, pending[0].propSupport!));
    }
    const main = f.prop ? placed.get(f.prop) : undefined;
    return smokeOf(
      { ...rootFrame, overlays: f.overlays, effectSource: f.effectSource, prop: f.prop, propSupport: f.propSupport, propMount: f.propMount, propRot: f.propRot, propAt: main?.propAt, propX: main?.propX, propY: main?.propY, propH: main?.propH, propDepthY: main?.propDepthY, propParent: main?.propParent, items: [...placed.values()].filter((item) => item.prop !== f.prop) },
      ctx,
      puppetSpots(ctx.set),
    );
  }
  const fy = ctx.set?.floorY || P.FLOOR_DEFAULT;
  const hz = puppetHorizon(ctx.set);
  const persp = (y: number): number => _.clamp(P.PERSP_MIN + (P.PERSP_SPAN * (y - hz)) / Math.max(1, fy - hz), P.PERSP_MIN, 1);
  const spots = puppetSpots(ctx.set);
  const blocking = f.blocking || !f.layoutLocked ? choosePuppetBlocking(f.blocking, f.actors, { spots, compositions: ctx.set?.compositions }) : null;
  if (f.blocking && !blocking) throw new Error(B.MATCH(f.blocking.kind));
  if (blocking) f = { ...f, blocking: blocking.blocking, contacts: blocking.composition.contacts?.map((contact) => ({ ...contact, actor: blocking.blocking.roles[contact.actor], target: blocking.blocking.roles[contact.target] })), actors: f.actors.map((actor) => (blocking.assignments.has(actor.char) ? { ...actor, spot: blocking.assignments.get(actor.char), depth: P.DEPTH_MID } : actor)) };
  const byKey = _.keyBy(spots, (s) => s.key);
  const personH = (char: string): number => P.PERSON_H * H * (ctx.heights[char] || 1);
  const personW = (char: string): number => personH(char) * ctx.body.head * ctx.body.headW * Math.max(1, ctx.body.bodyW) * P.PERSON_W;
  const used = new Set<string>();
  const reserved = new Set(blocking?.assignments.values());
  const resting = ctx.set?.libraryVersion === RELEASE.VERSION && puppetFormOf(f, f.actors) === P.FORM_ATTEND ? f.actors.find((actor) => actor.pose === P.SPOT_LIE) : undefined;
  const restingSupport = resting?.support || (resting?.spot ? byKey[resting.spot]?.fixture : undefined);
  const supported = puppetSupportAssignments(
    f.actors
      .filter((actor) => !blocking?.assignments.has(actor.char))
      .map((actor) => ({ char: actor.char, action: actor.pose, posture: _.includes(P.LOW_POSES, actor.pose) ? actor.pose : undefined, support: actor.support || (!actor.spot && wantKind(actor) === P.SPOT_STAND && spots.some((spot) => spot.kind === P.SPOT_STAND && spot.relation === RT_SHARED.BESIDE && !!restingSupport && featureScore(spot, restingSupport) > 0) ? restingSupport : undefined) })),
    spots.filter((spot) => !reserved.has(spot.key)),
    new Map(f.actors.filter((actor) => actor.spot).map((actor) => [actor.char, actor.spot!])),
  );
  const front = new Set(_.map(P.SPOT_FRONT, (s) => s[0]));
  const pick = (kind: string, order: number): PuppetSpot | null => {
    const free = _.filter(spots, (s) => s.kind === kind && !used.has(s.key) && !reserved.has(s.key) && puppetSpotGeometryValid(s));
    if (!free.length) return null;
    const target = (W * (order + 1)) / (f.actors.length + 1);
    return _.sortBy(free, (s) => (front.has(s.key) ? 0 : P.FRONT_WEIGHT * W) + Math.abs(s.x - target))[0];
  };
  const pinned = new Set<number>();
  const actors = _.map(f.actors, (a, i) => {
    if (a.depth === P.DEPTH_FORE) return { ...a };
    if (a.support && P.SEATED_SUPPORT_RE.test(a.support) && _.includes(P.SEATED_ACTIONS, a.pose)) a = { ...a, pose: P.SPOT_SIT };
    const groupSpot = blocking?.assignments.get(a.char);
    const ownKey = groupSpot || (a.support ? supported?.get(a.char) : a.spot || supported?.get(a.char));
    const own = ownKey && (groupSpot || !reserved.has(ownKey)) ? byKey[ownKey] : null;
    const kind = wantKind(a);
    let s = own && puppetSpotGeometryValid(own) && (own.kind === kind || (kind === P.SPOT_STAND && own.kind === P.SPOT_DOOR)) && !used.has(own.key) ? own : null;
    if (a.support && !s) throw new Error(P.SUPPORT_MISSING(a.char, a.support, a.pose));
    if (!s) s = pick(kind, i) || (kind === P.SPOT_STAND ? pick(P.SPOT_DOOR, i) : null);
    if (!s && kind !== P.SPOT_STAND) throw new Error(P.SUPPORT_MISSING(a.char, a.support || kind, a.pose));
    if (s) used.add(s.key);
    const y = s ? (wantKind(a) === P.SPOT_STAND ? (s.groundY ?? s.y) : s.y) : fy - P.SPOT_INSET;
    const x = s ? s.x : (W * (i + 1)) / (f.actors.length + 1);
    const wear = _.filter(a.wear || [], (w) => ctx.props?.[w]?.attachment === P.MOUNT_BODY || P.WEARABLE_RE.test(_.replace(w, /_/g, P.SPACE)));
    if (s && (f.layoutLocked || blocking?.assignments.get(a.char) === s.key || (own && s === own && !front.has(own.key) && !_.includes(P.FREE_SPOTS, own.key)))) pinned.add(i);
    return { ...a, spot: s?.key || a.spot, x, y, k: +(s?.scale ?? persp(s?.groundY ?? y)).toFixed(3), wear: wear.length ? wear : undefined };
  });
  const items: Item[] = _.compact(_.map(actors, (a, i) => (a.depth === P.DEPTH_FORE ? null : { x: a.x!, y: a.y!, w: (a.pose === P.SPOT_LIE ? personH(a.char) * P.LIE_LEN : personW(a.char)) * (a.k || 1), fixed: pinned.has(i), actor: i })));
  const out: T = { ...f };
  if (f.contacts?.length && !(PACK.CONTACT_SHOTS as readonly string[]).includes(f.shot)) out.shot = P.SHOT_DEFAULT;
  const held = _.some(f.actors, (a) => !!a.hold && a.hold === f.prop);
  const poses: Record<number, string> = {};
  const faces: Record<number, string> = {};
  const arrange = (prop: Item | null): void => {
    const all = _.filter(items, (it) => it.actor != null);
    const extras = _.filter(all, (it) => P.EXTRA_RE.test(actors[it.actor!].char));
    const people = extras.length === all.length ? all : _.difference(all, extras);
    const main = _.filter(people, (it) => !pinned.has(it.actor!));
    if (!main.length) return;
    const form = puppetFormOf(
      f,
      _.map(people, (it) => actors[it.actor!]),
    );
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
    const mount = f.propMount || ctx.prop.mount || P.MOUNT_FLOOR;
    const requiredKind = mount === P.MOUNT_TABLE ? P.SPOT_SURFACE : mount === P.MOUNT_HANG ? P.SPOT_HANG : P.SPOT_OPEN;
    const specified = f.propAt && byKey[f.propAt]?.kind === requiredKind ? byKey[f.propAt] : null;
    const genericFloor = requiredKind === P.SPOT_OPEN && !!f.propSupport && I.FLOOR_SUPPORT.test(f.propSupport);
    const at = f.propSupport ? (specified && (genericFloor || puppetFeatureSpot([specified], f.propSupport, requiredKind)) ? specified : puppetFeatureSpot(spots, f.propSupport, requiredKind)) : specified;
    if (f.propSupport && !at) throw new Error(PACK.PROP_SUPPORT(f.prop, f.propSupport));
    if (mount === P.MOUNT_TABLE && !at && !spots.some((spot) => spot.kind === P.SPOT_SURFACE)) throw new Error(PACK.PROP_SUPPORT(f.prop, mount));
    const main = _.find(items, (it) => it.actor != null);
    let x: number,
      y: number,
      h: number,
      fixed = true,
      floor = true;
    if (f.shot === P.SHOT_OBJECT) {
      const s = at && (at.kind === P.SPOT_OPEN || at.kind === P.SPOT_SURFACE) ? at : _.find(spots, { kind: mount === P.MOUNT_TABLE ? P.SPOT_SURFACE : P.SPOT_OPEN }) || { key: P.SPOT_OPEN_KEY, kind: P.SPOT_OPEN, x: W / 2, y: fy - P.SPOT_OPEN_INSET, label: P.SPOT_OPEN_LABEL };
      out.propAt = s.key;
      h = _.clamp(real * persp(s.y), P.OBJECT_H * H * P.OBJECT_MIN, P.OBJECT_H * H);
      x = s.x;
      y = s.y;
      floor = s.kind !== P.SPOT_SURFACE;
    } else {
      const surface = at && at.kind === P.SPOT_SURFACE ? at : mount === P.MOUNT_TABLE && !at ? _.minBy(_.filter(spots, { kind: P.SPOT_SURFACE }), (s) => Math.abs(s.x - (main?.x ?? W / 2))) : null;
      const hang = at && at.kind === P.SPOT_HANG ? at : mount === P.MOUNT_HANG && !at ? _.find(spots, { kind: P.SPOT_HANG }) || null : null;
      if (surface) {
        out.propAt = surface.key;
        h = real * persp(surface.y);
        x = surface.x;
        y = surface.y;
        floor = false;
      } else if (hang) {
        out.propAt = hang.key;
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
  const form = puppetFormOf(f, actors);
  for (const a of actors) {
    const spot = a.spot ? byKey[a.spot] : null;
    if (spot?.scale != null || spot?.groundY != null) a.k = +(spot.scale ?? persp(spot.groundY!)).toFixed(3);
    if (a.pose === P.SPOT_LIE && spot?.face) a.face = spot.face;
    if (a.pose === P.SPOT_SIT && spot?.seatY != null) {
      a.k = +(spot.scale ?? persp(spot.groundY ?? spot.y)).toFixed(3);
      a.y = Math.round(spot.seatY + personH(a.char) * a.k * P.SIT_SEAT_OFFSET);
    }
    const target = actors.find((other) => other.char === a.target) || (!a.target && actors.length === 2 && _.includes([P.FORM_TALK, P.FORM_WHISPER], form) ? actors.find((other) => other.char !== a.char) : null);
    if (target && a.pose !== P.SPOT_LIE && a.depth !== P.DEPTH_FORE) a.face = target.x! > a.x! ? P.FACE_RIGHT : P.FACE_LEFT;
  }
  out.actors = actors;
  const occupied = new Set(_.compact([out.propAt]));
  out.items = f.items
    ?.filter((it) => it.prop !== f.prop)
    .map((it) => {
      const prop = ctx.props?.[it.prop];
      if (!prop) return it;
      const mount = it.propMount || prop.mount;
      const kind = mount === P.MOUNT_TABLE ? P.SPOT_SURFACE : mount === P.MOUNT_HANG ? P.SPOT_HANG : P.SPOT_OPEN;
      const candidates = spots.filter((spot) => !occupied.has(spot.key));
      const specified = it.propAt && candidates.find((spot) => spot.key === it.propAt && spot.kind === kind && (!it.propSupport || (kind === P.SPOT_OPEN && I.FLOOR_SUPPORT.test(it.propSupport)) || !!puppetFeatureSpot([spot], it.propSupport, kind)));
      const at = specified ? specified.key : it.propSupport ? puppetFeatureSpot(candidates, it.propSupport, kind)?.key : candidates.find((s) => s.kind === kind)?.key;
      if (it.propSupport && !at) throw new Error(PACK.PROP_SUPPORT(it.prop, it.propSupport));
      if (at) occupied.add(at);
      const placed = layoutPuppetFrame<Placed>({ shot: P.SHOT_DEFAULT, actors: [], prop: it.prop, propMount: mount, propSupport: it.propSupport, propAt: at }, { ...ctx, prop });
      return { prop: it.prop, propAt: at, propSupport: it.propSupport, propMount: mount, propRot: it.propRot, propX: placed.propX, propY: placed.propY, propH: placed.propH };
    });
  return smokeOf(out, ctx, spots);
};
export const puppetEffectSource = <T extends Placed>(f: T, spots: PuppetSpot[]): T => {
  if (!f.overlays?.some((o) => EFFECTS.KINDS.includes(o))) return f;
  const visible = new Set([f.prop, ...(f.items || []).map((it) => it.prop), ...f.actors.flatMap((a) => [a.char, a.hold, ...(a.wear || [])])].filter(Boolean));
  let effectSource = f.effectSource && visible.has(f.effectSource) ? f.effectSource : undefined;
  if (!effectSource) {
    const sources = [...visible].filter((key): key is string => !!key && !f.actors.some((a) => a.char === key));
    const eligible = sources.filter((key) => (f.overlays?.includes(EFFECTS.SMOKE) && EFFECTS.SMOKE_RE.test(key)) || (f.overlays?.includes(EFFECTS.STEAM) && EFFECTS.STEAM_RE.test(key)));
    if (eligible.length === 1) effectSource = eligible[0];
  }
  if (effectSource) return { ...f, effectSource, smokeX: undefined, smokeY: undefined };
  const spotsWithSource = spots.filter((p) => p.kind === P.SPOT_SMOKE);
  const at = !f.overlays.includes(EFFECTS.ODOR) && spotsWithSource.length === 1 ? spotsWithSource[0] : undefined;
  if (at) return { ...f, effectSource: undefined, smokeX: at.x, smokeY: at.y };
  return { ...f, effectSource: undefined, smokeX: undefined, smokeY: undefined, overlays: f.overlays.filter((o) => !EFFECTS.KINDS.includes(o)) };
};
const smokeOf = <T extends Placed>(f: T, _ctx: PuppetLayoutCtx, spots: PuppetSpot[]): T => puppetEffectSource(f, spots);
