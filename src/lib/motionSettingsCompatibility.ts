import * as RT_MAINTENANCE from "../constants/runtime/maintenance.js";
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
  if (input.videoGenre !== undefined && motionVideoGenre(input.videoGenre) !== motionVideoGenre(analysis.videoGenre)) fields.push(RT_MAINTENANCE.VIDEOGENRE);
  if (input.storytelling !== undefined && motionStorytelling(input.storytelling) !== motionStorytelling(analysis.storytelling)) fields.push(RT_MAINTENANCE.STORYTELLING_2);
  if (input.renameEntities !== undefined && input.renameEntities !== (analysis.renameEntities === true)) fields.push(RT_MAINTENANCE.RENAMEENTITIES);
  if (input.length && analysis.videoDna?.settings.length && input.length !== analysis.videoDna.settings.length) fields.push(RT_MAINTENANCE.LENGTH);
  return fields;
};
export const motionAnalysisSettingsMessage = (input: AnalysisSettingsInput, language: string = RT_MAINTENANCE.VI): string => {
  const text = T[language === RT_MAINTENANCE.EN ? RT_MAINTENANCE.EN : RT_MAINTENANCE.VI];
  const fields = motionAnalysisSettingsChanges(input);
  return fields.length ? text.reanalyze(fields.map((key) => text.labels[key]).join(RT_MAINTENANCE.COMMA_SPACE)) : "";
};
