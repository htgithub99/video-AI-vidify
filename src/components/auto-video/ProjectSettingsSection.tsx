import { cn } from "../../lib/utils";
import React, { useState } from "react";
import _ from "lodash";
import { ChevronDown, ImageIcon, Layout, Music, Trash2, Volume2 } from "lucide-react";
import { REFACTOR_CONSTANTS } from "../../constants";
import { BackgroundMode, ImageFocusMode, ThumbnailTextMode } from "../../types";
import { BackgroundModeSelect } from "./BackgroundModeSelect";
import { ThumbnailTextModeSelect } from "./ThumbnailTextModeSelect";
import { ImageFocusModeSelect } from "./ImageFocusModeSelect";
import { AppLanguage, PIPELINE_STEPS } from "../../constants/enums";
import { ImagePreviewModal } from "./ImagePreviewModal";
import { StylePresetSelector } from "./StylePresetSelector";
import { AUTO_VIDEO_UI_TEXTS } from "../../constants/texts";
import { getAutoVideoTexts } from "./autoVideoGeneratorUtils";

interface ProjectSettingsSectionProps {
  projectName: string;
  setProjectName: (val: string) => void;
  thumbnailCount: number;
  setThumbnailCount: (val: number) => void;
  thumbnailStylePreset: string;
  setThumbnailStylePreset: (val: string) => void;
  backgroundMode: BackgroundMode;
  setBackgroundMode: (value: BackgroundMode) => void;
  textInImageMode: ThumbnailTextMode;
  setTextInImageMode: (value: ThumbnailTextMode) => void;
  imageFocusMode: ImageFocusMode;
  setImageFocusMode: (value: ImageFocusMode) => void;
  language: AppLanguage;
  T: ReturnType<typeof getAutoVideoTexts>;
  musicAssetUrl: string;
  onMusicUpload: (files: FileList) => void;
  onRemoveMusic?: () => void;
  genre: string;
  allowedStylePresetIds?: readonly string[];
}

