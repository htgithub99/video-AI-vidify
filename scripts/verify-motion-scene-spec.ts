// The scene spec: what the AI returns for a scene is read, put right by code where it is not reasonable (unknown kinds,
// sizes, seats, covering things, insets, haze, one focal thing) and drawn by the scene engine with the kit. The engine is
// checked on real pages: every item is drawn and marked inside the frame, crowds, riders, walls, devices, maps and a
// thumbnail headline paint, and nothing throws.
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { chromium } from "playwright";
import { MOTION_SCENE_SPEC as S } from "../src/constants/motionSceneSpec.js";
import { MOTION_SCENE_ENGINE } from "../src/constants/motionSceneEngine.js";
import { motionIsSpecPage, motionSceneSpecFix, motionSceneSpecSplit, motionSceneSpecOf, motionSceneSpecPage, motionSceneSpecPrompt, motionSceneSpecRead } from "../src/lib/motionSceneSpec.js";
import { motionHtmlFigures } from "../src/lib/motionFigures.js";
import type { MotionCatalogGap } from "../src/lib/motionObjectCatalog.js";
import type { MotionSceneSpec } from "../src/types/motionSceneSpec.js";

// ---------- reading ----------
assert.throws(() => motionSceneSpecRead({}), new RegExp(S.PARSE_ERROR.slice(0, 20)), "an answer without items, map or headline is not a spec");
assert.throws(() => motionSceneSpecRead("not json"));
const read = motionSceneSpecRead({ horizon: 9999, items: [{ id: "a", fn: "person", x: 100, y: 600, h: 200 }, { id: "b", fn: "dragon" }] });
assert.ok(read.horizon <= 720 * 0.78, "the horizon stays inside the frame");
assert.deepEqual(read.items.map((item) => [item.id, item.fn, item.kind]), [["a", "person", undefined], ["b", "prop", undefined]], "an unknown kind of thing is read as a prop with no kind");
motionSceneSpecFix(read, { year: 1241, gaps: [] });
assert.deepEqual(read.items.map((item) => item.id), ["a"], "and left out by the fixer: never drawn as a guess");
assert.deepEqual(motionSceneSpecRead({ items: [{ id: "a", fn: "person", x: 1, y: 1, h: 1 }] }, [720, 1280]).frame, [720, 1280], "a portrait frame is kept");

// ---------- the prompt ----------
const prompt = motionSceneSpecPrompt({ sceneTemplate: "5. REQUIRED: you (focal): a soldier", shot: "wide" }, { year: 1241, frame: [720, 1280], language: "vi" });
assert.ok(prompt.includes("720 x 1280 pixels") && prompt.includes("STORY YEAR: 1241") && prompt.includes("VIDEO LANGUAGE: vi"));
assert.ok(!motionSceneSpecPrompt({}, { map: true }).includes("LIBRARY ("), "a map gets no library lists");

