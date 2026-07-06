import { formatCleanTime } from '../../lib/timeUtils';
import { PipelineWizardState } from './usePipelineWizard';
import * as LucideIcons from 'lucide-react';

const { Eye, Download, Video, ArrowLeft } = LucideIcons as any;

import { WizardStep } from '../../types';
import { EXPORT_TYPES } from '../../constants/enums';
import { EXPORT_LOADING_TEXTS, EXPORT_URLS } from '../../constants/texts';

function getExportLoadingConfig(
  loadingExportType: EXPORT_TYPES | null | undefined,
  isOfflineRendering: boolean,
  lang: 'vi' | 'en',
  t: any
) {
  const isExporting = !!loadingExportType || isOfflineRendering;
  const ActiveIcon = isOfflineRendering ? Video : Download;

  if (!isExporting) {
    return { isExporting, exportTitle: "", exportDesc: "", ActiveIcon };
  }

  const texts = EXPORT_LOADING_TEXTS[lang];

  if (isOfflineRendering) {
    return {
      isExporting,
      exportTitle: t.exportingVideo || texts.VIDEO_TITLE,
      exportDesc: t.waitExportProcess || texts.VIDEO_DESC,
      ActiveIcon,
    };
  }

  const exportConfigs: Record<EXPORT_TYPES, { title: string; desc: string }> = {
    [EXPORT_TYPES.CAPCUT]: {
      title: t.exportingCapcut || texts.CAPCUT_TITLE,
      desc: t.Exports_timeline_JSON_fil || "",
    },
    [EXPORT_TYPES.PREMIERE]: {
      title: texts.XML_TITLE,
      desc: t.Construct_XML_track_metad || "",
    },
    [EXPORT_TYPES.ZIP]: {
      title: t.packagingZip || texts.ZIP_TITLE,
      desc: t.Download_complete_CapCut_ || "",
    },
    [EXPORT_TYPES.SRT]: {
      title: t.exportingSRT || texts.SRT_TITLE,
      desc: t.Extract_synced_subtitle_t || "",
    },
  };

  const config = loadingExportType ? exportConfigs[loadingExportType] : null;

  return {
    isExporting,
    exportTitle: config?.title || "",
    exportDesc: config?.desc || "",
    ActiveIcon,
  };
}

