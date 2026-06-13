import { defineConfig } from 'vite';

// Pre-bundle the bundler-unfriendly deps so the bare imports resolve cleanly.
export default defineConfig({
  optimizeDeps: {
    include: ['three', '@mediapipe/face_mesh', '@mediapipe/camera_utils'],
  },
});
