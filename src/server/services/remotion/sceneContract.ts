import { MOTION_REMOTION_PROMPTS as P, MOTION_REMOTION_SCHEMAS } from "../../../constants/motionRemotionPrompts.js";
import { MOTION_VISUAL as V } from "../../../constants/motionVisual.js";
import { MOTION_REMOTION_LAYOUT as L } from "../../../constants/motionRemotionLayout.js";
import { motionResponseErrors } from "../../../lib/motionResponseContract.js";
import type { MotionRemotionNode, MotionRemotionScene } from "../../../types/motionVisual.js";
export const mergeRemotionSceneDraft = (raw: any, previous: unknown[], lines: { key: string; text: string }[], cast: Set<string>) => {
  const schema = MOTION_REMOTION_SCHEMAS[V.ARTIFACT_SCENE].properties!.scenes.items!;
  const drafts = new Map<string, any>();
  const incoming = Array.isArray(raw?.scenes) ? raw.scenes : [];
  for (const entry of [...previous, ...incoming]) {
    if (!entry || typeof entry !== "object") continue;
    const item = structuredClone(entry);
    if (incoming.length === 1 && !previous.length) {
      item.fromLineId ||= lines[0]?.key;
      item.toLineId ||= lines.at(-1)?.key;
    }
    const old = drafts.get(item.fromLineId);
    const nodes = new Map<string, any>();
    for (const node of [...(Array.isArray(old?.nodes) ? old.nodes : []), ...(Array.isArray(item.nodes) ? item.nodes : [])]) {
      if (!node || typeof node !== "object") continue;
      const merged = { ...nodes.get(node.id), ...node };
      for (const key of ["entityId", "relation", "target", "evidence", "essential", "appearanceChanged", "poseEssential"]) if (merged[key] === null || merged[key] === "") delete merged[key];
      merged.pose ||= "standing";
      nodes.set(node.id, merged);
    }
    const duplicate = Array.isArray(item.nodes) && new Set(item.nodes.map((node: any) => node?.id)).size !== item.nodes.length;
    const malformed = Array.isArray(item.nodes) && item.nodes.some((node: any) => !node || typeof node !== "object");
    drafts.set(item.fromLineId, { ...old, ...item, nodes: duplicate || malformed || (!Array.isArray(item.nodes) && !Array.isArray(old?.nodes)) ? item.nodes : [...nodes.values()] });
  }
  const errors: string[] = [];
  const scenes: any[] = [];
  for (const item of drafts.values()) {
    const issues = motionResponseErrors(item, schema, `scenes[${item.fromLineId}]`);
    if (issues.length) {
      errors.push(...issues);
      continue;
    }
    const from = lines.findIndex((line) => line.key === item.fromLineId);
    const to = lines.findIndex((line) => line.key === item.toLineId);
    if (from < 0 || to < from) {
      errors.push(P.INVALID_RANGE);
      continue;
    }
    const source = lines
      .slice(from, to + 1)
      .map((line) => line.text)
      .join(" ");
    const ids = new Set(item.nodes.map((node: MotionRemotionNode) => node.id));
    if (item.focus) item.focus = [...new Set((item.focus as string[]).filter((id) => ids.has(id)))];
    const nodeErrors: string[] = [];
    const report = (node: MotionRemotionNode, field: string) => nodeErrors.push(P.NODE_ISSUE(item.fromLineId, node.id, field));
    for (const node of item.nodes as MotionRemotionNode[]) {
      node.evidence ||= source;
      if (node.kind === "character" && node.relation === "on" && node.essential === false && !node.poseEssential) {
        node.relation = "beside";
        node.pose = "standing";
        node.contact = "base";
      }
      if (ids.size !== item.nodes.length) report(node, P.DUPLICATE_NODE);
      if (node.kind === "character" && (!node.entityId || !cast.has(node.entityId))) report(node, P.UNKNOWN_CHARACTER);
      if (node.target && (!ids.has(node.target) || node.target === node.id)) report(node, P.INVALID_TARGET);
      if (!!node.relation !== !!node.target) report(node, P.RELATION_TARGET);
      const seen = new Set<string>();
      let current: MotionRemotionNode | undefined = node;
      while (current?.target) {
        if (seen.has(current.id)) {
          report(node, P.CYCLIC_TARGET);
          break;
        }
        seen.add(current.id);
        current = item.nodes.find((other: MotionRemotionNode) => other.id === current!.target);
      }
    }
    errors.push(...nodeErrors);
    if (!nodeErrors.length) scenes.push(item);
  }
  scenes.sort((a, b) => lines.findIndex((line) => line.key === a.fromLineId) - lines.findIndex((line) => line.key === b.fromLineId));
  let cursor = 0;
  for (const item of scenes) {
    const from = lines.findIndex((line) => line.key === item.fromLineId);
    if (from !== cursor) errors.push(P.INVALID_RANGE);
    cursor = lines.findIndex((line) => line.key === item.toLineId) + 1;
  }
  if (cursor !== lines.length || !scenes.length || scenes.length > V.MAX_SCENES_PER_BEAT) errors.push(P.INVALID_RANGE);
  return { value: { scenes: errors.length ? [...drafts.values()] : scenes }, errors: [...new Set(errors)], accepted: scenes, drafts: [...drafts.values()] };
};
export const remotionScenesFromDraft = (raw: { scenes: any[] }, beatId: string, place: string | undefined, lines: { key: string; text: string }[], sourceKey: string): MotionRemotionScene[] =>
  raw.scenes.map((item, index) => ({
    ...item,
    id: `${beatId}:${index}`,
    beatId,
    place,
    ...(item.time ? { declaredTime: item.time } : {}),
    ...(item.weather ? { declaredWeather: item.weather } : {}),
    text: lines
      .slice(
        lines.findIndex((line) => line.key === item.fromLineId),
        lines.findIndex((line) => line.key === item.toLineId) + 1,
      )
      .map((line) => line.text)
      .join(" "),
    sourceKey,
    sceneRevision: L.SCENE_REVISION,
  }));
