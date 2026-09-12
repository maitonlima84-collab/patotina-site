import { useEffect, useState } from 'react'
import type { Chamada } from '../types'
import { subscribeChamada, subscribeChamadasEntre } from '../repositories/chamadaRepository'

export function useChamada(turmaId: string, data: string) {
  const [chamada, setChamada] = useState<Chamada | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    if (!turmaId || !data) return
    setLoading(true)
    return subscribeChamada(turmaId, data, (c) => {
      setChamada(c)
      setLoading(false)
    })
  }, [turmaId, data])
  return { chamada, loading }
}

export function useChamadasEntre(de: string, ate: string) {
  const [chamadas, setChamadas] = useState<Chamada[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    setLoading(true)
    return subscribeChamadasEntre(de, ate, (c) => {
      setChamadas(c)
      setLoading(false)
    })
  }, [de, ate])
  return { chamadas, loading }
}
