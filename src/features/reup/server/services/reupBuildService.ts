import fs from "fs";
import path from "path";
import _ from "lodash";
import { probeMediaDurationSeconds } from "../../../video-export/server/services/videoExportFfmpegService.js";
import { REUP_BUILD, REUP_DIR, REUP_OVERLAY } from "../../constants/reupConfig.js";
import { REUP_LOG } from "../../constants/reupServerText.js";
import { reupPreset } from "../../constants/reupPresets.js";
import { reupItemAt, reupKaraokeAss, reupShotPieces, reupSubtitleAss, reupSubtitleLines, reupSubtitleTimes } from "../../lib/reupSpeech.js";
import { ReupFootageLedger, reupSectionSeconds } from "../../lib/reupTimeline.js";
import type { ReupJob, ReupJobSettings, ReupOutputResult, ReupOutputScript, ReupSegment, ReupSettings, ReupShot, ReupWord } from "../../types/reup.js";
import { reupFfmpeg, reupFilterValue, reupFont, reupFontFor } from "./reupFfmpeg.js";
import { reupFileUrl, reupJobDir } from "./reupJobStore.js";
import { MOTION_MUSIC } from "../../../../constants/motionMusic.js";
import { buildMotionMusic } from "../../../motion/server/services/motionMusicService.js";
type Log = (text: string, level?: "info" | "warn" | "error") => void;
/** One input of a section: a stretch of the source video, a clip, or a photo held for `len` seconds. */
interface Piece {
  file: string;
  seek: number;
  len: number;
  width: number;
  height: number;
  hasAudio: boolean;
  still: boolean;
  /** Clip shorter than its slot: hold its last frame. */
  hold?: number;
  label?: { text: string; kind: "caption" | "stage" };
  focusX?: number;
  index: number;
}
const even = (n: number): number => Math.round(n / 2) * 2;
export const reupFrameSize = (settings: Pick<ReupSettings, "aspect" | "quality">): [number, number] => {
  const [w, h] = REUP_BUILD.QUALITY[settings.quality].size;
  return settings.aspect === "9:16" ? [even(h), even(w)] : [even(w), even(h)];
};
/** Logo handling on the raw source frame: a slight centre zoom, or a soft patch over the chosen corner. */
const logoFilter = (s: ReupJobSettings, p: Piece): string => {
  if (p.still || s.logo === "off") return "";
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
const draw = (font: string, file: string, size: number, x: string, y: string, color: string, extra = ""): string => `drawtext=fontfile='${reupFilterValue(font)}':textfile='${reupFilterValue(file)}':fontsize=${size}:fontcolor=${color}:x=${x}:y=${y}${extra}`;
/**
 * Picture of input i fitted to the frame, ending at [v{i}]: same-shaped footage scales; other shapes get a blurred
 * backdrop, or a crop around the subject (vertical crop mode); photos drift in or out (Ken Burns).
 */
const pictureFilter = (i: number, s: ReupJobSettings, p: Piece, w: number, h: number, font?: string, labelFile?: string): string => {
  const head = `[${i}:v]${logoFilter(s, p)}`;
  const label = labelFile && font && p.label ? `,${p.label.kind === "stage" ? draw(font, labelFile, Math.round(h * 0.07), "36", "36", "0xFFD400", ":box=1:boxcolor=black@0.6:boxborderw=14") : draw(font, labelFile, Math.round(Math.min(w, h) * 0.042), "40", `h-th-${Math.round(h * 0.06)}`, "white", ":box=1:boxcolor=black@0.5:boxborderw=10")}` : "";
  const hold = p.hold ? `,tpad=stop_mode=clone:stop_duration=${p.hold.toFixed(3)}` : "";
  const tail = `${hold},fps=${s.fps},format=yuv420p,setsar=1${label},trim=duration=${p.len.toFixed(3)},setpts=PTS-STARTPTS[v${i}]`;
  const same = Math.abs(p.width / p.height - w / h) < 0.02;
  const close = Math.abs(p.width / p.height - w / h) / (w / h) < 0.25;
  if (p.still && s.kenBurns) {
    const W = even(w * 2), H = even(h * 2);
    const frames = Math.max(1, Math.round(p.len * s.fps));
    const z = REUP_OVERLAY.KEN_BURNS_ZOOM;
    const zoom = p.index % 2 ? `${1 + z}-${z}*on/${frames}` : `1+${z}*on/${frames}`;
    const base = close ? `scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H}` : `split=2[kb${i}][kf${i}];[kb${i}]scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},boxblur=30:2[kbb${i}];[kf${i}]scale=${W}:${H}:force_original_aspect_ratio=decrease[kff${i}];[kbb${i}][kff${i}]overlay=(W-w)/2:(H-h)/2`;
    return `${head}${base},zoompan=z='${zoom}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=${w}x${h}:fps=${s.fps}${tail}`;
  }
  if (same) return `${head}scale=${w}:${h}${tail}`;
  if (s.vertical === "crop" && h > w && !p.still) {
    const fx = _.clamp(p.focusX ?? 0.5, 0, 1).toFixed(3);
    return `${head}scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h}:(iw-ow)*${fx}:(ih-oh)/2${tail}`;
  }
  if (close && p.still) return `${head}scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h}${tail}`;
  return `${head}split=2[bg${i}][fg${i}];[bg${i}]scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h},boxblur=20:2[bb${i}];[fg${i}]scale=${w}:${h}:force_original_aspect_ratio=decrease[ff${i}];[bb${i}][ff${i}]overlay=(W-w)/2:(H-h)/2${tail}`;
};
const inputArgs = (p: Piece, fps: number): string[] => (p.still ? ["-loop", "1", "-framerate", String(fps), "-t", (p.len + 0.2).toFixed(3), "-i", p.file] : ["-ss", p.seek.toFixed(3), "-t", (p.len - (p.hold || 0) + 0.2).toFixed(3), "-i", p.file]);
interface SectionOptions {
  title?: { lines: string[]; kind: "hook" | "fixed" };
  chapter?: { text: string; seconds: number; from: Piece };
}
/** Render one section: a chapter card (photo reports), its pieces, labels and the on-screen title. */
const renderSection = async (job: ReupJob, pieces: Piece[], file: string, opts: SectionOptions, lang: string, signal?: AbortSignal): Promise<void> => {
  const s = job.settings;
  const font = reupFont(lang);
  const [w, h] = reupFrameSize(s);
  const all: Piece[] = opts.chapter ? [{ ...opts.chapter.from, len: opts.chapter.seconds, hold: undefined, label: undefined }, ...pieces] : pieces;
  const inputs: string[] = [];
  const graph: string[] = [];
  all.forEach((p, i) => {
    inputs.push(...inputArgs(p, s.fps));
    graph.push(pictureFilter(i, s, p, w, h, font, p.label && font ? textFile(`${file}.l${i}.txt`, p.label.text) : undefined));
    const len = p.len.toFixed(3);
    graph.push(p.hasAudio && !p.still ? `[${i}:a]aresample=${REUP_BUILD.AUDIO_RATE},aformat=channel_layouts=stereo,apad,atrim=duration=${len},asetpts=PTS-STARTPTS[a${i}]` : `anullsrc=r=${REUP_BUILD.AUDIO_RATE}:cl=stereo,atrim=duration=${len}[a${i}]`);
  });
  if (opts.chapter && font) {
    const t = textFile(`${file}.chapter.txt`, opts.chapter.text.toUpperCase());
    graph[0] = graph[0].replace(/\[v0\]$/, `,eq=brightness=-0.22:saturation=0.7,${draw(font, t, Math.round(Math.min(w, h) * 0.085), "(w-text_w)/2", "(h-text_h)/2", "white", ":borderw=4:bordercolor=black")}[v0]`);
  }
  graph.push(`${all.map((_p, i) => `[v${i}][a${i}]`).join("")}concat=n=${all.length}:v=1:a=1[vc][ac]`);
  let video = "vc";
  if (opts.title?.lines.length && font) {
    const size = Math.round(Math.min(w, h) * (opts.title.kind === "fixed" ? 0.075 : 0.085));
    const top = Math.round(h * (opts.title.kind === "fixed" ? 0.1 : 0.14));
    const enable = opts.title.kind === "hook" ? `:enable='lt(t,${REUP_BUILD.TITLE_HOOK_SECONDS})'` : "";
    const box = opts.title.kind === "fixed" ? ":box=1:boxcolor=black@0.55:boxborderw=16" : ":borderw=5:bordercolor=black";
    const draws = opts.title.lines.map((line, i) => draw(font, textFile(`${file}.t${i}.txt`, line), size, "(w-text_w)/2", String(top + Math.round(i * size * 1.3)), i ? "0xFFD400" : "white", box + enable));
    graph.push(`[vc]${draws.join(",")}[vt]`);
    video = "vt";
  }
  if (s.logoFile && fs.existsSync(s.logoFile)) {
    inputs.push("-i", s.logoFile);
    graph.push(`[${all.length}:v]scale=-1:${Math.round(h * 0.09)}[lg]`, `[${video}][lg]overlay=W-w-${Math.round(w * 0.025)}:${Math.round(h * 0.03)}[vl]`);
    video = "vl";
  }
  await reupFfmpeg(["-y", ...inputs, "-filter_complex", graph.join(";"), "-map", `[${video}]`, "-map", "[ac]", "-c:v", "libx264", "-preset", REUP_BUILD.PRESET, "-crf", String(REUP_BUILD.QUALITY[s.quality].crf), "-pix_fmt", "yuv420p", "-r", String(s.fps), "-c:a", "aac", "-b:a", REUP_BUILD.AUDIO_BITRATE, "-ar", String(REUP_BUILD.AUDIO_RATE), file], { signal });
};
const lanes = async <T>(items: T[], count: number, run: (item: T, index: number) => Promise<void>): Promise<void> => {
  let next = 0;
  await Promise.all(
    _.range(Math.min(count, items.length)).map(async () => {
      while (next < items.length) {
        const index = next++;
        await run(items[index], index);
      }
    }),
  );
};
const safeName = (text: string): string => text.replace(/\.[^.]+$/, "").replace(/[^\p{L}\p{N}_-]+/gu, "_").slice(0, 40) || "video";
/** Scene of the map a moment of the source belongs to. */
const segmentAt = (segments: ReupSegment[], t: number): ReupSegment | undefined => segments.find((g) => t >= g.start && t < g.end);
/** Pieces of a planned shot: the source video, or the folder items it spans; with the scene's caption or before/after stage. */
const piecesOf = (job: ReupJob, shot: ReupShot, index: number): Piece[] => {
  const s = job.settings;
  const seg = segmentAt(job.sceneMap?.segments || [], (shot.start + shot.end) / 2);
  const stage = s.beforeAfter && seg ? (seg.tags.includes("after") ? "AFTER" : seg.tags.includes("before") ? "BEFORE" : "") : "";
  const label: Piece["label"] = stage ? { text: stage, kind: "stage" } : s.captions && seg?.caption ? { text: seg.caption, kind: "caption" } : undefined;
  if (job.source.kind !== "folder") return [{ file: job.source.path, seek: shot.start, len: shot.end - shot.start, width: job.source.width, height: job.source.height, hasAudio: job.source.hasAudio, still: false, label, focusX: seg?.focusX, index }];
  return reupShotPieces(job.source.items || [], shot).map((x, k) => ({ file: x.item.path, seek: x.from, len: x.to - x.from, width: x.item.width, height: x.item.height, hasAudio: x.item.hasAudio, still: x.item.type === "photo", label, focusX: seg?.focusX, index: index + k }));
};
/** A photo-report cue: its picture held (or its clip played, then held) for exactly `seconds`. */
const cuePiece = (job: ReupJob, segmentId: string, seconds: number, index: number): Piece | undefined => {
  const seg = job.sceneMap?.segments.find((g) => g.id === segmentId);
  const item = seg && reupItemAt(job.source.items || [], (seg.start + seg.end) / 2);
  if (!seg || !item) return undefined;
  const own = item.end - item.start;
  const label: Piece["label"] = job.settings.captions && seg.caption ? { text: seg.caption, kind: "caption" } : undefined;
  return { file: item.path, seek: 0, len: seconds, width: item.width, height: item.height, hasAudio: item.hasAudio, still: item.type === "photo", hold: item.type === "clip" && own < seconds ? seconds - own : undefined, label, focusX: seg.focusX, index };
};
interface PlannedSection {
  pieces: Piece[];
  seconds: number;
  card: number;
  chapter?: string;
}
/** Final pass for real-talk clips: karaoke subtitles, POV hook, callouts, closing call to action, camera frame. */
const talkOverlays = (job: ReupJob, output: ReupOutputScript, planned: PlannedSection[], dir: string, total: number): string[] => {
  const s = job.settings;
  const [w, h] = reupFrameSize(s);
  const fontInfo = reupFontFor(output.lang || s.language);
  if (!fontInfo) return [];
  const fontFile = fontInfo.file;
  const filters: string[] = [];
  const words: (ReupWord & { cut?: boolean })[] = [];
  let at = 0;
  output.sections.forEach((sec, i) => {
    const shot = sec.shots[0];
    const inside = (job.transcript?.words || []).filter((word) => shot && word.s >= shot.start - 0.01 && word.e <= shot.end + 0.01);
    inside.forEach((word, k) => words.push({ w: word.w, s: at + word.s - shot.start, e: at + word.e - shot.start, ...(k === 0 ? { cut: true } : {}) }));
    at += planned[i].seconds;
  });
  if (s.subtitles && words.length) {
    fs.writeFileSync(path.join(dir, "karaoke.ass"), reupKaraokeAss(words, { width: w, height: h, font: fontInfo.family, color: s.brandColor, perLine: REUP_OVERLAY.KARAOKE_WORDS, gap: REUP_OVERLAY.KARAOKE_GAP }), "utf8");
    filters.push(`subtitles=karaoke.ass:fontsdir='${reupFilterValue(path.dirname(fontFile))}'`);
  }
  if (s.viewfinder) {
    const m = Math.round(Math.min(w, h) * 0.05), L = Math.round(Math.min(w, h) * 0.1), t = Math.max(4, Math.round(Math.min(w, h) * 0.008));
    for (const [x, y] of [[m, m], [w - m - L, m], [m, h - m - t], [w - m - L, h - m - t]]) filters.push(`drawbox=x=${x}:y=${y}:w=${L}:h=${t}:color=white@0.9:t=fill`);
    for (const [x, y] of [[m, m], [w - m - t, m], [m, h - m - L], [w - m - t, h - m - L]]) filters.push(`drawbox=x=${x}:y=${y}:w=${t}:h=${L}:color=white@0.9:t=fill`);
    filters.push(`drawbox=x=${m * 2}:y=${m * 2}:w=${t * 4}:h=${t * 4}:color=red@0.9:t=fill:enable='lt(mod(t,1),0.6)'`);
  }
  const size = Math.round(Math.min(w, h) * 0.075);
  output.title.forEach((line, i) => filters.push(draw(fontFile, textFile(path.join(dir, `hook${i}.txt`), line), size, "(w-text_w)/2", String(Math.round(h * 0.16 + i * size * 1.3)), i ? s.brandColor.replace("#", "0x") : "white", `:box=1:boxcolor=black@0.55:boxborderw=14:enable='lt(t,3.5)'`)));
  let start = 0;
  output.sections.forEach((sec, i) => {
    if (sec.callout) filters.push(draw(fontFile, textFile(path.join(dir, `call${i}.txt`), sec.callout.toUpperCase()), Math.round(size * 0.8), "(w-text_w)/2", String(Math.round(h * 0.34)), "white", `:box=1:boxcolor=${s.brandColor.replace("#", "0x")}@0.92:boxborderw=18:enable='between(t,${(start + 0.15).toFixed(2)},${(start + 0.15 + REUP_OVERLAY.CALLOUT_SECONDS).toFixed(2)})'`));
    start += planned[i].seconds;
  });
  const cta = [output.cta || s.cta, s.hotline, s.brandName].filter(Boolean);
  if (cta.length) {
    const from = Math.max(0, total - REUP_OVERLAY.CTA_SECONDS).toFixed(2);
    filters.push(`drawbox=x=0:y=${Math.round(h * 0.42)}:w=${w}:h=${Math.round(h * 0.22)}:color=${s.brandColor.replace("#", "0x")}@0.9:t=fill:enable='gte(t,${from})'`);
    cta.forEach((line, i) => filters.push(draw(fontFile, textFile(path.join(dir, `cta${i}.txt`), line), Math.round(size * (i ? 0.75 : 0.95)), "(w-text_w)/2", String(Math.round(h * 0.45 + i * size * 1.2)), "white", `:enable='gte(t,${from})'`)));
  }
  return filters;
};
/** Narration subtitles over the whole output: each section's lines shifted to where its voice starts (after a chapter card). */
const narrationSubtitles = (job: ReupJob, output: ReupOutputScript, planned: PlannedSection[], dir: string): string => {
  const s = job.settings;
  const [w, h] = reupFrameSize(s);
  const font = reupFontFor(output.lang || s.language);
  if (!font) return "";
  let at = 0;
  const lines = output.sections.flatMap((sec, i) => {
    const voice = job.voices![sec.id];
    const from = at + planned[i].card;
    const until = at + planned[i].seconds;
    at = until;
    const subs = voice.subs || reupSubtitleTimes(reupSubtitleLines(sec.text, REUP_OVERLAY.SUB_WORDS, REUP_OVERLAY.SUB_CHARS), [], voice.seconds);
    return subs.map((line) => ({ text: line.text, start: from + line.start, end: Math.min(until, from + line.end) }));
  });
  if (!lines.length) return "";
  fs.writeFileSync(path.join(dir, "subs.ass"), reupSubtitleAss(lines, { width: w, height: h, font: font.family, ...(s.captions ? { lift: REUP_OVERLAY.SUB_ABOVE_CAPTION } : {}) }), "utf8");
  return `subtitles=subs.ass:fontsdir='${reupFilterValue(path.dirname(font.file))}'`;
};
/**
 * Step 5 — build every output. Narrated sections are timed by their voice (photo-report cues by the voice's own
 * words), long videos get natural-sound tails up to the target, shots come from the script then unused footage and
 * nothing repeats within a language; real-talk clips keep the speaker's words (karaoke subtitles), narrated outputs get
 * line subtitles when subtitles are on.
 */
export const buildReupJob = async (job: ReupJob, log: Log, progress: (p: number) => void, signal?: AbortSignal): Promise<ReupOutputResult[]> => {
  const s = job.settings;
  const preset = reupPreset(job.preset);
  const map = job.sceneMap!;
  const ledgers = new Map<string, ReupFootageLedger>();
  const ledger = (lang: string) => ledgers.get(lang) || ledgers.set(lang, new ReupFootageLedger({ duration: job.source.duration, bad: job.bad, minShot: REUP_BUILD.MIN_SHOT, maxShot: REUP_BUILD.MAX_SHOT, hookCut: s.hookCutSeconds })).get(lang)!;
  log(s.musicMood === MOTION_MUSIC.OFF ? REUP_LOG.MUSIC_NONE : REUP_LOG.MUSIC((MOTION_MUSIC.UI.vi.MOODS as Record<string, string>)[s.musicMood] || s.musicMood));
  const outputs = job.script!.outputs;
  const results: ReupOutputResult[] = [];
  const [w, h] = reupFrameSize(s);
  for (const [oi, output] of outputs.entries()) {
    const dir = reupJobDir(job.id, REUP_DIR.SECTIONS, output.id);
    let planned: PlannedSection[];
    if (output.speech) {
      planned = output.sections.map((sec, i) => ({ pieces: piecesOf(job, sec.shots[0], i), seconds: sec.shots[0].end - sec.shots[0].start, card: 0 }));
    } else {
      const voices = await Promise.all(output.sections.map(async (sec) => await probeMediaDurationSeconds(job.voices![sec.id].file)));
      const fill = s.fillUnused && preset.source === "video";
      const target = preset.kind === "long" && preset.source === "video" ? s.targetSeconds + REUP_BUILD.LONG_MARGIN : 0;
      const timing = reupSectionSeconds(voices, output.sections.map((x) => x.role), s.pauseSeconds, target, REUP_BUILD.TAIL_MAX, fill);
      if (target && timing.short > 1) log(REUP_LOG.SHORT_TARGET(timing.short), "warn");
      planned = output.sections.map((sec, i) => {
        const card = s.chapters && sec.chapter ? REUP_OVERLAY.CHAPTER_SECONDS : 0;
        if (sec.cues?.length) {
          const starts = job.voices![sec.id].cues || sec.cues.map((_c, k) => (k * voices[i]) / sec.cues!.length);
          const pieces = _.compact(sec.cues.map((cue, k) => cuePiece(job, cue.segment, Math.max(0.6, (k + 1 < sec.cues!.length ? starts[k + 1] : timing.seconds[i]) - (k ? starts[k] : 0)), i * 100 + k)));
          return { pieces, seconds: card + _.sumBy(pieces, "len"), card, chapter: card ? sec.chapter : undefined };
        }
        const plan = ledger(output.lang || s.language).plan(sec.shots, timing.seconds[i], sec.role === "hook", map.segments, fill);
        if (plan.filled > 1) log(REUP_LOG.FILLED(i + 1, plan.filled));
        if (plan.repeated) log(REUP_LOG.REPEATED(i + 1), "warn");
        const pieces = plan.shots.flatMap((shot, k) => piecesOf(job, shot, i * 100 + k));
        return { pieces, seconds: card + _.sumBy(pieces, "len"), card, chapter: card ? sec.chapter : undefined };
      });
    }
    const total = _.sumBy(planned, "seconds");
    log(REUP_LOG.BUILD_OUTPUT(oi + 1, outputs.length, total));
    const jobs = planned.flatMap((plan, i) =>
      _.chunk(plan.pieces, REUP_BUILD.SECTION_SHOTS).map((pieces, k) => {
        const role = output.sections[i].role;
        const title = output.speech ? undefined : s.titleOverlay === "fixed" ? { lines: output.title, kind: "fixed" as const } : s.titleOverlay === "hook" && i === 0 && k === 0 && role === "hook" ? { lines: output.title, kind: "hook" as const } : undefined;
        const chapter = k === 0 && plan.chapter && pieces[0] ? { text: plan.chapter, seconds: plan.card, from: pieces[0] } : undefined;
        return { pieces, opts: { title, chapter }, file: path.join(dir, `part_${String(i + 1).padStart(2, "0")}_${k + 1}.mp4`) };
      }),
    );
    let finished = 0;
    await lanes(jobs, REUP_BUILD.LANES, async (piece) => {
      await renderSection(job, piece.pieces, piece.file, piece.opts, output.lang || s.language, signal);
      finished++;
      log(REUP_LOG.BUILD_SECTION(finished, jobs.length));
      progress((oi + (finished / jobs.length) * 0.85) / outputs.length);
    });
    const list = path.join(dir, "parts.txt");
    fs.writeFileSync(list, jobs.map((j) => `file '${j.file.replace(/\\/g, "/").replace(/'/g, "'\\''")}'`).join("\n"), "utf8");
    const joined = path.join(dir, "joined.mp4");
    await reupFfmpeg(["-y", "-f", "concat", "-safe", "0", "-i", list, "-c", "copy", joined], { signal });
    log(REUP_LOG.BUILD_MIX);
    const name = `${safeName(job.source.name)}_${job.preset}_${output.id}.mp4`;
    const final = path.join(reupJobDir(job.id, REUP_DIR.OUT), name);
    const loud = `loudnorm=I=${s.lufs}:TP=${REUP_BUILD.TRUE_PEAK}:LRA=${REUP_BUILD.LRA}`;
    // Video Motion's generated score in the chosen mood, as long as this output.
    const music = s.musicMood === MOTION_MUSIC.OFF ? undefined : await buildMotionMusic(total, [{ start: 0, mood: s.musicMood }], [], [...job.id + output.id].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7));
    const musicArgs = music ? ["-i", music] : [];
    const musicIn = (index: number) => `[${index}:a]aresample=${REUP_BUILD.AUDIO_RATE},aformat=channel_layouts=stereo,volume=${REUP_BUILD.MUSIC_VOLUME},atrim=duration=${total.toFixed(3)}[mus]`;
    const graph: string[] = [];
    let videoArgs = ["-map", "0:v", "-c:v", "copy"];
    if (output.speech) {
      // The speaker's own voice leads; music sits under it.
      if (musicArgs.length) graph.push(musicIn(1), `[0:a]asplit=2[sk][sm]`, `[mus][sk]sidechaincompress=threshold=0.03:ratio=8:attack=20:release=350[duck]`, `[sm][duck]amix=inputs=2:duration=first:normalize=0,${loud}[out]`);
      else graph.push(`[0:a]${loud}[out]`);
      const overlays = talkOverlays(job, output, planned, dir, total);
      if (overlays.length) {
        graph.push(`[0:v]${overlays.join(",")}[vo]`);
        videoArgs = ["-map", "[vo]", "-c:v", "libx264", "-preset", REUP_BUILD.PRESET, "-crf", String(REUP_BUILD.QUALITY[s.quality].crf), "-pix_fmt", "yuv420p"];
      }
      await reupFfmpeg(["-y", "-i", joined, ...musicArgs, "-filter_complex", graph.join(";"), ...videoArgs, "-map", "[out]", "-c:a", "aac", "-b:a", REUP_BUILD.AUDIO_BITRATE, "-ar", String(REUP_BUILD.AUDIO_RATE), "-t", total.toFixed(3), "-movflags", "+faststart", final], { signal, cwd: dir });
    } else {
      const voiceFile = path.join(dir, "voice.wav");
      await reupFfmpeg(["-y", ...output.sections.flatMap((sec) => ["-i", job.voices![sec.id].file]), "-filter_complex", `${output.sections.map((_x, i) => `[${i}:a]aresample=${REUP_BUILD.AUDIO_RATE},aformat=channel_layouts=stereo${planned[i].card ? `,adelay=${Math.round(planned[i].card * 1000)}:all=1` : ""},apad=whole_dur=${planned[i].seconds.toFixed(3)},atrim=duration=${planned[i].seconds.toFixed(3)}[s${i}]`).join(";")};${output.sections.map((_x, i) => `[s${i}]`).join("")}concat=n=${output.sections.length}:v=0:a=1[voice]`, "-map", "[voice]", "-c:a", "pcm_s16le", voiceFile], { signal });
      const natural = REUP_BUILD.NATURAL_LEVEL[s.natural] ?? 0;
      const bed: string[] = [];
      if (natural > 0) {
        graph.push(`[0:a]volume=${natural}[nat]`);
        bed.push("[nat]");
      }
      if (musicArgs.length) {
        graph.push(musicIn(2));
        bed.push("[mus]");
      }
      if (bed.length) {
        graph.push(bed.length > 1 ? `${bed.join("")}amix=inputs=2:duration=first:normalize=0[bed]` : `${bed[0]}anull[bed]`);
        graph.push(`[1:a]asplit=2[vk][vm]`, `[bed][vk]sidechaincompress=threshold=0.03:ratio=8:attack=20:release=350[duck]`);
        graph.push(`[duck][vm]amix=inputs=2:duration=first:normalize=0,${loud}[out]`);
      } else graph.push(`[1:a]${loud}[out]`);
      const subtitles = s.subtitles && narrationSubtitles(job, output, planned, dir);
      if (subtitles) {
        graph.push(`[0:v]${subtitles}[vo]`);
        videoArgs = ["-map", "[vo]", "-c:v", "libx264", "-preset", REUP_BUILD.PRESET, "-crf", String(REUP_BUILD.QUALITY[s.quality].crf), "-pix_fmt", "yuv420p"];
      }
      await reupFfmpeg(["-y", "-i", joined, "-i", voiceFile, ...musicArgs, "-filter_complex", graph.join(";"), ...videoArgs, "-map", "[out]", "-c:a", "aac", "-b:a", REUP_BUILD.AUDIO_BITRATE, "-ar", String(REUP_BUILD.AUDIO_RATE), "-t", total.toFixed(3), "-movflags", "+faststart", final], { signal, cwd: dir });
    }
    const duration = await probeMediaDurationSeconds(final);
    let at = 0;
    const chapters = planned.flatMap((plan) => {
      const mark = plan.chapter ? [{ t: _.round(at, 1), title: plan.chapter }] : [];
      at += plan.seconds;
      return mark;
    });
    results.push({ id: output.id, file: final, url: reupFileUrl(final), duration, width: w, height: h, ...(chapters.length ? { chapters } : {}) });
    log(REUP_LOG.BUILD_DONE(name, duration));
    progress((oi + 1) / outputs.length);
  }
  return results;
};
