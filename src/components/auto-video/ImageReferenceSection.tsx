import _ from "lodash";
import React, { useState } from "react";
import { Plus, Image as ImageIcon } from "lucide-react";
import { Tooltip } from "../ui/Tooltip";
import { REFACTOR_CONSTANTS } from "../../constants";
import { ReferenceImageCard } from "./ReferenceImageCard";
import { ImagePreviewModal } from "./ImagePreviewModal";

export interface ImageReferenceSectionProps {
  referenceImages: string[];
  setReferenceImages: React.Dispatch<React.SetStateAction<string[]>>;
  handleReferenceFilesUpload: (files: FileList) => void;
  onDeleteImage?: (index: number) => void;
  T: Record<string, any>;
}

export const ImageReferenceSection: React.FC<ImageReferenceSectionProps> = ({
  referenceImages,
  setReferenceImages,
  handleReferenceFilesUpload,
  onDeleteImage,
  T,
}) => {
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const handleRemoveImage = (targetIndex: number) => {
    if (onDeleteImage) {
      onDeleteImage(targetIndex);
      return;
    }
    setReferenceImages((prev) => _.filter(prev, (_item, index) => !_.isEqual(index, targetIndex)));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!_.isEmpty(e.dataTransfer.files)) {
      handleReferenceFilesUpload(e.dataTransfer.files);
    }
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
            {T.sceneReferenceUploadTitle}
          </span>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 hidden sm:inline">
            ({T.sceneReferenceUploadSub})
          </span>
        </div>
        <span className="text-[10px] font-mono font-medium text-slate-400 dark:text-slate-500">
          {T.photoCount ? T.photoCount(referenceImages.length) : `${referenceImages.length} ảnh`}
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
        <Tooltip content={T.sceneReferenceUploadSub} position="top">
          <label className="group relative flex flex-col items-center justify-center w-24 h-24 sm:w-28 sm:h-28 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-800 hover:border-sky-500 dark:hover:border-sky-500/80 bg-slate-50/50 dark:bg-slate-900/20 hover:bg-sky-50/40 dark:hover:bg-sky-950/20 text-slate-400 hover:text-sky-500 dark:hover:text-sky-400 cursor-pointer transition-all duration-200 shadow-sm shrink-0">
            <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800/60 group-hover:bg-sky-500/10 group-hover:scale-110 transition-all mb-1 border border-slate-200 dark:border-slate-700/50 group-hover:border-sky-500/30">
              <Plus className="w-4 h-4 text-slate-500 dark:text-slate-400 group-hover:text-sky-500 dark:group-hover:text-sky-400" />
            </div>
            <span className="text-[10px] font-bold tracking-tight text-slate-600 dark:text-slate-300 group-hover:text-sky-600 dark:group-hover:text-sky-400">
              {T.addPhoto || T.sceneReferenceUploadTitle}
            </span>
            <span className="text-[8px] text-slate-400 dark:text-slate-500">{T.uploadDragOrSelect}</span>
            <input
              type={REFACTOR_CONSTANTS.INPUT_TYPE_FILE}
              accept={REFACTOR_CONSTANTS.ACCEPT_IMAGE_ALL}
              multiple
              className="hidden"
              onChange={(e) => e.target.files && handleReferenceFilesUpload(e.target.files)}
            />
          </label>
        </Tooltip>

        {_.map(referenceImages, (imgSrc, idx) => (
          <ReferenceImageCard
            key={idx}
            imageSrc={imgSrc}
            index={idx}
            badgePrefix="#"
            borderColorClass="hover:border-sky-500/80 dark:hover:border-sky-400/80"
            deleteTooltip={T.deleteSceneReferenceTooltip || T.deletePhotoTooltip}
            previewTooltip={T.viewLargeImage}
            onPreview={setPreviewImage}
            onDelete={handleRemoveImage}
          />
        ))}
      </div>

      <ImagePreviewModal imageUrl={previewImage} onClose={() => setPreviewImage(null)} />
    </div>
  );
};
