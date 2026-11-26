import fs from "fs";
import os from "os";
import path from "path";
import { createHash } from "crypto";
import _ from "lodash";
import { probeMediaDurationSeconds } from "../../../video-export/server/services/videoExportFfmpegService.js";
import { REUP_BUILD, REUP_DIR, REUP_QUALITY, REUP_FOLDER, REUP_HIGHLIGHT, REUP_HOLD, REUP_MOMENT, REUP_MUSIC_ZONE, REUP_NARRATION, REUP_OVERLAY, REUP_POP_THEME, REUP_TEXT, REUP_TYPE, REUP_WATERMARK } from "../../constants/reupConfig.js";
import { REUP_LOG } from "../../constants/reupServerText.js";
import { reupPreset, reupQuick } from "../../constants/reupPresets.js";
import { reupTracks, reupZonedMusicBed } from "./reupMusicService.js";
import { reupAssSlice, reupClipSubtitles, reupItemAt, reupSubChars, reupShotPieces, reupSubtitleAss, reupSubtitleLines, reupSubtitleTimes } from "../../lib/reupSpeech.js";
import { reupHighlightAss, reupPickHighlights, reupPopAss, type ReupTextArea, type ReupHighlightEvent, type ReupHighlightSpot } from "../../lib/reupHighlights.js";
import { reupMusicZones, type ReupMusicZone } from "../../lib/reupMusicZones.js";
import { isGpuEncoder, mediaEncodeArgs, pickMediaEncoder, withEncoderFallback } from "../../../../server/utils/mediaEncoder.js";
import { pickHighlightAnchor } from "../../../../lib/highlightAnchor.js";
import type { HighlightAnchor } from "../../../../constants/highlightAnchor.js";
import { runLanes } from "../../../../lib/concurrency.js";
import { getStaticResourcePath } from "../../../../server/utils/paths.js";
import { HEAVY_JOB_TEXT } from "../../../../constants/mediaEncoder.js";
import { ReupFootageLedger, mergeSpans, reupFillScenes, reupPacing, reupSectionSeconds, type ReupPlannedSection } from "../../lib/reupTimeline.js";
import { reupHeardTalk, reupTalkTail } from "../../lib/reupTalk.js";
import { reupMoments } from "../../lib/reupSceneMap.js";
import type { ReupCorner, ReupDimRange, ReupJob, ReupJobSettings, ReupOutputResult, ReupOutputScript, ReupSegment, ReupSettings, ReupShot } from "../../types/reup.js";
import { reupFfmpeg, reupFilterValue, reupFont, reupFontFor } from "./reupFfmpeg.js";
import { reupFileUrl, reupJobDir } from "./reupJobStore.js";
type Log = (text: string, level?: "info" | "warn" | "error") => void;
interface Piece {
  file: string;
  seek: number;
  len: number;
  width: number;
  height: number;
  hasAudio: boolean;
  still: boolean;
  hold?: number;
  label?: { text: string; kind: "caption" | "stage" };
  focusX?: number;
  lift?: number;
  index: number;
}
const even = (n: number): number => Math.round(n / 2) * 2;
export const reupSourceHeight = (job: ReupJob): number => (job.source.kind === "folder" ? _.max((job.source.items || []).map((it) => Math.min(it.width, it.height))) || 0 : Math.min(job.source.width, job.source.height));
export const reupFrameSize = (settings: Pick<ReupSettings, "aspect" | "quality">, sourceHeight = 0): [number, number] => {
  const [w, h] = settings.quality === "auto" && sourceHeight && sourceHeight < REUP_BUILD.AUTO_SMALL_HEIGHT ? REUP_BUILD.AUTO_SMALL_SIZE : REUP_BUILD.QUALITY[settings.quality].size;
  return settings.aspect === "9:16" ? [even(h), even(w)] : [even(w), even(h)];
};
export const reupLogoFilter = (s: ReupJobSettings, p: Piece, mark?: ReupCorner): string => {
  if (p.still) return "";
  if (s.logo === "off" && mark) {
    const w = Math.max(8, Math.round(p.width * REUP_WATERMARK.BOX.W));
    const h = Math.max(8, Math.round(p.height * REUP_WATERMARK.BOX.H));
    return `delogo=x=${mark.endsWith("l") ? 2 : p.width - w - 2}:y=${mark.startsWith("t") ? 2 : p.height - h - 2}:w=${w}:h=${h},`;
  }
  if (s.logo === "off") return "";
  if (s.logo === "crop") return `scale=iw*${REUP_BUILD.LOGO_ZOOM}:ih*${REUP_BUILD.LOGO_ZOOM},crop=iw/${REUP_BUILD.LOGO_ZOOM}:ih/${REUP_BUILD.LOGO_ZOOM},`;
  const w = Math.max(8, Math.round(p.width * REUP_BUILD.LOGO_BOX));
  const h = Math.max(8, Math.round(p.height * REUP_BUILD.LOGO_BOX * 0.6));
  const x = s.logoCorner.endsWith("l") ? 2 : p.width - w - 2;
  const y = s.logoCorner.startsWith("t") ? 2 : p.height - h - 2;
  return `delogo=x=${x}:y=${y}:w=${w}:h=${h},`;
};
const textFile = (base: string, text: string): string => {
  fs.writeFileSync(base, text, "utf8");
  return base;
};
const outline = (size: number): string => `:borderw=${Math.max(2, Math.round(size * REUP_TEXT.OUTLINE))}:bordercolor=black@0.85:shadowx=0:shadowy=${Math.max(1, Math.round(size * REUP_TEXT.SHADOW))}:shadowcolor=black@0.45`;
const draw = (font: string, file: string, size: number, x: string, y: string, color: string, extra = ""): string => `drawtext=fontfile='${reupFilterValue(font)}':textfile='${reupFilterValue(file)}':fontsize=${size}:fontcolor=${color}:x=${x}:y=${y}${extra}`;
const CJK_GLYPH = /[\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af]/;
export const titleFit = (lines: string[], base: number, width: number): number =>
  Math.min(
    base,
    ...lines.map(
      (line) =>
        (width * REUP_TEXT.TITLE_FIT) /
        Math.max(
          1,
          _.sumBy([...line], (c) => (CJK_GLYPH.test(c) ? REUP_TEXT.TITLE_GLYPH_CJK : REUP_TEXT.TITLE_GLYPH)),
        ),
    ),
  );
