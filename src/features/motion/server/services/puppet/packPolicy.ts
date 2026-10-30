import { RUNTIME_TEXT as RT_SERVER } from "../../../../../constants/runtime/server.js";
import { stringifyJson } from "../../../../../lib/jsonStringify.js";
import { AsyncLocalStorage } from "node:async_hooks";
import { createHash } from "node:crypto";
import { MOTION_PACK as K } from "../../../../../constants/motionPack.js";
import { PUPPET_TYPES as T } from "../../../../../constants/motionPuppet.js";
import type { PuppetAsset, PuppetGen, PuppetPackSnapshot, PuppetSet } from "../../../../../types/motionPuppet.js";
import { puppetPackAssetIssues } from "./packInventory.js";
import { motionRecipeSources } from "../../../../../lib/motionResourceRecipe.js";
interface PackScope {
  styleId: string;
  assets: Record<string, PuppetAsset>;
  assemblies: Record<string, string[]>;
}
const scope = new AsyncLocalStorage<PackScope>();
const styleOf = (asset: PuppetAsset): string | undefined => (asset.type === T.STYLE ? asset.id : RT_SERVER.STYLEID in asset ? asset.styleId : undefined);
export const closedPuppetPackId = (preset?: string): string | undefined => (preset && (K.PRESETS[preset] || Object.values(K.PRESETS).find((id) => id === preset))) || undefined;
export const puppetPackActive = (): boolean => !!scope.getStore();
export const puppetPackAssetAllowed = (asset: PuppetAsset, styleId: string): boolean => {
  if (styleOf(asset) !== styleId || !(K.TYPES as readonly string[]).includes(asset.type)) return false;
  if (puppetPackAssetIssues(asset).length) return false;
  if (asset.type === T.STYLE) return true;
  if (RT_SERVER.ALIASOF in asset && asset.aliasOf) return false;
  if (RT_SERVER.CATALOGSTATUS in asset && asset.catalogStatus === K.QUARANTINED) return false;
  return (RT_SERVER.TAGS in asset && asset.tags.includes(K.SEED)) || (RT_SERVER.SOURCE in asset && asset.source === K.SEED);
};
export const runWithPuppetPack = <R>(styleId: string, assets: PuppetAsset[], fn: () => R, previous?: PuppetPackSnapshot): R => {
  if (previous) withPuppetPackSnapshot(previous, () => undefined);
  if (previous && previous.styleId !== styleId) throw new Error(K.SNAPSHOT_INVALID);
  return scope.run({ styleId, assets: { ...Object.fromEntries(assets.filter((asset) => puppetPackAssetAllowed(asset, styleId)).map((asset) => [asset.id, structuredClone(asset)])), ...(previous?.assets || {}) }, assemblies: { ...(previous?.assemblies || {}) } }, fn);
};
export const scopedPuppetAsset = (type: string, id: string): { active: boolean; asset: PuppetAsset | null } => {
  const current = scope.getStore();
  if (!current || !(K.TYPES as readonly string[]).includes(type)) return { active: false, asset: null };
  const asset = current.assets[id];
  return { active: true, asset: asset?.type === type ? structuredClone(asset) : null };
};
export const scopedPuppetAssets = (type: string): PuppetAsset[] | undefined => {
  const current = scope.getStore();
  return current && (K.TYPES as readonly string[]).includes(type)
    ? Object.values(current.assets)
        .filter((asset) => asset.type === type)
        .map((asset) => structuredClone(asset))
    : undefined;
};
export const scopedPuppetLightVariant = (set: PuppetSet, time: string): PuppetSet | undefined => {
  const current = scope.getStore();
  const match =
    current &&
    Object.values(current.assets)
      .filter((asset): asset is PuppetSet => asset.type === T.SET && asset.styleId === set.styleId && asset.time === time && Object.values(asset.variants || {}).includes(set.id))
      .sort((a, b) => a.id.localeCompare(b.id))[0];
  return match ? structuredClone(match) : undefined;
};
export const withPuppetAssemblyTrial = <R>(sets: PuppetSet[], sources: string[], fn: () => R): R => {
  const current = scope.getStore();
  if (!current) return fn();
  return scope.run({ ...current, assets: { ...current.assets }, assemblies: { ...current.assemblies } }, () => {
    for (const set of sets) registerPuppetAssembly(set, sources);
    return fn();
  });
};
const contentOf = (asset: PuppetAsset): string => stringifyJson(Object.fromEntries(Object.entries(asset).filter(([key]) => !(K.IGNORED_FIELDS as readonly string[]).includes(key))));
export const guardPuppetAssetWrite = (asset: PuppetAsset): boolean => {
  const current = scope.getStore();
  if (!current || !(K.TYPES as readonly string[]).includes(asset.type)) return false;
  const original = current.assets[asset.id];
  if (!original || contentOf(original) !== contentOf(asset)) throw new Error(K.WRITE_BLOCKED(asset.id));
  return true;
};
export const assertPuppetDrawingAllowed = (): void => {
  if (scope.getStore()) throw new Error(K.DRAW_BLOCKED);
};
export const registerPuppetAssembly = (asset: PuppetSet, sources: string[]): PuppetSet => {
  const current = scope.getStore();
  if (!current || asset.styleId !== current.styleId || puppetPackAssetIssues(asset).length || !sources.length || sources.includes(asset.id) || sources.some((id) => !current.assets[id] || !(K.ASSEMBLY_TYPES as readonly string[]).includes(current.assets[id].type))) throw new Error(K.SNAPSHOT_INVALID);
  current.assets[asset.id] = structuredClone(asset);
  current.assemblies[asset.id] = [...new Set(sources)];
  return asset;
};
const fingerprint = (assets: Record<string, PuppetAsset>, assemblies: Record<string, string[]>): string =>
  createHash(K.HASH)
    .update(
      stringifyJson([
        Object.keys(assets)
          .sort()
          .map((id) => [id, contentOf(assets[id])]),
        Object.entries(assemblies).sort(([a], [b]) => a.localeCompare(b)),
      ]),
    )
    .digest(K.HEX);
