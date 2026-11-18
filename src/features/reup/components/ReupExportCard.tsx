import type { FC } from "react";
import { Clapperboard, Smartphone, Tv } from "lucide-react";
import { StudioCard } from "../../../components/ui/Studio.js";
import { MOTION_TEXT_FPS } from "../../../constants/motionRuntime.js";
import type { MotionVideoTexts } from "../../../constants/motionVideoTexts.js";
import { ActionBtn, ChipButton, StepHeader, StopBtn } from "../../motion/components/MotionControls.js";
import { REUP_STYLES as S } from "../constants/reupStyles.js";
import type { ReupStudio } from "../hooks/useReupStudio.js";
import type { ReupAspect, ReupQuality } from "../types/reup.js";
import { ReupSelect } from "./ReupControls.js";
const ASPECTS: { aspect: ReupAspect; icon: typeof Tv }[] = [
  { aspect: "16:9", icon: Tv },
  { aspect: "9:16", icon: Smartphone },
];
const FPS = [24, 25, 30, 60];
/** Step 04: the export format, laid out like Video Motion's export card. */
export const ReupExportCard: FC<{ studio: ReupStudio; motionText: MotionVideoTexts }> = ({ studio, motionText: m }) => {
  const { text, settings, patch } = studio;
  const locked = studio.running || studio.busy;
  // Built automatically by "Start"; once the voice is ready the videos can be exported again in another format or mix.
  const ready = studio.job?.steps.voice.status === "done";
  const exporting = studio.running && studio.job?.steps.build.status === "running";
  const qualities: [ReupQuality, string][] = [
    ["draft", m.QUALITY_DRAFT],
    ["standard", m.QUALITY_STANDARD],
    ["high", m.QUALITY_HIGH],
    ["ultra", m.QUALITY_ULTRA],
  ];
  return (
    <StudioCard className={S.CARD}>
      <StepHeader n="04" icon={Clapperboard} title={text.STEP_EXPORT} badge="MP4" />
      <div className={S.BODY_LOOSE}>
        <div className={S.CHIP_ROW}>
          <span className={S.CHIP_LABEL}>{m.ASPECT}</span>
          <div className={S.CHIPS_ASPECT}>
            {ASPECTS.map(({ aspect, icon: Icon }) => (
              <ChipButton key={aspect} active={settings.aspect === aspect} onClick={() => patch({ aspect })} disabled={locked} className={S.CHIP}>
                <Icon className={S.ICON_SHRINK} />
                <span>{aspect}</span>
              </ChipButton>
            ))}
          </div>
        </div>
        <div className={S.CHIP_ROW}>
          <span className={S.CHIP_LABEL}>{m.QUALITY}</span>
          <div className={S.CHIPS_QUALITY}>
            {qualities.map(([quality, label]) => (
              <ChipButton key={quality} active={settings.quality === quality} onClick={() => patch({ quality })} disabled={locked}>
                {label}
              </ChipButton>
            ))}
          </div>
        </div>
        <div className={S.EXPORT_ROW}>
          <ReupSelect<number> label={m.FPS} value={settings.fps} options={FPS.map((f) => ({ value: f, label: `${f}${MOTION_TEXT_FPS}` }))} onChange={(fps) => patch({ fps })} disabled={locked} />
          <ReupSelect<string> label={m.ENCODER} value="cpu" options={[{ value: "cpu", label: m.ENCODER_CPU }]} onChange={() => undefined} disabled />
        </div>
        <div className={S.EXPORT_ACTIONS}>
          {exporting ? (
            <StopBtn onClick={() => void studio.cancel()} label={m.STOP_RENDER} stopping={studio.busy} />
          ) : (
            <ActionBtn icon={Clapperboard} onClick={() => void studio.exportVideo()} disabled={!ready || locked}>
              {m.RENDER_BTN}
            </ActionBtn>
          )}
          <p className={S.HINT}>{ready ? text.EXPORT_HINT : text.EXPORT_NEED_VOICE}</p>
        </div>
      </div>
    </StudioCard>
  );
};
