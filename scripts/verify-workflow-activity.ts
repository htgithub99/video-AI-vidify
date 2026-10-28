import {
  SOURCE_TEXT_SRC_SERVICES_WORKFLOWACTIVITY_TS,
  SOURCE_TEXT_NODE,
  SOURCE_TEXT_CJS,
  SOURCE_TEXT_EXTERNAL,
  SOURCE_TEXT_MUSIC,
  SOURCE_TEXT_MUSICPLANDONE,
  SOURCE_TEXT_MIXER,
  SOURCE_TEXT_MUSICMIXERDONE,
  SOURCE_TEXT_FLOW,
  SOURCE_TEXT_FLOWPLANDONE,
  SOURCE_TEXT_PROXY_3,
  SOURCE_TEXT_PROXYCHECKFAIL,
  SOURCE_TEXT_MOTION,
  SOURCE_TEXT_MOTIONRENDERSTOP,
  SOURCE_TEXT_FIXTURE,
  SOURCE_TEXT_VI,
  SOURCE_TEXT_EN,
  SOURCE_TEXT_SRC_HOOKS_USEMOTIONSTUDIO_TS,
  SOURCE_TEXT_MOTION_FIXTURES,
  SOURCE_TEXT_REACT_FIXTURE,
  SOURCE_TEXT_EXPORT_CONST_USECALLBACK_CALLBACK_CALLBACK_EXPORT_CONST,
  SOURCE_TEXT_SERVICES,
  SOURCE_TEXT_EXPORT_CONST_RECORDWORKFLOWACTIVITY_ARGS_GLOBALTHIS_FIXTURE_EVENTS,
  SOURCE_TEXT_EXPORT_CONST_MOTIONREQUEST_ARGS_GLOBALTHIS_FIXTURE_REQUEST,
  SOURCE_TEXT_TOAST_FIXTURE,
  SOURCE_TEXT_TOAST,
  SOURCE_TEXT_EXPORT_CONST_TOAST_SUCCESS_ERROR_INFO_WARNING,
  SOURCE_TEXT_ANALYZE,
  SOURCE_TEXT_MOTIONANALYZE,
  SOURCE_TEXT_WRITESCRIPT,
  SOURCE_TEXT_MOTIONSCRIPT,
  SOURCE_TEXT_BUILDSCENES,
  SOURCE_TEXT_MOTIONSCENES,
  SOURCE_TEXT_GENERATEVOICE,
  SOURCE_TEXT_MOTIONVOICE,
  SOURCE_TEXT_GENERATESEO,
  SOURCE_TEXT_MOTIONSEO,
  SOURCE_TEXT_GENERATETHUMBNAIL,
  SOURCE_TEXT_MOTIONTHUMBNAIL,
  SOURCE_TEXT_COMPLETED,
  SOURCE_TEXT_ERROR,
  SOURCE_TEXT_CANCELLED,
  SOURCE_TEXT_REQUEST_ERROR,
  SOURCE_TEXT_PARTIAL,
  SOURCE_TEXT_BEAT,
  SOURCE_TEXT_HELLO,
  SOURCE_TEXT_PROVIDER_ERROR,
  SOURCE_TEXT_VOICE_2,
  SOURCE_TEXT_REQUEST_FAILED,
  SOURCE_TEXT_DONE_2,
  SOURCE_TEXT_STOP,
  SOURCE_TEXT_FAIL,
  SOURCE_TEXT_START_3,
  SOURCE_TEMPLATE_SYMBOL_81,
  SOURCE_TEXT_RENDER,
  SOURCE_TEXT_RENDER_ERROR,
  SOURCE_TEXT_VIDEO_2,
  SOURCE_TEXT_VIDEO_MP4_2,
  SOURCE_TEXT_MOTIONRENDERSTART,
  SOURCE_TEXT_MOTIONRENDER,
  SOURCE_TEXT_SRC_COMPONENTS_PROXYMANAGER_TSX,
  SOURCE_TEXT_UTF8,
  SOURCE_TEXT_CONST_RUN_ASYNC,
  SOURCE_TEXT_CONST_CHECKALL_ASYNC,
  SOURCE_TEXT_OK,
  SOURCE_TEXT_ID,
  SOURCE_TEXT_PROFILE,
  SOURCE_TEXT_CONNECTION_FAILED,
  SOURCE_TEXT_CHECK,
  SOURCE_TEXT_CLOSE_2,
  SOURCE_TEXT_DELETE,
  SOURCE_TEXT_POST,
  SOURCE_TEMPLATE_ASYNC_AWAIT_CHECK_ID,
  SOURCE_TEXT_PROXYCHECKSTART,
  SOURCE_TEXT_PROXYCHECKDONE,
  SOURCE_TEXT_ACTIVITY_LOG_PASSED_PERSISTENCE_BILINGUAL_LABELS_SIX,
} from "../src/constants/sourceText.js";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import vm from "node:vm";
import fs from "node:fs";
import ts from "typescript";
import { build } from "esbuild";
import { WORKFLOW_ACTIVITY_CONFIG, WORKFLOW_ACTIVITY_EVENT, WORKFLOW_ACTIVITY_TEXT } from "../src/constants/workflowActivity.ts";
import { MotionJobStatus, MotionStoryJobKind } from "../src/types/motionVideo.ts";
const require = createRequire(import.meta.url);
const evaluate = (code: string, globals: Record<string, unknown>) => {
  const module = { exports: {} as any };
  vm.runInNewContext(code, { module, exports: module.exports, require, console, setTimeout, clearTimeout, AbortController, ...globals });
  return module.exports;
};
const storeBundle = await build({ entryPoints: [SOURCE_TEXT_SRC_SERVICES_WORKFLOWACTIVITY_TS], bundle: true, platform: SOURCE_TEXT_NODE, format: SOURCE_TEXT_CJS, packages: SOURCE_TEXT_EXTERNAL, write: false });
const storage = new Map<string, string>();
const localStorage = { getItem: (key: string) => storage.get(key) || null, setItem: (key: string, value: string) => storage.set(key, value) };
let store = evaluate(storeBundle.outputFiles[0].text, { localStorage });
let notifications = 0;
store.subscribeWorkflowActivity(() => notifications++);
for (const [area, event] of [
  [SOURCE_TEXT_MUSIC, SOURCE_TEXT_MUSICPLANDONE],
  [SOURCE_TEXT_MIXER, SOURCE_TEXT_MUSICMIXERDONE],
  [SOURCE_TEXT_FLOW, SOURCE_TEXT_FLOWPLANDONE],
  [SOURCE_TEXT_PROXY_3, SOURCE_TEXT_PROXYCHECKFAIL],
  [SOURCE_TEXT_MOTION, SOURCE_TEXT_MOTIONRENDERSTOP],
]) {
  store.recordWorkflowActivity(area, event, 1, SOURCE_TEXT_FIXTURE);
}
assert.equal(notifications, 5);
store = evaluate(storeBundle.outputFiles[0].text, { localStorage });
assert.deepEqual(
  Array.from(store.getWorkflowActivities(), (entry: any) => entry.area),
  [SOURCE_TEXT_MOTION, SOURCE_TEXT_PROXY_3, SOURCE_TEXT_FLOW, SOURCE_TEXT_MIXER, SOURCE_TEXT_MUSIC],
);
for (const language of [SOURCE_TEXT_VI, SOURCE_TEXT_EN] as const) {
  for (const event of Object.values(WORKFLOW_ACTIVITY_EVENT)) assert.ok(WORKFLOW_ACTIVITY_TEXT[language].events[event]);
}
const summary = store.summarizeWorkflowActivities(store.getWorkflowActivities());
assert.equal(summary.success, 3);
assert.equal(summary.fail, 1);
for (const area of Object.values(WORKFLOW_ACTIVITY_CONFIG.AREAS).filter((area) => area !== WORKFLOW_ACTIVITY_CONFIG.AREAS.all)) assert.equal(summary.areas[area], 1);
assert.equal(store.getEventStatusType(WORKFLOW_ACTIVITY_EVENT.motionRenderStop), WORKFLOW_ACTIVITY_CONFIG.STATUS_TYPE_KEYS.stop);
store.clearWorkflowActivities();
assert.equal(evaluate(storeBundle.outputFiles[0].text, { localStorage }).getWorkflowActivities().length, 0);
assert.equal(JSON.parse(storage.get(WORKFLOW_ACTIVITY_CONFIG.STORAGE_KEY)!).length, 0);
const hookBundle = await build({
  entryPoints: [SOURCE_TEXT_SRC_HOOKS_USEMOTIONSTUDIO_TS],
  bundle: true,
  platform: SOURCE_TEXT_NODE,
  format: SOURCE_TEXT_CJS,
  packages: SOURCE_TEXT_EXTERNAL,
  write: false,
  plugins: [
    {
      name: SOURCE_TEXT_MOTION_FIXTURES,
      setup(builder) {
        builder.onResolve({ filter: /^react$/ }, () => ({ path: SOURCE_TEXT_REACT_FIXTURE, namespace: SOURCE_TEXT_FIXTURE }));
        builder.onLoad({ filter: /.*/, namespace: SOURCE_TEXT_FIXTURE }, () => ({ contents: SOURCE_TEXT_EXPORT_CONST_USECALLBACK_CALLBACK_CALLBACK_EXPORT_CONST }));
        builder.onLoad({ filter: /workflowActivity\.ts$/ }, (args) => (args.path.includes(SOURCE_TEXT_SERVICES) ? { contents: SOURCE_TEXT_EXPORT_CONST_RECORDWORKFLOWACTIVITY_ARGS_GLOBALTHIS_FIXTURE_EVENTS } : undefined));
        builder.onLoad({ filter: /motionApi\.ts$/ }, () => ({ contents: SOURCE_TEXT_EXPORT_CONST_MOTIONREQUEST_ARGS_GLOBALTHIS_FIXTURE_REQUEST }));
        builder.onResolve({ filter: /^sonner$/ }, () => ({ path: SOURCE_TEXT_TOAST_FIXTURE, namespace: SOURCE_TEXT_TOAST }));
        builder.onLoad({ filter: /.*/, namespace: SOURCE_TEXT_TOAST }, () => ({ contents: SOURCE_TEXT_EXPORT_CONST_TOAST_SUCCESS_ERROR_INFO_WARNING }));
      },
    },
  ],
});
for (const [method, kind, prefix] of [
  [SOURCE_TEXT_ANALYZE, MotionStoryJobKind.ANALYZE, SOURCE_TEXT_MOTIONANALYZE],
  [SOURCE_TEXT_WRITESCRIPT, MotionStoryJobKind.SCRIPT, SOURCE_TEXT_MOTIONSCRIPT],
  [SOURCE_TEXT_BUILDSCENES, MotionStoryJobKind.SCENES, SOURCE_TEXT_MOTIONSCENES],
  [SOURCE_TEXT_GENERATEVOICE, MotionStoryJobKind.VOICE, SOURCE_TEXT_MOTIONVOICE],
  [SOURCE_TEXT_GENERATESEO, MotionStoryJobKind.SEO, SOURCE_TEXT_MOTIONSEO],
  [SOURCE_TEXT_GENERATETHUMBNAIL, MotionStoryJobKind.THUMBNAIL, SOURCE_TEXT_MOTIONTHUMBNAIL],
] as const) {
  for (const scenario of [SOURCE_TEXT_COMPLETED, SOURCE_TEXT_ERROR, SOURCE_TEXT_CANCELLED, SOURCE_TEXT_REQUEST_ERROR, ...(kind === MotionStoryJobKind.SCENES ? [SOURCE_TEXT_PARTIAL] : [])]) {
    const events: any[] = [];
    const result = { chapters: [], cast: [], beats: [{ id: SOURCE_TEXT_BEAT, narration: SOURCE_TEXT_HELLO }], durations: [1], gen: { failed: scenario === SOURCE_TEXT_PARTIAL ? [SOURCE_TEXT_BEAT] : [] } };
    const job = { id: SOURCE_TEXT_FIXTURE, kind, status: scenario === SOURCE_TEXT_ERROR ? MotionJobStatus.ERROR : scenario === SOURCE_TEXT_CANCELLED ? MotionJobStatus.CANCELLED : MotionJobStatus.COMPLETED, result, error: scenario === SOURCE_TEXT_ERROR ? SOURCE_TEXT_PROVIDER_ERROR : undefined };
    const fixture = {
      events,
      state: { source: {}, analysis: { chapters: [] }, script: result, voiceId: SOURCE_TEXT_VOICE_2, autoContinue: false },
      request: async () => {
        if (scenario === SOURCE_TEXT_REQUEST_ERROR) throw new Error(SOURCE_TEXT_REQUEST_FAILED);
        return { job };
      },
      poll: async (_url: string, update: (value: any) => void) => {
        update(job);
        return job;
      },
    };
    const hook = evaluate(hookBundle.outputFiles[0].text, { fixture }).useMotionStudio();
    await hook[method]();
    const suffix = scenario === SOURCE_TEXT_COMPLETED ? SOURCE_TEXT_DONE_2 : scenario === SOURCE_TEXT_CANCELLED ? SOURCE_TEXT_STOP : SOURCE_TEXT_FAIL;
    assert.deepEqual(
      events.map((entry) => entry[1]),
      [prefix + SOURCE_TEXT_START_3, prefix + suffix],
      SOURCE_TEMPLATE_SYMBOL_81(`${method}`, `${scenario}`),
    );
    assert.ok(events.every((entry) => entry[0] === SOURCE_TEXT_MOTION));
  }
}
for (const status of [MotionJobStatus.COMPLETED, MotionJobStatus.ERROR, MotionJobStatus.CANCELLED]) {
  const events: any[] = [];
  const job = { id: SOURCE_TEXT_RENDER, status, error: status === MotionJobStatus.ERROR ? SOURCE_TEXT_RENDER_ERROR : undefined, result: status === MotionJobStatus.COMPLETED ? { id: SOURCE_TEXT_VIDEO_2, fileName: SOURCE_TEXT_VIDEO_MP4_2 } : undefined };
  const fixture = {
    events,
    state: { script: null },
    compiled: { spec: {}, missing: [], sfxCues: [] },
    request: async () => ({ job }),
    poll: async (_url: string, update: (value: any) => void) => {
      update(job);
      return job;
    },
  };
  await evaluate(hookBundle.outputFiles[0].text, { fixture }).useMotionStudio().render();
  await new Promise((resolve) => setTimeout(resolve, 0));
  const suffix = status === MotionJobStatus.COMPLETED ? SOURCE_TEXT_DONE_2 : status === MotionJobStatus.CANCELLED ? SOURCE_TEXT_STOP : SOURCE_TEXT_FAIL;
  assert.deepEqual(
    events.map((entry) => entry[1]),
    [SOURCE_TEXT_MOTIONRENDERSTART, SOURCE_TEXT_MOTIONRENDER + suffix],
  );
}
const proxySource = fs.readFileSync(SOURCE_TEXT_SRC_COMPONENTS_PROXYMANAGER_TSX, SOURCE_TEXT_UTF8);
const start = proxySource.indexOf(SOURCE_TEXT_CONST_RUN_ASYNC);
const end = proxySource.indexOf(SOURCE_TEXT_CONST_CHECKALL_ASYNC, start);
assert.ok(start > 0 && end > start);
for (const status of [SOURCE_TEXT_OK, SOURCE_TEXT_ERROR]) {
  const events: any[] = [];
  const globals = {
    WORKFLOW_ACTIVITY_CONFIG,
    WORKFLOW_ACTIVITY_EVENT,
    recordWorkflowActivity: (...args: any[]) => events.push(args),
    locks: { current: new Set() },
    mounted: { current: true },
    profiles: [{ id: SOURCE_TEXT_ID, name: SOURCE_TEXT_PROFILE }],
    setPending: () => {},
    setLoadError: () => {},
    refresh: async () => {},
    toast: { error: () => {} },
    t: { loadError: SOURCE_TEXT_ERROR },
    getErrorMessage: (error: Error) => error.message,
    api: async () => ({ status, error: SOURCE_TEXT_CONNECTION_FAILED }),
    SOURCE_TEXT_CHECK: SOURCE_TEXT_CHECK,
    SOURCE_TEXT_OK: SOURCE_TEXT_OK,
    SOURCE_TEXT_CLOSE_2: SOURCE_TEXT_CLOSE_2,
    SOURCE_TEXT_DELETE: SOURCE_TEXT_DELETE,
    SOURCE_TEXT_POST: SOURCE_TEXT_POST,
    SOURCE_TEMPLATE_CHECK: (id: string) => id,
  };
  const code = ts.transpileModule(SOURCE_TEMPLATE_ASYNC_AWAIT_CHECK_ID(`${proxySource.slice(start, end)}`), { compilerOptions: { target: ts.ScriptTarget.ES2022 } }).outputText;
  await vm.runInNewContext(code, globals);
  assert.deepEqual(
    events.map((entry) => entry[1]),
    [SOURCE_TEXT_PROXYCHECKSTART, status === SOURCE_TEXT_OK ? SOURCE_TEXT_PROXYCHECKDONE : SOURCE_TEXT_PROXYCHECKFAIL],
  );
}
process.stdout.write(SOURCE_TEXT_ACTIVITY_LOG_PASSED_PERSISTENCE_BILINGUAL_LABELS_SIX);
