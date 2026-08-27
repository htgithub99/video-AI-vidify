import { AsyncLocalStorage } from "async_hooks";

export interface RequestKeys { geminiKey?: string; cerebrasKey?: string; groqKey?: string; ai33Key?: string; planType?: string; licenseKey?: string; }

export const requestContext = new AsyncLocalStorage<RequestKeys>();
