export type Situacao = 'pre_matricula' | 'ativo' | 'trancado' | 'desligado'

export const SITUACOES: Record<Situacao, string> = {
  pre_matricula: 'Pré-matrícula',
  ativo: 'Ativo',
  trancado: 'Trancado',
  desligado: 'Desligado',
}

export interface Responsavel {
  nome: string
  parentesco: string
  telefone: string
  cpf: string
  principal: boolean
  pagador: boolean
}

export interface Aluno {
  id: string
  nome: string
  apelido: string
  nascimento: string // AAAA-MM-DD
  sexo: '' | 'M' | 'F'
  foto: { caminho: string; url: string }
  situacao: Situacao
  turmaId: string
  entrouEm: string
  saiuEm: string
  escola: string
  endereco: { rua: string; numero: string; bairro: string; cidade: string }
  uniforme: { camisa: string; calcao: string }
  responsaveis: Responsavel[]
  saude: {
    alergias: string
    medicamentos: string
    restricoes: string
    plano: string
    emergencia: { nome: string; telefone: string }
  }
  autorizacoes: { imagem: boolean; transporte: boolean; buscam: string }
  plano: { valor: number; vencimentoDia: number; desconto: { valor: number; motivo: string }; isento: boolean; motivoIsencao: string }
  observacoes: string
  // nome + responsáveis, normalizado — a busca da lista é no navegador.
  nomeBusca: string
}

export type AlunoDados = Omit<Aluno, 'id'>

export type TipoHistorico = 'matricula' | 'mudanca_turma' | 'trancamento' | 'retorno' | 'desligamento' | 'observacao'

export const TIPOS_HISTORICO: Record<TipoHistorico, string> = {
  matricula: 'Matrícula',
  mudanca_turma: 'Mudança de turma',
  trancamento: 'Trancamento',
  retorno: 'Retorno',
  desligamento: 'Desligamento',
  observacao: 'Observação',
}

export interface Historico {
  id: string
  tipo: TipoHistorico
  data: string // AAAA-MM-DD
  de: string
  para: string
  texto: string
  por: string
  porNome: string
}
