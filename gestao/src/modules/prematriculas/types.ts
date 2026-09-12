export type SituacaoPre = 'nova' | 'em_contato' | 'matriculada' | 'recusada'

export const SITUACOES_PRE: Record<SituacaoPre, string> = {
  nova: 'Nova',
  em_contato: 'Em contato',
  matriculada: 'Matriculada',
  recusada: 'Recusada',
}

// O que o formulário do site grava (docs/gestao.md, §2.6).
export interface PreMatricula {
  id: string
  crianca: string
  idade: number
  turmaSugerida: string
  responsavel: string
  telefone: string
  observacao: string
  situacao: SituacaoPre
  alunoId?: string
  origem: 'site'
  criadoEm?: { toDate: () => Date } | Date
}
