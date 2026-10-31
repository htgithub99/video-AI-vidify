import { compositionActorMotion } from "../src/lib/motionCompositionMotion.js";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { compositionAttachedMotion } from "../src/lib/motionCompositionRepair.js";
import { normalizeFirstSceneComposition, compositionFrameSvg } from "../src/lib/motionSceneComposition.js";
import { normalizeRemotionRelations } from "../src/lib/motionRemotionStaging.js";
import { motionNarratedSoundEvents } from "../src/lib/motionSound.js";
import { resolveMotionVoiceSources } from "../src/lib/motionVoiceAttribution.js";
import { MOTION_SOUND_CONFIG as S } from "../src/constants/motionSound.js";
const behavior: any = { version: 1, actors: "simple", sceneEffects: "gentle", camera: "fixed" };
const person: any = { id: "actor", kind: "character", entityId: "host", description: "person", pose: "resting", slot: "left", evidence: "a person holds a cup" };
const cup: any = { id: "cup", kind: "prop", target: "actor", relation: "heldBy", description: "cup", pose: "held", slot: "center", evidence: "held cup" };
const cast = new Set(["host"]);
const track = (target: string): any => ({
  target,
  channel: "actor",
  attribute: "transform",
  period: 4,
  keyframes: [
    { at: 0, value: "translate(0 0)" },
    { at: 2, value: "translate(0 -2)" },
    { at: 4, value: "translate(0 0)" },
  ],
});
const art = (nested: boolean) =>
  normalizeFirstSceneComposition(
    {
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450"><g id="room"><rect width="800" height="450" fill="#333"/></g><g id="actor"><rect x="100" y="100" width="80" height="200"/><g id="arm"><path d="M120 150L200 150" stroke="#777"/>${nested ? '<g id="cup"><rect x="190" y="140" width="20" height="25"/></g>' : ""}</g></g>${nested ? "" : '<g id="cup"><rect x="190" y="140" width="20" height="25"/></g>'}<g id="rain"><path id="drop" d="M400 0L390 30" stroke="#ccc"/></g></svg>`,
      layers: [
        { id: "room", kind: "background" },
        { id: "actor", kind: "character", entityId: "host" },
        { id: "cup", kind: "prop" },
        { id: "rain", kind: "effect" },
      ],
      animations: [track("actor"), track("arm"), { ...track("drop"), channel: "effect" }],
    },
    "fixture",
    "fixture",
    "",
    [person, cup],
    cast,
    800,
    450,
  );
