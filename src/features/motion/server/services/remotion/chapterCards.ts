import { MOTION_CHAPTER_CARD as C } from "../../../../../constants/motionChapterCard.js";
import type { MotionBeat, MotionChapter, MotionPlace } from "../../../../../types/motionVideo.js";
import type { MotionRemotionTimedScene } from "../../../../../types/motionVisual.js";

/** Puts each chapter's title over the start of its first scene (lower third), like a documentary chapter card. */
export const motionApplyChapterTitles = (scenes: MotionRemotionTimedScene[], args: { beats: MotionBeat[]; chapters: MotionChapter[]; places: MotionPlace[]; fps: number; language: string }): MotionRemotionTimedScene[] => {
  const kicker = args.language === "en" ? C.KICKER.en : C.KICKER.vi;
  const seen = new Set<string>();
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
    const subtitle = [place, typeof beat.time === "string" ? beat.time.trim() : ""].filter(Boolean).join(C.SUBTITLE_SEP);
    return { ...scene, titleCard: { kicker: kicker(index + 1), title: chapter.title, ...(subtitle ? { subtitle } : {}), seconds } };
  });
};
