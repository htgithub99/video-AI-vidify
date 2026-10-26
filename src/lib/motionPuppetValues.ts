import _ from "lodash";
import { PA } from "../constants/motionPuppetAssets.js";
import { PUPPET as P } from "../constants/motionPuppet.js";
import { MOTION_PACK_SELECTION as SELECTION } from "../constants/motionPackSelection.js";
import { MOTION_PLACEMENT as M } from "../constants/motionPlacement.js";
export const isPuppetString = (value: unknown): value is string => typeof value === PA.STRING;
export const puppetTokens = (value: string): string[] => _.toString(value).toLowerCase().split(P.TOKEN_SPLIT).filter(Boolean);
export const puppetSupportTokens = (value: string): string[] => [...new Set(puppetTokens(M.SUPPORT_PHRASE_ALIASES.reduce((text, alias) => text.replace(alias.pattern, alias.value), value.toLowerCase())).map((token) => P.SUPPORT_TOKEN_ALIASES[token] || token))];
export const puppetKeyOf = (value: unknown): string | null => {
  const raw = _.trim(_.toString(value || P.EMPTY));
  if (P.REFERENCE_KEY_RE.test(raw)) return raw;
  const key = _.snakeCase(raw);
  return P.KEY_RE.test(key) ? key : null;
};
export const puppetTimestamp = (): string => new Date().toISOString();
export const puppetSourceQuote = (source: string, quote: string): string | undefined => {
  const words = quote.normalize(P.NFC).trim().split(SELECTION.QUOTE_WORDS).filter(Boolean);
  if (!words.length) return undefined;
  const pattern = SELECTION.QUOTE_PREFIX + words.map(_.escapeRegExp).join(SELECTION.QUOTE_GAP) + SELECTION.QUOTE_SUFFIX;
  const text = source.normalize(P.NFC);
  const exact = text.match(new RegExp(pattern, SELECTION.QUOTE_FLAGS))?.[0];
  if (exact) return exact;
  const tokens = quote.normalize(P.NFC).match(SELECTION.QUOTE_TOKENS) || [];
  if (!tokens.length) return undefined;
  return text.match(new RegExp(SELECTION.QUOTE_PREFIX + tokens.map(_.escapeRegExp).join(SELECTION.QUOTE_PUNCTUATION_GAP) + SELECTION.QUOTE_SUFFIX, SELECTION.QUOTE_FLAGS))?.[0];
};
