import _ from "lodash";
import { BORNAS_BUSTS, BORNAS_ROTATION } from "../../constants/bornasConfig.js";
import type { BornasBeat, BornasCast } from "./bornasShots.js";
type Comp = (typeof BORNAS_ROTATION.ORDER)[number];
export interface BornasBustReport {
  share: number;
  inRow: number;
  repeats: number;
}
const castOf = (sprite: string): BornasCast => ({ sprite, slot: "c", place: "ground", swap: [] });
export const rotateBornasBeats = (beats: BornasBeat[], kinds: Map<string, string>, total: number): { stats: Record<string, number>; busts: BornasBustReport } => {
  const suffix = `${BORNAS_BUSTS.SUFFIX}r`;
  const ids = _.uniq([...kinds.keys()].filter((n) => n.endsWith(suffix)).map((n) => n.slice(0, -suffix.length)));
  const idOf = (sprite: string): string | undefined =>
    _.maxBy(
      ids.filter((id) => sprite.startsWith(`${id}_`) && !sprite.includes(BORNAS_BUSTS.SUFFIX)),
      (id) => id.length,
    );
  const bust = (id: string, view: string) => `${id}${BORNAS_BUSTS.SUFFIX}${view}`;
  const counts = _.countBy(beats.flatMap((b) => b.cast.map((c) => idOf(c.sprite)).filter(Boolean)));
  const hero = _.maxBy(Object.keys(counts), (id) => counts[id]);
  const end = (i: number): number => beats[i + 1]?.t0 ?? total;
  const used = new Map<string, number>();
  const view = (id: string, t: number): string | undefined =>
    _.minBy(
      BORNAS_BUSTS.NEUTRAL.map((v) => bust(id, v)).filter((n) => kinds.has(n) && t - (used.get(n) ?? -Infinity) >= BORNAS_ROTATION.REPEAT_GAP),
      (n) => used.get(n) ?? -Infinity,
    );
  const stats: Record<string, number> = {};
  let k = 0,
    last = "",
    prevBg = "",
    prevBust = false,
    bustTime = 0,
    lastBust = -Infinity,
    closeNext = false;
  const recent: string[] = [];
  let lastSig = "",
    sigRun = 0;
  beats.forEach((b, i) => {
    const dur = end(i) - b.t0;
    const roomFor = (): boolean => !prevBust && b.t0 - lastBust >= BORNAS_ROTATION.BUST_GAP && (bustTime + dur) / Math.max(1, total) <= BORNAS_ROTATION.BUST_SHARE;
    if (b.kind !== "scene" || !b.bg || b.montage || b.endCard) {
      if (b.kind === "bust") {
        for (const c of b.cast) used.set(c.sprite, b.t0);
        bustTime += dur;
        lastBust = end(i);
      }
      prevBust = b.kind === "bust";
      last = b.kind;
      return;
    }
    if (b.bg !== prevBg) {
      k = recent.slice(-BORNAS_ROTATION.RECENT).includes(b.bg) ? 1 : 0;
      prevBg = b.bg;
    }
    recent.push(b.bg);
    const people = b.cast.map((c, n) => ({ id: idOf(c.sprite), n, crowd: !!c.crowd })).filter((p): p is { id: string; n: number; crowd: boolean } => !!p.id && !p.crowd);
    const lead = people.find((p) => p.id === hero) || people[0];
    const others = people.filter((p) => p.id !== lead?.id);
    const prop = b.cast.find((c) => !c.crowd && (BORNAS_ROTATION.PROP_KINDS as readonly string[]).includes(kinds.get(c.sprite) || ""))?.sprite;
    const target = b.label?.cast ?? b.bubble?.cast;
    const talking = !!b.bubble && lead && b.bubble.cast === lead.n;
    const leadView = lead && view(lead.id, b.t0);
    const fits = (want: Comp): boolean =>
      want === "wide" ||
      (want === "act" && !!people.length) ||
      (want === "prop" && !!prop && !b.label && !b.bubble) ||
      (want === "two" && !!leadView && !!others.length && target === undefined && roomFor() && kinds.has(bust(others[0].id, "l"))) ||
      (want === "bust" && !!leadView && (target === undefined || talking) && roomFor());
    let comp: Comp = "wide";
    if (k > 0 && talking && fits("bust")) comp = "bust";
    else if (k > 0 && target !== undefined) comp = "act";
    else if (k > 0)
      comp =
        _.range(BORNAS_ROTATION.ORDER.length)
          .map((s) => BORNAS_ROTATION.ORDER[(k + s) % BORNAS_ROTATION.ORDER.length])
          .find((want) => want !== last && fits(want)) || "wide";
    // the same place at most REPEAT_SAME wide shots in a row (four near-identical wides at Little Bighorn): then frame a
    // person medium or show the object. Beats with the same figures merge into one shot anyway, so only the place counts.
    const sig = b.bg;
    sigRun = sig === lastSig ? sigRun + 1 : 1;
    lastSig = sig;
    if (comp === "wide" && sigRun > BORNAS_ROTATION.REPEAT_SAME) {
      const anyone = b.cast.findIndex((c) => !c.crowd && kinds.get(c.sprite) === "person");
      if (anyone >= 0) {
        b.frame = "medium";
        b.subject = anyone;
        comp = "act";
        sigRun = 0;
      } else if (prop && !b.label && !b.bubble) comp = "prop";
    }
    if (comp === "act" && lead) {
      b.frame = "medium";
      b.subject = target !== undefined && b.cast[target] ? target : lead.n;
    } else if (comp === "prop") {
      const keep = b.plate;
      const pointed = keep && keep.at !== null ? b.cast[keep.at]?.sprite : undefined;
      b.cast = [castOf(prop!)];
      b.subject = 0;
      if (keep) b.plate = { ...keep, at: pointed === prop ? 0 : null };
    } else if (comp === "bust" || comp === "two") {
      const keep = { label: b.label, bubble: b.bubble };
      b.kind = "bust";
      b.cast = comp === "two" ? [castOf(leadView!), castOf(bust(others[0].id, "l"))] : [castOf(leadView!)];
      if (comp === "bust") {
        b.frame = closeNext ? "close" : "medium";
        closeNext = !closeNext;
      }
      for (const c of b.cast) used.set(c.sprite, b.t0);
      if (keep.label) b.label = { ...keep.label, cast: 0 };
      if (keep.bubble) b.bubble = { ...keep.bubble, cast: 0 };
      b.subject = 0;
      bustTime += dur;
      lastBust = end(i);
    }
    prevBust = b.kind === "bust";
    stats[comp] = (stats[comp] || 0) + 1;
    last = comp;
    k++;
  });
  const runs = beats.reduce((a, b) => (b.kind === "bust" ? { cur: a.cur + 1, max: Math.max(a.max, a.cur + 1) } : { cur: 0, max: a.max }), { cur: 0, max: 0 });
  const per = _.countBy(beats.filter((b) => b.kind === "bust").flatMap((b) => b.cast.map((c) => c.sprite)));
  return { stats, busts: { share: _.round(bustTime / Math.max(1, total), 2), inRow: runs.max, repeats: Math.max(0, ...Object.values(per)) } };
};
