import _ from "lodash";
import { jsonUtils } from "../../../lib/json";
import { storageUtils } from "../../../lib/storage";
import type { VideoProject } from "../../../types";
export const readProjectLogs = (project: VideoProject, prefix: string): string[] => {
  const cached = storageUtils.get(`${prefix}${project.id}`);
  return (!_.isEmpty(project.generationLogs) ? project.generationLogs : cached ? jsonUtils.safeParse<string[]>(cached, []) : []) || [];
};
