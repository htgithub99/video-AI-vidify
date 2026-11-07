import fs from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { chromium } from "playwright";
const out = path.resolve("scratch/motion-html-settings-20261107");
process.env.VIDIFY_STORAGE_DIR = path.join(out, "storage"); delete process.env.APP_DATA_DIR;
await fs.mkdir(out, { recursive: true });
const { writeChapterBeats, editScript, resolveTargetSeconds, normalizeAnalysis } = await import("../src/features/motion/server/services/motionStoryService.ts");
const { motionHtmlAuthoringSnapshot, motionHtmlPacingDirection, motionHtmlChapterBudget, motionHtmlAnalysisPrompt } = await import("../src/lib/motionHtmlAuthoring.ts");
const { MOTION_HTML } = await import("../src/constants/motionHtmlTemplate.ts");
const { motionOutputSettings } = await import("../src/lib/motionOutputSettings.ts");
const { motionHtmlFrame } = await import("../src/lib/motionHtmlScene.ts");
const { motionRemotionSegments } = await import("../src/lib/motionRemotionSegments.ts");
const { motionVoiceAsrSatisfied } = await import("../src/lib/motionVoice.ts");
const { compileRemotionSound } = await import("../src/features/motion/server/services/remotion/soundCompiler.ts");
const { findNativeChrome } = await import("../src/server/services/nativeProxyBrowser.ts");
const { motionResponsePrompt } = await import("../src/lib/motionResponseContract.ts");
for (const schema of ["motion-html-chapter", "motion-html-edit"]) assert.doesNotMatch(motionResponsePrompt(schema), /motionIntent|scenePlan|frame:|stance|unit:/);
const sentence = "The messenger carries a letter across the courtyard.";
assert.doesNotMatch(MOTION_HTML.TEMPLATE, /[\u00c0-\u024f\u1e00-\u1eff]/u, "Production template headings and instructions are English");
for (const heading of ["0. SCENE THEME & TYPE", "1. VISUAL STYLE", "2. THREE-LAYER SETTING & CAMERA", "3. CHARACTERS & ACTION MECHANICS", "4. OVERLAYS & INTERACTION"]) assert.ok(MOTION_HTML.TEMPLATE.includes(heading));
const viText = "Người đưa tin mang thư qua sân.";
const viSource: any = { kind: "brief", title: "Lá thư", text: viText, sourceSeconds: 10, segments: [{ t: 0, text: viText }] };
const viAnalysis: any = { title: "Lá thư", chapters: [{ id: "c1", title: "Lá thư", targetSeconds: 10 }], cast: [], places: [], authoringSettings: motionHtmlAuthoringSnapshot({ length: "2min", target: 120, language: "vi", profile: "history", pacing: "few" }) };
const viPrompt = motionHtmlAnalysisPrompt({ title: "Lá thư", seconds: 120, language: "vi", chapters: 1, transcript: viText });
assert.match(viPrompt, /SELECTED VIDEO LANGUAGE: vi/);
assert.ok(viPrompt.includes(viText), "Source prose is data and is not translated by string manipulation");
const templateInEnglish = '0. SCENE THEME & TYPE: Letter delivery\n1. VISUAL STYLE: Flat colours\n2. THREE-LAYER SETTING & CAMERA: Courtyard\n3. CHARACTERS & ACTION MECHANICS: Carry the letter\n4. OVERLAYS & INTERACTION: Show the exact text "Lá thư đã đến".';
const viBeats = await writeChapterBeats(viSource, viAnalysis, viAnalysis.chapters[0], { language: "vi", exec: {}, ai: async (prompt) => {
  assert.match(prompt, /PRODUCTION LANGUAGE: Write all production descriptions/);
  assert.match(prompt, /SELECTED VIDEO LANGUAGE: vi/);
  assert.match(prompt, /Do not translate audience-facing content into English/);
  return { beats: [{ id: "b1", narration: viText, visual: "scene", sceneTemplateDraft: templateInEnglish }] };
} });
assert.equal(viBeats[0].narration, viText); assert.equal(viBeats[0].sceneTemplateDraft, templateInEnglish);
const editedVi = await editScript(viSource, viAnalysis, viBeats, { language: "vi", exec: {}, ai: async (prompt) => {
  assert.match(prompt, /SELECTED VIDEO LANGUAGE: vi/);
  assert.ok(prompt.includes("Lá thư đã đến"));
  return { edits: [] };
} });
assert.equal(editedVi.beats[0].sceneTemplateDraft, templateInEnglish);
assert.equal(editedVi.beats[0].narration, viText);
const durationCases: any[] = [];
for (const [length, seconds] of [["1min", 60], ["2min", 120], ["5min", 300], ["12min", 720]] as const) for (const sourceSeconds of [20, 3600]) {
  const source: any = { title: "Duration", text: sentence, kind: "transcript", sourceSeconds, words: 20, segments: [{ t: 0, text: sentence }] };
  assert.equal(resolveTargetSeconds(source, length as any, 2), seconds, "A selected duration is not expanded or silently clamped to source length");
  const analysis = normalizeAnalysis({ title: "Duration", chapters: Array.from({ length: 3 }, (_, index) => ({ id: `c${index + 1}`, title: `Part ${index + 1}`, summary: sentence, from: sourceSeconds * index / 3, to: sourceSeconds * (index + 1) / 3 })), cast: [], places: [] }, source, seconds, "verdict", true);
  assert.equal(analysis.chapters.length, 3, "HTML authoring keeps the requested part ranges, without legacy SOLO/short-chapter merges");
  assert.equal(analysis.chapters.reduce((sum, chapter) => sum + chapter.targetSeconds!, 0), seconds);
  const budget = analysis.chapters.map((chapter, index) => motionHtmlChapterBudget(analysis, chapter, 2.5, index === 0, index === 2));
  assert.ok(budget.every((item, index) => item.seconds + item.pause <= analysis.chapters[index].targetSeconds! + .001));
  durationCases.push({ length, sourceSeconds, seconds });
}
for (const [pacing, seconds] of [["few",14],["medium",9],["many",6]] as const) {
  const rule = motionHtmlPacingDirection({ pacing } as any, 84);
  assert.match(rule, new RegExp(`roughly ${seconds} seconds`));
  assert.doesNotMatch(rule, /give a new picture when the view or the subject changes/);
}
let writerCases = 0;
for (const profile of ["history", "horror", "explainer"]) for (const videoGenre of ["pov", "witness", "chronicle", "verdict"]) for (const storytelling of ["plain", "lively", "gripping"]) {
  const analysis: any = { title: "Fixture", cast: [], places: [], videoGenre, storytelling, chapters: [{ id: "c1", title: "Letter", from: 0, to: 10, targetSeconds: 30 }], visualSettings: { version: 1, mode: "remotion", engine: "remotion", profileId: profile, componentRevision: 1, pacing: "few" }, authoringSettings: motionHtmlAuthoringSnapshot({ length: "2min", target: 120, language: "en", profile, pacing: "few", videoGenre, storytelling }) };
  const template = "0. Scene\n1. Style\n2. Three layers\n3. Letter carried\n4. No overlays";
  const result = await writeChapterBeats({ kind: "brief", title: "Letter", text: sentence, sourceSeconds: 10, segments: [{ t: 0, text: sentence }] } as any, analysis, analysis.chapters[0], { language: "en", exec: {}, isFirst: true, isLast: true, multiVoice: false, ai: async (prompt, _artifact, execution) => {
    assert.equal(execution.responseSchema, "motion-html-chapter");
    assert.ok(prompt.includes(`genre=${videoGenre}; storytelling=${storytelling}`));
    assert.match(prompt, /PICTURE PACING: few, roughly 14/);
    assert.doesNotMatch(prompt, /ONE BEAT = ONE SPOKEN IDEA|CHARACTER SVG FRAME|SELECTED VISUAL CONSTRUCTION|at least three candidates|These stages always get chapters/);
    assert.match(prompt, /TOTAL across all its beats/);
    return { beats: [{ id: "b1", narration: sentence, visual: "scene", sceneTemplateDraft: template }] };
  } });
  assert.equal(result[0].sceneTemplateDraft, template); writerCases++;
}
const html = `<!DOCTYPE html><html><head></head><body><canvas id="motion-canvas"></canvas><script>window.motionScene={ready:Promise.resolve(),renderAt:p=>{const c=document.getElementById('motion-canvas');c.width=p.width;c.height=p.height;const x=c.getContext('2d');x.fillStyle=p.progress>.4?'#ff0000':'#00ff00';x.fillRect(0,0,c.width,c.height)}};</script></body></html>`;
const scene: any = { renderer: "html-canvas", id: "s1", beatId: "b1", sourceBeatIds: ["b1", "b2"], startFrame: 0, endFrame: 60, nodes: [], html: { version: 1, html, hash: "first", seed: "fixed", duration: 2, attempts: 1, status: "ready" }, soundEvents: [{ id: "late", kind: "impact", layer: "accent", at: .75, duration: .2, source: "visible", actor: "messenger" }] };
const spec: any = { renderer: "html-canvas", engine: "remotion", version: 1, title: "Fixture", aspect: "16:9", fps: 30, duration: 2, width: 640, height: 360, motion: true, profileId: "history", assets: {}, scenes: [scene], subtitles: [{ start: 0, end: 2, text: "A letter arrives." }], renderBehavior: { version: 1, actors: "simple", camera: "gentle", sceneEffects: "gentle" } };
const still = { ...spec, renderBehavior: { version: 1, actors: "fixed", camera: "fixed", sceneEffects: "off" } };
assert.deepEqual(motionHtmlFrame(still, scene, 0), motionHtmlFrame(still, scene, 50), "Motion OFF freezes content time while host timeline advances");
assert.notDeepEqual(motionHtmlFrame(spec, scene, 0), motionHtmlFrame(spec, scene, 50));
const cues = compileRemotionSound(spec, { beats: [{ id: "b1", data: {} }, { id: "b2", data: {} }] } as any, [0,1], [1,2]);
assert.equal(cues.length, 1, "Scene SFX is retained without nodes, even when it falls in the second covered beat");
assert.equal(cues[0].t, 1.5);
const encoding = { width: 640, height: 360, crf: 23 };
const key = motionRemotionSegments(spec, encoding)[0].key;
assert.equal(motionRemotionSegments({ ...spec, scenes: [{ ...scene, html: { ...scene.html, attempts: 12, status: "rendered", prompt: "different bookkeeping" } }] }, encoding)[0].key, key);
assert.notEqual(motionRemotionSegments(still, encoding)[0].key, key);
assert.notEqual(motionRemotionSegments({ ...spec, subtitles: [] }, encoding)[0].key, key);
assert.equal(motionVoiceAsrSatisfied({} as any, false), true); assert.equal(motionVoiceAsrSatisfied({} as any, true), false);
const controls = motionOutputSettings({ visualSettings: { version: 1, mode: "remotion", engine: "remotion", profileId: "history", componentRevision: 1, pacing: "few" }, videoGenre: "verdict", storytelling: "lively", length: "2min", parts: 1, language: "en", autoContinue: true, renameEntities: false, voiceChannel: "history-channel@1", multiVoice: false, asrCheck: false, musicMood: "off", sfx: true, characterMotion: true, subtitles: true, autoExport: true, clearGeminiChatsBeforeExport: true }).controlSnapshot!;
assert.equal(Object.keys(controls).length, 19); assert.equal(controls.multiVoice, false); assert.equal(controls.musicMood, "off"); assert.equal(controls.pacing, "few");
const bundle = await build({ absWorkingDir: process.cwd(), stdin: { contents: `import React from 'react';import{createRoot}from'react-dom/client';import{MotionHtmlScenePlayer}from'./src/features/motion/components/MotionHtmlScenePlayer.tsx';window.mount=s=>createRoot(document.getElementById('root')).render(React.createElement(MotionHtmlScenePlayer,{spec:s}));`, resolveDir: process.cwd(), loader: "tsx" }, bundle: true, platform: "browser", format: "iife", write: false });
const browser = await chromium.launch({ executablePath: findNativeChrome(), headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 900, height: 650 } }); const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setContent('<div id="root"></div>'); await page.addScriptTag({ content: bundle.outputFiles[0].text }); await page.evaluate((value) => (window as any).mount(value), spec);
  await page.locator('input[aria-label="Video timeline"]').waitFor();
  const output = page.frameLocator('iframe[title="Canvas scene"]').locator('#output[src^="data:"]');
  await output.waitFor();
  const firstCanvas = await output.getAttribute("src");
  const first = await page.screenshot();
  await page.locator('input[aria-label="Video timeline"]').fill("1.5");
  await page.waitForTimeout(500);
  const last = await page.screenshot();
  assert.notEqual(await output.getAttribute("src"), firstCanvas, "Seeking changes the actual Canvas PNG, independent of slider/text changes");
  assert.notDeepEqual(first, last); assert.deepEqual(errors, []);
  await page.getByRole("button", { name: "Thử tương tác" }).click();
  assert.equal(await output.evaluate((node) => (node as HTMLElement).style.display), "none");
  await page.getByRole("button", { name: "Về video" }).click();
  assert.equal(await output.evaluate((node) => (node as HTMLElement).style.display), "");
  await fs.writeFile(path.join(out, "player.png"), last);
} finally { await browser.close(); }
await fs.writeFile(path.join(out, "verification.json"), JSON.stringify({ writerCases, durationCases, pacingOptions: [14,9,6], controls, sceneCuesWithoutNodes: cues, opaqueIframePlayer: true, realProviderCalls: 0, realHistoryDeleted: false }, null, 2));
process.stdout.write("PASS: 36 authoring combinations, 19-control snapshot, motion/subtitle/cache/ASR independence, scene SFX without nodes, real Chrome React player.\n");
process.exit(0);
