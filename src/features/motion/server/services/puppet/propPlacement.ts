import { RUNTIME_TEXT as RT_SHARED } from "../../../../../constants/runtime/shared.js";
import { RUNTIME_TEXT as RT_SERVER } from "../../../../../constants/runtime/server.js";
import { MOTION_PACK_SELECTION as K } from "../../../../../constants/motionPackSelection.js";
import { puppetPropSpotCandidates } from "./layout.js";
import type { PuppetFrame, PuppetObject, PuppetRead, PuppetSpot } from "../../../../../types/motionPuppet.js";
import { puppetObjectParent, puppetNestedPropIssues } from "../../../../../lib/motionPropSupport.js";
import { puppetReadObjects } from "../../../../../lib/motionReadObjects.js";
import { MOTION_STAGE_GEOMETRY as G } from "../../../../../constants/motionStageGeometry.js";
export const puppetPropAssignments = (objects: PuppetObject[], spots: PuppetSpot[], previous: { prop: string; propAt?: string | null }[] = [], valid: (assigned: Map<string, string>) => boolean = () => true): Map<string, string>[] => {
  if (puppetNestedPropIssues(objects).length) return [];
  const needs = objects
    .filter((object) => !puppetObjectParent(object, objects) && !([RT_SHARED.HELD, RT_SERVER.SHOULDER, RT_SERVER.WEAR, RT_SHARED.BODY, RT_SERVER.AIR] as string[]).includes(object.mount))
    .map((object) => ({ object, candidates: puppetPropSpotCandidates(spots, object).sort((a, b) => Number(b.key === previous.find((item) => item.prop === object.key)?.propAt) - Number(a.key === previous.find((item) => item.prop === object.key)?.propAt)) }))
    .sort((a, b) => a.candidates.length - b.candidates.length);
  const results: Map<string, string>[] = [];
  const used = new Set<string>();
  const assigned = new Map<string, string>();
  let searched = 0;
  const visit = (index: number): void => {
    if (++searched > K.SEARCH_BUDGET || results.length >= K.LAYOUT_LIMIT) return;
    if (index === needs.length) {
      results.push(new Map(assigned));
      return;
    }
    const { object, candidates } = needs[index];
    for (const spot of candidates) {
      if (used.has(spot.key)) continue;
      if (
        [...assigned.values()].some((key) => {
          const other = spots.find((value) => value.key === key)!;
          return Math.hypot(other.x - spot.x, other.y - spot.y) < G.PROP_GAP;
        })
      )
        continue;
      used.add(spot.key);
      assigned.set(object.key, spot.key);
      if (valid(assigned)) visit(index + 1);
      assigned.delete(object.key);
      used.delete(spot.key);
      if (results.length >= K.LAYOUT_LIMIT) break;
    }
  };
  visit(0);
  return results;
};
export const puppetPropAssignmentsValid = (read: PuppetRead, frame: PuppetFrame, spots: PuppetSpot[]): boolean => {
  const objects = puppetReadObjects(read);
  if (puppetNestedPropIssues(objects).length) return false;
  for (const object of objects) {
    if (object && puppetObjectParent(object, objects)) {
      const item = frame.prop === object.key ? frame : frame.items?.find((item) => item.prop === object.key);
      if (item?.propParent !== object.support || !item.propH || !Number.isFinite(item.propX) || !Number.isFinite(item.propY)) return false;
      continue;
    }
    if (!object?.placement || ([RT_SHARED.HELD, RT_SERVER.SHOULDER, RT_SERVER.WEAR, RT_SHARED.BODY] as string[]).includes(object.mount)) continue;
    const at = frame.prop === object.key ? frame.propAt : frame.items?.find((item) => item.prop === object.key)?.propAt;
    const spot = spots.find((spot) => spot.key === at);
    if (!spot || !puppetPropSpotCandidates(spots, object).some((candidate) => candidate.key === spot.key)) return false;
  }
  return true;
};
