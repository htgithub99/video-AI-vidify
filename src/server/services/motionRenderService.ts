import { execFile, spawn } from "child_process";
import { randomUUID } from "crypto";
import fs from "fs";
import _ from "lodash";
import os from "os";
import path from "path";
import { chromium, type Browser, type Page } from "playwright";
import {
  MOTION_RENDER_CANVAS_ID,
  MOTION_TEMPLATE_1_A_ARESAMPLE_48000_AFORMAT_CHANNEL_LAYOUTS_MONO,
  MOTION_TEMPLATE_1_A_ARESAMPLE_48000_VOLUME_APAD_ALIMITER_LIMIT,
  MOTION_TEMPLATE_AFADE_T_OUT_ST_D_1_2,
  MOTION_TEMPLATE_BO_MA_HOA_FPS_CHAT_LUONG,
  MOTION_TEMPLATE_CANH_3D_AI_VE_SHOT_WEBGL,
  MOTION_TEMPLATE_FFMPEG,
  MOTION_TEMPLATE_FFMPEG_EXITED,
  MOTION_TEMPLATE_FILE,
  MOTION_TEMPLATE_HOAN_TAT_MB_S,
  MOTION_TEMPLATE_JPG_2,
  MOTION_TEMPLATE_K,
  MOTION_TEMPLATE_LOI,
  MOTION_TEMPLATE_PART_MP4,
  MOTION_TEMPLATE_RENDER_SONG_SONG_LUONG_KHUNG,
  MOTION_TEMPLATE_RENDER_XONG_S_DANG_GHEP_VIDEO,
  MOTION_TEMPLATE_SYMBOL_20,
  MOTION_TEMPLATE_SYMBOL_56,
  MOTION_TEMPLATE_SYMBOL_7,
  MOTION_TEMPLATE_TRINH_DUYET_RENDER_THOI_LUONG_S,
  MOTION_TEXT_0,
  MOTION_TEXT_0_V,
  MOTION_TEXT_1,
  MOTION_TEXT_16_9,
  MOTION_TEXT_2,
  MOTION_TEXT_2D,
  MOTION_TEXT_3,
  MOTION_TEXT_48000,
  MOTION_TEXT_AAC_2,
  MOTION_TEXT_ABORT,
  MOTION_TEXT_AC,
  MOTION_TEXT_ANIMATION,
  MOTION_TEXT_AN_2,
  MOTION_TEXT_AR,
  MOTION_TEXT_A_2,
  MOTION_TEXT_BASE64,
  MOTION_TEXT_BF,
  MOTION_TEXT_BT709,
  MOTION_TEXT_BUFSIZE,
  MOTION_TEXT_B_A,
  MOTION_TEXT_B_V,
  MOTION_TEXT_C,
  MOTION_TEXT_CHROMIUM,
  MOTION_TEXT_CLOSE,
  MOTION_TEXT_COLORSPACE,
  MOTION_TEXT_COLOR_C_BLACK_S_320X240_D_0_2,
  MOTION_TEXT_COLOR_PRIMARIES,
  MOTION_TEXT_COLOR_RANGE,
  MOTION_TEXT_COLOR_TRC,
  MOTION_TEXT_CONCAT,
  MOTION_TEXT_CONTROLLER,
  MOTION_TEXT_COPY,
  MOTION_TEXT_CQ,
  MOTION_TEXT_CRF,
  MOTION_TEXT_C_A,
  MOTION_TEXT_C_V,
  MOTION_TEXT_D,
  MOTION_TEXT_DANG_CO_MOT_VIDEO_MOTION_DUOC_RENDER_HAY,
  MOTION_TEXT_DANG_DUNG_RENDER,
  MOTION_TEXT_DATA,
  MOTION_TEXT_DA_GHEP_AM_THANH,
  MOTION_TEXT_DA_HUY,
  MOTION_TEXT_DA_NHAN_YEU_CAU_RENDER,
  MOTION_TEXT_DA_TAO_AM_NEN_HIEU_UNG_TRAM,
  MOTION_TEXT_DA_TRON_GIONG_DOC_AM_NEN_SIDECHAIN,
  MOTION_TEXT_DISABLE_BACKGROUNDING_OCCLUDED_WINDOWS,
  MOTION_TEXT_DISABLE_BACKGROUND_TIMER_THROTTLING,
  MOTION_TEXT_DISABLE_GPU_VSYNC,
  MOTION_TEXT_DISABLE_RENDERER_BACKGROUNDING,
  MOTION_TEXT_DONE,
  MOTION_TEXT_DRAIN,
  MOTION_TEXT_D_2,
  MOTION_TEXT_ENABLE_GPU_RASTERIZATION,
  MOTION_TEXT_ENABLE_UNSAFE_SWIFTSHADER,
  MOTION_TEXT_ERROR,
  MOTION_TEXT_F,
  MOTION_TEXT_FASTSTART,
  MOTION_TEXT_FILTER_COMPLEX,
  MOTION_TEXT_FONT_RENDER_HINTING_NONE,
  MOTION_TEXT_FORCE_COLOR_PROFILE_SRGB,
  MOTION_TEXT_FRAMERATE,
  MOTION_TEXT_FRAMES_V,
  MOTION_TEXT_G,
  MOTION_TEXT_GEN3D,
  MOTION_TEXT_GLOBAL_QUALITY,
  MOTION_TEXT_H264_AMF,
  MOTION_TEXT_H264_NVENC,
  MOTION_TEXT_H264_QSV,
  MOTION_TEXT_HIDE_BANNER,
  MOTION_TEXT_HIGH,
  MOTION_TEXT_HQ,
  MOTION_TEXT_I,
  MOTION_TEXT_IGNORE_GPU_BLOCKLIST,
  MOTION_TEXT_IMAGE2PIPE,
  MOTION_TEXT_IMAGE_JPEG,
  MOTION_TEXT_KHONG_CO_CANH_3D,
  MOTION_TEXT_KHONG_DUNG_DUOC_GPU_RENDER_SE_CHAM,
  MOTION_TEXT_LAVFI,
  MOTION_TEXT_LIBX264,
  MOTION_TEXT_LOAD,
  MOTION_TEXT_LOGLEVEL,
  MOTION_TEXT_MAP_2,
  MOTION_TEXT_MAXRATE,
  MOTION_TEXT_MJPEG,
  MOTION_TEXT_MODEL_GLTF_BINARY,
  MOTION_TEXT_MOTION,
  MOTION_TEXT_MOTION_RENDER_ABORTED,
  MOTION_TEXT_MOTION_VIDEO,
  MOTION_TEXT_MOTION_VIDEO_RENDER_FAILED,
  MOTION_TEXT_MOVFLAGS,
  MOTION_TEXT_MUX,
  MOTION_TEXT_NFD,
  MOTION_TEXT_NULL,
  MOTION_TEXT_NV12,
  MOTION_TEXT_P6,
  MOTION_TEXT_PAGE,
  MOTION_TEXT_PAGEERROR,
  MOTION_TEXT_PARTS_TXT,
  MOTION_TEXT_PIX_FMT,
  MOTION_TEXT_PREPARE,
  MOTION_TEXT_PRESET,
  MOTION_TEXT_PROFILE_V,
  MOTION_TEXT_QUALITY,
  MOTION_TEXT_QUALITY_2,
  MOTION_TEXT_R,
  MOTION_TEXT_RC,
  MOTION_TEXT_RENDER_2,
  MOTION_TEXT_SAFE,
  MOTION_TEXT_SCALE_IN_RANGE_PC_OUT_RANGE_TV_IN,
  MOTION_TEXT_SIGKILL,
  MOTION_TEXT_SLOW,
  MOTION_TEXT_SPATIAL_AQ,
  MOTION_TEXT_STILL_LABEL_BG,
  MOTION_TEXT_STILL_LABEL_FG,
  MOTION_TEXT_STILL_LABEL_FONT,
  MOTION_TEXT_STOPPING,
  MOTION_TEXT_SYMBOL_16,
  MOTION_TEXT_SYMBOL_25,
  MOTION_TEXT_SYMBOL_27,
  MOTION_TEXT_SYMBOL_30,
  MOTION_TEXT_SYMBOL_33,
  MOTION_TEXT_SYMBOL_34,
  MOTION_TEXT_SYMBOL_38,
  MOTION_TEXT_SYMBOL_39,
  MOTION_TEXT_T,
  MOTION_TEXT_TUNE,
  MOTION_TEXT_TV,
  MOTION_TEXT_USE_ANGLE_D3D11,
  MOTION_TEXT_UTF8,
  MOTION_TEXT_VBR,
  MOTION_TEXT_VBR_PEAK,
  MOTION_TEXT_VF,
  MOTION_TEXT_VIDEO_MOTION,
  MOTION_TEXT_VIDEO_MP4,
  MOTION_TEXT_VI_VN,
  MOTION_TEXT_WEBGL,
  MOTION_TEXT_WEBGL2,
  MOTION_TEXT_WEBGL_DEBUG_RENDERER_INFO,
  MOTION_TEXT_WIN32,
  MOTION_TEXT_X,
  MOTION_TEXT_Y,
  MOTION_TEXT_YUV420P,
} from "../../constants/motionRuntime.js";
import { MOTION_ASPECT_BASE, MOTION_GPU_ENCODERS, MOTION_QUALITY_PRESETS, MOTION_VIDEO_CONSTANTS, type MotionQualityPreset } from "../../constants/motionVideo.js";
import { cloneJson } from "../../lib/jsonStringify.js";
import { logger } from "../../lib/logger.js";
import { MotionEncoderPreference, MotionJobStatus, MotionQuality, type MotionEnvironmentInfo, type MotionJobState, type MotionRenderOptions, type MotionResultItem, type MotionSpec } from "../../types/motionVideo.js";
import { buildSfxTrack } from "./motionAudioService.js";
import { MOTION_ASSET_BASE, buildMotionRenderHtml, resolveMotionAsset } from "./motionEngineService.js";
import { addMotionResult, getMotionAudioDirectory, getMotionRootDirectory, getMotionWorkDirectory } from "./motionLibraryService.js";
import { getFfmpegPath } from "./shortsPreprocessService.js";
const ABORTED = MOTION_TEXT_MOTION_RENDER_ABORTED;
const jobs = new Map<string, MotionJobState & { controller: AbortController }>();
let encoderCache: string[] | null = null;
let browserLabel: string | null = null;
let webglLabel = "";
const runFfmpegCollect = (args: string[], signal?: AbortSignal): Promise<{ code: number; stderr: string }> =>
  new Promise((resolve, reject) => {
    const child = spawn(getFfmpegPath(), args, { windowsHide: true });
    let stderr = "";
    const onAbort = () => {
      try {
        child.kill(MOTION_TEXT_SIGKILL);
      } catch {}
    };
    signal?.addEventListener(MOTION_TEXT_ABORT, onAbort, { once: true });
    child.stderr.on(MOTION_TEXT_DATA, (d: Buffer) => {
      stderr = `${stderr}${d.toString()}`.slice(-6000);
    });
    child.on(MOTION_TEXT_ERROR, (e) => {
      signal?.removeEventListener(MOTION_TEXT_ABORT, onAbort);
      reject(e);
    });
    child.on(MOTION_TEXT_CLOSE, (code) => {
      signal?.removeEventListener(MOTION_TEXT_ABORT, onAbort);
      if (signal?.aborted) reject(new Error(ABORTED));
      else resolve({ code: code ?? 1, stderr });
    });
  });
