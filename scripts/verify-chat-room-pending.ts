import assert from "node:assert/strict";
import { build } from "esbuild";
import { createServer } from "node:http";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";
import { CHAT_ROOM_LIFECYCLE_VERIFICATION as V } from "./chatRoomLifecycleVerificationTexts.js";
import { MOTION_AI_RECOVERY as AIR } from "../src/constants/motionAiRecovery.js";
import { CHAT_ROOM_RECOVERY } from "../src/constants/chromeBackup.js";
import { AiPlanningFallbackProvider as P } from "../src/types.js";
const interactive = process.argv.includes("--interactive");
const output = path.resolve(`node_modules/.cache/chat-room-pending-${process.pid}.mjs`);
const storage = path.resolve(`scratch/chat-room-pending-${process.pid}`);
const previous = process.env.VIDIFY_STORAGE_DIR;
process.env.VIDIFY_STORAGE_DIR = storage;
const deferred = () => {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
};
const start = deferred(),
  complete = deferred(),
  finish = deferred();
let stage = "ready",
  report = "Sẵn sàng kiểm thử.";
const server = createServer((request, response) => {
  response.setHeader("Content-Type", "text/html; charset=utf-8");
  if (request.url === "/status") {
    response.setHeader("Content-Type", "application/json");
    response.end(JSON.stringify({ stage, report }));
    return;
  }
  if (request.url === "/start") start.resolve();
  if (request.url === "/complete") complete.resolve();
  if (request.url === "/finish") finish.resolve();
  response.end(
    '<!DOCTYPE html><html lang="vi"><head><meta charset="utf-8"><title>Vidify - Kiểm thử room Chrome</title><style>body{font:20px system-ui;background:#14101e;color:#eee;max-width:1080px;margin:48px auto}button{padding:16px 24px;margin:10px;background:#7139c9;color:white;border:0;border-radius:10px;font-size:18px}pre{white-space:pre-wrap;background:#231d30;padding:24px;border-radius:12px}.busy{color:#e8b85c}h1{font-size:30px}</style></head><body><h1>Kiểm thử room dựng cảnh trên Chrome</h1><p>Chạy luồng phục hồi thật với phản hồi AI mô phỏng cục bộ.</p><div id="controls"></div><pre id="status">Sẵn sàng kiểm thử.</pre><script>let stage;setInterval(async()=>{const state=await fetch("/status").then(r=>r.json());document.querySelector("#status").textContent=state.report;if(stage===state.stage)return;stage=state.stage;const action={ready:["start","Bắt đầu kiểm tra"],pending:["complete","Hoàn tất phản hồi"],passed:["finish","Kết thúc kiểm thử"]}[stage];const root=document.querySelector("#controls");root.replaceChildren();if(action){const button=document.createElement("button");button.textContent=action[1];button.onclick=()=>{fetch("/"+action[0]);button.disabled=true};root.append(button)}},250);</script></body></html>',
  );
});
let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
try {
  await new Promise<void>((resolve) => server.listen(0, V.HOST, resolve));
  const url = `http://${V.HOST}:${(server.address() as { port: number }).port}/app/room`;
  const bundled = await build({
    entryPoints: [V.SOURCE],
    bundle: true,
    platform: "node",
    format: "esm",
    packages: "external",
    write: false,
    plugins: [
      {
        name: "pending-room-fixture",
        setup(builder) {
          builder.onLoad({ filter: V.SOURCE_PATTERN }, async (args) => ({ loader: "ts", contents: (await readFile(args.path, "utf8")) + V.ENTRY + "export { cancelGlobalBrowserCleanup } from './imageGeneratorService.js';" }));
        },
      },
    ],
  });
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, bundled.outputFiles[0].text);
  const service = await import(pathToFileURL(output).href);
  Object.assign(service.config, { ROOM_REQUEST_COOLDOWN_MS: 0, RESPONSE_TIMEOUT_MS: 100, RESPONSE_MAX_TIMEOUT_MS: 350, RESPONSE_ACTIVITY_GRACE_MS: 100, RESPONSE_POLL_MS: 10, RESPONSE_STABLE_POLLS: 1, RESPONSE_STABLE_POLLS_MATCHED: 1, INVALID_RESPONSE_STABLE_POLLS: 2 });
  browser = await chromium.launch({ channel: V.CHROME, headless: !interactive });
  const context = await browser.newContext();
  const request: any = { provider: P.GeminiChat, projectId: "pending-room", workerId: "scene-first", prompt: "Build a scene", requestId: "scene-1", artifactType: "motion-html-scene", oneGeneration: true, submission: { attempted: false, completed: false } };
  const key = service.getPlanningRoomKey(request);
  const page = await service.createRoom(context, url, service.geminiRooms, key);
  if (interactive) {
    process.stdout.write(`CHROME_READY ${url}\n`);
    await start.promise;
  }
  stage = "running";
  report = "Đang gây lỗi và kiểm tra retry của lượt hiện tại…";
  let generations = 0,
    reloads = 0,
    retried = 0;
  page.on("framenavigated", (frame) => {
    if (frame === page.mainFrame()) reloads++;
  });
  service.providerGenerators[P.GeminiChat] = async (item: any) => {
    generations++;
    assert.equal(await service.createRoom(context, url, service.geminiRooms, key), page);
    await page.evaluate((message: string) => {
      document.querySelector("button")?.remove();
      document.querySelector("#status")!.textContent = "Đang thử lại lượt lỗi. Sau đó giữ nguyên room để chờ AI trả lời.";
      document.body.insertAdjacentHTML("beforeend", '<user-query>Yêu cầu dựng cảnh hiện tại</user-query><model-response><div class="answer"></div><button id="native-retry" data-test-id="regenerate-button">Thử lại</button></model-response>');
      document.querySelector(".answer")!.textContent = message;
      document.querySelector<HTMLButtonElement>("#native-retry")!.onclick = () => {
        document.querySelector("#native-retry")!.setAttribute("disabled", "true");
        document.body.insertAdjacentHTML("beforeend", '<div role="alert">Something went wrong. Please try again.</div><div class="busy">AI đang xử lý — chưa có kết quả hoàn tất.</div>');
      };
    }, V.HTML_SERVICE_ERROR);
    Object.assign(item.submission, { attempted: true, completed: true, pending: { page, url, prompt: item.prompt, initialCount: 0, initialResponseSnapshots: [], expectedSceneIds: [], artifactType: item.artifactType, requestId: item.requestId, responseSelector: ".answer", busySelector: ".busy" } });
    throw new Error(service.config.PROVIDER_ERROR_RESPONSE_ERROR);
  };
  await assert.rejects(
    service.generatePlanningWithChatUi({
      ...request,
      onRecovery: () => {
        retried++;
      },
    }),
    (error: any) => !!error[AIR.UNCERTAIN_FLAG] && !!error[CHAT_ROOM_RECOVERY.COMPLETE],
  );
  assert.equal(retried, 1);
  assert.equal(request.submission.completed, false);
  assert.equal(request.submission.pending.retryClicks, 1);
  assert.equal(request.submission.pending.recoveryAttempt, 0);
  assert.equal(reloads, 0);
  assert.equal(generations, 1);
  assert.equal(context.pages().length, 1);
  const controller = new AbortController();
  request.submission.pending.page = undefined;
  request.submission.pending.url = new URL("/app", url).href;
  request.submission.pending.recoveryAttempt = 1;
  const timer = setTimeout(() => controller.abort(AIR.READINESS_TIMEOUT_REASON), 30);
  await assert.rejects(service.generatePlanningWithChatUi({ ...request, signal: controller.signal }));
  clearTimeout(timer);
  assert.equal(service.geminiRooms.get(key), page);
  assert.equal(page.isClosed(), false);
  assert.equal(reloads, 0);
  const html = V.HTML_RESPONSE(request.artifactType, request.requestId);
  report = "ĐÃ KIỂM TRA: Retry 1 lần; reload 0; room mới 0; gửi lại 0.\nĐã hết hạn đọc nhưng AI vẫn đang chạy: giữ nguyên room và yêu cầu.\nĐã giả lập watchdog hết hạn: room vẫn được giữ.\nBấm Hoàn tất phản hồi để kiểm tra đọc tiếp đúng yêu cầu cũ.";
  stage = "pending";
  if (interactive) {
    process.stdout.write("CHROME_PENDING: waiting for manual completion\n");
    await complete.promise;
  }
  await page.evaluate((value: string) => {
    document.querySelector("#status")!.textContent = "ĐÃ KIỂM TRA: Retry 1 lần; reload 0; room mới 0; gửi lại 0.\nĐã hết hạn đọc nhưng AI vẫn đang chạy: giữ nguyên room và yêu cầu.\nĐã giả lập watchdog hết hạn: room vẫn được giữ.\nBấm Hoàn tất phản hồi để kiểm tra đọc tiếp đúng yêu cầu cũ.";
    document.querySelector(".answer")!.textContent = value;
    document.querySelector(".busy")!.remove();
  }, html);
  const result = await service.resumeChatPlanningResponse(request);
  assert.equal(result.text, html);
  assert.equal(request.submission.completed, true);
  assert.equal(service.geminiRooms.get(key), page);
  assert.equal(generations, 1);
  assert.equal(reloads, 0);
  assert.equal(context.pages().length, 1);
  request.requestId = "scene-2";
  request.submission = { attempted: false, completed: false };
  service.providerGenerators[P.GeminiChat] = async (item: any) => {
    assert.equal(await service.createRoom(context, url, service.geminiRooms, key), page);
    return V.HTML_RESPONSE(item.artifactType, item.requestId);
  };
  await service.generatePlanningWithChatUi(request);
  assert.equal(service.geminiRooms.get(key), page);
  assert.equal(reloads, 0);
  assert.equal(context.pages().length, 1);
  Object.assign(service.config, { RESPONSE_TIMEOUT_MS: 5000, RESPONSE_MAX_TIMEOUT_MS: 10000, RESPONSE_ACTIVITY_GRACE_MS: 5000 });
  const sequence: string[] = [];
  let attempts = 0;
  const physicalRooms: any[] = [];
  request.requestId = "scene-3";
  request.submission = { attempted: false, completed: false };
  service.providerGenerators[P.GeminiChat] = async (item: any) => {
    const room = await service.createRoom(context, url, service.geminiRooms, key);
    physicalRooms.push(room);
    if (++attempts > 3) return V.HTML_RESPONSE(item.artifactType, item.requestId);
    await room.setContent(
      "<model-response><div class=\"answer\">Sorry, something went wrong. Please try your request again.</div><button data-test-id=\"regenerate-button\" onclick=\"window.retryClicks=(window.retryClicks||0)+1;document.querySelector('.answer').textContent='Sorry, something went wrong. Please try your request again. '+window.retryClicks;this.insertAdjacentHTML('afterend','<div class=busy>Generating</div>');setTimeout(()=>document.querySelector('.busy').remove(),20)\">Thử lại</button></model-response>",
    );
    Object.assign(item.submission, { attempted: true, completed: true, pending: { page: room, url, prompt: item.prompt, initialCount: 0, initialResponseSnapshots: [], expectedSceneIds: [], artifactType: item.artifactType, requestId: item.requestId, responseSelector: ".answer", busySelector: ".busy" } });
    throw new Error(service.config.PROVIDER_ERROR_RESPONSE_ERROR);
  };
  stage = "running";
  report = "Đang kiểm tra lỗi kéo dài: Retry 5 lần → reload cùng room 2 lần → tạo room mới.";
  await service.generatePlanningWithChatUi({ ...request, onRecovery: (line: string) => sequence.push(line) });
  assert.equal(sequence.filter((line) => line === CHAT_ROOM_RECOVERY.CLICK_LOG).length, 5);
  assert.equal(sequence.filter((line) => line === CHAT_ROOM_RECOVERY.RETRY_LOG(1) || line === CHAT_ROOM_RECOVERY.RETRY_LOG(2)).length, 2);
  assert.equal(sequence.filter((line) => line === CHAT_ROOM_RECOVERY.REPLACE_LOG).length, 1);
  assert.equal(sequence.indexOf(CHAT_ROOM_RECOVERY.RETRY_LOG(1)), 5);
  assert.equal(sequence.indexOf(CHAT_ROOM_RECOVERY.REPLACE_LOG), 7);
  assert.equal(new Set(physicalRooms.slice(0, 3)).size, 1);
  assert.notEqual(physicalRooms[3], physicalRooms[0]);
  assert.equal(context.pages().length, 1);
  stage = "passed";
  report =
    "PASS — CÁC KIỂM TRA ĐỀU ĐẠT\n\n✓ AI đang chạy: không reload, không mở tab, không gửi trùng.\n✓ Sau retry bị quá hạn đọc: giữ yêu cầu để đọc tiếp.\n✓ Watchdog hết hạn: giữ nguyên room.\n✓ Hoàn tất phản hồi: đọc đúng kết quả của yêu cầu cũ.\n✓ Cảnh tiếp theo: dùng lại cùng room và URL.\n✓ Lỗi kéo dài: Retry 5 → reload cùng room 2 → tạo room mới 1.\n\nTrong khi chờ: room 1 | reload 0 | gửi trùng 0\nCác số liệu đã được assert trên luồng phục hồi thật.";
  process.stdout.write("PASS: pending retry, stale alert while busy, timeout preservation, resumed response and subsequent scene in the same Chrome room.\n");
  if (interactive) await finish.promise;
  service.cancelGlobalBrowserCleanup();
} finally {
  await browser?.close();
  server.close();
  await rm(output, { force: true });
  await rm(storage, { recursive: true, force: true });
  if (previous === undefined) delete process.env.VIDIFY_STORAGE_DIR;
  else process.env.VIDIFY_STORAGE_DIR = previous;
}
