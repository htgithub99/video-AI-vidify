import * as MR from "../constants/motionRuntime.js";
import _ from "lodash";
import { MOTION_DRAW_BUDGET, MOTION_DRAW_KIND, MOTION_DRAW_LOG } from "../constants/motionDrawBudget.js";
export type MotionDrawKind = (typeof MOTION_DRAW_KIND)[keyof typeof MOTION_DRAW_KIND];
export interface MotionDrawBudget { limit: number; used: Record<MotionDrawKind, number>; chars: number[]; }
export const createMotionDrawBudget = (limit: number = MOTION_DRAW_BUDGET.LIMIT): MotionDrawBudget => ({ limit, used: { character: 0, pose: 0, location: 0 }, chars: [] });
export const motionDrawUsed = (budget?: MotionDrawBudget): number => (budget ? _.sum(_.values(budget.used)) : 0);
export const motionDrawLeft = (budget?: MotionDrawBudget): number => (budget ? Math.max(0, budget.limit - motionDrawUsed(budget)) : Infinity);
export const motionDrawSpend = (budget: MotionDrawBudget | undefined, kind: MotionDrawKind, chars: number): boolean => {
  if (!budget) return true;
  if (motionDrawLeft(budget) <= 0) return false;
  budget.used[kind] += 1;
  budget.chars.push(chars);
  return true;
};
export const motionDrawSummary = (budget: MotionDrawBudget): string => MOTION_DRAW_LOG.SUMMARY(motionDrawUsed(budget), budget.used.character, budget.used.pose, budget.used.location, budget.chars.length ? (_.mean(budget.chars) / 1000).toFixed(1) : MR.MOTION_TEXT_0, budget.limit);
