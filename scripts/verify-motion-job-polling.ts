import assert from "node:assert/strict";
import { pollMotionJob } from "../src/components/motion-video/motionApi.ts";
import { MOTION_JOB_POLLING as C } from "../src/constants/motionJobPolling.ts";
import { MOTION_JOB_POLLING_VERIFICATION as V } from "./motionJobPollingVerificationTexts.ts";
import { MotionJobStatus } from "../src/types/motionVideo.ts";
const originalFetch = globalThis.fetch;
const originalConfig = { ...C };
const running = { id: V.JOB_ID, status: MotionJobStatus.RENDERING, progress: 0 };
const finished = { ...running, status: MotionJobStatus.COMPLETED, progress: 1 };
const response = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status });
const within = async <T>(work: Promise<T>): Promise<T> => {
  let timer: ReturnType<typeof setTimeout>;
  try {
    return await Promise.race([
      work,
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => reject(new Error(V.TIMEOUT)), V.WAIT_MS);
      }),
    ]);
  } finally {
    clearTimeout(timer!);
  }
};
const done = (job: typeof running) => job.status === MotionJobStatus.COMPLETED;
try {
  Object.assign(C, { REQUEST_TIMEOUT_MS: V.REQUEST_TIMEOUT_MS, RETRY_INTERVAL_MS: V.RETRY_INTERVAL_MS, MAX_RETRY_INTERVAL_MS: V.MAX_RETRY_INTERVAL_MS });
  const calls: { url: string; method?: string }[] = [];
  const sequence = [
    () => response({}, 503),
    () => response({ job: running }),
    () => {
      throw new TypeError(V.NETWORK_ERROR);
    },
    () => new Response(V.BAD_JSON),
    () => response({ job: {} }),
    () => response({}, 429),
    () => response({ job: finished }),
  ];
  globalThis.fetch = async (input, init) => {
    calls.push({ url: String(input), method: init?.method });
    return sequence.shift()!();
  };
  const updates: (typeof running)[] = [];
  let reconnects = 0;
  const final = await within(
    pollMotionJob(
      V.STATUS_URL,
      (job: typeof running) => updates.push(job),
      done,
      undefined,
      1,
      () => reconnects++,
    ),
  );
  assert.deepEqual(final, finished);
  assert.deepEqual(updates, [running, finished]);
  assert.equal(reconnects, 2);
  assert.equal(calls.length, 7);
  assert.ok(calls.every((call) => call.url === V.STATUS_URL && call.method === undefined));
  let timeouts = 0,
    requests = 0;
  globalThis.fetch = async (_input, init) => {
    if (requests++) return response({ job: finished });
    return new Promise<Response>((_resolve, reject) =>
      init!.signal!.addEventListener(
        V.ABORT,
        () => {
          timeouts++;
          reject(init!.signal!.reason);
        },
        { once: true },
      ),
    );
  };
  assert.deepEqual(await within(pollMotionJob(V.STATUS_URL, () => undefined, done)), finished);
  assert.equal(timeouts, 1);
  assert.equal(requests, 2);
  for (const status of [401, 404]) {
    let calls = 0;
    globalThis.fetch = async () => {
      calls++;
      return response({}, status);
    };
    await assert.rejects(
      pollMotionJob(V.STATUS_URL, () => undefined, done),
      (error: any) => error.status === status,
    );
    assert.equal(calls, 1);
  }
  globalThis.fetch = async () => response({ job: running });
  await assert.rejects(
    pollMotionJob(
      V.STATUS_URL,
      () => {
        throw new Error(V.CALLBACK_ERROR);
      },
      done,
    ),
    { message: V.CALLBACK_ERROR },
  );
  const stopWaiting = new AbortController();
  globalThis.fetch = async () => {
    stopWaiting.abort();
    throw new TypeError(V.NETWORK_ERROR);
  };
  await assert.rejects(within(pollMotionJob(V.STATUS_URL, () => undefined, done, stopWaiting.signal)), { name: V.ABORT_ERROR });
  const stopBackoff = new AbortController();
  globalThis.fetch = async () => {
    throw new TypeError(V.NETWORK_ERROR);
  };
  await assert.rejects(
    within(
      pollMotionJob(
        V.STATUS_URL,
        () => undefined,
        done,
        stopBackoff.signal,
        1,
        () => stopBackoff.abort(),
      ),
    ),
    { name: V.ABORT_ERROR },
  );
  const stopRequest = new AbortController();
  globalThis.fetch = async (_input, init) =>
    new Promise<Response>((_resolve, reject) => {
      init!.signal!.addEventListener(V.ABORT, () => reject(init!.signal!.reason), { once: true });
      stopRequest.abort();
    });
  await assert.rejects(within(pollMotionJob(V.STATUS_URL, () => undefined, done, stopRequest.signal)), { name: V.ABORT_ERROR });
  process.stdout.write(V.PASSED);
} finally {
  globalThis.fetch = originalFetch;
  Object.assign(C, originalConfig);
}
