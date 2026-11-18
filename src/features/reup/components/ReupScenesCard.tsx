import { useEffect, useState, type FC } from "react";
import { AlertTriangle, Download, ScanSearch } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../../../components/ui/Button.js";
import { saveBlobWithDialog } from "../../../lib/fileUtils.js";
import { Pagination } from "../../../components/ui/Pagination.js";
import { StudioCard } from "../../../components/ui/Studio.js";
import { MOTION_VISUAL } from "../../../constants/motionVisual.js";
import { STUDIO_PAGINATION, STUDIO_PAGINATION_TEXT } from "../../../constants/studioTheme.js";
import { getPagination } from "../../../lib/pagination.js";
import { StepHeader } from "../../motion/components/MotionControls.js";
import { REUP_URL } from "../constants/reupConfig.js";
import { REUP_STYLES as S } from "../constants/reupStyles.js";
import type { ReupStudio } from "../hooks/useReupStudio.js";
import { reupClock } from "./ReupControls.js";
/** Placeholder cards shown before the AI has read the footage, like Video Motion's scene grid before scenes exist. */
const PLACEHOLDERS = 6;
interface SceneCard {
  key: string;
  image?: string;
  /** File name offered when the image is downloaded. */
  name?: string;
  title: string;
  time?: string;
  text: string;
  value?: number;
}
/**
 * Step 02 in Video Motion's scene-grid look: what the AI saw, scene by scene with the real frame, paged like Motion.
 * Before the map exists the grid still shows: the contact sheets sent to the AI, or empty cards with the step's state.
 */
export const ReupScenesCard: FC<{ studio: ReupStudio; ui: "vi" | "en" }> = ({ studio, ui }) => {
  const { text, job } = studio;
  const [page, setPage] = useState<number>(STUDIO_PAGINATION.FIRST_PAGE);
  useEffect(() => setPage(STUDIO_PAGINATION.FIRST_PAGE), [job?.id]);
  const map = job?.sceneMap;
  const state = job?.steps.scenes.status || "idle";
  // A stopped or failed step says so (its own message, e.g. "Đã huỷ"), not "not started".
  const status = (state !== "running" && state !== "done" && job?.steps.scenes.message) || text.SCENES_STATE[state === "done" ? "running" : state] || text.SCENES_STATE.idle;
  const cards: SceneCard[] = map
    ? map.segments.map((segment, i) => ({ key: segment.id, image: REUP_URL.FRAME(job!.id, (segment.start + segment.end) / 2), name: `scene_${i + 1}.jpg`, title: text.SCENE(i + 1), time: `${reupClock(segment.start)}–${reupClock(segment.end)}`, text: segment.caption || segment.what, value: segment.value }))
    : job?.sheets.length
      ? job.sheets.map((sheet) => ({ key: sheet.file || String(sheet.index), image: sheet.url, name: `contact_sheet_${sheet.index + 1}.jpg`, title: text.SHEET(sheet.index + 1), time: `${reupClock(sheet.start)}–${reupClock(sheet.start + sheet.interval * sheet.count)}`, text: status }))
      : Array.from({ length: PLACEHOLDERS }, (_v, i) => ({ key: `p${i}`, title: text.SCENE(i + 1), text: status }));
  const perPage = MOTION_VISUAL.SCENES_PER_PAGE;
  /** Save an image through the "Save as" dialog, like the music screen's cover download. */
  const save = async (url: string, name: string) => {
    try {
      if (await saveBlobWithDialog(await fetch(url).then((r) => r.blob()), name)) toast.success(text.IMAGE_SAVED);
    } catch (error) {
      if ((error as Error)?.name !== "AbortError") toast.error(text.IMAGE_SAVE_FAIL);
    }
  };
  const pagination = getPagination(cards.length, page, perPage);
  return (
    <StudioCard className={S.CARD}>
      <StepHeader n="02" icon={ScanSearch} title={text.STEP_SCENES} badge={map ? text.SCENES_COUNT(map.segments.length) : undefined} />
      <div className={S.SCENES}>
        <div className={S.SCENES_HEAD}>
          <p className={S.SCENES_COUNT}>
            {job?.sheets.length ? text.CONTACT_SHEETS(job.sheets.length) : text.SCENES_EMPTY}
            {job?.bad.length ? ` · ${text.FOOTAGE_BAD(job.bad.length)}` : ""}
          </p>
        </div>
        {map?.summary && <p className={S.SCENES_SUMMARY}>{map.summary}</p>}
        <div className={S.SCENES_GRID}>
          {cards.slice(pagination.start, pagination.end).map((card) => (
            <div key={card.key} className={S.SCENE_CARD}>
              {card.image ? (
                <img className={S.SCENE_IMAGE} loading="lazy" alt={card.title} src={card.image} />
              ) : (
                <div className={S.SCENE_PENDING}>
                  <p className={S.SCENE_STATUS}>{card.text}</p>
                </div>
              )}
              <div className={S.SCENE_CAPTION_ROW}>
                <p className={S.SCENE_CAPTION} title={card.text}>
                  {card.title}
                  {card.time ? ` · ${card.time}` : ""}
                  {card.value ? ` · ★${card.value}` : ""}
                </p>
                {card.image && (
                  <Button variant="unstyled" type="button" className={S.SCENE_DOWNLOAD} title={text.DOWNLOAD_IMAGE} aria-label={text.DOWNLOAD_IMAGE} onClick={() => void save(card.image!, card.name!)}>
                    <Download className={S.ICON} />
                  </Button>
                )}
              </div>
              {card.image && (
                <p className={S.SCENE_TEXT} title={card.text}>
                  {card.text}
                </p>
              )}
            </div>
          ))}
        </div>
        <Pagination page={pagination.page} pageSize={perPage} total={cards.length} onChange={setPage} texts={STUDIO_PAGINATION_TEXT[ui]} hideUnavailableNavigation />
        {!!job?.warnings.length && (
          <div className={S.WARN_BOX}>
            <p className={S.HINT_WARN}>
              <AlertTriangle className={S.INLINE_ICON} />
              {text.WARNINGS}
            </p>
            {job.warnings.map((warning) => (
              <p key={warning} className={S.HINT_WARN}>
                {warning}
              </p>
            ))}
          </div>
        )}
      </div>
    </StudioCard>
  );
};
