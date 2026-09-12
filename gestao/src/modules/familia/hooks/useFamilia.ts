import { useEffect, useState } from 'react'
import type { Aluno } from '@/modules/alunos/types'
import { subscribeAluno } from '@/modules/alunos/repositories/alunosRepository'
import type { Cobranca } from '@/modules/mensalidades/types'
import { subscribeCobrancasDoAluno } from '@/modules/mensalidades/repositories/cobrancasRepository'

// Os filhos de uma conta de família, um a um: a regra do Firestore libera
// documento por documento (não uma lista), então cada id vira uma assinatura.
export function useFilhos(alunoIds: string[]) {
  const [filhos, setFilhos] = useState<Record<string, Aluno>>({})
  const chave = alunoIds.join(',')
  useEffect(() => {
    setFilhos({})
    const parar = alunoIds.map((id) =>
      subscribeAluno(id, (a) =>
        setFilhos((atual) => {
          const novo = { ...atual }
          if (a) novo[id] = a
          else delete novo[id]
          return novo
        }),
      ),
    )
    return () => parar.forEach((p) => p())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave])
  return alunoIds.map((id) => filhos[id]).filter((a): a is Aluno => !!a)
}

export function useCobrancasDosFilhos(alunoIds: string[]) {
  const [porAluno, setPorAluno] = useState<Record<string, Cobranca[]>>({})
  const chave = alunoIds.join(',')
  useEffect(() => {
    setPorAluno({})
    const parar = alunoIds.map((id) => subscribeCobrancasDoAluno(id, (c) => setPorAluno((atual) => ({ ...atual, [id]: c }))))
    return () => parar.forEach((p) => p())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave])
  return porAluno
}
