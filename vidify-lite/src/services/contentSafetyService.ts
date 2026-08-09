import _ from "lodash";
import { ContentSafetyReport } from "../types";

const SENSITIVE_TOPIC_PATTERN = /gambl|betting|casino|xóc đĩa|cờ bạc|prison|tù|violence|bạo lực|drug|ma túy/i;
const SEXUAL_EXPLOITATION_PATTERN = /child sexual|sexual abuse of (?:a )?minor|ấu dâm|xâm hại tình dục trẻ|bóc lột tình dục trẻ/i;

export const normalizeContentSafety = (value: Partial<ContentSafetyReport>): ContentSafetyReport => {
  const report = {
    sensitiveTopic: Boolean(value.sensitiveTopic),
    trueCase: Boolean(value.trueCase),
    minorsInvolved: Boolean(value.minorsInvolved),
    sexualExploitationRisk: Boolean(value.sexualExploitationRisk),
    victimExploitationRisk: Boolean(value.victimExploitationRisk),
    privacyRisk: Boolean(value.privacyRisk),
    likenessRisk: Boolean(value.likenessRisk),
    copyrightRisk: Boolean(value.copyrightRisk),
    requiredDisclosures: _.uniq(_.compact(_.castArray(value.requiredDisclosures))),
    blockingErrors: _.uniq(_.compact(_.castArray(value.blockingErrors))),
    warnings: _.uniq(_.compact(_.castArray(value.warnings))),
    allowed: false,
  };
  report.allowed = _.isEmpty(report.blockingErrors) && !report.sexualExploitationRisk;
  return report;
};

export const createLocalContentSafetyFallback = (input: unknown): ContentSafetyReport => {
  const text = _.toString(input);
  const sexualExploitationRisk = SEXUAL_EXPLOITATION_PATTERN.test(text);
  return normalizeContentSafety({
    sensitiveTopic: SENSITIVE_TOPIC_PATTERN.test(text) || sexualExploitationRisk,
    minorsInvolved: sexualExploitationRisk,
    sexualExploitationRisk,
    blockingErrors: sexualExploitationRisk ? ["sexual_exploitation_risk"] : [],
    warnings: ["content_safety_ai_unavailable_local_policy_applied"],
  });
};
