import * as RT_MAINTENANCE from "../constants/runtime/maintenance.js";
import { motionHtmlKitRefresh } from "./motionHtmlKit.js";
export const motionHtmlHostDocument = (raw: string, token: string): string => {
  const html = motionHtmlKitRefresh(raw);
  const canvasGuard = RT_MAINTENANCE.CANVAS_GUARD_SCRIPT;
  const bridge = `${RT_MAINTENANCE.SCRIPT}${canvasGuard}${RT_MAINTENANCE.HTML_BRIDGE_PREFIX}${JSON.stringify(token)}${RT_MAINTENANCE.HTML_BRIDGE_SUFFIX}`;
  const source = /<head\b[^>]*>/i.test(html) ? html.replace(/<head\b[^>]*>/i, (head) => head + bridge) : bridge + html;
  const encoded = JSON.stringify(source).replace(/</g, RT_MAINTENANCE.U003C);
  return `${RT_MAINTENANCE.HTML_HOST_PREFIX}${JSON.stringify(token)}${RT_MAINTENANCE.F_DOCUMENT_GETELEMENTBYID_SCENE_PENDING_NEW_MAP_LET_COUNTER_0}${encoded}${RT_MAINTENANCE.HTML_HOST_SUFFIX}`;
};