const nested = art(true);
assert.equal(compositionAttachedMotion(nested.composition, nested.asset, [person, cup]).removed, 0);
const detached = art(false);
const safe = compositionAttachedMotion(detached.composition, detached.asset, [person, cup]);
assert.equal(safe.removed, 2, "Owner and arm must not move away from a detached held prop");
assert.deepEqual(
  safe.composition.animations.map((a) => a.channel),
  ["effect"],
);
assert.equal(compositionActorMotion(safe.composition, detached.asset, [person, cup], cast, behavior, "horror").added, 0);
assert.equal(compositionActorMotion(safe.composition, detached.asset, [person, { ...cup, target: "host" }], cast, behavior, "horror").added, 0, "Entity aliases also preserve held ownership");
const still = { ...nested.composition, animations: [] };
const breathing = compositionActorMotion(still, nested.asset, [person], cast, behavior, "horror");
assert.equal(breathing.added, 0, "Do not invent whole-character breathing without an isolated chest detail");
assert.deepEqual(
  breathing.composition.animations.map((a) => a.target),
  [],
  "Never invent a wave or whole-character bob from an arm ID",
);
assert.equal(compositionActorMotion(still, nested.asset, [{ ...person, representation: "detail" }], cast, behavior, "horror").added, 0);
assert.equal(compositionActorMotion(still, nested.asset, [person], cast, { ...behavior, actors: "fixed" }, "horror").added, 0);
const rainOnly = compositionFrameSvg(nested.asset, nested.composition, 2, { ...behavior, actors: "fixed" }, new Set());
assert.equal(rainOnly, nested.asset.svg, "Scene motion off freezes rain and characters together");
assert.equal(compositionFrameSvg(nested.asset, nested.composition, 2, { ...behavior, actors: "fixed", sceneEffects: "off" }, new Set()), nested.asset.svg);
assert.equal(normalizeRemotionRelations([{ ...person, description: "Bàn tay của người kể đặt cạnh chén" }])[0].representation, "detail");
assert.equal(normalizeRemotionRelations([{ ...person, description: "Người đàn ông cầm chén trong bàn tay" }])[0].representation, undefined);
for (const text of ["Trong bếp có tiếng đũa gõ vành bát.", "A pair of chopsticks tapping the bowl."]) assert.equal(motionNarratedSoundEvents(text)[0]?.kind, "dish");
for (const text of ["Cái bát đặt trên bàn.", "Không còn tiếng đũa gõ vành bát.", "Nếu có tiếng đũa gõ bát thì đừng mở cửa.", "Đừng lấy đũa gõ bát."]) assert.deepEqual(motionNarratedSoundEvents(text), []);
assert.equal(motionNarratedSoundEvents("Có tiếng bước chân ngoài ngõ.")[0]?.source, "offscreen");
const line: any = { id: "u", speaker: "host", role: "dialogue", text: "Mở cửa.", voiceSpeaker: "victim" };
const beat: any = { id: "b", chapterId: "c", narration: 'Chị Hai bị vong nhập. Giọng không phải của chị Hai: "Mở cửa."', utterances: [line] };
const script: any = { beats: [beat] };
const analysis: any = {
  cast: [
    { key: "host", name: "Chị Hai", description: "Người bị nhập" },
    { key: "guest", name: "Bà khách", role: "cô hồn chiếm thân chị Hai" },
    { key: "victim", name: "Vong chị Hai", appearanceOf: "host", role: "hồn nạn nhân lang thang ngoài sân" },
  ],
};
const resolve = (a = analysis, s = script) => resolveMotionVoiceSources([{ id: "b", utterances: [line] }], s, a)[0].utterances[0];
assert.equal(resolve().voiceSpeaker, "guest", "A displaced victim's soul must not become the invader's voice");
assert.equal(resolve({ ...analysis, cast: [...analysis.cast, { key: "other", name: "Vong khác" }] }).voiceSpeaker, "guest");
assert.equal(resolve({ ...analysis, cast: analysis.cast.filter((m: any) => m.key !== "guest").concat({ key: "a", name: "Ma A" }, { key: "b", name: "Ma B" }) }).voiceSpeaker, undefined, "Ambiguous possession cannot choose an arbitrary spirit");
assert.equal(resolve({ ...analysis, factual: true }).voiceSpeaker, "victim", "Factual/manual data is not automatically rewritten");
assert.equal(resolve(analysis, { ...script, voiceSettings: { utterances: { b: [line] } } }).voiceSpeaker, "victim");
assert.equal(resolve(analysis, { ...script, beats: [{ ...beat, narration: 'Giọng chị Hai trở lại bình thường. "Mở cửa."' }] }).voiceSpeaker, undefined);
const productionFile = path.resolve("storage/output/motion-video/productions/0171ab25909369c6e9f2ca0dec29ff64.json");
if (fs.existsSync(productionFile)) {
  const { result } = JSON.parse(fs.readFileSync(productionFile, "utf8"));
  const resolved = resolveMotionVoiceSources(
    result.script.beats.map((beat: any) => ({ beatId: beat.id, utterances: beat.utterances || [] })),
    result.script,
    result.analysis,
  );
  const voice = resolved.flatMap((row) => row.utterances).find((line) => line.text.includes("Đói quá"));
  assert.equal(voice?.speaker, "chi_sau");
  assert.equal(voice?.voiceSpeaker, "ba_khach", "Saved production now resolves the actual invading soul");
}
const root = fs.mkdtempSync(path.join(os.tmpdir(), "motion-sfx-direction-"));
const beforeEnv = { data: process.env.APP_DATA_DIR, storage: process.env.VIDIFY_STORAGE_DIR, source: process.env.MOTION_SFX_SOURCE };
delete process.env.APP_DATA_DIR;
process.env.VIDIFY_STORAGE_DIR = root;
process.env.MOTION_SFX_SOURCE = path.join(root, "no-external-assets");
try {
  const { directMotionSound } = await import("../src/features/motion/server/services/motionSoundDirectionService.js");
  const { directPuppetSound } = await import("../src/features/motion/server/services/puppet/sound.js");
  const { compileRemotionSound } = await import("../src/features/motion/server/services/remotion/soundCompiler.js");
  const make = (): any => ({ title: "SFX", language: "vi", beats: [{ id: "b", chapterId: "c", place: "room", narration: "Trong bếp có tiếng đũa gõ vành bát." }] });
  let calls = 0;
  const opts: any = {
    exec: { provider: "content" },
    mainExec: { provider: "content" },
    log: () => {},
    direction: {},
    ai: async (_prompt: string, artifact: string, exec: any) => {
      calls++;
      assert.equal(exec.role, "main");
      assert.equal(artifact, S.ARTIFACT);
      return { beats: [{ id: "b", soundEvents: [] }] };
    },
  };
  const soundScript = make();
  await directMotionSound(soundScript, {} as any, opts);
  assert.equal(soundScript.beats[0].data.soundEvents[0].kind, "dish");
  await directMotionSound(soundScript, {} as any, opts);
  assert.equal(calls, 1, "Cached sound plans never add AI requests on resume");
  const cues = compileRemotionSound({ duration: 8, fps: 30, scenes: [] } as any, soundScript, [0], [8]);
  assert.equal(cues[0].kind, "dish");
  assert.ok(cues[0].t >= 0 && cues[0].t < 8);
  const silent = make();
  await directMotionSound(silent, {} as any, { ...opts, ai: async () => ({ beats: [{ id: "b", soundSilence: true, soundEvents: [] }] }) });
  assert.deepEqual(silent.beats[0].data.soundEvents, [], "Intentional silence is valid");
  const failed = make();
  await directMotionSound(failed, {} as any, {
    ...opts,
    ai: async () => {
      throw new Error("optional sound unavailable");
    },
  });
  assert.equal(failed.beats[0].data.soundEvents[0].kind, "dish", "A failed optional sound response still has a conservative narrated fallback");
  let unavailableCalls = 0;
  const unavailable = {
    ...opts,
    ai: async () => {
      unavailableCalls++;
      throw new Error("optional sound unavailable");
    },
  };
  failed.beats[0].narration = "Một cái chén đặt trên bàn.";
  await directMotionSound(failed, {} as any, unavailable);
  assert.equal(failed.beats[0].data.soundEvents, undefined, "Changing source invalidates obsolete sound events even if AI is unavailable");
  await directMotionSound(failed, {} as any, unavailable);
  await directMotionSound(failed, {} as any, unavailable);
  assert.equal(unavailableCalls, S.DIRECTION_ATTEMPTS, "Repeated optional service failures have a bounded request budget");
  const library = make();
  await directPuppetSound(library, {} as any, { frames: {} } as any, {
    ...opts,
    exec: { provider: "drawing" },
    ai: async (_p: string, _a: string, exec: any) => {
      assert.equal(exec.provider, "content");
      return { beats: [{ id: "b", soundEvents: [] }] };
    },
  });
  assert.equal(library.beats[0].data.soundEvents[0].kind, "dish");
  const aborted = new AbortController();
  aborted.abort();
  await assert.rejects(() => directMotionSound(make(), {} as any, { ...opts, signal: aborted.signal }));
  console.log("Scene consistency passed: attached props, no forced waves, body detail, scene master motion switch, possession identities, shared cached SFX, narration fallback and intentional silence; no live AI or video.");
} finally {
  for (const [key, value] of [
    ["APP_DATA_DIR", beforeEnv.data],
    ["VIDIFY_STORAGE_DIR", beforeEnv.storage],
    ["MOTION_SFX_SOURCE", beforeEnv.source],
  ]) {
    if (value === undefined) delete process.env[key!];
    else process.env[key!] = value;
  }
  assert.ok(root.startsWith(path.resolve(os.tmpdir()) + path.sep));
  fs.rmSync(root, { recursive: true, force: true });
}
