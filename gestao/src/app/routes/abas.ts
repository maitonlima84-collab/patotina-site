import { Home, Users, type LucideIcon } from 'lucide-react'
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
  { caminho: '/contas', titulo: 'Contas', icone: Users, grupo: 'Administração', mostrar: (a) => a.isMaster },
]
