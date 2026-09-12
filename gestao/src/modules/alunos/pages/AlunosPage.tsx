import { Search, Upload } from 'lucide-react'
import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '@shared/auth/AuthProvider'
import { PageHeader } from '@shared/components/PageHeader'
import { Entrada, Selecao } from '@shared/components/ui/Campos'
import { telefoneBonito } from '@shared/lib/utils'
import { useTurmas } from '@/modules/turmas/hooks/useTurmas'
import { SITUACOES, type Situacao } from '../types'
import { filtrarAlunos, useAlunos } from '../hooks/useAlunos'
import { idade, responsavelPrincipal } from '../services/alunosService'
import { AlunoLinha } from '../components/AlunoLinha'

// Busca e filtros vivem na URL: voltar da ficha traz a lista como estava, e
// o Início manda para cá já filtrado.
export function AlunosPage() {
  const { isGestor } = useAuth()
  const { rows, loading, erro } = useAlunos()
  const { porId: turmas, rows: listaTurmas } = useTurmas()
  const [params, setParams] = useSearchParams()
  const busca = params.get('q') ?? ''
  const turmaId = params.get('turma') ?? ''
  const situacao = (params.get('situacao') ?? 'ativo') as Situacao | ''

  function mudar(chave: string, valor: string) {
    const p = new URLSearchParams(params)
    if (valor) p.set(chave, valor)
    else p.delete(chave)
    setParams(p, { replace: true })
  }

  const filtrados = useMemo(() => filtrarAlunos(rows, { busca, turmaId, situacao }), [rows, busca, turmaId, situacao])

  return (
    <>
      <PageHeader titulo="Alunos" ajuda={loading ? undefined : `${rows.filter((a) => a.situacao === 'ativo').length} ativos`}>
        {isGestor && (
          <div className="flex gap-2">
            <Link to="/alunos/importar" className="cond-maiusc inline-flex items-center gap-2 rounded-full border border-line px-4 py-2.5 text-[0.85rem] text-gray hover:text-gold" title="Importar planilha">
              <Upload size={16} /> <span className="max-sm:hidden">Importar</span>
            </Link>
            <Link to="/alunos/novo" className="cond-maiusc inline-flex items-center rounded-full border border-gold bg-gold px-5 py-2.5 text-[0.85rem] text-navy hover:bg-gold-2">
              + Matricular
            </Link>
          </div>
        )}
      </PageHeader>

      <div className="mb-4 grid gap-2 sm:grid-cols-[1fr_180px_160px]">
        <div className="relative">
          <Search size={18} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-gray" />
          <Entrada className="pl-10" placeholder="Nome da criança ou do responsável" value={busca} onChange={(e) => mudar('q', e.target.value)} />
        </div>
        <Selecao value={turmaId} onChange={(e) => mudar('turma', e.target.value)} aria-label="Turma">
          <option value="">Todas as turmas</option>
          <option value="sem">Sem turma</option>
          {listaTurmas.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nome}
            </option>
          ))}
        </Selecao>
        <Selecao value={situacao} onChange={(e) => mudar('situacao', e.target.value)} aria-label="Situação">
          <option value="">Qualquer situação</option>
          {Object.entries(SITUACOES).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </Selecao>
      </div>

      {erro && <p className="mb-4 text-red-200">{erro}</p>}
      {loading ? (
        <p className="py-10 text-center text-gray">Carregando…</p>
      ) : filtrados.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line p-8 text-center text-gray">
          {rows.length === 0 ? 'Nenhum aluno cadastrado ainda. Comece por "Matricular".' : 'Ninguém com esse filtro.'}
        </p>
      ) : (
        filtrados.map((a) => {
          const r = responsavelPrincipal(a)
          const anos = idade(a)
          return (
            <AlunoLinha
              key={a.id}
              aluno={a}
              resumo={[anos != null && `${anos} anos`, turmas.get(a.turmaId)?.nome ?? (a.turmaId ? '' : 'sem turma'), r && `${r.nome} ${telefoneBonito(r.telefone)}`].filter(Boolean).join(' · ')}
            />
          )
        })
      )}
      {!loading && filtrados.length > 0 && <p className="mt-2 text-center text-[0.85rem] text-gray">{filtrados.length} aluno(s)</p>}
    </>
  )
}
