import { motionSceneBeat } from "./motionSceneChapters.js";
import { motionSceneSpecOf } from "./motionSceneSpec.js";
import { motionDrawnTime, motionTimeCue } from "./motionTimeline.js";
type Scene = { html?: { html?: string }; text?: string; beatId?: string; fromLineId?: string; time?: string; drawTime?: string };
export const motionDrawnTimes = <T extends Scene>(scenes: T[], beats: { id: string; time?: string }[] = []): T[] => {
  const specs = scenes.map((scene) => motionSceneSpecOf(scene.html?.html));
  const beatOf = scenes.map((scene) => motionSceneBeat(scene, beats)?.id || scene.beatId || "");
  const cued = scenes.map((scene) => !!motionTimeCue(String(scene.text || "")));
  const drawn = scenes.map((scene, i) => (specs[i] && !specs[i]!.map ? motionDrawnTime(specs[i]!.time, String(scene.text || ""), scene.time || motionSceneBeat(scene, beats)?.time) : undefined));
  drawn.forEach((t, i) => {
    if (!t || cued[i] || !i || beatOf[i] !== beatOf[i - 1] || !drawn[i - 1]) return;
    drawn[i] = drawn[i - 1];
  });
  drawn.forEach((t, i) => {
    const a = drawn[i - 1],
      b = drawn[i + 1];
    if (t && !cued[i] && a && a === b && t !== a) drawn[i] = a;
  });
  return scenes.map((scene, i) => {
    const { drawTime: _old, ...base } = scene;
    return (drawn[i] ? { ...base, drawTime: drawn[i] } : base) as T;
  });
};
