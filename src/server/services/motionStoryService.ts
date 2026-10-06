import {
  MOTION_TEMPLATE_2_2,
  MOTION_TEMPLATE_ACTION_IDS,
  MOTION_TEMPLATE_AI_TRA_LOI_KHONG_PHAI_JSON,
  MOTION_TEMPLATE_ARTIFACTTYPE_REQUESTID,
  MOTION_TEMPLATE_B,
  MOTION_TEMPLATE_CHAN_DOAN_PHONG_CHAT_PHAN_HOI_KY_TU,
  MOTION_TEMPLATE_CHARACTER_IDS_LIBRARY,
  MOTION_TEMPLATE_CHUONG,
  MOTION_TEMPLATE_CHUONG_LOI_THU_LAI,
  MOTION_TEMPLATE_CONTAINS,
  MOTION_TEMPLATE_CONTINUE_NATURALLY_FROM_THE_PREVIOUS_CHAPTER_WHICH_ENDED,
  MOTION_TEMPLATE_C_2,
  MOTION_TEMPLATE_DEFAULT_TIME,
  MOTION_TEMPLATE_DOM_TXT,
  MOTION_TEMPLATE_DRAWN_AS,
  MOTION_TEMPLATE_ENV_IDS,
  MOTION_TEMPLATE_GUI_YEU_CAU_TOI_PHONG_CHAT_AI_CAU,
  MOTION_TEMPLATE_JSON,
  MOTION_TEMPLATE_MANDATORY_OUTPUT_RETURN_EXACTLY_ONE_VALID_JSON_OBJECT,
  MOTION_TEMPLATE_NEW_ITEMS_DESIGNED_FOR_THIS_STORY_PREFER_THEM,
  MOTION_TEMPLATE_PARAMS,
  MOTION_TEMPLATE_PHONG_CHAT_AI_KHONG_TRA_KET_QUA_SAU,
  MOTION_TEMPLATE_PHONG_CHAT_LOI,
  MOTION_TEMPLATE_PNG,
  MOTION_TEMPLATE_ROLE_DOCUMENTARY_SCRIPTWRITER_WRITE_THE_NARRATION_TEXT_AND_2,
  MOTION_TEMPLATE_ROLE_DOCUMENTARY_STORY_EDITOR_YOUTUBE_HISTORY_TRUE_STORY,
  MOTION_TEMPLATE_STORYBOARD_THE_PICTURE_MUST_TELL_THE_SAME_STORY,
  MOTION_TEMPLATE_SYMBOL_11,
  MOTION_TEMPLATE_SYMBOL_12,
  MOTION_TEMPLATE_SYMBOL_21,
  MOTION_TEMPLATE_SYMBOL_22,
  MOTION_TEMPLATE_SYMBOL_23,
  MOTION_TEMPLATE_SYMBOL_30,
  MOTION_TEMPLATE_SYMBOL_31,
  MOTION_TEMPLATE_SYMBOL_5,
  MOTION_TEMPLATE_YOUR_PREVIOUS_ANSWER_FAILED_REMINDER_THIS_IS_ONLY,
  MOTION_TEXT_0,
  MOTION_TEXT_1_2,
  MOTION_TEXT_ABORT,
  MOTION_TEXT_ADVANCE,
  MOTION_TEXT_AERIAL,
  MOTION_TEXT_AI_DEBUG,
  MOTION_TEXT_AI_KHONG_TRA_VE_JSON_HOP_LE,
  MOTION_TEXT_APPLICATION_JSON,
  MOTION_TEXT_ARTIFACTTYPE,
  MOTION_TEXT_ASSET_IDS_BY_CATEGORY,
  MOTION_TEXT_BACK,
  MOTION_TEXT_BASE64,
  MOTION_TEXT_BLOCK,
  MOTION_TEXT_BLOCKS,
  MOTION_TEXT_BUTTON_ARIA_LABEL_GUI_I,
  MOTION_TEXT_BUTTON_ARIA_LABEL_SEND_I,
  MOTION_TEXT_BUTTON_ARIA_LABEL_STOP_I,
  MOTION_TEXT_C1,
  MOTION_TEXT_CARRY,
  MOTION_TEXT_CAU_CHUYEN,
  MOTION_TEXT_CELEBRATE,
  MOTION_TEXT_CHAPTER,
  MOTION_TEXT_CHUONG_KHONG_CO_BEAT_NAO,
  MOTION_TEXT_CITY_STREET,
  MOTION_TEXT_CLOSE,
  MOTION_TEXT_CO,
  MOTION_TEXT_COLUMN,
  MOTION_TEXT_CONTENTEDITABLE_TRUE,
  MOTION_TEXT_COUNTER,
  MOTION_TEXT_CRAWL,
  MOTION_TEXT_CUSTOM,
  MOTION_TEXT_D,
  MOTION_TEXT_DAY,
  MOTION_TEXT_DIAGNOSTICS,
  MOTION_TEXT_DIG,
  MOTION_TEXT_DOCUMENTARY,
  MOTION_TEXT_DRAG,
  MOTION_TEXT_DRILL,
  MOTION_TEXT_DUSK,
  MOTION_TEXT_D_2,
  MOTION_TEXT_EN,
  MOTION_TEXT_ENDING,
  MOTION_TEXT_ENGLISH,
  MOTION_TEXT_ENTER_LEFT,
  MOTION_TEXT_ENTER_RIGHT,
  MOTION_TEXT_ENVIRONMENTS_2,
  MOTION_TEXT_EXIT_LEFT,
  MOTION_TEXT_EXIT_RIGHT,
  MOTION_TEXT_FFB070,
  MOTION_TEXT_FOG,
  MOTION_TEXT_FOLLOW,
  MOTION_TEXT_FORE,
  MOTION_TEXT_FRONT,
  MOTION_TEXT_FUNCTION,
  MOTION_TEXT_GOI_AI_QUA_API,
  MOTION_TEXT_HEADLINE,
  MOTION_TEXT_ID,
  MOTION_TEXT_ID_MODEL_RESPONSE_MESSAGE_CONTENT,
  MOTION_TEXT_IMPORTANT_TEXT_ONLY_TASK_YOU_ONLY_WRITE_TEXT,
  MOTION_TEXT_INSERT,
  MOTION_TEXT_INTERIOR,
  MOTION_TEXT_INTERIOR_DARK,
  MOTION_TEXT_KEY,
  MOTION_TEXT_KHONG,
  MOTION_TEXT_KHONG_TIM_THAY_NOI_DUNG_TRANSCRIPT_HOP_LE,
  MOTION_TEXT_LEFT,
  MOTION_TEXT_LEFT_TO_RIGHT,
  MOTION_TEXT_LIFT,
  MOTION_TEXT_LINE,
  MOTION_TEXT_LOOK_AROUND,
  MOTION_TEXT_MAN_CASUAL,
  MOTION_TEXT_MAP,
  MOTION_TEXT_MARKDOWN,
  MOTION_TEXT_MEDIUM,
  MOTION_TEXT_MESSAGE,
  MOTION_TEXT_MESSAGE_CONTENT,
  MOTION_TEXT_MID,
  MOTION_TEXT_MODEL_RESPONSE,
  MOTION_TEXT_MODEL_RESPONSE_TEXT,
  MOTION_TEXT_NATURAL_ENGLISH_DOCUMENTARY_NARRATION_SHORT_CLEAR_SENTENCES,
  MOTION_TEXT_NATURAL_FLUENT_VIETNAMESE_IN_A_DOCUMENTARY_STORYTELLING_VOICE,
  MOTION_TEXT_NIGHT,
  MOTION_TEXT_NOI_DUNG_CAU_CHUYEN_QUA_NGAN,
  MOTION_TEXT_NONE,
  MOTION_TEXT_NONE_2,
  MOTION_TEXT_NV,
  MOTION_TEXT_OBJECT,
  MOTION_TEXT_OK,
  MOTION_TEXT_OTHER,
  MOTION_TEXT_PAN_LEFT,
  MOTION_TEXT_PAN_RIGHT,
  MOTION_TEXT_PHONG_CHAT_DA_TRA_JSON_DAY_DU_NHUNG,
  MOTION_TEXT_POINT,
  MOTION_TEXT_PULL_OUT,
  MOTION_TEXT_PUSH,
  MOTION_TEXT_PUSH_IN,
  MOTION_TEXT_QUOTE,
  MOTION_TEXT_RAIN,
  MOTION_TEXT_RETREAT,
  MOTION_TEXT_RICH_TEXTAREA,
  MOTION_TEXT_RIGHT,
  MOTION_TEXT_RIGHT_TO_LEFT,
  MOTION_TEXT_ROLE_ALERT,
  MOTION_TEXT_ROOMPAGE,
  MOTION_TEXT_RUN,
  MOTION_TEXT_SCATTER,
  MOTION_TEXT_SCENE,
  MOTION_TEXT_SNEAK,
  MOTION_TEXT_SNOW,
  MOTION_TEXT_STAND,
  MOTION_TEXT_STATS,
  MOTION_TEXT_STAY,
  MOTION_TEXT_STORM,
  MOTION_TEXT_SWIM,
  MOTION_TEXT_SYLLABLES,
  MOTION_TEXT_SYMBOL_13,
  MOTION_TEXT_SYMBOL_14,
  MOTION_TEXT_SYMBOL_27,
  MOTION_TEXT_SYMBOL_28,
  MOTION_TEXT_SYMBOL_30,
  MOTION_TEXT_SYMBOL_35,
  MOTION_TEXT_SYMBOL_36,
  MOTION_TEXT_SYMBOL_40,
  MOTION_TEXT_SYMBOL_41,
  MOTION_TEXT_SYMBOL_47,
  MOTION_TEXT_SYMBOL_49,
  MOTION_TEXT_SYMBOL_50,
  MOTION_TEXT_SYMBOL_51,
  MOTION_TEXT_TEXT,
  MOTION_TEXT_THE_FIRST_BEAT_USES_VISUAL_TITLE_A_HOOK,
  MOTION_TEXT_THE_LAST_BEAT_USES_VISUAL_ENDING_WITH_A,
  MOTION_TEXT_TIMELINE,
  MOTION_TEXT_TIME_DAY_DUSK_NIGHT_INTERIOR_INTERIOR_DARK,
  MOTION_TEXT_TITLE,
  MOTION_TEXT_TOWARD_CENTER,
  MOTION_TEXT_UNCERTAIN,
  MOTION_TEXT_USER,
  MOTION_TEXT_USER_QUERY,
  MOTION_TEXT_UTF8,
  MOTION_TEXT_VIETNAMESE,
  MOTION_TEXT_VIETNAMESE_SYLLABLES_WORDS,
  MOTION_TEXT_WALK,
  MOTION_TEXT_WEATHER_NONE_RAIN_STORM_FOG_SNOW,
  MOTION_TEXT_WIDE,
  MOTION_TEXT_WOMAN_CASUAL,
  MOTION_TEXT_WORDS,
  MOTION_TEXT_WRONG,
} from "../../constants/motionRuntime.js";
import { parseJson, stringifyJson } from "../../lib/jsonStringify.js";
import { AsyncLocalStorage } from "async_hooks";
import { randomUUID } from "crypto";
import fs from "fs";
import _ from "lodash";
import path from "path";
import { CINEMATIC_CHAT_PLANNING_CONFIG } from "../../constants/index.js";
import { MOTION_STORY_CAST_HINTS, MOTION_STORY_CONFIG, MOTION_STORY_SETPIECE_RULES } from "../../constants/motionVideo.js";
import { AiPlanningChatModel, AiPlanningExecutionMode, AiPlanningFallbackProvider } from "../../types.js";
import { MotionStoryLength, type MotionAiExecution, type MotionBeat, type MotionCastMember, type MotionCatalog, type MotionChapter, type MotionParamAnim, type MotionStoryAnalysis, type MotionStorySource } from "../../types/motionVideo.js";
import { beginChatPlanningRun, closeChatBrowserIfIdle, closeChatPlanningRoom, generatePlanningWithChatUi, prepareChatPlanningRoom } from "./chatUiPlanningService.js";
import { cancelGlobalBrowserCleanup } from "./imageGeneratorService.js";
import { generateContentWithRetry } from "./geminiService.js";
import { loadMotionEngine } from "./motionEngineService.js";
import { matchLibraryId } from "./motionLibraryMatch.js";
import { getMotionRootDirectory, listMotionCharacters } from "./motionLibraryService.js";
import { withRealCatalog } from "./motionRealAssetService.js";
import { roleGuide, stagingNote } from "./motionSetPieceService.js";
import { AiTaskCapability } from "./taskRouterService.js";
const TIMESTAMP_RE = /\((\d{1,2}):(\d{2})(?::(\d{2}))?\)/g;
const NOISE_RE = /\[(?:music|applause|laughter|âm nhạc|nhạc)\]|>>/gi;
const toSeconds = (a: string, b: string, c?: string): number => (c ? _.toNumber(a) * 3600 + _.toNumber(b) * 60 + _.toNumber(c) : _.toNumber(a) * 60 + _.toNumber(b));
const cleanText = (s: string): string =>
  _.trim(
    s
      .replace(NOISE_RE, MOTION_TEXT_SYMBOL_13)
      .replace(/\s+/g, MOTION_TEXT_SYMBOL_13)
      .replace(/\s+([,.!?;:])/g, MOTION_TEXT_1_2),
  );
