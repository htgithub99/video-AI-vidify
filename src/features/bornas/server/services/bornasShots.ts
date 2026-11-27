import { createHash } from "crypto";
import fs from "fs";
import _ from "lodash";
import { runMotionAi } from "../../../motion/server/services/motionStoryService.js";
import { reupExec } from "../../../reup/server/services/reupAiService.js";
import { BORNAS_CHAPTER, BORNAS_CHAPTER_LABEL, BORNAS_DIR, BORNAS_LIMITS, BORNAS_ROTATION, bornasChapterLines, bornasTokens, BORNAS_CTA } from "../../constants/bornasConfig.js";
import { BORNAS_ARTIFACT, BORNAS_PROMPT } from "../../constants/bornasPrompts.js";
import { BORNAS_ERROR, BORNAS_LOG } from "../../constants/bornasServerText.js";
import type { BornasBgAnn, BornasSpriteAnn, BornasJob, BornasScript, BornasVideo } from "../../types/bornas.js";
import { readJson, writeJson } from "./bornasTools.js";
import { rotateBornasBeats } from "./bornasRotate.js";
import { bornasVideoDir } from "./bornasVoice.js";
type Log = (text: string, level?: "info" | "warn" | "error") => void;
type Obj = Record<string, unknown>;
export interface BornasCast {
  sprite: string;
  slot: string;
  place: string;
  dir?: "l" | "r";
  move?: "l" | "r";
  crowd?: number;
  swap?: { sprite: string; t: number }[];
}
type At = { t: number };
export interface BornasBeat {
  t0: number;
  kind: "scene" | "bust" | "rew" | "paper" | "montage" | "black" | "chapter";
  chapter?: { label: string; title: string };
  bg?: string;
  cast: BornasCast[];
  subject: number;
  frame: "wide" | "medium" | "close";
  cam: "push" | "pull";
  tag?: At & { text: string; sub: string; corner: "tl" | "tr" };
  plate?: At & { text: string; sub: string; at: number | null };
  label?: At & { text: string; sub: string; cast: number };
  bubble?: At & { text: string; cast: number };
  focusT?: number;
  dark?: number;
  warm?: boolean;
  cool?: boolean;
  smoke?: boolean;
  flash?: number;
  shake?: number;
  bar?: At & { label: string; from: number; to: number };
  paper?: { lines: (At & { text: string; size: string })[]; stamp?: At & { text: string } };
  montage?: { bgs: string[]; caps: string[]; capT: number[] };
  endCard?: At & { text: string; sub: string };
}
export interface BornasPlan {
  total: number;
  series: string;
  look: string;
  art: string;
  words: [number, number, string][][];
  turnT: number;
  recapT: number;
  pxPerM: number;
  ground: Record<string, number>;
  sprites: Record<string, { kind: string; heightM: number; ann?: BornasSpriteAnn }>;
  bgAnn: Record<string, BornasBgAnn>;
  bgDesc: Record<string, string>;
  onsets: number[];
  beats: BornasBeat[];
}
const num = (v: unknown, d: number, lo = -Infinity, hi = Infinity): number => (Number.isFinite(Number(v)) ? _.clamp(Number(v), lo, hi) : d);
const SLOTS = ["l", "cl", "c", "cr", "r"];
const PLACES = ["ground", "wall", "table", "near"];
const KINDS = ["scene", "bust", "rew", "paper", "montage", "black"];
const samePerson = (a: string, b: string): boolean => !a.includes("__") && !b.includes("__") && a.split("_").slice(0, 2).join("_") === b.split("_").slice(0, 2).join("_");
const str = (v: unknown, max = 80): string =>
  String(v ?? "")
    .trim()
    .slice(0, max);
