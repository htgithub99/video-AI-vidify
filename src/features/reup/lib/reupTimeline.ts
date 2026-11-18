import _ from "lodash";
import type { ReupBadRange, ReupSegment, ReupShot } from "../types/reup.js";
const EPS = 0.05;
const round = (n: number): number => Math.round(n * 100) / 100;
export const spanLength = (spans: ReupShot[]): number => _.sumBy(spans, (s) => Math.max(0, s.end - s.start));
/** Sorted, merged copy. */
export const mergeSpans = (spans: ReupShot[], gap = 0): ReupShot[] => {
  const out: ReupShot[] = [];
  for (const s of _.sortBy(spans.filter((x) => x.end - x.start > EPS), (x) => x.start)) {
    const last = _.last(out);
    if (last && s.start <= last.end + gap) last.end = Math.max(last.end, s.end);
    else out.push({ start: s.start, end: s.end });
  }
  return out;
};
/** Parts of `spans` not covered by `cuts`. */
export const subtractSpans = (spans: ReupShot[], cuts: ReupShot[]): ReupShot[] => {
  const blocks = mergeSpans(cuts);
  const out: ReupShot[] = [];
  for (const span of mergeSpans(spans)) {
    let cursor = span.start;
    for (const cut of blocks) {
      if (cut.end <= cursor || cut.start >= span.end) continue;
      if (cut.start > cursor) out.push({ start: cursor, end: cut.start });
      cursor = Math.max(cursor, cut.end);
    }
    if (span.end - cursor > EPS) out.push({ start: cursor, end: span.end });
  }
  return out.filter((s) => s.end - s.start > EPS);
};
export interface ReupTimelineOptions {
  duration: number;
  bad: ReupBadRange[];
  minShot: number;
  maxShot: number;
  hookCut: number;
}
export interface ReupPlannedSection {
  shots: ReupShot[];
  seconds: number;
  /** Footage ran out and some source time was shown twice. */
  repeated: boolean;
  /** Pulled from scenes the script did not ask for. */
  filled: number;
}
/**
 * Owns which source seconds are already on screen, so no moment repeats across sections or outputs
 * that share this ledger. Every cut avoids the dark/blurry ranges found in step 1.
 */
export class ReupFootageLedger {
  private used: ReupShot[] = [];
  constructor(private readonly opts: ReupTimelineOptions) {}
  free(spans: ReupShot[] = [{ start: 0, end: this.opts.duration }]): ReupShot[] {
    const inside = spans.map((s) => ({ start: _.clamp(s.start, 0, this.opts.duration), end: _.clamp(s.end, 0, this.opts.duration) }));
    return subtractSpans(subtractSpans(inside, this.opts.bad), this.used);
  }
  freeSeconds(): number {
    return spanLength(this.free());
  }
  private take(span: ReupShot): ReupShot {
    const shot = { start: round(span.start), end: round(span.end) };
    this.used = mergeSpans([...this.used, shot]);
    return shot;
  }
  /** Cut pieces from `spans` in order until `seconds` are covered. Hook pieces are short; body pieces jump forward inside long shots. */
  private cut(spans: ReupShot[], seconds: number, hook: boolean, out: ReupShot[]): number {
    let left = seconds;
    const piece = hook ? this.opts.hookCut : this.opts.maxShot;
    const shortest = hook ? Math.min(this.opts.minShot, this.opts.hookCut) : this.opts.minShot;
    for (const wanted of spans) {
      for (const span of this.free([wanted])) {
        let cursor = span.start;
        while (left > EPS && span.end - cursor > EPS) {
          const len = Math.min(piece, left, span.end - cursor);
          if (len < shortest - EPS && left > len + EPS) break;
          out.push(this.take({ start: cursor, end: cursor + len }));
          left -= len;
          cursor += len * (hook ? 3 : 2);
        }
        if (left <= EPS) return seconds;
      }
    }
    return seconds - Math.max(0, left);
  }
  /**
   * Fill `seconds` for one section: the script's own shots first, then (if allowed) unused scenes
   * ranked by value and closeness in time, and only as a last resort footage already shown.
   */
  plan(wanted: ReupShot[], seconds: number, hook: boolean, pool: ReupSegment[], fill: boolean): ReupPlannedSection {
    const shots: ReupShot[] = [];
    let covered = this.cut(wanted, seconds, hook, shots);
    let filled = 0;
    if (covered < seconds - EPS && fill) {
      const anchor = _.last(wanted)?.end ?? _.last(shots)?.end ?? 0;
      const ranked = _.orderBy(pool, [(s) => -s.value, (s) => Math.abs(s.start - anchor)]);
      const before = covered;
      covered += this.cut(ranked, seconds - covered, hook, shots);
      if (covered < seconds - EPS) covered += this.cut([{ start: 0, end: this.opts.duration }], seconds - covered, hook, shots);
      filled = covered - before;
    }
    let repeated = false;
    if (covered < seconds - EPS && shots.length) {
      repeated = true;
      let i = 0;
      while (covered < seconds - EPS && i < shots.length * 4) {
        const src = shots[i % shots.length];
        const len = Math.min(src.end - src.start, seconds - covered);
        shots.push({ start: src.start, end: round(src.start + len) });
        covered += len;
        i++;
      }
    }
    return { shots, seconds: round(Math.min(seconds, covered)), repeated, filled: round(filled) };
  }
}
/**
 * Seconds each section lasts: its voice plus the breath after it, then — for long videos — natural-sound tails
 * spread evenly over the body sections toward the target length: at most `tailMax` each and `silentShare` of the
 * whole; what is still missing is reported (`short`) instead of padded. `fill = false` adds none.
 */
export const reupSectionSeconds = (voice: number[], roles: string[], pause: number, target: number, tailMax: number, silentShare: number, fill = true): { seconds: number[]; short: number; padding: number } => {
  const seconds = voice.map((v) => v + pause);
  // Silent footage after a section may stretch a video toward its target, but never past `silentShare` of the result:
  // a video carried mostly by someone else's footage with no words of ours is what YouTube calls reused content.
  const room = silentShare >= 1 ? Number.POSITIVE_INFINITY : (silentShare / (1 - silentShare)) * _.sum(voice);
  let missing = Math.min(target - _.sum(seconds), room);
  const bodies = roles.map((role, i) => (role === "hook" ? -1 : i)).filter((i) => i >= 0);
  const tails = seconds.map(() => 0);
  if (fill && missing > EPS && bodies.length) {
    while (missing > EPS) {
      const open = bodies.filter((i) => tails[i] < tailMax - EPS);
      if (!open.length) break;
      const share = missing / open.length;
      for (const i of open) {
        const add = Math.min(share, tailMax - tails[i]);
        tails[i] += add;
        missing -= add;
      }
    }
  }
  const out = seconds.map((s, i) => round(s + tails[i]));
  return { seconds: out, short: round(Math.max(0, target - _.sum(out))), padding: round(_.sum(tails)) };
};
