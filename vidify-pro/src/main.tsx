import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { LicenseProvider } from "./contexts/LicenseContext.tsx";
import { LicenseActivation } from "./components/LicenseActivation.tsx";

// Ghi đè fetch toàn cục để luôn gửi x-license-key
const originalFetch = window.fetch;
window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const licenseKey = localStorage.getItem('vidify_license_key');
  if (licenseKey) {
    init = init || {};
    init.headers = {
      ...init.headers,
      'x-license-key': licenseKey
    };
  }
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
