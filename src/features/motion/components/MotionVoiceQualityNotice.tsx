import { RUNTIME_TEXT as RT_MOTION } from "../constants/runtimeText.js";
import { MOTION_VOICE_QUALITY as Q } from "../../../constants/motionVoice.js";
import * as MR from "../../../constants/motionRuntime.js";
import type { MotionVoiceTrack } from "../../../types/motionVideo.js";
import { motionAudioUrl } from "./motionApi.js";
export const MotionVoiceQualityNotice = ({ track, language }: { track?: MotionVoiceTrack | null; language: string }) => {
  const clips = track?.clips?.filter((clip) => clip.quality?.status === Q.STATUS.REVIEW || clip.quality?.status === Q.STATUS.UNAVAILABLE) || [];
  if (!clips.length) return null;
  const text = Q.UI[language === MR.MOTION_TEXT_EN ? MR.MOTION_TEXT_EN : MR.MOTION_TEXT_VI];
  return (
    <details className={Q.STYLES.ROOT}>
      <summary className={Q.STYLES.SUMMARY}>{text.SUMMARY(clips.length)}</summary>
      <p className={Q.STYLES.HINT}>{text.HINT}</p>
      <ol className={Q.STYLES.LIST}>
        {clips.map((clip) => (
          <li key={clip.beatId + clip.id}>
            <p>{clip.text}</p>
            <audio controls preload={RT_MOTION.NONE} src={motionAudioUrl(clip.audioId)} className={Q.STYLES.AUDIO} />
          </li>
        ))}
      </ol>
    </details>
  );
};
