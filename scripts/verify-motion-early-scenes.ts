import assert from "node:assert/strict";
import { motionEarlySceneInput } from "../src/lib/motionProduction.js";
import { createMotionEarlyScenes } from "../src/features/motion/server/services/motionEarlyScenes.js";
import { motionPrerenderEncoding } from "../src/features/motion/server/services/motionSegmentPrerender.js";
import { motionRemotionSegments } from "../src/lib/motionRemotionSegments.js";
const analysis: any = { chapters: [{ id: "c1" }, { id: "c2" }, { id: "c3" }], places: [], cast: [] };
const beat = (id: string, chapterId: string) => ({ id, chapterId, narration: "x " + id });
const script = (ready: string[]): any => ({ title: "t", language: "vi", beats: [beat("b1", "c1"), beat("b2", "c2"), beat("b3", "c3")], readyChapterIds: ready, chapterDrafts: { c3: { pending: [1] } } });
assert.equal(motionEarlySceneInput(script([]), analysis), undefined);
const one = motionEarlySceneInput(script(["c1", "c3"]), analysis)!;
assert.deepEqual(one.analysis.chapters.map((c: any) => c.id), ["c1"]);
assert.deepEqual(one.script.beats.map((b: any) => b.id), ["b1"]);
assert.equal(one.script.chapterDrafts, undefined);
assert.equal(one.script.readyChapterIds, undefined);
assert.equal(motionEarlySceneInput(script(["c2"]), analysis), undefined);
assert.equal(motionEarlySceneInput(script(["c1", "c2", "c3"]), analysis), undefined);
assert.equal(motionEarlySceneInput(script(["c1", "c2"]), analysis)!.ready, 2);
const jobs = new Map<string, any>();
const started: any[] = [];
const lines: string[] = [];
const early = createMotionEarlyScenes({
  stage: "S",
  text: { START: (ready: number, total: number) => `start ${ready}/${total}`, WAIT: "wait", STOPPED: (reason: string) => `stopped ${reason}` },
  analysis: () => analysis,
  start: (input: any, first: boolean) => {
    const id = "j" + started.length;
    assert.equal(first, started.length === 0);
    started.push(input);
    jobs.set(id, { id, status: "rendering", log: ["a"], result: undefined });
    setTimeout(() => jobs.set(id, { id, status: "completed", log: ["a", "b"], result: { gen: { remotion: { updatedAt: started.length } } } }), 20);
    return { job: { id } };
  },
  getJob: (id: string) => jobs.get(id),
  cancel: () => {},
  log: (line: string) => lines.push(line),
  signal: new AbortController().signal,
  pollMs: 5,
});
early.offer(script(["c1"]));
early.offer(script(["c1"]));
await new Promise((r) => setTimeout(r, 60));
assert.equal(started.length, 1);
early.offer(script(["c1", "c2"]));
await new Promise((r) => setTimeout(r, 5));
early.offer(script(["c1", "c2"]));
const gen = await early.settle();
assert.equal(started.length, 2);
assert.equal(started[1].script.beats.length, 2);
assert.equal(started[1].script.gen.remotion.updatedAt, 1);
assert.equal(gen.remotion.updatedAt, 2);
early.offer(script(["c1", "c2"]));
assert.equal(started.length, 2);
assert.ok(lines.some((l) => l.includes("1/3")) && lines.filter((l) => l.endsWith("] b")).length === 2, lines.join("\n"));
const spec: any = { version: 1, aspect: "16:9", fps: 30, width: 1280, height: 720, duration: 2, scenes: [{ id: "s1", beatId: "b1", startFrame: 0, endFrame: 60 }], assets: {}, subtitles: [] };
const pre = motionPrerenderEncoding(spec, "standard");
assert.deepEqual(Object.keys(pre).sort(), ["crf", "height", "width"]);
assert.equal(motionRemotionSegments(spec, pre)[0].key, motionRemotionSegments(spec, { width: pre.width, height: pre.height, crf: pre.crf })[0].key, "pre-rendered segments must reuse the export cache key");
console.log("Early scenes: ready chapter prefix, one early run per new prefix, gen carried to the full run, pre-render cache key matches export passed.");