// ---------- fixing ----------
const fix = (spec: Partial<MotionSceneSpec>, template?: string) => {
  const full = { version: 1, horizon: 300, time: "day", ground: "dirt", ...spec } as MotionSceneSpec;
  const gaps: MotionCatalogGap[] = [];
  const warnings = motionSceneSpecFix(full, { year: 1241, template, castLooks: {}, gaps });
  return { spec: full, warnings, gaps };
};
const person = (id: string, x: number, extra: Record<string, unknown> = {}) => ({ id, fn: "person" as const, x, y: 620, h: 220, ...extra });
// A missing kind: a near thing of the same period stands in, otherwise the item is dropped (and recorded as a gap).
{
  const { spec, warnings, gaps } = fix({ items: [person("you", 400, { focal: true }), { id: "fire", fn: "prop", kind: "cookfire", x: 800, y: 620, h: 80 }, { id: "gadget", fn: "prop", kind: "fluxCapacitor", x: 900, y: 620, h: 60 }] });
  assert.equal(spec.items.find((item) => item.id === "fire")?.kind, "campfire", "a cook fire is drawn as the library's camp fire");
  assert.ok(warnings.some((line) => line.includes("cookfire")));
  assert.ok(!spec.items.some((item) => item.id === "gadget"), "a thing the library lacks is left out, never drawn wrong");
  assert.ok(gaps.some((gap) => gap.kind === "fluxCapacitor"), "and recorded as a library gap");
}
// Sizes are the AI's; only an unreasonable one (against people at a similar depth, with the real size table) is put right.
{
  const { spec, warnings } = fix({ items: [person("you", 300, { focal: true }), { id: "barrel", fn: "prop", kind: "barrel", x: 700, y: 620, h: 500 }, { id: "horse", fn: "animal", kind: "horse", x: 1000, y: 620, h: 230 }] });
  const barrel = spec.items.find((item) => item.id === "barrel")!;
  assert.ok(Math.abs(barrel.h! - 220 * S.SIZE.barrel) < 1, "a barrel taller than the man beside it is cut to a barrel's size: " + barrel.h);
  assert.equal(spec.items.find((item) => item.id === "horse")!.h, 230, "a reasonable size is kept");
  assert.ok(warnings.some((line) => line.includes("barrel")));
}
// Exactly one focal thing; a seat on a thing that is not there is dropped; a close-up is of a person's face or of the
// small thing at their hand (a body part magnified is not), never of a thing or a group.
{
  const { spec } = fix({ items: [person("you", 300, { focal: true }), person("other", 700, { focal: true, on: "ghostBench" }), { id: "cart", fn: "vehicle", kind: "cart", x: 1000, y: 620, h: 150 }], devices: [{ kind: "inset", of: "you", part: "body", r: 90 }, { kind: "inset", of: "cart", part: "head", r: 90 }] });
  assert.equal(spec.items.filter((item) => item.focal).length, 1, "one focal thing");
  assert.equal(spec.items.find((item) => item.id === "other")!.on, undefined, "no seat on a missing thing");
  assert.deepEqual((spec.devices || []).filter((device) => device.kind === "inset").map((device) => [device.of, device.part]), [["you", "hand"]], "a body close-up becomes the hand's thing; a cart has no close-up");
}
// What covers the subject goes further back first (smaller, behind it), the pairs of the plan are never pulled apart.
{
  const { spec, warnings } = fix({ items: [person("you", 640, { focal: true, y: 600 }), { id: "wagon", fn: "vehicle", kind: "wagon", x: 640, y: 700, h: 210 }, person("miklos", 650, { y: 640 })] }, "5. REQUIRED: you (focal): x; miklos (support): y\n7. INTERACT: miklos -> you");
  const wagon = spec.items.find((item) => item.id === "wagon")!;
  assert.ok(wagon.y! < 600 && wagon.h! < 210 && Math.abs(wagon.x! - 640) < 1, "the wagon stands behind the subject, smaller, in its place");
  assert.ok(warnings.some((line) => line.includes("lùi ra sau")));
  assert.equal(spec.items.find((item) => item.id === "miklos")!.x, 650, "the partner the plan names stays where the plan put him");
  assert.deepEqual(spec.pairs, [["miklos", "you"]]);
}
// A person at a required thing stays at it (a smith at his whetstone, a soldier on the bridge); a stone that only flies over
// the planks does not cover them. The fixer's repairs are notes, not something the scene lacks.
{
  const { spec, warnings } = fix({ items: [person("you", 300, { focal: true }), { id: "whetstone", fn: "prop", kind: "whetstone", x: 760, y: 640, h: 30 }, person("miklos", 760, { y: 650 }), { id: "planks", fn: "prop", kind: "planks", x: 1000, y: 630, h: 30, w: 160 }, { id: "stone", fn: "prop", kind: "rock", h: 60, keys: [{ t: 0, x: 200, y: 200 }, { t: 0.45, x: 990, y: 600 }, { t: 0.5, x: 1000, y: 610 }, { t: 1, x: 1270, y: 300 }] }] } as never, "5. REQUIRED: you (focal): x; miklos (support): y; whetstone (support): z; planks (support): p; stone (support): s");
  assert.equal(spec.items.find((item) => item.id === "miklos")!.x, 760, "a person is never moved off a thing");
  assert.ok(!warnings.some((line) => line.includes("che")), "nothing covers anything: " + warnings.join("; "));
  const split = motionSceneSpecSplit(['"miklos" che "whetstone" – đã dời sang bên', 'Bỏ "gadget": kho không có "x" (cũng không có đồ gần đúng cùng thời đại)', "Cảnh thiếu: banner", 'Bỏ "far": che "gap" mà không dời được', 'Bỏ ô phóng to vào "cart": thứ được phóng không rõ']);
  assert.equal(split.issues.length, 3, "dropped things and missing ones are what a scene lacks");
  assert.equal(split.notes.length, 2, "a repair is a note");
}
// A big thing in front of the focal subject goes behind it, aside or is left out; thick haze is thinned.
{
  const { spec, warnings } = fix({ items: [person("you", 640, { focal: true }), { id: "barn", fn: "building", kind: "house", x: 640, y: 680, h: 420 }], haze: { kind: "dust", amount: 0.9 } });
  const barn = spec.items.find((item) => item.id === "barn");
  assert.ok(!barn || barn.y! < 620 || Math.abs(barn.x! - 640) > 150, "the focal subject is not covered (the barn behind it, aside or left out)");
  assert.ok(warnings.length > 0);
  assert.ok(spec.haze!.amount <= S.HAZE_MAX);
}
// A REQUIRED id the spec leaves out is a warning (a scene may leave things out; it is never wrong).
{
  const { warnings } = fix({ items: [person("you", 400, { focal: true })] }, "5. REQUIRED: you (focal): a soldier; banner (support): a red banner");
  assert.ok(warnings.some((line) => line.includes("banner")), "the missing banner is reported");
}

