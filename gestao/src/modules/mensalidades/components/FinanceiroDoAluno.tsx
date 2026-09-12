import { useState } from 'react'
import type { Aluno } from '@/modules/alunos/types'
import { useConfiguracoes } from '@/modules/configuracoes/hooks/useConfiguracoes'
import type { Cobranca } from '../types'
import { useCobrancasDoAluno } from '../hooks/useCobrancas'
import { CobrancaLinha } from './CobrancaLinha'
import { PagamentoDialog } from './PagamentoDialog'

// As cobranças de um aluno, da mais recente para a mais antiga.
export function FinanceiroDoAluno({ aluno }: { aluno: Aluno }) {
  const { rows, loading } = useCobrancasDoAluno(aluno.id)
  const { config } = useConfiguracoes()
  const [pagando, setPagando] = useState<Cobranca | null>(null)
  const ordenadas = rows.slice().sort((a, b) => b.competencia.localeCompare(a.competencia))

  if (loading) return <p className="py-6 text-center text-gray">Carregando…</p>
  return (
    <>
      {ordenadas.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line p-8 text-center text-gray">Nenhuma cobrança ainda. Elas nascem em Mensalidades, "Gerar cobranças do mês".</p>
      ) : (
        ordenadas.map((c) => <CobrancaLinha key={c.id} cobranca={c} aluno={aluno} config={config} mostrarMes onPagar={setPagando} />)
      )}
      <PagamentoDialog cobranca={pagando} onFechar={() => setPagando(null)} />
    </>
  )
}
