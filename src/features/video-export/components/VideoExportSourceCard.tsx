import { RUNTIME_TEXT as RT_VIDEO_EXPORT } from "../constants/runtimeText.js";
import { RUNTIME_TEXT as RT_SHARED } from "../../../constants/runtime/shared.js";
import { StudioCard } from "../../../components/ui/Studio.js";
import { VideoExportSectionHeading } from "./VideoExportSectionHeading";
import {
  VIDEO_EXPORT_TEMPLATE_SYMBOL_5,
  VIDEO_EXPORT_TEXT_BUTTON,
  VIDEO_EXPORT_TEXT_LAZY,
  VIDEO_EXPORT_TEXT_SYMBOL_4,
  VIDEO_EXPORT_TEXT_SYMBOL_5,
  VIDEO_EXPORT_TEXT_SYMBOL_6,
  VIDEO_EXPORT_TEXT_SYMBOL_7,
  VIDEO_EXPORT_TEXT_SYMBOL_8,
  VIDEO_EXPORT_TEXT_TEXT_AMBER_400,
  VIDEO_EXPORT_TEXT_TEXT_BLUE_400,
  VIDEO_EXPORT_TEXT_TEXT_PINK_400,
  VIDEO_EXPORT_TEXT_TEXT_PURPLE_400,
  VIDEO_EXPORT_TEXT_UNSTYLED,
  VIDEO_EXPORT_TEXT_VIDEO_EXPORT_AI_RANK,
  VIDEO_EXPORT_TEXT_VIDEO_EXPORT_AI_RANK_CANCEL,
  VIDEO_EXPORT_TEXT_VIDEO_EXPORT_AUDIO_SELECT_ALL,
  VIDEO_EXPORT_TEXT_VIDEO_EXPORT_CHANGE_FOLDER,
  VIDEO_EXPORT_TEXT_VIDEO_EXPORT_IMAGE_SELECT_ALL,
  VIDEO_EXPORT_TEXT_VIDEO_EXPORT_PICK_FOLDER,
  VIDEO_EXPORT_TEXT_VIDEO_EXPORT_TAB_AUDIO,
  VIDEO_EXPORT_TEXT_VIDEO_EXPORT_TAB_IMAGE,
} from "../../../constants/videoExportText";
import { FC, useEffect, useRef, useState } from "react";
import _ from "lodash";
import { ArrowDown, ArrowUp, Bot, CheckSquare, Clock, FolderOpen, HardDrive, ImageIcon, Music, Pause, Play, Sparkles, Square, Trophy, Upload, X } from "lucide-react";
import { Button } from "../../../components/ui/Button.js";
import { cn } from "../../../lib/utils.js";
import { formatCleanTime } from "../../../lib/timeUtils.js";
import { VideoExporterState } from "../hooks/useVideoExporter.js";
import { formatFileSize } from "./videoExportUtils.js";
import { VideoExportSourceTab } from "../types/videoExport.js";
type VideoExportSourceCardProps = {
  exporter: Pick<
    VideoExporterState,
    | "text"
    | "source"
    | "audios"
    | "images"
    | "selectedAudioIds"
    | "selectedImageIds"
    | "selectedAudios"
    | "selectedImages"
    | "totalAudioSeconds"
    | "totalAudioBytes"
    | "isScanning"
    | "sourceLoaded"
    | "savedFolderPath"
    | "isBusy"
    | "isRanking"
    | "sourceTab"
    | "setSourceTab"
    | "selectFolder"
    | "toggleAudio"
    | "toggleImage"
    | "setAllAudiosSelected"
    | "setAllImagesSelected"
    | "moveAudio"
    | "rankWithAi"
    | "cancelRanking"
  >;
};
const StatTile: FC<{ icon: typeof Clock; iconClassName: string; label: string; value: string }> = ({ icon: Icon, iconClassName, label, value }) => (
  <div className={cn(RT_VIDEO_EXPORT.BG_SLATE_950_60_BORDER_BORDER_SLATE_800_ROUNDED_XL)}>
    <Icon className={cn(RT_SHARED.W_4_H_4_SHRINK_0, iconClassName)} />
    <div className={cn(RT_SHARED.MIN_W_0)}>
      <div className={cn(RT_VIDEO_EXPORT.TEXT_10PX_TEXT_SLATE_400_FONT_MONO_UPPERCASE_TRUNCATE)}>{label}</div>
      <div className={cn(RT_SHARED.TEXT_XS_FONT_BOLD_TEXT_SLATE_200_TRUNCATE)}>{value}</div>
    </div>
  </div>
);
export const VideoExportSourceCard: FC<VideoExportSourceCardProps> = ({ exporter }) => {
  const { text, source, audios, images, selectedAudioIds, selectedImageIds, selectedAudios, selectedImages, totalAudioSeconds, totalAudioBytes, isScanning, sourceLoaded, savedFolderPath, isBusy, isRanking, sourceTab, setSourceTab } = exporter;
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasSource = Boolean(source);
  const isRestoring = !hasSource && (!sourceLoaded || isScanning) && Boolean(savedFolderPath);
  const isAllAudioSelected = !_.isEmpty(audios) && selectedAudioIds.length === audios.length;
  const isAllImageSelected = !_.isEmpty(images) && selectedImageIds.length === images.length;
  useEffect(() => {
    audioRef.current?.pause();
    setPlayingId(null);
  }, [source?.token]);
  useEffect(() => () => audioRef.current?.pause(), []);
  const togglePlay = (id: string, url: string) => {
    const player = audioRef.current;
    if (!player) return;
    if (playingId === id) {
      player.pause();
      setPlayingId(null);
      return;
    }
    player.src = url;
    player.play().then(
      () => setPlayingId(id),
      () => setPlayingId(null),
    );
  };
  const tabButtonClassName = (tab: VideoExportSourceTab) => cn(RT_VIDEO_EXPORT.FLEX_1_H_9_ROUNDED_XL_TEXT_XS_FONT_BOLD, { "bg-purple-500/15 border-purple-500/40 text-purple-300 shadow-sm shadow-purple-500/10": sourceTab === tab, "bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700": sourceTab !== tab });
  return (
    <StudioCard className={cn(RT_VIDEO_EXPORT.GLASS_CARD_ROUNDED_2XL_SM_ROUNDED_3XL_P_5_SPACE)}>
      <audio ref={audioRef} className={cn(RT_SHARED.HIDDEN)} onEnded={() => setPlayingId(null)} onError={() => setPlayingId(null)} />
      <div className={cn(RT_SHARED.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN_RELATIVE_Z_10_FLEX_WRAP)}>
        <VideoExportSectionHeading step={text.STEP_01} title={text.SOURCE_TITLE} icon={FolderOpen} titleClassName={cn(RT_SHARED.TEXT_XS_FONT_BOLD_UPPERCASE_TRACKING_WIDER_TEXT_SLATE_100)} iconClassName={cn(RT_SHARED.W_3_5_H_3_5_TEXT_PURPLE_400)}>
          <span className={cn(RT_VIDEO_EXPORT.PX_1_5_PY_0_5_ROUNDED_TEXT_9PX_BG)}>{text.SOURCE_BADGE}</span>
        </VideoExportSectionHeading>
        {(hasSource || isRestoring) && (
          <Button id={VIDEO_EXPORT_TEXT_VIDEO_EXPORT_CHANGE_FOLDER} variant={VIDEO_EXPORT_TEXT_UNSTYLED} type={VIDEO_EXPORT_TEXT_BUTTON} onClick={exporter.selectFolder} disabled={isBusy || isRestoring} className={cn(RT_VIDEO_EXPORT.TEXT_XS_FONT_SEMIBOLD_TEXT_PURPLE_400_HOVER_TEXT_PURPLE)}>
            {isScanning || isRestoring ? "" : text.CHANGE_FOLDER_BTN}
          </Button>
        )}
      </div>
      {isRestoring ? (
        <div className={cn(RT_VIDEO_EXPORT.PY_10_PX_6_ROUNDED_2XL_BG_SLATE_950_40)}>
          <div className={cn(RT_SHARED.RELATIVE_FLEX_ITEMS_CENTER_JUSTIFY_CENTER)}>
            <div className={cn(RT_VIDEO_EXPORT.W_14_H_14_ROUNDED_2XL_BG_GRADIENT_TO_TR)}>
              <Sparkles className={cn(RT_SHARED.W_7_H_7_TEXT_PURPLE_400_ANIMATE_SPIN)} />
            </div>
            <div className={cn(RT_VIDEO_EXPORT.ABSOLUTE_INSET_1_ROUNDED_2XL_BG_PURPLE_500_20_BLUR)} />
          </div>
          <div className={cn(RT_VIDEO_EXPORT.SPACE_Y_2_MAX_W_MD_W_FULL_FLEX_FLEX)}>
            <p className={cn(RT_VIDEO_EXPORT.TEXT_SM_FONT_BOLD_TEXT_SLATE_100)}>{text.SOURCE_SCANNING}</p>
            {savedFolderPath && (
              <div className={cn(RT_VIDEO_EXPORT.FLEX_ITEMS_CENTER_GAP_1_5_MAX_W_FULL_PX)}>
                <FolderOpen className={cn(RT_SHARED.W_3_5_H_3_5_TEXT_PURPLE_400_SHRINK)} />
                <span className={cn(RT_SHARED.TRUNCATE)}>{savedFolderPath}</span>
              </div>
            )}
          </div>
          <div className={cn(RT_VIDEO_EXPORT.W_48_H_1_5_ROUNDED_FULL_BG_SLATE_800)}>
            <div className={cn(RT_VIDEO_EXPORT.H_FULL_W_FULL_BG_GRADIENT_TO_R_FROM_PURPLE)} />
          </div>
        </div>
      ) : !hasSource ? (
        <Button id={VIDEO_EXPORT_TEXT_VIDEO_EXPORT_PICK_FOLDER} variant={VIDEO_EXPORT_TEXT_UNSTYLED} type={VIDEO_EXPORT_TEXT_BUTTON} onClick={exporter.selectFolder} disabled={isBusy} className={cn(RT_VIDEO_EXPORT.W_FULL_MIN_H_240PX_BORDER_2_BORDER_DASHED_ROUNDED)}>
          <div className={cn(RT_SHARED.W_12_H_12_ROUNDED_2XL_BG_SLATE_900_BORDER)}>{isScanning ? <Sparkles className={cn(RT_VIDEO_EXPORT.W_6_H_6_TEXT_PURPLE_400_ANIMATE_SPIN)} /> : <Upload className={cn(RT_SHARED.W_6_H_6_TEXT_PURPLE_400_GROUP_HOVER_TEXT)} />}</div>
          <p className={cn(RT_SHARED.TEXT_SM_FONT_MEDIUM_TEXT_SLATE_200)}>{isScanning ? text.SOURCE_SCANNING : text.SOURCE_PICK_TITLE}</p>
          <p className={cn(RT_VIDEO_EXPORT.TEXT_XS_TEXT_SLATE_400_MT_1)}>{text.SOURCE_PICK_HINT}</p>
        </Button>
      ) : (
        <>
          <div className={cn(RT_VIDEO_EXPORT.FLEX_ITEMS_CENTER_GAP_2_PX_3_PY_2_ROUNDED_4037B1)} title={source?.folderPath}>
            <FolderOpen className={cn(RT_SHARED.W_3_5_H_3_5_TEXT_PURPLE_400_SHRINK)} />
            <span className={cn(RT_SHARED.TRUNCATE)}>{source?.folderPath}</span>
          </div>
          <div className={cn(RT_VIDEO_EXPORT.GRID_GRID_COLS_2_SM_GRID_COLS_4_GAP_2)}>
            <StatTile icon={Music} iconClassName={VIDEO_EXPORT_TEXT_TEXT_PURPLE_400} label={text.STAT_TRACKS} value={VIDEO_EXPORT_TEMPLATE_SYMBOL_5(`${selectedAudios.length}`, `${audios.length}`)} />
            <StatTile icon={Clock} iconClassName={VIDEO_EXPORT_TEXT_TEXT_BLUE_400} label={text.STAT_DURATION} value={formatCleanTime(totalAudioSeconds)} />
            <StatTile icon={ImageIcon} iconClassName={VIDEO_EXPORT_TEXT_TEXT_PINK_400} label={text.STAT_IMAGES} value={VIDEO_EXPORT_TEMPLATE_SYMBOL_5(`${selectedImages.length}`, `${images.length}`)} />
            <StatTile icon={HardDrive} iconClassName={VIDEO_EXPORT_TEXT_TEXT_AMBER_400} label={text.STAT_SIZE} value={formatFileSize(totalAudioBytes)} />
          </div>
          <div className={cn(RT_SHARED.FLEX_ITEMS_CENTER_GAP_2)}>
            <Button id={VIDEO_EXPORT_TEXT_VIDEO_EXPORT_TAB_AUDIO} variant={VIDEO_EXPORT_TEXT_UNSTYLED} type={VIDEO_EXPORT_TEXT_BUTTON} onClick={() => setSourceTab(VideoExportSourceTab.AUDIO)} className={tabButtonClassName(VideoExportSourceTab.AUDIO)}>
              <Music className={cn(RT_SHARED.W_3_5_H_3_5)} />
              <span>
                {text.TAB_AUDIO}
                {VIDEO_EXPORT_TEXT_SYMBOL_4}
                {audios.length}
                {VIDEO_EXPORT_TEXT_SYMBOL_5}
              </span>
            </Button>
            <Button id={VIDEO_EXPORT_TEXT_VIDEO_EXPORT_TAB_IMAGE} variant={VIDEO_EXPORT_TEXT_UNSTYLED} type={VIDEO_EXPORT_TEXT_BUTTON} onClick={() => setSourceTab(VideoExportSourceTab.IMAGE)} className={tabButtonClassName(VideoExportSourceTab.IMAGE)}>
              <ImageIcon className={cn(RT_SHARED.W_3_5_H_3_5)} />
              <span>
                {text.TAB_IMAGE}
                {VIDEO_EXPORT_TEXT_SYMBOL_4}
                {images.length}
                {VIDEO_EXPORT_TEXT_SYMBOL_5}
              </span>
            </Button>
          </div>
          {sourceTab === VideoExportSourceTab.AUDIO ? (
            <div className={cn(RT_VIDEO_EXPORT.SPACE_Y_3_ANIMATE_IN_FADE_IN_DURATION_200)}>
              <div className={cn(RT_VIDEO_EXPORT.P_3_ROUNDED_XL_BG_GRADIENT_TO_R_FROM_PURPLE)}>
                <div className={cn(RT_VIDEO_EXPORT.FLEX_ITEMS_START_GAP_2_5_MIN_W_0)}>
                  <div className={cn(RT_VIDEO_EXPORT.W_8_H_8_ROUNDED_LG_BG_PURPLE_500_15)}>
                    <Bot className={cn(RT_VIDEO_EXPORT.W_4_H_4_TEXT_PURPLE_300, { "animate-pulse": isRanking })} />
                  </div>
                  <div className={cn(RT_SHARED.MIN_W_0)}>
                    <p className={cn(RT_VIDEO_EXPORT.TEXT_XS_FONT_BOLD_TEXT_SLATE_100)}>{text.AI_RANK_TITLE}</p>
                    <p className={cn(RT_VIDEO_EXPORT.TEXT_11PX_TEXT_SLATE_400_LEADING_RELAXED)}>{isRanking ? text.AI_RANKING : text.AI_RANK_DESC}</p>
                  </div>
                </div>
                {isRanking ? (
                  <Button id={VIDEO_EXPORT_TEXT_VIDEO_EXPORT_AI_RANK_CANCEL} variant={VIDEO_EXPORT_TEXT_UNSTYLED} type={VIDEO_EXPORT_TEXT_BUTTON} onClick={exporter.cancelRanking} className={cn(RT_VIDEO_EXPORT.H_9_PX_3_5_ROUNDED_XL_BORDER_BORDER_ROSE)}>
                    <X className={cn(RT_SHARED.W_3_5_H_3_5)} />
                    <span>{text.AI_RANK_CANCEL}</span>
                  </Button>
                ) : (
                  <Button id={VIDEO_EXPORT_TEXT_VIDEO_EXPORT_AI_RANK} variant={VIDEO_EXPORT_TEXT_UNSTYLED} type={VIDEO_EXPORT_TEXT_BUTTON} onClick={exporter.rankWithAi} disabled={isBusy || _.isEmpty(selectedAudios)} className={cn(RT_VIDEO_EXPORT.H_9_PX_3_5_ROUNDED_XL_BORDER_BORDER_PURPLE)}>
                    <Sparkles className={cn(RT_SHARED.W_3_5_H_3_5)} />
                    <span>{text.AI_RANK_BTN}</span>
                  </Button>
                )}
              </div>
              {_.isEmpty(audios) ? (
                <p className={cn(RT_VIDEO_EXPORT.PY_8_TEXT_CENTER_TEXT_XS_TEXT_SLATE_400)}>{text.AUDIO_EMPTY}</p>
              ) : (
                <>
                  <Button id={VIDEO_EXPORT_TEXT_VIDEO_EXPORT_AUDIO_SELECT_ALL} variant={VIDEO_EXPORT_TEXT_UNSTYLED} type={VIDEO_EXPORT_TEXT_BUTTON} disabled={isRanking} onClick={() => exporter.setAllAudiosSelected(!isAllAudioSelected)} className={cn(RT_VIDEO_EXPORT.INLINE_FLEX_ITEMS_CENTER_GAP_1_5_TEXT_11PX_FONT)}>
                    {isAllAudioSelected ? <CheckSquare className={cn(RT_SHARED.W_3_5_H_3_5_TEXT_PURPLE_400)} /> : <Square className={cn(RT_SHARED.W_3_5_H_3_5)} />}
                    <span>{isAllAudioSelected ? text.DESELECT_ALL : text.SELECT_ALL}</span>
                  </Button>
                  <ul className={cn(RT_VIDEO_EXPORT.MAX_H_360PX_OVERFLOW_Y_AUTO_CUSTOM_SCROLLBAR_SPACE_Y)}>
                    {_.map(audios, (item, position) => {
                      const isSelected = _.includes(selectedAudioIds, item.id);
                      const isPlaying = playingId === item.id;
                      return (
                        <li key={item.id} className={cn(RT_VIDEO_EXPORT.FLEX_ITEMS_CENTER_GAP_2_P_2_ROUNDED_XL_BORDER, { "bg-slate-950/70 border-purple-500/30": isSelected, "bg-slate-950/30 border-slate-800/80 opacity-60": !isSelected })}>
                          <Button variant={VIDEO_EXPORT_TEXT_UNSTYLED} type={VIDEO_EXPORT_TEXT_BUTTON} disabled={isRanking} onClick={() => exporter.toggleAudio(item.id)} className={cn(RT_VIDEO_EXPORT.SHRINK_0_CURSOR_POINTER_DISABLED_CURSOR_NOT_ALLOWED_P_0)} title={item.name}>
                            {isSelected ? <CheckSquare className={cn(RT_SHARED.W_4_H_4_TEXT_PURPLE_400)} /> : <Square className={cn(RT_VIDEO_EXPORT.W_4_H_4_TEXT_SLATE_500)} />}
                          </Button>
                          <span className={cn(RT_VIDEO_EXPORT.W_6_TEXT_CENTER_TEXT_10PX_FONT_MONO_FONT_BOLD)}>{position + 1}</span>
                          <Button variant={VIDEO_EXPORT_TEXT_UNSTYLED} type={VIDEO_EXPORT_TEXT_BUTTON} onClick={() => togglePlay(item.id, item.url)} title={isPlaying ? text.PAUSE : text.PLAY} className={cn(RT_VIDEO_EXPORT.P_1_TEXT_PURPLE_400_HOVER_TEXT_PURPLE_300_TRANSITION)}>
                            {isPlaying ? <Pause className={cn(RT_SHARED.W_4_H_4)} /> : <Play className={cn(RT_VIDEO_EXPORT.W_4_H_4_ML_0_5)} />}
                          </Button>
                          <div className={cn(RT_SHARED.FLEX_1_MIN_W_0)}>
                            <p className={cn(RT_VIDEO_EXPORT.TEXT_XS_FONT_SEMIBOLD_TEXT_SLATE_100_TRUNCATE)} title={item.relativePath}>
                              {item.name}
                            </p>
                            <p className={cn(RT_VIDEO_EXPORT.TEXT_10PX_FONT_MONO_TEXT_SLATE_400)}>
                              {item.durationSeconds > 0 ? formatCleanTime(item.durationSeconds) : VIDEO_EXPORT_TEXT_SYMBOL_6}
                              {VIDEO_EXPORT_TEXT_SYMBOL_7}
                              {formatFileSize(item.sizeBytes)}
                            </p>
                          </div>
                          {_.isNumber(item.aiScore) && (
                            <span className={cn(RT_VIDEO_EXPORT.PX_2_PY_0_5_ROUNDED_FULL_BG_AMBER_500)}>
                              <Trophy className={cn(RT_SHARED.W_3_H_3)} />
                              {item.aiScore} {text.AI_SCORE_SUFFIX}
                            </span>
                          )}
                          <div className={cn(RT_VIDEO_EXPORT.FLEX_ITEMS_CENTER_GAP_0_5_SHRINK_0)}>
                            <Button variant={VIDEO_EXPORT_TEXT_UNSTYLED} type={VIDEO_EXPORT_TEXT_BUTTON} disabled={isRanking || position === 0} onClick={() => exporter.moveAudio(item.id, -1)} title={text.MOVE_UP} className={cn(RT_VIDEO_EXPORT.P_1_TEXT_SLATE_400_HOVER_TEXT_PURPLE_300_TRANSITION)}>
                              <ArrowUp className={cn(RT_SHARED.W_3_5_H_3_5)} />
                            </Button>
                            <Button variant={VIDEO_EXPORT_TEXT_UNSTYLED} type={VIDEO_EXPORT_TEXT_BUTTON} disabled={isRanking || position === audios.length - 1} onClick={() => exporter.moveAudio(item.id, 1)} title={text.MOVE_DOWN} className={cn(RT_VIDEO_EXPORT.P_1_TEXT_SLATE_400_HOVER_TEXT_PURPLE_300_TRANSITION)}>
                              <ArrowDown className={cn(RT_SHARED.W_3_5_H_3_5)} />
                            </Button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}
            </div>
          ) : (
            <div className={cn(RT_VIDEO_EXPORT.SPACE_Y_3_ANIMATE_IN_FADE_IN_DURATION_200)}>
              {_.isEmpty(images) ? (
                <p className={cn(RT_VIDEO_EXPORT.PY_8_TEXT_CENTER_TEXT_XS_TEXT_SLATE_400)}>{text.IMAGE_EMPTY}</p>
              ) : (
                <>
                  <Button id={VIDEO_EXPORT_TEXT_VIDEO_EXPORT_IMAGE_SELECT_ALL} variant={VIDEO_EXPORT_TEXT_UNSTYLED} type={VIDEO_EXPORT_TEXT_BUTTON} onClick={() => exporter.setAllImagesSelected(!isAllImageSelected)} className={cn(RT_VIDEO_EXPORT.INLINE_FLEX_ITEMS_CENTER_GAP_1_5_TEXT_11PX_FONT)}>
                    {isAllImageSelected ? <CheckSquare className={cn(RT_SHARED.W_3_5_H_3_5_TEXT_PURPLE_400)} /> : <Square className={cn(RT_SHARED.W_3_5_H_3_5)} />}
                    <span>{isAllImageSelected ? text.DESELECT_ALL : text.SELECT_ALL}</span>
                  </Button>
                  <div className={cn(RT_VIDEO_EXPORT.MAX_H_400PX_OVERFLOW_Y_AUTO_CUSTOM_SCROLLBAR_GRID_GRID)}>
                    {_.map(images, (item) => {
                      const selectedOrder = _.indexOf(selectedImageIds, item.id);
                      const isSelected = selectedOrder >= 0;
                      const displayOrder = _.findIndex(selectedImages, (image) => image.id === item.id) + 1;
                      return (
                        <Button
                          key={item.id}
                          variant={VIDEO_EXPORT_TEXT_UNSTYLED}
                          type={VIDEO_EXPORT_TEXT_BUTTON}
                          onClick={() => exporter.toggleImage(item.id)}
                          title={item.relativePath}
                          className={cn(RT_VIDEO_EXPORT.RELATIVE_GROUP_ROUNDED_XL_OVERFLOW_HIDDEN_BORDER_2_ASPECT_VIDEO, { "border-purple-500 shadow-md shadow-purple-500/20": isSelected, "border-slate-800 opacity-50 hover:opacity-80": !isSelected })}>
                          <img src={item.url} alt={item.name} loading={VIDEO_EXPORT_TEXT_LAZY} className={cn(RT_VIDEO_EXPORT.W_FULL_H_FULL_OBJECT_COVER_GROUP_HOVER_SCALE_105)} />
                          <span className={cn(RT_VIDEO_EXPORT.ABSOLUTE_TOP_1_5_LEFT_1_5_W_5_H, isSelected ? RT_VIDEO_EXPORT.BG_PURPLE_600_TEXT_WHITE : RT_VIDEO_EXPORT.BG_SLATE_900_80_TEXT_SLATE_400)}>{isSelected ? displayOrder : VIDEO_EXPORT_TEXT_SYMBOL_8}</span>
                          <span className={cn(RT_VIDEO_EXPORT.ABSOLUTE_BOTTOM_0_INSET_X_0_PX_2_PY_1)}>{item.name}</span>
                        </Button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}
    </StudioCard>
  );
};
