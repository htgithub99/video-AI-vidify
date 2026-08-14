import { useQuery } from '@tanstack/react-query';
import { API_ROUTES, REFACTOR_CONSTANTS } from '../constants';

const FIVE_MINUTES_MS = 5 * 60 * 1000;
const STALE_TIME = FIVE_MINUTES_MS;

export function usePresets() {
  return useQuery({
    queryKey: [REFACTOR_CONSTANTS.PRESETS_QUERY_KEY],
    queryFn: async () => {
      const response = await fetch(API_ROUTES.PRESETS);
      if (!response.ok) {
        throw new Error(REFACTOR_CONSTANTS.PRESETS_ERR_FAILED_TO_FETCH);
      }
      return response.json();
    },
    staleTime: STALE_TIME,
  });
}
