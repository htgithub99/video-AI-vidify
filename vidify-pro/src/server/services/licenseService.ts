import _ from 'lodash';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { SecurityConstants, SecurityMessages, GasActions, FeatureType, LicenseStatus, PlanType } from '../../constants/security.js';
import { jsonUtils } from '../../lib/json.js';
import { appError } from '../../lib/logger.js';

function getHardwareId(): string {
    const deviceIdFile = path.join(process.cwd(), SecurityConstants.DEVICE_ID_FILE_NAME);
    
    if (fs.existsSync(deviceIdFile)) {
        try {
            const data = jsonUtils.safeParse(fs.readFileSync(deviceIdFile, SecurityConstants.UTF8_ENCODING as BufferEncoding), {});
            if (_.has(data, 'deviceId')) return _.get(data, 'deviceId');
        } catch (e) {
            appError(SecurityMessages.ERROR_READING_DEVICE_ID, e);
        }
    }
    
    const newId = crypto.randomUUID();
    fs.writeFileSync(deviceIdFile, jsonUtils.safeStringify({ deviceId: newId }), SecurityConstants.UTF8_ENCODING as BufferEncoding);
    return newId;
}

export interface LicenseInfo {
    status: LicenseStatus;
    plan_id: string;
    plan_type: string;
    quota_type: string;
    expires_at: string | null;
    usage: {
        video: number;
        image: number;
        voice: number;
    };
    limits: {
        video: number;
        image: number;
        voice: number;
        unlimited: boolean;
    };
}

export class LicenseService {
    static async validateKey(licenseKey: string): Promise<LicenseInfo | null> {
        if (_.isEmpty(licenseKey)) return null;
        
        const deviceId = getHardwareId();
        
        try {
            const response = await fetch(SecurityConstants.GAS_API_URL, {
                method: SecurityConstants.HTTP_POST,
                headers: { 'Content-Type': SecurityConstants.CONTENT_TYPE_JSON },
                body: jsonUtils.safeStringify({
                    action: GasActions.VERIFY_KEY,
                    admin_key: SecurityConstants.ADMIN_APP_KEY,
                    license_key: licenseKey,
                    device_id: deviceId
                })
            });
            
            const data: any = await response.json();
            
            if (_.has(data, 'error')) {
                const errorMsg = _.get(data, 'error');
                appError(SecurityMessages.LICENSE_VALIDATION_ERROR, errorMsg);
                throw new Error(errorMsg);
            }
            
            return {
                status: _.get(data, 'status'),
                plan_id: _.get(data, 'plan.id'),
                plan_type: _.get(data, 'plan.name', PlanType.FREE),
                quota_type: _.get(data, 'quota_type', SecurityConstants.QUOTA_TYPE_DAILY),
                expires_at: _.get(data, 'expires_at', null),
                usage: {
                    video: _.get(data, 'usage.video', 0),
                    image: _.get(data, 'usage.image', 0),
                    voice: _.get(data, 'usage.voice', 0),
                },
                limits: {
                    video: _.get(data, 'plan.quota_video', 0),
                    image: _.get(data, 'plan.quota_image', 0),
                    voice: _.get(data, 'plan.quota_voice', 0),
                    unlimited: _.get(data, 'plan.is_unlimited', false),
                }
            };
        } catch (error: any) {
            appError(SecurityMessages.FAILED_TO_CONNECT, error);
            throw new Error(error.message || SecurityMessages.FAILED_TO_CONNECT);
        }
    }

    static async incrementUsage(licenseKey: string, feature: FeatureType, amount: number = 1): Promise<boolean> {
        if (_.isEmpty(licenseKey)) return false;

        try {
            const response = await fetch(SecurityConstants.GAS_API_URL, {
                method: SecurityConstants.HTTP_POST,
                headers: { 'Content-Type': SecurityConstants.CONTENT_TYPE_JSON },
                body: jsonUtils.safeStringify({
                    action: GasActions.UPDATE_USAGE,
                    admin_key: SecurityConstants.ADMIN_APP_KEY,
                    license_key: licenseKey,
                    feature: feature,
                    amount: amount
                })
            });
            
            const data: any = await response.json();
            if (_.has(data, 'error')) {
                appError(SecurityMessages.USAGE_UPDATE_ERROR, _.get(data, 'error'));
                return false;
            }
            return true;
        } catch (error) {
            appError(SecurityMessages.FAILED_TO_UPDATE_USAGE, error);
            return false;
        }
    }
}
