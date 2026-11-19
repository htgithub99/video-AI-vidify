import _ from "lodash";
import { REUP_NARRATION } from "../constants/reupConfig.js";
import type { ReupBadRange, ReupSegment, ReupShot } from "../types/reup.js";
const EPS = 0.05;
const round = (n: number): number => Math.round(n * 100) / 100;
export const spanLength = (spans: ReupShot[]): number => _.sumBy(spans, (s) => Math.max(0, s.end - s.start));
export const mergeSpans = (spans: ReupShot[], gap = 0): ReupShot[] => {
  const out: ReupShot[] = [];
  for (const s of _.sortBy(
    spans.filter((x) => x.end - x.start > EPS),
    (x) => x.start,
  )) {
    const last = _.last(out);
    if (last && s.start <= last.end + gap) last.end = Math.max(last.end, s.end);
    else out.push({ start: s.start, end: s.end });
  }
  return out;
};
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
  guard?: number;
}
export interface ReupPlannedSection {
  shots: ReupShot[];
  seconds: number;
  repeated: boolean;
  filled: number;
}
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
    const guard = this.opts.guard || 0;
    this.used = mergeSpans([...this.used, { start: shot.start - guard, end: shot.end + guard }]);
    return shot;
  }
  private cut(spans: ReupShot[], seconds: number, hook: boolean, out: ReupShot[], opts: { piece?: number; jump?: number; shortest?: number } = {}): number {
    let left = seconds;
    const piece = opts.piece ?? (hook ? this.opts.hookCut : this.opts.maxShot);
    const jump = opts.jump ?? (hook ? 3 : 2);
    const shortest = opts.shortest ?? (hook ? Math.min(this.opts.minShot, this.opts.hookCut) : this.opts.minShot);
    for (const wanted of spans) {
      for (const span of this.free([wanted])) {
        let cursor = span.start;
        while (left > EPS && span.end - cursor > EPS) {
          const len = Math.min(piece, left, span.end - cursor);
          if (len < shortest - EPS && left > len + EPS) break;
          out.push(this.take({ start: cursor, end: cursor + len }));
          left -= len;
          cursor += len * jump;
        }
        if (left <= EPS) return seconds;
      }
    }
    return seconds - Math.max(0, left);
  }
  private repeat(shots: ReupShot[], covered: number, seconds: number): { covered: number; repeated: boolean } {
    if (covered >= seconds - EPS || !shots.length) return { covered, repeated: false };
    let i = 0;
    const base = shots.length;
    while (covered < seconds - EPS && i < base * 4) {
      const src = shots[i % base];
      const len = Math.min(src.end - src.start, seconds - covered);
      shots.push({ start: src.start, end: round(src.start + len) });
      covered += len;
      i++;
    }
    return { covered, repeated: true };
  }
  plan(wanted: ReupShot[], seconds: number, hook: boolean, near: ReupShot[], fill: boolean): ReupPlannedSection {
    const shots: ReupShot[] = [];
    let covered = this.cut(wanted, seconds, hook, shots);
    let filled = 0;
    if (covered < seconds - EPS && fill) {
      const before = covered;
      covered += this.cut(near, seconds - covered, hook, shots);
      filled = covered - before;
    }
    const again = this.repeat(shots, covered, seconds);
    return { shots, seconds: round(Math.min(seconds, again.covered)), repeated: again.repeated, filled: round(filled) };
  }
  planCue(at: number, scene: ReupShot, seconds: number, near: ReupShot[], piece: number, shortest = this.opts.minShot): ReupPlannedSection {
    const shots: ReupShot[] = [];
    const from = _.clamp(at, scene.start, scene.end);
    let covered = this.cut([{ start: from, end: scene.end }], seconds, false, shots, { piece, jump: 1.25, shortest });
    let filled = 0;
    if (covered < seconds - EPS) {
      const before = covered;
      covered += this.cut(near, seconds - covered, false, shots, { piece, jump: 1.25, shortest });
      filled = covered - before;
    }
    const again = this.repeat(shots, covered, seconds);
    return { shots, seconds: round(Math.min(seconds, again.covered)), repeated: again.repeated, filled: round(filled) };
  }
}
export const reupNearScenes = (segments: ReupSegment[], ids: string[], depth = 2): ReupShot[] => {
  const index = new Set(ids.map((id) => segments.findIndex((g) => g.id === id)).filter((i) => i >= 0));
  const out: ReupShot[] = [];
  for (let d = 1; d <= depth; d++)
    for (const i of index)
      for (const j of [i + d, i - d]) {
        const g = segments[j];
        if (g && !index.has(j) && !out.some((o) => o.start === g.start)) out.push({ start: g.start, end: g.end });
      }
  return out;
};
export const reupSectionSeconds = (voice: number[], roles: string[], pause: number, target: number, tailMax: number, silentShare: number, fill = true): { seconds: number[]; short: number; padding: number } => {
  const seconds = voice.map((v) => v + pause);
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
export const reupPacing = (natural: string, hasAudio = true): { share: [number, number]; cueGap: number; tailMax: number } => {
  const p = natural !== "off" && hasAudio ? REUP_NARRATION.sound : REUP_NARRATION.silent;
  return { share: [...p.share] as [number, number], cueGap: p.cueGap, tailMax: p.tailMax };
};
