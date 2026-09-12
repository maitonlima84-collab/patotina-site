import { useEffect, useMemo, useState } from 'react'
import { normalizar } from '@shared/lib/utils'
import type { Aluno, Situacao } from '../types'
import { subscribeAlunos } from '../repositories/alunosRepository'

// Todos os alunos, em tempo real. A lista é pequena (uma escolinha), então
// busca e filtros rodam no navegador — sem índice, sem paginação.
export function useAlunos() {
  const [rows, setRows] = useState<Aluno[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    return subscribeAlunos((r, e) => {
      setRows(r)
      setErro(e ?? null)
      setLoading(false)
    })
  }, [])

  const ordenados = useMemo(() => rows.slice().sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')), [rows])
  const porId = useMemo(() => new Map(ordenados.map((a) => [a.id, a])), [ordenados])

  return { rows: ordenados, porId, loading, erro }
}

export function filtrarAlunos(alunos: Aluno[], { busca, turmaId, situacao }: { busca: string; turmaId: string; situacao: Situacao | '' }) {
  const termo = normalizar(busca)
  return alunos.filter(
    (a) =>
      (!termo || (a.nomeBusca ?? normalizar(a.nome)).includes(termo)) &&
      // 'sem' pede quem não tem turma; vazio não filtra por turma.
      (!turmaId || (turmaId === 'sem' ? !a.turmaId : a.turmaId === turmaId)) &&
      (!situacao || a.situacao === situacao),
  )
}
