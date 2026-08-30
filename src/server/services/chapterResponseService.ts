import _ from "lodash";
import { EMOJI_REGEX, MARKDOWN_REGEX } from "../../constants/index.js";
import { safeParseJSON } from "../utils/helpers.js";
import { assertResponseContract, ResponseContractName } from "./responseContractService.js";

const JSON_FENCE_PREFIX_REGEX = /^```(?:json)?\s*/i;
const JSON_FENCE_SUFFIX_REGEX = /\s*```$/i;

export const extractCleanChapterSegment = (responseText: unknown): string => {
  const text = _.toString(responseText);
  const parsedResponse = safeParseJSON(text, {});
  const rawResponseText = _.trim(text).replace(JSON_FENCE_PREFIX_REGEX, "").replace(JSON_FENCE_SUFFIX_REGEX, "");
  const chapterData = {
    ...(_.isPlainObject(parsedResponse) ? parsedResponse : {}),
    scriptSegment:
      _.find(
        [
          _.get(parsedResponse, "scriptSegment"),
          _.get(parsedResponse, "script"),
          _.get(parsedResponse, "content"),
          _.get(parsedResponse, "text"),
          _.isPlainObject(parsedResponse) ? "" : rawResponseText,
        ],
        (value) => !_.isEmpty(_.trim(_.toString(value))),
      ) || "",
  };
  assertResponseContract(chapterData, ResponseContractName.Chapter);
  return _.trim(_.toString(chapterData.scriptSegment)).replace(MARKDOWN_REGEX, "").replace(EMOJI_REGEX, "");
};
