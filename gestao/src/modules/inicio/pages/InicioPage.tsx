import { AlertTriangle, Cake, CheckCircle2, Circle } from 'lucide-react'
import { useMemo, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@shared/auth/AuthProvider'
import { PageHeader } from '@shared/components/PageHeader'
import { DIAS_SEMANA, hojeIso } from '@shared/lib/utils'
import { Avatar } from '@/modules/alunos/components/AlunoLinha'
import { useAlunos } from '@/modules/alunos/hooks/useAlunos'
import { aniversariantes, idade } from '@/modules/alunos/services/alunosService'
import { useTurmas } from '@/modules/turmas/hooks/useTurmas'
import { descreverHorario, turmasDoDia } from '@/modules/turmas/services/turmasService'
import { useChamadasEntre } from '@/modules/chamada/hooks/useChamada'
import { alunosEmAlerta, primeiroDiaDoMes, somarMeses } from '@/modules/chamada/services/chamadaService'

// Os números do dia (docs/gestao.md, §2.1). Cada número é link para a lista
// filtrada. Cresce conforme os módulos entram: chamada, mensalidades,
// pré-matrículas, agenda.
export function InicioPage() {
  const { user, usuarioDoc, isGestor } = useAuth()
  const { rows: todosAlunos, loading } = useAlunos()
  const { rows: todasTurmas, porId } = useTurmas()
  const primeiroNome = usuarioDoc?.nome.split(' ')[0] ?? ''
  const hoje = new Date()
  const hojeStr = hojeIso()
  // Professor vê o Início das turmas dele; Gestor e Master, da escolinha.
  const turmas = useMemo(() => todasTurmas.filter((t) => isGestor || t.professorUid === user?.uid), [todasTurmas, isGestor, user?.uid])
  const minhasIds = useMemo(() => new Set(turmas.map((t) => t.id)), [turmas])
  const alunos = useMemo(() => (isGestor ? todosAlunos : todosAlunos.filter((a) => minhasIds.has(a.turmaId))), [todosAlunos, isGestor, minhasIds])
  const { chamadas } = useChamadasEntre(primeiroDiaDoMes(somarMeses(hojeStr.slice(0, 7), -1)), hojeStr)
  const chamadasHoje = useMemo(() => new Set(chamadas.filter((c) => c.data === hojeStr).map((c) => c.turmaId)), [chamadas, hojeStr])
  const alertas = useMemo(() => alunosEmAlerta(alunos, chamadas), [alunos, chamadas])

  const ativos = useMemo(() => alunos.filter((a) => a.situacao === 'ativo'), [alunos])
  const porTurma = useMemo(() => {
    const m = new Map<string, number>()
    for (const a of ativos) m.set(a.turmaId, (m.get(a.turmaId) ?? 0) + 1)
    return m
  }, [ativos])
  const semTurma = porTurma.get('') ?? 0
  const preMatriculas = alunos.filter((a) => a.situacao === 'pre_matricula').length
  const doDia = turmasDoDia(turmas, hoje.getDay())
  const niver = aniversariantes(alunos, hoje.getMonth() + 1)

  return (
    <>
      <PageHeader titulo={`Olá, ${primeiroNome}`} ajuda={`${DIAS_SEMANA[hoje.getDay()]}, ${hoje.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}`} />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Numero rotulo="Alunos ativos" valor={loading ? '…' : ativos.length} para="/alunos" />
        <Numero rotulo="Turmas ativas" valor={turmas.filter((t) => t.ativa).length} para="/turmas" />
        <Numero rotulo="Sem turma" valor={semTurma} para="/alunos?situacao=ativo&turma=sem" destaque={semTurma > 0} />
        {isGestor && <Numero rotulo="Pré-matrículas" valor={preMatriculas} para="/alunos?situacao=pre_matricula" destaque={preMatriculas > 0} />}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Bloco titulo="Treinos de hoje">
          {doDia.length === 0 ? (
            <p className="text-gray">Nenhuma turma treina hoje.</p>
          ) : (
            doDia.map((t) => (
              <Link key={t.id} to={`/chamada?turma=${t.id}`} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-navy-3">
                {chamadasHoje.has(t.id) ? <CheckCircle2 size={20} className="shrink-0 text-green" /> : <Circle size={20} className="shrink-0 text-gray" />}
                <div className="min-w-0 flex-1">
                  <div className="font-cond text-[1.05rem] font-bold tracking-wide">{t.nome}</div>
                  <div className="text-[0.85rem] text-gray">
                    {t.horarios
                      .filter((h) => h.dia === hoje.getDay())
                      .map(descreverHorario)
                      .join(' · ')}
                  </div>
                </div>
                <span className="font-anton text-[1.3rem] text-gold">{porTurma.get(t.id) ?? 0}</span>
              </Link>
            ))
          )}
        </Bloco>

        {alertas.length > 0 && (
          <Bloco titulo="Faltando seguido">
            {alertas.map(({ aluno: a, freq }) => (
              <Link key={a.id} to={`/alunos/${a.id}?aba=presenca`} className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-navy-3">
                <AlertTriangle size={18} className="shrink-0 text-red-200" />
                <Avatar aluno={a} tamanho="h-9 w-9 text-xs" />
                <div className="min-w-0 flex-1 truncate">
                  {a.apelido || a.nome}
                  <span className="text-[0.85rem] text-gray"> · {porId.get(a.turmaId)?.nome ?? 'sem turma'}</span>
                </div>
                <span className="text-red-200">{freq.faltasSeguidas} faltas seguidas</span>
              </Link>
            ))}
          </Bloco>
        )}

        <Bloco titulo="Aniversariantes do mês">
          {niver.length === 0 ? (
            <p className="text-gray">Ninguém faz aniversário este mês.</p>
          ) : (
            niver.map((a) => {
              const dia = Number(a.nascimento.slice(8, 10))
              const hojeMesmo = dia === hoje.getDate()
              return (
                <Link key={a.id} to={`/alunos/${a.id}`} className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-navy-3">
                  <Avatar aluno={a} tamanho="h-9 w-9 text-xs" />
                  <div className="min-w-0 flex-1 truncate">
                    {a.apelido || a.nome}
                    <span className="text-[0.85rem] text-gray"> · {porId.get(a.turmaId)?.nome ?? 'sem turma'}</span>
                  </div>
                  <span className={hojeMesmo ? 'flex items-center gap-1 text-gold' : 'text-gray'}>
                    {hojeMesmo && <Cake size={16} />}
                    dia {dia} · {(idade(a) ?? 0) + (dia > hoje.getDate() ? 1 : 0)} anos
                  </span>
                </Link>
              )
            })
          )}
        </Bloco>
      </div>
    </>
  )
}

function Numero({ rotulo, valor, para, destaque }: { rotulo: string; valor: ReactNode; para: string; destaque?: boolean }) {
  return (
    <Link to={para} className="rounded-xl border border-line bg-navy-2 p-4 transition hover:border-gray">
      <div className={`font-anton text-[2rem] leading-none ${destaque ? 'text-gold' : 'text-cream'}`}>{valor}</div>
      <div className="rotulo mt-1">{rotulo}</div>
    </Link>
  )
}

function Bloco({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-line bg-navy-2 p-4">
      <h3 className="rotulo mb-2">{titulo}</h3>
      {children}
    </section>
  )
}
