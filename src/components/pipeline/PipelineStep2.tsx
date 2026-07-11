import { cn } from "../../lib/utils";
import { PipelineWizardState } from "./usePipelineWizard";
import { Button } from "../ui/Button";
import { appError } from "../../lib/logger.js";
import { ErrorMessage, ThumbnailActionPosition } from "../../constants";

import * as LucideIcons from "lucide-react";

const { ImageIcon, RefreshCw, ChevronDown, Upload, X, Sparkles, Copy, Layout, ArrowLeft, ArrowRight, Download, Check, User, Type, Palette, Focus } = LucideIcons as any;

const handleDownloadImage = async (url: string, filename: string) => {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  } catch (error) {
    appError(ErrorMessage.FAILED_TO_FETCH, error);
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
};

import { WizardStep } from "../../types";

export default function PipelineStep2(props: PipelineWizardState) {
  const {
    t,
    project,
    setProject,
    setCurrentStep,
    loadingStates,
    setInfoMsg,
    setZoomedImage,
    handleThumbnailReferenceImagesUpload,
    handleExtractThumbnailStyle,
    handleApplyThumbnailStyle,
    handleTriggerAssetAndThumbnail,
    handleRenderThumbnailImage,
    handleRenderAllThumbnailImages,
    handleAnalyzeCharacter,
    handleCharacterImagesUpload,
    handleExtractCharacter,
    handleApplyCharacterToThumbnails,
  } = props;

  const handleUpdateCharacter = (charId: string, field: "name" | "description" | "prompt", value: string) => {
    setProject((prev) => {
      const updatedChars = (prev.visualConfig?.characters || []).map((c) => {
        if (c.id === charId) {
          return {
            ...c,
            [field]: value,
          };
        }
        return c;
      });
      return {
        ...prev,
        visualConfig: {
          ...prev.visualConfig,
          characters: updatedChars,
        },
      };
    });
  };

  return (
    <>
      <div className="bg-gradient-to-b from-slate-900/90 to-slate-950/95 border border-slate-800/85 rounded-xl p-6 space-y-6 shadow-2xl relative overflow-visible">
        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/[0.03] rounded-full blur-3xl pointer-events-none" />
        <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
          <div>
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-rose-500" />
              {t.assetMgr}
            </h3>
            <p className="text-slate-400 text-xs mt-1">{t.Select_visual_styles_defi}</p>
          </div>

          <Button
            variant="primary"
            onClick={() => handleTriggerAssetAndThumbnail(true, ThumbnailActionPosition.TOP)}
            disabled={!!loadingStates["assetAndThumbnail_loading"]}
            isLoading={!!loadingStates["assetAndThumbnail_loading"]}
            className="self-start sm:self-auto"
            title={t.Create_prompt_guides_and_}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{t.Generate_Thumbnails}</span>
          </Button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-6">
          <div className="lg:col-span-3 bg-slate-950/45 border border-slate-800 p-5 rounded-xl flex flex-col space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-xs text-slate-400 font-mono font-bold uppercase block">{t.Thumbnail_Prompts_Input}</label>
              <span className="text-[10px] text-slate-600 font-mono ring-1 ring-slate-800 px-1.5 py-0.5 rounded">{t.INPUT_STATE}</span>
            </div>
            <textarea
              value={project.scriptRewritten || ""}
              onChange={(e) =>
                setProject((prev) => ({
                  ...prev,
                  scriptRewritten: e.target.value,
                }))
              }
              placeholder={t.Empty_script_Paste_here}
              className="flex-1 bg-slate-900 border border-slate-800 rounded-lg p-3 w-full text-xs text-slate-300 leading-relaxed font-sans outline-none focus:border-rose-500 min-h-[120px] custom-scrollbar resize-none"
            />
          </div>
          <div className="lg:col-span-2 space-y-4 flex flex-col">
            <div className="flex items-center justify-between bg-slate-950/40 p-3 rounded-xl border border-slate-800/80">
              <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider pl-2">{t.Batch_Count}</span>
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
                  className="flex-1 bg-slate-900 border-none text-slate-200 text-xs font-semibold outline-none cursor-pointer appearance-none pr-6"
                >
                  <option value="1" className="bg-slate-950 text-slate-350">
                    1 {t.idea}
                  </option>
                  <option value="2" className="bg-slate-950 text-slate-350">
                    2 {t.ideas}
                  </option>
                  <option value="3" className="bg-slate-950 text-slate-350">
                    3 {t.ideas}
                  </option>
                  <option value="4" className="bg-slate-950 text-slate-350">
                    4 {t.ideas}
                  </option>
                  <option value="5" className="bg-slate-950 text-slate-350">
                    5 {t.ideas}
                  </option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 text-slate-500 w-3.5 h-3.5" />
              </div>
            </div>

            <div className="flex-1 flex flex-col animate-fade-in bg-slate-900/20 border border-slate-800/50 p-4 rounded-xl">
              <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider block mb-2">{t.Reference_Image_Optional}</span>
              <div className="flex flex-col gap-3 flex-1">
                <div
                  className="relative w-full border border-dashed border-slate-700/80 hover:border-rose-500/50 bg-slate-900/40 hover:bg-rose-955/20 rounded-xl flex flex-col items-center justify-center py-4 cursor-pointer transition-all group overflow-hidden flex-1"
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.add("border-rose-500", "bg-rose-955/30");
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove("border-rose-500", "bg-rose-955/30");
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove("border-rose-500", "bg-rose-955/30");
                    if (e.dataTransfer.files) {
                      handleThumbnailReferenceImagesUpload(e.dataTransfer.files);
                    }
                  }}
                >
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      if (e.target.files) {
                        handleThumbnailReferenceImagesUpload(e.target.files);
                        e.target.value = "";
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="p-2 bg-slate-950 rounded-xl border border-slate-800 group-hover:scale-110 group-hover:border-rose-500/30 transition-all duration-300 mb-1 shadow-lg">
                    <Upload className="w-4 h-4 text-slate-400 group-hover:text-rose-450 transition-colors" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-200">{t.Upload_style_images}</span>
                </div>

                {project.visualConfig?.thumbnailReferenceImages && project.visualConfig.thumbnailReferenceImages.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {project.visualConfig.thumbnailReferenceImages.map((imgBase64, idx) => (
                      <div key={idx} className="relative w-16 h-16 rounded-lg group shadow-sm">
                        <div className="w-full h-full border border-slate-800 bg-black rounded-lg overflow-hidden">
                          <img src={imgBase64} alt={`Style reference ${idx + 1}`} className="w-full h-full object-cover opacity-90 transition-opacity group-hover:opacity-100" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-lg"></div>
                        </div>
                        <Button
                          variant="primary"
                          size="xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            setProject((prev) => {
                              const updated = [...(prev.visualConfig?.thumbnailReferenceImages || [])];
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
                          className="absolute -top-2 -right-2 w-5 h-5 bg-rose-500 hover:bg-rose-600 border border-rose-400/50 rounded-full flex items-center justify-center text-white transition-all z-20 backdrop-blur-sm opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 shadow-md p-0"
                          title={t.Remove}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {project.visualConfig?.thumbnailReferenceImages && project.visualConfig.thumbnailReferenceImages.length > 0 && (
                  <div className="pt-2 flex flex-col gap-2 border-t border-slate-800/50">
                    {project.visualConfig?.thumbnailReferencePrompt && (
                      <div className="bg-rose-955/20 border border-rose-500/30 rounded-md p-2 flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-rose-450 font-bold text-[9px] mb-0.5 uppercase tracking-wider flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5" /> {t.Style}
                          </h4>
                          <p className="text-slate-300 text-[10px] leading-relaxed line-clamp-1" title={project.visualConfig.thumbnailReferencePrompt}>
                            {project.visualConfig.thumbnailReferencePrompt}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => {
                            navigator.clipboard.writeText(project.visualConfig.thumbnailReferencePrompt || "");
                            setInfoMsg(t.Style_copied);
                          }}
                          className="shrink-0 p-1 bg-rose-950/40 hover:bg-rose-900 border border-rose-500/30 rounded text-rose-450 transition-colors h-auto w-auto hover:text-rose-400 shadow-none"
                          title={t.Copy_style}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleExtractThumbnailStyle}
                        disabled={!!loadingStates["extractThumbnailStyle"]}
                        isLoading={!!loadingStates["extractThumbnailStyle"]}
                        className="flex-1 text-white font-bold text-[10px] active:scale-95"
                      >
                        <Sparkles className="w-3 h-3 text-rose-100" />
                        <span>{t.Extract_Style}</span>
                      </Button>
                      {project.visualConfig?.thumbnailReferencePrompt && project?.thumbnails?.length && (
                        <Button
                          variant="ghost"
                          type="button"
                          onClick={handleApplyThumbnailStyle}
                          disabled={!!loadingStates["applyThumbnailStyle"]}
                          isLoading={!!loadingStates["applyThumbnailStyle"]}
                          className="flex-1 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 hover:text-white disabled:from-slate-800 disabled:to-slate-850 disabled:opacity-75 disabled:cursor-not-allowed text-white font-bold text-[10px] rounded flex items-center justify-center gap-1.5 shadow-none transition-all cursor-pointer border border-amber-500/30 active:scale-95 py-2 h-auto"
                        >
                          <Check className="w-3 h-3 text-amber-100" />
                          <span>{t.Apply_Style}</span>
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-950/40 p-5 rounded-xl border border-slate-850/60 space-y-4 text-left relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/[0.02] rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-rose-450 flex items-center gap-1.5 select-none">
              <span>{t.charConsistencyTitle}</span>
              <span className="text-[9px] bg-emerald-950/45 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-mono font-normal flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                CHARACTER REFERENCE NODE
              </span>
            </h4>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-3 shadow-inner">
            {!project.visualConfig?.characters || project.visualConfig.characters.length === 0 ? (
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 text-[11px] text-slate-355 leading-relaxed italic">{t.charNotAnalyzed}</div>
                <Button type="button" variant="primary" onClick={handleAnalyzeCharacter} disabled={!!loadingStates["analyzeCharacter"]} size="sm">
                  {loadingStates["analyzeCharacter"] ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  {t.charAnalyzeBtn}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                  <span className="text-[10px] text-slate-400 font-mono">{t.charDetectedCount.replace("{count}", project.visualConfig.characters.length.toString())}</span>
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="secondary" onClick={handleAnalyzeCharacter} disabled={!!loadingStates["analyzeCharacter"]} size="xs">
                      <RefreshCw className={cn(`w-2.5 h-2.5 ${loadingStates["analyzeCharacter"] ? "animate-spin" : ""}`)} />
                      {t.charReAnalyze}
                    </Button>
                    {project.visualConfig.characters.some((c) => c.prompt || c.description) && project.thumbnails && project.thumbnails.length > 0 && (
                      <Button
                        type="button"
                        variant="primary"
                        onClick={handleApplyCharacterToThumbnails}
                        disabled={!!loadingStates["applyCharacter"]}
                        isLoading={!!loadingStates["applyCharacter"]}
                        className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 hover:text-white disabled:from-slate-800 disabled:to-slate-850 disabled:opacity-75 disabled:cursor-not-allowed text-white font-bold text-[10px] px-3 py-1.5 rounded flex items-center justify-center gap-1.5 transition-all shadow-none border border-amber-500/30 active:scale-95 h-auto"
                      >
                        <Check className="w-2.5 h-2.5 text-amber-100" />
                        <span>{t.Apply_Character_Thumbnails}</span>
                      </Button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {project.visualConfig.characters.map((char) => {
                    const isExtracting = !!loadingStates[`extractCharacter_${char.id}`];
                    return (
                      <div key={char.id} className="bg-slate-955/65 rounded-xl p-3 border border-slate-855 flex flex-col justify-between gap-2.5 relative shadow-md">
                        <div className="flex flex-row gap-3 items-stretch">
                          <div className="flex-1 min-w-0 flex flex-col justify-between">
                            <div>
                              <div className="flex items-center justify-between gap-1">
                                <h4 className="text-[11px] font-bold text-rose-350 flex items-center gap-1 min-w-0 flex-1">
                                  <User className="w-3 h-3 text-rose-500 shrink-0" />
                                  <input
                                    type="text"
                                    value={char.name}
                                    onChange={(e) => handleUpdateCharacter(char.id, "name", e.target.value)}
                                    className="bg-slate-900 hover:bg-slate-850 focus:bg-slate-900 border border-transparent hover:border-slate-800/80 focus:border-rose-500/50 rounded px-1 py-0.5 text-[11px] font-bold text-rose-350 outline-none w-full transition-all"
                                    placeholder={t.charNamePlaceholder}
                                  />
                                </h4>
                                <Button
                                  variant="ghost"
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(`${char.name}: ${char.description}`);
                                    setInfoMsg(t.charDescCopied);
                                    setTimeout(() => setInfoMsg(""), 3000);
                                  }}
                                  title={t.charCopyDesc}
                                  className="shrink-0 p-0.5 bg-slate-900 hover:bg-slate-850 border border-slate-855 rounded text-slate-400 hover:text-slate-205 transition-colors shadow-none h-auto w-auto"
                                >
                                  <Copy className="w-2.5 h-2.5" />
                                </Button>
                              </div>
                              <textarea
                                value={char.description}
                                onChange={(e) => handleUpdateCharacter(char.id, "description", e.target.value)}
                                className="w-full text-[9px] text-slate-400 mt-1.5 leading-relaxed bg-slate-900/30 hover:bg-slate-900 focus:bg-slate-900 border border-slate-855/50 hover:border-slate-700/60 focus:border-rose-500/30 p-1.5 rounded outline-none resize-none h-16 transition-all scrollbar-thin scrollbar-thumb-slate-800"
                                placeholder={t.charBioPlaceholder}
                                title={char.description}
                              />
                            </div>
                          </div>

                          <div className="w-[1px] bg-slate-800/80 my-1 self-stretch" />

                          <div className="w-24 sm:w-28 shrink-0 flex flex-col gap-1.5 justify-between">
                            <div
                              className="bg-slate-900/40 border border-dashed border-slate-800 hover:border-emerald-500/50 rounded p-1.5 transition-all flex flex-col items-center justify-center text-center relative group cursor-pointer h-[42px]"
                              onDragOver={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                              }}
                              onDrop={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (e.dataTransfer.files) {
                                  handleCharacterImagesUpload(char.id, e.dataTransfer.files);
                                }
                              }}
                            >
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={(e) => {
                                  if (e.target.files) {
                                    handleCharacterImagesUpload(char.id, e.target.files);
                                    e.target.value = "";
                                  }
                                }}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                              />
                              <Upload className="w-2.5 h-2.5 text-slate-500 group-hover:text-emerald-400 mb-0.5" />
                              <span className="text-[7px] font-bold text-slate-350 block leading-tight truncate max-w-[80px]">{t.charUploadFor.replace("{name}", char.name)}</span>
                            </div>

                            <div className="min-w-0 w-full">
                              {char.images && char.images.length > 0 ? (
                                <div className="flex flex-wrap gap-1 max-h-[32px] overflow-y-auto p-0.5 bg-slate-900/10 rounded border border-slate-900/30">
                                  {char.images.map((imgBase64, idx) => (
                                    <div key={idx} className="relative w-6 h-6 rounded group shadow-sm">
                                      <div className="w-full h-full border border-slate-800 bg-black rounded overflow-hidden">
                                        <img src={imgBase64} alt={`${char.name} ref ${idx + 1}`} className="w-full h-full object-cover opacity-90 transition-opacity group-hover:opacity-100" />
                                      </div>
                                      <Button
                                        variant="ghost"
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setProject((prev) => {
                                            const updatedChars = (prev.visualConfig?.characters || []).map((c) => {
                                              if (c.id === char.id) {
                                                const newImgs = [...(c.images || [])];
                                                newImgs.splice(idx, 1);
                                                return {
                                                  ...c,
                                                  images: newImgs,
                                                };
                                              }
                                              return c;
                                            });
                                            return {
                                              ...prev,
                                              visualConfig: {
                                                ...prev.visualConfig,
                                                characters: updatedChars,
                                                characterImages: updatedChars[0]?.images || [],
                                              },
                                            };
                                          });
                                        }}
                                        className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 hover:bg-rose-600 hover:text-white border border-rose-400/50 rounded-full flex items-center justify-center text-white transition-all z-20 backdrop-blur-sm opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 shadow-none p-0 cursor-pointer h-auto min-w-0"
                                      >
                                        <X className="w-1.5 h-1.5" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="flex items-center justify-center py-1 bg-slate-950/20 border border-dashed border-slate-900 rounded text-[7px] text-slate-500 italic text-center whitespace-nowrap">{t.noImageYet}</div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="border-t border-slate-900/60 pt-2 space-y-2">
                          {char.prompt && (
                            <div className="bg-emerald-950/15 border border-emerald-500/20 rounded p-1.5 flex flex-col gap-1">
                              <div className="flex items-center justify-between">
                                <h4 className="text-emerald-400 font-bold text-[8px] uppercase tracking-wider flex items-center gap-1">
                                  <Sparkles className="w-2 h-2 text-emerald-400" /> {t.charPromptTitle}
                                </h4>
                                <Button
                                  variant="ghost"
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(char.prompt || "");
                                    setInfoMsg(t.charCopied);
                                    setTimeout(() => setInfoMsg(""), 3000);
                                  }}
                                  className="shrink-0 p-0.5 bg-emerald-900/40 hover:bg-emerald-800/60 border border-emerald-500/20 rounded text-emerald-400 transition-colors shadow-none h-auto w-auto"
                                >
                                  <Copy className="w-2.5 h-2.5" />
                                </Button>
                              </div>
                              <textarea
                                value={char.prompt}
                                onChange={(e) => handleUpdateCharacter(char.id, "prompt", e.target.value)}
                                className="w-full text-slate-350 text-[8px] leading-relaxed italic bg-emerald-950/10 hover:bg-emerald-950/20 focus:bg-emerald-950/30 border border-emerald-500/10 hover:border-emerald-500/30 focus:border-emerald-500/50 p-1.5 rounded outline-none resize-none h-12 transition-all font-sans scrollbar-thin scrollbar-thumb-emerald-900"
                                placeholder={t.charFeaturePlaceholder}
                                title={char.prompt}
                              />
                            </div>
                          )}

                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => handleExtractCharacter(char.id)}
                            disabled={isExtracting || !char.images?.length}
                            className="w-full py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 hover:text-white disabled:from-slate-800 disabled:to-slate-850 disabled:opacity-75 disabled:cursor-not-allowed text-white font-bold text-[9px] rounded flex items-center justify-center gap-1 shadow-none transition-all cursor-pointer border border-emerald-500/30 h-auto"
                          >
                            {isExtracting ? (
                              <>
                                <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                                <span>{t.charExtractingBtn}</span>
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-2.5 h-2.5 text-emerald-100" />
                                <span>{t.charExtractBtn}</span>
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-slate-800 pt-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h4 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Layout className="w-5 h-5 text-rose-500" />
              {t.thumbnailHeader}
            </h4>
            {project.thumbnails && project.thumbnails.length > 0 && (
              <Button
                variant="primary"
                onClick={handleRenderAllThumbnailImages}
                disabled={!!loadingStates["renderAllThumbs_loading"]}
                isLoading={!!loadingStates["renderAllThumbs_loading"]}
                className="flex items-center gap-1.5 shadow-md text-xs font-bold bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 border border-rose-500/30 active:scale-95 transition-all text-white py-2 h-auto"
                title={t.bulkRenderThumbnails_loading}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                <span>{t.bulkRenderThumbnails}</span>
              </Button>
            )}
          </div>

          {!project.thumbnails || project.thumbnails.length === 0 ? (
            loadingStates["assetAndThumbnail_loading"] ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full animate-pulse">
                {[1, 2].map((idx) => (
                  <div key={idx} className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-lg flex flex-col sm:flex-row p-4 gap-4">
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
              <div className="bg-slate-950/30 border border-slate-800/80 rounded-xl p-10 text-center flex flex-col items-center justify-center max-w-md mx-auto space-y-4 group hover:border-slate-700/60 transition-all duration-300">
                <div className="w-12 h-12 bg-slate-900 border border-slate-800 rounded-full flex items-center justify-center text-rose-500 shadow-md group-hover:scale-105 transition-all duration-300 animate-pulse">
                  <ImageIcon className="w-5 h-5 text-rose-500" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold font-mono tracking-wider text-slate-300 uppercase">{t.No_Thumbnail_Prompts}</h4>
                  <p className="text-[11px] text-slate-400 max-w-xs leading-relaxed">{t.Draft_eye_catching_visual}</p>
                </div>
                <Button
                  variant="secondary"
                  onClick={() => handleTriggerAssetAndThumbnail(true, ThumbnailActionPosition.EMPTY)}
                  disabled={!!loadingStates["assetAndThumbnail_loading"]}
                  isLoading={!!loadingStates["assetAndThumbnail_loading"]}
                  className="bg-rose-950/40 text-rose-300 hover:text-white hover:bg-rose-600 border border-rose-500/20 hover:border-rose-500 text-[10px] flex items-center justify-center gap-1.5"
                  title={t.Draft_visual_arrangements}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                  <span>{t.Generate_Thumbnail}</span>
                </Button>
              </div>
            )
          ) : (
            <div className="relative">
              {loadingStates["assetAndThumbnail_loading"] && (
                <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md rounded-xl z-20 flex flex-col items-center justify-center p-8 text-center space-y-4 border border-rose-500/10">
                  <div className="p-4 bg-rose-500/10 rounded-full border border-rose-500/20 animate-spin">
                    <Sparkles className="w-8 h-8 text-rose-500" />
                  </div>
                  <div className="space-y-1 max-w-sm">
                    <p className="font-bold text-slate-205 text-sm">{t.Drafting_CTR_thumbnail}</p>
                    <p className="text-[11px] text-slate-455 font-sans leading-relaxed">{t.Drafting_eye_catching_vis}</p>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {(project.thumbnails || []).map((thumb) => (
                  <div key={thumb.id} className="bg-slate-900 border border-slate-800/80 hover:border-rose-500/55 rounded-xl overflow-hidden shadow-md hover:shadow-2xl hover:shadow-rose-500/[0.04] transition-all duration-350 cursor-pointer group flex flex-col hover:scale-[1.02] hover:-translate-y-0.5">
                    <div className="aspect-video relative overflow-hidden shrink-0 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                      {thumb.imageUrl ? (
                        <>
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
                        </>
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-rose-500/20 to-orange-500/20 flex flex-col items-center justify-center pointer-events-none">
                          <ImageIcon className="w-8 h-8 text-rose-500/50 mb-2" />
                          <span className="text-slate-500/50 font-mono text-[10px] tracking-widest uppercase">{t.No_Render_Done}</span>
                        </div>
                      )}
                      <div className="absolute top-3 left-3 flex gap-2 flex-wrap z-10">
                        <span className="bg-black/60 backdrop-blur-md text-white border border-white/10 text-[10px] font-bold px-2.5 py-1 rounded-full shadow-lg">
                          {thumb.style} {t.Look}
                        </span>
                        {thumb.hasText && <span className="bg-rose-500/80 backdrop-blur-md text-white border border-rose-400/30 text-[10px] font-bold px-2.5 py-1 rounded-full shadow-lg">{t.withText}</span>}
                      </div>
                      <div className="absolute inset-x-0 -bottom-2 h-2/3 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent pointer-events-none z-10"></div>
                    </div>
                    <div className="px-5 pb-5 pt-4 flex-1 flex flex-col relative z-20 bg-slate-900 rounded-b-xl -mt-1">
                      {thumb.hasText && thumb.textText && (
                        <h3 className="text-transparent bg-clip-text bg-gradient-to-br from-amber-500 to-rose-500 font-black text-[15px] uppercase tracking-tight mb-3 line-clamp-2 drop-shadow-md" title={thumb.textText}>
                          "{thumb.textText}"
                        </h3>
                      )}

                      <div className="relative group/prompt mb-3">
                        <p className="text-[11px] text-slate-400 font-medium italic leading-relaxed line-clamp-3" title={thumb.prompt}>
                          "{thumb.prompt}"
                        </p>
                        <Button
                          variant="ghost"
                          onClick={() => {
                            navigator.clipboard.writeText(thumb.prompt);
                            setInfoMsg(t.Copied_thumbnail_prompt);
                          }}
                          className="absolute -top-2 right-0 bg-slate-900/90 backdrop-blur-md text-slate-300 p-1.5 rounded-full border border-slate-700/50 opacity-0 group-hover/prompt:opacity-100 transition-all cursor-pointer hover:bg-slate-850 shadow-xl h-auto w-auto hover:text-white"
                          title={t.Copy_Prompt}
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </Button>
                      </div>

                      <div className="mt-auto mb-5 space-y-2.5 pt-4 border-t border-slate-800/50">
                        <div className="flex items-center gap-3 text-[10.5px]">
                          <div className="w-7 h-7 rounded-lg bg-slate-800/40 flex items-center justify-center shrink-0 border border-slate-700/40 text-rose-500/80 shadow-inner">
                            <Layout className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
                            <span className="font-extrabold uppercase tracking-widest text-slate-500 text-[8px]">{t.Layout}</span>
                            <span className="text-slate-200 font-bold truncate" title={thumb.layout || t.composition169}>{thumb.layout || t.composition169}</span>
                          </div>
                        </div>
                        {thumb.hasText ? (
                          <>
                            <div className="flex items-center gap-3 text-[10.5px]">
                              <div className="w-7 h-7 rounded-lg bg-slate-800/40 flex items-center justify-center shrink-0 border border-slate-700/40 text-indigo-400/80 shadow-inner">
                                <Type className="w-3.5 h-3.5" />
                              </div>
                              <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
                                <span className="font-extrabold uppercase tracking-widest text-slate-500 text-[8px]">{t.Font}</span>
                                <span className="text-slate-200 font-bold truncate" title={thumb.typography}>{thumb.typography}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 text-[10.5px]">
                              <div className="w-7 h-7 rounded-lg bg-slate-800/40 flex items-center justify-center shrink-0 border border-slate-700/40 text-amber-400/80 shadow-inner">
                                <Palette className="w-3.5 h-3.5" />
                              </div>
                              <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
                                <span className="font-extrabold uppercase tracking-widest text-slate-500 text-[8px]">{t.Color}</span>
                                <span className="text-slate-200 font-bold truncate" title={thumb.colorSuggestion}>{thumb.colorSuggestion}</span>
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="flex items-center gap-3 text-[10.5px]">
                            <div className="w-7 h-7 rounded-lg bg-slate-800/40 flex items-center justify-center shrink-0 border border-slate-700/40 text-emerald-400/80 shadow-inner">
                              <Focus className="w-3.5 h-3.5" />
                            </div>
                            <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
                              <span className="font-extrabold uppercase tracking-widest text-slate-500 text-[8px]">{t.focusTitle}</span>
                              <span className="text-slate-200 font-bold truncate" title={thumb.subjectFocus}>{thumb.subjectFocus}</span>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className={(!thumb.hasText ? "mt-auto pt-2" : "pt-1") + (thumb.imageUrl ? " flex gap-2 w-full" : "")}>
                        <Button
                          variant="primary"
                          onClick={() => handleRenderThumbnailImage(thumb.id, thumb.prompt, thumb.style)}
                          disabled={!!loadingStates["renderThumb_" + thumb.id]}
                          isLoading={!!loadingStates["renderThumb_" + thumb.id]}
                          className={cn(`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 flex items-center justify-center gap-2 relative overflow-hidden group/btn ${thumb.imageUrl ? "bg-slate-800 hover:bg-slate-700 text-slate-200 shadow border border-slate-700/50" : "bg-gradient-to-br from-rose-600 to-red-500 hover:from-rose-500 hover:to-red-400 text-white shadow-lg shadow-rose-500/20 border border-rose-500/30"
                            } active:scale-95`)}
                          title={t.Render_YouTube_mockup_thu}
                        >
                          <Sparkles className={cn(`w-4 h-4 ${thumb.imageUrl ? "text-slate-400" : "text-amber-300"}`)} />
                          <span className="relative z-10">{t.Render_Mockup}</span>
                        </Button>
                        {thumb.imageUrl && (
                          <Button
                            variant="secondary"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadImage(thumb.imageUrl!, `thumbnail-${thumb.id || "idea"}-${thumb.style || "Look"}.png`);
                            }}
                            className="shrink-0 p-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700/50 rounded-xl text-slate-200 transition-all active:scale-95 cursor-pointer flex items-center justify-center shadow"
                            title={t.downloadImage}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
          <Button variant="secondary" size="md" onClick={() => setCurrentStep(WizardStep.Storyboard)} className="flex items-center gap-1.5 px-5 py-3 shadow">
            <ArrowLeft className="w-4 h-4" />
            {t.Back}
          </Button>
          <Button variant="primary" size="md" onClick={() => setCurrentStep(WizardStep.SEOBoost)} className="flex items-center gap-1.5 px-5 py-3 shadow">
            {t.Continue}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </>
  );
}
