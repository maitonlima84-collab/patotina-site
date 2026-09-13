import { z } from 'zod'
import { hojeIso, idadeEm, normalizar } from '@shared/lib/utils'
import type { Aluno, AlunoDados, Situacao } from '../types'
import { criarAluno, editarAluno, movimentarAluno, registrarHistorico } from '../repositories/alunosRepository'

// O formulário trabalha com texto; o banco guarda número. Vazio vira 0.
const numero = z.preprocess((v) => (v === '' || v == null ? 0 : Number(String(v).replace(',', '.'))), z.number().min(0))
const inteiro = (min: number, max: number) => z.preprocess((v) => (v === '' || v == null ? min : Number(v)), z.number().int().min(min).max(max))
const texto = (max: number) => z.string().trim().max(max)
const DATA = /^\d{4}-\d{2}-\d{2}$/

export const esquemaResponsavel = z.object({
  nome: texto(80).min(1, 'Nome do responsável.'),
  parentesco: texto(30),
  telefone: texto(20),
  cpf: texto(14),
  principal: z.boolean(),
  pagador: z.boolean(),
})

export const esquemaAluno = z.object({
  nome: texto(80).min(1, 'Nome da criança.'),
  apelido: texto(30),
  // Vazio é permitido: a importação de planilha nem sempre traz a data.
  nascimento: z.string().regex(DATA, 'Data de nascimento.').or(z.literal('')),
  sexo: z.enum(['', 'M', 'F']),
  foto: z.object({ caminho: z.string(), url: z.string() }),
  turmaId: z.string(),
  escola: texto(80),
  endereco: z.object({ rua: texto(100), numero: texto(10), bairro: texto(60), cidade: texto(60) }),
  uniforme: z.object({ camisa: texto(6), calcao: texto(6) }),
  responsaveis: z.array(esquemaResponsavel).min(1, 'Cadastre pelo menos um responsável.'),
  saude: z.object({
    alergias: texto(300),
    medicamentos: texto(300),
    restricoes: texto(300),
    plano: texto(80),
    emergencia: z.object({ nome: texto(80), telefone: texto(20) }),
  }),
  autorizacoes: z.object({ imagem: z.boolean(), transporte: z.boolean(), buscam: texto(200) }),
  plano: z.object({
    valor: numero,
    vencimentoDia: inteiro(1, 28),
    desconto: z.object({ valor: numero, motivo: texto(120) }),
    isento: z.boolean(),
    motivoIsencao: texto(120),
  }),
  observacoes: texto(1000),
})
  .refine((a) => a.plano.isento || a.plano.desconto.valor === 0 || a.plano.desconto.motivo, {
    message: 'Desconto precisa de motivo (irmão, bolsa, acordo…).',
    path: ['plano', 'desconto', 'motivo'],
  })
  .refine((a) => !a.plano.isento || a.plano.motivoIsencao, {
    message: 'Diga o motivo da isenção.',
    path: ['plano', 'motivoIsencao'],
  })

export type AlunoForm = z.input<typeof esquemaAluno>

// O formulário exige o telefone do contato principal: WhatsApp, lembrete de
// mensalidade e Avisos dependem dele. A importação de planilha não passa por
// aqui — ela aceita a linha sem telefone e avisa, para completar na ficha.
export const esquemaAlunoFormulario = esquemaAluno.superRefine((v, ctx) => {
  const i = Math.max(0, v.responsaveis.findIndex((r) => r.principal))
  const digitos = v.responsaveis[i]?.telefone.replace(/\D/g, '') ?? ''
  if (digitos.length < 10) {
    ctx.addIssue({ code: 'custom', path: ['responsaveis', i, 'telefone'], message: 'Telefone com DDD do contato principal.' })
  }
})

// Os campos de cada passo da matrícula — a validação roda passo a passo.
export const PASSOS: { titulo: string; campos: (keyof AlunoForm)[] }[] = [
  { titulo: 'Criança', campos: ['nome', 'apelido', 'nascimento', 'sexo', 'foto', 'escola', 'endereco', 'uniforme'] },
  { titulo: 'Responsáveis', campos: ['responsaveis'] },
  { titulo: 'Saúde e autorizações', campos: ['saude', 'autorizacoes'] },
  { titulo: 'Turma e mensalidade', campos: ['turmaId', 'plano', 'observacoes'] },
]

export const responsavelVazio = (principal = false) => ({ nome: '', parentesco: '', telefone: '', cpf: '', principal, pagador: principal })

export function valoresIniciais(aluno: Aluno | null, sugestao?: { mensalidade?: number | null; vencimentoDia?: number }): AlunoForm {
  return {
    nome: aluno?.nome ?? '',
    apelido: aluno?.apelido ?? '',
    nascimento: aluno?.nascimento ?? '',
    sexo: aluno?.sexo ?? '',
    foto: aluno?.foto ?? { caminho: '', url: '' },
    turmaId: aluno?.turmaId ?? '',
    escola: aluno?.escola ?? '',
    endereco: aluno?.endereco ?? { rua: '', numero: '', bairro: '', cidade: 'Matutina' },
    uniforme: aluno?.uniforme ?? { camisa: '', calcao: '' },
    responsaveis: aluno?.responsaveis?.length ? aluno.responsaveis : [responsavelVazio(true)],
    saude: aluno?.saude ?? { alergias: '', medicamentos: '', restricoes: '', plano: '', emergencia: { nome: '', telefone: '' } },
    autorizacoes: aluno?.autorizacoes ?? { imagem: true, transporte: false, buscam: '' },
    plano: aluno?.plano ?? {
      valor: sugestao?.mensalidade ?? 0,
      vencimentoDia: sugestao?.vencimentoDia ?? 10,
      desconto: { valor: 0, motivo: '' },
      isento: false,
      motivoIsencao: '',
    },
    observacoes: aluno?.observacoes ?? '',
  }
}

