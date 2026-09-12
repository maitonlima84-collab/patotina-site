// Monta a pasta publicada no Hosting: o site público (site/) vai para a raiz
// de dist/, e em seguida o `vite build` grava o painel em dist/app/.
// Uma pasta só, um deploy só — www.patotina.com.br e /app no mesmo lugar.
import fs from 'node:fs'
import path from 'node:path'

const raiz = path.resolve(import.meta.dirname, '..')
const origem = path.join(raiz, 'site')
const destino = path.join(raiz, 'dist')

fs.rmSync(destino, { recursive: true, force: true })
fs.mkdirSync(destino, { recursive: true })
fs.cpSync(origem, destino, { recursive: true })

console.log(`site/ copiado para dist/ (${fs.readdirSync(destino).length} itens)`)
