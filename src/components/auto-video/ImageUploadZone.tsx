import { cn } from "../../lib/utils";
import React from "react";
import _ from "lodash";
import { Upload, X } from "lucide-react";
import { REFACTOR_CONSTANTS } from "../../constants";
import { Button } from "../ui/Button";

export interface ImageUploadZoneProps {
  onUpload: (files: FileList) => void;
  hoverColor: string;
  title: string;
  subtitle: string;
  uploadClass?: string;
  inputClass?: string;
  contentClass?: string;
  iconBoxClass?: string;
  iconClass?: string;
  titleClass?: string;
  subtitleClass?: string;
  hideSubtitle?: boolean;
}

export function ImageUploadZone({
  onUpload,
  hoverColor,
  title,
  subtitle,
  uploadClass,
  inputClass,
  contentClass,
  iconBoxClass,
  iconClass,
  titleClass,
  subtitleClass,
  hideSubtitle,
}: ImageUploadZoneProps) {
  const defaultUploadClass = `bg-slate-955/20 !border-2 !border-dashed !border-slate-700/80 hover:!border-${hoverColor}-500/80 hover:bg-slate-900/30 rounded-xl transition-all duration-200 relative group cursor-pointer w-full aspect-square overflow-hidden`;

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!_.isEmpty(event.dataTransfer.files)) {
      onUpload(event.dataTransfer.files);
    }
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && !_.isEmpty(event.target.files)) {
      onUpload(event.target.files);
    }
    event.target.value = REFACTOR_CONSTANTS.VD_EMPTY_STRING;
  };

  return (
    <div
      className={uploadClass || defaultUploadClass}
      onDragOver={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
      onDrop={handleDrop}>
      <input
        type={REFACTOR_CONSTANTS.INPUT_TYPE_FILE}
        accept={REFACTOR_CONSTANTS.ACCEPT_IMAGE_ALL}
        multiple
        onChange={handleChange}
        className={inputClass || "absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"}
      />
      <div className={contentClass || "absolute inset-0 flex flex-col items-center justify-center p-2 text-center"}>
        <div
          className={
            iconBoxClass ||
            `p-2 bg-slate-955 rounded-lg border border-slate-800 group-hover:scale-110 group-hover:border-${hoverColor}-500/30 transition-all duration-300 mb-1.5 shadow-lg`
          }>
          <Upload className={iconClass || `w-4 h-4 text-slate-400 group-hover:text-${hoverColor}-400 transition-colors`} />
        </div>
        <span className={titleClass || `text-[10px] font-bold text-slate-200 block mb-0.5 truncate max-w-full group-hover:text-${hoverColor}-400 transition-colors`}>{title}</span>
        {!hideSubtitle && <span className={subtitleClass || "text-[8px] text-slate-505 leading-tight block truncate max-w-full"}>{subtitle}</span>}
      </div>
    </div>
  );
}

interface ImageDeleteOverlayProps {
  onDelete: () => void;
  tooltip: string;
}

export function ImageDeleteOverlay({ onDelete, tooltip }: ImageDeleteOverlayProps) {
  return (
    <div className={cn("absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex justify-end items-start p-1.5")}>
      <Button
        type={REFACTOR_CONSTANTS.BUTTON_TYPE_BUTTON}
        variant={REFACTOR_CONSTANTS.VARIANT_UNSTYLED}
        onClick={onDelete}
        className={cn(
          "w-5 h-5 bg-rose-600/90 hover:bg-rose-500 hover:scale-110 rounded-full flex items-center justify-center text-white shadow-md transition-all duration-200 p-0 border border-white/20 cursor-pointer",
        )}
        title={tooltip}>
        <X className={cn("w-3 h-3")} />
      </Button>
    </div>
  );
}
