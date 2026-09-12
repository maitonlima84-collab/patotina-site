// Um documento só: configuracoes/escolinha (docs/gestao.md, §2.9). O que é
// da escolinha inteira mora aqui; o que é de um registro mora nele.
export interface Configuracoes {
  nome: string
  temporada: string
  mensalidadePadrao: number
  vencimentoDia: number
  chavePix: string
  titularPix: string
  locais: string[]
  textos: {
    lembreteMensalidade: string
    convocacao: string
    recibo: string
  }
  proximoRecibo: number
}

export const CONFIG_PADRAO: Configuracoes = {
  nome: 'Escolinha de Futebol Patotina',
  temporada: String(new Date().getFullYear()),
  mensalidadePadrao: 0,
  vencimentoDia: 10,
  chavePix: '',
  titularPix: '',
  locais: ['Campo do Clube'],
  textos: {
    lembreteMensalidade:
      'Olá, {responsavel}! Passando para lembrar da mensalidade de {competencia} do(a) {aluno} na Escolinha Patotina: {valor}, vencimento dia {vencimento}. Pix: {pix}. Qualquer dúvida é só chamar. 💙🤍❤️',
    convocacao: 'Olá, {responsavel}! O(a) {aluno} está convocado(a) para {evento}, dia {data} às {hora}, em {local}. Confirma presença? 💙🤍❤️',
    recibo: 'Recibo nº {numero} — Escolinha Patotina\nRecebemos de {responsavel} o valor de {valor}, referente à mensalidade de {competencia} do(a) aluno(a) {aluno}.\n{data} · {forma}',
  },
  proximoRecibo: 1,
}
