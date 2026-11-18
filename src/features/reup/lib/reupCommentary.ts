import _ from "lodash";
import { REUP_COMMENTARY_ENDINGS, REUP_COMMENTARY_HOOKS, REUP_COMMENTARY_VOICES } from "../constants/reupCommentary.js";
import type { ReupPresetRules, ReupStyle } from "../types/reup.js";
const seedOf = (text: string): number => [...text].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
/** The option used longest ago (never used first); ties go by the run's seed so equal runs still differ. */
const leastRecent = <T extends string>(options: readonly T[], used: (T | undefined)[], seed: number): T => {
  const age = (o: T): number => {
    const at = used.indexOf(o);
    return at < 0 ? Number.MAX_SAFE_INTEGER : at;
  };
  const best = _.max(options.map(age))!;
  const pool = options.filter((o) => age(o) === best);
  return pool[seed % pool.length];
};
/**
 * Commentary style of a new run: for each part (narrator, opening, ending, music) the choice used least recently on
 * this channel's previous runs (newest first), within what the video type allows.
 */
export const pickReupStyle = (rules: Pick<ReupPresetRules, "voices" | "hooks" | "endings" | "musicMoods" | "hook">, history: ReupStyle[], seedText: string): ReupStyle => {
  const seed = seedOf(seedText);
  const voices = rules.voices.length ? rules.voices : REUP_COMMENTARY_VOICES;
  const hooks = rules.hooks.length ? rules.hooks : REUP_COMMENTARY_HOOKS;
  const endings = rules.endings.length ? rules.endings : REUP_COMMENTARY_ENDINGS;
  return {
    voice: leastRecent(voices, history.map((h) => h.voice), seed),
    ...(rules.hook ? { hook: leastRecent(hooks, history.map((h) => h.hook), seed >>> 3) } : {}),
    ending: leastRecent(endings, history.map((h) => h.ending), seed >>> 5),
    ...(rules.musicMoods.length ? { music: leastRecent(rules.musicMoods, history.map((h) => h.music), seed >>> 7) } : {}),
  };
};
