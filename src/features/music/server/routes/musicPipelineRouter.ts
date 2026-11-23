import { RUNTIME_TEXT as RT_SERVER } from "../../../../constants/runtime/server.js";
import { RUNTIME_TEXT as RT_SHARED } from "../../../../constants/runtime/shared.js";
import { CHAT_PLANNING_RUNTIME as C } from "../../../../constants/chatPlanningRuntime.js";
import { AsyncTaskLimiter } from "../../../../lib/asyncTaskLimiter.js";
import { canRetryMusicEvaluation, waitForMusicEvaluationRetry } from "../../../../server/services/chatUploadRecovery.js";
import {
  SOURCE_TEMPLATE_SYMBOL_75,
  SOURCE_TEMPLATE_SYMBOL_86,
  SOURCE_TEMPLATE_BATCH,
  SOURCE_TEMPLATE_CHI_TIET,
  SOURCE_TEMPLATE_CHUNK,
  SOURCE_TEMPLATE_CREATIVEPROFILE,
  SOURCE_TEMPLATE_ERA,
  SOURCE_TEMPLATE_EVIDENCE_CLAIM,
  SOURCE_TEMPLATE_EVIDENCE_CONFIDENCE,
  SOURCE_TEMPLATE_EVIDENCE_SOURCECLUE,
  SOURCE_TEMPLATE_FALLBACK,
  SOURCE_TEMPLATE_HASHTAGS_MUST_BE_UNIQUE_ASCII_VALUES,
  SOURCE_TEMPLATE_HISTORICALINFLUENCES,
  SOURCE_TEMPLATE_KHONG_THE_PHUC_HOI_WAV_GOC,
  SOURCE_TEMPLATE_LYRICALDNA,
  SOURCE_TEMPLATE_MARKET,
  SOURCE_TEMPLATE_MUSICALDNA,
  SOURCE_TEMPLATE_MUSICIMAGENOTE_FAILED_REQUESTID,
  SOURCE_TEMPLATE_MUSICPLAN_FAILED_REQUESTID_STAGE_CAUSE,
  SOURCE_TEMPLATE_MUSICPLAN_NON_FATAL_SEO_FAILURE_REQUESTID,
  SOURCE_TEMPLATE_MUSICPLAN_SEO_CONTRACT_ATTEMPT_ISSUES,
  SOURCE_TEMPLATE_MUSICPLAN_SONG_COMPOSITION_CONTRACT_BATCH_ATTEMPT,
  SOURCE_TEMPLATE_MUSICPLAN_STYLE_ANALYSIS_CONTRACT_ATTEMPT_ISSUES,
  SOURCE_TEMPLATE_MUSICPLAN_STYLE_ANALYSIS_JSON_PARSE_FAILED,
  SOURCE_TEMPLATE_MUSICSEOREGENERATE_CONTRACT_ATTEMPT_ISSUES,
  SOURCE_TEMPLATE_MUSICTHUMBNAIL_EXHAUSTED_ATTEMPTS_WARNING,
  SOURCE_TEMPLATE_MUSICTHUMBNAIL_FAILED_ATTEMPT_REASON,
  SOURCE_TEMPLATE_MUSICTHUMBNAIL_GEMINI_RETURNED_INVALID_IMAGE_ATTEMPT,
  SOURCE_TEMPLATE_MUSICTHUMBNAIL_GEMINI_RETURNED_NO_IMAGE_ATTEMPT,
  SOURCE_TEMPLATE_MUSICTHUMBNAIL_START_ATTEMPT_SONGS_HASREFERENCE,
  SOURCE_TEMPLATE_MUSICTHUMBNAIL_SUCCESS_ATTEMPT_BYTES,
  SOURCE_TEMPLATE_MUSIC_IMAGE_PROMPT,
  SOURCE_TEMPLATE_MUST_BE,
  SOURCE_TEMPLATE_MUST_BE_AN_INTEGER_FROM_0,
  SOURCE_TEMPLATE_MUST_BE_NON_EMPTY_TEXT,
  SOURCE_TEMPLATE_PLAYLIST_SEO,
  SOURCE_TEMPLATE_REGENERATE,
  SOURCE_TEMPLATE_SEO_3,
  SOURCE_TEMPLATE_SEO_4,
  SOURCE_TEMPLATE_SEO_CHUA_DAT_DINH_DANG_YEU,
  SOURCE_TEMPLATE_SEO_OPTION,
  SOURCE_TEMPLATE_SONG,
  SOURCE_TEMPLATE_SONG_2,
  SOURCE_TEMPLATE_SONG_RANKING,
  SOURCE_TEMPLATE_STYLE_ANALYSIS,
  SOURCE_TEMPLATE_SUNO_CREATE,
  SOURCE_TEMPLATE_SUNO_SETTINGS,
  SOURCE_TEMPLATE_SYMBOL_16,
  SOURCE_TEMPLATE_SYMBOL_36,
  SOURCE_TEMPLATE_SYMBOL_40,
  SOURCE_TEMPLATE_SYMBOL_5,
  SOURCE_TEMPLATE_SYMBOL_6,
  SOURCE_TEMPLATE_TAGS_MUST_BE_UNIQUE_UNACCENTED_WORDS,
  SOURCE_TEMPLATE_TITLE_HAS_DISALLOWED_PUNCTUATION_OR_CLAIM,
  SOURCE_TEMPLATE_TITLE_MUST_CAPITALIZE_EVERY_WORD,
  SOURCE_TEMPLATE_TRACKID,
  SOURCE_TEMPLATE_TRACKID_CAUSE,
  SOURCE_TEMPLATE_VIDIFY_EVALUATION_MP3,
  SOURCE_TEXT_0,
  SOURCE_TEXT_96K,
  SOURCE_TEXT_ABORTED,
  SOURCE_TEXT_AN_ARRAY_OF_TEXT,
  SOURCE_TEXT_ARRAY,
  SOURCE_TEXT_ARTIFACTTYPE,
  SOURCE_TEXT_AUDIENCEAGE,
  SOURCE_TEXT_AUDIOINFLUENCE,
  SOURCE_TEXT_A_NON_EMPTY_ARRAY_OF_TEXT,
  SOURCE_TEXT_BASE64,
  SOURCE_TEXT_CANDIDATES,
  SOURCE_TEXT_CODE,
  SOURCE_TEXT_CONTENTSUITABILITY,
  SOURCE_TEXT_COUNTRY,
  SOURCE_TEXT_COVER,
  SOURCE_TEXT_CREATEDSONGIDS,
  SOURCE_TEXT_CREATIVEPROFILE_ROLE,
  SOURCE_TEXT_CULTUREANDMARKET,
  SOURCE_TEXT_DESC,
  SOURCE_TEXT_DIALECT,
  SOURCE_TEXT_DURATION,
  SOURCE_TEXT_END,
  SOURCE_TEXT_ERAANDGENRE,
  SOURCE_TEXT_ERROR,
  SOURCE_TEXT_EVALUATION_AUDIO_CACHE_HIT,
  SOURCE_TEXT_EVALUATION_AUDIO_DOWNLOAD_FAILED,
  SOURCE_TEXT_EVALUATION_AUDIO_PREPARATION_STARTED,
  SOURCE_TEXT_EVALUATION_AUDIO_READY,
  SOURCE_TEXT_EVALUATION_BROWSER_CLEANUP,
  SOURCE_TEXT_EVALUATION_CHECKPOINT_RESUMED,
  SOURCE_TEXT_EVALUATION_CHECKPOINT_SAVED,
  SOURCE_TEXT_EVALUATION_RESPONSE_PARSED,
  SOURCE_TEXT_EVALUATION_ROOM_FAILED,
  SOURCE_TEXT_EVALUATION_ROOM_READY,
  SOURCE_TEXT_EVALUATION_WAV_CACHED,
  SOURCE_TEXT_EVIDENCE,
  SOURCE_TEXT_EVIDENCE_MUST_BE_A_NON_EMPTY,
  SOURCE_TEXT_EXCLUDESTYLES,
  SOURCE_TEXT_EXPECTEDEFFECT,
  SOURCE_TEXT_FINISH,
  SOURCE_TEXT_GENRE_INFLUENCES,
  SOURCE_TEXT_GENRE_PRIMARY,
  SOURCE_TEXT_GENRE_SECONDARY,
  SOURCE_TEXT_HARMONY,
  SOURCE_TEXT_HISTORICALINFLUENCES_MUST_BE_AN_ARRAY,
  SOURCE_TEXT_HOOKPLACEMENT,
  SOURCE_TEXT_IMAGERY,
  SOURCE_TEXT_INSTRUMENTATION,
  SOURCE_TEXT_INTEGER,
  SOURCE_TEXT_INTERACTIONS,
  SOURCE_TEXT_INVALID_JSON,
  SOURCE_TEXT_INVALID_REQUEST,
  SOURCE_TEXT_LANGUAGE,
  SOURCE_TEXT_LIBMP3LAME,
  SOURCE_TEXT_LISTENINGCONTEXT,
  SOURCE_TEXT_LYRICALCHARACTERAGE,
  SOURCE_TEXT_MARKET_CONFIDENCE,
  SOURCE_TEXT_MAXMODE,
  SOURCE_TEXT_MELODICLANGUAGE,
  SOURCE_TEXT_MESSAGE,
  SOURCE_TEXT_MP3,
  SOURCE_TEXT_MUSIC_IMAGE_GENERATION_FAILED,
  SOURCE_TEXT_MUSIC_IMAGE_GENERATION_REQUIREMENTS,
  SOURCE_TEXT_MUSIC_IMAGE_INVALID_RESULT,
  SOURCE_TEXT_MUSTNOTCOPY,
  SOURCE_TEXT_MUSTPRESERVE,
  SOURCE_TEXT_MUSTVARY,
  SOURCE_TEXT_NAME,
  SOURCE_TEXT_NARRATIVEVOICE,
  SOURCE_TEXT_OBJECT,
  SOURCE_TEXT_PARSED,
  SOURCE_TEXT_PERSONALIZE,
  SOURCE_TEXT_PLAN_BATCH_ATTEMPT_FAILED,
  SOURCE_TEXT_PLAN_BATCH_COMPLETED,
  SOURCE_TEXT_PLAN_BATCH_FAILED,
  SOURCE_TEXT_PLAN_BATCH_FALLBACK,
  SOURCE_TEXT_PLAN_BATCH_RESPONSE,
  SOURCE_TEXT_PLAN_BATCH_STARTED,
  SOURCE_TEXT_PLAN_CLEANUP_FAILED,
  SOURCE_TEXT_PLAN_COMPLETED,
  SOURCE_TEXT_PLAN_CONTRACT_FAILED,
  SOURCE_TEXT_PLAN_FAILED,
  SOURCE_TEXT_PLAN_SEO_CONTRACT_FAILED,
  SOURCE_TEXT_PLAN_SEO_FAILED,
  SOURCE_TEXT_PLAN_SEO_RESPONSE,
  SOURCE_TEXT_PLAN_STAGE_STARTED,
  SOURCE_TEXT_PLAN_STARTED,
  SOURCE_TEXT_PLAN_STYLE_ATTEMPT_FAILED,
  SOURCE_TEXT_PLAN_STYLE_RESPONSE,
  SOURCE_TEXT_PLAN_VALIDATION_FAILED,
  SOURCE_TEXT_PLAYLIST_TRACKS_RECOVERED,
  SOURCE_TEXT_PLAYLIST_TRACKS_RECOVERY_STARTED,
  SOURCE_TEXT_PRODUCTIONERA,
  SOURCE_TEXT_PRODUCTIONGOAL,
  SOURCE_TEXT_PRODUCTIONPRINCIPLES,
  SOURCE_TEXT_QUALITYSCORE,
  SOURCE_TEXT_QUALITYSCORES,
  SOURCE_TEXT_REGION,
  SOURCE_TEXT_REJECTED,
  SOURCE_TEXT_RELEVANCE,
  SOURCE_TEXT_REQUESTID,
  SOURCE_TEXT_RHYMEBEHAVIOR,
  SOURCE_TEXT_RHYTHM,
  SOURCE_TEXT_RISK,
  SOURCE_TEXT_ROLE,
  SOURCE_TEXT_SELECTEDTRACKIDS,
  SOURCE_TEXT_SELECTED_TRACKS_DURATIONS_CHECKED,
  SOURCE_TEXT_SEO_TITLES_ARE_DUPLICATED,
  SOURCE_TEXT_SEO_WARNING,
  SOURCE_TEXT_SONGANDARRANGEMENTPROFILE,
  SOURCE_TEXT_SONGFORMS,
  SOURCE_TEXT_SONGID,
  SOURCE_TEXT_SONGWRITINGERA,
  SOURCE_TEXT_STACK,
  SOURCE_TEXT_STRENGTHS,
  SOURCE_TEXT_STRING,
  SOURCE_TEXT_STYLEINFLUENCE,
  SOURCE_TEXT_SUCCESS,
  SOURCE_TEXT_SUNO_CREATE_COMPLETED,
  SOURCE_TEXT_SUNO_CREATE_FAILED,
  SOURCE_TEXT_SUNO_CREATE_STARTED,
  SOURCE_TEXT_SUNO_CREATE_VALIDATION_FAILED,
  SOURCE_TEXT_SUNO_DOWNLOAD_HTTP_502,
  SOURCE_TEXT_SYMBOL_10,
  SOURCE_TEXT_SYMBOL_16,
  SOURCE_TEXT_SYMBOL_34,
  SOURCE_TEXT_SYMBOL_4,
  SOURCE_TEXT_SYMBOL_6,
  SOURCE_TEXT_SYNTHETICROLE,
  SOURCE_TEXT_TEMPORANGE,
  SOURCE_TEXT_THEMES,
  SOURCE_TEXT_UNCERTAINTIES,
  SOURCE_TEXT_VALIDATION,
  SOURCE_TEXT_VARIETY,
  SOURCE_TEXT_VOCABULARY,
  SOURCE_TEXT_VOCALCHARACTER,
  SOURCE_TEXT_VOCALGENDER,
  SOURCE_TEXT_VOCALPROFILE,
  SOURCE_TEXT_WEIRDNESS,
  SOURCE_TEXT_WRITINGPRINCIPLES,
} from "../../../../constants/sourceText.js";
import { randomUUID } from "crypto";
import express, { Request, Response } from "express";
import ffmpeg from "fluent-ffmpeg";
import fs from "fs";
import _ from "lodash";
import path from "path";
import { MUSIC_CREATOR_CONSTANTS, MUSIC_CREATOR_TEXTS, ROUTER_PATHS } from "../../../../constants";
import { CINEMATIC_CHAT_PLANNING_CONFIG, normalizeCinematicArtifactIdentity } from "../../../../constants/cinematicConstants.js";
import { GEMINI_MEDIA_ERRORS } from "../../../../constants/config.js";
import { HttpStatus } from "../../../../constants/enums.js";
import { MOTION_TEMPLATE_SYMBOL_12, MOTION_TEMPLATE_SYMBOL_24 } from "../../../../constants/motionRuntime.js";
import { MUSIC_CREATOR_REGEXES } from "../../../../constants/musicCreator.js";
import { FeatureType, SecurityConstants } from "../../../../constants/security.js";
import { SUNO_AUTOMATION_CONFIG, SUNO_AUTOMATION_PATTERNS, SUNO_AUTOMATION_TEXTS } from "../../../../constants/sunoAutomation.js";
import { jsonUtils } from "../../../../lib/json.js";
import { createAppError, logger } from "../../../../lib/logger.js";
import { delayAsync } from "../../../../lib/shared-utils.js";
import { getDownloadedImageMimeType } from "../../../../server/utils/imageMedia.js";
import { AiPlanningChatModel, AiPlanningExecutionMode, AiPlanningFallbackProvider, AspectRatio, GenerateType, ImageGenerationMode, ImageGeneratorEngine, PromptInputMethod } from "../../../../types.js";
import { requireLicense } from "../../../../server/middlewares/requireLicense.js";
import { beginChatPlanningRun, closeChatBrowserIfIdle, closeChatPlanningRoom, closeChatPlanningRoomsForProject, generatePlanningWithChatUi, prepareChatPlanningRoom } from "../../../../server/services/chatUiPlanningService.js";
import { generateImageWithPlaywright, retainGlobalBrowser, scheduleGlobalBrowserCleanup } from "../../../../server/services/imageGeneratorService.js";
import { MUSIC_PLANNING as MUSIC_PLAN } from "../../../../constants/musicPlanning.js";
import { MUSIC_CREATION_OPTIONS as MUSIC_OPTIONS } from "../../constants/musicCreationOptions.js";
import { validMusicEditorialReview, musicReviewOrder } from "../../../../lib/musicPlanning.js";
import { musicLyricQualityIssues } from "../../../../lib/musicLyricQuality.js";
import { resolveMusicReferenceSource } from "../services/musicReferenceSourceService.js";
import { musicPlanReporter } from "../services/musicPlanProgress.js";
import { reviewMusicSongBatch } from "../services/musicSongReviewService.js";
import { musicErrorDetails, writeMusicDiagnostic } from "../../../../server/services/musicDiagnosticService.js";
import { RUNTIME_TEXT as RT_MUSIC } from "../../constants/runtimeText.js";
import { MUSIC_DOWNLOAD_RECOVERY as MUSIC_RECOVERY } from "../../constants/musicDownloadRecovery.js";
import { prepareMusicEvaluationRoom } from "../services/musicEvaluationRoomService.js";
import {
  createMusicDownloadCheckpointKey,
  createMusicEvaluationAudioCacheKey,
  deleteMusicDownloadCheckpoint,
  deleteMusicEvaluationAudio,
  deleteMusicEvaluationCheckpoint,
  getMusicEvaluationChunkSelections,
  readMusicDownloadCheckpoint,
  readMusicEvaluationAudio,
  readMusicEvaluationCheckpoint,
  readMusicEvaluationWav,
  writeMusicDownloadCheckpoint,
  writeMusicEvaluationAudio,
  writeMusicEvaluationWav,
  saveMusicEvaluationSelections,
  type MusicDownloadCheckpoint,
  type MusicDownloadSelection,
} from "../services/musicDownloadCheckpointService.js";
import { CHAT_ROOM_RECOVERY, CHROME_BACKUP } from "../../../../constants/chromeBackup.js";
import { cancelActiveSunoCreation, createSunoPlaylist, downloadSunoTracksToFolder, getSunoPlaylistTracks, launchSunoLoginBrowser } from "../services/sunoAutomationService.js";
import { sunoCreationReporter } from "../services/sunoCreationProgress.js";
import { musicDownloadReporter } from "../services/musicDownloadProgress.js";
import type { MusicDownloadProgress, MusicUploadProgress } from "../../../../types/musicDownloadProgress.js";
import { getLogsDirectory, getTempDirectory } from "../../../../server/utils/paths.js";
import { currentChatPolicy } from "../../../../server/utils/requestContext.js";
import { chatRoomLanes } from "../../../../lib/chatExecutionPolicy.js";
import { parseAiJsonArtifact, incrementFeatureUsage, musicPlanCheckpoints, activeMusicPlanCleanup, readMediaDurationSeconds } from "../../../../server/controllers/pipelineShared.js";
const router = express.Router();
interface MusicPlanRequestPayload {
  requestedSongCount: number;
  analyzeStyleFromSource: boolean;
  style: string;
  referenceSongs: string[];
  projectId: string;
  execution: Record<string, any>;
  requestId: string;
  thumbnailReference: string;
  thumbnailReferenceName: string;
  thumbnailDescription: string;
  sunoInspo: string;
}
let activeMusicPlanRuns = 0;
const parseAndValidateMusicPlanRequest = (req: Request): { isValid: boolean; payload?: MusicPlanRequestPayload; error?: string } => {
  const requestedSongCount = _.toNumber(req.body?.requestedSongCount);
  const style = _.trim(_.toString(req.body?.style));
  const analyzeStyleFromSource = req.body?.analyzeStyleFromSource === true;
  const referenceSongs = _.compact(_.map(_.castArray(req.body?.referenceSongs || []), (song) => _.trim(_.toString(song))));
  const projectId = _.toString(req.body?.projectId || SOURCE_TEMPLATE_SYMBOL_75(`${MUSIC_CREATOR_CONSTANTS.PROJECT_ID_PREFIX}`, `${Date.now()}`));
  const execution = req.body?.aiExecution || {};
  const requestId = _.toString(req.body?.requestId || projectId);
  const thumbnailReference = _.toString(req.body?.thumbnailReference);
  const thumbnailReferenceName = _.toString(req.body?.thumbnailReferenceName || SUNO_AUTOMATION_CONFIG.DEFAULT_REFERENCE_THUMBNAIL_NAME);
  const thumbnailDescription = _.trim(_.toString(req.body?.thumbnailDescription));
  const sunoInspo = _.trim(_.toString(req.body?.sunoInspo));
  const isValidCount = _.includes(MUSIC_CREATOR_CONSTANTS.ALLOWED_SONG_COUNTS, requestedSongCount as (typeof MUSIC_CREATOR_CONSTANTS.ALLOWED_SONG_COUNTS)[number]);
  if (!isValidCount) {
    return { isValid: false, error: MUSIC_CREATOR_TEXTS.vi.SERVER_VALIDATION_ERROR };
  }
  if (analyzeStyleFromSource && _.isEmpty(referenceSongs)) return { isValid: false, error: MUSIC_OPTIONS.TEXT.vi.sourceRequired };
  return { isValid: true, payload: { requestedSongCount, analyzeStyleFromSource, style, referenceSongs, projectId, execution, requestId, thumbnailReference, thumbnailReferenceName, thumbnailDescription, sunoInspo } };
};
const generateMusicThumbnailAsset = async (input: {
  songs: any[];
  style: string;
  styleAnalysis?: unknown;
  sourceContext?: string;
  description: string;
  reference: string;
  referenceName: string;
  chromeHeadless: boolean;
  assetPurpose?: string;
  showTrackList?: boolean;
  planningProvider?: AiPlanningFallbackProvider;
  planningModel?: AiPlanningChatModel;
  signal?: AbortSignal;
}): Promise<{ thumbnail: string | null; warning?: string }> => {
  let lastWarning: string = MUSIC_CREATOR_TEXTS.vi.THUMBNAIL_GENERATE_ERROR;
  const imageBrief =
    input.assetPurpose === SUNO_AUTOMATION_CONFIG.MUSIC_IMAGE_PURPOSE_VIDEO
      ? SUNO_AUTOMATION_TEXTS.buildMusicVideoBackgroundPrompt(input.songs, input.style, input.description, !_.isEmpty(input.reference), input.showTrackList !== false, input.styleAnalysis)
      : SUNO_AUTOMATION_TEXTS.buildMusicThumbnailPrompt(input.songs, input.style, input.description, !_.isEmpty(input.reference), input.sourceContext, input.styleAnalysis);
  const promptRequestId = SOURCE_TEMPLATE_MUSIC_IMAGE_PROMPT(SOURCE_TEMPLATE_SYMBOL_86(`${randomUUID()}`));
  const releaseBrowser = retainGlobalBrowser();
  const prompt: string = imageBrief;
  try {
    await writeMusicDiagnostic(SOURCE_TEXT_MUSIC_IMAGE_GENERATION_REQUIREMENTS, { runId: promptRequestId, purpose: input.assetPurpose || SOURCE_TEXT_COVER, originalNoteChars: _.trim(input.description).length, plannedPromptChars: prompt.length, hasReference: !_.isEmpty(input.reference) });
    let transientErrorCount = 0;
    const transientImageError = /(?:seem to be encountering an error|can i try something else for you|something went wrong|try again later)/i;
    for (let attempt = 0; attempt < SUNO_AUTOMATION_CONFIG.MUSIC_THUMBNAIL_ATTEMPTS; attempt += 1) {
      input.signal?.throwIfAborted();
      try {
        logger.info(SOURCE_TEMPLATE_MUSICTHUMBNAIL_START_ATTEMPT_SONGS_HASREFERENCE(SOURCE_TEMPLATE_SYMBOL_86(`${attempt + 1}`), SOURCE_TEMPLATE_SYMBOL_86(`${SUNO_AUTOMATION_CONFIG.MUSIC_THUMBNAIL_ATTEMPTS}`), SOURCE_TEMPLATE_SYMBOL_86(`${input.songs.length}`), SOURCE_TEMPLATE_SYMBOL_86(`${!_.isEmpty(input.reference)}`)));
        const result = await generateImageWithPlaywright({
          prompt,
          style: input.style,
          retainBrowserSession: true,
          forceNewPage: false,
          visualConfig: {
            chromeHeadless: input.chromeHeadless,
            generateType: GenerateType.Image,
            skipGenerateTypeSelection: true,
            aspectRatio: AspectRatio.SixteenNine,
            generateCount: 1,
            imageGeneratorEngine: ImageGeneratorEngine.Imagen,
            generationMode: ImageGenerationMode.GeminiChat,
            promptInputMethod: PromptInputMethod.Paste,
            referenceImages: _.isEmpty(input.reference) ? [] : [input.reference],
            referenceImageNames: _.isEmpty(input.reference) ? [] : [input.referenceName],
          },
        });
        input.signal?.throwIfAborted();
        if (!result.success) {
          lastWarning = result.warning || lastWarning;
          await writeMusicDiagnostic(SOURCE_TEXT_MUSIC_IMAGE_GENERATION_FAILED, { runId: promptRequestId, attempt: attempt + 1, errorMessage: lastWarning });
          if (transientImageError.test(lastWarning)) {
            transientErrorCount += 1;
            if (transientErrorCount < 2) continue;
            break;
          }
          if (GEMINI_MEDIA_ERRORS.PROVIDER_REJECTION_PATTERN.test(lastWarning) || _.includes(lastWarning, GEMINI_MEDIA_ERRORS.TEXT_ONLY_RESPONSE_TEMPLATE.split(SOURCE_TEXT_SYMBOL_16)[0])) break;
          continue;
        }
        const encodedImage = _.toString(result.base64);
        const mimeType = getDownloadedImageMimeType(Buffer.from(encodedImage, SOURCE_TEXT_BASE64));
        if (_.isEmpty(encodedImage) || encodedImage.length < SUNO_AUTOMATION_CONFIG.MUSIC_IMAGE_MIN_BYTES || !mimeType) {
          lastWarning = MUSIC_CREATOR_TEXTS.vi.THUMBNAIL_GENERATE_ERROR;
          logger.warn(SOURCE_TEMPLATE_MUSICTHUMBNAIL_GEMINI_RETURNED_INVALID_IMAGE_ATTEMPT(SOURCE_TEMPLATE_SYMBOL_86(`${attempt + 1}`), SOURCE_TEMPLATE_SYMBOL_86(`${SUNO_AUTOMATION_CONFIG.MUSIC_THUMBNAIL_ATTEMPTS}`), SOURCE_TEMPLATE_SYMBOL_86(`${encodedImage.length}`)));
          await writeMusicDiagnostic(SOURCE_TEXT_MUSIC_IMAGE_INVALID_RESULT, { runId: promptRequestId, attempt: attempt + 1, bytes: encodedImage.length });
          continue;
        }
        const thumbnail = SUNO_AUTOMATION_TEXTS.formatDataUrl(mimeType, encodedImage);
        if (thumbnail) {
          logger.info(SOURCE_TEMPLATE_MUSICTHUMBNAIL_SUCCESS_ATTEMPT_BYTES(SOURCE_TEMPLATE_SYMBOL_86(`${attempt + 1}`), SOURCE_TEMPLATE_SYMBOL_86(`${SUNO_AUTOMATION_CONFIG.MUSIC_THUMBNAIL_ATTEMPTS}`), SOURCE_TEMPLATE_SYMBOL_86(`${encodedImage.length}`)));
          return { thumbnail };
        }
        lastWarning = MUSIC_CREATOR_TEXTS.vi.THUMBNAIL_GENERATE_ERROR;
        logger.warn(SOURCE_TEMPLATE_MUSICTHUMBNAIL_GEMINI_RETURNED_NO_IMAGE_ATTEMPT(SOURCE_TEMPLATE_SYMBOL_86(`${attempt + 1}`), SOURCE_TEMPLATE_SYMBOL_86(`${SUNO_AUTOMATION_CONFIG.MUSIC_THUMBNAIL_ATTEMPTS}`), SOURCE_TEMPLATE_SYMBOL_86(`${lastWarning}`)));
      } catch (error) {
        input.signal?.throwIfAborted();
        logger.error(SUNO_AUTOMATION_TEXTS.LOG_MUSIC_COVER_FAILED, error);
        lastWarning = _.toString(_.get(error, SOURCE_TEXT_MESSAGE, lastWarning));
        logger.error(SOURCE_TEMPLATE_MUSICTHUMBNAIL_FAILED_ATTEMPT_REASON(SOURCE_TEMPLATE_SYMBOL_86(`${attempt + 1}`), SOURCE_TEMPLATE_SYMBOL_86(`${SUNO_AUTOMATION_CONFIG.MUSIC_THUMBNAIL_ATTEMPTS}`), SOURCE_TEMPLATE_SYMBOL_86(`${lastWarning}`)));
        await writeMusicDiagnostic(SOURCE_TEXT_MUSIC_IMAGE_GENERATION_FAILED, { runId: promptRequestId, attempt: attempt + 1, ...musicErrorDetails(error) });
        if (transientImageError.test(lastWarning)) {
          transientErrorCount += 1;
          if (transientErrorCount < 2) continue;
          break;
        }
        if (GEMINI_MEDIA_ERRORS.PROVIDER_REJECTION_PATTERN.test(lastWarning)) break;
      }
    }
    logger.error(SOURCE_TEMPLATE_MUSICTHUMBNAIL_EXHAUSTED_ATTEMPTS_WARNING(SOURCE_TEMPLATE_SYMBOL_86(`${lastWarning}`)));
    return { thumbnail: null, warning: lastWarning };
  } finally {
    releaseBrowser();
  }
};
const isRetryableMusicRoomError = (error: unknown): boolean => {
  if (_.get(error, CHAT_ROOM_RECOVERY.COMPLETE) || _.get(error, CHROME_BACKUP.ERROR_FLAG)) return false;
  if (_.isEqual(_.toString(_.get(error, SOURCE_TEXT_CODE)), CINEMATIC_CHAT_PLANNING_CONFIG.RESPONSE_TIMEOUT_CODE)) return false;
  const message = _.toString(_.get(error, SOURCE_TEXT_MESSAGE, error));
  return !SUNO_AUTOMATION_TEXTS.MUSIC_ROOM_NON_RETRYABLE_ERROR.test(message);
};
const validateMusicStyleAnalysisContract = (parsed: any, requestId: string): boolean => {
  const isText = (value: unknown): boolean => _.isString(value) && !_.isEmpty(_.trim(value));
  const isTextArray = (value: unknown, allowEmpty = false): boolean => _.isArray(value) && (allowEmpty || !_.isEmpty(value)) && _.every(value, isText);
  const market = parsed?.market;
  const musicalDna = parsed?.musicalDna;
  const lyricalDna = parsed?.lyricalDna;
  const creativeProfile = parsed?.creativeProfile;
  return (
    _.isEqual(parsed?.artifactType, SUNO_AUTOMATION_CONFIG.ARTIFACT_TYPE_STYLE_ANALYSIS) &&
    _.isEqual(parsed?.requestId, requestId) &&
    _.every([market?.country, market?.region, market?.language, market?.dialect, market?.audienceAge, market?.lyricalCharacterAge, market?.contentSuitability], isText) &&
    _.isInteger(_.toNumber(market?.confidence)) &&
    _.inRange(_.toNumber(market?.confidence), 0, 101) &&
    _.every([parsed?.era?.songwritingEra, parsed?.era?.productionEra, parsed?.genre?.primary], isText) &&
    isTextArray(parsed?.genre?.secondary, true) &&
    isTextArray(parsed?.genre?.influences, true) &&
    _.every([musicalDna?.tempoRange, musicalDna?.rhythm, musicalDna?.harmony, musicalDna?.melodicLanguage, musicalDna?.hookPlacement, musicalDna?.vocalCharacter, musicalDna?.listeningContext], isText) &&
    isTextArray(musicalDna?.songForms) &&
    isTextArray(musicalDna?.instrumentation) &&
    _.every([lyricalDna?.narrativeVoice, lyricalDna?.vocabulary, lyricalDna?.rhymeBehavior], isText) &&
    isTextArray(lyricalDna?.themes) &&
    isTextArray(lyricalDna?.imagery) &&
    _.isArray(parsed?.historicalInfluences) &&
    _.every(parsed.historicalInfluences, (item) => _.every([item?.name, item?.role, item?.relevance], isText)) &&
    isText(creativeProfile?.role) &&
    isTextArray(creativeProfile?.strengths) &&
    isTextArray(creativeProfile?.writingPrinciples) &&
    isTextArray(creativeProfile?.productionPrinciples) &&
    isTextArray(parsed?.mustPreserve) &&
    isTextArray(parsed?.mustVary) &&
    isTextArray(parsed?.mustNotCopy) &&
    isTextArray(parsed?.uncertainties, true) &&
    _.isArray(parsed?.evidence) &&
    !_.isEmpty(parsed.evidence) &&
    _.every(parsed.evidence, (item) => _.every([item?.claim, item?.sourceClue], isText) && _.isInteger(_.toNumber(item?.confidence)) && _.inRange(_.toNumber(item.confidence), 0, 101))
  );
};
const getMusicStyleAnalysisContractIssues = (parsed: any, requestId: string): string[] => {
  if (!parsed) return [SUNO_AUTOMATION_TEXTS.CONTRACT_INVALID_JSON_ISSUE];
  const issues: string[] = [];
  if (!_.isEqual(parsed?.artifactType, SUNO_AUTOMATION_CONFIG.ARTIFACT_TYPE_STYLE_ANALYSIS)) issues.push(SUNO_AUTOMATION_TEXTS.CONTRACT_ARTIFACT_TYPE_ISSUE);
  if (!_.isEqual(parsed?.requestId, requestId)) issues.push(SUNO_AUTOMATION_TEXTS.CONTRACT_REQUEST_ID_ISSUE);
  const isText = (value: unknown): boolean => _.isString(value) && !_.isEmpty(_.trim(value));
  const checkText = (key: string, value: unknown): void => {
    if (!isText(value)) issues.push(SOURCE_TEMPLATE_MUST_BE_NON_EMPTY_TEXT(SOURCE_TEMPLATE_SYMBOL_86(`${key}`)));
  };
  const checkArray = (key: string, value: unknown, allowEmpty = false): void => {
    if (!_.isArray(value) || (!allowEmpty && _.isEmpty(value)) || !_.every(value, isText)) issues.push(SOURCE_TEMPLATE_MUST_BE(SOURCE_TEMPLATE_SYMBOL_86(`${key}`), SOURCE_TEMPLATE_SYMBOL_86(`${allowEmpty ? SOURCE_TEXT_AN_ARRAY_OF_TEXT : SOURCE_TEXT_A_NON_EMPTY_ARRAY_OF_TEXT}`)));
  };
  const checkConfidence = (key: string, value: unknown): void => {
    if (!_.isInteger(_.toNumber(value)) || !_.inRange(_.toNumber(value), 0, 101)) issues.push(SOURCE_TEMPLATE_MUST_BE_AN_INTEGER_FROM_0(SOURCE_TEMPLATE_SYMBOL_86(`${key}`)));
  };
  for (const key of [SOURCE_TEXT_COUNTRY, SOURCE_TEXT_REGION, SOURCE_TEXT_LANGUAGE, SOURCE_TEXT_DIALECT, SOURCE_TEXT_AUDIENCEAGE, SOURCE_TEXT_LYRICALCHARACTERAGE, SOURCE_TEXT_CONTENTSUITABILITY]) checkText(SOURCE_TEMPLATE_MARKET(SOURCE_TEMPLATE_SYMBOL_86(`${key}`)), parsed?.market?.[key]);
  checkConfidence(SOURCE_TEXT_MARKET_CONFIDENCE, parsed?.market?.confidence);
  for (const key of [SOURCE_TEXT_SONGWRITINGERA, SOURCE_TEXT_PRODUCTIONERA]) checkText(SOURCE_TEMPLATE_ERA(SOURCE_TEMPLATE_SYMBOL_86(`${key}`)), parsed?.era?.[key]);
  checkText(SOURCE_TEXT_GENRE_PRIMARY, parsed?.genre?.primary);
  checkArray(SOURCE_TEXT_GENRE_SECONDARY, parsed?.genre?.secondary, true);
  checkArray(SOURCE_TEXT_GENRE_INFLUENCES, parsed?.genre?.influences, true);
  for (const key of [SOURCE_TEXT_TEMPORANGE, SOURCE_TEXT_RHYTHM, SOURCE_TEXT_HARMONY, SOURCE_TEXT_MELODICLANGUAGE, SOURCE_TEXT_HOOKPLACEMENT, SOURCE_TEXT_VOCALCHARACTER, SOURCE_TEXT_LISTENINGCONTEXT]) checkText(SOURCE_TEMPLATE_MUSICALDNA(SOURCE_TEMPLATE_SYMBOL_86(`${key}`)), parsed?.musicalDna?.[key]);
  for (const key of [SOURCE_TEXT_SONGFORMS, SOURCE_TEXT_INSTRUMENTATION]) checkArray(SOURCE_TEMPLATE_MUSICALDNA(SOURCE_TEMPLATE_SYMBOL_86(`${key}`)), parsed?.musicalDna?.[key]);
  for (const key of [SOURCE_TEXT_NARRATIVEVOICE, SOURCE_TEXT_VOCABULARY, SOURCE_TEXT_RHYMEBEHAVIOR]) checkText(SOURCE_TEMPLATE_LYRICALDNA(SOURCE_TEMPLATE_SYMBOL_86(`${key}`)), parsed?.lyricalDna?.[key]);
  for (const key of [SOURCE_TEXT_THEMES, SOURCE_TEXT_IMAGERY]) checkArray(SOURCE_TEMPLATE_LYRICALDNA(SOURCE_TEMPLATE_SYMBOL_86(`${key}`)), parsed?.lyricalDna?.[key]);
  if (!_.isArray(parsed?.historicalInfluences)) issues.push(SOURCE_TEXT_HISTORICALINFLUENCES_MUST_BE_AN_ARRAY);
  else
    parsed.historicalInfluences.forEach((item: any, index: number) => {
      for (const key of [SOURCE_TEXT_NAME, SOURCE_TEXT_ROLE, SOURCE_TEXT_RELEVANCE]) checkText(SOURCE_TEMPLATE_HISTORICALINFLUENCES(SOURCE_TEMPLATE_SYMBOL_86(`${index}`), SOURCE_TEMPLATE_SYMBOL_86(`${key}`)), item?.[key]);
    });
  checkText(SOURCE_TEXT_CREATIVEPROFILE_ROLE, parsed?.creativeProfile?.role);
  for (const key of [SOURCE_TEXT_STRENGTHS, SOURCE_TEXT_WRITINGPRINCIPLES, SOURCE_TEXT_PRODUCTIONPRINCIPLES]) checkArray(SOURCE_TEMPLATE_CREATIVEPROFILE(SOURCE_TEMPLATE_SYMBOL_86(`${key}`)), parsed?.creativeProfile?.[key]);
  for (const key of [SOURCE_TEXT_MUSTPRESERVE, SOURCE_TEXT_MUSTVARY, SOURCE_TEXT_MUSTNOTCOPY]) checkArray(key, parsed?.[key]);
  checkArray(SOURCE_TEXT_UNCERTAINTIES, parsed?.uncertainties, true);
  if (!_.isArray(parsed?.evidence) || _.isEmpty(parsed.evidence)) issues.push(SOURCE_TEXT_EVIDENCE_MUST_BE_A_NON_EMPTY);
  else
    parsed.evidence.forEach((item: any, index: number) => {
      checkText(SOURCE_TEMPLATE_EVIDENCE_CLAIM(SOURCE_TEMPLATE_SYMBOL_86(`${index}`)), item?.claim);
      checkText(SOURCE_TEMPLATE_EVIDENCE_SOURCECLUE(SOURCE_TEMPLATE_SYMBOL_86(`${index}`)), item?.sourceClue);
      checkConfidence(SOURCE_TEMPLATE_EVIDENCE_CONFIDENCE(SOURCE_TEMPLATE_SYMBOL_86(`${index}`)), item?.confidence);
    });
  return issues;
};
const validateMusicPlanSongContract = (parsed: any, expectedCount: number, startIndex = 1): boolean => {
  if (!_.isArray(parsed?.songs) || parsed.songs.length !== expectedCount) {
    return false;
  }
  const invalid = _.find(parsed.songs, (song: any, index: number) => {
    const hasSongId = _.isEqual(_.trim(_.toString(song?.songId)), SOURCE_TEMPLATE_SONG(SOURCE_TEMPLATE_SYMBOL_86(`${String(startIndex + index).padStart(3, SOURCE_TEXT_0)}`)));
    const hasTitle = !_.isEmpty(_.trim(_.toString(song?.title)));
    const lyrics = _.trim(_.toString(song?.lyrics));
    const hasCompleteLyrics = lyrics.length >= 300 && /\[[^\]]+\]/.test(lyrics);
    const hasMusicalDirection = !_.isEmpty(_.trim(_.toString(song?.genre))) && !_.isEmpty(_.trim(_.toString(song?.mood))) && _.isInteger(_.toNumber(song?.tempoBpm)) && _.inRange(_.toNumber(song?.tempoBpm), 40, 241);
    const hasStructure = _.isArray(song?.structure) && song.structure.length >= 3 && _.every(song.structure, (section) => !_.isEmpty(_.trim(_.toString(section))));
    const hasOriginalityNotes = _.isArray(song?.originalityNotes) && !_.isEmpty(song.originalityNotes) && _.every(song.originalityNotes, (note) => !_.isEmpty(_.trim(_.toString(note))));
    return !hasSongId || !hasTitle || !hasCompleteLyrics || !hasMusicalDirection || !hasStructure || !hasOriginalityNotes;
  });
  return !invalid;
};
const getMusicPlanSongContractIssues = (parsed: any, expectedCount: number, startIndex = 1): string[] => {
  if (!parsed) return [SUNO_AUTOMATION_TEXTS.CONTRACT_INVALID_JSON_ISSUE];
  const songs = _.castArray(parsed?.songs || []);
  const issues: string[] = [];
  if (!_.isArray(parsed?.songs) || songs.length !== expectedCount) issues.push(SUNO_AUTOMATION_TEXTS.formatSongCountIssue(expectedCount));
  _.forEach(songs, (song, index) => {
    const label = SOURCE_TEMPLATE_SONG_2(SOURCE_TEMPLATE_SYMBOL_86(`${index + 1}`));
    if (!_.isEqual(_.trim(_.toString(song?.songId)), SOURCE_TEMPLATE_SONG(SOURCE_TEMPLATE_SYMBOL_86(`${String(startIndex + index).padStart(3, SOURCE_TEXT_0)}`)))) issues.push(SUNO_AUTOMATION_TEXTS.formatSongNoIdIssue(label));
    if (_.isEmpty(_.trim(_.toString(song?.title)))) issues.push(SUNO_AUTOMATION_TEXTS.formatSongNoTitleIssue(label));
    const lyrics = _.trim(_.toString(song?.lyrics));
    if (lyrics.length < 300) issues.push(SUNO_AUTOMATION_TEXTS.formatSongLyricsLengthIssue(label, lyrics.length));
    if (!/\[[^\]]+\]/.test(lyrics)) issues.push(SUNO_AUTOMATION_TEXTS.formatSongNoSectionLabelIssue(label));
    if (_.isEmpty(_.trim(_.toString(song?.genre))) || _.isEmpty(_.trim(_.toString(song?.mood)))) issues.push(SUNO_AUTOMATION_TEXTS.formatSongGenreMoodEmptyIssue(label));
    if (!_.isInteger(_.toNumber(song?.tempoBpm)) || !_.inRange(_.toNumber(song?.tempoBpm), 40, 241)) issues.push(SUNO_AUTOMATION_TEXTS.formatSongTempoOutOfRangeIssue(label));
    if (!_.isArray(song?.structure) || song.structure.length < 3) issues.push(SUNO_AUTOMATION_TEXTS.formatSongStructureIssue(label));
    if (!_.isArray(song?.originalityNotes) || _.isEmpty(song.originalityNotes)) issues.push(SUNO_AUTOMATION_TEXTS.formatSongOriginalityNotesIssue(label));
  });
  return issues;
};
const validateMusicSongRankingContract = (parsed: any, songs: any[], requestId: string): boolean => {
  const expectedIds = _.map(songs, (song) => _.trim(_.toString(song?.songId)));
  const orderedIds = _.map(_.castArray(parsed?.orderedSongIds || []), (songId) => _.trim(_.toString(songId)));
  return _.isEqual(parsed?.artifactType, SUNO_AUTOMATION_CONFIG.ARTIFACT_TYPE_RANKING) && _.isEqual(parsed?.requestId, requestId) && _.isEqual(orderedIds.length, expectedIds.length) && _.isEqual(_.uniq(orderedIds).length, expectedIds.length) && _.isEqual(_.sortBy(orderedIds), _.sortBy(expectedIds));
};
const hasUsableSunoSettingsResult = (parsed: any): boolean => {
  const settings = parsed?.settings;
  return (
    _.isString(settings?.excludeStyles) &&
    _.includes([SUNO_AUTOMATION_CONFIG.VOCAL_GENDER_MALE, SUNO_AUTOMATION_CONFIG.VOCAL_GENDER_FEMALE, SUNO_AUTOMATION_CONFIG.VOCAL_GENDER_AUTO], settings?.vocalGender) &&
    settings?.duration === SUNO_AUTOMATION_CONFIG.DURATION_AUTO &&
    _.every([settings?.weirdness, settings?.styleInfluence, settings?.audioInfluence, settings?.variety], (value) => _.isInteger(value) && _.inRange(value, 0, 101)) &&
    _.isBoolean(settings?.maxMode) &&
    _.isBoolean(settings?.personalize)
  );
};
const validateSunoSettingsContract = (parsed: any, requestId: string): boolean => {
  const assessment = parsed?.productionAssessment;
  const rationale = parsed?.parameterRationale;
  const analysis = parsed?.parameterAnalysis;
  const requiredAssessmentFields = [SOURCE_TEXT_SYNTHETICROLE, SOURCE_TEXT_CULTUREANDMARKET, SOURCE_TEXT_ERAANDGENRE, SOURCE_TEXT_VOCALPROFILE, SOURCE_TEXT_SONGANDARRANGEMENTPROFILE, SOURCE_TEXT_PRODUCTIONGOAL];
  const requiredRationaleFields = [SOURCE_TEXT_EXCLUDESTYLES, SOURCE_TEXT_VOCALGENDER, SOURCE_TEXT_MAXMODE, SOURCE_TEXT_WEIRDNESS, SOURCE_TEXT_STYLEINFLUENCE, SOURCE_TEXT_AUDIOINFLUENCE, SOURCE_TEXT_VARIETY, SOURCE_TEXT_PERSONALIZE];
  const requiredAnalysisFields = [SOURCE_TEXT_EXCLUDESTYLES, SOURCE_TEXT_VOCALGENDER, SOURCE_TEXT_DURATION, SOURCE_TEXT_MAXMODE, SOURCE_TEXT_WEIRDNESS, SOURCE_TEXT_STYLEINFLUENCE, SOURCE_TEXT_AUDIOINFLUENCE, SOURCE_TEXT_VARIETY, SOURCE_TEXT_PERSONALIZE];
  const hasCompleteAnalysis = _.every(requiredAnalysisFields, (field) => {
    const item = analysis?.[field];
    return _.every([SOURCE_TEXT_EVIDENCE, SOURCE_TEXT_EXPECTEDEFFECT, SOURCE_TEXT_RISK, SOURCE_TEXT_INTERACTIONS], (key) => !_.isEmpty(_.trim(_.toString(item?.[key])))) && _.isInteger(item?.confidence) && _.inRange(item.confidence, 0, 101);
  });
  return (
    parsed?.artifactType === SUNO_AUTOMATION_CONFIG.ARTIFACT_TYPE_SETTINGS &&
    parsed?.requestId === requestId &&
    _.every(requiredAssessmentFields, (field) => !_.isEmpty(_.trim(_.toString(assessment?.[field])))) &&
    _.isArray(assessment?.risks) &&
    _.every(requiredRationaleFields, (field) => !_.isEmpty(_.trim(_.toString(rationale?.[field])))) &&
    hasCompleteAnalysis &&
    hasUsableSunoSettingsResult(parsed)
  );
};
const validateMusicPlaylistSeoContract = (parsed: any, _songs?: any[]): boolean => {
  if (!_.isArray(parsed?.seoOptions) || parsed.seoOptions.length !== MUSIC_CREATOR_CONSTANTS.REQUIRED_SEO_OPTIONS_COUNT) return false;
  const normalizedTitles = _.map(parsed.seoOptions, (option: any) => _.toLower(_.trim(_.toString(option?.title))));
  if (_.uniq(normalizedTitles).length !== normalizedTitles.length) return false;
  return _.every(parsed.seoOptions, (option: any) => {
    const title = _.trim(_.toString(option?.title));
    const description = _.trim(_.toString(option?.description));
    const hashtags = _.map(_.castArray(option?.hashtags || []), (value) => _.trim(_.toString(value)));
    const tags = _.map(_.castArray(option?.tags || []), (value) => _.trim(_.toString(value)));
    const titleWords = _.filter(title.split(SUNO_AUTOMATION_PATTERNS.WHITESPACES), (word) => SUNO_AUTOMATION_PATTERNS.UNICODE_LETTER.test(word));
    const hasTitleCase = _.every(titleWords, (word) => {
      const firstLetter = word.match(SUNO_AUTOMATION_PATTERNS.UNICODE_LETTER)?.[0] || C.EMPTY;
      return firstLetter === firstLetter.toUpperCase();
    });
    const hasSingleIcon = _.size(description.match(MUSIC_CREATOR_REGEXES.EMOJI) || []) === 1;
    const startsWithIcon = MUSIC_CREATOR_REGEXES.EMOJI_PREFIX.test(description);
    return (
      _.inRange(_.size(title), 15, 100) &&
      hasTitleCase &&
      !SUNO_AUTOMATION_PATTERNS.SEO_TITLE_LOUD_PUNCTUATION.test(title) &&
      !SUNO_AUTOMATION_PATTERNS.SEO_TITLE_MISLEADING_CLAIMS.test(title) &&
      _.inRange(_.size(description), 40, 501) &&
      hasSingleIcon &&
      startsWithIcon &&
      _.isArray(option?.hashtags) &&
      _.isEqual(hashtags.length, 10) &&
      _.isEqual(_.uniq(_.map(hashtags, _.toLower)).length, hashtags.length) &&
      _.every(hashtags, (value) => SUNO_AUTOMATION_PATTERNS.ASCII_HASHTAG_VALIDATION.test(value)) &&
      _.isArray(option?.tags) &&
      _.isEqual(tags.length, 12) &&
      _.isEqual(_.uniq(_.map(tags, _.toLower)).length, tags.length) &&
      _.every(tags, (value) => !_.isEmpty(value) && !_.includes(value, SOURCE_TEXT_SYMBOL_4) && /^[a-z0-9 ]+$/i.test(value)) &&
      _.isInteger(_.toNumber(option?.seoScore)) &&
      _.inRange(_.toNumber(option.seoScore), 0, 101)
    );
  });
};
const getMusicPlaylistSeoContractIssues = (parsed: any): string[] => {
  if (!parsed) return [SUNO_AUTOMATION_TEXTS.CONTRACT_INVALID_JSON_ISSUE];
  const options = _.castArray(parsed?.seoOptions || []);
  const issues: string[] = [];
  if (!_.isArray(parsed?.seoOptions) || options.length !== MUSIC_CREATOR_CONSTANTS.REQUIRED_SEO_OPTIONS_COUNT) {
    issues.push(SUNO_AUTOMATION_TEXTS.formatSeoOptionsCountIssue(MUSIC_CREATOR_CONSTANTS.REQUIRED_SEO_OPTIONS_COUNT));
  }
  const normalizedTitles = _.map(options, (option) => _.toLower(_.trim(_.toString(option?.title))));
  if (_.uniq(normalizedTitles).length !== normalizedTitles.length) issues.push(SOURCE_TEXT_SEO_TITLES_ARE_DUPLICATED);
  _.forEach(options, (option, index) => {
    const label = SOURCE_TEMPLATE_SEO_OPTION(SOURCE_TEMPLATE_SYMBOL_86(`${index + 1}`));
    const title = _.trim(_.toString(option?.title));
    const description = _.trim(_.toString(option?.description));
    const hashtags = _.castArray(option?.hashtags || []);
    const tags = _.castArray(option?.tags || []);
    if (!_.inRange(_.size(title), 15, 100)) issues.push(SUNO_AUTOMATION_TEXTS.formatTitleLengthIssue(label));
    const titleWords = _.filter(title.split(SUNO_AUTOMATION_PATTERNS.WHITESPACES), (word) => SUNO_AUTOMATION_PATTERNS.UNICODE_LETTER.test(word));
    if (
      !_.every(titleWords, (word) => {
        const firstLetter = word.match(SUNO_AUTOMATION_PATTERNS.UNICODE_LETTER)?.[0] || C.EMPTY;
        return firstLetter === firstLetter.toUpperCase();
      })
    )
      issues.push(SOURCE_TEMPLATE_TITLE_MUST_CAPITALIZE_EVERY_WORD(SOURCE_TEMPLATE_SYMBOL_86(`${label}`)));
    if (SUNO_AUTOMATION_PATTERNS.SEO_TITLE_LOUD_PUNCTUATION.test(title) || SUNO_AUTOMATION_PATTERNS.SEO_TITLE_MISLEADING_CLAIMS.test(title)) issues.push(SOURCE_TEMPLATE_TITLE_HAS_DISALLOWED_PUNCTUATION_OR_CLAIM(SOURCE_TEMPLATE_SYMBOL_86(`${label}`)));
    if (_.size(description.match(MUSIC_CREATOR_REGEXES.EMOJI) || []) !== 1 || !MUSIC_CREATOR_REGEXES.EMOJI_PREFIX.test(description)) issues.push(SUNO_AUTOMATION_TEXTS.formatDescriptionEmojiIssue(label));
    if (hashtags.length !== 10) issues.push(SUNO_AUTOMATION_TEXTS.formatHashtagsCountIssue(label));
    if (!_.every(hashtags, (value) => SUNO_AUTOMATION_PATTERNS.ASCII_HASHTAG_VALIDATION.test(_.toString(value))) || _.uniq(_.map(hashtags, (value) => _.toLower(_.toString(value)))).length !== hashtags.length) issues.push(SOURCE_TEMPLATE_HASHTAGS_MUST_BE_UNIQUE_ASCII_VALUES(SOURCE_TEMPLATE_SYMBOL_86(`${label}`)));
    if (tags.length !== 12) issues.push(SUNO_AUTOMATION_TEXTS.formatTagsCountIssue(label));
    if (!_.every(tags, (value) => /^[a-z0-9 ]+$/i.test(_.toString(value)) && !_.isEmpty(_.trim(_.toString(value)))) || _.uniq(_.map(tags, (value) => _.toLower(_.toString(value)))).length !== tags.length) issues.push(SOURCE_TEMPLATE_TAGS_MUST_BE_UNIQUE_UNACCENTED_WORDS(SOURCE_TEMPLATE_SYMBOL_86(`${label}`)));
    if (!_.isInteger(_.toNumber(option?.seoScore))) issues.push(SUNO_AUTOMATION_TEXTS.formatSeoScoreIntegerIssue(label));
  });
  if (!validateMusicPlaylistSeoContract(parsed, [])) issues.push(SUNO_AUTOMATION_TEXTS.CONTRACT_SEO_CHECKS_FAILED_ISSUE);
  return _.uniq(issues);
};
router.post(ROUTER_PATHS.MUSIC_PLAN, async (req: Request, res: Response) => {
  const validation = parseAndValidateMusicPlanRequest(req);
  if (!validation.isValid || !validation.payload) {
    await writeMusicDiagnostic(SOURCE_TEXT_PLAN_VALIDATION_FAILED, { stage: SOURCE_TEXT_VALIDATION, code: SOURCE_TEXT_INVALID_REQUEST });
    return res.status(HttpStatus.BAD_REQUEST).json({ success: false, error: validation.error });
  }
  const { requestedSongCount, analyzeStyleFromSource, style, referenceSongs, projectId, execution, requestId, sunoInspo } = validation.payload;
  const creativeStyle = analyzeStyleFromSource ? MUSIC_OPTIONS.SOURCE_STYLE_GUIDANCE : style || (_.isEmpty(referenceSongs) ? MUSIC_CREATOR_TEXTS.vi.DEFAULT_CREATIVE_STYLE : MUSIC_CREATOR_TEXTS.en.DEFAULT_CREATIVE_STYLE);
  const checkpointSignature = jsonUtils.safeStringify([requestedSongCount, creativeStyle, referenceSongs, sunoInspo, execution.provider, execution.model]);
  const checkpointNow = Date.now();
  for (const [key, value] of musicPlanCheckpoints) {
    if (checkpointNow - value.updatedAt > SUNO_AUTOMATION_CONFIG.MUSIC_PLAN_CHECKPOINT_TTL_MS) musicPlanCheckpoints.delete(key);
  }
  const existingCheckpoint = musicPlanCheckpoints.get(requestId);
  const checkpoint = existingCheckpoint?.signature === checkpointSignature ? existingCheckpoint : { signature: checkpointSignature, updatedAt: checkpointNow, styleAnalysis: null as any, batches: new Map<number, any[]>() };
  musicPlanCheckpoints.set(requestId, checkpoint);
  let finishMusicPlanCleanup: () => void = _.noop;
  const cleanupFinished = new Promise<void>((resolve) => {
    finishMusicPlanCleanup = resolve;
  });
  activeMusicPlanCleanup.set(requestId, cleanupFinished);
  activeMusicPlanRuns += 1;
  const report = musicPlanReporter(res, req.body?.streamProgress === true, requestedSongCount);
  let currentStage: string = SUNO_AUTOMATION_CONFIG.STAGE_INITIALIZE;
  report.progress(currentStage);
  const planStartedAt = Date.now();
  await writeMusicDiagnostic(SOURCE_TEXT_PLAN_STARTED, { runId: requestId, stage: currentStage, provider: execution.provider, model: execution.model, songCount: requestedSongCount, checkpoint: Boolean(existingCheckpoint) });
  try {
    const provider = execution.provider || AiPlanningFallbackProvider.GeminiChat;
    const planningRun = beginChatPlanningRun(requestId, Date.now(), SUNO_AUTOMATION_CONFIG.MUSIC_PLAN_WORKER_TYPE, provider);
    req.once(SOURCE_TEXT_ABORTED, planningRun.cancel);
    res.once(SOURCE_TEXT_FINISH, planningRun.complete);
    res.once(RT_SERVER.CLOSE, () => {
      if (!res.writableEnded) planningRun.cancel();
    });
    const generateRoomResponse = (prompt: string, artifactType: string, responseRequestId: string, workerId: string = SUNO_AUTOMATION_CONFIG.MUSIC_PLAN_WORKER_TYPE, restoreContext?: () => string) =>
      generatePlanningWithChatUi({ provider, model: execution.model, prompt, projectId, workerId, chromeHeadless: execution.chromeHeadless !== false, artifactType, requestId: responseRequestId, signal: planningRun.signal, closeRoomOnComplete: false, restoreContext });
    const referenceSource = await resolveMusicReferenceSource(_.join(referenceSongs, SUNO_AUTOMATION_CONFIG.REFERENCE_SOURCE_CHUNK_DIVIDER), planningRun.signal);
    const analysisRequestId = SOURCE_TEMPLATE_STYLE_ANALYSIS(SOURCE_TEMPLATE_SYMBOL_86(`${requestId}`));
    currentStage = SUNO_AUTOMATION_CONFIG.STAGE_STYLE_ANALYSIS;
    report.progress(currentStage);
    await writeMusicDiagnostic(SOURCE_TEXT_PLAN_STAGE_STARTED, { runId: requestId, stage: currentStage });
    await closeChatPlanningRoomsForProject({ provider, projectId }).catch(() => undefined);
    let styleAnalysisParsed: any = checkpoint.styleAnalysis;
    let styleAnalysisIssues: string[] = [];
    let analysisRoomWasReloaded = false;
    for (let attempt = 0; !validateMusicStyleAnalysisContract(styleAnalysisParsed, analysisRequestId) && attempt < SUNO_AUTOMATION_CONFIG.MUSIC_ROOM_RESPONSE_ATTEMPTS; attempt += 1) {
      const prompt = attempt === 0 || analysisRoomWasReloaded ? SUNO_AUTOMATION_TEXTS.buildMusicStyleAnalysisPrompt(creativeStyle, referenceSource, analysisRequestId) : SUNO_AUTOMATION_TEXTS.buildMusicStyleAnalysisCorrectionPrompt(analysisRequestId, styleAnalysisIssues);
      analysisRoomWasReloaded = false;
      try {
        const response = await generateRoomResponse(prompt, SUNO_AUTOMATION_CONFIG.ARTIFACT_TYPE_STYLE_ANALYSIS, analysisRequestId, SUNO_AUTOMATION_CONFIG.MUSIC_PLAN_WORKER_TYPE, () => SUNO_AUTOMATION_TEXTS.buildMusicStyleAnalysisPrompt(creativeStyle, referenceSource, analysisRequestId));
        styleAnalysisParsed = jsonUtils.safeParse(response.text, null);
        await writeMusicDiagnostic(SOURCE_TEXT_PLAN_STYLE_RESPONSE, { runId: requestId, stage: currentStage, attempt: attempt + 1, responseChars: response.text.length, status: styleAnalysisParsed ? SOURCE_TEXT_PARSED : SOURCE_TEXT_INVALID_JSON });
        if (!styleAnalysisParsed) logger.warn(SOURCE_TEMPLATE_MUSICPLAN_STYLE_ANALYSIS_JSON_PARSE_FAILED(SOURCE_TEMPLATE_SYMBOL_86(`${attempt + 1}`), SOURCE_TEMPLATE_SYMBOL_86(`${response.text.length}`), SOURCE_TEMPLATE_SYMBOL_86(`${prompt.length}`)));
      } catch (error) {
        await writeMusicDiagnostic(SOURCE_TEXT_PLAN_STYLE_ATTEMPT_FAILED, { runId: requestId, stage: currentStage, attempt: attempt + 1, ...musicErrorDetails(error) });
        if (!isRetryableMusicRoomError(error) || attempt >= SUNO_AUTOMATION_CONFIG.MUSIC_ROOM_RESPONSE_ATTEMPTS - 1) throw error;
        const errorMessage = _.toString(_.get(error, SOURCE_TEXT_MESSAGE, error));
        if (_.isEqual(errorMessage, CINEMATIC_CHAT_PLANNING_CONFIG.PROVIDER_ERROR_ROOM_RELOAD_ERROR)) {
          currentStage = SUNO_AUTOMATION_CONFIG.STAGE_STYLE_ANALYSIS;
          analysisRoomWasReloaded = true;
        }
        logger.warn(SUNO_AUTOMATION_TEXTS.formatMusicRoomRetryLog(currentStage, attempt + 2, errorMessage));
        styleAnalysisParsed = null;
      }
      styleAnalysisIssues = getMusicStyleAnalysisContractIssues(styleAnalysisParsed, analysisRequestId);
      if (styleAnalysisIssues.length) await writeMusicDiagnostic(SOURCE_TEXT_PLAN_CONTRACT_FAILED, { runId: requestId, stage: currentStage, attempt: attempt + 1, issueCount: styleAnalysisIssues.length, issues: styleAnalysisIssues });
      if (!_.isEmpty(styleAnalysisIssues)) logger.warn(SOURCE_TEMPLATE_MUSICPLAN_STYLE_ANALYSIS_CONTRACT_ATTEMPT_ISSUES(SOURCE_TEMPLATE_SYMBOL_86(`${attempt + 1}`), SOURCE_TEMPLATE_SYMBOL_86(`${styleAnalysisIssues.join(SOURCE_TEXT_SYMBOL_34)}`)));
      if (validateMusicStyleAnalysisContract(styleAnalysisParsed, analysisRequestId)) break;
    }
    if (!validateMusicStyleAnalysisContract(styleAnalysisParsed, analysisRequestId)) {
      const failedFields = _.slice(styleAnalysisIssues, 0, 5).join(SOURCE_TEXT_SYMBOL_6);
      throw createAppError(SOURCE_TEMPLATE_SYMBOL_75(`${MUSIC_CREATOR_TEXTS.vi.SERVER_CONTRACT_ERROR}`, `${failedFields ? SOURCE_TEMPLATE_CHI_TIET(SOURCE_TEMPLATE_SYMBOL_86(`${failedFields}`)) : C.EMPTY}`));
    }
    checkpoint.styleAnalysis = styleAnalysisParsed;
    checkpoint.updatedAt = Date.now();
    report.progress(currentStage, { styleAnalysis: styleAnalysisParsed });
    const songs: any[] = [];
    const completedSongTitles = new Set<string>();
    currentStage = SUNO_AUTOMATION_CONFIG.STAGE_SONG_COMPOSITION;
    report.progress(currentStage);
    await writeMusicDiagnostic(SOURCE_TEXT_PLAN_STAGE_STARTED, { runId: requestId, stage: currentStage, songCount: requestedSongCount });
    let responseProvider = provider;
    const composeSongBatch = async (startIndex: number, batchCount: number, maxAttempts: number, requestSuffix: string = C.EMPTY, workerId: string = SUNO_AUTOMATION_CONFIG.MUSIC_PLAN_WORKER_TYPE): Promise<any[] | null> => {
      let batchParsed: any = null;
      let batchIssues: string[] = [];
      let roomWasReloaded = false;
      const batchRequestId = SOURCE_TEMPLATE_BATCH(SOURCE_TEMPLATE_SYMBOL_86(`${requestId}`), SOURCE_TEMPLATE_SYMBOL_86(`${startIndex}`), SOURCE_TEMPLATE_SYMBOL_86(`${requestSuffix}`));
      for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        report.progress(currentStage, undefined, { attempt: attempt + 1 });
        const prompt =
          attempt === 0 || roomWasReloaded
            ? SUNO_AUTOMATION_TEXTS.buildMusicPlanPrompt(batchCount, startIndex, requestedSongCount, creativeStyle, styleAnalysisParsed, batchRequestId, MUSIC_CREATOR_CONSTANTS.ARTIFACT_TYPE, referenceSource)
            : SUNO_AUTOMATION_TEXTS.buildMusicPlanCorrectionPrompt(batchCount, startIndex, MUSIC_CREATOR_CONSTANTS.ARTIFACT_TYPE, batchRequestId, batchIssues, styleAnalysisParsed, referenceSource);
        roomWasReloaded = false;
        try {
          const response = await generateRoomResponse(prompt, MUSIC_CREATOR_CONSTANTS.ARTIFACT_TYPE, batchRequestId, workerId, () => SUNO_AUTOMATION_TEXTS.buildMusicPlanPrompt(batchCount, startIndex, requestedSongCount, creativeStyle, styleAnalysisParsed, batchRequestId, MUSIC_CREATOR_CONSTANTS.ARTIFACT_TYPE, referenceSource));
          responseProvider = response.provider;
          batchParsed = jsonUtils.safeParse(response.text, null);
          await writeMusicDiagnostic(SOURCE_TEXT_PLAN_BATCH_RESPONSE, { runId: requestId, stage: currentStage, batch: startIndex, batchSize: batchCount, attempt: attempt + 1, responseChars: response.text.length, status: batchParsed ? SOURCE_TEXT_PARSED : SOURCE_TEXT_INVALID_JSON });
        } catch (error) {
          await writeMusicDiagnostic(SOURCE_TEXT_PLAN_BATCH_ATTEMPT_FAILED, { runId: requestId, stage: currentStage, batch: startIndex, batchSize: batchCount, attempt: attempt + 1, ...musicErrorDetails(error) });
          if (!isRetryableMusicRoomError(error)) throw error;
          if (_.isEqual(_.toString(_.get(error, SOURCE_TEXT_MESSAGE, error)), CINEMATIC_CHAT_PLANNING_CONFIG.PROVIDER_ERROR_ROOM_RELOAD_ERROR)) {
            roomWasReloaded = true;
          }
          if (attempt < maxAttempts - 1) logger.warn(SUNO_AUTOMATION_TEXTS.formatMusicRoomRetryLog(currentStage, attempt + 2, _.toString(_.get(error, SOURCE_TEXT_MESSAGE, error))));
          batchParsed = null;
        }
        batchIssues = getMusicPlanSongContractIssues(batchParsed, batchCount, startIndex);
        if (validateMusicPlanSongContract(batchParsed, batchCount, startIndex)) {
          const titles = _.map(batchParsed.songs, (song) => _.toLower(_.deburr(_.trim(_.toString(song.title)))));
          if (_.uniq(titles).length !== titles.length || _.some(titles, (title) => completedSongTitles.has(title))) {
            batchIssues.push(SUNO_AUTOMATION_TEXTS.CONTRACT_DUPLICATE_SONG_TITLE_ISSUE);
          } else {
            const qualityIssues = attempt < maxAttempts - 1 ? musicLyricQualityIssues(batchParsed.songs, referenceSource) : [];
            if (qualityIssues.length) batchIssues.push(...qualityIssues);
            else {
              _.forEach(titles, (title) => completedSongTitles.add(title));
              return batchParsed.songs;
            }
          }
        }
        if (!_.isEmpty(batchIssues)) logger.warn(SOURCE_TEMPLATE_MUSICPLAN_SONG_COMPOSITION_CONTRACT_BATCH_ATTEMPT(SOURCE_TEMPLATE_SYMBOL_86(`${startIndex}`), SOURCE_TEMPLATE_SYMBOL_86(`${attempt + 1}`), SOURCE_TEMPLATE_SYMBOL_86(`${batchIssues.join(SOURCE_TEXT_SYMBOL_34)}`)));
        if (batchIssues.length) await writeMusicDiagnostic(SOURCE_TEXT_PLAN_CONTRACT_FAILED, { runId: requestId, stage: currentStage, batch: startIndex, attempt: attempt + 1, issueCount: batchIssues.length, issues: batchIssues });
      }
      return null;
    };
    const composeAdaptiveBatch = async (startIndex: number, batchCount: number, requestSuffix: string = C.EMPTY, workerId: string = SUNO_AUTOMATION_CONFIG.MUSIC_PLAN_WORKER_TYPE): Promise<any[]> => {
      const isMinimumBatch = batchCount <= _.last(MUSIC_CREATOR_CONSTANTS.OUTPUT_BATCH_SIZES)!;
      const attempts = isMinimumBatch ? SUNO_AUTOMATION_CONFIG.MUSIC_ROOM_RESPONSE_ATTEMPTS : 1;
      const composedSongs = await composeSongBatch(startIndex, batchCount, attempts, requestSuffix, workerId);
      if (composedSongs) return composedSongs;
      const fallbackBatchSize = _.find(MUSIC_CREATOR_CONSTANTS.OUTPUT_BATCH_SIZES, (size) => size < batchCount);
      if (!fallbackBatchSize) throw createAppError(MUSIC_CREATOR_TEXTS.vi.SERVER_CONTRACT_ERROR);
      logger.warn(SUNO_AUTOMATION_TEXTS.formatMusicBatchFallbackLog(startIndex, batchCount, fallbackBatchSize));
      await writeMusicDiagnostic(SOURCE_TEXT_PLAN_BATCH_FALLBACK, { runId: requestId, stage: currentStage, batch: startIndex, batchSize: batchCount, status: String(fallbackBatchSize) });
      const fallbackSongs: any[] = [];
      for (let offset = 0; offset < batchCount; offset += fallbackBatchSize) {
        const fallbackCount = Math.min(fallbackBatchSize, batchCount - offset);
        fallbackSongs.push(...(await composeAdaptiveBatch(startIndex + offset, fallbackCount, SOURCE_TEMPLATE_FALLBACK(SOURCE_TEMPLATE_SYMBOL_86(`${requestSuffix}`), SOURCE_TEMPLATE_SYMBOL_86(`${fallbackBatchSize}`), SOURCE_TEMPLATE_SYMBOL_86(`${offset + 1}`)), workerId)));
      }
      return fallbackSongs;
    };
    const initialBatchSize = chatRoomLanes(currentChatPolicy()) > 1 ? MUSIC_CREATOR_CONSTANTS.PARALLEL_BATCH_SIZE : _.first(MUSIC_CREATOR_CONSTANTS.OUTPUT_BATCH_SIZES)!;
    const compositionBatches = _.map(_.range(1, requestedSongCount + 1, initialBatchSize), (startIndex) => ({ startIndex, batchCount: Math.min(initialBatchSize, requestedSongCount - startIndex + 1) }));
    for (const batch of compositionBatches) {
      const savedSongs = checkpoint.batches.get(batch.startIndex);
      if (!savedSongs || !validateMusicPlanSongContract({ songs: savedSongs }, batch.batchCount, batch.startIndex)) {
        checkpoint.batches.delete(batch.startIndex);
        continue;
      }
      _.forEach(savedSongs, (song) => completedSongTitles.add(_.toLower(_.deburr(_.trim(_.toString(song.title))))));
    }
    const pendingCompositionBatches = _.filter(compositionBatches, (batch) => !checkpoint.batches.has(batch.startIndex) || checkpoint.batches.get(batch.startIndex)!.some((song) => !validMusicEditorialReview(song.editorialReview)));
    const composedBatchResults: any[][] = _.map(compositionBatches, (batch) => checkpoint.batches.get(batch.startIndex) || []);
    let nextBatchIndex = 0;
    let compositionFailure: unknown;
    const publishSongs = (stage = SUNO_AUTOMATION_CONFIG.STAGE_SONG_COMPOSITION) => report.progress(stage, { songs: _.flatten(composedBatchResults) });
    publishSongs();
    const compositionWorkerIds = _.take([SUNO_AUTOMATION_CONFIG.MUSIC_PLAN_WORKER_TYPE, SUNO_AUTOMATION_CONFIG.MUSIC_SECOND_ROOM_WORKER_TYPE, SUNO_AUTOMATION_CONFIG.MUSIC_THIRD_ROOM_WORKER_TYPE], Math.min(chatRoomLanes(currentChatPolicy()), pendingCompositionBatches.length));
    const roomPreparations = _.map(compositionWorkerIds, (workerId) => prepareChatPlanningRoom({ provider, model: execution.model, prompt: C.EMPTY, projectId, workerId, chromeHeadless: execution.chromeHeadless !== false, signal: planningRun.signal }));
    const runCompositionWorker = async (workerId: string, workerIndex: number): Promise<void> => {
      await roomPreparations[workerIndex];
      while (nextBatchIndex < pendingCompositionBatches.length && !compositionFailure) {
        const batch = pendingCompositionBatches[nextBatchIndex++];
        const batchIndex = compositionBatches.findIndex((item) => item.startIndex === batch.startIndex);
        try {
          await writeMusicDiagnostic(SOURCE_TEXT_PLAN_BATCH_STARTED, { runId: requestId, stage: currentStage, batch: batch.startIndex, batchSize: batch.batchCount, workerId });
          composedBatchResults[batchIndex] = checkpoint.batches.get(batch.startIndex) || (await composeAdaptiveBatch(batch.startIndex, batch.batchCount, C.EMPTY, workerId));
          checkpoint.batches.set(batch.startIndex, composedBatchResults[batchIndex]);
          checkpoint.updatedAt = Date.now();
          publishSongs();
          composedBatchResults[batchIndex] = await reviewMusicSongBatch(composedBatchResults[batchIndex], styleAnalysisParsed, `${requestId}${RT_SERVER.REVIEW}${batch.startIndex}`, (prompt, artifact, id) => generateRoomResponse(prompt, artifact, id, workerId), planningRun.signal, isRetryableMusicRoomError);
          if (composedBatchResults[batchIndex].some((song) => !validMusicEditorialReview(song.editorialReview))) report.progress(currentStage, undefined, { warning: MUSIC_PLAN.WARNING_REVIEW });
          publishSongs();
          await writeMusicDiagnostic(SOURCE_TEXT_PLAN_BATCH_COMPLETED, { runId: requestId, stage: currentStage, batch: batch.startIndex, songCount: composedBatchResults[batchIndex].length });
          checkpoint.batches.set(batch.startIndex, composedBatchResults[batchIndex]);
          checkpoint.updatedAt = Date.now();
        } catch (error) {
          await writeMusicDiagnostic(SOURCE_TEXT_PLAN_BATCH_FAILED, { runId: requestId, stage: currentStage, batch: batch.startIndex, ...musicErrorDetails(error) });
          compositionFailure ||= error instanceof Error ? error : new Error(_.toString(error));
        }
      }
    };
    await Promise.all(_.map(compositionWorkerIds, runCompositionWorker));
    if (compositionFailure) throw compositionFailure;
    songs.push(..._.flatten(composedBatchResults));
    if (!validateMusicPlanSongContract({ songs }, requestedSongCount)) throw createAppError(MUSIC_CREATOR_TEXTS.vi.SERVER_CONTRACT_ERROR);
    const rankingRequestId = SOURCE_TEMPLATE_SONG_RANKING(SOURCE_TEMPLATE_SYMBOL_86(`${requestId}`));
    currentStage = SUNO_AUTOMATION_CONFIG.STAGE_SONG_RANKING;
    report.progress(currentStage);
    await writeMusicDiagnostic(SOURCE_TEXT_PLAN_STAGE_STARTED, { runId: requestId, stage: currentStage });
    let rankingParsed: any = null;
    for (let attempt = 0; attempt < MUSIC_PLAN.RANKING_ATTEMPTS; attempt += 1) {
      report.progress(currentStage, undefined, { attempt: attempt + 1 });
      const prompt = attempt === 0 ? SUNO_AUTOMATION_TEXTS.buildMusicRankingPrompt(requestedSongCount, rankingRequestId, songs, styleAnalysisParsed) : SUNO_AUTOMATION_TEXTS.buildMusicRankingCorrectionPrompt(requestedSongCount, rankingRequestId, songs, styleAnalysisParsed);
      try {
        const response = await generateRoomResponse(prompt, SUNO_AUTOMATION_CONFIG.ARTIFACT_TYPE_RANKING, rankingRequestId);
        responseProvider = response.provider;
        rankingParsed = jsonUtils.safeParse(response.text, null);
      } catch (error) {
        if (!isRetryableMusicRoomError(error)) throw error;
        logger.warn(SUNO_AUTOMATION_TEXTS.formatMusicRoomRetryLog(currentStage, attempt + 2, _.toString(_.get(error, SOURCE_TEXT_MESSAGE, error))));
        rankingParsed = null;
      }
      if (validateMusicSongRankingContract(rankingParsed, songs, rankingRequestId)) break;
    }
    if (!validateMusicSongRankingContract(rankingParsed, songs, rankingRequestId)) {
      rankingParsed = { orderedSongIds: musicReviewOrder(songs).map((song) => song.songId) };
      report.progress(currentStage, undefined, { warning: MUSIC_PLAN.WARNING_RANKING });
    }
    const songsById = _.keyBy(songs, (song) => _.trim(_.toString(song?.songId)));
    const rankedSongs = _.map(rankingParsed.orderedSongIds, (songId) => songsById[_.trim(_.toString(songId))]);
    report.progress(currentStage, { songs: rankedSongs });
    const sunoSettingsRequestId = SOURCE_TEMPLATE_SUNO_SETTINGS(SOURCE_TEMPLATE_SYMBOL_86(`${requestId}`));
    currentStage = SUNO_AUTOMATION_CONFIG.STAGE_SUNO_SETTINGS;
    report.progress(currentStage);
    await writeMusicDiagnostic(SOURCE_TEXT_PLAN_STAGE_STARTED, { runId: requestId, stage: currentStage });
    let sunoSettingsParsed: any = null;
    let usableSunoSettingsParsed: any = null;
    for (let attempt = 0; attempt < SUNO_AUTOMATION_CONFIG.MUSIC_ROOM_RESPONSE_ATTEMPTS; attempt += 1) {
      const prompt = attempt === 0 ? SUNO_AUTOMATION_TEXTS.buildSunoSettingsPrompt(creativeStyle, styleAnalysisParsed, rankedSongs, sunoSettingsRequestId, sunoInspo) : SUNO_AUTOMATION_TEXTS.buildSunoSettingsCorrectionPrompt(creativeStyle, styleAnalysisParsed, rankedSongs, sunoSettingsRequestId, sunoInspo);
      try {
        const response = await generateRoomResponse(prompt, SUNO_AUTOMATION_CONFIG.ARTIFACT_TYPE_SETTINGS, sunoSettingsRequestId);
        responseProvider = response.provider;
        sunoSettingsParsed = jsonUtils.safeParse(response.text, null);
        if (hasUsableSunoSettingsResult(sunoSettingsParsed)) usableSunoSettingsParsed = sunoSettingsParsed;
      } catch (error) {
        if (!isRetryableMusicRoomError(error)) throw error;
        if (attempt >= SUNO_AUTOMATION_CONFIG.MUSIC_ROOM_RESPONSE_ATTEMPTS - 1) break;
        logger.warn(SUNO_AUTOMATION_TEXTS.formatMusicRoomRetryLog(currentStage, attempt + 2, _.toString(_.get(error, SOURCE_TEXT_MESSAGE, error))));
      }
      if (validateSunoSettingsContract(sunoSettingsParsed, sunoSettingsRequestId)) break;
    }
    if (!validateSunoSettingsContract(sunoSettingsParsed, sunoSettingsRequestId) && usableSunoSettingsParsed) {
      sunoSettingsParsed = { ...usableSunoSettingsParsed, artifactType: SUNO_AUTOMATION_CONFIG.ARTIFACT_TYPE_SETTINGS, requestId: sunoSettingsRequestId, productionAssessment: { risks: [], ...usableSunoSettingsParsed.productionAssessment }, parameterRationale: usableSunoSettingsParsed.parameterRationale || {}, parameterAnalysis: usableSunoSettingsParsed.parameterAnalysis || {} };
    }
    if (!hasUsableSunoSettingsResult(sunoSettingsParsed)) throw createAppError(MUSIC_CREATOR_TEXTS.vi.SERVER_CONTRACT_ERROR);
    report.progress(currentStage, { sunoSettings: sunoSettingsParsed.settings, sunoSettingsAnalysis: { productionAssessment: sunoSettingsParsed.productionAssessment, parameterRationale: sunoSettingsParsed.parameterRationale, parameterAnalysis: sunoSettingsParsed.parameterAnalysis } });
    const seoRequestId = SOURCE_TEMPLATE_PLAYLIST_SEO(SOURCE_TEMPLATE_SYMBOL_86(`${requestId}`));
    const generatePlaylistSeo = async (): Promise<any> => {
      let parsed: any = null;
      let seoIssues: string[] = [];
      for (let attempt = 0; attempt < SUNO_AUTOMATION_CONFIG.MUSIC_SEO_RESPONSE_ATTEMPTS; attempt += 1) {
        const prompt =
          attempt === 0
            ? SUNO_AUTOMATION_TEXTS.buildMusicPlaylistSeoPrompt(requestedSongCount, creativeStyle, seoRequestId, MUSIC_CREATOR_CONSTANTS.REQUIRED_SEO_OPTIONS_COUNT, rankedSongs, styleAnalysisParsed, referenceSource)
            : SUNO_AUTOMATION_TEXTS.buildMusicPlaylistSeoCorrectionPrompt(rankedSongs, creativeStyle, MUSIC_CREATOR_CONSTANTS.REQUIRED_SEO_OPTIONS_COUNT, seoRequestId, seoIssues, styleAnalysisParsed, referenceSource);
        try {
          const response = await generateRoomResponse(prompt, SUNO_AUTOMATION_CONFIG.ARTIFACT_TYPE_SEO, seoRequestId);
          responseProvider = response.provider;
          parsed = jsonUtils.safeParse(response.text, null);
          await writeMusicDiagnostic(SOURCE_TEXT_PLAN_SEO_RESPONSE, { runId: requestId, attempt: attempt + 1, responseChars: response.text.length, parsed: Boolean(parsed) });
        } catch (error) {
          if (!isRetryableMusicRoomError(error) || attempt >= SUNO_AUTOMATION_CONFIG.MUSIC_SEO_RESPONSE_ATTEMPTS - 1) throw error;
          logger.warn(SUNO_AUTOMATION_TEXTS.formatMusicRoomRetryLog(SUNO_AUTOMATION_CONFIG.STAGE_SEO_AND_THUMBNAIL, attempt + 2, _.toString(_.get(error, SOURCE_TEXT_MESSAGE, error))));
          parsed = null;
        }
        seoIssues = getMusicPlaylistSeoContractIssues(parsed);
        if (!_.isEmpty(seoIssues)) await writeMusicDiagnostic(SOURCE_TEXT_PLAN_SEO_CONTRACT_FAILED, { runId: requestId, attempt: attempt + 1, issues: seoIssues.join(SOURCE_TEXT_SYMBOL_34) });
        if (!_.isEmpty(seoIssues)) logger.warn(SOURCE_TEMPLATE_MUSICPLAN_SEO_CONTRACT_ATTEMPT_ISSUES(SOURCE_TEMPLATE_SYMBOL_86(`${attempt + 1}`), SOURCE_TEMPLATE_SYMBOL_86(`${seoIssues.join(SOURCE_TEXT_SYMBOL_34)}`)));
        if (validateMusicPlaylistSeoContract(parsed, rankedSongs)) return parsed;
      }
      throw createAppError(SOURCE_TEMPLATE_SEO_CHUA_DAT_DINH_DANG_YEU(SOURCE_TEMPLATE_SYMBOL_86(`${seoIssues.join(SOURCE_TEXT_SYMBOL_6)}`)));
    };
    currentStage = SUNO_AUTOMATION_CONFIG.STAGE_SEO_AND_THUMBNAIL;
    report.progress(currentStage);
    await writeMusicDiagnostic(SOURCE_TEXT_PLAN_STAGE_STARTED, { runId: requestId, stage: currentStage });
    const { parsed: playlistSeoParsed, warning: seoWarning } = await generatePlaylistSeo()
      .then((parsed) => ({ parsed, warning: undefined as string | undefined }))
      .catch((error) => {
        planningRun.signal.throwIfAborted();
        const warning = _.toString(_.get(error, SOURCE_TEXT_MESSAGE, MUSIC_CREATOR_TEXTS.vi.SERVER_CONTRACT_ERROR));
        logger.error(SOURCE_TEMPLATE_MUSICPLAN_NON_FATAL_SEO_FAILURE_REQUESTID(SOURCE_TEMPLATE_SYMBOL_86(`${requestId}`)), error);
        void writeMusicDiagnostic(SOURCE_TEXT_PLAN_SEO_FAILED, { runId: requestId, stage: currentStage, ...musicErrorDetails(error) });
        return { parsed: null, warning };
      });
    musicPlanCheckpoints.delete(requestId);
    await closeChatPlanningRoomsForProject({ provider, projectId }).catch(() => undefined);
    scheduleGlobalBrowserCleanup();
    await writeMusicDiagnostic(SOURCE_TEXT_PLAN_COMPLETED, { runId: requestId, songCount: rankedSongs.length, elapsedMs: Date.now() - planStartedAt, status: seoWarning ? SOURCE_TEXT_SEO_WARNING : SOURCE_TEXT_SUCCESS });
    report.progress(MUSIC_PLAN.STAGES.COMPLETE);
    return report.finish({
      success: true,
      data: {
        songs: rankedSongs,
        styleAnalysis: styleAnalysisParsed,
        sunoSettings: sunoSettingsParsed.settings,
        sunoSettingsAnalysis: { productionAssessment: sunoSettingsParsed.productionAssessment, parameterRationale: sunoSettingsParsed.parameterRationale, parameterAnalysis: sunoSettingsParsed.parameterAnalysis },
        playlistSeoOptions: _.castArray(playlistSeoParsed?.seoOptions || []),
        seoWarning,
        thumbnail: null,
      },
      provider: responseProvider,
    });
  } catch (error) {
    const cause = _.toString(_.get(error, SOURCE_TEXT_MESSAGE, error));
    logger.error(SOURCE_TEMPLATE_MUSICPLAN_FAILED_REQUESTID_STAGE_CAUSE(SOURCE_TEMPLATE_SYMBOL_86(`${requestId}`), SOURCE_TEMPLATE_SYMBOL_86(`${currentStage}`), SOURCE_TEMPLATE_SYMBOL_86(`${cause}`)), error);
    await writeMusicDiagnostic(SOURCE_TEXT_PLAN_FAILED, { runId: requestId, stage: currentStage, elapsedMs: Date.now() - planStartedAt, ...musicErrorDetails(error) });
    report.progress(MUSIC_PLAN.STAGES.ERROR);
    return report.finish({ success: false, error: SOURCE_TEMPLATE_SYMBOL_40(SOURCE_TEMPLATE_SYMBOL_86(`${MUSIC_CREATOR_TEXTS.vi.ERROR_GENERATION_FAILED}`), SOURCE_TEMPLATE_SYMBOL_86(`${currentStage}`), SOURCE_TEMPLATE_SYMBOL_86(`${cause}`)) }, HttpStatus.INTERNAL_SERVER_ERROR);
  } finally {
    try {
      await closeChatPlanningRoomsForProject({ provider: execution.provider || AiPlanningFallbackProvider.GeminiChat, projectId });
      if (req.aborted) await closeChatBrowserIfIdle();
    } catch (cleanupError) {
      await writeMusicDiagnostic(SOURCE_TEXT_PLAN_CLEANUP_FAILED, { runId: requestId, ...musicErrorDetails(cleanupError) });
    } finally {
      activeMusicPlanRuns = Math.max(0, activeMusicPlanRuns - 1);
      if (_.isEqual(activeMusicPlanRuns, 0)) scheduleGlobalBrowserCleanup();
      if (activeMusicPlanCleanup.get(requestId) === cleanupFinished) activeMusicPlanCleanup.delete(requestId);
      finishMusicPlanCleanup();
    }
  }
});
router.post(ROUTER_PATHS.MUSIC_SEO_REGENERATE, async (req: Request, res: Response) => {
  const songs = _.castArray(req.body?.songs || []);
  const style = _.trim(_.toString(req.body?.style));
  const referenceSource = _.trim(_.toString(req.body?.referenceSource));
  const styleAnalysis = req.body?.styleAnalysis;
  const execution = req.body?.aiExecution || {};
  const provider = execution.provider || AiPlanningFallbackProvider.GeminiChat;
  const projectId = _.trim(_.toString(req.body?.projectId)) || SOURCE_TEMPLATE_SEO_3(SOURCE_TEMPLATE_SYMBOL_86(`${SUNO_AUTOMATION_CONFIG.RUN_ID_PREFIX}`), SOURCE_TEMPLATE_SYMBOL_86(`${Date.now()}`));
  const requestId = _.trim(_.toString(req.body?.requestId)) || SOURCE_TEMPLATE_REGENERATE(SOURCE_TEMPLATE_SYMBOL_86(`${projectId}`));
  if (_.isEmpty(songs)) {
    return res.status(HttpStatus.BAD_REQUEST).json({ success: false, error: MUSIC_CREATOR_TEXTS.vi.SERVER_VALIDATION_ERROR });
  }
  activeMusicPlanRuns += 1;
  const planningRun = beginChatPlanningRun(requestId, Date.now(), SOURCE_TEMPLATE_SEO_4(SOURCE_TEMPLATE_SYMBOL_86(`${SUNO_AUTOMATION_CONFIG.MUSIC_PLAN_WORKER_TYPE}`)), provider);
  req.once(SOURCE_TEXT_ABORTED, planningRun.cancel);
  try {
    let parsed: any = null;
    let seoIssues: string[] = [];
    for (let attempt = 0; attempt < SUNO_AUTOMATION_CONFIG.MUSIC_ROOM_RESPONSE_ATTEMPTS; attempt += 1) {
      const prompt =
        attempt === 0
          ? SUNO_AUTOMATION_TEXTS.buildMusicPlaylistSeoRegenerationPrompt(songs, style || MUSIC_CREATOR_TEXTS.en.DEFAULT_CREATIVE_STYLE, requestId, MUSIC_CREATOR_CONSTANTS.REQUIRED_SEO_OPTIONS_COUNT, styleAnalysis, referenceSource)
          : SUNO_AUTOMATION_TEXTS.buildMusicPlaylistSeoCorrectionPrompt(songs, style || MUSIC_CREATOR_TEXTS.en.DEFAULT_CREATIVE_STYLE, MUSIC_CREATOR_CONSTANTS.REQUIRED_SEO_OPTIONS_COUNT, requestId, seoIssues, styleAnalysis, referenceSource);
      try {
        const response = await generatePlanningWithChatUi({ provider, model: execution.model, prompt, projectId, chromeHeadless: execution.chromeHeadless !== false, artifactType: SUNO_AUTOMATION_CONFIG.ARTIFACT_TYPE_SEO, requestId, signal: planningRun.signal, closeRoomOnComplete: false });
        parsed = jsonUtils.safeParse(response.text, null);
      } catch (error) {
        if (!isRetryableMusicRoomError(error) || attempt >= SUNO_AUTOMATION_CONFIG.MUSIC_ROOM_RESPONSE_ATTEMPTS - 1) throw error;
        logger.warn(SUNO_AUTOMATION_TEXTS.formatMusicRoomRetryLog(SUNO_AUTOMATION_CONFIG.STAGE_SEO_AND_THUMBNAIL, attempt + 2, _.toString(_.get(error, SOURCE_TEXT_MESSAGE, error))));
        parsed = null;
      }
      seoIssues = getMusicPlaylistSeoContractIssues(parsed);
      if (!_.isEmpty(seoIssues)) logger.warn(SOURCE_TEMPLATE_MUSICSEOREGENERATE_CONTRACT_ATTEMPT_ISSUES(SOURCE_TEMPLATE_SYMBOL_86(`${attempt + 1}`), SOURCE_TEMPLATE_SYMBOL_86(`${seoIssues.join(SOURCE_TEXT_SYMBOL_34)}`)));
      if (validateMusicPlaylistSeoContract(parsed, songs)) {
        return res.json({ success: true, playlistSeoOptions: parsed.seoOptions });
      }
    }
    throw createAppError(SOURCE_TEMPLATE_SYMBOL_16(SOURCE_TEMPLATE_SYMBOL_86(`${MUSIC_CREATOR_TEXTS.vi.SERVER_CONTRACT_ERROR}`), SOURCE_TEMPLATE_SYMBOL_86(`${seoIssues.join(SOURCE_TEXT_SYMBOL_6)}`)));
  } catch (error) {
    return res.status(HttpStatus.BAD_REQUEST).json({ success: false, error: _.toString(_.get(error, SOURCE_TEXT_MESSAGE, MUSIC_CREATOR_TEXTS.vi.SERVER_CONTRACT_ERROR)) });
  } finally {
    planningRun.complete();
    await closeChatPlanningRoom({ provider, projectId }).catch(() => undefined);
    await closeChatBrowserIfIdle();
    activeMusicPlanRuns = Math.max(0, activeMusicPlanRuns - 1);
    if (_.isEqual(activeMusicPlanRuns, 0)) scheduleGlobalBrowserCleanup();
  }
});
router.post(ROUTER_PATHS.MUSIC_IMAGE_NOTE_NORMALIZE, async (req: Request, res: Response) => {
  const note = _.trim(_.toString(req.body?.note));
  const purpose = _.isEqual(req.body?.assetPurpose, SUNO_AUTOMATION_CONFIG.MUSIC_IMAGE_PURPOSE_VIDEO) ? SUNO_AUTOMATION_CONFIG.MUSIC_IMAGE_PURPOSE_VIDEO : SOURCE_TEXT_COVER;
  const reference = _.toString(purpose === SUNO_AUTOMATION_CONFIG.MUSIC_IMAGE_PURPOSE_VIDEO ? req.body?.videoBackgroundReference : req.body?.thumbnailReference);
  const referenceMatch = reference.match(SUNO_AUTOMATION_PATTERNS.DATA_URL_BASE64);
  if (_.isEmpty(note) || (reference && (!referenceMatch || !_.startsWith(referenceMatch[1], SUNO_AUTOMATION_CONFIG.MIME_IMAGE_PREFIX)))) {
    return res.status(HttpStatus.BAD_REQUEST).json({ success: false, error: MUSIC_CREATOR_TEXTS.vi.IMAGE_NOTE_NORMALIZE_ERROR });
  }
  const requestId = SOURCE_TEMPLATE_SYMBOL_5(SOURCE_TEMPLATE_SYMBOL_86(`${SUNO_AUTOMATION_CONFIG.MUSIC_IMAGE_NOTE_WORKER_TYPE}`), SOURCE_TEMPLATE_SYMBOL_86(`${randomUUID()}`));
  const provider = AiPlanningFallbackProvider.GeminiChat;
  const planningRun = beginChatPlanningRun(requestId, Date.now(), SUNO_AUTOMATION_CONFIG.MUSIC_IMAGE_NOTE_WORKER_TYPE, provider);
  req.once(SOURCE_TEXT_ABORTED, planningRun.cancel);
  activeMusicPlanRuns += 1;
  try {
    const attachments = referenceMatch ? [{ name: _.toString((purpose === SUNO_AUTOMATION_CONFIG.MUSIC_IMAGE_PURPOSE_VIDEO ? req.body?.videoBackgroundReferenceName : req.body?.thumbnailReferenceName) || SUNO_AUTOMATION_CONFIG.DEFAULT_REFERENCE_THUMBNAIL_NAME), mimeType: referenceMatch[1], buffer: Buffer.from(referenceMatch[2], SOURCE_TEXT_BASE64) }] : [];
    const prompt = SUNO_AUTOMATION_TEXTS.buildMusicImageNoteNormalizationPrompt(note, purpose, !_.isEmpty(attachments), req.body?.showTrackList !== false, requestId, req.body?.styleAnalysis);
    let lastError: unknown;
    for (let attempt = 0; attempt < SUNO_AUTOMATION_CONFIG.MUSIC_IMAGE_NOTE_ATTEMPTS; attempt += 1) {
      try {
        const response = await generatePlanningWithChatUi({ provider, model: AiPlanningChatModel.GeminiFlash, prompt, projectId: requestId, workerId: SUNO_AUTOMATION_CONFIG.MUSIC_IMAGE_NOTE_WORKER_TYPE, chromeHeadless: req.body?.chromeHeadless !== false, attachments, artifactType: SUNO_AUTOMATION_CONFIG.ARTIFACT_TYPE_IMAGE_NOTE, requestId, signal: planningRun.signal, closeRoomOnComplete: false });
        const parsed = jsonUtils.safeParse(response.text, null);
        const normalizedNote = _.trim(_.toString(parsed?.normalizedNote));
        if (!_.isEqual(parsed?.artifactType, SUNO_AUTOMATION_CONFIG.ARTIFACT_TYPE_IMAGE_NOTE) || !_.isEqual(parsed?.requestId, requestId) || _.isEmpty(normalizedNote)) {
          throw new Error(SUNO_AUTOMATION_TEXTS.MUSIC_IMAGE_NOTE_INVALID_ERROR);
        }
        return res.json({ success: true, normalizedNote });
      } catch (error) {
        lastError = error;
        if (!isRetryableMusicRoomError(error)) throw error;
      }
    }
    throw lastError;
  } catch (error) {
    logger.error(SOURCE_TEMPLATE_MUSICIMAGENOTE_FAILED_REQUESTID(SOURCE_TEMPLATE_SYMBOL_86(`${requestId}`)), error);
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ success: false, error: MUSIC_CREATOR_TEXTS.vi.IMAGE_NOTE_NORMALIZE_ERROR });
  } finally {
    planningRun.complete();
    await closeChatPlanningRoom({ provider, projectId: requestId, workerId: SUNO_AUTOMATION_CONFIG.MUSIC_IMAGE_NOTE_WORKER_TYPE }).catch(() => undefined);
    await closeChatBrowserIfIdle();
    activeMusicPlanRuns = Math.max(0, activeMusicPlanRuns - 1);
    if (_.isEqual(activeMusicPlanRuns, 0)) scheduleGlobalBrowserCleanup();
  }
});
router.post(ROUTER_PATHS.MUSIC_THUMBNAIL, requireLicense(FeatureType.IMAGE), async (req: Request, res: Response) => {
  const songs = _.castArray(req.body?.songs || []);
  const style = _.trim(_.toString(req.body?.style));
  const sourceContext = _.trim(_.toString(req.body?.sourceContext));
  const isVideoBackground = _.isEqual(req.body?.assetPurpose, SUNO_AUTOMATION_CONFIG.MUSIC_IMAGE_PURPOSE_VIDEO);
  const description = _.trim(_.toString(isVideoBackground ? req.body?.videoBackgroundDescription : req.body?.thumbnailDescription));
  const reference = _.toString(isVideoBackground ? req.body?.videoBackgroundReference : req.body?.thumbnailReference);
  if (_.isEmpty(songs) && _.isEmpty(style) && _.isEmpty(sourceContext) && _.isEmpty(description) && _.isEmpty(reference)) {
    return res.status(HttpStatus.BAD_REQUEST).json({ success: false, warning: MUSIC_CREATOR_TEXTS.vi.THUMBNAIL_GENERATE_ERROR });
  }
  activeMusicPlanRuns += 1;
  const imageRunId = _.trim(_.toString(req.body?.imageRunId)) || randomUUID();
  const imageRun = beginChatPlanningRun(imageRunId, Date.now(), SUNO_AUTOMATION_CONFIG.MUSIC_IMAGE_PROMPT_WORKER_TYPE);
  req.once(SOURCE_TEXT_ABORTED, imageRun.cancel);
  try {
    const result = await generateMusicThumbnailAsset({
      songs,
      style,
      sourceContext,
      styleAnalysis: req.body?.styleAnalysis,
      description,
      reference,
      referenceName: _.toString((isVideoBackground ? req.body?.videoBackgroundReferenceName : req.body?.thumbnailReferenceName) || SUNO_AUTOMATION_CONFIG.DEFAULT_REFERENCE_THUMBNAIL_NAME),
      chromeHeadless: req.body?.chromeHeadless !== false,
      assetPurpose: _.toString(req.body?.assetPurpose),
      showTrackList: req.body?.showTrackList !== false,
      planningProvider: req.body?.aiExecution?.provider,
      planningModel: req.body?.aiExecution?.model,
      signal: imageRun.signal,
    });
    imageRun.signal.throwIfAborted();
    if (_.isEmpty(result.thumbnail)) return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ success: false, warning: result.warning });
    await incrementFeatureUsage(req, FeatureType.IMAGE, SecurityConstants.DEFAULT_AMOUNT);
    return res.json({ success: true, thumbnail: result.thumbnail });
  } catch (error) {
    if (imageRun.signal.aborted) return res.status(499).json({ success: false, warning: MUSIC_CREATOR_TEXTS.vi.THUMBNAIL_GENERATE_ERROR });
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ success: false, warning: _.toString(_.get(error, SOURCE_TEXT_MESSAGE, MUSIC_CREATOR_TEXTS.vi.THUMBNAIL_GENERATE_ERROR)) });
  } finally {
    imageRun.complete();
    activeMusicPlanRuns = Math.max(0, activeMusicPlanRuns - 1);
    if (_.isEqual(activeMusicPlanRuns, 0)) await closeChatBrowserIfIdle();
  }
});
const createSunoEvaluationPreview = async (wavPath: string): Promise<Buffer> => {
  const previewPath = path.join(getTempDirectory(), SOURCE_TEMPLATE_VIDIFY_EVALUATION_MP3(SOURCE_TEMPLATE_SYMBOL_86(`${randomUUID()}`)));
  try {
    await new Promise<void>((resolve, reject) => {
      ffmpeg(wavPath)
        .noVideo()
        .audioCodec(SOURCE_TEXT_LIBMP3LAME)
        .audioBitrate(SOURCE_TEXT_96K)
        .format(SOURCE_TEXT_MP3)
        .on(SOURCE_TEXT_END, () => resolve())
        .on(SOURCE_TEXT_ERROR, reject)
        .save(previewPath);
    });
    return await fs.promises.readFile(previewPath);
  } finally {
    await fs.promises.rm(previewPath, { force: true }).catch(() => undefined);
  }
};
const sunoAudioPreparationSlots = new AsyncTaskLimiter(SUNO_AUTOMATION_CONFIG.EVALUATION_AUDIO_DOWNLOAD_CONCURRENCY);
const downloadSunoEvaluationAudio = async (songIds: string[], cacheKey: string, signal?: AbortSignal, preparePreview = true, onPrepared?: (completed: number) => void): Promise<Map<string, Buffer>> => {
  const downloadOrigin = _.trim(process.env.DOWNLOADER_STREAM_ORIGIN || SUNO_AUTOMATION_CONFIG.SUNO_DOWNLOAD_ORIGIN).replace(SUNO_AUTOMATION_PATTERNS.TRAILING_SLASH, C.EMPTY);
  const audioBySongId = new Map<string, Buffer>();
  for (const idChunk of _.chunk(_.uniq(songIds), SUNO_AUTOMATION_CONFIG.EVALUATION_AUDIO_DOWNLOAD_CONCURRENCY)) {
    signal?.throwIfAborted();
    const downloaded = await Promise.all(
      _.map(idChunk, (songId) =>
        sunoAudioPreparationSlots.run(async () => {
          const cachedAudio = preparePreview ? await readMusicEvaluationAudio(cacheKey, songId) : null;
          const cachedWav = await readMusicEvaluationWav(cacheKey, songId);
          if (cachedWav && !preparePreview) return [songId, null] as const;
          if (cachedAudio) {
            await writeSunoCuratedLog(SOURCE_TEXT_EVALUATION_AUDIO_CACHE_HIT, { songId, bytes: cachedAudio.length });
            return [songId, cachedAudio] as const;
          }
          let lastError: unknown;
          for (let attempt = 0; attempt < SUNO_AUTOMATION_CONFIG.EVALUATION_AUDIO_DOWNLOAD_ATTEMPTS; attempt += 1) {
            signal?.throwIfAborted();
            try {
              let wavPath = cachedWav;
              if (!wavPath) {
                const timeoutSignal = AbortSignal.timeout(SUNO_AUTOMATION_CONFIG.AUDIO_DOWNLOAD_WAV_TIMEOUT_MS);
                const response = await fetch(SUNO_AUTOMATION_CONFIG.formatAudioDownloadUrl(downloadOrigin, songId, SUNO_AUTOMATION_CONFIG.FORMAT_WAV), { signal: signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal });
                if (!response.ok) throw new Error(SUNO_AUTOMATION_TEXTS.formatDownloadHttpError(response.status));
                wavPath = await writeMusicEvaluationWav(cacheKey, songId, Buffer.from(await response.arrayBuffer()));
                await writeSunoCuratedLog(SOURCE_TEXT_EVALUATION_WAV_CACHED, { songId });
              }
              if (!preparePreview) return [songId, null] as const;
              const audio = cachedAudio && cachedWav ? cachedAudio : await createSunoEvaluationPreview(wavPath);
              if (!cachedAudio || !cachedWav) await writeMusicEvaluationAudio(cacheKey, songId, audio);
              return [songId, audio] as const;
            } catch (error) {
              lastError = error;
              signal?.throwIfAborted();
              if (_.includes(_.toString(_.get(error, SOURCE_TEXT_MESSAGE, error)), SOURCE_TEXT_SUNO_DOWNLOAD_HTTP_502)) break;
              if (attempt < SUNO_AUTOMATION_CONFIG.EVALUATION_AUDIO_DOWNLOAD_ATTEMPTS - 1) {
                await delayAsync(SUNO_AUTOMATION_CONFIG.getAudioRetryDelayMs(attempt));
              }
            }
          }
          const cause = _.toString(_.get(lastError, SOURCE_TEXT_MESSAGE, lastError));
          logger.error(SOURCE_TEMPLATE_TRACKID_CAUSE(SOURCE_TEMPLATE_SYMBOL_86(`${SUNO_AUTOMATION_TEXTS.DOWNLOAD_TRACK_FAILED_ERR}`), SOURCE_TEMPLATE_SYMBOL_86(`${songId}`), SOURCE_TEMPLATE_SYMBOL_86(`${cause}`)));
          await writeSunoCuratedLog(SOURCE_TEXT_EVALUATION_AUDIO_DOWNLOAD_FAILED, { songId, cause });
          if (_.includes(cause, SOURCE_TEXT_SUNO_DOWNLOAD_HTTP_502)) throw createAppError(SUNO_AUTOMATION_TEXTS.WAV_SOURCE_UNAVAILABLE_ERR);
          throw createAppError(SOURCE_TEMPLATE_TRACKID(SOURCE_TEMPLATE_SYMBOL_86(`${SUNO_AUTOMATION_TEXTS.DOWNLOAD_TRACK_FAILED_ERR}`), SOURCE_TEMPLATE_SYMBOL_86(`${songId}`), SOURCE_TEMPLATE_SYMBOL_86(`${cause}`)));
        }, signal),
      ),
    );
    _.forEach(downloaded, ([songId, buffer]) => {
      if (buffer) audioBySongId.set(songId, buffer);
    });
    signal?.throwIfAborted();
    onPrepared?.(audioBySongId.size);
  }
  return audioBySongId;
};
const selectProfessionalSunoTracks = async (
  groups: Array<{ title: string; candidates: string[] }>,
  style: string,
  room: { projectId: string; workerId: string; model?: AiPlanningChatModel; signal?: AbortSignal; onUploadProgress?: (progress: MusicUploadProgress & { attempt: number }) => void },
  audioBySongId: Map<string, Buffer>,
  styleAnalysis?: unknown,
): Promise<Array<{ songId: string; title: string; qualityScore: number }>> => {
  if (_.isEmpty(groups) || _.some(groups, (group) => _.size(group.candidates) !== 2)) throw createAppError(SUNO_AUTOMATION_TEXTS.GENERATION_FAILED_ERR);
  const createEvaluationSchema = (requestId: string) => ({
    type: SOURCE_TEXT_OBJECT,
    additionalProperties: false,
    required: [SOURCE_TEXT_ARTIFACTTYPE, SOURCE_TEXT_REQUESTID, SOURCE_TEXT_SELECTEDTRACKIDS, SOURCE_TEXT_QUALITYSCORES],
    properties: {
      artifactType: { type: SOURCE_TEXT_STRING, enum: [SUNO_AUTOMATION_CONFIG.ARTIFACT_TYPE_MUSIC_EVALUATION] },
      requestId: { type: SOURCE_TEXT_STRING, enum: [requestId] },
      selectedTrackIds: { type: SOURCE_TEXT_ARRAY, minItems: groups.length, maxItems: groups.length, items: { type: SOURCE_TEXT_STRING } },
      qualityScores: { type: SOURCE_TEXT_ARRAY, minItems: groups.length, maxItems: groups.length, items: { type: SOURCE_TEXT_INTEGER, minimum: 0, maximum: 100 } },
    },
  });
  const allCandidateIds = _.flatMap(groups, SOURCE_TEXT_CANDIDATES);
  if (_.some(allCandidateIds, (songId) => !audioBySongId.has(songId))) throw createAppError(SUNO_AUTOMATION_TEXTS.DOWNLOAD_TRACK_FAILED_ERR);
  const attachmentDirectory = await fs.promises.mkdtemp(path.join(getTempDirectory(), SUNO_AUTOMATION_CONFIG.TEMP_ATTACHMENT_DIR_PREFIX));
  const attachments = await Promise.all(
    _.map(allCandidateIds, async (songId, index) => {
      const filePath = path.join(attachmentDirectory, SUNO_AUTOMATION_CONFIG.formatTempAttachmentFileName(index, songId, SUNO_AUTOMATION_CONFIG.FORMAT_MP3));
      await fs.promises.writeFile(filePath, audioBySongId.get(songId)!);
      return { name: path.basename(filePath), mimeType: SUNO_AUTOMATION_CONFIG.MIME_MP3, path: filePath };
    }),
  );
  try {
    let lastError: unknown;
    for (let attempt = 0; attempt < SUNO_AUTOMATION_CONFIG.MAX_EVALUATION_ATTEMPTS; attempt++) {
      room.signal?.throwIfAborted();
      const requestId = SUNO_AUTOMATION_CONFIG.formatChunkEvaluationRequestId(room.projectId, groups[0].title, attempt + 1);
      const schema = createEvaluationSchema(requestId);
      const prompt = attempt === 0 ? SUNO_AUTOMATION_TEXTS.buildTrackBatchEvaluationPrompt(style, groups, jsonUtils.safeStringify(schema), styleAnalysis) : SUNO_AUTOMATION_TEXTS.buildTrackBatchEvaluationRetryPrompt(groups, jsonUtils.safeStringify(schema), styleAnalysis);
      try {
        const response = await generatePlanningWithChatUi({
          provider: AiPlanningFallbackProvider.GeminiChat,
          model: room.model,
          prompt,
          projectId: room.projectId,
          workerId: room.workerId,
          chromeHeadless: false,
          signal: room.signal,
          attachments,
          artifactType: SUNO_AUTOMATION_CONFIG.ARTIFACT_TYPE_MUSIC_EVALUATION,
          requestId,
          closeRoomOnComplete: false,
          allowDefaultGeminiModel: true,
          onUploadProgress: (progress) => room.onUploadProgress?.({ ...progress, attempt: attempt + 1 }),
        });
        const evaluation = parseAiJsonArtifact<{ artifactType: string; requestId: string; selectedTrackIds: string[]; qualityScores: number[] }>(response.text, schema, SUNO_AUTOMATION_TEXTS.INVALID_TRACK_SELECTION_ARTIFACT);
        if (!_.isEqual(evaluation.artifactType, SUNO_AUTOMATION_CONFIG.ARTIFACT_TYPE_MUSIC_EVALUATION) || !_.isEqual(normalizeCinematicArtifactIdentity(evaluation.requestId), normalizeCinematicArtifactIdentity(requestId))) {
          throw createAppError(SUNO_AUTOMATION_TEXTS.INVALID_TRACK_SELECTION_ARTIFACT);
        }
        await writeSunoCuratedLog(SOURCE_TEXT_EVALUATION_RESPONSE_PARSED, { evaluationRunId: room.projectId, workerId: room.workerId, attempt: attempt + 1, expectedCount: groups.length, selectedCount: _.size(evaluation.selectedTrackIds), scoreCount: _.size(evaluation.qualityScores), responseChars: response.text.length });
        if (_.size(evaluation.selectedTrackIds) !== groups.length || _.size(evaluation.qualityScores) !== groups.length) throw createAppError(SUNO_AUTOMATION_TEXTS.INVALID_SELECTED_TRACK_ID_ERR);
        return _.map(groups, (group, index) => {
          const selectedTrackId = _.trim(_.toString(evaluation.selectedTrackIds[index]));
          const qualityScore = _.toNumber(evaluation.qualityScores[index]);
          if (!_.includes(group.candidates, selectedTrackId)) throw createAppError(SUNO_AUTOMATION_TEXTS.INVALID_SELECTED_TRACK_ID_ERR);
          if (!Number.isInteger(qualityScore) || qualityScore < 0 || qualityScore > 100) throw createAppError(SUNO_AUTOMATION_TEXTS.INVALID_SELECTED_TRACK_ID_ERR);
          return { songId: selectedTrackId, title: group.title, qualityScore };
        });
      } catch (error) {
        lastError = error;
        if (!canRetryMusicEvaluation(error, room.signal)) throw error;
        if (_.isEqual(_.toString(_.get(error, SOURCE_TEXT_CODE)), CINEMATIC_CHAT_PLANNING_CONFIG.RESPONSE_TIMEOUT_CODE)) throw error;
        await writeSunoCuratedLog(SUNO_AUTOMATION_CONFIG.EVENT_CHUNK_EVAL_RETRY, { projectId: room.projectId, workerId: room.workerId, attempt: attempt + 1, ...musicErrorDetails(error) });
        if (attempt < SUNO_AUTOMATION_CONFIG.MAX_EVALUATION_ATTEMPTS - 1) await waitForMusicEvaluationRetry(attempt, room.signal);
      }
    }
    throw lastError;
  } finally {
    await fs.promises.rm(attachmentDirectory, { recursive: true, force: true }).catch(() => undefined);
  }
};
const SUNO_CURATED_LOG_PATH = path.join(getLogsDirectory(), SUNO_AUTOMATION_CONFIG.LOG_FILENAME_CURATED);
const writeSunoCuratedLog = async (event: string, details: Record<string, unknown> = {}): Promise<void> => {
  try {
    await fs.promises.mkdir(path.dirname(SUNO_CURATED_LOG_PATH), { recursive: true });
    await fs.promises.appendFile(SUNO_CURATED_LOG_PATH, MOTION_TEMPLATE_SYMBOL_24(SOURCE_TEMPLATE_SYMBOL_86(`${jsonUtils.safeStringify({ timestamp: new Date().toISOString(), event, ...details })}`)), SUNO_AUTOMATION_CONFIG.ENCODING_UTF8);
  } catch {}
};
router.post(ROUTER_PATHS.MUSIC_SUNO_CREATE, async (req: Request, res: Response) => {
  const runId = SOURCE_TEMPLATE_SUNO_CREATE(SOURCE_TEMPLATE_SYMBOL_86(`${Date.now()}`));
  const songs = _.map(_.castArray(req.body?.songs || []), (song) => ({ songId: _.trim(_.toString(song?.songId)), title: _.trim(_.toString(song?.title)), lyrics: _.trim(_.toString(song?.lyrics)) }));
  const style = _.trim(_.toString(req.body?.style));
  const inspo = _.trim(_.toString(req.body?.inspo));
  const initialSongIds = _.castArray(req.body?.initialSongIds || []);
  if ((_.isEmpty(songs) && _.isEmpty(initialSongIds)) || _.some(songs, (song) => _.isEmpty(song.songId) || _.isEmpty(song.title) || _.isEmpty(song.lyrics))) {
    await writeMusicDiagnostic(SOURCE_TEXT_SUNO_CREATE_VALIDATION_FAILED, { runId, songCount: songs.length, recoveredCount: initialSongIds.length });
    return res.status(HttpStatus.BAD_REQUEST).json({ success: false, error: SUNO_AUTOMATION_TEXTS.VALIDATION_PLAYLIST_INPUT_ERR });
  }
  const report = sunoCreationReporter(res, req.body?.stream === true);
  try {
    await writeMusicDiagnostic(SOURCE_TEXT_SUNO_CREATE_STARTED, { runId, songCount: songs.length, recoveredCount: initialSongIds.length });
    const effectiveStyle = style || _.uniq(_.compact(_.map(_.castArray(req.body?.songs || []), (song) => _.trim(_.toString(song?.genre))))).join(SOURCE_TEXT_SYMBOL_10) || SUNO_AUTOMATION_CONFIG.DEFAULT_FALLBACK_STYLE;
    const result = await createSunoPlaylist(songs, effectiveStyle, inspo, req.body?.sunoSettings, initialSongIds, _.trim(_.toString(req.body?.playlistName)), runId, { testOnly: req.body?.testOnly === true, onProgress: report.progress });
    await writeMusicDiagnostic(SOURCE_TEXT_SUNO_CREATE_COMPLETED, { runId, createdCount: result.createdSongIds.length });
    return report.finish({ success: true, ...result });
  } catch (error) {
    logger.error(SUNO_AUTOMATION_TEXTS.LOG_SUNO_AUTOMATION_FAILED, _.toString(_.get(error, SOURCE_TEXT_STACK, _.get(error, SOURCE_TEXT_MESSAGE, error))));
    await writeMusicDiagnostic(SOURCE_TEXT_SUNO_CREATE_FAILED, { runId, createdCount: _.size(_.get(error, SOURCE_TEXT_CREATEDSONGIDS, [])), ...musicErrorDetails(error) });
    return report.finish({ success: false, error: _.toString(_.get(error, SOURCE_TEXT_MESSAGE, SUNO_AUTOMATION_TEXTS.FAILED_COMPLETE_SUNO_ERR)), createdSongIds: _.castArray(_.get(error, SOURCE_TEXT_CREATEDSONGIDS, [])), generationCheckpoint: _.get(error, RT_SERVER.GENERATIONCHECKPOINT) === true, playlistName: _.get(error, RT_SERVER.PLAYLISTNAME) }, HttpStatus.INTERNAL_SERVER_ERROR);
  }
});
router.post(ROUTER_PATHS.MUSIC_SUNO_CANCEL, async (_req: Request, res: Response) => {
  await cancelActiveSunoCreation();
  return res.json({ success: true });
});
router.post(ROUTER_PATHS.MUSIC_SUNO_DOWNLOAD, async (req: Request, res: Response) => {
  const report = musicDownloadReporter(res, req.body?.stream === true);
  const shouldEvaluateTracks = req.body?.evaluateTracks !== false;
  const evaluationProjectId = _.trim(_.toString(req.body?.aiExecution?.projectId));
  const evaluationProvider = req.body?.aiExecution?.provider;
  const evaluationMode = req.body?.aiExecution?.mode;
  const evaluationRunId = evaluationProjectId || SOURCE_TEMPLATE_SYMBOL_75(`${SUNO_AUTOMATION_CONFIG.EVALUATION_RUN_ID_PREFIX}`, `${Date.now()}`);
  let planningRun: ReturnType<typeof beginChatPlanningRun> | undefined;
  let evaluationWorkerIds: string[] = [];
  let evaluationRoomsClosed = false;
  const downloadAbortController = new AbortController();
  const connectionClosed = () => {
    if (!res.writableEnded) {
      downloadAbortController.abort();
      planningRun?.cancel();
    }
  };
  res.once(RT_SERVER.CLOSE, connectionClosed);
  const closeEvaluationRooms = async (): Promise<void> => {
    if (evaluationRoomsClosed || _.isEmpty(evaluationProjectId)) return;
    evaluationRoomsClosed = true;
    await Promise.allSettled(_.map(evaluationWorkerIds, (workerId) => closeChatPlanningRoom({ provider: AiPlanningFallbackProvider.GeminiChat, projectId: evaluationProjectId, workerId })));
    const browserClosed = await closeChatBrowserIfIdle();
    await writeSunoCuratedLog(SOURCE_TEXT_EVALUATION_BROWSER_CLEANUP, { evaluationRunId, browserClosed });
  };
  try {
    await writeSunoCuratedLog(SUNO_AUTOMATION_CONFIG.EVENT_REQUEST_STARTED, { evaluationRunId, evaluateTracks: shouldEvaluateTracks, format: _.toLower(_.trim(_.toString(req.body?.format))), suppliedTrackCount: _.size(_.castArray(req.body?.tracks || [])) });
    let tracks = _.map(_.castArray(req.body?.tracks || []), (track) => ({ songId: _.trim(_.toString(track?.songId)), title: _.trim(_.toString(track?.title)) }));
    if (_.isEmpty(tracks)) {
      await writeSunoCuratedLog(SOURCE_TEXT_PLAYLIST_TRACKS_RECOVERY_STARTED, { evaluationRunId });
      const recovered = await getSunoPlaylistTracks(_.toString(req.body?.playlistUrl));
      await writeSunoCuratedLog(SOURCE_TEXT_PLAYLIST_TRACKS_RECOVERED, { evaluationRunId, trackCount: recovered.length });
      const songTitles = _.map(_.castArray(req.body?.songTitles || []), (title) => _.trim(_.toString(title)));
      tracks = _.map(recovered, ({ songId }, index) => {
        const songIndex = Math.floor(index / 2);
        const songNumber = songIndex + 1;
        const title = songTitles[songIndex] || recovered[songIndex * 2]?.title || recovered[index]?.title || MOTION_TEMPLATE_SYMBOL_12(SOURCE_TEMPLATE_SYMBOL_86(`${SUNO_AUTOMATION_CONFIG.DEFAULT_TRACK_LABEL}`), SOURCE_TEMPLATE_SYMBOL_86(`${songNumber}`));
        return { songId, title: SUNO_AUTOMATION_TEXTS.formatSongVariantTitle(songNumber, title, (index % 2) + 1) };
      });
    }
    const candidateIds = _.map(tracks, SOURCE_TEXT_SONGID);
    if (_.isEmpty(candidateIds) || _.some(candidateIds, (songId) => _.isEmpty(songId))) {
      throw createAppError(SUNO_AUTOMATION_TEXTS.DOWNLOAD_TRACKS_REQUIRED_ERR);
    }
    if (req.body?.maxTracks !== 1 && candidateIds.length % SUNO_AUTOMATION_CONFIG.MIN_TRACKS_PER_PROMPT !== 0) {
      throw createAppError(SUNO_AUTOMATION_TEXTS.GENERATION_FAILED_ERR);
    }
    const audioCacheKey = createMusicEvaluationAudioCacheKey(_.toString(req.body?.playlistUrl), candidateIds);
    if (!shouldEvaluateTracks && req.body?.keepAllTakes !== true) {
      tracks = req.body?.maxTracks === 1 ? _.take(tracks, 1) : _.flatMap(_.chunk(tracks, SUNO_AUTOMATION_CONFIG.MIN_TRACKS_PER_PROMPT), (pair) => _.take(pair, 1));
    }
    const downloadFormat = _.toLower(_.trim(_.toString(req.body?.format))) as typeof SUNO_AUTOMATION_CONFIG.FORMAT_MP3 | typeof SUNO_AUTOMATION_CONFIG.FORMAT_WAV;
    const requestedFolder = _.trim(_.toString(req.body?.folderPath));
    if (!_.includes([SUNO_AUTOMATION_CONFIG.FORMAT_MP3, SUNO_AUTOMATION_CONFIG.FORMAT_WAV], downloadFormat)) {
      throw createAppError(SUNO_AUTOMATION_TEXTS.DOWNLOAD_TRACK_FAILED_ERR);
    }
    if (_.isEmpty(requestedFolder) || !path.isAbsolute(requestedFolder) || !(await fs.promises.stat(requestedFolder).catch(() => null))?.isDirectory()) {
      throw createAppError(SUNO_AUTOMATION_TEXTS.DOWNLOAD_FOLDER_INVALID_ERR);
    }
    const downloadFolder = path.resolve(requestedFolder);
    const checkpointKey = createMusicDownloadCheckpointKey(_.toString(req.body?.playlistUrl), candidateIds, _.toString(req.body?.style), _.toString(req.body?.aiExecution?.model), req.body?.styleAnalysis);
    const finishCuratedDownload = async (checkpoint: MusicDownloadCheckpoint): Promise<Response> => {
      report.progress({ phase: RT_SERVER.EXPORTING, expected: checkpoint.selectedTracks.length, message: RT_SERVER.DANG_CHUAN_BI_VA_XUAT_AM_THANH_GOC });
      if (checkpoint.folderPath !== downloadFolder || checkpoint.format !== downloadFormat) {
        checkpoint.folderPath = downloadFolder;
        checkpoint.format = downloadFormat;
        checkpoint.downloadedPaths = {};
        await writeMusicDownloadCheckpoint(checkpoint);
      }
      for (const [songId, filePath] of _.toPairs(checkpoint.downloadedPaths)) {
        const validLocation = path.dirname(path.resolve(filePath)) === downloadFolder && path.extname(filePath).toLowerCase() === SOURCE_TEMPLATE_SYMBOL_36(SOURCE_TEMPLATE_SYMBOL_86(`${downloadFormat}`));
        if (!validLocation || !(await fs.promises.stat(filePath).catch(() => null))?.isFile() || (await readMediaDurationSeconds(filePath)) <= 0) {
          delete checkpoint.downloadedPaths[songId];
        }
      }
      await writeMusicDownloadCheckpoint(checkpoint);
      const sourceWavPaths: Record<string, string> = {};
      for (const track of checkpoint.selectedTracks) {
        let wavPath = await readMusicEvaluationWav(audioCacheKey, track.songId);
        if (!wavPath) wavPath = await readMusicEvaluationWav(checkpoint.key, track.songId);
        if (!wavPath) {
          await downloadSunoEvaluationAudio([track.songId], audioCacheKey, planningRun?.signal || downloadAbortController.signal);
          wavPath = await readMusicEvaluationWav(audioCacheKey, track.songId);
        }
        if (wavPath) sourceWavPaths[track.songId] = wavPath;
        else throw createAppError(SOURCE_TEMPLATE_KHONG_THE_PHUC_HOI_WAV_GOC(SOURCE_TEMPLATE_SYMBOL_86(`${track.title}`)));
      }
      await writeSunoCuratedLog(SUNO_AUTOMATION_CONFIG.EVENT_DOWNLOAD_STARTED, { evaluationRunId, trackCount: checkpoint.selectedTracks.length, format: downloadFormat, resumedCount: _.keys(checkpoint.downloadedPaths).length });
      const downloadedPaths = await downloadSunoTracksToFolder(checkpoint.selectedTracks, downloadFolder, downloadFormat, planningRun?.signal || downloadAbortController.signal, evaluationRunId, {
        existingPaths: checkpoint.downloadedPaths,
        sourceWavPaths,
        onTrackDownloaded: async (songId, filePath) => {
          checkpoint.downloadedPaths[songId] = filePath;
          await writeMusicDownloadCheckpoint(checkpoint);
          report.progress({ phase: RT_SERVER.EXPORTED, expected: checkpoint.selectedTracks.length, message: `${RT_SERVER.DA_XUAT}${Object.keys(checkpoint.downloadedPaths).length}${RT_SHARED.SYMBOL_8A5EDA}${checkpoint.selectedTracks.length}${RT_SERVER.BAN_NHAC}` });
        },
      });
      if (downloadedPaths.length !== checkpoint.selectedTracks.length) throw createAppError(SUNO_AUTOMATION_TEXTS.CURATED_DOWNLOAD_COUNT_MISMATCH_ERR);
      const durations = await Promise.all(_.map(downloadedPaths, readMediaDurationSeconds));
      await writeSunoCuratedLog(SOURCE_TEXT_SELECTED_TRACKS_DURATIONS_CHECKED, { evaluationRunId, trackCount: durations.length, invalidCount: _.filter(durations, (duration) => !_.isFinite(duration) || duration <= 0).length });
      if (_.some(durations, (durationSeconds) => !_.isFinite(durationSeconds) || durationSeconds <= 0)) throw createAppError(SUNO_AUTOMATION_TEXTS.AUDIO_DURATION_INVALID_ERR);
      let cumulativeSeconds = 0;
      const curatedTracks = _.map(checkpoint.selectedTracks, (track, index) => {
        const durationSeconds = durations[index] || 0;
        const result = { songId: track.songId, title: _.trim(track.title).replace(SUNO_AUTOMATION_PATTERNS.LEADING_INDEX, C.EMPTY), qualityScore: track.qualityScore, durationSeconds, startSeconds: cumulativeSeconds };
        cumulativeSeconds += durationSeconds;
        return result;
      });
      await writeSunoCuratedLog(SUNO_AUTOMATION_CONFIG.EVENT_REQUEST_COMPLETED, { evaluationRunId, folderPath: downloadFolder, expectedDownloadCount: checkpoint.selectedTracks.length, downloadedCount: downloadedPaths.length, curatedTracks, success: true });
      await deleteMusicDownloadCheckpoint(checkpoint.key);
      await deleteMusicEvaluationCheckpoint(checkpoint.key);
      await deleteMusicEvaluationAudio(audioCacheKey).catch(() => undefined);
      await deleteMusicEvaluationAudio(checkpoint.key).catch(() => undefined);
      return report.finish({ success: true, downloadedPaths, curatedTracks, downloadedTracks: curatedTracks });
    };
    if (shouldEvaluateTracks) {
      if (!_.isEqual(evaluationMode, AiPlanningExecutionMode.RoomOnly) || !_.isEqual(evaluationProvider, AiPlanningFallbackProvider.GeminiChat) || _.isEmpty(evaluationProjectId)) {
        throw createAppError(SUNO_AUTOMATION_TEXTS.TRACK_EVALUATION_ROOM_REQUIRED_ERR);
      }
      const savedCheckpoint = await readMusicDownloadCheckpoint(checkpointKey, candidateIds);
      if (savedCheckpoint) {
        downloadAbortController.signal.throwIfAborted();
        planningRun = beginChatPlanningRun(evaluationRunId, Date.now(), SUNO_AUTOMATION_CONFIG.TRACK_EVALUATION_WORKER_ID, AiPlanningFallbackProvider.GeminiChat);
        await writeSunoCuratedLog(SOURCE_TEXT_EVALUATION_CHECKPOINT_RESUMED, { evaluationRunId, trackCount: savedCheckpoint.selectedTracks.length, downloadedCount: _.keys(savedCheckpoint.downloadedPaths).length });
        return await finishCuratedDownload(savedCheckpoint);
      }
      downloadAbortController.signal.throwIfAborted();
      planningRun = beginChatPlanningRun(evaluationRunId, Date.now(), SUNO_AUTOMATION_CONFIG.TRACK_EVALUATION_WORKER_ID, AiPlanningFallbackProvider.GeminiChat);
      const trackPairs = _.chunk(tracks, 2);
      if (_.some(trackPairs, (pair) => _.size(pair) < 2)) throw createAppError(SUNO_AUTOMATION_TEXTS.GENERATION_FAILED_ERR);
      const pairChunks = _.chunk(trackPairs, SUNO_AUTOMATION_CONFIG.EVALUATION_SONGS_PER_CHUNK);
      evaluationWorkerIds = _.map(pairChunks, (_pairChunk, chunkIndex) => SOURCE_TEMPLATE_CHUNK(SOURCE_TEMPLATE_SYMBOL_86(`${SUNO_AUTOMATION_CONFIG.TRACK_EVALUATION_WORKER_ID}`), SOURCE_TEMPLATE_SYMBOL_86(`${chunkIndex + 1}`)));
      await writeSunoCuratedLog(SUNO_AUTOMATION_CONFIG.EVENT_TRACKS_READY, { evaluationRunId, trackCount: tracks.length, songCount: trackPairs.length, chunkCount: pairChunks.length });
      const groupsByChunk = _.map(pairChunks, (pairChunk) => _.map(pairChunk, (pair) => ({ title: _.trim(pair[0].title.replace(SUNO_AUTOMATION_PATTERNS.TRACK_VARIANT_SUFFIX, C.EMPTY)), candidates: _.map(pair, SOURCE_TEXT_SONGID) })));
      const savedEvaluation = await readMusicEvaluationCheckpoint(checkpointKey, candidateIds);
      const cachedTrackChunks = groupsByChunk.map((groups) => getMusicEvaluationChunkSelections(groups, savedEvaluation));
      const pendingGroupsByChunk = groupsByChunk.filter((_groups, index) => !cachedTrackChunks[index]);
      const pendingTrackCount = _.sumBy(pendingGroupsByChunk, (groups) => _.sumBy(groups, (group) => group.candidates.length));
      await writeSunoCuratedLog(SOURCE_TEXT_EVALUATION_AUDIO_PREPARATION_STARTED, { evaluationRunId, chunkCount: pendingGroupsByChunk.length, trackCount: pendingTrackCount });
      report.progress({ phase: RT_SERVER.PREPARING, expected: pendingTrackCount, ready: 0, message: pendingTrackCount ? RT_MUSIC.PREPARING_ALL_AUDIO : MUSIC_RECOVERY.ALL_SELECTIONS_READY });
      const preparationStarted = Date.now();
      const evaluationAudio = await downloadSunoEvaluationAudio(
        _.flatMap(pendingGroupsByChunk, (groups) => _.flatMap(groups, SOURCE_TEXT_CANDIDATES)),
        audioCacheKey,
        planningRun.signal,
        true,
        (ready) => report.progress({ phase: RT_SERVER.PREPARING, expected: pendingTrackCount, ready, message: RT_MUSIC.PREPARING_ALL_AUDIO }),
      );
      planningRun.signal.throwIfAborted();
      await writeSunoCuratedLog(SOURCE_TEXT_EVALUATION_AUDIO_READY, { evaluationRunId, trackCount: evaluationAudio.size, elapsedMs: Date.now() - preparationStarted });
      report.progress({ phase: RT_SERVER.PREPARING, expected: pendingTrackCount, ready: evaluationAudio.size, message: pendingTrackCount ? RT_MUSIC.ALL_AUDIO_READY : MUSIC_RECOVERY.ALL_SELECTIONS_READY });
      const evaluationSlots = new AsyncTaskLimiter(chatRoomLanes(currentChatPolicy()));
      const evaluationResults = await Promise.allSettled(
        _.map(groupsByChunk, async (groups, chunkIndex) => {
          const roomProgress = (progress: Omit<MusicDownloadProgress, "room" | "rooms">) => report.progress({ ...progress, room: chunkIndex + 1, rooms: groupsByChunk.length });
          const expected = _.sumBy(groups, (group) => group.candidates.length);
          const cachedTracks = cachedTrackChunks[chunkIndex];
          if (cachedTracks) {
            roomProgress({ phase: RT_SHARED.EVALUATED, expected, message: MUSIC_RECOVERY.SELECTION_RESUMED });
            await writeSunoCuratedLog(MUSIC_RECOVERY.SELECTION_RESUMED_EVENT, { evaluationRunId, chunk: chunkIndex + 1, selectedTrackCount: cachedTracks.length });
            return cachedTracks;
          }
          roomProgress({ phase: RT_SHARED.QUEUED, expected, message: RT_SERVER.DANG_CHO_LUOT_MO_PHONG_DANH_GIA });
          const releaseEvaluation = await evaluationSlots.acquire(planningRun.signal);
          let evaluationStarted = false;
          let selectedTracks: Awaited<ReturnType<typeof selectProfessionalSunoTracks>>;
          try {
            planningRun.signal.throwIfAborted();
            roomProgress({ phase: RT_SERVER.PREPARING, expected, message: RT_MUSIC.OPENING_EVALUATION_ROOM });
            await prepareMusicEvaluationRoom(
              { provider: AiPlanningFallbackProvider.GeminiChat, model: req.body?.aiExecution?.model, prompt: C.EMPTY, projectId: evaluationProjectId, workerId: evaluationWorkerIds[chunkIndex], chromeHeadless: false, signal: planningRun.signal, allowDefaultGeminiModel: true, onUploadProgress: (progress) => roomProgress({ ...progress, expected }) },
              async (error, attempt) => {
                roomProgress({ phase: MUSIC_RECOVERY.RETRY_PHASE, expected, attempt, message: MUSIC_RECOVERY.ROOM_RETRY });
                await writeSunoCuratedLog(MUSIC_RECOVERY.ROOM_RETRY_EVENT, { evaluationRunId, chunk: chunkIndex + 1, attempt, ...musicErrorDetails(error) });
              },
            );
            await writeSunoCuratedLog(SOURCE_TEXT_EVALUATION_ROOM_READY, { evaluationRunId, chunk: chunkIndex + 1, workerId: evaluationWorkerIds[chunkIndex] });
            await writeSunoCuratedLog(SUNO_AUTOMATION_CONFIG.EVENT_CHUNK_EVAL_STARTED, { evaluationRunId, chunk: chunkIndex + 1, songs: groups.length, candidateTracks: expected });
            evaluationStarted = true;
            selectedTracks = await selectProfessionalSunoTracks(groups, _.trim(_.toString(req.body?.style)), { projectId: evaluationProjectId, workerId: evaluationWorkerIds[chunkIndex], model: req.body?.aiExecution?.model, signal: planningRun.signal, onUploadProgress: roomProgress }, evaluationAudio, req.body?.styleAnalysis);
            await saveMusicEvaluationSelections(checkpointKey, candidateIds, selectedTracks);
            await writeSunoCuratedLog(MUSIC_RECOVERY.SELECTION_SAVED_EVENT, { evaluationRunId, chunk: chunkIndex + 1, selectedTrackCount: selectedTracks.length });
          } catch (error) {
            roomProgress({ phase: RT_SHARED.EVALUATION_FAILED, expected, message: error instanceof Error ? error.message : String(error) });
            if (!evaluationStarted) await writeSunoCuratedLog(SOURCE_TEXT_EVALUATION_ROOM_FAILED, { evaluationRunId, chunk: chunkIndex + 1, ...musicErrorDetails(error) });
            throw error;
          } finally {
            await closeChatPlanningRoom({ provider: AiPlanningFallbackProvider.GeminiChat, projectId: evaluationProjectId, workerId: evaluationWorkerIds[chunkIndex] }).catch(() => undefined);
            releaseEvaluation();
          }
          roomProgress({ phase: RT_SHARED.EVALUATED, expected, message: `${RT_SHARED.DA_CHON}${selectedTracks.length}${RT_SERVER.BAN_NHAC}` });
          await writeSunoCuratedLog(SUNO_AUTOMATION_CONFIG.EVENT_CHUNK_EVAL_COMPLETED, { evaluationRunId, chunk: chunkIndex + 1, selectedTrackCount: selectedTracks.length, selectedTrackIds: _.map(selectedTracks, SOURCE_TEXT_SONGID), qualityScores: _.map(selectedTracks, SOURCE_TEXT_QUALITYSCORE) });
          return selectedTracks;
        }),
      );
      const rejectedEvaluation = _.find(evaluationResults, (result) => _.isEqual(result.status, SOURCE_TEXT_REJECTED)) as PromiseRejectedResult | undefined;
      if (rejectedEvaluation) throw rejectedEvaluation.reason;
      const selectedTrackChunks = _.map(evaluationResults, (result) => (result as PromiseFulfilledResult<Array<{ songId: string; title: string; qualityScore: number }>>).value);
      const evaluatedTracks = _.flatten(selectedTrackChunks);
      const globallyRankedTracks = _.orderBy(evaluatedTracks, [SOURCE_TEXT_QUALITYSCORE], [SOURCE_TEXT_DESC]);
      const selectedTracksForDownload = _.map(globallyRankedTracks, (track, rank) => ({ songId: track.songId, title: SOURCE_TEMPLATE_SYMBOL_6(SOURCE_TEMPLATE_SYMBOL_86(`${_.padStart(_.toString(rank + 1), 2, SOURCE_TEXT_0)}`), SOURCE_TEMPLATE_SYMBOL_86(`${_.trim(track.title).replace(SUNO_AUTOMATION_PATTERNS.LEADING_INDEX, C.EMPTY)}`)), qualityScore: track.qualityScore }));
      if (!_.isEqual(selectedTracksForDownload.length, trackPairs.length) || !_.isEqual(_.uniq(_.map(selectedTracksForDownload, SOURCE_TEXT_SONGID)).length, trackPairs.length)) {
        throw createAppError(SUNO_AUTOMATION_TEXTS.CURATED_EVALUATION_COUNT_MISMATCH_ERR);
      }
      await writeSunoCuratedLog(SUNO_AUTOMATION_CONFIG.EVENT_ALL_EVALS_COMPLETED, { evaluationRunId, expectedSelectionCount: trackPairs.length, selectedTrackCount: selectedTracksForDownload.length, selectedTrackIds: _.map(selectedTracksForDownload, SOURCE_TEXT_SONGID), qualityScores: _.map(selectedTracksForDownload, SOURCE_TEXT_QUALITYSCORE) });
      await closeEvaluationRooms();
      const checkpoint: MusicDownloadCheckpoint = { version: 2, key: checkpointKey, candidateIds, selectedTracks: selectedTracksForDownload as MusicDownloadSelection[], folderPath: downloadFolder, format: downloadFormat, downloadedPaths: {}, sourceWavRequired: true, updatedAt: Date.now() };
      await writeMusicDownloadCheckpoint(checkpoint);
      await writeSunoCuratedLog(SOURCE_TEXT_EVALUATION_CHECKPOINT_SAVED, { evaluationRunId, selectedTrackCount: selectedTracksForDownload.length });
      return await finishCuratedDownload(checkpoint);
    }
    const format = _.toLower(_.trim(_.toString(req.body?.format))) as typeof SUNO_AUTOMATION_CONFIG.FORMAT_MP3 | typeof SUNO_AUTOMATION_CONFIG.FORMAT_WAV;
    let sourceWavPaths: Record<string, string> | undefined;
    if (req.body?.maxTracks !== 1) {
      await downloadSunoEvaluationAudio(candidateIds, audioCacheKey, downloadAbortController.signal, false);
      sourceWavPaths = {};
      for (const track of tracks) {
        const wavPath = await readMusicEvaluationWav(audioCacheKey, track.songId);
        if (!wavPath) throw createAppError(SUNO_AUTOMATION_TEXTS.DOWNLOAD_TRACK_FAILED_ERR);
        sourceWavPaths[track.songId] = wavPath;
      }
    }
    const downloadedPaths = await downloadSunoTracksToFolder(tracks, _.toString(req.body?.folderPath), format, downloadAbortController.signal, evaluationRunId, sourceWavPaths ? { sourceWavPaths } : undefined);
    await writeSunoCuratedLog(SUNO_AUTOMATION_CONFIG.EVENT_REQUEST_COMPLETED, { evaluationRunId, trackCount: downloadedPaths.length, format, folderPath: _.toString(req.body?.folderPath), success: true });
    return report.finish({ success: true, downloadedPaths, downloadedTracks: tracks });
  } catch (error) {
    await writeSunoCuratedLog(SUNO_AUTOMATION_CONFIG.EVENT_REQUEST_FAILED, { evaluationRunId, ...musicErrorDetails(error) });
    return report.finish({ success: false, error: _.toString(_.get(error, SOURCE_TEXT_MESSAGE, SUNO_AUTOMATION_TEXTS.DOWNLOAD_TRACK_FAILED_ERR)) }, HttpStatus.BAD_REQUEST);
  } finally {
    res.off(RT_SERVER.CLOSE, connectionClosed);
    planningRun?.complete();
    if (shouldEvaluateTracks && !_.isEmpty(evaluationProjectId)) {
      await closeEvaluationRooms();
    }
  }
});
router.post(ROUTER_PATHS.MUSIC_SUNO_LOGIN, async (_req: Request, res: Response) => {
  try {
    return res.json({ success: true, ...(await launchSunoLoginBrowser()) });
  } catch (error) {
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ success: false, error: _.toString(_.get(error, SOURCE_TEXT_MESSAGE, SUNO_AUTOMATION_TEXTS.CHROME_LOGIN_FAILED_ERR)) });
  }
});
export default router;
