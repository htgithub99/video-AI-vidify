import { createHash } from "crypto";
import _ from "lodash";
import { stringifyJson } from "../../lib/jsonStringify.js";

const canonicalizeSignatureValue = (value: unknown): unknown => {
  if (_.isArray(value)) return _.map(value, canonicalizeSignatureValue);
  if (!_.isPlainObject(value)) return value;
  return _.fromPairs(_.map(_.sortBy(_.keys(value)), (key) => [key, canonicalizeSignatureValue(_.get(value, key))]));
};

export const createCinematicScriptSourceSignature = (source: Record<string, unknown>): string =>
  createHash("sha256").update(stringifyJson(canonicalizeSignatureValue(source))).digest("hex");
