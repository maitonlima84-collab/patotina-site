import type { RouteObject } from 'react-router-dom'
import { AuthGate } from '@shared/auth/AuthGate'
import { FamiliaPage } from './pages/FamiliaPage'

// A área da família tem porta própria: entra quem tem responsaveis/{uid}.
// Quem é da equipe e cai aqui volta para o app de gestão.
export const rotasFamilia: RouteObject[] = [
  {
    path: '/familia',
    element: (
      <AuthGate
        login={{ titulo: 'Família', descricao: 'Área das famílias da escolinha: presença, mensalidades, agenda e avisos.' }}
        liberado={(a) => a.responsavelDoc !== null}
        redirecionar={(a) => (a.responsavelDoc === null && a.isProfessor ? '/inicio' : null)}
        nomeDoApp="à área da família"
      >
        <FamiliaPage />
      </AuthGate>
    ),
  },
]
