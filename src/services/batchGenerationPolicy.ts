import _ from "lodash";

const BATCH_GENERATION_POLICY = { MIN_TAB_COUNT: 1 } as const;

export const resolveBatchTabCount = (itemCount: number, defaultConcurrency: number, requestedTabCount?: number): number =>
  _.clamp(_.toInteger(_.defaultTo(requestedTabCount, defaultConcurrency)), BATCH_GENERATION_POLICY.MIN_TAB_COUNT, _.max([itemCount, BATCH_GENERATION_POLICY.MIN_TAB_COUNT])!);
