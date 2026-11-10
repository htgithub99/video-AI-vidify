import type { Locator, Page } from "playwright";
import { HUMAN_INTERACTION as H } from "../../constants/humanInteraction.js";
import { appLog } from "../../lib/logger.js";
type Point = { x: number; y: number };
type SendState = { nextAt: number; sends: number; breakAfter: number };
const pointers = new WeakMap<Page, Point>();
const sendStates = new Map<string, SendState>();
const sendQueues = new Map<string, Promise<void>>();
const between = ([min, max]: readonly [number, number]): number => min + Math.random() * (max - min);
const wholeBetween = (range: readonly [number, number]): number => Math.round(between(range));
const sleep = (ms: number, signal?: AbortSignal): Promise<void> =>
  new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(signal.reason);
    const timer = setTimeout(() => {
      signal?.removeEventListener(H.ABORT_EVENT, stop);
      resolve();
    }, ms);
    const stop = () => {
      clearTimeout(timer);
      reject(signal?.reason);
    };
    signal?.addEventListener(H.ABORT_EVENT, stop, { once: true });
  });
const ease = (t: number): number => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
export const humanPause = (range: readonly [number, number]): Promise<void> => sleep(between(range));
const startPoint = (page: Page): Point => {
  const known = pointers.get(page);
  if (known) return known;
  const size = page.viewportSize() || { width: 1280, height: 800 };
  return { x: size.width * (0.5 + (Math.random() - 0.5) * H.START_ZONE), y: size.height * (0.5 + (Math.random() - 0.5) * H.START_ZONE) };
};
export const humanMoveTo = async (page: Page, target: Point): Promise<void> => {
  const from = startPoint(page);
  const dx = target.x - from.x;
  const dy = target.y - from.y;
  const distance = Math.hypot(dx, dy);
  const steps = Math.max(H.MIN_STEPS, Math.min(H.MAX_STEPS, Math.round(distance / H.PIXELS_PER_STEP)));
  const bend = (Math.random() - 0.5) * 2 * H.CURVE_SPREAD * distance;
  const nx = distance ? -dy / distance : 0;
  const ny = distance ? dx / distance : 0;
  const c1 = { x: from.x + dx * 0.3 + nx * bend, y: from.y + dy * 0.3 + ny * bend };
  const c2 = { x: from.x + dx * 0.7 + nx * bend * 0.6, y: from.y + dy * 0.7 + ny * bend * 0.6 };
  for (let step = 1; step <= steps; step++) {
    const t = ease(step / steps);
    const u = 1 - t;
    const x = u * u * u * from.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * target.x;
    const y = u * u * u * from.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * target.y;
    const jitter = step < steps ? H.JITTER_PX : 0;
    await page.mouse.move(x + (Math.random() - 0.5) * jitter, y + (Math.random() - 0.5) * jitter);
    await humanPause(H.STEP_DELAY_MS);
  }
  pointers.set(page, target);
};
export const humanClick = async (page: Page, locator: Locator, timeout?: number): Promise<void> => {
  try {
    await locator.scrollIntoViewIfNeeded({ timeout }).catch(() => undefined);
    const box = await locator.boundingBox({ timeout });
    if (!box || box.width <= 0 || box.height <= 0) throw new Error();
    const target = { x: box.x + box.width * (0.5 + (Math.random() - 0.5) * H.TARGET_ZONE), y: box.y + box.height * (0.5 + (Math.random() - 0.5) * H.TARGET_ZONE) };
    await humanMoveTo(page, target);
    await humanPause(H.HOVER_MS);
    await page.mouse.down();
    await humanPause(H.PRESS_MS);
    await page.mouse.up();
  } catch {
    await locator.click({ noWaitAfter: true, timeout });
  }
};
const hostOf = (page: Page): string => {
  try {
    return new URL(page.url()).host || H.UNKNOWN_HOST;
  } catch {
    return H.UNKNOWN_HOST;
  }
};
export const waitHumanSendTurn = async (page: Page, signal?: AbortSignal): Promise<void> => {
  const host = hostOf(page);
  const previous = sendQueues.get(host) || Promise.resolve();
  let release: () => void = () => undefined;
  const current = new Promise<void>((resolve) => (release = resolve));
  sendQueues.set(host, previous.then(() => current));
  try {
    await previous;
    signal?.throwIfAborted();
    const state = sendStates.get(host) || { nextAt: 0, sends: 0, breakAfter: wholeBetween(H.BREAK_EVERY_SENDS) };
    let waitMs = Math.max(0, state.nextAt - Date.now());
    if (state.sends >= state.breakAfter) {
      waitMs = Math.max(waitMs, between(H.BREAK_MS));
      appLog(H.BREAK_LOG(host, Math.round(waitMs / 1000)));
      state.sends = 0;
      state.breakAfter = wholeBetween(H.BREAK_EVERY_SENDS);
    } else if (waitMs > 1000) appLog(H.SEND_WAIT_LOG(host, Math.round(waitMs / 1000)));
    if (waitMs > 0) await sleep(waitMs, signal);
    signal?.throwIfAborted();
    await humanPause(H.THINK_BEFORE_SEND_MS);
    state.sends += 1;
    state.nextAt = Date.now() + between(H.SEND_GAP_MS);
    sendStates.set(host, state);
  } finally {
    release();
  }
};
