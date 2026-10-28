import { RUNTIME_TEXT as RT_SHARED } from "../constants/runtime/shared.js";
import { RUNTIME_TEXT as RT_CORE } from "../constants/runtime/core.js";
import { MOTION_RESOURCE_SEMANTICS as S } from "../constants/motionResourceSemantics.js";
import { MOTION_VISUAL_CONTRACT as V } from "../constants/motionVisualContract.js";
import type { MotionLocationFamily } from "../types/motionPuppet.js";
import SCHEMA from "../constants/motionResourceSchema.json";
import { MOTION_PLACEMENT as M } from "../constants/motionPlacement.js";
import type { PuppetAsset, PuppetPiece, PuppetPlace, PuppetSpot } from "../types/motionPuppet.js";
export const motionExtractedPieceKey = (piece: Pick<PuppetPiece, "name"> & { tags?: string[] }): string => piece.tags?.find((tag) => SCHEMA.extractablePieces.includes(tag)) || piece.name.replace(/ /g, RT_SHARED.SYMBOL_D2E2AD);
export const motionExtractedPieceKind = (piece: Pick<PuppetPiece, "name"> & { tags?: string[] }): string => Object.entries(SCHEMA.extractedPieceKinds).find(([, keys]) => keys.includes(motionExtractedPieceKey(piece)))?.[0] || RT_CORE.SCENERY;
export const motionExtractedSpotFits = (piece: Pick<PuppetPiece, "name"> & { tags?: string[] }, fixture: string): boolean => {
  const key = motionExtractedPieceKey(piece),
    aliases = [key, ...((SCHEMA.extractedFixtureAliases as Record<string, string[]>)[key] || [])],
    tokens = motionSemanticText(fixture).split(S.SPACE);
  return aliases.some((alias) => alias.split(RT_SHARED.SYMBOL_D2E2AD).every((token) => tokens.includes(token)));
};
export const motionPieceEnvironments = (piece: Pick<PuppetPiece, "key" | "environment" | "allowedEnvironments" | "recipeOnly">): string[] => {
  if (piece.allowedEnvironments !== undefined) return piece.allowedEnvironments.filter((value) => SCHEMA.environments.includes(value));
  if (SCHEMA.portablePieces.includes(piece.key)) return [...SCHEMA.environments];
  return piece.environment ? [piece.environment] : [...SCHEMA.environments];
};
export const motionPieceEnvironmentFits = (piece: Pick<PuppetPiece, "key" | "environment" | "allowedEnvironments" | "recipeOnly">, family: string): boolean => !piece.recipeOnly && motionPieceEnvironments(piece).includes(family);
export const motionSemanticText = (value: string): string => value.toLowerCase().normalize(RT_CORE.NFD).replace(S.MARKS, S.EMPTY).replace(S.D, RT_CORE.D).replace(S.SEPARATORS, S.SPACE).trim();
export const motionLocationFamily = (value: string): MotionLocationFamily | undefined => {
  if (S.TEMPLE_VI.test(value.normalize(RT_SHARED.NFC))) return RT_CORE.TEMPLE;
  const text = motionSemanticText(value);
  return S.PLACES.find(([, family]) => family === text)?.[1] || S.PLACES.find(([pattern]) => pattern.test(text))?.[1];
};
export const motionPlaceLocationFamily = (place: Pick<PuppetPlace, "key" | "name" | "desc" | "interior" | "visualBase" | "locationFamily">): MotionLocationFamily | undefined => {
  if (place.locationFamily) return place.locationFamily;
  for (const primary of [place.visualBase, place.name, place.key]) {
    if (!primary || S.GENERIC_HOUSE.test(motionSemanticText(primary))) continue;
    const family = motionLocationFamily(primary);
    if (family) return family;
  }
  const description = motionSemanticText(place.desc.split(V.FIXTURES)[0]);
  const excluded = place.interior ? SCHEMA.exteriorLocationFamilies : SCHEMA.interiorLocationFamilies;
  const matches = S.PLACES.flatMap(([pattern, family]) => {
    const match = pattern.exec(description);
    return match && !excluded.includes(family) ? [{ family, index: match.index }] : [];
  }).sort((a, b) => a.index - b.index);
  return matches[0]?.family || ([place.name, place.key, description].some((value) => S.HOUSE.test(motionSemanticText(value))) ? (place.interior ? RT_SHARED.LIVING : RT_CORE.COURTYARD) : undefined);
};
export const motionPieceContactSpots = (piece: Pick<PuppetPiece, "key" | "spots">): PuppetSpot[] => {
  const fixtures = (SCHEMA.pieceContactFixtures as Record<string, Record<string, string>>)[piece.key];
  if (!fixtures) return piece.spots;
  return piece.spots.map((spot) => {
    const tokens = motionSemanticText(spot.fixture || spot.key).split(S.SPACE);
    const fixture = Object.entries(fixtures).find(([key]) => key.split(RT_SHARED.SYMBOL_D2E2AD).every((token) => tokens.includes(token)))?.[1];
    return fixture ? { ...spot, fixture } : spot;
  });
};
export const motionPieceContextFits = (piece: Pick<PuppetPiece, "key" | "desc" | "kind">, place: Pick<PuppetPlace, "key" | "name" | "desc" | "sceneCondition">): boolean => {
  const evidence = motionSemanticText([piece.key, piece.desc].join(S.SPACE));
  const requested = motionSemanticText([place.key, place.name, place.desc, place.sceneCondition].filter(Boolean).join(S.SPACE));
  return M.CONDITION_PATTERNS.every((pattern) => !pattern.test(evidence) || pattern.test(requested)) && (piece.kind !== RT_SHARED.BUILDING || M.BUILDING_CONTEXTS.every((context) => !context.asset.test(evidence) || context.request.test(requested)));
};
export const motionAssetLocationFamily = (asset: { locationFamily?: MotionLocationFamily; name?: string; group?: string; desc?: string; tags?: string[] }): MotionLocationFamily | undefined =>
  (asset.locationFamily && S.PLACES.some(([, family]) => family === asset.locationFamily) ? asset.locationFamily : undefined) || motionLocationFamily(asset.name || S.EMPTY) || motionLocationFamily(asset.group || S.EMPTY) || motionLocationFamily((asset.desc || S.EMPTY).split(V.FIXTURES)[0]) || motionLocationFamily((asset.tags || []).join(S.SPACE));
