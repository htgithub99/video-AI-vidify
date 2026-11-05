import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { buildRemotionScenes } from "../src/features/motion/server/services/remotion/scenePipeline.ts";
import { compileRemotionStory } from "../src/features/motion/server/services/remotion/storyCompiler.ts";
import { renderRemotionVideo } from "../src/features/motion/server/services/motionRemotionRenderService.ts";
import { closeAppBrowserAfterTask } from "../src/server/services/imageGeneratorService.ts";
import { MOTION_CLIP_DIRECTOR as D } from "../src/constants/motionClipDirector.ts";
/** Live acceptance: one real Gemini scene → drawing with movable parts → AI motion director → Remotion MP4. */
const out = path.resolve("storage/output/motion-video/clip-live");
fs.mkdirSync(out, { recursive: true });
const logs: string[] = [];
const log = (line: string) => {
  logs.push(line);
  process.stdout.write(line + "\n");
};
const settings = { version: 1 as const, mode: "remotion" as const, engine: "remotion" as const, profileId: "history" as const, componentRevision: 1 };
const behavior = { version: 1 as const, actors: "simple" as const, sceneEffects: "gentle" as const, camera: "gentle" as const };
const narration = "Người kỵ binh phi ngựa dọc bờ sông, bụi tung sau vó ngựa, dòng nước chảy xiết bên cạnh.";
const analysis: any = {
  title: "Kỵ binh bên sông",
  visualSettings: settings,
  era: "Vietnam, 18th century",
  videoGenre: "chronicle",
  cast: [{ key: "rider", name: "Kỵ binh", role: "cavalry scout", look: "red tunic, conical hat, short sword at the belt", gender: "male", age: "adult" }],
  places: [{ key: "river", name: "Bờ sông", description: "a dirt road along a wide river with green hills behind", interior: false, time: "day" }],
  chapters: [{ id: "c1", title: "Kỵ binh", targetSeconds: 8 }],
};
const script: any = {
  title: "Kỵ binh bên sông",
  language: "vi",
  visualSettings: settings,
  beats: [{ id: "b1", chapterId: "c1", visual: "scene", shot: "wide", place: "river", time: "day", cast: ["rider"], narration, action: narration, duration: 8, utterances: [{ id: "b1-0", speaker: "narrator", role: "narration", text: narration }] }],
};
const exec = { provider: "gemini-chat", model: "gemini-flash::medium", mode: "room-only", chromeHeadless: false };
const started = Date.now();
try {
  const built = await buildRemotionScenes(script, analysis, { exec, mainExec: exec, scope: `clip-live-${started}`, review: false, sfx: false, renderBehavior: behavior, aspect: "16:9", log, restart: true });
  const scene = built.gen!.remotion!.scenes.b1?.[0];
  assert.ok(scene?.composition, "Scene was drawn");
  const asset = built.gen!.remotion!.assets[scene.composition.assetKey];
  fs.writeFileSync(path.join(out, "scene.svg"), asset.svg);
  const motion = scene.composition.motion;
  const parts = motion?.rig.parts.map((part) => part.id) || [];
  const report = { at: new Date().toISOString(), seconds: Math.round((Date.now() - started) / 1000), directed: !!motion, clips: motion?.clips || [], parts, bible: built.gen!.remotion!.motionBible, logs };
  fs.writeFileSync(path.join(out, "report.json"), JSON.stringify(report, null, 2));
  log(`Rig parts (${parts.length}): ${parts.join(", ")}`);
  if (!motion) throw new Error(logs.find((line) => line.includes("chuyển động")) || "Motion director did not return clips");
  log(`AI clips (${motion.clips.length}): ${motion.clips.map((clip) => `${clip.op}:${clip.target || clip.group?.join("+") || clip.at}`).join(" | ")}`);
  const { spec } = compileRemotionStory(built, analysis, { aspect: "16:9", durations: [8], fps: 30, renderBehavior: behavior });
  const mp4 = path.join(out, "clip-live.mp4");
  await renderRemotionVideo(spec, mp4, { width: 1280, height: 720, crf: 23, signal: AbortSignal.timeout(15 * 60 * 1000), onProgress: () => undefined, log });
  const probe = spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", mp4], { encoding: "utf8" });
  log(`PASS: live Gemini scene drawn and directed (${motion.clips.length} clips, ${parts.length} parts); video ${mp4} (${Number(probe.stdout).toFixed(1)} s). Directed: ${D.ARTIFACT}.`);
} catch (error) {
  fs.writeFileSync(path.join(out, "report.json"), JSON.stringify({ at: new Date().toISOString(), error: String((error as Error)?.stack || error), logs }, null, 2));
  log(`FAIL: ${String((error as Error)?.message || error)}`);
  process.exitCode = 1;
} finally {
  await closeAppBrowserAfterTask(true).catch(() => undefined);
}
