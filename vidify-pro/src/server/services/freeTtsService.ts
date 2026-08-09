import _ from "lodash";
import { EXTERNAL_URLS } from "../../constants/apiRoutes.js";
import { FREE_TTS_CONFIG } from "../../constants/config.js";
import { MimeType } from "../../constants/enums.js";
import { REFACTOR_CONSTANTS } from "../../constants/refactor.js";

const freeTtsEndpoints = [EXTERNAL_URLS.GOOGLE_TRANSLATE_WEB_1, EXTERNAL_URLS.GOOGLE_TRANSLATE_WEB_2, EXTERNAL_URLS.GOOGLE_TRANSLATE_API];
const splitText = (text: string): string[] => _.reduce(_.words(text, FREE_TTS_CONFIG.WORD_REGEX), (chunks: string[], word: string) => {
  const currentIndex = chunks.length - 1;const candidate = _.trim(_.join([chunks[currentIndex] || "", word], " "));
  if (currentIndex < 0 || candidate.length > FREE_TTS_CONFIG.MAX_CHUNK_CHARACTERS) chunks.push(word);else chunks[currentIndex] = candidate;
  return chunks;
}, []);
const resolveLanguage = (voiceId: string): string => _.some(FREE_TTS_CONFIG.ENGLISH_VOICE_MARKERS, marker => _.includes(_.toLower(voiceId), marker)) ? "en" : FREE_TTS_CONFIG.DEFAULT_LANGUAGE;
const createTtsUrl = (endpoint: string, text: string, language: string): URL => {
  const url = new URL(endpoint);url.searchParams.set("ie", FREE_TTS_CONFIG.INPUT_ENCODING);url.searchParams.set("tl", language);url.searchParams.set("client", FREE_TTS_CONFIG.CLIENT);url.searchParams.set("q", text);return url;
};
const fetchChunk = async (text: string, language: string): Promise<Buffer> => {
  let lastError: unknown;
  for (const endpoint of freeTtsEndpoints) {
    try {
      const response = await fetch(createTtsUrl(endpoint, text, language), { headers: { [FREE_TTS_CONFIG.USER_AGENT_HEADER]: FREE_TTS_CONFIG.USER_AGENT } });
      if (!response.ok) throw new Error(_.toString(response.status));return Buffer.from(await response.arrayBuffer());
    } catch (error) { lastError = error; }
  }
  throw lastError || new Error(FREE_TTS_CONFIG.UNAVAILABLE_ERROR);
};

export const synthesizeFreeTts = async (text: string, voiceId: string): Promise<Buffer> => {
  const buffers: Buffer[] = [];const language = resolveLanguage(voiceId);
  for (const group of _.chunk(splitText(text), FREE_TTS_CONFIG.CONCURRENCY)) buffers.push(...await Promise.all(_.map(group, chunk => fetchChunk(chunk, language))));
  return Buffer.concat(buffers);
};
export const createFreeTtsResponse = async (text: string, voiceId: string) => { const buffer = await synthesizeFreeTts(text, voiceId);return { success: true, audioBase64: buffer.toString(REFACTOR_CONSTANTS.ENCODING_BASE64 as BufferEncoding), mimeType: MimeType.MPEG, audioUrl: REFACTOR_CONSTANTS.VD_EMPTY_STRING, provider: FREE_TTS_CONFIG.PROVIDER }; };
