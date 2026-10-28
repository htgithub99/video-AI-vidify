import { writeVerificationLog } from "./verificationLogger";
import {
  SOURCE_TEXT_SRC_SERVER_SERVICES_CHATUIPLANNINGSERVICE_TS,
  SOURCE_TEXT_UTF8,
  SOURCE_TEXT_CONST_SETLOCALFILEPATHSVIACDP,
  SOURCE_TEXT_CONST_GETCOMPOSERREADINGS,
  SOURCE_TEXT_GLOBALTHIS_ATTACH_ATTACHROOMFILES,
  SOURCE_TEXT_VIDIFY_MIXER_UPLOAD,
  SOURCE_TEXT_CHROME,
  SOURCE_TEMPLATE_TRACK_WAV,
  SOURCE_TEXT_RIFF_TEST_AUDIO,
  SOURCE_TEXT_AUDIO_WAV,
  SOURCE_TEXT_DOCUMENT_GETELEMENTBYID_UPLOAD_HIDDEN_FALSE,
  SOURCE_TEXT_DOCUMENT_GETELEMENTBYID_AUDIO_CLICK,
  SOURCE_TEXT_BUTTON_ID_UPLOAD_ROLE_MENUITEM_HIDDEN_ARIA,
  SOURCE_TEMPLATE_INPUT_ID_AUDIO_TYPE_FILE_MULTIPLE,
  SOURCE_TEXT_CONTEXT,
  SOURCE_TEXT_CDP_UNAVAILABLE,
  SOURCE_TEXT_LOCATOR,
  SOURCE_TEXT_INPUT_TYPE_FILE_2,
  SOURCE_TEXT_INPUT_TYPE_FILE,
  SOURCE_TEXT_MUSIC_MIXER_RANKING,
  SOURCE_TEXT_MIXER_USES_INPUT_FALLBACK_WHEN_CDP_IS,
  SOURCE_TEXT_MIXER_USES_THE_ACTUAL_FILE_CHOOSER_EVEN,
  SOURCE_TEXT_MIXER_HANDLES_GEMINI_S_ATTACH_MENU_BEFORE,
  SOURCE_TEXT_BUTTON_ARIA_LABEL_ATTACH_FILES_ONCLICK_CONST,
  SOURCE_TEXT_MIXER_RETRIES_INPUTS_THAT_APPEAR_ONLY_AFTER,
  SOURCE_TEXT_MUSIC_TRACK_EVALUATION,
  SOURCE_TEXT_SHORTS_HIGHLIGHTS,
  SOURCE_TEXT_OTHER_SCREENS_MUST_NOT_OPT_INTO_LOCAL,
  SOURCE_TEXT_EXISTING_CDP_UPLOADS_REMAIN_FUNCTIONAL_FOR_OTHER,
  SOURCE_TEXT_BUFFER_WAV,
  SOURCE_TEXT_RIFF_TEST,
  SOURCE_TEXT_EXISTING_BUFFER_UPLOADS_REMAIN_FUNCTIONAL,
  SOURCE_TEXT_MISSING_WAV,
  SOURCE_TEXT_MIXER_REPORTS_THE_ACTUAL_FALLBACK_ERROR_WHEN,
  SOURCE_TEXT_MUSIC_MIXER_ATTACHMENTS_10_BROWSER_SCENARIOS_PASSED,
} from "../src/constants/sourceText.js";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";
import _ from "lodash";
import { chromium, type Page } from "playwright";
import { CINEMATIC_CHAT_PLANNING_CONFIG } from "../src/constants/cinematicConstants.ts";
import { MOTION_TEMPLATE_SYMBOL_12 } from "../src/constants/motionRuntime.ts";
import * as sourceTexts from "../src/constants/sourceText.ts";
const source = await readFile(SOURCE_TEXT_SRC_SERVER_SERVICES_CHATUIPLANNINGSERVICE_TS, SOURCE_TEXT_UTF8);
const start = source.indexOf(SOURCE_TEXT_CONST_SETLOCALFILEPATHSVIACDP);
const end = source.indexOf(SOURCE_TEXT_CONST_GETCOMPOSERREADINGS, start);
assert.ok(start >= 0 && end > start);
assert.match(source, /await attachRoomFiles\(page, attachments, artifactType\)/);
const code = ts.transpileModule(source.slice(start, end) + SOURCE_TEXT_GLOBALTHIS_ATTACH_ATTACHROOMFILES, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None } }).outputText;
const sandbox = vm.createContext({ _, Buffer, ...sourceTexts, MOTION_TEMPLATE_SYMBOL_12, CINEMATIC_CHAT_PLANNING_CONFIG: { ...CINEMATIC_CHAT_PLANNING_CONFIG, ROOM_DELETE_ACTION_TIMEOUT_MS: 150 } });
vm.runInContext(code, sandbox);
const attach = sandbox.attach as (page: Page, attachments: object[], artifactType?: string) => Promise<void>;
const directory = await mkdtemp(path.join(tmpdir(), SOURCE_TEXT_VIDIFY_MIXER_UPLOAD));
const browser = await chromium.launch({ channel: SOURCE_TEXT_CHROME, headless: true });
try {
  const page = await browser.newPage();
  const files = await Promise.all(
    Array.from({ length: 10 }, async (_, index) => {
      const file = path.join(directory, SOURCE_TEMPLATE_TRACK_WAV(`${index + 1}`));
      await writeFile(file, Buffer.from(SOURCE_TEXT_RIFF_TEST_AUDIO));
      return { name: path.basename(file), mimeType: SOURCE_TEXT_AUDIO_WAV, path: file };
    }),
  );
  const fixture = (menu = false) => SOURCE_TEMPLATE_INPUT_ID_AUDIO_TYPE_FILE_MULTIPLE(`${menu ? SOURCE_TEXT_DOCUMENT_GETELEMENTBYID_UPLOAD_HIDDEN_FALSE : SOURCE_TEXT_DOCUMENT_GETELEMENTBYID_AUDIO_CLICK}`, `${menu ? SOURCE_TEXT_BUTTON_ID_UPLOAD_ROLE_MENUITEM_HIDDEN_ARIA : ""}`);
  const withoutCdp = (hideInputs = false) =>
    new Proxy(page, {
      get(target, property) {
        if (property === SOURCE_TEXT_CONTEXT)
          return () => ({
            newCDPSession: async () => {
              throw new Error(SOURCE_TEXT_CDP_UNAVAILABLE);
            },
          });
        if (property === SOURCE_TEXT_LOCATOR && hideInputs) return (selector: string) => (selector === SOURCE_TEXT_INPUT_TYPE_FILE_2 || selector === SOURCE_TEXT_INPUT_TYPE_FILE ? { count: async () => 0 } : target.locator(selector));
        const value = Reflect.get(target, property);
        return typeof value === "function" ? value.bind(target) : value;
      },
    });
  const uploadedCount = () => page.evaluate(() => Number(document.body.dataset.count || 0));
  await page.setContent(fixture());
  await attach(withoutCdp(), files, SOURCE_TEXT_MUSIC_MIXER_RANKING);
  assert.equal(await uploadedCount(), 10, SOURCE_TEXT_MIXER_USES_INPUT_FALLBACK_WHEN_CDP_IS);
  await page.setContent(fixture());
  await attach(withoutCdp(true), files, SOURCE_TEXT_MUSIC_MIXER_RANKING);
  assert.equal(await uploadedCount(), 10, SOURCE_TEXT_MIXER_USES_THE_ACTUAL_FILE_CHOOSER_EVEN);
  await page.setContent(fixture(true));
  await attach(withoutCdp(true), files, SOURCE_TEXT_MUSIC_MIXER_RANKING);
  assert.equal(await uploadedCount(), 10, SOURCE_TEXT_MIXER_HANDLES_GEMINI_S_ATTACH_MENU_BEFORE);
  await page.setContent(SOURCE_TEXT_BUTTON_ARIA_LABEL_ATTACH_FILES_ONCLICK_CONST);
  await attach(withoutCdp(), files, SOURCE_TEXT_MUSIC_MIXER_RANKING);
  assert.equal(await uploadedCount(), 10, SOURCE_TEXT_MIXER_RETRIES_INPUTS_THAT_APPEAR_ONLY_AFTER);
  for (const artifactType of [undefined, SOURCE_TEXT_MUSIC_TRACK_EVALUATION, SOURCE_TEXT_SHORTS_HIGHLIGHTS]) {
    await page.setContent(fixture());
    await assert.rejects(attach(withoutCdp(), files, artifactType), /Room-only AI execution could not attach/);
    assert.equal(await uploadedCount(), 0, SOURCE_TEXT_OTHER_SCREENS_MUST_NOT_OPT_INTO_LOCAL);
  }
  await page.setContent(fixture());
  await attach(page, files, SOURCE_TEXT_SHORTS_HIGHLIGHTS);
  assert.equal(await uploadedCount(), 10, SOURCE_TEXT_EXISTING_CDP_UPLOADS_REMAIN_FUNCTIONAL_FOR_OTHER);
  await page.setContent(fixture());
  await attach(withoutCdp(), [{ name: SOURCE_TEXT_BUFFER_WAV, mimeType: SOURCE_TEXT_AUDIO_WAV, buffer: Buffer.from(SOURCE_TEXT_RIFF_TEST) }], SOURCE_TEXT_MUSIC_TRACK_EVALUATION);
  assert.equal(await uploadedCount(), 1, SOURCE_TEXT_EXISTING_BUFFER_UPLOADS_REMAIN_FUNCTIONAL);
  await page.setContent(fixture());
  await assert.rejects(attach(withoutCdp(true), [{ ...files[0], path: path.join(directory, SOURCE_TEXT_MISSING_WAV) }], SOURCE_TEXT_MUSIC_MIXER_RANKING), /Room-only AI execution could not attach.*(?:ENOENT|no such file)/, SOURCE_TEXT_MIXER_REPORTS_THE_ACTUAL_FALLBACK_ERROR_WHEN);
  assert.equal(await uploadedCount(), 0);
  writeVerificationLog(SOURCE_TEXT_MUSIC_MIXER_ATTACHMENTS_10_BROWSER_SCENARIOS_PASSED);
} finally {
  await browser.close();
  await rm(directory, { recursive: true, force: true });
}
