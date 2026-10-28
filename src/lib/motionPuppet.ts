import { stringifyJson } from "./jsonStringify.js";
import _ from "lodash";
import { PUPPET as P, PUPPET_LIBRARY_MODES as LM, PUPPET_STYLE_NONE } from "../constants/motionPuppet.js";
import type { MotionBeat, MotionStoryAnalysis, MotionStoryScript } from "../types/motionVideo.js";
import { motionNarratorLines } from "./motionVoice.js";
import { MOTION_VISUAL_CONTRACT as V } from "../constants/motionVisualContract.js";
import type { MotionScenePlan } from "../types/motionVideo.js";
import type { PuppetFrame, PuppetVisualUnit } from "../types/motionPuppet.js";
export interface PuppetLine {
  key: string;
  text: string;
  beatId: string;
  place?: string;
  speaker?: string;
  chapterId: string;
  cast: string[];
  utterance?: string;
  scenePlan?: MotionScenePlan;
  action?: string;
  time?: string;
  visualUnit?: PuppetVisualUnit;
  speakers?: string[];
  sourcePlans?: { beatId: string; place?: string; time?: string; action?: string; scenePlan?: MotionScenePlan }[];
}
export const puppetSentenceKey = (text: string): string =>
  _.trim(
    String(text || P.EMPTY)
      .toLowerCase()
      .normalize(P.NFC)
      .replace(P.NORM_STRIP_RE, P.SPACE),
  );
export const splitPuppetSentences = (text: string): string[] => _.compact(_.map(String(text || P.EMPTY).match(P.SENTENCE_RE) || [], _.trim));
export const puppetBeatLines = (beat: MotionBeat, narratorKey?: string): PuppetLine[] => {
  const parts = beat.utterances?.length ? motionNarratorLines(beat.utterances, narratorKey, beat.narration).map((u) => ({ text: u.text, speaker: u.role === P.DIALOGUE ? u.speaker : undefined, id: u.id })) : [{ text: beat.narration, speaker: undefined, id: undefined }];
  const out: PuppetLine[] = [];
  for (const part of parts)
    for (const text of splitPuppetSentences(part.text)) {
      const sentence = puppetSentenceKey(text);
      const key = [beat.id, out.length, sentence].join(V.KEY_SEPARATOR);
      if (sentence) out.push({ key, text, beatId: beat.id, place: beat.place, speaker: part.speaker, chapterId: beat.chapterId, cast: beat.cast || [], utterance: part.id, scenePlan: beat.scenePlan, action: beat.action, time: beat.time });
    }
  return out;
};
export const collectPuppetLines = (script: MotionStoryScript, sceneVisual: string, narratorKey?: string): PuppetLine[] => {
  narratorKey = narratorKey || script.gen?.puppet?.narratorKey;
  const seen = new Set<string>();
  const out: PuppetLine[] = [];
  for (const beat of script.beats as MotionBeat[]) {
    if (beat.visual !== sceneVisual) continue;
    for (const l of puppetBeatLines(beat, narratorKey)) {
      if (seen.has(l.key)) continue;
      seen.add(l.key);
      out.push(l);
    }
  }
  return out;
};
export const puppetVisualInputKey = (lines: PuppetLine[]): string => {
  const source = stringifyJson(lines);
  let hash: number = V.HASH_SEED;
  for (let index = 0; index < source.length; index++) hash = Math.imul(hash ^ source.charCodeAt(index), V.HASH_MULTIPLIER);
  return [source.length, (hash >>> 0).toString(V.HASH_BASE)].join(V.KEY_SEPARATOR);
};
export const puppetFrameLook = (frame: PuppetFrame): string =>
  stringifyJson([frame.shot, frame.set, frame.light, frame.prop, frame.propMount, frame.propAt, frame.propRot, frame.propX, frame.propY, frame.propH, frame.items, frame.blocking, frame.form, frame.anchor, frame.inset, frame.set2, frame.light2, frame.overlays, frame.effectSource, frame.effectTarget, frame.effectMode, frame.smokeX, frame.smokeY, frame.camera, frame.actors]);
export const puppetNoPack = (stylePreset: unknown, references: number): boolean => references > 0 || !stylePreset || stylePreset === PUPPET_STYLE_NONE;
export const puppetLibraryMode = (analysis: Pick<MotionStoryAnalysis, "stylePreset" | "series">, references: number): string => ((analysis.series?.count || 0) >= 2 ? LM.SERIES : puppetNoPack(analysis.stylePreset, references) ? LM.FRESH : LM.AUTO);
export const puppetTags = (v: unknown): string[] => _.take(_.uniq(_.compact(_.map(_.castArray(v || []), (t) => _.snakeCase(_.toString(t))))), P.TAGS_MAX);
