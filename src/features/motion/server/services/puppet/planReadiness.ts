import { RUNTIME_TEXT as RT_SERVER } from "../../../../../constants/runtime/server.js";
import { normalizeMotionIllustrationNeeds } from "../../../../../lib/motionIllustrationNeeds.js";
import { MOTION_PRODUCTION as P } from "../../../../../constants/motionProduction.js";
import { MOTION_PACK as K } from "../../../../../constants/motionPack.js";
import { PUPPET as C, PUPPET_TYPES as T, type PuppetType } from "../../../../../constants/motionPuppet.js";
import type { MotionStoryAnalysis } from "../../../../../types/motionVideo.js";
import type { PuppetBase, PuppetPiece, PuppetPackSnapshot, PuppetPlace, PuppetProp, PuppetRead, PuppetSet, PuppetStylePack, PuppetGen } from "../../../../../types/motionPuppet.js";
import { createPuppetSceneChoices } from "./packSceneChoices.js";
import { puppetPackAssemblyBaseFits } from "./packLocation.js";
import { motionPieceEnvironmentFits, motionPieceContactSpots } from "../../../../../lib/motionResourceSemantics.js";
import { puppetFeatureSpot } from "./layout.js";
import { puppetPackAssetIssues } from "./packInventory.js";
import { listPuppets, readPuppet } from "./kitLibrary.js";
import { capturePuppetPack, closedPuppetPackId, runWithPuppetPack } from "./packPolicy.js";
import { matchArchetypes, puppetCastIsGhost } from "./kitDraw.js";
import { puppetPackSetLocationFits } from "./packLocation.js";
import { buildPuppetSets } from "./setComposer.js";
import { puppetSetMissingRequirements, puppetSetPlacementNeeds, puppetSetReadFeatures } from "./layout.js";
import { MotionResourceError } from "../../../../../lib/motionResourceFailure.js";
import { MOTION_RESOURCE_FAILURE as F } from "../../../../../constants/motionResourceFailure.js";
import { motionInputKey } from "../motionFileUtils.js";
import { preferredPuppetProps, puppetObjectCatalogKey, puppetObjectClass, puppetPropFits } from "../../../../../lib/motionPuppetAssets.js";
import { PA } from "../../../../../constants/motionPuppetAssets.js";
import { motionIllustrationNeedsValid } from "../../../../../lib/motionIllustrationNeeds.js";
import { puppetNestedPropAssetIssues } from "../../../../../lib/motionPropSupport.js";
import { MOTION_STAGE_GEOMETRY as G } from "../../../../../constants/motionStageGeometry.js";
export interface PuppetPlanReadiness {
  version: number;
  inputKey: string;
  characters: Record<string, string>;
  places: Record<string, string>;
  props?: Record<string, string>;
  pack?: PuppetPackSnapshot;
  declaredNeeds?: number;
  assetKeys?: Record<string, string>;
}
export const puppetPlanReadinessKey = (analysis: MotionStoryAnalysis) => motionInputKey([G.VERSION, analysis.stylePreset, analysis.cast, analysis.places, analysis.illustrationNeeds]);
export const puppetPlanAssetKey = (asset: Record<string, any>) => motionInputKey(Object.fromEntries(Object.entries(asset).filter(([key]) => !(K.IGNORED_FIELDS as readonly string[]).includes(key))));
export const checkPuppetPlanReadiness = async (analysis: MotionStoryAnalysis, signal?: AbortSignal, log: (line: string) => void = () => {}): Promise<PuppetPlanReadiness | undefined> => {
  const styleId = closedPuppetPackId(analysis.stylePreset);
  if (!styleId) return undefined;
  analysis = normalizeMotionIllustrationNeeds(analysis);
  const assets = K.TYPES.flatMap((type) => listPuppets(type as PuppetType));
  return runWithPuppetPack(styleId, assets, async () => {
    signal?.throwIfAborted();
    const style = readPuppet<PuppetStylePack>(T.STYLE, styleId);
    if (!style) throw new Error(P.PREFLIGHT_FAILED);
    const options = { exec: {}, signal, log };
    const needs = analysis.illustrationNeeds || [];
    if (!motionIllustrationNeedsValid(analysis)) throw new Error(P.ILLUSTRATION_NEEDS_INVALID);
    const props: Record<string, string> = {};
    const propAssets = preferredPuppetProps(listPuppets<PuppetProp>(T.PROP));
    for (const need of needs)
      for (const object of need.objects) {
        if (puppetObjectClass(object) !== PA.PROP) continue;
        const candidate = propAssets.find((asset) => puppetPropFits(object, asset));
        if (!candidate || (props[object.key] && props[object.key] !== candidate.id)) {
          const matches = assets.filter((asset) => asset.type === T.PROP && asset.styleId === styleId && asset.key === puppetObjectCatalogKey(object));
          throw new MotionResourceError({ kind: K.PROP, reason: matches.some((asset) => puppetPackAssetIssues(asset).length) ? F.REASONS.METADATA : F.REASONS.MISSING, name: object.word || object.key, place: need.place, needs: [need.id], details: [puppetObjectCatalogKey(object)] });
        }
        props[object.key] = candidate.id;
      }
    const selectedProps = Object.fromEntries(Object.entries(props).map(([key, id]) => [key, readPuppet<PuppetProp>(T.PROP, id)!]));
    for (const need of needs) {
      const details = puppetNestedPropAssetIssues(need.objects, selectedProps);
      if (details.length) throw new MotionResourceError({ kind: K.PROP, reason: F.REASONS.SUPPORT, name: need.place, place: need.place, needs: [need.id], details });
    }
    const aliases = new Map(analysis.cast.filter((character) => puppetCastIsGhost(character) && character.appearanceOf && character.appearanceOf !== character.key && analysis.cast.some((other) => other.key === character.appearanceOf && !other.appearanceOf)).map((character) => [character.key, character.appearanceOf!]));
    const selected = await matchArchetypes(
      style,
      analysis.cast.filter((character) => !aliases.has(character.key)),
      options,
    );
    const characters = Object.fromEntries(Object.entries(selected).map(([key, asset]) => [key, asset.id]));
    for (const [key, source] of aliases) if (characters[source]) characters[key] = characters[source];
    const missingCast = analysis.cast.filter((character) => !characters[character.key]);
    if (missingCast.length) throw new MotionResourceError({ kind: K.CAST, reason: F.REASONS.MISSING, name: missingCast.map((character) => character.name || character.key).join(C.COMMA), details: missingCast.map((character) => character.key) });
    const places: Record<string, string> = {};
    const sets = listPuppets<PuppetSet>(T.SET).sort((a, b) => a.id.localeCompare(b.id));
    for (const place of analysis.places) {
      signal?.throwIfAborted();
      const requested: PuppetPlace = { key: place.key, name: place.name, desc: place.description || place.name, interior: place.interior ?? C.INTERIOR_RE.test(place.key), time: C.DARK_RE.test(place.time || C.EMPTY) ? C.NIGHT : C.DAY };
      const placeNeeds = needs.filter((need) => need.place === place.key);
      const reads: PuppetRead[] = placeNeeds.map((need) => ({ place: place.key, focus: need.states[0]?.char || place.key, who: need.states.map((state) => state.char), states: need.states.map((state) => ({ ...state, action: state.action || C.ACTION_DEFAULT })), objects: need.objects, action: C.ACTION_DEFAULT, emotion: C.EXPR_DEFAULT, overlays: [] }));
      const features = [...new Set([...placeNeeds.flatMap((need) => need.features || []), ...puppetSetReadFeatures(reads), ...placeNeeds.flatMap((need) => need.objects.filter((object) => puppetObjectClass(object) === PA.SCENERY).map(puppetObjectCatalogKey))])];
      requested.sceneFeatures = features;
      const validate = (set: PuppetSet): string[] => {
        const issues = [...(set.interior !== requested.interior || !puppetPackSetLocationFits(requested, set) ? [K.SET] : []), ...puppetSetMissingRequirements(set, reads, features)];
        if (issues.length) return issues;
        for (const [index, baseRead] of reads.entries()) {
          const need = placeNeeds[index];
          const read: PuppetRead = { ...baseRead, object: baseRead.objects?.[0] || null, visual: { scene: need.id, timeline: RT_SERVER.PRESENT, evidence: [need.evidence], fixtures: [] } };
          try {
            createPuppetSceneChoices({ key: need.id, text: need.evidence, cast: read.who, place: read.place } as any, read, { styleId, characters, props, sets: {}, frames: {}, places: { [place.key]: requested } } as PuppetGen, style, undefined, set);
          } catch (error) {
            return [(error as Error).message];
          }
        }
        return [];
      };
      const fits = (set: PuppetSet) => !validate(set).length;
      let candidate = sets.find(fits);
      if (!candidate) candidate = (await buildPuppetSets(style, [{ place: requested, placements: puppetSetPlacementNeeds(reads), must: [...new Set([...features, ...puppetSetPlacementNeeds(reads).map((contact) => contact.support)])], uses: analysis.logline, validate }], options, motionInputKey([analysis.title, place.key])))[place.key];
      if (!candidate) {
        const candidates = sets.filter((set) => set.interior === requested.interior && puppetPackSetLocationFits(requested, set)).map((set) => ({ id: set.id, issues: puppetSetMissingRequirements(set, reads, features) }));
        const details = [...new Set(candidates.flatMap((entry) => entry.issues))];
        const bases = listPuppets<PuppetBase>(T.BASE).filter((base) => !base.recipeOnly && puppetPackAssemblyBaseFits(requested, base));
        const pieces = listPuppets<PuppetPiece>(T.PIECE);
        const family = requested.interior ? C.INTERIOR_TAG : C.EXTERIOR_TAG;
        const contacts = puppetSetPlacementNeeds(reads);
        const provides = (piece: PuppetPiece, contact: (typeof contacts)[number]) => !!puppetFeatureSpot(motionPieceContactSpots(piece), contact.support, contact.kind);
        const unavailable = contacts.filter((contact) => !pieces.some((piece) => motionPieceEnvironmentFits(piece, family) && provides(piece, contact)));
        const filtered = unavailable.some((contact) => pieces.some((piece) => provides(piece, contact)));
        const reason = filtered ? F.REASONS.FILTERED : !bases.length && !candidates.length ? F.REASONS.MISSING : unavailable.length ? F.REASONS.SUPPORT : F.REASONS.SEARCH;
        log(F.LOG(place.name || place.key, candidates.length, reason));
        throw new MotionResourceError({ kind: K.SET, reason, place: place.key, name: place.name || place.key, needs: placeNeeds.map((need) => need.id), details: [...unavailable.map((contact) => [contact.support, contact.kind, contact.count].join(C.SEP)), ...details].slice(0, 6), candidates });
      }
      places[place.key] = candidate.id;
    }
    const result = {
      version: P.ILLUSTRATION_VERSION,
      inputKey: puppetPlanReadinessKey(analysis),
      characters,
      places,
      props,
      declaredNeeds: needs.length,
      pack: capturePuppetPack({ styleId, characters, sets: places, props }),
      assetKeys: Object.fromEntries([...new Set([...Object.values(characters), ...Object.values(places), ...Object.values(props)])].map((id) => [id, puppetPlanAssetKey(readPuppet(T.CHARACTER, id) || readPuppet(T.SET, id) || readPuppet(T.PROP, id)!)])),
    };
    log(P.ILLUSTRATION_READY(Object.keys(characters).length, Object.keys(places).length));
    if (needs.length) log(P.ILLUSTRATION_NEEDS_READY(needs.length));
    return result;
  });
};
