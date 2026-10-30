import { RUNTIME_VALUES } from "../constants/runtime/values.js";
import { RUNTIME_TEXT as RT_SHARED } from "../constants/runtime/shared.js";
import { RUNTIME_TEXT as RT_CORE } from "../constants/runtime/core.js";
import { MOTION_REMOTION_STAGING as S } from "../constants/motionRemotionStaging.js";
import { remotionObjectIdentity, remotionRole, remotionSubject } from "./motionRemotionGeometry.js";
import { MOTION_REMOTION_LAYOUT as L } from "../constants/motionRemotionLayout.js";
import { MOTION_VISUAL as V } from "../constants/motionVisual.js";
import type { MotionRemotionNode, MotionRemotionScene, MotionVectorAsset } from "../types/motionVisual.js";
export const remotionIdentityDescription = (description: string) => description.replace(S.HANDHELD, "").replace(S.FUTURE_APPEARANCE, "").trim();
export const remotionAtomicDescription = (node: MotionRemotionNode) => (node.kind === RT_SHARED.CHARACTER ? remotionIdentityDescription(node.description) : node.description.replace(S.CONTENTS, "").split(S.SUBJECT_LOCATION)[0].trim() || node.description);
export const remotionLegacyAssetIssue = (node: MotionRemotionNode, asset: MotionVectorAsset): string | undefined => {
  if (asset.stagingRevision === S.REVISION) return;
  if (node.kind === RT_SHARED.CHARACTER && remotionIdentityDescription(asset.description) !== asset.description.trim()) return S.MIGRATION_REASON;
  if (node.kind === RT_SHARED.PROP && S.MARK.test(remotionSubject(node))) return S.MIGRATION_REASON;
  if (node.kind === RT_SHARED.PROP && (remotionAtomicDescription({ ...node, description: asset.description }) !== asset.description.trim() || (!!node.mount && remotionRole(node) === RT_CORE.SUPPORT_A18603) || (S.GATE.test(node.description) && asset.width / asset.height > 3))) return S.MIGRATION_REASON;
};
export const normalizeRemotionRelations = (nodes: MotionRemotionNode[]): MotionRemotionNode[] =>
  nodes.map((original) => {
    let node = { ...original };
    if (node.kind === RT_SHARED.CHARACTER && !node.representation && /^(?:bàn tay|cánh tay|ngón tay|bàn chân|đôi mắt|khuôn mặt|hands? (?:of|reaching)|close[- ]?up of (?:the |a )?(?:hand|face|eyes|feet))\b/iu.test(node.description)) node.representation = RUNTIME_VALUES.DETAIL_9C0211C5;
    const peer = node.kind === RT_SHARED.CHARACTER && ([RT_SHARED.BESIDE, RT_SHARED.BEHIND] as string[]).includes(node.relation || "") && nodes.find((candidate) => candidate.kind === RT_SHARED.CHARACTER && candidate.id === node.target && ([RT_SHARED.BESIDE, RT_SHARED.BEHIND] as string[]).includes(candidate.relation || "") && candidate.target === node.id);
    if (peer && node.id.localeCompare(peer.id) < 0) {
      delete node.relation;
      delete node.target;
    }
    const reversedOwner = nodes.find((candidate) => candidate.kind === RT_SHARED.CHARACTER && candidate.relation === RT_SHARED.HELDBY && candidate.target === node.id);
    if (node.kind === RT_SHARED.PROP && reversedOwner && (!node.relation || node.target === reversedOwner.id)) node = { ...node, relation: RT_SHARED.HELDBY, target: reversedOwner.id, pose: RT_SHARED.HELD };
    if (node.kind === RT_SHARED.CHARACTER && node.relation === RT_SHARED.HELDBY && nodes.some((candidate) => candidate.id === node.target && candidate.kind === RT_SHARED.PROP)) {
      delete node.relation;
      delete node.target;
    }
    if (node.kind === RT_SHARED.CHARACTER && !node.relation && S.OUTSIDE_GATE.test(`${node.description}${RT_SHARED.SYMBOL_36A9E7}${node.pose}`)) {
      const gates = nodes.filter((candidate) => candidate.kind === RT_SHARED.PROP && S.GATE.test(remotionSubject(candidate)));
      if (gates.length === 1) node = { ...node, relation: RT_SHARED.BEHIND, target: gates[0].id };
    }
    if (node.kind === RT_SHARED.PROP) {
      node.role = remotionRole(node);
      if (node.role === RT_CORE.SUPPORT_A18603 && S.SUPPORT.test(remotionSubject(node))) node.mount = RT_SHARED.FLOOR;
    }
    const on = node.description.match(S.ON) || node.description.match(S.ON_VI) || (node.kind === RT_SHARED.CHARACTER && (node.poseEssential || L.LYING.test(node.pose)) ? node.pose.match(S.ON) || node.pose.match(S.ON_VI) : undefined);
    if (!node.relation && !node.mount && on) {
      const noun = on[1].toLowerCase();
      const alias = S.SUPPORT_ALIASES.find((pattern) => pattern.test(noun));
      const supports = nodes.filter((target) => target.id !== node.id && alias?.test(target.description.split(/\b(?:with|on)\b/i)[0]));
      if (supports.length === 1) node = { ...node, relation: RT_SHARED.ON, target: supports[0].id };
    }
    if (node.kind === RT_SHARED.PROP && node.relation === RT_SHARED.ON && S.HELD.test(node.pose)) {
      const noun = node.description.match(/\b(?:bowl|spade|tray|broom|cup|knife|lamp)\b/i)?.[0];
      const owners = noun ? nodes.filter((target) => target.kind === RT_SHARED.CHARACTER && S.HELD.test(target.pose) && new RegExp(`${RT_SHARED.B}${noun}${RT_SHARED.B}`, RT_SHARED.I).test(target.pose) && target.target !== node.id) : [];
      node = owners.length === 1 ? { ...node, relation: RT_SHARED.HELDBY, target: owners[0].id, pose: RT_SHARED.HELD } : { ...node, pose: RT_CORE.RESTING };
    }
    if (node.kind === RT_SHARED.PROP && node.relation === RT_SHARED.HELDBY) node.pose = RT_SHARED.HELD;
    if (node.kind === RT_SHARED.PROP && node.relation === RT_SHARED.HELDBY && !node.stateEvidence && /cầm|nhận|bưng|mang|đưa|lấy|\b(?:hold|holding|carry|carrying|take|takes|pick|give|gave)\b/iu.test(node.evidence)) node.stateEvidence = node.evidence;
    return node;
  });
