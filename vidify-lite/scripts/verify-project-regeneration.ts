import assert from "node:assert/strict";
import { clearAllProjectVisualOutputs } from "../src/services/projectRegenerationService.ts";
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
    },
  ],
  thumbnails: [{ id: "th_1", prompt: "Old thumbnail", imageUrl: "/images/th_1.jpg" }],
  renderedVideoUrl: "/videos/final.mp4",
  imagePromptQa: { passed: true },
  finalQc: { publishable: true },
  finalMultimodalQa: { passed: true },
  manualReviewItems: [{ id: "review_1" }],
} as unknown as VideoProject;

const resetProject = clearAllProjectVisualOutputs(project);
assert.equal(resetProject.renderedVideoUrl, undefined);
assert.equal(resetProject.imagePromptQa, undefined);
assert.deepEqual(resetProject.thumbnails, []);
assert.deepEqual(resetProject.manualReviewItems, []);
assert.equal(resetProject.finalQc, undefined);
assert.equal(resetProject.finalMultimodalQa, undefined);
for (const scene of resetProject.storyboard || []) {
  assert.equal(scene.assetUrl, undefined);
  assert.deepEqual(scene.assetUrls, []);
  assert.equal(scene.assetType, undefined);
  assert.equal(scene.assetStatus, undefined);
  assert.equal(scene.generationPrompt, undefined);
  assert.deepEqual(scene.assetRevisions, []);
}

process.stdout.write("Project visual regeneration assertions passed.\n");
