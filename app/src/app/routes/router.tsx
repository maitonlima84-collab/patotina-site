import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AuthGate } from './AuthGate'
import { AppLayout } from '@/app/layout/AppLayout'
import { rotasSite } from '@/modules/site/routes'
import { rotasContas } from '@/modules/contas/routes'

export const router = createBrowserRouter(
  [
    {
      path: '/',
      element: (
        <AuthGate>
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
