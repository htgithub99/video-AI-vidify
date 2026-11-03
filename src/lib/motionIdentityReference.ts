import { MOTION_IDENTITY_REFERENCE as I } from "../constants/motionIdentityReference.js";
import { MOTION_VISUAL as V } from "../constants/motionVisual.js";
import { MOTION_PROFILE_SCENES } from "../constants/motionProfiles/scenes.js";
import type { MotionRemotionProfile, MotionRemotionScene, MotionVectorAsset } from "../types/motionVisual.js";
export type MotionIdentityReference = { entityId: string; sceneId: string; svg: string; costumeColors?: string[] };
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
const idPattern = /<[\w:-]+\b[^<>]*\bid\s*=\s*(["'])([^"']+)\1/g;
export const motionStripSubLayers = (svg: string, exclude: ReadonlySet<string>): string => {
  let next = svg;
  for (let guard = 0; guard < 64; guard++) {
    const inner = next.slice(next.indexOf(">") + 1);
    const match = [...inner.matchAll(idPattern)].find((entry) => exclude.has(entry[2]) || I.PROP_PART.test(entry[2]));
    if (!match) break;
    const part = motionLayerSvg(next, match[2]);
    if (!part) break;
    next = next.replace(part, "");
  }
  return next;
};
type SvgNode = { open: string; close: string; id?: string; children: SvgNode[]; text: string };
const parseSvg = (svg: string): SvgNode[] => {
  const root: SvgNode = { open: "", close: "", children: [], text: "" };
  const stack: SvgNode[] = [root];
  let cursor = 0;
  const tags = new RegExp(I.TAG.source, I.TAG.flags);
  for (let match = tags.exec(svg); match; match = tags.exec(svg)) {
    const between = svg.slice(cursor, match.index);
    if (between.trim()) stack[stack.length - 1].children.push({ open: "", close: "", children: [], text: between });
    cursor = match.index + match[0].length;
    if (match[1]) {
      const node = stack.length > 1 ? stack.pop() : undefined;
      if (node) node.close = match[0];
      continue;
    }
    const node: SvgNode = { open: match[0], close: "", id: match[0].match(I.ATTR_ID)?.[2], children: [], text: "" };
    stack[stack.length - 1].children.push(node);
    if (!match[3]) stack.push(node);
  }
  return root.children;
};
const serialize = (nodes: SvgNode[]): string => nodes.map((node) => (node.open ? node.open + serialize(node.children) + node.close : node.text)).join("");
const keepIdentity = (node: SvgNode, identity: RegExp): SvgNode | undefined => {
  if (!node.open) return undefined;
  if (node.id && identity.test(node.id)) return node;
  const children = node.children.map((child) => keepIdentity(child, identity)).filter((child): child is SvgNode => !!child);
  return children.length ? { ...node, children } : undefined;
};
const withoutIdentity = (node: SvgNode, identity: RegExp): SvgNode | undefined => {
  if (node.id && identity.test(node.id)) return undefined;
  return { ...node, children: node.children.map((child) => withoutIdentity(child, identity)).filter((child): child is SvgNode => !!child) };
};
export const motionIdentityHead = (layerSvg: string, identity: RegExp): string | undefined => {
  const [root] = parseSvg(layerSvg);
  if (!root?.open) return undefined;
  const kept = root.children.map((child) => keepIdentity(child, identity)).filter((child): child is SvgNode => !!child);
  return kept.length ? root.open + serialize(kept) + root.close : undefined;
};
export const motionIdentityBody = (layerSvg: string, identity: RegExp): string => {
  const [root] = parseSvg(layerSvg);
  const body = root && withoutIdentity(root, identity);
  return body ? serialize([body]) : "";
};
const expandHex = (hex: string): string => (hex.length === I.HEX_SHORT ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}` : hex.slice(0, 7)).toLowerCase();
export const motionSvgPalette = (svg: string, size: number = I.PALETTE_SIZE): string[] => {
  const counts = new Map<string, number>();
  for (const match of svg.matchAll(I.FILL)) {
    const hex = expandHex(match[1]);
    counts.set(hex, (counts.get(hex) || 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, size)
    .map(([hex]) => hex);
};
export const motionCostumeColors = (bodySvg: string): string[] => motionSvgPalette(bodySvg, 8).filter((hex) => !I.COSTUME_SKIP.test(hex)).slice(0, I.COSTUME_COLORS);
const channel = (hex: string, offset: number) => parseInt(hex.slice(offset, offset + 2), 16);
const near = (a: string, b: string) => Math.max(Math.abs(channel(a, 1) - channel(b, 1)), Math.abs(channel(a, 3) - channel(b, 3)), Math.abs(channel(a, 5) - channel(b, 5))) <= I.COLOR_TOLERANCE;
export const motionPaletteDistance = (reference: string[], current: string[]): number => (reference.length ? reference.filter((hex) => !current.some((other) => near(hex, other))).length / reference.length : 0);
export const motionIdentityReferences = (scene: MotionRemotionScene, scenes: MotionRemotionScene[], profileId: MotionRemotionProfile, assets: Record<string, MotionVectorAsset>, cast: { key: string; narrator?: boolean }[] = []): { references: MotionIdentityReference[]; changed: string[] } => {
  const changed: string[] = [];
  const nodes = scene.nodes.filter((node) => node.kind === "character" && !node.anonymous && !node.appearanceChanged && node.entityId && node.representation !== "detail");
  const rank = (entityId: string, representation?: string): number => {
    const index = cast.findIndex((member) => member.key === entityId);
    return (cast[index]?.narrator ? 0 : 1) * 1_000_000 + (index < 0 ? cast.length : index) * 10 + I.REPRESENTATION_ORDER.indexOf(representation || I.REPRESENTATION_ORDER[0]);
  };
  const wanted = [...new Set([...nodes].sort((a, b) => rank(a.entityId!, a.representation) - rank(b.entityId!, b.representation)).map((node) => node.entityId!))];
  const index = scenes.findIndex((other) => other.id === scene.id);
  const candidates = index < 0 ? [...scenes].reverse() : [...scenes.slice(0, index).reverse(), ...scenes.slice(index + 1)];
  const references: MotionIdentityReference[] = [];
  const identity = MOTION_PROFILE_SCENES[profileId].identityParts;
  const headChanged = I.HEAD_CHANGE.test(scene.text || "");
  for (const entityId of wanted) {
    if (references.length >= I.MAX_PER_SCENE) break;
    for (const other of candidates) {
      const composition = other.composition;
      if (other.id === scene.id || other.build?.status !== "accepted" || other.crop || composition?.profileId !== profileId || composition.profileRevision !== V.PROFILES[profileId].revision) continue;
      const layer = composition.layers.find((item) => item.kind === "character" && item.entityId === entityId);
      const asset = assets[composition.assetKey];
      if (!layer || !asset) continue;
      if (headChanged) {
        changed.push(entityId);
        break;
      }
      const extracted = motionLayerSvg(asset.svg, layer.id);
      if (!extracted) continue;
      const others = new Set(composition.layers.filter((item) => item.id !== layer.id && item.kind !== "character").map((item) => item.id));
      const clean = motionStripSubLayers(motionCompactSvg(extracted), others);
      const head = motionIdentityHead(clean, identity);
      if (!head || head.length > I.SVG_LIMIT) continue;
      const costumeColors = motionCostumeColors(motionIdentityBody(clean, identity));
      references.push({ entityId, sceneId: other.id, svg: head, ...(costumeColors.length ? { costumeColors } : {}) });
      break;
    }
  }
  return { references, changed };
};
export const motionIdentityDrift = (references: MotionIdentityReference[], svg: string, layers: { id: string; kind: string; entityId?: string }[], profileId: MotionRemotionProfile): string[] =>
  references.flatMap((reference) => {
    const layer = layers.find((item) => item.kind === "character" && item.entityId === reference.entityId);
    const full = layer && motionLayerSvg(svg, layer.id);
    const drawn = full && motionIdentityHead(motionCompactSvg(full), MOTION_PROFILE_SCENES[profileId].identityParts);
    if (!drawn) return [];
    const expected = motionSvgPalette(reference.svg);
    if (expected.length < I.MIN_PALETTE) return [];
    return motionPaletteDistance(expected, motionSvgPalette(drawn)) > I.PALETTE_DISTANCE ? [reference.entityId] : [];
  });
