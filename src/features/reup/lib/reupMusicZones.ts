import _ from "lodash";
import { REUP_MUSIC_ZONE as Z } from "../constants/reupConfig.js";
import type { ReupMusicZoneKind, ReupPresetRules, ReupSectionRole } from "../types/reup.js";
export interface ReupMusicZone {
  start: number;
  end: number;
  kind: ReupMusicZoneKind;
}
export interface ReupZoneInput {
  mode: ReupPresetRules["musicMode"];
  total: number;
  sections: { start: number; end: number; role: ReupSectionRole }[];
  silences: [number, number][];
  stings: number[];
  chapters: number[];
}
const merge = (zones: ReupMusicZone[], total: number): ReupMusicZone[] => {
  const out: ReupMusicZone[] = [];
  for (const zone of _.sortBy(zones, "start")) {
    const z = { ...zone, start: _.clamp(zone.start, 0, total), end: _.clamp(zone.end, 0, total) };
    const last = _.last(out);
    if (last && z.start - last.end < Z.MERGE) {
      last.end = Math.max(last.end, z.end);
      if (z.kind === "ending" || z.kind === "hook") last.kind = z.kind;
    } else out.push(z);
  }
  return out.filter((z) => z.end - z.start >= Z.MIN).map((z) => ({ ...z, start: _.round(z.start, 2), end: _.round(z.end, 2) }));
};
const gaps = (silences: [number, number][]): ReupMusicZone[] => silences.filter(([a, b]) => b - a >= Z.GAP).map(([a, b]) => ({ start: a + Z.GAP_PAD, end: b - Z.GAP_PAD, kind: "gap" as const }));
export const reupMusicZones = (input: ReupZoneInput): ReupMusicZone[] => {
  const { total } = input;
  if (input.mode === "chapters") {
    const starts = _.sortedUniq(_.sortBy([0, ...input.chapters.filter((t) => t > Z.MIN && t < total)].map((t) => _.round(t, 2))));
    return starts.map((t, i) => ({ start: t, end: i < starts.length - 1 ? starts[i + 1] - Z.REST : total, kind: i === starts.length - 1 ? ("ending" as const) : ("bed" as const) })).filter((z) => z.end - z.start >= Z.MIN);
  }
  const hooks = input.sections.filter((s) => s.role === "hook");
  const hook = hooks.length ? { start: 0, end: Math.min(_.last(hooks)!.end, Z.HOOK_MAX) } : { start: 0, end: Math.min(Z.HOOK_NONE, input.sections[0]?.end ?? Z.HOOK_NONE) };
  const last = _.findLast(input.sections, (s) => s.role === "ending") || _.last(input.sections);
  const ending = { start: Math.max(last?.start ?? total, total - Z.ENDING_MAX), end: total };
  return merge([{ ...hook, kind: "hook" }, ...gaps(input.silences), ...input.stings.map((t) => ({ start: t - Z.STING_LEAD, end: t + Z.STING, kind: "sting" as const })), { ...ending, kind: "ending" }], total);
};
