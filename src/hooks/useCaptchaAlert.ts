import { useEffect } from "react";
import { API_ROUTES } from "../constants/apiRoutes.js";
import { CAPTCHA_ALERT } from "../constants/captchaAlert.js";
import { initMotionAlertAudio, motionAlertBeep } from "../features/motion/lib/motionAlertBeep.js";
export const useCaptchaAlert = (): void => {
  useEffect(() => {
    const disposeAudio = initMotionAlertAudio();
    let seen: number | undefined;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const poll = async () => {
      try {
        const response = await fetch(API_ROUTES.CAPTCHA_ALERT);
        const data = (await response.json()) as { seq?: number };
        const seq = Number(data?.seq) || 0;
        if (seen !== undefined && seq > seen) motionAlertBeep();
        seen = seq;
      } catch {}
      if (!stopped) timer = setTimeout(poll, CAPTCHA_ALERT.POLL_MS);
    };
    void poll();
    return () => {
      stopped = true;
      clearTimeout(timer);
      disposeAudio();
    };
  }, []);
};
