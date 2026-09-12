import { useEffect, useState } from 'react'
import type { Cobranca } from '../types'
import { subscribeCobrancasAbertas, subscribeCobrancasDaCompetencia, subscribeCobrancasDoAluno } from '../repositories/cobrancasRepository'

function usar(assinar: (onChange: (c: Cobranca[]) => void) => () => void, deps: unknown[], ligado = true) {
  const [rows, setRows] = useState<Cobranca[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    if (!ligado) {
      setLoading(false)
      return
    }
    setLoading(true)
    return assinar((c) => {
      setRows(c.slice().sort((a, b) => a.alunoNome.localeCompare(b.alunoNome, 'pt-BR')))
      setLoading(false)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, ligado])
  return { rows, loading }
}

export const useCobrancasDoMes = (competencia: string, ligado = true) => usar((f) => subscribeCobrancasDaCompetencia(competencia, f), [competencia], ligado)
export const useCobrancasDoAluno = (alunoId: string) => usar((f) => subscribeCobrancasDoAluno(alunoId, f), [alunoId])
export const useCobrancasAbertas = (ligado = true) => usar((f) => subscribeCobrancasAbertas(f), [], ligado)
