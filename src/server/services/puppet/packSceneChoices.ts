import _ from "lodash";
import { MOTION_PROGRESS as PROGRESS } from "../../../constants/motionProgress.js";
import { motionSceneProgress } from "../../../lib/motionSceneProgress.js";
import { MOTION_PACK_SELECTION as K } from "../../../constants/motionPackSelection.js";
import { PUPPET as P, PUPPET_TYPES as T } from "../../../constants/motionPuppet.js";
import { PA } from "../../../constants/motionPuppetAssets.js";
import type { PuppetLine } from "../../../lib/motionPuppet.js";
import { puppetObjectClass } from "../../../lib/motionPuppetAssets.js";
import { puppetSpotGeometryValid } from "../../../lib/motionPlacement.js";
import { puppetSourceQuote } from "../../../lib/motionPuppetValues.js";
import type { PuppetCharacter, PuppetFrame, PuppetGen, PuppetProp, PuppetRead, PuppetStylePack } from "../../../types/motionPuppet.js";
import { choosePuppetBlocking } from "./blocking.js";
import { fitPuppetRead, puppetReadObjects, readFrame } from "./director.js";
import { layoutPuppetFrame, puppetSetMissingRequirements, puppetSpots } from "./layout.js";
import { puppetSelectionBindings, puppetSelectionFrameKey, puppetSelectionHash } from "./packSelectionContract.js";
import { readPuppet, puppetSetForLight } from "./kitLibrary.js";
import type { PuppetSet } from "../../../types/motionPuppet.js";
import type { PuppetRunOptions } from "./stylePack.js";
import { puppetFramePlacementIssues } from "./packPlacement.js";
import { puppetPropAssignments, puppetPropAssignmentsValid } from "./propPlacement.js";
import { puppetSpatialAssignmentsValid, puppetActorSpotCandidates, puppetSpatialAnchorDistance } from "./spatialPlacement.js";
import { MOTION_STAGE_GEOMETRY as GEOMETRY } from "../../../constants/motionStageGeometry.js";
export interface PuppetSceneChoice {
  choiceId: string;
  frame: PuppetFrame;
  bindings: ReturnType<typeof puppetSelectionBindings>;
  preview?: string;
  score?: number;
}
export const scorePuppetSceneChoice = (frame: PuppetFrame, read: PuppetRead, previous?: PuppetFrame, identities: Map<string, string> = new Map(), spots = [] as ReturnType<typeof puppetSpots>): number => {
  const positions = frame.actors.map((actor) => actor.x || 0);
  const span = positions.length > 1 ? Math.max(...positions) - Math.min(...positions) : 0;
  const movement = frame.actors.reduce((sum, actor) => {
    const old = previous?.actors.find((item) => item.char === actor.char);
    return sum + (old?.x != null && actor.x != null ? Math.abs(old.x - actor.x) : 0);
  }, 0);
  const context = read.states?.some((state) => state.placement || state.support) || read.blocking || puppetReadObjects(read).some((object) => !object.owner);
  const anchorDistance = frame.actors.reduce((sum, actor) => {
    const placement = read.states?.find((state) => state.char === actor.char)?.placement;
    const spot = spots.find((candidate) => candidate.key === actor.spot);
    return sum + (placement?.anchor && spot ? puppetSpatialAnchorDistance(spot, placement.anchor, spots) : 0);
  }, 0);
  const previousItems = [...(previous?.items || []), ...(previous?.prop ? [{ prop: previous.prop, propAt: previous.propAt }] : [])];
  const movedProps = [...(frame.items || []), ...(frame.prop ? [{ prop: frame.prop, propAt: frame.propAt }] : [])].filter((item) => {
    const old = previousItems.find((before) => (identities.get(before.prop) || before.prop) === (identities.get(item.prop) || item.prop));
    return old?.propAt && item.propAt && old.propAt !== item.propAt;
  }).length;
  const preferred = context ? P.SHOT_GROUP : read.focus === P.FOCUS_OBJECT && frame.prop ? P.SHOT_OBJECT : frame.actors.length > 2 ? P.SHOT_GROUP : P.SHOT_DEFAULT;
  return (
    (frame.actors.length ? Math.min(...frame.actors.map((actor) => actor.k ?? 1)) * GEOMETRY.READABILITY_SCORE : 0) -
    anchorDistance * K.SCORE.ANCHOR -
    span * K.SCORE.COMPACT -
    movement * K.SCORE.CONTINUITY -
    movedProps * K.SCORE.PROP_CONTINUITY +
    (frame.shot === preferred ? K.SCORE.FOCUS : 0) +
    (context && frame.shot === P.SHOT_GROUP ? K.SCORE.CONTEXT : 0) +
    (previous?.shot === frame.shot ? K.SCORE.SHOT_CONTINUITY : 0)
  );
};
export const createPuppetSceneChoices = (line: PuppetLine, read: PuppetRead, gen: PuppetGen, style: PuppetStylePack, previous?: PuppetFrame, stage?: PuppetSet): PuppetSceneChoice[] => {
  const fail = (): never => {
    throw new Error(K.NO_CHOICES(line.key));
  };
  if (!read?.visual?.evidence.length || read.visual.evidence.some((quote) => !puppetSourceQuote(line.text, quote))) return fail();
  const base = stage || (read?.place && readPuppet<PuppetSet>(T.SET, gen.sets[read.place]));
  if (!base || base.styleId !== style.id) return fail();
  const set = puppetSetForLight(base, read.light);
  if (puppetSetMissingRequirements(set, [read]).length) return fail();
  const spots = puppetSpots(set).filter(puppetSpotGeometryValid);
  const characters = Object.fromEntries(read.who.map((key) => [key, readPuppet<PuppetCharacter>(T.CHARACTER, gen.characters[key])]));
  const objects = puppetReadObjects(read).filter((object) => puppetObjectClass(object) === PA.PROP);
  const props = Object.fromEntries(objects.map((object) => [object.key, readPuppet<PuppetProp>(T.PROP, gen.props[object.key])]));
  if (Object.values(characters).some((asset) => !asset || asset.styleId !== style.id) || Object.values(props).some((asset) => !asset || asset.styleId !== style.id)) return fail();
  const hands = objects.filter((object) => [P.MOUNT_HELD_KEY, P.MOUNT_SHOULDER, P.MOUNT_WEAR, P.MOUNT_BODY].some((mount) => mount === object.mount));
  if (
    hands.some((object) => !object.owner || !read.who.includes(object.owner)) ||
    Object.values(
      _.groupBy(
        hands.filter((object) => object.mount !== P.MOUNT_WEAR && object.mount !== P.MOUNT_BODY),
        (object) => object.owner,
      ),
    ).some((held) => held.length > 1)
  )
    return fail();
  const identities = new Map(
    Object.values(gen.reads || {})
      .flatMap(puppetReadObjects)
      .map((object) => [object.key, object.identity || object.key]),
  );
  const previousItems = [...(previous?.items || []), ...(previous?.prop ? [{ prop: previous.prop, propAt: previous.propAt }] : [])];
  const propLayouts = puppetPropAssignments(
    objects,
    spots,
    previousItems.map((item) => ({ ...item, prop: objects.find((object) => (object.identity || object.key) === (identities.get(item.prop) || item.prop))?.key || item.prop })),
    (assigned) => {
      const items = objects.filter((object) => assigned.has(object.key)).map((object) => ({ prop: object.key, propAt: assigned.get(object.key), propMount: object.mount, propSupport: object.support, propRot: object.rotation }));
      const first = items[0];
      if (!first) return true;
      const ctx = { set, body: style.body, heights: {}, prop: props[first.prop], props };
      try {
        const frame = layoutPuppetFrame({ shot: read.who.length ? P.SHOT_DEFAULT : P.SHOT_OBJECT, actors: [], ...first, items: items.slice(1) }, ctx);
        return !puppetFramePlacementIssues(frame, ctx).length;
      } catch {
        return false;
      }
    },
  );
  if (!propLayouts.length) return fail();
  const previousAt = (object: (typeof objects)[number] | undefined) => object && previousItems.find((item) => (identities.get(item.prop) || item.prop) === (object.identity || object.key))?.propAt;
  const seed = fitPuppetRead(
    {
      ...readFrame(read, line, read.who),
      shot: read.who.length ? P.SHOT_DEFAULT : objects.length ? P.SHOT_OBJECT : P.SHOT_ESTABLISHING,
      propAt: previousAt(read.object || undefined),
      items: objects.map((object) => ({ prop: object.key, propAt: previousAt(object) })),
      actors: read.who.map((char) => ({ char, pose: P.POSE_DEFAULT, face: P.FACE_DEFAULT, expr: read.emotion, spot: previous?.actors.find((actor) => actor.char === char)?.spot })),
      layoutLocked: true,
    },
    read,
    spots,
  );
  const blocking = seed.blocking ? choosePuppetBlocking(seed.blocking, seed.actors, { ...set, spots }) : null;
  if (seed.blocking && !blocking) return fail();
  const needs = seed.actors
    .map((actor) => {
      const kind = P.POSE_KIND[actor.pose] || P.SPOT_STAND;
      const fixed = blocking?.assignments.get(actor.char);
      const anchor = read.states?.find((state) => state.char === actor.char)?.placement;
      const candidates = puppetActorSpotCandidates(actor, anchor, spots, fixed);
      candidates.sort((a, b) => (anchor?.anchor ? puppetSpatialAnchorDistance(a, anchor.anchor, spots) - puppetSpatialAnchorDistance(b, anchor.anchor, spots) : 0) || Number(b.key === actor.spot) - Number(a.key === actor.spot) || Number(a.kind !== kind) - Number(b.kind !== kind) || a.key.localeCompare(b.key));
      if (!style.procedural && (K.LOW_SPRITES as readonly string[]).includes(actor.pose) && !characters[actor.char]?.sprites?.[actor.pose]) return { actor, candidates: [] };
      return { actor, candidates };
    })
    .sort((a, b) => a.candidates.length - b.candidates.length);
  const choices: PuppetSceneChoice[] = [];
  const used = new Set<string>();
  const assignments = new Map<string, string>();
  let searched = 0;
  let layouts = 0;
  const visit = (index: number): void => {
    if (++searched > K.SEARCH_BUDGET || layouts >= K.LAYOUT_LIMIT) return;
    if (index < needs.length) {
      const { actor, candidates } = needs[index];
      for (const spot of candidates) {
        if (used.has(spot.key)) continue;
        used.add(spot.key);
        assignments.set(actor.char, spot.key);
        visit(index + 1);
        used.delete(spot.key);
        assignments.delete(actor.char);
        if (searched >= K.SEARCH_BUDGET || layouts >= K.LAYOUT_LIMIT) break;
      }
      return;
    }
    if (!puppetSpatialAssignmentsValid(read, assignments, spots)) return;
    const ctx = { set, body: style.body, heights: Object.fromEntries(Object.entries(characters).map(([key, asset]) => [key, asset!.height])), prop: seed.prop ? props[seed.prop] : undefined, props };
    layoutsLoop: for (const propLayout of propLayouts) {
      let frame: PuppetFrame;
      try {
        frame = layoutPuppetFrame({ ..._.cloneDeep(seed), propAt: propLayout.get(seed.prop || "") || seed.propAt, items: seed.items?.map((item) => ({ ...item, propAt: propLayout.get(item.prop) || item.propAt })), actors: seed.actors.map((actor) => ({ ...actor, spot: assignments.get(actor.char) })) }, ctx);
      } catch {
        continue;
      }
      if (puppetFramePlacementIssues(frame, ctx).length || !puppetPropAssignmentsValid(read, frame, spots)) continue;
      if (frame.actors.some((actor) => !actor.spot || actor.spot !== assignments.get(actor.char) || !Number.isFinite(actor.x) || !Number.isFinite(actor.y))) continue;
      for (const object of objects) {
        const owner = frame.actors.find((actor) => actor.char === object.owner);
        if (object.mount === P.MOUNT_WEAR || object.mount === P.MOUNT_BODY ? !owner?.wear?.includes(object.key) : [P.MOUNT_HELD_KEY, P.MOUNT_SHOULDER].some((mount) => mount === object.mount) ? owner?.hold !== object.key : frame.prop !== object.key && !frame.items?.some((item) => item.prop === object.key)) continue layoutsLoop;
      }
      const bindings = puppetSelectionBindings(gen, frame, set);
      layouts++;
      const shots = frame.actors.length ? [...K.SAFE_SHOTS, ...(read.focus === P.FOCUS_OBJECT && frame.prop ? [P.SHOT_OBJECT] : [])] : [frame.shot];
      for (const shot of shots) {
        const view = { ...frame, shot };
        const choiceId = K.PREFIX + puppetSelectionHash({ version: K.VERSION, line: line.key, read, frame: view, bindings }).slice(0, K.HASH_LENGTH);
        choices.push({ choiceId, frame: { ...view, choiceId }, bindings, score: scorePuppetSceneChoice(view, read, previous, identities, spots) });
      }
      if (layouts >= K.LAYOUT_LIMIT) break;
    }
  };
  visit(0);
  if (!choices.length) return fail();
  return choices.sort((a, b) => b.score! - a.score! || a.choiceId.localeCompare(b.choiceId)).slice(0, K.CHOICE_LIMIT);
};
export const composePuppetPackLines = async (todo: PuppetLine[], all: PuppetLine[], gen: PuppetGen, style: PuppetStylePack, _notes: Record<string, string>, o: PuppetRunOptions, onAccepted?: () => void): Promise<Record<string, PuppetFrame>> => {
  const frames: Record<string, PuppetFrame> = {};
  const provisional: Record<string, PuppetFrame> = {};
  gen.sceneSelections ||= {};
  for (const group of _.chunk(todo, K.BATCH)) {
    const options = new Map<number, PuppetSceneChoice[]>();
    for (const [i, line] of group.entries()) {
      o.log(motionSceneProgress(PROGRESS.STAGE.BUILD, PROGRESS.STATUS.START, line, all, gen.places));
      const at = all.findIndex((item) => item.key === line.key);
      const read = gen.reads![line.key];
      const location = read.place && (gen.places[read.place]?.visualBase || read.place);
      const history = all
        .slice(0, at)
        .reverse()
        .filter((entry) => {
          const before = gen.reads?.[entry.key];
          return before?.visual?.scene === read.visual?.scene && before?.visual?.timeline === read.visual?.timeline && before?.place && (gen.places[before.place]?.visualBase || before.place) === location;
        })
        .map((entry) => frames[entry.key] || provisional[entry.key] || gen.frames[entry.key])
        .filter((frame): frame is PuppetFrame => !!frame);
      const previous = history.length
        ? {
            ...history[0],
            actors: _.uniqBy(
              history.flatMap((frame) => frame.actors),
              (actor) => actor.char,
            ),
            items: _.uniqBy(
              history.flatMap((frame) => [...(frame.items || []), ...(frame.prop ? [{ prop: frame.prop, propAt: frame.propAt }] : [])]),
              (item) => item.prop,
            ),
          }
        : undefined;
      options.set(i, createPuppetSceneChoices(line, gen.reads![line.key], gen, style, previous));
      provisional[line.key] = options.get(i)![0].frame;
    }
    o.log(K.CHOICES_LOG([...options.values()].reduce((sum, rows) => sum + rows.length, 0)));
    o.signal?.throwIfAborted();
    for (const [i, choices] of options) {
      const choice = choices[0];
      const line = group[i];
      frames[line.key] = choice.frame;
      gen.frames[line.key] = choice.frame;
      o.log(motionSceneProgress(PROGRESS.STAGE.BUILD, PROGRESS.STATUS.DONE, line, all, gen.places));
      o.log(PROGRESS.SUMMARY(PROGRESS.STAGE.BUILD, all.filter((row) => !!gen.frames[row.key]).length, all.length));
      gen.sceneSelections[line.key] = { version: K.VERSION, choiceId: choice.choiceId, candidateIds: choices.map((row) => row.choiceId), source: K.DETERMINISTIC, inputKey: puppetSelectionHash(gen.reads![line.key]), frameKey: puppetSelectionFrameKey(choice.frame), bindings: choice.bindings, evidence: { line: line.key, text: line.text } };
    }
    onAccepted?.();
  }
  return frames;
};
