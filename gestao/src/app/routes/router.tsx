import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AuthGate } from '@shared/auth/AuthGate'
import { rotasContas } from '@shared/modules/contas/routes'
import { AppLayout } from '@/app/layout/AppLayout'
import { rotasInicio } from '@/modules/inicio/routes'
import { rotasAlunos } from '@/modules/alunos/routes'
import { rotasTurmas } from '@/modules/turmas/routes'
import { rotasChamada } from '@/modules/chamada/routes'

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      // Entra quem tem Gestor ou Professor (Master passa sempre). Um Editor
      // só do site vê o aviso de "sem acesso" — a porta dele é o painel.
      <AuthGate
        login={{ titulo: 'Gestão', descricao: 'Gestão da escolinha: alunos, turmas, chamada e mensalidades.' }}
        liberado={(a) => a.isProfessor}
        nomeDoApp="ao app de gestão"
      >
        <AppLayout />
      </AuthGate>
    ),
    children: [
      { index: true, element: <Navigate to="/inicio" replace /> },
      ...rotasInicio,
      ...rotasAlunos,
      ...rotasTurmas,
      ...rotasChamada,
      ...rotasContas,
      { path: '*', element: <Navigate to="/inicio" replace /> },
    ],
  },
])
