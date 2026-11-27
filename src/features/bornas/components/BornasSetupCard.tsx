import type { FC } from "react";
import { Clock, Film, Monitor, PauseCircle, Play, Plus, Radio, Rocket, RotateCcw, Smartphone, Trash2 } from "lucide-react";
import { Button } from "../../../components/ui/Button.js";
import { StudioDeleteConfirm, useStudioDeleteConfirm } from "../../../components/common/StudioDeleteConfirm.js";
import { StudioCard, StudioFieldset, StudioInput } from "../../../components/ui/Studio.js";
import { MOTION_VOICE_CHANNEL_TEXT } from "../../../constants/motionVoice.js";
import { MOTION_LANGUAGES, MOTION_LANGUAGE_CODES } from "../../../constants/motionLanguages/index.js";
import { cn } from "../../../lib/utils.js";
import { ActionBtn, MotionPickButton, MotionStatCard, StepHeader, StopBtn } from "../../motion/components/MotionControls.js";
import { MotionNoticeHint } from "../../motion/components/MotionNoticeHint.js";
import { MotionSettingsGroup } from "../../motion/components/MotionSettingsGroup.js";
import { MOTION_NOTICE_IDS } from "../../motion/constants/motionNotices.js";
import { ReupSelect, ReupTextArea, ReupTextField, ReupToggle, reupClock } from "../../reup/components/ReupControls.js";
import { REUP_STYLES as S } from "../../reup/constants/reupStyles.js";
import { BORNAS_COUNTS, BORNAS_GENRES, BORNAS_STATE, BORNAS_LENGTHS, BORNAS_MUSIC_CHOICES, BORNAS_STEPS, BORNAS_TOPICS } from "../constants/bornasConfig.js";
import { BORNAS_STYLES as B } from "../constants/bornasStyles.js";
import type { BornasStudio } from "../hooks/useBornasStudio.js";
import type { BornasGenre, BornasLanguage, BornasMusicChoice, BornasTopic } from "../types/bornas.js";
export const BornasSetupCard: FC<{ studio: BornasStudio; ui: "vi" | "en" }> = ({ studio, ui }) => {
  const { text, channel, channels, patchChannel, sample, job, running } = studio;
  const voiceText = MOTION_VOICE_CHANNEL_TEXT[ui];
  const locked = running || studio.busy;
  const confirmDel = useStudioDeleteConfirm();
  const runningStep = job && BORNAS_STEPS.find((id) => job.steps[id].status === "running");
  if (!channel) return null;
  const notices = [
    { id: "saved", tone: MOTION_NOTICE_IDS.INFO, text: text.CHANNEL_SAVED, show: true },
    { id: "source", tone: MOTION_NOTICE_IDS.INFO, text: text.SOURCE_HINT(channel.name, channel.count), show: true },
  ];
  return (
    <StudioCard className={S.CARD}>
      <StepHeader
        n="01"
        icon={Radio}
        title={text.SETUP}
        hint={<MotionNoticeHint notices={notices} />}
        right={
          <>
            <Button variant="unstyled" className={cn(B.CHANNEL_BUTTON, B.CHANNEL_DELETE)} disabled={locked} onClick={() => confirmDel.ask({ names: [channel.name], message: text.CHANNEL_DELETE_CONFIRM(channel.name), run: () => studio.removeChannel(channel.id) })}>
              <Trash2 className={S.ICON} />
              <span>{text.CHANNEL_DELETE}</span>
            </Button>
            <MotionPickButton label={text.PICK_FILE} icon={Film} loading={studio.picking} disabled={locked} onClick={() => void studio.pickSource()} className={S.LINK_BUTTON} />
          </>
        }
      />
      <div className={S.BODY}>
        <div className={B.CHANNEL_BAR}>
          {channels.map((c) => (
            <Button key={c.id} variant={c.id === channel.id ? B.CHANNEL_ON_VARIANT : "unstyled"} disabled={locked} title={c.name} className={cn(B.CHANNEL_BUTTON, c.id === channel.id ? B.CHANNEL_ON : B.CHANNEL_OFF)} onClick={() => studio.selectChannel(c.id)}>
              <Radio className={S.ICON} />
              <span>{c.name}</span>
            </Button>
          ))}
          <Button variant="unstyled" disabled={locked} className={cn(B.CHANNEL_BUTTON, B.CHANNEL_ADD)} onClick={studio.addChannel}>
            <Plus className={S.ICON} />
            <span>{text.CHANNEL_ADD}</span>
          </Button>
        </div>
        <StudioInput className={S.INPUT} value={studio.sourcePath} placeholder={text.PATH_PLACEHOLDER} disabled={locked} onChange={(e) => studio.setSourcePath(e.target.value)} onKeyDown={(e) => e.key === "Enter" && void studio.loadSource(e.currentTarget.value)} onBlur={(e) => e.target.value.trim() !== sample?.path && void studio.loadSource(e.target.value)} />
        {sample ? (
          <div className={S.STATS}>
            <MotionStatCard icon={Clock} iconClassName={S.STAT_ICON_A} label={text.STAT_LENGTH}>
              {reupClock(sample.duration)}
            </MotionStatCard>
            <MotionStatCard icon={Monitor} iconClassName={S.STAT_ICON_B} label={text.STAT_SIZE}>
              {`${sample.width}×${sample.height}`}
            </MotionStatCard>
          </div>
        ) : (
          <p className={S.HINT}>{text.NO_SOURCE}</p>
        )}
        <StudioFieldset disabled={locked} className={S.GROUPS}>
          <MotionSettingsGroup title={text.GROUP_CHANNEL}>
            <ReupTextField label={text.CHANNEL_NAME} value={channel.name} maxLength={80} onChange={(name) => patchChannel({ name })} />
            <ReupSelect<BornasLanguage> label={text.LANGUAGE} value={channel.language} options={MOTION_LANGUAGE_CODES.map((value) => ({ value, label: MOTION_LANGUAGES[value].label[ui] }))} onChange={(language) => patchChannel({ language })} />
            <ReupSelect<number> label={text.LENGTH} value={channel.seconds} options={BORNAS_LENGTHS.map((value) => ({ value, label: text.MINUTES(value / 60) }))} onChange={(seconds) => patchChannel({ seconds })} />
            <ReupSelect<number> label={text.COUNT} value={channel.count} options={BORNAS_COUNTS.map((value) => ({ value, label: text.COUNT_VALUE(value) }))} onChange={(count) => patchChannel({ count })} />
            <ReupToggle label={text.REVIEW} icon={PauseCircle} checked={channel.review} on={text.REVIEW_ON} off={text.REVIEW_OFF} onChange={(review) => patchChannel({ review })} />
            <ReupToggle label={text.SHORT_MAKE} icon={Smartphone} checked={channel.short !== false} on={text.SHORT_ON} off={text.SHORT_OFF} onChange={(short) => patchChannel({ short })} />
          </MotionSettingsGroup>
          <MotionSettingsGroup title={text.GROUP_CONTENT}>
            <ReupSelect<BornasTopic> label={text.TOPIC} title={text.TOPIC_HINT} value={channel.topic} options={BORNAS_TOPICS.map((value) => ({ value, label: text.TOPICS[value] }))} onChange={(topic) => patchChannel({ topic })} />
            <ReupSelect<BornasGenre> label={text.GENRE} title={text.GENRE_HINT} value={channel.genre} options={BORNAS_GENRES.map((value) => ({ value, label: text.GENRES[value] }))} onChange={(genre) => patchChannel({ genre })} />
            <ReupTextArea label={text.DONE(channel.done.length)} placeholder={text.DONE_HINT} value={channel.done.join(BORNAS_STATE.DONE_JOIN)} onChange={(value) => patchChannel({ done: value.split(BORNAS_STATE.DONE_SPLIT).map((item) => item.trim()).filter(Boolean) })} />
          </MotionSettingsGroup>
          <MotionSettingsGroup title={text.GROUP_AUDIO}>
            <ReupSelect<string> label={text.VOICE} title={voiceText.CHANNELS_HINT} value={channel.voiceChannel} options={[{ value: "", label: voiceText.NO_CHANNEL }, ...studio.voiceChannels.channels.map((c) => ({ value: c.id, label: c.name }))]} onChange={(voiceChannel) => patchChannel({ voiceChannel })} />
            <ReupSelect<BornasMusicChoice> label={text.MUSIC} title={text.MUSIC_HINT} value={channel.music} options={BORNAS_MUSIC_CHOICES.map((value) => ({ value, label: text.MUSIC_CHOICES[value] }))} onChange={(music) => patchChannel({ music })} />
          </MotionSettingsGroup>
        </StudioFieldset>
        <div className={S.ACTIONS}>
          {running ? (
            <div className={S.ACTIONS_BUSY}>
              <ActionBtn busy icon={Rocket} onClick={() => undefined}>
                {(runningStep && text.STEPS[runningStep]) || text.RUNNING}
              </ActionBtn>
              <StopBtn onClick={() => void studio.cancel()} label={text.CANCEL} stopping={studio.busy} />
            </div>
          ) : (
            <>
              {job && (
                <ActionBtn variant="secondary" icon={RotateCcw} onClick={studio.newJob} disabled={studio.busy}>
                  {text.NEW_JOB}
                </ActionBtn>
              )}
              {studio.resumeStep && (
                <ActionBtn icon={Play} onClick={() => void studio.resume()} disabled={studio.busy} title={text.RESUME_HINT}>
                  {text.RESUME}
                </ActionBtn>
              )}
              <ActionBtn icon={Rocket} onClick={studio.start} disabled={!sample || studio.busy} className={S.ACTION_WIDE} variant={studio.resumeStep ? "secondary" : "primary"}>
                {text.START}
              </ActionBtn>
            </>
          )}
        </div>
      </div>
      <StudioDeleteConfirm request={confirmDel.request} onClose={confirmDel.close} lang={ui} />
    </StudioCard>
  );
};
