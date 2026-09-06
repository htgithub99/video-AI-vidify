import { createHash } from "crypto";
import _ from "lodash";

const canonicalizeSignatureValue = (value: unknown): unknown => {
  if (_.isArray(value)) return _.map(value, canonicalizeSignatureValue);
  if (!_.isPlainObject(value)) return value;
  return _.fromPairs(_.map(_.sortBy(_.keys(value)), (key) => [key, canonicalizeSignatureValue(_.get(value, key))]));
};

export const createCinematicScriptSourceSignature = (source: Record<string, unknown>): string =>
  createHash("sha256").update(JSON.stringify(canonicalizeSignatureValue(source))).digest("hex");
