import { formatCleanTime } from "../../lib/timeUtils";
import { PipelineWizardState } from "./usePipelineWizard";
import * as LucideIcons from "lucide-react";
import { Button } from "../ui/Button";

const { Eye, Download, Video, ArrowLeft } = LucideIcons as any;

import { WizardStep } from "../../types";
import { EXPORT_TYPES, EXPORT_URLS } from "../../constants";

export default function PipelineStep4(props: PipelineWizardState) {
  const { t, setCurrentStep, setInfoMsg, getMotionLabel, isOfflineRendering, isPlayingSim, simActiveScene, handleOfflineRenderWebM, startPlaybackSim, stopPlaybackSim, getSceneImageUrl, handleDownloadJSONProject, handleDownloadSRT, handleDownloadCapcutLink, handleDownloadPremiereXML, loadingExportType } = props;

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {}
        <div className="lg:col-span-2 bg-gradient-to-b from-slate-900/90 to-slate-950/95 border border-slate-800/85 p-6 rounded-2xl space-y-4 shadow-2xl relative overflow-visible">
          <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/[0.03] rounded-full blur-3xl pointer-events-none" />
          <h3 className="font-bold text-slate-100 text-base flex items-center gap-2 relative z-10">
            <Eye className="w-5 h-5 text-rose-500" />
            {t.renderTitle}
          </h3>

          {}
          <div className="aspect-[16/9] bg-slate-950 border border-slate-800 rounded-xl relative overflow-hidden flex items-center justify-center">
            {simActiveScene ? (
              <>
                {getSceneImageUrl(simActiveScene) ? (
                  <div className="w-full h-full relative">
                    <img referrerPolicy="no-referrer" src={getSceneImageUrl(simActiveScene)} alt={t.rendering_visual} className={`w-full h-full object-cover transition-transform duration-1000 ${isPlayingSim && simActiveScene.cameraMotion === "Zoom In" ? "scale-110" : isPlayingSim && simActiveScene.cameraMotion === "Zoom Out" ? "scale-90" : ""}`} />
                    {!simActiveScene.assetUrl && <div className="absolute top-3 right-3 bg-rose-600/90 text-white text-[9px] font-bold px-2 py-0.5 rounded shadow z-10">{t.Default_Timeline_Image}</div>}
                  </div>
                ) : (
                  <div className="text-center p-6 text-slate-600 font-mono text-xs">{t.noPhotoRenderedYet.replace("{sceneId}", simActiveScene.id)}</div>
                )}

                {}
                <div className="absolute bottom-6 left-4 right-4 text-center">
                  <span className="bg-black/85 text-amber-300 font-bold px-4 py-2 rounded border border-slate-800 text-xs sm:text-sm font-sans tracking-wide">{simActiveScene.subtitle}</span>
                </div>

                {}
                <div className="absolute top-3 left-3 bg-slate-950/80 text-[10px] font-mono text-slate-400 p-2 rounded border border-slate-850 flex flex-col">
                  <span>
                    {t.Scene}: {simActiveScene.id} ({formatCleanTime(simActiveScene.startTime)} - {formatCleanTime(simActiveScene.endTime)})
                  </span>
                  <span>
                    {t.Camera_VFX}: {getMotionLabel(simActiveScene.cameraMotion)}
                  </span>
                </div>
              </>
            ) : (
              <div className="text-center text-slate-500 text-xs">{t.Nothing_to_simulate}</div>
            )}
          </div>

          {}
          <div className="flex items-center justify-between gap-4 py-2 border-t border-slate-850">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <span>{t.SIMULATOR_STATUS}</span>
              <span className={isPlayingSim ? "text-rose-450 font-bold" : "text-rose-350"}>{isPlayingSim ? t.ACTIVE_RUNNING : t.PAUSED}</span>
            </div>

            <div className="flex items-center gap-2">
              {isPlayingSim ? (
                <Button variant="primary" size="sm" onClick={stopPlaybackSim}>
                  {t.Stop_Simulation}
                </Button>
              ) : (
                <Button variant="primary" size="sm" onClick={startPlaybackSim} className="bg-rose-750 hover:bg-rose-700 border-none">
                  {t.Play_Simulation}
                </Button>
              )}
            </div>
          </div>
        </div>

        {}
        <div className="bg-gradient-to-b from-slate-900/90 to-slate-950/95 border border-slate-800/85 p-6 rounded-2xl space-y-6 shadow-2xl relative overflow-visible">
          <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/[0.03] rounded-full blur-3xl pointer-events-none" />
          <h3 className="font-bold text-slate-100 text-base relative z-10">{t.Professional_Project_Pack}</h3>

          <div className="grid grid-cols-1 gap-3.5 text-xs">
            {}
            <Button 
              variant="ghost" 
              onClick={handleDownloadCapcutLink} 
              disabled={loadingExportType === EXPORT_TYPES.CAPCUT} 
              className="w-full flex items-center justify-between p-3.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-xl text-slate-200 text-left h-auto shrink-0 shadow-none hover:text-slate-100 flex-row gap-4"
            >
              <div className="text-left flex-1">
                <span className="font-bold block flex items-center gap-1.5">
                  {loadingExportType === EXPORT_TYPES.CAPCUT && <span className="inline-block w-2 h-2 rounded-full bg-rose-500 animate-pulse" />}
                  {loadingExportType === EXPORT_TYPES.CAPCUT ? t.exportingCapcut : t.exportCapcut}
                </span>
                <span className="text-[10px] text-slate-500 block font-normal text-left">{t.Exports_timeline_JSON_fil}</span>
              </div>
              {loadingExportType === EXPORT_TYPES.CAPCUT ? <div className="w-5 h-5 rounded-full border-2 border-rose-500 border-t-transparent animate-spin shrink-0" /> : <Download className="w-5 h-5 text-slate-400 shrink-0" />}
            </Button>

            {}
            <Button 
              variant="ghost" 
              onClick={handleDownloadPremiereXML} 
              disabled={loadingExportType === EXPORT_TYPES.PREMIERE} 
              className="w-full flex items-center justify-between p-3.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-xl text-slate-200 text-left h-auto shrink-0 shadow-none hover:text-slate-100 flex-row gap-4"
            >
              <div className="text-left flex-1">
                <span className="font-bold block flex items-center gap-1.5">
                  {loadingExportType === EXPORT_TYPES.PREMIERE && <span className="inline-block w-2 h-2 rounded-full bg-rose-500 animate-pulse" />}
                  {loadingExportType === EXPORT_TYPES.PREMIERE ? t.exportingPremiere : t.exportPremiere}
                </span>
                <span className="text-[10px] text-slate-500 block font-normal text-left">{t.Construct_XML_track_metad}</span>
              </div>
              {loadingExportType === EXPORT_TYPES.PREMIERE ? <div className="w-5 h-5 rounded-full border-2 border-rose-500 border-t-transparent animate-spin shrink-0" /> : <Download className="w-5 h-5 text-slate-400 shrink-0" />}
            </Button>

            {}
            <Button 
              variant="ghost" 
              onClick={handleDownloadPremiereXML} 
              disabled={loadingExportType === EXPORT_TYPES.PREMIERE} 
              className="w-full flex items-center justify-between p-3.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-xl text-slate-200 text-left h-auto shrink-0 shadow-none hover:text-slate-100 flex-row gap-4"
            >
              <div className="text-left flex-1">
                <span className="font-bold block flex items-center gap-1.5">
                  {loadingExportType === EXPORT_TYPES.PREMIERE && <span className="inline-block w-2 h-2 rounded-full bg-rose-500 animate-pulse" />}
                  {loadingExportType === EXPORT_TYPES.PREMIERE ? t.exportingDavinci : t.exportDavinci}
                </span>
                <span className="text-[10px] text-slate-500 block font-normal text-left">{t.Download_FCPXML_timing_fi}</span>
              </div>
              {loadingExportType === EXPORT_TYPES.PREMIERE ? <div className="w-5 h-5 rounded-full border-2 border-rose-500 border-t-transparent animate-spin shrink-0" /> : <Download className="w-5 h-5 text-slate-400 shrink-0" />}
            </Button>

            {}
            <Button 
              variant="ghost" 
              onClick={handleOfflineRenderWebM} 
              disabled={isOfflineRendering} 
              className={`w-full flex items-center justify-between p-3.5 border rounded-xl text-left h-auto shrink-0 shadow-none flex-row gap-4 ${isOfflineRendering ? "bg-slate-950 border-slate-900 text-slate-500 hover:bg-slate-950" : "bg-gradient-to-r from-rose-950/30 to-slate-950 hover:to-slate-850 border-rose-950 text-slate-200 hover:text-slate-100"}`}
            >
              <div className="text-left flex-1">
                <span className="font-bold block text-rose-400 flex items-center gap-1.5">
                  {isOfflineRendering ? <span className="inline-block w-2 h-2 rounded-full bg-rose-500 animate-pulse" /> : <span className="inline-block w-2 h-2 rounded-full bg-rose-500" />}
                  {isOfflineRendering ? t.exportingVideo : t.renderingWebM}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5 font-normal text-left">{isOfflineRendering ? t.waitExportProcess : t.Render_and_compile_full_p}</span>
              </div>
              {isOfflineRendering ? <div className="w-5 h-5 rounded-full border-2 border-rose-500 border-t-transparent animate-spin shrink-0" /> : <Video className="w-5 h-5 text-rose-500 shrink-0" />}
            </Button>

            {}
            <Button 
              variant="ghost" 
              onClick={handleDownloadJSONProject} 
              disabled={loadingExportType === EXPORT_TYPES.ZIP} 
              className="w-full flex items-center justify-between p-3.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-xl text-slate-200 text-left h-auto shrink-0 shadow-none hover:text-slate-100 flex-row gap-4"
            >
              <div className="text-left flex-1">
                <span className="font-bold block flex items-center gap-1.5">
                  {loadingExportType === EXPORT_TYPES.ZIP && <span className="inline-block w-2 h-2 rounded-full bg-rose-500 animate-pulse" />}
                  {loadingExportType === EXPORT_TYPES.ZIP ? t.packagingZip : t.downloadZip}
                </span>
                <span className="text-[10px] text-slate-500 block font-normal text-left">{t.Download_complete_CapCut_}</span>
              </div>
              {loadingExportType === EXPORT_TYPES.ZIP ? <div className="w-5 h-5 rounded-full border-2 border-rose-500 border-t-transparent animate-spin shrink-0" /> : <Download className="w-5 h-5 text-slate-400 shrink-0" />}
            </Button>

            {}
            <Button 
              variant="ghost" 
              onClick={handleDownloadSRT} 
              disabled={loadingExportType === EXPORT_TYPES.SRT} 
              className="w-full flex items-center justify-between p-3.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-xl text-slate-200 text-left h-auto shrink-0 shadow-none hover:text-slate-100 flex-row gap-4"
            >
              <div className="text-left flex-1">
                <span className="font-bold block flex items-center gap-1.5">
                  {loadingExportType === EXPORT_TYPES.SRT && <span className="inline-block w-2 h-2 rounded-full bg-rose-500 animate-pulse" />}
                  {loadingExportType === EXPORT_TYPES.SRT ? t.exportingSRT : t.Download_SRT}
                </span>
                <span className="text-[10px] text-slate-500 block font-normal text-left">{t.Extract_synced_subtitle_t}</span>
              </div>
              {loadingExportType === EXPORT_TYPES.SRT ? <div className="w-5 h-5 rounded-full border-2 border-rose-500 border-t-transparent animate-spin shrink-0" /> : <Download className="w-5 h-5 text-slate-400 shrink-0" />}
            </Button>
          </div>

          {}
          <div className="bg-slate-900 border border-slate-850 p-4 rounded-xl space-y-2">
            <span className="text-[10px] text-slate-500 font-mono font-bold block uppercase">{t.Cloud_Exporter_Sync_Setup}</span>
            <div className="flex gap-2">
              <input type="text" placeholder={EXPORT_URLS.DEFAULT_S3_BUCKET} className="w-full bg-slate-900 text-slate-350 text-[11px] p-2 rounded focus:outline-none placeholder-slate-600 border border-slate-800" />
              <Button variant="primary" size="xs" onClick={() => setInfoMsg(t.Configured_bucket_coordin)}>
                {t.Save}
              </Button>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-start mt-6">
            <Button 
              variant="secondary" 
              size="md" 
              onClick={() => setCurrentStep(WizardStep.SEOBoost)} 
              className="flex items-center gap-1.5 px-5 py-3 shadow"
            >
              <ArrowLeft className="w-4 h-4" />
              {t.Back}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
