import type { ReactNode } from 'react'
import { useAuth, type Papel } from '@/app/providers/AuthProvider'

// Guarda de rota por papel. Master passa sempre.
export function RequireRole({ anyOf, fallback = null, children }: { anyOf: Papel[]; fallback?: ReactNode; children: ReactNode }) {
  const { temPapel, isMaster } = useAuth()
  const liberado = isMaster || anyOf.some((p) => temPapel(p))
  return liberado ? children : fallback
}
