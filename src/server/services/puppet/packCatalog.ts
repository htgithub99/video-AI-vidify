import { MOTION_PACK as K } from "../../../constants/motionPack.js";
import { MOTION_ILLUSTRATION_POLICY as IP } from "../../../constants/motionIllustrationPolicy.js";
import { MOTION_PACK_SELECTION as S } from "../../../constants/motionPackSelection.js";
import { PUPPET as P, PUPPET_TYPES as T } from "../../../constants/motionPuppet.js";
import { listPuppets } from "./kitLibrary.js";
import { closedPuppetPackId, puppetPackAssetAllowed } from "./packPolicy.js";
import { puppetPackStageProfile } from "./packInventory.js";
import type { PuppetBase, PuppetCharacter, PuppetPiece, PuppetProp, PuppetSet } from "../../../types/motionPuppet.js";
import { MOTION_ILLUSTRATION as I } from "../../../constants/motionIllustration.js";
import { motionAssetLocationFamily, motionPlaceLocationFamily, motionPieceContactSpots, motionSemanticText } from "../../../lib/motionResourceSemantics.js";
import type { MotionStoryAnalysis } from "../../../types/motionVideo.js";
import { MOTION_PROMPT as PROMPT } from "../../../constants/motionPrompt.js";
import { puppetPropSurface } from "../../../lib/motionPropSupport.js";
const catalogInterner = () => {
  const indexes = new Map<unknown[], Map<string, number>>();
  return (table: unknown[], value: unknown): number => {
    let ids = indexes.get(table);
    if (!ids) {
      ids = new Map();
      indexes.set(table, ids);
    }
    const key = JSON.stringify(value);
    const saved = ids.get(key);
    if (saved !== undefined) return saved;
    const index = table.length;
    table.push(value);
    ids.set(key, index);
    return index;
  };
};
const packAssets = (preset?: string) => {
  const styleId = closedPuppetPackId(preset);
  if (!styleId) return null;
  const sets = listPuppets<PuppetSet>(T.SET, (asset) => puppetPackAssetAllowed(asset, styleId)).sort((a, b) => a.id.localeCompare(b.id));
  const props = listPuppets<PuppetProp>(T.PROP, (asset) => puppetPackAssetAllowed(asset, styleId));
  const characters = listPuppets<PuppetCharacter>(T.CHARACTER, (asset) => puppetPackAssetAllowed(asset, styleId));
  const bases = listPuppets<PuppetBase>(T.BASE, (asset) => puppetPackAssetAllowed(asset, styleId));
  const pieces = listPuppets<PuppetPiece>(T.PIECE, (asset) => !asset.recipeOnly && puppetPackAssetAllowed(asset, styleId)).map((piece) => ({ ...piece, spots: motionPieceContactSpots(piece) }));
  return { sets, props, characters, bases, pieces };
};
export const puppetPackCapabilities = (preset?: string): string => {
  const assets = packAssets(preset);
  if (!assets) return P.EMPTY;
  const { sets, props, characters } = assets;
  const spots: unknown[] = [];
  const layouts: unknown[] = [];
  const stages: unknown[] = [];
  const intern = catalogInterner();
  type Variant = [string, string | null, Record<string, string> | null, string[]];
  const illustrated = new Map<string, [string, boolean, number, Variant[]]>();
  for (const set of sets) {
    const profile = puppetPackStageProfile(set);
    const spotIds = profile.spots.map((spot) => intern(spots, spot));
    const byKey = new Map(profile.spots.map((spot, i) => [spot[0], spotIds[i]]));
    const layoutIds = (set.compositions || []).map((layout) => intern(layouts, [layout.kind, layout.variant || null, Object.fromEntries(Object.entries(layout.roles).map(([role, spot]) => [role, byKey.get(spot)]))]));
    const stage = intern(stages, [spotIds, layoutIds]);
    const signature = JSON.stringify([profile.place, profile.interior, stage]);
    let row = illustrated.get(signature);
    if (!row) {
      row = [profile.place, profile.interior, stage, []];
      illustrated.set(signature, row);
    }
    let variant = row[3].find(([time, condition, fixtures]) => time === profile.time && condition === (profile.condition || null) && JSON.stringify(fixtures) === JSON.stringify(profile.fixtureStates || null));
    if (!variant) {
      variant = [profile.time, profile.condition || null, profile.fixtureStates || null, []];
      row[3].push(variant);
    }
    variant[3].push(set.id);
  }
  return (
    K.STORY_PROMPT +
    K.SEPARATOR +
    JSON.stringify({
      version: S.VERSION,
      places: [...new Set(sets.map((asset) => asset.group || asset.tags[0]))],
      mode: I.MODE,
      schema: S.CATALOG_SCHEMA,
      spots,
      layouts,
      stages,
      illustrations: [...illustrated.values()],
      props: props.map((asset) => [asset.id, asset.key, asset.desc, asset.mount]),
      characters: characters.map((asset) => [asset.id, asset.archetype, asset.age, asset.gender, asset.group, asset.desc, Object.keys(asset.sprites || {})]),
    })
  );
};
export const puppetPackStoryCapabilities = (preset?: string, context?: Pick<MotionStoryAnalysis, "places">): string => {
  const assets = packAssets(preset);
  if (!assets) return P.EMPTY;
  const unique = (rows: unknown[]) => [...new Map(rows.map((row) => [JSON.stringify(row), row])).values()];
  const requested = (context?.places || []).map((place) => motionPlaceLocationFamily({ key: place.key, name: place.name, desc: place.description || place.name, interior: place.interior ?? P.INTERIOR_RE.test(place.key) }));
  const families = new Set(requested.filter(Boolean));
  const sets = families.size && requested.every(Boolean) ? assets.sets.filter((set) => families.has(motionAssetLocationFamily(set))) : assets.sets;
  const places = unique(sets.map((set) => [set.locationFamily || set.group || set.tags[0], set.interior, [...new Set((set.spots || []).map((spot) => [spot.kind, spot.fixture].filter(Boolean).join(K.COLON)))].sort(), [...new Set((set.compositions || []).map((composition) => composition.kind))].sort()]));
  const supports: unknown[] = [],
    interactions: unknown[] = [];
  const intern = catalogInterner();
  const compact = places.map((value) => {
    const row = value as unknown[];
    return [row[0], row[1], intern(supports, row[2]), intern(interactions, row[3])];
  });
  return K.STORY_PROMPT + K.SEPARATOR + JSON.stringify({ mode: I.MODE, schema: K.COMPACT_STORY_SCHEMA, supports, interactions, places: compact, props: unique(assets.props.map((prop) => [prop.key, prop.mount])), characters: unique(assets.characters.map((character) => [character.archetype, character.age, character.gender])) });
};
export const puppetPackReadCatalog = (preset?: string, context?: string): string => {
  const assets = packAssets(preset);
  if (!assets) return P.EMPTY;
  const profiles: unknown[] = [];
  const intern = catalogInterner();
  const text = context === undefined ? undefined : P.SPACE + motionSemanticText(context) + P.SPACE;
  const relevant = new Set(assets.props.filter((prop) => [prop.key, prop.originalName, ...prop.tags.filter((tag) => ![K.SEED, prop.key].includes(tag))].some((label) => label && text?.includes(P.SPACE + motionSemanticText(label) + P.SPACE))).map((prop) => prop.key));
  const props = assets.props.map((prop) => {
    const desc = prop.desc.replace(K.READ_CATALOG_BOILERPLATE, P.EMPTY).trim();
    return [prop.key, intern(profiles, [prop.mount, prop.objectType || null, prop.requirements || [], puppetPropSurface(prop) || null]), (text && relevant.size && !relevant.has(prop.key)) || motionSemanticText(desc) === motionSemanticText(prop.key) ? null : desc];
  });
  return [K.READ_PROMPT, K.READ_CATALOG_SCHEMA, JSON.stringify({ props, profiles })].join(P.NL);
};
export const puppetPackChapterCapabilities = (preset?: string): string => {
  const styleId = closedPuppetPackId(preset);
  if (!styleId) return P.EMPTY;
  const props = listPuppets<PuppetProp>(T.PROP, (asset) => puppetPackAssetAllowed(asset, styleId));
  return PROMPT.CHAPTER_LIBRARY + JSON.stringify({ props: [...new Map(props.map((prop) => [JSON.stringify([prop.key, prop.mount]), [prop.key, prop.mount]])).values()] });
};
export const puppetPackPlanningCapabilities = (preset?: string): string => {
  const assets = packAssets(preset);
  if (!assets) return P.EMPTY;
  const unique = (rows: unknown[]) => [...new Map(rows.map((row) => [JSON.stringify(row), row])).values()];
  return [PROMPT.PLANNING_LIBRARY, IP.PROMPT, JSON.stringify({ places: unique(assets.sets.map((set) => [motionAssetLocationFamily(set) || set.group || set.tags[0], set.interior])), props: unique(assets.props.map((prop) => [prop.key, prop.mount, prop.requirements || []])), characters: unique(assets.characters.map((character) => [character.archetype, character.age, character.gender])) })].join(
    P.NL,
  );
};
