import fs from 'node:fs'
import path from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const RAIZ = path.resolve(import.meta.dirname)
const SITE = path.join(RAIZ, 'site')

const TIPOS: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
}

// No `npm run dev` o mesmo servidor entrega o site público (site/, em `/`) e o
// painel (app/, em `/painel/`), sem precisar de build para ver o site. Em
// produção o painel mora no endereço da gestão (shared/lib/enderecos.ts): o
// jeito de usar em dev é por http://localhost:5174/painel/, que repassa para
// cá e divide o login com a gestão. /app e /admin levam para lá, como no ar.
function servirSite(): Plugin {
  return {
    name: 'patotina-site-estatico',
    configureServer(servidor) {
      servidor.middlewares.use((req, res, next) => {
        const url = new URL(req.url ?? '/', 'http://localhost')
        if (url.pathname.startsWith('/painel') || url.pathname.startsWith('/@') || url.pathname.startsWith('/node_modules')) {
          return next()
        }
        if (/^\/(app|admin)(\/|$)/.test(url.pathname)) {
          res.writeHead(302, { location: 'http://localhost:5174/painel/' })
          return res.end()
        }
        let arquivo = path.join(SITE, decodeURIComponent(url.pathname))
        if (fs.existsSync(arquivo) && fs.statSync(arquivo).isDirectory()) arquivo = path.join(arquivo, 'index.html')
        if (!arquivo.startsWith(SITE) || !fs.existsSync(arquivo)) return next()
        res.setHeader('content-type', TIPOS[path.extname(arquivo)] ?? 'application/octet-stream')
        res.setHeader('cache-control', 'no-cache')
        fs.createReadStream(arquivo).pipe(res)
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  root: 'app',
  base: '/painel/',
  // Os .env ficam na raiz do repositório, não em app/.
  envDir: RAIZ,
  publicDir: 'public',
  plugins: [react(), tailwindcss(), servirSite()],
  resolve: {
    alias: {
      '@': path.resolve(RAIZ, './app/src'),
      // O que o painel e o app de gestão (gestao/) têm em comum.
      '@shared': path.resolve(RAIZ, './shared'),
    },
  },
  server: { port: 5173 },
  build: {
    target: 'es2022',
    // O painel é publicado dentro do site da gestão. Este build roda DEPOIS
    // do da gestão (package.json), que esvazia dist-gestao/ inteiro; este só
    // esvazia a própria pasta.
    outDir: path.join(RAIZ, 'dist-gestao/painel'),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        // React e Firebase só mudam quando a dependência muda: em pedaços
        // separados, sobrevivem às publicações do código do painel.
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
