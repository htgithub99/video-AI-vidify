import { RUNTIME_TEXT as RT_SERVER } from "../../../constants/runtime/server.js";
import { stringifyJson } from "../../../lib/jsonStringify.js";
import { MOTION_EFFECTS as EFFECTS } from "../../../constants/motionEffects.js";
import { MOTION_AI_ROLE } from "../../../constants/motionAiFallback.js";
import { isTerminalMotionAiError } from "../chatSubmissionRecovery.js";
import { MOTION_PROGRESS as PROGRESS } from "../../../constants/motionProgress.js";
import { MotionResourceError, isMotionResourceError } from "../../../lib/motionResourceFailure.js";
import { MOTION_RESOURCE_FAILURE as RESOURCE } from "../../../constants/motionResourceFailure.js";
import { MOTION_STAGE_CONSTRAINTS as CONSTRAINTS } from "../../../constants/motionStageConstraints.js";
import _ from "lodash";
import { PA } from "../../../constants/motionPuppetAssets.js";
import { puppetObjectCatalogKey, puppetObjectClass, puppetObjectIsGeometry, puppetPropReferenceFits, puppetPropFits } from "../../../lib/motionPuppetAssets.js";
import { englishPuppetAnalysis } from "./assetProfiles.js";
import { createHash } from "crypto";
import { PUPPET as P, PUPPET_LIBRARY_MODES as LM, PUPPET_TYPES } from "../../../constants/motionPuppet.js";
import { MOTION_SOUND_CONFIG } from "../../../constants/motionSound.js";
import * as MR from "../../../constants/motionRuntime.js";
import { bindVideoDnaSettings } from "../../../lib/motionVideoDna.js";
import { collectPuppetLines, puppetLibraryMode, puppetVisualInputKey, type PuppetLine } from "../../../lib/motionPuppet.js";
import { motionNarratorCastKey } from "../../../lib/motionVoice.js";
import type { MotionStoryAnalysis, MotionStoryScript } from "../../../types/motionVideo.js";
import type { PuppetCharacter, PuppetFrame, PuppetGen, PuppetObject, PuppetPlace, PuppetProp, PuppetRead, PuppetSeries, PuppetSet } from "../../../types/motionPuppet.js";
import { compileStorySpec } from "../motionDirectorService.js";
import { prepareMotionGen, withBeatPlaces, type GenOptions } from "./genState.js";
import { mapMotionAiPool } from "../motionStoryService.js";
import { composePuppetLines, puppetFeatureSpot, puppetReadObjects, readPuppetLines } from "./director.js";
import { normalizePuppetReadContinuity } from "./readContinuity.js";
import { normalizePuppetFrameContinuity } from "./frameContinuity.js";
import { repairPuppetFrameReferences } from "./frameReferences.js";
import { normalizePuppetSceneConditions } from "./sceneCondition.js";
import { normalizePuppetVisualState } from "./visualContract.js";
import { MOTION_VISUAL_CONTRACT as V } from "../../../constants/motionVisualContract.js";
import { MOTION_STORYBOARD as SB } from "../../../constants/motionStoryboard.js";
import { MOTION_PROMPT } from "../../../constants/motionPrompt.js";
import { puppetStoryboardCovers, puppetStoryboardInputKey, puppetVisualLines } from "../../../lib/motionStoryboard.js";
import { planPuppetStoryboard } from "./storyboard.js";
import { simplePuppetStates } from "../../../lib/motionIllustrationPolicy.js";
import { MOTION_PLACEMENT as M } from "../../../constants/motionPlacement.js";
import { MOTION_BLOCKING as B } from "../../../constants/motionBlocking.js";
import { puppetSetMissingRequirements, puppetSetPlacementNeeds, puppetSetReadFeatures, puppetSpots, puppetSpotsText } from "./layout.js";
import { buildPuppetSets, puppetBases } from "./setComposer.js";
import { PUPPET_SET as Q } from "../../../constants/motionPuppetSets.js";
import { drawPuppetCharacters, drawPuppetProps, drawPuppetSets, drawPuppetSprites, ensureSetVariant, matchArchetypes, matchLibraryProps, matchLibrarySets, puppetCastIsGhost, puppetLanes, stockExtras, type PuppetSetJob } from "./kitDraw.js";
import { listPuppets, newPuppetId, readPuppet, writePuppet, currentPuppetSet, puppetPlacementKey, puppetSetForLight } from "./kitLibrary.js";
import { MOTION_PACK as PACK } from "../../../constants/motionPack.js";
import { puppetPackReadCatalog } from "./packCatalog.js";
import { capturePuppetPack, closedPuppetPackId, puppetPackActive, puppetPackAssetAllowed, runWithPuppetPack } from "./packPolicy.js";
import { puppetSetWithFixtureStates } from "./packFixtures.js";
import { puppetPackSetLocationFits } from "./packLocation.js";
import { puppetSheet, qaPuppet } from "./qa.js";
import { MOTION_ILLUSTRATION as I } from "../../../constants/motionIllustration.js";
import { MOTION_PACK_SELECTION as SELECTION } from "../../../constants/motionPackSelection.js";
import { composePuppetPackLines, createPuppetSceneChoices } from "./packSceneChoices.js";
import { assertPuppetSceneSelection } from "./packSelectionContract.js";
import { directPuppetSound } from "./sound.js";
import { resolvePuppetStyle, type PuppetRunOptions } from "./stylePack.js";
import { puppetPlanReadinessKey, puppetPlanAssetKey } from "./planReadiness.js";
const seriesName = (title: string): string => _.trim(_.toString(title).replace(P.SERIES_STRIP_RE, P.EMPTY)).toLowerCase();
const has = <T>(type: Parameters<typeof readPuppet>[0], id?: string): T | null => (id ? (readPuppet(type, id) as T | null) : null);
const placesOf = (analysis: MotionStoryAnalysis): Record<string, PuppetPlace> => _.fromPairs(_.map(analysis.places, (p) => [p.key, { key: p.key, name: p.name || p.key, desc: _.truncate(p.description || p.name || p.key, { length: 260 }), interior: p.interior ?? P.INTERIOR_RE.test(p.key), time: P.DARK_RE.test(_.toString(p.time)) ? P.NIGHT : P.DAY }]));
const allFrames = (pg: PuppetGen): PuppetFrame[] => _.flatMap(_.values(pg.frames), (f) => _.compact([f, f.shot2]));
const repairFrame = (f: PuppetFrame, pg: PuppetGen, line?: PuppetLine): PuppetFrame => {
  const out = repairPuppetFrameReferences(f, pg, line?.key, line?.place);
  if (line) out.speaker = line.speaker || null;
  if (out.shot2) out.shot2 = repairFrame(out.shot2, pg, line);
  return out;
};
export const buildScenesPuppet = async (script: MotionStoryScript, analysis: MotionStoryAnalysis, o: GenOptions): Promise<MotionStoryScript> => {
  const id = closedPuppetPackId(analysis.stylePreset);
  if (!id) return buildScenesPuppetImpl(script, analysis, o);
  const assets = [PUPPET_TYPES.STYLE, PUPPET_TYPES.CHARACTER, PUPPET_TYPES.SET, PUPPET_TYPES.PROP, PUPPET_TYPES.BASE, PUPPET_TYPES.PIECE].flatMap((type) => listPuppets(type));
  o.log(PACK.LOG(analysis.stylePreset || id, assets.filter((asset) => (asset.type === PUPPET_TYPES.STYLE ? asset.id === id : RT_SERVER.STYLEID in asset && asset.styleId === id)).length));
  const relevant = assets.filter((asset) => (asset.type === PUPPET_TYPES.STYLE ? asset.id === id : RT_SERVER.STYLEID in asset && asset.styleId === id));
  const accepted = relevant.filter((asset) => puppetPackAssetAllowed(asset, id)).length;
  o.log(SELECTION.INDEX_LOG(accepted, relevant.length - accepted));
  const previous = script.gen?.puppet?.selectionVersion === SELECTION.VERSION && script.gen.puppet.pack?.styleId === id ? script.gen.puppet.pack : o.readiness?.inputKey === puppetPlanReadinessKey(analysis) ? o.readiness.pack : undefined;
  return runWithPuppetPack(id, assets, () => buildScenesPuppetImpl(script, analysis, { ...o, styleReferences: [] }), previous);
};
const buildScenesPuppetImpl = async (script: MotionStoryScript, analysis: MotionStoryAnalysis, o: GenOptions): Promise<MotionStoryScript> => {
  const progress = o.progress || _.noop;
  o.log(P.LOG_START);
  const started = Date.now();
  const timed = async <X>(name: string, fn: () => Promise<X>): Promise<X> => {
    const t = Date.now();
    try {
      return await fn();
    } finally {
      o.log(P.LOG_STEP_TIME(name, (Date.now() - t) / 1000));
    }
  };
  const closed = puppetPackActive();
  const mode = closed ? LM.AUTO : puppetLibraryMode(analysis, o.styleReferences?.length || 0);
  if (!closed) o.log(P.LOG_MODE(mode));
  const fresh = mode === LM.FRESH && !o.onlyLocations?.length && !o.onlyBeats?.length;
  const mainExec = { ...(o.mainExec || o.exec), role: MOTION_AI_ROLE.MAIN };
  const drawExec = { ...o.exec, role: MOTION_AI_ROLE.DRAW };
  const ro: PuppetRunOptions = { exec: mainExec, mainExec, drawExec, signal: o.signal, log: o.log, ai: o.ai, fresh, review: o.review };
  const drawOptions: PuppetRunOptions = { ...ro, exec: drawExec };
  const referenceKey = o.styleReferences?.length
    ? createHash(P.SHA)
        .update(stringifyJson(_.map(o.styleReferences, (r) => r.dataUrl)))
        .digest(P.HEX)
    : P.EMPTY;
  analysis = bindVideoDnaSettings({ ...analysis, characterMotion: o.characterMotion === true }, { drawingMode: MR.MOTION_TEXT_2D, characterMode: MR.MOTION_TEXT_DRAWN, aspect: o.aspect || MR.MOTION_TEXT_16_9 });
  const gen = prepareMotionGen(script.gen, analysis, referenceKey + P.VARIANT_SEP + _.toString(analysis.stylePreset));
  gen.characterMotion = o.characterMotion === true;
  delete gen.board2d;
  const sceneBeats = _.filter(script.beats, (b) => b.visual === MR.MOTION_TEXT_SCENE);
  _.forEach(sceneBeats, (b) => (b.place = b.place || analysis.places[0]?.key));
  analysis = withBeatPlaces(analysis, sceneBeats, o);
  const out: MotionStoryScript = { ...script, gen };
  const emit = () => {
    if (gen.puppet && closed) gen.puppet.pack = capturePuppetPack(gen.puppet);
    o.partial?.({ ...out, gen: _.cloneDeep(gen) });
  };
  progress(0.02, P.STAGE_STYLE);
  const style = await timed(P.STEP_STYLE, () => resolvePuppetStyle(o.styleReferences || [], analysis.stylePreset, ro, { key: seriesName(analysis.title || script.title), story: _.compact([analysis.title, analysis.logline]).join(P.DASH), setting: _.compact([analysis.era, analysis.look]).join(P.DASH), genre: _.toString(analysis.videoGenre) }));
  o.log(P.LOG_STYLE(style.name, style.source));
  const prev = gen.puppet && gen.puppet.styleId === style.id && !fresh ? gen.puppet : null;
  const seriesId = newPuppetId(PUPPET_TYPES.SERIES, style.id + P.VARIANT_SEP + seriesName(analysis.title || script.title));
  const series = mode === LM.SERIES ? has<PuppetSeries>(PUPPET_TYPES.SERIES, seriesId) : null;
  const identityTitle = analysis.title || script.title;
  const originalCast = _.keyBy(analysis.cast, (c) => c.key);
  const narratorKey = motionNarratorCastKey(analysis);
  const ghostKeys = _.map(
    _.filter(analysis.cast, (c) => puppetCastIsGhost(c)),
    (c) => c.key,
  );
  if (!closed) analysis = await englishPuppetAnalysis(analysis, ro);
  const pg: PuppetGen = {
    ...(closed ? { selectionVersion: SELECTION.VERSION, sceneSelections: prev?.selectionVersion === SELECTION.VERSION ? { ...prev.sceneSelections } : {} } : {}),
    illustrationVersion: I.VERSION,
    narratorKey,
    visualContractVersion: V.VERSION,
    blockingVersion: B.VERSION,
    effectsVersion: EFFECTS.VERSION,
    version: P.VERSION,
    styleId: style.id,
    characters: { ...(prev?.characters || {}) },
    sets: _.omit({ ...(prev?.sets || {}) }, o.onlyLocations || []),
    props: { ...(prev?.props || {}) },
    places: { ...(prev?.version === P.VERSION ? prev.places : {}), ...placesOf(analysis) },
    frames: prev?.illustrationVersion === I.VERSION && prev.version === P.VERSION && prev.effectsVersion === EFFECTS.VERSION && prev.blockingVersion === B.VERSION && prev.visualContractVersion === V.VERSION ? { ...prev.frames } : {},
    reads: prev?.illustrationVersion === I.VERSION && prev.version === P.VERSION && prev.effectsVersion === EFFECTS.VERSION && prev.blockingVersion === B.VERSION && prev.visualContractVersion === V.VERSION ? { ...(prev.reads || {}) } : {},
    readDrafts: prev?.illustrationVersion === I.VERSION && prev.version === P.VERSION && prev.visualContractVersion === V.VERSION ? structuredClone(prev.readDrafts || {}) : {},
    readNormalizationVersion: prev?.readNormalizationVersion,
    placementKeys: { ...(prev?.placementKeys || {}) },
    seriesId,
  };
  const bindings = o.readiness;
  if (closed && bindings?.inputKey === puppetPlanReadinessKey(analysis) && bindings.assetKeys) {
    for (const [key, id] of Object.entries(bindings.characters)) {
      const asset = has<PuppetCharacter>(PUPPET_TYPES.CHARACTER, id);
      if (!pg.characters[key] && asset?.styleId === style.id && bindings.assetKeys[id] === puppetPlanAssetKey(asset)) pg.characters[key] = id;
    }
    for (const [key, id] of Object.entries(bindings.places)) {
      const asset = has<PuppetSet>(PUPPET_TYPES.SET, id);
      if (!pg.sets[key] && asset?.styleId === style.id && bindings.assetKeys[id] === puppetPlanAssetKey(asset)) pg.sets[key] = id;
    }
  }
  pg.ghosts = ghostKeys;
  if (closed && prev?.selectionVersion !== SELECTION.VERSION) pg.frames = {};
  pg.props = _.pickBy(pg.props, (id, key) => {
    const asset = has<PuppetProp>(PUPPET_TYPES.PROP, id);
    return (
      !!asset &&
      asset.styleId === style.id &&
      puppetPropReferenceFits(
        key,
        asset,
        Object.values(pg.reads || {})
          .flatMap(puppetReadObjects)
          .find((object) => object.key === key),
      )
    );
  });
  if (closed && bindings?.inputKey === puppetPlanReadinessKey(analysis) && bindings.assetKeys) {
    for (const [key, id] of Object.entries(bindings.props || {})) {
      const asset = has<PuppetProp>(PUPPET_TYPES.PROP, id);
      if (!pg.props[key] && asset?.styleId === style.id && bindings.assetKeys[id] === puppetPlanAssetKey(asset)) pg.props[key] = id;
    }
  }
  gen.puppet = pg;
  pg.characters = _.pickBy(pg.characters, (id) => has<PuppetCharacter>(PUPPET_TYPES.CHARACTER, id)?.styleId === style.id);
  pg.sets = _.pickBy(pg.sets, (id) => has<PuppetSet>(PUPPET_TYPES.SET, id)?.styleId === style.id);
  const sourceLines = collectPuppetLines(out, MR.MOTION_TEXT_SCENE, narratorKey);
  pg.visualInputKey = puppetVisualInputKey(sourceLines);
  const planKey = puppetStoryboardInputKey(sourceLines, analysis);
  const reusablePlan = prev?.storyboard?.inputKey === planKey && puppetStoryboardCovers(prev.storyboard, sourceLines);
  progress(0.04, SB.STAGE);
  const savePlan = (plan: NonNullable<PuppetGen["storyboard"]>): void => {
    pg.storyboard = plan;
    emit();
  };
  pg.storyboard = reusablePlan ? prev!.storyboard : await timed(SB.STAGE, () => planPuppetStoryboard(sourceLines, script.beats, analysis, { ...ro, language: script.language }, prev?.storyboard, {}, savePlan));
  let lines = puppetVisualLines(sourceLines, pg.storyboard!);
  const wantedKeys = new Set(lines.map((line) => line.key));
  pg.frames = _.pickBy(pg.frames, (_frame, key) => wantedKeys.has(key));
  pg.reads = _.pickBy(pg.reads, (_read, key) => wantedKeys.has(key));
  const redoBeats = new Set(o.onlyBeats || []);
  const why: Record<string, string> = {};
  const redoLocations = new Set(o.onlyLocations || []);
  for (const [place, id] of Object.entries(pg.sets)) {
    const set = currentPuppetSet(id);
    if (!set) {
      delete pg.sets[place];
      redoLocations.add(place);
      continue;
    }
    const key = puppetPlacementKey(set);
    if (set.id !== id || (pg.placementKeys?.[place] && pg.placementKeys[place] !== key)) redoLocations.add(place);
    pg.sets[place] = set.id;
  }
  for (const [key, frame] of Object.entries(pg.frames)) if ((frame.set && redoLocations.has(frame.set)) || (frame.shot2?.set && redoLocations.has(frame.shot2.set))) delete pg.frames[key];
  for (const b of sceneBeats)
    if (redoBeats.has(b.id))
      for (const l of lines.filter((line) => line.sourcePlans?.some((source) => source.beatId === b.id))) {
        const previousRead = pg.reads?.[l.key];
        delete pg.frames[l.key];
        delete pg.reads?.[l.key];
        if (o.note) why[l.key] = previousRead ? P.FIX_READ_BASELINE(o.note, previousRead) : o.note;
      }
  emit();
  const story = analysis.title + P.DASH + analysis.logline;
  const castNames = _.map(analysis.cast, (c) => c.name).join(P.COMMA);
  progress(0.05, P.STAGE_CAST);
  const proceduralCast = (list: typeof analysis.cast): void => {
    const colors = style.bodyColors?.length ? style.bodyColors : style.palette;
    list.forEach((c, i) => {
      const height = c.age === P.AGE_CHILD ? P.HEIGHT_CHILD : c.age === P.AGE_SENIOR ? P.HEIGHT_SENIOR : 1;
      pg.characters[c.key] = writePuppet<PuppetCharacter>({
        id: newPuppetId(PUPPET_TYPES.CHARACTER),
        type: PUPPET_TYPES.CHARACTER,
        styleId: style.id,
        name: c.name || c.key,
        originalName: originalCast[c.key]?.name,
        catalogVersion: PA.VERSION,
        role: c.role,
        ...(ghostKeys.includes(c.key) ? { humanGhostVersion: EFFECTS.HUMAN_GHOST_VERSION } : {}),
        desc: _.compact([c.name, c.role, c.look]).join(P.SEP),
        tags: _.compact([c.gender, c.age, c.role]),
        story,
        height,
        colors: { body: colors[i % colors.length] },
        head: {},
        body: {},
        sprites: {},
        uses: 0,
        updatedAt: new Date().toISOString(),
      }).id;
    });
    o.log(P.LOG_CHAR_PROCEDURAL(list.length));
  };
  const castJob = async (): Promise<void> => {
    const aliases = new Map(analysis.cast.filter((c) => ghostKeys.includes(c.key) && c.appearanceOf && c.appearanceOf !== c.key && analysis.cast.some((other) => other.key === c.appearanceOf && !other.appearanceOf)).map((c) => [c.key, c.appearanceOf!]));
    const reusable = (key: string, id: string | undefined) => {
      const character = has<PuppetCharacter>(PUPPET_TYPES.CHARACTER, id);
      return character && (!ghostKeys.includes(key) || character.humanGhostVersion === EFFECTS.HUMAN_GHOST_VERSION || (character.archetype && character.group !== P.GHOST_GROUP)) ? character : null;
    };
    let todo = _.filter(analysis.cast, (c) => {
      if (aliases.has(c.key)) return false;
      if (!fresh && reusable(c.key, pg.characters[c.key])) return false;
      const reuse = reusable(c.key, series?.characters[c.key]);
      if (!reuse) return true;
      pg.characters[c.key] = reuse.id;
      o.log(P.LOG_CHAR_REUSE(c.name));
      return false;
    });
    if (todo.length && mode !== LM.FRESH) {
      const stock = await matchArchetypes(style, todo, { ...ro, characterIds: Object.values(pg.characters) });
      for (const [k, c] of _.toPairs(stock)) pg.characters[k] = c.id;
      todo = _.filter(todo, (c) => !stock[c.key]);
    }
    if (todo.length) {
      if (closed)
        throw new Error(
          PACK.MISSING(
            PACK.CAST,
            todo.map((character) => character.name || character.key),
          ),
        );
      if (style.procedural) proceduralCast(todo);
      else {
        const drawn = await drawPuppetCharacters(style, todo, story, castNames, drawOptions);
        for (const [k, c] of _.toPairs(drawn)) pg.characters[k] = writePuppet({ ...c, ...(ghostKeys.includes(k) ? { humanGhostVersion: EFFECTS.HUMAN_GHOST_VERSION } : {}), originalName: originalCast[k]?.name, originalDesc: originalCast[k]?.look || originalCast[k]?.description, catalogVersion: PA.VERSION }).id;
      }
    }
    for (const [key, original] of aliases) if (pg.characters[original]) pg.characters[key] = pg.characters[original];
    emit();
  };
  const placeLinesOf = () => _.groupBy(lines, (l) => pg.reads?.[l.key]?.place || pg.frames[l.key]?.set || l.place);
  const hasBases = puppetBases(style.id).length > 0;
  const featuresOf = (): Record<string, string[]> => {
    const out: Record<string, string[]> = {};
    for (const r of _.values(pg.reads || {})) if (r.place) for (const place of _.uniq(_.compact([r.place, pg.places[r.place]?.visualBase]))) out[place] = _.uniq([...(out[place] || []), ...puppetSetReadFeatures([r])]);
    return out;
  };
  const drawSets = async (keys: string[]): Promise<void> => {
    const bases = _.uniq(keys.map((key) => pg.places[key]?.visualBase).filter((key): key is string => !!key && !pg.sets[key]));
    if (bases.length) {
      await drawSets(bases);
      keys = keys.filter((key) => !bases.includes(key));
    }
    const placeLines = placeLinesOf();
    const open: PuppetPlace[] = [];
    const forcedKeys: string[] = [];
    const must = featuresOf();
    const requirements = (k: string, set: PuppetSet): string[] => {
      const reads = _.values(pg.reads || {}).filter((r) => r.place === k || (closed && !!r.place && pg.places[r.place]?.visualBase === k));
      return reads.length
        ? _.uniq(
            reads.flatMap((read) => {
              const missing = puppetSetMissingRequirements(puppetSetForLight(set, read.light), [read], pg.places[k].sceneFeatures);
              if (
                closed &&
                !missing.length &&
                read.who.every((key) => !!pg.characters[key]) &&
                puppetReadObjects(read)
                  .filter((object) => puppetObjectClass(object) === PA.PROP)
                  .every((object) => !!pg.props[object.key])
              ) {
                const line = lines.find((line) => pg.reads?.[line.key] === read);
                if (line)
                  try {
                    createPuppetSceneChoices(line, read, pg, style, undefined, set);
                  } catch (error) {
                    missing.push(String((error as Error).message));
                  }
              }
              return missing;
            }),
          )
        : puppetSetMissingRequirements(set, [], pg.places[k].sceneFeatures);
    };
    const fits = (k: string, set: PuppetSet | null): boolean => {
      if (!set || set.styleId !== style.id || set.interior !== pg.places[k].interior || (closed && (set.time !== pg.places[k].time || !puppetPackSetLocationFits(pg.places[k], set))) || (set.sceneCondition || M.INTACT) !== (pg.places[k].sceneCondition || M.INTACT) || !_.isEqual(set.fixtureStates || {}, pg.places[k].fixtureStates || {}) || requirements(k, set).length) return false;
      const base = pg.places[k].visualBase;
      const original = base && has<PuppetSet>(PUPPET_TYPES.SET, pg.sets[base]);
      if (closed && original && (set.group !== original.group || !_.isEqual(set.spots, original.spots) || !_.isEqual(set.compositions, original.compositions))) return false;
      if (closed && !base) for (const read of _.values(pg.reads || {}).filter((read) => read.place && pg.places[read.place]?.visualBase === k)) if (!puppetSetWithFixtureStates(set, read.fixtureStates)) return false;
      return true;
    };
    for (const k of _.uniq(keys)) {
      const place = pg.places[k];
      if (!place) continue;
      if (closed && place.visualBase && pg.sets[place.visualBase]) {
        const original = has<PuppetSet>(PUPPET_TYPES.SET, pg.sets[place.visualBase]);
        const variant = original && puppetSetWithFixtureStates(original, place.fixtureStates);
        if (variant && fits(k, variant)) {
          pg.sets[k] = variant.id;
          continue;
        }
      }
      const forced = !closed && _.includes(o.onlyLocations || [], k);
      if (!forced && !fresh && fits(k, has<PuppetSet>(PUPPET_TYPES.SET, pg.sets[k]))) continue;
      if (closed && pg.sets[k]) o.log(CONSTRAINTS.REPLAN_LOG(place.name));
      delete pg.sets[k];
      if (forced) {
        forcedKeys.push(k);
        continue;
      }
      const reuse = currentPuppetSet(series?.sets[k]);
      if (reuse && fits(k, reuse) && !reuse.name.includes(P.VARIANT_SEP)) {
        pg.sets[k] = reuse.id;
        o.log(P.LOG_SET_REUSE(place.name, reuse.name));
        continue;
      }
      open.push(place);
    }
    const matched = mode === LM.FRESH ? {} : await matchLibrarySets(style, open, ro, seriesName(analysis.title || script.title), fits);
    for (const [k, set] of _.toPairs(matched)) {
      const lack = _.filter(must[k] || [], (f) => !puppetFeatureSpot(set.spots || [], f));
      if (!fits(k, set)) {
        o.log(Q.LOG_FEATURE_REDO(pg.places[k].name, lack.join(P.COMMA)));
        delete matched[k];
        continue;
      }
      pg.sets[k] = set.id;
      o.log(P.LOG_SET_REUSE(pg.places[k].name, set.name));
    }
    let jobs: PuppetSetJob[] = _.map(
      [
        ...forcedKeys,
        ..._.map(
          _.reject(open, (pl) => !!matched[pl.key]),
          (pl) => pl.key,
        ),
      ],
      (k) => ({
        key: k,
        place: pg.places[k],
        reference: has<PuppetSet>(PUPPET_TYPES.SET, pg.sets[pg.places[k].visualBase || P.EMPTY]),
        uses:
          B.REQUIREMENTS(
            P.SET_FEATURE_USES(P.SET_BLOCKING_USES(_.map(_.take(placeLines[k] || [], 6), (l) => l.text).join(P.SPACE), stringifyJson(puppetSetPlacementNeeds(_.values(pg.reads || {}).filter((r) => r.place === k)))), must[k] || []),
            _.values(pg.reads || {})
              .filter((r) => r.place === k && r.blocking)
              .map((r) => ({ blocking: r.blocking, states: r.states })),
          ) + (_.includes(o.onlyLocations || [], k) && o.note ? P.NL + P.FIX_PREFIX + o.note : P.EMPTY),
        validate: (set) => requirements(k, set),
      }),
    );
    if (!jobs.length) return;
    if (hasBases) {
      const built = await buildPuppetSets(
        style,
        _.map(
          jobs.filter((j) => !j.place.fixtureStates && (!j.place.sceneCondition || j.place.sceneCondition === M.INTACT)),
          (j) => ({
            place: j.place,
            must: _.uniq([...(must[j.key] || []), ...(j.place.sceneFeatures || [])]),
            placements: puppetSetPlacementNeeds(_.values(pg.reads || {}).filter((read) => read.place === j.key || pg.places[read.place || P.EMPTY]?.visualBase === j.key)),
            uses: j.uses,
            validate: (set) => (fits(j.key, set) ? [] : requirements(j.key, set).length ? requirements(j.key, set) : [PACK.SET]),
          }),
        ),
        ro,
        seriesName(identityTitle),
      );
      for (const [k, set] of _.toPairs(built)) if (fits(k, set)) pg.sets[k] = set.id;
      jobs = _.filter(jobs, (j) => !pg.sets[j.key]);
      emit();
    }
    if (!jobs.length) return;
    if (closed) {
      const failed = jobs.map((job) => {
        const candidates = listPuppets<PuppetSet>(PUPPET_TYPES.SET)
          .filter((set) => set.styleId === style.id && set.interior === job.place.interior && set.time === job.place.time && puppetPackSetLocationFits(job.place, set))
          .map((set) => ({ id: set.id, issues: requirements(job.key, set) }));
        const details = _.uniq(candidates.flatMap((candidate) => candidate.issues));
        o.log(CONSTRAINTS.ASSEMBLY_LOG(job.place.name, details.slice(0, 6)));
        return { job, candidates, details };
      });
      const first = failed[0];
      throw new MotionResourceError({ kind: PACK.SET, reason: RESOURCE.REASONS.COMBINATION, name: failed.map(({ job }) => job.place.name).join(P.COMMA), place: first.job.key, details: _.uniq(failed.flatMap((item) => item.details)).slice(0, 6), candidates: failed.flatMap((item) => item.candidates) });
    }
    const drawn = await drawPuppetSets(style, jobs, drawOptions);
    for (const [k, set] of _.toPairs(drawn)) if (fits(k, set)) pg.sets[k] = set.id;
    const missing = jobs.filter((j) => !pg.sets[j.key]).map((j) => j.key);
    if (missing.length) throw new Error(PA.SET_ERROR(missing));
    emit();
  };
  const drawn = new Map<string, string>();
  const drawSetsOnce = (keys: string[]): Promise<void> => {
    const must = featuresOf();
    const signature = (key: string) =>
      stringifyJson([
        must[key],
        pg.places[key]?.sceneFeatures,
        pg.places[key]?.desc,
        pg.places[key]?.fixtureStates,
        _.values(pg.reads || {})
          .filter((r) => r.place === key)
          .map((r) => [r.states, r.blocking, r.light, r.visual, puppetReadObjects(r)]),
      ]);
    const todo = _.filter(_.uniq(keys), (k) => drawn.get(k) !== signature(k));
    for (const k of todo) drawn.set(k, signature(k));
    return drawSets(todo);
  };
  const spotsOf = (place: string | undefined, light?: string) => {
    const base = place ? has<PuppetSet>(PUPPET_TYPES.SET, pg.sets[place]) : null;
    return puppetSpots(base ? puppetSetForLight(base, light) : null);
  };
  const composeCtx = { spots: spotsOf, spotsText: (place: string) => puppetSpotsText(place, has<PuppetSet>(PUPPET_TYPES.SET, pg.sets[place])), framing: style.framing };
  const readsOf = (todo: PuppetLine[]): PuppetRead[] => _.compact(_.map(todo, (l) => pg.reads?.[l.key]));
  const syncReadPostures = (): void => {
    const normalized = normalizePuppetReadContinuity(lines, normalizePuppetVisualState(lines, normalizePuppetSceneConditions(lines, pg.reads || {}, pg.places), pg.places, new Set(listPuppets<PuppetProp>(PUPPET_TYPES.PROP).map((prop) => prop.key)), analysis.cast));
    if (closed) for (const line of lines) if (normalized[line.key]) normalized[line.key].states = simplePuppetStates(normalized[line.key].states || [], line.text);
    for (const line of lines) if (stringifyJson(normalized[line.key]) !== stringifyJson(pg.reads?.[line.key])) delete pg.frames[line.key];
    pg.reads = normalized;
  };
  const readLines = async (todo: PuppetLine[], notes: Record<string, string>): Promise<void> => {
    const refresh = pg.readNormalizationVersion !== MOTION_PROMPT.READ_NORMALIZATION_VERSION;
    const pending = todo.filter((line) => refresh || !pg.reads?.[line.key] || !!notes[line.key]);
    if (pending.length) {
      const inventory = closed ? puppetPackReadCatalog(analysis.stylePreset) : P.EMPTY;
      await readPuppetLines(
        pending,
        lines,
        analysis,
        pg.places,
        notes,
        {
          ...ro,
          readCatalog: inventory,
          readCatalogFor: closed ? (text) => puppetPackReadCatalog(analysis.stylePreset, text) : undefined,
          readDrafts: pg.readDrafts,
          onReadDraft: (key, draft) => {
            (pg.readDrafts ||= {})[key] = draft;
            emit();
          },
        },
        (accepted) => {
          Object.assign(pg.places, accepted.newPlaces);
          pg.reads = { ...(pg.reads || {}), ...accepted.reads };
          emit();
        },
      );
    }
    pg.readNormalizationVersion = MOTION_PROMPT.READ_NORMALIZATION_VERSION;
    syncReadPostures();
    for (const read of _.values(pg.reads)) {
      if (!read.place || !pg.places[read.place]) continue;
      const scenery = puppetReadObjects(read)
        .filter(puppetObjectIsGeometry)
        .map((ob) => ob.description || ob.key);
      const place = pg.places[read.place];
      place.sceneFeatures = _.uniq([...(place.sceneFeatures || []), ...puppetReadObjects(read).filter(puppetObjectIsGeometry).map(puppetObjectCatalogKey)]);
      for (const description of scenery) if (!place.desc.includes(description)) place.desc += P.SEP + description;
    }
    emit();
  };
  progress(0.08, P.STAGE_READ);
  syncReadPostures();
  if (pg.readNormalizationVersion !== MOTION_PROMPT.READ_NORMALIZATION_VERSION) pg.frames = {};
  const todoLines = _.filter(lines, (l) => !pg.frames[l.key]);
  await timed(P.STEP_READ, () => Promise.all([readLines(todoLines, why), castJob()]));
  emit();
  const drawVariants = async (): Promise<void> => {
    if (closed) return;
    const frames = allFrames(pg);
    const variants: { k: string; want: string }[] = [];
    let tinted = 0;
    for (const k of _.keys(pg.sets)) {
      const set = has<PuppetSet>(PUPPET_TYPES.SET, pg.sets[k]);
      if (!set) continue;
      const dark = P.DARK_RE.test(set.time);
      const lights = _.uniq(
        _.compact(
          _.map(
            _.filter(frames, (f) => f.set === k),
            (f) => f.light,
          ),
        ),
      );
      if (!dark && !set.variants?.[P.NIGHT] && _.some(lights, (l) => _.includes(P.NIGHT_LIGHTS, l))) {
        if (_.includes(P.VARIANT_AI_DETAIL, style.detail)) variants.push({ k, want: P.NIGHT });
        else tinted++;
      }
      if (dark && _.some(lights, (l) => _.includes(P.DAY_LIGHTS, l))) variants.push({ k, want: P.DAY });
    }
    if (tinted) o.log(P.LOG_VARIANT_TINT(tinted));
    await mapMotionAiPool(
      variants,
      async ({ k, want }) => {
        const set = has<PuppetSet>(PUPPET_TYPES.SET, pg.sets[k]);
        if (set) await ensureSetVariant(set, want, drawOptions, style);
      },
      puppetLanes(o.exec),
    );
  };
  const drawProps = async (todoReads: PuppetRead[]): Promise<void> => {
    const objects: Record<string, PuppetObject> = {};
    for (const r of todoReads) for (const ob of puppetReadObjects(r)) if (!objects[ob.key] && puppetObjectClass(ob) === PA.PROP) objects[ob.key] = ob;
    const open: PuppetObject[] = [];
    for (const ob of _.values(objects)) {
      const existing = has<PuppetProp>(PUPPET_TYPES.PROP, pg.props[ob.key]);
      if (!fresh && existing?.styleId === style.id && puppetPropFits(ob, existing)) continue;
      delete pg.props[ob.key];
      const reuse = has<PuppetProp>(PUPPET_TYPES.PROP, series?.props[ob.key]);
      if (reuse?.styleId === style.id && puppetPropFits(ob, reuse)) pg.props[ob.key] = reuse.id;
      else open.push(ob);
    }
    const matched = mode === LM.AUTO && open.length ? await matchLibraryProps(style, open, ro) : {};
    for (const [k, p] of _.toPairs(matched)) pg.props[k] = p.id;
    const todo = _.map(
      _.filter(open, (ob) => !matched[ob.key]),
      (ob) => ob.key,
    );
    if (closed && todo.length) throw new MotionResourceError({ kind: PACK.PROP, reason: RESOURCE.REASONS.MISSING, name: todo.map((key) => objects[key].word || key).join(P.COMMA), details: todo.map((key) => [puppetObjectCatalogKey(objects[key]), ...(objects[key].requirements || [])].join(P.SEP)) });
    const notes = _.mapValues(objects, (ob) => ob.note);
    const setting = _.compact([analysis.era, analysis.look, analysis.title]).join(P.DASH);
    await mapMotionAiPool(
      _.chunk(todo, P.PROPS_PER_CALL),
      async (group) => {
        const made = await drawPuppetProps(style, group, notes, setting, drawOptions, objects);
        for (const [k, p] of _.toPairs(made)) pg.props[k] = p.id;
        emit();
      },
      puppetLanes(o.exec),
    );
  };
  const drawSprites = async (): Promise<void> => {
    if (closed) return;
    if (style.procedural) return;
    const posed = _.uniq(
      _.flatMap(allFrames(pg), (f) =>
        _.map(
          _.filter(f.actors, (a) => _.includes(P.SPRITES, a.pose)),
          (a) => a.char,
        ),
      ),
    );
    const todo = _.compact(_.map(posed, (k) => has<PuppetCharacter>(PUPPET_TYPES.CHARACTER, pg.characters[k]))).filter((c) => !_.size(c.sprites) && !!c.head?.front);
    if (!todo.length) return;
    o.log(P.LOG_SPRITES(_.map(todo, (c) => c.name)));
    await mapMotionAiPool(todo, (c) => drawPuppetSprites(style, c, drawOptions), puppetLanes(o.exec));
  };
  const castExtras = (todoReads: PuppetRead[]): void => {
    if (mode === LM.FRESH) return;
    const keys = _.uniq(
      _.filter(
        _.flatMap(todoReads, (r) => r.who),
        (k) => P.EXTRA_RE.test(k) && !pg.characters[k],
      ),
    );
    const stock = stockExtras(style.id, keys, _.values(pg.characters), seriesName(analysis.title || script.title));
    for (const [k, c] of _.toPairs(stock)) pg.characters[k] = c.id;
    if (_.size(stock)) o.log(P.LOG_EXTRAS(_.size(stock)));
  };
  const carryWear = (): void => {
    if (closed) return;
    for (const chapter of _.values(_.groupBy(lines, (l) => l.chapterId))) {
      const worn: Record<string, string[]> = {};
      const apply = (f: PuppetFrame): PuppetFrame => {
        for (const a of f.actors) worn[a.char] = _.difference(_.uniq([...(worn[a.char] || []), ...(a.wear || [])]), a.removeWear || []);
        return { ...f, actors: _.map(f.actors, (a) => (worn[a.char] ? { ...a, wear: worn[a.char] } : a)), shot2: f.shot2 ? apply(f.shot2) : f.shot2 };
      };
      for (const l of chapter) if (pg.frames[l.key]) pg.frames[l.key] = apply(pg.frames[l.key]);
    }
  };
  const changedSoundBeats = new Set<string>();
  const directLines = async (todo: PuppetLine[], notes: Record<string, string>, base: number): Promise<void> => {
    if (!todo.length) return;
    for (const line of todo) for (const source of line.sourcePlans || [{ beatId: line.beatId }]) changedSoundBeats.add(source.beatId);
    const todoReads = readsOf(todo);
    progress(base, P.STAGE_ASSETS);
    castExtras(todoReads);
    await Promise.all([timed(P.STEP_SETS, () => drawSetsOnce(_.compact([..._.map(todoReads, (r) => r.place), ..._.map(todo, (l) => l.place)]))), timed(P.STEP_PROPS, () => drawProps(todoReads))]);
    progress(base + 0.1, P.STAGE_COMPOSE);
    Object.assign(pg.frames, await timed(P.STEP_COMPOSE, () => (closed ? composePuppetPackLines(todo, lines, pg, style, notes, drawOptions, emit) : composePuppetLines(todo, lines, analysis, pg.reads || {}, notes, composeCtx, drawOptions))));
    carryWear();
    if (!closed) pg.frames = normalizePuppetFrameContinuity(lines, pg.frames, pg.reads || {}, spotsOf);
    emit();
    progress(base + 0.15, P.STAGE_ASSETS);
    if (!closed) await timed(P.STEP_VARIANTS, () => Promise.all([drawVariants(), drawSprites()]));
    const byKey = _.keyBy(lines, (l) => l.key);
    if (!closed) pg.frames = _.mapValues(pg.frames, (f, k) => repairFrame(f, pg, byKey[k]));
    emit();
  };
  if (closed) {
    o.log(PACK.PREFLIGHT);
    castExtras(_.values(pg.reads || {}));
    for (let attempt = 0; ; attempt++) {
      progress(0.15, PROGRESS.STAGE.ASSEMBLE);
      o.log(PROGRESS.SCOPE(PROGRESS.STAGE.ASSEMBLE, I.ASSEMBLY_START));
      try {
        await drawProps(_.values(pg.reads || {}));
        await drawSetsOnce(_.uniq(_.compact(lines.flatMap((line) => [pg.reads?.[line.key]?.place, line.place]))));
        for (const line of lines) createPuppetSceneChoices(line, pg.reads![line.key], pg, style);
        o.log(PROGRESS.SCOPE(PROGRESS.STAGE.ASSEMBLE, I.ASSEMBLY_DONE));
        break;
      } catch (error) {
        o.log(PROGRESS.SCOPE(PROGRESS.STAGE.ASSEMBLE, I.PREFLIGHT_ERROR(String((error as Error).message))));
        if (o.signal?.aborted || isTerminalMotionAiError(error, o.signal) || attempt >= I.PREFLIGHT_REPAIRS || (isMotionResourceError(error) && error.diagnostic.kind !== PACK.SET)) throw error;
        const affected = lines.filter((line) => {
          const read = pg.reads?.[line.key];
          const place = read && pg.places[read.place || line.place || P.EMPTY];
          if (!read?.blocking || !place) return false;
          return listPuppets<PuppetSet>(PUPPET_TYPES.SET).some((candidate) => {
            if (candidate.styleId !== style.id || candidate.interior !== place.interior || candidate.time !== place.time || !puppetPackSetLocationFits(place, candidate) || (candidate.sceneCondition || M.INTACT) !== (place.sceneCondition || M.INTACT)) return false;
            const set = puppetSetWithFixtureStates(candidate, place.fixtureStates);
            if (!set || puppetSetMissingRequirements(set, [{ ...read, blocking: undefined }], place.sceneFeatures).length || !puppetSetMissingRequirements(set, [read], place.sceneFeatures).length) return false;
            try {
              return createPuppetSceneChoices(line, { ...read, blocking: undefined }, pg, style, undefined, set).length > 0;
            } catch {
              return false;
            }
          });
        });
        if (!affected.length) throw error;
        o.log(I.PREFLIGHT_REPAIR_LOG(attempt + 1, affected.length));
        const notes = Object.fromEntries(affected.map((line) => [line.key, ([I.PREFLIGHT_REPAIR, String((error as Error).message), stringifyJson(pg.reads?.[line.key])] as string[]).join(P.NL)]));
        progress(0.15, PROGRESS.STAGE.READ);
        await readLines(affected, notes);
        drawn.clear();
      }
    }
    for (const key of Object.keys(pg.frames)) {
      try {
        assertPuppetSceneSelection(pg, key);
      } catch {
        delete pg.frames[key];
      }
    }
    pg.sceneSelections = _.pickBy(pg.sceneSelections, (_selection, key) => !!pg.frames[key]);
    emit();
  }
  await directLines(
    lines.filter((line) => !pg.frames[line.key]),
    why,
    0.25,
  );
  compileStorySpec(out, analysis, { aspect: o.aspect || MR.MOTION_TEXT_16_9 });
  const sheetOf = async (): Promise<Awaited<ReturnType<typeof puppetSheet>>> => {
    try {
      const { spec } = compileStorySpec(out, analysis, { aspect: o.aspect || MR.MOTION_TEXT_16_9, voiceTrack: out.voiceTrack, durations: out.voiceTrack?.durations });
      const sheet = await puppetSheet(spec, lines, false, pg.reads);
      const covered = new Set(sheet.flatMap((item) => item.lines));
      const missing = lines.filter((line) => !covered.has(line.key));
      if (missing.length) throw new Error(V.SHEET_MISSING(missing.map((line) => line.key)));
      pg.sheet = _.map(sheet, (it) => ({ t: it.t, text: it.text, file: it.file, lines: it.lines }));
      o.log(P.LOG_SHEET(sheet.length));
      return sheet;
    } catch (e: any) {
      if (o.signal?.aborted) throw e;
      o.log(P.LOG_SHEET_FAIL(String(e?.message || e)));
      throw e;
    }
  };
  progress(0.6, P.STAGE_QA);
  let sheet = o.review === false && o.previews === false ? [] : await timed(P.STEP_SHEET, sheetOf);
  o.log(o.review === false ? I.REVIEW_OFF : I.REVIEW_ON);
  if (o.review === false) pg.visualIssues = {};
  for (let attempt = 0; o.review !== false && sheet.length && !o.signal?.aborted; attempt++) {
    const replan = new Set<string>();
    const bad = await timed(P.STEP_QA, () => qaPuppet(sheet, analysis, { ...ro, replan: (keys) => keys.forEach((key) => replan.add(key)) }));
    pg.visualIssues = bad;
    emit();
    const redo = _.filter(lines, (l) => !!bad[l.key]);
    if (!redo.length) break;
    for (const l of redo) pg.frames[l.key] = { ...pg.frames[l.key], why: bad[l.key] };
    emit();
    if (attempt >= V.QA_REPAIRS) throw new Error(V.QA_UNRESOLVED(redo.length));
    o.log(V.QA_REPAIR_LOG(attempt + 1, redo.length));
    if (replan.size) {
      pg.storyboard = await timed(SB.STAGE, () => planPuppetStoryboard(sourceLines, script.beats, analysis, { ...ro, language: script.language }, pg.storyboard, Object.fromEntries([...replan].map((key) => [key, bad[key]])), savePlan));
      lines = puppetVisualLines(sourceLines, pg.storyboard);
      const keys = new Set(lines.map((line) => line.key));
      pg.frames = _.pickBy(pg.frames, (_frame, key) => keys.has(key) && !bad[key]);
      pg.reads = _.pickBy(pg.reads, (_read, key) => keys.has(key) && !bad[key]);
    }
    await readLines(
      lines.filter((line) => !!bad[line.key] || !pg.frames[line.key]),
      bad,
    );
    await directLines(
      lines.filter((line) => !!bad[line.key] || !pg.frames[line.key]),
      bad,
      0.66,
    );
    sheet = await sheetOf();
  }
  o.signal?.throwIfAborted();
  if (o.prepareAudio) o.audioDirection = o.prepareAudio(out);
  if (o.resolveVoice) {
    out.voiceTrack = await o.resolveVoice();
    if (o.previews !== false || o.review !== false) sheet = await timed(P.STEP_SHEET, sheetOf);
  }
  emit();
  progress(0.8, P.STAGE_SOUND);
  for (const beat of out.beats) if (changedSoundBeats.has(beat.id) && beat.data) delete beat.data[P.SOUND_FLAG];
  if (o.sfx !== false)
    await timed(P.STEP_SOUND, async () => {
      try {
        await directPuppetSound(out, analysis, pg, { ...ro, direction: await o.audioDirection, onAccepted: emit });
      } catch (error) {
        if (o.signal?.aborted) throw error;
      }
    });
  const old = has<PuppetSeries>(PUPPET_TYPES.SERIES, seriesId);
  const validProps = _.pickBy({ ...(old?.props || {}), ...pg.props }, (id, key) => {
    const asset = has<PuppetProp>(PUPPET_TYPES.PROP, id);
    return (
      !!asset &&
      asset.styleId === style.id &&
      puppetPropReferenceFits(
        key,
        asset,
        Object.values(pg.reads || {})
          .flatMap(puppetReadObjects)
          .find((object) => object.key === key),
      )
    );
  });
  writePuppet<PuppetSeries>({ id: seriesId, type: PUPPET_TYPES.SERIES, styleId: style.id, name: identityTitle, characters: { ...(old?.characters || {}), ...pg.characters }, sets: { ...(old?.sets || {}), ...pg.sets }, props: validProps, updatedAt: new Date().toISOString() });
  const missing = _.filter(lines, (l) => !pg.frames[l.key]).length;
  pg.report = { frames: _.size(pg.frames), characters: _.size(pg.characters), sets: _.size(pg.sets), props: _.size(pg.props), missing };
  pg.placementKeys = _.mapValues(pg.sets, (id) => {
    const set = has<PuppetSet>(PUPPET_TYPES.SET, id);
    return set ? puppetPlacementKey(set) : P.EMPTY;
  });
  o.log(P.LOG_DONE(pg.report.frames, pg.report.characters, pg.report.sets, pg.report.props));
  o.log(P.LOG_STEP_TIME(P.STEP_TOTAL, (Date.now() - started) / 1000));
  gen.failed = [];
  gen.soundPlanVersion = MOTION_SOUND_CONFIG.VERSION;
  gen.updatedAt = new Date().toISOString();
  emit();
  progress(1, MR.MOTION_TEXT_DONE);
  return out;
};
