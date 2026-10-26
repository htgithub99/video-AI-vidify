import type { Page, Request, Response } from "playwright";
import { CHAT_PLANNING_RUNTIME as C } from "../../constants/chatPlanningRuntime.js";
import { SOURCE_TEXT_REQUEST, SOURCE_TEXT_RESPONSE } from "../../constants/sourceText.js";
export const observeChatUploads = (page: Page, matches: (request: Request) => boolean) => {
  const pending = new Set<Request>();
  let failed = false;
  let lastFailure: { url: string; status?: number; errorText?: string } | undefined;
  const started = (request: Request) => {
    if (matches(request)) pending.add(request);
  };
  const finished = (request: Request) => {
    pending.delete(request);
  };
  const rejected = (request: Request) => {
    if (pending.delete(request)) {
      failed = true;
      const url = new URL(request.url());
      lastFailure = { url: url.origin + url.pathname, errorText: request.failure()?.errorText };
    }
  };
  const responded = (response: Response) => {
    if (pending.has(response.request()) && response.status() >= 400) {
      failed = true;
      const url = new URL(response.url());
      lastFailure = { url: url.origin + url.pathname, status: response.status() };
    }
  };
  page.on(SOURCE_TEXT_REQUEST, started);
  page.on(C.REQUEST_FINISHED, finished);
  page.on(C.REQUEST_FAILED, rejected);
  page.on(SOURCE_TEXT_RESPONSE, responded);
  return {
    state: () => ({ pending: pending.size, failed, lastFailure }),
    dispose: () => {
      page.off(SOURCE_TEXT_REQUEST, started);
      page.off(C.REQUEST_FINISHED, finished);
      page.off(C.REQUEST_FAILED, rejected);
      page.off(SOURCE_TEXT_RESPONSE, responded);
    },
  };
};
