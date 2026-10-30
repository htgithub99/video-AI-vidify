import assert from "node:assert/strict";
import { build } from "esbuild";
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";
import { isFinalChatResponseError } from "../src/server/services/chatSubmissionRecovery.js";
const source = path.resolve("src/server/services/chatUiPlanningService.ts");
const output = path.resolve(`node_modules/.cache/chat-usage-${process.pid}.mjs`);
let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
try {
  const bundle = await build({ stdin: { contents: (await fs.readFile(source, "utf8")) + '\nexport {waitForSendButtonReady}; export {CINEMATIC_CHAT_PLANNING_CONFIG as config} from "../../constants/cinematicConstants.js";', resolveDir: path.dirname(source), loader: "ts" }, bundle: true, platform: "node", format: "esm", packages: "external", write: false });
  await fs.mkdir(path.dirname(output), { recursive: true });
  await fs.writeFile(output, bundle.outputFiles[0].text);
  const service = await import(pathToFileURL(output).href);
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.route("**/*", (route) => route.abort());
  for (const markup of ["<main><div>Chúng tôi đang kiểm tra nhanh để ChatGPT luôn ổn định. Thử lại trong 17 phút.</div><button disabled>Gửi</button></main>", '<main><aside role="status">A quick check to keep ChatGPT stable. Try again in 17 minutes.</aside><button disabled>Send</button></main>']) {
    await page.setContent(markup);
    await assert.rejects(service.waitForSendButtonReady([page.getByRole("button")], 1000, undefined, page, service.config.CHATGPT_BUSY_SELECTOR), (error: Error) => error.message === service.config.CHATGPT_RATE_LIMIT_ERROR && isFinalChatResponseError(error));
  }
  await page.setContent("<main><div>Đã tạo phân cảnh.</div><button>Gửi</button></main>");
  assert.ok(await service.waitForSendButtonReady([page.getByRole("button")], 1000, undefined, page, service.config.CHATGPT_BUSY_SELECTOR));
  process.stdout.write("ChatGPT usage limits: inline Vietnamese notice, status notice, terminal classification and ordinary send readiness passed on local HTML.\n");
} finally {
  await browser?.close();
  await fs.rm(output, { force: true });
}
