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
// painel (app/, em `/app/`) — o mesmo desenho do Hosting em produção, sem
// precisar de build nem de um segundo servidor para ver o site.
function servirSite(): Plugin {
  return {
    name: 'patotina-site-estatico',
    configureServer(servidor) {
      servidor.middlewares.use((req, res, next) => {
        const url = new URL(req.url ?? '/', 'http://localhost')
        if (url.pathname.startsWith('/app') || url.pathname.startsWith('/@') || url.pathname.startsWith('/node_modules')) {
          return next()
        }
        if (url.pathname === '/admin' || url.pathname === '/admin/') {
          res.writeHead(302, { location: '/app/' })
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
  base: '/app/',
  // Os .env ficam na raiz do repositório, não em app/.
  envDir: RAIZ,
  publicDir: 'public',
  plugins: [react(), tailwindcss(), servirSite()],
  resolve: {
    alias: {
      '@': path.resolve(RAIZ, './app/src'),
    },
  },
  server: { port: 5173 },
  build: {
    target: 'es2022',
    // O site/ já foi copiado para dist/ por scripts/montar-dist.mjs antes
    // deste build; o painel entra em dist/app/ sem apagar o resto.
    outDir: path.join(RAIZ, 'dist/app'),
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
