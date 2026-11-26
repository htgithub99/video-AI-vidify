import { useEffect, useMemo, useState, type FC } from "react";
import { CheckCircle2, ChevronDown, Clock, ScrollText, Sparkles, Type, User } from "lucide-react";
import { Button } from "../../../components/ui/Button.js";
import { StudioCard, StudioInput, StudioTextarea } from "../../../components/ui/Studio.js";
import { cn } from "../../../lib/utils.js";
import type { MotionSeoPack, MotionThumbnail } from "../../../types/motionVideo.js";
import { ActionBtn, StepHeader } from "../../motion/components/MotionControls.js";
import { MotionNoticeHint } from "../../motion/components/MotionNoticeHint.js";
import { MotionSeoCard } from "../../motion/components/MotionSeoCard.js";
import { MOTION_NOTICE_IDS } from "../../motion/constants/motionNotices.js";
import { reupClock } from "../../reup/components/ReupControls.js";
import { REUP_STYLES as S } from "../../reup/constants/reupStyles.js";
import { motionLanguageRate } from "../../../lib/motionLanguage.js";
import { bornasTokens } from "../constants/bornasConfig.js";
import { BORNAS_STYLES as B } from "../constants/bornasStyles.js";
import type { BornasStudio } from "../hooks/useBornasStudio.js";
import type { BornasLine, BornasScript, BornasVideo } from "../types/bornas.js";
const KIND_STYLE: Record<BornasLine["kind"], string> = { tag: B.KIND_TAG, plate: B.KIND_PLATE, label: B.KIND_LABEL, quote: B.KIND_QUOTE, none: B.KIND_NONE };
const StorySeo: FC<{ studio: BornasStudio; video?: BornasVideo; lang: string }> = ({ studio, video, lang }) => {
  const { job, text } = studio;
  const [busy, setBusy] = useState<number | null>(null);
  const seo = video?.seo;
  const pack = useMemo<MotionSeoPack | null>(() => (video && seo?.options.length ? { options: seo.options, chapters: seo.chapters, timingFrom: "voice", scriptKey: `${job?.id}:${video.index}` } : null), [seo, job?.id, video]);
  const thumbnails = useMemo<Record<number, MotionThumbnail>>(() => Object.fromEntries((seo?.thumbs || []).map((t, i) => [i, { image: t.url, prompt: "", optionIndex: i, tag: text.THUMB_KINDS[t.kind] }])), [seo, text.THUMB_KINDS]);
  if (!video || (!seo && !video.jobDir)) return <p className={S.HINT}>{text.SEO_WAIT}</p>;
  const packaging = job?.steps.package.status === "running" && video.stage === "package";
  const regenerate = () => {
    setBusy(0);
    void Promise.resolve(studio.rerun("package", video.index)).finally(() => setBusy(null));
  };
  return (
    <MotionSeoCard
      seo={pack}
      busy={studio.running || studio.busy}
      seoBusy={packaging}
      canGenerate={!!video.jobDir && !studio.running}
      onGenerate={regenerate}
      lang={lang}
      thumbnails={thumbnails}
      onThumbnail={() => regenerate()}
      thumbnailBusy={packaging ? 0 : busy}
      thumbs={{ count: 2, label: text.THUMB, refresh: text.THUMB_REFRESH, row: B.THUMB_ROW, item: B.THUMB_ITEM, button: B.THUMB_REFRESH }}
      footer={
        seo?.pinned && (
          <div className={B.SEO_NOTES}>
            <p className={B.SEO_HINT}>
              {text.PINNED}: {seo.pinned}
            </p>
          </div>
        )
      }
    />
  );
};
export const BornasStoryCard: FC<{ studio: BornasStudio; lang: string }> = ({ studio, lang }) => {
  const { job, text } = studio;
  const [draft, setDraft] = useState<BornasScript[]>([]);
  const [open, setOpen] = useState<number>(0);
  useEffect(() => setDraft(job?.scripts || []), [job?.id, job?.scripts]);
  if (!job?.scripts?.length) return null;
  const waiting = job.status === "waiting" && job.steps.script.status === "waiting";
  const rate = motionLanguageRate(job.channel.language);
  const patch = (i: number, value: Partial<BornasScript>) => setDraft((all) => all.map((s, k) => (k === i ? { ...s, ...value } : s)));
  const patchLine = (i: number, n: number, value: Partial<BornasLine>) => setDraft((all) => all.map((s, k) => (k === i ? { ...s, lines: s.lines.map((l, j) => (j === n ? { ...l, ...value } : l)) } : s)));
  return (
    <StudioCard className={S.CARD}>
      <StepHeader n="02" icon={ScrollText} title={text.SCRIPTS} badge={String(draft.length)} hint={<MotionNoticeHint notices={[{ id: "review", tone: MOTION_NOTICE_IDS.INFO, text: text.SCRIPTS_REVIEW, show: waiting }]} />} />
      <div className={B.STORY}>
        {draft.map((script, i) => {
          const count = script.lines.reduce((n, l) => n + bornasTokens(l.text).length, 0);
          const isOpen = open === i;
          const video = job.videos.find((v) => v.index === i);
          return (
            <div key={i} className={cn(B.SCRIPT, isOpen && B.SCRIPT_OPEN)}>
              <Button variant="unstyled" className={B.SCRIPT_HEAD} onClick={() => setOpen(isOpen ? -1 : i)}>
                <span className={B.SCRIPT_NUM}>{i + 1}</span>
                <span className={B.SCRIPT_HEAD_TEXT}>
                  <span className={B.SCRIPT_TITLE}>{script.title}</span>
                  <span className={B.SCRIPT_CHIPS}>
                    {script.hero && (
                      <span className={B.CHIP}>
                        <User className={B.CHIP_ICON} />
                        {script.hero}
                      </span>
                    )}
                    <span className={B.CHIP}>
                      <Type className={B.CHIP_ICON} />
                      {text.LINES(script.lines.length)} · {text.WORDS(count)}
                    </span>
                    <span className={B.CHIP}>
                      <Clock className={B.CHIP_ICON} />
                      {reupClock(Math.round(count / rate))}
                    </span>
                    {video?.seo && (
                      <span className={cn(B.CHIP, B.CHIP_DONE)}>
                        <Sparkles className={B.CHIP_ICON} />
                        {text.SEO_READY}
                      </span>
                    )}
                  </span>
                </span>
                <ChevronDown className={cn(B.SCRIPT_CHEVRON, isOpen && B.SCRIPT_CHEVRON_OPEN)} />
              </Button>
              {isOpen && (
                <div className={B.STORY_BODY}>
                  <section className={B.STORY_GROUP}>
                    <h3 className={B.STORY_GROUP_TITLE}>{text.GROUP_SCRIPT}</h3>
                    {waiting && (
                      <label className={B.FIELD}>
                        <span className={B.FIELD_LABEL}>{text.SCRIPT_TITLE}</span>
                        <StudioInput className={S.INPUT} value={script.title} onChange={(e) => patch(i, { title: e.target.value })} />
                      </label>
                    )}
                    <div className={B.LINES}>
                      {script.lines.map((line, n) => (
                        <div key={n} className={cn(B.LINE, line.pause && B.LINE_PAUSE)}>
                          <span className={B.LINE_NUM}>{n + 1}</span>
                          <div className={B.LINE_MAIN}>
                            {(line.chapter || (waiting && n > 0 && script.lines[n - 1]?.pause)) && (
                              <div className={B.CHAPTER_ROW}>
                                <span className={B.CHAPTER_BADGE}>{text.CHAPTER}</span>
                                {waiting ? <StudioInput className={B.SCREEN_EDIT} value={line.chapter || ""} placeholder={text.CHAPTER_HINT} onChange={(e) => patchLine(i, n, { chapter: e.target.value })} /> : <span className={B.CHAPTER_TEXT}>{line.chapter}</span>}
                              </div>
                            )}
                            {waiting ? <StudioTextarea rows={2} className={B.LINE_EDIT} value={line.text} onChange={(e) => patchLine(i, n, { text: e.target.value })} /> : <p className={B.LINE_TEXT}>{line.text}</p>}
                            {(line.screen || waiting) && line.kind !== "none" && (
                              <div className={B.LINE_SCREEN_ROW}>
                                <span className={cn(B.KIND, KIND_STYLE[line.kind])}>{text.KINDS[line.kind]}</span>
                                {waiting ? <StudioInput className={B.SCREEN_EDIT} value={line.screen} onChange={(e) => patchLine(i, n, { screen: e.target.value })} /> : <span className={B.SCREEN_TEXT}>{line.screen}</span>}
                                {line.sub && <span className={B.SCREEN_SUB}>{line.sub}</span>}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                  <section className={B.STORY_GROUP}>
                    <h3 className={B.STORY_GROUP_TITLE}>{text.GROUP_SEO}</h3>
                    <StorySeo studio={studio} video={video} lang={lang} />
                  </section>
                </div>
              )}
            </div>
          );
        })}
        {waiting && (
          <div className={B.APPROVE_BAR}>
            <span className={B.APPROVE_NOTE}>{text.APPROVE_NOTE(draft.length)}</span>
            <ActionBtn icon={CheckCircle2} onClick={() => void studio.approve(draft)} disabled={studio.busy} className={S.ACTION_WIDE}>
              {text.APPROVE}
            </ActionBtn>
          </div>
        )}
      </div>
    </StudioCard>
  );
};
