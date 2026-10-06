import { MOTION_TEMPLATE_FUNCTION_R_VAR_M_R_MOTIONENGINE_IF_M, MOTION_TEXT_ASSET, MOTION_TEXT_NONE, MOTION_TEXT_TABLETOP, MOTION_TEXT_U003C, MOTION_TEXT_UTF8, MOTION_TEXT_WALL } from "../../constants/motionRuntime.js";
import fs from "fs";
import _ from "lodash";
import path from "path";
import { parseJson, stringifyJson } from "../../lib/jsonStringify.js";
import { MOTION_VIDEO_CONSTANTS } from "../../constants/motionVideo.js";
import { getDataDirectory } from "../utils/paths.js";
import { writeMotionJsonAtomic } from "./motionFileUtils.js";
export interface MotionDesignRecord {
  id: string;
  kind: "asset" | "env";
  name: string;
  design: Record<string, unknown>;
  score: number;
  brief: string;
  story?: string;
  createdAt: string;
  rounds: number;
}
export const designsFile = (): string => path.join(getDataDirectory(), MOTION_VIDEO_CONSTANTS.DESIGNS_FILE);
export const listDesigns = (): MotionDesignRecord[] => {
  try {
    const file = designsFile();
    if (!fs.existsSync(file)) return [];
    const data = parseJson(fs.readFileSync(file, MOTION_TEXT_UTF8));
    return _.isArray(data) ? (data as MotionDesignRecord[]) : [];
  } catch {
    return [];
  }
};
export const designsSignature = (): string => {
  try {
    return `${fs.statSync(designsFile()).mtimeMs}`;
  } catch {
    return MOTION_TEXT_NONE;
  }
};
export const saveDesign = (record: MotionDesignRecord): void => {
  const all = _.reject(listDesigns(), { id: record.id });
  all.push(record);
  writeMotionJsonAtomic(designsFile(), all);
};
export const deleteDesign = (id: string): boolean => {
  const all = listDesigns();
  const next = _.reject(all, { id });
  if (next.length === all.length) return false;
  writeMotionJsonAtomic(designsFile(), next);
  return true;
};
const WALL_RE = /(treo tường|gắn tường|trên tường|wall[- ]?mounted|hanging on the wall|on the wall)/i;
const TABLE_RE = /(đặt trên bàn|để trên bàn|trên mặt bàn|on a table|on the table|tabletop|desktop)/i;
export const inferPlace = (brief: string): string | undefined => (WALL_RE.test(brief) ? MOTION_TEXT_WALL : TABLE_RE.test(brief) ? MOTION_TEXT_TABLETOP : undefined);
export const designsScript = (): string => {
  const designs = _.map(listDesigns(), (r) => (r.kind === MOTION_TEXT_ASSET && !r.design.place ? { ...r.design, place: inferPlace(r.brief) } : r.design));
  if (!designs.length) return "";
  const json = stringifyJson(designs).replace(/</g, MOTION_TEXT_U003C);
  return MOTION_TEMPLATE_FUNCTION_R_VAR_M_R_MOTIONENGINE_IF_M(`${json}`);
};
