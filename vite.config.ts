import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";
import { DEV_WATCH_IGNORED } from "./src/constants/development";
import { STORAGE_CONFIG } from "./src/constants/storage";
export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: { alias: { "@": path.resolve(__dirname, ".") } },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("/src/constants/prompts")) return "prompts";
            if (id.includes("/src/constants/texts") || id.includes("/src/constants/data") || id.includes("/src/constants/promptGuidelines")) return "content";
            if (id.includes("/node_modules/lodash")) return "lodash";
            if (id.includes("/node_modules/lucide-react")) return "icons";
            if (id.includes("/node_modules/react") || id.includes("/node_modules/scheduler")) return "react";
          },
        },
      },
    },
    server: { watch: { ignored: [...DEV_WATCH_IGNORED, ...(process.env[STORAGE_CONFIG.ENV_DIR] ? [path.resolve(process.env[STORAGE_CONFIG.ENV_DIR]!).replace(/\\/g, "/") + "/**"] : [])] } },
  };
});
