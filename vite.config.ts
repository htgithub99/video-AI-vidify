import * as COMMON_RUNTIME from "./src/constants/sourceText.js";
import { RUNTIME_VALUES } from "./src/constants/runtime/values.js";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";
import { DEV_WATCH_IGNORED } from "./src/constants/development";
import { STORAGE_CONFIG } from "./src/constants/storage";
import { DOCUMENT_CONFIG } from "./src/constants/document";
import { stringifyJson } from "./src/lib/jsonStringify";
export default defineConfig(() => {
  return {
    plugins: [
      {
        name: RUNTIME_VALUES.DOCUMENT_CONFIG_FD1AF753,
        transformIndexHtml: {
          order: RUNTIME_VALUES.PRE_695252F6,
          handler: (html) =>
            html.replace(/"%DOCUMENT_THEME%"|%DOCUMENT_(TITLE|FONTS_ORIGIN|FONTS_STATIC_ORIGIN|FONT_STYLESHEET)%/g, (_, key: keyof typeof DOCUMENT_CONFIG | undefined) =>
              key ? String(DOCUMENT_CONFIG[key]).replace(/&/g, RUNTIME_VALUES.AMP_CC6B69B4).replace(/"/g, RUNTIME_VALUES.QUOT_49755823).replace(/</g, RUNTIME_VALUES.LT_3885FF5A).replace(/>/g, RUNTIME_VALUES.GT_77D57E39) : stringifyJson(DOCUMENT_CONFIG.THEME).replace(/</g, RUNTIME_VALUES.U003C_9F9FDABE),
            ),
        },
      },
      react(),
      tailwindcss(),
    ],
    resolve: { alias: { "@": path.resolve(__dirname, COMMON_RUNTIME.SOURCE_TEXT_SYMBOL_23) } },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes(RUNTIME_VALUES.SRC_CONSTANTS_PROMPTS_D560D33D)) return RUNTIME_VALUES.PROMPTS_EB752636;
            if (id.includes(RUNTIME_VALUES.SRC_CONSTANTS_TEXTS_C02A15DD) || id.includes(RUNTIME_VALUES.SRC_CONSTANTS_DATA_6D08119E) || id.includes(RUNTIME_VALUES.SRC_CONSTANTS_PROMPTGUIDELINES_CC0BBD61)) return COMMON_RUNTIME.SOURCE_TEXT_CONTENT;
            if (id.includes(RUNTIME_VALUES.NODE_MODULES_LODASH_46030180)) return RUNTIME_VALUES.LODASH_94A75553;
            if (id.includes(RUNTIME_VALUES.NODE_MODULES_LUCIDE_REACT_486017FA)) return RUNTIME_VALUES.ICONS_04CE686A;
            if (id.includes(RUNTIME_VALUES.NODE_MODULES_REACT_02C7D3BA) || id.includes(RUNTIME_VALUES.NODE_MODULES_SCHEDULER_1F7B4563)) return RUNTIME_VALUES.REACT_27597608;
          },
        },
      },
    },
    server: { watch: { ignored: [...DEV_WATCH_IGNORED, ...(process.env[STORAGE_CONFIG.ENV_DIR] ? [path.resolve(process.env[STORAGE_CONFIG.ENV_DIR]!).replace(/\\/g, COMMON_RUNTIME.SOURCE_TEXT_SYMBOL) + RUNTIME_VALUES.VALUE_8D64A30D] : [])] } },
  };
});
