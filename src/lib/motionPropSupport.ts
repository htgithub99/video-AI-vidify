import SCHEMA from "../constants/motionResourceSchema.json";
import { MOTION_PACK as K } from "../constants/motionPack.js";
import { PUPPET as P } from "../constants/motionPuppet.js";
import { puppetObjectCatalogKey } from "./motionPuppetAssets.js";
import type { PuppetObject, PuppetProp } from "../types/motionPuppet.js";
import { MOTION_ILLUSTRATION_POLICY as I } from "../constants/motionIllustrationPolicy.js";
import { illustrationSemanticText } from "./motionIllustrationPolicy.js";
import { puppetSupportCompatible } from "./motionPlacement.js";
export const normalizePuppetObjectSupport = <T extends Pick<PuppetObject, "mount" | "support" | "placement">>(object: T): T => {
  if (object.mount !== P.MOUNT_FLOOR || !object.support || I.FLOOR_SUPPORT.test(object.support) || !object.placement || !puppetSupportCompatible(object.support, object.placement.anchor) || !puppetSupportCompatible(object.placement.anchor, object.support)) return object;
  return { ...object, support: undefined };
};
export const puppetPropSurface = (prop: Partial<Pick<PuppetProp, "key" | "surface">>) => prop.surface || (SCHEMA.propSurfaces as unknown as Record<string, NonNullable<PuppetProp["surface"]>>)[prop.key || P.EMPTY];
export const puppetObjectParent = (object: PuppetObject, objects: PuppetObject[]): PuppetObject | undefined => objects.find((parent) => parent !== object && parent.key === object.support);
export const puppetObjectParentEvidence = (object: PuppetObject, parent: PuppetObject, source: string): boolean =>
  source.split(I.CLAUSE).some((clause) => {
    const text = illustrationSemanticText(clause),
      childWord = illustrationSemanticText(object.word),
      parentWord = illustrationSemanticText(parent.word);
    if (!childWord || !parentWord) return false;
    const childAt = text.indexOf(childWord),
      parentAt = text.indexOf(parentWord);
    if (childAt < 0 || parentAt < 0 || I.NON_ACTUAL.test(text.slice(0, Math.min(childAt, parentAt))) || I.RELATION_NEGATED.test(text.slice(0, Math.max(childAt, parentAt)))) return false;
    return childAt < parentAt ? I.PROP_ON_PARENT.test(text.slice(childAt + childWord.length, parentAt)) : I.PROP_CONTAINS_CHILD.test(text.slice(parentAt + parentWord.length, childAt));
  });
export const puppetNestedPropIssues = (objects: PuppetObject[]): string[] => {
  const errors: string[] = [];
  for (const object of objects) {
    const visited = new Set([object.key]);
    let child = object,
      parent = puppetObjectParent(child, objects);
    while (parent) {
      const surface = puppetPropSurface({ key: puppetObjectCatalogKey(parent) });
      if (visited.has(parent.key) || child.mount !== P.MOUNT_TABLE || ![P.MOUNT_TABLE, P.MOUNT_FLOOR].some((mount) => mount === parent.mount) || !surface) {
        errors.push(K.PROP_SUPPORT(object.key, parent.key));
        break;
      }
      visited.add(parent.key);
      child = parent;
      parent = puppetObjectParent(child, objects);
    }
  }
  return errors;
};
export const puppetNestedPropAssetIssues = (objects: PuppetObject[], assets: Record<string, Pick<PuppetProp, "key" | "height" | "size"> & Partial<Pick<PuppetProp, "surface">>>): string[] => {
  const errors = puppetNestedPropIssues(objects);
  for (const object of objects) {
    const parent = puppetObjectParent(object, objects);
    if (!parent) continue;
    const asset = assets[object.key],
      parentAsset = assets[parent.key];
    const surface = parentAsset && puppetPropSurface(parentAsset);
    const size = asset?.size || asset?.height,
      parentSize = parentAsset?.size || parentAsset?.height;
    const siblings = objects.filter((child) => child.support === parent.key).length;
    if (!surface || !size || !parentSize || size > parentSize * surface.maxRatio || size * P.PROP_W * siblings > (parentSize * surface.bounds[2]) / P.PROP_BOX) errors.push(K.PROP_SUPPORT(object.key, parent.key));
  }
  return [...new Set(errors)];
};
