// O que o site público mostra, coleção a coleção. Todo item tem `visivel`
// (0 = guardado no painel, fora do site) e as listas ordenáveis têm `ordem`.

export interface ItemBase {
  id: string
  visivel: boolean
}

export interface Turma extends ItemBase {
  nome: string
  faixa: string // como aparece no card: "4 a 6", "10+"
  idadeMin: number // usados pelo formulário de pré-matrícula para sugerir a turma
  idadeMax: number
  descricao: string
  horarios: string // uma linha por treino: DIA | HORÁRIO | LOCAL
  mensagem: string // o que abre no WhatsApp ao tocar em "Quero essa turma"
  destaque: boolean
  ordem: number
}

export interface Destaque extends ItemBase {
  titulo: string
  texto: string
  citacao: string // frase em destaque; só aparece no card grande
  link: string
  publicadoEm: string // YYYY-MM-DD
  principal: boolean // 1 = card grande vermelho
}

export interface Titulo extends ItemBase {
  ano: string
  nome: string
  descricao: string
  icone: string
  destaque: boolean // card dourado
  ordem: number
}

export interface Historia extends ItemBase {
  ano: string
  titulo: string
  texto: string
  link: string
  linkTexto: string
  destaque: boolean
  ordem: number
}

export interface Parceiro extends ItemBase {
  nome: string // "SICOOB |CREDITIROS": o que vem depois do | fica na linha de baixo
  rotulo: string
  master: boolean
  logo: string // caminho no Storage (site/parceiros/<uuid>.webp); vazio = só o nome
  logoUrl: string // URL pública do logo, guardada para o site não precisar do SDK do Storage
  site: string
  ordem: number
}

// Frases e números soltos das seções, num único documento (site_config/textos).
export interface Textos {
  whatsapp: string
  anosEscolinha: string
  heroEyebrow: string
  heroTag: string
  heroChips: string
  turmasTag: string
  turmasTitulo: string
  turmasSub: string
  turmasNota: string
  destaquesTag: string
  destaquesTitulo: string
  titulosTag: string
  titulosTitulo: string
  professorNome: string
  professorDesc: string
  professorInstagram: string
  parceirosTag: string
  parceirosTitulo: string
}

export type ItemDoSite = Turma | Destaque | Titulo | Historia | Parceiro
