import _ from "lodash";
import { MOTION_REMOTION_RENDER as R } from "../../../constants/motionRemotionRender.js";
import { VIDEO_EXPORT_SPEED } from "../constants/videoExportSpeed.js";
export type VideoExportLanePlan = { lanes: number; threads: number };
export const videoExportRenderLanes = (cpus: number, freeBytes: number, jobs: number, pixels: number): VideoExportLanePlan => {
  const bytesPerLane = R.BYTES_PER_WORKER * Math.max(1, pixels / VIDEO_EXPORT_SPEED.BASE_PIXELS);
  const lanes = Math.max(1, Math.min(R.MAX_WORKERS, cpus - R.RESERVED_CPUS, Math.floor(freeBytes / bytesPerLane), Math.max(1, jobs)));
  return { lanes, threads: Math.max(1, Math.floor(cpus / lanes)) };
};
export const runVideoExportLanes = async <T>(items: T[], lanes: number, worker: (item: T, index: number) => Promise<void>): Promise<void> => {
  let cursor = 0;
  let failure: unknown = null;
  const runLane = async (): Promise<void> => {
    while (failure === null && cursor < items.length) {
      const index = cursor;
      cursor += 1;
      try {
        await worker(items[index], index);
      } catch (error) {
        failure = failure ?? error;
      }
    }
  };
  await Promise.all(_.times(Math.max(1, Math.min(lanes, items.length)), runLane));
  if (failure !== null) throw failure;
};
