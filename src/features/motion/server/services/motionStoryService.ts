import * as COMMON_RUNTIME from "../../../../constants/sourceText.js";
import { RUNTIME_TEXT as RT_SERVER } from "../../../../constants/runtime/server.js";
import { RUNTIME_TEXT as RT_SHARED } from "../../../../constants/runtime/shared.js";
import { motionStoryEventLedger } from "../../../../lib/motionStoryContinuity.js";
import { motionChapterRanges, motionChapterKeyPoints, motionChapterContentBeats, motionMergeShortChapters } from "../../../../lib/motionStoryTimeline.js";
import { motionMotifsLost } from "../../../../lib/motionGenreStage.js";
import { motionScriptFindings } from "../../../../lib/motionScriptFindings.js";
import { MOTION_GENRE_STAGE } from "../../../../constants/motionGenreStage.js";
import { MOTION_STORY_TIMELINE as TIMELINE } from "../../../../constants/motionStoryTimeline.js";
import { motionCleanLook, motionAnalysisGroups } from "../../../../lib/motionCastIdentity.js";
import { closeMotionJsonContainers } from "../../../../lib/motionJsonRecovery.js";
import { parseRemotionAssetReply } from "../../../../lib/motionVectorAsset.js";
import { MOTION_PRODUCTION } from "../../../../constants/motionProduction.js";
import { MOTION_QA as QA } from "../../../../constants/motionQa.js";
import { MOTION_EDITORIAL_POLICY as EDITORIAL_POLICY } from "../../../../constants/motionEditorialPolicy.js";
import { MOTION_CHAPTER_REPAIR as CHAPTER_REPAIR } from "../../../../constants/motionChapterRepair.js";
import { mergeMotionChapterDraft, motionChapterPending, motionChapterRepairPrompt, motionChapterResponseIssues, normalizeMotionDurationResponse } from "../../../../lib/motionChapterRepair.js";
import { repairMotionChapterSpeech } from "../../../../lib/motionChapterSpeech.js";
import { MOTION_PROMPT as PROMPT } from "../../../../constants/motionPrompt.js";
import { closedPuppetPackId } from "./puppet/packPolicy.js";
import { motionVisualCapability } from "../../../../lib/motionVisual.js";
import type { MotionVisualSettings } from "../../../../types/motionVisual.js";
import { motionPromptGroups, motionPromptMeasurement, motionPromptBudget, motionPromptEditorialContext, motionPromptSingleMessage } from "../../../../lib/motionPrompt.js";
import { motionChapterParts } from "../../../../lib/motionChapterParts.js";
import { motionTaskCheckpoint } from "./motionTaskCheckpoint.js";
import { motionInputKey } from "./motionFileUtils.js";
import type { MotionChapterDraft } from "../../../../types/motionVideo.js";
import { motionSourceChunks } from "../../../../lib/motionSourceChunks.js";
import { compactMotionSourceLedger, parseMotionSourceLedgerPart, type MotionSourceLedgerDraft, type MotionSourceLedgerNode } from "../../../../lib/motionSourceLedger.js";
import { MOTION_EDITORIAL } from "../../../../constants/motionEditorial.js";
import { motionStoryLanguageGuide } from "../../../../constants/motionStoryLanguage.js";
import { MotionProviderRecovery, waitMotionProviderCooldown } from "./motionProviderRecovery.js";
import { requestMotionAiContract, recoverMotionAiContractState, type MotionAiResponseContract } from "./motionAiContractService.js";
import { MOTION_CAPTCHA_PROBE } from "../../../../constants/motionStoryFields.js";
import { expandInitialCastNames, fullCastNames } from "../../../../lib/motionCastNames.js";
import { MOTION_CAST_NAMES } from "../../../../constants/motionCastNames.js";
import { MOTION_AUDIO_DIRECTION } from "../../../../constants/motionAudioDirection.js";
import { motionMusicMoodKey as musicMoodOf } from "../../../../lib/motionMusic.js";
import { MOTION_PATTERNS as MP } from "../../../../constants/motionPatterns.js";
import { STUDIO_RUNTIME as XRT } from "../../../../constants/studioRuntime.js";
import { CHAT_PLANNING_RUNTIME as C } from "../../../../constants/chatPlanningRuntime.js";
import { MOTION_QA_MESSAGES, MOTION_REFERENCE_CONFIG, MOTION_REFERENCE_PROMPTS } from "../../../../constants/motionReference.js";
import { normalizeMotionReferenceStyle } from "../../../../lib/motionReference.js";
import { MOTION_VOICE } from "../../../../constants/motionVoice.js";
import { normalizeMotionSceneMood, normalizeMotionUtterances, normalizeMotionNarratorSpeakers, motionNarratorCastKey, motionNarratorLines } from "../../../../lib/motionVoice.js";
import { motionAudioDirection } from "../../../../lib/motionAudioDirection.js";
import { MOTION_AI_FALLBACK, MOTION_AI_ROLE } from "../../../../constants/motionAiFallback.js";
import { MOTION_CAPTCHA } from "../../../../constants/motionCaptcha.js";
import { SOURCE_TEXT_DOMCONTENTLOADED } from "../../../../constants/sourceText.js";
import { puppetTags } from "../../../../lib/motionPuppet.js";
import { cleanCharacterColors } from "../../../../lib/motionCharacterVariant.js";
import type { MotionStyleReference } from "../../../../types/motionVideo.js";
import * as MR from "../../../../constants/motionRuntime.js";
import { AsyncLocalStorage } from "async_hooks";
import { randomUUID } from "crypto";
import fs from "fs";
import { normalizeMotionHud } from "../../../../lib/motionHistory.js";
import { motionVideoGenreEditorProfile, motionVideoGenre, motionVideoGenreDirective, motionVideoGenreStageRule, motionVideoGenreStages, motionVideoGenreStyleGuide, motionVideoGenreWritingProfile, type MotionVideoGenre } from "../../../../constants/motionGenre.js";
import { MOTION_MUSIC, MOTION_MUSIC_MOODS } from "../../../../constants/motionMusic.js";
import { MOTION_GENRE_STYLE } from "../../../../constants/motionGenreStyle.js";
import _ from "lodash";
import { puppetPackPlanningCapabilities, puppetPackChapterCapabilities } from "./puppet/packCatalog.js";
import path from "path";
import { CINEMATIC_CHAT_MODEL_OPTIONS, CINEMATIC_CHAT_PLANNING_CONFIG } from "../../../../constants/index.js";
import { MOTION_GEN_ANALYSIS_PROMPT, MOTION_GEN_CHAPTER_PROMPT, MOTION_GEN_LOOKS, MOTION_GEN_PREAMBLE, MOTION_GEN_STORYBOARD_RULES, MOTION_SERIES_PROMPT } from "../../../../constants/motionGenPrompts.js";
import { motionAnalysisResponseErrors, motionAnalysisRepairDraft, motionAnalysisRepairPrompt, normalizeMotionAnalysisResponse } from "../../../../lib/motionAnalysisResponse.js";
import { withMotionResponsePrompt } from "../../../../lib/motionResponseContract.js";
import { MOTION_RESPONSE_SCHEMAS, MOTION_RESPONSE_TEXT, MOTION_RESPONSE_VALUES } from "../../../../constants/motionResponseContract.js";
import { requestMotionEditorResponse } from "../../../../lib/motionEditorResponse.js";
import {
  MOTION_TEMPLATE_2_2,
  MOTION_TEMPLATE_AI_TRA_LOI_KHONG_PHAI_JSON,
  MOTION_TEMPLATE_ARTIFACTTYPE_REQUESTID,
  MOTION_TEMPLATE_C_2,
  MOTION_TEMPLATE_CHAN_DOAN_PHONG_CHAT_PHAN_HOI_KY_TU,
  MOTION_TEMPLATE_CHUONG,
  MOTION_TEMPLATE_CHUONG_LOI_THU_LAI,
  MOTION_TEMPLATE_CONTINUE_NATURALLY_FROM_THE_PREVIOUS_CHAPTER_WHICH_ENDED_2,
  MOTION_TEMPLATE_DOM_TXT,
  MOTION_TEMPLATE_GUI_YEU_CAU_TOI_PHONG_CHAT_AI_CAU,
  MOTION_TEMPLATE_JSON,
  MOTION_TEMPLATE_MANDATORY_OUTPUT_RETURN_EXACTLY_ONE_VALID_JSON_OBJECT,
  MOTION_TEMPLATE_PHONG_CHAT_AI_KHONG_TRA_KET_QUA_SAU,
  MOTION_TEMPLATE_PHONG_CHAT_LOI,
  MOTION_TEMPLATE_PNG,
  MOTION_TEMPLATE_SYMBOL_11,
  MOTION_TEMPLATE_SYMBOL_21,
  MOTION_TEMPLATE_SYMBOL_5,
  MOTION_TEMPLATE_SYMBOL_53,
  MOTION_TEMPLATE_SYMBOL_55,
  MOTION_TEXT_0,
  MOTION_TEXT_1_2,
  MOTION_TEXT_ABORT,
  MOTION_TEXT_ACTION,
  MOTION_TEXT_AI_DEBUG,
  MOTION_TEXT_AI_KHONG_TRA_VE_JSON_HOP_LE,
  MOTION_TEXT_APPLICATION_JSON,
  MOTION_TEXT_ARTIFACTTYPE,
  MOTION_TEXT_BASE64,
  MOTION_TEXT_BUTTON_ARIA_LABEL_GUI_I,
  MOTION_TEXT_BUTTON_ARIA_LABEL_SEND_I,
  MOTION_TEXT_BUTTON_ARIA_LABEL_STOP_I,
  MOTION_TEXT_C1,
  MOTION_TEXT_CAU_CHUYEN,
  MOTION_TEXT_CHUONG_KHONG_CO_BEAT_NAO_2,
  MOTION_TEXT_CO,
  MOTION_TEXT_CONTENTEDITABLE_TRUE,
  MOTION_TEXT_D,
  MOTION_TEXT_D_2,
  MOTION_TEXT_DAY,
  MOTION_TEXT_DIAGNOSTICS,
  MOTION_TEXT_EN,
  MOTION_TEXT_ENGLISH,
  MOTION_TEXT_FEMALE,
  MOTION_TEXT_FFB070,
  MOTION_TEXT_FUNCTION,
  MOTION_TEXT_GOI_AI_QUA_API,
  MOTION_TEXT_ID_MODEL_RESPONSE_MESSAGE_CONTENT,
  MOTION_TEXT_KEY,
  MOTION_TEXT_KHONG,
  MOTION_TEXT_KHONG_TIM_THAY_NOI_DUNG_TRANSCRIPT_HOP_LE,
  MOTION_TEXT_MAIN_PLACE,
  MOTION_TEXT_MALE,
  MOTION_TEXT_MARKDOWN,
  MOTION_TEXT_MEDIUM,
  MOTION_TEXT_MESSAGE_CONTENT,
  MOTION_TEXT_MODEL_RESPONSE,
  MOTION_TEXT_MODEL_RESPONSE_TEXT,
  MOTION_TEXT_NOI_DUNG_CAU_CHUYEN_QUA_NGAN,
  MOTION_TEXT_NONE,
  MOTION_TEXT_NV,
  MOTION_TEXT_OK,
  MOTION_TEXT_PHONG_CHAT_DA_TRA_JSON_DAY_DU_NHUNG,
  MOTION_TEXT_RICH_TEXTAREA,
  MOTION_TEXT_ROLE_ALERT,
  MOTION_TEXT_ROOMPAGE,
  MOTION_TEXT_SCENE,
  MOTION_TEXT_SYMBOL_13,
  MOTION_TEXT_SYMBOL_27,
  MOTION_TEXT_SYMBOL_30,
  MOTION_TEXT_SYMBOL_35,
  MOTION_TEXT_SYMBOL_36,
  MOTION_TEXT_SYMBOL_47,
  MOTION_TEXT_SYMBOL_49,
  MOTION_TEXT_SYMBOL_50,
  MOTION_TEXT_SYMBOL_51,
  MOTION_TEXT_TEXT,
  MOTION_TEXT_TOON_CAT_INTERIOR,
  MOTION_TEXT_UNCERTAIN,
  MOTION_TEXT_USER,
  MOTION_TEXT_USER_QUERY,
  MOTION_TEXT_UTF8,
  MOTION_TEXT_VIETNAMESE,
  MOTION_TEXT_VIETNAMESE_SYLLABLES_WORDS,
  MOTION_TEXT_WORDS,
  MOTION_TEXT_WRONG,
} from "../../../../constants/motionRuntime.js";
import { MOTION_STORY_CONFIG, MOTION_STORY_LENGTH_SECONDS } from "../../../../constants/motionVideo.js";
import { parseJson, stringifyJson } from "../../../../lib/jsonStringify.js";
import { productionPreamble } from "../../../../lib/motionDirection.js";
import { normalizeCreativeBlueprint } from "../../../../lib/motionCreativeBlueprint.js";
import { normalizeScenePlan, normalizeVideoDna, scenePlanErrors, videoDnaSourceKey } from "../../../../lib/motionVideoDna.js";
import { quoteErrors, SOURCE_READING_RULES, transcriptIndex, unattributeUnverifiedQuotes } from "../../../../lib/motionSourceClean.js";
import { getMotionErrorMessage, normalizeMotionText } from "../../../../lib/motionUtils.js";
import { AiPlanningChatModel, AiPlanningExecutionMode, AiPlanningFallbackProvider } from "../../../../types.js";
import { parseClaudeChatModel } from "../../../../constants/claudeChatModels.js";
import { GEMINI_MODEL_ENCODING, parseGeminiChatModel } from "../../../../constants/geminiChatModels.js";
import { DEEPSEEK_CHAT_CONFIG, DEEPSEEK_CHAT_MODES } from "../../../../constants/deepseekChat.js";
import { CHAT_UI_AUTOMATION_MESSAGES } from "../../../../constants/messages.js";
import { MotionStoryLength, type MotionAiExecution, type MotionBeat, type MotionCastMember, type MotionChapter, type MotionPlace, type MotionStoryAnalysis, type MotionStorySource, type MotionVideoDnaSettings } from "../../../../types/motionVideo.js";
import { beginChatPlanningRun, closeChatBrowserIfIdle, closeChatPlanningRoom, closeChatPlanningRoomsForProject, generatePlanningWithChatUi, getChatPlanningRoom, prepareChatPlanningRoom, reloadChatPlanningRoom, resumeChatPlanningResponse } from "../../../../server/services/chatUiPlanningService.js";
import { exhaustedMotionRoom, isChatAttachmentError, isFinalChatResponseError, isMotionContentResponseError, isTerminalMotionAiError, uncertainChatSubmission, type ChatPlanningSubmission } from "../../../../server/services/chatSubmissionRecovery.js";
import { MOTION_AI_RECOVERY as AIR } from "../../../../constants/motionAiRecovery.js";
import type { MotionAiLog } from "../../../../types/motionVideo.js";
import { generateContentWithRetry } from "../../../../server/services/geminiService.js";
import { cancelGlobalBrowserCleanup, retainGlobalBrowser } from "../../../../server/services/imageGeneratorService.js";
import { MotionAiWorkerPool } from "./motionAiWorkerPool.js";
import { MotionAiRoomPool } from "./motionAiRoomPool.js";
import { MOTION_BROWSER_HANDOFF, MOTION_BROWSER_NOT_RELEASED_ERROR } from "../../../../constants/browserLifecycle.js";
import { MotionBrowserLifecycle, waitForMotionBrowser } from "../../../../lib/motionBrowserLifecycle.js";
import { getMotionRootDirectory } from "./motionLibraryService.js";
import { getLogsDirectory } from "../../../../server/utils/paths.js";
import { AiTaskCapability } from "../../../../server/services/taskRouterService.js";
import { MOTION_SFX_MOODS } from "../../../../constants/motionAudio.js";
const TIMESTAMP_RE = MP.TRANSCRIPT_TIME;
const NOISE_RE = MP.TRANSCRIPT_SOUND;
const toSeconds = (a: string, b: string, c?: string): number => (c ? _.toNumber(a) * 3600 + _.toNumber(b) * 60 + _.toNumber(c) : _.toNumber(a) * 60 + _.toNumber(b));
const cleanText = (s: string): string => _.trim(s.replace(NOISE_RE, MOTION_TEXT_SYMBOL_13).replace(MP.WHITESPACE_GLOBAL, MOTION_TEXT_SYMBOL_13).replace(MP.SPACE_BEFORE_PUNCTUATION, MOTION_TEXT_1_2));
export const parseStorySource = (raw: string): MotionStorySource => {
  const input = _.toString(raw).replace(MP.CARRIAGE_RETURN, MOTION_TEXT_SYMBOL_27);
  if (_.trim(input).length < 10) throw new Error(MOTION_TEXT_NOI_DUNG_CAU_CHUYEN_QUA_NGAN);
  const transcriptIdx = input.search(MP.TRANSCRIPT_HEADER);
  const head = transcriptIdx >= 0 ? input.slice(0, transcriptIdx) : input.slice(0, Math.min(input.length, 400));
  const body = transcriptIdx >= 0 ? input.slice(transcriptIdx).replace(MP.FIRST_LINE, MR.MOTION_TEXT_EMPTY) : input;
  const headLines = _.compact(_.map(head.split(MOTION_TEXT_SYMBOL_27), _.trim));
  const url = _.find(headLines, (l) => MP.URL_START.test(l)) || (input.match(MP.URL_CASE_SENSITIVE) || [])[0];
  const titleLine = _.find(headLines, (l) => !MP.URL_START.test(l) && !MP.TRANSCRIPT_TIME_START.test(l)) || MOTION_TEXT_CAU_CHUYEN;
  const title = _.trim(titleLine.replace(MP.YOUTUBE_SUFFIX, MR.MOTION_TEXT_EMPTY));
  const segments: { t: number; text: string }[] = [];
  const matches = [...body.matchAll(TIMESTAMP_RE)];
  if (matches.length) {
    matches.forEach((m, i) => {
      const startIdx = (m.index || 0) + m[0].length;
      const endIdx = i + 1 < matches.length ? matches[i + 1].index || body.length : body.length;
      const text = cleanText(body.slice(startIdx, endIdx));
      if (text) segments.push({ t: toSeconds(m[1], m[2], m[3]), text });
    });
  } else {
    const text = cleanText(
      transcriptIdx >= 0
        ? body
        : input
            .split(MOTION_TEXT_SYMBOL_27)
            .filter((line) => !MP.URL_LINE.test(line))
            .join(MOTION_TEXT_SYMBOL_13),
    );
    if (text) segments.push({ t: 0, text });
  }
  const text = _.map(segments, MOTION_TEXT_TEXT).join(MOTION_TEXT_SYMBOL_13);
  const words = _.size(_.compact(text.split(MP.WHITESPACE)));
  if (words < 3) throw new Error(MOTION_TEXT_KHONG_TIM_THAY_NOI_DUNG_TRANSCRIPT_HOP_LE);
  const lastT = _.last(segments)?.t || 0;
  const lastWords = _.size(_.compact((_.last(segments)?.text || MR.MOTION_TEXT_EMPTY).split(MP.WHITESPACE)));
  const sourceSeconds = matches.length ? Math.round(lastT + lastWords / 2.6) : Math.round(words / 2.6);
  return { kind: matches.length || transcriptIdx >= 0 ? MR.MOTION_TEXT_TRANSCRIPT_2 : MR.MOTION_TEXT_BRIEF, title, url, text, segments, words, sourceSeconds };
};
export const resolveTargetSeconds = (source: MotionStorySource, length: MotionStoryLength): number => {
  const seconds = MOTION_STORY_LENGTH_SECONDS[length];
  if (seconds !== undefined) {
    if (source.kind === MR.MOTION_TEXT_BRIEF || length === MotionStoryLength.SHORT || length === MotionStoryLength.ONE) return seconds;
    return Math.min(seconds, seconds > 600 ? Math.max(300, source.sourceSeconds) : source.sourceSeconds);
  }
  return Math.max(60, source.sourceSeconds);
};
const formatTs = (s: number) => MOTION_TEMPLATE_SYMBOL_11(String(Math.floor(s / 60)), String(String(Math.floor(s % 60)).padStart(2, MOTION_TEXT_0)));
const sourceSlice = (source: MotionStorySource, from?: number, to?: number): string => {
  if (!source.segments?.length) return source.text || MR.MOTION_TEXT_EMPTY;
  const a = from ?? 0,
    b = to ?? Infinity;
  const picked = _.filter(source.segments, (s) => s.t >= a - 0.5 && s.t < b);
  const before = _.filter(source.segments, (s) => s.t < b);
  const nearest = before.length ? [_.last(before)!] : [source.segments[0]];
  return _.map(_.isEmpty(picked) ? nearest : picked, (s) => MOTION_TEMPLATE_SYMBOL_21(String(formatTs(s.t)), String(s.text))).join(MOTION_TEXT_SYMBOL_27);
};
export const extractJson = (raw: string): any => {
  const text = _.trim(_.toString(raw)).replace(MP.JSON_FENCE_START, MR.MOTION_TEXT_EMPTY).replace(MP.JSON_FENCE_END, MR.MOTION_TEXT_EMPTY);
  try {
    return parseJson(text);
  } catch {
    const vector = parseRemotionAssetReply(text);
    if (vector !== undefined) return vector;
    const a = text.indexOf(MOTION_TEXT_SYMBOL_35),
      b = text.lastIndexOf(MOTION_TEXT_SYMBOL_36);
    if (a >= 0 && b > a) {
      try {
        return parseJson(text.slice(a, b + 1));
      } catch {}
    }
    const starts = _.filter(_.range(text.length), (i) => text.startsWith(MOTION_TEXT_ARTIFACTTYPE, i));
    for (const start of _.reverse(starts.length ? starts : a >= 0 ? [a] : [])) {
      const repaired = closeJson(text.slice(start));
      if (repaired == null) continue;
      try {
        return parseJson(repaired);
      } catch {}
    }
    throw new Error(MOTION_TEXT_AI_KHONG_TRA_VE_JSON_HOP_LE);
  }
};
const closeJson = (raw: string): string | null => {
  const stack: string[] = [];
  let inString = false,
    escaped = false,
    end = -1;
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === MOTION_TEXT_SYMBOL_49) escaped = true;
      else if (ch === MOTION_TEXT_SYMBOL_47) inString = false;
      continue;
    }
    if (ch === MOTION_TEXT_SYMBOL_47) inString = true;
    else if (ch === MOTION_TEXT_SYMBOL_35 || ch === MOTION_TEXT_SYMBOL_50) stack.push(ch === MOTION_TEXT_SYMBOL_35 ? MOTION_TEXT_SYMBOL_36 : MOTION_TEXT_SYMBOL_51);
    else if (ch === MOTION_TEXT_SYMBOL_36 || ch === MOTION_TEXT_SYMBOL_51) {
      if (stack.pop() !== ch) return null;
      if (!stack.length) {
        end = i;
        break;
      }
    }
  }
  if (end >= 0) return raw.slice(0, end + 1);
  if (inString || !stack.length) return null;
  return raw.replace(MP.JSON_TRAILING_SEPARATOR, MR.MOTION_TEXT_EMPTY) + stack.reverse().join(MR.MOTION_TEXT_EMPTY);
};
const pickEnum = <T extends string>(values: T[], v: unknown, fallback: T): T => (_.includes(values, v) ? (v as T) : fallback);
export const writeMotionAiDebug = async (requestId: string, data: Record<string, unknown>): Promise<void> => {
  try {
    const dir = path.join(getMotionRootDirectory(), MOTION_TEXT_AI_DEBUG);
    await fs.promises.mkdir(dir, { recursive: true });
    const filename = String(requestId).replace(/[<>:"/\\|?*]/g, COMMON_RUNTIME.SOURCE_TEXT_SYMBOL_25);
    await fs.promises.writeFile(path.join(dir, MOTION_TEMPLATE_JSON(filename)), stringifyJson({ at: new Date().toISOString(), requestId, ...data }, null, 2), MOTION_TEXT_UTF8);
  } catch {}
};
const probeRoomPage = async (page: any, requestId: string): Promise<Record<string, unknown> | undefined> => {
  if (!page || typeof page.evaluate !== MOTION_TEXT_FUNCTION || page.isClosed?.()) return undefined;
  try {
    const dir = path.join(getMotionRootDirectory(), MOTION_TEXT_AI_DEBUG);
    await fs.promises.mkdir(dir, { recursive: true });
    await page.screenshot({ path: path.join(dir, MOTION_TEMPLATE_PNG(String(requestId))), timeout: 15000 }).catch(_.noop);
    const html = await page.content().catch(() => MR.MOTION_TEXT_EMPTY);
    if (html) await fs.promises.writeFile(path.join(dir, MOTION_TEMPLATE_DOM_TXT(String(requestId))), html, MOTION_TEXT_UTF8).catch(_.noop);
    const dom = await page
      .evaluate(
        (motionBrowserTexts) => {
          const sels = [
            motionBrowserTexts.MOTION_TEXT_MODEL_RESPONSE,
            motionBrowserTexts.MOTION_TEXT_MESSAGE_CONTENT,
            motionBrowserTexts.MOTION_TEXT_USER_QUERY,
            motionBrowserTexts.MOTION_TEXT_ID_MODEL_RESPONSE_MESSAGE_CONTENT,
            motionBrowserTexts.MOTION_TEXT_MODEL_RESPONSE_TEXT,
            motionBrowserTexts.MOTION_TEXT_MARKDOWN,
            motionBrowserTexts.MOTION_TEXT_RICH_TEXTAREA,
            motionBrowserTexts.MOTION_TEXT_CONTENTEDITABLE_TRUE,
            motionBrowserTexts.MOTION_TEXT_BUTTON_ARIA_LABEL_STOP_I,
            motionBrowserTexts.MOTION_TEXT_BUTTON_ARIA_LABEL_SEND_I,
            motionBrowserTexts.MOTION_TEXT_BUTTON_ARIA_LABEL_GUI_I,
            motionBrowserTexts.MOTION_TEXT_ROLE_ALERT,
          ];
          const counts: Record<string, number> = {};
          sels.forEach((s) => {
            try {
              counts[s] = document.querySelectorAll(s).length;
            } catch {
              counts[s] = -1;
            }
          });
          const body = (document.body?.innerText || motionBrowserTexts.MOTION_TEXT_EMPTY).replace(new RegExp(motionBrowserTexts.WHITESPACE_SOURCE, motionBrowserTexts.WHITESPACE_FLAGS), motionBrowserTexts.MOTION_TEXT_SYMBOL_13);
          return { url: location.href, title: document.title, counts, textTail: body.slice(-1500), textHead: body.slice(0, 600) };
        },
        {
          MOTION_TEXT_EMPTY: MR.MOTION_TEXT_EMPTY,
          MOTION_TEXT_MODEL_RESPONSE,
          MOTION_TEXT_MESSAGE_CONTENT,
          MOTION_TEXT_USER_QUERY,
          MOTION_TEXT_ID_MODEL_RESPONSE_MESSAGE_CONTENT,
          MOTION_TEXT_MODEL_RESPONSE_TEXT,
          MOTION_TEXT_MARKDOWN,
          MOTION_TEXT_RICH_TEXTAREA,
          MOTION_TEXT_CONTENTEDITABLE_TRUE,
          MOTION_TEXT_BUTTON_ARIA_LABEL_STOP_I,
          MOTION_TEXT_BUTTON_ARIA_LABEL_SEND_I,
          MOTION_TEXT_BUTTON_ARIA_LABEL_GUI_I,
          MOTION_TEXT_ROLE_ALERT,
          MOTION_TEXT_SYMBOL_13,
          WHITESPACE_SOURCE: MP.WHITESPACE_GLOBAL.source,
          WHITESPACE_FLAGS: MP.WHITESPACE_GLOBAL.flags,
        },
      )
      .catch((e: any) => ({ error: _.toString(e?.message) }));
    return dom;
  } catch (e: any) {
    return { error: _.toString(e?.message) };
  }
};
export const escapeStrayQuotes = (text: string): string => {
  let out: string = MR.MOTION_TEXT_EMPTY;
  let inString = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inString && c === MR.MOTION_TEXT_SYMBOL_49) {
      out += c + (text[i + 1] ?? MR.MOTION_TEXT_EMPTY);
      i++;
      continue;
    }
    if (c !== MR.MOTION_TEXT_SYMBOL_47) {
      out += c;
      continue;
    }
    if (!inString) {
      inString = true;
      out += c;
      continue;
    }
    const rest = text.slice(i + 1);
    const closes = MP.JSON_QUOTE_END.test(rest);
    if (closes) inString = false;
    out += closes ? c : MR.MOTION_TEXT_SYMBOL_53;
  }
  return out;
};
const salvageRoomJson = (text: string | undefined, artifactType: string, requestId: string): any => {
  if (!text || text.length < 40) return undefined;
  const parsed = salvageOnce(text, artifactType, requestId);
  const closed = closeMotionJsonContainers(text);
  return parsed ?? (closed && salvageOnce(closed, artifactType, requestId)) ?? salvageOnce(escapeStrayQuotes(text), artifactType, requestId);
};
const salvageOnce = (text: string, artifactType: string, requestId: string): any => {
  try {
    const parsed = extractJson(text);
    if (!_.isPlainObject(parsed)) return undefined;
    const kind = _.toString(parsed.artifactType);
    if (kind !== artifactType || parsed.requestId !== requestId) return undefined;
    const keys = _.keys(parsed);
    return keys.length >= 3 ? parsed : undefined;
  } catch {
    return undefined;
  }
};
const extractMotionRoomJson = (text: string): any => {
  try {
    return extractJson(text);
  } catch (cause) {
    throw Object.assign(new Error(CINEMATIC_CHAT_PLANNING_CONFIG.INVALID_JSON_RESPONSE_ERROR, { cause }), { diagnostics: { lastCandidate: text, candidateChars: text.length } });
  }
};
export interface MotionAiImage {
  name: string;
  mimeType: string;
  path: string;
}
interface MotionAiRun {
  projectId: string;
  workerId: string;
  lastWorkerId?: string;
  signal: AbortSignal;
  rooms: Map<string, AiPlanningFallbackProvider>;
  contextRooms: Set<string>;
  pending: Set<Promise<unknown>>;
  counts: Record<string, number>;
  workers: Map<string, MotionAiWorkerPool>;
  scenePreparations: Map<string, Promise<void>>;
  roomRecoveries: Map<string, number>;
  roomRefreshes: Set<string>;
  roomGenerations: Map<string, number>;
  halt: { error?: Error };
  editorial?: { context: string; route?: MotionAiExecution };
  ledgers?: Map<string, Promise<string>>;
  workerMode?: boolean;
}
export interface MotionEditorialSession {
  id: string;
  revision: string;
  context: string;
  worker?: boolean;
}
interface RetainedEditorialSession {
  revision: string;
  projectId: string;
  controller: AbortController;
  gate: MotionAiWorkerPool;
  run?: MotionAiRun;
  timer?: ReturnType<typeof setTimeout>;
  active: Set<Promise<void>>;
}
const editorialSessions = new Map<string, RetainedEditorialSession>();
const motionRooms = new MotionAiRoomPool((identity) => closeChatPlanningRoom({ ...identity, provider: identity.provider as AiPlanningFallbackProvider }, true));
const closeMotionAiRun = async (run: MotionAiRun): Promise<void> => {
  await motionRooms.closeProject(run.projectId);
  await Promise.allSettled(_.map(_.values(AiPlanningFallbackProvider), (provider) => closeChatPlanningRoomsForProject({ provider, projectId: run.projectId }, false)));
  run.rooms.clear();
  run.contextRooms.clear();
  run.scenePreparations.clear();
};
export const releaseMotionEditorialSession = async (id: string): Promise<void> => {
  const session = editorialSessions.get(id);
  if (!session) return;
  editorialSessions.delete(id);
  clearTimeout(session.timer);
  session.controller.abort(new Error(MR.MOTION_TEXT_CANCELLED));
  await Promise.allSettled([...session.active]);
  const slot = await session.gate.acquire();
  try {
    if (session.run) await closeMotionAiRun(session.run);
  } finally {
    slot.release();
  }
};
const motionAiRunStore = new AsyncLocalStorage<MotionAiRun>();
export const runInMotionAiWorkerSession = <T>(runId: string, fn: () => Promise<T>, log?: MotionAiLog, signal?: AbortSignal, editorial?: MotionEditorialSession): Promise<T> => {
  const parent = motionAiRunStore.getStore();
  return parent ? motionAiRunStore.run({ ...parent, workerMode: true }, fn) : runInMotionAiSession(runId, fn, log, true, signal, editorial ? { ...editorial, worker: true } : undefined);
};
const motionBrowserLifecycle = new MotionBrowserLifecycle();
let releaseMotionBrowser: (() => void) | undefined;
export const acquireMotionRenderBrowser = async (signal?: AbortSignal, log?: (line: string) => void, owner?: string): Promise<(() => void) & { shared?: boolean }> => {
  if (owner) await releaseMotionEditorialSession(owner);
  if (editorialSessions.size) {
    log?.(MOTION_BROWSER_HANDOFF.SHARED_OWNER);
    signal?.throwIfAborted();
    return Object.assign(() => {}, { shared: true });
  }
  const release = await motionBrowserLifecycle.acquireRender(signal, (count) => log?.(MOTION_BROWSER_HANDOFF.WAITING(count)));
  try {
    if (editorialSessions.size) {
      release();
      log?.(MOTION_BROWSER_HANDOFF.SHARED_OWNER);
      return Object.assign(() => {}, { shared: true });
    }
    releaseMotionBrowser?.();
    releaseMotionBrowser = undefined;
    cancelGlobalBrowserCleanup();
    for (let attempt = 0; attempt < MOTION_BROWSER_HANDOFF.CLOSE_ATTEMPTS; attempt++) {
      signal?.throwIfAborted();
      if (await closeChatBrowserIfIdle(log)) {
        cancelGlobalBrowserCleanup();
        signal?.throwIfAborted();
        return release;
      }
      if (attempt + 1 < MOTION_BROWSER_HANDOFF.CLOSE_ATTEMPTS) {
        log?.(MOTION_BROWSER_HANDOFF.RETRY(attempt + 2));
        await waitForMotionBrowser(new Promise<void>((resolve) => setTimeout(resolve, MOTION_BROWSER_HANDOFF.RETRY_MS)), signal);
      }
    }
    throw new Error(MOTION_BROWSER_NOT_RELEASED_ERROR);
  } catch (error) {
    release();
    throw error;
  }
};
const closeMotionAiRoom = async (run: MotionAiRun, workerId: string): Promise<void> => {
  const provider = run.rooms.get(workerId);
  if (!provider) return;
  await motionRooms.close({ provider, projectId: run.projectId, workerId });
};
const acquireMotionAiRoom = async (run: MotionAiRun, workerId: string, provider: AiPlanningFallbackProvider, signal?: AbortSignal): Promise<() => void> => {
  const release = await motionRooms.acquire(
    { provider, projectId: run.projectId, workerId },
    () => {
      run.rooms.delete(workerId);
      run.contextRooms.delete(workerId);
      run.roomRefreshes.delete(workerId);
      run.roomRecoveries.delete(workerId);
    },
    signal,
  );
  run.rooms.set(workerId, provider);
  return release;
};
export const runInMotionAiSession = async <T>(runId: string, fn: () => Promise<T>, log?: MotionAiLog, _keepBrowser = false, signal?: AbortSignal, editorial?: MotionEditorialSession): Promise<T> => {
  let retained: RetainedEditorialSession | undefined;
  let unlock: (() => void) | undefined;
  try {
    if (editorial) {
      while (editorialSessions.has(editorial.id) && editorialSessions.get(editorial.id)!.revision !== editorial.revision) await releaseMotionEditorialSession(editorial.id);
      retained = editorialSessions.get(editorial.id);
      if (!retained) {
        retained = { revision: editorial.revision, projectId: MOTION_EDITORIAL.ID_PREFIX + editorial.id + MR.MOTION_TEXT_SYMBOL_30 + randomUUID(), controller: new AbortController(), gate: new MotionAiWorkerPool([MOTION_STORY_CONFIG.WORKER_IDS[0]]), active: new Set() };
        editorialSessions.set(editorial.id, retained);
      }
      clearTimeout(retained.timer);
      if (!editorial.worker) unlock = (await retained.gate.acquire(AbortSignal.any(_.compact([signal, retained.controller.signal])))).release;
      retained.controller.signal.throwIfAborted();
      signal?.throwIfAborted();
    }
  } catch (error) {
    unlock?.();
    throw error;
  }
  const projectId = retained?.projectId || MR.MOTION_TEMPLATE_SYMBOL_287(MOTION_STORY_CONFIG.PROJECT_ID_PREFIX, runId);
  const planningRun = beginChatPlanningRun(projectId, Date.now(), runId);
  const shared: MotionAiRun = retained?.run || { projectId, workerId: MOTION_STORY_CONFIG.WORKER_IDS[0], signal: retained?.controller.signal || planningRun.signal, rooms: new Map(), contextRooms: new Set(), pending: new Set(), counts: {}, workers: new Map(), scenePreparations: new Map(), roomRecoveries: new Map(), roomRefreshes: new Set(), roomGenerations: new Map(), halt: {} };
  if (editorial && retained) {
    shared.editorial ||= { context: editorial.context };
    if (!editorial.worker) shared.editorial.context = editorial.context;
    retained.run = shared;
  }
  const run: MotionAiRun = { ...shared, signal: AbortSignal.any(_.compact([planningRun.signal, signal, retained?.controller.signal])), pending: new Set(), workerMode: editorial?.worker };
  let finish!: () => void;
  const done = new Promise<void>((resolve) => (finish = resolve));
  retained?.active.add(done);
  let result: T;
  let failed = false;
  let failure: unknown;
  try {
    result = await motionAiRunStore.run(run, fn);
  } catch (error) {
    failed = true;
    failure = error;
  }
  try {
    while (run.pending.size) await Promise.allSettled([...run.pending]);
    planningRun.complete();
    if (!_.isEmpty(run.counts)) log?.(MOTION_STORY_CONFIG.REQUEST_COUNT_LOG(run.counts));
    if (!retained) {
      await closeMotionAiRun(run);
    }
    cancelGlobalBrowserCleanup();
  } catch (error) {
    failed = true;
    failure = error;
  } finally {
    retained?.active.delete(done);
    finish();
    unlock?.();
    if (editorial && retained && editorialSessions.get(editorial.id) === retained && !retained.active.size) {
      retained.timer = setTimeout(() => void releaseMotionEditorialSession(editorial.id).catch(_.noop), run.halt.error || retained.controller.signal.aborted ? 0 : MOTION_EDITORIAL.IDLE_MS);
      retained.timer.unref();
    }
  }
  if (run.halt.error) throw run.halt.error;
  if (failed) throw failure;
  return result;
};
export const mapMotionAiPool = async <T, R>(items: T[], worker: (item: T, index: number) => Promise<R>, limit: number = MOTION_STORY_CONFIG.AI_PARALLEL, role?: MotionAiExecution["role"]): Promise<R[]> => {
  const results: R[] = new Array(items.length);
  const parent = motionAiRunStore.getStore();
  let next = 0;
  let failure: unknown;
  const lane = async (): Promise<void> => {
    while (next < items.length && failure === undefined) {
      const index = next++;
      try {
        results[index] = await worker(items[index], index);
      } catch (error) {
        failure ??= error;
      }
    }
  };
  const workerIds = role === MOTION_AI_ROLE.DRAW ? MOTION_STORY_CONFIG.SCENE_WORKER_IDS : MOTION_STORY_CONFIG.WORKER_IDS;
  const lanes = Math.max(1, Math.min(limit, items.length, workerIds.length));
  await Promise.all(_.times(lanes, (laneIndex) => (parent ? motionAiRunStore.run({ ...parent, workerMode: !!parent.editorial || parent.workerMode, workerId: workerIds[laneIndex] }, lane) : lane())));
  if (failure !== undefined) throw failure;
  return results;
};
const blockedRoomProviders = new Map<string, number>();
const blockedRoomModels = new Map<string, number>();
const providerRecoveries = new MotionProviderRecovery();
const providerGates = new Map<string, MotionAiWorkerPool>();
const acquireProviderGate = async (provider: string, signal?: AbortSignal, role?: MotionAiExecution["role"]): Promise<() => void> => {
  const drawing = role === MOTION_AI_ROLE.DRAW;
  const limit = drawing ? MOTION_STORY_CONFIG.SCENE_WORKER_IDS.length : MOTION_STORY_CONFIG.PROVIDER_PARALLEL[provider];
  if (!limit) return _.noop;
  const key = drawing ? MOTION_EDITORIAL.SCENES + provider : provider;
  const gate = providerGates.get(key) || new MotionAiWorkerPool((drawing ? MOTION_STORY_CONFIG.SCENE_WORKER_IDS : MOTION_STORY_CONFIG.WORKER_IDS).slice(0, limit));
  providerGates.set(key, gate);
  return (await gate.acquire(signal)).release;
};
export const motionRoomBlockedMs = (provider: string, model?: string): number => Math.max(0, (blockedRoomProviders.get(provider) || 0) - Date.now(), (blockedRoomModels.get(AIR.MODEL_KEY(provider, model)) || 0) - Date.now());
export const resetMotionAiRoom = async (): Promise<void> => {
  const run = motionAiRunStore.getStore();
  if (!run) return;
  if (run.editorial) return;
  const workerId = run.lastWorkerId || AIR.WORKER(run.workerId, MOTION_AI_ROLE.MAIN);
  if (run.rooms.has(workerId)) run.roomRefreshes.add(workerId);
};
const countMotionRequest = (provider: string, log?: MotionAiLog): void => {
  const run = motionAiRunStore.getStore();
  if (!run) return;
  run.counts[provider] = (run.counts[provider] || 0) + 1;
  log?.(MOTION_STORY_CONFIG.REQUEST_COUNT_LOG(run.counts));
};
const captchaHolds = new Map<string, Promise<void>>();
const captchaEpochs = new Map<string, number>();
export const motionCaptchaError = (error: unknown): boolean => !!_.get(error, MOTION_CAPTCHA.FLAG);
const markCaptcha = (error: Error): Error => Object.assign(error, { [MOTION_CAPTCHA.FLAG]: true });
const motionServiceDelay = (ms: number, signal?: AbortSignal): Promise<void> =>
  new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(signal.reason instanceof Error ? signal.reason : new Error(MOTION_TEXT_ABORT));
    const timer = setTimeout(() => {
      signal?.removeEventListener(MOTION_TEXT_ABORT, stop);
      resolve();
    }, ms);
    function stop() {
      clearTimeout(timer);
      reject(signal?.reason instanceof Error ? signal.reason : new Error(MOTION_TEXT_ABORT));
    }
    signal?.addEventListener(MOTION_TEXT_ABORT, stop, { once: true });
  });
