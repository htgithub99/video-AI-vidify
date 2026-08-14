import _ from "lodash";

const normalizeStyleText = (value: unknown): string => _.trim(
  _.toString(value).replace(/\s+/g, " "),
);

export const deduplicateVisualStyleText = (value: unknown): string => {
  const normalized = normalizeStyleText(value);
  if (_.isEmpty(normalized)) return normalized;
  const midpoint = Math.floor(normalized.length / 2);
  const firstHalf = _.trim(normalized.slice(0, midpoint));
  const secondHalf = _.trim(normalized.slice(midpoint));
  if (_.isEqual(_.toLower(firstHalf), _.toLower(secondHalf))) return firstHalf;
  const repeatedPrefix = normalized.match(/^(.{16,}?[.!?])\s*\1/iu);
  return repeatedPrefix ? _.trim(repeatedPrefix[1]) : normalized;
};
