import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { chromium } from "playwright";
import FIXTURE from "./fixtures/motion-stage-constraints-20261026.json";
import { STAGE_QA as Q } from "./motionStageConstraintsVerificationTexts.js";
import { COMFORT_QA as ENGINE } from "./motionComfortVerificationTexts.js";
import { MOTION_PACK as K } from "../src/constants/motionPack.js";
import { PUPPET_TYPES as T } from "../src/constants/motionPuppet.js";
import { normalizePuppetObjectSupport } from "../src/lib/motionPropSupport.js";
import { canonicalPuppetReadObjects, puppetReadObjects } from "../src/lib/motionReadObjects.js";
import { puppetPropFits } from "../src/lib/motionPuppetAssets.js";
import { listPuppets, readPuppet } from "../src/server/services/puppet/kitLibrary.js";
import { runWithPuppetPack } from "../src/server/services/puppet/packPolicy.js";
import { puppetSetMissingRequirements, puppetSetPlacementNeeds, puppetSetReadFeatures, puppetSpots } from "../src/server/services/puppet/layout.js";
import { buildPuppetSets } from "../src/server/services/puppet/setComposer.js";
import { createPuppetSceneChoices } from "../src/server/services/puppet/packSceneChoices.js";
import { puppetKitSpec } from "../src/server/services/puppet/compilePuppet.js";
import type { PuppetCharacter, PuppetGen, PuppetObject, PuppetRead, PuppetSet, PuppetStylePack } from "../src/types/motionPuppet.js";
const assets = K.TYPES.flatMap((type) => listPuppets(type as any));
const initial = JSON.stringify(assets);
const normalized = Object.fromEntries(
  Object.entries(structuredClone(FIXTURE.reads)).map(([key, raw]) => {
    const read = canonicalPuppetReadObjects(raw);
    const objects = read.objects.map(normalizePuppetObjectSupport);
    return [key, { ...read, objects, object: read.object ? objects.find((object) => object.key === read.object!.key) : null }];
  }),
) as Record<string, PuppetRead>;
const tray = Object.values(normalized)
  .flatMap(puppetReadObjects)
  .find((object) => object.physicalState === "overturned")!;
