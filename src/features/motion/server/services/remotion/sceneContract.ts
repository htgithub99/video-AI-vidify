import * as COMMON_RUNTIME from "../../../../../constants/sourceText.js";
import { RUNTIME_VALUES } from "../../../../../constants/runtime/values.js";
import { RUNTIME_TEXT as RT_SERVER } from "../../../../../constants/runtime/server.js";
import { RUNTIME_TEXT as RT_SHARED } from "../../../../../constants/runtime/shared.js";
import { stringifyJson } from "../../../../../lib/jsonStringify.js";
import { MOTION_REMOTION_PROMPTS as P, MOTION_REMOTION_SCHEMAS } from "../../../../../constants/motionRemotionPrompts.js";
import { MOTION_VISUAL as V } from "../../../../../constants/motionVisual.js";
import { MOTION_REMOTION_LAYOUT as L } from "../../../../../constants/motionRemotionLayout.js";
import { motionResponseErrors } from "../../../../../lib/motionResponseContract.js";
import { normalizeRemotionRelations } from "../../../../../lib/motionRemotionStaging.js";
import type { MotionRemotionNode, MotionRemotionScene } from "../../../../../types/motionVisual.js";
const castKey = (value: string): string => value.normalize(P.CAST_KEY.FORM).replace(P.CAST_KEY.MARKS, "").replace(P.CAST_KEY.D_STROKE, P.CAST_KEY.D_PLAIN).toLowerCase().replace(P.CAST_KEY.OTHER, "");
const addImpliedHolders = (nodes: MotionRemotionNode[]): MotionRemotionNode[] => {
  const H = P.HOLDER;
  const added: MotionRemotionNode[] = [];
  for (const node of nodes) {
    if (node.kind === H.KIND || (node.relation === H.RELATION && nodes.some((other) => other.id === node.target))) continue;
    const match = H.IMPLIED.exec(`${node.pose || ""} ${node.description || ""}`);
    const who = match?.[1] || match?.[2];
    if (!who || nodes.some((other) => other.kind === H.KIND && `${other.id} ${other.description}`.toLowerCase().includes(who.toLowerCase()))) continue;
    const id = H.ID(node.id);
    if (nodes.some((other) => other.id === id)) continue;
    added.push({ id, kind: H.KIND, anonymous: true, description: H.DESCRIPTION(who, node.id), pose: H.POSE, slot: node.slot, evidence: node.evidence } as MotionRemotionNode);
    node.relation = H.RELATION as MotionRemotionNode["relation"];
    node.target = id;
  }
  return [...nodes, ...added];
};
export const mergeRemotionSceneDraft = (raw: any, previous: unknown[], lines: { key: string; text: string }[], cast: Set<string>, impliedHolders = false) => {
  const schema = MOTION_REMOTION_SCHEMAS[V.ARTIFACT_SCENE].properties!.scenes.items!;
  const drafts = new Map<string, any>();
  const incoming = Array.isArray(raw?.scenes) ? raw.scenes : [];
  for (const entry of previous) {
    if (entry && typeof entry === "object" && RUNTIME_VALUES.FROMLINEID_89AC8FD3 in entry) drafts.set(String(entry.fromLineId), structuredClone(entry));
  }
  for (const entry of incoming) {
    if (!entry || typeof entry !== "object") continue;
    const item = structuredClone(entry);
    if (incoming.length === 1 && !previous.length) {
      item.fromLineId ||= lines[0]?.key;
      item.toLineId ||= lines.at(-1)?.key;
    }
    const old = drafts.get(item.fromLineId);
    const completeNodes = Array.isArray(item.nodes) && item.nodes.every((node: any) => node && ([COMMON_RUNTIME.SOURCE_TEXT_ID, RUNTIME_VALUES.KIND_0B27C158, COMMON_RUNTIME.SOURCE_TEXT_DESCRIPTION, RUNTIME_VALUES.SLOT_65588383] as string[]).every((key) => typeof node[key] === "string"));
    const nodes = new Map<string, any>();
    for (const node of [...(!completeNodes && Array.isArray(old?.nodes) ? old.nodes : []), ...(Array.isArray(item.nodes) ? item.nodes : [])]) {
      if (!node || typeof node !== "object") continue;
      const merged = { ...nodes.get(node.id), ...node };
      for (const key of [RT_SERVER.ENTITYID, RT_SERVER.RELATION, RT_SHARED.TARGET, RT_SHARED.EVIDENCE, RT_SERVER.ESSENTIAL, RT_SERVER.APPEARANCECHANGED, RT_SERVER.POSEESSENTIAL] as string[]) if (merged[key] === null || merged[key] === "") delete merged[key];
      merged.pose ||= RT_SHARED.STANDING;
      nodes.set(node.id, merged);
    }
    const duplicate = Array.isArray(item.nodes) && new Set(item.nodes.map((node: any) => node?.id)).size !== item.nodes.length;
    const malformed = Array.isArray(item.nodes) && item.nodes.some((node: any) => !node || typeof node !== "object");
    const from = lines.findIndex((line) => line.key === item.fromLineId),
      to = lines.findIndex((line) => line.key === item.toLineId);
    if (completeNodes && from >= 0 && to >= from) {
      for (const [key, row] of drafts) {
        const start = lines.findIndex((line) => line.key === row.fromLineId),
          end = lines.findIndex((line) => line.key === row.toLineId);
        if (key !== item.fromLineId && start >= from && end <= to) drafts.delete(key);
      }
    }
    drafts.set(item.fromLineId, { ...old, ...item, nodes: duplicate || malformed || (!Array.isArray(item.nodes) && !Array.isArray(old?.nodes)) ? item.nodes : [...nodes.values()] });
  }
  const errors: string[] = [];
  const scenes: any[] = [];
  for (const item of drafts.values()) {
    if (Array.isArray(item.nodes))
      for (const node of item.nodes) {
        if (!node || typeof node !== "object") continue;
        for (const key of [RUNTIME_VALUES.ENTITYID_556EB4FE, RUNTIME_VALUES.RELATION_FC8FBB48, RUNTIME_VALUES.TARGET_34A04005, COMMON_RUNTIME.SOURCE_TEXT_EVIDENCE, RUNTIME_VALUES.ESSENTIAL_A55751CE, RUNTIME_VALUES.APPEARANCECHANGED_C145E98D, RUNTIME_VALUES.POSEESSENTIAL_6DEE91EC] as string[]) if (node[key] === null || node[key] === "") delete node[key];
        node.pose ||= RT_SHARED.STANDING;
        for (const field of P.SOFT_NODE_FIELDS) {
          if (typeof node[field] === "string" && node[field].trim()) node[field] = node[field].trim().slice(0, P.SOFT_NODE_CHARS);
          else delete node[field];
        }
        if (node.kind === RT_SHARED.CHARACTER) {
          if (!node.entityId && cast.has(node.id)) node.entityId = node.id;
          if (cast.has(node.entityId)) delete node.anonymous;
          else if (node.anonymous === true || P.ANONYMOUS_CHARACTER.test(String(node.entityId || node.id).replace(/[_-]/g, COMMON_RUNTIME.SOURCE_TEXT_SYMBOL_52))) {
            node.anonymous = true;
            delete node.entityId;
          }
        }
      }
    const issues = motionResponseErrors(item, schema, `${RT_SERVER.SCENES}${item.fromLineId}${RT_SHARED.SYMBOL_CFAE0D}`);
    if (issues.length) {
      errors.push(...issues);
      continue;
    }
    item.nodes = normalizeRemotionRelations(item.nodes);
    const from = lines.findIndex((line) => line.key === item.fromLineId);
    const to = lines.findIndex((line) => line.key === item.toLineId);
    if (from < 0 || to < from) {
      errors.push(P.INVALID_RANGE);
      continue;
    }
    const source = lines
      .slice(from, to + 1)
      .map((line) => line.text)
      .join(RT_SHARED.SYMBOL_36A9E7);
    item.nodes = (item.nodes as MotionRemotionNode[]).filter((node, index, all) => all.findIndex((other) => other.id === node.id) === index);
    if (impliedHolders) item.nodes = addImpliedHolders(item.nodes);
    const ids = new Set(item.nodes.map((node: MotionRemotionNode) => node.id));
    if (item.focus) item.focus = [...new Set((item.focus as string[]).filter((id) => ids.has(id)))];
    const nodeErrors: string[] = [];
    for (const node of item.nodes as MotionRemotionNode[]) {
      node.evidence ||= source;
      if (node.kind === RT_SHARED.CHARACTER && node.relation === RT_SHARED.ON && node.essential === false && !node.poseEssential) {
        node.relation = RT_SHARED.BESIDE;
        node.pose = RT_SHARED.STANDING;
        node.contact = RT_SHARED.BASE;
      }
      if (node.kind === RT_SHARED.CHARACTER && !node.anonymous && (!node.entityId || !cast.has(node.entityId))) {
        const known = [...cast].find((key) => [node.entityId, node.id].some((value) => value && castKey(value) === castKey(key)));
        if (known) node.entityId = known;
        else {
          node.anonymous = true;
          delete node.entityId;
        }
      }
      if ((node.target && (!ids.has(node.target) || node.target === node.id)) || !!node.relation !== !!node.target) {
        delete node.relation;
        delete node.target;
      }
      const seen = new Set<string>();
      let current: MotionRemotionNode | undefined = node;
      while (current?.target && ([RUNTIME_VALUES.ON_B8D31E85, RUNTIME_VALUES.INSIDE_106B0862, RUNTIME_VALUES.HELDBY_F9249A57] as string[]).includes(current.relation || "")) {
        if (seen.has(current.id)) {
          if (current.id === node.id) {
            delete node.relation;
            delete node.target;
          }
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
  if (scenes.length && scenes.length === drafts.size) {
    const at = (key: string) => lines.findIndex((line) => line.key === key);
    for (let changed = true; changed; ) {
      changed = false;
      scenes[0].fromLineId = lines[0]?.key ?? scenes[0].fromLineId;
      scenes.forEach((scene, index) => {
        const end = index + 1 < scenes.length ? at(scenes[index + 1].fromLineId) - 1 : lines.length - 1;
        if (end >= 0 && lines[end]) scene.toLineId = lines[end].key;
      });
      const empty = scenes.findIndex((scene) => at(scene.toLineId) < at(scene.fromLineId));
      if (empty >= 0) {
        scenes.splice(empty, 1);
        changed = scenes.length > 0;
      }
    }
    drafts.clear();
    for (const scene of scenes) drafts.set(scene.fromLineId, scene);
  }
  let cursor = 0;
  const ranges = [...drafts.values()].sort((a, b) => lines.findIndex((line) => line.key === a.fromLineId) - lines.findIndex((line) => line.key === b.fromLineId));
  for (const item of ranges) {
    const from = lines.findIndex((line) => line.key === item.fromLineId);
    if (from !== cursor) errors.push(P.INVALID_RANGE);
    cursor = lines.findIndex((line) => line.key === item.toLineId) + 1;
  }
  if (cursor !== lines.length || !ranges.length || ranges.length > V.MAX_SCENES_PER_BEAT) errors.push(P.INVALID_RANGE);
  return { value: { scenes: errors.length ? [...drafts.values()] : scenes }, errors: [...new Set(errors)], accepted: scenes, drafts: [...drafts.values()] };
};
export const mergeEquivalentRemotionDrafts = (scenes: any[]) => {
  const signature = (scene: any) => stringifyJson([scene.purpose, scene.environment, scene.time, scene.weather, scene.view, scene.focus, scene.effects, scene.removedObjects, scene.nodes.map(({ evidence, ...node }: MotionRemotionNode) => node)]);
  const merged: any[] = [];
  for (const scene of scenes) {
    const previous = merged.at(-1);
    if (previous && signature(previous) === signature(scene)) previous.toLineId = scene.toLineId;
    else merged.push(structuredClone(scene));
  }
  return merged;
};
export const remotionScenesFromDraft = (raw: { scenes: any[] }, beatId: string, place: string | undefined, lines: { key: string; text: string }[], sourceKey: string): MotionRemotionScene[] =>
  mergeEquivalentRemotionDrafts(raw.scenes).map((item, index) => ({
    ...item,
    id: `${beatId}${RT_SHARED.SYMBOL_E7AC07}${index}`,
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
      .join(RT_SHARED.SYMBOL_36A9E7),
    sourceKey,
    sceneRevision: L.SCENE_REVISION,
  }));
