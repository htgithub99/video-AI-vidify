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
  T: any;
  musicAssetUrl: string;
  onMusicUpload: (files: FileList) => void;
  onRemoveMusic?: () => void;
}

export const ProjectSettingsSection: React.FC<ProjectSettingsSectionProps> = ({
  projectName,
  setProjectName,
  thumbnailCount,
  setThumbnailCount,
  thumbnailStylePreset,
  setThumbnailStylePreset,
  backgroundMode,
  setBackgroundMode,
  textInImageMode,
  setTextInImageMode,
  imageFocusMode,
  setImageFocusMode,
  language,
  T,
  musicAssetUrl,
  onMusicUpload,
  onRemoveMusic,
}) => {
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const handleMusicInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      onMusicUpload(event.target.files);
    }
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-5 space-y-4 shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center font-mono font-extrabold text-xs shadow-sm shadow-purple-500/20">
            {PIPELINE_STEPS.STEP_4}
          </span>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-100 font-mono flex items-center gap-1.5" title={T.sec4TitleTooltip}>
            <ImageIcon className="w-3.5 h-3.5 text-purple-400" /> {T.sec4Title}
          </h3>
        </div>

        <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 bg-slate-955/80 border border-slate-800/80 px-2.5 py-1 rounded-full">
          <Layout className="w-3 h-3 text-purple-400" />
          <span className="font-semibold text-slate-300">{thumbnailCount} {T.lblThumbnails || "ảnh bìa"}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
        <div className="space-y-1">
          <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block">{T.lblProjectName}</span>
          <input
            type={REFACTOR_CONSTANTS.INPUT_TYPE_TEXT}
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder={REFACTOR_CONSTANTS.PROJECT_NAME_PLACEHOLDER}
            className="w-full bg-slate-955/90 border border-slate-800/90 focus:border-purple-500/80 text-slate-200 p-2.5 rounded-xl text-xs outline-none transition-colors"
          />
        </div>

        <BackgroundModeSelect value={backgroundMode} onChange={setBackgroundMode} language={language} label={T.thumbnailBgModeLabel} />
        <ThumbnailTextModeSelect value={textInImageMode} onChange={setTextInImageMode} language={language} label={T.thumbnailTextModeLabel} />
        <ImageFocusModeSelect value={imageFocusMode} onChange={setImageFocusMode} language={language} label={T.thumbnailFocusModeLabel} />

        <div className="space-y-1">
          <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block">{T.lblThumbCount}</span>
          <div className="relative flex items-center bg-slate-955/90 border border-slate-800/90 rounded-xl px-2.5 py-2.5 focus-within:border-purple-500/60 transition-colors">
            <Layout className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
            <select
              value={thumbnailCount}
              onChange={(e) => setThumbnailCount(Number(e.target.value))}
              className="flex-1 bg-transparent text-slate-200 text-xs font-semibold outline-none cursor-pointer appearance-none pr-5"
            >
              {_.map(REFACTOR_CONSTANTS.THUMBNAIL_COUNT_OPTIONS, (n) => (
                <option key={n} value={n} className="bg-slate-955 text-slate-300">
                  {T.thumbCountOption(n)}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 text-slate-500 w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      <div className="pt-2 border-t border-slate-800/80">
        <StylePresetSelector
          selectedStyle={thumbnailStylePreset}
          onSelectStyle={setThumbnailStylePreset}
          language={language}
          label="Phong cách ảnh bìa"
          accentColor="purple"
        />
      </div>

      <div className="pt-2 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Music className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-xs font-bold text-slate-200">
              {T.musicOptionalLabel || T.musicUploadLabel}
            </span>
          </div>

          {!_.isEmpty(musicAssetUrl) && onRemoveMusic && (
            <button
              type={REFACTOR_CONSTANTS.BUTTON_TYPE_BUTTON}
              onClick={onRemoveMusic}
              className="flex items-center gap-1 text-[11px] font-mono text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              <span>{T.removeBtn}</span>
            </button>
          )}
        </div>

        {musicAssetUrl ? (
          <div className="flex items-center gap-3 bg-purple-50 border border-purple-200 rounded-xl p-2 shadow-xs">
            <Volume2 className="w-4 h-4 text-purple-600 shrink-0" />
            <audio controls src={musicAssetUrl} className="flex-1 h-7 rounded" />
          </div>
        ) : (
          <label className="flex items-center justify-center gap-2 p-2.5 cursor-pointer rounded-xl border border-dashed border-purple-300 hover:border-purple-500 bg-purple-50/60 hover:bg-purple-100/70 transition-colors shadow-xs">
            <Music className="w-3.5 h-3.5 text-purple-600 shrink-0" />
            <span className="text-xs font-bold text-purple-700">
              {T.musicUploadLabel || "Tải lên file nhạc nền (MP3, WAV...)"}
            </span>
            <input
              type={REFACTOR_CONSTANTS.INPUT_TYPE_FILE}
              accept={REFACTOR_CONSTANTS.ACCEPT_AUDIO_ALL}
              className="hidden"
              onChange={handleMusicInputChange}
            />
          </label>
        )}
      </div>

      <ImagePreviewModal imageUrl={previewImage} onClose={() => setPreviewImage(null)} />
    </div>
  );
};
