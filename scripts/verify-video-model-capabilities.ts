import assert from "node:assert/strict";
import { AspectRatio, ImageGeneratorEngine } from "../src/types";
import { getVideoModelCapabilities, normalizeVideoModelSettings } from "../src/services/videoModelCapabilityService";

const omni = getVideoModelCapabilities(ImageGeneratorEngine.Veo3);
assert.deepEqual(omni.durations, ["4s", "6s", "8s", "10s"]);
assert.deepEqual(omni.resolutions, ["360p", "720p"]);
assert.equal(omni.defaultDuration, "10s");
assert.equal(omni.defaultResolution, "360p");

const fast = normalizeVideoModelSettings(ImageGeneratorEngine.Veo3Fast, {
  duration: "10s",
  resolution: "360p",
  aspectRatio: AspectRatio.NineSixteen,
});
assert.deepEqual(fast, {
  duration: "8s",
  resolution: "720p",
  aspectRatio: AspectRatio.NineSixteen,
  supportsReferences: true,
});

const fastWithReferences = normalizeVideoModelSettings(
  ImageGeneratorEngine.Veo3Fast,
  {
    duration: "4s",
    resolution: "720p",
    aspectRatio: AspectRatio.SixteenNine,
  },
  true,
);
assert.equal(fastWithReferences.duration, "8s");

const qualityWithReferences = normalizeVideoModelSettings(
  ImageGeneratorEngine.Veo3Quality,
  {
    duration: "8s",
    resolution: "720p",
    aspectRatio: AspectRatio.SixteenNine,
  },
  true,
);
assert.equal(qualityWithReferences.supportsReferences, false);

process.stdout.write("Video model capability assertions passed.\n");
