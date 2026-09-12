import type { RouteObject } from 'react-router-dom'
import { RequireRole } from '@shared/auth/RequireRole'
import { AcessoNegado } from '@shared/components/AcessoNegado'
import { ContasPage } from './pages/ContasPage'

export const rotasContas: RouteObject[] = [
  {
    path: 'contas',
    element: (
      <RequireRole anyOf={['Master']} fallback={<AcessoNegado />}>
        <ContasPage />
      </RequireRole>
    ),
  },
]
