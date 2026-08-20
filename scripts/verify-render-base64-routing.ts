import assert from "node:assert/strict";
import { resolveEncodedMediaSource } from "../src/server/utils/ffmpegRender.ts";

const imageDataUrl = `data:image/jpeg;base64,${"A".repeat(256)}`;
const rawAudioBase64 = "A".repeat(256);

assert.equal(resolveEncodedMediaSource(undefined, imageDataUrl), imageDataUrl);
assert.equal(resolveEncodedMediaSource(rawAudioBase64, undefined), rawAudioBase64);
assert.equal(resolveEncodedMediaSource("/assets/projects/example/images/sc_1.jpg"), undefined);

process.stdout.write("Render Base64 routing assertions passed.\n");
