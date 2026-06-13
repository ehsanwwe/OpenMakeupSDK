import { defineConfig } from 'vite';
export default defineConfig({
  optimizeDeps: { include: ['three', '@mediapipe/face_mesh', '@mediapipe/camera_utils'] },
});
