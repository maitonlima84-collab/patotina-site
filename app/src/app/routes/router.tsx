import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AuthGate } from '@shared/auth/AuthGate'
import { ErroDaTela } from '@shared/components/ErroDaTela'
import { URL_GESTAO } from '@shared/lib/enderecos'
import { AppLayout } from '@/app/layout/AppLayout'
import { rotasSite } from '@/modules/site/routes'
import { rotasContas } from '@shared/modules/contas/routes'

export const router = createBrowserRouter(
  [
    {
      path: '/',
      errorElement: <ErroDaTela />,
      element: (
        // Só quem edita o site entra aqui (Editor, ou Master). Um Gestor ou
        // Professor sem Editor é mandado para a porta dele, o app de gestão —
        // as regras do Firestore barrariam a gravação aqui mesmo.
        <AuthGate
          login={{ titulo: 'Painel', descricao: 'Área do site da escolinha. Use o e-mail e a senha que você recebeu.' }}
          liberado={(a) => a.isEditor}
          outraPorta={(a) => (a.isProfessor ? { url: URL_GESTAO, nome: 'app de gestão' } : null)}
          nomeDoApp="no painel do site"
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
  // O painel vive em /painel/ no endereço da gestão (shared/lib/enderecos.ts).
  { basename: '/painel' },
)
