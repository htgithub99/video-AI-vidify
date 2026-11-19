import { MOTION_CAST_MARKS as M } from "../constants/motionTimeline.js";
import type { MotionCastMember } from "../types/motionVideo.js";
const hash = (text: string) => [...text].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);
export const motionCastMarks = (cast: MotionCastMember[] | undefined): Record<string, Record<string, string>> =>
  Object.fromEntries(
    (cast || [])
      .map((member) => {
        const look = member.look || "",
          marks: Record<string, string> = {};
        if (M.CAPE.test(look)) marks.cape = M.CAPES[hash(member.key) % M.CAPES.length];
        if (M.FUR.test(look)) marks.trim = M.FUR_TRIM;
        return [member.key, marks] as const;
      })
      .filter(([, marks]) => Object.keys(marks).length),
  );
