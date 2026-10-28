import { RUNTIME_TEXT as RT_SERVER } from "../../../constants/runtime/server.js";
import { stringifyJson } from "../../../lib/jsonStringify.js";
import { createHash } from "node:crypto";
import { MOTION_VISUAL_CONTRACT as V } from "../../../constants/motionVisualContract.js";
import { PUPPET as P } from "../../../constants/motionPuppet.js";
import { puppetKeyOf } from "../../../lib/motionPuppetValues.js";
import { puppetObjectClass } from "../../../lib/motionPuppetAssets.js";
import { canonicalPuppetReadObjects, puppetReadObjects } from "../../../lib/motionReadObjects.js";
import { PA } from "../../../constants/motionPuppetAssets.js";
import { normalizePuppetObjectSupport } from "../../../lib/motionPropSupport.js";
import type { PuppetLine } from "../../../lib/motionPuppet.js";
import type { PuppetObject, PuppetPlace, PuppetRead, PuppetVisualContract } from "../../../types/motionPuppet.js";
import { puppetHoldingEvidence, puppetObjectReleaseEvidence } from "./illustrationFacts.js";
import type { MotionCastMember } from "../../../types/motionVideo.js";
export const assessPuppetVisualContract = (raw: unknown, plannedScene?: string): { visual?: PuppetVisualContract; issues: { path: string; reason: string }[] } => {
  const value = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as PuppetVisualContract) : ({} as Partial<PuppetVisualContract>);
  const sceneValue = plannedScene === undefined ? value.scene : plannedScene;
  const scene = typeof sceneValue === "string" ? puppetKeyOf(sceneValue) : null,
    timeline = typeof value.timeline === "string" ? puppetKeyOf(value.timeline) : null;
  const evidence = Array.isArray(value.evidence) ? value.evidence.filter((item) => typeof item === "string" && item.trim()).map((item) => item.trim()) : [];
  const issues = [...(!scene ? [{ path: RT_SERVER.VISUAL_SCENE, reason: V.READ_VISUAL_SCENE_INVALID }] : []), ...(!timeline ? [{ path: RT_SERVER.VISUAL_TIMELINE, reason: V.READ_VISUAL_TIMELINE_INVALID }] : []), ...(!evidence.length ? [{ path: RT_SERVER.VISUAL_EVIDENCE, reason: V.READ_VISUAL_EVIDENCE_INVALID }] : [])];
  if (issues.length) return { issues };
  const fixtures = Array.isArray(value.fixtures)
    ? value.fixtures.flatMap((item) => {
        const key = puppetKeyOf(item?.key),
          state = puppetKeyOf(item?.state);
        return key && state ? [{ key, state }] : [];
      })
    : [];
  return { visual: { scene: scene!, timeline: timeline!, evidence, fixtures }, issues };
};
export const cleanPuppetVisualContract = (raw: unknown, plannedScene?: string): PuppetVisualContract | undefined => assessPuppetVisualContract(raw, plannedScene).visual;
export const puppetStoryContext = (lines: PuppetLine[]): string => {
  const seen = new Set<string>();
  return (
    V.CONTEXT +
    stringifyJson(
      lines.flatMap((line) =>
        (line.sourcePlans || [{ beatId: line.beatId, place: line.place, time: line.time, action: line.action, scenePlan: line.scenePlan }]).flatMap((source) => {
          if (seen.has(source.beatId)) return [];
          seen.add(source.beatId);
          return [{ beat: source.beatId, chapter: line.chapterId, place: source.place, time: source.time, cast: line.cast, event: source.action || line.text, before: source.scenePlan?.before, after: source.scenePlan?.after }];
        }),
      ),
    )
  );
};
export const puppetLineContext = (line: PuppetLine): string =>
  stringifyJson({ chapter: line.chapterId, cast: line.cast, speakers: line.speakers, task: line.visualUnit ? { scene: line.visualUnit.scene, purpose: line.visualUnit.purpose, show: line.visualUnit.show } : undefined, sources: line.sourcePlans?.length ? line.sourcePlans : [{ beatId: line.beatId, place: line.place, time: line.time, action: line.action, scenePlan: line.scenePlan }] });
