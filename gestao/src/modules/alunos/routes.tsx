import type { RouteObject } from 'react-router-dom'
import { RequireRole } from '@shared/auth/RequireRole'
import { AcessoNegado } from '@shared/components/AcessoNegado'
import { AlunosPage } from './pages/AlunosPage'
import { AlunoPage } from './pages/AlunoPage'
import { MatriculaPage } from './pages/MatriculaPage'
import { EditarAlunoPage } from './pages/EditarAlunoPage'
import { ImportarPage } from './pages/ImportarPage'

const soGestor = (el: React.ReactElement) => (
  <RequireRole anyOf={['Gestor']} fallback={<AcessoNegado />}>
    {el}
  </RequireRole>
)

export const rotasAlunos: RouteObject[] = [
  { path: 'alunos', element: <AlunosPage /> },
  { path: 'alunos/novo', element: soGestor(<MatriculaPage />) },
  { path: 'alunos/importar', element: soGestor(<ImportarPage />) },
  { path: 'alunos/:id', element: <AlunoPage /> },
  { path: 'alunos/:id/editar', element: soGestor(<EditarAlunoPage />) },
]
