import _ from "lodash";
import { MOTION_CAST_NAMES as N } from "../constants/motionCastNames.js";
import type { MotionCastMember } from "../types/motionVideo.js";
export const expandInitialCastNames = (cast: MotionCastMember[]): MotionCastMember[] => {
  const used = new Set<string>(_.map(cast, (c) => c.name));
  return _.map(cast, (c) => {
    const m = c.name.match(N.INITIAL_RE);
    if (!m) return c;
    const letter = m[1];
    const pool = (c.gender === N.FEMALE_KEY ? N.FEMALE : N.MALE)[letter] || [N.FALLBACK];
    const given = _.find(pool, (g) => !_.some([...used], (u) => u.includes(g))) || pool[0];
    const name = c.name.replace(N.INITIAL_RE, given);
    used.add(name);
    return { ...c, name, alias: c.name };
  });
};
const pattern = (alias: string): RegExp => new RegExp(N.BOUND_HEAD + alias.replace(N.ESCAPE_RE, N.ESCAPE_TO) + N.BOUND_TAIL, N.FLAGS);
export const fullCastNames = (text: string, cast: MotionCastMember[]): string => {
  const named = _.filter(cast, (c) => !!c.alias && c.alias !== c.name);
  if (!text || !named.length) return text;
  const letters = _.countBy(named, (c) => c.alias!.match(N.INITIAL_RE)?.[1] || N.FALLBACK);
  return _.reduce(
    named,
    (acc, c) => {
      const letter = c.alias!.match(N.INITIAL_RE)?.[1];
      const exact = acc.replace(pattern(c.alias!), c.name);
      if (!letter || letters[letter] > 1 || N.SKIP_BARE.includes(letter)) return exact;
      const first = _.find(_.words(c.name), (w) => w.startsWith(letter)) || c.name;
      return exact.replace(new RegExp(N.BARE(letter), N.FLAGS), first);
    },
    text,
  );
};
