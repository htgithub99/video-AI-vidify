import _ from "lodash";
export const getErrorMessage = (error: unknown, fallback?: string): string => (error instanceof Error ? error.message : (fallback ?? _.toString(error)));
