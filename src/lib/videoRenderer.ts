import { StoryboardScene } from '../types.js';
import { appWarn } from './logger.js';
import { parseTimeToSeconds, formatCleanDuration } from './timeUtils.js';

export const getSceneTimeRanges = (storyboard: StoryboardScene[]) => {
  let elapsed = 0;
  return storyboard.map((sc) => {
    const startSec = parseTimeToSeconds(sc.startTime || '');
    const endSec = parseTimeToSeconds(sc.endTime || '');

    const start = (sc.startTime && startSec !== null && startSec >= 0) ? startSec : elapsed;
    const duration = sc.duration || 5;
    const end = (sc.endTime && endSec !== null && endSec > start) ? endSec : start + duration;

    const actualDuration = end - start;
    elapsed = end;
    return {
      id: sc.id,
      start,
      end,
      duration: actualDuration,
      cameraMotion: sc.cameraMotion,
      transition: sc.transition,
      subtitle: sc.subtitle || sc.script,
      assetName: sc.assetName
    };
  });
};

export const drawSceneFrameToContext = (
  ctx: CanvasRenderingContext2D,
  sc: any,
  imgElement: HTMLImageElement | undefined,
  elapsedTimeInScene: number,
  totalSceneDuration: number
) => {
  const w = 1280;
  const h = 720;

  ctx.clearRect(0, 0, w, h);

  const progress = Math.min(elapsedTimeInScene / (totalSceneDuration || 1), 1.0);

  ctx.save();

  let scale = 1.0;
  let dx = 0;
  let dy = 0;
  if (sc.cameraMotion === 'Zoom In') {
    scale = 1.0 + 0.12 * progress;
  } else if (sc.cameraMotion === 'Zoom Out') {
    scale = 1.12 - 0.12 * progress;
  } else if (sc.cameraMotion === 'Pan Left') {
    dx = -60 * progress;
  } else if (sc.cameraMotion === 'Pan Right') {
    dx = 60 * progress;
  }

  if (imgElement) {
    ctx.translate(w / 2 + dx, h / 2 + dy);
    ctx.scale(scale, scale);
    ctx.drawImage(imgElement, -w / 2, -h / 2, w, h);
  } else {
    const grad = ctx.createLinearGradient(0, 0, w, h);
    const isAlt = (sc.id || '').charCodeAt((sc.id || '').length - 1) % 2 === 0;
    grad.addColorStop(0, isAlt ? '#0f172a' : '#1e1b4b');
    grad.addColorStop(1, isAlt ? '#e11d48' : '#311042');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1.5;
    for (let x = 0; x < w; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.beginPath();
    ctx.arc(w / 2 + dx, h / 2 + dy, 280 * scale, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px monospace';
    ctx.fillText(`SCENE PROMPT REPRESENTATION`, 80, 120);

    ctx.fillStyle = '#f43f5e';
    ctx.font = 'bold 18px monospace';
    ctx.fillText(`SCENE ID: ${sc.id} | DURATION: ${formatCleanDuration(sc.duration || 5)}s`, 80, 160);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = 'italic 16px sans-serif';
    const promptText = sc.prompt || '';
    let startY = 220;
    const words = promptText.split(' ');
    let currentLine = '';
    words.forEach((word: string) => {
      if ((currentLine + word).length > 80) {
        ctx.fillText(currentLine, 80, startY);
        currentLine = word + ' ';
        startY += 30;
      } else {
        currentLine += word + ' ';
      }
    });
    ctx.fillText(currentLine, 80, startY);
  }

  ctx.restore();

  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(80, h - 130, w - 160, 80);

  ctx.fillStyle = '#fef08a';
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'center';
  const subText = sc.subtitle || sc.script || '';

  let currentSubLine = '';
  let subLines: string[] = [];
  const maxLineLength = 90;

  subText.split(' ').forEach((w: string) => {
    if ((currentSubLine + w).length > maxLineLength) {
      subLines.push(currentSubLine);
      currentSubLine = w + ' ';
    } else {
      currentSubLine += w + ' ';
    }
  });
  subLines.push(currentSubLine);

  let sY = h - 90 - ((subLines.length - 1) * 15);
  subLines.forEach(l => {
    ctx.fillText(l, w / 2, sY);
    sY += 30;
  });
};

export const compileVideoToBlob = async (
  scenes: StoryboardScene[],
  getSceneImageUrl: (sc: StoryboardScene) => string,
  voiceConfig: any,
  ttsAudioUrl: string,
  onProgress: (percent: number) => void
): Promise<Blob> => {
  if (scenes.length === 0) {
    throw new Error("No scenes to render");
  }

  
  onProgress(5);
  const loadedImages: Record<string, HTMLImageElement> = {};
  let loadedCount = 0;

  await Promise.all(
    scenes.map((sc) => {
      return new Promise<void>((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          loadedImages[sc.id] = img;
          loadedCount++;
          onProgress(5 + Math.round((loadedCount / scenes.length) * 15));
          resolve();
        };
        img.onerror = () => {
          loadedCount++;
          onProgress(5 + Math.round((loadedCount / scenes.length) * 15));
          resolve();
        };
        img.src = getSceneImageUrl(sc);
      });
    })
  );

  
  const canvas = document.createElement('canvas');
  canvas.width = 1280;
  canvas.height = 720;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error("Could not initialize 2D context");

  let mixedStream = new MediaStream();
  const canvasStream = canvas.captureStream(30);
  canvasStream.getVideoTracks().forEach(track => mixedStream.addTrack(track));

  let audioCtx: AudioContext | null = null;
  let destNode: any = null;
  let audioEl: HTMLAudioElement | null = null;

  const hasSceneVoices = scenes.some(sc => !!sc.audioUrl);
  const voiceUrl = voiceConfig?.audioUrl || ttsAudioUrl;
  const hasGlobalAudio = voiceUrl && voiceUrl !== 'simulated' && voiceUrl !== 'simulated_speech';
  const hasAudioRecording = hasSceneVoices || hasGlobalAudio;


  if (hasAudioRecording) {
    try {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      destNode = audioCtx.createMediaStreamDestination();

      audioEl = new Audio();
      audioEl.crossOrigin = "anonymous";
      const sourceNode = audioCtx.createMediaElementSource(audioEl);
      sourceNode.connect(destNode);

      destNode.stream.getAudioTracks().forEach((track: MediaStreamTrack) => mixedStream.addTrack(track));
    } catch (ae) {
      appWarn("AUDIO_CONTEXT_INIT_FAILED", ae);
    }
  }


  const supportedTypes = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
    'video/mp4'
  ];
  let selectedType = '';
  for (const t of supportedTypes) {
    if (MediaRecorder.isTypeSupported(t)) {
      selectedType = t;
      break;
    }
  }

  const recorder = new MediaRecorder(mixedStream, {
    mimeType: selectedType || undefined,
    videoBitsPerSecond: 5000000
  });

  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };

  const ranges = getSceneTimeRanges(scenes);
  const totalDuration = ranges.length > 0 ? ranges[ranges.length - 1].end : 30;

  
  return new Promise<Blob>((resolve, reject) => {
    recorder.onstop = () => {
      const finalBlob = new Blob(chunks, { type: selectedType || 'video/webm' });
      resolve(finalBlob);
    };

    recorder.onerror = (err) => {
      reject(err);
    };

    recorder.start();

    const MAX_EXPORT_TIME = 5;
    const speedFactor = totalDuration > MAX_EXPORT_TIME ? (totalDuration / MAX_EXPORT_TIME) : 1;

    if (audioEl && !hasSceneVoices && hasGlobalAudio) {
      audioEl.src = voiceUrl || '';
      audioEl.currentTime = 0;
      audioEl.playbackRate = speedFactor <= 4.0 ? speedFactor : 4.0;
      audioEl.play().catch((err) => appWarn("AUDIO_PLAYBACK_FAILED", err));
    }

    const startTime = performance.now();
    let lastSceneId: string | null = null;

    const renderFrame = () => {
      const now = performance.now();
      const realElapsed = (now - startTime) / 1000;
      const elapsed = realElapsed * speedFactor;

      if (elapsed >= totalDuration || realElapsed >= MAX_EXPORT_TIME) {
        recorder.stop();
        if (audioEl) audioEl.pause();
        if (audioCtx) audioCtx.close();
        return;
      }

      const matchingRange = ranges.find(r => elapsed >= r.start && elapsed < r.end) || ranges[ranges.length - 1];
      const activeScene = scenes.find(sc => sc.id === matchingRange.id) || scenes[0];

      if (hasSceneVoices && audioEl && activeScene.id !== lastSceneId) {
        lastSceneId = activeScene.id;
        if (activeScene.audioUrl) {
          audioEl.src = activeScene.audioUrl;
          audioEl.currentTime = 0;
          audioEl.playbackRate = speedFactor <= 4.0 ? speedFactor : 4.0;
          audioEl.play().catch((err) => appWarn("AUDIO_PLAYBACK_FAILED", err));
        } else {
          audioEl.src = '';
        }
      }

      const timeInScene = elapsed - matchingRange.start;
      const sceneDuration = matchingRange.duration;

      const imgEl = loadedImages[activeScene.id];
      drawSceneFrameToContext(ctx, activeScene, imgEl, timeInScene, sceneDuration);

      const prog = 20 + Math.round((elapsed / totalDuration) * 80);
      onProgress(Math.min(prog, 99));

      requestAnimationFrame(renderFrame);
    };

    requestAnimationFrame(renderFrame);
  });
};
