import type { RouteObject } from 'react-router-dom'
import { RequireRole } from '@shared/auth/RequireRole'
import { AcessoNegado } from '@shared/components/AcessoNegado'
import { MensalidadesPage } from './pages/MensalidadesPage'
import { InadimplenciaPage } from './pages/InadimplenciaPage'

const soGestor = (el: React.ReactElement) => (
  <RequireRole anyOf={['Gestor']} fallback={<AcessoNegado />}>
    {el}
  </RequireRole>
)

export const rotasMensalidades: RouteObject[] = [
  { path: 'mensalidades', element: soGestor(<MensalidadesPage />) },
  { path: 'mensalidades/inadimplencia', element: soGestor(<InadimplenciaPage />) },
]
