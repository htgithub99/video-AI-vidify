import { MOTION_IDENTITY_REFERENCE as I } from "../constants/motionIdentityReference.js";
import { MOTION_VISUAL as V } from "../constants/motionVisual.js";
import type { MotionRemotionProfile, MotionRemotionScene, MotionVectorAsset } from "../types/motionVisual.js";
export type MotionIdentityReference = { entityId: string; sceneId: string; svg: string };
const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
export const motionLayerSvg = (svg: string, id: string): string | undefined => {
  const open = new RegExp(`<([\\w:-]+)\\b[^<>]*\\bid\\s*=\\s*(["'])${escape(id)}\\2[^<>]*?(\\/?)>`).exec(svg);
  if (!open) return undefined;
  if (open[3]) return open[0];
  const tags = new RegExp(I.TAG.source, I.TAG.flags);
  tags.lastIndex = open.index + open[0].length;
  let depth = 1;
  for (let match = tags.exec(svg); match; match = tags.exec(svg)) {
    if (match[3]) continue;
    depth += match[1] ? -1 : 1;
    if (depth === 0) return svg.slice(open.index, match.index + match[0].length);
  }
  return undefined;
};
export const motionCompactSvg = (svg: string): string => svg.replace(I.STRIP, "").replace(I.WHITESPACE, I.TAG_JOIN).trim().replace(I.ROOT_TRANSFORM, "$1");
const expandHex = (hex: string): string => (hex.length === I.HEX_SHORT ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}` : hex.slice(0, 7)).toLowerCase();
export const motionSvgPalette = (svg: string): string[] => {
  const counts = new Map<string, number>();
  for (const match of svg.matchAll(I.FILL)) {
    const hex = expandHex(match[1]);
    counts.set(hex, (counts.get(hex) || 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, I.PALETTE_SIZE)
    .map(([hex]) => hex);
};
const channel = (hex: string, offset: number) => parseInt(hex.slice(offset, offset + 2), 16);
const near = (a: string, b: string) => Math.max(Math.abs(channel(a, 1) - channel(b, 1)), Math.abs(channel(a, 3) - channel(b, 3)), Math.abs(channel(a, 5) - channel(b, 5))) <= I.COLOR_TOLERANCE;
export const motionPaletteDistance = (reference: string[], current: string[]): number => (reference.length ? reference.filter((hex) => !current.some((other) => near(hex, other))).length / reference.length : 0);
export const motionIdentityReferences = (scene: MotionRemotionScene, scenes: MotionRemotionScene[], profileId: MotionRemotionProfile, assets: Record<string, MotionVectorAsset>, cast: { key: string; narrator?: boolean }[] = []): MotionIdentityReference[] => {
  const nodes = scene.nodes.filter((node) => node.kind === "character" && !node.anonymous && !node.appearanceChanged && node.entityId && node.representation !== "detail");
  const rank = (entityId: string, representation?: string): number => {
    const index = cast.findIndex((member) => member.key === entityId);
    return (cast[index]?.narrator ? 0 : 1) * 1_000_000 + (index < 0 ? cast.length : index) * 10 + I.REPRESENTATION_ORDER.indexOf(representation || I.REPRESENTATION_ORDER[0]);
  };
  const wanted = [...new Set([...nodes].sort((a, b) => rank(a.entityId!, a.representation) - rank(b.entityId!, b.representation)).map((node) => node.entityId!))];
  const index = scenes.findIndex((other) => other.id === scene.id);
  const candidates = index < 0 ? [...scenes].reverse() : [...scenes.slice(0, index).reverse(), ...scenes.slice(index + 1)];
  const references: MotionIdentityReference[] = [];
  for (const entityId of wanted) {
    if (references.length >= I.MAX_PER_SCENE) break;
    for (const other of candidates) {
      const composition = other.composition;
      if (other.id === scene.id || other.build?.status !== "accepted" || other.cropFrom || composition?.profileId !== profileId || composition.profileRevision !== V.PROFILES[profileId].revision) continue;
      const layer = composition.layers.find((item) => item.kind === "character" && item.entityId === entityId);
      const asset = assets[composition.assetKey];
      if (!layer || !asset) continue;
      const extracted = motionLayerSvg(asset.svg, layer.id);
      if (!extracted) continue;
      const svg = motionCompactSvg(extracted);
      if (svg.length > I.SVG_LIMIT) continue;
      references.push({ entityId, sceneId: other.id, svg });
      break;
    }
  }
  return references;
};
export const motionIdentityDrift = (references: MotionIdentityReference[], svg: string, layers: { id: string; kind: string; entityId?: string }[]): string[] =>
  references.flatMap((reference) => {
    const layer = layers.find((item) => item.kind === "character" && item.entityId === reference.entityId);
    const drawn = layer && motionLayerSvg(svg, layer.id);
    if (!drawn) return [];
    const expected = motionSvgPalette(reference.svg);
    if (expected.length < I.MIN_PALETTE) return [];
    return motionPaletteDistance(expected, motionSvgPalette(drawn)) > I.PALETTE_DISTANCE ? [reference.entityId] : [];
  });
