import { SOURCE_TEXT_INVALID_CHAPTER_RESPONSE_FORBIDDEN_FORMATTING, SOURCE_TEXT_SCRIPTSEGMENT } from "../../constants/sourceText";
import _ from "lodash";
import { EMOJI_REGEX, MARKDOWN_REGEX } from "../../constants/index.js";
import { tryParseJSON } from "../utils/helpers.js";
import { assertResponseContract, ResponseContractName } from "./responseContractService.js";
export const extractCleanChapterSegment = (responseText: unknown): string => {
  const text = _.toString(responseText);
  const parsedResponse = tryParseJSON(text);
  const chapterData = _.isPlainObject(parsedResponse) ? parsedResponse : {};
  assertResponseContract(chapterData, ResponseContractName.Chapter);
  const scriptSegment = _.trim(_.toString(_.get(chapterData, SOURCE_TEXT_SCRIPTSEGMENT)));
  if (new RegExp(MARKDOWN_REGEX.source, MARKDOWN_REGEX.flags).test(scriptSegment) || new RegExp(EMOJI_REGEX.source, EMOJI_REGEX.flags).test(scriptSegment)) {
    throw new Error(SOURCE_TEXT_INVALID_CHAPTER_RESPONSE_FORBIDDEN_FORMATTING);
  }
  return scriptSegment;
};
