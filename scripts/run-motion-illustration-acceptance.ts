import fs from "node:fs";
import path from "node:path";
import { setTimeout } from "node:timers/promises";
import { ACCEPTANCE as Q } from "./motionIllustrationAcceptanceTexts.js";
import { API_ROUTES as API } from "../src/constants/apiRoutes.js";
import type { MotionStoryScript } from "../src/types/motionVideo.js";
const root = path.resolve(process.argv.find((arg) => arg.startsWith(Q.ROOT_FLAG))?.slice(Q.ROOT_FLAG.length) || Q.ROOT);
fs.mkdirSync(root, { recursive: true });
const save = (name: string, data: unknown) => fs.writeFileSync(path.join(root, name + ".json"), JSON.stringify(data, null, 2));
const post = async (url: string, body: unknown): Promise<any> => {
  const response = await fetch(Q.HOST + url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const result: any = await response.json();
  if (!response.ok || !result.success) throw new Error(JSON.stringify(result));
  return result;
};
const follow = async (prefix: string, id: string, name: string): Promise<any> => {
  let delivered = 0;
  while (true) {
    const result: any = await (await fetch(Q.HOST + prefix + id)).json();
    if (!result.success) throw new Error(JSON.stringify(result));
    const job = result.job;
    save(name, job);
    for (const line of (job.log || []).slice(delivered)) process.stdout.write(line + "\n");
    delivered = job.log?.length || 0;
    if (job.status === "completed") return job.result;
    if (job.status === "error" || job.status === "cancelled") throw new Error(job.error || job.status);
    await setTimeout(2500);
  }
};
const analysis: any = { title: Q.TITLE, logline: "Hai anh em nghe tiếng bà gọi ngoài cửa trong khi bà đang nằm trong buồng.", look: "Simple static Vietnamese folk illustrations", era: "Rural Vietnam", genre: "folk horror", videoGenre: "folk_horror", stylePreset: Q.PRESET, cast: Q.CAST, places: Q.PLACES, chapters: [{ id: Q.CHAPTER, title: Q.TITLE }], facts: [] };
const script: MotionStoryScript = {
  title: Q.TITLE,
  language: "vi",
  voiceChannel: Q.CHANNEL,
  beats: Q.ROWS.map((row, index) => {
    const data = row as any;
    const pieces = data.text
      ? [{ speaker: "narrator", role: "narration", text: data.text }]
      : [
          { speaker: "narrator", role: "narration", text: data.before },
          { speaker: data.speaker, role: "dialogue", text: data.say },
          { speaker: "narrator", role: "narration", text: data.after },
        ];
    const narration = pieces.map((piece) => piece.text).join(" ");
    const id = String(index + 1);
    return { id, chapterId: Q.CHAPTER, narration, visual: "scene", place: row.place, time: index === Q.ROWS.length - 1 ? "day" : "night", cast: [...row.cast], action: narration, utterances: pieces.map((piece, part) => ({ ...piece, id: id + "-" + part, emotion: "neutral", intensity: 0.1, speed: 1, pauseBefore: 0.08, pauseAfter: 0.25, emphasis: [] })) as any };
  }),
};
if (process.argv.includes("--retry")) {
  const previous = JSON.parse(fs.readFileSync(path.join(root, "scenes-status.json"), "utf8"));
  script.gen = previous.result?.gen;
  if (script.gen?.puppet) Object.assign(script.gen.puppet, { reads: {}, frames: {}, sets: {}, props: {}, places: {}, placementKeys: {}, pack: undefined });
}
if (process.argv.includes(Q.RESUME_FLAG)) {
  const previous = JSON.parse(fs.readFileSync(path.join(root, "scenes-status.json"), "utf8"));
  if (previous.result) Object.assign(script, previous.result);
}
save("input", { script, analysis });
if (process.argv.includes("--start") || process.argv.includes("--retry") || process.argv.includes(Q.RESUME_FLAG)) {
  const request = { script, analysis, stylePreset: Q.PRESET, characterMotion: false, review: !process.argv.includes(Q.NO_REVIEW_FLAG), autoVoice: true, asrCheck: true, aspect: "16:9", aiExecution: { provider: "gemini-chat", model: "gemini-flash::low", mode: "room-only", chromeHeadless: true } };
  save("request", request);
  const result = await post(API.MOTION_STORY_SCENES, request);
  save("job", result.job);
}
if (process.argv.includes("--follow")) {
  const initial = JSON.parse(fs.readFileSync(path.join(root, "job.json"), "utf8"));
  const built = await follow(API.MOTION_STORY_STATUS, initial.id, "scenes-status");
  save("built", built);
}
if (process.argv.includes("--render")) {
  const built = JSON.parse(fs.readFileSync(path.join(root, "built.json"), "utf8"));
  const compiled = await post(API.MOTION_STORY_COMPILE, { script: built, analysis, aspect: "16:9", durations: built.voiceTrack?.durations, voiceTrack: built.voiceTrack });
  save("compiled", compiled);
  const spec = { ...compiled.spec, kit: { ...compiled.spec.kit, motion: false } };
  const render = await post(API.MOTION_VIDEO_RENDER, { spec, options: { aspect: "16:9", quality: "draft", fps: 24, encoder: "cpu", title: Q.TITLE, audioId: built.voiceTrack?.audioId, audioVolume: 1 } });
  save("render-job", render.job);
  const result = await follow(API.MOTION_VIDEO_STATUS, render.job.id, "render-status");
  save("result", result);
  process.stdout.write(JSON.stringify(result) + "\n");
}
