import assert from "node:assert/strict";
import { createRequire } from "node:module";
import vm from "node:vm";
import { build } from "esbuild";
import { AiPlanningFallbackProvider } from "../src/types.ts";
import { CINEMATIC_CHAT_PLANNING_CONFIG } from "../src/constants/index.ts";

const deferred = <T>() => {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};

// Execute the real planning service with simulated browser timing. No Chrome or
// network access is needed to reproduce cancellation during launch and retries.
const bundled = await build({
  entryPoints: ["src/server/services/chatUiPlanningService.ts"],
  bundle: true, platform: "node", format: "cjs", packages: "external", write: false,
  logOverride: { "empty-import-meta": "silent" },
  plugins: [{
    name: "simulated-browser",
    setup(builder) {
      builder.onLoad({ filter: /imageGeneratorService\.ts$/ }, () => ({ contents: `
        export class SimpleMutex {
          tail = Promise.resolve();
          async acquire() {
            const previous = this.tail;
            let release;
            this.tail = new Promise(resolve => { release = resolve; });
            await previous;
            return release;
          }
        }
        export const getOrLaunchGlobalBrowser = (...args) => globalThis.browserMocks.launch(...args);
        export const getOrLaunchGrokBrowser = (...args) => globalThis.browserMocks.launch(...args);
        export const closeAppBrowserAfterTask = () => globalThis.browserMocks.closeBrowser();
        export const closeOwnedGrokBrowserIfIdle = async () => true;
        export const scheduleGlobalBrowserCleanup = () => {};
      ` }));
      builder.onLoad({ filter: /musicDiagnosticService\.ts$/ }, () => ({ contents: `
        export const writeMusicDiagnostic = async () => {};
        export const musicErrorDetails = () => ({});
      ` }));
      builder.onLoad({ filter: /shared-utils\.ts$/ }, () => ({ contents: "export const delayAsync = async () => {};" }));
      builder.onLoad({ filter: /lib[\\/]logger\.ts$/ }, () => ({ contents: "export const appLog = () => {}; export const appWarn = () => {}; export const appError = () => {};" }));
    },
  }],
});

for (const provider of [AiPlanningFallbackProvider.GeminiChat, AiPlanningFallbackProvider.GrokChat, AiPlanningFallbackProvider.ChatGptUi]) {
  for (const phase of ["launch", "new-page", "open-room"] as const) {
    const reachedPhase = deferred<void>();
    const launch = deferred<any>();
    const newPage = deferred<any>();
    const navigation = deferred<void>();
    let launches = 0;
    let pagesCreated = 0;
    let browserCloses = 0;
    let pageClosed = false;
    const page = {
      isClosed: () => pageClosed,
      close: async () => {
        pageClosed = true;
        navigation.reject(new Error("Target page, context or browser has been closed"));
      },
      goto: () => { reachedPhase.resolve(); return navigation.promise; },
    };
    // A late page may be closed before navigation starts.
    void navigation.promise.catch(() => undefined);
    const browser = {
      account: { email: "test@example.invalid" },
      context: {
        newPage: async () => {
          pagesCreated++;
          if (phase === "new-page") { reachedPhase.resolve(); return newPage.promise; }
          return page;
        },
      },
    };
    const module = { exports: {} as any };
    const sandbox = {
      module, exports: module.exports, require: createRequire(import.meta.url),
      Buffer, process, URL, AbortController, setTimeout, clearTimeout,
      browserMocks: {
        launch: async () => {
          launches++;
          if (phase === "launch") { reachedPhase.resolve(); return launch.promise; }
          return browser;
        },
        closeBrowser: async () => { browserCloses++; return true; },
      },
    };
    vm.runInNewContext(bundled.outputFiles[0].text, sandbox);
    const service = module.exports;
    const run = service.beginChatPlanningRun("music-mixer-rank-test", Date.now(), undefined, provider);
    const result = service.generatePlanningWithChatUi({
      provider, projectId: "music-mixer-rank-test", prompt: "test",
      artifactType: "music-mixer-ranking", signal: run.signal, closeRoomOnComplete: false,
    });
    const rejected = assert.rejects(result, (error: any) => error.message === CINEMATIC_CHAT_PLANNING_CONFIG.CANCELLED_ERROR);
    await reachedPhase.promise;
    assert.equal(service.cancelChatPlanningRun("music-mixer-rank-test"), true);
    if (phase === "launch") launch.resolve(browser);
    if (phase === "new-page") newPage.resolve(page);
    await rejected;
    assert.equal(launches, 1, `${provider}/${phase}: cancellation must prevent recovery from reopening Chrome`);
    assert.equal(pagesCreated, phase === "launch" ? 0 : 1);
    if (phase !== "launch") assert.equal(pageClosed, true, "Close active and late-created pages");
    assert.ok(browserCloses > 0, "Release the idle browser after cancellation");
    assert.equal(service.cancelChatPlanningRun("music-mixer-rank-test"), false);
  }
}
console.log("Music mixer cancellation passed: 3 providers × launch, page creation, and active-room cancellation.");
