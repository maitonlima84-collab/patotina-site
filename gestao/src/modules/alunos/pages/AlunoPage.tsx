import { ArrowLeft, MessageCircle, Pencil, Phone } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useAuth } from '@shared/auth/AuthProvider'
import { Botao } from '@shared/components/ui/Botao'
import { cn, dataBr, linkWhatsApp, moeda, telefoneBonito } from '@shared/lib/utils'
import { useTurmas } from '@/modules/turmas/hooks/useTurmas'
import { TIPOS_HISTORICO, type Aluno, type Historico } from '../types'
import { useAluno, useHistorico } from '../hooks/useAluno'
import { idade, valorMensal } from '../services/alunosService'
import { Avatar } from '../components/AlunoLinha'
import { SituacaoSelo } from '../components/SituacaoSelo'
import { MovimentacaoDialog, type Movimentacao } from '../components/MovimentacaoDialog'
import { PresencaDoAluno } from '@/modules/chamada/components/PresencaDoAluno'
import { FinanceiroDoAluno } from '@/modules/mensalidades/components/FinanceiroDoAluno'

const ABAS = [
  { id: 'ficha', titulo: 'Ficha' },
  { id: 'historico', titulo: 'Histórico' },
  { id: 'presenca', titulo: 'Presença' },
  { id: 'financeiro', titulo: 'Financeiro', soGestor: true },
] as const

export function AlunoPage() {
  const { id } = useParams()
  const { aluno, loading, erro } = useAluno(id)
  const historico = useHistorico(id)
  const { rows: turmas, porId } = useTurmas()
  const { isGestor } = useAuth()
  const [params, setParams] = useSearchParams()
  const aba = params.get('aba') ?? 'ficha'
  const [mov, setMov] = useState<Movimentacao | null>(null)

  if (loading) return <p className="py-10 text-center text-gray">Carregando…</p>
  if (!aluno) return <p className="py-10 text-center text-gray">{erro ?? 'Aluno não encontrado.'}</p>

  const turma = porId.get(aluno.turmaId)
  const anos = idade(aluno)
  const abas = ABAS.filter((a) => !('soGestor' in a && a.soGestor) || isGestor)

  return (
    <>
      <Link to="/alunos" className="mb-3 inline-flex items-center gap-1 text-[0.85rem] text-gray hover:text-gold">
        <ArrowLeft size={16} /> Alunos
      </Link>

      <header className="mb-5 flex flex-wrap items-center gap-4">
        <Avatar aluno={aluno} tamanho="h-20 w-20 text-xl" />
        <div className="min-w-0 flex-1">
          <h2 className="titulo-anton text-[1.5rem] leading-tight">{aluno.nome}</h2>
          <p className="flex flex-wrap items-center gap-2 text-[0.9rem] text-gray">
            {anos != null && <span>{anos} anos</span>}
            {turma && <span>· {turma.nome}</span>}
            <SituacaoSelo situacao={aluno.situacao} />
          </p>
        </div>
        {isGestor && (
          <Link to={`/alunos/${aluno.id}/editar`} className="cond-maiusc inline-flex items-center gap-2 rounded-full border border-line bg-navy-3 px-4 py-2.5 text-[0.85rem] hover:border-gold">
            <Pencil size={15} /> Editar
          </Link>
        )}
      </header>

      <nav className="sem-barra mb-5 flex gap-1.5 overflow-x-auto border-b border-line pb-3" aria-label="Seções da ficha">
        {abas.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => setParams({ aba: a.id }, { replace: true })}
            className={cn(
              'cond-maiusc whitespace-nowrap rounded-full border px-4 py-2 text-[0.78rem] transition',
              aba === a.id ? 'border-gold bg-gold text-navy' : 'border-line bg-navy-2 text-gray hover:text-cream',
            )}
          >
            {a.titulo}
          </button>
        ))}
      </nav>

      {aba === 'ficha' && <Ficha aluno={aluno} />}
      {aba === 'historico' && (
        <Historico aluno={aluno} itens={historico} nomeTurma={(tid) => porId.get(tid)?.nome ?? ''} podeMover={isGestor} onMover={setMov} />
      )}
      {aba === 'presenca' && <PresencaDoAluno aluno={aluno} />}
      {aba === 'financeiro' && isGestor && <Financeiro aluno={aluno} />}

      <MovimentacaoDialog tipo={mov} aluno={aluno} turmas={turmas} onFechar={() => setMov(null)} />
    </>
  )
}

