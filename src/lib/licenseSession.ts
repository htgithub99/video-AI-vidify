import _ from "lodash";
import { SecurityConstants, REFACTOR_CONSTANTS } from "../constants";
import { storageUtils } from "./storage";

const COOKIE_SEPARATOR = ";";
const COOKIE_VALUE_SEPARATOR = "=";
const COOKIE_EXPIRED_VALUE = "=; expires=Thu, 01 Jan 1970 00:00:00 GMT";
const ROOT_PATH = "/";

const getCookiePaths = (): string[] => {
  const segments = _.compact(_.split(window.location.pathname, ROOT_PATH));
  return _.uniq([ROOT_PATH, ..._.map(segments, (_segment, index) => `${ROOT_PATH}${_.join(_.take(segments, index + 1), ROOT_PATH)}`)]);
};

const getCookieDomains = (): string[] => _.compact([window.location.hostname, `.${window.location.hostname}`]);

export const clearBrowserLicenseSession = (): void => {
  window.sessionStorage.removeItem(SecurityConstants.SESSION_TOKEN_KEY);
  storageUtils.remove(SecurityConstants.LOCAL_STORAGE_LICENSE_KEY);
  storageUtils.remove(REFACTOR_CONSTANTS.LICENSE_CACHE_KEY);

  _.forEach(_.split(document.cookie, COOKIE_SEPARATOR), (cookie) => {
    const cookieName = _.trim(_.first(_.split(cookie, COOKIE_VALUE_SEPARATOR)) || SecurityConstants.EMPTY_STRING);
    if (!_.isEmpty(cookieName)) {
      _.forEach(getCookiePaths(), (path) => {
        document.cookie = `${cookieName}${COOKIE_EXPIRED_VALUE}; path=${path}`;
        _.forEach(getCookieDomains(), (domain) => {
          document.cookie = `${cookieName}${COOKIE_EXPIRED_VALUE}; path=${path}; domain=${domain}`;
        });
      });
    }
  });
};

export const invalidateBrowserLicenseSession = (): void => {
  clearBrowserLicenseSession();
  window.dispatchEvent(new CustomEvent(SecurityConstants.LICENSE_INVALIDATED_EVENT));
};

export const isLicenseFailureCode = (code: unknown): boolean =>
  _.includes([SecurityConstants.LICENSE_MISSING_CODE, SecurityConstants.LICENSE_INVALID_CODE, SecurityConstants.LICENSE_INACTIVE_CODE], code);
