import { MOTION_RESOURCE_RECIPE as R } from "../constants/motionResourceRecipe.js";
import SCHEMA from "../constants/motionResourceSchema.json";
import { MOTION_RESOURCE_FAILURE as F } from "../constants/motionResourceFailure.js";
import { PUPPET_TYPES as T } from "../constants/motionPuppet.js";
import { MotionResourceError } from "./motionResourceFailure.js";
import type { PuppetAsset, PuppetBase, PuppetPiece, PuppetSet } from "../types/motionPuppet.js";
export const resolveMotionResourceRecipe = <A extends PuppetAsset>(asset: A, read: (type: string, id: string) => PuppetAsset | null): A => {
  if (asset.type !== T.SET || !asset.recipe) return asset;
  const fail = (): never => {
    throw new MotionResourceError({ kind: T.SET, reason: F.REASONS.METADATA, name: asset.name, details: [asset.id, R.INVALID] });
  };
  const recipe = asset.recipe;
  if (recipe.version !== SCHEMA.recipeVersion || !Array.isArray(recipe.pieces) || !recipe.pieces.length || recipe.pieces.some((piece) => !piece || typeof piece.assetId !== "string" || typeof piece.token !== "string") || new Set(recipe.pieces.map((piece) => piece.token)).size !== recipe.pieces.length) fail();
  const base = read(T.BASE, recipe.baseId) as PuppetBase | null;
  if (!base?.recipeTemplate || base.styleId !== asset.styleId) fail();
  let svg = base!.recipeTemplate!;
  for (const instance of recipe.pieces) {
    const piece = read(T.PIECE, instance.assetId) as PuppetPiece | null;
    const local = piece?.recipeSvg || piece?.svg;
    const inner = typeof local === "string" ? local.match(R.INNER)?.[1] : undefined;
    const marker = R.MARKER(instance.token);
    if (!R.TOKEN.test(instance.token) || !piece || piece.styleId !== asset.styleId || !inner || svg.split(marker).length !== 2) fail();
    svg = svg.replace(marker, () => inner!.replace(R.DEFS, ""));
  }
  return { ...asset, svg } as A;
};
export const motionRecipeSources = (set: PuppetSet): string[] => (set.recipe ? [set.recipe.baseId, ...set.recipe.pieces.map((piece) => piece.assetId)] : set.plan?.baseId ? [set.plan.baseId, ...set.plan.pieces.map((piece) => piece.assetId).filter((id): id is string => !!id)] : []);