// ---------- the page ----------
const page = motionSceneSpecPage(fix({ items: [person("you", 400, { focal: true })] }).spec);
assert.ok(motionIsSpecPage(page) && motionSceneSpecOf(page)?.items[0].id === "you", "the page carries the spec and is read back");
assert.ok(motionSceneSpecOf(motionSceneSpecPage({ version: 1, horizon: 300, time: "day", ground: "dirt", items: [{ id: "x", fn: "prop", kind: "sign", x: 1, y: 1, h: 1, look: { text: "</script><b>" } }] }))?.items[0].look?.text === "</script><b>", "a closing tag inside the spec cannot end the script");
assert.doesNotThrow(() => new Function(MOTION_SCENE_ENGINE), "the engine is valid script");

// ---------- the engine on real pages ----------
const RECORD = "window.__MOTION_HOST__=true;window.__motionMarks=[];window.motionMark=function(ctx,id,x,y,w,h){const t=ctx.getTransform();const p=[[x,y],[x+w,y],[x,y+h],[x+w,y+h]].map(([a,b])=>[t.a*a+t.c*b+t.e,t.b*a+t.d*b+t.f]);const xs=p.map(q=>q[0]),ys=p.map(q=>q[1]);window.__motionMarks.push({id:String(id),x:Math.min(...xs),y:Math.min(...ys),w:Math.max(...xs)-Math.min(...xs),h:Math.max(...ys)-Math.min(...ys)});};";
const out = fs.mkdtempSync(path.join(os.tmpdir(), "scene-spec-"));
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome" });
const show = async (spec: MotionSceneSpec, name: string, progress = 0.5, profile = "history") => {
  const tab = await browser.newPage({ viewport: { width: spec.frame?.[0] || 1280, height: spec.frame?.[1] || 720 } });
  const errors: string[] = [];
  tab.on("pageerror", (error) => errors.push(String(error)));
  await tab.setContent(motionHtmlFigures(motionSceneSpecPage(spec), { profile, layout: "wide", year: 1241 }).replace("<head>", `<head><script>${RECORD}</script>`));
  const result = await tab.evaluate(async ([at, size]: [number, [number, number]]) => {
    const w = window as any;
    await w.motionScene.ready;
    w.__motionMarks = [];
    const canvas = document.querySelector("canvas") as HTMLCanvasElement;
    await w.motionScene.renderAt({ mode: "export", width: size[0], height: size[1], time: at * 6, frame: Math.round(at * 180), fps: 30, duration: 6, progress: at, motionEnabled: true, cameraEnabled: false, sceneEffectsEnabled: true, seed: "x", speaking: [] });
    const d = canvas.getContext("2d")!.getImageData(0, 0, canvas.width, canvas.height).data;
    const colours = new Set<number>();
    for (let i = 0; i < d.length; i += 4 * 211) colours.add((d[i] >> 4) * 256 + (d[i + 1] >> 4) * 16 + (d[i + 2] >> 4));
    return { marks: w.__motionMarks as { id: string; x: number; y: number; w: number; h: number }[], colours: colours.size, width: canvas.width, height: canvas.height };
  }, [progress, [spec.frame?.[0] || 1280, spec.frame?.[1] || 720]] as [number, [number, number]]);
  await tab.screenshot({ path: path.join(out, name + ".png") });
  await tab.close();
  assert.deepEqual(errors, [], `${name}: no page errors`);
  assert.ok(result.colours > 12, `${name}: the picture is drawn (${result.colours} colours)`);
  return result;
};
const inFrame = (marks: { id: string; x: number; y: number; w: number; h: number }[], id: string, W = 1280, H = 720) => {
  const own = marks.filter((mark) => mark.id === id);
  assert.ok(own.length > 0, `${id} is drawn and marked`);
  const cx = own[0].x + own[0].w / 2, cy = own[0].y + own[0].h / 2;
  assert.ok(cx > 0 && cx < W && cy > 0 && cy < H && own[0].w > 4 && own[0].h > 4, `${id} is inside the frame`);
};
try {
  // A battle line: a crowd, a rider, a wall from/to, a burning wagon, a thought bubble and an emote; smoke and dust.
  const battle = fix(
    {
      horizon: 300, time: "dusk", ground: "grass", ridge: "hills", sky: { clouds: 3, birds: true, sun: true },
      scatter: [{ kind: "rock", count: 6 }, { kind: "stuckArrow", count: 5 }],
      haze: { kind: "dust", amount: 0.2 },
      effects: [{ kind: "darkSmoke", x: 1000, y: 520, r: 90 }],
      items: [
        person("you", 420, { focal: true, look: { outfit: "soldier", hold: "spear" }, keys: [{ at: 0, x: 380 }, { at: 1, x: 520, pose: "walk" }] }),
        { id: "rider", fn: "person", x: 760, y: 600, h: 200, mount: "horse", mountLook: { barding: "#7a2a2a" }, look: { outfit: "knight", hold: "banner", itemColor: "#c33" } },
        { id: "levies", fn: "person", x: 300, y: 470, h: 120, group: { count: 9, width: 420, rows: 2 }, look: { outfit: "levy", hold: "spear" } },
        { id: "palisade", fn: "wall", kind: "palisade", from: 820, to: 1260, y: 430, h: 110 },
        { id: "wagon", fn: "vehicle", kind: "wagon", x: 1040, y: 560, h: 120, burning: true },
      ],
      devices: [{ kind: "thought", of: "you", x: 230, y: 160, r: 90, items: [{ id: "home", fn: "building", kind: "house", x: 0, y: 30, h: 80 }] }, { kind: "emote", of: "rider", sign: "alarm" }],
    },
    "5. REQUIRED: you (focal): a soldier; rider (support): a knight",
  ).spec;
  const battleShot = await show(battle, "battle");
  for (const id of ["you", "rider", "levies", "palisade", "wagon"]) inFrame(battleShot.marks, id);
  await show(battle, "battle-cutout", 0.9, "cutout");
  // A steppe raid on a far village: stakes and an earthwork as walls, fire arrows and a volley in flight, a market stall,
  // Mongol riders in lamellar and a levy in a wrapped coat.
  const raid = fix({
    horizon: 330, time: "dusk", ground: "grass", ridge: "low",
    items: [
      { id: "village", fn: "building", kind: "village", x: 1000, y: 360, h: 90 },
      { id: "stakes", fn: "wall", kind: "stakes", from: 80, to: 620, y: 600, h: 120 },
      { id: "bank", fn: "wall", kind: "rampart", from: 700, to: 1240, y: 470, h: 70 },
      { id: "stall", fn: "building", kind: "awning", x: 1120, y: 520, h: 150 },
      { id: "khan", fn: "person", x: 420, y: 520, h: 170, mount: "horse", look: { region: "steppe", outfit: "soldier", hold: "bow" }, focal: true },
      { id: "levy", fn: "person", x: 820, y: 640, h: 230, look: { region: "steppe", outfit: "levy", hold: "spear" } },
      { id: "flame", fn: "prop", kind: "fireArrow", x: 640, y: 260, h: 40, keys: [{ at: 0, x: 300, y: 200 }, { at: 1, x: 900, y: 330 }] },
      { id: "volley", fn: "prop", kind: "volley", x: 700, y: 200, h: 120 },
    ],
  }, "5. REQUIRED: khan (focal): a Mongol rider").spec;
  assert.equal(raid.items.length, 8, "the new library things are found by their usual names (none dropped)");
  const raidShot = await show(raid, "raid", 0.5);
  for (const id of ["village", "stakes", "bank", "stall", "khan", "levy", "flame", "volley"]) inFrame(raidShot.marks, id);
  // Staging when shown (no AI): an idea marker and edge junk left out, a natural framing rock kept small, the scene seen
  // from further back when drawn too close, a crowded cavalry block given the width its riders need, three named men
  // apart, a bridge and a wagon fort with an opening.
  const crowded = { version: 1, horizon: 300, time: "day", ground: "grass", water: [{ kind: "river", y: 560, h: 50 }], items: [
    { id: "gap", fn: "prop", kind: "earthwork", x: 300, y: 360, h: 40 },
    { id: "fg_wheel", fn: "prop", kind: "brokenWheel", x: 1180, y: 712, h: 120 },
    { id: "fg_rock", fn: "prop", kind: "boulder", x: 60, y: 715, h: 260 },
    { id: "riders", fn: "person", x: 900, y: 470, h: 200, mount: "horse", group: { count: 6, width: 300, rows: 2 }, look: { region: "steppe", outfit: "soldier" } },
    { id: "fort", fn: "wall", kind: "wagonFort", from: 40, to: 560, y: 420, h: 70, gaps: [[240, 330]] },
    { id: "bridge", fn: "bridge", x: 640, y: 560, w: 520, h: 40 },
    person("you", 600, { focal: true, y: 690, h: 520 }), person("miklos", 660, { y: 690, h: 500 }), person("andras", 720, { y: 690, h: 500 }),
  ] } as unknown as MotionSceneSpec;
  const tab = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await tab.setContent(motionHtmlFigures(motionSceneSpecPage(crowded), { profile: "cutout", layout: "wide", year: 1241 }).replace("<head>", `<head><script>${RECORD}</script>`));
  const staged = await tab.evaluate(async () => {
    const w = window as any; await w.motionScene.ready; w.__motionMarks = [];
    await w.motionScene.renderAt({ mode: "export", width: 1280, height: 720, time: 3, frame: 90, fps: 30, duration: 6, progress: 0.5, motionEnabled: true, cameraEnabled: false, sceneEffectsEnabled: true, seed: "x", speaking: [] });
    const S = w.__motionSpec;
    return { ids: S.items.map((it: any) => it.id), master: S.__master, items: Object.fromEntries(S.items.map((it: any) => [it.id, { x: it.x, y: it.y, h: it.h, group: it.group }])), marks: w.__motionMarks };
  });
  await tab.screenshot({ path: path.join(out, "staged.png") });
  await tab.close();
  assert.ok(!staged.ids.includes("gap") && !staged.ids.includes("fg_wheel"), "an idea marker and junk at the frame's edge are left out");
  assert.ok(staged.items.fg_rock.h <= 720 * 0.18 + 0.5, "a framing rock is at most 18 % of the frame");
  assert.ok(staged.master > 0.5 && staged.master < 0.65 && Math.abs(staged.items.you.h - 288) < 2, "the scene is seen from further back: the lead 40 % of the frame (" + staged.master + ")");
  const g = staged.items.riders.group, cols = Math.ceil(g.count / g.rows);
  assert.ok(g.width >= cols * staged.items.riders.h * 1.0 * 0.95 - 1 || g.count < 6, "the riders get the width they need, or fewer riders");
  const named = ["you", "miklos", "andras"].map((id) => staged.items[id]).sort((a: any, b: any) => a.x - b.x);
  for (let i = 1; i < named.length; i++) assert.ok(named[i].x - named[i - 1].x > named[i].h * 0.3 || Math.abs(named[i].y - named[i - 1].y) > 10, "named men stand apart or one behind the other");
  for (const id of ["bridge", "fort", "riders", "you"]) inFrame(staged.marks, id);
  // An interior: a room, a seated person at a table.
  const hall = fix({ horizon: 420, time: "day", ground: "stone", interior: { wall: "#9a8466", floor: "#6f5b45" }, items: [{ id: "table", fn: "prop", kind: "table", x: 640, y: 640, h: 110 }, { id: "bench", fn: "prop", kind: "bench", x: 560, y: 650, h: 60 }, person("king", 560, { focal: true, on: "bench", look: { outfit: "king", pose: "sit" } })] }).spec;
  inFrame((await show(hall, "hall")).marks, "king");
  // A map: land, a river, places and a force moving along its keys with an arrow.
  const map = { version: 1, horizon: 300, time: "day", ground: "dirt", items: [], map: { paper: "#e8dcc0", land: [[[80, 80], [1200, 60], [1240, 660], [60, 680]]], rivers: [[[200, 100], [500, 400], [700, 700]]], places: [{ name: "Pest", x: 600, y: 360, big: true }, { name: "Mohi", x: 900, y: 220 }], forces: [{ id: "army", side: "Mongols", color: "#a33", x: 1000, y: 200, size: 22, keys: [{ at: 0, x: 1000, y: 200 }, { at: 1, x: 700, y: 330 }] }], arrows: [{ from: [1000, 200], to: [700, 330], color: "#a33", at: [0, 0.8] }] } } as unknown as MotionSceneSpec;
  motionSceneSpecFix(map, { year: 1241, map: true, gaps: [] });
  inFrame((await show(map, "map", 0.8)).marks, "army");
  // A portrait thumbnail with its headline.
  const thumb = fix({ frame: [720, 1280], horizon: 700, items: [{ ...person("sister", 470, { focal: true }), y: 1180, h: 700 }], headline: { lines: ["TIẾNG GỌI", "BÊN GIẾNG"], x: 50, y: 260, size: 120, accent: "GIẾNG" } }).spec;
  const thumbShot = await show(thumb, "thumbnail", 0.5, "horror");
  assert.equal(thumbShot.width, 720);
  inFrame(thumbShot.marks, "sister", 720, 1280);
  console.log(`Scene spec: read, fixed (near kinds, drops, sizes, seats, covers, insets, haze, one focal, missing ids) and drawn by the engine (crowds, riders, walls, fire, devices, rooms, maps, a portrait headline). Pictures: ${out}`);
} finally {
  await browser.close();
}
