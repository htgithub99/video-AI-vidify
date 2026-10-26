import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { chromium } from "playwright";
import Q from "./fixtures/motion-appearance-20261026.json";
import { inferPuppetAppearance, normalizePuppetAppearance, puppetAppearanceKey, puppetCharacterAppearance, mergePuppetAppearances, withPuppetFrameAppearance, puppetReadAppearances } from "../src/lib/motionAppearance.js";
import { MOTION_APPEARANCE as A } from "../src/constants/motionAppearance.js";
import { MOTION_PACK as PACK } from "../src/constants/motionPack.js";
import { PUPPET as P } from "../src/constants/motionPuppet.js";
import { runWithPuppetPack } from "../src/server/services/puppet/packPolicy.js";
import { puppetKitSpec, applyPuppetShotAppearances } from "../src/server/services/puppet/compilePuppet.js";
import { readPuppetLines } from "../src/server/services/puppet/director.js";
import { composePuppetSet } from "../src/server/services/puppet/setComposition.js";
import { layoutPuppetFrame } from "../src/server/services/puppet/layout.js";
import type { PuppetAsset, PuppetCharacter, PuppetAppearance, PuppetStylePack, PuppetBase, PuppetPiece } from "../src/types/motionPuppet.js";
for (const sample of Q.cases) {
  const actual = inferPuppetAppearance(sample.text);
  assert.deepEqual(actual ? Object.fromEntries(Object.entries(actual).filter(([key]) => key !== "evidence")) : null, sample.expected, sample.text);
}
assert.equal(normalizePuppetAppearance({ face: "black", evidence: Q.whiteFace }, Q.whiteFace), undefined);
assert.equal(normalizePuppetAppearance({ face: "white", evidence: Q.whiteFace }, Q.reaction), undefined);
assert.equal(puppetReadAppearances({ who: ["narrator"], states: [], visual: { evidence: [Q.whiteFace] } } as any).size, 0);
const pale = inferPuppetAppearance(Q.whiteFace)!,
  white = inferPuppetAppearance(Q.whiteClothes)!,
  gray = inferPuppetAppearance(Q.grayBody)!,
  human = inferPuppetAppearance(Q.human)!;
assert.equal(mergePuppetAppearances(pale, gray).face, undefined);
assert.equal(mergePuppetAppearances(pale, human).face, undefined);
const inventory = JSON.parse(fs.readFileSync(Q.source, "utf8")) as PuppetAsset[];
const hash = createHash("sha256").update(JSON.stringify(inventory)).digest("hex");
const outputs: any[] = [],
  reports: any[] = [];
