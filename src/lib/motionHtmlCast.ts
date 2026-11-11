import { createHash } from "node:crypto";
import { MOTION_HTML_CAST as C } from "../constants/motionHtmlCast.js";
import type { MotionBeat, MotionStoryAnalysis } from "../types/motionVideo.js";
const pick = <T>(list: readonly T[], key: string, salt: string): T => list[createHash(C.HASH).update(salt + key).digest()[0] % list.length];
const mentions = (text: string, name: string): boolean => {
  const said = new Set(text.match(C.WORD) || []);
  const words = (name.toLowerCase().match(C.WORD) || []).filter((word) => !C.TITLES.test(word));
  return words.some((word) => said.has(word));
};
export const motionHtmlCastCards = (analysis: Pick<MotionStoryAnalysis, "cast" | "groups">, beats: Pick<MotionBeat, "cast">[], template: string): string => {
  const text = template.toLowerCase();
  const keys = new Set(beats.flatMap((beat) => beat.cast || []));
  const people = (analysis.cast || []).filter((member) => !member.narrator && !C.HIDDEN.test(member.look || C.EMPTY) && (text.trim() ? mentions(text, member.name) : keys.has(member.key)));
  const groups = (analysis.groups || []).filter((group) => mentions(text, group.name) || text.includes(group.key.toLowerCase()));
  if (!people.length && !groups.length) return C.EMPTY;
  const lines = [
    ...people.map((member) => {
      const facial = C.FACIAL.test([member.look, ...(member.marks || [])].join(C.SPACE)) ? C.WITH_FACIAL : C.WITHOUT_FACIAL;
      const signature = [pick(C.BUILD, member.key, C.SALT.BUILD), pick(C.ACCENT, member.key, C.SALT.ACCENT), pick(facial, member.key, C.SALT.FACE)].join(C.JOIN);
      return C.ITEM + [member.name, member.look && C.LOOK + member.look, member.marks?.length && C.MARKS + member.marks.join(C.JOIN), member.carries?.length && C.CARRIES + member.carries.join(C.JOIN), member.skin && C.SKIN + member.skin, member.age && C.AGE + member.age, C.SIGNATURE + signature].filter(Boolean).join(C.SEP);
    }),
    ...groups.map((group) => C.ITEM + [C.GROUP + group.name, group.look && C.LOOK + group.look, group.outfit && C.OUTFIT + group.outfit, group.gear && C.GEAR + group.gear, group.skin && C.SKIN + group.skin].filter(Boolean).join(C.SEP)),
  ];
  return [C.TITLE, ...lines].join(C.NEWLINE);
};
export const motionHtmlContinuity = (continuityIn?: string): string => (continuityIn?.trim() ? C.CONTINUITY + C.NEWLINE + continuityIn.trim() : C.EMPTY);
