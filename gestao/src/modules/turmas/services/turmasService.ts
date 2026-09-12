import { z } from 'zod'
import { DIAS_CURTOS, hojeIso } from '@shared/lib/utils'
import type { Horario, Turma, TurmaDados } from '../types'
import { criarTurma, editarTurma } from '../repositories/turmasRepository'

const HORA = /^([01]\d|2[0-3]):[0-5]\d$/

export const esquemaHorario = z
  .object({
    dia: z.coerce.number().int().min(0).max(6),
    inicio: z.string().regex(HORA, 'Hora no formato 18:00.'),
    fim: z.string().regex(HORA, 'Hora no formato 18:50.'),
    local: z.string().trim().max(80),
  })
  .refine((h) => h.fim > h.inicio, { message: 'O fim precisa ser depois do início.', path: ['fim'] })

// Números vazios chegam como '' do formulário; viram null no banco.
const numeroOpcional = z.preprocess(
  (v) => (v === '' || v === undefined || v === null ? null : Number(v)),
  z.number().min(0).nullable(),
)

export const esquemaTurma = z.object({
  nome: z.string().trim().min(1, 'Dê um nome à turma.').max(40),
  professorUid: z.string(),
  horarios: z.array(esquemaHorario).min(1, 'Cadastre pelo menos um treino.'),
  capacidade: numeroOpcional,
  idadeMin: numeroOpcional,
  idadeMax: numeroOpcional,
  mensalidade: numeroOpcional,
  temporada: z.string().trim().max(12),
  ativa: z.boolean(),
  cardSiteId: z.string(),
})

export type TurmaForm = z.input<typeof esquemaTurma>

export function valoresIniciais(turma: Turma | null): TurmaForm {
  return {
    nome: turma?.nome ?? '',
    professorUid: turma?.professorUid ?? '',
    horarios: turma?.horarios ?? [{ dia: 1, inicio: '18:00', fim: '19:00', local: '' }],
    capacidade: turma?.capacidade ?? null,
    idadeMin: turma?.idadeMin ?? null,
    idadeMax: turma?.idadeMax ?? null,
    mensalidade: turma?.mensalidade ?? null,
    temporada: turma?.temporada ?? hojeIso().slice(0, 4),
    ativa: turma?.ativa ?? true,
    cardSiteId: turma?.cardSiteId ?? '',
  }
}

export async function salvarTurma(turma: Turma | null, valores: TurmaForm, por: string) {
  const dados = esquemaTurma.parse(valores) as TurmaDados
  if (turma) await editarTurma(turma.id, dados)
  else await criarTurma(dados, por)
}

// "SEG 18:00–18:50 · Campo do Clube"
export function descreverHorario(h: Horario): string {
  return `${DIAS_CURTOS[h.dia]} ${h.inicio}–${h.fim}${h.local ? ` · ${h.local}` : ''}`
}

export function faixaEtaria(t: Pick<Turma, 'idadeMin' | 'idadeMax'>): string {
  if (t.idadeMin != null && t.idadeMax != null) return `${t.idadeMin} a ${t.idadeMax} anos`
  if (t.idadeMin != null) return `${t.idadeMin}+ anos`
  if (t.idadeMax != null) return `até ${t.idadeMax} anos`
  return ''
}

// Turmas que treinam hoje, na ordem do horário — é o que a chamada abre.
export function turmasDoDia(turmas: Turma[], dia = new Date().getDay()): Turma[] {
  return turmas
    .filter((t) => t.ativa && t.horarios.some((h) => h.dia === dia))
    .sort((a, b) => {
      const ha = a.horarios.filter((h) => h.dia === dia).map((h) => h.inicio).sort()[0] ?? ''
      const hb = b.horarios.filter((h) => h.dia === dia).map((h) => h.inicio).sort()[0] ?? ''
      return ha.localeCompare(hb)
    })
}

// Sugere a turma pela idade: a primeira ativa cuja faixa contém a idade.
export function sugerirTurma(turmas: Turma[], idade: number | null): Turma | undefined {
  if (idade == null) return undefined
  return turmas.find((t) => t.ativa && (t.idadeMin == null || idade >= t.idadeMin) && (t.idadeMax == null || idade <= t.idadeMax))
}
