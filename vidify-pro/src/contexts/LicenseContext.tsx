import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { API_ROUTES } from '../constants/apiRoutes';
import { SecurityConstants, LicenseStatus, SecurityMessages } from '../constants/security';
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
    limits: {
        video: number;
        image: number;
        voice: number;
        unlimited: boolean;
    };
}

interface LicenseContextType {
    licenseKey: string | null;
    licenseInfo: LicenseInfo | null;
    isLoading: boolean;
    activateLicense: (key: string) => Promise<boolean | string>;
    logoutLicense: () => void;
}

const LicenseContext = createContext<LicenseContextType | undefined>(undefined);

export const LicenseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [licenseKey, setLicenseKey] = useState<string | null>(localStorage.getItem(SecurityConstants.LOCAL_STORAGE_LICENSE_KEY));
    const [licenseInfo, setLicenseInfo] = useState<LicenseInfo | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const checkLicense = async (key: string): Promise<boolean | string> => {
        try {
            const res = await fetch(`${API_ROUTES.BASE_API}/license/validate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ license_key: key })
            });
            const data = await res.json();
            
            if (!data.success) {
                setLicenseInfo(null);
                setLicenseKey(null);
                localStorage.removeItem(SecurityConstants.LOCAL_STORAGE_LICENSE_KEY);
                setIsLoading(false);
                return data.error || false;
            }

            const status = _.get(data, 'data.status');
            if (_.includes([LicenseStatus.ACTIVE, LicenseStatus.REVOKED, LicenseStatus.EXPIRED], status)) {
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
            appError(SecurityMessages.LICENSE_CHECK_ERROR, error);
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

    const activateLicense = async (key: string): Promise<boolean | string> => {
        setIsLoading(true);
        const result = await checkLicense(key);
        if (result === true) {
            setLicenseKey(key);
            localStorage.setItem(SecurityConstants.LOCAL_STORAGE_LICENSE_KEY, key);
            return true;
        }
        return result;
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
        throw new Error(SecurityMessages.LICENSE_CONTEXT_ERROR);
    }
    return context;
};
