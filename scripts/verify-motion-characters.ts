import { MOTION_VERIFICATION_TEXTS as VT } from "./motionVerificationTexts.js";
import assert from "node:assert/strict";
import fs from "node:fs";
import { chromium } from "playwright";
import { buildMotionRenderHtml, validateGenCharacter, MOTION_ASSET_BASE } from "../src/server/services/motionEngineService.ts";
import { designBible, emptyGen, prepareMotionGen } from "../src/server/services/motionGenService.ts";
import { needsAuthoredCharacters } from "../src/lib/motionVideoDna.ts";
import { MOTION_GEN_BIBLE_PROMPT } from "../src/constants/motionGenPrompts.ts";
import type { MotionCharacterDesign, MotionStoryAnalysis, MotionStoryScript } from "../src/types/motionVideo.ts";
const design: MotionCharacterDesign = {
  materials: { face: { color: VT.D9D6C8, unlit: true } },
  parts: [
    { id: VT.COAT, pos: [0, 0.25, 0], nodes: [{ shape: VT.BOX, size: [0.6, 0.5, 0.12], mat: { color: VT.AD7871 } }] },
    { id: VT.FACE, parent: VT.COAT, pos: [0, 0.8, 0], nodes: [{ shape: VT.DISC, radius: 0.55, mat: VT.FACE }] },
    { id: VT.EXPRESSION, parent: VT.FACE, nodes: [{ shape: VT.SPHERE, radius: 0.1, pos: [-0.2, 0.08, 0.04], scale: [1, 1.5, 0.2], mat: { color: VT.VALUE_111111 } }] },
  ],
  anchors: { head: VT.FACE, body: VT.COAT },
  poses: { idle: {}, look: { face: { rot: [0, 0, 15] } } },
  motions: {
    look: {
      duration: 2,
      loop: true,
      tracks: [
        {
          part: VT.FACE,
          keys: [
            { t: 0, rot: [0, 0, 15] },
            { t: 1, rot: [0, 0, -15] },
            { t: 2, rot: [0, 0, 15] },
          ],
        },
      ],
    },
  },
};
const checked = validateGenCharacter(design);
assert.deepEqual(checked.errors, []);
assert.equal(checked.value.parts.length, 3);
assert.deepEqual(checked.value.parts[1].pos, [0, 0.8, 0]);
assert.ok(validateGenCharacter({}).errors.length);
assert.ok(validateGenCharacter({ parts: [{ id: VT.EMPTY_3, nodes: [{ shape: VT.GROUP, children: [] }] }] }).errors.length);
const cycle = validateGenCharacter({ parts: [{ ...design.parts[0], parent: VT.FACE }, design.parts[1]] });
assert.ok(cycle.errors.length);
assert.equal(cycle.value.parts[0].parent, undefined);
const analysis = { title: VT.DINNER, logline: VT.DINNER_IN_A_DARK_ROOM, era: VT.FICTION, look: VT.CLEAN, cast: [{ key: VT.HERO, name: VT.HERO_2 }], places: [], chapters: [], facts: [] } as MotionStoryAnalysis;
const gen = emptyGen();
let calls = 0;
await designBible(analysis, gen, {
  exec: {},
  log: () => {},
  ai: async (prompt, _artifact, _exec, _signal, _log, images) => {
    calls++;
    assert.match(prompt, /Without references, choose proportions/);
    assert.match(prompt, /Dinner/);
    assert.equal(images?.length || 0, 0);
    return { style: { notes: VT.STORY_DERIVED_DESIGN }, cast: { hero: design } };
  },
});
assert.equal(calls, 1);
assert.equal((gen.cast.hero as MotionCharacterDesign).parts.length, 3);
assert.equal(needsAuthoredCharacters({ gen } as MotionStoryScript), false);
assert.equal(needsAuthoredCharacters({ gen: { ...gen, cast: { hero: {} } } } as MotionStoryScript), true);
assert.equal(needsAuthoredCharacters({ gen } as MotionStoryScript, [VT.MISSING]), true);
const previous = { ...gen, staging: { b1: {} }, previews: { b1: { file: VT.OLD_JPG } }, creativeSignature: VT.OBSOLETE };
const refreshed = prepareMotionGen(previous, analysis);
assert.deepEqual(refreshed.cast, {});
assert.deepEqual(refreshed.previews, {});
assert.match(MOTION_GEN_BIBLE_PROMPT({ preamble: VT.EMPTY_2, story: VT.DINNER, era: VT.EMPTY_2, look: VT.EMPTY_2, cast: VT.HERO, errors: VT.EMPTY_2 }), /PROJECT STYLE KIT or uploaded reference images exist they are authoritative/);
const spec = JSON.parse(fs.readFileSync(VT.MOTION_ENGINE_DEMO_EDITORIAL_QA_JSON, VT.UTF8));
spec.gen.cast = { hero: design };
spec.shots = [{ id: VT.FREE, template: VT.GEN3D, start: 0, end: 2, params: { location: VT.STUDIO, actors: [{ cast: VT.HERO, action: VT.LOOK, at: [0, 0], face: 0 }], camera: { shot: VT.MEDIUM, move: VT.STATIC } } }];
const browser = await chromium.launch({ channel: VT.CHROME, headless: true });
try {
  const page = await browser.newPage();
  const requests: string[] = [];
  await page.route(MOTION_ASSET_BASE + VT.EMPTY_4, async (route) => {
    requests.push(route.request().url());
    await route.abort();
  });
  await page.setContent(buildMotionRenderHtml(spec));
  await page.evaluate(VT.WINDOW_NAME_FN_FN);
  const result = await page.evaluate(
    async ({ payload: { spec, design }, texts: VT }) => {
      const G = (window as any).MotionEngine.GEN,
        T = G.T;
      await G.prepare(spec);
      const actor = G.createActor(design);
      actor.group.position.set(3, 0.2, -2);
      actor.sample(VT.IDLE, 0, false);
      const face = new T.Box3().setFromObject(actor.parts.face),
        coat = new T.Box3().setFromObject(actor.parts.coat.children[0]);
      const sizes = [face.max.x - face.min.x, coat.max.x - coat.min.x],
        head = actor.anchor(VT.HEAD).toArray(),
        count = Object.keys(actor.parts).length;
      const angles: number[] = [];
      for (const [time, enabled] of [
        [0, false],
        [1, false],
        [1, true],
        [0, true],
      ] as const) {
        actor.sample(VT.LOOK, time, enabled);
        angles.push(actor.parts.face.rotation.z);
      }
      const before = actor.parts.expression.getWorldPosition(new T.Vector3()).toArray();
      actor.sample(VT.LOOK, 1, true);
      actor.sample(VT.LOOK, 0, true);
      const after = actor.parts.expression.getWorldPosition(new T.Vector3()).toArray();
      actor.hold([{ shape: VT.BOX, size: [0.1, 0.1, 0.1], pos: [0.1, 0.2, 0.3], mat: { color: VT.FFFFFF } }], VT.EXPRESSION);
      const attached = actor.parts.expression.children.length;
      let oldRejected = false;
      try {
        G.createActor({});
      } catch {
        oldRejected = true;
      }
      const bounds = G.actorBounds(actor, false).map((p) => p.toArray());
      const outlined = G.createActor(design, { style: { outlineColor: VT.VALUE_111111, outlineWidth: 0.04 } });
      let flatInk = 0;
      outlined.parts.face.traverse((object) => {
        if (object.material?.isMeshBasicMaterial && object.material?.polygonOffset && object.material?.side === T.DoubleSide) flatInk++;
      });
      outlined.dispose();
      actor.dispose();
      return { sizes, head, count, angles, before, after, attached, oldRejected, bounds, flatInk };
    },
    { payload: { spec, design }, texts: VT },
  );
  assert.equal(requests.length, 0, VT.AUTHORED_CHARACTERS_MUST_RENDER_WITHOUT_DOWNLOADING_BODY_MOD);
  assert.equal(result.count, 3);
  assert.ok(Math.abs(result.sizes[0] - 1.1) < 0.001, VT.OVERSIZED_REFERENCE_HEAD_MUST_RETAIN_ITS_AUTHORED_WIDTH);
  assert.ok(Math.abs(result.sizes[1] - 0.6) < 0.001, VT.SHORT_BODY_MUST_RETAIN_ITS_AUTHORED_WIDTH);
  assert.ok(Math.abs(result.head[1] - 1.25) < 0.001, VT.PARENTED_HEAD_MUST_PRESERVE_THE_AUTHORED_PIVOT);
  assert.equal(result.angles[0], result.angles[1]);
  assert.ok(result.angles[2] < 0 && result.angles[3] > 0);
  assert.deepEqual(result.before, result.after);
  assert.equal(result.attached, 2);
  assert.equal(result.oldRejected, true);
  assert.ok(result.bounds.flat().every(Number.isFinite));
  assert.ok(result.flatInk > 0, VT.FLAT_SILHOUETTES_NEED_VISIBLE_OUTLINES_FROM_THE_CAMERA_FACIN);
  process.stdout.write(VT.AUTHORED_CHARACTERS_PASSED_ARBITRARY_PROPORTIONS_HIERARCHY_P);
} finally {
  await browser.close();
}
