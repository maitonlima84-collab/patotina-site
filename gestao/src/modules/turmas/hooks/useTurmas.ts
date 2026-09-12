import { useEffect, useMemo, useState } from 'react'
import type { Turma } from '../types'
import { subscribeTurmas } from '../repositories/turmasRepository'

// Todas as turmas, em tempo real, ativas primeiro e por nome. A lista é
// pequena (uma escolinha tem meia dúzia); quem precisa filtra em memória.
export function useTurmas() {
  const [rows, setRows] = useState<Turma[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    return subscribeTurmas((r, e) => {
      setRows(r)
      setErro(e ?? null)
      setLoading(false)
    })
  }, [])

  const ordenadas = useMemo(
    () => rows.slice().sort((a, b) => Number(b.ativa) - Number(a.ativa) || a.nome.localeCompare(b.nome, 'pt-BR')),
    [rows],
  )
  const porId = useMemo(() => new Map(ordenadas.map((t) => [t.id, t])), [ordenadas])

  return { rows: ordenadas, porId, loading, erro }
}
