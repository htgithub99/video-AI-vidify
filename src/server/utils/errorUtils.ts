import _ from "lodash";

export const getErrorMessage = (error: unknown): string => (error instanceof Error ? error.message : _.toString(error));
