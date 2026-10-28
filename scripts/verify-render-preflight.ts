import { stringifyJson } from "../src/lib/jsonStringify.js";
import assert from "node:assert/strict";
import { GenerateType } from "../src/types";
import { validateFFmpegRenderOptions } from "../src/server/utils/ffmpegRender";
const encodedImage = `data:image/png;base64,${Buffer.alloc(256, 1).toString("base64")}`;
const encodedAudio = Buffer.alloc(256, 2).toString("base64");
const valid = validateFFmpegRenderOptions({ scenes: [{ id: "sc_1", duration: 2, imageBase64: encodedImage, assetType: GenerateType.Image }], globalAudioBase64: encodedAudio });
assert.equal(valid.ready, true);
const invalid = validateFFmpegRenderOptions({
  scenes: [
    { id: "sc_bad", duration: 0, imageUrl: "/assets/projects/missing/image.png" },
    { id: "sc_bad", duration: 2, imageUrl: "/assets/projects/missing/image-2.png" },
  ],
});
assert.equal(invalid.ready, false);
assert(invalid.issues.includes("scene_invalid_duration:sc_bad"));
assert(invalid.issues.includes("scene_duplicate_id:sc_bad"));
assert.equal(invalid.issues.filter((issue) => issue.startsWith("scene_asset_missing:")).length, 1);
assert(invalid.issues.includes("narration_missing"));
const nativeAudio = validateFFmpegRenderOptions({ preserveVideoAudio: true, scenes: [{ id: "sc_video", duration: 3, imageBase64: encodedImage, assetType: GenerateType.Video }] });
assert.equal(nativeAudio.ready, true);
const incompleteTimeline = validateFFmpegRenderOptions({ preserveVideoAudio: true, expectedSourceSceneIds: ["sc_video", "sc_missing"], expectedDurationSeconds: 20, scenes: [{ id: "sc_video__shot_1", duration: 3, imageBase64: encodedImage, assetType: GenerateType.Video }] });
assert(incompleteTimeline.issues.includes("required_scene_missing:sc_missing"));
assert(incompleteTimeline.issues.some((issue) => issue.startsWith("render_duration_too_short:")));
process.stdout.write(stringifyJson({ passed: true, invalidIssues: invalid.issues }));
