import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID, createHash } from "node:crypto";
import { parse } from "parse5";

const out = path.resolve("scratch/motion-real-recovery-20261105");
// Only test checkpoints/diagnostics use this directory. The existing signed-in
// Chrome profile is opened by the normal product browser launcher.
process.env.VIDIFY_STORAGE_DIR = path.join(out, "live-storage");
delete process.env.APP_DATA_DIR;
const { generatePlanningWithChatUi, getChatPlanningRoom, closeChatPlanningRoom } = await import("../src/server/services/chatUiPlanningService.ts");
const { closeAppBrowserAfterTask } = await import("../src/server/services/imageGeneratorService.ts");
const { normalizeFirstSceneComposition } = await import("../src/lib/motionSceneComposition.ts");
const { compositionRepairDraft } = await import("../src/lib/motionCompositionRepair.ts");
const { compositionFrameSvg } = await import("../src/lib/motionSceneComposition.ts");
const { normalizeMotionRenderBehavior } = await import("../src/lib/motionRenderBehavior.ts");
const { AiPlanningFallbackProvider } = await import("../src/types.ts");
const { parse: parseHtml } = { parse };
const dom: any = parseHtml(await fs.readFile(path.join(out, "baseline/output/motion-video/ai-debug/motion_remotion_composition-a8c3f22c.dom.txt"), "utf8"));
const text = (node: any): string => node.nodeName === "#text" ? node.value : (node.childNodes || []).map(text).join("");
const find = (node: any, test: (item: any) => boolean): any[] => [...(test(node) ? [node] : []), ...(node.childNodes || []).flatMap((child: any) => find(child, test))];
const query = find(dom, (node) => node.tagName === "user-query").at(-1);
const content = find(query, (node) => node.attrs?.some((attr: any) => attr.name === "class" && attr.value.split(/\s+/).includes("query-text"))).at(-1) || query;
const originalPrompt = text(content).trim();
if (!originalPrompt.includes("motion_remotion_composition-a8c3f22c")) throw new Error("Saved full source prompt missing request identity");
const requestId = "motion_remotion_composition-qa-" + randomUUID();
const prompt = originalPrompt.replaceAll("motion_remotion_composition-a8c3f22c", requestId);
await fs.writeFile(path.join(out, "live-source-prompt.txt"), prompt);
const manifest = JSON.parse(await fs.readFile(path.join(out, "baseline/manifest.json"), "utf8"));
const script = JSON.parse(await fs.readFile(path.join(out, `baseline/output/motion-video/story-jobs/${manifest.jobId}.json`), "utf8")).job.result;
const scene: any = Object.values(script.gen.remotion.scenes).flat().find((item: any) => item.id === "c3_event_320edfaa76a9:1");
const events: any[] = [];
const request: any = {
  provider: AiPlanningFallbackProvider.GeminiChat, projectId: "motion-real-qa-" + randomUUID(), workerId: "motion-scene-first",
  model: "gemini-flash::medium", artifactType: "motion_remotion_composition", requestId, prompt,
  restoreContext: () => prompt, chromeHeadless: false, closeRoomOnComplete: false,
  submission: { attempted: false, completed: false }, signal: AbortSignal.timeout(10 * 60 * 1000),
  onRecovery: (line: string) => { events.push({ at: new Date().toISOString(), line }); process.stdout.write(String(line) + "\n"); },
};
const report: any = { at: new Date().toISOString(), liveGemini: true, source: "a8c3f22c original real prompt", sourceSha256: createHash("sha256").update(originalPrompt).digest("hex"), requestId, promptChars: prompt.length, events };
try {
  const response = await generatePlanningWithChatUi(request);
  await fs.writeFile(path.join(out, "live-response.json"), response.text);
  const raw = JSON.parse(response.text);
  const built = normalizeFirstSceneComposition(compositionRepairDraft(raw), "qa-live", "qa-live", scene.purpose, scene.nodes, new Set(scene.nodes.map((node: any) => node.entityId).filter(Boolean)), 1280, 720);
  await fs.writeFile(path.join(out, "live-built.json"), JSON.stringify(built, null, 2));
  const page = getChatPlanningRoom(request)!;
  report.chromeVersion = page.context().browser()?.version();
  report.url = page.url();
  const preview = await page.context().newPage();
  for (const seconds of [0, 1, 2]) {
    const svg = compositionFrameSvg(built.asset, built.composition, seconds, normalizeMotionRenderBehavior(script.gen.remotion.renderBehavior || script.gen.renderBehavior, script.gen.characterMotion), new Set(), script.gen.remotion.settings.profileId);
    await preview.setContent(`<style>html,body{margin:0}</style>${svg}`);
    await preview.screenshot({ path: path.join(out, `live-scene-${seconds}.png`) });
  }
  await preview.close();
  report.receivedValidComposition = true;
  process.stdout.write(String(JSON.stringify({ liveGemini: true, validComposition: true, requestId, events: events.length })) + "\n");
} catch (error) {
  report.error = String(error);
  const page = getChatPlanningRoom(request);
  if (page && !page.isClosed()) {
    report.pageOrigin = new URL(page.url()).origin;
    report.pagePath = new URL(page.url()).pathname;
    await page.screenshot({ path: path.join(out, "live-failure.png") }).catch(() => undefined);
  }
  process.stderr.write(String(report.error) + "\n");
  process.exitCode = 1;
} finally {
  await fs.writeFile(path.join(out, "gemini-live-results.json"), JSON.stringify(report, null, 2));
  await closeChatPlanningRoom(request, true).catch(() => undefined);
  await closeAppBrowserAfterTask(true);
}
