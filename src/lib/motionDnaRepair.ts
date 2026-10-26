import _ from "lodash";
import { MOTION_PRODUCTION as P } from "../constants/motionProduction.js";
import { normalizeMotionDnaResponse, VIDEO_DNA_PLANNING_INSTRUCTIONS, VIDEO_DNA_PROFILE_INSTRUCTIONS } from "./motionVideoDna.js";
import { MOTION_PROMPT as C } from "../constants/motionPrompt.js";
import { MOTION_DNA_CORE_SCHEMA, MOTION_DNA_PROFILE_SCHEMA, MOTION_RESPONSE_TEXT } from "../constants/motionResponseContract.js";
import { motionResponseIssues } from "./motionResponseContract.js";
export const motionDnaRepairPrompt = (draft: any, errors: string[]): string => {
  const paths = errors.map((error) => error.match(P.DNA_ERROR_PATH)?.[1]).filter((path): path is string => !!path && !P.DNA_UNSAFE_PATH.test(path));
  const groups = [...new Set(paths.map((path) => path.split(/[.\[]/)[0]))];
  const complete = paths.length !== errors.length;
  return P.DNA_REPAIR(
    JSON.stringify({ ..._.pick(draft, ["title", "logline"]), videoDna: complete ? draft.videoDna : _.pick(draft.videoDna, groups), cast: _.map(draft.cast, (row) => _.pick(row, ["key", "name", "age", "gender"])), places: _.map(draft.places, (row) => _.pick(row, ["key", "name", "interior", "time"])), chapters: _.map(draft.chapters, (row) => _.pick(row, ["id", "title"])) }),
    JSON.stringify(errors),
    (complete ? VIDEO_DNA_PLANNING_INSTRUCTIONS + VIDEO_DNA_PROFILE_INSTRUCTIONS : C.DNA_FIELDS) + MOTION_RESPONSE_TEXT.DIAGNOSTICS + JSON.stringify([...motionResponseIssues(draft.videoDna, MOTION_DNA_CORE_SCHEMA, "videoDna"), ...motionResponseIssues(draft.videoDna, MOTION_DNA_PROFILE_SCHEMA, "videoDna")].filter((issue) => errors.some((error) => error.startsWith(issue.path + ":")))),
  );
};
export const motionDnaRepairDraft = (draft: any, reply: any, errors: string[]): any => {
  const next = _.cloneDeep(draft);
  const normalized = normalizeMotionDnaResponse(reply?.videoDna);
  if (errors.some((error) => error.startsWith("videoDna:")) && _.isPlainObject(normalized)) return { ...next, videoDna: normalized };
  if (!_.isPlainObject(next.videoDna)) next.videoDna = {};
  for (const error of errors) {
    const path = error.match(P.DNA_ERROR_PATH)?.[1];
    if (!path || P.DNA_UNSAFE_PATH.test(path)) continue;
    const value = _.get(normalized, path);
    if (value !== undefined) _.set((next.videoDna ||= {}), path, _.cloneDeep(value));
  }
  return { ...next, videoDna: normalizeMotionDnaResponse(next.videoDna) };
};
