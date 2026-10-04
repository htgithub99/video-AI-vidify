import { RENDER_LOGIC_CONSTANTS } from "../constants/index.js";
import { StoryboardScene } from "../types.js";
import { parseTimeToSeconds } from "./timeUtils.js";
import _ from "lodash";
export const getSceneTimeRanges = (storyboard: StoryboardScene[]) => {
  let elapsed = 0;
  return _.map(storyboard, (sc) => {
    const startSec = parseTimeToSeconds(sc.startTime || RENDER_LOGIC_CONSTANTS.EMPTY_STRING);
    const endSec = parseTimeToSeconds(sc.endTime || RENDER_LOGIC_CONSTANTS.EMPTY_STRING);
    const start = sc.startTime && !_.isNil(startSec) && _.gte(startSec, 0) ? startSec : elapsed;
    const duration = sc.duration || 5;
    const end = sc.endTime && !_.isNil(endSec) && _.gt(endSec, start) ? endSec : start + duration;
    const actualDuration = end - start;
    elapsed = end;
    return {
      id: sc.id,
      start,
      end,
      duration: actualDuration,
      cameraMotion: sc.cameraMotion,
      transition: sc.transition,
      subtitle: sc.subtitle || sc.script,
      assetName: sc.assetName,
    };
  });
};
