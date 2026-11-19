import { MOTION_CHAPTER_CARD as C } from "../../../../../constants/motionChapterCard.js";
import { pickHighlightAnchor } from "../../../../../lib/highlightAnchor.js";
import type { MotionBeat, MotionChapter, MotionPlace } from "../../../../../types/motionVideo.js";
import type { MotionRemotionTimedScene } from "../../../../../types/motionVisual.js";
export const motionApplyChapterTitles = (scenes: MotionRemotionTimedScene[], args: { beats: MotionBeat[]; chapters: MotionChapter[]; places: MotionPlace[]; fps: number; language: string; aspect?: string; subtitles?: boolean }): MotionRemotionTimedScene[] => {
  const kicker = args.language === "en" ? C.KICKER.en : C.KICKER.vi;
  const seen = new Set<string>();
  const vertical = args.aspect === "9:16";
  const anchor = pickHighlightAnchor({ seed: args.chapters.map((chapter) => chapter.title).join("|"), avoid: [...(vertical ? (["tr", "mr", "br", "bl", "bc"] as const) : []), ...(args.subtitles !== false ? (["bc"] as const) : [])] });
  const lift = args.subtitles !== false && anchor[0] === "b" ? C.LIFT_WITH_SUBS : undefined;
  return scenes.map((scene) => {
    const beat = args.beats.find((item) => item.id === scene.sourceBeatIds?.[0]);
    if (!beat?.chapterId || seen.has(beat.chapterId)) return scene;
    seen.add(beat.chapterId);
    const index = args.chapters.findIndex((chapter) => chapter.id === beat.chapterId);
    const chapter = args.chapters[index];
    const length = (scene.endFrame - scene.startFrame) / args.fps;
    const seconds = Math.min(C.SECONDS, length - C.TAIL_SECONDS);
    if (!chapter?.title || seconds < C.MIN_SECONDS) return scene;
    const place = args.places.find((item) => item.key === beat.place)?.name;
    const time = scene.time || beat.time,
      subtitle = [place, typeof time === "string" ? time.trim() : ""].filter(Boolean).join(C.SUBTITLE_SEP);
    return { ...scene, titleCard: { kicker: kicker(index + 1), title: chapter.title, ...(subtitle ? { subtitle } : {}), seconds, anchor, ...(lift ? { lift } : {}) } };
  });
};
