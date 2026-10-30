import { RUNTIME_VALUES } from "../constants/runtime/values.js";
import { MOTION_SCENE_COMPOSITION as C } from "../constants/motionSceneComposition.js";
import type { MotionRemotionNode, MotionRemotionScene, MotionSceneComposition, MotionVectorAsset } from "../types/motionVisual.js";
const R = C.IDENTITY_REF;
export const motionSvgGroup = (svg: string, id: string): string | undefined => {
  const open = R.OPEN(id).exec(svg);
  if (!open) return undefined;
  const pattern = new RegExp(R.GROUP_TAG.source, "g");
  pattern.lastIndex = open.index;
  let depth = 0;
  for (let match = pattern.exec(svg); match; match = pattern.exec(svg)) {
    if (match[2]) continue;
    depth += match[1] ? -1 : 1;
    if (!depth) return svg.slice(open.index, match.index + R.GROUP_CLOSE.length);
  }
  return undefined;
};
const simplify = (svg: string): string => svg.replace(R.DECIMAL, (value) => String(Math.round(Number(value)))).replace(R.STYLE_ATTRS, "").replace(R.NO_FILL, "");
const without = (svg: string, composition: MotionSceneComposition, kinds: readonly string[]): string =>
  composition.layers.filter((layer) => kinds.includes(layer.kind)).reduce((text, layer) => {
    const group = motionSvgGroup(text, layer.id);
    return group ? text.replace(group, "") : text;
  }, svg);
export const motionPlaceReference = (asset: MotionVectorAsset, composition: MotionSceneComposition): string | undefined => {
  const place = simplify(without(asset.svg, composition, R.PLACE_DROP));
  if (place.length <= R.PLACE_MAX) return place;
  const bare = simplify(without(asset.svg, composition, [...R.PLACE_DROP, ...R.PLACE_DROP_MORE]));
  return bare.length <= R.PLACE_MAX ? bare : undefined;
};
const usable = (node?: MotionRemotionNode): boolean => !!node && node.representation !== RUNTIME_VALUES.DETAIL_9C0211C5 && !R.BACK.test(`${node.pose || ""} ${node.description || ""}`);
export const motionIdentityReferences = (scene: MotionRemotionScene, scenes: MotionRemotionScene[], assets: Record<string, MotionVectorAsset>): { entityId: string; svg: string }[] => {
  const wanted = [...new Set(scene.nodes.filter((node) => node.kind === RUNTIME_VALUES.CHARACTER_4BCEF3DE && !node.anonymous && node.entityId).map((node) => node.entityId!))].slice(0, R.MAX_PEOPLE);
  return wanted.flatMap((entityId) => {
    for (const other of scenes) {
      if (other.id === scene.id || other.build?.status !== RUNTIME_VALUES.ACCEPTED_070C160A || !other.composition) continue;
      const asset = assets[other.composition.assetKey];
      if (!asset) continue;
      const layer = other.composition.layers.find((item) => item.kind === RUNTIME_VALUES.CHARACTER_4BCEF3DE && item.entityId === entityId && usable(other.nodes.find((node) => node.id === item.id)));
      if (!layer) continue;
      const group = motionSvgGroup(asset.svg, layer.id);
      if (!group || group.length > R.MAX_CHARS) continue;
      return [{ entityId, svg: R.WRAP(asset.width, asset.height, group) }];
    }
    return [];
  });
};
