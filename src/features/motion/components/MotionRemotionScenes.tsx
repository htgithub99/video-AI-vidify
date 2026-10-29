import { RUNTIME_TEXT as RT_SHARED } from "../../../constants/runtime/shared.js";
import { RUNTIME_TEXT as RT_MOTION } from "../constants/runtimeText.js";
import { useState, type FC } from "react";
import { MOTION_VISUAL as V } from "../../../constants/motionVisual.js";
import { MOTION_STORY_CONFIG } from "../../../constants/motionVideo.js";
import { MOTION_REMOTION_STYLES as S } from "../constants/motionStyles.js";
import { STUDIO_PAGINATION, STUDIO_PAGINATION_TEXT } from "../../../constants/studioTheme.js";
import { getPagination } from "../../../lib/pagination.js";
import { remotionSceneProgress } from "../lib/motionRemotionProgress.js";
import { Pagination } from "../../../components/ui/Pagination.js";
import { MotionRemotionStill } from "./MotionRemotionStill.js";
import type { MotionRemotionSpec, MotionRemotionScene, MotionRenderBehavior } from "../../../types/motionVisual.js";
import type { MotionStoryScript } from "../../../types/motionVideo.js";
export const MotionRemotionScenes: FC<{ script: MotionStoryScript; language: string; renderBehavior?: MotionRenderBehavior; busy?: boolean; onOpen?: (scene: MotionRemotionScene, preview: MotionRemotionSpec, index: number) => void; onRedo?: (scene: MotionRemotionScene) => void }> = ({ script, language, renderBehavior, busy = false, onOpen, onRedo }) => {
  const [page, setPage] = useState<number>(STUDIO_PAGINATION.FIRST_PAGE);
  const progress = remotionSceneProgress(renderBehavior && script.gen?.remotion ? { ...script, gen: { ...script.gen, remotion: { ...script.gen.remotion, renderBehavior } } } : script, busy, language);
  const pagination = getPagination(progress.total, page, V.SCENES_PER_PAGE);
  const lang = language === RT_SHARED.EN ? RT_SHARED.EN : RT_SHARED.VI;
  const text = V.TEXT[lang];
  return (
    <div className={S.PANEL} {...{ [MOTION_STORY_CONFIG.BUSY_ALLOW_ATTR]: true }}>
      <p className={S.COUNT}>{`${text.ready}${RT_SHARED.SYMBOL_45822F}${progress.ready}${RT_SHARED.SYMBOL_8A5EDA}${progress.total}`}</p>
      <div className={S.GRID}>
        {progress.entries.slice(pagination.start, pagination.end).map((entry, offset) => {
          const index = pagination.start + offset;
          const title = text.scene(index + 1);
          const status = entry.status === RT_SHARED.FAILED ? text.sceneFailed : busy ? text.sceneWaiting : text.sceneStopped;
          return (
            <div key={entry.key} className={S.CARD}>
              {entry.preview && entry.scene ? (
                <button type={RT_SHARED.BUTTON} className={S.OPEN} aria-label={title} onClick={() => onOpen?.(entry.scene!, entry.preview!, index)}>
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
              {entry.preview && entry.status === RT_SHARED.FAILED && (
                <p className={S.FAILURE} title={entry.reason}>
                  {entry.reason}
                </p>
              )}
              <p className={S.CAPTION} title={entry.narration || entry.scene?.purpose}>
                {title}
                {RT_MOTION.CAPTION_SEPARATOR}
                {entry.narration || entry.scene?.purpose}
              </p>
              {entry.scene && onRedo && (
                <button type={RT_SHARED.BUTTON} className={S.RETRY} disabled={busy} onClick={() => onRedo(entry.scene!)}>
                  {text.retryScene}
                </button>
              )}
            </div>
          );
        })}
      </div>
      <Pagination page={pagination.page} pageSize={V.SCENES_PER_PAGE} total={progress.total} onChange={setPage} texts={STUDIO_PAGINATION_TEXT[lang]} hideUnavailableNavigation />
    </div>
  );
};
