let seq = 0;
let at = 0;
let source = "";
export const reportCaptchaAlert = (from: string): void => {
  seq += 1;
  at = Date.now();
  source = from;
};
export const captchaAlertState = (): { seq: number; at: number; source: string } => ({ seq, at, source });
