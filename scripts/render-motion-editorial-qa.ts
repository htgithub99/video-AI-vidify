import fs from "node:fs";
import path from "node:path";
import { getMotionJob, openStillSession, startMotionRender } from "../src/server/services/motionRenderService.ts";
import { MotionAspect, MotionEncoderPreference, MotionJobStatus, MotionQuality } from "../src/types/motionVideo.ts";
const spec = JSON.parse(fs.readFileSync("motion-engine/demo/editorial-qa.json", "utf8"));
const output = path.resolve(process.argv.slice(2).find((x) => x !== "--video") || "scratch/visual-acceptance/after");
const session = await openStillSession();
try {
  const result = await session.render( spec, [ { id: "wide", t: 1 }, { id: "medium", t: 4 }, { id: "close", t: 7 }, ], output, { width: 1280, height: 720, quality: "high" }, );
  const issues = result.flatMap((frame) => frame.issues);
  if (issues.length) throw new Error(JSON.stringify(issues));
  console.log(result);
} finally {
  await session.close();
}
if (process.argv.includes("--video")) {
  const job = startMotionRender(spec, { quality: MotionQuality.STANDARD, aspect: MotionAspect.LANDSCAPE, fps: 24, encoder: MotionEncoderPreference.CPU, title: "Editorial wardrobe visual QA" });
  let lastStage = "";
  for (;;) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const state = getMotionJob(job.id)!;
    if (state.stage !== lastStage) { console.log(state.stage); lastStage = state.stage || ""; }
    if (state.status === MotionJobStatus.COMPLETED) { fs.writeFileSync(path.join(output, "video-result.json"), JSON.stringify(state.result, null, 2)); console.log(state.result); break; }
    if ([MotionJobStatus.ERROR, MotionJobStatus.CANCELLED].includes(state.status)) throw new Error(state.error || state.status);
  }
}
