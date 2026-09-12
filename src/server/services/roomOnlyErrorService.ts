import { API_PROVIDER_ADVICE_PATTERN } from "../../constants/regexes.js";
import _ from "lodash";
import { ROOM_ONLY_SCRIPT_ERROR_CONFIG } from "../../constants/config.js";
import { ROOM_ONLY_MESSAGES } from "../../constants/messages.js";

export const getRoomOnlyScriptError = (provider: unknown, error: unknown, isVietnamese: boolean): string => {
  const roomName = _.toString(provider || "selected-room");
  const rawIssue = _.trim(_.toString(_.get(error, "message")));
  const containsUnrelatedProviderAdvice = API_PROVIDER_ADVICE_PATTERN.test(rawIssue);
  const roomIssue = !rawIssue || containsUnrelatedProviderAdvice ? "room_execution_failed" : _.truncate(rawIssue, { length: 240 });
  const isCreativeArtifactIssue = ROOM_ONLY_SCRIPT_ERROR_CONFIG.CREATIVE_ARTIFACT_ISSUE_PATTERN.test(roomIssue);
  if (isCreativeArtifactIssue) {
    return isVietnamese
      ? ROOM_ONLY_MESSAGES.ARTIFACT_STRUCTURE_ERROR(roomName, roomIssue)
      : `The ${roomName} room returned data, but the final screenplay artifact still has structural issues (${roomIssue}). Valid prior steps were checkpointed; resume to let AI rewrite only this artifact.`;
  }
  return isVietnamese
    ? ROOM_ONLY_MESSAGES.ARTIFACT_INCOMPLETE_ERROR(roomName, roomIssue)
    : `The ${roomName} room did not return a complete screenplay (${roomIssue}). Check the room sign-in state or UI, then resume the project.`;
};
