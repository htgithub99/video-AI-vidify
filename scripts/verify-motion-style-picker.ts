import assert from "node:assert/strict";
import { build } from "esbuild";
import { chromium } from "playwright";
import { MOTION_DRAFT_VERIFICATION as C, MOTION_STYLE_PICKER_VERIFICATION as T } from "./motionDraftVerificationTexts.ts";
import { MOTION_SCENE_LIBRARY as L, MOTION_SCENE_LIBRARY_TEXT } from "../src/constants/motionSceneLibrary.ts";
import { API_ROUTES } from "../src/constants/apiRoutes.ts";
import { MOTION_VOICE_LIBRARY } from "../src/constants/motionVoice.ts";
import { MOTION_STYLE_PRESET_NONE } from "../src/constants/motionStylePresets.ts";
const bundle = await build({
  stdin: { contents: T.ENTRY, loader: C.TSX, resolveDir: process.cwd() },
  bundle: true,
  platform: C.BROWSER,
  format: C.IIFE,
  write: false,
  plugins: [
    {
      name: T.FIXTURE,
      setup(builder) {
        builder.onLoad({ filter: C.PATTERNS.API_MODULE }, () => ({ contents: T.API_STUB }));
        builder.onLoad({ filter: C.PATTERNS.STORAGE_MODULE }, () => ({ contents: C.STORAGE_STUB }));
        builder.onLoad({ filter: C.PATTERNS.ACTIVITY_MODULE }, () => ({ contents: C.ACTIVITY_STUB }));
        builder.onResolve({ filter: C.PATTERNS.TOAST_MODULE }, () => ({ path: C.TOAST_MODULE, namespace: T.FIXTURE }));
        builder.onLoad({ filter: C.PATTERNS.ANY, namespace: T.FIXTURE }, () => ({ contents: T.TOAST_STUB }));
      },
    },
  ],
});
const browser = await chromium.launch({ channel: C.CHROME, headless: true });
try {
  const page = await browser.newPage();
  const errors: string[] = [];
  page.on(C.PAGE_ERROR, (error) => errors.push(error.message));
  await page.setContent(C.HTML);
  await page.evaluate(
    ({ listUrl, styleUrl, resultsUrl, channelsUrl, texts: T }) => {
      const fixture: any = { saved: { stylePreset: T.INITIAL_PRESET }, failure: T.EMPTY, references: T.REFERENCES };
      fixture.request = async (url: string) => {
        if (url === listUrl) return { items: [], styles: T.STYLES };
        if (url.startsWith(styleUrl)) {
          await new Promise<void>((resolve) => {
            fixture.finish = () => {
              fixture.finish = null;
              resolve();
            };
          });
          if (fixture.failure === T.REQUEST_FAILURE) throw new Error(T.DOWNLOAD_ERROR);
          return { references: fixture.failure === T.EMPTY_FAILURE ? [] : fixture.references };
        }
        if (url === resultsUrl) return { items: [] };
        if (url === channelsUrl) return { channels: [] };
        throw new Error(url);
      };
      (window as any).motionDraftFixture = fixture;
      (window as any).motionStyleToasts = [];
    },
    { listUrl: L.URLS.LIST, styleUrl: L.URLS.STYLE, resultsUrl: API_ROUTES.MOTION_VIDEO_RESULTS, channelsUrl: MOTION_VOICE_LIBRARY.CHANNELS_URL, texts: T },
  );
  await page.addScriptTag({ content: bundle.outputFiles[0].text });
  const picker = page.getByRole(T.COMBOBOX, { name: MOTION_SCENE_LIBRARY_TEXT.vi.STYLE_SET_LABEL });
  const [style2d, style3d] = T.STYLES;
  const state = () => page.evaluate(() => (window as any).motionStyleStudio.state);
  const setFailure = (failure: string) => page.evaluate((value) => ((window as any).motionDraftFixture.failure = value), failure);
  const waitForSelection = (key: string) => page.waitForFunction(({ selector, key }) => (document.querySelector(selector) as HTMLSelectElement)?.value === key, { selector: T.SELECT, key });
  const remount = async (key: string) => {
    await page.waitForFunction((key) => (window as any).motionDraftFixture.saved.styleSetKey === key, key);
    await page.evaluate(() => (window as any).remountMotionStyleStudio());
    await page.waitForFunction((key) => (window as any).motionStyleStudio.state.styleSetKey === key, key);
    await waitForSelection(key);
  };
  const select = async (key: string) => {
    await picker.selectOption(key);
    assert.equal(await picker.isDisabled(), true);
    assert.equal(await picker.inputValue(), key);
    await page.waitForFunction(() => !!(window as any).motionDraftFixture.finish);
    await page.evaluate(() => (window as any).motionDraftFixture.finish());
    await page.waitForFunction((selector) => !(document.querySelector(selector) as HTMLSelectElement)?.disabled, T.SELECT);
  };
  await picker.waitFor();
  await select(style2d.key);
  assert.equal(await picker.inputValue(), style2d.key, T.RETAIN_SELECTION);
  const applied = await state();
  assert.equal(applied.drawingMode, style2d.drawingMode);
  assert.equal(applied.stylePreset, MOTION_STYLE_PRESET_NONE);
  assert.equal(applied.styleReferences.length, T.REFERENCES.length);
  assert.equal(applied.styleReferences[0].dataUrl, T.REFERENCES[0].dataUrl);
  await remount(style2d.key);
  assert.equal((await state()).styleReferences.length, T.REFERENCES.length);
  await picker.selectOption(T.EMPTY);
  await page.waitForFunction((key) => (window as any).motionStyleStudio.state.styleSetKey === key, T.EMPTY);
  assert.equal(await picker.inputValue(), T.EMPTY, T.CLEAR_SELECTION);
  assert.deepEqual((await state()).styleReferences, []);
  assert.equal((await state()).drawingMode, style2d.drawingMode);
  await remount(T.EMPTY);
  assert.equal(await picker.inputValue(), T.EMPTY);
  assert.deepEqual((await state()).styleReferences, []);
  await select(style2d.key);
  for (const failure of [T.REQUEST_FAILURE, T.EMPTY_FAILURE]) {
    await setFailure(failure);
    await select(style3d.key);
    assert.equal(await picker.inputValue(), style2d.key, T.RETAIN_FAILED_SELECTION);
    assert.deepEqual((await state()).styleReferences, applied.styleReferences);
  }
  const toasts = await page.evaluate(() => (window as any).motionStyleToasts);
  assert.equal(toasts.filter((toast: any) => toast.kind === T.SUCCESS).length, 2);
  assert.equal(toasts.filter((toast: any) => toast.kind === T.ERROR).length, 2);
  await setFailure(T.EMPTY);
  await select(style3d.key);
  assert.equal((await state()).drawingMode, style3d.drawingMode);
  await page.evaluate(() => (window as any).motionStyleStudio.patch({ styleReferences: [] }));
  await waitForSelection(T.EMPTY);
  await select(style2d.key);
  await page.evaluate((drawingMode) => (window as any).motionStyleStudio.patch({ drawingMode }), style3d.drawingMode);
  await waitForSelection(T.EMPTY);
  assert.deepEqual(errors, []);
  process.stdout.write(T.PASSED);
} finally {
  await browser.close();
}
