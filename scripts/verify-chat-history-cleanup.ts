import assert from "node:assert/strict";
import { build } from "esbuild";
import { chromium } from "playwright";
import { mkdir, readFile, writeFile, rm } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { AiPlanningFallbackProvider as Provider } from "../src/types.ts";
import { CHAT_HISTORY_FIXTURE as F } from "./chatHistoryCleanupVerificationTexts.ts";
const output = path.resolve(`node_modules/.cache/chat-history-cleanup-${process.pid}.mjs`);
const browser = await chromium.launch({ headless: true });
let cases = 0;
try {
  const built = await build({
    entryPoints: ["src/server/services/chatHistoryCleanupService.ts"],
    bundle: true,
    platform: "node",
    format: "esm",
    packages: "external",
    write: false,
    plugins: [
      {
        name: "cleanup-timeouts",
        setup(builder) {
          builder.onLoad({ filter: /constants[\\/]chatHistoryCleanup\.ts$/ }, async (args) => ({ contents: (await readFile(args.path, "utf8")).replace("ACTION_TIMEOUT_MS: 15000", "ACTION_TIMEOUT_MS: 700").replace("VERIFY_TIMEOUT_MS: 30000", "VERIFY_TIMEOUT_MS: 1000").replace("POLL_MS: 200", "POLL_MS: 5"), loader: "ts" }));
        },
      },
    ],
  });
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, built.outputFiles[0].text);
  const { deleteProviderConversationHistory } = await import(pathToFileURL(output).href);
  for (const [name, provider] of [
    ["gemini", Provider.GeminiChat],
    ["grok", Provider.GrokChat],
    ["chatgpt", Provider.ChatGptUi],
  ] as const) {
    const modes = name === "gemini" ? ["success", "empty", "wrong", "stuck", "vanish"] : ["success", "empty", "nested", "wrong", "stuck", "vanish", "server-error", "body-error", "single"];
    for (const language of ["vi", "en"])
      for (const mode of modes) {
        const context = await browser.newContext();
        let remaining = mode === "empty" ? 0 : 1201;
        let mutations = 0;
        await context.route("**/*", async (route) => {
          if (route.request().isNavigationRequest()) return route.fulfill({ contentType: "text/html", body: F.HTML(name, mode, language) });
          mutations++;
          if (mode === "server-error") return route.fulfill({ status: 500, json: { error: "failed" } });
          if (mode === "body-error") return route.fulfill({ json: { success: false, error: "failed" } });
          remaining = 0;
          return route.fulfill({ json: { success: true } });
        });
        const page = await context.newPage();
        try {
          const action = deleteProviderConversationHistory(page, provider);
          if (["success", "empty", "nested"].includes(mode)) {
            await action;
            const events = await page.evaluate(() => (window as any).events);
            assert.deepEqual(events, name === "gemini" ? (mode === "empty" ? [] : ["bulk", "all", "confirm"]) : ["bulk", "confirm"]);
            if (name !== "gemini") {
              assert.equal(remaining, 0);
              assert.equal(mutations, 1);
            }
          } else {
            await assert.rejects(action);
            if (mode === "wrong") assert.equal(await page.evaluate(() => (window as any).events.includes("confirm")), false);
            if (["vanish", "wrong"].includes(mode)) assert.equal(mutations, 0);
          }
          cases++;
        } catch (error) {
          process.stderr.write(`${name}/${language}/${mode}: ${await page.locator("body").innerText()}\n`);
          throw error;
        } finally {
          await context.close();
        }
      }
  }
  const context = await browser.newContext();
  const page = await context.newPage();
  await assert.rejects(deleteProviderConversationHistory(page, Provider.DeepSeekChat), /unsupported/);
  await context.close();
  const integration = await readFile("src/server/services/chatUiPlanningService.ts", "utf8");
  assert.match(integration, /provider === AiPlanningFallbackProvider.GrokChat \? await getOrLaunchGrokBrowser/);
  assert.match(integration, /await manualCleanupFlights.get\(request.provider\)/);
  assert.doesNotMatch(integration, /initialConversationCount/);
  process.stdout.write(`${cases} cases. ${F.PASSED}`);
} finally {
  await browser.close();
  await rm(output, { force: true });
}
