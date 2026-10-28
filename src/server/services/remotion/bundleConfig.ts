import { RUNTIME_TEXT as RT_SERVER } from "../../../constants/runtime/server.js";
import type { WebpackOverrideFn } from "@remotion/bundler";
export const motionRemotionWebpack: WebpackOverrideFn = (config) => ({ ...config, resolve: { ...config.resolve, extensionAlias: { ...config.resolve?.extensionAlias, ".js": [RT_SERVER.TS, RT_SERVER.TSX, RT_SERVER.JS] as string[] } } });
