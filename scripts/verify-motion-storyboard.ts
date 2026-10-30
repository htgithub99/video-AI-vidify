import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import { STORYBOARD_QA as T } from "./motionStoryboardVerificationTexts.js";
import * as MR from "../src/constants/motionRuntime.js";
import { MOTION_VISUAL_CONTRACT as V } from "../src/constants/motionVisualContract.js";
import { PUPPET as P } from "../src/constants/motionPuppet.js";
import { MOTION_STORYBOARD as S } from "../src/constants/motionStoryboard.js";
import { collectPuppetLines, puppetBeatLines } from "../src/lib/motionPuppet.js";
import { collectPuppetVisualLines, puppetBeatVisualLines, puppetStoryboardCovers, puppetStoryboardInputKey, puppetVisualLines, puppetWords } from "../src/lib/motionStoryboard.js";
import { parsePuppetStoryboard, planPuppetStoryboard } from "../src/features/motion/server/services/puppet/storyboard.js";
import { puppetBeatFrames, puppetSceneShot, linkPuppetVisualFrames } from "../src/features/motion/server/services/puppet/compilePuppet.js";
import { qaPuppet } from "../src/features/motion/server/services/puppet/qa.js";
import { composePuppetLines, readPuppetLines } from "../src/features/motion/server/services/puppet/director.js";
import { openStillSession } from "../src/features/motion/server/services/motionRenderService.js";
import { compileStorySpec } from "../src/features/motion/server/services/motionDirectorService.js";
import { puppetWordTimeline } from "../src/features/motion/server/services/puppet/storyboardTiming.js";
import { directPuppetSound } from "../src/features/motion/server/services/puppet/sound.js";
import type { PuppetGen, PuppetStoryboard, PuppetRead } from "../src/types/motionPuppet.js";
import type { MotionBeat, MotionStoryScript, MotionVoiceClip } from "../src/types/motionVideo.js";
import type { MotionSpec } from "../src/types/motionVideo.js";
const common = { chapterId: T.CHAPTER, visual: MR.MOTION_TEXT_SCENE, place: T.PLACE, time: P.NIGHT, cast: [T.A, T.B] };
const utterance = (index: number, speaker = T.NARRATOR as string, role = MR.MOTION_TEXT_NARRATION as string) => ({ id: String(index), text: T.SOURCE[index], speaker, role });
const beats: MotionBeat[] = [
  { ...common, id: T.BEATS[0], narration: T.SOURCE.slice(0, 2).join(P.SPACE), utterances: [utterance(0), utterance(1, T.A, P.DIALOGUE)] as any },
  { ...common, id: T.BEATS[1], narration: T.SOURCE.slice(2, 4).join(P.SPACE), utterances: [utterance(2, T.B, P.DIALOGUE), utterance(3)] as any },
  { ...common, id: T.BEATS[2], narration: T.SOURCE[4], utterances: [utterance(4)] as any },
];
const script = { beats, gen: { puppet: { narratorKey: T.NARRATOR } } } as MotionStoryScript;
const source = collectPuppetLines(script, MR.MOTION_TEXT_SCENE);
assert.equal(source.length, 5);
const analysis: any = { title: T.SCENE, logline: T.SHOWS[0], cast: [T.A, T.B].map((key) => ({ key, name: key })), videoGenre: T.GENRES[0] };
const response = {
  units: [
    { from: { line: 0 }, scene: T.SCENE, purpose: S.PURPOSES[0], show: T.SHOWS[0] },
    { from: { line: 3 }, scene: T.SCENE, purpose: S.PURPOSES[1], show: T.SHOWS[1] },
    { from: { line: 3, cue: T.CUE }, scene: T.SCENE, purpose: S.PURPOSES[2], show: T.SHOWS[2] },
    { from: { line: 4 }, scene: T.SCENE, purpose: S.PURPOSES[3], show: T.SHOWS[3] },
  ],
};
const inputKey = puppetStoryboardInputKey(source, analysis);
const units = parsePuppetStoryboard(response, source, 0, inputKey)!;
assert.ok(units);
const storyboard: PuppetStoryboard = { version: S.VERSION, inputKey, units };
assert.ok(puppetStoryboardCovers(storyboard, source));
assert.equal(units[0].sources.length, 3);
assert.equal(units[1].sources[0].to, 4);
assert.equal(units[2].sources[0].from, 4);
const decomposed = source.map((line) => ({ ...line, text: line.text.normalize(T.NFD) }));
assert.equal(puppetWords(decomposed[3].text).length, puppetWords(source[3].text).length);
assert.equal(parsePuppetStoryboard(response, decomposed, 0, inputKey)![2].sources[0].from, 4);
const visual = puppetVisualLines(source, storyboard);
assert.equal(visual.length, 4);
assert.equal(visual[0].sourcePlans?.length, 2);
assert.deepEqual(visual[0].speakers, [T.A, T.B]);
assert.equal(visual[0].speaker, undefined);
assert.ok(!visual[1].text.includes(T.CUE));
assert.ok(visual[2].text.startsWith(T.CUE));
for (const invalid of [{ units: response.units.slice(1) }, { units: [response.units[1], response.units[0]] }, { units: [{ ...response.units[0], from: { line: -1 } }] }, { units: [{ ...response.units[0], from: { line: "0" } }] }, { units: [{ ...response.units[0], show: P.EMPTY }] }, { units: [response.units[0], { ...response.units[2], from: { line: 3, cue: T.NEW_SHOW } }] }])
  assert.equal(parsePuppetStoryboard(invalid, source, 0, inputKey), null);
