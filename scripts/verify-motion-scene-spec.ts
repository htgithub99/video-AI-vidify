import { MOTION_AIR_DISTANCE, MOTION_OBJECT_SIZE as Z } from "../src/constants/motionObjectSize.js";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { chromium } from "playwright";
import { MOTION_SCENE_REVISE, MOTION_SCENE_SPEC as S } from "../src/constants/motionSceneSpec.js";
import { MOTION_SCENE_ENGINE } from "../src/constants/motionSceneEngine.js";
import { motionIsSpecPage, motionSceneSpecFix, motionSceneSpecSplit, motionSceneSpecOf, motionSceneSpecPage, motionSceneSpecPrompt, motionSceneSpecRead } from "../src/lib/motionSceneSpec.js";
import { motionHtmlFigures } from "../src/lib/motionFigures.js";
import { motionCrossingSites } from "../src/lib/motionCrossingSites.js";
import type { MotionCatalogGap } from "../src/lib/motionObjectCatalog.js";
import type { MotionSceneSpec } from "../src/types/motionSceneSpec.js";
assert.throws(() => motionSceneSpecRead({}), new RegExp(S.PARSE_ERROR.slice(0, 20)), "an answer without items, map or headline is not a spec");
assert.throws(() => motionSceneSpecRead("not json"));
const read = motionSceneSpecRead({
  horizon: 9999,
  items: [
    { id: "a", fn: "person", x: 100, y: 600, h: 200 },
    { id: "b", fn: "dragon" },
  ],
});
assert.ok(read.horizon <= 720 * 0.78, "the horizon stays inside the frame");
assert.deepEqual(
  read.items.map((item) => [item.id, item.fn, item.kind]),
  [
    ["a", "person", undefined],
    ["b", "prop", undefined],
  ],
  "an unknown kind of thing is read as a prop with no kind",
);
motionSceneSpecFix(read, { year: 1241, gaps: [] });
assert.deepEqual(
  read.items.map((item) => item.id),
  ["a"],
  "and left out by the fixer: never drawn as a guess",
);
assert.deepEqual(motionSceneSpecRead({ items: [{ id: "a", fn: "person", x: 1, y: 1, h: 1 }] }, [720, 1280]).frame, [720, 1280], "a portrait frame is kept");
const prompt = motionSceneSpecPrompt({ sceneTemplate: "5. REQUIRED: you (focal): a soldier", shot: "wide" }, { year: 1241, frame: [720, 1280], language: "vi" });
assert.ok(prompt.includes("720 x 1280 pixels") && prompt.includes("STORY YEAR: 1241") && prompt.includes("VIDEO LANGUAGE: vi"));
assert.ok(!motionSceneSpecPrompt({}, { map: true }).includes("LIBRARY ("), "a map gets no library lists");
const fix = (spec: Partial<MotionSceneSpec>, template?: string) => {
  const full = { version: 1, horizon: 300, time: "day", ground: "dirt", ...spec } as MotionSceneSpec;
  const gaps: MotionCatalogGap[] = [];
  const warnings = motionSceneSpecFix(full, { year: 1241, template, castLooks: {}, gaps });
  return { spec: full, warnings, gaps };
};
const person = (id: string, x: number, extra: Record<string, unknown> = {}) => ({ id, fn: "person" as const, x, y: 620, h: 220, ...extra });
{
  const { spec, warnings, gaps } = fix({ items: [person("you", 400, { focal: true }), { id: "fire", fn: "prop", kind: "cookfire", x: 800, y: 620, h: 80 }, { id: "gadget", fn: "prop", kind: "fluxCapacitor", x: 900, y: 620, h: 60 }] });
  assert.equal(spec.items.find((item) => item.id === "fire")?.kind, "campfire", "a cook fire is drawn as the library's camp fire");
  assert.ok(warnings.some((line) => line.includes("cookfire")));
  assert.ok(!spec.items.some((item) => item.id === "gadget"), "a thing the library lacks is left out, never drawn wrong");
  assert.ok(
    gaps.some((gap) => gap.kind === "fluxCapacitor"),
    "and recorded as a library gap",
  );
}
{
  const { spec, warnings } = fix({ items: [person("you", 300, { focal: true }), { id: "barrel", fn: "prop", kind: "barrel", x: 700, y: 620, h: 500 }, { id: "horse", fn: "animal", kind: "horse", x: 1000, y: 620, h: 230 }] });
  const barrel = spec.items.find((item) => item.id === "barrel")!;
  assert.ok(Math.abs(barrel.h! - 220 * Z.barrel.h) < 1, "a barrel taller than the man beside it is cut to a barrel's size: " + barrel.h);
  assert.equal(spec.items.find((item) => item.id === "horse")!.h, 230, "a reasonable size is kept");
  assert.ok(warnings.some((line) => line.includes("barrel")));
}
{
  const { spec } = fix({
    items: [person("you", 300, { focal: true }), person("other", 700, { focal: true, on: "ghostBench" }), { id: "cart", fn: "vehicle", kind: "cart", x: 1000, y: 620, h: 150 }],
    devices: [
      { kind: "inset", of: "you", part: "body", r: 90 },
      { kind: "inset", of: "cart", part: "head", r: 90 },
    ],
  });
  assert.equal(spec.items.filter((item) => item.focal).length, 1, "one focal thing");
  assert.equal(spec.items.find((item) => item.id === "other")!.on, undefined, "no seat on a missing thing");
  assert.deepEqual(
    (spec.devices || []).filter((device) => device.kind === "inset").map((device) => [device.of, device.part]),
    [["you", "hand"]],
    "a body close-up becomes the hand's thing; a cart has no close-up",
  );
}
{
  const { spec, warnings } = fix({ items: [person("you", 640, { focal: true, y: 600 }), { id: "wagon", fn: "vehicle", kind: "wagon", x: 640, y: 700, h: 210 }, person("miklos", 650, { y: 640 })] }, "5. REQUIRED: you (focal): x; miklos (support): y\n7. INTERACT: miklos -> you");
  const wagon = spec.items.find((item) => item.id === "wagon")!;
  assert.ok(wagon.y! < 600 && wagon.h! < 210 && Math.abs(wagon.x! - 640) < 1, "the wagon stands behind the subject, smaller, in its place");
  assert.ok(warnings.some((line) => line.includes("lùi ra sau")));
  assert.equal(spec.items.find((item) => item.id === "miklos")!.x, 650, "the partner the plan names stays where the plan put him");
  assert.deepEqual(spec.pairs, [["miklos", "you"]]);
}
{
  const { spec, warnings } = fix(
    {
      items: [
        person("you", 300, { focal: true }),
        { id: "whetstone", fn: "prop", kind: "whetstone", x: 760, y: 640, h: 30 },
        person("miklos", 760, { y: 650 }),
        { id: "planks", fn: "prop", kind: "planks", x: 1000, y: 630, h: 30, w: 160 },
        {
          id: "stone",
          fn: "prop",
          kind: "rock",
          h: 60,
          keys: [
            { t: 0, x: 200, y: 200 },
            { t: 0.45, x: 990, y: 600 },
            { t: 0.5, x: 1000, y: 610 },
            { t: 1, x: 1270, y: 300 },
          ],
        },
      ],
    } as never,
    "5. REQUIRED: you (focal): x; miklos (support): y; whetstone (support): z; planks (support): p; stone (support): s",
  );
  assert.equal(spec.items.find((item) => item.id === "miklos")!.x, 760, "a person is never moved off a thing");
  assert.ok(!warnings.some((line) => line.includes("che")), "nothing covers anything: " + warnings.join("; "));
  const split = motionSceneSpecSplit(['"miklos" che "whetstone" – đã dời sang bên', 'Bỏ "gadget": kho không có "x" (cũng không có đồ gần đúng cùng thời đại)', "Cảnh thiếu: banner", 'Bỏ "far": che "gap" mà không dời được', 'Bỏ ô phóng to vào "cart": thứ được phóng không rõ']);
  assert.equal(split.issues.length, 3, "dropped things and missing ones are what a scene lacks");
  assert.equal(split.notes.length, 2, "a repair is a note");
}
{
  const spec = { version: 1, horizon: 300, time: "day", ground: "dirt", items: [person("you", 400, { focal: true }), { id: "whetstone", fn: "prop", kind: "whetstone", x: 700, y: 620, h: 42 }, { id: "jet", fn: "vehicle", kind: "fighter", x: 900, y: 120, h: 300, dist: "far" }, { id: "heli", fn: "vehicle", kind: "helicopter", x: 300, y: 150, h: 80 }] } as unknown as MotionSceneSpec;
  motionSceneSpecFix(spec, { year: 1950, gaps: [] });
  const at = (id: string) => spec.items.find((item) => item.id === id)!;
  assert.ok(at("whetstone").h! < 20, "a whetstone is a hand's size: " + at("whetstone").h);
  assert.equal(at("jet").y, 120, "an aircraft in the sky is never put down");
  assert.ok(Math.abs(at("jet").h! - 220 * Z.fighter.h * MOTION_AIR_DISTANCE.far) < 1, "a far fighter is sized by its distance: " + at("jet").h);
  assert.equal(at("heli").y, 150, "a helicopter hovering still stays in the air");
  const empty = fix({ items: [{ id: "ship", fn: "vehicle", kind: "rowboat", x: 640, y: 600, h: 400 }] } as never).spec;
  assert.ok(empty.items[0].h! < 200, "with no person, the master frame's person sets the scale: " + empty.items[0].h);
}
{
  const { motionMasterTarget } = await import("../src/lib/motionMasterScale.js");
  const wide = motionMasterTarget({ frame: [1280, 720], shot: "wide" }),
    est = motionMasterTarget({ frame: [1280, 720], shot: "establishing" });
  assert.deepEqual([wide.shot, wide.target], ["ws", 0.25], "a wide master: the person a quarter of the frame");
  assert.ok(est.target <= 0.14 && est.shot === "ews", "an establishing master: an eighth");
  assert.equal(motionMasterTarget({ frame: [1280, 720], genre: "Kinh dị dân gian" }).target, 0.22, "horror leaves room around the figure");
  assert.equal(motionMasterTarget({ frame: [1280, 720], genre: "kids story" }).target, 0.27);
  assert.equal(motionMasterTarget({ frame: [720, 1280] }).px.target, Math.round(0.25 * 720 * 1.6), "a portrait frame measures against its width");
  const text = motionSceneSpecPrompt({ sceneTemplate: "5. REQUIRED: you (focal): a soldier", shot: "wide" }, { year: 1241, frame: [1280, 720] });
  assert.ok(text.includes("158-202 px (target 180 px)") && /wagon\(0\.85×2\.4\)/.test(text) && text.includes('"dist"'), "the prompt gives the master size, the real sizes and the air distances");
}
{
  const { spec, warnings } = fix({ items: [person("you", 640, { focal: true }), { id: "barn", fn: "building", kind: "house", x: 640, y: 680, h: 420 }], haze: { kind: "dust", amount: 0.9 } });
  const barn = spec.items.find((item) => item.id === "barn");
  assert.ok(!barn || barn.y! < 620 || Math.abs(barn.x! - 640) > 150, "the focal subject is not covered (the barn behind it, aside or left out)");
  assert.ok(warnings.length > 0);
  assert.ok(spec.haze!.amount <= S.HAZE_MAX);
}
{
  const { warnings } = fix({ items: [person("you", 400, { focal: true })] }, "5. REQUIRED: you (focal): a soldier; banner (support): a red banner");
  assert.ok(
    warnings.some((line) => line.includes("banner")),
    "the missing banner is reported",
  );
}
const page = motionSceneSpecPage(fix({ items: [person("you", 400, { focal: true })] }).spec);
assert.ok(motionIsSpecPage(page) && motionSceneSpecOf(page)?.items[0].id === "you", "the page carries the spec and is read back");
assert.ok(motionSceneSpecOf(motionSceneSpecPage({ version: 1, horizon: 300, time: "day", ground: "dirt", items: [{ id: "x", fn: "prop", kind: "sign", x: 1, y: 1, h: 1, look: { text: "</script><b>" } }] }))?.items[0].look?.text === "</script><b>", "a closing tag inside the spec cannot end the script");
assert.doesNotThrow(() => new Function(MOTION_SCENE_ENGINE), "the engine is valid script");
const RECORD =
  "window.__MOTION_HOST__=true;window.__motionMarks=[];window.motionMark=function(ctx,id,x,y,w,h){const t=ctx.getTransform();const p=[[x,y],[x+w,y],[x,y+h],[x+w,y+h]].map(([a,b])=>[t.a*a+t.c*b+t.e,t.b*a+t.d*b+t.f]);const xs=p.map(q=>q[0]),ys=p.map(q=>q[1]);window.__motionMarks.push({id:String(id),x:Math.min(...xs),y:Math.min(...ys),w:Math.max(...xs)-Math.min(...xs),h:Math.max(...ys)-Math.min(...ys)});};";
