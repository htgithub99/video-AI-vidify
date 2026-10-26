import { MOTION_PACK as K } from "../../../constants/motionPack.js";
import { PUPPET_TYPES as T } from "../../../constants/motionPuppet.js";
import { puppetSupportCompatible } from "../../../lib/motionPlacement.js";
import type { PuppetSet } from "../../../types/motionPuppet.js";
import { newPuppetId, readPuppet } from "./kitLibrary.js";
import { registerPuppetAssembly, puppetPackActive } from "./packPolicy.js";
import { resolvePuppetSetPlan } from "./setPlan.js";
import { MOTION_LIBRARY_RELEASE as RELEASE } from "../../../constants/motionLibraryRelease.js";
export const puppetSetWithFixtureStates = (base: PuppetSet, requested: Record<string, string> = {}): PuppetSet | null => {
  if (!puppetPackActive() || !Object.keys(requested).length) return base;
  if (JSON.stringify(Object.entries(base.fixtureStates || {}).sort()) === JSON.stringify(Object.entries(requested).sort())) return base;
  const project = (set: PuppetSet): PuppetSet | null => {
    let svg = set.svg;
    const fixtures = (set.fixtures || []).map((fixture) => ({ ...fixture }));
    for (const [key, state] of Object.entries(requested)) {
      const matches = fixtures.filter((fixture) => puppetSupportCompatible(fixture.key, key) || puppetSupportCompatible(key, fixture.key));
      if (matches.length !== 1 || !matches[0].states[state] || !svg.includes(matches[0].layer)) return null;
      const fixture = matches[0];
      svg = svg.replace(fixture.layer, fixture.states[state]);
      fixture.layer = fixture.states[state];
    }
    const projected = { ...set, id: newPuppetId(T.SET, K.POLICY + set.id + JSON.stringify(Object.entries(requested).sort())), tags: [...set.tags.filter((tag) => tag !== K.SEED), K.COMPOSED], svg, fixtures, fixtureStates: { ...requested }, variants: undefined };
    return set.plan?.version === RELEASE.PLAN_VERSION ? resolvePuppetSetPlan(projected, (type, id) => readPuppet(type as any, id)) : projected;
  };
  const main = project(base);
  if (!main) return null;
  const variants: Record<string, string> = {};
  for (const [time, id] of Object.entries(base.variants || {})) {
    const source = readPuppet<PuppetSet>(T.SET, id);
    const variant = source && project(source);
    if (!variant) return null;
    registerPuppetAssembly(variant, [source!.id]);
    variants[time] = variant.id;
  }
  return registerPuppetAssembly({ ...main, variants }, [base.id]);
};
