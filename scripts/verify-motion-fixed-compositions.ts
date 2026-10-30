import assert from "node:assert/strict";
import { visualReadFixture } from "./motionVisualContractVerificationTexts.js";
import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { F } from "./motionFixedCompositionVerificationTexts.js";
import { PUPPET as P } from "../src/constants/motionPuppet.js";
import { composePuppetLines, fitPuppetRead, readPuppetLines } from "../src/features/motion/server/services/puppet/director.js";
import { layoutPuppetFrame, puppetSetSupportsReads, puppetStatePose, puppetSupportAssignments } from "../src/features/motion/server/services/puppet/layout.js";
import { matchLibrarySets } from "../src/features/motion/server/services/puppet/kitDraw.js";
import { openStillSession } from "../src/features/motion/server/services/motionRenderService.js";
import type { PuppetActorState, PuppetCharacter, PuppetProp, PuppetRead, PuppetSet, PuppetStylePack } from "../src/types/motionPuppet.js";
import type { MotionSpec } from "../src/types/motionVideo.js";
const out = path.resolve(F.OUT);
await fs.mkdir(out, { recursive: true });
const asset = async <T>(style: string, kind: string, key: string, variant = 0): Promise<T> => {
  const id =
    F.PREFIX[kind] +
    createHash(F.HASH)
      .update(F.SEED(style, key, variant))
      .digest(F.HEX)
      .slice(0, 16);
  return JSON.parse(await fs.readFile(path.resolve(F.LIBRARY, kind, id + F.JSON), F.UTF8));
};
const installed = JSON.parse(await fs.readFile(path.join(F.ROOT, F.INSTALLED), F.UTF8));
for (const row of installed.records)
  assert.equal(
    createHash(F.HASH)
      .update(await fs.readFile(row.path))
      .digest(F.HEX),
    row.sha256,
  );
