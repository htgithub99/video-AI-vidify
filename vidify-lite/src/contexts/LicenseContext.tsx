import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { API_ROUTES } from '../constants/apiRoutes';

export interface LicenseInfo {
    status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
    plan_type: 'FREE' | 'PRO';
    usage: {
        video: number;
        image: number;
        voice: number;
    };
}

interface LicenseContextType {
    licenseKey: string | null;
    licenseInfo: LicenseInfo | null;
    isLoading: boolean;
    activateLicense: (key: string) => Promise<boolean>;
    logoutLicense: () => void;
}

const LicenseContext = createContext<LicenseContextType | undefined>(undefined);

export const LicenseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [licenseKey, setLicenseKey] = useState<string | null>(localStorage.getItem('vidify_license_key'));
    const [licenseInfo, setLicenseInfo] = useState<LicenseInfo | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const checkLicense = async (key: string) => {
        try {
            const res = await fetch(`${API_ROUTES.BASE_API}/license/validate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ license_key: key })
            });
            const data = await res.json();
            
            if (data.success && data.data.status === 'ACTIVE') {
                setLicenseInfo(data.data);
                setIsLoading(false);
                return true;
            } else {
                setLicenseInfo(null);
                setLicenseKey(null);
                localStorage.removeItem('vidify_license_key');
                setIsLoading(false);
                return false;
            }
        } catch (error) {
            console.error("Lỗi kiểm tra license:", error);
            setIsLoading(false);
            return false;
        }
    };

    useEffect(() => {
        if (licenseKey) {
            checkLicense(licenseKey);
        } else {
            setIsLoading(false);
        }
    }, [licenseKey]);

    const activateLicense = async (key: string) => {
        setIsLoading(true);
        const isValid = await checkLicense(key);
        if (isValid) {
            setLicenseKey(key);
            localStorage.setItem('vidify_license_key', key);
            return true;
        }
        return false;
    };

    const logoutLicense = () => {
        setLicenseKey(null);
        setLicenseInfo(null);
        localStorage.removeItem('vidify_license_key');
    };

    return (
        <LicenseContext.Provider value={{ licenseKey, licenseInfo, isLoading, activateLicense, logoutLicense }}>
            {children}
        </LicenseContext.Provider>
    );
};

export const useLicense = () => {
    const context = useContext(LicenseContext);
    if (!context) {
        throw new Error("useLicense must be used within a LicenseProvider");
    }
    return context;
};