export const capturePuppetPack = (gen: Pick<PuppetGen, "styleId" | "characters" | "sets" | "props">): PuppetPackSnapshot | undefined => {
  const current = scope.getStore();
  if (!current) return undefined;
  const wanted = new Set([gen.styleId, ...Object.values(gen.characters), ...Object.values(gen.sets), ...Object.values(gen.props)]);
  const assets: Record<string, PuppetAsset> = {};
  const assemblies: Record<string, string[]> = {};
  const add = (id: string): void => {
    if (assets[id]) return;
    const asset = current.assets[id];
    if (!asset) throw new Error(K.MISSING(id, [id]));
    assets[id] = structuredClone(asset);
    if (asset.type === T.SET) for (const other of [...Object.values(asset.variants || {}), ...motionRecipeSources(asset)]) add(other);
    if (current.assemblies[id]) {
      assemblies[id] = current.assemblies[id];
      for (const source of assemblies[id]) add(source);
    }
  };
  for (const id of wanted) add(id);
  return { version: K.VERSION, policy: K.POLICY, styleId: current.styleId, fingerprint: fingerprint(assets, assemblies), assets, assemblies };
};
export const withPuppetPackSnapshot = <R>(pack: PuppetPackSnapshot | undefined, fn: () => R): R => {
  if (!pack) return fn();
  if (pack.version !== K.VERSION || pack.policy !== K.POLICY || !closedPuppetPackId(pack.styleId) || pack.fingerprint !== fingerprint(pack.assets, pack.assemblies)) throw new Error(K.SNAPSHOT_INVALID);
  const checked = new Set<string>();
  const visit = (id: string, path = new Set<string>()): void => {
    if (checked.has(id)) return;
    const asset = pack.assets[id];
    if (!asset || asset.id !== id || styleOf(asset) !== pack.styleId || path.has(id)) throw new Error(K.SNAPSHOT_INVALID);
    const sources = pack.assemblies[id];
    if (!puppetPackAssetAllowed(asset, pack.styleId) && !(asset.type === T.SET && sources?.length)) throw new Error(K.SNAPSHOT_INVALID);
    const next = new Set([...path, id]);
    for (const source of sources || []) {
      if (!(K.ASSEMBLY_TYPES as readonly string[]).includes(pack.assets[source]?.type)) throw new Error(K.SNAPSHOT_INVALID);
      visit(source, next);
    }
    if (asset.type === T.SET)
      for (const source of motionRecipeSources(asset)) {
        if (!(K.ASSEMBLY_TYPES as readonly string[]).includes(pack.assets[source]?.type)) throw new Error(K.SNAPSHOT_INVALID);
        visit(source, next);
      }
    if (asset.type === T.SET)
      for (const variant of Object.values(asset.variants || {})) {
        if (pack.assets[variant]?.type !== T.SET) throw new Error(K.SNAPSHOT_INVALID);
      }
    checked.add(id);
  };
  for (const id of Object.keys(pack.assets)) visit(id);
  if (pack.assets[pack.styleId]?.type !== T.STYLE) throw new Error(K.SNAPSHOT_INVALID);
  return scope.run({ styleId: pack.styleId, assets: structuredClone(pack.assets), assemblies: structuredClone(pack.assemblies) }, fn);
};
