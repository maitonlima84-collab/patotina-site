import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AuthGate } from '@shared/auth/AuthGate'
import { ErroDaTela } from '@shared/components/ErroDaTela'
import { rotasContas } from '@shared/modules/contas/routes'
import { AppLayout } from '@/app/layout/AppLayout'
import { rotasInicio } from '@/modules/inicio/routes'
import { rotasAlunos } from '@/modules/alunos/routes'
import { rotasTurmas } from '@/modules/turmas/routes'
import { rotasChamada } from '@/modules/chamada/routes'
import { rotasMensalidades } from '@/modules/mensalidades/routes'
import { rotasConfiguracoes } from '@/modules/configuracoes/routes'
import { rotasPreMatriculas } from '@/modules/prematriculas/routes'
import { rotasAgenda } from '@/modules/agenda/routes'
import { rotasAvisos } from '@/modules/avisos/routes'
import { rotasFamilia } from '@/modules/familia/routes'

export const router = createBrowserRouter([
  ...rotasFamilia,
  {
    path: '/',
    errorElement: <ErroDaTela />,
    element: (
      // Entra quem tem Gestor ou Professor (Master passa sempre). Um Editor
      // só do site vê o aviso de "sem acesso" — a porta dele é o painel.
      <AuthGate
        login={{ titulo: 'Gestão', descricao: 'Gestão da escolinha: alunos, turmas, chamada e mensalidades.' }}
        liberado={(a) => a.isProfessor}
        // Conta só de família entra pela porta dela.
        redirecionar={(a) => (!a.isProfessor && a.responsavelDoc ? '/familia' : null)}
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
      ...rotasMensalidades,
      ...rotasConfiguracoes,
      ...rotasPreMatriculas,
      ...rotasAgenda,
      ...rotasAvisos,
      ...rotasContas,
      { path: '*', element: <Navigate to="/inicio" replace /> },
    ],
  },
])
