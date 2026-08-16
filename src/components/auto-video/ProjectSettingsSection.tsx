import React, { useState } from "react";
import _ from "lodash";
import { ChevronDown, ImageIcon, Layout, Music, Plus, Trash2, Volume2 } from "lucide-react";
import { Tooltip } from "../ui/Tooltip";
import { REFACTOR_CONSTANTS } from "../../constants";
import { BackgroundMode, ImageFocusMode, ThumbnailTextMode } from "../../types";
import { BackgroundModeSelect } from "./BackgroundModeSelect";
import { ThumbnailTextModeSelect } from "./ThumbnailTextModeSelect";
import { ImageFocusModeSelect } from "./ImageFocusModeSelect";
import { AppLanguage, PIPELINE_STEPS } from "../../constants/enums";
import { ReferenceImageCard } from "./ReferenceImageCard";
import { ImagePreviewModal } from "./ImagePreviewModal";

interface ProjectSettingsSectionProps {
  projectName: string;
  setProjectName: (val: string) => void;
  thumbnailCount: number;
  setThumbnailCount: (val: number) => void;
  thumbnailReferenceImages: string[];
  setThumbnailReferenceImages: React.Dispatch<React.SetStateAction<string[]>>;
  handleThumbnailReferenceFilesUpload: (files: FileList) => void;
  onDeleteThumbnailImage?: (index: number) => void;
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
  thumbnailReferenceImages,
  setThumbnailReferenceImages,
  handleThumbnailReferenceFilesUpload,
  onDeleteThumbnailImage,
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

