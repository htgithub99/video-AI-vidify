// Changing a visual setting after a plan exists must replan (or keep the plan) and send the NEW rules to the AI.
import fs from "node:fs"; import os from "node:os"; import path from "node:path";
const root = fs.mkdtempSync(path.join(os.tmpdir(), "cfg-")); process.env.VIDIFY_STORAGE_DIR = root; delete process.env.APP_DATA_DIR;
const R = "../src/";
const { planMotionHtmlScenes, generateMotionHtmlScene } = await import(R + "features/motion/server/services/html/scenePipeline.ts");
const { motionHtmlAuthoringSnapshot } = await import(R + "lib/motionHtmlAuthoring.ts");
const { MOTION_LAYOUTS } = await import(R + "constants/motionLayouts/index.ts");
const { MOTION_HTML_STYLES } = await import(R + "constants/motionHtmlTemplate.ts");
const { motionHtmlPlanCurrent } = await import(R + "lib/motionHtmlScene.ts");
const lineCount = (p: string) => (p.match(/"id":"L\d+"/g) || []).length;
const base = { version: 1, mode: "remotion", engine: "remotion", profileId: "history", componentRevision: 1, pacing: "medium" } as any;
const beats = [1, 2, 3].map((i) => ({ id: `c1_b${i}`, chapterId: "c1", narration: `Line ${i}: the messenger runs across the bridge and shouts the news.`, visual: "scene", place: "p1", cast: [] }));
const analysis: any = { title: "T", videoGenre: "pov", storytelling: "lively", chapters: [{ id: "c1", title: "C", targetSeconds: 20 }], cast: [], places: [{ id: "p1", name: "Bridge" }], authoringSettings: motionHtmlAuthoringSnapshot({ videoGenre: "pov", storytelling: "lively", length: "2min", target: 120, language: "en", profile: "history", pacing: "medium" }) };
let prompts: string[] = [];
const ai = async (prompt: string, kind: string) => { prompts.push(prompt); const n = lineCount(prompt) || 1; return { scenes: [{ fromLineId: "L1", toLineId: `L${n}`, sceneTemplate: "0. SCENE THEME & TYPE: x\n1. SUBJECTS & LOOK: y\n2. THREE-LAYER SETTING & CAMERA: z\n3. CHARACTERS & ACTION MECHANICS: w\n4. OVERLAYS & INTERACTION: none" }] }; };
const plan = async (script: any, sfx: boolean, scope: string) => planMotionHtmlScenes(script, analysis, { exec: {} as any, ai: ai as any, scope, log: () => {}, sfx });
const script0 = { title: "T", language: "en", visualSettings: base, beats, gen: { cast: {}, locations: {} } } as any;
const planned = await plan(script0, true, "s0");
console.log("base plan calls:", prompts.length, "current:", motionHtmlPlanCurrent(planned, { ...analysis, visualSettings: base }));
const variants: [string, any, boolean, (p: string) => boolean][] = [
  ["Kiểu vẽ → sketch", { ...base, profileId: "sketch" }, true, (p) => p.includes(MOTION_HTML_STYLES.sketch)],
  ["Kiểu vẽ → comic", { ...base, profileId: "comic" }, true, (p) => p.includes(MOTION_HTML_STYLES.comic)],
  ["Bố cục → close", { ...base, layout: "close" }, true, (p) => p.includes(MOTION_LAYOUTS.close.planner)],
  ["Bố cục → wide", { ...base, layout: "wide" }, true, (p) => p.includes(MOTION_LAYOUTS.wide.planner)],
  ["Nhịp → many", { ...base, pacing: "many" }, true, (p) => /many/.test(p)],
  ["Nhịp → few", { ...base, pacing: "few" }, true, (p) => /few/.test(p)],
  ["Bộ vẽ chuẩn bật", { ...base, figureKit: true }, false, () => true],
];
let failures = 0;
for (const [name, vs, expectReplan, check] of variants) {
  prompts = [];
  const res = await plan({ ...planned, visualSettings: vs }, true, "s0");
  const ok = (prompts.length > 0) === expectReplan && (!expectReplan || prompts.every(check)) && motionHtmlPlanCurrent(res, { ...analysis, visualSettings: vs });
  failures += ok ? 0 : 1;
  console.log((ok ? "OK  " : "FAIL") + " plan | " + name.padEnd(18), "| replan:", prompts.length, "| new rules in prompt:", expectReplan ? prompts.every(check) : "-");
}
prompts = [];
const r = await plan({ ...planned }, false, "s0");
if (!(prompts.length && prompts.every((p) => /disabled/i.test(p)))) failures++;
console.log((prompts.length && prompts.every((p) => /disabled/i.test(p)) ? "OK  " : "FAIL") + " plan | SFX tắt            | replan:", prompts.length);
// scene prompt capture
const scene: any = { id: "c1_b1:html:0", sceneTemplate: "0. SCENE THEME & TYPE: x", text: "Line 1", renderer: "html-canvas" };
const sceneCase = async (name: string, s: any, check: (p: string) => boolean) => {
  const ctrl = new AbortController(); let got = "";
  const sai = async (p: string) => { got = p; ctrl.abort(); throw new Error("stop"); };
  try { await generateMotionHtmlScene(structuredClone(scene), { width: 1280, height: 720, seconds: 6, profile: "history", language: "en", scope: "sc-" + name, ...s }, { exec: { provider: "gemini-chat" } as any, ai: sai as any, signal: ctrl.signal, log: () => {} }); } catch {}
  if (!(got && check(got))) failures++;
  console.log((got && check(got) ? "OK  " : "FAIL") + " scene | " + name);
};
await sceneCase("Kiểu vẽ sketch + Bộ vẽ chuẩn", { profile: "sketch", figureKit: true }, (p) => /MotionKit/.test(p));
await sceneCase("Bố cục close", { layout: "close" }, (p) => p.includes(MOTION_LAYOUTS.close.scene));
await sceneCase("Bố cục stage", { layout: "stage" }, (p) => p.includes(MOTION_LAYOUTS.stage.scene));
await sceneCase("Khung 9:16 (720x1280)", { width: 720, height: 1280 }, (p) => /720/.test(p) && /1280/.test(p));
await sceneCase("Ngôn ngữ vi", { language: "vi" }, (p) => /\bvi\b|Vietnamese/i.test(p));
fs.rmSync(root, { recursive: true, force: true });
if (failures) { console.error(`${failures} config check(s) failed`); process.exit(1); }
console.log("Config changes replan and redraw with the new settings: passed.");
