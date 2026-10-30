import { RUNTIME_TEXT as RT_SHARED } from "../../../../../constants/runtime/shared.js";
import { RUNTIME_TEXT as RT_SERVER } from "../../../../../constants/runtime/server.js";
import { MOTION_PACK_SELECTION as K } from "../../../../../constants/motionPackSelection.js";
import { puppetKeyOf, puppetSourceQuote } from "../../../../../lib/motionPuppetValues.js";
import type { PuppetLine } from "../../../../../lib/motionPuppet.js";
import type { PuppetActorState, PuppetRead, PuppetSpot, PuppetFrameActor, PuppetComposition } from "../../../../../types/motionPuppet.js";
import { puppetFeatureSpot, puppetStatePose } from "./layout.js";
import { PUPPET as P } from "../../../../../constants/motionPuppet.js";
import { puppetSpotGeometryValid } from "../../../../../lib/motionPlacement.js";
import { choosePuppetBlocking } from "./blocking.js";
export const puppetActorSpotCandidates = (actor: Pick<PuppetFrameActor, "pose" | "support" | "spot">, placement: PuppetActorState["placement"], spots: PuppetSpot[], fixed?: string): PuppetSpot[] => {
  const kind = P.POSE_KIND[actor.pose] || P.SPOT_STAND;
  const candidates = spots.filter((spot) => puppetSpotGeometryValid(spot) && (!fixed || spot.key === fixed) && (spot.kind === kind || (kind === P.SPOT_STAND && spot.kind === P.SPOT_DOOR)) && (!actor.support || !!puppetFeatureSpot([spot], actor.support, spot.kind)) && (!placement?.anchor || puppetSpatialAnchorMatches(spot, placement.anchor, spots)));
  const on = actor.support && candidates.filter((spot) => spot.relation === RT_SHARED.ON);
  return on && on.length ? on : candidates;
};
export const puppetActorAssignments = (read: PuppetRead, spots: PuppetSpot[], compositions?: PuppetComposition[]): Map<string, string> | null => {
  const actors = (read.states || []).map((state) => ({ char: state.char, pose: puppetStatePose(state), support: state.support, expr: P.EXPR_DEFAULT, face: P.FACE_DEFAULT }));
  const group = read.blocking ? choosePuppetBlocking(read.blocking, actors, { spots, compositions }) : null;
  if (read.blocking && !group) return null;
  const needs = actors.map((actor) => ({ actor, candidates: puppetActorSpotCandidates(actor, read.states?.find((state) => state.char === actor.char)?.placement, spots, group?.assignments.get(actor.char)) })).sort((a, b) => a.candidates.length - b.candidates.length);
  const assignments = new Map<string, string>(),
    used = new Set<string>();
  let visits = 0;
  const visit = (index: number): boolean => {
    if (++visits > K.SEARCH_BUDGET) return false;
    if (index === needs.length) return puppetSpatialAssignmentsValid(read, assignments, spots);
    for (const spot of needs[index].candidates) {
      if (used.has(spot.key)) continue;
      assignments.set(needs[index].actor.char, spot.key);
      used.add(spot.key);
      if (visit(index + 1)) return true;
      assignments.delete(needs[index].actor.char);
      used.delete(spot.key);
    }
    return false;
  };
  return visit(0) ? assignments : null;
};
export const cleanPuppetSpatialPlacement = (raw: any, line: PuppetLine, cast: string[], char: string): PuppetActorState["placement"] => {
  if (!raw || !(K.SPATIAL_RELATIONS as readonly string[]).includes(raw.relation)) return;
  const evidence = typeof raw.evidence === "string" ? puppetSourceQuote(line.text, raw.evidence) : undefined;
  const anchor = puppetKeyOf(raw.anchor) || undefined;
  const targets: string[] = Array.isArray(raw.targets) ? [...new Set<string>(raw.targets.filter((target: unknown): target is string => typeof target === "string" && target !== char && cast.includes(target)))] : [];
  if (!evidence || (raw.relation === RT_SHARED.AT ? !anchor || targets.length > 0 : raw.relation === RT_SERVER.BETWEEN ? targets.length !== 2 || !!anchor : anchor ? targets.length > 0 : targets.length !== 1)) return;
  return { relation: raw.relation, anchor, targets, evidence };
};
export const puppetSpatialAnchorDistance = (actor: PuppetSpot, anchor: string, spots: PuppetSpot[]): number => {
  const matching = spots.filter((spot) => !!puppetFeatureSpot([spot], anchor, spot.kind));
  const preferred = K.ANCHOR_KINDS.map((kind) => matching.filter((spot) => spot.kind === kind)).find((points) => points.length) || matching;
  return Math.min(...preferred.map((spot) => Math.abs(actor.x - spot.x)));
};
export const puppetSpatialAnchorMatches = (actor: PuppetSpot, anchor: string, spots: PuppetSpot[]): boolean => !!puppetFeatureSpot([actor], anchor, actor.kind) || puppetSpatialAnchorDistance(actor, anchor, spots) <= K.ANCHOR_NEAR;
export const puppetSpatialAssignmentsValid = (read: PuppetRead, assignments: Map<string, string>, spots: PuppetSpot[]): boolean => {
  const point = (char: string) => spots.find((spot) => spot.key === assignments.get(char));
  for (const state of read.states || []) {
    const placement = state.placement;
    if (!placement) continue;
    const actor = point(state.char);
    if (!actor) return false;
    if (placement.relation === RT_SHARED.AT || (placement.anchor && !(placement.targets || []).length && placement.relation !== RT_SERVER.BETWEEN)) {
      if (!placement.anchor || !puppetSpatialAnchorMatches(actor, placement.anchor, spots)) return false;
      if (placement.relation === RT_SHARED.BEHIND && !spots.some((spot) => puppetFeatureSpot([spot], placement.anchor!, spot.kind) && (actor.groundY ?? actor.y) <= (spot.groundY ?? spot.y))) return false;
      continue;
    }
    const targets = (placement.targets || []).map(point);
    if (targets.length !== (placement.relation === RT_SERVER.BETWEEN ? 2 : 1) || targets.some((spot) => !spot)) return false;
    if (placement.relation === RT_SERVER.BETWEEN) {
      const [a, b] = targets as PuppetSpot[];
      if (actor.x <= Math.min(a.x, b.x) + K.SPATIAL_GAP || actor.x >= Math.max(a.x, b.x) - K.SPATIAL_GAP) return false;
    } else {
      const target = targets[0]!;
      if (Math.abs(actor.x - target.x) > K.SPATIAL_NEAR || Math.abs((actor.groundY ?? actor.y) - (target.groundY ?? target.y)) > K.SPATIAL_DEPTH) return false;
      if (placement.relation === RT_SHARED.BEHIND) {
        if ((actor.groundY ?? actor.y) > (target.groundY ?? target.y)) return false;
        const goal = read.states?.find((other) => other.char === placement.targets?.[0])?.placement;
        if (goal?.relation === RT_SHARED.AT && goal.anchor && puppetSpatialAnchorDistance(actor, goal.anchor, spots) < puppetSpatialAnchorDistance(target, goal.anchor, spots) + K.SPATIAL_GAP) return false;
      }
    }
  }
  return true;
};