const ffmpegOrThrow = async (args: string[], signal?: AbortSignal): Promise<void> => {
  const r = await runFfmpegCollect([MOTION_TEXT_Y, MOTION_TEXT_HIDE_BANNER, MOTION_TEXT_LOGLEVEL, MOTION_TEXT_ERROR, ...args], signal);
  if (r.code !== 0) throw new Error(_.trim(_.last(_.compact(r.stderr.split(/\r?\n/)))) || MOTION_TEMPLATE_FFMPEG_EXITED(`${r.code}`));
};
export const probeMediaDuration = async (file: string): Promise<number> => {
  const r = await runFfmpegCollect([MOTION_TEXT_HIDE_BANNER, MOTION_TEXT_I, file]);
  const m = r.stderr.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/);
  return m ? _.toNumber(m[1]) * 3600 + _.toNumber(m[2]) * 60 + _.toNumber(m[3]) : 0;
};
export const detectEncoders = async (): Promise<string[]> => {
  if (encoderCache) return encoderCache;
  const found: string[] = [];
  for (const enc of MOTION_GPU_ENCODERS) {
    try {
      const r = await runFfmpegCollect([MOTION_TEXT_HIDE_BANNER, MOTION_TEXT_LOGLEVEL, MOTION_TEXT_ERROR, MOTION_TEXT_F, MOTION_TEXT_LAVFI, MOTION_TEXT_I, MOTION_TEXT_COLOR_C_BLACK_S_320X240_D_0_2, MOTION_TEXT_FRAMES_V, MOTION_TEXT_3, MOTION_TEXT_C_V, enc, MOTION_TEXT_F, MOTION_TEXT_NULL, MOTION_TEXT_SYMBOL_33]);
      if (r.code === 0) found.push(enc);
    } catch {}
  }
  found.push(MOTION_TEXT_LIBX264);
  encoderCache = found;
  return found;
};
const launchBrowser = async (): Promise<{ browser: Browser; label: string }> => {
  const args = [
    MOTION_TEXT_DISABLE_GPU_VSYNC,
    MOTION_TEXT_DISABLE_BACKGROUND_TIMER_THROTTLING,
    MOTION_TEXT_DISABLE_RENDERER_BACKGROUNDING,
    MOTION_TEXT_DISABLE_BACKGROUNDING_OCCLUDED_WINDOWS,
    MOTION_TEXT_FORCE_COLOR_PROFILE_SRGB,
    MOTION_TEXT_FONT_RENDER_HINTING_NONE,
    MOTION_TEXT_IGNORE_GPU_BLOCKLIST,
    MOTION_TEXT_ENABLE_GPU_RASTERIZATION,
    MOTION_TEXT_ENABLE_UNSAFE_SWIFTSHADER,
    ...(process.platform === MOTION_TEXT_WIN32 ? [MOTION_TEXT_USE_ANGLE_D3D11] : []),
  ];
  for (const channel of MOTION_VIDEO_CONSTANTS.BROWSER_CHANNELS) {
    try {
      const browser = await chromium.launch({ channel, headless: true, args });
      return { browser, label: channel };
    } catch {}
  }
  const browser = await chromium.launch({ headless: true, args });
  return { browser, label: MOTION_TEXT_CHROMIUM };
};
export const getMotionEnvironmentInfo = async (): Promise<MotionEnvironmentInfo> => {
  const encoders = await detectEncoders();
  if (!browserLabel) {
    try {
      const { browser, label } = await launchBrowser();
      browserLabel = label;
      try {
        const page = await browser.newPage();
        webglLabel = await page.evaluate(
          (motionBrowserTexts) => {
            try {
              const c = new OffscreenCanvas(8, 8);
              const gl = (c.getContext(motionBrowserTexts.MOTION_TEXT_WEBGL2) || c.getContext(motionBrowserTexts.MOTION_TEXT_WEBGL)) as WebGLRenderingContext | null;
              if (!gl) return "";
              const ext = gl.getExtension(motionBrowserTexts.MOTION_TEXT_WEBGL_DEBUG_RENDERER_INFO);
              return String(ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER));
            } catch {
              return "";
            }
          },
          { MOTION_TEXT_WEBGL2, MOTION_TEXT_WEBGL, MOTION_TEXT_WEBGL_DEBUG_RENDERER_INFO },
        );
      } catch {
        webglLabel = "";
      }
      await browser.close();
    } catch {
      browserLabel = null;
    }
  }
  const cpus = os.cpus().length || 2;
  const freeMemoryMb = Math.round(os.freemem() / 1024 / 1024);
  return { browser: browserLabel, encoders, cpus, freeMemoryMb, recommendedWorkers: workerCount(cpus, freeMemoryMb, 10000), webgl: webglLabel || null, gpu3d: !!webglLabel && !/swiftshader|llvmpipe|software/i.test(webglLabel) };
};
const workerCount = (cpus: number, freeMb: number, frames: number): number => Math.max(1, Math.min(MOTION_VIDEO_CONSTANTS.MAX_WORKERS, Math.floor(cpus / 2) || 1, Math.floor(freeMb / MOTION_VIDEO_CONSTANTS.MEMORY_PER_WORKER_MB) || 1, Math.ceil(frames / MOTION_VIDEO_CONSTANTS.MIN_FRAMES_PER_WORKER)));
const pickEncoder = (available: string[], pref: MotionEncoderPreference): string => {
  const gpu = _.find(available, (e) => e !== MOTION_TEXT_LIBX264);
  if (pref === MotionEncoderPreference.CPU) return MOTION_TEXT_LIBX264;
  if (pref === MotionEncoderPreference.GPU) return gpu || MOTION_TEXT_LIBX264;
  return gpu || MOTION_TEXT_LIBX264;
};
const COLOR_ARGS = [MOTION_TEXT_COLORSPACE, MOTION_TEXT_BT709, MOTION_TEXT_COLOR_PRIMARIES, MOTION_TEXT_BT709, MOTION_TEXT_COLOR_TRC, MOTION_TEXT_BT709, MOTION_TEXT_COLOR_RANGE, MOTION_TEXT_TV];
const encoderArgs = (enc: string, p: MotionQualityPreset, width: number, height: number, fps: number): string[] => {
  const maxKbps = Math.round((width * height * fps * p.maxBpp) / 1000);
  const cap = [MOTION_TEXT_MAXRATE, MOTION_TEMPLATE_K(`${maxKbps}`), MOTION_TEXT_BUFSIZE, MOTION_TEMPLATE_K(`${maxKbps * 2}`)];
  const gop = [MOTION_TEXT_G, String(Math.round(fps * 2)), MOTION_TEXT_BF, MOTION_TEXT_2];
  if (enc === MOTION_TEXT_H264_NVENC) return [MOTION_TEXT_C_V, enc, MOTION_TEXT_PRESET, MOTION_TEXT_P6, MOTION_TEXT_TUNE, MOTION_TEXT_HQ, MOTION_TEXT_RC, MOTION_TEXT_VBR, MOTION_TEXT_CQ, String(p.gpuCq), MOTION_TEXT_B_V, MOTION_TEXT_0, ...cap, MOTION_TEXT_SPATIAL_AQ, MOTION_TEXT_1, MOTION_TEXT_PROFILE_V, MOTION_TEXT_HIGH, ...gop, MOTION_TEXT_PIX_FMT, MOTION_TEXT_YUV420P];
  if (enc === MOTION_TEXT_H264_QSV) return [MOTION_TEXT_C_V, enc, MOTION_TEXT_GLOBAL_QUALITY, String(p.gpuCq), MOTION_TEXT_PRESET, MOTION_TEXT_SLOW, ...cap, ...gop, MOTION_TEXT_PIX_FMT, MOTION_TEXT_NV12];
  if (enc === MOTION_TEXT_H264_AMF) return [MOTION_TEXT_C_V, enc, MOTION_TEXT_QUALITY, MOTION_TEXT_QUALITY_2, MOTION_TEXT_RC, MOTION_TEXT_VBR_PEAK, MOTION_TEXT_B_V, MOTION_TEMPLATE_K(`${Math.round(maxKbps * 0.7)}`), ...cap, ...gop, MOTION_TEXT_PIX_FMT, MOTION_TEXT_YUV420P];
  return [MOTION_TEXT_C_V, MOTION_TEXT_LIBX264, MOTION_TEXT_PRESET, p.x264Preset, MOTION_TEXT_CRF, String(p.crf), ...cap, MOTION_TEXT_PROFILE_V, MOTION_TEXT_HIGH, MOTION_TEXT_TUNE, MOTION_TEXT_ANIMATION, ...gop, MOTION_TEXT_PIX_FMT, MOTION_TEXT_YUV420P];
};
const slugify = (s: string): string =>
  _.trim(
    _.toString(s)
      .replace(/đ/g, MOTION_TEXT_D)
      .replace(/Đ/g, MOTION_TEXT_D_2)
      .normalize(MOTION_TEXT_NFD)
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, MOTION_TEXT_SYMBOL_33)
      .toLowerCase()
      .slice(0, 48),
    MOTION_TEXT_SYMBOL_33,
  ) || MOTION_TEXT_MOTION_VIDEO;
