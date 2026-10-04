import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { LicenseProvider } from "./contexts/LicenseContext.tsx";
import { LicenseActivation } from "./components/LicenseActivation.tsx";
import { API_ROUTES, REFACTOR_CONSTANTS, SecurityConstants } from "./constants";
import _ from "lodash";
import { invalidateBrowserLicenseSession, isLicenseFailureCode } from "./lib/licenseSession";
const urlParams = new URLSearchParams(window.location.search);
const tokenFromUrl = urlParams.get(SecurityConstants.QUERY_TOKEN_KEY);
if (tokenFromUrl) {
  sessionStorage.setItem(SecurityConstants.SESSION_TOKEN_KEY, tokenFromUrl);
  urlParams.delete(SecurityConstants.QUERY_TOKEN_KEY);
  const newSearch = urlParams.toString();
  const queryPart = newSearch ? _.join([SecurityConstants.QUERY_MARK, newSearch], SecurityConstants.EMPTY_STRING) : SecurityConstants.EMPTY_STRING;
  const newPath = _.join([window.location.pathname, queryPart, window.location.hash], SecurityConstants.EMPTY_STRING);
  window.history.replaceState({}, document.title, newPath);
}
const originalFetch = window.fetch;
const usageJsonRoutes = [API_ROUTES.PIPELINE_VOICE, API_ROUTES.PIPELINE_GENERATE_IMAGE];
const usageTrackedRoutes = [...usageJsonRoutes, API_ROUTES.PIPELINE_GENERATE_BATCH_IMAGES, API_ROUTES.PIPELINE_FFMPEG_RENDER_STATUS];
const dispatchUsageUpdated = () => {
  window.dispatchEvent(new CustomEvent(SecurityConstants.USAGE_UPDATED_EVENT));
};
const handleLicenseFailureResponse = async (response: Response): Promise<void> => {
  if (!_.includes([SecurityConstants.HTTP_UNAUTHORIZED, SecurityConstants.HTTP_FORBIDDEN], response.status)) return;
  const data = await response
    .clone()
    .json()
    .catch(() => null);
  if (isLicenseFailureCode(_.get(data, SecurityConstants.CODE_KEY))) {
    invalidateBrowserLicenseSession();
  }
};
const notifyUsageAfterSuccessfulResponse = (input: RequestInfo | URL, response: Response) => {
  const rawUrl = input instanceof Request ? input.url : input.toString();
  const pathname = new URL(rawUrl, window.location.origin).pathname;
  const isTrackedRoute = _.some(usageTrackedRoutes, (route) => _.includes(pathname, route));
  if (!_.every([response.ok, isTrackedRoute], Boolean)) return;
  const responseCopy = response.clone();
  if (_.includes(usageJsonRoutes, pathname)) {
    void responseCopy
      .json()
      .then((data) => {
        if (_.get(data, SecurityConstants.SUCCESS_KEY)) dispatchUsageUpdated();
      })
      .catch(_.noop);
    return;
  }
  if (_.isEqual(pathname, API_ROUTES.PIPELINE_GENERATE_BATCH_IMAGES)) {
    void responseCopy
      .text()
      .then((body) => {
        if (_.includes(body, REFACTOR_CONSTANTS.USAGE_BATCH_SUCCESS_FRAGMENT)) dispatchUsageUpdated();
      })
      .catch(_.noop);
    return;
  }
  if (_.includes(pathname, API_ROUTES.PIPELINE_FFMPEG_RENDER_STATUS)) {
    void responseCopy
      .json()
      .then((data) => {
        if (_.isEqual(_.get(data, SecurityConstants.STATUS_KEY), REFACTOR_CONSTANTS.STATUS_COMPLETED)) dispatchUsageUpdated();
      })
      .catch(_.noop);
  }
};
import { storageUtils } from "./lib/storage";
window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const licenseKey = storageUtils.get(SecurityConstants.LOCAL_STORAGE_LICENSE_KEY) || SecurityConstants.DEFAULT_LICENSE_KEY;
  const internalToken = sessionStorage.getItem(SecurityConstants.SESSION_TOKEN_KEY);
  const requestInit = init || {};
  const headers = { ...(requestInit.headers || {}) } as Record<string, string>;
  if (licenseKey) _.set(headers, SecurityConstants.HEADER_LICENSE_KEY, licenseKey);
  if (internalToken) _.set(headers, SecurityConstants.HEADER_INTERNAL_TOKEN, internalToken);
  requestInit.headers = headers;
  const response = await originalFetch(input, requestInit);
  await handleLicenseFailureResponse(response);
  notifyUsageAfterSuccessfulResponse(input, response);
  return response;
};
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});
ReactDOM.createRoot(document.getElementById(SecurityConstants.HTML_ROOT_ID) as HTMLElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <LicenseProvider>
        <LicenseActivation>
          <App />
        </LicenseActivation>
      </LicenseProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);
