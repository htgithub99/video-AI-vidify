import { PUPPET as P } from "../constants/motionPuppet.js";
import { PA } from "../constants/motionPuppetAssets.js";
import { puppetObjectClass, puppetObjectNounFits } from "./motionPuppetAssets.js";
import type { MotionStoryAnalysis } from "../types/motionVideo.js";
import { MOTION_ILLUSTRATION_NEEDS as N } from "../constants/motionIllustrationNeeds.js";
import { MOTION_ILLUSTRATION_POLICY as I } from "../constants/motionIllustrationPolicy.js";
import { simplePuppetStates } from "./motionIllustrationPolicy.js";
import { motionValueKey } from "./motionValue.js";
import { puppetObjectParent, puppetObjectParentEvidence, puppetNestedPropIssues, normalizePuppetObjectSupport } from "./motionPropSupport.js";
import { MOTION_RESPONSE_SCHEMAS } from "../constants/motionResponseContract.js";
import { normalizeMotionResponseOptionals } from "./motionResponseContract.js";
export const normalizeMotionIllustrationNeedOptionals = <T extends Pick<MotionStoryAnalysis, "illustrationNeeds">>(analysis: T): T => ({ ...analysis, illustrationNeeds: Array.isArray(analysis.illustrationNeeds) ? analysis.illustrationNeeds.map((need) => normalizeMotionResponseOptionals(need, MOTION_RESPONSE_SCHEMAS[N.ARTIFACT].properties!.need)) : analysis.illustrationNeeds });
export const motionIllustrationCoverageKey = (analysis: Pick<MotionStoryAnalysis, "chapters" | "cast" | "places" | "storySpine" | "illustrationNeeds">, chapterId: string): string =>
  motionValueKey([analysis.chapters.find((chapter) => chapter.id === chapterId), analysis.cast.map(({ key, name }) => ({ key, name })), analysis.places, analysis.storySpine?.clues.filter((clue) => clue.setupChapterId === chapterId || clue.payoffChapterId === chapterId), analysis.illustrationNeeds?.filter((need) => need.chapterId === chapterId)]);
export const acceptMotionIllustrationAudit = (analysis: MotionStoryAnalysis, audit: unknown): MotionStoryAnalysis => {
  if (!Array.isArray(audit) || motionIllustrationNeedsErrors(analysis).length) return analysis;
  const coverage = [...(analysis.illustrationCoverage || [])];
  for (const chapter of analysis.chapters) {
    const rows = audit.filter((row) => row?.chapterId === chapter.id);
    const row = rows[0];
    const needs = (analysis.illustrationNeeds || [])
      .filter((need) => need.chapterId === chapter.id)
      .map((need) => need.id)
      .sort();
    const clues = (analysis.storySpine?.clues || []).flatMap((clue, index) => (clue.setupChapterId === chapter.id || clue.payoffChapterId === chapter.id ? [index] : []));
    const equal = (actual: unknown, expected: unknown[]) => Array.isArray(actual) && JSON.stringify([...actual].sort()) === JSON.stringify([...expected].sort());
    if (rows.length !== 1 || row.checked !== true || !equal(row.needIds, needs) || !equal(row.clueIndices, clues)) continue;
    coverage.splice(0, coverage.length, ...coverage.filter((row) => row.chapterId !== chapter.id), { version: N.COVERAGE_VERSION, chapterId: chapter.id, sourceKey: motionIllustrationCoverageKey(analysis, chapter.id), status: needs.length ? "checked_needs" : "checked_empty", needIds: needs });
  }
  return { ...analysis, illustrationCoverage: coverage };
};
export const motionIllustrationCoverageMissing = (analysis: MotionStoryAnalysis): string[] =>
  (analysis.chapters || [])
    .filter((chapter) => {
      const rows = analysis.illustrationCoverage?.filter((row) => row.chapterId === chapter.id) || [];
      const needs = (analysis.illustrationNeeds || [])
        .filter((need) => need.chapterId === chapter.id)
        .map((need) => need.id)
        .sort();
      const row = rows[0];
      return rows.length !== 1 || row.version !== N.COVERAGE_VERSION || row.sourceKey !== motionIllustrationCoverageKey(analysis, chapter.id) || row.status !== (needs.length ? "checked_needs" : "checked_empty") || !Array.isArray(row.needIds) || JSON.stringify([...row.needIds].sort()) !== JSON.stringify(needs);
    })
    .map((chapter) => chapter.id);
