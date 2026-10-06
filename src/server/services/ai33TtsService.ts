import { stringifyJson } from "../../lib/jsonStringify.js";
import _ from "lodash";
import { CONTENT_TYPE_HEADER, CONTENT_TYPES, EXTERNAL_URLS, HTTP_HEADERS, HTTP_METHODS, REFACTOR_CONSTANTS, TTS_POLLING_CONFIG } from "../../constants";
import {
  MOTION_TEMPLATE_AI33_POLL_FAILED,
  MOTION_TEMPLATE_AI33_TASK_ERROR,
  MOTION_TEMPLATE_AI33_TTS_DID_NOT_RETURN_A_TASK_ID,
  MOTION_TEMPLATE_AI33_TTS_ERROR,
  MOTION_TEMPLATE_SYMBOL_4,
  MOTION_TEXT_ABORT,
  MOTION_TEXT_AI33_POLL_FETCH_FAILED_RETRYING,
  MOTION_TEXT_AI33_TTS_ABORTED,
  MOTION_TEXT_AI33_TTS_TASK_TIMED_OUT,
  MOTION_TEXT_AUDIO_MPEG,
  MOTION_TEXT_FAILED_TO_DOWNLOAD_AI33_AUDIO,
  MOTION_TEXT_MESSAGE,
  MOTION_TEXT_TRUE,
  MOTION_TEXT_TTS_TEXT_IS_EMPTY,
} from "../../constants/motionRuntime.js";
import { SecurityConstants, SecurityMessages } from "../../constants/security.js";
import { appWarn, createAppError } from "../../lib/logger.js";
import { resolveVoiceRouting } from "../../lib/voiceRouting.js";
import { resolveApiKeys } from "./apiKeyResolver.js";
const HTTP_UNAUTHORIZED = 401;
const HTTP_FORBIDDEN = 403;
const ABORTED = MOTION_TEXT_AI33_TTS_ABORTED;
export interface Ai33TtsRequest {
  text: string;
  voiceId: string;
  speed?: number;
  provider?: string;
  withTranscript?: boolean;
  signal?: AbortSignal;
}
export interface Ai33TtsResult {
  buffer: Buffer;
  mimeType: string;
  metadata?: Record<string, unknown>;
}
const sleep = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    if (signal?.aborted) return reject(new Error(ABORTED));
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      MOTION_TEXT_ABORT,
      () => {
        clearTimeout(timer);
        reject(new Error(ABORTED));
      },
      { once: true },
    );
  });
export const isAi33Abort = (error: unknown): boolean => _.get(error, MOTION_TEXT_MESSAGE) === ABORTED;
export const getAi33ApiKey = async (): Promise<string> => {
  const keys = await resolveApiKeys();
  const apiKey = _.toString(_.get(keys, SecurityConstants.REQ_BODY_AI33_KEY, SecurityConstants.EMPTY_STRING));
  if (_.isEmpty(apiKey)) throw createAppError(SecurityMessages.MISSING_AI33_KEY);
  return apiKey;
};
export const synthesizeAi33Speech = async (request: Ai33TtsRequest): Promise<Ai33TtsResult> => {
  const text = _.trim(request.text);
  if (_.isEmpty(text)) throw new Error(MOTION_TEXT_TTS_TEXT_IS_EMPTY);
  const { finalVoiceId } = resolveVoiceRouting({ provider: request.provider, voiceId: request.voiceId || REFACTOR_CONSTANTS.VD_EMPTY_STRING });
  const apiKey = await getAi33ApiKey();
  const formData = new FormData();
  formData.append(REFACTOR_CONSTANTS.FORM_KEY_TEXT, text);
  formData.append(REFACTOR_CONSTANTS.FORM_KEY_VOICE_ID, finalVoiceId);
  formData.append(REFACTOR_CONSTANTS.FORM_KEY_SPEED, String(request.speed || 1));
  formData.append(REFACTOR_CONSTANTS.FORM_KEY_WITH_TRANSCRIPT, request.withTranscript ? MOTION_TEXT_TRUE : REFACTOR_CONSTANTS.VALUE_FALSE);
  const ttsRes = await fetch(EXTERNAL_URLS.AI33_TTS, { method: HTTP_METHODS.POST, headers: { [HTTP_HEADERS.XI_API_KEY]: apiKey }, body: formData, signal: request.signal });
  if (!ttsRes.ok) throw new Error(MOTION_TEMPLATE_AI33_TTS_ERROR(`${_.truncate(await ttsRes.text(), { length: 300 })}`));
  const ttsData = await ttsRes.json();
  if (!ttsData?.success || !ttsData?.task_id) throw new Error(MOTION_TEMPLATE_AI33_TTS_DID_NOT_RETURN_A_TASK_ID(`${_.truncate(stringifyJson(ttsData), { length: 300 })}`));
  const taskId = ttsData.task_id;
  let audioUrl: string | null = null;
  let metadata: Record<string, unknown> | undefined;
  for (let attempt = 0; attempt < TTS_POLLING_CONFIG.MAX_ATTEMPTS; attempt++) {
    if (attempt > 0) await sleep(attempt < 4 ? 1500 : TTS_POLLING_CONFIG.INTERVAL_MS, request.signal);
    let pollRes: Response;
    try {
      pollRes = await fetch(MOTION_TEMPLATE_SYMBOL_4(`${EXTERNAL_URLS.AI33_TASK}`, `${taskId}`), { headers: { [CONTENT_TYPE_HEADER]: CONTENT_TYPES.JSON, [HTTP_HEADERS.XI_API_KEY]: apiKey }, signal: request.signal });
    } catch (error: any) {
      if (request.signal?.aborted) throw new Error(ABORTED);
      appWarn(MOTION_TEXT_AI33_POLL_FETCH_FAILED_RETRYING, error?.message);
      continue;
    }
    if (!pollRes.ok) {
      const errText = await pollRes.text();
      if (_.includes([HTTP_UNAUTHORIZED, HTTP_FORBIDDEN], pollRes.status)) throw new Error(MOTION_TEMPLATE_AI33_POLL_FAILED(`${errText}`));
      continue;
    }
    const pollData = await pollRes.json();
    if (_.isEqual(pollData.status, TTS_POLLING_CONFIG.STATUS_DONE)) {
      audioUrl = pollData.metadata?.audio_url || null;
      metadata = pollData.metadata;
      break;
    }
    if (_.isEqual(pollData.status, TTS_POLLING_CONFIG.STATUS_ERROR)) throw new Error(MOTION_TEMPLATE_AI33_TASK_ERROR(`${pollData.error_message || ""}`));
  }
  if (!audioUrl) throw new Error(MOTION_TEXT_AI33_TTS_TASK_TIMED_OUT);
  const audioRes = await fetch(audioUrl, { signal: request.signal });
  if (!audioRes.ok) throw new Error(MOTION_TEXT_FAILED_TO_DOWNLOAD_AI33_AUDIO);
  const buffer = Buffer.from(await audioRes.arrayBuffer());
  const mimeType = audioRes.headers.get(SecurityConstants.HEADER_CONTENT_TYPE) || MOTION_TEXT_AUDIO_MPEG;
  return { buffer, mimeType, metadata };
};
