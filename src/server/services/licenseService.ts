import _ from "lodash";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import nodeMachineId from "node-machine-id";
import { SecurityConstants, SecurityMessages, GasActions, FeatureType, LicenseStatus, PlanType } from "../../constants/security.js";
import { jsonUtils } from "../../lib/json.js";
import { appError } from "../../lib/logger.js";

const { machineIdSync } = nodeMachineId;

const readHardwareIdentifier = (): string => {
  try {
    return machineIdSync(true);
  } catch (error) {
    appError(SecurityMessages.ERROR_READING_DEVICE_ID, error);
    return SecurityConstants.EMPTY_STRING;
  }
};

const readPersistedDeviceId = (): string => {
  const deviceIdFile = path.join(process.cwd(), SecurityConstants.DEVICE_ID_FILE_NAME);
  if (!fs.existsSync(deviceIdFile)) return SecurityConstants.EMPTY_STRING;
  try {
    return _.get(jsonUtils.safeParse(fs.readFileSync(deviceIdFile, SecurityConstants.UTF8_ENCODING as BufferEncoding), {}), SecurityConstants.DEVICE_ID_KEY, SecurityConstants.EMPTY_STRING);
  } catch {
    return SecurityConstants.EMPTY_STRING;
  }
};

const generateAndPersistDeviceId = (): string => {
  const rawId = crypto.randomUUID();
  try {
    fs.writeFileSync(path.join(process.cwd(), SecurityConstants.DEVICE_ID_FILE_NAME), jsonUtils.safeStringify({ [SecurityConstants.DEVICE_ID_KEY]: rawId }), SecurityConstants.UTF8_ENCODING as BufferEncoding);
  } catch {}
  return rawId;
};

const resolveRawDeviceId = (): string => {
  const hardwareId = readHardwareIdentifier();
  if (!_.isEmpty(hardwareId)) return hardwareId;
  const persistedId = readPersistedDeviceId();
  return !_.isEmpty(persistedId) ? persistedId : generateAndPersistDeviceId();
};

const getHardwareId = (): string =>
  crypto
    .createHash(SecurityConstants.ALGORITHM_SHA256)
    .update(_.join([process.platform, process.arch, resolveRawDeviceId()], SecurityConstants.HYPHEN))
    .digest(SecurityConstants.ENCODING_HEX as crypto.BinaryToTextEncoding)
    .substring(SecurityConstants.ZERO, SecurityConstants.SUBSTRING_LEN_32);

export interface LicenseInfo {
  status: LicenseStatus;
  plan_id: string;
  plan_type: string;
  quota_type: string;
  expires_at: string | null;
  usage: { video: number; image: number; voice: number };
  limits: { video: number; image: number; voice: number; unlimited: boolean };
}

export class LicenseValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "LicenseValidationError";
  }
}

interface CachedLicenseEntry {
  info: LicenseInfo;
  timestamp: number;
}
const licenseCache = new Map<string, CachedLicenseEntry>();
const inFlightValidations = new Map<string, Promise<LicenseInfo | null>>();

const createDefaultLicenseInfo = (): LicenseInfo => ({
  status: LicenseStatus.ACTIVE,
  plan_id: PlanType.PRO_LIFETIME,
  plan_type: PlanType.PRO_LIFETIME,
  quota_type: SecurityConstants.QUOTA_TYPE_TOTAL,
  expires_at: null,
  usage: { video: SecurityConstants.ZERO, image: SecurityConstants.ZERO, voice: SecurityConstants.ZERO },
  limits: { video: SecurityConstants.ZERO, image: SecurityConstants.ZERO, voice: SecurityConstants.ZERO, unlimited: true },
});

const isRecognizedServerLicenseKey = (key: string): boolean => _.includes(_.compact([SecurityConstants.DEFAULT_LICENSE_KEY, process.env.VIDIFY_LICENSE_KEY, process.env.VITE_LICENSE_KEY, process.env.LICENSE_KEY]), key);

