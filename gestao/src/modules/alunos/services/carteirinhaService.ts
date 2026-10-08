import { hojeIso } from '@shared/lib/utils'
import { URL_SITE } from '@shared/lib/enderecos'
import type { Turma } from '@/modules/turmas/types'
import type { Aluno, Carteirinha, CarteirinhaPublica } from '../types'
import { atualizarPublica, gravarEmissao, gravarValidade } from '../repositories/carteirinhasRepository'

// Carteirinha do aluno: a mesma ficha vira cartão no celular da família e
// cartão impresso. O QR leva à página pública do site, que confere se ela
// vale — sem login e sem mostrar nada além do que está no próprio cartão.

// Sem 0/O, 1/I/L: o código também é lido em voz alta ou digitado.
const ALFABETO = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'

// Oito caracteres (~850 bi combinações): a página pública lê por código e
// a regra não deixa listar, então adivinhar um código não é caminho.
export function gerarCodigo() {
  const sorteio = crypto.getRandomValues(new Uint32Array(8))
  return Array.from(sorteio, (n) => ALFABETO[n % ALFABETO.length]).join('')
}

export function urlValidacao(codigo: string) {
  return `${URL_SITE}/carteirinha?c=${codigo}`
}

// Vale até o fim do ano da emissão — a temporada da escolinha é o ano.
export const fimDoAno = (hoje = hojeIso()) => `${hoje.slice(0, 4)}-12-31`

export type EstadoCarteirinha = 'valida' | 'vencida' | 'inativa' | 'substituida'

export const ESTADOS: Record<EstadoCarteirinha, { titulo: string; texto: string }> = {
  valida: { titulo: 'Carteirinha válida', texto: 'Aluno ativo na escolinha.' },
  vencida: { titulo: 'Carteirinha vencida', texto: 'Passou da validade — a escolinha precisa renovar.' },
  inativa: { titulo: 'Aluno inativo', texto: 'A matrícula não está ativa no momento.' },
  substituida: { titulo: 'Carteirinha substituída', texto: 'Esta via foi trocada por uma nova e não vale mais.' },
}

// A mesma conta que a página do site faz (site/carteirinha.html): mudou
// aqui, muda lá.
export function estadoDaCarteirinha(c: Pick<CarteirinhaPublica, 'situacao' | 'alunoSituacao' | 'validade'>, hoje = hojeIso()): EstadoCarteirinha {
  if (c.situacao === 'substituida') return 'substituida'
  if (c.alunoSituacao !== 'ativo') return 'inativa'
  return c.validade < hoje ? 'vencida' : 'valida'
}

// O que o cartão chama de "categoria": o nome da turma (Sub-10, Fut Baby…).
export function faixaDaTurma(turma?: Pick<Turma, 'idadeMin' | 'idadeMax'>) {
  if (!turma || turma.idadeMin == null || turma.idadeMax == null) return ''
  return `${turma.idadeMin} a ${turma.idadeMax} anos`
}

// Nome curto do cartão: primeiro e último nome ("Pedro Henrique Lima" → "Pedro Lima").
export function nomeCurto(nome: string) {
  const partes = nome.trim().split(/\s+/)
  return partes.length > 2 ? `${partes[0]} ${partes[partes.length - 1]}` : nome.trim()
}

// A foto vai para a página pública só com a autorização de imagem da ficha
// (a mesma promessa da política de privacidade do site). O cartão impresso,
// que fica com a família, leva a foto de qualquer jeito.
function dadosPublicos(aluno: Aluno, turmaNome: string): Omit<CarteirinhaPublica, 'matricula' | 'validade' | 'situacao'> {
  const foto = aluno.autorizacoes?.imagem ? (aluno.foto?.url ?? '') : ''
  return { alunoId: aluno.id, nome: aluno.nome, foto, turma: turmaNome, alunoSituacao: aluno.situacao }
}

// Primeira emissão ou segunda via (perda): a matrícula fica, o código muda
// e o QR antigo passa a dizer "substituída".
export async function emitirCarteirinha(aluno: Aluno, turmaNome: string): Promise<Carteirinha> {
  const hoje = hojeIso()
  const antiga = aluno.carteirinha
  for (let tentativa = 0; ; tentativa++) {
    try {
      return await gravarEmissao(
        aluno.id,
        {
          codigo: gerarCodigo(),
          matricula: antiga?.matricula ?? '',
          anoMatricula: (aluno.entrouEm || hoje).slice(0, 4),
          emitidaEm: hoje,
          // A segunda via herda a validade, a não ser que já tenha vencido.
          validade: antiga && antiga.validade >= hoje ? antiga.validade : fimDoAno(hoje),
          codigoAntigo: antiga?.codigo,
        },
        dadosPublicos(aluno, turmaNome),
      )
    } catch (e) {
      if (e instanceof Error && e.message === 'codigo-repetido' && tentativa < 3) continue
      throw e
    }
  }
}

// Renovar = mesmo código, validade até o fim deste ano. O QR não muda e a
// página pública já passa a dizer "válida"; a data impressa no cartão é que
// fica velha, por isso a ficha oferece imprimir de novo.
export async function renovarCarteirinha(aluno: Aluno, turmaNome: string) {
  const c = aluno.carteirinha
  if (!c) return
  const nova: Carteirinha = { ...c, validade: fimDoAno() }
  await gravarValidade(aluno.id, nova, { ...dadosPublicos(aluno, turmaNome), matricula: c.matricula, validade: nova.validade })
}

// A página pública mostra uma cópia do que está na ficha. Sem Cloud
// Functions, quem mantém a cópia em dia é o app: a ficha (aberta pelo
// Gestor) e a impressão comparam e regravam o que mudou — nome, foto, turma,
// situação. Devolve true se precisou gravar. Sem a cópia lida (falha de
// rede) não grava: a emissão é que cria o documento, nunca a sincronização.
export async function sincronizarCarteirinha(aluno: Aluno, turmaNome: string, publica: CarteirinhaPublica | null) {
  const c = aluno.carteirinha
  if (!c || !publica || publica.situacao !== 'ativa') return false
  const esperado = { ...dadosPublicos(aluno, turmaNome), matricula: c.matricula, validade: c.validade }
  const mudou = (Object.keys(esperado) as (keyof typeof esperado)[]).some((k) => publica[k] !== esperado[k])
  if (mudou) await atualizarPublica(c.codigo, esperado)
  return mudou
}