  const handleRemoveImage = (targetIndex: number) => {
    if (onDeleteThumbnailImage) {
      onDeleteThumbnailImage(targetIndex);
      return;
    }
    setThumbnailReferenceImages((prev) => _.filter(prev, (_v, i) => !_.isEqual(i, targetIndex)));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!_.isEmpty(e.dataTransfer.files)) {
      handleThumbnailReferenceFilesUpload(e.dataTransfer.files);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="w-6 h-6 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center font-mono font-bold text-xs">
          {PIPELINE_STEPS.STEP_4}
        </span>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 font-mono flex items-center gap-1.5" title={T.sec4TitleTooltip}>
          <ImageIcon className="w-3.5 h-3.5 text-purple-400" /> {T.sec4Title}
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
        <div className="space-y-1">
          <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block">{T.lblProjectName}</span>
          <input
            type={REFACTOR_CONSTANTS.INPUT_TYPE_TEXT}
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder={REFACTOR_CONSTANTS.PROJECT_NAME_PLACEHOLDER}
            className="w-full bg-slate-955 border border-slate-800 focus:border-purple-500/80 text-slate-200 p-2 rounded-xl text-xs outline-none transition-colors"
          />
        </div>

        <BackgroundModeSelect value={backgroundMode} onChange={setBackgroundMode} language={language} label={T.thumbnailBgModeLabel} />
        <ThumbnailTextModeSelect value={textInImageMode} onChange={setTextInImageMode} language={language} label={T.thumbnailTextModeLabel} />
        <ImageFocusModeSelect value={imageFocusMode} onChange={setImageFocusMode} language={language} label={T.thumbnailFocusModeLabel} />

        <div className="space-y-1">
          <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block">{T.lblThumbCount}</span>
          <div className="relative flex items-center bg-slate-955 border border-slate-800 rounded-xl px-2.5 py-2 focus-within:border-purple-500/50 transition-colors">
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start pt-1">
        <div className="lg:col-span-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Music className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {T.musicOptionalLabel || T.musicUploadLabel}
              </span>
            </div>
            {musicAssetUrl && onRemoveMusic && (
              <button
                type="button"
                onClick={onRemoveMusic}
                title={T.musicRemoveTooltip}
                className="text-[10px] text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 flex items-center gap-1 transition-colors font-medium"
              >
                <Trash2 className="w-3 h-3" />
                <span>{T.removeBtn}</span>
              </button>
            )}
          </div>

          {musicAssetUrl ? (
            <div className="space-y-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 shadow-sm">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-purple-500 dark:text-purple-400 shrink-0" />
                <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 truncate">
                  {T.musicLoaded}
                </span>
              </div>
              <audio controls src={musicAssetUrl} className="w-full h-7 rounded" />
            </div>
          ) : (
            <Tooltip content={T.musicUploadTooltip} position="top" className="w-full block">
              <label className="w-full h-24 sm:h-28 flex flex-col items-center justify-center p-3 cursor-pointer rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-800 hover:border-purple-500 dark:hover:border-purple-500/80 bg-slate-50/50 dark:bg-slate-900/20 hover:bg-purple-50/40 dark:hover:bg-purple-950/20 text-slate-400 hover:text-purple-500 dark:hover:text-purple-400 transition-all shadow-sm">
                <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800/60 mb-1 border border-slate-200 dark:border-slate-700/50">
                  <Music className="h-4 w-4 text-slate-500 dark:text-slate-400 group-hover:text-purple-500" />
                </div>
                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">
                  {T.musicUploadLabel}
                </span>
                <span className="text-[8px] text-slate-400 dark:text-slate-500 text-center">
                  {T.musicUploadSub}
                </span>
                <input
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={(event) => event.target.files && onMusicUpload(event.target.files)}
                />
              </label>
            </Tooltip>
          )}
        </div>

        <div className="lg:col-span-8 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {T.thumbSceneReferenceUploadTitle}
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 hidden sm:inline">
                ({T.thumbSceneReferenceUploadSub})
              </span>
            </div>
            <span className="text-[10px] font-mono font-medium text-slate-400 dark:text-slate-500">
              {T.photoCount ? T.photoCount(thumbnailReferenceImages.length) : `${thumbnailReferenceImages.length} ảnh`}
            </span>
          </div>

          <div
            className="flex flex-wrap items-center gap-2.5"
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDrop={handleDrop}
          >
            <Tooltip content={T.thumbSceneReferenceUploadSub} position="top">
              <label className="group relative flex flex-col items-center justify-center w-24 h-24 sm:w-28 sm:h-28 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-800 hover:border-purple-500 dark:hover:border-purple-500/80 bg-slate-50/50 dark:bg-slate-900/20 hover:bg-purple-50/40 dark:hover:bg-purple-950/20 text-slate-400 hover:text-purple-500 dark:hover:text-purple-400 cursor-pointer transition-all duration-200 shadow-sm shrink-0">
                <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800/60 group-hover:bg-purple-500/10 group-hover:scale-110 transition-all mb-1 border border-slate-200 dark:border-slate-700/50 group-hover:border-purple-500/30">
                  <Plus className="w-4 h-4 text-slate-500 dark:text-slate-400 group-hover:text-purple-500 dark:group-hover:text-purple-400" />
                </div>
                <span className="text-[10px] font-bold tracking-tight text-slate-600 dark:text-slate-300 group-hover:text-purple-600 dark:group-hover:text-purple-400">
                  {T.addCoverPhoto || T.thumbSceneReferenceUploadTitle}
                </span>
                <span className="text-[8px] text-slate-400 dark:text-slate-500">{T.uploadDragOrSelect}</span>
                <input
                  type={REFACTOR_CONSTANTS.INPUT_TYPE_FILE}
                  accept={REFACTOR_CONSTANTS.ACCEPT_IMAGE_ALL}
                  multiple
                  className="hidden"
                  onChange={(e) => e.target.files && handleThumbnailReferenceFilesUpload(e.target.files)}
                />
              </label>
            </Tooltip>

            {_.map(thumbnailReferenceImages, (imgSrc, idx) => (
              <ReferenceImageCard
                key={idx}
                imageSrc={imgSrc}
                index={idx}
                badgePrefix="#"
                borderColorClass="hover:border-purple-500/80 dark:hover:border-purple-400/80"
                deleteTooltip={T.deleteThumbSceneReferenceTooltip || T.deleteCoverPhotoTooltip}
                previewTooltip={T.viewLargeImage}
                onPreview={setPreviewImage}
                onDelete={handleRemoveImage}
              />
            ))}
          </div>
        </div>
      </div>

      <ImagePreviewModal imageUrl={previewImage} onClose={() => setPreviewImage(null)} />
    </div>
  );
};
