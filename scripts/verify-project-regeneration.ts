import { resolveSourceTextConstants } from "./sourceTextAssertions";
import assert from "node:assert/strict";
import { clearAllProjectVisualOutputs, clearProjectSceneOutput } from "../src/services/projectRegenerationService.ts";
import { GenerateType, SceneAssetStatus, VideoProject } from "../src/types.ts";

const project = {
  id: "project_test",
  storyboard: [
    {
      id: "sc_1",
      assetType: GenerateType.Image,
      assetUrl: "/images/sc_1.jpg",
      assetUrls: ["/images/sc_1.jpg"],
      assetStatus: SceneAssetStatus.Approved,
      generationPrompt: "Old image prompt --ar 16:9",
      assetRevisions: [{ id: "revision_1", assetUrl: "/images/sc_1.jpg" }],
    },
    {
      id: "sc_2",
      assetType: GenerateType.Video,
      assetUrl: "/videos/sc_2.mp4",
      assetUrls: ["/videos/sc_2.mp4"],
      assetStatus: SceneAssetStatus.Approved,
      generationPrompt: "Old video prompt --ar 16:9",
      sourceTrimStartSeconds: 0.75,
      sourceTrimEndSeconds: 1.25,
      sourceCrop: "800:450:0:0",
      cinematicAudioBridgeMode: "j_cut",
      cinematicSupportShotType: "reaction",
    },
  ],
  thumbnails: [{ id: "th_1", prompt: "Old thumbnail", imageUrl: "/images/th_1.jpg" }],
  renderedVideoUrl: "/videos/final.mp4",
  imagePromptQa: { passed: true },
  finalQc: { publishable: true },
  finalMultimodalQa: { passed: true },
  manualReviewItems: [{ id: "review_1" }],
  visualConfig: {
    characters: [{ id: "char_1", images: ["/references/user/character.png"] }],
    characterImages: ["/references/character/ref.png"],
    characterExtracted: true,
  },
} as unknown as VideoProject;

const resetProject = clearAllProjectVisualOutputs(project);
assert.equal(resetProject.renderedVideoUrl, undefined);
assert.equal(resetProject.imagePromptQa, undefined);
assert.deepEqual(resetProject.thumbnails, []);
assert.deepEqual(resetProject.manualReviewItems, []);
assert.equal(resetProject.finalQc, undefined);
assert.equal(resetProject.finalMultimodalQa, undefined);
assert.deepEqual(resetProject.visualConfig.characters?.[0].images, []);
assert.deepEqual(resetProject.visualConfig.characterImages, []);
assert.equal(resetProject.visualConfig.characterExtracted, false);
for (const scene of resetProject.storyboard || []) {
  assert.equal(scene.assetUrl, undefined);
  assert.deepEqual(scene.assetUrls, []);
  assert.equal(scene.assetType, undefined);
  assert.equal(scene.assetStatus, undefined);
  assert.equal(scene.generationPrompt, undefined);
  assert.deepEqual(scene.assetRevisions, []);
}

const selectedSceneReset = clearProjectSceneOutput(project, "sc_2");
assert.equal(selectedSceneReset.storyboard?.[0].assetUrl, "/images/sc_1.jpg");
assert.equal(selectedSceneReset.storyboard?.[0].generationPrompt, "Old image prompt --ar 16:9");
assert.equal(selectedSceneReset.storyboard?.[1].assetUrl, undefined);
assert.deepEqual(selectedSceneReset.storyboard?.[1].assetUrls, []);
assert.equal(selectedSceneReset.storyboard?.[1].generationPrompt, "Old video prompt --ar 16:9");
assert.equal(selectedSceneReset.storyboard?.[1].sourceTrimStartSeconds, undefined);
assert.equal(selectedSceneReset.storyboard?.[1].sourceTrimEndSeconds, undefined);
assert.equal(selectedSceneReset.storyboard?.[1].sourceCrop, undefined);
assert.equal(selectedSceneReset.storyboard?.[1].cinematicAudioBridgeMode, undefined);
assert.equal(selectedSceneReset.storyboard?.[1].cinematicSupportShotType, undefined);
assert.equal(selectedSceneReset.renderedVideoUrl, undefined);
assert.deepEqual(selectedSceneReset.thumbnails, project.thumbnails);
assert.deepEqual(selectedSceneReset.visualConfig.characters, project.visualConfig.characters);

const projectControllerSource = await import("node:fs").then(({ readFileSync }) => (
  resolveSourceTextConstants(readFileSync("src/server/controllers/projectController.ts", "utf8"))
));
const autoVideoPipelineSource = await import("node:fs").then(({ readFileSync }) => (
  resolveSourceTextConstants(readFileSync("src/hooks/useAutoVideoPipeline.ts", "utf8"))
));
assert.match(projectControllerSource, /Boolean\(newProject\.allowBulkDeleteImages\)/);
assert.match(projectControllerSource, /Boolean\(newProject\.allowAudioCleanup\)/);
assert.match(projectControllerSource, /Boolean\(newProject\.allowReferenceCleanup\)/);
assert.match(
  autoVideoPipelineSource,
  /allowBulkDeleteImages:\s*true,[\s\S]*?isRecreatingStoryboard:\s*true,[\s\S]*?allowAudioCleanup:\s*true,[\s\S]*?allowReferenceCleanup:\s*true,[\s\S]*?resetDerivedData:\s*true/,
  "a new automatic-video run must authorize removal of stale generated references",
);
assert.match(
  autoVideoPipelineSource,
  /if \(!isContinuation\) appendLog\(AUTO_GENERATOR_CONSTANTS\.LOG_REFERENCE_CLEANUP_SUCCESS\)/,
  "reference cleanup must be limited to a new run and reported to the user",
);

process.stdout.write("Project visual regeneration assertions passed.\n");
