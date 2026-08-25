import { defineConfig } from 'vite';
import { resolve } from 'path';

// Trigger deployment build 
export default defineConfig({
  plugins: [],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        deleteAccount: resolve(__dirname, 'delete-account.html'),
      },
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three')) {
            return 'three-vendor';
          }
          if (id.includes('node_modules/gsap') || id.includes('node_modules/lenis')) {
            return 'animation-vendor';
          }
        }
      }
    }
  }
});
