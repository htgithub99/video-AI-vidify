import fs from "fs";
import os from "os";
import path from "path";
import _ from "lodash";
import { runMotionAi } from "../../../motion/server/services/motionStoryService.js";
import { reupExec } from "../../../reup/server/services/reupAiService.js";
import { motionLanguage, motionLanguageRate } from "../../../../lib/motionLanguage.js";
import { BORNAS_CHAPTER, BORNAS_LIMITS, bornasGenre, bornasTokens } from "../../constants/bornasConfig.js";
import { BORNAS_ARTIFACT, BORNAS_PROMPT } from "../../constants/bornasPrompts.js";
import { BORNAS_ERROR, BORNAS_LOG } from "../../constants/bornasServerText.js";
import type { BornasJob, BornasLanguage, BornasLine, BornasScript } from "../../types/bornas.js";
import { listBornasJobs } from "./bornasStore.js";
import { bornasKit, readJson, runKitPy, slug } from "./bornasTools.js";
import { checkScreenYears } from "./bornasNumbers.js";
type Log = (text: string, level?: "info" | "warn" | "error") => void;
const KINDS = ["tag", "plate", "label", "quote", "none"] as const;
const words = (text: string): number => bornasTokens(text).length;
export const cleanBornasLine = (raw: unknown): BornasLine | undefined => {
  const l = (raw || {}) as Record<string, unknown>;
  const text = String(l.text || "")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return undefined;
  const kind = KINDS.includes(l.kind as (typeof KINDS)[number]) ? (l.kind as BornasLine["kind"]) : "none";
  const screen = String(l.screen || "").trim();
  return {
    text,
    screen,
    sub: String(l.sub || "").trim(),
    kind: screen ? kind : "none",
    idea: String(l.idea || "").trim(),
    pause: l.pause === true,
    chapter: String(l.chapter || "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, BORNAS_CHAPTER.TITLE_MAX),
  };
};
const seriesTag = (text: string): string => {
  const cut = text
    .toUpperCase()
    .split(/\s+/)
    .reduce((a, w) => ((a ? `${a} ${w}` : w).length <= BORNAS_LIMITS.SERIES_MAX ? (a ? `${a} ${w}` : w) : a), "");
  return cut || text.toUpperCase().slice(0, BORNAS_LIMITS.SERIES_MAX);
};
export const cleanBornasScript = (raw: unknown): BornasScript | undefined => {
  const s = (raw || {}) as Record<string, unknown>;
  const lines = _.compact((Array.isArray(s.lines) ? s.lines : []).map(cleanBornasLine)).map((l, i) => (i ? l : { ...l, chapter: "" }));
  const title = String(s.title || "").trim();
  return title && lines.length >= 4 ? { title, hook: String(s.hook || "").trim(), hero: String(s.hero || "").trim(), series: seriesTag(String(s.series || "").trim() || title), lines } : undefined;
};
type Profile = { sentence_seconds: { median: number; p90: number }; fragment_share: number; question_share: number; second_person_per_100: number; rate_units_per_s?: number };
const SAMPLE_PROFILE = "ghost_profile.json";
const rhythmOf = (p: Profile, rate: number, language: BornasLanguage): string => {
  const unit = motionLanguage(language).unit.promptName;
  return `Rhythm of the sample (measured, follow it): one sentence per line; median sentence about ${Math.max(4, Math.round(p.sentence_seconds.median * rate))} ${unit}, never more than ${Math.round(p.sentence_seconds.p90 * rate)} ${unit}; about ${Math.round(p.fragment_share * 100)}% of the lines are fragments of at most ${Math.max(4, Math.round(BORNAS_LIMITS.FRAGMENT_SECONDS * rate))} ${unit} (never more than 3 fragments in a row); about ${Math.max(1, Math.round(p.question_share * 100))}% are questions answered by the next line; speak to the listener in second person about ${Math.round((p.second_person_per_100 / 100) * (p.rate_units_per_s || BORNAS_LIMITS.SAMPLE_RATE) * 60)} times per minute; present tense.`;
};
const narrationIssues = async (script: BornasScript, job: BornasJob, rate: number, log: Log, signal?: AbortSignal): Promise<string[]> => {
  if (!BORNAS_LIMITS.STYLE_CHECK_LANGS.includes(job.channel.language)) return [];
  const file = path.join(os.tmpdir(), `bornas_${job.id}_${slug(script.title, 20)}.txt`);
  fs.writeFileSync(file, script.lines.map((l) => l.text).join("\n"));
  const out = await runKitPy("narration_profile.py", ["check", file, "--lang", job.channel.language, "--rate", rate.toFixed(2), "--ref", bornasKit(SAMPLE_PROFILE)], log, signal).catch(() => "");
  fs.rmSync(file, { force: true });
  return (readJsonText(out)?.issues as string[] | undefined) || [];
};
const readJsonText = (text: string): Record<string, unknown> | undefined => {
  try {
    return JSON.parse(text.slice(text.indexOf("{"))) as Record<string, unknown>;
  } catch {
    return undefined;
  }
};
type VoiceModel = { perWord: number; perLine: number };
const voiceModel = (job: BornasJob): VoiceModel => {
  const done = listBornasJobs(60)
    .filter((p) => p.channel.voiceChannel === job.channel.voiceChannel && p.channel.language === job.channel.language)
    .flatMap((p) => p.videos.flatMap((v) => (v.seconds && p.scripts?.[v.index] ? [[_.sumBy(p.scripts[v.index].lines, (l) => words(l.text)), p.scripts[v.index].lines.length, v.seconds]] : [])));
  const fallback = { perWord: 1 / motionLanguageRate(job.channel.language), perLine: BORNAS_LIMITS.LINE_SECONDS };
  if (done.length < 3) return fallback;
  const [ww, wl, ll, wy, ly] = done.reduce(([a, b, c, d, e], [w, l, y]) => [a + w * w, b + w * l, c + l * l, d + w * y, e + l * y], [0, 0, 0, 0, 0]);
  const det = ww * ll - wl * wl;
  const perWord = det ? (wy * ll - ly * wl) / det : 0,
    perLine = det ? (ly * ww - wy * wl) / det : 0;
  return perWord > 0.05 && perLine >= 0 && perLine < 3 ? { perWord, perLine } : fallback;
};
const spokenSeconds = (script: BornasScript, m: VoiceModel): number => m.perWord * _.sumBy(script.lines, (l) => words(l.text)) + m.perLine * script.lines.length;
const heroTokens = (hero: string): string[] =>
  _.deburr(hero.replace(/\([^)]*\)/g, " "))
    .toLowerCase()
    .replace(/đ/g, "d")
    .split(/[^a-z]+/)
    .filter((w) => w.length >= 3 && !(BORNAS_LIMITS.HERO_STOP as readonly string[]).includes(w));
