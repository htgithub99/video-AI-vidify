import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import _ from 'lodash';
import {
  API_ROUTES,
  API_QUERY_PARAMS,
  VBEE_PROVIDER_ID,
  VOICE_OWNERSHIP_KEY,
  VOICE_OWNERSHIP_COMMUNITY,
  REFACTOR_CONSTANTS,
  SecurityConstants
} from '../constants';

const CACHE_PREFIX = REFACTOR_CONSTANTS.VOICES_CACHE_PREFIX;
const QUERY_KEY = REFACTOR_CONSTANTS.VOICES_QUERY_KEY;
const EMPTY_STRING = REFACTOR_CONSTANTS.VD_EMPTY_STRING;
const JOIN_CHAR = REFACTOR_CONSTANTS.VOICES_JOIN_CHAR;
const STALE_TIME = 24 * 60 * 60 * 1000;
const ERR_FAILED_TO_FETCH = REFACTOR_CONSTANTS.VOICES_ERR_FAILED_TO_FETCH;

export interface UseVoicesFilters {
  provider: string;
  page: number;
  pageSize: number;
  language?: string;
  gender?: string;
  age?: string;
  search?: string;
}

export function useVoices(filters: UseVoicesFilters, enabled = true) {
  const parts = [
    CACHE_PREFIX,
    filters.provider,
    filters.page,
    filters.pageSize,
    filters.language || EMPTY_STRING,
    filters.gender || EMPTY_STRING,
    filters.age || EMPTY_STRING,
    filters.search || EMPTY_STRING
  ];
  const cacheKey = _.join(parts, JOIN_CHAR);

  const query = useQuery({
    queryKey: [QUERY_KEY, filters],
    queryFn: async () => {
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

      const res = await fetch(
        _.join([API_ROUTES.VOICES, params.toString()], SecurityConstants.QUERY_MARK)
      );
      if (!res.ok) {
        throw new Error(ERR_FAILED_TO_FETCH);
      }
      return res.json();
    },
    initialData: () => {
      const cached = localStorage.getItem(cacheKey);
      return cached ? JSON.parse(cached) : undefined;
    },
    enabled,
    staleTime: STALE_TIME,
  });

  useEffect(() => {
    const data = _.get(query, 'data');
    if (data) {
      localStorage.setItem(cacheKey, JSON.stringify(data));
    }
  }, [query.data, cacheKey]);

  return query;
}
