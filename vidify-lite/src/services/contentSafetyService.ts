import _ from "lodash";
import { CONTENT_SAFETY_CONFIG } from "../constants/config";
import { ContentSafetyReport } from "../types";

export const normalizeContentSafety = (value: Partial<ContentSafetyReport>): ContentSafetyReport => {
  const completeResponse = _.every(CONTENT_SAFETY_CONFIG.REQUIRED_BOOLEAN_FIELDS, field => _.isBoolean(_.get(value, field)))
    && _.every(CONTENT_SAFETY_CONFIG.REQUIRED_ARRAY_FIELDS, field => _.isArray(_.get(value, field)));
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
    blockingErrors: _.uniq(_.compact([
      ..._.castArray(value.blockingErrors),
      !completeResponse && CONTENT_SAFETY_CONFIG.INCOMPLETE_RESPONSE_ERROR,
    ])),
    warnings: _.uniq(_.compact(_.castArray(value.warnings))),
    allowed: false,
  };
  report.allowed = completeResponse && _.isEmpty(report.blockingErrors) && !report.sexualExploitationRisk;
  return report;
};
