import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  const apiTarget = env.VITE_API_BASE_URL || 'http://localhost:8080';
  const apiPrefix = env.VITE_API_PREFIX || '/api/v1';

  const pathParts = apiPrefix.split('/').filter(Boolean);
  const proxyKey = `/${pathParts[0]}`;

  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        devOptions: {
          enabled: true,
        },
        manifest: {
          name: 'IT Asset Management',
          short_name: 'ITAM',
          description: 'Hệ thống Quản lý Tài sản CNTT của tổ chức',
          id: '/?appv=1',
          start_url: '/?appv=1',
          theme_color: '#4f46e5',
          background_color: '#ffffff',
          display: 'standalone',
          orientation: 'portrait',
          categories: ['productivity', 'business'],
          icons: [
            {
              src: '/favicon.svg',
              sizes: '192x192 512x512',
              type: 'image/svg+xml',
              purpose: 'any maskable'
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
          navigateFallback: '/index.html',
          // Allow all navigation requests to be handled by the fallback
          navigateFallbackAllowlist: [/^\/[^._]+$/]
        }
      })
    ],
    server: {
      proxy: {
        [proxyKey]: {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
        }
      },
      allowedHosts: ['.ngrok-free.dev', '.ngrok-free.app']
    },
    build: {
      chunkSizeWarningLimit: 800,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('recharts')) {
                return 'vendor-charts';
              }
              if (id.includes('html5-qrcode')) {
                return 'vendor-scanner';
              }
              if (id.includes('lucide-react')) {
                return 'vendor-icons';
              }
              if (
                id.includes('node_modules/react') ||
                id.includes('node_modules/scheduler') ||
                id.includes('use-sync-external-store')
              ) {
                return 'vendor-react';
              }
              return 'vendor';
            }
          }
        }
      }
    }
  };
});