const captchaPageText = async (page: any): Promise<string> => {
  if (!page || page.isClosed?.()) return MR.MOTION_TEXT_EMPTY;
  const title = await page.title().catch(() => MR.MOTION_TEXT_EMPTY);
  const body = await page
    .locator(MOTION_CAPTCHA.BODY_SELECTOR)
    .innerText({ timeout: MOTION_CAPTCHA.TEXT_TIMEOUT_MS })
    .catch(() => MR.MOTION_TEXT_EMPTY);
  return [page.url(), title, body].join(MR.MOTION_TEXT_SYMBOL_27);
};
export const motionCaptchaPageReady = (provider: string, url: string, text: string, hasInput: boolean): boolean => !!text.trim() && !MOTION_CAPTCHA.PATTERN.test(url + MR.MOTION_TEXT_SYMBOL_27 + text) && (hasInput || (provider === RT_SERVER.GEMINI_CHAT && MOTION_CAPTCHA.VERIFIED_GEMINI_LANDING.test(url)));
const solveMotionCaptcha = async (provider: string, model: string, page: any, headless: boolean, signal?: AbortSignal, log?: MotionAiLog): Promise<void> => {
  const C = MOTION_CAPTCHA;
  const run = motionAiRunStore.getStore()!;
  const started = Date.now();
  let reminded = started;
  let stable = 0;
  let openFails = 0;
  const sourceUrl = page && !page.isClosed?.() ? page.url() : undefined;
  let view = headless ? undefined : page;
  const recoveryRoom = { provider: provider as AiPlanningFallbackProvider, projectId: run.projectId, workerId: run.workerId };
  log?.(C.LOG_WAIT(provider));
  if (headless) {
    await closeChatPlanningRoom(recoveryRoom, true);
    run.contextRooms.delete(run.workerId);
  }
  for (;;) {
    if (Date.now() - started > C.WAIT_MS) throw markCaptcha(new Error(C.ERR_TIMEOUT(provider, Math.round(C.WAIT_MS / 60000))));
    if (!view || view.isClosed?.()) {
      try {
        await prepareChatPlanningRoom({ ...recoveryRoom, model: model as AiPlanningChatModel, prompt: MR.MOTION_TEXT_EMPTY, chromeHeadless: false, signal, allowDefaultGeminiModel: true });
        view = getChatPlanningRoom(recoveryRoom);
        if (view && sourceUrl && view.url() !== sourceUrl) await view.goto(sourceUrl, { waitUntil: SOURCE_TEXT_DOMCONTENTLOADED, timeout: CINEMATIC_CHAT_PLANNING_CONFIG.NAVIGATION_TIMEOUT_MS });
      } catch (error) {
        if (signal?.aborted) throw error;
        view = _.get(error, MOTION_TEXT_ROOMPAGE);
        if (!view && ++openFails >= C.OPEN_FAILS_MAX) throw markCaptcha(error instanceof Error ? error : new Error(String(error)));
      }
    } else {
      await view.bringToFront().catch(_.noop);
      const text = await captchaPageText(view);
      const hasInput = !!(await view
        .locator(C.READY_SELECTOR)
        .filter({ visible: true })
        .count()
        .catch(() => 0));
      if (!motionCaptchaPageReady(provider, view.url(), text, hasInput)) stable = 0;
      else if (++stable >= C.STABLE_POLLS) break;
    }
    if (Date.now() - reminded >= C.REMIND_MS) {
      reminded = Date.now();
      log?.(C.LOG_REMIND(provider, Math.round((reminded - started) / 60000)));
    }
    await motionServiceDelay(C.POLL_MS, signal);
  }
  log?.(C.LOG_SOLVED(provider));
};
const waitMotionCaptcha = (provider: string, model: string, page: any, headless: boolean, signal?: AbortSignal, log?: MotionAiLog): Promise<void> => {
  const captchaHold = captchaHolds.get(provider);
  if (captchaHold) {
    log?.(MOTION_CAPTCHA.LOG_HOLD);
    return captchaHold;
  }
  captchaEpochs.set(provider, (captchaEpochs.get(provider) || 0) + 1);
  const hold = solveMotionCaptcha(provider, model, page, headless, signal, log).finally(() => {
    if (captchaHolds.get(provider) === hold) captchaHolds.delete(provider);
  });
  captchaHolds.set(provider, hold);
  return hold;
};
const holdForCaptcha = async (provider: string, log?: MotionAiLog): Promise<void> => {
  const captchaHold = captchaHolds.get(provider);
  if (!captchaHold) return;
  log?.(MOTION_CAPTCHA.LOG_HOLD);
  await captchaHold.catch(_.noop);
};
export const logMotionAiChain = (entry: { artifact: string; step: number; total: number; provider: string; model?: string; result: string; reason?: string }): void => {
  try {
    fs.appendFileSync(path.join(getLogsDirectory(), MOTION_AI_FALLBACK.LOG_FILE), stringifyJson({ at: new Date().toISOString(), ...entry, reason: entry.reason ? _.truncate(entry.reason, { length: MOTION_AI_FALLBACK.REASON_MAX }) : undefined }) + MR.MOTION_TEXT_SYMBOL_27);
  } catch {
    _.noop();
  }
};
export const motionAiRoutes = (exec: MotionAiExecution): MotionAiExecution[] => {
  const primary = { ...exec, strictProvider: true, chained: true };
  if (exec.strictProvider || exec.allowFallback === false) return [primary];
  const list = exec.role === MOTION_AI_ROLE.DRAW ? MOTION_AI_FALLBACK.DRAW : MOTION_AI_FALLBACK.MAIN;
  const rest = _.map(
    _.filter(list, (r) => r.provider !== exec.provider),
    (r): MotionAiExecution => ({ ...exec, provider: r.provider, model: r.model, mode: AiPlanningExecutionMode.RoomOnly, strictProvider: true, chained: true }),
  );
  return [primary, ...rest];
};
export const prepareMotionSceneRooms = async (exec: MotionAiExecution, signal?: AbortSignal, log?: MotionAiLog): Promise<void> => {
  const run = motionAiRunStore.getStore();
  if (!run || exec.mode === AiPlanningExecutionMode.ApiOnly || !exec.provider || exec.provider === AiPlanningFallbackProvider.Disabled) return;
  const key = AIR.MODEL_KEY(String(exec.provider), exec.model);
  const linked = AbortSignal.any(_.compact([signal, run.signal]));
  if (!run.scenePreparations.has(key)) {
    const preparation = (async () => {
      const releaseSession = await motionBrowserLifecycle.acquireSession(linked);
      releaseMotionBrowser ||= retainGlobalBrowser();
      try {
        log?.(MOTION_STORY_CONFIG.SCENE_ROOMS_PREPARING);
        const results = await Promise.allSettled(
          MOTION_STORY_CONFIG.SCENE_WORKER_IDS.map(async (workerId) => {
            linked.throwIfAborted();
            const release = await acquireMotionAiRoom(run, workerId, exec.provider as AiPlanningFallbackProvider, linked);
            const readySignal = AbortSignal.any([linked, AbortSignal.timeout(AIR.READINESS_TIMEOUT_MS)]);
            try {
              await prepareChatPlanningRoom({ provider: exec.provider as AiPlanningFallbackProvider, model: exec.model as AiPlanningChatModel, prompt: MR.MOTION_TEXT_EMPTY, projectId: run.projectId, workerId, chromeHeadless: exec.chromeHeadless !== false, signal: readySignal, allowDefaultGeminiModel: true });
              readySignal.throwIfAborted();
            } catch (error) {
              await closeMotionAiRoom(run, workerId);
              throw error;
            } finally {
              release();
            }
          }),
        );
        linked.throwIfAborted();
        results.forEach((result, index) => {
          if (result.status === RT_SERVER.REJECTED) log?.(MOTION_STORY_CONFIG.SCENE_ROOM_PENDING(index + 1));
        });
        log?.(MOTION_STORY_CONFIG.SCENE_ROOMS_READY(results.filter((result) => result.status !== RT_SERVER.REJECTED).length, results.length));
      } finally {
        releaseSession();
      }
    })().catch((error) => {
      run.scenePreparations.delete(key);
      throw error;
    });
    run.scenePreparations.set(key, preparation);
    run.pending.add(preparation);
    const settled = () => run.pending.delete(preparation);
    void preparation.then(settled, settled);
  }
  await waitForMotionBrowser(run.scenePreparations.get(key)!, linked);
};
export const runMotionAi = async (prompt: string, artifactType: string, exec: MotionAiExecution, signal?: AbortSignal, log?: MotionAiLog, images?: MotionAiImage[], attempt = 0, contract?: MotionAiResponseContract): Promise<any> => {
  const run = motionAiRunStore.getStore();
  if (!run) return runInMotionAiSession(randomUUID(), () => runMotionAi(prompt, artifactType, exec, signal, log, images, attempt, contract), log, true, signal);
  const drawing = exec.role === MOTION_AI_ROLE.DRAW;
  const poolKey = drawing ? MOTION_EDITORIAL.SCENES : MOTION_EDITORIAL.CONTENT;
  const workerIds = drawing ? MOTION_STORY_CONFIG.SCENE_WORKER_IDS : MOTION_STORY_CONFIG.WORKER_IDS;
  const workers = run.workers.get(poolKey) || new MotionAiWorkerPool(workerIds);
  run.workers.set(poolKey, workers);
  const pending = (async () => {
    const linked = AbortSignal.any(_.compact([signal, run.signal]));
    const releaseSession = await motionBrowserLifecycle.acquireSession(linked);
    let slot: Awaited<ReturnType<MotionAiWorkerPool["acquire"]>>;
    const queueId = poolKey + randomUUID();
    try {
      log?.(MR.MOTION_TEXT_EMPTY, { workerId: queueId, provider: String(exec.provider), model: String(exec.model || MR.MOTION_TEXT_EMPTY), artifact: artifactType, phase: AIR.PHASE.QUEUED });
      slot = await workers.acquire(linked);
    } catch (error) {
      releaseSession();
      throw error;
    } finally {
      log?.(MR.MOTION_TEXT_EMPTY, { workerId: queueId, provider: String(exec.provider), model: String(exec.model || MR.MOTION_TEXT_EMPTY), artifact: artifactType, phase: AIR.PHASE.DONE });
    }
    const workerId = slot.workerId;
    const requestId = randomUUID();
    let phaseKey: string = MR.MOTION_TEXT_EMPTY,
      phaseStartedAt = Date.now();
    const activityLog: MotionAiLog = (line, activity) => {
      const next = activity && stringifyJson([activity.provider, activity.phase]);
      if (next && next !== phaseKey) {
        phaseKey = next;
        phaseStartedAt = Date.now();
      }
      log?.(line, activity ? { ...activity, owner: run.projectId, requestId, phaseStartedAt, roomGeneration: run.roomGenerations.get(workerId), targetIds: contract?.targetIds } : undefined);
    };
    try {
      signal?.throwIfAborted();
      run.signal.throwIfAborted();
      if (run.halt.error) throw run.halt.error;
      return await motionAiRunStore.run({ ...run, workerId }, () => runMotionAiTask(prompt, artifactType, exec, signal, activityLog, images, attempt, contract));
    } catch (error) {
      if (!exec.singleResponse && _.get(error, AIR.UNCERTAIN_FLAG)) run.halt.error = error as Error;
      throw error;
    } finally {
      run.lastWorkerId = workerId;
      try {
        log?.(MR.MOTION_TEXT_EMPTY, { workerId, provider: String(exec.provider), model: String(exec.model || MR.MOTION_TEXT_EMPTY), artifact: artifactType, phase: AIR.PHASE.DONE });
      } finally {
        slot.release();
        releaseSession();
      }
    }
  })();
  run.pending.add(pending);
  try {
    return await pending;
  } finally {
    run.pending.delete(pending);
  }
};
const runMotionAiTask = async (prompt: string, artifactType: string, exec: MotionAiExecution, signal?: AbortSignal, log?: MotionAiLog, images?: MotionAiImage[], attempt = 0, contract?: MotionAiResponseContract): Promise<any> => {
  if (exec.allowFallback === false) exec = { ...exec, strictProvider: true };
  if (contract) contract.schema ||= MOTION_RESPONSE_SCHEMAS[artifactType];
  const editorial = motionAiRunStore.getStore()?.workerMode ? undefined : motionAiRunStore.getStore()?.editorial;
  const mode = pickEnum(_.values(AiPlanningExecutionMode), exec.mode, AiPlanningExecutionMode.ApiOnly);
  if (contract && !contract.budget) contract.budget = Math.max(1, contract.attempts);
  const request = async (route: MotionAiExecution, retry = 0) => {
    const run = motionAiRunStore.getStore();
    const linked = AbortSignal.any(_.compact([signal, run?.signal]));
    if (mode !== AiPlanningExecutionMode.ApiOnly) {
      const waited = await waitMotionProviderCooldown(
        () => motionRoomBlockedMs(String(route.provider), route.model),
        (ms) => motionServiceDelay(ms, linked),
        (ms) => log?.(AIR.WAIT(String(route.provider), ms), { workerId: run!.workerId, provider: String(route.provider), model: String(route.model || MR.MOTION_TEXT_EMPTY), artifact: artifactType, phase: AIR.PHASE.PROVIDER }),
        linked,
      );
      if (waited) log?.(AIR.SERVICE_RESUMED(String(route.provider)), { workerId: run!.workerId, provider: String(route.provider), model: String(route.model || MR.MOTION_TEXT_EMPTY), artifact: artifactType, phase: AIR.PHASE.PRIMARY });
    }
    try {
      return await requestMotionAiContract(prompt, route, (question) => runMotionAiOnce(question, artifactType, route, signal, log, images, retry, undefined, !!contract), contract, linked);
    } catch (error: any) {
      if (!linked.aborted && (isChatAttachmentError(error) || (AIR.REPLAYABLE_ARTIFACT.test(artifactType) && error?.message === CINEMATIC_CHAT_PLANNING_CONFIG.PROVIDER_ERROR_RESPONSE_ERROR))) {
        if (!motionRoomBlockedMs(String(route.provider), route.model)) {
          blockedRoomModels.set(AIR.MODEL_KEY(String(route.provider), route.model), Date.now() + (isChatAttachmentError(error) ? AIR.ATTACHMENT_ERROR_COOLDOWN_MS : AIR.PROVIDER_ERROR_COOLDOWN_MS));
          log?.(isChatAttachmentError(error) ? AIR.ATTACHMENT_COOLDOWN(String(route.provider)) : AIR.PROVIDER_COOLDOWN(String(route.provider)));
        }
      }
      throw error;
    }
  };
  if (exec.strictProvider || exec.chained || attempt || mode === AiPlanningExecutionMode.ApiOnly || exec.provider === AiPlanningFallbackProvider.Disabled) {
    const workerId = motionAiRunStore.getStore()!.workerId;
    const provider = mode === AiPlanningExecutionMode.ApiOnly || exec.provider === AiPlanningFallbackProvider.Disabled ? MOTION_STORY_CONFIG.API_PROVIDER : String(exec.provider);
    log?.(AIR.ACTIVE(provider, String(exec.model || MR.MOTION_TEXT_EMPTY), artifactType), { workerId, provider, model: String(exec.model || MR.MOTION_TEXT_EMPTY), artifact: artifactType, phase: AIR.PHASE.PRIMARY });
    return request(exec, attempt);
  }
  const configured = motionAiRoutes(exec);
  const routes = editorial?.route && exec.role !== MOTION_AI_ROLE.DRAW ? [editorial.route, ...configured.filter((route) => route.provider !== editorial.route!.provider || route.model !== editorial.route!.model)] : configured;
  let failure: unknown = null;
  for (let i = 0; i < routes.length; i++) {
    signal?.throwIfAborted();
    motionAiRunStore.getStore()?.signal.throwIfAborted();
    if (motionAiRunStore.getStore()?.halt.error) throw motionAiRunStore.getStore()!.halt.error;
    if (motionRoomBlockedMs(String(routes[i].provider), routes[i].model) > 0) {
      log?.(MOTION_STORY_CONFIG.ROOM_SKIPPED_LOG(String(routes[i].provider)));
      continue;
    }
    log?.(MOTION_AI_FALLBACK.LOG_TRY(i + 1, routes.length, String(routes[i].provider)));
    const workerId = motionAiRunStore.getStore()!.workerId;
    log?.(AIR.ACTIVE(String(routes[i].provider), String(routes[i].model || MR.MOTION_TEXT_EMPTY), artifactType), { workerId, provider: String(routes[i].provider), model: String(routes[i].model || MR.MOTION_TEXT_EMPTY), artifact: artifactType, phase: routes[i].provider === exec.provider && routes[i].model === exec.model ? AIR.PHASE.PRIMARY : AIR.PHASE.FALLBACK });
    const step = { artifact: artifactType, step: i + 1, total: routes.length, provider: String(routes[i].provider), model: String(routes[i].model || MR.MOTION_TEXT_EMPTY) };
    try {
      const out = await request(routes[i]);
      if (editorial && exec.role !== MOTION_AI_ROLE.DRAW) editorial.route = routes[i];
      logMotionAiChain({ ...step, result: MOTION_AI_FALLBACK.RESULT_OK });
      return out;
    } catch (error: any) {
      logMotionAiChain({ ...step, result: motionCaptchaError(error) ? MOTION_AI_FALLBACK.RESULT_CAPTCHA : MOTION_AI_FALLBACK.RESULT_FAIL, reason: _.toString(error?.message) });
      if (signal?.aborted || motionAiRunStore.getStore()?.signal.aborted || motionCaptchaError(error) || _.get(error, AIR.UNCERTAIN_FLAG) || _.get(error, MOTION_PRODUCTION.CONTRACT_EXHAUSTED) || error?.message === CINEMATIC_CHAT_PLANNING_CONFIG.CANCELLED_ERROR || (error?.message === CINEMATIC_CHAT_PLANNING_CONFIG.REFUSAL_RESPONSE_ERROR && !AIR.VECTOR_ARTIFACT.test(artifactType) && !contract))
        throw error;
      if (!failure || !_.get(error, MOTION_PRODUCTION.CONTRACT_ROUTE_EXHAUSTED)) failure = error;
      const next = routes[i + 1];
      if (next) log?.(MOTION_AI_FALLBACK.LOG_SWITCH(String(routes[i].provider), String(next.provider), _.truncate(_.toString(error?.message), { length: MOTION_AI_FALLBACK.REASON_MAX })));
    }
  }
  if (!failure && routes.length) return request([...routes].sort((a, b) => motionRoomBlockedMs(String(a.provider), a.model) - motionRoomBlockedMs(String(b.provider), b.model))[0]);
  log?.(MOTION_AI_FALLBACK.LOG_ALL_FAILED(_.map(routes, (r) => String(r.provider)).join(MOTION_AI_FALLBACK.LIST_SEP)));
  if (mode === AiPlanningExecutionMode.Hybrid) return request({ ...exec, mode: AiPlanningExecutionMode.ApiOnly });
  if (AIR.REPLAYABLE_ARTIFACT.test(artifactType)) throw Object.assign(failure instanceof Error ? failure : exhaustedMotionRoom(String(exec.provider)), { [AIR.EXHAUSTED_FLAG]: true });
  throw failure;
};
const runMotionAiOnce = async (prompt: string, artifactType: string, exec: MotionAiExecution, signal?: AbortSignal, log?: MotionAiLog, images?: MotionAiImage[], attempt = 0, recovery?: { requestId: string; submission: ChatPlanningSubmission }, contentRepair = false): Promise<any> => {
  const mode = pickEnum(_.values(AiPlanningExecutionMode), exec.mode, AiPlanningExecutionMode.ApiOnly);
  const provider = pickEnum(_.values(AiPlanningFallbackProvider), exec.provider, AiPlanningFallbackProvider.GeminiChat);
  const useRoom = mode !== AiPlanningExecutionMode.ApiOnly && provider !== AiPlanningFallbackProvider.Disabled;
  const state = recovery || { requestId: MOTION_TEMPLATE_SYMBOL_5(String(artifactType), String(randomUUID().slice(0, 8))), submission: { attempted: false, completed: false } };
  const { requestId, submission } = state;
  const identity = MOTION_TEMPLATE_ARTIFACTTYPE_REQUESTID(String(artifactType), String(requestId));
  const currentRun = motionAiRunStore.getStore();
  const requestPrompt = () => {
    const restoreContext = currentRun?.editorial && (!currentRun.contextRooms.has(currentRun.workerId) || currentRun.roomRefreshes.has(currentRun.workerId) || attempt > 0);
    const editorialContext = restoreContext ? motionPromptEditorialContext(artifactType, currentRun.editorial!.context) : MR.MOTION_TEXT_EMPTY;
    const basePrompt = editorialContext + prompt;
    const singleMessage = motionPromptSingleMessage(artifactType);
    const taskPrompt = AIR.VECTOR_ARTIFACT.test(artifactType) && !singleMessage ? [AIR.VECTOR_INSTRUCTION, basePrompt].join(MR.MOTION_TEXT_SYMBOL_27) : basePrompt;
    const fullPrompt = singleMessage ? PROMPT.SCENE_OUTPUT(withMotionResponsePrompt(artifactType, taskPrompt), String(identity)) : MOTION_TEMPLATE_MANDATORY_OUTPUT_RETURN_EXACTLY_ONE_VALID_JSON_OBJECT(withMotionResponsePrompt(artifactType, taskPrompt), String(identity));
    log?.(PROMPT.LOG(artifactType, fullPrompt.length, images?.length || 0));
    const measurement = motionPromptMeasurement(prompt, fullPrompt, editorialContext.length, images?.length || 0, motionPromptBudget(artifactType, String(exec.provider || ""), String(exec.model || "")), singleMessage);
    if (measurement.overflow) log?.(singleMessage ? PROMPT.SINGLE_MESSAGE_LOG(artifactType, measurement.finalChars) : PROMPT.OVERFLOW(artifactType, measurement.finalChars, measurement.budget));
    try {
      fs.appendFileSync(path.join(getLogsDirectory(), PROMPT.DIAGNOSTIC_FILE), stringifyJson({ at: new Date().toISOString(), artifact: artifactType, provider: exec.provider, model: exec.model, ...measurement }) + PROMPT.SEPARATOR);
    } catch {
      _.noop();
    }
    return { fullPrompt, measurement };
  };
  const runGeminiFallback = () => runMotionAiOnce(prompt, artifactType, { ...exec, provider: AiPlanningFallbackProvider.GeminiChat, model: AiPlanningChatModel.GeminiFlash }, signal, log, images, 0, undefined, contentRepair);
  const switchTo = MOTION_STORY_CONFIG.ROOM_SWITCH[provider];
  const limitTo = switchTo || MOTION_STORY_CONFIG.LIMIT_SWITCH[provider];
  const isBlocked = (name: string): boolean => (blockedRoomProviders.get(name) || 0) > Date.now();
  const runSwitched = (target = switchTo) => {
    log?.(MOTION_STORY_CONFIG.ROOM_SWITCH_LOG(provider, target.provider));
    return runMotionAiOnce(prompt, artifactType, { ...exec, provider: target.provider as AiPlanningFallbackProvider, model: target.model as AiPlanningChatModel }, signal, log, images, 0, undefined, contentRepair);
  };
  if (useRoom && isBlocked(provider) && !exec.strictProvider) {
    if (limitTo && !isBlocked(limitTo.provider)) return runSwitched(limitTo);
    if (provider !== AiPlanningFallbackProvider.GeminiChat && !isBlocked(AiPlanningFallbackProvider.GeminiChat)) return runGeminiFallback();
  }
  let fallbackToGemini = false,
    fallbackToSwitch = false,
    fallbackToLimit = false;
  if (useRoom) {
    const run = motionAiRunStore.getStore();
    const projectId = run?.projectId || MR.MOTION_TEMPLATE_SYMBOL_294(MOTION_STORY_CONFIG.PROJECT_ID_PREFIX, requestId);
    const workerId = run?.workerId;
    releaseMotionBrowser ||= retainGlobalBrowser();
    const roomCtrl = new AbortController();
    const relay = () => roomCtrl.abort();
    signal?.addEventListener(MOTION_TEXT_ABORT, relay, { once: true });
    run?.signal.addEventListener(MOTION_TEXT_ABORT, relay, { once: true });
    let timedOut = false;
    const roomTimeout = _.includes([MOTION_STORY_CONFIG.ARTIFACT_ANALYSIS, MOTION_STORY_CONFIG.ARTIFACT_CHAPTER], artifactType) ? MOTION_STORY_CONFIG.ROOM_LONG_TIMEOUT_MS : _.includes(MOTION_STORY_CONFIG.ROOM_SHORT_ARTIFACTS, artifactType) ? MOTION_STORY_CONFIG.ROOM_SHORT_TIMEOUT_MS : MOTION_STORY_CONFIG.ROOM_TIMEOUT_MS;
    let watchdog: ReturnType<typeof setTimeout> | undefined;
    let retryRoom = false;
    let replaceRoom = false;
    let roomOk = false;
    let releaseGate: () => void = _.noop;
    let releaseRoom: () => void = _.noop;
    let fullPrompt: string = MR.MOTION_TEXT_EMPTY;
    let captchaRetry = false;
    let epoch = captchaEpochs.get(provider) || 0;
    const recoveryKey = AIR.MODEL_KEY(provider, exec.model);
    let terminalError: unknown;
    try {
      log?.(MR.MOTION_TEXT_EMPTY, { workerId: workerId!, provider, model: String(exec.model || MR.MOTION_TEXT_EMPTY), artifact: artifactType, phase: captchaHolds.has(provider) ? AIR.PHASE.CAPTCHA : AIR.PHASE.PROVIDER });
      await waitForMotionBrowser(holdForCaptcha(provider, log), roomCtrl.signal);
      if (providerRecoveries.waiting(recoveryKey, requestId)) log?.(AIR.SHARED_RECOVERY_WAIT(provider), { workerId: workerId!, provider, model: String(exec.model || MR.MOTION_TEXT_EMPTY), artifact: artifactType, phase: AIR.PHASE.PROVIDER });
      await providerRecoveries.wait(recoveryKey, requestId, roomCtrl.signal);
      epoch = captchaEpochs.get(provider) || 0;
      releaseGate = await acquireProviderGate(provider, roomCtrl.signal, exec.role);
      if (run) releaseRoom = await acquireMotionAiRoom(run, workerId!, provider, roomCtrl.signal);
      const preparedPrompt = requestPrompt();
      fullPrompt = preparedPrompt.fullPrompt;
      const measurement = preparedPrompt.measurement;
      log?.(MR.MOTION_TEXT_EMPTY, { workerId: workerId!, provider, model: String(exec.model || MR.MOTION_TEXT_EMPTY), artifact: artifactType, phase: AIR.PHASE.READY });
      watchdog = setTimeout(() => {
        timedOut = true;
        roomCtrl.abort(AIR.READINESS_TIMEOUT_REASON);
      }, AIR.READINESS_TIMEOUT_MS);
      submission.onContextProgress = () => {
        clearTimeout(watchdog);
        watchdog = setTimeout(() => {
          timedOut = true;
          roomCtrl.abort(AIR.READINESS_TIMEOUT_REASON);
        }, roomTimeout);
      };
      submission.onAttempt = () => {
        clearTimeout(watchdog);
        log?.(MR.MOTION_TEXT_EMPTY, { workerId: workerId!, provider, model: String(exec.model || MR.MOTION_TEXT_EMPTY), artifact: artifactType, phase: AIR.PHASE.RESPONSE });
        watchdog = setTimeout(() => {
          timedOut = true;
          roomCtrl.abort(AIR.TIMEOUT_REASON);
        }, roomTimeout);
      };
      signal?.throwIfAborted();
      run?.signal.throwIfAborted();
      log?.(MOTION_TEMPLATE_GUI_YEU_CAU_TOI_PHONG_CHAT_AI_CAU(String(provider)));
      const model =
        provider === AiPlanningFallbackProvider.ClaudeChat
          ? parseClaudeChatModel(exec.model)
            ? (exec.model as AiPlanningChatModel)
            : AiPlanningChatModel.ClaudeAuto
          : provider === AiPlanningFallbackProvider.GeminiChat
            ? parseGeminiChatModel(exec.model)
              ? (exec.model as AiPlanningChatModel)
              : AiPlanningChatModel.GeminiFlash
            : provider === AiPlanningFallbackProvider.DeepSeekChat
              ? pickEnum(
                  DEEPSEEK_CHAT_MODES.map((item) => item.value),
                  exec.model,
                  AiPlanningChatModel.DeepSeekAuto,
                )
              : provider === AiPlanningFallbackProvider.GrokChat
                ? (_.find(CINEMATIC_CHAT_MODEL_OPTIONS[AiPlanningFallbackProvider.GrokChat], { value: exec.model as AiPlanningChatModel })?.value as AiPlanningChatModel | undefined)
                : pickEnum(_.values(AiPlanningChatModel), exec.model, AiPlanningChatModel.GeminiFlash);
      if (run?.roomRefreshes.delete(workerId!)) {
        const repairs = run.roomRecoveries.get(workerId!) || 0;
        if (repairs < AIR.ROOM_RELOADS) {
          run.roomRecoveries.set(workerId!, repairs + 1);
          await reloadChatPlanningRoom({ provider, projectId, workerId }).catch(_.noop);
        } else {
          run.roomRecoveries.delete(workerId!);
          await closeChatPlanningRoom({ provider, projectId, workerId }, true);
          run.contextRooms.delete(workerId!);
        }
      }
      if (run && (!run.contextRooms.has(workerId!) || attempt > 0)) {
        if (!run.contextRooms.has(workerId!)) run.roomGenerations.set(workerId!, (run.roomGenerations.get(workerId!) || 0) + 1);
        log?.(MR.MOTION_TEXT_EMPTY, { workerId: workerId!, provider, model: String(exec.model || MR.MOTION_TEXT_EMPTY), artifact: artifactType, phase: AIR.PHASE.READY });
        run.rooms.set(workerId!, provider);
        await prepareChatPlanningRoom({ provider, model, prompt: MR.MOTION_TEXT_EMPTY, projectId, workerId, chromeHeadless: exec.chromeHeadless !== false, signal: roomCtrl.signal, allowDefaultGeminiModel: true });
      }
      run?.contextRooms.add(workerId!);
      countMotionRequest(provider, log);
      const r = await generatePlanningWithChatUi({
        provider,
        model,
        prompt: fullPrompt,
        promptMessageLimit: measurement.budget,
        projectId,
        workerId,
        chromeHeadless: exec.chromeHeadless !== false,
        artifactType,
        requestId,
        signal: roomCtrl.signal,
        closeRoomOnComplete: !run,
        allowDefaultGeminiModel: true,
        submission,
        attachments: images?.length ? _.map(images, (im) => ({ name: im.name, mimeType: im.mimeType, path: im.path })) : undefined,
      });
      const result = extractMotionRoomJson(r.text);
      run?.roomRecoveries.delete(workerId!);
      roomOk = true;
      return result;
    } catch (error: any) {
      let caught = error;
      terminalError = error;
      if (signal?.aborted || run?.signal.aborted) throw caught;
      const geminiSelection = _.get(caught, GEMINI_MODEL_ENCODING.DIAGNOSTICS);
      const unusable = _.toString(caught?.message).includes(GEMINI_MODEL_ENCODING.UNAVAILABLE_CODE) || (!switchTo && _.toString(caught?.message).includes(C.CLAUDE_MODEL_UNAVAILABLE_CODE)) || _.toString(caught?.message).includes(XRT.DEEPSEEK_MODEL_UNAVAILABLE_CODE);
      if (unusable) {
        if (geminiSelection) await writeMotionAiDebug(requestId, { stage: artifactType, provider, model: exec.model, error: _.toString(caught?.message), selection: geminiSelection, room: await probeRoomPage(_.get(caught, MOTION_TEXT_ROOMPAGE), requestId) });
        blockedRoomModels.set(AIR.MODEL_KEY(provider, exec.model), Date.now() + MOTION_STORY_CONFIG.ROOM_UNAVAILABLE_BLOCK_MS);
        log?.(AIR.MODEL_SKIP(provider, String(exec.model)));
        throw caught;
      }
      const diag = _.get(caught, MOTION_TEXT_DIAGNOSTICS) as { lastCandidate?: string; candidateChars?: number; busy?: boolean; identityMatch?: boolean; elapsedMs?: number; responseCount?: number; initialCount?: number } | undefined;
      const refused = _.toString(caught?.message) === CINEMATIC_CHAT_PLANNING_CONFIG.REFUSAL_RESPONSE_ERROR;
      const roomProbe = await probeRoomPage(_.get(caught, MOTION_TEXT_ROOMPAGE), requestId);
      await writeMotionAiDebug(requestId, { stage: artifactType, provider, error: _.toString(caught?.message), promptChars: fullPrompt.length, ...(diag || {}), selection: geminiSelection, room: roomProbe });
      if (diag) log?.(MOTION_TEMPLATE_CHAN_DOAN_PHONG_CHAT_PHAN_HOI_KY_TU(String(diag.candidateChars ?? 0), String(diag.busy ? MOTION_TEXT_CO : MOTION_TEXT_KHONG), String(diag.identityMatch ? MOTION_TEXT_CO : MOTION_TEXT_KHONG), String(Math.round((diag.elapsedMs || 0) / 1000))));
      if (!refused && MOTION_STORY_CONFIG.CANNED_REFUSAL_RE.test(_.toString(diag?.lastCandidate))) log?.(MOTION_STORY_CONFIG.CANNED_REFUSAL_LOG(provider, artifactType, fullPrompt.length));
      if (!refused && diag?.lastCandidate && diag.lastCandidate.length < 400 && !MP.BRACE.test(diag.lastCandidate)) log?.(MOTION_TEMPLATE_AI_TRA_LOI_KHONG_PHAI_JSON(String(_.truncate(diag.lastCandidate, { length: 160 }))));
      if (refused) {
        log?.(MOTION_STORY_CONFIG.ROOM_REFUSAL_LOG(provider));
        throw caught;
      }
      const salvaged = salvageRoomJson(diag?.lastCandidate, artifactType, requestId);
      if (salvaged) {
        log?.(MOTION_TEXT_PHONG_CHAT_DA_TRA_JSON_DAY_DU_NHUNG);
        roomOk = true;
        return salvaged;
      }
      const limitText = [_.toString(caught?.message), _.toString(diag?.lastCandidate), stringifyJson(roomProbe || {})] as string[];
      const limited =
        !!limitTo &&
        (_.includes([CINEMATIC_CHAT_PLANNING_CONFIG.CHATGPT_RATE_LIMIT_ERROR, CINEMATIC_CHAT_PLANNING_CONFIG.CLAUDE_RATE_LIMIT_ERROR, CINEMATIC_CHAT_PLANNING_CONFIG.GROK_RATE_LIMIT_ERROR, DEEPSEEK_CHAT_CONFIG.RATE_LIMIT_ERROR], limitText[0]) || _.some(limitText, (text) => CINEMATIC_CHAT_PLANNING_CONFIG.CLAUDE_RATE_LIMIT_PATTERN.test(text) || MOTION_STORY_CONFIG.ROOM_LIMIT_PATTERN.test(text)));
      const captcha = _.some([limitText[0], stringifyJson(_.pick(roomProbe || {}, [MOTION_CAPTCHA_PROBE.URL, MOTION_CAPTCHA_PROBE.TITLE, MOTION_CAPTCHA_PROBE.HEAD]))] as string[], (text) => MOTION_CAPTCHA.PATTERN.test(text));
      if (captcha || captchaHolds.has(provider) || epoch !== (captchaEpochs.get(provider) || 0)) {
        clearTimeout(watchdog);
        log?.(MR.MOTION_TEXT_EMPTY, { workerId: workerId!, provider, model: String(exec.model || MR.MOTION_TEXT_EMPTY), artifact: artifactType, phase: AIR.PHASE.CAPTCHA });
        if (captcha) await waitMotionCaptcha(provider, _.toString(exec.model), _.get(caught, MOTION_TEXT_ROOMPAGE), exec.chromeHeadless !== false, AbortSignal.any(_.compact([signal, run?.signal])), log);
        else await holdForCaptcha(provider, log);
        captchaRetry = true;
      }
      if (!captchaRetry && contentRepair && isMotionContentResponseError(caught)) {
        roomOk = true;
        throw caught;
      }
      if (!captchaRetry && exec.singleResponse) {
        roomOk = submission.completed;
        throw caught;
      }
      if (!captchaRetry && submission.attempted && !submission.completed && !limited && !isFinalChatResponseError(caught)) {
        clearTimeout(watchdog);
        log?.(AIR.RESUME(provider), { workerId: workerId!, provider, model: String(exec.model || MR.MOTION_TEXT_EMPTY), artifact: artifactType, phase: AIR.PHASE.CHECKING });
        const replayable = !!run?.editorial || AIR.REPLAYABLE_ARTIFACT.test(artifactType);
        for (let check = 0; check <= (replayable ? AIR.ROOM_RELOADS : 0); check++) {
          try {
            if (check) log?.(AIR.RESUME_RELOAD(provider, check, AIR.ROOM_RELOADS), { workerId: workerId!, provider, model: String(exec.model || MR.MOTION_TEXT_EMPTY), artifact: artifactType, phase: AIR.PHASE.RECOVERING });
            const resumeSignal = AbortSignal.any(_.compact([signal, run?.signal, AbortSignal.timeout(AIR.RESUME_MS)]));
            const result = await resumeChatPlanningResponse({ provider, model: exec.model as AiPlanningChatModel, prompt: fullPrompt, projectId, workerId, artifactType, requestId, signal: resumeSignal, chromeHeadless: exec.chromeHeadless !== false, submission, reloadPendingResponse: check > 0 });
            const parsed = extractMotionRoomJson(result.text);
            roomOk = true;
            return parsed;
          } catch (resumeError) {
            if (signal?.aborted || run?.signal.aborted) throw resumeError;
            if (isFinalChatResponseError(resumeError)) {
              submission.completed = true;
              if (resumeError instanceof Error && resumeError.message === CINEMATIC_CHAT_PLANNING_CONFIG.REFUSAL_RESPONSE_ERROR) throw resumeError;
              caught = resumeError;
              break;
            }
            if (check < (replayable ? AIR.ROOM_RELOADS : 0)) continue;
            if (!replayable) throw uncertainChatSubmission(provider);
            submission.abandoned = true;
            caught = exhaustedMotionRoom(provider);
            if (attempt < AIR.ROOM_RETRIES) {
              retryRoom = true;
              replaceRoom = true;
              log?.(AIR.RESTART(provider), { workerId: workerId!, provider, model: String(exec.model || MR.MOTION_TEXT_EMPTY), artifact: artifactType, phase: AIR.PHASE.RECOVERING });
            }
          }
        }
      }
      const currentError = _.toString(caught?.message);
      terminalError = caught;
      if (!captchaRetry && currentError === CINEMATIC_CHAT_PLANNING_CONFIG.PROVIDER_ERROR_RESPONSE_ERROR && !providerRecoveries.claim(recoveryKey, requestId)) {
        clearTimeout(watchdog);
        releaseGate();
        releaseGate = _.noop;
        log?.(AIR.SHARED_RECOVERY_WAIT(provider), { workerId: workerId!, provider, model: String(exec.model || MR.MOTION_TEXT_EMPTY), artifact: artifactType, phase: AIR.PHASE.PROVIDER });
        await providerRecoveries.wait(recoveryKey, requestId, AbortSignal.any(_.compact([signal, run?.signal])));
      }
      const noInput = !limited && !captcha && currentError === CHAT_UI_AUTOMATION_MESSAGES.INPUT_AREA_NOT_FOUND;
      const transport = (timedOut && !submission.completed && !submission.abandoned) || AIR.TRANSPORT.test(currentError) || currentError === CINEMATIC_CHAT_PLANNING_CONFIG.UI_READ_TIMEOUT_ERROR || noInput || currentError.includes(GEMINI_MODEL_ENCODING.UI_NOT_READY_CODE) || MOTION_STORY_CONFIG.ROOM_UI_ERROR_RE.test(currentError);
      const retryableResponse = isChatAttachmentError(caught) || _.includes([CINEMATIC_CHAT_PLANNING_CONFIG.PROVIDER_ERROR_RESPONSE_ERROR, CINEMATIC_CHAT_PLANNING_CONFIG.INVALID_JSON_RESPONSE_ERROR, CINEMATIC_CHAT_PLANNING_CONFIG.INVALID_RESPONSE_ERROR], _.toString(caught?.message));
      if (!retryRoom && !captchaRetry && !limited && (!submission.attempted || submission.completed) && (transport || retryableResponse) && attempt < AIR.ROOM_RETRIES) {
        retryRoom = true;
        log?.(attempt < AIR.ROOM_RELOADS ? AIR.RECOVER(provider, attempt + 1, AIR.ROOM_RELOADS) : AIR.REPLACE(provider), { workerId: workerId!, provider, model: String(exec.model || MR.MOTION_TEXT_EMPTY), artifact: artifactType, phase: AIR.PHASE.RECOVERING });
      }
      if (!retryRoom && !captchaRetry && exec.strictProvider) {
        if (limited) blockedRoomProviders.set(provider, Date.now() + MOTION_STORY_CONFIG.ROOM_LIMIT_BLOCK_MS);
        const error = timedOut && !submission.completed && !submission.abandoned ? new Error(MOTION_TEMPLATE_PHONG_CHAT_AI_KHONG_TRA_KET_QUA_SAU(String(Math.round(roomTimeout / 60000)))) : caught;
        log?.(MOTION_TEMPLATE_PHONG_CHAT_LOI(String(_.truncate(_.toString(error?.message), { length: 140 }))));
        throw error;
      }
      const unavailable = noInput && !!limitTo && !switchTo && attempt > 0;
      if (!retryRoom && !captchaRetry) {
        if (unavailable) {
          log?.(MOTION_STORY_CONFIG.ROOM_UNAVAILABLE_LOG(provider, limitTo.provider));
          fallbackToLimit = !isBlocked(limitTo.provider);
          if (!fallbackToLimit && mode === AiPlanningExecutionMode.RoomOnly) throw caught;
        } else if (limited) {
          blockedRoomProviders.set(provider, Date.now() + MOTION_STORY_CONFIG.ROOM_LIMIT_BLOCK_MS);
          log?.(MOTION_STORY_CONFIG.ROOM_LIMIT_LOG(provider, limitTo.provider));
          fallbackToLimit = !isBlocked(limitTo.provider);
          if (!fallbackToLimit && mode === AiPlanningExecutionMode.RoomOnly) throw caught;
        } else {
          const error = timedOut ? new Error(MOTION_TEMPLATE_PHONG_CHAT_AI_KHONG_TRA_KET_QUA_SAU(String(Math.round(roomTimeout / 60000)))) : caught;
          log?.(MOTION_TEMPLATE_PHONG_CHAT_LOI(String(_.truncate(_.toString(error?.message), { length: 140 }))));
          const blocked = !timedOut && provider !== AiPlanningFallbackProvider.GeminiChat && MOTION_STORY_CONFIG.ROOM_BLOCKED_RE.test(_.toString(error?.message));
          if (switchTo) fallbackToSwitch = true;
          else if (blocked) {
            log?.(MOTION_STORY_CONFIG.ROOM_FALLBACK_LOG(provider));
            fallbackToGemini = true;
          } else if (mode === AiPlanningExecutionMode.RoomOnly) throw error;
        }
      }
    } finally {
      releaseGate();
      clearTimeout(watchdog);
      submission.onAttempt = undefined;
      submission.onContextProgress = undefined;
      signal?.removeEventListener(MOTION_TEXT_ABORT, relay);
      run?.signal.removeEventListener(MOTION_TEXT_ABORT, relay);
      if (!retryRoom && !captchaRetry) providerRecoveries.finish(recoveryKey, requestId, roomOk || signal?.aborted || run?.signal.aborted ? undefined : terminalError);
      try {
        if (run) {
          if (retryRoom) {
            if (!replaceRoom && attempt < AIR.ROOM_RELOADS) await reloadChatPlanningRoom({ provider, projectId, workerId }).catch(_.noop);
            else await closeMotionAiRoom(run, workerId!);
          } else if (!roomOk && !captchaRetry) await closeMotionAiRoom(run, workerId!);
        } else {
          await closeChatPlanningRoom({ provider, projectId }).catch(_.noop);
        }
        cancelGlobalBrowserCleanup();
      } finally {
        releaseRoom();
      }
    }
    if (captchaRetry) return runMotionAiOnce(prompt, artifactType, exec, signal, log, images, attempt, state, contentRepair);
    if (retryRoom) {
      submission.attempted = false;
      submission.completed = false;
      submission.abandoned = false;
      submission.pending = undefined;
      return runMotionAiOnce(prompt, artifactType, exec, signal, log, images, replaceRoom ? AIR.ROOM_RETRIES : attempt + 1, state, contentRepair);
    }
    if (fallbackToLimit) return runSwitched(limitTo);
    if (fallbackToSwitch) return runSwitched();
    if (fallbackToGemini) return runGeminiFallback();
  }
  log?.(MOTION_TEXT_GOI_AI_QUA_API);
  countMotionRequest(MOTION_STORY_CONFIG.API_PROVIDER, log);
  const { fullPrompt } = requestPrompt();
  const contents = images?.length ? [{ role: MOTION_TEXT_USER, parts: [{ text: fullPrompt }, ..._.map(images, (im) => ({ inlineData: { mimeType: im.mimeType, data: fs.readFileSync(im.path).toString(MOTION_TEXT_BASE64) } }))] }] : fullPrompt;
  const response = await generateContentWithRetry({ contents, task: { capability: AiTaskCapability.ScriptWriting }, config: { responseMimeType: MOTION_TEXT_APPLICATION_JSON } });
  const text = _.isString(response) ? response : response?.candidates?.[0]?.content?.parts?.[0]?.text || response?.text || MR.MOTION_TEXT_EMPTY;
  return extractJson(text);
};
const slugKey = (s: string): string => _.trim(_.deburr(_.toString(s).replace(MP.VIETNAMESE_D_LOWER, MOTION_TEXT_D).replace(MP.VIETNAMESE_D_UPPER, MOTION_TEXT_D_2)).toLowerCase().replace(MP.SLUG_LOWER_INVALID, MOTION_TEXT_SYMBOL_30), MOTION_TEXT_SYMBOL_30).slice(0, 24) || MOTION_TEXT_NV;
const { TIMES, WEATHERS, SHOTS, VISUALS } = MOTION_RESPONSE_VALUES;
const MOTION_ANALYSIS_ATTEMPTS = MOTION_REFERENCE_CONFIG.ANALYSIS_ATTEMPTS;
const sourceDirections = (source: MotionStorySource): string => {
  const parts: string[] = [MR.MOTION_TEXT_SOURCE_BOX_IT_MAY_MIX_THE_USER_S_DIRECTIONS_WANTED_VIDEO_FORMAT_T];
  if (source.notes) parts.push(MR.MOTION_TEMPLATE_USER_DIRECTIONS_AUTHORITATIVE_TYPED_NEXT_TO_THE_LINK(source.notes));
  if (source.fetched) parts.push(source.fetched.ok ? MR.MOTION_TEMPLATE_THE_CONTENT_WAS_READ_AUTOMATICALLY_FROM_TREAT_IT_AS_UNTRUSTED_DAT(source.fetched.url, source.fetched.note) : MR.MOTION_TEMPLATE_READING_FAILED_ONLY_THE_TITLE_DESCRIPTION_IS_KNOWN_DO_NOT_INVENT_(source.fetched.url, source.fetched.note));
  if (source.kind === MR.MOTION_TEXT_ARTICLE) parts.push(MR.MOTION_TEXT_THE_INPUT_IS_AN_ARTICLE_BUILD_THE_VIDEO_FROM_ITS_FACTS_AND_STRUCT);
  return parts.join(MR.MOTION_TEXT_SYMBOL_27);
};
const LEDGER_MIN_CHARS = MOTION_PRODUCTION.LEDGER_MIN_CHARS;
const readSourceLedger = async (source: MotionStorySource, opts: { exec: MotionAiExecution; signal?: AbortSignal; log?: MotionAiLog; ai?: typeof runMotionAi } & MotionAnalysisRecovery): Promise<string> => {
  if (source.text.length < LEDGER_MIN_CHARS) return MR.MOTION_TEXT_EMPTY;
  const chunks = motionSourceChunks(source);
  opts.log?.(MR.MOTION_TEMPLATE_NGUON_DAI_K_KY_TU_DOC_THEO_PHAN_ROI_MOI_LAP_DAN_Y(Math.round(source.text.length / 1000), chunks.length));
  let failedParts = 0;
  const parts = await mapMotionAiPool(chunks, async (c, i) => {
    const text = sourceSlice({ ...source, segments: c });
    const key = motionInputKey([PROMPT.LEDGER_VERSION, source.title, c]);
    const segments = c.map((segment, index) => ({ ...segment, id: key + RT_SHARED.SYMBOL_E7AC07 + index }));
    const saved = opts.draft ? ((opts.draft.ledgerReadParts ||= {})[key] ||= { state: { rejected: 0, errors: [] } }) : { raw: undefined, state: { rejected: 0, errors: [] as string[] } };
    const accepted = parseMotionSourceLedgerPart(saved.raw, segments, key);
    if (accepted) return accepted;
    const prompt = PROMPT.LEDGER_READ(source.title, i + 1, chunks.length, segments);
    let part: MotionSourceLedgerNode | undefined;
    try {
      const contract: MotionAiResponseContract = {
        targetIds: segments.map((segment) => segment.id),
        attempts: MOTION_PRODUCTION.CONTRACT_ROUTE_ATTEMPTS,
        routeAttempts: MOTION_PRODUCTION.CONTRACT_ROUTE_ATTEMPTS,
        budget: MOTION_PRODUCTION.CONTRACT_TOTAL_ATTEMPTS,
        state: saved.state,
        checkpoint: () => {
          if (opts.draft) opts.onDraft?.(structuredClone(opts.draft));
        },
        assess: (raw) => {
          const value = parseMotionSourceLedgerPart(raw, segments, key);
          if (value) saved.raw = raw;
          return { value, errors: value ? [] : [PROMPT.LEDGER_INVALID] };
        },
        repair: (question, _value, errors) => PROMPT.LEDGER_REPAIR(question, errors),
        failure: () => new Error(PROMPT.LEDGER_INVALID),
      };
      part = opts.ai ? await requestMotionAiContract(prompt, opts.exec, (question) => opts.ai!(question, MR.MOTION_TEXT_MOTION_STORY_LEDGER, opts.exec, opts.signal, opts.log), contract, opts.signal) : await runMotionAi(prompt, MR.MOTION_TEXT_MOTION_STORY_LEDGER, opts.exec, opts.signal, opts.log, undefined, 0, contract);
    } catch (error) {
      if ((isTerminalMotionAiError(error, opts.signal) && !_.get(error, MOTION_PRODUCTION.CONTRACT_EXHAUSTED) && !_.get(error, MOTION_PRODUCTION.CONTRACT_ROUTE_EXHAUSTED)) || MOTION_PRODUCTION.SERVICE_ERROR_RE.test(String((error as Error)?.message))) throw error;
    }
    if (part) {
      opts.signal?.throwIfAborted();
      if (opts.draft) {
        opts.onDraft?.(structuredClone(opts.draft));
      }
      return part;
    }
    failedParts++;
    return text;
  });
  opts.log?.(MR.MOTION_TEMPLATE_SO_SU_KIEN_PHAN(chunks.length, failedParts ? MR.MOTION_TEMPLATE_PHAN_DUNG_TRICH_DOAN_GOC(failedParts) : MR.MOTION_TEXT_EMPTY));
  const reductions = opts.draft ? (opts.draft.ledgerReductions ||= {}) : {};
  return compactMotionSourceLedger(parts, {
    map: mapMotionAiPool,
    draft: reductions,
    key: motionInputKey,
    signal: opts.signal,
    checkpoint: () => {
      if (opts.draft) opts.onDraft?.(structuredClone(opts.draft));
    },
    fallback: () => opts.log?.(PROMPT.LEDGER_COMPACT_FALLBACK),
    request: async (prompt) => {
      try {
        return await (opts.ai || runMotionAi)(prompt, MR.MOTION_TEXT_MOTION_STORY_LEDGER, opts.exec, opts.signal, opts.log);
      } catch (error) {
        if (!isMotionContentResponseError(error)) throw error;
        return undefined;
      }
    },
  });
};
export const buildSourceLedger = (source: MotionStorySource, opts: Parameters<typeof readSourceLedger>[1]): Promise<string> => {
  const run = motionAiRunStore.getStore();
  if (!run) return readSourceLedger(source, opts);
  const ledgers = (run.ledgers ||= new Map());
  const key = videoDnaSourceKey(source);
  const saved = ledgers.get(key);
  if (saved) return saved;
  const task = readSourceLedger(source, opts).catch((error) => {
    ledgers.delete(key);
    throw error;
  });
  ledgers.set(key, task);
  return task;
};
const withMusicMood = (analysis: MotionStoryAnalysis, raw: any): MotionStoryAnalysis => {
  const moods = new Map<string, string | undefined>(_.map(_.castArray(raw?.chapters || []), (chapter: any, index: number): [string, string | undefined] => [_.toString(chapter?.id || index), musicMoodOf(chapter?.musicMood)]));
  const chapters = _.map(analysis.chapters, (chapter, index): MotionChapter => {
    const mood = moods.get(chapter.id) || moods.get(String(index));
    return mood ? { ...chapter, musicMood: mood } : chapter;
  });
  const mood = musicMoodOf(raw?.musicMood);
  return { ...analysis, chapters, ...(mood ? { musicMood: mood } : {}) };
};
export interface MotionAnalysisDraft {
  core?: { state: import("./motionAiContractService.js").MotionAiContractState; budget: number };
  ledgerReadParts?: Record<string, { raw?: unknown; state: import("./motionAiContractService.js").MotionAiContractState }>;
  ledgerReductions?: MotionSourceLedgerDraft;
  ledgerParts?: Record<string, string>;
  inputKey: string;
  raw?: any;
  rejected: number;
  base?: MotionStoryAnalysis;
  completed?: MotionStoryAnalysis;
  retune?: { inputKey?: string; raw?: any; rejected: number; errors: string[]; contract?: import("./motionAiContractService.js").MotionAiContractState; budget?: number };
  profiles?: Record<string, { raw?: any; state: import("./motionAiContractService.js").MotionAiContractState }>;
}
interface MotionAnalysisRecovery {
  draft?: MotionAnalysisDraft;
  onDraft?: (draft: MotionAnalysisDraft) => void;
}
export const analyzeStory = async (
  source: MotionStorySource,
  opts: { visualSettings?: MotionVisualSettings; styleReferences?: MotionStyleReference[]; characterMotion?: boolean; language: string; length: MotionStoryLength; aspect?: string; exec: MotionAiExecution; signal?: AbortSignal; log?: MotionAiLog; ai?: typeof runMotionAi; videoGenre?: MotionVideoGenre; stylePreset?: string } & MotionAnalysisRecovery,
): Promise<MotionStoryAnalysis> => {
  const inputKey = motionInputKey([source, opts.language, opts.length, opts.aspect, opts.exec, opts.styleReferences, opts.videoGenre, opts.stylePreset, opts.characterMotion, ...(opts.visualSettings ? [opts.visualSettings] : [])]);
  const draft: MotionAnalysisDraft = opts.draft?.inputKey === inputKey ? structuredClone(opts.draft) : { inputKey, rejected: 0 };
  const checkpoint = () => {
    opts.signal?.throwIfAborted();
    opts.onDraft?.(structuredClone(draft));
  };
  const complete = (analysis: MotionStoryAnalysis): MotionStoryAnalysis => {
    draft.completed = analysis;
    checkpoint();
    return analysis;
  };
  if (draft.completed) return draft.completed;
  if (draft.base) return complete(draft.base);
  const target = resolveTargetSeconds(source, opts.length);
  const settings: MotionVideoDnaSettings = { length: opts.length, targetSeconds: target, language: opts.language === MR.MOTION_TEXT_EN ? MR.MOTION_TEXT_EN : MR.MOTION_TEXT_VI, aspect: opts.aspect || MR.MOTION_TEXT_16_9, drawingMode: MR.MOTION_TEXT_2D, characterMode: MR.MOTION_TEXT_DRAWN };
  const chapterCount = _.clamp(Math.round(target / 150), 1, 24);
  const language = opts.language === MOTION_TEXT_EN ? MOTION_TEXT_ENGLISH : MOTION_TEXT_VIETNAMESE;
  const ledger = await buildSourceLedger(source, { ...opts, draft });
  const transcript = ledger ? MR.MOTION_TEMPLATE_EVENT_LEDGER_OF_THE_FULL_SOURCE_BUILT_PART_BY_PART_FROM_THE_COMPL(ledger) : sourceSlice(source);
  const prompt = MOTION_GEN_ANALYSIS_PROMPT({ preamble: MOTION_GEN_PREAMBLE, title: source.title, seconds: Math.round(target), language, chapters: chapterCount, transcript });
  const briefNote = source.kind === MR.MOTION_TEXT_BRIEF ? MR.MOTION_TEXT_THE_INPUT_IS_A_CREATIVE_BRIEF_NOT_A_TIMESTAMPED_TRANSCRIPT_DEVELO : MR.MOTION_TEXT_EMPTY;
  const finish = (analysis: MotionStoryAnalysis): MotionStoryAnalysis => ({ ...analysis, visualSettings: opts.visualSettings, stylePreset: opts.stylePreset, videoGenre: motionVideoGenre(opts.videoGenre) });
  const genreDirective = motionVideoGenreDirective(opts.videoGenre);
  const fullRequest = withMotionResponsePrompt(
    MOTION_STORY_CONFIG.ARTIFACT_ANALYSIS,
    ([prompt, PROMPT.DNA_CORE + stringifyJson(settings), EDITORIAL_POLICY.COMPACT, SOURCE_READING_RULES, sourceDirections(source), briefNote] as string[]).filter(Boolean).join(MR.MOTION_TEXT_SYMBOL_27) +
      MR.MOTION_TEXT_SYMBOL_27 +
      (opts.characterMotion ? MOTION_REFERENCE_PROMPTS.MOTION_ON : MOTION_REFERENCE_PROMPTS.MOTION_OFF) +
      MR.MOTION_TEXT_SYMBOL_27 +
      (genreDirective ? MR.MOTION_TEXT_SYMBOL_27 + genreDirective : MR.MOTION_TEXT_EMPTY) +
      MR.MOTION_TEXT_SYMBOL_27 +
      [MOTION_MUSIC.PROMPT(_.keys(MOTION_MUSIC_MOODS)), motionStoryLanguageGuide(opts.language), motionVisualCapability(opts.visualSettings) || puppetPackPlanningCapabilities(opts.stylePreset)].filter(Boolean).join(MR.MOTION_TEXT_SYMBOL_27),
  );
  const legacy = !draft.core && draft.rejected > 0;
  const core = (draft.core ||= { state: { rejected: draft.rejected, errors: draft.raw ? motionAnalysisResponseErrors(draft.raw) : [] }, budget: legacy ? MOTION_ANALYSIS_ATTEMPTS : MOTION_PRODUCTION.CONTRACT_TOTAL_ATTEMPTS });
  let lastRaw: any = draft.raw ? (draft.raw = normalizeMotionAnalysisResponse(draft.raw)) : undefined;
  const question = () => (lastRaw ? [motionAnalysisRepairPrompt(lastRaw, motionAnalysisResponseErrors(lastRaw), transcript), motionVideoGenreWritingProfile(opts.videoGenre)].filter(Boolean).join(MR.MOTION_TEXT_SYMBOL_27) : fullRequest);
  const contract: MotionAiResponseContract = {
    attempts: MOTION_PRODUCTION.CONTRACT_ROUTE_ATTEMPTS,
    routeAttempts: MOTION_PRODUCTION.CONTRACT_ROUTE_ATTEMPTS,
    budget: core.budget,
    state: core.state,
    checkpoint: () => {
      draft.rejected = core.state.rejected;
      checkpoint();
    },
    start: question,
    assess: (response) => {
      const normalized = normalizeMotionAnalysisResponse(response);
      const value = lastRaw ? motionAnalysisRepairDraft(lastRaw, normalized, motionAnalysisResponseErrors(lastRaw)) : normalized;
      if (_.isPlainObject(value)) lastRaw = draft.raw = value;
      const errors = value ? motionAnalysisResponseErrors(value) : [MR.MOTION_TEXT_NO_JSON_OBJECT_RETURNED];
      return { value, errors };
    },
    repair: question,
    failure: (errors) => new Error(MOTION_RESPONSE_TEXT.ANALYSIS_FAILED(errors)),
  };
  let raw =
    lastRaw && !motionAnalysisResponseErrors(lastRaw).length ? lastRaw : opts.ai ? await requestMotionAiContract(fullRequest, opts.exec, (prompt) => opts.ai!(prompt, MOTION_STORY_CONFIG.ARTIFACT_ANALYSIS, opts.exec, opts.signal, opts.log), contract, opts.signal) : await runMotionAi(fullRequest, MOTION_STORY_CONFIG.ARTIFACT_ANALYSIS, opts.exec, opts.signal, opts.log, undefined, 0, contract);
  checkpoint();
  opts.log?.(EDITORIAL_POLICY.PROFILE_LOG);
  const normalized = normalizeVideoDna(raw.videoDna, settings, videoDnaSourceKey(source))!;
  const videoDna = normalized.audienceProfile ? { ...normalized, audienceProfile: { ...normalized.audienceProfile, language: settings.language } } : normalized;
  opts.log?.(MR.MOTION_TEMPLATE_VIDEO_DNA(videoDna.format?.primary || MR.MOTION_TEXT_SYMBOL_25, videoDna.audienceProfile?.language || MR.MOTION_TEXT_EMPTY, videoDna.audienceProfile?.ageRange || MR.MOTION_TEXT_EMPTY, _.truncate(videoDna.narrativeDna?.narrativeVoice || MR.MOTION_TEXT_EMPTY, { length: 80 })));
  return complete(finish(withMusicMood(normalizeAnalysis({ ...raw, characterMotion: opts.characterMotion === true, factual: videoDna.format?.factual ?? raw.factual, videoDna }, source, target, opts.videoGenre), raw)));
};
export const editScript = async (source: MotionStorySource, analysis: MotionStoryAnalysis, beats: MotionBeat[], opts: { language: string; exec: MotionAiExecution; signal?: AbortSignal; log?: MotionAiLog; ai?: typeof runMotionAi; scope?: string; focusIds?: string[] }): Promise<{ beats: MotionBeat[]; edit: { reviewed: number; rewritten: number; notes: string[] } }> => {
  const dna = analysis.videoDna;
  const writingProfile = opts.focusIds ? motionVideoGenreEditorProfile(analysis.videoGenre) : motionVideoGenreWritingProfile(analysis.videoGenre);
  const motifs = analysis.motifs || [];
  let motifKept = 0;
  const brief = stringifyJson({ writingProfile, audience: dna?.audienceProfile, narrativeVoice: dna?.narrativeDna?.narrativeVoice || dna?.narrative.voice, callbacks: dna?.narrativeDna?.callbacks, mustPreserve: dna?.mustPreserve, mustNotCopy: dna?.mustNotCopy });
  const byId = new Map(beats.map((b) => [b.id, b]));
  const notes: string[] = [];
  let rewritten = 0;
  const targets = opts.focusIds ? beats.filter((beat) => opts.focusIds!.includes(beat.id)) : beats;
  const findings = motionScriptFindings(beats, analysis, opts.language);
  const { style: styleFindings, overlap: overlapFindings, repeat: repeatFindings, stage: stageFindings, echo: echoFindings } = findings;
  const styleIds = new Set(findings.ids);
  const sourceWindow = (chapter: MotionChapter, lines: MotionBeat[]): string => {
    const text = sourceSlice(source, chapter.from, chapter.to);
    if (!opts.focusIds || text.length <= TIMELINE.EDITOR.SOURCE_CHARS) return text;
    const own = beats.filter((beat) => beat.chapterId === chapter.id);
    const ratio = _.mean(lines.filter((line) => line.chapterId === chapter.id).map((line) => (own.indexOf(line) + 0.5) / Math.max(1, own.length)));
    const start = _.clamp(Math.round(ratio * text.length - TIMELINE.EDITOR.SOURCE_CHARS / 2), 0, text.length - TIMELINE.EDITOR.SOURCE_CHARS);
    return text.slice(start, start + TIMELINE.EDITOR.SOURCE_CHARS);
  };
  const editLimit = (lines: MotionBeat[]): number => Math.max(2, Math.ceil(lines.length * 0.15), lines.filter((line) => styleIds.has(line.id)).length);
  const editorPrompt = (lines: MotionBeat[]): string => {
    const chapterIds = new Set(lines.map((line) => line.chapterId));
    const chapters = analysis.chapters.filter((chapter) => chapterIds.has(chapter.id));
    const previous = stringifyJson(beats.slice(Math.max(0, beats.indexOf(lines[0]) - 2), beats.indexOf(lines[0])).map((beat) => beat.narration));
    const model = chapters.map((chapter) => MR.MOTION_TEMPLATE_SOURCE(chapter.id, sourceWindow(chapter, lines))).join(MR.MOTION_TEXT_SYMBOL_27);
    const language = opts.language === MOTION_TEXT_EN ? MOTION_TEXT_ENGLISH : MOTION_TEXT_VIETNAMESE;
    const review = stringifyJson(lines.map((beat) => ({ id: beat.id, chapter: beat.chapterId, visual: beat.visual, narration: beat.narration, ...(beat.utterances?.length ? { utterances: beat.utterances.map((line) => _.pick(line, [RT_SERVER.SPEAKER, RT_SERVER.ROLE, RT_SERVER.TEXT])) } : {}) })));
    const limit = editLimit(lines);
    const styleFocus = styleFindings.filter((finding) => lines.some((line) => line.id === finding.id));
    const overlapFocus = overlapFindings.filter((finding) => lines.some((line) => line.id === finding.id));
    const repeatFocus = repeatFindings.filter((finding) => lines.some((line) => line.id === finding.id));
    const stageFocus = stageFindings.filter((finding) => lines.some((line) => line.id === finding.id));
    const echoFocus = echoFindings.filter((finding) => lines.some((line) => line.id === finding.id));
    const ledger = motionStoryEventLedger(beats.slice(0, beats.indexOf(lines[0])));
    const established = opts.focusIds && ledger.length > TIMELINE.EDITOR.LEDGER_CHARS ? ledger.slice(-TIMELINE.EDITOR.LEDGER_CHARS) : ledger;
    return withMotionResponsePrompt(
      MOTION_STORY_EDIT_ARTIFACT,
      [
        MR.MOTION_TEMPLATE_ROLE_EDITOR_IN_CHIEF_OF_THIS_VIDEO_REVIEWING_THE_NARRATION_LIKE_A(brief, language, previous, review, model, limit),
        motionStoryLanguageGuide(opts.language, true, true),
        styleFocus.length ? MOTION_GENRE_STYLE.FOCUS(styleFocus) : "",
        overlapFocus.length ? TIMELINE.OVERLAP.FOCUS(overlapFocus) : "",
        repeatFocus.length ? TIMELINE.REPEAT.FOCUS(repeatFocus) : "",
        stageFocus.length ? MOTION_GENRE_STAGE.FOCUS(stageFocus) : "",
        echoFocus.length ? MOTION_GENRE_STAGE.ECHO.FOCUS(echoFocus) : "",
        motifs.length ? MOTION_GENRE_STAGE.MOTIF.KEEP(motifs) : "",
        TIMELINE.EDITOR.SCOPE,
        established ? TIMELINE.EDITOR.LEDGER + RT_SHARED.SYMBOL_01BA47 + established : "",
      ]
        .filter(Boolean)
        .join(MR.MOTION_TEXT_SYMBOL_27),
    );
  };
  const recovery = motionTaskCheckpoint<Record<string, { inputKey: string; narration?: string; utterances?: MotionBeat["utterances"]; reason?: string }>>(opts.scope, MOTION_STORY_EDIT_ARTIFACT, [analysis, source, opts.language, opts.exec, opts.focusIds]);
  const saved = recovery.read() || {};
  const keys = new Map(beats.map((beat) => [beat.id, motionInputKey([editorPrompt([beat]), beat.utterances])]));
  const apply = (beat: MotionBeat, narration: string, reason?: string, utterances?: MotionBeat["utterances"]): void => {
    byId.set(beat.id, { ..._.omit(beat, MR.MOTION_TEXT_UTTERANCES), narration, ...(utterances?.length ? { utterances } : {}) });
    rewritten++;
    if (reason) notes.push(MR.MOTION_TEMPLATE_SYMBOL_306(beat.id, _.truncate(reason, { length: 140 })));
  };
  for (const beat of targets) if (saved[beat.id]?.inputKey === keys.get(beat.id) && saved[beat.id].narration) apply(beat, saved[beat.id].narration!, saved[beat.id].reason, saved[beat.id].utterances);
  const groups = motionPromptGroups(
    targets.filter((beat) => saved[beat.id]?.inputKey !== keys.get(beat.id)),
    editorPrompt,
    PROMPT.EDITOR_ITEMS,
    undefined,
    opts.focusIds ? undefined : (before, next) => before.chapterId !== next.chapterId,
  );
  await mapMotionAiPool(groups, async (group, gi) => {
    try {
      const ids = new Set(group.map((beat) => beat.id));
      const limit = editLimit(group);
      const raw = await requestMotionEditorResponse(editorPrompt(group), group, [MOTION_VOICE.NARRATOR, ...analysis.cast.map((member) => member.key)], false, (question) => (opts.ai || runMotionAi)(question, MOTION_STORY_EDIT_ARTIFACT, opts.exec, opts.signal, opts.log), opts.signal, [motionStoryLanguageGuide(opts.language, true, true), brief].join(MR.MOTION_TEXT_SYMBOL_27));
      if (!Array.isArray(raw?.edits)) return;
      const duplicates = new Set(raw.edits.filter((entry: any, index: number, all: any[]) => all.some((other, at) => at !== index && other?.id === entry?.id)).map((entry: any) => entry?.id));
      for (const e of _.take(_.castArray(raw?.edits || []), limit)) {
        const beat = byId.get(_.toString(e?.id));
        const narration = _.trim(_.toString(e?.narration));
        if (!beat || duplicates.has(beat.id) || !ids.has(beat.id) || !narration) continue;
        if (beat.utterances?.length && _.some(beat.utterances, (u) => _.includes(MOTION_STORY_CONFIG.EDIT_KEEP_ROLES, u.role))) continue;
        const ratio = narration.split(MP.WHITESPACE).length / Math.max(1, beat.narration.split(MP.WHITESPACE).length);
        if (ratio < MOTION_STORY_CONFIG.EDIT_RATIO_MIN || ratio > MOTION_STORY_CONFIG.EDIT_RATIO_MAX) continue;
        if (motionMotifsLost(beat.narration, narration, motifs).length) {
          motifKept++;
          continue;
        }
        apply(beat, narration, e?.reason ? _.toString(e.reason) : undefined);
      }
      for (const beat of group) {
        const changed = byId.get(beat.id)!;
        saved[beat.id] = { inputKey: keys.get(beat.id)!, ...(changed.narration !== beat.narration ? { narration: changed.narration, utterances: changed.utterances } : {}) };
      }
      recovery.save(saved);
    } catch (error) {
      if (isTerminalMotionAiError(error, opts.signal)) throw error;
      opts.log?.(MR.MOTION_TEMPLATE_BIEN_TAP_NHOM_CHUONG_BO_QUA(gi + 1, getMotionErrorMessage(error, 100)));
    }
  });
  if (motifKept) opts.log?.(MOTION_GENRE_STAGE.ECHO.MOTIF_LOG(motifKept));
  opts.log?.(MR.MOTION_TEMPLATE_BIEN_TAP_VIEN_DOC_CAU_SUA_CAU(targets.length, rewritten));
  return { beats: beats.map((b) => byId.get(b.id) || b), edit: { reviewed: targets.length, rewritten, notes: _.take(notes, 40) } };
};
const MOTION_STORY_EDIT_ARTIFACT = MR.MOTION_TEXT_MOTION_STORY_EDIT;
const ADULT_TITLE = MP.UNSUITABLE_CAST;
const foldAdultChapters = (chapters: MotionChapter[]): MotionChapter[] => {
  if (chapters.length < 2) return chapters;
  const out: MotionChapter[] = [];
  for (const c of chapters) {
    const prev = _.last(out);
    if (prev && !c.mustKeep && ADULT_TITLE.test(c.title)) {
      prev.to = c.to ?? prev.to;
      if (c.handoff) prev.handoff = c.handoff;
      continue;
    }
    out.push({ ...c });
  }
  return _.map(out, (c, i) => ({ ...c, id: MOTION_TEMPLATE_C_2(String(i + 1)) }));
};
const OPENING_STYLES = [MR.MOTION_TEXT_A_CONCRETE_MOMENT_OR_IMAGE, MR.MOTION_TEXT_A_SURPRISING_FACT_OR_NUMBER, MR.MOTION_TEXT_A_CONTRAST_OR_A_TURN, MR.MOTION_TEXT_THE_REPORTED_WORDS_OR_ACTION_OF_A_PERSON_FROM_THE_SOURCE, MR.MOTION_TEXT_A_CALM_STATEMENT_THAT_CONTINUES_THE_PREVIOUS_THOUGHT, MR.MOTION_TEXT_A_QUESTION_ONLY_IF_IT_SOUNDS_NATURAL];
export const normalizeAnalysis = (raw: any, source: MotionStorySource, target: number, videoGenre?: unknown): MotionStoryAnalysis => {
  const declaredNeeds = Array.isArray(raw?.illustrationNeeds) ? raw.illustrationNeeds : undefined;
  const stageIds = motionVideoGenreStages(videoGenre);
  const stageOrder = Object.keys(stageIds);
  const chapterStages = (value: unknown): string[] =>
    _.sortBy(
      _.uniq(_.flatMap(_.castArray(value ?? []), (item) => _.toString(item).split(MOTION_GENRE_STAGE.SPLIT)).map((id) => _.snakeCase(id))).filter((id) => Object.hasOwn(stageIds, id)),
      (id) => stageOrder.indexOf(id),
    );
  const motifs = _.take(
    _.uniq(
      _.compact(
        _.castArray(raw?.motifs || [])
          .map((motif: unknown) => _.trim(_.toString(motif)))
          .filter((motif: string) => motif.length <= MOTION_GENRE_STAGE.MOTIF.CHARS),
      ),
    ),
    MOTION_GENRE_STAGE.MOTIF.MAX,
  );
  const rawChapters = _.castArray(raw?.chapters || []);
  const chapterIds = new Map<string, string>(rawChapters.map((chapter: any, index: number) => [_.toString(chapter?.id || MOTION_TEMPLATE_C_2(String(index + 1))), MOTION_TEMPLATE_C_2(String(index + 1))]));
  let chapters: MotionChapter[] = _.map(_.castArray(raw?.chapters || []), (c: any, i: number) => ({
    id: MOTION_TEMPLATE_C_2(String(i + 1)),
    title: _.truncate(_.toString(c?.title || MOTION_TEMPLATE_CHUONG(String(i + 1))), { length: 80 }),
    summary: declaredNeeds?.length ? _.toString(c?.summary || MR.MOTION_TEXT_EMPTY) : _.truncate(_.toString(c?.summary || MR.MOTION_TEXT_EMPTY), { length: 400 }),
    from: _.isFinite(_.toNumber(c?.from)) ? _.toNumber(c.from) : undefined,
    to: _.isFinite(_.toNumber(c?.to)) ? _.toNumber(c.to) : undefined,
    ...(_.inRange(_.toNumber(c?.weight), 1, 5.01) ? { weight: Math.round(_.toNumber(c.weight)) } : {}),
    ...(c?.mustKeep === true ? { mustKeep: true } : {}),
    ...(_.trim(_.toString(c?.hook)) ? { hook: _.truncate(_.toString(c.hook), { length: 240 }) } : {}),
    ...(_.isArray(c?.keyPoints) && c.keyPoints.length ? { keyPoints: declaredNeeds?.length ? _.compact(_.map(c.keyPoints, (k: unknown) => _.toString(k))) : _.take(_.compact(_.map(c.keyPoints, (k: unknown) => _.truncate(_.toString(k), { length: 200 }))), 8) } : {}),
    ...(_.trim(_.toString(c?.handoff)) ? { handoff: _.truncate(_.toString(c.handoff), { length: 240 }) } : {}),
    ...(chapterStages(c?.stage ?? c?.stages).length ? { stages: chapterStages(c?.stage ?? c?.stages) } : {}),
  }));
  if (!declaredNeeds?.length) chapters = foldAdultChapters(chapters);
  if (_.isEmpty(chapters)) chapters = [{ id: MOTION_TEXT_C1, title: source.title, summary: MR.MOTION_TEXT_EMPTY, from: 0, to: source.sourceSeconds }];
  chapters = motionChapterKeyPoints(motionChapterRanges(chapters, source.sourceSeconds), source.sourceSeconds).chapters;
  const spans = _.map(chapters, (c, i) => Math.max(10, (c.to ?? chapters[i + 1]?.from ?? source.sourceSeconds) - (c.from ?? 0)));
  const meanSpan = _.mean(spans) || 1;
  const weighted = _.some(chapters, (c) => c.weight);
  const shares = _.map(chapters, (c, i) => (weighted ? (c.weight ?? 3) * (0.6 + 0.4 * Math.min(2.5, spans[i] / meanSpan)) : spans[i] / meanSpan));
  const total = _.sum(shares);
  chapters = _.map(chapters, (c, i) => ({ ...c, targetSeconds: Math.max(c.mustKeep ? 25 : 15, Math.round((shares[i] / total) * target)) }));
  if (!declaredNeeds?.length) chapters = motionMergeShortChapters(chapters, videoGenre);
  const used = new Set<string>();
  const cast: MotionCastMember[] = expandInitialCastNames(
    _.compact(
      _.map(_.castArray(raw?.cast || []), (m: any) => {
        if (!m?.name) return null;
        let key = slugKey(m.key || m.name);
        while (used.has(key)) key = MOTION_TEMPLATE_2_2(String(key));
        used.add(key);
        const gender = MP.FEMALE.test(_.toString(m.gender || m.suggested?.gender || MR.MOTION_TEXT_EMPTY)) ? MOTION_TEXT_FEMALE : MOTION_TEXT_MALE;
        return {
          key,
          name: _.truncate(_.toString(m.name), { length: 60 }),
          ...(m.appearanceOf ? { appearanceOf: slugKey(m.appearanceOf) } : {}),
          role: _.truncate(_.toString(m.role || MR.MOTION_TEXT_EMPTY), { length: 60 }),
          description: _.truncate(_.toString(m.description || MR.MOTION_TEXT_EMPTY), { length: 200 }),
          look: _.truncate(motionCleanLook(_.toString(m.look || m.appearance || MR.MOTION_TEXT_EMPTY)), { length: 320 }),
          gender,
          ...(_.includes(MOTION_AUDIO_DIRECTION.AGES, m.age) ? { age: m.age } : {}),
          ...(m.narrator === true ? { narrator: true } : {}),
          tags: puppetTags(m.tags),
          ...(cleanCharacterColors(m.colors) ? { colors: cleanCharacterColors(m.colors) } : {}),
        } as MotionCastMember;
      }),
    ),
  );
  const usedPlaces = new Set<string>();
  const placeNames = new Map<string, Set<string>>();
  const places: MotionPlace[] = _.take(
    _.compact(
      _.map(_.castArray(raw?.places || []), (p: any) => {
        if (!p) return null;
        const obj = _.isString(p) ? { key: p, name: p, description: p } : p;
        const rawKey = slugKey(obj.key || obj.name);
        const sameKey = placeNames.get(rawKey) || new Set<string>();
        if (sameKey.has(slugKey(obj.name || rawKey))) return null;
        placeNames.set(rawKey, sameKey.add(slugKey(obj.name || rawKey)));
        let key = rawKey;
        while (usedPlaces.has(key)) key = MOTION_TEMPLATE_2_2(String(key));
        usedPlaces.add(key);
        return { key, name: _.truncate(_.toString(obj.name || key), { length: 60 }), description: _.truncate(_.toString(obj.description || obj.name || key), { length: 500 }), interior: !!obj.interior, time: _.includes(TIMES, obj.time) ? obj.time : obj.interior ? MOTION_TEXT_TOON_CAT_INTERIOR : MOTION_TEXT_DAY, tags: puppetTags(obj.tags) } as MotionPlace;
      }),
    ),
    target > 1200 ? 18 : 10,
  );
  if (_.isEmpty(places)) places.push({ key: MOTION_TEXT_MAIN_PLACE, name: source.title, description: _.truncate(_.toString(raw?.logline || source.title), { length: 300 }), interior: false, time: MOTION_TEXT_DAY });
  const genre = normalizeMotionText(raw?.genre || MR.MOTION_TEXT_EMPTY, 80) || undefined;
  const genre2 = raw?.genre2 !== genre ? normalizeMotionText(raw?.genre2 || MR.MOTION_TEXT_EMPTY, 80) || undefined : undefined;
  return {
    ...(declaredNeeds
      ? {
          illustrationNeeds: declaredNeeds.map((need: any) => ({
            ...structuredClone(need),
            chapterId: chapterIds.get(need?.chapterId) || need?.chapterId,
            place: typeof need?.place === "string" ? slugKey(need.place) : need?.place,
            states: Array.isArray(need?.states) ? need.states.map((state: any) => ({ ...state, char: typeof state?.char === "string" ? slugKey(state.char) : state?.char })) : need?.states,
            objects: Array.isArray(need?.objects) ? need.objects.map((object: any) => ({ ...object, ...(typeof object?.owner === "string" ? { owner: slugKey(object.owner) } : {}) })) : need?.objects,
          })),
        }
      : {}),
    ...(motifs.length ? { motifs } : {}),
    title: _.truncate(_.toString(raw?.title || source.title), { length: 120 }),
    logline: _.truncate(_.toString(raw?.logline || MR.MOTION_TEXT_EMPTY), { length: 300 }),
    genre,
    genre2,
    factual: _.isBoolean(raw?.factual) ? raw.factual : undefined,
    characterMotion: raw?.characterMotion === true,
    referenceStyle: normalizeMotionReferenceStyle(raw?.referenceStyle),
    genreReason: _.truncate(_.toString(raw?.genreReason || MR.MOTION_TEXT_EMPTY), { length: 200 }) || undefined,
    ...(raw?.videoDna ? { videoDna: raw.videoDna } : { creativeBlueprint: normalizeCreativeBlueprint(raw?.creativeBlueprint) }),
    ...(Object.hasOwn(MOTION_SFX_MOODS, _.toString(raw?.sfxMood)) ? { sfxMood: _.toString(raw.sfxMood) } : {}),
    look: pickEnum(MOTION_GEN_LOOKS, raw?.look, MR.MOTION_TEXT_CLEAN),
    accent: MP.HEX_COLOR.test(_.toString(raw?.accent)) ? raw.accent : MOTION_TEXT_FFB070,
    era: _.truncate(_.toString(raw?.era || MR.MOTION_TEXT_EMPTY), { length: 120 }),
    chapters,
    cast,
    ...(motionAnalysisGroups(raw?.groups) ? { groups: motionAnalysisGroups(raw?.groups) } : {}),
    places,
    facts: _.take(
      _.map(_.castArray(raw?.facts || []), (f: any) => ({ claim: _.toString(f?.claim), status: pickEnum([MOTION_TEXT_OK, MOTION_TEXT_UNCERTAIN, MOTION_TEXT_WRONG] as const as any, f?.status, MOTION_TEXT_UNCERTAIN), note: _.toString(f?.note || MR.MOTION_TEXT_EMPTY) })),
      40,
    ),
  };
};
const chapterOutline = (analysis: MotionStoryAnalysis, chapter: MotionChapter): string => {
  const idx = _.findIndex(analysis.chapters, { id: chapter.id });
  if (!_.some(analysis.chapters, (c) => c.hook || c.keyPoints?.length || c.handoff)) return MR.MOTION_TEXT_EMPTY;
  const prev = idx > 0 ? analysis.chapters[idx - 1] : undefined;
  const next = analysis.chapters[idx + 1];
  const series = analysis.series;
  const openingStyles: readonly string[] = OPENING_STYLES;
  const others = _.compact(_.map(analysis.chapters, (c, i) => (i === idx ? null : MR.MOTION_TEMPLATE_SYMBOL_312(c.id, c.title, c.keyPoints?.length ? [c.summary, ...c.keyPoints].filter(Boolean).join(MR.MOTION_TEXT_SYMBOL_56) : c.hook || c.handoff || c.summary)))).join(MR.MOTION_TEXT_SYMBOL_27);
  return [
    MR.MOTION_TEXT_WHOLE_VIDEO_OUTLINE_PLANNED_ONCE_FOLLOW_IT_SO_THE_CHAPTERS_READ_A,
    MR.MOTION_TEMPLATE_THIS_CHAPTER_HOOK_MUST_COVER_ENDS_BY_HANDING_OVER(idx + 1, analysis.chapters.length, chapter.hook || MR.MOTION_TEXT_SYMBOL_19, (chapter.keyPoints || []).join(MR.MOTION_TEXT_SYMBOL_56) || chapter.summary, chapter.handoff || (next ? MR.MOTION_TEMPLATE_TOWARD(next.title) : MR.MOTION_TEXT_THE_ENDING)),
    prev ? MR.MOTION_TEMPLATE_THE_PREVIOUS_CHAPTER_ENDED_WITH_OPEN_AS_ITS_NATURAL_CONTINUATION_(prev.handoff || prev.summary) : series?.previous ? MOTION_SERIES_PROMPT.OPENING(series.index + 1, series.count, series.previous) : MR.MOTION_TEXT_THIS_IS_THE_OPENING_CHAPTER_ESTABLISH_THE_ESSENTIAL_CONTEXT_IN_TH,
    next ? MR.MOTION_TEMPLATE_THE_NEXT_CHAPTER_STARTS_WITH_DO_NOT_COVER_ITS_POINTS(next.title, next.hook || next.summary) : series?.next ? MOTION_SERIES_PROMPT.CLOSING(series.next) : MR.MOTION_TEXT_THIS_IS_THE_FINAL_CHAPTER_DELIVER_THE_CONCLUSION,
    idx > 0 ? MR.MOTION_TEMPLATE_FIRST_LINE_STYLE_UNLESS_THE_PLANNED_HOOK_CLEARLY_NEEDS_ANOTHER_OP(openingStyles[(idx - 1) % openingStyles.length]) : MR.MOTION_TEXT_EMPTY,
    MR.MOTION_TEMPLATE_POINTS_COVERED_BY_OTHER_CHAPTERS_DO_NOT_REPEAT_THEM(_.truncate(others, { length: 3500 })),
  ]
    .filter(Boolean)
    .join(MR.MOTION_TEXT_SYMBOL_27);
};
interface MotionChapterWriteOptions {
  repairState?: { rejected: number; errors: string[] };
  language: string;
  multiVoice?: boolean;
  exec: MotionAiExecution;
  signal?: AbortSignal;
  log?: MotionAiLog;
  previous?: MotionBeat[];
  history?: MotionBeat[];
  previousSummary?: string;
  isFirst: boolean;
  isLast: boolean;
  ai?: typeof runMotionAi;
  speechRate?: number;
  draft?: MotionChapterDraft;
  onDraft?: (draft: MotionChapterDraft) => void;
  durationRepair?: boolean;
  durationRepairScope?: string;
  existing?: MotionBeat[];
  section?: string;
}
export const writeChapterBeats = async (source: MotionStorySource, analysis: MotionStoryAnalysis, chapter: MotionChapter, opts: MotionChapterWriteOptions): Promise<MotionBeat[]> => {
  opts.signal?.throwIfAborted();
  const expectedUnits = (chapter.targetSeconds || 120) * (opts.speechRate || (opts.language !== MOTION_TEXT_EN ? MOTION_STORY_CONFIG.VI_SYLLABLES_PER_SECOND : MOTION_STORY_CONFIG.EN_WORDS_PER_SECOND));
  const sourceText = sourceSlice(source, chapter.from, chapter.to);
  const inputKey = motionInputKey([chapter, analysis, sourceText, opts.language, opts.exec, opts.speechRate, opts.previous, opts.history, opts.previousSummary, opts.isFirst, opts.isLast]);
  const continuing = opts.draft?.inputKey === inputKey;
  const parts = continuing && opts.draft?.partition ? opts.draft.partition : motionChapterParts(chapter, analysis, sourceText, expectedUnits, continuing && opts.draft?.parts ? PROMPT.CHAPTER_OUTPUT_UNITS : undefined);
  if (!parts.length || opts.durationRepair || (opts.draft && !opts.draft.parts)) return writeChapterBeatsPart(source, analysis, chapter, opts);
  const drafts = opts.draft?.inputKey === inputKey ? structuredClone(opts.draft.parts || {}) : {};
  const save = () =>
    opts.onDraft?.({
      inputKey,
      partition: structuredClone(parts),
      rows: [],
      pending: parts.flatMap((_part, index) => (drafts[String(index)]?.pending.length ? drafts[String(index)].pending.map((row) => ({ ...row, id: String(index) + RT_SHARED.SYMBOL_E7AC07 + row.id })) : drafts[String(index)]?.rows.length ? [] : [{ id: String(index), fields: [...CHAPTER_REPAIR.FIELDS] }])),
      parts: structuredClone(drafts),
    });
  save();
  opts.log?.(PROMPT.CHAPTER_PART_LOG(chapter.id, parts.length));
  const completed: MotionBeat[] = [];
  for (const [index, part] of parts.entries()) {
    opts.signal?.throwIfAborted();
    const written = completed.map((beat) => beat.narration.trim()).filter(Boolean);
    const recent: string[] = [];
    for (const line of [...written].reverse()) {
      if (recent.join(" ").length + line.length > PROMPT.CHAPTER_PART_WRITTEN_CHARS) break;
      recent.unshift(line);
    }
    const section = [PROMPT.CHAPTER_PART(index, parts.length, part.points, written.at(-1), parts[index + 1]?.points[0]), recent.length ? PROMPT.CHAPTER_PART_WRITTEN(recent) : ""].filter(Boolean).join(MR.MOTION_TEXT_SYMBOL_27);
    const partChapter = { ...chapter, targetSeconds: part.seconds };
    const partSource = { ...source, text: part.source, segments: [{ t: chapter.from || 0, text: part.source }] };
    const result = await writeChapterBeatsPart(partSource, analysis, partChapter, {
      ...opts,
      section,
      isFirst: opts.isFirst && index === 0,
      isLast: opts.isLast && index === parts.length - 1,
      previous: [...(opts.previous || []), ...completed],
      history: [...(opts.history || opts.previous || []), ...completed],
      draft: drafts[String(index)],
      onDraft: (draft) => {
        drafts[String(index)] = draft;
        save();
      },
    });
    completed.push(...result);
  }
  return normalizeBeats(completed, chapter.id, analysis);
};
const writeChapterBeatsPart = async (source: MotionStorySource, analysis: MotionStoryAnalysis, chapter: MotionChapter, opts: MotionChapterWriteOptions): Promise<MotionBeat[]> => {
  const isVi = opts.language !== MOTION_TEXT_EN;
  const seconds = chapter.targetSeconds || 120;
  const units = Math.round(seconds * (opts.speechRate || (isVi ? MOTION_STORY_CONFIG.VI_SYLLABLES_PER_SECOND : MOTION_STORY_CONFIG.EN_WORDS_PER_SECOND)) * MOTION_STORY_CONFIG.LENGTH_SAFETY);
  const timeBeats = Math.max(2, Math.round(seconds / MOTION_STORY_CONFIG.TARGET_BEAT_SECONDS));
  const beatsWanted = motionChapterContentBeats(sourceSlice(source, chapter.from, chapter.to), chapter.keyPoints?.length || 0, timeBeats);
  const thinSource = beatsWanted < timeBeats * TIMELINE.CONTENT.THIN_RATIO;
  if (thinSource && !opts.durationRepair) opts.log?.(TIMELINE.CONTENT.LOG(chapter.id, beatsWanted, timeBeats));
  const language = isVi ? MOTION_TEXT_VIETNAMESE : MOTION_TEXT_ENGLISH;
  const unitName = isVi ? MOTION_TEXT_VIETNAMESE_SYLLABLES_WORDS : MOTION_TEXT_WORDS;
  const prev = opts.previous?.length ? _.map(_.takeRight(opts.previous, PROMPT.CHAPTER_PREVIOUS_BEATS), (b) => MOTION_TEMPLATE_SYMBOL_53(String(b.narration))).join(MOTION_TEXT_SYMBOL_27) : opts.previousSummary ? MOTION_TEMPLATE_SYMBOL_53(String(opts.previousSummary)) : MR.MOTION_TEXT_EMPTY;
  const prompt = MOTION_GEN_CHAPTER_PROMPT({
    preamble: MR.MOTION_TEMPLATE_SYMBOL_315(productionPreamble(analysis, MR.MOTION_TEXT_STORY, false, true), SOURCE_READING_RULES),
    role: PROMPT.CHAPTER_ROLE,
    outline: [chapterOutline(analysis, chapter), opts.section].filter(Boolean).join(MR.MOTION_TEXT_SYMBOL_27),
    genre: motionVideoGenreStyleGuide(analysis.videoGenre),
    title: analysis.title,
    logline: analysis.logline,
    chapterId: chapter.id,
    chapterTitle: chapter.title,
    chapterSummary: chapter.summary,
    languageNote: [MR.MOTION_TEMPLATE_WRITE_NATURAL((analysis.videoDna || analysis.creativeBlueprint)?.narrative.voice || MR.MOTION_TEXT_USE_THE_VOICE_APPROPRIATE_TO_THIS_INPUT, language), motionStoryLanguageGuide(opts.language, false, true)].filter(Boolean).join(MR.MOTION_TEXT_SYMBOL_27),
    language,
    units,
    unitName,
    seconds,
    beats: beatsWanted,
    perBeat: Math.max(8, Math.round(units / timeBeats)),
    firstNote: opts.isFirst ? (analysis.series?.previous ? MOTION_SERIES_PROMPT.FIRST(analysis.series.index + 1, analysis.series.count, analysis.series.previous) : MR.MOTION_TEXT_OPEN_ACCORDING_TO_THE_PROJECT_S_NARRATIVE_STRUCTURE_NO_COMPULSORY) : MR.MOTION_TEXT_EMPTY,
    lastNote: opts.isLast ? (analysis.series?.next ? MOTION_SERIES_PROMPT.LAST(analysis.series.index + 1, analysis.series.count, analysis.series.next) : MR.MOTION_TEXT_END_ACCORDING_TO_THE_PROJECT_S_NARRATIVE_STRUCTURE_NO_COMPULSORY_) : MR.MOTION_TEXT_EMPTY,
    previous: prev ? MOTION_TEMPLATE_CONTINUE_NATURALLY_FROM_THE_PREVIOUS_CHAPTER_WHICH_ENDED_2(String(prev)) : MR.MOTION_TEXT_EMPTY,
    rules: _.compact([
      analysis.visualSettings?.mode === RT_SHARED.REMOTION || closedPuppetPackId(analysis.stylePreset) ? PROMPT.CHAPTER_SCENES : MOTION_GEN_STORYBOARD_RULES(language),
      MOTION_CAST_NAMES.RULE,
      opts.multiVoice === false ? PROMPT.CHAPTER_SINGLE_VOICE : PROMPT.CHAPTER_VOICE,
      motionStoryEventLedger(opts.history || opts.previous),
      TIMELINE.KEYPOINT.SOURCE_PRIORITY,
      motionVideoGenreStageRule(analysis.videoGenre, chapter.stages) || null,
      thinSource ? TIMELINE.CONTENT.RULE(beatsWanted) : null,
      MOTION_AUDIO_DIRECTION.CONTEXT + stringifyJson(_.pick(motionAudioDirection(null, analysis), [RT_SERVER.MODE, RT_SERVER.FACTUAL, RT_SERVER.NARRATIONSTYLE, RT_SERVER.DIALECT])),
      analysis.visualSettings?.mode !== RT_SHARED.REMOTION && analysis.illustrationNeeds?.some((need) => need.chapterId === chapter.id) ? PROMPT.ILLUSTRATION_NEEDS + stringifyJson(analysis.illustrationNeeds.filter((need) => need.chapterId === chapter.id).map(({ evidence, place, states, objects, features }) => ({ evidence, place, states, objects, features }))) : null,
      analysis.visualSettings?.mode === RT_SHARED.REMOTION ? PROMPT.CHAPTER_REMOTION : puppetPackChapterCapabilities(analysis.stylePreset),
    ] as string[]).join(MR.MOTION_TEXT_SYMBOL_27),
    cast: stringifyJson(analysis.cast.map((member) => ({ ..._.pick(member, [RT_SHARED.KEY, RT_SHARED.NAME, RT_SERVER.ALIAS, RT_SERVER.ROLE, RT_SHARED.GENDER, RT_SHARED.AGE, RT_SERVER.APPEARANCEOF]), ...(member.key === motionNarratorCastKey(analysis) ? { narrationSpeaker: MOTION_VOICE.NARRATOR } : {}) }))),
    places: _.map(analysis.places, (p) => MOTION_TEMPLATE_SYMBOL_55(String(p.key), String(p.name), String(p.description))).join(MOTION_TEXT_SYMBOL_27),
    transcript: sourceSlice(source, chapter.from, chapter.to),
  });
  const factual = (analysis.videoDna?.format?.factual ?? analysis.factual) !== false && source.kind !== MR.MOTION_TEXT_BRIEF;
  const quotesIndex = factual ? transcriptIndex(source.text) : null;
  const request = prompt;
  const expectedUnits = seconds * (opts.speechRate || (isVi ? MOTION_STORY_CONFIG.VI_SYLLABLES_PER_SECOND : MOTION_STORY_CONFIG.EN_WORDS_PER_SECOND));
  const shortVideo = seconds >= QA.DURATION_SHORT_REPAIR_MIN_SECONDS && seconds <= QA.DURATION_SHORT_REPAIR_MAX_SECONDS;
  const repairTolerance = MOTION_PRODUCTION.DURATION_TEXT_TOLERANCE;
  const spokenOf = (list: MotionBeat[]) => list.reduce((sum, beat) => sum + beat.narration.split(MP.WHITESPACE).filter(Boolean).length, 0);
  const missingNarration = (row?: Record<string, any>): boolean => typeof row?.narration !== "string" || !row.narration.trim();
  const durationScope = opts.durationRepairScope ? [CHAPTER_REPAIR.DURATION_REVISION, opts.durationRepairScope].join(PROMPT.SEPARATOR) : CHAPTER_REPAIR.DURATION_REVISION;
  const durationRevision = opts.durationRepair ? [durationScope] : [];
  const inputKey = motionInputKey([request, expectedUnits, ...durationRevision]);
  const perBeat = Math.max(8, Math.round(units / timeBeats));
  const voiceRule = opts.multiVoice === false ? PROMPT.CHAPTER_SINGLE_VOICE : PROMPT.CHAPTER_VOICE;
  const alternateRequest = request.replace(voiceRule, opts.multiVoice === false ? PROMPT.CHAPTER_VOICE : PROMPT.CHAPTER_SINGLE_VOICE);
  const compatibleKeys = [request, alternateRequest].flatMap((question) => [question, question.replace(QA.CHAPTER_LENGTH_RULE(units, unitName, seconds, beatsWanted, perBeat), QA.LEGACY_CHAPTER_LENGTH_RULE(units, unitName, seconds, beatsWanted, perBeat))]).map((question) => motionInputKey([question, expectedUnits, ...durationRevision]));
  let draft = opts.draft && compatibleKeys.includes(opts.draft.inputKey) ? { ...structuredClone(opts.draft), inputKey } : undefined;
  if (!draft && opts.durationRepair && opts.existing?.length) {
    const rows = structuredClone(opts.existing);
    draft = { inputKey, rows, pending: motionChapterPending(rows, expectedUnits, repairTolerance, shortVideo, opts.multiVoice), ...(opts.repairState ? { repairState: structuredClone(opts.repairState) } : {}) };
  }
  if (opts.durationRepair && draft?.repairState) draft.repairState = recoverMotionAiContractState(draft.repairState, durationScope);
  const assess = (raw: any, restoring = false) => {
    const before = draft;
    let repaired = 0;
    const rawBeats = mergeMotionChapterDraft(opts.durationRepair ? normalizeMotionDurationResponse(raw) : raw, chapter.id, draft).map((beat): Record<string, any> => {
      const row = { ...beat, ...(beat.utterances !== undefined ? { utterances: normalizeMotionNarratorSpeakers(beat.utterances, motionNarratorCastKey(analysis)) } : {}) };
      const fixed = repairMotionChapterSpeech(
        row,
        analysis.cast.map((member) => member.key),
      );
      if (fixed !== row) repaired++;
      return fixed;
    });
    if (repaired) opts.log?.(CHAPTER_REPAIR.SPEECH_REPAIRED_LOG(chapter.id, repaired));
    const pending = motionChapterPending(rawBeats, opts.durationRepair && restoring ? expectedUnits : undefined, opts.durationRepair ? repairTolerance : undefined, shortVideo, opts.multiVoice);
    if (opts.durationRepair && !restoring && before)
      for (const item of before.pending) {
        if (item.targetUnits === undefined) continue;
        const old = before.rows.find((row) => row.id === item.id);
        const next = rawBeats.find((row) => row.id === item.id);
        if (
          String(old?.narration || "")
            .trim()
            .replace(/\s+/gu, RT_SHARED.SYMBOL_36A9E7) !==
          String(next?.narration || "")
            .trim()
            .replace(/\s+/gu, RT_SHARED.SYMBOL_36A9E7)
        )
          continue;
        const existing = pending.find((row) => row.id === item.id);
        if (existing) Object.assign(existing, { fields: [...new Set([...existing.fields, ...item.fields])], targetUnits: item.targetUnits });
        else pending.push(structuredClone(item));
      }
    const responseIssues = motionChapterResponseIssues(
      rawBeats,
      analysis.cast.map((member) => member.key),
      analysis.places.map((place) => place.key),
      !!closedPuppetPackId(analysis.stylePreset),
      opts.multiVoice,
    );
    for (const item of responseIssues) {
      const fields = [...new Set(item.issues.map((issue) => issue.path.split(/[.\[]/)[0]))];
      const existing = pending.find((row) => row.id === item.id);
      if (existing) existing.fields = [...new Set([...existing.fields, ...fields])];
      else pending.push({ id: item.id, fields });
    }
    draft = { inputKey, rows: rawBeats, pending, ...(draft?.repairState ? { repairState: draft.repairState } : {}) };
    opts.onDraft?.(structuredClone(draft));
    const normalized = normalizeBeats(rawBeats, chapter.id, analysis);
    if (normalized.length < 1) return { value: undefined, errors: [MOTION_TEXT_CHUONG_KHONG_CO_BEAT_NAO_2] };
    const fixed = quotesIndex && quoteErrors(rawBeats, quotesIndex).length ? unattributeUnverifiedQuotes(normalized, quotesIndex) : { beats: normalized, changed: 0 };
    if (fixed.changed) opts.log?.(MR.MOTION_TEMPLATE_BO_GHI_TEN_CAU_TRICH_KHONG_CO_TRONG_NGUON(fixed.changed));
    const beats = fixed.beats;
    const spokenUnits = spokenOf(beats);
    if (expectedUnits > 0 && (spokenUnits < expectedUnits * QA.CHAPTER_MIN_RATIO || spokenUnits > expectedUnits * QA.CHAPTER_MAX_RATIO)) opts.log?.(QA.CHAPTER_LENGTH_WARNING(chapter.id, spokenUnits, expectedUnits));
    const advisory = analysis.videoDna ? rawBeats.flatMap((beat: any, i: number) => (!beat.visual || beat.visual === MR.MOTION_TEXT_SCENE ? scenePlanErrors(beat.scenePlan).map((error) => MR.MOTION_TEMPLATE_BEAT_2(i + 1, error)) : [])).slice(0, 6) : [];
    if (advisory.length) opts.log?.(MOTION_QA_MESSAGES.ADVISORY(advisory));
    const problems: string[] = [];
    for (const item of responseIssues) problems.push(...item.issues.map((issue) => MOTION_RESPONSE_TEXT.EXPECTED(item.id + RT_SHARED.SYMBOL_CDB4EE + issue.path, issue.expected, issue.actual)));
    if (pending.some((item) => missingNarration(rawBeats.find((beat) => beat.id === item.id)))) problems.push(QA.NARRATION_MISSING);
    if (pending.some((item) => item.fields.length === 1 && item.fields[0] === RT_SHARED.UTTERANCES && !responseIssues.some((beat) => beat.id === item.id))) problems.push(QA.SPEECH_MISMATCH);
    if (opts.durationRepair && pending.some((item) => item.targetUnits !== undefined)) problems.push(QA.DURATION_REPAIR_REQUIRED(spokenUnits, seconds, expectedUnits));
    return { value: beats, errors: problems };
  };
  const repairPrompt = () =>
    draft?.rows.length
      ? motionChapterRepairPrompt(draft.rows, draft.pending, {
          title: analysis.title,
          logline: analysis.logline,
          language: opts.language,
          chapter: opts.durationRepair ? { id: chapter.id, title: chapter.title } : chapter,
          previous: prev,
          eventLedger: motionStoryEventLedger(opts.history || opts.previous),
          next: analysis.chapters[analysis.chapters.findIndex((item) => item.id === chapter.id) + 1],
          cast: analysis.cast.map((item) => _.pick(item, [RT_SHARED.KEY, RT_SHARED.NAME, RT_SERVER.ROLE, RT_SHARED.GENDER, RT_SHARED.AGE])),
          places: analysis.places.map((item) => _.pick(item, [RT_SHARED.KEY, RT_SHARED.NAME, RT_SERVER.DESCRIPTION])),
          responseIssues: motionChapterResponseIssues(
            draft.rows,
            analysis.cast.map((member) => member.key),
            analysis.places.map((place) => place.key),
            !!closedPuppetPackId(analysis.stylePreset),
            opts.multiVoice,
          ),
          multiVoice: opts.multiVoice !== false,
          ...(!opts.durationRepair ? { writingProfile: motionVideoGenreWritingProfile(analysis.videoGenre) } : {}),
          ...(factual && draft.pending.some((item) => missingNarration(draft!.rows.find((row) => row.id === item.id))) ? { source: sourceSlice(source, chapter.from, chapter.to) } : {}),
        })
      : request;
  if (draft?.rows.length) {
    const restored = assess({ beats: [] }, true);
    if (!restored.errors.length && restored.value) return restored.value;
    if (!opts.durationRepair && draft.repairState && draft.repairState.rejected >= CHAPTER_REPAIR.ATTEMPTS && draft.pending.length && draft.pending.every((item) => item.fields.length === 1 && item.fields[0] === RT_SHARED.UTTERANCES)) {
      const recovered = recoverMotionAiContractState(draft.repairState, CHAPTER_REPAIR.SPEECH_REVISION);
      if (recovered !== draft.repairState) {
        draft.repairState = recovered;
        opts.onDraft?.(structuredClone(draft));
        opts.log?.(CHAPTER_REPAIR.SPEECH_RECOVERY_LOG(chapter.id));
      }
    }
  }
  const contract: MotionAiResponseContract = {
    attempts: CHAPTER_REPAIR.ATTEMPTS,
    targetIds: [chapter.id],
    state: draft?.repairState,
    checkpoint: (state) => {
      if (draft) {
        draft.repairState = state;
        opts.onDraft?.(structuredClone(draft));
      }
    },
    start: repairPrompt,
    assess,
    repair: repairPrompt,
    failure: (errors) => new Error(errors.join(MR.MOTION_TEXT_SYMBOL_41)),
    rejected: async (raw, _value, errors) => {
      opts.log?.(MOTION_TEMPLATE_CHUONG_LOI_THU_LAI(String(chapter.id), errors.join(MR.MOTION_TEXT_SYMBOL_41)));
      if (opts.durationRepair) await writeMotionAiDebug(randomUUID(), { stage: MOTION_STORY_CONFIG.ARTIFACT_CHAPTER, chapterId: chapter.id, durationRepair: true, pending: draft?.pending, raw });
    },
  };
  return opts.ai ? requestMotionAiContract(request, opts.exec, (question) => opts.ai!(question, MOTION_STORY_CONFIG.ARTIFACT_CHAPTER, opts.exec, opts.signal, opts.log), contract, opts.signal) : runMotionAi(request, MOTION_STORY_CONFIG.ARTIFACT_CHAPTER, opts.exec, opts.signal, opts.log, undefined, 0, contract);
};
export const normalizeBeats = (rawBeats: any[], chapterId: string, analysis: MotionStoryAnalysis): MotionBeat[] => {
  const castKeys = _.map(analysis.cast, MOTION_TEXT_KEY);
  const placeKeys = _.map(analysis.places, MOTION_TEXT_KEY);
  const matchOf = <T extends { key: string; name: string }>(list: T[], raw: string): T | undefined => {
    const slug = slugKey(raw);
    if (!_.trim(raw)) return undefined;
    const exact = _.find(list, (entry) => entry.key === raw || entry.key === slug || slugKey(entry.name) === slug);
    if (exact || slug.length < MOTION_STORY_CONFIG.LOOSE_MATCH_MIN) return exact;
    const loose = _.filter(list, (entry) => slugKey(entry.name).includes(slug) || slug.includes(entry.key) || entry.key.includes(slug));
    return loose.length === 1 ? loose[0] : undefined;
  };
  const castOf = (k: string) => matchOf(analysis.cast, k)?.key;
  const placeOf = (k: string) => matchOf(analysis.places, k)?.key;
  const out: MotionBeat[] = [];
  const usedIds = new Set<string>();
  _.forEach(rawBeats, (b: any) => {
    const narration = fullCastNames(_.trim(_.toString(b?.narration || MR.MOTION_TEXT_EMPTY)), analysis.cast);
    if (!narration) return;
    const supplied = typeof b?.id === "string" && PROMPT.ID.VALID.test(b.id) ? b.id : undefined;
    const baseId = supplied || [chapterId, PROMPT.ID.PREFIX + motionInputKey([chapterId, narration, b?.sourceRange, b?.scenePlan?.purpose]).slice(0, PROMPT.ID.HASH_CHARS)].join(PROMPT.ID.SEPARATOR);
    let id = baseId,
      occurrence = 1;
    while (usedIds.has(id)) id = baseId + PROMPT.ID.SEPARATOR + ++occurrence;
    usedIds.add(id);
    const shots = _.filter(_.castArray(b?.shots || []), (sh) => _.isPlainObject(sh));
    const v = shots.length ? { ...shots[0], ...b, visual: b.visual || shots[0].visual } : b;
    const visual = pickEnum(VISUALS, v?.visual, MOTION_TEXT_SCENE);
    const beat: MotionBeat = { id, chapterId, narration, visual };
    const utterances = motionNarratorLines(normalizeMotionUtterances(b?.utterances, id, [MOTION_VOICE.NARRATOR, ...castKeys], beat.narration), motionNarratorCastKey(analysis), beat.narration);
    if (utterances.length) beat.utterances = _.map(utterances, (u) => ({ ...u, text: fullCastNames(u.text, analysis.cast) }));
    const sceneMood = normalizeMotionSceneMood(b?.sceneMood);
    if (sceneMood) beat.sceneMood = sceneMood;
    if (visual === MOTION_TEXT_SCENE) {
      const rawPlace = _.trim(_.toString(v?.place || v?.env || MR.MOTION_TEXT_EMPTY));
      const known = placeOf(rawPlace);
      beat.place = known || (rawPlace ? slugKey(rawPlace) : _.first(placeKeys));
      if (!known && rawPlace) beat.placeName = _.truncate(rawPlace, { length: 60 });
      const place = _.find(analysis.places, { key: beat.place });
      beat.time = pickEnum(TIMES, v?.time, (place?.time as string) || MOTION_TEXT_DAY);
      beat.weather = pickEnum(WEATHERS, v?.weather, MOTION_TEXT_NONE);
      beat.shot = pickEnum(SHOTS, v?.shot, MOTION_TEXT_MEDIUM);
      const castList = _.uniq(_.compact(_.map(_.castArray(v?.cast || v?.actors || []), (a: any) => castOf(_.toString(_.isPlainObject(a) ? a.cast || a.who : a)))));
      beat.cast = _.take(castList, 6);
      beat.scenePlan = normalizeScenePlan(v?.scenePlan);
      beat.action = _.truncate(_.toString(v?.action || v?.description || _.map(shots, MOTION_TEXT_ACTION).join(MOTION_TEXT_SYMBOL_13) || MR.MOTION_TEXT_EMPTY), { length: 400 });
      if (v?.label) beat.label = _.truncate(_.toString(v.label), { length: 48 });
    } else beat.data = _.isPlainObject(v?.data) ? v.data : {};
    const hud = normalizeMotionHud(b?.hud ?? v?.hud);
    if (hud) beat.hud = hud;
    if (b?.emphasis) beat.emphasis = true;
    out.push(beat);
  });
  return out;
};
