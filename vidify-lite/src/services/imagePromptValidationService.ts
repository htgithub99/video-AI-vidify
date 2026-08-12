import _ from "lodash";
import { ImagePromptQualityIssue, StoryboardScene } from "../types";
import { ImagePromptQualityOptions, evaluateImagePrompts } from "./imagePromptQualityService";

export const getScenePromptIssues = (
  sceneId: string,
  issues: ImagePromptQualityIssue[],
): string[] => _.uniq(_.map(_.filter(issues, { sceneId }), "code"));

export const validateCompiledImagePrompts = (
  scenes: StoryboardScene[],
  options: ImagePromptQualityOptions,
) => evaluateImagePrompts(scenes, { ...options, requireStructuredPlan: true });

export const createImagePromptCorrectionPayload = (
  scenes: StoryboardScene[],
  issues: ImagePromptQualityIssue[],
): Record<string, unknown>[] => _.map(
  _.filter(scenes, scene => _.some(issues, { sceneId: scene.id })),
  scene => ({
    ..._.pick(scene, [
      "id", "script", "subtitle", "visualIntent", "visibleAction", "reaction", "characterIds",
      "characterStage", "locationId", "propIds", "expectedSubjectCount", "allowBackgroundPeople",
      "layout", "textAllowed", "shotPurpose", "shotSize", "cameraAngle", "composition",
      "characterStateBefore", "characterStateAfter", "continuityFrom", "continuityNotes", "callbackId", "lighting",
    ]),
    issues: getScenePromptIssues(scene.id, issues),
  }),
);
