import { RUNTIME_TEXT as RT_SHARED } from "../../constants/runtime/shared.js";
import {
  SOURCE_TEMPLATE_W_API_PHP_ACTION_QUERY_FORMAT,
  SOURCE_TEMPLATE_W_INDEX_PHP_SEARCH_TITLE_SPECIAL,
  SOURCE_TEXT_AND,
  SOURCE_TEXT_ANH,
  SOURCE_TEXT_ARCHIVAL_SEARCH_QUERY_MISSING,
  SOURCE_TEXT_A_HREF_IMGURL_A_HREF_IMGRES,
  SOURCE_TEXT_A_IUSC,
  SOURCE_TEXT_BASE64,
  SOURCE_TEXT_BING_IMAGES,
  SOURCE_TEXT_CHIEN,
  SOURCE_TEXT_CHROME,
  SOURCE_TEXT_CONTENT_TYPE_2,
  SOURCE_TEXT_D,
  SOURCE_TEXT_DESC,
  SOURCE_TEXT_DINH,
  SOURCE_TEXT_DOMCONTENTLOADED,
  SOURCE_TEXT_DUNG_2,
  SOURCE_TEXT_EN_US,
  SOURCE_TEXT_FROM,
  SOURCE_TEXT_GIF,
  SOURCE_TEXT_GOOGLE_IMAGES,
  SOURCE_TEXT_HINH,
  SOURCE_TEXT_HISTORIC,
  SOURCE_TEXT_HISTORY,
  SOURCE_TEXT_IMAGE,
  SOURCE_TEXT_IMAGEINFO_0_DESCRIPTIONURL,
  SOURCE_TEXT_IMAGEINFO_0_URL,
  SOURCE_TEXT_IMAGE_2,
  SOURCE_TEXT_IMGREFURL,
  SOURCE_TEXT_IMGURL,
  SOURCE_TEXT_LICH,
  SOURCE_TEXT_LUOC,
  SOURCE_TEXT_M,
  SOURCE_TEXT_MANH,
  SOURCE_TEXT_MEDIAURL,
  SOURCE_TEXT_MOZILLA_5_0_WINDOWS_NT_10,
  SOURCE_TEXT_NAM,
  SOURCE_TEXT_NFD,
  SOURCE_TEXT_NGUOI,
  SOURCE_TEXT_NHA,
  SOURCE_TEXT_NO_SUITABLE_ARCHIVAL_IMAGE_FOUND,
  SOURCE_TEXT_PEXELS_LICENSE,
  SOURCE_TEXT_PHO,
  SOURCE_TEXT_PHOTO,
  SOURCE_TEXT_PIXABAY_CONTENT_LICENSE,
  SOURCE_TEXT_QUAN,
  SOURCE_TEXT_QUERY_PAGES,
  SOURCE_TEXT_QUYET,
  SOURCE_TEXT_REAL,
  SOURCE_TEXT_SVG,
  SOURCE_TEXT_SYMBOL_32,
  SOURCE_TEXT_SYMBOL_39,
  SOURCE_TEXT_THANG,
  SOURCE_TEXT_THANH,
  SOURCE_TEXT_THE,
  SOURCE_TEXT_THOI,
  SOURCE_TEXT_TRAN,
  SOURCE_TEXT_UNSPLASH_LICENSE,
  SOURCE_TEXT_URL,
  SOURCE_TEXT_VIDIFY_ARCHIVAL_MEDIA_RESOLVER_1_0,
  SOURCE_TEXT_VIET,
  SOURCE_TEXT_VIEW,
  SOURCE_TEXT_VUA,
  SOURCE_TEXT_WIKIMEDIA_COMMONS,
  SOURCE_TEXT_WIKIMEDIA_COMMONS_SOURCE_PAGE,
  SOURCE_TEXT_WITH,
  SOURCE_TEXT_XAY,
} from "../../constants/sourceText";
import _ from "lodash";
import { BrowserContext, Page, chromium } from "playwright";
import { EXTERNAL_URLS } from "../../constants/apiRoutes.js";
import { HTTP_URL_REGEX, VIETNAMESE_ACCENT_MARKS_REGEX, VIETNAMESE_D_LETTER_REGEX } from "../../constants/regexes.js";
export interface ArchivalImageResult {
  success: boolean;
  base64?: string;
  mimeType?: string;
  sourceUrl?: string;
  license?: string;
  provider?: "google_images" | "bing_images" | "wikimedia_commons";
  warning?: string;
}
interface SearchCandidate {
  mediaUrl: string;
  sourceUrl: string;
  title?: string;
}
const COMMONS_HOST = EXTERNAL_URLS.WIKIMEDIA_COMMONS;
const GOOGLE_IMAGE_SEARCH = EXTERNAL_URLS.GOOGLE_IMAGE_SEARCH;
const BING_IMAGE_SEARCH = EXTERNAL_URLS.BING_IMAGE_SEARCH;
const SUPPORTED_MEDIA_PATTERN = /\.(?:jpe?g|png|webp)(?:\?|$)/i;
const MINIMUM_IMAGE_BYTES = 20_000;
const DOWNLOAD_USER_AGENT = SOURCE_TEXT_MOZILLA_5_0_WINDOWS_NT_10;
const GENERIC_SEARCH_TERMS = /\b(?:historic(?:al)?|archive|archival|photograph|photo|image|exterior|interior|real|authentic|documentary|view)\b/gi;
const SEARCH_STOP_WORDS = new Set([
  SOURCE_TEXT_CHIEN,
  SOURCE_TEXT_THANG,
  SOURCE_TEXT_LICH,
  SOURCE_TEXT_HINH,
  SOURCE_TEXT_ANH,
  SOURCE_TEXT_THE,
  SOURCE_TEXT_AND,
  SOURCE_TEXT_WITH,
  SOURCE_TEXT_FROM,
  SOURCE_TEXT_PHOTO,
  SOURCE_TEXT_IMAGE,
  SOURCE_TEXT_HISTORY,
  SOURCE_TEXT_HISTORIC,
  SOURCE_TEXT_VIEW,
  SOURCE_TEXT_REAL,
  SOURCE_TEXT_TRAN,
  SOURCE_TEXT_QUAN,
  SOURCE_TEXT_MANH,
  SOURCE_TEXT_THOI,
  SOURCE_TEXT_THANH,
  SOURCE_TEXT_PHO,
  SOURCE_TEXT_XAY,
  SOURCE_TEXT_DUNG_2,
  SOURCE_TEXT_QUYET,
  SOURCE_TEXT_DINH,
  SOURCE_TEXT_CHIEN,
  SOURCE_TEXT_LUOC,
  SOURCE_TEXT_NHA,
  SOURCE_TEXT_VUA,
  SOURCE_TEXT_NGUOI,
  SOURCE_TEXT_VIET,
  SOURCE_TEXT_NAM,
] as string[]);
const MISLEADING_CONTEXT_PATTERN = /(?:\b(?:street|road|avenue|address|pharmacy|shop|hotel|restaurant)\b|\b(?:duong|pho|hieu thuoc|cua hang|khach san|nha hang)\b)/i;
const VERIFIED_STOCK_LICENSES: Array<{ host: RegExp; license: string }> = [
  { host: /(?:^|\.)pexels\.com$/i, license: SOURCE_TEXT_PEXELS_LICENSE },
  { host: /(?:^|\.)unsplash\.com$/i, license: SOURCE_TEXT_UNSPLASH_LICENSE },
  { host: /(?:^|\.)pixabay\.com$/i, license: SOURCE_TEXT_PIXABAY_CONTENT_LICENSE },
];
const resolveVerifiedWebLicense = (sourceUrl: string): string => {
  try {
    const host = new URL(sourceUrl).hostname;
    return _.find(VERIFIED_STOCK_LICENSES, (item) => item.host.test(host))?.license || "";
  } catch {
    return "";
  }
};
const normalizeSearchText = (value: string): string => _.toLower(value).normalize(SOURCE_TEXT_NFD).replace(VIETNAMESE_ACCENT_MARKS_REGEX, "").replace(VIETNAMESE_D_LETTER_REGEX, SOURCE_TEXT_D);
const relevanceTokens = (value: string): string[] => _.filter(normalizeSearchText(value).match(/[a-z0-9]+/g) || [], (token) => token.length >= 3 && !SEARCH_STOP_WORDS.has(token));
const relevanceScore = (candidate: SearchCandidate, query: string): number => {
  const evidenceTokens = new Set(relevanceTokens(`${candidate.title || ""}${RT_SHARED.SYMBOL_36A9E7}${candidate.sourceUrl}`));
  return _.uniq(_.filter(relevanceTokens(query), (token) => evidenceTokens.has(token))).length;
};
const createCommonsQueryVariants = (query: string): string[] => {
  const originalWords = _.filter(query.split(/\s+/), (word) => relevanceTokens(word).length > 0);
  const pairs = _.map(_.range(0, _.max([0, originalWords.length - 1]) || 0), (index) => `${originalWords[index]}${RT_SHARED.SYMBOL_36A9E7}${originalWords[index + 1]}`);
  return _.slice(_.uniq(_.compact([query, ...pairs])), 0, 5);
};
export const isArchivalSearchCandidateRelevant = (candidate: SearchCandidate, query: string): boolean => {
  const queryTokens = relevanceTokens(query);
  const evidenceTokens = new Set(relevanceTokens(`${candidate.title || ""}${RT_SHARED.SYMBOL_36A9E7}${candidate.sourceUrl}`));
  const overlaps = _.filter(queryTokens, (token) => evidenceTokens.has(token));
  if (_.isEmpty(queryTokens) || MISLEADING_CONTEXT_PATTERN.test(normalizeSearchText(`${candidate.title || ""}${RT_SHARED.SYMBOL_36A9E7}${candidate.sourceUrl}`))) return false;
  const uniqueOverlapCount = _.uniq(overlaps).length;
  const requiredOverlapCount = queryTokens.length >= 6 ? 3 : 2;
  return uniqueOverlapCount >= requiredOverlapCount && _.divide(uniqueOverlapCount, _.max([queryTokens.length, 1])!) >= 0.3;
};
const downloadCandidate = async (context: BrowserContext, candidate: SearchCandidate) => {
  if (!HTTP_URL_REGEX.test(candidate.mediaUrl)) return null;
  const response = await context.request.get(candidate.mediaUrl, { timeout: 30000, headers: { referer: candidate.sourceUrl || EXTERNAL_URLS.GOOGLE_HOME } }).catch(() => null);
  let body: Buffer | undefined;
  let mimeType = _.toLower(response?.headers()[SOURCE_TEXT_CONTENT_TYPE_2] || "").split(SOURCE_TEXT_SYMBOL_32)[0];
  if (response?.ok()) body = await response.body();
  if (!body) {
    const directResponse = await fetch(candidate.mediaUrl, { headers: { "user-agent": DOWNLOAD_USER_AGENT, referer: candidate.sourceUrl || EXTERNAL_URLS.GOOGLE_HOME } }).catch(() => null);
    if (directResponse?.ok) {
      mimeType = _.toLower(directResponse.headers.get(SOURCE_TEXT_CONTENT_TYPE_2) || "").split(SOURCE_TEXT_SYMBOL_32)[0];
      body = Buffer.from(await directResponse.arrayBuffer());
    }
  }
  if (!body || body.length < MINIMUM_IMAGE_BYTES || !mimeType.startsWith(SOURCE_TEXT_IMAGE_2) || mimeType.includes(SOURCE_TEXT_SVG) || mimeType.includes(SOURCE_TEXT_GIF)) return null;
  return { base64: body.toString(SOURCE_TEXT_BASE64), mimeType };
};
const extractGoogleCandidates = async (page: Page): Promise<SearchCandidate[]> => {
  const hrefs = await page.locator(SOURCE_TEXT_A_HREF_IMGURL_A_HREF_IMGRES).evaluateAll((anchors) => anchors.map((anchor) => (anchor as HTMLAnchorElement).href).filter(Boolean));
  return _.uniqBy(
    _.compact(
      _.map(hrefs, (href) => {
        try {
          const url = new URL(href);
          const mediaUrl = url.searchParams.get(SOURCE_TEXT_IMGURL) || "";
          const sourceUrl = url.searchParams.get(SOURCE_TEXT_IMGREFURL) || url.searchParams.get(SOURCE_TEXT_URL) || "";
          return mediaUrl && sourceUrl ? { mediaUrl, sourceUrl } : null;
        } catch {
          return null;
        }
      }),
    ),
    SOURCE_TEXT_MEDIAURL,
  );
};
const searchGoogleImages = async (context: BrowserContext, page: Page, query: string, excludedSources: Set<string>): Promise<ArchivalImageResult | null> => {
  await page.goto(`${GOOGLE_IMAGE_SEARCH}${encodeURIComponent(query)}`, { waitUntil: SOURCE_TEXT_DOMCONTENTLOADED, timeout: 30000 });
  await page.waitForTimeout(1800);
  const candidates = await extractGoogleCandidates(page);
  for (const candidate of _.take(
    _.filter(candidates, (item) => isArchivalSearchCandidateRelevant(item, query) && !excludedSources.has(item.sourceUrl)),
    12,
  )) {
    const license = resolveVerifiedWebLicense(candidate.sourceUrl);
    if (_.isEmpty(license)) continue;
    const downloaded = await downloadCandidate(context, candidate);
    if (!downloaded) continue;
    return { success: true, ...downloaded, sourceUrl: candidate.sourceUrl, license, provider: SOURCE_TEXT_GOOGLE_IMAGES };
  }
  return null;
};
const searchBingImages = async (context: BrowserContext, page: Page, query: string, excludedSources: Set<string>): Promise<ArchivalImageResult | null> => {
  await page.goto(`${BING_IMAGE_SEARCH}${encodeURIComponent(query)}`, { waitUntil: SOURCE_TEXT_DOMCONTENTLOADED, timeout: 30000 });
  await page.waitForTimeout(1200);
  const candidates = _.uniqBy(
    _.compact(
      await page.locator(SOURCE_TEXT_A_IUSC).evaluateAll(
        (anchors, browserPayload) => {
          const { SOURCE_TEXT_M, SOURCE_TEXT_SYMBOL_39 } = browserPayload.texts;
          return anchors.map((anchor) => {
            try {
              const metadata = JSON.parse(anchor.getAttribute(SOURCE_TEXT_M) || SOURCE_TEXT_SYMBOL_39);
              return metadata.murl && metadata.purl ? { mediaUrl: metadata.murl, sourceUrl: metadata.purl, title: metadata.t || metadata.desc || "" } : null;
            } catch {
              return null;
            }
          });
        },
        { payload: undefined, texts: { SOURCE_TEXT_M, SOURCE_TEXT_SYMBOL_39 } },
      ),
    ),
    SOURCE_TEXT_MEDIAURL,
  );
  for (const candidate of _.take(
    _.filter(candidates, (item) => isArchivalSearchCandidateRelevant(item, query) && !excludedSources.has(item.sourceUrl)),
    12,
  )) {
    const license = resolveVerifiedWebLicense(candidate.sourceUrl);
    if (_.isEmpty(license)) continue;
    const downloaded = await downloadCandidate(context, candidate);
    if (!downloaded) continue;
    return { success: true, ...downloaded, sourceUrl: candidate.sourceUrl, license, provider: SOURCE_TEXT_BING_IMAGES };
  }
  return null;
};
const searchWikimediaCommons = async (context: BrowserContext, page: Page, query: string, excludedSources: Set<string>): Promise<ArchivalImageResult | null> => {
  const reducedQuery = _.trim(query.replace(GENERIC_SEARCH_TERMS, RT_SHARED.SYMBOL_36A9E7).replace(/\s+/g, RT_SHARED.SYMBOL_36A9E7)) || query;
  await page.goto(SOURCE_TEMPLATE_W_INDEX_PHP_SEARCH_TITLE_SPECIAL(`${COMMONS_HOST}`, `${encodeURIComponent(reducedQuery)}`), { waitUntil: SOURCE_TEXT_DOMCONTENTLOADED, timeout: 30000 });
  for (const searchQuery of createCommonsQueryVariants(reducedQuery)) {
    const apiUrl = SOURCE_TEMPLATE_W_API_PHP_ACTION_QUERY_FORMAT(`${COMMONS_HOST}`, `${encodeURIComponent(searchQuery)}`);
    const apiResponse = await context.request.get(apiUrl, { timeout: 30000 }).catch(() => null);
    const directApiResponse = !apiResponse?.ok() ? await fetch(apiUrl, { headers: { "user-agent": SOURCE_TEXT_VIDIFY_ARCHIVAL_MEDIA_RESOLVER_1_0 } }).catch(() => null) : null;
    if (!apiResponse?.ok() && !directApiResponse?.ok) continue;
    const apiData = apiResponse?.ok() ? await apiResponse.json() : await directApiResponse!.json();
    const pages = _.orderBy(_.values(_.get(apiData, SOURCE_TEXT_QUERY_PAGES, {})) as any[], (item) => relevanceScore({ mediaUrl: _.toString(_.get(item, SOURCE_TEXT_IMAGEINFO_0_URL)), sourceUrl: _.toString(_.get(item, SOURCE_TEXT_IMAGEINFO_0_DESCRIPTIONURL)), title: _.toString(item.title) }, query), SOURCE_TEXT_DESC);
    for (const item of pages) {
      const info = _.first(item.imageinfo) as any;
      const mediaUrl = _.toString(info?.url);
      const mimeType = _.toLower(_.toString(info?.mime));
      const sourceUrl = _.toString(info?.descriptionurl);
      const candidate = { mediaUrl, sourceUrl, title: _.toString(item.title) };
      if (excludedSources.has(sourceUrl) || !isArchivalSearchCandidateRelevant(candidate, query) || !SUPPORTED_MEDIA_PATTERN.test(mediaUrl) || !mimeType.startsWith(SOURCE_TEXT_IMAGE_2) || mimeType.includes(SOURCE_TEXT_SVG)) continue;
      const downloaded = await downloadCandidate(context, candidate);
      if (!downloaded) continue;
      return { success: true, ...downloaded, sourceUrl, license: _.trim(_.toString(info?.extmetadata?.LicenseShortName?.value || info?.extmetadata?.UsageTerms?.value || SOURCE_TEXT_WIKIMEDIA_COMMONS_SOURCE_PAGE)), provider: SOURCE_TEXT_WIKIMEDIA_COMMONS };
    }
  }
  return null;
};
export const searchArchivalImageWithChrome = async (query: string, headless: boolean = true, sharedContext?: BrowserContext, excludeSourceUrls: string[] = []): Promise<ArchivalImageResult> => {
  const cleanQuery = _.trim(query);
  if (_.isEmpty(cleanQuery)) return { success: false, warning: SOURCE_TEXT_ARCHIVAL_SEARCH_QUERY_MISSING };
  const excludedSources = new Set(_.map(excludeSourceUrls, _.toString));
  const browser = sharedContext ? null : await chromium.launch({ headless, channel: SOURCE_TEXT_CHROME }).catch(() => chromium.launch({ headless }));
  let page: Page | null = null;
  try {
    const context = sharedContext || (await browser!.newContext({ locale: SOURCE_TEXT_EN_US, userAgent: DOWNLOAD_USER_AGENT }));
    page = await context.newPage();
    const googleResult = await searchGoogleImages(context, page, cleanQuery, excludedSources).catch(() => null);
    if (googleResult) return googleResult;
    const bingResult = await searchBingImages(context, page, cleanQuery, excludedSources).catch(() => null);
    if (bingResult) return bingResult;
    const commonsResult = await searchWikimediaCommons(context, page, cleanQuery, excludedSources).catch(() => null);
    return commonsResult || { success: false, warning: SOURCE_TEXT_NO_SUITABLE_ARCHIVAL_IMAGE_FOUND };
  } finally {
    await page?.close().catch(() => undefined);
    await browser?.close().catch(() => undefined);
  }
};
