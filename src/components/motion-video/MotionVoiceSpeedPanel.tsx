import { AudioLines, Check, Gauge, Link2, Radio } from "lucide-react";
import { useState } from "react";
import { MOTION_VOICE_SPEED as SP } from "../../constants/motionVoice.js";
import { VOICE_SPEED_WORKSPACE_TEXT, VOICE_WORKSPACE_CONFIG as C, VOICE_WORKSPACE_STYLES as W } from "../../constants/motionVoiceWorkspace.js";
import type { MotionVoiceSpeedSettings } from "../../types/motionVideo.js";
import { motionWorkspaceLanguage } from "../../lib/motionWorkspace.js";
import { MotionVoiceAudioUpload, MotionVoiceField, MotionVoiceToolCard } from "./MotionVoiceWorkspace.js";
import { StudioInput, StudioSegmentButton, StudioSegmentedControl } from "../ui/Studio.js";
import { ActionBtn } from "./MotionControls.js";
interface Props { lang: string; busy: string; settings: MotionVoiceSpeedSettings | null; url: string; onUrl: (url: string) => void; onMeasure: () => void; onAudio: (file: File) => void; }
export function MotionVoiceSpeedPanel({ lang, busy, settings, url, onUrl, onMeasure, onAudio }: Props) {
  const language = motionWorkspaceLanguage(lang);
  const t = VOICE_SPEED_WORKSPACE_TEXT[language], sp = SP.TEXT[language];
  const [source, setSource] = useState<(typeof C.SOURCE)[keyof typeof C.SOURCE]>(C.SOURCE.VIDEO);
  const target = settings?.target;
  return (
    <MotionVoiceToolCard icon={Gauge} title={sp.TITLE} description={sp.HINT}>
      <StudioSegmentedControl aria-label={sp.TITLE}>
        <StudioSegmentButton selected={source === C.SOURCE.VIDEO} onClick={() => setSource(C.SOURCE.VIDEO)}><Link2 className={W.ICON_SMALL} />{t.VIDEO}</StudioSegmentButton>
        <StudioSegmentButton selected={source === C.SOURCE.AUDIO} onClick={() => setSource(C.SOURCE.AUDIO)}><AudioLines className={W.ICON_SMALL} />{t.AUDIO}</StudioSegmentButton>
      </StudioSegmentedControl>
      {source === C.SOURCE.VIDEO ? (
        <div className={W.SOURCE_ROW}>
          <MotionVoiceField label={t.URL}><StudioInput type={C.URL_TYPE} value={url} onChange={(event) => onUrl(event.target.value)} placeholder={sp.PLACEHOLDER} className={W.INPUT} disabled={!!busy} onKeyDown={(event) => { if (event.key === C.ENTER_KEY && !busy && url.trim()) { event.preventDefault(); onMeasure(); } }} /></MotionVoiceField>
          <ActionBtn icon={Radio} className={W.ACTION} busy={busy === SP.MEASURE_URL} disabled={!!busy || !url.trim()} onClick={onMeasure}>{sp.MEASURE}</ActionBtn>
        </div>
      ) : (
        <div className={W.FORM}><MotionVoiceAudioUpload title={busy === SP.AUDIO_URL ? sp.AUDIO_BUSY : t.UPLOAD} hint={t.UPLOAD_HINT} accept={SP.AUDIO.ACCEPT} disabled={!!busy} onFiles={(files) => onAudio(files[0])} /><p className={W.META}>{sp.AUDIO_HINT}</p></div>
      )}
      {target ? (
        <div className={W.RESULT} role={C.STATUS_ROLE}>
          <Check className={W.ICON} />
          <div className={W.RESULT_RATE}><strong className={W.RATE}>{(target.window || target.rate).toFixed(2)}</strong><span className={W.META}>{t.UNIT}</span></div>
          <div className={W.RESULT_TITLE}><span className={W.LABEL}>{t.RESULT}</span>{target.title}</div>
          {target.pauses && (
            <div className={W.DETAILS}>{sp.PAUSES(target.pauses.clause ?? target.pauses.sentence, target.pauses.sentence, target.pauses.suspense, target.pauses.beat)}{target.source === SP.SOURCE_AUDIO && <p>{sp.AUDIO_STATS(target.pauses.articulation, target.phrase || 0, Math.round((target.speechRatio || 0) * 100))}</p>}</div>
          )}
        </div>
      ) : (
        <div className={W.ASIDE}><p className={W.LABEL}>{t.EMPTY}</p><p className={W.META}>{t.EMPTY_HINT}</p></div>
      )}
    </MotionVoiceToolCard>
  );
}