const out = fs.mkdtempSync(path.join(os.tmpdir(), "scene-spec-"));
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome" });
const show = async (spec: MotionSceneSpec, name: string, progress = 0.5, profile = "history") => {
  const tab = await browser.newPage({ viewport: { width: spec.frame?.[0] || 1280, height: spec.frame?.[1] || 720 } });
  const errors: string[] = [];
  tab.on("pageerror", (error) => errors.push(String(error)));
  await tab.setContent(motionHtmlFigures(motionSceneSpecPage(spec), { profile, layout: "wide", year: 1241 }).replace("<head>", `<head><script>${RECORD}</script>`));
  const result = await tab.evaluate(
    async ([at, size]: [number, [number, number]]) => {
      const w = window as any;
      await w.motionScene.ready;
      w.__motionMarks = [];
      const canvas = document.querySelector("canvas") as HTMLCanvasElement;
      await w.motionScene.renderAt({ mode: "export", width: size[0], height: size[1], time: at * 6, frame: Math.round(at * 180), fps: 30, duration: 6, progress: at, motionEnabled: true, cameraEnabled: false, sceneEffectsEnabled: true, seed: "x", speaking: [] });
      const d = canvas.getContext("2d")!.getImageData(0, 0, canvas.width, canvas.height).data;
      const colours = new Set<number>();
      for (let i = 0; i < d.length; i += 4 * 211) colours.add((d[i] >> 4) * 256 + (d[i + 1] >> 4) * 16 + (d[i + 2] >> 4));
      return { marks: w.__motionMarks as { id: string; x: number; y: number; w: number; h: number }[], colours: colours.size, width: canvas.width, height: canvas.height, corner: Array.from(canvas.getContext("2d")!.getImageData(4, 4, 1, 1).data.slice(0, 3)) };
    },
    [progress, [spec.frame?.[0] || 1280, spec.frame?.[1] || 720]] as [number, [number, number]],
  );
  await tab.screenshot({ path: path.join(out, name + ".png") });
  await tab.close();
  assert.deepEqual(errors, [], `${name}: no page errors`);
  assert.ok(result.colours > 12, `${name}: the picture is drawn (${result.colours} colours)`);
  return result;
};
const inFrame = (marks: { id: string; x: number; y: number; w: number; h: number }[], id: string, W = 1280, H = 720) => {
  const own = marks.filter((mark) => mark.id === id);
  assert.ok(own.length > 0, `${id} is drawn and marked`);
  const cx = own[0].x + own[0].w / 2,
    cy = own[0].y + own[0].h / 2;
  assert.ok(cx > 0 && cx < W && cy > 0 && cy < H && own[0].w > 4 && own[0].h > 4, `${id} is inside the frame`);
};
try {
  const battle = fix(
    {
      horizon: 300,
      time: "dusk",
      ground: "grass",
      ridge: "hills",
      sky: { clouds: 3, birds: true, sun: true },
      scatter: [
        { kind: "rock", count: 6 },
        { kind: "stuckArrow", count: 5 },
      ],
      haze: { kind: "dust", amount: 0.2 },
      effects: [{ kind: "darkSmoke", x: 1000, y: 520, r: 90 }],
      items: [
        person("you", 420, {
          focal: true,
          look: { outfit: "soldier", hold: "spear" },
          keys: [
            { at: 0, x: 380 },
            { at: 1, x: 520, pose: "walk" },
          ],
        }),
        { id: "rider", fn: "person", x: 760, y: 600, h: 200, mount: "horse", mountLook: { barding: "#7a2a2a" }, look: { outfit: "knight", hold: "banner", itemColor: "#c33" } },
        { id: "levies", fn: "person", x: 300, y: 470, h: 120, group: { count: 9, width: 420, rows: 2 }, look: { outfit: "levy", hold: "spear" } },
        { id: "palisade", fn: "wall", kind: "palisade", from: 820, to: 1260, y: 430, h: 110 },
        { id: "wagon", fn: "vehicle", kind: "wagon", x: 1040, y: 560, h: 120, burning: true },
      ],
      devices: [
        { kind: "thought", of: "you", x: 230, y: 160, r: 90, items: [{ id: "home", fn: "building", kind: "house", x: 0, y: 30, h: 80 }] },
        { kind: "emote", of: "rider", sign: "alarm" },
      ],
    },
    "5. REQUIRED: you (focal): a soldier; rider (support): a knight",
  ).spec;
  const battleShot = await show(battle, "battle");
  for (const id of ["you", "rider", "levies", "palisade", "wagon"]) inFrame(battleShot.marks, id);
  await show(battle, "battle-cutout", 0.9, "cutout");
  const raid = fix(
    {
      horizon: 330,
      time: "dusk",
      ground: "grass",
      ridge: "low",
      items: [
        { id: "village", fn: "building", kind: "village", x: 1000, y: 360, h: 90 },
        { id: "stakes", fn: "wall", kind: "stakes", from: 80, to: 620, y: 600, h: 120 },
        { id: "bank", fn: "wall", kind: "rampart", from: 700, to: 1240, y: 470, h: 70 },
        { id: "stall", fn: "building", kind: "awning", x: 1120, y: 520, h: 150 },
        { id: "khan", fn: "person", x: 420, y: 520, h: 170, mount: "horse", look: { region: "steppe", outfit: "soldier", hold: "bow" }, focal: true },
        { id: "levy", fn: "person", x: 820, y: 640, h: 230, look: { region: "steppe", outfit: "levy", hold: "spear" } },
        {
          id: "flame",
          fn: "prop",
          kind: "fireArrow",
          x: 640,
          y: 260,
          h: 40,
          keys: [
            { at: 0, x: 300, y: 200 },
            { at: 1, x: 900, y: 330 },
          ],
        },
        { id: "volley", fn: "prop", kind: "volley", x: 700, y: 200, h: 120 },
      ],
    },
    "5. REQUIRED: khan (focal): a Mongol rider",
  ).spec;
  assert.equal(raid.items.length, 8, "the new library things are found by their usual names (none dropped)");
  const raidShot = await show(raid, "raid", 0.5);
  for (const id of ["village", "stakes", "bank", "stall", "khan", "levy", "flame", "volley"]) inFrame(raidShot.marks, id);
  const crowded = {
    version: 1,
    horizon: 300,
    time: "day",
    ground: "grass",
    water: [{ kind: "river", y: 560, h: 50 }],
    items: [
      { id: "gap", fn: "prop", kind: "earthwork", x: 300, y: 360, h: 40 },
      { id: "fg_wheel", fn: "prop", kind: "brokenWheel", x: 1180, y: 712, h: 120 },
      { id: "fg_rock", fn: "prop", kind: "boulder", x: 60, y: 715, h: 260 },
      { id: "riders", fn: "person", x: 900, y: 470, h: 200, mount: "horse", group: { count: 6, width: 300, rows: 2 }, look: { region: "steppe", outfit: "soldier" } },
      { id: "fort", fn: "wall", kind: "wagonFort", from: 40, to: 560, y: 420, h: 70, gaps: [[240, 330]] },
      { id: "bridge", fn: "bridge", x: 640, y: 560, w: 520, h: 40 },
      person("you", 600, { focal: true, y: 690, h: 520 }),
      person("miklos", 660, { y: 690, h: 500 }),
      person("andras", 720, { y: 690, h: 500 }),
    ],
  } as unknown as MotionSceneSpec;
  const tab = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await tab.setContent(motionHtmlFigures(motionSceneSpecPage(crowded), { profile: "cutout", layout: "wide", year: 1241 }).replace("<head>", `<head><script>${RECORD}</script>`));
  const staged = await tab.evaluate(async () => {
    const w = window as any;
    await w.motionScene.ready;
    w.__motionMarks = [];
    await w.motionScene.renderAt({ mode: "export", width: 1280, height: 720, time: 3, frame: 90, fps: 30, duration: 6, progress: 0.5, motionEnabled: true, cameraEnabled: false, sceneEffectsEnabled: true, seed: "x", speaking: [] });
    const S = w.__motionSpec;
    return { ids: S.items.map((it: any) => it.id), master: S.__master, items: Object.fromEntries(S.items.map((it: any) => [it.id, { x: it.x, y: it.y, h: it.h, group: it.group, anchor: !!it.anchor }])), marks: w.__motionMarks };
  });
  await tab.screenshot({ path: path.join(out, "staged.png") });
  await tab.close();
  assert.ok((!staged.ids.includes("gap") || staged.items.gap.anchor) && !staged.ids.includes("fg_wheel"), "an idea marker is only an opening of the wall, and junk at the frame's edge is left out");
  assert.ok(staged.items.fg_rock.h <= 720 * 0.18 + 0.5, "a framing rock is at most 18 % of the frame");
  assert.ok(Math.abs(staged.master - 0.45) < 1e-6 && Math.abs(staged.items.you.h - 520 * 0.45) < 2, "the scene is seen from further back towards the wide shot (a quarter of the frame), never shrunk below LEAST_SCALE (" + staged.master + ")");
  const g = staged.items.riders.group,
    cols = Math.ceil(g.count / g.rows);
  assert.ok(g.width >= cols * staged.items.riders.h * (Z.horse.l / MOTION_SCENE_REVISE.RIDER) * 0.8 - 1 || g.count < 6, "the riders get the width their horses need, or fewer riders");
  const named = ["you", "miklos", "andras"].map((id) => staged.items[id]).sort((a: any, b: any) => a.x - b.x);
  for (let i = 1; i < named.length; i++) assert.ok(named[i].x - named[i - 1].x > named[i].h * 0.3 || Math.abs(named[i].y - named[i - 1].y) > 10, "named men stand apart or one behind the other");
  for (const id of ["bridge", "fort", "riders", "you"]) inFrame(staged.marks, id);
  const hall = fix({ horizon: 420, time: "day", ground: "stone", interior: { wall: "#9a8466", floor: "#6f5b45" }, items: [{ id: "table", fn: "prop", kind: "table", x: 640, y: 640, h: 110 }, { id: "bench", fn: "prop", kind: "bench", x: 560, y: 650, h: 60 }, person("king", 560, { focal: true, on: "bench", look: { outfit: "king", pose: "sit" } })] }).spec;
  inFrame((await show(hall, "hall")).marks, "king");
  const map = {
    version: 1,
    horizon: 300,
    time: "day",
    ground: "dirt",
    items: [],
    map: {
      paper: "#e8dcc0",
      land: [
        [
          [80, 80],
          [1200, 60],
          [1240, 660],
          [60, 680],
        ],
      ],
      rivers: [
        [
          [200, 100],
          [500, 400],
          [700, 700],
        ],
      ],
      places: [
        { name: "Pest", x: 600, y: 360, big: true },
        { name: "Mohi", x: 900, y: 220 },
      ],
      forces: [
        {
          id: "army",
          side: "Mongols",
          color: "#a33",
          x: 1000,
          y: 200,
          size: 22,
          keys: [
            { at: 0, x: 1000, y: 200 },
            { at: 1, x: 700, y: 330 },
          ],
        },
      ],
      arrows: [{ from: [1000, 200], to: [700, 330], color: "#a33", at: [0, 0.8] }],
    },
  } as unknown as MotionSceneSpec;
  motionSceneSpecFix(map, { year: 1241, map: true, gaps: [] });
  inFrame((await show(map, "map", 0.8)).marks, "army");
  {
    const arrow = { from: [200, 500] as [number, number], to: [1000, 250] as [number, number], color: "#8b2e24", at: [0, 1] as [number, number], curve: -0.15 };
    const full = {
      version: 1,
      horizon: 300,
      time: "day",
      ground: "dirt",
      items: [
        { id: "fort", fn: "wall", kind: "wagonFort", x: 1000, y: 250, h: 26, from: 980, to: 1020, at: [0.6, 1] },
        { id: "peak", fn: "building", kind: "mountain", x: 600, y: 120, h: 50 },
      ],
      map: {
        paper: "#e8dcc0",
        land: [
          [
            [-20, -20],
            [1300, -20],
            [1300, 740],
            [-20, 740],
          ],
        ],
        rivers: [
          [
            [400, 0],
            [420, 360],
            [380, 720],
          ],
        ],
        places: [
          { name: "Danube", x: 380, y: 520 },
          { name: "Pest", x: 200, y: 500, big: true },
        ],
        forces: [
          {
            id: "army",
            color: "#8b2e24",
            x: 200,
            y: 500,
            size: 20,
            keys: [
              { at: 0, x: 200, y: 500 },
              { at: 1, x: 1000, y: 250 },
            ],
          },
        ],
        arrows: [arrow],
      },
    } as unknown as MotionSceneSpec;
    const page = await show(full, "map-full", 0.5);
    const army = page.marks.find((m: any) => m.id === "army");
    const k = 0.5 * 0.5 * (3 - 2 * 0.5) - 0.04,
      bend = arrow.curve,
      [a, b] = [arrow.from, arrow.to];
    const mx = (a[0] + b[0]) / 2 - (b[1] - a[1]) * bend,
      my = (a[1] + b[1]) / 2 + (b[0] - a[0]) * bend;
    const want = [(1 - k) ** 2 * a[0] + 2 * (1 - k) * k * mx + k * k * b[0], (1 - k) ** 2 * a[1] + 2 * (1 - k) * k * my + k * k * b[1]];
    const got = [army.x + army.w / 2, army.y + army.h / 2];
    assert.ok(Math.hypot(got[0] - want[0], got[1] - want[1]) < 6, "the force rides the arrow's curve: " + got + " vs " + want);
    const corner = (page as any).corner as number[],
      paper = [0xe8, 0xdc, 0xc0];
    assert.ok(Math.abs(corner[0] - paper[0]) + Math.abs(corner[1] - paper[1]) + Math.abs(corner[2] - paper[2]) > 20, "a land filling the frame covers its corners: " + corner);
  }
  const revised = async (spec: MotionSceneSpec, scene: Record<string, string>, name: string, profile = "cutout", at = 0.5) => {
    const tab = await browser.newPage({ viewport: { width: spec.frame?.[0] || 1280, height: spec.frame?.[1] || 720 } });
    const errors: string[] = [];
    tab.on("pageerror", (error) => errors.push(String(error)));
    await tab.setContent(motionHtmlFigures(motionSceneSpecPage(spec), { profile, layout: "wide", year: 1241, scene }).replace("<head>", `<head><script>${RECORD}</script>`));
    const got = await tab.evaluate(
      async ([p, size]: [number, [number, number]]) => {
        const w = window as any;
        await w.motionScene.ready;
        await w.motionScene.renderAt({ mode: "export", width: size[0], height: size[1], time: p * 6, frame: Math.round(p * 180), fps: 30, duration: 6, progress: p, motionEnabled: true, cameraEnabled: false, sceneEffectsEnabled: true, seed: "x", speaking: [] });
        return { spec: w.__motionSpec, notes: w.__motionNotes as [string, string][] };
      },
      [at, [spec.frame?.[0] || 1280, spec.frame?.[1] || 720]] as [number, [number, number]],
    );
    await tab.screenshot({ path: path.join(out, name + ".png") });
    await tab.close();
    assert.deepEqual(errors, [], `${name}: no page errors`);
    return got;
  };
  {
    const ford = {
      version: 1,
      horizon: 300,
      time: "night",
      ground: "grass",
      water: [{ kind: "river", y: 380, h: 120 }],
      effects: [{ kind: "fireflies", x: 300, y: 500, r: 60 }],
      items: [
        person("you", 300, { y: 650, h: 200, focal: true, look: { wet: true, expression: "scared" } }),
        person("scout", 760, { y: 640, h: 290, mount: "horse", look: { pose: "ride" } }),
        { id: "horse", fn: "animal", kind: "horse", x: 765, y: 642, h: 170, look: { color: "#6b3822", saddle: true, pose: "rear" } },
        person("archer", 1000, { y: 450, h: 120 }),
        { id: "levy", fn: "person", x: 520, y: 520, h: 150, group: { count: 6, width: 300, rows: 1 }, look: { outfit: "levy", top: "#6a5a4a", region: "europe" } },
        { id: "raiders", fn: "person", x: 1100, y: 320, h: 30, group: { count: 6, width: 220, rows: 1 }, look: { outfit: "soldier", top: "#6c5c4c", region: "steppe" } },
        { id: "pot", fn: "prop", kind: "bucket", x: 600, y: 320, h: 3 },
      ],
      devices: [
        {
          kind: "thought",
          of: "you",
          x: 900,
          y: 160,
          r: 110,
          at: [0.1, 0.95],
          items: [
            { id: "far", fn: "person", x: 0, y: 30, h: 50, at: [0, 0.5] },
            { id: "reed", fn: "prop", kind: "reeds", x: -40, y: 30, h: 4 },
          ],
        },
        {
          kind: "count",
          groups: [
            { n: 1, color: "#123456" },
            { n: 5000, color: "#6a5a4a" },
          ],
        },
        { kind: "spotlight", of: "raiders" },
      ],
    } as unknown as MotionSceneSpec;
    const { spec, notes } = await revised(ford, { text: "At dawn the scout's horse rears on the bank.", time: "dawn", sceneTemplate: "5. REQUIRED: you (focal): a levy; horse (focal): a bay horse" }, "revised-ford");
    const ids = spec.items.map((it: any) => it.id),
      scout = spec.items.find((it: any) => it.id === "scout"),
      you = spec.items.find((it: any) => it.id === "you");
    assert.ok(!ids.includes("horse") && scout.mountLook?.color === "#6b3822" && scout.mountKeys?.[0]?.pose === "rear", "the saddled horse at the rider's spot is the rider's own mount (its colour and its rearing kept)");
    assert.ok(!you.look.wet && notes.some(([k]) => k === "wet"), "wet on dry ground with no rain is left off");
    assert.ok(you.y >= 380 + 120, "nobody stands in the river");
    assert.ok(Math.abs(scout.h / 1.35 - (200 * (scout.y - 300)) / (650 - 300)) < 200 * 0.13, "a rider is as tall as a man standing at that depth, times RIDER: " + scout.h);
    assert.equal(spec.time, "dawn", "the story clock sets the sky");
    assert.ok(!(spec.effects || []).some((e: any) => e.kind === "fireflies"), "fireflies of the old night are left out at dawn");
    assert.ok(!ids.includes("pot"), "a speck that is not required is left out");
    const kinds = (spec.devices || []).map((d: any) => d.kind),
      bubble = spec.devices.find((d: any) => d.kind === "thought");
    assert.ok(bubble && bubble.at[1] <= 0.5 && !bubble.items.some((it: any) => it.id === "reed"), "the bubble ends with its main item and drops what is too small to read");
    assert.ok(!kinds.includes("count") && notes.some(([k, id]) => k === "spot" && id === "raiders"), "a count tied to no group and a spotlight on a far speck are left out");
  }
  {
    const crossing = {
      version: 1,
      horizon: 300,
      time: "day",
      ground: "grass",
      water: [{ kind: "river", y: 400, h: 330 }],
      items: [{ id: "span", fn: "bridge", x: 640, y: 470, w: 520, h: 60, look: { build: "stone" } }, person("king", 300, { y: 690, h: 200, focal: true, look: { cape: true } }), person("a", 520, { y: 690, h: 200 }), person("b", 700, { y: 690, h: 200 }), person("c", 900, { y: 690, h: 280 })],
      devices: [{ kind: "inset", of: "a", part: "hand" }],
    } as unknown as MotionSceneSpec;
    const tab = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    await tab.setContent(motionHtmlFigures(motionSceneSpecPage(crossing), { profile: "cutout", layout: "wide", year: 1241, cast: { king: { cape: "#2a3a6a" } }, scene: { text: "They hold the bridge." } }));
    const got = await tab.evaluate(async () => {
      const w = window as any;
      await w.motionScene.ready;
      await w.motionScene.renderAt({ mode: "export", width: 1280, height: 720, time: 3, progress: 0.5, duration: 6, motionEnabled: true, cameraEnabled: false, sceneEffectsEnabled: true, seed: "x", speaking: [] });
      return { spec: w.__motionSpec, notes: w.__motionNotes };
    });
    await tab.screenshot({ path: path.join(out, "revised-crossing.png") });
    await tab.close();
    const at = (id: string) => got.spec.items.find((it: any) => it.id === id);
    assert.ok(got.spec.water[0].y + got.spec.water[0].h <= 720 * 0.86 + 0.5, "the river leaves a near bank to stand on");
    assert.ok(Math.abs(at("c").h - at("a").h) < 2, "a man standing among others of one size at one depth is brought to their size: " + at("c").h);
    assert.equal(at("king").look.cape, "#2a3a6a", "a named man keeps his own cloak colour from the cast");
  }
  {
    const tall = {
      version: 1,
      frame: [720, 1280],
      horizon: 640,
      time: "night",
      ground: "stone",
      items: [
        { ...person("girl", 360, { focal: true, look: { expression: "scared" } }), y: 1150, h: 520 },
        { id: "house", fn: "building", kind: "cottage", x: 520, y: 760, h: 200, state: "collapsed" },
        { id: "cart", fn: "vehicle", kind: "wagon", x: 180, y: 820, h: 110, state: "broken" },
        { id: "camp", fn: "wall", kind: "wagonFort", from: 60, to: 660, y: 900, h: 70, shape: "ring", gaps: [[300, 420]] },
      ],
      devices: [
        { kind: "spotlight", of: "girl", at: [0.1, 0.9] },
        { kind: "thought", of: "girl", r: 100, items: [{ id: "mother", fn: "person", x: 0, y: 20, h: 60 }] },
      ],
    } as unknown as MotionSceneSpec;
    for (const profile of ["horror", "stick", "comic", "outline"]) {
      const { spec } = await revised(tall, { text: "The house has fallen; she cannot find her mother.", time: "night" }, "revised-portrait-" + profile, profile);
      assert.ok(spec.devices.some((d: any) => d.kind === "spotlight") && spec.devices.some((d: any) => d.kind === "thought"), profile + ": a spotlight on a clear subject and a bubble with a person are kept");
    }
  }
  {
    const page = (water: unknown[], items: unknown[]) => ({ html: { html: motionSceneSpecPage({ version: 1, horizon: 300, time: "day", ground: "grass", water, items } as unknown as MotionSceneSpec) } });
    const river = { kind: "river", y: 400, h: 200 };
    const scenes = [
      { ...page([river], [{ id: "bridge", fn: "bridge", x: 700, y: 420, w: 400, h: 60, look: { build: "stone" } }, person("you", 300, { y: 650, look: { region: "europe" } }), person("khan", 600, { y: 380, look: { region: "steppe" } })]), fromLineId: "b1::0::a", text: "the bridge" },
      { ...page([river], [person("you", 300, { y: 650, look: { region: "europe" } })]), fromLineId: "b2::0::b", text: "across the river" },
      { ...page([{ kind: "lake", y: 400, h: 200 }], []), fromLineId: "b3::0::c", text: "a lake" },
    ];
    const sited = motionCrossingSites(scenes, [
      { id: "b1", place: "sajo" },
      { id: "b2", place: "sajo" },
      { id: "b3", place: "lake" },
    ]);
    assert.ok(sited[0].crossing && JSON.stringify(sited[0].crossing) === JSON.stringify(sited[1].crossing), "scenes at one place share one crossing");
    assert.equal(sited[0].crossing!.build, "stone");
    assert.ok(sited[0].crossing!.sides.europe !== sited[0].crossing!.sides.steppe, "two sides get two banks");
    assert.equal(sited[2].crossing, undefined, "a lake is no crossing");
  }
  {
    const held = {
      version: 1,
      horizon: 300,
      time: "day",
      ground: "grass",
      items: [
        person("you", 300, { y: 650, h: 220, focal: true, look: { hold: "crossbow", quiver: true } }),
        { id: "crossbow", fn: "prop", kind: "crossbow", x: 330, y: 560, h: 40, heldBy: "you" },
        { id: "quiver_ground", fn: "prop", kind: "quiver", x: 360, y: 645, h: 50 },
        person("archer", 700, { y: 650, h: 220, look: { hold: "crossbow" } }),
        { id: "spare_crossbow", fn: "prop", kind: "crossbow", x: 1150, y: 600, h: 40 },
        person("peter", 950, { y: 650, h: 220, look: { hold: "sword" } }),
        { id: "sword", fn: "prop", kind: "sword", x: 960, y: 600, h: 30 },
        person("horn_blower", 500, { y: 520, h: 160, look: { hold: "horn" } }),
        {
          id: "falling",
          fn: "prop",
          kind: "crossbow",
          x: 700,
          y: 560,
          h: 40,
          keys: [
            { at: 0.4, x: 700, y: 560 },
            { at: 0.6, x: 690, y: 645 },
          ],
        },
      ],
    } as unknown as MotionSceneSpec;
    const { spec, notes } = await revised(held, { text: "Peter drops his sword in the mud." }, "revised-held");
    const ids = spec.items.map((it: any) => it.id);
    assert.ok(!ids.includes("crossbow") && !ids.includes("quiver_ground"), "a crossbow held by its owner and a quiver he wears are not drawn twice");
    assert.ok(ids.includes("spare_crossbow") && ids.includes("sword") && ids.includes("falling"), "a spare far away, a sword the story drops and a falling weapon are kept");
    assert.ok(
      spec.items.find((it: any) => it.id === "archer").keys.some((k: any) => k.hold === "none" && k.at >= 0.4),
      "the falling crossbow leaves its owner's hands when it falls",
    );
    assert.ok(
      notes.some((n: [string, string]) => n[0] === "held"),
      "the report counts the twins dropped",
    );
  }
  {
    const wreck = {
      version: 1,
      horizon: 300,
      time: "day",
      ground: "grass",
      items: [{ id: "wagon", fn: "vehicle", kind: "wagon", x: 600, y: 600, h: 150 }, { id: "wagon_wheel", fn: "prop", kind: "brokenWheel", x: 700, y: 610, h: 80 }, { id: "camp_wall", fn: "wall", kind: "wagonFort", from: 100, to: 1180, y: 420, h: 50 }, { id: "gap", fn: "prop", kind: "planks", x: 640, y: 425, h: 12 }, person("you", 300, { y: 680, h: 220, focal: true })],
      devices: [{ kind: "spotlight", of: "gap", at: [0.1, 0.9] }],
    } as unknown as MotionSceneSpec;
    const { spec, notes } = await revised(wreck, { text: "A stone smashes the wagon beside you; there is a gap in the wall." }, "revised-wreck-gap");
    assert.equal(spec.items.find((it: any) => it.id === "wagon").state, "broken", "a wagon the story smashes, with its wreck beside it, is drawn broken");
    assert.ok(!spec.items.some((it: any) => it.id === "wagon_wheel"), "the loose wheel of that wreck is not drawn twice");
    assert.ok(
      spec.items.find((it: any) => it.id === "camp_wall").gaps.some((g: number[]) => g[0] < 640 && g[1] > 640),
      "a 'gap' becomes an opening of the wall",
    );
    assert.ok(spec.items.find((it: any) => it.id === "gap").anchor && spec.devices.some((d: any) => d.kind === "spotlight"), "the opening keeps its spotlight, drawn as nothing");
    assert.ok(notes.some((n: [string, string]) => n[0] === "wreck") && notes.some((n: [string, string]) => n[0] === "gap"), "the report counts both");
  }
  for (const frame of [
    [1280, 720],
    [720, 1280],
    [1080, 1080],
  ] as [number, number][]) {
    const [W, H] = frame,
      H0 = Math.round(H * 0.42),
      band = { kind: "river", y: Math.round(H0 + (H - H0) * 0.25), h: Math.round((H - H0) * 0.4) };
    const crossingSpec = {
      version: 1,
      frame,
      horizon: H0,
      time: "day",
      ground: "grass",
      water: [band],
      items: [
        { id: "bridge", fn: "bridge", x: W * 0.5, y: band.y + 20, w: W * 0.5, h: 60, look: { build: "stone" } },
        person("you", W * 0.2, { y: H * 0.9, h: H * 0.22, focal: true, look: { region: "europe" } }),
        person("knight", W * 0.55, { y: band.y + band.h * 0.6, h: H * 0.15, look: { region: "europe" } }),
        person("khan", W * 0.3, { y: band.y - 4, h: H * 0.1, bank: "far", look: { region: "steppe" } }),
        { id: "riders", fn: "person", x: W * 0.52, y: band.y + 20, h: H * 0.09, mount: "horse", group: { count: 4, width: W * 0.2 }, look: { region: "steppe", pose: "ride" } },
      ],
    } as unknown as MotionSceneSpec;
    const crossing = { over: "river", x: 0.6, wide: 0.24, build: "stone", near: "left", sides: { europe: "left", steppe: "right" } };
    const { spec, notes } = await revised(crossingSpec, { text: "Mongol riders try to force the bridge.", crossing } as unknown as Record<string, string>, `revised-crossing-${W}x${H}`);
    const into = spec.water[0].into,
      base = into.base,
      half = (y: number) => Math.min((W * MOTION_SCENE_REVISE.CROSS.BOTTOM) / 2, Math.max(into.wide * MOTION_SCENE_REVISE.CROSS.FAR_MIN, (into.wide / 2) * Math.pow(Math.max(0, (y - H0) / Math.max(1, base - H0)), MOTION_SCENE_REVISE.CROSS.GROW)));
    assert.ok(into && Math.abs(into.x - W * 0.6) < 1, `${W}x${H}: the river runs into the distance where the place puts it`);
    const at = (id: string) => spec.items.find((it: any) => it.id === id);
    assert.ok(Math.abs(at("bridge").x - into.x) < half(at("bridge").y) * 0.2 + 1 && at("bridge").w > half(at("bridge").y) * 2, `${W}x${H}: the bridge spans the river`);
    ["you", "knight", "khan"].forEach((id) => assert.ok(Math.abs(at(id).x - into.x) >= half(at(id).y) - 1, `${W}x${H}: ${id} stands on a bank, not in the river`));
    assert.ok(at("you").x < into.x && at("knight").x < into.x && at("khan").x > into.x, `${W}x${H}: each side keeps its own bank`);
    assert.ok(at("riders").deck === "bridge", `${W}x${H}: riders on the bridge stand on its deck`);
    assert.ok(half(H) * 2 <= W * MOTION_SCENE_REVISE.CROSS.BOTTOM + 1, `${W}x${H}: the river leaves room on both banks`);
    assert.ok(
      notes.some((n: [string, string]) => n[0] === "bridge"),
      `${W}x${H}: reported`,
    );
  }
  {
    const ford = {
      version: 1,
      horizon: 300,
      time: "day",
      ground: "grass",
      water: [{ kind: "river", y: 420, h: 200 }],
      items: [
        {
          id: "riders",
          fn: "person",
          x: 200,
          y: 560,
          h: 120,
          mount: "horse",
          look: { pose: "ride", region: "steppe" },
          keys: [
            { at: 0, x: 200, y: 560 },
            { at: 1, x: 1100, y: 560 },
          ],
        },
      ],
      effects: [{ kind: "dustTrail", x: 180, y: 560, r: 40 }],
    } as unknown as MotionSceneSpec;
    const crossing = { over: "river", x: 0.55, wide: 0.24, near: "left", sides: { steppe: "left" } };
    const { spec, notes } = await revised(ford, { text: "The riders ford the river at a gallop.", crossing } as unknown as Record<string, string>, "revised-ford");
    const r = spec.items.find((it: any) => it.id === "riders");
    assert.ok(r.fords && r.keys[r.keys.length - 1].x > spec.water[0].into.x, "riders the story sends across the river cross it");
    assert.ok(spec.effects[0].of === "riders" && notes.some((n: [string, string]) => n[0] === "trail") && notes.some((n: [string, string]) => n[0] === "ford"), "their dust follows them and the crossing is reported");
  }
  const thumb = fix({ frame: [720, 1280], horizon: 700, items: [{ ...person("sister", 470, { focal: true }), y: 1180, h: 700 }], headline: { lines: ["TIẾNG GỌI", "BÊN GIẾNG"], x: 50, y: 260, size: 120, accent: "GIẾNG" } }).spec;
  const thumbShot = await show(thumb, "thumbnail", 0.5, "horror");
  assert.equal(thumbShot.width, 720);
  inFrame(thumbShot.marks, "sister", 720, 1280);
  console.log(`Scene spec: read, fixed (near kinds, drops, sizes, seats, covers, insets, haze, one focal, missing ids) and drawn by the engine (crowds, riders, walls, fire, devices, rooms, maps, a portrait headline). Pictures: ${out}`);
} finally {
  await browser.close();
}
