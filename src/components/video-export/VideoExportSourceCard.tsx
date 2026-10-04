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
} from "../../constants/videoExportText";
import { FC, useEffect, useRef, useState } from "react";
import _ from "lodash";
import { ArrowDown, ArrowUp, Bot, CheckSquare, Clock, FolderOpen, HardDrive, ImageIcon, Music, Pause, Play, Sparkles, Square, Trophy, Upload, X } from "lucide-react";
import { Button } from "../ui/Button.js";
import { cn } from "../../lib/utils.js";
import { formatCleanTime } from "../../lib/timeUtils.js";
import { VideoExporterState } from "../../hooks/useVideoExporter.js";
import { formatFileSize } from "./videoExportUtils.js";
import { VideoExportSourceTab } from "../../types/videoExport.js";
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
  <div className={cn("bg-slate-950/60 border border-slate-800 rounded-xl p-2.5 flex items-center gap-2 min-w-0")}>
    <Icon className={cn("w-4 h-4 shrink-0", iconClassName)} />
    <div className={cn("min-w-0")}>
      <div className={cn("text-[10px] text-slate-400 font-mono uppercase truncate")}>{label}</div>
      <div className={cn("text-xs font-bold text-slate-200 truncate")}>{value}</div>
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
  const tabButtonClassName = (tab: VideoExportSourceTab) =>
    cn("flex-1 h-9 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 border transition-all cursor-pointer select-none", {
      "bg-purple-500/15 border-purple-500/40 text-purple-300 shadow-sm shadow-purple-500/10": sourceTab === tab,
      "bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700": sourceTab !== tab,
    });
  return (
    <div className={cn("glass-card rounded-2xl sm:rounded-3xl p-5 space-y-4 shadow-xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-xl relative overflow-hidden text-left w-full flex flex-col")}>
      <audio ref={audioRef} className={cn("hidden")} onEnded={() => setPlayingId(null)} onError={() => setPlayingId(null)} />
      <div className={cn("flex items-center justify-between relative z-10 flex-wrap gap-2")}>
        <VideoExportSectionHeading step={text.STEP_01} title={text.SOURCE_TITLE} icon={FolderOpen} titleClassName={cn("text-xs font-bold uppercase tracking-wider text-slate-100 font-mono flex items-center gap-1.5")} iconClassName={cn("w-3.5 h-3.5 text-purple-400")}>
          <span className={cn("px-1.5 py-0.5 rounded text-[9px] bg-purple-500/15 border border-purple-500/30 text-purple-300 font-mono")}>{text.SOURCE_BADGE}</span>
        </VideoExportSectionHeading>
        {(hasSource || isRestoring) && (
          <Button id={VIDEO_EXPORT_TEXT_VIDEO_EXPORT_CHANGE_FOLDER} variant={VIDEO_EXPORT_TEXT_UNSTYLED} type={VIDEO_EXPORT_TEXT_BUTTON} onClick={exporter.selectFolder} disabled={isBusy || isRestoring} className={cn("text-xs font-semibold text-purple-400 hover:text-purple-300 hover:underline transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed")}>
            {isScanning || isRestoring ? text.SOURCE_SCANNING : text.CHANGE_FOLDER_BTN}
          </Button>
        )}
      </div>
      {isRestoring ? (
        <div className={cn("space-y-4 animate-in fade-in duration-150")}>
          <div className={cn("flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-950/70 border border-purple-500/30 text-slate-200 text-xs font-semibold min-w-0")}>
            <Sparkles className={cn("w-3.5 h-3.5 text-purple-400 animate-spin shrink-0")} />
            <span className={cn("truncate text-slate-300")}>{savedFolderPath}</span>
            <span className={cn("ml-auto text-[10px] font-mono text-purple-300 bg-purple-500/15 px-2 py-0.5 rounded-full border border-purple-500/30 shrink-0")}>{text.SOURCE_SCANNING}</span>
          </div>
          <div className={cn("grid grid-cols-2 sm:grid-cols-4 gap-2")}>
            {_.times(4, (i) => (
              <div key={i} className={cn("h-12 rounded-xl bg-slate-950/50 border border-slate-800/80 animate-pulse")} />
            ))}
          </div>
          <div className={cn("flex items-center gap-2")}>
            <div className={cn("flex-1 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 animate-pulse")} />
            <div className={cn("flex-1 h-9 rounded-xl bg-slate-950/40 border border-slate-800/60 animate-pulse")} />
          </div>
          <div className={cn("space-y-2 pt-2")}>
            {_.times(5, (i) => (
              <div key={i} className={cn("h-12 rounded-xl bg-slate-950/40 border border-slate-800/60 flex items-center px-3 gap-3 animate-pulse")}>
                <div className={cn("w-4 h-4 rounded bg-slate-800 shrink-0")} />
                <div className={cn("w-4 text-[10px] text-slate-600 font-mono")}>{i + 1}</div>
                <div className={cn("w-4 h-4 rounded bg-slate-800/60 shrink-0")} />
                <div className={cn("flex-1 space-y-1.5")}>
                  <div className={cn("h-3 bg-slate-800 rounded w-2/5")} />
                  <div className={cn("h-2 bg-slate-850 rounded w-1/4")} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : !hasSource ? (
        <Button
          id={VIDEO_EXPORT_TEXT_VIDEO_EXPORT_PICK_FOLDER}
          variant={VIDEO_EXPORT_TEXT_UNSTYLED}
          type={VIDEO_EXPORT_TEXT_BUTTON}
          onClick={exporter.selectFolder}
          disabled={isBusy}
          className={cn("w-full min-h-[240px] border-2 border-dashed rounded-2xl p-6 transition-all flex flex-col items-center justify-center text-center cursor-pointer group border-slate-700/80 bg-slate-950/40 hover:border-purple-500/60 hover:bg-purple-500/5 disabled:cursor-wait")}>
          <div className={cn("w-12 h-12 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform shadow-md")}>{isScanning ? <Sparkles className={cn("w-6 h-6 text-purple-400 animate-spin")} /> : <Upload className={cn("w-6 h-6 text-purple-400 group-hover:text-purple-300")} />}</div>
          <p className={cn("text-sm font-medium text-slate-200")}>{isScanning ? text.SOURCE_SCANNING : text.SOURCE_PICK_TITLE}</p>
          <p className={cn("text-xs text-slate-400 mt-1")}>{text.SOURCE_PICK_HINT}</p>
        </Button>
      ) : (
        <>
          <div className={cn("flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-950/70 border border-purple-500/30 text-slate-200 text-xs font-semibold min-w-0")} title={source?.folderPath}>
            <FolderOpen className={cn("w-3.5 h-3.5 text-purple-400 shrink-0")} />
            <span className={cn("truncate")}>{source?.folderPath}</span>
          </div>
          <div className={cn("grid grid-cols-2 sm:grid-cols-4 gap-2")}>
            <StatTile icon={Music} iconClassName={VIDEO_EXPORT_TEXT_TEXT_PURPLE_400} label={text.STAT_TRACKS} value={VIDEO_EXPORT_TEMPLATE_SYMBOL_5(`${selectedAudios.length}`, `${audios.length}`)} />
            <StatTile icon={Clock} iconClassName={VIDEO_EXPORT_TEXT_TEXT_BLUE_400} label={text.STAT_DURATION} value={formatCleanTime(totalAudioSeconds)} />
            <StatTile icon={ImageIcon} iconClassName={VIDEO_EXPORT_TEXT_TEXT_PINK_400} label={text.STAT_IMAGES} value={VIDEO_EXPORT_TEMPLATE_SYMBOL_5(`${selectedImages.length}`, `${images.length}`)} />
            <StatTile icon={HardDrive} iconClassName={VIDEO_EXPORT_TEXT_TEXT_AMBER_400} label={text.STAT_SIZE} value={formatFileSize(totalAudioBytes)} />
          </div>
          <div className={cn("flex items-center gap-2")}>
            <Button id={VIDEO_EXPORT_TEXT_VIDEO_EXPORT_TAB_AUDIO} variant={VIDEO_EXPORT_TEXT_UNSTYLED} type={VIDEO_EXPORT_TEXT_BUTTON} onClick={() => setSourceTab(VideoExportSourceTab.AUDIO)} className={tabButtonClassName(VideoExportSourceTab.AUDIO)}>
              <Music className={cn("w-3.5 h-3.5")} />
              <span>
                {text.TAB_AUDIO}
                {VIDEO_EXPORT_TEXT_SYMBOL_4}
                {audios.length}
                {VIDEO_EXPORT_TEXT_SYMBOL_5}
              </span>
            </Button>
            <Button id={VIDEO_EXPORT_TEXT_VIDEO_EXPORT_TAB_IMAGE} variant={VIDEO_EXPORT_TEXT_UNSTYLED} type={VIDEO_EXPORT_TEXT_BUTTON} onClick={() => setSourceTab(VideoExportSourceTab.IMAGE)} className={tabButtonClassName(VideoExportSourceTab.IMAGE)}>
              <ImageIcon className={cn("w-3.5 h-3.5")} />
              <span>
                {text.TAB_IMAGE}
                {VIDEO_EXPORT_TEXT_SYMBOL_4}
                {images.length}
                {VIDEO_EXPORT_TEXT_SYMBOL_5}
              </span>
            </Button>
          </div>
          {sourceTab === VideoExportSourceTab.AUDIO ? (
            <div className={cn("space-y-3 animate-in fade-in duration-200")}>
              <div className={cn("p-3 rounded-xl bg-gradient-to-r from-purple-500/10 via-fuchsia-500/5 to-transparent border border-purple-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3")}>
                <div className={cn("flex items-start gap-2.5 min-w-0")}>
                  <div className={cn("w-8 h-8 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center shrink-0")}>
                    <Bot className={cn("w-4 h-4 text-purple-300", { "animate-pulse": isRanking })} />
                  </div>
                  <div className={cn("min-w-0")}>
                    <p className={cn("text-xs font-bold text-slate-100")}>{text.AI_RANK_TITLE}</p>
                    <p className={cn("text-[11px] text-slate-400 leading-relaxed")}>{isRanking ? text.AI_RANKING : text.AI_RANK_DESC}</p>
                  </div>
                </div>
                {isRanking ? (
                  <Button id={VIDEO_EXPORT_TEXT_VIDEO_EXPORT_AI_RANK_CANCEL} variant={VIDEO_EXPORT_TEXT_UNSTYLED} type={VIDEO_EXPORT_TEXT_BUTTON} onClick={exporter.cancelRanking} className={cn("h-9 px-3.5 rounded-xl border border-rose-500/40 bg-rose-500/15 hover:bg-rose-500/25 text-rose-200 text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0")}>
                    <X className={cn("w-3.5 h-3.5")} />
                    <span>{text.AI_RANK_CANCEL}</span>
                  </Button>
                ) : (
                  <Button
                    id={VIDEO_EXPORT_TEXT_VIDEO_EXPORT_AI_RANK}
                    variant={VIDEO_EXPORT_TEXT_UNSTYLED}
                    type={VIDEO_EXPORT_TEXT_BUTTON}
                    onClick={exporter.rankWithAi}
                    disabled={isBusy || _.isEmpty(selectedAudios)}
                    className={cn("h-9 px-3.5 rounded-xl border border-purple-400/40 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md shadow-purple-600/25 active:scale-95 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed")}>
                    <Sparkles className={cn("w-3.5 h-3.5")} />
                    <span>{text.AI_RANK_BTN}</span>
                  </Button>
                )}
              </div>
              {_.isEmpty(audios) ? (
                <p className={cn("py-8 text-center text-xs text-slate-400")}>{text.AUDIO_EMPTY}</p>
              ) : (
                <>
                  <Button id={VIDEO_EXPORT_TEXT_VIDEO_EXPORT_AUDIO_SELECT_ALL} variant={VIDEO_EXPORT_TEXT_UNSTYLED} type={VIDEO_EXPORT_TEXT_BUTTON} disabled={isRanking} onClick={() => exporter.setAllAudiosSelected(!isAllAudioSelected)} className={cn("inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-300 hover:text-purple-300 transition-colors cursor-pointer")}>
                    {isAllAudioSelected ? <CheckSquare className={cn("w-3.5 h-3.5 text-purple-400")} /> : <Square className={cn("w-3.5 h-3.5")} />}
                    <span>{isAllAudioSelected ? text.DESELECT_ALL : text.SELECT_ALL}</span>
                  </Button>
                  <ul className={cn("max-h-[360px] overflow-y-auto custom-scrollbar space-y-1.5 pr-1")}>
                    {_.map(audios, (item, position) => {
                      const isSelected = _.includes(selectedAudioIds, item.id);
                      const isPlaying = playingId === item.id;
                      return (
                        <li
                          key={item.id}
                          className={cn("flex items-center gap-2 p-2 rounded-xl border transition-all", {
                            "bg-slate-950/70 border-purple-500/30": isSelected,
                            "bg-slate-950/30 border-slate-800/80 opacity-60": !isSelected,
                          })}>
                          <Button variant={VIDEO_EXPORT_TEXT_UNSTYLED} type={VIDEO_EXPORT_TEXT_BUTTON} disabled={isRanking} onClick={() => exporter.toggleAudio(item.id)} className={cn("shrink-0 cursor-pointer disabled:cursor-not-allowed p-0")} title={item.name}>
                            {isSelected ? <CheckSquare className={cn("w-4 h-4 text-purple-400")} /> : <Square className={cn("w-4 h-4 text-slate-500")} />}
                          </Button>
                          <span className={cn("w-6 text-center text-[10px] font-mono font-bold text-slate-500 shrink-0")}>{position + 1}</span>
                          <Button variant={VIDEO_EXPORT_TEXT_UNSTYLED} type={VIDEO_EXPORT_TEXT_BUTTON} onClick={() => togglePlay(item.id, item.url)} title={isPlaying ? text.PAUSE : text.PLAY} className={cn("p-1 text-purple-400 hover:text-purple-300 transition-colors shrink-0 cursor-pointer flex items-center justify-center")}>
                            {isPlaying ? <Pause className={cn("w-4 h-4")} /> : <Play className={cn("w-4 h-4 ml-0.5")} />}
                          </Button>
                          <div className={cn("flex-1 min-w-0")}>
                            <p className={cn("text-xs font-semibold text-slate-100 truncate")} title={item.relativePath}>
                              {item.name}
                            </p>
                            <p className={cn("text-[10px] font-mono text-slate-400")}>
                              {item.durationSeconds > 0 ? formatCleanTime(item.durationSeconds) : VIDEO_EXPORT_TEXT_SYMBOL_6}
                              {VIDEO_EXPORT_TEXT_SYMBOL_7}
                              {formatFileSize(item.sizeBytes)}
                            </p>
                          </div>
                          {_.isNumber(item.aiScore) && (
                            <span className={cn("px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 text-[10px] font-bold font-mono flex items-center gap-1 shrink-0")}>
                              <Trophy className={cn("w-3 h-3")} />
                              {item.aiScore} {text.AI_SCORE_SUFFIX}
                            </span>
                          )}
                          <div className={cn("flex items-center gap-0.5 shrink-0")}>
                            <Button variant={VIDEO_EXPORT_TEXT_UNSTYLED} type={VIDEO_EXPORT_TEXT_BUTTON} disabled={isRanking || position === 0} onClick={() => exporter.moveAudio(item.id, -1)} title={text.MOVE_UP} className={cn("p-1 text-slate-400 hover:text-purple-300 transition-colors cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed")}>
                              <ArrowUp className={cn("w-3.5 h-3.5")} />
                            </Button>
                            <Button variant={VIDEO_EXPORT_TEXT_UNSTYLED} type={VIDEO_EXPORT_TEXT_BUTTON} disabled={isRanking || position === audios.length - 1} onClick={() => exporter.moveAudio(item.id, 1)} title={text.MOVE_DOWN} className={cn("p-1 text-slate-400 hover:text-purple-300 transition-colors cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed")}>
                              <ArrowDown className={cn("w-3.5 h-3.5")} />
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
            <div className={cn("space-y-3 animate-in fade-in duration-200")}>
              {_.isEmpty(images) ? (
                <p className={cn("py-8 text-center text-xs text-slate-400")}>{text.IMAGE_EMPTY}</p>
              ) : (
                <>
                  <Button id={VIDEO_EXPORT_TEXT_VIDEO_EXPORT_IMAGE_SELECT_ALL} variant={VIDEO_EXPORT_TEXT_UNSTYLED} type={VIDEO_EXPORT_TEXT_BUTTON} onClick={() => exporter.setAllImagesSelected(!isAllImageSelected)} className={cn("inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-300 hover:text-purple-300 transition-colors cursor-pointer")}>
                    {isAllImageSelected ? <CheckSquare className={cn("w-3.5 h-3.5 text-purple-400")} /> : <Square className={cn("w-3.5 h-3.5")} />}
                    <span>{isAllImageSelected ? text.DESELECT_ALL : text.SELECT_ALL}</span>
                  </Button>
                  <div className={cn("max-h-[400px] overflow-y-auto custom-scrollbar grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 pr-1")}>
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
                          className={cn("relative group rounded-xl overflow-hidden border-2 aspect-video bg-slate-950 cursor-pointer transition-all p-0", {
                            "border-purple-500 shadow-md shadow-purple-500/20": isSelected,
                            "border-slate-800 opacity-50 hover:opacity-80": !isSelected,
                          })}>
                          <img src={item.url} alt={item.name} loading={VIDEO_EXPORT_TEXT_LAZY} className={cn("w-full h-full object-cover group-hover:scale-105 transition-transform duration-300")} />
                          <span className={cn("absolute top-1.5 left-1.5 w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black font-mono shadow-md", isSelected ? "bg-purple-600 text-white" : "bg-slate-900/80 text-slate-400")}>{isSelected ? displayOrder : VIDEO_EXPORT_TEXT_SYMBOL_8}</span>
                          <span className={cn("absolute bottom-0 inset-x-0 px-2 py-1 bg-gradient-to-t from-slate-950/95 to-transparent text-[10px] text-slate-200 truncate text-left")}>{item.name}</span>
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
    </div>
  );
};
