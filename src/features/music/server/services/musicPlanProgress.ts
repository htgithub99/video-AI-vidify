import type { Response } from "express";
import { RUNTIME_TEXT as RT_SHARED } from "../../../../constants/runtime/shared.js";
import type { MusicPlanEvent, MusicPlanPartial, MusicPlanProgress } from "../../../../types/musicPlanning.js";
import { ndjsonReporter } from "../../../../server/utils/ndjsonReporter.js";
export const musicPlanReporter = (res: Response, streaming: boolean, totalSongs: number) => {
  let completedSongs = 0;
  const { emit, finish } = ndjsonReporter(res, streaming);
  return {
    progress: (stage: string, data?: MusicPlanPartial, detail?: Partial<MusicPlanProgress>) => {
      if (data?.songs) completedSongs = data.songs.length;
      emit({ type: RT_SHARED.PROGRESS, progress: { stage, completedSongs, totalSongs, ...detail }, ...(data ? { data } : {}) } satisfies MusicPlanEvent);
    },
    finish,
  };
};
