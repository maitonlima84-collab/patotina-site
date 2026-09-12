import { CalendarDays, ClipboardCheck, Home, Inbox, Layers, Megaphone, Settings, UserRound, Users, Wallet, type LucideIcon } from 'lucide-react'
import type { useAuth } from '@shared/auth/AuthProvider'

// As abas do app, na ordem em que aparecem (docs/gestao.md, §3). No
// computador viram a sidebar, agrupadas; no celular, as marcadas com
// `barra` ficam na barra inferior e o resto vai para "Mais". Cada módulo
// novo acrescenta a sua aqui.
export interface Aba {
  caminho: string
  titulo: string
  icone: LucideIcon
  grupo: 'Escolinha' | 'Administração'
  barra?: boolean
  // Quem vê a aba. A regra do Firestore é a autoridade; aqui só se esconde.
  mostrar?: (auth: ReturnType<typeof useAuth>) => boolean
}

export const ABAS: Aba[] = [
  { caminho: '/inicio', titulo: 'Início', icone: Home, grupo: 'Escolinha', barra: true },
  { caminho: '/alunos', titulo: 'Alunos', icone: UserRound, grupo: 'Escolinha', barra: true },
  { caminho: '/chamada', titulo: 'Chamada', icone: ClipboardCheck, grupo: 'Escolinha', barra: true },
  { caminho: '/mensalidades', titulo: 'Mensalidades', icone: Wallet, grupo: 'Escolinha', barra: true, mostrar: (a) => a.isGestor },
  { caminho: '/turmas', titulo: 'Turmas', icone: Layers, grupo: 'Escolinha' },
  { caminho: '/pre-matriculas', titulo: 'Pré-matrículas', icone: Inbox, grupo: 'Escolinha', mostrar: (a) => a.isGestor },
  { caminho: '/agenda', titulo: 'Agenda', icone: CalendarDays, grupo: 'Escolinha' },
  { caminho: '/avisos', titulo: 'Avisos', icone: Megaphone, grupo: 'Escolinha', mostrar: (a) => a.isGestor },
  { caminho: '/configuracoes', titulo: 'Configurações', icone: Settings, grupo: 'Administração', mostrar: (a) => a.isGestor },
  { caminho: '/contas', titulo: 'Contas', icone: Users, grupo: 'Administração', mostrar: (a) => a.isMaster },
]
