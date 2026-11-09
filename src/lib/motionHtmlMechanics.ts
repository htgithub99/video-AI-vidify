import { MOTION_HTML } from "../constants/motionHtmlTemplate.js";
export const motionHtmlMechanics = (scene: string): string => {
  const cases = MOTION_HTML.COUPLED.CASES.filter((item) => item.test.test(scene)).map((item) => item.text);
  return cases.length ? [MOTION_HTML.COUPLED.TITLE, ...cases].join("\n") : "";
};
