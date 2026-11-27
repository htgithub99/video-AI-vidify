import fs from "fs";
import path from "path";
import _ from "lodash";
import { runMotionAi } from "../../../motion/server/services/motionStoryService.js";
import { reupExec } from "../../../reup/server/services/reupAiService.js";
import { MOTION_SEO } from "../../../../constants/motionSeo.js";
import { MOTION_SEO_TEXTS } from "../../../../constants/motionVideoTexts.js";
import { renderSeoOptionText } from "../../../../lib/motionSeo.js";
import { BORNAS_CHAPTER, BORNAS_DIR, BORNAS_SEO, bornasStyleLine, BORNAS_THUMB_TEXT, bornasChapterLines, bornasGenre } from "../../constants/bornasConfig.js";
import { BORNAS_ARTIFACT, BORNAS_PROMPT } from "../../constants/bornasPrompts.js";
import { BORNAS_ERROR, BORNAS_LOG, BORNAS_SEO_TEXT } from "../../constants/bornasServerText.js";
import type { BornasJob, BornasScript, BornasSeo, BornasSeoOption, BornasThumb, BornasVideo } from "../../types/bornas.js";
import { drawBornasSingle } from "./bornasAssets.js";
import type { BornasPlan } from "./bornasShots.js";
import { bornasUrl, listBornasJobs } from "./bornasStore.js";
import { playwrightEnv, readJson, runKitNode, writeJson } from "./bornasTools.js";
import { bornasVideoDir } from "./bornasVoice.js";
type Log = (text: string, level?: "info" | "warn" | "error") => void;
type Obj = Record<string, unknown>;
const text = (v: unknown, max: number): string => {
  const s = String(v ?? "")
    .replace(/\s+/g, " ")
    .trim();
  if (s.length <= max) return s;
  const cut = s.slice(0, max + 1);
  return (cut.includes(" ") ? cut.slice(0, cut.lastIndexOf(" ")) : s.slice(0, max)).trim();
};
const cleanOption = (raw: Obj): BornasSeoOption | undefined => {
  const title = text(raw.title, BORNAS_SEO.TITLE_MAX);
  if (!title) return undefined;
  const list = (v: unknown, max: number) => _.uniq((Array.isArray(v) ? v : []).map((x) => text(x, 60)).filter(Boolean)).slice(0, max);
  return { title, description: String(raw.description || "").trim(), hashtags: list(raw.hashtags, 5).map((h) => (h.startsWith("#") ? h : `#${h}`).replace(/\s+/g, "")), tags: list(raw.tags, 15), seoScore: _.clamp(Math.round(Number(raw.seoScore) || 0), 0, 100) };
};
const chaptersOf = (job: BornasJob, video: BornasVideo, script: BornasScript): BornasSeo["chapters"] => {
  const lines = bornasChapterLines(script.lines, job.channel.seconds);
  if (lines.length < 2 || !video.lineStarts) return [];
  const intro = BORNAS_SEO_TEXT[job.channel.language] || BORNAS_SEO_TEXT.en;
  return [{ id: "c0", t: 0, title: intro.INTRO }, ...lines.map((i, k) => ({ id: `c${k + 1}`, t: Math.max(0, Math.floor((video.lineStarts![i] ?? 0) - BORNAS_CHAPTER.CARD_SECONDS - BORNAS_CHAPTER.LEAD)), title: script.lines[i].chapter! }))];
};
const climaxBg = (plan: BornasPlan | undefined, video: BornasVideo): string | undefined => {
  const beats = plan?.beats || [];
  const story = beats.filter((b) => b.bg && b.t0 >= plan!.turnT && b.t0 < plan!.recapT);
  const loud = story.filter((b) => b.shake !== undefined || b.flash !== undefined || (b.dark || 0) > 0);
  const pick = _.maxBy(Object.entries(_.countBy(loud.length ? loud : story, "bg")), ([, n]) => n)?.[0];
  return pick || video.backgrounds?.[0]?.name;
};
const heroOf = (video: BornasVideo) => {
  const bust = video.sprites?.find((s) => s.kind === "bust")?.name;
  const cast = video.plan?.cast.find((c) => bust?.startsWith(`${c.id}_`)) || video.plan?.cast[0];
  const person = cast?.id.split("_")[0];
  const young = _.minBy(
    (video.plan?.cast || []).filter((c) => c.id.split("_")[0] === person),
    (c) => c.heightM,
  );
  const youngSprite = young && video.sprites?.find((s) => s.name.startsWith(`${young.id}_`) && s.kind === "person")?.name;
  return { bust, cast, youngSprite };
};
const babyOf = async (job: BornasJob, video: BornasVideo, log: Log, signal?: AbortSignal): Promise<string | undefined> => {
  const assets = bornasVideoDir(job, video, BORNAS_DIR.ASSETS);
  const png = path.join(assets, "png", `${BORNAS_SEO.BABY}.png`);
  if (fs.existsSync(png)) return png;
  const { cast, youngSprite } = heroOf(video);
  const fallback = youngSprite ? path.join(assets, "png", `${youngSprite}.png`) : undefined;
  if (!cast) return fallback;
  const ref = path.join(assets, BORNAS_DIR.RAW, `cast_${cast.id}.png`);
  const file = await drawBornasSingle(job, BORNAS_PROMPT.BABY(bornasStyleLine(job.channel.topic), cast.desc), path.join(assets, BORNAS_DIR.RAW, `${BORNAS_SEO.BABY}.png`), BORNAS_SEO.BABY, cast.desc, log, signal, fs.existsSync(ref) ? [ref] : []).catch((error) => {
    log(BORNAS_ERROR.TOOL("thumb_baby", String((error as Error)?.message || error)), "warn");
    return undefined;
  });
  if (!file) return fallback;
  fs.copyFileSync(file, png);
  return png;
};
const drawThumbs = async (job: BornasJob, video: BornasVideo, words: { word: string; name: string }, log: Log, signal?: AbortSignal): Promise<BornasThumb[]> => {
  const dir = bornasVideoDir(job, video, BORNAS_SEO.DIR);
  fs.mkdirSync(dir, { recursive: true });
  const plan = readJson<BornasPlan | undefined>(bornasVideoDir(job, video, "plan.json"), undefined);
  const { bust } = heroOf(video);
  const bustFile = bust ? path.join(bornasVideoDir(job, video, BORNAS_DIR.ASSETS), "png", `${bust}.png`) : undefined;
  const bg = climaxBg(plan, video);
  const bgFile = bg && video.jobDir ? path.join(video.jobDir, `${bg}.png`) : undefined;
  const baby = await babyOf(job, video, log, signal);
  const label = BORNAS_THUMB_TEXT[job.channel.language] || BORNAS_THUMB_TEXT.en;
  const stamp = Date.now();
  const items = [
    { kind: "split" as const, out: path.join(dir, `thumb_1_${stamp}.jpg`), age: label.AGE, word: words.word, baby, bust: bustFile, bg: bgFile && fs.existsSync(bgFile) ? bgFile : undefined },
    { kind: "born" as const, out: path.join(dir, `thumb_2_${stamp}.jpg`), line: label.BORN, name: words.name, bust: bustFile },
  ];
  for (const f of fs.readdirSync(dir).filter((f) => /^thumb_\d_/.test(f))) fs.rmSync(path.join(dir, f), { force: true });
  const spec = path.join(dir, "thumbs.json");
  writeJson(spec, { items });
  await runKitNode("born_thumb.mjs", [spec], playwrightEnv(), signal);
  return items.filter((it) => fs.existsSync(it.out)).map((it) => ({ kind: it.kind, url: bornasUrl(it.out), text: it.kind === "split" ? `${it.age} · ${it.word}` : `${it.line} ${it.name}` }));
};
export const packageBornasVideo = async (job: BornasJob, video: BornasVideo, script: BornasScript, log: Log, signal?: AbortSignal): Promise<void> => {
  log(BORNAS_LOG.SEO);
  const chapters = chaptersOf(job, video, script);
  const avoid = listBornasJobs(40)
    .filter((p) => p.channel.id === job.channel.id)
    .flatMap((p) => p.videos.flatMap((v) => (v === video ? [] : (v.seo?.options || []).map((o) => o.title))))
    .slice(0, 20);
  const raw = (await runMotionAi(BORNAS_PROMPT.SEO({ title: script.title, hero: script.hero, lines: script.lines.map((l) => l.text), language: job.channel.language, genre: bornasGenre(job.channel.genre), seconds: video.seconds || job.channel.seconds, chapters: chapters.slice(1).map((c) => c.title), avoid }), BORNAS_ARTIFACT.SEO, reupExec(job.ai.seoAi), signal, (line) => line && log(line))) as
    | Obj
    | undefined;
  const options = _.compact((Array.isArray(raw?.options) ? (raw!.options as Obj[]) : []).map(cleanOption)).slice(0, BORNAS_SEO.OPTIONS);
  if (!options.length) throw new Error(BORNAS_ERROR.NO_SEO);
  const name = text(raw?.name, BORNAS_SEO.NAME_MAX) || text(script.hero.split(/[,(:]/)[0], BORNAS_SEO.NAME_MAX);
  const word = text(raw?.word, BORNAS_SEO.WORD_MAX);
  const thumbs = await drawThumbs(job, video, { word, name }, log, signal).catch((error) => {
    log(BORNAS_ERROR.TOOL("born_thumb", String((error as Error)?.message || error)), "warn");
    return [] as BornasThumb[];
  });
  video.seo = { options, pinned: text(raw?.pinned, 200), chapters, thumbs };
  const t = MOTION_SEO_TEXTS[job.channel.language === "vi" ? "vi" : "en"];
  fs.writeFileSync(bornasVideoDir(job, video, BORNAS_SEO.DIR, BORNAS_SEO.FILE), MOTION_SEO.EXPORT_TEXT(t.exportTitle, [...options.map((o, i) => renderSeoOptionText(o, { chapters }, i, t)), video.seo.pinned].filter(Boolean).join("\n\n")));
  log(BORNAS_LOG.SEO_DONE(options.length, thumbs.length));
};
