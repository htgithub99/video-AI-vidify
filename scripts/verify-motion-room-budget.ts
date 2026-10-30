import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";
import { MotionAiRoomPool, type MotionAiRoomIdentity } from "../src/features/motion/server/services/motionAiRoomPool.ts";
import { MOTION_AI_RECOVERY_VERIFICATION as V } from "./motionAiRecoveryVerificationTexts.ts";
import { MOTION_STORY_CONFIG as CONFIG } from "../src/constants/motionVideo.ts";
import { MOTION_AI_ROLE as ROLE } from "../src/constants/motionAiFallback.ts";
import { MOTION_SCENE_COMPOSITION as C } from "../src/constants/motionSceneComposition.ts";
import { CINEMATIC_CHAT_PLANNING_CONFIG as CHAT } from "../src/constants/cinematicConstants.ts";
import { AiPlanningFallbackProvider as P, AiPlanningChatModel as M, AiPlanningExecutionMode as E } from "../src/types.ts";
const deferred = () => {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => (resolve = done));
  return { promise, resolve };
};
const tick = () => new Promise<void>((resolve) => setImmediate(resolve));
const within = async <T>(pending: Promise<T>): Promise<T> => {
  let timer: ReturnType<typeof setTimeout>;
  try {
    return await Promise.race([
      pending,
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => reject(new Error("Motion room budget deadlock")), 5000);
      }),
    ]);
  } finally {
    clearTimeout(timer!);
  }
};
const identity = (workerId: string, projectId = "pool-first", provider = "first"): MotionAiRoomIdentity => ({ workerId, projectId, provider });
const rooms = new Map<string, any>();
const roomKey = (room: MotionAiRoomIdentity) => JSON.stringify([room.provider, room.projectId, room.workerId]);
let peakRooms = 0;
const open = (room: MotionAiRoomIdentity) => {
  rooms.set(roomKey(room), room);
  peakRooms = Math.max(peakRooms, rooms.size);
  assert.ok(rooms.size <= 5, `Too many physical rooms: ${rooms.size}`);
};
let failClose = false;
let closeHold: ReturnType<typeof deferred> | undefined;
const invalidated: string[] = [];
const pool = new MotionAiRoomPool(async (room) => {
  if (failClose) throw new Error("close rejected");
  await closeHold?.promise;
  rooms.delete(roomKey(room));
});
const take = async (room: MotionAiRoomIdentity, signal?: AbortSignal) => {
  const release = await pool.acquire(room, () => invalidated.push(roomKey(room)), signal);
  open(room);
  return release;
};
const firstRooms = [...CONFIG.SCENE_WORKER_IDS, ...CONFIG.WORKER_IDS].map((worker) => identity(worker));
const leases = await Promise.all(firstRooms.map((room) => take(room)));
assert.equal(rooms.size, 5);
const cancelled = new AbortController();
const waiting = assert.rejects(take(identity(CONFIG.WORKER_IDS[0], "queued"), cancelled.signal), /cancel queued/);
await tick();
assert.equal(rooms.size, 5);
cancelled.abort(new Error("cancel queued"));
await waiting;
leases.forEach((release) => release());
failClose = true;
await assert.rejects(take(identity(CONFIG.WORKER_IDS[0], "pool-first", "fallback")), /close rejected/);
assert.equal(rooms.size, 5);
failClose = false;
closeHold = deferred();
const replacement = take(identity(CONFIG.WORKER_IDS[0], "pool-first", "fallback"));
await tick();
let duplicateGranted = false;
const duplicate = take(firstRooms[3]).then((release) => {
  duplicateGranted = true;
  return release;
});
await tick();
assert.equal(duplicateGranted, false, "Same worker must wait while its old provider is being closed");
closeHold.resolve();
const releaseReplacement = await within(replacement);
assert.equal(duplicateGranted, false, "Same worker must wait for the active replacement lease");
releaseReplacement();
(await within(duplicate))();
closeHold = undefined;
await pool.closeProject("pool-first");
assert.equal(rooms.size, 0);
assert.ok(invalidated.length >= 5);
const root = await fs.mkdtemp(path.join(os.tmpdir(), "motion-room-budget-"));
const previousStorage = process.env.VIDIFY_STORAGE_DIR;
const previousData = process.env.APP_DATA_DIR;
process.env.VIDIFY_STORAGE_DIR = root;
delete process.env.APP_DATA_DIR;
const ready = (request: any) => ({ text: JSON.stringify({ ready: true, requestId: request.requestId }), provider: request.provider });
const fixture = {
  sent: [] as any[],
  prepared: [] as any[],
  closed: [] as any[],
  closedProjects: [] as any[],
  reloaded: [] as any[],
  resumed: [] as any[],
  apiCalls: 0,
  captchaPage: undefined as any,
  prepare: async (request: any) => {
    open(request);
  },
  close: async (request: any) => {
    rooms.delete(roomKey(request));
  },
  closeProject: async (request: any) => {
    for (const [key, room] of rooms) if (room.provider === request.provider && room.projectId === request.projectId) rooms.delete(key);
  },
  reload: async () => {},
  resume: async (request: any) => ready(request),
  send: async (request: any) => ready(request),
};
(globalThis as any).__motionAiRecovery = fixture;
const sessions: string[] = [];
let service: any;
try {
  const stub = V.CHAT_STUB.replace("f.closed.push(request);", "f.closed.push(request); await f.close(request);").replace("f.closedProjects.push(request);", "f.closedProjects.push(request); await f.closeProject(request);");
  const bundled = await build({
    stdin: { contents: V.ENTRY, loader: "ts", resolveDir: process.cwd() },
    bundle: true,
    platform: "node",
    format: "esm",
    packages: "external",
    write: false,
    plugins: [
      {
        name: V.PLUGIN,
        setup(builder) {
          builder.onResolve({ filter: V.CHAT_IMPORT }, () => ({ path: V.CHAT, namespace: V.NAMESPACE }));
          builder.onResolve({ filter: V.GEMINI_IMPORT }, () => ({ path: V.API, namespace: V.NAMESPACE }));
          builder.onLoad({ filter: V.ALL, namespace: V.NAMESPACE }, (args) => ({ loader: "js", contents: args.path === V.CHAT ? stub : V.API_STUB }));
        },
      },
    ],
  });
  const localBundle = path.resolve(`node_modules/.cache/motion-room-budget-${process.pid}.mjs`);
  await fs.mkdir(path.dirname(localBundle), { recursive: true });
  await fs.writeFile(localBundle, bundled.outputFiles[0].text);
  try {
    service = await import(pathToFileURL(localBundle).href);
  } finally {
    await fs.rm(localBundle, { force: true });
  }
  const draw = { provider: P.GeminiChat, model: M.GeminiFlash, mode: E.RoomOnly, role: ROLE.DRAW, singleResponse: true, allowFallback: true };
  const content = { provider: P.ChatGptUi, model: M.ChatGptAuto, mode: E.RoomOnly, role: ROLE.MAIN, allowFallback: false };
  const session = async (id: string, work: () => Promise<any>) => {
    sessions.push(id);
    return service.runInMotionAiSession(id, work, undefined, true, undefined, { ...V.EDITORIAL, id });
  };
  const results: any[] = [];
  for (const sameProvider of [false, true]) {
    const id = `five-room-${sameProvider}`;
    let active = 0,
      activeDrawing = 0,
      activeContent = 0,
      peak = 0,
      peakDrawing = 0,
      peakContent = 0;
    const full = deferred(),
      release = deferred();
    fixture.send = async (request) => {
      open(request);
      const drawing = request.artifactType === C.ARTIFACT;
      peak = Math.max(peak, ++active);
      if (drawing) peakDrawing = Math.max(peakDrawing, ++activeDrawing);
      else peakContent = Math.max(peakContent, ++activeContent);
      if (active === 5) full.resolve();
      await release.promise;
      active--;
      if (drawing) activeDrawing--;
      else activeContent--;
      return ready(request);
    };
    await within(
      session(id, async () => {
        await service.prepareMotionSceneRooms(draw);
        const chosenContent = sameProvider ? { ...content, provider: draw.provider, model: draw.model } : content;
        const pending = Promise.all([service.runMotionAi(V.PROMPT, V.STORY_ARTIFACT, chosenContent), service.runInMotionAiWorkerSession(id, () => Promise.all([0, 1].map(() => service.runMotionAi(V.PROMPT, V.STORY_ARTIFACT, chosenContent)))), ...Array.from({ length: 6 }, () => service.runMotionAi(V.PROMPT, C.ARTIFACT, draw))]);
        try {
          await within(full.promise);
          assert.equal(activeContent, 2);
          assert.equal(activeDrawing, 3);
        } finally {
          release.resolve();
        }
        await pending;
      }),
    );
    assert.equal(peak, 5);
    assert.equal(peakDrawing, 3);
    assert.equal(peakContent, 2);
    results.push({ id, peakRequests: peak, drawing: peakDrawing, content: peakContent, rooms: rooms.size });
    await service.releaseMotionEditorialSession(id);
    assert.equal(rooms.size, 0);
  }
  fixture.send = async (request) => {
    open(request);
    return ready(request);
  };
  await session("retained-first", async () => {
    await service.prepareMotionSceneRooms(draw);
    await Promise.all([0, 1].map(() => service.runMotionAi(V.PROMPT, V.ARTIFACT, content)));
  });
  const firstProject = fixture.sent.at(-1).projectId;
  assert.equal(rooms.size, 5);
  await session("retained-second", async () => {
    await service.prepareMotionSceneRooms(draw);
    await Promise.all([0, 1].map(() => service.runMotionAi(V.PROMPT, V.ARTIFACT, content)));
  });
  assert.equal(rooms.size, 5);
  assert.ok([...rooms.values()].every((room) => room.projectId !== firstProject));
  await session("retained-first", () => service.runMotionAi(V.PROMPT, V.ARTIFACT, content));
  assert.ok(fixture.sent.at(-1).prompt.includes(V.EDITORIAL.context), "Evicted room must restore approved context on its next request");
  await service.releaseMotionEditorialSession("retained-first");
  await service.releaseMotionEditorialSession("retained-second");
  assert.equal(rooms.size, 0);
  let challenged = true;
  const captchaReady = deferred();
  const captcha = service.MOTION_CAPTCHA;
  captcha.POLL_MS = 1;
  const page = {
    isClosed: () => false,
    title: async () => "Gemini",
    url: () => V.CAPTCHA_ROOM_URL,
    goto: async () => {},
    bringToFront: async () => {},
    locator: (selector: string) =>
      selector === captcha.BODY_SELECTOR
        ? { innerText: async () => (challenged ? V.CAPTCHA : "Gemini") }
        : {
            filter: () => ({
              count: async () => {
                captchaReady.resolve();
                return challenged ? 0 : 1;
              },
            }),
          },
  };
  fixture.captchaPage = page;
  let captchaThrown = false;
  const held = deferred(),
    full = deferred();
  let active = 0;
  fixture.send = async (request) => {
    open(request);
    if (++active === 5) full.resolve();
    if (request.artifactType === C.ARTIFACT && !captchaThrown) {
      captchaThrown = true;
      throw Object.assign(new Error(V.CAPTCHA), { roomPage: page });
    }
    await held.promise;
    return ready(request);
  };
  await within(
    session("five-room-captcha", async () => {
      await service.prepareMotionSceneRooms(draw);
      const pending = Promise.all([...Array.from({ length: 3 }, () => service.runMotionAi(V.PROMPT, C.ARTIFACT, { ...draw, chromeHeadless: true })), ...Array.from({ length: 2 }, () => service.runMotionAi(V.PROMPT, V.STORY_ARTIFACT, content))]);
      try {
        await within(captchaReady.promise);
        await within(full.promise);
        assert.equal(rooms.size, 5);
        challenged = false;
      } finally {
        held.resolve();
      }
      await pending;
    }),
  );
  assert.ok(fixture.prepared.filter((request) => request.chromeHeadless === false).every((request) => request.projectId.includes("five-room-captcha") && CONFIG.SCENE_WORKER_IDS.includes(request.workerId)));
  await service.releaseMotionEditorialSession("five-room-captcha");
  fixture.send = async (request) => {
    open(request);
    if (request.provider === P.GeminiChat) throw new Error(CHAT.PROVIDER_ERROR_RESPONSE_ERROR);
    return ready(request);
  };
  await session("block-before-warmup", () => service.runMotionAi(V.PROMPT, C.ARTIFACT, draw));
  await service.releaseMotionEditorialSession("block-before-warmup");
  assert.ok(service.motionRoomBlockedMs(P.GeminiChat, draw.model) > 0);
  fixture.send = async (request) => {
    open(request);
    return ready(request);
  };
  const sentBeforeFallback = fixture.sent.length;
  await session("prewarmed-blocked-provider", async () => {
    await service.prepareMotionSceneRooms(draw);
    await Promise.all([...Array.from({ length: 3 }, () => service.runMotionAi(V.PROMPT, C.ARTIFACT, draw)), ...Array.from({ length: 2 }, () => service.runMotionAi(V.PROMPT, V.STORY_ARTIFACT, content))]);
    assert.equal(rooms.size, 5);
    assert.ok([...rooms.values()].every((room) => room.provider !== P.GeminiChat));
  });
  assert.ok(fixture.sent.slice(sentBeforeFallback).every((request) => request.provider !== P.GeminiChat));
  await service.releaseMotionEditorialSession("prewarmed-blocked-provider");
  const lateOpened = deferred(),
    releaseWarmup = deferred();
  const abortWarmup = new AbortController();
  fixture.prepare = async (request) => {
    await releaseWarmup.promise;
    open(request);
    lateOpened.resolve();
  };
  const warmup = session("late-cancelled-warmup", () => service.prepareMotionSceneRooms(draw, abortWarmup.signal));
  const cancelledWarmup = assert.rejects(warmup, /late warmup cancelled/);
  await tick();
  abortWarmup.abort(new Error("late warmup cancelled"));
  await tick();
  releaseWarmup.resolve();
  await within(lateOpened.promise);
  await within(cancelledWarmup);
  assert.equal(rooms.size, 0, "Cancelled warmup must finish closing late-created tabs before the session completes");
  assert.equal(fixture.apiCalls, 0);
  results.push({ id: "all-lifecycle-scenarios", peakPhysicalRooms: peakRooms });
  console.log(JSON.stringify(results));
  console.log("PASS: 3 drawing + 2 shared content rooms; fallback, retained sessions, context restoration, CAPTCHA, close failure, cancellation and delayed warmup. No live AI or video render.");
} finally {
  if (service) for (const id of sessions) await service.releaseMotionEditorialSession(id);
  delete (globalThis as any).__motionAiRecovery;
  if (previousStorage === undefined) delete process.env.VIDIFY_STORAGE_DIR;
  else process.env.VIDIFY_STORAGE_DIR = previousStorage;
  if (previousData === undefined) delete process.env.APP_DATA_DIR;
  else process.env.APP_DATA_DIR = previousData;
  assert.equal(path.dirname(root), os.tmpdir());
  await fs.rm(root, { recursive: true, force: true });
}
