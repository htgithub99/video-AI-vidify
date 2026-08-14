import fs from "fs";
import path from "path";
import _ from "lodash";
import { Page } from "playwright";
import { jsonUtils } from "../../lib/json.js";
import { logger } from "../../lib/logger.js";
import { getDataDirectory } from "../utils/paths.js";
import { getErrorMessage } from "../utils/errorUtils.js";

export interface DomDiagnosticElement {
  tag: string;
  id: string;
  className: string;
  ariaBusy: string;
  ariaLabel: string;
  role: string;
  dataTestId: string;
  src: string;
  href: string;
  text: string;
  html: string;
}

export interface DomDiagnosticCaptureOptions {
  fileName: string;
  selector: string;
  maxElements: number;
  maxClassNameLength: number;
  maxTextLength: number;
  maxHtmlLength: number;
  prioritySelector?: string;
  errorMessageTemplate: string;
}

const sanitizeOuterHtml = (html: string, maxLength: number): string => (
  _.truncate(
    _.replace(html, /(value|data-value)=("[^"]*"|'[^']*')/gi, '$1="[redacted]"'),
    { length: maxLength, omission: "" },
  )
);

export const captureDomDiagnostics = async (
  page: Page,
  state: string,
  options: DomDiagnosticCaptureOptions,
): Promise<void> => {
  try {
    const elements = await page.evaluate(({ selector, prioritySelector, limits }) => {
      const priorityElements = prioritySelector
        ? Array.from(document.querySelectorAll(prioritySelector))
        : [];
      const fallbackElements = Array.from(document.querySelectorAll(selector)).slice(-limits.maxElements);
      return Array.from(new Set([...priorityElements, ...fallbackElements]))
        .slice(0, limits.maxElements)
        .map((element) => {
          const htmlElement = element as HTMLElement;
          const mediaElement = element as HTMLImageElement | HTMLVideoElement | HTMLSourceElement;
          const currentSrc = "currentSrc" in mediaElement ? mediaElement.currentSrc : "";
          return {
            tag: element.tagName.toLowerCase(),
            id: String(htmlElement.id),
            className: String(htmlElement.className).slice(0, limits.maxClassNameLength),
            ariaBusy: element.getAttribute("aria-busy") ? String(element.getAttribute("aria-busy")) : "",
            ariaLabel: element.getAttribute("aria-label") ? String(element.getAttribute("aria-label")) : "",
            role: element.getAttribute("role") ? String(element.getAttribute("role")) : "",
            dataTestId: element.getAttribute("data-test-id") ? String(element.getAttribute("data-test-id")) : "",
            src: currentSrc ? currentSrc : mediaElement.src ? mediaElement.src : element.getAttribute("src") ? String(element.getAttribute("src")) : "",
            href: element.getAttribute("href") ? String(element.getAttribute("href")) : "",
            text: String(htmlElement.innerText ? htmlElement.innerText : htmlElement.textContent).trim().slice(0, limits.maxTextLength),
            html: String(htmlElement.outerHTML).slice(0, limits.maxHtmlLength),
          };
        });
    }, {
      selector: options.selector,
      prioritySelector: options.prioritySelector,
      limits: {
        maxElements: options.maxElements,
        maxClassNameLength: options.maxClassNameLength,
        maxTextLength: options.maxTextLength,
        maxHtmlLength: options.maxHtmlLength,
      },
    });

    const sanitizedElements: DomDiagnosticElement[] = _.map(elements, (element) => ({
      ...element,
      html: sanitizeOuterHtml(element.html, options.maxHtmlLength),
    }));
    fs.appendFileSync(
      path.join(getDataDirectory(), options.fileName),
      `${jsonUtils.safeStringify({ capturedAt: new Date().toISOString(), state, url: page.url(), elements: sanitizedElements })}\n`,
      "utf8",
    );
  } catch (error: unknown) {
    logger.error(options.errorMessageTemplate.replace("{0}", state), getErrorMessage(error));
  }
};
