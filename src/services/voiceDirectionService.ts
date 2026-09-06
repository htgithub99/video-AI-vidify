import _ from "lodash";
import { API_ROUTES, AUTO_GENERATOR_CONSTANTS, SecurityConstants, VOICE_DIRECTION_CONFIG } from "../constants";
import { delayAsync, safeSystemFetch } from "../lib/shared-utils";
import { VoiceArc, VoiceDirection } from "../types";

export interface DirectedVoiceOptions {
  text: string;
  voiceArc: VoiceArc;
  basePayload: Record<string, unknown>;
  signal?: AbortSignal;
}

const VOICE_ARC_ORDER: Array<keyof VoiceArc> = ["setup", "descent", "isolation", "climax", "reckoning", "resolution"];

const splitNarrationForVoiceArc = (text: string): string[] => {
  const paragraphs = _.filter(_.map(_.split(text, /\n{2,}/), _.trim), Boolean);
  if (_.gte(_.size(paragraphs), VOICE_DIRECTION_CONFIG.SEGMENT_COUNT)) {
    const chunks = _.chunk(paragraphs, _.ceil(_.divide(_.size(paragraphs), VOICE_DIRECTION_CONFIG.SEGMENT_COUNT)) || 1);
    return _.take(
      _.map(chunks, (chunk) => _.join(chunk, "\n\n")),
      VOICE_DIRECTION_CONFIG.SEGMENT_COUNT,
    );
  }
  const sentences = _.filter(_.map(_.split(text, /(?<=[.!?])\s+/), _.trim), Boolean);
  const chunks = _.chunk(sentences, _.ceil(_.divide(_.size(sentences), VOICE_DIRECTION_CONFIG.SEGMENT_COUNT)) || 1);
  return _.take(
    _.map(chunks, (chunk) => _.join(chunk, " ")),
    VOICE_DIRECTION_CONFIG.SEGMENT_COUNT,
  );
};

const createDirectedPayload = (text: string, direction: VoiceDirection, basePayload: Record<string, unknown>): Record<string, unknown> => ({
  ...basePayload,
  text,
  emotion: direction.emotion || VOICE_DIRECTION_CONFIG.DEFAULT_EMOTION,
  speed: _.clamp(_.multiply(_.toNumber(_.get(basePayload, "speed", 1)), direction.speed), VOICE_DIRECTION_CONFIG.MIN_SPEED, VOICE_DIRECTION_CONFIG.MAX_SPEED),
  pauseScale: direction.pauseScale,
});

const requestVoiceChunk = async (
  text: string,
  direction: VoiceDirection,
  basePayload: Record<string, unknown>,
  signal?: AbortSignal,
): Promise<{ audioBase64: string; provider: string }> => {
  let lastError: string = AUTO_GENERATOR_CONSTANTS.ERR_VOICE_TTS_FAILED;
  for (let attempt = 0; attempt < VOICE_DIRECTION_CONFIG.MAX_REQUEST_ATTEMPTS; attempt++) {
    const response = await safeSystemFetch(API_ROUTES.PIPELINE_VOICE, createDirectedPayload(text, direction, basePayload), signal);
    const audioBase64 = _.toString(_.get(response.data, "audioBase64"));
    if (response.success && !_.isEmpty(audioBase64)) {
      return { audioBase64, provider: _.toString(_.get(response.data, "provider", _.get(basePayload, "provider"))) };
    }
    lastError = _.toString(response.error || _.get(response.data, "error") || lastError);
    if (_.lt(_.add(attempt, SecurityConstants.DEFAULT_AMOUNT), VOICE_DIRECTION_CONFIG.MAX_REQUEST_ATTEMPTS)) {
      await delayAsync(VOICE_DIRECTION_CONFIG.RETRY_DELAY_MS * _.add(attempt, SecurityConstants.DEFAULT_AMOUNT));
    }
  }
  throw new Error(lastError);
};

const mergeVoiceChunks = async (chunks: Array<{ audioBase64: string }>, signal?: AbortSignal): Promise<string> => {
  for (let attempt = 0; attempt < VOICE_DIRECTION_CONFIG.MAX_REQUEST_ATTEMPTS; attempt++) {
    const response = await safeSystemFetch(API_ROUTES.PIPELINE_MERGE_AUDIO, { chunks }, signal);
    const audioBase64 = _.toString(_.get(response.data, "audioBase64"));
    if (response.success && !_.isEmpty(audioBase64)) return audioBase64;
    if (_.lt(_.add(attempt, SecurityConstants.DEFAULT_AMOUNT), VOICE_DIRECTION_CONFIG.MAX_REQUEST_ATTEMPTS)) {
      await delayAsync(VOICE_DIRECTION_CONFIG.RETRY_DELAY_MS * _.add(attempt, SecurityConstants.DEFAULT_AMOUNT));
    }
  }
  throw new Error(VOICE_DIRECTION_CONFIG.MERGE_FAILED);
};

export const generateDirectedVoice = async ({ text, voiceArc, basePayload, signal }: DirectedVoiceOptions): Promise<{ audioBase64: string; provider: string }> => {
  const narrationSegments = splitNarrationForVoiceArc(text);
  const chunks: Array<{ audioBase64: string }> = [];
  let provider = _.toString(_.get(basePayload, "provider"));
  for (let index = 0; index < narrationSegments.length; index++) {
    const directionKey = _.get(VOICE_ARC_ORDER, index, _.last(VOICE_ARC_ORDER));
    const direction = voiceArc[directionKey];
    const chunk = await requestVoiceChunk(narrationSegments[index], direction, basePayload, signal);
    chunks.push({ audioBase64: chunk.audioBase64 });
    provider = chunk.provider || provider;
  }
  if (_.isEqual(_.size(chunks), 1)) return { audioBase64: chunks[0].audioBase64, provider };
  const audioBase64 = await mergeVoiceChunks(chunks, signal);
  return { audioBase64, provider };
};
