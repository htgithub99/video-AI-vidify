import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { API_ROUTES } from '../constants/apiRoutes';
import { SecurityConstants, LicenseStatus } from '../constants/security';
import { appError } from '../lib/logger';
import _ from 'lodash';

export interface LicenseInfo {
    status: LicenseStatus;
    plan_type: string;
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
    const [licenseKey, setLicenseKey] = useState<string | null>(localStorage.getItem(SecurityConstants.LOCAL_STORAGE_LICENSE_KEY));
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
            
            if (_.get(data, 'success') && _.get(data, 'data.status') === LicenseStatus.ACTIVE) {
                setLicenseInfo(_.get(data, 'data'));
                setIsLoading(false);
                return true;
            }
            
            setLicenseInfo(null);
            setLicenseKey(null);
            localStorage.removeItem(SecurityConstants.LOCAL_STORAGE_LICENSE_KEY);
            setIsLoading(false);
            return false;
        } catch (error) {
            appError("Lỗi kiểm tra license:", error);
            setIsLoading(false);
            return false;
        }
    };

    useEffect(() => {
        if (!_.isEmpty(licenseKey)) {
            checkLicense(licenseKey as string);
        } else {
            setIsLoading(false);
        }
    }, [licenseKey]);

    const activateLicense = async (key: string) => {
        setIsLoading(true);
        const isValid = await checkLicense(key);
        if (isValid) {
            setLicenseKey(key);
            localStorage.setItem(SecurityConstants.LOCAL_STORAGE_LICENSE_KEY, key);
            return true;
        }
        return false;
    };

    const logoutLicense = () => {
        setLicenseKey(null);
        setLicenseInfo(null);
        localStorage.removeItem(SecurityConstants.LOCAL_STORAGE_LICENSE_KEY);
    };

    return (
        <LicenseContext.Provider value={{ licenseKey, licenseInfo, isLoading, activateLicense, logoutLicense }}>
            {children}
        </LicenseContext.Provider>
    );
};

export const useLicense = () => {
    const context = useContext(LicenseContext);
    if (_.isNil(context)) {
        throw new Error("useLicense must be used within a LicenseProvider");
    }
    return context;
};
