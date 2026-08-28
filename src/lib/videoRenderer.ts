import { AI_MOTION_EFFECT_IDS, ErrorMessage, supportedTypes, RENDER_LOGIC_CONSTANTS } from "../constants/index.js";
import { StoryboardScene } from "../types.js";
import { appWarn } from "./logger.js";
import { parseTimeToSeconds, formatCleanDuration } from "./timeUtils.js";
import _ from "lodash";
import { hasProductionAudioSource } from "../services/productionAudioService.js";

const easeCubicInOut = (t: number): number => {
  if (t < 0.5) return 4.0 * t * t * t;
  return 1.0 - Math.pow(-2.0 * t + 2.0, 3) / 2.0;
};

const easeSineInOut = (t: number): number => -(Math.cos(Math.PI * t) - 1.0) / 2.0;

const easeExpoOut = (t: number): number => (t >= 1.0 ? 1.0 : 1.0 - Math.pow(2.0, -10.0 * t));

type MotionResult = { scale: number; dx: number; dy: number };

const MOTION_STYLES: Record<string, (progress: number) => MotionResult> = {
  [RENDER_LOGIC_CONSTANTS.ZOOM_IN]: (p) => {
    const t = easeCubicInOut(p);
    return { scale: 1.0 + 0.06 * t, dx: 0, dy: 0 };
  },
  [RENDER_LOGIC_CONSTANTS.ZOOM_OUT]: (p) => {
    const t = easeSineInOut(p);
    return { scale: 1.06 - 0.06 * t, dx: 0, dy: 0 };
  },
  [RENDER_LOGIC_CONSTANTS.PAN_LEFT]: (p) => {
    const t = easeSineInOut(p);
    return { scale: 1.08, dx: 25.6 - 51.2 * t, dy: 0 };
  },
  [RENDER_LOGIC_CONSTANTS.PAN_RIGHT]: (p) => {
    const t = easeSineInOut(p);
    return { scale: 1.08, dx: -25.6 + 51.2 * t, dy: 0 };
  },
  [RENDER_LOGIC_CONSTANTS.PAN_UP]: (p) => {
    const t = easeCubicInOut(p);
    return { scale: 1.08, dx: 0, dy: 14.4 - 28.8 * t };
  },
  [RENDER_LOGIC_CONSTANTS.PAN_DOWN]: (p) => {
    const t = easeCubicInOut(p);
    return { scale: 1.08, dx: 0, dy: -14.4 + 28.8 * t };
  },
  [RENDER_LOGIC_CONSTANTS.DRIFT]: (p) => {
    const t = easeSineInOut(p);
    const driftX = 30 * Math.sin(t * Math.PI * 1.5);
    const driftY = 20 * Math.cos(t * Math.PI * 1.2);
    const scalePulse = 1.06 + 0.04 * Math.sin(t * Math.PI);
    return { scale: scalePulse, dx: driftX, dy: driftY };
  },
  [RENDER_LOGIC_CONSTANTS.CINEMATIC_ARC]: (p) => {
    const t = easeCubicInOut(p);
    const arcPhase = Math.sin(t * Math.PI);
    return { scale: 1.0 + 0.15 * t, dx: 60 * t, dy: -30 * arcPhase };
  },
  [RENDER_LOGIC_CONSTANTS.PUSH_IN]: (p) => {
    const t = easeExpoOut(p);
    return { scale: 1.0 + 0.08 * t, dx: 12 * t, dy: -8 * t };
  },
  [RENDER_LOGIC_CONSTANTS.SLOW_REVEAL]: (p) => {
    const t = easeCubicInOut(p);
    return { scale: 1.08 - 0.06 * t, dx: -18 * t, dy: 20 * t };
  },
  [RENDER_LOGIC_CONSTANTS.MOTION_STATIC]: () => ({ scale: 1.0, dx: 0, dy: 0 }),
  [AI_MOTION_EFFECT_IDS[6]]: (p) => {
    const t = easeSineInOut(p);
    return { scale: 1.07, dx: 22 - 44 * t, dy: 12 - 24 * t };
  },
  [AI_MOTION_EFFECT_IDS[7]]: (p) => {
    const t = easeSineInOut(p);
    return { scale: 1.07, dx: -22 + 44 * t, dy: 12 - 24 * t };
  },
  [AI_MOTION_EFFECT_IDS[8]]: (p) => {
    const t = easeSineInOut(p);
    return { scale: 1.07, dx: 22 - 44 * t, dy: -12 + 24 * t };
  },
  [AI_MOTION_EFFECT_IDS[9]]: (p) => {
    const t = easeSineInOut(p);
    return { scale: 1.07, dx: -22 + 44 * t, dy: -12 + 24 * t };
  },
  [AI_MOTION_EFFECT_IDS[13]]: (p) => {
    const t = easeSineInOut(p);
    return { scale: 1.06 - 0.045 * t, dx: 6 - 6 * t, dy: -4 + 4 * t };
  },
  [AI_MOTION_EFFECT_IDS[15]]: (p) => {
    const t = easeSineInOut(p);
    return { scale: 1.045 + 0.012 * Math.sin(t * Math.PI), dx: 12 * Math.sin(t * Math.PI * 1.2), dy: 7 * Math.cos(t * Math.PI) };
  },
  [AI_MOTION_EFFECT_IDS[16]]: (p) => {
    const t = easeSineInOut(p);
    return { scale: 1.055, dx: 8 * Math.sin(t * Math.PI * 2), dy: 5 * Math.sin(t * Math.PI * 1.5) };
  },
  [AI_MOTION_EFFECT_IDS[17]]: (p) => {
    const t = easeSineInOut(p);
    return { scale: 1.055, dx: 19 - 38 * t, dy: -6 + 12 * t };
  },
  [AI_MOTION_EFFECT_IDS[18]]: (p) => {
    const t = easeSineInOut(p);
    return { scale: 1.055, dx: -19 + 38 * t, dy: -6 + 12 * t };
  },
};

