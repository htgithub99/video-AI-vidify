import * as MR from "../../constants/motionRuntime.js";
import type { MotionStorySource } from "../../types/motionVideo.js";
const UA = MR.MOTION_TEXT_MOZILLA_5_0_WINDOWS_NT_10_0_WIN64_X64_APPLEWEBKIT_537_36_KHTML_LI;
const TIMEOUT_MS = 20000;
const CACHE_TTL_MS = 60 * 60 * 1000;
const MAX_TEXT = 400000;
const URL_RE = /https?:\/\/[^\s<>"')\]]+/gi;
export interface FetchedSource { ok: boolean; kind: "youtube" | "page"; url: string; title: string; raw: string; note: string; }
const cache = new Map< string, { at: number; value: FetchedSource; } >();
const get = async (url: string, signal?: AbortSignal, accept: string = MR.MOTION_TEXT_TEXT_HTML): Promise<string> => {
  const timer = AbortSignal.timeout(TIMEOUT_MS);
  const res = await fetch(url, { signal: signal ? AbortSignal.any([signal, timer]) : timer, headers: { "User-Agent": UA, "Accept-Language": MR.MOTION_TEXT_VI_EN_Q_0_8, Accept: accept, Cookie: MR.MOTION_TEXT_CONSENT_YES_1_SOCS_CAI }, redirect: MR.MOTION_TEXT_FOLLOW, });
  if (!res.ok) throw new Error(MR.MOTION_TEMPLATE_HTTP(res.status));
  return res.text();
};
const decode = (s: string): string =>
  s
    .replace(/&#(\d+);/g, (_m, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_m, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&quot;/g, MR.MOTION_TEXT_SYMBOL_47)
    .replace(/&apos;|&#39;/g, MR.MOTION_TEXT_SYMBOL_42)
    .replace(/&lt;/g, MR.MOTION_TEXT_SYMBOL_45)
    .replace(/&gt;/g, MR.MOTION_TEXT_SYMBOL_46)
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, MR.MOTION_TEXT_SYMBOL_48);
const stamp = (sec: number): string => { const s = Math.max(0, Math.floor(sec)), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60; const pad = (n: number) => String(n).padStart(2, MR.MOTION_TEXT_0); return h ? MR.MOTION_TEMPLATE_SYMBOL_273(pad(h), pad(m), pad(r)) : MR.MOTION_TEMPLATE_SYMBOL_274(pad(m), pad(r)); };
const embeddedJson = (html: string, name: string): any => {
  const at = html.indexOf(name);
  if (at < 0) return null;
  const start = html.indexOf(MR.MOTION_TEXT_SYMBOL_35, at);
  if (start < 0) return null;
  let depth = 0, inStr = false, esc = false;
  for (let i = start; i < html.length; i++) {
    const c = html[i];
    if (inStr) { if (esc) esc = false; else if (c === MR.MOTION_TEXT_SYMBOL_49) esc = true; else if (c === MR.MOTION_TEXT_SYMBOL_47) inStr = false; continue; }
    if (c === MR.MOTION_TEXT_SYMBOL_47) inStr = true; else if (c === MR.MOTION_TEXT_SYMBOL_35) depth++; else if (c === MR.MOTION_TEXT_SYMBOL_36 && --depth === 0) { try { return JSON.parse(html.slice(start, i + 1)); } catch { return null; } }
  }
  return null;
};
export const youtubeId = (url: string): string | null => { const m = url.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|live\/|embed\/)|youtu\.be\/)([\w-]{11})/i); return m ? m[1] : null; };
const MOBILE_CLIENTS = [
  { context: { clientName: MR.MOTION_TEXT_IOS, clientVersion: MR.MOTION_TEXT_20_10_4, deviceModel: MR.MOTION_TEXT_IPHONE16_2 }, ua: MR.MOTION_TEXT_COM_GOOGLE_IOS_YOUTUBE_20_10_4_IPHONE16_2_U_CPU_IOS_18_3_LIKE_MAC, id: MR.MOTION_TEXT_5 },
  { context: { clientName: MR.MOTION_TEXT_ANDROID, clientVersion: MR.MOTION_TEXT_20_10_38, androidSdkVersion: 30 }, ua: MR.MOTION_TEXT_COM_GOOGLE_ANDROID_YOUTUBE_20_10_38_LINUX_U_ANDROID_11_GZIP, id: MR.MOTION_TEXT_3 },
];
const mobileCaptionTracks = async (id: string, signal?: AbortSignal): Promise<any[]> => {
  for (const client of MOBILE_CLIENTS) {
    try {
      const timer = AbortSignal.timeout(TIMEOUT_MS);
      const res = await fetch(MR.MOTION_TEXT_HTTPS_WWW_YOUTUBE_COM_YOUTUBEI_V1_PLAYER_PRETTYPRINT_FALSE, {
        method: MR.MOTION_TEXT_POST,
        signal: signal ? AbortSignal.any([signal, timer]) : timer,
        headers: { "Content-Type": MR.MOTION_TEXT_APPLICATION_JSON, "User-Agent": client.ua, "X-Youtube-Client-Name": client.id, "X-Youtube-Client-Version": client.context.clientVersion },
        body: JSON.stringify({ context: { client: { ...client.context, hl: MR.MOTION_TEXT_EN } }, videoId: id }),
      });
      if (!res.ok) continue;
      const tracks = (await res.json())?.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];
      if (tracks.length) return tracks;
    } catch (e) {
      if (signal?.aborted) throw e;
    }
  }
  return [];
};
const captionEvents = (body: string): [number, string][] => {
  const trimmed = body.trim();
  if (!trimmed) return [];
  if (trimmed.startsWith(MR.MOTION_TEXT_SYMBOL_35)) { return (JSON.parse(trimmed).events || []).map((ev: any) => [Number(ev?.tStartMs) || 0, (ev?.segs || []).map((s: any) => s?.utf8 || "").join("")] as [number, string]); }
  return [...trimmed.matchAll(/<(?:p|text)\b[^>]*\b(t|start)="([\d.]+)"[^>]*>([\s\S]*?)<\/(?:p|text)>/g)].map((m) => [m[1] === MR.MOTION_TEXT_START ? Number(m[2]) * 1000 : Number(m[2]), decode(m[3].replace(/<[^>]+>/g, ""))] as [number, string]);
};
const pickTrack = (tracks: any[], prefer: string[]): any => { const manual = tracks.filter((t) => t?.kind !== MR.MOTION_TEXT_ASR); for (const pool of [manual, tracks]) for (const lang of prefer) { const t = pool.find((x) => String(x?.languageCode || "").startsWith(lang)); if (t) return t; } return manual[0] || tracks[0]; };
const fetchYoutube = async (url: string, id: string, signal?: AbortSignal): Promise<FetchedSource> => {
  const watch = MR.MOTION_TEMPLATE_HTTPS_WWW_YOUTUBE_COM_WATCH_V_HL_VI(id);
  const html = await get(watch, signal);
  const player = embeddedJson(html, MR.MOTION_TEXT_YTINITIALPLAYERRESPONSE);
  const details = player?.videoDetails || {};
  const title = String(details.title || decode((html.match(/<title>([^<]*)<\/title>/i) || [])[1] || "").replace(/\s*-\s*YouTube\s*$/i, "") || MR.MOTION_TEXT_YOUTUBE_VIDEO).trim();
  const description = String(details.shortDescription || "").trim();
  let tracks: any[] = await mobileCaptionTracks(id, signal);
  if (!tracks.length) tracks = player?.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];
  let lines: string[] = [];
  let note = "";
  if (tracks.length) {
    const track = pickTrack(tracks, [String(details?.defaultAudioLanguage || ""), MR.MOTION_TEXT_VI, MR.MOTION_TEXT_EN].filter(Boolean));
    try {
      const events = captionEvents(await get(MR.MOTION_TEMPLATE_FMT_JSON3(track.baseUrl), signal, MR.MOTION_TEXT_APPLICATION_JSON));
      let segStart = -1, buf = "";
      const flush = () => { const t = buf.replace(/\s+/g, " ").trim(); if (t) lines.push(MR.MOTION_TEMPLATE_SYMBOL_275(stamp(segStart / 1000), t)); buf = ""; segStart = -1; };
      for (const [startMs, text] of events) {
        if (!text.trim()) continue;
        if (segStart < 0) segStart = startMs;
        buf += MR.MOTION_TEMPLATE_SYMBOL_276(text);
        if (startMs - segStart >= 15000 && /[.!?…]\s*$/.test(text.trim())) flush(); else if (startMs - segStart >= 25000) flush();
      }
      flush();
      if (!lines.length) note = MR.MOTION_TEXT_YOUTUBE_KHONG_TRA_PHU_DE_CHO_VIDEO_NAY; else note = MR.MOTION_TEMPLATE_DA_LAY_PHU_DE(track.kind === MR.MOTION_TEXT_ASR ? MR.MOTION_TEXT_TU_DONG : MR.MOTION_TEXT_GOC, track.languageCode);
    } catch (e) {
      if (signal?.aborted) throw e;
      note = MR.MOTION_TEMPLATE_KHONG_TAI_DUOC_PHU_DE((e as Error).message);
    }
  } else note = MR.MOTION_TEXT_VIDEO_KHONG_CO_PHU_DE;
  const raw = lines.length ? MR.MOTION_TEMPLATE_TRANSCRIPT(title, url, lines.join("\n")) : MR.MOTION_TEMPLATE_SYMBOL_277(title, url, description || title);
  return { ok: lines.length > 0 || description.length > 40, kind: MR.MOTION_TEXT_YOUTUBE, url, title, raw: raw.slice(0, MAX_TEXT), note: lines.length ? note : MR.MOTION_TEMPLATE_CHI_DUNG_TIEU_DE_MO_TA(note) };
};
const fetchPage = async (url: string, signal?: AbortSignal): Promise<FetchedSource> => {
  const html = await get(url, signal);
  const meta = (p: string) => decode((html.match(new RegExp(MR.MOTION_TEMPLATE_META_PROPERTY_NAME_CONTENT(p), MR.MOTION_TEXT_I_2)) || [])[1] || "");
  const title = (meta(MR.MOTION_TEXT_OG_TITLE) || decode((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || "")).replace(/\s+/g, " ").trim() || url;
  let body = html.replace(/<(script|style|noscript|svg|nav|header|footer|aside|form|iframe)[\s\S]*?<\/\1>/gi, " ");
  const article = body.match(/<article[\s\S]*?<\/article>/i)?.[0] || body.match(/<main[\s\S]*?<\/main>/i)?.[0] || body;
  const blocks = [...article.matchAll(/<(p|h[1-4]|li|blockquote)[^>]*>([\s\S]*?)<\/\1>/gi)] .map((m) => decode(m[2].replace(/<[^>]+>/g, " ")) .replace(/\s+/g, " ") .trim(), ) .filter((t) => t.length > 25);
  const text = blocks.join("\n").slice(0, MAX_TEXT);
  const desc = meta(MR.MOTION_TEXT_OG_DESCRIPTION) || meta(MR.MOTION_TEXT_DESCRIPTION);
  const words = text.split(/\s+/).filter(Boolean).length;
  return { ok: words >= 60, kind: MR.MOTION_TEXT_PAGE, url, title, raw: MR.MOTION_TEMPLATE_SYMBOL_278(title, url, text || desc), note: words >= 60 ? MR.MOTION_TEMPLATE_DA_DOC_TU_TU_TRANG(words) : MR.MOTION_TEXT_TRANG_KHONG_CO_DU_NOI_DUNG_DOC_DUOC_CO_THE_CAN_DANG_NHAP_HOAC_TAI };
};
export const fetchLinkSource = async (url: string, signal?: AbortSignal): Promise<FetchedSource> => {
  const hit = cache.get(url);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.value;
  const id = youtubeId(url);
  let value: FetchedSource;
  try {
    value = id ? await fetchYoutube(url, id, signal) : await fetchPage(url, signal);
  } catch (e) {
    if (signal?.aborted) throw e;
    value = { ok: false, kind: id ? MR.MOTION_TEXT_YOUTUBE : MR.MOTION_TEXT_PAGE, url, title: url, raw: "", note: MR.MOTION_TEMPLATE_KHONG_MO_DUOC_LINK((e as Error).message) };
  }
  if (value.ok) cache.set(url, { at: Date.now(), value });
  return value;
};
export const resolveSourceInput = async (
  input: string,
  signal?: AbortSignal,
): Promise<{ text: string; notes: string; fetched?: FetchedSource; }> => {
  const raw = String(input || "").replace(/\r\n?/g, "\n");
  const urls = raw.match(URL_RE) || [];
  const rest = raw .replace(URL_RE, " ") .split("\n") .map((l) => l.trim()) .filter(Boolean);
  const restWords = rest.join(" ").split(/\s+/).filter(Boolean).length;
  const hasTranscript = /^\s*(transcript|bản ghi|lời thoại)\s*:\s*$/im.test(raw) || /\(\d{1,2}:\d{2}(?::\d{2})?\)/.test(raw);
  if (!urls.length || hasTranscript || restWords > 150) return { text: raw, notes: "" };
  const notes = rest.join("\n").slice(0, 2000);
  const links = [...new Set(urls)].slice(0, MAX_LINKS);
  const all = await Promise.all(links.map((u) => fetchLinkSource(u, signal)));
  const usable = all.filter((f) => f.raw && f.ok);
  if (usable.length < 2) { const fetched = usable[0] || all[0]; if (!fetched.raw) return { text: raw, notes: "", fetched }; return { text: fetched.raw, notes, fetched: usable.length && all.length > 1 ? { ...fetched, note: MR.MOTION_TEMPLATE_LINK_KHAC_KHONG_DOC_DUOC(fetched.note, all.length - 1) } : fetched }; }
  return { text: combineSources(usable), notes, fetched: { ...usable[0], title: usable.map((f) => f.title).join(MR.MOTION_TEXT_SYMBOL_52), note: MR.MOTION_TEMPLATE_DA_GOP_LINK(usable.length, usable.map((f) => MR.MOTION_TEMPLATE_SYMBOL_338(f.title, f.note)).join(MR.MOTION_TEXT_SYMBOL_41), usable.length < all.length ? MR.MOTION_TEMPLATE_LINK_KHONG_DOC_DUOC(all.length - usable.length) : "") } };
};
const MAX_LINKS = 3;
const STAMP_LINE = /^\((?:(\d{1,2}):)?(\d{1,2}):(\d{2})\)\s*(.*)$/;
const timedLines = (
  f: FetchedSource,
): { t: number; text: string; }[] => {
  const at = f.raw.search(/^Transcript:\s*$/m);
  if (at >= 0) { return f.raw .slice(at) .split("\n") .slice(1) .flatMap((line) => { const m = line.trim().match(STAMP_LINE); return m && m[4] ? [{ t: Number(m[1] || 0) * 3600 + Number(m[2]) * 60 + Number(m[3]), text: m[4] }] : []; }); }
  const body = f.raw.split("\n").slice(2).join(" ").replace(/\s+/g, " ").trim();
  const words = body.split(" ").filter(Boolean);
  const out: { t: number; text: string; }[] = [];
  for (let i = 0; i < words.length; i += 50) out.push({ t: Math.round(i / 2.6), text: words.slice(i, i + 50).join(" ") });
  return out;
};
const combineSources = (list: FetchedSource[]): string => {
  let offset = 0;
  const lines: string[] = [];
  list.forEach((f, i) => {
    const timed = timedLines(f);
    if (!timed.length) return;
    timed.forEach((l, j) => lines.push(MR.MOTION_TEMPLATE_SYMBOL_279(stamp(offset + l.t), j === 0 ? MR.MOTION_TEMPLATE_NGUON(i + 1, list.length, f.title) : "", l.text)));
    const last = timed[timed.length - 1];
    offset += last.t + Math.ceil(last.text.split(/\s+/).length / 2.6) + 5;
  });
  return MR.MOTION_TEMPLATE_TRANSCRIPT_2(list.map((f) => f.title).join(MR.MOTION_TEXT_SYMBOL_52), list[0].url, lines.join("\n")).slice(0, MAX_TEXT);
};
export const withFetchInfo = (source: MotionStorySource, notes: string, fetched?: FetchedSource): MotionStorySource => ({
  ...source,
  ...(notes ? { notes } : {}),
  ...(fetched ? { fetched: { kind: fetched.kind, ok: fetched.ok, note: fetched.note, url: fetched.url } } : {}),
  ...(fetched?.kind === MR.MOTION_TEXT_PAGE && fetched.ok && source.kind === MR.MOTION_TEXT_BRIEF ? { kind: MR.MOTION_TEXT_ARTICLE } : {}),
});
