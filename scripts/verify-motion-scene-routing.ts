import { VERIFICATION_VALUES as VT } from "./motionVerificationValues.js";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";
import { SRV as V } from "./motionSceneRoutingVerificationTexts.js";
import { MOTION_AI_ROLE } from "../src/constants/motionAiFallback.js";
import { encodeGeminiChatModel } from "../src/constants/geminiChatModels.js";
import { AiPlanningChatModel as M, AiPlanningExecutionMode as E, AiPlanningFallbackProvider as P } from "../src/types.js";
const imports = new Map<string, Map<string, string>>();
for (const match of fs.readFileSync(V.CONTROLLER, VT.UTF8).matchAll(V.IMPORTS)) {
  const names = imports.get(match[2]) || new Map<string, string>();
  for (const specifier of match[1].split(V.COMMA)) {
    const [name, alias = name] = specifier.trim().split(V.ALIAS);
    names.set(name, alias);
  }
  imports.set(match[2], names);
}
const calls: { name: string; args: any[] }[] = [];
let task: Promise<any> | undefined;
const script = { title: V.TITLE, language: VT.VI, beats: [{ id: VT.B1, visual: VT.SCENE, narration: VT.A_WOMAN_STANDS_BESIDE_A_BAMBOO_BED, place: VT.ROOM }], gen: { failed: [] } };
const analysis = { title: V.TITLE, cast: [], places: [], chapters: [] };
const track = { totalSeconds: 3, clips: [] };
const fixture = {
  invoke(name: string, args: any[]): any {
    calls.push({ name, args });
    switch (name) {
      case VT.STARTSTORYJOB:
        task = args[2]({ signal: new AbortController().signal, log() {}, progress() {}, partial() {} });
        return { id: V.JOB };
      case VT.BUILDSCENESPUPPET:
        return Promise.resolve(structuredClone(script));
      case VT.LISTMOTIONVOICES:
        return Promise.resolve([]);
      case VT.DIRECTMOTIONVOICE:
        return Promise.resolve({ roles: [], direction: {} });
      case VT.BUILDMOTIONVOICETRACK:
        return Promise.resolve(track);
      case VT.SEEDPUPPETKIT:
        return Promise.resolve({ sets: 0, props: 0 });
      case VT.RECORDSPEECHRATE:
        return undefined;
      case VT.VOICESUSEAUTOSPEED:
        return false;
      case VT.RECORDVOICESPEEDFEEDBACK:
        return undefined;
      default:
        throw new Error(V.UNEXPECTED(name));
    }
  },
};
(globalThis as any).__motionSceneRouting = fixture;
const output = path.resolve(V.BUNDLE(process.pid));
try {
  const bundled = await build({
    stdin: { contents: V.ENTRY, loader: VT.TS, resolveDir: process.cwd() },
    bundle: true,
    platform: VT.NODE,
    format: VT.ESM,
    packages: VT.EXTERNAL,
    write: false,
    plugins: [
      {
        name: V.PLUGIN,
        setup(builder) {
          builder.onResolve({ filter: V.SERVICES }, (args) => (imports.has(args.path) ? { path: args.path, namespace: V.NAMESPACE } : undefined));
          builder.onLoad({ filter: /.*/, namespace: V.NAMESPACE }, (args) => ({ loader: VT.JS, contents: [...imports.get(args.path)!.keys()].map(V.EXPORT).join(VT.NEWLINE) }));
        },
      },
    ],
  });
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, bundled.outputFiles[0].text);
  const controller = await import(pathToFileURL(output).href);
  const aiExecution = { provider: P.GeminiChat, model: encodeGeminiChatModel(M.GeminiFlash, VT.HIGH), mode: E.RoomOnly, chromeHeadless: false };
  const expected = { ...aiExecution, role: MOTION_AI_ROLE.DRAW };
  const mainAiExecution = { provider: P.DeepSeekChat, model: M.DeepSeekStandard, mode: E.RoomOnly, chromeHeadless: true };
  const invoke = async (handler: any, extra = {}) => {
    calls.length = 0;
    let response: any;
    handler(
      { body: { script: structuredClone(script), analysis: structuredClone(analysis), aiExecution, mainAiExecution, ...extra } },
      {
        json(value: any) {
          response = value;
        },
        status(value: number) {
          throw new Error(String(value));
        },
      },
    );
    assert.equal(response.success, true);
    await task;
  };
  const expectExec = (name: string, index: number) => {
    const call = calls.find((item) => item.name === name);
    assert.ok(call, name);
    assert.deepEqual(call.args[index].exec, expected);
    assert.equal(call.args[index].mainExec, undefined);
    return call.args[index];
  };
  await invoke(controller.scenesMotionStory);
  expectExec(VT.BUILDSCENESPUPPET, 2);
  expectExec(VT.DIRECTMOTIONVOICE, 3);
  expectExec(VT.BUILDMOTIONVOICETRACK, 2);
  await invoke(controller.scenesMotionStory, { autoVoice: false, beats: [VT.B1], locations: [VT.ROOM], restart: true });
  const options = expectExec(VT.BUILDSCENESPUPPET, 2);
  assert.deepEqual(options.onlyBeats, [VT.B1]);
  assert.deepEqual(options.onlyLocations, [VT.ROOM]);
  assert.equal(
    calls.some((call) => call.name === VT.DIRECTMOTIONVOICE),
    false,
  );
  await invoke(controller.seedPuppetKitItems, { styleId: V.STYLE });
  expectExec(VT.SEEDPUPPETKIT, 2);
  await invoke(controller.voiceMotionStory);
  expectExec(VT.BUILDMOTIONVOICETRACK, 2);
  process.stdout.write(V.PASSED);
} finally {
  delete (globalThis as any).__motionSceneRouting;
  fs.rmSync(output, { force: true });
}
