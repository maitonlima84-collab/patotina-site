import { hojeIso } from '@shared/lib/utils'
import type { Aluno } from '@/modules/alunos/types'
import type { Turma } from '@/modules/turmas/types'
import type { Chamada, Presenca } from '../types'
import { apagarPresencas, salvarChamada } from '../repositories/chamadaRepository'

// Toque no aluno: presente → falta → justificada → sem marcar → presente.
// Sem marcar (null) é "ainda não chamado" — diferente de falta — e entra no
// ciclo para dar como desfazer um toque errado.
export function proxima(atual: Presenca | undefined): Presenca | null {
  if (atual === 'P') return 'F'
  if (atual === 'F') return 'J'
  if (atual === 'J') return null
  return 'P'
}

interface Quem {
  uid: string
  nome: string
}

export async function marcar(turmaId: string, data: string, alunoId: string, presenca: Presenca | null, por: Quem) {
  if (presenca === null) return apagarPresencas(turmaId, data, [alunoId])
  await salvarChamada(turmaId, data, { presencas: { [alunoId]: presenca }, registradoPor: por.uid, registradoPorNome: por.nome })
}

// Zera a chamada do treino: todo mundo volta a "sem marcar". A observação e
// quem registrou ficam; a tela pede confirmação antes.
export async function limparChamada(turmaId: string, data: string, atual: Chamada | null) {
  const ids = Object.keys(atual?.presencas ?? {})
  if (ids.length === 0) return
  await apagarPresencas(turmaId, data, ids)
}

// Marca todo mundo que ainda não foi marcado como presente — o caso comum é
// a turma inteira vir e só um ou dois faltarem.
export async function marcarTodosPresentes(turmaId: string, data: string, alunos: Aluno[], atual: Chamada | null, por: Quem) {
  const presencas: Record<string, Presenca> = {}
  for (const a of alunos) if (!atual?.presencas?.[a.id]) presencas[a.id] = 'P'
  if (Object.keys(presencas).length === 0) return
  await salvarChamada(turmaId, data, { presencas, registradoPor: por.uid, registradoPorNome: por.nome })
}

export async function anotarChamada(turmaId: string, data: string, observacao: string) {
  await salvarChamada(turmaId, data, { observacao })
}

export interface Frequencia {
  presentes: number
  faltas: number
  justificadas: number
  total: number
  percentual: number | null
  faltasSeguidas: number
}

// Frequência de um aluno num conjunto de chamadas (qualquer turma — ele
// pode ter mudado). Faltas seguidas contam do treino mais recente para trás,
// ignorando treinos em que não foi chamado.
export function frequenciaDoAluno(alunoId: string, chamadas: Chamada[]): Frequencia {
  const marcadas = chamadas.filter((c) => c.presencas?.[alunoId]).sort((a, b) => b.data.localeCompare(a.data))
  const f: Frequencia = { presentes: 0, faltas: 0, justificadas: 0, total: marcadas.length, percentual: null, faltasSeguidas: 0 }
  let contando = true
  for (const c of marcadas) {
    const p = c.presencas[alunoId]
    if (p === 'P') f.presentes++
    if (p === 'F') f.faltas++
    if (p === 'J') f.justificadas++
    if (contando) {
      if (p === 'F') f.faltasSeguidas++
      else contando = false
    }
  }
  if (f.total > 0) f.percentual = Math.round(((f.presentes + f.justificadas) / f.total) * 100)
  return f
}

// Quem está com 3 faltas seguidas ou mais — é a hora de ligar para casa.
export function alunosEmAlerta(alunos: Aluno[], chamadas: Chamada[], minimo = 3) {
  return alunos
    .filter((a) => a.situacao === 'ativo')
    .map((a) => ({ aluno: a, freq: frequenciaDoAluno(a.id, chamadas) }))
    .filter((x) => x.freq.faltasSeguidas >= minimo)
    .sort((a, b) => b.freq.faltasSeguidas - a.freq.faltasSeguidas)
}

// Datas dos treinos de uma turma num intervalo, pelos horários cadastrados —
// para a grade de frequência mostrar o treino que ninguém chamou.
export function datasDeTreino(turma: Turma, de: string, ate: string): string[] {
  const dias = new Set(turma.horarios.map((h) => h.dia))
  const datas: string[] = []
  const d = new Date(`${de}T12:00:00`)
  const fim = new Date(`${ate}T12:00:00`)
  while (d <= fim) {
    if (dias.has(d.getDay())) datas.push(isoLocal(d))
    d.setDate(d.getDate() + 1)
  }
  return datas
}

function isoLocal(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export const primeiroDiaDoMes = (mes = hojeIso().slice(0, 7)) => `${mes}-01`

export function ultimoDiaDoMes(mes = hojeIso().slice(0, 7)) {
  const [a, m] = mes.split('-').map(Number) as [number, number]
  return `${mes}-${String(new Date(a, m, 0).getDate()).padStart(2, '0')}`
}

export function somarMeses(mes: string, n: number) {
  const [a, m] = mes.split('-').map(Number) as [number, number]
  const d = new Date(a, m - 1 + n, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function nomeDoMes(mes: string) {
  const [a, m] = mes.split('-').map(Number) as [number, number]
  return new Date(a, m - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}
