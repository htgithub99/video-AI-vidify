import type { MotionSeoPack } from "../../../types/motionVideo.js";
import type { ReupJob, ReupOutputResult } from "../types/reup.js";
export const reupSeoChapters = (output?: ReupOutputResult): MotionSeoPack["chapters"] => (output?.chapters || []).map((c, i) => ({ id: `c${i + 1}`, t: c.t, title: c.title }));
export const reupSeoPack = (job: ReupJob): MotionSeoPack | null => (job.package?.options?.length ? { options: job.package.options, chapters: reupSeoChapters(job.outputs[0]), timingFrom: "voice", scriptKey: job.id } : null);
const TOOL_NOTE = /\b(?:AI|A\.I\.|TTS|text[- ]to[- ]speech)\b|trí tuệ nhân tạo|giọng (?:đọc|nói) (?:máy|tự động|tổng hợp)|音声合成|인공지능/i;
export const reupStripToolNotes = (text: string): string =>
  text
    .split("\n")
    .map((line) =>
      TOOL_NOTE.test(line)
        ? (line.match(/[^.!?。！？]+[.!?。！？]*\s*/g) || [line])
            .filter((part) => !TOOL_NOTE.test(part))
            .join("")
            .trim()
        : line,
    )
    .filter((line, i, all) => line.trim() || (i > 0 && all[i - 1].trim()))
    .join("\n")
    .trim();
