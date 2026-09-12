import { RouterProvider } from 'react-router-dom'
import { AuthProvider } from '@/app/providers/AuthProvider'
import { AppQueryClientProvider } from '@/app/providers/query-client'
import { AvisoProvider } from '@/shared/components/Aviso'
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
