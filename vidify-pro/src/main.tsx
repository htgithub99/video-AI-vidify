import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { LicenseProvider } from "./contexts/LicenseContext.tsx";
import { LicenseActivation } from "./components/LicenseActivation.tsx";
import { SecurityConstants } from "./constants/security";
import _ from "lodash";

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
window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const licenseKey = localStorage.getItem(SecurityConstants.LOCAL_STORAGE_LICENSE_KEY);
  const internalToken = sessionStorage.getItem(SecurityConstants.SESSION_TOKEN_KEY);
  
  const requestInit = init || {};
  const headers = { ...(requestInit.headers || {}) } as Record<string, string>;

  if (licenseKey) {
    _.set(headers, SecurityConstants.HEADER_LICENSE_KEY, licenseKey);
  }
  if (internalToken) {
    _.set(headers, SecurityConstants.HEADER_INTERNAL_TOKEN, internalToken);
  }

  requestInit.headers = headers;
  return originalFetch(input, requestInit);
};

ReactDOM.createRoot(document.getElementById(SecurityConstants.HTML_ROOT_ID) as HTMLElement).render(
  <React.StrictMode>
    <LicenseProvider>
      <LicenseActivation>
        <App />
      </LicenseActivation>
    </LicenseProvider>
  </React.StrictMode>,
);
