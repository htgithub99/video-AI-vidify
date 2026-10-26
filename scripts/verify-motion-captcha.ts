import assert from "node:assert/strict";
import { build } from "esbuild";
import { chromium } from "playwright";
import { MOTION_CAPTCHA as C } from "../src/constants/motionCaptcha.ts";
import { createMotionCaptchaAlert } from "../src/lib/motionAlertBeep.ts";
import { MOTION_CAPTCHA_VERIFICATION as V } from "./motionCaptchaVerificationTexts.ts";
assert.equal(C.BEEP.COUNT, 5);
let alerts = 0;
const notify = createMotionCaptchaAlert(() => alerts++);
const waitLog = C.LOG_WAIT(V.PROVIDER);
notify(V.JOB, undefined);
notify(V.JOB, [V.NORMAL_LOG]);
assert.equal(alerts, 0);
notify(V.JOB, [V.NORMAL_LOG, waitLog]);
notify(V.JOB, [V.NORMAL_LOG, waitLog]);
assert.equal(alerts, 1);
notify(V.JOB, [waitLog, C.LOG_REMIND(V.PROVIDER, 1)]);
notify(V.JOB, [waitLog, C.LOG_REMIND(V.PROVIDER, 1)]);
assert.equal(alerts, 2);
notify(V.OTHER_JOB, [waitLog]);
assert.equal(alerts, 3);
const bundle = await build({ entryPoints: [V.ENTRY], bundle: true, platform: V.BROWSER, format: V.IIFE, globalName: V.GLOBAL, write: false });
const browser = await chromium.launch({ channel: V.CHROME, headless: true, args: [V.AUTOPLAY_POLICY] });
try {
  const page = await browser.newPage();
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(V.NAME_SHIM);
  await page.route(V.PAGE_URL, (route) => route.fulfill({ contentType: V.HTML_TYPE, body: V.HTML }));
  await page.addInitScript(
    ({ job, log, bundle }) => {
      (0, eval)(bundle);
      const fixture = { contexts: [] as AudioContext[], tones: [] as { start: number; stop: number; frequency: number; gain: number }[], dispose: () => {}, notify: (_id: string, _lines?: string[]) => {} };
      (window as any).fixture = fixture;
      const NativeContext = window.AudioContext;
      (window as any).AudioContext = class extends NativeContext {
        constructor() {
          super();
          fixture.contexts.push(this);
        }
        createOscillator() {
          const osc = super.createOscillator();
          const tone = { start: 0, stop: 0, frequency: 0, gain: 0 };
          fixture.tones.push(tone);
          const start = osc.start.bind(osc),
            stop = osc.stop.bind(osc),
            connect = osc.connect.bind(osc);
          osc.start = (at = 0) => {
            tone.start = at;
            tone.frequency = osc.frequency.value;
            start(at);
          };
          osc.stop = (at = 0) => {
            tone.stop = at;
            stop(at);
          };
          osc.connect = ((node: GainNode) => {
            tone.gain = node.gain.value;
            return connect(node);
          }) as typeof osc.connect;
          return osc;
        }
      };
      const api = (window as any).MotionCaptchaAudio;
      fixture.dispose = api.initMotionAlertAudio();
      fixture.notify = api.createMotionCaptchaAlert();
      fixture.notify(job, [log]);
    },
    { job: V.JOB, log: waitLog, bundle: bundle.outputFiles[0].text },
  );
  await page.goto(V.PAGE_URL);
  assert.deepEqual(await page.evaluate(() => ({ contexts: (window as any).fixture.contexts.length, tones: (window as any).fixture.tones.length, state: (window as any).fixture.contexts[0].state })), { contexts: 1, tones: 0, state: "suspended" });
  await page.locator(V.BUTTON).click();
  await page.waitForFunction(() => (window as any).fixture.tones.length === 5, undefined, { timeout: V.TIMEOUT_MS });
  await page.evaluate(
    ({ job, log, remind }) => {
      const f = (window as any).fixture;
      f.notify(job, [log]);
      f.notify(job, [log, remind]);
      f.notify(job, [log, remind]);
    },
    { job: V.JOB, log: waitLog, remind: C.LOG_REMIND(V.PROVIDER, 1) },
  );
  await page.waitForFunction(() => (window as any).fixture.tones.length === 10, undefined, { timeout: V.TIMEOUT_MS });
  const capture = await page.evaluate(() => ({ contexts: (window as any).fixture.contexts.length, state: (window as any).fixture.contexts[0].state, tones: (window as any).fixture.tones as { start: number; stop: number; frequency: number; gain: number }[] }));
  assert.equal(capture.contexts, 1);
  assert.equal(capture.state, C.AUDIO_RUNNING);
  assert.equal(capture.tones.length, 10);
  for (const [index, tone] of capture.tones.entries()) {
    assert.equal(tone.frequency, C.BEEP.FREQ);
    assert.ok(Math.abs(tone.gain - C.BEEP.GAIN) < V.TOLERANCE);
    assert.ok(Math.abs(tone.stop - tone.start - C.BEEP.ON_MS / 1000) < V.TOLERANCE);
    if (index) assert.ok(tone.start - capture.tones[index - 1].stop >= C.BEEP.GAP_MS / 1000 - V.TOLERANCE);
  }
  await page.waitForFunction(
    () => {
      const f = (window as any).fixture;
      return f.contexts[0].currentTime > f.tones.at(-1).stop;
    },
    undefined,
    { timeout: V.TIMEOUT_MS },
  );
  assert.equal(await page.evaluate(() => (window as any).fixture.contexts[0].state), C.AUDIO_RUNNING);
  await page.evaluate(() => (window as any).fixture.contexts[0].suspend());
  await page.evaluate(({ job, log }) => (window as any).fixture.notify(job, [log]), { job: V.OTHER_JOB, log: waitLog });
  await page.waitForFunction(() => (window as any).fixture.tones.length === 15, undefined, { timeout: V.TIMEOUT_MS });
  await page.evaluate(() => (window as any).fixture.dispose());
  await page.waitForFunction(() => (window as any).fixture.contexts[0].state === "closed", undefined, { timeout: V.TIMEOUT_MS });
  assert.deepEqual(errors, []);
  process.stdout.write(V.PASSED);
} finally {
  await browser.close();
}
