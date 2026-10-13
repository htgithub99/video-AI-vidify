import { MOTION_VERIFICATION_TEXTS as VT } from "./motionVerificationTexts.js";
import fs from "node:fs";
import path from "node:path";
import { getMotionJob, openStillSession, startMotionRender } from "../src/server/services/motionRenderService.ts";
import { MotionAspect, MotionEncoderPreference, MotionJobStatus, MotionQuality } from "../src/types/motionVideo.ts";
import { hasMotionRenderFailure } from "../src/lib/motionReference.ts";
const spec = JSON.parse(fs.readFileSync(VT.MOTION_ENGINE_DEMO_EDITORIAL_QA_JSON, VT.UTF8));
const output = path.resolve(process.argv.slice(2).find((x) => x !== VT.VIDEO) || VT.SCRATCH_VISUAL_ACCEPTANCE_AFTER);
const session = await openStillSession();
try {
  const result = await session.render(
    spec,
    [
      { id: VT.WIDE, t: 1 },
      { id: VT.MEDIUM, t: 4 },
      { id: VT.CLOSE, t: 7 },
    ],
    output,
    { width: 1280, height: 720, quality: VT.HIGH },
  );
  const issues = result.flatMap((frame) => frame.issues);
  if (hasMotionRenderFailure(issues)) throw new Error(JSON.stringify(issues));
  process.stdout.write(JSON.stringify(result) + VT.EMPTY);
} finally {
  await session.close();
}
if (process.argv.includes(VT.VIDEO)) {
  const job = startMotionRender(spec, { quality: MotionQuality.STANDARD, aspect: MotionAspect.LANDSCAPE, fps: 24, encoder: MotionEncoderPreference.CPU, title: VT.AUTHORED_CHARACTER_VISUAL_QA });
  let lastStage = VT.EMPTY_2;
  for (;;) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const state = getMotionJob(job.id)!;
    if (state.stage !== lastStage) {
      process.stdout.write(state.stage + VT.EMPTY);
      lastStage = state.stage || VT.EMPTY_2;
    }
    if (state.status === MotionJobStatus.COMPLETED) {
      fs.writeFileSync(path.join(output, VT.VIDEO_RESULT_JSON), JSON.stringify(state.result, null, 2));
      process.stdout.write(JSON.stringify(state.result) + VT.EMPTY);
      break;
    }
    if ([MotionJobStatus.ERROR, MotionJobStatus.CANCELLED].includes(state.status)) throw new Error(state.error || state.status);
  }
}
