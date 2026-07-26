import { Request, Response, NextFunction } from 'express';
import { LicenseService } from '../services/licenseService.js';
import { appError } from '../../lib/logger.js';
import _ from 'lodash';
import { SecurityConstants, SecurityMessages, LocalizationConstants, FeatureType, LicenseStatus } from '../../constants/security.js';
import { requestContext } from '../utils/requestContext.js';

export const requireLicense = (featureType?: FeatureType) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const licenseKey = _.get(req.headers, SecurityConstants.HEADER_LICENSE_KEY) as string;

            if (_.isEmpty(licenseKey)) {
                return res.status(SecurityConstants.HTTP_UNAUTHORIZED).json({
                    error: SecurityMessages.MISSING_LICENSE_KEY,
                    code: SecurityConstants.LICENSE_MISSING_CODE
                });
            }

            const license = await LicenseService.validateKey(licenseKey);

            if (_.isNil(license)) {
                return res.status(SecurityConstants.HTTP_FORBIDDEN).json({
                    error: SecurityMessages.INVALID_OR_REVOKED_LICENSE,
                    code: SecurityConstants.LICENSE_INVALID_CODE
                });
            }

            if (!_.isEqual(license.status, LicenseStatus.ACTIVE)) {
                return res.status(SecurityConstants.HTTP_FORBIDDEN).json({
                    error: SecurityMessages.INVALID_OR_REVOKED_LICENSE,
                    code: SecurityConstants.LICENSE_INACTIVE_CODE
                });
            }

            if (!_.isNil(license.expires_at)) {
                const expiresTime = new Date(license.expires_at).getTime();
                if (!isNaN(expiresTime) && _.lt(expiresTime, Date.now())) {
                    return res.status(SecurityConstants.HTTP_FORBIDDEN).json({
                        error: SecurityMessages.INVALID_OR_REVOKED_LICENSE,
                        code: SecurityConstants.LICENSE_INACTIVE_CODE
                    });
                }
            }

            _.set(req, SecurityConstants.LICENSE_INFO_KEY, license);

            const store = requestContext.getStore();
            if (store) {
                _.set(store, SecurityConstants.STORE_PLAN_TYPE_KEY, license.plan_id);
            }

            if (_.isNil(featureType)) {
                return next();
            }

            if (_.get(license, SecurityConstants.LIMITS_UNLIMITED, false)) {
                return next();
            }

            const currentUsage = _.get(license, _.join([SecurityConstants.USAGE_PREFIX, featureType], SecurityConstants.EMPTY_STRING), SecurityConstants.ZERO);
            const maxLimit = _.get(license, _.join([SecurityConstants.LIMITS_PREFIX_LOWER, featureType], SecurityConstants.DOT), SecurityConstants.ZERO);

            if (currentUsage >= maxLimit) {
                const featureName = _.isEqual(featureType, FeatureType.VIDEO)
                    ? LocalizationConstants.FEATURE_VIDEO
                    : (_.isEqual(featureType, FeatureType.IMAGE)
                        ? LocalizationConstants.FEATURE_IMAGE
                        : LocalizationConstants.FEATURE_VOICE);
                const planName = _.get(license, SecurityConstants.PROP_PLAN_ID, SecurityConstants.UNKNOWN_PLAN_NAME);
                
                let errorMsg = SecurityConstants.EMPTY_STRING;
                if (_.isEqual(license.quota_type, SecurityConstants.QUOTA_TYPE_TOTAL)) {
                    errorMsg = _.replace(_.replace(SecurityMessages.QUOTA_TOTAL_EXCEEDED, SecurityConstants.PLACEHOLDER_0, featureName), SecurityConstants.PLACEHOLDER_1, planName);
                } else {
                    errorMsg = _.replace(_.replace(SecurityMessages.QUOTA_DAILY_EXCEEDED, SecurityConstants.PLACEHOLDER_0, featureName), SecurityConstants.PLACEHOLDER_1, planName);
                }
                
                return res.status(SecurityConstants.HTTP_FORBIDDEN).json({
                    error: errorMsg,
                    code: SecurityConstants.QUOTA_EXCEEDED_CODE
                });
            }

            next();
        } catch (error) {
            appError(SecurityConstants.REQUIRE_LICENSE_ERROR_LOG, error);
            res.status(SecurityConstants.HTTP_INTERNAL_ERROR).json({ error: SecurityMessages.INTERNAL_SERVER_ERROR });
        }
    };
};
