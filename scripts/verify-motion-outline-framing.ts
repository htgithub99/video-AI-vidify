import { MOTION_STYLE_VERIFICATION_TEXTS as ST } from "./motionStyleVerificationTexts.ts";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { chromium } from "playwright";
import { openStillSession } from "../src/features/motion/server/services/motionRenderService.ts";
import { MOTION_VIDEO_CONSTANTS } from "../src/constants/motionVideo.ts";
import { beatPreviewSpec } from "../src/server/services/motionGenService.ts";
const data = JSON.parse(fs.readFileSync(ST.SCRIPTS_FIXTURES_MOTION_STYLE_KITS_MASK_PROJECT_JSON, ST.UTF8));
const gen: any = { ...data, previews: {}, locationInfo: {}, characterMotion: true };
const out = fs.mkdtempSync(path.join(os.tmpdir(), ST.MOTION_OUTLINE));
const frames: Record<string, { file: string; issues: string[] }> = {};
const session = await openStillSession();
try {
  for (const id of Object.keys(data.staging)) {
    const beat: any = { id, chapterId: ST.C1, visual: ST.SCENE, place: data.staging[id].location, narration: ST.MOT_HAI_BA_BON_NAM_SAU_BAY_TAM_CHIN_MUOI_MOT_HAI_BA_BON_NAM_SAU_BAY_TAM_CH, cast: data.staging[id].actors.map((a: any) => a.cast) };
    const { spec, picks } = beatPreviewSpec(beat, gen, ST.VI, ST.VALUE_16_9, 0);
    const [frame] = await session.render(spec, picks.slice(1, 2), out, { width: 480, height: 270, quality: ST.DRAFT, label: false });
    frames[id] = frame;
  }
} finally {
  await session.close();
}
const launch = async () => {
  for (const channel of MOTION_VIDEO_CONSTANTS.BROWSER_CHANNELS) {
    try {
      return await chromium.launch({ channel, headless: true });
    } catch {}
  }
  return chromium.launch({ headless: true });
};
const browser = await launch();
const page = await browser.newPage();
const share = async (file: string, box: number[], colour: number[], tolerance: number): Promise<number> =>
  page.evaluate(
    async ({ src, box, colour, tolerance, texts: ST }) => {
      const img = new Image();
      img.src = src;
      await img.decode();
      const canvas = document.createElement(ST.CANVAS);
      canvas.width = img.width;
      canvas.height = img.height;
      const g = canvas.getContext(ST.VALUE_2D)!;
      g.drawImage(img, 0, 0);
      const [x0, y0, x1, y1] = [box[0] * img.width, box[1] * img.height, box[2] * img.width, box[3] * img.height].map(Math.round);
      const px = g.getImageData(x0, y0, x1 - x0, y1 - y0).data;
      let hit = 0;
      for (let i = 0; i < px.length; i += 4) if (Math.abs(px[i] - colour[0]) + Math.abs(px[i + 1] - colour[1]) + Math.abs(px[i + 2] - colour[2]) <= tolerance) hit++;
      return hit / (px.length / 4);
    },
    { src: ST.DATA_IMAGE_JPEG_BASE64 + fs.readFileSync(file).toString(ST.BASE64), box, colour, tolerance, texts: { CANVAS: ST.CANVAS, VALUE_2D: ST.VALUE_2D } },
  );
const GREY = [0x5a, 0x60, 0x68],
  BROWN = [0x6b, 0x5a, 0x3a],
  WHITE = [0xee, 0xf3, 0xf6];
try {
  assert.ok((await share(frames.c1_b4.file, [0.45, 0.75, 0.55, 0.9], GREY, 60)) > 0.5, ST.C1_B4_THE_GREY_BODY_SHOWS_ITS_KIT_COLOUR_NOT_A_BLACK_OUTLINE_SHELL);
  assert.ok((await share(frames.c1_b4.file, [0.3, 0, 0.7, 0.04], WHITE, 40)) < 0.02, ST.C1_B4_THE_TOP_OF_THE_HEAD_IS_NOT_CUT_BY_THE_FRAME);
  assert.ok((await share(frames.c1_b4.file, [0.3, 0.2, 0.7, 0.6], WHITE, 40)) > 0.25, ST.C1_B4_THE_HEAD_SITS_IN_THE_UPPER_PART_OF_THE_FRAME);
  assert.ok(!frames.c1_b3.issues.some((issue) => ST.PATTERN_LEFT_OUT_I.test(issue)), ST.C1_B3_THE_SECOND_PERSON_OF_THE_TWO_SHOT_STAYS_IN_THE_SHOT);
  assert.ok((await share(frames.c1_b3.file, [0, 0.2, 0.5, 0.7], WHITE, 40)) > 0.1 && (await share(frames.c1_b3.file, [0.5, 0.2, 1, 0.7], WHITE, 40)) > 0.1, ST.C1_B3_BOTH_HEADS_ARE_IN_FRAME);
  assert.ok((await share(frames.c1_b3.file, [0.25, 0.75, 0.5, 0.85], BROWN, 60)) > 0.25, ST.C1_B3_THE_BROWN_BODY_KEEPS_ITS_COLOUR);
  assert.ok((await share(frames.c1_b3.file, [0.3, 0, 0.8, 0.03], WHITE, 40)) < 0.02, ST.C1_B3_NO_HEAD_IS_CUT_AT_THE_TOP);
} finally {
  await browser.close();
}
process.stdout.write(ST.OUTLINE_AND_FRAMING_PASSED_NO_BLACK_OUTLINE_SHELLS_ON_ROUND_BODIES_BIG_HEA + out + ST.EMPTY_2 + ST.EMPTY);
