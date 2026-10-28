import type { FC } from "react";
import { Play, Sparkles, Square } from "lucide-react";
import { MOTION_TEXT_UNSTYLED } from "../../../constants/motionRuntime.js";
import { MOTION_VOICE_PANEL_STYLES as S } from "../../../constants/motionVoice.js";
import { Button } from "../../../components/ui/Button";
interface MotionVoicePreviewButtonProps {
  voiceId: string;
  playingId: string | null;
  busyId: string;
  playLabel: string;
  stopLabel: string;
  onPreview: (voiceId: string) => void;
}
export const MotionVoicePreviewButton: FC<MotionVoicePreviewButtonProps> = ({ voiceId, playingId, busyId, playLabel, stopLabel, onPreview }) => {
  const playing = playingId === voiceId;
  const loading = !!voiceId && busyId === voiceId;
  return (
    <Button variant={MOTION_TEXT_UNSTYLED} title={playing ? stopLabel : playLabel} disabled={!voiceId || (!!busyId && !loading)} onClick={() => onPreview(voiceId)} className={playing ? S.PLAY_BTN_PLAYING : S.PLAY_BTN_CIRCULAR}>
      {loading ? <Sparkles className={S.ICON_LOADING} /> : playing ? <Square className={S.ICON_STOP} /> : <Play className={S.ICON_PLAY} />}
    </Button>
  );
};
