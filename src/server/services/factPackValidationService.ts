import dns from "node:dns/promises";
import net from "node:net";
import _ from "lodash";
import { FactClaim, FactClaimStatus, FactPack } from "../../types.js";

const SOURCE_TIMEOUT_MS = 5_000;
const REACHABLE_HTTP_STATUSES = new Set([401, 403]);

const isPrivateIpAddress = (address: string): boolean => {
  if (net.isIPv4(address)) {
    const octets = _.map(_.split(address, "."), Number);
    return octets[0] === 10 || octets[0] === 127 || (octets[0] === 169 && octets[1] === 254) || (octets[0] === 172 && _.inRange(octets[1], 16, 32)) || (octets[0] === 192 && octets[1] === 168) || octets[0] === 0;
  }
  const normalized = _.toLower(address);
  return normalized === "::1" || normalized === "::" || _.startsWith(normalized, "fc") || _.startsWith(normalized, "fd") || _.startsWith(normalized, "fe80:");
};

const isSafePublicSourceUrl = async (rawUrl: string): Promise<boolean> => {
  try {
    const parsed = new URL(rawUrl);
    if (!_.includes(["http:", "https:"], parsed.protocol)) return false;
    if (_.includes(["localhost", "localhost.localdomain"], _.toLower(parsed.hostname))) return false;
    const addresses = await dns.lookup(parsed.hostname, { all: true });
    return !_.isEmpty(addresses) && _.every(addresses, ({ address }) => !isPrivateIpAddress(address));
  } catch {
    return false;
  }
};

export type SourceReachabilityChecker = (url: string) => Promise<boolean>;

export const checkSourceReachability: SourceReachabilityChecker = async (url) => {
  if (!(await isSafePublicSourceUrl(url))) return false;
  const request = async (method: "HEAD" | "GET") => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), SOURCE_TIMEOUT_MS);
    try {
      return await fetch(url, {
        method,
        redirect: "manual",
        signal: controller.signal,
        headers: method === "GET" ? { Range: "bytes=0-0" } : undefined,
      });
    } finally {
      clearTimeout(timeout);
    }
  };
  try {
    let response = await request("HEAD");
    if (_.includes([405, 501], response.status)) response = await request("GET");
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
  const rawClaims = _.isArray(_.get(value, "claims")) ? (_.get(value, "claims") as FactClaim[]) : [];
  const claims = await Promise.all(
    _.map(rawClaims, async (rawClaim, index) => {
      const claim: FactClaim = {
        id: _.trim(_.toString(rawClaim.id)) || `claim_${index + 1}`,
        text: _.trim(_.toString(rawClaim.text)),
        status: _.includes(Object.values(FactClaimStatus), rawClaim.status) ? rawClaim.status : FactClaimStatus.Unsupported,
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
