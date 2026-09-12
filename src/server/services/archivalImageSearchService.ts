import _ from "lodash";
import { BrowserContext, Page, chromium } from "playwright";
import { VIETNAMESE_ACCENT_MARKS_REGEX, VIETNAMESE_D_LETTER_REGEX } from "../../constants/regexes.js";

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

const COMMONS_HOST = "https://commons.wikimedia.org";
const GOOGLE_IMAGE_SEARCH = "https://www.google.com/search?tbm=isch&safe=active&hl=en&q=";
const BING_IMAGE_SEARCH = "https://www.bing.com/images/search?safeSearch=Strict&q=";
const SUPPORTED_MEDIA_PATTERN = /\.(?:jpe?g|png|webp)(?:\?|$)/i;
const MINIMUM_IMAGE_BYTES = 20_000;
const DOWNLOAD_USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/128 Safari/537.36";
const GENERIC_SEARCH_TERMS = /\b(?:historic(?:al)?|archive|archival|photograph|photo|image|exterior|interior|real|authentic|documentary|view)\b/gi;
const SEARCH_STOP_WORDS = new Set([
  "chien",
  "thang",
  "lich",
  "hinh",
  "anh",
  "the",
  "and",
  "with",
  "from",
  "photo",
  "image",
  "history",
  "historic",
  "view",
  "real",
  "tran",
  "quan",
  "manh",
  "thoi",
  "thanh",
  "pho",
  "xay",
  "dung",
  "quyet",
  "dinh",
  "chien",
  "luoc",
  "nha",
  "vua",
  "nguoi",
  "viet",
  "nam",
]);
const MISLEADING_CONTEXT_PATTERN = /(?:\b(?:street|road|avenue|address|pharmacy|shop|hotel|restaurant)\b|\b(?:duong|pho|hieu thuoc|cua hang|khach san|nha hang)\b)/i;
const VERIFIED_STOCK_LICENSES: Array<{ host: RegExp; license: string }> = [
  { host: /(?:^|\.)pexels\.com$/i, license: "Pexels License" },
  { host: /(?:^|\.)unsplash\.com$/i, license: "Unsplash License" },
  { host: /(?:^|\.)pixabay\.com$/i, license: "Pixabay Content License" },
];

const resolveVerifiedWebLicense = (sourceUrl: string): string => {
  try {
    const host = new URL(sourceUrl).hostname;
    return _.find(VERIFIED_STOCK_LICENSES, (item) => item.host.test(host))?.license || "";
  } catch {
    return "";
  }
};

const normalizeSearchText = (value: string): string =>
  _.toLower(value)
    .normalize("NFD")
    .replace(VIETNAMESE_ACCENT_MARKS_REGEX, "")
    .replace(VIETNAMESE_D_LETTER_REGEX, "d");

const relevanceTokens = (value: string): string[] => _.filter(normalizeSearchText(value).match(/[a-z0-9]+/g) || [], (token) => token.length >= 3 && !SEARCH_STOP_WORDS.has(token));

const relevanceScore = (candidate: SearchCandidate, query: string): number => {
  const evidenceTokens = new Set(relevanceTokens(`${candidate.title || ""} ${candidate.sourceUrl}`));
  return _.uniq(_.filter(relevanceTokens(query), (token) => evidenceTokens.has(token))).length;
};

const createCommonsQueryVariants = (query: string): string[] => {
  const originalWords = _.filter(query.split(/\s+/), (word) => relevanceTokens(word).length > 0);
  const pairs = _.map(_.range(0, _.max([0, originalWords.length - 1]) || 0), (index) => `${originalWords[index]} ${originalWords[index + 1]}`);
  return _.uniq(_.compact([query, ...pairs])).slice(0, 5);
};

export const isArchivalSearchCandidateRelevant = (candidate: SearchCandidate, query: string): boolean => {
  const queryTokens = relevanceTokens(query);
  const evidenceTokens = new Set(relevanceTokens(`${candidate.title || ""} ${candidate.sourceUrl}`));
  const overlaps = _.filter(queryTokens, (token) => evidenceTokens.has(token));
  if (_.isEmpty(queryTokens) || MISLEADING_CONTEXT_PATTERN.test(normalizeSearchText(`${candidate.title || ""} ${candidate.sourceUrl}`))) return false;
  const uniqueOverlapCount = _.uniq(overlaps).length;
  const requiredOverlapCount = queryTokens.length >= 6 ? 3 : 2;
  return uniqueOverlapCount >= requiredOverlapCount && _.divide(uniqueOverlapCount, _.max([queryTokens.length, 1])!) >= 0.3;
};

