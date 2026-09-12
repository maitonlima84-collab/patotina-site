export type Presenca = 'P' | 'F' | 'J'

export const PRESENCAS: Record<Presenca, { nome: string; curto: string }> = {
  P: { nome: 'Presente', curto: 'P' },
  F: { nome: 'Falta', curto: 'F' },
  J: { nome: 'Justificada', curto: 'J' },
}

// Um documento por treino: chamadas/{turmaId}_{AAAA-MM-DD} (docs/gestao.md, §2.4).
export interface Chamada {
  id: string
  turmaId: string
  data: string
  registradoPor: string
  registradoPorNome: string
  observacao: string
  presencas: Record<string, Presenca>
}

export const idChamada = (turmaId: string, data: string) => `${turmaId}_${data}`
