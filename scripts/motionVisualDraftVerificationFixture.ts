const settings = { version: 1, mode: "remotion", engine: "remotion", profileId: "horror", componentRevision: 1 };
const beats = Array.from({ length: 18 }, (_, i) => ({ id: `beat_${i}`, chapterId: "chapter_1", narration: `Người khách nhìn về phía cửa, cảnh thứ ${i + 1}.`, visual: "scene", place: "room" }));
const scenes = beats.map((beat, i) => ({ id: beat.id + ":0", beatId: beat.id, fromLineId: beat.id, toLineId: beat.id, purpose: beat.narration, text: beat.narration, place: beat.place, environment: "wooden house", nodes: [], sourceKey: beat.id, startFrame: i * 60, endFrame: (i + 1) * 60 }));
const analysis = { title: "Saved visual draft", visualSettings: settings, look: "folk horror", cast: [], places: [{ key: "room", name: "Nhà" }], chapters: [{ id: "chapter_1", title: "Đêm", targetSeconds: 36 }], facts: [], logline: "A visitor waits by a door." };
const script = { title: analysis.title, language: "vi", visualSettings: settings, beats, gen: { style: {}, cast: {}, locations: {}, staging: {}, previews: {}, locationInfo: {}, failed: [], remotion: { version: 1, settings, assets: {}, scenes: Object.fromEntries(scenes.map((scene) => [scene.beatId, [scene]])), inputKeys: {}, failures: {} } } };
export const MOTION_VISUAL_DRAFT_FIXTURE = {
  input: { visualSettings: settings, aspect: "16:9", fps: 30, subtitles: true },
  job: { id: "visual-draft-production", productionId: "visual-draft-production", kind: "production", status: "completed", log: [] },
  result: {
    analysis,
    script,
    compiled: { spec: { engine: "remotion", title: analysis.title, version: 1, aspect: "16:9", fps: 30, width: 1280, height: 720, duration: 36, profileId: "horror", motion: false, assets: {}, scenes, subtitles: [{ start: 0, end: 36, text: "Câu chuyện minh họa." }] }, sfxCues: [], missing: [] },
    rendered: { id: "visual-draft-output", title: analysis.title, fileName: "visual-draft-output.mp4", videoUrl: "/fixture.mp4" },
  },
};
