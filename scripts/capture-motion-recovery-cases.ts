import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { parse } from "parse5";

const root = path.resolve("storage/output/motion-video");
const out = path.resolve(process.argv[2] || "scratch/motion-real-recovery-20261105/baseline");
await fs.mkdir(out, { recursive: true });
if (await fs.stat(path.join(out, "manifest.json")).then(() => true, () => false)) throw new Error("Baseline already exists. Reuse it for verification or pass a new output directory; do not overwrite original evidence.");
const jobs = await fs.readdir(path.join(root, "story-jobs"));
const candidates = await Promise.all(jobs.filter((name) => name.endsWith(".json")).map(async (name) => {
  const file = path.join(root, "story-jobs", name);
  const raw = await fs.readFile(file, "utf8");
  const job = JSON.parse(raw).job;
  return { file, raw, job, mtime: (await fs.stat(file)).mtimeMs };
}));
const selected = candidates.filter((item) => item.job?.kind === "scenes").sort((a, b) => b.mtime - a.mtime)[0];
if (!selected) throw new Error("No real scene job available");
const manifest: any = {
  at: new Date().toISOString(),
  commit: execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(),
  statusBefore: execFileSync("git", ["status", "--short"], { encoding: "utf8" }),
  jobId: selected.job.id,
  files: [],
};
const copy = async (file: string) => {
  const relative = path.relative(path.resolve("storage"), file);
  const data = await fs.readFile(file);
  const target = path.join(out, relative);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, data);
  manifest.files.push({ source: file, copy: target, bytes: data.length, sha256: createHash("sha256").update(data).digest("hex") });
};
await copy(selected.file);
await copy(path.join(root, "story-jobs/logs", selected.job.id + ".jsonl"));
const debug = await fs.readdir(path.join(root, "ai-debug"));
const names = ["a8c3f22c", "c4eeb937", "7ee92585776fcf026eb0592a7790cd7e93274eb0cf0852239d628057fc50f3d4", "99d1c2c7230b6fab5621ef6bfa9a935abbe18b1da7c735c5ea822217a2627372", "1ee95718db8f407d5a1af0091a58a2919fa851828de239004ed7cbe583dbe1b8", "cde21f84f89b0d5c2161de6bb0f0be256d1604613a75fa4ded900869b58fa060"];
for (const name of debug.filter((name) => names.some((part) => name.includes(part)))) await copy(path.join(root, "ai-debug", name));
const drafts = await fs.readdir(path.join(root, "task-drafts"));
const draftFiles = await Promise.all(drafts.filter((name) => name.endsWith(".json")).map(async (name) => ({ file: path.join(root, "task-drafts", name), mtime: (await fs.stat(path.join(root, "task-drafts", name))).mtimeMs })));
for (const item of draftFiles.sort((a, b) => b.mtime - a.mtime).slice(0, 3)) await copy(item.file);
const sceneDraft = JSON.parse(await fs.readFile(draftFiles.sort((a, b) => b.mtime - a.mtime)[0].file, "utf8"));
manifest.scenes = Object.values(sceneDraft.draft?.state?.scenes || {}).flat().map((scene: any) => ({ id: scene.id, status: scene.build?.status, attempts: scene.build?.attempts, error: scene.build?.error }));
const dom = await fs.readFile(path.join(root, "ai-debug/motion_remotion_composition-a8c3f22c.dom.txt"), "utf8");
const doc: any = parse(dom);
const text = (node: any): string => node.nodeName === "#text" ? node.value : (node.childNodes || []).map(text).join("");
const queries: string[] = [];
const visit = (node: any) => {
  if (node.tagName === "user-query") queries.push(text(node));
  for (const child of node.childNodes || []) visit(child);
};
visit(doc);
await fs.writeFile(path.join(out, "refusal-user-queries.json"), JSON.stringify({ provenance: "user-query text extracted from saved actual Gemini DOM; includes rendered UI text", queries }, null, 2));
await fs.writeFile(path.join(out, "manifest.json"), JSON.stringify(manifest, null, 2));
process.stdout.write(String(JSON.stringify({ baseline: out, job: selected.job.id, files: manifest.files.length, scenes: manifest.scenes.length, prompts: queries.map((q) => q.length) })) + "\n");
