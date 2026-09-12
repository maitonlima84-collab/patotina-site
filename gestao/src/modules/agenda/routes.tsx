import type { RouteObject } from 'react-router-dom'
import { AgendaPage } from './pages/AgendaPage'
import { EventoPage } from './pages/EventoPage'

export const rotasAgenda: RouteObject[] = [
  { path: 'agenda', element: <AgendaPage /> },
  { path: 'agenda/:id', element: <EventoPage /> },
]
