import { useQuery } from '@tanstack/react-query';
import { API_ROUTES, REFACTOR_CONSTANTS } from '../constants';

const QUERY_KEY = REFACTOR_CONSTANTS.PRESETS_QUERY_KEY;
const STALE_TIME = 5 * 60 * 1000;
const ERR_FAILED_TO_FETCH = REFACTOR_CONSTANTS.PRESETS_ERR_FAILED_TO_FETCH;

export function usePresets() {
  return useQuery({
    queryKey: [QUERY_KEY],
    queryFn: async () => {
      const res = await fetch(API_ROUTES.PRESETS);
      if (!res.ok) {
        throw new Error(ERR_FAILED_TO_FETCH);
      }
      return res.json();
    },
    staleTime: STALE_TIME,
  });
}
