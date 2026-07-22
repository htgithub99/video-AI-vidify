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
                return res.status(401).json({ error: SecurityMessages.MISSING_LICENSE_KEY, code: SecurityConstants.LICENSE_MISSING_CODE });
            }

            const license = await LicenseService.validateKey(licenseKey);

            if (_.isNil(license)) {
                return res.status(403).json({ error: SecurityMessages.INVALID_OR_REVOKED_LICENSE, code: SecurityConstants.LICENSE_INVALID_CODE });
            }

            if (!_.isEqual(license.status, LicenseStatus.ACTIVE)) {
                return res.status(403).json({
                    error: SecurityMessages.INVALID_OR_REVOKED_LICENSE,
                    code: SecurityConstants.LICENSE_INACTIVE_CODE
                });
            }

            _.set(req, SecurityConstants.LICENSE_INFO_KEY, license);

            const store = requestContext.getStore();
            if (store) {
                store.planType = license.plan_id;
            }

            if (_.isNil(featureType)) {
                return next();
            }

            if (_.get(license, 'limits.unlimited', false)) {
                return next();
            }

            const currentUsage = _.get(license, `${SecurityConstants.USAGE_PREFIX}${featureType}`, 0);
            const maxLimit = _.get(license, `limits.${featureType}`, 0);

            if (currentUsage >= maxLimit) {
                const featureName = _.isEqual(featureType, FeatureType.VIDEO) ? LocalizationConstants.FEATURE_VIDEO : (_.isEqual(featureType, FeatureType.IMAGE) ? LocalizationConstants.FEATURE_IMAGE : LocalizationConstants.FEATURE_VOICE);
                const planName = _.get(license, 'plan_id', SecurityConstants.UNKNOWN_PLAN_NAME);
                
                let errorMsg = '';
                if (_.isEqual(_.get(license, 'quota_type'), SecurityConstants.QUOTA_TYPE_TOTAL)) {
                    errorMsg = _.replace(_.replace(SecurityMessages.QUOTA_TOTAL_EXCEEDED, '{0}', featureName), '{1}', planName);
                } else {
                    errorMsg = _.replace(_.replace(SecurityMessages.QUOTA_DAILY_EXCEEDED, '{0}', featureName), '{1}', planName);
                }
                
                return res.status(403).json({
                    error: errorMsg,
                    code: SecurityConstants.QUOTA_EXCEEDED_CODE
                });
            }

            next();
        } catch (error) {
            appError("RequireLicense Middleware Error", error);
            res.status(500).json({ error: SecurityMessages.INTERNAL_SERVER_ERROR });
        }
    };
};
