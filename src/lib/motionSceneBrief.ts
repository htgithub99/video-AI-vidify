import { MOTION_SCENE_BRIEF as B } from "../constants/motionSceneBrief.js";
import { MOTION_ILLUSTRATION_PROFILES } from "../constants/motionIllustrationProfiles.js";
import { MOTION_FRAME_MAX_EXTRA, MOTION_FRAME_STAND, type MotionFramePose } from "../constants/motionProfiles/characterFrames/poses.js";
import { motionFramePose, motionFrameSvg } from "./motionCharacterFrames.js";
import { MOTION_PROFILE_SCENES } from "../constants/motionProfiles/scenes.js";
import { MOTION_OBJECT_HANDHELD_MAX_FRAMES, MOTION_OBJECT_KIND_MAX_FRAMES } from "../constants/motionObjectKinds.js";
import { motionAnimalLegs, motionObjectKind, motionObjectPartNames } from "./motionObjectKinds.js";
import { motionUnitTargets } from "./motionUnits.js";
import { MOTION_UNIT_LABEL, MOTION_UNIT_MAX_FRAMES, MOTION_UNIT_NOTES, MOTION_UNIT_PARTS, type MotionUnit } from "../constants/motionUnits.js";
import { MOTION_OBJECT_CLASS_LABEL, MOTION_OBJECT_CLASS_LEGS, MOTION_OBJECT_CLASS_NOTES } from "../constants/motionObjectClasses.js";
import { motionSceneObjects } from "./motionObjects.js";
import { stringifyJson } from "./jsonStringify.js";
import type { MotionAnalysisGroup, MotionCastMember } from "../types/motionVideo.js";
import type { MotionRemotionEffect, MotionRemotionNode, MotionRemotionProfile, MotionRemotionScene, MotionSceneObject } from "../types/motionVisual.js";
export interface MotionSceneBriefContext {
  width: number;
  height: number;
  viewBox: string;
  artDirection: { id: MotionRemotionProfile; device?: string };
  renderBehavior?: unknown;
  era?: string;
  place?: { name?: string; description?: string };
  scene: Pick<MotionRemotionScene, "purpose" | "text" | "format" | "effects" | "environment" | "time" | "weather" | "view" | "camera" | "lead" | "detailSubject" | "objects"> & { nodes: MotionRemotionNode[] };
  cast?: MotionCastMember[];
  groups?: MotionAnalysisGroup[];
  dialogueSpeakers?: string[];
  poseNotes?: string[];
  animalFrames?: { animal: string; svg: string; note: string }[];
  sheets?: { id: string; svg: string }[];
  placeNotes?: string;
  genreLine?: string;
  note?: string;
}
const CHARACTER = "character";
const PROP = "prop";
const LABEL = "label";
const DETAIL = "detail";
const CLOSE_VIEWS: readonly string[] = ["close", "medium_close"];
const WHOLE_VIEWS: readonly string[] = ["wide", "medium", "establishing", "over_shoulder"];
const HANDS_WITH_OBJECT = "handsWithObject";
const MOUNTED = "mounted";
const personPose = (id: MotionRemotionProfile, node: MotionRemotionNode): MotionFramePose => motionFramePose(id, node.stance, node.facing);
const scenePoses = (id: MotionRemotionProfile, nodes: MotionRemotionNode[]): MotionFramePose[] => {
  const people = nodes.filter((node) => node.kind === CHARACTER && !node.animal && node.representation !== DETAIL && !node.unit);
  const counts = new Map<MotionFramePose, number>();
  for (const node of people) {
    const pose = personPose(id, node);
    if (pose !== MOTION_FRAME_STAND) counts.set(pose, (counts.get(pose) || 0) + (node.entityId && !node.anonymous ? 2 : 1));
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, MOTION_FRAME_MAX_EXTRA).map(([pose]) => pose);
};
const nameOf = (node: MotionRemotionNode, cast: MotionCastMember[]): string => cast.find((member) => member.key === node.entityId)?.name || node.id;
export const motionSceneBriefLines = (context: MotionSceneBriefContext): string[] => {
  const id = context.artDirection.id;
  const profile = MOTION_ILLUSTRATION_PROFILES[id];
  const scene = context.scene;
  const cast = context.cast || [];
  const groups = context.groups || [];
  const view = scene.view;
  const people = scene.nodes.filter((node) => node.kind === CHARACTER && !node.animal);
  const named = people.filter((node) => node.entityId && !node.anonymous);
  const crowds = people.filter((node) => node.anonymous || node.crowd);
  const objects = motionSceneObjects(scene);
  const objectIds = new Set(objects.map((item) => item.id));
  const props = scene.nodes.filter((node) => node.kind === PROP && !objectIds.has(node.id) && !node.animal);
  const labels = scene.nodes.filter((node) => node.kind === LABEL);
  const sections: string[] = [];
  const extraPoses = scenePoses(id, scene.nodes);
  const when = [B.WHEN_LINE(context.era, context.place?.name, scene.time, scene.weather), scene.environment ? B.ENVIRONMENT_LINE(scene.environment) : "", context.place?.description ? context.place.description : ""].filter(Boolean);
  sections.push(B.SECTION(B.HEADINGS.WHEN, when));
  sections.push(B.SECTION(B.HEADINGS.STORY, [B.PURPOSE_LINE(scene.purpose), scene.text ? B.TEXT_LINE(scene.text) : "", context.note || ""].filter(Boolean)));
  const device = context.artDirection.device;
  const cameraLines = [device ? B.FORMAT_LINE(device) : view ? B.VIEWS[view] || "" : "", scene.camera ? B.CAMERA_LINE(scene.camera) : "", scene.lead ? B.LEAD_LINE(nameOf(scene.nodes.find((node) => node.id === scene.lead) || ({ id: scene.lead } as MotionRemotionNode), cast)) : "", B.FREE_LAYOUT].filter(Boolean);
  sections.push(B.SECTION(B.HEADINGS.CAMERA, cameraLines));
  const personLines = named.concat(people.filter((node) => !named.includes(node) && !crowds.includes(node))).flatMap((node) => {
    const member = cast.find((item) => item.key === node.entityId);
    const group = member ? undefined : groups.find((item) => item.key === (node.groupKey || node.crowd?.groupKey));
    const lines = [B.PERSON(node.id, member?.name || node.id, member?.role)];
    const identity = member ? B.PERSON_IDENTITY(member.marks || [], member.skin, member.origin) : group ? B.GROUP_LOOK(group.origin, group.skin, group.outfit, group.gear, group.faction, group.look) : "";
    if (identity) lines.push(identity);
    if (member?.look) lines.push(B.PERSON_LOOK(member.look));
    lines.push(B.PERSON_ACTION(node.description, node.pose, node.posture, node.support));
    const pose = personPose(id, node);
    if (node.unit) lines.push(B.UNIT_LINE(MOTION_UNIT_LABEL[node.unit], node.rides || node.uses?.objectId));
    else if (node.representation !== DETAIL) lines.push(B.PERSON_FRAME(node.stance, extraPoses.includes(pose) ? pose : MOTION_FRAME_STAND));
    if (node.rides) lines.push(B.PERSON_RIDES(node.rides));
    const shown = B.PERSON_SHOWN(node.representation || "");
    if (shown) lines.push(shown);
    if (node.relation && node.target) lines.push(B.PERSON_RELATION(node.relation, node.target));
    if (node.uses) lines.push(B.PERSON_USES(node.uses.objectId, node.uses.how));
    return [lines.join(" ")];
  });
  sections.push(B.SECTION(B.HEADINGS.PEOPLE, personLines));
  const groupLines = crowds.map((node) => {
    const group = groups.find((item) => item.key === node.crowd?.groupKey);
    const visible = node.unit && !node.crowd ? 1 : node.visibleCount || Math.min(node.crowd?.count || B.CROWD_WATCH_MIN, B.CROWD_WATCH_MIN);
    const pose = personPose(id, node);
    return [B.GROUP(node.id, node.description), node.unit ? B.UNIT_COUNT(visible, node.crowd?.count) : B.GROUP_COUNT(visible, node.crowd?.rows, node.crowd?.count), node.unit ? B.UNIT_LINE(MOTION_UNIT_LABEL[node.unit], node.rides || node.uses?.objectId) : node.stance ? B.PERSON_FRAME(node.stance, extraPoses.includes(pose) ? pose : MOTION_FRAME_STAND) : "", B.GROUP_LOOK(group?.origin, group?.skin, group?.outfit, group?.gear, group?.faction || node.crowd?.faction, group?.look || node.crowd?.appearance), node.crowd?.facing ? B.GROUP_FACING(node.crowd.facing, node.crowd.depth) : "", node.pose ? B.PERSON_ACTION("", node.pose, node.posture, node.support) : ""].filter(Boolean).join(" ");
  });
  sections.push(B.SECTION(B.HEADINGS.GROUPS, groupLines));
  const sheets = context.sheets || [];
  const shown = new Map<string, string>();
  const kindFrames = MOTION_PROFILE_SCENES[id].objects;
  let codeFrames = 0;
  const unitTargets = motionUnitTargets(scene);
  const ownerName = (key: string | undefined): string | undefined => {
    if (!key) return undefined;
    const member = cast.find((item) => item.key === key);
    if (member) return member.origin ? `${member.name}, ${member.origin}` : member.name;
    const group = groups.find((item) => item.key === key);
    return group ? [group.name, group.faction || group.origin].filter(Boolean).join(", ") : undefined;
  };
  const objectLines = objects.map((item: MotionSceneObject) => {
    const node = scene.nodes.find((entry) => entry.id === item.id);
    const lines = [B.OBJECT(item.id, MOTION_OBJECT_CLASS_LABEL[item.class], item.description || node?.description || item.class)];
    const owner = ownerName(item.owner);
    if (owner) lines.push(B.OBJECT_OWNER(owner));
    if (unitTargets.has(item.id)) {
      lines.push(B.OBJECT_IN_UNIT(unitTargets.get(item.id)!));
      return lines.join(" ");
    }
    if (node?.pose) lines.push(B.PERSON_ACTION("", node.pose, node.posture, node.support));
    if (node?.gait) lines.push(B.OBJECT_GAIT(node.gait));
    if (node?.relation && node.target) lines.push(B.PERSON_RELATION(node.relation, node.target));
    const sheet = sheets.find((entry) => entry.id === item.id);
    const frame = context.animalFrames?.find((entry) => entry.animal === node?.animal);
    const kind = node?.animal ? undefined : motionObjectKind(item);
    const kindFrame = kind && (shown.has(kindFrames[kind]) || codeFrames < MOTION_OBJECT_KIND_MAX_FRAMES) ? kindFrames[kind] : undefined;
    const code = frame?.svg || kindFrame;
    const reference = code || sheet?.svg;
    if (frame) lines.push(B.OBJECT_NOTE(frame.note));
    if (!reference) lines.push(B.OBJECT_NOTE(MOTION_OBJECT_CLASS_NOTES[item.class]));
    else if (shown.has(reference)) lines.push(B.OBJECT_SAME(shown.get(reference)!));
    else {
      shown.set(reference, item.id);
      if (kindFrame && reference === kindFrame) codeFrames++;
      lines.push(code ? B.OBJECT_FRAME(reference) : B.OBJECT_SHEET(reference));
    }
    return lines.join(" ");
  });
  sections.push(B.SECTION(B.HEADINGS.OBJECTS, objectLines));
  const unitKinds = [...new Set(scene.nodes.flatMap((node) => (node.unit ? [node.unit] : [])))].slice(0, MOTION_UNIT_MAX_FRAMES) as MotionUnit[];
  sections.push(B.SECTION(B.HEADINGS.UNITS, unitKinds.map((unit) => B.UNIT_BLOCK(MOTION_UNIT_LABEL[unit], MOTION_UNIT_NOTES[unit], MOTION_PROFILE_SCENES[id].units[unit]))));
  let handFrames = 0;
  const propLines = props.map((node) => {
    const line = B.PROP(node.id, node.description, node.relation, node.target, node.state);
    const listed = (scene.objects || []).find((item) => item.id === node.id);
    const kind = listed && motionObjectKind(listed);
    if (!kind || !B.HANDHELD_VIEWS.includes(view || "") || handFrames >= MOTION_OBJECT_HANDHELD_MAX_FRAMES) return line;
    handFrames++;
    return `${line} ${B.OBJECT_FRAME(kindFrames[kind])}`;
  });
  sections.push(B.SECTION(B.HEADINGS.PROPS, [...propLines, ...labels.map((node) => B.LABEL(node.id, node.description))]));
  const effects = (scene.effects || []) as MotionRemotionEffect[];
  sections.push(B.SECTION(B.HEADINGS.EFFECTS, [...effects.map((effect) => B.EFFECT(effect.id, effect.kind, effect.region, effect.source, effect.direction)), ...(context.dialogueSpeakers?.length ? [B.SPEAKERS(context.dialogueSpeakers.map((key) => cast.find((member) => member.key === key)?.name || key))] : [])]));
  if (context.genreLine) sections.push(B.SECTION(B.HEADINGS.GRAMMAR, [context.genreLine]));
  if (context.placeNotes) sections.push(B.SECTION(B.HEADINGS.PLACE, [context.placeNotes.slice(0, B.MAX_PLACE_CHARS)]));
  sections.push(B.SECTION(B.HEADINGS.WATCH, motionSceneWatchOuts(context, objects)));
  sections.push(B.SECTION(B.HEADINGS.IDS, motionSceneRequiredIds(id, named, people, crowds, objects, cast, scene.nodes)));
  sections.push(B.SECTION(B.HEADINGS.STYLE, [...profile.brief.rules, profile.brief.skin]));
  sections.push(B.CONTEXT_LINE(stringifyJson({ viewBox: context.viewBox, width: context.width, height: context.height, renderBehavior: context.renderBehavior })));
  return sections.filter(Boolean);
};
export const motionSceneWatchOuts = (context: MotionSceneBriefContext, objects: MotionSceneObject[] = motionSceneObjects(context.scene)): string[] => {
  const scene = context.scene;
  const cast = context.cast || [];
  const people = scene.nodes.filter((node) => node.kind === CHARACTER && !node.animal);
  const out: string[] = [];
  for (const node of people) if ((node.anonymous || node.crowd) && (node.visibleCount || 0) >= B.CROWD_WATCH_MIN) out.push(B.WATCH.CROWD(node.id, node.visibleCount!));
  for (const note of context.poseNotes || []) out.push(note);
  for (const node of people) if (node.relation === B.SAME_SCALE_RELATION && node.target && people.some((other) => other.id === node.target)) out.push(B.WATCH.SAME_SCALE(nameOf(node, cast), nameOf(people.find((other) => other.id === node.target)!, cast)));
  if (scene.view === DETAIL && (scene.detailSubject === HANDS_WITH_OBJECT || scene.nodes.some((node) => node.kind === CHARACTER && node.representation === DETAIL))) out.push(B.WATCH.OUTSIDE_CAMERA);
  if (WHOLE_VIEWS.includes(scene.view || "") && people.some((node) => node.representation !== DETAIL && node.representation !== B.BUST)) out.push(MOTION_ILLUSTRATION_PROFILES[context.artDirection.id].brief.legs);
  for (const node of people) if (node.stance === MOUNTED && node.rides && !node.unit) out.push(B.WATCH.RIDER(nameOf(node, cast), node.rides));
  for (const node of people) if (node.unit) out.push(B.WATCH.UNIT(nameOf(node, cast), MOTION_UNIT_LABEL[node.unit], node.crowd ? node.visibleCount || 1 : 1));
  const inUnit = motionUnitTargets(scene);
  if (CLOSE_VIEWS.includes(scene.view || "")) out.push(B.WATCH.NO_CUT);
  if (people.length) out.push(B.WATCH.TOP_ROOM);
  for (const node of people) if (node.uses) out.push(B.WATCH.USES(nameOf(node, cast), node.uses.objectId));
  for (const node of scene.nodes) if (node.kind === PROP && node.relation === "heldBy" && node.target) out.push(B.WATCH.HELD(nameOf(scene.nodes.find((other) => other.id === node.target) || node, cast)));
  for (const item of objects.filter((entry) => !inUnit.has(entry.id))) {
    const owner = scene.nodes.find((node) => node.id === item.id);
    const legs = owner?.animal ? motionAnimalLegs(owner.animal) : MOTION_OBJECT_CLASS_LEGS[item.class];
    const gait = owner?.gait;
    if (legs) out.push(B.WATCH.ANIMAL_LEGS(item.id, legs, gait));
  }
  return [...new Set(out)];
};
export const motionSceneRequiredIds = (id: MotionRemotionProfile, named: MotionRemotionNode[], people: MotionRemotionNode[], crowds: MotionRemotionNode[], objects: MotionSceneObject[], cast: MotionCastMember[], nodes: MotionRemotionNode[] = []): string[] => {
  const singles = people.filter((node) => !crowds.includes(node) && node.representation !== DETAIL && !node.unit);
  const lines: string[] = [];
  if (singles.length) lines.push(B.IDS_PEOPLE(singles.map((node) => node.id), MOTION_ILLUSTRATION_PROFILES[id].brief.partIds));
  for (const node of named) {
    const marks = cast.find((member) => member.key === node.entityId)?.marks || [];
    if (marks.length && node.representation !== DETAIL) lines.push(B.IDS_MARKS(node.id, marks.length));
  }
  for (const node of crowds) lines.push(node.unit ? (node.crowd ? B.IDS_UNIT_GROUP(node.id, MOTION_UNIT_PARTS[node.unit]) : B.IDS_UNIT(node.id, MOTION_UNIT_PARTS[node.unit])) : B.IDS_GROUP(node.id));
  for (const node of people.filter((item) => item.unit && !crowds.includes(item))) lines.push(B.IDS_UNIT(node.id, MOTION_UNIT_PARTS[node.unit!]));
  const inUnit = motionUnitTargets({ nodes });
  for (const item of objects.filter((entry) => !inUnit.has(entry.id))) lines.push(B.IDS_OBJECT(item.id, motionObjectPartNames(item, B.CLASS_PART_NAMES[item.class] || [], nodes.find((node) => node.id === item.id)?.animal)));
  lines.push(B.IDS_EFFECTS);
  return lines;
};
export const motionSceneBrief = (context: MotionSceneBriefContext): string => {
  const id = context.artDirection.id;
  const profile = MOTION_ILLUSTRATION_PROFILES[id];
  const hasPeople = context.scene.nodes.some((node) => node.kind === CHARACTER && node.representation !== DETAIL && !node.animal);
  const frame = hasPeople ? [profile.brief.frame, ...[MOTION_FRAME_STAND, ...scenePoses(id, context.scene.nodes)].map((pose) => B.FRAME_BLOCK(pose, motionFrameSvg(id, pose))), B.FRAME_END].join(B.JOIN) : "";
  return [B.TASK, frame, `${B.HEADINGS.BRIEF}\n${motionSceneBriefLines(context).join(B.BLANK)}`, B.OUTPUT].filter(Boolean).join(B.BLANK);
};
