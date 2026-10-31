import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { MOTION_VISUAL as V } from "../src/constants/motionVisual.js";
import { MOTION_SCENE_COMPOSITION as C } from "../src/constants/motionSceneComposition.js";
import { MOTION_REMOTION_PROMPTS as P } from "../src/constants/motionRemotionPrompts.js";
import { MOTION_ILLUSTRATION_PROFILES } from "../src/constants/motionIllustrationProfiles.js";
import { motionVisualCapability } from "../src/lib/motionVisual.js";
import { buildRemotionScenes } from "../src/features/motion/server/services/remotion/scenePipeline.js";
import { remotionStoryBuildCurrent } from "../src/features/motion/server/services/remotion/sceneKeys.js";
import { compileRemotionStory } from "../src/features/motion/server/services/remotion/storyCompiler.js";
import { validateRemotionSpec } from "../src/lib/motionRemotion.js";
import { puppetBeatLines } from "../src/lib/motionPuppet.js";
import type { MotionRemotionProfile } from "../src/types/motionVisual.js";
const taskRoot = fs.mkdtempSync(path.join(os.tmpdir(), "motion-profiles-"));
const oldStorage = process.env.VIDIFY_STORAGE_DIR;
process.env.VIDIFY_STORAGE_DIR = taskRoot;
const profiles = Object.keys(V.PROFILES) as MotionRemotionProfile[];
const behavior = { version: 1 as const, actors: "fixed" as const, sceneEffects: "off" as const, camera: "fixed" as const };
const globalPrompts = [P.SCENE({})].join("\n");
assert.ok(!/coffin|ghost|oil lamp|funeral/i.test(globalPrompts));
try {
  for (const id of profiles) {
    for (const format of (id === "horror" ? ["illustration"] : id === "history" ? ["illustration", "map", "timeline", "comparison", "process", "cutaway"] : ["illustration", "diagram", "comparison", "process", "cutaway", "map"]) as import("../src/types/motionVisual.js").MotionSceneDesign["format"][]) {
      const settings = { version: 1 as const, mode: "remotion" as const, engine: "remotion" as const, profileId: id, componentRevision: 1 };
      assert.ok(motionVisualCapability(settings).includes(MOTION_ILLUSTRATION_PROFILES[id].planning));
      const diagram = format !== "illustration";
      const vignette = id === "history" && !diagram;
      const nodes: any[] = diagram
        ? [
            { id: "first", kind: "prop", description: "Source container", slot: "left" },
            { id: "second", kind: "prop", description: "Destination container", slot: "right" },
            { id: "label", kind: "label", description: "Before → After", slot: "center" },
          ]
        : [{ id: "reader", kind: "character", entityId: "person", description: "Adult reader in a purple robe", slot: "right" }];
      const text = diagram ? "Compare the source and destination containers: liquid moves from the first to the second." : vignette ? "A white-background history cartoon vignette shows the reader explaining the written order, with a round white head and slim ink limbs." : "The reader waits beside the window in the old dark room.";
      const analysis: any = {
        title: id,
        visualSettings: settings,
        era: id === "history" ? "supplied historical era" : "supplied setting",
        cast: diagram ? [] : [{ key: "person", name: "Reader", look: "Adult in purple robe" }],
        places: [{ key: "place", name: diagram ? "Diagram" : "Hall", description: diagram ? "abstract comparison backdrop" : "room" }],
        chapters: [{ id: "chapter", targetSeconds: 8 }],
      };
      const script: any = { title: id, language: "en", visualSettings: settings, beats: [{ id: "beat", chapterId: "chapter", place: "place", visual: "scene", narration: text, utterances: [{ id: "line", role: "narration", speaker: "narrator", text }] }] };
      const design = {
        format,
        camera: diagram ? "flat comparison plane" : "wide perspective",
        palette: [V.PROFILES[id].paper],
        placements: nodes.filter((node) => node.kind !== "label").map((node, index) => ({ id: node.id, box: { x: 0.1 + index * 0.5, y: 0.2, width: 0.3, height: 0.5 }, depth: index + 1, ...(diagram || vignette ? {} : { supportId: "floor", contact: { x: 0.25, y: 0.7 } }), construction: node.description })),
      };
      const artwork = {
        design,
        svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720"><g id="background"><rect width="1280" height="720" fill="${V.PROFILES[id].paper}"/></g>${nodes
          .filter((node) => node.kind !== "label")
          .map((node) => `<g id="${node.id}"><path d="M200 200Q250 160 300 200L300 500L200 500Z" fill="#605d76"/></g>`)
          .join("")}${diagram ? '<text x="640" y="100">Before → After</text>' : ""}</svg>`,
        layers: [{ id: "background", kind: "background" }, ...nodes.filter((node) => node.kind !== "label").map((node) => ({ id: node.id, kind: node.kind, ...(node.entityId ? { entityId: node.entityId } : {}) }))],
        animations: [],
      };
      const counts: Record<string, number> = {};
      const logs: string[] = [];
      let reviews = 0;
      let invalidSent = false;
      const contexts: any[] = [];
      const ai: any = async (prompt: string, artifact: string, exec: any) => {
        const drawing = artifact === C.ARTIFACT;
        assert.equal(exec.provider, drawing ? "scene-provider" : "content-provider");
        assert.equal(exec.model, drawing ? "scene-model" : "content-model");
        assert.equal(exec.role, drawing ? "draw" : "main");
        assert.equal(exec.strictProvider, true);
        counts[artifact] = (counts[artifact] || 0) + 1;
        assert.ok(prompt.length < 40000, `${id} ${artifact}: ${prompt.length}`);
        if (prompt.startsWith("Repair only rejected fields of ONE")) {
          const repairContext = JSON.parse(prompt.split("Context:\n")[1].split("\n")[0]);
          assert.equal(repairContext.artDirection.id, id);
          assert.equal(repairContext.artDirection.rules, MOTION_ILLUSTRATION_PROFILES[id].drawing);
          assert.ok(!prompt.includes("Craft reference only:"));
          return { groupPatches: [{ id: "background", svg: `<g id="background"><rect width="1280" height="720" fill="${V.PROFILES[id].paper}"/></g>` }] };
        }
        const context = JSON.parse(prompt.split("Context:\n")[1].split("\n")[0]);
        contexts.push(context);
        assert.equal(context.artDirection.id, id);
        assert.equal(context.artDirection.revision, V.PROFILES[id].revision);
        assert.equal(context.artDirection.grammar, artifact === V.ARTIFACT_SCENE ? undefined : MOTION_ILLUSTRATION_PROFILES[id].grammar);
        if (artifact === V.ARTIFACT_SCENE) {
          assert.equal(context.artDirection.rules, MOTION_ILLUSTRATION_PROFILES[id].planning);
          const lines = puppetBeatLines(script.beats[0]);
          return { scenes: [{ fromLineId: lines[0].key, toLineId: lines.at(-1)!.key, purpose: id, environment: diagram ? "plain diagram backdrop" : vignette ? "white explanatory vignette" : "room", nodes }] };
        }
        if (artifact === V.ARTIFACT_REVIEW) {
          assert.equal(context.artDirection.rules, MOTION_ILLUSTRATION_PROFILES[id].review);
          assert.deepEqual(context.design, design);
          reviews++;
          return {
            ok: false,
            issues: [reviews > 1 ? "background: prefer more decorative detail" : "background: wrong explicitly requested background color"],
            checks: reviews > 1 ? [{ ok: false, category: "aesthetic", evidence: "The wall is plain.", problem: "background: prefer more decorative detail" }] : [{ ok: false, category: "story_state", evidence: "The background is red instead of the explicitly requested blue.", problem: "background: wrong explicitly requested background color" }],
          };
        }
        assert.equal(artifact, C.ARTIFACT);
        assert.equal(context.artDirection.rules, MOTION_ILLUSTRATION_PROFILES[id].drawing);
        assert.equal(context.artDirection.anatomy, MOTION_ILLUSTRATION_PROFILES[id].anatomy);
        assert.equal(context.artDirection.motion, MOTION_ILLUSTRATION_PROFILES[id].motion);
        assert.equal(context.drawingReference, undefined);
        assert.equal(context.poseConstruction, undefined);
        assert.equal(context.artDirection.grammar, MOTION_ILLUSTRATION_PROFILES[id].grammar);
        if (!invalidSent) {
          invalidSent = true;
          return { ...artwork, layers: [] };
        }
        return artwork;
      };
      const opts: any = {
        exec: { provider: "scene-provider", model: "scene-model", strictProvider: true },
        mainExec: { provider: "content-provider", model: "content-model", strictProvider: true },
        scope: `profile-${id}-${format}`,
        ai,
        log: (line: string) => logs.push(line),
        renderBehavior: behavior,
        review: true,
        still: async (_spec: unknown, file: string) => {
          fs.writeFileSync(file, "render fixture");
        },
      };
      const built = await buildRemotionScenes(script, analysis, opts);
      assert.ok(remotionStoryBuildCurrent(built, analysis), `${id}/${format}: ${logs.slice(-8).join("; ")}`);
      const scene = built.gen!.remotion!.scenes.beat[0];
      assert.equal(counts[C.ARTIFACT], 2);
      assert.deepEqual(scene.composition!.design, design);
      assert.equal(reviews, 2, `${id} ${format}: ${JSON.stringify(scene.build)} ${logs.slice(-6).join("; ")}`);
      const spec = compileRemotionStory(built, analysis, { durations: [8], fps: 30, renderBehavior: behavior }).spec;
      assert.equal(validateRemotionSpec(spec).profileId, id);
      if (diagram || vignette) {
        assert.equal(scene.nodes.filter((node) => node.kind === "character").length, vignette ? 1 : 0);
        assert.equal(scene.composition!.design!.floor, undefined);
        assert.ok(scene.composition!.design!.placements.every((item) => item.supportId === undefined));
      }
      const previous = JSON.stringify(counts);
      await buildRemotionScenes(built, analysis, opts);
      assert.equal(JSON.stringify(counts), previous);
      const oldRevision = V.PROFILES[id].revision;
      try {
        (V.PROFILES[id] as { revision: number }).revision++;
        assert.equal(remotionStoryBuildCurrent(built, analysis), false);
        const replanned = await buildRemotionScenes(built, analysis, { ...opts, review: false });
        assert.ok(remotionStoryBuildCurrent(replanned, analysis));
        assert.equal(counts[V.ARTIFACT_SCENE], 2);
        assert.equal(counts["motion_remotion_design"], undefined);
      } finally {
        (V.PROFILES[id] as { revision: number }).revision = oldRevision;
      }
    }
  }
  process.stdout.write("Illustration profiles: all 3 styles and narrative/map/timeline/comparison/process/cutaway formats across planning/design/drawing/review/repair, text-only shared outlined construction and isolated horror, abstract diagrams without people/floor, bounded repair prompts, cache resume and profile revision invalidation passed. No live AI/TTS/video.\n");
} finally {
  if (oldStorage === undefined) delete process.env.VIDIFY_STORAGE_DIR;
  else process.env.VIDIFY_STORAGE_DIR = oldStorage;
  assert.equal(path.dirname(path.resolve(taskRoot)), path.resolve(os.tmpdir()));
  assert.ok(path.basename(taskRoot).startsWith("motion-profiles-"));
  fs.rmSync(taskRoot, { recursive: true, force: true });
}
