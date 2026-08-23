import _ from "lodash";
import { BrowserContext, Page, chromium } from "playwright";

export interface ArchivalImageResult {
  success: boolean;
  base64?: string;
  mimeType?: string;
  sourceUrl?: string;
  license?: string;
  provider?: "google_images" | "wikimedia_commons";
  warning?: string;
}

interface SearchCandidate { mediaUrl: string; sourceUrl: string }

const COMMONS_HOST = "https://commons.wikimedia.org";
const GOOGLE_IMAGE_SEARCH = "https://www.google.com/search?tbm=isch&safe=active&hl=en&q=";
const SUPPORTED_MEDIA_PATTERN = /\.(?:jpe?g|png|webp)(?:\?|$)/i;
const MINIMUM_IMAGE_BYTES = 20_000;
const DOWNLOAD_USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/128 Safari/537.36";
const GENERIC_SEARCH_TERMS = /\b(?:historic(?:al)?|archive|archival|photograph|photo|image|exterior|interior|real|authentic|documentary|view)\b/gi;

const downloadCandidate = async (context: BrowserContext, candidate: SearchCandidate) => {
  if (!/^https?:\/\//i.test(candidate.mediaUrl)) return null;
  const response = await context.request.get(candidate.mediaUrl, { timeout: 30000, headers: { referer: candidate.sourceUrl || "https://www.google.com/" } }).catch(() => null);
  let body: Buffer | undefined;
  let mimeType = _.toLower(response?.headers()["content-type"] || "").split(";")[0];
  if (response?.ok()) body = await response.body();
  if (!body) {
    const directResponse = await fetch(candidate.mediaUrl, { headers: { "user-agent": DOWNLOAD_USER_AGENT, referer: candidate.sourceUrl || "https://www.google.com/" } }).catch(() => null);
    if (directResponse?.ok) {
      mimeType = _.toLower(directResponse.headers.get("content-type") || "").split(";")[0];
      body = Buffer.from(await directResponse.arrayBuffer());
    }
  }
  if (!body || body.length < MINIMUM_IMAGE_BYTES || !mimeType.startsWith("image/") || mimeType.includes("svg") || mimeType.includes("gif")) return null;
  return { base64: body.toString("base64"), mimeType };
};

const extractGoogleCandidates = async (page: Page): Promise<SearchCandidate[]> => {
  const hrefs = await page.locator('a[href*="imgurl="], a[href*="/imgres?"]').evaluateAll(anchors => anchors.map(anchor => (anchor as HTMLAnchorElement).href).filter(Boolean));
  return _.uniqBy(_.compact(_.map(hrefs, href => {
    try {
      const url = new URL(href);
      const mediaUrl = url.searchParams.get("imgurl") || "";
      const sourceUrl = url.searchParams.get("imgrefurl") || url.searchParams.get("url") || "";
      return mediaUrl && sourceUrl ? { mediaUrl, sourceUrl } : null;
    } catch { return null; }
  })), "mediaUrl");
};

const searchGoogleImages = async (context: BrowserContext, page: Page, query: string): Promise<ArchivalImageResult | null> => {
  await page.goto(`${GOOGLE_IMAGE_SEARCH}${encodeURIComponent(query)}`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(1800);
  const candidates = await extractGoogleCandidates(page);
  for (const candidate of _.take(candidates, 12)) {
    const downloaded = await downloadCandidate(context, candidate);
    if (!downloaded) continue;
    return { success: true, ...downloaded, sourceUrl: candidate.sourceUrl, license: "License not verified; review the original source page before publication", provider: "google_images" };
  }
  return null;
};

const searchWikimediaCommons = async (context: BrowserContext, page: Page, query: string): Promise<ArchivalImageResult | null> => {
  const reducedQuery = _.trim(query.replace(GENERIC_SEARCH_TERMS, " ").replace(/\s+/g, " ")) || query;
  await page.goto(`${COMMONS_HOST}/w/index.php?search=${encodeURIComponent(reducedQuery)}&title=Special:MediaSearch&type=image`, { waitUntil: "domcontentloaded", timeout: 30000 });
  const apiUrl = `${COMMONS_HOST}/w/api.php?action=query&format=json&origin=*&generator=search&gsrnamespace=6&gsrlimit=12&gsrsearch=${encodeURIComponent(reducedQuery)}&prop=imageinfo&iiprop=url%7Cmime%7Cextmetadata`;
  const apiResponse = await context.request.get(apiUrl, { timeout: 30000 }).catch(() => null);
  const directApiResponse = !apiResponse?.ok() ? await fetch(apiUrl, { headers: { "user-agent": "Vidify archival media resolver/1.0" } }).catch(() => null) : null;
  if (!apiResponse?.ok() && !directApiResponse?.ok) return null;
  const apiData = apiResponse?.ok() ? await apiResponse.json() : await directApiResponse!.json();
  const pages = _.values(_.get(apiData, "query.pages", {})) as any[];
  for (const item of pages) {
    const info = _.first(item.imageinfo) as any;
    const mediaUrl = _.toString(info?.url);
    const mimeType = _.toLower(_.toString(info?.mime));
    if (!SUPPORTED_MEDIA_PATTERN.test(mediaUrl) || !mimeType.startsWith("image/") || mimeType.includes("svg")) continue;
    const sourceUrl = _.toString(info?.descriptionurl);
    const downloaded = await downloadCandidate(context, { mediaUrl, sourceUrl });
    if (!downloaded) continue;
    return { success: true, ...downloaded, sourceUrl, license: _.trim(_.toString(info?.extmetadata?.LicenseShortName?.value || info?.extmetadata?.UsageTerms?.value || "Wikimedia Commons source page")), provider: "wikimedia_commons" };
  }
  return null;
};

export const searchArchivalImageWithChrome = async (query: string, headless: boolean = true): Promise<ArchivalImageResult> => {
  const cleanQuery = _.trim(query);
  if (_.isEmpty(cleanQuery)) return { success: false, warning: "archival_search_query_missing" };
  const browser = await chromium.launch({ headless, channel: "chrome" }).catch(() => chromium.launch({ headless }));
  try {
    const context = await browser.newContext({ locale: "en-US", userAgent: DOWNLOAD_USER_AGENT });
    const page = await context.newPage();
    const googleResult = await searchGoogleImages(context, page, cleanQuery).catch(() => null);
    if (googleResult) return googleResult;
    const commonsResult = await searchWikimediaCommons(context, page, cleanQuery).catch(() => null);
    return commonsResult || { success: false, warning: "no_suitable_archival_image_found" };
  } finally {
    await browser.close().catch(() => undefined);
  }
};
