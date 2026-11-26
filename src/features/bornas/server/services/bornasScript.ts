import fs from "fs";
import os from "os";
import path from "path";
import _ from "lodash";
import { runMotionAi } from "../../../motion/server/services/motionStoryService.js";
import { reupExec } from "../../../reup/server/services/reupAiService.js";
import { BORNAS_LIMITS } from "../../constants/bornasConfig.js";
import { BORNAS_ARTIFACT, BORNAS_PROMPT } from "../../constants/bornasPrompts.js";
import { BORNAS_ERROR, BORNAS_LOG } from "../../constants/bornasServerText.js";
import type { BornasJob, BornasLine, BornasScript } from "../../types/bornas.js";
import { listBornasJobs } from "./bornasStore.js";
import { bornasKit, readJson, runKitPy, slug } from "./bornasTools.js";
type Log = (text: string, level?: "info" | "warn" | "error") => void;
const KINDS = ["tag", "plate", "label", "none"] as const;
const words = (text: string): number => text.split(/\s+/).filter(Boolean).length;
export const cleanBornasLine = (raw: unknown): BornasLine | undefined => {
  const l = (raw || {}) as Record<string, unknown>;
  const text = String(l.text || "")
    .replace(/\s+/g, " ")
    .trim();
  if (!text) return undefined;
  const kind = KINDS.includes(l.kind as (typeof KINDS)[number]) ? (l.kind as BornasLine["kind"]) : "none";
  const screen = String(l.screen || "").trim();
  return { text, screen, sub: String(l.sub || "").trim(), kind: screen ? kind : "none", idea: String(l.idea || "").trim(), pause: l.pause === true };
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
  const lines = _.compact((Array.isArray(s.lines) ? s.lines : []).map(cleanBornasLine));
  const title = String(s.title || "").trim();
  return title && lines.length >= 4 ? { title, hook: String(s.hook || "").trim(), hero: String(s.hero || "").trim(), series: seriesTag(String(s.series || "").trim() || title), lines } : undefined;
};
type Profile = { sentence_seconds: { median: number; p90: number }; fragment_share: number; question_share: number; second_person_per_100: number };
const SAMPLE_PROFILE = "ghost_profile.json";
const rhythmOf = (p: Profile, rate: number): string =>
  `Rhythm of the sample (measured, follow it): one sentence per line; median sentence about ${Math.max(4, Math.round(p.sentence_seconds.median * rate))} words, never more than ${Math.round(p.sentence_seconds.p90 * rate)} words; about ${Math.round(p.fragment_share * 100)}% of the lines are fragments of 1–4 words (never more than 3 fragments in a row); about ${Math.max(1, Math.round(p.question_share * 100))}% are questions answered by the next line; the listener ("bạn"/"you") about ${Math.round(p.second_person_per_100)} times per 100 words; present tense.`;
const narrationIssues = async (script: BornasScript, job: BornasJob, rate: number, log: Log, signal?: AbortSignal): Promise<string[]> => {
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
const voiceRate = (job: BornasJob): number => {
  const done = listBornasJobs(60)
    .filter((p) => p.channel.voiceChannel === job.channel.voiceChannel)
    .flatMap((p) => p.videos.flatMap((v) => (v.seconds && p.scripts?.[v.index] ? [[_.sumBy(p.scripts[v.index].lines, (l) => words(l.text)), v.seconds]] : [])));
  const [w, s] = done.reduce(([a, b], [c, d]) => [a + c, b + d], [0, 0]);
  return s > 20 ? w / s : BORNAS_LIMITS.WORDS_PER_SECOND;
};
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
  const avoid = _.uniq(past.map((s) => `${s.hero}: ${s.title}`)).slice(0, 40);
  const pastHeroes = _.uniq(past.map((s) => s.hero));
  log(BORNAS_LOG.SCRIPTS(job.channel.count));
  const exec = reupExec(job.ai.mainAi);
  const rate = voiceRate(job);
  const rhythm = rhythmOf(readJson<Profile>(bornasKit(SAMPLE_PROFILE), { sentence_seconds: { median: 2.24, p90: 4.86 }, fragment_share: 0.19, question_share: 0.04, second_person_per_100: 9.5 }), rate);
  const raw = await runMotionAi(BORNAS_PROMPT.SCRIPTS({ count: job.channel.count, topic: job.channel.topic, language: job.channel.language, seconds: job.channel.seconds, rate, rhythm, analysis: job.analysis!, avoid, channel: job.channel.name }), BORNAS_ARTIFACT.SCRIPTS, exec, signal, (line) => line && log(line));
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
  const max = Math.round(job.channel.seconds * rate * 1.1);
  const out: BornasScript[] = [];
  for (let script of scripts) {
    const have = _.sumBy(script.lines, (l) => words(l.text));
    if (have > max) {
      log(BORNAS_LOG.SCRIPT_TRIM(have, max), "warn");
      script = cleanBornasScript(await runMotionAi(BORNAS_PROMPT.TRIM(script, have, Math.round(max * 0.9)), BORNAS_ARTIFACT.TRIM, exec, signal, (line) => line && log(line)).catch(() => undefined)) || script;
    }
    const issues = await narrationIssues(script, job, rate, log, signal);
    if (issues.length) {
      log(BORNAS_LOG.SCRIPT_STYLE(issues), "warn");
      script = cleanBornasScript(await runMotionAi(BORNAS_PROMPT.STYLE(script, issues, rhythm), BORNAS_ARTIFACT.STYLE, exec, signal, (line) => line && log(line)).catch(() => undefined)) || script;
      const left = await narrationIssues(script, job, rate, log, signal);
      log(left.length ? BORNAS_LOG.SCRIPT_STYLE_LEFT(left) : BORNAS_LOG.SCRIPT_STYLE_OK, left.length ? "warn" : "info");
    } else log(BORNAS_LOG.SCRIPT_STYLE_OK);
    const checked = await runMotionAi(BORNAS_PROMPT.FACTS(script), BORNAS_ARTIFACT.FACTS, exec, signal, (line) => line && log(line)).catch(() => undefined);
    const fixedScript = cleanBornasScript(checked);
    const fixed = Array.isArray(checked?.fixed) ? (checked.fixed as unknown[]).length : 0;
    if (fixedScript && fixedScript.lines.length >= script.lines.length - 1) script = fixedScript;
    log(BORNAS_LOG.SCRIPT_FACTS(fixedScript ? fixed : -1));
    out.push(script);
  }
  log(BORNAS_LOG.SCRIPTS_DONE(out.map((s) => s.title)));
  return out;
};
