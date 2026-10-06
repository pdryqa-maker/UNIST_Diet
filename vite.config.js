import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' keeps asset and data paths relative, so the build works on
// GitHub Pages (https://<user>.github.io/<repo>/) without hard-coding the repo name.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    // recharts(+d3) is the bulk of the bundle; keep it in its own cacheable chunk.
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: { charts: ['recharts'] },
      },
    },
  },
});
