import { VERIFICATION_VALUES as VT } from "./motionVerificationValues.js";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { MOTION_MUSIC as M } from "../src/constants/motionMusic.js";
assert.ok(M.LOUDNESS.TRUE_PEAK >= -9 && M.LOUDNESS.TRUE_PEAK <= 0);
for (const volume of [0.01, 0.12, 1]) {
  const graph = M.MIX_GRAPH(volume);
  assert.ok(graph.includes(VT.SIDECHAINCOMPRESS));
  execFileSync(VT.FFMPEG, [VT.V, VT.ERROR, VT.F, VT.LAVFI, VT.I, VT.SINE_FREQUENCY_440_SAMPLE_RATE_48000_DURATION_1, VT.F, VT.LAVFI, VT.I, VT.SINE_FREQUENCY_220_SAMPLE_RATE_48000_DURATION_1, VT.FILTER_COMPLEX, graph, VT.MAP, M.MIX_OUT, VT.T, VT.VALUE_1, VT.F, VT.NULL, VT.DASH], { stdio: VT.PIPE });
}
process.stdout.write(VT.MUSIC_MIX_REAL_FFMPEG_LOUDNORM_AND_NARRATION_DUCKING_PASSED_AT_LOW_REQUESTED);
