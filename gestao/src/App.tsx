import { RouterProvider } from 'react-router-dom'
import { AuthProvider } from '@shared/auth/AuthProvider'
import { AppQueryClientProvider } from '@shared/providers/query-client'
import { AvisoProvider } from '@shared/components/Aviso'
import { router } from '@/app/routes/router'

export function App() {
  return (
    <AppQueryClientProvider>
      <AuthProvider>
        <AvisoProvider>
          <RouterProvider router={router} />
        </AvisoProvider>
      </AuthProvider>
    </AppQueryClientProvider>
  )
}