export const normalizeMotionIllustrationNeeds = <T extends Pick<MotionStoryAnalysis, "illustrationNeeds">>(analysis: T): T => {
  const normalized = normalizeMotionIllustrationNeedOptionals(analysis);
  return { ...normalized, illustrationNeeds: Array.isArray(normalized.illustrationNeeds) ? normalized.illustrationNeeds.map((need) => (need && Array.isArray(need.states) ? { ...need, states: simplePuppetStates(need.states, need.evidence), objects: Array.isArray(need.objects) ? need.objects.map(normalizePuppetObjectSupport) : need.objects } : need)) : normalized.illustrationNeeds };
};
export const motionIllustrationNeedsErrors = (analysis: Pick<MotionStoryAnalysis, "chapters" | "cast" | "places" | "illustrationNeeds">): string[] => {
  const errors: string[] = [];
  const fail = (path: string, expected: string) => errors.push(N.ERROR(path, expected));
  const needs = analysis && normalizeMotionIllustrationNeedOptionals(analysis).illustrationNeeds;
  if (needs === undefined) return errors;
  if (!Array.isArray(needs)) return [N.ERROR("illustrationNeeds", N.ARRAY)];
  if (!Array.isArray(analysis.chapters) || !Array.isArray(analysis.cast) || !Array.isArray(analysis.places)) return [N.ERROR("illustrationNeeds", N.CONTEXT)];
  const ids = new Set<string>();
  for (const [index, need] of needs.entries()) {
    const path = `illustrationNeeds[${index}]`;
    const chapter = analysis.chapters?.find((chapter) => chapter.id === need?.chapterId);
    const evidence = [chapter?.summary, ...(Array.isArray(chapter?.keyPoints) ? chapter.keyPoints : [])].filter(Boolean).join(P.NL);
    if (!need || typeof need.id !== "string" || !need.id || ids.has(need.id)) fail(path + ".id", N.ID);
    if (!need) continue;
    if (!chapter) fail(path + ".chapterId", N.CHAPTER);
    if (!analysis.places.some((place) => place.key === need.place)) fail(path + ".place", N.PLACE);
    if (typeof need.evidence !== "string" || !need.evidence.trim() || !evidence.includes(need.evidence)) fail(path + ".evidence", N.EVIDENCE);
    if (!Array.isArray(need.states)) fail(path + ".states", N.ARRAY);
    if (!Array.isArray(need.objects)) fail(path + ".objects", N.ARRAY);
    if (need.features !== undefined && (!Array.isArray(need.features) || need.features.some((feature) => typeof feature !== "string" || !feature.trim()))) fail(path + ".features", N.FEATURES);
    if (!Array.isArray(need.states) || !Array.isArray(need.objects)) continue;
    ids.add(need.id);
    if (
      new Set(need.states.map((state) => state?.char)).size !== need.states.length ||
      need.states.some(
        (state) =>
          !state ||
          !analysis.cast?.some((member) => member.key === state.char) ||
          !(P.POSTURES as readonly string[]).includes(state.posture || P.POSE_DEFAULT) ||
          (state.action !== undefined && !Object.hasOwn(P.ACTIONS, state.action)) ||
          ((P.TRAVEL_ACTIONS as readonly string[]).includes(state.action) && state.posture && state.posture !== P.POSE_DEFAULT) ||
          (state.support !== undefined && (typeof state.support !== "string" || !state.support.trim())) ||
          (state.essential !== undefined && typeof state.essential !== "boolean"),
      )
    )
      fail(path + ".states", N.STATES);
    for (const [stateIndex, state] of need.states.entries()) if (state?.support === need.place) fail(`${path}.states[${stateIndex}].support`, N.SUPPORT);
    const objectIds = new Set<string>();
    for (const issue of puppetNestedPropIssues(need.objects.filter(Boolean))) fail(path + ".objects", issue);
    for (const [objectIndex, object] of need.objects.entries()) {
      const objectPath = `${path}.objects[${objectIndex}]`;
      if (!object || typeof object !== "object") {
        fail(objectPath, N.OBJECT);
        continue;
      }
      if (typeof object.key !== "string" || !object.key.trim() || objectIds.has(object.key)) fail(objectPath + ".key", N.KEY);
      if (typeof object.word !== "string" || !object.word.trim()) fail(objectPath + ".word", N.OBJECT);
      if (!(P.OBJECT_TYPES as readonly string[]).includes(object.type)) fail(objectPath + ".type", N.TYPE);
      if (!(P.MOUNTS as readonly string[]).includes(object.mount)) fail(objectPath + ".mount", N.MOUNT);
      if (object.catalogKey !== undefined && (typeof object.catalogKey !== "string" || !object.catalogKey.trim())) fail(objectPath + ".catalogKey", N.KEY);
      if (typeof object.word === "string" && typeof (object.catalogKey || object.key) === "string" && !puppetObjectNounFits(object)) fail(objectPath + ".catalogKey", N.NOUN);
      if (object.support !== undefined && (typeof object.support !== "string" || !object.support.trim())) fail(objectPath + ".support", N.SUPPORT);
      if (object.requirements !== undefined && (!Array.isArray(object.requirements) || object.requirements.some((trait) => typeof trait !== "string" || !trait.trim()))) fail(objectPath + ".requirements", N.REQUIREMENTS);
      if (puppetObjectClass(object) === PA.EXCLUDED) fail(objectPath, N.OBJECT);
      for (const key of Object.keys(object)) if (!(I.OBJECT_FIELDS as readonly string[]).includes(key)) fail(objectPath + "." + key, N.UNKNOWN_FIELD);
      if (typeof object.word === "string" && (typeof need.evidence !== "string" || !need.evidence.includes(object.word))) fail(objectPath + ".word", N.WORD(object.word));
      if (object.owner !== undefined && (typeof object.owner !== "string" || !need.states.some((state) => state?.char === object.owner))) fail(objectPath + ".owner", N.OWNER);
      if (object.support === need.place) fail(objectPath + ".support", N.SUPPORT);
      const parent = puppetObjectParent(object, need.objects.filter(Boolean));
      if (parent && !puppetObjectParentEvidence(object, parent, need.evidence || P.EMPTY)) fail(objectPath + ".support", I.INVALID_PARENT);
      objectIds.add(object.key);
    }
  }
  return errors;
};
export const motionIllustrationNeedPaths = (analysis: Pick<MotionStoryAnalysis, "chapters" | "cast" | "places" | "illustrationNeeds">, index: number): string[] => {
  const prefix = `illustrationNeeds[${index}]`;
  const paths = motionIllustrationNeedsErrors(analysis)
    .filter((error) => error.startsWith(prefix + ".") || error.startsWith(prefix + ":"))
    .map((error) =>
      error
        .slice(0, error.indexOf(":"))
        .slice(prefix.length)
        .replace(/^\./, "")
        .replace(/\[(\d+)\]/g, ".$1"),
    );
  return [
    ...new Set(
      paths.flatMap((path) =>
        path.endsWith(".word")
          ? [path, "evidence"]
          : path.startsWith("objects.") &&
              path
                .split(".")
                .slice(2)
                .some((field) => !(I.OBJECT_FIELDS as readonly string[]).includes(field))
            ? ["objects"]
            : [path],
      ),
    ),
  ];
};
export const motionIllustrationNeedsValid = (analysis: Pick<MotionStoryAnalysis, "chapters" | "cast" | "places" | "illustrationNeeds">): boolean => !motionIllustrationNeedsErrors(analysis).length;