function Bloco({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="mb-4 rounded-xl border border-line bg-navy-2 p-4">
      <h3 className="rotulo mb-2">{titulo}</h3>
      {children}
    </section>
  )
}

function Linha({ r, v }: { r: string; v: ReactNode }) {
  if (v === '' || v == null || v === false) return null
  return (
    <div className="flex gap-3 py-1 text-[0.95rem]">
      <span className="w-[130px] shrink-0 text-gray">{r}</span>
      <span className="min-w-0 flex-1">{v}</span>
    </div>
  )
}

function Ficha({ aluno }: { aluno: Aluno }) {
  const e = aluno.endereco
  const s = aluno.saude
  return (
    <div className="grid gap-0 md:grid-cols-2 md:gap-x-4">
      <Bloco titulo="Responsáveis">
        {aluno.responsaveis.map((r, i) => (
          <div key={i} className="flex items-center gap-3 py-1.5">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-1">
                {r.nome}
                {r.parentesco && <span className="text-gray"> · {r.parentesco}</span>}
                {r.principal && <span className="cond-maiusc ml-1 rounded-full bg-gold/20 px-1.5 py-0.5 text-[0.6rem] text-gold">principal</span>}
                {r.pagador && <span className="cond-maiusc ml-1 rounded-full bg-navy-3 px-1.5 py-0.5 text-[0.6rem] text-gray">paga</span>}
              </div>
              <div className="text-[0.85rem] text-gray">{telefoneBonito(r.telefone)}</div>
            </div>
            <a href={`tel:${r.telefone}`} className="rounded-lg border border-line p-2 text-gray hover:text-gold" aria-label="Ligar">
              <Phone size={16} />
            </a>
            <a href={linkWhatsApp(r.telefone)} target="_blank" rel="noopener" className="rounded-lg border border-line p-2 text-green hover:border-green" aria-label="WhatsApp">
              <MessageCircle size={16} />
            </a>
          </div>
        ))}
      </Bloco>

      <Bloco titulo="Dados">
        <Linha r="Nascimento" v={dataBr(aluno.nascimento)} />
        <Linha r="Escola" v={aluno.escola} />
        <Linha r="Endereço" v={[e?.rua && `${e.rua}${e.numero ? `, ${e.numero}` : ''}`, e?.bairro, e?.cidade].filter(Boolean).join(' · ')} />
        <Linha r="Uniforme" v={[aluno.uniforme?.camisa && `camisa ${aluno.uniforme.camisa}`, aluno.uniforme?.calcao && `calção ${aluno.uniforme.calcao}`].filter(Boolean).join(', ')} />
        <Linha r="Desde" v={aluno.entrouEm && dataBr(aluno.entrouEm)} />
      </Bloco>

      <Bloco titulo="Saúde">
        <Linha r="Alergias" v={s?.alergias || 'nenhuma informada'} />
        <Linha r="Medicamentos" v={s?.medicamentos} />
        <Linha r="Cuidados" v={s?.restricoes} />
        <Linha r="Plano de saúde" v={s?.plano} />
        <Linha r="Emergência" v={s?.emergencia?.nome && `${s.emergencia.nome} ${telefoneBonito(s.emergencia.telefone)}`} />
      </Bloco>

      <Bloco titulo="Autorizações">
        <Linha r="Imagem" v={aluno.autorizacoes?.imagem ? 'autorizado' : 'NÃO autorizado'} />
        <Linha r="Transporte" v={aluno.autorizacoes?.transporte ? 'autorizado' : 'não autorizado'} />
        <Linha r="Quem busca" v={aluno.autorizacoes?.buscam} />
      </Bloco>

      {aluno.observacoes && (
        <Bloco titulo="Observações">
          <p className="whitespace-pre-wrap text-[0.95rem]">{aluno.observacoes}</p>
        </Bloco>
      )}
    </div>
  )
}

