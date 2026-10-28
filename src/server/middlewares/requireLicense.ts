import { Request, Response, NextFunction } from "express";
import { LicenseService, LicenseValidationError } from "../services/licenseService.js";
import { appError } from "../../lib/logger.js";
import _ from "lodash";
import { REFACTOR_CONSTANTS } from "../../constants/index.js";
import { SecurityConstants, SecurityMessages, LocalizationConstants, FeatureType, LicenseStatus } from "../../constants/security.js";
import { requestContext } from "../utils/requestContext.js";
import { getResolvedLicenseKey } from "../services/apiKeyResolver.js";
import { GenerateType } from "../../types.js";
const getRequestedUsageAmount = (request: Request, featureType: FeatureType): number => {
  const requestedItems = _.get(request, REFACTOR_CONSTANTS.USAGE_REQUEST_ITEMS_PATH);
  const requestedVisualItems = _.isArray(requestedItems) ? _.filter(requestedItems, (item) => (_.isEqual(featureType, FeatureType.VIDEO) ? _.isEqual(item.generateType, GenerateType.Video) : !_.isEqual(item.generateType, GenerateType.Video))) : requestedItems;
  const requestedAmountByFeature: Record<FeatureType, number> = { [FeatureType.VIDEO]: SecurityConstants.DEFAULT_AMOUNT, [FeatureType.IMAGE]: _.isArray(requestedVisualItems) ? _.size(requestedVisualItems) : SecurityConstants.DEFAULT_AMOUNT, [FeatureType.VOICE]: _.size(_.toString(_.get(request, REFACTOR_CONSTANTS.USAGE_REQUEST_TEXT_PATH, SecurityConstants.EMPTY_STRING))) };
  if (_.every([_.includes([FeatureType.IMAGE, FeatureType.VIDEO], featureType), _.isArray(requestedVisualItems)], Boolean)) {
    return _.size(requestedVisualItems);
  }
  return _.defaultTo(_.max([_.get(requestedAmountByFeature, featureType, SecurityConstants.DEFAULT_AMOUNT), SecurityConstants.DEFAULT_AMOUNT]), SecurityConstants.DEFAULT_AMOUNT);
};
export const requireLicense = (featureType?: FeatureType) => {
  return async (request: Request, response: Response, next: NextFunction) => {
    try {
      const licenseKey = getResolvedLicenseKey(request);
      if (_.isEmpty(licenseKey)) {
        return response.status(SecurityConstants.HTTP_UNAUTHORIZED).json({ error: SecurityMessages.MISSING_LICENSE_KEY, code: SecurityConstants.LICENSE_MISSING_CODE });
      }
      const license = await LicenseService.validateKey(licenseKey);
      if (_.isNil(license)) {
        return response.status(SecurityConstants.HTTP_FORBIDDEN).json({ error: SecurityMessages.INVALID_OR_REVOKED_LICENSE, code: SecurityConstants.LICENSE_INVALID_CODE });
      }
      const status = _.get(license, SecurityConstants.PROP_STATUS);
      if (!_.isEqual(status, LicenseStatus.ACTIVE)) {
        return response.status(SecurityConstants.HTTP_FORBIDDEN).json({ error: SecurityMessages.INVALID_OR_REVOKED_LICENSE, code: SecurityConstants.LICENSE_INACTIVE_CODE });
      }
      const expiresAt = _.get(license, SecurityConstants.PROP_EXPIRES_AT);
      if (!_.isNil(expiresAt)) {
        const expiresTime = new Date(expiresAt).getTime();
        if (!isNaN(expiresTime) && _.lt(expiresTime, Date.now())) {
          return response.status(SecurityConstants.HTTP_FORBIDDEN).json({ error: SecurityMessages.INVALID_OR_REVOKED_LICENSE, code: SecurityConstants.LICENSE_INACTIVE_CODE });
        }
      }
      _.set(request, SecurityConstants.LICENSE_INFO_KEY, license);
      const store = requestContext.getStore();
      if (store) {
        _.set(store, SecurityConstants.STORE_PLAN_TYPE_KEY, _.get(license, SecurityConstants.PROP_PLAN_ID));
        _.set(store, SecurityConstants.STORE_LICENSE_KEY, licenseKey);
      }
      if (_.isNil(featureType)) {
        return next();
      }
      if (_.get(license, SecurityConstants.LIMITS_UNLIMITED, false)) {
        return next();
      }
      const currentUsage = _.get(license, _.join([SecurityConstants.USAGE_PREFIX, featureType], SecurityConstants.EMPTY_STRING), SecurityConstants.ZERO);
      const maxLimit = _.get(license, _.join([SecurityConstants.LIMITS_PREFIX_LOWER, featureType], SecurityConstants.DOT), SecurityConstants.ZERO);
      const requestedAmount = getRequestedUsageAmount(request, featureType);
      const projectedUsage = _.add(currentUsage, requestedAmount);
      if (_.gt(projectedUsage, maxLimit)) {
        const featureName = _.isEqual(featureType, FeatureType.VIDEO) ? LocalizationConstants.FEATURE_VIDEO : _.isEqual(featureType, FeatureType.IMAGE) ? LocalizationConstants.FEATURE_IMAGE : LocalizationConstants.FEATURE_VOICE;
        const planName = _.get(license, SecurityConstants.PROP_PLAN_ID, SecurityConstants.UNKNOWN_PLAN_NAME);
        let errorMsg = SecurityConstants.EMPTY_STRING;
        if (_.isEqual(_.get(license, SecurityConstants.PROP_QUOTA_TYPE), SecurityConstants.QUOTA_TYPE_TOTAL)) {
          errorMsg = _.replace(_.replace(SecurityMessages.QUOTA_TOTAL_EXCEEDED, SecurityConstants.PLACEHOLDER_0, featureName), SecurityConstants.PLACEHOLDER_1, planName);
        } else {
          errorMsg = _.replace(_.replace(SecurityMessages.QUOTA_DAILY_EXCEEDED, SecurityConstants.PLACEHOLDER_0, featureName), SecurityConstants.PLACEHOLDER_1, planName);
        }
        return response.status(SecurityConstants.HTTP_FORBIDDEN).json({ error: errorMsg, code: SecurityConstants.QUOTA_EXCEEDED_CODE });
      }
      next();
    } catch (error) {
      if (error instanceof LicenseValidationError) {
        return response.status(SecurityConstants.HTTP_FORBIDDEN).json({ error: error.message, code: SecurityConstants.LICENSE_INVALID_CODE });
      }
      appError(SecurityConstants.REQUIRE_LICENSE_ERROR_LOG, error);
      response.status(SecurityConstants.HTTP_INTERNAL_ERROR).json({ error: SecurityMessages.INTERNAL_SERVER_ERROR });
    }
  };
};
