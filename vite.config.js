import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8'));

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Usamos nuestro propio manifest.webmanifest en /public
      manifest: false,
      includeAssets: [
        'favicon.ico',
        'apple-touch-icon.png',
        'icon-192.png',
        'icon-192-maskable.png',
        'icon-512.png',
        'icon-512-maskable.png',
        'manifest.webmanifest',
        '.well-known/assetlinks.json',
      ],
      workbox: {
        // Cachear los assets generados por Vite + nuestros estáticos
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
        // Las llamadas a Supabase NO se cachean (siempre frescas)
        navigateFallbackDenylist: [/^\/api/, /supabase\.co/],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkOnly',
          },
        ],
      },
      devOptions: {
        // En dev no registramos SW para no marear con cachés viejas
        enabled: false,
      },
    }),
  ],
  server: {
    port: 5173,
    open: false,
  },
});
