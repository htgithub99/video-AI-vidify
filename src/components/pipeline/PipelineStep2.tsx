import React from 'react';
import { PipelineWizardState } from './usePipelineWizard';

import * as LucideIcons from 'lucide-react';


const { ImageIcon, RefreshCw, ChevronDown, Upload, X, Sparkles, Copy, Layout, ArrowLeft, ArrowRight } = LucideIcons as any;

import { WizardStep } from '../../types';

export default function PipelineStep2(props: PipelineWizardState) {
  const { t, project, setProject, setCurrentStep, loadingStates, setInfoMsg, setZoomedImage, handleThumbnailReferenceImagesUpload, handleExtractThumbnailStyle, handleTriggerAssetAndThumbnail, handleRenderThumbnailImage, currentLang } = props;
  return (
    <>
      <div className="bg-gradient-to-b from-slate-900/90 to-slate-950/95 border border-slate-800/85 rounded-2xl p-6 space-y-6 shadow-2xl relative overflow-visible">
        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/[0.03] rounded-full blur-3xl pointer-events-none" />
        <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
          <div>
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-rose-500" />
              {t.assetMgr}
            </h3>
            <p className="text-slate-400 text-xs mt-1">
              {t.Select_visual_styles_defi}
            </p>
          </div>

          <button
            type="button"
            onClick={() => handleTriggerAssetAndThumbnail(true, "top")}
            disabled={!!loadingStates["assetAndThumbnail_loading"]}
            className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-500 disabled:bg-slate-800 disabled:opacity-75 disabled:cursor-not-allowed text-white font-bold text-xs px-4 py-2.5 rounded-lg transition-all cursor-pointer shadow-md self-start sm:self-auto active:scale-95"
            title={
              t.Create_prompt_guides_and_
            }
          >
            {loadingStates["assetAndThumbnail_loading"] ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>
                  {t.Generating}
                </span>
              </>
            ) : (
              <>
                <RefreshCw className="w-3.5 h-3.5" />
                <span>
                  {t.Generate_Thumbnails}
                </span>
              </>
            )}
          </button>
        </div>

        { }
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
          { }
          <div className="lg:col-span-3 bg-slate-950/45 border border-slate-800 p-5 rounded-xl flex flex-col space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-xs text-slate-400 font-mono font-bold uppercase block">
                {t.Thumbnail_Prompts_Input}
              </label>
              <span className="text-[10px] text-slate-600 font-mono ring-1 ring-slate-800 px-1.5 py-0.5 rounded">
                {t.INPUT_STATE}
              </span>
            </div>
            <textarea
              value={project.scriptRewritten || ""}
              onChange={(e) =>
                setProject((prev) => ({
                  ...prev,
                  scriptRewritten: e.target.value,
                }))
              }
              placeholder={
                t.Empty_script_Paste_here
              }
              className="flex-1 bg-slate-900 border border-slate-800 rounded-lg p-3 w-full text-xs text-slate-300 leading-relaxed font-sans outline-none focus:border-rose-500 min-h-[120px] custom-scrollbar resize-none"
            />
          </div>

          { }
          <div className="lg:col-span-2 space-y-4 flex flex-col">
            <div className="flex items-center justify-between bg-slate-950/40 p-3 rounded-xl border border-slate-800/80">
              <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider pl-2">
                {t.Batch_Count}
              </span>
              <div className="relative flex items-center bg-slate-900 border border-slate-700/80 rounded-lg px-2 py-1 transition-all shadow-sm focus-within:border-rose-500/80">
                <select
                  value={project.visualConfig.thumbnailCount || 2}
                  onChange={(e) =>
                    setProject((prev) => ({
                      ...prev,
                      visualConfig: {
                        ...prev.visualConfig,
                        thumbnailCount: Number(e.target.value),
                      },
                    }))
                  }
                  className="flex-1 bg-transparent border-none text-slate-200 text-xs font-semibold outline-none cursor-pointer appearance-none pr-6"
                >
                  <option
                    value="1"
                    className="bg-slate-950 text-slate-350"
                  >
                    1 {t.idea}
                  </option>
                  <option
                    value="2"
                    className="bg-slate-950 text-slate-350"
                  >
                    2 {t.ideas}
                  </option>
                  <option
                    value="3"
                    className="bg-slate-950 text-slate-350"
                  >
                    3 {t.ideas}
                  </option>
                  <option
                    value="4"
                    className="bg-slate-950 text-slate-350"
                  >
                    4 {t.ideas}
                  </option>
                  <option
                    value="5"
                    className="bg-slate-950 text-slate-350"
                  >
                    5 {t.ideas}
                  </option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 text-slate-500 w-3.5 h-3.5" />
              </div>
            </div>

            <div className="flex-1 flex flex-col animate-fade-in bg-slate-900/20 border border-slate-800/50 p-4 rounded-xl">
              <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block mb-2">
                {t.Reference_Image_Optional}
              </span>
              <div className="flex flex-col gap-3 flex-1">
                <div
                  className="relative w-full border border-dashed border-slate-700/80 hover:border-emerald-500/50 bg-slate-900/40 hover:bg-emerald-950/20 rounded-xl flex flex-col items-center justify-center py-4 cursor-pointer transition-all group overflow-hidden flex-1"
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.add(
                      "border-emerald-500",
                      "bg-emerald-950/30",
                    );
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove(
                      "border-emerald-500",
                      "bg-emerald-950/30",
                    );
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove(
                      "border-emerald-500",
                      "bg-emerald-950/30",
                    );
                    if (e.dataTransfer.files) {
                      handleThumbnailReferenceImagesUpload(
                        e.dataTransfer.files,
                      );
                    }
                  }}
                >
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      if (e.target.files) {
                        handleThumbnailReferenceImagesUpload(
                          e.target.files,
                        );
                        e.target.value = "";
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="p-2 bg-slate-950 rounded-xl border border-slate-800 group-hover:scale-110 group-hover:border-emerald-500/30 transition-all duration-300 mb-1 shadow-lg">
                    <Upload className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 transition-colors" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-200">
                    {t.Upload_style_images}
                  </span>
                </div>

                {project.visualConfig?.thumbnailReferenceImages &&
                  project.visualConfig.thumbnailReferenceImages.length >
                  0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {project.visualConfig.thumbnailReferenceImages.map(
                        (imgBase64, idx) => (
                          <div
                            key={idx}
                            className="relative w-16 h-16 rounded-lg group shadow-sm"
                          >
                            <div className="w-full h-full border border-slate-800 bg-black rounded-lg overflow-hidden">
                              <img
                                src={imgBase64}
                                alt={`Style reference ${idx + 1}`}
                                className="w-full h-full object-cover opacity-90 transition-opacity group-hover:opacity-100"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-lg"></div>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setProject((prev) => {
                                  const updated = [
                                    ...(prev.visualConfig
                                      ?.thumbnailReferenceImages || []),
                                  ];
                                  updated.splice(idx, 1);
                                  return {
                                    ...prev,
                                    visualConfig: {
                                      ...prev.visualConfig,
                                      thumbnailReferenceImages: updated,
                                    },
                                  };
                                });
                              }}
                              className="absolute -top-2 -right-2 w-5 h-5 bg-rose-500 hover:bg-rose-600 border border-rose-400/50 rounded-full flex items-center justify-center text-white transition-all z-20 backdrop-blur-sm opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 shadow-md cursor-pointer"
                              title={
                                t.Remove
                              }
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ),
                      )}
                    </div>
                  )}

                {project.visualConfig?.thumbnailReferenceImages &&
                  project.visualConfig.thumbnailReferenceImages.length >
                  0 && (
                    <div className="pt-2 flex flex-col gap-2 border-t border-slate-800/50">
                      {project.visualConfig
                        ?.thumbnailReferencePrompt && (
                          <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-md p-2 flex items-center justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-emerald-400 font-bold text-[9px] mb-0.5 uppercase tracking-wider flex items-center gap-1">
                                <Sparkles className="w-2.5 h-2.5" />{" "}
                                {t.Style}
                              </h4>
                              <p
                                className="text-slate-300 text-[10px] leading-relaxed line-clamp-1"
                                title={
                                  project.visualConfig
                                    .thumbnailReferencePrompt
                                }
                              >
                                {
                                  project.visualConfig
                                    .thumbnailReferencePrompt
                                }
                              </p>
                            </div>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(
                                  project.visualConfig
                                    .thumbnailReferencePrompt || "",
                                );
                                setInfoMsg(
                                  t.Style_copied,
                                );
                              }}
                              className="shrink-0 p-1 bg-emerald-900/50 hover:bg-emerald-800 border border-emerald-500/30 rounded text-emerald-400 transition-colors"
                              title={
                                t.Copy_style
                              }
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      <button
                        type="button"
                        onClick={handleExtractThumbnailStyle}
                        disabled={
                          !!loadingStates["extractThumbnailStyle"]
                        }
                        className="w-full py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:from-slate-800 disabled:to-slate-850 disabled:opacity-75 disabled:cursor-not-allowed text-white font-bold text-[10px] rounded-lg flex items-center justify-center gap-1.5 shadow transition-all cursor-pointer active:scale-95 border border-emerald-500/30"
                      >
                        {loadingStates["extractThumbnailStyle"] ? (
                          <>
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            <span>
                              {t.Extracting}
                            </span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3 h-3" />
                            <span>
                              {t.Extract_Style}
                            </span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
              </div>
            </div>
          </div>
        </div>

        { }
        <div className="border-t border-slate-800 pt-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h4 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Layout className="w-5 h-5 text-rose-500" />
              {t.thumbnailHeader}
            </h4>
          </div>

          {!project.thumbnails || project.thumbnails.length === 0 ? (
            loadingStates["assetAndThumbnail_loading"] ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full animate-pulse">
                {[1, 2].map((idx) => (
                  <div
                    key={idx}
                    className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-lg flex flex-col sm:flex-row p-4 gap-4"
                  >
                    <div className="sm:w-1/2 aspect-video bg-slate-900 rounded-lg flex items-center justify-center border border-slate-800/65">
                      <RefreshCw className="w-5 h-5 text-rose-500 animate-spin" />
                    </div>
                    <div className="flex-1 space-y-3 pt-2">
                      <div className="h-4 bg-slate-900 rounded-md w-1/3"></div>
                      <div className="h-3 bg-slate-900 rounded-md w-full"></div>
                      <div className="h-3 bg-slate-900 rounded-md w-5/6"></div>
                      <div className="h-2.5 bg-slate-900 rounded-md w-2/3"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-950/30 border border-slate-800/80 rounded-2xl p-10 text-center flex flex-col items-center justify-center max-w-md mx-auto space-y-4 group hover:border-slate-700/60 transition-all duration-300">
                <div className="w-12 h-12 bg-slate-900 border border-slate-800 rounded-full flex items-center justify-center text-rose-500 shadow-md group-hover:scale-105 transition-all duration-300 animate-pulse">
                  <ImageIcon className="w-5 h-5 text-rose-500" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold font-mono tracking-wider text-slate-300 uppercase">
                    {t.No_Thumbnail_Prompts}
                  </h4>
                  <p className="text-[11px] text-slate-400 max-w-xs leading-relaxed">
                    {t.Draft_eye_catching_visual}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    handleTriggerAssetAndThumbnail(true, "empty")
                  }
                  disabled={
                    !!loadingStates["assetAndThumbnail_loading"]
                  }
                  className="bg-rose-950/40 text-rose-300 hover:text-white hover:bg-rose-600 border border-rose-500/20 hover:border-rose-500 text-[10px] font-bold px-4 py-2 rounded-lg transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow disabled:opacity-75 disabled:cursor-not-allowed"
                  title={
                    t.Draft_visual_arrangements
                  }
                >
                  {loadingStates["assetAndThumbnail_loading"] ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>
                        {t.Generating}
                      </span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                      <span>
                        {t.Generate_Thumbnail}
                      </span>
                    </>
                  )}
                </button>
              </div>
            )
          ) : (
            <div className="relative">
              {loadingStates["assetAndThumbnail_loading"] && (
                <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md rounded-2xl z-20 flex flex-col items-center justify-center p-8 text-center space-y-4 border border-rose-500/10">
                  <div className="p-4 bg-rose-500/10 rounded-full border border-rose-500/20 animate-spin">
                    <Sparkles className="w-8 h-8 text-rose-500" />
                  </div>
                  <div className="space-y-1 max-w-sm">
                    <p className="font-bold text-slate-205 text-sm">
                      {t.Drafting_CTR_thumbnail}
                    </p>
                    <p className="text-[11px] text-slate-455 font-sans leading-relaxed">
                      {t.Drafting_eye_catching_vis}
                    </p>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {(project.thumbnails || []).map((thumb) => (
                  <div
                    key={thumb.id}
                    className="bg-gradient-to-b from-white to-slate-50 dark:from-slate-900/80 dark:to-slate-950/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800/60 rounded-2xl overflow-hidden shadow-md hover:shadow-xl hover:border-slate-300 dark:hover:border-slate-700/80 transition-all duration-500 group flex flex-col"
                  >
                    {/* Header Image Area */}
                    <div className="aspect-video relative overflow-hidden shrink-0 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                      {thumb.imageUrl ? (
                        <img
                          referrerPolicy="no-referrer"
                          src={thumb.imageUrl}
                          alt={t.thumbnail}
                          className="w-full h-full object-cover cursor-zoom-in group-hover:scale-105 transition-transform duration-700"
                          onClick={() =>
                            setZoomedImage({
                              url: thumb.imageUrl!,
                              title: `Thumbnail (${thumb.style} Look)`,
                              prompt: thumb.prompt,
                            })
                          }
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-rose-500/20 to-orange-500/20 flex flex-col items-center justify-center pointer-events-none">
                          <ImageIcon className="w-8 h-8 text-rose-500/50 mb-2" />
                          <span className="text-slate-500/50 font-mono text-[10px] tracking-widest uppercase">{t.No_Render_Done}</span>
                        </div>
                      )}

                      {/* Badges Overlay */}
                      <div className="absolute top-3 left-3 flex gap-2 flex-wrap z-10">
                        <span className="bg-black/60 backdrop-blur-md text-white border border-white/10 text-[10px] font-bold px-2.5 py-1 rounded-full shadow-lg">
                          {thumb.style} {t.Look}
                        </span>
                        {thumb.hasText && (
                          <span className="bg-rose-500/80 backdrop-blur-md text-white border border-rose-400/30 text-[10px] font-bold px-2.5 py-1 rounded-full shadow-lg">
                            {t.withText}
                          </span>
                        )}
                      </div>

                      {/* Inner Bottom Gradient for seamless text transition */}
                      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-slate-950 to-transparent opacity-90 pointer-events-none"></div>
                    </div>

                    {/* Body Content */}
                    <div className="p-5 flex-1 flex flex-col relative z-10 -mt-2">
                      {thumb.hasText && thumb.textText && (
                        <h3
                          className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-rose-600 dark:from-amber-200 dark:to-rose-300 font-black text-[13px] uppercase tracking-wide mb-2.5 line-clamp-2 drop-shadow-sm"
                          title={thumb.textText}
                        >
                          "{thumb.textText}"
                        </h3>
                      )}

                      <div className="relative group/prompt mb-4">
                        <p
                          className="text-[11px] text-slate-600 dark:text-slate-300/90 leading-relaxed line-clamp-3"
                          title={thumb.prompt}
                        >
                          {thumb.prompt}
                        </p>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(thumb.prompt);
                            setInfoMsg(t.Copied_thumbnail_prompt);
                          }}
                          className="absolute -top-2 right-0 bg-white/90 dark:bg-slate-800/80 backdrop-blur-md text-slate-600 dark:text-slate-300 p-1.5 rounded-lg border border-slate-200 dark:border-slate-600/50 opacity-0 group-hover/prompt:opacity-100 transition-all cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 shadow-xl"
                          title={t.Copy_Prompt}
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="bg-slate-100/50 dark:bg-slate-950/50 backdrop-blur-sm border border-slate-200/50 dark:border-slate-800/50 rounded-xl p-3 mb-4 space-y-2 mt-auto">
                        <div className="flex items-start gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 shrink-0 w-16">{t.Layout}:</span>
                          <span className="text-[11px] text-slate-700 dark:text-slate-300 font-medium line-clamp-2">{thumb.layout || (currentLang === "vi" ? "Bố cục 16:9" : "16:9 Composition")}</span>
                        </div>
                        {thumb.hasText ? (
                          <>
                            <div className="flex items-start gap-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 shrink-0 w-16">{t.Font}:</span>
                              <span className="text-[11px] text-slate-700 dark:text-slate-300 font-medium line-clamp-2">{thumb.typography}</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 shrink-0 w-16">{t.Color}:</span>
                              <span className="text-[11px] text-slate-700 dark:text-slate-300 font-medium line-clamp-2">{thumb.colorSuggestion}</span>
                            </div>
                          </>
                        ) : (
                          <div className="flex items-start gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 shrink-0 w-16">{currentLang === "vi" ? "Tiêu điểm" : "Focus"}:</span>
                            <span className="text-[11px] text-slate-700 dark:text-slate-300 font-medium line-clamp-2">{thumb.subjectFocus}</span>
                          </div>
                        )}
                      </div>

                      {/* Render Button Footer */}
                      <div className={!thumb.hasText ? "mt-auto pt-2" : "pt-1"}>
                        <button
                          onClick={() =>
                            handleRenderThumbnailImage(
                              thumb.id,
                              thumb.prompt,
                              thumb.style,
                            )
                          }
                          disabled={!!loadingStates["renderThumb_" + thumb.id]}
                          className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all duration-300 flex items-center justify-center gap-2 relative overflow-hidden group/btn disabled:opacity-75 disabled:cursor-not-allowed ${
                            thumb.imageUrl
                              ? "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 shadow border border-slate-200 dark:border-slate-700/50"
                              : "bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-500/20 border border-rose-500/30"
                          } active:scale-95`}
                          title={t.Render_YouTube_mockup_thu}
                        >
                          {loadingStates["renderThumb_" + thumb.id] ? (
                            <RefreshCw className="w-4 h-4 animate-spin text-white/80" />
                          ) : (
                            <Sparkles className={`w-4 h-4 ${thumb.imageUrl ? "text-slate-400" : "text-amber-300"}`} />
                          )}
                          <span className="relative z-10">
                            {loadingStates["renderThumb_" + thumb.id]
                              ? t.Drawing
                              : t.Render_Mockup}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={() => setCurrentStep(WizardStep.Storyboard)}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-xs px-5 py-3 rounded-lg transition-all cursor-pointer shadow"
          >
            <ArrowLeft className="w-4 h-4" />
            {t.Back}
          </button>
          <button
            onClick={() => setCurrentStep(WizardStep.SEOBoost)}
            className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs px-5 py-3 rounded-lg transition-all cursor-pointer shadow"
          >
            {t.Continue}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  );
}
