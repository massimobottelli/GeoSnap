import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  // Sviluppo: root "/". Build statica (GitHub Pages project page): "/<repo>/".
  base: command === 'build' ? '/GeoSnap/' : '/',
  plugins: [react(), tailwindcss()],
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
}));