const TEXT_RULE = { DATE: /(\b\d{1,2}\/\d{1,2}\/\d{3,4}\b|\b\d{1,2}\/\d{4}\b|\b1[0-9]{3}\b|\b20\d\d\b|tuổi|\bage\b|years? old)/i, TITLE: /^(chương|chapter|phần|part)\b|:/i, MANY: /\s[·&,]\s|,|&/, QUOTE: /["“”«»]/, TAG_MAX: 26, LABEL_MAX: 22 };
const LIVING = new Set(["person", "animal"]);
const typeTexts = (beat: BornasBeat, kindOf: (cast: number) => string, quote: boolean): void => {
  const moveToPlate = (text: string, sub: string, t: number, at: number | null = null) => {
    if (!beat.plate) beat.plate = { text, sub, t, at };
  };
  if (beat.label) {
    const l = beat.label;
    const bad = TEXT_RULE.TITLE.test(l.text) || TEXT_RULE.MANY.test(l.text) || l.text.length > TEXT_RULE.LABEL_MAX || kindOf(l.cast) !== "person";
    if (TEXT_RULE.DATE.test(l.text) && !beat.tag && l.text.length <= TEXT_RULE.TAG_MAX && !/[a-zà-ỹ]{4,}\s+[a-zà-ỹ]{4,}/i.test(l.text.replace(TEXT_RULE.DATE, ""))) {
      beat.tag = { text: l.text, sub: l.sub, corner: "tl", t: l.t };
      delete beat.label;
    } else if (bad) {
      moveToPlate(l.text, l.sub, l.t);
      delete beat.label;
    }
  }
  if (beat.plate) {
    const p = beat.plate;
    if (quote && (TEXT_RULE.QUOTE.test(p.text) || /[!?]$/.test(p.text.trim()))) {
      const speaker = beat.cast.findIndex((_c, i) => kindOf(i) === "person");
      if (speaker >= 0 && !beat.bubble) {
        beat.bubble = { text: p.text.replace(/["“”«»]/g, "").slice(0, 40), cast: speaker, t: p.t };
        delete beat.plate;
      } else p.at = null;
    } else if (TEXT_RULE.DATE.test(p.text) && p.text.length <= TEXT_RULE.TAG_MAX && !beat.tag && p.at === null) {
      beat.tag = { text: p.text, sub: p.sub, corner: "tl", t: p.t };
      delete beat.plate;
    } else if (p.at !== null && (LIVING.has(kindOf(p.at)) || TEXT_RULE.TITLE.test(p.text))) p.at = null;
  }
  if (beat.tag) beat.tag.corner = "tl";
  if (beat.bubble && !quote) {
    if (!beat.plate) beat.plate = { text: beat.bubble.text, sub: "", at: null, t: beat.bubble.t };
    delete beat.bubble;
  }
  if (beat.bubble) beat.bubble.text = beat.bubble.text.replace(/["“”«»]/g, "");
};
export const planBornasShots = async (job: BornasJob, video: BornasVideo, script: BornasScript, log: Log, signal?: AbortSignal): Promise<BornasPlan> => {
  const words = video.words!;
  const total = video.seconds! + BORNAS_LIMITS.END_HOLD;
  const sprites = new Map(video.sprites!.map((s) => [s.name, s]));
  const bgs = new Map(video.backgrounds!.map((b) => [b.name, b]));
  const busts = video.sprites!.filter((s) => s.kind === "bust").map((s) => s.name);
  const firstBg = video.backgrounds![0]?.name;
  const at = (ref: unknown, fallback: number): number => {
    const r = (ref || {}) as Obj;
    const line = Math.round(num(r.line, -1));
    if (line < 0 || line >= words.length) return fallback;
    const w = words[line];
    return w[_.clamp(Math.round(num(r.word, 0)), 0, Math.max(0, w.length - 1))]?.[0] ?? fallback;
  };
  const raw: Obj[] = [];
  const chunks = _.chunk(
    script.lines.map((_l, i) => i),
    BORNAS_LIMITS.SHOT_LINES,
  );
  for (const [k, idx] of chunks.entries()) {
    log(BORNAS_LOG.SHOTS(idx[0] + 1, _.last(idx)! + 1));
    const prompt = BORNAS_PROMPT.SHOTS({
      lines: idx.map((i) => ({ index: i, text: script.lines[i].text, idea: script.lines[i].idea, screen: script.lines[i].screen, sub: script.lines[i].sub, kind: script.lines[i].kind, words: bornasTokens(script.lines[i].text), start: words[i][0]?.[0] ?? 0, end: _.last(words[i])?.[1] ?? 0 })),
      sprites: video.sprites!.filter((s) => !s.pool),
      backgrounds: video.backgrounds!,
      analysis: job.analysis!,
      first: k === 0,
      last: k === chunks.length - 1,
    });
    const cache = bornasVideoDir(job, video, BORNAS_DIR.SHOTS, `${createHash("sha1").update(prompt).digest("hex").slice(0, 12)}.json`);
    const res = readJson<{ beats?: unknown } | null>(cache, null) ?? (await runMotionAi(prompt, BORNAS_ARTIFACT.SHOTS, reupExec(job.ai.directAi), signal, (line) => line && log(line)));
    if (Array.isArray(res?.beats) && !fs.existsSync(cache)) writeJson(cache, res);
    raw.push(...((Array.isArray(res?.beats) ? res.beats : []) as Obj[]));
  }
  const beats: BornasBeat[] = [];
  const seenT = new Set<number>();
  for (const [n, b] of _.sortBy(raw, (s) => at(s, Infinity)).entries()) {
    const t0 = n === 0 ? 0 : at(b, NaN);
    if (!Number.isFinite(t0) || seenT.has(Math.round(t0 * 100))) {
      log(BORNAS_LOG.SHOT_SKIP(JSON.stringify(b).slice(0, 80)), "warn");
      continue;
    }
    seenT.add(Math.round(t0 * 100));
    const tAt = (ref: unknown) => _.round(Math.max(t0, at(ref, t0)), 3);
    let kind = (KINDS.includes(String(b.kind)) ? String(b.kind) : "scene") as BornasBeat["kind"];
    const cast: BornasCast[] = _.uniqBy(
      ((Array.isArray(b.cast) ? b.cast : []) as Obj[]).filter((c) => sprites.has(String(c.sprite)) && (kind === "bust" || sprites.get(String(c.sprite))!.kind !== "bust")),
      (c) => String(c.sprite),
    )
      .slice(0, 5)
      .map((c) => ({
        sprite: String(c.sprite),
        slot: SLOTS.includes(String(c.slot)) ? String(c.slot) : "c",
        place: PLACES.includes(String(c.place)) ? String(c.place) : "ground",
        ...(c.dir === "l" || c.dir === "r" ? { dir: c.dir as "l" | "r" } : {}),
        ...(c.move === "l" || c.move === "r" ? { move: c.move as "l" | "r" } : {}),
        ...(Number(c.crowd) > 1 ? { crowd: Math.round(num(c.crowd, 2, 2, 6)) } : {}),
        swap: ((Array.isArray(c.swap) ? c.swap : []) as Obj[]).filter((w) => sprites.has(String(w.sprite)) && sprites.get(String(w.sprite))!.kind !== "bust" && samePerson(String(c.sprite), String(w.sprite))).map((w) => ({ sprite: String(w.sprite), t: tAt(w) })),
      }));
    if (kind === "bust" && !busts.includes(cast[0]?.sprite)) {
      const hero = busts[0];
      if (hero) cast.unshift({ sprite: hero, slot: "c", place: "ground", swap: [] });
      else kind = "scene";
    }
    const bg = bgs.has(String(b.bg)) ? String(b.bg) : (_.last(beats)?.bg ?? firstBg);
    if ((kind === "scene" || kind === "bust") && !bg) continue;
    const beat: BornasBeat = { t0: _.round(t0, 3), kind, bg, cast, subject: Math.round(num(b.subject, 0, 0, Math.max(0, cast.length - 1))), frame: b.frame === "close" || b.frame === "medium" ? b.frame : "wide", cam: b.cam === "pull" ? "pull" : "push" };
    const tag = b.tag as Obj | undefined;
    if (tag?.text) beat.tag = { text: str(tag.text), sub: str(tag.sub), corner: tag.corner === "tr" ? "tr" : "tl", t: tAt(tag) };
    const plate = b.plate as Obj | undefined;
    if (plate?.text) beat.plate = { text: str(plate.text), sub: str(plate.sub), at: Number.isInteger(plate.at) && cast[Number(plate.at)] ? Number(plate.at) : null, t: tAt(plate) };
    const label = b.label as Obj | undefined;
    if (label?.text && cast[Number(label.cast)]) beat.label = { text: str(label.text), sub: str(label.sub), cast: Number(label.cast), t: tAt(label) };
    const bubble = b.bubble as Obj | undefined;
    if (bubble?.text && cast[Number(bubble.cast)]) beat.bubble = { text: str(bubble.text, 40), cast: Number(bubble.cast), t: tAt(bubble) };
    if (b.focus) beat.focusT = tAt(b.focus);
    if (Number(b.dark) > 0) beat.dark = num(b.dark, 0, 0, 0.45);
    if (b.warm === true) beat.warm = true;
    if (b.cool === true) beat.cool = true;
    if (b.smoke === true) beat.smoke = true;
    if (b.flash) beat.flash = tAt(b.flash);
    if (b.shake) beat.shake = tAt(b.shake);
    const bar = b.bar as Obj | undefined;
    if (bar?.label) beat.bar = { label: str(bar.label, 30), from: Math.round(num(bar.from, 100, 0, 100)), to: Math.round(num(bar.to, 50, 0, 100)), t: tAt(bar) };
    if (kind === "paper") {
      const p = (b.paper || {}) as Obj;
      const key = (v: string) => v.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");
      const lines = _.uniqBy(
        ((Array.isArray(p.lines) ? p.lines : []) as Obj[]).slice(0, 4).map((l) => ({ text: str(l.text, 60), size: ["h", "n", "l", "s"].includes(String(l.size)) ? String(l.size) : "l", t: tAt(l) })),
        (l) => key(l.text),
      ).filter((l) => l.text);
      const stamp = str((p.stamp as Obj)?.text, 30);
      beat.paper = { lines, ...(stamp && !lines.some((l) => key(l.text) === key(stamp)) ? { stamp: { text: stamp, t: tAt(p.stamp) } } : {}) };
    }
    if (kind === "montage") {
      const m = (b.montage || {}) as Obj;
      const list = ((m.bgs as unknown[]) || [])
        .map(String)
        .filter((x) => bgs.has(x))
        .slice(0, 4);
      const caps = ((m.caps as unknown[]) || []).map((c) => str(c, 30));
      beat.montage = { bgs: list, caps: list.map((_x, i) => caps[i] || ""), capT: list.map((_x, i) => t0 + 0.3 + i * 0.6) };
      if (!list.length) beat.kind = "black";
    }
    typeTexts(beat, (i) => sprites.get(cast[i]?.sprite || "")?.kind || "", script.lines[Number(b.line)]?.kind === "quote");
    if (beat.paper) {
      const key = (v: string) => v.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");
      const shown = new Set([...beat.paper.lines.map((l) => key(l.text)), key(beat.paper.stamp?.text || "")]);
      if (beat.plate && (shown.has(key(beat.plate.text)) || shown.has(key(beat.plate.sub)))) delete beat.plate;
      if (beat.tag && (shown.has(key(beat.tag.text)) || shown.has(key(beat.tag.sub)))) delete beat.tag;
    }
    const end = b.endCard as Obj | undefined;
    if (end) {
      const cta = BORNAS_CTA[job.channel.language] || BORNAS_CTA.en;
      beat.endCard = { text: cta.TITLE, sub: cta.SUB, t: tAt(end) };
    }
    beats.push(beat);
  }
  if (!beats.length) throw new Error(BORNAS_ERROR.NO_SHOTS);
  const label = BORNAS_CHAPTER_LABEL[job.channel.language] || BORNAS_CHAPTER_LABEL.en;
  for (const [n, i] of bornasChapterLines(script.lines, job.channel.seconds).entries()) {
    const start = video.lineStarts?.[i];
    if (start === undefined) continue;
    const t0 = _.round(start - BORNAS_CHAPTER.CARD_SECONDS - BORNAS_CHAPTER.LEAD, 3);
    for (const b of beats) if (b.t0 >= t0 && b.t0 < start) b.t0 = start;
    beats.push({ t0, kind: "chapter", cast: [], subject: 0, frame: "wide", cam: "push", chapter: { label: label(n + 1), title: script.lines[i].chapter! } });
  }
  beats.splice(
    0,
    beats.length,
    ..._.uniqBy(
      _.sortBy(beats, (b) => b.t0),
      (b) => b.t0,
    ),
  );
  const rotated = rotateBornasBeats(beats, new Map(video.sprites!.map((s) => [s.name, s.kind])), total);
  log(BORNAS_LOG.ROTATION(JSON.stringify(rotated.stats)));
  log(BORNAS_LOG.BUSTS(rotated.busts), rotated.busts.share > BORNAS_ROTATION.BUST_WARN ? "warn" : "info");
  const pause = script.lines.findIndex((l) => l.pause);
  const turnT = pause >= 0 && words[pause + 1]?.[0] ? words[pause + 1][0][0] : Math.min(12, total * 0.1);
  const recap = beats.find((b) => b.kind === "montage" && b.t0 > turnT);
  log(BORNAS_LOG.SHOTS_DONE(beats.length));
  return {
    total,
    series: script.series || script.title.toUpperCase().slice(0, BORNAS_LIMITS.SERIES_MAX),
    look: job.channel.topic,
    art: job.channel.topic === "anime" ? "anime" : "",
    words: words.map((w, i) => {
      const toks = bornasTokens(script.lines[i].text);
      return w.map(([s, e], j) => [s, e, toks[j] || ""] as [number, number, string]);
    }),
    turnT,
    recapT: recap ? recap.t0 : total * 0.86,
    pxPerM: BORNAS_LIMITS.PX_PER_M,
    ground: Object.fromEntries(video.backgrounds!.map((b) => [b.name, b.ground])),
    bgDesc: Object.fromEntries(video.backgrounds!.map((b) => [b.name, b.desc || ""])),
    sprites: Object.fromEntries(video.sprites!.map((s) => [s.name, { kind: s.kind, heightM: s.heightM, ...(s.ann ? { ann: s.ann } : {}), ...(s.pool ? { pool: s.pool } : {}) }])),
    bgAnn: Object.fromEntries(video.backgrounds!.filter((b) => b.ann).map((b) => [b.name, b.ann!])),
    onsets: _.sortBy(words.flatMap((w) => w.map((x) => x[0]))),
    beats,
  };
};
