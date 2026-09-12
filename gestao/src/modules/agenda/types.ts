export type TipoEvento = 'jogo' | 'festival' | 'viagem' | 'reuniao' | 'sem_treino'

export const TIPOS_EVENTO: Record<TipoEvento, { nome: string; icone: string }> = {
  jogo: { nome: 'Jogo', icone: '⚽' },
  festival: { nome: 'Festival', icone: '🏆' },
  viagem: { nome: 'Viagem', icone: '🚌' },
  reuniao: { nome: 'Reunião', icone: '👨‍👩‍👧' },
  sem_treino: { nome: 'Sem treino', icone: '⛔' },
}

// eventos/{id} (docs/gestao.md, §2.7). Convocados são ids de alunos;
// autorizacoes marca quem já trouxe a autorização assinada (viagem).
export interface Evento {
  id: string
  tipo: TipoEvento
  titulo: string
  data: string // AAAA-MM-DD
  hora: string
  local: string
  descricao: string
  turmaIds: string[]
  convocados: string[]
  autorizacoes: Record<string, boolean>
  visivelNoSite: boolean
}

export type EventoDados = Omit<Evento, 'id'>
