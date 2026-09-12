import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('/src/constants/prompts')) return 'prompts';
            if (id.includes('/src/constants/texts') || id.includes('/src/constants/data') || id.includes('/src/constants/promptGuidelines')) return 'content';
            if (id.includes('/node_modules/lodash')) return 'lodash';
            if (id.includes('/node_modules/lucide-react')) return 'icons';
            if (id.includes('/node_modules/react') || id.includes('/node_modules/scheduler')) return 'react';
          },
        },
      },
    },
    server: {
      // In middleware mode server.ts owns the HMR socket configuration so the
      // browser uses the same port as Express instead of a stale fallback port.
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: {
        ignored: [
          '**/projects.json',
          '**/google_profile/**',
          /[\\/]projects\.json$/,
          /[\\/]google_profile[\\/]/
        ]
      },
    },
  };
});
