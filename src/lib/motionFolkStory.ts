import { RUNTIME_TEXT as RT_SHARED } from "../constants/runtime/shared.js";
import { stringifyJson } from "./jsonStringify.js";
import { MOTION_FOLK_STORY as F } from "../constants/motionFolkStory.js";
import { MOTION_FOLK_BELIEFS } from "../constants/motionFolkBeliefs.js";
import type { MotionFolkStoryContract, MotionStoryAnalysis } from "../types/motionVideo.js";
import { MOTION_RESPONSE_SCHEMAS } from "../constants/motionResponseContract.js";
import { motionResponseIssues } from "./motionResponseContract.js";
const words = (text: string): string[] =>
  String(text || "")
    .normalize(RT_SHARED.NFC)
    .toLowerCase()
    .match(F.WORDS) || [];
const plain = (text: string): string => words(text).join(F.SPACE);
const contains = (text: string, term: string): boolean => !!plain(term) && (F.SPACE + plain(text) + F.SPACE).includes(F.SPACE + plain(term) + F.SPACE);
export const motionFolkContractGuide = (contract?: MotionFolkStoryContract): string => ([F.PROFILE, contract ? F.CONTRACT_LABEL + stringifyJson(contract) : ""] as string[]).filter(Boolean).join(RT_SHARED.SYMBOL_01BA47);
export const motionFolkTopicErrors = (raw: any, source: string): string[] => {
  if (motionResponseIssues(raw, MOTION_RESPONSE_SCHEMAS[F.TOPIC_ARTIFACT]).length) return [F.TOPIC_ERROR];
  return [...(!source.includes(raw.evidence) ? [F.TOPIC_EVIDENCE_ERROR] : []), ...(!raw.aliases.some((alias: string) => contains(raw.evidence, alias)) ? [F.TOPIC_ALIAS_ERROR] : [])];
};
export const motionFolkTopicValid = (raw: any, source: string): boolean => !motionFolkTopicErrors(raw, source).length;
export const motionFolkTopicContract = (raw: any, sourceKey: string): MotionFolkStoryContract => ({
  version: F.VERSION,
  profileId: F.PROFILE_ID,
  sourceKey,
  topic: { id: plain(raw.name).replace(/ /g, RT_SHARED.SYMBOL_D2E2AD), name: raw.name.trim(), meaning: raw.meaning.trim(), aliases: [...new Set<string>([raw.name, ...raw.aliases].map((value) => value.trim()))].slice(0, F.ALIASES_MAX), evidence: raw.evidence.trim() },
});
export const motionKnownFolkContract = (title: string, source: string, sourceKey: string): MotionFolkStoryContract | undefined => {
  const ranked = MOTION_FOLK_BELIEFS.map((belief) => ({ belief, title: belief.aliases.some((alias) => contains(title, alias)), count: belief.aliases.reduce((sum, alias) => sum + (F.SPACE + plain(source) + F.SPACE).split(F.SPACE + plain(alias) + F.SPACE).length - 1, 0) }))
    .filter((entry) => entry.title || entry.count > 0)
    .sort((a, b) => Number(b.title) - Number(a.title) || b.count - a.count);
  const chosen = ranked[0]?.belief;
  if (!chosen) return undefined;
  const data = title + RT_SHARED.SYMBOL_01BA47 + source;
  const alias = chosen.aliases.find((alias) => data.toLowerCase().includes(alias.toLowerCase()));
  if (!alias) return undefined;
  const at = data.toLowerCase().indexOf(alias.toLowerCase());
  return motionFolkTopicContract({ name: chosen.name, meaning: chosen.meaning.split(RT_SHARED.SYMBOL_CDB4EE)[0], aliases: chosen.aliases, evidence: data.slice(Math.max(0, at - 50), at + alias.length + 100) }, sourceKey);
};
export const motionFolkCopied = (text: string, source: string): boolean => {
  const wanted = words(text),
    original = words(source);
  if (wanted.length < F.COPY_WORDS || original.length < F.COPY_WORDS) return false;
  const phrases = new Set(Array.from({ length: original.length - F.COPY_WORDS + 1 }, (_, index) => original.slice(index, index + F.COPY_WORDS).join(F.SPACE)));
  return wanted.some((_, index) => index + F.COPY_WORDS <= wanted.length && phrases.has(wanted.slice(index, index + F.COPY_WORDS).join(F.SPACE)));
};
export const motionFolkStoryErrors = (raw: any, contract: MotionFolkStoryContract, source: string): string[] => {
  const errors: string[] = [],
    chapters: any[] = Array.isArray(raw?.chapters) ? raw.chapters : [];
  const evidence: any[] = Array.isArray(raw?.topicEvidence) ? raw.topicEvidence : [];
  const matching =
    evidence.length &&
    evidence.every((item) => typeof item?.quote === "string" && !!item.quote.trim() && chapters.some((chapter) => chapter.id === item.chapterId && [chapter.summary, ...(Array.isArray(chapter.keyPoints) ? chapter.keyPoints : [])].some((text) => typeof text === "string" && text.includes(item.quote)))) &&
    evidence.some((item) => contract.topic.aliases.some((alias) => contains(item.quote, alias)));
  const subject = (value: string) => contract.topic.aliases.some((alias) => contains(value, alias));
  const steps = raw?.storySpine?.steps;
  const causal = !Array.isArray(steps) || !steps.length || steps.some((step: any) => [step.cause, step.event, step.consequence].some(subject));
  const belief = contract.topic.aliases.some((alias) => plain(raw?.belief?.name) === plain(alias));
  if (raw?.topicId !== contract.topic.id || !belief || !matching || (raw?.sourceCore?.premise && !subject(raw.sourceCore.premise)) || !causal) errors.push(F.ALIGNMENT_ERROR);
  for (const chapter of chapters) if (motionFolkCopied([chapter.summary, ...(Array.isArray(chapter.keyPoints) ? chapter.keyPoints : [])].join(F.SPACE), source)) errors.push(F.COPY_ERROR(chapter.id));
  return errors;
};
export const scopeMotionFolkStoryRepair = (raw: any, errors: string[]): any => {
  if (!errors.length || !errors.every((error) => error.startsWith(F.COPY_PREFIX))) return raw;
  const ids = new Set(errors.map((error) => error.slice(F.COPY_PREFIX.length).split(RT_SHARED.SYMBOL_E7AC07)[0]));
  const incoming = raw?.patch || raw;
  return { patch: { chapters: Array.isArray(incoming?.chapters) ? incoming.chapters.filter((chapter: any) => ids.has(chapter?.id)) : [] } };
};
export const motionFolkTextDrifts = (text: string, contract: MotionFolkStoryContract | undefined, approved: string): boolean => !!contract && MOTION_FOLK_BELIEFS.some((belief) => !belief.aliases.some((alias) => contract.topic.aliases.some((subject) => plain(alias) === plain(subject))) && belief.aliases.some((alias) => contains(text, alias) && !contains(approved, alias)));
export const motionFolkChapterContext = (analysis: { sourceCore?: unknown; storySpine?: { steps: { chapterId: string }[]; clues: { setupChapterId: string; payoffChapterId: string }[] }; folkStoryContract?: MotionFolkStoryContract }, chapterId: string) => ({
  folkStoryContract: analysis.folkStoryContract,
  sourceCore: analysis.sourceCore,
  storySpine: analysis.storySpine ? { steps: analysis.storySpine.steps.filter((step) => step.chapterId === chapterId), clues: analysis.storySpine.clues.filter((clue) => clue.setupChapterId === chapterId || clue.payoffChapterId === chapterId) } : undefined,
});
export const motionFolkChapterWritingContext = (analysis: MotionStoryAnalysis, chapterId: string) => {
  const context = motionFolkChapterContext(analysis, chapterId);
  const core = analysis.sourceCore;
  const contract = analysis.folkStoryContract;
  return { folkStoryContract: contract ? { profileId: contract.profileId, topic: { id: contract.topic.id, name: contract.topic.name, meaning: contract.topic.meaning, aliases: contract.topic.aliases } } : undefined, sourceCore: core ? { premise: core.premise, emotionalStake: core.emotionalStake, endingMeaning: core.endingMeaning } : undefined, storySpine: context.storySpine };
};
