import { z } from 'zod'
import { dataBr, hojeIso, linkWhatsApp } from '@shared/lib/utils'
import type { Aluno } from '@/modules/alunos/types'
import { responsavelPrincipal } from '@/modules/alunos/services/alunosService'
import type { Configuracoes } from '@/modules/configuracoes/types'
import type { Evento, EventoDados } from '../types'
import { criarEvento, editarEvento } from '../repositories/eventosRepository'

export const esquemaEvento = z.object({
  tipo: z.enum(['jogo', 'festival', 'viagem', 'reuniao', 'sem_treino']),
  titulo: z.string().trim().min(1, 'Dê um nome ao evento.').max(80),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data do evento.'),
  hora: z.string().max(5),
  local: z.string().trim().max(80),
  descricao: z.string().trim().max(500),
  turmaIds: z.array(z.string()),
  visivelNoSite: z.boolean(),
})

export type EventoForm = z.input<typeof esquemaEvento>

export function valoresIniciais(e: Evento | null): EventoForm {
  return {
    tipo: e?.tipo ?? 'jogo',
    titulo: e?.titulo ?? '',
    data: e?.data ?? hojeIso(),
    hora: e?.hora ?? '',
    local: e?.local ?? '',
    descricao: e?.descricao ?? '',
    turmaIds: e?.turmaIds ?? [],
    visivelNoSite: e?.visivelNoSite ?? false,
  }
}

export async function salvarEvento(evento: Evento | null, valores: EventoForm, por: string) {
  const v = esquemaEvento.parse(valores)
  if (evento) {
    await editarEvento(evento.id, v)
    return evento.id
  }
  const dados: EventoDados = { ...v, convocados: [], autorizacoes: {} }
  return criarEvento(dados, por)
}

export async function convocar(evento: Evento, alunoId: string, sim: boolean) {
  const convocados = sim ? [...new Set([...evento.convocados, alunoId])] : evento.convocados.filter((id) => id !== alunoId)
  await editarEvento(evento.id, { convocados })
}

export async function convocarTodos(evento: Evento, alunoIds: string[]) {
  await editarEvento(evento.id, { convocados: [...new Set([...evento.convocados, ...alunoIds])] })
}

export async function marcarAutorizacao(evento: Evento, alunoId: string, sim: boolean) {
  await editarEvento(evento.id, { autorizacoes: { ...evento.autorizacoes, [alunoId]: sim } })
}

function preencher(modelo: string, valores: Record<string, string>) {
  return modelo.replace(/\{(\w+)\}/g, (_, k: string) => valores[k] ?? '')
}

export function textoConvocacao(evento: Evento, aluno: Aluno, config: Configuracoes) {
  const r = responsavelPrincipal(aluno)
  return preencher(config.textos.convocacao, {
    responsavel: r?.nome.split(' ')[0] ?? '',
    aluno: aluno.apelido || aluno.nome,
    evento: evento.titulo,
    data: dataBr(evento.data),
    hora: evento.hora || 'a combinar',
    local: evento.local || 'a combinar',
  })
}

export function linkConvocacao(evento: Evento, aluno: Aluno, config: Configuracoes) {
  const r = responsavelPrincipal(aluno)
  return r?.telefone ? linkWhatsApp(r.telefone, textoConvocacao(evento, aluno, config)) : null
}

export const passado = (e: Evento, hoje = hojeIso()) => e.data < hoje
