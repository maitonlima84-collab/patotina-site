import { dataBr, hojeIso, linkWhatsApp, moeda } from '@shared/lib/utils'
import type { Aluno } from '@/modules/alunos/types'
import { responsavelPrincipal } from '@/modules/alunos/services/alunosService'
import type { Configuracoes } from '@/modules/configuracoes/types'
import { nomeDoMes } from '@/modules/chamada/services/chamadaService'
import { valorDevido, type Cobranca, type FormaPagamento } from '../types'
import { atualizarCobranca, gerarCobrancas, registrarPagamento } from '../repositories/cobrancasRepository'

interface Quem {
  uid: string
  nome: string
}

// Uma cobrança por aluno ativo, a partir do plano dele. Isento entra já como
// isenta — assim o mês fecha com todo mundo listado, e a razão está no
// plano do aluno.
export function montarCobrancas(alunos: Aluno[], competencia: string, config: Configuracoes): Omit<Cobranca, 'id'>[] {
  return alunos
    .filter((a) => a.situacao === 'ativo')
    .map((a) => {
      const plano = a.plano ?? { valor: config.mensalidadePadrao, vencimentoDia: config.vencimentoDia, desconto: { valor: 0, motivo: '' }, isento: false, motivoIsencao: '' }
      const dia = String(plano.vencimentoDia || config.vencimentoDia).padStart(2, '0')
      return {
        alunoId: a.id,
        alunoNome: a.nome,
        competencia,
        valor: plano.isento ? 0 : plano.valor,
        desconto: plano.isento ? 0 : (plano.desconto?.valor ?? 0),
        vencimento: `${competencia}-${dia}`,
        situacao: plano.isento ? 'isenta' : 'aberta',
        pagamento: null,
        observacao: plano.isento ? plano.motivoIsencao : plano.desconto?.valor ? plano.desconto.motivo : '',
      } as Omit<Cobranca, 'id'>
    })
}

export async function gerarMes(alunos: Aluno[], competencia: string, config: Configuracoes, por: Quem) {
  const novas = montarCobrancas(alunos, competencia, config)
  if (novas.length === 0) return 0
  return gerarCobrancas(novas, por.uid)
}

export async function pagar(c: Cobranca, dados: { em: string; forma: FormaPagamento; valor: number }, por: Quem) {
  return registrarPagamento(c.id, { ...dados, por: por.uid, porNome: por.nome })
}

export const isentar = (c: Cobranca, motivo: string) => atualizarCobranca(c.id, { situacao: 'isenta', observacao: motivo })
export const cancelar = (c: Cobranca, motivo: string) => atualizarCobranca(c.id, { situacao: 'cancelada', observacao: motivo })
// Desfaz pagamento, isenção ou cancelamento: volta a aberta. O recibo já
// emitido fica registrado na observação para não sumir número.
export const reabrir = (c: Cobranca) =>
  atualizarCobranca(c.id, {
    situacao: 'aberta',
    pagamento: null,
    observacao: c.pagamento ? `Recibo ${c.pagamento.recibo} cancelado (pagamento desfeito).` : c.observacao,
  })

export const atrasada = (c: Cobranca, hoje = hojeIso()) => c.situacao === 'aberta' && c.vencimento < hoje

export interface ResumoMes {
  previsto: number
  recebido: number
  aberto: number
  atrasado: number
  isento: number
  quantidade: Record<'aberta' | 'paga' | 'isenta' | 'cancelada' | 'atrasada', number>
}

export function resumir(cobrancas: Cobranca[], hoje = hojeIso()): ResumoMes {
  const r: ResumoMes = { previsto: 0, recebido: 0, aberto: 0, atrasado: 0, isento: 0, quantidade: { aberta: 0, paga: 0, isenta: 0, cancelada: 0, atrasada: 0 } }
  for (const c of cobrancas) {
    r.quantidade[c.situacao]++
    if (c.situacao === 'cancelada') continue
    const devido = valorDevido(c)
    if (c.situacao === 'isenta') {
      r.isento++
      continue
    }
    r.previsto += devido
    if (c.situacao === 'paga') r.recebido += c.pagamento?.valor ?? devido
    if (c.situacao === 'aberta') {
      r.aberto += devido
      if (atrasada(c, hoje)) {
        r.atrasado += devido
        r.quantidade.atrasada++
      }
    }
  }
  return r
}

// Inadimplência: por aluno, o que está aberto e vencido.
export function devedores(abertas: Cobranca[], alunos: Map<string, Aluno>, hoje = hojeIso()) {
  const porAluno = new Map<string, { aluno: Aluno | undefined; nome: string; cobrancas: Cobranca[]; total: number }>()
  for (const c of abertas) {
    if (!atrasada(c, hoje)) continue
    const g = porAluno.get(c.alunoId) ?? { aluno: alunos.get(c.alunoId), nome: c.alunoNome, cobrancas: [], total: 0 }
    g.cobrancas.push(c)
    g.total += valorDevido(c)
    porAluno.set(c.alunoId, g)
  }
  return [...porAluno.values()]
    .map((g) => ({ ...g, cobrancas: g.cobrancas.sort((a, b) => a.competencia.localeCompare(b.competencia)) }))
    .sort((a, b) => b.cobrancas.length - a.cobrancas.length || b.total - a.total)
}

function preencher(modelo: string, valores: Record<string, string>) {
  return modelo.replace(/\{(\w+)\}/g, (_, k: string) => valores[k] ?? '')
}

// O lembrete pronto para o WhatsApp do responsável pagador.
export function linkLembrete(c: Cobranca, aluno: Aluno | undefined, config: Configuracoes) {
  const r = aluno ? (aluno.responsaveis.find((x) => x.pagador) ?? responsavelPrincipal(aluno)) : undefined
  if (!r?.telefone) return null
  const texto = preencher(config.textos.lembreteMensalidade, {
    responsavel: r.nome.split(' ')[0] ?? '',
    aluno: aluno?.apelido || c.alunoNome,
    competencia: nomeDoMes(c.competencia),
    valor: moeda(valorDevido(c)),
    vencimento: dataBr(c.vencimento),
    pix: config.chavePix || '(chave Pix não cadastrada)',
  })
  return linkWhatsApp(r.telefone, texto)
}

export function textoRecibo(c: Cobranca, aluno: Aluno | undefined, config: Configuracoes) {
  if (!c.pagamento) return ''
  const r = aluno ? (aluno.responsaveis.find((x) => x.pagador) ?? responsavelPrincipal(aluno)) : undefined
  return preencher(config.textos.recibo, {
    numero: String(c.pagamento.recibo),
    responsavel: r?.nome ?? '',
    valor: moeda(c.pagamento.valor),
    competencia: nomeDoMes(c.competencia),
    aluno: c.alunoNome,
    data: dataBr(c.pagamento.em),
    forma: { pix: 'Pix', dinheiro: 'dinheiro', transferencia: 'transferência' }[c.pagamento.forma],
  })
}

export function linkRecibo(c: Cobranca, aluno: Aluno | undefined, config: Configuracoes) {
  const r = aluno ? (aluno.responsaveis.find((x) => x.pagador) ?? responsavelPrincipal(aluno)) : undefined
  if (!r?.telefone) return null
  return linkWhatsApp(r.telefone, textoRecibo(c, aluno, config))
}
