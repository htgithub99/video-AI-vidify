import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { chromium } from "playwright";
import { MOTION_PACK as K } from "../src/constants/motionPack.js";
import { PUPPET_TYPES as T } from "../src/constants/motionPuppet.js";
import { COMFORT_QA as ENGINE } from "./motionComfortVerificationTexts.js";
import { STAGE_QA as STAGE } from "./motionStageConstraintsVerificationTexts.js";
import { listPuppets, livePuppetLibrary } from "../src/features/motion/server/services/puppet/kitLibrary.js";
import { puppetPackAssetIssues } from "../src/features/motion/server/services/puppet/packInventory.js";
import { checkPuppetPlanReadiness } from "../src/features/motion/server/services/puppet/planReadiness.js";
import { withPuppetPackSnapshot } from "../src/features/motion/server/services/puppet/packPolicy.js";
import { createPuppetSceneChoices } from "../src/features/motion/server/services/puppet/packSceneChoices.js";
import { puppetKitSpec } from "../src/features/motion/server/services/puppet/compilePuppet.js";
import { motionIllustrationNeedsErrors } from "../src/lib/motionIllustrationNeeds.js";
import { isMotionResourceError } from "../src/lib/motionResourceFailure.js";
import { runWithPuppetPack } from "../src/features/motion/server/services/puppet/packPolicy.js";
import type { PuppetAsset, PuppetGen, PuppetRead, PuppetStylePack } from "../src/types/motionPuppet.js";
import type { MotionStoryAnalysis } from "../src/types/motionVideo.js";
import { normalizeMotionIllustrationNeeds } from "../src/lib/motionIllustrationNeeds.js";
import { puppetSetWithFixtureStates } from "../src/features/motion/server/services/puppet/packFixtures.js";
import { capturePuppetPack } from "../src/features/motion/server/services/puppet/packPolicy.js";
import type { PuppetSet } from "../src/types/motionPuppet.js";
const option = (name: string) => process.argv.find((value) => value.startsWith(name + "="))?.slice(name.length + 1);
const sourceDirectory = path.resolve("docs/video-references/resource-coverage-20261026");
const directory = path.resolve(option("--output") || sourceDirectory);
const scratch = option("--output") ? directory : path.resolve("scratch/reference-coverage-audit-20261026");
await fs.mkdir(directory, { recursive: true });
await fs.mkdir(scratch, { recursive: true });
const source = JSON.parse(await fs.readFile(path.join(sourceDirectory, "observations.json"), "utf8"));
const probeCorrections: string[] = [];
if (option("--additional"))
  for (const probe of JSON.parse(await fs.readFile(path.resolve(option("--additional")!), "utf8"))) {
    const index = source.probes.findIndex((current: any) => current.id === probe.id);
    if (index < 0) source.probes.push(probe);
    else {
      source.probes[index] = probe;
      probeCorrections.push(probe.id);
    }
  }
