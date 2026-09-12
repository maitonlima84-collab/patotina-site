import { ChevronRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@shared/auth/AuthProvider'
import { PageHeader } from '@shared/components/PageHeader'
import { Botao } from '@shared/components/ui/Botao'
import { cn } from '@shared/lib/utils'
import { useUsuarios } from '@shared/modules/contas/hooks/useUsuarios'
import { useAlunos } from '@/modules/alunos/hooks/useAlunos'
import { useTurmas } from '../hooks/useTurmas'
import { descreverHorario, faixaEtaria } from '../services/turmasService'
import { TurmaFormDialog } from '../components/TurmaFormDialog'

export function TurmasPage() {
  const { isGestor } = useAuth()
  const { rows, loading, erro } = useTurmas()
  const { rows: alunos } = useAlunos()
  const { rows: usuarios } = useUsuarios()
  const [nova, setNova] = useState(false)

  const ativosPorTurma = useMemo(() => {
    const m = new Map<string, number>()
    for (const a of alunos) if (a.situacao === 'ativo') m.set(a.turmaId, (m.get(a.turmaId) ?? 0) + 1)
    return m
  }, [alunos])
  const nomeProfessor = (uid: string) => usuarios.find((u) => u.id === uid)?.nome ?? ''

  return (
    <>
      <PageHeader titulo="Turmas" ajuda="As turmas reais, com professor, treinos e alunos. O card do site é outra coisa — edita-se no painel do site.">
        {isGestor && (
          <Botao variante="principal" onClick={() => setNova(true)}>
            + Nova turma
          </Botao>
        )}
      </PageHeader>

      {erro && <p className="mb-4 text-red-200">{erro}</p>}
      {loading ? (
        <p className="py-10 text-center text-gray">Carregando…</p>
      ) : rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line p-8 text-center text-gray">Nenhuma turma ainda. Cadastre a primeira para começar as matrículas.</p>
      ) : (
        rows.map((t) => {
          const n = ativosPorTurma.get(t.id) ?? 0
          return (
            <Link
              key={t.id}
              to={`/turmas/${t.id}`}
              className={cn('mb-2 flex items-center gap-4 rounded-[14px] border border-line bg-navy-2 p-4 transition hover:border-gray', !t.ativa && 'opacity-60')}
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 font-cond text-[1.15rem] font-bold tracking-wide">
                  {t.nome}
                  {!t.ativa && <span className="cond-maiusc rounded-full bg-gray/20 px-2 py-0.5 text-[0.65rem] text-gray">inativa</span>}
                </div>
                <div className="text-[0.85rem] text-gray">{[faixaEtaria(t), nomeProfessor(t.professorUid)].filter(Boolean).join(' · ')}</div>
                <div className="mt-1 flex flex-wrap gap-x-3 text-[0.85rem]">
                  {t.horarios.map((h, i) => (
                    <span key={i}>{descreverHorario(h)}</span>
                  ))}
                </div>
              </div>
              <div className="text-center">
                <div className="font-anton text-[1.6rem] leading-none text-gold">{n}</div>
                <div className="rotulo text-[0.65rem]">{t.capacidade ? `de ${t.capacidade}` : 'alunos'}</div>
              </div>
              <ChevronRight size={18} className="shrink-0 text-gray" />
            </Link>
          )
        })
      )}

      <TurmaFormDialog turma={null} aberta={nova} onFechar={() => setNova(false)} />
    </>
  )
}
