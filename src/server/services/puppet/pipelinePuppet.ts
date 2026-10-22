import _ from "lodash";
import { createHash } from "crypto";
import { PUPPET as P, PUPPET_LIBRARY_MODES as LM, PUPPET_TYPES } from "../../../constants/motionPuppet.js";
import { MOTION_SOUND_CONFIG } from "../../../constants/motionSound.js";
import * as MR from "../../../constants/motionRuntime.js";
import { bindVideoDnaSettings } from "../../../lib/motionVideoDna.js";
import { collectPuppetLines, puppetBeatLines, puppetLibraryMode, type PuppetLine } from "../../../lib/motionPuppet.js";
import type { MotionStoryAnalysis, MotionStoryScript } from "../../../types/motionVideo.js";
import type { PuppetCharacter, PuppetFrame, PuppetGen, PuppetObject, PuppetPlace, PuppetProp, PuppetRead, PuppetSeries, PuppetSet } from "../../../types/motionPuppet.js";
import { compileStorySpec } from "../motionDirectorService.js";
import { prepareMotionGen, withBeatPlaces, type GenOptions } from "./genState.js";
import { mapMotionAiPool, releaseMotionAiSession } from "../motionStoryService.js";
import { composePuppetLines, puppetFeatureSpot, readPuppetLines } from "./director.js";
import { puppetSpots, puppetSpotsText } from "./layout.js";
import { buildPuppetSets, puppetBases } from "./setComposer.js";
import { PUPPET_SET as Q } from "../../../constants/motionPuppetSets.js";
import { drawPuppetCharacters, drawPuppetProps, drawPuppetSets, drawPuppetSprites, ensureSetVariant, matchArchetypes, matchLibraryProps, matchLibrarySets, puppetCastIsGhost, puppetLanes, stockExtras, type PuppetSetJob } from "./kitDraw.js";
import { newPuppetId, readPuppet, writePuppet } from "./kitLibrary.js";
import { puppetSheet, qaPuppet } from "./qa.js";
import { directPuppetSound } from "./sound.js";
import { resolvePuppetStyle, type PuppetRunOptions } from "./stylePack.js";

const seriesName = (title: string): string => _.trim(_.toString(title).replace(P.SERIES_STRIP_RE, P.EMPTY)).toLowerCase();
const has = <T>(type: Parameters<typeof readPuppet>[0], id?: string): T | null => (id ? (readPuppet(type, id) as T | null) : null);

const placesOf = (analysis: MotionStoryAnalysis): Record<string, PuppetPlace> =>
  _.fromPairs(
    _.map(analysis.places, (p) => [p.key, { key: p.key, name: p.name || p.key, desc: _.truncate(p.description || p.name || p.key, { length: 260 }), interior: p.interior ?? P.INTERIOR_RE.test(p.key), time: P.DARK_RE.test(_.toString(p.time)) ? P.NIGHT : P.DAY }]),
  );

const allFrames = (pg: PuppetGen): PuppetFrame[] => _.flatMap(_.values(pg.frames), (f) => _.compact([f, f.shot2]));

