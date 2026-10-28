import { RUNTIME_TEXT as RT_CORE } from "../constants/runtime/core.js";
import { RUNTIME_TEXT as RT_SHARED } from "../constants/runtime/shared.js";
import { stringifyJson } from "./jsonStringify.js";
import { STUDIO_RUNTIME as XRT } from "../constants/studioRuntime.js";
import * as SRT from "../constants/sourceText.js";
import { normalizeMotionDnaResponse } from "./motionVideoDna.js";
import _ from "lodash";
import { MOTION_ANALYSIS_SCHEMA, MOTION_RESPONSE_TEXT as R } from "../constants/motionResponseContract.js";
import { motionResponseErrors, motionResponseIssues } from "./motionResponseContract.js";
import { motionDnaRepairDraft, motionDnaRepairPrompt } from "./motionDnaRepair.js";
export const normalizeMotionAnalysisResponse = (value: any): any => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  const dna = value.videoDna;
  if (!dna || typeof dna !== "object" || Array.isArray(dna)) return value;
  const restored: Record<string, unknown> = {};
  for (const key of [SRT.SOURCE_TEXT_CHAPTERS, XRT.CAST, XRT.PLACES, XRT.FACTS, XRT.LOOK, XRT.ACCENT, XRT.SFX_MOOD]) if (value[key] === undefined && dna[key] !== undefined) restored[key] = dna[key];
  return { ...value, ...restored, videoDna: normalizeMotionDnaResponse(dna) };
};
export const motionAnalysisResponseErrors = (raw: any): string[] => motionResponseErrors(raw, MOTION_ANALYSIS_SCHEMA);
export const motionAnalysisRepairPrompt = (draft: any, errors: string[], sourceContext?: string): string => {
  if (errors.every((error) => error.startsWith(RT_CORE.VIDEODNA))) return motionDnaRepairPrompt(draft, errors);
  const issues = motionResponseIssues(draft, MOTION_ANALYSIS_SCHEMA);
  const fields = [...new Set(issues.map((issue) => issue.path.split(/[.\[]/)[0]))];
  return (
    R.ANALYSIS_REPAIR +
    R.DIAGNOSTICS +
    stringifyJson({
      allowedPaths: issues.map((issue) => issue.path),
      issues,
      draft: _.pick(draft, fields),
      acceptedContext: {
        title: draft?.title,
        logline: draft?.logline,
        cast: Array.isArray(draft?.cast) ? draft.cast.map((row: any) => _.pick(row, [RT_SHARED.KEY, RT_SHARED.NAME])) : [],
        places: Array.isArray(draft?.places) ? draft.places.map((row: any) => _.pick(row, [RT_SHARED.KEY, RT_SHARED.NAME])) : [],
        chapters: Array.isArray(draft?.chapters) ? draft.chapters.map((row: any) => _.pick(row, [RT_SHARED.ID, RT_SHARED.TITLE, RT_SHARED.SUMMARY, RT_CORE.KEYPOINTS])) : [],
      },
      ...(fields.some((field) => ([RT_CORE.CAST, RT_CORE.PLACES, RT_CORE.CHAPTERS] as string[]).includes(field)) && sourceContext ? { source: sourceContext } : {}),
    })
  );
};
export const motionAnalysisRepairDraft = (draft: any, reply: any, errors: string[]): any => {
  const next = motionDnaRepairDraft(
    draft,
    reply,
    errors.filter((error) => error.startsWith(RT_CORE.VIDEODNA)),
  );
  for (const error of errors) {
    const path = error.match(R.SAFE_PATH)?.[1];
    if (!path || path.startsWith(RT_CORE.VIDEODNA) || !Object.hasOwn(MOTION_ANALYSIS_SCHEMA.properties!, path.split(/[.\[]/)[0])) continue;
    const value = _.get(reply, path);
    if (value !== undefined) _.set(next, path, _.cloneDeep(value));
  }
  return normalizeMotionAnalysisResponse(next);
};
