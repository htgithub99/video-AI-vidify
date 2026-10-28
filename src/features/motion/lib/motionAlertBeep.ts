import { MOTION_CAPTCHA } from "../../../constants/motionCaptcha.js";
let alertContext: AudioContext | null = null;
let nextBeepAt = 0;
const getAlertContext = (): AudioContext | null => {
  if (alertContext && alertContext.state !== MOTION_CAPTCHA.AUDIO_CLOSED) return alertContext;
  const Ctx = window.AudioContext || (window as any).webkitAudioContext;
  if (!Ctx) return null;
  alertContext = new Ctx();
  nextBeepAt = 0;
  return alertContext;
};
export const initMotionAlertAudio = (): (() => void) => {
  const unlock = () => {
    try {
      const ctx = getAlertContext();
      if (ctx && ctx.state !== MOTION_CAPTCHA.AUDIO_RUNNING) void ctx.resume().catch(() => undefined);
    } catch {}
  };
  for (const event of MOTION_CAPTCHA.UNLOCK_EVENTS) window.addEventListener(event, unlock, { passive: true });
  return () => {
    for (const event of MOTION_CAPTCHA.UNLOCK_EVENTS) window.removeEventListener(event, unlock);
    const ctx = alertContext;
    alertContext = null;
    nextBeepAt = 0;
    if (ctx && ctx.state !== MOTION_CAPTCHA.AUDIO_CLOSED) void ctx.close().catch(() => undefined);
  };
};
export const motionAlertBeep = (): void => {
  try {
    const ctx = getAlertContext();
    if (!ctx) return;
    void (ctx.state === MOTION_CAPTCHA.AUDIO_RUNNING ? Promise.resolve() : ctx.resume())
      .then(() => {
        if (ctx !== alertContext || ctx.state !== MOTION_CAPTCHA.AUDIO_RUNNING) return;
        const B = MOTION_CAPTCHA.BEEP;
        const step = (B.ON_MS + B.GAP_MS) / 1000;
        const start = Math.max(ctx.currentTime, nextBeepAt);
        for (let i = 0; i < B.COUNT; i++) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = B.TYPE;
          osc.frequency.value = B.FREQ;
          gain.gain.value = B.GAIN;
          osc.connect(gain).connect(ctx.destination);
          osc.onended = () => {
            osc.disconnect();
            gain.disconnect();
          };
          const at = start + i * step;
          osc.start(at);
          osc.stop(at + B.ON_MS / 1000);
        }
        nextBeepAt = start + B.COUNT * step;
      })
      .catch(() => undefined);
  } catch {}
};
export const createMotionCaptchaAlert = (notify: () => void = motionAlertBeep): ((id: string, lines: string[] | undefined) => void) => {
  const seen = new Map<string, Set<string>>();
  return (id, lines) => {
    const alerts = (lines || []).filter((line) => line.includes(MOTION_CAPTCHA.MARKER));
    const previous = seen.get(id);
    if (alerts.some((line) => !previous?.has(line))) notify();
    seen.set(id, new Set(alerts));
  };
};
