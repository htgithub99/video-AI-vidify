import fs from "fs";
import path from "path";
import _ from "lodash";
import { createHash } from "crypto";
import { PUPPET as P } from "../../../constants/motionPuppet.js";
import * as MR from "../../../constants/motionRuntime.js";
import type { MotionAiExecution, MotionAudioDirection, MotionBeat, MotionGenState, MotionPlace, MotionStoryAnalysis, MotionStyleReference } from "../../../types/motionVideo.js";
import { getMotionRootDirectory } from "../motionLibraryService.js";
import type { runMotionAi } from "../motionStoryService.js";

export interface GenOptions {
  audioDirection?: MotionAudioDirection | Promise<MotionAudioDirection | undefined>;
  styleReferences?: MotionStyleReference[];
  characterMotion?: boolean;
  exec: MotionAiExecution;
  mainExec?: MotionAiExecution;
  signal?: AbortSignal;
  log: (s: string) => void;
  progress?: (p: number, stage?: string) => void;
  partial?: (r: unknown) => void;
  aspect?: string;
  onlyBeats?: string[];
  onlyLocations?: string[];
  note?: string;
  review?: boolean;
  ai?: typeof runMotionAi;
}

export const emptyGen = (): MotionGenState => ({ style: {}, cast: {}, locations: {}, locationInfo: {}, staging: {}, previews: {}, failed: [] });

export const prepareMotionGen = (previous: MotionGenState | undefined, analysis: MotionStoryAnalysis, referenceKey: string): MotionGenState => {
  const signature = createHash(P.SHA)
    .update(JSON.stringify({ version: P.GEN_VERSION, referenceKey, cast: analysis.cast, places: analysis.places, era: analysis.era, look: analysis.look }))
    .digest(P.HEX);
  const compatible = previous?.creativeSignature === signature;
  return { ...emptyGen(), ...(compatible ? _.cloneDeep(previous || {}) : {}), ...(previous?.voiceCast ? { voiceCast: { ...previous.voiceCast } } : {}), creativeSignature: signature, referenceKey, characterMode: MR.MOTION_TEXT_DRAWN, drawingMode: MR.MOTION_TEXT_2D, videoDna: analysis.videoDna };
};

const previewRoot = (): string => {
  const dir = path.join(getMotionRootDirectory(), P.PREVIEW_FOLDER);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
};
export const genPreviewDir = (...parts: string[]): string => path.join(previewRoot(), ...parts);
export const genPreviewRel = (file: string): string => path.relative(previewRoot(), file).split(path.sep).join(P.PATH_SEP);
export const resolveGenPreview = (rel: string): string | null => {
  const root = path.resolve(previewRoot());
  const file = path.resolve(root, _.toString(rel));
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file)) return null;
  return file;
};

const placeTokens = (text: string): string[] =>
  _.uniq(
    _.toLower(_.toString(text))
      .normalize(P.NFD)
      .replace(P.DIACRITICS, P.EMPTY)
      .replace(P.D_STROKE, P.D_PLAIN)
      .split(P.TOKEN_SPLIT)
      .filter((token) => token && !_.includes(P.PLACE_STOPWORDS as readonly string[], token)),
  );
const similar = (a: string[], b: string[]): boolean => {
  if (!a.length || !b.length) return false;
  const shared = _.intersection(a, b).length;
  const small = a.length <= b.length ? a : b;
  if (shared === small.length && small.length >= P.PLACE_MATCH_SUBSET_MIN) return true;
  return shared / _.union(a, b).length >= P.PLACE_MATCH_JACCARD;
};
const matchPlace = (candidate: { key: string; name?: string }, places: { key: string; name?: string }[]): string | undefined => {
  const keyTokens = placeTokens(candidate.key),
    nameTokens = placeTokens(candidate.name || P.EMPTY);
  return _.find(places, (place) => place.key !== candidate.key && (similar(keyTokens, placeTokens(place.key)) || (!!nameTokens.length && similar(nameTokens, placeTokens(place.name || P.EMPTY)))))?.key;
};

export const withBeatPlaces = (analysis: MotionStoryAnalysis, beats: MotionBeat[], o: GenOptions): MotionStoryAnalysis => {
  const merged: string[] = [];
  const pool: { key: string; name?: string }[] = [...analysis.places];
  for (const b of beats) {
    if (!b.place || _.some(pool, { key: b.place })) continue;
    const into = matchPlace({ key: b.place, name: b.placeName }, pool);
    if (into) {
      merged.push(P.MERGED_PAIR(b.placeName || b.place, into));
      b.place = into;
    } else pool.push({ key: b.place, name: b.placeName });
  }
  if (merged.length) o.log(P.LOG_MERGED_PLACES(_.uniq(merged).join(P.COMMA)));
  const known = new Set(_.map(analysis.places, (p) => p.key));
  const extra: MotionPlace[] = _.map(
    _.uniqBy(
      _.filter(beats, (b) => !!b.place && !known.has(b.place)),
      (b) => b.place,
    ),
    (b) => ({ key: b.place!, name: b.placeName || b.place!, description: _.compact([b.placeName || b.place, b.action]).join(P.SEP), interior: P.INTERIOR_RE.test(_.toString(b.place)), time: P.DARK_RE.test(_.toString(b.time)) ? P.NIGHT : P.DAY }),
  );
  if (!extra.length) return analysis;
  o.log(P.LOG_PLACES_ADDED(_.map(extra, (p) => p.name).join(P.COMMA)));
  return { ...analysis, places: [...analysis.places, ...extra] };
};
