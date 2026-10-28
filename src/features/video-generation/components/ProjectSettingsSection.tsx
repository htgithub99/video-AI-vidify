import { RUNTIME_TEXT as RT_VIDEO_GENERATION } from "../constants/runtimeText.js";
import { RUNTIME_TEXT as RT_SHARED } from "../../../constants/runtime/shared.js";
import { StudioCard, StudioInput, StudioSelect } from "../../../components/ui/Studio.js";
import { SOURCE_TEXT_LBLTHUMBNAILS, SOURCE_TEXT_PURPLE, SOURCE_TEXT_UNSTYLED } from "../../../constants/sourceText";
import { cn } from "../../../lib/utils";
import React, { useState } from "react";
import _ from "lodash";
import { ChevronDown, ImageIcon, Layout, Music, Trash2, Volume2 } from "lucide-react";
import { REFACTOR_CONSTANTS } from "../../../constants";
import { BackgroundMode, ImageFocusMode, SubtitleMode, ThumbnailTextMode } from "../../../types";
import { BackgroundModeSelect } from "./BackgroundModeSelect";
import { ThumbnailTextModeSelect } from "./ThumbnailTextModeSelect";
import { ImageFocusModeSelect } from "./ImageFocusModeSelect";
import { AppLanguage, PIPELINE_STEPS } from "../../../constants/enums";
import { ImagePreviewModal } from "../../../components/common/ImagePreviewModal";
import { StylePresetSelector } from "./StylePresetSelector";
import { AUTO_VIDEO_UI_TEXTS } from "../../../constants/texts";
import { getAutoVideoTexts } from "./autoVideoGeneratorUtils";
import { Button } from "../../../components/ui/Button";
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
  subtitleMode?: SubtitleMode;
  setSubtitleMode?: (value: SubtitleMode) => void;
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
  genre,
  allowedStylePresetIds,
  subtitleMode,
  setSubtitleMode,
}) => {
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const uiTexts = _.get(AUTO_VIDEO_UI_TEXTS, language, AUTO_VIDEO_UI_TEXTS.vi);
  const handleMusicInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && !_.isEmpty(event.target.files)) {
      onMusicUpload(event.target.files);
    }
  };
  return (
    <StudioCard className={cn(RT_VIDEO_GENERATION.BG_SLATE_900_60_BORDER_BORDER_SLATE_800_80_ROUNDED)}>
      <div className={cn(RT_SHARED.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN)}>
        <div className={cn(RT_SHARED.FLEX_ITEMS_CENTER_GAP_2)}>
          <span className={cn(RT_VIDEO_GENERATION.W_6_H_6_ROUNDED_LG_BG_PURPLE_500_15_1E2B1F)}>{subtitleMode ? 3 : PIPELINE_STEPS.STEP_4}</span>
          <h3 className={cn(RT_SHARED.TEXT_XS_FONT_BOLD_UPPERCASE_TRACKING_WIDER_TEXT_SLATE_100)} title={T.sec4TitleTooltip}>
            <ImageIcon className={cn(RT_SHARED.W_3_5_H_3_5_TEXT_PURPLE_400)} /> {subtitleMode ? T.subtitleSectionTitle : T.sec4Title}
          </h3>
        </div>
        <div className={cn(RT_VIDEO_GENERATION.FLEX_ITEMS_CENTER_GAP_2_TEXT_10PX_FONT_MONO_TEXT)}>
          <Layout className={cn(RT_SHARED.W_3_H_3_TEXT_PURPLE_400)} />
          <span className={cn(RT_VIDEO_GENERATION.FONT_SEMIBOLD_TEXT_SLATE_300)}>
            {thumbnailCount} {_.get(T, SOURCE_TEXT_LBLTHUMBNAILS, uiTexts.thumbnailsUnit)}
          </span>
        </div>
      </div>
      <div className={cn(RT_VIDEO_GENERATION.GRID_GRID_COLS_1_SM_GRID_COLS_2_MD_GRID_27CEBF)}>
        <div className={cn(RT_SHARED.SPACE_Y_1)}>
          <span className={cn(RT_VIDEO_GENERATION.TEXT_10PX_TEXT_SLATE_400_FONT_MONO_FONT_BOLD_UPPERCASE)}>{T.lblProjectName}</span>
          <StudioInput type={REFACTOR_CONSTANTS.INPUT_TYPE_TEXT} value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder={REFACTOR_CONSTANTS.PROJECT_NAME_PLACEHOLDER} className={cn(RT_VIDEO_GENERATION.W_FULL_H_10_BG_SLATE_955_90_BORDER_BORDER)} />
        </div>
        {!_.isUndefined(subtitleMode) && setSubtitleMode && (
          <div className={cn(RT_SHARED.SPACE_Y_1)}>
            <span className={cn(RT_VIDEO_GENERATION.TEXT_10PX_TEXT_SLATE_400_FONT_MONO_FONT_BOLD_UPPERCASE)}>{T.subtitleFieldLabel}</span>
            <div className={cn(RT_VIDEO_GENERATION.RELATIVE_FLEX_ITEMS_CENTER_BG_SLATE_955_90_BORDER_BORDER)}>
              <StudioSelect value={subtitleMode} onChange={(event) => setSubtitleMode(event.target.value as SubtitleMode)} className={cn(RT_VIDEO_GENERATION.FLEX_1_BG_TRANSPARENT_TEXT_SLATE_200_TEXT_XS_FONT)}>
                <option value={SubtitleMode.None}>{T.subtitleNone}</option>
                <option value={SubtitleMode.BurnIn}>{T.subtitleBurnIn}</option>
                <option value={SubtitleMode.Track}>{T.subtitleTrack}</option>
                <option value={SubtitleMode.Both}>{T.subtitleBoth}</option>
              </StudioSelect>
              <ChevronDown className={cn(RT_VIDEO_GENERATION.POINTER_EVENTS_NONE_ABSOLUTE_RIGHT_2_TEXT_SLATE_500_W)} />
            </div>
          </div>
        )}
        <BackgroundModeSelect value={backgroundMode} onChange={setBackgroundMode} language={language} label={T.thumbnailBgModeLabel} />
        <ThumbnailTextModeSelect value={textInImageMode} onChange={setTextInImageMode} language={language} label={T.thumbnailTextModeLabel} />
        <ImageFocusModeSelect value={imageFocusMode} onChange={setImageFocusMode} language={language} label={T.thumbnailFocusModeLabel} />
        <div className={cn(RT_SHARED.SPACE_Y_1)}>
          <span className={cn(RT_VIDEO_GENERATION.TEXT_10PX_TEXT_SLATE_400_FONT_MONO_FONT_BOLD_UPPERCASE)}>{T.lblThumbCount}</span>
          <div className={cn(RT_VIDEO_GENERATION.RELATIVE_FLEX_ITEMS_CENTER_BG_SLATE_955_90_BORDER_BORDER_3CD303)}>
            <Layout className={cn(RT_VIDEO_GENERATION.W_3_5_H_3_5_TEXT_SLATE_400_MR)} />
            <StudioSelect value={thumbnailCount} onChange={(e) => setThumbnailCount(Number(e.target.value))} className={cn(RT_VIDEO_GENERATION.FLEX_1_BG_TRANSPARENT_TEXT_SLATE_200_TEXT_XS_FONT)}>
              {_.map(REFACTOR_CONSTANTS.THUMBNAIL_COUNT_OPTIONS, (n) => (
                <option key={n} value={n} className={cn(RT_VIDEO_GENERATION.BG_SLATE_955_TEXT_SLATE_300)}>
                  {T.thumbCountOption(n)}
                </option>
              ))}
            </StudioSelect>
            <ChevronDown className={cn(RT_VIDEO_GENERATION.POINTER_EVENTS_NONE_ABSOLUTE_RIGHT_2_TEXT_SLATE_500_W)} />
          </div>
        </div>
      </div>
      <div className={cn(RT_VIDEO_GENERATION.PT_2_BORDER_T_BORDER_SLATE_800_80)}>
        <StylePresetSelector selectedStyle={thumbnailStylePreset} onSelectStyle={setThumbnailStylePreset} language={language} label={uiTexts.thumbnailStylePresetLabel} accentColor={SOURCE_TEXT_PURPLE} genre={genre} allowedPresetIds={allowedStylePresetIds} />
      </div>
      <div className={cn(RT_VIDEO_GENERATION.PT_2_SPACE_Y_2)}>
        <div className={cn(RT_SHARED.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN)}>
          <div className={cn(RT_SHARED.FLEX_ITEMS_CENTER_GAP_1_5)}>
            <Music className={cn(RT_SHARED.W_3_5_H_3_5_TEXT_PURPLE_400)} />
            <span className={cn(RT_SHARED.TEXT_XS_FONT_BOLD_TEXT_SLATE_200)}>{T.musicOptionalLabel || T.musicUploadLabel}</span>
          </div>
          {!_.isEmpty(musicAssetUrl) && onRemoveMusic && (
            <Button variant={SOURCE_TEXT_UNSTYLED} type={REFACTOR_CONSTANTS.BUTTON_TYPE_BUTTON} onClick={onRemoveMusic} className={cn(RT_VIDEO_GENERATION.FLEX_ITEMS_CENTER_GAP_1_TEXT_11PX_FONT_MONO_TEXT)}>
              <Trash2 className={cn(RT_SHARED.W_3_H_3)} />
              <span>{T.removeBtn}</span>
            </Button>
          )}
        </div>
        {musicAssetUrl ? (
          <div className={cn(RT_VIDEO_GENERATION.FLEX_ITEMS_CENTER_GAP_3_BG_PURPLE_50_BORDER_BORDER)}>
            <Volume2 className={cn(RT_VIDEO_GENERATION.W_4_H_4_TEXT_PURPLE_600_SHRINK_0)} />
            <audio controls src={musicAssetUrl} className={cn(RT_VIDEO_GENERATION.FLEX_1_H_7_ROUNDED)} />
          </div>
        ) : (
          <label className={cn(RT_VIDEO_GENERATION.FLEX_ITEMS_CENTER_JUSTIFY_CENTER_GAP_2_PX_3_H)}>
            <Music className={cn(RT_VIDEO_GENERATION.W_3_5_H_3_5_TEXT_PURPLE_600_SHRINK)} />
            <span className={cn(RT_VIDEO_GENERATION.TEXT_XS_FONT_BOLD_TEXT_PURPLE_700)}>{T.musicUploadLabel || uiTexts.musicUploadPlaceholder}</span>
            <StudioInput type={REFACTOR_CONSTANTS.INPUT_TYPE_FILE} accept={REFACTOR_CONSTANTS.ACCEPT_AUDIO_ALL} className={cn(RT_SHARED.HIDDEN)} onChange={handleMusicInputChange} />
          </label>
        )}
      </div>
      <ImagePreviewModal imageUrl={previewImage} onClose={() => setPreviewImage(null)} />
    </StudioCard>
  );
};
