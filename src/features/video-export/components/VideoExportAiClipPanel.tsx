import { FC } from "react";
import _ from "lodash";
import { ImagePlus, Loader2, Square, Wand2, X } from "lucide-react";
import { Button } from "../../../components/ui/Button.js";
import { cn } from "../../../lib/utils.js";
import { VIDEO_EXPORT_TEXT_BUTTON, VIDEO_EXPORT_TEXT_UNSTYLED } from "../../../constants/videoExportText";
import { VIDEO_EXPORT_AI_CLIP_CLASSNAMES as CLS, VIDEO_EXPORT_AI_CLIP_CONSTANTS, VIDEO_EXPORT_AI_CLIP_FORMAT } from "../constants/videoExportAiClip.js";
import { VideoExportAiClipsState } from "../hooks/useVideoExportAiClips.js";
import { VideoExportTexts } from "./videoExportUtils.js";
type VideoExportAiClipPanelProps = { text: VideoExportTexts; aiClips: VideoExportAiClipsState; disabled: boolean };
export const VideoExportAiClipPanel: FC<VideoExportAiClipPanelProps> = ({ text, aiClips, disabled }) => {
  const { enabled, note, images, clips, job, isGenerating } = aiClips;
  const isLocked = disabled || isGenerating;
  return (
    <div className={CLS.PANEL}>
      <div className={CLS.HEADER}>
        <div className={CLS.TITLE}>
          <Wand2 className={CLS.TITLE_ICON} />
          <span className={CLS.TITLE_TEXT}>{text.AI_CLIP_TITLE}</span>
        </div>
        <Button variant={VIDEO_EXPORT_TEXT_UNSTYLED} type={VIDEO_EXPORT_TEXT_BUTTON} disabled={disabled} onClick={() => aiClips.setEnabled(!enabled)} className={cn(CLS.TOGGLE, enabled ? CLS.TOGGLE_ON : CLS.TOGGLE_OFF)}>
          {enabled ? text.AI_CLIP_ON : text.AI_CLIP_OFF}
        </Button>
      </div>
      <p className={CLS.HINT}>{text.AI_CLIP_HINT}</p>
      {enabled && (
        <div className={CLS.BODY}>
          <div className={CLS.LABEL}>{text.AI_CLIP_IMAGES_LABEL}</div>
          <div className={CLS.THUMB_GRID}>
            {_.map(images, (image) => (
              <div key={image.id} className={CLS.THUMB} title={image.name}>
                <img src={image.dataUrl} alt={image.name} className={CLS.THUMB_MEDIA} />
                {!isLocked && (
                  <Button variant={VIDEO_EXPORT_TEXT_UNSTYLED} type={VIDEO_EXPORT_TEXT_BUTTON} aria-label={text.AI_CLIP_REMOVE} onClick={() => aiClips.removeImage(image.id)} className={CLS.THUMB_REMOVE}>
                    <X className={CLS.THUMB_REMOVE_ICON} />
                  </Button>
                )}
              </div>
            ))}
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
          <textarea value={note} rows={VIDEO_EXPORT_AI_CLIP_CONSTANTS.NOTE_ROWS} maxLength={VIDEO_EXPORT_AI_CLIP_CONSTANTS.MAX_NOTE_CHARS} disabled={isLocked} placeholder={text.AI_CLIP_NOTE_PLACEHOLDER} onChange={(event) => aiClips.setNote(event.target.value)} className={CLS.NOTE} />
          <div className={CLS.ACTIONS}>
            <Button variant={VIDEO_EXPORT_TEXT_UNSTYLED} type={VIDEO_EXPORT_TEXT_BUTTON} disabled={isLocked || _.isEmpty(images)} onClick={() => void aiClips.generate()} className={CLS.PRIMARY}>
              {isGenerating ? <Loader2 className={CLS.SPIN_ICON} /> : <Wand2 className={CLS.BUTTON_ICON} />}
              <span>{isGenerating ? text.AI_CLIP_GENERATING : text.AI_CLIP_GENERATE}</span>
            </Button>
            {isGenerating && (
              <Button variant={VIDEO_EXPORT_TEXT_UNSTYLED} type={VIDEO_EXPORT_TEXT_BUTTON} disabled={job?.stopping} onClick={() => void aiClips.stop()} className={CLS.SECONDARY}>
                <Square className={CLS.BUTTON_ICON} />
                <span>{text.AI_CLIP_STOP}</span>
              </Button>
            )}
          </div>
          {job && <div className={CLS.STATUS}>{job.message}</div>}
          {job && !_.isEmpty(job.errors) && (
            <div className={CLS.ERROR_LIST}>
              {_.map(job.errors, (error, index) => (
                <div key={index} className={CLS.ERROR}>
                  {error}
                </div>
              ))}
            </div>
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
                {_.map(clips, (clip) => (
                  <div key={clip.id} className={CLS.CLIP}>
                    <video src={clip.url} muted loop autoPlay playsInline className={CLS.THUMB_MEDIA} />
                    <div className={CLS.CLIP_NAME}>{clip.name}</div>
                    {!isLocked && (
                      <Button variant={VIDEO_EXPORT_TEXT_UNSTYLED} type={VIDEO_EXPORT_TEXT_BUTTON} aria-label={text.AI_CLIP_REMOVE} onClick={() => aiClips.removeClip(clip.id)} className={CLS.THUMB_REMOVE}>
                        <X className={CLS.THUMB_REMOVE_ICON} />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <p className={CLS.LOOP_NOTE}>{clips.length === 1 ? text.AI_CLIP_LOOP_SINGLE : text.AI_CLIP_LOOP_MULTI}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