export const prepareRemotionScene = (scene: MotionRemotionScene, profileId?: string): void => {
  if (profileId === RT_CORE.HORROR) {
    const labels = new Set(scene.nodes.filter((node) => node.kind === RT_SHARED.LABEL).map((node) => node.id));
    scene.nodes = scene.nodes.filter((node) => !labels.has(node.id)).map((node) => (node.target && labels.has(node.target) ? { ...node, relation: undefined, target: undefined } : node));
  }
  scene.nodes = normalizeRemotionRelations(scene.nodes);
  const worn = new Map<string, string>();
  for (const node of scene.nodes) {
    const person = scene.nodes.find((target) => target.id === node.target && target.kind === RT_SHARED.CHARACTER);
    if (node.kind === RT_SHARED.PROP && node.relation === RT_SHARED.ON && person && S.CLOTHING.test(remotionSubject(node)) && S.WORN.test(`${node.pose}${RT_SHARED.SYMBOL_36A9E7}${node.state || ""}`) && !scene.nodes.some((child) => child.target === node.id)) {
      worn.set(node.id, person.id);
      person.appearanceChanged = true;
      if (!person.description.includes(node.description)) person.description += `${RT_SHARED.SYMBOL_0A2D3F}${node.description}`;
    }
    if (person && remotionRole(node) === RT_SHARED.DECAL && S.WRIST_MARK.test(node.description)) node.attachmentAnchor = RT_CORE.WRIST;
  }
  scene.nodes = scene.nodes.filter((node) => !worn.has(node.id));
  scene.focus = scene.focus?.map((id) => worn.get(id) || id);
  scene.nodes = scene.nodes.filter((node) => !(node.kind === RT_SHARED.PROP && S.BACKGROUND_PART.test(remotionSubject(node)) && !scene.nodes.some((other) => other.target === node.id)));
  scene.focus = scene.focus?.filter((id) => scene.nodes.some((node) => node.id === id));
  for (const node of scene.nodes) if (remotionRole(node) === RT_SHARED.DECAL && /dưới chân|under (?:their|his|her|the) feet/iu.test([node.description, node.pose].join(RT_SHARED.SYMBOL_36A9E7))) node.groundTargets = scene.nodes.filter((n) => n.kind === RT_SHARED.CHARACTER).map((n) => n.id);
  const smokeNodes = scene.nodes.filter((node) => node.kind === RT_SHARED.PROP && S.PURE_SMOKE.test(node.description));
  for (const node of smokeNodes) {
    const sources = scene.nodes.filter((n) => n.kind === RT_SHARED.PROP && n.id !== node.id && /\b(?:bowl|incense|pot|lamp|candle)\b|bát|nhang|nồi|đèn/iu.test(n.description));
    const source = sources.find((n) => n.id === node.target) || (sources.length === 1 ? sources[0] : undefined);
    if (!source || scene.nodes.some((n) => n.target === node.id)) continue;
    const direction = /là đà|sát đất|tụt xuống|sát miệng|ground|sinking/iu.test(scene.text + RT_SHARED.SYMBOL_36A9E7 + node.description) ? RT_SHARED.GROUND : RT_SHARED.UP;
    scene.effects = (scene.effects || []).map((effect) => (effect.source === node.id ? { ...effect, source: source.id, anchor: RT_SHARED.EMITTER, direction, essential: effect.essential || node.essential } : effect));
    if (!scene.effects.some((effect) => effect.source === source.id && (effect.kind === RT_SHARED.SMOKE || effect.kind === RT_SHARED.STEAM))) scene.effects.push({ id: `${RT_CORE.SOURCE}${source.id}`, kind: /steam/i.test(node.description) ? RT_SHARED.STEAM : RT_SHARED.SMOKE, source: source.id, anchor: RT_SHARED.EMITTER, direction, essential: node.essential });
    scene.nodes = scene.nodes.filter((n) => n.id !== node.id);
    scene.focus = scene.focus?.map((id) => (id === node.id ? source.id : id));
  }
  if (S.CROWD.test(scene.text) && !/không (?:có|thấy) (?:đám|đoàn|nhóm)|no (?:crowd|group)/iu.test(scene.text) && !scene.nodes.some((node) => node.kind === RT_SHARED.PROP && S.CROWD.test(node.description)) && scene.nodes.length < V.MAX_NODES) {
    const id = ([S.CROWD_ID, `${S.CROWD_ID}${RT_CORE.EXTRA}`] as string[]).find((candidate) => !scene.nodes.some((node) => node.id === candidate));
    if (id) scene.nodes.push({ id, kind: RT_SHARED.PROP, description: S.CROWD_DESCRIPTION, pose: RT_CORE.STANDING_AT_A_DISTANCE, slot: RT_SHARED.CENTER, evidence: scene.text, role: RT_SHARED.OBJECT, essential: true, objectId: id });
  }
  scene.focus = scene.focus && [...new Set(scene.focus)];
  for (const node of scene.nodes) if (scene.focus?.includes(node.id) || scene.effects?.some((effect) => effect.essential && effect.source === node.id)) node.essential = true;
};
export const assignRemotionStaging = (scenes: MotionRemotionScene[], cast: { key: string; age?: "child" | "adult" | "senior"; appearanceOf?: string }[] = []) => {
  const positions = new Map<string, number>();
  const occupied = new Map<string, Map<string, number>>();
  for (const scene of scenes) {
    prepareRemotionScene(scene);
    for (const node of scene.nodes) {
      if (node.kind === RT_SHARED.CHARACTER) {
        const member = cast.find((c) => c.key === node.entityId),
          parent = cast.find((c) => c.key === member?.appearanceOf);
        node.age = member?.age || parent?.age || RT_CORE.ADULT;
      }
      if (node.kind !== RT_SHARED.PROP || node.relation) continue;
      const key = `${scene.locationKey || scene.place}${RT_SHARED.SYMBOL_E7AC07}${remotionObjectIdentity(node)}`;
      if (!positions.has(key) || node.stateEvidence) {
        const desired = node.stateEvidence ? (node.slot === RT_SHARED.LEFT ? 0.24 : node.slot === RT_SHARED.RIGHT ? 0.76 : 0.5) : (node.layoutX ?? (node.slot === RT_SHARED.LEFT ? 0.24 : node.slot === RT_SHARED.RIGHT ? 0.76 : 0.5));
        const role = remotionRole(node),
          group = `${scene.locationKey || scene.place}${RT_SHARED.SYMBOL_E7AC07}${role}`;
        const peers = occupied.get(group) || new Map<string, number>();
        const step = role === RT_CORE.SUPPORT_A18603 ? 0.22 : 0.13;
        const candidates = [0, step, -step, step * 2, -step * 2].map((offset) => desired + offset).filter((x) => x >= 0.12 && x <= 0.88);
        const position = role === RT_SHARED.FIXTURE || role === RT_SHARED.DECAL ? desired : (candidates.find((x) => [...peers].every(([id, value]) => id === key || Math.abs(value - x) >= step * 0.9)) ?? desired);
        positions.set(key, position);
        peers.set(key, position);
        occupied.set(group, peers);
      }
      node.layoutX = positions.get(key);
    }
  }
};
