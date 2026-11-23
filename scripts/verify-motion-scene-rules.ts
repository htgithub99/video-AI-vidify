import assert from "node:assert/strict";
import { chromium } from "playwright";
import { motionSceneSpecPage } from "../src/lib/motionSceneSpec.js";
import { motionHtmlFigures } from "../src/lib/motionFigures.js";
import { motionTimeCue } from "../src/lib/motionTimeline.js";
import { motionPlaceLooks } from "../src/lib/motionPlaceLooks.js";
import { motionDeviceRests } from "../src/lib/motionDeviceRests.js";
import { motionDrawnTime } from "../src/lib/motionTimeline.js";
import { motionDrawnTimes } from "../src/lib/motionDrawnTimes.js";
import { motionSceneCastLooks } from "../src/lib/motionSceneCast.js";
import { motionLanguagePace, motionTextLanguage } from "../src/lib/motionLanguage.js";
type Item = Record<string, any>;
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome" });
const revised = async (spec: Item, text: string, extra: Item = {}, frame: [number, number] = [1280, 720], view: Item = {}) => {
  const tab = await browser.newPage({ viewport: { width: frame[0], height: frame[1] } });
  const errors: string[] = [];
  tab.on("pageerror", (e) => errors.push(String(e)));
  await tab.setContent(motionHtmlFigures(motionSceneSpecPage({ version: 1, horizon: 300, time: "day", ground: "grass", frame, ...spec } as never), { profile: "cutout", layout: frame[0] > frame[1] ? "wide" : "tall", year: 1241, ...view, scene: { text, ...extra } } as never));
  const out = await tab.evaluate(async () => {
    const w = window as any;
    await w.motionScene.ready;
    await w.motionScene.renderAt({ mode: "export", width: innerWidth, height: innerHeight, time: 3, progress: 0.5, duration: 8, motionEnabled: true, cameraEnabled: false, sceneEffectsEnabled: true, seed: "s", speaking: [] });
    return { spec: w.__motionSpec, notes: w.__motionNotes as [string, string][] };
  });
  await tab.close();
  assert.deepEqual(errors, []);
  return out;
};
const person = (id: string, x: number, y: number, region: string, pose: string, extra: Item = {}): Item => ({ id, fn: "person", x, y, h: 170, facing: region === "europe" ? 1 : -1, look: { outfit: "levy", region, pose, hold: "spear", top: region === "europe" ? "#b8893a" : "#3b3128" }, ...extra });
const site = { over: "river", x: 0.65, wide: 0.14, near: "left", sides: { europe: "left", steppe: "right" } };
try {
  for (const frame of [
    [1280, 720],
    [720, 1280],
  ] as [number, number][]) {
    const [W, H] = frame,
      k = W / 1280;
    const bridgeFight = await revised(
      {
        horizon: Math.round(H * 0.39),
        time: "night",
        water: [{ kind: "river", y: Math.round(H * 0.47), h: 50 }],
        items: [{ id: "bridge", fn: "bridge", x: W / 2, y: H * 0.75, h: 160, w: 680 * k }, person("you", 450 * k, H * 0.84, "europe", "thrust"), person("rider", 640 * k, H * 0.84, "steppe", "fight", { mount: "horse", h: 230 }), person("bodies", 690 * k, H * 0.88, "europe", "lie", { group: { count: 3, width: 300 } })],
      },
      "you thrust forward in the dark, shoving riders back off the narrow timbers over sprawled bodies",
      { crossing: site, time: "day" },
      frame,
    );
    const fighters = bridgeFight.spec.items.filter((it: Item) => it.fn === "person" && !String(it.id).includes("__"));
    assert.ok(
      fighters.every((it: Item) => it.deck),
      "melee on the bridge stands on its deck",
    );
    assert.ok(!bridgeFight.notes.some(([kind]) => kind === "qa-water"), "no fighting pair split by water");
    assert.equal(bridgeFight.spec.time, "night", "the scene's own night is not forced to the beat's day");
    const bank = await revised({ water: [{ kind: "river", y: 330, h: 90 }], items: [{ id: "bridge", fn: "bridge", x: 900, y: 360, h: 45, w: 240 }, person("you", 700, 595, "europe", "push", { bank: "near" }), person("soldier", 580, 592, "steppe", "fight", { bank: "near" })] }, "steel clashes as you shove against the press", { crossing: site }, frame);
    const [you, foe] = ["you", "soldier"].map((id) => bank.spec.items.find((it: Item) => it.id === id));
    assert.ok(Math.abs(you.x - foe.x) < 400 * k + 200, "a fighting pair stays on one bank");
  }
  const far = await revised({ water: [{ kind: "river", y: 335, h: 55 }], items: [{ id: "bridge", fn: "bridge", x: 270, y: 355, h: 28, w: 150 }, { id: "wagons", fn: "wall", kind: "wagonFort", y: 515, h: 105, from: 200, to: 1100 }, person("you", 960, 605, "europe", "run")] }, "After dark, shouts erupt by the bridge and you sprint out of the wagon ring", { crossing: site });
  assert.ok(!far.spec.water.some((w: Item) => w.into), "a far river by a camp stays at the back (no river through the camp)");
  const stone = await revised(
    {
      items: [
        { id: "catapult", fn: "vehicle", kind: "catapult", x: 300, y: 380, h: 70 },
        person("you", 900, 600, "europe", "stand"),
        {
          id: "rock",
          fn: "prop",
          kind: "slingStone",
          x: 300,
          y: 340,
          h: 6,
          keys: [
            { at: 0.1, x: 300, y: 340 },
            { at: 0.5, x: 880, y: 590 },
          ],
        },
      ],
    },
    "catapults hurl boulders into your line",
  );
  const rock = stone.spec.items.find((it: Item) => it.id === "rock");
  assert.equal(rock.kind, "siegeStone");
  assert.ok(rock.h >= 50, `a catapult stone is as big as a boulder where it lands (${rock.h})`);
  const arrow = await revised(
    {
      items: [
        person("you", 900, 600, "europe", "stand"),
        {
          id: "arrow",
          fn: "prop",
          kind: "arrow",
          x: 300,
          y: 400,
          h: 2,
          dist: "mid",
          keys: [
            { at: 0.3, x: 300, y: 400 },
            { at: 0.6, x: 880, y: 560 },
          ],
        },
      ],
    },
    "arrows whistle past your neck",
  );
  const a = arrow.spec.items.find((it: Item) => it.id === "arrow");
  assert.ok((a.h * 0.45) / 0.06 >= 1280 * 0.04 - 1, "a flying arrow is long enough to see");
  const counts = await revised(
    {
      items: [person("a", 400, 600, "europe", "stand", { group: { count: 6, width: 300 } })],
      devices: [
        { kind: "count", groups: [{ n: 6, of: "a" }] },
        { kind: "count", groups: [{ n: 25000, of: "a" }] },
      ],
    },
    "a sergeant shouts that twenty-five thousand men pack this river",
  );
  assert.deepEqual(
    counts.spec.devices.filter((d: Item) => d.kind === "count").map((d: Item) => d.groups[0].n),
    [25000],
    "a count shows only a number the narration says",
  );
  const down = await revised(
    {
      items: [
        person("you", 500, 600, "europe", "lie", {
          keys: [
            { at: 0, pose: "lie" },
            { at: 0.4, pose: "cower" },
          ],
        }),
      ],
    },
    "you curl under your shield, pinned flat",
  );
  assert.equal(down.spec.items.find((it: Item) => it.id === "you").keys[1].pose, "lie", "a lying man stays down");
  const horn = await revised({ items: [person("herald", 500, 600, "europe", "raise", { look: { outfit: "soldier", hold: "horn", pose: "raise", region: "europe" } })] }, "brass horns blast as the herald calls");
  assert.equal(horn.spec.items[0].look.pose, "blow", "a horn being blown is at the mouth");
  const ditch = await revised({ items: [{ id: "ditch", fn: "prop", kind: "ditch", x: 450, y: 608, h: 68 }, person("you", 380, 600, "europe", "stand")] }, "you duck behind a ditch");
  const d = ditch.spec.items.find((it: Item) => it.id === "ditch"),
    y = ditch.spec.items.find((it: Item) => it.id === "you");
  assert.ok(d.w > 400 && y.y < d.y, "a ditch is a long trench and the one who ducks is behind it");
  const ring = await revised({ items: [{ id: "ring", fn: "wall", kind: "wagonFort", y: 415, h: 84, from: 0, to: 1280, shape: "ring" }, person("you", 500, 600, "europe", "stand")] }, "crowded inside the wagon ring");
  assert.ok(!ring.notes.some(([kind]) => kind === "qa-float"), "a wagon ring sits on the ground");
  assert.equal(motionTimeCue("Damp mist just after dawn when drums shake the ground"), "dawn");
  assert.equal(motionTimeCue("After dark, shouts erupt by the bridge"), "night");
  const looks = motionPlaceLooks(
    [
      { ground: "grass", sun: 1000 },
      { ground: "dirt", sun: 200 },
      { ground: "dirt", sun: 1100 },
    ].map((s, i) => ({ beatId: "b", html: { html: motionSceneSpecPage({ version: 1, horizon: 300, time: "day", ground: s.ground, sky: { sunX: s.sun }, items: [{ id: "x" + i, fn: "prop", kind: "rock", x: 100, y: 600, h: 40 }] } as never) } })),
    [{ id: "b", place: "sajo" }],
  );
  assert.ok(
    looks.every((s) => s.placeLook?.ground === "dirt" && s.placeLook?.sun === "right"),
    "one place keeps one ground and one sun side",
  );
  const bare = (hold: string) => person("refugee", 700, 600, "europe", "stand", { look: { outfit: "peasant", hold, pose: "stand", region: "europe" } });
  const empty = await revised({ items: [bare("none")], devices: [{ kind: "inset", of: "refugee", part: "hand", r: 110 }] }, "a refugee grabs your sleeve");
  assert.ok(!empty.spec.devices.length && !empty.spec.items[0].look.hold, "a hold of none is an empty hand and gets no close-up");
  const whet = await revised({ items: [bare("none")], devices: [{ kind: "inset", of: "refugee", part: "hand", r: 110 }] }, "she presses a worn whetstone into your hand");
  assert.equal(whet.spec.devices[0]?.thing, "whetstone", "a small thing the line names is the close-up");
  const busy = await revised(
    { items: [person("you", 500, 600, "europe", "stand"), person("men", 800, 600, "europe", "stand", { group: { count: 4, width: 200 } })], devices: [{ kind: "emote", of: "men", sign: "alarm" }, { kind: "emote", of: "you", sign: "alarm" }, { kind: "sound", of: "you" }, { kind: "thought", of: "you", items: [{ id: "t", fn: "prop", h: 40 }] }, { kind: "impact", x: 500, y: 400, r: 30 }] },
    "you stand still in the camp",
  );
  assert.deepEqual(busy.spec.devices.map((d: Item) => d.kind + ":" + d.of), ["emote:you"], "one sign over one person; no sound, blow or empty thought the line does not tell");
  const rested = await revised({ items: [person("you", 500, 600, "europe", "stand")], devices: [{ kind: "emote", of: "you", sign: "alarm" }] }, "you stand still in the camp", { rest: true });
  assert.equal(rested.spec.devices.length, 0, "no sign right after a scene that had one");
  const rests = motionDeviceRests(["a", "b", "c"].map((t) => ({ text: t === "b" ? "he says go" : "you wait", html: { html: motionSceneSpecPage({ version: 1, horizon: 300, time: "day", ground: "grass", items: [person("you", 500, 600, "europe", "stand")], devices: [{ kind: "emote", of: "you", sign: "alarm" }] } as never) } })));
  assert.deepEqual(rests.map((s) => !!s.rest), [false, true, true], "overlays rest every other scene");
  const spear = await revised({ items: [bare("none"), { id: "dropped_spear", fn: "prop", kind: "spear", x: 420, y: 590, h: 18, w: 96 }] }, "she lies in the grass");
  const sp = spear.spec.items.find((it: Item) => it.id === "dropped_spear");
  assert.ok(sp.w < 260 && sp.h < 60 && !sp.look?.angle, "a lying spear is as long as a spear, never a beam across the frame");
  const shields = await revised({ items: [person("you", 500, 600, "europe", "crawl"), { id: "shield_2", fn: "prop", kind: "roundShield", x: 700, y: 610, h: 80 }] }, "you trip over dropped shields");
  assert.ok(shields.spec.items.find((it: Item) => it.id === "shield_2").look.lying, "a dropped shield lies flat");
  const tent = await revised({ items: [person("you", 500, 600, "europe", "stand"), { id: "t", fn: "building", kind: "campTent", x: 1000, y: 310, h: 220 }, { id: "ghost", fn: "person", x: -999, y: 306, h: 54 }] }, "you stand by the camp");
  assert.ok(tent.spec.items.find((it: Item) => it.id === "t").h < 120 && !tent.spec.items.some((it: Item) => it.id === "ghost"), "a far tent is far-sized; a person put off the frame is dropped");
  assert.equal(motionDrawnTime("dawn", "you wait by the gate", "night"), "dawn", "the drawn time is the scene's own unless the line and the beat agree");
  const near = motionPlaceLooks(
    [["a", "sand", "you march east"], ["b", "grass", "you reach the river"], ["c", "grass", "you cross a green meadow"]].map(([beat, ground, text]) => ({ beatId: beat, text, html: { html: motionSceneSpecPage({ version: 1, horizon: 300, time: "day", ground, items: [{ id: "r", fn: "prop", kind: "rock", x: 100, y: 600, h: 40 }] } as never) } })),
    [{ id: "a", place: "road" }, { id: "b", place: "river" }, { id: "c", place: "meadow" }],
  );
  assert.deepEqual(near.map((s) => s.placeLook?.ground), [undefined, "sand", undefined], "nearby places of one chapter keep one ground until the line names another");
  const holder = (id: string, x: number, hold: string) => person(id, x, 600, "europe", "stand", { look: { outfit: "levy", region: "europe", pose: "stand", hold } });
  const handed = await revised({ items: [holder("miklos", 600, "crossbow"), holder("you", 450, "crossbow"), { id: "bolt", fn: "prop", kind: "bolt", x: 560, y: 510, h: 34, heldBy: "miklos" }], devices: [{ kind: "inset", of: "miklos", part: "hand", r: 110 }] }, "miklos carves a notch into a feathered bolt and presses the bolt into your palm");
  const bolt = handed.spec.items.find((it: Item) => it.id === "bolt"), mk = handed.spec.items.find((it: Item) => it.id === "miklos");
  assert.ok(bolt.h < 16 && mk.look.hold === "dagger" && handed.spec.devices[0]?.thing === "bolt", "a held bolt is bolt-sized, carving takes a knife and the bolt the line is about gets the close-up");
  const aside = await revised({ items: [holder("you", 450, "none")], devices: [{ kind: "inset", of: "you", part: "hand", r: 110 }] }, "captains scream orders, leaving you with the notched bolt in hand");
  assert.equal(aside.spec.devices.length, 0, "a thing only named in passing gets no close-up");
  const echo = await revised(
    { items: [person("riders", 300, 600, "steppe", "ride"), { id: "church", fn: "building", kind: "church", x: 900, y: 420, h: 120 }, holder("woman", 640, "none")], devices: [{ kind: "thought", of: "riders", items: [{ id: "c", fn: "building", kind: "church", h: 50 }, { id: "r", fn: "person", h: 40, mount: "horse" }] }] },
    "the woman grips your wrist, gasping that riders burn the monasteries",
  );
  assert.equal(echo.spec.devices.length, 0, "a thought that repeats the picture, or belongs to no one who speaks, is dropped");
  const fort = await revised({ items: [{ id: "ring", fn: "wall", kind: "wagonFort", y: 470, h: 80 }, person("you", 400, 600, "europe", "stand"), person("raiders", 900, 560, "steppe", "ride")] }, "hooves thunder against the wagon wall");
  assert.ok(fort.spec.items.find((it: Item) => it.id === "raiders").y < 470, "the enemy stays outside the wagon wall unless the line breaks it");
  const titled = await revised({ items: [person("ugrin_csak", 500, 600, "europe", "stand", { look: { outfit: "noble", region: "europe", pose: "stand", head: "crownHelmet" } }), person("tomas", 800, 600, "europe", "stand")] }, "archbishop ugrin csak blesses the line as tomas nudges your ribs");
  const ug = titled.spec.items.find((it: Item) => it.id === "ugrin_csak"), tm = titled.spec.items.find((it: Item) => it.id === "tomas");
  assert.ok(ug.look.head === "mitre" && ug.look.emblem === "cross" && tm.keys.some((k: Item) => k.pose === "push"), "a prelate wears no crown but a mitre and a cross; a told nudge is drawn");
  const tinted = await revised({ items: [person("you", 400, 600, "europe", "stand"), person("rider", 900, 600, "steppe", "stand")] }, "a rider waits", {}, [1280, 720], { cast: { "*": { home: "europe" } } });
  const rt = tinted.spec.items.find((it: Item) => it.id === "rider").look.top;
  assert.ok(rt !== "#3b3128", "the other side wears its own colour in every scene of the video");
  const times = motionDrawnTimes(
    [["b1", "night", "after dark riders burst out"], ["b1", "dawn", "you hold the span"], ["b2", "day", "a messenger screams that they crossed in the dark"], ["b2", "night", "you stand"], ["b2", "day", "you wait"]].map(([beatId, time, text]) => ({ beatId, text, html: { html: motionSceneSpecPage({ version: 1, horizon: 300, time, ground: "grass", items: [] } as never) } })),
    [{ id: "b1", time: "night" }, { id: "b2", time: "day" }],
  );
  assert.deepEqual(times.map((s) => s.drawTime), ["night", "night", "day", "day", "day"], "no time jumps inside a beat; a reported time is not the scene's");
  const kept = motionSceneCastLooks(["helmet", "crownHelmet"].map((head) => ({ html: { html: motionSceneSpecPage({ version: 1, horizon: 300, time: "day", ground: "grass", items: [person("ugrin", 500, 600, "europe", "ride", { look: { outfit: "noble", region: "europe", head } }), person("you", 300, 600, "europe", "stand"), person("rider", 900, 600, "steppe", "ride")] } as never) } })));
  assert.ok(kept.ugrin?.["look:head"] === "helmet" && kept["*"]?.home === "europe", "a named person keeps the look of their first scene; the home side is the narrator's");
  assert.equal(motionTextLanguage("Trận Mohi năm 1241"), "vi");
  assert.ok(motionLanguagePace("en", "vi") < 1, "an English script reads fewer words a second than a Vietnamese reference");
  console.log("verify-motion-scene-rules: ok");
} finally {
  await browser.close();
}
