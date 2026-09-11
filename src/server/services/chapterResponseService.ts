import _ from "lodash";
import { EMOJI_REGEX, MARKDOWN_REGEX } from "../../constants/index.js";
import { tryParseJSON } from "../utils/helpers.js";
import { assertResponseContract, ResponseContractName } from "./responseContractService.js";

export const extractCleanChapterSegment = (responseText: unknown): string => {
  const text = _.toString(responseText);
  const parsedResponse = tryParseJSON(text);
  const chapterData = _.isPlainObject(parsedResponse) ? parsedResponse : {};
  assertResponseContract(chapterData, ResponseContractName.Chapter);
  const scriptSegment = _.trim(_.toString(_.get(chapterData, "scriptSegment")));
  if (new RegExp(MARKDOWN_REGEX.source, MARKDOWN_REGEX.flags).test(scriptSegment) || new RegExp(EMOJI_REGEX.source, EMOJI_REGEX.flags).test(scriptSegment)) {
    throw new Error("invalid_chapter_response_forbidden_formatting");
  }
  return scriptSegment;
};
