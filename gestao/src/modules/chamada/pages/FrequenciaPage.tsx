import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react'
import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '@shared/auth/AuthProvider'
import { PageHeader } from '@shared/components/PageHeader'
import { BotaoMini } from '@shared/components/ui/Botao'
import { Selecao } from '@shared/components/ui/Campos'
import { cn, hojeIso } from '@shared/lib/utils'
import { useAlunos } from '@/modules/alunos/hooks/useAlunos'
import { useTurmas } from '@/modules/turmas/hooks/useTurmas'
import type { Presenca } from '../types'
import { useChamadasEntre } from '../hooks/useChamada'
import { datasDeTreino, frequenciaDoAluno, nomeDoMes, primeiroDiaDoMes, somarMeses, ultimoDiaDoMes } from '../services/chamadaService'

const COR: Record<Presenca, string> = { P: 'text-green', F: 'bg-red-2/25 text-red-200', J: 'text-gold' }

// A grade do mês: aluno × treino. Treino previsto pelo horário e não chamado
// aparece como coluna vazia — é o que denuncia a chamada esquecida.
export function FrequenciaPage() {
  const { user, isGestor } = useAuth()
  const { rows: turmas } = useTurmas()
  const { rows: alunos } = useAlunos()
  const [params, setParams] = useSearchParams()
  const mes = params.get('mes') ?? hojeIso().slice(0, 7)
  const minhas = turmas.filter((t) => isGestor || t.professorUid === user?.uid)
  const turmaId = params.get('turma') ?? minhas[0]?.id ?? ''
  const turma = turmas.find((t) => t.id === turmaId)

  const de = primeiroDiaDoMes(mes)
  const ate = ultimoDiaDoMes(mes)
  const { chamadas, loading } = useChamadasEntre(de, ate)
  const daTurma = useMemo(() => chamadas.filter((c) => c.turmaId === turmaId), [chamadas, turmaId])

  // Colunas: treinos previstos ∪ chamadas feitas (uma chamada fora do
  // horário — jogo, treino extra — também conta).
  const datas = useMemo(() => {
    const s = new Set<string>(turma ? datasDeTreino(turma, de, ate) : [])
    for (const c of daTurma) s.add(c.data)
    return [...s].sort()
  }, [turma, de, ate, daTurma])
  const porData = useMemo(() => new Map(daTurma.map((c) => [c.data, c])), [daTurma])

  const linhas = useMemo(
    () => alunos.filter((a) => a.turmaId === turmaId && a.situacao === 'ativo').map((a) => ({ aluno: a, freq: frequenciaDoAluno(a.id, daTurma) })),
    [alunos, turmaId, daTurma],
  )

  const mudar = (chave: string, valor: string) => {
    const p = new URLSearchParams(params)
    p.set(chave, valor)
    setParams(p, { replace: true })
  }

  return (
    <>
      <Link to="/chamada" className="mb-3 inline-flex items-center gap-1 text-[0.85rem] text-gray hover:text-gold">
        <ArrowLeft size={16} /> Chamada
      </Link>
      <PageHeader titulo="Frequência" />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Selecao className="w-auto" value={turmaId} onChange={(e) => mudar('turma', e.target.value)} aria-label="Turma">
          {minhas.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nome}
            </option>
          ))}
        </Selecao>
        <div className="flex items-center gap-1">
          <BotaoMini aria-label="Mês anterior" onClick={() => mudar('mes', somarMeses(mes, -1))}>
            <ChevronLeft size={16} />
          </BotaoMini>
          <span className="cond-maiusc min-w-[160px] text-center text-[0.8rem]">{nomeDoMes(mes)}</span>
          <BotaoMini aria-label="Mês seguinte" onClick={() => mudar('mes', somarMeses(mes, 1))} disabled={mes >= hojeIso().slice(0, 7)}>
            <ChevronRight size={16} />
          </BotaoMini>
        </div>
      </div>

      {loading ? (
        <p className="py-10 text-center text-gray">Carregando…</p>
      ) : linhas.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line p-8 text-center text-gray">Ninguém ativo nesta turma.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full text-[0.85rem]">
            <thead className="bg-navy-2 text-gray">
              <tr>
                <th className="sticky left-0 bg-navy-2 p-2 text-left">Aluno</th>
                {datas.map((d) => (
                  <th key={d} className={cn('p-1 text-center font-normal', !porData.has(d) && 'opacity-40')} title={porData.has(d) ? 'Chamada feita' : 'Sem chamada'}>
                    {d.slice(8)}
                  </th>
                ))}
                <th className="p-2 text-right">%</th>
              </tr>
            </thead>
            <tbody>
              {linhas.map(({ aluno, freq }) => (
                <tr key={aluno.id} className="border-t border-line">
                  <td className="sticky left-0 bg-navy p-2 whitespace-nowrap">
                    <Link to={`/alunos/${aluno.id}?aba=presenca`} className="hover:text-gold">
                      {aluno.apelido || aluno.nome}
                    </Link>
                    {freq.faltasSeguidas >= 3 && <span className="cond-maiusc ml-2 rounded-full bg-red-2/25 px-1.5 py-0.5 text-[0.6rem] text-red-200">{freq.faltasSeguidas} faltas seguidas</span>}
                  </td>
                  {datas.map((d) => {
                    const p = porData.get(d)?.presencas?.[aluno.id]
                    return (
                      <td key={d} className={cn('p-1 text-center font-anton', p ? COR[p] : 'text-gray/40')}>
                        {p ?? '·'}
                      </td>
                    )
                  })}
                  <td className="p-2 text-right font-anton">{freq.percentual == null ? '—' : `${freq.percentual}%`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-2 text-[0.8rem] text-gray">P presente · F falta · J justificada · dia apagado = treino sem chamada. Justificada não derruba o percentual.</p>
    </>
  )
}
