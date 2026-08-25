import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  // GitHub Pages（https://ko-dai0525.github.io/my-study-english-app/）配下で配信するため
  base: '/my-study-english-app/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'My English Study',
        short_name: '英語学習',
        description: '単語・熟語を登録してカードとクイズで学習できるアプリ',
        lang: 'ja',
        display: 'standalone',
        theme_color: '#4f46e5',
        background_color: '#f8fafc',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
})
