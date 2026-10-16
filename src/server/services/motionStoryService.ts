import { motionMusicMoodKey as musicMoodOf } from "../../lib/motionMusic.js";
import { MOTION_PATTERNS as MP } from "../../constants/motionPatterns.js";
import { STUDIO_RUNTIME as XRT } from "../../constants/studioRuntime.js";
import { CHAT_PLANNING_RUNTIME as C } from "../../constants/chatPlanningRuntime.js";
import { MOTION_REFERENCE_CONFIG, MOTION_REFERENCE_PROMPTS } from "../../constants/motionReference.js";
import { normalizeMotionReferenceStyle } from "../../lib/motionReference.js";
import { MOTION_STORY_VOICE_PROMPT, MOTION_VOICE } from "../../constants/motionVoice.js";
import { normalizeMotionUtterances } from "../../lib/motionVoice.js";
import { motionAudioContext } from "../../lib/motionAudioDirection.js";
import { withMotionReferenceFiles } from "./motionReferenceService.js";
import { withCachedMotionReferenceStyle } from "./motionReferenceCacheService.js";
import { MOTION_SCENE_LIBRARY } from "../../constants/motionSceneLibrary.js";
import { assignSceneLibrary, cleanSceneTags, isSceneAssetId, motionAssetStyleKey, saveSceneStyle, sceneLibraryCatalog, sceneTypeOf } from "./motionSceneLibraryService.js";
import { MOTION_SCENE_LIBRARY_MODES, type MotionSceneLibraryMode } from "../../constants/motionSceneCatalog.js";
import { cleanCharacterColors } from "../../lib/motionCharacterVariant.js";
import type { MotionStyleReference } from "../../types/motionVideo.js";
import * as MR from "../../constants/motionRuntime.js";
import { AsyncLocalStorage } from "async_hooks";
import { randomUUID } from "crypto";
import fs from "fs";
import { MOTION_HISTORY } from "../../constants/motionHistory.js";
import { normalizeMotionHud } from "../../lib/motionHistory.js";
import { motionVideoGenre, motionVideoGenreDirective, type MotionVideoGenre } from "../../constants/motionGenre.js";
import { MOTION_STYLE_PRESET_KEY, motionPresetReferenceStyle, motionStylePreset } from "../../constants/motionStylePresets.js";
import { MOTION_MUSIC, MOTION_MUSIC_MOODS } from "../../constants/motionMusic.js";
import _ from "lodash";
import path from "path";
import { CINEMATIC_CHAT_PLANNING_CONFIG } from "../../constants/index.js";
import { MOTION_GEN_ANALYSIS_PROMPT, MOTION_GEN_CHAPTER_PROMPT, MOTION_GEN_LOOKS, MOTION_GEN_PREAMBLE, MOTION_GEN_STORYBOARD_RULES } from "../../constants/motionGenPrompts.js";
import { normalizeMotionAnalysisResponse } from "../../lib/motionAnalysisResponse.js";
import {
  MOTION_TEMPLATE_2_2,
  MOTION_TEMPLATE_AI_TRA_LOI_KHONG_PHAI_JSON,
  MOTION_TEMPLATE_ARTIFACTTYPE_REQUESTID,
  MOTION_TEMPLATE_B,
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
  MOTION_TEMPLATE_SYMBOL_54,
  MOTION_TEMPLATE_SYMBOL_55,
  MOTION_TEMPLATE_YOUR_PREVIOUS_ANSWER_FAILED_RETURN_ONLY_THE_JSON,
  MOTION_TEXT_0,
  MOTION_TEXT_1_2,
  MOTION_TEXT_ABORT,
  MOTION_TEXT_ACTION,
  MOTION_TEXT_AERIAL,
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
  MOTION_TEXT_CHAPTER,
  MOTION_TEXT_CHUONG_KHONG_CO_BEAT_NAO_2,
  MOTION_TEXT_CLOSE,
  MOTION_TEXT_CO,
  MOTION_TEXT_CONTENTEDITABLE_TRUE,
  MOTION_TEXT_COUNTER,
  MOTION_TEXT_D,
  MOTION_TEXT_D_2,
  MOTION_TEXT_DAWN,
  MOTION_TEXT_DAY,
  MOTION_TEXT_DIAGNOSTICS,
  MOTION_TEXT_DUSK,
  MOTION_TEXT_EN,
  MOTION_TEXT_ENDING,
  MOTION_TEXT_ENGLISH,
  MOTION_TEXT_FEMALE,
  MOTION_TEXT_FFB070,
  MOTION_TEXT_FOG,
  MOTION_TEXT_FUNCTION,
  MOTION_TEXT_GOI_AI_QUA_API,
  MOTION_TEXT_HEADLINE,
  MOTION_TEXT_HIGH,
  MOTION_TEXT_ID_MODEL_RESPONSE_MESSAGE_CONTENT,
  MOTION_TEXT_INSERT,
  MOTION_TEXT_INTERIOR_DARK,
  MOTION_TEXT_KEY,
  MOTION_TEXT_KHONG,
  MOTION_TEXT_KHONG_TIM_THAY_NOI_DUNG_TRANSCRIPT_HOP_LE,
  MOTION_TEXT_LOW,
  MOTION_TEXT_MAIN_PLACE,
  MOTION_TEXT_MALE,
  MOTION_TEXT_MAP,
  MOTION_TEXT_MARKDOWN,
  MOTION_TEXT_MEDIUM,
  MOTION_TEXT_MESSAGE_CONTENT,
  MOTION_TEXT_MODEL_RESPONSE,
  MOTION_TEXT_MODEL_RESPONSE_TEXT,
  MOTION_TEXT_NIGHT,
  MOTION_TEXT_NOI_DUNG_CAU_CHUYEN_QUA_NGAN,
  MOTION_TEXT_NONE,
  MOTION_TEXT_NONE_2,
  MOTION_TEXT_NV,
  MOTION_TEXT_OK,
  MOTION_TEXT_OVER_SHOULDER,
  MOTION_TEXT_OVERCAST,
  MOTION_TEXT_PHONG_CHAT_DA_TRA_JSON_DAY_DU_NHUNG,
  MOTION_TEXT_QUOTE,
  MOTION_TEXT_RAIN,
  MOTION_TEXT_RICH_TEXTAREA,
  MOTION_TEXT_ROLE_ALERT,
  MOTION_TEXT_ROOMPAGE,
  MOTION_TEXT_SCENE,
  MOTION_TEXT_SNOW,
  MOTION_TEXT_STATS,
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
  MOTION_TEXT_TIMELINE,
  MOTION_TEXT_TITLE,
  MOTION_TEXT_TOON_CAT_INTERIOR,
  MOTION_TEXT_UNCERTAIN,
  MOTION_TEXT_USER,
  MOTION_TEXT_USER_QUERY,
  MOTION_TEXT_UTF8,
  MOTION_TEXT_VIETNAMESE,
  MOTION_TEXT_VIETNAMESE_SYLLABLES_WORDS,
  MOTION_TEXT_WIDE,
  MOTION_TEXT_WORDS,
  MOTION_TEXT_WRONG,
} from "../../constants/motionRuntime.js";
import { MOTION_STORY_CONFIG, MOTION_STORY_LENGTH_SECONDS } from "../../constants/motionVideo.js";
import { parseJson, stringifyJson } from "../../lib/jsonStringify.js";
import { productionPreamble } from "../../lib/motionDirection.js";
import { normalizeCreativeBlueprint } from "../../lib/motionCreativeBlueprint.js";
import { VIDEO_DNA_PLANNING_INSTRUCTIONS, VIDEO_DNA_PROFILE_INSTRUCTIONS, normalizeScenePlan, normalizeVideoDna, scenePlanErrors, VIDEO_SCENE_PLAN_INSTRUCTIONS, videoDnaErrors, videoDnaInstructions, videoDnaProfileErrors, videoDnaSourceKey } from "../../lib/motionVideoDna.js";
import { quoteErrors, SOURCE_READING_RULES, transcriptIndex, unattributeUnverifiedQuotes } from "../../lib/motionSourceClean.js";
import { getMotionErrorMessage, normalizeMotionText } from "../../lib/motionUtils.js";
import { AiPlanningChatModel, AiPlanningExecutionMode, AiPlanningFallbackProvider } from "../../types.js";
import { parseClaudeChatModel } from "../../constants/claudeChatModels.js";
import { DEEPSEEK_CHAT_MODES } from "../../constants/deepseekChat.js";
import { MotionStoryLength, type MotionAiExecution, type MotionBeat, type MotionCastMember, type MotionChapter, type MotionPlace, type MotionStoryAnalysis, type MotionStorySource, type MotionVideoDnaSettings } from "../../types/motionVideo.js";
import { beginChatPlanningRun, closeChatBrowserIfIdle, closeChatPlanningRoom, generatePlanningWithChatUi, prepareChatPlanningRoom } from "./chatUiPlanningService.js";
import { generateContentWithRetry } from "./geminiService.js";
import { cancelGlobalBrowserCleanup } from "./imageGeneratorService.js";
import { getMotionRootDirectory } from "./motionLibraryService.js";
import { AiTaskCapability } from "./taskRouterService.js";
import { MOTION_SFX_MOODS } from "../../constants/motionAudio.js";
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
  const a = from ?? 0,
    b = to ?? Infinity;
  const picked = _.filter(source.segments, (s) => s.t >= a - 0.5 && s.t < b);
  return _.map(_.isEmpty(picked) ? source.segments : picked, (s) => MOTION_TEMPLATE_SYMBOL_21(String(formatTs(s.t)), String(s.text))).join(MOTION_TEXT_SYMBOL_27);
};
export const extractJson = (raw: string): any => {
  const text = _.trim(_.toString(raw)).replace(MP.JSON_FENCE_START, MR.MOTION_TEXT_EMPTY).replace(MP.JSON_FENCE_END, MR.MOTION_TEXT_EMPTY);
  try {
    return parseJson(text);
  } catch {
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
const writeMotionAiDebug = async (requestId: string, data: Record<string, unknown>): Promise<void> => {
  try {
    const dir = path.join(getMotionRootDirectory(), MOTION_TEXT_AI_DEBUG);
    await fs.promises.mkdir(dir, { recursive: true });
    await fs.promises.writeFile(path.join(dir, MOTION_TEMPLATE_JSON(String(requestId))), stringifyJson({ at: new Date().toISOString(), requestId, ...data }, null, 2), MOTION_TEXT_UTF8);
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
          const body = (document.body?.innerText || motionBrowserTexts.MOTION_TEXT_EMPTY).replace(MP.WHITESPACE_GLOBAL, motionBrowserTexts.MOTION_TEXT_SYMBOL_13);
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
const salvageRoomJson = (text: string | undefined, artifactType: string): any => {
  if (!text || text.length < 40) return undefined;
  const parsed = salvageOnce(text, artifactType);
  return parsed ?? salvageOnce(escapeStrayQuotes(text), artifactType);
};
const salvageOnce = (text: string, artifactType: string): any => {
  try {
    const parsed = extractJson(text);
    if (!_.isPlainObject(parsed)) return undefined;
    const kind = _.toString(parsed.artifactType);
    if (kind && kind !== artifactType) return undefined;
    const keys = _.keys(parsed);
    return keys.length >= 3 ? parsed : undefined;
  } catch {
    return undefined;
  }
};
export interface MotionAiImage { name: string; mimeType: string; path: string; }
interface MotionAiRun { projectId: string; workerId: string; signal: AbortSignal; rooms: Map<string, AiPlanningFallbackProvider>; roomQueue: Promise<void>; counts: Record<string, number>; }
const motionAiRunStore = new AsyncLocalStorage<MotionAiRun>();
let motionAiSessions = 0;
let motionAiUsedBrowser = false;
let motionAiCleanup: Promise<boolean> | undefined;
export const closeMotionAiBrowserBeforeRender = async (): Promise<boolean> => {
  if (motionAiSessions) return false;
  if (motionAiCleanup) return motionAiCleanup;
  motionAiCleanup = (async () => {
    cancelGlobalBrowserCleanup();
    const closed = await closeChatBrowserIfIdle();
    if (closed) motionAiUsedBrowser = false;
    return closed;
  })();
  try {
    return await motionAiCleanup;
  } finally {
    motionAiCleanup = undefined;
  }
};
const closeMotionAiRoom = async (run: MotionAiRun, workerId: string): Promise<void> => {
  const provider = run.rooms.get(workerId);
  if (!provider) return;
  run.rooms.delete(workerId);
  await closeChatPlanningRoom({ provider, projectId: run.projectId, workerId }).catch(_.noop);
};
export const releaseMotionAiSession = async (log?: (s: string) => void): Promise<boolean> => {
  const run = motionAiRunStore.getStore();
  if (run) await Promise.allSettled(_.map([...run.rooms.keys()], (workerId) => closeMotionAiRoom(run, workerId)));
  if (motionAiSessions > 1 || !motionAiUsedBrowser) return false;
  cancelGlobalBrowserCleanup();
  const closed = await closeChatBrowserIfIdle().catch(() => false);
  if (closed) {
    motionAiUsedBrowser = false;
    log?.(MOTION_STORY_CONFIG.BROWSER_RELEASED);
  }
  return closed;
};
export const runInMotionAiSession = async <T>(runId: string, fn: () => Promise<T>, log?: (s: string) => void, keepBrowser = false): Promise<T> => {
  if (motionAiCleanup) await motionAiCleanup.catch(_.noop);
  motionAiSessions++;
  const projectId = MR.MOTION_TEMPLATE_SYMBOL_287(MOTION_STORY_CONFIG.PROJECT_ID_PREFIX, runId);
  const planningRun = beginChatPlanningRun(projectId, Date.now(), MOTION_STORY_CONFIG.WORKER_IDS[0]);
  const run: MotionAiRun = { projectId, workerId: MOTION_STORY_CONFIG.WORKER_IDS[0], signal: planningRun.signal, rooms: new Map(), roomQueue: Promise.resolve(), counts: {} };
  try {
    return await motionAiRunStore.run(run, fn);
  } finally {
    planningRun.complete();
    if (!_.isEmpty(run.counts)) log?.(MOTION_STORY_CONFIG.REQUEST_COUNT_LOG(run.counts));
    await Promise.allSettled(_.map([...run.rooms.keys()], (workerId) => closeMotionAiRoom(run, workerId)));
    motionAiSessions = Math.max(0, motionAiSessions - 1);
    if (!motionAiSessions && motionAiUsedBrowser && !keepBrowser) {
      await closeMotionAiBrowserBeforeRender().catch(_.noop);
    }
  }
};
export const mapMotionAiPool = async <T, R>(items: T[], worker: (item: T, index: number) => Promise<R>, limit: number = MOTION_STORY_CONFIG.AI_PARALLEL): Promise<R[]> => {
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
  const lanes = Math.max(1, Math.min(limit, items.length, MOTION_STORY_CONFIG.WORKER_IDS.length));
  await Promise.all(_.times(lanes, (laneIndex) => (parent ? motionAiRunStore.run({ ...parent, workerId: MOTION_STORY_CONFIG.WORKER_IDS[laneIndex] }, lane) : lane())));
  if (failure !== undefined) throw failure;
  return results;
};
const blockedRoomProviders = new Map<string, number>();
const countMotionRequest = (provider: string, log?: (s: string) => void): void => {
  const run = motionAiRunStore.getStore();
  if (!run) return;
  run.counts[provider] = (run.counts[provider] || 0) + 1;
  log?.(MOTION_STORY_CONFIG.REQUEST_COUNT_LOG(run.counts));
};
export const runMotionAi = async (prompt: string, artifactType: string, exec: MotionAiExecution, signal?: AbortSignal, log?: (s: string) => void, images?: MotionAiImage[], attempt = 0): Promise<any> => {
  const mode = pickEnum(_.values(AiPlanningExecutionMode), exec.mode, AiPlanningExecutionMode.ApiOnly);
  const provider = pickEnum(_.values(AiPlanningFallbackProvider), exec.provider, AiPlanningFallbackProvider.GeminiChat);
  const useRoom = mode !== AiPlanningExecutionMode.ApiOnly && provider !== AiPlanningFallbackProvider.Disabled;
  const requestId = MOTION_TEMPLATE_SYMBOL_5(String(artifactType), String(randomUUID().slice(0, 8)));
  const identity = MOTION_TEMPLATE_ARTIFACTTYPE_REQUESTID(String(artifactType), String(requestId));
  const fullPrompt = MOTION_TEMPLATE_MANDATORY_OUTPUT_RETURN_EXACTLY_ONE_VALID_JSON_OBJECT(String(prompt), String(identity));
  const runGeminiFallback = () => runMotionAi(prompt, artifactType, { ...exec, provider: AiPlanningFallbackProvider.GeminiChat, model: AiPlanningChatModel.GeminiFlash }, signal, log, images, 0);
  const switchTo = MOTION_STORY_CONFIG.ROOM_SWITCH[provider];
  const runSwitched = () => {
    log?.(MOTION_STORY_CONFIG.ROOM_SWITCH_LOG(provider, switchTo.provider));
    return runMotionAi(prompt, artifactType, { ...exec, provider: switchTo.provider as AiPlanningFallbackProvider, model: switchTo.model as AiPlanningChatModel }, signal, log, images, 0);
  };
  if (useRoom && provider !== AiPlanningFallbackProvider.GeminiChat && (blockedRoomProviders.get(provider) || 0) > Date.now()) return switchTo && (blockedRoomProviders.get(switchTo.provider as AiPlanningFallbackProvider) || 0) <= Date.now() ? runSwitched() : runGeminiFallback();
  let fallbackToGemini = false,
    fallbackToSwitch = false;
  if (useRoom) {
    const run = motionAiRunStore.getStore();
    const projectId = run?.projectId || MR.MOTION_TEMPLATE_SYMBOL_294(MOTION_STORY_CONFIG.PROJECT_ID_PREFIX, requestId);
    const workerId = run?.workerId;
    motionAiUsedBrowser = true;
    const roomCtrl = new AbortController();
    const relay = () => roomCtrl.abort();
    signal?.addEventListener(MOTION_TEXT_ABORT, relay, { once: true });
    run?.signal.addEventListener(MOTION_TEXT_ABORT, relay, { once: true });
    let timedOut = false;
    const watchdog = setTimeout(() => {
      timedOut = true;
      roomCtrl.abort();
    }, MOTION_STORY_CONFIG.ROOM_TIMEOUT_MS);
    let retryRoom = false;
    let roomOk = false;
    try {
      log?.(MOTION_TEMPLATE_GUI_YEU_CAU_TOI_PHONG_CHAT_AI_CAU(String(provider)));
      const model =
        provider === AiPlanningFallbackProvider.ClaudeChat
          ? parseClaudeChatModel(exec.model)
            ? (exec.model as AiPlanningChatModel)
            : AiPlanningChatModel.ClaudeAuto
          : provider === AiPlanningFallbackProvider.DeepSeekChat
            ? pickEnum(
                DEEPSEEK_CHAT_MODES.map((item) => item.value),
                exec.model,
                AiPlanningChatModel.DeepSeekAuto,
              )
            : pickEnum(_.values(AiPlanningChatModel), exec.model, AiPlanningChatModel.GeminiFlash);
      if (run && run.rooms.has(workerId!) && run.rooms.get(workerId!) !== provider) await closeMotionAiRoom(run, workerId!);
      if (run && !run.rooms.has(workerId!)) {
        const prepared = run.roomQueue.then(() => prepareChatPlanningRoom({ provider, model, prompt: MR.MOTION_TEXT_EMPTY, projectId, workerId, chromeHeadless: exec.chromeHeadless !== false, signal: roomCtrl.signal, allowDefaultGeminiModel: true }));
        run.roomQueue = prepared.catch(_.noop);
        run.rooms.set(workerId!, provider);
        await prepared;
      }
      countMotionRequest(provider, log);
      const r = await generatePlanningWithChatUi({ provider, model, prompt: fullPrompt, projectId, workerId, chromeHeadless: exec.chromeHeadless !== false, artifactType, requestId, signal: roomCtrl.signal, closeRoomOnComplete: !run, allowDefaultGeminiModel: true, attachments: images?.length ? _.map(images, (im) => ({ name: im.name, mimeType: im.mimeType, path: im.path })) : undefined });
      roomOk = true;
      return extractJson(r.text);
    } catch (caught: any) {
      if (signal?.aborted && !timedOut) throw caught;
      if (!switchTo && _.toString(caught?.message).includes(C.CLAUDE_MODEL_UNAVAILABLE_CODE)) throw caught;
      if (_.toString(caught?.message).includes(XRT.DEEPSEEK_MODEL_UNAVAILABLE_CODE)) throw caught;
      const diag = _.get(caught, MOTION_TEXT_DIAGNOSTICS) as { lastCandidate?: string; candidateChars?: number; busy?: boolean; identityMatch?: boolean; elapsedMs?: number; responseCount?: number; initialCount?: number } | undefined;
      const roomProbe = await probeRoomPage(_.get(caught, MOTION_TEXT_ROOMPAGE), requestId);
      await writeMotionAiDebug(requestId, { stage: artifactType, provider, error: _.toString(caught?.message), promptChars: fullPrompt.length, ...(diag || {}), room: roomProbe });
      if (diag) log?.(MOTION_TEMPLATE_CHAN_DOAN_PHONG_CHAT_PHAN_HOI_KY_TU(String(diag.candidateChars ?? 0), String(diag.busy ? MOTION_TEXT_CO : MOTION_TEXT_KHONG), String(diag.identityMatch ? MOTION_TEXT_CO : MOTION_TEXT_KHONG), String(Math.round((diag.elapsedMs || 0) / 1000))));
      if (diag?.lastCandidate && diag.lastCandidate.length < 400 && !MP.BRACE.test(diag.lastCandidate)) log?.(MOTION_TEMPLATE_AI_TRA_LOI_KHONG_PHAI_JSON(String(_.truncate(diag.lastCandidate, { length: 160 }))));
      const salvaged = salvageRoomJson(diag?.lastCandidate, artifactType);
      if (salvaged) {
        log?.(MOTION_TEXT_PHONG_CHAT_DA_TRA_JSON_DAY_DU_NHUNG);
        return salvaged;
      }
      const limited = !!switchTo && (_.toString(caught?.message) === CINEMATIC_CHAT_PLANNING_CONFIG.CLAUDE_RATE_LIMIT_ERROR || CINEMATIC_CHAT_PLANNING_CONFIG.CLAUDE_RATE_LIMIT_PATTERN.test(_.toString(diag?.lastCandidate)) || CINEMATIC_CHAT_PLANNING_CONFIG.CLAUDE_RATE_LIMIT_PATTERN.test(JSON.stringify(roomProbe || {})));
      if (limited) {
        blockedRoomProviders.set(provider, Date.now() + MOTION_STORY_CONFIG.ROOM_LIMIT_BLOCK_MS);
        log?.(MOTION_STORY_CONFIG.ROOM_LIMIT_LOG(provider, switchTo.provider));
        fallbackToSwitch = true;
      } else if (!switchTo && !timedOut && _.toString(caught?.message) === CINEMATIC_CHAT_PLANNING_CONFIG.PROVIDER_ERROR_RESPONSE_ERROR && attempt < MOTION_STORY_CONFIG.ROOM_PROVIDER_RETRIES) {
        retryRoom = true;
        log?.(MOTION_STORY_CONFIG.ROOM_RETRY_LOG);
      } else {
        const error = timedOut ? new Error(MOTION_TEMPLATE_PHONG_CHAT_AI_KHONG_TRA_KET_QUA_SAU(String(Math.round(MOTION_STORY_CONFIG.ROOM_TIMEOUT_MS / 60000)))) : caught;
        log?.(MOTION_TEMPLATE_PHONG_CHAT_LOI(String(_.truncate(_.toString(error?.message), { length: 140 }))));
        const blocked = !timedOut && provider !== AiPlanningFallbackProvider.GeminiChat && MOTION_STORY_CONFIG.ROOM_BLOCKED_RE.test(_.toString(error?.message));
        if (blocked) blockedRoomProviders.set(provider, Date.now() + MOTION_STORY_CONFIG.ROOM_BLOCK_MS);
        if (switchTo) fallbackToSwitch = true;
        else if (blocked) {
          log?.(MOTION_STORY_CONFIG.ROOM_FALLBACK_LOG(provider));
          fallbackToGemini = true;
        } else if (mode === AiPlanningExecutionMode.RoomOnly) throw error;
      }
    } finally {
      clearTimeout(watchdog);
      signal?.removeEventListener(MOTION_TEXT_ABORT, relay);
      run?.signal.removeEventListener(MOTION_TEXT_ABORT, relay);
      if (run) {
        if (!roomOk) await closeMotionAiRoom(run, workerId!);
      } else {
        await closeChatPlanningRoom({ provider, projectId }).catch(_.noop);
        if (!retryRoom) await closeChatBrowserIfIdle().catch(_.noop);
      }
      if (motionAiSessions || retryRoom) cancelGlobalBrowserCleanup();
    }
    if (retryRoom) return runMotionAi(prompt, artifactType, exec, signal, log, images, attempt + 1);
    if (fallbackToSwitch) return runSwitched();
    if (fallbackToGemini) return runGeminiFallback();
  }
  log?.(MOTION_TEXT_GOI_AI_QUA_API);
  countMotionRequest(MOTION_STORY_CONFIG.API_PROVIDER, log);
  const contents = images?.length ? [{ role: MOTION_TEXT_USER, parts: [{ text: fullPrompt }, ..._.map(images, (im) => ({ inlineData: { mimeType: im.mimeType, data: fs.readFileSync(im.path).toString(MOTION_TEXT_BASE64) } }))] }] : fullPrompt;
  const response = await generateContentWithRetry({ contents, task: { capability: AiTaskCapability.ScriptWriting }, config: { responseMimeType: MOTION_TEXT_APPLICATION_JSON } });
  const text = _.isString(response) ? response : response?.candidates?.[0]?.content?.parts?.[0]?.text || response?.text || MR.MOTION_TEXT_EMPTY;
  return extractJson(text);
};
const slugKey = (s: string): string => _.trim(_.deburr(_.toString(s).replace(MP.VIETNAMESE_D_LOWER, MOTION_TEXT_D).replace(MP.VIETNAMESE_D_UPPER, MOTION_TEXT_D_2)).toLowerCase().replace(MP.SLUG_LOWER_INVALID, MOTION_TEXT_SYMBOL_30), MOTION_TEXT_SYMBOL_30).slice(0, 24) || MOTION_TEXT_NV;
const TIMES = [MOTION_TEXT_DAY, MOTION_TEXT_DUSK, MOTION_TEXT_NIGHT, MOTION_TEXT_DAWN, MOTION_TEXT_OVERCAST, MOTION_TEXT_TOON_CAT_INTERIOR, MOTION_TEXT_INTERIOR_DARK];
const WEATHERS = [MOTION_TEXT_NONE, MOTION_TEXT_RAIN, MOTION_TEXT_SNOW, MOTION_TEXT_FOG];
const SHOTS = [MOTION_TEXT_WIDE, MOTION_TEXT_MEDIUM, MOTION_TEXT_CLOSE, MOTION_TEXT_OVER_SHOULDER, MOTION_TEXT_LOW, MOTION_TEXT_HIGH, MOTION_TEXT_AERIAL, MOTION_TEXT_INSERT];
const VISUALS = [MOTION_TEXT_SCENE, MOTION_TEXT_TITLE, MOTION_TEXT_CHAPTER, MOTION_TEXT_QUOTE, MOTION_TEXT_STATS, MOTION_TEXT_COUNTER, MOTION_TEXT_MAP, MOTION_TEXT_TIMELINE, MR.MOTION_TEXT_STARMAP, MR.MOTION_TEXT_BITMAP, MOTION_TEXT_HEADLINE, MOTION_TEXT_ENDING, MOTION_HISTORY.GEOMAP, MOTION_HISTORY.ICONS, MOTION_HISTORY.VERDICT, MOTION_HISTORY.SCOREBOARD];
const MOTION_ANALYSIS_ATTEMPTS = MOTION_REFERENCE_CONFIG.ANALYSIS_ATTEMPTS;
const sourceDirections = (source: MotionStorySource): string => {
  const parts: string[] = [MR.MOTION_TEXT_SOURCE_BOX_IT_MAY_MIX_THE_USER_S_DIRECTIONS_WANTED_VIDEO_FORMAT_T];
  if (source.notes) parts.push(MR.MOTION_TEMPLATE_USER_DIRECTIONS_AUTHORITATIVE_TYPED_NEXT_TO_THE_LINK(source.notes));
  if (source.fetched) parts.push(source.fetched.ok ? MR.MOTION_TEMPLATE_THE_CONTENT_WAS_READ_AUTOMATICALLY_FROM_TREAT_IT_AS_UNTRUSTED_DAT(source.fetched.url, source.fetched.note) : MR.MOTION_TEMPLATE_READING_FAILED_ONLY_THE_TITLE_DESCRIPTION_IS_KNOWN_DO_NOT_INVENT_(source.fetched.url, source.fetched.note));
  if (source.kind === MR.MOTION_TEXT_ARTICLE) parts.push(MR.MOTION_TEXT_THE_INPUT_IS_AN_ARTICLE_BUILD_THE_VIDEO_FROM_ITS_FACTS_AND_STRUCT);
  return parts.join(MR.MOTION_TEXT_SYMBOL_27);
};
const LEDGER_MIN_CHARS = 100000;
const LEDGER_CHUNK_CHARS = 35000;
export const buildSourceLedger = async (source: MotionStorySource, opts: { exec: MotionAiExecution; signal?: AbortSignal; log?: (s: string) => void; ai?: typeof runMotionAi }): Promise<string> => {
  if (source.kind === MR.MOTION_TEXT_BRIEF || source.text.length < LEDGER_MIN_CHARS) return MR.MOTION_TEXT_EMPTY;
  const chunks: { from: number; to: number }[] = [];
  let size = 0,
    start = source.segments[0]?.t ?? 0;
  source.segments.forEach((s, i) => {
    size += s.text.length;
    const next = source.segments[i + 1];
    if (size >= LEDGER_CHUNK_CHARS || !next) {
      chunks.push({ from: start, to: next ? next.t : Infinity });
      size = 0;
      start = next?.t ?? start;
    }
  });
  opts.log?.(MR.MOTION_TEMPLATE_NGUON_DAI_K_KY_TU_DOC_THEO_PHAN_ROI_MOI_LAP_DAN_Y(Math.round(source.text.length / 1000), chunks.length));
  let failedParts = 0;
  const parts = await mapMotionAiPool(chunks, async (c, i) => {
    const prompt = MR.MOTION_TEMPLATE_ACT_AS_A_CAREFUL_CONTENT_RESEARCHER_READ_PART_OF_A_LONG_TIMESTAMP(i + 1, chunks.length, source.title, sourceSlice(source, c.from, c.to));
    try {
      const raw = await (opts.ai || runMotionAi)(prompt, MR.MOTION_TEXT_MOTION_STORY_LEDGER, opts.exec, opts.signal, opts.log);
      const lines = _.compact(
        _.map(_.castArray(raw?.events || []), (e: any) => {
          const point = _.trim(_.toString(e?.point));
          if (!point) return null;
          const who = _.trim(_.toString(e?.who)),
            quote = _.trim(_.toString(e?.quote));
          return MR.MOTION_TEMPLATE_SYMBOL_303(_.toString(e?.t || MR.MOTION_TEXT_EMPTY), point, who ? MR.MOTION_TEMPLATE_SYMBOL_339(who) : MR.MOTION_TEXT_EMPTY, quote ? MR.MOTION_TEMPLATE_SYMBOL_340(quote) : MR.MOTION_TEXT_EMPTY).trim();
        }),
      );
      if (lines.length) return lines.join(MR.MOTION_TEXT_SYMBOL_27);
    } catch (error) {
      if (opts.signal?.aborted) throw error;
    }
    failedParts++;
    return _.truncate(sourceSlice(source, c.from, c.to), { length: 12000 });
  });
  opts.log?.(MR.MOTION_TEMPLATE_SO_SU_KIEN_PHAN(chunks.length, failedParts ? MR.MOTION_TEMPLATE_PHAN_DUNG_TRICH_DOAN_GOC(failedParts) : MR.MOTION_TEXT_EMPTY));
  return parts.map((p, i) => MR.MOTION_TEMPLATE_PART(i + 1, chunks.length, p)).join(MR.MOTION_TEXT_SYMBOL_27);
};
const analyzeReferenceStyle = async (images: MotionAiImage[], opts: { exec: MotionAiExecution; signal?: AbortSignal; log?: (s: string) => void; ai?: typeof runMotionAi }): Promise<MotionStoryAnalysis["referenceStyle"]> => {
  for (let attempt = 0; attempt < MOTION_REFERENCE_PROMPTS.STYLE_ATTEMPTS; attempt++) {
    try {
      const parts = attempt >= 1 ? [MOTION_REFERENCE_PROMPTS.STYLE_SAFE, MOTION_REFERENCE_PROMPTS.ANALYZE, MOTION_REFERENCE_PROMPTS.STYLE_ONLY] : [MOTION_REFERENCE_PROMPTS.ANALYZE, MOTION_REFERENCE_PROMPTS.STYLE_ONLY];
      const fallback = opts.exec.provider === AiPlanningFallbackProvider.GeminiChat ? AiPlanningFallbackProvider.ChatGptUi : AiPlanningFallbackProvider.GeminiChat;
      const exec = attempt >= 2 ? { ...opts.exec, provider: fallback, model: fallback === AiPlanningFallbackProvider.GeminiChat ? AiPlanningChatModel.GeminiFlash : AiPlanningChatModel.ChatGptAuto } : opts.exec;
      const raw = await (opts.ai || runMotionAi)(parts.join(MR.MOTION_TEXT_SYMBOL_27), MOTION_STORY_CONFIG.ARTIFACT_STYLE, exec, opts.signal, opts.log, images);
      const style = normalizeMotionReferenceStyle(raw?.referenceStyle || raw);
      if (style?.kit && (style.images?.length || 0) >= images.length && !MOTION_REFERENCE_PROMPTS.STYLE_UNSEEN.test(style.description || MR.MOTION_TEXT_EMPTY)) return style;
    } catch (error) {
      if (opts.signal?.aborted) throw error;
    }
    opts.log?.(MOTION_REFERENCE_PROMPTS.STYLE_RETRY);
  }
  throw new Error(MOTION_REFERENCE_PROMPTS.STYLE_FAILED);
};
export const resolveMotionReferenceStyle = (references: MotionStyleReference[], opts: { exec: MotionAiExecution; signal?: AbortSignal; log?: (s: string) => void; ai?: typeof runMotionAi }): Promise<MotionStoryAnalysis["referenceStyle"]> => withCachedMotionReferenceStyle(references, () => withMotionReferenceFiles(references, (images) => analyzeReferenceStyle(images, opts)), opts);
const withMusicMood = (analysis: MotionStoryAnalysis, raw: any): MotionStoryAnalysis => {
  const moods = new Map<string, string | undefined>(_.map(_.castArray(raw?.chapters || []), (chapter: any, index: number): [string, string | undefined] => [_.toString(chapter?.id || index), musicMoodOf(chapter?.musicMood)]));
  const chapters = _.map(analysis.chapters, (chapter, index): MotionChapter => {
    const mood = moods.get(chapter.id) || moods.get(String(index));
    return mood ? { ...chapter, musicMood: mood } : chapter;
  });
  const mood = musicMoodOf(raw?.musicMood);
  return { ...analysis, chapters, ...(mood ? { musicMood: mood } : {}) };
};
export const analyzeStory = async (
  source: MotionStorySource,
  opts: { styleReferences?: MotionStyleReference[]; characterMotion?: boolean; language: string; length: MotionStoryLength; drawingMode?: "2d" | "3d"; aspect?: string; exec: MotionAiExecution; signal?: AbortSignal; log?: (s: string) => void; ai?: typeof runMotionAi; assetStyleKey?: string; libraryMode?: MotionSceneLibraryMode; videoGenre?: MotionVideoGenre; stylePreset?: string },
): Promise<MotionStoryAnalysis> => {
  if (opts.styleReferences?.length) {
    const referenceStyle = await withCachedMotionReferenceStyle(opts.styleReferences, () => withMotionReferenceFiles(opts.styleReferences, (images) => analyzeReferenceStyle(images, opts)), opts);
    const assetStyleKey = motionAssetStyleKey(opts.styleReferences, opts.drawingMode);
    try {
      saveSceneStyle(assetStyleKey, { references: opts.styleReferences, drawingMode: opts.drawingMode === MR.MOTION_TEXT_2D ? MR.MOTION_TEXT_2D : MR.MOTION_TEXT_3D, referenceStyle, name: source.title });
    } catch (error) {
      opts.log?.(MOTION_SCENE_LIBRARY.LOGS.SAVE_FAILED(_.toString((error as Error)?.message || error)));
    }
    const ai = opts.ai || runMotionAi;
    const analysis = await analyzeStory(source, {
      ...opts,
      assetStyleKey,
      styleReferences: undefined,
      ai: referenceStyle ? (prompt, artifact, exec, signal, log, images) => ai([prompt, MOTION_REFERENCE_PROMPTS.PROFILE(referenceStyle)].join(MR.MOTION_TEXT_SYMBOL_27), artifact, exec, signal, log, images) : opts.ai,
    });
    return { ...analysis, referenceStyle: referenceStyle || analysis.referenceStyle };
  }
  const stylePreset = motionStylePreset(opts.stylePreset);
  if (stylePreset) {
    const mode = opts.drawingMode === MR.MOTION_TEXT_2D ? MR.MOTION_TEXT_2D : MR.MOTION_TEXT_3D,
      referenceStyle = motionPresetReferenceStyle(stylePreset),
      assetStyleKey = MOTION_STYLE_PRESET_KEY(stylePreset.id, mode);
    try {
      saveSceneStyle(assetStyleKey, { drawingMode: mode, referenceStyle, name: stylePreset.label.vi });
    } catch (error) {
      opts.log?.(MOTION_SCENE_LIBRARY.LOGS.SAVE_FAILED(_.toString((error as Error)?.message || error)));
    }
    const ai = opts.ai || runMotionAi;
    const analysis = await analyzeStory(source, { ...opts, stylePreset: undefined, assetStyleKey, ai: (prompt, artifact, exec, signal, log, images) => ai([prompt, MOTION_REFERENCE_PROMPTS.PROFILE(referenceStyle)].join(MR.MOTION_TEXT_SYMBOL_27), artifact, exec, signal, log, images) });
    return { ...analysis, referenceStyle, stylePreset: stylePreset.id, look: stylePreset.look };
  }
  const target = resolveTargetSeconds(source, opts.length);
  const settings: MotionVideoDnaSettings = {
    length: opts.length,
    targetSeconds: target,
    language: opts.language === MR.MOTION_TEXT_EN ? MR.MOTION_TEXT_EN : MR.MOTION_TEXT_VI,
    aspect: opts.aspect || MR.MOTION_TEXT_16_9,
    drawingMode: opts.drawingMode === MR.MOTION_TEXT_2D ? MR.MOTION_TEXT_2D : MR.MOTION_TEXT_3D,
    characterMode: MR.MOTION_TEXT_DRAWN,
  };
  const chapterCount = _.clamp(Math.round(target / 150), 1, 24);
  const language = opts.language === MOTION_TEXT_EN ? MOTION_TEXT_ENGLISH : MOTION_TEXT_VIETNAMESE;
  const ledger = await buildSourceLedger(source, opts);
  const transcript = ledger ? MR.MOTION_TEMPLATE_EVENT_LEDGER_OF_THE_FULL_SOURCE_BUILT_PART_BY_PART_FROM_THE_COMPL(ledger) : sourceSlice(source);
  const prompt = MOTION_GEN_ANALYSIS_PROMPT({ preamble: MOTION_GEN_PREAMBLE, title: source.title, seconds: Math.round(target), language, chapters: chapterCount, transcript });
  const briefNote = source.kind === MR.MOTION_TEXT_BRIEF ? MR.MOTION_TEXT_THE_INPUT_IS_A_CREATIVE_BRIEF_NOT_A_TIMESTAMPED_TRANSCRIPT_DEVELO : MR.MOTION_TEXT_EMPTY;
  const libraryMode = opts.libraryMode || MOTION_SCENE_LIBRARY_MODES.AUTO;
  const assetStyleKey = opts.assetStyleKey || motionAssetStyleKey([], opts.drawingMode);
  const finish = (analysis: MotionStoryAnalysis): MotionStoryAnalysis => ({ ...assignSceneLibrary(analysis, assetStyleKey, libraryMode, opts.characterMotion), videoGenre: motionVideoGenre(opts.videoGenre), libraryMode });
  const catalog = sceneLibraryCatalog(assetStyleKey, _.truncate([source.title, source.text].join(MOTION_SCENE_LIBRARY.TEXT.NEWLINE), { length: MOTION_SCENE_LIBRARY.CONTEXT_MAX }), { characterMotion: opts.characterMotion, items: libraryMode === MOTION_SCENE_LIBRARY_MODES.AI });
  if (catalog.locations || catalog.characters) opts.log?.(MOTION_SCENE_LIBRARY.LOGS.CATALOG(catalog.locations, catalog.characters));
  const genreDirective = motionVideoGenreDirective(opts.videoGenre);
  const fullRequest =
    MR.MOTION_TEMPLATE_SYMBOL_304(prompt, VIDEO_DNA_PLANNING_INSTRUCTIONS, VIDEO_DNA_PROFILE_INSTRUCTIONS, videoDnaInstructions(settings), SOURCE_READING_RULES, sourceDirections(source), briefNote) +
    MR.MOTION_TEXT_SYMBOL_27 +
    (opts.characterMotion ? MOTION_REFERENCE_PROMPTS.MOTION_ON : MOTION_REFERENCE_PROMPTS.MOTION_OFF) +
    MR.MOTION_TEXT_SYMBOL_27 +
    catalog.prompt +
    (genreDirective ? MR.MOTION_TEXT_SYMBOL_27 + genreDirective : MR.MOTION_TEXT_EMPTY) +
    MR.MOTION_TEXT_SYMBOL_27 +
    MOTION_MUSIC.PROMPT(_.keys(MOTION_MUSIC_MOODS));
  let errors: string[] = [];
  let roomHasContext = false;
  let lastRaw: any = null;
  for (let attempt = 0; attempt < MOTION_ANALYSIS_ATTEMPTS; attempt++) {
    const request = !errors.length || !roomHasContext ? MR.MOTION_TEMPLATE_SYMBOL_305(fullRequest, errors.length ? MR.MOTION_TEMPLATE_CORRECT_THESE_EXACT_CONTRACT_FAILURES(errors.join(MR.MOTION_TEXT_SYMBOL_41)) : MR.MOTION_TEXT_EMPTY) : MR.MOTION_TEMPLATE_CORRECTION_YOUR_PREVIOUS_ANALYSIS_JSON_FAILED_THESE_EXACT_CHECKS_(errors.join(MR.MOTION_TEXT_SYMBOL_41));
    let raw: any;
    try {
      raw = normalizeMotionAnalysisResponse(await (opts.ai || runMotionAi)(request, MOTION_STORY_CONFIG.ARTIFACT_ANALYSIS, opts.exec, opts.signal, opts.log));
    } catch (error) {
      if (opts.signal?.aborted || attempt === MOTION_ANALYSIS_ATTEMPTS - 1) throw error;
      roomHasContext = false;
      errors = [MR.MOTION_TEMPLATE_NO_VALID_JSON_RETURNED(_.truncate(_.toString((error as Error)?.message || error), { length: 160 }))];
      opts.log?.(MR.MOTION_TEMPLATE_PHAN_TICH_LAN_LOI_THU_LAI(attempt + 1, errors[0]));
      continue;
    }
    roomHasContext = !!raw;
    if (raw?.chapters) lastRaw = raw;
    const baseErrors = raw ? videoDnaErrors(raw.videoDna) : [MR.MOTION_TEXT_NO_JSON_OBJECT_RETURNED];
    errors = raw ? [...baseErrors, ...videoDnaProfileErrors(raw.videoDna)] : baseErrors;
    if (errors.length && !baseErrors.length && attempt >= MOTION_ANALYSIS_ATTEMPTS - 2) {
      opts.log?.(MR.MOTION_TEMPLATE_VIDEO_DNA_CON_THIEU_MUC_HO_SO_DUNG_PHAN_DNA_DA_CO_DE_CHAY_TIEP(errors.length));
      errors = [];
    }
    if (!errors.length) {
      const normalized = normalizeVideoDna(raw.videoDna, settings, videoDnaSourceKey(source))!;
      const videoDna = normalized.audienceProfile ? { ...normalized, audienceProfile: { ...normalized.audienceProfile, language: settings.language } } : normalized;
      opts.log?.(MR.MOTION_TEMPLATE_VIDEO_DNA(videoDna.format?.primary || MR.MOTION_TEXT_SYMBOL_25, videoDna.audienceProfile?.language || MR.MOTION_TEXT_EMPTY, videoDna.audienceProfile?.ageRange || MR.MOTION_TEXT_EMPTY, _.truncate(videoDna.narrativeDna?.narrativeVoice || MR.MOTION_TEXT_EMPTY, { length: 80 })));
      return finish(withMusicMood(normalizeAnalysis({ ...raw, characterMotion: opts.characterMotion === true, factual: videoDna.format?.factual ?? raw.factual, videoDna }, source, target), raw));
    }
    opts.log?.(MR.MOTION_TEMPLATE_VIDEO_DNA_THIEU_MUC_NHO_AI_SUA_TRONG_CUNG_PHONG_CHAT(errors.length, _.truncate(errors.slice(0, 3).join(MR.MOTION_TEXT_SYMBOL_41), { length: 160 })));
  }
  if (lastRaw?.chapters?.length) {
    opts.log?.(MR.MOTION_TEXT_VIDEO_DNA_CHUA_HOAN_CHINH_SAU_NHIEU_LAN_SUA_CHAY_TIEP_THEO_CACH_C);
    return finish(withMusicMood(normalizeAnalysis({ ..._.omit(lastRaw, [MR.MOTION_TEXT_VIDEODNA]), characterMotion: opts.characterMotion === true }, source, target), lastRaw));
  }
  throw new Error(MR.MOTION_TEMPLATE_INVALID_SOURCE_DERIVED_VIDEO_DNA(errors.join(MR.MOTION_TEXT_SYMBOL_41)));
};
export const editScript = async (source: MotionStorySource, analysis: MotionStoryAnalysis, beats: MotionBeat[], opts: { language: string; exec: MotionAiExecution; signal?: AbortSignal; log?: (s: string) => void; ai?: typeof runMotionAi }): Promise<{ beats: MotionBeat[]; edit: { reviewed: number; rewritten: number; notes: string[] } }> => {
  const dna = analysis.videoDna;
  const groups: MotionChapter[][] = [];
  let current: MotionChapter[] = [];
  let chars = 0;
  for (const chapter of analysis.chapters) {
    const size = sourceSlice(source, chapter.from, chapter.to).length;
    if (current.length && (current.length >= 4 || chars + size > 60000)) {
      groups.push(current);
      current = [];
      chars = 0;
    }
    current.push(chapter);
    chars += size;
  }
  if (current.length) groups.push(current);
  const brief = JSON.stringify({ audience: dna?.audienceProfile, narrativeVoice: dna?.narrativeDna?.narrativeVoice || dna?.narrative.voice, callbacks: dna?.narrativeDna?.callbacks, mustPreserve: dna?.mustPreserve, mustNotCopy: dna?.mustNotCopy });
  const byId = new Map(beats.map((b) => [b.id, b]));
  const notes: string[] = [];
  let rewritten = 0;
  await mapMotionAiPool(groups, async (group, gi) => {
    try {
      const ids = new Set(group.map((c) => c.id));
      const lines = beats.filter((b) => ids.has(b.chapterId));
      if (!lines.length) return;
      const before = beats.filter((b) => b.chapterId === analysis.chapters[_.findIndex(analysis.chapters, { id: group[0].id }) - 1]?.id).slice(-2);
      const limit = Math.max(2, Math.ceil(lines.length * 0.15));
      const transcript = group.map((c) => MR.MOTION_TEMPLATE_SOURCE(c.id, sourceSlice(source, c.from, c.to))).join(MR.MOTION_TEXT_SYMBOL_27);
      const prompt = MR.MOTION_TEMPLATE_ROLE_EDITOR_IN_CHIEF_OF_THIS_VIDEO_REVIEWING_THE_NARRATION_LIKE_A(brief, opts.language === MOTION_TEXT_EN ? MOTION_TEXT_ENGLISH : MOTION_TEXT_VIETNAMESE, JSON.stringify(before.map((b) => b.narration)), JSON.stringify(lines.map((b) => ({ id: b.id, chapter: b.chapterId, visual: b.visual, narration: b.narration }))), transcript, limit);
      const raw = await (opts.ai || runMotionAi)(prompt, MOTION_STORY_EDIT_ARTIFACT, opts.exec, opts.signal, opts.log);
      for (const e of _.take(_.castArray(raw?.edits || []), limit)) {
        const beat = byId.get(_.toString(e?.id));
        const narration = _.trim(_.toString(e?.narration));
        if (!beat || !ids.has(beat.chapterId) || !narration) continue;
        const ratio = narration.split(MP.WHITESPACE).length / Math.max(1, beat.narration.split(MP.WHITESPACE).length);
        if (ratio < 0.6 || ratio > 1.5) continue;
        byId.set(beat.id, { ...beat, narration: _.truncate(narration, { length: 600 }) });
        rewritten++;
        if (e?.reason) notes.push(MR.MOTION_TEMPLATE_SYMBOL_306(beat.id, _.truncate(_.toString(e.reason), { length: 140 })));
      }
    } catch (error) {
      if (opts.signal?.aborted) throw error;
      opts.log?.(MR.MOTION_TEMPLATE_BIEN_TAP_NHOM_CHUONG_BO_QUA(gi + 1, getMotionErrorMessage(error, 100)));
    }
  });
  opts.log?.(MR.MOTION_TEMPLATE_BIEN_TAP_VIEN_DOC_CAU_SUA_CAU(beats.length, rewritten));
  return { beats: beats.map((b) => byId.get(b.id) || b), edit: { reviewed: beats.length, rewritten, notes: _.take(notes, 40) } };
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
export const normalizeAnalysis = (raw: any, source: MotionStorySource, target: number): MotionStoryAnalysis => {
  let chapters: MotionChapter[] = _.map(_.castArray(raw?.chapters || []), (c: any, i: number) => ({
    id: MOTION_TEMPLATE_C_2(String(i + 1)),
    title: _.truncate(_.toString(c?.title || MOTION_TEMPLATE_CHUONG(String(i + 1))), { length: 80 }),
    summary: _.truncate(_.toString(c?.summary || MR.MOTION_TEXT_EMPTY), { length: 400 }),
    from: _.isFinite(_.toNumber(c?.from)) ? _.toNumber(c.from) : undefined,
    to: _.isFinite(_.toNumber(c?.to)) ? _.toNumber(c.to) : undefined,
    ...(_.inRange(_.toNumber(c?.weight), 1, 5.01) ? { weight: Math.round(_.toNumber(c.weight)) } : {}),
    ...(c?.mustKeep === true ? { mustKeep: true } : {}),
    ...(_.trim(_.toString(c?.hook)) ? { hook: _.truncate(_.toString(c.hook), { length: 240 }) } : {}),
    ...(_.isArray(c?.keyPoints) && c.keyPoints.length ? { keyPoints: _.take(_.compact(_.map(c.keyPoints, (k: unknown) => _.truncate(_.toString(k), { length: 200 }))), 8) } : {}),
    ...(_.trim(_.toString(c?.handoff)) ? { handoff: _.truncate(_.toString(c.handoff), { length: 240 }) } : {}),
  }));
  chapters = foldAdultChapters(chapters);
  if (_.isEmpty(chapters)) chapters = [{ id: MOTION_TEXT_C1, title: source.title, summary: MR.MOTION_TEXT_EMPTY, from: 0, to: source.sourceSeconds }];
  const spans = _.map(chapters, (c, i) => Math.max(10, (c.to ?? chapters[i + 1]?.from ?? source.sourceSeconds) - (c.from ?? 0)));
  const meanSpan = _.mean(spans) || 1;
  const weighted = _.some(chapters, (c) => c.weight);
  const shares = _.map(chapters, (c, i) => (weighted ? (c.weight ?? 3) * (0.6 + 0.4 * Math.min(2.5, spans[i] / meanSpan)) : spans[i] / meanSpan));
  const total = _.sum(shares);
  chapters = _.map(chapters, (c, i) => ({ ...c, targetSeconds: Math.max(c.mustKeep ? 25 : 15, Math.round((shares[i] / total) * target)) }));
  const used = new Set<string>();
  const cast: MotionCastMember[] = _.compact(
    _.map(_.castArray(raw?.cast || []), (m: any) => {
      if (!m?.name) return null;
      let key = slugKey(m.key || m.name);
      while (used.has(key)) key = MOTION_TEMPLATE_2_2(String(key));
      used.add(key);
      const gender = MP.FEMALE.test(_.toString(m.gender || m.suggested?.gender || MR.MOTION_TEXT_EMPTY)) ? MOTION_TEXT_FEMALE : MOTION_TEXT_MALE;
      return {
        key,
        name: _.truncate(_.toString(m.name), { length: 60 }),
        role: _.truncate(_.toString(m.role || MR.MOTION_TEXT_EMPTY), { length: 60 }),
        description: _.truncate(_.toString(m.description || MR.MOTION_TEXT_EMPTY), { length: 200 }),
        look: _.truncate(_.toString(m.look || m.appearance || MR.MOTION_TEXT_EMPTY), { length: 240 }),
        gender,
        tags: cleanSceneTags(m.tags),
        ...(isSceneAssetId(m.reuse) ? { reuse: m.reuse } : {}),
        ...(sceneTypeOf(m.type) ? { type: sceneTypeOf(m.type) } : {}),
        ...(cleanCharacterColors(m.colors) ? { colors: cleanCharacterColors(m.colors) } : {}),
      } as MotionCastMember;
    }),
  );
  const usedPlaces = new Set<string>();
  const places: MotionPlace[] = _.take(
    _.compact(
      _.map(_.castArray(raw?.places || []), (p: any) => {
        if (!p) return null;
        const obj = _.isString(p) ? { key: p, name: p, description: p } : p;
        let key = slugKey(obj.key || obj.name);
        if (usedPlaces.has(key)) return null;
        usedPlaces.add(key);
        return {
          key,
          name: _.truncate(_.toString(obj.name || key), { length: 60 }),
          description: _.truncate(_.toString(obj.description || obj.name || key), { length: 500 }),
          interior: !!obj.interior,
          time: _.includes(TIMES, obj.time) ? obj.time : obj.interior ? MOTION_TEXT_TOON_CAT_INTERIOR : MOTION_TEXT_DAY,
          tags: cleanSceneTags(obj.tags),
          ...(isSceneAssetId(obj.reuse) ? { reuse: obj.reuse } : {}),
          ...(sceneTypeOf(obj.type) ? { type: sceneTypeOf(obj.type) } : {}),
        } as MotionPlace;
      }),
    ),
    target > 1200 ? 18 : 10,
  );
  if (_.isEmpty(places)) places.push({ key: MOTION_TEXT_MAIN_PLACE, name: source.title, description: _.truncate(_.toString(raw?.logline || source.title), { length: 300 }), interior: false, time: MOTION_TEXT_DAY });
  const genre = normalizeMotionText(raw?.genre || MR.MOTION_TEXT_EMPTY, 80) || undefined;
  const genre2 = raw?.genre2 !== genre ? normalizeMotionText(raw?.genre2 || MR.MOTION_TEXT_EMPTY, 80) || undefined : undefined;
  return {
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
    places,
    facts: _.take(
      _.map(_.castArray(raw?.facts || []), (f: any) => ({ claim: _.toString(f?.claim), status: pickEnum([MOTION_TEXT_OK, MOTION_TEXT_UNCERTAIN, MOTION_TEXT_WRONG] as const as any, f?.status, MOTION_TEXT_UNCERTAIN), note: _.toString(f?.note || MR.MOTION_TEXT_EMPTY) })),
      40,
    ),
  };
};
const chapterRole = (analysis: MotionStoryAnalysis): string => {
  const profile = (analysis.videoDna || analysis.creativeBlueprint)?.creativeProfile;
  const dna = analysis.videoDna;
  const parts = [
    profile?.role || MR.MOTION_TEXT_WRITER_AND_VISUAL_STORYTELLER_FOLLOWING_THE_SUPPLIED_INPUT,
    MR.MOTION_TEXT_WORK_SIMULTANEOUSLY_AS_1_SCRIPTWRITER_RESPONSIBLE_FOR_STRUCTURE_T +
      (dna?.narrativeDna ? MR.MOTION_TEMPLATE_SYMBOL_311(dna.narrativeDna.narrativeVoice) : MR.MOTION_TEXT_EMPTY) +
      MR.MOTION_TEXT_NATURAL_SPOKEN_SENTENCES_THAT_SOUND_GOOD_READ_ALOUD_BY_A_TTS_VOIC +
      (dna?.editDna ? MR.MOTION_TEMPLATE_FROM_THE_VISUAL_TOOLKIT_AT_A_PACE_OF(dna.editDna.visualToolkit.join(MR.MOTION_TEXT_SYMBOL_41), dna.editDna.pace) : MR.MOTION_TEXT_EMPTY) +
      MR.MOTION_TEXT_SYMBOL_54,
    MR.MOTION_TEXT_ADOPT_THE_SYNTHETIC_CREATIVE_PROFILE_FROM_THE_APPROVED_VIDEO_DNA +
      (profile?.strengths?.length ? MR.MOTION_TEMPLATE_STRENGTHS(profile.strengths.join(MR.MOTION_TEXT_SYMBOL_41)) : MR.MOTION_TEXT_EMPTY) +
      (profile?.writingPrinciples?.length ? MR.MOTION_TEMPLATE_WRITING_PRINCIPLES(profile.writingPrinciples.join(MR.MOTION_TEXT_SYMBOL_41)) : MR.MOTION_TEXT_EMPTY) +
      (profile?.productionPrinciples?.length ? MR.MOTION_TEMPLATE_PRODUCTION_PRINCIPLES(profile.productionPrinciples.join(MR.MOTION_TEXT_SYMBOL_41)) : MR.MOTION_TEXT_EMPTY),
  ];
  return parts.join(MR.MOTION_TEXT_SYMBOL_13);
};
const chapterOutline = (analysis: MotionStoryAnalysis, chapter: MotionChapter): string => {
  const idx = _.findIndex(analysis.chapters, { id: chapter.id });
  if (!_.some(analysis.chapters, (c) => c.hook || c.keyPoints?.length || c.handoff)) return MR.MOTION_TEXT_EMPTY;
  const prev = idx > 0 ? analysis.chapters[idx - 1] : undefined;
  const next = analysis.chapters[idx + 1];
  const others = _.compact(_.map(analysis.chapters, (c, i) => (i === idx ? null : MR.MOTION_TEMPLATE_SYMBOL_312(c.id, c.title, (c.keyPoints || []).join(MR.MOTION_TEXT_SYMBOL_56) || c.summary)))).join(MR.MOTION_TEXT_SYMBOL_27);
  return [
    MR.MOTION_TEXT_WHOLE_VIDEO_OUTLINE_PLANNED_ONCE_FOLLOW_IT_SO_THE_CHAPTERS_READ_A,
    MR.MOTION_TEMPLATE_THIS_CHAPTER_HOOK_MUST_COVER_ENDS_BY_HANDING_OVER(idx + 1, analysis.chapters.length, chapter.hook || MR.MOTION_TEXT_SYMBOL_19, (chapter.keyPoints || []).join(MR.MOTION_TEXT_SYMBOL_56) || chapter.summary, chapter.handoff || (next ? MR.MOTION_TEMPLATE_TOWARD(next.title) : MR.MOTION_TEXT_THE_ENDING)),
    prev ? MR.MOTION_TEMPLATE_THE_PREVIOUS_CHAPTER_ENDED_WITH_OPEN_AS_ITS_NATURAL_CONTINUATION_(prev.handoff || prev.summary) : MR.MOTION_TEXT_THIS_IS_THE_OPENING_CHAPTER_ESTABLISH_THE_ESSENTIAL_CONTEXT_IN_TH,
    next ? MR.MOTION_TEMPLATE_THE_NEXT_CHAPTER_STARTS_WITH_DO_NOT_COVER_ITS_POINTS(next.title, next.hook || next.summary) : MR.MOTION_TEXT_THIS_IS_THE_FINAL_CHAPTER_DELIVER_THE_CONCLUSION,
    idx > 0 ? MR.MOTION_TEMPLATE_FIRST_LINE_STYLE_UNLESS_THE_PLANNED_HOOK_CLEARLY_NEEDS_ANOTHER_OP(OPENING_STYLES[(idx - 1) % OPENING_STYLES.length]) : MR.MOTION_TEXT_EMPTY,
    MR.MOTION_TEMPLATE_POINTS_COVERED_BY_OTHER_CHAPTERS_DO_NOT_REPEAT_THEM(_.truncate(others, { length: 3500 })),
  ]
    .filter(Boolean)
    .join(MR.MOTION_TEXT_SYMBOL_27);
};
export const writeChapterBeats = async (source: MotionStorySource, analysis: MotionStoryAnalysis, chapter: MotionChapter, opts: { language: string; exec: MotionAiExecution; signal?: AbortSignal; log?: (s: string) => void; previous?: MotionBeat[]; previousSummary?: string; isFirst: boolean; isLast: boolean; ai?: typeof runMotionAi; speechRate?: number }): Promise<MotionBeat[]> => {
  const isVi = opts.language !== MOTION_TEXT_EN;
  const seconds = chapter.targetSeconds || 120;
  const units = Math.round(seconds * (opts.speechRate || (isVi ? MOTION_STORY_CONFIG.VI_SYLLABLES_PER_SECOND : MOTION_STORY_CONFIG.EN_WORDS_PER_SECOND)) * MOTION_STORY_CONFIG.LENGTH_SAFETY);
  const beatsWanted = Math.max(2, Math.round(seconds / MOTION_STORY_CONFIG.TARGET_BEAT_SECONDS));
  const language = isVi ? MOTION_TEXT_VIETNAMESE : MOTION_TEXT_ENGLISH;
  const unitName = isVi ? MOTION_TEXT_VIETNAMESE_SYLLABLES_WORDS : MOTION_TEXT_WORDS;
  const prev = opts.previous?.length ? _.map(_.takeRight(opts.previous, 2), (b) => MOTION_TEMPLATE_SYMBOL_53(String(b.narration))).join(MOTION_TEXT_SYMBOL_27) : opts.previousSummary ? MOTION_TEMPLATE_SYMBOL_53(String(opts.previousSummary)) : MR.MOTION_TEXT_EMPTY;
  const prompt = MOTION_GEN_CHAPTER_PROMPT({
    preamble: MR.MOTION_TEMPLATE_SYMBOL_315(productionPreamble(analysis, MR.MOTION_TEXT_STORY), SOURCE_READING_RULES),
    role: chapterRole(analysis),
    outline: chapterOutline(analysis, chapter),
    genre: MR.MOTION_TEXT_EMPTY,
    title: analysis.title,
    logline: analysis.logline,
    chapterId: chapter.id,
    chapterTitle: chapter.title,
    chapterSummary: chapter.summary,
    languageNote: MR.MOTION_TEMPLATE_WRITE_NATURAL((analysis.videoDna || analysis.creativeBlueprint)?.narrative.voice || MR.MOTION_TEXT_USE_THE_VOICE_APPROPRIATE_TO_THIS_INPUT, language),
    language,
    units,
    unitName,
    seconds,
    beats: beatsWanted,
    perBeat: Math.max(8, Math.round(units / beatsWanted)),
    firstNote: opts.isFirst ? MR.MOTION_TEXT_OPEN_ACCORDING_TO_THE_PROJECT_S_NARRATIVE_STRUCTURE_NO_COMPULSORY : MR.MOTION_TEXT_EMPTY,
    lastNote: opts.isLast ? MR.MOTION_TEXT_END_ACCORDING_TO_THE_PROJECT_S_NARRATIVE_STRUCTURE_NO_COMPULSORY_ : MR.MOTION_TEXT_EMPTY,
    previous: prev ? MOTION_TEMPLATE_CONTINUE_NATURALLY_FROM_THE_PREVIOUS_CHAPTER_WHICH_ENDED_2(String(prev)) : MR.MOTION_TEXT_EMPTY,
    rules: _.compact([MOTION_GEN_STORYBOARD_RULES(language), MOTION_STORY_VOICE_PROMPT, motionAudioContext(null, analysis), motionVideoGenreDirective(analysis.videoGenre)]).join(MR.MOTION_TEXT_SYMBOL_27),
    cast: _.map(analysis.cast, (c) => MOTION_TEMPLATE_SYMBOL_54(String(c.key), String(c.name), String(c.role || MR.MOTION_TEXT_EMPTY), String(c.look || c.description || MR.MOTION_TEXT_EMPTY))).join(MOTION_TEXT_SYMBOL_27) || MOTION_TEXT_NONE_2,
    places: _.map(analysis.places, (p) => MOTION_TEMPLATE_SYMBOL_55(String(p.key), String(p.name), String(p.description))).join(MOTION_TEXT_SYMBOL_27),
    transcript: sourceSlice(source, chapter.from, chapter.to),
  });
  let lastError: unknown;
  let best: MotionBeat[] | null = null;
  const factual = (analysis.videoDna?.format?.factual ?? analysis.factual) !== false && source.kind !== MR.MOTION_TEXT_BRIEF;
  const quotesIndex = factual ? transcriptIndex(source.text) : null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const retryNote = attempt ? MOTION_TEMPLATE_YOUR_PREVIOUS_ANSWER_FAILED_RETURN_ONLY_THE_JSON(String(getMotionErrorMessage(lastError, 300))) : MR.MOTION_TEXT_EMPTY;
      const raw = await (opts.ai || runMotionAi)(MR.MOTION_TEMPLATE_SYMBOL_325(prompt, analysis.videoDna ? VIDEO_SCENE_PLAN_INSTRUCTIONS : MR.MOTION_TEXT_EMPTY, retryNote), MOTION_STORY_CONFIG.ARTIFACT_CHAPTER, opts.exec, opts.signal, opts.log);
      const rawBeats = _.castArray(raw?.beats || []);
      const beats = normalizeBeats(rawBeats, chapter.id, analysis);
      if (beats.length < 1) throw new Error(MOTION_TEXT_CHUONG_KHONG_CO_BEAT_NAO_2);
      best = beats;
      const problems: string[] = [];
      if (analysis.videoDna) problems.push(...rawBeats.flatMap((beat: any, i: number) => (!beat.visual || beat.visual === MR.MOTION_TEXT_SCENE ? scenePlanErrors(beat.scenePlan).map((error) => MR.MOTION_TEMPLATE_BEAT_2(i + 1, error)) : [])).slice(0, 6));
      if (quotesIndex) problems.push(...quoteErrors(rawBeats, quotesIndex).slice(0, 4));
      if (analysis.videoDna) {
        const spokenUnits = beats.reduce((sum, beat) => sum + beat.narration.split(MP.WHITESPACE).filter(Boolean).length, 0);
        const expectedUnits = seconds * (opts.speechRate || (isVi ? MOTION_STORY_CONFIG.VI_SYLLABLES_PER_SECOND : MOTION_STORY_CONFIG.EN_WORDS_PER_SECOND));
        if (spokenUnits < expectedUnits * 0.65 || spokenUnits > expectedUnits * 1.35) problems.push(MR.MOTION_TEMPLATE_NARRATION_LENGTH_DOES_NOT_RESPECT_THE_SELECTED_VIDEO_DURATION_WOR(spokenUnits, seconds, units));
      }
      if (problems.length) throw new Error(problems.join(MR.MOTION_TEXT_SYMBOL_41));
      return beats;
    } catch (error) {
      if (opts.signal?.aborted) throw error;
      lastError = error;
      opts.log?.(MOTION_TEMPLATE_CHUONG_LOI_THU_LAI(String(chapter.id), String(getMotionErrorMessage(error, 120))));
    }
  }
  if (best) {
    const { beats, changed } = quotesIndex ? unattributeUnverifiedQuotes(best, quotesIndex) : { beats: best, changed: 0 };
    opts.log?.(MR.MOTION_TEMPLATE_CHUONG_DUNG_BAN_TOT_NHAT_SAU_3_LAN_SUA(chapter.id, changed ? MR.MOTION_TEMPLATE_BO_GHI_TEN_CAU_TRICH_KHONG_CO_TRONG_NGUON(changed) : MR.MOTION_TEXT_EMPTY));
    return beats;
  }
  const lines = _.compact([chapter.hook, ...(chapter.keyPoints || []).map((k) => k.replace(MP.TRANSCRIPT_TIME_PREFIX, MR.MOTION_TEXT_EMPTY)), chapter.summary, chapter.handoff]).slice(0, Math.max(2, beatsWanted));
  if (!lines.length) throw lastError;
  opts.log?.(MR.MOTION_TEMPLATE_CHUONG_AI_KHONG_TRA_DUOC_KICH_BAN_TAO_CHUONG_DON_GIAN_TU_DAN_Y_DE(chapter.id));
  return normalizeBeats(
    _.map(lines, (narration) => ({ narration, visual: MR.MOTION_TEXT_SCENE, shot: MR.MOTION_TEXT_WIDE, action: chapter.title })),
    chapter.id,
    analysis,
  );
};
export const normalizeBeats = (rawBeats: any[], chapterId: string, analysis: MotionStoryAnalysis): MotionBeat[] => {
  const castKeys = _.map(analysis.cast, MOTION_TEXT_KEY);
  const placeKeys = _.map(analysis.places, MOTION_TEXT_KEY);
  const castOf = (k: string) => (_.includes(castKeys, k) ? k : _.find(analysis.cast, (c) => slugKey(c.name) === slugKey(k) || _.includes(slugKey(c.name), slugKey(k)) || slugKey(k).includes(c.key))?.key);
  const placeOf = (k: string) => (_.includes(placeKeys, k) ? k : _.find(analysis.places, (p) => slugKey(p.name) === slugKey(k) || slugKey(k).includes(p.key) || p.key.includes(slugKey(k)))?.key);
  const out: MotionBeat[] = [];
  _.forEach(rawBeats, (b: any) => {
    const narration = _.trim(_.toString(b?.narration || MR.MOTION_TEXT_EMPTY));
    if (!narration) return;
    const id = MOTION_TEMPLATE_B(String(chapterId), String(out.length + 1));
    const shots = _.filter(_.castArray(b?.shots || []), (sh) => _.isPlainObject(sh));
    const v = shots.length ? { ...shots[0], ...b, visual: b.visual || shots[0].visual } : b;
    const visual = pickEnum(VISUALS, v?.visual, MOTION_TEXT_SCENE);
    const beat: MotionBeat = { id, chapterId, narration: _.truncate(narration, { length: 600 }), visual };
    const utterances = normalizeMotionUtterances(b?.utterances, id, [MOTION_VOICE.NARRATOR, ...castKeys], beat.narration);
    if (utterances.length) beat.utterances = utterances;
    if (visual === MOTION_TEXT_SCENE) {
      beat.place = placeOf(_.toString(v?.place || v?.env || MR.MOTION_TEXT_EMPTY)) || _.first(placeKeys);
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
