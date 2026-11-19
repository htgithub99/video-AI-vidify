import { MOTION_SCENE_REVISE as R, MOTION_SCENE_SPEC as S } from "../constants/motionSceneSpec.js";
import { motionSceneSpecOf } from "./motionSceneSpec.js";
import type { MotionSceneSpec } from "../types/motionSceneSpec.js";
export type MotionCrossing = { over: string; x: number; wide: number; build?: string; near: "left" | "right"; sides: Record<string, "left" | "right"> };
type Scene = { html?: { html?: string }; locationKey?: string; beatId?: string; fromLineId?: string; text?: string; crossing?: MotionCrossing };
const C = R.CROSS;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const median = (list: number[]): number | undefined => (list.length ? list.slice().sort((a, b) => a - b)[list.length >> 1] : undefined);
const bandOf = (spec: MotionSceneSpec) => spec.water?.find((w) => (C.KINDS as readonly string[]).includes(w.kind) && w.h > 0);
const needs = (spec: MotionSceneSpec, text: string) => {
  const band = bandOf(spec);
  if (!band || spec.map || spec.interior) return false;
  return spec.items.some((it) => it.fn === "bridge" && (it.y ?? 0) >= band.y - 4 && (it.y ?? 0) <= band.y + band.h + 4) || R.WORDS.ACROSS.some((w) => text.includes(w)) || R.WORDS.ON_DECK.some((w) => text.includes(w));
};
export const motionCrossingSites = <T extends Scene>(scenes: T[], beats: { id: string; place?: string }[] = []): T[] => {
  const placeOf = (scene: T) => beats.find((b) => b.id === String(scene.fromLineId || "").split("::")[0])?.place || beats.find((b) => b.id === scene.beatId)?.place || scene.locationKey || scene.beatId || "";
  const read = scenes.map((scene) => ({ scene, spec: motionSceneSpecOf(scene.html?.html), key: placeOf(scene), text: String(scene.text || "").toLowerCase() }));
  const sites = new Map<string, typeof read>();
  read.forEach((r) => {
    if (r.key && r.spec && bandOf(r.spec)) sites.set(r.key, [...(sites.get(r.key) || []), r]);
  });
  const out = new Map<T, MotionCrossing>();
  sites.forEach((list) => {
    if (!list.some((r) => needs(r.spec!, r.text))) return;
    const bridges = list.flatMap((r) => r.spec!.items.filter((it) => it.fn === "bridge").map((it) => ({ it, W: r.spec!.frame?.[0] || S.WIDTH })));
    const x = clamp(median(bridges.map((b) => (b.it.x ?? b.W * C.X) / b.W)) ?? C.X, C.X_RANGE[0], C.X_RANGE[1]);
    const wide = clamp(median(bridges.map((b) => (b.it.w ?? 0) / b.W / C.SPAN).filter((v) => v > 0)) ?? C.WIDE, C.WIDE_RANGE[0], C.WIDE_RANGE[1]);
    const build = bridges.map((b) => String((b.it.look as Record<string, unknown> | undefined)?.build || "")).find(Boolean);
    const near: "left" | "right" = x > 0.5 ? "left" : "right",
      far: "left" | "right" = near === "left" ? "right" : "left";
    const votes: Record<string, number> = {};
    list.forEach((r) => {
      const band = bandOf(r.spec!)!;
      r.spec!.items.forEach((it) => {
        const region = String((it.look as Record<string, unknown> | undefined)?.region || "");
        if (it.fn !== "person" || !region || it.y == null) return;
        const v = it.bank === "far" || it.y < band.y ? 1 : it.bank === "near" || it.y > band.y + band.h ? -1 : 0;
        votes[region] = (votes[region] || 0) + v * (it.group?.count || 1);
      });
    });
    const ranked = Object.entries(votes)
      .filter(([, v]) => v !== 0)
      .sort((a, b) => b[1] - a[1]);
    const sides = Object.fromEntries(ranked.map(([region, v], i) => [region, ranked.length > 1 && (i === 0 || i === ranked.length - 1) ? (i === 0 ? far : near) : v > 0 ? far : near])) as Record<string, "left" | "right">;
    const over = list.map((r) => bandOf(r.spec!)!.kind).find((k) => k !== "stream") || "river";
    const crossing: MotionCrossing = { over, x: Math.round(x * 1000) / 1000, wide: Math.round(wide * 1000) / 1000, ...(build ? { build } : {}), near, sides };
    list.forEach((r) => out.set(r.scene, crossing));
  });
  return scenes.map((scene) => (out.has(scene) ? { ...scene, crossing: out.get(scene) } : scene));
};
