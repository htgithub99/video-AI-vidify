import { RUNTIME_TEXT as RT_SHARED } from "../../../../../constants/runtime/shared.js";
import { RUNTIME_TEXT as RT_SERVER } from "../../../../../constants/runtime/server.js";
import { stringifyJson, parseJson } from "../../../../../lib/jsonStringify.js";
import { canonicalPuppetReadObjects, mergePuppetReadRepair, puppetReadObjects } from "../../../../../lib/motionReadObjects.js";
import { MOTION_PROGRESS as PROGRESS } from "../../../../../constants/motionProgress.js";
import { motionSceneProgress } from "../../../../../lib/motionSceneProgress.js";
import { MOTION_ILLUSTRATION_POLICY as IP } from "../../../../../constants/motionIllustrationPolicy.js";
import { MOTION_PRODUCTION as PRODUCTION } from "../../../../../constants/motionProduction.js";
import { simplePuppetStates } from "../../../../../lib/motionIllustrationPolicy.js";
import { cleanPuppetObjectPlacement, puppetIllustrationReadIssues, puppetHoldingEvidence } from "./illustrationFacts.js";
import { normalizePuppetObjectSupport } from "../../../../../lib/motionPropSupport.js";
import { isTerminalMotionAiError } from "../../../../../server/services/chatSubmissionRecovery.js";
import { randomUUID } from "node:crypto";
import { motionInputKey } from "../motionFileUtils.js";
import { recoverMotionAiContractState, requestMotionAiContract, type MotionAiResponseContract } from "../motionAiContractService.js";
import { MOTION_RESPONSE_SCHEMAS } from "../../../../../constants/motionResponseContract.js";
import { motionResponseIssues, withMotionResponsePrompt } from "../../../../../lib/motionResponseContract.js";
import { cleanPuppetBlocking } from "./blocking.js";
import { cleanPuppetSpatialPlacement } from "./spatialPlacement.js";
import { MOTION_VISUAL_CONTRACT as V } from "../../../../../constants/motionVisualContract.js";
import { MOTION_PROMPT as PROMPT } from "../../../../../constants/motionPrompt.js";
import { motionPromptGroups, motionPromptPayloadBudget } from "../../../../../lib/motionPrompt.js";
import { MOTION_STORYBOARD as SB } from "../../../../../constants/motionStoryboard.js";
import { assessPuppetVisualContract, puppetLineContext, puppetStoryContext } from "./visualContract.js";
import { MOTION_BLOCKING as B } from "../../../../../constants/motionBlocking.js";
import { MOTION_PACK as PACK } from "../../../../../constants/motionPack.js";
import { MOTION_ILLUSTRATION as I } from "../../../../../constants/motionIllustration.js";
import { puppetPackStoryCapabilities } from "./packCatalog.js";
import { closedPuppetPackId } from "./packPolicy.js";
import { MOTION_PACK_SELECTION as SELECTION } from "../../../../../constants/motionPackSelection.js";
import { puppetTokens as tokens, puppetKeyOf as keyOf, puppetSourceQuote } from "../../../../../lib/motionPuppetValues.js";
import _ from "lodash";
import { PA } from "../../../../../constants/motionPuppetAssets.js";
import { MOTION_PLACEMENT as M } from "../../../../../constants/motionPlacement.js";
import { MOTION_APPEARANCE as APPEARANCE } from "../../../../../constants/motionAppearance.js";
import { normalizePuppetAppearance, withPuppetFrameAppearance } from "../../../../../lib/motionAppearance.js";
import { puppetSupportKey } from "../../../../../lib/motionPlacement.js";
import { puppetAssetName, puppetEnglish, puppetObjectClass, puppetObjectRequirements } from "../../../../../lib/motionPuppetAssets.js";
import { PUPPET as P, PUPPET_GENRES, PUPPET_GENRE_ALIAS, PUPPET_GENRE_DEFAULT, PUPPET_PROMPTS as PR, PUPPET_READ_SCHEMA } from "../../../../../constants/motionPuppet.js";
import { puppetSentenceKey, type PuppetLine } from "../../../../../lib/motionPuppet.js";
import type { MotionStoryAnalysis } from "../../../../../types/motionVideo.js";
import type { PuppetFrame, PuppetFrameActor, PuppetObject, PuppetPlace, PuppetRead, PuppetReadDraft, PuppetSpot } from "../../../../../types/motionPuppet.js";
import { mapMotionAiPool, runMotionAi, writeMotionAiDebug } from "../motionStoryService.js";
import { puppetLanes } from "./kitDraw.js";
import { puppetFeatureSpot, puppetStatePose, puppetSupportAssignments } from "./layout.js";
import type { PuppetRunOptions } from "./stylePack.js";
export { puppetReadObjects } from "../../../../../lib/motionReadObjects.js";
export { puppetFeatureSpot } from "./layout.js";
const pick = (v: unknown, list: readonly string[], d: string): string => (_.isString(v) && list.includes(v) ? v : d);
export const puppetGenreRules = (genre: string | undefined): string => {
  const g = PUPPET_GENRES[_.toString(genre)] || PUPPET_GENRES[PUPPET_GENRE_ALIAS[_.toString(genre)]] || PUPPET_GENRES[PUPPET_GENRE_DEFAULT];
  return [g.shots, P.PACING_LABEL + g.pacing, P.LIGHT_LABEL + g.light, P.OPENING_LABEL + g.opening].join(P.SEP);
};
const isCast = (cast: string[], c: string): boolean => cast.includes(c) || P.EXTRA_RE.test(c);
const groupsOf = <T>(list: T[], size: number): T[][] => _.chunk(list, Math.ceil(list.length / Math.max(1, Math.ceil(list.length / size))));
const previousOf = (all: PuppetLine[], first: string): string => {
  const at = _.findIndex(all, { key: first });
  return _.map(all.slice(Math.max(0, at - P.PREVIOUS_LINES), Math.max(0, at)), (l) => l.text).join(P.SPACE);
};
const wordIn = (word: string, text: string): boolean => {
  const w = puppetSentenceKey(word);
  return !!w && (P.SPACE + puppetSentenceKey(text) + P.SPACE).includes(P.SPACE + w + P.SPACE);
};
const castText = (analysis: MotionStoryAnalysis): string => _.map(analysis.cast, (c) => [c.key, c.name, c.role, c.gender, c.age, c.look || c.description || P.EMPTY].join(P.SEP)).join(P.NL);
const actorOf = (raw: any, cast: string[]): PuppetFrameActor | null => {
  const c = _.toString(raw?.char);
  if (!isCast(cast, c)) return null;
  return _.omitBy(
    {
      char: c,
      pose: pick(raw?.pose, P.POSES, P.POSE_DEFAULT),
      gesture: pick(raw?.gesture, P.GESTURES, P.EMPTY) || undefined,
      expr: pick(raw?.expr, P.EXPRS, P.EXPR_DEFAULT),
      face: pick(raw?.face, P.FACES, P.FACE_DEFAULT),
      x: _.isFinite(Number(raw?.x)) ? _.clamp(Number(raw.x), 0.05, 0.95) : undefined,
      spot: keyOf(raw?.spot) || undefined,
      support: keyOf(raw?.support) || undefined,
      target: isCast(cast, _.toString(raw?.target)) && raw.target !== c ? raw.target : undefined,
      removeWear: _.isArray(raw?.removeWear) ? _.compact(raw.removeWear.map(keyOf)) : undefined,
      hold: keyOf(raw?.hold) || undefined,
      wear: _.isArray(raw?.wear) && raw.wear.length ? _.filter(_.compact(_.map(raw.wear, keyOf)), (k) => wearable(k)) : undefined,
      depth: pick(raw?.depth, P.DEPTHS, P.DEPTH_MID),
      sil: raw?.sil === true ? true : undefined,
      trail: raw?.trail === true ? true : undefined,
    },
    _.isNil,
  ) as PuppetFrameActor;
};
export const normalizePuppetFrame = (raw: any, line: PuppetLine, cast: string[], nested = false): PuppetFrame => {
  let actors = _.take(
    _.uniqBy(_.compact(_.map(_.castArray(raw?.actors || []), (a) => actorOf(a, cast))), (a) => a.char),
    P.ACTOR_MAX,
  );
  let shot = pick(raw?.shot, P.SHOTS, P.SHOT_DEFAULT);
  const prop = keyOf(raw?.prop);
  const speaker = line.speaker && isCast(cast, line.speaker) ? line.speaker : null;
  if (_.includes(P.SHOT_PROP, shot) && !prop) shot = actors.length ? P.SHOT_DEFAULT : P.SHOT_ESTABLISHING;
  if (_.includes(P.SHOT_ONE, shot) && !actors.length) shot = speaker ? shot : P.SHOT_ESTABLISHING;
  if (_.includes(P.SHOT_NOBODY, shot)) actors = [];
  if (speaker && !line.visualUnit && !_.includes(P.SHOT_NOBODY, shot) && !_.some(actors, { char: speaker }) && shot !== P.SHOT_INSERT) actors = [{ char: speaker, pose: P.POSE_TALK, expr: P.EXPR_DEFAULT, face: P.FACE_DEFAULT, depth: P.DEPTH_MID }, ...actors].slice(0, P.ACTOR_MAX);
  if (speaker) actors = _.map(actors, (a) => (a.char === speaker && a.pose === P.POSE_DEFAULT ? { ...a, pose: P.POSE_TALK } : a));
  if (shot === P.SHOT_SPLIT && !actors.length) shot = P.SHOT_ESTABLISHING;
  if (shot === P.SHOT_DUO && actors.length < 2) shot = actors.length ? P.SHOT_BUST : P.SHOT_ESTABLISHING;
  if (shot === P.SHOT_OTS) {
    if (actors.length < 2) shot = P.SHOT_DEFAULT;
    else {
      const main = speaker && _.some(actors, { char: speaker }) ? speaker : actors[0].char;
      actors = _.map(actors, (a) => (a.char === main ? { ...a, depth: P.DEPTH_MID } : { ...a, depth: P.DEPTH_FORE, face: P.FACE_BACK }));
    }
  } else actors = _.map(actors, (a) => (a.depth === P.DEPTH_FORE ? { ...a, depth: P.DEPTH_MID } : a));
  if (_.includes(P.SHOT_ONE, shot) && actors.length) {
    const main = speaker && _.some(actors, { char: speaker }) ? _.find(actors, { char: speaker })! : actors[0];
    actors = shot === P.SHOT_SHADOW ? [main, ..._.reject(actors, { char: main.char })].slice(0, 2) : [main];
  }
  actors = _.map(actors, (a) => (a.sil && (a.char === speaker || !_.includes(P.SIL_SHOTS, shot)) ? (_.omit(a, P.SIL_FIELD) as PuppetFrameActor) : a));
  const place = keyOf(raw?.place);
  const frame: PuppetFrame = {
    shot,
    blocking: cleanPuppetBlocking(
      raw?.blocking,
      actors.map((actor) => actor.char),
    ),
    effectSource: keyOf(raw?.effectSource) || undefined,
    effectTarget: keyOf(raw?.effectTarget) || undefined,
    effectMode: pick(raw?.effectMode, V.MODES, V.MODES[0]),
    set: place || line.place || undefined,
    light: pick(raw?.light, P.LIGHTS, P.EMPTY) || null,
    actors,
    prop: prop || null,
    propMount: pick(raw?.propMount, P.MOUNTS, P.EMPTY) || undefined,
    propRot: raw?.propRot != null && _.isFinite(Number(raw.propRot)) ? _.clamp(Number(raw.propRot), -180, 180) : undefined,
    propAt: keyOf(raw?.propAt) || null,
    items: _.take(
      _.uniqBy(
        _.compact(
          _.map(_.castArray(raw?.items || []), (it: any) => {
            const prop = keyOf(it?.prop);
            return prop ? { prop, propAt: keyOf(it?.propAt), propMount: pick(it?.propMount, P.MOUNTS, P.EMPTY) || undefined, propRot: it?.propRot != null && _.isFinite(Number(it.propRot)) ? _.clamp(Number(it.propRot), -180, 180) : undefined } : null;
          }),
        ),
        (it) => it.prop,
      ),
      P.OBJECTS_MAX,
    ),
    form: pick(raw?.form, P.FORMS, P.EMPTY) || undefined,
    anchor: keyOf(raw?.anchor) || undefined,
    propX: _.isFinite(Number(raw?.propX)) ? _.clamp(Number(raw.propX), 0.1, 0.9) : undefined,
    overlays: _.take(
      _.filter(_.castArray(raw?.overlays || []), (x) => _.includes(P.OVERLAYS, x)),
      3,
    ) as string[],
    camera: { move: pick(raw?.camera?.move, P.MOVES, P.MOVE_DEFAULT) },
    speaker,
    inset: keyOf(raw?.inset) || undefined,
    set2: shot === P.SHOT_SPLIT ? keyOf(raw?.set2) || undefined : undefined,
    light2: shot === P.SHOT_SPLIT ? pick(raw?.light2, P.LIGHTS, P.EMPTY) || undefined : undefined,
  };
  if (!nested && raw?.shot2 && _.isObject(raw.shot2)) frame.shot2 = normalizePuppetFrame({ place, light: raw.light, prop: raw.prop, overlays: raw.overlays, ...raw.shot2 }, line, cast, true);
  return frame;
};
export interface PuppetReadResult {
  reads: Record<string, PuppetRead>;
  newPlaces: Record<string, PuppetPlace>;
}
export const wearable = (...names: (string | undefined)[]): boolean => _.some(names, (n) => !!n && P.WEARABLE_RE.test(_.replace(n, /_/g, P.SPACE)));
const objectOf = (raw: any, line: PuppetLine): PuppetObject | null => {
  const word = _.trim(_.toString(raw?.word));
  const key = keyOf(raw?.key);
  if (!word || !key || !wordIn(word, line.text)) return null;
  if (raw?.presence === PA.MENTIONED || PA.NON_OBJECT_WORD.test(word)) return null;
  let type = pick(raw?.type, P.OBJECT_TYPES, P.OBJECT_TYPE_DEFAULT);
  const category = _.toString(raw?.category) || undefined;
  const classification = puppetObjectClass({ key, type, category });
  if (classification === PA.EXCLUDED) return null;
  if (classification === PA.SCENERY && !_.includes(P.FEATURE_OBJECT_TYPES, type)) type = PA.SCENERY;
  let mount = pick(raw?.mount, P.MOUNTS, P.TYPE_MOUNT[type] || P.MOUNT_FLOOR);
  const onBody = P.BODY_PLACE_RE.test(line.text) || mount === P.MOUNT_BODY;
  if (onBody && classification === PA.PROP) {
    type = P.OBJECT_TYPE_SMALL;
    mount = P.MOUNT_BODY;
  } else if (mount === P.MOUNT_WEAR && !wearable(key, word)) {
    type = P.OBJECT_TYPE_SMALL;
    mount = P.MOUNT_HELD_KEY;
  }
  const rotation = raw?.rotation != null && _.isFinite(Number(raw.rotation)) ? _.clamp(Number(raw.rotation), -180, 180) : type === P.OBJECT_TYPE_TOOL && mount === P.MOUNT_TABLE ? P.REST_TOOL_ROTATION : undefined;
  const description = puppetEnglish(raw?.description) ? _.truncate(raw.description, { length: 500 }) : puppetAssetName(key);
  return {
    word,
    key,
    essential: typeof raw?.essential === "boolean" ? raw.essential : undefined,
    ownershipEvidence: typeof raw?.ownershipEvidence === "string" ? raw.ownershipEvidence : undefined,
    placement: cleanPuppetObjectPlacement(raw?.placement, line.text),
    catalogKey: keyOf(raw?.catalogKey) || undefined,
    identity: keyOf(raw?.identity) || key,
    support: keyOf(raw?.support) || undefined,
    attachment: (PACK.ATTACHMENTS as readonly string[]).includes(raw?.attachment) ? raw.attachment : undefined,
    state: keyOf(raw?.state) || undefined,
    transition: raw?.transition === true,
    size: _.clamp(Number(raw?.size) || P.SIZE_DEFAULT, P.SIZE_MIN, P.SIZE_MAX),
    type,
    mount,
    rotation,
    owner: _.toString(raw?.owner) || undefined,
    note: _.truncate(word + P.DASH + line.text, { length: 160 }),
    category: classification === PA.SCENERY ? PA.SCENE_FEATURE : PA.PROP,
    description,
    requirements: puppetObjectRequirements({ word, requirements: _.uniq(_.filter(_.castArray(raw?.requirements || []), (v) => typeof v === PA.STRING && PA.KEY.test(v))) }),
  };
};
const readOf = (raw: any, line: PuppetLine, cast: string[], places: Record<string, PuppetPlace>, fresh: Record<string, PuppetPlace>, closed = false): { read: PuppetRead; errors: string[]; paths: string[]; objectPaths: string[] } => {
  const rawWho = _.castArray(raw?.who || []);
  const badWho = rawWho.some((char) => typeof char !== "string" || !isCast(cast, char)) || new Set(rawWho).size !== rawWho.length || rawWho.length > P.ACTOR_MAX;
  let who = _.uniq(_.filter(_.map(_.castArray(raw?.who || []), _.toString), (c) => isCast(cast, c)));
  if (!line.visualUnit && line.speaker && isCast(cast, line.speaker) && !who.includes(line.speaker)) who = [line.speaker, ...who];
  who = _.take(who, P.ACTOR_MAX);
  const object = raw?.object ? objectOf(raw.object, line) : null;
  const sources = _.take(
    _.uniqBy(
      raw.objects.map((raw: any, index: number) => ({ object: objectOf(raw, line), path: RT_SHARED.OBJECTS + index })).filter((source: { object: PuppetObject | null }) => !!source.object),
      (source: { object: PuppetObject }) => source.object.identity || source.object.key,
    ),
    P.OBJECTS_MAX,
  ) as { object: PuppetObject; path: string }[];
  const objects = sources.map(({ object: ob }) => normalizePuppetObjectSupport({ ...ob, owner: ob.owner && who.includes(ob.owner) ? ob.owner : undefined }));
  const primaryIndex = raw.objects.indexOf(raw.object);
  const states = _.uniqBy(
    _.filter(
      _.map(_.castArray(raw?.states || []), (s: any) => ({
        char: _.toString(s?.char),
        appearance: normalizePuppetAppearance(s?.appearance, line.text),
        essential: typeof s?.essential === "boolean" ? s.essential : undefined,
        transition: typeof s?.transition === "boolean" ? s.transition : undefined,
        action: pick(s?.action, _.keys(P.ACTIONS), P.ACTION_DEFAULT),
        posture: pick(s?.posture, P.POSTURES, P.EMPTY) || undefined,
        gesture: pick(s?.gesture, P.GESTURES, P.EMPTY) || undefined,
        support: keyOf(s?.support) ? puppetSupportKey(keyOf(s.support)!, s?.relation) : undefined,
        target: who.includes(_.toString(s?.target)) && s.target !== s.char ? _.toString(s.target) : undefined,
        placement: cleanPuppetSpatialPlacement(s?.placement, line, who, s?.char),
        eyes: P.EYE_STATES.includes(s?.eyes?.state) && typeof s.eyes.evidence === "string" && puppetSourceQuote(line.text, s.eyes.evidence) ? { state: s.eyes.state, evidence: puppetSourceQuote(line.text, s.eyes.evidence)! } : undefined,
      })),
      (s) => who.includes(s.char),
    ),
    (s) => s.char,
  );
  const named = _.trim(_.toString(raw?.object?.word));
  const f = _.toString(raw?.focus);
  const focus = isCast(cast, f) ? f : f === P.FOCUS_OBJECT && object ? f : f === P.FOCUS_PLACE ? f : who[0] || (object ? P.FOCUS_OBJECT : P.FOCUS_PLACE);
  if (isCast(cast, focus) && !who.includes(focus)) who = [focus, ...who].slice(0, P.ACTOR_MAX);
  const pk = keyOf(raw?.place);
  let place = pk && (places[pk] || fresh[pk]) ? pk : undefined;
  const desc = _.trim(_.toString(raw?.placeDesc));
  if (pk && !place && desc && !closed) {
    fresh[pk] = { key: pk, name: _.startCase(pk), desc: _.truncate(desc, { length: 200 }), interior: P.INTERIOR_RE.test(pk + P.SPACE + desc.toLowerCase()), time: _.includes(P.NIGHT_LIGHTS, raw?.light) ? P.NIGHT : P.DAY };
    place = pk;
  }
  const visual = assessPuppetVisualContract(raw?.visual, line.visualUnit?.scene);
  const read: PuppetRead = {
    visual: visual.visual,
    blocking: cleanPuppetBlocking(raw?.blocking, who),
    effectSource: keyOf(raw?.effectSource) || undefined,
    effectTarget: keyOf(raw?.effectTarget) || undefined,
    effectMode: pick(raw?.effectMode, V.MODES, V.MODES[0]),
    focus,
    who,
    place: place || line.place,
    sceneCondition: pick(raw?.sceneCondition, M.CONDITIONS, P.EMPTY) || undefined,
    object: objects.find((ob) => (ob.identity || ob.key) === (object?.identity || object?.key)) || null,
    objects,
    states,
    action: pick(raw?.action, _.keys(P.ACTIONS), P.ACTION_DEFAULT),
    emotion: pick(raw?.emotion, P.EXPRS, P.EXPR_DEFAULT),
    light: pick(raw?.light, P.LIGHTS, P.EMPTY) || null,
    overlays: _.take(
      _.filter(_.castArray(raw?.overlays || []), (x) => _.includes(P.OVERLAYS, x)),
      3,
    ) as string[],
  };
  const badBlocking = !!raw?.blocking && (!read.blocking || Object.values(read.blocking.roles).some((char) => !states.some((state) => state.char === char && state.posture)));
  const requestedObject = raw?.object && raw.object.presence !== PA.MENTIONED && puppetObjectClass({ key: keyOf(raw.object.key) || P.EMPTY, type: raw.object.type, category: raw.object.category }) !== PA.EXCLUDED && !PA.NON_OBJECT_WORD.test(named);
  const badSpatial = _.castArray(raw?.states || []).some((state: any) => state?.placement && !states.find((item) => item.char === state.char)?.placement);
  const badOwners = raw.objects.filter((object: any) => object?.owner && !who.includes(object.owner));
  const errors = [...visual.issues.map((issue) => issue.reason), ...who.filter((char) => !states.some((state) => state.char === char && state.posture)).map(V.READ_POSTURE_INVALID), ...(badBlocking ? [V.READ_BLOCKING_INVALID] : []), ...(badSpatial ? [SELECTION.SPATIAL_INVALID] : []), ...(requestedObject && !object ? [V.READ_OBJECT_INVALID] : []), ...(pk && !place ? [V.READ_PLACE_INVALID] : [])];
  if (badWho) errors.push(V.READ_CAST_INVALID);
  if (badOwners.length) errors.push(V.READ_OWNER_INVALID);
  if (closed && read.visual) {
    const quotes = read.visual.evidence.map((quote) => puppetSourceQuote(line.text, quote));
    if (quotes.some((quote) => quote === undefined)) errors.push(SELECTION.READ_EVIDENCE_INVALID);
    else read.visual.evidence = quotes as string[];
  }
  const paths = [
    ...(badWho ? ([RT_SERVER.WHO] as string[]) : []),
    ...(Array.isArray(raw?.objects) ? raw.objects.flatMap((object: any, index: number) => (object?.owner && !who.includes(object.owner) ? ([RT_SHARED.OBJECTS + index + RT_SHARED.OWNER] as string[]) : [])) : []),
    ...visual.issues.map((issue) => issue.path),
    ...who.flatMap((char) => {
      if (states.some((state) => state.char === char && state.posture)) return [];
      const at = Array.isArray(raw?.states) ? raw.states.findIndex((state: any) => state.char === char) : -1;
      return at >= 0 ? ([RT_SERVER.STATES + at + RT_SERVER.POSTURE] as string[]) : ([RT_SERVER.STATES_923B4B] as string[]);
    }),
    ...(badBlocking ? ([RT_SERVER.BLOCKING, ...who.flatMap((char) => (states.some((state) => state.char === char && state.posture) ? [] : ([RT_SERVER.STATES_923B4B] as string[])))] as string[]) : []),
    ...(badSpatial ? _.castArray(raw?.states || []).flatMap((state: any, at) => (state?.placement && !states.find((item) => item.char === state.char)?.placement ? ([RT_SERVER.STATES + at + RT_SERVER.PLACEMENT] as string[]) : [])) : []),
    ...(requestedObject && !object ? ([RT_SHARED.OBJECTS + primaryIndex] as string[]) : []),
    ...(pk && !place ? ([RT_SHARED.PLACE, RT_SERVER.PLACEDESC] as string[]) : []),
    ...(errors.includes(SELECTION.READ_EVIDENCE_INVALID) ? ([RT_SERVER.VISUAL_EVIDENCE] as string[]) : []),
  ];
  return { read, errors, paths: _.uniq(paths), objectPaths: sources.map((source) => source.path) };
};
export const readPuppetLines = async (lines: PuppetLine[], all: PuppetLine[], analysis: MotionStoryAnalysis, places: Record<string, PuppetPlace>, why: Record<string, string>, o: PuppetRunOptions, accepted?: (result: PuppetReadResult) => void): Promise<PuppetReadResult> => {
  const requested = new Set(lines.map((line) => line.key));
  const cast = _.map(analysis.cast, (character) => character.key);
  const story = analysis.title + P.DASH + analysis.logline;
  const placeText = _.map(_.values(places), (place) => [place.key, _.truncate(place.name + P.DASH + place.desc, { length: 140 })].join(P.SEP)).join(P.NL);
  const result: PuppetReadResult = { reads: {}, newPlaces: {} };
  const localContext = (index: number) => {
    const localLines = all.slice(Math.max(0, index - SB.CONTEXT_LINES), index + 1);
    const text = localLines.map((line) => ([line.text, line.action, stringifyJson(line.scenePlan)] as string[]).filter(Boolean).join(P.SPACE)).join(P.NL);
    const members = analysis.cast.filter((member) => localLines.some((line) => line.cast?.includes(member.key) || line.speaker === member.key || wordIn(member.name, line.text)));
    const placeKeys = new Set(localLines.flatMap((line) => [line.place, ...(line.sourcePlans || []).map((plan) => plan.place)]).filter(Boolean));
    return { lines: localLines, cast: members.length ? members : analysis.cast, places: (analysis.places || []).filter((place) => !placeKeys.size || placeKeys.has(place.key)), catalog: o.readCatalogFor?.(text) ?? o.readCatalog };
  };
  const items = all.map((line, i) => ({ line, i, key: PROMPT.READ_SCOPED_ITEM_KEY + motionInputKey([IP.VERSION, story, localContext(i), analysis.stylePreset, o.exec, why[line.key]]) }));
  const savedItems = new Map<number, PuppetReadDraft>();
  for (const group of groupsOf(all, P.READ_PER_CALL)) {
    const legacyKey = motionInputKey([group, analysis.cast, analysis.places, analysis.stylePreset, o.exec, o.readCatalog, group.map((line) => why[line.key])]);
    const legacy = o.readDrafts?.[legacyKey];
    if (legacy)
      for (const [index, line] of group.entries()) {
        const row = legacy.rows.find((value) => value.i === index);
        const item = line && items.find((entry) => entry.line.key === line.key);
        if (item) savedItems.set(item.i, { rows: row ? [{ ...structuredClone(row), i: 0 }] : [], state: structuredClone(legacy.state) });
      }
  }
  for (const item of items) {
    const legacyKey = PROMPT.READ_ITEM_KEY + motionInputKey([IP.VERSION, item.line, analysis.cast, analysis.places, analysis.stylePreset, o.exec, o.readCatalog, why[item.line.key]]);
    if (o.readDrafts?.[legacyKey]) savedItems.set(item.i, structuredClone(o.readDrafts[legacyKey]));
  }
  for (const item of items) if (o.readDrafts?.[item.key]) savedItems.set(item.i, structuredClone(o.readDrafts[item.key]));
  const drafts = new Map<number, any>();
  const issues = new Map<number, string[]>();
  const fields = new Map<number, string[]>();
  let changed = false;
  const states = new Map(items.map((item) => [item.i, savedItems.get(item.i)?.state || { rejected: 0, errors: [] as string[] }]));
  const checkpoint = (targets: typeof items): void => {
    o.signal?.throwIfAborted();
    for (const item of [...targets].sort((a, b) => Number(!!result.reads[a.line.key]) - Number(!!result.reads[b.line.key]))) if (drafts.has(item.i) || states.get(item.i)!.rejected) o.onReadDraft?.(item.key, { rows: drafts.has(item.i) ? [{ ...structuredClone(drafts.get(item.i)), i: 0 }] : [], state: structuredClone(states.get(item.i)!) });
    if (changed) {
      changed = false;
      accepted?.(result);
    }
  };
  const assess = (targets: typeof items, raw: any): string[] => {
    const rows: any[] = Array.isArray(raw?.lines) ? raw.lines : [];
    const counts = _.countBy(
      rows.filter((row) => Number.isInteger(row?.i)),
      (row) => row.i,
    );
    const allowed = new Set(targets.map((item) => item.i));
    for (const row of rows) {
      const i = row?.i;
      if (!Number.isInteger(i) || !allowed.has(i) || result.reads[all[i]?.key]) continue;
      if (counts[i] !== 1) {
        issues.set(i, [V.READ_DUPLICATE]);
        continue;
      }
      const before = drafts.get(i);
      const patch = { ...row };
      if (before && Array.isArray(row.states) && Array.isArray(before.states)) patch.states = [...before.states.map((state: any) => (fields.get(i)?.includes(RT_SERVER.STATES_923B4B) ? state : { ...state, ...row.states.find((entry: any) => entry.char === state.char) })), ...row.states.filter((state: any) => !before.states.some((entry: any) => entry.char === state.char))];
      const draft = before ? mergePuppetReadRepair(before, patch, fields.get(i) || []) : canonicalPuppetReadObjects(structuredClone(row));
      drafts.set(i, draft);
      const fresh: Record<string, PuppetPlace> = {};
      const closed = !!closedPuppetPackId(analysis.stylePreset);
      const checked = readOf(draft, all[i], cast, { ...places, ...result.newPlaces }, fresh, closed);
      if (closed) {
        const history = all.slice(0, i);
        const optionalInvalid = (object: PuppetObject) => object.essential === false && ([RT_SHARED.HELD, RT_SERVER.SHOULDER] as string[]).includes(object.mount) && !puppetHoldingEvidence(object, all[i], analysis.cast, history);
        const keep = checked.read.objects!.map((object) => !optionalInvalid(object));
        checked.read.objects = checked.read.objects?.filter((_, index) => keep[index]);
        checked.objectPaths = checked.objectPaths.filter((_, index) => keep[index]);
        if (checked.read.object && optionalInvalid(checked.read.object)) checked.read.object = null;
        const semanticIssues = puppetIllustrationReadIssues(checked.read, all[i], analysis.cast, all.slice(0, i));
        checked.errors.push(...semanticIssues.map((issue) => issue.reason));
        checked.paths.push(...semanticIssues.map((issue) => issue.path.replace(/^objects\.(\d+)(?=\.|$)/u, (path, index) => checked.objectPaths[Number(index)] || path)), ...(semanticIssues.some((issue) => issue.reason === IP.INVALID_HOLD) ? ([RT_SHARED.OBJECT, RT_SHARED.OBJECTS_E4CD30] as string[]) : []));
        for (const [at, object] of draft.objects.entries())
          if (object?.placement && !cleanPuppetObjectPlacement(object.placement, all[i].text)) {
            checked.errors.push(IP.INVALID_PLACEMENT);
            checked.paths.push(RT_SHARED.OBJECTS + at + RT_SERVER.PLACEMENT);
          }
        if (!checked.errors.length) checked.read.states = simplePuppetStates(checked.read.states || [], all[i].text);
      }
      if (checked.read.visual) draft.visual = structuredClone(checked.read.visual);
      issues.set(i, checked.errors);
      fields.set(i, checked.paths);
      if (checked.errors.length) continue;
      result.reads[all[i].key] = checked.read;
      o.log(motionSceneProgress(PROGRESS.STAGE.READ, PROGRESS.STATUS.DONE, all[i], all, places));
      o.log(PROGRESS.SUMMARY(PROGRESS.STAGE.READ, all.length - lines.length + Object.keys(result.reads).length, all.length));
      Object.assign(result.newPlaces, fresh);
      changed = true;
    }
    return targets.filter((item) => !result.reads[item.line.key]).map((item) => V.READ_ISSUE(item.line.key, item.line.text, issues.get(item.i)?.length ? issues.get(item.i)! : [V.READ_MISSING_ROW]));
  };
  for (const item of items.filter((item) => requested.has(item.line.key))) {
    const saved = savedItems.get(item.i);
    if (saved?.rows.length) assess([item], { lines: [{ ...saved.rows[0], i: item.i }] });
    if (!result.reads[item.line.key] && !why[item.line.key] && item.line.visualUnit?.read) assess([item], { lines: [{ ...item.line.visualUnit.read, i: item.i }] });
    const state = states.get(item.i)!;
    const exhausted = state.rejected >= PRODUCTION.CONTRACT_TOTAL_ATTEMPTS || Object.values(state.routes || {}).some((attempts) => attempts >= PRODUCTION.CONTRACT_ROUTE_ATTEMPTS);
    if (!result.reads[item.line.key] && exhausted && fields.get(item.i)?.some((field) => V.READ_PROP_PATH.test(field))) {
      const recovered = recoverMotionAiContractState(state, V.READ_REPAIR_REVISION);
      if (recovered !== state) {
        states.set(item.i, recovered);
        o.log(V.READ_RECOVERY_LOG(item.i + 1, all.length));
      }
    }
  }
  checkpoint(items.filter((item) => requested.has(item.line.key)));
  const questionBase = (targets: typeof items): string => {
    const first = targets[0] || items[0];
    const context = all.slice(Math.max(0, first.i - SB.CONTEXT_LINES), first.i);
    const localLines = [...context, ...targets.map(({ line }) => line)];
    const localText = localLines.map((line) => ([line.text, line.action, stringifyJson(line.scenePlan)] as string[]).filter(Boolean).join(P.SPACE)).join(P.NL);
    const catalog = o.readCatalogFor?.(localText) ?? o.readCatalog ?? P.EMPTY;
    const localCast = analysis.cast.filter((member) => localLines.some((line) => line.cast?.includes(member.key) || line.speaker === member.key || wordIn(member.name, line.text)));
    const localCastText = castText({ ...analysis, cast: localCast.length ? localCast : analysis.cast });
    const localPlaceKeys = new Set(localLines.flatMap((line) => [line.place, ...(line.sourcePlans || []).map((plan) => plan.place)]).filter(Boolean));
    const localPlaceText = _.values(places)
      .filter((place) => !localPlaceKeys.size || localPlaceKeys.has(place.key))
      .map((place) => [place.key, _.truncate(place.name + P.DASH + place.desc, { length: 140 })].join(P.SEP))
      .join(P.NL);
    const repairing = targets.length > 0 && targets.every((target) => drafts.has(target.i));
    const pending = targets.map(({ line, i }) => ({ i, key: line.key, text: line.text, plan: puppetLineContext(line), draft: drafts.get(i), allowedFields: fields.get(i), errors: issues.get(i) || [V.READ_MISSING_ROW] }));
    if (repairing) {
      const needsObjects = pending.some((target) => !target.allowedFields?.length || target.allowedFields.some((field) => V.READ_PROP_PATH.test(field)));
      return (
        [
          V.READ_PENDING,
          V.READ_PATCH_SCHEMA,
          V.READ_REPAIR,
          SB.READ,
          SELECTION.READ_PROMPT,
          SELECTION.SPATIAL_PROMPT,
          P.READ_POSTURE_PROMPT,
          B.READ_REPAIR,
          APPEARANCE.READ,
          V.READ_REPAIR_CAST + localCastText,
          V.READ_REPAIR_PLACES + localPlaceText,
          V.READ_REPAIR_CONTEXT + stringifyJson({ story, previous: puppetStoryContext(context) + P.NL + previousOf(all, first.line.key) }),
          V.READ_DRAFT + stringifyJson(pending),
          V.READ_ACCEPTED + stringifyJson(items.filter((item) => result.reads[item.line.key] && Math.abs(item.i - first.i) <= SB.CONTEXT_LINES).map((item) => item.i)),
          ...(needsObjects ? [P.WHY_READ, I.OBJECT_PROMPT, catalog] : []),
        ] as string[]
      ).join(P.NL);
    }
    if (closedPuppetPackId(analysis.stylePreset))
      return (
        [
          PROMPT.READ_CLOSED,
          IP.PROMPT,
          IP.READ_SCHEMA,
          PUPPET_READ_SCHEMA,
          P.READ_POSTURE_PROMPT,
          P.EYE_PROMPT,
          APPEARANCE.READ,
          V.OWNERSHIP,
          SELECTION.SPATIAL_PROMPT,
          M.CONDITION_PROMPT,
          stringifyJson({
            story,
            cast: localCastText,
            places: localPlaceText,
            previous: puppetStoryContext(context),
            targets: targets.map(({ line, i }) => ({ i, key: line.key, text: line.text, plan: parseJson(puppetLineContext(line)), correction: why[line.key], errors: issues.get(i) })),
            blocking: B.KINDS,
            variants: B.VARIANTS,
            actions: Object.keys(P.ACTIONS),
            gestures: P.GESTURES,
            types: P.OBJECT_TYPES,
            mounts: P.MOUNTS,
            light: P.LIGHTS,
            emotion: P.EXPRS,
            overlays: P.OVERLAYS,
          }),
          catalog,
          V.READ_TARGETS + stringifyJson(targets.map(({ line, i }) => ({ i, key: line.key }))),
        ] as string[]
      ).join(P.NL);
    const text = targets.map(({ line, i }) => [i, line.speaker || P.EMPTY, line.text, puppetLineContext(line), [why[line.key], ...(issues.get(i) || [])].filter(Boolean).join(P.SEP)].join(P.SEP)).join(P.NL);
    return (
      [
        PR.READ({ story: story + P.NL + puppetStoryContext(context), cast: castText(analysis), places: placeText, previous: previousOf(all, first.line.key), lines: text }),
        P.EYE_PROMPT,
        o.readCatalog ? P.EMPTY : puppetPackStoryCapabilities(analysis.stylePreset, analysis),
        o.readCatalog || P.EMPTY,
        ...(closedPuppetPackId(analysis.stylePreset) ? [SELECTION.READ_PROMPT, SELECTION.SPATIAL_PROMPT] : []),
        V.READ_TARGETS + stringifyJson(targets.map(({ line, i }) => ({ i, key: line.key }))),
      ] as string[]
    ).join(P.NL);
  };
  const question = (targets: typeof items): string => withMotionResponsePrompt(P.ARTIFACT_READ, questionBase(targets));
  const pending = items.filter((item) => requested.has(item.line.key) && !result.reads[item.line.key]);
  const budget = pending.length && closedPuppetPackId(analysis.stylePreset) ? motionPromptPayloadBudget(question([]).length) : undefined;
  const sameRepairState = (a: number, b: number): boolean => states.get(a)!.rejected === states.get(b)!.rejected && stringifyJson(states.get(a)!.routes || {}) === stringifyJson(states.get(b)!.routes || {});
  const groups = motionPromptGroups(pending, question, PROMPT.READ_ITEMS, budget, (before, next) => !!drafts.get(before.i) !== !!drafts.get(next.i) || !sameRepairState(before.i, next.i));
  o.log(P.LOG_READ(lines.length, groups.length));
  await mapMotionAiPool(
    groups,
    async (group) => {
      while (group.some((item) => !result.reads[item.line.key])) {
        o.signal?.throwIfAborted();
        const open = group.filter((item) => !result.reads[item.line.key]);
        const first = open[0];
        const bucket = open.filter((item) => !!drafts.get(item.i) === !!drafts.get(first.i) && sameRepairState(item.i, first.i));
        const targets = motionPromptGroups(bucket, question, PROMPT.READ_ITEMS, budget)[0];
        for (const target of targets) o.log(motionSceneProgress(PROGRESS.STAGE.READ, PROGRESS.STATUS.START, target.line, all, places));
        const state = structuredClone(states.get(first.i)!);
        const contract: MotionAiResponseContract = {
          targetIds: targets.map((item) => item.line.key),
          attempts: V.READ_ATTEMPTS,
          budget: closedPuppetPackId(analysis.stylePreset) ? PRODUCTION.CONTRACT_TOTAL_ATTEMPTS : V.READ_ATTEMPTS,
          routeAttempts: closedPuppetPackId(analysis.stylePreset) ? PRODUCTION.CONTRACT_ROUTE_ATTEMPTS : undefined,
          yieldAfterReject: true,
          state,
          checkpoint: (value) => {
            for (const item of targets.filter((target) => !result.reads[target.line.key])) states.set(item.i, { ...states.get(item.i)!, rejected: value.rejected, errors: issues.get(item.i) || [V.READ_MISSING_ROW], ...(value.routes ? { routes: structuredClone(value.routes) } : {}) });
            checkpoint(targets);
          },
          start: () => question(targets.filter((target) => !result.reads[target.line.key])),
          assess: (raw) => ({ value: result, errors: assess(targets, raw) }),
          repair: () => question(targets.filter((target) => !result.reads[target.line.key])),
          failure: (errors) => new Error(V.READ_FAILURE(errors)),
          rejected: async (raw, _value, errors, route, attempt) => {
            o.log(V.READ_RETRY_LOG(attempt, errors));
            await writeMotionAiDebug(V.READ_DEBUG_PREFIX + randomUUID(), { stage: V.READ_STAGE, artifact: P.ARTIFACT_READ, provider: route.provider, model: route.model, attempt, errors, requested: targets.map(({ line, i }) => ({ i, key: line.key, text: line.text })), response: raw, drafts: Object.fromEntries(targets.map((item) => [item.i, drafts.get(item.i)])), accepted: result.reads });
          },
        };
        if (o.ai) await requestMotionAiContract(question(targets), o.exec, (prompt) => o.ai!(prompt, P.ARTIFACT_READ, o.exec, o.signal, o.log), contract, o.signal);
        else await runMotionAi(question(targets), P.ARTIFACT_READ, o.exec, o.signal, o.log, undefined, 0, contract);
        checkpoint(targets);
      }
    },
    puppetLanes(o.exec),
  );
  return result;
};
const poseOf = (r: PuppetRead): string => P.ACTIONS[r.action] || P.POSE_DEFAULT;
const exprOf = (r: PuppetRead): string => (_.includes(P.SLEEP_ACTIONS, r.action) ? P.EXPR_SLEEP : r.emotion);
export const readFrame = (r: PuppetRead, line: PuppetLine, cast: string[]): PuppetFrame => {
  const who = r.who;
  const big = r.object && r.object.size >= P.SIZE_SMALL;
  const shot = r.focus === P.FOCUS_OBJECT && r.object ? (big ? P.SHOT_OBJECT : P.SHOT_INSERT) : who.length > 2 ? P.SHOT_GROUP : who.length === 2 ? P.SHOT_TWO : who.length ? P.SHOT_DEFAULT : r.object ? P.SHOT_INSERT : P.SHOT_ESTABLISHING;
  return normalizePuppetFrame({ shot, place: r.place, light: r.light, prop: r.object?.key, effectSource: r.effectSource, overlays: r.overlays, actors: _.map(who, (c) => ({ char: c, pose: c === r.focus || who.length === 1 ? poseOf(r) : P.POSE_DEFAULT, expr: exprOf(r) })) }, line, cast);
};
const composeOf = (raw: any, r: PuppetRead, line: PuppetLine, cast: string[], spots: PuppetSpot[]): PuppetFrame => {
  const keys = new Set(_.map(spots, (s) => s.key));
  const allowed = new Set([...r.who, ...(!line.visualUnit && line.speaker ? [line.speaker] : [])]);
  const fill = (x: any) => {
    const actors = _.filter(_.castArray(x?.actors || []), (a: any) => allowed.has(_.toString(a?.char)));
    const listed = new Set(_.map(actors, (a: any) => _.toString(a?.char)));
    const simultaneous = !!r.blocking || ((r.states || []).length > 1 && (r.states || []).some((s) => !!s.support || !!s.target));
    const shot = simultaneous && !_.includes(P.BLOCKING_SHOTS, x?.shot) ? P.SHOT_DEFAULT : _.toString(x?.shot);
    const needs = !_.includes(P.SHOT_NOBODY, shot) && shot !== P.SHOT_INSERT;
    const missing =
      needs && (!actors.length || simultaneous)
        ? _.map(
            _.filter(r.who, (c) => !listed.has(c)),
            (c) => ({ char: c, pose: c === r.focus ? poseOf(r) : P.POSE_DEFAULT, expr: exprOf(r) }),
          )
        : [];
    return {
      ...x,
      shot,
      place: r.place,
      light: r.light,
      prop: r.object?.key || null,
      overlays: r.overlays,
      effectSource: r.effectSource,
      effectTarget: r.effectTarget,
      effectMode: r.effectMode,
      propAt: keys.has(_.toString(x?.propAt)) ? x.propAt : null,
      anchor: keys.has(_.toString(x?.anchor)) ? x.anchor : undefined,
      actors: _.map([...actors, ...missing], (a: any) => {
        const spot = _.find(spots, { key: _.toString(a?.spot) });
        const pose = _.includes(P.POSES, a?.pose) ? a.pose : a.char === r.focus ? poseOf(r) : P.POSE_DEFAULT;
        return { ...a, spot: spot?.key, pose, expr: _.includes(P.EXPRS, a?.expr) ? a.expr : exprOf(r) };
      }),
    };
  };
  const frame = normalizePuppetFrame({ ...fill(raw), shot2: !line.visualUnit && raw?.shot2 && _.isObject(raw.shot2) ? fill(raw.shot2) : null }, line, cast);
  return fitPuppetRead(frame, r, spots);
};
export const fitPuppetRead = (frame: PuppetFrame, r: PuppetRead, spots: PuppetSpot[] = []): PuppetFrame => {
  if (!frame.actors.length && r.who.length && !_.includes(P.SHOT_PROP, frame.shot)) frame = { ...frame, shot: P.SHOT_DEFAULT, actors: r.who.map((char) => ({ char, pose: P.POSE_DEFAULT, expr: r.emotion, face: P.FACE_DEFAULT })) };
  const heldObjects = puppetReadObjects(r).filter((object) => object.mount === P.MOUNT_HELD_KEY || object.mount === P.MOUNT_SHOULDER);
  frame = { ...frame, actors: frame.actors.map((actor) => ({ ...actor, hold: heldObjects.some((object) => object.key === actor.hold && (!object.owner || object.owner === actor.char)) ? actor.hold : undefined })) };
  const states = _.keyBy(r.states || [], (s) => s.char);
  const used = new Set<string>();
  const assigned = puppetSupportAssignments(r.states || [], spots, new Map(frame.actors.filter((a) => a.spot).map((a) => [a.char, a.spot!])));
  const reserved = new Map([...(assigned || [])].map(([char, spot]) => [spot, char]));
  let out: PuppetFrame = {
    ...frame,
    set: r.place || frame.set,
    blocking: r.blocking,
    effectSource: r.effectSource,
    effectTarget: r.effectTarget,
    effectMode: r.effectMode,
    actors: frame.actors.map((a) => {
      const state = states[a.char];
      if (!state) return a;
      const pose = puppetStatePose(state);
      const kind = P.POSE_KIND[pose] || P.SPOT_STAND;
      const matches = spots.filter((s) => !used.has(s.key) && (!reserved.has(s.key) || reserved.get(s.key) === a.char) && (s.kind === kind || (kind === P.SPOT_STAND && s.kind === P.SPOT_DOOR)));
      const support = state.support ? spots.find((s) => s.key === assigned?.get(a.char)) : null;
      const own = spots.find((s) => s.key === a.spot);
      const spot = state.support ? support?.key : own && matches.includes(own) ? own.key : undefined;
      if (spot) used.add(spot);
      const expr = state.eyes ? (state.eyes.state === P.EYE_CLOSED ? P.EXPR_SLEEP : a.expr === P.EXPR_SLEEP ? P.EXPR_DEFAULT : a.expr) : _.includes(P.SLEEP_ACTIONS, state.action) ? P.EXPR_SLEEP : a.expr;
      return { ...a, ...(r.blocking && Object.values(r.blocking.roles).includes(a.char) ? { depth: P.DEPTH_MID } : {}), pose, gesture: state.gesture, expr, support: state.support, target: state.target, spot };
    }),
  };
  out = fitObject(out, r, spots);
  out.propRot = r.object?.rotation;
  out.propMount = r.object?.mount;
  out.propSupport = r.object?.support;
  const items = [];
  for (const ob of puppetReadObjects(r).filter((ob) => ob.key !== r.object?.key)) {
    if (ob.owner && [P.MOUNT_HELD_KEY, P.MOUNT_SHOULDER, P.MOUNT_WEAR].some((mount) => mount === ob.mount) && !out.actors.some((actor) => actor.char === ob.owner)) continue;
    const applied = fitObject({ ...out, prop: ob.key, shot2: null }, { ...r, object: ob, action: ob.owner && states[ob.owner] ? states[ob.owner].action : r.action }, spots);
    out.actors = applied.actors;
    if (applied.prop && !out.actors.some((a) => a.hold === ob.key || a.wear?.includes(ob.key))) items.push({ prop: ob.key, propMount: ob.mount, propSupport: ob.support, propRot: ob.rotation, propAt: frame.items?.find((it) => it.prop === ob.key)?.propAt || undefined });
  }
  out.items = items.length ? items : undefined;
  if (out.shot === P.SHOT_OTS && out.actors.some((a) => a.support && _.includes(P.LOW_POSES, a.pose))) {
    out.shot = P.SHOT_DEFAULT;
    out.actors = out.actors.map((a) => ({ ...a, depth: P.DEPTH_MID }));
  }
  if (frame.shot2) out.shot2 = fitPuppetRead(frame.shot2, r, spots);
  return withPuppetFrameAppearance(out, r);
};
const fitHands = (f: PuppetFrame, r: PuppetRead): PuppetFrame => {
  const key = r.object?.key;
  const shoulder = r.object?.mount === P.MOUNT_SHOULDER;
  const uses = !!key && (r.object!.mount === P.MOUNT_HELD_KEY || shoulder);
  let actors = _.map(f.actors, (a) => ({ ...a, hold: uses && a.hold === key && (!r.object?.owner || r.object.owner === a.char) ? key : a.hold && a.hold !== key ? a.hold : undefined }));
  if (uses && !actors.length && _.includes(r.who, r.focus)) actors = [{ char: r.focus, pose: poseOf(r), expr: exprOf(r), face: P.FACE_DEFAULT, depth: P.DEPTH_MID, hold: undefined }];
  const holder = r.object?.owner ? _.find(actors, { char: r.object.owner }) : _.find(actors, { char: r.focus }) || (actors.length === 1 ? actors[0] : null);
  if (uses && holder && !_.some(actors, (a) => a.hold === key) && actors.length) actors = _.map(actors, (a) => (a === holder ? { ...a, hold: key } : a));
  actors = _.map(actors, (a) => {
    if (!a.hold) return a;
    if (_.includes(P.LOW_POSES, a.pose)) return a;
    if (shoulder) return { ...a, pose: P.POSE_SHOULDER };
    return _.includes(P.HOLD_POSES, a.pose) ? a : { ...a, pose: _.includes(P.HOLD_POSES, P.ACTIONS[r.action]) ? P.ACTIONS[r.action] : P.POSE_HOLD };
  });
  const held = _.some(actors, (a) => a.hold === key);
  return { ...f, actors, shot: held && _.includes(P.HOLD_SHOTS, f.shot) ? P.SHOT_DEFAULT : f.shot };
};
const fitFeature = (f: PuppetFrame, r: PuppetRead, spots: PuppetSpot[]): PuppetFrame => {
  const key = r.object!.key;
  const actors = _.map(f.actors, (a) => {
    if (a.char !== r.focus && f.actors.length > 1) return a;
    const own = _.find(spots, { key: a.spot });
    const kind = P.POSE_KIND[a.pose] || P.SPOT_STAND;
    const sp = puppetFeatureSpot(
      spots.filter((s) => s.kind === kind || (kind === P.SPOT_STAND && s.kind === P.SPOT_DOOR)),
      a.support || key,
      kind,
    );
    if (!sp || (own && _.intersection(tokens(key), tokens(own.key)).length)) return a;
    return { ...a, spot: sp.key };
  });
  const shot = _.includes(P.SHOT_PROP, f.shot) ? (actors.length ? P.SHOT_DEFAULT : P.SHOT_ESTABLISHING) : f.shot;
  return { ...f, actors, shot, prop: null, propAt: null };
};
const fitWear = (f: PuppetFrame, r: PuppetRead): PuppetFrame => {
  const key = r.object!.key;
  const owner = r.object?.owner || (_.includes(r.who, r.focus) ? r.focus : r.who.length === 1 ? r.who[0] : undefined);
  const actors = _.map(f.actors, (a) => ({ ...a, wear: a.char === owner ? _.uniq([...(a.wear || []), key]) : (a.wear || []).filter((item) => item !== key) }));
  return { ...f, actors, prop: f.shot === P.SHOT_INSERT ? f.prop : null };
};
const fitObject = (f: PuppetFrame, r: PuppetRead, spots: PuppetSpot[] = []): PuppetFrame => {
  let out = { ...f };
  const ob = r.object;
  if (ob && puppetObjectClass(ob) === PA.SCENERY) out = fitFeature(out, r, spots);
  else if (ob && ob.mount === P.MOUNT_WEAR) out = fitWear(out, r);
  else if (ob && ob.mount === P.MOUNT_BODY) out = ob.owner ? fitWear(out, r) : { ...out, shot: _.includes(P.CLOSE_SHOTS, out.shot) ? out.shot : P.SHOT_INSERT, prop: ob.key, actors: _.map(out.actors, (a) => (a.hold === ob.key ? _.omit(a, P.HOLD_FIELD) : a)) as PuppetFrame["actors"] };
  else {
    if (ob && out.shot === P.SHOT_OBJECT && ob.size < P.SIZE_SMALL && !_.some(out.actors, (a) => a.hold)) out.shot = P.SHOT_INSERT;
    if (out.shot !== P.SHOT_INSERT || ob?.mount === P.MOUNT_HELD_KEY || ob?.mount === P.MOUNT_SHOULDER) out = fitHands(out, r);
  }
  if (out.shot2) out.shot2 = fitObject(out.shot2, r, spots);
  return out;
};
interface PuppetComposeCtx {
  spots: (place: string | undefined, light?: string) => PuppetSpot[];
  spotsText: (place: string) => string;
  framing: string;
}
export const composePuppetLines = async (lines: PuppetLine[], all: PuppetLine[], analysis: MotionStoryAnalysis, reads: Record<string, PuppetRead>, why: Record<string, string>, ctx: PuppetComposeCtx, o: PuppetRunOptions): Promise<Record<string, PuppetFrame>> => {
  const cast = _.map(analysis.cast, (c) => c.key);
  const castNames = castText(analysis);
  const genre = puppetGenreRules(analysis.videoGenre);
  const frames: Record<string, PuppetFrame> = {};
  const groups = groupsOf(lines, P.COMPOSE_PER_CALL);
  o.log(P.LOG_COMPOSE(lines.length, groups.length));
  await mapMotionAiPool(
    groups,
    async (group) => {
      for (const line of group) o.log(motionSceneProgress(PROGRESS.STAGE.BUILD, PROGRESS.STATUS.START, line, all, _.keyBy(analysis.places, RT_SHARED.KEY)));
      const placeKeys = _.uniq(_.compact(_.map(group, (l) => reads[l.key]?.place)));
      const text = _.map(group, (l, i) => {
        const r = reads[l.key];
        const obj = r.object ? [r.object.key, r.object.size, r.object.mount].join(P.COMMA) : P.EMPTY;
        return [
          i,
          l.text,
          r.focus,
          r.who.join(P.COMMA),
          r.place || P.EMPTY,
          obj,
          r.action,
          r.emotion,
          l.speaker || P.EMPTY,
          stringifyJson(r.states || []),
          stringifyJson(puppetReadObjects(r)),
          stringifyJson(r.blocking || null),
          puppetLineContext(l),
          stringifyJson(r.visual),
          stringifyJson({ fixtures: r.fixtureStates, effectSource: r.effectSource, effectTarget: r.effectTarget, effectMode: r.effectMode }),
          why[l.key] ? P.FIX_PREFIX + why[l.key] : P.EMPTY,
        ].join(P.SEP);
      }).join(P.NL);
      const raw = await (o.ai || runMotionAi)(PR.COMPOSE({ genre, framing: ctx.framing, cast: castNames, places: _.map(placeKeys, ctx.spotsText).join(P.NL), previous: previousOf(all, group[0].key), lines: text }) + P.NL + SB.COMPOSE + P.NL + I.PROMPT, P.ARTIFACT_COMPOSE, o.exec, o.signal, o.log).catch((e: any) => {
        if (isTerminalMotionAiError(e, o.signal)) throw e;
        o.log(P.LOG_COMPOSE_FAIL(String(e?.message || e)));
        return null;
      });
      const rows = Array.isArray(raw?.frames) ? raw.frames : [];
      const counts = _.countBy(rows, (row) => row?.i);
      for (const it of rows) {
        if (!Number.isInteger(it?.i) || counts[it.i] !== 1 || motionResponseIssues(it, MOTION_RESPONSE_SCHEMAS[P.ARTIFACT_COMPOSE].properties!.frames.items!).length) continue;
        const line = group[it.i];
        if (!line || !reads[line.key]) continue;
        frames[line.key] = composeOf(it, reads[line.key], line, cast, ctx.spots(reads[line.key].place, reads[line.key].light));
      }
    },
    puppetLanes(o.exec),
  );
  const missing = _.filter(lines, (l) => !frames[l.key]);
  if (missing.length) {
    o.log(P.LOG_COMPOSE_MISSING(missing.length));
    for (const l of missing) frames[l.key] = fitPuppetRead(readFrame(reads[l.key], l, cast), reads[l.key], ctx.spots(reads[l.key].place, reads[l.key].light));
  }
  for (const line of lines) if (frames[line.key]) o.log(motionSceneProgress(PROGRESS.STAGE.BUILD, PROGRESS.STATUS.DONE, line, all, _.keyBy(analysis.places, RT_SHARED.KEY)));
  return frames;
};
