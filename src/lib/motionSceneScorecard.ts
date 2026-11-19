import type { MotionRemotionScene } from "../types/motionVisual.js";
import { motionCatalogWord } from "./motionObjectCatalog.js";
import { motionSceneSpecSplit } from "./motionSceneSpec.js";
export type MotionSceneScorecard = { total: number; first: number; redrawn: number; warned: number; offMessage: number; fallback: number; gaps: { fn: string; kind: string; reason: string; scenes: number }[] };
export const motionSceneScorecard = (scenes: MotionRemotionScene[]): MotionSceneScorecard => {
  const lacks = (scene: MotionRemotionScene) => motionSceneSpecSplit(scene.html?.warnings).issues.length > 0;
  const gaps = new Map<string, MotionSceneScorecard["gaps"][number]>();
  for (const scene of scenes)
    for (const gap of scene.html?.gaps || []) {
      const key = `${gap.fn}:${motionCatalogWord(gap.kind)}:${gap.reason}`;
      const row = gaps.get(key) || { fn: gap.fn, kind: gap.kind + (gap.build ? `/${gap.build}` : ""), reason: gap.reason, scenes: 0 };
      row.scenes++;
      gaps.set(key, row);
    }
  return {
    total: scenes.length,
    first: scenes.filter((scene) => (scene.html?.attempts || 1) <= 1 && !lacks(scene)).length,
    redrawn: scenes.filter((scene) => (scene.html?.attempts || 1) > 1 && !scene.html?.fallback).length,
    warned: scenes.filter((scene) => lacks(scene) && !scene.html?.fallback).length,
    offMessage: scenes.filter((scene) => scene.offMessage?.length).length,
    fallback: scenes.filter((scene) => scene.html?.fallback).length,
    gaps: [...gaps.values()].sort((a, b) => b.scenes - a.scenes || a.kind.localeCompare(b.kind)),
  };
};