const session = await openStillSession();
const report: any[] = [];
try {
  for (const [i, style] of F.STYLES.entries()) {
    const stylePack: PuppetStylePack = JSON.parse(await fs.readFile(path.resolve(F.LIBRARY, F.STYLE, F.IDS[i] + F.JSON), F.UTF8));
    for (const scenario of F.CASES) {
      const characters: Record<string, PuppetCharacter> = {};
      const props: Record<string, PuppetProp> = {};
      for (const [index, key] of scenario.cast.entries()) characters[F.CHAR_KEYS[index]] = await asset(style, F.CHAR, F.CHAR_KEY(key));
      for (const ob of scenario.objects) props[ob.key] = await asset(style, F.PROP, ob.key);
      for (const variant of [0, 1, 2, 3]) {
        const set = await asset<PuppetSet>(style, F.SET, scenario.scene, variant);
        const night: PuppetSet = JSON.parse(await fs.readFile(path.resolve(F.LIBRARY, F.SET, set.variants!.night + F.JSON), F.UTF8));
        assert.deepEqual(night.spots, set.spots);
        const raw = {
          i: 0,
          visual: visualReadFixture(scenario.scene, scenario.text),
          focus: F.CHAR_KEYS[0],
          who: Object.keys(characters),
          place: scenario.scene,
          states: scenario.states.map((state: any) => ({ ...state, posture: state.posture || P.POSTURE_ACTIONS[state.action] || P.POSE_DEFAULT })),
          object: scenario.objects[0] || null,
          objects: scenario.objects,
          action: P.ACTION_DEFAULT,
          emotion: P.EXPR_DEFAULT,
          light: P.DAY,
          overlays: [],
        };
        const line: any = { key: scenario.scene, text: scenario.text, chapterId: scenario.scene, beatId: scenario.scene, place: scenario.scene, cast: raw.who };
        const analysis: any = { title: scenario.scene, logline: scenario.text, cast: Object.keys(characters).map((key) => ({ key, name: key })) };
        const options: any = { exec: {}, log: () => {}, ai: async () => ({ lines: [raw] }) };
        const readResult = await readPuppetLines([line], [line], analysis, { [scenario.scene]: { key: scenario.scene } as any }, {}, options);
        const read = readResult.reads[line.key];
        assert.ok(puppetSetSupportsReads(set, [read]));
        const mirrored = variant % 2 === 1;
        const swap = (key?: string) => (mirrored ? key?.replace(F.LEFT_RIGHT, (word) => (word === F.LEFT ? F.RIGHT : F.LEFT)) : key);
        const frameRaw = { i: 0, shot: P.SHOT_DEFAULT, form: P.FORM_PAIR, actors: raw.who.map((char) => ({ char, pose: P.POSE_KNEEL, expr: P.EXPR_DEFAULT, face: P.FACE_DEFAULT })), propAt: swap((scenario as any).propAt) };
        options.ai = async () => ({ frames: [frameRaw] });
        const composed = (await composePuppetLines([line], [line], analysis, { [line.key]: read }, {}, { spots: () => set.spots || [], spotsText: () => P.EMPTY, framing: P.EMPTY }, options))[line.key];
        const layout = layoutPuppetFrame(composed, { set, props, prop: props[composed.prop!], body: stylePack.body, heights: Object.fromEntries(Object.entries(characters).map(([k, c]) => [k, c.height])) });
        layout.set = scenario.scene;
        assert.equal(layout.actors.length, scenario.states.length);
        assert.equal(new Set(layout.actors.map((a) => a.spot)).size, scenario.states.length);
        for (const state of read.states || []) {
          const actor = layout.actors.find((a) => a.char === state.char)!;
          const spot = set.spots!.find((s) => s.key === actor.spot)!;
          assert.equal(actor.pose, puppetStatePose(state));
          assert.equal(spot.kind, P.POSE_KIND[actor.pose] || P.SPOT_STAND);
          assert.ok(Math.abs(actor.x! * P.SET_W - spot.x) < 1);
          assert.equal(actor.y, spot.seatY != null ? Math.round(spot.seatY + P.PERSON_H * P.SET_H * characters[state.char].height * actor.k! * P.SIT_SEAT_OFFSET) : spot.y);
          if (actor.pose === P.SPOT_LIE) assert.equal(actor.face, spot.face);
        }
        for (const ob of read.objects || [])
          if (ob.owner)
            assert.deepEqual(
              layout.actors.filter((a) => a.hold === ob.key).map((a) => a.char),
              [ob.owner],
            );
        assert.equal(layout.items?.length || 0, Math.max(0, read.objects!.filter((ob) => !ob.owner).length - (read.object?.owner ? 0 : 1)));
        if (scenario.scene === F.CASES[1].scene) {
          const states: PuppetActorState[] = [
            { char: F.CHAR_KEYS[0], action: P.POSE_TALK, support: F.CHAIR },
            { char: F.CHAR_KEYS[1], action: P.SPOT_SIT, support: F.LEFT_CHAIR },
          ];
          for (const order of [states, [...states].reverse()]) {
            const assigned = puppetSupportAssignments(order, set.spots!);
            assert.equal(assigned?.get(F.CHAR_KEYS[1]), F.LEFT_CHAIR);
            assert.equal(assigned?.get(F.CHAR_KEYS[0]), F.RIGHT_CHAIR);
          }
          assert.equal(puppetSupportAssignments([...states, { ...states[0], char: F.CHAR_KEYS[2] }], set.spots!), null);
          const missing = { ...read, states: [...read.states!, { ...read.states![0], char: F.CHAR_KEYS[2] }] };
          assert.equal(puppetSetSupportsReads(set, [missing]), false);
          assert.equal(fitPuppetRead(composed, read, []).actors[0].spot, undefined);
        }
        if (variant > 1) continue;
        for (const motion of [false, true]) {
          const id = [style, scenario.scene, variant, Number(motion)].join(P.VARIANT_SEP);
          const background = motion ? night : set;
          const frame = { ...layout, start: 0, end: 4, speech: [] };
          const spec: MotionSpec = { title: scenario.text, aspect: F.ASPECT, fps: 24, duration: 4, fadeIn: 0, fadeOut: 0, kit: { style: stylePack, characters, props, sets: { [scenario.scene]: { ...background, wallY: background.horizonY } }, motion }, shots: [{ id, template: P.TEMPLATE, start: 0, end: 4, params: { frames: [frame] } }], subtitles: [] };
          const rendered = await session.render(spec, [{ id, t: 1.1 }], out, { width: 1280, height: 720 });
          assert.equal(rendered.length, 1);
          assert.deepEqual(rendered[0].issues, []);
          report.push({ id, text: scenario.text, file: rendered[0].file, frame });
        }
      }
    }
    const monk = await asset<PuppetSet>(style, F.SET, F.CASES[1].scene);
    const twoSeats: PuppetRead = { focus: F.CHAR_KEYS[0], who: F.CHAR_KEYS.slice(0, 2), action: P.POSE_TALK, emotion: P.EXPR_DEFAULT, overlays: [], states: F.CHAR_KEYS.slice(0, 2).map((char) => ({ char, action: P.POSE_TALK, support: F.CHAIR })) };
    const fits = (_key: string, set: PuppetSet) => puppetSetSupportsReads(set, [twoSeats]);
    const matched = await matchLibrarySets(
      stylePack,
      [{ key: monk.tags[0], name: monk.name, desc: monk.desc, interior: true, time: P.DAY }],
      {
        exec: {} as any,
        log: () => {},
        ai: async () => {
          throw new Error(P.ERR_EMPTY);
        },
      },
      P.EMPTY,
      fits,
    );
    assert.ok(puppetSetSupportsReads(matched[monk.tags[0]], [twoSeats]));
    for (const [kind, keys, batch] of [
      [F.CHAR, F.PREVIEW_CHARACTERS, 3],
      [F.PROP, F.PREVIEW_PROPS, 6],
    ] as const) {
      for (let start = 0; start < keys.length; start += batch) {
        const selected = keys.slice(start, start + batch);
        const id = F.PREVIEW_ID(style, kind, start / batch);
        const characters: Record<string, PuppetCharacter> = {},
          props: Record<string, PuppetProp> = {};
        for (const key of selected) {
          if (kind === F.CHAR) characters[key] = await asset(style, kind, F.CHAR_KEY(key));
          else props[key] = await asset(style, kind, key);
        }
        const frame = { set: id, shot: P.SHOT_WIDE, start: 0, end: 4, speech: [], actors: Object.keys(characters).map((char, n) => ({ char, pose: P.POSE_DEFAULT, face: P.FACE_DEFAULT, expr: P.EXPR_DEFAULT, x: (n + 1) / 4, y: 940 })), items: Object.keys(props).map((prop, n) => ({ prop, propX: ((n % 3) + 1) / 4, propY: n < 3 ? 490 : 950, propH: 340 })) };
        const text = F.PREVIEW_TITLE(
          kind,
          selected.map((key) => characters[key]?.name || props[key]?.name),
        );
        const spec: MotionSpec = { title: text, aspect: F.ASPECT, fps: 24, duration: 4, fadeIn: 0, fadeOut: 0, kit: { style: stylePack, characters, props, sets: { [id]: { ...monk, svg: F.PREVIEW_SVG, variants: undefined, lights: [], spots: [] } }, motion: false }, shots: [{ id, template: P.TEMPLATE, start: 0, end: 4, params: { frames: [frame] } }], subtitles: [] };
        const rendered = await session.render(spec, [{ id, t: 1.1 }], out, { width: 1280, height: 720 });
        assert.deepEqual(rendered[0].issues, []);
        report.push({ id, text, file: rendered[0].file, frame });
      }
    }
  }
  await fs.writeFile(path.join(out, F.REPORT), JSON.stringify({ assets: installed.assets, stills: report.length, cases: report }, null, 2), F.UTF8);
  process.stdout.write(F.PASSED);
} finally {
  await session.close();
}
