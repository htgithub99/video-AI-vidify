import { RUNTIME_TEXT as RT_SHARED } from "../../../../../constants/runtime/shared.js";
import { PUPPET as P, PUPPET_TYPES as T } from "../../../../../constants/motionPuppet.js";
import { MOTION_BLOCKING as B } from "../../../../../constants/motionBlocking.js";
import { MOTION_PACK_SELECTION as K } from "../../../../../constants/motionPackSelection.js";
import { puppetSpotGeometryValid } from "../../../../../lib/motionPlacement.js";
import type { PuppetAsset, PuppetCharacter, PuppetProp, PuppetSet } from "../../../../../types/motionPuppet.js";
import SCHEMA from "../../../../../constants/motionResourceSchema.json";
const svgValid = (svg: unknown): boolean => typeof svg === "string" && P.VIEWBOX_RE.test(svg) && P.SVG_START_RE.test(svg) && P.SVG_END_RE.test(svg) && !P.SVG_FORBIDDEN_RE.test(svg) && !!svg.match(P.SHAPE_RE)?.length;
const positive = (...values: number[]): boolean => values.every((value) => Number.isFinite(value) && value > 0);
export const puppetPackAssetIssues = (asset: PuppetAsset): string[] => {
  if (asset.type === T.STYLE) return positive(asset.body?.head, asset.body?.headW, asset.body?.bodyW) ? [] : [K.INVALID_ASSET];
  if (asset.type === T.SERIES) return [];
  const issues: string[] = [];
  if (asset.type === T.CHARACTER) {
    const character = asset as PuppetCharacter;
    if (!positive(character.height)) issues.push(K.INVALID_ASSET);
    for (const svg of [...Object.values(character.head || {}), ...Object.values(character.body || {})]) if (!svgValid(svg)) issues.push(K.INVALID_SVG);
    for (const sprite of Object.values(character.sprites || {})) if (!svgValid(sprite.svg) || !positive(sprite.w, sprite.h) || sprite.anchor?.length !== 2 || !sprite.anchor.every(Number.isFinite) || (sprite.rig && !Object.values(sprite.rig).every(Number.isFinite))) issues.push(K.INVALID_ASSET);
    return [...new Set(issues)];
  }
  if (!(RT_SHARED.SVG in asset) || !svgValid(asset.svg)) issues.push(K.INVALID_SVG);
  if (asset.type === T.PIECE && asset.recipeSvg && !svgValid(asset.recipeSvg)) issues.push(K.INVALID_SVG);
  if (asset.type === T.PIECE && asset.states) {
    if (!asset.stateKey || !Object.keys(asset.states).length) issues.push(K.INVALID_ASSET);
    for (const state of Object.values(asset.states)) if (!state || !svgValid(state.svg) || (state.night && !svgValid(state.night))) issues.push(K.INVALID_SVG);
  }
  if (asset.type === T.PROP) {
    const prop = asset as PuppetProp;
    if (!positive(prop.height, prop.size ?? prop.height) || prop.base?.length !== 2 || !prop.base.every(Number.isFinite)) issues.push(K.INVALID_ASSET);
    if (
      prop.surface &&
      (prop.surface.bounds?.length !== 4 || !prop.surface.bounds.every(Number.isFinite) || !positive(prop.surface.bounds[2], prop.surface.bounds[3], prop.surface.maxRatio) || prop.surface.bounds[0] < 0 || prop.surface.bounds[1] < 0 || prop.surface.bounds[0] + prop.surface.bounds[2] > P.PROP_BOX || prop.surface.bounds[1] + prop.surface.bounds[3] > P.PROP_BOX || prop.surface.maxRatio > 1)
    )
      issues.push(K.INVALID_ASSET);
  }
  if (asset.type === T.SET || asset.type === T.PIECE) {
    const spots = asset.spots || [];
    if (new Set(spots.map((spot) => spot.key)).size !== spots.length || spots.some((spot) => !spot.key || !(P.SPOT_KINDS as readonly string[]).includes(spot.kind) || !puppetSpotGeometryValid(spot) || spot.x < 0 || spot.x > P.SET_W || spot.y < 0 || spot.y > P.SET_H)) issues.push(K.INVALID_SPOTS);
    for (const composition of asset.compositions || []) {
      const roles = B.KINDS[composition.kind];
      if (!roles || roles.some((role) => !spots.some((spot) => spot.key === composition.roles?.[role])) || new Set(Object.values(composition.roles || {})).size !== roles.length) issues.push(K.INVALID_SPOTS);
    }
  }
  if ((asset.type === T.SET || asset.type === T.BASE) && !positive(asset.floorY)) issues.push(K.INVALID_ASSET);
  if (asset.type === T.BASE && asset.regions)
    for (const region of Object.values(asset.regions)) {
      const bounds = region?.bounds;
      if (!Array.isArray(bounds) || bounds.length !== 4 || !bounds.every(Number.isFinite) || bounds[0] < 0 || bounds[1] < 0 || !positive(bounds[2], bounds[3]) || bounds[0] + bounds[2] > P.SET_W || bounds[1] + bounds[3] > P.SET_H) issues.push(K.INVALID_ASSET);
    }
  if (asset.type === T.BASE && asset.adaptableLocationFamilies?.some((family) => !Object.hasOwn(SCHEMA.locationPatterns, family))) issues.push(K.INVALID_ASSET);
  if (asset.type === T.PIECE && asset.placementSurface !== undefined && asset.placementSurface !== RT_SHARED.WATER) issues.push(K.INVALID_ASSET);
  if (asset.type === T.PIECE && (asset.box?.length !== 4 || !asset.box.every(Number.isFinite) || !positive(asset.box[2], asset.box[3]) || asset.anchor?.length !== 2 || !asset.anchor.every(Number.isFinite))) issues.push(K.INVALID_ASSET);
  if (asset.type === T.PIECE && asset.allowedEnvironments !== undefined && (!Array.isArray(asset.allowedEnvironments) || !asset.allowedEnvironments.length || new Set(asset.allowedEnvironments).size !== asset.allowedEnvironments.length || asset.allowedEnvironments.some((value) => !SCHEMA.environments.includes(value)))) issues.push(K.INVALID_ASSET);
  if (
    asset.type === T.SET &&
    asset.recipe &&
    (asset.recipe.version !== SCHEMA.recipeVersion || typeof asset.recipe.baseId !== "string" || !Array.isArray(asset.recipe.pieces) || !asset.recipe.pieces.length || asset.recipe.pieces.some((piece) => !piece || typeof piece.assetId !== "string" || typeof piece.token !== "string") || new Set(asset.recipe.pieces.map((piece) => piece.token)).size !== asset.recipe.pieces.length)
  )
    issues.push(K.INVALID_ASSET);
  return [...new Set(issues)];
};
export const puppetPackStageProfile = (set: PuppetSet) => ({
  place: set.group || set.tags[0],
  interior: set.interior,
  time: set.time,
  condition: set.sceneCondition,
  fixtureStates: set.fixtureStates,
  spots: (set.spots || []).map((spot) => [spot.key, spot.kind, spot.fixture || null, spot.relation || null]),
  layouts: (set.compositions || []).map((layout) => [layout.kind, layout.variant || null, layout.roles]),
});