const downloadCandidate = async (context: BrowserContext, candidate: SearchCandidate) => {
  if (!/^https?:\/\//i.test(candidate.mediaUrl)) return null;
  const response = await context.request.get(candidate.mediaUrl, { timeout: 30000, headers: { referer: candidate.sourceUrl || "https://www.google.com/" } }).catch(() => null);
  let body: Buffer | undefined;
  let mimeType = _.toLower(response?.headers()["content-type"] || "").split(";")[0];
  if (response?.ok()) body = await response.body();
  if (!body) {
    const directResponse = await fetch(candidate.mediaUrl, { headers: { "user-agent": DOWNLOAD_USER_AGENT, referer: candidate.sourceUrl || "https://www.google.com/" } }).catch(
      () => null,
    );
    if (directResponse?.ok) {
      mimeType = _.toLower(directResponse.headers.get("content-type") || "").split(";")[0];
      body = Buffer.from(await directResponse.arrayBuffer());
    }
  }
  if (!body || body.length < MINIMUM_IMAGE_BYTES || !mimeType.startsWith("image/") || mimeType.includes("svg") || mimeType.includes("gif")) return null;
  return { base64: body.toString("base64"), mimeType };
};

const extractGoogleCandidates = async (page: Page): Promise<SearchCandidate[]> => {
  const hrefs = await page.locator('a[href*="imgurl="], a[href*="/imgres?"]').evaluateAll((anchors) => anchors.map((anchor) => (anchor as HTMLAnchorElement).href).filter(Boolean));
  return _.uniqBy(
    _.compact(
      _.map(hrefs, (href) => {
        try {
          const url = new URL(href);
          const mediaUrl = url.searchParams.get("imgurl") || "";
          const sourceUrl = url.searchParams.get("imgrefurl") || url.searchParams.get("url") || "";
          return mediaUrl && sourceUrl ? { mediaUrl, sourceUrl } : null;
        } catch {
          return null;
        }
      }),
    ),
    "mediaUrl",
  );
};

const searchGoogleImages = async (context: BrowserContext, page: Page, query: string, excludedSources: Set<string>): Promise<ArchivalImageResult | null> => {
  await page.goto(`${GOOGLE_IMAGE_SEARCH}${encodeURIComponent(query)}`, { waitUntil: "domcontentloaded", timeout: 30000 });
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
    return { success: true, ...downloaded, sourceUrl: candidate.sourceUrl, license, provider: "google_images" };
  }
  return null;
};

