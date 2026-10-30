import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { FB as V } from "./folkBlockingVerificationTexts.js";
import { visualReadFixture } from "./motionVisualContractVerificationTexts.js";
import { PUPPET as P } from "../src/constants/motionPuppet.js";
import { cleanPuppetBlocking, cleanPuppetCompositions, choosePuppetBlocking } from "../src/features/motion/server/services/puppet/blocking.js";
import { layoutPuppetFrame, puppetSetSupportsReads, puppetSetMissingRequirements } from "../src/features/motion/server/services/puppet/layout.js";
import { normalizePuppetReadContinuity } from "../src/features/motion/server/services/puppet/readContinuity.js";
import { normalizePuppetFrameContinuity } from "../src/features/motion/server/services/puppet/frameContinuity.js";
import { composePuppetSet } from "../src/features/motion/server/services/puppet/setComposer.js";
import { matchLibrarySets } from "../src/features/motion/server/services/puppet/kitDraw.js";
import { composePuppetLines, readPuppetLines } from "../src/features/motion/server/services/puppet/director.js";
import { puppetSpotGeometryValid } from "../src/lib/motionPlacement.js";
import { openStillSession } from "../src/features/motion/server/services/motionRenderService.js";
import type { PuppetCharacter, PuppetFrame, PuppetRead, PuppetSet, PuppetStylePack, PuppetProp, PuppetPiece, PuppetBase } from "../src/types/motionPuppet.js";
import type { MotionSpec } from "../src/types/motionVideo.js";
const root = path.resolve(V.ROOT),
  out = path.join(root, V.OUTPUT);
