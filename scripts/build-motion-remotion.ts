import path from "node:path";
import { bundle } from "@remotion/bundler";
import { MOTION_VISUAL as V } from "../src/constants/motionVisual.js";
import { motionRemotionWebpack } from "../src/features/motion/server/services/remotion/bundleConfig.js";
await bundle({ entryPoint: path.resolve("src/features/motion/remotion/Root.tsx"), outDir: path.resolve("dist", V.BUNDLE_FOLDER), publicDir: null, webpackOverride: motionRemotionWebpack });
