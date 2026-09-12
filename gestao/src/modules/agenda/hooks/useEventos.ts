import { useEffect, useMemo, useState } from 'react'
import type { Evento } from '../types'
import { subscribeEventos } from '../repositories/eventosRepository'

export function useEventos() {
  const [rows, setRows] = useState<Evento[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  useEffect(
    () =>
      subscribeEventos((r, e) => {
        setRows(r)
        setErro(e ?? null)
        setLoading(false)
      }),
    [],
  )
  const ordenados = useMemo(() => rows.slice().sort((a, b) => a.data.localeCompare(b.data) || a.hora.localeCompare(b.hora)), [rows])
  const porId = useMemo(() => new Map(ordenados.map((e) => [e.id, e])), [ordenados])
  return { rows: ordenados, porId, loading, erro }
}
