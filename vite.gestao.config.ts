import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

const RAIZ = path.resolve(import.meta.dirname)

// O app de gestão (gestao/) é um segundo app Vite, publicado como segundo
// site do Hosting em app.patotina.com.br — por isso base '/' e uma pasta de
// saída própria, separada do dist/ do site + painel. Ver docs/gestao.md, §6.
export default defineConfig({
  root: 'gestao',
  base: '/',
  envDir: RAIZ,
  publicDir: 'public',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Gestão Patotina',
        short_name: 'Patotina',
        description: 'Gestão da Escolinha de Futebol Patotina',
        lang: 'pt-BR',
        start_url: '/',
        display: 'standalone',
        background_color: '#002838',
        theme_color: '#002838',
        icons: [
          { src: '/img/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/img/escudo-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      // O service worker guarda só a casca do app (HTML, JS, CSS, ícones).
      // Os dados vêm do Firestore, que tem a própria persistência offline —
      // é ela que segura a chamada sem sinal no campo, não o cache do SW.
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,webp,svg,woff2}'],
        // O guia "Como usar" (public/ajuda/) é página estática com muitas
        // screenshots: não entra no precache nem cai no fallback do SPA.
        globIgnores: ['ajuda/**'],
        navigateFallback: '/index.html',
        // Firebase e fontes nunca passam pelo SW: o SDK cuida do próprio cache.
        navigateFallbackDenylist: [/^\/__\//, /^\/ajuda/],
      },
      devOptions: { enabled: false },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(RAIZ, './gestao/src'),
      '@shared': path.resolve(RAIZ, './shared'),
    },
  },
  server: { port: 5174 },
  build: {
    target: 'es2022',
    outDir: path.join(RAIZ, 'dist-gestao'),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        // Mesmo recorte do painel: React e Firebase em pedaços que só mudam
        // quando a dependência muda.
        manualChunks(id: string) {
          const pacote = /node_modules\/((?:@[^/]+\/)?[^/]+)\//.exec(id)?.[1]
          if (!pacote) return
          if (pacote === 'firebase' || pacote.startsWith('@firebase')) return 'firebase'
          if (['react', 'react-dom', 'react-router', 'react-router-dom', 'scheduler'].includes(pacote)) {
            return 'react'
          }
        },
      },
    },
  },
})
