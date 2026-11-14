import { FC } from "react";
import _ from "lodash";
import { ImagePlus, RefreshCw, RotateCcw, Sparkles, Square, Trash2, Volume2, VolumeX, Wand2 } from "lucide-react";
import { Button } from "../../../components/ui/Button.js";
import { cn } from "../../../lib/utils.js";
import { VIDEO_EXPORT_TEXT_BUTTON, VIDEO_EXPORT_TEXT_UNSTYLED } from "../../../constants/videoExportText";
import { VIDEO_EXPORT_AI_CLIP_CLASSNAMES as CLS, VIDEO_EXPORT_AI_CLIP_CONSTANTS, VIDEO_EXPORT_AI_CLIP_FORMAT } from "../constants/videoExportAiClip.js";
import { VideoExportAiClipsState } from "../hooks/useVideoExportAiClips.js";
import { VideoExportTexts } from "./videoExportUtils.js";
type VideoExportAiClipPanelProps = { text: VideoExportTexts; aiClips: VideoExportAiClipsState; disabled: boolean };
export const VideoExportAiClipPanel: FC<VideoExportAiClipPanelProps> = ({ text, aiClips, disabled }) => {
  const { note, images, clips, job, isGenerating, completedImageIds, missingImages, failedErrorByImageId, hasRecoverableError } = aiClips;
  const isLocked = disabled || isGenerating;
  const hasActiveClips = !_.isEmpty(clips);
  const hasPartialMissing = hasActiveClips && !_.isEmpty(missingImages);
  const primaryLabel = isGenerating
    ? text.AI_CLIP_GENERATING
    : hasPartialMissing
      ? hasRecoverableError
        ? VIDEO_EXPORT_AI_CLIP_FORMAT.RETRY_FAILED_LABEL(text.AI_CLIP_RETRY_FAILED, missingImages.length)
        : VIDEO_EXPORT_AI_CLIP_FORMAT.CONTINUE_LABEL(text.AI_CLIP_CONTINUE, missingImages.length, images.length)
      : hasRecoverableError
        ? text.AI_CLIP_RETRY_BTN
        : text.AI_CLIP_GENERATE;
  const PrimaryIcon = hasPartialMissing || hasRecoverableError ? RotateCcw : Wand2;
  return (
    <div className={CLS.PANEL}>
      <div className={CLS.HEADER}>
        <div className={CLS.TITLE}>
          <Wand2 className={CLS.TITLE_ICON} />
          <span className={CLS.TITLE_TEXT}>{text.AI_CLIP_TITLE}</span>
        </div>
        <span className={cn(CLS.TOGGLE, hasActiveClips ? CLS.TOGGLE_ON : CLS.TOGGLE_OFF)}>
          {hasActiveClips ? text.AI_CLIP_ON : text.AI_CLIP_OFF}
        </span>
      </div>
      <p className={CLS.HINT}>{text.AI_CLIP_HINT}</p>
      <div className={CLS.BODY}>
          <div className={CLS.LABEL}>{text.AI_CLIP_IMAGES_LABEL}</div>
          <div className={CLS.THUMB_GRID}>
            {_.map(images, (image) => {
              const isReady = completedImageIds.has(image.id);
              const errorReason = failedErrorByImageId.get(image.id);
              const isFailed = Boolean(errorReason);
              const redoTitle = isFailed ? text.AI_CLIP_RETRY_IMAGE : text.AI_CLIP_REDO_ITEM;
              return (
                <div key={image.id} className={cn(CLS.THUMB, isFailed && CLS.THUMB_FAILED, isReady && !isFailed && CLS.THUMB_READY)} title={errorReason ? `${image.name}: ${errorReason}` : image.name}>
                  <img src={image.dataUrl} alt={image.name} className={CLS.THUMB_MEDIA} />
                  {!isLocked && (
                    <div className={CLS.THUMB_ACTIONS}>
                      {(isFailed || isReady) && (
                        <Button variant={VIDEO_EXPORT_TEXT_UNSTYLED} type={VIDEO_EXPORT_TEXT_BUTTON} title={redoTitle} aria-label={redoTitle} onClick={() => void aiClips.retryImage(image.id)} className={CLS.THUMB_RETRY}>
                          <RotateCcw className={CLS.THUMB_REMOVE_ICON} />
                        </Button>
                      )}
                      <Button variant={VIDEO_EXPORT_TEXT_UNSTYLED} type={VIDEO_EXPORT_TEXT_BUTTON} title={text.AI_CLIP_REMOVE} aria-label={text.AI_CLIP_REMOVE} onClick={() => aiClips.removeImage(image.id)} className={CLS.THUMB_REMOVE}>
                        <Trash2 className={CLS.THUMB_REMOVE_ICON} />
                      </Button>
                    </div>
                  )}
                  {(isFailed || isReady) && (
                    <div className={cn(CLS.THUMB_STATUS_BADGE, isFailed ? CLS.THUMB_STATUS_FAILED : CLS.THUMB_STATUS_READY)}>
                      {isFailed ? text.AI_CLIP_FAILED_BADGE : text.AI_CLIP_READY_BADGE}
                    </div>
                  )}
                </div>
              );
            })}
            {!isLocked && images.length < VIDEO_EXPORT_AI_CLIP_CONSTANTS.MAX_IMAGES && (
              <label className={CLS.UPLOAD}>
                <ImagePlus className={CLS.UPLOAD_ICON} />
                <span>{text.AI_CLIP_UPLOAD}</span>
                <input type={VIDEO_EXPORT_AI_CLIP_CONSTANTS.FILE_INPUT_TYPE} accept={VIDEO_EXPORT_AI_CLIP_CONSTANTS.ACCEPT_IMAGES} multiple className={CLS.HIDDEN_INPUT} onChange={(event) => void aiClips.addFiles(event)} />
              </label>
            )}
          </div>
          <label className={CLS.LABEL}>
            <span>{text.AI_CLIP_NOTE_LABEL}</span>
          </label>
          <textarea value={note} rows={VIDEO_EXPORT_AI_CLIP_CONSTANTS.NOTE_ROWS} disabled={isLocked} placeholder={text.AI_CLIP_NOTE_PLACEHOLDER} onChange={(event) => aiClips.setNote(event.target.value)} className={CLS.NOTE} />
          <div className={CLS.ACTIONS}>
            <Button variant={VIDEO_EXPORT_TEXT_UNSTYLED} type={VIDEO_EXPORT_TEXT_BUTTON} disabled={isLocked || _.isEmpty(images)} onClick={() => void aiClips.generate()} className={CLS.PRIMARY}>
              {isGenerating ? <Sparkles className={CLS.SPIN_ICON} /> : <PrimaryIcon className={CLS.BUTTON_ICON} />}
              <span>{primaryLabel}</span>
            </Button>
            {isGenerating ? (
              <Button variant={VIDEO_EXPORT_TEXT_UNSTYLED} type={VIDEO_EXPORT_TEXT_BUTTON} disabled={job?.stopping} onClick={() => void aiClips.stop()} className={CLS.SECONDARY}>
                <Square className={CLS.BUTTON_ICON} />
                <span>{text.AI_CLIP_STOP}</span>
              </Button>
            ) : (
              !_.isEmpty(clips) && (
                <Button variant={VIDEO_EXPORT_TEXT_UNSTYLED} type={VIDEO_EXPORT_TEXT_BUTTON} disabled={isLocked || _.isEmpty(images)} onClick={() => void aiClips.generate({ restart: true })} className={CLS.RESTART_BTN}>
                  <RefreshCw className={CLS.BUTTON_ICON} />
                  <span>{text.AI_CLIP_RESTART}</span>
                </Button>
              )
            )}
          </div>
          {hasRecoverableError && job ? (
            <div className={CLS.RECOVERY_BOX}>
              <div className={CLS.RECOVERY_HEADER}>
                <span className={CLS.ERROR}>{job.message || text.AI_CLIP_ERR_FAILED}</span>
              </div>
              {!_.isEmpty(job.errors) && (
                <div className={CLS.ERROR_LIST}>
                  {_.map(job.errors, (error, index) => (
                    <div key={index} className={CLS.ERROR}>
                      {error}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            job && <div className={CLS.STATUS}>{job.message}</div>
          )}
          {!_.isEmpty(clips) && (
            <div className={CLS.BODY}>
              <div className={CLS.CLIP_HEADER}>
                <span className={CLS.LABEL}>{VIDEO_EXPORT_AI_CLIP_FORMAT.COUNT_LABEL(text.AI_CLIP_CLIPS_LABEL, clips.length)}</span>
                {!isLocked && (
                  <Button variant={VIDEO_EXPORT_TEXT_UNSTYLED} type={VIDEO_EXPORT_TEXT_BUTTON} onClick={aiClips.clearClips} className={CLS.CLIP_CLEAR}>
                    {text.AI_CLIP_CLEAR}
                  </Button>
                )}
              </div>
              <div className={CLS.CLIP_GRID}>
                {_.map(clips, (clip) => {
                  const isAudioOn = Boolean(clip.keepAudio);
                  const audioToggleLabel = isAudioOn ? text.AI_CLIP_MUTE : text.AI_CLIP_UNMUTE;
                  const canRedo = aiClips.canRedoClip(clip);
                  return (
                    <div key={clip.id} className={CLS.CLIP}>
                      <video src={clip.url} muted={!isAudioOn} loop autoPlay playsInline className={CLS.THUMB_MEDIA} />
                      <div className={CLS.CLIP_ACTIONS}>
                        <Button
                          variant={VIDEO_EXPORT_TEXT_UNSTYLED}
                          type={VIDEO_EXPORT_TEXT_BUTTON}
                          disabled={isLocked}
                          title={audioToggleLabel}
                          aria-label={audioToggleLabel}
                          onClick={() => aiClips.toggleClipAudio(clip.id)}
                          className={cn(CLS.CLIP_AUDIO_BTN, isAudioOn ? CLS.CLIP_AUDIO_ON : CLS.CLIP_AUDIO_OFF)}
                        >
                          {isAudioOn ? <Volume2 className={CLS.CLIP_ACTION_ICON} /> : <VolumeX className={CLS.CLIP_ACTION_ICON} />}
                        </Button>
                        {!isLocked && canRedo && (
                          <Button
                            variant={VIDEO_EXPORT_TEXT_UNSTYLED}
                            type={VIDEO_EXPORT_TEXT_BUTTON}
                            title={text.AI_CLIP_REDO_ITEM}
                            aria-label={text.AI_CLIP_REDO_ITEM}
                            onClick={() => aiClips.redoClip(clip.id)}
                            className={CLS.CLIP_REDO_BTN}
                          >
                            <RotateCcw className={CLS.CLIP_ACTION_ICON} />
                          </Button>
                        )}
                        {!isLocked && (
                          <Button
                            variant={VIDEO_EXPORT_TEXT_UNSTYLED}
                            type={VIDEO_EXPORT_TEXT_BUTTON}
                            title={text.AI_CLIP_REMOVE}
                            aria-label={text.AI_CLIP_REMOVE}
                            onClick={() => aiClips.removeClip(clip.id)}
                            className={CLS.CLIP_DELETE_BTN}
                          >
                            <Trash2 className={CLS.CLIP_ACTION_ICON} />
                          </Button>
                        )}
                      </div>
                      <div className={CLS.CLIP_FOOTER}>
                        <span className={CLS.CLIP_NAME}>{clip.name}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className={CLS.LOOP_NOTE}>{clips.length === 1 ? text.AI_CLIP_LOOP_SINGLE : text.AI_CLIP_LOOP_MULTI}</p>
            </div>
          )}
        </div>
    </div>
  );
};
