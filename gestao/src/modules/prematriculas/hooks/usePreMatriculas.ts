import { useEffect, useMemo, useState } from 'react'
import type { PreMatricula } from '../types'
import { subscribePreMatriculas } from '../repositories/preMatriculasRepository'

const quando = (p: PreMatricula) => {
  const c = p.criadoEm
  if (!c) return 0
  return c instanceof Date ? c.getTime() : c.toDate().getTime()
}

export function usePreMatriculas(ligado = true) {
  const [rows, setRows] = useState<PreMatricula[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  useEffect(() => {
    if (!ligado) return
    return subscribePreMatriculas((r, e) => {
      setRows(r)
      setErro(e ?? null)
      setLoading(false)
    })
  }, [ligado])
  // Mais recentes primeiro.
  const ordenadas = useMemo(() => rows.slice().sort((a, b) => quando(b) - quando(a)), [rows])
  return { rows: ordenadas, loading, erro }
}

export const dataDaPre = (p: PreMatricula) => (quando(p) ? new Date(quando(p)).toLocaleDateString('pt-BR') : '')
