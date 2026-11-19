import { MOTION_MASTER as M, type MotionMasterShot } from "../constants/motionMasterScale.js";
export type MotionMasterContext = { frame?: readonly [number, number]; shot?: string; kind?: string; interior?: boolean; genre?: string; profile?: string };
export type MotionMasterTarget = { shot: MotionMasterShot; lo: number; hi: number; target: number; base: number; px: { lo: number; hi: number; target: number } };
export const motionMasterGenre = (genre?: string, profile?: string): keyof typeof M.GENRE => {
  if (profile === "horror" || M.GENRE_WORDS.horror.test(genre || "")) return "horror";
  if (M.GENRE_WORDS.story.test(genre || "")) return "story";
  if (M.GENRE_WORDS.documentary.test(genre || "")) return "documentary";
  return "default";
};
export const motionMasterBase = (frame: readonly [number, number] = [1280, 720]): number => (frame[1] > frame[0] ? frame[0] * M.PORTRAIT_WIDTH : frame[1]);
export const motionMasterShot = (ctx: MotionMasterContext): MotionMasterShot => {
  if (ctx.kind === "map") return "map";
  if (ctx.interior) return "interior";
  return /establish|extreme|landscape|overhead|aerial/i.test(ctx.shot || "") ? "ews" : "ws";
};
export const motionMasterTarget = (ctx: MotionMasterContext): MotionMasterTarget => {
  const shot = motionMasterShot(ctx),
    [lo, hi] = M.SHOTS[shot],
    base = motionMasterBase(ctx.frame);
  const lean = shot === "ws" ? M.GENRE[motionMasterGenre(ctx.genre, ctx.profile)] : (lo + hi) / 2;
  const target = Math.min(hi, Math.max(lo, lean));
  return { shot, lo, hi, target, base, px: { lo: Math.round(lo * base), hi: Math.round(hi * base), target: Math.round(target * base) } };
};
