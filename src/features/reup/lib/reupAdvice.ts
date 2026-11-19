import _ from "lodash";
import { REUP_LIMITS } from "../constants/reupConfig.js";
import type { ReupPresetDef } from "../constants/reupPresets.js";
import type { ReupBadRange, ReupJob, ReupSettings, ReupSource } from "../types/reup.js";
export interface ReupLengthAdvice {
  need: number;
  usable: number;
  suggest?: number;
}
export const reupUsableSeconds = (source: Pick<ReupSource, "duration">, bad: ReupBadRange[] = []): number => Math.max(0, source.duration - _.sumBy(bad, (b) => b.end - b.start));
export const reupLengthAdvice = (preset: Pick<ReupPresetDef, "kind" | "source" | "speech" | "lengths">, settings: Pick<ReupSettings, "targetSeconds" | "shortsCount">, usable: number): ReupLengthAdvice | undefined => {
  const kind = preset.speech ? "speech" : preset.source === "folder" ? "folder" : preset.kind;
  const count = preset.kind === "short" && !preset.speech ? Math.max(1, settings.shortsCount) : 1;
  const need = settings.targetSeconds * count;
  const room = usable * REUP_LIMITS.TARGET_SOURCE[kind];
  if (!usable || need <= room) return undefined;
  return { need, usable: Math.round(usable), suggest: _.max(preset.lengths.filter((n) => n * count <= room)) };
};
const names = (source: ReupSource): Set<string> => new Set((source.items || []).map((it) => it.name.toLowerCase()));
export const reupSameSource = (a: Pick<ReupJob, "fingerprint" | "source">, b: Pick<ReupJob, "fingerprint" | "source">): boolean => {
  if (a.fingerprint && a.fingerprint === b.fingerprint) return true;
  if (a.source.kind !== "folder" || b.source.kind !== "folder") return false;
  const mine = names(a.source);
  if (!mine.size) return false;
  const theirs = names(b.source);
  return [...mine].filter((n) => theirs.has(n)).length / mine.size >= REUP_LIMITS.FOLDER_OVERLAP;
};
export const reupSourceReuses = (job: Pick<ReupJob, "fingerprint" | "source">, past: Pick<ReupJob, "fingerprint" | "source" | "outputs">[]): number => past.filter((p) => p.outputs.length > 0 && reupSameSource(job, p)).length;