function nomeBusca(a: Pick<AlunoDados, 'nome' | 'apelido' | 'responsaveis'>) {
  return normalizar([a.nome, a.apelido, ...a.responsaveis.map((r) => r.nome)].join(' '))
}

// Garante um principal (e um pagador): se ninguém foi marcado, é o primeiro.
function ajustarResponsaveis(rs: AlunoDados['responsaveis']) {
  if (!rs.some((r) => r.principal)) rs[0]!.principal = true
  if (!rs.some((r) => r.pagador)) rs[0]!.pagador = true
  return rs
}

interface Quem {
  uid: string
  nome: string
}

export async function matricular(valores: AlunoForm, por: Quem, situacao: Situacao = 'ativo') {
  const v = esquemaAluno.parse(valores)
  const hoje = hojeIso()
  const dados: AlunoDados = {
    ...v,
    responsaveis: ajustarResponsaveis(v.responsaveis),
    situacao,
    entrouEm: situacao === 'ativo' ? hoje : '',
    saiuEm: '',
    nomeBusca: nomeBusca(v),
  }
  return criarAluno(dados, {
    tipo: 'matricula',
    data: hoje,
    de: '',
    para: v.turmaId,
    texto: situacao === 'ativo' ? 'Matrícula' : 'Pré-matrícula',
    por: por.uid,
    porNome: por.nome,
  })
}

// Edição da ficha: a turma NÃO muda por aqui (tem movimentação própria, com
// histórico). O que muda é o resto.
export async function salvarFicha(aluno: Aluno, valores: AlunoForm) {
  const v = esquemaAluno.parse(valores)
  const { turmaId: _ignorado, ...resto } = v
  await editarAluno(aluno.id, { ...resto, responsaveis: ajustarResponsaveis(v.responsaveis), nomeBusca: nomeBusca(v) })
}

export async function mudarTurma(aluno: Aluno, turmaId: string, por: Quem, data = hojeIso()) {
  await movimentarAluno(aluno.id, { turmaId }, { tipo: 'mudanca_turma', data, de: aluno.turmaId, para: turmaId, texto: '', por: por.uid, porNome: por.nome })
}

export async function trancar(aluno: Aluno, motivo: string, por: Quem, data = hojeIso()) {
  await movimentarAluno(aluno.id, { situacao: 'trancado' }, { tipo: 'trancamento', data, de: 'ativo', para: 'trancado', texto: motivo, por: por.uid, porNome: por.nome })
}

export async function desligar(aluno: Aluno, motivo: string, por: Quem, data = hojeIso()) {
  await movimentarAluno(
    aluno.id,
    { situacao: 'desligado', saiuEm: data },
    { tipo: 'desligamento', data, de: aluno.situacao, para: 'desligado', texto: motivo, por: por.uid, porNome: por.nome },
  )
}

// Volta de trancamento, desligamento ou pré-matrícula: fica ativo na turma
// escolhida (a antiga pode ter mudado).
export async function reativar(aluno: Aluno, turmaId: string, por: Quem, data = hojeIso()) {
  const dados: Partial<AlunoDados> = { situacao: 'ativo', turmaId, saiuEm: '' }
  if (!aluno.entrouEm) dados.entrouEm = data
  await movimentarAluno(aluno.id, dados, {
    tipo: aluno.situacao === 'pre_matricula' ? 'matricula' : 'retorno',
    data,
    de: aluno.situacao,
    para: 'ativo',
    texto: aluno.situacao === 'pre_matricula' ? 'Matrícula' : '',
    por: por.uid,
    porNome: por.nome,
  })
}

export async function anotar(aluno: Aluno, texto: string, por: Quem, data = hojeIso()) {
  await registrarHistorico(aluno.id, { tipo: 'observacao', data, de: '', para: '', texto, por: por.uid, porNome: por.nome })
}

export function idade(aluno: Pick<Aluno, 'nascimento'>) {
  return idadeEm(aluno.nascimento)
}

export function responsavelPrincipal(aluno: Pick<Aluno, 'responsaveis'>) {
  return aluno.responsaveis.find((r) => r.principal) ?? aluno.responsaveis[0]
}

// Aniversariantes do mês (1..12), ordenados pelo dia.
export function aniversariantes(alunos: Aluno[], mes = new Date().getMonth() + 1) {
  const mm = String(mes).padStart(2, '0')
  return alunos
    .filter((a) => a.situacao === 'ativo' && a.nascimento.slice(5, 7) === mm)
    .sort((a, b) => a.nascimento.slice(8).localeCompare(b.nascimento.slice(8)))
}

export function valorMensal(plano: Aluno['plano']) {
  if (plano.isento) return 0
  return Math.max(0, plano.valor - (plano.desconto?.valor ?? 0))
}
