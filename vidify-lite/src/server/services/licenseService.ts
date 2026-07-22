import _ from 'lodash';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { SecurityConstants, SecurityMessages, GasActions, FeatureType, LicenseStatus } from '../../constants/security.js';
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
    plan_type: string;
    quota_type: string;
    expires_at: string | null;
    usage: {
        video: number;
        image: number;
        voice: number;
    };
    quotas: {
        free_video: number;
        free_image: number;
        free_voice: number;
        pro_video: number;
        pro_image: number;
        pro_voice: number;
        pro_unlimited: boolean;
        lifetime_video: number;
        lifetime_image: number;
        lifetime_voice: number;
        lifetime_unlimited: boolean;
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
                    license_key: licenseKey,
                    device_id: deviceId
                })
            });
            
            const data: any = await response.json();
            
            if (_.has(data, 'error')) {
                appError(SecurityMessages.LICENSE_VALIDATION_ERROR, _.get(data, 'error'));
                return null;
            }
            
            return {
                status: _.get(data, 'status'),
                plan_type: _.get(data, 'plan_type'),
                quota_type: _.get(data, 'quota_type', 'DAILY'),
                expires_at: _.get(data, 'expires_at', null),
                usage: {
                    video: _.get(data, 'usage.video', 0),
                    image: _.get(data, 'usage.image', 0),
                    voice: _.get(data, 'usage.voice', 0),
                },
                quotas: {
                    free_video: _.get(data, 'quotas.free_video', 0),
                    free_image: _.get(data, 'quotas.free_image', 0),
                    free_voice: _.get(data, 'quotas.free_voice', 0),
                    pro_video: _.get(data, 'quotas.pro_video', 0),
                    pro_image: _.get(data, 'quotas.pro_image', 0),
                    pro_voice: _.get(data, 'quotas.pro_voice', 0),
                    pro_unlimited: _.get(data, 'quotas.pro_unlimited', false),
                    lifetime_video: _.get(data, 'quotas.lifetime_video', 0),
                    lifetime_image: _.get(data, 'quotas.lifetime_image', 0),
                    lifetime_voice: _.get(data, 'quotas.lifetime_voice', 0),
                    lifetime_unlimited: _.get(data, 'quotas.lifetime_unlimited', false),
                }
            };
        } catch (error) {
            appError(SecurityMessages.FAILED_TO_CONNECT, error);
            return null;
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
