import { STUDIO_VERIFICATION_TEXTS as AUT } from "./studioVerificationTexts.js";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import vm from "node:vm";
import { build } from "esbuild";
import { AiPlanningFallbackProvider } from "../src/types.ts";
import { CINEMATIC_CHAT_PLANNING_CONFIG } from "../src/constants/index.ts";
const deferred = <T>() => {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
};
const bundled = await build({
  entryPoints: [AUT.SRC_SERVER_SERVICES_CHATUIPLANNINGSERVICE_TS],
  bundle: true,
  platform: AUT.NODE,
  format: AUT.CJS,
  packages: AUT.EXTERNAL,
  write: false,
  logOverride: { "empty-import-meta": AUT.SILENT },
  plugins: [
    {
      name: AUT.SIMULATED_BROWSER,
      setup(builder) {
        builder.onLoad({ filter: /imageGeneratorService\.ts$/ }, () => ({ contents: AUT.EXPORT_CLASS_SIMPLEMUTEX_TAIL_PROMISE_RESOLVE_ASYNC_ACQUIRE_CONST_PREVIOUS_THIS_TAIL }));
        builder.onLoad({ filter: /musicDiagnosticService\.ts$/ }, () => ({ contents: AUT.EXPORT_CONST_WRITEMUSICDIAGNOSTIC_ASYNC_EXPORT_CONST_MUSICERRORDETAILS_2 }));
        builder.onLoad({ filter: /shared-utils\.ts$/ }, () => ({ contents: AUT.EXPORT_CONST_DELAYASYNC_ASYNC }));
        builder.onLoad({ filter: /lib[\\/]logger\.ts$/ }, () => ({ contents: AUT.EXPORT_CONST_APPLOG_EXPORT_CONST_APPWARN_EXPORT_CONST_APPERROR }));
      },
    },
  ],
});
for (const provider of [AiPlanningFallbackProvider.GeminiChat, AiPlanningFallbackProvider.GrokChat, AiPlanningFallbackProvider.ChatGptUi]) {
  for (const phase of [AUT.LAUNCH, AUT.NEW_PAGE, AUT.OPEN_ROOM] as const) {
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
        navigation.reject(new Error(AUT.TARGET_PAGE_CONTEXT_OR_BROWSER_HAS_BEEN_CLOSED));
      },
      goto: () => {
        reachedPhase.resolve();
        return navigation.promise;
      },
    };
    void navigation.promise.catch(() => undefined);
    const browser = {
      account: { email: AUT.TEST_EXAMPLE_INVALID },
      context: {
        newPage: async () => {
          pagesCreated++;
          if (phase === AUT.NEW_PAGE) {
            reachedPhase.resolve();
            return newPage.promise;
          }
          return page;
        },
      },
    };
    const module = { exports: {} as any };
    const sandbox = {
      module,
      exports: module.exports,
      require: createRequire(import.meta.url),
      Buffer,
      process,
      URL,
      AbortController,
      setTimeout,
      clearTimeout,
      browserMocks: {
        launch: async () => {
          launches++;
          if (phase === AUT.LAUNCH) {
            reachedPhase.resolve();
            return launch.promise;
          }
          return browser;
        },
        closeBrowser: async () => {
          browserCloses++;
          return true;
        },
      },
    };
    vm.runInNewContext(bundled.outputFiles[0].text, sandbox);
    const service = module.exports;
    const run = service.beginChatPlanningRun(AUT.MUSIC_MIXER_RANK_TEST, Date.now(), undefined, provider);
    const result = service.generatePlanningWithChatUi({ provider, projectId: AUT.MUSIC_MIXER_RANK_TEST, prompt: AUT.TEST, artifactType: AUT.MUSIC_MIXER_RANKING, signal: run.signal, closeRoomOnComplete: false });
    const rejected = assert.rejects(result, (error: any) => error.message === CINEMATIC_CHAT_PLANNING_CONFIG.CANCELLED_ERROR);
    await reachedPhase.promise;
    assert.equal(service.cancelChatPlanningRun(AUT.MUSIC_MIXER_RANK_TEST), true);
    if (phase === AUT.LAUNCH) launch.resolve(browser);
    if (phase === AUT.NEW_PAGE) newPage.resolve(page);
    await rejected;
    assert.equal(launches, 1, AUT.FORMAT_CANCELLATION_MUST_PREVENT_RECOVERY_FROM_REOPENING_CHROME(provider, phase));
    assert.equal(pagesCreated, phase === AUT.LAUNCH ? 0 : 1);
    if (phase !== AUT.LAUNCH) assert.equal(pageClosed, true, AUT.CLOSE_ACTIVE_AND_LATE_CREATED_PAGES);
    assert.ok(browserCloses > 0, AUT.RELEASE_THE_IDLE_BROWSER_AFTER_CANCELLATION);
    assert.equal(service.cancelChatPlanningRun(AUT.MUSIC_MIXER_RANK_TEST), false);
  }
}
process.stdout.write(AUT.MUSIC_MIXER_CANCELLATION_PASSED_3_PROVIDERS_LAUNCH_PAGE_CREATION_AND_ACTIVE_ROOM_CAN);
