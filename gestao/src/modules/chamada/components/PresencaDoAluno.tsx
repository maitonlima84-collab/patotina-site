import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { cn, dataBr, hojeIso } from '@shared/lib/utils'
import type { Aluno } from '@/modules/alunos/types'
import { PRESENCAS } from '../types'
import { useChamadasEntre } from '../hooks/useChamada'
import { frequenciaDoAluno, primeiroDiaDoMes, somarMeses } from '../services/chamadaService'

// A aba "Presença" da ficha: os últimos três meses, resumo e as faltas.
export function PresencaDoAluno({ aluno }: { aluno: Aluno }) {
  const hoje = hojeIso()
  const de = primeiroDiaDoMes(somarMeses(hoje.slice(0, 7), -2))
  const { chamadas, loading } = useChamadasEntre(de, hoje)
  const freq = useMemo(() => frequenciaDoAluno(aluno.id, chamadas), [aluno.id, chamadas])
  const registros = useMemo(
    () =>
      chamadas
        .filter((c) => c.presencas?.[aluno.id])
        .sort((a, b) => b.data.localeCompare(a.data))
        .map((c) => ({ id: c.id, data: c.data, p: c.presencas[aluno.id]!, turmaId: c.turmaId })),
    [chamadas, aluno.id],
  )

  if (loading) return <p className="py-6 text-center text-gray">Carregando…</p>
  if (freq.total === 0) return <p className="rounded-xl border border-dashed border-line p-8 text-center text-gray">Nenhuma chamada registrada para este aluno nos últimos três meses.</p>

  return (
    <>
      <div className="mb-4 grid grid-cols-4 gap-2 text-center">
        <Numero rotulo="Presença" valor={freq.percentual == null ? '—' : `${freq.percentual}%`} cor={freq.percentual != null && freq.percentual < 75 ? 'text-red-200' : 'text-green'} />
        <Numero rotulo="Presentes" valor={freq.presentes} />
        <Numero rotulo="Faltas" valor={freq.faltas} cor={freq.faltas > 0 ? 'text-red-200' : undefined} />
        <Numero rotulo="Justificadas" valor={freq.justificadas} cor="text-gold" />
      </div>
      {freq.faltasSeguidas >= 3 && (
        <p className="mb-4 rounded-lg border border-red-2/50 bg-red-2/15 px-3.5 py-2.5 text-[0.95rem] text-red-200">
          {freq.faltasSeguidas} faltas seguidas — vale ligar para a família.
        </p>
      )}
      <ul className="rounded-xl border border-line">
        {registros.map((r) => (
          <li key={r.id} className="flex items-center gap-3 border-b border-line px-3 py-2 last:border-0">
            <span className={cn('font-anton', r.p === 'P' ? 'text-green' : r.p === 'F' ? 'text-red-200' : 'text-gold')}>{r.p}</span>
            <span>{dataBr(r.data)}</span>
            <span className="text-gray">{PRESENCAS[r.p].nome}</span>
            <Link to={`/chamada?turma=${r.turmaId}&data=${r.data}`} className="ml-auto text-[0.8rem] text-gray hover:text-gold">
              ver chamada
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[0.8rem] text-gray">Desde {dataBr(de)}.</p>
    </>
  )
}

function Numero({ rotulo, valor, cor }: { rotulo: string; valor: string | number; cor?: string }) {
  return (
    <div className="rounded-xl border border-line bg-navy-2 p-3">
      <div className={cn('font-anton text-[1.5rem] leading-none', cor ?? 'text-cream')}>{valor}</div>
      <div className="rotulo mt-1 text-[0.65rem]">{rotulo}</div>
    </div>
  )
}
