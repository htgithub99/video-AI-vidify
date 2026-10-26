import { MOTION_PLACEMENT as M } from "../constants/motionPlacement.js";
import { PUPPET as P } from "../constants/motionPuppet.js";
import { puppetSupportTokens } from "./motionPuppetValues.js";
import type { PuppetSpot } from "../types/motionPuppet.js";
export const puppetSupportParts = (key: string) => {
  const tokens = puppetSupportTokens(key);
  const relation = Object.keys(M.RELATIONS).find((kind) => M.RELATIONS[kind].some((word) => tokens.includes(word)));
  return { relation, sides: tokens.filter((token) => M.SIDES.includes(token)), materials: tokens.filter((token) => M.MATERIALS.includes(token)), nouns: tokens.filter((token) => !(P.FEATURE_RELATIONS as readonly string[]).includes(token) && !Object.values(M.RELATIONS).flat().includes(token) && !M.MATERIALS.includes(token) && !M.MODIFIERS.includes(token) && !M.NUMBER.test(token)) };
};
export const puppetSupportCompatible = (requested: string, candidate: string, continuity = false): boolean => {
  const a = puppetSupportParts(requested),
    b = puppetSupportParts(candidate);
  if ((a.relation === P.FEATURE_UNDER_RELATIONS[0]) !== (b.relation === P.FEATURE_UNDER_RELATIONS[0])) return false;
  if (a.relation && a.relation !== b.relation) return false;
  if (continuity && a.relation !== b.relation) return false;
  if (a.sides.some((side) => !b.sides.includes(side))) return false;
  if (a.materials.length && b.materials.length && !a.materials.some((material) => b.materials.includes(material))) return false;
  return a.nouns.length > 0 && a.nouns.every((noun) => b.nouns.includes(noun));
};
export const puppetSupportKey = (key: string, relation?: string): string => (relation && M.RELATIONS[relation] && !puppetSupportParts(key).relation ? [relation, key].join(M.KEY_JOIN) : key);
export const puppetSpotGeometryValid = (spot: PuppetSpot): boolean => {
  if (spot.scale !== undefined && (!Number.isFinite(spot.scale) || spot.scale <= 0)) return false;
  if (![spot.x, spot.y, ...(spot.groundY == null ? [] : [spot.groundY]), ...(spot.seatY == null ? [] : [spot.seatY])].every(Number.isFinite)) return false;
  if (spot.kind === P.SPOT_SIT && spot.seatY != null && spot.groundY != null && spot.seatY >= spot.groundY) return false;
  if (!spot.bounds) return true;
  const [x, y, w, h] = spot.bounds;
  const contactY = spot.kind === P.SPOT_SIT ? (spot.seatY ?? spot.y) : spot.y;
  return spot.bounds.every(Number.isFinite) && w > 0 && h > 0 && spot.x >= x && spot.x <= x + w && contactY >= y && contactY <= y + h;
};
