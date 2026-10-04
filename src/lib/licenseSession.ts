import { SOURCE_TEMPLATE_PATH_2, SOURCE_TEMPLATE_PATH_DOMAIN, SOURCE_TEMPLATE_SYMBOL_36, SOURCE_TEXT_EXPIRES_THU_01_JAN_1970_00, SOURCE_TEXT_SYMBOL, SOURCE_TEXT_SYMBOL_32, SOURCE_TEXT_SYMBOL_33 } from "../constants/sourceText";
import _ from "lodash";
import { SecurityConstants, REFACTOR_CONSTANTS } from "../constants";
import { storageUtils } from "./storage";
const COOKIE_SEPARATOR = SOURCE_TEXT_SYMBOL_32;
const COOKIE_VALUE_SEPARATOR = SOURCE_TEXT_SYMBOL_33;
const COOKIE_EXPIRED_VALUE = SOURCE_TEXT_EXPIRES_THU_01_JAN_1970_00;
const ROOT_PATH = SOURCE_TEXT_SYMBOL;
const getCookiePaths = (): string[] => {
  const segments = _.compact(_.split(window.location.pathname, ROOT_PATH));
  return _.uniq([ROOT_PATH, ..._.map(segments, (_segment, index) => `${ROOT_PATH}${_.join(_.take(segments, index + 1), ROOT_PATH)}`)]);
};
const getCookieDomains = (): string[] => _.compact([window.location.hostname, SOURCE_TEMPLATE_SYMBOL_36(`${window.location.hostname}`)]);
export const clearBrowserLicenseSession = (): void => {
  window.sessionStorage.removeItem(SecurityConstants.SESSION_TOKEN_KEY);
  storageUtils.remove(SecurityConstants.LOCAL_STORAGE_LICENSE_KEY);
  storageUtils.remove(REFACTOR_CONSTANTS.LICENSE_CACHE_KEY);
  _.forEach(_.split(document.cookie, COOKIE_SEPARATOR), (cookie) => {
    const cookieName = _.trim(_.first(_.split(cookie, COOKIE_VALUE_SEPARATOR)) || SecurityConstants.EMPTY_STRING);
    if (!_.isEmpty(cookieName)) {
      _.forEach(getCookiePaths(), (path) => {
        document.cookie = SOURCE_TEMPLATE_PATH_2(`${cookieName}`, `${COOKIE_EXPIRED_VALUE}`, `${path}`);
        _.forEach(getCookieDomains(), (domain) => {
          document.cookie = SOURCE_TEMPLATE_PATH_DOMAIN(`${cookieName}`, `${COOKIE_EXPIRED_VALUE}`, `${path}`, `${domain}`);
        });
      });
    }
  });
};
export const invalidateBrowserLicenseSession = (): void => {
  clearBrowserLicenseSession();
  window.dispatchEvent(new CustomEvent(SecurityConstants.LICENSE_INVALIDATED_EVENT));
};
export const isLicenseFailureCode = (code: unknown): boolean => _.includes([SecurityConstants.LICENSE_MISSING_CODE, SecurityConstants.LICENSE_INVALID_CODE, SecurityConstants.LICENSE_INACTIVE_CODE], code);
