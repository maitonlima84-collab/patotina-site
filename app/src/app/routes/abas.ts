// As abas do painel, na ordem em que aparecem. Cada uma é uma rota do módulo
// "site" (conteúdo) ou "contas" (quem entra). O app de gestão da escolinha,
// quando nascer, acrescenta as suas aqui.
export interface Aba {
  caminho: string
  titulo: string
  soMaster?: boolean
}

export const ABAS: Aba[] = [
  { caminho: '/turmas', titulo: 'Turmas' },
  { caminho: '/destaques', titulo: 'Destaques' },
  { caminho: '/titulos', titulo: 'Títulos' },
  { caminho: '/historia', titulo: 'Linha do tempo' },
  { caminho: '/parceiros', titulo: 'Parceiros' },
  { caminho: '/textos', titulo: 'Textos' },
  { caminho: '/contas', titulo: 'Contas', soMaster: true },
]
