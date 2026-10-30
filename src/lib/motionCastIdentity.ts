import * as COMMON_RUNTIME from "../constants/sourceText.js";
import { RUNTIME_VALUES } from "../constants/runtime/values.js";
import { MOTION_CAST_IDENTITY as I } from "../constants/motionCastIdentity.js";
import type { MotionRemotionNode } from "../types/motionVisual.js";
const seed = (key: string): number => [...key].reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) >>> 0, 7);
export const motionCastIdentity = <T extends { key: string; look?: string; gender?: string }>(cast: T[], profileId: string, era?: string): T[] => {
  if (!I.HAIR_PROFILES.includes(profileId)) return cast;
  const used = new Set<string>();
  return cast.map((member) => {
    if (I.HAIR_WORDS.test(member.look || "")) return member;
    const pool = I.HAIR[I.FEMALE.test(member.gender || "") ? COMMON_RUNTIME.SOURCE_TEXT_FEMALE : COMMON_RUNTIME.SOURCE_TEXT_MALE];
    const start = seed(member.key) % pool.length;
    const hair = pool.map((_, index) => pool[(start + index) % pool.length]).find((option) => !used.has(option)) || pool[start];
    used.add(hair);
    return { ...member, look: I.LOOK(member.look || "", hair, era?.trim() || I.ERA_FALLBACK) };
  });
};
export const motionSceneStaging = (nodes: MotionRemotionNode[], narrator?: string, speakers: string[] = []): string => {
  const people = nodes.filter((node) => node.kind === RUNTIME_VALUES.CHARACTER_4BCEF3DE && node.representation !== RUNTIME_VALUES.DETAIL_9C0211C5);
  const named = people.filter((node) => !node.anonymous && node.entityId);
  const groups = people.filter((node) => node.anonymous || !node.entityId).map((node) => node.id);
  const rank = (node: MotionRemotionNode) => (node.entityId === narrator ? 0 : speakers.includes(node.entityId || "") ? 1 : 2);
  const ordered = named
    .map((node, index) => ({ node, index }))
    .sort((a, b) => rank(a.node) - rank(b.node) || a.index - b.index)
    .map((entry) => entry.node.id);
  if (ordered.length <= I.FOREGROUND_LIMIT && !groups.length) return "";
  return I.STAGING(ordered.slice(0, I.FOREGROUND_LIMIT), ordered.slice(I.FOREGROUND_LIMIT), groups);
};
