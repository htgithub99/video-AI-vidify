import _ from "lodash";
import { REUP_COMMENTARY_ENDINGS, REUP_COMMENTARY_HOOKS, REUP_COMMENTARY_VOICES } from "../constants/reupCommentary.js";
import { REUP_HIGHLIGHT } from "../constants/reupConfig.js";
import type { ReupPresetRules, ReupStyle } from "../types/reup.js";
const seedOf = (text: string): number => [...text].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
const leastRecent = <T extends string>(options: readonly T[], used: (T | undefined)[], seed: number): T => {
  const age = (o: T): number => {
    const at = used.indexOf(o);
    return at < 0 ? Number.MAX_SAFE_INTEGER : at;
  };
  const best = _.max(options.map(age))!;
  const pool = options.filter((o) => age(o) === best);
  return pool[seed % pool.length];
};
export const pickReupStyle = (rules: Pick<ReupPresetRules, "voices" | "hooks" | "endings" | "hook"> & Partial<Pick<ReupPresetRules, "shapes">>, history: ReupStyle[], seedText: string): ReupStyle => {
  const seed = seedOf(seedText);
  const voices = rules.voices.length ? rules.voices : REUP_COMMENTARY_VOICES;
  const hooks = rules.hooks.length ? rules.hooks : REUP_COMMENTARY_HOOKS;
  const endings = rules.endings.length ? rules.endings : REUP_COMMENTARY_ENDINGS;
  return {
    voice: leastRecent(
      voices,
      history.map((h) => h.voice),
      seed,
    ),
    ...(rules.hook
      ? {
          hook: leastRecent(
            hooks,
            history.map((h) => h.hook),
            seed >>> 3,
          ),
        }
      : {}),
    ending: leastRecent(
      endings,
      history.map((h) => h.ending),
      seed >>> 5,
    ),
    ...(rules.shapes?.length
      ? {
          shape: leastRecent(
            rules.shapes,
            history.map((h) => h.shape),
            seed >>> 9,
          ),
        }
      : {}),
    pop: leastRecent(
      REUP_HIGHLIGHT.SHORT.LOOKS,
      history.map((h) => h.pop),
      seed >>> 11,
    ),
  };
};
export const reupPickTrack = (tracks: string[], history: ReupStyle[], seedText: string): string | undefined =>
  tracks.length
    ? leastRecent(
        tracks,
        history.map((h) => h.track),
        seedOf(seedText) >>> 7,
      )
    : undefined;
