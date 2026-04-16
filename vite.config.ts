import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true,
        type: 'module'
      },
      includeAssets: ['icon-192x192.png', 'icon-512x512.png'],
      manifest: {
        name: 'Aether OS',
        short_name: 'Aether',
        description: 'Premium Life & Wealth Management',
        theme_color: '#F4F9F2',
        background_color: '#F4F9F2',
        display: 'standalone',
        icons: [
          {
            src: '/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 4000000 
      }
    })
  ],
  // ---> ESTO ES LO QUE FALTABA (EL TRADUCTOR DEL ARROBA) <---
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})