import fetch from 'node-fetch';
import _ from 'lodash';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { SecurityConstants, SecurityMessages, FeatureType, LicenseStatus } from '../../constants/security.js';
import { appError } from '../../lib/logger.js';

function getHardwareId(): string {
    const deviceIdFile = path.join(process.cwd(), SecurityConstants.DEVICE_ID_FILE_NAME);
    
    if (fs.existsSync(deviceIdFile)) {
        try {
            const data = JSON.parse(fs.readFileSync(deviceIdFile, 'utf8'));
            if (_.has(data, 'deviceId')) return _.get(data, 'deviceId');
        } catch (e) {
            appError(SecurityMessages.ERROR_READING_DEVICE_ID, e);
        }
    }
    
    const newId = crypto.randomUUID();
    fs.writeFileSync(deviceIdFile, JSON.stringify({ deviceId: newId }), 'utf8');
    return newId;
}

export interface LicenseInfo {
    status: LicenseStatus;
    plan_type: string;
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
    };
}

export class LicenseService {
    static async validateKey(licenseKey: string): Promise<LicenseInfo | null> {
        if (_.isEmpty(licenseKey)) return null;
        
        const deviceId = getHardwareId();
        
        try {
            const response = await fetch(SecurityConstants.GAS_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'verify_key',
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
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'update_usage',
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
