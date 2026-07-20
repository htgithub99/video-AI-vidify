import { Request, Response, NextFunction } from 'express';
import { LicenseService } from '../services/licenseService.js';
import { appError } from '../../lib/logger.js';
import _ from 'lodash';
import { SecurityConstants, SecurityMessages, FeatureType, PlanType } from '../../constants/security.js';

export const requireLicense = (featureType?: FeatureType) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const licenseKey = _.get(req.headers, SecurityConstants.HEADER_LICENSE_KEY) as string;

            if (_.isEmpty(licenseKey)) {
                return res.status(401).json({ error: SecurityMessages.MISSING_LICENSE_KEY, code: 'LICENSE_MISSING' });
            }

            const license = await LicenseService.validateKey(licenseKey);

            if (_.isNil(license)) {
                return res.status(403).json({ error: SecurityMessages.INVALID_OR_REVOKED_LICENSE, code: 'LICENSE_INVALID' });
            }

            _.set(req, 'licenseInfo', license);

            if (_.isNil(featureType)) {
                return next();
            }

            const isPro = _.includes(license.plan_type, PlanType.PRO);

            if (isPro && _.get(license, 'quotas.pro_unlimited', false)) {
                return next();
            }

            const currentUsage = _.get(license, `usage.${featureType}`, 0);
            const maxLimit = isPro ? _.get(license, `quotas.pro_${featureType}`, 0) : _.get(license, `quotas.free_${featureType}`, 0);

            if (currentUsage >= maxLimit) {
                const planName = isPro ? SecurityMessages.PRO_PLAN : SecurityMessages.FREE_PLAN;
                return res.status(403).json({
                    error: SecurityMessages.QUOTA_EXCEEDED_TEMPLATE.replace('{0}', featureType).replace('{1}', planName),
                    code: 'QUOTA_EXCEEDED'
                });
            }

            next();
        } catch (error) {
            appError("RequireLicense Middleware Error", error);
            res.status(500).json({ error: SecurityMessages.INTERNAL_SERVER_ERROR });
        }
    };
};
