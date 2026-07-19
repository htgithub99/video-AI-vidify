import { Request, Response, NextFunction } from 'express';
import { LicenseService } from '../services/licenseService.js';
import { appError } from '../../lib/logger.js';

// Bỏ FREE_QUOTAS hardcode, sẽ lấy từ cấu hình trả về của License Server

/**
 * Middleware kiểm tra License Key và Quota trước khi cho phép gọi API
 * Cần truyền license_key qua Header: `x-license-key`
 */
export const requireLicense = (featureType?: 'video' | 'image' | 'voice') => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const licenseKey = req.headers['x-license-key'] as string;

            if (!licenseKey) {
                return res.status(401).json({ error: 'Missing License Key', code: 'LICENSE_MISSING' });
            }

            const license = await LicenseService.validateKey(licenseKey);

            if (!license) {
                return res.status(403).json({ error: 'Invalid or Revoked License', code: 'LICENSE_INVALID' });
            }

            // Gắn vào request để API sau có thể sử dụng nếu cần
            (req as any).licenseInfo = license;

            // Nếu không truyền featureType, chỉ cần check key hợp lệ là đủ (Ví dụ khi lấy danh sách)
            if (!featureType) {
                return next();
            }

            let currentUsage = 0;
            let maxLimit = 0;
            const isPro = license.plan_type.startsWith('PRO');

            // Nếu là PRO và bật tính năng Unlimited -> Bỏ qua check Quota
            if (isPro && license.quotas.pro_unlimited) {
                return next();
            }

            if (featureType === 'video') {
                currentUsage = license.usage.video;
                maxLimit = isPro ? license.quotas.pro_video : license.quotas.free_video;
            } else if (featureType === 'image') {
                currentUsage = license.usage.image;
                maxLimit = isPro ? license.quotas.pro_image : license.quotas.free_image;
            } else if (featureType === 'voice') {
                currentUsage = license.usage.voice;
                maxLimit = isPro ? license.quotas.pro_voice : license.quotas.free_voice;
            }

            if (currentUsage >= maxLimit) {
                const planName = isPro ? "Pro plan" : "Free plan";
                return res.status(403).json({
                    error: `You have reached the limit for ${featureType} generation on your ${planName}.`,
                    code: 'QUOTA_EXCEEDED'
                });
            }

            next();
        } catch (error) {
            appError("RequireLicense Middleware Error", error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    };
};
