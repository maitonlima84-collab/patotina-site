import type { RouteObject } from 'react-router-dom'
import { RequireRole } from '@shared/auth/RequireRole'
import { AcessoNegado } from '@shared/components/AcessoNegado'
import { AvisosPage } from './pages/AvisosPage'

export const rotasAvisos: RouteObject[] = [
  {
    path: 'avisos',
    element: (
      <RequireRole anyOf={['Gestor']} fallback={<AcessoNegado />}>
        <AvisosPage />
      </RequireRole>
    ),
  },
]