const sameHero = (a: string, b: string): boolean => {
  const x = heroTokens(a),
    y = heroTokens(b);
  if (!x.length || !y.length) return false;
  const shared = x.filter((w) => y.includes(w)).length;
  return shared / Math.min(x.length, y.length) >= BORNAS_LIMITS.HERO_SAME;
};
const repeatedSubjects = (scripts: BornasScript[], past: string[]): number[] => scripts.flatMap((s, i) => (past.some((p) => sameHero(s.hero, p)) || scripts.slice(0, i).some((o) => sameHero(s.hero, o.hero)) ? [i] : []));
export const writeBornasScripts = async (job: BornasJob, log: Log, signal?: AbortSignal): Promise<BornasScript[]> => {
  const past = listBornasJobs(60)
    .filter((p) => p.id !== job.id && p.channel.id === job.channel.id)
    .flatMap((p) => p.scripts || []);
  const avoid = _.uniq([...(job.channel.done || []), ...past.map((s) => `${s.hero}: ${s.title}`)]).slice(0, BORNAS_LIMITS.AVOID_MAX);
  const pastHeroes = _.uniq([...(job.channel.done || []), ...past.map((s) => s.hero)]);
  log(BORNAS_LOG.SCRIPTS(job.channel.count));
  const exec = reupExec(job.ai.writeAi);
  const factExec = reupExec(job.ai.factAi);
  const lightExec = reupExec(job.ai.factAi);
  const model = voiceModel(job);
  const rate = 1 / (model.perWord * (1 + model.perLine / BORNAS_LIMITS.LINE_SPEECH_SECONDS));
  const rhythm = rhythmOf(readJson<Profile>(bornasKit(SAMPLE_PROFILE), { sentence_seconds: { median: 2.24, p90: 4.86 }, fragment_share: 0.19, question_share: 0.04, second_person_per_100: 9.5 }), rate, job.channel.language);
  const raw = await runMotionAi(BORNAS_PROMPT.SCRIPTS({ count: job.channel.count, topic: job.channel.topic, genre: bornasGenre(job.channel.genre), language: job.channel.language, seconds: job.channel.seconds, rate, rhythm, analysis: job.analysis!, avoid, channel: job.channel.name }), BORNAS_ARTIFACT.SCRIPTS, exec, signal, (line) => line && log(line));
  let scripts: BornasScript[] = _.compact((Array.isArray(raw?.scripts) ? (raw.scripts as unknown[]) : []).map(cleanBornasScript)).slice(0, job.channel.count);
  if (!scripts.length) throw new Error(BORNAS_ERROR.NO_SCRIPTS);
  const repeats = repeatedSubjects(scripts, pastHeroes);
  if (repeats.length) {
    log(BORNAS_LOG.SCRIPT_REPEATS(repeats.map((i) => scripts[i].hero)), "warn");
    const fresh = await runMotionAi(BORNAS_PROMPT.REPLACE(scripts, repeats, job.channel.topic, [...pastHeroes, ...scripts.map((s) => s.hero)]), BORNAS_ARTIFACT.REPLACE, exec, signal, (line) => line && log(line)).catch(() => undefined);
    const swaps = _.compact((Array.isArray(fresh?.scripts) ? (fresh.scripts as unknown[]) : []).map(cleanBornasScript));
    scripts = scripts.map((s, i) => (repeats.includes(i) && swaps[repeats.indexOf(i)] ? swaps[repeats.indexOf(i)] : s));
    const left = repeatedSubjects(scripts, pastHeroes);
    if (left.length) log(BORNAS_LOG.SCRIPT_REPEATS(left.map((i) => scripts[i].hero)), "warn");
  }
  const fit = async (script: BornasScript): Promise<BornasScript> => {
    const secs = spokenSeconds(script, model);
    if (secs <= job.channel.seconds * BORNAS_LIMITS.LENGTH_SLACK) return script;
    const have = _.sumBy(script.lines, (l) => words(l.text));
    const target = Math.max(BORNAS_LIMITS.MIN_WORDS, Math.round(((job.channel.seconds - model.perLine * script.lines.length) / model.perWord) * 0.95));
    log(BORNAS_LOG.SCRIPT_TRIM(Math.round(secs), job.channel.seconds, have, target), "warn");
    return cleanBornasScript(await runMotionAi(BORNAS_PROMPT.TRIM(script, have, target), BORNAS_ARTIFACT.TRIM, lightExec, signal, (line) => line && log(line)).catch(() => undefined)) || script;
  };
  const out: BornasScript[] = [];
  for (let script of scripts) {
    script = await fit(script);
    const issues = await narrationIssues(script, job, rate, log, signal);
    if (issues.length) {
      log(BORNAS_LOG.SCRIPT_STYLE(issues), "warn");
      script = cleanBornasScript(await runMotionAi(BORNAS_PROMPT.STYLE(script, issues, rhythm), BORNAS_ARTIFACT.STYLE, exec, signal, (line) => line && log(line)).catch(() => undefined)) || script;
      const left = await narrationIssues(script, job, rate, log, signal);
      log(left.length ? BORNAS_LOG.SCRIPT_STYLE_LEFT(left) : BORNAS_LOG.SCRIPT_STYLE_OK, left.length ? "warn" : "info");
    } else log(BORNAS_LOG.SCRIPT_STYLE_OK);
    const checked = await runMotionAi(BORNAS_PROMPT.FACTS(script, job.channel.topic), BORNAS_ARTIFACT.FACTS, factExec, signal, (line) => line && log(line)).catch(() => undefined);
    const fixedScript = cleanBornasScript(checked);
    const fixed = Array.isArray(checked?.fixed) ? (checked.fixed as unknown[]).length : 0;
    if (fixedScript && fixedScript.lines.length >= script.lines.length - 1) script = fixedScript;
    log(BORNAS_LOG.SCRIPT_FACTS(fixedScript ? fixed : -1));
    script = await fit(script);
    const years = checkScreenYears(script.lines);
    if (years.removed.length) log(BORNAS_LOG.SCREEN_YEARS(years.removed), "warn");
    script = { ...script, lines: years.lines };
    out.push(script);
  }
  log(BORNAS_LOG.SCRIPTS_DONE(out.map((s) => s.title)));
  return out;
};
