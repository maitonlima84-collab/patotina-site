import type { RouteObject } from 'react-router-dom'
import { RequireRole } from '@shared/auth/RequireRole'
import { AcessoNegado } from '@shared/components/AcessoNegado'
import { PreMatriculasPage } from './pages/PreMatriculasPage'

export const rotasPreMatriculas: RouteObject[] = [
  {
    path: 'pre-matriculas',
    element: (
      <RequireRole anyOf={['Gestor']} fallback={<AcessoNegado />}>
        <PreMatriculasPage />
      </RequireRole>
    ),
  },
]