if (option("--probe")) source.probes = source.probes.filter((probe: any) => option("--probe")!.split(",").includes(probe.id));
const inventory = () => K.TYPES.flatMap((type) => listPuppets(type as any));
const assets: PuppetAsset[] = option("--inventory") ? JSON.parse(await fs.readFile(path.resolve(option("--inventory")!), "utf8")) : inventory();
const fingerprint = (value: PuppetAsset[]) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const before = fingerprint(inventory());
const packs = Object.entries(K.PRESETS).map(([preset, styleId]) => ({ preset, styleId, assets: assets.filter((asset) => ("styleId" in asset && asset.styleId === styleId) || asset.id === styleId) }));
const samples: any[] = [];
const probes: any[] = [];
for (const pack of packs)
  for (const probe of source.probes) {
    const logs: string[] = [];
    const objects = probe.objects.map((object: any) => ({ ...object, type: "other", word: pack.assets.find((asset: any) => asset.type === T.PROP && asset.key === object.catalogKey)?.name || object.catalogKey, size: 0.3, ...(object.mount === "held" ? { owner: "actor_0" } : {}) }));
    const evidence = probe.evidence || `${probe.id}: ${probe.place}. ${objects.map((object: any) => object.word).join("; ")}`;
    const analysis: MotionStoryAnalysis = {
      title: probe.id,
      logline: evidence,
      stylePreset: pack.preset,
      cast: probe.states.map((state: any, i: number) => ({ key: state.char, name: state.char, gender: i % 2 ? "female" : "male", age: probe.infant === i ? "child" : "adult", role: "villager", look: probe.infant === i ? "Vietnamese baby infant" : "Vietnamese adult villager" })),
      chapters: [{ id: "chapter", summary: evidence }],
      places: [{ key: "place", name: probe.place, description: probe.place, interior: probe.interior, time: "day" }],
      illustrationNeeds: [{ id: "need", chapterId: "chapter", place: "place", evidence, features: probe.features, states: probe.states, objects }],
    } as MotionStoryAnalysis;
    try {
      const inputErrors = motionIllustrationNeedsErrors(analysis);
      if (inputErrors.length) throw new Error("AUDIT_INPUT: " + inputErrors.join("; "));
      const ready = (await runWithPuppetPack(pack.styleId, assets, () => checkPuppetPlanReadiness(analysis, undefined, (line) => logs.push(line))))!;
      const normalized = normalizeMotionIllustrationNeeds(analysis).illustrationNeeds![0];
      const read: PuppetRead = { place: "place", who: normalized.states.map((state) => state.char), states: normalized.states, objects: normalized.objects, object: normalized.objects[0] || null, focus: "actor_0", action: "stand", emotion: "neutral", overlays: [], visual: { scene: "scene", timeline: "present", evidence: [evidence], fixtures: [] } };
      const gen = { pack: ready.pack, styleId: pack.styleId, characters: ready.characters, sets: ready.places, props: ready.props, places: { place: { key: "place", name: probe.place, desc: probe.place, interior: probe.interior, time: "day" } }, reads: { scene: read }, frames: {} } as PuppetGen;
      const result = withPuppetPackSnapshot(ready.pack, () => {
        const style = ready.pack!.assets[pack.styleId] as PuppetStylePack;
        const stage = puppetSetWithFixtureStates(ready.pack!.assets[ready.places.place] as PuppetSet, probe.fixtureStates);
        assert.ok(stage);
        gen.sets = { place: stage.id };
        gen.pack = capturePuppetPack({ styleId: pack.styleId, characters: gen.characters, sets: gen.sets, props: gen.props });
        const choices = createPuppetSceneChoices({ key: "scene", text: evidence, cast: read.who, place: "place", visualUnit: { scene: "scene" } } as any, read, gen, style, undefined, stage);
        assert.ok(choices.length);
        const frame = choices[0].frame;
        return { choices: choices.length, frame, kit: puppetKitSpec(gen, false), fixtureStates: stage.fixtureStates };
      });
      const set: any = ready.pack!.assets[ready.places.place];
      probes.push({ pack: pack.preset, probe: probe.id, status: "choices_generated", choices: result.choices, characters: ready.characters, props: ready.props, set: ready.places.place, pieces: set.plan?.pieces, fixtureStates: result.fixtureStates, frame: result.frame, logs });
      samples.push({ name: `${pack.preset} · ${probe.id}`, kit: result.kit, frame: result.frame });
    } catch (error) {
      probes.push({ pack: pack.preset, probe: probe.id, status: "probe_failed", error: String((error as Error).message), diagnostic: isMotionResourceError(error) ? error.diagnostic : undefined, logs });
    }
    process.stdout.write(JSON.stringify({ pack: pack.preset, probe: probe.id, status: probes.at(-1).status }) + "\n");
  }
const results = source.videos.map((video: any) => ({
  ...video,
  observations: video.observations.map((observation: any) => ({
    ...observation,
    packs: packs.map((pack) => ({ pack: pack.preset, matches: observation.keys.map((key: string) => ({ key, assets: pack.assets.filter((asset: any) => asset.key === key || asset.archetype === key).map((asset: any) => ({ id: asset.id, type: asset.type, key: asset.key || asset.archetype, name: asset.name, issues: puppetPackAssetIssues(asset) })) })) })),
  })),
  probes: probes.filter((probe) => probe.probe === video.probe),
}));
assert.equal(fingerprint(inventory()), before);
const report = {
  release: livePuppetLibrary(),
  scope: source.scope,
  findings: source.findings,
  probeScopeNotes: source.probeScopeNotes,
  exhaustive: false,
  probeCorrections,
  reviewedOverviewFrames: results.reduce((n: number, video: any) => n + video.reviewedOverviewFrames, 0),
  archivedFrames: results.reduce((n: number, video: any) => n + video.archiveFrames, 0),
  libraryHash: before,
  testedInventoryHash: fingerprint(assets),
  libraryUnchanged: true,
  aiCalls: 0,
  videoCreated: false,
  packs: packs.map((pack) => ({ pack: pack.preset, counts: Object.fromEntries(K.TYPES.map((type) => [type, pack.assets.filter((asset) => asset.type === type).length])), invalid: pack.assets.filter((asset) => puppetPackAssetIssues(asset).length).map((asset) => asset.id) })),
  videos: results,
  probes,
};
await fs.writeFile(path.join(directory, "audit.json"), JSON.stringify(report, null, 2));
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1940, height: 1200 } });
  for (let offset = 0; offset < samples.length; offset += 8) {
    await page.setContent(STAGE.HTML);
    for (const file of ENGINE.MOTION_ENGINE) await page.addScriptTag({ content: (await fs.readFile(file, "utf8")).replace(STAGE.HOOK, STAGE.EXPOSE) });
    await page.evaluate(
      async (group) => {
        const me = (window as any).MotionEngine;
        for (const sample of group) {
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
      },
      samples.slice(offset, offset + 8),
    );
    await page.screenshot({ path: path.join(scratch, `geometry-${Math.floor(offset / 8) + 1}.jpg`), fullPage: true });
  }
} finally {
  await browser.close();
}
process.stdout.write(JSON.stringify({ videos: results.length, probes: probes.length, passed: probes.filter((probe) => probe.status === "choices_generated").length, failed: probes.filter((probe) => probe.status !== "choices_generated").length, libraryUnchanged: true }) + "\n");
