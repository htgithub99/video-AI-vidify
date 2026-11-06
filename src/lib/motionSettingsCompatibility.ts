import { MOTION_SETTINGS_COMPATIBILITY as T } from "../constants/motionSettingsCompatibility.js";
import { motionStorytelling } from "./motionStorytelling.js";
import { motionVideoGenre } from "../constants/motionGenre.js";
import type { MotionStoryAnalysis } from "../types/motionVideo.js";
interface AnalysisSettingsInput {
  analysis?: MotionStoryAnalysis | null;
  videoGenre?: string;
  storytelling?: string;
  renameEntities?: boolean;
  length?: string;
}
export const motionAnalysisSettingsChanges = (input: AnalysisSettingsInput): (keyof typeof T.vi.labels)[] => {
  const analysis = input.analysis;
  if (!analysis) return [];
  const fields: (keyof typeof T.vi.labels)[] = [];
  if (input.videoGenre !== undefined && motionVideoGenre(input.videoGenre) !== motionVideoGenre(analysis.videoGenre)) fields.push("videoGenre");
  if (input.storytelling !== undefined && motionStorytelling(input.storytelling) !== motionStorytelling(analysis.storytelling)) fields.push("storytelling");
  if (input.renameEntities !== undefined && input.renameEntities !== (analysis.renameEntities === true)) fields.push("renameEntities");
  if (input.length && analysis.videoDna?.settings.length && input.length !== analysis.videoDna.settings.length) fields.push("length");
  return fields;
};
export const motionAnalysisSettingsMessage = (input: AnalysisSettingsInput, language = "vi"): string => {
  const text = T[language === "en" ? "en" : "vi"];
  const fields = motionAnalysisSettingsChanges(input);
  return fields.length ? text.reanalyze(fields.map((key) => text.labels[key]).join(", ")) : "";
};