const MOTION_ID_ALIASES: Record<string, string> = {
  [AI_MOTION_EFFECT_IDS[0]]: RENDER_LOGIC_CONSTANTS.ZOOM_IN,
  [AI_MOTION_EFFECT_IDS[1]]: RENDER_LOGIC_CONSTANTS.ZOOM_OUT,
  [AI_MOTION_EFFECT_IDS[2]]: RENDER_LOGIC_CONSTANTS.PAN_LEFT,
  [AI_MOTION_EFFECT_IDS[3]]: RENDER_LOGIC_CONSTANTS.PAN_RIGHT,
  [AI_MOTION_EFFECT_IDS[4]]: RENDER_LOGIC_CONSTANTS.PAN_UP,
  [AI_MOTION_EFFECT_IDS[5]]: RENDER_LOGIC_CONSTANTS.PAN_DOWN,
  [AI_MOTION_EFFECT_IDS[10]]: RENDER_LOGIC_CONSTANTS.DRIFT,
  [AI_MOTION_EFFECT_IDS[11]]: RENDER_LOGIC_CONSTANTS.CINEMATIC_ARC,
  [AI_MOTION_EFFECT_IDS[12]]: RENDER_LOGIC_CONSTANTS.PUSH_IN,
  [AI_MOTION_EFFECT_IDS[14]]: RENDER_LOGIC_CONSTANTS.SLOW_REVEAL,
  [AI_MOTION_EFFECT_IDS[19]]: RENDER_LOGIC_CONSTANTS.MOTION_STATIC,
};

const getMotionForScene = (cameraMotion: string, progress: number): MotionResult => {
  const motionKey = _.defaultTo(_.get(MOTION_ID_ALIASES, cameraMotion), cameraMotion);
  const motionFn = _.get(MOTION_STYLES, motionKey);
  if (motionFn) return motionFn(progress);
  return MOTION_STYLES[RENDER_LOGIC_CONSTANTS.MOTION_STATIC](progress);
};

export const getSceneTimeRanges = (storyboard: StoryboardScene[]) => {
  let elapsed = 0;
  return _.map(storyboard, (sc) => {
    const startSec = parseTimeToSeconds(sc.startTime || RENDER_LOGIC_CONSTANTS.EMPTY_STRING);
    const endSec = parseTimeToSeconds(sc.endTime || RENDER_LOGIC_CONSTANTS.EMPTY_STRING);

    const start = sc.startTime && !_.isNil(startSec) && _.gte(startSec, 0) ? startSec : elapsed;
    const duration = sc.duration || 5;
    const end = sc.endTime && !_.isNil(endSec) && _.gt(endSec, start) ? endSec : start + duration;

    const actualDuration = end - start;
    elapsed = end;
    return { id: sc.id, start, end, duration: actualDuration, cameraMotion: sc.cameraMotion, transition: sc.transition, subtitle: sc.subtitle || sc.script, assetName: sc.assetName };
  });
};

const TRANSITION_DURATION = 0.4;

