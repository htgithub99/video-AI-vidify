import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { LicenseProvider } from "./contexts/LicenseContext.tsx";
import { LicenseActivation } from "./components/LicenseActivation.tsx";

// Đọc và lưu trữ Security Token từ URL, sau đó làm sạch thanh địa chỉ
const urlParams = new URLSearchParams(window.location.search);
const tokenFromUrl = urlParams.get("token");
if (tokenFromUrl) {
  sessionStorage.setItem("internal_token", tokenFromUrl);
  urlParams.delete("token");
  const newSearch = urlParams.toString();
  const newPath = window.location.pathname + (newSearch ? `?${newSearch}` : "") + window.location.hash;
  window.history.replaceState({}, document.title, newPath);
}

// Ghi đè fetch toàn cục để luôn gửi x-license-key và x-internal-token
const originalFetch = window.fetch;
window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const licenseKey = localStorage.getItem('vidify_license_key');
  const internalToken = sessionStorage.getItem('internal_token');
  
  init = init || {};
  const headers = { ...(init.headers || {}) } as Record<string, string>;

  if (licenseKey) {
    headers['x-license-key'] = licenseKey;
  }
  if (internalToken) {
    headers['x-internal-token'] = internalToken;
  }

  init.headers = headers;
  return originalFetch(input, init);
};

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <LicenseProvider>
      <LicenseActivation>
        <App />
      </LicenseActivation>
    </LicenseProvider>
  </React.StrictMode>,
);
