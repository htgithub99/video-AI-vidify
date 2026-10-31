import { MOTION_CAST_IDENTITY as I } from "../constants/motionCastIdentity.js";
export const motionCleanLook = (look?: string): string => I.TIDY.reduce((text, pattern, index) => text.replace(pattern, index === 2 ? " " : ""), (look || "").replace(I.CONSTRUCTION, "")).trim();
export const motionAnalysisGroups = (raw: unknown): { key: string; name: string; look: string }[] | undefined => {
  if (!Array.isArray(raw)) return undefined;
  const used = new Set<string>();
  const groups = raw
    .filter((item) => item && typeof item === "object" && typeof item.name === "string" && typeof item.look === "string" && item.look.trim())
    .slice(0, I.GROUP_LIMIT)
    .map((item) => {
      const name = item.name.trim().slice(0, I.GROUP_TEXT.NAME);
      let key =
        String(item.key || name)
          .toLowerCase()
          .replace(I.GROUP_KEY.INVALID, I.GROUP_KEY.SEPARATOR)
          .replace(I.GROUP_KEY.TRIM, "") || I.GROUP_KEY.FALLBACK;
      while (used.has(key)) key += I.GROUP_KEY.SUFFIX;
      used.add(key);
      return { key, name, look: motionCleanLook(item.look).slice(0, I.GROUP_TEXT.LOOK) };
    });
  return groups.length ? groups : undefined;
};
export const motionCastIdentity = <T extends { key: string; look?: string }>(cast: T[]): T[] => cast.map((member) => ({ ...member, ...(member.look ? { look: motionCleanLook(member.look) } : {}) }));
export const motionIdentityContrast = (members: { key: string; name: string; look?: string }[], contrast: { SPLIT: RegExp; WORD: RegExp; SHARE: number; PHRASE_SHARE: number; KEY: RegExp; MAX_TRAITS: number; MIN_WORDS: number; SKIP: RegExp }): { entityId: string; name: string; traits: string[] }[] => {
  const words = (text: string) => new Set((text.toLowerCase().match(contrast.WORD) || []) as string[]);
  const people = members
    .filter((member) => member.look?.trim())
    .map((member) => ({
      member,
      all: words(member.look!),
      phrases: member
        .look!.split(contrast.SPLIT)
        .map((phrase) => phrase.trim())
        .filter((phrase) => (phrase.match(contrast.WORD) || []).length >= contrast.MIN_WORDS && !contrast.SKIP.test(phrase)),
    }));
  const overlap = (a: Set<string>, b: Set<string>) => [...a].filter((word) => b.has(word)).length / Math.max(1, Math.min(a.size, b.size));
  const similar = people.filter((person) => people.some((other) => other !== person && overlap(person.all, other.all) >= contrast.SHARE));
  if (similar.length < 2) return [];
  return similar
    .map((person) => {
      const others = similar.filter((other) => other !== person).flatMap((other) => other.phrases.map(words));
      const same = (a: Set<string>, b: Set<string>) => a.size === b.size && [...a].every((word) => b.has(word));
      const own = person.phrases.filter((phrase) => (contrast.KEY.test(phrase) ? !others.some((set) => same(words(phrase), set)) : !others.some((set) => overlap(words(phrase), set) >= contrast.PHRASE_SHARE)));
      const traits = [...own.filter((phrase) => contrast.KEY.test(phrase)), ...own.filter((phrase) => !contrast.KEY.test(phrase))].slice(0, contrast.MAX_TRAITS);
      return { entityId: person.member.key, name: person.member.name, traits };
    })
    .filter((entry) => entry.traits.length);
};
