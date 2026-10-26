import { isPuppetString, puppetSupportTokens } from "./motionPuppetValues.js";
import { PA } from "../constants/motionPuppetAssets.js";
import { PUPPET as P } from "../constants/motionPuppet.js";
import { MOTION_PACK as PACK } from "../constants/motionPack.js";
import { MOTION_ILLUSTRATION as I } from "../constants/motionIllustration.js";
import type { PuppetObject, PuppetProp, PuppetSet } from "../types/motionPuppet.js";
import SCHEMA from "../constants/motionResourceSchema.json";
import { motionSemanticText } from "./motionResourceSemantics.js";
import { MOTION_STAGE_CONSTRAINTS as STAGE } from "../constants/motionStageConstraints.js";
export const puppetEnglish = (value: unknown): value is string => isPuppetString(value) && !!value.trim() && !PA.NON_ENGLISH.test(value);
export const puppetAssetKey = (key: string): string => PA.ALIASES[key] || PACK.ALIASES[key] || key;
export const puppetAssetName = (key: string): string => key.replace(PA.UNDERSCORE, PA.SPACE).trim();
export const puppetObjectCatalogKey = (object: Pick<PuppetObject, "key" | "catalogKey">): string => puppetAssetKey(object.catalogKey || object.key);
export const puppetObjectNounKeys = (word: string): string[] | undefined => SCHEMA.nounGroups.find((group) => group.aliases.some((alias) => motionSemanticText(alias) === motionSemanticText(word)))?.keys;
export const puppetObjectNounFits = (object: Pick<PuppetObject, "key" | "catalogKey" | "word">): boolean => {
  const keys = puppetObjectNounKeys(object.word || P.EMPTY);
  return !keys || keys.map(puppetAssetKey).includes(puppetObjectCatalogKey(object));
};
export const puppetObjectIsGeometry = (ob: Pick<PuppetObject, "key" | "type" | "category">): boolean => ob.type === PA.SCENERY || (ob.category === PA.SCENE_FEATURE && (ob.type === P.WALL_TYPE || PA.GEOMETRY.test(ob.key)));
export const puppetObjectNeedsSpot = (ob: Pick<PuppetObject, "key" | "type" | "category">): boolean => !puppetObjectIsGeometry(ob) && P.ANCHORED_FEATURE_TYPES.some((type) => type === ob.type);
export const puppetSetFeatureEvidence = (set: Pick<PuppetSet, "name" | "desc" | "tags" | "svg"> & Partial<Pick<PuppetSet, "spots" | "locationFamily" | "features">>): string =>
  [...(set.features === undefined ? [set.name, set.desc, ...set.tags] : set.features), ...(STAGE.AREAS[set.locationFamily || P.EMPTY] || []), ...(set.spots || []).flatMap((spot) => [spot.key, spot.fixture || P.EMPTY]), ...Array.from(set.svg.matchAll(PA.SVG_FEATURES), (match) => match[1])].join(PA.SPACE);
const featureWords = (value: string): string[] =>
  puppetSupportTokens(value)
    .map((token) => PA.FEATURE_PLURALS[token] || token)
    .filter((token) => !!token && !PA.FEATURE_RELATIONS.some((word) => word === token));
