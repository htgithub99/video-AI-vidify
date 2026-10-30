import * as COMMON_RUNTIME from "../constants/sourceText.js";
import { RUNTIME_VALUES } from "../constants/runtime/values.js";
import { MOTION_CAST_IDENTITY as I } from "../constants/motionCastIdentity.js";
import type { MotionRemotionNode } from "../types/motionVisual.js";
const seed = (key: string): number => [...key].reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) >>> 0, 7);
export const motionCleanLook = (look?: string): string => I.TIDY.reduce((text, pattern, index) => text.replace(pattern, index === 2 ? " " : ""), (look || "").replace(I.CONSTRUCTION, "")).trim();
export const motionAnalysisGroups = (raw: unknown): { key: string; name: string; look: string }[] | undefined => {
  if (!Array.isArray(raw)) return undefined;
  const used = new Set<string>();
  const groups = raw
    .filter((item) => item && typeof item === "object" && typeof item.name === "string" && typeof item.look === "string" && item.look.trim())
    .slice(0, I.GROUP_LIMIT)
    .map((item) => {
      const name = item.name.trim().slice(0, I.GROUP_TEXT.NAME);
      let key = String(item.key || name).toLowerCase().replace(I.GROUP_KEY.INVALID, I.GROUP_KEY.SEPARATOR).replace(I.GROUP_KEY.TRIM, "") || I.GROUP_KEY.FALLBACK;
      while (used.has(key)) key += I.GROUP_KEY.SUFFIX;
      used.add(key);
      return { key, name, look: motionCleanLook(item.look).slice(0, I.GROUP_TEXT.LOOK) };
    });
  return groups.length ? groups : undefined;
};
export const motionCastIdentity = <T extends { key: string; look?: string; gender?: string }>(cast: T[], profileId: string, era?: string): T[] => {
  if (!I.HAIR_PROFILES.includes(profileId)) return cast;
  const used = new Set<string>();
  return cast.map((member) => {
    const look = motionCleanLook(member.look);
    if (I.HAIR_WORDS.test(look)) return look === member.look ? member : { ...member, look };
    const pool = I.HAIR[I.FEMALE.test(member.gender || "") ? COMMON_RUNTIME.SOURCE_TEXT_FEMALE : COMMON_RUNTIME.SOURCE_TEXT_MALE];
    const start = seed(member.key) % pool.length;
    const hair = pool.map((_, index) => pool[(start + index) % pool.length]).find((option) => !used.has(option)) || pool[start];
    used.add(hair);
    return { ...member, look: I.LOOK(look, hair, era?.trim() || I.ERA_FALLBACK) };
  });
};
export const motionIdentityContrast = (members: { key: string; name: string; look?: string }[], contrast: { SPLIT: RegExp; WORD: RegExp; SHARE: number; PHRASE_SHARE: number; KEY: RegExp; MAX_TRAITS: number; MIN_WORDS: number; SKIP: RegExp }): { entityId: string; name: string; traits: string[] }[] => {
  const words = (text: string) => new Set((text.toLowerCase().match(contrast.WORD) || []) as string[]);
  const people = members.filter((member) => member.look?.trim()).map((member) => ({ member, all: words(member.look!), phrases: member.look!.split(contrast.SPLIT).map((phrase) => phrase.trim()).filter((phrase) => (phrase.match(contrast.WORD) || []).length >= contrast.MIN_WORDS && !contrast.SKIP.test(phrase)) }));
  const overlap = (a: Set<string>, b: Set<string>) => [...a].filter((word) => b.has(word)).length / Math.max(1, Math.min(a.size, b.size));
  const similar = people.filter((person) => people.some((other) => other !== person && overlap(person.all, other.all) >= contrast.SHARE));
  if (similar.length < 2) return [];
  return similar.map((person) => {
    const others = similar.filter((other) => other !== person).flatMap((other) => other.phrases.map(words));
    const same = (a: Set<string>, b: Set<string>) => a.size === b.size && [...a].every((word) => b.has(word));
    const own = person.phrases.filter((phrase) => (contrast.KEY.test(phrase) ? !others.some((set) => same(words(phrase), set)) : !others.some((set) => overlap(words(phrase), set) >= contrast.PHRASE_SHARE)));
    const traits = [...own.filter((phrase) => contrast.KEY.test(phrase)), ...own.filter((phrase) => !contrast.KEY.test(phrase))].slice(0, contrast.MAX_TRAITS);
    return { entityId: person.member.key, name: person.member.name, traits };
  }).filter((entry) => entry.traits.length);
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
