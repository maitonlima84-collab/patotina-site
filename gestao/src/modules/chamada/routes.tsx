import type { RouteObject } from 'react-router-dom'
import { ChamadaPage } from './pages/ChamadaPage'
import { FrequenciaPage } from './pages/FrequenciaPage'

export const rotasChamada: RouteObject[] = [
  { path: 'chamada', element: <ChamadaPage /> },
  { path: 'chamada/frequencia', element: <FrequenciaPage /> },
]