export const drawSceneFrameToContext = (ctx: CanvasRenderingContext2D, sc: any, imgElement: HTMLImageElement | undefined, elapsedTimeInScene: number, totalSceneDuration: number, nextImgElement?: HTMLImageElement | undefined, transitionProgress?: number) => {
  const w = 1280;
  const h = 720;

  ctx.clearRect(0, 0, w, h);

  const progress = _.min([elapsedTimeInScene / (totalSceneDuration || 1), 1.0]) || 0;

  const comfortableMotion = _.lt(totalSceneDuration, 2.5) ? RENDER_LOGIC_CONSTANTS.MOTION_STATIC : _.defaultTo(sc.cameraMotion, RENDER_LOGIC_CONSTANTS.MOTION_STATIC);
  const motion = getMotionForScene(comfortableMotion, progress);
  const { scale, dx, dy } = motion;

  ctx.save();

  if (!_.isNil(imgElement)) {
    ctx.translate(w / 2 + dx, h / 2 + dy);
    ctx.scale(scale, scale);
    ctx.drawImage(imgElement, -w / 2, -h / 2, w, h);
  } else {
    const grad = ctx.createLinearGradient(0, 0, w, h);
    const isAlt = _.eq((sc.id || RENDER_LOGIC_CONSTANTS.EMPTY_STRING).charCodeAt((sc.id || RENDER_LOGIC_CONSTANTS.EMPTY_STRING).length - 1) % 2, 0);
    grad.addColorStop(0, isAlt ? RENDER_LOGIC_CONSTANTS.COLOR_ALT_START : RENDER_LOGIC_CONSTANTS.COLOR_DEFAULT_START);
    grad.addColorStop(1, isAlt ? RENDER_LOGIC_CONSTANTS.COLOR_ALT_END : RENDER_LOGIC_CONSTANTS.COLOR_DEFAULT_END);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = RENDER_LOGIC_CONSTANTS.COLOR_GRID;
    ctx.lineWidth = 1.5;
    for (let x = 0; _.lt(x, w); x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; _.lt(y, h); y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    ctx.fillStyle = RENDER_LOGIC_CONSTANTS.COLOR_GLOW;
    ctx.beginPath();
    ctx.arc(w / 2 + dx, h / 2 + dy, 280 * scale, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = RENDER_LOGIC_CONSTANTS.COLOR_WHITE;
    ctx.font = RENDER_LOGIC_CONSTANTS.FONT_HEADER;
    ctx.fillText(RENDER_LOGIC_CONSTANTS.TEXT_REPRESENTATION, 80, 120);

    ctx.fillStyle = RENDER_LOGIC_CONSTANTS.COLOR_ROSE;
    ctx.font = RENDER_LOGIC_CONSTANTS.FONT_SUBHEADER;
    ctx.fillText(RENDER_LOGIC_CONSTANTS.PROMPT_LABEL.replace("{0}", sc.id).replace("{1}", formatCleanDuration(sc.duration || 5)), 80, 160);

    ctx.fillStyle = RENDER_LOGIC_CONSTANTS.COLOR_SLATE;
    ctx.font = RENDER_LOGIC_CONSTANTS.FONT_BODY;
    const promptText = sc.prompt || RENDER_LOGIC_CONSTANTS.EMPTY_STRING;
    let startY = 220;
    const words = promptText.split(RENDER_LOGIC_CONSTANTS.SPACE_CHAR);
    let currentLine: string = RENDER_LOGIC_CONSTANTS.EMPTY_STRING;
    _.forEach(words, (word: string) => {
      if (_.gt((currentLine + word).length, 80)) {
        ctx.fillText(currentLine, 80, startY);
        currentLine = `${word}${RENDER_LOGIC_CONSTANTS.SPACE_CHAR}`;
        startY += 30;
      } else {
        currentLine += `${word}${RENDER_LOGIC_CONSTANTS.SPACE_CHAR}`;
      }
    });
    ctx.fillText(currentLine, 80, startY);
  }

  ctx.restore();

  const shouldRenderTransition = !_.isNil(transitionProgress) && transitionProgress > 0 && !_.isNil(nextImgElement);
  if (shouldRenderTransition) {
    const fadeAlpha = easeCubicInOut(transitionProgress);
    ctx.save();
    ctx.globalAlpha = fadeAlpha;
    ctx.drawImage(nextImgElement, 0, 0, w, h);
    ctx.restore();
  }

  ctx.save();
  const subBoxHeight = 70;
  const subBoxY = h - 110;
  const subBoxX = 100;
  const subBoxWidth = w - 200;

  ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
  if (typeof ctx.roundRect === "function") {
    ctx.beginPath();
    ctx.roundRect(subBoxX, subBoxY, subBoxWidth, subBoxHeight, 12);
    ctx.fill();
  } else {
    ctx.fillRect(subBoxX, subBoxY, subBoxWidth, subBoxHeight);
  }

  ctx.font = "bold 26px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const subText = sc.subtitle || sc.script || RENDER_LOGIC_CONSTANTS.EMPTY_STRING;

  let currentSubLine: string = RENDER_LOGIC_CONSTANTS.EMPTY_STRING;
  let subLines: string[] = [];
  const maxLineLength = 80;

  _.forEach(subText.split(RENDER_LOGIC_CONSTANTS.SPACE_CHAR), (wStr: string) => {
    if (_.gt((currentSubLine + wStr).length, maxLineLength)) {
      subLines.push(_.trim(currentSubLine));
      currentSubLine = `${wStr}${RENDER_LOGIC_CONSTANTS.SPACE_CHAR}`;
    } else {
      currentSubLine += `${wStr}${RENDER_LOGIC_CONSTANTS.SPACE_CHAR}`;
    }
  });
  if (!_.isEmpty(_.trim(currentSubLine))) {
    subLines.push(_.trim(currentSubLine));
  }

  const lineHeight = 30;
  const totalTextHeight = subLines.length * lineHeight;
  let sY = subBoxY + subBoxHeight / 2 - totalTextHeight / 2 + lineHeight / 2;

  ctx.lineWidth = 4;
  ctx.strokeStyle = "#000000";
  ctx.fillStyle = "#FFE600";

  _.forEach(subLines, (l) => {
    ctx.strokeText(l, w / 2, sY);
    ctx.fillText(l, w / 2, sY);
    sY += lineHeight;
  });
  ctx.restore();
};

export const compileVideoToBlob = async (scenes: StoryboardScene[], getSceneImageUrl: (sc: StoryboardScene) => string, voiceConfig: any, ttsAudioUrl: string, onProgress: (percent: number) => void): Promise<Blob> => {
  if (_.eq(scenes.length, 0)) {
    throw new Error(ErrorMessage.NO_SCENES_TO_RENDER);
  }

  onProgress(5);
  const loadedImages: Record<string, HTMLImageElement> = {};
  let loadedCount = 0;

  await Promise.all(
    _.map(scenes, (sc) => {
      return new Promise<void>((resolve) => {
        const img = new Image();
        img.crossOrigin = RENDER_LOGIC_CONSTANTS.ANONYMOUS;
        img.onload = () => {
          loadedImages[sc.id] = img;
          loadedCount++;
          onProgress(_.add(5, _.round(_.multiply(_.divide(loadedCount, scenes.length), 15))));
          resolve();
        };
        img.onerror = () => {
          loadedCount++;
          onProgress(_.add(5, _.round(_.multiply(_.divide(loadedCount, scenes.length), 15))));
          resolve();
        };
        img.src = getSceneImageUrl(sc);
      });
    }),
  );

  const canvas = document.createElement("canvas");
  canvas.width = 1280;
  canvas.height = 720;
  const ctx = canvas.getContext(RENDER_LOGIC_CONSTANTS.CONTEXT_2D);
  if (_.isNil(ctx)) throw new Error(ErrorMessage.COULD_NOT_INITIALIZE_2D_CONTEXT);

  let mixedStream = new MediaStream();
  const canvasStream = canvas.captureStream(30);
  _.forEach(canvasStream.getVideoTracks(), (track) => mixedStream.addTrack(track));

  let audioCtx: AudioContext | null = null;
  let destNode: any = null;
  let audioEl: HTMLAudioElement | null = null;

  const hasSceneVoices = _.some(scenes, (sc) => hasProductionAudioSource([sc.audioUrl]));
  const voiceUrl = voiceConfig?.audioUrl || ttsAudioUrl;
  const hasGlobalAudio = hasProductionAudioSource([voiceUrl]);
  const hasAudioRecording = hasSceneVoices || hasGlobalAudio;

  if (hasAudioRecording) {
    try {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      destNode = audioCtx.createMediaStreamDestination();

      audioEl = new Audio();
      audioEl.crossOrigin = RENDER_LOGIC_CONSTANTS.ANONYMOUS;
      const sourceNode = audioCtx.createMediaElementSource(audioEl);
      sourceNode.connect(destNode);

      _.forEach(destNode.stream.getAudioTracks(), (track: MediaStreamTrack) => mixedStream.addTrack(track));
    } catch (ae) {
      appWarn("AUDIO_CONTEXT_INIT_FAILED", ae);
    }
  }

  let selectedType: string = RENDER_LOGIC_CONSTANTS.EMPTY_STRING;
  _.forEach(supportedTypes, (t) => {
    if (MediaRecorder.isTypeSupported(t)) {
      selectedType = t;
      return false;
    }
  });

  const recorder = new MediaRecorder(mixedStream, {
    mimeType: selectedType || undefined,
    videoBitsPerSecond: 5000000,
  });

  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data && _.gt(e.data.size, 0)) chunks.push(e.data);
  };

  const ranges = getSceneTimeRanges(scenes);
  const totalDuration = _.gt(ranges.length, 0) ? ranges[ranges.length - 1].end : 30;

  return new Promise<Blob>((resolve, reject) => {
    recorder.onstop = () => {
      const finalBlob = new Blob(chunks, {
        type: selectedType || RENDER_LOGIC_CONSTANTS.MIME_WEBM,
      });
      resolve(finalBlob);
    };

    recorder.onerror = (err) => {
      reject(err);
    };

    recorder.start();

    const MAX_EXPORT_TIME = 5;
    const speedFactor = _.gt(totalDuration, MAX_EXPORT_TIME) ? totalDuration / MAX_EXPORT_TIME : 1;

    if (audioEl && !hasSceneVoices && hasGlobalAudio) {
      audioEl.src = voiceUrl || RENDER_LOGIC_CONSTANTS.EMPTY_STRING;
      audioEl.currentTime = 0;
      audioEl.playbackRate = _.lte(speedFactor, 4.0) ? speedFactor : 4.0;
      audioEl.play().catch((err) => appWarn("AUDIO_PLAYBACK_FAILED", err));
    }

    const startTime = performance.now();
    let lastSceneId: string | null = null;

    const renderFrame = () => {
      const now = performance.now();
      const realElapsed = (now - startTime) / 1000;
      const elapsed = realElapsed * speedFactor;

      if (_.gte(elapsed, totalDuration) || _.gte(realElapsed, MAX_EXPORT_TIME)) {
        recorder.stop();
        if (audioEl) audioEl.pause();
        if (audioCtx) audioCtx.close();
        return;
      }

      const matchingRange = _.find(ranges, (r) => elapsed >= r.start && elapsed < r.end) || ranges[ranges.length - 1];
      const activeScene = _.find(scenes, (sc) => _.eq(sc.id, matchingRange.id)) || scenes[0];

      if (hasSceneVoices && audioEl && !_.eq(activeScene.id, lastSceneId)) {
        lastSceneId = activeScene.id;
        if (activeScene.audioUrl) {
          audioEl.src = activeScene.audioUrl;
          audioEl.currentTime = 0;
          audioEl.playbackRate = _.lte(speedFactor, 4.0) ? speedFactor : 4.0;
          audioEl.play().catch((err) => appWarn("AUDIO_PLAYBACK_FAILED", err));
        } else {
          audioEl.src = RENDER_LOGIC_CONSTANTS.EMPTY_STRING;
        }
      }

      const timeInScene = elapsed - matchingRange.start;
      const sceneDuration = matchingRange.duration;

      const imgEl = loadedImages[activeScene.id];

      let transitionProgress = 0;
      let nextImgEl: HTMLImageElement | undefined;

      const matchingIdx = _.findIndex(ranges, (r) => _.eq(r.id, matchingRange.id));
      if (matchingIdx >= 0 && matchingIdx < ranges.length - 1) {
        const timeRemaining = sceneDuration - timeInScene;
        if (timeRemaining <= TRANSITION_DURATION && timeRemaining >= 0) {
          transitionProgress = 1.0 - timeRemaining / TRANSITION_DURATION;
          const nextRange = ranges[matchingIdx + 1];
          const nextScene = _.find(scenes, (sc) => _.eq(sc.id, nextRange.id));
          if (nextScene) nextImgEl = loadedImages[nextScene.id];
        }
      }

      drawSceneFrameToContext(ctx, activeScene, imgEl, timeInScene, sceneDuration, nextImgEl, transitionProgress);

      const prog = _.add(20, _.round(_.multiply(_.divide(elapsed, totalDuration), 80)));
      onProgress(_.min([prog, 99]) || prog);

      requestAnimationFrame(renderFrame);
    };

    requestAnimationFrame(renderFrame);
  });
};
