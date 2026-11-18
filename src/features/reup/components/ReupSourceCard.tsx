import type { FC } from "react";
import { BookOpen, Captions, Clock, HardDrive, Image as ImageIcon, Monitor, PauseCircle, Rocket, RotateCcw, ShieldCheck, Volume2 } from "lucide-react";
import { StudioCard, StudioFieldset, StudioInput } from "../../../components/ui/Studio.js";
import { Button } from "../../../components/ui/Button.js";
import { MOTION_LANGUAGES } from "../../../constants/motionLanguages/index.js";
import { MOTION_MUSIC } from "../../../constants/motionMusic.js";
import type { MotionVideoTexts } from "../../../constants/motionVideoTexts.js";
import { MOTION_VOICE_CHANNEL_TEXT } from "../../../constants/motionVoice.js";
import { ActionBtn, MotionStatCard, StepHeader, StopBtn } from "../../motion/components/MotionControls.js";
import { MotionSettingsGroup } from "../../motion/components/MotionSettingsGroup.js";
import { formatBytes } from "../../motion/components/motionApi.js";
import { MOTION_SETTINGS_TEXT } from "../../motion/constants/motionSettings.js";
import { REUP_PRESETS, reupPreset } from "../constants/reupPresets.js";
import { REUP_STYLES as S } from "../constants/reupStyles.js";
import type { ReupStudio } from "../hooks/useReupStudio.js";
import { REUP_LANGUAGES } from "../lib/reupSettings.js";
import type { ReupCorner, ReupLanguage, ReupNatural, ReupPresetId } from "../types/reup.js";
import { ReupSelect, ReupTextField, ReupToggle, reupClock, type ReupOption } from "./ReupControls.js";
const CORNERS: ReupCorner[] = ["tl", "tr", "bl", "br"];
const SHORTS = [1, 2, 3, 4, 5];
/** Step 01: the footage, the rights check and the few choices that are not fixed by the video type. */
export const ReupSourceCard: FC<{ studio: ReupStudio; ui: "vi" | "en"; motionText: MotionVideoTexts }> = ({ studio, ui, motionText }) => {
  const { text, settings, patch, source, job, running } = studio;
  const def = reupPreset(studio.preset);
  const voiceText = MOTION_VOICE_CHANNEL_TEXT[ui];
  const musicText = MOTION_MUSIC.UI[ui];
  const groups = MOTION_SETTINGS_TEXT[ui];
  const locked = running || studio.busy;
  const folder = def.source === "folder";
  const languages: ReupOption<ReupLanguage>[] = REUP_LANGUAGES.map((code) => ({ value: code, label: MOTION_LANGUAGES[code].label[ui] }));
  const channels: ReupOption<string>[] = [{ value: "", label: voiceText.NO_CHANNEL }, ...studio.voiceChannels.channels.map((c) => ({ value: c.id, label: c.name }))];
  const logo = settings.logo === "blur" ? settings.logoCorner : settings.logo;
  const logoText: Record<string, string> = { off: text.LOGO_OFF, crop: text.LOGO_CROP, tl: text.LOGO_TL, tr: text.LOGO_TR, bl: text.LOGO_BL, br: text.LOGO_BR };
  const runningStep = job && Object.entries(job.steps).find(([, step]) => step.status === "running")?.[0];
  return (
    <StudioCard className={S.CARD}>
      <StepHeader
        n="01"
        icon={BookOpen}
        title={text.STEP_SOURCE}
        badge={folder ? text.BADGE_FOLDER : text.BADGE_VIDEO}
        right={
          <Button variant="unstyled" onClick={() => void studio.pickSource()} disabled={locked} className={S.LINK_BUTTON}>
            {folder ? text.PICK_FOLDER : text.PICK_FILE}
          </Button>
        }
      />
      <div className={S.BODY}>
        <StudioInput
          className={S.INPUT}
          value={studio.sourcePath}
          placeholder={text.PATH_PLACEHOLDER}
          disabled={locked}
          onChange={(e) => studio.setSourcePath(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void studio.loadSource(e.currentTarget.value)}
          onBlur={(e) => e.target.value.trim() !== source?.path && void studio.loadSource(e.target.value)}
        />
        {source ? (
          <div className={S.STATS}>
            <MotionStatCard icon={Clock} iconClassName={S.STAT_ICON_A} label={text.STAT_LENGTH}>
              {reupClock(source.duration)}
            </MotionStatCard>
            {source.kind === "folder" ? (
              <MotionStatCard icon={ImageIcon} iconClassName={S.STAT_ICON_B} label={text.STAT_ITEMS}>
                {source.items?.filter((i) => i.type === "photo").length || 0} / {source.items?.filter((i) => i.type === "clip").length || 0}
              </MotionStatCard>
            ) : (
              <MotionStatCard icon={Monitor} iconClassName={S.STAT_ICON_B} label={text.STAT_SIZE}>
                {source.width}×{source.height} · {Math.round(source.fps)}
              </MotionStatCard>
            )}
            <MotionStatCard icon={Volume2} iconClassName={S.STAT_ICON_C} label={text.STAT_AUDIO}>
              {source.hasAudio ? text.AUDIO_YES : text.AUDIO_NO}
            </MotionStatCard>
            <MotionStatCard icon={HardDrive} iconClassName={S.STAT_ICON_D} label={text.STAT_FILE}>
              {formatBytes(source.sizeBytes)}
            </MotionStatCard>
          </div>
        ) : (
          <p className={S.HINT}>{text.NO_SOURCE}</p>
        )}
        <StudioFieldset disabled={locked} className={S.GROUPS}>
          <MotionSettingsGroup title={groups.CONTENT}>
            <ReupSelect<ReupPresetId> label={text.TYPE} title={text.TYPE_HINT} value={studio.preset} options={REUP_PRESETS.map((p) => ({ value: p.id, label: text.TYPES[p.id] }))} onChange={studio.selectPreset} />
            <ReupSelect<number> label={text.LENGTH} value={settings.targetSeconds} options={def.lengths.map((n) => ({ value: n, label: n < 120 ? text.SECONDS(n) : text.MINUTES(n / 60) }))} onChange={(targetSeconds) => patch({ targetSeconds })} />
            {def.kind === "short" && !def.speech && <ReupSelect<number> label={text.SHORTS} value={settings.shortsCount} options={SHORTS.map((n) => ({ value: n, label: String(n) }))} onChange={(shortsCount) => patch({ shortsCount })} />}
            <ReupSelect<ReupLanguage> label={text.LANGUAGE} value={settings.language} options={languages} onChange={(language) => patch({ language })} />
            {def.bilingual && <ReupSelect<ReupLanguage> label={text.LANGUAGE_ALT} value={settings.languageAlt} options={languages.filter((l) => l.value !== settings.language)} onChange={(languageAlt) => patch({ languageAlt })} />}
            {!def.speech && <ReupTextField label={text.SOURCE_LINK} value={settings.sourceLink} maxLength={300} onChange={(sourceLink) => patch({ sourceLink })} />}
          </MotionSettingsGroup>
          <MotionSettingsGroup title={groups.AUDIO}>
            {!def.speech && <ReupSelect<string> label={voiceText.PICK_CHANNEL} title={voiceText.CHANNELS_HINT} value={settings.voiceChannel} options={channels} onChange={(voiceChannel) => patch({ voiceChannel })} />}
            {def.bilingual && <ReupSelect<string> label={text.VOICE_ALT} value={settings.voiceChannelAlt} options={channels} onChange={(voiceChannelAlt) => patch({ voiceChannelAlt })} />}
            <ReupSelect<string>
              label={musicText.LABEL}
              value={settings.musicMood}
              options={[...Object.entries(musicText.MOODS).map(([value, label]) => ({ value, label: value === MOTION_MUSIC.AUTO ? text.MUSIC_AUTO : label })), { value: MOTION_MUSIC.OFF, label: musicText.OFF }]}
              onChange={(musicMood) => patch({ musicMood })}
            />
            {!def.speech && source?.hasAudio !== false && (
              <ReupSelect<ReupNatural>
                label={text.NATURAL}
                value={settings.natural}
                options={[
                  { value: "keep", label: text.NATURAL_KEEP },
                  { value: "low", label: text.NATURAL_LOW },
                  { value: "off", label: text.NATURAL_OFF },
                ]}
                onChange={(natural) => patch({ natural })}
              />
            )}
          </MotionSettingsGroup>
          <MotionSettingsGroup title={groups.VISUAL}>
            {!folder && <ReupSelect<string> label={text.LOGO} value={logo} options={["off", "crop", ...CORNERS].map((value) => ({ value, label: logoText[value] }))} onChange={(value) => patch(CORNERS.includes(value as ReupCorner) ? { logo: "blur", logoCorner: value as ReupCorner } : { logo: value as "off" | "crop" })} />}
            <ReupToggle label={motionText.SUBTITLES_MODE} icon={Captions} checked={settings.subtitles} on={motionText.SUBTITLES_ON} off={motionText.SUBTITLES_OFF} hint={motionText.SUBTITLES_HINT} onChange={(subtitles) => patch({ subtitles })} />
            <ReupToggle label={text.STOP_SCRIPT} icon={PauseCircle} checked={settings.stopScript} on={text.STOP_ON} off={text.STOP_OFF} onChange={(stopScript) => patch({ stopScript })} />
          </MotionSettingsGroup>
          {def.speech && (
            <MotionSettingsGroup title={text.BRAND}>
              <ReupTextField label={text.BRAND_NAME} value={settings.brandName} maxLength={60} onChange={(brandName) => patch({ brandName })} />
              <ReupTextField label={text.HOTLINE} value={settings.hotline} maxLength={40} onChange={(hotline) => patch({ hotline })} />
              <ReupTextField label={text.CTA} value={settings.cta} maxLength={120} onChange={(cta) => patch({ cta })} />
              <ReupTextField label={text.LOGO_FILE} value={settings.logoFile} onChange={(logoFile) => patch({ logoFile })} />
            </MotionSettingsGroup>
          )}
          <ReupToggle label={text.LICENSE} icon={ShieldCheck} checked={studio.licensed} on={text.LICENSE_ON} off={text.LICENSE_OFF} hint={text.LICENSE_HINT} onChange={studio.setLicensed} />
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
              <ActionBtn icon={Rocket} onClick={studio.start} disabled={!source || studio.busy} className={S.ACTION_WIDE}>
                {text.START}
              </ActionBtn>
            </>
          )}
        </div>
      </div>
    </StudioCard>
  );
};
