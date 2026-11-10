import { fetchLinkSource } from "../../../motion/server/services/motionSourceFetchService.js";
import { MUSIC_REFERENCE_SOURCE as S } from "../../../../constants/musicPlanning.js";
const cache = new Map<string, string>();
const clip = (text: string, max: number): string => (text.length > max ? text.slice(0, max) : text);
export const resolveMusicReferenceSource = async (input: string, signal?: AbortSignal): Promise<string> => {
  const raw = String(input || "").replace(/\r\n?/g, S.JOIN).trim();
  if (!raw) return raw;
  const hit = cache.get(raw);
  if (hit) return hit;
  const urls = [...new Set(raw.match(S.URL_RE) || [])].slice(0, S.MAX_LINKS);
  if (!urls.length) return raw;
  const notes = raw.replace(S.URL_RE, "").replace(/\n{3,}/g, S.BLOCK_JOIN).trim();
  const fetched = await Promise.all(urls.map((url) => fetchLinkSource(url, signal).catch(() => undefined)));
  const blocks = urls.map((url, index) => {
    const item = fetched[index];
    const lines = [S.SOURCE(index + 1, urls.length), `${S.URL} ${url}`];
    if (!item || !item.raw) return [...lines, S.UNREADABLE].join(S.JOIN);
    lines.push(`${S.TITLE} ${item.title}`);
    if (item.meta?.author) lines.push(`${S.CHANNEL} ${item.meta.author}`);
    if (item.meta?.keywords?.length) lines.push(`${S.TAGS} ${item.meta.keywords.join(", ")}`);
    if (item.meta) {
      if (item.meta.description) lines.push(`${S.DESCRIPTION} ${clip(item.meta.description, S.MAX_DESCRIPTION_CHARS)}`);
      const at = item.raw.search(/^Transcript:\s*$/m);
      if (at >= 0) lines.push(`${S.LYRICS}${S.JOIN}${clip(item.raw.slice(at).split(S.JOIN).slice(1).join(S.JOIN).replace(S.TIMESTAMP_RE, ""), S.MAX_LYRICS_CHARS)}`);
    } else lines.push(`${S.PAGE_TEXT} ${clip(item.raw, S.MAX_LYRICS_CHARS)}`);
    return lines.join(S.JOIN);
  });
  const text = clip([notes ? `${S.USER_NOTES}${S.JOIN}${notes}` : "", ...blocks].filter(Boolean).join(S.BLOCK_JOIN), S.MAX_TOTAL_CHARS);
  cache.set(raw, text);
  return text;
};
