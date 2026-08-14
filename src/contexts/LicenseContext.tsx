import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { API_ROUTES } from '../constants/apiRoutes';
import { SecurityConstants, LicenseStatus, SecurityMessages, REFACTOR_CONSTANTS } from '../constants';
import _ from 'lodash';
import { clearBrowserLicenseSession } from '../lib/licenseSession';

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
    refetchLicense: () => void;
}

const LicenseContext = createContext<LicenseContextType | undefined>(undefined);

const QUERY_KEY = REFACTOR_CONSTANTS.LICENSE_QUERY_KEY;
const METHOD_POST = REFACTOR_CONSTANTS.LICENSE_METHOD_POST;
const HEADER_CONTENT_TYPE = REFACTOR_CONSTANTS.LICENSE_HEADER_CONTENT_TYPE;
const VALUE_APPLICATION_JSON = REFACTOR_CONSTANTS.LICENSE_VALUE_APPLICATION_JSON;
const KEY_LICENSE_KEY = REFACTOR_CONSTANTS.LICENSE_KEY_LICENSE_KEY;
const ERR_INVALID_LICENSE = REFACTOR_CONSTANTS.LICENSE_ERR_INVALID_LICENSE;
const ERR_INVALID_LICENSE_STATUS = REFACTOR_CONSTANTS.LICENSE_ERR_INVALID_LICENSE_STATUS;
const CACHE_LICENSE_INFO_KEY = REFACTOR_CONSTANTS.LICENSE_CACHE_KEY;
const STALE_TIME = REFACTOR_CONSTANTS.STALE_TIME_LICENSE_MS;

export const LicenseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const queryClient = useQueryClient();
    const [licenseKey, setLicenseKeyState] = useState<string | null>(() => {
        const stored = localStorage.getItem(SecurityConstants.LOCAL_STORAGE_LICENSE_KEY);
        if (stored) return stored;
        if (SecurityConstants.DEFAULT_LICENSE_KEY) {
            localStorage.setItem(SecurityConstants.LOCAL_STORAGE_LICENSE_KEY, SecurityConstants.DEFAULT_LICENSE_KEY);
            return SecurityConstants.DEFAULT_LICENSE_KEY;
        }
        return null;
    });

    const clearInvalidLicenseState = React.useCallback(() => {
        clearBrowserLicenseSession();
        if (SecurityConstants.DEFAULT_LICENSE_KEY) {
            setLicenseKeyState(SecurityConstants.DEFAULT_LICENSE_KEY);
            localStorage.setItem(SecurityConstants.LOCAL_STORAGE_LICENSE_KEY, SecurityConstants.DEFAULT_LICENSE_KEY);
        } else {
            setLicenseKeyState(null);
        }
        queryClient.clear();
    }, [queryClient]);

    React.useEffect(() => {
        window.addEventListener(SecurityConstants.LICENSE_INVALIDATED_EVENT, clearInvalidLicenseState);
        return () => window.removeEventListener(SecurityConstants.LICENSE_INVALIDATED_EVENT, clearInvalidLicenseState);
    }, [clearInvalidLicenseState]);

    const { data: licenseInfo, isLoading: isQueryLoading, refetch } = useQuery<LicenseInfo | null>({
        queryKey: [QUERY_KEY, licenseKey],
        queryFn: async () => {
            if (_.isEmpty(licenseKey)) return null;
            const res = await fetch(API_ROUTES.LICENSE_VALIDATE, {
                method: METHOD_POST,
                headers: { [HEADER_CONTENT_TYPE]: VALUE_APPLICATION_JSON },
                body: JSON.stringify({ [KEY_LICENSE_KEY]: licenseKey })
            });
            const data = await res.json();
            
            if (!data.success) {
                if (_.includes([SecurityConstants.HTTP_BAD_REQUEST, SecurityConstants.HTTP_UNAUTHORIZED, SecurityConstants.HTTP_FORBIDDEN], res.status)) {
                    clearInvalidLicenseState();
                }
                throw new Error(data.error || ERR_INVALID_LICENSE);
            }

            const status = _.get(data, SecurityConstants.DATA_STATUS_PATH);
            if (_.isEqual(status, LicenseStatus.ACTIVE)) {
                return _.get(data, SecurityConstants.DATA_KEY);
            }
            
            clearInvalidLicenseState();
            throw new Error(ERR_INVALID_LICENSE_STATUS);
        },
        initialData: () => {
            const cached = localStorage.getItem(CACHE_LICENSE_INFO_KEY);
            return cached ? JSON.parse(cached) : null;
        },
        enabled: !_.isEmpty(licenseKey),
        staleTime: STALE_TIME,
    });

    React.useEffect(() => {
        if (licenseInfo) {
            localStorage.setItem(CACHE_LICENSE_INFO_KEY, JSON.stringify(licenseInfo));
        }
    }, [licenseInfo]);

    React.useEffect(() => {
        let refreshTimer: number | undefined;
        const handleUsageUpdated = () => {
            if (_.isEmpty(licenseKey)) return;
            if (_.isNumber(refreshTimer)) window.clearTimeout(refreshTimer);
            refreshTimer = window.setTimeout(() => {
                void refetch();
            }, REFACTOR_CONSTANTS.USAGE_REFRESH_DEBOUNCE_MS);
        };

        window.addEventListener(SecurityConstants.USAGE_UPDATED_EVENT, handleUsageUpdated);
        return () => {
            window.removeEventListener(SecurityConstants.USAGE_UPDATED_EVENT, handleUsageUpdated);
            if (_.isNumber(refreshTimer)) window.clearTimeout(refreshTimer);
        };
    }, [licenseKey, refetch]);

    const activateLicense = async (key: string): Promise<boolean | string> => {
        try {
            const res = await fetch(API_ROUTES.LICENSE_VALIDATE, {
                method: METHOD_POST,
                headers: { [HEADER_CONTENT_TYPE]: VALUE_APPLICATION_JSON },
                body: JSON.stringify({ [KEY_LICENSE_KEY]: key })
            });
            const data = await res.json();
            
            if (!data.success) {
                if (_.includes([SecurityConstants.HTTP_BAD_REQUEST, SecurityConstants.HTTP_UNAUTHORIZED, SecurityConstants.HTTP_FORBIDDEN], res.status)) {
                    clearInvalidLicenseState();
                }
                return data.error || false;
            }

            const status = _.get(data, SecurityConstants.DATA_STATUS_PATH);
            if (_.isEqual(status, LicenseStatus.ACTIVE)) {
                localStorage.setItem(SecurityConstants.LOCAL_STORAGE_LICENSE_KEY, key);
                setLicenseKeyState(key);
                queryClient.setQueryData([QUERY_KEY, key], _.get(data, SecurityConstants.DATA_KEY));
                return true;
            }
            clearInvalidLicenseState();
            return false;
        } catch (e: any) {
            return e.message || false;
        }
    };

    const logoutLicense = () => {
        localStorage.removeItem(SecurityConstants.LOCAL_STORAGE_LICENSE_KEY);
        localStorage.removeItem(CACHE_LICENSE_INFO_KEY);
        setLicenseKeyState(null);
        queryClient.setQueryData([QUERY_KEY, licenseKey], null);
    };

    const isLoading = !_.isEmpty(licenseKey) && isQueryLoading && !licenseInfo;

    return (
        <LicenseContext.Provider value={{
            licenseKey,
            licenseInfo: licenseInfo || null,
            isLoading,
            activateLicense,
            logoutLicense,
            refetchLicense: refetch
        }}>
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
