import { CheckCheck, ClipboardList } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '@shared/auth/AuthProvider'
import { useAviso } from '@shared/components/Aviso'
import { PageHeader } from '@shared/components/PageHeader'
import { Botao } from '@shared/components/ui/Botao'
import { AreaTexto, Entrada } from '@shared/components/ui/Campos'
import { mensagemDeErro } from '@shared/lib/erros'
import { cn, hojeIso } from '@shared/lib/utils'
import { Avatar } from '@/modules/alunos/components/AlunoLinha'
import { useAlunos } from '@/modules/alunos/hooks/useAlunos'
import { useTurmas } from '@/modules/turmas/hooks/useTurmas'
import { descreverHorario, turmasDoDia } from '@/modules/turmas/services/turmasService'
import { PRESENCAS, type Presenca } from '../types'
import { useChamada } from '../hooks/useChamada'
import { anotarChamada, marcar, marcarTodosPresentes, proxima } from '../services/chamadaService'

const COR: Record<Presenca | '', string> = {
  P: 'border-green bg-green/20 text-green',
  F: 'border-red-2 bg-red-2/25 text-red-200',
  J: 'border-gold bg-gold/20 text-gold',
  '': 'border-line bg-navy-3 text-gray',
}

// A tela do professor no campo (docs/gestao.md, §2.4): abre na turma de
// hoje, um toque por aluno, salva na hora. Professor vê só as turmas dele;
// Gestor e Master, todas.
export function ChamadaPage() {
  const { user, usuarioDoc, isGestor } = useAuth()
  const avisar = useAviso()
  const { rows: turmas } = useTurmas()
  const { rows: alunos } = useAlunos()
  const [params, setParams] = useSearchParams()
  const data = params.get('data') ?? hojeIso()
  const dia = new Date(`${data}T12:00:00`).getDay()

  const minhas = useMemo(() => turmas.filter((t) => t.ativa && (isGestor || t.professorUid === user?.uid)), [turmas, isGestor, user?.uid])
  const doDia = useMemo(() => turmasDoDia(minhas, dia), [minhas, dia])
  const turmaId = params.get('turma') ?? doDia[0]?.id ?? minhas[0]?.id ?? ''
  const turma = turmas.find((t) => t.id === turmaId)

  const { chamada, loading } = useChamada(turmaId, data)
  const daTurma = useMemo(() => alunos.filter((a) => a.turmaId === turmaId && a.situacao === 'ativo'), [alunos, turmaId])
  const [observacao, setObservacao] = useState('')
  useEffect(() => setObservacao(chamada?.observacao ?? ''), [chamada?.observacao, turmaId, data])

  const por = { uid: user?.uid ?? '', nome: usuarioDoc?.nome ?? '' }
  const mudar = (chave: string, valor: string) => {
    const p = new URLSearchParams(params)
    p.set(chave, valor)
    setParams(p, { replace: true })
  }

  async function tocar(alunoId: string) {
    try {
      await marcar(turmaId, data, alunoId, proxima(chamada?.presencas?.[alunoId]), por)
    } catch (e) {
      avisar(mensagemDeErro(e), true)
    }
  }

  const contagem = { P: 0, F: 0, J: 0, nao: 0 }
  for (const a of daTurma) {
    const p = chamada?.presencas?.[a.id]
    if (p) contagem[p]++
    else contagem.nao++
  }

  return (
    <>
      <PageHeader titulo="Chamada">
        <Link to={`/chamada/frequencia?turma=${turmaId}`} className="cond-maiusc inline-flex items-center gap-2 rounded-full border border-line px-4 py-2.5 text-[0.85rem] text-gray hover:text-gold">
          <ClipboardList size={16} /> Frequência
        </Link>
      </PageHeader>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Entrada type="date" className="w-auto" value={data} onChange={(e) => mudar('data', e.target.value)} aria-label="Data" />
        <div className="sem-barra flex gap-1.5 overflow-x-auto">
          {minhas.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => mudar('turma', t.id)}
              className={cn(
                'cond-maiusc whitespace-nowrap rounded-full border px-4 py-2 text-[0.78rem] transition',
                t.id === turmaId ? 'border-gold bg-gold text-navy' : doDia.includes(t) ? 'border-gold/50 bg-navy-2 text-cream' : 'border-line bg-navy-2 text-gray',
              )}
            >
              {t.nome}
            </button>
          ))}
        </div>
      </div>

      {!turma ? (
        <p className="rounded-xl border border-dashed border-line p-8 text-center text-gray">
          {minhas.length === 0 ? 'Nenhuma turma para chamar. Peça para vincular você a uma turma em Turmas.' : 'Escolha a turma.'}
        </p>
      ) : (
        <>
          <p className="mb-3 text-[0.85rem] text-gray">
            {turma.horarios.filter((h) => h.dia === dia).map(descreverHorario).join(' · ') || 'Esta turma não tem treino marcado neste dia — a chamada vale mesmo assim.'}
          </p>

          {daTurma.length === 0 ? (
            <p className="rounded-xl border border-dashed border-line p-8 text-center text-gray">Ninguém matriculado nesta turma.</p>
          ) : (
            <>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Botao onClick={() => void marcarTodosPresentes(turmaId, data, daTurma, chamada, por).catch((e) => avisar(mensagemDeErro(e), true))} disabled={loading || contagem.nao === 0}>
                  <CheckCheck size={16} /> Todos presentes
                </Botao>
                <span className="ml-auto text-[0.85rem] text-gray">
                  <b className="text-green">{contagem.P}</b> presentes · <b className="text-red-200">{contagem.F}</b> faltas · <b className="text-gold">{contagem.J}</b> justif. · {contagem.nao} sem marcar
                </span>
              </div>

              <ul className="flex flex-col gap-2">
                {daTurma.map((a) => {
                  const p = chamada?.presencas?.[a.id] ?? ''
                  return (
                    <li key={a.id}>
                      <button
                        type="button"
                        onClick={() => void tocar(a.id)}
                        className="flex w-full items-center gap-3 rounded-[14px] border border-line bg-navy-2 p-2.5 text-left transition active:scale-[0.99]"
                      >
                        <Avatar aluno={a} tamanho="h-11 w-11" />
                        <span className="min-w-0 flex-1 truncate font-cond text-[1.1rem] font-bold tracking-wide">{a.apelido || a.nome}</span>
                        <span className={cn('grid h-11 w-11 shrink-0 place-items-center rounded-full border-2 font-anton text-[1.1rem]', COR[p])} title={p ? PRESENCAS[p].nome : 'Toque para marcar'}>
                          {p || '·'}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
              <p className="mt-2 text-center text-[0.8rem] text-gray">Toque no aluno: presente → falta → justificada.</p>

              <div className="mt-4">
                <AreaTexto
                  rows={2}
                  placeholder="Observação do treino (opcional): chuva, jogo-treino, quem chegou atrasado…"
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  onBlur={() => {
                    if (observacao !== (chamada?.observacao ?? '')) void anotarChamada(turmaId, data, observacao).catch((e) => avisar(mensagemDeErro(e), true))
                  }}
                />
                {chamada?.registradoPorNome && <p className="mt-1 text-[0.8rem] text-gray">Chamada de {chamada.registradoPorNome}.</p>}
              </div>
            </>
          )}
        </>
      )}
    </>
  )
}
