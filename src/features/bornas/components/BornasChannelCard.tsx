import type { FC } from "react";
import { PauseCircle, Plus, Radio, Trash2 } from "lucide-react";
import { Button } from "../../../components/ui/Button.js";
import { StudioCard, StudioFieldset } from "../../../components/ui/Studio.js";
import { MOTION_VOICE_CHANNEL_TEXT } from "../../../constants/motionVoice.js";
import { cn } from "../../../lib/utils.js";
import { StepHeader } from "../../motion/components/MotionControls.js";
import { MotionSettingsGroup } from "../../motion/components/MotionSettingsGroup.js";
import { ReupSelect, ReupTextField, ReupToggle } from "../../reup/components/ReupControls.js";
import { REUP_STYLES as S } from "../../reup/constants/reupStyles.js";
import { BORNAS_COUNTS, BORNAS_LENGTHS, BORNAS_TOPICS } from "../constants/bornasConfig.js";
import { BORNAS_STYLES as B } from "../constants/bornasStyles.js";
import type { BornasStudio } from "../hooks/useBornasStudio.js";
import type { BornasLanguage, BornasTopic } from "../types/bornas.js";
export const BornasChannelCard: FC<{ studio: BornasStudio; ui: "vi" | "en" }> = ({ studio, ui }) => {
  const { text, channel, channels, patchChannel } = studio;
  const voiceText = MOTION_VOICE_CHANNEL_TEXT[ui];
  const locked = studio.running || studio.busy;
  if (!channel) return null;
  return (
    <StudioCard className={S.CARD}>
      <StepHeader
        n="01"
        icon={Radio}
        title={text.CHANNELS}
        hint={text.CHANNEL_SAVED}
        right={
          <Button variant="unstyled" className={B.CHANNEL_DELETE} disabled={locked} onClick={() => window.confirm(text.CHANNEL_DELETE_CONFIRM(channel.name)) && studio.removeChannel(channel.id)}>
            <Trash2 className={S.ICON} />
            <span>{text.CHANNEL_DELETE}</span>
          </Button>
        }
      />
      <div className={S.BODY}>
        <div className={B.CHANNEL_BAR}>
          {channels.map((c) => (
            <Button key={c.id} variant="unstyled" disabled={locked} title={c.name} className={cn(B.CHANNEL_CHIP, c.id === channel.id ? B.CHANNEL_ON : B.CHANNEL_OFF)} onClick={() => studio.selectChannel(c.id)}>
              {c.name}
            </Button>
          ))}
          <Button variant="unstyled" disabled={locked} className={B.CHANNEL_ADD} onClick={studio.addChannel}>
            <Plus className={S.ICON} />
            <span>{text.CHANNEL_ADD}</span>
          </Button>
        </div>
        <StudioFieldset disabled={locked} className={S.GROUPS}>
          <MotionSettingsGroup title={text.CHANNEL_SETTINGS}>
            <ReupTextField label={text.CHANNEL_NAME} value={channel.name} maxLength={80} onChange={(name) => patchChannel({ name })} />
            <ReupSelect<BornasTopic> label={text.TOPIC} title={text.TOPIC_HINT} value={channel.topic} options={BORNAS_TOPICS.map((value) => ({ value, label: text.TOPICS[value] }))} onChange={(topic) => patchChannel({ topic })} />
            <ReupSelect<string> label={text.VOICE} title={voiceText.CHANNELS_HINT} value={channel.voiceChannel} options={[{ value: "", label: voiceText.NO_CHANNEL }, ...studio.voiceChannels.channels.map((c) => ({ value: c.id, label: c.name }))]} onChange={(voiceChannel) => patchChannel({ voiceChannel })} />
            <ReupSelect<BornasLanguage> label={text.LANGUAGE} value={channel.language} options={(["vi", "en"] as const).map((value) => ({ value, label: text.LANGUAGES[value] }))} onChange={(language) => patchChannel({ language })} />
            <ReupSelect<number> label={text.COUNT} value={channel.count} options={BORNAS_COUNTS.map((value) => ({ value, label: text.COUNT_VALUE(value) }))} onChange={(count) => patchChannel({ count })} />
            <ReupSelect<number> label={text.LENGTH} value={channel.seconds} options={BORNAS_LENGTHS.map((value) => ({ value, label: text.MINUTES(value / 60) }))} onChange={(seconds) => patchChannel({ seconds })} />
            <ReupToggle label={text.REVIEW} icon={PauseCircle} checked={channel.review} on={text.REVIEW_ON} off={text.REVIEW_OFF} onChange={(review) => patchChannel({ review })} />
          </MotionSettingsGroup>
        </StudioFieldset>
      </div>
    </StudioCard>
  );
};