export const parseStorySource = (raw: string): MotionStorySource => {
  const input = _.toString(raw).replace(/\r\n?/g, MOTION_TEXT_SYMBOL_27);
  if (_.trim(input).length < 40) throw new Error(MOTION_TEXT_NOI_DUNG_CAU_CHUYEN_QUA_NGAN);
  const transcriptIdx = input.search(/^\s*(transcript|bản ghi|lời thoại)\s*:\s*$/im);
  const head = transcriptIdx >= 0 ? input.slice(0, transcriptIdx) : input.slice(0, Math.min(input.length, 400));
  const body = transcriptIdx >= 0 ? input.slice(transcriptIdx).replace(/^\s*[^\n]*\n/, "") : input;
  const headLines = _.compact(_.map(head.split(MOTION_TEXT_SYMBOL_27), _.trim));
  const url = _.find(headLines, (l) => /^https?:\/\//i.test(l)) || (input.match(/https?:\/\/\S+/) || [])[0];
  const titleLine = _.find(headLines, (l) => !/^https?:\/\//i.test(l) && !/^\(\d/.test(l)) || MOTION_TEXT_CAU_CHUYEN;
  const title = _.trim(titleLine.replace(/\s*[-|–]\s*YouTube\s*$/i, ""));
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
    const text = cleanText(transcriptIdx >= 0 ? body : _.drop(input.split(MOTION_TEXT_SYMBOL_27), url ? 2 : 1).join(MOTION_TEXT_SYMBOL_13));
    if (text) segments.push({ t: 0, text });
  }
  const text = _.map(segments, MOTION_TEXT_TEXT).join(MOTION_TEXT_SYMBOL_13);
  const words = _.size(_.compact(text.split(/\s+/)));
  if (words < 20) throw new Error(MOTION_TEXT_KHONG_TIM_THAY_NOI_DUNG_TRANSCRIPT_HOP_LE);
  const lastT = _.last(segments)?.t || 0;
  const lastWords = _.size(_.compact((_.last(segments)?.text || "").split(/\s+/)));
  const sourceSeconds = matches.length ? Math.round(lastT + lastWords / 2.6) : Math.round(words / 2.6);
  return { title, url, text, segments, words, sourceSeconds };
};
export const resolveTargetSeconds = (source: MotionStorySource, length: MotionStoryLength): number => {
  if (length === MotionStoryLength.TEN) return Math.min(600, source.sourceSeconds);
  if (length === MotionStoryLength.FIVE) return Math.min(300, source.sourceSeconds);
  if (length === MotionStoryLength.SHORT) return 75;
  if (length === MotionStoryLength.ONE) return 60;
  return Math.max(60, source.sourceSeconds);
};
const formatTs = (s: number) => MOTION_TEMPLATE_SYMBOL_11(`${Math.floor(s / 60)}`, `${String(Math.floor(s % 60)).padStart(2, MOTION_TEXT_0)}`);
const sourceSlice = (source: MotionStorySource, from?: number, to?: number): string => {
  const a = from ?? 0,
    b = to ?? Infinity;
  const picked = _.filter(source.segments, (s) => s.t >= a - 0.5 && s.t < b);
  return _.map(_.isEmpty(picked) ? source.segments : picked, (s) => MOTION_TEMPLATE_SYMBOL_21(`${formatTs(s.t)}`, `${s.text}`)).join(MOTION_TEXT_SYMBOL_27);
};
export const extractJson = (raw: string): any => {
  const text = _.trim(_.toString(raw))
    .replace(/^```(?:json)?/i, "")
    .replace(/```\s*$/i, "");
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
  return raw.replace(/[,:\s]+$/, "") + stack.reverse().join("");
};
const pickEnum = <T extends string>(values: T[], v: unknown, fallback: T): T => (_.includes(values, v) ? (v as T) : fallback);
export const TEXT_ONLY_PREAMBLE = MOTION_TEXT_IMPORTANT_TEXT_ONLY_TASK_YOU_ONLY_WRITE_TEXT;
const writeMotionAiDebug = async (requestId: string, data: Record<string, unknown>): Promise<void> => {
  try {
    const dir = path.join(getMotionRootDirectory(), MOTION_TEXT_AI_DEBUG);
    await fs.promises.mkdir(dir, { recursive: true });
    await fs.promises.writeFile(path.join(dir, MOTION_TEMPLATE_JSON(`${requestId}`)), stringifyJson({ at: new Date().toISOString(), requestId, ...data }, null, 2), MOTION_TEXT_UTF8);
  } catch {}
};
const probeRoomPage = async (page: any, requestId: string): Promise<Record<string, unknown> | undefined> => {
  if (!page || typeof page.evaluate !== MOTION_TEXT_FUNCTION || page.isClosed?.()) return undefined;
  try {
    const dir = path.join(getMotionRootDirectory(), MOTION_TEXT_AI_DEBUG);
    await fs.promises.mkdir(dir, { recursive: true });
    await page.screenshot({ path: path.join(dir, MOTION_TEMPLATE_PNG(`${requestId}`)), timeout: 15000 }).catch(_.noop);
    const html = await page.content().catch(() => "");
    if (html) await fs.promises.writeFile(path.join(dir, MOTION_TEMPLATE_DOM_TXT(`${requestId}`)), html, MOTION_TEXT_UTF8).catch(_.noop);
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
          const body = (document.body?.innerText || "").replace(/\s+/g, motionBrowserTexts.MOTION_TEXT_SYMBOL_13);
          return { url: location.href, title: document.title, counts, textTail: body.slice(-1500), textHead: body.slice(0, 600) };
        },
        {
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
const salvageRoomJson = (text: string | undefined, artifactType: string): any => {
  if (!text || text.length < 40) return undefined;
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
export interface MotionAiImage {
  name: string;
  mimeType: string;
  path: string;
}
interface MotionAiRun {
  projectId: string;
  workerId: string;
  signal: AbortSignal;
  rooms: Map<string, AiPlanningFallbackProvider>;
  roomQueue: Promise<void>;
}
const motionAiRunStore = new AsyncLocalStorage<MotionAiRun>();
let motionAiSessions = 0;
let motionAiUsedBrowser = false;
let motionAiIdleTimer: ReturnType<typeof setTimeout> | null = null;
const closeMotionAiRoom = async (run: MotionAiRun, workerId: string): Promise<void> => {
  const provider = run.rooms.get(workerId);
  if (!provider) return;
  run.rooms.delete(workerId);
  await closeChatPlanningRoom({ provider, projectId: run.projectId, workerId }).catch(_.noop);
};
export const runInMotionAiSession = async <T>(runId: string, fn: () => Promise<T>): Promise<T> => {
  motionAiSessions++;
  if (motionAiIdleTimer) clearTimeout(motionAiIdleTimer);
  motionAiIdleTimer = null;
  const projectId = `${MOTION_STORY_CONFIG.PROJECT_ID_PREFIX}${runId}`;
  const planningRun = beginChatPlanningRun(projectId, Date.now(), MOTION_STORY_CONFIG.WORKER_IDS[0]);
  const run: MotionAiRun = { projectId, workerId: MOTION_STORY_CONFIG.WORKER_IDS[0], signal: planningRun.signal, rooms: new Map(), roomQueue: Promise.resolve() };
  try {
    return await motionAiRunStore.run(run, fn);
  } finally {
    planningRun.complete();
    await Promise.allSettled(_.map([...run.rooms.keys()], (workerId) => closeMotionAiRoom(run, workerId)));
    motionAiSessions = Math.max(0, motionAiSessions - 1);
    if (!motionAiSessions && motionAiUsedBrowser) {
      cancelGlobalBrowserCleanup();
      motionAiIdleTimer = setTimeout(() => {
        motionAiIdleTimer = null;
        if (motionAiSessions) return;
        motionAiUsedBrowser = false;
        void closeChatBrowserIfIdle().catch(_.noop);
      }, MOTION_STORY_CONFIG.BROWSER_KEEP_ALIVE_MS);
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
export const runMotionAi = async (prompt: string, artifactType: string, exec: MotionAiExecution, signal?: AbortSignal, log?: (s: string) => void, images?: MotionAiImage[], attempt = 0): Promise<any> => {
  const mode = pickEnum(_.values(AiPlanningExecutionMode), exec.mode, AiPlanningExecutionMode.ApiOnly);
  const provider = pickEnum(_.values(AiPlanningFallbackProvider), exec.provider, AiPlanningFallbackProvider.GeminiChat);
  const useRoom = mode !== AiPlanningExecutionMode.ApiOnly && provider !== AiPlanningFallbackProvider.Disabled;
  const requestId = MOTION_TEMPLATE_SYMBOL_5(`${artifactType}`, `${randomUUID().slice(0, 8)}`);
  const identity = MOTION_TEMPLATE_ARTIFACTTYPE_REQUESTID(`${artifactType}`, `${requestId}`);
  const fullPrompt = MOTION_TEMPLATE_MANDATORY_OUTPUT_RETURN_EXACTLY_ONE_VALID_JSON_OBJECT(`${prompt}`, `${identity}`);
  if (useRoom) {
    const run = motionAiRunStore.getStore();
    const projectId = run?.projectId || `${MOTION_STORY_CONFIG.PROJECT_ID_PREFIX}${requestId}`;
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
      log?.(MOTION_TEMPLATE_GUI_YEU_CAU_TOI_PHONG_CHAT_AI_CAU(`${provider}`));
      const model = pickEnum(_.values(AiPlanningChatModel), exec.model, AiPlanningChatModel.GeminiFlash);
      if (run && !run.rooms.has(workerId!)) {
        const prepared = run.roomQueue.then(() => prepareChatPlanningRoom({ provider, model, prompt: "", projectId, workerId, chromeHeadless: exec.chromeHeadless !== false, signal: roomCtrl.signal, allowDefaultGeminiModel: true }));
        run.roomQueue = prepared.catch(_.noop);
        run.rooms.set(workerId!, provider);
        await prepared;
      }
      const r = await generatePlanningWithChatUi({
        provider,
        model,
        prompt: fullPrompt,
        projectId,
        workerId,
        chromeHeadless: exec.chromeHeadless !== false,
        artifactType,
        requestId,
        signal: roomCtrl.signal,
        closeRoomOnComplete: !run,
        allowDefaultGeminiModel: true,
        attachments: images?.length ? _.map(images, (im) => ({ name: im.name, mimeType: im.mimeType, path: im.path })) : undefined,
      });
      roomOk = true;
      return extractJson(r.text);
    } catch (caught: any) {
      if (signal?.aborted && !timedOut) throw caught;
      const diag = _.get(caught, MOTION_TEXT_DIAGNOSTICS) as { lastCandidate?: string; candidateChars?: number; busy?: boolean; identityMatch?: boolean; elapsedMs?: number; responseCount?: number; initialCount?: number } | undefined;
      const roomProbe = await probeRoomPage(_.get(caught, MOTION_TEXT_ROOMPAGE), requestId);
      await writeMotionAiDebug(requestId, { stage: artifactType, provider, error: _.toString(caught?.message), promptChars: fullPrompt.length, ...(diag || {}), room: roomProbe });
      if (diag) log?.(MOTION_TEMPLATE_CHAN_DOAN_PHONG_CHAT_PHAN_HOI_KY_TU(`${diag.candidateChars ?? 0}`, `${diag.busy ? MOTION_TEXT_CO : MOTION_TEXT_KHONG}`, `${diag.identityMatch ? MOTION_TEXT_CO : MOTION_TEXT_KHONG}`, `${Math.round((diag.elapsedMs || 0) / 1000)}`));
      if (diag?.lastCandidate && diag.lastCandidate.length < 400 && !/[{}]/.test(diag.lastCandidate)) log?.(MOTION_TEMPLATE_AI_TRA_LOI_KHONG_PHAI_JSON(`${_.truncate(diag.lastCandidate, { length: 160 })}`));
      const salvaged = salvageRoomJson(diag?.lastCandidate, artifactType);
      if (salvaged) {
        log?.(MOTION_TEXT_PHONG_CHAT_DA_TRA_JSON_DAY_DU_NHUNG);
        return salvaged;
      }
      if (!timedOut && _.toString(caught?.message) === CINEMATIC_CHAT_PLANNING_CONFIG.PROVIDER_ERROR_RESPONSE_ERROR && attempt < MOTION_STORY_CONFIG.ROOM_PROVIDER_RETRIES) {
        retryRoom = true;
        log?.(MOTION_STORY_CONFIG.ROOM_RETRY_LOG);
      } else {
        const error = timedOut ? new Error(MOTION_TEMPLATE_PHONG_CHAT_AI_KHONG_TRA_KET_QUA_SAU(`${Math.round(MOTION_STORY_CONFIG.ROOM_TIMEOUT_MS / 60000)}`)) : caught;
        log?.(MOTION_TEMPLATE_PHONG_CHAT_LOI(`${_.truncate(_.toString(error?.message), { length: 140 })}`));
        if (mode === AiPlanningExecutionMode.RoomOnly) throw error;
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
  }
  log?.(MOTION_TEXT_GOI_AI_QUA_API);
  const contents = images?.length ? [{ role: MOTION_TEXT_USER, parts: [{ text: fullPrompt }, ..._.map(images, (im) => ({ inlineData: { mimeType: im.mimeType, data: fs.readFileSync(im.path).toString(MOTION_TEXT_BASE64) } }))] }] : fullPrompt;
  const response = await generateContentWithRetry({ contents, task: { capability: AiTaskCapability.ScriptWriting }, config: { responseMimeType: MOTION_TEXT_APPLICATION_JSON } });
  const text = _.isString(response) ? response : response?.candidates?.[0]?.content?.parts?.[0]?.text || response?.text || "";
  return extractJson(text);
};
export const catalogGuide = (catalog: MotionCatalog, detailed = false, focusEnvs: string[] = []): string => {
  const custom = listMotionCharacters();
  const charLine = _.map([...catalog.characters, ...custom], (c) => `${c.id}${c.builtin === false ? MOTION_TEXT_CUSTOM : ""}`).join(MOTION_TEXT_SYMBOL_14);
  const byCat = _.groupBy(catalog.assets, (a) => a.category || MOTION_TEXT_OTHER);
  const info = loadMotionEngine().registryInfo;
  const paramText = (params: unknown) => (_.isPlainObject(params) && !_.isEmpty(params) ? MOTION_TEMPLATE_PARAMS(`${_.map(params as Record<string, unknown>, (v, k) => MOTION_TEMPLATE_SYMBOL_30(`${k}`, `${_.truncate(_.toString(v), { length: 60 })}`)).join(MOTION_TEXT_SYMBOL_41)}`) : "");
  if (!detailed)
    return [
      MOTION_TEMPLATE_ENV_IDS(`${_.map(catalog.environments, MOTION_TEXT_ID).join(MOTION_TEXT_SYMBOL_14)}`),
      MOTION_TEXT_TIME_DAY_DUSK_NIGHT_INTERIOR_INTERIOR_DARK,
      MOTION_TEXT_WEATHER_NONE_RAIN_STORM_FOG_SNOW,
      MOTION_TEMPLATE_CHARACTER_IDS_LIBRARY(`${charLine}`),
      MOTION_STORY_CAST_HINTS,
      roleGuide(custom),
      MOTION_TEMPLATE_ACTION_IDS(`${_.map(catalog.actions, MOTION_TEXT_ID).join(MOTION_TEXT_SYMBOL_14)}`),
      MOTION_TEXT_ASSET_IDS_BY_CATEGORY,
      ..._.map(byCat, (items, cat) => MOTION_TEMPLATE_SYMBOL_22(`${cat}`, `${_.map(items, MOTION_TEXT_ID).join(MOTION_TEXT_SYMBOL_14)}`)),
    ].join(MOTION_TEXT_SYMBOL_27);
  const focus = new Set(focusEnvs);
  const [shownEnvs, listedEnvs] = _.partition(catalog.environments, (e: any) => !focus.size || focus.has(e.id) || !_.isEmpty(e.params));
  return [
    MOTION_TEXT_ENVIRONMENTS_2,
    ..._.map(shownEnvs, (e: any) => {
      const contains = _.take(info.envs[e.id]?.builtins || [], 6);
      return MOTION_TEMPLATE_SYMBOL_31(`${e.id}`, `${e.name}${stagingNote(e.id)}`, `${contains.length ? MOTION_TEMPLATE_CONTAINS(`${contains.join(MOTION_TEXT_SYMBOL_14)}`) : ""}`, `${info.envs[e.id]?.time ? MOTION_TEMPLATE_DEFAULT_TIME(`${info.envs[e.id].time}`) : ""}`, `${paramText(e.params)}`);
    }),
    ...(listedEnvs.length ? [MOTION_TEMPLATE_ENV_IDS(`${_.map(listedEnvs, MOTION_TEXT_ID).join(MOTION_TEXT_SYMBOL_14)}`)] : []),
    MOTION_TEXT_TIME_DAY_DUSK_NIGHT_INTERIOR_INTERIOR_DARK,
    MOTION_TEXT_WEATHER_NONE_RAIN_STORM_FOG_SNOW,
    MOTION_TEMPLATE_CHARACTER_IDS_LIBRARY(`${charLine}`),
    MOTION_STORY_CAST_HINTS,
    roleGuide(custom),
    MOTION_TEMPLATE_ACTION_IDS(`${_.map(catalog.actions, MOTION_TEXT_ID).join(MOTION_TEXT_SYMBOL_14)}`),
    MOTION_TEXT_ASSET_IDS_BY_CATEGORY,
    ..._.map(byCat, (items, cat) => MOTION_TEMPLATE_SYMBOL_22(`${cat}`, `${_.map(items, (a: any) => `${a.id}${paramText(a.params)}`).join(MOTION_TEXT_SYMBOL_14)}`)),
  ].join(MOTION_TEXT_SYMBOL_27);
};
export const analyzeStory = async (source: MotionStorySource, opts: { language: string; length: MotionStoryLength; exec: MotionAiExecution; signal?: AbortSignal; log?: (s: string) => void }): Promise<MotionStoryAnalysis> => {
  const engine = loadMotionEngine();
  const catalog = withRealCatalog(engine.catalog);
  const target = resolveTargetSeconds(source, opts.length);
  const chapterCount = _.clamp(Math.round(target / 150), 1, 10);
  const narrationLanguage = opts.language === MOTION_TEXT_EN ? MOTION_TEXT_ENGLISH : MOTION_TEXT_VIETNAMESE;
  const prompt = MOTION_TEMPLATE_ROLE_DOCUMENTARY_STORY_EDITOR_YOUTUBE_HISTORY_TRUE_STORY(`${TEXT_ONLY_PREAMBLE}`, `${source.title}`, `${Math.round(target)}`, `${narrationLanguage}`, `${chapterCount}`, `${catalogGuide(catalog)}`, `${_.map(catalog.looks, MOTION_TEXT_ID).join(MOTION_TEXT_SYMBOL_14)}`, `${narrationLanguage}`, `${sourceSlice(source)}`);
  const raw = await runMotionAi(prompt, MOTION_STORY_CONFIG.ARTIFACT_ANALYSIS, opts.exec, opts.signal, opts.log);
  return normalizeAnalysis(raw, source, catalog, target);
};
const slugKey = (s: string): string =>
  _.trim(
    _.deburr(_.toString(s).replace(/đ/g, MOTION_TEXT_D).replace(/Đ/g, MOTION_TEXT_D_2))
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, MOTION_TEXT_SYMBOL_30),
    MOTION_TEXT_SYMBOL_30,
  ).slice(0, 24) || MOTION_TEXT_NV;
export const normalizeAnalysis = (raw: any, source: MotionStorySource, catalog: MotionCatalog, target: number): MotionStoryAnalysis => {
  const charIds = [..._.map(catalog.characters, MOTION_TEXT_ID), ..._.map(listMotionCharacters(), MOTION_TEXT_ID)];
  const lookIds = _.map(catalog.looks, MOTION_TEXT_ID);
  let chapters: MotionChapter[] = _.map(_.castArray(raw?.chapters || []), (c: any, i: number) => ({
    id: MOTION_TEMPLATE_C_2(`${i + 1}`),
    title: _.truncate(_.toString(c?.title || MOTION_TEMPLATE_CHUONG(`${i + 1}`)), { length: 80 }),
    summary: _.truncate(_.toString(c?.summary || ""), { length: 400 }),
    from: _.isFinite(_.toNumber(c?.from)) ? _.toNumber(c.from) : undefined,
    to: _.isFinite(_.toNumber(c?.to)) ? _.toNumber(c.to) : undefined,
  }));
  if (_.isEmpty(chapters)) chapters = [{ id: MOTION_TEXT_C1, title: source.title, summary: "", from: 0, to: source.sourceSeconds }];
  const spans = _.map(chapters, (c, i) => Math.max(10, (c.to ?? chapters[i + 1]?.from ?? source.sourceSeconds) - (c.from ?? 0)));
  const total = _.sum(spans);
  chapters = _.map(chapters, (c, i) => ({ ...c, targetSeconds: Math.max(15, Math.round((spans[i] / total) * target)) }));
  const usedKeys = new Set<string>();
  const cast: MotionCastMember[] = _.compact(
    _.map(_.castArray(raw?.cast || []), (m: any) => {
      if (!m?.name) return null;
      let key = slugKey(m.key || m.name);
      while (usedKeys.has(key)) key = MOTION_TEMPLATE_2_2(`${key}`);
      usedKeys.add(key);
      return {
        key,
        name: _.truncate(_.toString(m.name), { length: 60 }),
        role: _.truncate(_.toString(m.role || ""), { length: 60 }),
        description: _.truncate(_.toString(m.description || ""), { length: 200 }),
        characterId: matchLibraryId(charIds, m.characterId) || matchLibraryId(charIds, m.role) || (/female|woman|girl|\bshe\b/i.test(MOTION_TEMPLATE_SYMBOL_12(`${m.suggested?.gender || ""}`, `${m.description || ""}`)) ? MOTION_TEXT_WOMAN_CASUAL : MOTION_TEXT_MAN_CASUAL),
        suggested: m.suggested && _.isObject(m.suggested) ? (m.suggested as any) : undefined,
      };
    }),
  );
  return {
    title: _.truncate(_.toString(raw?.title || source.title), { length: 120 }),
    logline: _.truncate(_.toString(raw?.logline || ""), { length: 300 }),
    look: pickEnum(lookIds, raw?.look, MOTION_TEXT_DOCUMENTARY),
    accent: /^#[0-9a-f]{6}$/i.test(_.toString(raw?.accent)) ? raw.accent : MOTION_TEXT_FFB070,
    chapters,
    cast,
    places: _.uniq(_.compact(_.map(_.castArray(raw?.places || []), (p) => matchLibraryId(_.map(catalog.environments, MOTION_TEXT_ID), p)))),
    design: _.isArray(raw?.design) ? raw.design : [],
    facts: _.take(
      _.map(_.castArray(raw?.facts || []), (f: any) => ({ claim: _.toString(f?.claim), status: pickEnum([MOTION_TEXT_OK, MOTION_TEXT_UNCERTAIN, MOTION_TEXT_WRONG] as const as any, f?.status, MOTION_TEXT_UNCERTAIN), note: _.toString(f?.note || "") })),
      40,
    ),
  };
};
const VISUALS = [MOTION_TEXT_SCENE, MOTION_TEXT_TITLE, MOTION_TEXT_CHAPTER, MOTION_TEXT_QUOTE, MOTION_TEXT_STATS, MOTION_TEXT_COUNTER, MOTION_TEXT_OBJECT, MOTION_TEXT_MAP, MOTION_TEXT_TIMELINE, MOTION_TEXT_HEADLINE, MOTION_TEXT_ENDING];
const SHOTS = [MOTION_TEXT_AERIAL, MOTION_TEXT_WIDE, MOTION_TEXT_MEDIUM, MOTION_TEXT_CLOSE, MOTION_TEXT_INSERT, MOTION_TEXT_FOLLOW, MOTION_TEXT_PAN_LEFT, MOTION_TEXT_PAN_RIGHT, MOTION_TEXT_PUSH_IN, MOTION_TEXT_PULL_OUT];
const FORMATIONS = [MOTION_TEXT_BLOCK, MOTION_TEXT_BLOCKS, MOTION_TEXT_LINE, MOTION_TEXT_COLUMN, MOTION_TEXT_SCATTER];
const CROWD_MOVES = [MOTION_TEXT_STAY, MOTION_TEXT_LEFT_TO_RIGHT, MOTION_TEXT_RIGHT_TO_LEFT, MOTION_TEXT_ADVANCE, MOTION_TEXT_RETREAT];
const MOVES = [MOTION_TEXT_STAY, MOTION_TEXT_LEFT_TO_RIGHT, MOTION_TEXT_RIGHT_TO_LEFT, MOTION_TEXT_ENTER_LEFT, MOTION_TEXT_ENTER_RIGHT, MOTION_TEXT_EXIT_LEFT, MOTION_TEXT_EXIT_RIGHT, MOTION_TEXT_TOWARD_CENTER];
const LANES = [MOTION_TEXT_BACK, MOTION_TEXT_MID, MOTION_TEXT_FRONT, MOTION_TEXT_FORE];
const TIMES = [MOTION_TEXT_DAY, MOTION_TEXT_DUSK, MOTION_TEXT_NIGHT, MOTION_TEXT_INTERIOR, MOTION_TEXT_INTERIOR_DARK];
const WEATHERS = [MOTION_TEXT_NONE, MOTION_TEXT_RAIN, MOTION_TEXT_STORM, MOTION_TEXT_FOG, MOTION_TEXT_SNOW];
export const storyboardRules = (narrationLanguage: string): string => [MOTION_TEMPLATE_STORYBOARD_THE_PICTURE_MUST_TELL_THE_SAME_STORY(`${VISUALS.join(MOTION_TEXT_SYMBOL_40)}`, `${SHOTS.join(MOTION_TEXT_SYMBOL_14)}`, `${MOVES.join(MOTION_TEXT_SYMBOL_28)}`, `${narrationLanguage}`), MOTION_STORY_SETPIECE_RULES].join(MOTION_TEXT_SYMBOL_27);
export const writeChapterBeats = async (source: MotionStorySource, analysis: MotionStoryAnalysis, chapter: MotionChapter, opts: { language: string; exec: MotionAiExecution; signal?: AbortSignal; log?: (s: string) => void; previous?: MotionBeat[]; previousSummary?: string; isFirst: boolean; isLast: boolean }): Promise<MotionBeat[]> => {
  const catalog = withRealCatalog(loadMotionEngine().catalog);
  const isVi = opts.language !== MOTION_TEXT_EN;
  const seconds = chapter.targetSeconds || 120;
  const units = Math.round(seconds * (isVi ? MOTION_STORY_CONFIG.VI_SYLLABLES_PER_SECOND : MOTION_STORY_CONFIG.EN_WORDS_PER_SECOND) * MOTION_STORY_CONFIG.LENGTH_SAFETY);
  const beatsWanted = Math.max(2, Math.round(seconds / MOTION_STORY_CONFIG.TARGET_BEAT_SECONDS));
  const castList = _.map(analysis.cast, (c) => MOTION_TEMPLATE_DRAWN_AS(`${c.key}`, `${c.name}`, `${c.role || ""}`, `${c.characterId}`)).join(MOTION_TEXT_SYMBOL_27);
  const prev = opts.previous?.length ? _.map(_.takeRight(opts.previous, 2), (b) => MOTION_TEMPLATE_SYMBOL_23(`${b.narration}`)).join(MOTION_TEXT_SYMBOL_27) : opts.previousSummary ? MOTION_TEMPLATE_SYMBOL_23(`${opts.previousSummary}`) : "";
  const narrationLanguage = isVi ? MOTION_TEXT_VIETNAMESE : MOTION_TEXT_ENGLISH;
  const prompt = MOTION_TEMPLATE_ROLE_DOCUMENTARY_SCRIPTWRITER_WRITE_THE_NARRATION_TEXT_AND_2(
    `${TEXT_ONLY_PREAMBLE}`,
    `${analysis.title}`,
    `${analysis.logline}`,
    `${chapter.id}`,
    `${chapter.title}`,
    `${chapter.summary}`,
    `${isVi ? MOTION_TEXT_NATURAL_FLUENT_VIETNAMESE_IN_A_DOCUMENTARY_STORYTELLING_VOICE : MOTION_TEXT_NATURAL_ENGLISH_DOCUMENTARY_NARRATION_SHORT_CLEAR_SENTENCES}`,
    `${narrationLanguage}`,
    `${units}`,
    `${isVi ? MOTION_TEXT_VIETNAMESE_SYLLABLES_WORDS : MOTION_TEXT_WORDS}`,
    `${seconds}`,
    `${units}`,
    `${isVi ? MOTION_TEXT_SYLLABLES : MOTION_TEXT_WORDS}`,
    `${beatsWanted}`,
    `${Math.max(8, Math.round(units / beatsWanted))}`,
    `${isVi ? MOTION_TEXT_SYLLABLES : MOTION_TEXT_WORDS}`,
    `${opts.isFirst ? MOTION_TEXT_THE_FIRST_BEAT_USES_VISUAL_TITLE_A_HOOK : ""}`,
    `${opts.isLast ? MOTION_TEXT_THE_LAST_BEAT_USES_VISUAL_ENDING_WITH_A : ""}`,
    `${prev ? MOTION_TEMPLATE_CONTINUE_NATURALLY_FROM_THE_PREVIOUS_CHAPTER_WHICH_ENDED(`${prev}`) : ""}`,
    `${storyboardRules(narrationLanguage)}`,
    `${castList || MOTION_TEXT_NONE_2}`,
    `${catalogGuide(catalog, true, analysis.places || [])}${analysis.designed?.length ? MOTION_TEMPLATE_NEW_ITEMS_DESIGNED_FOR_THIS_STORY_PREFER_THEM(`${analysis.designed.join(MOTION_TEXT_SYMBOL_14)}`) : ""}`,
    `${chapter.id}`,
    `${sourceSlice(source, chapter.from, chapter.to)}`,
  );
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const retryNote = attempt ? MOTION_TEMPLATE_YOUR_PREVIOUS_ANSWER_FAILED_REMINDER_THIS_IS_ONLY(`${_.truncate(_.toString(_.get(lastError, MOTION_TEXT_MESSAGE, lastError)), { length: 300 })}`) : "";
      const raw = await runMotionAi(`${prompt}${retryNote}`, MOTION_STORY_CONFIG.ARTIFACT_CHAPTER, opts.exec, opts.signal, opts.log);
      const beats = normalizeBeats(_.castArray(raw?.beats || []), chapter.id, analysis, catalog);
      if (beats.length < 1) throw new Error(MOTION_TEXT_CHUONG_KHONG_CO_BEAT_NAO);
      return beats;
    } catch (error) {
      if (opts.signal?.aborted) throw error;
      lastError = error;
      opts.log?.(MOTION_TEMPLATE_CHUONG_LOI_THU_LAI(`${chapter.id}`, `${_.truncate(_.toString(_.get(error, MOTION_TEXT_MESSAGE, error)), { length: 120 })}`));
    }
  }
  throw lastError;
};
const num01 = (v: unknown, d: number) => (_.isFinite(_.toNumber(v)) && v !== null && v !== "" ? _.clamp(_.toNumber(v), 0, 1) : d);
const NARRATION_RULES = {
  leave: /(rời đi|bỏ đi|ra về|biến mất|tẩu thoát|trốn thoát|lẩn trốn|rút lui|bỏ chạy|lặng lẽ đi|\bleaves?\b|\bleft the\b|walks? away|slips? away|escap|disappear|vanish)/i,
  arrive: /(bước vào|đi vào|tiến vào|xuất hiện|đến nơi|ghé|\benters?\b|walks? in|arriv|steps? into)/i,
  joy: /(ăn mừng|vui mừng|reo hò|hò reo|chiến thắng|hân hoan|thành công|celebrat|cheer|rejoic|triumph|victory|\bwon\b)/i,
  pry: /(cậy|phá két|phá khóa|khoan|cắt|hàn|mở tung|đục|break(s|ing)? (open|into)|pr(y|ies|ied)|drill|crack|cut through|weld)/i,
  dig: /(đào|xới|\bdig|tunnel(l)?ing)/i,
  carry: /(mang|vác|khuân|chất|ôm|cuỗm|vét|tẩu tán|carr(y|ies)|haul|loot|stuff(s|ed)? (bags|sacks))/i,
  search: /(lục soát|tìm kiếm|soi|dò|search|look(s|ing)? for|inspect)/i,
  group: /(hai mươi|ba mươi|bốn mươi|năm mươi|hàng chục|hàng trăm|đồng phạm|băng nhóm|băng đảng|toán (trộm|cướp|người|lính|thợ)|nhóm|đám đông|đoàn người|quân lính|binh lính|đội quân|\bgang\b|\bcrew\b|accomplices|\bteam\b|\barmy\b|\bcrowd\b|soldiers)/i,
};
const LOCOMOTION_ACTIONS = [MOTION_TEXT_WALK, MOTION_TEXT_RUN, MOTION_TEXT_SNEAK, MOTION_TEXT_CRAWL, MOTION_TEXT_CARRY, MOTION_TEXT_DRAG, MOTION_TEXT_PUSH, MOTION_TEXT_SWIM];
export const reconcileSceneWithNarration = (beat: MotionBeat, analysis: MotionStoryAnalysis, actionIds: string[]): void => {
  const text = beat.narration;
  const actors = beat.actors || [];
  if (!actors.length) return;
  const has = (id: string) => _.includes(actionIds, id);
  for (const a of actors) {
    if (a.action === MOTION_TEXT_CELEBRATE && !NARRATION_RULES.joy.test(text)) {
      if (NARRATION_RULES.pry.test(text) && has(MOTION_TEXT_DRILL)) a.action = MOTION_TEXT_DRILL;
      else if (NARRATION_RULES.dig.test(text) && has(MOTION_TEXT_DIG)) a.action = MOTION_TEXT_DIG;
      else if (NARRATION_RULES.carry.test(text) && has(MOTION_TEXT_LIFT)) a.action = MOTION_TEXT_LIFT;
      else if (NARRATION_RULES.search.test(text) && has(MOTION_TEXT_LOOK_AROUND)) a.action = MOTION_TEXT_LOOK_AROUND;
      else a.action = has(MOTION_TEXT_POINT) ? MOTION_TEXT_POINT : MOTION_TEXT_STAND;
    }
  }
  const main = actors[0];
  if (NARRATION_RULES.leave.test(text) && _.every(actors, (a) => (a.move || MOTION_TEXT_STAY) === MOTION_TEXT_STAY)) {
    const toRight = (main.pos ?? 0.5) <= 0.6;
    if (!_.includes(LOCOMOTION_ACTIONS, main.action)) main.action = MOTION_TEXT_WALK;
    main.then = undefined;
    main.move = toRight ? MOTION_TEXT_EXIT_RIGHT : MOTION_TEXT_EXIT_LEFT;
  } else if (NARRATION_RULES.arrive.test(text) && _.every(actors, (a) => (a.move || MOTION_TEXT_STAY) === MOTION_TEXT_STAY) && actors.length >= 2) {
    main.move = (main.pos ?? 0.5) <= 0.5 ? MOTION_TEXT_ENTER_LEFT : MOTION_TEXT_ENTER_RIGHT;
  }
  if (NARRATION_RULES.group.test(text) && !beat.crowds?.length && actors.length < 3 && analysis.cast.length) {
    const helper = actors.length > 1 ? actors[actors.length - 1] : actors[0];
    const hp = helper.pos ?? 0.5;
    const free = _.filter(
      _.map([0.16, -0.16, 0.3, -0.3], (d) => +(hp + d).toFixed(2)),
      (p) => p >= 0.08 && p <= 0.92 && _.every(actors, (a) => Math.abs((a.pos ?? 0.5) - p) > 0.12),
    );
    const extra = Math.min(3 - actors.length, free.length);
    for (let i = 0; i < extra; i++) {
      actors.push({ cast: helper.cast, action: helper.action, then: helper.then, move: MOTION_TEXT_STAY, pos: free[i], lane: i % 2 ? MOTION_TEXT_MID : MOTION_TEXT_BACK, facing: undefined });
    }
    beat.actors = actors;
  }
};
const normalizeAnim = (raw: unknown): MotionParamAnim | undefined => {
  if (!_.isPlainObject(raw)) return undefined;
  const out: MotionParamAnim = {};
  _.forEach(raw as Record<string, unknown>, (keys, key) => {
    if (!/^[a-zA-Z][\w]{0,30}$/.test(key) || !_.isArray(keys)) return;
    const ks = _.take(_.compact(_.map(keys, (k: any) => (_.isArray(k) && k.length >= 2 && _.isFinite(_.toNumber(k[0])) ? ([_.clamp(_.toNumber(k[0]), 0, 1), k[1]] as [number, unknown]) : null))), 8);
    if (ks.length) out[key] = _.sortBy(ks, 0);
  });
  return _.isEmpty(out) ? undefined : out;
};
const plainParams = (raw: unknown): Record<string, unknown> | undefined => (_.isPlainObject(raw) && !_.isEmpty(raw) ? (raw as Record<string, unknown>) : undefined);
const normalizeVisual = (b: any, analysis: MotionStoryAnalysis, catalog: MotionCatalog, narration: string): Omit<MotionBeat, "id" | "chapterId" | "narration"> => {
  const envIds = _.map(catalog.environments, MOTION_TEXT_ID);
  const assetIds = _.map(catalog.assets, MOTION_TEXT_ID);
  const actionIds = _.map(catalog.actions, MOTION_TEXT_ID);
  const castKeys = _.map(analysis.cast, MOTION_TEXT_KEY);
  const castByName = (k: string) => (_.includes(castKeys, k) ? k : _.find(analysis.cast, (c) => slugKey(c.name) === slugKey(k) || _.includes(slugKey(c.name), slugKey(k)))?.key);
  const visual = pickEnum(VISUALS, b?.visual, MOTION_TEXT_SCENE);
  const out: Omit<MotionBeat, "id" | "chapterId" | "narration"> = { visual };
  if (visual === MOTION_TEXT_SCENE) {
    out.env = matchLibraryId(envIds, b?.env) || _.first(analysis.places) || MOTION_TEXT_CITY_STREET;
    out.time = pickEnum(TIMES, b?.time, MOTION_TEXT_DAY);
    out.weather = pickEnum(WEATHERS, b?.weather, MOTION_TEXT_NONE);
    out.shot = pickEnum(SHOTS, b?.shot, MOTION_TEXT_MEDIUM);
    out.actors = _.take(
      _.compact(
        _.map(_.castArray(b?.actors || []), (a: any) => {
          const cast = castByName(_.toString(a?.cast || a?.who || ""));
          if (!cast) return null;
          const hold = a?.hold ? matchLibraryId(assetIds, a.hold) : undefined;
          return {
            cast,
            action: matchLibraryId(actionIds, a?.action) || MOTION_TEXT_STAND,
            then: _.includes(actionIds, a?.then) ? a.then : undefined,
            move: pickEnum(MOVES as any, a?.move, MOTION_TEXT_STAY),
            pos: num01(a?.pos, 0.5),
            lane: pickEnum(LANES as any, a?.lane, MOTION_TEXT_FRONT),
            facing: a?.facing === MOTION_TEXT_LEFT || a?.facing === MOTION_TEXT_RIGHT ? a.facing : undefined,
            hold: hold || undefined,
            holdFrom: hold && _.isFinite(_.toNumber(a?.holdFrom)) && a?.holdFrom !== null ? _.clamp(_.toNumber(a.holdFrom), 0, 1) : undefined,
            holdUntil: hold && _.isFinite(_.toNumber(a?.holdUntil)) && a?.holdUntil !== null ? _.clamp(_.toNumber(a.holdUntil), 0, 1) : undefined,
          };
        }),
      ),
      6,
    ) as MotionBeat["actors"];
    out.props = _.take(
      _.compact(
        _.map(_.castArray(b?.props || []), (p: any) => {
          const asset = matchLibraryId(assetIds, p?.asset || p?.id || p?.name);
          if (!asset) return null;
          return {
            asset,
            move: pickEnum([MOTION_TEXT_STAY, MOTION_TEXT_LEFT_TO_RIGHT, MOTION_TEXT_RIGHT_TO_LEFT] as any, p?.move, MOTION_TEXT_STAY),
            pos: num01(p?.pos, 0.5),
            lane: pickEnum(LANES as any, p?.lane, MOTION_TEXT_MID),
            scale: _.isFinite(_.toNumber(p?.scale)) && p?.scale ? _.clamp(_.toNumber(p.scale), 0.1, 4) : undefined,
            params: plainParams(p?.params),
            anim: normalizeAnim(p?.anim),
            riders: _.compact(_.map(_.castArray(p?.riders || []), (r) => castByName(_.toString(r)))),
          };
        }),
      ),
      6,
    ) as MotionBeat["props"];
    const charIds = [..._.map(catalog.characters, MOTION_TEXT_ID), ..._.map(listMotionCharacters(), MOTION_TEXT_ID)];
    const crowds = _.take(
      _.compact(
        _.map(_.castArray(b?.crowds || []), (c: any) => {
          const cast = c?.cast ? castByName(_.toString(c.cast)) : undefined;
          const character = cast ? undefined : matchLibraryId(charIds, c?.character || c?.who || c?.type);
          if (!cast && !character) return null;
          return {
            cast,
            character,
            count: _.clamp(Math.round(_.toNumber(c?.count) || 60), 4, 4000),
            formation: pickEnum(FORMATIONS as any, c?.formation, MOTION_TEXT_BLOCK),
            action: matchLibraryId(actionIds, c?.action) || undefined,
            move: pickEnum(CROWD_MOVES as any, c?.move, MOTION_TEXT_STAY),
            pos: num01(c?.pos, 0.5),
            lane: pickEnum([MOTION_TEXT_BACK, MOTION_TEXT_MID, MOTION_TEXT_FRONT] as any, c?.lane, MOTION_TEXT_BACK),
            facing: c?.facing === MOTION_TEXT_LEFT || c?.facing === MOTION_TEXT_RIGHT ? c.facing : undefined,
            banners: c?.banners === false ? false : undefined,
            bannerColor: /^#[0-9a-f]{6}$/i.test(_.toString(c?.bannerColor)) ? c.bannerColor : undefined,
          };
        }),
      ),
      4,
    ) as MotionBeat["crowds"];
    if (crowds?.length) out.crowds = crowds;
    if (b?.label) out.label = _.truncate(_.toString(b.label), { length: 48 });
    out.sceneParams = plainParams(b?.sceneParams);
    out.sceneAnim = normalizeAnim(b?.sceneAnim);
    const focus = b?.focus ? matchLibraryId(assetIds, b.focus) : undefined;
    if (focus) {
      out.focus = focus;
      if (!_.some(out.props, { asset: focus })) out.props = [...(out.props || []), { asset: focus, move: MOTION_TEXT_STAY, pos: 0.5, lane: MOTION_TEXT_MID }];
    }
    reconcileSceneWithNarration({ id: "", chapterId: "", narration, ...out } as MotionBeat, analysis, actionIds);
  } else if (_.isPlainObject(b?.data)) {
    out.data = b.data;
  } else out.data = {};
  return out;
};
export const normalizeBeats = (rawBeats: any[], chapterId: string, analysis: MotionStoryAnalysis, catalog: MotionCatalog): MotionBeat[] => {
  return _.compact(
    _.map(rawBeats, (b: any, i: number): MotionBeat | null => {
      const narration = _.trim(_.toString(b?.narration || ""));
      if (!narration) return null;
      const id = MOTION_TEMPLATE_B(`${chapterId}`, `${i + 1}`);
      const rawShots = _.filter(_.castArray(b?.shots || []), (sh) => _.isPlainObject(sh));
      let beat: MotionBeat;
      if (rawShots.length) {
        const shots = _.map(_.take(rawShots, 4), (sh: any) => ({ text: _.truncate(_.trim(_.toString(sh?.text || "")) || narration, { length: 300 }), ...normalizeVisual(sh, analysis, catalog, _.toString(sh?.text || narration)) }));
        beat = { id, chapterId, narration: _.truncate(narration, { length: 600 }), ..._.omit(shots[0], [MOTION_TEXT_TEXT]), shots: shots.length > 1 ? shots : undefined };
        if (shots.length === 1) delete beat.shots;
      } else {
        beat = { id, chapterId, narration: _.truncate(narration, { length: 600 }), ...normalizeVisual(b, analysis, catalog, narration) };
      }
      if (b?.emphasis) beat.emphasis = true;
      return beat;
    }),
  );
};
