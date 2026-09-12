import { ChevronRight, Globe } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '@shared/auth/AuthProvider'
import { PageHeader } from '@shared/components/PageHeader'
import { Botao } from '@shared/components/ui/Botao'
import { cn, DIAS_CURTOS } from '@shared/lib/utils'
import { useTurmas } from '@/modules/turmas/hooks/useTurmas'
import { TIPOS_EVENTO } from '../types'
import { useEventos } from '../hooks/useEventos'
import { passado } from '../services/eventosService'
import { EventoFormDialog } from '../components/EventoFormDialog'

export function AgendaPage() {
  const { isGestor } = useAuth()
  const { rows, loading, erro } = useEventos()
  const { rows: turmas, porId } = useTurmas()
  const [params, setParams] = useSearchParams()
  const mostrarPassados = params.get('passados') === '1'
  const [novo, setNovo] = useState(false)

  const lista = useMemo(() => {
    const l = rows.filter((e) => passado(e) === mostrarPassados)
    return mostrarPassados ? l.reverse() : l
  }, [rows, mostrarPassados])

  return (
    <>
      <PageHeader titulo="Agenda" ajuda="Jogos, festivais, viagens, reuniões e dias sem treino. Convocação e autorizações ficam dentro de cada evento.">
        {isGestor && (
          <Botao variante="principal" onClick={() => setNovo(true)}>
            + Novo evento
          </Botao>
        )}
      </PageHeader>

      <div className="mb-4 flex gap-1.5">
        {[
          { v: '0', t: 'Próximos' },
          { v: '1', t: 'Passados' },
        ].map((o) => (
          <button
            key={o.v}
            type="button"
            onClick={() => setParams(o.v === '1' ? { passados: '1' } : {}, { replace: true })}
            className={cn('cond-maiusc rounded-full border px-4 py-2 text-[0.78rem]', (o.v === '1') === mostrarPassados ? 'border-gold bg-gold text-navy' : 'border-line bg-navy-2 text-gray')}
          >
            {o.t}
          </button>
        ))}
      </div>

      {erro && <p className="mb-4 text-red-200">{erro}</p>}
      {loading ? (
        <p className="py-10 text-center text-gray">Carregando…</p>
      ) : lista.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line p-8 text-center text-gray">{mostrarPassados ? 'Nenhum evento passado.' : 'Nada marcado. Cadastre o próximo jogo ou festival.'}</p>
      ) : (
        lista.map((e) => {
          const d = new Date(`${e.data}T12:00:00`)
          return (
            <Link key={e.id} to={`/agenda/${e.id}`} className="mb-2 flex items-center gap-4 rounded-[14px] border border-line bg-navy-2 p-3 transition hover:border-gray">
              <div className="w-[52px] shrink-0 text-center">
                <div className="font-anton text-[1.5rem] leading-none text-gold">{e.data.slice(8)}</div>
                <div className="rotulo text-[0.62rem]">{DIAS_CURTOS[d.getDay()]} · {d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}</div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 font-cond text-[1.1rem] font-bold tracking-wide">
                  <span>{TIPOS_EVENTO[e.tipo]?.icone}</span>
                  <span className="truncate">{e.titulo}</span>
                  {e.visivelNoSite && <Globe size={14} className="text-gray" aria-label="No site" />}
                </div>
                <div className="text-[0.85rem] text-gray">
                  {[e.hora, e.local, e.turmaIds.map((id) => porId.get(id)?.nome).filter(Boolean).join(', ') || 'todas as turmas', e.convocados.length > 0 && `${e.convocados.length} convocado(s)`]
                    .filter(Boolean)
                    .join(' · ')}
                </div>
              </div>
              <ChevronRight size={18} className="shrink-0 text-gray" />
            </Link>
          )
        })
      )}

      <EventoFormDialog evento={null} turmas={turmas} aberta={novo} onFechar={() => setNovo(false)} />
    </>
  )
}
