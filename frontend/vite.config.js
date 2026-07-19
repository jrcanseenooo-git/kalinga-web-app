import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/script\.google\.com\/.*/i,
            handler: 'NetworkOnly',
          }
        ]
      },
      manifest: {
        name: 'Kalinga CEFMU Registry',
        short_name: 'Kalinga',
        description: 'DSWD Kalinga Program - CEFMU Case Registry',
        theme_color: '#1B4F8C',
        background_color: '#1B4F8C',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/dashboard',
        scope: '/',
        icons: [
          { src: '/icon-192.png',   sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png',   sizes: '512x512', type: 'image/png' },
          { src: '/icon-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      }
    })
  ],
  server: {
    host: '127.0.0.1',
    strictPort: true,
    fs: {
      strict: true,
      deny: ['.env', '.env.*', '*.pem', '*.key', '*.crt', '**/.git/**']
    },
    headers: {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      // Keep this in sync with the production CSP in vercel.json. They drifted
      // once and production silently blocked fonts, the Google Sign-In button
      // styles, Leaflet, the map tiles and script.googleusercontent.com.
      'Content-Security-Policy': "default-src 'self'; script-src 'self' https://accounts.google.com https://apis.google.com https://unpkg.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://accounts.google.com https://unpkg.com; img-src 'self' data: blob: https://*.googleusercontent.com https://*.tile.openstreetmap.org https://*.tile.opentopomap.org https://server.arcgisonline.com; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https://script.google.com https://script.googleusercontent.com https://accounts.google.com https://raw.githubusercontent.com https://nominatim.openstreetmap.org; frame-src https://accounts.google.com; worker-src 'self' blob:; object-src 'none'; base-uri 'self'",
    }
  },
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) }
  }
})