const pictureFilter = (i: number, s: ReupJobSettings, p: Piece, w: number, h: number, font?: string, labelFile?: string, mark?: ReupCorner): string => {
  const head = `[${i}:v]${p.lift ? `eq=gamma=${p.lift}:brightness=${REUP_QUALITY.LIFT_BRIGHT}:saturation=${REUP_QUALITY.LIFT_SAT},` : ""}${reupLogoFilter(s, p, mark)}`;
  const label = labelFile && font && p.label ? `,${p.label.kind === "stage" ? draw(font, labelFile, Math.round(h * 0.07), "36", "36", "0xFFD400", ":box=1:boxcolor=black@0.6:boxborderw=14") : draw(font, labelFile, Math.round(Math.min(w, h) * 0.042), "40", `h-th-${Math.round(h * 0.06)}`, "white", ":box=1:boxcolor=black@0.5:boxborderw=10")}` : "";
  const hold = p.hold ? `,tpad=stop_mode=clone:stop_duration=${p.hold.toFixed(3)}` : "";
  const tail = `${hold},fps=${s.fps},format=yuv420p,setsar=1${label},trim=duration=${p.len.toFixed(3)},setpts=PTS-STARTPTS[v${i}]`;
  const same = Math.abs(p.width / p.height - w / h) < 0.02;
  const close = Math.abs(p.width / p.height - w / h) / (w / h) < 0.25;
  if (p.still && s.kenBurns) {
    const W = even(w * 2),
      H = even(h * 2);
    const frames = Math.max(1, Math.round(p.len * s.fps));
    const z = REUP_OVERLAY.KEN_BURNS_ZOOM;
    const zoom = p.index % 2 ? `${1 + z}-${z}*on/${frames}` : `1+${z}*on/${frames}`;
    const base = close ? `scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H}` : `split=2[kb${i}][kf${i}];[kb${i}]scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},boxblur=30:2[kbb${i}];[kf${i}]scale=${W}:${H}:force_original_aspect_ratio=decrease[kff${i}];[kbb${i}][kff${i}]overlay=(W-w)/2:(H-h)/2`;
    return `${head}${base},zoompan=z='${zoom}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=${w}x${h}:fps=${s.fps}${tail}`;
  }
  if (same) return `${head}scale=${w}:${h}${tail}`;
  const portrait = h > w && !p.still && p.width > p.height;
  if (portrait) {
    const fx = _.clamp(p.focusX ?? 0.5, 0, 1).toFixed(3);
    return `${head}scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h}:'min(max(iw*${fx}-ow/2,0),iw-ow)':(ih-oh)/2${tail}`;
  }
  if (close && p.still) return `${head}scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h}${tail}`;
  return `${head}split=2[bg${i}][fg${i}];[bg${i}]scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h},boxblur=20:2[bb${i}];[fg${i}]scale=${w}:${h}:force_original_aspect_ratio=decrease[ff${i}];[bb${i}][ff${i}]overlay=(W-w)/2:(H-h)/2${tail}`;
};
const inputArgs = (p: Piece, fps: number): string[] => (p.still ? ["-loop", "1", "-framerate", String(fps), "-t", (p.len + 0.2).toFixed(3), "-i", p.file] : ["-ss", p.seek.toFixed(3), "-t", (p.len - (p.hold || 0) + 0.2).toFixed(3), "-i", p.file]);
interface SectionOptions {
  title?: { lines: string[]; kind: "hook" | "fixed" };
  overlays: { ass: string; fonts: string }[];
}
export const reupStingBeds = (at: number[], total: number): { graph: string[]; beds: string[] } => {
  const S = REUP_HIGHLIGHT.SHORT.STING;
  const times = at.map((a) => Math.max(0, a - S.LEAD)).filter((a) => a + S.SECONDS <= total);
  return {
    graph: times.map((a, i) => `anoisesrc=d=${S.SECONDS}:c=pink:a=${S.AMP}:r=${REUP_BUILD.AUDIO_RATE},highpass=f=${S.HIGHPASS},lowpass=f=${S.LOWPASS},afade=t=in:d=${S.FADE_IN},afade=t=out:st=${S.FADE_IN}:d=${(S.SECONDS - S.FADE_IN).toFixed(3)},aformat=channel_layouts=stereo,adelay=${Math.round(a * 1000)}|${Math.round(a * 1000)},apad=whole_dur=${total.toFixed(3)}[sting${i}]`),
    beds: times.map((_a, i) => `[sting${i}]`),
  };
};
interface RenderContext {
  encoder: string;
  size: [number, number];
  log: Log;
}
const keyOf = (args: string[], overlays: string[]): string =>
  createHash("sha1")
    .update([...args, ...overlays].join("\u0001"))
    .digest("hex");
