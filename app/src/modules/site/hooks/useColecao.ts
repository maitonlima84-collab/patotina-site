import { useEffect, useMemo, useState } from 'react'
import type { SecaoDef } from '../colecoes'
import type { ItemDoSite } from '../types'
import { subscribeColecao } from '../repositories/siteRepository'

// A lista de uma seção, em tempo real e já na ordem do site. `erro` ao lado
// de `rows`, como nos hooks do OnTrac: a tela decide como contar.
export function useColecao(secao: SecaoDef) {
  const [rows, setRows] = useState<ItemDoSite[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    return subscribeColecao<ItemDoSite>(secao.colecao, (r, e) => {
      setRows(r)
      setErro(e ?? null)
      setLoading(false)
    })
  }, [secao])

  const ordenados = useMemo(() => rows.slice().sort(secao.ordenar), [rows, secao])

  return { rows: ordenados, loading, erro }
}
