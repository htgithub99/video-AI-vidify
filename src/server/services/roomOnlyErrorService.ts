import { SOURCE_TEMPLATE_THE_ROOM_DID_NOT_RETURN_A, SOURCE_TEMPLATE_THE_ROOM_RETURNED_DATA_BUT_THE, SOURCE_TEXT_MESSAGE, SOURCE_TEXT_ROOM_EXECUTION_FAILED, SOURCE_TEXT_SELECTED_ROOM } from "../../constants/sourceText";
import { API_PROVIDER_ADVICE_PATTERN } from "../../constants/regexes.js";
import _ from "lodash";
import { ROOM_ONLY_SCRIPT_ERROR_CONFIG } from "../../constants/config.js";
import { ROOM_ONLY_MESSAGES } from "../../constants/messages.js";
export const getRoomOnlyScriptError = (provider: unknown, error: unknown, isVietnamese: boolean): string => {
  const roomName = _.toString(provider || SOURCE_TEXT_SELECTED_ROOM);
  const rawIssue = _.trim(_.toString(_.get(error, SOURCE_TEXT_MESSAGE)));
  const containsUnrelatedProviderAdvice = API_PROVIDER_ADVICE_PATTERN.test(rawIssue);
  const roomIssue = !rawIssue || containsUnrelatedProviderAdvice ? SOURCE_TEXT_ROOM_EXECUTION_FAILED : _.truncate(rawIssue, { length: 240 });
  const isCreativeArtifactIssue = ROOM_ONLY_SCRIPT_ERROR_CONFIG.CREATIVE_ARTIFACT_ISSUE_PATTERN.test(roomIssue);
  if (isCreativeArtifactIssue) {
    return isVietnamese ? ROOM_ONLY_MESSAGES.ARTIFACT_STRUCTURE_ERROR(roomName, roomIssue) : SOURCE_TEMPLATE_THE_ROOM_RETURNED_DATA_BUT_THE(`${roomName}`, `${roomIssue}`);
  }
  return isVietnamese ? ROOM_ONLY_MESSAGES.ARTIFACT_INCOMPLETE_ERROR(roomName, roomIssue) : SOURCE_TEMPLATE_THE_ROOM_DID_NOT_RETURN_A(`${roomName}`, `${roomIssue}`);
};