export default function PipelineStep4(props: PipelineWizardState) {
  const { t, project, setCurrentStep, setInfoMsg, getMotionLabel, isOfflineRendering, isPlayingSim, simActiveScene, handleOfflineRenderWebM, startPlaybackSim, stopPlaybackSim, getSceneImageUrl, handleDownloadJSONProject, handleDownloadSRT, handleDownloadCapcutLink, handleDownloadPremiereXML, loadingExportType } = props;

  const lang = project.config.language === 'en' ? 'en' : 'vi';
  const { isExporting, exportTitle, exportDesc, ActiveIcon } = getExportLoadingConfig(
    loadingExportType as EXPORT_TYPES,
    isOfflineRendering,
    lang,
    t
  );

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        { }
        <div className="lg:col-span-2 bg-gradient-to-b from-slate-900/90 to-slate-950/95 border border-slate-800/85 p-6 rounded-2xl space-y-4 shadow-2xl relative overflow-visible">
          <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/[0.03] rounded-full blur-3xl pointer-events-none" />
          <h3 className="font-bold text-slate-100 text-base flex items-center gap-2 relative z-10">
            <Eye className="w-5 h-5 text-rose-500" />
            {t.renderTitle}
          </h3>

          { }
          <div className="aspect-[16/9] bg-slate-950 border border-slate-800 rounded-xl relative overflow-hidden flex items-center justify-center">
            {simActiveScene ? (
              <>
                {getSceneImageUrl(simActiveScene) ? (
                  <div className="w-full h-full relative">
                    <img
                      referrerPolicy="no-referrer"
                      src={getSceneImageUrl(simActiveScene)}
                      alt={t.rendering_visual}
                      className={`w-full h-full object-cover transition-transform duration-1000 ${isPlayingSim &&
                        simActiveScene.cameraMotion === "Zoom In"
                        ? "scale-110"
                        : isPlayingSim &&
                          simActiveScene.cameraMotion === "Zoom Out"
                          ? "scale-90"
                          : ""
                        }`}
                    />
                    {!simActiveScene.assetUrl && (
                      <div className="absolute top-3 right-3 bg-rose-600/90 text-white text-[9px] font-bold px-2 py-0.5 rounded shadow z-10">
                        {t.Default_Timeline_Image}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center p-6 text-slate-600 font-mono text-xs">
                    {t.noPhotoRenderedYet.replace('{sceneId}', simActiveScene.id)}
                  </div>
                )}

                { }
                <div className="absolute bottom-6 left-4 right-4 text-center">
                  <span className="bg-black/85 text-amber-300 font-bold px-4 py-2 rounded border border-slate-800 text-xs sm:text-sm font-sans tracking-wide">
                    {simActiveScene.subtitle}
                  </span>
                </div>

                { }
                <div className="absolute top-3 left-3 bg-slate-950/80 text-[10px] font-mono text-slate-400 p-2 rounded border border-slate-850 flex flex-col">
                  <span>
                    {t.Scene}:{" "}
                    {simActiveScene.id} (
                    {formatCleanTime(simActiveScene.startTime)} -{" "}
                    {formatCleanTime(simActiveScene.endTime)})
                  </span>
                  <span>
                    {t.Camera_VFX}
                    : {getMotionLabel(simActiveScene.cameraMotion)}
                  </span>
                </div>
              </>
            ) : (
              <div className="text-center text-slate-500 text-xs">
                {t.Nothing_to_simulate}
              </div>
            )}
          </div>

          { }
          <div className="flex items-center justify-between gap-4 py-2 border-t border-slate-850">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <span>
                {t.SIMULATOR_STATUS}
              </span>
              <span
                className={
                  isPlayingSim ? "text-emerald-400" : "text-amber-400"
                }
              >
                {isPlayingSim
                  ? t.ACTIVE_RUNNING
                  : t.PAUSED}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {isPlayingSim ? (
                <button
                  onClick={stopPlaybackSim}
                  className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs px-4 py-2 rounded-lg cursor-pointer"
                >
                  {t.Stop_Simulation}
                </button>
              ) : (
                <button
                  onClick={startPlaybackSim}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-lg cursor-pointer"
                >
                  {t.Play_Simulation}
                </button>
              )}
            </div>
          </div>
        </div>

        { }
        <div className="bg-gradient-to-b from-slate-900/90 to-slate-950/95 border border-slate-800/85 p-6 rounded-2xl space-y-6 shadow-2xl relative overflow-visible">
          <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/[0.03] rounded-full blur-3xl pointer-events-none" />
          <h3 className="font-bold text-slate-100 text-base relative z-10">
            {t.Professional_Project_Pack}
          </h3>

          <div className="grid grid-cols-1 gap-3.5 text-xs">
            { }
            <button
              onClick={handleDownloadCapcutLink}
              disabled={loadingExportType === EXPORT_TYPES.CAPCUT}
              className="w-full flex items-center justify-between p-3.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-xl text-slate-200 transition-colors cursor-pointer text-left disabled:opacity-50"
            >
              <div>
                <span className="font-bold block flex items-center gap-1.5">
                  {loadingExportType === EXPORT_TYPES.CAPCUT && <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
                  {loadingExportType === EXPORT_TYPES.CAPCUT ? t.exportingCapcut : t.exportCapcut}
                </span>
                <span className="text-[10px] text-slate-500">
                  {t.Exports_timeline_JSON_fil}
                </span>
              </div>
              {loadingExportType === EXPORT_TYPES.CAPCUT ? (
                <div className="w-5 h-5 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin shrink-0" />
              ) : (
                <Download className="w-5 h-5 text-slate-400 shrink-0" />
              )}
            </button>

            { }
            <button
              onClick={handleDownloadPremiereXML}
              disabled={loadingExportType === EXPORT_TYPES.PREMIERE}
              className="w-full flex items-center justify-between p-3.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-xl text-slate-200 transition-colors cursor-pointer text-left disabled:opacity-50"
            >
              <div>
                <span className="font-bold block flex items-center gap-1.5">
                  {loadingExportType === EXPORT_TYPES.PREMIERE && <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
                  {loadingExportType === EXPORT_TYPES.PREMIERE ? t.exportingPremiere : t.exportPremiere}
                </span>
                <span className="text-[10px] text-slate-500">
                  {t.Construct_XML_track_metad}
                </span>
              </div>
              {loadingExportType === EXPORT_TYPES.PREMIERE ? (
                <div className="w-5 h-5 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin shrink-0" />
              ) : (
                <Download className="w-5 h-5 text-slate-400 shrink-0" />
              )}
            </button>

            { }
            <button
              onClick={handleDownloadPremiereXML}
              disabled={loadingExportType === EXPORT_TYPES.PREMIERE}
              className="w-full flex items-center justify-between p-3.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-xl text-slate-200 transition-colors cursor-pointer text-left disabled:opacity-50"
            >
              <div>
                <span className="font-bold block flex items-center gap-1.5">
                  {loadingExportType === EXPORT_TYPES.PREMIERE && <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
                  {loadingExportType === EXPORT_TYPES.PREMIERE ? t.exportingDavinci : t.exportDavinci}
                </span>
                <span className="text-[10px] text-slate-500">
                  {t.Download_FCPXML_timing_fi}
                </span>
              </div>
              {loadingExportType === EXPORT_TYPES.PREMIERE ? (
                <div className="w-5 h-5 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin shrink-0" />
              ) : (
                <Download className="w-5 h-5 text-slate-400 shrink-0" />
              )}
            </button>

            { }
            <button
              onClick={handleOfflineRenderWebM}
              disabled={isOfflineRendering}
              className={`w-full flex items-center justify-between p-3.5 border rounded-xl text-left transition-all cursor-pointer ${isOfflineRendering
                ? "bg-slate-950 border-slate-900 text-slate-500"
                : "bg-gradient-to-r from-rose-950/30 to-slate-950 hover:to-slate-850 border-rose-950 text-slate-200"
                }`}
            >
              <div>
                <span className="font-bold block text-rose-400 flex items-center gap-1.5">
                  {isOfflineRendering ? (
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  ) : (
                    <span className="inline-block w-2 h-2 rounded-full bg-rose-500" />
                  )}
                  {isOfflineRendering ? t.exportingVideo : t.renderingWebM}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  {isOfflineRendering
                    ? t.waitExportProcess
                    : t.Render_and_compile_full_p}
                </span>
              </div>
              {isOfflineRendering ? (
                <div className="w-5 h-5 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin shrink-0" />
              ) : (
                <Video className="w-5 h-5 text-rose-500 shrink-0" />
              )}
            </button>

            { }
            <button
              onClick={handleDownloadJSONProject}
              disabled={loadingExportType === EXPORT_TYPES.ZIP}
              className="w-full flex items-center justify-between p-3.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-xl text-slate-200 transition-colors cursor-pointer text-left disabled:opacity-50"
            >
              <div>
                <span className="font-bold block flex items-center gap-1.5">
                  {loadingExportType === EXPORT_TYPES.ZIP && <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
                  {loadingExportType === EXPORT_TYPES.ZIP ? t.packagingZip : t.downloadZip}
                </span>
                <span className="text-[10px] text-slate-500">
                  {t.Download_complete_CapCut_}
                </span>
              </div>
              {loadingExportType === EXPORT_TYPES.ZIP ? (
                <div className="w-5 h-5 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin shrink-0" />
              ) : (
                <Download className="w-5 h-5 text-slate-400 shrink-0" />
              )}
            </button>

            { }
            <button
              onClick={handleDownloadSRT}
              disabled={loadingExportType === EXPORT_TYPES.SRT}
              className="w-full flex items-center justify-between p-3.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-xl text-slate-200 transition-colors cursor-pointer text-left disabled:opacity-50"
            >
              <div>
                <span className="font-bold block flex items-center gap-1.5">
                  {loadingExportType === EXPORT_TYPES.SRT && <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
                  {loadingExportType === EXPORT_TYPES.SRT ? t.exportingSRT : t.Download_SRT}
                </span>
                <span className="text-[10px] text-slate-500">
                  {t.Extract_synced_subtitle_t}
                </span>
              </div>
              {loadingExportType === EXPORT_TYPES.SRT ? (
                <div className="w-5 h-5 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin shrink-0" />
              ) : (
                <Download className="w-5 h-5 text-slate-400 shrink-0" />
              )}
            </button>
          </div>

          { }
          <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-2">
            <span className="text-[10px] text-slate-500 font-mono font-bold block uppercase">
              {t.Cloud_Exporter_Sync_Setup}
            </span>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder={EXPORT_URLS.DEFAULT_S3_BUCKET}
                className="w-full bg-slate-900 text-slate-350 text-[11px] p-2 rounded focus:outline-none placeholder-slate-600 border border-slate-800"
              />
              <button
                onClick={() =>
                  setInfoMsg(
                    t.Configured_bucket_coordin,
                  )
                }
                className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] px-3.5 rounded"
              >
                {t.Save}
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-start mt-6">
            <button
              onClick={() => setCurrentStep(WizardStep.SEOBoost)}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-xs px-5 py-3 rounded-lg transition-all cursor-pointer shadow"
            >
              <ArrowLeft className="w-4 h-4" />
              {t.Back}
            </button>
          </div>

          {isExporting && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-slate-950/80 backdrop-blur-[3px] z-20 rounded-2xl border border-emerald-500/20">
              <div className="p-3 bg-emerald-500/10 rounded-full border border-emerald-500/20 mb-3 animate-bounce">
                <ActiveIcon className="w-6 h-6 text-emerald-500 animate-pulse" />
              </div>
              <p className="font-bold text-emerald-400 text-xs text-center font-mono tracking-wider uppercase">
                {exportTitle}
              </p>
              <p className="text-[11px] text-slate-300 mt-2 max-w-[240px] text-center leading-relaxed font-sans">
                {exportDesc}
              </p>
              <div className="mt-4 w-6 h-6 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
