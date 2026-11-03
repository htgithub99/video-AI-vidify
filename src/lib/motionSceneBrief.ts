import { MOTION_SCENE_BRIEF as B } from "../constants/motionSceneBrief.js";
import { MOTION_ILLUSTRATION_PROFILES } from "../constants/motionIllustrationProfiles.js";
import { MOTION_CHARACTER_FRAMES } from "../constants/motionProfiles/characterFrames/index.js";
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
  scene: Pick<MotionRemotionScene, "purpose" | "text" | "format" | "effects" | "environment" | "time" | "weather" | "view" | "camera" | "lead" | "objects"> & { nodes: MotionRemotionNode[] };
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
const HORROR: MotionRemotionProfile = "horror";
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
  const when = [B.WHEN_LINE(context.era, context.place?.name, scene.time, scene.weather), scene.environment ? B.ENVIRONMENT_LINE(scene.environment) : "", context.place?.description ? context.place.description : ""].filter(Boolean);
  sections.push(B.SECTION(B.HEADINGS.WHEN, when));
  sections.push(B.SECTION(B.HEADINGS.STORY, [B.PURPOSE_LINE(scene.purpose), scene.text ? B.TEXT_LINE(scene.text) : "", context.note || ""].filter(Boolean)));
  const device = context.artDirection.device;
  const cameraLines = [device ? B.FORMAT_LINE(device) : view ? B.VIEWS[view] || "" : "", scene.camera ? B.CAMERA_LINE(scene.camera) : "", scene.lead ? B.LEAD_LINE(nameOf(scene.nodes.find((node) => node.id === scene.lead) || ({ id: scene.lead } as MotionRemotionNode), cast)) : "", B.FREE_LAYOUT].filter(Boolean);
  sections.push(B.SECTION(B.HEADINGS.CAMERA, cameraLines));
  const personLines = named.concat(people.filter((node) => !named.includes(node) && !crowds.includes(node))).flatMap((node) => {
    const member = cast.find((item) => item.key === node.entityId);
    const lines = [B.PERSON(node.id, member?.name || node.id, member?.role)];
    const identity = B.PERSON_IDENTITY(member?.marks || [], member?.skin, member?.origin);
    if (identity) lines.push(identity);
    if (member?.look) lines.push(B.PERSON_LOOK(member.look));
    lines.push(B.PERSON_ACTION(node.description, node.pose, node.posture, node.support));
    const shown = B.PERSON_SHOWN(node.representation || "");
    if (shown) lines.push(shown);
    if (node.relation && node.target) lines.push(B.PERSON_RELATION(node.relation, node.target));
    if (node.uses) lines.push(B.PERSON_USES(node.uses.objectId, node.uses.how));
    return [lines.join(" ")];
  });
  sections.push(B.SECTION(B.HEADINGS.PEOPLE, personLines));
  const groupLines = crowds.map((node) => {
    const group = groups.find((item) => item.key === node.crowd?.groupKey);
    const visible = node.visibleCount || Math.min(node.crowd?.count || B.CROWD_WATCH_MIN, B.CROWD_WATCH_MIN);
    return [B.GROUP(node.id, node.description), B.GROUP_COUNT(visible, node.crowd?.rows, node.crowd?.count), B.GROUP_LOOK(group?.origin, group?.skin, group?.outfit, group?.gear, group?.faction || node.crowd?.faction, group?.look || node.crowd?.appearance), node.crowd?.facing ? B.GROUP_FACING(node.crowd.facing, node.crowd.depth) : "", node.pose ? B.PERSON_ACTION("", node.pose, node.posture, node.support) : ""].filter(Boolean).join(" ");
  });
  sections.push(B.SECTION(B.HEADINGS.GROUPS, groupLines));
  const sheets = context.sheets || [];
  const shown = new Map<string, string>();
  const objectLines = objects.map((item: MotionSceneObject) => {
    const node = scene.nodes.find((entry) => entry.id === item.id);
    const lines = [B.OBJECT(item.id, MOTION_OBJECT_CLASS_LABEL[item.class], item.description || node?.description || item.class)];
    if (node?.pose) lines.push(B.PERSON_ACTION("", node.pose, node.posture, node.support));
    if (node?.relation && node.target) lines.push(B.PERSON_RELATION(node.relation, node.target));
    const sheet = sheets.find((entry) => entry.id === item.id);
    const frame = context.animalFrames?.find((entry) => entry.animal === node?.animal);
    const reference = sheet?.svg || frame?.svg;
    if (frame && !sheet) lines.push(B.OBJECT_NOTE(frame.note));
    if (!reference) lines.push(B.OBJECT_NOTE(MOTION_OBJECT_CLASS_NOTES[item.class]));
    else if (shown.has(reference)) lines.push(B.OBJECT_SAME(shown.get(reference)!));
    else {
      shown.set(reference, item.id);
      lines.push(B.OBJECT_SHEET(reference));
    }
    return lines.join(" ");
  });
  sections.push(B.SECTION(B.HEADINGS.OBJECTS, objectLines));
  sections.push(B.SECTION(B.HEADINGS.PROPS, [...props.map((node) => B.PROP(node.id, node.description, node.relation, node.target, node.state)), ...labels.map((node) => B.LABEL(node.id, node.description))]));
  const effects = (scene.effects || []) as MotionRemotionEffect[];
  sections.push(B.SECTION(B.HEADINGS.EFFECTS, [...effects.map((effect) => B.EFFECT(effect.id, effect.kind, effect.region, effect.source, effect.direction)), ...(context.dialogueSpeakers?.length ? [B.SPEAKERS(context.dialogueSpeakers.map((key) => cast.find((member) => member.key === key)?.name || key))] : [])]));
  if (context.genreLine) sections.push(B.SECTION(B.HEADINGS.GRAMMAR, [context.genreLine]));
  if (context.placeNotes) sections.push(B.SECTION(B.HEADINGS.PLACE, [context.placeNotes.slice(0, B.MAX_PLACE_CHARS)]));
  sections.push(B.SECTION(B.HEADINGS.WATCH, motionSceneWatchOuts(context, objects)));
  sections.push(B.SECTION(B.HEADINGS.IDS, motionSceneRequiredIds(id, named, people, crowds, objects, cast)));
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
  if (scene.view === DETAIL && scene.nodes.some((node) => (node.kind === CHARACTER && node.representation === DETAIL) || B.HAND_WORDS.test(node.description || ""))) out.push(B.WATCH.OUTSIDE_CAMERA);
  if (CLOSE_VIEWS.includes(scene.view || "")) out.push(B.WATCH.NO_CUT);
  if (people.length) out.push(B.WATCH.TOP_ROOM);
  for (const node of people) if (node.uses) out.push(B.WATCH.USES(nameOf(node, cast), node.uses.objectId));
  for (const node of scene.nodes) if (node.kind === PROP && node.relation === "heldBy" && node.target) out.push(B.WATCH.HELD(nameOf(scene.nodes.find((other) => other.id === node.target) || node, cast)));
  for (const item of objects) {
    const legs = MOTION_OBJECT_CLASS_LEGS[item.class];
    if (legs) out.push(B.WATCH.ANIMAL_LEGS(item.id, legs));
  }
  return [...new Set(out)];
};
export const motionSceneRequiredIds = (id: MotionRemotionProfile, named: MotionRemotionNode[], people: MotionRemotionNode[], crowds: MotionRemotionNode[], objects: MotionSceneObject[], cast: MotionCastMember[]): string[] => {
  const singles = people.filter((node) => !crowds.includes(node) && node.representation !== DETAIL);
  const lines: string[] = [];
  if (singles.length) lines.push(B.IDS_PEOPLE(singles.map((node) => node.id), id === HORROR ? B.HORROR_PART_IDS : B.OUTLINED_PART_IDS));
  for (const node of named) {
    const marks = cast.find((member) => member.key === node.entityId)?.marks || [];
    if (marks.length && node.representation !== DETAIL) lines.push(B.IDS_MARKS(node.id, marks.length));
  }
  for (const node of crowds) lines.push(B.IDS_GROUP(node.id));
  for (const item of objects) lines.push(B.IDS_OBJECT(item.id, B.CLASS_PART_NAMES[item.class] || []));
  lines.push(B.IDS_EFFECTS);
  return lines;
};
export const motionSceneBrief = (context: MotionSceneBriefContext): string => {
  const id = context.artDirection.id;
  const profile = MOTION_ILLUSTRATION_PROFILES[id];
  const hasPeople = context.scene.nodes.some((node) => node.kind === CHARACTER && node.representation !== DETAIL && !node.animal);
  const frame = hasPeople ? `${profile.brief.frame}\n${MOTION_CHARACTER_FRAMES[id]}\nEND CHARACTER SVG FRAME` : "";
  return [B.TASK, frame, `${B.HEADINGS.BRIEF}\n${motionSceneBriefLines(context).join(B.BLANK)}`, B.OUTPUT].filter(Boolean).join(B.BLANK);
};
