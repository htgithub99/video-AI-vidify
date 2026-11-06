import assert from "node:assert/strict";
/** 4-scene Remotion fixture (one moving dot per scene). `colour` changes only scene 3's artwork. */
export const segmentFixture = async (colour: string, scope: string) => {
  const { buildRemotionScenes } = await import("../src/features/motion/server/services/remotion/scenePipeline.ts");
  const { compileRemotionStory } = await import("../src/features/motion/server/services/remotion/storyCompiler.ts");
  const { puppetBeatLines } = await import("../src/lib/motionPuppet.ts");
  const { MOTION_VISUAL: V } = await import("../src/constants/motionVisual.ts");
  const { MOTION_SCENE_COMPOSITION: C } = await import("../src/constants/motionSceneComposition.ts");
  const behavior = { version: 1 as const, actors: "simple" as const, sceneEffects: "gentle" as const, camera: "fixed" as const };
  const settings: any = { version: 1, mode: "remotion", engine: "remotion", profileId: "explainer", componentRevision: 1 };
  const node: any = { id: "dot", kind: "prop", slot: "center", description: "A moving dot", evidence: "A dot moves." };
  const texts = ["The dot starts left.", "The dot moves right.", "The dot turns.", "The dot stops."];
  const script: any = { title: "Segments", language: "en", visualSettings: settings, beats: [{ id: "beat", chapterId: "c", place: "lab", visual: "scene", duration: 8, narration: texts.join(" "), utterances: texts.map((text, i) => ({ id: `u${i}`, speaker: "narrator", role: "narration", text })) }] };
  const analysis: any = { title: script.title, visualSettings: settings, cast: [], places: [{ key: "lab", name: "Lab" }], chapters: [{ id: "c", targetSeconds: 8 }] };
  const lines = puppetBeatLines(script.beats[0]);
  const art = (index: number) => ({
    svg: `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1280 720'><g id='bg'><rect width='1280' height='720' fill='#123'/></g><g id='dot'><circle cx='${200 + index * 200}' cy='360' r='60' fill='${index === 2 ? colour : "#3c3"}'/></g></svg>`,
    layers: [
      { id: "bg", kind: "background" },
      { id: "dot", kind: "prop" },
    ],
    animations: [{ target: "dot", channel: "actor", attribute: "transform", keyframes: [{ at: 0, value: "translate(0 0)" }, { at: 2, value: "translate(150 40)" }] }],
  });
  const ai: any = async (prompt: string, artifact: string) => {
    if (artifact === V.ARTIFACT_SCENE) return { scenes: lines.map((line: any, i: number) => ({ fromLineId: line.key, toLineId: line.key, purpose: `shot-${i}`, environment: "Lab", nodes: [node] })) };
    assert.equal(artifact, C.ARTIFACT);
    return art(Number(prompt.match(/shot-(\d)/)?.[1] || 0));
  };
  const built = await buildRemotionScenes(script, analysis, { exec: {}, scope, log: () => undefined, renderBehavior: behavior, ai, restart: true } as any);
  return compileRemotionStory(built, analysis, { fps: 30, durations: [8], renderBehavior: behavior }).spec;
};
