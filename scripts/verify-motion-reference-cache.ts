import { RUNTIME_VERIFICATION_TEXTS as RT } from "./runtimeVerificationTexts.ts";
import { STUDIO_VERIFICATION_TEXTS as AUT } from "./studioVerificationTexts.js";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { deflateSync } from "node:zlib";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { withCachedMotionReferenceStyle } from "../src/server/services/motionReferenceCacheService.ts";
import { analyzeStory, parseStorySource } from "../src/features/motion/server/services/motionStoryService.ts";
import { MOTION_REFERENCE_AI, MOTION_REFERENCE_CONFIG as C } from "../src/constants/motionReference.ts";
import { MOTION_STORY_CONFIG } from "../src/constants/motionVideo.ts";
import { MotionStoryLength } from "../src/types/motionVideo.ts";
import { AiPlanningChatModel, AiPlanningFallbackProvider } from "../src/types.ts";
const png = (red: number, green = 0, blue = 0) => {
  const chunk = (type: string, bytes: Buffer) => {
    const body = Buffer.concat([Buffer.from(type), bytes]);
    let crc = 0xffffffff;
    for (const byte of body) {
      crc ^= byte;
      for (let bit = 0; bit < 8; bit++) crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
    }
    const length = Buffer.alloc(4);
    length.writeUInt32BE(bytes.length);
    const checksum = Buffer.alloc(4);
    checksum.writeUInt32BE((crc ^ 0xffffffff) >>> 0);
    return Buffer.concat([length, body, checksum]);
  };
  const header = Buffer.alloc(13);
  header.writeUInt32BE(1, 0);
  header.writeUInt32BE(1, 4);
  header[8] = 8;
  header[9] = 6;
  return AUT.DATA_IMAGE_PNG_BASE64 + Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk(AUT.IHDR, header), chunk(AUT.IDAT, deflateSync(Buffer.from([0, red, green, blue, 255]))), chunk(AUT.IEND, Buffer.alloc(0))]).toString(AUT.BASE64);
};
const image = { name: AUT.REFERENCE_PNG, dataUrl: png(255) };
const profile = (count = 1) => ({ description: AUT.FLAT_CUSTOM_ILLUSTRATION, palette: [AUT.FF0000], outlineWidth: 0.01, kit: { render: { mode: AUT.FLAT, shading: AUT.TWO_TONES } }, images: Array.from({ length: count }, (_, index) => ({ name: AUT.FORMAT_STYLE_REFERENCE(index + 1), role: AUT.STYLE as const, subjects: [], details: AUT.RED_ILLUSTRATED_OBJECT })) });
delete process.env.APP_DATA_DIR;
const directory = process.argv[2] === AUT.READ ? process.argv[3] : path.resolve(AUT.FORMAT_SCRATCH_MOTION_REFERENCE_CACHE(process.pid));
process.env.VIDIFY_STORAGE_DIR = directory;
if (process.argv[2] === AUT.READ) {
  const saved = await withCachedMotionReferenceStyle([image], async () => assert.fail(AUT.A_NEW_PROCESS_MUST_REUSE_THE_STYLE_STORED_ON_DISK));
  assert.equal(saved.description, profile().description);
  process.stdout.write(AUT.PERSISTED_CACHE_REUSED_BY_A_NEW_PROCESS);
  process.exit(0);
}
let styleCalls = 0;
const logs: string[] = [];
const analyze = (text: string, references = [image], exec = {}) =>
  analyzeStory(parseStorySource(text), {
    styleReferences: references,
    exec,
    language: AUT.VI,
    length: MotionStoryLength.ONE,
    log: (line) => logs.push(line),
    ai: async (prompt, artifact, _exec, _signal, _log, images) => {
      if (artifact === MOTION_STORY_CONFIG.ARTIFACT_STYLE) {
        assert.deepEqual(_exec, { ...exec, ...MOTION_REFERENCE_AI });
        styleCalls++;
        assert.equal(images?.length, references.length);
        assert.ok(images!.every((item) => fs.existsSync(item.path)));
        return { referenceStyle: profile(references.length) };
      }
      assert.ok(prompt.includes(AUT.PROJECT_STYLE_KIT) && prompt.includes(profile().description), AUT.THE_SAVED_KIT_MUST_STILL_GUIDE_THE_NEW_VIDEO);
      return { title: text, chapters: [{ title: AUT.OPENING_2, summary: text }], cast: [], places: [], facts: [] };
    },
  });
