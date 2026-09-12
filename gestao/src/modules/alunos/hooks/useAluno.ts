import { useEffect, useState } from 'react'
import type { Aluno, Historico } from '../types'
import { subscribeAluno, subscribeHistorico } from '../repositories/alunosRepository'

export function useAluno(id: string | undefined) {
  const [aluno, setAluno] = useState<Aluno | null>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    return subscribeAluno(id, (a, e) => {
      setAluno(a)
      setErro(e ?? null)
      setLoading(false)
    })
  }, [id])

  return { aluno, loading, erro }
}

export function useHistorico(id: string | undefined) {
  const [itens, setItens] = useState<Historico[]>([])
  useEffect(() => {
    if (!id) return
    return subscribeHistorico(id, setItens)
  }, [id])
  return itens
}
