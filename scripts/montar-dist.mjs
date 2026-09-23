// Monta a pasta publicada no site "patotina" do Hosting: o site público
// (site/) é tudo o que vai em dist/. O painel não entra aqui — é publicado
// com a gestão, em dist-gestao/painel/ (shared/lib/enderecos.ts diz por quê).
import fs from 'node:fs'
import path from 'node:path'

const raiz = path.resolve(import.meta.dirname, '..')
const origem = path.join(raiz, 'site')
const destino = path.join(raiz, 'dist')

fs.rmSync(destino, { recursive: true, force: true })
fs.mkdirSync(destino, { recursive: true })
fs.cpSync(origem, destino, { recursive: true })

console.log(`site/ copiado para dist/ (${fs.readdirSync(destino).length} itens)`)