const searchBingImages = async (context: BrowserContext, page: Page, query: string, excludedSources: Set<string>): Promise<ArchivalImageResult | null> => {
  await page.goto(`${BING_IMAGE_SEARCH}${encodeURIComponent(query)}`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(1200);
  const candidates = _.uniqBy(
    _.compact(
      await page.locator("a.iusc").evaluateAll((anchors) =>
        anchors.map((anchor) => {
          try {
            const metadata = JSON.parse(anchor.getAttribute("m") || "{}");
            return metadata.murl && metadata.purl ? { mediaUrl: metadata.murl, sourceUrl: metadata.purl, title: metadata.t || metadata.desc || "" } : null;
          } catch {
            return null;
          }
        }),
      ),
    ),
    "mediaUrl",
  );
  for (const candidate of _.take(
    _.filter(candidates, (item) => isArchivalSearchCandidateRelevant(item, query) && !excludedSources.has(item.sourceUrl)),
    12,
  )) {
    const license = resolveVerifiedWebLicense(candidate.sourceUrl);
    if (_.isEmpty(license)) continue;
    const downloaded = await downloadCandidate(context, candidate);
    if (!downloaded) continue;
    return { success: true, ...downloaded, sourceUrl: candidate.sourceUrl, license, provider: "bing_images" };
  }
  return null;
};

const searchWikimediaCommons = async (context: BrowserContext, page: Page, query: string, excludedSources: Set<string>): Promise<ArchivalImageResult | null> => {
  const reducedQuery = _.trim(query.replace(GENERIC_SEARCH_TERMS, " ").replace(/\s+/g, " ")) || query;
  await page.goto(`${COMMONS_HOST}/w/index.php?search=${encodeURIComponent(reducedQuery)}&title=Special:MediaSearch&type=image`, { waitUntil: "domcontentloaded", timeout: 30000 });
  for (const searchQuery of createCommonsQueryVariants(reducedQuery)) {
    const apiUrl = `${COMMONS_HOST}/w/api.php?action=query&format=json&origin=*&generator=search&gsrnamespace=6&gsrlimit=12&gsrsearch=${encodeURIComponent(searchQuery)}&prop=imageinfo&iiprop=url%7Cmime%7Cextmetadata`;
    const apiResponse = await context.request.get(apiUrl, { timeout: 30000 }).catch(() => null);
    const directApiResponse = !apiResponse?.ok() ? await fetch(apiUrl, { headers: { "user-agent": "Vidify archival media resolver/1.0" } }).catch(() => null) : null;
    if (!apiResponse?.ok() && !directApiResponse?.ok) continue;
    const apiData = apiResponse?.ok() ? await apiResponse.json() : await directApiResponse!.json();
    const pages = _.orderBy(
      _.values(_.get(apiData, "query.pages", {})) as any[],
      (item) =>
        relevanceScore(
          {
            mediaUrl: _.toString(_.get(item, "imageinfo[0].url")),
            sourceUrl: _.toString(_.get(item, "imageinfo[0].descriptionurl")),
            title: _.toString(item.title),
          },
          query,
        ),
      "desc",
    );
    for (const item of pages) {
      const info = _.first(item.imageinfo) as any;
      const mediaUrl = _.toString(info?.url);
      const mimeType = _.toLower(_.toString(info?.mime));
      const sourceUrl = _.toString(info?.descriptionurl);
      const candidate = { mediaUrl, sourceUrl, title: _.toString(item.title) };
      if (
        excludedSources.has(sourceUrl) ||
        !isArchivalSearchCandidateRelevant(candidate, query) ||
        !SUPPORTED_MEDIA_PATTERN.test(mediaUrl) ||
        !mimeType.startsWith("image/") ||
        mimeType.includes("svg")
      )
        continue;
      const downloaded = await downloadCandidate(context, candidate);
      if (!downloaded) continue;
      return {
        success: true,
        ...downloaded,
        sourceUrl,
        license: _.trim(_.toString(info?.extmetadata?.LicenseShortName?.value || info?.extmetadata?.UsageTerms?.value || "Wikimedia Commons source page")),
        provider: "wikimedia_commons",
      };
    }
  }
  return null;
};

export const searchArchivalImageWithChrome = async (
  query: string,
  headless: boolean = true,
  sharedContext?: BrowserContext,
  excludeSourceUrls: string[] = [],
): Promise<ArchivalImageResult> => {
  const cleanQuery = _.trim(query);
  if (_.isEmpty(cleanQuery)) return { success: false, warning: "archival_search_query_missing" };
  const excludedSources = new Set(_.map(excludeSourceUrls, _.toString));
  const browser = sharedContext ? null : await chromium.launch({ headless, channel: "chrome" }).catch(() => chromium.launch({ headless }));
  let page: Page | null = null;
  try {
    const context = sharedContext || (await browser!.newContext({ locale: "en-US", userAgent: DOWNLOAD_USER_AGENT }));
    page = await context.newPage();
    const googleResult = await searchGoogleImages(context, page, cleanQuery, excludedSources).catch(() => null);
    if (googleResult) return googleResult;
    const bingResult = await searchBingImages(context, page, cleanQuery, excludedSources).catch(() => null);
    if (bingResult) return bingResult;
    const commonsResult = await searchWikimediaCommons(context, page, cleanQuery, excludedSources).catch(() => null);
    return commonsResult || { success: false, warning: "no_suitable_archival_image_found" };
  } finally {
    await page?.close().catch(() => undefined);
    await browser?.close().catch(() => undefined);
  }
};
