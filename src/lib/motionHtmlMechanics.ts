import { MOTION_HTML } from "../constants/motionHtmlTemplate.js";
export const motionHtmlMechanics = (scene: string, kit = false): string => {
  const cases = MOTION_HTML.COUPLED.CASES.filter((item) => item.test.test(scene)).map((item) => item.text.split(MOTION_HTML.COUPLED.RIDER_TOKEN).join(kit ? MOTION_HTML.COUPLED.RIDER_KIT : MOTION_HTML.COUPLED.RIDER_FREE));
  return cases.length ? [MOTION_HTML.COUPLED.TITLE, ...cases].join("\n") : "";
};
