import { ArrowLeft, Pencil } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '@shared/auth/AuthProvider'
import { Botao } from '@shared/components/ui/Botao'
import { moeda, telefoneBonito } from '@shared/lib/utils'
import { useUsuarios } from '@shared/modules/contas/hooks/useUsuarios'
import { AlunoLinha } from '@/modules/alunos/components/AlunoLinha'
import { useAlunos } from '@/modules/alunos/hooks/useAlunos'
import { idade, responsavelPrincipal } from '@/modules/alunos/services/alunosService'
import { useTurmas } from '../hooks/useTurmas'
import { descreverHorario, faixaEtaria } from '../services/turmasService'
import { TurmaFormDialog } from '../components/TurmaFormDialog'

export function TurmaPage() {
  const { id } = useParams()
  const { isGestor } = useAuth()
  const { porId, loading } = useTurmas()
  const { rows: alunos } = useAlunos()
  const { rows: usuarios } = useUsuarios()
  const [editando, setEditando] = useState(false)
  const turma = porId.get(id ?? '')

  const daTurma = useMemo(() => alunos.filter((a) => a.turmaId === id && a.situacao === 'ativo'), [alunos, id])

  if (loading) return <p className="py-10 text-center text-gray">Carregando…</p>
  if (!turma) return <p className="py-10 text-center text-gray">Turma não encontrada.</p>

  const professor = usuarios.find((u) => u.id === turma.professorUid)?.nome

  return (
    <>
      <Link to="/turmas" className="mb-3 inline-flex items-center gap-1 text-[0.85rem] text-gray hover:text-gold">
        <ArrowLeft size={16} /> Turmas
      </Link>
      <header className="mb-5 flex flex-wrap items-start gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="titulo-anton text-[1.5rem] leading-tight">{turma.nome}</h2>
          <p className="text-[0.9rem] text-gray">
            {[faixaEtaria(turma), professor && `Prof. ${professor}`, turma.mensalidade != null && `${moeda(turma.mensalidade)}/mês`, turma.temporada].filter(Boolean).join(' · ')}
          </p>
          <ul className="mt-1 flex flex-wrap gap-x-4 text-[0.9rem]">
            {turma.horarios.map((h, i) => (
              <li key={i}>{descreverHorario(h)}</li>
            ))}
          </ul>
        </div>
        {isGestor && (
          <div className="flex gap-2">
            <Botao onClick={() => setEditando(true)}>
              <Pencil size={15} /> Editar
            </Botao>
            <Link to={`/alunos/novo?turma=${turma.id}`} className="cond-maiusc inline-flex items-center rounded-full border border-gold bg-gold px-5 py-2.5 text-[0.85rem] text-navy hover:bg-gold-2">
              + Matricular
            </Link>
          </div>
        )}
      </header>

      <h3 className="rotulo mb-2">
        {daTurma.length} aluno(s){turma.capacidade ? ` · ${Math.max(0, turma.capacidade - daTurma.length)} vaga(s)` : ''}
      </h3>
      {daTurma.length === 0 && <p className="rounded-xl border border-dashed border-line p-8 text-center text-gray">Ninguém matriculado nesta turma ainda.</p>}
      {daTurma.map((a) => {
        const r = responsavelPrincipal(a)
        const anos = idade(a)
        return <AlunoLinha key={a.id} aluno={a} resumo={[anos != null && `${anos} anos`, r && `${r.nome} ${telefoneBonito(r.telefone)}`].filter(Boolean).join(' · ')} />
      })}

      <TurmaFormDialog turma={turma} aberta={editando} onFechar={() => setEditando(false)} />
    </>
  )
}
