import { AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '@shared/auth/AuthProvider'
import { useAviso } from '@shared/components/Aviso'
import { PageHeader } from '@shared/components/PageHeader'
import { Botao, BotaoMini } from '@shared/components/ui/Botao'
import { Selecao } from '@shared/components/ui/Campos'
import { mensagemDeErro } from '@shared/lib/erros'
import { cn, hojeIso, moeda } from '@shared/lib/utils'
import { useAlunos } from '@/modules/alunos/hooks/useAlunos'
import { useConfiguracoes } from '@/modules/configuracoes/hooks/useConfiguracoes'
import { nomeDoMes, somarMeses } from '@/modules/chamada/services/chamadaService'
import type { Cobranca } from '../types'
import { useCobrancasDoMes } from '../hooks/useCobrancas'
import { atrasada, gerarMes, resumir } from '../services/mensalidadesService'
import { CobrancaLinha } from '../components/CobrancaLinha'
import { PagamentoDialog } from '../components/PagamentoDialog'

type Filtro = '' | 'aberta' | 'atrasada' | 'paga' | 'outras'

export function MensalidadesPage() {
  const { user, usuarioDoc } = useAuth()
  const avisar = useAviso()
  const { rows: alunos, porId } = useAlunos()
  const { config } = useConfiguracoes()
  const [params, setParams] = useSearchParams()
  const mes = params.get('mes') ?? hojeIso().slice(0, 7)
  const filtro = (params.get('f') ?? '') as Filtro
  const { rows, loading } = useCobrancasDoMes(mes)
  const [pagando, setPagando] = useState<Cobranca | null>(null)
  const [gerando, setGerando] = useState(false)

  const resumo = useMemo(() => resumir(rows), [rows])
  const ativos = alunos.filter((a) => a.situacao === 'ativo')
  const faltamGerar = ativos.filter((a) => !rows.some((c) => c.alunoId === a.id)).length
  const filtradas = rows.filter((c) => {
    if (filtro === 'aberta') return c.situacao === 'aberta'
    if (filtro === 'atrasada') return atrasada(c)
    if (filtro === 'paga') return c.situacao === 'paga'
    if (filtro === 'outras') return c.situacao === 'isenta' || c.situacao === 'cancelada'
    return true
  })

  const mudar = (chave: string, valor: string) => {
    const p = new URLSearchParams(params)
    if (valor) p.set(chave, valor)
    else p.delete(chave)
    setParams(p, { replace: true })
  }

  async function gerar() {
    if (!confirm(`Gerar as cobranças de ${nomeDoMes(mes)} para ${faltamGerar} aluno(s) ativo(s)? Quem já tem cobrança neste mês não é tocado.`)) return
    setGerando(true)
    try {
      const n = await gerarMes(alunos, mes, config, { uid: user?.uid ?? '', nome: usuarioDoc?.nome ?? '' })
      avisar(`${n} cobrança(s) gerada(s).`)
    } catch (e) {
      avisar(mensagemDeErro(e), true)
    } finally {
      setGerando(false)
    }
  }

  return (
    <>
      <PageHeader titulo="Mensalidades">
        <Link to="/mensalidades/inadimplencia" className="cond-maiusc inline-flex items-center gap-2 rounded-full border border-line px-4 py-2.5 text-[0.85rem] text-gray hover:text-gold">
          <AlertCircle size={16} /> Inadimplência
        </Link>
      </PageHeader>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1">
          <BotaoMini aria-label="Mês anterior" onClick={() => mudar('mes', somarMeses(mes, -1))}>
            <ChevronLeft size={16} />
          </BotaoMini>
          <span className="cond-maiusc min-w-[170px] text-center text-[0.85rem]">{nomeDoMes(mes)}</span>
          <BotaoMini aria-label="Mês seguinte" onClick={() => mudar('mes', somarMeses(mes, 1))}>
            <ChevronRight size={16} />
          </BotaoMini>
        </div>
        <span className="flex-1" />
        {faltamGerar > 0 && !loading && (
          <Botao variante="principal" onClick={() => void gerar()} disabled={gerando}>
            {rows.length === 0 ? `Gerar cobranças de ${nomeDoMes(mes).split(' ')[0]}` : `Gerar para ${faltamGerar} sem cobrança`}
          </Botao>
        )}
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Numero rotulo="Previsto" valor={moeda(resumo.previsto)} />
        <Numero rotulo="Recebido" valor={moeda(resumo.recebido)} cor="text-green" />
        <Numero rotulo={`Em aberto (${resumo.quantidade.aberta})`} valor={moeda(resumo.aberto)} cor="text-gold" ativo={filtro === 'aberta'} onClick={() => mudar('f', filtro === 'aberta' ? '' : 'aberta')} />
        <Numero rotulo={`Atrasado (${resumo.quantidade.atrasada})`} valor={moeda(resumo.atrasado)} cor="text-red-200" ativo={filtro === 'atrasada'} onClick={() => mudar('f', filtro === 'atrasada' ? '' : 'atrasada')} />
      </div>

      <div className="mb-3 flex items-center gap-2">
        <Selecao className="w-auto py-2" value={filtro} onChange={(e) => mudar('f', e.target.value)} aria-label="Filtro">
          <option value="">Todas ({rows.length})</option>
          <option value="aberta">Em aberto ({resumo.quantidade.aberta})</option>
          <option value="atrasada">Atrasadas ({resumo.quantidade.atrasada})</option>
          <option value="paga">Pagas ({resumo.quantidade.paga})</option>
          <option value="outras">Isentas e canceladas ({resumo.quantidade.isenta + resumo.quantidade.cancelada})</option>
        </Selecao>
      </div>

      {loading ? (
        <p className="py-10 text-center text-gray">Carregando…</p>
      ) : rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line p-8 text-center text-gray">
          {ativos.length === 0 ? 'Sem alunos ativos — as cobranças nascem deles.' : `Nenhuma cobrança em ${nomeDoMes(mes)} ainda. "Gerar cobranças" cria uma para cada aluno ativo, com o valor do plano dele.`}
        </p>
      ) : filtradas.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line p-8 text-center text-gray">Nada com esse filtro.</p>
      ) : (
        filtradas.map((c) => <CobrancaLinha key={c.id} cobranca={c} aluno={porId.get(c.alunoId)} config={config} onPagar={setPagando} />)
      )}

      <PagamentoDialog cobranca={pagando} onFechar={() => setPagando(null)} />
    </>
  )
}

function Numero({ rotulo, valor, cor, ativo, onClick }: { rotulo: string; valor: string; cor?: string; ativo?: boolean; onClick?: () => void }) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag type={onClick ? 'button' : undefined} onClick={onClick} className={cn('rounded-xl border bg-navy-2 p-3 text-left', ativo ? 'border-gold' : 'border-line', onClick && 'hover:border-gray')}>
      <div className={cn('font-anton text-[1.3rem] leading-none', cor ?? 'text-cream')}>{valor}</div>
      <div className="rotulo mt-1 text-[0.65rem]">{rotulo}</div>
    </Tag>
  )
}
