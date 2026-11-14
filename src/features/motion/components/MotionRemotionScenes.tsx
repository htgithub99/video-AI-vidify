import * as RT_MAINTENANCE from "../../../constants/runtime/maintenance.js";
import { RUNTIME_TEXT as RT_SHARED } from "../../../constants/runtime/shared.js";
import { RUNTIME_TEXT as RT_MOTION } from "../constants/runtimeText.js";
import { useState, type FC } from "react";
import { MOTION_VISUAL as V } from "../../../constants/motionVisual.js";
import { MOTION_STORY_CONFIG } from "../../../constants/motionVideo.js";
import { MOTION_REMOTION_STYLES as S } from "../constants/motionStyles.js";
import { STUDIO_UI, STUDIO_PAGINATION, STUDIO_PAGINATION_TEXT } from "../../../constants/studioTheme.js";
import { getPagination } from "../../../lib/pagination.js";
import { remotionSceneProgress } from "../lib/motionRemotionProgress.js";
import { Pagination } from "../../../components/ui/Pagination.js";
import { Button } from "../../../components/ui/Button.js";
import { MotionRemotionStill } from "./MotionRemotionStill.js";
import { Modal } from "../../../components/ui/Modal";
import { DestructiveActionNotice } from "../../../components/common/DestructiveActionNotice";
import { Trash2 } from "lucide-react";
import { cn } from "../../../lib/utils";
import * as MCS from "../../music/constants/musicCreatorStyles.js";
import * as SRT from "../../../constants/sourceText.js";
import type { MotionRemotionSpec, MotionRemotionScene, MotionRenderBehavior } from "../../../types/motionVisual.js";
import type { MotionStoryScript } from "../../../types/motionVideo.js";
export const MotionRemotionScenes: FC<{ script: MotionStoryScript; language: string; renderBehavior?: MotionRenderBehavior; busy?: boolean; onOpen?: (scene: MotionRemotionScene, preview: MotionRemotionSpec, index: number) => void; onRedo?: (scene: MotionRemotionScene) => void; onRetryFailed?: () => void; onDelete?: (scene: MotionRemotionScene) => void; onDeleteAll?: () => void }> = ({ script, language, renderBehavior, busy = false, onOpen, onRedo, onRetryFailed, onDelete, onDeleteAll }) => {
  const [page, setPage] = useState<number>(STUDIO_PAGINATION.FIRST_PAGE);
  const progress = remotionSceneProgress(renderBehavior && script.gen?.remotion ? { ...script, gen: { ...script.gen, remotion: { ...script.gen.remotion, renderBehavior } } } : script, busy, language);
  const pagination = getPagination(progress.total, page, V.SCENES_PER_PAGE);
  const lang = language === RT_SHARED.EN ? RT_SHARED.EN : RT_SHARED.VI;
  const text = V.TEXT[lang];
  const [pendingDelete, setPendingDelete] = useState<{ scene?: MotionRemotionScene; title: string } | null>(null);
  const confirmDelete = () => {
    const target = pendingDelete;
    setPendingDelete(null);
    if (!target) return;
    if (target.scene) onDelete?.(target.scene);
    else onDeleteAll?.();
  };
  return (
    <div className={S.PANEL} {...{ [MOTION_STORY_CONFIG.BUSY_ALLOW_ATTR]: true }}>
      <div className={S.HEAD}>
        <p className={S.COUNT}>{progress.planned || !progress.total ? `${text.ready}${RT_SHARED.SYMBOL_45822F}${progress.ready}${RT_SHARED.SYMBOL_8A5EDA}${progress.total}${progress.warned ? text.warnedCount(progress.warned) : ""}` : text.unplanned(progress.total)}</p>
        {onDeleteAll && progress.ready > 0 && (
          <Button variant={STUDIO_UI.UNSTYLED} type={RT_SHARED.BUTTON} className={S.DELETE} disabled={busy} onClick={() => setPendingDelete({ title: text.deleteAll })}>
            {text.deleteAll}
          </Button>
        )}
      </div>
      {progress.failed > 0 && onRetryFailed && (
        <Button variant={STUDIO_UI.UNSTYLED} type={RT_SHARED.BUTTON} className={S.RETRY} disabled={busy} onClick={onRetryFailed}>
          {text.retryFailedScenes(progress.failed)}
        </Button>
      )}
      <div className={S.GRID}>
        {progress.entries.slice(pagination.start, pagination.end).map((entry, offset) => {
          const index = pagination.start + offset;
          const title = text.scene(index + 1);
          const htmlStatus = entry.scene?.htmlRequest?.status;
          const htmlLabel =
            htmlStatus === RT_MAINTENANCE.WAITING_EXTERNAL
              ? lang === RT_MAINTENANCE.EN
                ? RT_MAINTENANCE.WAITING_FOR_PROVIDER_PREVIOUS_REQUEST
                : RT_MAINTENANCE.CHO_PROVIDER_PHAN_HOI_YEU_CAU_CU
              : htmlStatus === RT_MAINTENANCE.RETRY_WAIT
                ? lang === RT_MAINTENANCE.EN
                  ? RT_MAINTENANCE.WAITING_TO_RETRY
                  : RT_MAINTENANCE.DANG_CHO_THU_LAI
                : lang === RT_MAINTENANCE.EN
                  ? RT_MAINTENANCE.GENERATING_HTML
                  : RT_MAINTENANCE.DANG_TAO_HTML;
          const status = entry.scene?.renderer === RT_MAINTENANCE.HTML_CANVAS && busy ? htmlLabel : entry.status === RT_SHARED.FAILED ? text.sceneFailed : busy ? text.sceneWaiting : text.sceneStopped;
          return (
            <div key={entry.key} className={S.CARD}>
              {entry.preview && entry.scene ? (
                <Button variant={STUDIO_UI.UNSTYLED} type={RT_SHARED.BUTTON} className={S.OPEN} aria-label={title} onClick={() => onOpen?.(entry.scene!, entry.preview!, index)}>
                  <MotionRemotionStill document={entry.preview} />
                </Button>
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
              {entry.warnings && entry.score !== undefined && (
                <p className={S.FAILURE} title={entry.warnings.join(RT_MAINTENANCE.NEWLINE)}>
                  {text.sceneScore(entry.score)}
                </p>
              )}
              {entry.scene?.renderer === RT_MAINTENANCE.HTML_CANVAS && entry.scene.htmlRequest && (
                <p className={S.ATTEMPT} title={entry.scene.htmlRequest.error}>
                  {lang === RT_MAINTENANCE.EN ? RT_MAINTENANCE.ATTEMPT : RT_MAINTENANCE.LUOT_TAO} {entry.scene.htmlRequest.attempt}
                  {entry.preview ? "" : entry.scene.htmlRequest.error ? `${RT_MAINTENANCE.DOT_SEPARATOR}${entry.scene.htmlRequest.error}` : ""}
                </p>
              )}
              <p className={S.CAPTION} title={entry.narration || entry.scene?.purpose}>
                {title}
                {RT_MOTION.CAPTION_SEPARATOR}
                {entry.narration || entry.scene?.purpose}
              </p>
              {entry.scene && (onRedo || onDelete) && (
                <div className={S.ACTIONS}>
                  {onRedo && (
                    <Button variant={STUDIO_UI.UNSTYLED} type={RT_SHARED.BUTTON} className={S.ACTION} disabled={busy} onClick={() => onRedo(entry.scene!)}>
                      {text.retryScene}
                    </Button>
                  )}
                  {onDelete && (entry.scene.html || entry.scene.build) && (
                    <Button variant={STUDIO_UI.UNSTYLED} type={RT_SHARED.BUTTON} className={S.DELETE} disabled={busy} onClick={() => setPendingDelete({ scene: entry.scene!, title })}>
                      {text.deleteScene}
                    </Button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <Pagination page={pagination.page} pageSize={V.SCENES_PER_PAGE} total={progress.total} onChange={setPage} texts={STUDIO_PAGINATION_TEXT[lang]} hideUnavailableNavigation />
      <Modal
        isOpen={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        maxWidth={SRT.SOURCE_TEXT_MAX_W_MD}
        title={
          <span className={cn(MCS.INLINE_FLEX_ITEMS_CENTER_GAP_2_LEADING_NONE_TEXT_SLATE_900_DARK_TEXT_SLATE)}>
            <Trash2 className={cn(MCS.W_4_H_4_TEXT_ROSE_500_SHRINK_0_SELF_CENTER_TRANSLATE_Y_1PX)} />
            <span className={cn(MCS.LEADING_NONE_TEXT_SM_FONT_EXTRABOLD)}>{pendingDelete?.scene ? text.deleteScene : text.deleteAll}</span>
          </span>
        }>
        <div className={cn(MCS.SPACE_Y_4_TEXT_LEFT)}>
          <p className={cn(MCS.TEXT_XS_SM_TEXT_SM_TEXT_SLATE_700_DARK_TEXT_SLATE_300_LEADING_RELAXED)}>{pendingDelete?.scene ? text.confirmDelete(pendingDelete.title) : text.confirmDeleteAll(progress.ready)}</p>
          <DestructiveActionNotice className={cn(MCS.P_3_ROUNDED_XL_BG_ROSE_500_10_BORDER_BORDER_ROSE_500_20_TEXT_ROSE_700_DARK)} iconClassName={cn(MCS.W_4_H_4_TEXT_ROSE_500_SHRINK_0)}>
            {text.cannotUndo}
          </DestructiveActionNotice>
          <div className={cn(MCS.FLEX_JUSTIFY_END_ITEMS_CENTER_GAP_2_5_PT_3_BORDER_T_BORDER_SLATE_200_DARK_B)}>
            <Button type={SRT.SOURCE_TEXT_BUTTON} variant={SRT.SOURCE_TEXT_OUTLINE} size={SRT.SOURCE_TEXT_SM} onClick={() => setPendingDelete(null)} className={cn(MCS.H_9_PX_4_ROUNDED_XL_TEXT_XS_FONT_BOLD_BORDER_BORDER_SLATE_300_DARK_BORDER_S)}>
              <span className={cn(SRT.SOURCE_TEXT_INLINE_FLEX_ITEMS_CENTER_LEADING_NONE)}>{text.cancel}</span>
            </Button>
            <Button type={SRT.SOURCE_TEXT_BUTTON} variant={SRT.SOURCE_TEXT_DANGER} size={SRT.SOURCE_TEXT_SM} disabled={busy} onClick={confirmDelete} className={cn(MCS.H_9_PX_5_ROUNDED_XL_TEXT_XS_FONT_EXTRABOLD_SHADOW_MD_SHADOW_ROSE_600_20_ACT)}>
              <span className={cn(SRT.SOURCE_TEXT_INLINE_FLEX_ITEMS_CENTER_LEADING_NONE)}>{pendingDelete?.scene ? text.deleteScene : text.deleteAll}</span>
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
