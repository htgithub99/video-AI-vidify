import { writeVerificationLog } from "./verificationLogger";
import {
  SOURCE_TEXT_SRC_SERVER_SERVICES_CHATUIPLANNINGSERVICE_TS,
  SOURCE_TEXT_UTF8,
  SOURCE_TEXT_CONST_GETCOMPOSERREADINGS,
  SOURCE_TEXT_CONST_GETCHATMODELOPTION,
  SOURCE_TEXT_DISPLAY_NAME_WAV,
  SOURCE_TEXT_D_MUSIC_TRACK_WAV,
  SOURCE_TEXT_DONE,
  SOURCE_TEXT_GLOBALTHIS_SUBMIT_SUBMITPROMPT,
  SOURCE_TEXT_CHROME,
  SOURCE_TEMPLATE_FORM_TEXTAREA_ID_PROMPT_TEXTAREA_BUTTON,
  SOURCE_TEXT_MUSIC_MIXER_RANKING,
  SOURCE_TEXT_ROOM,
  SOURCE_TEXT_RANK_MUSIC,
  SOURCE_TEXT_PROMPT_2,
  SOURCE_TEXT_BUTTON_ARIA_LABEL_SEND_MESSAGE,
  SOURCE_TEXT_RESPONSE_2,
  SOURCE_TEXT_BUSY_2,
  SOURCE_TEXT_TEST_UPLOAD,
  SOURCE_TEXT_INPUT_COMPANION_CHIP_TRACK_WAV_INPUT_COMPANION,
  SOURCE_TEMPLATE_DIV_ROLE_PROGRESSBAR_DIV,
  SOURCE_TEXT_ROLE_PROGRESSBAR,
  SOURCE_TEXT_ENABLED_SEND_MUST_NOT_BYPASS_ONGOING_UPLOADS,
  SOURCE_TEXT_CHAT_ATTACHMENT_COMPLETED,
  SOURCE_TEXT_NO_ATTACHMENT_PREVIEWS_MUST_BLOCK_SUBMISSION,
  SOURCE_TEXT_INPUT_COMPANION_CHIP_WRONG_WAV_INPUT_COMPANION,
  SOURCE_TEXT_WRONG_FILENAME_MUST_BLOCK_SUBMISSION,
  SOURCE_TEXT_INPUT_COMPANION_CHIP_OTHER_TRACK_WAV_INPUT,
  SOURCE_TEXT_A_FILENAME_CONTAINING_THE_EXPECTED_NAME_IS,
  SOURCE_TEMPLATE_SYMBOL_75,
  SOURCE_TEXT_EXTRA_STALE_ATTACHMENTS_MUST_BLOCK_SUBMISSION,
  SOURCE_TEMPLATE_DIV_CLASS_UPLOAD_ERROR_UPLOAD_FAILED,
  SOURCE_TEMPLATE_MAT_ICON_FONTICON_ERROR_ERROR_MAT,
  SOURCE_TEXT_AN_UPLOAD_ERROR_ICON_MUST_BLOCK_SUBMISSION,
  SOURCE_TEMPLATE_DIV_ROLE_PROGRESSBAR_HIDDEN_DIV,
  SOURCE_TEXT_A_HIDDEN_INACTIVE_PROGRESS_INDICATOR_MUST_NOT,
  SOURCE_TEMPLATE_ASYNC_PROCESSING_CHIP_PROCESSING_ASYNC_PROCESSING,
  SOURCE_TEXT_FILE_PROCESSING_MUST_FINISH_BEFORE_SUBMISSION,
  SOURCE_TEMPLATE_DIV_DIV,
  SOURCE_TEXT_OLD_MESSAGE_ATTACHMENTS_CANNOT_SATISFY_COMPOSER_CHECKS,
  SOURCE_TEMPLATE_DIV_ARIA_BUSY_TRUE_DIV,
  SOURCE_TEXT_INPUT,
  SOURCE_TEXT_INPUT_COMPANION_CHIP,
  SOURCE_TEXT_THE_FINAL_CHECK_MUST_CATCH_CHANGES_AFTER,
  SOURCE_TEXT_DIV_CLASS_UPLOAD_ERROR_UPLOAD_FAILED_DIV,
  SOURCE_TEXT_SHORTS_HIGHLIGHTS,
  SOURCE_TEXT_OTHER_SCREENS_RETAIN_THEIR_ORIGINAL_SUBMISSION_FLOW,
  SOURCE_TEXT_LONG_INDETERMINATE_UPLOAD_CAN_FINISH_BEYOND_THE,
  SOURCE_TEMPLATE_DIV_ROLE_PROGRESSBAR_ARIA_VALUENOW_1,
  SOURCE_TEXT_ARIA_VALUENOW,
  SOURCE_TEXT_CHANGING_PROGRESS_EXTENDS_THE_STALL_DEADLINE,
  SOURCE_TEMPLATE_DIV_ROLE_PROGRESSBAR_ARIA_VALUENOW_12,
  SOURCE_TEXT_A_PERMANENTLY_ACTIVE_SPINNER_STILL_HAS_A,
  SOURCE_TEMPLATE_TRACK_WAV,
  SOURCE_TEMPLATE_UPLOADER_FILE_PREVIEW_GEM_ATTACHMENT_SPAN,
  SOURCE_TEMPLATE_DIV_CLASS_ATTACHMENT_PREVIEW_WRAPPER_UPLOADER,
  SOURCE_TEXT_21_MIDNIGHT_FREQUENCY_WAV,
  SOURCE_TEXT_UPLOADER_FILE_PREVIEW_DIV_ARIA_DESCRIBEDBY_FULL,
  SOURCE_TEMPLATE_DIV_HIDDEN_ID_FULL_NAME_DIV,
  SOURCE_TEXT_21_DIFFERENT_FREQUENCY_WAV,
  SOURCE_TEXT_A_TEMPORARY_COMPOSER_REPLACEMENT_MUST_BE_WAITED,
  SOURCE_TEXT_MUSIC_MIXER_UPLOAD_READINESS_22_SUBMISSION_LONG,
} from "../src/constants/sourceText.js";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import vm from "node:vm";
import ts from "typescript";
import _ from "lodash";
import { chromium, type Page } from "playwright";
import * as sourceTexts from "../src/constants/sourceText.ts";
import { MOTION_TEMPLATE_SYMBOL_26 } from "../src/constants/motionRuntime.ts";
import { CINEMATIC_CHAT_PLANNING_CONFIG } from "../src/constants/cinematicConstants.ts";
import { CHAT_UI_AUTOMATION_MESSAGES } from "../src/constants/messages.ts";
import { waitForMusicMixerUploads } from "../src/server/services/musicMixerUploadReadiness.ts";
const source = await readFile(SOURCE_TEXT_SRC_SERVER_SERVICES_CHATUIPLANNINGSERVICE_TS, SOURCE_TEXT_UTF8);
const start = source.indexOf(SOURCE_TEXT_CONST_GETCOMPOSERREADINGS);
const end = source.indexOf(SOURCE_TEXT_CONST_GETCHATMODELOPTION, start);
const events: string[] = [];
const attachments = [{ name: SOURCE_TEXT_DISPLAY_NAME_WAV, path: SOURCE_TEXT_D_MUSIC_TRACK_WAV }];
const sandbox = vm.createContext({
  _,
  createHash,
  ...sourceTexts,
  MOTION_TEMPLATE_SYMBOL_26,
  CHAT_UI_AUTOMATION_MESSAGES,
  CINEMATIC_CHAT_PLANNING_CONFIG: {
    ...CINEMATIC_CHAT_PLANNING_CONFIG,
    PAGE_READY_TIMEOUT_MS: 500,
    ATTACHMENT_READY_TIMEOUT_MS: 650,
    SUBMISSION_POLL_MS: 10,
    PROMPT_SUBMIT_SETTLE_MS: 0,
  },
  pendingRoomResponses: new Map(),
  throwIfPlanningCancelled: (signal?: AbortSignal) => signal?.throwIfAborted(),
  normalizeRoomPrompt: (value: string) => value,
  appLog: () => {},
  musicErrorDetails: () => ({}),
  writeMusicDiagnostic: async (event: string) => {
    events.push(event);
  },
  getLastVisibleLocator: async (page: Page, selector: string) => page.locator(selector),
  getChatResponseSnapshots: async () => [],
  throwIfGrokRateLimited: async () => {},
  waitForRoomIdle: async () => {},
  attachRoomFiles: async () => {},
  delayAsync: async () => {},
  assessChatComposerContent: () => ({ valid: true }),
  waitForStableResponse: async () => SOURCE_TEXT_DONE,
  waitForMusicMixerUploads: (input: any, files: any, timeout: number, signal?: AbortSignal) => waitForMusicMixerUploads(input, files, timeout, signal, 20, { maxWaitMs: timeout, stallTimeoutMs: timeout }),
});
vm.runInContext(
  ts.transpileModule(source.slice(start, end) + SOURCE_TEXT_GLOBALTHIS_SUBMIT_SUBMITPROMPT, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None },
  }).outputText,
  sandbox,
);
const browser = await chromium.launch({ channel: SOURCE_TEXT_CHROME, headless: true });
try {
  const page = await browser.newPage();
  const fixture = async (inside: string, outside = "") => {
    events.length = 0;
    await page.setContent(SOURCE_TEMPLATE_FORM_TEXTAREA_ID_PROMPT_TEXTAREA_BUTTON(`${outside}`, `${inside}`));
  };
  const submit = (stage = SOURCE_TEXT_MUSIC_MIXER_RANKING, signal?: AbortSignal) => sandbox.submit(page, SOURCE_TEXT_ROOM, SOURCE_TEXT_RANK_MUSIC, SOURCE_TEXT_PROMPT_2, SOURCE_TEXT_BUTTON_ARIA_LABEL_SEND_MESSAGE, SOURCE_TEXT_RESPONSE_2, SOURCE_TEXT_BUSY_2, [], attachments, undefined, stage, SOURCE_TEXT_TEST_UPLOAD, signal);
  const sent = () => page.evaluate(() => Number(document.body.dataset.sent || 0));
  const ready = SOURCE_TEXT_INPUT_COMPANION_CHIP_TRACK_WAV_INPUT_COMPANION;
  await fixture(SOURCE_TEMPLATE_DIV_ROLE_PROGRESSBAR_DIV(`${ready}`));
  await page.evaluate(
    (sharedBrowserPayload) => {
      const { SOURCE_TEXT_ROLE_PROGRESSBAR } = sharedBrowserPayload.texts;
      return setTimeout(() => document.querySelector(SOURCE_TEXT_ROLE_PROGRESSBAR)?.remove(), 350);
    },
    { texts: { SOURCE_TEXT_ROLE_PROGRESSBAR } },
  );
  const slowSubmit = submit();
  await new Promise((resolve) => setTimeout(resolve, 100));
  assert.equal(await sent(), 0, SOURCE_TEXT_ENABLED_SEND_MUST_NOT_BYPASS_ONGOING_UPLOADS);
  await slowSubmit;
  assert.equal(await sent(), 1);
  assert.ok(events.includes(SOURCE_TEXT_CHAT_ATTACHMENT_COMPLETED));
  await fixture("");
  await assert.rejects(submit(), /chưa xác nhận tải xong/);
  assert.equal(await sent(), 0, SOURCE_TEXT_NO_ATTACHMENT_PREVIEWS_MUST_BLOCK_SUBMISSION);
  assert.ok(!events.includes(SOURCE_TEXT_CHAT_ATTACHMENT_COMPLETED));
  await fixture(SOURCE_TEXT_INPUT_COMPANION_CHIP_WRONG_WAV_INPUT_COMPANION);
  await assert.rejects(submit(), /chưa xác nhận tải xong/);
  assert.equal(await sent(), 0, SOURCE_TEXT_WRONG_FILENAME_MUST_BLOCK_SUBMISSION);
  await fixture(SOURCE_TEXT_INPUT_COMPANION_CHIP_OTHER_TRACK_WAV_INPUT);
  await assert.rejects(submit(), /chưa xác nhận tải xong/);
  assert.equal(await sent(), 0, SOURCE_TEXT_A_FILENAME_CONTAINING_THE_EXPECTED_NAME_IS);
  await fixture(SOURCE_TEMPLATE_SYMBOL_75(`${ready}`, `${ready}`));
  await assert.rejects(submit(), /chưa xác nhận tải xong/);
  assert.equal(await sent(), 0, SOURCE_TEXT_EXTRA_STALE_ATTACHMENTS_MUST_BLOCK_SUBMISSION);
  await fixture(SOURCE_TEMPLATE_DIV_CLASS_UPLOAD_ERROR_UPLOAD_FAILED(`${ready}`));
  await assert.rejects(submit(), /tải tệp thất bại/);
  assert.equal(await sent(), 0);
  await fixture(SOURCE_TEMPLATE_MAT_ICON_FONTICON_ERROR_ERROR_MAT(`${ready}`));
  await assert.rejects(submit(), /tải tệp thất bại/);
  assert.equal(await sent(), 0, SOURCE_TEXT_AN_UPLOAD_ERROR_ICON_MUST_BLOCK_SUBMISSION);
  await fixture(SOURCE_TEMPLATE_DIV_ROLE_PROGRESSBAR_HIDDEN_DIV(`${ready}`));
  await submit();
  assert.equal(await sent(), 1, SOURCE_TEXT_A_HIDDEN_INACTIVE_PROGRESS_INDICATOR_MUST_NOT);
  await fixture(SOURCE_TEMPLATE_ASYNC_PROCESSING_CHIP_PROCESSING_ASYNC_PROCESSING(`${ready}`));
  await assert.rejects(submit(), /chưa xác nhận tải xong/);
  assert.equal(await sent(), 0, SOURCE_TEXT_FILE_PROCESSING_MUST_FINISH_BEFORE_SUBMISSION);
  await fixture("", SOURCE_TEMPLATE_DIV_DIV(`${ready}`));
  await assert.rejects(submit(), /chưa xác nhận tải xong/);
  assert.equal(await sent(), 0, SOURCE_TEXT_OLD_MESSAGE_ATTACHMENTS_CANNOT_SATISFY_COMPOSER_CHECKS);
  await fixture(SOURCE_TEMPLATE_DIV_ARIA_BUSY_TRUE_DIV(`${ready}`));
  const controller = new AbortController();
  const cancelled = submit(SOURCE_TEXT_MUSIC_MIXER_RANKING, controller.signal);
  setTimeout(() => controller.abort(), 50);
  await assert.rejects(cancelled, /abort/i);
  assert.equal(await sent(), 0);
  await fixture(ready);
  await page.locator("#prompt").evaluate(
    (node, sharedBrowserPayload) => {
      const { SOURCE_TEXT_INPUT, SOURCE_TEXT_INPUT_COMPANION_CHIP } = sharedBrowserPayload.texts;
      return node.addEventListener(SOURCE_TEXT_INPUT, () => document.querySelector(SOURCE_TEXT_INPUT_COMPANION_CHIP)?.remove(), { once: true });
    },
    { texts: { SOURCE_TEXT_INPUT, SOURCE_TEXT_INPUT_COMPANION_CHIP } },
  );
  await assert.rejects(submit(), /chưa xác nhận tải xong/);
  assert.equal(await sent(), 0, SOURCE_TEXT_THE_FINAL_CHECK_MUST_CATCH_CHANGES_AFTER);
  await fixture(SOURCE_TEXT_DIV_CLASS_UPLOAD_ERROR_UPLOAD_FAILED_DIV);
  await submit(SOURCE_TEXT_SHORTS_HIGHLIGHTS);
  assert.equal(await sent(), 1, SOURCE_TEXT_OTHER_SCREENS_RETAIN_THEIR_ORIGINAL_SUBMISSION_FLOW);
  const longPolicy = { maxWaitMs: 1600, stallTimeoutMs: 180, pollMs: 25 };
  await fixture(SOURCE_TEMPLATE_DIV_ROLE_PROGRESSBAR_DIV(`${ready}`));
  await page.evaluate(
    (sharedBrowserPayload) => {
      const { SOURCE_TEXT_ROLE_PROGRESSBAR } = sharedBrowserPayload.texts;
      return setTimeout(() => document.querySelector(SOURCE_TEXT_ROLE_PROGRESSBAR)?.remove(), 450);
    },
    { texts: { SOURCE_TEXT_ROLE_PROGRESSBAR } },
  );
  await waitForMusicMixerUploads(page.locator(SOURCE_TEXT_PROMPT_2), attachments, 80, undefined, 20, longPolicy);
  assert.equal(await sent(), 0, SOURCE_TEXT_LONG_INDETERMINATE_UPLOAD_CAN_FINISH_BEYOND_THE);
  await fixture(SOURCE_TEMPLATE_DIV_ROLE_PROGRESSBAR_ARIA_VALUENOW_1(`${ready}`));
  await page.evaluate(
    (sharedBrowserPayload) => {
      const { SOURCE_TEXT_ROLE_PROGRESSBAR, SOURCE_TEXT_ARIA_VALUENOW } = sharedBrowserPayload.texts;
      let progress = 1;
      const timer = setInterval(() => {
        const node = document.querySelector(SOURCE_TEXT_ROLE_PROGRESSBAR);
        if (++progress === 7) {
          node?.remove();
          clearInterval(timer);
        } else node?.setAttribute(SOURCE_TEXT_ARIA_VALUENOW, String(progress));
      }, 80);
    },
    { texts: { SOURCE_TEXT_ROLE_PROGRESSBAR, SOURCE_TEXT_ARIA_VALUENOW } },
  );
  await waitForMusicMixerUploads(page.locator(SOURCE_TEXT_PROMPT_2), attachments, 80, undefined, 20, longPolicy);
  assert.equal(await sent(), 0, SOURCE_TEXT_CHANGING_PROGRESS_EXTENDS_THE_STALL_DEADLINE);
  await fixture(SOURCE_TEMPLATE_DIV_ROLE_PROGRESSBAR_ARIA_VALUENOW_12(`${ready}`));
  await assert.rejects(waitForMusicMixerUploads(page.locator(SOURCE_TEXT_PROMPT_2), attachments, 80, undefined, 20, longPolicy), /tiến độ tải tệp không thay đổi/);
  assert.equal(await sent(), 0);
  await fixture(SOURCE_TEMPLATE_DIV_ROLE_PROGRESSBAR_DIV(`${ready}`));
  await assert.rejects(waitForMusicMixerUploads(page.locator(SOURCE_TEXT_PROMPT_2), attachments, 80, undefined, 20, { ...longPolicy, maxWaitMs: 180 }), /chưa xác nhận tải xong/);
  assert.equal(await sent(), 0, SOURCE_TEXT_A_PERMANENTLY_ACTIVE_SPINNER_STILL_HAS_A);
  const tenFiles = Array.from({ length: 10 }, (_, index) => ({ name: SOURCE_TEMPLATE_TRACK_WAV(`${index}`) }));
  const geminiPreviews = tenFiles.map((file) => SOURCE_TEMPLATE_UPLOADER_FILE_PREVIEW_GEM_ATTACHMENT_SPAN(`${file.name.replace(/\.wav$/, "")}`, `${file.name.replace(/\.wav$/, "")}`)).join("");
  await fixture(SOURCE_TEMPLATE_DIV_CLASS_ATTACHMENT_PREVIEW_WRAPPER_UPLOADER(`${geminiPreviews}`));
  await waitForMusicMixerUploads(page.locator(SOURCE_TEXT_PROMPT_2), tenFiles, 80, undefined, 20, longPolicy);
  await page
    .locator("uploader-file-preview")
    .last()
    .evaluate((node) => node.remove());
  await assert.rejects(waitForMusicMixerUploads(page.locator(SOURCE_TEXT_PROMPT_2), tenFiles, 80, undefined, 20, longPolicy), /đang thấy 9/);
  const longName = SOURCE_TEXT_21_MIDNIGHT_FREQUENCY_WAV;
  await fixture(SOURCE_TEXT_UPLOADER_FILE_PREVIEW_DIV_ARIA_DESCRIBEDBY_FULL, SOURCE_TEMPLATE_DIV_HIDDEN_ID_FULL_NAME_DIV(`${longName}`));
  await waitForMusicMixerUploads(page.locator(SOURCE_TEXT_PROMPT_2), [{ name: longName }], 80, undefined, 20, longPolicy);
  await page.locator("#full-name").evaluate(
    (node, sharedBrowserPayload) => {
      const { SOURCE_TEXT_21_DIFFERENT_FREQUENCY_WAV } = sharedBrowserPayload.texts;
      return (node.textContent = SOURCE_TEXT_21_DIFFERENT_FREQUENCY_WAV);
    },
    { texts: { SOURCE_TEXT_21_DIFFERENT_FREQUENCY_WAV } },
  );
  await assert.rejects(waitForMusicMixerUploads(page.locator(SOURCE_TEXT_PROMPT_2), [{ name: longName }], 80, undefined, 20, longPolicy), /chưa xác nhận tải xong/);
  await fixture(ready);
  await page.evaluate(
    (sharedBrowserPayload) => {
      const { SOURCE_TEXT_PROMPT_2 } = sharedBrowserPayload.texts;
      const composer = document.querySelector(SOURCE_TEXT_PROMPT_2)!;
      const parent = composer.parentElement!;
      composer.remove();
      setTimeout(() => parent.appendChild(composer), 200);
    },
    { texts: { SOURCE_TEXT_PROMPT_2 } },
  );
  page.setDefaultTimeout(50);
  await waitForMusicMixerUploads(page.locator(SOURCE_TEXT_PROMPT_2), attachments, 80, undefined, 20, longPolicy);
  page.setDefaultTimeout(30000);
  assert.equal(await sent(), 0, SOURCE_TEXT_A_TEMPORARY_COMPOSER_REPLACEMENT_MUST_BE_WAITED);
  writeVerificationLog(SOURCE_TEXT_MUSIC_MIXER_UPLOAD_READINESS_22_SUBMISSION_LONG);
} finally {
  await browser.close();
}
