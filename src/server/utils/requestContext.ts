import { AsyncLocalStorage } from "async_hooks";

export interface RequestKeys {
  geminiKey?: string;
  ai33Key?: string;
}

export const requestContext = new AsyncLocalStorage<RequestKeys>();