const renderSection = async (job: ReupJob, pieces: Piece[], file: string, opts: SectionOptions, lang: string, ctx: RenderContext, signal?: AbortSignal): Promise<boolean> => {
  const s = job.settings;
  const font = reupFont(lang);
  const heavy = reupFont(lang, "heavy") || font;
  const [w, h] = ctx.size;
  const inputs: string[] = [];
  const graph: string[] = [];
  pieces.forEach((p, i) => {
    inputs.push(...inputArgs(p, s.fps));
    const labelFont = p.label?.kind === "stage" ? heavy : font;
    graph.push(pictureFilter(i, s, p, w, h, labelFont, p.label && labelFont ? textFile(`${file}.l${i}.txt`, p.label.text) : undefined, job.watermark));
    const len = p.len.toFixed(3);
    graph.push(p.hasAudio && !p.still ? `[${i}:a]aresample=${REUP_BUILD.AUDIO_RATE},aformat=channel_layouts=stereo,apad,atrim=duration=${len},asetpts=PTS-STARTPTS[a${i}]` : `anullsrc=r=${REUP_BUILD.AUDIO_RATE}:cl=stereo,atrim=duration=${len}[a${i}]`);
  });
  graph.push(`${pieces.map((_p, i) => `[v${i}][a${i}]`).join("")}concat=n=${pieces.length}:v=1:a=1[vc][ac]`);
  let video = "vc";
  if (opts.title?.lines.length && heavy) {
    const size = Math.round(titleFit(opts.title.lines, Math.min(w, h) * (opts.title.kind === "fixed" ? 0.075 : 0.085), w)),
      top = Math.round(h * (opts.title.kind === "fixed" ? 0.1 : 0.14));
    const enable = opts.title.kind === "hook" ? `:enable='lt(t,${REUP_BUILD.TITLE_HOOK_SECONDS})'` : "";
    const box = opts.title.kind === "fixed" ? ":box=1:boxcolor=black@0.55:boxborderw=16" : outline(size);
    const draws = opts.title.lines.map((line, i) => draw(heavy, textFile(`${file}.t${i}.txt`, line), size, "(w-text_w)/2", String(top + Math.round(i * size * REUP_TEXT.LINE_HEIGHT)), i ? "0xFFD400" : "white", box + enable));
    graph.push(`[${video}]${draws.join(",")}[vt]`);
    video = "vt";
  }
  const overlays = opts.overlays.filter((o) => o.ass);
  if (overlays.length) {
    const subs = overlays.map((o, k) => `subtitles=${path.basename(textFile(`${file}.o${k}.ass`, o.ass))}:fontsdir='${reupFilterValue(o.fonts)}'`);
    graph.push(`[${video}]${subs.join(",")}[vs]`);
    video = "vs";
  }
  if (s.logoFile && fs.existsSync(s.logoFile)) {
    inputs.push("-i", s.logoFile);
    graph.push(`[${pieces.length}:v]scale=-1:${Math.round(h * 0.09)}[lg]`, `[${video}][lg]overlay=W-w-${Math.round(w * 0.025)}:${Math.round(h * 0.03)}[vl]`);
    video = "vl";
  }
  const crf = REUP_BUILD.QUALITY[s.quality].crf;
  const args = (encoder: string) => ["-y", ...inputs, "-filter_complex", graph.join(";"), "-map", `[${video}]`, "-map", "[ac]", ...mediaEncodeArgs(encoder, { crf, fps: s.fps, preset: REUP_BUILD.PRESET }), "-r", String(s.fps), "-c:a", "aac", "-b:a", REUP_BUILD.AUDIO_BITRATE, "-ar", String(REUP_BUILD.AUDIO_RATE), file];
  const key = keyOf(args(ctx.encoder), [...overlays.map((o) => o.ass), ...pieces.map((p) => `${p.file}|${fs.existsSync(p.file) ? fs.statSync(p.file).mtimeMs : 0}`)]);
  const keyFile = file + REUP_BUILD.CACHE_KEY_EXT;
  if (fs.existsSync(file) && fs.existsSync(keyFile) && fs.readFileSync(keyFile, "utf8") === key) return true;
  fs.rmSync(keyFile, { force: true });
  await reupFfmpeg(args(ctx.encoder), { signal, cwd: path.dirname(file) });
  fs.writeFileSync(keyFile, key, "utf8");
  return false;
};
const safeName = (text: string): string =>
  text
    .replace(/\.[^.]+$/, "")
    .replace(/[^\p{L}\p{N}_-]+/gu, "_")
    .slice(0, 40) || "video";
