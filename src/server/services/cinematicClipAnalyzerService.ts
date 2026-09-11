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
  const expectedByScene = _.keyBy(expected, "sceneId");
  const expectedIds = _.map(expected, "sceneId");
  const returnedIds = _.map(editorialDecisions, (decision) => _.trim(_.toString(decision?.sceneId)));
  if (_.size(editorialDecisions) !== _.size(expectedIds)) return { valid: false, error: "decision_count_mismatch" };
  if (!_.isEmpty(editorialDecisions) && _.every(editorialDecisions, (decision) => _.isEqual(decision?.takeDecision, "omit"))) {
    return { valid: false, error: "all_scenes_omitted" };
  }
  if (_.size(_.uniq(returnedIds)) !== _.size(returnedIds)) return { valid: false, error: "duplicate_scene_id" };
  if (!_.isEqual(_.sortBy(returnedIds), _.sortBy(expectedIds))) return { valid: false, error: "scene_id_mismatch" };

  for (const editorial of editorialDecisions) {
    if (!editorial || !_.isObject(editorial)) return { valid: false, error: "decision_invalid" };
    const sceneId = _.trim(_.toString(editorial.sceneId));
    const library = expectedByScene[sceneId];
    if (!library) return { valid: false, error: "unknown_scene_id" };
    if (!_.includes(["use", "trim", "omit"], editorial.takeDecision)) return { valid: false, error: `invalid_take_decision:${sceneId}` };
    const segments = _.castArray(editorial.segments || []);
    if (!_.isEqual(editorial.takeDecision, "omit") && _.isEmpty(segments)) return { valid: false, error: `segments_missing:${sceneId}` };
    const candidatesById = _.keyBy(library.candidateSegments || library.segments, "segmentId");
    const protectedDialogueIds = _.map(
      _.filter(library.candidateSegments || library.segments, (segment) => segment.containsDialogue),
      "segmentId",
    );
    const seenSegmentIds = new Set<string>();
    for (const segment of segments) {
      const segmentId = _.trim(_.toString(segment.segmentId));
      const candidate = candidatesById[segmentId];
      if (!candidate || seenSegmentIds.has(segmentId)) return { valid: false, error: `segment_id_mismatch:${sceneId}` };
      seenSegmentIds.add(segmentId);
      if (!_.isEqual(_.toNumber(segment.inSeconds), _.toNumber(candidate.inSeconds)) || !_.isEqual(_.toNumber(segment.outSeconds), _.toNumber(candidate.outSeconds))) {
        return { valid: false, error: `segment_boundary_mismatch:${sceneId}` };
      }
    }
    if (!_.isEqual(editorial.takeDecision, "omit") && !_.every(protectedDialogueIds, (segmentId) => seenSegmentIds.has(segmentId))) {
      return { valid: false, error: `dialogue_segment_missing:${sceneId}` };
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

export const analyzeCinematicClipsWithLibraries = async (
  clips: CinematicLibraryClipInput[],
  ffmpegPath: string,
  workingDirectory: string,
): Promise<CinematicLibraryAnalysisResult> => {
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
        if (!error && !_.isError(parsed) && _.isArray(_.get(parsed, "decisions"))) {
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
