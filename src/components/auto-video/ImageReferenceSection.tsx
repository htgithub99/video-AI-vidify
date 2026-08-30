import { cn } from "../../lib/utils";
import _ from "lodash";
import React, { useState } from "react";
import { Plus, Image as ImageIcon } from "lucide-react";
import { Tooltip } from "../ui/Tooltip";
import { REFACTOR_CONSTANTS } from "../../constants";
import { ReferenceImageCard } from "./ReferenceImageCard";
import { ImagePreviewModal } from "./ImagePreviewModal";
import { getAutoVideoTexts } from "./autoVideoGeneratorUtils";

export interface ImageReferenceSectionProps {
  referenceImages: string[];
  setReferenceImages: React.Dispatch<React.SetStateAction<string[]>>;
  handleReferenceFilesUpload: (files: FileList) => void;
  onDeleteImage?: (index: number) => void;
  T: ReturnType<typeof getAutoVideoTexts>;
}

export const ImageReferenceSection: React.FC<ImageReferenceSectionProps> = ({ referenceImages, setReferenceImages, handleReferenceFilesUpload, onDeleteImage, T }) => {
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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && !_.isEmpty(e.target.files)) {
      handleReferenceFilesUpload(e.target.files);
    }
  };

  const photoCountFn = _.get(T, "photoCount");
  const photoCountLabel = typeof photoCountFn === "function" ? photoCountFn(_.size(referenceImages)) : `${_.size(referenceImages)} ${_.get(T, "photos", "ảnh")}`;

  return (
    <div className={cn("space-y-2.5")}>
      <div className={cn("flex items-center justify-between")}>
        <div className={cn("flex items-center gap-1.5")}>
          <ImageIcon className={cn("w-3.5 h-3.5 text-sky-500 dark:text-sky-400")} />
          <span className={cn("text-xs font-bold text-slate-700 dark:text-slate-300")}>{T.sceneReferenceUploadTitle}</span>
          <span className={cn("text-[10px] text-slate-400 dark:text-slate-500 hidden sm:inline")}>({T.sceneReferenceUploadSub})</span>
        </div>
        <span className={cn("text-[10px] font-mono font-medium text-slate-400 dark:text-slate-500")}>{photoCountLabel}</span>
      </div>

      <div className={cn("flex flex-wrap items-center gap-2.5")} onDragOver={handleDragOver} onDrop={handleDrop}>
        <Tooltip content={T.sceneReferenceUploadSub} position="top">
          <label
            className={cn(
              "group relative flex flex-col items-center justify-center w-28 h-28 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-blue-500/80 dark:hover:border-blue-400 bg-white dark:bg-slate-900/60 hover:bg-blue-50/30 dark:hover:bg-blue-950/20 cursor-pointer transition-all duration-200 shadow-sm hover:shadow shrink-0",
            )}>
            <div
              className={cn(
                "w-8 h-8 rounded-xl bg-blue-500/10 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-1 transition-transform group-hover:scale-110",
              )}>
              <Plus className={cn("w-4 h-4")} />
            </div>
            <span className={cn("text-[11px] font-bold tracking-tight text-slate-700 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400")}>
              {T.addPhoto || T.sceneReferenceUploadTitle}
            </span>
            <span className={cn("text-[9px] font-medium text-slate-400 dark:text-slate-400")}>{T.uploadDragOrSelect}</span>
            <input type={REFACTOR_CONSTANTS.INPUT_TYPE_FILE} accept={REFACTOR_CONSTANTS.ACCEPT_IMAGE_ALL} multiple className={cn("hidden")} onChange={handleFileInputChange} />
          </label>
        </Tooltip>

        {_.map(referenceImages, (imgSrc, idx) => (
          <ReferenceImageCard
            key={idx}
            imageSrc={imgSrc}
            index={idx}
            badgePrefix={REFACTOR_CONSTANTS.HASH_PREFIX}
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
