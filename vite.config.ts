import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ command }) => {
  // Em produção (build) usa o subcaminho do GitHub Pages.
  // No localhost (dev), usa a raiz '/' para abrir direto em http://localhost:5173/
  const isBuild = command === 'build';
  const base = isBuild ? '/Gelatio/' : '/';

  return {
    base,
    server: {
      port: 5173,
      host: true, // Permite acesso também pelo IP da rede local (ex: celular ou tablet no Wi-Fi)
      strictPort: false,
      watch: {
        ignored: ['**/Fontes/**', '**/*.xlsx', '**/*.pdf']
      }
    },
    build: {
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('react-dom')) {
                return 'vendor-react';
              }
              if (id.includes('dexie')) {
                return 'vendor-dexie';
              }
              if (id.includes('lucide-react')) {
                return 'vendor-icons';
              }
              return 'vendor-ui';
            }
          }
        }
      }
    },
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'favicon.svg', 'apple-touch-icon.png', 'pwa-192x192.png', 'pwa-512x512.png', 'pwa-maskable-512.png', 'gelatio-logo.png'],
        manifest: {
          name: 'Gelatio — Calculadora & Balanceamento',
          short_name: 'Gelatio',
          description: 'Balanceamento e formulação profissional de receitas de gelato artesanal',
          theme_color: '#0f172a',
          background_color: '#0f172a',
          display: 'standalone',
          orientation: 'portrait-primary',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: 'pwa-maskable-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable'
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
          skipWaiting: true,
          clientsClaim: true,
          cleanupOutdatedCaches: true
        }
      })
    ]
  };
});
