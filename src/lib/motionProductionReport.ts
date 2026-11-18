import { MOTION_PRODUCTION_REPORT as R } from "../constants/motionProductionReport.js";

interface MotionReportScene {
  id: string;
  html?: { attempts?: number; warnings?: string[]; notes?: string[]; fallback?: boolean };
}
interface MotionReportInput {
  id: string;
  input: Record<string, unknown>;
  visual?: Record<string, unknown>;
  steps: Record<string, { seconds: number; retries?: number }>;
  scenes: MotionReportScene[];
}
const sceneState = (scene: MotionReportScene): string => (scene.html?.fallback ? R.STATE.FALLBACK : (scene.html?.attempts || 1) > 1 ? R.STATE.REDRAWN : scene.html?.warnings?.length ? R.STATE.WARNED : R.STATE.FIRST);
const shown = (value: unknown): string => (value === undefined || value === null || value === "" ? "-" : typeof value === "object" ? JSON.stringify(value) : String(value));
// Builds the report text and its one-line summary from plain data, so it can be tested without a production.
export const motionProductionReport = (data: MotionReportInput): { text: string; summary: string } => {
  const config = [...R.CONFIG_KEYS.map((key) => [key, data.input[key]] as const), ...Object.entries(data.visual || {})].filter(([, value]) => value !== undefined);
  const scenes = data.scenes.filter((scene) => scene.html);
  const count = (state: string) => scenes.filter((scene) => sceneState(scene) === state).length;
  const summary = R.TOTAL(
    scenes.length,
    count(R.STATE.FIRST),
    count(R.STATE.WARNED),
    count(R.STATE.REDRAWN),
    count(R.STATE.FALLBACK),
    scenes.reduce((sum, scene) => sum + (scene.html?.attempts || 1), 0),
  );
  const text = [
    R.TITLE(data.id),
    "",
    R.CONFIG,
    ...config.map(([key, value]) => R.CONFIG_ROW(key, shown(value))),
    "",
    R.STEPS,
    ...Object.entries(data.steps)
      .filter(([, step]) => step.seconds > 0)
      .map(([name, step]) => R.STEP_ROW(name, step.seconds, step.retries || 0)),
    "",
    R.SCENES,
    R.SCENE_HEAD,
    ...scenes.map((scene) => R.SCENE_ROW(scene.id, scene.html?.attempts || 1, sceneState(scene), [...(scene.html?.warnings || []), ...(scene.html?.notes || [])].join("; ").replace(/\|/g, "/"))),
    "",
    summary,
    "",
  ].join("\n");
  return { text, summary };
};
