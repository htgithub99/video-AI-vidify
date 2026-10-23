import { isPuppetString } from "./motionPuppetValues.js";
import { PA } from "../constants/motionPuppetAssets.js";
import { PUPPET as P } from "../constants/motionPuppet.js";
import type { PuppetObject, PuppetProp } from "../types/motionPuppet.js";
export const puppetEnglish = (value: unknown): value is string => isPuppetString(value) && !!value.trim() && !PA.NON_ENGLISH.test(value);
export const puppetAssetKey = (key: string): string => PA.ALIASES[key] || key;
export const puppetAssetName = (key: string): string => key.replace(PA.UNDERSCORE, PA.SPACE).trim();
export const puppetSceneFeatureFits = (key: string, evidence: string): boolean => {
  const tokens = puppetAssetName(key)
    .toLowerCase()
    .split(PA.SPACE)
    .filter((t) => !PA.FEATURE_RELATIONS.some((word) => word === t));
  const have = evidence.toLowerCase().replace(PA.UNDERSCORE, PA.SPACE).split(PA.TOKENS);
  return !!tokens.length && tokens.every((token) => have.includes(token));
};
export const puppetObjectClass = (ob: Pick<PuppetObject, "key" | "type" | "category">): string => {
  if (PA.SOUND.test(ob.key) || PA.ABSTRACT.test(ob.key) || PA.BODY_PART.test(ob.key)) return PA.EXCLUDED;
  if (PA.TERRAIN.test(ob.key) || PA.FURNITURE.test(ob.key) || ob.category === PA.SCENE_FEATURE || ob.type === PA.SCENERY || P.FEATURE_OBJECT_TYPES.some((type) => type === ob.type)) return PA.SCENERY;
  if (ob.category && ob.category !== PA.PROP) return PA.EXCLUDED;
  return PA.PROP;
};
export const puppetPropAllowed = (prop: PuppetProp): boolean => prop.catalogStatus !== PA.QUARANTINE && puppetObjectClass({ key: prop.key, type: prop.objectType || P.OBJECT_TYPE_DEFAULT, category: prop.category }) === PA.PROP;
export const puppetPropReferenceFits = (key: string, prop: PuppetProp): boolean => puppetPropAllowed(prop) && puppetAssetKey(key) === puppetAssetKey(prop.key);
export const puppetPropFits = (ob: PuppetObject, prop: PuppetProp): boolean => {
  if (puppetObjectClass(ob) !== PA.PROP || !puppetPropAllowed(prop)) return false;
  if (prop.objectType && prop.objectType !== ob.type && ob.type !== P.OBJECT_TYPE_DEFAULT && prop.objectType !== P.OBJECT_TYPE_DEFAULT) return false;
  const haveKey = puppetAssetKey(prop.key),
    wantKey = puppetAssetKey(ob.key);
  const evidence = [puppetAssetName(haveKey), prop.desc, ...(prop.requirements || []).map(puppetAssetName)].join(PA.SPACE).toLowerCase();
  for (const rule of PA.STATE_RULES) {
    if (rule.evidence) {
      if (rule.tokens.test(wantKey) !== rule.tokens.test(haveKey) && !(rule.tokens.test(wantKey) && rule.evidence.test(evidence))) return false;
    } else {
      const want = Array.from(wantKey.matchAll(rule.tokens), (m) => m[2]);
      if (want.some((token) => !evidence.split(PA.TOKENS).includes(token))) return false;
    }
  }
  if ((ob.requirements || []).some((trait) => !evidence.includes(puppetAssetName(trait).toLowerCase()))) return false;
  return wantKey === haveKey;
};
export const preferredPuppetProps = (list: PuppetProp[]): PuppetProp[] => [...list].sort((a, b) => Number(b.tags.includes(PA.SEED)) - Number(a.tags.includes(PA.SEED)) || Number(b.catalogVersion === PA.VERSION) - Number(a.catalogVersion === PA.VERSION) || b.updatedAt.localeCompare(a.updatedAt) || a.id.localeCompare(b.id));
