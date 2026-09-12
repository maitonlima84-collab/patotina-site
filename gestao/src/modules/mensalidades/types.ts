export type SituacaoCobranca = 'aberta' | 'paga' | 'isenta' | 'cancelada'

export const SITUACOES_COBRANCA: Record<SituacaoCobranca, string> = {
  aberta: 'Em aberto',
  paga: 'Paga',
  isenta: 'Isenta',
  cancelada: 'Cancelada',
}

export type FormaPagamento = 'pix' | 'dinheiro' | 'transferencia'

export const FORMAS: Record<FormaPagamento, string> = {
  pix: 'Pix',
  dinheiro: 'Dinheiro',
  transferencia: 'Transferência',
}

// cobrancas/{alunoId}_{AAAA-MM} (docs/gestao.md, §2.5). "Atrasada" não se
// grava: é aberta com vencimento passado, calculada na hora.
export interface Cobranca {
  id: string
  alunoId: string
  alunoNome: string
  competencia: string // AAAA-MM
  valor: number // valor cheio do plano na geração
  desconto: number
  vencimento: string // AAAA-MM-DD
  situacao: SituacaoCobranca
  pagamento: {
    em: string // AAAA-MM-DD
    forma: FormaPagamento
    valor: number
    recibo: number
    por: string
    porNome: string
  } | null
  observacao: string
}

export const idCobranca = (alunoId: string, competencia: string) => `${alunoId}_${competencia}`

export const valorDevido = (c: Pick<Cobranca, 'valor' | 'desconto'>) => Math.max(0, c.valor - c.desconto)
