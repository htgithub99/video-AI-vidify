import _ from "lodash";
import { ChevronDown, ImageIcon, Layout } from "lucide-react";
import { Tooltip } from "../ui/Tooltip";
import { ImageDeleteOverlay, ImageUploadZone } from "./ImageUploadZone";
import { REFACTOR_CONSTANTS } from "../../constants";
import { BackgroundMode, ImageFocusMode, TextInImageMode } from "../../types";
import { BackgroundModeSelect } from "./BackgroundModeSelect";
import { TextInImageModeSelect } from "./TextInImageModeSelect";
import { ImageFocusModeSelect } from "./ImageFocusModeSelect";
import { AppLanguage, PIPELINE_STEPS } from "../../constants/enums";

interface ProjectSettingsSectionProps {
  projectName: string;
  setProjectName: (val: string) => void;
  thumbnailCount: number;
  setThumbnailCount: (val: number) => void;
  thumbnailReferenceImages: string[];
  setThumbnailReferenceImages: React.Dispatch<React.SetStateAction<string[]>>;
  handleThumbnailStyleFilesUpload: (files: FileList) => void;
  backgroundMode: BackgroundMode;
  setBackgroundMode: (value: BackgroundMode) => void;
  textInImageMode: TextInImageMode;
  setTextInImageMode: (value: TextInImageMode) => void;
  imageFocusMode: ImageFocusMode;
  setImageFocusMode: (value: ImageFocusMode) => void;
  language: AppLanguage;
  T: any;
}

export const ProjectSettingsSection: React.FC<ProjectSettingsSectionProps> = ({
  projectName,
  setProjectName,
  thumbnailCount,
  setThumbnailCount,
  thumbnailReferenceImages,
  setThumbnailReferenceImages,
  handleThumbnailStyleFilesUpload,
  backgroundMode,
  setBackgroundMode,
  textInImageMode,
  setTextInImageMode,
  imageFocusMode,
  setImageFocusMode,
  language,
  T,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="w-6 h-6 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center font-mono font-bold text-xs">{PIPELINE_STEPS.STEP_4}</span>
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
            className="w-full bg-slate-955 border border-slate-800 focus:border-rose-500/80 text-slate-200 p-2 rounded-xl text-xs outline-none"
          />
        </div>

        <BackgroundModeSelect value={backgroundMode} onChange={setBackgroundMode} language={language} label={T.thumbnailBgModeLabel} />
        <TextInImageModeSelect value={textInImageMode} onChange={setTextInImageMode} language={language} label={T.thumbnailTextModeLabel} />
        <ImageFocusModeSelect value={imageFocusMode} onChange={setImageFocusMode} language={language} label={T.thumbnailFocusModeLabel} />

        <div className="space-y-1">
          <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block">{T.lblThumbCount}</span>
          <div className="relative flex items-center bg-slate-955 border border-slate-800 rounded-xl px-2.5 py-2">
            <Layout className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
            <select value={thumbnailCount} onChange={(e) => setThumbnailCount(Number(e.target.value))} className="flex-1 bg-transparent text-slate-200 text-xs font-semibold outline-none cursor-pointer appearance-none pr-5">
              {REFACTOR_CONSTANTS.THUMBNAIL_COUNT_OPTIONS.map((n) => <option key={n} value={n} className="bg-slate-955 text-slate-300">{T.thumbCountOption(n)}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 text-slate-500 w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
        <Tooltip content={T.thumbUploadSub} position="top" className="w-full block">
          <ImageUploadZone
            onUpload={handleThumbnailStyleFilesUpload}
            hoverColor="purple"
            title={T.thumbUploadTitle}
            subtitle={T.thumbUploadSub}
            hideSubtitle={true}
          />
        </Tooltip>
        {_.map(thumbnailReferenceImages, (imgBase64, idx) => (
          <div key={idx} className="relative w-full aspect-square rounded-xl group shadow-md overflow-hidden border border-slate-800/80 hover:border-purple-500/30 transition-colors">
            <img src={imgBase64} alt={`${REFACTOR_CONSTANTS.THUMB_REF_PREFIX}${idx + 1}`} className="w-full h-full object-cover rounded-xl" />
            <ImageDeleteOverlay onDelete={() => setThumbnailReferenceImages((prev) => _.filter(prev, (_v, i) => !_.isEqual(i, idx)))} tooltip={T.deleteThumbImgTooltip} />
          </div>
        ))}
      </div>
    </div>
  );
};
