import { MOTION_VERIFICATION_TEXTS as VT, MOTION_VERIFICATION_FORMATS as VF } from "./motionVerificationTexts.js";
import assert from "node:assert/strict";
import fs from "node:fs";
import { chromium } from "playwright";
import { buildMotionRenderHtml } from "../src/features/motion/server/services/motionEngineService.ts";
import { motionProceduralPose } from "../src/lib/motionPoses.ts";
const box = (pos: number[], size: number[]) => ({ shape: VT.BOX, pos, size, mat: { color: VT.C08060 } });
const design: any = {
  parts: [
    { id: VT.BODY, pos: [0, 0, 0], nodes: [box([0, 0.95, 0], [0.4, 0.8, 0.25])] },
    { id: VT.LEG_R, parent: VT.BODY, pos: [0.1, 0.55, 0], nodes: [box([0, -0.275, 0], [0.12, 0.55, 0.12])] },
    { id: VT.LEG_L, parent: VT.BODY, pos: [-0.1, 0.55, 0], nodes: [box([0, -0.275, 0], [0.12, 0.55, 0.12])] },
  ],
  poses: { idle: {} },
};
design.poses.walk = motionProceduralPose(design, VT.WALK);
design.poses.sit = motionProceduralPose(design, VT.SIT);
const spec = JSON.parse(fs.readFileSync(VT.MOTION_ENGINE_DEMO_EDITORIAL_QA_JSON, VT.UTF8));
const browser = await chromium.launch({ channel: VT.CHROME, headless: true });
try {
  const page = await browser.newPage();
  await page.setContent(buildMotionRenderHtml(spec));
  await page.evaluate(VT.WINDOW_NAME_FN_FN);
  const angles = await page.evaluate(
    async ({ spec, design, texts: VT }) => {
      const G = (window as any).MotionEngine.GEN;
      await G.prepare(spec);
      const actor = G.createActor(design);
      actor.sample(VT.WALK, 0, true);
      const from = actor.snapshot();
      const walk = actor.parts.leg_r.rotation.x;
      actor.sample(VT.SIT, 0, true);
      const sit = actor.parts.leg_r.rotation.x;
      actor.blendFrom(from, 0.5);
      return { walk, sit, mid: actor.parts.leg_r.rotation.x, has: (window as any).MotionEngineText.POSE_BLEND };
    },
    { spec, design, texts: { WALK: VT.WALK, SIT: VT.SIT } },
  );
  assert.ok(angles.mid < angles.walk && angles.mid > angles.sit, VF.POSE_BLEND_MESSAGE(JSON.stringify(angles)));
  assert.equal(angles.has, 0.35);
} finally {
  await browser.close();
}
process.stdout.write(VT.POSE_BLEND_PASSED_A_CHANGE_OF_ACTION_EASES_FROM_THE_PREVIOUS_POSE_INSTEA + VT.EMPTY);
