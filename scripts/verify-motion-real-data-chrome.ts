import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { parse, serializeOuter } from "parse5";
import { chromium } from "playwright";
import { normalizeSceneRenderIds } from "../src/lib/motionSceneRenderIds.ts";
import { normalizeFirstSceneComposition, compositionElements } from "../src/lib/motionSceneComposition.ts";
import { compositionRepairDraft } from "../src/lib/motionCompositionRepair.ts";
import { clickCurrentChatRetry, isRecoverableChatRefusal } from "../src/server/services/chatRoomRecovery.ts";
import { findNativeChrome } from "../src/server/services/nativeProxyBrowser.ts";

const output = path.resolve("scratch/motion-real-recovery-20261105");
const baseline = path.join(output, "baseline/output/motion-video");
const manifest = JSON.parse(await fs.readFile(path.join(output, "baseline/manifest.json"), "utf8"));
const read = async (file: string) => JSON.parse(await fs.readFile(path.join(baseline, file), "utf8"));
const job = (await read(`story-jobs/${manifest.jobId}.json`)).job;
const scenes: any[] = Object.values(job.result.gen.remotion.scenes).flat();
const cases = [
  ["99d1c2c7230b6fab5621ef6bfa9a935abbe18b1da7c735c5ea822217a2627372", "c2_event_c19ae056043a:3"],
  ["1ee95718db8f407d5a1af0091a58a2919fa851828de239004ed7cbe583dbe1b8", "c4_event_ecf6d8536f9e:4"],
];
const files = await fs.readdir(path.join(baseline, "ai-debug"));
const browser = await chromium.launch({ executablePath: findNativeChrome(), headless: false });
const results: any[] = [];
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.route("**/*", (route) => route.abort());
  for (const [hash, sceneId] of cases) {
    const file = files.find((name) => name.includes(hash) && name.endsWith(".json"))!;
    const raw = (await read("ai-debug/" + file)).draft;
    const original = structuredClone(raw);
    assert.throws(() => compositionElements(raw.svg));
    const scene = scenes.find((item) => item.id === sceneId)!;
    const fixed = normalizeSceneRenderIds(raw, scene.nodes);
    assert.deepEqual(raw, original, "Normalization must not mutate the saved real response");
    const built = normalizeFirstSceneComposition(compositionRepairDraft(fixed), "qa", "qa", scene.purpose, scene.nodes, new Set(scene.nodes.map((node: any) => node.entityId).filter(Boolean)), 1280, 720);
    assert.ok(built.asset.svg);
    assert.deepEqual(fixed.animations, raw.animations, "These real cases do not require changing animation targets or values");
    const samples = Math.max(1, ...raw.animations.map((track: any) => track.keyframes.length));
    for (let sample = 0; sample < samples; sample++) {
      const render = async (draft: any, suffix: string) => {
        await page.setContent(`<style>html,body{margin:0;width:1280px;height:720px;overflow:hidden}</style>${draft.svg}`);
        await page.evaluate(({ tracks, index }) => {
          for (const track of tracks) {
            const frame = track.keyframes[Math.min(index, track.keyframes.length - 1)];
            document.getElementById(track.target)?.setAttribute(track.attribute, String(frame.value));
          }
        }, { tracks: draft.animations, index: sample });
        return page.screenshot({ path: path.join(output, `${hash.slice(0, 8)}-${sample}-${suffix}.png`) });
      };
      const before = await render(raw, "before");
      const after = await render(fixed, "after");
      assert.deepEqual(after, before, "ID repair must preserve real Chrome pixels at sampled keyframes");
    }
    if (hash.startsWith("1ee")) assert.throws(() => normalizeSceneRenderIds({ ...raw, animations: [...raw.animations, { target: "leg-left" }] }, scene.nodes), /leg-left/);
    results.push({ case: file, accepted: true, chromePixelEquality: true, sampledKeyframes: samples, originalSha256: createHash("sha256").update(JSON.stringify(raw)).digest("hex") });
  }
  const dom = parse(await fs.readFile(path.join(baseline, "ai-debug/motion_remotion_composition-a8c3f22c.dom.txt"), "utf8")) as any;
  const find = (node: any, test: (value: any) => boolean): any[] => [...(test(node) ? [node] : []), ...(node.childNodes || []).flatMap((child: any) => find(child, test))];
  const text = (node: any): string => node.nodeName === "#text" ? node.value : (node.childNodes || []).map(text).join("");
  const attr = (node: any, key: string) => node.attrs?.find((entry: any) => entry.name === key)?.value;
  const turn = find(dom, (node) => node.tagName === "model-response").at(-1);
  const menu = find(dom, (node) => attr(node, "role") === "menu" && /Thử lại/.test(text(node))).at(-1);
  assert.ok(turn && menu, "The saved real Gemini DOM must include both the response and its actual menu");
  await page.setContent(`<style>model-response{display:block}gem-icon-button{display:inline-block;position:relative;width:40px;height:40px}button{position:static!important}</style><user-query>Actual source task</user-query>${serializeOuter(turn)}`);
  const html = serializeOuter(menu);
  await page.evaluate((menuHtml) => {
    const trigger = document.querySelector('model-response [data-test-id="regenerate-button"]') as HTMLElement;
    if (!trigger) throw new Error("Real Gemini retry trigger missing");
    (window as any).regenerations = 0;
    trigger.onclick = () => {
      const overlay = document.createElement("div");
      overlay.className = "cdk-overlay-pane";
      overlay.innerHTML = menuHtml;
      const oldMenuId = trigger.getAttribute("aria-controls");
      if (oldMenuId) overlay.querySelector('[role="menu"]')?.setAttribute("id", oldMenuId);
      document.body.append(overlay);
      for (const button of overlay.querySelectorAll('button, [role="menuitem"]')) {
        if (button.textContent?.trim().endsWith("Thử lại")) (button as HTMLElement).onclick = () => { (window as any).regenerations++; overlay.remove(); };
      }
    };
  }, html);
  assert.equal(await clickCurrentChatRetry(page), true);
  assert.equal(await page.evaluate(() => (window as any).regenerations), 1);
  const refusal = (await read("ai-debug/motion_remotion_composition-a8c3f22c.json")).lastCandidate;
  assert.equal(isRecoverableChatRefusal({ message: "chat_planning_refusal_response", diagnostics: { lastCandidate: refusal } }), true);
  assert.equal(isRecoverableChatRefusal({ message: "chat_planning_refusal_response", diagnostics: { lastCandidate: "I cannot help create harmful content." } }), false);
  results.push({ case: "saved-real-gemini-retry-menu", actualDomReplay: true, selectedRetries: 1, genericRefusalEligible: true });
  // The actual success-response variant has no aria-haspopup. Its trigger is
  // removed immediately when regeneration starts, before click() returns.
  const live = parse(await fs.readFile(path.join(output, "gemini-live-response.html"), "utf8")) as any;
  const direct = find(live, (node) => attr(node, "data-test-id") === "regenerate-button").at(-1);
  assert.ok(direct && !attr(direct, "aria-haspopup"));
  await page.setContent(`<style>gem-icon-button{display:inline-block;width:40px;height:40px}</style><user-query>Actual source task</user-query><model-response>${serializeOuter(direct)}</model-response>`);
  await page.locator('[data-test-id="regenerate-button"]').evaluate((node: HTMLElement) => { node.onclick = () => { (window as any).directRetries = 1; node.remove(); }; });
  assert.equal(await clickCurrentChatRetry(page), true, "Do not read attributes from a trigger that disappeared after the click");
  assert.equal(await page.evaluate(() => (window as any).directRetries), 1);
  results.push({ case: "actual-direct-regenerate-trigger-disappears", clickedOnce: true });
  await fs.writeFile(path.join(output, "real-data-chrome-results.json"), JSON.stringify({ at: new Date().toISOString(), executable: findNativeChrome(), version: browser.version(), visible: true, results }, null, 2));
  process.stdout.write(String(JSON.stringify(results)) + "\n");
} finally {
  await browser.close();
}
