import { VERIFICATION_VALUES as VT } from "./motionVerificationValues.js";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import { chromium } from "playwright";
import { MOTION_SPEECH_VERIFICATION as V } from "./motionSpeechVerificationTexts.ts";
import { PUPPET as P } from "../src/constants/motionPuppet.ts";
import { MOTION_VOICE as C } from "../src/constants/motionVoice.ts";
import type { MotionUtterance } from "../src/types/motionVideo.ts";
const previousStorage = process.env.VIDIFY_STORAGE_DIR;
const directory = path.resolve(V.STORAGE(process.pid));
process.env.VIDIFY_STORAGE_DIR = directory;
let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
try {
  const { normalizeMotionUtterances, motionNarratorLines, motionNarratorCastKey } = await import("../src/lib/motionVoice.ts");
  const { motionQuotedSpeech } = await import("../src/lib/motionSpeech.ts");
  const { puppetBeatLines } = await import("../src/lib/motionPuppet.ts");
  const { compileStorySpec } = await import("../src/features/motion/server/services/motionDirectorService.ts");
  const { puppetBeatFrames } = await import("../src/features/motion/server/services/puppet/compilePuppet.ts");
  const { normalizeBeats } = await import("../src/features/motion/server/services/motionStoryService.ts");
  const { directMotionVoice } = await import("../src/features/motion/server/services/motionVoiceDirectionService.ts");
  const role = (speaker: string, text: string, kind: MotionUtterance["role"], id = speaker): MotionUtterance => ({ id, speaker, role: kind, text, emotion: VT.NEUTRAL, speed: 1, pauseBefore: 0, pauseAfter: 0, emphasis: [] });
  const narrator = role(V.NARRATOR, V.NARRATION, VT.DIALOGUE);
  const normalized = normalizeMotionUtterances([{ ...narrator, role: VT.NARRATION }], V.CHAPTER, [C.NARRATOR, V.NARRATOR], V.NARRATION);
  assert.equal(normalized[0].role, VT.NARRATION);
  assert.equal(motionNarratorLines(normalized, V.NARRATOR, V.NARRATION)[0].speaker, C.NARRATOR);
  assert.equal(motionNarratorLines([narrator], V.NARRATOR, V.NARRATION)[0].role, VT.NARRATION);
  assert.ok(motionQuotedSpeech(V.ATTRIBUTION + V.SPACE + V.QUOTE, V.QUOTE));
  assert.ok(motionQuotedSpeech(V.QUOTE, V.QUOTE));
  assert.ok(motionQuotedSpeech(V.DIRECT + V.SPACE + V.ATTRIBUTION + V.SPACE + V.QUOTE, V.QUOTE));
  assert.ok(!motionQuotedSpeech(V.NARRATION, V.NARRATION));
  const dialogue = role(V.NARRATOR, V.QUOTE, VT.DIALOGUE);
  assert.equal(motionNarratorLines([dialogue], V.NARRATOR, V.QUOTE)[0].speaker, V.NARRATOR);
  const analysis: any = {
    title: V.TITLE,
    cast: [
      { key: V.NARRATOR, name: V.NARRATOR, gender: VT.MALE, narrator: true },
      { key: V.OTHER, name: V.OTHER, gender: VT.MALE },
    ],
    places: [],
    chapters: [],
  };
  assert.equal(motionNarratorCastKey(analysis), V.NARRATOR);
  assert.equal(normalizeBeats([{ narration: V.NARRATION, utterances: [narrator] }], V.CHAPTER, analysis)[0].utterances?.[0].role, VT.NARRATION);
  const utterances = [[narrator], [role(C.NARRATOR, V.ATTRIBUTION, VT.NARRATION), dialogue], [role(V.OTHER, V.DIRECT, VT.DIALOGUE)], [role(V.OTHER, V.OFFSCREEN, VT.OFFSCREEN)], [role(V.OTHER, V.THOUGHT, VT.THOUGHT)]];
  const beats = utterances.map((lines, index) => ({ id: String(index), chapterId: V.CHAPTER, visual: VT.SCENE, narration: lines.map((line) => line.text).join(V.SPACE), utterances: lines, duration: 8, place: V.ROOM, cast: [V.NARRATOR, V.OTHER] }));
  const frames: Record<string, any> = {};
  for (const beat of beats)
    for (const line of puppetBeatLines(beat))
      frames[line.key] = {
        shot: VT.PEOPLE,
        speaker: V.NARRATOR,
        actors: [
          { char: V.NARRATOR, pose: VT.TALK, expr: VT.NEUTRAL, face: VT.FRONT, depth: VT.MID },
          { char: V.OTHER, pose: VT.IDLE, expr: VT.NEUTRAL, face: VT.FRONT, depth: VT.MID },
        ],
        shot2: { shot: VT.CLOSE, speaker: V.NARRATOR, actors: [{ char: V.NARRATOR, pose: VT.IDLE, expr: VT.NEUTRAL, face: VT.FRONT, depth: VT.MID }] },
      };
  const gen: any = { characterMotion: false, puppet: { version: 1, styleId: V.STYLE, characters: {}, sets: {}, props: {}, frames } };
  const script: any = { title: V.TITLE, language: VT.VI, beats, gen };
  const original = JSON.stringify(script);
  const timing = compileStorySpec(script, analysis, { aspect: VT.VALUE_16_9 });
  const clips = beats.flatMap((beat, index) =>
    beat.utterances.map((line, lineIndex) => ({
      id: line.id,
      beatId: beat.id,
      speaker: line.speaker,
      voiceId: V.VOICE,
      text: line.text,
      audioId: V.EMPTY,
      start: timing.starts[index] + 0.6 + lineIndex * 2,
      end: timing.starts[index] + 2.2 + lineIndex * 2,
      words: [
        [0, 0.3],
        [0.8, 1.1],
      ],
    })),
  );
  const compiled = compileStorySpec(script, analysis, { aspect: VT.VALUE_16_9, voiceTrack: { clips, durations: beats.map(() => 8) } as any });
  const shot = (index: number) => compiled.spec.shots.find((value) => value.id === beats[index].id)!;
  for (const index of [0, 3, 4])
    for (const frame of (shot(index).params as any).frames) {
      assert.ok(!frame.speaker);
      assert.deepEqual(frame.speech, []);
    }
  assert.ok((shot(1).params as any).frames.some((frame: any) => frame.speaker === V.NARRATOR && frame.speech.length));
  assert.ok((shot(2).params as any).frames.some((frame: any) => frame.speaker === V.OTHER && frame.speech.length));
  const dialogueClip = clips.find((clip) => clip.beatId === beats[2].id)!;
  const speechFrames = (words?: number[][]) => {
    const result = compileStorySpec(script, analysis, { aspect: VT.VALUE_16_9, voiceTrack: { clips: [{ ...dialogueClip, words }], durations: beats.map(() => 8) } as any });
    return (result.spec.shots.find((value) => value.id === beats[2].id)!.params as any).frames;
  };
  const fallbackFrames = speechFrames();
  assert.ok(fallbackFrames.some((frame: any) => frame.speech.length));
  for (const frame of fallbackFrames)
    for (const [from, to] of frame.speech) {
      assert.ok(from + V.TIME_EPSILON >= Math.max(frame.start, dialogueClip.start));
      assert.ok(to <= Math.min(frame.end, dialogueClip.end) + V.TIME_EPSILON);
    }
  for (const frame of speechFrames([
    [-2, -1],
    [2, 1],
    [NaN, 3],
  ]))
    assert.deepEqual(frame.speech, []);
  for (const frame of speechFrames([[-1, 99]]))
    for (const [from, to] of frame.speech) {
      assert.ok(from + V.TIME_EPSILON >= Math.max(frame.start, dialogueClip.start));
      assert.ok(to <= Math.min(frame.end, dialogueClip.end) + V.TIME_EPSILON);
    }
  for (const shot of timing.spec.shots) for (const frame of (shot.params as any).frames) assert.deepEqual(frame.speech, []);
  assert.equal(JSON.stringify(script), original);
  const shortBeat: any = { ...beats[0], utterances: [role(C.NARRATOR, V.NARRATION, VT.NARRATION), dialogue] };
  const shortGen = { ...gen.puppet, frames: { ...gen.puppet.frames, [puppetBeatLines(shortBeat)[1].key]: frames[puppetBeatLines(beats[1])[1].key] } };
  const shortFrames = puppetBeatFrames(shortBeat, shortGen, 0, 0.8, []);
  assert.equal(shortFrames.length, 2);
  assert.ok(!shortFrames[0].speaker);
  assert.equal(shortFrames[1].speaker, V.NARRATOR);
  const voices: any[] = [
    { id: V.VOICE, name: V.VOICE, gender: VT.MALE },
    { id: V.OTHER_VOICE, name: V.OTHER_VOICE, gender: VT.MALE },
  ];
  const voiceScript: any = { ...script, beats: [beats[0]], gen: { voiceCast: { narrator: V.VOICE, [V.NARRATOR]: V.VOICE, [V.OTHER]: V.OTHER_VOICE } } };
  const options: any = {
    exec: {},
    ai: async () => {
      throw new Error(V.TITLE);
    },
  };
  const plan = await directMotionVoice(voiceScript, analysis, voices, options);
  assert.equal(plan.beats[0].utterances[0].speaker, C.NARRATOR);
  const cache = path.join(directory, VT.OUTPUT, VT.MOTION_VIDEO, VT.TTS_CACHE);
  const planFiles = (await fs.readdir(cache)).filter((file) => file.endsWith(VT.PLAN_JSON));
  assert.equal(planFiles.length, 1);
  await fs.writeFile(path.join(cache, planFiles[0]), JSON.stringify({ ...plan, beats: [{ ...plan.beats[0], utterances: [narrator] }] }));
  assert.equal((await directMotionVoice(voiceScript, analysis, voices, options)).beats[0].utterances[0].speaker, C.NARRATOR);
  const texts = await fs.readFile(V.TEXTS, VT.UTF8),
    core = await fs.readFile(V.CORE, VT.UTF8);
  const engine = (await fs.readFile(V.ENGINE, VT.UTF8)).replace(V.HOOK, V.EXPOSE);
  const sandbox: any = vm.createContext({ console });
  vm.runInContext(texts, sandbox);
  vm.runInContext(core, sandbox);
  vm.runInContext(engine, sandbox);
  const level = sandbox.MotionEngine.speechLevel;
  const speakingFrame = (shot(2).params as any).frames.find((frame: any) => frame.speech.length);
  const from = speakingFrame.speech[0][0];
  const actor = { char: V.OTHER };
  const silentFrame = (shot(0).params as any).frames[0];
  assert.equal(level(silentFrame, { char: V.NARRATOR }, 0.65), 0);
  assert.equal(level(speakingFrame, actor, from - 0.01), 0);
  assert.ok(level(speakingFrame, actor, from + 0.05) > 0);
  assert.equal(level(speakingFrame, actor, from + 0.5), 0);
  assert.ok(level(speakingFrame, actor, from + 0.85) > 0);
  assert.equal(level(speakingFrame, actor, from + 1.2), 0);
  assert.equal(level(speakingFrame, { char: V.NARRATOR }, from + 0.05), 0);
  assert.equal(level({ ...speakingFrame, speech: undefined }, actor, from + 0.05), 0);
  assert.equal(level({ ...speakingFrame, end: from + 0.03 }, actor, from + 0.05), 0);
  let production: any;
  try {
    production = JSON.parse(await fs.readFile(V.PRODUCTION, VT.UTF8));
  } catch {}
  const replay: any[] = [];
  if (production) {
    const source = JSON.parse(production.plan.signature),
      cast = source[4];
    for (const beat of production.plan.beats) {
      const sourceBeat = source[2].find((value: any) => value[0] === beat.id);
      const fixed = motionNarratorLines(beat.utterances, motionNarratorCastKey({ cast } as any), sourceBeat[3]);
      replay.push({ id: beat.id, before: beat.utterances.filter((u: any) => u.speaker === V.NARRATOR && u.role === P.DIALOGUE).length, after: fixed.filter((u: any) => u.speaker === V.NARRATOR && u.role === P.DIALOGUE).length });
    }
    assert.equal(replay[0].after, 0);
    assert.equal(replay[1].after, 0);
  }
  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(path.join(directory, V.REPORT), JSON.stringify({ replay, speech: speakingFrame.speech, narratorFrames: (shot(0).params as any).frames }, null, 2));
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1240, height: 570 } });
  await page.route(V.NETWORK, (route) => route.abort());
  await page.setContent(V.HTML);
  await page.addScriptTag({ content: texts });
  await page.addScriptTag({ content: core });
  await page.addScriptTag({ content: engine });
  await page.evaluate(
    ({ labels, levels, texts: VT }) => {
      const ME = (window as any).MotionEngine,
        S = { style: ME.PUPPET2D.K.STYLE_DEFAULT };
      const L = { headW: 180, headH: 210, headCy: 0 };
      labels.forEach((label, index) => {
        const cell = document.createElement(VT.DIV),
          title = document.createElement(VT.P),
          canvas = document.createElement(VT.CANVAS);
        title.textContent = label;
        canvas.width = 400;
        canvas.height = 210;
        cell.append(title, canvas);
        document.querySelector(VT.SHEET)!.append(cell);
        const g = canvas.getContext(VT.VALUE_2D)!;
        g.translate(200, 110);
        g.fillStyle = VT.F1D9C2;
        g.beginPath();
        g.ellipse(0, 0, 105, 100, 0, 0, Math.PI * 2);
        g.fill();
        ME.drawFace(g, S, L, 0, VT.NEUTRAL, { level: levels[index], t: 0.4 }, 0, 1);
      });
    },
    { labels: V.LABELS, texts: VT, levels: [0, 0, level(speakingFrame, actor, from + 0.05), 0, level(speakingFrame, actor, from + 0.85), 0] },
  );
  await page.locator(V.SHEET).screenshot({ path: path.join(directory, V.STILL) });
  process.stdout.write(V.PASSED);
  process.stdout.write(directory + VT.NEWLINE);
} finally {
  await browser?.close();
  if (previousStorage === undefined) delete process.env.VIDIFY_STORAGE_DIR;
  else process.env.VIDIFY_STORAGE_DIR = previousStorage;
}