export const normalizeMotionResourceSemantics = <T extends PuppetAsset>(value: T): T => {
  const asset = structuredClone(value);
  if (!(SCHEMA.assetTypes as string[]).includes(asset.type)) return asset;
  if (asset.type === RT_CORE.STYLE_PACK || asset.type === RT_CORE.SERIES) return asset;
  asset.semanticVersion = SCHEMA.version;
  if (asset.type === RT_SHARED.PROP) {
    const surface = SCHEMA.propSurfaces[asset.key as keyof typeof SCHEMA.propSurfaces];
    if (surface) asset.surface = structuredClone(surface) as typeof asset.surface;
  }
  if (asset.type === RT_CORE.SET_PIECE) {
    if (Array.isArray(asset.spots)) asset.spots = motionPieceContactSpots(asset);
    if (asset.allowedEnvironments === undefined) asset.allowedEnvironments = motionPieceEnvironments(asset) as typeof asset.allowedEnvironments;
    if (asset.tags?.includes(RT_SHARED.EXTRACTED_COMPONENT)) {
      asset.kind = motionExtractedPieceKind(asset);
      asset.spots = (asset.spots || []).filter((spot) => motionExtractedSpotFits(asset, spot.fixture || S.EMPTY));
    }
  }
  if (asset.type === RT_CORE.SET || asset.type === RT_CORE.SET_BASE) {
    const family = motionAssetLocationFamily({ ...asset, group: asset.type === RT_CORE.SET_BASE ? asset.family : asset.group });
    if (family) asset.locationFamily = family;
  }
  return asset;
};
export const motionCharacterTraits = (value: { gender?: string; age?: string; name?: string; role?: string; look?: string; description?: string }) => {
  const text = motionSemanticText([value.role, value.look, value.description, value.name].filter(Boolean).join(S.SPACE));
  const gender = value.gender || (S.FEMALE.test(text) ? RT_SHARED.FEMALE : S.MALE.test(text) ? RT_SHARED.MALE : undefined);
  const age = value.age || (S.CHILD.test(text) ? RT_SHARED.CHILD : S.SENIOR.test(text) ? RT_SHARED.SENIOR : S.ADULT.test(text) ? RT_CORE.ADULT : undefined);
  const role = S.ROLES.find((entry) => entry.request.test(text));
  return { gender, age, role };
};
