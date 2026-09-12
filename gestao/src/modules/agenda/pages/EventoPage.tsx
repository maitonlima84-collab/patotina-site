import { ArrowLeft, Copy, MessageCircle, Pencil, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@shared/auth/AuthProvider'
import { useAviso } from '@shared/components/Aviso'
import { Botao } from '@shared/components/ui/Botao'
import { mensagemDeErro } from '@shared/lib/erros'
import { cn, dataBr, telefoneBonito } from '@shared/lib/utils'
import { Avatar } from '@/modules/alunos/components/AlunoLinha'
import { useAlunos } from '@/modules/alunos/hooks/useAlunos'
import { responsavelPrincipal } from '@/modules/alunos/services/alunosService'
import { useConfiguracoes } from '@/modules/configuracoes/hooks/useConfiguracoes'
import { useTurmas } from '@/modules/turmas/hooks/useTurmas'
import { TIPOS_EVENTO } from '../types'
import { useEventos } from '../hooks/useEventos'
import { apagarEvento } from '../repositories/eventosRepository'
import { convocar, convocarTodos, linkConvocacao, marcarAutorizacao, textoConvocacao } from '../services/eventosService'
import { EventoFormDialog } from '../components/EventoFormDialog'

// O evento por dentro: quem está convocado, quem já trouxe a autorização
// (viagem), e o WhatsApp de convocação pronto para cada família.
export function EventoPage() {
  const { id } = useParams()
  const { isGestor } = useAuth()
  const avisar = useAviso()
  const navegar = useNavigate()
  const { porId, loading } = useEventos()
  const { rows: turmas, porId: turmasPorId } = useTurmas()
  const { rows: alunos } = useAlunos()
  const { config } = useConfiguracoes()
  const [editando, setEditando] = useState(false)
  const [mostrarTodos, setMostrarTodos] = useState(false)
  const evento = porId.get(id ?? '')

  // Candidatos: ativos das turmas do evento (ou de todas, se não marcou).
  const candidatos = useMemo(
    () => alunos.filter((a) => a.situacao === 'ativo' && (!evento || evento.turmaIds.length === 0 || evento.turmaIds.includes(a.turmaId))),
    [alunos, evento],
  )
  const convocadosSet = useMemo(() => new Set(evento?.convocados ?? []), [evento])
  const lista = mostrarTodos || !evento || evento.convocados.length === 0 ? candidatos : candidatos.filter((a) => convocadosSet.has(a.id))
  const precisaAutorizacao = evento?.tipo === 'viagem' || evento?.tipo === 'jogo' || evento?.tipo === 'festival'

  if (loading) return <p className="py-10 text-center text-gray">Carregando…</p>
  if (!evento) return <p className="py-10 text-center text-gray">Evento não encontrado.</p>

  const telefones = candidatos
    .filter((a) => convocadosSet.has(a.id))
    .map((a) => responsavelPrincipal(a)?.telefone)
    .filter(Boolean)
    .map((t) => telefoneBonito(t!))

  async function agir(acao: () => Promise<void>) {
    try {
      await acao()
    } catch (e) {
      avisar(mensagemDeErro(e), true)
    }
  }

  return (
    <>
      <Link to="/agenda" className="mb-3 inline-flex items-center gap-1 text-[0.85rem] text-gray hover:text-gold">
        <ArrowLeft size={16} /> Agenda
      </Link>
      <header className="mb-5 flex flex-wrap items-start gap-4">
        <div className="min-w-0 flex-1">
          <p className="rotulo">
            {TIPOS_EVENTO[evento.tipo]?.icone} {TIPOS_EVENTO[evento.tipo]?.nome}
            {evento.visivelNoSite && ' · no site'}
          </p>
          <h2 className="titulo-anton text-[1.5rem] leading-tight">{evento.titulo}</h2>
          <p className="text-[0.9rem] text-gray">
            {[dataBr(evento.data), evento.hora, evento.local, evento.turmaIds.map((t) => turmasPorId.get(t)?.nome).filter(Boolean).join(', ') || 'todas as turmas'].filter(Boolean).join(' · ')}
          </p>
          {evento.descricao && <p className="mt-2 whitespace-pre-wrap text-[0.95rem]">{evento.descricao}</p>}
        </div>
        {isGestor && (
          <div className="flex gap-2">
            <Botao onClick={() => setEditando(true)}>
              <Pencil size={15} /> Editar
            </Botao>
            <Botao
              variante="perigo"
              onClick={() => confirm('Apagar este evento?') && void agir(async () => {
                await apagarEvento(evento.id)
                navegar('/agenda')
              })}
            >
              <Trash2 size={15} />
            </Botao>
          </div>
        )}
      </header>

      {evento.tipo !== 'sem_treino' && evento.tipo !== 'reuniao' && (
        <>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <h3 className="rotulo">
              Convocados: {evento.convocados.length} de {candidatos.length}
            </h3>
            <span className="flex-1" />
            {isGestor && (
              <>
                <Botao className="px-4 py-2 text-[0.75rem]" onClick={() => setMostrarTodos((x) => !x)}>
                  {mostrarTodos || evento.convocados.length === 0 ? 'Só convocados' : 'Ver todos'}
                </Botao>
                <Botao className="px-4 py-2 text-[0.75rem]" onClick={() => void agir(() => convocarTodos(evento, candidatos.map((a) => a.id)))}>
                  Convocar todos
                </Botao>
              </>
            )}
            {telefones.length > 0 && (
              <Botao className="px-4 py-2 text-[0.75rem]" onClick={() => void navigator.clipboard?.writeText(telefones.join('\n')).then(() => avisar('Telefones copiados.'))}>
                <Copy size={14} /> Telefones
              </Botao>
            )}
          </div>

          {lista.length === 0 ? (
            <p className="rounded-xl border border-dashed border-line p-8 text-center text-gray">Ninguém ativo nas turmas deste evento.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {lista.map((a) => {
                const conv = convocadosSet.has(a.id)
                const aut = evento.autorizacoes?.[a.id] ?? false
                const link = linkConvocacao(evento, a, config)
                return (
                  <li key={a.id} className={cn('flex items-center gap-3 rounded-[14px] border border-line bg-navy-2 p-2.5', !conv && 'opacity-60')}>
                    <button type="button" disabled={!isGestor} onClick={() => void agir(() => convocar(evento, a.id, !conv))} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                      <span className={cn('grid h-6 w-6 shrink-0 place-items-center rounded-md border text-[0.8rem]', conv ? 'border-gold bg-gold text-navy' : 'border-line')}>{conv ? '✓' : ''}</span>
                      <Avatar aluno={a} tamanho="h-10 w-10 text-xs" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-cond text-[1.05rem] font-bold tracking-wide">{a.apelido || a.nome}</span>
                        <span className="block truncate text-[0.8rem] text-gray">
                          {turmasPorId.get(a.turmaId)?.nome}
                          {!a.autorizacoes?.transporte && evento.tipo === 'viagem' && ' · sem autorização de transporte na ficha'}
                        </span>
                      </span>
                    </button>
                    {conv && precisaAutorizacao && (
                      <button
                        type="button"
                        disabled={!isGestor}
                        onClick={() => void agir(() => marcarAutorizacao(evento, a.id, !aut))}
                        className={cn('cond-maiusc rounded-full border px-2.5 py-1 text-[0.62rem]', aut ? 'border-green bg-green/20 text-green' : 'border-line text-gray')}
                        title="Autorização assinada"
                      >
                        {aut ? 'autorizado' : 'sem autoriz.'}
                      </button>
                    )}
                    {conv && link && (
                      <a href={link} target="_blank" rel="noopener" className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-line text-green hover:border-green" title={textoConvocacao(evento, a, config)}>
                        <MessageCircle size={16} />
                      </a>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </>
      )}

      <EventoFormDialog evento={evento} turmas={turmas} aberta={editando} onFechar={() => setEditando(false)} />
    </>
  )
}
