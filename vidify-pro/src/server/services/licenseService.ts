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
    plan_id: string;
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
                status: _.get(data, 'user.status'),
                plan_id: _.get(data, 'user.plan_id'),
                quota_type: _.get(data, 'user.quota_type', 'DAILY'),
                expires_at: _.get(data, 'user.expires_at', null),
                usage: {
                    video: _.get(data, 'usage.video', 0),
                    image: _.get(data, 'usage.image', 0),
                    voice: _.get(data, 'usage.voice', 0),
                },
                limits: {
                    video: _.get(data, 'limits.video', 0),
                    image: _.get(data, 'limits.image', 0),
                    voice: _.get(data, 'limits.voice', 0),
                    unlimited: _.get(data, 'limits.unlimited', false),
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
