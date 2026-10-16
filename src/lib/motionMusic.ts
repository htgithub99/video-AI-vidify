import _ from "lodash";
import { MOTION_MUSIC_MOODS } from "../constants/motionMusic.js";
export const motionMusicMoodKey = (value: unknown): string | undefined => {
  const key = _.toString(value);
  return MOTION_MUSIC_MOODS[key] ? key : undefined;
};
