import type { SecaoDef } from '../colecoes'
import type { ItemDoSite } from '../types'
import { apagarImagem, criarItem, editarItem, removerItem, reordenar } from '../repositories/siteRepository'

// Regras de gravação que não são do banco nem da tela: o que acontece com a
// imagem antiga ao trocar/apagar, onde entra um item novo na ordem.

const campoImagem = (secao: SecaoDef) => secao.campos.find((c) => c.t === 'imagem')?.n
const comoRegistro = (item: ItemDoSite) => item as unknown as Record<string, unknown>

export async function salvarItem(secao: SecaoDef, item: ItemDoSite | null, valores: Record<string, unknown>, ultimo?: ItemDoSite) {
  const imagem = campoImagem(secao)

  if (item) {
    await editarItem(secao.colecao, item.id, valores)
    // Troca de logo: o arquivo velho sai do Storage para não virar entulho.
    if (imagem) {
      const antes = comoRegistro(item)[imagem]
      if (typeof antes === 'string' && antes && antes !== valores[imagem]) await apagarImagem(antes)
    }
    return item.id
  }

  // Item novo entra no fim da lista ordenável.
  const dados = { ...valores }
  if (secao.ordenavel) dados.ordem = ((ultimo as { ordem?: number } | undefined)?.ordem ?? 0) + 10
  return criarItem(secao.colecao, dados)
}

export async function apagarItem(secao: SecaoDef, item: ItemDoSite) {
  await removerItem(secao.colecao, item.id)
  const imagem = campoImagem(secao)
  const caminho = imagem ? comoRegistro(item)[imagem] : ''
  if (typeof caminho === 'string' && caminho) await apagarImagem(caminho)
}

export async function moverItem(secao: SecaoDef, itens: ItemDoSite[], de: number, para: number) {
  const nova = itens.slice()
  ;[nova[de], nova[para]] = [nova[para]!, nova[de]!]
  await reordenar(
    secao.colecao,
    nova.map((i) => i.id),
  )
}