const repeated = [{ ...source[0], text: T.AMBIGUOUS }];
assert.equal(parsePuppetStoryboard({ units: [response.units[0], { ...response.units[0], from: { line: 0, cue: T.REPEATED_CUE } }] }, repeated, 0, inputKey), null);
const repeatedPlan = parsePuppetStoryboard({ units: [response.units[0], { ...response.units[0], from: { line: 0, cue: T.REPEATED_CUE, occurrence: 2 } }] }, repeated, 0, inputKey)!;
assert.equal(repeatedPlan[1].sources[0].from, 4);
assert.equal(puppetStoryboardCovers({ ...storyboard, units: units.slice(1) }, source), false);
assert.equal(puppetStoryboardCovers({ ...storyboard, version: 0 }, source), false);
assert.equal(puppetStoryboardCovers({ ...storyboard, units: [null] } as any, source), false);
assert.equal(puppetStoryboardCovers({ ...storyboard, units: [{ ...units[0], show: 1 }] } as any, source), false);
assert.equal(puppetStoryboardCovers({ ...storyboard, units: [{ ...units[0], sources: [null] }] } as any, source), false);
assert.equal(
  puppetStoryboardCovers(
    storyboard,
    source.map((line, index) => (index ? line : { ...line, text: T.AMBIGUOUS })),
  ),
  false,
);
const frames = Object.fromEntries(
  units.map((unit, index) => [
    unit.key,
    {
      shot: index === 2 ? T.CLOSE : P.SHOT_DEFAULT,
      set: T.PLACE,
      light: P.NIGHT,
      actors: [
        { char: T.A, pose: P.POSE_DEFAULT, expr: P.EXPR_DEFAULT, face: P.FACE_DEFAULT },
        { char: T.B, pose: P.POSE_DEFAULT, expr: P.EXPR_DEFAULT, face: P.FACE_DEFAULT },
      ],
      camera: { move: P.MOVE_DEFAULT },
    },
  ]),
);
const gen = { narratorKey: T.NARRATOR, storyboard, frames, places: {}, characters: {}, props: {}, sets: {} } as PuppetGen;
script.gen!.puppet = gen;
assert.equal(collectPuppetVisualLines(script, MR.MOTION_TEXT_SCENE).length, 4);
assert.equal(puppetBeatVisualLines(beats[0], gen).length, 1);
assert.equal(puppetBeatVisualLines(beats[1], gen).length, 3);
const clip = (line: number, beat: number, start: number, end: number, speaker: string): MotionVoiceClip => ({ id: String(line), beatId: T.BEATS[beat], speaker, voiceId: P.EMPTY, audioId: P.EMPTY, text: T.SOURCE[line], start, end, words: puppetWords(T.SOURCE[line]).map((_word, index, words) => [((end - start) * index) / words.length, ((end - start) * (index + 1)) / words.length]) });
const clips = [clip(0, 0, 0, 4, T.NARRATOR), clip(1, 0, 4, 12, T.A), clip(2, 1, 12, 16, T.B), clip(3, 1, 16, 24, T.NARRATOR), clip(4, 2, 24, 30, T.NARRATOR)];
clips[3].words = [0, 0.4, 0.7, 1.2, 3.8, 4.1, 4.4, 4.8, 5.1, 5.8, 6.4].map((at) => [at, at + 0.2]);
const first = puppetBeatFrames(beats[0], gen, 0, 12, clips.slice(0, 2));
assert.equal(first.length, 2);
assert.equal(first[0].visualId, first[1].visualId);
assert.equal(first[0].speaker, undefined);
assert.equal(first[1].speaker, T.A);
const second = puppetBeatFrames(beats[1], gen, 12, 24, clips.slice(2, 4));
assert.equal(second.length, 3);
assert.equal(second[0].speaker, T.B);
assert.equal(second[1].speaker, undefined);
assert.equal(second[2].start, 19.8);
assert.equal(second[2].timing, "words");
assert.notEqual(second[2].start, (second[1].start + second[2].end) / 2);
assert.ok(second[1].narration && !second[1].narration.includes(T.CUE));
const estimated = puppetBeatFrames(beats[1], gen, 12, 24, []);
assert.equal(estimated[2].timing, "estimated");
assert.ok(estimated[2].start > estimated[1].start);
const sameSpeaker = structuredClone(beats[0]);
sameSpeaker.utterances![1].role = MR.MOTION_TEXT_NARRATION;
const sameSource = puppetBeatLines(sameSpeaker, T.NARRATOR);
const sameUnits = parsePuppetStoryboard({ units: [response.units[0]] }, sameSource, 0, inputKey)!;
const sameGen = { ...gen, storyboard: { ...storyboard, units: sameUnits }, frames: { [sameUnits[0].key]: frames[units[0].key] } };
assert.equal(puppetBeatFrames(sameSpeaker, sameGen, 0, 12, []).length, 1);
const shots = [puppetSceneShot(beats[0], gen, 0, 12, clips.slice(0, 2), { [T.A]: [[4, 11]] })!, puppetSceneShot(beats[1], gen, 12, 24, clips.slice(2, 4), { [T.B]: [[0, 4]] })!];
linkPuppetVisualFrames(shots);
const firstFrames = (shots[0].params as any).frames;
const secondFrames = (shots[1].params as any).frames;
assert.equal(firstFrames[0].visualStart, 0);
assert.equal(firstFrames[1].visualEnd, 16);
assert.equal(secondFrames[0].visualStart, 0);
assert.deepEqual(firstFrames[0].speech, []);
assert.deepEqual(firstFrames[1].speech, [[4, 11]]);
assert.deepEqual(secondFrames[0].speech, [[12, 16]]);
assert.deepEqual(secondFrames[1].speech, []);
const fullScript = { ...script, beats: beats.map((beat, index) => ({ ...beat, duration: [12, 12, 6][index] })) };
const fullAnalysis = { ...analysis, places: [], chapters: [] };
const noVoice = compileStorySpec(fullScript, fullAnalysis, { aspect: MR.MOTION_TEXT_16_9, continuousVoice: true });
assert.throws(() => compileStorySpec({ ...fullScript, gen: { ...fullScript.gen, puppet: { ...gen, storyboard: { ...storyboard, units: storyboard.units.slice(0, 1) } } } }, fullAnalysis, { aspect: MR.MOTION_TEXT_16_9 }), { message: S.INVALID });
const origin = noVoice.starts[0];
const fullClips = clips.map((value) => ({ ...value, start: value.start + origin, end: value.end + origin }));
const compiled = compileStorySpec(fullScript, fullAnalysis, { aspect: MR.MOTION_TEXT_16_9, continuousVoice: true, voiceTrack: { clips: fullClips } as any });
const splitVoicePlan = {
  beats: beats.map((beat, index) => ({
    id: beat.id,
    utterances: index
      ? beat.utterances
      : beat.utterances!.flatMap((utterance, part) =>
          part
            ? [utterance]
            : [
                { ...utterance, text: utterance.text.split(P.SPACE).slice(0, 2).join(P.SPACE) },
                { ...utterance, id: utterance.id + P.DASH, text: utterance.text.split(P.SPACE).slice(2).join(P.SPACE) },
              ],
        ),
  })),
};
const compiledSplitVoice = compileStorySpec(fullScript, fullAnalysis, { aspect: MR.MOTION_TEXT_16_9, continuousVoice: true, voiceTrack: { clips: fullClips, plan: splitVoicePlan } as any });
assert.deepEqual(
  compiledSplitVoice.spec.shots.map((shot) => (shot.params as any).frames?.map((frame: any) => frame.visualId)),
  compiled.spec.shots.map((shot) => (shot.params as any).frames?.map((frame: any) => frame.visualId)),
);
const compiledFirst = (compiled.spec.shots[0].params as any).frames;
const compiledSecond = (compiled.spec.shots[1].params as any).frames;
assert.equal(compiledSecond[2].start, +(19.8 + origin).toFixed(3));
assert.equal(compiledFirst[0].visualStart, compiledSecond[0].visualStart);
assert.equal(compiledFirst[1].visualEnd, compiledSecond[0].visualEnd);
assert.deepEqual(compiledFirst[0].speech, []);
assert.ok(compiledFirst[1].speech.length && compiledSecond[0].speech.length);
assert.deepEqual(compiledSecond[1].speech, []);
assert.ok(compiled.spec.subtitles?.length);
const tiny = compileStorySpec(fullScript, fullAnalysis, { aspect: MR.MOTION_TEXT_16_9, continuousVoice: true, durations: beats.map(() => 0.6) });
for (const shot of tiny.spec.shots) for (const frame of (shot.params as any).frames) assert.ok(frame.end > frame.start && frame.start >= shot.start && frame.end <= shot.end);
const unmatched = source.slice(0, 3);
const partial = puppetWordTimeline(unmatched, [clip(0, 0, 0, 8, T.NARRATOR), { ...clip(1, 0, 8, 10, T.A), text: T.UNMATCHED }, clip(2, 0, 10, 12, T.B)], 0, 12);
const partialAt = [...partial.values()].flat().map((word) => word.at);
assert.ok(partialAt.every((at, index) => !index || at > partialAt[index - 1]));
assert.ok(partial.get(unmatched[1].key)!.every((word) => word.timing === "estimated"));
const hyphenated = [{ ...source[0], text: T.HYPHENATED }];
const hyphenTimes = puppetWordTimeline(
  hyphenated,
  [
    {
      ...clips[0],
      text: T.HYPHENATED,
      start: 0,
      end: 6,
      words: [
        [0, 0.4],
        [1, 1.4],
        [2, 2.4],
        [3, 3.8],
        [4, 4.8],
      ],
    },
  ],
  0,
  6,
).get(hyphenated[0].key)!;
assert.equal(hyphenTimes.length, 6);
assert.ok(hyphenTimes.every((word) => word.timing === "words"));
assert.ok(hyphenTimes[4].at > hyphenTimes[3].at);
const broken = puppetWordTimeline(source.slice(0, 1), [{ ...clips[0], words: clips[0].words!.map(() => [NaN, -1]) }], 0, 4).get(source[0].key)!;
assert.ok(broken.every((word) => Number.isFinite(word.at) && word.timing === "estimated"));
const options: any = { exec: {}, log() {}, ai: async () => response };
for (const genre of T.GENRES) {
  const profile = { ...analysis, videoGenre: genre };
  const planned = await planPuppetStoryboard(source, beats, profile, {
    ...options,
    ai: async (prompt: string) => {
      assert.ok(prompt.includes(genre));
      return response;
    },
  });
  assert.ok(puppetStoryboardCovers(planned, source));
  if (genre !== analysis.videoGenre) assert.notEqual(planned.inputKey, inputKey);
}
let attempts = 0;
await planPuppetStoryboard(source, beats, analysis, { ...options, ai: async () => (++attempts === 1 ? { units: [] } : response) });
assert.equal(attempts, 2);
attempts = 0;
let exhaustedPlan: PuppetStoryboard | undefined;
await assert.rejects(
  planPuppetStoryboard(
    source,
    beats,
    analysis,
    {
      ...options,
      ai: async () => {
        attempts++;
        return { units: [] };
      },
    },
    undefined,
    {},
    (plan) => {
      exhaustedPlan = structuredClone(plan);
    },
  ),
);
assert.equal(attempts, S.ATTEMPTS);
assert.equal(Object.values(exhaustedPlan!.repairStates!)[0].rejected, S.ATTEMPTS);
await assert.rejects(
  planPuppetStoryboard(
    source,
    beats,
    analysis,
    {
      ...options,
      ai: async () => {
        attempts++;
        return response;
      },
    },
    exhaustedPlan,
  ),
);
assert.equal(attempts, S.ATTEMPTS);
for (const barrier of [MR.MOTION_TEXT_TITLE, T.OTHER_PLACE, T.OTHER_CHAPTER, P.DAY]) {
  const splitBeats = structuredClone(beats);
  if (barrier === MR.MOTION_TEXT_TITLE) splitBeats.splice(1, 0, { ...splitBeats[0], id: barrier, visual: barrier });
  else
    for (const beat of splitBeats.slice(1)) {
      if (barrier === T.OTHER_PLACE) beat.place = barrier;
      else if (barrier === T.OTHER_CHAPTER) beat.chapterId = barrier;
      else beat.time = barrier;
    }
  const splitSource = collectPuppetLines({ ...script, beats: splitBeats }, MR.MOTION_TEXT_SCENE);
  const groups: number[][] = [];
  const ai = async (prompt: string) => {
    const requested = JSON.parse(prompt.split(S.REQUESTED)[1].split(P.NL)[0]);
    groups.push(requested.map((row: any) => row.line));
    return { units: [{ ...response.units[0], from: { line: requested[0].line } }] };
  };
  const savedPlans: PuppetStoryboard[] = [];
  const splitPlan = await planPuppetStoryboard(splitSource, splitBeats, analysis, { ...options, ai }, undefined, {}, (plan) => savedPlans.push(structuredClone(plan)));
  assert.equal(groups.length, 2);
  assert.ok(puppetStoryboardCovers(splitPlan, splitSource));
  assert.equal(splitPlan.units[0].sources.length, 2);
  assert.ok(savedPlans.some((plan) => plan.units.length === 1));
  assert.ok(puppetStoryboardCovers(savedPlans.at(-1), splitSource));
  groups.length = 0;
  const partial = { ...splitPlan, units: splitPlan.units.slice(0, 1) };
  const resumed = await planPuppetStoryboard(splitSource, splitBeats, analysis, { ...options, ai }, partial);
  assert.equal(groups.length, 1);
  assert.equal(resumed.units[0], partial.units[0]);
  assert.ok(puppetStoryboardCovers(resumed, splitSource));
  groups.length = 0;
  const redone = await planPuppetStoryboard(splitSource, splitBeats, analysis, { ...options, ai }, splitPlan, { [splitPlan.units[1].key]: T.ERROR });
  assert.equal(groups.length, 1);
  assert.equal(redone.units[0], splitPlan.units[0]);
}
const cancelled = new AbortController();
await assert.rejects(
  planPuppetStoryboard(source, beats, analysis, {
    ...options,
    signal: cancelled.signal,
    ai: async () => {
      cancelled.abort();
      return response;
    },
  }),
);
const marked: string[] = [];
await qaPuppet([{ t: 1, text: visual[1].text, line: units[1].key, lines: [units[1].key], file: T.IMAGE, abs: T.IMAGE }], analysis, { ...options, replan: (keys) => marked.push(...keys), ai: async () => ({ checks: [{ i: 0, ok: false, problem: T.ERROR, replan: true }] }) });
assert.deepEqual(marked, [units[1].key]);
const repaired = await planPuppetStoryboard(
  source,
  beats,
  analysis,
  {
    ...options,
    ai: async (prompt: string) => {
      assert.ok(prompt.includes(T.ERROR));
      return { units: response.units.map((unit, index) => (index === 2 ? { ...unit, show: T.NEW_SHOW } : unit)) };
    },
  },
  storyboard,
  { [units[1].key]: T.ERROR },
);
assert.notEqual(repaired.units[2].key, units[2].key);
const read: PuppetRead = { visual: { scene: T.SCENE, timeline: V.PRESENT, evidence: [T.SHOWS[0]], fixtures: [] }, focus: T.A, who: [T.A, T.B], states: [T.A, T.B].map((char) => ({ char, posture: P.POSE_DEFAULT, action: P.ACTION_DEFAULT })), place: T.PLACE, action: P.ACTION_DEFAULT, emotion: P.EXPR_DEFAULT, overlays: [] };
const readResult = await readPuppetLines(
  [visual[0]],
  visual,
  analysis,
  { [T.PLACE]: { key: T.PLACE } as any },
  {},
  {
    ...options,
    ai: async (prompt: string) => {
      assert.ok(prompt.includes(T.SHOWS[0]));
      return { lines: [{ i: 0, ...read }] };
    },
  },
);
assert.equal(readResult.reads[visual[0].key].visual?.scene, units[0].scene);
const composed = await composePuppetLines([visual[0]], visual, analysis, { [visual[0].key]: read }, {}, { spots: () => [], spotsText: () => P.EMPTY, framing: P.EMPTY }, { ...options, ai: async () => ({ frames: [{ i: 0, ...frames[units[0].key], shot2: frames[units[2].key] }] }) });
assert.ok(!composed[visual[0].key].shot2);
let soundCalls = 0;
const soundPrompts: string[] = [];
const soundScript = structuredClone(script);
const soundOptions = {
  ...options,
  direction: {} as any,
  ai: async (prompt: string) => {
    soundCalls++;
    soundPrompts.push(prompt);
    return { beats: beats.map((beat) => ({ id: beat.id, soundEvents: [] })) };
  },
};
await directPuppetSound(soundScript, fullAnalysis, gen, soundOptions);
assert.ok(soundCalls > 0);
assert.ok(soundPrompts.some((prompt) => prompt.includes(units[0].key)));
assert.ok(soundPrompts.some((prompt) => prompt.includes(units[2].key) && prompt.includes(T.SHOWS[2])));
const cachedSoundCalls = soundCalls;
await directPuppetSound(soundScript, fullAnalysis, gen, soundOptions);
assert.equal(soundCalls, cachedSoundCalls);
process.stdout.write(T.PASSED);
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  await page.setContent(T.HTML);
  for (const file of T.FILES) await page.addScriptTag({ content: await fs.readFile(file, T.UTF8) });
  const policies = await page.evaluate(
    ({ before, after, changed }) => {
      const me = (window as any).MotionEngine;
      return { hold: me.puppetTransition(before, after), change: me.puppetTransition(after, changed), before: me.puppetCameraProgress(before, 12), after: me.puppetCameraProgress(after, 12), stopped: me.puppetCameraProgress(after, 16) };
    },
    { before: firstFrames[1], after: secondFrames[0], changed: secondFrames[1] },
  );
  assert.equal(policies.hold.duration, 0);
  assert.ok(policies.change.duration > 0);
  assert.equal(policies.before, policies.after);
  assert.ok(policies.stopped >= policies.after);
  const kit = await page.evaluate((values) => {
    const constants = (window as any).MotionEngineText.PUPPET;
    return { style: constants.STYLE_DEFAULT, motion: false, characters: Object.fromEntries([values.A, values.B].map((key, index) => [key, { height: 1, colors: { body: values.COLORS[index] }, head: {}, body: {}, sprites: {} }])), sets: { [values.PLACE]: { svg: values.SET_SVG, floorY: 950, wallY: 850, lights: [], time: "night" } }, props: {} };
  }, T);
  const spec = { aspect: MR.MOTION_TEXT_16_9, fps: 30, duration: 24, shots, kit, subtitles: [] } as MotionSpec;
  const directory = path.resolve(T.OUT);
  await fs.mkdir(directory, { recursive: true });
  const session = await openStillSession();
  try {
    const stills = await session.render(
      spec,
      [2, 4.5, 12.1, 19.7, 22].map((t, index) => ({ id: T.STILL + index, t })),
      directory,
      { width: 960, height: 540 },
    );
    assert.equal(stills.length, 5);
    for (const still of stills) assert.ok((await fs.stat(still.file)).size > 1000);
    const pixels = await page.evaluate(
      async (urls) => {
        return Promise.all(
          urls.map(async (url) => {
            const img = new Image();
            img.src = url;
            await img.decode();
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d")!;
            ctx.drawImage(img, 0, 0);
            return Array.from(ctx.getImageData(0, 0, canvas.width, canvas.height).data);
          }),
        );
      },
      await Promise.all([stills[3], stills[4]].map(async (still) => T.JPEG_DATA + (await fs.readFile(still.file)).toString("base64"))),
    );
    const pixelDifference = pixels[0].reduce((sum, value, index) => sum + Math.abs(value - pixels[1][index]), 0) / pixels[0].length;
    assert.ok(pixelDifference > T.PIXEL_DIFFERENCE);
    await fs.writeFile(path.join(directory, T.JSON), JSON.stringify({ policies, pixelDifference, stills, units, frames: [...firstFrames, ...secondFrames] }, null, 2));
  } finally {
    await session.close();
  }
  process.stdout.write(T.RENDER_PASSED);
} finally {
  await browser.close();
}
