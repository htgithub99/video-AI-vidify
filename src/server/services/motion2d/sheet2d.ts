import _ from "lodash";
import { createHash } from "crypto";
import { MOTION_BOARD2D as B } from "../../../constants/motionBoard2d.js";
import { MOTION_VIDEO_CONSTANTS } from "../../../constants/motionVideo.js";
import type { MotionSpec } from "../../../types/motionVideo.js";
import { genPreviewDir, genPreviewRel } from "../motionGenService.js";
import { openStillSession } from "../motionRenderService.js";

export interface Board2dSheetItem { t: number; start: number; end: number; text: string; file: string; }

export const board2dSentenceSpans = (spec: MotionSpec): { start: number; end: number; text: string }[] => {
  const shots = _.filter(spec.shots, { template: MOTION_VIDEO_CONSTANTS.TEMPLATE_2D });
  const inside = (t: number) => _.some(shots, (s) => t >= s.start && t < s.end);
  const subs = _.sortBy(_.filter(spec.subtitles || [], (u) => inside((u.start + u.end) / 2)), B.F_START);
  const groups: { start: number; end: number; text: string }[] = [];
  let cur: { start: number; end: number; text: string } | null = null;
  for (const u of subs) {
    if (!cur) cur = { start: u.start, end: u.end, text: u.text };
    else {
      cur.end = u.end;
      cur.text += B.SPACE + u.text;
    }
    if (B.END_RE.test(u.text)) {
      groups.push(cur);
      cur = null;
    }
  }
  if (cur) groups.push(cur);
  const merged: typeof groups = [];
  for (const gq of groups) {
    const prev = _.last(merged);
    if (prev && gq.end - gq.start < B.MIN_SENT && gq.start - prev.end < 0.5) {
      prev.end = gq.end;
      prev.text += B.SPACE + gq.text;
    } else merged.push({ ...gq });
  }
  return _.take(merged, B.SHEET_MAX);
};

export const board2dSheet = async (spec: MotionSpec): Promise<Board2dSheetItem[]> => {
  const spans = board2dSentenceSpans(spec);
  if (!spans.length) return [];
  const key = createHash(B.SHA).update(JSON.stringify([spans, spec.gen?.board2d?.sentences || {}, _.map(spec.shots, "id")])).digest(B.HEX).slice(0, 16);
  const dir = genPreviewDir(B.SHEET_DIR, key);
  const picks = _.map(spans, (s, i) => ({ id: B.SHEET_PREFIX + _.padStart(String(i), 3, B.PAD_CHAR), t: +(s.start + (s.end - s.start) * B.SHEET_AT).toFixed(3) }));
  const session = await openStillSession();
  try {
    const out = await session.render(spec, picks, dir, { width: B.SHEET_W, height: B.SHEET_H });
    return _.map(out, (o, i) => ({ t: o.t, start: spans[i].start, end: spans[i].end, text: spans[i].text, file: genPreviewRel(o.file) }));
  } finally {
    await session.close();
  }
};
