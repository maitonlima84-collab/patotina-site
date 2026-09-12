import { MessageCircle, MoreHorizontal, Receipt } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAviso } from '@shared/components/Aviso'
import { Botao, BotaoMini } from '@shared/components/ui/Botao'
import { Janela } from '@shared/components/ui/Janela'
import { mensagemDeErro } from '@shared/lib/erros'
import { cn, dataBr, moeda } from '@shared/lib/utils'
import type { Aluno } from '@/modules/alunos/types'
import type { Configuracoes } from '@/modules/configuracoes/types'
import { nomeDoMes } from '@/modules/chamada/services/chamadaService'
import { FORMAS, SITUACOES_COBRANCA, valorDevido, type Cobranca } from '../types'
import { atrasada, cancelar, isentar, linkLembrete, linkRecibo, reabrir, textoRecibo } from '../services/mensalidadesService'

// Uma cobrança na lista: quem, quanto, quando, situação — e as ações.
export function CobrancaLinha({
  cobranca: c,
  aluno,
  config,
  mostrarMes,
  onPagar,
}: {
  cobranca: Cobranca
  aluno: Aluno | undefined
  config: Configuracoes
  mostrarMes?: boolean
  onPagar: (c: Cobranca) => void
}) {
  const avisar = useAviso()
  const [menu, setMenu] = useState(false)
  const [recibo, setRecibo] = useState(false)
  const venceu = atrasada(c)
  const lembrete = c.situacao === 'aberta' ? linkLembrete(c, aluno, config) : null

  async function agir(acao: () => Promise<void>, ok: string) {
    try {
      await acao()
      avisar(ok)
      setMenu(false)
    } catch (e) {
      avisar(mensagemDeErro(e), true)
    }
  }

  const selo =
    c.situacao === 'paga'
      ? 'bg-green/20 text-green'
      : c.situacao === 'aberta'
        ? venceu
          ? 'bg-red-2/25 text-red-200'
          : 'bg-gold/20 text-gold'
        : 'bg-gray/20 text-gray'

  return (
    <div className={cn('mb-2 flex flex-wrap items-center gap-3 rounded-[14px] border border-line bg-navy-2 p-3', c.situacao === 'cancelada' && 'opacity-50')}>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 font-cond text-[1.05rem] font-bold tracking-wide">
          <Link to={`/alunos/${c.alunoId}?aba=financeiro`} className="truncate hover:text-gold">
            {aluno?.apelido || c.alunoNome}
          </Link>
          <span className={cn('cond-maiusc rounded-full px-2 py-0.5 text-[0.62rem]', selo)}>{venceu ? 'Atrasada' : SITUACOES_COBRANCA[c.situacao]}</span>
        </div>
        <div className="text-[0.85rem] text-gray">
          {mostrarMes && `${nomeDoMes(c.competencia)} · `}
          {c.situacao === 'paga' && c.pagamento
            ? `${moeda(c.pagamento.valor)} em ${dataBr(c.pagamento.em)} · ${FORMAS[c.pagamento.forma]} · recibo ${c.pagamento.recibo}`
            : `${moeda(valorDevido(c))}${c.desconto ? ` (${moeda(c.valor)} − ${moeda(c.desconto)})` : ''} · vence ${dataBr(c.vencimento)}`}
          {c.observacao && ` · ${c.observacao}`}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        {c.situacao === 'aberta' && (
          <Botao variante="principal" className="px-3.5 py-2 text-[0.75rem]" onClick={() => onPagar(c)}>
            Pagar
          </Botao>
        )}
        {lembrete && (
          <a href={lembrete} target="_blank" rel="noopener" className="grid h-9 w-9 place-items-center rounded-lg border border-line text-green hover:border-green" title="Lembrete no WhatsApp">
            <MessageCircle size={16} />
          </a>
        )}
        {c.situacao === 'paga' && (
          <BotaoMini title="Recibo" aria-label="Recibo" onClick={() => setRecibo(true)}>
            <Receipt size={16} />
          </BotaoMini>
        )}
        <BotaoMini title="Mais" aria-label="Mais" onClick={() => setMenu(true)}>
          <MoreHorizontal size={16} />
        </BotaoMini>
      </div>

      <Janela aberta={menu} titulo={`${c.alunoNome} · ${nomeDoMes(c.competencia)}`} onFechar={() => setMenu(false)}>
        <div className="mt-4 flex flex-col gap-2">
          {c.situacao === 'aberta' && (
            <>
              <Botao onClick={() => void agir(() => isentar(c, prompt('Motivo da isenção deste mês:') ?? ''), 'Isentada.')}>Isentar este mês</Botao>
              <Botao variante="perigo" onClick={() => void agir(() => cancelar(c, prompt('Motivo do cancelamento:') ?? ''), 'Cancelada.')}>
                Cancelar cobrança
              </Botao>
            </>
          )}
          {c.situacao !== 'aberta' && (
            <Botao onClick={() => confirm('Voltar esta cobrança para "em aberto"?') && void agir(() => reabrir(c), 'Reaberta.')}>
              Reabrir {c.situacao === 'paga' ? '(desfaz o pagamento)' : ''}
            </Botao>
          )}
        </div>
      </Janela>

      <Janela aberta={recibo} titulo={`Recibo nº ${c.pagamento?.recibo ?? ''}`} onFechar={() => setRecibo(false)}>
        <pre className="mt-4 rounded-xl border border-line bg-navy p-4 font-sans text-[0.95rem] whitespace-pre-wrap">{textoRecibo(c, aluno, config)}</pre>
        <div className="mt-3 flex gap-2">
          <Botao onClick={() => void navigator.clipboard?.writeText(textoRecibo(c, aluno, config)).then(() => avisar('Copiado.'))}>Copiar</Botao>
          {linkRecibo(c, aluno, config) && (
            <a href={linkRecibo(c, aluno, config)!} target="_blank" rel="noopener" className="cond-maiusc inline-flex items-center gap-2 rounded-full border border-green px-5 py-2.5 text-[0.85rem] text-green">
              <MessageCircle size={16} /> Enviar no WhatsApp
            </a>
          )}
        </div>
      </Janela>
    </div>
  )
}
