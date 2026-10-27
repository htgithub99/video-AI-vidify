import type { WebpackOverrideFn } from "@remotion/bundler";
export const motionRemotionWebpack: WebpackOverrideFn = (config) => ({ ...config, resolve: { ...config.resolve, extensionAlias: { ...config.resolve?.extensionAlias, ".js": [".ts", ".tsx", ".js"] } } });
