import _ from "lodash";
import { API_ROUTES, REFACTOR_CONSTANTS, SecurityConstants } from "../constants";

interface VoiceCatalogCacheEntry {
  data: unknown;
  expiresAt: number;
}

const responseCache = new Map<string, VoiceCatalogCacheEntry>();
const pendingRequests = new Map<string, Promise<unknown>>();

const createVoiceCatalogUrl = (params: URLSearchParams): string => (
  _.join(
    [API_ROUTES.VOICES, params.toString()],
    SecurityConstants.QUERY_MARK,
  )
);

export const fetchVoiceCatalog = async (params: URLSearchParams): Promise<unknown> => {
  const requestUrl = createVoiceCatalogUrl(params);
  const cachedResponse = responseCache.get(requestUrl);

  if (_.every([
    !_.isNil(cachedResponse),
    _.gt(cachedResponse?.expiresAt, Date.now()),
  ], Boolean)) {
    return _.get(cachedResponse, SecurityConstants.DATA_KEY);
  }

  const pendingRequest = pendingRequests.get(requestUrl);
  if (!_.isNil(pendingRequest)) return pendingRequest;

  const request = fetch(requestUrl)
    .then((response) => {
      if (!response.ok) {
        throw new Error(REFACTOR_CONSTANTS.VOICES_ERR_FAILED_TO_FETCH);
      }
      return response.json();
    })
    .then((data) => {
      responseCache.set(requestUrl, {
        data,
        expiresAt: _.add(Date.now(), REFACTOR_CONSTANTS.VOICES_CACHE_TTL_MS),
      });
      return data;
    })
    .finally(() => {
      pendingRequests.delete(requestUrl);
    });

  pendingRequests.set(requestUrl, request);
  return request;
};
