import { MOTION_VERIFICATION_TEXTS as VT } from "./motionVerificationTexts.js";
import assert from "node:assert/strict";
import fs from "node:fs";
import { build } from "esbuild";
import { chromium } from "playwright";
import { MOTION_REFERENCE_TEXTS } from "../src/constants/motionReference.ts";
const bundle = await build({ stdin: { contents: VT.IMPORT_REACT_USESTATE_FROM_REACT_IMPORT_CREATEROOT_FROM_REAC, loader: VT.TSX, resolveDir: process.cwd() }, bundle: true, platform: VT.BROWSER, format: VT.IIFE, write: false });
const browser = await chromium.launch({ channel: VT.CHROME, headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
  await page.setContent(VT.HTML_LANG_VI_BODY_STYLE_BACKGROUND_0F172A_COLOR_WHITE_DIV_ID);
  const css = fs.readdirSync(VT.DIST_ASSETS).find((file) => /^index-.*\.css$/.test(file));
  if (css) await page.addStyleTag({ content: fs.readFileSync(`${VT.DIST_ASSETS_2}${css}`, VT.UTF8) });
  await page.addScriptTag({ content: bundle.outputFiles[0].text });
  fs.mkdirSync(VT.SCRATCH, { recursive: true });
  await page.screenshot({ path: VT.SCRATCH_MOTION_REFERENCE_CONTROLS_EMPTY_PNG });
  const image = Buffer.from(
    await page.evaluate(
      ({ texts: VT }) => {
        const canvas = document.createElement(VT.CANVAS);
        canvas.width = 1600;
        canvas.height = 900;
        const ctx = canvas.getContext(VT.VALUE_2D)!;
        ctx.fillStyle = VT.VALUE_664455;
        ctx.fillRect(0, 0, 1600, 900);
        return canvas.toDataURL(VT.IMAGE_PNG).split(VT.EMPTY_5)[1];
      },
      { payload: undefined, texts: VT },
    ),
    VT.BASE64,
  );
  const payload = (name: string) => ({ name, mimeType: VT.IMAGE_PNG, buffer: image });
  const input = page.locator(VT.INPUT_TYPE_FILE);
  await input.setInputFiles([payload(VT.A_PNG), payload(VT.B_PNG), payload(VT.C_PNG), payload(VT.D_PNG)]);
  await page.waitForFunction(() => (window as any).motionInputFixture.images.length === 4);
  assert.equal(await page.getByRole(VT.BUTTON, { name: MOTION_REFERENCE_TEXTS.vi.add, exact: false }).isDisabled(), true);
  await page.getByRole(VT.BUTTON, { name: MOTION_REFERENCE_TEXTS.vi.remove, exact: true }).first().click();
  await page.waitForFunction(() => (window as any).motionInputFixture.images.length === 3);
  await input.setInputFiles([payload(VT.E_PNG), payload(VT.F_PNG)]);
  assert.equal(await page.evaluate(() => (window as any).motionInputFixture.images.length), 3);
  assert.ok(await page.evaluate(({ texts: VT }) => (window as any).motionInputFixture.images.every((image) => image.dataUrl.startsWith(VT.DATA_IMAGE_JPEG_BASE64)), { payload: undefined, texts: VT }));
  const toggle = page.getByRole(VT.SWITCH, { name: MOTION_REFERENCE_TEXTS.vi.motion });
  await toggle.click();
  assert.equal(await toggle.getAttribute(VT.ARIA_CHECKED), VT.TRUE);
  await toggle.click();
  assert.equal(await toggle.getAttribute(VT.ARIA_CHECKED), VT.FALSE);
  fs.mkdirSync(VT.SCRATCH, { recursive: true });
  await page.screenshot({ path: VT.SCRATCH_MOTION_REFERENCE_CONTROLS_PNG });
  process.stdout.write(VT.REFERENCE_UI_PASSED_FOUR_UPLOADS_IMAGE_ENCODING_OVERFLOW_REJ);
} finally {
  await browser.close();
}
