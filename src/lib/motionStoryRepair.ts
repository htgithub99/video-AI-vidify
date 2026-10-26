import { MOTION_STORY_CRAFT as C } from "../constants/motionStoryCraft.js";
import { mergeMotionRepair } from "./motionAiRepair.js";
import { MOTION_FOLK_STORY as F } from "../constants/motionFolkStory.js";
const object = (value: any): Record<string, any> => (value && typeof value === "object" && !Array.isArray(value) ? value : {});
const pick = (value: any, fields: string[]): Record<string, any> => Object.fromEntries(fields.filter((key) => Object.hasOwn(object(value), key)).map((key) => [key, value[key]]));
const chapterIds = (draft: Record<string, any>, ids: string[]): Record<string, any> => {
  if (!Array.isArray(draft.chapters) || draft.chapters.length !== ids.length) return draft;
  const keys = draft.chapters.map((chapter: any) => (typeof chapter?.id === "string" ? chapter.id.trim() : undefined));
  if (keys.some((key: string | undefined) => !key) || new Set(keys).size !== keys.length || keys.some((key: string, index: number) => ids.includes(key) && key !== ids[index])) return draft;
  const map = new Map<string, string>(keys.map((key: string, index: number) => [key, ids[index]]));
  const remap = (key: any) => map.get(typeof key === "string" ? key.trim() : key) || key;
  const spine = object(draft.storySpine);
  return {
    ...draft,
    chapters: draft.chapters.map((chapter: any, index: number) => ({ ...object(chapter), id: ids[index] })),
    ...(Array.isArray(draft.illustrationNeeds) ? { illustrationNeeds: draft.illustrationNeeds.map((need: any) => ({ ...object(need), chapterId: remap(need?.chapterId) })) } : {}),
    ...(draft.storySpine ? { storySpine: { ...spine, ...(Array.isArray(spine.steps) ? { steps: spine.steps.map((step: any) => ({ ...object(step), chapterId: remap(step?.chapterId) })) } : {}), ...(Array.isArray(spine.clues) ? { clues: spine.clues.map((clue: any) => ({ ...object(clue), setupChapterId: remap(clue?.setupChapterId), payoffChapterId: remap(clue?.payoffChapterId) })) } : {}) } } : {}),
  };
};
export const motionStoryRepairFields = (errors: string[]): string[] => [
  ...new Set(
    errors.flatMap((error) =>
      error === F.ALIGNMENT_ERROR
        ? ["topicId", "topicEvidence", "belief", "sourceCore.premise", "chapters", "storySpine"]
        : error.startsWith(F.COPY_PREFIX)
          ? ["chapters"]
          : error === C.ERR_SPINE
            ? ["storySpine.steps"]
            : error === C.ERR_CLUES
              ? ["storySpine.clues"]
              : error === C.ERR_CORE
                ? ["sourceCore"]
                : error === C.ERR_CAST
                  ? ["cast", "places"]
                  : error === C.ERR_CHAPTERS
                    ? ["chapters"]
                    : error === C.ERR_ILLUSTRATION
                      ? ["illustrationNeeds"]
                      : [],
    ),
  ),
];
export const motionStoryDraft = (raw: any, previous: any, ids: string[], allowedFields?: string[]): Record<string, any> => {
  const patch = object(raw?.[C.PATCH]);
  if (!Object.hasOwn(object(raw), C.PATCH)) {
    const initial = chapterIds(pick(raw, C.TOP_FIELDS), ids);
    return allowedFields ? mergeMotionRepair(object(previous), initial, allowedFields) : initial;
  }
  const before = object(previous);
  const draft = { ...before, ...pick(patch, C.TOP_FIELDS) };
  if (Object.hasOwn(patch, "sourceCore")) draft.sourceCore = { ...object(before.sourceCore), ...pick(patch.sourceCore, C.CORE_FIELDS) };
  if (Object.hasOwn(patch, "storySpine")) draft.storySpine = { ...object(before.storySpine), ...pick(patch.storySpine, C.SPINE_FIELDS) };
  if (Array.isArray(patch.chapters)) {
    const incoming = patch.chapters.map((chapter: any) => pick(chapter, C.CHAPTER_FIELDS));
    if (new Set(incoming.map((chapter: any) => chapter.id)).size === incoming.length && incoming.every((chapter: any) => ids.includes(chapter.id))) {
      const changes = new Map(incoming.map((chapter: any) => [chapter.id, chapter]));
      const existing = Array.isArray(before.chapters) ? before.chapters : [];
      draft.chapters = ids.flatMap((id) => {
        const original = existing.find((chapter: any) => chapter?.id === id);
        return original || changes.has(id) ? [{ ...object(original), ...changes.get(id) }] : [];
      });
    }
  }
  return allowedFields ? mergeMotionRepair(before, draft, allowedFields) : draft;
};
export const motionStoryIssueLabels = (errors: string[]): string[] => [...new Set(errors.map((error) => (error === F.ALIGNMENT_ERROR ? F.TOPIC_LABEL : error.startsWith(F.COPY_PREFIX) ? F.COPY_LABEL : C.LABELS[error.match(C.ERROR_PREFIX_RE)?.[1] || ""] || error)))];
