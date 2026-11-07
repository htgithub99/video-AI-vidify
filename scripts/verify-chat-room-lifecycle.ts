import assert from "node:assert/strict";
import { build } from "esbuild";
import { readFile, mkdir, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";
import { parse, serializeOuter } from "parse5";
import { CHAT_ROOM_LIFECYCLE_VERIFICATION as V } from "./chatRoomLifecycleVerificationTexts.ts";
import { CHAT_ROOM_RECOVERY } from "../src/constants/chromeBackup.js";
import { VERIFICATION_VALUES as VT } from "./motionVerificationValues.ts";
import { AiPlanningFallbackProvider as P } from "../src/types.ts";
const deferred = () => {
  let finish!: () => void;
  const done = new Promise<void>((resolve) => (finish = resolve));
  return { done, finish };
};
const within = async <T>(work: Promise<T>, timeout = V.WAIT_MS): Promise<T> => {
  let timer: ReturnType<typeof setTimeout>;
  try {
    return await Promise.race([
      work,
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => reject(new Error(V.DEADLOCK)), timeout);
      }),
    ]);
  } finally {
    clearTimeout(timer!);
  }
};
const visits: string[] = [];
const server = createServer((request, response) => {
  visits.push(request.url!);
  response.setHeader(V.CONTENT_TYPE, V.HTML_TYPE);
  response.end(V.DOCUMENT);
});
const output = path.resolve(V.BUNDLE(process.pid));
const previousStorage = process.env.VIDIFY_STORAGE_DIR;
process.env.VIDIFY_STORAGE_DIR = path.resolve(V.STORAGE(process.pid));
let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
try {
  await new Promise<void>((resolve) => server.listen(0, V.HOST, resolve));
  const port = (server.address() as { port: number }).port;
  const bundled = await build({
    entryPoints: [V.SOURCE],
    bundle: true,
    platform: VT.NODE,
    format: VT.ESM,
    packages: VT.EXTERNAL,
    write: false,
    plugins: [
      {
        name: V.PLUGIN,
        setup(builder) {
          builder.onLoad({ filter: V.SOURCE_PATTERN }, async (args) => {
            const source = await readFile(args.path, VT.UTF8);
            assert.equal(source.split(V.HOOK).length, 2);
            return { loader: VT.TS, contents: source.replace(V.HOOK, V.INJECT) + V.ENTRY + "export { regenerateProviderError };" + V.SET_GENERATOR + V.GENERATOR + V.GENERATOR_END };
          });
        },
      },
    ],
  });
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, bundled.outputFiles[0].text);
  const service = await import(pathToFileURL(output).href);
  Object.assign(service.config, { UI_ACTION_BASE_MS: 5000, UI_ACTION_MAX_MS: 5000, SEND_CLICK_WAIT_MS: 100, ROOM_IDLE_STABLE_POLLS: 1, RESPONSE_POLL_MS: 5, SUBMISSION_POLL_MS: 5, HUMAN_ACTION_SETTLE_MS: 0, PROMPT_INPUT_SETTLE_MS: 0, PROMPT_SUBMIT_SETTLE_MS: 0, ROOM_REQUEST_COOLDOWN_MS: 0, 
    RESPONSE_STABLE_POLLS: 2, RESPONSE_STABLE_POLLS_MATCHED: 2, INVALID_RESPONSE_STABLE_POLLS: 4, SUBMISSION_VERIFY_TIMEOUT_MS: 50 });
  const originalIdleWait = service.config.ROOM_IDLE_WAIT_TIMEOUT_MS;
  service.config.ROOM_IDLE_WAIT_TIMEOUT_MS = V.IDLE_WAIT_MS;
  service.config.ROOM_IDLE_STABLE_POLLS = V.IDLE_POLLS;
  let busyRoom = false;
  let idleReads = 0;
  const slowPage = {
    locator: () => ({
      filter: () => ({
        count: async () => {
          idleReads++;
          await new Promise((resolve) => setTimeout(resolve, V.SLOW_READ_MS));
          return busyRoom ? 1 : 0;
        },
      }),
      evaluateAll: async () => [],
    }),
  };
  await within(service.waitForRoomIdle(slowPage, V.BUSY_SELECTOR, V.ANSWER_SELECTOR));
  assert.ok(idleReads < V.IDLE_POLLS);
  busyRoom = true;
  await assert.rejects(service.waitForRoomIdle(slowPage, V.BUSY_SELECTOR, V.ANSWER_SELECTOR));
  service.config.ROOM_IDLE_WAIT_TIMEOUT_MS = originalIdleWait;
  service.config.ROOM_IDLE_STABLE_POLLS = 1;
  browser = await chromium.launch({ channel: V.CHROME, headless: process.env.VIDIFY_VERIFY_CHROME_VISIBLE !== "1" });
  const context = await browser.newContext();
  await context.route(V.NETWORK, (route) => (new URL(route.request().url()).hostname === V.HOST ? route.continue() : route.abort()));
  const held = deferred(),
    entered = deferred();
  const fixture = {
    context,
    url: (worker: string) => V.URL(port, worker),
    hold: async (roomKey: string) => {
      if (roomKey.endsWith(V.WORKERS[0])) {
        entered.finish();
        await held.done;
      }
    },
  };
  (globalThis as any).__chatRoomLifecycle = fixture;
  service.installFixtureGenerator();
  const request = (workerId: string, index: number) => ({ provider: P.GeminiChat, projectId: V.PROJECT, workerId, artifactType: V.ARTIFACT, requestId: V.REQUEST(workerId, index), prompt: V.PROMPT(V.REQUEST(workerId, index)), closeRoomOnComplete: false, submission: { attempted: false, completed: false } });
  const firstRequest = request(V.WORKERS[0], 1);
  const first = service.generatePlanningWithChatUi(firstRequest);
  try {
    await within(entered.done);
    const rest = await within(Promise.all(V.WORKERS.slice(1).map((worker) => service.generatePlanningWithChatUi(request(worker, 1)))));
    assert.equal(rest.length, 2);
    assert.equal(firstRequest.submission.attempted, false);
  } finally {
    held.finish();
    await first;
  }
  fixture.hold = async () => undefined;
  for (const worker of V.WORKERS) {
    const next = request(worker, 2);
    const result = await service.generatePlanningWithChatUi(next);
    assert.equal(JSON.parse(result.text).requestId, next.requestId);
    const page = service.geminiRooms.get(service.getPlanningRoomKey(next));
    assert.equal(page.url(), V.URL(port, worker));
    assert.equal(await page.evaluate(() => (window as any).sendCount), 2);
    assert.equal(visits.filter((url) => url === new URL(V.URL(port, worker)).pathname).length, 1);
  }
  const current = request(V.WORKERS[0], 3);
  for (let reload = 1; reload <= 2; reload++) {
    await service.reloadChatPlanningRoom(current);
    const page = service.geminiRooms.get(service.getPlanningRoomKey(current));
    assert.equal(page.url(), V.URL(port, V.WORKERS[0]));
    assert.equal(visits.filter((url) => url === new URL(page.url()).pathname).length, reload + 1);
  }
  const transportRequest = () => ({ ...request(V.WORKERS[0], 4), prompt: V.PROMPT(V.REQUEST(V.WORKERS[0], 4)).padEnd(service.config.PROMPT_MESSAGE_LIMIT - 1, "x") });
  const page = service.geminiRooms.get(service.getPlanningRoomKey(current));
  await service.generatePlanningWithChatUi(transportRequest());
  assert.equal(await page.evaluate(() => (window as any).sendCount), 3);
  const prompts = await page.evaluate(() => (window as any).fixturePrompts as string[]);
  assert.ok(prompts[0].includes(service.config.CONTEXT_PART_ID(V.REQUEST(V.WORKERS[0], 4), 1)));
  assert.ok(prompts[1].includes(service.config.CONTEXT_PART_ID(V.REQUEST(V.WORKERS[0], 4), 2)));
  await service.generatePlanningWithChatUi(transportRequest());
  assert.equal(await page.evaluate(() => (window as any).sendCount), 4);
  await service.reloadChatPlanningRoom(current);
  await service.generatePlanningWithChatUi(transportRequest());
  assert.equal(await page.evaluate(() => (window as any).sendCount), 3);
  await service.closeChatPlanningRoom(current, true);
  assert.equal(page.isClosed(), true);
  assert.equal(service.geminiRooms.has(service.getPlanningRoomKey(current)), false);
  for (const artifactType of ["motion_remotion_composition", "cinematic-plan", "music-mixer-ranking"]) {
    const native = { ...request("native-" + artifactType, 1), artifactType };
    const recoveries: string[] = [];
    let generated = 0;
    service.providerGenerators[P.GeminiChat] = async (item: any) => {
      generated++;
      const room = await service.createRoom(context, V.URL(port, item.workerId), service.geminiRooms, service.getPlanningRoomKey(item), item.signal);
      await room.setContent('<user-query>Current request</user-query><model-response><div class="answer">Sorry, something went wrong. Please try your request again.</div><button onclick="window.retryClicks=(window.retryClicks||0)+1;document.querySelector(\'.answer\').textContent=JSON.stringify(window.result)">Thử lại</button></model-response>');
      await room.evaluate(
        (value: any) => {
          (window as any).result = value;
        },
        { artifactType: item.artifactType, requestId: item.requestId, ready: true },
      );
      Object.assign(item.submission, { attempted: true, completed: true, pending: { page: room, url: room.url(), prompt: item.prompt, initialCount: 0, initialResponseSnapshots: [], expectedSceneIds: [], artifactType: item.artifactType, requestId: item.requestId, responseSelector: ".answer", busySelector: ".busy" } });
      throw new Error(service.config.PROVIDER_ERROR_RESPONSE_ERROR);
    };
    const result = await within(service.generatePlanningWithChatUi({ ...native, onRecovery: (line: string) => recoveries.push(line) }));
    assert.equal(JSON.parse(result.text).ready, true);
    assert.equal(generated, 1, "A native Retry success must not resend the user request");
    assert.equal(recoveries.length, 1);
    assert.match(recoveries[0], /bấm nút/u);
    assert.equal(await service.geminiRooms.get(service.getPlanningRoomKey(native)).evaluate(() => (window as any).retryClicks), 1);
    await service.closeChatPlanningRoom(native, true);
  }
  assert.equal(CHAT_ROOM_RECOVERY.REGENERATE_LIMIT, 5);
  for (const successAt of [5, 6]) {
    const retryPage = await context.newPage();
    await retryPage.setContent(`<model-response><div class="answer">Sorry, something went wrong. Please try your request again.</div><button data-test-id="regenerate-button" aria-haspopup="menu" aria-controls="retry-menu">Khôi phục</button></model-response>`);
    await retryPage.evaluate(({ successAt, artifactType }) => {
      (window as any).retryClicks = 0;
      (document.querySelector('button') as HTMLElement).onclick = () => {
        const menu = document.createElement('div'); menu.id = 'retry-menu'; menu.setAttribute('role', 'menu');
        const item = document.createElement('button'); item.setAttribute('role', 'menuitem'); item.textContent = 'Thử lại'; menu.append(item); document.body.append(menu);
        item.onclick = () => {
          const clicks = ++(window as any).retryClicks; menu.remove();
          document.querySelector('.answer')!.textContent = clicks >= successAt ? JSON.stringify({ artifactType, requestId: 'retry-limit', ready: true }) : 'Sorry, something went wrong. Please try your request again. ' + clicks;
        };
      };
    }, { successAt, artifactType: V.ARTIFACT });
    const work = service.regenerateProviderError(retryPage, '.answer', '.busy', V.ARTIFACT, 'retry-limit', AbortSignal.timeout(10000), async () => { throw new Error(service.config.PROVIDER_ERROR_RESPONSE_ERROR); });
    if (successAt === 5) assert.equal(JSON.parse(await within(work)).ready, true);
    else await assert.rejects(within(work), { message: service.config.PROVIDER_ERROR_RESPONSE_ERROR });
    assert.equal(await retryPage.evaluate(() => (window as any).retryClicks), 5, 'The circular recovery menu is clicked at most five times');
    await retryPage.close();
  }
  process.stdout.write("PASS: real circular Gemini recovery menu succeeds on click five, never clicks a sixth time.\n");
  const bounded = request("bounded-shared-recovery", 1);
  if (process.env.VIDIFY_VERIFY_REAL_CASES === "1") {
    const base = "scratch/motion-real-recovery-20261105/baseline/output/motion-video/ai-debug/";
    const source: any = parse(await readFile(base + "motion_remotion_composition-a8c3f22c.dom.txt", "utf8"));
    const find = (node: any, test: (value: any) => boolean): any[] => [...(test(node) ? [node] : []), ...(node.childNodes || []).flatMap((child: any) => find(child, test))];
    const text = (node: any): string => (node.nodeName === "#text" ? node.value : (node.childNodes || []).map(text).join(""));
    const turn = find(source, (node) => node.tagName === "model-response").at(-1);
    const menu = find(source, (node) => node.attrs?.some((entry: any) => entry.name === "role" && entry.value === "menu") && /Thử lại/.test(text(node))).at(-1);
    assert.ok(turn && menu);
    const realFailure = JSON.parse(await readFile(base + "motion_remotion_composition-a8c3f22c.json", "utf8"));
    const native = { ...request("real-refusal-menu", 1), artifactType: "motion_remotion_composition" };
    const recoveries: string[] = [];
    let generated = 0;
    service.providerGenerators[P.GeminiChat] = async (item: any) => {
      generated++;
      const room = await service.createRoom(context, V.URL(port, item.workerId), service.geminiRooms, service.getPlanningRoomKey(item), item.signal);
      await room.setContent(`<style>model-response{display:block}gem-icon-button{display:inline-block;position:relative;width:40px;height:40px}button{position:static!important}</style><user-query>Actual source request</user-query>${serializeOuter(turn)}`);
      await room.evaluate(
        ({ menuHtml, response }: any) => {
          const trigger = document.querySelector('[data-test-id="regenerate-button"]') as HTMLElement;
          trigger.onclick = () => {
            const overlay = document.createElement("div");
            overlay.className = "cdk-overlay-pane";
            overlay.innerHTML = menuHtml;
            overlay.querySelector('[role="menu"]')!.id = trigger.getAttribute("aria-controls")!;
            document.body.append(overlay);
            for (const button of overlay.querySelectorAll('button, [role="menuitem"]'))
              if (button.textContent?.trim().endsWith("Thử lại"))
                (button as HTMLElement).onclick = () => {
                  document.querySelector(".model-response-text")!.textContent = JSON.stringify(response);
                  overlay.remove();
                };
          };
        },
        { menuHtml: serializeOuter(menu), response: { artifactType: item.artifactType, requestId: item.requestId, ready: true } },
      );
      Object.assign(item.submission, { attempted: true, completed: true, pending: { page: room, url: room.url(), prompt: item.prompt, initialCount: 0, initialResponseSnapshots: [], expectedSceneIds: [], artifactType: item.artifactType, requestId: item.requestId, responseSelector: ".model-response-text", busySelector: ".busy" } });
      throw Object.assign(new Error(service.config.REFUSAL_RESPONSE_ERROR), { diagnostics: { lastCandidate: realFailure.lastCandidate } });
    };
    const result = await within(service.generatePlanningWithChatUi({ ...native, onRecovery: (line: string) => recoveries.push(line) }));
    assert.equal(JSON.parse(result.text).ready, true);
    assert.equal(generated, 1, "The actual refusal branch must click native menu Retry without resubmitting the prompt");
    assert.equal(recoveries.filter((line) => /bấm nút/u.test(line)).length, 1);
    process.stdout.write(String("PASS: original real refusal and Gemini menu replay through the product recovery branch; one generation, native Retry, no duplicate submit.") + "\n");
    await service.closeChatPlanningRoom(native, true);
  }
  const single = { ...request("single-generation", 1), artifactType: "motion_remotion_composition", oneGeneration: true };
  let singleCalls = 0;
  service.providerGenerators[P.GeminiChat] = async (item: any) => {
    singleCalls++;
    const room = await service.createRoom(context, V.URL(port, item.workerId), service.geminiRooms, service.getPlanningRoomKey(item), item.signal);
    await room.setContent('<user-query>Current request</user-query><model-response><div class="answer">Tôi chỉ là một mô hình ngôn ngữ nên không thể thực hiện điều đó.</div><button onclick="window.retryClicks=(window.retryClicks||0)+1;if(window.retryClicks>=5){document.querySelector(\'.answer\').textContent=JSON.stringify(window.result)}else{document.querySelector(\'.answer\').textContent=\'Tôi chỉ là một mô hình ngôn ngữ nên không thể thực hiện điều đó. \'+window.retryClicks}">Thử lại</button></model-response>');
    await room.evaluate((value: any) => { (window as any).result = value; }, { artifactType: item.artifactType, requestId: item.requestId, ready: true });
    Object.assign(item.submission, { attempted: true, completed: true, pending: { page: room, url: room.url(), prompt: item.prompt, initialCount: 0, initialResponseSnapshots: [], expectedSceneIds: [], artifactType: item.artifactType, requestId: item.requestId, responseSelector: ".answer", busySelector: ".busy" } });
    throw Object.assign(new Error(service.config.REFUSAL_RESPONSE_ERROR), { diagnostics: { lastCandidate: "Tôi chỉ là một mô hình ngôn ngữ nên không thể thực hiện điều đó." } });
  };
  const singleResult = await within(service.generatePlanningWithChatUi(single));
  assert.equal(JSON.parse(singleResult.text).ready, true);
  assert.equal(singleCalls, 1, "Single-generation scenes must click native Retry up to five times before reloading");
  assert.equal(await service.geminiRooms.get(service.getPlanningRoomKey(single)).evaluate(() => (window as any).retryClicks || 0), CHAT_ROOM_RECOVERY.REGENERATE_LIMIT);
  await service.closeChatPlanningRoom(single, true);
  const boundedRooms: any[] = [];
  const recoveryLines: string[] = [];
  let restored = 0;
  service.providerGenerators[P.GeminiChat] = async (item: any) => {
    assert.equal(item.prompt, bounded.prompt, "A new room must receive the full context even when another worker already switched Chrome");
    const room = await service.createRoom(context, V.URL(port, item.workerId), service.geminiRooms, service.getPlanningRoomKey(item), item.signal);
    boundedRooms.push(room);
    if (boundedRooms.length > CHAT_ROOM_RECOVERY.SAME_ROOM_RETRIES + 1) return JSON.stringify({ artifactType: item.artifactType, requestId: item.requestId, ready: true });
    await room.setContent(
      "<user-query>Current request</user-query><model-response><div class=\"answer\">Sorry, something went wrong. Please try your request again.</div><button onclick=\"window.retryClicks=(window.retryClicks||0)+1;document.querySelector('.answer').textContent='Sorry, something went wrong. Please try your request again. '+window.retryClicks;this.insertAdjacentHTML('afterend','<div class=busy>Generating</div>');setTimeout(()=>document.querySelector('.busy').remove(),10)\">Thử lại</button></model-response>",
    );
    Object.assign(item.submission, { attempted: true, completed: true, pending: { page: room, url: room.url(), prompt: item.prompt, initialCount: 0, initialResponseSnapshots: [], expectedSceneIds: [], artifactType: item.artifactType, requestId: item.requestId, responseSelector: ".answer", busySelector: ".busy" } });
    throw new Error(service.config.PROVIDER_ERROR_RESPONSE_ERROR);
  };
  await within(
    service.generatePlanningWithChatUi({
      ...bounded,
      prompt: "Correction requiring the previous room context",
      onRecovery: (line: string) => recoveryLines.push(line),
      restoreContext: () => {
        restored++;
        return bounded.prompt;
      },
    }),
    60000,
  );
  const finalRoom = CHAT_ROOM_RECOVERY.SAME_ROOM_RETRIES + 1;
  assert.equal(boundedRooms.length, finalRoom + 1);
  assert.equal(new Set(boundedRooms.slice(0, finalRoom)).size, 1, "All same-room retries must use the original physical room");
  assert.notEqual(boundedRooms[finalRoom], boundedRooms[0]);
  assert.equal(boundedRooms[0].isClosed(), true);
  assert.equal(restored, finalRoom + 1);
  assert.equal(recoveryLines.filter((line) => /bấm nút/u.test(line)).length, finalRoom * CHAT_ROOM_RECOVERY.REGENERATE_LIMIT);
  assert.equal(recoveryLines.filter((line) => /room hiện tại/u.test(line)).length, CHAT_ROOM_RECOVERY.SAME_ROOM_RETRIES);
  assert.equal(recoveryLines.filter((line) => /mở room mới/u.test(line)).length, 1);
  await service.closeChatPlanningRoom(bounded, true);
  const failedRoom = {
    isClosed: () => false,
    close: async () => {
      throw new Error("room close failed");
    },
  };
  service.geminiRooms.set(service.getPlanningRoomKey(current), failedRoom);
  await assert.rejects(service.closeChatPlanningRoom(current, true), /room close failed/);
  assert.equal(service.geminiRooms.get(service.getPlanningRoomKey(current)), failedRoom);
  service.geminiRooms.delete(service.getPlanningRoomKey(current));
  const failedNavigation = {
    ...failedRoom,
    goto: async () => {
      throw new Error("room navigation failed");
    },
  };
  const failedContext = { pages: () => [], newPage: async () => failedNavigation };
  await assert.rejects(service.createRoom(failedContext, V.URL(port, V.WORKERS[0]), service.geminiRooms, service.getPlanningRoomKey(current)), /room navigation failed/);
  assert.equal(service.geminiRooms.get(service.getPlanningRoomKey(current)), failedNavigation);
  service.geminiRooms.delete(service.getPlanningRoomKey(current));
  process.stdout.write(V.PASSED);
} catch (error) {
  throw new Error(error instanceof Error ? error.stack : String(error));
} finally {
  await browser?.close();
  await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  await rm(output, { force: true });
  delete (globalThis as any).__chatRoomLifecycle;
  if (previousStorage === undefined) delete process.env.VIDIFY_STORAGE_DIR;
  else process.env.VIDIFY_STORAGE_DIR = previousStorage;
}
process.exit(0);