const segmentAt = (segments: ReupSegment[], t: number): ReupSegment | undefined => segments.find((g) => t >= g.start && t < g.end);
export const reupLift = (dim: ReupDimRange[] | undefined, span: ReupShot): number | undefined => {
  const hit = _.maxBy(
    (dim || []).filter((d) => d.start < span.end && d.end > span.start),
    (d) => Math.min(d.end, span.end) - Math.max(d.start, span.start),
  );
  return hit ? _.round(_.clamp((REUP_QUALITY.DIM_TARGET / Math.max(1, hit.luma)) ** REUP_QUALITY.GAMMA_POWER, 1, REUP_QUALITY.GAMMA_MAX), 2) : undefined;
};
const piecesOf = (job: ReupJob, shot: ReupShot, index: number): Piece[] => {
  const s = job.settings;
  const seg = segmentAt(job.sceneMap?.segments || [], (shot.start + shot.end) / 2);
  const stage = s.beforeAfter && seg ? (seg.tags.includes("after") ? "AFTER" : seg.tags.includes("before") ? "BEFORE" : "") : "";
  const label: Piece["label"] = stage ? { text: stage, kind: "stage" } : s.captions && seg?.caption ? { text: seg.caption, kind: "caption" } : undefined;
  if (job.source.kind !== "folder") return [{ file: job.source.path, seek: shot.start, len: shot.end - shot.start, width: job.source.width, height: job.source.height, hasAudio: job.source.hasAudio, still: false, label, focusX: seg?.focusX, lift: reupLift(job.dim, shot), index }];
  return reupShotPieces(job.source.items || [], shot).map((x, k) => ({ file: x.item.path, seek: x.from, len: x.to - x.from, width: x.item.width, height: x.item.height, hasAudio: x.item.hasAudio, still: x.item.type === "photo", label, focusX: seg?.focusX, lift: reupLift(job.dim, shot), index: index + k }));
};
const cuePiece = (job: ReupJob, segmentId: string, seconds: number, index: number): Piece | undefined => {
  const seg = job.sceneMap?.segments.find((g) => g.id === segmentId);
  const item = seg && reupItemAt(job.source.items || [], (seg.start + seg.end) / 2);
  if (!seg || !item) return undefined;
  const own = item.end - item.start;
  const label: Piece["label"] = job.settings.captions && seg.caption ? { text: seg.caption, kind: "caption" } : undefined;
  return { file: item.path, seek: 0, len: seconds, width: item.width, height: item.height, hasAudio: item.hasAudio, still: item.type === "photo", hold: item.type === "clip" && own < seconds ? seconds - own : undefined, label, focusX: seg.focusX, lift: reupLift(job.dim, seg), index };
};
interface PlannedSection {
  pieces: Piece[];
  seconds: number;
  chapter?: string;
}
const narrationSubtitles = (job: ReupJob, output: ReupOutputScript, planned: PlannedSection[], size: [number, number]): { ass: string; fonts: string } | undefined => {
  const s = job.settings;
  const [w, h] = size;
  const font = reupFontFor(output.lang || s.language);
  if (!font) return undefined;
  let at = 0;
  const lines = output.sections.flatMap((sec, i) => {
    const voice = job.voices![sec.id];
    const from = at;
    const until = at + planned[i].seconds;
    at = until;
    const chars = reupSubChars(s.aspect, output.lang || s.language);
    const subs = voice.subs ? reupClipSubtitles(voice.subs, chars) : reupSubtitleTimes(reupSubtitleLines(sec.text, chars), [], voice.seconds);
    return subs.map((line) => ({ text: line.text, start: from + line.start, end: Math.min(until, from + line.end) }));
  });
  return lines.length ? { ass: reupSubtitleAss(lines, { width: w, height: h, font: font.family, ...(s.captions ? { lift: REUP_OVERLAY.SUB_ABOVE_CAPTION } : {}) }), fonts: path.dirname(font.file) } : undefined;
};
const highlightFonts = (): string => getStaticResourcePath(REUP_HIGHLIGHT.FONT_DIR);
const focusAt = (planned: PlannedSection[], t: number): number | undefined => {
  let at = 0;
  for (const piece of planned.flatMap((p) => p.pieces)) {
    if (t < at + piece.len) return piece.focusX;
    at += piece.len;
  }
  return undefined;
};
export const reupTextArea = (s: Pick<ReupJobSettings, "subtitles">, size: [number, number]): ReupTextArea => {
  const h = size[1];
  return { top: Math.round(h * REUP_TYPE.SAFE_TOP), bottom: Math.round(h * (1 - (s.subtitles ? REUP_TYPE.SUBS_BOTTOM : REUP_TYPE.SAFE_BOTTOM))) };
};
const popLayer = (job: ReupJob, output: ReupOutputScript, marks: ReupHighlightEvent[], planned: PlannedSection[], size: [number, number]): { ass: string; fonts: string } | undefined => {
  if (!marks.length) return undefined;
  const lang = output.lang || job.settings.language;
  const cjk = lang === "ja" || lang === "ko" ? reupFontFor(lang, "heavy") : undefined;
  const look = (REUP_HIGHLIGHT.SHORT.LOOKS as readonly string[]).includes(job.style?.pop || "") ? job.style!.pop! : REUP_HIGHLIGHT.SHORT.LOOKS[0];
  return { ass: reupPopAss(marks, { width: size[0], height: size[1], look, theme: REUP_POP_THEME[job.preset] || REUP_POP_THEME.A, lang, area: reupTextArea(job.settings, size), cjk: cjk?.family, focus: marks.map((m) => focusAt(planned, m.start)) }), fonts: cjk ? path.dirname(cjk.file) : highlightFonts() };
};
const highlightEvents = (job: ReupJob, output: ReupOutputScript, planned: PlannedSection[], total: number): ReupHighlightEvent[] => {
  const s = job.settings;
  if (s.highlights === "off") return [];
  const quick = reupQuick(s.targetSeconds);
  let at = 0;
  const spots: ReupHighlightSpot[] = output.sections.flatMap((sec, i) => {
    const start = at;
    at += planned[i].seconds;
    const cues = job.voices?.[sec.id]?.cues || [];
    if (quick) return (sec.marks || (sec.mark ? [sec.mark] : [])).map((mark) => ({ at: start + (cues[mark.cue] ?? 0), until: at, mark }));
    const mark = sec.mark || (sec.chapter ? { cue: 0, label: "", title: sec.chapter } : undefined);
    if (!mark) return [];
    return [{ at: start + (cues[mark.cue] ?? 0), until: at, mark }];
  });
  return reupPickHighlights(spots, { total, mode: s.highlights, rules: s, title: output.title.length ? s.titleOverlay : "off", quick });
};
const highlightAnchorOf = (job: ReupJob, outputId: string): HighlightAnchor => {
  const s = job.settings;
  const focus = _.compact((job.sceneMap?.segments || []).map((g) => g.focusX));
  const avoid: HighlightAnchor[] = [...(s.aspect === "9:16" ? (["tr", "mr", "br", "bl", "bc"] as const) : []), ...(s.subtitles ? (["bc"] as const) : []), ...(s.captions ? (["bl", "bc"] as const) : []), ...(s.titleOverlay === "fixed" ? (["tl", "tc", "tr"] as const) : []), ...(s.logoFile ? (["tr"] as const) : [])];
  return pickHighlightAnchor({ seed: `${job.id}:${outputId}`, avoid, subjectX: focus.length ? _.mean(focus) : undefined });
};
const sourceShare = (planned: PlannedSection[], duration: number): number => {
  const spans = _.sortBy(
    planned.flatMap((p) => p.pieces.filter((x) => !x.still).map((x) => [x.seek, x.seek + x.len - (x.hold || 0)] as [number, number])),
    0,
  );
  let used = 0;
  let end = 0;
  for (const [a, b] of spans) {
    used += Math.max(0, b - Math.max(a, end));
    end = Math.max(end, b);
  }
  return Math.min(1, used / duration);
};
const levelsOf = async (file: string, signal?: AbortSignal): Promise<[number, number][]> => {
  const log = await reupFfmpeg(["-i", file, "-vn", "-af", "ebur128=peak=none", "-f", "null", "-"], { signal, keepLog: true });
  return [...log.matchAll(/t:\s*([\d.]+)\s+TARGET:[^M]*M:\s*(-?[\d.]+)/g)].map((m) => [Number(m[1]), Number(m[2])]);
};
const loudnessIn = (levels: [number, number][], spans: [number, number][]): number | undefined => {
  const values = levels.filter(([t, m]) => m > -70 && spans.some(([a, b]) => t >= a && t <= b)).map(([, m]) => 10 ** (m / 10));
  return values.length ? _.round(10 * Math.log10(_.mean(values)), 1) : undefined;
};
const silencesOf = async (file: string, signal?: AbortSignal): Promise<[number, number][]> => {
  const log = await reupFfmpeg(["-i", file, "-af", `silencedetect=n=${REUP_MUSIC_ZONE.SILENCE_DB}dB:d=${REUP_MUSIC_ZONE.GAP}`, "-f", "null", "-"], { signal, keepLog: true });
  const starts = [...log.matchAll(/silence_start: (-?[\d.]+)/g)].map((m) => Number(m[1]));
  const ends = [...log.matchAll(/silence_end: ([\d.]+)/g)].map((m) => Number(m[1]));
  return starts.map((t, i) => [Math.max(0, t), ends[i] ?? Infinity] as [number, number]);
};
export const reupMixBeds = (s: ReupJobSettings, naturals: { input: string; key: string; lu: number }[], music?: { input: string; key: string; total: number }, stings?: { graph: string[]; beds: string[] }): string[] => {
  const graph: string[] = [...(stings?.graph || [])];
  const beds: string[] = [...(stings?.beds || [])];
  naturals.forEach((n, i) => {
    graph.push(`${n.input}aresample=${REUP_BUILD.AUDIO_RATE},aformat=channel_layouts=stereo,loudnorm=I=${s.lufs + n.lu}:TP=-3:LRA=15,aresample=${REUP_BUILD.AUDIO_RATE}[n${i}]`, `[n${i}]${n.key}sidechaincompress=threshold=0.02:ratio=4:attack=40:release=900${music ? `,asplit=2[nat${i}][nk${i}]` : `[nat${i}]`}`);
    beds.push(`[nat${i}]`);
  });
  if (music) {
    graph.push(`${music.input}aresample=${REUP_BUILD.AUDIO_RATE},aformat=channel_layouts=stereo,${REUP_MUSIC_ZONE.TONE},atrim=duration=${music.total.toFixed(3)}[m0]`, `[m0]${music.key}sidechaincompress=${REUP_MUSIC_ZONE.VOICE_DUCK}${naturals.length ? "[md]" : "[mus]"}`);
    if (naturals.length) graph.push(`[md][nk0]sidechaincompress=${REUP_MUSIC_ZONE.NATURAL_DUCK}[mus]`);
    beds.push("[mus]");
  }
  graph.push(`[v]${beds.join("")}${beds.length ? `amix=inputs=${beds.length + 1}:duration=first:normalize=0,` : ""}alimiter=limit=${REUP_BUILD.LIMIT}:level=0[out]`);
  return graph;
};
const laneCount = (encoder: string): number => (isGpuEncoder(encoder) ? REUP_BUILD.LANES_GPU : _.clamp(Math.floor(os.cpus().length / REUP_BUILD.CPUS_PER_LANE), 1, REUP_BUILD.LANES_CPU));
const stepTimer = (log: Log, label: string, media?: number) => {
  const started = Date.now();
  return () => log(HEAVY_JOB_TEXT.STEP(label, (Date.now() - started) / 1000, media));
};
export const buildReupJob = async (job: ReupJob, used: ReupShot[], log: Log, progress: (p: number) => void, signal?: AbortSignal): Promise<ReupOutputResult[]> => {
  const s = job.settings;
  const preset = reupPreset(job.preset);
  const map = job.sceneMap!;
  const ledgers = new Map<string, ReupFootageLedger>();
  const quick = reupQuick(s.targetSeconds);
  const ledger = (lang: string) =>
    ledgers.get(lang) || ledgers.set(lang, new ReupFootageLedger({ duration: job.source.duration, bad: job.bad, dim: job.dim, dimShot: REUP_QUALITY.DIM_SHOT, minShot: REUP_BUILD.MIN_SHOT, maxShot: quick ? REUP_HIGHLIGHT.SHORT.SHOT_MAX : REUP_BUILD.MAX_SHOT, hookCut: s.hookCutSeconds, guard: REUP_BUILD.GUARD, ...(quick ? { spacing: REUP_HIGHLIGHT.SHORT.SPACING } : {}) })).get(lang)!;
  const track = s.music === "library" && job.style?.track ? reupTracks(job.preset).find((t) => t.name === job.style!.track) : undefined;
  if (!track) log(REUP_LOG.MUSIC_NONE);
  const outputs = job.script!.outputs;
  const results: ReupOutputResult[] = [];
  const size = reupFrameSize(s, reupSourceHeight(job));
  const [w, h] = size;
  const encoder = await pickMediaEncoder(s.encoder, "h264");
  log(HEAVY_JOB_TEXT.ENCODER(encoder));
  const ctx: RenderContext = { encoder, size, log };
  const laneMax = laneCount(encoder);
  log(REUP_LOG.BUILD_LANES(laneMax));
  for (const [oi, output] of outputs.entries()) {
    const lang = output.lang || s.language;
    const dir = reupJobDir(job.id, REUP_DIR.SECTIONS, output.id);
    let planned: PlannedSection[];
    let spoken: number[];
    let words: number[] = [];
    let padding = 0;
    let repeated = false;
    let talkHeard: number[] = [];
    const voices = await Promise.all(output.sections.map(async (sec) => await probeMediaDurationSeconds(job.voices![sec.id].file)));
    const footage = preset.source === "video";
    const fill = s.fillUnused && footage;
    const pacing = reupPacing(s.natural, job.source.hasAudio);
    const moments = footage && output.sections.some((sec) => sec.cues?.[0]?.moment);
    const target = footage ? s.targetSeconds + REUP_BUILD.LONG_MARGIN : 0;
    const timing = reupSectionSeconds(
      voices,
      output.sections.map((x) => x.role),
      s.pauseSeconds,
      target,
      Math.min(moments ? pacing.tailMax : REUP_BUILD.TAIL_MAX, quick ? REUP_HIGHLIGHT.SHORT.TAIL : Infinity),
      moments ? 1 - Math.max(pacing.share[0], s.narratedMin - REUP_NARRATION.COVER_SLACK) : REUP_BUILD.SILENT_SHARE,
      fill,
    );
    spoken = voices;
    words = voices.map((v, i) => Math.max(0, v - (job.voices![output.sections[i].id].gaps || 0)));
    padding = timing.padding;
    if (target && timing.short > 1) log(REUP_LOG.SHORT_TARGET(timing.short), "warn");
    const moment = new Map(map.segments.flatMap((g) => reupMoments(g).map((m) => [m.id, m] as const)));
    const scene = new Map(map.segments.map((g) => [g.id, g]));
    const label = outputs.length > 1 ? REUP_LOG.OUTPUT_LABEL(oi + 1) : "";
    const report = (i: number, plans: ReupPlannedSection[]): void => {
      const filled = _.sumBy(plans, "filled");
      const shrunk = _.sumBy(plans, "shrunk");
      if (filled > 1) log(REUP_LOG.FILLED(label, i + 1, filled, _.sumBy(plans, "scenes")));
      if (shrunk > 0.5) log(REUP_LOG.SHRUNK(label, i + 1, shrunk));
      if (plans.some((p) => p.repeated)) log(REUP_LOG.REPEATED(label, i + 1), "warn");
      repeated ||= plans.some((p) => p.repeated);
      padding = Math.max(0, padding - shrunk);
    };
    const fills = (ids: string[], hook: boolean) => reupFillScenes(map.segments, ids, { hook, stage: s.beforeAfter, avoid: used });
    const talk = s.keepTalk && footage ? job.transcript?.phrases || [] : [];
    const atOf = (cue: { moment?: string }, g: ReupSegment): number => Math.max(g.start, (moment.get(cue.moment || "")?.t ?? g.start) - REUP_MOMENT.LEAD);
    planned = output.sections.map((sec, i) => {
      const starts = sec.cues?.length ? job.voices![sec.id].cues || sec.cues.map((_c, k) => (k * voices[i]) / sec.cues!.length) : [];
      const cueSeconds = (k: number, end: number): number => Math.max(0.6, (k + 1 < starts.length ? starts[k + 1] : end) - (k ? starts[k] : 0));
      const done = (pieces: Piece[]): PlannedSection => ({ pieces, seconds: _.sumBy(pieces, "len"), chapter: sec.chapter });
      if (sec.cues?.length && footage) {
        const last = sec.cues.length - 1;
        const lastScene = scene.get(sec.cues[last].segment);
        const lastStart = last ? starts[last] : 0;
        const lastAt = lastScene ? atOf(sec.cues[last], lastScene) : 0;
        const reach = lastScene && talk.length && sec.role !== "hook" ? reupTalkTail(talk, lastScene, lastAt, lastAt + voices[i] - lastStart) : undefined;
        const spoke = reach !== undefined && lastStart + reach > timing.seconds[i];
        if (spoke) timing.seconds[i] = _.round(lastStart + reach!, 2);
        const tail = spoke ? 0 : Math.max(0, timing.seconds[i] - voices[i] - s.pauseSeconds);
        const plans = sec.cues.flatMap((cue, k) => {
          const g = scene.get(cue.segment);
          if (!g) return [];
          const seconds = cueSeconds(k, timing.seconds[i]);
          const whole = spoke && k === last;
          return [ledger(lang).planCue(atOf(cue, g), g, seconds, fills([g.id], sec.role === "hook"), whole ? seconds : quick ? REUP_HIGHLIGHT.SHORT.SHOT_MAX : REUP_BUILD.CUE_SHOT, quick ? REUP_BUILD.MIN_SHOT : REUP_BUILD.CUE_MIN, k === last ? tail : 0, whole ? 1 : quick ? REUP_HIGHLIGHT.SHORT.JUMP : undefined, quick && !whole)];
        });
        report(i, plans);
        return done(plans.flatMap((plan) => plan.shots).flatMap((shot, k) => piecesOf(job, shot, i * 100 + k)));
      }
      if (sec.cues?.length) {
        const pieces = _.compact(sec.cues.map((cue, k) => cuePiece(job, cue.segment, cueSeconds(k, timing.seconds[i]), i * 100 + k)));
        const held = _.max(pieces.filter((p) => p.still).map((p) => p.len)) || 0;
        if (held > REUP_FOLDER.PHOTO_SECONDS * REUP_HOLD.LONG_HOLD) log(REUP_LOG.HOLD_LONG(label, i + 1, held), "warn");
        return done(pieces);
      }
      const ids = map.segments.filter((g) => sec.shots.some((shot) => shot.start < g.end && shot.end > g.start)).map((g) => g.id);
      const plan = ledger(lang).plan(sec.shots, timing.seconds[i], sec.role === "hook", fills(ids, sec.role === "hook"), fill, Math.max(0, timing.seconds[i] - voices[i] - s.pauseSeconds));
      report(i, [plan]);
      return done(plan.shots.flatMap((shot, k) => piecesOf(job, shot, i * 100 + k)));
    });
    if (talk.length) {
      talkHeard = planned.map((plan, i) =>
        reupHeardTalk(
          talk,
          plan.pieces.filter((p) => !p.still),
          voices[i],
        ),
      );
      const heard = _.sum(talkHeard);
      if (heard > 0) log(REUP_LOG.TALK_HEARD(label, talkHeard.filter((x) => x > 0).length, heard));
    }
    const total = _.sumBy(planned, "seconds");
    const sectionStarts = planned.reduce<number[]>((acc, _p, i) => [...acc, i ? acc[i - 1] + planned[i - 1].seconds : 0], []);
    log(REUP_LOG.BUILD_OUTPUT(oi + 1, outputs.length, total));
    const lifted = _.sumBy(planned, (p) => p.pieces.filter((x) => x.lift).length);
    if (lifted) log(REUP_LOG.LIFTED(lifted));
    const marks = highlightEvents(job, output, planned, total);
    const subs = s.subtitles ? narrationSubtitles(job, output, planned, size) : undefined;
    const anchor = highlightAnchorOf(job, output.id);
    log(REUP_LOG.HIGHLIGHTS(marks.length, REUP_LOG.ANCHOR[anchor]));
    const pop = quick ? popLayer(job, output, marks, planned, size) : undefined;
    const highlight = pop || (marks.length ? { ass: reupHighlightAss(marks, { width: w, height: h, anchor, area: reupTextArea(s, size) }), fonts: highlightFonts() } : undefined);
    const layers = _.compact([subs, highlight]);
    let partAt = 0;
    const jobs = planned.flatMap((plan, i) =>
      _.chunk(plan.pieces, REUP_BUILD.SECTION_SHOTS).map((pieces, k) => {
        const role = output.sections[i].role;
        const from = partAt;
        partAt += _.sumBy(pieces, "len");
        const title = s.titleOverlay === "fixed" ? { lines: output.title, kind: "fixed" as const } : s.titleOverlay === "hook" && i === 0 && k === 0 && role === "hook" ? { lines: output.title, kind: "hook" as const } : undefined;
        const overlays = layers.map((l) => ({ ass: reupAssSlice(l.ass, from, partAt), fonts: l.fonts }));
        return { pieces, opts: { title, overlays }, file: path.join(dir, `part_${String(i + 1).padStart(2, "0")}_${k + 1}.mp4`) };
      }),
    );
    let finished = 0;
    let cached = 0;
    const partsDone = stepTimer(log, REUP_LOG.STEP_PARTS, total);
    await withEncoderFallback(
      ctx.encoder,
      async (encoder) => {
        ctx.encoder = encoder;
        finished = 0;
        cached = 0;
        await runLanes(jobs, laneMax, async (piece) => {
          if (await renderSection(job, piece.pieces, piece.file, piece.opts, lang, ctx, signal)) cached++;
          finished++;
          log(REUP_LOG.BUILD_SECTION(finished, jobs.length));
          progress((oi + (finished / jobs.length) * 0.85) / outputs.length);
        });
      },
      (encoder) => log(HEAVY_JOB_TEXT.GPU_FALLBACK(encoder), "warn"),
      signal,
    );
    if (cached) log(REUP_LOG.BUILD_CACHED(cached, jobs.length));
    partsDone();
    const mixDone = stepTimer(log, REUP_LOG.STEP_MIX, total);
    const list = path.join(dir, "parts.txt");
    fs.writeFileSync(list, jobs.map((j) => `file '${j.file.replace(/\\/g, "/").replace(/'/g, "'\\''")}'`).join("\n"), "utf8");
    const joined = path.join(dir, "joined.mp4");
    await reupFfmpeg(["-y", "-f", "concat", "-safe", "0", "-i", list, "-c", "copy", joined], { signal });
    log(REUP_LOG.BUILD_MIX);
    const name = `${safeName(job.source.name)}_${job.preset}_${output.id}.mp4`;
    const final = path.join(reupJobDir(job.id, REUP_DIR.OUT), name);
    const loud = `loudnorm=I=${s.lufs}:TP=${REUP_BUILD.TRUE_PEAK}:LRA=${REUP_BUILD.LRA},aresample=${REUP_BUILD.AUDIO_RATE}`;
    const voiceFile = path.join(dir, "voice.wav");
    await reupFfmpeg(
      [
        "-y",
        ...output.sections.flatMap((sec) => ["-i", job.voices![sec.id].file]),
        "-filter_complex",
        `${output.sections.map((_x, i) => `[${i}:a]aresample=${REUP_BUILD.AUDIO_RATE},aformat=channel_layouts=stereo,apad=whole_dur=${planned[i].seconds.toFixed(3)},atrim=duration=${planned[i].seconds.toFixed(3)}[s${i}]`).join(";")};${output.sections.map((_x, i) => `[s${i}]`).join("")}concat=n=${output.sections.length}:v=0:a=1[voice]`,
        "-map",
        "[voice]",
        "-c:a",
        "pcm_s16le",
        voiceFile,
      ],
      { signal },
    );
    let music: string | undefined;
    let zones: ReupMusicZone[] = [];
    let silences: [number, number][] = [];
    if (track) {
      silences = await silencesOf(voiceFile, signal);
      zones = reupMusicZones({ mode: s.musicMode, total, sections: output.sections.map((sec, i) => ({ start: sectionStarts[i], end: sectionStarts[i] + planned[i].seconds, role: sec.role })), silences, stings: marks.map((m) => m.start), chapters: sectionStarts.filter((_t, i) => planned[i].chapter) });
      log(
        REUP_LOG.MUSIC_ZONES(
          zones.length,
          _.sumBy(zones, (z) => z.end - z.start),
          total,
        ),
      );
      music = await reupZonedMusicBed(track, zones, total, dir, signal);
    }
    const musicArgs = music ? ["-i", music] : [];
    const graph: string[] = [];
    const natural = job.source.hasAudio ? REUP_BUILD.NATURAL_LU[s.natural] : undefined;
    const keys = [natural !== undefined ? "[kn]" : "", music ? "[km]" : ""].filter(Boolean);
    graph.push(`[1:a]${loud}${keys.length ? `,asplit=${keys.length + 1}[v]${keys.join("")}` : "[v]"}`);
    graph.push(
      ...reupMixBeds(
        s,
        natural !== undefined ? [{ input: "[0:a]", key: "[kn]", lu: natural }] : [],
        music ? { input: "[2:a]", key: "[km]", total } : undefined,
        quick
          ? reupStingBeds(
              marks.map((e) => e.start),
              total,
            )
          : undefined,
      ),
    );
    await reupFfmpeg(["-y", "-i", joined, "-i", voiceFile, ...musicArgs, "-filter_complex", graph.join(";"), "-map", "0:v", "-c:v", "copy", "-map", "[out]", "-c:a", "aac", "-b:a", REUP_BUILD.AUDIO_BITRATE, "-ar", String(REUP_BUILD.AUDIO_RATE), "-t", total.toFixed(3), "-movflags", "+faststart", final], { signal, cwd: dir });
    mixDone();
    if (zones.length) {
      const levels = await levelsOf(final, signal);
      const quiet = zones.filter((z) => z.kind === "gap" || z.kind === "ending").map((z) => [z.start, z.end] as [number, number]);
      const edges = [0, ...silences.flat(), total].map((t) => Math.min(t, total));
      const spoken = _.chunk(edges, 2).filter(([from, to]) => to - from >= REUP_MUSIC_ZONE.LEVEL_MIN) as [number, number][];
      log(REUP_LOG.LEVELS(loudnessIn(levels, spoken), loudnessIn(levels, quiet)));
    }
    const duration = await probeMediaDurationSeconds(final);
    const chapters = planned.flatMap((plan, i) => (plan.chapter ? [{ t: _.round(sectionStarts[i], 1), title: plan.chapter }] : []));
    const narrated = _.round(Math.min(duration, _.sum(words)), 1);
    const silentMax = _.round(_.max(planned.map((plan, i) => Math.max(0, plan.seconds - (spoken[i] || 0) - (talkHeard[i] || 0)))) || 0, 1);
    const spans = job.source.kind === "video" ? mergeSpans(planned.flatMap((p) => p.pieces.filter((x) => !x.still).map((x) => ({ start: x.seek, end: x.seek + x.len - (x.hold || 0) })))).map((x) => [_.round(x.start, 1), _.round(x.end, 1)] as [number, number]) : [];
    results.push({
      id: output.id,
      file: final,
      url: reupFileUrl(final),
      duration,
      width: w,
      height: h,
      narrated,
      voiced: _.round(Math.min(duration, _.sum(spoken)), 1),
      highlights: marks.length,
      longestShot: _.round(_.max(planned.flatMap((p) => p.pieces.map((x) => x.len))) || 0, 1),
      ...(job.source.kind === "video" && job.source.duration ? { sourceShare: _.round(sourceShare(planned, job.source.duration), 2) } : {}),
      silentMax,
      padding: _.round(padding, 1),
      repeated,
      ...(_.sum(talkHeard) > 0 ? { talk: _.round(_.sum(talkHeard), 1) } : {}),
      ...(spans.length ? { spans } : {}),
      ...(chapters.length ? { chapters } : {}),
    });
    log(REUP_LOG.BUILD_DONE(name, duration));
    progress((oi + 1) / outputs.length);
  }
  return results;
};
