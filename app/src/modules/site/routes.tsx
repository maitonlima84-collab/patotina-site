import type { RouteObject } from 'react-router-dom'
import { RequireRole } from '@shared/auth/RequireRole'
import { AcessoNegado } from '@shared/components/AcessoNegado'
import { LISTA_SECOES } from './colecoes'
import { ColecaoPage } from './pages/ColecaoPage'
import { TextosPage } from './pages/TextosPage'

const editor = (el: React.ReactNode) => (
  <RequireRole anyOf={['Editor']} fallback={<AcessoNegado />}>
    {el}
  </RequireRole>
)

export const rotasSite: RouteObject[] = [
  ...LISTA_SECOES.map((secao) => ({ path: secao.id, element: editor(<ColecaoPage secao={secao} />) })),
  { path: 'textos', element: editor(<TextosPage />) },
]