const first = await analyze(AUT.DRAW_A_RED_OBJECT_ON_A_TABLE);
assert.equal(styleCalls, 1);
const firstCacheDirectory = path.join(directory, AUT.OUTPUT, AUT.MOTION_VIDEO, C.CACHE_FOLDER);
const firstCacheFile = path.join(firstCacheDirectory, fs.readdirSync(firstCacheDirectory)[0]);
const second = await analyze(AUT.EXPLAIN_A_DIFFERENT_STORY_WITH_A_RED_OBJECT, [{ ...image, name: AUT.RENAMED_FILE_PNG }], { provider: AiPlanningFallbackProvider.DeepSeekChat, model: AiPlanningChatModel.DeepSeekThink });
assert.equal(styleCalls, 1, AUT.CHANGING_STORY_PROVIDER_MODEL_OR_FILENAME_MUST_NOT_RE_ANALYZE_UNCHANGED_IMAGES);
assert.deepEqual(second.referenceStyle, first.referenceStyle);
assert.ok(logs.includes(C.CACHE_HIT_LOG) && logs.includes(C.CACHE_SAVED_LOG));
const child = await promisify(execFile)(process.execPath, [AUT.IMPORT, AUT.TSX, fileURLToPath(import.meta.url), AUT.READ, directory], { cwd: process.cwd(), windowsHide: true });
assert.ok(child.stdout.includes(AUT.PERSISTED_CACHE_REUSED));
const changed = { name: image.name, dataUrl: png(0, 0, 255) };
await analyze(AUT.SHOW_THE_BLUE_OBJECT_IN_THE_NEXT_VIDEO, [changed]);
assert.equal(styleCalls, 2, AUT.CHANGING_IMAGE_BYTES_UNDER_THE_SAME_FILENAME_MUST_TRIGGER_ANALYSIS);
const cacheDirectory = path.join(directory, AUT.OUTPUT, AUT.MOTION_VIDEO, C.CACHE_FOLDER);
const oldCache = JSON.parse(fs.readFileSync(firstCacheFile, AUT.UTF8));
fs.writeFileSync(firstCacheFile, JSON.stringify({ ...oldCache, version: C.CACHE_VERSION - 1 }));
let refreshed = 0;
await withCachedMotionReferenceStyle([image], async () => {
  refreshed++;
  return profile();
});
assert.equal(refreshed, 1, RT.PROFILES_FROM_BEFORE_THE_CLAUDE_ROUTING_CHANGE_MUST_BE_ANALYZED_AGAIN);
const beforePair = new Set(fs.readdirSync(cacheDirectory));
await analyze(AUT.COMPARE_THE_TWO_OBJECTS_SIDE_BY_SIDE, [image, changed]);
const cachedPair = path.join(cacheDirectory, fs.readdirSync(cacheDirectory).find((name) => !beforePair.has(name))!);
await analyze(AUT.COMPARE_THE_TWO_OBJECTS_IN_ANOTHER_STORY, [image, changed]);
assert.equal(styleCalls, 3);
await analyze(AUT.REVERSE_THE_ORDER_OF_THE_TWO_OBJECTS, [changed, image]);
assert.equal(styleCalls, 4, AUT.IMAGE_ORDERING_MUST_KEEP_THE_STYLE_REFERENCE_NAMES_CORRECTLY_ASSOCIATED);
let concurrentCalls = 0;
const concurrentImage = { name: AUT.GREEN_PNG, dataUrl: png(0, 255, 0) };
const concurrent = await Promise.all(
  Array.from({ length: 4 }, () =>
    withCachedMotionReferenceStyle([concurrentImage], async () => {
      concurrentCalls++;
      await new Promise((resolve) => setTimeout(resolve, 25));
      return profile();
    }),
  ),
);
assert.equal(concurrentCalls, 1);
assert.equal(concurrent.length, 4);
let release!: () => void;
let entered!: () => void;
const gate = new Promise<void>((resolve) => {
  release = resolve;
});
const started = new Promise<void>((resolve) => {
  entered = resolve;
});
const waitingImage = { name: AUT.YELLOW_PNG, dataUrl: png(255, 255, 0) };
const active = withCachedMotionReferenceStyle([waitingImage], async () => {
  entered();
  await gate;
  return profile();
});
await started;
const abort = new AbortController();
const cancelled = assert.rejects(
  withCachedMotionReferenceStyle([waitingImage], async () => assert.fail(AUT.CANCELLED_WAITER_MUST_NOT_ANALYZE), { signal: abort.signal }),
  RT.PATTERN_CANCELLED,
);
abort.abort();
await cancelled;
const follower = withCachedMotionReferenceStyle([waitingImage], async () => assert.fail(AUT.CANCELLATION_MUST_NOT_BREAK_THE_LOCK_PROTECTING_THE_ACTIVE_ANALYSIS));
release();
await Promise.all([active, follower]);
const failedImage = { name: AUT.DARK_PNG, dataUrl: png(1) };
await assert.rejects(
  withCachedMotionReferenceStyle([failedImage], async () => undefined),
  RT.PATTERN_AI_KHONG_DOC_DUOC,
);
assert.ok(await withCachedMotionReferenceStyle([failedImage], async () => profile()));
fs.writeFileSync(cachedPair, AUT.BROKEN_JSON);
let recovered = 0;
assert.ok(
  await withCachedMotionReferenceStyle([image, changed], async () => {
    recovered++;
    return profile(2);
  }),
);
assert.equal(recovered, 1, AUT.CORRUPT_ENTRIES_MUST_BE_REPAIRED_WITH_A_FRESH_SUCCESSFUL_ANALYSIS);
fs.writeFileSync(path.join(directory, AUT.VERIFICATION_JSON), JSON.stringify({ status: AUT.PASSED, styleCalls, persistedAcrossProcesses: true, newStoriesReuseStyle: true, changedImagesReanalyzed: true, concurrentCalls, cancelledWaiterPreservesCache: true }, null, 2));
process.stdout.write(AUT.FORMAT_REFERENCE_CACHE_PASSED_CROSS_VIDEO_REUSE_RENAME_MODEL_INDEPENDENCE_CHANGED_IMAGE_ORD(directory));
