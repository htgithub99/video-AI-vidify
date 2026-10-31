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
const lite = (svg: string): string => svg.replace(R.DECIMAL, (value) => String(Math.abs(Number(value)) < R.FINE_LIMIT ? Math.round(Number(value) * 10) / 10 : Math.round(Number(value)))).replace(R.LITE_ATTRS, "");
const simplify = (svg: string): string => lite(svg).replace(R.STYLE_ATTRS, "").replace(R.NO_FILL, "");
const fit = (svg: string, max: number): string | undefined => [lite(svg), simplify(svg)].find((text) => text.length <= max);
const strip = (svg: string): string => svg.replace(R.DECIMAL, (value) => String(Math.abs(Number(value)) < R.FINE_LIMIT ? Math.round(Number(value) * 10) / 10 : Math.round(Number(value)))).replace(R.STYLE_ATTRS, "").replace(R.NO_FILL, "");
const without = (svg: string, composition: MotionSceneComposition, kinds: readonly string[]): string =>
  composition.layers.filter((layer) => kinds.includes(layer.kind)).reduce((text, layer) => {
    const group = motionSvgGroup(text, layer.id);
    return group ? text.replace(group, "") : text;
  }, svg);
const headOnly = (svg: string, id: string): string | undefined => {
  const person = motionSvgGroup(svg, id);
  const headId = person && [...person.matchAll(new RegExp(R.HEAD_ID.source, R.HEAD_FLAGS))].map((match) => match[1]).find((name) => name !== id);
  const head = headId && motionSvgGroup(person, headId);
  return head ? R.OPEN(id).exec(person)![0] + head + R.GROUP_CLOSE : undefined;
};
export const motionPlaceReference = (asset: MotionVectorAsset, composition: MotionSceneComposition, keepStrokes = false): string | undefined => {
  const place = without(asset.svg, composition, R.PLACE_DROP);
  const bare = without(asset.svg, composition, [...R.PLACE_DROP, ...R.PLACE_DROP_MORE]);
  if (!keepStrokes) return [strip(place), strip(bare)].find((text) => text.length <= R.PLACE_MAX_STRIPPED);
  return [lite(place), simplify(place), lite(bare), simplify(bare)].find((text) => text.length <= R.PLACE_MAX);
};
const usable = (node?: MotionRemotionNode): boolean => !!node && node.representation !== RUNTIME_VALUES.DETAIL_9C0211C5 && !R.BACK.test(`${node.pose || ""} ${node.description || ""}`);
export const motionIdentityReferences = (scene: MotionRemotionScene, scenes: MotionRemotionScene[], assets: Record<string, MotionVectorAsset>, headOnlyReferences = false): { entityId: string; svg: string }[] => {
  const wanted = [...new Set(scene.nodes.filter((node) => node.kind === RUNTIME_VALUES.CHARACTER_4BCEF3DE && !node.anonymous && node.entityId).map((node) => node.entityId!))].slice(0, R.MAX_PEOPLE);
  let total = 0;
  return wanted.flatMap((entityId) => {
    for (const other of scenes) {
      if (other.id === scene.id || other.build?.status !== RUNTIME_VALUES.ACCEPTED_070C160A || !other.composition) continue;
      const asset = assets[other.composition.assetKey];
      if (!asset) continue;
      const layer = other.composition.layers.find((item) => item.kind === RUNTIME_VALUES.CHARACTER_4BCEF3DE && item.entityId === entityId && usable(other.nodes.find((node) => node.id === item.id)));
      if (!layer) continue;
      if (!headOnlyReferences) {
        const raw = motionSvgGroup(asset.svg, layer.id);
        const group = raw && strip(raw);
        if (!group || group.length > R.MAX_CHARS) continue;
        if (total + group.length > R.TOTAL_MAX) return [];
        total += group.length;
        return [{ entityId, svg: R.WRAP(asset.width, asset.height, group) }];
      }
      const raw = headOnly(asset.svg, layer.id);
      const group = raw && fit(raw, Math.min(R.MAX_CHARS, R.TOTAL_MAX - total));
      if (!group) continue;
      total += group.length;
      return [{ entityId, svg: R.WRAP(asset.width, asset.height, group) }];
    }
    return [];
  });
};
