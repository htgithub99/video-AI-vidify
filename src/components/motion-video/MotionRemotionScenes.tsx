import { useState, type FC } from "react";
import { MOTION_VISUAL as V } from "../../constants/motionVisual.js";
import { MOTION_STORY_CONFIG } from "../../constants/motionVideo.js";
import { MOTION_REMOTION_STYLES as S } from "../../constants/motionStyles.js";
import { STUDIO_PAGINATION, STUDIO_PAGINATION_TEXT } from "../../constants/studioTheme.js";
import { getPagination } from "../../lib/pagination.js";
import { remotionSceneProgress } from "../../lib/motionRemotionProgress.js";
import { Pagination } from "../ui/Pagination.js";
import { MotionRemotionStill } from "./MotionRemotionStill.js";
import type { MotionRemotionSpec, MotionRemotionScene, MotionRenderBehavior } from "../../types/motionVisual.js";
import type { MotionStoryScript } from "../../types/motionVideo.js";
export const MotionRemotionScenes: FC<{ script: MotionStoryScript; language: string; renderBehavior?: MotionRenderBehavior; busy?: boolean; onOpen?: (scene: MotionRemotionScene, preview: MotionRemotionSpec, index: number) => void }> = ({ script, language, renderBehavior, busy = false, onOpen }) => {
  const [page, setPage] = useState<number>(STUDIO_PAGINATION.FIRST_PAGE);
  const progress = remotionSceneProgress(renderBehavior && script.gen?.remotion ? { ...script, gen: { ...script.gen, remotion: { ...script.gen.remotion, renderBehavior } } } : script, busy, language);
  const pagination = getPagination(progress.total, page, V.SCENES_PER_PAGE);
  const lang = language === "en" ? "en" : "vi";
  const text = V.TEXT[lang];
  return (
    <div className={S.PANEL} {...{ [MOTION_STORY_CONFIG.BUSY_ALLOW_ATTR]: true }}>
      <p className={S.COUNT}>{`${text.ready}: ${progress.ready}/${progress.total}`}</p>
      <div className={S.GRID}>
        {progress.entries.slice(pagination.start, pagination.end).map((entry, offset) => {
          const index = pagination.start + offset;
          const title = text.scene(index + 1);
          const status = entry.status === "failed" ? text.sceneFailed : busy ? text.sceneWaiting : text.sceneStopped;
          return (
            <div key={entry.key} className={S.CARD}>
              {entry.preview && entry.scene ? (
                <button type="button" className={S.OPEN} aria-label={title} onClick={() => onOpen?.(entry.scene!, entry.preview!, index)}>
                  <MotionRemotionStill document={entry.preview} />
                </button>
              ) : (
                <div className={S.PENDING}>
                  <div className={S.PENDING_CONTENT}>
                    <p className={S.STATUS} title={status}>
                      {status}
                    </p>
                    <p className={S.REASON} title={entry.reason}>
                      {entry.reason}
                    </p>
                  </div>
                </div>
              )}
              <p className={S.CAPTION} title={entry.narration || entry.scene?.purpose}>
                {title} · {entry.narration || entry.scene?.purpose}
              </p>
            </div>
          );
        })}
      </div>
      <Pagination page={pagination.page} pageSize={V.SCENES_PER_PAGE} total={progress.total} onChange={setPage} texts={STUDIO_PAGINATION_TEXT[lang]} hideUnavailableNavigation />
    </div>
  );
};
