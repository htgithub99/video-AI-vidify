type Scene = { beatId?: string; fromLineId?: string };
type Beat = { id: string; chapterId?: string; place?: string; time?: string };
export const motionSceneBeat = <B extends Beat>(scene: Scene, beats: B[]): B | undefined => beats.find((b) => b.id === String(scene.fromLineId || "").split("::")[0]) || beats.find((b) => b.id === scene.beatId);
export const motionSceneChapters = (scenes: Scene[], beats: Beat[]): string[] => {
  let last = "";
  return scenes.map((scene) => (last = motionSceneBeat(scene, beats)?.chapterId || last));
};
