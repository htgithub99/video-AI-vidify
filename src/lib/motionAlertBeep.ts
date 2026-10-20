import { MOTION_CAPTCHA } from "../constants/motionCaptcha.js";
export const motionAlertBeep = (): void => {
  try {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const B = MOTION_CAPTCHA.BEEP;
    const step = (B.ON_MS + B.GAP_MS) / 1000;
    for (let i = 0; i < B.COUNT; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = B.TYPE;
      osc.frequency.value = B.FREQ;
      gain.gain.value = B.GAIN;
      osc.connect(gain).connect(ctx.destination);
      const at = ctx.currentTime + i * step;
      osc.start(at);
      osc.stop(at + B.ON_MS / 1000);
    }
    setTimeout(() => ctx.close().catch(() => undefined), B.COUNT * (B.ON_MS + B.GAP_MS) + 500);
  } catch {}
};
