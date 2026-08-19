import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { API_ROUTES } from '../constants/apiRoutes';
import { SecurityConstants, LicenseStatus, SecurityMessages, REFACTOR_CONSTANTS } from '../constants';
import _ from 'lodash';
import { clearBrowserLicenseSession } from '../lib/licenseSession';
import { jsonUtils } from '../lib/json';

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

const validateLicenseApi = async (key: string) => {
  const response = await fetch(API_ROUTES.LICENSE_VALIDATE, {
    method: REFACTOR_CONSTANTS.LICENSE_METHOD_POST,
    headers: { [REFACTOR_CONSTANTS.LICENSE_HEADER_CONTENT_TYPE]: REFACTOR_CONSTANTS.LICENSE_VALUE_APPLICATION_JSON },
    body: jsonUtils.safeStringify({ [REFACTOR_CONSTANTS.LICENSE_KEY_LICENSE_KEY]: key }),
  });
  const data = await response.json().catch(() => null);
  return { response, data };
};

const getInitialLicenseKey = (): string | null => {
  const envKey =
    (import.meta as any).env?.VITE_LICENSE_KEY ||
    (import.meta as any).env?.VIDIFY_LICENSE_KEY ||
    (import.meta as any).env?.LICENSE_KEY;

  if (!_.isEmpty(envKey) && _.isString(envKey)) {
    const cleanEnvKey = _.trim(envKey);
    localStorage.setItem(SecurityConstants.LOCAL_STORAGE_LICENSE_KEY, cleanEnvKey);
    return cleanEnvKey;
  }

  const stored = localStorage.getItem(SecurityConstants.LOCAL_STORAGE_LICENSE_KEY);
  if (!_.isEmpty(stored)) return _.trim(stored);

  if (!_.isEmpty(SecurityConstants.DEFAULT_LICENSE_KEY)) {
    localStorage.setItem(SecurityConstants.LOCAL_STORAGE_LICENSE_KEY, SecurityConstants.DEFAULT_LICENSE_KEY);
    return SecurityConstants.DEFAULT_LICENSE_KEY;
  }
  return null;
};

export const LicenseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const [licenseKey, setLicenseKeyState] = useState<string | null>(getInitialLicenseKey);

  useEffect(() => {
    if (!licenseKey) {
      fetch(`${API_ROUTES.LICENSE}/default-key`)
        .then((res) => res.json())
        .then((data) => {
          if (data?.license_key) {
            setLicenseKeyState(data.license_key);
            localStorage.setItem(SecurityConstants.LOCAL_STORAGE_LICENSE_KEY, data.license_key);
          }
        })
        .catch(() => {});
    }
  }, [licenseKey]);

  const clearInvalidLicenseState = useCallback(() => {
    clearBrowserLicenseSession();
    const envKey =
      (import.meta as any).env?.VITE_LICENSE_KEY ||
      (import.meta as any).env?.VIDIFY_LICENSE_KEY ||
      (import.meta as any).env?.LICENSE_KEY;
    const fallbackKey = !_.isEmpty(envKey) ? _.trim(envKey) : SecurityConstants.DEFAULT_LICENSE_KEY;

    if (!_.isEmpty(fallbackKey)) {
      setLicenseKeyState(fallbackKey);
      localStorage.setItem(SecurityConstants.LOCAL_STORAGE_LICENSE_KEY, fallbackKey);
    } else {
      setLicenseKeyState(null);
    }
    queryClient.clear();
  }, [queryClient]);

  useEffect(() => {
    window.addEventListener(SecurityConstants.LICENSE_INVALIDATED_EVENT, clearInvalidLicenseState);
    return () => window.removeEventListener(SecurityConstants.LICENSE_INVALIDATED_EVENT, clearInvalidLicenseState);
  }, [clearInvalidLicenseState]);

  const { data: licenseInfo, isLoading: isQueryLoading, refetch } = useQuery<LicenseInfo | null>({
    queryKey: [REFACTOR_CONSTANTS.LICENSE_QUERY_KEY, licenseKey],
    queryFn: async () => {
      if (_.isEmpty(licenseKey)) return null;
      const { response, data } = await validateLicenseApi(licenseKey);

      if (!_.get(data, SecurityConstants.SUCCESS_KEY)) {
        if (_.includes([SecurityConstants.HTTP_BAD_REQUEST, SecurityConstants.HTTP_UNAUTHORIZED, SecurityConstants.HTTP_FORBIDDEN], response.status)) {
          clearInvalidLicenseState();
        }
        throw new Error(_.get(data, SecurityConstants.ERROR_KEY) || REFACTOR_CONSTANTS.LICENSE_ERR_INVALID_LICENSE);
      }

      const status = _.get(data, SecurityConstants.DATA_STATUS_PATH);
      if (_.isEqual(status, LicenseStatus.ACTIVE)) {
        return _.get(data, SecurityConstants.DATA_KEY);
      }

      clearInvalidLicenseState();
      throw new Error(REFACTOR_CONSTANTS.LICENSE_ERR_INVALID_LICENSE_STATUS);
    },
    initialData: () => jsonUtils.getItem<LicenseInfo | null>(REFACTOR_CONSTANTS.LICENSE_CACHE_KEY, null),
    enabled: !_.isEmpty(licenseKey),
    staleTime: REFACTOR_CONSTANTS.STALE_TIME_LICENSE_MS,
  });

  useEffect(() => {
    if (licenseInfo) {
      jsonUtils.setItem(REFACTOR_CONSTANTS.LICENSE_CACHE_KEY, licenseInfo);
    }
  }, [licenseInfo]);

  useEffect(() => {
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
      const { response, data } = await validateLicenseApi(key);

      if (!_.get(data, SecurityConstants.SUCCESS_KEY)) {
        if (_.includes([SecurityConstants.HTTP_BAD_REQUEST, SecurityConstants.HTTP_UNAUTHORIZED, SecurityConstants.HTTP_FORBIDDEN], response.status)) {
          clearInvalidLicenseState();
        }
        return _.get(data, SecurityConstants.ERROR_KEY) || false;
      }

      const status = _.get(data, SecurityConstants.DATA_STATUS_PATH);
      if (_.isEqual(status, LicenseStatus.ACTIVE)) {
        localStorage.setItem(SecurityConstants.LOCAL_STORAGE_LICENSE_KEY, key);
        setLicenseKeyState(key);
        queryClient.setQueryData([REFACTOR_CONSTANTS.LICENSE_QUERY_KEY, key], _.get(data, SecurityConstants.DATA_KEY));
        return true;
      }
      clearInvalidLicenseState();
      return false;
    } catch (error: any) {
      return _.get(error, 'message', false);
    }
  };

  const logoutLicense = () => {
    localStorage.removeItem(SecurityConstants.LOCAL_STORAGE_LICENSE_KEY);
    jsonUtils.removeItem(REFACTOR_CONSTANTS.LICENSE_CACHE_KEY);
    setLicenseKeyState(null);
    queryClient.setQueryData([REFACTOR_CONSTANTS.LICENSE_QUERY_KEY, licenseKey], null);
  };

  const isLoading = !_.isEmpty(licenseKey) && isQueryLoading && !licenseInfo;

  return (
    <LicenseContext.Provider value={{
      licenseKey,
      licenseInfo: licenseInfo || null,
      isLoading,
      activateLicense,
      logoutLicense,
      refetchLicense: refetch,
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