await fs.mkdir(out, { recursive: true });
const installed = process.argv.includes(V.INSTALLED);
const manifest = JSON.parse(await fs.readFile(path.join(root, installed ? V.INSTALLED_MANIFEST : V.MANIFEST), V.UTF8));
const records: any[] = manifest.records;
const assets = new Map<string, any>();
assert.equal(cleanPuppetBlocking({ kind: "toString", roles: {} }, []), undefined);
for (const row of records) {
  const bytes = await fs.readFile(row.path);
  assert.equal(createHash(V.SHA).update(bytes).digest(V.HEX), row.sha256);
  assets.set(row.id, JSON.parse(bytes.toString(V.UTF8)));
}
const find = <T>(style: string, type: string, key: string): T => assets.get(records.find((r) => r.styleId === style && r.type === type && r.key === key)!.id);
const rows: any[] = [];
let checks = 0;
const session = await openStillSession();
const render = async (id: string, set: PuppetSet, style: PuppetStylePack, frame: PuppetFrame, characters: Record<string, PuppetCharacter>, props: Record<string, PuppetProp>, motion: boolean, key: string) => {
  const timed = { ...frame, start: 0, end: 4, speech: [] };
  const spec: MotionSpec = { title: set.name, aspect: V.ASPECT, fps: 24, duration: 4, fadeIn: 0, fadeOut: 0, kit: { style, characters, props, sets: { [V.PLACE]: { ...set, wallY: set.horizonY } }, motion }, shots: [{ id, template: P.TEMPLATE, start: 0, end: 4, params: { frames: [timed] } }], subtitles: [] };
  const [result] = await session.render(spec, [{ id, t: 1.1 }], out, { width: 1280, height: 720 });
  assert.deepEqual(result.issues, []);
  rows.push({ id, key, name: set.name, styleId: style.id, file: result.file, frame, time: set.time, mirrored: set.name.includes("Mirrored"), motion });
};
try {
  for (const styleId of V.STYLES) {
    const style: PuppetStylePack = JSON.parse(await fs.readFile(path.join(V.LIBRARY, V.STYLE, styleId + V.JSON), V.UTF8));
    const adults = V.CHARACTERS.map((key) => find<PuppetCharacter>(styleId, V.CHARACTER, key));
    const baby = find<PuppetCharacter>(styleId, V.CHARACTER, V.INFANT);
    const bases = await Promise.all((await fs.readdir(path.join(V.LIBRARY, V.BASE))).filter((file) => file.endsWith(V.JSON)).map(async (file) => JSON.parse(await fs.readFile(path.join(V.LIBRARY, V.BASE, file), V.UTF8)) as PuppetBase));
    for (const row of records.filter((record) => record.styleId === styleId && record.type === V.PIECE)) {
      const piece = assets.get(row.id) as PuppetPiece;
      const base = bases.find((base) => base.styleId === styleId && base.interior === (piece.environment === P.INTERIOR_TAG))!;
      assert.ok(base);
      for (const mirror of [false, true]) {
        const composed = composePuppetSet(base, [{ slot: piece.slots[0], piece }], false, mirror);
        assert.ok(composed.spots.every(puppetSpotGeometryValid));
        assert.equal(composed.compositions.length, piece.compositions?.length || 0);
        assert.deepEqual(cleanPuppetCompositions(composed.compositions, composed.spots), composed.compositions);
        if (mirror) continue;
        const composition = composed.compositions[0];
        const blocking = composition ? { kind: composition.kind, roles: Object.fromEntries(Object.keys(composition.roles).map((role, i) => [role, V.KEYS[i]])) } : undefined;
        const actors = composition ? Object.entries(composition.roles).map(([role, key], i) => ({ char: V.KEYS[i], pose: composed.spots.find((spot) => spot.key === key)!.kind === P.SPOT_LIE ? P.SPOT_LIE : composed.spots.find((spot) => spot.key === key)!.kind === P.SPOT_SIT ? P.SPOT_SIT : P.POSE_DEFAULT, face: P.FACE_DEFAULT, expr: P.EXPR_DEFAULT })) : [];
        const characters = Object.fromEntries(Object.keys(composition?.roles || {}).map((role, i) => [V.KEYS[i], role === V.INFANT_ROLE ? baby : adults[i]]));
        const set = { ...base, ...composed, type: V.SET, name: piece.name, time: P.DAY } as PuppetSet;
        const frame = layoutPuppetFrame({ shot: P.SHOT_WIDE, set: V.PLACE, blocking, actors }, { set, body: style.body, heights: Object.fromEntries(Object.entries(characters).map(([char, asset]) => [char, asset.height])) });
        await render(row.id, set, style, frame, characters, {}, false, row.key);
      }
    }
    for (const row of records.filter((r) => r.styleId === styleId && r.type === V.SET)) {
      const set = assets.get(row.id) as PuppetSet;
      assert.ok(set.spots!.every(puppetSpotGeometryValid));
      assert.deepEqual(cleanPuppetCompositions(set.compositions, set.spots!), set.compositions);
      assert.deepEqual(assets.get(Object.values(set.variants!)[0]).spots, set.spots);
      if (!set.compositions?.length && set.time === P.DAY && !set.name.includes("Mirrored")) {
        const actors = [{ char: V.KEYS[0], pose: P.POSE_DEFAULT, spot: set.spots!.find((s) => s.kind === P.SPOT_STAND)!.key, face: P.FACE_DEFAULT, expr: P.EXPR_DEFAULT }];
        const characters = { [V.KEYS[0]]: adults[0] };
        const frame = layoutPuppetFrame({ shot: P.SHOT_DEFAULT, set: V.PLACE, actors }, { set, body: style.body, heights: {} });
        await render(row.id, set, style, frame, characters, {}, false, row.key);
      }
      for (const composition of set.compositions || []) {
        if (composition.roles.patient_left && composition.roles.patient_right) assert.ok(set.spots!.find((spot) => spot.key === composition.roles.patient_left)!.x < set.spots!.find((spot) => spot.key === composition.roles.patient_right)!.x);
        const roles = Object.keys(composition.roles);
        const blocking = { kind: composition.kind, roles: Object.fromEntries(roles.map((role, i) => [role, V.KEYS[i]])) };
        assert.deepEqual(cleanPuppetBlocking(blocking, V.KEYS.slice(0, roles.length)), blocking);
        assert.equal(cleanPuppetBlocking(blocking, V.KEYS.slice(1, roles.length)), undefined);
        const characters = Object.fromEntries(roles.map((role, i) => [V.KEYS[i], role === V.INFANT_ROLE ? baby : adults[i]]));
        const states = roles.map((role, i) => {
          const spot = set.spots!.find((s) => s.key === composition.roles[role])!;
          return { char: V.KEYS[i], action: P.ACTION_DEFAULT, posture: spot.kind === P.SPOT_SIT || spot.kind === P.SPOT_LIE ? spot.kind : P.POSE_DEFAULT, support: undefined, transition: false };
        });
        const read: PuppetRead = { focus: V.KEYS[0], who: states.map((s) => s.char), states, blocking, action: P.ACTION_DEFAULT, emotion: P.EXPR_DEFAULT, overlays: [], place: V.PLACE, light: set.time };
        assert.ok(puppetSetSupportsReads(set, [read]));
        assert.deepEqual(puppetSetMissingRequirements(set, [read]), []);
        assert.equal(puppetSetSupportsReads({ ...set, compositions: [] }, [read]), false);
        const actors = states.map((state) => ({ char: state.char, pose: state.posture, spot: V.WRONG, face: P.FACE_DEFAULT, expr: P.EXPR_DEFAULT }));
        const selected = choosePuppetBlocking(blocking, actors, set)!;
        assert.ok(selected);
        const extra = { char: V.KEYS[3], pose: P.POSE_TALK, spot: [...selected.assignments.values()][0], face: P.FACE_DEFAULT, expr: P.EXPR_DEFAULT };
        const layout = layoutPuppetFrame({ shot: P.SHOT_DEFAULT, set: V.PLACE, blocking, actors: [extra, ...actors.reverse()] }, { set, body: style.body, heights: Object.fromEntries(Object.entries(characters).map(([char, asset]) => [char, asset.height])) });
        assert.equal(new Set(layout.actors.map((actor) => actor.spot)).size, layout.actors.length);
        for (const [char, key] of selected.assignments) {
          const actor = layout.actors.find((a) => a.char === char)!;
          const spot = set.spots!.find((s) => s.key === key)!;
          assert.equal(actor.spot, key);
          assert.ok(Math.abs(actor.x! * P.SET_W - spot.x) < 1);
        }
        checks++;
        const mirrored = set.name.includes("Mirrored");
        if (composition !== set.compositions![0] || (set.time === P.NIGHT && !V.CASES.includes(row.key)) || (mirrored && !(set.time === P.NIGHT && V.CASES.includes(row.key)))) continue;
        const frame = { ...layout, actors: layout.actors.filter((actor) => actor.char !== V.KEYS[3]) };
        await render(row.id, set, style, frame, characters, {}, set.time === P.NIGHT, row.key);
      }
    }
    const set = find<PuppetSet>(styleId, V.SET, V.CASES[0]);
    if (installed) {
      const read: PuppetRead = {
        focus: V.KEYS[0],
        who: V.KEYS.slice(0, 2),
        blocking: { kind: "bedside", roles: { patient: V.KEYS[0], caregiver: V.KEYS[1] } },
        states: [
          { char: V.KEYS[0], action: P.SPOT_LIE, posture: P.SPOT_LIE },
          { char: V.KEYS[1], action: P.POSE_DEFAULT, posture: P.POSE_DEFAULT },
        ],
        action: P.ACTION_DEFAULT,
        emotion: P.EXPR_DEFAULT,
        overlays: [],
      };
      const matched = await matchLibrarySets(
        style,
        [{ key: set.tags[0], name: set.name, desc: set.desc, interior: set.interior, time: set.time }],
        {
          exec: {} as any,
          log() {},
          ai: async () => {
            throw new Error(V.WRONG);
          },
        },
        V.PLACE,
        (_key, candidate) => puppetSetSupportsReads(candidate, [read]),
      );
      assert.equal(matched[set.tags[0]]?.group, set.group);
    }
    const composition = set.compositions![1];
    const blocking = { kind: composition.kind, roles: { patient: V.KEYS[0], caregiver: V.KEYS[1] } };
    const lines = [0, 1, 2, 3].map((i) => ({ key: String(i), text: V.TEXT, beatId: String(i), chapterId: V.CHAPTER, place: V.PLACE, cast: V.KEYS.slice(0, 2) })) as any;
    const makeRead = (who: string[], states: any[], group?: typeof blocking): PuppetRead => ({ focus: who[0], who, states, blocking: group, action: P.POSE_TALK, emotion: P.EXPR_DEFAULT, overlays: [], place: V.PLACE, light: P.DAY });
    const initial = makeRead(
      V.KEYS.slice(0, 2),
      [
        { char: V.KEYS[0], action: P.SPOT_LIE, posture: P.SPOT_LIE, support: "bed", transition: true },
        { char: V.KEYS[1], action: P.SPOT_SIT, posture: P.SPOT_SIT, support: "chair", transition: true },
      ],
      blocking,
    );
    const reads = normalizePuppetReadContinuity(lines, {
      0: initial,
      1: makeRead([V.KEYS[1]], [{ char: V.KEYS[1], action: P.POSE_TALK, posture: P.POSE_DEFAULT, transition: false }]),
      2: makeRead(V.KEYS.slice(0, 2), [
        { char: V.KEYS[0], action: P.POSE_TALK, posture: P.POSE_DEFAULT, transition: false },
        { char: V.KEYS[1], action: P.POSE_TALK, posture: P.POSE_DEFAULT, transition: false },
      ]),
      3: makeRead([V.KEYS[0]], [{ char: V.KEYS[0], action: P.POSE_DEFAULT, posture: P.POSE_DEFAULT, transition: true }]),
    });
    assert.equal(reads[2].states![0].posture, P.SPOT_LIE);
    assert.equal(reads[2].states![1].posture, P.SPOT_SIT);
    assert.deepEqual(reads[2].blocking, blocking);
    assert.equal(reads[3].states![0].posture, P.POSE_DEFAULT);
    assert.equal(reads[3].blocking, undefined);
    const analysis: any = { title: V.PLACE, logline: V.TEXT, cast: V.KEYS.slice(0, 2).map((key) => ({ key, name: key })) };
    initial.visual = visualReadFixture(V.PLACE, V.TEXT);
    const options: any = { exec: {}, log() {}, ai: async () => ({ lines: [{ i: 0, ...initial }] }) };
    const parsed = await readPuppetLines([lines[0]], lines, analysis, { [V.PLACE]: { key: V.PLACE } as any }, {}, options);
    assert.deepEqual(parsed.reads[0].blocking, blocking);
    let readCalls = 0;
    options.ai = async () => ({ lines: [{ i: 0, ...initial, states: readCalls++ ? initial.states : initial.states?.slice(0, 1) }] });
    const repaired = await readPuppetLines([lines[0]], lines, analysis, { [V.PLACE]: { key: V.PLACE } as any }, {}, options);
    assert.equal(readCalls, 2);
    assert.equal(repaired.reads[0].states?.length, 2);
    options.ai = async () => ({ lines: [{ i: 0, ...initial, states: initial.states?.slice(0, 1) }] });
    await assert.rejects(readPuppetLines([lines[0]], lines, analysis, { [V.PLACE]: { key: V.PLACE } as any }, {}, options));
    options.ai = async () => ({ frames: lines.slice(0, 3).map((_line: any, i: number) => ({ i, shot: P.SHOT_DEFAULT, actors: reads[i].who.map((char) => ({ char, pose: P.POSE_DEFAULT, expr: P.EXPR_DEFAULT, face: P.FACE_DEFAULT, spot: V.WRONG })) })) });
    const frames = await composePuppetLines(lines.slice(0, 3), lines, analysis, reads, {}, { spots: () => set.spots || [], spotsText: () => P.EMPTY, framing: P.EMPTY }, options);
    const stable = normalizePuppetFrameContinuity(lines.slice(0, 3), frames, reads, () => set.spots || []);
    for (const actor of stable[0].actors) assert.equal(stable[2].actors.find((a) => a.char === actor.char)?.spot, actor.spot);
    const previewSet = { ...set, svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080"><g id="sky"/><g id="back"/><g id="floor" fill="#c9bda6"><rect width="1920" height="1080"/></g><g id="mid"/><g id="fg"/></svg>' };
    const propRows = records.filter((r) => r.styleId === styleId && r.type === V.PROP);
    for (let i = 0; i < propRows.length; i += 8) {
      const props = Object.fromEntries(propRows.slice(i, i + 8).map((row) => [row.key, assets.get(row.id)]));
      const items = Object.keys(props).map((prop, n) => ({ prop, propX: ((n % 4) + 0.5) / 4, propY: n < 4 ? 500 : 1010, propH: 390 }));
      await render(styleId + V.PROP + i, previewSet, style, { set: V.PLACE, shot: P.SHOT_WIDE, actors: [], items }, {}, props, false, V.PREVIEW);
    }
    const charRows = records.filter((r) => r.styleId === styleId && r.type === V.CHARACTER);
    for (let i = 0; i < charRows.length; i += 4) {
      const characters = Object.fromEntries(charRows.slice(i, i + 4).map((row) => [row.key, assets.get(row.id)]));
      const actors = Object.keys(characters).map((char, n) => ({ char, pose: P.POSE_DEFAULT, expr: P.EXPR_DEFAULT, face: P.FACE_DEFAULT, x: (n + 0.5) / 4, y: 990 }));
      await render(styleId + V.CHARACTER + i, previewSet, style, { set: V.PLACE, shot: P.SHOT_WIDE, actors }, characters, {}, false, V.PREVIEW);
    }
  }
  await fs.writeFile(path.join(root, V.REPORT), JSON.stringify({ checks, stills: rows.length, cases: rows }, null, 2), V.UTF8);
  process.stdout.write(V.COMPLETE);
} finally {
  await session.close();
}
