import { SOURCE_TEMPLATE_CLAIM, SOURCE_TEXT_1_2, SOURCE_TEXT_BYTES_0_0, SOURCE_TEXT_CLAIMS, SOURCE_TEXT_FC, SOURCE_TEXT_FD, SOURCE_TEXT_FE80, SOURCE_TEXT_GET, SOURCE_TEXT_HEAD, SOURCE_TEXT_HTTP, SOURCE_TEXT_HTTPS, SOURCE_TEXT_LOCALHOST, SOURCE_TEXT_LOCALHOST_LOCALDOMAIN, SOURCE_TEXT_MANUAL, SOURCE_TEXT_SYMBOL_23, SOURCE_TEXT_SYMBOL_40 } from "../../constants/sourceText";
import dns from "node:dns/promises";
import net from "node:net";
import _ from "lodash";
import { FactClaim, FactClaimStatus, FactPack } from "../../types.js";
const SOURCE_TIMEOUT_MS = 5_000;
const REACHABLE_HTTP_STATUSES = new Set([401, 403]);
const isPrivateIpAddress = (address: string): boolean => {
  if (net.isIPv4(address)) {
    const octets = _.map(_.split(address, SOURCE_TEXT_SYMBOL_23), Number);
    return octets[0] === 10 || octets[0] === 127 || (octets[0] === 169 && octets[1] === 254) || (octets[0] === 172 && _.inRange(octets[1], 16, 32)) || (octets[0] === 192 && octets[1] === 168) || octets[0] === 0;
  }
  const normalized = _.toLower(address);
  return normalized === SOURCE_TEXT_1_2 || normalized === SOURCE_TEXT_SYMBOL_40 || _.startsWith(normalized, SOURCE_TEXT_FC) || _.startsWith(normalized, SOURCE_TEXT_FD) || _.startsWith(normalized, SOURCE_TEXT_FE80);
};
const isSafePublicSourceUrl = async (rawUrl: string): Promise<boolean> => {
  try {
    const parsed = new URL(rawUrl);
    if (!_.includes([SOURCE_TEXT_HTTP, SOURCE_TEXT_HTTPS] as string[], parsed.protocol)) return false;
    if (_.includes([SOURCE_TEXT_LOCALHOST, SOURCE_TEXT_LOCALHOST_LOCALDOMAIN] as string[], _.toLower(parsed.hostname))) return false;
    const addresses = await dns.lookup(parsed.hostname, { all: true });
    return !_.isEmpty(addresses) && _.every(addresses, ({ address }) => !isPrivateIpAddress(address));
  } catch {
    return false;
  }
};
export type SourceReachabilityChecker = (url: string) => Promise<boolean>;
const checkSourceReachability: SourceReachabilityChecker = async (url) => {
  if (!(await isSafePublicSourceUrl(url))) return false;
  const request = async (method: "HEAD" | "GET") => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), SOURCE_TIMEOUT_MS);
    try {
      return await fetch(url, {
        method,
        redirect: SOURCE_TEXT_MANUAL,
        signal: controller.signal,
        headers: method === SOURCE_TEXT_GET ? { Range: SOURCE_TEXT_BYTES_0_0 } : undefined,
      });
    } finally {
      clearTimeout(timeout);
    }
  };
  try {
    let response = await request(SOURCE_TEXT_HEAD);
    if (_.includes([405, 501], response.status)) response = await request(SOURCE_TEXT_GET);
    return response.ok || _.inRange(response.status, 300, 400) || REACHABLE_HTTP_STATUSES.has(response.status);
  } catch {
    return false;
  }
};
const downgradeUnverifiedClaim = (claim: FactClaim): FactClaim => ({
  ...claim,
  status: FactClaimStatus.Unsupported,
  confidence: _.min([25, _.clamp(_.toNumber(claim.confidence), 0, 100)]) || 0,
  safeRewrite: _.trim(claim.safeRewrite) || _.trim(claim.text),
});
export const validateFactPack = async (value: unknown, factCheckEnabled: boolean, checkReachability: SourceReachabilityChecker = checkSourceReachability): Promise<FactPack> => {
  const rawClaims = _.isArray(_.get(value, SOURCE_TEXT_CLAIMS)) ? (_.get(value, SOURCE_TEXT_CLAIMS) as FactClaim[]) : [];
  const claims = await Promise.all(
    _.map(rawClaims, async (rawClaim, index) => {
      const claim: FactClaim = {
        id: _.trim(_.toString(rawClaim.id)) || SOURCE_TEMPLATE_CLAIM(`${index + 1}`),
        text: _.trim(_.toString(rawClaim.text)),
        status: _.includes(_.values(FactClaimStatus), rawClaim.status) ? rawClaim.status : FactClaimStatus.Unsupported,
        sourceTitle: _.trim(_.toString(rawClaim.sourceTitle)),
        sourceUrl: _.trim(_.toString(rawClaim.sourceUrl)),
        publishedAt: _.trim(_.toString(rawClaim.publishedAt)),
        jurisdiction: _.trim(_.toString(rawClaim.jurisdiction)),
        confidence: _.clamp(_.toNumber(rawClaim.confidence), 0, 100),
        safeRewrite: _.trim(_.toString(rawClaim.safeRewrite)),
      };
      if (claim.status !== FactClaimStatus.Verified) return claim;
      if (!factCheckEnabled || _.isEmpty(claim.sourceTitle) || _.isEmpty(claim.sourceUrl)) return downgradeUnverifiedClaim(claim);
      return (await checkReachability(claim.sourceUrl)) ? claim : downgradeUnverifiedClaim(claim);
    }),
  );
  return { claims: _.filter(claims, (claim) => !_.isEmpty(claim.text)) };
};
