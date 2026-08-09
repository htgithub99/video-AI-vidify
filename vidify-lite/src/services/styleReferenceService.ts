import _ from "lodash";
import { MARKDOWN_REGEX } from "../constants";

export const normalizeExtractedStyle = (value: unknown): string => _.trim(
  _.replace(_.toString(value), MARKDOWN_REGEX, ""),
);
