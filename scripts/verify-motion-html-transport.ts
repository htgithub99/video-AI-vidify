import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { parseAiJson } from "../src/lib/aiJson.js";
import { extractJson } from "../src/features/motion/server/services/motionStoryService.js";
import { chromium } from "playwright";
import { findNativeChrome } from "../src/server/services/nativeProxyBrowser.js";
import { CINEMATIC_CHAT_PLANNING_CONFIG as C } from "../src/constants/cinematicConstants.js";
import { getChatResponseSnapshots, waitForStableResponse } from "../src/server/services/chatUiPlanningService.js";
import { chatResponseIdentity } from "../src/server/services/chatResponseIdentity.js";
const malformed = String.raw`{"artifactType":"motion-html-plan","requestId":"json-apostrophe","scenes":[{"purpose":"Alexander\'s charge","sceneTemplate":"lineCap/lineJoin 'round'"}],"path":"C:\\temp","quoted":"say \"go\"","unicode":"\u1ea3"}`;
assert.throws(() => JSON.parse(malformed));
const repaired = parseAiJson<any>(malformed);
assert.equal(repaired.scenes[0].purpose, "Alexander's charge");
assert.equal(repaired.scenes[0].sceneTemplate, "lineCap/lineJoin 'round'");
assert.equal(repaired.path, "C:\\temp"); assert.equal(repaired.quoted, 'say "go"'); assert.equal(repaired.unicode, 'ả');
assert.deepEqual(parseAiJson(String.raw`{"value":"already valid \\' \"quoted\" \n \u1234"}`), JSON.parse(String.raw`{"value":"already valid \\' \"quoted\" \n \u1234"}`));
assert.equal(parseAiJson(String.raw`{"value":"backslash \\' plus typo \'"}`).value, "backslash \\' plus typo '");
for (const invalid of [String.raw`{"value":"bad \q"}`, String.raw`{"value":"unfinished \'`]) assert.throws(() => parseAiJson(invalid));
let archived: string | undefined;
try { archived = JSON.parse(await fs.readFile("storage/output/motion-video/ai-debug/d169a74c-5d0e-4e4c-82fa-1e47310d3dd0.json", "utf8")).lastCandidate; }
catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
if (archived) {
  assert.throws(() => JSON.parse(archived));
  assert.equal(extractJson(archived).scenes.length, 6, "The saved failing response is recovered locally without another AI call");
}
const browser = await chromium.launch({ executablePath: findNativeChrome(), headless: true });
const original = { ...C };
Object.assign(C, { RESPONSE_POLL_MS: 5, RESPONSE_STABLE_POLLS: 2, RESPONSE_STABLE_POLLS_MATCHED: 2, INVALID_RESPONSE_STABLE_POLLS: 4 });
try {
  const page = await browser.newPage();
  const html = '<!DOCTYPE html><html data-artifact="motion-html-scene" data-request-id="html-request"><head></head><body><canvas id="motion-canvas"></canvas><script>window.motionScene={ready:Promise.resolve(),renderAt:()=>{}};</script></body></html>';
  for (const selector of [C.GEMINI_RESPONSE_SELECTOR, C.CHATGPT_RESPONSE_SELECTOR]) {
    const markup = selector === C.GEMINI_RESPONSE_SELECTOR ? '<model-response><message-content><pre><code></code></pre></message-content></model-response>' : '<div data-message-author-role="assistant" data-message-id="html-response"><div class="markdown"><pre><code></code></pre></div></div>';
    await page.setContent(markup);
    await page.locator("code").evaluate((node, text) => { node.textContent = text; }, html);
    const snapshots = await getChatResponseSnapshots(page, selector, "motion-html-scene");
    assert.equal(snapshots[0].text, html);
    const raw = await waitForStableResponse(page, selector, "button.stop", 0, [], [], undefined, "motion-html-scene", "html-request", AbortSignal.timeout(5000));
    assert.equal(raw, html, "Complete HTML crosses provider transport unchanged, not as JSON identity metadata");
  }
  for (const candidate of [malformed, ...(archived ? [archived] : [])]) {
    const payload = parseAiJson<any>(candidate);
    await page.setContent('<model-response><message-content><pre><code></code></pre></message-content></model-response>');
    await page.locator('code').evaluate((node, text) => { node.textContent = text; }, candidate);
    const raw = await waitForStableResponse(page, C.GEMINI_RESPONSE_SELECTOR, 'button.stop', 0, [], [], undefined, payload.artifactType, payload.requestId, AbortSignal.timeout(5000));
    assert.deepEqual(extractJson(raw), payload, "The browser response path accepts the repaired JSON with its request identity");
  }
  process.stdout.write("PASS: invalid apostrophe escapes repaired in the real saved six-scene response and browser transport; valid escapes preserved.\n");
  assert.deepEqual(chatResponseIdentity(JSON.stringify({ artifactType: "motion-story-chapter", requestId: "json-request", beats: [{ narration: '<html data-artifact="wrong" data-request-id="wrong">' }] })), { artifactType: "motion-story-chapter", requestId: "json-request" });
  process.stdout.write("PASS: Gemini/ChatGPT DOM extraction preserves complete raw HTML, response identity does not leak into JSON payloads.\n");
} finally { Object.assign(C, original); await browser.close(); }
process.exit(0);
