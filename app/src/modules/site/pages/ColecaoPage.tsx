import { useState } from 'react'
import { useAviso } from '@shared/components/Aviso'
import { PageHeader } from '@shared/components/PageHeader'
import { Botao } from '@shared/components/ui/Botao'
import { mensagemDeErro } from '@shared/lib/erros'
import type { SecaoDef } from '../colecoes'
import type { ItemDoSite } from '../types'
import { useColecao } from '../hooks/useColecao'
import { moverItem } from '../services/siteService'
import { ItemFormDialog } from '../components/ItemFormDialog'
import { ItemLinha } from '@shared/components/ItemLinha'

// A tela de qualquer seção em lista (turmas, títulos, parceiros…): a mesma
// página, com a definição da seção dizendo o que mostrar e o que editar.
export function ColecaoPage({ secao }: { secao: SecaoDef }) {
  const { rows, loading, erro } = useColecao(secao)
  const avisar = useAviso()
  const [editando, setEditando] = useState<{ item: ItemDoSite | null } | null>(null)

  async function mover(de: number, para: number) {
    try {
      await moverItem(secao, rows, de, para)
    } catch (e) {
      avisar(mensagemDeErro(e), true)
    }
  }

  return (
    <>
      <PageHeader titulo={secao.titulo} ajuda={secao.ajuda}>
        <Botao variante="principal" onClick={() => setEditando({ item: null })}>
          + Adicionar {secao.nomeItem}
        </Botao>
      </PageHeader>

      {erro && <p className="mb-4 rounded-lg border border-red-2/50 bg-red-2/15 px-3.5 py-2.5 text-red-200">{erro}</p>}

      {loading ? (
        <p className="py-10 text-center text-gray">Carregando…</p>
      ) : rows.length === 0 ? (
        <p className="rounded-[14px] border border-dashed border-line px-4 py-10 text-center text-gray">
          Nada cadastrado aqui ainda. Toque em "Adicionar {secao.nomeItem}".
        </p>
      ) : (
        rows.map((item, i) => (
          <ItemLinha
            key={item.id}
            nome={secao.nome(item)}
            resumo={secao.resumo(item)}
            miniatura={secao.miniatura?.(item)}
            visivel={item.visivel}
            ordenavel={secao.ordenavel}
            primeiro={i === 0}
            ultimo={i === rows.length - 1}
            onSubir={() => void mover(i, i - 1)}
            onDescer={() => void mover(i, i + 1)}
            onEditar={() => setEditando({ item })}
          />
        ))
      )}

      <ItemFormDialog
        secao={secao}
        item={editando?.item ?? null}
        ultimo={rows[rows.length - 1]}
        aberta={editando !== null}
        onFechar={() => setEditando(null)}
      />
    </>
  )
}
