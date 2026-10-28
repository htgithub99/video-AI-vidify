import { RUNTIME_TEXT as RT_SERVER } from "../../../constants/runtime/server.js";
import { RUNTIME_TEXT as RT_SHARED } from "../../../constants/runtime/shared.js";
import { MOTION_LIBRARY_RELEASE as C } from "../../../constants/motionLibraryRelease.js";
import { PUPPET_TYPES as T } from "../../../constants/motionPuppet.js";
import type { PuppetAsset, PuppetBase, PuppetPiece } from "../../../types/motionPuppet.js";
import { MotionResourceError } from "../../../lib/motionResourceFailure.js";
import { motionPieceEnvironmentFits } from "../../../lib/motionResourceSemantics.js";
import { composePuppetSet, piecePlacement, puppetPieceSlots } from "./setComposition.js";
export const resolvePuppetSetPlan = <A extends PuppetAsset>(asset: A, read: (type: string, id: string) => PuppetAsset | null): A => {
  if (asset.type !== T.SET || asset.plan?.version === undefined) return asset;
  const fail = (): never => {
    throw new MotionResourceError({ kind: T.SET, reason: RT_SERVER.METADATA, name: asset.name, details: [asset.id, C.PLAN_INVALID] });
  };
  const plan = asset.plan;
  if (!plan || plan.version !== C.PLAN_VERSION || typeof plan.baseId !== "string" || !Array.isArray(plan.pieces) || plan.pieces.some((piece) => !piece || typeof piece.slot !== "string" || typeof piece.piece !== "string" || typeof piece.assetId !== "string") || new Set(plan.pieces.map((piece) => piece.slot)).size !== plan.pieces.length || typeof plan.mirror !== "boolean") fail();
  const base = read(T.BASE, plan.baseId!) as PuppetBase | null;
  if (!base || base.type !== T.BASE || base.styleId !== asset.styleId || base.recipeOnly || base.key !== plan.base || base.interior !== asset.interior || (asset.libraryVersion === C.VERSION && base.libraryVersion !== C.VERSION)) fail();
  const pieces = plan.pieces.map((entry) => {
    const piece = entry.assetId && (read(T.PIECE, entry.assetId) as PuppetPiece | null);
    if (
      !piece ||
      piece.type !== T.PIECE ||
      piece.styleId !== asset.styleId ||
      piece.key !== entry.piece ||
      !Array.isArray(piece.slots) ||
      !puppetPieceSlots(base!, piece).includes(entry.slot) ||
      !piecePlacement(base!, entry.slot, piece) ||
      !motionPieceEnvironmentFits(piece, base!.interior ? RT_SHARED.INTERIOR : RT_SERVER.EXTERIOR) ||
      (asset.libraryVersion === C.VERSION && piece.libraryVersion !== C.VERSION)
    )
      fail();
    return { slot: entry.slot, piece: piece as PuppetPiece };
  });
  const composed = composePuppetSet(base!, pieces, asset.time === RT_SERVER.NIGHT, plan.mirror, asset.fixtureStates);
  if (Object.entries(asset.fixtureStates || {}).some(([key, state]) => composed.fixtures.filter((fixture) => fixture.key === key && !!fixture.states[state]).length !== 1)) fail();
  return { ...asset, ...composed };
};
