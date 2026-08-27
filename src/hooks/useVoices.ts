import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import _ from "lodash";
import { API_QUERY_PARAMS, VBEE_PROVIDER_ID, VOICE_OWNERSHIP_KEY, VOICE_OWNERSHIP_COMMUNITY, REFACTOR_CONSTANTS } from "../constants";
import { fetchVoiceCatalog } from "../services/voiceCatalogService";
import { jsonUtils } from "../lib/json";

export interface UseVoicesFilters { provider: string; page: number; pageSize: number; language?: string; gender?: string; age?: string; search?: string; }

const buildVoiceQueryParams = (filters: UseVoicesFilters): URLSearchParams => {
  const params = new URLSearchParams();
  params.append(API_QUERY_PARAMS.PROVIDER, filters.provider);
  params.append(API_QUERY_PARAMS.PAGE, String(filters.page));
  params.append(API_QUERY_PARAMS.PAGE_SIZE, String(filters.pageSize));

  if (!_.isEmpty(filters.language)) {
    params.append(API_QUERY_PARAMS.LANGUAGE, filters.language!);
  }
  if (!_.isEmpty(filters.gender)) {
    params.append(API_QUERY_PARAMS.GENDER, filters.gender!);
  }
  if (!_.isEmpty(filters.age)) {
    params.append(API_QUERY_PARAMS.AGE, filters.age!);
  }
  if (!_.isEmpty(filters.search)) {
    params.append(API_QUERY_PARAMS.SEARCH, filters.search!);
  }
  if (_.isEqual(filters.provider, VBEE_PROVIDER_ID)) {
    params.append(VOICE_OWNERSHIP_KEY, VOICE_OWNERSHIP_COMMUNITY);
  }
  return params;
};

const getVoiceCacheKey = (filters: UseVoicesFilters): string => {
  const parts = [REFACTOR_CONSTANTS.VOICES_CACHE_PREFIX, filters.provider, filters.page, filters.pageSize, filters.language || REFACTOR_CONSTANTS.VD_EMPTY_STRING, filters.gender || REFACTOR_CONSTANTS.VD_EMPTY_STRING, filters.age || REFACTOR_CONSTANTS.VD_EMPTY_STRING, filters.search || REFACTOR_CONSTANTS.VD_EMPTY_STRING];
  return _.join(parts, REFACTOR_CONSTANTS.VOICES_JOIN_CHAR);
};

export function useVoices(filters: UseVoicesFilters, enabled = true) {
  const cacheKey = getVoiceCacheKey(filters);

  const query = useQuery({
    queryKey: [REFACTOR_CONSTANTS.VOICES_QUERY_KEY, filters.provider, filters.page, filters.pageSize, filters.language, filters.gender, filters.age, filters.search],
    queryFn: async () => {
      const params = buildVoiceQueryParams(filters);
      return fetchVoiceCatalog(params);
    },
    initialData: () => jsonUtils.getItem(cacheKey, undefined),
    enabled,
    staleTime: REFACTOR_CONSTANTS.VOICES_CACHE_TTL_MS,
    gcTime: REFACTOR_CONSTANTS.VOICES_CACHE_TTL_MS,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  useEffect(() => {
    const data = _.get(query, "data");
    if (data) jsonUtils.setItem(cacheKey, data);
  }, [query.data, cacheKey]);

  return query;
}
