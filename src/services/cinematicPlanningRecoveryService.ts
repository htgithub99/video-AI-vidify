import _ from "lodash";
import { StoryboardScene } from "../types";

export interface CinematicPlanningResponsePartition {
  completedScenes: StoryboardScene[];
  unresolvedScenes: StoryboardScene[];
}

export const partitionCinematicPlanningResponse = (
  requestedScenes: StoryboardScene[],
  responseScenes: StoryboardScene[],
  planningIssues: unknown[],
): CinematicPlanningResponsePartition => {
  const requestedSceneIds = _.map(requestedScenes, "id");
  const explicitIssueSceneIds = _.uniq(
    _.compact(
      _.map(planningIssues, (issue) => {
        const sceneId = _.head(_.split(_.toString(issue), ":"));
        return _.includes(requestedSceneIds, sceneId) ? sceneId : undefined;
      }),
    ),
  );
  const issueSceneIds = !_.isEmpty(planningIssues) && _.isEmpty(explicitIssueSceneIds) ? requestedSceneIds : explicitIssueSceneIds;
  const completedScenes = _.filter(
    responseScenes,
    (scene) => _.includes(requestedSceneIds, scene.id) && !_.includes(issueSceneIds, scene.id) && !_.isEmpty(_.trim(scene.generationPrompt)),
  );
  const completedSceneIds = _.map(completedScenes, "id");
  const unresolvedSceneIds = _.isEmpty(issueSceneIds)
    ? _.difference(requestedSceneIds, completedSceneIds)
    : _.union(issueSceneIds, _.difference(requestedSceneIds, completedSceneIds));

  return {
    completedScenes,
    unresolvedScenes: _.filter(requestedScenes, (scene) => _.includes(unresolvedSceneIds, scene.id)),
  };
};