function Historico({
  aluno,
  itens,
  nomeTurma,
  podeMover,
  onMover,
}: {
  aluno: Aluno
  itens: Historico[]
  nomeTurma: (id: string) => string
  podeMover: boolean
  onMover: (m: Movimentacao) => void
}) {
  const descricao = (h: Historico) => {
    if (h.tipo === 'mudanca_turma') return `${nomeTurma(h.de) || 'sem turma'} → ${nomeTurma(h.para) || 'sem turma'}`
    if (h.tipo === 'matricula') return [h.texto, nomeTurma(h.para) && `em ${nomeTurma(h.para)}`].filter(Boolean).join(' ')
    return h.texto
  }
  return (
    <>
      {podeMover && (
        <div className="mb-5 flex flex-wrap gap-2">
          {aluno.situacao === 'ativo' && (
            <>
              <Botao onClick={() => onMover('mudanca_turma')}>Mudar de turma</Botao>
              <Botao onClick={() => onMover('trancamento')}>Trancar</Botao>
              <Botao variante="perigo" onClick={() => onMover('desligamento')}>
                Desligar
              </Botao>
            </>
          )}
          {aluno.situacao !== 'ativo' && (
            <Botao variante="principal" onClick={() => onMover('retorno')}>
              {aluno.situacao === 'pre_matricula' ? 'Efetivar matrícula' : 'Reativar'}
            </Botao>
          )}
          {aluno.situacao === 'trancado' && (
            <Botao variante="perigo" onClick={() => onMover('desligamento')}>
              Desligar
            </Botao>
          )}
          <Botao variante="fantasma" onClick={() => onMover('observacao')}>
            Anotar
          </Botao>
        </div>
      )}
      <ol className="border-l border-line pl-4">
        {itens.map((h) => (
          <li key={h.id} className="relative mb-4">
            <span className="absolute top-1.5 -left-[21px] h-2.5 w-2.5 rounded-full bg-gold" />
            <div className="text-[0.8rem] text-gray">
              {dataBr(h.data)}
              {h.porNome && ` · ${h.porNome}`}
            </div>
            <div className="font-cond text-[1.05rem] font-bold tracking-wide">{TIPOS_HISTORICO[h.tipo] ?? h.tipo}</div>
            {descricao(h) && <div className="whitespace-pre-wrap text-[0.9rem]">{descricao(h)}</div>}
          </li>
        ))}
        {itens.length === 0 && <li className="text-gray">Nada registrado ainda.</li>}
      </ol>
    </>
  )
}

function Financeiro({ aluno }: { aluno: Aluno }) {
  const p = aluno.plano
  return (
    <>
      <Bloco titulo="Plano">
        {p?.isento ? (
          <Linha r="Mensalidade" v={`isento — ${p.motivoIsencao}`} />
        ) : (
          <>
            <Linha r="Mensalidade" v={moeda(p?.valor ?? 0)} />
            <Linha r="Desconto" v={p?.desconto?.valor ? `${moeda(p.desconto.valor)} (${p.desconto.motivo})` : ''} />
            <Linha r="Valor final" v={moeda(valorMensal(p))} />
            <Linha r="Vencimento" v={`dia ${p?.vencimentoDia}`} />
          </>
        )}
        <Linha r="Quem paga" v={aluno.responsaveis.find((r) => r.pagador)?.nome} />
      </Bloco>
      <FinanceiroDoAluno aluno={aluno} />
    </>
  )
}
