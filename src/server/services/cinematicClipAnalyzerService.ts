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
}

export interface CinematicLibrarySegment {
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
}

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
