export interface Horario {
  dia: number // 0 = domingo … 6 = sábado
  inicio: string // 'HH:mm'
  fim: string
  local: string
}

// A turma real, com gente dentro — diferente do card de vitrine em
// site_turmas (docs/gestao.md, §2.3).
export interface Turma {
  id: string
  nome: string
  professorUid: string
  horarios: Horario[]
  capacidade: number | null
  idadeMin: number | null
  idadeMax: number | null
  mensalidade: number | null
  temporada: string
  ativa: boolean
  cardSiteId: string
}

export type TurmaDados = Omit<Turma, 'id'>
