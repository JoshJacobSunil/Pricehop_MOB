import { defineConfig } from 'vite';

// Trigger deployment build 
export default defineConfig({
  plugins: [],
  build: {
    outDir: 'dist',
    rollupOptions: {
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