export const ProjectSettingsSection: React.FC<ProjectSettingsSectionProps> = ({ projectName, setProjectName, thumbnailCount, setThumbnailCount, thumbnailStylePreset, setThumbnailStylePreset, backgroundMode, setBackgroundMode, textInImageMode, setTextInImageMode, imageFocusMode, setImageFocusMode, language, T, musicAssetUrl, onMusicUpload, onRemoveMusic, genre, allowedStylePresetIds }) => {
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const uiTexts = _.get(AUTO_VIDEO_UI_TEXTS, language, AUTO_VIDEO_UI_TEXTS.vi);

  const handleMusicInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && !_.isEmpty(event.target.files)) {
      onMusicUpload(event.target.files);
    }
  };

  return (
    <div className={cn("bg-slate-900/60 border border-slate-800/80 rounded-3xl p-5 space-y-4 shadow-xl backdrop-blur-md")}>
      <div className={cn("flex items-center justify-between")}>
        <div className={cn("flex items-center gap-2")}>
          <span className={cn("w-6 h-6 rounded-lg bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center font-mono font-extrabold text-xs shadow-sm shadow-purple-500/20")}>{PIPELINE_STEPS.STEP_4}</span>
          <h3 className={cn("text-xs font-bold uppercase tracking-wider text-slate-100 font-mono flex items-center gap-1.5")} title={T.sec4TitleTooltip}>
            <ImageIcon className={cn("w-3.5 h-3.5 text-purple-400")} /> {T.sec4Title}
          </h3>
        </div>

        <div className={cn("flex items-center gap-2 text-[10px] font-mono text-slate-400 bg-slate-955/80 border border-slate-800/80 px-2.5 py-1 rounded-full")}>
          <Layout className={cn("w-3 h-3 text-purple-400")} />
          <span className={cn("font-semibold text-slate-300")}>
            {thumbnailCount} {_.get(T, "lblThumbnails", uiTexts.thumbnailsUnit)}
          </span>
        </div>
      </div>

      <div className={cn("grid grid-cols-1 sm:grid-cols-5 gap-3 items-end")}>
        <div className={cn("space-y-1")}>
          <span className={cn("text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block")}>{T.lblProjectName}</span>
          <input type={REFACTOR_CONSTANTS.INPUT_TYPE_TEXT} value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder={REFACTOR_CONSTANTS.PROJECT_NAME_PLACEHOLDER} className={cn("w-full bg-slate-955/90 border border-slate-800/90 focus:border-purple-500/80 text-slate-200 p-2.5 rounded-xl text-xs outline-none transition-colors")} />
        </div>

        <BackgroundModeSelect value={backgroundMode} onChange={setBackgroundMode} language={language} label={T.thumbnailBgModeLabel} />
        <ThumbnailTextModeSelect value={textInImageMode} onChange={setTextInImageMode} language={language} label={T.thumbnailTextModeLabel} />
        <ImageFocusModeSelect value={imageFocusMode} onChange={setImageFocusMode} language={language} label={T.thumbnailFocusModeLabel} />

        <div className={cn("space-y-1")}>
          <span className={cn("text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block")}>{T.lblThumbCount}</span>
          <div className={cn("relative flex items-center bg-slate-955/90 border border-slate-800/90 rounded-xl px-2.5 py-2.5 focus-within:border-purple-500/60 transition-colors")}>
            <Layout className={cn("w-3.5 h-3.5 text-slate-400 mr-2 shrink-0")} />
            <select value={thumbnailCount} onChange={(e) => setThumbnailCount(Number(e.target.value))} className={cn("flex-1 bg-transparent text-slate-200 text-xs font-semibold outline-none cursor-pointer appearance-none pr-5")}>
              {_.map(REFACTOR_CONSTANTS.THUMBNAIL_COUNT_OPTIONS, (n) => (
                <option key={n} value={n} className={cn("bg-slate-955 text-slate-300")}>
                  {T.thumbCountOption(n)}
                </option>
              ))}
            </select>
            <ChevronDown className={cn("pointer-events-none absolute right-2 text-slate-500 w-3.5 h-3.5")} />
          </div>
        </div>
      </div>

      <div className={cn("pt-2 border-t border-slate-800/80")}>
        <StylePresetSelector selectedStyle={thumbnailStylePreset} onSelectStyle={setThumbnailStylePreset} language={language} label={uiTexts.thumbnailStylePresetLabel} accentColor="purple" genre={genre} allowedPresetIds={allowedStylePresetIds} />
      </div>

      <div className={cn("pt-2 space-y-2")}>
        <div className={cn("flex items-center justify-between")}>
          <div className={cn("flex items-center gap-1.5")}>
            <Music className={cn("w-3.5 h-3.5 text-purple-400")} />
            <span className={cn("text-xs font-bold text-slate-200")}>{T.musicOptionalLabel || T.musicUploadLabel}</span>
          </div>

          {!_.isEmpty(musicAssetUrl) && onRemoveMusic && (
            <button type={REFACTOR_CONSTANTS.BUTTON_TYPE_BUTTON} onClick={onRemoveMusic} className={cn("flex items-center gap-1 text-[11px] font-mono text-rose-400 hover:text-rose-300 transition-colors cursor-pointer")}>
              <Trash2 className={cn("w-3 h-3")} />
              <span>{T.removeBtn}</span>
            </button>
          )}
        </div>

        {musicAssetUrl ? (
          <div className={cn("flex items-center gap-3 bg-purple-50 border border-purple-200 rounded-xl p-2 shadow-xs")}>
            <Volume2 className={cn("w-4 h-4 text-purple-600 shrink-0")} />
            <audio controls src={musicAssetUrl} className={cn("flex-1 h-7 rounded")} />
          </div>
        ) : (
          <label className={cn("flex items-center justify-center gap-2 p-2.5 cursor-pointer rounded-xl border border-dashed border-purple-300 hover:border-purple-500 bg-purple-50/60 hover:bg-purple-100/70 transition-colors shadow-xs")}>
            <Music className={cn("w-3.5 h-3.5 text-purple-600 shrink-0")} />
            <span className={cn("text-xs font-bold text-purple-700")}>{T.musicUploadLabel || uiTexts.musicUploadPlaceholder}</span>
            <input type={REFACTOR_CONSTANTS.INPUT_TYPE_FILE} accept={REFACTOR_CONSTANTS.ACCEPT_AUDIO_ALL} className={cn("hidden")} onChange={handleMusicInputChange} />
          </label>
        )}
      </div>

      <ImagePreviewModal imageUrl={previewImage} onClose={() => setPreviewImage(null)} />
    </div>
  );
};
