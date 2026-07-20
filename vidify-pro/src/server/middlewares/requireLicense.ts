import { Request, Response, NextFunction } from 'express';
import { LicenseService } from '../services/licenseService.js';
import { appError } from '../../lib/logger.js';
import _ from 'lodash';
import { SecurityConstants, SecurityMessages, FeatureType, PlanType, LicenseStatus } from '../../constants/security.js';

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
                const isViewingProjects = _.isEqual(req.method, 'GET') && _.includes(req.originalUrl, '/projects');
                if (!isViewingProjects) {
                    return res.status(403).json({ 
                        error: SecurityMessages.INACTIVE_ACCOUNT_VIEW_ONLY, 
                        code: SecurityConstants.LICENSE_INACTIVE_CODE 
                    });
                }
            }

            _.set(req, 'licenseInfo', license);

            if (_.isNil(featureType)) {
                return next();
            }

            const proPlans = [PlanType.PRO, PlanType.PRO_LIFETIME, PlanType.PRO_MONTHLY, PlanType.PRO_WEEKLY];
            const isPro = _.some(proPlans, plan => _.includes(license.plan_type, plan));

            if (isPro && _.get(license, 'quotas.pro_unlimited', false)) {
                return next();
            }

            const currentUsage = _.get(license, `usage.${featureType}`, 0);
            const maxLimit = isPro ? _.get(license, `quotas.pro_${featureType}`, 0) : _.get(license, `quotas.free_${featureType}`, 0);

            if (currentUsage >= maxLimit) {
                const planName = isPro ? SecurityMessages.PRO_PLAN : SecurityMessages.FREE_PLAN;
                return res.status(403).json({
                    error: SecurityMessages.QUOTA_EXCEEDED_TEMPLATE.replace('{0}', featureType).replace('{1}', planName),
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