fs.mkdirSync(Q.root, { recursive: true });
for (const [preset, styleId] of Object.entries(PACK.PRESETS)) {
  const assets = inventory.filter((asset) => ("styleId" in asset ? asset.styleId : asset.id) === styleId);
  const stock = assets.filter((asset): asset is PuppetCharacter => asset.type === "character_kit" && asset.age === "adult" && asset.group !== "ghost");
  const character = stock.find((item) => item.gender === "female") || stock[0];
  const base = assets.find((asset): asset is PuppetBase => asset.type === "set_base" && asset.key === "room_plain")!;
  assert.ok(character && base);
  const style = assets.find((asset): asset is PuppetStylePack => asset.id === styleId)!;
  const before = JSON.stringify(character);
  const variant = puppetCharacterAppearance(character, white);
  assert.equal(variant.colors.body, A.COLORS.white);
  assert.equal(variant.colors.face, character.colors.face);
  assert.equal(variant.colors.hair, character.colors.hair);
  assert.equal(puppetCharacterAppearance(character, pale).colors.body, character.colors.body);
  assert.equal(puppetCharacterAppearance(character, pale).colors.face, A.COLORS.white);
  assert.equal(JSON.stringify(character), before);
  const actor = { char: "ghost", pose: "idle", face: "front", expr: "neutral", x: 0.6, y: 900, k: 1 };
  const read: any = { who: ["ghost"], focus: "ghost", place: "room", action: "stand", emotion: "neutral", overlays: [], states: [{ char: "ghost", action: "stand", posture: "idle", appearance: pale }], visual: { scene: "room", timeline: "present", evidence: [Q.whiteFace], fixtures: [] } };
  const input: any = { key: "appearance", text: Q.whiteFace, place: "room", cast: ["ghost"] };
  const accepted = await readPuppetLines(
    [input],
    [input],
    { title: "Appearance", logline: Q.whiteFace, stylePreset: preset, cast: [{ key: "ghost", name: "Chị" }] } as any,
    { room: { key: "room", name: "Room", desc: "Room", interior: true, time: "night" } },
    {},
    {
      exec: {},
      log() {},
      ai: async (prompt) => {
        assert.ok(prompt.includes(A.READ));
        return { lines: [{ ...read, i: 0, object: null, objects: [] }] };
      },
    },
  );
  assert.equal(accepted.reads.appearance.states?.[0].appearance?.face, "white");
  const frame = { shot: "people", set: "room", actors: [actor], start: 0, end: 5, line: "a" };
  const second = { ...frame, start: 5, end: 10, line: "b" };
  const memory = { ...frame, start: 10, end: 15, line: "memory" };
  const restore = { ...frame, start: 15, end: 20, line: "return" };
  const reads = { a: read, b: { ...read, states: [], visual: { ...read.visual, scene: "different_id", evidence: [Q.reaction] } }, memory: { ...read, states: [], visual: { ...read.visual, timeline: "memory", evidence: [Q.reaction] } }, return: { ...read, states: [], visual: { ...read.visual, evidence: [Q.reaction] } } };
  const gen: any = { styleId, characters: { ghost: character.id }, ghosts: ["ghost"], sets: {}, props: {}, reads };
  const shots: any[] = [{ template: P.TEMPLATE, params: { frames: structuredClone([frame, second, memory, restore]) } }];
  applyPuppetShotAppearances(shots, gen);
  const checked = shots[0].params.frames;
  assert.equal(checked[0].actors[0].appearance.face, "white");
  assert.equal(checked[1].actors[0].appearance.face, "white");
  assert.equal(checked[2].actors[0].appearance, undefined);
  assert.equal(checked[3].actors[0].appearance.face, "white");
  assert.equal(actor.hasOwnProperty("appearance"), false);
  const modes: Record<string, PuppetAppearance | undefined> = { baseline: undefined, pale, white_clothes: { ...white, form: "revealed" }, gray, human };
  const actors = Object.values(modes)
    .filter(Boolean)
    .map((appearance) => ({ ...actor, appearance, look: puppetAppearanceKey(appearance!) }));
  const kit = runWithPuppetPack(styleId, assets, () => puppetKitSpec(gen, false, actors))!;
  assert.deepEqual(kit.style.atmosphere, A.PROFILE);
  assert.equal(kit.characters.ghost.looks![puppetAppearanceKey(modes.white_clothes!)].colors.body, A.COLORS.white);
  const set = { svg: base.svg, time: "day", floorY: base.floorY, lights: [] };
  const night = { ...set, svg: base.night || base.svg, time: "night" };
  for (const mode of Q.modes) {
    const appearance = modes[mode];
    const f = appearance ? withPuppetFrameAppearance(frame, { ...read, states: [{ char: "ghost", appearance }] }) : frame;
    for (const time of ["day", "night"]) {
      const sampleKit = { ...kit, style: mode === "baseline" ? { ...kit.style, atmosphere: undefined } : kit.style, sets: { room: time === "night" ? night : set }, characters: { ghost: { ...kit.characters.ghost, ghost: mode !== "baseline" } } };
      outputs.push({ preset, mode, time, shot: "people", kit: sampleKit, frame: { ...f, line: undefined } });
    }
  }
  for (const shot of Q.shots) outputs.push({ preset, mode: "framing", time: "day", shot, kit: { ...kit, sets: { room: set } }, frame: { ...frame, shot, actors: [{ ...actor, char: "ghost", appearance: pale, look: puppetAppearanceKey(pale) }], line: undefined } });
  const room = assets.find((asset): asset is PuppetBase => asset.type === "set_base" && asset.key === Q.bedside.base)!;
  const bed = assets.find((asset): asset is PuppetPiece => asset.type === "set_piece" && asset.key === Q.bedside.bed)!;
  const door = assets.find((asset): asset is PuppetPiece => asset.type === "set_piece" && asset.key === Q.bedside.door)!;
  for (const time of ["day", "night"]) {
    const stage = runWithPuppetPack(styleId, assets, () =>
      composePuppetSet(
        room,
        [
          { slot: "mid_left", piece: bed },
          { slot: "back_right", piece: door },
        ],
        time === "night",
        false,
      ),
    );
    const placed = layoutPuppetFrame(
      {
        shot: "two",
        set: "room",
        layoutLocked: true,
        actors: [
          { ...actor, support: "bed", pose: "lie" },
          { ...actor, char: "visitor", support: "beside_bed" },
        ],
      },
      { set: stage as any, body: style.body, heights: { ghost: 1, visitor: 1 } },
    );
    assert.equal(placed.actors.length, 2);
    assert.equal(placed.actors[0].pose, "lie");
    for (const mode of ["baseline", "pale"]) {
      const sampleKit = { ...kit, style: mode === "baseline" ? { ...kit.style, atmosphere: undefined } : kit.style, sets: { room: { ...stage, time } }, characters: { ...kit.characters, visitor: { ...kit.characters.ghost, ghost: false } } };
      outputs.push({ preset, mode: "bedside_" + mode, time, shot: placed.shot, kit: sampleKit, frame: { ...placed, start: 0, end: 5, actors: placed.actors.map((item) => (item.char === "ghost" ? { ...item, appearance: pale, look: puppetAppearanceKey(pale) } : item)) } });
    }
  }
  reports.push({ preset, styleId, identityPreserved: character.id, headRatio: style.body.head });
}
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setContent('<canvas id="stage" width="960" height="540"></canvas>');
  await page.addScriptTag({ content: "globalThis.__name = (value) => value;" });
  for (const file of Q.engine) await page.addScriptTag({ content: fs.readFileSync(file, "utf8").replace("ME.PUPPET2D = { init,", "ME.appearanceTest = { frameBox, drawPuppet, charOf, charLayout, actorPlace }; ME.PUPPET2D = { init,") });
  for (const [index, sample] of outputs.entries()) {
    const result = await page.evaluate(async (sample) => {
      const me = (window as any).MotionEngine,
        canvas = document.getElementById("stage") as HTMLCanvasElement;
      await me.PUPPET_PRELOAD({ kit: sample.kit });
      const ctx: any = { W: canvas.width, H: canvas.height, abs: 2, spec: { kit: sample.kit }, params: { frames: [sample.frame] } };
      ctx.state = me.PUPPET2D.init(ctx);
      const g = canvas.getContext("2d")!;
      g.clearRect(0, 0, canvas.width, canvas.height);
      me.PUPPET2D.draw(g, ctx);
      const actor = sample.frame.actors[0],
        resolved = me.appearanceTest.charOf(ctx.state, actor.char, actor.look);
      const placed = sample.frame.actors.map((item: any, i: number, all: any[]) => ({ A: item, L: me.appearanceTest.charLayout(ctx.state, me.appearanceTest.charOf(ctx.state, item.char)), ...me.appearanceTest.actorPlace(ctx.state, sample.kit.sets.room, item, i, all.length) }));
      const box = me.appearanceTest.frameBox(ctx.state, sample.frame, sample.kit.sets.room, placed);
      const bodyRatio = Math.max(...placed.map((item: any) => item.L.total * item.k)) / box.h;
      const pixels = g.getImageData(0, 0, canvas.width, canvas.height).data;
      let luminance = 0,
        bright = 0;
      for (let i = 0; i < pixels.length; i += 4) {
        const value = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
        luminance += value;
        if (value > 80) bright++;
      }
      return { data: canvas.toDataURL("image/jpeg", 0.9).split(",")[1], colors: resolved.colors, luminance: luminance / (pixels.length / 4), bright, bodyRatio };
    }, sample);
    assert.ok(result.bright > 50, JSON.stringify({ preset: sample.preset, mode: sample.mode, time: sample.time }));
    if (sample.mode === "white_clothes") assert.equal(result.colors.body, A.COLORS.white);
    if (sample.mode === "pale") assert.equal(result.colors.face, A.COLORS.white);
    if (sample.mode === "bedside_pale") assert.ok(result.bodyRatio > 0.3 && result.bodyRatio < 0.6, JSON.stringify(result));
    const file = [sample.preset, sample.mode, sample.time, sample.shot, index].join("-") + ".jpg";
    fs.writeFileSync(path.join(Q.root, file), Buffer.from(result.data, "base64"));
    reports.push({ file, ...Object.fromEntries(Object.entries(sample).filter(([key]) => !["kit", "frame"].includes(key))), colors: result.colors, luminance: result.luminance, bright: result.bright, bodyRatio: result.bodyRatio });
  }
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
}
assert.equal(createHash("sha256").update(JSON.stringify(inventory)).digest("hex"), hash);
fs.writeFileSync(path.join(Q.root, "verification.json"), JSON.stringify({ passed: true, sourceCases: Q.cases.length, renders: outputs.length, aiCalls: 0, videoCreated: false, inventoryHash: hash, reports }, null, 2));
console.log(JSON.stringify({ passed: true, sourceCases: Q.cases.length, renders: outputs.length, root: Q.root }));
