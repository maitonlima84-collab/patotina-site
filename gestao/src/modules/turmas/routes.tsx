import type { RouteObject } from 'react-router-dom'
import { TurmasPage } from './pages/TurmasPage'
import { TurmaPage } from './pages/TurmaPage'

export const rotasTurmas: RouteObject[] = [
  { path: 'turmas', element: <TurmasPage /> },
  { path: 'turmas/:id', element: <TurmaPage /> },
]
