import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import { PACK_QA as Q } from "./motionPackVerificationTexts.js";
import { MOTION_PACK as K } from "../src/constants/motionPack.js";
import { PUPPET as P, PUPPET_TYPES as T } from "../src/constants/motionPuppet.js";
import { MOTION_STORYBOARD as S } from "../src/constants/motionStoryboard.js";
import { MOTION_SOUND_CONFIG as SOUND } from "../src/constants/motionSound.js";
import { MOTION_ILLUSTRATION as I } from "../src/constants/motionIllustration.js";
import { isMotionResourceError } from "../src/lib/motionResourceFailure.js";
import { listPuppets, readPuppet, writePuppet, puppetLibDir, livePuppetLibrary } from "../src/features/motion/server/services/puppet/kitLibrary.js";
import { MOTION_LIBRARY_RELEASE as RELEASE } from "../src/constants/motionLibraryRelease.js";
import { puppetPackAssetAllowed, withPuppetPackSnapshot } from "../src/features/motion/server/services/puppet/packPolicy.js";
import { buildScenesPuppet } from "../src/features/motion/server/services/puppet/pipelinePuppet.js";
import { compileStorySpec } from "../src/features/motion/server/services/motionDirectorService.js";
import type { PuppetAsset, PuppetSet } from "../src/types/motionPuppet.js";
import type { MotionStoryAnalysis, MotionStoryScript } from "../src/types/motionVideo.js";
const root = path.resolve(Q.ROOT);
const manifest = JSON.parse(fs.readFileSync(path.join(root, Q.MANIFEST), "utf8"));
const staged: PuppetAsset[] = livePuppetLibrary().version === RELEASE.VERSION ? [] : manifest.records.map((record: any) => JSON.parse(fs.readFileSync(record.path, "utf8")));
const assets = [T.STYLE, T.CHARACTER, T.SET, T.PROP, T.BASE, T.PIECE].flatMap((type) => listPuppets(type)).filter((asset) => Object.values(K.PRESETS).some((id) => puppetPackAssetAllowed(asset, id)));
const directory = fs.mkdtempSync(path.join(os.tmpdir(), Q.TEMP));
const previous = { storage: process.env.VIDIFY_STORAGE_DIR, app: process.env.APP_DATA_DIR };
const results: unknown[] = [];
process.env.VIDIFY_STORAGE_DIR = directory;
delete process.env.APP_DATA_DIR;
try {
  for (const asset of [...assets, ...staged].sort((a, b) => RELEASE.TYPES.indexOf(a.type as any) - RELEASE.TYPES.indexOf(b.type as any))) writePuppet(asset);
  const contents = (): string =>
    createHash(K.HASH)
      .update(JSON.stringify(K.TYPES.flatMap((type) => listPuppets(type as any)).sort((a, b) => a.id.localeCompare(b.id))))
      .digest(K.HEX);
  const before = contents();
  for (const [preset, styleId] of Object.entries(K.PRESETS)) {
    const analysis: MotionStoryAnalysis = { title: Q.TITLE, logline: Q.SOURCE[0], look: "Simple village illustration", era: "Vietnamese village", stylePreset: preset, cast: structuredClone(Q.CAST) as any, places: [{ key: Q.ROOM, name: "Village Bedroom", description: "Village bedroom with bed and caregiver contacts", interior: true, time: "day" }], chapters: [], facts: [] };
    const makeScript = (gap = false): MotionStoryScript => ({ title: Q.TITLE, language: "en", beats: (gap ? [Q.GAP_SOURCE] : missingAnchor ? [Q.ANCHOR_SOURCE] : includeBowl ? [Q.PORRIDGE_SOURCE] : Q.SOURCE).map((text, index) => ({ id: String(index), chapterId: Q.CHAPTER, narration: text, visual: "scene", place: Q.ROOM, time: "day", cast: [Q.A, Q.B] })) });
    let gap = false;
    let missingAnchor = false;
    let includeBowl = false;
    let repairBlocking = false;
    const calls: string[] = [];
    const logs: string[] = [];
    const ai = async (_prompt: string, artifact: string, _exec?: any, _signal?: any, _log?: any, images?: any[]): Promise<any> => {
      assert.equal(_exec.provider, artifact === P.ARTIFACT_COMPOSE ? "scene-provider" : "content-provider");
      assert.equal(_exec.role, artifact === P.ARTIFACT_COMPOSE ? "draw" : "main");
      calls.push(artifact);
      const rows = gap ? [Q.GAP_SOURCE] : missingAnchor ? [Q.ANCHOR_SOURCE] : includeBowl ? [Q.PORRIDGE_SOURCE] : Q.SOURCE;
      if (artifact === S.ARTIFACT) {
        const requested = JSON.parse(_prompt.split(S.REQUESTED)[1].split(P.NL)[0]);
        return { units: requested.map((row: any) => ({ from: { line: row.line }, scene: Q.ROOM, purpose: S.PURPOSES[row.line ? 1 : 0], show: rows[row.line] })) };
      }
      if (artifact === P.ARTIFACT_CAST_MATCH) return { matches: [] };
      if (artifact === P.ARTIFACT_READ) {
        if (_prompt.includes(I.PREFLIGHT_REPAIR)) repairBlocking = false;
        return {
          lines: rows.map((evidence, i) => ({
            i,
            focus: Q.A,
            who: [Q.A, Q.B],
            place: Q.ROOM,
            action: "talk",
            emotion: "neutral",
            overlays: [],
            states: [
              { char: Q.A, action: "lie", posture: "lie", support: "bed" },
              { char: Q.B, action: "stand", posture: "idle", ...(includeBowl ? { support: "beside_bed" } : {}), ...(missingAnchor ? { placement: { relation: "at", anchor: Q.GAP_ANCHOR, evidence } } : {}) },
            ],
            blocking: includeBowl ? null : repairBlocking ? { kind: "dining", roles: { diner_left: Q.A, diner_right: Q.B } } : { kind: "bedside", roles: { patient: Q.A, caregiver: Q.B } },
            ...(includeBowl ? { object: { key: Q.PORRIDGE, identity: Q.PORRIDGE_INSTANCE, word: "porridge bowl", description: "Rice porridge bowl", category: "prop", type: "small", size: 0.3, mount: "table", support: "table" } } : {}),
            ...(gap ? { object: { key: Q.GAP_PROP, word: "impossible evidence device", description: "Unique impossible evidence device", type: "small", size: 0.2, mount: "held", owner: Q.A } } : {}),
            visual: { scene: Q.ROOM, timeline: "present", evidence: [evidence], fixtures: Q.STATE[i] ? [{ key: "door", state: Q.STATE[i] }] : [] },
          })),
        };
      }
      if (artifact === P.ARTIFACT_LIB_MATCH) return { matches: [] };
      if (artifact === P.ARTIFACT_COMPOSE) return { choices: JSON.parse(_prompt.slice(_prompt.lastIndexOf(P.NL) + 1)).scenes.map((scene: any) => ({ i: scene.i, choiceId: scene.options[0].choiceId })) };
      if (artifact === P.ARTIFACT_QA) return { checks: (images || []).map((_image, i) => ({ i, ok: true })) };
      if (artifact === SOUND.ARTIFACT) return { beats: rows.map((_row, index) => ({ id: String(index), soundEvents: [], soundSilence: true })) };
      throw new Error(Q.UNEXPECTED(artifact));
    };
    const options: any = {
      exec: { provider: "scene-provider", model: "scene-model" },
      mainExec: { provider: "content-provider", model: "content-model" },
      ai,
      review: false,
      log: (line: string) => {
        logs.push(line);
        process.stdout.write(line + "\n");
      },
    };
    const built = await buildScenesPuppet(makeScript(), analysis, options);
    const gen = built.gen!.puppet!;
    assert.equal(gen.report!.missing, 0);
    assert.equal(gen.report!.frames, 3);
    assert.equal(gen.pack!.styleId, styleId);
    withPuppetPackSnapshot(gen.pack, () => {
      const selected = Object.values(gen.sets).map((id) => readPuppet<PuppetSet>(T.SET, id)!);
      assert.equal(new Set(selected.map((set) => set.group)).size, 1);
      assert.ok(selected.some((set) => set.fixtureStates?.door === "closed"));
      assert.ok(selected.some((set) => set.fixtureStates?.door === "open"));
    });
    const fingerprint = gen.pack!.fingerprint;
    calls.length = 0;
    const resumed = await buildScenesPuppet(JSON.parse(JSON.stringify(built)), analysis, options);
    if (resumed.gen!.puppet!.pack!.fingerprint !== fingerprint) fs.writeFileSync(path.join(root, "resume-diff.json"), JSON.stringify({ before: gen, after: resumed.gen!.puppet }, null, 2));
    assert.equal(resumed.gen!.puppet!.pack!.fingerprint, fingerprint);
    assert.equal(calls.length, 0);
    let audioStarted = 0;
    const voiceTrack = { audioId: Q.TITLE, voiceId: Q.TITLE, durations: [3, 17, 5], totalSeconds: 25, continuous: true };
    const beforeAudio = JSON.parse(JSON.stringify(built));
    beforeAudio.gen.puppet.frames = {};
    const reviewed = await buildScenesPuppet(beforeAudio, analysis, {
      ...options,
      review: true,
      prepareAudio: async (ready) => {
        assert.equal(Object.keys(ready.gen!.puppet!.frames).length, 3);
        assert.equal(Object.keys(beforeAudio.gen.puppet.frames).length, 0);
        audioStarted++;
        return undefined;
      },
      resolveVoice: async () => voiceTrack,
    });
    assert.equal(audioStarted, 1);
    assert.equal(calls.includes(P.ARTIFACT_QA), true);
    const timed = compileStorySpec(reviewed, analysis, { aspect: "16:9", voiceTrack, durations: voiceTrack.durations }).spec;
    const expectedTimes = timed.shots.filter((shot) => shot.template === P.TEMPLATE).flatMap((shot) => ((shot.params as any).frames || []).map((frame: any) => +(frame.start + (frame.end - frame.start) * P.QA_AT).toFixed(3)));
    assert.deepEqual(
      reviewed.gen!.puppet!.sheet!.map((item) => item.t),
      expectedTimes,
    );
    const { spec } = compileStorySpec(resumed, analysis, { aspect: "16:9" });
    assert.equal(spec.shots.filter((shot) => shot.template === P.TEMPLATE).length, 3);
    assert.equal(contents(), before);
    repairBlocking = true;
    audioStarted = 0;
    const repaired = await buildScenesPuppet(makeScript(), analysis, {
      ...options,
      prepareAudio: async () => {
        audioStarted++;
        return undefined;
      },
    });
    assert.equal(repairBlocking, false);
    assert.equal(repaired.gen!.puppet!.report!.frames, 3);
    assert.equal(audioStarted, 1);
    assert.equal(contents(), before);
    gap = true;
    calls.length = 0;
    audioStarted = 0;
    await assert.rejects(
      buildScenesPuppet(makeScript(true), analysis, {
        ...options,
        prepareAudio: async () => {
          audioStarted++;
          return undefined;
        },
      }),
      /impossible_evidence_device/,
    );
    assert.equal(audioStarted, 0);
    assert.equal(calls.filter((artifact) => artifact === P.ARTIFACT_READ).length, 1);
    assert.equal(calls.includes(P.ARTIFACT_COMPOSE), false);
    assert.equal(calls.includes(SOUND.ARTIFACT), false);
    assert.equal(contents(), before);
    gap = false;
    missingAnchor = true;
    calls.length = 0;
    audioStarted = 0;
    await assert.rejects(
      buildScenesPuppet(makeScript(), analysis, {
        ...options,
        prepareAudio: async () => {
          audioStarted++;
          return undefined;
        },
      }),
      (error: unknown) => isMotionResourceError(error) && error.diagnostic.kind === K.SET,
    );
    assert.equal(audioStarted, 0);
    assert.equal(calls.filter((artifact) => artifact === P.ARTIFACT_READ).length, 1);
    assert.equal(calls.includes(P.ARTIFACT_COMPOSE), false);
    assert.equal(calls.includes(SOUND.ARTIFACT), false);
    assert.equal(contents(), before);
    missingAnchor = false;
    includeBowl = true;
    audioStarted = 0;
    const complete = await buildScenesPuppet(makeScript(), analysis, {
      ...options,
      prepareAudio: async () => {
        audioStarted++;
        return undefined;
      },
    });
    assert.equal(complete.gen!.puppet!.report!.frames, 1);
    assert.equal(complete.gen!.puppet!.report!.props, 1);
    assert.equal(audioStarted, 1);
    assert.equal(contents(), before);
    const frame = Object.values(complete.gen!.puppet!.frames)[0];
    assert.equal(frame.actors.find((actor) => actor.char === Q.A)!.pose, "lie");
    assert.equal(frame.propMount, "table");
    assert.ok(frame.propAt);
    calls.length = 0;
    const completeResume = await buildScenesPuppet(JSON.parse(JSON.stringify(complete)), analysis, options);
    assert.equal(calls.length, 0);
    assert.equal(completeResume.gen!.puppet!.pack!.fingerprint, complete.gen!.puppet!.pack!.fingerprint);
    assert.deepEqual(completeResume.gen!.puppet!.frames, JSON.parse(JSON.stringify(complete.gen!.puppet!.frames)));
    results.push({ preset, frames: 3, resumeAiCalls: 0, libraryUnchanged: true, incorrectBlockingReplannedBeforeVoice: true, missingPropStopsBeforeComposeAndSound: true, simultaneousStandingLyingAndBowlOnTable: true, logs });
  }
  fs.writeFileSync(path.join(root, Q.RESULT), JSON.stringify(results, null, 2));
  process.stdout.write(JSON.stringify({ styles: results.length, pipelinePassed: true }) + "\n");
} finally {
  if (previous.storage === undefined) delete process.env.VIDIFY_STORAGE_DIR;
  else process.env.VIDIFY_STORAGE_DIR = previous.storage;
  if (previous.app === undefined) delete process.env.APP_DATA_DIR;
  else process.env.APP_DATA_DIR = previous.app;
  fs.rmSync(directory, { recursive: true, force: true });
}