assert.equal(tray.support, undefined);
assert.equal(tray.placement?.anchor, "table");
assert.equal(tray.mount, "floor");
assert.deepEqual(normalizePuppetObjectSupport(tray), tray);
const tableObject = { ...tray, mount: "table", support: "table" };
assert.deepEqual(normalizePuppetObjectSupport(tableObject), tableObject);
const nested = { ...tray, mount: "table", support: "parent_tray" };
assert.deepEqual(normalizePuppetObjectSupport(nested), nested);
const unknownConflict = { ...tray, support: "bed" };
assert.equal(normalizePuppetObjectSupport(unknownConflict).support, "bed");
const samples: { name: string; kit: any; frame: any }[] = [];
for (const [preset, styleId] of Object.entries(K.PRESETS))
  await runWithPuppetPack(styleId, assets, async () => {
    const style = readPuppet<PuppetStylePack>(T.STYLE, styleId)!;
    const characters = listPuppets<PuppetCharacter>(T.CHARACTER).filter((asset) => asset.styleId === styleId);
    const male = characters.find((asset) => asset.gender === "male" && asset.age === "adult" && asset.archetype === "farmer") || characters.find((asset) => asset.gender === "male" && asset.age === "adult")!;
    const female = characters.find((asset) => asset.gender === "female" && asset.age === "adult" && asset.archetype === "village_woman") || characters.find((asset) => asset.gender === "female" && asset.age === "adult")!;
    assert.ok(male && female);
    const gen = { styleId, characters: { toi: male.id, chi_hai: female.id, co_hon_giong_chi_hai: female.id }, ghosts: ["co_hon_giong_chi_hai"], sets: {}, props: {}, reads: structuredClone(normalized), places: { [FIXTURE.place.key]: FIXTURE.place }, frames: {} } as PuppetGen;
    for (const object of Object.values(gen.reads!).flatMap(puppetReadObjects)) {
      const asset = assets.find((asset) => asset.type === T.PROP && asset.styleId === styleId && puppetPropFits(object, asset));
      assert.ok(asset, object.key);
      gen.props[object.key] = asset.id;
    }
    const reads = Object.values(gen.reads!);
    const lines = Object.entries(gen.reads!).map(([key, read]) => ({ key, text: read.visual!.evidence.join(" "), place: read.place, cast: read.who, visualUnit: { scene: read.visual!.scene } })) as any[];
    const weak = listPuppets<PuppetSet>(T.SET).find((set) => set.styleId === styleId && set.locationFamily === "courtyard" && !puppetSpots(set).some((spot) => (spot.fixture || spot.key).includes("gate")))!;
    assert.ok(weak);
    assert.ok(reads.some((read) => puppetSetMissingRequirements(weak, [read]).length));
    const place = { ...FIXTURE.place, sceneFeatures: puppetSetReadFeatures(reads) };
    let calls = 0;
    const reasons = new Map<string, number>();
    const diagnostics: string[] = [];
    const built = await buildPuppetSets(
      style,
      [
        {
          place,
          must: place.sceneFeatures,
          placements: puppetSetPlacementNeeds(reads),
          uses: "",
          validate: (set) => {
            const missing = puppetSetMissingRequirements(set, reads);
            if (missing.length) {
              for (const reason of missing) reasons.set(reason, (reasons.get(reason) || 0) + 1);
              return missing;
            }
            for (const line of lines)
              try {
                createPuppetSceneChoices(line, gen.reads![line.key], gen, style, undefined, set);
              } catch (error) {
                missing.push(String(error));
                reasons.set(String(error), (reasons.get(String(error)) || 0) + 1);
              }
            return missing;
          },
        },
      ],
      {
        exec: {},
        log: (line) => diagnostics.push(line),
        ai: async () => {
          calls++;
          throw new Error(K.DRAW_BLOCKED);
        },
      },
      preset,
    );
    if (!built[place.key]) process.stdout.write(JSON.stringify({ reasons: [...reasons], diagnostics }) + "\n");
    assert.equal(calls, 0);
    const set = built[place.key];
    assert.ok(set, JSON.stringify({ preset, features: place.sceneFeatures, placements: puppetSetPlacementNeeds(reads) }));
    assert.deepEqual(puppetSetMissingRequirements(set, reads), []);
    gen.sets[place.key] = set.id;
    const falseAnchor = { ...reads[0], states: [{ ...reads[0].states![0], placement: { relation: "at" as const, anchor: Q.UNKNOWN, evidence: reads[0].visual!.evidence[0] } }] };
    assert.ok(puppetSetMissingRequirements(set, [falseAnchor]).length);
    for (const line of lines) {
      const choices = createPuppetSceneChoices(line, gen.reads![line.key], gen, style);
      assert.ok(choices.length);
      if (gen.reads![line.key].who.length > 1 || gen.reads![line.key].object) samples.push({ name: preset + " · " + line.text, kit: puppetKitSpec(gen, false), frame: choices[0].frame });
    }
    process.stdout.write(JSON.stringify({ preset, scenes: lines.length, pieces: set.plan?.pieces.map((piece) => piece.piece) }) + "\n");
  });
assert.equal(JSON.stringify(K.TYPES.flatMap((type) => listPuppets(type as any))), initial);
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1940, height: 1250 } });
  await page.setContent(Q.HTML);
  for (const file of ENGINE.MOTION_ENGINE) await page.addScriptTag({ content: (await fs.readFile(file, "utf8")).replace(Q.HOOK, Q.EXPOSE) });
  await page.evaluate(async (samples) => {
    const me = (window as any).MotionEngine;
    for (const sample of samples) {
      const section = document.createElement("section"),
        title = document.createElement("div"),
        canvas = document.createElement("canvas");
      title.textContent = sample.name;
      canvas.width = 1920;
      canvas.height = 1080;
      canvas.style.width = "960px";
      section.append(title, canvas);
      document.body.append(section);
      await me.PUPPET_PRELOAD({ kit: sample.kit });
      const state = me.PUPPET2D.init({ spec: { kit: sample.kit }, params: { frames: [sample.frame] } });
      me.testDrawStage(canvas.getContext("2d"), { W: 1920, H: 1080 }, state, sample.frame, 0, 0);
    }
  }, samples);
  await page.screenshot({ path: Q.SCREENSHOT, fullPage: true });
} finally {
  await browser.close();
}
process.stdout.write(Q.PASSED);
