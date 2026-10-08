import { AsyncLocalStorage } from "async_hooks";
import { randomUUID } from "crypto";
import fs from "fs";
import _ from "lodash";
import path from "path";
import { CINEMATIC_CHAT_PLANNING_CONFIG } from "../../constants/index.js";
import { MOTION_GEN_ANALYSIS_PROMPT, MOTION_GEN_CHAPTER_PROMPT, MOTION_GEN_LOOKS, MOTION_GEN_PREAMBLE, MOTION_GEN_STORYBOARD_RULES } from "../../constants/motionGenPrompts.js";
import { MOTION_GENRE_TEXT, MOTION_GENRES } from "../../constants/motionGenres.js";
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
  MOTION_TEXT_DOCUMENTARY,
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
  MOTION_TEXT_NATURAL_ENGLISH_DOCUMENTARY_NARRATION_SHORT_CLEAR_SENTENCES_2,
  MOTION_TEXT_NATURAL_FLUENT_VIETNAMESE_IN_A_DOCUMENTARY_STORYTELLING_VOICE_2,
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
  MOTION_TEXT_THE_FIRST_BEAT_USES_VISUAL_TITLE_A_HOOK_2,
  MOTION_TEXT_THE_LAST_BEAT_USES_VISUAL_ENDING_WITH_A_2,
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
import { MOTION_STORY_CONFIG } from "../../constants/motionVideo.js";
import { parseJson, stringifyJson } from "../../lib/jsonStringify.js";
import { analysisPreamble, findGenre, genreOf, genrePreamble } from "../../lib/motionGenre.js";
import { getMotionErrorMessage, normalizeMotionText } from "../../lib/motionUtils.js";
import { AiPlanningChatModel, AiPlanningExecutionMode, AiPlanningFallbackProvider } from "../../types.js";
import { MotionStoryLength, type MotionAiExecution, type MotionBeat, type MotionCastMember, type MotionChapter, type MotionPlace, type MotionStoryAnalysis, type MotionStoryDna, type MotionStorySource } from "../../types/motionVideo.js";
import { beginChatPlanningRun, closeChatBrowserIfIdle, closeChatPlanningRoom, generatePlanningWithChatUi, prepareChatPlanningRoom } from "./chatUiPlanningService.js";
import { generateContentWithRetry } from "./geminiService.js";
import { cancelGlobalBrowserCleanup } from "./imageGeneratorService.js";
import { getMotionRootDirectory } from "./motionLibraryService.js";
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
export const TEXT_ONLY_PREAMBLE = MOTION_GEN_PREAMBLE;
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
const slugKey = (s: string): string =>
  _.trim(
    _.deburr(_.toString(s).replace(/đ/g, MOTION_TEXT_D).replace(/Đ/g, MOTION_TEXT_D_2))
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, MOTION_TEXT_SYMBOL_30),
    MOTION_TEXT_SYMBOL_30,
  ).slice(0, 24) || MOTION_TEXT_NV;
