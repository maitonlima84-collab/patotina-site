import type { RouteObject } from 'react-router-dom'
import { RequireRole } from '@shared/auth/RequireRole'
import { AcessoNegado } from '@shared/components/AcessoNegado'
import { AlunosPage } from './pages/AlunosPage'
import { AlunoPage } from './pages/AlunoPage'
import { MatriculaPage } from './pages/MatriculaPage'
import { EditarAlunoPage } from './pages/EditarAlunoPage'
import { ImportarPage } from './pages/ImportarPage'
import { ImprimirCarteirinhasPage } from './pages/ImprimirCarteirinhasPage'
import { AuthGate } from '@shared/auth/AuthGate'
import { ErroDaTela } from '@shared/components/ErroDaTela'

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

// A impressão fica fora do layout do app (sem menu, sem barra): a página é
// a folha. Porta própria, só do Gestor.
export const rotasImpressaoAlunos: RouteObject[] = [
  {
    path: '/imprimir/carteirinhas',
    errorElement: <ErroDaTela />,
    element: (
      <AuthGate login={{ titulo: 'Gestão', descricao: 'Impressão das carteirinhas dos alunos.' }} liberado={(a) => a.isGestor} nomeDoApp="na impressão de carteirinhas">
        <ImprimirCarteirinhasPage />
      </AuthGate>
    ),
  },
]
