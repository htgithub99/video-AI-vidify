import { MOTION_PLAN_VARIETY as V } from "../constants/motionPlanVariety.js";
type Row = { id?: string; kind?: unknown; shot?: unknown; setting?: unknown };
const norm = (value: unknown): string => String(value ?? V.NONE).toLowerCase().replace(V.SPACE, V.SPACE_ONE).trim();
export const motionPlanVarietyIssues = (rows: Row[], texts: string[]): string[] => {
  const issues: string[] = [];
  rows.forEach((row, index) => {
    const id = String(row.id ?? index);
    if (!V.KINDS.includes(norm(row.kind)) || !V.SHOTS.includes(norm(row.shot)) || !norm(row.setting)) issues.push(V.MISSING(id));
    else if (norm(row.kind) === V.KINDS[0] && V.ELSEWHERE.test(texts[index] || V.NONE)) issues.push(V.ELSEWHERE_HERE(id));
  });
  let start = 0;
  for (let index = 1; index <= rows.length; index++) {
    const same = index < rows.length && norm(rows[index].setting) && norm(rows[index].setting) === norm(rows[start].setting) && norm(rows[index].shot) === norm(rows[start].shot);
    if (same) continue;
    if (index - start > V.MAX_SAME_RUN) issues.push(V.SAME_RUN(String(rows[start].id ?? start), index - start));
    start = index;
  }
  if (rows.length >= V.MIN_GROUP_FOR_SHOTS && new Set(rows.map((row) => norm(row.shot)).filter(Boolean)).size < V.MIN_SHOTS) issues.push(V.FEW_SHOTS(rows.length));
  return issues;
};
export const motionSceneHasAction = (text: string): boolean => V.ACTION.test(text);