const repairFrame = (f: PuppetFrame, pg: PuppetGen, line?: PuppetLine): PuppetFrame => {
  const out = { ...f };
  if (out.set && !pg.sets[out.set]) out.set = line?.place && pg.sets[line.place] ? line.place : undefined;
  if (out.prop && !pg.props[out.prop]) {
    out.prop = null;
    if (_.includes(P.SHOT_PROP, out.shot)) out.shot = out.actors.length ? P.SHOT_DEFAULT : P.SHOT_ESTABLISHING;
  }
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
  const ro: PuppetRunOptions = { exec: o.exec, mainExec: o.mainExec || o.exec, signal: o.signal, log: o.log, ai: o.ai, fresh };
  const referenceKey = o.styleReferences?.length ? createHash(P.SHA).update(JSON.stringify(_.map(o.styleReferences, (r) => r.dataUrl))).digest(P.HEX) : P.EMPTY;
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
  const pg: PuppetGen = {
    version: P.VERSION,
    styleId: style.id,
    characters: { ...(prev?.characters || {}) },
    sets: _.omit({ ...(prev?.sets || {}) }, o.onlyLocations || []),
    props: { ...(prev?.props || {}) },
    places: { ...(prev?.places || {}), ...placesOf(analysis) },
    frames: { ...(prev?.frames || {}) },
    reads: { ...(prev?.reads || {}) },
    seriesId,
  };
  pg.ghosts = _.map(_.filter(analysis.cast, (c) => puppetCastIsGhost(c)), (c) => c.key);
  gen.puppet = pg;
  const lines = collectPuppetLines(out, MR.MOTION_TEXT_SCENE);
  const redoBeats = new Set(o.onlyBeats || []);
  const why: Record<string, string> = {};
  for (const b of sceneBeats)
    if (redoBeats.has(b.id))
      for (const l of puppetBeatLines(b)) {
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
      pg.characters[c.key] = writePuppet<PuppetCharacter>({ id: newPuppetId(PUPPET_TYPES.CHARACTER), type: PUPPET_TYPES.CHARACTER, styleId: style.id, name: c.name || c.key, role: c.role, desc: _.compact([c.name, c.role, c.look]).join(P.SEP), tags: _.compact([c.gender, c.age, c.role]), story, height, colors: { body: colors[i % colors.length] }, head: {}, body: {}, sprites: {}, uses: 0, updatedAt: new Date().toISOString() }).id;
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
    for (const [k, c] of _.toPairs(drawn)) pg.characters[k] = c.id;
    emit();
  };

  const placeLinesOf = () => _.groupBy(lines, (l) => pg.reads?.[l.key]?.place || pg.frames[l.key]?.set || l.place);
  const hasBases = puppetBases(style.id).length > 0;
  const featuresOf = (): Record<string, string[]> => {
    const out: Record<string, string[]> = {};
    for (const r of _.values(pg.reads || {})) if (r.place && r.object && _.includes(P.FEATURE_OBJECT_TYPES, r.object.type)) out[r.place] = _.uniq([...(out[r.place] || []), r.object.key]);
    return out;
  };
  const drawSets = async (keys: string[]): Promise<void> => {
    const placeLines = placeLinesOf();
    const open: PuppetPlace[] = [];
    const forcedKeys: string[] = [];
    for (const k of _.uniq(keys)) {
      const place = pg.places[k];
      if (!place) continue;
      const forced = _.includes(o.onlyLocations || [], k);
      if (!forced && !fresh && has<PuppetSet>(PUPPET_TYPES.SET, pg.sets[k])) continue;
      if (forced) {
        forcedKeys.push(k);
        continue;
      }
      const reuse = has<PuppetSet>(PUPPET_TYPES.SET, series?.sets[k]);
      if (reuse && !reuse.name.includes(P.VARIANT_SEP)) {
        pg.sets[k] = reuse.id;
        o.log(P.LOG_SET_REUSE(place.name, reuse.name));
        continue;
      }
      open.push(place);
    }
    const must = featuresOf();
    const matched = mode === LM.FRESH ? {} : await matchLibrarySets(style, open, ro, seriesName(analysis.title || script.title));
    for (const [k, set] of _.toPairs(matched)) {
      const lack = _.filter(must[k] || [], (f) => !puppetFeatureSpot(set.spots || [], f));
      if (lack.length && hasBases) {
        o.log(Q.LOG_FEATURE_REDO(pg.places[k].name, lack.join(P.COMMA)));
        delete matched[k];
        continue;
      }
      pg.sets[k] = set.id;
      o.log(P.LOG_SET_REUSE(pg.places[k].name, set.name));
    }
    let jobs: PuppetSetJob[] = _.map([...forcedKeys, ..._.map(_.reject(open, (pl) => !!matched[pl.key]), (pl) => pl.key)], (k) => ({ key: k, place: pg.places[k], uses: _.map(_.take(placeLines[k] || [], 6), (l) => l.text).join(P.SPACE) }));
    if (!jobs.length) return;
    if (hasBases) {
      const built = await buildPuppetSets(style, _.map(jobs, (j) => ({ place: j.place, must: must[j.key] || [], uses: j.uses })), ro, seriesName(analysis.title || script.title));
      for (const [k, set] of _.toPairs(built)) pg.sets[k] = set.id;
      jobs = _.filter(jobs, (j) => !built[j.key]);
      emit();
    }
    if (!jobs.length) return;
    const drawn = await drawPuppetSets(style, jobs, ro);
    for (const [k, set] of _.toPairs(drawn)) pg.sets[k] = set.id;
    emit();
  };
  const drawn = new Set<string>();
  const drawSetsOnce = (keys: string[]): Promise<void> => {
    const todo = _.filter(_.uniq(keys), (k) => !drawn.has(k));
    for (const k of todo) drawn.add(k);
    return drawSets(todo);
  };

  const spotsOf = (place: string | undefined) => puppetSpots(place ? has<PuppetSet>(PUPPET_TYPES.SET, pg.sets[place]) : null);
  const composeCtx = { spots: spotsOf, spotsText: (place: string) => puppetSpotsText(place, has<PuppetSet>(PUPPET_TYPES.SET, pg.sets[place])), framing: style.framing };
  const readsOf = (todo: PuppetLine[]): PuppetRead[] => _.compact(_.map(todo, (l) => pg.reads?.[l.key]));
  const readLines = async (todo: PuppetLine[], notes: Record<string, string>): Promise<void> => {
    if (!todo.length) return;
    const r = await readPuppetLines(todo, lines, analysis, pg.places, notes, ro);
    Object.assign(pg.places, r.newPlaces);
    pg.reads = { ...(pg.reads || {}), ...r.reads };
    emit();
  };
  progress(0.08, P.STAGE_READ);
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
      const lights = _.uniq(_.compact(_.map(_.filter(frames, (f) => f.set === k), (f) => f.light)));
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
    for (const r of todoReads) if (r.object && !objects[r.object.key]) objects[r.object.key] = r.object;
    const open: PuppetObject[] = [];
    for (const ob of _.values(objects)) {
      if (!fresh && has<PuppetProp>(PUPPET_TYPES.PROP, pg.props[ob.key])) continue;
      const reuse = has<PuppetProp>(PUPPET_TYPES.PROP, series?.props[ob.key]);
      if (reuse) pg.props[ob.key] = reuse.id;
      else open.push(ob);
    }
    const matched = mode === LM.AUTO && open.length ? await matchLibraryProps(style, open, ro) : {};
    for (const [k, p] of _.toPairs(matched)) pg.props[k] = p.id;
    const todo = _.map(_.filter(open, (ob) => !matched[ob.key]), (ob) => ob.key);
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
    const posed = _.uniq(_.flatMap(allFrames(pg), (f) => _.map(_.filter(f.actors, (a) => _.includes(P.SPRITES, a.pose)), (a) => a.char)));
    const todo = _.compact(_.map(posed, (k) => has<PuppetCharacter>(PUPPET_TYPES.CHARACTER, pg.characters[k]))).filter((c) => !_.size(c.sprites) && !!c.head?.front);
    if (!todo.length) return;
    o.log(P.LOG_SPRITES(_.map(todo, (c) => c.name)));
    await mapMotionAiPool(todo, (c) => drawPuppetSprites(style, c, ro), puppetLanes(o.exec));
  };
  const castExtras = (todoReads: PuppetRead[]): void => {
    if (mode === LM.FRESH) return;
    const keys = _.uniq(_.filter(_.flatMap(todoReads, (r) => r.who), (k) => P.EXTRA_RE.test(k) && !pg.characters[k]));
    const stock = stockExtras(style.id, keys, _.values(pg.characters), seriesName(analysis.title || script.title));
    for (const [k, c] of _.toPairs(stock)) pg.characters[k] = c.id;
    if (_.size(stock)) o.log(P.LOG_EXTRAS(_.size(stock)));
  };
  const carryWear = (): void => {
    for (const chapter of _.values(_.groupBy(lines, (l) => l.chapterId))) {
      const worn: Record<string, string[]> = {};
      const apply = (f: PuppetFrame): PuppetFrame => {
        for (const a of f.actors) if (a.wear?.length) worn[a.char] = _.uniq([...(worn[a.char] || []), ...a.wear]);
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
    await Promise.all([timed(P.STEP_SETS, () => drawSetsOnce(_.compact([..._.map(todoReads, (r) => r.place), ..._.map(todo, (l) => l.place)]))), timed(P.STEP_PROPS, () => drawProps(_.reject(todoReads, (r) => !!r.object && _.includes(P.FEATURE_OBJECT_TYPES, r.object.type))))]);
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
  emit();

  progress(0.8, P.STAGE_SOUND);
  await timed(P.STEP_SOUND, () => soundJob);
  await releaseMotionAiSession(o.log).catch(_.noop);

  const old = has<PuppetSeries>(PUPPET_TYPES.SERIES, seriesId);
  writePuppet<PuppetSeries>({ id: seriesId, type: PUPPET_TYPES.SERIES, styleId: style.id, name: analysis.title || script.title, characters: { ...(old?.characters || {}), ...pg.characters }, sets: { ...(old?.sets || {}), ...pg.sets }, props: { ...(old?.props || {}), ...pg.props }, updatedAt: new Date().toISOString() });
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
