import { RUNTIME_TEXT as RT_SHARED } from "../../../constants/runtime/shared.js";
import { MOTION_PACK as K } from "../../../constants/motionPack.js";
import type { PuppetBase, PuppetPiece, PuppetPlace, PuppetSet } from "../../../types/motionPuppet.js";
import { MOTION_VISUAL_CONTRACT as V } from "../../../constants/motionVisualContract.js";
import { motionLocationFamily, motionAssetLocationFamily, motionPlaceLocationFamily } from "../../../lib/motionResourceSemantics.js";
const words = (text: string): string => text.toLowerCase().split(K.WORDS).join(RT_SHARED.SYMBOL_36A9E7);
const requestedLocation = motionPlaceLocationFamily;
export const puppetPackLocationFits = (place: PuppetPlace, evidence: string): boolean => {
  const primary = words([place.visualBase || place.key, place.name].join(RT_SHARED.SYMBOL_36A9E7));
  const description = place.desc.split(V.FIXTURES)[0];
  const family = K.LOCATION_FAMILIES.find((family) => family.request.test(primary)) || K.LOCATION_FAMILIES.find((family) => family.request.test(words(description)));
  const requestedFamily = requestedLocation(place);
  const candidateFamily = motionLocationFamily(evidence);
  return requestedFamily ? requestedFamily === candidateFamily : !!family && family.evidence.test(words(evidence));
};
export const puppetPackAssemblyBaseFits = (place: PuppetPlace, base: PuppetBase): boolean => {
  if (base.recipeOnly) return false;
  if (base.interior !== place.interior) return false;
  const requested = requestedLocation(place);
  const shell = base.locationFamily || motionLocationFamily(base.key);
  return !requested || !shell || shell === requested || !!base.adaptableLocationFamilies?.includes(requested) || (base.interior && shell === RT_SHARED.LIVING);
};
export const puppetPackAssemblyLocationFits = (place: PuppetPlace, base: PuppetBase, pieces: PuppetPiece[]): boolean => {
  if (!puppetPackAssemblyBaseFits(place, base)) return false;
  return [base, ...pieces].some((part) => puppetPackLocationFits(place, part.locationFamily || ([part.key, RT_SHARED.NAME in part ? part.name : "", part.desc] as string[]).join(RT_SHARED.SYMBOL_36A9E7)));
};
export const puppetPackSetLocationFits = (place: PuppetPlace, set: PuppetSet): boolean => {
  const family = motionAssetLocationFamily(set);
  return puppetPackLocationFits(place, family || [set.name, set.desc, ...set.tags].join(RT_SHARED.SYMBOL_36A9E7));
};
