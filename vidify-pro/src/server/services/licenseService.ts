import fetch from 'node-fetch';
import _ from 'lodash';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const DEVICE_ID_FILE = path.join(process.cwd(), 'device_id.json');

function getHardwareId(): string {
    if (fs.existsSync(DEVICE_ID_FILE)) {
        try {
            const data = JSON.parse(fs.readFileSync(DEVICE_ID_FILE, 'utf8'));
            if (data.deviceId) return data.deviceId;
        } catch (e) {
            console.error("Error reading device_id.json", e);
        }
    }
    
    const newId = crypto.randomUUID();
    fs.writeFileSync(DEVICE_ID_FILE, JSON.stringify({ deviceId: newId }), 'utf8');
    return newId;
}

// Cần thay bằng URL của Google Apps Script (Web App) sau khi Deploy
const GAS_API_URL = process.env.GAS_API_URL || 'https://script.google.com/macros/s/AKfycbz_XXXXXXXXXXXX/exec';

export interface LicenseInfo {
    status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
    plan_type: 'FREE' | 'PRO_LIFETIME' | 'PRO_MONTHLY' | 'PRO_WEEKLY';
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
    /**
     * Xác thực khóa kích hoạt từ Google Sheets
     */
    static async validateKey(licenseKey: string): Promise<LicenseInfo | null> {
        if (!licenseKey) return null;
        
        const deviceId = getHardwareId();
        
        try {
            const response = await fetch(GAS_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'verify_key',
                    license_key: licenseKey,
                    device_id: deviceId
                })
            });
            
            const data: any = await response.json();
            
            if (data.error) {
                console.error("License Validation Error:", data.error);
                return null;
            }
            
            return {
                status: data.status,
                plan_type: data.plan_type,
                expires_at: data.expires_at || null,
                usage: {
                    video: data.usage.video || 0,
                    image: data.usage.image || 0,
                    voice: data.usage.voice || 0,
                },
                quotas: {
                    free_video: data.quotas?.free_video || 0,
                    free_image: data.quotas?.free_image || 0,
                    free_voice: data.quotas?.free_voice || 0,
                    pro_video: data.quotas?.pro_video || 0,
                    pro_image: data.quotas?.pro_image || 0,
                    pro_voice: data.quotas?.pro_voice || 0,
                    pro_unlimited: data.quotas?.pro_unlimited || false,
                }
            };
        } catch (error) {
            console.error("Failed to connect to License Server:", error);
            // Trong môi trường Offline hoặc đứt mạng, có thể chặn luôn
            return null;
        }
    }

    /**
     * Tăng số lượt sử dụng sau khi tạo thành công
     */
    static async incrementUsage(licenseKey: string, feature: 'video' | 'image' | 'voice', amount: number = 1): Promise<boolean> {
        if (!licenseKey) return false;

        try {
            const response = await fetch(GAS_API_URL, {
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
            if (data.error) {
                console.error("Usage Update Error:", data.error);
                return false;
            }
            return true;
        } catch (error) {
            console.error("Failed to update usage:", error);
            return false;
        }
    }
}
