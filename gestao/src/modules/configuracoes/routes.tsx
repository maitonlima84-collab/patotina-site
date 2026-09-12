import type { RouteObject } from 'react-router-dom'
import { RequireRole } from '@shared/auth/RequireRole'
import { AcessoNegado } from '@shared/components/AcessoNegado'
import { ConfiguracoesPage } from './pages/ConfiguracoesPage'

export const rotasConfiguracoes: RouteObject[] = [
  {
    path: 'configuracoes',
    element: (
      <RequireRole anyOf={['Gestor']} fallback={<AcessoNegado />}>
        <ConfiguracoesPage />
      </RequireRole>
    ),
  },
]
