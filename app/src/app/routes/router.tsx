import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AuthGate } from '@shared/auth/AuthGate'
import { AppLayout } from '@/app/layout/AppLayout'
import { rotasSite } from '@/modules/site/routes'
import { rotasContas } from '@shared/modules/contas/routes'

export const router = createBrowserRouter(
  [
    {
      path: '/',
      element: (
        // Só quem edita o site entra aqui (Editor, ou Master). Um Gestor ou
        // Professor sem Editor vê o aviso de "sem acesso" — a porta dele é o
        // app de gestão, e as regras do Firestore barrariam a gravação mesmo.
        <AuthGate
          login={{ titulo: 'Painel', descricao: 'Área do site da escolinha. Use o e-mail e a senha que você recebeu.' }}
          liberado={(a) => a.isEditor}
          nomeDoApp="ao painel do site"
        >
          <AppLayout />
        </AuthGate>
      ),
      children: [
        { index: true, element: <Navigate to="/turmas" replace /> },
        ...rotasSite,
        ...rotasContas,
        { path: '*', element: <Navigate to="/turmas" replace /> },
      ],
    },
  ],
  // O painel vive em /app/ dentro do mesmo Hosting do site.
  { basename: '/app' },
)
