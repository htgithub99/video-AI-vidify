import fs from "fs";
import path from "path";
import _ from "lodash";
import { reupFfmpeg, reupProbe } from "../../../reup/server/services/reupFfmpeg.js";
import { runMotionAi } from "../../../motion/server/services/motionStoryService.js";
import { reupExec } from "../../../reup/server/services/reupAiService.js";
import { BORNAS_DIR, BORNAS_LIMITS, BORNAS_RENDER, BORNAS_REVIEW } from "../../constants/bornasConfig.js";
import { BORNAS_ARTIFACT, BORNAS_PROMPT } from "../../constants/bornasPrompts.js";
import { BORNAS_ERROR, BORNAS_LOG } from "../../constants/bornasServerText.js";
import type { BornasJob, BornasVideo } from "../../types/bornas.js";
import type { BornasPlan } from "./bornasShots.js";
import { bornasUrl } from "./bornasStore.js";
import { bornasVideoDir } from "./bornasVoice.js";
import { bornasKit, playwrightEnv, readJson, runKitNode, runKitPy, runTool, writeJson } from "./bornasTools.js";
type Log = (text: string, level?: "info" | "warn" | "error") => void;
const copyRuntime = (dir: string): void => {
  for (const name of BORNAS_RENDER.RUNTIME) {
    const from = bornasKit(name);
    if (!fs.existsSync(from)) throw new Error(BORNAS_ERROR.KIT(from));
    fs.cpSync(from, path.join(dir, name), { recursive: true });
  }
};
export const buildBornasVideo = async (job: BornasJob, video: BornasVideo, plan: BornasPlan, log: Log, signal?: AbortSignal): Promise<void> => {
  log(BORNAS_LOG.BUILD);
  const dir = bornasVideoDir(job, video, BORNAS_DIR.RENDER);
  copyRuntime(dir);
  fs.copyFileSync(bornasVideoDir(job, video, "voice.wav"), path.join(dir, "voice.wav"));
  const planFile = bornasVideoDir(job, video, "plan.json");
  writeJson(planFile, plan);
  const out = await runKitNode("born_build.mjs", [planFile, dir], { BORN_ASSETS: bornasVideoDir(job, video, BORNAS_DIR.ASSETS) }, signal);
  const res = JSON.parse(_.last(out.trim().split(/\r?\n/)) || "{}") as { shots?: number; png?: number; warns?: string[] };
  for (const w of res.warns || []) log(BORNAS_LOG.BUILD_WARN(w), "warn");
  log(BORNAS_LOG.BUILD_DONE(res.shots || 0, res.png || 0));
  video.shotCount = res.shots || 0;
  video.jobDir = dir;
};
type Frame = { id: string; t: number; file: string };
const snapShots = async (dir: string, snaps: string, log: Log, signal?: AbortSignal): Promise<Frame[]> => {
  fs.mkdirSync(snaps, { recursive: true });
  for (const f of fs.readdirSync(snaps)) fs.rmSync(path.join(snaps, f), { force: true });
  const shots = readJson<{ id: string; t0: number; t1: number; kind?: string }[]>(path.join(dir, "shots.json"), []).filter((s) => s.kind !== "chapter");
  const texts = readJson<{ id: string; t: number; end: number }[]>(path.join(dir, "texts.json"), []);
  const frames = shots.map((s) => {
    const ev = texts.find((e) => e.id === s.id);
    const t = ev ? Math.min(ev.t + BORNAS_REVIEW.TEXT_DELAY, ev.end - 0.05, s.t1 - 0.05) : (s.t0 + s.t1) / 2;
    return { id: s.id, t: _.round(t, 2), file: path.join(snaps, `t${_.round(t, 2).toFixed(2)}.jpg`) };
  });
  for (const part of _.chunk(frames, BORNAS_REVIEW.SNAP_BATCH)) await runKitNode("snap.mjs", [dir, snaps, ...part.map((f) => f.t.toFixed(2))], playwrightEnv(), signal).catch((error) => log(String((error as Error)?.message || error), "warn"));
  return frames.filter((f) => fs.existsSync(f.file));
};
const reviewSnaps = async (job: BornasJob, frames: Frame[], snaps: string, dir: string, log: Log, signal?: AbortSignal): Promise<Record<string, string[]>> => {
  const castOf = readJson<Record<string, string[]>>(path.join(dir, "cast.json"), {});
  if (!frames.length) return {};
  const manifest = path.join(snaps, "frames.json");
  writeJson(
    manifest,
    frames.map((f) => ({ file: f.file })),
  );
  const out = await runKitPy("annotate.py", ["frames", manifest, path.join(snaps, "review")], log, signal).catch(() => "");
  const sheets = (() => {
    try {
      return JSON.parse(_.last(out.trim().split(/\r?\n/)) || "[]") as { file: string; start: number; count: number }[];
    } catch {
      return [];
    }
  })();
  log(BORNAS_LOG.REVIEW(frames.length));
  const found: Record<string, string[]> = {};
  const notes: string[] = [];
  for (const batch of _.chunk(sheets, BORNAS_LIMITS.AI_IMAGES)) {
    const cast = _.flatMap(batch, (b) => _.range(b.start, b.start + b.count)).flatMap((n) => (castOf[frames[n - 1]?.id]?.length ? [{ n, names: castOf[frames[n - 1].id] }] : []));
    const res = (await runMotionAi(
      BORNAS_PROMPT.SNAP_REVIEW(
        batch.map((b) => ({ start: b.start, count: b.count })),
        cast,
      ),
      BORNAS_ARTIFACT.SNAP_REVIEW,
      reupExec(job.ai.visionAi),
      signal,
      (line) => line && log(line),
      batch.map((b, i) => ({ name: `frames_${i + 1}.jpg`, mimeType: "image/jpeg", path: b.file })),
    ).catch(() => undefined)) as { issues?: Record<string, unknown>[] } | undefined;
    for (const it of res?.issues || []) {
      const f = frames[Number(it.n) - 1];
      const act = String(it.fix || "").trim();
      const [verb, name] = act.split(":");
      const ok = name ? BORNAS_REVIEW.TARGET_FIXES.includes(verb as (typeof BORNAS_REVIEW.TARGET_FIXES)[number]) && (castOf[f?.id] || []).includes(name) : BORNAS_REVIEW.FIXES.includes(act as (typeof BORNAS_REVIEW.FIXES)[number]);
      if (!f || !ok) continue;
      found[f.id] = _.uniq([...(found[f.id] || []), act]);
      notes.push(`${f.id}: ${String(it.problem || "").slice(0, 90)}`);
    }
  }
  log(notes.length ? BORNAS_LOG.REVIEW_FOUND(notes.length) : BORNAS_LOG.REVIEW_OK, notes.length ? "warn" : "info");
  for (const n of notes.slice(0, 10)) log(n, "warn");
  return found;
};
export const checkBornasVideo = async (job: BornasJob, video: BornasVideo, log: Log, signal?: AbortSignal): Promise<void> => {
  const dir = video.jobDir!;
  log(BORNAS_LOG.CHECK);
  const out = bornasVideoDir(job, video, "check");
  const runCheck = async () =>
    (await runKitNode("check.mjs", [dir, out, path.join(dir, "texts.json"), path.join(dir, "faces_all.json")], playwrightEnv(), signal).catch((error) => String((error as Error)?.message || error)))
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l && l !== "OK");
  let issues = await runCheck();
  const fixFile = bornasVideoDir(job, video, "fix.json");
  const fix: Record<string, string[]> = {};
  const rebuild = async () => {
    writeJson(fixFile, fix);
    await runKitNode("born_build.mjs", [bornasVideoDir(job, video, "plan.json"), dir], { BORN_ASSETS: bornasVideoDir(job, video, BORNAS_DIR.ASSETS), BORN_FIX: fixFile }, signal);
    issues = await runCheck();
  };
  const fixIds = _.uniq(issues.flatMap((l) => l.match(/\[(s\d+)\]/)?.[1] || []));
  if (fixIds.length) {
    log(BORNAS_LOG.CHECK_FIX(issues.length, fixIds.length), "warn");
    for (const id of fixIds) fix[id] = ["tag", "wide"];
    await rebuild();
  }
  const snaps = bornasVideoDir(job, video, "snaps");
  const frames = await snapShots(dir, snaps, log, signal);
  const found = await reviewSnaps(job, frames, snaps, dir, log, signal);
  if (Object.keys(found).length) {
    for (const [id, acts] of Object.entries(found)) fix[id] = _.uniq([...(fix[id] || []), ...acts]);
    await rebuild();
    await snapShots(dir, snaps, log, signal);
  }
  const win = process.platform === "win32";
  const lint = await runTool(win ? "npx.cmd" : "npx", ["-y", BORNAS_RENDER.HYPERFRAMES, "lint", "."], { cwd: dir, signal, shell: win }).catch((error) => String((error as Error)?.message || error));
  const lintErrors = Number(lint.match(/(\d+) error\(s\)/)?.[1] ?? 0);
  if (lintErrors) log(BORNAS_LOG.LINT_ERRORS(lintErrors), "warn");
  video.checkIssues = issues.length;
  if (issues.length) {
    log(BORNAS_LOG.CHECK_ISSUES(issues.length), "warn");
    for (const line of issues.slice(0, 8)) log(line, "warn");
  } else log(BORNAS_LOG.CHECK_OK);
  const list = fs
    .readdirSync(snaps)
    .filter((f) => f.endsWith(".jpg"))
    .sort((a, b) => parseFloat(a.slice(1)) - parseFloat(b.slice(1)));
  if (!list.length) return;
  const listFile = path.join(snaps, "list.txt");
  fs.writeFileSync(listFile, list.map((f) => `file '${path.join(snaps, f).replace(/\\/g, "/")}'`).join("\n"));
  const sheet = bornasVideoDir(job, video, "sheet.jpg");
  await reupFfmpeg(["-y", "-f", "concat", "-safe", "0", "-i", listFile, "-vf", `scale=640:-2,tile=3x${Math.ceil(list.length / 3)}`, "-frames:v", "1", "-q:v", "3", sheet], { signal });
  video.sheetUrl = `${bornasUrl(sheet)}?v=${Date.now()}`;
};
export const renderBornasVideo = async (video: BornasVideo, log: Log, signal?: AbortSignal): Promise<void> => {
  const dir = video.jobDir!;
  log(BORNAS_LOG.RENDER);
  const out = path.join(dir, "out.mp4");
  fs.rmSync(out, { force: true });
  const win = process.platform === "win32";
  try {
    await runTool(win ? "npx.cmd" : "npx", ["-y", BORNAS_RENDER.HYPERFRAMES, "render", ".", "-f", String(BORNAS_RENDER.FPS), "-w", "auto", "-o", "out.mp4"], { cwd: dir, signal, shell: win });
  } catch (error) {
    throw new Error(BORNAS_ERROR.RENDER(String((error as Error)?.message || error)));
  }
  if (!fs.existsSync(out)) throw new Error(BORNAS_ERROR.RENDER("out.mp4"));
  log(BORNAS_LOG.RENDER_DONE(video.seconds || 0));
  const probe = await reupProbe(out);
  const loud = await reupFfmpeg(["-i", out, "-af", "volumedetect", "-vn", "-f", "null", "-"], { signal, keepLog: true }).catch(() => "");
  const mean = Number(loud.match(/mean_volume:\s*(-?[\d.]+)/)?.[1]);
  log(BORNAS_LOG.RENDER_PROBE(probe.width, probe.height, probe.duration, Number.isFinite(mean) ? mean : null), probe.width === BORNAS_RENDER.WIDTH && probe.height === BORNAS_RENDER.HEIGHT && probe.hasAudio ? "info" : "warn");
  log(BORNAS_LOG.PREVIEW);
  const preview = path.join(dir, BORNAS_DIR.PREVIEW);
  await reupFfmpeg(["-y", "-i", out, "-vf", `scale=-2:${BORNAS_RENDER.PREVIEW_HEIGHT}`, "-c:v", "libx264", "-preset", "veryfast", "-crf", String(BORNAS_RENDER.PREVIEW_CRF), "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", preview], { signal });
  video.outputFile = out;
  video.outputUrl = `${bornasUrl(out)}?v=${Date.now()}`;
  video.previewUrl = `${bornasUrl(preview)}?v=${Date.now()}`;
};