const parseLicenseInfoFromGasResponse = (data: Record<string, unknown>): LicenseInfo => ({
  status: _.toUpper(_.trim(_.toString(_.get(data, SecurityConstants.STATUS_KEY)))) as LicenseStatus,
  plan_id: _.get(data, SecurityConstants.PLAN_ID_KEY) as string,
  plan_type: _.toUpper(_.trim(_.toString(_.get(data, SecurityConstants.PLAN_NAME_KEY, PlanType.FREE)))) as PlanType,
  quota_type: _.toUpper(_.trim(_.toString(_.get(data, SecurityConstants.QUOTA_TYPE_KEY, SecurityConstants.QUOTA_TYPE_DAILY)))),
  expires_at: _.get(data, SecurityConstants.EXPIRES_AT_KEY, null) as string | null,
  usage: {
    video: _.toFinite(_.get(data, SecurityConstants.USAGE_VIDEO_KEY, SecurityConstants.ZERO)),
    image: _.toFinite(_.get(data, SecurityConstants.USAGE_IMAGE_KEY, SecurityConstants.ZERO)),
    voice: _.toFinite(_.get(data, SecurityConstants.USAGE_VOICE_KEY, SecurityConstants.ZERO)),
  },
  limits: {
    video: _.toFinite(_.get(data, SecurityConstants.PLAN_QUOTA_VIDEO, SecurityConstants.ZERO)),
    image: _.toFinite(_.get(data, SecurityConstants.PLAN_QUOTA_IMAGE, SecurityConstants.ZERO)),
    voice: _.toFinite(_.get(data, SecurityConstants.PLAN_QUOTA_VOICE, SecurityConstants.ZERO)),
    unlimited: Boolean(_.get(data, SecurityConstants.PLAN_IS_UNLIMITED, false)),
  },
});

const executeGasVerification = async (licenseKey: string, deviceId: string): Promise<LicenseInfo> => {
  const response = await fetch(SecurityConstants.GAS_API_URL, {
    method: SecurityConstants.HTTP_POST,
    headers: { [SecurityConstants.HEADER_CONTENT_TYPE]: SecurityConstants.CONTENT_TYPE_JSON },
    body: jsonUtils.safeStringify({ action: GasActions.VERIFY_KEY, admin_key: SecurityConstants.ADMIN_APP_KEY, license_key: licenseKey, device_id: deviceId }),
  });
  const data = (await response.json()) as Record<string, unknown>;
  if (_.has(data, SecurityConstants.ERROR_KEY)) {
    const errorMsg = _.toString(_.get(data, SecurityConstants.ERROR_KEY));
    appError(SecurityMessages.LICENSE_VALIDATION_ERROR, errorMsg);
    throw new LicenseValidationError(errorMsg);
  }
  return parseLicenseInfoFromGasResponse(data);
};

export class LicenseService {
  static async validateKey(licenseKey: string): Promise<LicenseInfo | null> {
    if (_.isEmpty(licenseKey)) return null;
    if (isRecognizedServerLicenseKey(licenseKey)) {
      const fixedInfo = createDefaultLicenseInfo();
      licenseCache.set(licenseKey, { info: fixedInfo, timestamp: Date.now() });
      return fixedInfo;
    }
    const cached = licenseCache.get(licenseKey);
    if (cached && _.lt(_.subtract(Date.now(), cached.timestamp), SecurityConstants.LICENSE_CACHE_TTL_MS)) return cached.info;
    if (inFlightValidations.has(licenseKey)) return inFlightValidations.get(licenseKey)!;

    const promise = (async () => {
      const deviceId = getHardwareId();
      try {
        const info = await executeGasVerification(licenseKey, deviceId);
        licenseCache.set(licenseKey, { info, timestamp: Date.now() });
        return info;
      } catch (error: unknown) {
        if (error instanceof LicenseValidationError) throw error;
        if (cached) return cached.info;
        if (isRecognizedServerLicenseKey(licenseKey)) {
          const fallbackInfo = createDefaultLicenseInfo();
          licenseCache.set(licenseKey, { info: fallbackInfo, timestamp: Date.now() });
          return fallbackInfo;
        }
        appError(SecurityMessages.FAILED_TO_CONNECT, error);
        throw new Error(_.defaultTo(error instanceof Error ? error.message : SecurityMessages.FAILED_TO_CONNECT, SecurityMessages.FAILED_TO_CONNECT));
      } finally {
        inFlightValidations.delete(licenseKey);
      }
    })();

    inFlightValidations.set(licenseKey, promise);
    return promise;
  }

  static async incrementUsage(licenseKey: string, feature: FeatureType, amount: number = SecurityConstants.DEFAULT_AMOUNT): Promise<boolean> {
    if (_.isEmpty(licenseKey)) return false;
    if (isRecognizedServerLicenseKey(licenseKey)) return true;
    const deviceId = getHardwareId();
    try {
      const response = await fetch(SecurityConstants.GAS_API_URL, {
        method: SecurityConstants.HTTP_POST,
        headers: { [SecurityConstants.HEADER_CONTENT_TYPE]: SecurityConstants.CONTENT_TYPE_JSON },
        body: jsonUtils.safeStringify({ action: GasActions.UPDATE_USAGE, admin_key: SecurityConstants.ADMIN_APP_KEY, license_key: licenseKey, device_id: deviceId, feature, amount }),
      });
      const data = (await response.json()) as Record<string, unknown>;
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
