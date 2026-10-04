import {
  SOURCE_TEMPLATE_DIALOGUE_SEGMENT_MISSING,
  SOURCE_TEMPLATE_INVALID_TAKE_DECISION,
  SOURCE_TEMPLATE_SEGMENTS_MISSING,
  SOURCE_TEMPLATE_SEGMENT_BOUNDARY_MISMATCH,
  SOURCE_TEMPLATE_SEGMENT_ID_MISMATCH,
  SOURCE_TEXT_ALL_SCENES_OMITTED,
  SOURCE_TEXT_DECISIONS,
  SOURCE_TEXT_DECISION_COUNT_MISMATCH,
  SOURCE_TEXT_DECISION_INVALID,
  SOURCE_TEXT_DUPLICATE_SCENE_ID,
  SOURCE_TEXT_OMIT,
  SOURCE_TEXT_SCENEID,
  SOURCE_TEXT_SCENE_ID_MISMATCH,
  SOURCE_TEXT_SEGMENTID,
  SOURCE_TEXT_TRIM,
  SOURCE_TEXT_UNKNOWN_SCENE_ID,
  SOURCE_TEXT_USE,
} from "../../constants/sourceText";
import { execFile } from "child_process";
import fs from "fs";
import path from "path";
import _ from "lodash";
import { jsonUtils } from "../../lib/json.js";
import { CINEMATIC_EDIT_ANALYSIS_CONFIG } from "../../constants/config.js";
import { getPythonCommand, getStaticResourcePath } from "../utils/paths.js";
export interface CinematicLibraryClipInput {
  sceneId: string;
  path: string;
  hasAudio: boolean;
  protectDialogue: boolean;
  narrativeRole?: string;
  protectNarrative?: boolean;
  expectedDialogue?: string;
  dialogueLanguage?: string;
}
interface CinematicLibrarySegment {
  segmentId: string;
  inSeconds: number;
  outSeconds: number;
  shotRole: "master" | "coverage" | "reaction" | "insert" | "transition" | "payoff";
  storyContribution: string;
  transition: "cut" | "match_cut" | "cross_dissolve" | "fade_black";
  audioBridgeMode: "hard" | "j_cut" | "l_cut" | "ambience";
  containsDialogue: boolean;
  libraryScore?: number;
}
export interface CinematicLibraryDecision {
  sceneId: string;
  duration: number;
  width?: number;
  height?: number;
  hasAudio?: boolean;
  trimStartSeconds: number;
  trimEndSeconds: number;
  sourceCrop: string;
  warnings: string[];
  takeDecision: "use" | "trim" | "omit";
  reason: string;
  segments: CinematicLibrarySegment[];
  candidateSegments?: CinematicLibrarySegment[];
  shotBoundaries?: number[];
  observedShotCount: number;
  sharpnessScore?: number;
  motionScore?: number;
  sharpnessRaw?: number;
  motionRaw?: number;
  duplicateFrameRatio?: number;
  library?: string;
  libraryConfidence?: number;
  needsAiReview?: boolean;
  visuallySimilarToSceneId?: string;
  visualSimilarityScore?: number;
  speechAnalysisAvailable?: boolean;
  detectedSpeechRanges?: Array<[number, number]>;
  recognizedTranscript?: string;
  dialogueCoverageRatio?: number;
  dialogueTextMatchScore?: number;
  dialogueMismatch?: boolean;
  selectedDuration?: number;
  analysisProvenance?: string[];
}
export interface CinematicEditorialValidationResult {
  valid: boolean;
  error?: string;
}
type EditorialDecisionInput = {
  sceneId?: unknown;
  takeDecision?: unknown;
  segments?: Array<{ segmentId?: unknown; inSeconds?: unknown; outSeconds?: unknown }>;
};
export const validateCinematicEditorialDecisions = (expected: CinematicLibraryDecision[], editorialDecisions: EditorialDecisionInput[]): CinematicEditorialValidationResult => {
  const expectedByScene = _.keyBy(expected, SOURCE_TEXT_SCENEID);
  const expectedIds = _.map(expected, SOURCE_TEXT_SCENEID);
  const returnedIds = _.map(editorialDecisions, (decision) => _.trim(_.toString(decision?.sceneId)));
  if (_.size(editorialDecisions) !== _.size(expectedIds)) return { valid: false, error: SOURCE_TEXT_DECISION_COUNT_MISMATCH };
  if (!_.isEmpty(editorialDecisions) && _.every(editorialDecisions, (decision) => _.isEqual(decision?.takeDecision, SOURCE_TEXT_OMIT))) {
    return { valid: false, error: SOURCE_TEXT_ALL_SCENES_OMITTED };
  }
  if (_.size(_.uniq(returnedIds)) !== _.size(returnedIds)) return { valid: false, error: SOURCE_TEXT_DUPLICATE_SCENE_ID };
  if (!_.isEqual(_.sortBy(returnedIds), _.sortBy(expectedIds))) return { valid: false, error: SOURCE_TEXT_SCENE_ID_MISMATCH };
  for (const editorial of editorialDecisions) {
    if (!editorial || !_.isObject(editorial)) return { valid: false, error: SOURCE_TEXT_DECISION_INVALID };
    const sceneId = _.trim(_.toString(editorial.sceneId));
    const library = expectedByScene[sceneId];
    if (!library) return { valid: false, error: SOURCE_TEXT_UNKNOWN_SCENE_ID };
    if (!_.includes([SOURCE_TEXT_USE, SOURCE_TEXT_TRIM, SOURCE_TEXT_OMIT] as string[], editorial.takeDecision)) return { valid: false, error: SOURCE_TEMPLATE_INVALID_TAKE_DECISION(`${sceneId}`) };
    const segments = _.castArray(editorial.segments || []);
    if (!_.isEqual(editorial.takeDecision, SOURCE_TEXT_OMIT) && _.isEmpty(segments)) return { valid: false, error: SOURCE_TEMPLATE_SEGMENTS_MISSING(`${sceneId}`) };
    const candidatesById = _.keyBy(library.candidateSegments || library.segments, SOURCE_TEXT_SEGMENTID);
    const protectedDialogueIds = _.map(
      _.filter(library.candidateSegments || library.segments, (segment) => segment.containsDialogue),
      SOURCE_TEXT_SEGMENTID,
    );
    const seenSegmentIds = new Set<string>();
    for (const segment of segments) {
      const segmentId = _.trim(_.toString(segment.segmentId));
      const candidate = candidatesById[segmentId];
      if (!candidate || seenSegmentIds.has(segmentId)) return { valid: false, error: SOURCE_TEMPLATE_SEGMENT_ID_MISMATCH(`${sceneId}`) };
      seenSegmentIds.add(segmentId);
      if (!_.isEqual(_.toNumber(segment.inSeconds), _.toNumber(candidate.inSeconds)) || !_.isEqual(_.toNumber(segment.outSeconds), _.toNumber(candidate.outSeconds))) {
        return { valid: false, error: SOURCE_TEMPLATE_SEGMENT_BOUNDARY_MISMATCH(`${sceneId}`) };
      }
    }
    if (!_.isEqual(editorial.takeDecision, SOURCE_TEXT_OMIT) && !_.every(protectedDialogueIds, (segmentId) => seenSegmentIds.has(segmentId))) {
      return { valid: false, error: SOURCE_TEMPLATE_DIALOGUE_SEGMENT_MISSING(`${sceneId}`) };
    }
  }
  return { valid: true };
};
export interface CinematicLibraryAnalysisResult {
  success: boolean;
  libraryAnalysisAvailable: boolean;
  decisions: CinematicLibraryDecision[];
  error?: string;
}
export const analyzeCinematicClipsWithLibraries = async (clips: CinematicLibraryClipInput[], ffmpegPath: string, workingDirectory: string): Promise<CinematicLibraryAnalysisResult> => {
  const requestPath = path.join(workingDirectory, CINEMATIC_EDIT_ANALYSIS_CONFIG.LIBRARY_REQUEST_FILE_NAME);
  const scriptPath = getStaticResourcePath(CINEMATIC_EDIT_ANALYSIS_CONFIG.LIBRARY_SCRIPT_PATH);
  const payload = {
    ffmpegPath,
    clips,
    config: CINEMATIC_EDIT_ANALYSIS_CONFIG.LIBRARY,
  };
  fs.writeFileSync(requestPath, jsonUtils.safeStringify(payload), CINEMATIC_EDIT_ANALYSIS_CONFIG.ENCODING as BufferEncoding);
  return new Promise((resolve) => {
    execFile(
      getPythonCommand(),
      [scriptPath, requestPath],
      {
        windowsHide: true,
        timeout: CINEMATIC_EDIT_ANALYSIS_CONFIG.LIBRARY_TIMEOUT_MS,
        maxBuffer: CINEMATIC_EDIT_ANALYSIS_CONFIG.LIBRARY_MAX_BUFFER_BYTES,
      },
      (error, stdout, stderr) => {
        const parsed = _.attempt(JSON.parse, _.trim(stdout));
        if (!error && !_.isError(parsed) && _.isArray(_.get(parsed, SOURCE_TEXT_DECISIONS))) {
          resolve(parsed as CinematicLibraryAnalysisResult);
          return;
        }
        resolve({
          success: false,
          libraryAnalysisAvailable: false,
          decisions: [],
          error: _.trim(_.toString(stderr || error?.message || CINEMATIC_EDIT_ANALYSIS_CONFIG.LIBRARY_UNKNOWN_ERROR)),
        });
      },
    );
  });
};