export const puppetSceneFeatureFits = (key: string, evidence: string): boolean => {
  const tokens = featureWords(key);
  const have = featureWords(evidence);
  return !!tokens.length && tokens.every((token) => have.includes(token));
};
export const puppetObjectClass = (ob: Pick<PuppetObject, "key" | "type" | "category">): string => {
  if (PA.SOUND.test(ob.key) || PA.ABSTRACT.test(ob.key) || PA.BODY_PART.test(ob.key)) return PA.EXCLUDED;
  if (PA.TERRAIN.test(ob.key) || PA.FURNITURE.test(ob.key) || ob.category === PA.SCENE_FEATURE || ob.type === PA.SCENERY || P.FEATURE_OBJECT_TYPES.some((type) => type === ob.type)) return PA.SCENERY;
  if (ob.category && ob.category !== PA.PROP) return PA.EXCLUDED;
  return PA.PROP;
};
export const puppetPropAllowed = (prop: PuppetProp): boolean => prop.catalogStatus !== PA.QUARANTINE && puppetObjectClass({ key: prop.key, type: prop.objectType || P.OBJECT_TYPE_DEFAULT, category: prop.category }) === PA.PROP;
export const puppetPropReferenceFits = (key: string, prop: PuppetProp, object?: PuppetObject): boolean => (object ? puppetPropFits(object, prop) : puppetPropAllowed(prop) && puppetAssetKey(key) === puppetAssetKey(prop.key));
export const puppetObjectRequirements = (object: Pick<PuppetObject, "word" | "requirements">): string[] => [...new Set([...(object.requirements || []), ...PA.OBJECT_TRAITS.filter(([, pattern]) => pattern.test((object.word || P.EMPTY).normalize("NFC"))).map(([trait]) => trait)])];
export const puppetPropRestRotation = (object: PuppetObject, prop: PuppetProp): number | undefined => {
  const state = object.physicalState || object.state;
  if (!state || object.mount !== P.MOUNT_FLOOR || puppetAssetKey(prop.key) !== puppetObjectCatalogKey(object)) return undefined;
  const rotation = I.REST_ROTATIONS[state];
  const evidence = [prop.desc, ...(prop.requirements || [])].join(PA.SPACE).toLowerCase();
  return rotation !== undefined && !evidence.includes(puppetAssetName(state)) ? rotation : undefined;
};
export const puppetPropFits = (ob: PuppetObject, prop: PuppetProp): boolean => {
  if (puppetObjectClass(ob) !== PA.PROP || !puppetPropAllowed(prop) || !puppetObjectNounFits(ob)) return false;
  if (prop.objectType && prop.objectType !== ob.type && ob.type !== P.OBJECT_TYPE_DEFAULT && prop.objectType !== P.OBJECT_TYPE_DEFAULT) return false;
  const haveKey = puppetAssetKey(prop.key),
    wantKey = puppetAssetKey(ob.catalogKey || ob.key);
  const rest = puppetPropRestRotation(ob, prop);
  const stateKey = ob.physicalState && rest === undefined ? wantKey + I.SEPARATOR + ob.physicalState : wantKey;
  const evidence = [puppetAssetName(haveKey), prop.desc, ...(prop.requirements || []).map(puppetAssetName)].join(PA.SPACE).toLowerCase();
  for (const rule of PA.STATE_RULES) {
    if (rule.evidence) {
      if (rule.tokens.test(stateKey) !== rule.tokens.test(haveKey) && !(rule.tokens.test(stateKey) && rule.evidence.test(evidence))) return false;
    } else {
      const want = Array.from(stateKey.matchAll(rule.tokens), (m) => m[2]);
      if (want.some((token) => !evidence.split(PA.TOKENS).includes(token))) return false;
    }
  }
  if (puppetObjectRequirements(ob).some((trait) => !(I.TEMPERATURE_STATES as readonly string[]).includes(trait) && !(rest !== undefined && trait === (ob.physicalState || ob.state)) && !evidence.includes(puppetAssetName(trait).toLowerCase()))) return false;
  return I.PROP_KEYS(wantKey, ob.physicalState).some((key) => puppetAssetKey(key) === haveKey);
};
export const preferredPuppetProps = (list: PuppetProp[]): PuppetProp[] => [...list].sort((a, b) => Number(b.tags.includes(PA.SEED)) - Number(a.tags.includes(PA.SEED)) || Number(b.catalogVersion === PA.VERSION) - Number(a.catalogVersion === PA.VERSION) || b.updatedAt.localeCompare(a.updatedAt) || a.id.localeCompare(b.id));
