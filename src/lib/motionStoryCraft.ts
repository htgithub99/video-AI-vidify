import { MOTION_STORY_CRAFT as C } from "../constants/motionStoryCraft.js";
import type { MotionSourceCore, MotionStorySpine } from "../types/motionVideo.js";
import { motionIllustrationNeedsValid } from "./motionIllustrationNeeds.js";
const text = (value: unknown): string => (typeof value === "string" ? value.trim().slice(0, C.MAX_TEXT) : "");
const list = (value: unknown): string[] => (Array.isArray(value) ? value.map(text).filter(Boolean).slice(0, C.MAX_STEPS) : []);
const coreText = (value: unknown): string => text(Array.isArray(value) && value.length === 1 ? value[0] : value);
const causes = (value: unknown): string[] => {
  const items = list(typeof value === "string" ? [value] : value);
  return items.length === 1 ? items[0].split(C.CAUSAL_SEPARATOR).map(text).filter(Boolean).slice(0, C.MAX_STEPS) : items;
};
export const motionStoryContract = (raw: any): { sourceCore: MotionSourceCore; storySpine: MotionStorySpine } => ({
  sourceCore: { premise: coreText(raw?.sourceCore?.premise), emotionalStake: coreText(raw?.sourceCore?.emotionalStake), causalChain: causes(raw?.sourceCore?.causalChain), escalation: list(raw?.sourceCore?.escalation), reversal: coreText(raw?.sourceCore?.reversal), endingMeaning: coreText(raw?.sourceCore?.endingMeaning) },
  storySpine: {
    steps: (Array.isArray(raw?.storySpine?.steps) ? raw.storySpine.steps : []).map((s: any) => ({ chapterId: text(s?.chapterId), cause: text(s?.cause), event: text(s?.event), consequence: text(s?.consequence) })),
    clues: (Array.isArray(raw?.storySpine?.clues) ? raw.storySpine.clues : []).map((s: any) => ({ detail: text(s?.detail), setupChapterId: text(s?.setupChapterId), payoffChapterId: text(s?.payoffChapterId), payoff: text(s?.payoff) })),
  },
});
export const motionStoryContractErrors = (raw: any, ids: string[]): string[] => {
  const { sourceCore: c, storySpine: s } = motionStoryContract(raw),
    errors: string[] = [];
  const chapters = Array.isArray(raw?.chapters) ? raw.chapters : [];
  if (!motionIllustrationNeedsValid(raw)) errors.push(C.ERR_ILLUSTRATION);
  if (chapters.length !== ids.length || new Set(chapters.map((p: any) => p?.id)).size !== ids.length || ids.some((id) => !chapters.some((p: any) => p?.id === id && text(p?.summary) && list(p?.keyPoints).length))) errors.push(C.ERR_CHAPTERS);
  if (!Array.isArray(raw?.cast) || !raw.cast.some((p: any) => text(p?.key) && text(p?.name)) || !Array.isArray(raw?.places) || !raw.places.some((p: any) => text(p?.key) && text(p?.name))) errors.push(C.ERR_CAST);
  if (!c.premise || !c.emotionalStake || c.causalChain.length < C.MIN_CAUSES || !c.escalation.length || !c.reversal || !c.endingMeaning) errors.push(C.ERR_CORE);
  if (!s.steps.length || ids.some((id) => !s.steps.some((p) => p.chapterId === id)) || s.steps.some((p, i) => !ids.includes(p.chapterId) || !p.cause || !p.event || !p.consequence || (i > 0 && ids.indexOf(p.chapterId) < ids.indexOf(s.steps[i - 1].chapterId)))) errors.push(C.ERR_SPINE);
  if (!s.clues.length || s.clues.some((p) => !p.detail || !p.payoff || !ids.includes(p.setupChapterId) || !ids.includes(p.payoffChapterId) || ids.indexOf(p.setupChapterId) > ids.indexOf(p.payoffChapterId))) errors.push(C.ERR_CLUES);
  return errors;
};
