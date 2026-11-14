import * as RT_MAINTENANCE from "../../../../../constants/runtime/maintenance.js";
import { MOTION_CHAPTER_CARD as C } from "../../../../../constants/motionChapterCard.js";
import { motionInputKey } from "../motionFileUtils.js";
import type { MotionBeat, MotionChapter, MotionVoiceClip } from "../../../../../types/motionVideo.js";
import type { MotionRemotionTimedScene } from "../../../../../types/motionVisual.js";
const roman = (value: number): string => {
  let rest = Math.max(1, Math.round(value));
  let out = "";
  for (const [mark, size] of C.ROMAN)
    while (rest >= size) {
      out += mark;
      rest -= size;
    }
  return out;
};
export const motionChapterCardHtml = (input: { number: number; title: string; subtitle?: string; profile: string }): string => {
  const palette = C.PALETTE[input.profile] || C.PALETTE[C.FALLBACK_PROFILE];
  const data = JSON.stringify({ ...palette, number: roman(input.number), title: input.title, subtitle: input.subtitle || "", fade: C.FADE_SECONDS }).replace(C.LT, C.LT_ESCAPED);
  return C.HTML(data);
};
export const motionInsertChapterCards = (
  scenes: MotionRemotionTimedScene[],
  args: { beats: MotionBeat[]; chapters: MotionChapter[]; clips?: MotionVoiceClip[]; ends: number[]; fps: number; chapterEnd: number; profile: string; language: string; subtitles: boolean },
): MotionRemotionTimedScene[] => {
  const out = [...scenes];
  for (let index = 0; index + 1 < args.beats.length; index++) {
    const beat = args.beats[index],
      next = args.beats[index + 1];
    if (beat.chapterId === next.chapterId) continue;
    const spoken = (args.clips || []).filter((clip) => clip.beatId === beat.id).map((clip) => clip.end);
    const speechEnd = spoken.length ? Math.max(...spoken) : args.ends[index];
    const at = out.findIndex((scene) => scene.sourceBeatIds?.[0] === next.id);
    if (at < 1) continue;
    const previous = out[at - 1];
    const startFrame = Math.round((speechEnd + args.chapterEnd) * args.fps);
    const endFrame = out[at].startFrame;
    if (endFrame - startFrame < C.MIN_SECONDS * args.fps || startFrame <= previous.startFrame + args.fps) continue;
    const chapterIndex = args.chapters.findIndex((chapter) => chapter.id === next.chapterId);
    const chapter = args.chapters[chapterIndex];
    if (!chapter?.title) continue;
    const subtitle = args.subtitles ? [next.place, next.time].filter((value) => typeof value === C.STRING && value).join(C.SUBTITLE_SEP) : "";
    const html = motionChapterCardHtml({ number: chapterIndex + 1, title: chapter.title, subtitle, profile: args.profile });
    const hash = motionInputKey(html);
    out[at - 1] = { ...previous, endFrame: startFrame, speaking: (previous.speaking || []).flatMap((item) => (item.startFrame < startFrame ? [{ ...item, endFrame: Math.min(item.endFrame, startFrame) }] : [])) };
    out.splice(at, 0, {
      id: C.ID(chapter.id),
      renderer: RT_MAINTENANCE.HTML_CANVAS,
      beatId: beat.id,
      sourceBeatIds: [],
      fromLineId: "",
      toLineId: "",
      purpose: C.PURPOSE,
      text: chapter.title,
      environment: "",
      sourceKey: hash,
      soundEvents: [],
      speaking: [],
      nodes: [],
      startFrame,
      endFrame,
      html: { version: 1, html, hash, prompt: "", language: args.language, seed: hash, duration: (endFrame - startFrame) / args.fps, attempts: 1, figureKit: false, status: RT_MAINTENANCE.READY },
    });
  }
  return out;
};
