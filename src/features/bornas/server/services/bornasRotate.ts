import _ from "lodash";
import { BORNAS_BUSTS, BORNAS_ROTATION } from "../../constants/bornasConfig.js";
import type { BornasBeat, BornasCast } from "./bornasShots.js";
type Comp = (typeof BORNAS_ROTATION.ORDER)[number] | "solo";
const castOf = (sprite: string): BornasCast => ({ sprite, slot: "c", place: "ground", swap: [] });
export const rotateBornasBeats = (beats: BornasBeat[], kinds: Map<string, string>): Record<string, number> => {
  const ids = _.uniq([...kinds.keys()].filter((n) => n.endsWith(`${BORNAS_BUSTS.SUFFIX}r`)).map((n) => n.slice(0, -`${BORNAS_BUSTS.SUFFIX}r`.length)));
  const idOf = (sprite: string): string | undefined =>
    _.maxBy(
      ids.filter((id) => sprite.startsWith(`${id}_`) && !sprite.includes(BORNAS_BUSTS.SUFFIX)),
      (id) => id.length,
    );
  const bust = (id: string, view: string) => `${id}${BORNAS_BUSTS.SUFFIX}${view}`;
  const counts = _.countBy(beats.flatMap((b) => b.cast.map((c) => idOf(c.sprite)).filter(Boolean)));
  const hero = _.maxBy(Object.keys(counts), (id) => counts[id]);
  const stats: Record<string, number> = {};
  let k = 0,
    last = "",
    prevBg = "",
    current: string | undefined;
  const recent: string[] = [];
  for (const b of beats) {
    if (b.kind !== "scene" || !b.bg || b.montage || b.endCard) {
      last = b.kind;
      continue;
    }
    if (b.bg !== prevBg) {
      k = recent.slice(-BORNAS_ROTATION.RECENT).includes(b.bg) ? 1 : 0;
      prevBg = b.bg;
    }
    recent.push(b.bg);
    const own = b.cast.map((c) => idOf(c.sprite)).find((id) => id && id === hero) || b.cast.map((c) => idOf(c.sprite)).find(Boolean);
    if (own) current = own;
    const lead = own || (k % 2 ? current : undefined);
    const others = b.cast
      .filter((c) => !c.crowd)
      .map((c) => idOf(c.sprite))
      .filter((id): id is string => !!id && id !== lead);
    const prop = b.cast.find((c) => !c.crowd && (BORNAS_ROTATION.PROP_KINDS as readonly string[]).includes(kinds.get(c.sprite) || ""))?.sprite;
    const target = b.label?.cast ?? b.bubble?.cast;
    const targetId = target !== undefined ? idOf(b.cast[target]?.sprite || "") : undefined;
    let comp: Comp = "wide";
    if (k > 0 && target !== undefined) comp = targetId && targetId === lead ? (last === "L" ? "R" : "L") : targetId ? "solo" : "wide";
    else if (k > 0)
      comp =
        _.range(BORNAS_ROTATION.ORDER.length)
          .map((s) => BORNAS_ROTATION.ORDER[(k + s) % BORNAS_ROTATION.ORDER.length])
          .find((want) => want !== last && (want === "wide" || (lead && (want === "L" || want === "R" || want === "talk")) || (want === "two" && lead && others.length) || (want === "prop" && prop && !b.label && !b.bubble))) || "wide";
    if (comp !== "wide") {
      const keep = { label: b.label, bubble: b.bubble };
      if (comp === "prop") {
        b.cast = [castOf(prop!)];
      } else {
        b.kind = "bust";
        b.cast = comp === "two" ? [castOf(bust(lead!, "r")), castOf(bust(others[0], "l"))] : comp === "solo" ? [castOf(bust(targetId!, "l"))] : [castOf(bust(lead!, BORNAS_ROTATION.VIEW[comp]))];
        b.slot = comp === "two" ? 0 : comp === "solo" ? 1 : BORNAS_ROTATION.SLOT[comp];
      }
      const at = comp === "two" && targetId && targetId !== lead ? 1 : 0;
      if (keep.label) b.label = { ...keep.label, cast: at };
      if (keep.bubble) b.bubble = { ...keep.bubble, cast: at };
      b.subject = 0;
    }
    stats[comp] = (stats[comp] || 0) + 1;
    last = comp;
    k++;
  }
  return stats;
};