const pushLog = (job: MotionJobState, line: string) => {
  job.log = _.takeRight([...job.log, MOTION_TEMPLATE_SYMBOL_7(`${new Date().toLocaleTimeString(MOTION_TEXT_VI_VN)}`, `${line}`)], MOTION_VIDEO_CONSTANTS.MAX_LOG_LINES);
};
interface WorkerSlice {
  index: number;
  start: number;
  end: number;
  file: string;
}
const attachAssetRoute = async (page: Page) => {
  await page.route(MOTION_TEMPLATE_SYMBOL_56(`${MOTION_ASSET_BASE}`), async (route) => {
    const rel = new URL(route.request().url()).pathname;
    const file = resolveMotionAsset(rel);
    if (!file) return route.fulfill({ status: 404, body: "", headers: { "Access-Control-Allow-Origin": MOTION_TEXT_SYMBOL_34 } });
    return route.fulfill({ status: 200, body: fs.readFileSync(file), headers: { "Content-Type": MOTION_TEXT_MODEL_GLTF_BINARY, "Access-Control-Allow-Origin": MOTION_TEXT_SYMBOL_34 } });
  });
};
const renderSlice = async (slice: WorkerSlice, html: string, ctx: { width: number; height: number; fps: number; preset: MotionQualityPreset; encoder: string; signal: AbortSignal; onFrames: (n: number) => void }): Promise<string> => {
  if (ctx.signal.aborted) throw new Error(ABORTED);
  const { browser } = await launchBrowser();
  let page: Page | null = null;
  let ff: ReturnType<typeof spawn> | null = null;
  const onAbort = () => {
    browser.close().catch(_.noop);
    try {
      ff?.kill(MOTION_TEXT_SIGKILL);
    } catch {}
  };
  ctx.signal.addEventListener(MOTION_TEXT_ABORT, onAbort, { once: true });
  try {
    page = await browser.newPage({ viewport: { width: 640, height: 360 } });
    await attachAssetRoute(page);
    await page.setContent(html, { waitUntil: MOTION_TEXT_LOAD });
    await page.evaluate(() => (window as any).__fontsReady);
    await page.evaluate(([q, w, h]) => (window as any).__setup(q, w, h), [{ supersample: ctx.preset.supersample, motionBlur: ctx.preset.motionBlur, bloom: ctx.preset.bloom, grain: ctx.preset.grain, layerScale: ctx.preset.layerScale }, ctx.width, ctx.height] as const);
    const vf = [MOTION_TEXT_VF, MOTION_TEXT_SCALE_IN_RANGE_PC_OUT_RANGE_TV_IN];
    const args = [
      MOTION_TEXT_Y,
      MOTION_TEXT_HIDE_BANNER,
      MOTION_TEXT_LOGLEVEL,
      MOTION_TEXT_ERROR,
      MOTION_TEXT_F,
      MOTION_TEXT_IMAGE2PIPE,
      MOTION_TEXT_FRAMERATE,
      String(ctx.fps),
      MOTION_TEXT_C_V,
      MOTION_TEXT_MJPEG,
      MOTION_TEXT_I,
      MOTION_TEXT_SYMBOL_33,
      ...vf,
      ...encoderArgs(ctx.encoder, ctx.preset, ctx.width, ctx.height, ctx.fps),
      ...COLOR_ARGS,
      MOTION_TEXT_R,
      String(ctx.fps),
      MOTION_TEXT_AN_2,
      slice.file,
    ];
    ff = spawn(getFfmpegPath(), args, { windowsHide: true });
    let ffErr = "";
    const proc = ff;
    proc.stderr!.on(MOTION_TEXT_DATA, (d: Buffer) => (ffErr = `${ffErr}${d.toString()}`.slice(-4000)));
    const closed = new Promise<number>((resolve) => proc.on(MOTION_TEXT_CLOSE, (code) => resolve(code ?? 1)));
    proc.stdin!.on(MOTION_TEXT_ERROR, _.noop);
    const write = (buf: Buffer) => {
      if (ctx.signal.aborted) return Promise.reject(new Error(ABORTED));
      return proc.stdin!.write(buf) ? Promise.resolve() : new Promise<void>((r) => proc.stdin!.once(MOTION_TEXT_DRAIN, () => r()));
    };
    const B = MOTION_VIDEO_CONSTANTS.BATCH_FRAMES;
    let pending: Promise<void> = Promise.resolve();
    for (let i = slice.start; i < slice.end; i += B) {
      if (ctx.signal.aborted) throw new Error(ABORTED);
      const j = Math.min(slice.end, i + B);
      const frames: string[] = await page.evaluate(([a, b, fps, q]) => (window as any).__frames(a, b, fps, q), [i, j, ctx.fps, ctx.preset.jpegQuality] as const);
      await pending;
      pending = (async () => {
        for (const f of frames) await write(Buffer.from(f, MOTION_TEXT_BASE64));
      })();
      ctx.onFrames(j - i);
    }
    await pending;
    proc.stdin!.end();
    const code = await closed;
    if (ctx.signal.aborted) throw new Error(ABORTED);
    if (code !== 0) throw new Error(_.trim(_.last(_.compact(ffErr.split(/\r?\n/)))) || MOTION_TEMPLATE_FFMPEG(`${code}`));
    return slice.file;
  } catch (error) {
    throw ctx.signal.aborted ? new Error(ABORTED) : error;
  } finally {
    ctx.signal.removeEventListener(MOTION_TEXT_ABORT, onAbort);
    if (ff && ff.exitCode === null) {
      try {
        ff.kill(MOTION_TEXT_SIGKILL);
      } catch {}
    }
    await page?.close().catch(_.noop);
    await browser.close().catch(_.noop);
  }
};
const runJob = async (job: MotionJobState & { controller: AbortController }, spec: MotionSpec, options: MotionRenderOptions): Promise<void> => {
  const signal = job.controller.signal;
  const started = Date.now();
  const preset = MOTION_QUALITY_PRESETS[options.quality] || MOTION_QUALITY_PRESETS[MotionQuality.STANDARD];
  const aspect = options.aspect || spec.aspect || MOTION_TEXT_16_9;
  const base = MOTION_ASPECT_BASE[aspect] || MOTION_ASPECT_BASE[MOTION_TEXT_16_9];
  const even = (v: number) => Math.round(v / 2) * 2;
  const width = even(base.w * preset.scale),
    height = even(base.h * preset.scale);
  const fps = _.toNumber(options.fps) || spec.fps || preset.fps;
  const work = getMotionWorkDirectory(job.id);
  let ownSfx = false;
  try {
    job.status = MotionJobStatus.PREPARING;
    job.stage = MOTION_TEXT_PREPARE;
    const renderSpec: MotionSpec = _.assign({}, spec, { aspect, fps });
    const html = buildMotionRenderHtml(renderSpec);
    const encoders = await detectEncoders();
    const encoder = pickEncoder(encoders, options.encoder);
    job.encoder = encoder;
    pushLog(job, MOTION_TEMPLATE_BO_MA_HOA_FPS_CHAT_LUONG(`${encoder}`, `${width}`, `${height}`, `${fps}`, `${preset.id}`));
    const probe = await launchBrowser();
    job.browser = probe.label;
    let duration = 0;
    let is3dSoftware = false;
    try {
      const page = await probe.browser.newPage({ viewport: { width: 320, height: 180 } });
      await attachAssetRoute(page);
      await page.setContent(html, { waitUntil: MOTION_TEXT_LOAD });
      await page.evaluate(() => (window as any).__fontsReady);
      const probeSpec = cloneJson(await page.evaluate(() => (window as any).__SPEC));
      const probeInfo = await page.evaluate(
        (probe) => {
          const ME = (window as any).MotionEngine;
          const sp = ME.normalizeSpec(probe.spec);
          const gl = ME.T3 && ME.T3.ok ? ME.T3.rendererInfo() : "";
          return { duration: sp.duration, shots3d: sp.shots.filter((x: any) => x.template === probe.tpl).length, gl };
        },
        { tpl: MOTION_TEXT_GEN3D, spec: probeSpec },
      );
      duration = probeInfo.duration;
      is3dSoftware = !probeInfo.gl || /swiftshader|llvmpipe|software/i.test(probeInfo.gl);
      pushLog(job, probeInfo.shots3d ? MOTION_TEMPLATE_CANH_3D_AI_VE_SHOT_WEBGL(`${probeInfo.shots3d}`, `${_.truncate(probeInfo.gl || MOTION_TEXT_SYMBOL_25, { length: 70 })}`, `${is3dSoftware ? MOTION_TEXT_KHONG_DUNG_DUOC_GPU_RENDER_SE_CHAM : ""}`) : MOTION_TEXT_KHONG_CO_CANH_3D);
    } finally {
      await probe.browser.close().catch(_.noop);
    }
    pushLog(job, MOTION_TEMPLATE_TRINH_DUYET_RENDER_THOI_LUONG_S(`${probe.label}`, `${duration.toFixed(1)}`));
    if (options.sfx && !options.sfxId) {
      ownSfx = true;
      options.sfxId = await buildSfxTrack(
        duration,
        _.filter(options.sfx.cues || [], (c) => _.isFinite(c.t) && c.t >= 0 && c.t < duration),
        options.sfx.mood,
      );
      pushLog(job, MOTION_TEXT_DA_TAO_AM_NEN_HIEU_UNG_TRAM);
    }
    const totalFrames = Math.max(1, Math.round(duration * fps));
    job.framesTotal = totalFrames;
    const cpuBudget = is3dSoftware ? Math.max(2, Math.floor((os.cpus().length || 2) / 2)) : os.cpus().length || 2;
    const workers = Math.min(is3dSoftware ? 1 : 2, workerCount(cpuBudget, Math.round(os.freemem() / 1048576), totalFrames));
    job.workers = workers;
    const per = Math.ceil(totalFrames / workers);
    const slices: WorkerSlice[] = _.filter(
      _.map(_.range(workers), (i) => ({ index: i, start: i * per, end: Math.min(totalFrames, (i + 1) * per), file: path.join(work, MOTION_TEMPLATE_PART_MP4(`${i}`)) })),
      (s) => s.end > s.start,
    );
    job.status = MotionJobStatus.RENDERING;
    job.stage = MOTION_TEXT_RENDER_2;
    pushLog(job, MOTION_TEMPLATE_RENDER_SONG_SONG_LUONG_KHUNG(`${slices.length}`, `${totalFrames}`));
    const t0 = Date.now();
    const onFrames = (n: number) => {
      job.framesDone += n;
      const el = (Date.now() - t0) / 1000;
      job.fpsRender = el > 0 ? job.framesDone / el : 0;
      job.etaSeconds = job.fpsRender ? (totalFrames - job.framesDone) / job.fpsRender : undefined;
      job.progress = Math.min(0.94, (job.framesDone / totalFrames) * 0.94);
    };
    await Promise.all(_.map(slices, (s) => renderSlice(s, html, { width, height, fps, preset, encoder, signal, onFrames })));
    job.status = MotionJobStatus.ENCODING;
    job.stage = MOTION_TEXT_MUX;
    pushLog(job, MOTION_TEMPLATE_RENDER_XONG_S_DANG_GHEP_VIDEO(`${((Date.now() - t0) / 1000) | 0}`));
    const list = path.join(work, MOTION_TEXT_PARTS_TXT);
    fs.writeFileSync(list, _.map(slices, (s) => MOTION_TEMPLATE_FILE(`${s.file.replace(/\\/g, MOTION_TEXT_SYMBOL_16).replace(/'/g, MOTION_TEXT_SYMBOL_38)}`)).join(MOTION_TEXT_SYMBOL_27));
    const silent = path.join(work, MOTION_TEXT_VIDEO_MP4);
    await ffmpegOrThrow([MOTION_TEXT_F, MOTION_TEXT_CONCAT, MOTION_TEXT_SAFE, MOTION_TEXT_0, MOTION_TEXT_I, list, MOTION_TEXT_C, MOTION_TEXT_COPY, silent], signal);
    const fileName = MOTION_TEMPLATE_SYMBOL_20(`${slugify(options.title || spec.title || MOTION_TEXT_MOTION)}`, `${aspect.replace(MOTION_TEXT_SYMBOL_39, MOTION_TEXT_X)}`, `${preset.id}`, `${Date.now()}`, `${MOTION_VIDEO_CONSTANTS.EXT_MP4}`);
    const out = path.join(getMotionRootDirectory(), fileName);
    const audioDir = getMotionAudioDirectory();
    const audioPath = options.audioId ? path.join(audioDir, path.basename(options.audioId)) : "";
    const sfxPath = options.sfxId ? path.join(audioDir, path.basename(options.sfxId)) : "";
    const hasVoice = !!audioPath && fs.existsSync(audioPath);
    const hasSfx = !!sfxPath && fs.existsSync(sfxPath);
    const fadeStart = Math.max(0, duration - 1.2);
    const tail = MOTION_TEMPLATE_AFADE_T_OUT_ST_D_1_2(`${fadeStart.toFixed(2)}`);
    const audioOut = [MOTION_TEXT_C_A, MOTION_TEXT_AAC_2, MOTION_TEXT_B_A, preset.audioBitrate, MOTION_TEXT_AR, MOTION_TEXT_48000, MOTION_TEXT_AC, MOTION_TEXT_2, MOTION_TEXT_T, duration.toFixed(3), MOTION_TEXT_MOVFLAGS, MOTION_TEXT_FASTSTART, out];
    if (hasVoice || hasSfx) {
      const vol = _.clamp(_.toNumber(options.audioVolume ?? 1) || 1, 0, 2);
      const sfxVol = _.clamp(_.toNumber(options.sfxVolume ?? 0.5), 0, 1.5);
      const inputs = [MOTION_TEXT_I, silent, ...(hasVoice ? [MOTION_TEXT_I, audioPath] : []), ...(hasSfx ? [MOTION_TEXT_I, sfxPath] : [])];
      let graph: string;
      if (hasVoice && hasSfx) {
        graph = MOTION_TEMPLATE_1_A_ARESAMPLE_48000_AFORMAT_CHANNEL_LAYOUTS_MONO(`${vol}`, `${sfxVol}`, `${tail}`);
      } else graph = MOTION_TEMPLATE_1_A_ARESAMPLE_48000_VOLUME_APAD_ALIMITER_LIMIT(`${hasVoice ? vol : sfxVol}`, `${tail}`);
      await ffmpegOrThrow([...inputs, MOTION_TEXT_FILTER_COMPLEX, graph, MOTION_TEXT_MAP_2, MOTION_TEXT_0_V, MOTION_TEXT_MAP_2, MOTION_TEXT_A_2, MOTION_TEXT_C_V, MOTION_TEXT_COPY, ...audioOut], signal);
      pushLog(job, hasVoice && hasSfx ? MOTION_TEXT_DA_TRON_GIONG_DOC_AM_NEN_SIDECHAIN : MOTION_TEXT_DA_GHEP_AM_THANH);
    } else {
      await ffmpegOrThrow([MOTION_TEXT_I, silent, MOTION_TEXT_C, MOTION_TEXT_COPY, MOTION_TEXT_MOVFLAGS, MOTION_TEXT_FASTSTART, out], signal);
    }
    const stat = fs.statSync(out);
    const result: MotionResultItem = {
      id: job.id,
      title: options.title || spec.title || MOTION_TEXT_VIDEO_MOTION,
      fileName,
      videoUrl: `${MOTION_VIDEO_CONSTANTS.ASSETS_URL_PREFIX}${encodeURIComponent(fileName)}`,
      aspect,
      quality: preset.id,
      width,
      height,
      fps,
      durationSeconds: duration,
      sizeBytes: stat.size,
      renderSeconds: Math.round((Date.now() - started) / 1000),
      encoder,
      createdAt: new Date().toISOString(),
    };
    addMotionResult(result);
    job.result = result;
    job.progress = 1;
    job.status = MotionJobStatus.COMPLETED;
    job.stage = MOTION_TEXT_DONE;
    pushLog(job, MOTION_TEMPLATE_HOAN_TAT_MB_S(`${(stat.size / 1048576).toFixed(1)}`, `${result.renderSeconds}`));
  } catch (error: any) {
    const aborted = signal.aborted || error?.message === ABORTED;
    job.status = aborted ? MotionJobStatus.CANCELLED : MotionJobStatus.ERROR;
    job.error = aborted ? undefined : _.toString(error?.message || error);
    pushLog(job, aborted ? MOTION_TEXT_DA_HUY : MOTION_TEMPLATE_LOI(`${job.error}`));
    if (!aborted) logger.error(MOTION_TEXT_MOTION_VIDEO_RENDER_FAILED, error);
  } finally {
    fs.promises.rm(work, { recursive: true, force: true }).catch(_.noop);
    if (ownSfx && options.sfxId) fs.promises.rm(path.join(getMotionAudioDirectory(), path.basename(options.sfxId)), { force: true }).catch(_.noop);
    setTimeout(() => jobs.delete(job.id), MOTION_VIDEO_CONSTANTS.JOB_TTL_MS).unref();
  }
};
export const isMotionRenderBusy = (): boolean => _.some([...jobs.values()], (j) => _.includes([MotionJobStatus.QUEUED, MotionJobStatus.PREPARING, MotionJobStatus.RENDERING, MotionJobStatus.ENCODING], j.status));
export const startMotionRender = (spec: MotionSpec, options: MotionRenderOptions): MotionJobState => {
  const running = _.find([...jobs.values()], (j) => _.includes([MotionJobStatus.QUEUED, MotionJobStatus.PREPARING, MotionJobStatus.RENDERING, MotionJobStatus.ENCODING], j.status));
  if (running) throw new Error(MOTION_TEXT_DANG_CO_MOT_VIDEO_MOTION_DUOC_RENDER_HAY);
  const job = { id: randomUUID(), status: MotionJobStatus.QUEUED, progress: 0, framesDone: 0, framesTotal: 0, startedAt: Date.now(), log: [], controller: new AbortController() } as MotionJobState & { controller: AbortController };
  jobs.set(job.id, job);
  pushLog(job, MOTION_TEXT_DA_NHAN_YEU_CAU_RENDER);
  void runJob(job, spec, options);
  return publicJob(job);
};
const publicJob = (job: MotionJobState & { controller?: AbortController }): MotionJobState => _.omit(job, [MOTION_TEXT_CONTROLLER]) as MotionJobState;
export const getMotionJob = (id: string): MotionJobState | null => {
  const job = jobs.get(id);
  return job ? publicJob(job) : null;
};
export const cancelMotionJob = (id?: string): boolean => {
  const targets = id ? _.compact([jobs.get(id)]) : [...jobs.values()];
  let any = false;
  for (const job of targets) {
    if (_.includes([MotionJobStatus.COMPLETED, MotionJobStatus.ERROR, MotionJobStatus.CANCELLED], job.status)) continue;
    job.stage = MOTION_TEXT_STOPPING;
    pushLog(job, MOTION_TEXT_DANG_DUNG_RENDER);
    job.controller.abort();
    any = true;
  }
  return any;
};
export const checkMotionSpec = async (spec: MotionSpec): Promise<{ duration: number; errors: { t: number; shot: string; error: string }[] }> => {
  const html = buildMotionRenderHtml(spec);
  const { browser } = await launchBrowser();
  try {
    const page = await browser.newPage({ viewport: { width: 320, height: 180 } });
    await attachAssetRoute(page);
    const pageErrors: string[] = [];
    page.on(MOTION_TEXT_PAGEERROR, (e) => pageErrors.push(e.message));
    await page.setContent(html, { waitUntil: MOTION_TEXT_LOAD });
    await page.evaluate(() => (window as any).__fontsReady);
    const r = await page.evaluate(async () => {
      const w = window as any;
      const d = await w.__setup({ supersample: 1, motionBlur: 1, bloom: false, grain: false, layerScale: 0.5 }, 480, 270);
      return { duration: d, errors: w.__R.check(0.5) };
    });
    return { duration: r.duration, errors: [...r.errors, ..._.map(pageErrors, (e) => ({ t: 0, shot: MOTION_TEXT_PAGE, error: e }))] };
  } finally {
    await browser.close().catch(_.noop);
  }
};
const STILL_LABEL = { canvasId: MOTION_RENDER_CANVAS_ID, ctx2d: MOTION_TEXT_2D, bg: MOTION_TEXT_STILL_LABEL_BG, fg: MOTION_TEXT_STILL_LABEL_FG, font: MOTION_TEXT_STILL_LABEL_FONT, mime: MOTION_TEXT_IMAGE_JPEG };
export interface MotionStillSession {
  render: (spec: MotionSpec, picks: { id: string; t: number }[], dir: string, opts?: { width?: number; height?: number; quality?: "draft" | "high"; label?: boolean }) => Promise<{ id: string; t: number; file: string; issues: string[]; camera?: unknown }[]>;
  close: () => Promise<void>;
}
export const openStillSession = async (): Promise<MotionStillSession> => {
  const { browser } = await launchBrowser();
  let page: Page | null = null;
  const errors: string[] = [];
  const ensurePage = async (w: number, h: number) => {
    if (page && !page.isClosed()) {
      await page.setViewportSize({ width: w, height: h });
      return page;
    }
    page = await browser.newPage({ viewport: { width: w, height: h } });
    page.on(MOTION_TEXT_PAGEERROR, (e) => errors.push(e.message));
    await attachAssetRoute(page);
    await page.setContent(buildMotionRenderHtml({ shots: [] } as MotionSpec), { waitUntil: MOTION_TEXT_LOAD });
    await page.evaluate(() => (window as any).__fontsReady);
    return page;
  };
  let chain: Promise<unknown> = Promise.resolve();
  const session: MotionStillSession = {
    render: (spec, picks, dir, opts) => {
      const run = chain.then(() => doRender(spec, picks, dir, opts));
      chain = run.catch(_.noop);
      return run;
    },
    close: async () => {
      await chain.catch(_.noop);
      await browser.close().catch(_.noop);
    },
  };
  const impl = {
    async render(spec: MotionSpec, picks: { id: string; t: number }[], dir: string, opts: { width?: number; height?: number; quality?: "draft" | "high"; label?: boolean } = {}) {
      const width = opts.width || 960,
        height = opts.height || 540;
      fs.mkdirSync(dir, { recursive: true });
      const p = await ensurePage(width, height);
      const quality = opts.quality === MOTION_TEXT_HIGH ? { supersample: 1, motionBlur: 1, bloom: true, grain: true, layerScale: 1 } : { supersample: 1, motionBlur: 1, bloom: false, grain: false, layerScale: 0.6 };
      errors.length = 0;
      await p.evaluate(async ([sp, q, w, h]) => (window as any).__load(sp, q, w, h), [spec, quality, width, height] as const);
      const out: { id: string; t: number; file: string; issues: string[]; camera?: unknown }[] = [];
      for (const pick of picks) {
        const r = await p.evaluate(
          (arg) => {
            const res = (window as any).__still(arg.t, 0.86);
            if (arg.label) {
              const c = document.getElementById(arg.canvasId) as HTMLCanvasElement;
              const g = c.getContext(arg.ctx2d) as CanvasRenderingContext2D;
              g.fillStyle = arg.bg;
              g.fillRect(0, 0, 14 + arg.label.length * 13, 34);
              g.fillStyle = arg.fg;
              g.font = arg.font;
              g.fillText(arg.label, 8, 25);
              res.img = c.toDataURL(arg.mime, 0.86).slice(23);
            }
            return res;
          },
          { t: pick.t, label: opts.label ? pick.id : "", ...STILL_LABEL },
        );
        const file = path.join(dir, MOTION_TEMPLATE_JPG_2(`${pick.id.replace(/[^\w-]+/g, MOTION_TEXT_SYMBOL_30)}`));
        fs.writeFileSync(file, Buffer.from(r.img, MOTION_TEXT_BASE64));
        const info = (r.info || {})[pick.id] || _.first(_.values(r.info || {})) || {};
        out.push({ ...pick, file, issues: _.uniq([...(info.issues || []), ...errors.splice(0)]), camera: info.camera });
      }
      return out;
    },
  };
  const doRender = impl.render;
  return session;
};
export const execFileText = (cmd: string, args: string[]): Promise<string> => new Promise((resolve, reject) => execFile(cmd, args, { windowsHide: true, encoding: MOTION_TEXT_UTF8 }, (err, stdout) => (err ? reject(err) : resolve(_.trim(stdout)))));
