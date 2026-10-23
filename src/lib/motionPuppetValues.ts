import _ from "lodash";
import { PA } from "../constants/motionPuppetAssets.js";
import { PUPPET as P } from "../constants/motionPuppet.js";
export const isPuppetString = (value: unknown): value is string => typeof value === PA.STRING;
export const puppetTokens = (value: string): string[] => _.toString(value).toLowerCase().split(P.TOKEN_SPLIT).filter(Boolean);
export const puppetSupportTokens = (value: string): string[] => [...new Set(puppetTokens(value).map((token) => P.SUPPORT_TOKEN_ALIASES[token] || token))];
export const puppetKeyOf = (value: unknown): string | null => {
  const key = _.snakeCase(_.toString(value || P.EMPTY));
  return P.KEY_RE.test(key) ? key : null;
};
export const puppetTimestamp = (): string => new Date().toISOString();
