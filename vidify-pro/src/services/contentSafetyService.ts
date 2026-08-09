import _ from "lodash";
import { ContentSafetyReport } from "../types";
export const normalizeContentSafety = (
  value: Partial<ContentSafetyReport>,
): ContentSafetyReport => {
  const report = {
    sensitiveTopic: Boolean(value.sensitiveTopic),
    trueCase: Boolean(value.trueCase),
    minorsInvolved: Boolean(value.minorsInvolved),
    sexualExploitationRisk: Boolean(value.sexualExploitationRisk),
    victimExploitationRisk: Boolean(value.victimExploitationRisk),
    privacyRisk: Boolean(value.privacyRisk),
    likenessRisk: Boolean(value.likenessRisk),
    copyrightRisk: Boolean(value.copyrightRisk),
    requiredDisclosures: _.uniq(
      _.compact(_.castArray(value.requiredDisclosures)),
    ),
    blockingErrors: _.uniq(_.compact(_.castArray(value.blockingErrors))),
    warnings: _.uniq(_.compact(_.castArray(value.warnings))),
    allowed: false,
  };
  report.allowed =
    _.isEmpty(report.blockingErrors) && !report.sexualExploitationRisk;
  return report;
};
