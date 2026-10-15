import type { Page, Request, Response } from "playwright";
import { CHAT_PLANNING_RUNTIME as C } from "../../constants/chatPlanningRuntime.js";
import { SOURCE_TEXT_REQUEST, SOURCE_TEXT_RESPONSE } from "../../constants/sourceText.js";
export const observeChatUploads = (page: Page, matches: (request: Request) => boolean) => {
  const pending = new Set<Request>();
  let failed = false;
  const started = (request: Request) => {
    if (matches(request)) pending.add(request);
  };
  const finished = (request: Request) => {
    pending.delete(request);
  };
  const rejected = (request: Request) => {
    if (pending.delete(request)) failed = true;
  };
  const responded = (response: Response) => {
    if (pending.has(response.request()) && !response.ok()) failed = true;
  };
  page.on(SOURCE_TEXT_REQUEST, started);
  page.on(C.REQUEST_FINISHED, finished);
  page.on(C.REQUEST_FAILED, rejected);
  page.on(SOURCE_TEXT_RESPONSE, responded);
  return {
    state: () => ({ pending: pending.size, failed }),
    dispose: () => {
      page.off(SOURCE_TEXT_REQUEST, started);
      page.off(C.REQUEST_FINISHED, finished);
      page.off(C.REQUEST_FAILED, rejected);
      page.off(SOURCE_TEXT_RESPONSE, responded);
    },
  };
};