export const slugId = slugKey;
const TIMES = [MOTION_TEXT_DAY, MOTION_TEXT_DUSK, MOTION_TEXT_NIGHT, MOTION_TEXT_DAWN, MOTION_TEXT_OVERCAST, MOTION_TEXT_TOON_CAT_INTERIOR, MOTION_TEXT_INTERIOR_DARK];
const WEATHERS = [MOTION_TEXT_NONE, MOTION_TEXT_RAIN, MOTION_TEXT_SNOW, MOTION_TEXT_FOG];
const SHOTS = [MOTION_TEXT_WIDE, MOTION_TEXT_MEDIUM, MOTION_TEXT_CLOSE, MOTION_TEXT_OVER_SHOULDER, MOTION_TEXT_LOW, MOTION_TEXT_HIGH, MOTION_TEXT_AERIAL, MOTION_TEXT_INSERT];
const VISUALS = [MOTION_TEXT_SCENE, MOTION_TEXT_TITLE, MOTION_TEXT_CHAPTER, MOTION_TEXT_QUOTE, MOTION_TEXT_STATS, MOTION_TEXT_COUNTER, MOTION_TEXT_MAP, MOTION_TEXT_TIMELINE, MOTION_TEXT_HEADLINE, MOTION_TEXT_ENDING];
export const analyzeStory = async (source: MotionStorySource, opts: { language: string; length: MotionStoryLength; exec: MotionAiExecution; signal?: AbortSignal; log?: (s: string) => void }): Promise<MotionStoryAnalysis> => {
  const target = resolveTargetSeconds(source, opts.length);
  const chapterCount = _.clamp(Math.round(target / 150), 1, 10);
  const language = opts.language === MOTION_TEXT_EN ? MOTION_TEXT_ENGLISH : MOTION_TEXT_VIETNAMESE;
  const prompt = MOTION_GEN_ANALYSIS_PROMPT({ preamble: analysisPreamble(), title: source.title, seconds: Math.round(target), language, chapters: chapterCount, transcript: sourceSlice(source), genres: MOTION_GENRE_TEXT.ANALYSIS_LIST(), genreIds: _.map(MOTION_GENRES, MOTION_STORY_CONFIG.GENRE_ID_KEY).join(MOTION_STORY_CONFIG.GENRE_ID_JOIN) });
  const raw = await runMotionAi(prompt, MOTION_STORY_CONFIG.ARTIFACT_ANALYSIS, opts.exec, opts.signal, opts.log);
  return normalizeAnalysis(raw, source, target);
};
const dnaList = (v: unknown): string[] => _.take(_.compact(_.map(_.castArray(v || []), (s) => normalizeMotionText(s, 90))), 4);
const normalizeDna = (raw: any): MotionStoryDna | undefined => {
  if (!raw || !_.isPlainObject(raw)) return undefined;
  const dna: MotionStoryDna = { tone: normalizeMotionText(raw.tone || "", 120) || undefined, motifs: dnaList(raw.motifs), avoid: dnaList(raw.avoid), keep: normalizeMotionText(raw.keep || "", 200) || undefined };
  return dna.tone || dna.keep || dna.motifs?.length || dna.avoid?.length ? dna : undefined;
};
export const normalizeAnalysis = (raw: any, source: MotionStorySource, target: number): MotionStoryAnalysis => {
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
  const used = new Set<string>();
  const cast: MotionCastMember[] = _.compact(
    _.map(_.castArray(raw?.cast || []), (m: any) => {
      if (!m?.name) return null;
      let key = slugKey(m.key || m.name);
      while (used.has(key)) key = MOTION_TEMPLATE_2_2(`${key}`);
      used.add(key);
      const gender = /^f|woman|female|girl/i.test(_.toString(m.gender || m.suggested?.gender || "")) ? MOTION_TEXT_FEMALE : MOTION_TEXT_MALE;
      return { key, name: _.truncate(_.toString(m.name), { length: 60 }), role: _.truncate(_.toString(m.role || ""), { length: 60 }), description: _.truncate(_.toString(m.description || ""), { length: 200 }), look: _.truncate(_.toString(m.look || m.appearance || ""), { length: 240 }), gender } as MotionCastMember;
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
        return { key, name: _.truncate(_.toString(obj.name || key), { length: 60 }), description: _.truncate(_.toString(obj.description || obj.name || key), { length: 500 }), interior: !!obj.interior, time: _.includes(TIMES, obj.time) ? obj.time : obj.interior ? MOTION_TEXT_TOON_CAT_INTERIOR : MOTION_TEXT_DAY } as MotionPlace;
      }),
    ),
    10,
  );
  if (_.isEmpty(places)) places.push({ key: MOTION_TEXT_MAIN_PLACE, name: source.title, description: _.truncate(_.toString(raw?.logline || source.title), { length: 300 }), interior: false, time: MOTION_TEXT_DAY });
  const genre = findGenre(_.toString(raw?.genre)) ? _.toString(raw?.genre) : undefined;
  const genre2 = findGenre(_.toString(raw?.genre2)) && raw?.genre2 !== genre ? _.toString(raw?.genre2) : undefined;
  return {
    title: _.truncate(_.toString(raw?.title || source.title), { length: 120 }),
    logline: _.truncate(_.toString(raw?.logline || ""), { length: 300 }),
    genre,
    genre2,
    factual: _.isBoolean(raw?.factual) ? raw.factual : genre ? genreOf({ genre }).factual : undefined,
    genreReason: _.truncate(_.toString(raw?.genreReason || ""), { length: 200 }) || undefined,
    dna: normalizeDna(raw?.dna),
    look: pickEnum(MOTION_GEN_LOOKS, raw?.look, genre ? genreOf({ genre }).look : MOTION_TEXT_DOCUMENTARY),
    accent: /^#[0-9a-f]{6}$/i.test(_.toString(raw?.accent)) ? raw.accent : MOTION_TEXT_FFB070,
    era: _.truncate(_.toString(raw?.era || ""), { length: 120 }),
    chapters,
    cast,
    places,
    facts: _.take(
      _.map(_.castArray(raw?.facts || []), (f: any) => ({ claim: _.toString(f?.claim), status: pickEnum([MOTION_TEXT_OK, MOTION_TEXT_UNCERTAIN, MOTION_TEXT_WRONG] as const as any, f?.status, MOTION_TEXT_UNCERTAIN), note: _.toString(f?.note || "") })),
      40,
    ),
  };
};
export const writeChapterBeats = async (source: MotionStorySource, analysis: MotionStoryAnalysis, chapter: MotionChapter, opts: { language: string; exec: MotionAiExecution; signal?: AbortSignal; log?: (s: string) => void; previous?: MotionBeat[]; previousSummary?: string; isFirst: boolean; isLast: boolean }): Promise<MotionBeat[]> => {
  const isVi = opts.language !== MOTION_TEXT_EN;
  const seconds = chapter.targetSeconds || 120;
  const units = Math.round(seconds * (isVi ? MOTION_STORY_CONFIG.VI_SYLLABLES_PER_SECOND : MOTION_STORY_CONFIG.EN_WORDS_PER_SECOND) * MOTION_STORY_CONFIG.LENGTH_SAFETY);
  const beatsWanted = Math.max(2, Math.round(seconds / MOTION_STORY_CONFIG.TARGET_BEAT_SECONDS));
  const language = isVi ? MOTION_TEXT_VIETNAMESE : MOTION_TEXT_ENGLISH;
  const unitName = isVi ? MOTION_TEXT_VIETNAMESE_SYLLABLES_WORDS : MOTION_TEXT_WORDS;
  const prev = opts.previous?.length ? _.map(_.takeRight(opts.previous, 2), (b) => MOTION_TEMPLATE_SYMBOL_53(`${b.narration}`)).join(MOTION_TEXT_SYMBOL_27) : opts.previousSummary ? MOTION_TEMPLATE_SYMBOL_53(`${opts.previousSummary}`) : "";
  const genre = findGenre(analysis.genre);
  const chapterNo = Math.max(0, _.findIndex(analysis.chapters, { id: chapter.id })) + 1;
  const prompt = MOTION_GEN_CHAPTER_PROMPT({
    preamble: genrePreamble(analysis, MOTION_STORY_CONFIG.GENRE_PART_STORY),
    role: genre ? MOTION_GENRE_TEXT.ROLE(genre) : MOTION_STORY_CONFIG.DEFAULT_WRITER_ROLE,
    genre: genre ? MOTION_GENRE_TEXT.ARC(genre, chapterNo, analysis.chapters.length) : "",
    title: analysis.title,
    logline: analysis.logline,
    chapterId: chapter.id,
    chapterTitle: chapter.title,
    chapterSummary: chapter.summary,
    languageNote: genre ? MOTION_GENRE_TEXT.VOICE(genre, language) : isVi ? MOTION_TEXT_NATURAL_FLUENT_VIETNAMESE_IN_A_DOCUMENTARY_STORYTELLING_VOICE_2 : MOTION_TEXT_NATURAL_ENGLISH_DOCUMENTARY_NARRATION_SHORT_CLEAR_SENTENCES_2,
    language,
    units,
    unitName,
    seconds,
    beats: beatsWanted,
    perBeat: Math.max(8, Math.round(units / beatsWanted)),
    firstNote: opts.isFirst ? MOTION_TEXT_THE_FIRST_BEAT_USES_VISUAL_TITLE_A_HOOK_2 : "",
    lastNote: opts.isLast ? MOTION_TEXT_THE_LAST_BEAT_USES_VISUAL_ENDING_WITH_A_2 : "",
    previous: prev ? MOTION_TEMPLATE_CONTINUE_NATURALLY_FROM_THE_PREVIOUS_CHAPTER_WHICH_ENDED_2(`${prev}`) : "",
    rules: MOTION_GEN_STORYBOARD_RULES(language),
    cast: _.map(analysis.cast, (c) => MOTION_TEMPLATE_SYMBOL_54(`${c.key}`, `${c.name}`, `${c.role || ""}`, `${c.look || c.description || ""}`)).join(MOTION_TEXT_SYMBOL_27) || MOTION_TEXT_NONE_2,
    places: _.map(analysis.places, (p) => MOTION_TEMPLATE_SYMBOL_55(`${p.key}`, `${p.name}`, `${p.description}`)).join(MOTION_TEXT_SYMBOL_27),
    transcript: sourceSlice(source, chapter.from, chapter.to),
  });
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const retryNote = attempt ? MOTION_TEMPLATE_YOUR_PREVIOUS_ANSWER_FAILED_RETURN_ONLY_THE_JSON(`${getMotionErrorMessage(lastError, 300)}`) : "";
      const raw = await runMotionAi(`${prompt}${retryNote}`, MOTION_STORY_CONFIG.ARTIFACT_CHAPTER, opts.exec, opts.signal, opts.log);
      const beats = normalizeBeats(_.castArray(raw?.beats || []), chapter.id, analysis);
      if (beats.length < 1) throw new Error(MOTION_TEXT_CHUONG_KHONG_CO_BEAT_NAO_2);
      return beats;
    } catch (error) {
      if (opts.signal?.aborted) throw error;
      lastError = error;
      opts.log?.(MOTION_TEMPLATE_CHUONG_LOI_THU_LAI(`${chapter.id}`, `${getMotionErrorMessage(error, 120)}`));
    }
  }
  throw lastError;
};
export const normalizeBeats = (rawBeats: any[], chapterId: string, analysis: MotionStoryAnalysis): MotionBeat[] => {
  const castKeys = _.map(analysis.cast, MOTION_TEXT_KEY);
  const placeKeys = _.map(analysis.places, MOTION_TEXT_KEY);
  const castOf = (k: string) => (_.includes(castKeys, k) ? k : _.find(analysis.cast, (c) => slugKey(c.name) === slugKey(k) || _.includes(slugKey(c.name), slugKey(k)) || slugKey(k).includes(c.key))?.key);
  const placeOf = (k: string) => (_.includes(placeKeys, k) ? k : _.find(analysis.places, (p) => slugKey(p.name) === slugKey(k) || slugKey(k).includes(p.key) || p.key.includes(slugKey(k)))?.key);
  const out: MotionBeat[] = [];
  _.forEach(rawBeats, (b: any) => {
    const narration = _.trim(_.toString(b?.narration || ""));
    if (!narration) return;
    const id = MOTION_TEMPLATE_B(`${chapterId}`, `${out.length + 1}`);
    const shots = _.filter(_.castArray(b?.shots || []), (sh) => _.isPlainObject(sh));
    const v = shots.length ? { ...shots[0], ...b, visual: b.visual || shots[0].visual } : b;
    const visual = pickEnum(VISUALS, v?.visual, MOTION_TEXT_SCENE);
    const beat: MotionBeat = { id, chapterId, narration: _.truncate(narration, { length: 600 }), visual };
    if (visual === MOTION_TEXT_SCENE) {
      beat.place = placeOf(_.toString(v?.place || v?.env || "")) || _.first(placeKeys);
      const place = _.find(analysis.places, { key: beat.place });
      beat.time = pickEnum(TIMES, v?.time, (place?.time as string) || MOTION_TEXT_DAY);
      beat.weather = pickEnum(WEATHERS, v?.weather, MOTION_TEXT_NONE);
      beat.shot = pickEnum(SHOTS, v?.shot, MOTION_TEXT_MEDIUM);
      const castList = _.uniq(_.compact(_.map(_.castArray(v?.cast || v?.actors || []), (a: any) => castOf(_.toString(_.isPlainObject(a) ? a.cast || a.who : a)))));
      beat.cast = _.take(castList, 6);
      beat.action = _.truncate(_.toString(v?.action || v?.description || _.map(shots, MOTION_TEXT_ACTION).join(MOTION_TEXT_SYMBOL_13) || ""), { length: 400 });
      if (v?.label) beat.label = _.truncate(_.toString(v.label), { length: 48 });
    } else beat.data = _.isPlainObject(v?.data) ? v.data : {};
    if (b?.emphasis) beat.emphasis = true;
    out.push(beat);
  });
  return out;
};
