import assert from "node:assert/strict";
import { chromium } from "playwright";
import { waitForGeminiModelUi, getGeminiModelButton } from "../src/server/services/geminiModelService.js";
import { CINEMATIC_CHAT_PLANNING_CONFIG as CONFIG } from "../src/constants/cinematicConstants.js";
import { GEMINI_MODEL_UI as UI } from "../src/constants/geminiChatModels.js";
import { musicErrorDetails } from "../src/server/services/musicDiagnosticService.js";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const oldReady = CONFIG.PAGE_READY_TIMEOUT_MS;
const oldFocus = UI.FOCUS_RETRY_MS;
(CONFIG as unknown as { PAGE_READY_TIMEOUT_MS: number }).PAGE_READY_TIMEOUT_MS = 1500;
(UI as unknown as { FOCUS_RETRY_MS: number }).FOCUS_RETRY_MS = 150;
try {
  const page = await browser.newPage();
  await page.setContent(`<rich-textarea class="simplified-input"><div role="textbox" contenteditable="true">keep draft</div></rich-textarea><button data-test-id="bard-mode-menu-button" hidden>Flash Trung bình</button><button>Try Pro</button><script>
    window.clicks=0;
    document.querySelector('rich-textarea').addEventListener('click', () => {
      if (++window.clicks === 2) { document.querySelector('[data-test-id]').hidden=false; document.querySelector('rich-textarea').className=''; }
    });
  </script>`);
  await waitForGeminiModelUi(page);
  assert.equal(await page.evaluate(() => (window as any).clicks), 2, "A lost first expansion click is recovered");
  assert.equal(await page.locator('[role="textbox"]').innerText(), "keep draft");
  assert.equal(await (await getGeminiModelButton(page)).innerText(), "Flash Trung bình", "Model picker wins over a later unrelated Pro button");
  await page.setContent(`<rich-textarea><div role="textbox" contenteditable="true">keep text</div><textarea disabled>inactive field</textarea></rich-textarea><button data-test-id="bard-mode-menu-button">Flash</button><button>Try Pro</button>`);
  await waitForGeminiModelUi(page);
  await page.setContent(`<rich-textarea><div role="textbox" contenteditable="false">not ready</div></rich-textarea><button data-test-id="bard-mode-menu-button">Flash</button>`);
  let failure: unknown;
  try {
    await waitForGeminiModelUi(page);
  } catch (error) {
    failure = error;
  }
  assert.ok(failure);
  const details = musicErrorDetails(failure);
  assert.equal(details.selectionPhase, "page_ready");
  assert.equal(details.selectionInputEditable, false);
  assert.equal(details.selectionModelVisible, true);
  assert.equal(details.selectionModelEnabled, true);
  assert.equal(details.selectionModelLabel, "Flash");
  assert.ok(Number(details.selectionElapsedMs) >= 1500);
  await page.setContent(`<rich-textarea><div contenteditable="true">draft</div></rich-textarea><button data-test-id="bard-mode-menu-button" disabled>Flash</button>`);
  await assert.rejects(waitForGeminiModelUi(page), (error) => {
    assert.equal(musicErrorDetails(error).selectionModelEnabled, false);
    return true;
  });
  const abort = new AbortController();
  abort.abort();
  await assert.rejects(waitForGeminiModelUi(page, abort.signal), /chat_planning_cancelled/);
  await page.close();
  await assert.rejects(waitForGeminiModelUi(page), (error) => {
    assert.equal(musicErrorDetails(error).selectionPageClosed, true);
    return true;
  });
  process.stdout.write("PASS: retry composer expansion, preserve drafts, choose actual picker/editable input, readiness diagnostics, disabled model, cancellation and closed page. Local Chromium fixtures only.\n");
} finally {
  (CONFIG as unknown as { PAGE_READY_TIMEOUT_MS: number }).PAGE_READY_TIMEOUT_MS = oldReady;
  (UI as unknown as { FOCUS_RETRY_MS: number }).FOCUS_RETRY_MS = oldFocus;
  await browser.close();
}
