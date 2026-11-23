import { MOTION_SCENE_REVISE as R } from "../constants/motionSceneSpec.js";
import { motionSceneSpecOf } from "./motionSceneSpec.js";
import { motionSceneChapters } from "./motionSceneChapters.js";
type Scene = { html?: { html?: string }; text?: string; beatId?: string; fromLineId?: string; rest?: boolean; seen?: string[] };
const CHARACTER = R.DEVICE.CHARACTER as readonly string[];
const ONCE = R.DEVICE.ONCE_A_CHAPTER as readonly string[];
export const motionDeviceRests = <T extends Scene>(scenes: T[], beats: { id: string; chapterId?: string }[] = []): T[] => {
  const chapters = motionSceneChapters(scenes, beats);
  let had = false,
    seen: string[] = [];
  return scenes.map((scene, i) => {
    const { rest: _old, seen: _seen, ...base } = scene;
    if (i && chapters[i] !== chapters[i - 1]) seen = [];
    const spec = motionSceneSpecOf(scene.html?.html),
      text = String(scene.text || "").toLowerCase();
    const speech = R.WORDS.SPEECH.some((w) => text.includes(w)),
      rest = had,
      before = seen.slice();
    const devices = spec && !spec.map ? spec.devices || [] : [];
    const shows = !rest || speech;
    had = devices.some((d) => CHARACTER.includes(String(d.kind))) && shows;
    if (shows)
      devices
        .filter((d) => ONCE.includes(String(d.kind)) && d.of && !before.includes(`${d.kind}:${d.of}`))
        .slice(0, 1)
        .forEach((d) => seen.push(`${d.kind}:${d.of}`));
    return { ...base, ...(rest ? { rest: true } : {}), ...(before.length ? { seen: before } : {}) } as T;
  });
};
