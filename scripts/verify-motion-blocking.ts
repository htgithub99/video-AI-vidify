import { VERIFICATION_VALUES as VT } from "./motionVerificationValues.js";
import assert from "node:assert/strict";
import { visualReadFixture } from "./motionVisualContractVerificationTexts.js";
import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { B } from "./motionBlockingVerificationTexts.js";
import { PUPPET as P } from "../src/constants/motionPuppet.js";
import { readPuppetLines, composePuppetLines, fitPuppetRead } from "../src/features/motion/server/services/puppet/director.js";
import { layoutPuppetFrame } from "../src/features/motion/server/services/puppet/layout.js";
import { composePuppetSet, planPuppetSets } from "../src/features/motion/server/services/puppet/setComposer.js";
import { openStillSession } from "../src/features/motion/server/services/motionRenderService.js";
import type { PuppetFrame, PuppetRead, PuppetSet, PuppetStylePack, PuppetFrameActor } from "../src/types/motionPuppet.js";
import type { MotionSpec } from "../src/types/motionVideo.js";
const root = process.cwd();
const out = path.resolve(root, B.OUT);
await fs.mkdir(out, { recursive: true });
const asset = async (style: string, kind: string, key: string) => {
  const id = B.PREFIX[kind] + createHash(B.HASH).update(B.SEED(style, key)).digest(B.HEX).slice(0, 16);
  const relative = path.join(kind, id + B.JSON);
  return JSON.parse(await fs.readFile(path.resolve(root, B.LIBRARY, relative), B.UTF8));
};
const reports: any[] = [];
const session = await openStillSession();
try {
  for (const [index, style] of B.STYLES.entries()) {
    const stylePack: PuppetStylePack = JSON.parse(await fs.readFile(path.resolve(root, B.LIBRARY, VT.STYLE_PACK, B.STYLE_IDS[index] + B.JSON), B.UTF8));
    const characters = await Promise.all(B.CHARACTERS.map((key) => asset(style, B.CHARACTER, B.CHAR_KEY(key))));
    const baby = await asset(style, B.CHARACTER, B.CHAR_KEY(B.BABY));
    const bush = await asset(style, B.PIECE, B.BUSH),
      bed = await asset(style, B.PIECE, B.BED);
    const hidden = composePuppetSet(await asset(style, B.BASE, B.HIDDEN_BASE), [{ slot: B.SLOT, piece: bush }], false, false);
    const reader = composePuppetSet(await asset(style, B.BASE, B.ROOM_BASE), [{ slot: B.SLOT, piece: bed }], false, false);
    const mirrored = composePuppetSet(await asset(style, B.BASE, B.ROOM_BASE), [{ slot: B.SLOT, piece: bed }], false, true);
    const sets: Record<string, any> = {};
    const props: Record<string, any> = {};
    const frames: PuppetFrame[] = [];
    for (const scenario of B.CASES) {
      const set: PuppetSet = scenario.scene === B.HIDDEN ? (hidden as any) : scenario.scene === B.READER ? (reader as any) : scenario.scene === B.MIRROR ? (mirrored as any) : await asset(style, B.SET, scenario.scene);
      sets[scenario.scene] = { ...set, wallY: set.horizonY };
      const line: any = { key: scenario.id, text: scenario.text, beatId: scenario.id, chapterId: scenario.id, place: scenario.scene, cast: [B.A, B.C] };
      const analysis: any = {
        title: scenario.id,
        logline: scenario.text,
        cast: [
          { key: B.A, name: B.A },
          { key: B.C, name: B.C },
        ],
      };
      const objects = scenario.objects.map((ob) => ({ ...ob, note: scenario.text }));
      const readRaw = { i: 0, visual: visualReadFixture(scenario.scene, scenario.text), focus: scenario.focus, who: [B.A, B.C], place: scenario.scene, action: P.ACTION_DEFAULT, emotion: P.EXPR_DEFAULT, states: scenario.states.map((state: any) => ({ ...state, posture: state.posture || P.POSTURE_ACTIONS[state.action] || P.POSE_DEFAULT })), object: objects[0], objects, light: P.DAY, overlays: [] };
      const options: any = { log: () => {}, exec: {}, ai: async () => ({ lines: [readRaw] }) };
      const result = await readPuppetLines([line], [line], analysis, { [scenario.scene]: { key: scenario.scene } as any }, {}, options);
      const read = result.reads[line.key];
      assert.equal(read.states?.length, 2);
      assert.equal(read.objects?.length, objects.length);
      for (const ob of objects) assert.equal(read.objects?.find((value) => value.key === ob.key)?.owner, (ob as any).owner);
      const rawActors = scenario.states.map((state) => ({ char: state.char, pose: P.POSE_KNEEL, face: P.FACE_DEFAULT, spot: B.BED_HEAD, hold: scenario.objects.find((ob) => ob.key === B.REST_TOOL)?.key, wear: scenario.objects.filter((ob) => ob.mount === P.MOUNT_WEAR).map((ob) => ob.key) }));
      const raw = { i: 0, shot: scenario.id === B.CASES[0].id ? B.BAD_SHOT : P.SHOT_DEFAULT, form: scenario.form, actors: scenario.id === B.CASES[0].id ? rawActors.slice(0, 1) : rawActors, propAt: (scenario as any).propAt };
      options.ai = async () => ({ frames: [raw] });
      const composed = await composePuppetLines([line], [line], analysis, { [line.key]: read }, {}, { spots: () => set.spots || [], spotsText: () => B.EMPTY, framing: B.EMPTY }, options);
      const charA = (scenario as any).baby ? characters[1] : characters[0];
      const charB = (scenario as any).baby ? baby : characters[1];
      for (const ob of read.objects || []) if (!P.FEATURE_OBJECT_TYPES.includes(ob.type as any)) props[ob.key] = await asset(style, B.PROP, ob.key);
      const frame = layoutPuppetFrame(composed[line.key], { set, props, prop: props[composed[line.key].prop!], heights: { a: charA.height, b: charB.height }, body: stylePack.body });
      frame.set = scenario.scene;
      assert.equal(frame.actors.length, 2);
      for (const state of scenario.states) {
        const actor = frame.actors.find((a) => a.char === state.char)!;
        const expected = P.ACTIONS[state.action];
        assert.ok(actor.pose === expected || (expected === P.POSE_DEFAULT && actor.hold && actor.pose === P.POSE_HOLD));
        const spot = set.spots!.find((s) => s.key === actor.spot)!;
        assert.ok(spot);
        assert.equal(spot.kind, P.POSE_KIND[expected] || P.SPOT_STAND);
        assert.ok(Math.abs(actor.x! * P.SET_W - spot.x) < 1);
        assert.equal(actor.y, spot.seatY != null ? Math.round(spot.seatY + P.PERSON_H * P.SET_H * (state.char === B.A ? charA.height : charB.height) * actor.k! * P.SIT_SEAT_OFFSET) : spot.y);
      }
      for (const ob of read.objects || [])
        if (ob.owner) {
          const owners = frame.actors.filter((a) => a.hold === ob.key || a.wear?.includes(ob.key));
          assert.equal(owners.length, 1);
          assert.equal(owners[0].char, ob.owner);
        }
      if (scenario.form === P.FORM_TALK) {
        assert.equal(frame.actors[0].face, P.FACE_RIGHT);
        assert.equal(frame.actors[1].face, P.FACE_LEFT);
      }
      if (scenario.id === B.CASES[0].id) {
        assert.ok(P.BLOCKING_SHOTS.includes(frame.shot));
        assert.equal(frame.actors[0].pose, P.POSE_DEFAULT);
        assert.equal(frame.actors[1].pose, P.SPOT_LIE);
        assert.equal(frame.items?.[0].prop, B.CASES[0].objects[1].key);
        assert.ok(frame.items?.[0].propH);
      }
      if (scenario.scene === B.MIRROR) assert.equal(frame.actors.find((a) => a.char === B.C)?.face, P.FACE_LEFT);
      if (scenario.objects.some((ob) => ob.key === B.REST_TOOL)) {
        assert.equal(frame.propRot, P.REST_TOOL_ROTATION);
        assert.equal(frame.propAt, (scenario as any).propAt);
        assert.equal(
          frame.actors.some((a) => a.hold === B.REST_TOOL),
          false,
        );
        const reused = layoutPuppetFrame({ ...composed[line.key], propAt: undefined }, { set, props, prop: { ...props[B.REST_TOOL], mount: P.MOUNT_HELD_KEY }, heights: {}, body: stylePack.body });
        assert.equal(reused.propY, set.spots?.find((s) => s.key === (scenario as any).propAt)?.y);
      }
      const noSupport = { ...set, spots: [] };
      assert.throws(() => layoutPuppetFrame(composed[line.key], { set: noSupport, body: stylePack.body, heights: {} }));
      const readBefore = JSON.stringify(read);
      fitPuppetRead(composed[line.key], read, set.spots);
      assert.equal(JSON.stringify(read), readBefore);
      if (scenario.scene === B.CASES[1].scene) {
        const generic = { ...read, states: read.states!.map((state) => ({ ...state, support: B.BOAT })) };
        const fitted = fitPuppetRead(composed[line.key], generic, set.spots);
        const placed = layoutPuppetFrame(fitted, { set, props, body: stylePack.body, heights: {} });
        assert.equal(new Set(placed.actors.map((a) => a.spot)).size, 2);
        assert.ok(placed.actors.every((a) => a.spot?.includes(B.BOAT)));
      }
      if (scenario.id === B.CASES[0].id) {
        const repeated = Array.from({ length: P.SHOT_RUN_MAX + 3 }, (_, i) => ({ ...line, key: B.REPEAT(i) }));
        options.ai = async () => ({ frames: repeated.map((_, i) => ({ ...raw, i })) });
        const sequence = await composePuppetLines(repeated, repeated, analysis, Object.fromEntries(repeated.map((l) => [l.key, read])), {}, { spots: () => set.spots || [], spotsText: () => B.EMPTY, framing: B.EMPTY }, options);
        assert.ok(Object.values(sequence).every((f) => f.actors.length === 2 && P.BLOCKING_SHOTS.includes(f.shot)));
      }
      frames.push(frame);
      for (const motion of [false, true]) {
        const id = style + P.VARIANT_SEP + scenario.id + P.VARIANT_SEP + Number(motion);
        const spec: MotionSpec = { title: scenario.text, aspect: VT.VALUE_16_9, fps: 24, duration: 4, fadeIn: 0, fadeOut: 0, kit: { style: stylePack, characters: { a: charA, b: charB }, sets, props, motion }, shots: [{ id, template: P.TEMPLATE, start: 0, end: 4, params: { frames: [{ ...frame, start: 0, end: 4, speech: [] }] } }], subtitles: [{ start: 0, end: 4, text: scenario.text }] };
        const rendered = await session.render(spec, [{ id, t: 1.1 }], out, { width: 1280, height: 720 });
        assert.equal(rendered.length, 1);
        assert.deepEqual(rendered[0].issues, []);
        reports.push({ id, file: rendered[0].file, frame });
      }
    }
    const unsupported: PuppetRead = { focus: B.A, who: [B.A], action: P.ACTION_DEFAULT, emotion: P.EXPR_DEFAULT, overlays: [], object: null, states: [{ char: B.A, action: P.SPOT_LIE, support: B.BED }] };
    const actors: PuppetFrameActor[] = [{ char: B.A, pose: P.POSE_DEFAULT, expr: P.EXPR_DEFAULT, face: P.FACE_DEFAULT }];
    const fixed = fitPuppetRead({ shot: P.SHOT_DEFAULT, actors }, unsupported, []);
    assert.equal(fixed.actors[0].spot, undefined);
    assert.throws(() => layoutPuppetFrame(fixed, { body: stylePack.body, heights: {} }));
    const requested: any = { place: { key: B.READER, name: B.READER, desc: B.EMPTY, interior: true }, must: [], uses: B.EMPTY };
    const plans = await planPuppetSets(stylePack, [requested], { exec: {} as any, log: () => {}, ai: async () => ({ sets: [{ key: B.READER, base: B.ROOM_BASE, pieces: [{ slot: B.SLOT, piece: VT.ROWBOAT }] }] }) });
    assert.equal(plans.length, 1);
    assert.equal(plans[0].pieces.length, 0);
  }
  await fs.writeFile(path.join(out, B.REPORT), JSON.stringify(reports, null, 2), B.UTF8);
  process.stdout.write(B.PASSED);
} finally {
  await session.close();
}
