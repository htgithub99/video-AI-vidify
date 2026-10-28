import { RUNTIME_TEXT as RT_SHARED } from "../../constants/runtime/shared.js";
import { SOURCE_BROWSER_TEXT_ARIA_BUSY, SOURCE_BROWSER_TEXT_CURRENTSRC, SOURCE_BROWSER_TEXT_DATA_TEST_ID, SOURCE_BROWSER_TEXT_SRC, SOURCE_TEXT_0_2, SOURCE_TEXT_1_REDACTED, SOURCE_TEXT_ARIA_LABEL, SOURCE_TEXT_HREF, SOURCE_TEXT_R, SOURCE_TEXT_ROLE, SOURCE_TEXT_UTF8 } from "../../constants/sourceText";
import fs from "fs";
import path from "path";
import _ from "lodash";
import { Page } from "playwright";
import { jsonUtils } from "../../lib/json.js";
import { logger } from "../../lib/logger.js";
import { getDataDirectory } from "../utils/paths.js";
import { getErrorMessage } from "../utils/errorUtils.js";
interface DomDiagnosticElement {
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
  maxFileBytes?: number;
  retainedFileBytes?: number;
  detailedStatePattern?: RegExp;
  minimalMaxElements?: number;
}
const rotateDiagnosticFile = (filePath: string, maxFileBytes: number, retainedFileBytes: number): void => {
  if (!fs.existsSync(filePath) || fs.statSync(filePath).size < maxFileBytes) return;
  const fileSize = fs.statSync(filePath).size;
  const bytesToKeep = Math.min(retainedFileBytes, fileSize);
  const descriptor = fs.openSync(filePath, SOURCE_TEXT_R);
  try {
    const buffer = Buffer.alloc(bytesToKeep);
    fs.readSync(descriptor, buffer, 0, bytesToKeep, fileSize - bytesToKeep);
    const firstLineBreak = buffer.indexOf(10);
    fs.writeFileSync(filePath, firstLineBreak >= 0 ? buffer.subarray(firstLineBreak + 1) : buffer);
  } finally {
    fs.closeSync(descriptor);
  }
};
const sanitizeOuterHtml = (html: string, maxLength: number): string => _.truncate(_.replace(html, /(value|data-value)=("[^"]*"|'[^']*')/gi, SOURCE_TEXT_1_REDACTED), { length: maxLength, omission: "" });
export const captureDomDiagnostics = async (page: Page, state: string, options: DomDiagnosticCaptureOptions): Promise<void> => {
  try {
    const detailedCapture = options.detailedStatePattern?.test(state) ?? true;
    const effectiveMaxElements = detailedCapture ? options.maxElements : Math.min(options.minimalMaxElements || options.maxElements, options.maxElements);
    const elements = await page.evaluate(
      (browserPayload) => {
        const { SOURCE_BROWSER_TEXT_CURRENTSRC, SOURCE_BROWSER_TEXT_ARIA_BUSY, SOURCE_TEXT_ARIA_LABEL, SOURCE_TEXT_ROLE, SOURCE_BROWSER_TEXT_DATA_TEST_ID, SOURCE_BROWSER_TEXT_SRC, SOURCE_TEXT_HREF } = browserPayload.texts;
        const { selector, prioritySelector, limits } = browserPayload.payload;
        const priorityElements = prioritySelector ? Array.from(document.querySelectorAll(prioritySelector)) : [];
        const fallbackElements = Array.from(document.querySelectorAll(selector)).slice(-limits.maxElements);
        return Array.from(new Set([...priorityElements, ...fallbackElements]))
          .slice(0, limits.maxElements)
          .map((element) => {
            const htmlElement = element as HTMLElement;
            const mediaElement = element as HTMLImageElement | HTMLVideoElement | HTMLSourceElement;
            const currentSrc = SOURCE_BROWSER_TEXT_CURRENTSRC in mediaElement ? mediaElement.currentSrc : "";
            return {
              tag: element.tagName.toLowerCase(),
              id: String(htmlElement.id),
              className: String(htmlElement.className).slice(0, limits.maxClassNameLength),
              ariaBusy: element.getAttribute(SOURCE_BROWSER_TEXT_ARIA_BUSY) ? String(element.getAttribute(SOURCE_BROWSER_TEXT_ARIA_BUSY)) : "",
              ariaLabel: element.getAttribute(SOURCE_TEXT_ARIA_LABEL) ? String(element.getAttribute(SOURCE_TEXT_ARIA_LABEL)) : "",
              role: element.getAttribute(SOURCE_TEXT_ROLE) ? String(element.getAttribute(SOURCE_TEXT_ROLE)) : "",
              dataTestId: element.getAttribute(SOURCE_BROWSER_TEXT_DATA_TEST_ID) ? String(element.getAttribute(SOURCE_BROWSER_TEXT_DATA_TEST_ID)) : "",
              src: currentSrc ? currentSrc : mediaElement.src ? mediaElement.src : element.getAttribute(SOURCE_BROWSER_TEXT_SRC) ? String(element.getAttribute(SOURCE_BROWSER_TEXT_SRC)) : "",
              href: element.getAttribute(SOURCE_TEXT_HREF) ? String(element.getAttribute(SOURCE_TEXT_HREF)) : "",
              text: String(htmlElement.innerText ? htmlElement.innerText : htmlElement.textContent)
                .trim()
                .slice(0, limits.maxTextLength),
              html: String(htmlElement.outerHTML).slice(0, limits.maxHtmlLength),
            };
          });
      },
      {
        payload: { selector: options.selector, prioritySelector: options.prioritySelector, limits: { maxElements: effectiveMaxElements, maxClassNameLength: options.maxClassNameLength, maxTextLength: options.maxTextLength, maxHtmlLength: options.maxHtmlLength } },
        texts: { SOURCE_BROWSER_TEXT_CURRENTSRC, SOURCE_BROWSER_TEXT_ARIA_BUSY, SOURCE_TEXT_ARIA_LABEL, SOURCE_TEXT_ROLE, SOURCE_BROWSER_TEXT_DATA_TEST_ID, SOURCE_BROWSER_TEXT_SRC, SOURCE_TEXT_HREF },
      },
    );
    const sanitizedElements: DomDiagnosticElement[] = _.map(elements, (element) => ({ ...element, html: sanitizeOuterHtml(element.html, options.maxHtmlLength) }));
    const diagnosticPath = path.join(getDataDirectory(), options.fileName);
    rotateDiagnosticFile(diagnosticPath, options.maxFileBytes || Number.MAX_SAFE_INTEGER, options.retainedFileBytes || 0);
    fs.appendFileSync(diagnosticPath, `${jsonUtils.safeStringify({ capturedAt: new Date().toISOString(), state, url: page.url(), elements: sanitizedElements })}${RT_SHARED.SYMBOL_01BA47}`, SOURCE_TEXT_UTF8);
  } catch (error: unknown) {
    logger.error(options.errorMessageTemplate.replace(SOURCE_TEXT_0_2, state), getErrorMessage(error));
  }
};
