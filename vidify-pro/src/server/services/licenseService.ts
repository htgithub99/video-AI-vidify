import _ from 'lodash';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { SecurityConstants, SecurityMessages, GasActions, FeatureType, LicenseStatus, PlanType } from '../../constants/security.js';
import { jsonUtils } from '../../lib/json.js';
import { appError } from '../../lib/logger.js';
import nodeMachineId from 'node-machine-id';
const { machineIdSync } = nodeMachineId;

function getHardwareId(): string {
    let rawId = SecurityConstants.EMPTY_STRING;
    try {
        rawId = machineIdSync(true);
    } catch (e) {
        appError(SecurityMessages.ERROR_READING_DEVICE_ID, e);
    }

    if (_.isEmpty(rawId)) {
        const deviceIdFile = path.join(process.cwd(), SecurityConstants.DEVICE_ID_FILE_NAME);
        if (fs.existsSync(deviceIdFile)) {
            try {
                const data = jsonUtils.safeParse(fs.readFileSync(deviceIdFile, SecurityConstants.UTF8_ENCODING as BufferEncoding), {});
                if (_.has(data, SecurityConstants.DEVICE_ID_KEY)) {
                    rawId = _.get(data, SecurityConstants.DEVICE_ID_KEY);
                }
            } catch (e) {}
        }
    }

    if (_.isEmpty(rawId)) {
        rawId = crypto.randomUUID();
        try {
            const deviceIdFile = path.join(process.cwd(), SecurityConstants.DEVICE_ID_FILE_NAME);
            fs.writeFileSync(deviceIdFile, jsonUtils.safeStringify({ [SecurityConstants.DEVICE_ID_KEY]: rawId }), SecurityConstants.UTF8_ENCODING as BufferEncoding);
        } catch (e) {}
    }

    return crypto.createHash(SecurityConstants.ALGORITHM_SHA256)
        .update(_.join([process.platform, process.arch, rawId], SecurityConstants.HYPHEN))
        .digest(SecurityConstants.ENCODING_HEX as crypto.BinaryToTextEncoding)
        .substring(SecurityConstants.ZERO, SecurityConstants.SUBSTRING_LEN_32);
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

export class LicenseValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'LicenseValidationError';
    }
}

export class LicenseService {
    static async validateKey(licenseKey: string): Promise<LicenseInfo | null> {
        if (_.isEmpty(licenseKey)) return null;
        
        const deviceId = getHardwareId();
        
        try {
            const response = await fetch(SecurityConstants.GAS_API_URL, {
                method: SecurityConstants.HTTP_POST,
                headers: { [SecurityConstants.HEADER_CONTENT_TYPE]: SecurityConstants.CONTENT_TYPE_JSON },
                body: jsonUtils.safeStringify({
                    action: GasActions.VERIFY_KEY,
                    admin_key: SecurityConstants.ADMIN_APP_KEY,
                    license_key: licenseKey,
                    device_id: deviceId
                })
            });
            
            const data: any = await response.json();
            
            if (_.has(data, SecurityConstants.ERROR_KEY)) {
                const errorMsg = _.get(data, SecurityConstants.ERROR_KEY);
                appError(SecurityMessages.LICENSE_VALIDATION_ERROR, errorMsg);
                throw new LicenseValidationError(errorMsg);
            }
            
            return {
                status: _.get(data, SecurityConstants.STATUS_KEY),
                plan_id: _.get(data, SecurityConstants.PLAN_ID_KEY),
                plan_type: _.get(data, SecurityConstants.PLAN_NAME_KEY, PlanType.FREE),
                quota_type: _.get(data, SecurityConstants.QUOTA_TYPE_KEY, SecurityConstants.QUOTA_TYPE_DAILY),
                expires_at: _.get(data, SecurityConstants.EXPIRES_AT_KEY, null),
                usage: {
                    video: _.get(data, SecurityConstants.USAGE_VIDEO_KEY, SecurityConstants.ZERO),
                    image: _.get(data, SecurityConstants.USAGE_IMAGE_KEY, SecurityConstants.ZERO),
                    voice: _.get(data, SecurityConstants.USAGE_VOICE_KEY, SecurityConstants.ZERO),
                },
                limits: {
                    video: _.get(data, SecurityConstants.PLAN_QUOTA_VIDEO, SecurityConstants.ZERO),
                    image: _.get(data, SecurityConstants.PLAN_QUOTA_IMAGE, SecurityConstants.ZERO),
                    voice: _.get(data, SecurityConstants.PLAN_QUOTA_VOICE, SecurityConstants.ZERO),
                    unlimited: _.get(data, SecurityConstants.PLAN_IS_UNLIMITED, false),
                }
            };
        } catch (error: any) {
            if (error instanceof LicenseValidationError) {
                throw error;
            }
            appError(SecurityMessages.FAILED_TO_CONNECT, error);
            throw new Error(error.message || SecurityMessages.FAILED_TO_CONNECT);
        }
    }

    static async incrementUsage(licenseKey: string, feature: FeatureType, amount: number = SecurityConstants.DEFAULT_AMOUNT): Promise<boolean> {
        if (_.isEmpty(licenseKey)) return false;

        try {
            const response = await fetch(SecurityConstants.GAS_API_URL, {
                method: SecurityConstants.HTTP_POST,
                headers: { [SecurityConstants.HEADER_CONTENT_TYPE]: SecurityConstants.CONTENT_TYPE_JSON },
                body: jsonUtils.safeStringify({
                    action: GasActions.UPDATE_USAGE,
                    admin_key: SecurityConstants.ADMIN_APP_KEY,
                    license_key: licenseKey,
                    feature: feature,
                    amount: amount
                })
            });
            
            const data: any = await response.json();
            if (_.has(data, SecurityConstants.ERROR_KEY)) {
                appError(SecurityMessages.USAGE_UPDATE_ERROR, _.get(data, SecurityConstants.ERROR_KEY));
                return false;
            }
            return true;
        } catch (error) {
            appError(SecurityMessages.FAILED_TO_UPDATE_USAGE, error);
            return false;
        }
    }
}
