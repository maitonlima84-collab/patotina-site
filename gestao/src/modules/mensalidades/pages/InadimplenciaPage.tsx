import { ArrowLeft, MessageCircle } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '@shared/components/PageHeader'
import { moeda, telefoneBonito } from '@shared/lib/utils'
import { Avatar } from '@/modules/alunos/components/AlunoLinha'
import { useAlunos } from '@/modules/alunos/hooks/useAlunos'
import { responsavelPrincipal } from '@/modules/alunos/services/alunosService'
import { useConfiguracoes } from '@/modules/configuracoes/hooks/useConfiguracoes'
import { nomeDoMes } from '@/modules/chamada/services/chamadaService'
import type { Cobranca } from '../types'
import { useCobrancasAbertas } from '../hooks/useCobrancas'
import { devedores, linkLembrete } from '../services/mensalidadesService'
import { PagamentoDialog } from '../components/PagamentoDialog'

// Quem deve, quanto e há quantos meses — com o WhatsApp pronto. A lista
// vem de todas as cobranças abertas, de qualquer mês.
export function InadimplenciaPage() {
  const { porId } = useAlunos()
  const { config } = useConfiguracoes()
  const { rows: abertas, loading } = useCobrancasAbertas()
  const [pagando, setPagando] = useState<Cobranca | null>(null)
  const lista = useMemo(() => devedores(abertas, porId), [abertas, porId])
  const total = lista.reduce((s, d) => s + d.total, 0)

  return (
    <>
      <Link to="/mensalidades" className="mb-3 inline-flex items-center gap-1 text-[0.85rem] text-gray hover:text-gold">
        <ArrowLeft size={16} /> Mensalidades
      </Link>
      <PageHeader titulo="Inadimplência" ajuda={loading ? undefined : `${lista.length} família(s) · ${moeda(total)} vencidos`} />

      {loading ? (
        <p className="py-10 text-center text-gray">Carregando…</p>
      ) : lista.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line p-8 text-center text-gray">Ninguém com mensalidade vencida. 💙</p>
      ) : (
        lista.map((d) => {
          const aluno = d.aluno
          const r = aluno ? (aluno.responsaveis.find((x) => x.pagador) ?? responsavelPrincipal(aluno)) : undefined
          const maisAntiga = d.cobrancas[0]!
          const lembrete = linkLembrete(maisAntiga, aluno, config)
          return (
            <div key={maisAntiga.alunoId} className="mb-3 rounded-[14px] border border-line bg-navy-2 p-3">
              <div className="flex items-center gap-3">
                {aluno && <Avatar aluno={aluno} tamanho="h-11 w-11" />}
                <div className="min-w-0 flex-1">
                  <Link to={`/alunos/${maisAntiga.alunoId}?aba=financeiro`} className="font-cond text-[1.1rem] font-bold tracking-wide hover:text-gold">
                    {aluno?.apelido || d.nome}
                  </Link>
                  <div className="text-[0.85rem] text-gray">
                    {r && `${r.nome} ${telefoneBonito(r.telefone)} · `}
                    <b className="text-red-200">{moeda(d.total)}</b> · {d.cobrancas.length} mês(es)
                  </div>
                </div>
                {lembrete && (
                  <a href={lembrete} target="_blank" rel="noopener" className="cond-maiusc inline-flex items-center gap-2 rounded-full border border-green px-4 py-2 text-[0.75rem] text-green hover:bg-green/10">
                    <MessageCircle size={15} /> Lembrar
                  </a>
                )}
              </div>
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {d.cobrancas.map((c) => (
                  <li key={c.id}>
                    <button type="button" onClick={() => setPagando(c)} className="rounded-full border border-red-2/50 bg-red-2/15 px-2.5 py-1 text-[0.78rem] text-red-200 hover:border-red-2" title="Registrar pagamento">
                      {nomeDoMes(c.competencia).split(' ')[0]} · {moeda(c.valor - c.desconto)}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )
        })
      )}

      <PagamentoDialog cobranca={pagando} onFechar={() => setPagando(null)} />
    </>
  )
}
