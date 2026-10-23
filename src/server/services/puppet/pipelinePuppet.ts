import _ from "lodash";
import { PA } from "../../../constants/motionPuppetAssets.js";
import { puppetObjectClass, puppetPropReferenceFits, puppetPropFits } from "../../../lib/motionPuppetAssets.js";
import { englishPuppetAnalysis } from "./assetProfiles.js";
import { createHash } from "crypto";
import { PUPPET as P, PUPPET_LIBRARY_MODES as LM, PUPPET_TYPES } from "../../../constants/motionPuppet.js";
import { MOTION_SOUND_CONFIG } from "../../../constants/motionSound.js";
import * as MR from "../../../constants/motionRuntime.js";
import { bindVideoDnaSettings } from "../../../lib/motionVideoDna.js";
import { collectPuppetLines, puppetBeatLines, puppetLibraryMode, type PuppetLine } from "../../../lib/motionPuppet.js";
import { motionNarratorCastKey } from "../../../lib/motionVoice.js";
import type { MotionStoryAnalysis, MotionStoryScript } from "../../../types/motionVideo.js";
import type { PuppetCharacter, PuppetFrame, PuppetGen, PuppetObject, PuppetPlace, PuppetProp, PuppetRead, PuppetSeries, PuppetSet } from "../../../types/motionPuppet.js";
import { compileStorySpec } from "../motionDirectorService.js";
import { prepareMotionGen, withBeatPlaces, type GenOptions } from "./genState.js";
import { mapMotionAiPool } from "../motionStoryService.js";
import { composePuppetLines, puppetFeatureSpot, puppetReadObjects, readPuppetLines } from "./director.js";
import { normalizePuppetReadContinuity } from "./readContinuity.js";
import { puppetSetMissingRequirements, puppetSpots, puppetSpotsText } from "./layout.js";
import { buildPuppetSets, puppetBases } from "./setComposer.js";
import { PUPPET_SET as Q } from "../../../constants/motionPuppetSets.js";
import { drawPuppetCharacters, drawPuppetProps, drawPuppetSets, drawPuppetSprites, ensureSetVariant, matchArchetypes, matchLibraryProps, matchLibrarySets, puppetCastIsGhost, puppetLanes, stockExtras, type PuppetSetJob } from "./kitDraw.js";
import { newPuppetId, readPuppet, writePuppet } from "./kitLibrary.js";
import { puppetSheet, qaPuppet } from "./qa.js";
import { directPuppetSound } from "./sound.js";
import { resolvePuppetStyle, type PuppetRunOptions } from "./stylePack.js";
const seriesName = (title: string): string => _.trim(_.toString(title).replace(P.SERIES_STRIP_RE, P.EMPTY)).toLowerCase();
const has = <T>(type: Parameters<typeof readPuppet>[0], id?: string): T | null => (id ? (readPuppet(type, id) as T | null) : null);
const placesOf = (analysis: MotionStoryAnalysis): Record<string, PuppetPlace> => _.fromPairs(_.map(analysis.places, (p) => [p.key, { key: p.key, name: p.name || p.key, desc: _.truncate(p.description || p.name || p.key, { length: 260 }), interior: p.interior ?? P.INTERIOR_RE.test(p.key), time: P.DARK_RE.test(_.toString(p.time)) ? P.NIGHT : P.DAY }]));
const allFrames = (pg: PuppetGen): PuppetFrame[] => _.flatMap(_.values(pg.frames), (f) => _.compact([f, f.shot2]));
const repairFrame = (f: PuppetFrame, pg: PuppetGen, line?: PuppetLine): PuppetFrame => {
  const out = { ...f };
  if (line) out.speaker = line.speaker || null;
  if (out.set && !pg.sets[out.set]) out.set = line?.place && pg.sets[line.place] ? line.place : undefined;
  if (out.prop && !pg.props[out.prop]) {
    out.prop = null;
    if (_.includes(P.SHOT_PROP, out.shot)) out.shot = out.actors.length ? P.SHOT_DEFAULT : P.SHOT_ESTABLISHING;
  }
  out.items = out.items?.filter((it) => !!pg.props[it.prop]);
  if (out.shot2) out.shot2 = repairFrame(out.shot2, pg, line);
  return out;
};
export const buildScenesPuppet = async (script: MotionStoryScript, analysis: MotionStoryAnalysis, o: GenOptions): Promise<MotionStoryScript> => {
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
  const mode = puppetLibraryMode(analysis, o.styleReferences?.length || 0);
  o.log(P.LOG_MODE(mode));
  const fresh = mode === LM.FRESH && !o.onlyLocations?.length && !o.onlyBeats?.length;
  const ro: PuppetRunOptions = { exec: o.exec, signal: o.signal, log: o.log, ai: o.ai, fresh };
  const referenceKey = o.styleReferences?.length
    ? createHash(P.SHA)
        .update(JSON.stringify(_.map(o.styleReferences, (r) => r.dataUrl)))
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
  const emit = () => o.partial?.({ ...out, gen: _.cloneDeep(gen) });
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
  analysis = await englishPuppetAnalysis(analysis, ro);
  const pg: PuppetGen = {
    version: P.VERSION,
    styleId: style.id,
    characters: { ...(prev?.characters || {}) },
    sets: _.omit({ ...(prev?.sets || {}) }, o.onlyLocations || []),
    props: { ...(prev?.props || {}) },
    places: { ...(prev?.version === P.VERSION ? prev.places : {}), ...placesOf(analysis) },
    frames: prev?.version === P.VERSION ? { ...prev.frames } : {},
    reads: prev?.version === P.VERSION ? { ...(prev.reads || {}) } : {},
    seriesId,
  };
  pg.ghosts = ghostKeys;
  pg.props = _.pickBy(pg.props, (id, key) => {
    const asset = has<PuppetProp>(PUPPET_TYPES.PROP, id);
    return !!asset && asset.styleId === style.id && puppetPropReferenceFits(key, asset);
  });
  gen.puppet = pg;
  const lines = collectPuppetLines(out, MR.MOTION_TEXT_SCENE, narratorKey);
  const redoBeats = new Set(o.onlyBeats || []);
  const why: Record<string, string> = {};
  for (const b of sceneBeats)
    if (redoBeats.has(b.id))
      for (const l of puppetBeatLines(b, narratorKey)) {
        delete pg.frames[l.key];
        delete pg.reads?.[l.key];
        if (o.note) why[l.key] = o.note;
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
    let todo = _.filter(analysis.cast, (c) => {
      if (!fresh && has<PuppetCharacter>(PUPPET_TYPES.CHARACTER, pg.characters[c.key])) return false;
      const reuse = has<PuppetCharacter>(PUPPET_TYPES.CHARACTER, series?.characters[c.key]);
      if (!reuse) return true;
      pg.characters[c.key] = reuse.id;
      o.log(P.LOG_CHAR_REUSE(c.name));
      return false;
    });
    if (todo.length && mode !== LM.FRESH) {
      const stock = await matchArchetypes(style, todo, ro);
      for (const [k, c] of _.toPairs(stock)) pg.characters[k] = c.id;
      todo = _.filter(todo, (c) => !stock[c.key]);
    }
    if (!todo.length) return emit();
    if (style.procedural) return proceduralCast(todo);
    const drawn = await drawPuppetCharacters(style, todo, story, castNames, ro);
    for (const [k, c] of _.toPairs(drawn)) pg.characters[k] = writePuppet({ ...c, originalName: originalCast[k]?.name, originalDesc: originalCast[k]?.look || originalCast[k]?.description, catalogVersion: PA.VERSION }).id;
    emit();
  };
  const placeLinesOf = () => _.groupBy(lines, (l) => pg.reads?.[l.key]?.place || pg.frames[l.key]?.set || l.place);
  const hasBases = puppetBases(style.id).length > 0;
  const featuresOf = (): Record<string, string[]> => {
    const out: Record<string, string[]> = {};
    for (const r of _.values(pg.reads || {}))
      if (r.place)
        out[r.place] = _.uniq([
          ...(out[r.place] || []),
          ...puppetReadObjects(r)
            .filter((ob) => _.includes(P.ANCHORED_FEATURE_TYPES, ob.type) || (ob.type === P.WALL_TYPE && ob.category !== PA.SCENE_FEATURE))
            .map((ob) => ob.key),
          ..._.compact((r.states || []).map((s) => s.support)),
        ]);
    return out;
  };
  const drawSets = async (keys: string[]): Promise<void> => {
    const placeLines = placeLinesOf();
    const open: PuppetPlace[] = [];
    const forcedKeys: string[] = [];
    const must = featuresOf();
    const requirements = (k: string, set: PuppetSet): string[] =>
      puppetSetMissingRequirements(
        set,
        _.values(pg.reads || {}).filter((r) => r.place === k),
        pg.places[k].sceneFeatures,
      );
    const fits = (k: string, set: PuppetSet | null): boolean => !!set && set.styleId === style.id && set.interior === pg.places[k].interior && !requirements(k, set).length;
    for (const k of _.uniq(keys)) {
      const place = pg.places[k];
      if (!place) continue;
      const forced = _.includes(o.onlyLocations || [], k);
      if (!forced && !fresh && fits(k, has<PuppetSet>(PUPPET_TYPES.SET, pg.sets[k]))) continue;
      delete pg.sets[k];
      if (forced) {
        forcedKeys.push(k);
        continue;
      }
      const reuse = has<PuppetSet>(PUPPET_TYPES.SET, series?.sets[k]);
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
        uses: P.SET_FEATURE_USES(
          P.SET_BLOCKING_USES(
            _.map(_.take(placeLines[k] || [], 6), (l) => l.text).join(P.SPACE),
            JSON.stringify(
              _.uniqBy(
                _.values(pg.reads || {})
                  .filter((r) => r.place === k)
                  .map((r) => r.states || []),
                (states) => JSON.stringify(states),
              ),
            ),
          ),
          must[k] || [],
        ),
        validate: (set) => requirements(k, set),
      }),
    );
    if (!jobs.length) return;
    if (hasBases) {
      const built = await buildPuppetSets(
        style,
        _.map(jobs, (j) => ({ place: j.place, must: _.uniq([...(must[j.key] || []), ...(j.place.sceneFeatures || [])]), uses: j.uses })),
        ro,
        seriesName(identityTitle),
      );
      for (const [k, set] of _.toPairs(built)) if (fits(k, set)) pg.sets[k] = set.id;
      jobs = _.filter(jobs, (j) => !pg.sets[j.key]);
      emit();
    }
    if (!jobs.length) return;
    const drawn = await drawPuppetSets(style, jobs, ro);
    for (const [k, set] of _.toPairs(drawn)) if (fits(k, set)) pg.sets[k] = set.id;
    const missing = jobs.filter((j) => !pg.sets[j.key]).map((j) => j.key);
    if (missing.length) throw new Error(PA.SET_ERROR(missing));
    emit();
  };
  const drawn = new Map<string, string>();
  const drawSetsOnce = (keys: string[]): Promise<void> => {
    const must = featuresOf();
    const signature = (key: string) =>
      JSON.stringify([
        must[key],
        pg.places[key]?.sceneFeatures,
        pg.places[key]?.desc,
        _.values(pg.reads || {})
          .filter((r) => r.place === key)
          .map((r) => r.states),
      ]);
    const todo = _.filter(_.uniq(keys), (k) => drawn.get(k) !== signature(k));
    for (const k of todo) drawn.set(k, signature(k));
    return drawSets(todo);
  };
  const spotsOf = (place: string | undefined) => puppetSpots(place ? has<PuppetSet>(PUPPET_TYPES.SET, pg.sets[place]) : null);
  const composeCtx = { spots: spotsOf, spotsText: (place: string) => puppetSpotsText(place, has<PuppetSet>(PUPPET_TYPES.SET, pg.sets[place])), framing: style.framing };
  const readsOf = (todo: PuppetLine[]): PuppetRead[] => _.compact(_.map(todo, (l) => pg.reads?.[l.key]));
  const syncReadPostures = (): void => {
    const normalized = normalizePuppetReadContinuity(lines, pg.reads || {});
    for (const line of lines) if (JSON.stringify(normalized[line.key]) !== JSON.stringify(pg.reads?.[line.key])) delete pg.frames[line.key];
    pg.reads = normalized;
  };
  const readLines = async (todo: PuppetLine[], notes: Record<string, string>): Promise<void> => {
    const pending = todo.filter((line) => !pg.reads?.[line.key] || !!notes[line.key]);
    if (pending.length) {
      const r = await readPuppetLines(pending, lines, analysis, pg.places, notes, ro);
      Object.assign(pg.places, r.newPlaces);
      pg.reads = { ...(pg.reads || {}), ...r.reads };
    }
    syncReadPostures();
    for (const read of _.values(pg.reads)) {
      if (!read.place || !pg.places[read.place]) continue;
      const scenery = puppetReadObjects(read)
        .filter((ob) => ob.type === PA.SCENERY || (ob.type === P.WALL_TYPE && ob.category === PA.SCENE_FEATURE))
        .map((ob) => ob.description || ob.key);
      const place = pg.places[read.place];
      place.sceneFeatures = _.uniq([
        ...(place.sceneFeatures || []),
        ...puppetReadObjects(read)
          .filter((ob) => ob.type === PA.SCENERY || (ob.type === P.WALL_TYPE && ob.category === PA.SCENE_FEATURE))
          .map((ob) => ob.key),
      ]);
      for (const description of scenery) if (!place.desc.includes(description)) place.desc += P.SEP + description;
    }
    emit();
  };
  progress(0.08, P.STAGE_READ);
  syncReadPostures();
  const todoLines = _.filter(lines, (l) => !pg.frames[l.key]);
  await timed(P.STEP_READ, () => Promise.all([readLines(todoLines, why), castJob()]));
  emit();
  const drawVariants = async (): Promise<void> => {
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
        if (set) await ensureSetVariant(set, want, ro, style);
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
    const notes = _.mapValues(objects, (ob) => ob.note);
    const setting = _.compact([analysis.era, analysis.look, analysis.title]).join(P.DASH);
    await mapMotionAiPool(
      _.chunk(todo, P.PROPS_PER_CALL),
      async (group) => {
        const made = await drawPuppetProps(style, group, notes, setting, ro, objects);
        for (const [k, p] of _.toPairs(made)) pg.props[k] = p.id;
        emit();
      },
      puppetLanes(o.exec),
    );
  };
  const drawSprites = async (): Promise<void> => {
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
    await mapMotionAiPool(todo, (c) => drawPuppetSprites(style, c, ro), puppetLanes(o.exec));
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
    for (const chapter of _.values(_.groupBy(lines, (l) => l.chapterId))) {
      const worn: Record<string, string[]> = {};
      const apply = (f: PuppetFrame): PuppetFrame => {
        for (const a of f.actors) worn[a.char] = _.difference(_.uniq([...(worn[a.char] || []), ...(a.wear || [])]), a.removeWear || []);
        return { ...f, actors: _.map(f.actors, (a) => (worn[a.char] ? { ...a, wear: worn[a.char] } : a)), shot2: f.shot2 ? apply(f.shot2) : f.shot2 };
      };
      for (const l of chapter) if (pg.frames[l.key]) pg.frames[l.key] = apply(pg.frames[l.key]);
    }
  };
  const directLines = async (todo: PuppetLine[], notes: Record<string, string>, base: number): Promise<void> => {
    if (!todo.length) return;
    const todoReads = readsOf(todo);
    progress(base, P.STAGE_ASSETS);
    castExtras(todoReads);
    await Promise.all([timed(P.STEP_SETS, () => drawSetsOnce(_.compact([..._.map(todoReads, (r) => r.place), ..._.map(todo, (l) => l.place)]))), timed(P.STEP_PROPS, () => drawProps(todoReads))]);
    progress(base + 0.1, P.STAGE_COMPOSE);
    Object.assign(pg.frames, await timed(P.STEP_COMPOSE, () => composePuppetLines(todo, lines, analysis, pg.reads || {}, notes, composeCtx, ro)));
    carryWear();
    emit();
    progress(base + 0.15, P.STAGE_ASSETS);
    await timed(P.STEP_VARIANTS, () => Promise.all([drawVariants(), drawSprites()]));
    const byKey = _.keyBy(lines, (l) => l.key);
    pg.frames = _.mapValues(pg.frames, (f, k) => repairFrame(f, pg, byKey[k]));
    emit();
  };
  await directLines(todoLines, why, 0.25);
  const soundJob = (async () => directPuppetSound(out, analysis, pg, { ...ro, direction: await o.audioDirection }))().catch((e) => {
    if (o.signal?.aborted) throw e;
  });
  soundJob.catch(_.noop);
  const sheetOf = async (): Promise<Awaited<ReturnType<typeof puppetSheet>>> => {
    try {
      const { spec } = compileStorySpec(out, analysis, { aspect: o.aspect || MR.MOTION_TEXT_16_9 });
      const sheet = await puppetSheet(spec, lines, true);
      pg.sheet = _.map(sheet, (it) => ({ t: it.t, text: it.text, file: it.file }));
      o.log(P.LOG_SHEET(sheet.length));
      return sheet;
    } catch (e: any) {
      if (o.signal?.aborted) throw e;
      o.log(P.LOG_SHEET_FAIL(String(e?.message || e)));
      return [];
    }
  };
  progress(0.6, P.STAGE_QA);
  try {
    let sheet = await timed(P.STEP_SHEET, sheetOf);
    if (o.review !== false && sheet.length && !o.signal?.aborted) {
      const bad = await timed(P.STEP_QA, () => qaPuppet(sheet, analysis, ro)).catch((e: any) => {
        if (o.signal?.aborted) throw e;
        o.log(P.LOG_QA_FAIL(String(e?.message || e)));
        return {} as Record<string, string>;
      });
      const redo = _.filter(lines, (l) => !!bad[l.key]);
      if (redo.length) {
        for (const l of redo) pg.frames[l.key] = { ...pg.frames[l.key], why: bad[l.key] };
        await readLines(redo, bad);
        await directLines(redo, bad, 0.66);
        sheet = await sheetOf();
      }
    }
  } catch (error) {
    await soundJob.catch(_.noop);
    throw error;
  }
  emit();
  progress(0.8, P.STAGE_SOUND);
  await timed(P.STEP_SOUND, () => soundJob);
  const old = has<PuppetSeries>(PUPPET_TYPES.SERIES, seriesId);
  const validProps = _.pickBy({ ...(old?.props || {}), ...pg.props }, (id, key) => {
    const asset = has<PuppetProp>(PUPPET_TYPES.PROP, id);
    return !!asset && asset.styleId === style.id && puppetPropReferenceFits(key, asset);
  });
  writePuppet<PuppetSeries>({ id: seriesId, type: PUPPET_TYPES.SERIES, styleId: style.id, name: identityTitle, characters: { ...(old?.characters || {}), ...pg.characters }, sets: { ...(old?.sets || {}), ...pg.sets }, props: validProps, updatedAt: new Date().toISOString() });
  const missing = _.filter(lines, (l) => !pg.frames[l.key]).length;
  pg.report = { frames: _.size(pg.frames), characters: _.size(pg.characters), sets: _.size(pg.sets), props: _.size(pg.props), missing };
  o.log(P.LOG_DONE(pg.report.frames, pg.report.characters, pg.report.sets, pg.report.props));
  o.log(P.LOG_STEP_TIME(P.STEP_TOTAL, (Date.now() - started) / 1000));
  gen.failed = [];
  gen.soundPlanVersion = MOTION_SOUND_CONFIG.VERSION;
  gen.updatedAt = new Date().toISOString();
  emit();
  progress(1, MR.MOTION_TEXT_DONE);
  return out;
};