export const normalizePuppetVisualState = (lines: PuppetLine[], reads: Record<string, PuppetRead>, places: Record<string, PuppetPlace>, catalogKeys?: ReadonlySet<string>, cast: MotionCastMember[] = []): Record<string, PuppetRead> => {
  const output = { ...reads };
  const fixtures = new Map<string, Record<string, string>>();
  const props = new Map<string, string>();
  const bindings = new Map<string, { owner?: string; mount: string }>();
  const carried = new Map<string, PuppetObject>();
  const locations = new Map<string, string>();
  const identities = new Map<string, string>();
  for (const line of lines) {
    const read = reads[line.key] && canonicalPuppetReadObjects(reads[line.key]),
      visual = read?.visual;
    if (!read || !visual) continue;
    const catalogOf = (object: PuppetObject): string => (object.catalogKey && (!catalogKeys || catalogKeys.has(object.catalogKey) || !catalogKeys.has(object.key)) ? object.catalogKey : object.key);
    const place = places[read.place || line.place || P.EMPTY];
    if (!place) continue;
    const base = places[place.visualBase || place.key] || place;
    const scope = [visual.timeline, base.key].join(V.KEY_SEPARATOR);
    const state = { ...(fixtures.get(scope) || {}) };
    for (const update of visual.fixtures) state[update.key] = update.state;
    fixtures.set(scope, state);
    const aliases = new Map<string, string>();
    const assigned = new Set<string>();
    const currentIdentities = new Map<string, string>();
    for (const object of puppetReadObjects(read)) {
      const original = object.identity || object.key;
      if (currentIdentities.has(original)) continue;
      const key = [visual.timeline, original].join(V.KEY_SEPARATOR);
      let identity = identities.get(key) || original;
      if (!identities.has(key) && !carried.has(key) && !object.transition && puppetObjectClass(object) === PA.PROP) {
        const catalog = catalogOf(object);
        const prior = [...carried].find(([priorKey, item]) => locations.get(priorKey) === scope && !assigned.has(item.identity || item.key) && (item.catalogKey || item.key) === catalog && item.mount === object.mount && item.owner === object.owner && !V.REMOVED_STATES.some((value) => value === (item.physicalState || item.state)));
        if (prior) identity = prior[1].identity || prior[1].key;
      }
      identities.set(key, identity);
      currentIdentities.set(original, identity);
      assigned.add(identity);
    }
    const apply = (object: PuppetObject): PuppetObject => {
      object = normalizePuppetObjectSupport(object);
      const original = object.identity || object.key;
      const identity = currentIdentities.get(original) || identities.get([visual.timeline, original].join(V.KEY_SEPARATOR)) || original;
      const key = [visual.timeline, identity].join(V.KEY_SEPARATOR);
      locations.set(key, scope);
      const baseMount = object.baseMount || object.mount,
        baseOwner = object.baseMount ? object.baseOwner : object.owner;
      const before = bindings.get(key);
      const sourceChanged = before && ((before.mount !== baseMount && puppetObjectReleaseEvidence(object, line)) || ((before.mount !== baseMount || before.owner !== baseOwner) && !!puppetHoldingEvidence(object, line, cast)));
      if (!before || object.transition || sourceChanged) bindings.set(key, { owner: baseOwner, mount: baseMount });
      const binding = bindings.get(key)!;
      const bound = { ...object, identity, catalogKey: catalogOf(object), baseMount, baseOwner, owner: binding.owner, mount: binding.mount };
      if (object.state) props.set(key, object.state);
      const physical = props.get(key);
      if (!physical) {
        const resolved = { ...bound, key: identity };
        aliases.set(identity, identity);
        aliases.set(original, identity);
        carried.set(key, resolved);
        return resolved;
      }
      const variant = identity + V.STATE_SEPARATOR + physical;
      aliases.set(identity, variant);
      aliases.set(original, variant);
      const baseDescription = object.baseDescription || object.description || identity;
      const baseRequirements = object.baseRequirements || object.requirements || [];
      const resolved = { ...bound, identity, physicalState: physical, key: variant, baseDescription, baseRequirements, description: V.PROP_STATE(baseDescription, physical), requirements: [...new Set([...baseRequirements, physical])] };
      carried.set(key, resolved);
      return resolved;
    };
    const visible = (item: PuppetObject) => !V.REMOVED_STATES.some((state) => state === (item.physicalState || item.state || P.EMPTY));
    const objects = puppetReadObjects(read).map(apply).filter(visible);
    const main = read.object ? objects.find((item) => (item.identity || item.key) === (read.object!.identity || read.object!.key)) || apply(read.object) : read.object;
    const object = main && visible(main) ? main : null;
    const listed = new Set([object, ...objects].filter((item): item is PuppetObject => !!item).map((item) => item.identity || item.key));
    const occupied = new Set([object, ...objects].filter((item): item is PuppetObject => !!item && !!item.owner && [P.MOUNT_HELD_KEY, P.MOUNT_SHOULDER].some((mount) => mount === item.mount)).map((item) => item.owner));
    for (const [key, item] of carried) {
      const identity = item.identity || item.key;
      if (!key.startsWith(visual.timeline + V.KEY_SEPARATOR) || listed.has(identity) || !visible(item)) continue;
      const stationary = V.STATIONARY_MOUNTS.some((mount) => mount === item.mount) && locations.get(key) === scope && puppetObjectClass(item) === PA.PROP;
      const held = !!item.owner && read.who.includes(item.owner) && [P.MOUNT_HELD_KEY, P.MOUNT_SHOULDER, P.MOUNT_WEAR, P.MOUNT_BODY].some((mount) => mount === item.mount);
      if (held && item.mount !== P.MOUNT_WEAR && item.mount !== P.MOUNT_BODY && puppetObjectReleaseEvidence(item, line)) {
        carried.delete(key);
        bindings.delete(key);
        continue;
      }
      if (!stationary && !held) continue;
      if (held && item.mount !== P.MOUNT_WEAR && item.mount !== P.MOUNT_BODY && occupied.has(item.owner!)) {
        carried.delete(key);
        continue;
      }
      objects.push(apply({ ...item, state: undefined, transition: false }));
      listed.add(identity);
    }
    const instances = [...new Map([object, ...objects].filter((item): item is PuppetObject => !!item).map((item) => [item.identity || item.key, item])).values()];
    for (const item of instances) if (item.catalogKey && instances.filter((other) => other.catalogKey === item.catalogKey).length === 1) aliases.set(item.catalogKey, item.key);
    for (const item of instances) if (item.support && aliases.has(item.support)) item.support = aliases.get(item.support);
    const resolved = { ...read, object, objects, fixtureStates: state, effectSource: aliases.get(read.effectSource || P.EMPTY) || read.effectSource, effectTarget: aliases.get(read.effectTarget || P.EMPTY) || read.effectTarget };
    if (Object.keys(state).length) {
      const ordered = Object.fromEntries(Object.entries(state).sort(([a], [b]) => a.localeCompare(b)));
      const key = base.key + V.VARIANT_SEPARATOR + createHash(P.SHA).update(stringifyJson(ordered)).digest(P.HEX).slice(0, 12);
      places[key] = { ...base, key, visualBase: base.key, fixtureStates: ordered, desc: base.desc + P.NL + V.FIXTURES + stringifyJson(ordered) };
      resolved.place = key;
    } else resolved.place = base.key;
    output[line.key] = resolved;
  }
  return output;
};
