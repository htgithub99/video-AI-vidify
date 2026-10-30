import { MOTION_BLOCKING as B } from "../../../../../constants/motionBlocking.js";
import { MOTION_ILLUSTRATION as I } from "../../../../../constants/motionIllustration.js";
import { PUPPET as P } from "../../../../../constants/motionPuppet.js";
import { puppetSpotGeometryValid, puppetSupportCompatible, puppetSupportKey } from "../../../../../lib/motionPlacement.js";
import type { PuppetBlocking, PuppetComposition, PuppetFrameActor, PuppetSpot } from "../../../../../types/motionPuppet.js";
type Stage = { spots?: PuppetSpot[]; compositions?: PuppetComposition[] };
export const cleanPuppetBlocking = (raw: unknown, cast: string[]): PuppetBlocking | undefined => {
  if (!raw || typeof raw !== "object") return undefined;
  const value = raw as PuppetBlocking;
  const required = B.KINDS[value.kind];
  if (!Array.isArray(required) || !value.roles || typeof value.roles !== "object" || Array.isArray(value.roles)) return undefined;
  const roles = Object.fromEntries(Object.entries(value.roles).filter(([role, char]) => required.includes(role) && typeof char === "string" && cast.includes(char)));
  if (!required.every((role) => roles[role]) || new Set(Object.values(roles)).size !== required.length) return undefined;
  const variant = value.variant && B.VARIANTS[value.kind]?.includes(value.variant) ? value.variant : undefined;
  if (B.VARIANTS[value.kind]?.length && !variant) return undefined;
  return { kind: value.kind, roles, ...(variant ? { variant } : {}) };
};
export const cleanPuppetCompositions = (raw: unknown, spots: PuppetSpot[]): PuppetComposition[] => {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((value) => {
    const blocking = cleanPuppetBlocking(
      value,
      spots.map((spot) => spot.key),
    );
    if (!blocking || typeof value.key !== "string" || !value.key) return [];
    const contacts = Array.isArray(value.contacts)
      ? value.contacts.filter((contact: any) => Object.keys(blocking.roles).includes(contact.actor) && Object.keys(blocking.roles).includes(contact.target) && contact.actor !== contact.target && (B.CONTACT_POINTS as readonly string[]).includes(contact.point) && (B.CONTACT_POINTS as readonly string[]).includes(contact.targetPoint) && (B.CONTACT_MODES as readonly string[]).includes(contact.mode))
      : [];
    if (Array.isArray(value.contacts) && contacts.length !== value.contacts.length) return [];
    return [{ ...blocking, key: value.key, ...(contacts.length ? { contacts } : {}) }];
  });
};
const fits = (actor: PuppetFrameActor, spot: PuppetSpot): boolean => {
  const kind = P.POSE_KIND[actor.pose] || P.SPOT_STAND;
  return puppetSpotGeometryValid(spot) && (spot.kind === kind || (kind === P.SPOT_STAND && spot.kind === P.SPOT_DOOR)) && (!actor.support || puppetSupportCompatible(actor.support, puppetSupportKey([spot.fixture, spot.key].filter(Boolean).join(B.KEY_JOIN), spot.relation)));
};
export const choosePuppetBlocking = (blocking: PuppetBlocking | undefined, actors: PuppetFrameActor[], stage: Stage): { blocking: PuppetBlocking; composition: PuppetComposition; assignments: Map<string, string> } | null => {
  const spots = new Map((stage.spots || []).map((spot) => [spot.key, spot]));
  const people = new Map(actors.filter((actor) => actor.depth !== P.DEPTH_FORE).map((actor) => [actor.char, actor]));
  const candidates: { blocking: PuppetBlocking; composition: PuppetComposition; assignments: Map<string, string>; score: number }[] = [];
  for (const composition of stage.compositions || []) {
    if (blocking ? composition.kind !== blocking.kind : !(B.AUTO_KINDS as readonly string[]).includes(composition.kind)) continue;
    if (blocking?.variant && composition.variant !== blocking.variant) continue;
    const roles = B.KINDS[composition.kind];
    if (!Array.isArray(roles) || !composition.roles || roles.some((role) => !spots.has(composition.roles[role])) || new Set(roles.map((role) => composition.roles[role])).size !== roles.length) continue;
    if (!blocking && roles.length !== people.size) continue;
    const assignments = new Map<string, string>();
    const bindings: Record<string, string> = {};
    const ordered = [...roles].sort((a, b) => Number(spots.get(composition.roles[b])!.kind === P.SPOT_LIE) - Number(spots.get(composition.roles[a])!.kind === P.SPOT_LIE));
    const bind = (index: number): boolean => {
      if (index === ordered.length) return true;
      const role = ordered[index],
        spot = spots.get(composition.roles[role])!;
      const pool = [...people.values()].filter((actor) => !assignments.has(actor.char) && (!blocking || blocking.roles[role] === actor.char) && fits(actor, spot)).sort((a, b) => Number(b.spot === spot.key) - Number(a.spot === spot.key) || a.char.localeCompare(b.char));
      for (const actor of pool) {
        assignments.set(actor.char, spot.key);
        bindings[role] = actor.char;
        if (bind(index + 1)) return true;
        assignments.delete(actor.char);
        delete bindings[role];
      }
      return false;
    };
    if (!bind(0)) continue;
    const score = [...assignments].reduce((sum, [char, spot]) => sum + Number(people.get(char)!.spot === spot) * 10 + Number(!!people.get(char)!.support), 0);
    candidates.push({ blocking: { kind: composition.kind, roles: { ...bindings }, ...(composition.variant ? { variant: composition.variant } : {}) }, composition, assignments: new Map(assignments), score });
  }
  const selected = candidates.sort((a, b) => b.score - a.score || a.composition.key.localeCompare(b.composition.key))[0];
  if (selected) return selected;
  if (!blocking || !(I.SIMPLE_KINDS as readonly string[]).includes(blocking.kind)) return null;
  const roles = B.KINDS[blocking.kind];
  const assigned = new Map<string, string>();
  const bindSimple = (index: number): boolean => {
    if (index === roles.length) return true;
    const actor = people.get(blocking.roles[roles[index]]);
    if (!actor) return false;
    const used = [...assigned.values()].map((key) => spots.get(key)!);
    const available = [...spots.values()].filter((spot) => !assigned.has(actor.char) && ![...assigned.values()].includes(spot.key) && fits(actor, spot) && used.every((other) => Math.abs(spot.y - other.y) <= I.MAX_DEPTH && Math.abs(spot.x - other.x) >= I.MIN_SEPARATION && Math.abs(spot.x - other.x) <= I.MAX_SEPARATION));
    available.sort((a, b) => Number(b.key === actor.spot) - Number(a.key === actor.spot) || a.key.localeCompare(b.key));
    for (const spot of available) {
      assigned.set(actor.char, spot.key);
      if (bindSimple(index + 1)) return true;
      assigned.delete(actor.char);
    }
    return false;
  };
  if (!bindSimple(0)) return null;
  const composition: PuppetComposition = { key: I.PREFIX + blocking.kind + I.SEPARATOR + [...assigned.values()].join(I.SEPARATOR), kind: blocking.kind, roles: Object.fromEntries(roles.map((role) => [role, assigned.get(blocking.roles[role])!])) };
  return { blocking, composition, assignments: assigned };
};
